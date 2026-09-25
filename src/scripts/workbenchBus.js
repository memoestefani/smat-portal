/**
 * SMAT Minerals - Sovereign Event Bus & B2B Requisition Formatter (Decisiones 5-C y 6-C)
 * Comunicación reactiva desacoplada entre islas de Astro (CustomEvent) y formateadores
 * oficiales de exportación para SAP / ERP, Mailto RFC 6068 y WhatsApp de Almacén Durango.
 */

export const SMAT_WORKBENCH_EVENT = 'smat:workbench_update';

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
    falla: null
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
  const requester = data.contact_name || 'Ingeniería / Residente';
  const company = data.company_name || 'Unidad Minera / Empresa';
  const contact = data.phone_number ? `${data.phone_number} • ${data.email_address || ''}` : (data.email_address || 'N/A');
  
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
  const partName = data.part_name || 'Impulsor de 5 álabes High Chrome 27% (A05) >650 HB';
  const partQty = data.quantity || 1;
  const metrics = data.metrics || {};
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
    ``,
    `2. ESPECIFICACIÓN TÉCNICA DE PARTIDA (SAP / ERP):`,
    `   - Tipo de Solicitud: ${missionText}`,
    `   - Partida / Equipo:  ${partName}`,
    `   - Cantidad:          ${partQty} pza(s)`,
    `   - Domicilio Fiscal:  Mariano Salas #114, Col. Hipódromo, Durango, Dgo. CP 34166`,
    `   - Almacén/Despacho:  Durango, Dgo. (Retiro en patio coordinado con folio)`,
  ];

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

  if (metrics.solids_cw !== undefined || metrics.critical_velocity_ms !== undefined) {
    lines.push(``);
    lines.push(`3. MEMORIA DE CÁLCULO HIDRÁULICO (FÓRMULA DURAND-CONDOLIOS):`);
    if (metrics.flow_m3h) lines.push(`   - Flujo de Operación:        ${metrics.flow_m3h} m³/h`);
    if (metrics.solids_cw) lines.push(`   - Concentración de Sólidos:  ${metrics.solids_cw}% Cw (S_s: ${metrics.solid_sg || 2.7})`);
    if (metrics.slurry_sg) lines.push(`   - Densidad de Pulpa (S_m):   ${metrics.slurry_sg} kg/L`);
    if (metrics.critical_velocity_ms) lines.push(`   - Velocidad Límite Durand:   ${metrics.critical_velocity_ms} m/s (Evita arenamiento)`);
    if (metrics.recommended_alloy) lines.push(`   - Metalurgia Sugerida:       ${metrics.recommended_alloy}`);
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
  if (!clean.startsWith('SMAT-')) return null;

  const parts = clean.split('-');
  if (parts.length < 3) return null;

  const line = parts[1]; // PUMP, FLOT, FILT, SEAL, BEAR, SKID, PART
  const series = parts[2]; // 6X4, 6X4D, 3X2, 4X3C, 8X6, 10X8, 100FT, 50FT, 1500, PRESS
  const token3 = parts[3] || '';
  const token4 = parts[4] || '';

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

