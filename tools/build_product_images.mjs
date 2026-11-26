// tools/build_product_images.mjs — Pipeline Determinista de Fotografía Multiángulo y Almacén SMAT (V7.0)
// Genera desde archivos locales verificados:
//   - public/images/productos/<slug_es>.webp + -v2.webp, -v3.webp (<= 45 KB, 640x480)
//   - public/images/almacen/<fileName>.webp (5 fotos exclusivas sin clones SHA-256)
//   - public/images/partes/<code>.webp (13 fotos dedicadas de piezas atómicas)
// Auditando unicidad 19/19 en fuentes/SHA-256/dHash64 (Hamming >= 8) y 0 clones cruzados con almacen/.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { assertUniqueSourceSha256, validateMediaGallerySpec } from './media_hygiene_guard.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json');
const ATOMIC_PARTS_PATH = path.join(SITE_ROOT, 'data/atomic_parts.json');
const GALLERY_SPEC_PATH = path.join(SITE_ROOT, 'data/media_gallery_spec.json');
const OUTPUT_DIR = path.join(SITE_ROOT, 'public/images/productos');
const ALMACEN_DIR = path.join(SITE_ROOT, 'public/images/almacen');
const PARTES_DIR = path.join(SITE_ROOT, 'public/images/partes');
const MEMO_ROOT = path.resolve(SITE_ROOT, '../../2_smat/ideas/PAGINA SMAT MEMO');
const FOTOS_ROOT = path.resolve(SITE_ROOT, '../../2_smat/ideas/fotos_sitio');
const CURADA_ROOT = path.resolve(SITE_ROOT, '../../2_smat/ideas/fototeca_curada_smat/01_APROBADAS_LIMPIAS');

const MAX_WEBP_BYTES = 45 * 1024; // 46080 bytes (estricto <= 45 KB)
const MAX_HD_WEBP_BYTES = 120 * 1024; // 122880 bytes (estricto <= 120 KB para Lightbox HD lazy)

function readGallerySpec() {
  return JSON.parse(fs.readFileSync(GALLERY_SPEC_PATH, 'utf8'));
}

const initialSpec = readGallerySpec();

export const SKU_TO_CURATED_PHOTO_SPEC = Object.freeze(
  Object.fromEntries(
    Object.entries(initialSpec.sku_galleries).map(([skuId, entry]) => [skuId, entry.slides[0]])
  )
);

export const ALMACEN_GALLERY_SPECS = Object.freeze(initialSpec.almacen_gallery);

