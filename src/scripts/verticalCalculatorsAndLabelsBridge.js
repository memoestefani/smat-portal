// @ts-check
/**
 * verticalCalculatorsAndLabelsBridge.js
 * ---------------------------------------------------------------------------
 * Fachada Cohesiva LCOM4 = 1 (< 220 LOC, `SLICE-V56-07` / `D4-V56`).
 * Retiene los diccionarios biyectivos cero-snake_case (`formatMaterialHumanLabel`,
 * `formatStationHumanBadge`, `formatDiagramHumanTitle`) y re-exporta los puentes
 * especializados desde `flotationFiltrationBridge.js`, `cycloneScreenBridge.js`,
 * `pumpingSealAndTribologyCalculators.js` y `verticalStateAndCtaSyncBridge.js`.
 */

export {
  bindCanonicalSealBalanceCalculator,
  bindCanonicalTribologySelector,
  evaluateCentrifugalSealPressureBalance,
} from './pumpingSealAndTribologyCalculators.js';
export {
  commitVerticalSimulation,
  loadUnifiedEngineeringAndWorkbenchState,
  projectVerticalPayloadToWorkbenchPatch,
  syncVerticalCtaLinks,
} from './verticalStateAndCtaSyncBridge.js';
export {
  bindCanonicalFiltrationCalculator,
  bindCanonicalFlotationCalculator,
} from './flotationFiltrationBridge.js';
export {
  bindCoupledClassificationStation,
} from './cycloneScreenBridge.js';

