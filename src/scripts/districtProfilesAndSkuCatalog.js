/**
 * SMAT Minerals - District Profiles, Atomic SKU Catalog & Part Code Decoder (SLICE-V31-05 / SLICE-V34-11)
 * Extraído por costura limpia LCOM4 desde workbenchBus.js (D8 / DEB-V31-05 / DEB-V34-07).
 */
import atomicPartsJson from '../../data/atomic_parts.json' with { type: 'json' };
import { resolveBomPartSpecs } from './pumpAssemblyAndDriveEngine.js';
import { sanitizePublicAtomicPartSpecs } from './vendorPassportAndTradeInController.js';

/**
 * Endpoint oficial de respaldo para ingesta asíncrona hacia Google Apps Script (Code.gs)
 */
export const DEFAULT_SMAT_LEAD_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzSmatDurangoLeadIntakeWebhookV2/exec';

/**
 * Enriquecimiento cinemático y de ruteo de estación por código atómico sobre SSOT data/atomic_parts.json
 */
const ATOMIC_ENGINEERING_ENRICHMENT = {
  D3147: {
    slug: 'impulsor_3x2_d3147', role: 'solo_impulsor', pipe_size: '3x2', smat_code: 'SMAT-PUMP-3X2-IMP', wall_thickness_mm: 24,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)', station_name_en: 'Wet-End Assembly (5-5-4 Lot)', assembly_order_note: '09. Impulsor Cerrado 5 Álabes (Estación 03 • Lote 5:5:4)'
  },
  E4147: {
    slug: 'impulsor_5_alabes', role: 'solo_impulsor', pipe_size: '6x4', smat_code: 'SMAT-PUMP-6X4-IMP', wall_thickness_mm: 32,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)', station_name_en: 'Wet-End Assembly (5-5-4 Lot)', assembly_order_note: '09. Impulsor Cerrado 5 Álabes (Estación 03 • Lote 5:5:4)'
  },
  F6147: {
    slug: 'impulsor_8x6_f6147', role: 'solo_impulsor', pipe_size: '8x6', smat_code: 'SMAT-PUMP-8X6-IMP', wall_thickness_mm: 42,
    station_name_es: 'Extremo Húmedo (Lote 5-5-4)', station_name_en: 'Wet-End Assembly (5-5-4 Lot)', assembly_order_note: '09. Impulsor Cerrado 5 Álabes (Estación 03 • Lote 5:5:4)'
  },
  DAM028: {
    slug: 'camisa_flecha', role: 'kit_sellado', pipe_size: '3x2', smat_code: 'SMAT-SEAL-3X2-EXP', wall_thickness_mm: 18,
    station_name_es: 'Sellado Centrífugo Seco', station_name_en: 'Dry Centrifugal Sealing', assembly_order_note: '05. Anillo Expulsor Centrífugo (Estación 02 • Sin agua de sello)'
  },
  EAM028: {
    slug: 'expeller', role: 'kit_sellado', pipe_size: '6x4', smat_code: 'SMAT-SEAL-6X4-EXP', wall_thickness_mm: 22,
    station_name_es: 'Sellado Centrífugo Seco', station_name_en: 'Dry Centrifugal Sealing', assembly_order_note: '05. Anillo Expulsor Centrífugo (Estación 02 • Sin agua de sello)'
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
      sanitizePublicAtomicPartSpecs({
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
        kit_ids: Array.isArray(item.kit_ids) ? item.kit_ids : []
      })
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
  const rawSpec = resolveRawAtomicPartSpecs(codeOrSlug, pipeSeries);
  return sanitizePublicAtomicPartSpecs(rawSpec);
}