export async function computeImageDHash64(inputBuffer) {
  let gray9x8 = inputBuffer;
  if (inputBuffer && inputBuffer.length !== 72) {
    gray9x8 = await sharp(inputBuffer).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  }
  let bits = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const left = gray9x8[row * 9 + col] ?? 0;
      const right = gray9x8[row * 9 + col + 1] ?? 0;
      bits = (bits << 1n) | (left > right ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

function hammingDistanceHex64(hexA, hexB) {
  let diff = BigInt(`0x${hexA}`) ^ BigInt(`0x${hexB}`);
  let count = 0;
  while (diff > 0n) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

function resolveSourcePath(spec) {
  if (spec.root === 'curada') return path.join(CURADA_ROOT, spec.relPath);
  const baseDir = spec.root === 'fotos' ? FOTOS_ROOT : MEMO_ROOT;
  return path.join(baseDir, spec.relPath);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function processPhotoToWebp(sourceImgPath, spec, opts = {}) {
  const targetWidth = opts.width || 640;
  const targetHeight = opts.height || 480;
  const maxBytes = opts.maxBytes || MAX_WEBP_BYTES;
  const qualities = opts.qualities || [80, 72, 64, 56, 48, 40];

  let basePipe = sharp(sourceImgPath).rotate();
  if (spec.rotateDeg && Number.isFinite(Number(spec.rotateDeg))) {
    basePipe = basePipe.rotate(Number(spec.rotateDeg));
  }
  const { data: rotatedBuf, info: rotInfo } = await basePipe.toBuffer({ resolveWithObject: true });

  let workPipe = sharp(rotatedBuf);
  if (spec.cropBox && rotInfo.width && rotInfo.height) {
    const left = Math.max(0, Math.round(rotInfo.width * spec.cropBox.leftRatio));
    const top = Math.max(0, Math.round(rotInfo.height * spec.cropBox.topRatio));
    const width = Math.max(16, Math.min(rotInfo.width - left, Math.round(rotInfo.width * spec.cropBox.widthRatio)));
    const height = Math.max(16, Math.min(rotInfo.height - top, Math.round(rotInfo.height * spec.cropBox.heightRatio)));
    workPipe = sharp(rotatedBuf).extract({ left, top, width, height });
  }

  const resizedBuf = await workPipe
    .resize(targetWidth, targetHeight, {
      fit: spec.fit || 'cover',
      position: 'centre',
      background: spec.background || { r: 241, g: 245, b: 249, alpha: 1 }
    })
    .toBuffer();

  let webpBuffer = await sharp(resizedBuf).webp({ quality: qualities[0], effort: 4 }).toBuffer();
  for (let i = 1; i < qualities.length && webpBuffer.length > maxBytes; i += 1) {
    webpBuffer = await sharp(resizedBuf).webp({ quality: qualities[i], effort: 5 }).toBuffer();
  }
  if (webpBuffer.length > maxBytes) {
    throw new Error(`[E_WEBP_BUDGET_EXCEEDED] ${path.basename(sourceImgPath)} (${targetWidth}x${targetHeight}) supera ${maxBytes} bytes (${webpBuffer.length})`);
  }
  const outMeta = await sharp(webpBuffer).metadata();
  if (outMeta.exif) {
    throw new Error(`[E_EXIF_LEAK] ${path.basename(sourceImgPath)} conserva metadatos EXIF tras conversión`);
  }
  return webpBuffer;
}

function pruneOrphanWebps(dirPath, keepSet) {
  for (const existingFile of fs.readdirSync(dirPath)) {
    if (existingFile.toLowerCase().endsWith('.webp') && !keepSet.has(existingFile)) {
      fs.unlinkSync(path.join(dirPath, existingFile));
    }
  }
}

export async function generateAllProductWebpImages() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ALMACEN_DIR, { recursive: true });
  fs.mkdirSync(PARTES_DIR, { recursive: true });

  const specDoc = readGallerySpec();
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const atomicParts = JSON.parse(fs.readFileSync(ATOMIC_PARTS_PATH, 'utf8'));

  // Compuerta Cero-OEM y congruencia material-visual (D03-C+, D04-C+, ARB-SMAT-71)
  validateMediaGallerySpec(specDoc, catalog, atomicParts);

  const primaryResults = [];
  const allProductSlides = [];
  const keepProductFiles = new Set();
  const productShaSet = new Set();

  for (const sku of catalog) {
    const skuKey = sku.sku_id || sku.id;
    const gallerySpec = specDoc.sku_galleries?.[skuKey];
    if (!gallerySpec || !Array.isArray(gallerySpec.slides) || gallerySpec.slides.length === 0) {
      throw new Error(`[E_MISSING_CURATED_PHOTO_SPEC] SKU ${skuKey} carece de galería en media_gallery_spec.json`);
    }

    const slideOutputs = [];
    const perSkuSources = new Set();

    for (let idx = 0; idx < gallerySpec.slides.length; idx += 1) {
      const slide = gallerySpec.slides[idx];
      const sourceImgPath = resolveSourcePath(slide);
      if (!fs.existsSync(sourceImgPath)) {
        throw new Error(`[E_SOURCE_PHOTO_NOT_FOUND] No existe fotografía curada para ${skuKey}[${idx}]: ${sourceImgPath}`);
      }
      const sourceKey = `${slide.root}:${slide.relPath}`;
      if (perSkuSources.has(sourceKey)) {
        throw new Error(`[E_DUPLICATE_SKU_SLIDE] Fuente repetida en galería de ${skuKey}: ${sourceKey}`);
      }
      perSkuSources.add(sourceKey);

      const outFileName = idx === 0 ? `${sku.slug_es}.webp` : `${sku.slug_es}-${slide.slot || `v${idx + 1}`}.webp`;
      const hdFileName = outFileName.replace(/\.webp$/, '-hd.webp');
      if (/expo/i.test(outFileName)) {
        throw new Error(`[E_FORBIDDEN_OUTPUT_FILENAME] Salida contiene token prohibido: ${outFileName}`);
      }

      const sourceSha256 = sha256File(sourceImgPath);
      const webpBuffer = await processPhotoToWebp(sourceImgPath, slide);
      const hdBuffer = await processPhotoToWebp(sourceImgPath, slide, {
        width: 1200,
        height: 900,
        maxBytes: MAX_HD_WEBP_BYTES,
        qualities: [82, 74, 66, 58, 50, 42, 34, 28]
      });
      const outFullPath = path.join(OUTPUT_DIR, outFileName);
      const hdFullPath = path.join(OUTPUT_DIR, hdFileName);
      fs.writeFileSync(outFullPath, webpBuffer);
      fs.writeFileSync(hdFullPath, hdBuffer);
      keepProductFiles.add(outFileName);
      keepProductFiles.add(hdFileName);

      const dhash64 = await computeImageDHash64(webpBuffer);
      const sha256 = crypto.createHash('sha256').update(webpBuffer).digest('hex');
      productShaSet.add(sha256);

      const record = {
        id: skuKey,
        slug: sku.slug_es,
        slot: slide.slot || (idx === 0 ? 'primary' : `v${idx + 1}`),
        src: `/images/productos/${outFileName}`,
        hd_src: `/images/productos/${hdFileName}`,
        fileName: outFileName,
        hdFileName,
        sourceRoot: slide.root,
        sourceRelPath: slide.relPath,
        source_sha256: sourceSha256,
        material_class: slide.material_class,
        visual_brand_audit: slide.visual_brand_audit,
        bytes: webpBuffer.length,
        hd_bytes: hdBuffer.length,
        sha256,
        dhash64,
        captionEs: slide.captionEs || '',
        captionEn: slide.captionEn || ''
      };
      slideOutputs.push(record);
      allProductSlides.push(record);
      if (idx === 0) {
        primaryResults.push(record);
      }
    }
  }

  pruneOrphanWebps(OUTPUT_DIR, keepProductFiles);

  let minHamming = 64;
  let closestPair = null;
  for (let i = 0; i < primaryResults.length; i += 1) {
    for (let j = i + 1; j < primaryResults.length; j += 1) {
      const dist = hammingDistanceHex64(primaryResults[i].dhash64, primaryResults[j].dhash64);
      if (dist < minHamming) {
        minHamming = dist;
        closestPair = [primaryResults[i].id, primaryResults[j].id, dist];
      }
    }
  }

  const uniqueSha = new Set(primaryResults.map((r) => r.sha256)).size;
  const uniqueDhash = new Set(primaryResults.map((r) => r.dhash64)).size;
  const uniqueSources = new Set(primaryResults.map((r) => `${r.sourceRoot}:${r.sourceRelPath}`)).size;
  const uniqueSourceSha = new Set(primaryResults.map((r) => r.source_sha256)).size;
  const maxBytes = Math.max(...allProductSlides.map((r) => r.bytes));

  assertUniqueSourceSha256(primaryResults);

  const expectedSkuCount = catalog.length;
  console.log(
    `[build_product_images] ${primaryResults.length} SKUs / ${allProductSlides.length} slides WebP (640x480, max=${maxBytes} B <= ${MAX_WEBP_BYTES} B, srcSha=${uniqueSourceSha}/${expectedSkuCount}, sha=${uniqueSha}/${expectedSkuCount}, dHash=${uniqueDhash}/${expectedSkuCount}, minHamming=${minHamming})`
  );

  if (
    uniqueSources !== expectedSkuCount ||
    uniqueSha !== expectedSkuCount ||
    uniqueDhash !== expectedSkuCount ||
    uniqueSourceSha !== expectedSkuCount
  ) {
    throw new Error(
      `[E_IMAGE_COLLISION] Se requieren ${expectedSkuCount}/${expectedSkuCount} fuentes, source_sha256, SHA-256 y dHash64 únicos (sources=${uniqueSources}, srcSha=${uniqueSourceSha}, sha=${uniqueSha}, dhash=${uniqueDhash})`
    );
  }
  if (minHamming < 8) {
    throw new Error(
      `[E_DHASH_MIN_HAMMING] Distancia mínima de Hamming (${minHamming}) < 8 entre ${closestPair?.[0]} y ${closestPair?.[1]}`
    );
  }

  const almacenResults = [];
  const keepAlmacenFiles = new Set();
  for (const item of specDoc.almacen_gallery || []) {
    const srcPath = resolveSourcePath(item);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`[E_ALMACEN_PHOTO_NOT_FOUND] No existe fotografía de almacén: ${srcPath}`);
    }
    const sourceSha256 = sha256File(srcPath);
    const webpBuffer = await processPhotoToWebp(srcPath, item);
    const sha256 = crypto.createHash('sha256').update(webpBuffer).digest('hex');
    if (productShaSet.has(sha256)) {
      throw new Error(`[E_ALMACEN_CLONE] Foto de almacén ${item.fileName} clona SHA-256 de public/images/productos/`);
    }
    const outPath = path.join(ALMACEN_DIR, item.fileName);
    fs.writeFileSync(outPath, webpBuffer);
    keepAlmacenFiles.add(item.fileName);
    almacenResults.push({
      id: item.id,
      fileName: item.fileName,
      src: `/images/almacen/${item.fileName}`,
      sourceRoot: item.root,
      sourceRelPath: item.relPath,
      source_sha256: sourceSha256,
      bytes: webpBuffer.length,
      sha256,
      captionEs: item.captionEs,
      captionEn: item.captionEn
    });
  }
  pruneOrphanWebps(ALMACEN_DIR, keepAlmacenFiles);
  assertUniqueSourceSha256([...primaryResults, ...almacenResults]);

  const atomicResults = [];
  const keepPartesFiles = new Set();
  for (const part of atomicParts) {
    const code = String(part.code || '').toLowerCase();
    const spec = specDoc.atomic_parts?.[code];
    if (!spec || !spec.relPath) {
      throw new Error(`[E_ATOMIC_PART_PHOTO_MISSING] Pieza atómica ${code} carece de entrada en media_gallery_spec.json`);
    }
    const srcPath = resolveSourcePath(spec);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`[E_ATOMIC_PART_SOURCE_NOT_FOUND] No existe fotografía para ${code}: ${srcPath}`);
    }
    const sourceSha256 = sha256File(srcPath);
    const webpBuffer = await processPhotoToWebp(srcPath, spec);
    const fileName = `${code}.webp`;
    const outPath = path.join(PARTES_DIR, fileName);
    fs.writeFileSync(outPath, webpBuffer);
    keepPartesFiles.add(fileName);
    atomicResults.push({
      code,
      partNumber: part.part_number,
      fileName,
      src: `/images/partes/${fileName}`,
      sourceRoot: spec.root,
      sourceRelPath: spec.relPath,
      source_sha256: sourceSha256,
      bytes: webpBuffer.length,
      sha256: crypto.createHash('sha256').update(webpBuffer).digest('hex')
    });
  }
  pruneOrphanWebps(PARTES_DIR, keepPartesFiles);

  const galleriesBySku = {};
  for (const slide of allProductSlides) {
    if (!galleriesBySku[slide.id]) galleriesBySku[slide.id] = [];
    galleriesBySku[slide.id].push({
      slot: slide.slot,
      src: slide.src,
      hd_src: slide.hd_src,
      bytes: slide.bytes,
      hd_bytes: slide.hd_bytes,
      captionEs: slide.captionEs,
      captionEn: slide.captionEn
    });
  }
  const maxHdBytes = Math.max(...allProductSlides.map((r) => r.hd_bytes));

  const manifest = {
    schema_version: 'v7.0',
    hygiene_version: 'v9.0-zero-oem',
    exif_stripped_all: true,
    generated_at: new Date().toISOString(),
    width: 640,
    height: 480,
    hd_width: 1200,
    hd_height: 900,
    max_bytes_limit: MAX_WEBP_BYTES,
    max_bytes: maxBytes,
    max_hd_bytes_limit: MAX_HD_WEBP_BYTES,
    max_hd_bytes: maxHdBytes,
    unique_sources: uniqueSources,
    unique_source_sha256: uniqueSourceSha,
    unique_sha256: uniqueSha,
    unique_dhash64: uniqueDhash,
    min_hamming_distance: minHamming,
    closest_pair: closestPair,
    cross_folder_sha256_clones: 0,
    total_product_slides: allProductSlides.length,
    total_hd_slides: allProductSlides.length,
    total_atomic_part_photos: atomicResults.length,
    skus: primaryResults,
    galleries: galleriesBySku,
    almacen_gallery: almacenResults,
    atomic_parts: atomicResults
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(
    `[build_product_images] Almacén: ${almacenResults.length} exclusivas | Partes atómicas: ${atomicResults.length} WebPs en public/images/partes/`
  );
  return { results: primaryResults, allProductSlides, almacenResults, atomicResults, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateAllProductWebpImages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