const BRIDGE_RUNTIME_REGISTRY = {
  lastUpdatedIso: '',
  /** @type {Record<string, { es: string, en: string }>} */
  materialMap: {
    alto_cromo_cr27: { es: 'Alto Cromo ASTM A532 Cr27 (A05 · ≥650 HB)', en: 'High Chrome ASTM A532 Cr27 (A05 · ≥650 HB)' },
    A05: { es: 'Alto Cromo ASTM A532 Cr27 (A05 · ≥650 HB)', en: 'High Chrome ASTM A532 Cr27 (A05 · ≥650 HB)' },
    alto_cromo_a49: { es: 'Hierro Alto Cromo Molibdeno (A49 · pH Ácido)', en: 'High Chrome Molybdenum Iron (A49 · Acidic pH)' },
    A49: { es: 'Hierro Alto Cromo Molibdeno (A49 · pH Ácido)', en: 'High Chrome Molybdenum Iron (A49 · Acidic pH)' },
    poliuretano_minero: { es: 'Poliuretano Minero Anti-Corte (U01 · Shore A 90–95)', en: 'Cut-Resistant Mining Polyurethane (U01 · Shore A 90–95)' },
    U01: { es: 'Poliuretano Minero Anti-Corte (U01 · Shore A 90–95)', en: 'Cut-Resistant Mining Polyurethane (U01 · Shore A 90–95)' },
    PU: { es: 'Poliuretano Minero Anti-Corte (U01 · Shore A 90–95)', en: 'Cut-Resistant Mining Polyurethane (U01 · Shore A 90–95)' },
    hule_natural_r55: { es: 'Elastómero Natural Anti-Abrasivo (R55 · Shore A 52–58)', en: 'Anti-Abrasive Natural Rubber (R55 · Shore A 52–58)' },
    R55: { es: 'Elastómero Natural Anti-Abrasivo (R55 · Shore A 52–58)', en: 'Anti-Abrasive Natural Rubber (R55 · Shore A 52–58)' },
    ceramica_sic: { es: 'Carburo de Silicio Sinterizado (SiC · ≥2200 HV)', en: 'Sintered Silicon Carbide (SiC · ≥2200 HV)' },
    SiC: { es: 'Carburo de Silicio Sinterizado (SiC · ≥2200 HV)', en: 'Sintered Silicon Carbide (SiC · ≥2200 HV)' },
    hybrid_a05_r55: { es: 'Híbrido Impulsor A05 + Forros R55 (Rama D)', en: 'Hybrid A05 Impeller + R55 Liners (Branch D)' },
  },
  /** @type {Record<string, { es: string, en: string }>} */
  stationMap: {
    drive_end: { es: 'ESTACIÓN 01 · TREN MOTRIZ', en: 'STATION 01 · DRIVE END' },
    sealing_fork: { es: 'ESTACIÓN 02 · SELLADO CENTRÍFUGO', en: 'STATION 02 · CENTRIFUGAL SEAL' },
    wet_end_fork: { es: 'ESTACIÓN 03 · EXTREMO HÚMEDO', en: 'STATION 03 · WET END' },
    suction_closure: { es: 'ESTACIÓN 04 · CIERRE DE SUCCIÓN', en: 'STATION 04 · SUCTION CLOSURE' },
    axial_calibration: { es: 'ESTACIÓN 05 · CALIBRACIÓN AXIAL', en: 'STATION 05 · AXIAL CALIBRATION' },
  },
  /** @type {Record<string, { es: string, en: string }>} */
  diagramMap: {
    impeller_5vane: { es: 'Impulsor Cerrado de 5 Álabes (E4147)', en: '5-Vane Closed Slurry Impeller (E4147)' },
    wet_kit_554: { es: 'Lote Sincronizado de Extremo Húmedo 5:5:4', en: '5:5:4 Synchronized Wet-End Overhaul Kit' },
    expeller_seal: { es: 'Sello Centrífugo Seco y Camisa HVOF D075C21', en: 'Dry Expeller Seal & D075C21 HVOF Shaft Sleeve' },
    bearing_cartridge: { es: 'Cartucho de Rodamientos Sellado ISO 281 (DAM005)', en: 'ISO 281 Sealed Bearing Cartridge Assembly (DAM005)' },
    volute_liner: { es: 'Revestimiento de Voluta y Cuello Ajustable', en: 'Spiral Volute Liner & Adjustable Throatbush' },
    cyclone_d6_d20: { es: 'Hidrociclón Clasificador D6"–D20" (5 Zonas)', en: 'D6"–D20" Classification Hydrocyclone (5 Zones)' },
    coupled_pump_cyclone: { es: 'Paquete Casado Bomba de Lodos + Batería de Hidrociclones', en: 'Coupled Slurry Pump + Hydrocyclone Cluster Package' },
    urethane_screen_th48: { es: 'Malla Fina de Poliuretano Alta Frecuencia TH48-30', en: 'TH48-30 High-Frequency Fine Urethane Screen' },
    urethane_screen_panel_305: { es: 'Panel Modular de Poliuretano 305×305 mm (1\'×1\')', en: '305×305 mm (1\'×1\') Modular Polyurethane Screen Panel' },
    filter_press: { es: 'Paquete de Placas de Polipropileno y Lonas 16 bar', en: '16-bar Polypropylene Recessed Plates & Filter Cloths' },
    filter_plate_shifter: { es: 'Mecanismo Corre-Placas (Plate Shifter) y Cadenas', en: 'Automated Plate Shifter Mechanism & Traction Chains' },
    flotation_cell: { es: 'Mecanismo Suspendido Rotor-Estator de Flotación', en: 'Suspended Flotation Rotor-Stator Mechanism' },
    marcy_scale: { es: 'Balanza de Densidad de Pulpa Marcy y Vaso 1000 cm³', en: 'Marcy Pulp Density Scale & 1000 cm³ Stainless Cup' },
    batch_filter: { es: 'Filtro Prensa de Laboratorio Batch (100 psi)', en: '100 psi Pneumatic Laboratory Batch Pressure Filter' },
    astm_sieves: { es: 'Serie de Tamices Certificados ASTM E11 (8")', en: 'ASTM E11 Certified 8" Test Sieve Stack' },
    lab_comminution_pan: { es: 'Pulverizador de Discos y Molienda de Laboratorio', en: 'Laboratory Disc Pulverizer & Comminution Set' },
  },
};

/**
 * @param {string} rawKey
 * @param {string} [lang='es']
 */
export function formatMaterialHumanLabel(rawKey, lang = 'es') {
  const key = String(rawKey || '').trim();
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();
  const entry = BRIDGE_RUNTIME_REGISTRY.materialMap[key];
  if (entry) return isEn ? entry.en : entry.es;
  return key.replace(/_/g, ' ');
}

/**
 * @param {string} stationId
 * @param {string} [lang='es']
 */
export function formatStationHumanBadge(stationId, lang = 'es') {
  const key = String(stationId || '').trim();
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();
  const entry = BRIDGE_RUNTIME_REGISTRY.stationMap[key];
  if (entry) return isEn ? entry.en : entry.es;
  return isEn ? 'STATION · ASSEMBLY' : 'ESTACIÓN · ENSAMBLE';
}

/**
 * @param {string} diagramId
 * @param {string} [lang='es']
 */
export function formatDiagramHumanTitle(diagramId, lang = 'es') {
  const key = String(diagramId || '').trim();
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();
  const entry = BRIDGE_RUNTIME_REGISTRY.diagramMap[key];
  if (entry) return isEn ? entry.en : entry.es;
  return isEn ? 'SMAT Engineering CAD Blueprint' : 'Plano CAD de Ingeniería SMAT';
}
