// tests/v90_purchase_first_root_closure.test.mjs
// Cierre Estructural V9.0 Purchase-First (Ola A + Ola B):
//   - Omnibox global en Header (#header-omnibox-input)
//   - Distinción semántica Buy Box (.smat-buy-cta) vs Navegación (.smat-nav-cta)
//   - Galería Dual WebP (<= 45 KB + <= 120 KB lazy -hd.webp) y Lightbox nativo <dialog>
//   - Túnel Paso 1 limpio en /cotizar/ + Modal Excel/SAP opt-in (#smat-bom-import-dialog)
//   - Catálogo consolidado (#fichas-atomicas sin DropInVerifierCore/drawers redundantes)
//   - Extracción DiagnosticFailureCard.astro y saneamiento de copy ASTM A532 / sin 24-48h

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('V90-A: Omnibox global, jerarquía semántica Buy Box, Lightbox nativo y BOM modal opt-in', () => {
  const headerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Header.astro'), 'utf8');
  assert.ok(headerSrc.includes('id="header-omnibox-input"'), 'Header.astro debe montar #header-omnibox-input');
  assert.ok(headerSrc.includes('initHeaderOmniboxSearch'), 'Header.astro debe enlazar initHeaderOmniboxSearch');

  const tokensCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/tokens.css'), 'utf8');
  assert.ok(tokensCss.includes('--smat-cta-buy') && tokensCss.includes('--smat-cta-nav'));

  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.ok(globalCss.includes('.smat-buy-cta') && globalCss.includes('.smat-nav-cta'));

  const pdpSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro'), 'utf8');
  assert.ok(pdpSrc.includes('id="smat-pdp-lightbox"') && pdpSrc.includes('data-pdp-add-cta'));
  assert.ok(pdpSrc.includes('-hd.webp'), 'ProductDetailIsland.astro debe enlazar carga lazy *-hd.webp al ampliar');

  const bomBarSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/wizard/FastLaneBomBar.astro'), 'utf8');
  assert.ok(bomBarSrc.includes('id="smat-bom-import-dialog"'), 'BOM importador debe vivir en <dialog>');

  const wizardCtrl = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/quoteWizardController.js'), 'utf8');
  assert.ok(wizardCtrl.includes('hasFabricacionItem'), 'Step 3 fabricación debe depender condicionalmente del carrito');
});

test('V90-B01..B07: Consolidación de catálogo (#fichas-atomicas) y pipeline dual WebP 57/57 HD', () => {
  assert.equal(fs.existsSync(path.join(SITE_ROOT, 'src/components/cores/DropInVerifierCore.astro')), false);

  const catalogSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CatalogFacetedIsland.astro'), 'utf8');
  assert.ok(catalogSrc.includes('id="fichas-atomicas"'), 'CatalogFacetedIsland.astro debe exponer #fichas-atomicas');
  assert.equal(catalogSrc.includes('#catalog-bombeo-drawer'), false);
  assert.equal(catalogSrc.includes('#catalog-processes-drawer'), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'public/images/productos/manifest.json'), 'utf8'));
  assert.equal(manifest.hygiene_version, 'v9.0-zero-oem');
  assert.equal(manifest.total_product_slides, 57);
  assert.equal(manifest.total_hd_slides, 57);
  assert.ok(manifest.max_bytes <= 46080, `Standard WebP max=${manifest.max_bytes} > 46080`);
  assert.ok(manifest.max_hd_bytes <= 122880, `HD WebP max=${manifest.max_hd_bytes} > 122880`);
  assert.equal(manifest.exif_stripped_all, true);

  for (const skuSlides of Object.values(manifest.galleries || {})) {
    for (const slide of skuSlides) {
      const hdRel = String(slide.hd_src || '').replace(/^\/+/, '');
      assert.ok(hdRel.endsWith('-hd.webp'), `Slide ${slide.src} sin hd_src *-hd.webp`);
      assert.ok(fs.existsSync(path.join(SITE_ROOT, 'public', hdRel)), `Falta archivo físico ${hdRel}`);
    }
  }
});

test('V90-B08..B15: Seam DiagnosticFailureCard, TrustMatrix ASTM A532, sin truncación ni SLA 24-48h', () => {
  const diagCardPath = path.join(SITE_ROOT, 'src/components/DiagnosticFailureCard.astro');
  assert.ok(fs.existsSync(diagCardPath), 'Debe existir DiagnosticFailureCard.astro');
  const diagCardSrc = fs.readFileSync(diagCardPath, 'utf8');
  assert.ok(diagCardSrc.includes('smat-buy-cta') && diagCardSrc.includes('primaryPhoto'));

  const diagHubSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticsHub.astro'), 'utf8');
  assert.ok(diagHubSrc.includes('DiagnosticFailureCard'), 'DiagnosticsHub.astro debe renderizar DiagnosticFailureCard');

  const trustSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/TrustMatrix.astro'), 'utf8');
  assert.ok(trustSrc.includes('METALURGIA CERTIFICADA ASTM A532'));
  assert.equal(trustSrc.includes('METALURGIA DE FUNDICIÓN OEM'), false);
  assert.equal(trustSrc.includes('OEM FOUNDRY METALLURGY'), false);

  for (const rel of [
    'src/pages/garantia.astro',
    'src/pages/en/warranty.astro',
    'src/components/islands/HomeLandingIsland.astro',
    'src/components/ProductStorefrontCard.astro',
    'src/components/ProductQuickCard.astro',
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    const lower = src.toLowerCase();
    assert.equal(lower.includes('24-48h') || lower.includes('24–48 h'), false, `SLA prohibido en ${rel}`);
    assert.equal(src.includes('-webkit-line-clamp: 2'), false, `Truncación con elipsis detectada en ${rel}`);
  }
});
