/**
 * catalogFacetedViewModel.js
 * ---------------------------------------------------------------------------
 * ViewModel puro de preparación SSR para `CatalogFacetedIsland.astro` (SLICE-V52-03).
 * Importa `getAtomicPartSpecs` directamente desde `districtProfilesAndSkuCatalog.js`
 * evitando re-exportaciones ambiguas `export *` bajo Vite SSR, y formatea rangos
 * numéricos para erradicar concatenaciones de arreglos en plantilla.
 */

import {
  PIPE_SERIES_DIAMETER_MM,
  PIPE_DIAMETERS_MM,
  WET_END_MATERIAL_MATRIX,
} from './slurryEngine.js';
import {
  ATOMIC_PARTS_CATALOG,
  getAtomicPartSpecs,
  formatNioshErgonomicStatus,
} from './districtProfilesAndSkuCatalog.js';
import { buildWizardUrl } from './workbenchBus.js';
import {
  AVENUE_METADATA,
  getQuickProductsByAvenue,
  verifyCatalogReferentialIntegrity,
  verifyDiagramSurjectivity,
} from './quickProductsCatalog.js';

export const CATALOG_ATOMIC_PARTS_COUNT = Array.isArray(ATOMIC_PARTS_CATALOG)
  ? ATOMIC_PARTS_CATALOG.length
  : 13;

function formatCatalogRange(val, locale = 'es') {
  if (!Array.isArray(val) || val.length < 2) return String(val ?? '');
  const nfLocale = locale === 'en' ? 'en-US' : 'es-MX';
  const a = Number(val[0]);
  const b = Number(val[1]);
  const fa = Number.isFinite(a) ? a.toLocaleString(nfLocale) : String(val[0]);
  const fb = Number.isFinite(b) ? b.toLocaleString(nfLocale) : String(val[1]);
  return `${fa}–${fb}`;
}

const CATALOG_FAMILY_CHIPS = Object.freeze([
  { id: 'all', labelEs: 'Todas las Líneas (19)', labelEn: 'All Lines (19)' },
  { id: 'bombeo', labelEs: 'Bombas y Extremo Húmedo', labelEn: 'Pumps & Wet-End' },
  { id: 'sello_potencia', labelEs: 'Sello Expulsor y Soporte', labelEn: 'Expeller Seal & Bearing' },
  { id: 'clasificacion', labelEs: 'Hidrociclones y Cribas', labelEn: 'Cyclones & Screens' },
  { id: 'flotacion', labelEs: 'Flotación', labelEn: 'Flotation' },
  { id: 'filtracion', labelEs: 'Filtros Prensa', labelEn: 'Filter Presses' },
  { id: 'control', labelEs: 'Metrología y Balanzas', labelEn: 'Metrology & Scales' },
  { id: 'tamices', labelEs: 'Tamices ASTM E11 y Ro-Tap', labelEn: 'ASTM E11 Sieves & Ro-Tap' },
]);

/**
 * Construye el modelo de vista completo para el catálogo facetado bilingüe.
 * @param {{ atomicParts?: Array<any>, rolesData?: any, locale?: 'es'|'en' }} [options]
 */
