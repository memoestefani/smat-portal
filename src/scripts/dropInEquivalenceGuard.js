/**
 * dropInEquivalenceGuard.js
 * ---------------------------------------------------------------------------
 * Verificador Cero-OEM de Equivalencia Geométrica Drop-In (Anti-Luis, PRD v3.2 §6.5 / D7 = 7-C+ / ARB-SMAT-37).
 * Implementa normalización morfológica en 2 etapas (raíz geométrica + sufijo de aleación)
 * y tabla de dispersión estática FNV-1a de 32 bits indexada únicamente por digest hexadecimal
 * de 8 caracteres (0 raíces OEM en texto plano en el bundle JS).
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
 * Índice estático FNV-1a (32-bit hex) -> Descriptor SKU SMAT.
 * Ninguna raíz alfanumérica de catálogo tercero aparece en texto plano.
 */
export const FNV1A_HASH_TO_SKU_INDEX = Object.freeze({
  '4a405f7c': { canonicalSkuId: 'SMAT-PUMP-IMP-AH', defaultAlloy: 'A05' },
  '94fbebd4': { canonicalSkuId: 'SMAT-PUMP-IMP-AH', defaultAlloy: 'A05' },
  'a15f61b7': { canonicalSkuId: 'SMAT-PUMP-IMP-AH', defaultAlloy: 'A05' },
  '0603597c': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  'db47ff84': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  '70894c37': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  '9c5acb3f': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  '4ff0718c': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  '5f77e853': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  '1b71597b': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  '26782691': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'A05' },
  'd1f7f9f7': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  '5d712968': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  'f938d47f': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  'f7cf7fb5': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'C21', preserveCompound: true },
  'f8729c8a': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'C21', preserveCompound: true },
  '3ac4b4d3': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'C21' },
  'd0f7f864': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  '9a69d2a3': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  '151af932': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  '70337fa6': { canonicalSkuId: 'SMAT-PUMP-BRG-005M', defaultAlloy: 'A05' },
  '454d2390': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'R55' },
  '597361b3': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'R55' },
  'a56c228b': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'R55' },
  'c1f5a230': { canonicalSkuId: 'SMAT-PUMP-LINERS-AH', defaultAlloy: 'R55' },
  'e9c72cdb': { canonicalSkuId: 'SMAT-PUMP-WETKIT-554', defaultAlloy: 'A05' },
  '52c08b7f': { canonicalSkuId: 'SMAT-SCR-MOD-1X1', defaultAlloy: 'R55' },
  '4cb60e87': { canonicalSkuId: 'SMAT-SCR-MOD-1X1', defaultAlloy: 'PU' },
  'b8f77e2d': { canonicalSkuId: 'SMAT-PUMP-EXPELLER-KIT', defaultAlloy: 'A05' },
  '22edcebd': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'SiC' },
  '1dedc6de': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'SiC' },
  '08efe466': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'SiC' },
  'd97f564a': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'SiC' },
  '5c82631a': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'SiC' },
  '89ed8e6e': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'SiC' },
  '89ed2464': { canonicalSkuId: 'SMAT-SCR-TH48-30', defaultAlloy: 'PU' },
  '3b662972': { canonicalSkuId: 'SMAT-CYC-D6-D20', defaultAlloy: 'PU' },
  '6dd62e30': { canonicalSkuId: 'SMAT-FLOT-MECH-18SP', defaultAlloy: 'PU' },
  'c53ed335': { canonicalSkuId: 'SMAT-FLOT-MECH-18SP', defaultAlloy: 'PU' },
  '229ffa93': { canonicalSkuId: 'SMAT-LAB-PULV-DISC', defaultAlloy: 'R55' },
  'f367e5a3': { canonicalSkuId: 'SMAT-LAB-FILTRO-BATCH', defaultAlloy: 'R55' },
  '01613a6c': { canonicalSkuId: 'SMAT-FILT-CLOTH-PLATE', defaultAlloy: 'PU' },
  '673b2285': { canonicalSkuId: 'SMAT-FILT-CLOTH-PLATE', defaultAlloy: 'R55' },
  '68cabe03': { canonicalSkuId: 'SMAT-LAB-MARCY-1000', defaultAlloy: 'A49' }
});

/**
 * Normalización morfológica en 2 etapas para números de parte de campo:
 * Etapa 1: Limpieza alfanumérica en mayúsculas.
 * Etapa 2: Separación de sufijo metalúrgico/elastomérico (A05, R55, C21, SiC, PU, etc.)
 *          preservando raíces compuestas registradas directamente en FNV1A_HASH_TO_SKU_INDEX.
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

  const directHash = fnv1a32DropInHash(cleaned);
  const directEntry = FNV1A_HASH_TO_SKU_INDEX[directHash];
  if (directEntry && directEntry.preserveCompound) {
    return {
      cleaned,
      baseRoot: cleaned,
      alloySuffix: directEntry.defaultAlloy,
      fnv1aHash: directHash
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
    fnv1aHash: directHash
  };
}

/**
 * Verifica instantáneamente si un código de campo tiene reemplazo Drop-In SMAT
 * consultando exclusivamente el índice hash FNV-1a (0 raíces en texto plano).
 */
export function verifyDropInEquivalence(rawInput) {
  const stage = normalizePartTokenTwoStage(rawInput);
  if (!stage.baseRoot) {
    return {
      matched: false,
      query: rawInput,
      reasonEs: 'Ingresa el código fundido en relieve de tu pieza actual o las dimensiones (A, B, C).',
      reasonEn: 'Enter the cast relief code from your current wear part or dimensions (A, B, C).'
    };
  }

  const cleanedHash = fnv1a32DropInHash(stage.cleaned);
  let matchMeta = FNV1A_HASH_TO_SKU_INDEX[stage.fnv1aHash] || FNV1A_HASH_TO_SKU_INDEX[cleanedHash];
  let sku = matchMeta
    ? getQuickProductBySlugOrAlias(matchMeta.canonicalSkuId)
    : getQuickProductBySlugOrAlias(rawInput);

  if (!sku) {
    const catalog = getQuickProductsCatalog();
    sku = catalog.find(
      (item) =>
        (item.atomic_codes || []).some(
          (c) => fnv1a32DropInHash(c) === stage.fnv1aHash || fnv1a32DropInHash(c) === cleanedHash
        ) ||
        (stage.cleaned.length >= 5 &&
          String(item.sku_id || item.id || '')
            .replace(/[^A-Z0-9]/gi, '')
            .toUpperCase()
            .includes(stage.cleaned))
    );
    if (sku) {
      matchMeta = {
        canonicalSkuId: sku.sku_id || sku.id,
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
    smatSkuId: sku.legacy_sku_id || sku.id,
    canonicalSkuId: (matchMeta && matchMeta.canonicalSkuId) || sku.sku_id || sku.id,
    atomicCode: stage.baseRoot || (sku.atomic_codes && sku.atomic_codes[0]) || null,
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
