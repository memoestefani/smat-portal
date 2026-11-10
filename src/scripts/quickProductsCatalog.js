/**
 * quickProductsCatalog.js
 * ---------------------------------------------------------------------------
 * Fuente Única de Verdad (SSOT) para el Plano 1 de Compra Rápida (PRD v3.0/v3.2 §6.1).
 * 19 SKUs canónicos distribuidos en las 6 Avenidas Operativas (AV-01..AV-6A),
 * con Unión Discriminada Honesta (ARB-SMAT-37): los 6 SKUs de bombeo cubren
 * las 13 piezas atómicas de atomic_parts.json y los 13 SKUs de laboratorio,
 * ciclones, mallas, filtración y flotación tienen linked_atomic_codes = [].
 */

import atomicPartsCatalog from '../../data/atomic_parts.json' with { type: 'json' };
import quickCheckoutCatalog from '../../data/quick_checkout_Catalog.json' with { type: 'json' };

export const CANONICAL_DIAGRAM_KINDS = Object.freeze([
  'impulsor',
  'revestimientos',
  'throatbush',
  'sello',
  'soporte',
  'bombeo',
  'clasificacion',
  'desaguado',
  'flotacion',
  'shaft-sleeve-d075c21',
  'expeller-ring-d4029a05',
  'back-liner-d4032r55',
  'cyclone-apex-vortex',
  'flotation-rotor-stator',
  'pinch-knife-valve',
  'filter-press-plate-cloth'
]);

export const CANONICAL_V32_DIAGRAM_KINDS = Object.freeze([
  'marcy_scale',
  'astm_sieves',
  'lab_comminution_pan',
  'batch_filter',
  'impeller_5vane',
  'wet_kit_554',
  'expeller_seal',
  'bearing_cartridge',
  'volute_liner',
  'cyclone_d6_d20',
  'coupled_pump_cyclone',
  'urethane_screen_th48',
  'filter_press',
  'filter_plate_shifter',
  'flotation_cell'
]);

export const AVENUE_METADATA = Object.freeze({
  avenida_1_bombeo: {
    id: 'avenida_1_bombeo',
    code: 'AV-01',
    gateLock: 'G1-G2',
    labelEs: 'Avenida 1 — Bombeo de Lodos Horizontal (Extremo Húmedo + Potencia)',
    labelEn: 'Avenue 1 — Horizontal Slurry Pumping (Wet-End + Power End)'
  },
  avenida_2_hidrociclones: {
    id: 'avenida_2_hidrociclones',
    code: 'AV-02',
    gateLock: 'G3',
    labelEs: 'Avenida 2 — Hidrociclones e Inserciones SiC (D6 a D20)',
    labelEn: 'Avenue 2 — Hydrocyclones & SiC Inserts (D6 to D20)'
  },
  avenida_3_cribas_mallas: {
    id: 'avenida_3_cribas_mallas',
    code: 'AV-03',
    gateLock: 'G2-G3',
    labelEs: 'Avenida 3 — Cribas Vibratorias, Mallas Finas TH48-30 y Módulos 1\'x1\'',
    labelEn: 'Avenue 3 — Vibrating Screens, TH48-30 Fine Screens & 1\'x1\' Modules'
  },
  avenida_4_flotacion_valvulas: {
    id: 'avenida_4_flotacion_valvulas',
    code: 'AV-04',
    gateLock: 'G4',
    labelEs: 'Avenida 4 — Flotación (#18 SP, #24, #30) y Válvulas de Lodos (Pinch/Guillotina)',
    labelEn: 'Avenue 4 — Flotation (#18 SP, #24, #30) & Slurry Valves (Pinch/Knife Gate)'
  },
  avenida_5_filtracion: {
    id: 'avenida_5_filtracion',
    code: 'AV-05',
    gateLock: 'G5',
    labelEs: 'Avenida 5 — Filtros Prensa (Placas PP, Lonas Calandradas y Corre-Placas)',
    labelEn: 'Avenue 5 — Filter Presses (PP Plates, Calendered Cloths & Plate Shifter)'
  },
  avenida_5_laboratorio: {
    id: 'avenida_5_laboratorio',
    code: 'AV-05-LAB',
    gateLock: 'G3-G5',
    labelEs: 'Avenida 5 · Lab — Control Metalúrgico (Balanza Marcy, Tamices ASTM E11, Ro-Tap y Filtro Batch)',
    labelEn: 'Avenue 5 · Lab — Metallurgical Control (Marcy Scale, ASTM E11 Sieves, Ro-Tap & Batch Filter)'
  },
  avenida_6a_paquete_casado: {
    id: 'avenida_6a_paquete_casado',
    code: 'AV-6A',
    gateLock: 'G2',
    labelEs: 'Avenida 6A — Paquete Casado Bomba de Lodos + Hidrociclón (5:5:4)',
    labelEn: 'Avenue 6A — Married Slurry Pump + Hydrocyclone Package (5:5:4)'
  }
});

