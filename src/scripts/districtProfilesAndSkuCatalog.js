/**
 * SMAT Minerals - District Profiles, Atomic SKU Catalog & Part Code Decoder (SLICE-V31-05)
 * Extraído por costura limpia LCOM4 desde workbenchBus.js (D8 / DEB-V31-05).
 */
import atomicPartsJson from '../../data/atomic_parts.json' with { type: 'json' };

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
  },
  D075C21: {
    slug: 'camisa_flecha_d075c21',
    role: 'kit_sellado',
    pipe_size: '6x4',
    smat_code: 'SMAT-SEAL-6X4-SLV',
    wall_thickness_mm: 16,
    station_name_es: 'Sellado Centrífugo / Camisa Protectora de Eje',
    station_name_en: 'Centrifugal Seal / Shaft Protection Sleeve',
    assembly_order_note: '04. Camisa Protectora de Flecha D075C21 (Estación 02 • Sin entalla en eje)'
  },
  DAM005: {
    slug: 'cartucho_rodamientos_dam005',
    role: 'kit_rodamientos',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-BRG',
    wall_thickness_mm: 28,
    station_name_es: 'Cartucho Motriz y Rodamientos (ISO 281)',
    station_name_en: 'Drive Cartridge & Bearings (ISO 281)',
    assembly_order_note: '01. Cartucho de Rodamientos DAM005 (Estación 01 • Ajuste Axial)'
  },
  E4132: {
    slug: 'forro_fpl_e4132',
    role: 'kit_wet_end',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-FPL',
    wall_thickness_mm: 26,
    station_name_es: 'Extremo Húmedo Bipartido (Elastómero)',
    station_name_en: 'Split Wet-End Liner (Elastomer)',
    assembly_order_note: '08. Forro de Plato Posterior E4132 (Estación 03 • Hule R55 / PU)'
  },
  D3110: {
    slug: 'voluta_monolitica_d3110',
    role: 'solo_voluta',
    pipe_size: '3x2',
    smat_code: 'SMAT-PUMP-3X2-VOL',
    wall_thickness_mm: 34,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)',
    station_name_en: 'Wet-End Assembly (5-5-4 Lot)',
    assembly_order_note: '10. Voluta Monolítica Alto Cromo D3110 (Estación 03 • Lote 5:5:4)'
  },
  D4018: {
    slug: 'forro_tapa_succion_d4018',
    role: 'solo_voluta',
    pipe_size: '6x4',
    smat_code: 'SMAT-PUMP-6X4-CPL',
    wall_thickness_mm: 30,
    station_name_es: 'Extremo Húmedo Bipartido (Elastómero)',
    station_name_en: 'Split Wet-End Liner (Elastomer)',
    assembly_order_note: '12. Forro de Tapa de Succión CPL D4018 (Estación 03 • Hule R55)'
  },
  D4028: {
    slug: 'expulsor_centrifugo_d4028',
    role: 'kit_sellado',
    pipe_size: '4x3',
    smat_code: 'SMAT-SEAL-4X3-EXP',
    wall_thickness_mm: 20,
    station_name_es: 'Sellado Centrífugo Seco',
    station_name_en: 'Dry Centrifugal Sealing',
    assembly_order_note: '05. Impulsor Expulsor Centrífugo D4028 (Estación 02 • Sello Seco)'
  },
  D4029: {
    slug: 'anillo_expulsor_d4029',
    role: 'kit_sellado',
    pipe_size: '4x3',
    smat_code: 'SMAT-SEAL-4X3-EXR',
    wall_thickness_mm: 22,
    station_name_es: 'Sellado Centrífugo Seco / Cámara de Grasa',
    station_name_en: 'Dry Centrifugal Seal / Grease Chamber',
    assembly_order_note: '06. Anillo Expulsor D4029 (Estación 02 • Laberinto Seco)'
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
    const weightVal = Number(item.weight_kg) || 0;
    const nioshRwlShaftKg = 11.1;
    const nioshLiftingIndexShaft = Number((weightVal / nioshRwlShaftKg).toFixed(2));
    const nioshErgonomicTier = weightVal <= nioshRwlShaftKg
      ? 'MANUAL_1P_SAFE'
      : (weightVal < 23.0 ? 'ASSISTED_SHAFT_MOUNT_2P' : 'HOIST_MANDATORY');
    return [
      key,
      {
        ...item,
        ...extra,
        circuit: 'bombeo',
        max_sphere_mm: item.max_particle_mm,
        station: `S${item.station_number}`,
        handling_mode: item.niosh_handling_mode,
        niosh_rwl_shaft_kg: nioshRwlShaftKg,
        niosh_lifting_index_shaft: nioshLiftingIndexShaft,
        niosh_ergonomic_tier: nioshErgonomicTier
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
  if (slug.includes('dam005') || slug.includes('cartucho') || slug.includes('bearing') || slug.includes('rodamientos')) {
    return {
      code: 'dam005',
      part_number: 'DAM005',
      frame: '6/4 D',
      name_es: 'Cartucho de Rodamientos Completo (Bearing Assembly) 6/4 D',
      name_en: 'Complete Cartridge Bearing Assembly 6/4 D',
      type_es: 'Sub-ensamble Mecánico de Soporte y Eje ISO 281',
      type_en: 'Mechanical Shaft & Bearing Housing Sub-assembly ISO 281',
      metallurgy: 'Acero Aleado SAE 4140 + Hierro Dúctil GGG40 + Sellos de Laberinto Purgante',
      hardness: 'Eje bonificado 280–320 HB / Pistas 60–62 HRC',
      vanes: 0,
      weight_kg: 54.0,
      impeller_diameter_mm: 380,
      max_particle_mm: 45,
      max_sphere_mm: 45,
      wall_thickness_mm: 28,
      station_number: 1,
      station: 'S1',
      station_name_es: 'Cartucho Motriz y Rodamientos (ISO 281)',
      station_name_en: 'Drive Cartridge & Bearings (ISO 281)',
      assembly_order: '01. Cartucho de Rodamientos / Bearing Assembly (Estación 01)',
      assembly_order_note: '01. Cartucho de Rodamientos / Bearing Assembly (Estación 01 • Ajuste Axial)',
      wet_end_kit_ratio: '1:1',
      niosh_handling_mode: 'HOIST_REQUIRED',
      handling_mode: 'HOIST_REQUIRED',
      niosh_rwl_shaft_kg: 11.1,
      niosh_lifting_index_shaft: 4.86,
      niosh_ergonomic_tier: 'HOIST_MANDATORY',
      circuit: 'bombeo',
      pipe_size: '6x4',
      role: 'kit_rodamientos',
      smat_code: 'SMAT-PUMP-6X4-BRG'
    };
  }
  if (slug.includes('e4132') || slug.includes('forro') || slug.includes('fpl_liner')) {
    return {
      ...ATOMIC_PARTS_CATALOG.E4083,
      code: 'e4132',
      part_number: 'E4132',
      name_es: 'Forro de Plato (FPL Liner) en Hule / Poliuretano 6/4 D',
      name_en: 'Frame Plate Liner (FPL) in Rubber / Polyurethane 6/4 D',
      weight_kg: 9.8,
      station_number: 3,
      station: 'S3',
      niosh_handling_mode: 'MANUAL_SAFE',
      handling_mode: 'MANUAL_SAFE',
      niosh_rwl_shaft_kg: 11.1,
      niosh_lifting_index_shaft: 0.88,
      niosh_ergonomic_tier: 'MANUAL_SAFE_1P'
    };
  }
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
 * Evalúa y formatea los 3 niveles ergonómicos Waters-NIOSH 1993 para montaje horizontal en eje
 * en voladizo (H = 42 cm -> RWL_shaft = 11.1 kg) vs traslado estándar (RWL_std = 23.0 kg) (Decisión 4 / INV-SMAT-SCI-27).
 * @param {Object|number} specOrWeight - Objeto de ficha atómica o masa en kg
 * @param {'es'|'en'} [lang='es']
 */
export function formatNioshErgonomicStatus(specOrWeight = {}, lang = 'es') {
  const isEs = lang !== 'en';
  const weightKg = typeof specOrWeight === 'number'
    ? Number(specOrWeight)
    : Number(specOrWeight?.weight_kg ?? specOrWeight?.peso_kg ?? 0);
  const rwlShaftKg = 11.1;
  const rwlStdKg = 23.0;
  const safeWeight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  const liShaft = Number((safeWeight / rwlShaftKg).toFixed(2));

  if (safeWeight >= rwlStdKg) {
    const badgeEs = `${safeWeight.toFixed(1)} kg (Polipasto ≥23 kg • LI_eje=${liShaft.toFixed(2)})`;
    const badgeEn = `${safeWeight.toFixed(1)} kg (Hoist ≥23 kg • LI_shaft=${liShaft.toFixed(2)})`;
    return {
      mode: 'HOIST_REQUIRED',
      tier: 'HOIST_REQUIRED',
      hoistRequired: true,
      twoPersonAssistRequired: false,
      weightKg: safeWeight,
      rwlShaftKg,
      liShaft,
      liftingIndexShaft: liShaft,
      cssTone: 'danger',
      badgeEs,
      badgeEn,
      badgeText: isEs ? badgeEs : badgeEn,
      detailText: isEs
        ? `Requiere Polipasto / Grúa (≥ 23 kg NIOSH • LI_eje=${liShaft.toFixed(2)} vs RWL_eje=${rwlShaftKg} kg)`
        : `Mechanical Hoist Required (≥ 23 kg NIOSH • LI_shaft=${liShaft.toFixed(2)} vs RWL_shaft=${rwlShaftKg} kg)`
    };
  }

  if (safeWeight > rwlShaftKg) {
    const badgeEs = `${safeWeight.toFixed(1)} kg (Montaje Asistido 2P 11.1–23 kg • LI_eje=${liShaft.toFixed(2)} vs 11.1 kg)`;
    const badgeEn = `${safeWeight.toFixed(1)} kg (2-Tech Shaft Mount 11.1–23 kg • LI_shaft=${liShaft.toFixed(2)} vs 11.1 kg)`;
    return {
      mode: 'ASSISTED_SHAFT_MOUNT_2P',
      tier: 'ASSISTED_SHAFT_MOUNT_2P',
      hoistRequired: false,
      twoPersonAssistRequired: true,
      weightKg: safeWeight,
      rwlShaftKg,
      liShaft,
      liftingIndexShaft: liShaft,
      cssTone: 'warning',
      badgeEs,
      badgeEn,
      badgeText: isEs ? badgeEs : badgeEn,
      detailText: isEs
        ? `Montaje en Flecha Asistido 2 Técnicos (< 23 kg NIOSH • LI_eje=${liShaft.toFixed(2)} vs RWL_eje=${rwlShaftKg} kg @ H=42 cm)`
        : `2-Technician Assisted Shaft Mount (< 23 kg NIOSH • LI_shaft=${liShaft.toFixed(2)} vs RWL_shaft=${rwlShaftKg} kg @ H=42 cm)`
    };
  }

  const badgeEs = `${safeWeight.toFixed(1)} kg (Manual 1P Seguro ≤11.1 kg • LI_eje=${liShaft.toFixed(2)})`;
  const badgeEn = `${safeWeight.toFixed(1)} kg (1-Tech Manual Safe ≤11.1 kg • LI_shaft=${liShaft.toFixed(2)})`;
  return {
    mode: 'MANUAL_SAFE_1P',
    tier: 'MANUAL_SAFE_1P',
    hoistRequired: false,
    twoPersonAssistRequired: false,
    weightKg: safeWeight,
    rwlShaftKg,
    liShaft,
    liftingIndexShaft: liShaft,
    cssTone: 'safe',
    badgeEs,
    badgeEn,
    badgeText: isEs ? badgeEs : badgeEn,
    detailText: isEs
      ? `Manejo Manual Seguro 1 Técnico (< 23 kg NIOSH • LI_eje=${liShaft.toFixed(2)} ≤ RWL_eje=${rwlShaftKg} kg)`
      : `1-Technician Safe Manual Handling (< 23 kg NIOSH • LI_shaft=${liShaft.toFixed(2)} ≤ RWL_shaft=${rwlShaftKg} kg)`
  };
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
    flot_condition: null,
    filt_condition: null,
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
    else if (params.has('drive_arr')) result.transmision = params.get('drive_arr').toUpperCase();
    if (result.transmision) result.drive_arr = result.transmision;

    if (params.has('flot_condition')) result.flot_condition = params.get('flot_condition');
    if (params.has('filt_condition')) result.filt_condition = params.get('filt_condition');

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


export function formatSapPlaintextImpl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const date = data.date || new Date().toISOString().split('T')[0];
  const requester = data.contact_name || data.name || 'Ingeniería / Residente';
  const company = data.company_name || data.company || 'Unidad Minera / Empresa';
  const phoneVal = data.phone_number || data.phone || '';
  const emailVal = data.email_address || data.email || '';
  const contact = phoneVal ? `${phoneVal} • ${emailVal}` : (emailVal || 'N/A');
  const logisticsLabels = { retiro: 'Retiro en Almacén Central Durango (Coordinación con Folio)', fletera: 'Fletera Consolidada Nacional (Ocurre en Destino)', dedicado: 'Flete Dedicado Directo / Enlace Multimodal a Mina' };
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
  const rawLookupCode = data.atomic_code || data.code || data.codigo || '';
  const ps = data.part_specs || (rawLookupCode ? getAtomicPartSpecs(rawLookupCode, data.series || data.pipe_size || '6x4') : {});
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
    const nioshEval = formatNioshErgonomicStatus(wKg, 'es');
    lines.push(`   - Masa Unitaria / Izaje:      ${wKg.toFixed(1)} kg (${nioshEval.detailText} • [${nioshEval.tier}])`);
  }
  if (resolvedClaro) {
    const lossStr = resolvedDeltaEta !== undefined ? ` | Pérdida Recirculación Δη_v: ${resolvedDeltaEta}%` : '';
    const pipeLossVal = data.pipe_vel_loss_pct !== undefined ? data.pipe_vel_loss_pct : ce.pipeVelocityMarginLossPct;
    const pipeLossStr = pipeLossVal !== undefined && pipeLossVal !== '' ? ` | Δv_tubería = -${pipeLossVal}%` : '';
    lines.push(`   - Calibración Claro Axial δ:  ${resolvedClaro} mm${lossStr}${pipeLossStr}`);
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
      bomba_skid: 'Bomba centrífuga para lodos sobre base estructural con motor acoplado',
      celdas_flotacion: 'Batería de mecanismos de flotación',
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
    if (metrics.head_ratio !== undefined) lines.push(`   - Factor Derating (HR / ηr): ${metrics.head_ratio} / Er (Cave): ${metrics.eff_ratio_er || data.eff_ratio_er || '0.84'}`);
    if (metrics.impeller_life_h !== undefined || data.impeller_life_h !== undefined) {
      lines.push(`   - Vida Estimada Impulsor:    ${metrics.impeller_life_h || data.impeller_life_h} h (${metrics.wear_life_ratio || data.wear_life_ratio || '3.8'}x vs Fierro Gris)`);
    }
    if (metrics.critical_velocity_ms !== undefined) lines.push(`   - Velocidad Límite Durand:   ${metrics.critical_velocity_ms} m/s (Evita arenamiento)`);
    if (metrics.altitude_msnm !== undefined) {
      const patm = metrics.p_atm_mca || data.p_atm_mca || '7.66';
      const dnpsh = metrics.delta_npsh_m || data.delta_npsh_m || '2.67';
      const fIec = metrics.motor_derating_iec || data.motor_derating_iec || '0.860';
      const kAlt = metrics.k_motor_alt || data.k_motor_alt || '1.38';
      lines.push(`   - Altitud y Pinza Térmica:   ${metrics.altitude_msnm} msnm (Patm=${patm} mca, -ΔNPSHa=${dnpsh} m, IEC=${fIec}, K_motor,alt = ${kAlt}x)`);
    }
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
  lines.push(`   - Verificación de concentricidad y plantilla maestra 1:1 en Almacén Central Durango.`);
  lines.push(`   - Verificación metrológica de acople dimensional 1:1 y Dureza Metalúrgica Certificada.`);
  lines.push(`   - Validación preliminar de compatibilidad según datos de laboratorio vinculada a la cotización formal.`);
  lines.push(`   - Ensambles completos configurados sobre pedido; refacciones con rotación continua.`);
  lines.push(`   - Despacho nacional desde Almacén Central Durango: (618) 810-4408 | ventas@smatminerals.com`);
  lines.push(`=================================================================`);
  return lines.join('\n');
}
export function formatMailtoUrlImpl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const company = data.company_name || data.company || 'Unidad Minera';
  const partName = data.part_name || data.role || 'Refaccionamiento Minero';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const targetEmail = data.target_email || data.email_address || 'ventas@smatminerals.com';
  const subject = `[Requisición ${folio}] [${smatCode}] ${company} - ${partName}`;
  const body = formatSapPlaintextImpl(data);
  return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
export function formatWhatsappUrlImpl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const requester = data.contact_name || data.name || 'Ingeniero Solicitante';
  const company = data.company_name || data.company || 'Empresa';
  const phoneContact = data.phone_number || data.phone || '';
  const partName = data.part_name || data.role || 'Refacción de Bomba';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const atomicCode = data.atomic_code || '';
  const circuit = (data.circuit || 'BOMBEO').toUpperCase();
  const priorityTag = data.isOpex === false ? '[PROYECTO DE PLANTA]' : '[PARO DE PLANTA]';
  const rawLookupCode = data.atomic_code || data.code || data.codigo || '';
  const ps = data.part_specs || (rawLookupCode ? getAtomicPartSpecs(rawLookupCode, data.series || data.pipe_size || '6x4') : {});
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
export function buildCanonicalEngineeringSnapshotImpl(d = {}) {
  const m = d.metrics || {};
  const tco = d.tco || {};
  const ps = d.part_specs || {};
  const ce = d.clearance_eval || {};
  const kin = d.kinematics || {};
  const met = d.metrology || {};
  const gate = d.gate_eval || {};
  const measures = (d.dim_outer_dia || d.dim_shaft_bore)
    ? `DE ~${d.dim_outer_dia || 'N/A'} mm | Barreno/Flecha ~${d.dim_shaft_bore || 'N/A'} mm`
    : (d.medidas || '');
  const flowM3h = m.flow_m3h ?? d.flow_m3h ?? 180;
  const solidsCw = m.solids_cw ?? d.solids_cw ?? 45;
  const d80Um = m.d80_um ?? d.d80_um ?? 180;
  const slurrySg = m.slurry_sg ?? d.slurry_sg ?? '1.40';
  const solidsCv = d.cv ?? d.solidsVolumetricPercent ?? m.solids_cv ?? '23.3';
  const critVel = m.critical_velocity_ms ?? d.critical_velocity_ms ?? '2.35';
  const safeVel = d.v_rec ?? d.recommendedPipeVelocityMs ?? m.safe_velocity_ms ?? '2.82';
  const durandFl = d.fl ?? d.durandFactorFL ?? m.durand_fl ?? '1.08';
  const headRatio = m.head_ratio ?? d.headDeratingFactorHr ?? '0.88';
  const effRatio = d.eff_ratio_er ?? m.eff_ratio_er ?? d.effDeratingFactorEr ?? '0.84';
  const impellerLifeH = d.impeller_life_h ?? m.impeller_life_h ?? d.estimatedImpellerLifeHours ?? 1850;
  const wearLifeRatio = d.wear_life_ratio ?? m.wear_life_ratio ?? d.wearLifeRatio ?? '3.8';
  const altitudeMsnm = m.altitude_msnm ?? d.altitude_msnm ?? d.altitudeM ?? 2200;
  const pAtmMca = d.p_atm_mca ?? m.p_atm_mca ?? d.pAtmHeadMca ?? Number(Math.max(5.0, 10.33 - (Number(altitudeMsnm) / 900)).toFixed(2));
  const deltaNpshM = d.delta_npsh_m ?? m.delta_npsh_m ?? d.deltaNpshLossM ?? Number((10.33 - Number(pAtmMca)).toFixed(2));
  const motorDeratingIec = d.motor_derating_iec ?? m.motor_derating_iec ?? d.motorDeratingFactor ?? (Number(altitudeMsnm) > 1000 ? Number(Math.max(0.70, 1.0 - ((Number(altitudeMsnm) - 1000) / 10000)).toFixed(3)) : 1.0);
  const kMotorAlt = d.k_motor_alt ?? m.k_motor_alt ?? d.combinedMotorAltitudeMultiplier ?? Number((1.0 / Math.max(0.25, Number(effRatio) * Number(motorDeratingIec))).toFixed(3));
  const recAlloy = m.recommended_alloy || d.recommended_alloy || 'High Chrome A05 (>650 HB)';
  const hydraulicsStr = (m.flow_m3h !== undefined || m.slurry_sg !== undefined || d.hidraulica)
    ? (d.hidraulica || `Q: ${flowM3h} m³/h | Cw: ${solidsCw}% (d80: ${d80Um} µm) | Sm: ${slurrySg} kg/L (${solidsCv}% Cv) | Vc: ${critVel} m/s | HR: ${headRatio} | ηr: ${effRatio} | Vida: ${impellerLifeH}h (${wearLifeRatio}x) | ${recAlloy}`)
    : '';
  const tcoTons = tco.tco_tons_at_risk !== undefined ? tco.tco_tons_at_risk : m.tco_tons_at_risk;
  const tcoHrs = tco.tco_downtime_hrs !== undefined ? tco.tco_downtime_hrs : m.tco_downtime_hrs;
  const tcoSummary = tco.tco_summary || m.tco_summary || '';
  const tcoStr = (tcoTons !== undefined || tcoSummary)
    ? `~${tcoTons || 0} ton en riesgo (${tcoHrs || 4}h) | ${tcoSummary}`
    : (d.tco_str || '');
  const resolvedMat = d.material || d.wet_material || d.pump_material || '';
  const resolvedDrive = d.transmision || d.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedStation = d.estacion || d.station_number || d.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = d.peso_kg || d.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = d.claro_mm !== undefined ? d.claro_mm : (d.front_clearance_mm ?? ce.frontClearanceMm ?? '');
  const resolvedDeltaEta = d.delta_eta_v !== undefined ? d.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct);
  const resolvedPipeVelLoss = d.pipe_vel_loss_pct !== undefined ? d.pipe_vel_loss_pct : (ce.pipeVelocityMarginLossPct ?? '');
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
  const phVal = (d.ph !== undefined && d.ph !== '') ? d.ph : ((d.pulpPh !== undefined && d.pulpPh !== '') ? d.pulpPh : m.pulp_ph);
  const sealBranch = d.seal_branch || d.sealBranch || ce.sealBranch || '';
  const b2Mm = d.b2_mm || d.impellerExitWidthMm || ce.impellerExitWidthMm || '';
  const capCKn = d.cap_c_kn || d.dynamicCapacityCkN || kin.dynamicCapacityCkN || '';
  const rhopVal = d.rhop ?? d.oreDensitySg ?? met.sm ?? met.pulpDensityKgL;
  const gateClass = d.gate_classification || gate.classification || 'PRIORITY_MINING_PLANT';
  const trustBoundaryId = d.trust_boundary_id || gate.activeTrustBoundaryId || '';
  return {
    folio: d.folio || 'SMAT-2026-RFQ',
    urgencia: d.isOpex === false ? 'proyecto' : 'paro',
    puerta_interna: resolveInternalBudgetCategory(d),
    nombre: d.name || d.contact_name || d.nombre || '',
    empresa: d.company || d.company_name || d.empresa || '',
    telefono: d.phone || d.phone_number || d.telefono || '',
    correo: d.email || d.email_address || d.correo || '',
    equipo: d.part_name || d.role || d.equipo || '',
    codigo: d.smat_code || d.codigo || generateSmatPartCode(d),
    pieza: d.atomic_code || d.pieza || d.part_slug || '',
    ref_cliente: d.client_reference || d.ref_cliente || '',
    medidas: measures,
    perfil_pulpa: d.pulp_profile || d.perfil_pulpa || '',
    hidraulica: hydraulicsStr,
    tco: tcoStr,
    material: resolvedMat ? String(resolvedMat) : '',
    transmision: resolvedDrive ? String(resolvedDrive) : '',
    estacion: resolvedStation ? String(resolvedStation) : '',
    peso_kg: resolvedWeight !== '' && resolvedWeight !== undefined ? Number(resolvedWeight) : '',
    claro_mm: resolvedClaro !== '' && resolvedClaro !== undefined ? Number(resolvedClaro) : '',
    delta_eta_v: resolvedDeltaEta !== undefined && resolvedDeltaEta !== '' ? Number(resolvedDeltaEta) : '',
    pipe_vel_loss_pct: resolvedPipeVelLoss !== undefined && resolvedPipeVelLoss !== '' ? Number(resolvedPipeVelLoss) : '',
    u2_ms: resolvedU2 !== '' && resolvedU2 !== undefined ? Number(resolvedU2) : '',
    n2_rpm: resolvedPumpRpm !== '' && resolvedPumpRpm !== undefined ? Number(resolvedPumpRpm) : '',
    fr_kn: resolvedFrKn !== undefined && resolvedFrKn !== '' ? Number(resolvedFrKn) : '',
    inmunidad_sumidero: resolvedFlood ? String(resolvedFlood) : '',
    razon_estructural: resolvedStructural ? String(resolvedStructural) : '',
    l10h: resolvedL10h !== '' && resolvedL10h !== undefined ? Number(resolvedL10h) : '',
    metrologia: resolvedMetrology ? String(resolvedMetrology) : '',
    ph: phVal !== undefined && phVal !== '' ? Number(phVal) : '',
    seal_branch: sealBranch ? String(sealBranch) : '',
    b2_mm: b2Mm !== '' && b2Mm !== undefined ? Number(b2Mm) : '',
    cap_c_kn: capCKn !== '' && capCKn !== undefined ? Number(capCKn) : '',
    fl: (d.fl !== undefined || d.durandFactorFL !== undefined || m.durand_fl !== undefined) ? Number(durandFl) : '',
    cv: (d.cv !== undefined || d.solidsVolumetricPercent !== undefined || m.solids_cv !== undefined) ? Number(solidsCv) : '',
    v_rec: (d.v_rec !== undefined || d.recommendedPipeVelocityMs !== undefined || m.safe_velocity_ms !== undefined) ? Number(safeVel) : '',
    rhop: rhopVal !== undefined ? Number(rhopVal) : '',
    lib_um: met.liberationSizeMicrons !== undefined ? Number(met.liberationSizeMicrons) : (d.lib_um !== undefined ? Number(d.lib_um) : ''),
    grade: (met.headGradePercent !== undefined || met.oreGradeDecimal !== undefined) ? Number(met.headGradePercent ?? met.oreGradeDecimal) : (d.grade !== undefined ? Number(d.grade) : ''),
    air_psi: met.airPressurePsi !== undefined ? Number(met.airPressurePsi) : (d.air_psi !== undefined ? Number(d.air_psi) : ''),
    gy_c: met.samplingConstantC !== undefined ? Number(met.samplingConstantC) : (d.gy_c !== undefined ? Number(d.gy_c) : ''),
    gy_err: met.relativeErrorSigma !== undefined ? Number(met.relativeErrorSigma) : (d.gy_err !== undefined ? Number(d.gy_err) : ''),
    rr_n: met.rosinRammlerSlopeN !== undefined ? Number(met.rosinRammlerSlopeN) : (d.rr_n !== undefined ? Number(d.rr_n) : ''),
    ret_p80: met.retainedPercentAtP80 !== undefined ? Number(met.retainedPercentAtP80) : (d.ret_p80 !== undefined ? Number(d.ret_p80) : ''),
    eff_ratio_er: Number(effRatio),
    impeller_life_h: Number(impellerLifeH),
    wear_life_ratio: Number(wearLifeRatio),
    p_atm_mca: Number(pAtmMca),
    delta_npsh_m: Number(deltaNpshM),
    motor_derating_iec: Number(motorDeratingIec),
    k_motor_alt: Number(kMotorAlt),
    gate_classification: String(gateClass),
    trust_boundary_id: String(trustBoundaryId),
    detalles: d.details || d.detalles || '',
    destino: d.destination || d.destino || ''
  };
}
export function buildAcuseUrlParams(d = {}) {
  const snap = buildCanonicalEngineeringSnapshotImpl(d);
  const paramsObj = {
    folio: snap.folio,
    nombre: snap.nombre,
    empresa: snap.empresa,
    telefono: snap.telefono,
    correo: snap.correo,
    equipo: snap.equipo,
    codigo: snap.codigo,
    detalles: snap.detalles,
    destino: snap.destino,
    urgencia: snap.urgencia
  };
  const optionalKeys = [
    'pieza', 'material', 'transmision', 'estacion', 'peso_kg',
    'claro_mm', 'delta_eta_v', 'pipe_vel_loss_pct', 'u2_ms', 'n2_rpm',
    'fr_kn', 'inmunidad_sumidero', 'razon_estructural', 'l10h', 'metrologia',
    'ref_cliente', 'medidas', 'perfil_pulpa', 'hidraulica', 'tco',
    'ph', 'seal_branch', 'b2_mm', 'cap_c_kn', 'fl', 'cv', 'v_rec',
    'rhop', 'lib_um', 'grade', 'air_psi', 'gy_c', 'gy_err', 'rr_n', 'ret_p80',
    'eff_ratio_er', 'impeller_life_h', 'wear_life_ratio',
    'p_atm_mca', 'delta_npsh_m', 'motor_derating_iec', 'k_motor_alt',
    'gate_classification', 'trust_boundary_id'
  ];
  for (const key of optionalKeys) {
    if (snap[key] !== undefined && snap[key] !== '') {
      paramsObj[key] = String(snap[key]);
    }
  }
  return new URLSearchParams(paramsObj);
}
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
export function buildLeadWebhookPayload(d = {}, channelOrigin = 'web_quote_wizard') {
  const honeypotVal = d.website || d.website_honeypot || '';
  const snap = buildCanonicalEngineeringSnapshotImpl(d);
  return {
    ...snap,
    codigo_smat: snap.codigo,
    atomic_code: snap.pieza,
    codigo_pieza_atomica: snap.pieza,
    referencia_cliente: snap.ref_cliente,
    medidas_flexometro: snap.medidas,
    perfil_pulpa_mina: snap.perfil_pulpa,
    memoria_hidraulica: snap.hidraulica,
    memoria_hidraulica_durand: snap.hidraulica,
    tco_resumen: snap.tco,
    proyeccion_tco: snap.tco,
    material_bombeo: snap.material,
    material_wet_end: snap.material,
    arreglo_transmision: snap.transmision,
    estacion_armado: snap.estacion,
    estacion_despiece: snap.estacion,
    peso_pieza_kg: snap.peso_kg,
    claro_axial_mm: snap.claro_mm,
    perdida_eficiencia_vol_pct: snap.delta_eta_v,
    velocidad_periferica_u2_ms: snap.u2_ms,
    velocidad_punta_u2_ms: snap.u2_ms,
    rpm_bomba_n2: snap.n2_rpm,
    carga_radial_fr_kn: snap.fr_kn,
    dictamen_estructural: snap.razon_estructural,
    vida_rodamiento_l10h: snap.l10h,
    memoria_metrologica: snap.metrologia,
    cedula_metrologia: snap.metrologia,
    derating_eficiencia_er: snap.eff_ratio_er,
    vida_estimada_impulsor_h: snap.impeller_life_h,
    perdida_npsh_altitud_m: snap.delta_npsh_m,
    derating_motor_iec: snap.motor_derating_iec,
    multiplicador_motor_altitud: snap.k_motor_alt,
    perdida_margen_vc_pct: snap.pipe_vel_loss_pct,
    clasificacion_compuerta: snap.gate_classification,
    especificacion_tecnica: snap.detalles,
    destino: snap.destino || 'Durango',
    modalidad_logistica: snap.destino || 'Durango',
    canal: channelOrigin,
    website: honeypotVal
  };
}
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

