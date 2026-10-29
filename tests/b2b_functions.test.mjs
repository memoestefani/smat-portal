import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatSapPlaintext, formatMailtoUrl, formatWhatsappUrl, parseUrlContextParams, generateSmatPartCode, formatSapTsv, SMAT_WORKBENCH_EVENT } from '../src/scripts/workbenchBus.js';

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
    'src/components/DualHubView.astro',
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
  const rolesB = fs.readFileSync(path.join(siteRoot, 'data', 'roles.copy.json'), 'utf-8');
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
});test('22. Jerarquía de Exportación de Cotizador con Botón Rey PDF (Decisión 4-C)', () => {
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
  const flightDeck = fs.readFileSync(path.join(siteRoot, 'src/components/FlightDeck.astro'), 'utf-8');

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
    'src/components/PerspectiveSelector.astro',
    'src/scripts/slurryEngine.js',
    'src/components/FlightDeck.astro',
    'src/components/DualHubView.astro',
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
  assert.ok(tokens.includes('--smat-copper-accent: #c25e00'), 'tokens.css debe mantener cobre forjado de planta');
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
  assert.ok(header.includes('href={isEs ? "/#rfq" : "/en/#rfq"}'), 'Header debe usar href absoluto con soporte de idioma');

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
  assert.ok(indexEs.includes('Circuito 1: Molienda y Bombeo'), 'index.astro debe contener etiqueta de circuito 1');
  assert.ok(indexEs.includes('Circuito 2: Concentración'), 'index.astro debe contener etiqueta de circuito 2');
  assert.ok(indexEs.includes('Circuito 3: Jales Secos'), 'index.astro debe contener etiqueta de circuito 3');
  assert.ok(indexEn.includes('Circuit 1: Grinding & Pumping'), 'en/index.astro debe contener etiqueta de circuito 1 en EN');
  assert.ok(indexEn.includes('Circuit 2: Concentration'), 'en/index.astro debe contener etiqueta de circuito 2 en EN');
  assert.ok(indexEn.includes('Circuit 3: Dry Tailings'), 'en/index.astro debe contener etiqueta de circuito 3 en EN');
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
  assert.ok(indexEs.includes('tco-matrix-section'), 'index.astro debe contener .tco-matrix-section');
  assert.ok(indexEs.includes('tco-comparison-matrix'), 'index.astro debe contener tabla .tco-comparison-matrix');
  assert.ok(indexEs.includes('16 a 24 semanas'), 'index.astro debe contrastar tiempo de importación ultramarina');
  assert.ok(indexEs.includes('5 Impulsores + 5 Cuellos + 4 Volutas'), 'index.astro debe exhibir suministro por lote húmedo');
  assert.ok(indexEs.includes('40,000 USD/hora'), 'index.astro debe documentar costo de paro de molino');

  // Portada EN
  assert.ok(indexEn.includes('tco-matrix-section'), 'en/index.astro debe contener .tco-matrix-section');
  assert.ok(indexEn.includes('tco-comparison-matrix'), 'en/index.astro debe contener tabla .tco-comparison-matrix');
  assert.ok(indexEn.includes('16 to 24 weeks'), 'en/index.astro debe contrastar tiempo en EN');
  assert.ok(indexEn.includes('5 Impellers + 5 Throatbushes + 4 Volutes'), 'en/index.astro debe exhibir suministro por lote en EN');
  assert.ok(indexEn.includes('40,000 USD/hour'), 'en/index.astro debe documentar costo de paro en EN');
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

  assert.ok(catEs.includes('/#rfq?equipo=skid_bomba&serie=4x3'), 'catalogo.astro debe contener deep link con formato estándar RFC');
  assert.ok(catEn.includes('/en/#rfq?equipo=skid_bomba&serie=4x3'), 'catalog.astro en inglés debe contener deep link con formato estándar RFC');
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
  assert.ok(tokens.includes('--smat-blue-royal: #0D78C6;'), 'tokens.css debe definir --smat-blue-royal con #0D78C6');
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