export const STOCK_REGIME_LABELS = Object.freeze({
  hay: {
    code: 'hay',
    badgeEs: '🟢 HAY EN STOCK DURANGO (24–72 h)',
    badgeEn: '🟢 IN DURANGO STOCK (24–72 h)',
    leadTimeDaysRange: [1, 3],
    advancePaymentRequiredPct: 0
  },
  se_pide: {
    code: 'se_pide',
    badgeEs: '🟡 SE PIDE / LOTE PROGRAMADO (2–4 sem)',
    badgeEn: '🟡 SCHEDULED BATCH ORDER (2–4 wks)',
    leadTimeDaysRange: [14, 28],
    advancePaymentRequiredPct: 30
  },
  se_fabrica: {
    code: 'se_fabrica',
    badgeEs: '🔵 SE FABRICA BAJO PLANO (50% ANTICIPO)',
    badgeEn: '🔵 CUSTOM MANUFACTURED (50% ADVANCE)',
    leadTimeDaysRange: [28, 45],
    advancePaymentRequiredPct: 50
  }
});

export const MATERIAL_DISPLAY_LABELS = Object.freeze({
  A05: {
    es: 'Alto Cromo 27% Cr (ASTM A532 III-A · ≥650 HB)',
    en: '27% High-Chrome Iron (ASTM A532 III-A · ≥650 HB)'
  },
  A49: {
    es: 'Aleación Inoxidable / Alto Cromo A49 (pH Ácido / Laboratorio)',
    en: 'Stainless / High-Chrome A49 Alloy (Acidic pH / Laboratory)'
  },
  R55: {
    es: 'Elastómero Hule Natural Antiabrasivo R55 (55 Shore A)',
    en: 'Anti-Abrasive Natural Rubber R55 Elastomer (55 Shore A)'
  },
  PU: {
    es: 'Poliuretano Colado Anti-Cegamiento PU (85 Shore A)',
    en: 'Anti-Blinding Cast Polyurethane PU (85 Shore A)'
  },
  SiC: {
    es: 'Cerámica Sinterizada Carburo de Silicio SiC (≥2200 HV)',
    en: 'Sintered Silicon Carbide SiC Ceramic (≥2200 HV)'
  },
  C21: {
    es: 'Acero 420 con Recubrimiento Cerámico HVOF WC-Co-Cr (≥68 HRC)',
    en: '420 Steel with HVOF WC-Co-Cr Ceramic Coating (≥68 HRC)'
  }
});

/**
 * Mapa biyectivo de compatibilidad entre IDs legados (SKU-QC-01..19 e intermedios)
 * y los 19 IDs canónicos SMAT-* de prd_smatminerals_web_v3.md §6.1 (ARB-SMAT-41).
 */
