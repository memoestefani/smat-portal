// tools/media_hygiene_guard.mjs — Compuerta Pura Cero-OEM y Congruencia Material-Visual (D03-C+, D04-C+, ARB-SMAT-71)
// Sin I/O de disco: verifica nombres de archivo, firmas visual_brand_audit, material_class y unicidad source_sha256 pre-recorte.

export const FORBIDDEN_BRAND_TOKENS = Object.freeze([
  'warman',
  'weir',
  'metso',
  'safematic',
  'tyler',
  'ro-tap',
  'rotap',
  'ro tap',
  'ruite',
  'longteng',
  'xkj',
  'estemon',
  'advantech',
  'copilot',
  'caterpillar',
  '0371-67315555',
  'expo',
  'weg',
  'eam028a05',
  '029a05',
  'shibo',
  'xkjgroup',
  'allpumpscn',
  'pinnxun',
  'equipo_rotatorio_laboratorio_verde',
  'celda_flotacion_mecanismo_suspendido',
  'celda_flotacion_rotor_estator_corte',
  'malla_fina_poliuretano_rojo_panel',
  'tamizador_cilindros_soporte_lab'
]);

export const FORBIDDEN_VISUAL_AUDITS = Object.freeze([
  'CAD_RENDER',
  'AI_GENERATED'
]);

export const VALID_BRAND_AUDITS = Object.freeze([
  'CLEAN_ZERO_OEM',
  'CROPPED_CLEAN_ZERO_OEM'
]);

export const SKU_EXPECTED_MATERIAL_CLASS = Object.freeze({
  'SMAT-PUMP-WETKIT-554': 'A05_METAL',
  'SMAT-PUMP-IMP-AH': 'A05_METAL',
  'SMAT-PUMP-LINERS-AH': 'BIMODAL_A05_OR_R55',
  'SMAT-PUMP-EXPELLER-KIT': 'EXPELLER_DRY_SEAL',
  'SMAT-PUMP-BRG-005M': 'SAE4140_DUCTILE_IRON',
  'SMAT-COUPLED-PUMP-CYC': 'SLURRY_PUMP_ASSEMBLY',
  'SMAT-CYC-D6-D20': 'PU_OR_SIC_CYCLONE',
  'SMAT-SCR-TH48-30': 'PU_URETHANE',
  'SMAT-SCR-MOD-1X1': 'PU_URETHANE',
  'SMAT-FILT-CLOTH-PLATE': 'PP_AND_CLOTH',
  'SMAT-FILT-SHIFTER-CHAIN': 'SHIFTER_CARRIAGE',
  'SMAT-FLOT-MECH-18SP': 'FLOTATION_MECHANISM',
  'SMAT-LAB-MARCY-1000': 'LAB_METROLOGY_STEEL',
  'SMAT-LAB-VASO-1000': 'STAINLESS_304',
  'SMAT-LAB-TAMIZ-E11': 'BRASS_WIRE_SIEVE',
  'SMAT-LAB-ROTAP-MECH': 'LAB_SIEVE_SHAKER',
  'SMAT-LAB-PLATO-TENT': 'STAINLESS_PAN',
  'SMAT-LAB-PULV-DISC': 'CR_NI_GRINDING_DISC',
  'SMAT-LAB-FILTRO-BATCH': 'LAB_PRESSURE_FILTER',
  'SMAT-CRUSH-JAW-CONE': 'MN18_CRUSHER',
  'SMAT-MILL-BALL-LINER': 'CRMO_MILL_LINER',
  'SMAT-THICK-MECH': 'THICKENER_DRIVE',
  'SMAT-PUMP-VERT-SP': 'VERTICAL_SLURRY_PUMP'
});

export function findForbiddenBrandToken(text) {
  const lower = String(text || '').toLowerCase();
  for (const token of FORBIDDEN_BRAND_TOKENS) {
    if (lower.includes(token)) {
      return token;
    }
  }
  return null;
}

export function assertZeroOemTextOrPath(value, contextLabel) {
  const hit = findForbiddenBrandToken(value);
  if (hit) {
    throw new Error(`[E_OEM_TRADEMARK_LEAK] ${contextLabel} contiene token prohibido '${hit}': ${value}`);
  }
}

export function assertEntryHygiene(entry, expectedMaterialClass, contextLabel) {
  if (!entry || !entry.relPath) {
    throw new Error(`[E_MISSING_MEDIA_ENTRY] ${contextLabel} carece de relPath`);
  }
  assertZeroOemTextOrPath(entry.relPath, `${contextLabel}.relPath`);
  assertZeroOemTextOrPath(entry.captionEs || '', `${contextLabel}.captionEs`);
  assertZeroOemTextOrPath(entry.captionEn || '', `${contextLabel}.captionEn`);

  const rawAudit = String(entry.visual_brand_audit || '').toUpperCase();
  const rawOrigin = String(entry.origin || '').toUpperCase();
  if (FORBIDDEN_VISUAL_AUDITS.includes(rawAudit) || FORBIDDEN_VISUAL_AUDITS.includes(rawOrigin)) {
    throw new Error(`[E_CAD_OR_AI_RENDER_VETOED] ${contextLabel} bloqueado por política v9.0 cero-CAD/IA`);
  }
  if (!VALID_BRAND_AUDITS.includes(entry.visual_brand_audit)) {
    throw new Error(
      `[E_UNAUDITED_BRAND_IMAGE] ${contextLabel} requiere visual_brand_audit válido (${VALID_BRAND_AUDITS.join('|')}), recibido: ${entry.visual_brand_audit}`
    );
  }
  if (!entry.material_class || typeof entry.material_class !== 'string') {
    throw new Error(`[E_MISSING_MATERIAL_CLASS] ${contextLabel} carece de material_class`);
  }
  if (expectedMaterialClass && entry.material_class !== expectedMaterialClass) {
    throw new Error(
      `[E_MATERIAL_CLASS_MISMATCH] ${contextLabel} declara '${entry.material_class}' pero el SKU exige '${expectedMaterialClass}'`
    );
  }
}

