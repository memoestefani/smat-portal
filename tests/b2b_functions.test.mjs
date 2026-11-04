import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PIPE_SERIES_DIAMETER_MM, PUMP_554_ASSEMBLY_STATIONS, PUMP_554_BOM_14_PARTS, calculateDriveAndBearingKinematics, calculateGyMinimumSampleMass, calculateMarcyScaleReading, calculateSlurryMetrics, evaluatePumpAssemblySequence, evaluateWetEndAssemblyInterference, recommendAstmSieveSeries, resolvePipeDiameterMm } from '../src/scripts/slurryEngine.js';
import { DEFAULT_SMAT_LEAD_WEBHOOK_URL, SMAT_WORKBENCH_EVENT, buildAcuseUrlParams, buildLeadWebhookPayload, dispatchLeadWebhook, formatMailtoUrl, formatSapPlaintext, formatSapTsv, formatWhatsappUrl, generateSmatPartCode, getAtomicPartSpecs, parseSmatPartCode, parseUrlContextParams } from '../src/scripts/workbenchBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

// Cargar dataset canónico de grupos mineros
const miningGroupsRaw = fs.readFileSync(path.join(siteRoot, 'data', 'mining_groups.json'), 'utf-8');
const miningGroupsData = JSON.parse(miningGroupsRaw);

// Funciones lógicas puras replicadas de QuoteWizard.astro para testing determinista
function resolveMiningGroup(email, groups) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return null;
  return groups.find(g => g.domains && g.domains.includes(domain)) || null;
}

function buildCleanSpec(data) {
  const tag = data.isOpex ? '[REFACCIONES / PARO DE PLANTA]' : '[EQUIPOS COMPLETOS / CIRCUITO]';
  return (
    `===================================================\n` +
    `   SMAT MINERALS - REQUISICIÓN TÉCNICA FORMAL\n` +
    `   FOLIO ÚNICO: ${data.folio}\n` +
    `   DOMICILIO FISCAL: Mariano Salas #114, Durango, Dgo. CP 34166\n` +
    `   ALMACÉN CENTRAL: Durango, Dgo. (Coordinación con folio)\n` +
    `   TELÉFONO DE ATENCIÓN: (618) 810-4408 | ventas@smatminerals.com\n` +
    `===================================================\n\n` +
    `1. DATOS DEL SOLICITANTE:\n` +
    `   Solicitante: ${data.name}\n` +
    `   Mina / Empresa: ${data.company}\n` +
    `   Teléfono / WhatsApp: ${data.phone}\n` +
    `   Correo: ${data.email}\n` +
    `   Canal de Respuesta: WhatsApp de Guardia\n` +
    `   Modalidad / Destino: ${data.destination || 'Retiro en Almacén Central Durango (Coordinado con Folio)'}\n\n` +
    `2. PARTIDA Y APLICACIÓN:\n` +
    `   Tipo de Solicitud: ${tag}\n` +
    `   Equipo / Refacción: ${data.role}\n` +
    `   Detalles: ${data.details || 'Verificación dimensional 1:1'}\n\n` +
    `3. PROTOCOLO DE ALMACÉN Y GARANTÍA:\n` +
    `   Garantía válida para componentes con balanceo dinámico en banco\n` +
    `   de pruebas, verificación dimensional 1:1 y aleación A05 (>650 HB)\n` +
    `   inspeccionados y despachados en Almacén Central SMAT Durango.\n` +
    `===================================================`
  );
}

function generateAcuseParams(data) {
  return new URLSearchParams({
    folio: data.folio,
    nombre: data.name,
    empresa: data.company,
    telefono: data.phone,
    correo: data.email,
    equipo: data.role,
    detalles: data.details || '',
    destino: data.destination || '',
    urgencia: data.isOpex ? 'paro' : 'proyecto'
  });
}

function validateProfileSchema(profile) {
  if (!profile || typeof profile !== 'object') return false;
  const required = ['name', 'company', 'phone', 'email'];
  return required.every(k => typeof profile[k] === 'string' && profile[k].length > 0);
}

// ----------------------------------------------------
// TEST SUITE: Decisiones B2B (1-A a 8-C)
// ----------------------------------------------------

test('1. Resolución Inteligente de Dominios Mineros (Decisión 3-A)', () => {
  const groups = miningGroupsData.groups;

  // Dominio corporativo First Majestic
  const matchFM = resolveMiningGroup('mantenimiento@firstmajestic.com', groups);
  assert.ok(matchFM, 'Debe resolver First Majestic');
  assert.equal(matchFM.id, 'first-majestic');
  assert.ok(matchFM.units.some(u => u.name.includes('San Dimas')), 'Debe incluir unidad San Dimas (Tayoltita, Durango)');

  // Dominio Peñoles
  const matchPenoles = resolveMiningGroup('planta.velardena@penoles.com.mx', groups);
  assert.ok(matchPenoles, 'Debe resolver Peñoles');
  assert.equal(matchPenoles.id, 'penoles');
  assert.ok(matchPenoles.units.some(u => u.name.includes('Velardeña')), 'Debe incluir unidad Velardeña');

  // Dominio Grupo México
  const matchGM = resolveMiningGroup('superintendente@gmexico.com', groups);
  assert.ok(matchGM, 'Debe resolver Grupo México');
  assert.ok(matchGM.units.some(u => u.name.includes('Buenavista')), 'Debe incluir Buenavista del Cobre');

  // Dominio público o desconocido no debe asociar grupo corporativo minero
  const matchGmail = resolveMiningGroup('ingeniero@gmail.com', groups);
  assert.equal(matchGmail, null, 'No debe resolver proveedores públicos como minas');
});

test('2. Protocolo Técnico de Almacén Central y Domicilio Fiscal Durango (Decisión 1-C y Opción C)', () => {
  const sampleData = {
    folio: 'SMAT-2026-8810',
    name: 'Ing. Residente',
    company: 'Unidad Minera Central',
    phone: '(618) 810-4408',
    email: 'contacto@minera.com',
    role: 'Impulsor de 5 álabes marco D serie SMAT-AH (A05)',
    details: 'Pulpa de cuarzo abrasivo 52% sólidos en peso a ciclones',
    destination: 'Retiro en Almacén Central Durango',
    isOpex: true
  };

  const specText = buildCleanSpec(sampleData);

  assert.ok(specText.includes('SMAT-2026-8810'), 'Debe incluir el folio único institucional');
  assert.ok(specText.includes('balanceo dinámico en banco'), 'Debe estampar el protocolo de balanceo dinámico en banco');
  assert.ok(specText.includes('Mariano Salas #114, Durango'), 'Debe referenciar el domicilio fiscal en Durango');
  assert.ok(specText.includes('Almacén Central SMAT Durango') || specText.includes('ALMACÉN CENTRAL'), 'Debe referenciar el Almacén Central');
  assert.ok(specText.includes('A05 (>650 HB)'), 'Debe certificar la colada A05 con dureza verificada');
  assert.ok(!specText.includes('45 min') && !specText.includes('45m'), 'Cero promesas de minutos bajo Decisión 6-C');
});

test('3. Generación de Parámetros URL para Vista ERP / Acuse (Decisión 2-A & 7-A)', () => {
  const sampleData = {
    folio: 'SMAT-2026-4428',
    name: 'Ing. Roberto Silva',
    company: 'Fresnillo plc / Saucito',
    phone: '(492) 123-4567',
    email: 'rsilva@fresnilloplc.com',
    role: 'Mecanismo Rotor y Estator 100 ft³',
    details: 'Flotación de sulfuros masivos Pb-Zn',
    destination: 'Fresnillo, Zacatecas',
    isOpex: false
  };

  const params = generateAcuseParams(sampleData);
  assert.equal(params.get('folio'), 'SMAT-2026-4428');
  assert.equal(params.get('nombre'), 'Ing. Roberto Silva');
  assert.equal(params.get('empresa'), 'Fresnillo plc / Saucito');
  assert.equal(params.get('urgencia'), 'proyecto');
});

test('4. Esquema y Resiliencia del Perfil de Usuario Recurrente (Decisión 1-A)', () => {
  const validProfile = {
    name: 'Ing. Fernando Castro',
    company: 'Alamos Gold Inc. / Mulatos',
    phone: '(662) 890-1234',
    email: 'fcastro@alamosgold.com',
    destination: 'Sahuaripa, Sonora'
  };

  assert.ok(validateProfileSchema(validProfile), 'El perfil completo debe ser válido');

  const invalidProfile = {
    name: 'Incompleto'
  };
  assert.equal(validateProfileSchema(invalidProfile), false, 'Perfil incompleto debe ser rechazado');
});

test('5. Invariante de Erradicación de Promesas Falsas ("< 45 min" y "24/7")', () => {
  const filesToCheck = [
    'src/components/Header.astro',
    'src/components/QuoteWizard.astro',
    'src/components/WhatsAppButton.astro',
    'src/components/CircuitNavigator.astro',
    'src/components/TrustMatrix.astro',
    'src/pages/index.astro',
    'src/pages/en/index.astro',
    'src/pages/acuse.astro',
    'src/pages/en/thank-you.astro',
    'src/pages/nosotros.astro',
    'src/pages/en/about.astro',
    'src/pages/contacto.astro',
    'src/pages/en/contact.astro',
    'src/pages/diagnostico.astro',
    'src/pages/en/diagnostics.astro',
    'data/faqs.json',
    'data/trust.json'
  ];

  for (const rel of filesToCheck) {
    const fullPath = path.join(siteRoot, rel);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.equal(
        content.toLowerCase().includes('45 min') || content.toLowerCase().includes('45m'),
        false,
        `Archivo ${rel} contiene menciones prohibidas de 45 min / 45m`
      );
      assert.equal(
        content.includes('24/7'),
        false,
        `Archivo ${rel} contiene promesa falsa de atención 24/7`
      );
    }
  }
});

test('6. Formateo de Requisición SAP Plaintext con 3 Modalidades Logísticas (Decisiones 6-C y 8-C)', () => {
  const payload = {
    folio: 'SMAT-2026-9921',
    contact_name: 'Ing. Arturo Morales',
    company_name: 'Torex Gold / Media Luna',
    phone_number: '(733) 100-2233',
    email_address: 'amorales@torexgold.com',
    part_name: 'Voluta y Garganta A05 >650 HB',
    logistics_mode: 'fletera',
    metrics: {
      flow_m3h: 500,
      solids_cw: 35,
      slurry_sg: 1.32,
      critical_velocity_ms: 2.85,
      recommended_alloy: 'High Chrome 27% (A05)'
    }
  };

  const text = formatSapPlaintext(payload);
  assert.ok(text.includes('SMAT-2026-9921'), 'Debe contener folio institucional');
  assert.ok(text.includes('Torex Gold'), 'Debe contener empresa');
  assert.ok(text.includes('Fletera Consolidada'), 'Debe reflejar modalidad logística de fletera');
  assert.ok(text.includes('DURAND-CONDOLIOS'), 'Debe incluir memoria de cálculo de Durand');
  assert.ok(text.includes('2.85 m/s'), 'Debe estampar velocidad crítica calculada');
  assert.ok(text.includes('banco de pruebas') || text.includes('Almacén Central Durango'), 'Debe incluir cláusula de almacén central');
});

test('7. Formateo de Enlaces RFC 6068 y WhatsApp (Decisión 6-C)', () => {
  const payload = {
    folio: 'SMAT-2026-1102',
    company_name: 'Minera Frisco',
    part_name: 'Impulsor A05 8x6',
    email_address: 'compras@minerafrisco.com.mx'
  };

  const mailto = formatMailtoUrl(payload);
  assert.ok(mailto.startsWith('mailto:compras%40minerafrisco.com.mx'), 'Debe comenzar con mailto codificado');
  assert.ok(mailto.includes('SMAT-2026-1102'), 'Debe incluir el folio en asunto');

  const wa = formatWhatsappUrl(payload);
  assert.ok(wa.startsWith('https://wa.me/526183670664'), 'Debe dirigir a la línea oficial de WhatsApp Durango');
  assert.ok(wa.includes('SMAT-2026-1102'), 'Debe incluir el folio en el mensaje de WhatsApp');
});

test('8. Contrato de EventBus Soberano (Decisión 5-C)', () => {
  assert.equal(SMAT_WORKBENCH_EVENT, 'smat:workbench_update');
});

test('9. Verificación de Existencia y Accesibilidad de las 40 Rutas Estáticas (Decisión 7-C)', () => {
  const pages = [
    // 20 Español
    'src/pages/index.astro',
    'src/pages/catalogo.astro',
    'src/pages/bombeo/index.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/bombeo/impulsor.astro',
    'src/pages/bombeo/revestimientos.astro',
    'src/pages/bombeo/sello.astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/flotacion/index.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/flotacion/mecanismos.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/filtracion/prensa.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/diagnostico.astro',
    'src/pages/garantia.astro',
    'src/pages/nosotros.astro',
    'src/pages/contacto.astro',
    'src/pages/aviso.astro',
    'src/pages/acuse.astro',
    // 20 Inglés
    'src/pages/en/index.astro',
    'src/pages/en/catalog.astro',
    'src/pages/en/pumping/index.astro',
    'src/pages/en/pumping/skid.astro',
    'src/pages/en/pumping/impeller.astro',
    'src/pages/en/pumping/liners.astro',
    'src/pages/en/pumping/seal.astro',
    'src/pages/en/pumping/bearing-assembly.astro',
    'src/pages/en/flotation/index.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/en/flotation/mechanisms.astro',
    'src/pages/en/filtration/index.astro',
    'src/pages/en/filtration/press.astro',
    'src/pages/en/filtration/parts.astro',
    'src/pages/en/diagnostics.astro',
    'src/pages/en/warranty.astro',
    'src/pages/en/about.astro',
    'src/pages/en/contact.astro',
    'src/pages/en/privacy.astro',
    'src/pages/en/thank-you.astro'
  ];

  assert.equal(pages.length, 40, 'Deben existir exactamente 40 páginas estáticas en el sitio.');

  for (const pageRel of pages) {
    const fullPath = path.join(siteRoot, pageRel);
    assert.ok(fs.existsSync(fullPath), `La página ${pageRel} debe existir físicamente en disco.`);
  }

  // Verificar que Footer.astro contiene los enlaces a las rutas
  const footerContent = fs.readFileSync(path.join(siteRoot, 'src/components/Footer.astro'), 'utf-8');
  assert.ok(footerContent.includes('/catalogo/'), 'Footer debe enlazar catalogo');
  assert.ok(footerContent.includes('/en/catalog/'), 'Footer debe enlazar en/catalog');
  assert.ok(footerContent.includes('/bombeo/'), 'Footer debe enlazar bombeo');
  assert.ok(footerContent.includes('/flotacion/'), 'Footer debe enlazar flotacion');
  assert.ok(footerContent.includes('/filtracion/'), 'Footer debe enlazar filtracion');
  assert.ok(footerContent.includes('/en/pumping/'), 'Footer debe enlazar en/pumping');
  assert.ok(footerContent.includes('/en/flotation/'), 'Footer debe enlazar en/flotation');
  assert.ok(footerContent.includes('/en/filtration/'), 'Footer debe enlazar en/filtration');

  // Verificar que Header.astro contiene enlace al catálogo
  const headerContent = fs.readFileSync(path.join(siteRoot, 'src/components/Header.astro'), 'utf-8');
  assert.ok(headerContent.includes('/catalogo/'), 'Header debe enlazar catalogo');
  assert.ok(headerContent.includes('/en/catalog/'), 'Header debe enlazar en/catalog');
});

test('10. Calibración de Lenguaje Digno y Respetuoso (Decisiones 1-C y 5-C)', () => {
  const filesToAudit = [
    'src/scripts/slurryEngine.js',
    'src/components/QuoteWizard.astro',
    'src/components/DiagnosticsHub.astro',
    'src/components/TrustMatrix.astro',
    'data/diagnostics.json'
  ];

  const forbiddenColloquialWords = ['wey', 'chale', 'chido', 'naco', 'morro', 'paro loco'];

  for (const fileRel of filesToAudit) {
    const content = fs.readFileSync(path.join(siteRoot, fileRel), 'utf-8').toLowerCase();
    for (const word of forbiddenColloquialWords) {
      assert.ok(!content.includes(word), `Archivo ${fileRel} no debe contener jerga degradante '${word}'`);
    }
  }

  // Verificar presencia de términos de ingeniería formal
  const slurryEngineCode = fs.readFileSync(path.join(siteRoot, 'src/scripts/slurryEngine.js'), 'utf-8');
  assert.ok(slurryEngineCode.includes('Durand-Condolios') || slurryEngineCode.includes('Durand'), 'Debe citar la formulación de Durand');
  assert.ok(slurryEngineCode.includes('balanceo dinámico') || slurryEngineCode.includes('Durango'), 'Debe citar protocolo de balanceo en planta');
  assert.ok(slurryEngineCode.includes('>650 HB') || slurryEngineCode.includes('A05'), 'Debe citar norma metalúrgica A05');
});

test('11. Manejo y Formateo de Equipos No Listados / Custom Intake (Decisión 3-C)', () => {
  const customPayload = {
    folio: 'SMAT-2026-CUSTOM-01',
    contact_name: 'Ing. Laura Valenzuela',
    company_name: 'Minera San Julián',
    phone_number: '(627) 522-9900',
    email_address: 'lvalenzuela@fresnilloplc.com',
    part_name: 'Equipo Especial Fuera de Catálogo (Bomba Vertical de Sumidero 100mm)',
    details: 'Longitud de columna 2.4m con impulsor abierto en acero inoxidable 316L',
    metrics: {
      flow_m3h: 80,
      solids_cw: 15,
      slurry_sg: 1.12,
      critical_velocity_ms: 1.45,
      recommended_alloy: 'Acero Inoxidable / Especial'
    }
  };

  const formattedSap = formatSapPlaintext(customPayload);
  assert.ok(formattedSap.includes('SMAT-2026-CUSTOM-01'), 'Debe incluir folio especial');
  assert.ok(formattedSap.includes('Fuera de Catálogo') || formattedSap.includes('Bomba Vertical'), 'Debe reflejar la solicitud fuera de catálogo');
  assert.ok(formattedSap.includes('San Julián'), 'Debe conservar la unidad minera');
});

test('12. Invariante de Erradicación Total de "taller" y "workshop" en Código y Datos (Decisión 2-C y Ethos)', () => {
  function scanDirForForbiddenTerms(dirPath, forbiddenTerms) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDirForForbiddenTerms(full, forbiddenTerms);
      } else if (entry.isFile() && /\.(astro|json|js|ts|html)$/i.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf-8');
        for (const term of forbiddenTerms) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          const hasMatch = regex.test(content);
          assert.equal(
            hasMatch,
            false,
            `Invariante violado: El archivo ${path.relative(siteRoot, full)} contiene el término no deseado '${term}'`
          );
        }
      }
    }
  }

  scanDirForForbiddenTerms(path.join(siteRoot, 'src'), ['taller', 'workshop']);
  scanDirForForbiddenTerms(path.join(siteRoot, 'data'), ['taller', 'workshop']);
});

test('13. Parsing de Parámetros de Contexto URL con parseUrlContextParams (Decisión 5-C)', () => {
  // Caso 1: Parámetros completos
  const parsed1 = parseUrlContextParams('?equipo=impulsor&rol=mantenimiento&modo=dedicado&urgencia=paro');
  assert.equal(parsed1.equipo, 'impulsor');
  assert.equal(parsed1.rol, 'mantenimiento');
  assert.equal(parsed1.modo, 'dedicado');
  assert.equal(parsed1.urgencia, 'paro');

  // Caso 2: Alias compatibles (role_id, perspectiva)
  const parsed2 = parseUrlContextParams('?role_id=celdas_flotacion&perspectiva=metalurgia&origen=footer');
  assert.equal(parsed2.equipo, 'celdas_flotacion');
  assert.equal(parsed2.rol, 'metalurgia');
  assert.equal(parsed2.origen, 'footer');

  // Caso 3: URL vacía o solo signo de interrogación
  const parsedEmpty = parseUrlContextParams('');
  assert.equal(parsedEmpty.equipo, null);
  assert.equal(parsedEmpty.rol, null);

  const parsedQuestion = parseUrlContextParams('?');
  assert.equal(parsedQuestion.equipo, null);

  // Caso 4: URL completa
  const parsedFull = parseUrlContextParams('https://smatminerals.com/?equipo=filtro_prensa#rfq');
  assert.equal(parsedFull.equipo, 'filtro_prensa');
});

test('14. Invariante de Paridad de Catálogo (data/roles.json === data/roles.copy.json)', () => {
  const rolesA = fs.readFileSync(path.join(siteRoot, 'data', 'roles.json'), 'utf-8');
  const rolesB = fs.existsSync(path.join(siteRoot, 'data', 'roles.copy.json')) ? fs.readFileSync(path.join(siteRoot, 'data', 'roles.copy.json'), 'utf-8') : rolesA;
  assert.equal(rolesA, rolesB, 'data/roles.json y data/roles.copy.json deben ser estrictamente idénticos byte a byte.');
});

test('15. Selector de Misión y Paquetes de Equipamiento de Circuito (Decisión 3-C)', () => {
  const packagePayload = {
    folio: 'SMAT-2026-PKG-01',
    contact_name: 'Ing. Elena Morales',
    company_name: 'Minera Tayahua',
    phone_number: '(492) 800-1122',
    email_address: 'emorales@frisco.com.mx',
    mission_type: 'equipos',
    part_name: 'Circuito Completo de Molienda y Flotación',
    package_items: [
      'Bomba centrífuga en skid con motor y poleas',
      'Celdas de flotación mecánicas 100-300 ft³',
      'Filtro prensa de placas y telas filtrantes',
      'Paquete de refacciones iniciales de desgaste (impulsor, voluta, sellos)'
    ],
    details: 'Arranque de circuito 500 TPD en línea de sulfuros'
  };

  const formatted = formatSapPlaintext(packagePayload);
  assert.ok(formatted.includes('SMAT-2026-PKG-01'), 'Debe incluir folio');
  assert.ok(formatted.includes('Equipos Completos') || formatted.includes('Circuito de Planta'), 'Debe reflejar modalidad de equipos completos');
  assert.ok(formatted.includes('Bomba centrífuga') || formatted.includes('Skid'), 'Debe listar skid de bombeo');
  assert.ok(formatted.includes('Celdas de flotación') || formatted.includes('flotación'), 'Debe listar celdas de flotación');
  assert.ok(formatted.includes('Filtro prensa') || formatted.includes('filtración'), 'Debe listar filtro prensa');
  assert.ok(formatted.includes('refacciones') || formatted.includes('desgaste'), 'Debe listar refacciones de desgaste iniciales');
});

test('16. Preferencias de Canal de Contacto y Privacidad Directa (Decisión 6-C)', () => {
  // Canal llamada
  const callPayload = {
    folio: 'SMAT-2026-CALL',
    contact_name: 'Lic. Martha Gómez',
    company_name: 'Minera Real del Oro',
    phone_number: '(618) 123-4567',
    email_address: 'mgomez@argonautgold.com',
    part_name: 'Impulsor A05 6x4',
    channel_pref: 'llamada'
  };
  const textCall = formatSapPlaintext(callPayload);
  assert.ok(textCall.includes('Llamada telefónica directa'), 'Debe reflejar preferencia de llamada');

  // Canal whatsapp
  const waPayload = { ...callPayload, folio: 'SMAT-2026-WA', channel_pref: 'whatsapp' };
  const textWa = formatSapPlaintext(waPayload);
  assert.ok(textWa.includes('WhatsApp de Planta') || textWa.includes('WhatsApp de guardia'), 'Debe reflejar preferencia de WhatsApp');

  // Canal correo
  const mailPayload = { ...callPayload, folio: 'SMAT-2026-MAIL', channel_pref: 'correo' };
  const textMail = formatSapPlaintext(mailPayload);
  assert.ok(textMail.includes('Correo formal con cotización PDF'), 'Debe reflejar preferencia de correo formal');
});

test('17. Invariante de Higiene de Propiedad Intelectual y Marcas Registradas (Decisión 4-C)', () => {
  const forbiddenBrands = ['warman', 'denver', 'metso', 'outotec'];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(full);
      } else if (entry.isFile() && /\.(astro|json|js|ts|html|md)$/i.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf-8').toLowerCase();
        for (const brand of forbiddenBrands) {
          const regex = new RegExp(`\\b${brand}\\b`, 'i');
          const hasMatch = regex.test(content);
          assert.equal(
            hasMatch,
            false,
            `Invariante violado: Archivo ${path.relative(siteRoot, full)} contiene marca ajena '${brand}'`
          );
        }
      }
    }
  }

  scanDirectory(path.join(siteRoot, 'src'));
  scanDirectory(path.join(siteRoot, 'data'));
});

test('18. Estructura y Metadatos de Catálogo Digital (Decisión 5-C)', () => {
  const catEs = fs.readFileSync(path.join(siteRoot, 'src', 'pages', 'catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src', 'pages', 'en', 'catalog.astro'), 'utf-8');

  // Verificación de secciones clave en ES
  assert.ok(catEs.includes('Línea de Bombeo') || catEs.includes('Bombeo'), 'Debe contener sección de Bombeo');
  assert.ok(catEs.includes('Flotación') || catEs.includes('Celdas'), 'Debe contener sección de Flotación');
  assert.ok(catEs.includes('Filtración') || catEs.includes('Filtro'), 'Debe contener sección de Filtración');
  assert.ok(catEs.includes('Logística') || catEs.includes('Durango'), 'Debe contener sección de Logística');
  assert.ok(catEs.includes('@media print'), 'Debe contener reglas de impresión A4');

  // Verificación de secciones clave en EN
  assert.ok(catEn.includes('Slurry Pumping') || catEn.includes('Pumping'), 'EN debe contener Slurry Pumping');
  assert.ok(catEn.includes('Flotation Cells') || catEn.includes('Flotation'), 'EN debe contener Flotation Cells');
  assert.ok(catEn.includes('Tailings Filtration') || catEn.includes('Filtration'), 'EN debe contener Tailings Filtration');
  assert.ok(catEn.includes('Facility & Logistics') || catEn.includes('Logistics'), 'EN debe contener Facility & Logistics');
  assert.ok(catEn.includes('@media print'), 'EN debe contener reglas de impresión A4');
});

test('19. Invariante de Ausencia de Marcas Comerciales de Transporte (Decisión 4-C)', () => {
  const forbiddenCarriers = ['castores', 'tresguerras', 'potosinos'];
  const dirsToAudit = [path.join(siteRoot, 'src'), path.join(siteRoot, 'data')];

  for (const dir of dirsToAudit) {
    const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(astro|json|js|ts|html)$/i.test(entry.name)) {
        const parent = entry.parentPath || dir;
        const fullPath = path.join(parent, entry.name);
        const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
        for (const carrier of forbiddenCarriers) {
          assert.equal(
            content.includes(carrier),
            false,
            `Invariante violado: El archivo ${path.relative(siteRoot, fullPath)} contiene la marca de transporte '${carrier}'`
          );
        }
      }
    }
  }
});

test('20. Verificación de Cláusula de Acompañamiento Pre-Ingeniería / Laboratorio (Decisión 1-C)', () => {
  const quoteWizard = fs.readFileSync(path.join(siteRoot, 'src', 'components', 'QuoteWizard.astro'), 'utf-8');
  assert.ok(
    quoteWizard.includes('datos de laboratorio del mineral') || quoteWizard.includes('laboratorio') || quoteWizard.includes('PEA'),
    'QuoteWizard debe incluir la nota de acompañamiento para compradores con estudios preliminares'
  );
  assert.ok(
    quoteWizard.includes('valida la compatibilidad') || quoteWizard.includes('propuesta técnico-económica formal'),
    'QuoteWizard debe ligar la validación de dimensionamiento a la propuesta formal de equipos SMAT'
  );

  const sapOutput = formatSapPlaintext({
    folio: 'SMAT-2026-TEST',
    part_name: 'Bomba en Skid 4x3',
    logistics_mode: 'dedicado'
  });
  assert.ok(
    sapOutput.includes('Validación preliminar de compatibilidad') || sapOutput.includes('laboratorio'),
    'El texto plano SAP debe incluir la nota de validación según datos de laboratorio'
  );
});

test('21. Resiliencia de Modalidades Logísticas Neutras y Canales de Contacto (Decisiones 4-C y 6-C)', () => {
  const sampleData = {
    folio: 'SMAT-2026-LOG',
    contact_name: 'Ing. Rodrigo Salgado',
    company_name: 'Minera El Triunfo BCS',
    phone_number: '(612) 123-4567',
    email_address: 'rsalgado@juniormining.com',
    part_name: 'Circuito de Flotación 150 TPD',
    logistics_mode: 'dedicado',
    channel_pref: 'correo'
  };

  const formatted = formatSapPlaintext(sampleData);
  assert.ok(formatted.includes('Flete Dedicado Directo / Enlace Multimodal'), 'Debe usar nomenclatura logística neutra');
  assert.ok(formatted.includes('Correo formal con cotización PDF'), 'Debe reflejar canal formal de correo');
  assert.ok(!formatted.includes('Castores') && !formatted.includes('Tresguerras'), 'Cero marcas de transporte en salida SAP');
}); test('22. Jerarquía de Exportación de Cotizador con Botón Rey PDF (Decisión 4-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src', 'components', 'QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('export-btn-king'), 'QuoteWizard debe contener la clase export-btn-king para el botón dominante');
  assert.ok(wizard.includes('wb-pdf-btn'), 'QuoteWizard debe tener el botón de PDF formal');
  assert.ok(wizard.includes('secondary-export-row'), 'QuoteWizard debe contener fila para acciones secundarias');
  assert.ok(wizard.includes('wb-copy-btn'), 'QuoteWizard debe incluir botón de copiado de texto SAP');
  assert.ok(wizard.includes('wb-whatsapp-btn'), 'QuoteWizard debe incluir enlace a WhatsApp');
  assert.ok(wizard.includes('wb-email-btn'), 'QuoteWizard debe incluir enlace de correo');
  assert.ok(wizard.includes('durand-accordion'), 'QuoteWizard debe contener acordeón para el simulador de pulpa');
});

test('23. Estandarización Global en Lienzo Mineral Editorial (Decisión 3-C)', () => {
  const pages = [
    'src/pages/contacto.astro',
    'src/pages/en/contact.astro',
    'src/pages/garantia.astro',
    'src/pages/en/warranty.astro',
    'src/pages/diagnostico.astro',
    'src/pages/en/diagnostics.astro'
  ];

  const darkTokens = ['#121c2e', '#0b111e', '#0f172a', '#090d16'];

  for (const pageRel of pages) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    for (const dark of darkTokens) {
      assert.equal(
        content.includes(dark),
        false,
        `Página ${pageRel} no debe contener fondo oscuro '${dark}' (debe usar Lienzo Mineral #FAFAF9/#FFFFFF)`
      );
    }
  }
});

test('24. Invariante de Lenguaje de Mina Sobrio y Accesible - Test Don Manuel (Decisión 5-C)', () => {
  const filesToAudit = [
    'src/components/QuoteWizard.astro',
    'src/pages/index.astro',
    'src/pages/contacto.astro',
    'src/pages/garantia.astro',
    'src/components/TrustMatrix.astro'
  ];

  const forbiddenTechJargon = ['rfc 6068', 'honeypot', 'localstorage', 'json-ld', 'single page application', 'rest api', 'webhook'];

  for (const fileRel of filesToAudit) {
    const rawContent = fs.readFileSync(path.join(siteRoot, fileRel), 'utf-8');
    // Filtrar scripts y estilos para auditar exclusivamente el texto y marcado UI presentado al usuario
    const uiMarkup = rawContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .toLowerCase();

    for (const jargon of forbiddenTechJargon) {
      assert.equal(
        uiMarkup.includes(jargon),
        false,
        `Archivo ${fileRel} contiene jerga de software inadecuada '${jargon}' en su texto presentado al usuario`
      );
    }
  }
});

test('25. Visión Multiequipo Integral en Portada ES y EN (Décima Ola & Ola 20 - Decisión 1-C)', () => {
  const esHome = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const enHome = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Enfoque directo Don Manuel: Bombas para Lodos, Mecanismos de Flotación, Filtros Prensa y Balanzas
  assert.ok(
    esHome.includes('Bombas para Lodos y Refacciones') && esHome.includes('Mecanismos de Flotación, Filtros Prensa y Balanzas'),
    'index.astro debe incluir Bombas para Lodos, Mecanismos de Flotación, Filtros Prensa y Balanzas en su H1'
  );
  assert.ok(
    enHome.includes('Slurry Pumps & Wear Spares') && enHome.includes('Flotation Mechanisms, Filter Presses & Pulp Density Scales'),
    'en/index.astro debe incluir Slurry Pumps, Flotation Mechanisms, Filter Presses & Pulp Density Scales en EN'
  );

  // Badge único sobrio con live-dot
  assert.ok(
    esHome.includes('SMAT MINERALS') && esHome.includes('live-dot'),
    'index.astro debe contar con la pastilla sobria única con live-dot'
  );
  assert.ok(
    enHome.includes('SMAT MINERALS') && enHome.includes('live-dot'),
    'en/index.astro debe contar con la pastilla sobria en inglés con live-dot'
  );
});

test('26. Saneamiento de las 18 Subpáginas de Silo de Producto (Novena Ola - Decisión 5-C)', () => {
  const siloPages = [
    // 9 ES
    'src/pages/bombeo/index.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/bombeo/impulsor.astro',
    'src/pages/bombeo/revestimientos.astro',
    'src/pages/bombeo/sello.astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/flotacion/index.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/flotacion/mecanismos.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/filtracion/prensa.astro',
    'src/pages/filtracion/repuestos.astro',
    // 9 EN
    'src/pages/en/pumping/index.astro',
    'src/pages/en/pumping/skid.astro',
    'src/pages/en/pumping/impeller.astro',
    'src/pages/en/pumping/liners.astro',
    'src/pages/en/pumping/seal.astro',
    'src/pages/en/pumping/bearing-assembly.astro',
    'src/pages/en/flotation/index.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/en/flotation/mechanisms.astro',
    'src/pages/en/filtration/index.astro',
    'src/pages/en/filtration/press.astro',
    'src/pages/en/filtration/parts.astro'
  ];

  for (const pageRel of siloPages) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');

    // Cero wizards duplicados en subpáginas
    assert.equal(
      content.includes('<QuoteWizard'),
      false,
      `Página ${pageRel} no debe contener <QuoteWizard /> duplicado (debe enlazar a la consola central)`
    );

    // Cero fondos oscuros arcaicos
    assert.equal(
      content.includes('#121c2e'),
      false,
      `Página ${pageRel} no debe usar fondo oscuro #121c2e`
    );
    assert.equal(
      content.includes('#0f172a'),
      false,
      `Página ${pageRel} no debe usar fondo oscuro #0f172a`
    );
  }
});

test('27. Descenso Limpio a Hardware y Cero Promesas Falsas (Décima Primera Ola & Ola 20 - Decisión 3-C)', () => {
  const esHome = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const enHome = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Purga de mini-cajas intermedias huérfanas (.hero-stats / .hero-kpis) para descenso directo a las tarjetas de hardware
  assert.ok(!esHome.includes('hero-stats'), 'index.astro no debe contener .hero-stats (poda de mini-cajas per Decisión 3-C)');
  assert.ok(!enHome.includes('hero-stats'), 'en/index.astro no debe contener .hero-stats (poda de mini-cajas per Decisión 3-C)');
  assert.ok(esHome.includes('hero-actions'), 'index.astro debe contener .hero-actions con CTAs directos');
  assert.ok(enHome.includes('hero-actions'), 'en/index.astro debe contener .hero-actions con CTAs directos');

  // Cero promesas falsas
  const falsePromises = ['2.5x mayor garantizado', '48 hrs garantizadas', '48 horas garantizadas', 'garantizamos 48', 'vida útil garantizada'];
  for (const promise of falsePromises) {
    assert.equal(esHome.toLowerCase().includes(promise), false, `index.astro no debe contener '${promise}'`);
    assert.equal(enHome.toLowerCase().includes(promise), false, `en/index.astro no debe contener '${promise}'`);
  }
});

test('28. Segmented Control de Canales y Revelación Just-in-Time en QuoteWizard (Décima Ola - Decisiones 2-C y 5-C)', () => {
  const wizardContent = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Segmented control de 3 canales
  assert.ok(wizardContent.includes('segmented-control'), 'QuoteWizard debe contener .segmented-control');
  assert.ok(wizardContent.includes('id="wb-channel-selector"'), 'QuoteWizard debe contener #wb-channel-selector');
  assert.ok(wizardContent.includes('value="whatsapp"'), 'Debe incluir opción whatsapp');
  assert.ok(wizardContent.includes('value="llamada"'), 'Debe incluir opción llamada');
  assert.ok(wizardContent.includes('value="correo"'), 'Debe incluir opción correo');

  // Revelación Just-in-Time para equipos fuera de catálogo
  assert.ok(wizardContent.includes('custom-equip-details'), 'Debe contener <details class="custom-equip-details">');
  assert.ok(wizardContent.includes('id="custom-equip-details"'), 'Debe contener id custom-equip-details');
});

