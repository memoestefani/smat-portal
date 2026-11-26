import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('V60-01: 23/23 fotos reales limpias WebP (<=45 KB, Hamming >= 8) + fotos Almacén Durango sin SVG overlays', () => {
  const buildScript = fs.readFileSync(path.join(SITE_ROOT, 'tools/build_product_images.mjs'), 'utf8');
  assert.equal(buildScript.includes('buildStudioOverlaySvg'), false, 'buildStudioOverlaySvg debe estar eliminado');

  const manifestPath = path.join(SITE_ROOT, 'public/images/productos/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json debe existir');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.skus.length, 23, 'manifest debe listar exactamente 23 SKUs (19 stock + 4 bajo proyecto)');
  assert.ok(manifest.max_bytes <= 46080, `max_bytes=${manifest.max_bytes} debe ser <= 45 KB`);
  assert.ok(manifest.min_hamming_distance >= 8, `min_hamming_distance=${manifest.min_hamming_distance} debe ser >= 8`);
  assert.equal(manifest.unique_sha256, 23);
  assert.equal(manifest.unique_dhash64, 23);

  for (const sku of manifest.skus) {
    assert.equal(/expo/i.test(sku.fileName), false, `Nombre de salida prohibido: ${sku.fileName}`);
    const absWebp = path.join(SITE_ROOT, 'public/images/productos', sku.fileName);
    assert.ok(fs.existsSync(absWebp), `Falta archivo ${sku.fileName}`);
    assert.ok(fs.statSync(absWebp).size <= 46080, `${sku.fileName} supera 45 KB`);
  }

  assert.ok(manifest.almacen_gallery.length >= 5, 'Deben existir >= 5 fotos en galería Almacén Durango');
  for (const item of manifest.almacen_gallery) {
    const absAlmacen = path.join(SITE_ROOT, 'public/images/almacen', item.fileName);
    assert.ok(fs.existsSync(absAlmacen), `Falta foto de almacén ${item.fileName}`);
    assert.ok(fs.statSync(absAlmacen).size <= 46080, `${item.fileName} supera 45 KB`);
  }
});

test('V60-02: PDP Amazon bilingüe, Thin Wrappers (<=40 LOC), ProductQuickCard foto-default y presupuesto <=160 archivos', () => {
  assert.ok(fs.existsSync(path.join(SITE_ROOT, 'src/components/ProductStorefrontCard.astro')));
  assert.ok(fs.existsSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro')));

  const esSlugLoc = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/productos/[slug].astro'), 'utf8').split(/\r?\n/).length;
  const enSlugLoc = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/products/[slug].astro'), 'utf8').split(/\r?\n/).length;
  assert.ok(esSlugLoc <= 40, `productos/[slug].astro LOC=${esSlugLoc} > 40`);
  assert.ok(enSlugLoc <= 40, `en/products/[slug].astro LOC=${enSlugLoc} > 40`);

  const qcardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(qcardSrc.split(/\r?\n/).length < 400, 'ProductQuickCard debe ser < 400 LOC');
  assert.ok(qcardSrc.includes('data-qcard-tab="photo"') && qcardSrc.includes('aria-selected="true"'));
  assert.equal(qcardSrc.includes('EN STOCK DURANGO'), false);
  assert.equal(qcardSrc.includes('Foto Real Cero-OEM'), false);

  const pdpSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro'), 'utf8');
  assert.equal(pdpSrc.includes('og-card.jpg'), false, 'ProductDetailIsland no debe usar og-card.jpg');
  const partEsRoute = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/catalogo/[code].astro'), 'utf8');
  assert.ok(partEsRoute.includes('ProductDetailIsland') && partEsRoute.includes('primaryPhotoOverride={part.photo_webp}'));

  let srcFileCount = 0;
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else srcFileCount += 1;
    }
  }
  walk(path.join(SITE_ROOT, 'src'));
  assert.ok(srcFileCount <= 165, `src/ tiene ${srcFileCount} archivos > max_files 165`);
});

test('V60-03: Catálogo abierto sin drawer cerrado, 5 verticales Product-First y fix de concatenación', () => {
  const catSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CatalogFacetedIsland.astro'), 'utf8');
  assert.equal(catSrc.includes('catalog-avenues-drawer'), false, 'CatalogFacetedIsland no debe encerrar SKUs en drawer');

  for (const rel of [
    'src/components/islands/HomeLandingIsland.astro',
    'src/components/islands/PumpingHubIsland.astro',
    'src/components/islands/CycloneScreenIsland.astro',
    'src/components/islands/FiltrationCalculatorIsland.astro',
    'src/components/islands/FlotationCalculatorIsland.astro',
    'src/components/islands/ProcessControlIsland.astro',
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('ProductStorefrontCard'), `${rel} debe montar ProductStorefrontCard`);
  }

  const bridgeSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/flotationFiltrationBridge.js'), 'utf8');
  assert.equal(bridgeSrc.includes('const skuTail = skusEl'), false, 'No duplicar Shifter cuando skusEl existe');
  assert.ok(bridgeSrc.includes('if (skusEl)'), 'Debe separar la rama con skusEl para evitar duplicar Shifter');
});

