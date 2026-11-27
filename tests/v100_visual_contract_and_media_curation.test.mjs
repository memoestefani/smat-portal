// tests/v100_visual_contract_and_media_curation.test.mjs
// Contrato Visual V10.0 Ola C1 (Cascada CSS BEM, 23 SKUs con 4 Bajo Proyecto, Títulos Escaneables, Reuso <= 2 y Buy Box PDP)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertAlmacenPhotoReuseCap, validateMediaGallerySpec } from '../tools/media_hygiene_guard.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('V100-C01..C04: Orden BEM :where(.smat-sf-card) antes de --horizontal y simetría institucional', () => {
  const sfCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/storefront-layout.css'), 'utf8');
  const idxBase = sfCss.indexOf(':where(.smat-sf-card)');
  const idxHoriz = sfCss.indexOf('.smat-sf-card.smat-sf-card--horizontal');
  assert.ok(idxBase >= 0 && idxHoriz > idxBase, 'storefront-layout.css debe declarar :where(.smat-sf-card) antes de --horizontal');
  assert.ok(sfCss.includes('.smat-sf-badge--proyecto'), 'Debe definir estilo .smat-sf-badge--proyecto');
  assert.ok(sfCss.includes('.smat-trust-split-grid'), 'Debe definir .smat-trust-split-grid 1fr 1fr');

  const baseLayout = fs.readFileSync(path.join(SITE_ROOT, 'src/layouts/BaseLayout.astro'), 'utf8');
  assert.ok(baseLayout.includes('storefront-layout.css'), 'BaseLayout debe importar storefront-layout.css');

  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.equal(globalCss.includes('.smat-sf-card--horizontal'), false, 'global.css no debe duplicar reglas .smat-sf-card--horizontal');

  const contactEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/contacto.astro'), 'utf8');
  assert.equal(contactEs.includes('btn-primary'), false, 'contacto.astro no debe conservar .btn-primary legado');
  assert.ok(contactEs.includes('smat-trust-split-grid'));
});

test('V100-C05..C08: 23 SKUs (19+4 Proyecto), short_title <= 62 chars, reuso almacén <= 2 familias y cero fotos defectuosas', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json'), 'utf8'));
  assert.equal(catalog.length, 23);
  const projectSkus = catalog.filter((s) => s.stock_regime === 'bajo_proyecto');
  assert.equal(projectSkus.length, 4, 'Deben existir exactamente 4 SKUs bajo_proyecto');

  for (const s of catalog) {
    assert.ok(s.short_title_es && s.short_title_es.length <= 62, `${s.sku_id} short_title_es inválido`);
    assert.ok(s.short_title_en && s.short_title_en.length <= 62, `${s.sku_id} short_title_en inválido`);
    assert.ok(s.compat_short_es && s.compat_short_en, `${s.sku_id} requiere compat_short_es/en`);
  }

  const specDoc = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/media_gallery_spec.json'), 'utf8'));
  const atomicParts = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/atomic_parts.json'), 'utf8'));
  const validation = validateMediaGallerySpec(specDoc, catalog, atomicParts);
  assert.equal(validation.checkedSkus, 23);

  const rawSpec = JSON.stringify(specDoc).toLowerCase();
  for (const banned of [
    'malla_fina_poliuretano_rojo_panel',
    'tamizador_cilindros_soporte_lab',
    'malla para criba',
    '029a05',
    'shibo',
    'xkjgroup',
    'allpumpscn',
    'pinnxun',
  ]) {
    assert.equal(rawSpec.includes(banned), false, `Foto/marca vetada '${banned}' presente en media_gallery_spec.json`);
  }

  const reImg = /\/images\/almacen\/[a-z0-9-]+\.webp/g;
  const routeMap = {};
  const entries = [
    ['home', 'src/components/islands/HomeLandingIsland.astro'],
    ['cotizar', 'src/components/QuoteWizard.astro'],
    ['contacto', 'src/pages/contacto.astro'],
    ['cumplimiento', 'src/pages/cumplimiento.astro'],
    ['garantia', 'src/pages/garantia.astro'],
    ['nosotros', 'src/pages/nosotros.astro'],
  ];
  for (const [family, rel] of entries) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    routeMap[family] = src.match(reImg) || [];
  }
  assertAlmacenPhotoReuseCap(routeMap, 2);
});

test('V100-C09..C12: Buscador único global, Catálogo limpio, PDP Buy Box compacto y módulos extraídos', () => {
  const home = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/HomeLandingIsland.astro'), 'utf8');
  assert.equal(home.includes('id="home-omnibox-form"'), false, 'HomeLandingIsland no debe duplicar buscador del Header');
  assert.equal(home.includes('Ver los 19 productos'), false);

  const catFacet = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CatalogFacetedIsland.astro'), 'utf8');
  assert.equal(catFacet.includes('id="catalog-facet-search"'), false, 'CatalogFacetedIsland no debe duplicar buscador del Header');
  assert.equal(catFacet.includes('Piezas Atómicas'), false, 'CatalogFacetedIsland no debe usar Piezas Atómicas');
  assert.ok(catFacet.includes('Refacciones por Código'));

  const slugCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/productSlugSolar.css'), 'utf8');
  assert.ok(slugCss.split(/\r?\n/).length < 700, 'productSlugSolar.css debe quedar bajo 700 LOC');
  assert.ok(fs.existsSync(path.join(SITE_ROOT, 'src/scripts/pdpBuyBoxController.js')));
  assert.ok(fs.existsSync(path.join(SITE_ROOT, 'src/styles/pdp-gallery-lightbox.css')));

  const qcard = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(qcard.includes('smat-pdp-lightbox-overlay') && qcard.includes('smat-qcard-tech-tabs'));

  const pdp = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro'), 'utf8');
  const buyBox = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductBuyBox.astro'), 'utf8');
  assert.ok(buyBox.includes('data-alloy-chip') && pdp.includes('smat-slug-below-lead'));
});