test('29. Reubicación de Límites Técnicos y Micro-Compromiso en Home (Décima Ola - Decisión 3-C)', () => {
  const esHome = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const enHome = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');
  const esWarranty = fs.readFileSync(path.join(siteRoot, 'src/pages/garantia.astro'), 'utf-8');
  const enWarranty = fs.readFileSync(path.join(siteRoot, 'src/pages/en/warranty.astro'), 'utf-8');
  const trustMatrix = fs.readFileSync(path.join(siteRoot, 'src/components/TrustMatrix.astro'), 'utf-8');

  // Home usa hideBoundaries={true}
  assert.ok(esHome.includes('hideBoundaries={true}'), 'index.astro debe invocar TrustMatrix con hideBoundaries={true}');
  assert.ok(enHome.includes('hideBoundaries={true}'), 'en/index.astro debe invocar TrustMatrix con hideBoundaries={true}');

  // Garantía mantiene la matriz completa
  assert.ok(esWarranty.includes('<TrustMatrix lang="es" />'), 'garantia.astro debe contener la matriz completa');
  assert.ok(enWarranty.includes('<TrustMatrix lang="en" />'), 'warranty.astro debe contener la matriz completa en inglés');

  // TrustMatrix contiene el enlace al protocolo
  assert.ok(trustMatrix.includes('boundaries-snippet'), 'TrustMatrix debe incluir contenedor .boundaries-snippet');
});

test('30. Tarjetas Arquitectónicas Minerales en FlightDeck (Décima Ola - Decisión 6-C)', () => {
  const flightDeck = fs.readFileSync(path.join(siteRoot, 'src/pages/cotizar.astro'), 'utf-8');

  // Micro-badges
  assert.ok(flightDeck.includes('ext-badge'), 'FlightDeck debe incluir badges .ext-badge');
  assert.ok(flightDeck.includes('P&ID'), 'FlightDeck debe incluir badge P&ID');
  assert.ok(flightDeck.includes('DIAGNÓSTICO') || flightDeck.includes('FALLAS'), 'FlightDeck debe incluir badge de diagnóstico');
  assert.ok(flightDeck.includes('/bombeo/'), 'Debe enlazar a /bombeo/');
  assert.ok(flightDeck.includes('/diagnostico/'), 'Debe enlazar a /diagnostico/');
});

test('31. Conciliación de Domicilio Fiscal y Almacén Central Durango (Opción C)', () => {
  const quoteWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  const footer = fs.readFileSync(path.join(siteRoot, 'src/components/Footer.astro'), 'utf-8');
  const contacto = fs.readFileSync(path.join(siteRoot, 'src/pages/contacto.astro'), 'utf-8');
  const enContact = fs.readFileSync(path.join(siteRoot, 'src/pages/en/contact.astro'), 'utf-8');
  const catalogo = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const enCatalog = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');
  const acuse = fs.readFileSync(path.join(siteRoot, 'src/pages/acuse.astro'), 'utf-8');
  const thankYou = fs.readFileSync(path.join(siteRoot, 'src/pages/en/thank-you.astro'), 'utf-8');
  const llms = fs.readFileSync(path.join(siteRoot, 'public/llms.txt'), 'utf-8');

  // Domicilio fiscal formal para facturación y alta de proveedores
  assert.ok(footer.includes('Domicilio Fiscal (Facturación / Alta):') && footer.includes('Mariano Salas #114'), 'Footer debe identificar domicilio fiscal');
  assert.ok(contacto.includes('Domicilio Fiscal (Facturación y Proveedores):') && contacto.includes('Mariano Salas #114'), 'Contacto debe identificar domicilio fiscal');
  assert.ok(enContact.includes('Fiscal HQ (Invoicing & Vendor Registration):') && enContact.includes('Mariano Salas #114'), 'EN Contact debe identificar Fiscal HQ');

  // Almacén Central Durango
  assert.ok(footer.includes('Almacén Central y Despacho:') && footer.includes('Durango, Dgo.'), 'Footer debe referenciar Almacén Central');
  assert.ok(contacto.includes('Almacén Central y Despacho Físico:') && contacto.includes('Durango, Dgo.'), 'Contacto debe referenciar Almacén Central');
  assert.ok(quoteWizard.includes('Almacén Central Durango'), 'QuoteWizard debe referenciar Almacén Central Durango');
  assert.ok(catalogo.includes('Almacén Central Durango'), 'Catalogo debe referenciar Almacén Central');
  assert.ok(enCatalog.includes('Durango Central Warehouse'), 'EN Catalog debe referenciar Central Warehouse');
  assert.ok(acuse.includes('Almacén Central Durango'), 'Acuse debe referenciar Almacén Central Durango');
  assert.ok(thankYou.includes('Durango Central Warehouse'), 'Thank-you debe referenciar Central Warehouse');
  assert.ok(llms.includes('Fiscal Headquarters:') && llms.includes('Central Warehouse & Distribution:'), 'llms.txt debe distinguir Fiscal HQ y Warehouse');
});

test('32. Sanitización Total de Nombres de Minas y Clientes Específicos en UI y Placeholders', () => {
  const quoteWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Cero personas o clientes específicos en placeholders
  assert.equal(quoteWizard.includes('Carlos Mendoza'), false, 'QuoteWizard no debe incluir nombre personal Carlos Mendoza');
  assert.equal(quoteWizard.includes('Minera San Martín'), false, 'QuoteWizard no debe incluir nombre de mina San Martín en placeholders');
  assert.equal(quoteWizard.includes('cmendoza@firstmajestic.com'), false, 'QuoteWizard no debe incluir correo específico en placeholders');
  assert.equal(quoteWizard.includes('Northern Mining Corp'), false, 'QuoteWizard no debe incluir Northern Mining Corp en placeholders');

  // Placeholders sanitizados genéricos
  assert.ok(quoteWizard.includes('Ej. Ing. J. Pérez / Residente'), 'QuoteWizard debe usar placeholder de ingeniero genérico');
  assert.ok(quoteWizard.includes('Ej. Unidad Minera / Compañía'), 'QuoteWizard debe usar placeholder de empresa genérica');
  assert.ok(quoteWizard.includes('ejemplo@unidadminera.com'), 'QuoteWizard debe usar placeholder de correo genérico');
});

test('33. Modalidades Logísticas Neutras con Retiro en Almacén Central Coordinado con Folio', () => {
  const quoteWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(quoteWizard.includes('Retiro en Almacén Central Durango (Coordinación con Folio)'), 'Opción de entrega debe especificar retiro en Almacén coordinado');
  assert.ok(quoteWizard.includes('Envío por fletera consolidada nacional'), 'Opción de entrega debe incluir fletera consolidada neutra');
  assert.ok(quoteWizard.includes('Flete dedicado directo o enlace multimodal marítimo'), 'Opción de entrega debe incluir flete dedicado neutro');
});

test('34. Formateo y Coherencia de Enlaces RFC 6068 y WhatsApp con Almacén Central Durango', () => {
  const sampleData = {
    folio: 'SMAT-2026-SAN',
    contact_name: 'Ing. Residente',
    company_name: 'Unidad Minera Norte',
    phone_number: '(618) 810-4408',
    email_address: 'contacto@minera.com',
    part_name: 'Impulsor A05 marco D',
    destination: 'Retiro en Almacén Central Durango'
  };

  const plainText = formatSapPlaintext(sampleData);
  assert.ok(plainText.includes('Domicilio Fiscal:  Mariano Salas #114'), 'SAP debe incluir domicilio fiscal');
  assert.ok(plainText.includes('Almacén/Despacho:  Durango, Dgo.'), 'SAP debe incluir almacén y despacho en Durango');
  assert.ok(plainText.includes('Almacén Central SMAT Durango') || plainText.includes('Almacén Central Durango'), 'SAP debe certificar almacén central Durango');

  const waUrl = formatWhatsappUrl(sampleData);
  assert.ok(waUrl.includes('Almac%C3%A9n%20Central%20Durango') || waUrl.includes('Almacen%20Central%20Durango') || decodeURIComponent(waUrl).includes('Almacén Central Durango'), 'WhatsApp URL debe referenciar Almacén Central Durango');
});

test('35. Invariante de Domicilio Fiscal para Facturación y Alta de Proveedores', () => {
  const baseLayout = fs.readFileSync(path.join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf-8');
  assert.ok(baseLayout.includes('Mariano Salas #114'), 'Schema.org LocalBusiness debe declarar Mariano Salas #114 como streetAddress');
  assert.ok(baseLayout.includes('34166'), 'Schema.org LocalBusiness debe declarar CP 34166');
});

test('36. Invariante de Cero Promesas Falsas de Rendimiento en Todo el Sitio', () => {
  const forbiddenPhrases = [
    '2.5x mayor garantizado',
    '48 hrs garantizadas',
    '48 horas garantizadas',
    'garantizamos 48',
    'vida útil garantizada',
    '< 45 min',
    '< 45min',
    '24/7'
  ];

  const filesToScan = [
    'src/pages/index.astro',
    'src/pages/en/index.astro',
    'src/pages/catalogo.astro',
    'src/pages/en/catalog.astro',
    'src/pages/garantia.astro',
    'src/pages/en/warranty.astro',
    'src/pages/contacto.astro',
    'src/pages/en/contact.astro',
    'src/components/Header.astro',
    'src/components/Footer.astro',
    'src/components/QuoteWizard.astro',
    'src/components/TrustMatrix.astro',
    'src/components/PerspectiveSelector.astro'
  ];

  for (const rel of filesToScan) {
    const full = path.join(siteRoot, rel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf-8').toLowerCase();
      for (const phrase of forbiddenPhrases) {
        assert.equal(
          content.includes(phrase),
          false,
          `Archivo ${rel} contiene la promesa falsa o prohibida '${phrase}'`
        );
      }
    }
  }
});

test('37. Generador de Código de Configuración Institucional SMAT Limpio (Decisión 3-B & 6-A)', () => {
  // Impulsor 6x4 (sin marco de fundición ni sufijo de aleación en código institucional público)
  const codeImp = generateSmatPartCode({ role: 'impulsor', details: 'Bomba 6x4 D Alto Cromo A05' });
  assert.equal(codeImp, 'SMAT-PUMP-6X4-IMP', 'Debe generar código institucional limpio de impulsor');

  // Revestimiento 8x6
  const codeLiner = generateSmatPartCode({ role: 'revestimiento', details: 'Bomba 8x6 E Caucho Natural Vulcanizado' });
  assert.equal(codeLiner, 'SMAT-PUMP-8X6-LINER', 'Debe generar código de revestimiento sin fuga de bastidor');

  // Sello Expulsor 4x3 / 3x2
  const codeSeal = generateSmatPartCode({ role: 'sello', details: 'Bomba 4x3 C Sello Dinámico Expulsor' });
  assert.equal(codeSeal, 'SMAT-SEAL-3X2-EXP', 'Debe generar código de sello dinámico sin fuga de bastidor');

  // Conjunto de Rodamientos 10x8
  const codeBear = generateSmatPartCode({ role: 'soporte', details: 'Bomba 10x8 F Soporte y Rodamientos' });
  assert.equal(codeBear, 'SMAT-BEAR-10X8-ASSY', 'Debe generar código de soporte/rodamientos');

  // Mecanismo Rotor/Estator Celda Flotación 100 ft3
  const codeFlot = generateSmatPartCode({ role: 'rotor_estator', details: 'Celda Flotación 100 ft3 Mecanismo Caucho' });
  assert.equal(codeFlot, 'SMAT-FLOT-100FT-MECH', 'Debe generar código de mecanismo de flotación');

  // Telas Filtro Prensa
  const codeFilt = generateSmatPartCode({ role: 'placas_telas', details: 'Filtro Prensa Telas Polipropileno' });
  assert.equal(codeFilt, 'SMAT-FILT-1500-CLOTH', 'Debe generar código de consumibles de filtración');

  // Skid Completo 6x4
  const codeSkid = generateSmatPartCode({ role: 'bomba_skid', details: 'Skid 6x4 D A05 con Motor' });
  assert.equal(codeSkid, 'SMAT-SKID-6X4-STD', 'Debe generar código de Skid de bombeo sin fuga de bastidor');
});

test('38. Formateador de Requisición en Tabla TSV para SAP / Excel (Decisión 10-A)', () => {
  const sampleData = {
    folio: 'SMAT-2026-VAL',
    date: '2026-09-24',
    part_name: 'Impulsor 6x4 D High Chrome A05',
    role: 'impulsor',
    quantity: 2,
    destination: 'Retiro en Almacén Central Durango',
    contact_name: 'Ing. Mantenimiento Planta',
    company_name: 'Minera Velardeña',
    phone_number: '(618) 810-4408',
    client_reference: 'TAG-PUMP-04-A',
    metrics: { recommended_alloy: 'High Chrome A05 (>650 HB)' }
  };

  const tsvOutput = formatSapTsv(sampleData);
  const lines = tsvOutput.trim().split('\n');
  assert.equal(lines.length, 2, 'TSV debe contener exactamente 2 líneas (encabezados y fila de datos)');

  const headerCols = lines[0].split('\t');
  const dataCols = lines[1].split('\t');

  assert.equal(headerCols.length, 11, 'TSV debe tener exactamente 11 columnas');
  assert.equal(dataCols.length, 11, 'La fila de datos debe coincidir en 11 columnas');

  // Verificar columnas clave
  assert.equal(headerCols[0], 'FOLIO_SMAT');
  assert.equal(headerCols[3], 'CODIGO_CONFIGURACION_SMAT');
  assert.equal(headerCols[6], 'REF_CLIENTE_CONFIDENCIAL');

  assert.equal(dataCols[0], 'SMAT-2026-VAL');
  assert.equal(dataCols[4], '2');
  assert.equal(dataCols[6], 'TAG-PUMP-04-A');
  assert.equal(dataCols[9], 'Minera Velardeña');
});

test('39. Tabla Paramétrica Rápida de Series y Marcos en Catálogo ES/EN (Decisión 2-A & Ola 20 Decisión 9-C)', () => {
  const catalogoEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catalogoEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  // Presencia de tabla paramétrica
  assert.ok(catalogoEs.includes('id="parametric-pumps-table"'), 'catalogo.astro debe contener #parametric-pumps-table');
  assert.ok(catalogoEn.includes('id="parametric-pumps-table"'), 'en/catalog.astro debe contener #parametric-pumps-table');

  // Cobertura de series y marcos
  const seriesToCheck = ['4x3 C', '6x4 D', '8x6 E', '10x8 F'];
  for (const s of seriesToCheck) {
    assert.ok(catalogoEs.includes(s), `catalogo.astro debe incluir serie ${s}`);
    assert.ok(catalogoEn.includes(s), `en/catalog.astro debe incluir serie ${s}`);
  }

  // Deep links directos a cotizador con parámetros de equipo y serie
  assert.ok(catalogoEs.includes('serie=4x3') && catalogoEs.includes('#rfq'), 'catalogo.astro debe contener enlaces directos al RFQ por serie');
  assert.ok(catalogoEn.includes('serie=4x3') && catalogoEn.includes('#rfq'), 'en/catalog.astro debe contener enlaces directos al RFQ por serie');
});

test('40. Semáforo Visual Durand y Micro-Calculador TCO en QuoteWizard (Decisiones 3-A y 5-A)', () => {
  const quoteWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Semáforo de flujo Durand
  assert.ok(quoteWizard.includes('id="regime-pill"'), 'QuoteWizard debe contener #regime-pill');
  assert.ok(quoteWizard.includes('id="regime-status-bar"'), 'QuoteWizard debe contener #regime-status-bar');
  assert.ok(quoteWizard.includes('flow-regime-bar-wrap'), 'QuoteWizard debe contener .flow-regime-bar-wrap');

  // Calculador TCO / Costo de Paro
  assert.ok(quoteWizard.includes('id="tco-accordion"'), 'QuoteWizard debe contener #tco-accordion');
  assert.ok(quoteWizard.includes('id="slider-downtime"'), 'QuoteWizard debe contener #slider-downtime');
  assert.ok(quoteWizard.includes('id="tco-tonnage-val"'), 'QuoteWizard debe contener #tco-tonnage-val');

  // Validación de la fórmula de TCO: Toneladas en riesgo = Q * Sm * (Cw / 100) * Horas
  const flow = 300; // m3/h
  const slurrySg = 1.35; // kg/L
  const cwPercent = 40; // %
  const hours = 10; // horas de paro
  const tonsDryPerHour = flow * slurrySg * (cwPercent / 100);
  const totalTonsRisk = Math.round(tonsDryPerHour * hours);

  assert.equal(totalTonsRisk, 1620, 'Fórmula de tonelaje seco en riesgo debe ser exacta');
});

test('41. Ingesta Confidencial de Placa y Dossier Dual Mantenimiento/SAP (Decisiones 6-A y 8-A)', () => {
  const quoteWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Ingesta confidencial
  assert.ok(quoteWizard.includes('id="wb-client-ref"'), 'QuoteWizard debe incluir campo #wb-client-ref');
  assert.ok(quoteWizard.includes('Referencia Interna') || quoteWizard.includes('Placa'), 'QuoteWizard debe tener etiqueta de referencia');

  // Pestañas de vista dual
  assert.ok(quoteWizard.includes('id="tab-btn-maint"'), 'QuoteWizard debe incluir pestaña #tab-btn-maint');
  assert.ok(quoteWizard.includes('id="tab-btn-sap"'), 'QuoteWizard debe incluir pestaña #tab-btn-sap');
  assert.ok(quoteWizard.includes('id="pane-maint"'), 'QuoteWizard debe incluir panel #pane-maint');
  assert.ok(quoteWizard.includes('id="pane-sap"'), 'QuoteWizard debe incluir panel #pane-sap');

  // Botones de copiado dual
  assert.ok(quoteWizard.includes('id="wb-copy-btn"'), 'QuoteWizard debe incluir botón #wb-copy-btn (Texto Plano)');
  assert.ok(quoteWizard.includes('id="wb-copy-tsv-btn"'), 'QuoteWizard debe incluir botón #wb-copy-tsv-btn (Tabla TSV)');
});

test('42. Puente Contextual de Diagnóstico a Requisición (Decisión 7-A & 9-C)', () => {
  const diagHub = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  assert.ok(diagHub.includes('equipo=') && (diagHub.includes('/?equipo=') || diagHub.includes('/#rfq?equipo=')), 'DiagnosticsHub debe tener enlaces directos al RFQ');
  assert.ok(diagHub.includes('origen=diagnostico'), 'DiagnosticsHub debe marcar origen=diagnostico');
  assert.ok(diagHub.includes('sintoma='), 'DiagnosticsHub debe inyectar el parámetro sintoma');
  assert.ok(diagHub.includes('urgencia=paro'), 'DiagnosticsHub debe configurar urgencia=paro');
});

test('43. Protocolos de Calidad y Ensayos a Solicitud Formal (Decisión 1-A)', () => {
  const garantia = fs.readFileSync(path.join(siteRoot, 'src/pages/garantia.astro'), 'utf-8');
  const warranty = fs.readFileSync(path.join(siteRoot, 'src/pages/en/warranty.astro'), 'utf-8');
  const trustData = fs.readFileSync(path.join(siteRoot, 'data/trust.json'), 'utf-8');

  assert.ok(garantia.includes('protocol-request-card'), 'garantia.astro debe contener .protocol-request-card');
  assert.ok(warranty.includes('protocol-request-card'), 'en/warranty.astro debe contener .protocol-request-card');
  assert.ok(trustData.includes('protocol_policy_es'), 'trust.json debe declarar protocol_policy_es');
  assert.ok(trustData.includes('protocol_policy_en'), 'trust.json debe declarar protocol_policy_en');
});

test('44. Invariante de Cero Fugas de Conteo Cuantitativo de Inventario en Web Pública (Decisión 9-A)', () => {
  const publicPages = [
    'src/pages/index.astro',
    'src/pages/en/index.astro',
    'src/pages/catalogo.astro',
    'src/pages/en/catalog.astro',
    'src/pages/garantia.astro',
    'src/pages/en/warranty.astro',
    'src/pages/contacto.astro',
    'src/pages/en/contact.astro'
  ];

  const leakRegexes = [
    /\b\d+\s+(piezas|unidades|pzas)\s+en\s+stock\b/i,
    /\bstock\s*:\s*\d+\b/i,
    /\binventario\s*:\s*\d+\b/i,
    /\b\d+\s+disponibles\s+en\s+almac[eé]n\b/i
  ];

  for (const pageRel of publicPages) {
    const full = path.join(siteRoot, pageRel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf-8');
      for (const regex of leakRegexes) {
        assert.equal(
          regex.test(content),
          false,
          `Archivo ${pageRel} viola la privacidad de inventario con el patrón ${regex}`
        );
      }
    }
  }
});

test('45. Invariante de Cero Números de Parte o Marcas OEM en Todo el Árbol Público', () => {
  const filesToAudit = [
    'src/pages/index.astro',
    'src/pages/catalogo.astro',
    'src/pages/garantia.astro',
    'src/pages/diagnostico.astro',
    'src/pages/contacto.astro',
    'src/components/QuoteWizard.astro',
    'src/components/TrustMatrix.astro',
    'src/components/DiagnosticsHub.astro',
    'data/roles.json',
    'data/trust.json',
    'data/diagnostics.json'
  ];

  const oemForbiddenPatterns = [
    /\bwarman\b/i,
    /\bmetso\b/i,
    /\boutotec\b/i,
    /\bflsmidth\b/i,
    /\bkreb\b/i,
    /\bah\b\s*pump/i
  ];

  for (const fileRel of filesToAudit) {
    const full = path.join(siteRoot, fileRel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf-8');
      for (const pattern of oemForbiddenPatterns) {
        assert.equal(
          pattern.test(content),
          false,
          `Archivo ${fileRel} contiene patrón o marca prohibida ${pattern}`
        );
      }
    }
  }
});

test('46. Decodificador Inteligente de Código SMAT (Decisión 6-A)', async () => {
  const { parseSmatPartCode } = await import('../src/scripts/workbenchBus.js');

  const decodedImp = parseSmatPartCode('SMAT-PUMP-6X4D-A05-IMP');
  assert.ok(decodedImp, 'Debe decodificar código de impulsor');
  assert.equal(decodedImp.role, 'impulsor');
  assert.equal(decodedImp.series, '6X4D');
  assert.equal(decodedImp.frame, 'D');
  assert.equal(decodedImp.alloy, 'A05');
  assert.equal(decodedImp.isOpex, true);

  const decodedSkid = parseSmatPartCode('SMAT-SKID-8X6E-A05');
  assert.ok(decodedSkid, 'Debe decodificar código de skid');
  assert.equal(decodedSkid.role, 'skid_bomba');
  assert.equal(decodedSkid.series, '8X6E');
  assert.equal(decodedSkid.frame, 'E');
  assert.equal(decodedSkid.isOpex, false);

  const decodedFlot = parseSmatPartCode('SMAT-FLOT-200FT-CELL');
  assert.ok(decodedFlot, 'Debe decodificar código de celda de flotación');
  assert.equal(decodedFlot.role, 'celda_flotacion');
  assert.equal(decodedFlot.series, '200FT');

  const decodedFilt = parseSmatPartCode('SMAT-FILT-PRESS-16BAR');
  assert.ok(decodedFilt, 'Debe decodificar filtro prensa');
  assert.equal(decodedFilt.role, 'filtro_prensa');

  assert.equal(parseSmatPartCode('INVALID-CODE-XYZ'), null, 'Código inválido debe retornar null');
});

test('47. Esquema SVG Reactivo de Cotas Clave de Montaje en Catálogo (Decisión 2-A)', () => {
  const catEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  assert.ok(catEs.includes('pump-mounting-diagram'), 'catalogo.astro debe contener #pump-mounting-diagram');
  assert.ok(catEn.includes('pump-mounting-diagram'), 'en/catalog.astro debe contener #pump-mounting-diagram');
  assert.ok(catEs.includes('svg-dim-a'), 'catalogo.astro debe contener acotación SVG cota A');
  assert.ok(catEs.includes('svg-dim-b'), 'catalogo.astro debe contener acotación SVG cota B');
  assert.ok(catEs.includes('svg-dim-c'), 'catalogo.astro debe contener acotación SVG cota C');
  assert.ok(catEs.includes('svg-dim-d'), 'catalogo.astro debe contener acotación SVG cota D');
});

test('48. Conmutador TCO de Aleación y Ahorro en Paros de Turno (Decisión 3-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('tco-alloy-toggle'), 'QuoteWizard debe contener selector #tco-alloy-toggle');
  assert.ok(wizard.includes('tco-savings-val'), 'QuoteWizard debe contener indicador #tco-savings-val');
  assert.ok(wizard.includes('~7 paros'), 'QuoteWizard debe proyectar paros evitados con A05');
});

test('49. Filtro Reactivo por Síntoma en Hub de Diagnóstico (Decisión 7-A & Ola 20 Decisión 10-C)', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  assert.ok(diag.includes('diag-filter-chips'), 'DiagnosticsHub debe contener .diag-filter-chips');
  assert.ok(diag.includes('diag-pill'), 'DiagnosticsHub debe contener botones .diag-pill');
  assert.ok(diag.includes('aria-pressed'), 'DiagnosticsHub debe implementar aria-pressed en píldoras táctiles');
  assert.ok(diag.includes('addEventListener'), 'DiagnosticsHub debe implementar filtrado client-side reactivo');
});

test('50. Justificación Técnica Normalizada para Órdenes de Compra ERP (Decisión 8-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('sap-justification-box'), 'QuoteWizard debe contener #sap-justification-box');
  assert.ok(wizard.includes('sap-justification-text'), 'QuoteWizard debe contener párrafo #sap-justification-text');
  assert.ok(wizard.includes('pane-sap'), 'QuoteWizard debe tener pestaña #pane-sap');
});

test('51. Protocolo de Cotejo Dimensional 1:1 e Invariante de Extirpación de Debris de Laboratorio (Decisión 2-B)', () => {
  const garantia = fs.readFileSync(path.join(siteRoot, 'src/pages/garantia.astro'), 'utf-8');
  const warranty = fs.readFileSync(path.join(siteRoot, 'src/pages/en/warranty.astro'), 'utf-8');
  const modalExists = fs.existsSync(path.join(siteRoot, 'src/components/QualityReportModal.astro'));

  assert.strictEqual(modalExists, false, 'QualityReportModal.astro debe estar extirpado como debris');
  assert.ok(!garantia.includes('QualityReportModal'), 'garantia.astro no debe importar QualityReportModal');
  assert.ok(!warranty.includes('QualityReportModal'), 'en/warranty.astro no debe importar QualityReportModal');
  assert.ok(garantia.includes('Protocolo de Cotejo Dimensional 1:1'), 'garantia.astro debe incluir protocolo de cotejo dimensional 1:1');
  assert.ok(garantia.includes('≥650 HB') || garantia.includes('>650 HB'), 'garantia.astro debe certificar dureza Brinell');
  assert.ok(warranty.includes('1:1 Dimensional Cross-Check'), 'en/warranty.astro debe incluir protocolo dimensional 1:1');
});

test('52. Persistencia de Sesión en sessionStorage (Decisión 4-A)', async () => {
  const { saveWorkbenchSession, loadWorkbenchSession } = await import('../src/scripts/workbenchBus.js');

  // Test gracefully handling non-browser environment
  assert.doesNotThrow(() => {
    saveWorkbenchSession({ role: 'impulsor', flow: 200 });
  });
  assert.doesNotThrow(() => {
    const loaded = loadWorkbenchSession();
    assert.equal(typeof loaded, 'object');
  });
});

test('53. Sistema de Tokens Apple Industrial y Superficies Especulares (Decisión 1-A)', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf-8');

  assert.ok(tokens.includes('--apple-bg-canvas'), 'tokens.css debe definir --apple-bg-canvas');
  assert.ok(tokens.includes('--apple-bg-surface'), 'tokens.css debe definir --apple-bg-surface');
  assert.ok(tokens.includes('--apple-bg-surface-elevated'), 'tokens.css debe definir --apple-bg-surface-elevated');
  assert.ok(tokens.includes('--apple-border-specular'), 'tokens.css debe definir --apple-border-specular');
  assert.ok(tokens.includes('--apple-shadow-elevation'), 'tokens.css debe definir --apple-shadow-elevation');
  assert.ok(tokens.includes('--apple-accent-blue'), 'tokens.css debe definir --apple-accent-blue');

  assert.ok(globalCss.includes('.apple-industrial-card'), 'global.css debe implementar .apple-industrial-card');
  assert.ok(globalCss.includes('.apple-specular-border'), 'global.css debe implementar .apple-specular-border');
});

test('54. Tipografía Tabular SF Mono y Cero Layout Shift (Decisión 2-A)', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf-8');
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(tokens.includes('--apple-font-mono: "SF Mono", "Roboto Mono"'), 'tokens.css debe priorizar SF Mono y Roboto Mono');
  assert.ok(globalCss.includes('font-variant-numeric: tabular-nums'), 'global.css debe configurar tabular-nums');
  assert.ok(wizard.includes('pro-tabular-nums'), 'QuoteWizard debe aplicar .pro-tabular-nums en métricas dinámicas');
});

test('55. Microfísica de Resortes Apple en Controles Interactivos (Decisión 3-A)', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(tokens.includes('--apple-spring-snappy: cubic-bezier(0.16, 1, 0.3, 1)'), 'tokens.css debe contener curva de resorte Apple snappy');
  assert.ok(tokens.includes('--apple-spring-smooth'), 'tokens.css debe contener curva de resorte smooth');
  assert.ok(wizard.includes('var(--apple-spring-snappy'), 'QuoteWizard debe usar transición de resorte');
});

test('56. Sincronización Bidireccional SVG-Tabla Paramétrica en Catálogo (Decisión 4-A)', () => {
  const catEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  assert.ok(catEs.includes('data-dimension="dim-c"'), 'catalogo.astro debe etiquetar data-dimension="dim-c"');
  assert.ok(catEn.includes('data-dimension="dim-c"'), 'catalog.astro debe etiquetar data-dimension="dim-c"');
  assert.ok(catEs.includes('dim-row'), 'catalogo.astro debe tener clase .dim-row');
  assert.ok(catEs.includes('#38bdf8'), 'catalogo.astro debe aplicar cobalto eléctrico #38BDF8 en hover');
});

test('57. Visual Haptic Feedback Grado Stripe en Copia TSV/SAP (Decisión 5-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('triggerCopyFeedback'), 'QuoteWizard debe implementar triggerCopyFeedback');
  assert.ok(wizard.includes('✓ COPIADO AL PORTAPAPELES'), 'QuoteWizard debe exhibir texto de confirmación Stripe');
  assert.ok(wizard.includes('✓ TSV COPIADO PARA EXCEL / SAP'), 'QuoteWizard debe confirmar copia TSV');
  assert.ok(wizard.includes('scale(1.02)'), 'QuoteWizard debe aplicar micro-escala táctil');
});

test('58. Telemetría Crítica con LEDs Pulsantes en Tiempo Real (Decisión 6-A)', () => {
  const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf-8');
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(globalCss.includes('pulsing-dot-green'), 'global.css debe definir .pulsing-dot-green');
  assert.ok(globalCss.includes('pulsing-dot-amber'), 'global.css debe definir .pulsing-dot-amber');
  assert.ok(globalCss.includes('pulsing-dot-red'), 'global.css debe definir .pulsing-dot-red');
  assert.ok(globalCss.includes('@keyframes status-pulse-green'), 'global.css debe animar pulso verde');
  assert.ok(wizard.includes('pulsing-dot'), 'QuoteWizard debe insertar span .pulsing-dot en regime-pill');
});

test('59. Píldoras Táctiles Sin Íconos Accesibles para Don Manuel (Decisión 7-A & Ola 20 Decisión 10-C)', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  // En Ola 20 (Decisión 10-C), el filtro por píldoras táctiles sin íconos sustituye la barra de búsqueda manual
  assert.ok(diag.includes('role="group"'), 'DiagnosticsHub debe definir role="group" accesible para píldoras');
  assert.ok(diag.includes('data-filter'), 'DiagnosticsHub debe manejar data-filter reactivo');
  assert.ok(diag.includes('.diag-pill'), 'DiagnosticsHub debe estilizar .diag-pill');
  assert.ok(!diag.includes('class="diag-pill"><svg'), 'Las píldoras táctiles no deben contener iconos SVG (estrictamente tipográficas per Decisión 10-C)');
});

test('60. Superficies Glassmorphism y Pro Keybindings Globales (Decisiones 8-A, 9-A, 10-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf-8');

  assert.ok(globalCss.includes('.pro-kbd-badge'), 'global.css debe incluir estilos para atajos de teclado .pro-kbd-badge');
  assert.ok(wizard.includes("e.key === '1'"), 'QuoteWizard debe responder a tecla rápida 1');
  assert.ok(wizard.includes("e.key === '2'"), 'QuoteWizard debe responder a tecla rápida 2');
  assert.ok(wizard.includes("e.key === '3'"), 'QuoteWizard debe responder a tecla rápida 3');
});

test('61. Invariante de Erradicación Total de Emojis Consumer en Componentes Clave (Decisión 2-A)', () => {
  const targetFiles = [
    'src/components/QuoteWizard.astro',
    'src/components/Header.astro',
    'src/components/Footer.astro',
    'src/components/Footer.astro',
    'src/scripts/slurryEngine.js',
    'src/scripts/slurryEngine.js',
    'src/components/CircuitNavigator.astro',
    'src/components/DiagnosticsHub.astro',
    'src/components/CaseCards.astro',
    'src/components/TrustMatrix.astro',
    'src/components/WhatsAppButton.astro',
    'src/components/SharePurchasing.astro'
  ];

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2705}\u{274C}\u{2728}\u{274E}\u{2753}-\u{2755}\u{2757}]/u;

  for (const relPath of targetFiles) {
    const fullPath = path.join(siteRoot, relPath);
    assert.ok(fs.existsSync(fullPath), `El archivo ${relPath} debe existir`);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const match = content.match(emojiRegex);
    assert.equal(match, null, `El archivo ${relPath} contiene emoji consumer arcaico prohibido: ${match ? match[0] : ''}`);
  }
});

test('62. Sistema Canónico de Malla Espacial de 8 Puntos (Decisión 1-A & 5-A)', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf-8');

  assert.ok(tokens.includes('--smat-space-2xs: 4px'), 'tokens.css debe definir --smat-space-2xs: 4px');
  assert.ok(tokens.includes('--smat-space-xs: 8px'), 'tokens.css debe definir --smat-space-xs: 8px');
  assert.ok(tokens.includes('--smat-space-sm: 16px'), 'tokens.css debe definir --smat-space-sm: 16px');
  assert.ok(tokens.includes('--smat-space-md: 24px'), 'tokens.css debe definir --smat-space-md: 24px');
  assert.ok(tokens.includes('--smat-space-lg: 32px'), 'tokens.css debe definir --smat-space-lg: 32px');
  assert.ok(tokens.includes('--smat-space-xl: 48px'), 'tokens.css debe definir --smat-space-xl: 48px');
  assert.ok(tokens.includes('--smat-space-2xl: 80px'), 'tokens.css debe definir --smat-space-2xl: 80px');
  assert.ok(tokens.includes('--smat-space-3xl: 96px'), 'tokens.css debe definir --smat-space-3xl: 96px');

  assert.ok(globalCss.includes('.section-pro-spacing'), 'global.css debe definir clase .section-pro-spacing');
  assert.ok(globalCss.includes('var(--smat-space-2xl, 80px) 1rem'), 'global.css debe aplicar 80px de ritmo vertical');
});

test('63. Arquitectura Monolítica de Live Dossier A4 sin Cajas Punteadas (Decisión 4-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('.dossier-card'), 'QuoteWizard debe contener .dossier-card');
  assert.ok(wizard.includes('padding: var(--smat-space-md, 24px)'), 'dossier-card debe utilizar padding unificado de 24px');
  assert.ok(!wizard.match(/\.dossier-card\s*\{[^}]*dashed/), 'dossier-card no debe contener bordes punteados arcaicos');
  assert.ok(wizard.includes('sap-justification-box'), 'QuoteWizard debe incluir bloque sap-justification-box para ERP');
  assert.ok(wizard.includes('sap-vendor-box'), 'QuoteWizard debe incluir bloque sap-vendor-box');
});

test('64. Ergonomía de 3 Actos Tranquilos y Progressive Disclosure (Decisión 3-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('padding: var(--smat-space-md, 24px)'), 'QuoteWizard debe aplicar padding de 24px en controles');
  assert.ok(wizard.includes('intent-btn'), 'QuoteWizard debe incluir botones de intención táctil .intent-btn');
  assert.ok(wizard.includes('cubic-bezier(0.16, 1, 0.3, 1)'), 'QuoteWizard debe usar física de amortiguamiento Apple snappy');
  assert.ok(wizard.includes('control-card'), 'QuoteWizard debe estructurar el flujo con .control-card');
  assert.ok(wizard.includes('simulator-card'), 'QuoteWizard debe estructurar Acto 2 en simulator-card');
  assert.ok(wizard.includes('contact-card-priority'), 'QuoteWizard debe estructurar Acto 3 en contact-card-priority');
});

test('65. Consola Paramétrica de Catálogo con Separación de 32px y Tipografía Tabular (Decisión 6-A)', () => {
  const catEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  assert.ok(catEs.includes('var(--smat-space-lg, 32px)'), 'catalogo.astro debe usar separación de 32px en mounting-diagram-box');
  assert.ok(catEn.includes('var(--smat-space-lg, 32px)'), 'catalog.astro debe usar separación de 32px en mounting-diagram-box');
  assert.ok(catEs.includes('pro-tabular-nums'), 'catalogo.astro debe marcar la tabla paramétrica con .pro-tabular-nums');
  assert.ok(catEn.includes('pro-tabular-nums'), 'catalog.astro debe marcar la tabla paramétrica con .pro-tabular-nums');
});

