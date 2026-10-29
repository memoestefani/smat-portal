/**
 * SMAT Minerals - Sovereign Event Bus & B2B Requisition Formatter (Decisiones 5-C y 6-C)
 * Comunicación reactiva desacoplada entre islas de Astro (CustomEvent) y formateadores
 * oficiales de exportación para SAP / ERP, Mailto RFC 6068 y WhatsApp de Almacén Durango.
 */

export const SMAT_WORKBENCH_EVENT = 'smat:workbench_update';

/**
 * Mapa canónico de las 6 refacciones atómicas universales (data/atomic_parts.json)
 * para resolución determinista de deep-links (?codigo=D3147..E4083) y decodificación.
 */
export const ATOMIC_PARTS_CATALOG = {
  D3147: {
    code: 'd3147',
    part_number: 'D3147',
    frame: '4/3 C',
    circuit: 'bombeo',
    role: 'solo_impulsor',
    pipe_size: '3x2',
    smat_code: 'SMAT-PUMP-3X2-IMP',
    name_es: 'Impulsor Cerrado A05 para Bomba 4/3 C',
    name_en: 'Closed High Chrome A05 Impeller for 4/3 C Pump',
    metallurgy: 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  },
  E4147: {
    code: 'e4147',
    part_number: 'E4147',
    frame: '6/4 D',
    circuit: 'bombeo',
    role: 'solo_impulsor',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-IMP',
    name_es: 'Impulsor Cerrado A05 para Bomba 6/4 D',
    name_en: 'Closed High Chrome A05 Impeller for 6/4 D Pump',
    metallurgy: 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  },
  F6147: {
    code: 'f6147',
    part_number: 'F6147',
    frame: '8/6 E',
    circuit: 'bombeo',
    role: 'solo_impulsor',
    pipe_size: '8x6',
    smat_code: 'SMAT-PUMP-8X6-IMP',
    name_es: 'Impulsor Cerrado A05 para Bomba 8/6 E',
    name_en: 'Closed High Chrome A05 Impeller for 8/6 E Pump',
    metallurgy: 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  },
  DAM028: {
    code: 'dam028',
    part_number: 'DAM028',
    frame: '4/3 C',
    circuit: 'bombeo',
    role: 'kit_sellado',
    pipe_size: '3x2',
    smat_code: 'SMAT-SEAL-3X2-EXP',
    name_es: 'Anillo Expulsor de Sello Dinámico para Marco 4/3 C',
    name_en: 'Dynamic Expeller Ring for 4/3 C Frame',
    metallurgy: 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  },
  EAM028: {
    code: 'eam028',
    part_number: 'EAM028',
    frame: '6/4 D',
    circuit: 'bombeo',
    role: 'kit_sellado',
    pipe_size: '6x4',
    smat_code: 'SMAT-SEAL-6X4-EXP',
    name_es: 'Anillo Expulsor de Sello Dinámico para Marco 6/4 D',
    name_en: 'Dynamic Expeller Ring for 6/4 D Frame',
    metallurgy: 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  },
  E4083: {
    code: 'e4083',
    part_number: 'E4083',
    frame: '6/4 D',
    circuit: 'bombeo',
    role: 'solo_voluta',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-VOL',
    name_es: 'Cuello de Succión (Throatbush) A05 para Bomba 6/4 D',
    name_en: 'High Chrome A05 Throatbush for 6/4 D Pump',
    metallurgy: 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  }
};

/**
 * Resuelve un código atómico universal (D3147..E4083) de forma insensible a mayúsculas
 * @param {string} rawCode
 * @returns {Object|null}
 */
export function resolveAtomicPartCode(rawCode = '') {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const key = rawCode.trim().toUpperCase();
  return ATOMIC_PARTS_CATALOG[key] || null;
}

/**
 * Emite una actualización global de la estación de trabajo (Flight Deck)
 * @param {Object} detail - Parámetros de pulpa, rol seleccionado, datos de contacto o preset
 */
export function publishWorkbenchUpdate(detail) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(SMAT_WORKBENCH_EVENT, {
      detail,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }
}

/**
 * Se suscribe a las actualizaciones globales de la estación de trabajo
 * @param {Function} callback - Función que recibe detail
 * @returns {Function} Desuscriptor
 */
export function subscribeWorkbenchUpdate(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (event) => callback(event.detail);
  window.addEventListener(SMAT_WORKBENCH_EVENT, handler);
  return () => window.removeEventListener(SMAT_WORKBENCH_EVENT, handler);
}

