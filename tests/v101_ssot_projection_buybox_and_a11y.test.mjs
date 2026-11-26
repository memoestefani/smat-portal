import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('V101-01..04: Proyección SSOT 23/23 SKUs, <title> único, Footer dinámico WCAG AAA y curación d4029/Rotap', async () => {
  const {
    getQuickProductsCatalog,
    getVerticalCatalogSubset,
    getProjectCatalogSkus,
  } = await import('../src/scripts/quickProductsCatalog.js');

  const fullCatalog = getQuickProductsCatalog();
  assert.equal(fullCatalog.length, 23);

  const unionIds = new Set();
  for (const vertical of ['bombeo', 'clasificacion', 'flotacion', 'filtracion', 'control']) {
    const subset = getVerticalCatalogSubset(vertical);
    assert.ok(subset.length >= 1, `Vertical ${vertical} debe proyectar >= 1 SKU`);
    subset.forEach((s) => unionIds.add(s.id));
  }
  const projectSkus = getProjectCatalogSkus();
  assert.equal(projectSkus.length, 4, 'Deben existir exactamente 4 SKUs bajo proyecto');
  projectSkus.forEach((s) => unionIds.add(s.id));
  assert.equal(unionIds.size, 23, 'La unión de verticales + proyecto debe cubrir los 23 SKUs');

  const layoutSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/layouts/BaseLayout.astro'), 'utf8');
  assert.ok(layoutSrc.includes('/SMAT Minerals/i.test(title)'), 'BaseLayout debe evitar doble sufijo SMAT Minerals');

  const footerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Footer.astro'), 'utf8');
  assert.ok(footerSrc.includes('getQuickProductsCatalog'));
  assert.equal(footerSrc.includes('19 Productos'), false);
  assert.equal(footerSrc.includes('19 SKUs'), false);
  assert.ok(footerSrc.includes('#e2e8f0') && footerSrc.includes('#cbd5e1'));

  const mediaSpec = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/media_gallery_spec.json'), 'utf8'));
  assert.ok(mediaSpec.atomic_parts.d4029.relPath.includes('IMG-20210224-WA0020.jpeg'));
  assert.ok(mediaSpec.atomic_parts.d4029.cropBox, 'd4029 debe recortar limpio sin letras con plumón');
  assert.ok(mediaSpec.sku_galleries['SMAT-LAB-ROTAP-MECH'].slides[0].relPath.includes('tamizador_tapa_plato_receptor_bronce.jpg'));
  assert.ok(mediaSpec.almacen_gallery.length >= 8, 'Deben existir >= 8 fotos exclusivas en almacen_gallery');

  const guard = await import('../tools/media_hygiene_guard.mjs');
  assert.equal(typeof guard.assertSiblingVerticalDhashSeparation, 'function');
});

test('V101-05..08: Hub Pumping limpio, Home con 4 equipos proyecto, Clasificación unificada y /nosotros/ exclusivo', () => {
  const pumpStratum = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingAssistantStratum2.astro'), 'utf8');
  assert.equal(pumpStratum.includes('CircuitNavigator'), false);
  assert.equal(pumpStratum.includes('id="bombeo-circuit-drawer"'), false);
  assert.equal(pumpStratum.includes('+ Bandeja'), false);

  const homeSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/HomeLandingIsland.astro'), 'utf8');
  assert.ok(homeSrc.includes('id="home-project-equipment"'));
  assert.ok(homeSrc.includes('getProjectCatalogSkus'));

  const cycSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CycloneScreenIsland.astro'), 'utf8');
  assert.ok(cycSrc.includes("getVerticalCatalogSubset('clasificacion')"));
  assert.ok(cycSrc.includes('Trituración, Molienda, Hidrociclones y Cribas'));

  for (const rel of ['src/pages/nosotros.astro', 'src/pages/en/about.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.equal(src.includes('almacen-bomba-6x4-dah.webp'), false, `${rel} no debe clonar héroe de Portada`);
    assert.equal(src.includes('almacen-volutas-cromo-caja.webp'), false, `${rel} no debe clonar volutas de Portada`);
    assert.equal(src.includes('almacen-rodamientos-ah.webp'), false, `${rel} no debe clonar rodamientos de Portada`);
    assert.ok(src.includes('almacen-bomba-8x6-piso.webp'));
  }

  const sfCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/storefront-layout.css'), 'utf8');
  assert.ok(sfCss.includes('justify-content: flex-start'));
  assert.ok(sfCss.includes('button:disabled'));
});

test('V101-09..12: PDP compacto móvil, QuoteWizard sin fugas EN, Header Cotización, Catálogo 6/23 y Diagnóstico homogéneo', () => {
  const pdpSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro'), 'utf8');
  assert.ok(pdpSrc.includes('showPrimaryTrayBtn={false}') && pdpSrc.includes('showPairBtn={false}'));
  assert.equal(pdpSrc.includes('id="slug-coupled-and-codes-drawer" open'), false);
  assert.ok(pdpSrc.includes('window.print()'));

  const pdpCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/productSlugSolar.css'), 'utf8');
  assert.ok(pdpCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'));
  assert.ok(pdpCss.includes('@media print'));

  const qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.equal((qwSrc.match(/class="wb-quick-thumb"/g) || []).length, 4);
  assert.ok(qwSrc.includes("'Sleeve inspection'") && qwSrc.includes("'Wet-end swap'") && qwSrc.includes("'Volute / liner'"));
  assert.equal(qwSrc.includes('Partidas en tu Carrito'), false);

  const traySrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/RequisitionTraySummary.astro'), 'utf8');
  assert.ok(traySrc.includes('class="req-tray-card hidden"'));

  const headerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Header.astro'), 'utf8');
  assert.ok(headerSrc.includes("isEs ? 'Cotización' : 'Quote'"));
  assert.equal(headerSrc.includes("'Bandeja'"), false);

  const diagCardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticFailureCard.astro'), 'utf8');
  assert.ok(diagCardSrc.includes('data-ergos-homogeneous-card="1"'));

  const procSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProcessControlIsland.astro'), 'utf8');
  assert.ok(procSrc.includes('Prensa de Laboratorio'));
  assert.equal(procSrc.includes('+ Bandeja'), false);
});