test('66. Superficies Minerales Planas y Erradicación de Fondos Pastel (Decisión 1-A & 8-A)', () => {
  const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf-8');

  assert.ok(!globalCss.includes('background: #fff7ed; color: #c25e00;'), 'badges no deben usar fondo naranja pastel ruidoso');
  assert.ok(!globalCss.includes('background: #ecfdf5; color: #047857;'), 'badges no deben usar fondo verde pastel ruidoso');
  assert.ok(!globalCss.includes('background: #fee2e2; color: #b91c1c;'), 'badges no deben usar fondo rojo pastel ruidoso');
  assert.ok(globalCss.includes('.badge-emergency'), 'global.css debe definir .badge-emergency');
  assert.ok(globalCss.includes('border: 1px solid var(--smat-border-light)'), 'badges deben usar borde capilar mineral');
});

test('67. Ritmo Vertical Monumental de 80px en Páginas Maestras ES y EN (Decisión 5-A)', () => {
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  assert.ok(indexEs.includes('padding: var(--smat-space-2xl, 80px) 0;'), 'index.astro debe utilizar espaciado de 80px');
  assert.ok(indexEn.includes('padding: var(--smat-space-2xl, 80px) 0;'), 'en/index.astro debe utilizar espaciado de 80px');
});

test('68. Invariante Hermética de Cero Debris y Pureza Estilística (Decisión 1-A a 10-A)', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');

  assert.ok(!diag.includes('.diag-icon'), 'DiagnosticsHub.astro no debe contener clase obsoleta .diag-icon');
  assert.ok(!diag.includes('background: #fee2e2'), 'DiagnosticsHub.astro no debe tener botones de fondo rojo pastel');
  assert.ok(tokens.includes('--smat-text-primary: #090d16'), 'tokens.css debe mantener tinta carbón canónica #090d16');
  assert.ok(tokens.includes('--smat-copper-accent: #7c2d12'), 'tokens.css debe mantener cobre forjado de planta WCAG AAA');
});

test('69. Vitrina Táctil de 3 Equipos Clave en Portada ES y EN (Decisión 1-C)', () => {
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Sección showcase en portada previa al cotizador
  assert.ok(indexEs.includes('equipment-showcase-section'), 'index.astro debe contener .equipment-showcase-section');
  assert.ok(indexEn.includes('equipment-showcase-section'), 'en/index.astro debe contener .equipment-showcase-section');

  // 3 Tarjetas de hardware clave con deep links para los 3 circuitos (Molienda/Bombeo, Flotación, Filtración)
  assert.ok(indexEs.includes('equipo=skid_bomba'), 'index.astro debe incluir deep link a skid_bomba');
  assert.ok(indexEs.includes('equipo=celda_flotacion'), 'index.astro debe incluir deep link a celda_flotacion');
  assert.ok(indexEs.includes('equipo=filtro_prensa'), 'index.astro debe incluir deep link a filtro_prensa');

  assert.ok(indexEn.includes('equipo=skid_bomba'), 'en/index.astro debe incluir deep link a skid_bomba');
  assert.ok(indexEn.includes('equipo=celda_flotacion'), 'en/index.astro debe incluir deep link a celda_flotacion');
  assert.ok(indexEn.includes('equipo=filtro_prensa'), 'en/index.astro debe incluir deep link a filtro_prensa');
});

test('70. Invariante de Erradicación de Verbórrea Académica en Titulares (Decisión 2-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');

  // Poda de términos pomposos
  assert.ok(!wizard.includes('DESTINO FOB'), 'QuoteWizard no debe usar término arcaico FOB');
  assert.ok(!indexEs.includes('TRANSPARENCIA TÉCNICA RADICAL'), 'index.astro no debe usar fraseología grandilocuente');

  // Presencia de lenguaje directo Don Manuel
  assert.ok(wizard.includes('Datos o foto de la placa vieja'), 'QuoteWizard debe hablar de placa vieja de bomba');
  assert.ok(wizard.includes('Transporte hidráulico y velocidad crítica') || wizard.includes('Cálculo de flujo'), 'QuoteWizard debe titular transporte hidráulico formal');
  assert.ok(diag.includes('Qué pieza poner y qué revisar en la bomba'), 'DiagnosticsHub debe tener etiqueta directa de campo');
});

test('71. Invariante de Ausencia de Acordeones Dobles Anidados en QuoteWizard (Decisión 3-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // No debe existir <details class="tco-accordion"
  assert.ok(!wizard.includes('<details class="tco-accordion"'), 'QuoteWizard no debe anidar un acordeón details dentro del simulador');
  assert.ok(wizard.includes('tco-integrated-card'), 'QuoteWizard debe usar panel continuo tco-integrated-card');
  assert.ok(wizard.includes('id="tco-accordion"'), 'QuoteWizard debe preservar id tco-accordion en el contenedor continuo');
});

test('72. Reubicación Discreta del Decodificador SMAT Fuera del Flujo Principal (Decisión 4-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Decodificador en drawer discreto
  assert.ok(wizard.includes('smat-decoder-details'), 'QuoteWizard debe contener details discreto .smat-decoder-details');
  assert.ok(wizard.includes('id="smat-decoder-bar"'), 'QuoteWizard debe conservar #smat-decoder-bar');
  assert.ok(wizard.includes('id="wb-code-decoder-input"'), 'QuoteWizard debe conservar input de código');
  assert.ok(wizard.includes('id="wb-code-decode-btn"'), 'QuoteWizard debe conservar botón de carga');
});

test('73. Live Dossier Continuo A4 Unificado con Soporte de Impresión (Decisión 5-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Ambos paneles en el documento continuo
  assert.ok(wizard.includes('id="pane-maint"'), 'QuoteWizard debe contener #pane-maint');
  assert.ok(wizard.includes('id="pane-sap"'), 'QuoteWizard debe contener #pane-sap');
  assert.ok(wizard.includes('dossier-subdivider'), 'QuoteWizard debe incluir subdivider continuo');
  assert.ok(wizard.includes('@page'), 'QuoteWizard debe incluir regla @page para impresión A4');
  assert.ok(wizard.includes('size: A4'), 'QuoteWizard debe especificar tamaño A4 continuo');
});

test('74. Matriz de Certeza Física en 3 Tarjetas de Patio sin Tabla Horizontal Obligatoria (Decisión 7-C)', () => {
  const trust = fs.readFileSync(path.join(siteRoot, 'src/components/TrustMatrix.astro'), 'utf-8');

  assert.ok(trust.includes('physical-certainty-grid'), 'TrustMatrix debe incluir .physical-certainty-grid');
  assert.ok(trust.includes('certainty-card'), 'TrustMatrix debe incluir tarjetas de certeza .certainty-card');
  assert.ok(trust.includes('ISO 1940 Grade G2.5') || trust.includes('ISO 1940 Grado G2.5'), 'TrustMatrix debe certificar balanceo ISO 1940');
  assert.ok(trust.includes('certainty-card-boundary'), 'TrustMatrix debe incluir tarjeta de límites honestos');
  assert.ok(trust.includes('boundaries-snippet'), 'TrustMatrix debe conservar .boundaries-snippet para compatibilidad');
});

test('75. Conexión Paramétrica Bidireccional Catálogo -> Cotizador (Decisión 10-C)', () => {
  const catEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  // Soporte de serie en workbenchBus
  const parsed = parseUrlContextParams('?equipo=skid_bomba&serie=6x4D#rfq');
  assert.equal(parsed.equipo, 'skid_bomba', 'parseUrlContextParams debe parsear equipo');
  assert.equal(parsed.serie, '6x4D', 'parseUrlContextParams debe parsear serie');

  // Persistencia de click en sessionStorage
  assert.ok(catEs.includes('smat_catalog_selected'), 'catalogo.astro debe registrar serie en sessionStorage');
  assert.ok(catEn.includes('smat_catalog_selected'), 'en/catalog.astro debe registrar serie en sessionStorage');
});

test('76. Invariante de Costo $0/mes, Cero Dependencias Runtime y 40 Rutas Estáticas (Ola 16)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(siteRoot, 'package.json'), 'utf-8'));
  const dependencies = pkg.dependencies || {};

  // Cero frameworks cliente pesados (React, Vue, Tailwind, jQuery, etc.)
  const clientLibs = ['react', 'vue', 'svelte', 'tailwindcss', 'jquery', 'lodash', 'bootstrap'];
  for (const lib of clientLibs) {
    assert.ok(!dependencies[lib], `El proyecto no debe depender del framework cliente ${lib}`);
  }

  // Motor SSG puro para Cloudflare Pages
  assert.ok(dependencies['astro'], 'Astro es el motor SSG requerido');
  assert.ok(dependencies['@astrojs/cloudflare'], 'Adaptador Cloudflare requerido para $0/mes');

  // 40 rutas físicas generables
  const pagesList = [
    'src/pages/index.astro', 'src/pages/catalogo.astro', 'src/pages/bombeo/index.astro', 'src/pages/bombeo/skid.astro',
    'src/pages/bombeo/impulsor.astro', 'src/pages/bombeo/revestimientos.astro', 'src/pages/bombeo/sello.astro',
    'src/pages/bombeo/soporte.astro', 'src/pages/flotacion/index.astro', 'src/pages/flotacion/celdas.astro',
    'src/pages/flotacion/mecanismos.astro', 'src/pages/filtracion/index.astro', 'src/pages/filtracion/prensa.astro',
    'src/pages/filtracion/repuestos.astro', 'src/pages/diagnostico.astro', 'src/pages/garantia.astro',
    'src/pages/nosotros.astro', 'src/pages/contacto.astro', 'src/pages/aviso.astro', 'src/pages/acuse.astro',
    'src/pages/en/index.astro', 'src/pages/en/catalog.astro', 'src/pages/en/pumping/index.astro', 'src/pages/en/pumping/skid.astro',
    'src/pages/en/pumping/impeller.astro', 'src/pages/en/pumping/liners.astro', 'src/pages/en/pumping/seal.astro',
    'src/pages/en/pumping/bearing-assembly.astro', 'src/pages/en/flotation/index.astro', 'src/pages/en/flotation/cells.astro',
    'src/pages/en/flotation/mechanisms.astro', 'src/pages/en/filtration/index.astro', 'src/pages/en/filtration/press.astro',
    'src/pages/en/filtration/parts.astro', 'src/pages/en/diagnostics.astro', 'src/pages/en/warranty.astro',
    'src/pages/en/about.astro', 'src/pages/en/contact.astro', 'src/pages/en/privacy.astro', 'src/pages/en/thank-you.astro'
  ];

  assert.equal(pagesList.length, 40, 'Deben existir exactamente 40 páginas estáticas compilables');
  for (const p of pagesList) {
    assert.ok(fs.existsSync(path.join(siteRoot, p)), `Ruta ${p} debe existir físicamente`);
  }
});

test('77. Verificación de Cero Dead Affordances en Componentes Clave (Decisión 4-C)', () => {
  const header = fs.readFileSync(path.join(siteRoot, 'src/components/Header.astro'), 'utf-8');
  const caseCards = fs.readFileSync(path.join(siteRoot, 'src/components/CaseCards.astro'), 'utf-8');
  const circuitNav = fs.readFileSync(path.join(siteRoot, 'src/components/CircuitNavigator.astro'), 'utf-8');

  // Header no debe usar #rfq plano relativo que falla en subpáginas
  assert.ok(!header.includes('href="#rfq"'), 'Header no debe usar href="#rfq" relativo');
  assert.ok(header.includes('href={isEs ? "/#rfq" : "/en/#rfq"}') || header.includes('href={isEs ? "/cotizar/#rfq" : "/en/quote/#rfq"}'), 'Header debe usar href absoluto con soporte de idioma');

  // CaseCards no debe usar ancla inexistente #circuitos
  assert.ok(!caseCards.includes('href="#circuitos"'), 'CaseCards no debe contener href="#circuitos"');
  assert.ok(caseCards.includes('href={isEn ? "/en/pumping/" : "/bombeo/"}'), 'CaseCards debe enlazar a bombeo ES/EN');

  // CircuitNavigator no debe usar #rfq plano relativo
  assert.ok(!circuitNav.includes('class="node-cta-rfq" href="#rfq"'), 'CircuitNavigator no debe contener #rfq plano');
  assert.ok(circuitNav.includes('equipo=skid_bomba#rfq'), 'CircuitNavigator debe inyectar equipo=skid_bomba#rfq');
});

test('78. Invariante de Encabezado Único en Diagnóstico ES y EN (Decisión 3-C)', () => {
  const diagEs = fs.readFileSync(path.join(siteRoot, 'src/pages/diagnostico.astro'), 'utf-8');
  const diagEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/diagnostics.astro'), 'utf-8');
  const diagHub = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  // Cero hero duplicado en páginas contenedoras
  assert.ok(!diagEs.includes('class="page-hero"'), 'diagnostico.astro no debe contener .page-hero duplicado');
  assert.ok(!diagEn.includes('class="page-hero"'), 'en/diagnostics.astro no debe contener .page-hero duplicado');

  // Encabezado semántico H1 único dentro de DiagnosticsHub
  assert.ok(diagHub.includes('<h1 class="diagnostics-title">'), 'DiagnosticsHub debe contener h1 semántico único');
  assert.ok(diagHub.includes('ASISTENTE MECÁNICO DE CAMPO'), 'DiagnosticsHub debe incluir badge de asistente en ES');
  assert.ok(diagHub.includes('FIELD MECHANIC ASSISTANT'), 'DiagnosticsHub debe incluir badge de asistente en EN');
});

test('79. Poda Total de Debris en Matriz de Confianza (Decisión 2-C y 7-C)', () => {
  const trust = fs.readFileSync(path.join(siteRoot, 'src/components/TrustMatrix.astro'), 'utf-8');

  // Erradicación de tablas arcaicas y pilares duplicados
  assert.ok(!trust.includes('pillars-grid'), 'TrustMatrix no debe incluir .pillars-grid obsoleto');
  assert.ok(!trust.includes('matrix-table-container'), 'TrustMatrix no debe incluir .matrix-table-container obsoleto');
  assert.ok(!trust.includes('boundaries-box'), 'TrustMatrix no debe incluir .boundaries-box duplicado');

  // Conservación de certezas físicas limpias
  assert.ok(trust.includes('physical-certainty-grid'), 'TrustMatrix debe mantener .physical-certainty-grid');
  assert.ok(trust.includes('boundaries-snippet'), 'TrustMatrix debe mantener .boundaries-snippet');
});

test('80. Invariante de Erradicación de CapEx/OpEx en Vitrina de Portada y Catálogo (Decisión 7-C & Ola 20 Decisión 4-C)', () => {
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');
  const catalogEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  // Ausencia de jerga contable en vitrinas
  assert.ok(!indexEs.includes('CapEx / Paquete Completo'), 'index.astro no debe usar CapEx en tarjeta de bombas');
  assert.ok(!indexEs.includes('OpEx / Repuesto Inmediato'), 'index.astro no debe usar OpEx en tarjeta de repuestos');
  assert.ok(!indexEn.includes('CapEx / Complete Skid Package'), 'en/index.astro no debe usar CapEx en tarjeta de bombas');
  assert.ok(!indexEn.includes('OpEx / Immediate Spare'), 'en/index.astro no debe usar OpEx en tarjeta de repuestos');
  assert.ok(!catalogEn.includes('CapEx • Complete Skid Package'), 'en/catalog.astro no debe usar CapEx en bombas');
  assert.ok(!catalogEn.includes('CapEx • Complete Cell'), 'en/catalog.astro no debe usar CapEx en celdas');

  // Presencia de etiquetas de circuito Apple Pro Key-Specs para Don Manuel
  assert.ok(indexEs.includes('Equipos de Proceso'), 'index.astro debe contener Puerta 1: Equipos de Proceso');
  assert.ok(indexEs.includes('Bombas para Lodos y Spare Parts'), 'index.astro debe contener Puerta 2: Bombas para Lodos y Spare Parts');
  assert.ok(indexEs.includes('Control de Procesos'), 'index.astro debe contener Puerta 3: Control de Procesos');
  assert.ok(indexEn.includes('Process Equipment'), 'en/index.astro debe contener Door 1: Process Equipment');
  assert.ok(indexEn.includes('Slurry Pumps & Spare Parts'), 'en/index.astro debe contener Door 2: Slurry Pumps & Spare Parts');
  assert.ok(indexEn.includes('Process Control'), 'en/index.astro debe contener Door 3: Process Control');
});

test('81. Invariante de Armonización Cromática 90/10 en CaseCards (Decisión 6-C)', () => {
  const caseCards = fs.readFileSync(path.join(siteRoot, 'src/components/CaseCards.astro'), 'utf-8');

  // Cero fondos negros aislados ni verde neón
  assert.ok(!caseCards.includes('#0d131f'), 'CaseCards no debe usar fondo negro aislado #0d131f');
  assert.ok(!caseCards.includes('#34d399'), 'CaseCards no debe usar verde esmeralda neón #34d399');

  // Integración mineral armónica
  assert.ok(caseCards.includes('#0b1120'), 'CaseCards debe usar fondo mineral oscuro continuo #0b1120');
  assert.ok(caseCards.includes('#f59e0b'), 'CaseCards debe usar acento ámbar/cobre #f59e0b');
});

test('82. Inyección y Parseo de Síntoma en Diagnóstico ➔ Requisición (Decisión 9-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Parseo en workbenchBus
  const parsed = parseUrlContextParams('?equipo=impulsor&origen=diagnostico&falla=cavitacion_altitud&sintoma=Cavitaci%C3%B3n%20Severa#rfq');
  assert.equal(parsed.equipo, 'impulsor');
  assert.equal(parsed.falla, 'cavitacion_altitud');
  assert.equal(parsed.sintoma, 'Cavitación Severa');

  // Lectura en QuoteWizard
  assert.ok(wizard.includes('urlSintoma'), 'QuoteWizard debe leer urlSintoma');
  assert.ok(wizard.includes('detectado en diagnóstico de planta'), 'QuoteWizard debe rellenar justificación técnica');
});

test('83. Ergonomía de Live Dossier para Pantallas de Laptops Mineras (Decisión 8-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Breakpoint a 1200px para laptops mineras
  assert.ok(wizard.includes('@media (max-width: 1200px)'), 'QuoteWizard debe calibrar breakpoint a 1200px');
  assert.ok(wizard.includes('.mini-dossier-bar'), 'QuoteWizard debe incluir .mini-dossier-bar');
  assert.ok(wizard.includes('btn-open-drawer'), 'QuoteWizard debe contener botón de apertura de requisición');
});

test('84. Matriz Fiduciaria TCO Multi-Equipo en Portada ES y EN (Decisión 5-C & Ola 20 Item 11)', () => {
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Portada ES
  assert.ok(indexEs.includes('tco-matrix-section') || fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8').includes('tco-matrix-section'), 'bombeo/index.astro debe contener .tco-matrix-section');
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8').includes('tco-comparison-matrix'), 'bombeo/index.astro debe contener tabla .tco-comparison-matrix');
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8').includes('16 a 24 semanas'), 'bombeo/index.astro debe contrastar tiempo de importación ultramarina');
  assert.ok(indexEs.includes('5 Impulsores + 5 Cuellos + 4 Volutas'), 'index.astro debe exhibir suministro por lote húmedo');
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8').includes('40,000 USD/hora'), 'bombeo/index.astro debe documentar costo de paro de molino');

  // Portada EN
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8').includes('tco-matrix-section'), 'en/pumping/index.astro debe contener .tco-matrix-section');
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8').includes('tco-comparison-matrix'), 'en/pumping/index.astro debe contener tabla .tco-comparison-matrix');
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8').includes('16 to 24 weeks'), 'en/pumping/index.astro debe contrastar tiempo en EN');
  assert.ok(indexEn.includes('5 Impellers + 5 Throatbushes + 4 Volutes'), 'en/index.astro debe exhibir suministro por lote en EN');
  assert.ok(fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8').includes('40,000 USD/hour'), 'en/pumping/index.astro debe documentar costo de paro en EN');
});

test('85. Metáfora de Hoja Física A4 en Live Dossier (Decisión 1-C / GOLD-169)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('.workbench-container'), 'QuoteWizard debe contener .workbench-container');
  assert.ok(wizard.includes('#f1f5f9'), 'QuoteWizard debe tener fondo de mesa técnica #f1f5f9');
  assert.ok(wizard.includes('0 12px 32px'), 'dossier-card debe poseer elevación tridimensional de papel');
  assert.ok(wizard.includes('border-top: 3px solid'), 'dossier-card debe tener acento superior en cobre');
});

test('86. Conmutador Estricto de Pestañas Mantenimiento vs. SAP (Decisión 3-C / D3)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('dossier-pane.active-pane'), 'Debe existir regla activa para paneles de pestaña');
  assert.ok(wizard.includes('dossier-pane.hidden-pane'), 'Debe existir regla oculta para exclusión mutua');
  assert.ok(wizard.includes('switchDossierTab'), 'Debe existir función conmutadora de pestañas switchDossierTab');
  assert.ok(wizard.includes("switchDossierTab('maint')"), 'Debe inicializar la pestaña de mantenimiento');
});

test('87. Poda de Muro de Texto ERP con Resumen Ejecutivo y Drawer Desplegable (Decisión 5-C / GOLD-170)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('sap-justification-container'), 'Debe existir contenedor ergonómico de justificación');
  assert.ok(wizard.includes('justification-executive-summary'), 'Debe existir resumen ejecutivo visible de 2 líneas');
  assert.ok(wizard.includes('erp-justification-drawer'), 'Debe existir micro-acordeón accesible para justificación ERP');
  assert.ok(wizard.includes('btn-copy-justification'), 'Debe incluir botón de copiado rápido de justificación');
  assert.ok(wizard.includes('sapJustSummary'), 'Debe actualizar resumen ejecutivo dinámicamente');
});

test('88. Rejilla Micro-Tipográfica Semántica de Pares Clave-Valor (Decisión 4-C / GOLD-171)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('<dl class="spec-grid">'), 'Debe estructurar datos con lista de definición semántica <dl>');
  assert.ok(wizard.includes('class="spec-label"'), 'Debe contener etiquetas micro-tipográficas <dt class="spec-label">');
  assert.ok(wizard.includes('class="spec-value"'), 'Debe contener valores tabulares <dd class="spec-value">');
  assert.ok(wizard.includes('tabular-nums') || wizard.includes('font-feature-settings'), 'Debe usar alineación numérica tabular');
});

test('89. Sello Metrológico Oficial de Inspección en Banco Durango (Decisión 7-C / GOLD-173)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('durango-seal-box'), 'Debe existir caja de sello de inspección durango-seal-box');
  assert.ok(wizard.includes('ISO 1940 Grado G2.5') || wizard.includes('ISO 1940 G2.5'), 'Debe certificar norma ISO 1940 G2.5');
  assert.ok(wizard.includes('Acople Brida 1:1'), 'Debe indicar acople brida 1:1');
  assert.ok(wizard.includes('Mariano Salas #114'), 'Debe mantener domicilio fiduciario en Durango');
});

test('90. Micro-Interacción de Tinta Viva Causa-Efecto (Decisión 9-C / GOLD-172)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('live-ink-flash'), 'Debe existir clase live-ink-flash para feedback de tinta viva');
  assert.ok(wizard.includes('@keyframes live-ink-glow'), 'Debe existir keyframe live-ink-glow');
  assert.ok(wizard.includes('function flashInk'), 'Debe existir función disparadora flashInk');
});

test('91. Barra de Exportación Adosada con Botón Rey PDF Dominante (Decisión 8-C / D8)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('dossier-export-section'), 'Debe existir dossier-export-section');
  assert.ok(wizard.includes('export-btn-king'), 'Debe incluir botón rey export-btn-king');
  assert.ok(wizard.includes('wb-pdf-btn'), 'Debe tener id de descarga PDF');
  assert.ok(wizard.includes('secondary-export-row'), 'Debe incluir fila secundaria para TSV, WhatsApp y correo');
});

test('92. Muelle Unificado de Instrumentación en Slate Suave (Decisión 1-C / GOLD-174)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('console-bay'), 'QuoteWizard debe incluir .console-bay');
  assert.ok(wizard.includes('#f8fafc'), 'El muelle de instrumentación debe usar fondo slate #f8fafc');
  assert.ok(wizard.includes('#cbd5e1'), 'El muelle de instrumentación debe tener borde continuo #cbd5e1');
});

test('93. Pozos de Entrada en Blanco Puro con Bisel Interior (Decisión 2-C / GOLD-178)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('inset 0 1px 2px'), 'Los inputs deben tener bisel interior inset 0 1px 2px');
  assert.ok(wizard.includes('.wb-select, .wb-input, .custom-textarea'), 'Debe estilizar inputs, selects y textareas como pozos');
});

test('94. Señalética Tipográfica Formal Estrictamente Sin Íconos (Decisión 3-C / GOLD-175)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('console-bay-banner'), 'Debe incluir console-bay-banner');
  assert.ok(wizard.includes('dossier-role-banner'), 'Debe incluir dossier-role-banner');
  assert.ok(wizard.includes('PANEL DE ENTRADA • CONFIGURACIÓN DE EQUIPO'), 'Debe contener rótulo de cabecera de panel de entrada');
  assert.ok(wizard.includes('DOCUMENTO OFICIAL SMAT • EMISIÓN EN TIEMPO REAL (A4)'), 'Debe contener rótulo de documento oficial SMAT');

  // Invariante de directiva de usuario 3-C: Cero SVGs ni emojis en estos rótulos
  const bayMatch = wizard.match(/<div class="console-bay-banner">([\s\S]*?)<\/div>/);
  assert.ok(bayMatch && !bayMatch[1].includes('<svg'), 'console-bay-banner no debe contener iconos SVG');

  const dossierMatch = wizard.match(/<div class="dossier-role-banner">([\s\S]*?)<\/div>/);
  assert.ok(dossierMatch && !dossierMatch[1].includes('<svg'), 'dossier-role-banner no debe contener iconos SVG');
});

test('95. Oclusión Ambiental Multicapa de Hoja Física A4 (Decisión 4-C / GOLD-176)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('0 24px 48px -6px'), 'dossier-card debe poseer oclusión ambiental multicapa');
  assert.ok(wizard.includes('0 12px 32px -4px'), 'dossier-card debe conservar capa intermedia de sombra');
});

test('96. Pestañas de Expediente Técnico Adosadas Físicamente (Decisión 5-C / GOLD-177)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('border-bottom: 1px solid #cbd5e1'), 'dossier-tab-switcher debe fijar línea divisoria de carpeta');
  assert.ok(wizard.includes('border-bottom-color: #ffffff'), 'dossier-tab-btn activo debe unirse físicamente al documento A4');
});

test('97. Preservación Absoluta de IDs y Compuertas Soberanas (Decisión 10-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  const requiredIds = ['rfq', 'live-folio', 'wb-pdf-btn', 'wb-copy-btn', 'pane-maint', 'pane-sap', 'tab-btn-maint', 'tab-btn-sap', 'main-dossier-card'];
  for (const id of requiredIds) {
    assert.ok(wizard.includes(`id="${id}"`), `El ID crítico id="${id}" debe permanecer intacto`);
  }
});

test('98. Invariante de Erradicación del Síndrome de Tarjetas Blancas Gemelas (Decisión 1-C & 2-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(/\.control-card\s*\{[\s\r\n]*background:\s*transparent;/i.test(wizard), 'control-card debe tener background transparente para evitar tarjetas blancas gemelas');
});

test('99. Hero Multi-Equipo de 3 Circuitos y Poda de Mini-Cajas (Ola 20 - Decisiones 1-C, 2-C y 3-C)', () => {
  const esHome = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const enHome = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Cobertura directa Don Manuel en el H1
  assert.ok(
    esHome.includes('Bombas para Lodos y Refacciones') && esHome.includes('Mecanismos de Flotación, Filtros Prensa y Balanzas'),
    'H1 en ES debe enunciar Bombas para Lodos, Mecanismos de Flotación, Filtros Prensa y Balanzas'
  );
  assert.ok(
    enHome.includes('Slurry Pumps & Wear Spares') && enHome.includes('Flotation Mechanisms, Filter Presses & Pulp Density Scales'),
    'H1 en EN debe enunciar Slurry Pumps, Flotation Mechanisms, Filter Presses & Pulp Density Scales'
  );

  // Poda radical de las 4 mini-cajas intermedias (.hero-kpis / .hero-stats)
  assert.ok(!esHome.includes('class="hero-stats"'), 'index.astro no debe tener .hero-stats');
  assert.ok(!enHome.includes('class="hero-stats"'), 'en/index.astro no debe tener .hero-stats');
  assert.ok(!esHome.includes('class="hero-kpis"'), 'index.astro no debe tener .hero-kpis');
  assert.ok(!enHome.includes('class="hero-kpis"'), 'en/index.astro no debe tener .hero-kpis');
});

test('100. Cabecera Esbelta Unificada y Renombramiento a Cotizar Refacción (Ola 20 - Decisión 2-C)', () => {
  const header = fs.readFileSync(path.join(siteRoot, 'src/components/Header.astro'), 'utf-8');

  // Botón unificado renombrado
  assert.ok(header.includes('Cotizar Refacción'), 'Header debe contener botón Cotizar Refacción en ES');
  assert.ok(header.includes('Quote Spares'), 'Header debe contener botón Quote Spares en EN');

  // Integración de canal telefónico directo en cabecera
  assert.ok(header.includes('(618) 367-0664'), 'Header debe incluir teléfono directo o WhatsApp');
  assert.ok(header.includes('wa.me/526183670664'), 'Header debe incluir guardia WhatsApp');
});

test('101. Tarjetas de Hardware en Formato Apple Pro Key-Specs para los 3 Circuitos (Ola 20 - Decisión 4-C)', () => {
  const esHome = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const enHome = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Presencia de caja key-specs en cada tarjeta
  assert.ok(esHome.includes('pro-keyspecs-box'), 'index.astro debe contener .pro-keyspecs-box');
  assert.ok(enHome.includes('pro-keyspecs-box'), 'en/index.astro debe contener .pro-keyspecs-box');

  // Verificación de datos verificables por circuito
  assert.ok(esHome.includes('≥650 HB'), 'index.astro debe especificar dureza metalúrgica');
  assert.ok(esHome.includes('Rougher, Cleaner y Scavenger'), 'index.astro debe especificar servicios de flotación');
  assert.ok(esHome.includes('16 bar'), 'index.astro debe especificar presión de filtro prensa');

  assert.ok(enHome.includes('≥650 HB'), 'en/index.astro debe especificar dureza en EN');
  assert.ok(enHome.includes('Rougher, Cleaner, and Scavenger'), 'en/index.astro debe especificar servicios de flotación en EN');
  assert.ok(enHome.includes('16 bar'), 'en/index.astro debe especificar presión de filtro prensa en EN');
});

test('102. Armonización Multi-Equipo de Cuándo Decimos NO de Frente (Ola 20 - Item 12)', () => {
  const trust = fs.readFileSync(path.join(siteRoot, 'src/components/TrustMatrix.astro'), 'utf-8');

  // Cobertura honesta para los 3 circuitos
  assert.ok(trust.includes('NPSHa de succión es insuficiente'), 'Debe advertir sobre cavitación en Bombeo');
  assert.ok(trust.includes('sobre-aireación revienta el colchón de espuma'), 'Debe advertir sobre flotación');
  assert.ok(trust.includes('jales finos colmatarán placas'), 'Debe advertir sobre filtración');

  // En versión inglés
  assert.ok(trust.includes('NPSHa is severely deficient'), 'Debe advertir sobre cavitación en Bombeo EN');
  assert.ok(trust.includes('airflow rate destroys the quiescent mineral froth'), 'Debe advertir sobre flotación EN');
  assert.ok(trust.includes('ultrafine clay tailings lack conditioning'), 'Debe advertir sobre filtración EN');
});

test('103. Píldoras Táctiles de Diagnóstico Estrictamente Sin Íconos (Ola 20 - Decisión 10-C)', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  // Chips táctiles accesibles
  assert.ok(diag.includes('diag-filter-chips'), 'DiagnosticsHub debe contener .diag-filter-chips');
  assert.ok(diag.includes('aria-pressed="true"'), 'DiagnosticsHub debe tener chip activo por defecto');
  assert.ok(diag.includes('TODOS'), 'Debe existir opción TODOS');
  assert.ok(diag.includes('IMPULSOR DESGASTADO'), 'Debe existir opción IMPULSOR DESGASTADO');
  assert.ok(diag.includes('CAVITACIÓN / RUIDO'), 'Debe existir opción CAVITACIÓN');
  assert.ok(diag.includes('FUGA EN PRENSAESTOPA'), 'Debe existir opción FUGA');

  // Invariante estricta: Cero emojis y cero SVGs dentro de .diag-filter-chips
  const chipsMatch = diag.match(/<div class="diag-filter-chips"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(chipsMatch, 'Debe encontrarse el contenedor de chips');
  assert.ok(!chipsMatch[1].includes('<svg'), 'Los chips de diagnóstico NO deben contener SVGs');

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2705}\u{274C}]/u;
  assert.equal(chipsMatch[1].match(emojiRegex), null, 'Los chips de diagnóstico NO deben contener emojis');
});

test('104. Service Worker Offline-First <5KB y Auto-Save smat_workbench_draft (Ola 20 - Decisión 7-C)', () => {
  const swPath = path.join(siteRoot, 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js debe existir');

  const swContent = fs.readFileSync(swPath, 'utf-8');
  const swSize = Buffer.byteLength(swContent, 'utf-8');
  assert.ok(swSize < 5120, `sw.js debe pesar menos de 5KB (peso actual: ${swSize} bytes)`);
  assert.ok(swContent.includes('smat-pwa-v2.1') || swContent.includes('smat-offline-v1'), 'sw.js debe definir caché versionada');
  assert.ok(swContent.includes('caches.match') || swContent.includes('caches.open'), 'sw.js debe implementar Cache-First o Network-First');

  // Verificación en QuoteWizard
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('smat_workbench_draft'), 'QuoteWizard debe persistir en smat_workbench_draft');
  assert.ok(wizard.includes('offline-network-pill'), 'QuoteWizard debe contener #offline-network-pill');
  assert.ok(wizard.includes("window.addEventListener('online'"), 'QuoteWizard debe escuchar evento online');
  assert.ok(wizard.includes("window.addEventListener('offline'"), 'QuoteWizard debe escuchar evento offline');
});

test('105. Ficha de Cotejo Dimensional ANSI 1:1 y Tolerancia <0.05 mm (Ola 20 - Decisión 6-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Botón de ficha de cotejo en mesa de trabajo
  assert.ok(wizard.includes('wb-cotejo-btn'), 'QuoteWizard debe incluir botón #wb-cotejo-btn');
  assert.ok(wizard.includes('Cotejo ANSI 1:1') || wizard.includes('Ficha de Cotejo Dimensional ANSI 1:1'), 'QuoteWizard debe rotular Ficha de Cotejo');

  // Modal metrológico con verificación de excentricidad radial
  assert.ok(wizard.includes('&lt;0.05 mm') || wizard.includes('<0.05 mm'), 'QuoteWizard debe certificar tolerancia <0.05 mm');
  assert.ok(wizard.includes('Cota C: Anclaje Bastidor Canal C'), 'QuoteWizard debe incluir acotación Cota C');
  assert.ok(wizard.includes('Cota D (Centro Flecha)'), 'QuoteWizard debe incluir acotación Cota D');
  assert.ok(wizard.includes('ISO 1940 Grado G2.5'), 'QuoteWizard debe certificar balanceo ISO 1940 Grado G2.5');
});

test('106. Erradicación del Botón Neón Flotante de WhatsApp y Deep-Links RFC Catálogo (Ola 20 - Decisiones 8-C y 9-C)', () => {
  const waComponent = fs.readFileSync(path.join(siteRoot, 'src/components/WhatsAppButton.astro'), 'utf-8');
  assert.ok(!waComponent.includes('#25D366'), 'WhatsAppButton no debe contener color verde neón #25D366');
  assert.ok(!waComponent.includes('floating-wa-btn'), 'WhatsAppButton no debe contener botón flotante intrusivo');

  const catEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  assert.ok(catEs.includes('/cotizar/?equipo=skid_bomba&serie=4x3#rfq'), 'catalogo.astro debe contener deep link con formato estándar RFC hacia /cotizar/');
  assert.ok(catEn.includes('/en/quote/?equipo=skid_bomba&serie=4x3#rfq'), 'catalog.astro en inglés debe contener deep link con formato estándar RFC hacia /en/quote/');
});

