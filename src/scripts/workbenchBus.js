/**
 * SMAT Minerals - Sovereign Event Bus & B2B Requisition Formatter (Decisiones 5-C y 6-C)
 * Comunicación reactiva desacoplada entre islas de Astro (CustomEvent) y formateadores
 * oficiales de exportación para SAP / ERP, Mailto RFC 6068 y WhatsApp de Almacén Durango.
 */

import atomicPartsJson from '../../data/atomic_parts.json' with { type: 'json' };

export const SMAT_WORKBENCH_EVENT = 'smat:workbench_update';

/**
 * Endpoint oficial de respaldo para ingesta asíncrona hacia Google Apps Script (Code.gs)
 */
export const DEFAULT_SMAT_LEAD_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzSmatDurangoLeadIntakeWebhookV2/exec';

/**
 * Enriquecimiento cinemático y de ruteo de estación por código atómico sobre SSOT data/atomic_parts.json
 */
const ATOMIC_ENGINEERING_ENRICHMENT = {
  D3147: {
    slug: 'impulsor_3x2_d3147',
    role: 'solo_impulsor',
    pipe_size: '3x2',
    smat_code: 'SMAT-PUMP-3X2-IMP',
    wall_thickness_mm: 24,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)',
    station_name_en: 'Wet-End Assembly (5-5-4 Lot)',
    assembly_order_note: '09. Impulsor Cerrado 5 Álabes (Estación 03 • Lote 5:5:4)'
  },
  E4147: {
    slug: 'impulsor_5_alabes',
    role: 'solo_impulsor',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-IMP',
    wall_thickness_mm: 32,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)',
    station_name_en: 'Wet-End Assembly (5-5-4 Lot)',
    assembly_order_note: '09. Impulsor Cerrado 5 Álabes (Estación 03 • Lote 5:5:4)'
  },
  F6147: {
    slug: 'impulsor_8x6_f6147',
    role: 'solo_impulsor',
    pipe_size: '8x6',
    smat_code: 'SMAT-PUMP-8X6-IMP',
    wall_thickness_mm: 42,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)',
    station_name_en: 'Wet-End Assembly (5-5-4 Lot)',
    assembly_order_note: '09. Impulsor Cerrado 5 Álabes (Estación 03 • Lote 5:5:4)'
  },
  DAM028: {
    slug: 'camisa_flecha',
    role: 'kit_sellado',
    pipe_size: '3x2',
    smat_code: 'SMAT-SEAL-3X2-EXP',
    wall_thickness_mm: 18,
    station_name_es: 'Sellado Centrífugo Seco',
    station_name_en: 'Dry Centrifugal Sealing',
    assembly_order_note: '05. Anillo Expulsor Centrífugo (Estación 02 • Sin agua de sello)'
  },
  EAM028: {
    slug: 'expeller',
    role: 'kit_sellado',
    pipe_size: '6x4',
    smat_code: 'SMAT-SEAL-6X4-EXP',
    wall_thickness_mm: 22,
    station_name_es: 'Sellado Centrífugo Seco',
    station_name_en: 'Dry Centrifugal Sealing',
    assembly_order_note: '05. Anillo Expulsor Centrífugo (Estación 02 • Sin agua de sello)'
  },
  E4083: {
    slug: 'throatbush',
    role: 'solo_voluta',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-VOL',
    wall_thickness_mm: 35,
    station_name_es: 'Extremo Húmedo / Calibración Axial',
    station_name_en: 'Wet-End / Axial Clearance Calibration',
    assembly_order_note: '11. Cuello de Succión Cónico Throatbush (Estación 03 • Claro δ=0.5–1.0 mm)'
  }
};

/**
 * Mapa canónico de las 6 refacciones atómicas universales importado desde SSOT (data/atomic_parts.json)
 * para resolución determinista de deep-links (?codigo=D3147..E4083), dureza, garantía de ajuste y decodificación.
 */
export const ATOMIC_PARTS_CATALOG = Object.fromEntries(
  atomicPartsJson.map((item) => {
    const key = String(item.part_number || item.code || '').toUpperCase();
    const extra = ATOMIC_ENGINEERING_ENRICHMENT[key] || {};
    return [
      key,
      {
        ...item,
        ...extra,
        circuit: 'bombeo',
        max_sphere_mm: item.max_particle_mm,
        station: `S${item.station_number}`,
        handling_mode: item.niosh_handling_mode
      }
    ];
  })
);

/**
 * Resuelve un código atómico universal (D3147..E4083) de forma insensible a mayúsculas
 * @param {string} [rawCode='']
 */
export function resolveAtomicPartCode(rawCode = '') {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const key = rawCode.trim().toUpperCase();
  return ATOMIC_PARTS_CATALOG[key] || null;
}

/**
 * Obtiene la ficha física e ingenieril de una pieza atómica por código (D3147..E4083),
 * slug de selección rápida (impulsor_5_alabes, throatbush, etc.) o serie de tubería (3x2, 6x4, 8x6).
 * Incluye masa unitaria (weight_kg), modo de izaje NIOSH (<23 kg manual vs >=23 kg polipasto),
 * diámetro real de impulsor D2 (mm), álabes, paso de partícula y estación de ensamble BOM.
 * @param {string} [codeOrSlug='']
 * @param {string} [pipeSeries='6x4']
 */
export function getAtomicPartSpecs(codeOrSlug = '', pipeSeries = '6x4') {
  const direct = resolveAtomicPartCode(codeOrSlug);
  if (direct) return direct;

  const slug = String(codeOrSlug || '').trim().toLowerCase();
  const series = String(pipeSeries || '6x4').trim().toLowerCase();

  if (slug.includes('d3147')) return ATOMIC_PARTS_CATALOG.D3147;
  if (slug.includes('f6147')) return ATOMIC_PARTS_CATALOG.F6147;
  if (slug.includes('dam028') || slug.includes('camisa') || slug.includes('sleeve')) return ATOMIC_PARTS_CATALOG.DAM028;
  if (slug.includes('eam028') || slug.includes('expeller') || slug.includes('sello')) return ATOMIC_PARTS_CATALOG.EAM028;
  if (slug.includes('e4083') || slug.includes('throatbush') || slug.includes('cuello') || slug.includes('voluta') || slug.includes('liner') || slug.includes('fpl')) {
    return ATOMIC_PARTS_CATALOG.E4083;
  }

  if (series.includes('3x2') || series.includes('4x3') || series.includes('1.5x1')) {
    return ATOMIC_PARTS_CATALOG.D3147;
  }
  if (series.includes('8x6') || series.includes('10x8')) {
    return ATOMIC_PARTS_CATALOG.F6147;
  }
  return ATOMIC_PARTS_CATALOG.E4147;
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
  if (typeof window === 'undefined') return () => { };
  const handler = (event) => callback(event.detail);
  window.addEventListener(SMAT_WORKBENCH_EVENT, handler);
  return () => window.removeEventListener(SMAT_WORKBENCH_EVENT, handler);
}

/**
 * Parsea los parámetros de contexto desde la URL (#rfq?equipo=... o ?equipo=... o combinación de search + hash)
 * @param {string} [urlOrSearch='']
 * @param {string} [hashOptional='']
 * @returns {Object}
 */
