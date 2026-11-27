import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { assertBimodalAndFramingContract } from '../tools/media_hygiene_guard.mjs';

const SITE_ROOT = path.resolve(import.meta.dirname, '..');

function readSiteFile(relPath) {
  return fs.readFileSync(path.join(SITE_ROOT, relPath), 'utf8');
}

test('v11.0 D3/SSOT: Zero phantom SKUs, real weight estimates, zero expeller mechanical seal copy', () => {
  const catalogRaw = readSiteFile('data/quick_checkout_Catalog.json');
  const catalog = JSON.parse(catalogRaw);
  const skus = Array.isArray(catalog.products) ? catalog.products : (Array.isArray(catalog) ? catalog : catalog.items || []);

  const ids = new Set(skus.map((s) => s.id));
  assert.ok(ids.has('SMAT-PUMP-WETKIT-554'), 'Canonical SMAT-PUMP-WETKIT-554 must exist in SSOT');
  assert.ok(ids.has('SMAT-FLOT-MECH-18SP'), 'Canonical SMAT-FLOT-MECH-18SP must exist in SSOT');

  const cyc = skus.find((s) => s.id === 'SMAT-CYC-D6-D20');
  assert.ok(cyc && Number(cyc.mass_kg) >= 150 && cyc.mass_is_estimate === true, 'SMAT-CYC-D6-D20 must declare mass_kg >= 150 and mass_is_estimate: true');

  const flot = skus.find((s) => s.id === 'SMAT-FLOT-MECH-18SP');
  assert.ok(flot && Number(flot.mass_kg) >= 150 && flot.mass_is_estimate === true, 'SMAT-FLOT-MECH-18SP must declare mass_kg >= 150 and mass_is_estimate: true');

  const expeller = skus.find((s) => s.id === 'SMAT-PUMP-EXPELLER-KIT');
  assert.ok(expeller, 'SMAT-PUMP-EXPELLER-KIT must exist');
  const expText = JSON.stringify(expeller).toLowerCase();
  assert.equal(expText.includes('sello mecánico') || expText.includes('sellado mecánico') || expText.includes('mechanical seal'), false, 'Expeller kit must not describe a mechanical seal');

  const pumpingStratum2 = readSiteFile('src/components/islands/PumpingAssistantStratum2.astro');
  assert.equal(pumpingStratum2.includes('SMAT-PUMP-KIT-554-'), false, 'PumpingAssistantStratum2 must not reference phantom SMAT-PUMP-KIT-554-* SKUs');
  assert.ok(pumpingStratum2.includes('pumpingKitPresets'), 'PumpingAssistantStratum2 must consume pumpingKitPresets SSOT');

  const flotationIsland = readSiteFile('src/components/islands/FlotationCalculatorIsland.astro');
  assert.equal(flotationIsland.includes('SMAT-FLOT-TANK-COND'), false, 'FlotationCalculatorIsland must not reference phantom SMAT-FLOT-TANK-COND');
  assert.ok(flotationIsland.includes('SMAT-FLOT-MECH-18SP'), 'FlotationCalculatorIsland must use canonical SMAT-FLOT-MECH-18SP');
});