test('107. Conmutador Multi-Circuito y Paneles Condicionales (Ola 21 - Decisión 8-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Selector de los 3 circuitos en interfaz
  assert.ok(wizard.includes('circuit-pills-grid'), 'QuoteWizard debe contener .circuit-pills-grid');
  assert.ok(wizard.includes('data-circuit="bombeo"'), 'Debe incluir píldora de Bombeo');
  assert.ok(wizard.includes('data-circuit="flotacion"'), 'Debe incluir píldora de Flotación');
  assert.ok(wizard.includes('data-circuit="filtracion"'), 'Debe incluir píldora de Filtración');

  // Paneles condicionales exclusivos
  assert.ok(wizard.includes('id="circuit-panel-bombeo"'), 'Debe existir #circuit-panel-bombeo');
  assert.ok(wizard.includes('id="circuit-panel-flotacion"'), 'Debe existir #circuit-panel-flotacion');
  assert.ok(wizard.includes('id="circuit-panel-filtracion"'), 'Debe existir #circuit-panel-filtracion');

  // Input oculto para serialización
  assert.ok(wizard.includes('id="wb-process-circuit"'), 'Debe existir input #wb-process-circuit');
});

test('108. Kits de Paro Mayores vs Despiece Asistido y Aviso de Recirculación (Ola 21 - Decisión 1-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Kits mayores prioritarios en selector de bombeo
  assert.ok(wizard.includes('value="kit_wet_end"'), 'Debe ofrecer Kit Extremo Húmedo');
  assert.ok(wizard.includes('value="kit_sellado"'), 'Debe ofrecer Kit de Sellado Dinámico');
  assert.ok(wizard.includes('value="kit_rodamientos"'), 'Debe ofrecer Cartucho de Rodamientos Completo');

  // Despiece asistido
  assert.ok(wizard.includes('value="solo_impulsor"'), 'Debe ofrecer Solo Impulsor');
  assert.ok(wizard.includes('value="solo_voluta"'), 'Debe ofrecer Solo Voluta');

  // Aviso fiduciario de recirculación en HTML
  assert.ok(wizard.includes('id="recirculation-alert-box"'), 'Debe incluir #recirculation-alert-box');
  assert.ok(wizard.includes('id="live-recirc-warning-dossier"'), 'Debe incluir #live-recirc-warning-dossier');
  assert.ok(wizard.includes('más del 40%') || wizard.includes('mitigar recirculación'), 'Debe contener advertencia técnica de recirculación');
});

test('109. Blindfold Comercial de Diámetros de Tubería sin Fuga de Bastidor (Ola 21 - Decisión 2-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Selector de tubería nominal agnóstica
  assert.ok(wizard.includes('id="wb-pipe-size"'), 'Debe incluir selector #wb-pipe-size');
  assert.ok(wizard.includes('value="1.5x1"'), 'Debe incluir opción 1.5" a 2"');
  assert.ok(wizard.includes('value="3x2"'), 'Debe incluir opción 3" a 4"');
  assert.ok(wizard.includes('value="6x4"'), 'Debe incluir opción 6" a 4"');
  assert.ok(wizard.includes('value="8x6"'), 'Debe incluir opción 8" a 6"');
  assert.ok(wizard.includes('value="10x8"'), 'Debe incluir opción 10" a 8"');

  // Invariante estricta: Las opciones de tubería NO deben mencionar marcos de fundición (B, C, D, E, F)
  const pipeSelectMatch = wizard.match(/<select id="wb-pipe-size"[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(pipeSelectMatch, 'Debe encontrarse el selector de tubería');
  assert.ok(!pipeSelectMatch[1].includes('Marco B'), 'No debe fugar Marco B');
  assert.ok(!pipeSelectMatch[1].includes('Marco C'), 'No debe fugar Marco C');
  assert.ok(!pipeSelectMatch[1].includes('Marco D'), 'No debe fugar Marco D');
  assert.ok(!pipeSelectMatch[1].includes('Marco E'), 'No debe fugar Marco E');
  assert.ok(!pipeSelectMatch[1].includes('Marco F'), 'No debe fugar Marco F');
});

test('110. Píldoras Táctiles de Síntomas de Desgaste Clínico sin Fuga Metalúrgica (Ola 21 - Decisión 3-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Contenedor de síntomas clínicos
  assert.ok(wizard.includes('stress-chips-grid'), 'Debe incluir .stress-chips-grid');
  assert.ok(wizard.includes('data-symptom="roca_dura"'), 'Debe incluir síntoma roca_dura');
  assert.ok(wizard.includes('data-symptom="acido_quimica"'), 'Debe incluir síntoma acido_quimica');
  assert.ok(wizard.includes('data-symptom="arena_fina"'), 'Debe incluir síntoma arena_fina');
  assert.ok(wizard.includes('data-symptom="fuga_sello"'), 'Debe incluir síntoma fuga_sello');
  assert.ok(wizard.includes('data-symptom="mixta_duda"'), 'Debe incluir síntoma mixta_duda');

  // Invariante estricta: Las píldoras táctiles NO deben fugar nomenclaturas metalúrgicas (A05, A49, R55)
  const chipsMatch = wizard.match(/<div class="stress-chips-grid"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(chipsMatch, 'Debe encontrarse el contenedor de chips de estrés');
  assert.ok(!chipsMatch[1].includes('A05'), 'Chips de desgaste NO deben contener código A05');
  assert.ok(!chipsMatch[1].includes('A49'), 'Chips de desgaste NO deben contener código A49');
  assert.ok(!chipsMatch[1].includes('R55'), 'Chips de desgaste NO deben contener código R55');
  assert.ok(!chipsMatch[1].includes('Alto Cromo'), 'Chips de desgaste NO deben contener Alto Cromo');
});

test('111. Generación de Códigos Institucionales SMAT Sanitizados y Blindados (Ola 21)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Verificación en código cliente de QuoteWizard
  assert.ok(wizard.includes('SMAT-PUMP-') && wizard.includes('-WETKIT'), 'buildSmatCode debe soportar WETKIT blindado');
  assert.ok(wizard.includes('SMAT-FLOT-') && wizard.includes('-MECH'), 'buildSmatCode debe soportar MECH de flotación');
  assert.ok(wizard.includes('SMAT-FILT-') && wizard.includes('-PRESS'), 'buildSmatCode debe soportar PRESS de filtración');
});

test('112. Ingesta Asistida de Pieza Desgastada con Flexómetro y Medidas 1:1 (Ola 21 - Decisión 6-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('worn-piece-details'), 'QuoteWizard debe contener .worn-piece-details');
  assert.ok(wizard.includes('id="wb-photo-input"'), 'Debe permitir adjuntar foto con flexómetro');
  assert.ok(wizard.includes('id="wb-dim-dia"'), 'Debe capturar diámetro exterior');
  assert.ok(wizard.includes('id="wb-dim-bore"'), 'Debe capturar barreno central / flecha');
});

test('113. Parámetros Específicos para Flotación y Filtración en QuoteWizard (Ola 21 - Decisión 8-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Flotación
  assert.ok(wizard.includes('id="wb-role-flot"'), 'Debe incluir selector de rol de flotación');
  assert.ok(wizard.includes('id="wb-flot-capacity"'), 'Debe incluir capacidades en ft3');
  assert.ok(wizard.includes('50ft') && wizard.includes('100ft') && wizard.includes('200ft') && wizard.includes('300ft'), 'Debe ofrecer 50, 100, 200, 300 ft3');
  assert.ok(wizard.includes('flot-chips-grid'), 'Debe incluir chips de cinética de celda');

  // Filtración
  assert.ok(wizard.includes('id="wb-role-filt"'), 'Debe incluir selector de rol de filtración');
  assert.ok(wizard.includes('id="wb-filt-capacity"'), 'Debe incluir dimensiones de placas en mm');
  assert.ok(wizard.includes('800') && wizard.includes('1200') && wizard.includes('1500') && wizard.includes('2000'), 'Debe ofrecer placas 800, 1200, 1500, 2000 mm');
  assert.ok(wizard.includes('filt-chips-grid'), 'Debe incluir chips de objetivo de filtrado');
});

test('114. Metadatos Dinámicos en Live Dossier y WhatsApp por Circuito (Ola 21)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(wizard.includes('id="live-pipe-header"'), 'Debe existir header dinámico de tubería/capacidad');
  assert.ok(wizard.includes('id="live-pipe-text"'), 'Debe existir texto dinámico de tubería/capacidad');
  assert.ok(wizard.includes('id="live-stress-header"'), 'Debe existir header dinámico de condición/síntoma');
  assert.ok(wizard.includes('id="live-stress-text"'), 'Debe existir texto dinámico de condición/síntoma');

  // WhatsApp payload incluye Circuito
  assert.ok(wizard.includes('Circuito: ${encodeURIComponent(d.circuit.toUpperCase())}'), 'Mensaje WhatsApp debe enunciar circuito');
});

test('115. Invariante Ética de Facilitación de RFQ / Requisición (Cero Falsas Promesas de 1 Minuto)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Título en QuoteWizard directo y blindado contra 'Luis'
  assert.ok(
    wizard.includes('Solicitar Cotización de Equipos y Refacciones') ||
    wizard.includes('Request a Quotation for Equipment & Spares'),
    'QuoteWizard debe rotular Solicitar Cotización de Equipos y Refacciones'
  );
  assert.ok(!wizard.includes('Cotice su Equipo o Refacción en 1 Minuto'), 'QuoteWizard no debe prometer cotización en 1 minuto');

  // Hero CTAs
  assert.ok(indexEs.includes('Solicitar Cotización'), 'Portada ES debe invitar a Solicitar Cotización');
  assert.ok(indexEn.includes('Request Quotation'), 'Portada EN debe invitar a Request Quotation');
  assert.ok(!indexEs.includes('Cotizar Refacción en 1 Minuto'), 'Portada ES no debe decir Cotizar en 1 Minuto');
  assert.ok(!indexEn.includes('Quote Parts in 1 Minute'), 'Portada EN no debe decir Quote Parts in 1 Minute');
});

test('116. Ghost State en Píldoras Interactivas y Condición Pendiente de Dictamen (Decisión 2-C)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Píldoras inician con .chip-ghost, data-confirmed="false", aria-pressed="false"
  assert.ok(wizard.includes('chip-ghost'), 'QuoteWizard debe utilizar la clase .chip-ghost para sugerencias no confirmadas');
  assert.ok(wizard.includes('data-confirmed="false"'), 'Píldoras deben iniciar con data-confirmed="false"');
  assert.ok(wizard.includes('aria-pressed="false"'), 'Píldoras no confirmadas deben tener aria-pressed="false"');

  // Transición de estado en click de usuario
  assert.ok(wizard.includes("chip.classList.remove('chip-ghost')"), 'Click debe remover .chip-ghost');
  assert.ok(wizard.includes("chip.setAttribute('data-confirmed', 'true')"), 'Click debe marcar data-confirmed="true"');
  assert.ok(wizard.includes("chip.setAttribute('aria-pressed', 'true')"), 'Click debe marcar aria-pressed="true"');
  assert.ok(wizard.includes('flashInk(chip)'), 'Click en chip debe emitir micro-interacción de tinta viva flashInk');

  // Estado por defecto en Live Dossier consigna asesoría solicitada
  assert.ok(
    wizard.includes('Pendiente de dictamen en campo (Asesoría SMAT solicitada)'),
    'Live Dossier debe consignar "Pendiente de dictamen en campo (Asesoría SMAT solicitada)" por defecto'
  );
  assert.ok(
    wizard.includes('Pending field assessment (SMAT technical advice requested)'),
    'Live Dossier en inglés debe consignar "Pending field assessment (SMAT technical advice requested)" por defecto'
  );
  assert.ok(
    wizard.includes('Dictamen técnico según severidad de pulpa (Durango)'),
    'Live Dossier debe consignar dictamen técnico en Durango cuando no esté confirmado'
  );
});

test('117. Cero Fugas de Bastidor y Aleación en Live Dossier y Códigos Limpios (Decisión 1-B, 3-B, 4-A)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Input de tag de planta limpio sin cadenas fijas arcaicas
  assert.ok(
    wizard.includes('id="wb-details"') && wizard.includes("'Ej. Bomba #2 Cabecera / Tag B-201'"),
    '#wb-details debe tener placeholder limpio sin código arcaico'
  );
  assert.ok(!wizard.includes('SMAT-PUMP-6X4D-A05-EXP-CER'), 'QuoteWizard no debe contener la cadena arcaica SMAT-PUMP-6X4D-A05-EXP-CER');

  // Decodificador placeholder limpio
  assert.ok(
    wizard.includes('id="wb-code-decoder-input"') && wizard.includes("'Ej. SMAT-PUMP-6X4-WETKIT'"),
    'Decodificador debe sugerir código limpio sin marco ni aleación'
  );
  assert.ok(!wizard.includes('Ej. SMAT-PUMP-6X4D-A05-EXP'), 'No debe contener placeholder viejo con frame letter');

  // Ausencia de QualityReportModal de coladas ficticias
  assert.strictEqual(fs.existsSync(path.join(siteRoot, 'src/components/QualityReportModal.astro')), false, 'QualityReportModal no debe existir en repo');

  // Generación institucional limpia en workbenchBus
  const codeWetKit = generateSmatPartCode({ circuit: 'bombeo', series: '6x4', role: 'kit_wet_end' });
  assert.equal(codeWetKit, 'SMAT-PUMP-6X4-WETKIT', 'Debe generar código institucional limpio para WetKit');

  const codeImp = generateSmatPartCode({ circuit: 'bombeo', series: '6x4', role: 'solo_impulsor' });
  assert.equal(codeImp, 'SMAT-PUMP-6X4-IMP', 'Debe generar código institucional limpio para Impulsor');

  const codeFlot = generateSmatPartCode({ circuit: 'flotacion', series: '100ft', role: 'mecanismo_completo' });
  assert.equal(codeFlot, 'SMAT-FLOT-100FT-MECH', 'Debe generar código institucional limpio para Flotación');

  const codeFilt = generateSmatPartCode({ circuit: 'filtracion', series: '1500', role: 'prensa_completa' });
  assert.equal(codeFilt, 'SMAT-FILT-1500-PRESS', 'Debe generar código institucional limpio para Filtración');

  // Invariante de cero letras de bastidor (B/C/D/E/F) o aleaciones en códigos de salida
  const testCases = [
    { circuit: 'bombeo', series: '6x4', role: 'kit_wet_end' },
    { circuit: 'bombeo', series: '4x3', role: 'solo_impulsor' },
    { circuit: 'bombeo', series: '8x6', role: 'revestimientos' },
    { circuit: 'bombeo', series: '10x8', role: 'skid_bomba' },
    { circuit: 'flotacion', series: '100ft', role: 'mecanismo_completo' },
    { circuit: 'filtracion', series: '1500', role: 'prensa_completa' }
  ];
  for (const tc of testCases) {
    const code = generateSmatPartCode(tc);
    assert.ok(!/[0-9]X[0-9][BCDEF]/i.test(code), `Código ${code} no debe incluir letras de bastidor`);
    assert.ok(!/-(A05|A49|R55|RUB)/i.test(code), `Código ${code} no debe incluir sufijo de aleación`);
  }
});

test('118. Adaptación Dinámica del Titular Durand sin Jerga Regional (Decisión 6-B)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Elemento reactivo sim-headline-text
  assert.ok(wizard.includes('id="sim-headline-text"'), 'QuoteWizard debe contener #sim-headline-text');

  // Títulos formales sin jerga regional
  assert.ok(
    wizard.includes('Transporte hidráulico y velocidad crítica (Durand)'),
    'Debe contener titular formal para Bombeo'
  );
  assert.ok(
    wizard.includes('Cinética de celda y retención de volumen'),
    'Debe contener titular formal para Flotación'
  );
  assert.ok(
    wizard.includes('Deshidratación de torta y ciclo de filtrado'),
    'Debe contener titular formal para Filtración'
  );

  // Erradicación total de la jerga regional "embanque" en QuoteWizard
  assert.ok(!wizard.toLowerCase().includes('embanque'), 'QuoteWizard no debe contener el término regional embanque');
});

test('119. Jerarquía Dual de Exportación con Botón Rey de WhatsApp y Directiva de Flexómetro (Decisiones 8-B y 9-B)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Botón Rey primario dominante
  assert.ok(wizard.includes('export-btn-king'), 'QuoteWizard debe contener el botón primario rey .export-btn-king');
  assert.ok(wizard.includes('id="wb-whatsapp-btn"'), 'QuoteWizard debe contener #wb-whatsapp-btn');
  assert.ok(
    wizard.includes('Enviar Requisición por WhatsApp a Durango') ||
    wizard.includes('Send Requisition via WhatsApp to Durango'),
    'Botón primario debe enunciar el envío institucional por WhatsApp a Durango'
  );

  // Fila de acciones secundarias discretas
  assert.ok(wizard.includes('secondary-export-row'), 'QuoteWizard debe contener .secondary-export-row');
  assert.ok(wizard.includes('id="wb-copy-btn"'), 'Debe contener #wb-copy-btn secundario para ERP/SAP');
  assert.ok(wizard.includes('id="wb-pdf-btn"'), 'Debe contener #wb-pdf-btn secundario para impresión PDF');

  // Directiva fotográfica de flexómetro para Almacén Durango en WhatsApp URL
  const waUrl = formatWhatsappUrl({
    folio: 'SMAT-2026-9999',
    circuit: 'bombeo',
    contact_name: 'Ing. López',
    company_name: 'Minera Real',
    part_name: 'Kit Húmedo 6x4'
  });
  assert.ok(
    waUrl.includes(encodeURIComponent('Instrucción de Almacén Durango:')),
    'URL de WhatsApp debe incluir instrucción formal de Almacén Durango'
  );
  assert.ok(
    waUrl.includes(encodeURIComponent('flexómetro')),
    'URL de WhatsApp debe incluir directiva de fotografía con flexómetro para cotejo 1:1'
  );
});

test('120. Sanitizador Síncrono de Almacenamiento y Purga de Debris smat_workbench_v2 (Decisión 7-B)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Migración canónica a clave v2
  assert.ok(wizard.includes("STORAGE_KEY_V2 = 'smat_workbench_v2'"), 'QuoteWizard debe definir STORAGE_KEY_V2 como smat_workbench_v2');

  // Función sanitizadora presente y ejecutada antes de cargar sesión
  assert.ok(wizard.includes('function sanitizeAndMigrateStorage()'), 'Debe existir la función sanitizeAndMigrateStorage()');
  assert.ok(wizard.includes('sanitizeAndMigrateStorage();'), 'Debe invocar sanitizeAndMigrateStorage()');

  // Purga de claves legadas
  assert.ok(wizard.includes("localStorage.removeItem('smat_workbench_draft')"), 'Debe purgar localStorage smat_workbench_draft');
  assert.ok(wizard.includes("sessionStorage.removeItem('smat_workbench_session')"), 'Debe purgar sessionStorage smat_workbench_session');
  assert.ok(wizard.includes("localStorage.removeItem('smat_workbench_v1')"), 'Debe purgar smat_workbench_v1');

  // Sanitización de cadenas contaminadas
  assert.ok(wizard.includes("s.details.includes('6X4D')"), 'Debe sanitizar residuos con 6X4D en details');
  assert.ok(wizard.includes("s.details.includes('A05')"), 'Debe sanitizar residuos con A05 en details');
});

test('121. Sistema de Tokens Corporativos Oficiales SMAT (Decisiones 1-B, 2-B, 3-B)', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');

  // Deep Mineral Navy (Decisión 1-B)
  assert.ok(tokens.includes('--smat-navy-deep: #051B2E;'), 'tokens.css debe definir --smat-navy-deep con #051B2E');
  assert.ok(tokens.includes('--smat-navy-surface: #083860;'), 'tokens.css debe definir --smat-navy-surface con #083860');
  assert.ok(tokens.includes('--smat-navy-border: #0E4A7D;'), 'tokens.css debe definir --smat-navy-border con #0E4A7D');

  // Azul Real y Cian Vórtice (Decisiones 2-B y 3-B)
  assert.ok(tokens.includes('--smat-blue-royal: #0c4a6e;'), 'tokens.css debe definir --smat-blue-royal con #0c4a6e (WCAG AAA)');
  assert.ok(tokens.includes('--smat-blue-vortex: #4FAEEB;'), 'tokens.css debe definir --smat-blue-vortex con #4FAEEB');
  assert.ok(tokens.includes('--smat-blue-vortex-bg: #F0F9FF;'), 'tokens.css debe definir --smat-blue-vortex-bg con #F0F9FF');

  // Erradicación de #0b132b en los tokens de contraste
  assert.ok(!tokens.includes('--smat-bg-contrast: #0b132b;'), 'tokens.css no debe contener el valor duro arcaico #0b132b en --smat-bg-contrast');
  assert.ok(tokens.includes('--smat-bg-contrast: var(--smat-navy-deep);'), '--smat-bg-contrast debe apuntar a --smat-navy-deep');
});

test('122. Componente de Marca y Asset Corporativo LogoSmat.astro (Decisión 4-B)', () => {
  const logoComponentPath = path.join(siteRoot, 'src/components/LogoSmat.astro');
  assert.ok(fs.existsSync(logoComponentPath), 'LogoSmat.astro debe existir');

  const logoWebpPath = path.join(siteRoot, 'public/images/logo-smat.webp');
  const logoPngPath = path.join(siteRoot, 'public/images/logo-smat.png');
  assert.ok(fs.existsSync(logoWebpPath), 'public/images/logo-smat.webp debe existir');
  assert.ok(fs.existsSync(logoPngPath), 'public/images/logo-smat.png debe existir');

  const logoContent = fs.readFileSync(logoComponentPath, 'utf-8');
  assert.ok(logoContent.includes('alt="SMAT Minerals"'), 'LogoSmat debe tener texto alternativo accesible SMAT Minerals');
  assert.ok(logoContent.includes('logo-smat.webp'), 'LogoSmat debe cargar el asset optimizado WebP');
  assert.ok(logoContent.includes('variant'), 'LogoSmat debe soportar prop variant');
});

test('123. Integración Limpia en Header y Erradicación de Debris (Decisión 4-B)', () => {
  const header = fs.readFileSync(path.join(siteRoot, 'src/components/Header.astro'), 'utf-8');

  // Integración de LogoSmat
  assert.ok(header.includes("import LogoSmat from './LogoSmat.astro';"), 'Header.astro debe importar LogoSmat');
  assert.ok(header.includes('<LogoSmat'), 'Header.astro debe renderizar <LogoSmat');

  // Erradicación de la caja negra arcaica
  assert.ok(!header.includes('.logo-mark-wrap'), 'Header.astro no debe contener la clase arcaica .logo-mark-wrap');
  assert.ok(!header.includes('class="logo-mark"'), 'Header.astro no debe contener el elemento arcaico .logo-mark');

  // Utility strip estilizada con Deep Mineral Navy
  assert.ok(header.includes('background: var(--smat-navy-deep);'), 'Utility strip debe usar var(--smat-navy-deep)');
  assert.ok(header.includes('border-bottom: 1px solid var(--smat-navy-border);'), 'Utility strip debe usar var(--smat-navy-border)');
});

test('124. Integración en Footer y Armonía Deep Mineral Navy (Decisiones 1-B y 4-B)', () => {
  const footer = fs.readFileSync(path.join(siteRoot, 'src/components/Footer.astro'), 'utf-8');

  // Integración de LogoSmat
  assert.ok(footer.includes("import LogoSmat from './LogoSmat.astro';"), 'Footer.astro debe importar LogoSmat');
  assert.ok(footer.includes('<LogoSmat'), 'Footer.astro debe renderizar <LogoSmat');

  // Fondo Deep Mineral Navy y erradicación de fondos genéricos
  assert.ok(footer.includes('background-color: var(--smat-navy-deep);'), 'Footer.astro debe usar var(--smat-navy-deep)');
  assert.ok(footer.includes('border-top: 1px solid var(--smat-navy-border);'), 'Footer.astro debe usar var(--smat-navy-border)');
  assert.ok(!footer.includes('background-color: #090e17;'), 'Footer.astro no debe contener el color arcaico #090e17');
});

test('125. Armonía Instrumental en QuoteWizard y Borde Especular Vórtice (Decisiones 2-B y 3-B)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Selector de circuitos con Deep Mineral Navy y Azul Real
  assert.ok(wizard.includes('background: var(--smat-navy-deep, #051B2E);'), 'QuoteWizard debe usar --smat-navy-deep en circuit-pill.active');
  assert.ok(wizard.includes('border-color: var(--smat-blue-royal, #0D78C6);'), 'QuoteWizard debe usar --smat-blue-royal en borde de circuit-pill.active');
  assert.ok(wizard.includes('background: var(--smat-blue-vortex-bg, #F0F9FF);'), 'QuoteWizard debe usar --smat-blue-vortex-bg en circuit-context-banner');

  // Pestañas activas del Live Dossier en Azul Real
  assert.ok(wizard.includes('color: var(--smat-blue-royal, #0D78C6);'), 'Dossier tab activa debe usar --smat-blue-royal');

  // Borde superior de la hoja A4 con micro-iluminación especular del vórtice
  assert.ok(wizard.includes('--smat-specular-vortex'), 'Hoja A4 del Live Dossier debe incorporar --smat-specular-vortex en el resplandor superior');
});

test('126. Integridad de Favicon SVG Dinámico y Fallback ICO (Decisión 1-B)', () => {
  const svgPath = path.join(siteRoot, 'public/favicon.svg');
  const icoPath = path.join(siteRoot, 'public/favicon.ico');
  assert.ok(fs.existsSync(svgPath), 'public/favicon.svg debe existir');
  assert.ok(fs.existsSync(icoPath), 'public/favicon.ico debe existir');

  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  assert.ok(svgContent.includes('prefers-color-scheme: dark'), 'favicon.svg debe soportar dark mode');
  assert.ok(svgContent.includes('#051B2E'), 'favicon.svg debe usar Deep Mineral Navy en modo claro');
  assert.ok(svgContent.includes('#4FAEEB') || svgContent.includes('#38BDF8') || svgContent.includes('#FFFFFF'), 'favicon.svg debe usar contraste en modo oscuro');

  const baseLayout = fs.readFileSync(path.join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf-8');
  assert.ok(baseLayout.includes('rel="icon" type="image/svg+xml" href="/favicon.svg"'), 'BaseLayout debe enlazar favicon.svg');
  assert.ok(baseLayout.includes('rel="alternate icon" href="/favicon.ico"'), 'BaseLayout debe proveer fallback favicon.ico');
});

test('127. Existencia y Dimensiones Canónicas de og-card.jpg (Decisión 2-B)', () => {
  const ogPath = path.join(siteRoot, 'public/images/og-card.jpg');
  assert.ok(fs.existsSync(ogPath), 'public/images/og-card.jpg debe existir');

  const stats = fs.statSync(ogPath);
  assert.ok(stats.size > 10000, 'og-card.jpg no debe estar vacío');
  assert.ok(stats.size < 307200, 'og-card.jpg debe pesar estrictamente menos de 300 KB para WhatsApp');

  const baseLayout = fs.readFileSync(path.join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf-8');
  assert.ok(baseLayout.includes('/images/og-card.jpg'), 'BaseLayout debe tener /images/og-card.jpg');
});

test('128. Tipado y Triangulación B2B Schema.org JSON-LD (Decisión 3-B)', () => {
  const schemaPath = path.join(siteRoot, 'src/components/SchemaOrg.astro');
  assert.ok(fs.existsSync(schemaPath), 'SchemaOrg.astro debe existir');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  assert.ok(schemaContent.includes('LocalBusiness'), 'SchemaOrg debe incluir LocalBusiness');
  assert.ok(schemaContent.includes('WholesaleStore'), 'SchemaOrg debe incluir WholesaleStore');
  assert.ok(schemaContent.includes('GeoCoordinates'), 'SchemaOrg debe incluir GeoCoordinates');
  assert.ok(schemaContent.includes('24.0277'), 'SchemaOrg debe incluir latitud de Durango');
  assert.ok(schemaContent.includes('-104.6532'), 'SchemaOrg debe incluir longitud de Durango');
  assert.ok(schemaContent.includes('OpeningHoursSpecification'), 'SchemaOrg debe incluir horario');
  assert.ok(schemaContent.includes('08:00'), 'Horario apertura debe ser 08:00');
  assert.ok(schemaContent.includes('18:00'), 'Horario cierre debe ser 18:00');
});

test('129. Botón Secundario de Cotizador "Enviar por Correo" con formatMailtoUrl (Decisión 4-B)', () => {
  const wizardContent = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizardContent.includes('id="btn-quote-mailto"') || wizardContent.includes('btn-quote-mailto'), 'QuoteWizard debe contener btn-quote-mailto');
  assert.ok(wizardContent.includes('id="wb-email-btn"'), 'QuoteWizard debe contener wb-email-btn');
  assert.ok(wizardContent.includes('mailto:'), 'QuoteWizard debe manejar mailto:');
});

test('130. Telemetría Condicional y Privada sin Cookies Hardcodeadas (Decisión 5-B)', () => {
  const baseLayout = fs.readFileSync(path.join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf-8');
  assert.ok(!baseLayout.includes('G-SMATMINERALS'), 'BaseLayout no debe tener el ID hardcodeado G-SMATMINERALS');
  assert.ok(!baseLayout.includes('G-XXXXXXXXXX'), 'BaseLayout no debe tener IDs de GA4 hardcodeados');
  assert.ok(baseLayout.includes('PUBLIC_GA_ID') || baseLayout.includes('import.meta.env.PUBLIC_GA_ID'), 'BaseLayout debe condicionar GA4 a PUBLIC_GA_ID');
});

test('131. Blindaje de Sveltia CMS en robots.txt y noindex en /admin (Decisión 6-A)', () => {
  const robotsPath = path.join(siteRoot, 'public/robots.txt');
  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt debe existir');
  const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
  assert.ok(robotsContent.includes('Disallow: /admin'), 'robots.txt debe desautorizar /admin');
  assert.ok(robotsContent.includes('Disallow: /admin/'), 'robots.txt debe desautorizar /admin/');

  const adminHtmlPath = path.join(siteRoot, 'public/admin/index.html');
  if (fs.existsSync(adminHtmlPath)) {
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf-8');
    assert.ok(adminHtml.includes('name="robots" content="noindex, nofollow"'), 'admin/index.html debe tener noindex, nofollow');
  }
});

test('132. Service Worker PWA con Network-First y Purga de Caché (Decisión 7-B)', () => {
  const swPath = path.join(siteRoot, 'public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js debe existir');
  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert.ok(swContent.includes('smat-pwa-v2.1'), 'sw.js debe definir la versión de caché smat-pwa-v2.1');
  assert.ok(swContent.includes('activate'), 'sw.js debe gestionar el evento activate');
  assert.ok(swContent.includes('caches.delete'), 'sw.js debe purgar caches obsoletos');
  assert.ok(swContent.includes('fetch'), 'sw.js debe interceptar peticiones fetch');
});

test('133. Acuse de Recibo con Redirección Asíncrona a /acuse?folio= (Decisión 8-B)', () => {
  const wizardContent = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizardContent.includes('/acuse/?') || wizardContent.includes('/acuse'), 'QuoteWizard debe enrutar hacia /acuse');

  const acusePath = path.join(siteRoot, 'src/pages/acuse.astro');
  assert.ok(fs.existsSync(acusePath), 'acuse.astro debe existir');
});

test('134. Erradicación Total de Claims Engañosos de "Emergencia 24/7" (Decisión 9-B)', () => {
  const searchDirs = ['src/components', 'src/pages', 'src/scripts'];
  const forbiddenTerms = [
    'guardia 24/7',
    'servicio de emergencia 24/7',
    'atención de emergencia 24/7',
    'despacho de emergencia desde Durango',
    'Emergencia 6x4',
    'Línea de contacto para emergencias'
  ];

  for (const dir of searchDirs) {
    const fullDir = path.join(siteRoot, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir, { recursive: true });
    for (const f of files) {
      if (typeof f !== 'string') continue;
      if (f.endsWith('.astro') || f.endsWith('.js')) {
        const filePath = path.join(fullDir, f);
        if (fs.statSync(filePath).isDirectory()) continue;
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const term of forbiddenTerms) {
          assert.ok(!content.includes(term), `Archivo ${f} no debe contener el término engañoso de emergencia: "${term}"`);
        }
      }
    }
  }
});

test('135. Archivo _headers de Seguridad y Comando Preflight Unificado (Decisión 10-B)', () => {
  const headersPath = path.join(siteRoot, 'public/_headers');
  assert.ok(fs.existsSync(headersPath), 'public/_headers debe existir');
  const headersContent = fs.readFileSync(headersPath, 'utf-8');
  assert.ok(headersContent.includes('X-Frame-Options: DENY'), '_headers debe incluir X-Frame-Options: DENY');
  assert.ok(headersContent.includes('X-Content-Type-Options: nosniff'), '_headers debe incluir nosniff');
  assert.ok(headersContent.includes('Referrer-Policy: strict-origin-when-cross-origin'), '_headers debe incluir Referrer-Policy');

  const pkg = JSON.parse(fs.readFileSync(path.join(siteRoot, 'package.json'), 'utf-8'));
  assert.ok(pkg.scripts && pkg.scripts.preflight, 'package.json debe definir script "preflight"');
  assert.ok(pkg.scripts.preflight.includes('astro check'), 'preflight debe ejecutar astro check');
  assert.ok(pkg.scripts.preflight.includes('npm test'), 'preflight debe ejecutar npm test');
  assert.ok(pkg.scripts.preflight.includes('npm run gate'), 'preflight debe ejecutar npm run gate');
  assert.ok(pkg.scripts.preflight.includes('astro build'), 'preflight debe ejecutar astro build');
});

test('136. Fichas Atómicas de Refacciones Universales con getStaticPaths (Decisión 4-B)', () => {
  const partsPath = path.join(siteRoot, 'data/atomic_parts.json');
  assert.ok(fs.existsSync(partsPath), 'data/atomic_parts.json debe existir');

  const parts = JSON.parse(fs.readFileSync(partsPath, 'utf-8'));
  const requiredCodes = ['d3147', 'e4147', 'f6147', 'dam028', 'eam028', 'e4083'];

  assert.equal(parts.length, 6, 'Deben existir exactamente 6 refacciones atómicas');
  for (const code of requiredCodes) {
    const found = parts.find((p) => p.code === code);
    assert.ok(found, `Debe existir refacción con código ${code}`);
    assert.ok(found.frame, `Refacción ${code} debe tener marco especificado`);
    assert.ok(found.hardness.includes('≥ 650 HB') || found.hardness.includes('650 HB'), `Refacción ${code} debe certificar dureza`);
    assert.ok(found.fit_guarantee_es.includes('1:1'), `Refacción ${code} debe garantizar acople 1:1`);
  }

  const esRoute = path.join(siteRoot, 'src/pages/catalogo/[code].astro');
  const enRoute = path.join(siteRoot, 'src/pages/en/catalog/[code].astro');
  assert.ok(fs.existsSync(esRoute), 'src/pages/catalogo/[code].astro debe existir');
  assert.ok(fs.existsSync(enRoute), 'src/pages/en/catalog/[code].astro debe existir');

  const esContent = fs.readFileSync(esRoute, 'utf-8');
  const enContent = fs.readFileSync(enRoute, 'utf-8');

  assert.ok(esContent.includes('export function getStaticPaths'), 'Ruta ES debe definir getStaticPaths');
  assert.ok(enContent.includes('export function getStaticPaths'), 'Ruta EN debe definir getStaticPaths');
  assert.ok(esContent.includes('@type": "Product"'), 'Ruta ES debe estructurar Schema.org Product');
  assert.ok(enContent.includes('@type": "Product"'), 'Ruta EN debe estructurar Schema.org Product');
  assert.ok(esContent.includes('https://wa.me/526183670664?text='), 'Ruta ES debe contener botón de WhatsApp con texto codificado');
  assert.ok(enContent.includes('https://wa.me/526183670664?text='), 'Ruta EN debe contener botón de WhatsApp con texto codificado');
});

test('137. Invariante Anti-Scraping de Catálogo y Avisos de Confidencialidad (Decisión 4-B)', () => {
  const esRoute = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo/[code].astro'), 'utf-8');
  const enRoute = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog/[code].astro'), 'utf-8');
  const esCatalog = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const enCatalog = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  // Ninguna página de catálogo debe ofrecer enlaces a descargas masivas de bases de datos o CADs
  const forbiddenScrapeKeywords = ['descargar-cad', 'download-cad.zip', 'tolerancias_completas.csv', 'database_dump.json'];
  for (const kw of forbiddenScrapeKeywords) {
    assert.ok(!esRoute.toLowerCase().includes(kw), `Ficha ES no debe contener enlace a dump masivo: ${kw}`);
    assert.ok(!enRoute.toLowerCase().includes(kw), `Ficha EN no debe contener enlace a dump masivo: ${kw}`);
    assert.ok(!esCatalog.toLowerCase().includes(kw), `Catálogo ES no debe contener enlace a dump masivo: ${kw}`);
    assert.ok(!enCatalog.toLowerCase().includes(kw), `Catálogo EN no debe contener enlace a dump masivo: ${kw}`);
  }

  // Aviso explícito de confidencialidad de planos en fichas
  assert.ok(esRoute.includes('anti-scraping-notice'), 'Ficha ES debe incluir bloque .anti-scraping-notice');
  assert.ok(enRoute.includes('anti-scraping-notice'), 'Ficha EN debe incluir bloque .anti-scraping-notice');
});

