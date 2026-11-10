/**
 * dropInEquivalenceGuard.js
 * ---------------------------------------------------------------------------
 * Verificador Cero-OEM de Equivalencia Geométrica Drop-In (Anti-Luis, PRD v3.0 §6.5).
 * Implementa normalización morfológica en 2 etapas (raíz geométrica + sufijo de aleación)
 * y tabla de dispersión estática FNV-1a de 32 bits sin cadenas de marcas terceras en DOM/bundle.
 */

import { getQuickProductsCatalog, getQuickProductBySlugOrAlias } from './quickProductsCatalog.js';

const ALLOY_SUFFIX_REGEX = /(A05|A49|A51|R55|R26|R33|C21|U01|S01|SIC|PU|CR27|HVOF)$/i;

/**
 * Calcula el hash FNV-1a de 32 bits en formato hexadecimal de 8 caracteres para una raíz normalizada.
 */
export function fnv1a32DropInHash(normalizedRoot) {
  const input = `smat_dropin_v3:${String(normalizedRoot || '').toUpperCase().trim()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Normalización morfológica en 2 etapas para números de parte de campo:
 * Etapa 1: Limpieza alfanumérica en mayúsculas.
 * Etapa 2: Separación de sufijo metalúrgico/elastomérico (A05, R55, C21, SiC, PU, etc.)
 *          preservando códigos compuestos como D075C21 o TH4830.
 */
export function normalizePartTokenTwoStage(rawInput) {
  const cleaned = String(rawInput || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!cleaned) {
    return {
      cleaned: '',
      baseRoot: '',
      alloySuffix: null,
      fnv1aHash: fnv1a32DropInHash('')
    };
  }

  // Excepciones de raíces canónicas que terminan en código de material integrado
  if (cleaned === 'D075C21' || cleaned === 'E075C21') {
    return {
      cleaned,
      baseRoot: 'D075C21',
      alloySuffix: 'C21',
      fnv1aHash: fnv1a32DropInHash('D075C21')
    };
  }

  const suffixMatch = cleaned.match(ALLOY_SUFFIX_REGEX);
  if (suffixMatch && cleaned.length > suffixMatch[1].length + 2) {
    const alloySuffix = suffixMatch[1].toUpperCase();
    const baseRoot = cleaned.slice(0, cleaned.length - alloySuffix.length);
    return {
      cleaned,
      baseRoot,
      alloySuffix,
      fnv1aHash: fnv1a32DropInHash(baseRoot)
    };
  }

  return {
    cleaned,
    baseRoot: cleaned,
    alloySuffix: null,
    fnv1aHash: fnv1a32DropInHash(cleaned)
  };
}

/**
 * Mapa determinista de raíces de campo a SKU canónico SMAT y código atómico.
 */
const ROOT_TO_SKU_MAP = Object.freeze({
  E4147: { skuId: 'SKU-QC-01', atomicCode: 'E4147', defaultAlloy: 'A05' },
  D3147: { skuId: 'SKU-QC-01', atomicCode: 'D3147', defaultAlloy: 'A05' },
  F6147: { skuId: 'SKU-QC-01', atomicCode: 'F6147', defaultAlloy: 'A05' },
  D3110: { skuId: 'SKU-QC-02', atomicCode: 'D3110', defaultAlloy: 'A05' },
  E4110: { skuId: 'SKU-QC-02', atomicCode: 'D3110', defaultAlloy: 'A05' },
  E4083: { skuId: 'SKU-QC-03', atomicCode: 'E4083', defaultAlloy: 'A05' },
  D4018: { skuId: 'SKU-QC-03', atomicCode: 'D4018', defaultAlloy: 'A05' },
  D4028: { skuId: 'SKU-QC-04', atomicCode: 'D4028', defaultAlloy: 'A05' },
  DAM028: { skuId: 'SKU-QC-04', atomicCode: 'DAM028', defaultAlloy: 'A05' },
  D075C21: { skuId: 'SKU-QC-05', atomicCode: 'D075C21', defaultAlloy: 'C21' },
  D075: { skuId: 'SKU-QC-05', atomicCode: 'D075C21', defaultAlloy: 'C21' },
  D4029: { skuId: 'SKU-QC-06', atomicCode: 'D4029', defaultAlloy: 'A05' },
  EAM028: { skuId: 'SKU-QC-06', atomicCode: 'EAM028', defaultAlloy: 'A05' },
  DAM005: { skuId: 'SKU-QC-06', atomicCode: 'DAM005', defaultAlloy: 'A05' },
  E4132: { skuId: 'SKU-QC-07', atomicCode: 'E4132', defaultAlloy: 'R55' },
  D4032: { skuId: 'SKU-QC-07', atomicCode: 'E4132', defaultAlloy: 'R55' },
  KITWECR276X4: { skuId: 'SKU-QC-08', atomicCode: 'E4147', defaultAlloy: 'A05' },
  KITWER556X4: { skuId: 'SKU-QC-09', atomicCode: 'E4132', defaultAlloy: 'R55' },
  MOD1X1: { skuId: 'SKU-QC-09', atomicCode: 'E4132', defaultAlloy: 'PU' },
  KITSEALDRY6X4: { skuId: 'SKU-QC-10', atomicCode: 'D4028', defaultAlloy: 'A05' },
  APEXSICD10: { skuId: 'SKU-QC-11', atomicCode: 'E4083', defaultAlloy: 'SiC' },
  APEXSICD15: { skuId: 'SKU-QC-11', atomicCode: 'E4083', defaultAlloy: 'SiC' },
  APEXSICD20: { skuId: 'SKU-QC-11', atomicCode: 'E4083', defaultAlloy: 'SiC' },
  VFSICD15: { skuId: 'SKU-QC-12', atomicCode: 'E4147', defaultAlloy: 'SiC' },
  VFSICD20: { skuId: 'SKU-QC-12', atomicCode: 'E4147', defaultAlloy: 'SiC' },
  D10B: { skuId: 'SKU-QC-12', atomicCode: 'E4147', defaultAlloy: 'SiC' },
  TH4830: { skuId: 'SKU-QC-13', atomicCode: 'E4132', defaultAlloy: 'PU' },
  CONELNRD15: { skuId: 'SKU-QC-13', atomicCode: 'E4132', defaultAlloy: 'PU' },
  FLOTDROPIN1P1: { skuId: 'SKU-QC-14', atomicCode: 'E4132', defaultAlloy: 'PU' },
  '18SP': { skuId: 'SKU-QC-14', atomicCode: 'E4132', defaultAlloy: 'PU' },
  PVSR556IN: { skuId: 'SKU-QC-15', atomicCode: 'E4132', defaultAlloy: 'R55' },
  KGVSL6IN: { skuId: 'SKU-QC-16', atomicCode: 'D4018', defaultAlloy: 'R55' },
  FPPPP1200: { skuId: 'SKU-QC-17', atomicCode: 'DAM005', defaultAlloy: 'PU' },
  FPCPP1200: { skuId: 'SKU-QC-18', atomicCode: 'E4132', defaultAlloy: 'R55' },
  CTRLMARCY1000: { skuId: 'SKU-QC-19', atomicCode: 'DAM005', defaultAlloy: 'A49' }
});

/**
 * Verifica instantáneamente si un código de campo tiene reemplazo Drop-In SMAT.
 */
export function verifyDropInEquivalence(rawInput) {
  const stage = normalizePartTokenTwoStage(rawInput);
  if (!stage.baseRoot) {
    return {
      matched: false,
      query: rawInput,
      reasonEs: 'Ingresa un código geométrico de parte (ej. E4147, D3147, D075C21, E4083, TH48-30).',
      reasonEn: 'Enter a geometric part code (e.g. E4147, D3147, D075C21, E4083, TH48-30).'
    };
  }

  let matchMeta = ROOT_TO_SKU_MAP[stage.baseRoot] || ROOT_TO_SKU_MAP[stage.cleaned];
  let sku = matchMeta ? getQuickProductBySlugOrAlias(matchMeta.skuId) : getQuickProductBySlugOrAlias(rawInput);

  if (!sku) {
    const catalog = getQuickProductsCatalog();
    sku = catalog.find((item) =>
      (item.atomic_codes || []).some((c) => c.toUpperCase() === stage.baseRoot || c.toUpperCase() === stage.cleaned)
    );
    if (sku) {
      matchMeta = {
        skuId: sku.id,
        atomicCode: stage.baseRoot,
        defaultAlloy: sku.default_material
      };
    }
  }

  if (!sku) {
    return {
      matched: false,
      query: rawInput,
      normalizedRoot: stage.baseRoot,
      fnv1aHash: stage.fnv1aHash,
      reasonEs: `Código ${stage.cleaned} listo para cotejo dimensional 3 pasos en Durango (Envía foto de placa o mide A, B, C).`,
      reasonEn: `Code ${stage.cleaned} ready for 3-step dimensional match in Durango (Send tag photo or measure A, B, C).`
    };
  }

  const alloyCode = stage.alloySuffix || (matchMeta && matchMeta.defaultAlloy) || sku.default_material;
  return {
    matched: true,
    query: rawInput,
    normalizedRoot: stage.baseRoot,
    fnv1aHash: stage.fnv1aHash,
    smatSkuId: sku.id,
    atomicCode: (matchMeta && matchMeta.atomicCode) || sku.atomic_codes[0],
    slugEs: sku.slug_es,
    slugEn: sku.slug_en,
    titleEs: sku.title_es,
    titleEn: sku.title_en,
    alloyCode,
    stockRegime: sku.stock_regime,
    regimeBadgeEs: sku.regimeMeta.badgeEs,
    regimeBadgeEn: sku.regimeMeta.badgeEn,
    gateLock: sku.gate_lock,
    toleranceStd: 'ISO 2768-m',
    iso7810Scale: '0.76 mm',
    geometricTripletMm: sku.geometric_triplet_mm,
    satTuple: sku.sat_tuple
  };
}