export function buildCatalogFacetedViewModel({
  atomicParts = ATOMIC_PARTS_CATALOG,
  rolesData = { verticals: [] },
  locale = 'es',
} = {}) {
  const lang = locale === 'en' ? 'en' : 'es';

  const rawMaterials = [
    ...Object.values(WET_END_MATERIAL_MATRIX),
    ...(WET_END_MATERIAL_MATRIX.hybrid_a05_r55 ? [WET_END_MATERIAL_MATRIX.hybrid_a05_r55] : []),
  ];
  const seenKeys = new Set();
  const wetEndMaterialsList = [];
  for (const mat of rawMaterials) {
    if (!mat || seenKeys.has(mat.key)) continue;
    seenKeys.add(mat.key);
    wetEndMaterialsList.push({
      ...mat,
      d80RangeMicrons: formatCatalogRange(mat.d80RangeMicrons, lang),
      phRange: formatCatalogRange(mat.phRange, lang),
    });
  }

  const quickByAvenue = getQuickProductsByAvenue();
  const avenueMetaMap = AVENUE_METADATA;
  const avenueKeys = Object.keys(AVENUE_METADATA);
  const catalogIntegrity = verifyCatalogReferentialIntegrity();
  const diagramSurjectivity = verifyDiagramSurjectivity();
  const canonicalSeriesCount = Object.keys(PIPE_DIAMETERS_MM).length;
  const totalCatalogSkusCount = Object.values(quickByAvenue).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const verticals = Array.isArray(rolesData?.verticals) ? rolesData.verticals : [];
  const bombeoVertical = verticals.find((v) => v.id === 'bombeo');
  const bombeoPowerRange = bombeoVertical?.capex?.[0]?.power_range || '30 HP a 250 HP';
  const flotationVertical = verticals.find((v) => v.id === 'flotacion');
  const flotationPowerRange = flotationVertical?.capex?.[0]?.power_range || '15 HP a 60 HP';
  const filtrationVertical = verticals.find((v) => v.id === 'filtracion');
  const filtrationPowerRange = filtrationVertical?.capex?.[0]?.power_range || '16 bar';
  const controlVertical = verticals.find((v) => v.id === 'control_procesos' || v.id === 'balanzas_marcy');
  const controlProcessItems = controlVertical
    ? [...(controlVertical.capex || []), ...(controlVertical.opex || [])]
    : [];

  const enrichedAtomicParts = (Array.isArray(atomicParts) ? atomicParts : []).map((part) => {
    const spec = getAtomicPartSpecs(part.part_number, '6x4');
    const niosh = formatNioshErgonomicStatus(spec, lang);
    const quoteHref = buildWizardUrl({
      lang,
      circuit: 'bombeo',
      role: spec.role,
      code: part.part_number,
      series: spec.pipe_size || '6x4',
      station: spec.station,
      material: part.part_number === 'DAM005' ? undefined : 'alto_cromo_cr27',
      weightKg: spec.weight_kg,
      arrangement: 'CV',
    });
    return { ...part, spec, niosh, quoteHref };
  });

  const seriesRows = [
    {
      key: '1.5x1',
      label: '1.5x1"',
      dimsEs: `1.5" (${PIPE_SERIES_DIAMETER_MM['1.5x1']} mm) × 1" (25 mm)`,
      dimsEn: `1.5" (${PIPE_SERIES_DIAMETER_MM['1.5x1']} mm) × 1" (25 mm)`,
      flow: '7 – 28 m³/h',
      head: '8 – 35 m',
      topSize: '14 mm',
      power: '5 – 15 HP (3.7-11 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / Poliuretano / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / Polyurethane / SiC',
      appEs: 'Muestreo metalúrgico, plantas piloto y rebose de espuma.',
      appEn: 'Metallurgical sampling, pilot plants, and froth overflow.',
    },
    {
      key: '2x1.5',
      label: '2x1.5"',
      dimsEs: `2" (${PIPE_SERIES_DIAMETER_MM['2x1.5']} mm) × 1.5" (40 mm)`,
      dimsEn: `2" (${PIPE_SERIES_DIAMETER_MM['2x1.5']} mm) × 1.5" (40 mm)`,
      flow: '15 – 55 m³/h',
      head: '10 – 40 m',
      topSize: '19 mm',
      power: '10 – 20 HP (7.5-15 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / Poliuretano / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / Polyurethane / SiC',
      appEs: 'Dosificación de lechada de cal, reactivos y limpieza cleaner.',
      appEn: 'Milk-of-lime dosing, reagents, and cleaner circuit duty.',
    },
    {
      key: '3x2',
      label: '3x2"',
      dimsEs: `3" (${PIPE_SERIES_DIAMETER_MM['3x2']} mm) × 2" (50 mm)`,
      dimsEn: `3" (${PIPE_SERIES_DIAMETER_MM['3x2']} mm) × 2" (50 mm)`,
      flow: '25 – 105 m³/h',
      head: '12 – 45 m',
      topSize: '22 mm',
      power: '15 – 30 HP (11-22 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / Poliuretano / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / Polyurethane / SiC',
      appEs: 'Transferencia de concentrados finales y sumideros de piso.',
      appEn: 'Final concentrate transfer and plant floor sump service.',
    },
    {
      key: '4x3',
      label: '4x3"',
      dimsEs: `4" (${PIPE_SERIES_DIAMETER_MM['4x3']} mm) × 3" (75 mm)`,
      dimsEn: `4" (${PIPE_SERIES_DIAMETER_MM['4x3']} mm) × 3" (75 mm)`,
      flow: '50 – 180 m³/h',
      head: '10 – 45 m',
      topSize: '28 mm',
      power: '30 – 50 HP (22-37 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / Poliuretano / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / Polyurethane / SiC',
      appEs: 'Alimentación a celdas, sumideros y circuitos de finos.',
      appEn: 'Flotation cell feed, sumps, and fine slurry circuits.',
    },
    {
      key: '6x4',
      label: '6x4"',
      highlight: true,
      dimsEs: `6" (${PIPE_SERIES_DIAMETER_MM['6x4']} mm) × 4" (100 mm)`,
      dimsEn: `6" (${PIPE_SERIES_DIAMETER_MM['6x4']} mm) × 4" (100 mm)`,
      flow: '150 – 450 m³/h',
      head: '15 – 60 m',
      topSize: '45 mm',
      power: '50 – 100 HP (37-75 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / Poliuretano / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / Polyurethane / SiC',
      appEs: 'Descarga de molinos SAG a batería de hidrociclones.',
      appEn: 'SAG and ball mill discharge to hydrocyclone cluster.',
    },
    {
      key: '8x6',
      label: '8x6"',
      dimsEs: `8" (${PIPE_SERIES_DIAMETER_MM['8x6']} mm) × 6" (150 mm)`,
      dimsEn: `8" (${PIPE_SERIES_DIAMETER_MM['8x6']} mm) × 6" (150 mm)`,
      flow: '350 – 900 m³/h',
      head: '20 – 70 m',
      topSize: '63 mm',
      power: '100 – 200 HP (75-150 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / SiC',
      appEs: 'Molienda primaria y bombeo de jales espesados.',
      appEn: 'Primary grinding circuit and thickened tailings transfer.',
    },
    {
      key: '10x8',
      label: '10x8"',
      dimsEs: `10" (${PIPE_SERIES_DIAMETER_MM['10x8']} mm) × 8" (200 mm)`,
      dimsEn: `10" (${PIPE_SERIES_DIAMETER_MM['10x8']} mm) × 8" (200 mm)`,
      flow: '700 – 1,200 m³/h',
      head: '25 – 80 m',
      topSize: '86 mm',
      power: '150 – 250 HP (110-185 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / SiC',
      appEs: 'Gran caudal de relaves y concentradoras >1,500 t/d.',
      appEn: 'High-volume tailings duty and concentrators >1,500 t/d.',
    },
    {
      key: '12x10',
      label: '12x10"',
      dimsEs: `12" (${PIPE_SERIES_DIAMETER_MM['12x10']} mm) × 10" (250 mm)`,
      dimsEn: `12" (${PIPE_SERIES_DIAMETER_MM['12x10']} mm) × 10" (250 mm)`,
      flow: '1,100 – 2,200 m³/h',
      head: '25 – 85 m',
      topSize: '95 mm',
      power: '250 – 450 HP (185-335 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / SiC',
      appEs: 'Alimentación primaria a hidrociclones y descarga de molinos SAG.',
      appEn: 'Primary hydrocyclone cluster feed and SAG mill discharge.',
    },
    {
      key: '14x12',
      label: '14x12"',
      dimsEs: `14" (${PIPE_SERIES_DIAMETER_MM['14x12']} mm) × 12" (300 mm)`,
      dimsEn: `14" (${PIPE_SERIES_DIAMETER_MM['14x12']} mm) × 12" (300 mm)`,
      flow: '1,600 – 3,400 m³/h',
      head: '25 – 90 m',
      topSize: '110 mm',
      power: '400 – 650 HP (300-485 kW)',
      materialsEs: 'Alto Cromo (>650 HB) / Hule / SiC',
      materialsEn: 'High Chrome (>650 HB) / Rubber / SiC',
      appEs: 'Mega-concentradoras y conducción principal de relaves espesados.',
      appEn: 'Large-scale concentrators and main thickened tailings pipelines.',
    },
  ];

  return {
    atomicPartsCount: CATALOG_ATOMIC_PARTS_COUNT,
    wetEndMaterialsList,
    quickByAvenue,
    avenueMetaMap,
    avenueKeys,
    catalogIntegrity,
    diagramSurjectivity,
    canonicalSeriesCount,
    totalCatalogSkusCount,
    bombeoPowerRange,
    flotationPowerRange,
    filtrationPowerRange,
    controlProcessItems,
    enrichedAtomicParts,
    seriesRows,
    familyChips: CATALOG_FAMILY_CHIPS,
  };
}