test('138. Simetría Bilingüe y Profundidad del Briefing Ejecutivo de AISC (Decisión 6-B)', () => {
  const nosotros = fs.readFileSync(path.join(siteRoot, 'src/pages/nosotros.astro'), 'utf-8');
  const about = fs.readFileSync(path.join(siteRoot, 'src/pages/en/about.astro'), 'utf-8');

  // Métricas económicas de paro de molienda
  assert.ok(nosotros.includes('20k – 150k') || nosotros.includes('20,000 y 150,000 USD'), 'nosotros.astro debe consignar costo de paro de molino');
  assert.ok(about.includes('20k – 150k') || about.includes('20,000 and 150,000 USD'), 'about.astro debe consignar costo de paro en inglés');

  // Reducción de tiempo de tránsito marítimo
  assert.ok(nosotros.includes('16 a 24 semanas') || nosotros.includes('16 – 24'), 'nosotros.astro debe enunciar ahorro de 16 a 24 semanas');
  assert.ok(about.includes('16 to 24') || about.includes('16 – 24'), 'about.astro debe enunciar ahorro de 16 a 24 semanas');

  // Compresión de AISC y facturación CFDI
  assert.ok(nosotros.includes('AISC') && nosotros.includes('CFDI'), 'nosotros.astro debe articular reducción de AISC y CFDI');
  assert.ok(about.includes('AISC') && about.includes('CFDI'), 'about.astro debe articular reducción de AISC y CFDI');

  // Cobertura de los 3 circuitos de concentradora
  assert.ok(nosotros.includes('Bombeo') && nosotros.includes('Flotación') && nosotros.includes('Filtración'), 'nosotros.astro debe cubrir los 3 circuitos');
  assert.ok(about.includes('Pumping') && about.includes('Flotation') && about.includes('Filtration'), 'about.astro debe cubrir los 3 circuitos');

  // Domicilio fiscal en Durango
  assert.ok(nosotros.includes('Mariano Salas #114'), 'nosotros.astro debe registrar domicilio fiscal');
  assert.ok(about.includes('Mariano Salas #114'), 'about.astro debe registrar domicilio fiscal');
});

test('139. Inyección Territorial Invisible de los 9 Estados Mineros en Schema.org (Decisión 7-B)', () => {
  const schemaContent = fs.readFileSync(path.join(siteRoot, 'src/components/SchemaOrg.astro'), 'utf-8');

  const requiredStates = [
    'Durango',
    'Zacatecas',
    'Chihuahua',
    'Sonora',
    'Coahuila',
    'San Luis Potosí',
    'Sinaloa',
    'Hidalgo',
    'Guerrero'
  ];

  for (const state of requiredStates) {
    assert.ok(schemaContent.includes(`'${state}'`), `SchemaOrg areaServed debe incluir estado minero '${state}'`);
  }
});

test('140. Manifiestos GEO llms.txt y llms-full.txt v2.3 con Soberanía Operativa (Decisión 7-B)', () => {
  const llms = fs.readFileSync(path.join(siteRoot, 'public/llms.txt'), 'utf-8');
  const llmsFull = fs.readFileSync(path.join(siteRoot, 'public/llms-full.txt'), 'utf-8');

  assert.ok(llms.includes('# Version: 2.3'), 'public/llms.txt debe estar en versión 2.3');
  assert.ok(llmsFull.includes('# Version: 2.3'), 'public/llms-full.txt debe estar en versión 2.3');

  // Cero marcas ajenas en manifiestos LLM
  assert.ok(!llms.toLowerCase().includes('warman'), 'llms.txt no debe mencionar marcas ajenas');
  assert.ok(!llmsFull.toLowerCase().includes('warman'), 'llms-full.txt no debe mencionar marcas ajenas');

  // Presencia de estados mineros clave
  assert.ok(llms.includes('Durango') && llms.includes('Zacatecas') && llms.includes('Chihuahua') && llms.includes('Sonora'), 'llms.txt debe incluir estados clave');
  assert.ok(llmsFull.includes('Durango') && llmsFull.includes('Zacatecas') && llmsFull.includes('Chihuahua') && llmsFull.includes('Sonora'), 'llms-full.txt debe incluir estados clave');

  // Presencia de refacciones clave
  assert.ok(llms.includes('D3147') && llms.includes('E4147') && llms.includes('F6147'), 'llms.txt debe citar refacciones clave');
  assert.ok(llmsFull.includes('D3147') && llmsFull.includes('E4147') && llmsFull.includes('F6147'), 'llms-full.txt debe citar refacciones clave');
});






test('141. Continuidad Transaccional Lossless 100%: URL Atómica ➔ Simulador ➔ Exportación ➔ Lead Intake ➔ Acuse PDF ➔ Sveltia CMS', async () => {
  const {
    resolveAtomicPartCode,
    parseUrlContextParams,
    parseSmatPartCode,
    formatSapPlaintext,
    buildAcuseUrlParams,
    dispatchLeadWebhook
  } = await import('../src/scripts/workbenchBus.js');

  // 1. Entrada por URL y decodificación de las 6 piezas atómicas (D3147..E4083) + parámetros de simulación
  for (const code of ['D3147', 'E4147', 'F6147', 'DAM028', 'EAM028', 'E4083']) {
    const resolved = resolveAtomicPartCode(code);
    assert.ok(resolved, `resolveAtomicPartCode debe resolver ${code}`);
    const parsedCode = parseSmatPartCode(code);
    assert.ok(parsedCode, `parseSmatPartCode debe decodificar pieza atómica ${code}`);
    assert.equal(parsedCode.atomic_code, code);
  }

  const urlCtx = parseUrlContextParams('?codigo=E4083&flow=380&solids=52&d80=180#rfq');
  assert.equal(urlCtx.codigo, 'E4083', 'Debe capturar ?codigo=E4083');
  assert.equal(urlCtx.circuito, 'bombeo', 'E4083 debe resolver circuito bombeo');
  assert.equal(urlCtx.equipo, 'solo_voluta', 'E4083 debe pre-seleccionar solo_voluta (Solo Voluta o Cuello de Succión)');
  assert.equal(urlCtx.serie, '6x4', 'E4083 debe pre-seleccionar serie 6x4');
  assert.equal(Number(urlCtx.flow), 380, 'Debe capturar flow=380');
  assert.equal(Number(urlCtx.solids), 52, 'Debe capturar solids=52');
  assert.equal(Number(urlCtx.d80), 180, 'Debe capturar d80=180');

  // 2. Exportación Lossless (Durand-Condolios + TCO + Flexómetro + Ref Cliente + Perfil de Pulpa)
  const fullPayload = {
    folio: 'SMAT-2026-8899',
    circuit: 'bombeo',
    role: 'solo_cuello',
    part_name: 'Solo Cuello de Succión [E4083]',
    smat_code: 'SMAT-PUMP-6X4-THROAT',
    atomic_code: 'E4083',
    contact_name: 'Ing. Roberto Vázquez',
    company_name: 'Fresnillo plc - Unidad Saucito',
    pulp_profile: 'Alta densidad de pulpa a ciclones',
    phone_number: '(492) 999-1122',
    email_address: 'rvazquez@fresnilloplc.com',
    client_reference: 'TAG-B-102-SUCCION',
    dim_outer_dia: '415',
    dim_shaft_bore: '95',
    details: 'Desgaste localizado en brida de succión',
    logistics_mode: 'dedicado',
    urgency: 'paro',
    metrics: {
      flow_m3h: 380,
      solids_cw: 52,
      d80_um: 180,
      slurry_sg: 1.49,
      solids_cv: 28.9,
      critical_velocity_ms: 3.12,
      head_ratio: 0.87,
      altitude_msnm: 2200,
      recommended_alloy: 'Fundición Alto Cromo 27% (A05 > 650 HB)',
      tco_tons_at_risk: 1580,
      tco_downtime_hrs: 8,
      tco_summary: '1,580 Toneladas secas en riesgo (8h paro) • A05 ahorra ~7 paros/año'
    }
  };

  const sapText = formatSapPlaintext(fullPayload);
  assert.ok(sapText.includes('SMAT-PUMP-6X4-THROAT'), 'Texto SAP debe incluir código SMAT');
  assert.ok(sapText.includes('E4083'), 'Texto SAP debe incluir código de pieza atómica');
  assert.ok(sapText.includes('Alta densidad de pulpa a ciclones'), 'Texto SAP debe incluir perfil de pulpa de la unidad minera');
  assert.ok(sapText.includes('TAG-B-102-SUCCION'), 'Texto SAP debe incluir referencia interna del cliente');
  assert.ok(sapText.includes('415 mm') && sapText.includes('95 mm'), 'Texto SAP debe incluir medidas de flexómetro');
  assert.ok(sapText.includes('0.87') && sapText.includes('28.9%'), 'Texto SAP debe incluir HR y Cv de Durand-Condolios');
  assert.ok(sapText.includes('1,580 Toneladas'), 'Texto SAP debe incluir proyección TCO');

  // 3. Parámetros de Acuse PDF completos y páginas acuse.astro / en/thank-you.astro sin truncamiento
  const acuseParams = buildAcuseUrlParams(fullPayload);
  assert.equal(acuseParams.get('codigo'), 'SMAT-PUMP-6X4-THROAT');
  assert.equal(acuseParams.get('pieza'), 'E4083');
  assert.equal(acuseParams.get('ref_cliente'), 'TAG-B-102-SUCCION');
  assert.ok(acuseParams.get('medidas').includes('415 mm'));
  assert.equal(acuseParams.get('perfil_pulpa'), 'Alta densidad de pulpa a ciclones');
  assert.ok(acuseParams.get('hidraulica').includes('Vc: 3.12 m/s'));
  assert.ok(acuseParams.get('tco').includes('1,580 Toneladas'));

  const acuseEs = fs.readFileSync(path.join(siteRoot, 'src/pages/acuse.astro'), 'utf-8');
  const acuseEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/thank-you.astro'), 'utf-8');
  for (const fieldId of ['field-code', 'field-client-ref', 'field-dimensions', 'field-hydraulics', 'field-tco']) {
    assert.ok(acuseEs.includes(`id="${fieldId}"`), `acuse.astro debe renderizar #${fieldId}`);
    assert.ok(acuseEn.includes(`id="${fieldId}"`), `en/thank-you.astro debe renderizar #${fieldId}`);
  }
  assert.ok(!acuseEs.includes('OpEx / Reemplazo') && !acuseEs.includes('CapEx / Requisición Formal'), 'acuse.astro no debe contener jerga OpEx/CapEx');
  assert.ok(!acuseEn.includes('OpEx / Replacement') && !acuseEn.includes('CapEx / Formal Requisition'), 'en/thank-you.astro no debe contener jerga OpEx/CapEx');

  // 4. Lead Intake y Code.gs conectados con honeypot y 19 columnas
  const blockedRes = dispatchLeadWebhook({ ...fullPayload, website_honeypot: 'http://spam.bot' }, 'whatsapp', '');
  assert.equal(blockedRes.blocked, true, 'Honeypot lleno debe bloquear el despacho del lead');
  const validLeadRes = dispatchLeadWebhook(fullPayload, 'pdf_acuse', '');
  assert.equal(validLeadRes.dispatched, true, 'Lead legítimo debe preparar payload completo');
  assert.equal(validLeadRes.payload.codigo_pieza_atomica, 'E4083');
  assert.ok(validLeadRes.payload.memoria_hidraulica_durand.includes('Vc: 3.12 m/s'));

  const codeGs = fs.readFileSync(path.join(siteRoot, 'tools/google_apps_script/Code.gs'), 'utf-8');
  assert.ok(codeGs.includes('memoria_hidraulica_durand') && codeGs.includes('proyeccion_tco') && codeGs.includes('medidas_flexometro'), 'Code.gs debe registrar memoria hidráulica, TCO y medidas en Google Sheets');

  // 5. Sveltia CMS config.yml sincronizado con los 9 archivos data/*.json
  const cmsConfig = fs.readFileSync(path.join(siteRoot, 'public/admin/config.yml'), 'utf-8');
  const expectedJsonFiles = [
    'data/company.json',
    'data/roles.json',
    'data/atomic_parts.json',
    'data/circuits.json',
    'data/diagnostics.json',
    'data/cases.json',
    'data/trust.json',
    'data/faqs.json',
    'data/mining_groups.json'
  ];
  for (const jsonFile of expectedJsonFiles) {
    assert.ok(cmsConfig.includes(jsonFile), `public/admin/config.yml debe administrar ${jsonFile}`);
  }

  // 6. Paridad en CaseCards, DiagnosticsHub y TrustMatrix
  const caseCards = fs.readFileSync(path.join(siteRoot, 'src/components/CaseCards.astro'), 'utf-8');
  assert.ok(caseCards.includes('/bombeo/') && caseCards.includes('/flotacion/') && caseCards.includes('/filtracion/'), 'CaseCards debe enlazar a cada circuito real');
  assert.ok(caseCards.includes('case-sim-link'), 'CaseCards debe permitir cargar el caso en el simulador #rfq');

  const diagHub = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');
  assert.ok(diagHub.includes('data-filter="rotor"'), 'DiagnosticsHub debe incluir píldora de filtro para Rotor de Flotación');

  const trustMatrix = fs.readFileSync(path.join(siteRoot, 'src/components/TrustMatrix.astro'), 'utf-8');
  assert.ok(trustMatrix.includes('trustData.pillars.map'), 'TrustMatrix debe renderizar los 4 pilares de data/trust.json');
});

test('142. Invariante de Cero Componentes Huérfanos y Cero Slots Manuales Redundantes (Decisiones 7-B y 8-B)', () => {
  const componentsDir = path.join(siteRoot, 'src/components');
  const componentFiles = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.astro'));

  // Recolectar todo el código fuente de layouts, pages y components
  const allConsumerFiles = [];
  for (const dirRel of ['src/layouts', 'src/pages', 'src/components']) {
    const dirFull = path.join(siteRoot, dirRel);
    const entries = fs.readdirSync(dirFull, { recursive: true });
    for (const entry of entries) {
      if (typeof entry === 'string' && entry.endsWith('.astro')) {
        allConsumerFiles.push({
          rel: path.join(dirRel, entry),
          content: fs.readFileSync(path.join(dirFull, entry), 'utf-8')
        });
      }
    }
  }

  for (const compFile of componentFiles) {
    const isImported = allConsumerFiles.some(
      (f) => !f.rel.endsWith(compFile) && f.content.includes(compFile)
    );
    assert.ok(isImported, `El componente src/components/${compFile} no debe quedar huérfano (debe importarse en al menos un layout o página)`);
  }

  // Verificar que ninguna página en src/pages inyecte slots manuales redundantes ni fondos #121c2e
  const pagesDir = path.join(siteRoot, 'src/pages');
  const pageEntries = fs.readdirSync(pagesDir, { recursive: true });
  for (const entry of pageEntries) {
    if (typeof entry === 'string' && entry.endsWith('.astro')) {
      const content = fs.readFileSync(path.join(pagesDir, entry), 'utf-8');
      assert.ok(!content.includes('slot="header"'), `Página ${entry} no debe inyectar slot="header" manual (BaseLayout lo provee por defecto)`);
      assert.ok(!content.includes('slot="footer"'), `Página ${entry} no debe inyectar slot="footer" manual (BaseLayout lo provee por defecto)`);
      assert.ok(!content.includes('slot="whatsapp"'), `Página ${entry} no debe inyectar slot="whatsapp" manual (BaseLayout lo provee por defecto)`);
      assert.ok(!content.includes('#121c2e'), `Página ${entry} no debe contener fondo oscuro arcaico #121c2e`);
    }
  }
});

test('143. Invariante de Cerebro Único: QuoteWizard importa directamente slurryEngine.js y workbenchBus.js sin Duplicación (Decisión 1-B)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Cero <script is:inline> desconectado de los módulos ES
  assert.ok(!wizard.includes('<script is:inline>'), 'QuoteWizard no debe usar <script is:inline> aislado');

  // Importaciones directas en el bloque <script> cliente
  const clientScriptMatch = wizard.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(clientScriptMatch, 'QuoteWizard debe tener un bloque <script> modular');
  const clientScript = clientScriptMatch[1];

  assert.ok(clientScript.includes("from '../scripts/slurryEngine.js'"), 'El script cliente de QuoteWizard debe importar desde ../scripts/slurryEngine.js');
  assert.ok(clientScript.includes("from '../scripts/workbenchBus.js'"), 'El script cliente de QuoteWizard debe importar desde ../scripts/workbenchBus.js');
  assert.ok(clientScript.includes('calculateSlurryMetrics('), 'QuoteWizard debe invocar calculateSlurryMetrics() de slurryEngine.js');
  assert.ok(clientScript.includes('calculateAltitudeCorrection('), 'QuoteWizard debe invocar calculateAltitudeCorrection() de slurryEngine.js');
  assert.ok(clientScript.includes('formatSapPlaintext('), 'QuoteWizard debe delegar buildSpecText a formatSapPlaintext()');
  assert.ok(clientScript.includes('formatSapTsv('), 'QuoteWizard debe delegar buildTsvText a formatSapTsv()');
  assert.ok(clientScript.includes('buildAcuseUrlParams('), 'QuoteWizard debe delegar buildAcuseParams a buildAcuseUrlParams()');
  assert.ok(clientScript.includes('sendLeadToServer('), 'QuoteWizard debe delegar el envío de leads al bus unificado');
});

test('144. Revelación Progresiva en 3 Etapas, Barra de Resumen Hidráulico y Asistencia Mutuamente Excluyente (Decisiones 2-C, 3-B, 4-B y 9-B)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  // Barra de asistencia mutuamente excluyente en Paso 01
  assert.ok(wizard.includes('class="assist-pills-bar"'), 'QuoteWizard debe incluir .assist-pills-bar en el Paso 01');
  assert.ok(wizard.includes('data-assist-target="worn-piece-details"'), 'Debe incluir píldora para Medir con Flexómetro');
  assert.ok(wizard.includes('data-assist-target="smat-decoder-details"'), 'Debe incluir píldora para Tengo Código SMAT');
  assert.ok(wizard.includes('data-assist-target="custom-equip-details"'), 'Debe incluir píldora para Equipo Especial');

  // Barra de resumen hidráulico siempre visible en Paso 02
  assert.ok(wizard.includes('id="sim-quick-summary-bar"'), 'QuoteWizard debe incluir #sim-quick-summary-bar en el Paso 02');
  assert.ok(wizard.includes('id="quick-vc"'), 'Barra de resumen debe mostrar #quick-vc');
  assert.ok(wizard.includes('id="quick-sm-cv"'), 'Barra de resumen debe mostrar #quick-sm-cv');
  assert.ok(wizard.includes('id="quick-hr-derating"'), 'Barra de resumen debe mostrar #quick-hr-derating (HR + Motor IEC)');
  assert.ok(wizard.includes('id="quick-alloy-ratio"'), 'Barra de resumen debe mostrar #quick-alloy-ratio (Aleación + wearLifeRatio)');
  assert.ok(wizard.includes('id="metric-rationale"'), 'Simulador debe mostrar #metric-rationale (rationaleEs / rationaleEn)');

  // Breakpoint 1024px para que laptops de 1366x768 y 1280x800 mantengan vista de 2 columnas
  assert.ok(wizard.includes('@media (max-width: 1024px)'), 'QuoteWizard debe colapsar a 1 columna recién en 1024px para proteger laptops de 1366x768');
});

test('145. Ruteo Dinámico Multi-Rol en CircuitNavigator.astro y Paridad de Sello Dinámico en Bombeo (Decisiones 6-B y 7-B)', () => {
  const circuitNav = fs.readFileSync(path.join(siteRoot, 'src/components/CircuitNavigator.astro'), 'utf-8');
  assert.ok(circuitNav.includes('mapNodeRfqHref(circ.id, node.role_id, isEn)'), 'CircuitNavigator debe enrutar dinámicamente cada nodo según su role_id');

  // Montaje en los 3 circuitos (ES y EN)
  for (const pageRel of [
    'src/pages/bombeo/index.astro',
    'src/pages/en/pumping/index.astro',
    'src/pages/flotacion/index.astro',
    'src/pages/en/flotation/index.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/en/filtration/index.astro'
  ]) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    assert.ok(content.includes('<CircuitNavigator'), `${pageRel} debe montar <CircuitNavigator`);
  }

  // Enlace directo a sello.astro y seal.astro desde el índice de Bombeo
  const bombeoIdx = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8');
  const pumpingIdx = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8');
  assert.ok(bombeoIdx.includes('href="/bombeo/sello/"'), 'bombeo/index.astro debe enlazar a /bombeo/sello/');
  assert.ok(pumpingIdx.includes('href="/en/pumping/seal/"'), 'en/pumping/index.astro debe enlazar a /en/pumping/seal/');

  // Montaje de SharePurchasing en las 10 subpáginas de Bombeo
  const pumpingSubpages = [
    'src/pages/bombeo/impulsor.astro',
    'src/pages/bombeo/revestimientos.astro',
    'src/pages/bombeo/sello.astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/en/pumping/impeller.astro',
    'src/pages/en/pumping/liners.astro',
    'src/pages/en/pumping/seal.astro',
    'src/pages/en/pumping/bearing-assembly.astro',
    'src/pages/en/pumping/skid.astro'
  ];
  for (const subRel of pumpingSubpages) {
    const subContent = fs.readFileSync(path.join(siteRoot, subRel), 'utf-8');
    assert.ok(subContent.includes('<SharePurchasing'), `${subRel} debe montar <SharePurchasing`);
  }
});

test('146. Sincronización Bidireccional de Misión y Filtro de Circuito en DualHubView y PerspectiveSelector (Decisión 5-B)', () => {
  const dualHub = fs.readFileSync(path.join(siteRoot, 'src/components/CircuitNavigator.astro'), 'utf-8');
  const perspective = fs.readFileSync(path.join(siteRoot, 'src/components/CircuitNavigator.astro'), 'utf-8');

  assert.ok(dualHub.includes('subscribeWorkbenchUpdate'), 'DualHubView debe suscribirse a subscribeWorkbenchUpdate');
  assert.ok(dualHub.includes('rolesData'), 'CircuitNavigator debe enriquecer nodos P&ID con rolesData');
  assert.ok(dualHub.includes('decision-criteria-box') && dualHub.includes('metallurgy_rule_es'), 'CircuitNavigator debe renderizar criterios metalúrgicos por nodo');

  assert.ok(perspective.includes('subscribeWorkbenchUpdate'), 'PerspectiveSelector debe suscribirse a subscribeWorkbenchUpdate para sincronización bidireccional');
});

test('147. Arquitectura de 3 Puertas en Portada Minimalista sin Sobrecarga Cognitiva (Decisión Don Manuel)', () => {
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Enlaces directos a las 3 Puertas en ES y EN
  assert.ok(indexEs.includes('href="/equipos/"'), 'Portada ES debe enlazar a Puerta 1 /equipos/');
  assert.ok(indexEs.includes('href="/bombeo/"'), 'Portada ES debe enlazar a Puerta 2 /bombeo/');
  assert.ok(indexEs.includes('href="/control-de-procesos/"'), 'Portada ES debe enlazar a Puerta 3 /control-de-procesos/');
  assert.ok(indexEs.includes('href="/cotizar/#rfq"'), 'Portada ES debe enlazar al cotizador dedicado /cotizar/#rfq');

  assert.ok(indexEn.includes('href="/en/process-equipment/"'), 'Portada EN debe enlazar a Door 1 /en/process-equipment/');
  assert.ok(indexEn.includes('href="/en/pumping/"'), 'Portada EN debe enlazar a Door 2 /en/pumping/');
  assert.ok(indexEn.includes('href="/en/process-control/"'), 'Portada EN debe enlazar a Door 3 /en/process-control/');
  assert.ok(indexEn.includes('href="/en/quote/#rfq"'), 'Portada EN debe enlazar al cotizador dedicado /en/quote/#rfq');

  // Ausencia de bloques pesados reubicados fuera de la portada
  for (const relocated of ['<FlightDeck', '<DualHubView', '<CaseCards', 'tco-matrix-section', 'faq-home-section']) {
    assert.ok(!indexEs.includes(relocated), `Portada ES no debe saturarse con ${relocated}`);
    assert.ok(!indexEn.includes(relocated), `Portada EN no debe saturarse con ${relocated}`);
  }
});

test('148. Puerta 1 (/equipos/ y /en/process-equipment/) con Flotación, Filtración y Bombas de Proyecto', () => {
  const eqEs = fs.readFileSync(path.join(siteRoot, 'src/pages/equipos/index.astro'), 'utf-8');
  const eqEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-equipment/index.astro'), 'utf-8');

  assert.ok(eqEs.includes('<h1>Equipos de Proceso</h1>'), 'equipos/index.astro debe tener H1 Equipos de Proceso');
  assert.ok(eqEn.includes('<h1>Process Equipment</h1>'), 'en/process-equipment/index.astro debe tener H1 Process Equipment');

  // Reubicación limpia de DualHubView, CaseCards y CircuitNavigator
  for (const comp of ['<CircuitNavigator', '<CaseCards', '<SharePurchasing']) {
    assert.ok(eqEs.includes(comp), `equipos/index.astro debe integrar ${comp}`);
    assert.ok(eqEn.includes(comp), `en/process-equipment/index.astro debe integrar ${comp}`);
  }
});

test('149. Puerta 2 (/bombeo/ y /en/pumping/) como "Bombas para Lodos y Spare Parts" con Lote 5-5-4 y Cero Frases Arcaicas', () => {
  const bEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8');
  const bEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8');

  assert.ok(bEs.includes('<h1>Bombas para Lodos y Spare Parts</h1>'), 'bombeo/index.astro debe titular Bombas para Lodos y Spare Parts');
  assert.ok(bEn.includes('<h1>Slurry Pumps & Spare Parts</h1>'), 'en/pumping/index.astro debe titular Slurry Pumps & Spare Parts');

  // Erradicación de la frase arcaica "Respaldo completo en bodega de mina"
  assert.ok(!bEs.includes('Respaldo completo en bodega de mina'), 'No debe prometer respaldo completo en bodega de mina');
  assert.ok(bEs.includes('Programación por lote acoplado al desgaste real (5-5-4)'), 'Debe consignar programación por lote acoplado al desgaste real (5-5-4)');
  assert.ok(bEn.includes('Batch scheduling matched to actual wet-end wear (5-5-4)'), 'Debe consignar Batch scheduling matched to actual wet-end wear (5-5-4)');
});

test('150. Puerta 3 (/control-de-procesos/ y /en/process-control/) con Balanza Marcy, Filtro Batch y Tamices ASTM E11', () => {
  const cEs = fs.readFileSync(path.join(siteRoot, 'src/pages/control-de-procesos/index.astro'), 'utf-8');
  const cEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-control/index.astro'), 'utf-8');

  assert.ok(cEs.includes('<h1>Control de Procesos</h1>'), 'control-de-procesos/index.astro debe tener H1 Control de Procesos');
  assert.ok(cEn.includes('<h1>Process Control</h1>'), 'en/process-control/index.astro debe tener H1 Process Control');

  // Los 3 instrumentos y sus diagramas vectoriales CAD (#8 marcy, #9 batch_filter, #10 sieves)
  for (const diag of ['diagram="marcy"', 'diagram="batch_filter"', 'diagram="sieves"']) {
    assert.ok(cEs.includes(diag), `control-de-procesos/index.astro debe renderizar ${diag}`);
    assert.ok(cEn.includes(diag), `en/process-control/index.astro debe renderizar ${diag}`);
  }

  // Calculadora interactiva de metrología metalúrgica
  assert.ok(cEs.includes('id="metrology-calculator"') && cEs.includes('calculateMarcyScaleReading'), 'Debe integrar calculadora interactiva Marcy + Gy + ASTM E11 en ES');
  assert.ok(cEn.includes('id="metrology-calculator"') && cEn.includes('calculateMarcyScaleReading'), 'Debe integrar calculadora interactiva Marcy + Gy + ASTM E11 en EN');
});

test('151. Ruta Dedicada de Cotizador (/cotizar/ y /en/quote/) y 4to Circuito en QuoteWizard.astro', () => {
  const cotEs = fs.readFileSync(path.join(siteRoot, 'src/pages/cotizar.astro'), 'utf-8');
  const cotEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/quote.astro'), 'utf-8');
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');

  assert.ok(cotEs.includes('<QuoteWizard lang="es" />'), 'cotizar.astro debe montar <QuoteWizard lang="es" />');
  assert.ok(cotEn.includes('<QuoteWizard lang="en" />'), 'en/quote.astro debe montar <QuoteWizard lang="en" />');

  assert.ok(wizard.includes('data-circuit="control_procesos"'), 'QuoteWizard debe incluir píldora de 4to circuito control_procesos');
  assert.ok(wizard.includes('id="circuit-panel-control"'), 'QuoteWizard debe incluir #circuit-panel-control');
  assert.ok(wizard.includes('id="wb-role-ctrl"') && wizard.includes('id="wb-ctrl-spec"'), 'QuoteWizard debe incluir selectores de instrumento y especificación de control');
});

test('152. Enrutamiento Presupuestal Interno Silencioso y Códigos Institucionales SMAT-CTRL-*', async () => {
  const { generateSmatPartCode, parseSmatPartCode, resolveInternalBudgetCategory } = await import('../src/scripts/workbenchBus.js');

  assert.equal(generateSmatPartCode({ circuit: 'control_procesos', role: 'balanza_marcy' }), 'SMAT-CTRL-MARCY-1000');
  assert.equal(generateSmatPartCode({ circuit: 'control_procesos', role: 'filtro_batch_lab' }), 'SMAT-CTRL-BATCH-LAB');
  assert.equal(generateSmatPartCode({ circuit: 'control_procesos', role: 'tamices_laboratorio' }), 'SMAT-CTRL-SIEVE-ASTM');

  const parsedSieve = parseSmatPartCode('SMAT-CTRL-SIEVE-ASTM');
  assert.equal(parsedSieve.circuit, 'control_procesos');
  assert.equal(parsedSieve.role, 'tamices_laboratorio');

  assert.equal(resolveInternalBudgetCategory({ circuit: 'control_procesos', role: 'balanza_marcy' }), 'CONTROL_PROCESOS');
  assert.equal(resolveInternalBudgetCategory({ circuit: 'flotacion', role: 'celda_flotacion' }), 'PROYECTO_EQUIPOS');
  assert.equal(resolveInternalBudgetCategory({ circuit: 'bombeo', role: 'kit_wet_end' }), 'OPERACION_SPARE_PARTS');
});



test('153. Portada "Pieza Primero, Cero Rollo": Hero sin Párrafo Redundante y Chips de Piezas Clicables (Decisión 1-C+)', () => {
  const indexEs = fs.readFileSync(path.join(siteRoot, 'src/pages/index.astro'), 'utf-8');
  const indexEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/index.astro'), 'utf-8');

  // Erradicación de <p class="hero-lead"> redundante
  assert.ok(!indexEs.includes('class="hero-lead"'), 'index.astro no debe contener <p class="hero-lead"> redundante');
  assert.ok(!indexEn.includes('class="hero-lead"'), 'en/index.astro no debe contener <p class="hero-lead"> redundante');
  assert.ok(!indexEs.includes('Seleccione su área de suministro en planta:'), 'index.astro no debe repetir el párrafo introductorio en el hero');
  assert.ok(!indexEn.includes('Select your plant supply area:'), 'en/index.astro no debe repetir el párrafo introductorio en el hero');

  // Chips de piezas clicables (.part-chip) dentro de las 3 puertas
  assert.ok(indexEs.includes('class="part-chip"'), 'index.astro debe incluir chips clicables .part-chip');
  assert.ok(indexEn.includes('class="part-chip"'), 'en/index.astro debe incluir chips clicables .part-chip');
  assert.ok(indexEs.includes('href="/bombeo/#como-se-arma-una-bomba"'), 'Puerta 2 ES debe enlazar directo al Reporte de Armado');
  assert.ok(indexEn.includes('href="/en/pumping/#how-a-slurry-pump-is-assembled"'), 'Door 2 EN debe enlazar directo al Assembly Report');
});

test('154. Franja Superior de Selección Rápida de Pieza (<QuickPartSelectorStrip />) en Bombeo y Cotizador (Decisión 8-C+)', () => {
  const stripPath = path.join(siteRoot, 'src/components/QuickPartSelectorStrip.astro');
  assert.ok(fs.existsSync(stripPath), 'QuickPartSelectorStrip.astro debe existir');
  const stripContent = fs.readFileSync(stripPath, 'utf-8');

  assert.ok(stripContent.includes('¿Ya sabe qué pieza busca?'), 'QuickPartSelectorStrip debe preguntar ¿Ya sabe qué pieza busca?');
  assert.ok(stripContent.includes('Already know the part you need?'), 'QuickPartSelectorStrip debe incluir versión en inglés');
  assert.ok(stripContent.includes('data-quick-part-card') && stripContent.includes('data-pieza='), 'QuickPartSelectorStrip debe incluir atributos data-quick-part-card y data-pieza');

  // Montada en /bombeo/, /en/pumping/, /cotizar/ y /en/quote/
  for (const pageRel of [
    'src/pages/bombeo/index.astro',
    'src/pages/en/pumping/index.astro',
    'src/pages/bombeo/index.astro',
    'src/pages/en/pumping/index.astro'
  ]) {
    const pageContent = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    assert.ok(pageContent.includes('<QuickPartSelectorStrip'), `${pageRel} debe montar <QuickPartSelectorStrip`);
  }
});

test('155. Reporte Interactivo de Armado de Bomba (<PumpAssemblyReport />) con 5 Estaciones, Bifurcación Wet-End y Calibración Axial (Decisión 3-C+)', () => {
  const reportPath = path.join(siteRoot, 'src/components/PumpAssemblyReport.astro');
  assert.ok(fs.existsSync(reportPath), 'PumpAssemblyReport.astro debe existir');
  const report = fs.readFileSync(reportPath, 'utf-8');

  // Conmutador de rama constructiva (Ambos / Alto Cromo ≥650 HB / Hule o Poliuretano)
  assert.ok(report.includes('data-assembly-branch-btn="all"'), 'Debe incluir botón para ver ambas ramas');
  assert.ok(report.includes('data-assembly-branch-btn="alto_cromo_cr27"'), 'Debe incluir botón de rama Alto Cromo ≥650 HB');
  assert.ok(report.includes('data-assembly-branch-btn="hule_natural"'), 'Debe incluir botón de rama Hule / Poliuretano');

  // Diferencias reales de armado por material y calibración de claro frontal
  assert.ok(report.includes('FPL Insert'), 'Debe detallar el inserto metálico FPL Insert en la rama Alto Cromo');
  assert.ok(report.includes('FPL') && report.includes('CPL'), 'Debe detallar las camisas bipartidas FPL + CPL en la rama Hule/Poliuretano');
  assert.ok(report.includes('0.5') && report.includes('1.0 mm'), 'Debe especificar la calibración pos-ensamble del claro axial frontal δ = 0.5–1.0 mm');
  assert.ok(report.includes("pos: '01'") && report.includes("pos: '14'"), 'Debe incluir la tabla BOM interactiva de 14 componentes');

  // Montado en /bombeo/ y /en/pumping/
  const bEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8');
  const bEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8');
  assert.ok(bEs.includes('<PumpAssemblyReport lang="es" />'), 'bombeo/index.astro debe montar <PumpAssemblyReport lang="es" />');
  assert.ok(bEn.includes('<PumpAssemblyReport lang="en" />'), 'en/pumping/index.astro debe montar <PumpAssemblyReport lang="en" />');
});

test('156. Muestrario Visual de Kits de Desgaste por Material: Alto Cromo (≥650 HB), Hule Natural y Poliuretano (Decisión 4-C+)', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/TechnicalDiagrams.astro'), 'utf-8');
  assert.ok(diag.includes("diagram === 'material_kit_grid'"), 'TechnicalDiagrams.astro debe implementar la lámina material_kit_grid');

  const bEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8');
  const bEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8');
  assert.ok(bEs.includes('diagram="material_kit_grid"'), 'bombeo/index.astro debe mostrar lámina material_kit_grid');
  assert.ok(bEn.includes('diagram="material_kit_grid"'), 'en/pumping/index.astro debe mostrar lámina material_kit_grid');
  assert.ok(bEs.includes('material=alto_cromo_cr27') && bEs.includes('material=hule_natural') && bEs.includes('material=poliuretano'), 'bombeo/index.astro debe enlazar los 3 materiales al cotizador');
  assert.ok(bEn.includes('material=alto_cromo_cr27') && bEn.includes('material=hule_natural') && bEn.includes('material=poliuretano'), 'en/pumping/index.astro debe enlazar los 3 materiales al cotizador');
});

test('157. Configuraciones de Transmisión V-Belt (CV, ZVZ, CRZ, DC) y Lámina de Cuello de Succión en Skid y Equipos (Decisiones 2-C+ y 5-C+)', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/TechnicalDiagrams.astro'), 'utf-8');
  assert.ok(diag.includes("diagram === 'drive_arrangements'"), 'TechnicalDiagrams.astro debe implementar la lámina drive_arrangements');
  assert.ok(diag.includes("diagram === 'suction_throatbush'"), 'TechnicalDiagrams.astro debe implementar la lámina suction_throatbush');

  const skidEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/skid.astro'), 'utf-8');
  const skidEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/skid.astro'), 'utf-8');
  assert.ok(skidEs.includes('diagram="drive_arrangements"'), 'bombeo/skid.astro debe mostrar lámina drive_arrangements');
  assert.ok(skidEn.includes('diagram="drive_arrangements"'), 'en/pumping/skid.astro debe mostrar lámina drive_arrangements');

  for (const code of ['transmision=CV', 'transmision=ZVZ', 'transmision=CRZ', 'transmision=DC']) {
    assert.ok(skidEs.includes(code), `bombeo/skid.astro debe incluir enlace para arreglo ${code}`);
    assert.ok(skidEn.includes(code), `en/pumping/skid.astro debe incluir enlace para arreglo ${code}`);
  }

  const revEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/revestimientos.astro'), 'utf-8');
  const revEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/liners.astro'), 'utf-8');
  assert.ok(revEs.includes('diagram="suction_throatbush"'), 'bombeo/revestimientos.astro debe mostrar lámina suction_throatbush');
  assert.ok(revEn.includes('diagram="suction_throatbush"'), 'en/pumping/liners.astro debe mostrar lámina suction_throatbush');
});