export function parseUrlContextParams(urlOrSearch = '', hashOptional = '') {
  if (!urlOrSearch && !hashOptional && typeof window !== 'undefined') {
    urlOrSearch = window.location.search || '';
    hashOptional = window.location.hash || '';
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
    pieza: null,
    material: null,
    transmision: null,
    estacion: null,
    claro_mm: null,
    u2_ms: null,
    l10h: null,
    peso_kg: null,
    metrologia: null,
    sg: null,
    cw: null,
    gy_kg: null,
    p80: null,
    d95: null,
    ph: null,
    seal_branch: null,
    b2_mm: null,
    cap_c_kn: null,
    rhop: null,
    lib_um: null,
    grade: null,
    air_psi: null,
    gy_c: null,
    gy_err: null,
    rr_n: null,
    ret_p80: null,
    n2_rpm: null,
    fr_kn: null,
    driver_mm: null,
    driven_mm: null,
    motor_rpm: null,
    power_kw: null,
    inmunidad_sumidero: null,
    razon_estructural: null,
    cv: null,
    fl: null,
    v_rec: null,
    pipeOrSeries: null,
    pulpPh: null,
    sealBranch: null,
    impellerExitWidthMm: null,
    dynamicCapacityCkN: null,
    driverPulleyMm: null,
    drivenPulleyMm: null,
    motorRpm: null,
    shaftPowerKw: null,
    oreDensitySg: null,
    solidsSg: null,
    solidsWeightPercent: null,
    gyD95Cm: null,
    liberationSizeMicrons: null,
    criticalGradeDecimal: null,
    airPressurePsi: null,
    gyConstantC: null,
    gyRelativeError: null,
    rosinRammlerSlopeN: null,
    particleSizeD80Microns: null,
    atomic_part: null
  };

  if (!urlOrSearch && !hashOptional) return result;

  function extractQuerySegment(segment) {
    if (!segment) return '';
    let s = String(segment);
    const qIdx = s.indexOf('?');
    if (qIdx !== -1) {
      s = s.substring(qIdx + 1);
    } else if (s.startsWith('#')) {
      return '';
    } else {
      s = s.replace(/^[#?]/, '');
    }
    const hIdx = s.indexOf('#');
    if (hIdx !== -1) {
      s = s.substring(0, hIdx);
    }
    return s;
  }

  const rawParts = [extractQuerySegment(urlOrSearch), extractQuerySegment(hashOptional)].filter(Boolean);
  let raw = rawParts.join('&');
  if (!raw && urlOrSearch && !urlOrSearch.startsWith('#')) {
    raw = urlOrSearch.replace(/^[#?]/, '');
    const hIdx = raw.indexOf('#');
    if (hIdx !== -1) raw = raw.substring(0, hIdx);
  }
  if (!raw) return result;

  try {
    const params = new URLSearchParams(raw);
    if (params.has('equipo')) result.equipo = params.get('equipo');
    else if (params.has('role_id')) result.equipo = params.get('role_id');
    else if (params.has('role')) result.equipo = params.get('role');

    if (params.has('pieza')) result.pieza = params.get('pieza');
    else if (params.has('part')) result.pieza = params.get('part');

    if (params.has('material')) result.material = params.get('material');
    else if (params.has('aleacion')) result.material = params.get('aleacion');

    if (params.has('transmision')) result.transmision = params.get('transmision').toUpperCase();
    else if (params.has('drive')) result.transmision = params.get('drive').toUpperCase();

    if (params.has('estacion')) result.estacion = params.get('estacion');
    if (params.has('claro_mm')) result.claro_mm = params.get('claro_mm');
    else if (params.has('clearance')) result.claro_mm = params.get('clearance');

    if (params.has('u2_ms')) result.u2_ms = params.get('u2_ms');
    else if (params.has('tip_speed')) result.u2_ms = params.get('tip_speed');

    if (params.has('l10h')) result.l10h = params.get('l10h');
    if (params.has('peso_kg')) result.peso_kg = params.get('peso_kg');
    if (params.has('metrologia')) result.metrologia = params.get('metrologia');
    if (params.has('sg')) result.sg = params.get('sg');
    if (params.has('cw')) result.cw = params.get('cw');
    if (params.has('gy_kg')) result.gy_kg = params.get('gy_kg');
    if (params.has('p80')) result.p80 = params.get('p80');
    if (params.has('d95')) result.d95 = params.get('d95');
    if (params.has('ph')) result.ph = params.get('ph');
    if (params.has('seal_branch')) result.seal_branch = params.get('seal_branch');
    else if (params.has('sello_rama')) result.seal_branch = params.get('sello_rama');
    if (params.has('b2_mm')) result.b2_mm = params.get('b2_mm');
    if (params.has('cap_c_kn')) result.cap_c_kn = params.get('cap_c_kn');
    if (params.has('rhop')) result.rhop = params.get('rhop');
    if (params.has('lib_um')) result.lib_um = params.get('lib_um');
    if (params.has('grade')) result.grade = params.get('grade');
    if (params.has('air_psi')) result.air_psi = params.get('air_psi');
    if (params.has('gy_c')) result.gy_c = params.get('gy_c');
    if (params.has('gy_err')) result.gy_err = params.get('gy_err');
    if (params.has('rr_n')) result.rr_n = params.get('rr_n');
    if (params.has('ret_p80')) result.ret_p80 = params.get('ret_p80');
    if (params.has('n2_rpm')) result.n2_rpm = params.get('n2_rpm');
    if (params.has('fr_kn')) result.fr_kn = params.get('fr_kn');
    if (params.has('driver_mm')) result.driver_mm = params.get('driver_mm');
    if (params.has('driven_mm')) result.driven_mm = params.get('driven_mm');
    if (params.has('motor_rpm')) result.motor_rpm = params.get('motor_rpm');
    if (params.has('power_kw')) result.power_kw = params.get('power_kw');
    if (params.has('inmunidad_sumidero')) result.inmunidad_sumidero = params.get('inmunidad_sumidero');
    if (params.has('razon_estructural')) result.razon_estructural = params.get('razon_estructural');
    if (params.has('cv')) result.cv = params.get('cv');
    if (params.has('fl')) result.fl = params.get('fl');
    if (params.has('v_rec')) result.v_rec = params.get('v_rec');

    if (params.has('rol')) result.rol = params.get('rol');
    else if (params.has('perspectiva')) result.rol = params.get('perspectiva');

    if (params.has('mina')) result.mina = params.get('mina');
    else if (params.has('empresa')) result.mina = params.get('empresa');

    if (params.has('urgencia')) result.urgencia = params.get('urgencia');
    else if (params.has('tipo')) result.urgencia = params.get('tipo');
    if (params.has('modo')) result.modo = params.get('modo');
    if (params.has('origen')) result.origen = params.get('origen');
    if (params.has('serie')) result.serie = params.get('serie');
    else if (params.has('bomba')) result.serie = params.get('bomba');
    result.pipeOrSeries = result.serie;
    if (result.ph !== null) result.pulpPh = Number(result.ph);
    if (result.seal_branch !== null) result.sealBranch = result.seal_branch;
    if (result.b2_mm !== null) result.impellerExitWidthMm = Number(result.b2_mm);
    if (result.cap_c_kn !== null) result.dynamicCapacityCkN = Number(result.cap_c_kn);
    if (result.driver_mm !== null) result.driverPulleyMm = Number(result.driver_mm);
    if (result.driven_mm !== null) result.drivenPulleyMm = Number(result.driven_mm);
    if (result.motor_rpm !== null) result.motorRpm = Number(result.motor_rpm);
    if (result.power_kw !== null) result.shaftPowerKw = Number(result.power_kw);
    if (result.rhop !== null) result.oreDensitySg = Number(result.rhop);
    if (result.sg !== null) result.solidsSg = Number(result.sg);
    if (result.cw !== null) result.solidsWeightPercent = Number(result.cw);
    if (params.has('d95_cm')) {
      result.d95 = params.get('d95_cm');
      result.gyD95Cm = Number(result.d95);
    } else if (result.d95 !== null) {
      result.gyD95Cm = Number(result.d95);
    }
    if (result.lib_um !== null) result.liberationSizeMicrons = Number(result.lib_um);
    if (result.grade !== null) result.criticalGradeDecimal = Number(result.grade);
    if (result.air_psi !== null) result.airPressurePsi = Number(result.air_psi);
    if (result.gy_c !== null) result.gyConstantC = Number(result.gy_c);
    if (result.gy_err !== null) result.gyRelativeError = Number(result.gy_err);
    if (result.rr_n !== null) result.rosinRammlerSlopeN = Number(result.rr_n);
    if (params.has('sintoma')) result.sintoma = params.get('sintoma');
    if (params.has('falla')) result.falla = params.get('falla');

    if (params.has('circuito')) result.circuito = params.get('circuito');
    else if (params.has('circuit')) result.circuito = params.get('circuit');

    if (params.has('flow')) result.flow = params.get('flow');
    if (params.has('solids')) result.solids = params.get('solids');
    else if (params.has('cw')) result.solids = params.get('cw');
    if (params.has('d80')) result.d80 = params.get('d80');
    else if (params.has('p80')) result.d80 = params.get('p80');
    if (result.d80 !== null) result.particleSizeD80Microns = Number(result.d80);

    // Si el usuario seleccionó una pieza específica en 1 clic sin pasar equipo, mapear al rol correspondiente
    if (!result.equipo && result.pieza) {
      const pLower = result.pieza.toLowerCase();
      if (pLower.includes('impulsor') || pLower.includes('impeller')) result.equipo = 'impulsor';
      else if (pLower.includes('throatbush') || pLower.includes('cuello') || pLower.includes('voluta') || pLower.includes('liner') || pLower.includes('fpl') || pLower.includes('554') || pLower.includes('5-5-4')) result.equipo = 'revestimientos';
      else if (pLower.includes('expeller') || pLower.includes('sello') || pLower.includes('camisa') || pLower.includes('sleeve')) result.equipo = 'sello';
      else if (pLower.includes('bearing') || pLower.includes('soporte') || pLower.includes('rodamiento')) result.equipo = 'soporte';
    }

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

  const ps = data.part_specs || {};
  const ce = data.clearance_eval || {};
  const kin = data.kinematics || {};
  const met = data.metrology || {};
  const resolvedDrive = data.transmision || data.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedMat = data.material || data.wet_material || data.pump_material || '';
  const resolvedStation = data.estacion || data.station_number || data.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = data.peso_kg || data.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = data.claro_mm || data.front_clearance_mm || ce.frontClearanceMm || '';
  const resolvedDeltaEta = data.delta_eta_v !== undefined ? data.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct);
  const resolvedU2 = data.u2_ms || data.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedPumpRpm = data.n2_rpm || data.pump_rpm || kin.pumpRpm || '';
  const resolvedFrKn = data.fr_kn !== undefined ? data.fr_kn : (data.belt_radial_load_kn ?? kin.beltRadialLoadKn ?? '');
  const resolvedFlood = data.inmunidad_sumidero || data.sump_flood_immunity || kin.sumpFloodImmunity || '';
  const resolvedStructural = data.razon_estructural || data.structural_reason || ce.structuralReasonEs || '';
  const resolvedL10h = data.l10h || data.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = data.metrologia || data.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );

  if (clientRef) {
    lines.push(`   - Referencia Interna Cliente: ${clientRef}`);
  }
  if (dimDia || dimBore) {
    lines.push(`   - Medidas Campo (Flexómetro): DE ~${dimDia || 'N/A'} mm | Barreno/Flecha ~${dimBore || 'N/A'} mm`);
  }
  if (resolvedDrive) {
    lines.push(`   - Arreglo Transmisión:        ${String(resolvedDrive).toUpperCase()} (Cinemática de Poleas / Acoplamiento)`);
  }
  if (resolvedMat) {
    lines.push(`   - Material Contacto Húmedo:   ${resolvedMat}`);
  }
  if (resolvedStation) {
    const stStr = String(resolvedStation).replace(/^S/i, '');
    lines.push(`   - Estación de Armado BOM:     Estación 0${stStr}`);
  }
  if (resolvedWeight) {
    const wKg = Number(resolvedWeight);
    const nioshLabel = wKg >= 23 ? 'Requiere Polipasto / Grúa (≥ 23 kg NIOSH)' : 'Manejo Manual Seguro (< 23 kg NIOSH)';
    lines.push(`   - Masa Unitaria / Izaje:      ${wKg.toFixed(1)} kg (${nioshLabel})`);
  }
  if (resolvedClaro) {
    const lossStr = resolvedDeltaEta !== undefined ? ` | Pérdida Recirculación Δη_v: ${resolvedDeltaEta}%` : '';
    lines.push(`   - Calibración Claro Axial δ:  ${resolvedClaro} mm${lossStr}`);
  }
  if (resolvedStructural) {
    lines.push(`   - Dictamen Estructural:       ${resolvedStructural}`);
  }
  if (resolvedU2 || resolvedL10h || resolvedPumpRpm || resolvedFrKn !== '') {
    const u2Val = resolvedU2 || '19.9';
    const l10Val = resolvedL10h || '28500';
    const rpmSuffix = resolvedPumpRpm ? ` | n2 = ${resolvedPumpRpm} RPM` : '';
    const frSuffix = resolvedFrKn !== '' ? ` | Fr = ${Number(resolvedFrKn).toFixed(2)} kN` : '';
    const floodSuffix = resolvedFlood ? ` | Sumidero = ${resolvedFlood}` : '';
    lines.push(`   - Cinemática V-Belt & ISO281: u2 = ${u2Val} m/s${rpmSuffix}${frSuffix} | Vida Rodamientos L10h = ${l10Val} h${floodSuffix}`);
  }
  if (resolvedMetrology) {
    lines.push(`   - Cédula Metrológica Lab:     ${resolvedMetrology}`);
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
  const company = data.company_name || data.company || 'Unidad Minera';
  const partName = data.part_name || data.role || 'Refaccionamiento Minero';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const targetEmail = data.target_email || data.email_address || 'ventas@smatminerals.com';

  const subject = `[Requisición ${folio}] [${smatCode}] ${company} - ${partName}`;
  const body = formatSapPlaintext(data);

  return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Genera URL para WhatsApp directo a atención técnica de planta en Durango (Decisiones 8-B y 9-B)
 * Incluye claro axial δ, pérdida volumétrica Δη_v, cinemática V-Belt (u2, L10h),
 * estación/masa NIOSH, memoria hidráulica Durand y cédula metrológica de laboratorio.
 * @param {Object} data 
 * @returns {string}
 */
export function formatWhatsappUrl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const requester = data.contact_name || data.name || 'Ingeniero Solicitante';
  const company = data.company_name || data.company || 'Empresa';
  const phoneContact = data.phone_number || data.phone || '';
  const partName = data.part_name || data.role || 'Refacción de Bomba';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const atomicCode = data.atomic_code || '';
  const circuit = (data.circuit || 'BOMBEO').toUpperCase();
  const priorityTag = data.isOpex === false ? '[PROYECTO CAPEX]' : '[PARO DE PLANTA]';

  const ps = data.part_specs || {};
  const ce = data.clearance_eval || {};
  const kin = data.kinematics || {};
  const met = data.metrology || {};
  const m = data.metrics || {};

  const resolvedMat = data.material || data.wet_material || data.pump_material || '';
  const resolvedDrive = data.transmision || data.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedStation = data.estacion || data.station_number || data.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = data.peso_kg || data.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = data.claro_mm !== undefined ? data.claro_mm : (data.front_clearance_mm ?? ce.frontClearanceMm ?? '');
  const resolvedDeltaEta = data.delta_eta_v !== undefined ? data.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct ?? '');
  const resolvedU2 = data.u2_ms || data.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedPumpRpm = data.n2_rpm || data.pump_rpm || kin.pumpRpm || '';
  const resolvedFrKn = data.fr_kn !== undefined ? data.fr_kn : (data.belt_radial_load_kn ?? kin.beltRadialLoadKn ?? '');
  const resolvedFlood = data.inmunidad_sumidero || data.sump_flood_immunity || kin.sumpFloodImmunity || '';
  const resolvedL10h = data.l10h || data.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = data.metrologia || data.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );

  const lines = [
    `Hola SMAT Durango, requiero cotización y confirmación de stock para:`,
    `*Prioridad:* ${priorityTag}`,
    `*Folio:* ${folio}`,
    `*Circuito:* ${circuit}`,
    `*Mina:* ${company} (${requester}${phoneContact ? ` • ${phoneContact}` : ''})`,
    `*Equipo/Partida:* ${partName}`,
    `*Código SMAT:* ${smatCode}${atomicCode ? ` (Refacción: ${atomicCode})` : ''}`
  ];

  if (data.pulp_profile) {
    lines.push(`*Perfil Mineral:* ${data.pulp_profile}`);
  }
  if (resolvedMat || resolvedDrive || resolvedStation || resolvedWeight) {
    const mechParts = [];
    if (resolvedMat) mechParts.push(`Mat: ${resolvedMat}`);
    if (resolvedDrive) mechParts.push(`Transmisión: ${resolvedDrive}`);
    if (resolvedStation) mechParts.push(`Estación: ${resolvedStation}`);
    if (resolvedWeight) mechParts.push(`Masa NIOSH: ${resolvedWeight} kg`);
    lines.push(`*Ingeniería / BOM:* ${mechParts.join(' | ')}`);
  }
  if (resolvedClaro !== '' || resolvedU2 || resolvedL10h || resolvedPumpRpm || resolvedFrKn !== '') {
    const kinParts = [];
    if (resolvedClaro !== '') {
      kinParts.push(`Claro axial δ=${resolvedClaro} mm${resolvedDeltaEta !== '' ? ` (Δηv=-${resolvedDeltaEta}%)` : ''}`);
    }
    if (resolvedU2) kinParts.push(`u2=${resolvedU2} m/s`);
    if (resolvedPumpRpm) kinParts.push(`n2=${resolvedPumpRpm} RPM`);
    if (resolvedFrKn !== '') kinParts.push(`Fr=${Number(resolvedFrKn).toFixed(2)} kN`);
    if (resolvedL10h) kinParts.push(`L10h=${resolvedL10h} h`);
    if (resolvedFlood) kinParts.push(`Sumidero=${resolvedFlood}`);
    lines.push(`*Claro Axial y Cinemática V-Belt:* ${kinParts.join(' | ')}`);
  }
  if (m.flow_m3h !== undefined || m.slurry_sg !== undefined) {
    lines.push(`*Hidráulica Durand:* ${m.flow_m3h || 180} m³/h @ ${m.solids_cw || 45}% Cw, Sm=${m.slurry_sg || '1.40'} kg/L, Vc=${m.critical_velocity_ms || '2.35'} m/s, HR=${m.head_ratio || '0.88'}`);
  }
  if (resolvedMetrology) {
    lines.push(`*Cédula Metrológica Lab:* ${resolvedMetrology}`);
  }
  if (data.dim_outer_dia || data.dim_shaft_bore) {
    lines.push(`*Medidas flexómetro:* DE ${data.dim_outer_dia || 'N/A'}, Barreno ${data.dim_shaft_bore || 'N/A'}`);
  }
  if (data.details) {
    lines.push(`*Detalles:* ${data.details}`);
  }
  if (data.client_reference) {
    lines.push(`*Ref. Cliente:* ${data.client_reference}`);
  }
  if (data.destination) {
    lines.push(`*Destino:* ${data.destination}`);
  }

  lines.push(``);
  lines.push(`*Instrucción de Almacén Durango:* Favor de adjuntar fotografía de la pieza con un flexómetro de referencia para cotejo 1:1.`);
  if (data.has_photo) {
    lines.push(`[Adjunto foto de placa/equipo para cotejo 1:1]`);
  }
  lines.push(`Favor de confirmar tiempo de despacho en Almacén Central Durango.`);

  const text = lines.join('\n');
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

  const isCtrl = circuit === 'control_procesos' || circuit === 'control' || roleLower.includes('marcy') || roleLower.includes('balanza') || roleLower.includes('batch') || roleLower.includes('tamiz') || roleLower.includes('tamices') || roleLower.includes('sieve') || details.includes('MARCY') || details.includes('TAMIZ') || details.includes('ASTM E11');
  const isFlot = !isCtrl && (circuit === 'flotacion' || roleLower.includes('celda') || roleLower.includes('flotacion') || roleLower.includes('rotor') || roleLower.includes('estator') || roleLower.includes('mecanismo') || details.includes('FLOT') || details.includes('CELDA'));
  const isFilt = !isCtrl && (circuit === 'filtracion' || roleLower.includes('filtro') || roleLower.includes('prensa') || roleLower.includes('placa') || roleLower.includes('tela') || details.includes('FILT') || details.includes('PRENSA'));

  if (isCtrl) {
    if (roleLower.includes('batch') || details.includes('BATCH')) return 'SMAT-CTRL-BATCH-LAB';
    if (roleLower.includes('tamiz') || roleLower.includes('tamices') || roleLower.includes('sieve') || details.includes('TAMIZ') || details.includes('ASTM')) return 'SMAT-CTRL-SIEVE-ASTM';
    return 'SMAT-CTRL-MARCY-1000';
  }

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
  if (pipe === '1.5x1' || details.includes('1.5X1')) pipeTag = '1.5X1';
  else if (pipe === '2x1.5' || details.includes('2X1.5')) pipeTag = '2X1.5';
  else if (pipe === '3x2' || details.includes('3X2') || (roleLower === 'sello' && details.includes('4X3'))) pipeTag = '3X2';
  else if (pipe === '4x3' || details.includes('4X3')) pipeTag = '4X3';
  else if (pipe === '6x4' || details.includes('6X4')) pipeTag = '6X4';
  else if (pipe === '8x6' || details.includes('8X6')) pipeTag = '8X6';
  else if (pipe === '10x8' || details.includes('10X8')) pipeTag = '10X8';
  else if (pipe === '12x10' || details.includes('12X10')) pipeTag = '12X10';
  else if (pipe === '14x12' || details.includes('14X12')) pipeTag = '14X12';

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
 * como códigos históricos (SMAT-PUMP-6X4D-A05-IMP) y piezas atómicas (D3147..E4083).
 * @param {string} code - e.g. SMAT-PUMP-6X4-WETKIT o SMAT-FLOT-100FT-MECH
 * @param {'es'|'en'} [lang='es']
 * @returns {Object|null}
 */
export function parseSmatPartCode(code = '', lang = 'es') {
  if (!code || typeof code !== 'string') return null;
  const clean = code.trim().toUpperCase();

  // Soporte directo para las 6 refacciones atómicas universales (D3147..E4083)
  const atomicMatch = resolveAtomicPartCode(clean);
  if (atomicMatch) {
    return {
      valid: true,
      raw: clean,
      code: atomicMatch.smat_code,
      atomic_code: atomicMatch.part_number,
      atomic_label: lang === 'en' ? atomicMatch.name_en : atomicMatch.name_es,
      atomic_metallurgy: atomicMatch.metallurgy,
      circuit: atomicMatch.circuit,
      line: atomicMatch.role === 'kit_sellado' ? 'SEAL' : 'PUMP',
      series: atomicMatch.pipe_size.toUpperCase(),
      pipe_size: atomicMatch.pipe_size,
      size: atomicMatch.pipe_size,
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

  const line = parts[1]; // PUMP, FLOT, FILT, SEAL, BEAR, SKID, CTRL
  const series = parts[2]; // 6X4, 6X4D, 3X2, 4X3C, 8X6, 10X8, 100FT, 50FT, 1500, PRESS
  const token3 = parts[3] || '';

  let circuit = 'bombeo';
  let role_id = 'impulsor';
  let ui_role = 'kit_wet_end';
  let size = '6x4';
  let isOpex = true;
  let mission = 'refacciones';
  let alloy = clean.includes('RUB') || clean.includes('R55')
    ? 'Caucho Natural Vulcanizado'
    : (token3 === 'U01' || clean.includes('-U01')
      ? 'U01'
      : (parts.includes('PU')
        ? 'Poliuretano Elastómero U01 (Shore A 85–95)'
        : (token3 === 'A05' || clean.includes('A05') ? 'A05' : 'Dureza Metalúrgica Certificada')));

  if (line === 'SKID') {
    role_id = 'skid_bomba';
    ui_role = 'skid_bomba';
    isOpex = false;
    mission = 'equipos';
  } else if (line === 'PUMP') {
    if (clean.includes('WETKIT')) {
      role_id = 'kit_wet_end';
      ui_role = 'kit_wet_end';
    } else if (clean.includes('VOL')) {
      role_id = 'solo_voluta';
      ui_role = 'solo_voluta';
    } else if (clean.includes('LINER')) {
      role_id = 'revestimientos';
      ui_role = 'solo_voluta';
    } else {
      role_id = 'impulsor';
      ui_role = 'solo_impulsor';
    }
  } else if (line === 'SEAL') {
    role_id = 'sello';
    ui_role = 'kit_sellado';
  } else if (line === 'BEAR') {
    role_id = 'soporte';
    ui_role = 'kit_rodamientos';
  } else if (line === 'FLOT') {
    circuit = 'flotacion';
    if (clean.includes('50FT')) size = '50ft';
    else if (clean.includes('200FT')) size = '200ft';
    else if (clean.includes('300FT')) size = '300ft';
    else size = '100ft';
    if (clean.includes('CELL')) {
      role_id = 'celda_flotacion';
      ui_role = 'celda_flotacion';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('BANK')) {
      role_id = 'bateria_celdas';
      ui_role = 'bateria_celdas';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('SHROUD')) {
      role_id = 'manto_difusor';
      ui_role = 'manto_difusor';
    } else {
      role_id = 'rotor_estator';
      ui_role = 'rotor_estator';
    }
  } else if (line === 'CTRL') {
    circuit = 'control_procesos';
    if (clean.includes('BATCH')) {
      role_id = 'filtro_batch_lab';
      ui_role = 'filtro_batch_lab';
      size = 'batch_100psi';
      isOpex = false;
      mission = 'equipos';
      alloy = 'Acero Estructural Bridado (60-100 psi)';
    } else if (clean.includes('SIEVE') || clean.includes('ASTM')) {
      role_id = 'tamices_laboratorio';
      ui_role = 'tamices_laboratorio';
      size = 'astm_8in_inox';
      isOpex = true;
      mission = 'refacciones';
      alloy = 'Acero Inoxidable / Bronce Certificado ASTM E11';
    } else {
      role_id = 'balanza_marcy';
      ui_role = 'balanza_marcy';
      size = 'marcy_12_rings';
      isOpex = false;
      mission = 'equipos';
      alloy = 'Vaso 1000 cm³ Acero Inox 304 + 12 Anillos (Ss 2.2-4.4)';
    }
  } else if (line === 'FILT') {
    circuit = 'filtracion';
    if (clean.includes('800')) size = '800';
    else if (clean.includes('1200')) size = '1200';
    else if (clean.includes('2000')) size = '2000';
    else size = '1500';
    if (clean.includes('PRESS') || clean.includes('16BAR')) {
      role_id = 'filtro_prensa';
      ui_role = 'filtro_prensa';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('MEMBR')) {
      role_id = 'placas_membrana';
      ui_role = 'placas_membrana';
    } else if (clean.includes('PUMP')) {
      role_id = 'bomba_prensa';
      ui_role = 'bomba_prensa';
    } else {
      role_id = 'placas_telas';
      ui_role = 'placas_telas';
    }
  }

  if (circuit === 'bombeo') {
    if (clean.includes('1.5X1')) size = '1.5x1';
    else if (clean.includes('2X1.5')) size = '2x1.5';
    else if (clean.includes('4X3')) size = '4x3';
    else if (clean.includes('3X2')) size = '3x2';
    else if (clean.includes('8X6')) size = '8x6';
    else if (clean.includes('10X8')) size = '10x8';
    else if (clean.includes('12X10')) size = '12x10';
    else if (clean.includes('14X12')) size = '14x12';
    else size = '6x4';
  }

  // Extraer marco dimensional (C, D, E, F) si aplica en códigos legacy
  let frame = '';
  const frameMatch = series.match(/\d+X\d+([A-Z])/);
  if (frameMatch) frame = frameMatch[1];

  const resolvedSpecs = circuit === 'bombeo' ? getAtomicPartSpecs(ui_role, size) : null;

  return {
    valid: true,
    raw: clean,
    code: clean,
    atomic_code: resolvedSpecs ? (resolvedSpecs.part_number || '') : '',
    atomic_label: resolvedSpecs ? (lang === 'en' ? resolvedSpecs.name_en : resolvedSpecs.name_es) : '',
    atomic_metallurgy: resolvedSpecs ? (resolvedSpecs.metallurgy || '') : '',
    circuit,
    line,
    series,
    size,
    frame,
    alloyOrType: token3,
    role: role_id,
    role_id,
    ui_role,
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

  const ps = d.part_specs || {};
  const ce = d.clearance_eval || {};
  const kin = d.kinematics || {};
  const met = d.metrology || {};
  const resolvedMat = d.material || d.wet_material || d.pump_material || '';
  const resolvedDrive = d.transmision || d.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedStation = d.estacion || d.station_number || d.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = d.peso_kg || d.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = d.claro_mm || d.front_clearance_mm || ce.frontClearanceMm || '';
  const resolvedDeltaEta = d.delta_eta_v !== undefined ? d.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct);
  const resolvedU2 = d.u2_ms || d.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedPumpRpm = d.n2_rpm || d.pump_rpm || kin.pumpRpm || '';
  const resolvedFrKn = d.fr_kn !== undefined ? d.fr_kn : (d.belt_radial_load_kn ?? kin.beltRadialLoadKn);
  const resolvedFlood = d.inmunidad_sumidero || d.sump_flood_immunity || kin.sumpFloodImmunity || '';
  const resolvedStructural = d.razon_estructural || d.structural_reason || ce.structuralReasonEs || '';
  const resolvedL10h = d.l10h || d.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = d.metrologia || d.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );

  if (d.atomic_code) paramsObj.pieza = d.atomic_code;
  else if (d.pieza) paramsObj.pieza = d.pieza;
  else if (d.part_slug) paramsObj.pieza = d.part_slug;
  if (resolvedMat) paramsObj.material = String(resolvedMat);
  if (resolvedDrive) paramsObj.transmision = String(resolvedDrive);
  if (resolvedStation) paramsObj.estacion = String(resolvedStation);
  if (resolvedWeight) paramsObj.peso_kg = String(resolvedWeight);
  if (resolvedClaro) paramsObj.claro_mm = String(resolvedClaro);
  if (resolvedDeltaEta !== undefined) paramsObj.delta_eta_v = String(resolvedDeltaEta);
  if (resolvedU2) paramsObj.u2_ms = String(resolvedU2);
  if (resolvedPumpRpm) paramsObj.n2_rpm = String(resolvedPumpRpm);
  if (resolvedFrKn !== undefined && resolvedFrKn !== '') paramsObj.fr_kn = String(resolvedFrKn);
  if (resolvedFlood) paramsObj.inmunidad_sumidero = String(resolvedFlood);
  if (resolvedStructural) paramsObj.razon_estructural = String(resolvedStructural);
  if (resolvedL10h) paramsObj.l10h = String(resolvedL10h);
  if (resolvedMetrology) paramsObj.metrologia = String(resolvedMetrology);
  if (d.client_reference) paramsObj.ref_cliente = d.client_reference;
  if (measures) paramsObj.medidas = measures;
  if (d.pulp_profile) paramsObj.perfil_pulpa = d.pulp_profile;
  if (hydraulicsStr) paramsObj.hidraulica = hydraulicsStr;
  if (tcoStr) paramsObj.tco = tcoStr;
  if (d.ph !== undefined && d.ph !== '') paramsObj.ph = String(d.ph);
  else if (d.pulpPh !== undefined && d.pulpPh !== '') paramsObj.ph = String(d.pulpPh);
  else if (m.pulp_ph !== undefined) paramsObj.ph = String(m.pulp_ph);
  if (d.seal_branch || d.sealBranch || ce.sealBranch) paramsObj.seal_branch = String(d.seal_branch || d.sealBranch || ce.sealBranch);
  if (d.b2_mm || d.impellerExitWidthMm || ce.impellerExitWidthMm) paramsObj.b2_mm = String(d.b2_mm || d.impellerExitWidthMm || ce.impellerExitWidthMm);
  if (d.cap_c_kn || d.dynamicCapacityCkN || kin.dynamicCapacityCkN) paramsObj.cap_c_kn = String(d.cap_c_kn || d.dynamicCapacityCkN || kin.dynamicCapacityCkN);
  if (d.fl !== undefined || d.durandFactorFL !== undefined || m.durand_fl !== undefined) paramsObj.fl = String(d.fl ?? d.durandFactorFL ?? m.durand_fl);
  if (d.cv !== undefined || d.solidsVolumetricPercent !== undefined || m.solids_cv !== undefined) paramsObj.cv = String(d.cv ?? d.solidsVolumetricPercent ?? m.solids_cv);
  if (d.v_rec !== undefined || d.recommendedPipeVelocityMs !== undefined || m.safe_velocity_ms !== undefined) paramsObj.v_rec = String(d.v_rec ?? d.recommendedPipeVelocityMs ?? m.safe_velocity_ms);
  if (d.rhop !== undefined || d.oreDensitySg !== undefined || met.sm !== undefined || met.pulpDensityKgL !== undefined) paramsObj.rhop = String(d.rhop ?? d.oreDensitySg ?? met.sm ?? met.pulpDensityKgL);
  if (met.liberationSizeMicrons !== undefined) paramsObj.lib_um = String(met.liberationSizeMicrons);
  if (met.headGradePercent !== undefined || met.oreGradeDecimal !== undefined) paramsObj.grade = String(met.headGradePercent ?? met.oreGradeDecimal);
  if (met.airPressurePsi !== undefined) paramsObj.air_psi = String(met.airPressurePsi);
  if (met.samplingConstantC !== undefined) paramsObj.gy_c = String(met.samplingConstantC);
  if (met.relativeErrorSigma !== undefined) paramsObj.gy_err = String(met.relativeErrorSigma);
  if (met.rosinRammlerSlopeN !== undefined) paramsObj.rr_n = String(met.rosinRammlerSlopeN);
  if (met.retainedPercentAtP80 !== undefined) paramsObj.ret_p80 = String(met.retainedPercentAtP80);

  return new URLSearchParams(paramsObj);
}

/**
 * Clasifica internamente el tipo de partida para ruteo administrativo en Google Sheets (Decisión 8-A)
 * sin exponer jamás jerga contable CAPEX/OPEX en la interfaz pública ni en el Acuse PDF.
 * @param {Object} d
 * @returns {'CONTROL_PROCESOS' | 'PROYECTO_EQUIPOS' | 'OPERACION_SPARE_PARTS'}
 */
export function resolveInternalBudgetCategory(d = {}) {
  const circuit = String(d.circuit || d.process_circuit || '').toLowerCase();
  const role = String(d.role_id || d.role || '').toLowerCase();
  const code = String(d.smat_code || '').toUpperCase();

  if (
    circuit === 'control_procesos' ||
    code.startsWith('SMAT-CTRL-') ||
    role.includes('marcy') ||
    role.includes('balanza') ||
    role.includes('batch') ||
    role.includes('tamiz') ||
    role.includes('tamices')
  ) {
    return 'CONTROL_PROCESOS';
  }

  if (
    d.isOpex === false ||
    d.mission === 'equipos' ||
    code.startsWith('SMAT-SKID-') ||
    code.endsWith('-CELL') ||
    code.endsWith('-BANK') ||
    code.endsWith('-PRESS') ||
    role.includes('skid') ||
    role.includes('celda') ||
    role.includes('bateria') ||
    role.includes('filtro_prensa') ||
    role.includes('prensa_completa')
  ) {
    return 'PROYECTO_EQUIPOS';
  }

  return 'OPERACION_SPARE_PARTS';
}

/**
 * Construye el payload completo de 29 columnas + 9 campos de ingeniería para Google Apps Script (Code.gs)
 * @param {Object} d
 * @param {string} [channelOrigin='web_quote_wizard']
 * @returns {Object}
 */
export function buildLeadWebhookPayload(d = {}, channelOrigin = 'web_quote_wizard') {
  const honeypotVal = d.website || d.website_honeypot || '';
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

  const ps = d.part_specs || {};
  const ce = d.clearance_eval || {};
  const kin = d.kinematics || {};
  const met = d.metrology || {};
  const resolvedMat = d.material || d.wet_material || d.pump_material || '';
  const resolvedDrive = d.transmision || d.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedStation = d.estacion || d.station_number || d.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = d.peso_kg || d.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = d.claro_mm !== undefined ? d.claro_mm : (d.front_clearance_mm ?? ce.frontClearanceMm ?? '');
  const resolvedDeltaEta = d.delta_eta_v !== undefined ? d.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct ?? '');
  const resolvedU2 = d.u2_ms || d.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedL10h = d.l10h || d.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = d.metrologia || d.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );

  return {
    folio: d.folio || 'SMAT-2026-RFQ',
    urgencia: d.isOpex === false ? 'proyecto' : 'paro',
    puerta_interna: resolveInternalBudgetCategory(d),
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
    // 9 Campos Nuevos de Ingeniería (Nombres canónicos + Alias de compatibilidad)
    material_bombeo: resolvedMat,
    material_wet_end: resolvedMat,
    arreglo_transmision: resolvedDrive,
    estacion_armado: resolvedStation,
    estacion_despiece: resolvedStation,
    peso_pieza_kg: resolvedWeight,
    claro_axial_mm: resolvedClaro,
    perdida_eficiencia_vol_pct: resolvedDeltaEta,
    delta_eta_v: resolvedDeltaEta,
    velocidad_periferica_u2_ms: resolvedU2,
    velocidad_punta_u2_ms: resolvedU2,
    vida_rodamiento_l10h: resolvedL10h,
    memoria_metrologica: resolvedMetrology,
    cedula_metrologia: resolvedMetrology,
    detalles: d.details || '',
    especificacion_tecnica: d.details || '',
    destino: d.destination || 'Durango',
    modalidad_logistica: d.destination || 'Durango',
    canal: channelOrigin,
    website: honeypotVal
  };
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

  const payload = buildLeadWebhookPayload(d, channelOrigin);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem('smat_last_rfq_payload', JSON.stringify(payload));
    } catch (_e) { }
  }

  const resolvedEndpoint =
    webhookUrl ||
    (typeof window !== 'undefined' && window.SMAT_LEAD_WEBHOOK_URL) ||
    DEFAULT_SMAT_LEAD_WEBHOOK_URL;
  if (resolvedEndpoint && typeof fetch === 'function') {
    try {
      fetch(resolvedEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(() => { });
    } catch (_e) { }
  }

  return { status: 'dispatched', blocked: false, dispatched: true, sent: Boolean(resolvedEndpoint), endpoint: resolvedEndpoint, payload };
}

const SMAT_SESSION_KEY = 'smat_workbench_session';
export const SMAT_WORKBENCH_STATE_KEY = 'smat_workbench_state_v2';

export const DEFAULT_WORKBENCH_STATE_V2 = Object.freeze({
  version: 2,
  circuit: 'bombeo',
  role: 'kit_wet_end',
  pipe_size: '6x4',
  stress_symptom: '',
  flot_role: 'rotor_estator',
  flot_capacity: '100ft',
  flot_condition: '',
  filt_role: 'placas_telas',
  filt_capacity: '1500',
  filt_condition: '',
  ctrl_role: 'balanza_marcy',
  ctrl_spec: 'marcy_12_rings',
  flow: 180,
  solids: 45,
  d80: 180,
  sg: 2.7,
  ph: 7.0,
  altitude: 2400,
  downtime: 4,
  tcoAlloy: 'A05',
  isOpex: true,
  pump_material: 'alto_cromo_cr27',
  drive_arrangement: 'CV',
  seal_branch: 'expeller_dry',
  b2_mm: 48,
  cap_c_kn: 145,
  claro_mm: 0.75,
  driver_pulley_mm: 220,
  driven_pulley_mm: 340,
  motor_rpm: 1775,
  shaft_power_kw: 55,
  sequence_preset: 'canonical',
  rhop: 1.402,
  lib_um: 100,
  grade: 0.05,
  rr_n: 1.08,
  d95: 0.21,
  p80: 150,
  gy_kg: 0.25,
  name: '',
  company: '',
  phone: '',
  email: '',
  destination: 'Retiro en Almacén Central Durango (Coordinación con Folio)',
  details: '',
  clientRef: '',
  dim_outer_dia: '',
  dim_shaft_bore: '',
  pulpPh: 7.0,
  sealBranch: 'expeller_dry',
  impellerExitWidthMm: 48,
  dynamicCapacityCkN: 145,
  oreDensitySg: 1.402
});

/**
 * Normaliza un objeto de estado parcial o legacy hacia el contrato canónico V2 sin pérdida de campos.
 * @param {Object} [partial={}]
 * @returns {Object}
 */
export function normalizeWorkbenchStateV2(partial = {}) {
  const src = partial && typeof partial === 'object' ? partial : {};
  const kin = src.kinematics && typeof src.kinematics === 'object' ? src.kinematics : {};
  const met = src.metrology && typeof src.metrology === 'object' ? src.metrology : {};
  const ce = src.clearance_eval && typeof src.clearance_eval === 'object' ? src.clearance_eval : {};

  let resolvedPumpMat = src.pump_material || src.wet_material || src.material || src.wetEndMaterial || DEFAULT_WORKBENCH_STATE_V2.pump_material;
  if (resolvedPumpMat === 'hule' || resolvedPumpMat === 'RUBBER') resolvedPumpMat = 'hule_natural';
  else if (resolvedPumpMat === 'PU') resolvedPumpMat = 'poliuretano';
  else if (resolvedPumpMat === 'A05' || resolvedPumpMat === 'cr27') resolvedPumpMat = 'alto_cromo_cr27';

  let resolvedPipe = String(src.pipe_size || src.pipeSize || src.serie || DEFAULT_WORKBENCH_STATE_V2.pipe_size).toLowerCase();
  if (resolvedPipe.includes('d') && !resolvedPipe.includes('1')) {
    resolvedPipe = resolvedPipe.replace(/d$/i, '');
  }

  let cleanDetails = String(src.details ?? DEFAULT_WORKBENCH_STATE_V2.details);
  if (cleanDetails.includes('6X4D') || cleanDetails.includes('A49')) {
    cleanDetails = '';
  }

  const normalized = {
    ...DEFAULT_WORKBENCH_STATE_V2,
    ...src,
    version: 2,
    circuit: String(src.circuit || src.circuito || DEFAULT_WORKBENCH_STATE_V2.circuit),
    role: String(src.role || src.role_id || src.equipo || DEFAULT_WORKBENCH_STATE_V2.role),
    pipe_size: resolvedPipe || '6x4',
    pipeSize: resolvedPipe || '6x4',
    flow: Number(src.flow ?? src.flowM3H ?? DEFAULT_WORKBENCH_STATE_V2.flow) || DEFAULT_WORKBENCH_STATE_V2.flow,
    solids: Number(src.solids ?? src.cw ?? src.solidsWeightPercent ?? met.cw ?? DEFAULT_WORKBENCH_STATE_V2.solids) || DEFAULT_WORKBENCH_STATE_V2.solids,
    d80: Number(src.d80 ?? src.particleSizeD80Microns ?? DEFAULT_WORKBENCH_STATE_V2.d80) || DEFAULT_WORKBENCH_STATE_V2.d80,
    sg: Number(src.sg ?? src.solidsSpecificGravity ?? met.specificGravity ?? DEFAULT_WORKBENCH_STATE_V2.sg) || DEFAULT_WORKBENCH_STATE_V2.sg,
    ph: Number(src.ph ?? src.pulpPh ?? DEFAULT_WORKBENCH_STATE_V2.ph),
    altitude: Number(src.altitude ?? src.altitudeM ?? DEFAULT_WORKBENCH_STATE_V2.altitude),
    downtime: Number(src.downtime ?? DEFAULT_WORKBENCH_STATE_V2.downtime) || DEFAULT_WORKBENCH_STATE_V2.downtime,
    tcoAlloy: String(src.tcoAlloy || DEFAULT_WORKBENCH_STATE_V2.tcoAlloy),
    isOpex: src.isOpex !== undefined ? Boolean(src.isOpex) : DEFAULT_WORKBENCH_STATE_V2.isOpex,
    pump_material: resolvedPumpMat,
    drive_arrangement: String(src.drive_arrangement || src.transmision || kin.arrangement || DEFAULT_WORKBENCH_STATE_V2.drive_arrangement).toUpperCase(),
    seal_branch: String(src.seal_branch || src.sealBranch || ce.sealBranch || DEFAULT_WORKBENCH_STATE_V2.seal_branch),
    b2_mm: Number(src.b2_mm ?? src.impellerExitWidthMm ?? ce.impellerExitWidthMm ?? DEFAULT_WORKBENCH_STATE_V2.b2_mm) || DEFAULT_WORKBENCH_STATE_V2.b2_mm,
    cap_c_kn: Number(src.cap_c_kn ?? src.dynamicCapacityCkN ?? kin.dynamicCapacityCkN ?? DEFAULT_WORKBENCH_STATE_V2.cap_c_kn) || DEFAULT_WORKBENCH_STATE_V2.cap_c_kn,
    claro_mm: Number(src.claro_mm ?? src.frontClearanceMm ?? ce.frontClearanceMm ?? DEFAULT_WORKBENCH_STATE_V2.claro_mm),
    driver_pulley_mm: Number(src.driver_pulley_mm ?? kin.driverPulleyMm ?? DEFAULT_WORKBENCH_STATE_V2.driver_pulley_mm) || DEFAULT_WORKBENCH_STATE_V2.driver_pulley_mm,
    driven_pulley_mm: Number(src.driven_pulley_mm ?? kin.drivenPulleyMm ?? DEFAULT_WORKBENCH_STATE_V2.driven_pulley_mm) || DEFAULT_WORKBENCH_STATE_V2.driven_pulley_mm,
    motor_rpm: Number(src.motor_rpm ?? kin.motorRpm ?? DEFAULT_WORKBENCH_STATE_V2.motor_rpm) || DEFAULT_WORKBENCH_STATE_V2.motor_rpm,
    shaft_power_kw: Number(src.shaft_power_kw ?? kin.shaftPowerKw ?? DEFAULT_WORKBENCH_STATE_V2.shaft_power_kw) || DEFAULT_WORKBENCH_STATE_V2.shaft_power_kw,
    sequence_preset: String(src.sequence_preset || src.assemblySequencePreset || DEFAULT_WORKBENCH_STATE_V2.sequence_preset),
    rhop: Number(src.rhop ?? src.oreDensitySg ?? met.sm ?? met.pulpDensityKgL ?? DEFAULT_WORKBENCH_STATE_V2.rhop) || DEFAULT_WORKBENCH_STATE_V2.rhop,
    lib_um: Number(src.lib_um ?? met.liberationSizeMicrons ?? DEFAULT_WORKBENCH_STATE_V2.lib_um) || DEFAULT_WORKBENCH_STATE_V2.lib_um,
    grade: Number(src.grade ?? met.oreGradeDecimal ?? DEFAULT_WORKBENCH_STATE_V2.grade) || DEFAULT_WORKBENCH_STATE_V2.grade,
    rr_n: Number(src.rr_n ?? met.rosinRammlerSlopeN ?? DEFAULT_WORKBENCH_STATE_V2.rr_n) || DEFAULT_WORKBENCH_STATE_V2.rr_n,
    d95: Number(src.d95 ?? met.topSizeD95Mm ?? DEFAULT_WORKBENCH_STATE_V2.d95) || DEFAULT_WORKBENCH_STATE_V2.d95,
    p80: Number(src.p80 ?? met.targetP80Microns ?? DEFAULT_WORKBENCH_STATE_V2.p80) || DEFAULT_WORKBENCH_STATE_V2.p80,
    gy_kg: Number(src.gy_kg ?? met.dryMassKg ?? met.gySampleMassKg ?? DEFAULT_WORKBENCH_STATE_V2.gy_kg) || DEFAULT_WORKBENCH_STATE_V2.gy_kg,
    details: cleanDetails
  };

  if (Number.isNaN(normalized.ph) || normalized.ph <= 0) normalized.ph = 7.0;
  if (Number.isNaN(normalized.altitude) || normalized.altitude < 0) normalized.altitude = 2400;
  if (Number.isNaN(normalized.claro_mm) || normalized.claro_mm <= 0) normalized.claro_mm = 0.75;

  normalized.pulpPh = normalized.ph;
  normalized.sealBranch = normalized.seal_branch;
  normalized.impellerExitWidthMm = normalized.b2_mm;
  normalized.dynamicCapacityCkN = normalized.cap_c_kn;
  normalized.oreDensitySg = normalized.rhop;

  return normalized;
}

/**
 * Lente Bidireccional Simétrica (Foster et al., 2007 - Combinators for Bidirectional Tree Transformations)
 * Garantiza las leyes algebraicas GetPut y PutGet entre el estado canónico V2, URLSearchParams y Storage.
 */
export const workbenchStateLens = Object.freeze({
  get(state) {
    return normalizeWorkbenchStateV2(state);
  },
  put(state, viewPatch = {}) {
    const base = normalizeWorkbenchStateV2(state);
    if (!viewPatch || typeof viewPatch !== 'object') return base;
    const mappedPatch = { ...viewPatch };
    if (mappedPatch.pipeSize !== undefined && mappedPatch.pipe_size === undefined) mappedPatch.pipe_size = mappedPatch.pipeSize;
    if (mappedPatch.pulpPh !== undefined && mappedPatch.ph === undefined) mappedPatch.ph = mappedPatch.pulpPh;
    if (mappedPatch.sealBranch !== undefined && mappedPatch.seal_branch === undefined) mappedPatch.seal_branch = mappedPatch.sealBranch;
    if (mappedPatch.impellerExitWidthMm !== undefined && mappedPatch.b2_mm === undefined) mappedPatch.b2_mm = mappedPatch.impellerExitWidthMm;
    if (mappedPatch.dynamicCapacityCkN !== undefined && mappedPatch.cap_c_kn === undefined) mappedPatch.cap_c_kn = mappedPatch.dynamicCapacityCkN;
    if (mappedPatch.oreDensitySg !== undefined && mappedPatch.rhop === undefined) mappedPatch.rhop = mappedPatch.oreDensitySg;
    return normalizeWorkbenchStateV2({ ...base, ...mappedPatch });
  },
  toSearchParams(state = {}) {
    const s = normalizeWorkbenchStateV2(state);
    return new URLSearchParams({
      circuito: String(s.circuit),
      equipo: String(s.role),
      serie: String(s.pipe_size),
      flow: String(s.flow),
      cw: String(s.solids),
      d80: String(s.d80),
      sg: String(s.sg),
      ph: String(s.ph),
      material: String(s.pump_material),
      transmision: String(s.drive_arrangement),
      seal_branch: String(s.seal_branch),
      b2_mm: String(s.b2_mm),
      cap_c_kn: String(s.cap_c_kn),
      driver_mm: String(s.driver_pulley_mm),
      driven_mm: String(s.driven_pulley_mm),
      motor_rpm: String(s.motor_rpm),
      power_kw: String(s.shaft_power_kw),
      claro_mm: String(s.claro_mm),
      rhop: String(s.rhop),
      lib_um: String(s.lib_um),
      grade: String(s.grade),
      rr_n: String(s.rr_n),
      p80: String(s.p80),
      d95: String(s.d95),
      gy_kg: String(s.gy_kg)
    });
  },
  fromSearchParams(searchOrParams = '', baseState = {}) {
    const rawStr = typeof searchOrParams === 'string'
      ? searchOrParams
      : (searchOrParams && typeof searchOrParams.toString === 'function' ? searchOrParams.toString() : '');
    const ctx = parseUrlContextParams(rawStr);
    const patch = {};
    if (ctx.circuito) patch.circuit = ctx.circuito;
    if (ctx.equipo) patch.role = ctx.equipo;
    if (ctx.serie) {
      patch.pipe_size = ctx.serie;
      patch.pipeSize = ctx.serie;
    }
    if (ctx.flow !== null) patch.flow = Number(ctx.flow);
    if (ctx.cw !== null || ctx.solids !== null) patch.solids = Number(ctx.cw ?? ctx.solids);
    if (ctx.d80 !== null) patch.d80 = Number(ctx.d80);
    if (ctx.sg !== null) patch.sg = Number(ctx.sg);
    if (ctx.ph !== null) patch.ph = Number(ctx.ph);
    if (ctx.material) patch.pump_material = ctx.material;
    if (ctx.transmision) patch.drive_arrangement = ctx.transmision;
    if (ctx.seal_branch) patch.seal_branch = ctx.seal_branch;
    if (ctx.b2_mm !== null) patch.b2_mm = Number(ctx.b2_mm);
    if (ctx.cap_c_kn !== null) patch.cap_c_kn = Number(ctx.cap_c_kn);
    if (ctx.driver_mm !== null) patch.driver_pulley_mm = Number(ctx.driver_mm);
    if (ctx.driven_mm !== null) patch.driven_pulley_mm = Number(ctx.driven_mm);
    if (ctx.motor_rpm !== null) patch.motor_rpm = Number(ctx.motor_rpm);
    if (ctx.power_kw !== null) patch.shaft_power_kw = Number(ctx.power_kw);
    if (ctx.claro_mm !== null) patch.claro_mm = Number(ctx.claro_mm);
    if (ctx.rhop !== null) patch.rhop = Number(ctx.rhop);
    if (ctx.lib_um !== null) patch.lib_um = Number(ctx.lib_um);
    if (ctx.grade !== null) patch.grade = Number(ctx.grade);
    if (ctx.rr_n !== null) patch.rr_n = Number(ctx.rr_n);
    if (ctx.p80 !== null) patch.p80 = Number(ctx.p80);
    if (ctx.d95 !== null) patch.d95 = Number(ctx.d95);
    if (ctx.gy_kg !== null) patch.gy_kg = Number(ctx.gy_kg);
    return this.put(baseState, patch);
  },
  migrateLegacyStorage() {
    if (typeof window === 'undefined') return normalizeWorkbenchStateV2({});
    let merged = {};
    try {
      if (window.localStorage) {
        window.localStorage.removeItem('smat_workbench_draft');
        window.localStorage.removeItem('smat_workbench_v1');
        const rawV2 = window.localStorage.getItem(SMAT_WORKBENCH_STATE_KEY);
        if (rawV2) merged = { ...merged, ...JSON.parse(rawV2) };
      }
      if (window.sessionStorage) {
        const rawSess = window.sessionStorage.getItem(SMAT_SESSION_KEY);
        if (rawSess) {
          if (rawSess.includes('6X4D') || rawSess.includes('A49')) {
            window.sessionStorage.removeItem(SMAT_SESSION_KEY);
          } else {
            merged = { ...merged, ...JSON.parse(rawSess) };
          }
        }
        const rawCat = window.sessionStorage.getItem('smat_catalog_selected');
        if (rawCat) {
          const parsedCat = JSON.parse(rawCat);
          if (parsedCat && parsedCat.serie) merged.pipe_size = parsedCat.serie;
          window.sessionStorage.removeItem('smat_catalog_selected');
        }
      }
    } catch (_e) { }
    const canonical = normalizeWorkbenchStateV2(merged);
    saveWorkbenchSession(canonical);
    return canonical;
  }
});

/**
 * Guarda el estado del Workbench fusionando claves en sessionStorage y localStorage bajo contrato único V2 (Decisión 1-C+)
 * @param {Object} state 
 */
export function saveWorkbenchSession(state = {}) {
  if (typeof window === 'undefined') return null;
  try {
    const existing = loadWorkbenchSession() || {};
    const mergedRaw = { ...existing, ...state };
    const canonical = normalizeWorkbenchStateV2(mergedRaw);
    const serialized = JSON.stringify(canonical);
    if (window.sessionStorage) {
      window.sessionStorage.setItem(SMAT_SESSION_KEY, serialized);
      window.sessionStorage.setItem(SMAT_WORKBENCH_STATE_KEY, serialized);
    }
    if (window.localStorage) {
      window.localStorage.setItem(SMAT_WORKBENCH_STATE_KEY, serialized);
    }
    return canonical;
  } catch (_e) {
    return null;
  }
}

/**
 * Carga el estado del Workbench desde sessionStorage o localStorage unificado (Decisión 1-C+)
 * @returns {Object|null}
 */
export function loadWorkbenchSession() {
  if (typeof window === 'undefined') return null;
  try {
    const rawSess = window.sessionStorage ? window.sessionStorage.getItem(SMAT_SESSION_KEY) : null;
    const rawLocal = window.localStorage ? window.localStorage.getItem(SMAT_WORKBENCH_STATE_KEY) : null;
    if (!rawSess && !rawLocal) return null;
    const parsedLocal = rawLocal ? JSON.parse(rawLocal) : {};
    const parsedSess = rawSess ? JSON.parse(rawSess) : {};
    return normalizeWorkbenchStateV2({ ...parsedLocal, ...parsedSess });
  } catch (_e) {
    return null;
  }
}

export {
  loadWorkbenchSession as loadWorkbenchState, saveWorkbenchSession as saveWorkbenchState, dispatchLeadWebhook as sendLeadToServer
};