export const LEGACY_QC_TO_CANONICAL_SKU = Object.freeze({
  'SKU-QC-01': 'SMAT-PUMP-IMP-AH',
  'SKU-QC-02': 'SMAT-LAB-VASO-1000',
  'SKU-QC-03': 'SMAT-LAB-TAMIZ-E11',
  'SKU-QC-04': 'SMAT-LAB-ROTAP-MECH',
  'SKU-QC-05': 'SMAT-PUMP-EXPELLER-KIT',
  'SKU-QC-06': 'SMAT-PUMP-BRG-005M',
  'SKU-QC-07': 'SMAT-LAB-PLATO-TENT',
  'SKU-QC-08': 'SMAT-PUMP-WETKIT-554',
  'SKU-QC-09': 'SMAT-SCR-MOD-1X1',
  'SKU-QC-10': 'SMAT-PUMP-LINERS-AH',
  'SKU-QC-11': 'SMAT-CYC-D6-D20',
  'SKU-QC-12': 'SMAT-COUPLED-PUMP-CYC',
  'SKU-QC-13': 'SMAT-SCR-TH48-30',
  'SKU-QC-14': 'SMAT-FLOT-MECH-18SP',
  'SKU-QC-15': 'SMAT-LAB-PULV-DISC',
  'SKU-QC-16': 'SMAT-LAB-FILTRO-BATCH',
  'SKU-QC-17': 'SMAT-FILT-CLOTH-PLATE',
  'SKU-QC-18': 'SMAT-FILT-SHIFTER-CHAIN',
  'SKU-QC-19': 'SMAT-LAB-MARCY-1000',
  'SMAT-PUMP-IMP-5V': 'SMAT-PUMP-IMP-AH',
  'SMAT-PUMP-TB-LIN': 'SMAT-PUMP-LINERS-AH',
  'SMAT-PUMP-EXP-RING': 'SMAT-PUMP-EXPELLER-KIT',
  'SMAT-PUMP-FPL-INSERT': 'SMAT-PUMP-LINERS-AH',
  'SMAT-CYC-VORTEX-SIC': 'SMAT-CYC-D6-D20',
  'SMAT-CYC-APEX-SIC': 'SMAT-CYC-D6-D20',
  'SMAT-CYC-CONE-PU': 'SMAT-CYC-D6-D20'
});

/**
 * Resuelve cualquier identificador (SMAT-*, SKU-QC-01..19, slug o alias)
 * al ID canónico SMAT-* de los 19 SKUs del catálogo v3.3.
 */
export function resolveCanonicalSkuId(idOrLegacy) {
  if (!idOrLegacy || typeof idOrLegacy !== 'string') return '';
  const trimmed = idOrLegacy.trim();
  const upper = trimmed.toUpperCase();
  if (LEGACY_QC_TO_CANONICAL_SKU[upper]) {
    return LEGACY_QC_TO_CANONICAL_SKU[upper];
  }
  const direct = quickCheckoutCatalog.find(
    (s) =>
      String(s.id || s.sku_id || '').toUpperCase() === upper ||
      String(s.legacy_sku_id || '').toUpperCase() === upper
  );
  if (direct) return direct.id || direct.sku_id;
  const bySlug = getQuickProductBySlugOrAlias(trimmed);
  return bySlug ? (bySlug.id || bySlug.sku_id) : trimmed;
}

/**
 * Devuelve los 19 SKUs canónicos enriquecidos con metadatos de régimen, imagen y opciones de configuración.
 */
export function getQuickProductsCatalog() {
  return quickCheckoutCatalog.map((sku) => {
    const regimeMeta = STOCK_REGIME_LABELS[sku.stock_regime] || STOCK_REGIME_LABELS.hay;
    const avenueMeta = AVENUE_METADATA[sku.avenue] || AVENUE_METADATA.avenida_1_bombeo;
    const resolvedCodes = Array.isArray(sku.linked_atomic_codes)
      ? sku.linked_atomic_codes
      : (sku.atomic_codes || []);
    const materials = Array.isArray(sku.available_materials) && sku.available_materials.length > 0
      ? sku.available_materials
      : [sku.default_material || 'A05'];
    const defaultDimEs = sku.geometric_triplet_mm?.label_es || 'Geometría Estándar Drop-In 1:1';
    const defaultDimEn = sku.geometric_triplet_mm?.label_en || 'Standard 1:1 Drop-In Geometry';
    const configOptionsEs = Array.isArray(sku.config_options_es) && sku.config_options_es.length > 0
      ? sku.config_options_es
      : materials.map((mat) => ({
          value: mat,
          label: `${mat} — ${(MATERIAL_DISPLAY_LABELS[mat]?.es) || mat} · (${defaultDimEs.split('|')[0].trim()})`
        }));
    const configOptionsEn = Array.isArray(sku.config_options_en) && sku.config_options_en.length > 0
      ? sku.config_options_en
      : materials.map((mat) => ({
          value: mat,
          label: `${mat} — ${(MATERIAL_DISPLAY_LABELS[mat]?.en) || mat} · (${defaultDimEn.split('|')[0].trim()})`
        }));
    return {
      ...sku,
      id: sku.id || sku.sku_id,
      sku_id: sku.sku_id || sku.id,
      atomic_codes: resolvedCodes,
      linked_atomic_codes: resolvedCodes,
      config_options_es: configOptionsEs,
      config_options_en: configOptionsEn,
      regimeMeta,
      avenueMeta
    };
  });
}