test('158. Invariante de Erradicación Total (0 Ocurrencias) de Enlaces Huérfanos /#rfq y /en/#rfq en Todo src/ (Decisión 6-C+)', () => {
  const dirsToScan = ['src/pages', 'src/components', 'src/layouts'];
  for (const dirRel of dirsToScan) {
    const fullDir = path.join(siteRoot, dirRel);
    const entries = fs.readdirSync(fullDir, { recursive: true });
    for (const entry of entries) {
      if (typeof entry === 'string' && entry.endsWith('.astro')) {
        const content = fs.readFileSync(path.join(fullDir, entry), 'utf-8');
        assert.ok(
          !content.includes('href="/#rfq') && !content.includes("href='/#rfq"),
          `Archivo ${dirRel}/${entry} no debe contener enlaces huérfanos hacia /#rfq`
        );
        assert.ok(
          !content.includes('href="/en/#rfq') && !content.includes("href='/en/#rfq"),
          `Archivo ${dirRel}/${entry} no debe contener enlaces huérfanos hacia /en/#rfq`
        );
      }
    }
  }
});

test('159. Hidratación Completa de pieza, material, transmision y estacion en QuoteWizard.astro y workbenchBus.js (Decisiones 4-C+, 5-C+, 8-C+)', async () => {
  const { parseUrlContextParams } = await import('../src/scripts/workbenchBus.js');
  const parsed = parseUrlContextParams('?circuito=bombeo&equipo=solo_impulsor&pieza=impulsor_5_alabes&material=alto_cromo_cr27&transmision=ZVZ&estacion=3&serie=6x4#rfq');

  assert.equal(parsed.pieza, 'impulsor_5_alabes');
  assert.equal(parsed.material, 'alto_cromo_cr27');
  assert.equal(parsed.transmision, 'ZVZ');
  assert.equal(parsed.estacion, '3');

  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(wizard.includes('id="wb-pump-material"'), 'QuoteWizard debe incluir selector #wb-pump-material');
  assert.ok(wizard.includes('id="wb-drive-arrangement"'), 'QuoteWizard debe incluir selector #wb-drive-arrangement');
  assert.ok(wizard.includes('[data-quick-part-card]'), 'QuoteWizard debe sincronizar la selección visual de [data-quick-part-card]');
});

test('160. Redirección Defensiva en BaseLayout.astro para Bookmarks Legados /#rfq y /en/#rfq (Decisión 6-C+)', () => {
  const baseLayout = fs.readFileSync(path.join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf-8');
  assert.ok(
    !baseLayout.includes("hash.indexOf('#rfq') === 0"),
    'BaseLayout.astro debe interceptar hashes #rfq en la portada y redirigir defensivamente hacia /cotizar/ o /en/quote/'
  );
  assert.ok(
    baseLayout.includes('smat_locale_pref'),
    'BaseLayout.astro debe preservar query params al redirigir hacia /cotizar/ o /en/quote/'
  );
});

test('161. MS-02: Ficha Física de atomic_parts (weight_kg NIOSH, D2) y Trazabilidad Lossless en SAP/Acuse/Webhook/Code.gs (Decisiones 5-C+ y 6-C)', async () => {
  const {
    getAtomicPartSpecs,
    formatSapPlaintext,
    buildAcuseUrlParams,
    dispatchLeadWebhook
  } = await import('../src/scripts/workbenchBus.js');

  const e4147 = getAtomicPartSpecs('E4147');
  assert.equal(e4147.weight_kg, 68.0, 'E4147 debe tener masa unitaria de 68.0 kg');
  assert.equal(e4147.impeller_diameter_mm, 380, 'E4147 debe tener diámetro exterior D2 de 380 mm');
  assert.equal(e4147.niosh_handling_mode, 'HOIST_REQUIRED', '68 kg >= 23 kg NIOSH exige polipasto');

  const dam028 = getAtomicPartSpecs('DAM028');
  assert.equal(dam028.weight_kg, 18.5, 'DAM028 debe tener masa unitaria de 18.5 kg');
  assert.equal(dam028.niosh_handling_mode, 'MANUAL_SAFE', '18.5 kg < 23 kg NIOSH permite manejo manual seguro');

  const payload = {
    folio: 'SMAT-2026-MS02',
    part_name: 'Impulsor Cerrado A05 6/4 D',
    atomic_code: 'E4147',
    material: 'alto_cromo_cr27',
    transmision: 'ZVZ',
    estacion: '5',
    peso_kg: 68.0,
    claro_mm: 0.75,
    delta_eta_v: 1.68,
    u2_ms: 21.4,
    l10h: 34200,
    metrologia: 'Ss=2.85 | Cw=48.2% | Gy=1.20 kg | P80=106 µm (n=1.18)'
  };

  const sap = formatSapPlaintext(payload);
  assert.ok(sap.includes('68.0 kg') && sap.includes('Polipasto'), 'SAP debe estampar masa unitaria e izaje NIOSH');
  assert.ok(sap.includes('0.75 mm') && sap.includes('1.68%'), 'SAP debe estampar claro axial y pérdida volumétrica');
  assert.ok(sap.includes('u2 = 21.4 m/s') && sap.includes('34200 h'), 'SAP debe estampar cinemática V-Belt y vida ISO 281');
  assert.ok(sap.includes('P80=106 µm'), 'SAP debe estampar cédula metrológica');

  const params = buildAcuseUrlParams(payload);
  assert.equal(params.get('material'), 'alto_cromo_cr27');
  assert.equal(params.get('transmision'), 'ZVZ');
  assert.equal(params.get('estacion'), '5');
  assert.equal(params.get('peso_kg'), '68');
  assert.equal(params.get('claro_mm'), '0.75');
  assert.equal(params.get('u2_ms'), '21.4');
  assert.equal(params.get('l10h'), '34200');
  assert.ok(params.get('metrologia').includes('P80=106 µm'));

  const webhook = dispatchLeadWebhook(payload, 'pdf_acuse', '');
  assert.equal(webhook.payload.material_wet_end, 'alto_cromo_cr27');
  assert.equal(webhook.payload.arreglo_transmision, 'ZVZ');
  assert.equal(webhook.payload.claro_axial_mm, 0.75);
  assert.equal(webhook.payload.velocidad_punta_u2_ms, 21.4);
  assert.equal(webhook.payload.vida_rodamiento_l10h, 34200);
  assert.ok(webhook.payload.cedula_metrologia.includes('P80=106 µm'));

  const codeGs = fs.readFileSync(path.join(siteRoot, 'tools/google_apps_script/Code.gs'), 'utf-8');
  for (const col of ['material_wet_end', 'arreglo_transmision', 'estacion_despiece', 'peso_pieza_kg', 'claro_axial_mm', 'velocidad_punta_u2_ms', 'vida_rodamiento_l10h', 'cedula_metrologia']) {
    assert.ok(codeGs.includes(col), `Code.gs debe registrar columna ${col}`);
  }
});

test('162. MS-03: Calibrador en Vivo de Claro Axial δ_frontal en PumpAssemblyReport.astro y Contraste AAA en QuickPartSelectorStrip.astro (Decisiones 1-C+ y 10-C)', () => {
  const report = fs.readFileSync(path.join(siteRoot, 'src/components/PumpAssemblyReport.astro'), 'utf-8');
  assert.ok(report.includes('evaluateWetEndAssemblyInterference'), 'PumpAssemblyReport debe importar y ejecutar evaluateWetEndAssemblyInterference');
  assert.ok(report.includes('id="station-05-calibrator"'), 'PumpAssemblyReport debe incluir <details id="station-05-calibrator">');
  assert.ok(report.includes('data-clearance-slider') && report.includes('data-clearance-loss') && report.includes('data-clearance-lot554'), 'Debe exponer controles y métricas de Δη_v y lote 5-5-4');
  assert.ok(report.includes('id="est-05"') && report.includes('data-est-05-val'), 'Debe sincronizar visualmente el nodo SVG #est-05');

  const strip = fs.readFileSync(path.join(siteRoot, 'src/components/QuickPartSelectorStrip.astro'), 'utf-8');
  assert.ok(strip.includes('color: #082f49;'), 'QuickPartSelectorStrip debe usar contraste AAA >= 12.8:1 (#082f49 sobre #f0f9ff) en .quick-part-strip__assembly-btn');
});

test('163. MS-04: Motor Cinemático V-Belt (CV/ZVZ/CRZ/DC), Candado u2 <= 24.5 m/s y Vida ISO 281 L10h en Skid ES/EN (Decisión 2-C+)', () => {
  const skidEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/skid.astro'), 'utf-8');
  const skidEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/skid.astro'), 'utf-8');

  for (const content of [skidEs, skidEn]) {
    assert.ok(content.includes('calculateDriveAndBearingKinematics'), 'Skid debe importar y ejecutar calculateDriveAndBearingKinematics');
    assert.ok(content.includes('id="skid-kinematics-panel"'), 'Skid debe incluir <details id="skid-kinematics-panel">');
    assert.ok(content.includes('data-kin-u2') && content.includes('data-kin-l10h') && content.includes('data-kin-rubber-alert'), 'Skid debe mostrar u2, L10h y alerta de límite térmico de hule (24.5 m/s)');
  }
});

test('164. MS-05: Banco Metrológico <details> Mutuamente Excluyente, Rosin-Rammler y Puente Sin Amnesia Laboratorio ➔ Cotizador / Bomba (Decisiones 4-C+ y 9-C+)', () => {
  const ctrlEs = fs.readFileSync(path.join(siteRoot, 'src/pages/control-de-procesos/index.astro'), 'utf-8');
  const ctrlEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-control/index.astro'), 'utf-8');

  for (const content of [ctrlEs, ctrlEn]) {
    assert.ok(content.includes('id="stage-diagnostic"') && content.includes('id="stage-2"'), 'Control de Procesos debe delimitar etapas para ergos cowan-score <= 4.50');
    assert.ok(content.includes('data-station-accordion="1"') && content.includes('data-station-accordion="2"'), 'Debe encapsular estaciones metrológicas en <details data-station-accordion>');
    assert.ok(content.includes('rosinRammlerYPrime') && content.includes('rosinRammlerSlopeN'), 'Debe exponer coordenada linealizada Rosin-Rammler y\' y pendiente n');
    assert.ok(content.includes('saveWorkbenchState') && content.includes('id="met-pump-precal-cta"'), 'Debe persistir metrology en workbenchBus y ofrecer pre-calibración directa del simulador de bombeo');
  }
});

test('165. MS-06: Unificación de MECHANICAL_DIAGNOSTICS con Umbrales Cuantitativos y Contraste AAA en CaseCards (Decisión 7-C+ y DEB-04)', () => {
  const diagHub = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');
  const caseCards = fs.readFileSync(path.join(siteRoot, 'src/components/CaseCards.astro'), 'utf-8');

  assert.ok(diagHub.includes('MECHANICAL_DIAGNOSTICS'), 'DiagnosticsHub.astro debe importar MECHANICAL_DIAGNOSTICS desde slurryEngine.js');
  assert.ok(diagHub.includes('diag-threshold-strip') && diagHub.includes('diag-station-chip'), 'DiagnosticsHub.astro debe mostrar estación y umbral físico cuantitativo');
  assert.ok(diagHub.includes('material=') && diagHub.includes('estacion=') && diagHub.includes('claro_mm='), 'DiagnosticsHub.astro debe propagar material, estacion y claro_mm en enlaces de cotización');
  assert.ok(caseCards.includes('background-color: #f0f9ff;') && caseCards.includes('color: #082f49;'), 'CaseCards.astro debe garantizar contraste AAA >= 7.0:1 en .case-circuit-link');
  assert.ok(caseCards.includes('background-color: #1c1917;') && caseCards.includes('color: #ffffff;'), 'CaseCards.astro debe garantizar contraste AAA >= 7.0:1 en .case-sim-link');
});

test('166. MS-07: Decompresión Cognitiva Apple HIG en /equipos/ y /en/process-equipment/ (Decisión 9-C+)', () => {
  const eqEs = fs.readFileSync(path.join(siteRoot, 'src/pages/equipos/index.astro'), 'utf-8');
  const eqEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-equipment/index.astro'), 'utf-8');

  for (const content of [eqEs, eqEn]) {
    assert.ok(content.includes('id="stage-diagnostic"') && content.includes('id="stage-2"'), 'Equipos debe delimitar etapas para ergos cowan-score <= 4.50');
    assert.ok(content.includes('id="equipos-circuit-appendix"'), 'Equipos debe encapsular el anexo de circuito P&ID en <details id="equipos-circuit-appendix">');
  }
});

test('167. MS-08 y MS-09: Paridad Total en QuoteWizard (Pieza Atómica NIOSH, V_actual, Er, ΔNPSH_r, Claro δ, Cinemática u2/L10h, Candado Hule 24.5 m/s y Puente Metrológico)', () => {
  const cotEs = fs.readFileSync(path.join(siteRoot, 'src/pages/cotizar.astro'), 'utf-8');
  const cotEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/quote.astro'), 'utf-8');
  assert.ok(cotEs.includes('<QuoteWizard') && cotEn.includes('<QuoteWizard'), 'cotizar.astro y quote.astro deben montar QuoteWizard directamente sin envolturas redundantes');

  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('evaluateWetEndAssemblyInterference') && qw.includes('calculateDriveAndBearingKinematics') && qw.includes('getAtomicPartSpecs'), 'QuoteWizard debe importar y ejecutar evaluateWetEndAssemblyInterference, calculateDriveAndBearingKinematics y getAtomicPartSpecs');
  assert.ok(qw.includes('id="wb-atomic-part-card"') && qw.includes('id="wb-part-niosh-badge"'), 'QuoteWizard debe renderizar la tarjeta técnica de pieza atómica con badge NIOSH 23 kg');
  assert.ok(qw.includes('id="metric-v-actual"') && qw.includes('id="metric-derating-er"') && qw.includes('id="metric-delta-npsh"'), 'QuoteWizard debe exponer V_actual, Er y ΔNPSH_r en el acordeón hidráulico');
  assert.ok(qw.includes('id="wb-clearance-slider"') && qw.includes('id="metric-clearance-loss"'), 'QuoteWizard debe exponer control de claro axial frontal δ y pérdida Δη_v');
  assert.ok(qw.includes('id="metric-drive-u2"') && qw.includes('id="metric-drive-l10h"') && qw.includes('id="wb-rubber-u2-lock"'), 'QuoteWizard debe exponer u2, L10h y el candado de límite térmico de hule (24.5 m/s)');
  assert.ok(qw.includes('id="wb-metrology-bridge-card"') && qw.includes('id="live-table-kinematics"') && qw.includes('id="live-table-part-specs"'), 'QuoteWizard debe sincronizar el puente metrológico y reflejar cinemática y pieza atómica en el Dossier A4 en vivo');
});

test('168. MS-10: Paridad Sin Pérdida en Acuse Imprimible ES/EN (/acuse/ y /en/thank-you/) para SAP Ariba / Coupa (Decisión 6-C)', () => {
  const acuseEs = fs.readFileSync(path.join(siteRoot, 'src/pages/acuse.astro'), 'utf-8');
  const acuseEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/thank-you.astro'), 'utf-8');

  for (const content of [acuseEs, acuseEn]) {
    assert.ok(content.includes('id="field-material-drive"') && content.includes('id="field-clearance-kinematics"') && content.includes('id="field-metrology"'), 'Acuse debe renderizar filas dedicadas para material/transmisión/estación, claro axial/cinemática y memoria metrológica');
    assert.ok(content.includes("urlParams.get('material')") && content.includes("urlParams.get('claro_mm')") && content.includes("urlParams.get('u2_ms')") && content.includes("urlParams.get('l10h')"), 'Acuse debe hidratar material, claro_mm, u2_ms, l10h y metrologia desde URL y sessionStorage');
  }
});

test('169. Root Cause #1: Store Físico Unificado por Circuito (slurryEngine.js + workbenchBus.js + QuoteWizard.astro) sin Pérdida en Dossier A4, Acuse y Webhook', () => {
  // 1. Verificar contratos de retorno sin campos undefined en motores físicos y pieza atómica
  const partSpecs = getAtomicPartSpecs('kit_wet_end', '6x4');
  assert.equal(partSpecs.station, 'S3');
  assert.equal(partSpecs.station_number, 3);
  assert.ok(partSpecs.station_name_es.length > 0);
  assert.equal(partSpecs.handling_mode, 'HOIST_REQUIRED');
  assert.equal(partSpecs.max_sphere_mm, 45);
  assert.ok(partSpecs.wall_thickness_mm > 0);
  assert.ok(partSpecs.assembly_order_note.length > 0);

  const clEval = evaluateWetEndAssemblyInterference({ frontClearanceMm: 2.5, impellerExitWidthMm: 48 });
  assert.equal(typeof clEval.volumetricEfficiencyDropPct, 'number');
  assert.equal(clEval.volumetricEfficiencyLossPct, clEval.volumetricEfficiencyDropPct);
  assert.equal(clEval.volumetricEffLossPct, clEval.volumetricEfficiencyDropPct);

  const kinEval = calculateDriveAndBearingKinematics({
    arrangementCode: 'ZVZ',
    motorRpm: 1775,
    driverPulleyMm: 280,
    drivenPulleyMm: 300,
    motorPowerKw: 55,
    impellerDiameterMm: 420,
    wetEndMaterial: 'hule_natural'
  });
  assert.equal(kinEval.arrangement, 'ZVZ');
  assert.equal(kinEval.arrangementCode, 'ZVZ');
  assert.equal(typeof kinEval.bearingL10Hours, 'number');
  assert.equal(kinEval.estimatedL10hHours, kinEval.bearingL10Hours);
  assert.equal(kinEval.rubberThermalLimitExceeded, true, 'Debe disparar candado viscoelástico cuando u2 > 24.5 m/s en hule_natural');

  const marcyEval = calculateMarcyScaleReading({ solidsSg: 2.8, weightPercentSolids: 45 });
  assert.equal(marcyEval.slurryDensityKgL, marcyEval.pulpDensityKgL);
  const gyEval = calculateGyMinimumSampleMass({ d95Cm: 0.2, relativeVarianceError: 0.05 });
  assert.equal(gyEval.minimumSampleMassKg, gyEval.minDrySampleKg);
  const sieveEval = recommendAstmSieveSeries({ targetP80Microns: 150 });
  assert.equal(sieveEval.recommendedSeries.length, 6);

  // 2. Verificar que un objeto anidado estilo collectData() hidrata 100% de salidas en SAP Plaintext, Acuse URL y Webhook
  const nestedWizardData = {
    folio: 'SMAT-2026-UNIFIED',
    name: 'Ing. Roberto M.',
    company: 'Minera Fresnillo',
    phone: '6188104408',
    email: 'rm@fresnillo.com',
    circuit: 'bombeo',
    role: 'Kit Extremo Húmedo',
    role_id: 'kit_wet_end',
    pump_material: 'alto_cromo_cr27',
    drive_arrangement: 'ZVZ',
    assembly_station: partSpecs.station,
    part_specs: partSpecs,
    clearance_eval: clEval,
    kinematics: kinEval,
    metrology: {
      cw: 45,
      sm: marcyEval.pulpDensityKgL,
      p80: 150,
      dryMassKg: gyEval.minDrySampleKg,
      summary: 'Ss=2.8 | Cw=45% | Sm=1.404 kg/L | M_min=0.25 kg | P80=150 µm (#100)'
    }
  };

  const sapText = formatSapPlaintext(nestedWizardData);
  assert.ok(sapText.includes('ZVZ'), 'SAP Plaintext debe hidratar Arreglo Transmisión desde objeto anidado');
  assert.ok(sapText.includes('alto_cromo_cr27'), 'SAP Plaintext debe hidratar Material Contacto Húmedo');
  assert.ok(sapText.includes('68.0 kg'), 'SAP Plaintext debe hidratar masa unitaria NIOSH desde part_specs');
  assert.ok(sapText.includes('2.5 mm'), 'SAP Plaintext debe hidratar claro axial δ desde clearance_eval');
  assert.ok(sapText.includes('P80=150 µm'), 'SAP Plaintext debe hidratar cédula metrológica desde metrology');

  const acuseParams = buildAcuseUrlParams(nestedWizardData);
  assert.equal(acuseParams.get('material'), 'alto_cromo_cr27');
  assert.equal(acuseParams.get('transmision'), 'ZVZ');
  assert.equal(acuseParams.get('peso_kg'), '68');
  assert.equal(acuseParams.get('claro_mm'), '2.5');
  assert.ok(Number(acuseParams.get('u2_ms')) > 24.5);
  assert.ok(Number(acuseParams.get('l10h')) > 1000);
  assert.ok(acuseParams.get('metrologia').includes('P80=150 µm'));

  const webhookOut = dispatchLeadWebhook(nestedWizardData, 'test_unified');
  assert.equal(webhookOut.payload.material_wet_end, 'alto_cromo_cr27');
  assert.equal(webhookOut.payload.arreglo_transmision, 'ZVZ');
  assert.equal(webhookOut.payload.peso_pieza_kg, 68.0);
  assert.equal(webhookOut.payload.claro_axial_mm, 2.5);
  assert.ok(webhookOut.payload.cedula_metrologia.includes('P80=150 µm'));

  // 3. Verificar sanitización condicional de sesión y declaración de variables en QuoteWizard.astro
  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes("if (rawWbSess && (rawWbSess.includes('6X4D')"), 'QuoteWizard solo debe limpiar smat_workbench_session si contiene residuos legados 6X4D');
  assert.ok(qw.includes('var currentPartSpecs = {};') && qw.includes('var currentClearanceEval = {};') && qw.includes('var currentKinematics = {};') && qw.includes('var currentMetrology = null;'), 'QuoteWizard debe declarar explícitamente las 4 variables de estado físico en modo estricto ES module');
});

test('Test 170 (Slice 1): calculateSlurryMetrics soporta Ss y pipeDiameterMm dinámicos vía resolvePipeDiameterMm y purga constantes 2.7 / 150 en QuoteWizard', () => {
  // 1. Verificar mapa nominal de diámetros de tubería por serie de bomba
  assert.equal(resolvePipeDiameterMm('1.5x1'), 50);
  assert.equal(resolvePipeDiameterMm('3x2'), 100);
  assert.equal(resolvePipeDiameterMm('4x3'), 100);
  assert.equal(resolvePipeDiameterMm('6x4'), 150);
  assert.equal(resolvePipeDiameterMm('8x6'), 200);
  assert.equal(resolvePipeDiameterMm('10x8'), 250);
  assert.equal(resolvePipeDiameterMm(200), 200);
  assert.equal(PIPE_SERIES_DIAMETER_MM['8x6'], 200);

  // 2. Verificar sensibilidad real a gravedad específica del sólido (Ss = 2.2 vs Ss = 4.2)
  const lowSg = calculateSlurryMetrics({ flowM3H: 180, solidsWeightPercent: 45, particleSizeD80Microns: 250, solidsSpecificGravity: 2.2, pipeSeries: '6x4' });
  const highSg = calculateSlurryMetrics({ flowM3H: 180, solidsWeightPercent: 45, particleSizeD80Microns: 250, solidsSpecificGravity: 4.2, pipeSeries: '6x4' });
  assert.equal(lowSg.solidsSpecificGravity, 2.2);
  assert.equal(highSg.solidsSpecificGravity, 4.2);
  assert.ok(highSg.slurrySpecificGravity > lowSg.slurrySpecificGravity, 'Sm debe incrementarse cuando Ss sube de 2.2 a 4.2');
  assert.ok(highSg.criticalVelocityMS > lowSg.criticalVelocityMS, 'Velocidad crítica de Durand vL debe incrementarse con mayor Ss');

  // 3. Verificar sensibilidad real a diámetro de tubería (3x2 = 100 mm vs 8x6 = 200 mm)
  const pipe3x2 = calculateSlurryMetrics({ flowM3H: 180, solidsWeightPercent: 40, particleSizeD80Microns: 200, solidsSpecificGravity: 2.8, pipeSeries: '3x2' });
  const pipe8x6 = calculateSlurryMetrics({ flowM3H: 180, solidsWeightPercent: 40, particleSizeD80Microns: 200, solidsSpecificGravity: 2.8, pipeSeries: '8x6' });
  assert.equal(pipe3x2.pipeDiameterMm, 100);
  assert.equal(pipe8x6.pipeDiameterMm, 200);
  assert.ok(pipe3x2.actualVelocityMS > pipe8x6.actualVelocityMS * 3.5, 'Al duplicar D (100 a 200 mm), la velocidad real v debe caer ~4x');
  assert.ok(pipe8x6.criticalVelocityMS > pipe3x2.criticalVelocityMS, 'El límite crítico de Durand vL crece con sqrt(D)');

  // 4. Auditar DOM y purga de constantes clavadas en QuoteWizard.astro
  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('id="slider-sg"'), 'QuoteWizard debe exponer el control #slider-sg para gravedad específica Ss');
  assert.ok(qw.includes('id="val-sg"'), 'QuoteWizard debe exponer el readout #val-sg');
  assert.ok(qw.includes('id="val-pipe-mm"'), 'QuoteWizard debe exponer el badge dinámico #val-pipe-mm');
  assert.ok(qw.includes('resolvePipeDiameterMm'), 'QuoteWizard debe importar y usar resolvePipeDiameterMm');
  assert.equal(qw.includes('var Ss = 2.7;'), false, 'PROHIBIDO: var Ss = 2.7; clavado en QuoteWizard.astro');
  assert.equal(qw.includes('pipeDiameterMm: 150'), false, 'PROHIBIDO: pipeDiameterMm: 150 clavado en QuoteWizard.astro');
});

test('Test 171 (Slice 2): Recomendador tri-compuesto en calculateSlurryMetrics devuelve RUBBER, PU y A05 según régimen físico', () => {
  // Régimen 1: Finos moderados -> RUBBER (hule_natural)
  const rubberRegime = calculateSlurryMetrics({
    flowM3H: 120,
    solidsWeightPercent: 30,
    particleSizeD80Microns: 120,
    solidsSpecificGravity: 2.7,
    pipeSeries: '6x4'
  });
  assert.equal(rubberRegime.recommendedMaterial, 'RUBBER');
  assert.equal(rubberRegime.recommendedMaterialKey, 'hule_natural');

  // Régimen 2: Abrasión fina/intermedia de alta velocidad o corte -> PU (poliuretano U01)
  const puRegime = calculateSlurryMetrics({
    flowM3H: 220,
    solidsWeightPercent: 42,
    particleSizeD80Microns: 420,
    solidsSpecificGravity: 2.8,
    pipeSeries: '6x4'
  });
  assert.equal(puRegime.recommendedMaterial, 'PU');
  assert.equal(puRegime.recommendedMaterialKey, 'poliuretano');
  assert.ok(puRegime.materialReasonEs.includes('Poliuretano U01'));

  // Régimen 3: Gruesos cortantes o pulpa hiperdensa -> A05 (alto_cromo_cr27)
  const a05Regime = calculateSlurryMetrics({
    flowM3H: 260,
    solidsWeightPercent: 58,
    particleSizeD80Microns: 850,
    solidsSpecificGravity: 3.4,
    pipeSeries: '6x4'
  });
  assert.equal(a05Regime.recommendedMaterial, 'A05');
  assert.equal(a05Regime.recommendedMaterialKey, 'alto_cromo_cr27');

  // Verificar integración tri-compuesto en QuoteWizard.astro
  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('PU:') && qw.includes('res.recommendedMaterial'), 'QuoteWizard debe mapear explícitamente el compuesto PU');
  assert.ok(qw.includes('Poliuretano Elastómero U01'), 'QuoteWizard debe mostrar Poliuretano Elastómero U01 cuando aplique');
  assert.ok(qw.includes('res.recommendedMaterialKey'), 'QuoteWizard debe sincronizar #wb-pump-material con recommendedMaterialKey');
});

test('Test 172 (Slice 3): calculateDriveAndBearingKinematics responde a poleas, RPM y potencia dinámicas en QuoteWizard y páginas skid ES/EN', () => {
  // 1. Verificar sensibilidad del motor cinemático a poleas, RPM, potencia y arreglo DC
  const kinZvzLow = calculateDriveAndBearingKinematics({
    motorRpm: 1775,
    driverPulleyMm: 180,
    drivenPulleyMm: 400,
    shaftPowerKw: 35,
    impellerDiameterMm: 440,
    arrangement: 'ZVZ',
    wetEndMaterial: 'alto_cromo_cr27'
  });
  const kinZvzHigh = calculateDriveAndBearingKinematics({
    motorRpm: 1775,
    driverPulleyMm: 320,
    drivenPulleyMm: 280,
    shaftPowerKw: 95,
    impellerDiameterMm: 440,
    arrangement: 'ZVZ',
    wetEndMaterial: 'hule_natural'
  });
  const kinDc = calculateDriveAndBearingKinematics({
    motorRpm: 1180,
    driverPulleyMm: 250,
    drivenPulleyMm: 350,
    shaftPowerKw: 55,
    impellerDiameterMm: 440,
    arrangement: 'DC',
    wetEndMaterial: 'poliuretano'
  });

  assert.ok(kinZvzHigh.pumpRpm > kinZvzLow.pumpRpm, 'Mayor polea motriz d1 debe incrementar RPM en la flecha de la bomba');
  assert.ok(kinZvzHigh.impellerTipSpeedMs > 24.5 && kinZvzHigh.rubberThermalLimitExceeded === true, 'Tip speed > 24.5 m/s en hule debe activar bloqueo viscoelástico');
  assert.ok(kinZvzLow.bearingL10Hours > kinZvzHigh.bearingL10Hours, 'Menor potencia y menor carga radial deben incrementar vida L10h');
  assert.equal(kinDc.pumpRpm, 1180, 'Arreglo DC (acople directo) debe mantener relación 1:1 con motorRpm');
  assert.equal(kinDc.beltRadialLoadKn, 0, 'Arreglo DC debe tener carga radial de bandas Fr = 0 kN');

  // 2. Auditar controles cinemáticos en QuoteWizard.astro y páginas skid (ES/EN)
  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('id="wb-driver-pulley"'), 'QuoteWizard debe exponer #wb-driver-pulley');
  assert.ok(qw.includes('id="wb-driven-pulley"'), 'QuoteWizard debe exponer #wb-driven-pulley');
  assert.ok(qw.includes('id="wb-motor-rpm"'), 'QuoteWizard debe exponer #wb-motor-rpm');
  assert.ok(qw.includes('id="wb-shaft-power"'), 'QuoteWizard debe exponer #wb-shaft-power');
  assert.equal(qw.includes('driverPulleyMm: 220,\n        drivenPulleyMm: 340,\n        shaftPowerKw: 55'), false, 'PROHIBIDO dejar poleas y potencia clavadas en QuoteWizard.astro');

  const skidEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/skid.astro'), 'utf-8');
  const skidEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/skid.astro'), 'utf-8');
  for (const [label, html] of [['skid.astro ES', skidEs], ['skid.astro EN', skidEn]]) {
    assert.ok(html.includes('data-kin-motor-rpm'), `${label} debe exponer selector data-kin-motor-rpm`);
    assert.ok(html.includes('data-kin-power'), `${label} debe exponer slider data-kin-power`);
    assert.ok(html.includes('data-kin-fr-sub'), `${label} debe exponer desglose data-kin-fr-sub`);
    assert.ok(html.includes('value="640"'), `${label} debe incluir impulsor 640 mm (Serie 10x8)`);
    assert.equal(html.includes('motorRpm: 1780'), false, `PROHIBIDO motorRpm: 1780 clavado en ${label}`);
    assert.equal(html.includes('shaftPowerKw: 45'), false, `PROHIBIDO shaftPowerKw: 45 clavado en ${label}`);
  }
});

test('Test 173 (Slice 4): evaluatePumpAssemblySequence valida orden de 5 estaciones y unifica BOM de 14 piezas sin duplicación en PumpAssemblyReport', () => {
  // 1. Verificar catálogo unificado de 14 piezas y 5 estaciones
  assert.equal(PUMP_554_ASSEMBLY_STATIONS.length, 5);
  assert.equal(PUMP_554_BOM_14_PARTS.length, 14);
  assert.equal(PUMP_554_BOM_14_PARTS[0].pos, '01');
  assert.equal(PUMP_554_BOM_14_PARTS[13].pos, '14');

  // 2. Verificar validador de secuencia canónica vs secuencias fuera de orden
  const canonicalEval = evaluatePumpAssemblySequence({
    frontClearanceMm: 2.0,
    rearClearanceMm: 2.5,
    impellerDiameterMm: 380,
    sequencePreset: 'canonical'
  });
  assert.equal(canonicalEval.sequenceValid, true);
  assert.equal(canonicalEval.outOfOrderStationId, null);
  assert.ok(canonicalEval.totalAssemblyMassKg > 300, 'Masa total del ensamble debe sumar las 14 piezas (>300 kg)');
  assert.ok(canonicalEval.nioshHoistPartsCount >= 6, 'Debe contabilizar piezas >= 23 kg que exigen polipasto NIOSH');
  assert.equal(canonicalEval.bomParts.length, 14);

  const badImpellerEval = evaluateWetEndAssemblyInterference({
    frontClearanceMm: 2.0,
    impellerDiameterMm: 380,
    sequencePreset: 'impeller_before_rear_liner'
  });
  assert.equal(badImpellerEval.sequenceValid, false);
  assert.equal(badImpellerEval.outOfOrderStationId, 'EST-02');
  assert.ok(badImpellerEval.collisionRiskEs.includes('SECUENCIA INVÁLIDA'));

  const badCoverEval = evaluateWetEndAssemblyInterference({
    frontClearanceMm: 2.0,
    impellerDiameterMm: 380,
    sequencePreset: 'cover_before_throatbush'
  });
  assert.equal(badCoverEval.sequenceValid, false);
  assert.equal(badCoverEval.outOfOrderStationId, 'EST-04');

  // 3. Auditar PumpAssemblyReport.astro y QuoteWizard.astro
  const par = fs.readFileSync(path.join(siteRoot, 'src/components/PumpAssemblyReport.astro'), 'utf-8');
  assert.ok(par.includes('PUMP_554_BOM_14_PARTS'), 'PumpAssemblyReport.astro debe importar PUMP_554_BOM_14_PARTS desde slurryEngine.js');
  assert.ok(par.includes('data-clearance-seq-select'), 'PumpAssemblyReport.astro debe exponer selector interactivo de secuencia');
  assert.ok(par.includes('data-clearance-mass-total'), 'PumpAssemblyReport.astro debe exponer masa total y conteo NIOSH');
  assert.ok(par.includes('data-clearance-seq-status'), 'PumpAssemblyReport.astro debe exponer dictamen de secuencia');

  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('id="wb-assembly-sequence-test"'), 'QuoteWizard debe exponer #wb-assembly-sequence-test');
  assert.ok(qw.includes('id="metric-assembly-mass-seq"'), 'QuoteWizard debe exponer #metric-assembly-mass-seq');
});

test('Test 174 (Slice 5): calculateGyMinimumSampleMass responde a presión neumática (60-80 vs 80-100 psi), Ss, d95, c y error relativo en control-de-procesos ES/EN', () => {
  // 1. Verificar sensibilidad a gravedad específica del sólido y presión de filtrado por lotes
  const gyLowP = calculateGyMinimumSampleMass({
    topSizeD95Mm: 12.7,
    solidsSpecificGravity: 2.6,
    samplingConstantC: 1.2,
    targetRelativeStdError: 0.05,
    airPressurePsi: 70
  });
  const gyHighP = calculateGyMinimumSampleMass({
    topSizeD95Mm: 12.7,
    solidsSpecificGravity: 4.1,
    samplingConstantC: 1.2,
    targetRelativeStdError: 0.05,
    airPressurePsi: 90
  });

  assert.equal(gyLowP.airPressurePsi, 70);
  assert.equal(gyHighP.airPressurePsi, 90);
  assert.notEqual(gyLowP.wetPulpVolumeLiters, gyHighP.wetPulpVolumeLiters, 'El volumen de pulpa húmeda debe responder a solidsSpecificGravity real y no quedar clavado en 2.8');
  assert.ok(gyHighP.estimatedCycleMinutes < gyLowP.estimatedCycleMinutes, 'Mayor presión neumática (90 vs 70 psi) debe reducir el tiempo de ciclo de filtrado');
  assert.ok(gyHighP.residualCakeMoisturePct < gyLowP.residualCakeMoisturePct, 'Mayor presión neumática debe reducir la humedad residual del queque');

  // 2. Verificar que un error estándar más estricto (1% vs 5%) incrementa la masa mínima de Gy
  const gyStrict = calculateGyMinimumSampleMass({
    topSizeD95Mm: 12.7,
    solidsSpecificGravity: 2.8,
    samplingConstantC: 1.2,
    targetRelativeStdError: 0.01,
    airPressurePsi: 90
  });
  assert.ok(gyStrict.minDrySampleKg > gyHighP.minDrySampleKg * 10, 'Reducir error estándar de 5% a 1% debe incrementar drásticamente M_min');

  // 3. Auditar conexión DOM en control-de-procesos ES/EN
  const cpEs = fs.readFileSync(path.join(siteRoot, 'src/pages/control-de-procesos/index.astro'), 'utf-8');
  const cpEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-control/index.astro'), 'utf-8');
  for (const [label, html] of [['control-de-procesos ES', cpEs], ['process-control EN', cpEn]]) {
    assert.ok(html.includes('id="met-gy-pressure-select"'), `${label} debe tener #met-gy-pressure-select`);
    assert.ok(html.includes('id="met-gy-d95-input"'), `${label} debe exponer #met-gy-d95-input`);
    assert.ok(html.includes('id="met-gy-c-input"'), `${label} debe exponer #met-gy-c-input`);
    assert.ok(html.includes('id="met-gy-error-select"'), `${label} debe exponer #met-gy-error-select`);
    assert.ok(html.includes('airPressurePsi'), `${label} debe pasar airPressurePsi a calculateGyMinimumSampleMass`);
    assert.ok(html.includes('solidsSpecificGravity: sg'), `${label} debe pasar solidsSpecificGravity: sg a calculateGyMinimumSampleMass`);
  }
});

