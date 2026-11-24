/**
 * build_product_images.mjs
 * ---------------------------------------------------------------------------
 * Pipeline determinista V6.0 (Purchase-First) de fotografía real limpia en WebP
 * (640x480, 4:3, <= 45 KB, full-bleed sin marcos ni encabezados superpuestos)
 * con curaduría multi-fuente verificada 1:1 hacia `PAGINA SMAT MEMO/` y `fotos_sitio/`.
 * Valida EXIF (.rotate()), SHA-256 únicos, dHash perceptual 64-bit con distancia de
 * Hamming mínima >= 8 entre los 19 SKUs y genera galería física del Almacén Durango.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json');
const OUTPUT_DIR = path.join(SITE_ROOT, 'public/images/productos');
const ALMACEN_DIR = path.join(SITE_ROOT, 'public/images/almacen');
const MEMO_ROOT = path.resolve(SITE_ROOT, '../../2_smat/ideas/PAGINA SMAT MEMO');
const FOTOS_ROOT = path.resolve(SITE_ROOT, '../../2_smat/ideas/fotos_sitio');

const MAX_WEBP_BYTES = 45 * 1024; // 46080 bytes (estricto <= 45 KB)

/**
 * Mapa 1:1 curado y verificado visualmente para los 19 SKUs canónicos.
 * Cada fuente es única, sin marcas de terceros ni alucinaciones IA.
 */
export const SKU_TO_CURATED_PHOTO_SPEC = Object.freeze({
  'SMAT-LAB-MARCY-1000': {
    root: 'memo',
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/balanza.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.04, topRatio: 0.02, widthRatio: 0.92, heightRatio: 0.94 }
  },
  'SMAT-LAB-VASO-1000': {
    root: 'fotos',
    relPath: 'Balanza marcy/vaso onox balanza marcy.jpg',
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  },
  'SMAT-LAB-TAMIZ-E11': {
    root: 'memo',
    relPath: '04_fototeca_de_productos/03_tamices_e_instrumental/1I4in.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.04, topRatio: 0.04, widthRatio: 0.92, heightRatio: 0.92 }
  },
  'SMAT-LAB-ROTAP-MECH': {
    root: 'memo',
    relPath: '03_renders_web_transparentes/Ro Tap expo.png',
    fit: 'cover',
    cropBox: { leftRatio: 0.02, topRatio: 0.0, widthRatio: 0.96, heightRatio: 0.74 }
  },
  'SMAT-LAB-PLATO-TENT': {
    root: 'memo',
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/platostentinox.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.05, topRatio: 0.05, widthRatio: 0.90, heightRatio: 0.90 }
  },
  'SMAT-LAB-PULV-DISC': {
    root: 'fotos',
    relPath: 'PULVERIZADOR/UA 2000RS Grinding Plates, chrome alloy.jpg',
    fit: 'cover'
  },
  'SMAT-LAB-FILTRO-BATCH': {
    root: 'memo',
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/Pressure Filter.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.04, topRatio: 0.03, widthRatio: 0.92, heightRatio: 0.94 }
  },
  'SMAT-PUMP-IMP-AH': {
    root: 'fotos',
    relPath: 'impulsor/IMG-20210219-WA0044.jpg',
    fit: 'cover'
  },
  'SMAT-PUMP-WETKIT-554': {
    root: 'fotos',
    relPath: 'volute and troatbush metal/IMG-20210718-WA0028.jpg',
    fit: 'cover'
  },
  'SMAT-PUMP-EXPELLER-KIT': {
    root: 'fotos',
    relPath: 'EXPELLER RING  BOMBA LODOS AH ALTO CROMO.jpg',
    fit: 'cover'
  },
  'SMAT-PUMP-BRG-005M': {
    root: 'fotos',
    relPath: 'assembly AH Y hh/Bearing Assembly AH.jpg',
    fit: 'cover'
  },
  'SMAT-PUMP-LINERS-AH': {
    root: 'memo',
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/explosion bomba.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.02, topRatio: 0.04, widthRatio: 0.96, heightRatio: 0.92 }
  },
  'SMAT-CYC-D6-D20': {
    root: 'fotos',
    relPath: 'Hidrociclone/grupo  hidrociclone.jpg',
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  },
  'SMAT-COUPLED-PUMP-CYC': {
    root: 'fotos',
    relPath: 'bOMBAS LODOS/bomba 8x6.jpg',
    fit: 'cover'
  },
  'SMAT-SCR-TH48-30': {
    root: 'memo',
    relPath: '03_renders_web_transparentes/poliuretano expo.png',
    fit: 'cover',
    cropBox: { leftRatio: 0.0, topRatio: 0.0, widthRatio: 0.88, heightRatio: 0.78 }
  },
  'SMAT-SCR-MOD-1X1': {
    root: 'memo',
    relPath: '04_fototeca_de_productos/04_piezas_y_stock_almacen/Modulo poliuretano.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.04, topRatio: 0.04, widthRatio: 0.92, heightRatio: 0.92 }
  },
  'SMAT-FILT-CLOTH-PLATE': {
    root: 'fotos',
    relPath: 'Filtro Presion/IMG-20210704-WA0035.jpeg',
    fit: 'cover',
    cropBox: { leftRatio: 0.16, topRatio: 0.04, widthRatio: 0.84, heightRatio: 0.96 }
  },
  'SMAT-FILT-SHIFTER-CHAIN': {
    root: 'fotos',
    relPath: 'Filtro Presion/IMG-20210412-WA0045.jpg',
    fit: 'cover',
    cropBox: { leftRatio: 0.06, topRatio: 0.30, widthRatio: 0.78, heightRatio: 0.70 }
  },
  'SMAT-FLOT-MECH-18SP': {
    root: 'memo',
    relPath: '03_renders_web_transparentes/Tanque Acondicionador expo.png',
    fit: 'cover',
    cropBox: { leftRatio: 0.16, topRatio: 0.0, widthRatio: 0.84, heightRatio: 0.78 }
  }
});