export const LEGACY_SLUG_TO_CANONICAL_SKU = Object.freeze({
  'hidrociclon-d20-vortex-apex-ceramico-sic': 'SMAT-CYC-D6-D20',
  'panel-criba-poliuretano-modular-305x305': 'SMAT-SCR-MOD-1X1',
  'balanza-densidad-pulpa-marcy-1000ml': 'SMAT-LAB-MARCY-1000',
  'placa-filtro-prensa-polipropileno-1200mm': 'SMAT-FILT-CLOTH-PLATE',
  'celda-flotacion-mecanica-kit-rotor-estator': 'SMAT-FLOT-MECH-18SP',
  'impulsor-5-alabes-alto-cromo-cr27': 'SMAT-PUMP-IMP-AH',
  'cartucho-rodamientos-heavy-duty-005m': 'SMAT-PUMP-BRG-005M',
  'sello-centrifugo-expulsor-seco-cr27': 'SMAT-PUMP-EXPELLER-KIT',
  'd20-hydrocyclone-sic-ceramic-vortex-apex': 'SMAT-CYC-D6-D20',
  'modular-polyurethane-screen-panel-305x305': 'SMAT-SCR-MOD-1X1',
  'marcy-pulp-density-scale-1000ml': 'SMAT-LAB-MARCY-1000',
  'polypropylene-filter-press-plate-1200mm': 'SMAT-FILT-CLOTH-PLATE',
  'mechanical-flotation-cell-rotor-stator-kit': 'SMAT-FLOT-MECH-18SP',
  '5-vane-high-chrome-cr27-impeller': 'SMAT-PUMP-IMP-AH',
  '005m-heavy-duty-bearing-cartridge': 'SMAT-PUMP-BRG-005M',
  'cr27-dry-centrifugal-expeller-seal': 'SMAT-PUMP-EXPELLER-KIT'
});

/**
 * Busca un SKU por su ID canónico (SMAT-*), ID legado (SKU-QC-01..19),
 * slug_es, slug_en o cualquiera de sus aliases_es/aliases_en.
 */
export function getQuickProductBySlugOrAlias(slugOrId) {
  if (!slugOrId || typeof slugOrId !== 'string') return null;
  const normalized = slugOrId.trim().toLowerCase();
  const mappedSkuId =
    LEGACY_SLUG_TO_CANONICAL_SKU[normalized] ||
    LEGACY_QC_TO_CANONICAL_SKU[slugOrId.trim().toUpperCase()] ||
    null;
  const catalog = getQuickProductsCatalog();
  for (const sku of catalog) {
    if (
      (mappedSkuId && (sku.id === mappedSkuId || sku.sku_id === mappedSkuId)) ||
      String(sku.id || '').toLowerCase() === normalized ||
      String(sku.sku_id || '').toLowerCase() === normalized ||
      String(sku.legacy_sku_id || '').toLowerCase() === normalized ||
      sku.slug_es.toLowerCase() === normalized ||
      sku.slug_en.toLowerCase() === normalized ||
      (Array.isArray(sku.aliases_es) && sku.aliases_es.some((a) => a.toLowerCase() === normalized)) ||
      (Array.isArray(sku.aliases_en) && sku.aliases_en.some((a) => a.toLowerCase() === normalized))
    ) {
      return sku;
    }
  }
  return null;
}

/**
 * Devuelve todos los parámetros de rutas estáticas (ES o EN) incluyendo tanto el slug canónico
 * como todos los aliases de la matriz PRD v3.0/v3.2 §6.1, garantizando 0 enlaces huérfanos.
 */
export function getAllStaticProductRouteEntries(locale = 'es') {
  const catalog = getQuickProductsCatalog();
  const seen = new Set();
  const entries = [];
  for (const sku of catalog) {
    const primarySlug = locale === 'en' ? sku.slug_en : sku.slug_es;
    const aliases = locale === 'en' ? (sku.aliases_en || []) : (sku.aliases_es || []);
    const allSlugs = [primarySlug, ...aliases];
    for (const routeSlug of allSlugs) {
      if (!seen.has(routeSlug)) {
        seen.add(routeSlug);
        entries.push({
          routeSlug,
          isCanonical: routeSlug === primarySlug,
          canonicalSlug: primarySlug,
          sku
        });
      }
    }
  }
  return entries;
}

