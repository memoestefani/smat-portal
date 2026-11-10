/**
 * quickProductsCatalog.js
 * ---------------------------------------------------------------------------
 * Fuente Única de Verdad (SSOT) para el Plano 1 de Compra Rápida (PRD v3.0 §6.1).
 * 19 SKUs canónicos distribuidos en las 5 Avenidas Operativas + Avenida 6A,
 * con clausura referencial 100% contra atomic_parts.json (13 piezas atómicas)
 * y suryectividad 16/16 contra DiagramKind de TechnicalDiagrams.astro.
 */

import quickCheckoutCatalog from '../../data/quick_checkout_Catalog.json' with { type: 'json' };
import atomicPartsCatalog from '../../data/atomic_parts.json' with { type: 'json' };

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

/**
 * Devuelve los 19 SKUs canónicos enriquecidos con metadatos de régimen e imagen.
 */
export function getQuickProductsCatalog() {
  return quickCheckoutCatalog.map((sku) => {
    const regimeMeta = STOCK_REGIME_LABELS[sku.stock_regime] || STOCK_REGIME_LABELS.hay;
    const avenueMeta = AVENUE_METADATA[sku.avenue] || AVENUE_METADATA.avenida_1_bombeo;
    return {
      ...sku,
      regimeMeta,
      avenueMeta
    };
  });
}

/**
 * Busca un SKU por su ID (SKU-QC-01..19), slug_es, slug_en o cualquiera de sus aliases_es/aliases_en.
 */
export function getQuickProductBySlugOrAlias(slugOrId) {
  if (!slugOrId || typeof slugOrId !== 'string') return null;
  const normalized = slugOrId.trim().toLowerCase();
  const catalog = getQuickProductsCatalog();
  for (const sku of catalog) {
    if (
      sku.id.toLowerCase() === normalized ||
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
 * como todos los aliases de la matriz PRD v3.0 §6.1, garantizando 0 enlaces huérfanos.
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
 * Agrupa los 19 SKUs por avenida operativa (AV-01..AV-6A).
 */
export function getQuickProductsByAvenue() {
  const grouped = {};
  for (const key of Object.keys(AVENUE_METADATA)) {
    grouped[key] = [];
  }
  for (const sku of getQuickProductsCatalog()) {
    const key = grouped[sku.avenue] ? sku.avenue : 'avenida_1_bombeo';
    grouped[key].push(sku);
  }
  return grouped;
}

/**
 * Verifica que todos los atomic_codes referenciados en los 19 SKUs existan en atomic_parts.json.
 */
export function verifyCatalogReferentialIntegrity() {
  const validPartNumbers = new Set(
    atomicPartsCatalog.flatMap((part) => [
      String(part.part_number || '').toUpperCase(),
      String(part.code || '').toUpperCase()
    ])
  );
  const orphanCodes = [];
  for (const sku of quickCheckoutCatalog) {
    for (const code of sku.atomic_codes || []) {
      const upper = String(code).toUpperCase();
      if (!validPartNumbers.has(upper)) {
        orphanCodes.push({ skuId: sku.id, code: upper });
      }
    }
  }
  return {
    valid: orphanCodes.length === 0 && quickCheckoutCatalog.length === 19 && atomicPartsCatalog.length === 13,
    skuCount: quickCheckoutCatalog.length,
    atomicPartCount: atomicPartsCatalog.length,
    orphanCodes
  };
}

/**
 * Verifica la suryectividad de DiagramKind: que las 16 variantes de TechnicalDiagrams.astro
 * estén cubiertas por los 19 SKUs del catálogo.
 */
export function verifyDiagramSurjectivity() {
  const covered = new Set();
  for (const sku of quickCheckoutCatalog) {
    if (sku.diagram_id) covered.add(sku.diagram_id);
    if (sku.secondary_diagram_id) covered.add(sku.secondary_diagram_id);
  }
  const missing = CANONICAL_DIAGRAM_KINDS.filter((kind) => !covered.has(kind));
  return {
    surjective: missing.length === 0,
    totalKinds: CANONICAL_DIAGRAM_KINDS.length,
    coveredCount: covered.size,
    missingKinds: missing
  };
}