/**
 * 5 fotografías reales del Almacén Central y Taller SMAT en Durango.
 */
export const ALMACEN_GALLERY_SPECS = Object.freeze([
  {
    id: 'almacen-bomba-6x4-dah',
    fileName: 'almacen-bomba-6x4-dah.webp',
    root: 'fotos',
    relPath: 'bOMBAS LODOS/Bomba Lodos 6x4 DAH.jpg',
    fit: 'cover',
    captionEs: 'Bomba centrífuga de lodos 6x4 DAH ensamblada en taller con transmisión por poleas y guarda de seguridad.',
    captionEn: 'Assembled 6x4 DAH horizontal slurry pump package in shop with belt drive and safety guard.'
  },
  {
    id: 'almacen-volutas-cromo-caja',
    fileName: 'almacen-volutas-cromo-caja.webp',
    root: 'fotos',
    relPath: 'volute and troatbush metal/IMG-20210718-WA0028.jpg',
    fit: 'cover',
    captionEs: 'Volutas y platos de succión en Alto Cromo 27% (≥ 650 HB) inspeccionados antes de embarque.',
    captionEn: '27% High-Chrome (≥ 650 HB) volute liners and throatbushes crated and verified prior to dispatch.'
  },
  {
    id: 'almacen-rodamientos-ah',
    fileName: 'almacen-rodamientos-ah.webp',
    root: 'fotos',
    relPath: 'assembly AH Y hh/Bearing Assembly AH.jpg',
    fit: 'cover',
    captionEs: 'Cartuchos de rodamientos Bearing Assembly armados con eje SAE 4140 y sellos laberinto en patio.',
    captionEn: 'Pre-assembled Bearing Assembly cartridges with SAE 4140 shafts and labyrinth seals on shop floor.'
  },
  {
    id: 'almacen-filtro-prensa-planta',
    fileName: 'almacen-filtro-prensa-planta.webp',
    root: 'fotos',
    relPath: 'Filtro Presion/IMG-20210208-WA0023.jpg',
    fit: 'cover',
    captionEs: 'Filtro prensa industrial 16 bar en puesta en marcha con paquete de placas PP y válvulas de filtrado.',
    captionEn: '16-bar industrial filter press during plant commissioning with PP plate pack and filtrate valves.'
  },
  {
    id: 'almacen-impulsor-cr27',
    fileName: 'almacen-impulsor-cr27.webp',
    root: 'fotos',
    relPath: 'impulsor/IMG-20210219-WA0044.jpg',
    fit: 'cover',
    captionEs: 'Impulsor cerrado de 5 álabes en Alto Cromo 27% listo para despacho inmediato desde Durango.',
    captionEn: 'Closed 5-vane 27% High-Chrome slurry impeller staged for immediate dispatch from Durango.'
  }
]);