/**
 * Agrupa los 19 SKUs por avenida operativa (AV-01..AV-6A), incluyendo avenidas secundarias acopladas.
 */
export function getQuickProductsByAvenue() {
  const grouped = {};
  for (const key of Object.keys(AVENUE_METADATA)) {
    grouped[key] = [];
  }
  for (const sku of getQuickProductsCatalog()) {
    const primaryKey = grouped[sku.avenue] ? sku.avenue : 'avenida_1_bombeo';
    grouped[primaryKey].push(sku);
    if (Array.isArray(sku.secondary_avenues)) {
      for (const secKey of sku.secondary_avenues) {
        if (grouped[secKey] && !grouped[secKey].some((item) => item.id === sku.id)) {
          grouped[secKey].push(sku);
        }
      }
    }
  }
  return grouped;
}

/**
 * Verifica que todos los atomic_codes referenciados en los SKUs de bombeo existan en atomic_parts.json,
 * que la unión de los 6 SKUs de bombeo cubra las 13 piezas atómicas, y que los 13 SKUs no-bomba
 * tengan linked_atomic_codes = [] (Unión Discriminada Honesta ARB-SMAT-37).
 */
export function verifyCatalogReferentialIntegrity() {
  const validPartNumbers = new Set(
    atomicPartsCatalog.flatMap((part) => [
      String(part.part_number || '').toUpperCase(),
      String(part.code || '').toUpperCase()
    ])
  );
  const orphanCodes = [];
  const coveredPartNumbers = new Set();
  const nonPumpContamination = [];

  for (const sku of quickCheckoutCatalog) {
    const codes = sku.linked_atomic_codes || sku.atomic_codes || [];
    const isPumpSku = sku.vertical === 'bombeo';
    if (!isPumpSku && codes.length > 0) {
      nonPumpContamination.push({ skuId: sku.sku_id || sku.id, codes });
    }
    for (const code of codes) {
      const upper = String(code).toUpperCase();
      if (!validPartNumbers.has(upper)) {
        orphanCodes.push({ skuId: sku.sku_id || sku.id, code: upper });
      } else {
        coveredPartNumbers.add(upper);
      }
    }
  }
  return {
    valid:
      orphanCodes.length === 0 &&
      nonPumpContamination.length === 0 &&
      quickCheckoutCatalog.length === 19 &&
      atomicPartsCatalog.length === 13 &&
      coveredPartNumbers.size === 13,
    skuCount: quickCheckoutCatalog.length,
    atomicPartCount: atomicPartsCatalog.length,
    coveredAtomicPartCount: coveredPartNumbers.size,
    nonPumpContamination,
    orphanCodes
  };
}

/**
 * Verifica la suryectividad de DiagramKind: que las 16 variantes clásicas y los 15 esquemas
 * canónicos v3.2 de TechnicalDiagrams.astro estén cubiertos por los 19 SKUs del catálogo.
 */
export function verifyDiagramSurjectivity() {
  const covered = new Set();
  for (const sku of quickCheckoutCatalog) {
    if (sku.diagram_id) covered.add(sku.diagram_id);
    if (sku.secondary_diagram_id) covered.add(sku.secondary_diagram_id);
    if (Array.isArray(sku.diagram_aliases)) {
      for (const alias of sku.diagram_aliases) {
        covered.add(alias);
      }
    }
  }
  const missing = CANONICAL_DIAGRAM_KINDS.filter((kind) => !covered.has(kind));
  const missingV32 = CANONICAL_V32_DIAGRAM_KINDS.filter((kind) => !covered.has(kind));
  return {
    surjective: missing.length === 0 && missingV32.length === 0,
    totalKinds: CANONICAL_DIAGRAM_KINDS.length,
    v32TotalKinds: CANONICAL_V32_DIAGRAM_KINDS.length,
    coveredCount: covered.size,
    missingKinds: missing,
    missingV32Kinds: missingV32
  };
}
