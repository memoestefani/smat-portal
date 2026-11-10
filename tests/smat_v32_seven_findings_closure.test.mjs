import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  getQuickProductsCatalog,
  getQuickProductBySlugOrAlias,
  getAllStaticProductRouteEntries
} from '../src/scripts/quickProductsCatalog.js';
import {
  FNV1A_HASH_TO_SKU_INDEX,
  verifyDropInEquivalence
} from '../src/scripts/dropInEquivalenceGuard.js';
import {
  SKU_TO_CURATED_PHOTO_SPEC,
  computeImageDHash64
} from '../tools/build_product_images.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('Hallazgo 1 (D1 = 1-C+ & D2 = 2-C+ · ARB-SMAT-31/32): Cero clases utilitarias Tailwind huérfanas, bloque <style> nativo Solar Light-First y .hidden/[hidden] en global.css', () => {
  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.ok(globalCss.includes('.hidden, [hidden]'), 'global.css debe definir la guarda universal .hidden, [hidden]');
  assert.ok(globalCss.includes('display: none !important;'), 'global.css debe forzar display: none !important;');

  const v32AstroFiles = [
    'src/components/ProductQuickCard.astro',
    'src/components/QuickOrderTray.astro',
    'src/components/CycloneAndScreenReport.astro',
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro'
  ];

  const bannedTailwindRegex = /\b(bg-slate-\d+|text-slate-\d+|border-slate-\d+|min-h-\[\d+px\]|grid-cols-\d+|rounded-2xl|shadow-2xl|backdrop-blur)\b/;

  for (const rel of v32AstroFiles) {
    const content = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(content.includes('<style>'), `${rel} debe tener su bloque <style> nativo`);
    assert.equal(
      bannedTailwindRegex.test(content),
      false,
      `${rel} no debe contener clases utilitarias Tailwind huérfanas`
    );
  }

  const cardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(cardSrc.includes('data-qcard-panel="photo" class="smat-qcard-panel hidden" hidden'));
  assert.ok(cardSrc.includes('data-qcard-panel="xray" class="smat-qcard-panel hidden" hidden'));

  const traySrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuickOrderTray.astro'), 'utf8');
  assert.ok(traySrc.includes('id="smat-qtray-drawer"'));
  assert.ok(traySrc.includes('class="smat-qtray-drawer hidden"'));
  assert.ok(traySrc.includes('\n    hidden\n'));
});