function resolveRawAtomicPartSpecs(codeOrSlug = '', pipeSeries = '6x4') {
  const direct = resolveAtomicPartCode(codeOrSlug);
  if (direct) return direct;

  const slug = String(codeOrSlug || '').trim().toLowerCase();
  const series = String(pipeSeries || '6x4').trim().toLowerCase();

  if (slug.includes('d3147')) return ATOMIC_PARTS_CATALOG.D3147;
  if (slug.includes('f6147')) return ATOMIC_PARTS_CATALOG.F6147;
  if (slug.includes('dam005') || slug.includes('cartucho') || slug.includes('bearing') || slug.includes('rodamientos')) {
    return {
      code: 'dam005', part_number: 'DAM005', frame: '6x4',
      name_es: 'Cartucho de Rodamientos Completo (Bearing Assembly) 6x4', name_en: 'Complete Cartridge Bearing Assembly 6x4',
      type_es: 'Sub-ensamble Mecánico de Soporte y Eje ISO 281', type_en: 'Mechanical Shaft & Bearing Housing Sub-assembly ISO 281',
      metallurgy: 'Acero Aleado SAE 4140 + Hierro Dúctil GGG40 + Sellos de Laberinto Purgante', hardness: 'Eje bonificado 280–320 HB / Pistas 60–62 HRC',
      vanes: 0, weight_kg: 54.0, impeller_diameter_mm: 380, max_particle_mm: 45, max_sphere_mm: 45, wall_thickness_mm: 28,
      station_number: 1, station: 'S1', station_name_es: 'Cartucho Motriz y Rodamientos (ISO 281)', station_name_en: 'Drive Cartridge & Bearings (ISO 281)',
      assembly_order: '01. Cartucho de Rodamientos / Bearing Assembly (Estación 01)', assembly_order_note: '01. Cartucho de Rodamientos / Bearing Assembly (Estación 01 • Ajuste Axial)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'HOIST_REQUIRED', handling_mode: 'HOIST_REQUIRED', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 4.86,
      niosh_ergonomic_tier: 'HOIST_MANDATORY', circuit: 'bombeo', pipe_size: '6x4', role: 'kit_rodamientos', smat_code: 'SMAT-PUMP-6X4-BRG'
    };
  }
  if (slug.includes('e4132') || slug.includes('forro') || slug.includes('fpl_liner')) {
    return {
      ...ATOMIC_PARTS_CATALOG.E4083, code: 'e4132', part_number: 'E4132',
      name_es: 'Forro de Plato (FPL Liner) en Hule / Poliuretano 6x4', name_en: 'Frame Plate Liner (FPL) in Rubber / Polyurethane 6x4',
      weight_kg: 9.8, station_number: 3, station: 'S3', niosh_handling_mode: 'MANUAL_SAFE', handling_mode: 'MANUAL_SAFE',
      niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 0.88, niosh_ergonomic_tier: 'MANUAL_SAFE_1P'
    };
  }
  if (slug.includes('dam028') || slug.includes('camisa') || slug.includes('sleeve')) return ATOMIC_PARTS_CATALOG.DAM028;
  if (slug.includes('eam028') || slug.includes('expeller') || slug.includes('sello')) return ATOMIC_PARTS_CATALOG.EAM028;
  if (slug.includes('e4083') || slug.includes('throatbush') || slug.includes('cuello') || slug.includes('voluta') || slug.includes('liner') || slug.includes('fpl')) {
    return ATOMIC_PARTS_CATALOG.E4083;
  }
  if (slug.includes('hidrociclon') || slug.includes('apex') || slug.includes('vortex') || slug.includes('cyc')) {
    return {
      code: 'cyc_apex_sic', part_number: 'CYC-APEX-SIC', frame: 'D10-D20',
      name_es: 'Boquilla Ápex y Vortex Finder para Hidrociclón D6–D20 en Carburo de Silicio (SiC)', name_en: 'Sintered Silicon Carbide (SiC) Hydrocyclone Apex Spigot & Vortex Finder D6–D20',
      type_es: 'Zona Crítica de Corte Hidrodinámico #02/#05 (Plitt d50c)', type_en: 'Critical Hydrodynamic Cut Zone #02/#05 (Plitt d50c)',
      metallurgy: 'Carburo de Silicio Sinterizado SiC (≥ 2200 HV) / Alto Cromo A05 / Poliuretano U01', hardness: '≥ 2200 HV (Mohs 9.2) / 85 Shore A',
      vanes: 0, weight_kg: 4.2, impeller_diameter_mm: 254, max_particle_mm: 12, max_sphere_mm: 12, wall_thickness_mm: 25,
      station_number: 5, station: 'Z5', station_name_es: 'Zona 05: Boquilla Ápex / Spigot Anticordón (Cv,u ≤ 52%)', station_name_en: 'Zone 05: Anti-Roping Apex / Spigot Insert (Cv,u ≤ 52%)',
      assembly_order: '05. Boquilla Ápex Monolítica SiC y Camisa Porta-Ápex (Zona 05)', assembly_order_note: '05. Boquilla Ápex Monolítica SiC (Zona 05 • Escalón δ_r ≤ 0.76 mm)',
      wet_end_kit_ratio: '2:1', niosh_handling_mode: 'MANUAL_SAFE', handling_mode: 'MANUAL_SAFE', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 0.38,
      niosh_ergonomic_tier: 'MANUAL_1P_SAFE', circuit: 'clasificacion', pipe_size: 'D15', role: 'hidrociclon_apex_vortex', smat_code: 'SMAT-CYC-D15-APEX'
    };
  }
  if (slug.includes('malla_criba') || slug.includes('th48') || slug.includes('criba') || slug.includes('screen') || slug.includes('mod-1x1')) {
    return {
      code: 'scr_th48_30', part_number: 'SCR-TH48-30', frame: '48x30',
      name_es: 'Malla Fina de Poliuretano TH48-30 / Panel Modular 1\'x1\' con Alivio Cónico 3°–5°', name_en: 'TH48-30 Fine Urethane Screen Mat / 1\'x1\' Modular Panel with 3°–5° Relief Angle',
      type_es: 'Panel Elastómero de Cribado de Alta Frecuencia (Weibull α ≥ 4.2)', type_en: 'High-Frequency Elastomer Screening Deck Panel (Weibull α ≥ 4.2)',
      metallurgy: 'Poliuretano Colado U01 (85 Shore A) con Cuerdas de Aramida', hardness: '85 ± 3 Shore A',
      vanes: 0, weight_kg: 9.5, impeller_diameter_mm: 305, max_particle_mm: 25, max_sphere_mm: 25, wall_thickness_mm: 30,
      station_number: 3, station: 'A3', station_name_es: 'Avenida 03: Cama de Cribado y Desaguado sin Cegamiento', station_name_en: 'Avenue 03: Non-Blinding Screening & Dewatering Deck',
      assembly_order: '03. Malla Tensada TH48-30 / Módulo 1\'x1\' Pin y Camisa', assembly_order_note: '03. Malla Tensada TH48-30 (Alivio troncocónico θ = 3°–5°)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'MANUAL_SAFE', handling_mode: 'MANUAL_SAFE', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 0.86,
      niosh_ergonomic_tier: 'MANUAL_1P_SAFE', circuit: 'clasificacion', pipe_size: 'TH48-30', role: 'malla_criba_poliuretano', smat_code: 'SMAT-SCR-TH48-30'
    };
  }
  if (slug.includes('rotor_estator') || slug.includes('celda_flotacion') || slug.includes('manto_difusor') || slug.includes('bateria_celdas') || slug.includes('flot-mech') || slug.includes('18sp')) {
    return {
      code: 'flot_mech_18sp', part_number: 'FLOT-MECH-18SP', frame: series || '38-sp',
      name_es: 'Mecanismo Rotor-Estator y Difusor Supercargado 18-72 SP en Elastómero R55 / Poliuretano U01', name_en: '18-72 SP Supercharged Rotor-Stator & Diffuser Mechanism in R55 Elastomer / U01 Polyurethane',
      type_es: 'Sub-ensamble Hidrodinámico de Dispersión Radial de Aire y Pulpa', type_en: 'Radial Air & Slurry Dispersion Hydrodynamic Sub-assembly',
      metallurgy: 'Hule Natural Antiabrasivo R55 (55–60 Shore A) / Poliuretano U01 con Alma de Acero A36', hardness: '55–60 Shore A / 85 Shore A',
      vanes: 8, weight_kg: 210.0, impeller_diameter_mm: 680, max_particle_mm: 6, max_sphere_mm: 6, wall_thickness_mm: 35,
      station_number: 2, station: 'F2', station_name_es: 'Avenida 02: Mecanismo Rotor-Estator y Difusor Supercargado', station_name_en: 'Avenue 02: Supercharged Rotor-Stator & Diffuser Mechanism',
      assembly_order: '02. Ensamble Rotor-Estator Supercargado 18-72 SP (Estación F2)', assembly_order_note: '02. Ensamble Rotor-Estator Supercargado 18-72 SP (Estación F2 • Inmersión Radial)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'HOIST_REQUIRED', handling_mode: 'HOIST_REQUIRED', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 18.92,
      niosh_ergonomic_tier: 'HOIST_MANDATORY', circuit: 'flotacion', pipe_size: series || '100ft', role: 'rotor_estator', smat_code: 'SMAT-FLOT-38SP-ROT'
    };
  }
  if (slug.includes('placas_membrana') || slug.includes('shifter') || slug.includes('bomba_prensa')) {
    return {
      code: 'filt_shifter_16b', part_number: 'FILT-SHIFTER-16B', frame: series || '1200x1200',
      name_es: 'Placa de Membrana 16 bar / Cadena Recorredora Shifter Paso Pesado en Acero Inoxidable', name_en: '16 bar Membrane Squeeze Plate / Heavy-Duty Stainless Steel Plate Shifter Chain',
      type_es: 'Componente de Exprimido de Alta Presión e Indexación Mecánica', type_en: 'High-Pressure Cake Squeeze & Mechanical Plate Indexing Component',
      metallurgy: 'Elastómero EPDM/TPE + Polipropileno Virgen Prensado / Acero Inox 304', hardness: '78 Shore D / 180 HB',
      vanes: 0, weight_kg: 48.0, impeller_diameter_mm: 1200, max_particle_mm: 3, max_sphere_mm: 3, wall_thickness_mm: 65,
      station_number: 4, station: 'P4', station_name_es: 'Avenida 04: Placa de Membrana 16 bar / Cadena Recorredora Shifter', station_name_en: 'Avenue 04: 16 bar Membrane Plate / Shifter Chain',
      assembly_order: '04. Placa de Membrana 16 bar y Cadena Shifter (Estación P4)', assembly_order_note: '04. Placa de Membrana 16 bar y Cadena Shifter (Estación P4 • Ciclo Exprimido)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'HOIST_REQUIRED', handling_mode: 'HOIST_REQUIRED', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 4.32,
      niosh_ergonomic_tier: 'HOIST_MANDATORY', circuit: 'filtracion', pipe_size: series || '1200', role: 'placas_membrana', smat_code: 'SMAT-FILT-1200-MEM'
    };
  }
  if (slug.includes('placas_telas') || slug.includes('filtro_prensa') || slug.includes('filt-pp') || slug.includes('filt-cloth')) {
    return {
      code: 'filt_pp_1200', part_number: 'FILT-PP-1200', frame: series || '1200x1200',
      name_es: 'Placa de Polipropileno de Cámara Recesada y Lona Filtrante Calandrada (16 bar)', name_en: 'Recessed Chamber Polypropylene Filter Plate & Calendered Filter Cloth (16 bar)',
      type_es: 'Elemento Modular de Deshidratación de Jales y Concentrados (≤ 12% Humedad)', type_en: 'Modular Tailings & Concentrate Dewatering Element (≤ 12% Cake Moisture)',
      metallurgy: 'Polipropileno Virgen de Alto Peso Molecular (HMW-PP) + Monofilamento PP/PA66', hardness: '75 Shore D',
      vanes: 0, weight_kg: 34.0, impeller_diameter_mm: 1200, max_particle_mm: 2, max_sphere_mm: 2, wall_thickness_mm: 60,
      station_number: 4, station: 'P4', station_name_es: 'Avenida 04: Pack de Placas de Polipropileno Virgen y Telas Calandradas', station_name_en: 'Avenue 04: Virgin Polypropylene Plates & Calendered Cloths Pack',
      assembly_order: '04. Pack de Placas Recámara PP y Lonas Monofilamento (Estación P4)', assembly_order_note: '04. Pack de Placas Recámara PP y Lonas Monofilamento (Estación P4 • Sellado Perimetral)',
      wet_end_kit_ratio: '2:1', niosh_handling_mode: 'HOIST_REQUIRED', handling_mode: 'HOIST_REQUIRED', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 3.06,
      niosh_ergonomic_tier: 'HOIST_MANDATORY', circuit: 'filtracion', pipe_size: series || '1200', role: 'placas_telas', smat_code: 'SMAT-FILT-1200-PLT'
    };
  }
  if (slug.includes('balanza_marcy') || slug.includes('marcy') || slug.includes('vaso-1000') || slug.includes('plato-tent') || slug.includes('pulv-disc')) {
    return {
      code: 'lab_marcy_1000', part_number: 'LAB-MARCY-1000', frame: '1000cc',
      name_es: 'Báscula de Densidad de Pulpa y % de Sólidos Tipo Marcy con Vaso 1000 cm³ Acero Inox 304 y 12 Anillos', name_en: 'Marcy-Type Pulp Density & % Solids Scale with 1000 cm³ 304 SS Cup & 12 Interchangeable Dial Rings',
      type_es: 'Instrumento Metrológico Directo de Control metalúrgico (Ss 1.2–7.8)', type_en: 'Direct Metallurgical Process Control Density Instrument (SG 1.2–7.8)',
      metallurgy: 'Acero Inoxidable AISI 304 (Vaso 1000 cm³ con Orificios de Rebose) + Carcasa Aleación Sellada', hardness: '170 HB (Inox 304)',
      vanes: 0, weight_kg: 3.8, impeller_diameter_mm: 260, max_particle_mm: 4, max_sphere_mm: 4, wall_thickness_mm: 3,
      station_number: 5, station: 'L5', station_name_es: 'Avenida 05: Báscula de Densidad de Pulpa Marcy y Vaso 1000 cc', station_name_en: 'Avenue 05: Marcy Pulp Density Scale & 1000 cc Cup',
      assembly_order: '05. Báscula Marcy de 12 Diales con Vaso Acero Inox 304 1000 cc (Estación L5)', assembly_order_note: '05. Báscula Marcy con Vaso 1000 cc (Estación L5 • SG 1.2–7.8)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'MANUAL_SAFE', handling_mode: 'MANUAL_SAFE', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 0.34,
      niosh_ergonomic_tier: 'MANUAL_1P_SAFE', circuit: 'control_procesos', pipe_size: 'marcy_12_rings', role: 'balanza_marcy', smat_code: 'SMAT-CTRL-MARCY-1000'
    };
  }
  if (slug.includes('filtro_batch_lab') || slug.includes('filtro_batch') || slug.includes('filtro-batch') || slug.includes('filter-barrel') || slug.includes('filter-lplt') || slug.includes('bond-jar')) {
    return {
      code: 'lab_batch_100psi', part_number: 'LAB-BATCH-100PSI', frame: '100psi',
      name_es: 'Filtro Prensa de Laboratorio Batch 100 psi con Cilindro Acero Inox / Pesado y Husillo en T', name_en: '100 psi Laboratory Batch Pressure Filter with Heavy-Duty Barrel & T-Bar Screw Clamp',
      type_es: 'Unidad de Deshidratación de Muestras Metalúrgicas (Mínimo de Pierre Gy)', type_en: 'Metallurgical Sample Dewatering Unit (Pierre Gy Minimum Sample Mass)',
      metallurgy: 'Acero Inoxidable 304 / Acero al Carbón Cédula 80 + Sellos O-Ring Buna-N/Viton', hardness: '185 HB',
      vanes: 0, weight_kg: 28.0, impeller_diameter_mm: 215, max_particle_mm: 6, max_sphere_mm: 6, wall_thickness_mm: 10,
      station_number: 5, station: 'L5', station_name_es: 'Avenida 05: Filtro Prensa de Laboratorio Batch 100 psi', station_name_en: 'Avenue 05: 100 psi Laboratory Batch Pressure Filter',
      assembly_order: '05. Filtro de Presión Batch 100 psi sobre Pedestal o Mesa (Estación L5)', assembly_order_note: '05. Filtro de Presión Batch 100 psi (Estación L5 • Secado de Testigos)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'HOIST_REQUIRED', handling_mode: 'HOIST_REQUIRED', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 2.52,
      niosh_ergonomic_tier: 'TWO_PERSON_TEAM', circuit: 'control_procesos', pipe_size: 'batch_100psi', role: 'filtro_batch_lab', smat_code: 'SMAT-CTRL-BATCH-100'
    };
  }
  if (slug.includes('tamices_laboratorio') || slug.includes('tamiz') || slug.includes('e11') || slug.includes('rotap')) {
    return {
      code: 'lab_astm_e11', part_number: 'LAB-ASTM-E11', frame: '8in-ASTM-E11',
      name_es: 'Tamiz de Laboratorio Certificado ASTM E11 / ISO 3310-1 en Acero Inoxidable 304/316 (8" / 12")', name_en: 'Certified ASTM E11 / ISO 3310-1 Stainless Steel 304/316 Test Sieve (8" / 12")',
      type_es: 'Malla Metrológica de Control Granulométrico P80 (Rosin-Rammler)', type_en: 'P80 Particle Size Distribution Control Sieve (Rosin-Rammler)',
      metallurgy: 'Marco Acero Inoxidable 304 Sin Costura + Malla Tejida Inox 316', hardness: '175 HB',
      vanes: 0, weight_kg: 0.9, impeller_diameter_mm: 203, max_particle_mm: 25, max_sphere_mm: 25, wall_thickness_mm: 1.5,
      station_number: 5, station: 'L5', station_name_es: 'Avenida 05: Serie de Tamices Certificados ASTM E11 8" Inox', station_name_en: 'Avenue 05: Certified 8" Stainless Steel ASTM E11 Sieve Series',
      assembly_order: '05. Torre de Tamizado Granulométrico ASTM E11 #4 a #400 (Estación L5)', assembly_order_note: '05. Torre de Tamizado ASTM E11 (Estación L5 • Corte P80 Rosin-Rammler)',
      wet_end_kit_ratio: '1:1', niosh_handling_mode: 'MANUAL_SAFE', handling_mode: 'MANUAL_SAFE', niosh_rwl_shaft_kg: 11.1, niosh_lifting_index_shaft: 0.08,
      niosh_ergonomic_tier: 'MANUAL_1P_SAFE', circuit: 'control_procesos', pipe_size: 'astm_8in_inox', role: 'tamices_laboratorio', smat_code: 'SMAT-CTRL-E11-8IN'
    };
  }

  const bomSpec = resolveBomPartSpecs(slug, series);
  if (bomSpec) return bomSpec;

  const isMultiSeriesRange = /\b(?:1\.5x1|3x2|4x3)\b.*\b(?:a|to|-)\b.*\b(?:10x8|12x10|14x12)\b/i.test(series);
  if (!isMultiSeriesRange && (series.includes('3x2') || series.includes('4x3') || series.includes('1.5x1'))) {
    return ATOMIC_PARTS_CATALOG.D3147;
  }
  if (!isMultiSeriesRange && (series.includes('8x6') || series.includes('10x8'))) {
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


export { parseUrlContextParams, generateSmatPartCode } from './urlContextAndPartCodeParser.js';
export * from './sapAndLeadExportEngine.js';
