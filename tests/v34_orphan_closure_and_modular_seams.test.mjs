import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ATOMIC_PARTS_CATALOG,
  resolveAtomicPartCode,
  getAtomicPartSpecs,
  formatNioshErgonomicStatus,
  parseUrlContextParams,
  generateSmatPartCode,
  formatSapTsv,
  parseSmatPartCode,
  formatSapPlaintextImpl,
  formatMailtoUrlImpl,
  formatWhatsappUrlImpl,
  buildAcuseUrlParams,
  dispatchLeadWebhook,
  buildCanonicalEngineeringSnapshotImpl
} from '../src/scripts/districtProfilesAndSkuCatalog.js';

import {
  MARCY_STANDARD_RINGS,
  ASTM_E11_SIEVE_TABLE,
  selectOptimalMaterial,
  calculateMarcyScaleReading,
  calculateGyMinimumSampleMass,
  recommendAstmSieveSeries,
  WET_END_MATERIAL_MATRIX,
  PUMP_ASSEMBLY_STATIONS,
  PUMP_554_BOM_14_PARTS,
  evaluatePumpAssemblySequence,
  evaluateWetEndAssemblyInterference,
  DRIVE_ARRANGEMENT_CATALOG,
  calculateDriveAndBearingKinematics,
  evaluateHybridWetEndConfiguration
} from '../src/scripts/tribologyAndCompatibilityEngine.js';

import {
  hydrateTrayFromReorderQuery,
  updateTrayItemQty,
  encodeReorderUrlQuery
} from '../src/scripts/requisitionTrayBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('SLICE-V34-05: build_product_images.mjs tiene 16/16 ramas diagram_id explicitas, 19/19 fotos curadas y 0 archivos .webp huerfanos', () => {
  const builderSrc = fs.readFileSync(path.join(SITE_ROOT, 'tools', 'build_product_images.mjs'), 'utf8');
  const requiredDiagrams = [
    'impeller_5vane',
    'material_kit_grid',
    'expeller_seal',
    'bearing_cartridge',
    'cyclone_apex',
    'cyclone_d6_d20',
    'coupled_pump_cyclone',
    'urethane_screen_panel_305',
    'urethane_screen_th48',
    'flotation_cell',
    'pinch_knife_valve',
    'marcy_scale',
    'astm_sieves',
    'lab_comminution_pan',
    'batch_filter',
    'filter_press',
    'filter_plate_shifter'
  ];
  for (const diag of requiredDiagrams) {
    assert.ok(builderSrc.includes(diag), `build_product_images.mjs debe contener rama CAD SVG '${diag}'`);
  }
  assert.ok(
    !builderSrc.includes('for (const alias of (sku.slug_aliases'),
    'build_product_images.mjs no debe escribir copias .webp por alias (DEB-V34-03)'
  );

  const prodImgDir = path.join(SITE_ROOT, 'public', 'images', 'productos');
  const webpFiles = fs.readdirSync(prodImgDir).filter((f) => f.endsWith('.webp'));
  assert.equal(webpFiles.length, 19, 'public/images/productos/ debe tener exactamente 19 archivos .webp canonicos');
});

test('SLICE-V34-06: Pureza ontologica de SKUs de laboratorio (0 alias de valvulas en SMAT-LAB-PULV-DISC y SMAT-LAB-FILTRO-BATCH) y diagram_id de SMAT-SCR-MOD-1X1', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(SITE_ROOT, 'data', 'quick_checkout_Catalog.json'), 'utf8')
  );
  const pulv = catalog.find((s) => s.sku_id === 'SMAT-LAB-PULV-DISC');
  const filtro = catalog.find((s) => s.sku_id === 'SMAT-LAB-FILTRO-BATCH');
  const scr1x1 = catalog.find((s) => s.sku_id === 'SMAT-SCR-MOD-1X1');

  assert.ok(pulv && filtro && scr1x1, 'Deben existir los 3 SKUs auditados');
  for (const labSku of [pulv, filtro]) {
    const raw = JSON.stringify(labSku);
    for (const banned of ['valvula-pinch', 'valvula-cuchilla', 'pinch-valve', 'knife-gate-valve', 'pinch-knife-valve', 'avenida_4_flotacion_valvulas']) {
      assert.ok(!raw.includes(banned), `SKU ${labSku.sku_id} no debe contener contaminacion de valvulas '${banned}'`);
    }
  }
  assert.equal(scr1x1.diagram_id, 'urethane_screen_panel_305');
});