test('Hallazgo 2 (D3 = 3-C+ & D7 = 7-C+ · ARB-SMAT-33/37): 19 SKUs canónicos de prd_smatminerals_web_v3.md §6.1 (7 Lab + 5 Bombeo + 2 Ciclón/Casado + 2 Mallas + 2 Filtración + 1 Flotación) y Unión Discriminada Honesta', () => {
  const catalog = getQuickProductsCatalog();
  assert.equal(catalog.length, 19);

  const expectedCanonicalIds = [
    'SMAT-LAB-MARCY-1000',
    'SMAT-LAB-VASO-1000',
    'SMAT-LAB-TAMIZ-E11',
    'SMAT-LAB-ROTAP-MECH',
    'SMAT-LAB-PLATO-TENT',
    'SMAT-LAB-PULV-DISC',
    'SMAT-LAB-FILTRO-BATCH',
    'SMAT-PUMP-IMP-AH',
    'SMAT-PUMP-WETKIT-554',
    'SMAT-PUMP-EXPELLER-KIT',
    'SMAT-PUMP-BRG-005M',
    'SMAT-PUMP-LINERS-AH',
    'SMAT-CYC-D6-D20',
    'SMAT-COUPLED-PUMP-CYC',
    'SMAT-SCR-TH48-30',
    'SMAT-SCR-MOD-1X1',
    'SMAT-FILT-CLOTH-PLATE',
    'SMAT-FILT-SHIFTER-CHAIN',
    'SMAT-FLOT-MECH-18SP'
  ];

  const actualIds = catalog.map((s) => s.id);
  assert.deepEqual(actualIds, expectedCanonicalIds);

  const expectedSlugsEs = [
    'balanza-marcy',
    'vaso-balanza-marcy-1000ml',
    'tamices-certificados-astm-e11',
    'tamizador-mecanico-laboratorio',
    'plato-tentadura-metalurgico',
    'pulverizador-discos-laboratorio',
    'filtro-prensa-batch-laboratorio',
    'impulsor-bomba-lodos-serie-ah',
    'lote-humedo-554-bomba-ah',
    'kit-sellado-seco-expeller-ah',
    'cartucho-rodamientos-005m',
    'lainas-succion-y-platos-ah',
    'hidrociclon-completo-y-boquillas-d6-d20',
    'paquete-casado-bomba-hidrociclon',
    'mallas-finas-uretano-th48-30',
    'modulos-poliuretano-1x1-pin-camisa',
    'lonas-y-placas-filtro-prensa-16bar',
    'mecanismo-plate-shifter-y-cadenas',
    'mecanismo-suspendido-flotacion-18sp'
  ];
  assert.deepEqual(catalog.map((s) => s.slug_es), expectedSlugsEs);

  // Unión Discriminada Honesta (D7 = 7-C+): sólo los 6 SKUs de bombeo tienen linked_atomic_codes > 0
  const pumpIds = new Set([
    'SMAT-PUMP-IMP-AH',
    'SMAT-PUMP-WETKIT-554',
    'SMAT-PUMP-EXPELLER-KIT',
    'SMAT-PUMP-BRG-005M',
    'SMAT-PUMP-LINERS-AH',
    'SMAT-COUPLED-PUMP-CYC'
  ]);
  for (const sku of catalog) {
    if (pumpIds.has(sku.id)) {
      assert.ok(sku.atomic_codes.length > 0, `SKU de bombeo ${sku.id} debe vincular códigos atómicos`);
    } else {
      assert.equal(
        sku.atomic_codes.length,
        0,
        `SKU no-bomba ${sku.id} no debe vincular códigos de bomba falsos (encontrados: ${sku.atomic_codes})`
      );
      assert.ok(sku.coupled_pair_sku, `SKU ${sku.id} debe definir coupled_pair_sku`);
      assert.ok(sku.reorder_window_days > 0, `SKU ${sku.id} debe definir reorder_window_days`);
    }
  }

  // Resolución retrocompatible de alias legacy
  assert.equal(getQuickProductBySlugOrAlias('SKU-QC-01')?.id, 'SMAT-PUMP-IMP-AH');
  assert.equal(getQuickProductBySlugOrAlias('impulsor-5-alabes-alto-cromo-cr27')?.id, 'SMAT-PUMP-IMP-AH');
  assert.ok(getAllStaticProductRouteEntries('es').length >= 38);
  assert.ok(getAllStaticProductRouteEntries('en').length >= 38);
});