/**
 * Calcula el hash perceptual diferencial de 64 bits (dHash 9x8 en escala de grises, Zauner 2010).
 * @param {Buffer|Uint8Array} inputBuffer
 * @returns {Promise<string>} Hexadecimal de 16 caracteres (64 bits)
 */
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
  const baseDir = spec.root === 'fotos' ? FOTOS_ROOT : MEMO_ROOT;
  return path.join(baseDir, spec.relPath);
}

async function processPhotoToWebp(sourceImgPath, spec) {
  // Normalizar orientación EXIF antes de calcular cualquier recorte proporcional
  const { data: rotatedBuf, info: rotInfo } = await sharp(sourceImgPath)
    .rotate()
    .toBuffer({ resolveWithObject: true });

  let workPipe = sharp(rotatedBuf);
  if (spec.cropBox && rotInfo.width && rotInfo.height) {
    const left = Math.max(0, Math.round(rotInfo.width * spec.cropBox.leftRatio));
    const top = Math.max(0, Math.round(rotInfo.height * spec.cropBox.topRatio));
    const width = Math.max(16, Math.min(rotInfo.width - left, Math.round(rotInfo.width * spec.cropBox.widthRatio)));
    const height = Math.max(16, Math.min(rotInfo.height - top, Math.round(rotInfo.height * spec.cropBox.heightRatio)));
    workPipe = sharp(rotatedBuf).extract({ left, top, width, height });
  }

  const resizedBuf = await workPipe
    .resize(640, 480, {
      fit: spec.fit || 'cover',
      position: 'centre',
      background: spec.background || { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer();

  const qualities = [80, 72, 64, 56, 48, 40];
  let webpBuffer = await sharp(resizedBuf).webp({ quality: qualities[0], effort: 4 }).toBuffer();
  for (let i = 1; i < qualities.length && webpBuffer.length > MAX_WEBP_BYTES; i += 1) {
    webpBuffer = await sharp(resizedBuf).webp({ quality: qualities[i], effort: 5 }).toBuffer();
  }
  if (webpBuffer.length > MAX_WEBP_BYTES) {
    throw new Error(`[E_WEBP_BUDGET_EXCEEDED] ${path.basename(sourceImgPath)} supera ${MAX_WEBP_BYTES} bytes (${webpBuffer.length})`);
  }
  return webpBuffer;
}

export async function generateAllProductWebpImages() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ALMACEN_DIR, { recursive: true });

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const results = [];

  for (const sku of catalog) {
    const skuKey = sku.sku_id || sku.id;
    const spec = SKU_TO_CURATED_PHOTO_SPEC[skuKey];
    if (!spec || !spec.relPath) {
      throw new Error(`[E_MISSING_CURATED_PHOTO_SPEC] SKU ${skuKey} carece de asignación 1:1 en SKU_TO_CURATED_PHOTO_SPEC`);
    }

    const sourceImgPath = resolveSourcePath(spec);
    if (!fs.existsSync(sourceImgPath)) {
      throw new Error(`[E_SOURCE_PHOTO_NOT_FOUND] No existe fotografía curada para ${skuKey}: ${sourceImgPath}`);
    }

    const webpBuffer = await processPhotoToWebp(sourceImgPath, spec);
    const outFileName = `${sku.slug_es}.webp`;
    if (/expo/i.test(outFileName)) {
      throw new Error(`[E_FORBIDDEN_OUTPUT_FILENAME] Salida contiene token prohibido: ${outFileName}`);
    }

    const outFullPath = path.join(OUTPUT_DIR, outFileName);
    fs.writeFileSync(outFullPath, webpBuffer);

    const dhash64 = await computeImageDHash64(webpBuffer);
    const sha256 = crypto.createHash('sha256').update(webpBuffer).digest('hex');

    results.push({
      id: skuKey,
      slug: sku.slug_es,
      fileName: outFileName,
      sourceRoot: spec.root,
      sourceRelPath: spec.relPath,
      bytes: webpBuffer.length,
      sha256,
      dhash64,
      path: outFullPath
    });
  }

  // Purgar cualquier .webp huérfano que no pertenezca a los 19 slugs canónicos
  const canonicalWebpSet = new Set(results.map((r) => `${r.slug}.webp`));
  for (const existingFile of fs.readdirSync(OUTPUT_DIR)) {
    if (existingFile.toLowerCase().endsWith('.webp') && !canonicalWebpSet.has(existingFile)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, existingFile));
    }
  }

  // Distancia de Hamming mínima en foto pura entre todos los pares de los 19 SKUs
  let minHamming = 64;
  let closestPair = null;
  for (let i = 0; i < results.length; i += 1) {
    for (let j = i + 1; j < results.length; j += 1) {
      const dist = hammingDistanceHex64(results[i].dhash64, results[j].dhash64);
      if (dist < minHamming) {
        minHamming = dist;
        closestPair = [results[i].id, results[j].id, dist];
      }
    }
  }

  const uniqueSha = new Set(results.map((r) => r.sha256)).size;
  const uniqueDhash = new Set(results.map((r) => r.dhash64)).size;
  const uniqueSources = new Set(results.map((r) => `${r.sourceRoot}:${r.sourceRelPath}`)).size;
  const maxBytes = Math.max(...results.map((r) => r.bytes));

  console.log(
    `[build_product_images] ${results.length} fotos WebP limpias (640x480, max=${maxBytes} B <= ${MAX_WEBP_BYTES} B, sources=${uniqueSources}/19, sha=${uniqueSha}/19, dHash=${uniqueDhash}/19, minHamming=${minHamming})`
  );

  if (uniqueSources !== 19 || uniqueSha !== 19 || uniqueDhash !== 19) {
    throw new Error(
      `[E_IMAGE_COLLISION] Se requieren 19/19 fuentes, SHA-256 y dHash64 únicos (sources=${uniqueSources}, sha=${uniqueSha}, dhash=${uniqueDhash})`
    );
  }
  if (minHamming < 8) {
    throw new Error(
      `[E_DHASH_MIN_HAMMING] Distancia mínima de Hamming (${minHamming}) < 8 entre ${closestPair?.[0]} y ${closestPair?.[1]}`
    );
  }

  // Generar 5 fotografías reales del Almacén Durango
  const almacenResults = [];
  for (const item of ALMACEN_GALLERY_SPECS) {
    const srcPath = resolveSourcePath(item);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`[E_ALMACEN_PHOTO_NOT_FOUND] No existe fotografía de almacén: ${srcPath}`);
    }
    const webpBuffer = await processPhotoToWebp(srcPath, item);
    const outPath = path.join(ALMACEN_DIR, item.fileName);
    fs.writeFileSync(outPath, webpBuffer);
    almacenResults.push({
      id: item.id,
      fileName: item.fileName,
      src: `/images/almacen/${item.fileName}`,
      bytes: webpBuffer.length,
      captionEs: item.captionEs,
      captionEn: item.captionEn
    });
  }

  const manifest = {
    schema_version: 'v6.0',
    generated_at: new Date().toISOString(),
    width: 640,
    height: 480,
    max_bytes_limit: MAX_WEBP_BYTES,
    max_bytes: maxBytes,
    unique_sources: uniqueSources,
    unique_sha256: uniqueSha,
    unique_dhash64: uniqueDhash,
    min_hamming_distance: minHamming,
    closest_pair: closestPair,
    skus: results.map(({ path: _abs, ...rest }) => rest),
    almacen_gallery: almacenResults
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`[build_product_images] Galería Almacén Durango: ${almacenResults.length} fotos WebP generadas en public/images/almacen/`);
  return { results, almacenResults, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateAllProductWebpImages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