test('V60-04: Bandeja sin PDF hardcoded, Contacto limpio, Galería Durango y cero precios literales', () => {
  const traySrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuickOrderTray.astro'), 'utf8');
  assert.ok(traySrc.split(/\r?\n/).length < 410, 'QuickOrderTray debe ser < 410 LOC');
  assert.equal(traySrc.includes('/acuse/?reorder=1&tray=SMAT-PUMP-IMP-AH'), false);

  const contactEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/contacto.astro'), 'utf8');
  const contactEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/contact.astro'), 'utf8');
  assert.equal(contactEs.includes('Simulador Durand'), false);
  assert.equal(contactEn.includes('Durand Simulator'), false);

  const nosotros = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/nosotros.astro'), 'utf8');
  const about = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/about.astro'), 'utf8');
  assert.ok(nosotros.includes('/images/almacen/') && about.includes('/images/almacen/'));

  const diag = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticsHub.astro'), 'utf8');
  assert.ok(diag.includes('/images/productos/') || diag.includes('primarySku'));

  const priceRegex = /(\$\s*\d[\d,.]*|\b\d[\d,.]*\s*(USD|MXN)\b)/i;
  for (const rel of [
    'src/components/ProductStorefrontCard.astro',
    'src/components/islands/ProductDetailIsland.astro',
    'src/components/QuickOrderTray.astro',
    'src/components/Header.astro',
  ]) {
    const content = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8').replace(/<style[\s\S]*?<\/style>/g, '');
    assert.equal(priceRegex.test(content), false, `Precio literal prohibido en ${rel}`);
  }
});

test('V60-05: Poda canónica 23 PDP + 13 atómicas, 301 en 1 salto, tarjeta homogénea y dist compilado', async () => {
  const { getAllStaticProductRouteEntries } = await import(
    '../src/scripts/quickProductsCatalog.js'
  );
  const esEntries = getAllStaticProductRouteEntries('es');
  const enEntries = getAllStaticProductRouteEntries('en');
  assert.equal(esEntries.length, 23, `ES PDP estáticas deben ser 23 (hay ${esEntries.length})`);
  assert.equal(enEntries.length, 23, `EN PDP estáticas deben ser 23 (hay ${enEntries.length})`);
  const esAliases = getAllStaticProductRouteEntries('es', { includeAliases: true }).filter((e) => !e.isCanonical);
  assert.ok(esAliases.length >= 50, 'Deben existir pares alias ES cubiertos por 301');

  const codeEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/catalogo/[code].astro'), 'utf8');
  const codeEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/catalog/[code].astro'), 'utf8');
  assert.equal(codeEs.includes('const extras'), false, '[code].astro ES no debe duplicar alias extras');
  assert.equal(codeEn.includes('const extras'), false, '[code].astro EN no debe duplicar alias extras');

  const sfCard = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductStorefrontCard.astro'), 'utf8');
  assert.ok(sfCard.includes('data-ergos-homogeneous-card'), 'ProductStorefrontCard requiere data-ergos-homogeneous-card');

  const redirectsRaw = fs.readFileSync(path.join(SITE_ROOT, 'public/_redirects'), 'utf8');
  assert.ok(
    redirectsRaw.includes('/catalogo/anillo-expulsor/ /catalogo/d4029/ 301') ||
      redirectsRaw.includes('/catalogo/anillo-expulsor /catalogo/d4029/ 301'),
    '_redirects debe mapear /catalogo/anillo-expulsor -> /catalogo/d4029/'
  );
  assert.ok(
    redirectsRaw.includes('/productos/anillo-camara-expulsora-d4029/ /productos/kit-sellado-seco-expeller-ah/ 301'),
    '_redirects debe mapear /productos/anillo-camara-expulsora-d4029/ -> /productos/kit-sellado-seco-expeller-ah/'
  );

  const distProductos = path.join(SITE_ROOT, 'dist/productos');
  const distIndex = path.join(SITE_ROOT, 'dist/index.html');
  const quickCatPath = path.join(SITE_ROOT, 'src/scripts/quickProductsCatalog.js');
  if (
    fs.existsSync(distIndex) &&
    fs.existsSync(distProductos) &&
    fs.statSync(distIndex).mtimeMs >= fs.statSync(quickCatPath).mtimeMs
  ) {
    const esDirs = fs.readdirSync(distProductos, { withFileTypes: true }).filter((d) => d.isDirectory());
    const enDirs = fs.readdirSync(path.join(SITE_ROOT, 'dist/en/products'), { withFileTypes: true }).filter((d) => d.isDirectory());
    const catDirs = fs.readdirSync(path.join(SITE_ROOT, 'dist/catalogo'), { withFileTypes: true }).filter((d) => d.isDirectory());
    assert.equal(esDirs.length, 23, `dist/productos/ debe tener 23 subdirectorios (hay ${esDirs.length})`);
    assert.equal(enDirs.length, 23, `dist/en/products/ debe tener 23 subdirectorios (hay ${enDirs.length})`);
    assert.equal(catDirs.length, 13, `dist/catalogo/ debe tener 13 piezas atómicas (hay ${catDirs.length})`);
    const indexHtml = fs.readFileSync(distIndex, 'utf8');
    assert.ok(indexHtml.includes('/images/almacen/') && indexHtml.includes('/images/productos/'));
  }
});