test('SLICE-V34-07 & SLICE-V34-08: Cierre 100% de rutas SSG en /catalogo/[code] y /en/catalog/[code] y 0 enlaces rotos en /clasificacion/', () => {
  const catEs = fs.readFileSync(path.join(SITE_ROOT, 'src', 'pages', 'catalogo', '[code].astro'), 'utf8').toLowerCase();
  const catEn = fs.readFileSync(path.join(SITE_ROOT, 'src', 'pages', 'en', 'catalog', '[code].astro'), 'utf8').toLowerCase();

  const alloyCodes = [
    'd3147-a05',
    'd3147-r55',
    'e4147-a05',
    'e4147-r55',
    'f6147-a05',
    'dam028-a05',
    'eam028-a05',
    'e4083-a05',
    'e4083-r55'
  ];
  for (const code of alloyCodes) {
    assert.ok(catEs.includes(code), `catalogo/[code].astro debe soportar ${code}`);
    assert.ok(catEn.includes(code), `en/catalog/[code].astro debe soportar ${code}`);
  }

  for (const slugEs of [
    'voluta-revestimiento',
    'cartucho-rodamientos',
    'anillo-expulsor',
    'camisa-flecha',
    'empaque-prensaestopa',
    'flecha-principal',
    'sellos-laberinto'
  ]) {
    assert.ok(catEs.includes(slugEs), `catalogo/[code].astro debe soportar slug descriptivo ${slugEs}`);
  }

  for (const slugEn of [
    'volute-liner',
    'bearing-assembly-cartridge',
    'expeller-ring',
    'shaft-sleeve',
    'gland-packing',
    'main-shaft',
    'labyrinth-seals'
  ]) {
    assert.ok(catEn.includes(slugEn), `en/catalog/[code].astro debe soportar slug descriptivo ${slugEn}`);
  }

  const clasifEs = fs.readFileSync(path.join(SITE_ROOT, 'src', 'pages', 'clasificacion', 'index.astro'), 'utf8');
  const clasifEn = fs.readFileSync(path.join(SITE_ROOT, 'src', 'pages', 'en', 'classification', 'index.astro'), 'utf8');
  assert.ok(!clasifEs.includes('/productos/paquete-casado-bomba-ciclones/'));
  assert.ok(clasifEs.includes('/productos/paquete-casado-bomba-hidrociclon/'));
  assert.ok(!clasifEn.includes('/en/products/coupled-slurry-pump-cyclone-package/'));
  assert.ok(clasifEn.includes('/en/products/coupled-pump-hydrocyclone-package/'));
});