test('Hallazgo 3 (D4 = 4-C+ · ARB-SMAT-34): Lista blanca explícita 1:1 de 19 fotos reales Cero-OEM (0 * expo.png, 0 operador módulo %, fondo Solar #F8FAFC)', async () => {
  const builderSrc = fs.readFileSync(path.join(SITE_ROOT, 'tools/build_product_images.mjs'), 'utf8');
  assert.equal(builderSrc.includes('expo.png'), false, 'build_product_images.mjs no debe usar * expo.png');
  assert.equal(builderSrc.includes('cleanCandidates['), false, 'build_product_images.mjs no debe usar selección ciega por módulo');
  const specEntries = Object.entries(SKU_TO_CURATED_PHOTO_SPEC);
  assert.equal(specEntries.length, 19);

  const uniqueSources = new Set(specEntries.map(([, s]) => s.relPath || s.sourceRel));
  assert.equal(uniqueSources.size, 19, 'Los 19 SKUs deben mapear biyectivamente a 19 archivos fotográficos distintos');
  for (const [skuId, spec] of specEntries) {
    const rel = spec.relPath || spec.sourceRel;
    assert.equal(rel.toLowerCase().includes('expo'), false, `Prohibido * expo.png en ${skuId}`);
  }

  const catalog = getQuickProductsCatalog();
  const shaSet = new Set();
  const dhashSet = new Set();
  for (const sku of catalog) {
    const fullPath = path.join(SITE_ROOT, 'public', sku.photo_webp.replace(/^\//, ''));
    assert.ok(fs.existsSync(fullPath), `Debe existir ${fullPath}`);
    const buf = fs.readFileSync(fullPath);
    assert.ok(buf.length > 100 && buf.length <= 46080);
    shaSet.add(crypto.createHash('sha256').update(buf).digest('hex'));
    dhashSet.add(await computeImageDHash64(buf));
  }
  assert.equal(shaSet.size, 19);
  assert.equal(dhashSet.size, 19);
});

test('Hallazgo 4 (D5 = 5-C+ · ARB-SMAT-35): Los 5 esquemas CAD SVG de prd_smatminerals_web_v3.md §8 D6 en TechnicalDiagrams.astro + cero raíces OEM en texto plano en dropInEquivalenceGuard.js', () => {
  const diagSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/TechnicalDiagrams.astro'), 'utf8');
  for (const requiredDiagram of [
    'cyclone_d6_d20',
    'coupled_pump_cyclone',
    'urethane_screen_th48',
    'lab_comminution_pan',
    'filter_plate_shifter'
  ]) {
    assert.ok(diagSrc.includes(requiredDiagram), `TechnicalDiagrams.astro debe soportar ${requiredDiagram}`);
  }

  const guardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/dropInEquivalenceGuard.js'), 'utf8');
  assert.equal(guardSrc.includes('ROOT_TO_SKU_MAP'), false, 'dropInEquivalenceGuard.js no debe contener ROOT_TO_SKU_MAP en texto plano');
  for (const rawRoot of ["'E4147'", "'D3110'", "'E4083'", "'DAM005'", "'F6147'"]) {
    assert.equal(guardSrc.includes(rawRoot), false, `Raíz OEM en texto plano prohibida en dropInEquivalenceGuard.js: ${rawRoot}`);
  }
  assert.ok(Object.keys(FNV1A_HASH_TO_SKU_INDEX).length >= 25);
  assert.equal(verifyDropInEquivalence('MARCY1000').matched, true);
  assert.equal(verifyDropInEquivalence('MARCY1000').canonicalSkuId, 'SMAT-LAB-MARCY-1000');

  // Cero nomenclatura OEM 4/3 C, 6/4 D, 8/6 E en páginas de catálogo
  for (const rel of ['src/pages/catalogo/[code].astro', 'src/pages/en/catalog/[code].astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('.replace(/4\\/3\\s*C/gi, \'4x3\')'), `${rel} debe sanitizar 4/3 C -> 4x3`);
  }
});

test('Hallazgo 5 (D6 = 6-C+ · ARB-SMAT-36): Los 3 botones de acción en productos/[slug].astro y QuickOrderTray.astro (Bandeja B2B, WhatsApp oficial 526183670664 y URL RFC 3986 /?sku=...#workbench)', () => {
  for (const rel of [
    'src/components/QuickOrderTray.astro',
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro'
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.equal(src.includes('526181302221'), false, `${rel} no debe contener el teléfono ajeno 526181302221`);
    assert.ok(src.includes('526183670664'), `${rel} debe usar el WhatsApp oficial de Don Manuel 526183670664`);
    assert.equal(src.includes('/#workbench?sku='), false, `${rel} no debe usar URL rota /#workbench?sku=`);
    assert.equal(src.includes('/en/#workbench?sku='), false, `${rel} no debe usar URL rota /en/#workbench?sku=`);
  }

  const slugEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/productos/[slug].astro'), 'utf8');
  assert.ok(slugEs.includes('data-quick-tray-add={sku.id}'));
  assert.ok(slugEs.includes('data-slug-add-to-tray={sku.id}'));
  assert.ok(slugEs.includes('/?sku=${encodeURIComponent(sku.id)}&mat=${encodeURIComponent(sku.default_material)}#workbench'));

  const slugEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/products/[slug].astro'), 'utf8');
  assert.ok(slugEn.includes('/en/?sku=${encodeURIComponent(sku.id)}&mat=${encodeURIComponent(sku.default_material)}#workbench'));
});

test('Hallazgo 6 (D8 = 8-C+ · ARB-SMAT-38): Las 38+ rutas históricas Wayback Machine (2013-2025) de prd_smatminerals_web_v3.md §6.3 en redirects.csv y _redirects + orden topológico preflight', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'package.json'), 'utf8'));
  assert.equal(
    pkg.scripts.preflight,
    'node ./tools/build_product_images.mjs && powershell -ExecutionPolicy Bypass -File ./tools/compile_redirects.ps1 && astro check && astro build && npm test && npm run gate'
  );

  const redirectsTxt = fs.readFileSync(path.join(SITE_ROOT, 'public/_redirects'), 'utf8');
  const requiredWaybackRules = [
    '/producto/balanza-marcy /productos/balanza-marcy/ 301',
    '/producto/balanza-marcy/ /productos/balanza-marcy/ 301',
    '/producto/balanza-marcy-2 /productos/vaso-balanza-marcy-1000ml/ 301',
    '/producto/balanza-marcy-2/ /productos/vaso-balanza-marcy-1000ml/ 301',
    '/producto/plato-tentadura /productos/plato-tentadura-metalurgico/ 301',
    '/producto/plato-tentadura/ /productos/plato-tentadura-metalurgico/ 301',
    '/etiqueta-producto/rotap /productos/tamizador-mecanico-laboratorio/ 301',
    '/etiqueta-producto/rotap/ /productos/tamizador-mecanico-laboratorio/ 301',
    '/etiqueta-producto/duratap /productos/tamizador-mecanico-laboratorio/ 301',
    '/etiqueta-producto/duratap/ /productos/tamizador-mecanico-laboratorio/ 301',
    '/etiqueta-producto/tamices /productos/tamices-certificados-astm-e11/ 301',
    '/etiqueta-producto/tamices/ /productos/tamices-certificados-astm-e11/ 301',
    '/laboratorio /control-de-procesos/ 301',
    '/laboratorio/ /control-de-procesos/ 301',
    '/categoria-producto/hidrociclon /clasificacion/ 301',
    '/categoria-producto/hidrociclon/ /clasificacion/ 301',
    '/clasificar_solidos.php /clasificacion/ 301',
    '/categoria-producto/mallas /productos/mallas-finas-uretano-th48-30/ 301',
    '/categoria-producto/mallas/ /productos/mallas-finas-uretano-th48-30/ 301',
    '/etiqueta-producto/modulo-de-poliuretano /productos/modulos-poliuretano-1x1-pin-camisa/ 301',
    '/etiqueta-producto/modulo-de-poliuretano/ /productos/modulos-poliuretano-1x1-pin-camisa/ 301',
    '/producto/impulsor-ah /productos/impulsor-bomba-lodos-serie-ah/ 301',
    '/producto/impulsor-ah/ /productos/impulsor-bomba-lodos-serie-ah/ 301',
    '/producto/bearing-assembly-ah /productos/cartucho-rodamientos-005m/ 301',
    '/producto/bearing-assembly-ah/ /productos/cartucho-rodamientos-005m/ 301',
    '/producto/expeller-ah /productos/kit-sellado-seco-expeller-ah/ 301',
    '/producto/expeller-ah/ /productos/kit-sellado-seco-expeller-ah/ 301',
    '/producto/2119 /productos/kit-sellado-seco-expeller-ah/ 301',
    '/producto/2119/ /productos/kit-sellado-seco-expeller-ah/ 301',
    '/producto/2197 /productos/lainas-succion-y-platos-ah/ 301',
    '/producto/2197/ /productos/lainas-succion-y-platos-ah/ 301',
    '/producto/bomba-lodos-ah /productos/lote-humedo-554-bomba-ah/ 301',
    '/producto/bomba-lodos-ah/ /productos/lote-humedo-554-bomba-ah/ 301',
    '/equipos-para-la-flotacion-de-minerales /productos/mecanismo-suspendido-flotacion-18sp/ 301',
    '/equipos-para-la-flotacion-de-minerales/ /productos/mecanismo-suspendido-flotacion-18sp/ 301',
    '/shop /catalogo/ 301',
    '/shop/ /catalogo/ 301',
    '/comprar /catalogo/ 301',
    '/comprar/ /catalogo/ 301',
    '/quote-list /catalogo/ 301',
    '/quote-list/ /catalogo/ 301',
    '/carrito /catalogo/ 301',
    '/carrito/ /catalogo/ 301'
  ];

  for (const rule of requiredWaybackRules) {
    assert.ok(redirectsTxt.includes(rule), `Falta regla Wayback §6.3 en public/_redirects: ${rule}`);
  }
});