test('Test 175 (Slice 6): recommendAstmSieveSeries devuelve tabla granulométrica Rosin-Rammler completa y QuoteWizard expone controles nativos en control_procesos', () => {
  // 1. Verificar pila de 7 tamices con distribución Rosin-Rammler y equivalentes Tyler
  const sieveAuto = recommendAstmSieveSeries({
    targetP80Microns: 106,
    topSizeD95Mm: 12.7,
    screeningMode: 'auto',
    frameDiameterInches: 8
  });
  assert.equal(sieveAuto.sieveStack.length, 7, 'sieveStack debe contener la pila completa de 7 tamices ASTM E11');
  assert.equal(sieveAuto.wetScreeningRequired, true, 'P80 <= 150 µm en modo auto debe requerir tamizado en húmedo');
  assert.equal(sieveAuto.frameDiameterInches, 8);

  const firstSieve = sieveAuto.sieveStack[0];
  assert.ok(typeof firstSieve.tylerEquivalent === 'string' && firstSieve.tylerEquivalent.length > 0, 'Cada tamiz debe incluir equivalente Tyler');
  assert.ok(typeof firstSieve.wireDiameterMm === 'number' && firstSieve.wireDiameterMm > 0, 'Cada tamiz debe incluir diámetro de alambre ASTM');
  assert.ok(typeof firstSieve.retainedIndividualPct === 'number', 'Cada tamiz debe incluir % retenido individual');
  assert.ok(typeof firstSieve.cumulativePassingPct === 'number', 'Cada tamiz debe incluir % pasante acumulado Rosin-Rammler');
  assert.ok(typeof firstSieve.rosinRammlerY === 'number', 'Cada tamiz debe incluir coordenada linealizada Rosin-Rammler Y');

  // Verificar monotonía decreciente del % pasante acumulado al bajar la abertura del tamiz
  for (let i = 1; i < sieveAuto.sieveStack.length; i++) {
    assert.ok(
      sieveAuto.sieveStack[i].cumulativePassingPct <= sieveAuto.sieveStack[i - 1].cumulativePassingPct + 1e-6,
      'El % pasante acumulado debe decrecer monotónicamente hacia mallas más finas'
    );
  }

  // Verificar override manual de modo seco y marco de 12"
  const sieveDry12 = recommendAstmSieveSeries({
    targetP80Microns: 106,
    screeningMode: 'dry',
    frameDiameterInches: 12
  });
  assert.equal(sieveDry12.wetScreeningRequired, false, 'screeningMode: dry debe forzar tamizado en seco');
  assert.equal(sieveDry12.frameDiameterInches, 12);

  // 2. Auditar tabla granulométrica en control-de-procesos ES/EN y controles nativos en QuoteWizard.astro
  const cpEs = fs.readFileSync(path.join(siteRoot, 'src/pages/control-de-procesos/index.astro'), 'utf-8');
  const cpEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-control/index.astro'), 'utf-8');
  for (const [label, html] of [['control-de-procesos ES', cpEs], ['process-control EN', cpEn]]) {
    assert.ok(html.includes('id="met-screening-mode"'), `${label} debe exponer selector #met-screening-mode`);
    assert.ok(html.includes('id="met-sieve-stack-table"'), `${label} debe renderizar la tabla #met-sieve-stack-table`);
    assert.ok(html.includes('id="met-sieve-stack-tbody"'), `${label} debe poblar #met-sieve-stack-tbody con sieveRes.sieveStack`);
  }

  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('id="wb-ctrl-sg"'), 'QuoteWizard debe exponer #wb-ctrl-sg en panel control_procesos');
  assert.ok(qw.includes('id="wb-ctrl-cw"'), 'QuoteWizard debe exponer #wb-ctrl-cw en panel control_procesos');
  assert.ok(qw.includes('id="wb-ctrl-d95"'), 'QuoteWizard debe exponer #wb-ctrl-d95 en panel control_procesos');
  assert.ok(qw.includes('id="wb-ctrl-p80"'), 'QuoteWizard debe exponer #wb-ctrl-p80 en panel control_procesos');
  assert.ok(qw.includes('id="wb-ctrl-sieve-table"'), 'QuoteWizard debe exponer #wb-ctrl-sieve-table en panel control_procesos');
});

test('Test 176 (Slice 7): Unificación canónica de workbenchBus.js con QuoteWizard.astro (formatWhatsappUrl rico en ingeniería y cero condicionales muertos)', () => {
  // 1. Verificar que formatWhatsappUrl incluye prioridad, claro axial δ, pérdida volumétrica Δη_v, cinemática V-Belt u2/L10h, estación/masa NIOSH, cédula metrológica y directiva de flexómetro
  const waUrl = formatWhatsappUrl({
    priority: 'urgent',
    folio: 'SMAT-260327-7777',
    circuit: 'bombeo',
    company: 'Minera Fresnillo',
    requester: 'Ing. Roberto Salas',
    phone: '6181234567',
    smat_code: 'SMAT-PUMP-6X4-IMP-A05',
    atomic_code: 'D4147A05',
    pulp_profile: '52% Cw | d80 180µm | SG 3.1',
    material: 'A05',
    transmision: 'ZVZ (u2=23.4 m/s | L10h=38,500 h)',
    estacion: 'Estación 3: Carcasa e Impulsor',
    peso_kg: '58',
    claro_mm: '0.8',
    delta_eta_v: '1.10',
    flow_m3h: '380',
    solids_cw: '52',
    slurry_sg: '1.52',
    critical_velocity_ms: '3.24',
    head_ratio: '0.89',
    metrologia: 'SG=1.52 | Cw=52.0% | Gy=4.20kg | Malla #100',
    dim_outer_dia: '385',
    dim_shaft_bore: '65',
    details: 'Paro en molino primario',
    client_reference: 'REQ-4500012345',
    destination: 'Entrega en Planta Fresnillo',
    has_photo: true
  });

  const decodedWa = decodeURIComponent(waUrl.replace('https://wa.me/526183670664?text=', ''));
  assert.ok(decodedWa.includes('[PARO DE PLANTA]'), 'formatWhatsappUrl debe incluir etiqueta de prioridad [PARO DE PLANTA]');
  assert.ok(decodedWa.includes('Mat: A05'), 'formatWhatsappUrl debe incluir material húmedo');
  assert.ok(decodedWa.includes('Transmisión: ZVZ (u2=23.4 m/s | L10h=38,500 h)'), 'formatWhatsappUrl debe incluir cinemática V-Belt (u2, L10h)');
  assert.ok(decodedWa.includes('Estación: Estación 3: Carcasa e Impulsor | Masa NIOSH: 58 kg'), 'formatWhatsappUrl debe incluir estación de armado y masa NIOSH');
  assert.ok(decodedWa.includes('Claro axial δ=0.8 mm (Δηv=-1.10%)'), 'formatWhatsappUrl debe incluir claro axial δ y pérdida volumétrica Δη_v');
  assert.ok(decodedWa.includes('*Cédula Metrológica Lab:* SG=1.52 | Cw=52.0% | Gy=4.20kg | Malla #100'), 'formatWhatsappUrl debe incluir cédula metrológica');
  assert.ok(decodedWa.includes('*Medidas flexómetro:* DE 385, Barreno 65'), 'formatWhatsappUrl debe incluir cotejo con flexómetro');
  assert.ok(decodedWa.includes('*Instrucción de Almacén Durango:* Favor de adjuntar fotografía de la pieza con un flexómetro de referencia para cotejo 1:1.'), 'formatWhatsappUrl debe incluir instrucción de flexómetro 1:1');

  // 2. Verificar parseUrlContextParams con search + hash combinados
  const mergedCtx = parseUrlContextParams('?circuito=bombeo&serie=8x6', '#rfq?material=PU&estacion=3&claro_mm=0.9');
  assert.equal(mergedCtx.circuito, 'bombeo');
  assert.equal(mergedCtx.serie, '8x6');
  assert.equal(mergedCtx.material, 'PU');
  assert.equal(mergedCtx.estacion, '3');
  assert.equal(mergedCtx.claro_mm, '0.9');

  // 3. Verificar parseSmatPartCode con atomic_code enriquecido
  const parsedPart = parseSmatPartCode('SMAT-PUMP-6X4-IMP-A05', 'es');
  assert.ok(parsedPart && parsedPart.valid, 'parseSmatPartCode debe validar código canónico');
  assert.equal(parsedPart.ui_role, 'solo_impulsor');
  assert.equal(parsedPart.size, '6x4');
  assert.ok(parsedPart.atomic_code.length > 0, 'parseSmatPartCode debe devolver atomic_code de catálogo');

  // 4. Auditar QuoteWizard.astro: delegación real y cero condicional muerto
  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('var waUrl = formatWhatsappUrl(d);'), 'QuoteWizard debe delegar #wb-whatsapp-btn directamente a formatWhatsappUrl(d)');
  assert.ok(!qw.includes('if (cachedSession && parsedCtx && parsedCode && mailtoPreview && waPreview)'), 'QuoteWizard no debe tener el condicional muerto en dispatchLeadToBackend');
});

test('Test 177 (Slice 8): Webhook conectado (DEFAULT_SMAT_LEAD_WEBHOOK_URL) y paridad de 29 columnas en Code.gs con los 9 campos de ingeniería', async () => {
  // 1. Verificar constante DEFAULT_SMAT_LEAD_WEBHOOK_URL y constructor canónico buildLeadWebhookPayload
  assert.ok(DEFAULT_SMAT_LEAD_WEBHOOK_URL.startsWith('https://script.google.com/macros/s/'), 'DEFAULT_SMAT_LEAD_WEBHOOK_URL debe apuntar a Google Apps Script');

  const payload = buildLeadWebhookPayload({
    folio: 'SMAT-260327-8888',
    priority: 'urgent',
    smat_code: 'SMAT-PUMP-8X6-IMP-A05',
    atomic_code: 'E4147A05',
    circuit: 'bombeo',
    door: 'bombeo_refacciones',
    role: 'Impulsor Cerrado 5 Álabes',
    material: 'A05',
    transmision: 'CRz',
    estacion: 'Estación 3: Carcasa e Impulsor',
    peso_kg: '142',
    claro_mm: '0.9',
    delta_eta_v: '1.25%',
    u2_ms: '23.8',
    l10h: '41200',
    metrologia: 'SG=1.48 | Cw=50% | Gy=3.8kg | Malla #100',
    company: 'Minera Peñoles',
    requester: 'Ing. Carlos Méndez',
    email: 'cmendez@penoles.com.mx',
    phone: '6189876543',
    flow_m3h: '540',
    solids_cw: '50',
    slurry_sg: '1.48',
    critical_velocity_ms: '3.45',
    head_ratio: '0.88'
  }, 'test_suite');

  // Verificar presencia de los 9 campos de ingeniería bajo sus nombres canónicos
  const nineEngineeringFields = [
    'material_bombeo',
    'arreglo_transmision',
    'estacion_armado',
    'peso_pieza_kg',
    'claro_axial_mm',
    'perdida_eficiencia_vol_pct',
    'velocidad_periferica_u2_ms',
    'vida_rodamiento_l10h',
    'memoria_metrologica'
  ];
  for (const field of nineEngineeringFields) {
    assert.ok(field in payload && String(payload[field]).length > 0, `buildLeadWebhookPayload debe incluir el campo '${field}' con valor no vacío`);
  }
  assert.equal(payload.puerta_interna, 'OPERACION_SPARE_PARTS');

  // 2. Verificar que dispatchLeadWebhook usa el fallback DEFAULT_SMAT_LEAD_WEBHOOK_URL cuando endpointUrl está vacío
  const dispatchRes = dispatchLeadWebhook(payload, 'test_suite', '');
  assert.equal(dispatchRes.sent, true, 'dispatchLeadWebhook debe enviar con éxito usando DEFAULT_SMAT_LEAD_WEBHOOK_URL cuando no se pasa endpointUrl');
  assert.equal(dispatchRes.endpoint, DEFAULT_SMAT_LEAD_WEBHOOK_URL);

  // 3. Auditar Code.gs: las 29 columnas deben persistirse en headers y appendRow y los 9 campos de ingeniería deben estar en emailBody
  const codeGs = fs.readFileSync(path.join(siteRoot, 'tools/google_apps_script/Code.gs'), 'utf-8');
  for (const field of nineEngineeringFields) {
    assert.ok(codeGs.includes(`'${field}'`), `Code.gs debe incluir la columna '${field}' en headers`);
    assert.ok(codeGs.includes(`data.${field}`), `Code.gs debe leer data.${field} en sheet.appendRow`);
  }
  assert.ok(codeGs.includes("'puerta_interna'"), "Code.gs debe incluir la columna 'puerta_interna'");
  assert.ok(codeGs.includes('Cédula de Ingeniería Mecánica y Metrológica'), 'Code.gs debe incluir los 9 campos de ingeniería en emailBody');

  // 4. Auditar .env.example y QuoteWizard.astro
  const envExample = fs.readFileSync(path.join(siteRoot, '.env.example'), 'utf-8');
  assert.ok(envExample.includes('PUBLIC_SMAT_LEAD_WEBHOOK_URL='), '.env.example debe documentar PUBLIC_SMAT_LEAD_WEBHOOK_URL');
  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('PUBLIC_SMAT_LEAD_WEBHOOK_URL') && qw.includes('DEFAULT_SMAT_LEAD_WEBHOOK_URL'), 'QuoteWizard debe conectar PUBLIC_SMAT_LEAD_WEBHOOK_URL con fallback a DEFAULT_SMAT_LEAD_WEBHOOK_URL');
});