test('v11.0 D1/D2/CSS Cascade: BaseLayout 0 inline styles, @layer base reset, no Newsreader, no chip clipping', () => {
  const baseLayout = readSiteFile('src/layouts/BaseLayout.astro');
  assert.equal(/<style\b/i.test(baseLayout), false, 'BaseLayout.astro must contain zero unlayered <style> blocks');

  const globalCss = readSiteFile('src/styles/global.css');
  assert.match(globalCss, /@import\s+['"]\.\/base-reset\.css['"]\s+layer\(base\)/, 'global.css must import ./base-reset.css into layer(base)');

  const baseReset = readSiteFile('src/styles/base-reset.css');
  assert.match(baseReset, /@layer\s+base/, 'base-reset.css must declare @layer base');

  const tokensCss = readSiteFile('src/styles/tokens.css');
  assert.equal(tokensCss.includes('Newsreader'), false, 'tokens.css must not declare missing Newsreader serif font');
  assert.equal(tokensCss.includes('EB Garamond'), false, 'tokens.css must not declare missing EB Garamond font');
  assert.equal(tokensCss.includes('--apple-bg-canvas'), false, 'tokens.css must not contain dead dark-mode --apple-bg-canvas token');

  const slugCss = readSiteFile('src/styles/productSlugSolar.css');
  assert.equal(/\.smat-slug-mat-chip\s*\{[^}]*max-height\s*:\s*48px/i.test(slugCss), false, 'Product slug alloy chips must not clip text with max-height: 48px');
});

test('v11.0 D4/D6/D7/D8: Single global omnibox, 23+13 open catalog, ProductBuyBox -hd.webp, clean empty checkout', () => {
  const home = readSiteFile('src/components/islands/HomeLandingIsland.astro');
  assert.equal(home.includes('id="home-omnibox-form"'), false, 'HomeLandingIsland must not duplicate #home-omnibox-form');

  const catalogFaceted = readSiteFile('src/components/islands/CatalogFacetedIsland.astro');
  assert.equal(catalogFaceted.includes('id="catalog-facet-search"'), false, 'CatalogFacetedIsland must not render redundant #catalog-facet-search');
  assert.equal(catalogFaceted.includes('id="atomic-parts-catalog-drawer"'), false, 'CatalogFacetedIsland must expose atomic codes open in #fichas-atomicas without a closed drawer');

  const avenues = readSiteFile('src/components/CatalogAvenuesMatrix.astro');
  assert.equal(avenues.includes('catalog-show-all-btn'), false, 'CatalogAvenuesMatrix must not cap SKUs behind catalog-show-all-btn');
  assert.equal(avenues.includes('idx >= 6'), false, 'CatalogAvenuesMatrix must not hide idx >= 6');

  const buyBox = readSiteFile('src/components/ProductBuyBox.astro');
  assert.ok(buyBox.includes('formatSkuMassLabel'), 'ProductBuyBox must use formatSkuMassLabel helper');
  assert.ok(buyBox.includes('getSkuPrimaryCtaLabel'), 'ProductBuyBox must use getSkuPrimaryCtaLabel helper');

  const quickCard = readSiteFile('src/components/ProductQuickCard.astro');
  assert.ok(quickCard.includes('-hd.webp'), 'ProductQuickCard must serve -hd.webp for primary PDP photo views');

  const wizard = readSiteFile('src/components/QuoteWizard.astro');
  assert.ok(wizard.includes('data-wb-has-items="0"'), 'QuoteWizard must default to data-wb-has-items="0" single-column layout when empty');
  assert.ok(/id="qw-dossier-disclosure"[^>]*hidden/.test(wizard), 'QuoteWizard must keep #qw-dossier-disclosure hidden when cart is empty');
  assert.equal(wizard.includes('wb-quick-sku-btn'), false, 'QuoteWizard must not display 4 competing quick-SKU cards above empty quote');
});

test('v11.0 D5/B1..B3: Guard bimodal WebP/HD, encuadre limpio cero talleres y Shot List Durango', () => {
  const manifest = JSON.parse(readSiteFile('public/images/productos/manifest.json'));
  const mediaSpec = JSON.parse(readSiteFile('data/media_gallery_spec.json'));
  const guardRes = assertBimodalAndFramingContract(manifest, mediaSpec);
  assert.equal(guardRes.checkedSlides, 69);
  assert.equal(guardRes.checkedHdSlides, 69);
  assert.ok(mediaSpec.atomic_parts.d4029.cropBox, 'd4029 must define closed cropBox');
  assert.equal(Boolean(mediaSpec.atomic_parts.d4028.rotateDeg), false, 'd4028 must use native vertical EXIF upright orientation');
  const shotListPath = path.resolve(SITE_ROOT, '..', 'inventario', 'shot_list_durango_v11.md');
  assert.ok(fs.existsSync(shotListPath), 'shot_list_durango_v11.md must exist');
  const shotList = fs.readFileSync(shotListPath, 'utf8');
  assert.ok(shotList.includes('29') && shotList.includes('DSCF'), 'Shot list must inventory 29 DSCF LMI files separately');
});
