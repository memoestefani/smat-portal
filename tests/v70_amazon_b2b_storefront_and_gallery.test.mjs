// tests/v70_amazon_b2b_storefront_and_gallery.test.mjs
// Verificación Integral SMAT V7.0 (Purchase-First Consolidation, Galería Multiángulo & Buy Box B2B)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('V70-01: 20 rutas espejo y 4 islands redundantes retirados con cobertura 301 en 1 salto', () => {
  const retiredPages = [
    'src/pages/equipos/index.astro',
    'src/pages/en/process-equipment/index.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/bombeo/impulsor.astro',
    'src/pages/bombeo/revestimientos.astro',
    'src/pages/bombeo/sello.astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/en/pumping/skid.astro',
    'src/pages/en/pumping/impeller.astro',
    'src/pages/en/pumping/liners.astro',
    'src/pages/en/pumping/seal.astro',
    'src/pages/en/pumping/bearing-assembly.astro',
    'src/pages/filtracion/prensa.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/en/filtration/press.astro',
    'src/pages/en/filtration/parts.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/flotacion/mecanismos.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/en/flotation/mechanisms.astro',
  ];
  for (const rel of retiredPages) {
    assert.equal(fs.existsSync(path.join(SITE_ROOT, rel)), false, `Ruta retirada aún existe: ${rel}`);
  }

  for (const island of [
    'src/components/islands/AtomicPartIsland.astro',
    'src/components/islands/EquipmentHubIsland.astro',
    'src/components/islands/TribologyAlloyIsland.astro',
    'src/components/islands/SealDriveBearingIsland.astro',
  ]) {
    assert.equal(fs.existsSync(path.join(SITE_ROOT, island)), false, `Island retirado aún existe: ${island}`);
  }

  const redirectsRaw = fs.readFileSync(path.join(SITE_ROOT, 'public/_redirects'), 'utf8');
  for (const srcRoute of [
    '/equipos/',
    '/en/process-equipment/',
    '/bombeo/impulsor/',
    '/bombeo/skid/',
    '/filtracion/prensa/',
    '/flotacion/celdas/',
  ]) {
    assert.ok(redirectsRaw.includes(`${srcRoute} `), `Falta regla 301 para ${srcRoute}`);
  }

  for (const codeRoute of ['src/pages/catalogo/[code].astro', 'src/pages/en/catalog/[code].astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, codeRoute), 'utf8');
    assert.ok(src.includes('ProductDetailIsland'), `${codeRoute} debe montar ProductDetailIsland`);
    assert.equal(src.includes('AtomicPartIsland'), false, `${codeRoute} no debe referenciar AtomicPartIsland`);
  }
});

test('V70-02: Galería multiángulo WebP v7.0, 0 clones almacen/productos, 13 partes y orden comercial', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(SITE_ROOT, 'public/images/productos/manifest.json'), 'utf8')
  );
  assert.equal(manifest.schema_version, 'v7.0');
  assert.equal(manifest.skus.length, 19);
  assert.ok(manifest.total_product_slides >= 57, `Esperados >= 57 slides WebP, actual=${manifest.total_product_slides}`);
  assert.equal(manifest.cross_folder_sha256_clones, 0);
  assert.equal(manifest.almacen_gallery.length, 5);
  assert.equal(manifest.atomic_parts.length, 13);
  assert.ok(manifest.max_bytes <= 46080);
  assert.ok(manifest.min_hamming_distance >= 8);

  const almacenShas = new Set(manifest.almacen_gallery.map((x) => x.sha256));
  for (const sku of manifest.skus) {
    assert.equal(almacenShas.has(sku.sha256), false, `Clon SHA-256 cruzado en ${sku.id}`);
  }
  for (const part of manifest.atomic_parts) {
    assert.ok(fs.existsSync(path.join(SITE_ROOT, 'public/images/partes', part.fileName)), `Falta ${part.fileName}`);
  }

  const catalog = JSON.parse(
    fs.readFileSync(path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json'), 'utf8')
  );
  assert.equal(catalog.length, 19);
  for (let i = 0; i < 6; i += 1) {
    assert.equal(catalog[i].vertical, 'bombeo', `Posición ${i + 1} debe ser bombeo/5-5-4`);
  }
  for (let i = 12; i < 19; i += 1) {
    assert.equal(catalog[i].vertical, 'control', `Posición ${i + 1} debe ser control/lab`);
  }
});

test('V70-03: Layout PDP minmax(7fr, 5fr), miniaturas 48x48, PumpingParametricTable montado y purga léxica', () => {
  const slugCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/productSlugSolar.css'), 'utf8');
  assert.ok(slugCss.includes('minmax(0, 7fr) minmax(0, 5fr)'), 'Falta fix desktop grid minmax(0, 7fr) minmax(0, 5fr)');

  const qcardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(qcardSrc.includes('data-qcard-tab="photo"') && qcardSrc.includes('aria-selected="true"'));
  assert.ok(qcardSrc.includes('qcard-thumb-btn'), 'Faltan miniaturas cuadradas de galería');

  const dropInSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/DropInVerifierCore.astro'), 'utf8');
  assert.equal(dropInSrc.includes('Raíz normalizada'), false, 'No exponer "Raíz normalizada" en DropInVerifierCore');

  const pumpHub = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingHubIsland.astro'), 'utf8');
  assert.ok(pumpHub.includes('PumpingParametricTable'), 'PumpingParametricTable no puede quedar huérfano');

  const labels = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/i18nDomainLabels.js'), 'utf8');
  const home = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/HomeLandingIsland.astro'), 'utf8');
  for (const term of ['Puerta 1', 'Puerta 2', 'Puerta 3']) {
    assert.equal(labels.includes(term), false, `${term} detectado en i18nDomainLabels.js`);
    assert.equal(home.includes(term), false, `${term} detectado en HomeLandingIsland.astro`);
  }
});