export function assertUniqueSourceSha256(entries) {
  const seen = new Map();
  for (const entry of entries) {
    if (!entry.source_sha256) {
      throw new Error(`[E_MISSING_SOURCE_SHA256] ${entry.id || entry.label} carece de source_sha256`);
    }
    if (seen.has(entry.source_sha256)) {
      throw new Error(
        `[E_SOURCE_SHA256_CLONE] '${entry.id || entry.label}' clona el archivo original de '${seen.get(entry.source_sha256)}' antes de recorte/rotación`
      );
    }
    seen.set(entry.source_sha256, entry.id || entry.label);
  }
}

export function validateMediaGallerySpec(specDoc, catalogSkus, atomicParts) {
  if (!specDoc || typeof specDoc !== 'object') {
    throw new Error('[E_INVALID_GALLERY_SPEC] media_gallery_spec.json inválido');
  }
  const seenSkuDirs = new Set();
  for (const sku of catalogSkus) {
    const skuKey = sku.sku_id || sku.id;
    seenSkuDirs.add(skuKey);
    const gallery = specDoc.sku_galleries?.[skuKey];
    if (!gallery || !Array.isArray(gallery.slides) || gallery.slides.length === 0) {
      throw new Error(`[E_MISSING_SKU_GALLERY] Falta galería para ${skuKey}`);
    }
    const expectedMaterial = SKU_EXPECTED_MATERIAL_CLASS[skuKey] || null;
    gallery.slides.forEach((slide, idx) => {
      assertEntryHygiene(slide, idx === 0 ? expectedMaterial : slide.material_class ? expectedMaterial : null, `${skuKey}[${idx}]`);
    });
  }
  for (const item of specDoc.almacen_gallery || []) {
    assertZeroOemTextOrPath(item.fileName || '', `almacen[${item.id}].fileName`);
    assertEntryHygiene(item, null, `almacen[${item.id}]`);
  }
  for (const part of atomicParts || []) {
    const code = String(part.code || '').toLowerCase();
    const spec = specDoc.atomic_parts?.[code];
    assertEntryHygiene(spec, null, `atomic_parts[${code}]`);
  }
  return { checkedSkus: seenSkuDirs.size, checkedAtomic: (atomicParts || []).length };
}

export function assertAlmacenPhotoReuseCap(routeImageMap, maxUses = 2) {
  const counts = new Map();
  for (const [routeFamily, images] of Object.entries(routeImageMap || {})) {
    const uniqueInRoute = new Set(
      (Array.isArray(images) ? images : [images])
        .map((src) => String(src || '').trim())
        .filter((src) => src.includes('/images/almacen/'))
    );
    for (const img of uniqueInRoute) {
      const list = counts.get(img) || [];
      list.push(routeFamily);
      counts.set(img, list);
    }
  }
  for (const [img, routes] of counts.entries()) {
    if (routes.length > maxUses) {
      throw new Error(
        `[E_ALMACEN_REUSE_CAP] ${img} aparece en ${routes.length} familias de ruta (> ${maxUses}): ${routes.join(', ')}`
      );
    }
  }
  return { checkedImages: counts.size, maxUses };
}

export function assertSiblingVerticalDhashSeparation(primaryRecords, catalogSkus, minHamming = 8) {
  const verticalMap = new Map(
    (catalogSkus || []).map((s) => [String(s.sku_id || s.id), String(s.vertical || '')])
  );
  const violations = [];
  for (let i = 0; i < (primaryRecords || []).length; i += 1) {
    for (let j = i + 1; j < primaryRecords.length; j += 1) {
      const a = primaryRecords[i];
      const b = primaryRecords[j];
      const va = verticalMap.get(a.id);
      const vb = verticalMap.get(b.id);
      if (va && va === vb && a.dhash64 && b.dhash64) {
        let diff = BigInt(`0x${a.dhash64}`) ^ BigInt(`0x${b.dhash64}`);
        let dist = 0;
        while (diff > 0n) {
          dist += Number(diff & 1n);
          diff >>= 1n;
        }
        if (dist < minHamming) {
          violations.push({ a: a.id, b: b.id, vertical: va, dist });
        }
      }
    }
  }
  if (violations.length > 0) {
    const first = violations[0];
    throw new Error(
      `[E_SIBLING_VISUAL_CLONE] SKUs hermanos en '${first.vertical}' casi gemelos (${first.a} vs ${first.b}, Hamming=${first.dist} < ${minHamming})`
    );
  }
  return { checked: (primaryRecords || []).length, minHamming };
}