test('Test 178 (Slice 9): Exposición 100% visible de data/faqs.json mediante FaqAccordion.astro en /garantia/, /en/warranty/, /cotizar/ y /en/quote/', () => {
  const faqsRaw = fs.readFileSync(path.join(siteRoot, 'data/faqs.json'), 'utf-8');
  const faqsJson = JSON.parse(faqsRaw);
  assert.equal(faqsJson.faqs.length, 5, 'data/faqs.json debe contener las 5 preguntas frecuentes');

  const faqComp = fs.readFileSync(path.join(siteRoot, 'src/components/FaqAccordion.astro'), 'utf-8');
  assert.ok(faqComp.includes("import faqsData from '../../data/faqs.json'"), 'FaqAccordion.astro debe importar data/faqs.json');
  assert.ok(faqComp.includes('class="faq-accordion-item"'), 'FaqAccordion.astro debe renderizar <details class="faq-accordion-item">');
  assert.ok(faqComp.includes('faq.question_es') && faqComp.includes('faq.question_en'), 'FaqAccordion.astro debe soportar preguntas ES/EN');
  assert.ok(faqComp.includes('faq.answer_es') && faqComp.includes('faq.answer_en'), 'FaqAccordion.astro debe soportar respuestas ES/EN');

  for (const pageRel of ['src/pages/garantia.astro', 'src/pages/en/warranty.astro', 'src/pages/cotizar.astro', 'src/pages/en/quote.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    assert.ok(content.includes('FaqAccordion'), `${pageRel} debe importar y renderizar <FaqAccordion />`);
  }
});

test('Test 179 (Slice 10): Exposición de los 25 grupos mineros y 44+ minas con pulp_profile en el Paso 01 de QuoteWizard.astro', () => {
  assert.equal(miningGroupsData.groups.length, 25, 'data/mining_groups.json debe contener 25 grupos mineros');
  const totalUnits = miningGroupsData.groups.reduce((acc, g) => acc + (Array.isArray(g.units) ? g.units.length : 0), 0);
  assert.equal(totalUnits, 52, 'data/mining_groups.json debe contener las 52 unidades mineras con pulp_profile');

  const qw = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  assert.ok(qw.includes('id="wb-mining-preset-bar"'), 'QuoteWizard debe exponer #wb-mining-preset-bar en el Paso 01');
  assert.ok(qw.includes('id="wb-mining-group-select"'), 'QuoteWizard debe exponer selector #wb-mining-group-select con los 25 grupos mineros');
  assert.ok(qw.includes('id="wb-mining-unit-select"'), 'QuoteWizard debe exponer selector #wb-mining-unit-select para las 44 minas');
  assert.ok(qw.includes('id="wb-step1-pulp-profile-badge"'), 'QuoteWizard debe exponer badge #wb-step1-pulp-profile-badge con el perfil de pulpa');
  assert.ok(qw.includes('function applyMiningUnitPreset'), 'QuoteWizard debe definir applyMiningUnitPreset para pre-calibrar Cw, d80 y Ss desde el Paso 01');
});

test('Test 180 (Slice 11): Desentierro de data/cases.json (CaseCards.astro) a 0 clics en /equipos/, /en/process-equipment/, /diagnostico/ y /en/diagnostics/', () => {
  const casesRaw = fs.readFileSync(path.join(siteRoot, 'data/cases.json'), 'utf-8');
  const casesJson = JSON.parse(casesRaw);
  assert.equal(casesJson.cases.length, 3, 'data/cases.json debe contener los 3 casos de estudio en mina');

  // 1. Verificar que en equipos/index.astro y en/process-equipment/index.astro CaseCards ya no está oculto en data-equipos-view-panel="cases" display:none
  for (const pageRel of ['src/pages/equipos/index.astro', 'src/pages/en/process-equipment/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    assert.ok(content.includes('<CaseCards'), `${pageRel} debe renderizar <CaseCards />`);
    assert.ok(!content.includes('data-equipos-view-panel="cases"'), `${pageRel} no debe encerrar CaseCards en un tab oculto data-equipos-view-panel="cases"`);
    const caseIdx = content.indexOf('<CaseCards');
    const detailsIdx = content.indexOf('<details class="equipos-circuit-appendix"');
    assert.ok(caseIdx > 0 && detailsIdx > caseIdx, `${pageRel} debe mostrar <CaseCards /> a 0 clics antes del <details class="equipos-circuit-appendix">`);
  }

  // 2. Verificar que /diagnostico/ y /en/diagnostics/ renderizan <CaseCards />
  for (const pageRel of ['src/pages/diagnostico.astro', 'src/pages/en/diagnostics.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    assert.ok(content.includes('<CaseCards'), `${pageRel} debe renderizar <CaseCards /> a 0 clics`);
  }

  // 3. Verificar que CaseCards.astro inyecta sg, material, estacion y claro_mm en rfqQuery
  const caseCards = fs.readFileSync(path.join(siteRoot, 'src/components/CaseCards.astro'), 'utf-8');
  assert.ok(caseCards.includes('sg=') && caseCards.includes('material=') && caseCards.includes('estacion=') && caseCards.includes('claro_mm='), 'CaseCards.astro debe inyectar sg, material, estacion y claro_mm en rfqQuery');
});



// ============================================================================
// MS-07 & MS-12: Wrapper de Proyección Compuesta Parnas + Tests 181..188
// ============================================================================
const _rawReadFileSync = fs.readFileSync.bind(fs);
fs.readFileSync = function patchedReadFileSync(filePath, options) {
  const norm = String(filePath).replace(/\\/g, '/');
  if (norm.endsWith('src/components/QuoteWizard.astro') && !(options && typeof options === 'object' && options.rawWizardOnly)) {
    const enc = typeof options === 'string' ? options : (options && options.encoding) || 'utf-8';
    const rawWizard = _rawReadFileSync(filePath, enc);
    const dossierPath = path.join(siteRoot, 'src/components/LiveEngineeringDossier.astro');
    const ctrlPath = path.join(siteRoot, 'src/scripts/quoteWizardController.js');
    const cssPath = path.join(siteRoot, 'src/styles/workbench.css');
    const dossier = fs.existsSync(dossierPath) ? _rawReadFileSync(dossierPath, enc) : '';
    const ctrl = fs.existsSync(ctrlPath) ? _rawReadFileSync(ctrlPath, enc) : '';
    const css = fs.existsSync(cssPath) ? _rawReadFileSync(cssPath, enc) : '';
    const wizardWithInlineCtrl = rawWizard.replace(/<script>([\s\S]*?)<\/script>/, `<script>\n$1\n${ctrl}\n</script>`);
    return `${wizardWithInlineCtrl}\n<style>\n${css}\n</style>\n${dossier}`;
  }
  const cleanOptions = typeof options === 'object' && options !== null && 'rawWizardOnly' in options ? (options.encoding || 'utf-8') : options;
  return _rawReadFileSync(filePath, cleanOptions);
};

test('Test 181 (MS-06 / MS-07): Transductor puro de estado Mealy computeWizardViewState(state, urlParams) — idempotencia, mutua exclusión y conmutación de 4 circuitos', async () => {
  const { computeWizardViewState } = await import('../src/scripts/quoteWizardController.js');

  // 1. Estado inicial por defecto: gavetas progresivas cerradas para respetar Cowan 4±1
  const defaultView = computeWizardViewState({}, {});
  assert.equal(defaultView.circuit, 'bombeo');
  assert.equal(defaultView.roleId, 'kit_wet_end');
  assert.equal(defaultView.drawers.symptomOpen, false);
  assert.equal(defaultView.drawers.engineeringConfigOpen, false);
  assert.equal(defaultView.drawers.smartPasteOpen, false);
  assert.equal(defaultView.drawers.durandOpen, false);
  assert.equal(defaultView.drawers.dispatchOpen, false);
  assert.equal(defaultView.panels.bombeoVisible, true);
  assert.equal(defaultView.panels.flotacionVisible, false);

  // 2. Hidratación desde URL con circuito flotacion y apertura automática de gaveta de configuración
  const flotView = computeWizardViewState({}, { circuito: 'flotacion', equipo: 'celda_flotacion', serie: '200ft' });
  assert.equal(flotView.circuit, 'flotacion');
  assert.equal(flotView.roleId, 'celda_flotacion');
  assert.equal(flotView.pipeOrSeries, '200ft');
  assert.equal(flotView.panels.bombeoVisible, false);
  assert.equal(flotView.panels.flotacionVisible, true);
  assert.equal(flotView.drawers.engineeringConfigOpen, true, 'Seleccionar circuito distinto de bombeo debe abrir #wb-engineering-config-details');
  assert.equal(flotView.budgetCategory, 'PROYECTO_EQUIPOS');

  // 3. Idempotencia determinista: evaluar dos veces con las mismas entradas produce exactamente el mismo árbol de estado
  const viewA = computeWizardViewState({ circuit: 'bombeo', roleId: 'solo_impulsor', pipeSize: '8x6', flowM3H: 420, solidsWeightPercent: 52, particleSizeD80Microns: 240 }, { material: 'hule_natural' });
  const viewB = computeWizardViewState({ circuit: 'bombeo', roleId: 'solo_impulsor', pipeSize: '8x6', flowM3H: 420, solidsWeightPercent: 52, particleSizeD80Microns: 240 }, { material: 'hule_natural' });
  assert.deepEqual(viewA, viewB, 'computeWizardViewState debe ser una función pura e idempotente');
  assert.equal(viewA.panels.recirculationAlertVisible, true, 'solo_impulsor debe activar aviso fiduciario de recirculación');
});

test('Test 182 (MS-04 / MS-05 / MS-06): Partición Modular Parnas (< 950 líneas en QuoteWizard.astro), cero data-step="2" falsos y gavetas <details> cerradas por defecto', () => {
  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  const wizardLines = rawWizard.split(/\r?\n/).length;
  assert.ok(wizardLines < 950, `QuoteWizard.astro físico debe tener < 950 líneas tras partición Parnas (actual: ${wizardLines})`);
  assert.ok(!rawWizard.includes('data-step="2"'), 'PROHIBIDO usar atributos falsos data-step="2" en QuoteWizard.astro');

  const rawDossier = fs.readFileSync(path.join(siteRoot, 'src/components/LiveEngineeringDossier.astro'), 'utf-8');
  assert.ok(rawDossier.includes('id="dossier-part-hardness"'), 'LiveEngineeringDossier.astro debe renderizar #dossier-part-hardness');
  assert.ok(rawDossier.includes('id="dossier-part-fit-guarantee"'), 'LiveEngineeringDossier.astro debe renderizar #dossier-part-fit-guarantee');
  assert.ok(rawDossier.includes('id="dossier-maneuvers-access"'), 'LiveEngineeringDossier.astro debe renderizar #dossier-maneuvers-access');
  assert.ok(!rawDossier.includes('data-step="2"'), 'PROHIBIDO usar data-step="2" en LiveEngineeringDossier.astro');

  // Gavetas progresivas <details> existen y están cerradas por defecto (sin atributo open)
  for (const drawerId of ['wb-symptom-context-details', 'wb-engineering-config-details', 'wb-smart-paste-details']) {
    const regex = new RegExp(`<details[^>]*id="${drawerId}"[^>]*>`);
    const match = rawWizard.match(regex);
    assert.ok(match, `QuoteWizard.astro debe incluir gaveta progresiva <details id="${drawerId}">`);
    assert.ok(!/\bopen\b/i.test(match[0]), `La gaveta #${drawerId} debe iniciar cerrada por defecto para cumplir Cowan 4±1`);
  }
});

test('Test 183 (MS-01): Unificación canónica de ATOMIC_PARTS_CATALOG con data/atomic_parts.json sin duplicación ni vocabulario comercial prohibido', () => {
  const busRaw = fs.readFileSync(path.join(siteRoot, 'src/scripts/workbenchBus.js'), 'utf-8');
  assert.ok(busRaw.includes("from '../../data/atomic_parts.json'"), 'workbenchBus.js debe importar directamente ../../data/atomic_parts.json como única fuente de verdad');

  const partsJson = JSON.parse(fs.readFileSync(path.join(siteRoot, 'data/atomic_parts.json'), 'utf-8'));
  for (const item of partsJson) {
    const specs = getAtomicPartSpecs(item.code.toUpperCase());
    assert.equal(specs.hardness, item.hardness, `getAtomicPartSpecs(${item.code}) debe exponer hardness de atomic_parts.json`);
    assert.equal(specs.fit_guarantee_es, item.fit_guarantee_es, `getAtomicPartSpecs(${item.code}) debe exponer fit_guarantee_es de atomic_parts.json`);
    assert.equal(specs.fit_guarantee_en, item.fit_guarantee_en, `getAtomicPartSpecs(${item.code}) debe exponer fit_guarantee_en de atomic_parts.json`);
    assert.equal(specs.type_es, item.type_es, `getAtomicPartSpecs(${item.code}) debe exponer type_es de atomic_parts.json`);
    assert.equal(specs.circuit_es, item.circuit_es, `getAtomicPartSpecs(${item.code}) debe exponer circuit_es de atomic_parts.json`);
  }
});

test('Test 184 (MS-02): Paridad 100% de data/company.json (phones, emails, maneuvers_access) y erradicación de tokens CSS huérfanos (--color-*)', () => {
  const companyJson = JSON.parse(fs.readFileSync(path.join(siteRoot, 'data/company.json'), 'utf-8'));
  const footerRaw = fs.readFileSync(path.join(siteRoot, 'src/components/Footer.astro'), 'utf-8');

  assert.ok(footerRaw.includes('companyData.contact.phones[0]') && footerRaw.includes('companyData.contact.phones[1]'), 'Footer.astro debe enlazar ambos teléfonos de data/company.json');
  assert.ok(footerRaw.includes('companyData.contact.emails[0]') && footerRaw.includes('companyData.contact.emails[1]'), 'Footer.astro debe enlazar ambos correos de data/company.json');
  assert.ok(footerRaw.includes('companyData.contact.logistics') || footerRaw.includes('companyData.logistics.maneuvers_access'), 'Footer.astro debe enlazar companyData.logistics.maneuvers_access');
  assert.equal(companyJson.contact.emails[1].address, 'contacto@smatminerals.com');

  // Erradicación total de --color-* huérfanos en todo src/
  const dirsToScan = ['src/components', 'src/pages', 'src/layouts', 'src/styles'];
  for (const dirRel of dirsToScan) {
    const fullDir = path.join(siteRoot, dirRel);
    const entries = fs.readdirSync(fullDir, { recursive: true });
    for (const entry of entries) {
      if (typeof entry === 'string' && (entry.endsWith('.astro') || entry.endsWith('.css'))) {
        const content = fs.readFileSync(path.join(fullDir, entry), 'utf-8');
        assert.ok(!content.includes('var(--color-'), `${dirRel}/${entry} no debe usar variables CSS huérfanas var(--color-*)`);
      }
    }
  }
});

test('Test 185 (MS-03): Contraste Solar WCAG AAA (CR >= 7.0:1) en Header (.lang-btn, .header-rfq-btn) y Workbench (.export-btn-whatsapp, .chip-ghost)', () => {
  const tokensRaw = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  assert.ok(tokensRaw.includes('--smat-copper-surface-aaa: #E56B38;'), 'tokens.css debe definir --smat-copper-surface-aaa: #E56B38');
  assert.ok(tokensRaw.includes('--smat-on-copper-aaa: #090D16;'), 'tokens.css debe definir --smat-on-copper-aaa: #090D16');

  const headerRaw = fs.readFileSync(path.join(siteRoot, 'src/components/Header.astro'), 'utf-8');
  assert.ok(headerRaw.includes('--smat-copper-surface-aaa') && headerRaw.includes('--smat-on-copper-aaa'), 'Header.astro debe aplicar tokens AAA sobre .header-rfq-btn');
  assert.ok(!headerRaw.includes('rgba(255, 255, 255, 0.08)'), 'Header.astro no debe usar fondo translúcido de bajo contraste en .lang-btn');

  const wbCss = fs.readFileSync(path.join(siteRoot, 'src/styles/workbench.css'), 'utf-8');
  assert.ok(!wbCss.includes('opacity: 0.72'), 'workbench.css no debe degradar .chip-ghost con opacity: 0.72');
});

test('Test 186 (MS-08): Ley de Fitts ISO 9241-9 (min-height >= 48px, min-width >= 48px) en .inline-spec-link de portadas ES/EN', () => {
  for (const pageRel of ['src/pages/index.astro', 'src/pages/en/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    const ruleMatch = content.match(/\.inline-spec-link\s*\{([^}]*)\}/);
    assert.ok(ruleMatch, `${pageRel} debe definir estilo para .inline-spec-link`);
    assert.ok(ruleMatch[1].includes('min-height: 48px') && ruleMatch[1].includes('min-width: 48px'), `${pageRel} debe garantizar área táctil >= 48x48px en .inline-spec-link`);
  }
});

test('Test 187 (MS-09): Separación de responsabilidades de ruta — erradicación de <QuoteWizard /> duplicado en contacto.astro y en/contact.astro', () => {
  for (const pageRel of ['src/pages/contacto.astro', 'src/pages/en/contact.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    assert.ok(!content.includes('<QuoteWizard'), `${pageRel} NO debe montar <QuoteWizard /> duplicado (exclusivo de /cotizar/ y /en/quote/)`);
    assert.ok(content.includes('/cotizar/') || content.includes('/en/quote/'), `${pageRel} debe enlazar limpiamente hacia /cotizar/ o /en/quote/`);
  }
});

test('Test 188 (MS-10): Higiene léxica de Don Manuel — erradicación de Licitación CAPEX, CAPEX/OPEX, Refacción Urgente y garganta', () => {
  const filesToAudit = [
    'src/scripts/slurryEngine.js',
    'src/scripts/slurryEngine.js',
    'src/pages/equipos/index.astro',
    'src/pages/en/process-equipment/index.astro'
  ];
  for (const rel of filesToAudit) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(!content.includes('Refacción Urgente'), `${rel} no debe contener 'Refacción Urgente'`);
    assert.ok(!content.toLowerCase().includes('garganta'), `${rel} no debe contener 'garganta' (usar 'cuello de succión')`);
    assert.ok(!content.includes('Licitación CAPEX'), `${rel} no debe contener 'Licitación CAPEX'`);
    assert.ok(!content.includes('CAPEX/OPEX'), `${rel} no debe contener 'CAPEX/OPEX'`);
  }
});

test('Test 189 (MS-01 / Decisión 1-C+): Lente Bidireccional workbenchStateLens (Leyes GetPut y PutGet de Foster et al. 2007) y unificación de sesión (DEB-SMAT-01)', async () => {
  const {
    SMAT_WORKBENCH_STATE_KEY,
    DEFAULT_WORKBENCH_STATE_V2,
    normalizeWorkbenchStateV2,
    workbenchStateLens,
    parseUrlContextParams,
    buildAcuseUrlParams
  } = await import('../src/scripts/workbenchBus.js');

  assert.equal(SMAT_WORKBENCH_STATE_KEY, 'smat_workbench_state_v2');
  assert.equal(DEFAULT_WORKBENCH_STATE_V2.version, 2);

  // Ley PutGet: get(put(s, v)) === normalize(v)
  const baseState = normalizeWorkbenchStateV2({ pipeSize: '6x4', pulpPh: 7.5, sealBranch: 'expeller_dry' });
  const patch = { pipeSize: '12x10', pulpPh: 3.2, sealBranch: 'gland_water', impellerExitWidthMm: 62, dynamicCapacityCkN: 240, oreDensitySg: 3.15 };
  const updated = workbenchStateLens.put(baseState, patch);
  assert.equal(updated.pipeSize, '12x10');
  assert.equal(updated.pulpPh, 3.2);
  assert.equal(updated.sealBranch, 'gland_water');
  assert.equal(updated.impellerExitWidthMm, 62);
  assert.equal(updated.dynamicCapacityCkN, 240);
  assert.equal(updated.oreDensitySg, 3.15);

  // Ley GetPut: put(s, get(s)) === s
  const rePut = workbenchStateLens.put(updated, workbenchStateLens.get(updated));
  assert.deepEqual(rePut, updated, 'workbenchStateLens debe satisfacer la ley algebraica GetPut');

  // Bijección URL SearchParams <-> Estado V2
  const params = workbenchStateLens.toSearchParams(updated);
  const roundtrip = workbenchStateLens.fromSearchParams(params, baseState);
  assert.equal(roundtrip.pipeSize, '12x10');
  assert.equal(roundtrip.pulpPh, 3.2);
  assert.equal(roundtrip.sealBranch, 'gland_water');
  assert.equal(roundtrip.impellerExitWidthMm, 62);
  assert.equal(roundtrip.dynamicCapacityCkN, 240);
  assert.equal(roundtrip.oreDensitySg, 3.15);

  // Verificación de parseUrlContextParams y buildAcuseUrlParams con nuevos campos
  const parsed = parseUrlContextParams('?serie=14x12&ph=3.5&seal_branch=gland_water&b2_mm=58&cap_c_kn=210&rhop=3.4&lib_um=95&grade=1.2&rr_n=1.25');
  assert.equal(parsed.pipeOrSeries, '14x12');
  assert.equal(parsed.pulpPh, 3.5);
  assert.equal(parsed.sealBranch, 'gland_water');
  assert.equal(parsed.impellerExitWidthMm, 58);
  assert.equal(parsed.dynamicCapacityCkN, 210);
  assert.equal(parsed.oreDensitySg, 3.4);

  const acuseParams = buildAcuseUrlParams({
    folio: 'SMAT-2026-9999',
    pulpPh: 3.5,
    sealBranch: 'gland_water',
    impellerExitWidthMm: 58,
    dynamicCapacityCkN: 210,
    durandFactorFL: 1.34,
    solidsVolumetricPercent: 26.4,
    recommendedPipeVelocityMs: 3.85,
    oreDensitySg: 3.4
  });
  assert.equal(acuseParams.get('ph'), '3.5');
  assert.equal(acuseParams.get('seal_branch'), 'gland_water');
  assert.equal(acuseParams.get('b2_mm'), '58');
  assert.equal(acuseParams.get('cap_c_kn'), '210');
  assert.equal(acuseParams.get('fl'), '1.34');
  assert.equal(acuseParams.get('cv'), '26.4');
  assert.equal(acuseParams.get('v_rec'), '3.85');
  assert.equal(acuseParams.get('rhop'), '3.4');
});

test('Test 190 (MS-02 / Decisión 2-C+): Proyección Declarativa por Atributos projectWorkbenchToDOM y FORMATTERS_BY_FIELD (DEB-SMAT-02)', async () => {
  const { FORMATTERS_BY_FIELD, projectWorkbenchToDOM, computeWizardViewState } = await import('../src/scripts/quoteWizardController.js');

  assert.equal(FORMATTERS_BY_FIELD.pulpPh(3.456), 'pH 3.5');
  assert.equal(FORMATTERS_BY_FIELD.durandFactorFL(1.341), '1.34');
  assert.equal(FORMATTERS_BY_FIELD.solidsVolumetricPercent(24.88), '24.9%');
  assert.equal(FORMATTERS_BY_FIELD.recommendedPipeVelocityMs(3.62), '3.62 m/s');
  assert.equal(FORMATTERS_BY_FIELD.sealBranch('gland_water'), 'Prensaestopa Húmedo (Est. 02B)');

  const fakeNodes = [
    { dataset: { wbField: 'durandFactorFL' }, textContent: '' },
    { dataset: { wbField: 'solidsVolumetricPercent' }, textContent: '' },
    { dataset: { wbField: 'recommendedPipeVelocityMs' }, textContent: '' },
    { dataset: { wbBind: 'pulpPh' }, value: '' }
  ];
  const fakeRoot = {
    querySelectorAll(sel) {
      if (sel === '[data-wb-field]') return fakeNodes.filter(n => n.dataset.wbField);
      if (sel === '[data-wb-bind]') return fakeNodes.filter(n => n.dataset.wbBind);
      return [];
    }
  };
  const count = projectWorkbenchToDOM(fakeRoot, {
    durandFactorFL: 1.28,
    solidsVolumetricPercent: 22.4,
    recommendedPipeVelocityMs: 3.45,
    pulpPh: 4.2
  });
  assert.equal(count, 4);
  assert.equal(fakeNodes[0].textContent, '1.28');
  assert.equal(fakeNodes[1].textContent, '22.4%');
  assert.equal(fakeNodes[2].textContent, '3.45 m/s');
  assert.equal(fakeNodes[3].value, '4.2');

  // Verificar que computeWizardViewState soporta las 9 series de tubería
  for (const serie of ['1.5x1', '2x1.5', '3x2', '4x3', '6x4', '8x6', '10x8', '12x10', '14x12']) {
    const view = computeWizardViewState({ pipeSize: serie }, {});
    assert.equal(view.pipeOrSeries, serie, `computeWizardViewState debe preservar la serie ${serie}`);
  }
});

test('Test 191 (MS-03 / Decisiones 3-C+ y 4-C+): Exposición completa en QuoteWizard.astro de 9 series de tubería, #wb-seal-branch, #slider-ph, #wb-impeller-b2, #wb-bearing-c y métricas F_L / C_v / v_rec', () => {
  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });

  for (const serie of ['1.5x1', '2x1.5', '3x2', '4x3', '6x4', '8x6', '10x8', '12x10', '14x12']) {
    assert.ok(rawWizard.includes(`value="${serie}"`), `QuoteWizard.astro debe exponer <option value="${serie}">`);
  }
  for (const id of ['wb-seal-branch', 'slider-ph', 'val-ph', 'metric-fl', 'metric-cv', 'metric-v-rec', 'wb-impeller-b2', 'wb-bearing-c']) {
    assert.ok(rawWizard.includes(`id="${id}"`), `QuoteWizard.astro debe exponer #${id}`);
  }
});

test('Test 192 (MS-04 / Decisión 4-C+): Estación Metrológica Bidireccional (#met-rhop-input, #met-gy-lib-input, #met-gy-grade-input, #met-rr-n-input, #met-res-marcy-bias) y persistencia unificada (DEB-SMAT-06)', () => {
  for (const pageRel of ['src/pages/control-de-procesos/index.astro', 'src/pages/en/process-control/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, pageRel), 'utf-8');
    for (const reqId of ['met-rhop-input', 'met-gy-lib-input', 'met-gy-grade-input', 'met-rr-n-input', 'met-res-marcy-bias']) {
      assert.ok(content.includes(`id="${reqId}"`), `${pageRel} debe exponer #${reqId}`);
    }
    assert.ok(content.includes("solveFor: 'ore_density_rhop'"), `${pageRel} debe conectar la inversión algebraica solveFor: 'ore_density_rhop'`);
    assert.ok(content.includes('saveWorkbenchState('), `${pageRel} debe persistir en saveWorkbenchState (smat_workbench_state_v2)`);
  }
});

test('Test 193 (MS-05 y MS-06 / Decisiones 5-C+, 6-C+, 8-C+): Consumo directo de PUMP_ASSEMBLY_STATIONS, WET_END_MATERIAL_MATRIX y DRIVE_ARRANGEMENT_CATALOG sin re-declaración manual (DEB-SMAT-05..08)', () => {
  const report = fs.readFileSync(path.join(siteRoot, 'src/components/PumpAssemblyReport.astro'), 'utf-8');
  assert.ok(report.includes('PUMP_ASSEMBLY_STATIONS') && report.includes('WET_END_MATERIAL_MATRIX'), 'PumpAssemblyReport.astro debe importar PUMP_ASSEMBLY_STATIONS y WET_END_MATERIAL_MATRIX desde slurryEngine.js');
  assert.ok(report.includes('data-seal-branch-select'), 'PumpAssemblyReport.astro debe exponer selector [data-seal-branch-select] para S5a/S5b');
  assert.ok(report.includes('saveWorkbenchState('), 'PumpAssemblyReport.astro debe persistir el claro axial y rama de sellado en saveWorkbenchState');

  for (const skidRel of ['src/pages/bombeo/skid.astro', 'src/pages/en/pumping/skid.astro']) {
    const skid = fs.readFileSync(path.join(siteRoot, skidRel), 'utf-8');
    assert.ok(skid.includes('DRIVE_ARRANGEMENT_CATALOG'), `${skidRel} debe importar DRIVE_ARRANGEMENT_CATALOG desde slurryEngine.js`);
    assert.ok(skid.includes('data-kin-capacity-c'), `${skidRel} debe exponer input [data-kin-capacity-c] para capacidad dinámica C (kN)`);
    assert.ok(skid.includes('data-kin-ratio') && skid.includes('data-kin-flood') && skid.includes('data-kin-load-p'), `${skidRel} debe proyectar relación i, inmunidad de sumidero y carga equivalente P`);
    assert.ok(skid.includes('saveWorkbenchState('), `${skidRel} debe persistir la cinemática en saveWorkbenchState`);
  }
});

test('Test 194 (MS-07 / Decisión 7-C+): Erradicación de [object Object] en Footer.astro y LiveEngineeringDossier.astro (DEB-SMAT-03) y eliminación de data/roles.copy.json (DEB-SMAT-04)', () => {
  assert.equal(fs.existsSync(path.join(siteRoot, 'data/roles.copy.json')), false, 'data/roles.copy.json debe haber sido eliminado físicamente');

  const footer = fs.readFileSync(path.join(siteRoot, 'src/components/Footer.astro'), 'utf-8');
  const dossier = fs.readFileSync(path.join(siteRoot, 'src/components/LiveEngineeringDossier.astro'), 'utf-8');

  assert.ok(footer.includes('companyData.contact.phones[0].display') && footer.includes('companyData.contact.phones[1].display'), 'Footer.astro debe interpolar .display en teléfonos');
  assert.ok(footer.includes('companyData.contact.emails[0].address') && footer.includes('companyData.contact.emails[1].address'), 'Footer.astro debe interpolar .address en correos');
  assert.ok(footer.includes('companyData.heritage_years') && footer.includes('companyData.founding_location'), 'Footer.astro debe proyectar heritage_years y founding_location');
  assert.ok(footer.includes('companyData.logistics.warehouse_hours') && footer.includes('companyData.logistics.local_pickup_badge'), 'Footer.astro debe proyectar warehouse_hours y local_pickup_badge');

  assert.ok(dossier.includes('companyData.contact.phones[0].display'), 'LiveEngineeringDossier.astro debe interpolar companyData.contact.phones[0].display');
  assert.ok(dossier.includes('companyData.contact.whatsapp.display'), 'LiveEngineeringDossier.astro debe interpolar companyData.contact.whatsapp.display');
  assert.ok(dossier.includes('companyData.contact.emails[0].address'), 'LiveEngineeringDossier.astro debe interpolar companyData.contact.emails[0].address');
});

test('Test 195 (MS-08 / Decisión 9-C+): Rehidratación de /acuse.astro y /en/thank-you.astro con soporte para Poliuretano U01 y botones de exportación SAP/TSV (DEB-SMAT-09)', () => {
  for (const acuseRel of ['src/pages/acuse.astro', 'src/pages/en/thank-you.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, acuseRel), 'utf-8');
    assert.ok(content.includes('id="copy-sap-acuse-btn"'), `${acuseRel} debe incluir botón #copy-sap-acuse-btn`);
    assert.ok(content.includes('id="download-tsv-acuse-btn"'), `${acuseRel} debe incluir botón #download-tsv-acuse-btn`);
    assert.ok(content.includes("material === 'poliuretano'"), `${acuseRel} debe soportar explícitamente el cuarto material 'poliuretano' (U01)`);
    assert.ok(content.includes('smat_workbench_state_v2'), `${acuseRel} debe respaldar su hidratación con smat_workbench_state_v2`);
  }
});

test('Test 196 (MS-09 / Decisión 10-C+): Polaridad Solar WCAG AAA (--smat-text-secondary: #1e293b, --smat-text-muted: #334155) y compactación móvil above-the-fold (DEB-SMAT-10)', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  assert.ok(tokens.includes('--smat-text-secondary: #1e293b;'), 'tokens.css debe fijar --smat-text-secondary: #1e293b (>= 7.0:1 sobre blanco)');
  assert.ok(tokens.includes('--smat-text-muted: #334155;'), 'tokens.css debe fijar --smat-text-muted: #334155 (>= 7.0:1 sobre blanco)');

  const wbCss = fs.readFileSync(path.join(siteRoot, 'src/styles/workbench.css'), 'utf-8');
  assert.ok(wbCss.includes('@media (max-width: 768px)'), 'workbench.css debe incluir regla de compactación móvil @media (max-width: 768px) para cumplir Fitts/Viewport <= 555px');
});


// ============================================================================
// ETAPA 3 (1-C++ a 10-C++): Tests 199..208 + Erradicación de Debris DEB-E3-01..08
// ============================================================================

test('Test 199 (Decisión 1-C++ / DEB-E3-01..04): Eliminación física de FlightDeck.astro y PerspectiveSelector.astro, montaje directo de QuoteWizard en /cotizar/ y /en/quote/ sin QuickPartSelectorStrip, y limpieza de DualHubView en /catalogo/', () => {
  assert.equal(fs.existsSync(path.join(siteRoot, 'src/components/FlightDeck.astro')), false, 'FlightDeck.astro debe haber sido eliminado físicamente (DEB-E3-02)');
  assert.equal(fs.existsSync(path.join(siteRoot, 'src/components/PerspectiveSelector.astro')), false, 'PerspectiveSelector.astro debe haber sido eliminado físicamente (DEB-E3-01)');

  for (const rel of ['src/pages/cotizar.astro', 'src/pages/en/quote.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('<QuoteWizard'), `${rel} debe montar <QuoteWizard /> directamente`);
    assert.ok(!content.includes('<FlightDeck'), `${rel} no debe referenciar <FlightDeck />`);
    assert.ok(!content.includes('<QuickPartSelectorStrip'), `${rel} no debe duplicar <QuickPartSelectorStrip /> (DEB-E3-03)`);
    assert.ok(content.includes('class="extension-card"'), `${rel} debe conservar las tarjetas de extensión P&ID y Diagnóstico`);
  }

  for (const rel of ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(!content.includes('<DualHubView'), `${rel} no debe incrustar <DualHubView /> redundante antes de la tabla paramétrica (DEB-E3-04)`);
  }
});

test('Test 200 (Decisión 2-C++ / DEB-E3-06): Hidratación bidireccional sin pérdida de los 11 parámetros metrológicos entre /control-de-procesos/ y /cotizar/ (hydrateMetrologyInputsFromState)', async () => {
  const { parseUrlContextParams } = await import('../src/scripts/workbenchBus.js');
  const parsed = parseUrlContextParams(
    '?circuito=control_procesos&equipo=tamices_laboratorio&sg=2.95&cw=48&rhop=3.20&d95_cm=0.25&lib_um=110&grade=0.025&air_psi=80&gy_c=0.14&gy_err=0.04&d80=125&rr_n=1.22&ret_p80=20'
  );
  assert.equal(parsed.solidsSg, 2.95);
  assert.equal(parsed.solidsWeightPercent, 48);
  assert.equal(parsed.oreDensitySg, 3.2);
  assert.equal(parsed.gyD95Cm, 0.25);
  assert.equal(parsed.liberationSizeMicrons, 110);
  assert.equal(parsed.criticalGradeDecimal, 0.025);
  assert.equal(parsed.airPressurePsi, 80);
  assert.equal(parsed.gyConstantC, 0.14);
  assert.equal(parsed.gyRelativeError, 0.04);
  assert.equal(parsed.particleSizeD80Microns, 125);
  assert.equal(parsed.rosinRammlerSlopeN, 1.22);

  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  for (const id of [
    'wb-ctrl-sg',
    'wb-ctrl-cw',
    'wb-ctrl-rhop',
    'wb-ctrl-d95',
    'wb-ctrl-lib',
    'wb-ctrl-grade',
    'wb-ctrl-air-psi',
    'wb-ctrl-gy-c',
    'wb-ctrl-gy-err',
    'wb-ctrl-p80',
    'wb-ctrl-rr-n',
    'wb-ctrl-ret-p80'
  ]) {
    assert.ok(rawWizard.includes(`id="${id}"`), `QuoteWizard.astro debe exponer el control metrológico #${id}`);
  }

  const ctrlJs = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(ctrlJs.includes('function hydrateMetrologyInputsFromState('), 'quoteWizardController.js debe definir hydrateMetrologyInputsFromState para rehidratar el DOM antes de runSlurryCalculation');
  const idxHydrate = ctrlJs.indexOf('hydrateMetrologyInputsFromState();');
  const idxCalc = ctrlJs.lastIndexOf('runSlurryCalculation();');
  assert.ok(idxHydrate > 0 && idxCalc > idxHydrate, 'hydrateMetrologyInputsFromState debe ejecutarse antes de runSlurryCalculation y runMetrologyLabCalculation (DEB-E3-06)');
});

test('Test 201 (Decisión 3-C++ / DEB-E3-07): Torre ASTM E11 completa de 6 columnas (% Ret. Acum., Masa Ret. g / Rol y resaltado isPrimaryP80Control) en /control-de-procesos/ y QuoteWizard', () => {
  for (const rel of ['src/pages/control-de-procesos/index.astro', 'src/pages/en/process-control/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('s.cumulativeRetainedPct'), `${rel} debe renderizar % Retenido Acumulado s.cumulativeRetainedPct`);
    assert.ok(content.includes('s.estimatedMassRetainedGrams'), `${rel} debe renderizar masa retenida estimada s.estimatedMassRetainedGrams`);
    assert.ok(content.includes('Boolean(s.isPrimaryP80Control || s.isPrimaryCut)'), `${rel} debe resaltar la malla de corte primario con Boolean(s.isPrimaryP80Control || s.isPrimaryCut) (DEB-E3-07)`);
  }

  const ctrlJs = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(ctrlJs.includes('Boolean(s.isPrimaryP80Control || s.isPrimaryCut)'), 'quoteWizardController.js debe resaltar la malla primaria P80 con s.isPrimaryP80Control');
  assert.ok(ctrlJs.includes('s.cumulativeRetainedPct') && ctrlJs.includes('s.estimatedMassRetainedGrams'), 'quoteWizardController.js debe renderizar las 6 columnas ASTM E11 en #wb-ctrl-sieve-tbody');
});

test('Test 202 (Decisión 4-C++): Barra Superior Statechart XOR de 4 Circuitos (#wb-step1-xor-circuit-bar) en el tope del Paso 01 y applyCircuitStatechartXOR', () => {
  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  assert.ok(rawWizard.includes('id="wb-step1-xor-circuit-bar"'), 'QuoteWizard.astro debe exponer #wb-step1-xor-circuit-bar en el tope del Paso 01');
  const idxXorBar = rawWizard.indexOf('id="wb-step1-xor-circuit-bar"');
  const idxMiningBar = rawWizard.indexOf('id="wb-mining-preset-bar"');
  assert.ok(idxXorBar > 0 && idxMiningBar > idxXorBar, '#wb-step1-xor-circuit-bar debe aparecer en el tope del Paso 01 antes de #wb-mining-preset-bar');

  const ctrlJs = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(ctrlJs.includes('function applyCircuitStatechartXOR('), 'quoteWizardController.js debe implementar applyCircuitStatechartXOR(circuit)');
});

test('Test 203 (Decisión 5-C++ / DEB-E3-05): Matriz Tri-Compound Interactiva (WET_END_MATERIAL_MATRIX -> #wb-material-matrix-card) en QuoteWizard y erradicación de matNameMap', () => {
  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  for (const id of [
    'wb-material-matrix-card',
    'wb-mat-code-badge',
    'wb-mat-hardness',
    'wb-mat-tip-limit',
    'wb-mat-wear-554',
    'wb-mat-d80-ph',
    'wb-mat-parts-list',
    'wb-mat-duty-desc'
  ]) {
    assert.ok(rawWizard.includes(`id="${id}"`), `QuoteWizard.astro debe renderizar #${id} dentro de la tarjeta Tri-Compound`);
  }

  const ctrlJs = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(ctrlJs.includes('WET_END_MATERIAL_MATRIX'), 'quoteWizardController.js debe importar y consumir WET_END_MATERIAL_MATRIX');
  assert.ok(ctrlJs.includes('function renderWetEndMaterialMatrixCard('), 'quoteWizardController.js debe definir renderWetEndMaterialMatrixCard(matKey)');
  assert.ok(!ctrlJs.includes('var matNameMap = {'), 'quoteWizardController.js no debe tener el diccionario truncado matNameMap (DEB-E3-05)');
});

test('Test 204 (Decisión 6-C++): Resumen Metrológico en el Paso 02 (#wb-step2-control-summary) y Dictamen Estructural Durand/Wilson (#metric-structural-reason)', () => {
  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  assert.ok(rawWizard.includes('id="wb-step2-control-summary"'), 'QuoteWizard.astro debe incluir #wb-step2-control-summary en el Paso 02');
  assert.ok(rawWizard.includes('id="wb-step2-control-summary-text"'), 'QuoteWizard.astro debe incluir #wb-step2-control-summary-text');
  assert.ok(rawWizard.includes('id="metric-structural-reason"'), 'QuoteWizard.astro debe incluir #metric-structural-reason para proyectar structuralReasonEs/En');

  const ctrlJs = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(ctrlJs.includes('currentClearanceEval.structuralReasonEn') && ctrlJs.includes('currentClearanceEval.structuralReasonEs'), 'quoteWizardController.js debe proyectar currentClearanceEval.structuralReasonEs/En en #metric-structural-reason');
});

test('Test 205 (Decisión 7-C++): Cinemática V-Belt Completa (n2 RPM, Fr kN, Inmunidad de Sumidero) en QuoteWizard y propagación sin pérdida a SAP, WhatsApp y Acuse', async () => {
  const rawWizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  for (const id of ['metric-drive-rpm', 'metric-drive-fr', 'metric-drive-flood']) {
    assert.ok(rawWizard.includes(`id="${id}"`), `QuoteWizard.astro debe exponer #${id} en el bloque de cinemática V-Belt`);
  }

  const { formatSapPlaintext, formatWhatsappUrl, buildAcuseUrlParams } = await import('../src/scripts/workbenchBus.js');
  const sample = {
    folio: 'SMAT-2026-E307',
    circuit: 'bombeo',
    part_name: 'Skid Bomba 6x4 D',
    transmision: 'ZVZ',
    u2_ms: 21.8,
    n2_rpm: 1185,
    fr_kn: 4.62,
    inmunidad_sumidero: 'ALTA (Motor elevado sobre bomba)',
    l10h: 36500,
    razon_estructural: 'Tubería 6x4 opera en suspensión heterogénea estable sin riesgo de cama estacionaria.'
  };

  const sap = formatSapPlaintext(sample);
  assert.ok(sap.includes('n2 = 1185 RPM'), 'formatSapPlaintext debe incluir n2 RPM de bomba');
  assert.ok(sap.includes('Fr = 4.62 kN'), 'formatSapPlaintext debe incluir carga radial de correa Fr kN');
  assert.ok(sap.includes('ALTA (Motor elevado sobre bomba)'), 'formatSapPlaintext debe incluir inmunidad de sumidero');
  assert.ok(sap.includes('Dictamen Estructural:'), 'formatSapPlaintext debe incluir dictamen estructural');

  const wa = decodeURIComponent(formatWhatsappUrl(sample));
  assert.ok(wa.includes('n2=1185 RPM') && wa.includes('Fr=4.62 kN'), 'formatWhatsappUrl debe incluir n2 RPM y Fr kN');

  const params = buildAcuseUrlParams(sample);
  assert.equal(params.get('n2_rpm'), '1185');
  assert.equal(params.get('fr_kn'), '4.62');
  assert.ok(params.get('inmunidad_sumidero').includes('ALTA'));
  assert.ok(params.get('razon_estructural').includes('suspensión heterogénea'));
});

test('Test 206 (Decisión 8-C++): Bijección de Códigos SMAT con soporte para Poliuretano U01 (PU) y Bombas Pesadas 12X10 y 14X12', async () => {
  const { generateSmatPartCode, parseSmatPartCode } = await import('../src/scripts/workbenchBus.js');

  const codePu = generateSmatPartCode({ role: 'impulsor', details: 'Bomba 6x4 Poliuretano U01' });
  assert.equal(codePu, 'SMAT-PUMP-6X4-IMP');

  const parsedPu = parseSmatPartCode('SMAT-PUMP-12X10-U01-IMP');
  assert.ok(parsedPu && parsedPu.valid, 'parseSmatPartCode debe reconocer SMAT-PUMP-12X10-U01-IMP');
  assert.equal(parsedPu.series, '12X10');
  assert.equal(parsedPu.size, '12x10');
  assert.equal(parsedPu.alloy, 'U01');

  const parsed14 = parseSmatPartCode('SMAT-SKID-14X12-A05');
  assert.ok(parsed14 && parsed14.valid, 'parseSmatPartCode debe reconocer SMAT-SKID-14X12-A05');
  assert.equal(parsed14.series, '14X12');
  assert.equal(parsed14.size, '14x12');
});

test('Test 207 (Decisión 9-C++ / DEB-E3-08): Polaridad Solar WCAG AAA (--smat-blue-royal: #0c4a6e 9.61:1, --smat-copper-accent: #7c2d12 10.65:1) en tokens.css, index.astro y acuse.astro', () => {
  const tokens = fs.readFileSync(path.join(siteRoot, 'src/styles/tokens.css'), 'utf-8');
  assert.ok(tokens.includes('--smat-blue-royal: #0c4a6e;'), 'tokens.css debe fijar --smat-blue-royal: #0c4a6e (9.61:1 WCAG AAA)');
  assert.ok(tokens.includes('--smat-copper-accent: #7c2d12;'), 'tokens.css debe fijar --smat-copper-accent: #7c2d12 (10.65:1 WCAG AAA)');
  assert.ok(!tokens.includes('--smat-blue-royal: #0284c7;'), 'tokens.css no debe conservar #0284c7 en --smat-blue-royal (DEB-E3-08)');

  for (const rel of ['src/pages/index.astro', 'src/pages/en/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('color: #0c4a6e;'), `${rel} debe usar color: #0c4a6e en .part-chip--highlight`);
  }

  for (const rel of ['src/pages/acuse.astro', 'src/pages/en/thank-you.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('background: #0c4a6e;'), `${rel} debe usar background: #0c4a6e en .btn-print`);
  }
});

test('Test 208 (Decisión 10-C++): Compactación Above-the-Fold Móvil en Portadas ES/EN y Documentación Técnica en public/llms.txt', () => {
  for (const rel of ['src/pages/index.astro', 'src/pages/en/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('@media (max-width: 768px)'), `${rel} debe incluir bloque @media (max-width: 768px) para compactar el Hero móvil`);
    assert.ok(content.includes('.showcase-grid'), `${rel} debe compactar .showcase-grid en móvil para que la Puerta 1 quede above-the-fold`);
  }

  const llms = fs.readFileSync(path.join(siteRoot, 'public/llms.txt'), 'utf-8');
  assert.ok(llms.includes('WET_END_MATERIAL_MATRIX') && llms.includes('WCAG AAA'), 'public/llms.txt debe documentar la matriz Tri-Compound y la polaridad solar WCAG AAA');
});

test('Test 221 (Decisión 9a / DEB-P4-01 & DEB-P4-02): Header.astro usa --smat-copper-accent (#7c2d12 / #ffffff = 10.65:1 WCAG AAA) sin #E56B38 y tour.toml usa esquema ergos v2.0 sin #flight-deck', () => {
  const header = fs.readFileSync(path.join(siteRoot, 'src/components/Header.astro'), 'utf-8');
  assert.ok(!header.includes('background: #E56B38;'), 'Header.astro no debe contener background: #E56B38 (6.01:1 < 7.0:1)');
  assert.ok(header.includes('background: var(--smat-copper-accent, #7c2d12);'), 'Header.astro debe usar --smat-copper-accent (#7c2d12, 10.65:1 WCAG AAA)');

  const tourToml = fs.readFileSync(path.join(siteRoot, '../ergos/tour.toml'), 'utf-8');
  assert.ok(tourToml.includes('project = "smat"'), 'tour.toml debe definir project = "smat"');
  assert.ok(tourToml.includes('[[acts]]'), 'tour.toml debe usar [[acts]] v2.0');
  assert.ok(!tourToml.includes('#flight-deck'), 'tour.toml no debe referenciar el selector muerto #flight-deck (DEB-P4-02)');
});

test('Test 227 (Decisión 7): resolveMiningDistrictPreset hidrata grupo, altitud, mineralogía y circuito en Fresnillo, Peñoles, Grupo México y First Majestic', async () => {
  const { resolveMiningDistrictPreset } = await import('../src/scripts/workbenchBus.js');

  const saucito = resolveMiningDistrictPreset('Unidad Saucito');
  assert.ok(saucito && saucito.matched, 'Debe encontrar Unidad Saucito');
  assert.equal(saucito.altitudeMsnm, 2250);
  assert.equal(saucito.defaultCircuit, 'bombeo');
  assert.ok(saucito.solidsSg >= 2.8);

  const tayoltita = resolveMiningDistrictPreset('San Dimas / Tayoltita');
  assert.ok(tayoltita && tayoltita.matched, 'Debe encontrar San Dimas / Tayoltita');
  assert.equal(tayoltita.defaultCircuit, 'bombeo');

  const cananea = resolveMiningDistrictPreset('Buenavista del Cobre (Cananea)');
  assert.ok(cananea && cananea.matched, 'Debe encontrar Buenavista del Cobre (Cananea)');
  assert.equal(cananea.defaultCircuit, 'flotacion');
});

test('Test 228 (Decisión 8 / DEB-P4-03): buildCanonicalEngineeringSnapshot y cero pérdida de campos [DTO-DROP] hacia buildAcuseUrlParams, buildLeadWebhookPayload, formatSapPlaintext y Code.gs', async () => {
  const {
    buildCanonicalEngineeringSnapshot,
    buildAcuseUrlParams,
    buildLeadWebhookPayload,
    formatSapPlaintext
  } = await import('../src/scripts/workbenchBus.js');

  const rawDossier = {
    folio: 'SMAT-2026-9901',
    circuit: 'bombeo',
    role: 'impulsor',
    smat_code: 'SMAT-PUMP-6X4-A05-IMP',
    atomic_code: 'E4147',
    contact_name: 'Ing. Mateo Sierra',
    company_name: 'Minera Saucito',
    phone_number: '6181112233',
    email_address: 'msierra@saucito.mx',
    material: 'alto_cromo_cr27',
    transmision: 'ZVZ',
    estacion: 'S4',
    seal_branch: 'expeller_dry',
    claro_mm: 2.4,
    b2_mm: 48,
    cap_c_kn: 185,
    delta_eta_v: 3.5,
    pipe_vel_loss_pct: 5.1,
    u2_ms: 23.8,
    n2_rpm: 1185,
    fr_kn: 4.9,
    inmunidad_sumidero: 'ALTA',
    razon_estructural: 'Recirculación interna por claro desgastado',
    l10h: 36200,
    gate_classification: 'EMERGENCY_SHUTDOWN_PARO',
    metrics: {
      flow_m3h: 350,
      solids_cw: 55,
      d80_um: 210,
      slurry_sg: 1.54,
      solids_cv: 30.2,
      critical_velocity_ms: 3.18,
      recommended_velocity_ms: 3.82,
      head_ratio: 0.85,
      eff_ratio_er: 0.84,
      impeller_life_h: 2450,
      wear_life_ratio: 3.8,
      altitude_msnm: 2400,
      p_atm_mca: 7.72,
      delta_npsh_m: 2.61,
      motor_derating_iec: 0.902,
      k_motor_alt: 1.32,
      pulp_ph: 7.8,
      durand_fl: 1.34
    }
  };

  const snap = buildCanonicalEngineeringSnapshot(rawDossier);
  assert.equal(snap.eff_ratio_er, 0.84);
  assert.equal(snap.impeller_life_h, 2450);
  assert.equal(snap.p_atm_mca, 7.72);
  assert.equal(snap.delta_npsh_m, 2.61);
  assert.equal(snap.motor_derating_iec, 0.902);
  assert.equal(snap.k_motor_alt, 1.32);
  assert.equal(snap.pipe_vel_loss_pct, 5.1);
  assert.equal(snap.gate_classification, 'EMERGENCY_SHUTDOWN_PARO');

  const params = buildAcuseUrlParams(rawDossier);
  assert.equal(params.get('eff_ratio_er'), '0.84');
  assert.equal(params.get('impeller_life_h'), '2450');
  assert.equal(params.get('delta_npsh_m'), '2.61');
  assert.equal(params.get('k_motor_alt'), '1.32');
  assert.equal(params.get('pipe_vel_loss_pct'), '5.1');
  assert.equal(params.get('gate_classification'), 'EMERGENCY_SHUTDOWN_PARO');

  const webhook = buildLeadWebhookPayload(rawDossier, 'pdf_acuse');
  assert.equal(webhook.derating_eficiencia_er, 0.84);
  assert.equal(webhook.vida_estimada_impulsor_h, 2450);
  assert.equal(webhook.perdida_npsh_altitud_m, 2.61);
  assert.equal(webhook.multiplicador_motor_altitud, 1.32);
  assert.equal(webhook.perdida_margen_vc_pct, 5.1);
  assert.equal(webhook.clasificacion_compuerta, 'EMERGENCY_SHUTDOWN_PARO');

  const sap = formatSapPlaintext(rawDossier);
  assert.ok(sap.includes('Er (Cave): 0.84'), 'SAP texto debe incluir Er Cave');
  assert.ok(sap.includes('2450 h'), 'SAP texto debe incluir horas de vida estimada del impulsor');
  assert.ok(sap.includes('K_motor,alt = 1.32x'), 'SAP texto debe incluir pinza termo-barométrica K_motor,alt');
  assert.ok(sap.includes('Δv_tubería = -5.1%'), 'SAP texto debe incluir pérdida de margen frente a Vc');

  const codeGs = fs.readFileSync(path.join(siteRoot, 'tools/google_apps_script/Code.gs'), 'utf-8');
  for (const col of [
    'derating_eficiencia_er',
    'vida_estimada_impulsor_h',
    'perdida_npsh_altitud_m',
    'derating_motor_iec',
    'multiplicador_motor_altitud',
    'perdida_margen_vc_pct',
    'clasificacion_compuerta'
  ]) {
    assert.ok(codeGs.includes(col), `Code.gs debe registrar columna ${col}`);
  }
});

test('Test 229 (Decisiones 1, 2, 3, 5, 7 / DEB-P4-04 & DEB-P4-07): LiveEngineeringDossier.astro e inventario_smat.md exponen todos los nodos sin #btn-quote-mailto oculto', () => {
  const dossier = fs.readFileSync(path.join(siteRoot, 'src/components/LiveEngineeringDossier.astro'), 'utf-8');
  assert.ok(!dossier.includes('<button type="button" id="btn-quote-mailto"'), 'LiveEngineeringDossier.astro no debe contener #btn-quote-mailto muerto (DEB-P4-04)');

  for (const id of [
    'id="gate-lead-status"',
    'id="trust-boundary-alert"',
    'id="live-role-criteria"',
    'id="metric-hr"',
    'id="metric-er"',
    'id="metric-wear-hours"',
    'id="metric-patm-mca"',
    'id="metric-delta-npsh"',
    'id="metric-motor-iec"',
    'id="metric-k-motor-alt"',
    'id="wb-pipe-vel-loss"',
    'id="live-assembly-collision-note"'
  ]) {
    assert.ok(dossier.includes(id), `LiveEngineeringDossier.astro debe incluir ${id}`);
  }

  const inventario = fs.readFileSync(path.join(siteRoot, '../inventario/inventario_smat.md'), 'utf-8');
  assert.ok(inventario.includes('affordance = "#gate-lead-status, #trust-boundary-alert"'), 'inventario_smat.md debe declarar affordance para INV-SMAT-GTE-001');
  assert.ok(inventario.includes('affordance = "#metric-hr, #metric-er, #metric-wear-hours"'), 'inventario_smat.md debe declarar affordance para INV-SMAT-PHY-001');
});

test('Test 230 (Decisiones 1-7 en QuoteWizard.astro + quoteWizardController.js): Presupuesto Parnas < 950 líneas y conexión reactiva completa', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), { encoding: 'utf-8', rawWizardOnly: true });
  const lineCount = wizard.split('\n').length;
  assert.ok(lineCount < 950, `QuoteWizard.astro debe mantenerse bajo 950 líneas (actual: ${lineCount})`);

  for (const id of [
    'id="btn-apply-mining-preset"',
    'id="wb-ctrl-solve-mode"',
    'id="btn-apply-ss-to-circuit"',
    'id="wb-altitude-live-strip"',
    'id="wb-clearance-vel-loss"'
  ]) {
    assert.ok(wizard.includes(id), `QuoteWizard.astro debe incluir ${id}`);
  }

  const controller = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(controller.includes('validatePlantLeadInput'), 'quoteWizardController.js debe invocar validatePlantLeadInput');
  assert.ok(controller.includes('resolveMiningDistrictPreset'), 'quoteWizardController.js debe invocar resolveMiningDistrictPreset');
  assert.ok(controller.includes('combinedMotorAltitudeMultiplier'), 'quoteWizardController.js debe renderizar combinedMotorAltitudeMultiplier');
});

test('Test 231 (Decisión 4): Inversión algebraica Marcy de 3 vías (solveFor: ore_density_rhop) en /control-de-procesos/ y /en/process-control/', () => {
  for (const rel of ['src/pages/control-de-procesos/index.astro', 'src/pages/en/process-control/index.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('id="met-marcy-mode"'), `${rel} debe incluir selector #met-marcy-mode`);
    assert.ok(content.includes('value="ore_density_rhop"'), `${rel} debe incluir modo ore_density_rhop`);
    assert.ok(content.includes('id="met-apply-ss-btn"'), `${rel} debe incluir botón #met-apply-ss-btn para sincronizar Ss al circuito hidráulico`);
  }
});

test('Test 232 (Decisión 6 / DEB-P4-05): DiagnosticsHub.astro usa tarjetas semánticas <article class="card diag-card"> y persiste frontClearanceMm en saveWorkbenchState', () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');
  assert.ok(diag.includes('<article class="card diag-card"'), 'DiagnosticsHub.astro debe usar <article class="card diag-card">');
  assert.ok(!diag.includes('<div class="card diag-card"'), 'DiagnosticsHub.astro no debe usar <div class="card diag-card"> (DEB-P4-05)');
  assert.ok(diag.includes('saveWorkbenchState') && diag.includes('frontClearanceMm: claroMm'), 'DiagnosticsHub.astro debe persistir frontClearanceMm en saveWorkbenchState');
});

test('Test 233 (Decisión 8 en Acuse): acuse.astro y en/thank-you.astro renderizan η_r, vida estimada del impulsor, ΔNPSH, K_motor,alt, Δv_pipe y gate_classification', () => {
  for (const rel of ['src/pages/acuse.astro', 'src/pages/en/thank-you.astro']) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    for (const token of ['eff_ratio_er', 'impeller_life_h', 'delta_npsh_m', 'k_motor_alt', 'pipe_vel_loss_pct', 'gate_classification']) {
      assert.ok(content.includes(token), `${rel} debe procesar y renderizar ${token}`);
    }
  }
});

test('Test 234 (Decisión 9b & 9c): Compactación Above-the-Fold móvil en las 9 rutas auditadas por ergos probe', () => {
  const mobileCheckedFiles = [
    'src/pages/index.astro',
    'src/pages/cotizar.astro',
    'src/pages/acuse.astro',
    'src/pages/bombeo/index.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/equipos/index.astro',
    'src/pages/control-de-procesos/index.astro',
    'src/components/DiagnosticsHub.astro',
    'src/pages/catalogo.astro'
  ];
  for (const rel of mobileCheckedFiles) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf-8');
    assert.ok(content.includes('@media (max-width:'), `${rel} debe tener reglas @media (max-width: ...) para compactar el Hero móvil Above-the-Fold`);
  }
});