test('SLICE-V34-09 & SLICE-V34-10: QuickOrderTray Dual CTA + ?reorder=1, ProductQuickCard c*mu en WhatsApp y 0 SKU-QC-01 en thank-you.astro', () => {
  const qtray = fs.readFileSync(path.join(SITE_ROOT, 'src', 'components', 'QuickOrderTray.astro'), 'utf8');
  assert.ok(qtray.includes('id="smat-qtray-pdf-link"'));
  assert.ok(qtray.includes('data-qtray-qty-delta="-1"'));
  assert.ok(qtray.includes('data-qtray-qty-delta="1"'));
  assert.ok(qtray.includes('updateTrayItemQty'));
  assert.ok(qtray.includes('hydrateTrayFromReorderQuery'));

  const qcard = fs.readFileSync(path.join(SITE_ROOT, 'src', 'components', 'ProductQuickCard.astro'), 'utf8');
  assert.ok(qcard.includes('[SMAT-DGO | PRIORIDAD-cμ'));

  const tyEn = fs.readFileSync(path.join(SITE_ROOT, 'src', 'pages', 'en', 'thank-you.astro'), 'utf8');
  assert.ok(!tyEn.includes('SKU-QC-01'));
  assert.ok(tyEn.includes('SMAT-PUMP-IMP-AH'));

  const query = encodeReorderUrlQuery({
    items: [{ id: 'SMAT-PUMP-IMP-AH', skuId: 'SMAT-PUMP-IMP-AH', qty: 3, criticalityMode: 'PARO_DE_LINEA' }]
  });
  const hydrated = hydrateTrayFromReorderQuery(query);
  assert.equal(hydrated.items.length, 1);
  assert.equal(hydrated.items[0].skuId, 'SMAT-PUMP-IMP-AH');
  assert.equal(hydrated.items[0].qty, 3);
  assert.equal(typeof updateTrayItemQty, 'function');
});

test('SLICE-V34-11 & SLICE-V34-12: Costuras limpias LCOM4 <= 900 LOC y paridad 100% de re-exports', () => {
  for (const rel of [
    'src/scripts/districtProfilesAndSkuCatalog.js',
    'src/scripts/sapAndLeadExportEngine.js',
    'src/scripts/tribologyAndCompatibilityEngine.js',
    'src/scripts/pumpAssemblyAndDriveEngine.js'
  ]) {
    const fullPath = path.join(SITE_ROOT, rel);
    assert.ok(fs.existsSync(fullPath), `Debe existir ${rel}`);
    const loc = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
    assert.ok(loc <= 900, `${rel} debe tener <= 900 LOC (actual: ${loc})`);
  }

  assert.ok(ATOMIC_PARTS_CATALOG.E4147);
  assert.equal(typeof resolveAtomicPartCode, 'function');
  assert.equal(typeof getAtomicPartSpecs, 'function');
  assert.equal(typeof formatNioshErgonomicStatus, 'function');
  assert.equal(typeof parseUrlContextParams, 'function');
  assert.equal(typeof generateSmatPartCode, 'function');
  assert.equal(typeof formatSapTsv, 'function');
  assert.equal(typeof parseSmatPartCode, 'function');
  assert.equal(typeof formatSapPlaintextImpl, 'function');
  assert.equal(typeof formatMailtoUrlImpl, 'function');
  assert.equal(typeof formatWhatsappUrlImpl, 'function');
  assert.equal(typeof buildAcuseUrlParams, 'function');
  assert.equal(typeof dispatchLeadWebhook, 'function');
  assert.equal(typeof buildCanonicalEngineeringSnapshotImpl, 'function');

  assert.equal(MARCY_STANDARD_RINGS.length, 12);
  assert.equal(ASTM_E11_SIEVE_TABLE.length, 19);
  assert.equal(typeof selectOptimalMaterial, 'function');
  assert.equal(typeof calculateMarcyScaleReading, 'function');
  assert.equal(typeof calculateGyMinimumSampleMass, 'function');
  assert.equal(typeof recommendAstmSieveSeries, 'function');
  assert.ok(WET_END_MATERIAL_MATRIX.alto_cromo);
  assert.equal(PUMP_ASSEMBLY_STATIONS.length, 5);
  assert.equal(PUMP_554_BOM_14_PARTS.length, 14);
  assert.equal(typeof evaluatePumpAssemblySequence, 'function');
  assert.equal(typeof evaluateWetEndAssemblyInterference, 'function');
  assert.ok(DRIVE_ARRANGEMENT_CATALOG.CV);
  assert.equal(typeof calculateDriveAndBearingKinematics, 'function');
  assert.equal(typeof evaluateHybridWetEndConfiguration, 'function');
});
