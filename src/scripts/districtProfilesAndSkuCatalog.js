/**
 * SMAT Minerals - District Profiles, Atomic SKU Catalog & Part Code Decoder (SLICE-V31-05 / SLICE-V34-11)
 * Extraído por costura limpia LCOM4 desde workbenchBus.js (D8 / DEB-V31-05 / DEB-V34-07).
 */
import atomicPartsJson from '../../data/atomic_parts.json' with { type: 'json' };
import { getQuickProductBySlugOrAlias } from './quickProductsCatalog.js';

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
        niosh_ergonomic_tier: nioshErgonomicTier,
        everyday_equivalence_es: item.everyday_equivalence_es || '',
        everyday_equivalence_en: item.everyday_equivalence_en || '',
        kit_ids: Array.isArray(item.kit_ids) ? item.kit_ids : [],
        physical_stock_durango_units: Number(item.physical_stock_durango_units) || 0,
        unit_replacement_value_mxn: Number(item.unit_replacement_value_mxn) || 0,
        physical_audit_date: item.physical_audit_date || '2026-11-10',
        warehouse_total_mxn: Number(item.warehouse_total_mxn) || 1646850,
        warehouse_total_units: Number(item.warehouse_total_units) || 383
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
      frame: '6x4',
      name_es: 'Cartucho de Rodamientos Completo (Bearing Assembly) 6x4',
      name_en: 'Complete Cartridge Bearing Assembly 6x4',
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
      name_es: 'Forro de Plato (FPL Liner) en Hule / Poliuretano 6x4',
      name_en: 'Frame Plate Liner (FPL) in Rubber / Polyurethane 6x4',
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
  if (slug.includes('hidrociclon') || slug.includes('apex') || slug.includes('vortex') || slug.includes('cyc')) {
    return {
      code: 'cyc_apex_sic',
      part_number: 'CYC-APEX-SIC',
      frame: 'D10-D20',
      name_es: 'Boquilla Ápex y Vortex Finder para Hidrociclón D6–D20 en Carburo de Silicio (SiC)',
      name_en: 'Sintered Silicon Carbide (SiC) Hydrocyclone Apex Spigot & Vortex Finder D6–D20',
      type_es: 'Zona Crítica de Corte Hidrodinámico #02/#05 (Plitt d50c)',
      type_en: 'Critical Hydrodynamic Cut Zone #02/#05 (Plitt d50c)',
      metallurgy: 'Carburo de Silicio Sinterizado SiC (≥ 2200 HV) / Alto Cromo A05 / Poliuretano U01',
      hardness: '≥ 2200 HV (Mohs 9.2) / 85 Shore A',
      vanes: 0,
      weight_kg: 4.2,
      impeller_diameter_mm: 254,
      max_particle_mm: 12,
      max_sphere_mm: 12,
      wall_thickness_mm: 25,
      station_number: 5,
      station: 'Z5',
      station_name_es: 'Zona 05: Boquilla Ápex / Spigot Anticordón (Cv,u ≤ 52%)',
      station_name_en: 'Zone 05: Anti-Roping Apex / Spigot Insert (Cv,u ≤ 52%)',
      assembly_order: '05. Boquilla Ápex Monolítica SiC y Camisa Porta-Ápex (Zona 05)',
      assembly_order_note: '05. Boquilla Ápex Monolítica SiC (Zona 05 • Escalón δ_r ≤ 0.76 mm)',
      wet_end_kit_ratio: '2:1',
      niosh_handling_mode: 'MANUAL_SAFE',
      handling_mode: 'MANUAL_SAFE',
      niosh_rwl_shaft_kg: 11.1,
      niosh_lifting_index_shaft: 0.38,
      niosh_ergonomic_tier: 'MANUAL_1P_SAFE',
      circuit: 'clasificacion',
      pipe_size: 'D15',
      role: 'hidrociclon_apex_vortex',
      smat_code: 'SMAT-CYC-D15-APEX'
    };
  }
  if (slug.includes('malla_criba') || slug.includes('th48') || slug.includes('criba') || slug.includes('screen') || slug.includes('mod-1x1')) {
    return {
      code: 'scr_th48_30',
      part_number: 'SCR-TH48-30',
      frame: '48x30',
      name_es: 'Malla Fina de Poliuretano TH48-30 / Panel Modular 1\'x1\' con Alivio Cónico 3°–5°',
      name_en: 'TH48-30 Fine Urethane Screen Mat / 1\'x1\' Modular Panel with 3°–5° Relief Angle',
      type_es: 'Panel Elastómero de Cribado de Alta Frecuencia (Weibull α ≥ 4.2)',
      type_en: 'High-Frequency Elastomer Screening Deck Panel (Weibull α ≥ 4.2)',
      metallurgy: 'Poliuretano Colado U01 (85 Shore A) con Cuerdas de Aramida',
      hardness: '85 ± 3 Shore A',
      vanes: 0,
      weight_kg: 9.5,
      impeller_diameter_mm: 305,
      max_particle_mm: 25,
      max_sphere_mm: 25,
      wall_thickness_mm: 30,
      station_number: 3,
      station: 'A3',
      station_name_es: 'Avenida 03: Cama de Cribado y Desaguado sin Cegamiento',
      station_name_en: 'Avenue 03: Non-Blinding Screening & Dewatering Deck',
      assembly_order: '03. Malla Tensada TH48-30 / Módulo 1\'x1\' Pin y Camisa',
      assembly_order_note: '03. Malla Tensada TH48-30 (Alivio troncocónico θ = 3°–5°)',
      wet_end_kit_ratio: '1:1',
      niosh_handling_mode: 'MANUAL_SAFE',
      handling_mode: 'MANUAL_SAFE',
      niosh_rwl_shaft_kg: 11.1,
      niosh_lifting_index_shaft: 0.86,
      niosh_ergonomic_tier: 'MANUAL_1P_SAFE',
      circuit: 'clasificacion',
      pipe_size: 'TH48-30',
      role: 'malla_criba_poliuretano',
      smat_code: 'SMAT-SCR-TH48-30'
    };
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
    sku: null,
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
    else if (params.has('mat')) result.material = params.get('mat');

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
    else if (params.has('failure')) result.falla = params.get('failure');

    if (params.has('circuito')) result.circuito = params.get('circuito');
    else if (params.has('circuit')) result.circuito = params.get('circuit');

    const rawSku = params.get('sku') || params.get('sku_id');
    if (rawSku) {
      const resolvedSku = getQuickProductBySlugOrAlias(rawSku);
      if (resolvedSku) {
        result.sku = resolvedSku.id;
        if (!result.circuito) {
          const catMap = {
            lab: 'control_procesos',
            pumping: 'bombeo',
            classification: 'clasificacion',
            filtration: 'filtracion',
            flotation: 'flotacion'
          };
          result.circuito = catMap[resolvedSku.category_id] || resolvedSku.vertical || 'bombeo';
        }
        if (!result.equipo) {
          const skuRoleMap = {
            'SMAT-PUMP-WETKIT-554': 'kit_wet_end',
            'SMAT-PUMP-IMP-AH': 'solo_impulsor',
            'SMAT-PUMP-LINERS-AH': 'solo_voluta',
            'SMAT-PUMP-EXPELLER-KIT': 'kit_sellado',
            'SMAT-PUMP-BRG-005M': 'kit_rodamientos',
            'SMAT-COUPLED-PUMP-CYC': 'skid_bomba',
            'SMAT-CYC-D6-D20': 'hidrociclon_apex_vortex',
            'SMAT-SCR-TH48-30': 'malla_criba_poliuretano',
            'SMAT-SCR-MOD-1X1': 'malla_criba_poliuretano',
            'SMAT-FILT-CLOTH-PLATE': 'placas_telas',
            'SMAT-FILT-SHIFTER-CHAIN': 'placas_telas',
            'SMAT-FLOT-MECH-18SP': 'celda_flotacion',
            'SMAT-LAB-MARCY-1000': 'balanza_marcy',
            'SMAT-LAB-VASO-1000': 'balanza_marcy',
            'SMAT-LAB-TAMIZ-E11': 'tamices_laboratorio',
            'SMAT-LAB-ROTAP-MECH': 'tamices_laboratorio',
            'SMAT-LAB-PULV-DISC': 'balanza_marcy',
            'SMAT-LAB-PLATO-TENT': 'balanza_marcy',
            'SMAT-LAB-FILTRO-BATCH': 'filtro_batch_lab',
            'SMAT-LAB-FILTER-LPLT': 'filtro_batch_lab',
            'SMAT-LAB-FILTER-BARREL': 'filtro_batch_lab',
            'SMAT-LAB-FILTER-SPARES': 'filtro_batch_lab',
            'SMAT-LAB-BOND-JAR': 'filtro_batch_lab'
          };
          result.equipo = skuRoleMap[resolvedSku.id] || (resolvedSku.id.startsWith('SMAT-LAB-') ? 'balanza_marcy' : 'kit_wet_end');
        }
        if (!result.rol) {
          result.rol = result.equipo;
        }
        if (!result.material && (params.get('mat') || params.get('material') || resolvedSku.default_material)) {
          result.material = params.get('mat') || params.get('material') || resolvedSku.default_material || null;
        }
        if (!params.has('codigo') && !params.has('code') && Array.isArray(resolvedSku.atomic_codes) && resolvedSku.atomic_codes.length > 0) {
          const preferredCode = resolvedSku.id === 'SMAT-PUMP-IMP-AH' && resolvedSku.atomic_codes.includes('E4147')
            ? 'E4147'
            : resolvedSku.atomic_codes[0];
          const firstAtomic = resolveAtomicPartCode(preferredCode);
          if (firstAtomic) {
            result.codigo = firstAtomic.part_number;
            result.atomic_part = firstAtomic;
            if (!result.serie) result.serie = firstAtomic.pipe_size;
          }
        }
      } else {
        result.sku = String(rawSku).trim().toUpperCase();
      }
    }

    if (result.falla && (!result.equipo || !result.sintoma)) {
      const failureMap = {
        throatbush_recirculation: { equipo: 'solo_voluta', sintoma: 'arena_fina' },
        impeller_cavitation_erosion: { equipo: 'solo_impulsor', sintoma: 'roca_dura' },
        volute_cutwater_gouging: { equipo: 'kit_wet_end', sintoma: 'roca_dura' },
        liner_elastomer_tearing: { equipo: 'kit_wet_end', sintoma: 'acido_quimica' },
        seal_stuffing_box: { equipo: 'kit_sellado', sintoma: 'fuga_sello' },
        bearing_shaft_fatigue: { equipo: 'kit_rodamientos', sintoma: 'mixta_duda' }
      };
      const mappedFailure = failureMap[String(result.falla).trim().toLowerCase()];
      if (mappedFailure) {
        if (!result.equipo) result.equipo = mappedFailure.equipo;
        if (!result.sintoma) result.sintoma = mappedFailure.sintoma;
      }
    }

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

  if (roleLower.includes('hidrociclon') || roleLower.includes('apex') || roleLower.includes('vortex')) {
    let cycTag = 'D15';
    if (sizeVal.includes('d6') || pipe.includes('d6') || details.includes('D6')) cycTag = 'D6';
    else if (sizeVal.includes('d10') || pipe.includes('d10') || details.includes('D10')) cycTag = 'D10';
    else if (sizeVal.includes('d20') || pipe.includes('d20') || details.includes('D20')) cycTag = 'D20';
    return `SMAT-CYC-${cycTag}-APEX`;
  }
  if (roleLower.includes('malla_criba') || roleLower.includes('cribado') || roleLower.includes('th48')) {
    if (sizeVal.includes('1x1') || details.includes('1X1') || details.includes('305')) return 'SMAT-SCR-MOD-1X1';
    return 'SMAT-SCR-TH48-30';
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

export * from './sapAndLeadExportEngine.js';