test('Hallazgo 7 (D9 = 9-C+ · ARB-SMAT-39): Purga de SLA MISMO DÍA / Banco de Pruebas en acuse.astro, badge-opex en celdas.astro, y Puerta 1 = Bombeo de Lodos sin Skids en index.astro y Header.astro', () => {
  const acuseEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/acuse.astro'), 'utf8');
  const acuseEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/thank-you.astro'), 'utf8');
  assert.equal(acuseEs.includes('SLA MISMO DÍA HÁBIL'), false);
  assert.equal(acuseEs.toLowerCase().includes('banco de pruebas'), false);
  assert.equal(acuseEn.includes('SAME-DAY SLA'), false);
  assert.equal(acuseEn.toLowerCase().includes('test bench'), false);

  const celdasEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/flotacion/celdas.astro'), 'utf8');
  const celdasEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/flotation/cells.astro'), 'utf8');
  assert.equal(celdasEs.includes('badge-capex'), false);
  assert.ok(celdasEs.includes('badge-opex'));
  assert.equal(celdasEn.includes('badge-capex'), false);
  assert.ok(celdasEn.includes('badge-opex'));

  const indexEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/index.astro'), 'utf8');
  const indexEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/index.astro'), 'utf8');
  const headerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Header.astro'), 'utf8');

  const door1IdxEs = indexEs.indexOf('Puerta 1 • Bombeo de Lodos y Refacciones');
  const door2IdxEs = indexEs.indexOf('Puerta 2 • Clasificación y Cribado Fino');
  const door3IdxEs = indexEs.indexOf('Puerta 3 • Flotación, Filtración y Lab');
  assert.ok(door1IdxEs > 0 && door1IdxEs < door2IdxEs && door2IdxEs < door3IdxEs, 'Puerta 1 debe ser Bombeo de Lodos en index.astro');

  const door1IdxEn = indexEn.indexOf('Door 1 • Slurry Pumping & Wear Spares');
  const door2IdxEn = indexEn.indexOf('Door 2 • Classification & Fine Screening');
  const door3IdxEn = indexEn.indexOf('Door 3 • Flotation, Filtration & Lab');
  assert.ok(door1IdxEn > 0 && door1IdxEn < door2IdxEn && door2IdxEn < door3IdxEn, 'Door 1 debe ser Slurry Pumping en en/index.astro');

  assert.equal(/\bskids?\b/i.test(indexEs), false, 'index.astro no debe mencionar Skids');
  assert.equal(/\bskids?\b/i.test(indexEn), false, 'en/index.astro no debe mencionar Skids');
  assert.equal(/\bskids?\b/i.test(headerSrc), false, 'Header.astro no debe mencionar Skids');
});