/**
 * Parsea los parámetros de contexto desde la URL (#rfq?equipo=... o ?equipo=...)
 * @param {string} urlOrSearch 
 * @returns {Object} { equipo, rol, mina, urgencia, modo, origen }
 */
export function parseUrlContextParams(urlOrSearch = '') {
  if (!urlOrSearch && typeof window !== 'undefined') {
    urlOrSearch = window.location.hash || window.location.search || '';
  }
  
  const result = {
    equipo: null,
    rol: null,
    mina: null,
    urgencia: null,
    modo: null,
    origen: null,
    serie: null,
    sintoma: null,
    falla: null,
    codigo: null,
    circuito: null,
    flow: null,
    solids: null,
    d80: null,
    atomic_part: null
  };
  
  if (!urlOrSearch) return result;
  
  // Soporta formato #rfq?equipo=... o ?equipo=... o https://domain/?equipo=...#rfq
  let raw = urlOrSearch;
  const queryIndex = raw.indexOf('?');
  if (queryIndex !== -1) {
    raw = raw.substring(queryIndex + 1);
  } else {
    raw = raw.replace(/^[#?]/, '');
  }
  
  // Limpiar ancla hash si viene al final del query string (?equipo=xyz#rfq)
  const hashIndex = raw.indexOf('#');
  if (hashIndex !== -1) {
    raw = raw.substring(0, hashIndex);
  }
  
  try {
    const params = new URLSearchParams(raw);
    if (params.has('equipo')) result.equipo = params.get('equipo');
    else if (params.has('role_id')) result.equipo = params.get('role_id');

    if (params.has('rol')) result.rol = params.get('rol');
    else if (params.has('perspectiva')) result.rol = params.get('perspectiva');

    if (params.has('mina')) result.mina = params.get('mina');
    else if (params.has('empresa')) result.mina = params.get('empresa');

    if (params.has('urgencia')) result.urgencia = params.get('urgencia');
    if (params.has('modo')) result.modo = params.get('modo');
    if (params.has('origen')) result.origen = params.get('origen');
    if (params.has('serie')) result.serie = params.get('serie');
    if (params.has('sintoma')) result.sintoma = params.get('sintoma');
    if (params.has('falla')) result.falla = params.get('falla');

    if (params.has('circuito')) result.circuito = params.get('circuito');
    else if (params.has('circuit')) result.circuito = params.get('circuit');

    if (params.has('flow')) result.flow = params.get('flow');
    if (params.has('solids')) result.solids = params.get('solids');
    if (params.has('d80')) result.d80 = params.get('d80');

    const rawCode = params.get('codigo') || params.get('code');
    if (rawCode) {
      result.codigo = rawCode.trim().toUpperCase();
      const atomic = resolveAtomicPartCode(result.codigo);
      if (atomic) {
        result.atomic_part = atomic;
        if (!result.circuito) result.circuito = atomic.circuit;
        if (!result.equipo) result.equipo = atomic.role;
        if (!result.serie) result.serie = atomic.pipe_size;
      }
    }
  } catch (_err) {
    // Resiliente ante cadenas malformadas
  }
  
  return result;
}

/**
 * Genera el texto estructurado en formato formal para pegar en SAP / ERP / Orden de Compra
 * @param {Object} data 
 * @returns {string}
 */
export function formatSapPlaintext(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const date = data.date || new Date().toISOString().split('T')[0];
  const requester = data.contact_name || data.name || 'Ingeniería / Residente';
  const company = data.company_name || data.company || 'Unidad Minera / Empresa';
  const phoneVal = data.phone_number || data.phone || '';
  const emailVal = data.email_address || data.email || '';
  const contact = phoneVal ? `${phoneVal} • ${emailVal}` : (emailVal || 'N/A');
  
  const logisticsLabels = {
    retiro: 'Retiro en Almacén Central Durango (Coordinación con Folio)',
    fletera: 'Fletera Consolidada Nacional (Ocurre en Destino)',
    dedicado: 'Flete Dedicado Directo / Enlace Multimodal a Mina'
  };
  const logisticsMode = data.logistics_mode || data.logistics || 'retiro';
  const logisticsText = logisticsLabels[logisticsMode] || logisticsMode;

  const channelLabels = {
    llamada: 'Llamada telefónica directa',
    whatsapp: 'WhatsApp de Planta (L-V 08:00-18:00)',
    correo: 'Correo formal con cotización PDF'
  };
  const channelMode = data.channel_preference || data.canal_preferido || data.channel_pref || 'whatsapp';
  const channelText = channelLabels[channelMode] || channelMode;

  const missionLabels = {
    equipos: 'Equipos Completos / Circuito de Planta',
    refacciones: 'Refaccionamiento Crítico de Desgaste'
  };
  const missionMode = data.mission || data.mision || data.mission_type || (data.package_items && data.package_items.length > 0 ? 'equipos' : 'refacciones');
  const missionText = missionLabels[missionMode] || missionMode;

  const destination = data.destination || data.delivery_destination || data.destino || 'Retiro en Almacén Central Durango';
  const partName = data.part_name || data.role || 'Impulsor de 5 álabes High Chrome 27% (A05) >650 HB';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const atomicCode = data.atomic_code || '';
  const clientRef = data.client_reference || '';
  const pulpProfile = data.pulp_profile || '';
  const dimDia = data.dim_outer_dia || '';
  const dimBore = data.dim_shaft_bore || '';
  const partQty = data.quantity || 1;
  const metrics = data.metrics || {};
  const tco = data.tco || {};
  const isCustom = data.is_custom || false;
  const customNotes = data.custom_notes || '';
  const packageItems = data.package_items || [];

  let lines = [
    `=================================================================`,
    `REQUISICIÓN TÉCNICA FORMAL - SMAT MINERALS (DURANGO, MÉXICO)`,
    `FOLIO INSTITUCIONAL: ${folio}  |  FECHA: ${date}`,
    `=================================================================`,
    ``,
    `1. DATOS DE CONTROL Y DESTINO FOB:`,
    `   - Solicitante:   ${requester}`,
    `   - Mina/Empresa:  ${company}`,
    `   - Contacto:      ${contact}`,
    `   - Canal Preferido: ${channelText}`,
    `   - Modalidad Logística: ${logisticsText}`,
    `   - Punto Entrega: ${destination}`,
  ];

  if (pulpProfile) {
    lines.push(`   - Perfil Mineral Unidad: ${pulpProfile}`);
  }

  lines.push(
    ``,
    `2. ESPECIFICACIÓN TÉCNICA DE PARTIDA (SAP / ERP):`,
    `   - Tipo de Solicitud: ${missionText}`,
    `   - Partida / Equipo:  ${partName}`,
    `   - Código SMAT:       ${smatCode}${atomicCode ? ` (Refacción Específica: ${atomicCode})` : ''}`,
    `   - Cantidad:          ${partQty} pza(s)`,
    `   - Domicilio Fiscal:  Mariano Salas #114, Col. Hipódromo, Durango, Dgo. CP 34166`,
    `   - Almacén/Despacho:  Durango, Dgo. (Retiro en patio coordinado con folio)`
  );

  if (clientRef) {
    lines.push(`   - Referencia Interna Cliente: ${clientRef}`);
  }
  if (dimDia || dimBore) {
    lines.push(`   - Medidas Campo (Flexómetro): DE ~${dimDia || 'N/A'} mm | Barreno/Flecha ~${dimBore || 'N/A'} mm`);
  }
  if (data.details) {
    lines.push(`   - Notas de Operación:         ${data.details}`);
  }

  if (packageItems.length > 0) {
    lines.push(`   - Partidas Requeridas en Circuito:`);
    const itemNames = {
      bomba_skid: 'Bomba centrífuga para lodos en Skid con motor acoplado',
      celdas_flotacion: 'Batería de celdas de flotación mecánicas',
      filtro_prensa: 'Filtro prensa para deshidratación y jales secos',
      refacciones_inicio: 'Paquete de refacciones de desgaste (impulsores, telas, sellos)'
    };
    for (const it of packageItems) {
      lines.push(`     • ${itemNames[it] || it}`);
    }
  }

  if (isCustom) {
    lines.push(`   - Estatus:       [EQUIPO ESPECIAL FUERA DE CATÁLOGO]`);
    if (customNotes) {
      lines.push(`   - Requerimiento: ${customNotes}`);
    }
  }

  if (metrics.solids_cw !== undefined || metrics.critical_velocity_ms !== undefined || metrics.flow_m3h !== undefined) {
    lines.push(``);
    lines.push(`3. MEMORIA DE CÁLCULO HIDRÁULICO (FÓRMULA DURAND-CONDOLIOS):`);
    if (metrics.flow_m3h !== undefined) lines.push(`   - Flujo de Operación:        ${metrics.flow_m3h} m³/h`);
    if (metrics.solids_cw !== undefined) lines.push(`   - Concentración de Sólidos:  ${metrics.solids_cw}% Cw (S_s: ${metrics.solid_sg || 2.7}${metrics.d80_um ? `, d80: ${metrics.d80_um} µm` : ''})`);
    if (metrics.slurry_sg !== undefined) lines.push(`   - Densidad de Pulpa (S_m):   ${metrics.slurry_sg} kg/L${metrics.solids_cv !== undefined ? ` (${metrics.solids_cv}% Cv)` : ''}`);
    if (metrics.head_ratio !== undefined) lines.push(`   - Factor Derating (HR):      ${metrics.head_ratio}`);
    if (metrics.critical_velocity_ms !== undefined) lines.push(`   - Velocidad Límite Durand:   ${metrics.critical_velocity_ms} m/s (Evita arenamiento)`);
    if (metrics.altitude_msnm !== undefined) lines.push(`   - Altitud Operativa:         ${metrics.altitude_msnm} msnm`);
    if (metrics.recommended_alloy) lines.push(`   - Metalurgia Sugerida:       ${metrics.recommended_alloy}`);
    const tcoTons = tco.tco_tons_at_risk !== undefined ? tco.tco_tons_at_risk : metrics.tco_tons_at_risk;
    const tcoHrs = tco.tco_downtime_hrs !== undefined ? tco.tco_downtime_hrs : metrics.tco_downtime_hrs;
    const tcoSummary = tco.tco_summary || metrics.tco_summary || '';
    if (tcoTons !== undefined || tcoSummary) {
      lines.push(`   - Continuidad / TCO:         ~${tcoTons || 0} ton en riesgo (${tcoHrs || 4}h paro) | ${tcoSummary}`);
    }
  }

  lines.push(``);
  lines.push(`4. PROTOCOLO DE INSPECCIÓN Y CONDICIONES DE SUMINISTRO:`);
  lines.push(`   - Balanceo dinámico y verificación de concentricidad en banco de pruebas de almacén central.`);
  lines.push(`   - Verificación metrológica de acople dimensional 1:1 y Dureza Metalúrgica Certificada.`);
  lines.push(`   - Validación preliminar de compatibilidad según datos de laboratorio vinculada a la cotización formal.`);
  lines.push(`   - Ensambles completos configurados sobre pedido; refacciones con rotación continua.`);
  lines.push(`   - Despacho nacional desde Almacén Central Durango: (618) 810-4408 | ventas@smatminerals.com`);
  lines.push(`=================================================================`);

  return lines.join('\n');
}

/**
 * Genera URL RFC 6068 para apertura directa en cliente de correo corporativo
 * @param {Object} data 
 * @returns {string}
 */
export function formatMailtoUrl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const company = data.company_name || 'Unidad Minera';
  const partName = data.part_name || 'Refaccionamiento Minero';
  const targetEmail = data.email_address || 'contacto@smatminerals.com';
  
  const subject = `[Requisición ${folio}] ${company} - ${partName}`;
  const body = formatSapPlaintext(data);
  
  return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Genera URL para WhatsApp directo a atención técnica de planta en Durango (Decisiones 8-B y 9-B)
 * @param {Object} data 
 * @returns {string}
 */
export function formatWhatsappUrl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const requester = data.contact_name || data.name || 'Ingeniero Solicitante';
  const company = data.company_name || data.company || 'Empresa';
  const partName = data.part_name || data.role || 'Refacción de Bomba';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const circuit = (data.circuit || 'BOMBEO').toUpperCase();
  
  const text = `Hola SMAT Durango, requiero cotización y confirmación de stock para:\n*Folio:* ${folio}\n*Circuito:* ${circuit}\n*Mina:* ${company} (${requester})\n*Equipo/Partida:* ${partName}\n*Código SMAT:* ${smatCode}\n\n*Instrucción de Almacén Durango:* Favor de adjuntar fotografía de la pieza con un flexómetro de referencia para cotejo 1:1.\n\nFavor de confirmar tiempo de despacho en Almacén Central Durango.`;
  
  const phone = '526183670664';
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Genera el Código de Configuración Institucional SMAT Limpio (Decisiones 1-B y 3-B)
 * Cero letras de bastidor (B/C/D/E/F) y cero sufijos de aleación en la salida del cliente.
 * @param {Object} data 
 * @returns {string} e.g. SMAT-PUMP-6X4-WETKIT o SMAT-FLOT-100FT-MECH
 */
export function generateSmatPartCode(data = {}) {
  const circuit = (data.circuit || data.process_circuit || '').toLowerCase();
  const role = data.role_id || data.role || 'kit_wet_end';
  const roleLower = String(role).toLowerCase();
  const details = String(data.details || data.spec_details || '').toUpperCase();
  const pipe = String(data.pipe_size || data.pipe || '').toLowerCase();
  const sizeVal = String(data.size_val || data.flot_capacity || data.filt_capacity || '').toLowerCase();

  const isFlot = circuit === 'flotacion' || roleLower.includes('celda') || roleLower.includes('flotacion') || roleLower.includes('rotor') || roleLower.includes('estator') || roleLower.includes('mecanismo') || details.includes('FLOT') || details.includes('CELDA');
  const isFilt = circuit === 'filtracion' || roleLower.includes('filtro') || roleLower.includes('prensa') || roleLower.includes('placa') || roleLower.includes('tela') || details.includes('FILT') || details.includes('PRENSA');

  if (isFlot) {
    let cap = '100FT';
    if (sizeVal.includes('50') || details.includes('50')) cap = '50FT';
    else if (sizeVal.includes('200') || details.includes('200')) cap = '200FT';
    else if (sizeVal.includes('300') || details.includes('300')) cap = '300FT';
    else if (sizeVal.includes('100') || details.includes('100')) cap = '100FT';

    if (roleLower === 'celda_flotacion' || roleLower.includes('celda')) return `SMAT-FLOT-${cap}-CELL`;
    if (roleLower === 'bateria_celdas' || roleLower.includes('bateria')) return `SMAT-FLOT-${cap}-BANK`;
    if (roleLower === 'manto_difusor' || roleLower.includes('difusor')) return `SMAT-FLOT-${cap}-SHROUD`;
    return `SMAT-FLOT-${cap}-MECH`;
  }

  if (isFilt) {
    let pCap = '1500';
    if (sizeVal.includes('800') || details.includes('800')) pCap = '800';
    else if (sizeVal.includes('1200') || details.includes('1200')) pCap = '1200';
    else if (sizeVal.includes('2000') || details.includes('2000')) pCap = '2000';
    else if (sizeVal.includes('1500') || details.includes('1500')) pCap = '1500';

    if (roleLower === 'filtro_prensa' || roleLower.includes('prensa')) return `SMAT-FILT-${pCap}-PRESS`;
    if (roleLower === 'placas_membrana' || roleLower.includes('membrana')) return `SMAT-FILT-${pCap}-MEMBR`;
    if (roleLower === 'bomba_prensa') return `SMAT-FILT-${pCap}-PUMP`;
    return `SMAT-FILT-${pCap}-CLOTH`;
  }

  // Bombeo: series puramente nominales (sin letras de bastidor B/C/D/E/F)
  let pipeTag = '6X4';
  if (pipe === '1.5x1' || details.includes('1.5X1') || details.includes('2X1.5')) pipeTag = '1.5X1';
  else if (pipe === '3x2' || details.includes('3X2') || details.includes('4X3')) pipeTag = '3X2';
  else if (pipe === '6x4' || details.includes('6X4')) pipeTag = '6X4';
  else if (pipe === '8x6' || details.includes('8X6')) pipeTag = '8X6';
  else if (pipe === '10x8' || details.includes('10X8')) pipeTag = '10X8';

  if (roleLower.includes('kit_sellado') || roleLower === 'sello') return `SMAT-SEAL-${pipeTag}-EXP`;
  if (roleLower.includes('kit_rodamientos') || roleLower === 'soporte') return `SMAT-BEAR-${pipeTag}-ASSY`;
  if (roleLower.includes('skid') || roleLower.includes('bomba_skid')) return `SMAT-SKID-${pipeTag}-STD`;
  if (roleLower.includes('solo_impulsor') || roleLower.includes('impulsor')) return `SMAT-PUMP-${pipeTag}-IMP`;
  if (roleLower.includes('solo_voluta') || roleLower.includes('voluta')) return `SMAT-PUMP-${pipeTag}-VOL`;
  if (roleLower.includes('revestimiento') || roleLower.includes('liner')) return `SMAT-PUMP-${pipeTag}-LINER`;
  return `SMAT-PUMP-${pipeTag}-WETKIT`;
}

/**
 * Genera salida en formato TSV (Tab-Separated Values) estructurada para pegar en SAP / Excel (Decisión 10-A)
 * @param {Object} data 
 * @returns {string}
 */
export function formatSapTsv(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const date = data.date || new Date().toISOString().split('T')[0];
  const partName = (data.part_name || data.role || 'Impulsor de Proceso').replace(/[\t\n\r]/g, ' ');
  const smatCode = (data.smat_code || generateSmatPartCode(data)).replace(/[\t\n\r]/g, ' ');
  const qty = data.quantity || 1;
  const alloy = (data.metrics?.recommended_alloy || 'Dureza Metalúrgica Certificada').replace(/[\t\n\r]/g, ' ');
  const dest = (data.destination || 'Retiro en Almacén Central Durango').replace(/[\t\n\r]/g, ' ');
  const requester = (data.contact_name || data.name || 'Ingeniería').replace(/[\t\n\r]/g, ' ');
  const company = (data.company_name || data.company || 'Unidad Minera').replace(/[\t\n\r]/g, ' ');
  const phone = (data.phone_number || data.phone || '(618) 810-4408').replace(/[\t\n\r]/g, ' ');
  const clientRef = (data.client_reference || data.placa_ref || 'CONFIDENCIAL-1:1').replace(/[\t\n\r]/g, ' ');

  const headers = ['FOLIO_SMAT', 'FECHA', 'PARTIDA_DESCRIPCION', 'CODIGO_CONFIGURACION_SMAT', 'CANTIDAD', 'MATERIAL_ESPECIFICADO', 'REF_CLIENTE_CONFIDENCIAL', 'DESTINO_LOGISTICO', 'SOLICITANTE', 'EMPRESA', 'CONTACTO'];
  const row = [folio, date, partName, smatCode, qty, alloy, clientRef, dest, requester, company, phone];

  return `${headers.join('\t')}\n${row.join('\t')}`;
}

/**
 * Decodifica un código de configuración SMAT a objeto estructurado (Decisión 6-A)
 * Soporta tanto los nuevos códigos institucionales limpios (SMAT-PUMP-6X4-WETKIT)
 * como códigos históricos (SMAT-PUMP-6X4D-A05-IMP).
 * @param {string} code - e.g. SMAT-PUMP-6X4-WETKIT o SMAT-FLOT-100FT-MECH
 * @returns {Object|null}
 */
export function parseSmatPartCode(code = '') {
  if (!code || typeof code !== 'string') return null;
  const clean = code.trim().toUpperCase();

  // Soporte directo para las 6 refacciones atómicas universales (D3147..E4083)
  const atomicMatch = resolveAtomicPartCode(clean);
  if (atomicMatch) {
    return {
      valid: true,
      raw: clean,
      atomic_code: atomicMatch.part_number,
      circuit: atomicMatch.circuit,
      line: atomicMatch.role === 'kit_sellado' ? 'SEAL' : 'PUMP',
      series: atomicMatch.pipe_size.toUpperCase(),
      pipe_size: atomicMatch.pipe_size,
      frame: atomicMatch.frame,
      alloyOrType: 'A05',
      role: atomicMatch.role,
      role_id: atomicMatch.role,
      isOpex: true,
      mission: 'refacciones',
      alloy: atomicMatch.metallurgy,
      name_es: atomicMatch.name_es,
      name_en: atomicMatch.name_en
    };
  }

  if (!clean.startsWith('SMAT-')) return null;

  const parts = clean.split('-');
  if (parts.length < 3) return null;

  const line = parts[1]; // PUMP, FLOT, FILT, SEAL, BEAR, SKID, PART
  const series = parts[2]; // 6X4, 6X4D, 3X2, 4X3C, 8X6, 10X8, 100FT, 50FT, 1500, PRESS
  const token3 = parts[3] || '';

  let circuit = 'bombeo';
  let role_id = 'impulsor';
  let isOpex = true;
  let mission = 'refacciones';
  let alloy = clean.includes('RUB') ? 'Caucho Natural Vulcanizado' : (token3 === 'A05' ? 'A05' : 'Dureza Metalúrgica Certificada');

  if (line === 'SKID') {
    role_id = 'skid_bomba';
    isOpex = false;
    mission = 'equipos';
  } else if (line === 'PUMP') {
    if (clean.includes('WETKIT')) role_id = 'kit_wet_end';
    else if (clean.includes('VOL')) role_id = 'solo_voluta';
    else if (clean.includes('LINER')) role_id = 'revestimientos';
    else role_id = 'impulsor';
  } else if (line === 'SEAL') {
    role_id = 'sello';
  } else if (line === 'BEAR') {
    role_id = 'soporte';
  } else if (line === 'FLOT') {
    circuit = 'flotacion';
    if (clean.includes('CELL')) {
      role_id = 'celda_flotacion';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('BANK')) {
      role_id = 'bateria_celdas';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('SHROUD')) {
      role_id = 'manto_difusor';
    } else {
      role_id = 'rotor_estator';
    }
  } else if (line === 'FILT') {
    circuit = 'filtracion';
    if (clean.includes('PRESS') || clean.includes('16BAR')) {
      role_id = 'filtro_prensa';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('MEMBR')) {
      role_id = 'placas_membrana';
    } else if (clean.includes('PUMP')) {
      role_id = 'bomba_prensa';
    } else {
      role_id = 'placas_telas';
    }
  }

  // Extraer marco dimensional (C, D, E, F) si aplica en códigos legacy
  let frame = '';
  const frameMatch = series.match(/\d+X\d+([A-Z])/);
  if (frameMatch) frame = frameMatch[1];

  return {
    valid: true,
    raw: clean,
    circuit,
    line,
    series,
    frame,
    alloyOrType: token3,
    role: role_id,
    role_id,
    isOpex,
    mission,
    alloy
  };
}

/**
 * Construye los parámetros URL completos y sin pérdida para /acuse/ y /en/thank-you/
 * @param {Object} d
 * @returns {URLSearchParams}
 */
export function buildAcuseUrlParams(d = {}) {
  const m = d.metrics || {};
  const tco = d.tco || {};
  const measures = (d.dim_outer_dia || d.dim_shaft_bore)
    ? `DE ~${d.dim_outer_dia || 'N/A'} mm | Barreno/Flecha ~${d.dim_shaft_bore || 'N/A'} mm`
    : '';
  const hydraulicsStr = (m.flow_m3h !== undefined || m.slurry_sg !== undefined)
    ? `Q: ${m.flow_m3h || 180} m³/h | Cw: ${m.solids_cw || 45}% (d80: ${m.d80_um || 180} µm) | Sm: ${m.slurry_sg || '1.40'} kg/L (${m.solids_cv || '23.3'}% Cv) | Vc: ${m.critical_velocity_ms || '2.35'} m/s | HR: ${m.head_ratio || '0.88'} | ${m.recommended_alloy || 'High Chrome A05 (>650 HB)'}`
    : '';
  const tcoTons = tco.tco_tons_at_risk !== undefined ? tco.tco_tons_at_risk : m.tco_tons_at_risk;
  const tcoHrs = tco.tco_downtime_hrs !== undefined ? tco.tco_downtime_hrs : m.tco_downtime_hrs;
  const tcoSummary = tco.tco_summary || m.tco_summary || '';
  const tcoStr = (tcoTons !== undefined || tcoSummary)
    ? `~${tcoTons || 0} ton en riesgo (${tcoHrs || 4}h) | ${tcoSummary}`
    : '';

  const paramsObj = {
    folio: d.folio || 'SMAT-2026-RFQ',
    nombre: d.name || d.contact_name || '',
    empresa: d.company || d.company_name || '',
    telefono: d.phone || d.phone_number || '',
    correo: d.email || d.email_address || '',
    equipo: d.part_name || d.role || '',
    codigo: d.smat_code || generateSmatPartCode(d),
    detalles: d.details || '',
    destino: d.destination || '',
    urgencia: d.isOpex === false ? 'proyecto' : 'paro'
  };

  if (d.atomic_code) paramsObj.pieza = d.atomic_code;
  if (d.client_reference) paramsObj.ref_cliente = d.client_reference;
  if (measures) paramsObj.medidas = measures;
  if (d.pulp_profile) paramsObj.perfil_pulpa = d.pulp_profile;
  if (hydraulicsStr) paramsObj.hidraulica = hydraulicsStr;
  if (tcoStr) paramsObj.tco = tcoStr;

  return new URLSearchParams(paramsObj);
}

/**
 * Despacha el lead de forma asíncrona hacia el Google Apps Script Webhook (tools/google_apps_script/Code.gs)
 * y persiste una copia completa en sessionStorage para la hoja de Acuse PDF.
 * @param {Object} d - Datos completos recolectados en el Workbench
 * @param {string} channelOrigin - Canal de salida (pdf_acuse, whatsapp, email, sap_copy)
 * @param {string} webhookUrl - Endpoint opcional de Google Apps Script
 * @returns {Object} Payload estructurado enviado
 */
export function dispatchLeadWebhook(d = {}, channelOrigin = 'web_quote_wizard', webhookUrl = '') {
  const honeypotVal = d.website || d.website_honeypot || '';
  if (honeypotVal && String(honeypotVal).trim().length > 0) {
    return { status: 'honeypot_blocked', blocked: true, dispatched: false, sent: false };
  }

  const m = d.metrics || {};
  const tco = d.tco || {};
  const measures = (d.dim_outer_dia || d.dim_shaft_bore)
    ? `DE ~${d.dim_outer_dia || 'N/A'} mm | Barreno/Flecha ~${d.dim_shaft_bore || 'N/A'} mm`
    : '';
  const hydraulicsStr = (m.flow_m3h !== undefined || m.slurry_sg !== undefined)
    ? `Q: ${m.flow_m3h || 180} m³/h | Cw: ${m.solids_cw || 45}% (d80: ${m.d80_um || 180} µm) | Sm: ${m.slurry_sg || '1.40'} kg/L (${m.solids_cv || '23.3'}% Cv) | Vc: ${m.critical_velocity_ms || '2.35'} m/s | HR: ${m.head_ratio || '0.88'} | ${m.recommended_alloy || 'High Chrome A05 (>650 HB)'}`
    : '';
  const tcoTons = tco.tco_tons_at_risk !== undefined ? tco.tco_tons_at_risk : m.tco_tons_at_risk;
  const tcoHrs = tco.tco_downtime_hrs !== undefined ? tco.tco_downtime_hrs : m.tco_downtime_hrs;
  const tcoSummary = tco.tco_summary || m.tco_summary || '';
  const tcoStr = (tcoTons !== undefined || tcoSummary)
    ? `~${tcoTons || 0} ton en riesgo (${tcoHrs || 4}h) | ${tcoSummary}`
    : '';

  const payload = {
    folio: d.folio || 'SMAT-2026-RFQ',
    urgencia: d.isOpex === false ? 'proyecto' : 'paro',
    nombre: d.name || d.contact_name || '',
    empresa: d.company || d.company_name || '',
    telefono: d.phone || d.phone_number || '',
    correo: d.email || d.email_address || '',
    equipo: d.part_name || d.role || '',
    codigo: d.smat_code || generateSmatPartCode(d),
    codigo_smat: d.smat_code || generateSmatPartCode(d),
    atomic_code: d.atomic_code || '',
    codigo_pieza_atomica: d.atomic_code || '',
    referencia_cliente: d.client_reference || '',
    medidas_flexometro: measures,
    perfil_pulpa: d.pulp_profile || '',
    perfil_pulpa_mina: d.pulp_profile || '',
    memoria_hidraulica: hydraulicsStr,
    memoria_hidraulica_durand: hydraulicsStr,
    tco_resumen: tcoStr,
    proyeccion_tco: tcoStr,
    detalles: d.details || '',
    especificacion_tecnica: d.details || '',
    destino: d.destination || 'Durango',
    modalidad_logistica: d.destination || 'Durango',
    canal: channelOrigin,
    website: honeypotVal
  };

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem('smat_last_rfq_payload', JSON.stringify(payload));
    } catch (_e) {}
  }

  const resolvedEndpoint = webhookUrl || (typeof window !== 'undefined' && window.SMAT_LEAD_WEBHOOK_URL) || '';
  if (resolvedEndpoint && typeof fetch === 'function') {
    try {
      fetch(resolvedEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (_e) {}
  }

  return { status: 'dispatched', blocked: false, dispatched: true, sent: Boolean(resolvedEndpoint), payload };
}

const SMAT_SESSION_KEY = 'smat_workbench_session';

/**
 * Guarda el estado del Workbench en sessionStorage (Decisión 4-A)
 * @param {Object} state 
 */
export function saveWorkbenchSession(state = {}) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(SMAT_SESSION_KEY, JSON.stringify(state));
  } catch (_e) {}
}

/**
 * Carga el estado del Workbench desde sessionStorage (Decisión 4-A)
 * @returns {Object|null}
 */
export function loadWorkbenchSession() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(SMAT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_e) {
    return null;
  }
}

export { dispatchLeadWebhook as sendLeadToServer };


