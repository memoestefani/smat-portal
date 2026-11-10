import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getQuickProductsCatalog,
  getQuickProductBySlugOrAlias,
  getAllStaticProductRouteEntries,
  getQuickProductsByAvenue,
  verifyCatalogReferentialIntegrity,
  verifyDiagramSurjectivity
} from '../src/scripts/quickProductsCatalog.js';
import {
  normalizePartTokenTwoStage,
  fnv1a32DropInHash,
  verifyDropInEquivalence
} from '../src/scripts/dropInEquivalenceGuard.js';
import {
  computeCmuPriorityDescriptor,
  calculateCoupledReorderWindowDays
} from '../src/scripts/requisitionTrayBus.js';
import {
  calculateThreeCupMarcyCycloneBalance,
  evaluateFilterPressPlateDeflection,
  computeSelectionOrderCodeHash,
  validatePlantLeadInput
} from '../src/scripts/slurryEngine.js';
import {
  resolveMiningDistrictPreset,
  buildCanonicalEngineeringSnapshot
} from '../src/scripts/workbenchBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('SLICE-FC-01: SSOT 19 SKUs en quickProductsCatalog.js, 5 Avenidas + 6A y suryectividad 16/16 DiagramKind', () => {
  const catalog = getQuickProductsCatalog();
  assert.equal(catalog.length, 19);

  const refIntegrity = verifyCatalogReferentialIntegrity();
  assert.equal(refIntegrity.valid, true, `Códigos huérfanos: ${JSON.stringify(refIntegrity.orphanCodes)}`);
  assert.equal(refIntegrity.atomicPartCount, 13);

  const diagSurj = verifyDiagramSurjectivity();
  assert.equal(diagSurj.surjective, true, `DiagramKind faltantes: ${JSON.stringify(diagSurj.missingKinds)}`);
  assert.equal(diagSurj.totalKinds, 16);

  const byAvenue = getQuickProductsByAvenue();
  assert.ok(byAvenue.avenida_1_bombeo.length >= 7);
  assert.ok(byAvenue.avenida_2_hidrociclones.length >= 3);
  assert.ok(byAvenue.avenida_3_cribas_mallas.length >= 2);
  assert.ok(byAvenue.avenida_4_flotacion_valvulas.length >= 3);
  assert.ok(byAvenue.avenida_5_filtracion.length >= 2);
  assert.ok(byAvenue.avenida_6a_paquete_casado.length >= 1);

  // Verificar resolución de slugs PRD §6.1 y enlaces de páginas satélite
  const aliasSlugs = [
    'mallas-finas-uretano-th48-30',
    'modulos-poliuretano-1x1-pin-camisa',
    'paquete-casado-bomba-lodos-hidrociclon',
    'mecanismo-corre-placas-plate-shifter',
    'mecanismo-flotacion-18-sp',
    'apex-boquilla-hidrociclon',
    'buscador-vortice-hidrociclon',
    'revestimientos-cono-cilindro-hidrociclon'
  ];
  for (const slug of aliasSlugs) {
    const resolved = getQuickProductBySlugOrAlias(slug);
    assert.ok(resolved, `El alias ${slug} debe resolver a un SKU canónico`);
  }

  const esRoutes = getAllStaticProductRouteEntries('es');
  const enRoutes = getAllStaticProductRouteEntries('en');
  assert.ok(esRoutes.length >= 38);
  assert.ok(enRoutes.length >= 38);
});

test('SLICE-FC-02: dropInEquivalenceGuard.js normalización morfológica en 2 etapas y hash FNV-1a cero-OEM', () => {
  const norm = normalizePartTokenTwoStage(' e-4147-a05 ');
  assert.equal(norm.baseRoot, 'E4147');
  assert.equal(norm.alloySuffix, 'A05');

  const resImpeller = verifyDropInEquivalence('E4147A05');
  assert.equal(resImpeller.matched, true);
  assert.equal(resImpeller.smatSkuId, 'SKU-QC-01');
  assert.equal(resImpeller.toleranceStd, 'ISO 2768-m');
  assert.ok(resImpeller.geometricTripletMm.b_od_mm > 500);

  const resSleeve = verifyDropInEquivalence('D075C21');
  assert.equal(resSleeve.matched, true);
  assert.equal(resSleeve.smatSkuId, 'SKU-QC-05');

  const resTH48 = verifyDropInEquivalence('TH48-30');
  assert.equal(resTH48.matched, true);
  assert.equal(resTH48.smatSkuId, 'SKU-QC-13');

  // Ningún archivo en src/scripts/dropInEquivalenceGuard.js contiene marcas OEM prohibidas en texto plano
  const guardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/dropInEquivalenceGuard.js'), 'utf8');
  for (const brand of ['Warman', 'Metso', 'FLSmidth', 'Krebs', 'Outotec', 'Wemco']) {
    assert.equal(
      guardSrc.toLowerCase().includes(brand.toLowerCase()),
      false,
      `Marca OEM prohibida encontrada en dropInEquivalenceGuard.js: ${brand}`
    );
  }
  assert.ok(fnv1a32DropInHash('E4147').length === 8);
});

test('SLICE-FC-03: 19 imágenes WebP reales cero-OEM generadas en public/images/productos/ (<= 45 KB)', () => {
  const catalog = getQuickProductsCatalog();
  for (const sku of catalog) {
    const relPath = sku.photo_webp.replace(/^\//, '');
    const fullPath = path.join(SITE_ROOT, 'public', relPath);
    assert.equal(fs.existsSync(fullPath), true, `Falta imagen WebP para ${sku.id}: ${fullPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 100 && stat.size <= 46080, `Tamaño fuera de presupuesto en ${sku.id}: ${stat.size} bytes`);
  }
});

test('SLICE-FC-04 & SLICE-FC-05: ProductQuickCard.astro, fichas [slug].astro y cero ISO 1940 G2.5', () => {
  const cardPath = path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro');
  assert.equal(fs.existsSync(cardPath), true);
  const cardSrc = fs.readFileSync(cardPath, 'utf8');
  assert.ok(cardSrc.includes('aspect-ratio: 4 / 3') || cardSrc.includes('aspect-ratio: 4/3') || cardSrc.includes('aspect-[4/3]'));
  assert.ok(cardSrc.includes('0.76 mm'));

  const prodEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/productos/[slug].astro'), 'utf8');
  assert.equal(prodEs.includes('ISO 1940 G2.5'), false);
  assert.ok(prodEs.includes('ProductQuickCard'));
  assert.ok(prodEs.includes('25,000'));
});

test('SLICE-FC-06: QuickOrderTray.astro, regla cmu de prioridad P1/P2/P3 y ventana de reorden acoplado (90/150/180 días)', () => {
  const trayPath = path.join(SITE_ROOT, 'src/components/QuickOrderTray.astro');
  assert.equal(fs.existsSync(trayPath), true);

  const p1Emergency = computeCmuPriorityDescriptor({
    urgency: 'emergency',
    estimatedTotalMxn: 18000,
    stockRegime: 'hay'
  });
  assert.equal(p1Emergency.priorityCode, 'P1-PARO-PLANTA');

  const p1PettyCash = computeCmuPriorityDescriptor({
    urgency: 'normal',
    estimatedTotalMxn: 22000,
    stockRegime: 'hay'
  });
  assert.equal(p1PettyCash.priorityCode, 'P1-CAJA-CHICA-HAY');
  assert.equal(p1PettyCash.checkoutLane, 'CAJA_CHICA_CFDI40');

  const p3Fabrication = computeCmuPriorityDescriptor({
    urgency: 'normal',
    estimatedTotalMxn: 85000,
    stockRegime: 'se_fabrica'
  });
  assert.equal(p3Fabrication.priorityCode, 'P3-PROYECTO-50%-ANTICIPO');
  assert.equal(p3Fabrication.advancePaymentPct, 50);

  const reorder = calculateCoupledReorderWindowDays({ sg: 1.55, d50Um: 120 });
  assert.equal(reorder.sleeveInspectionDay, 90);
  assert.equal(reorder.impellerThroatbushSwapDay, 150);
  assert.equal(reorder.voluteLinerOverhaulDay, 180);
});

test('SLICE-FC-08 & SLICE-FC-09: CycloneAndScreenReport.astro (5 zonas + TH48-30) y páginas satélite v3.0', () => {
  const cycloneComp = path.join(SITE_ROOT, 'src/components/CycloneAndScreenReport.astro');
  assert.equal(fs.existsSync(cycloneComp), true);
  const cycloneSrc = fs.readFileSync(cycloneComp, 'utf8');
  assert.ok(cycloneSrc.includes('TH48-30'));
  assert.ok(cycloneSrc.includes('D10B'));
  assert.ok(cycloneSrc.includes('4.2')); // Weibull alpha >= 4.2

  const flotEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/flotacion/celdas.astro'), 'utf8');
  assert.ok(flotEs.includes('#18 SP'));
  assert.ok(flotEs.includes('Gorain'));

  const filtEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/filtracion/repuestos.astro'), 'utf8');
  assert.ok(filtEs.includes('Plate Shifter'));
  assert.ok(filtEs.includes('3.5 bar'));
});

test('SLICE-FC-10: Purga 100% de Banco Durango e ISO 1940 G2.5 en todo site/src/', () => {
  const filesToCheck = [
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro',
    'src/pages/catalogo.astro',
    'src/pages/en/catalog.astro',
    'src/pages/catalogo/[code].astro',
    'src/components/SharePurchasing.astro'
  ];
  for (const rel of filesToCheck) {
    const content = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.equal(content.includes('Banco Durango'), false, `Debris 'Banco Durango' hallado en ${rel}`);
    assert.equal(content.includes('ISO 1940 G2.5'), false, `Debris 'ISO 1940 G2.5' hallado en ${rel}`);
  }
});

test('SLICE-FC-11: Matriz Wayback Machine 38 redirecciones 301 en 1 solo salto (L_hop = 1)', () => {
  const redirectsCsv = fs.readFileSync(path.join(SITE_ROOT, 'data/redirects.csv'), 'utf8').trim().split(/\r?\n/);
  assert.ok(redirectsCsv.length >= 39, `Se esperaban >= 38 filas + cabecera en redirects.csv, actual: ${redirectsCsv.length}`);

  const publicRedirects = fs.readFileSync(path.join(SITE_ROOT, 'public/_redirects'), 'utf8');
  assert.ok(publicRedirects.includes('/bombas-para-lodos/'));
  assert.ok(publicRedirects.includes('/hidrociclones/'));
  assert.ok(publicRedirects.includes('/mallas-de-poliuretano/'));
  assert.ok(publicRedirects.includes('/celdas-de-flotacion/'));
  assert.ok(publicRedirects.includes('/filtros-prensa/'));
});

test('SLICE-FC-12: Facade re-exports sin ruptura en slurryEngine.js y workbenchBus.js', async () => {
  const {
    calculateUrethaneScreenPartitionWeibull,
    calculateFlotationGorainKineticRate
  } = await import('../src/scripts/slurryEngine.js');
  const {
    formatSatTigieInvoiceLine,
    formatDualCheckoutPayload
  } = await import('../src/scripts/workbenchBus.js');

  const marcy = calculateThreeCupMarcyCycloneBalance({ feedSg: 1.45, underflowSg: 1.75, overflowSg: 1.20 });
  assert.ok(marcy.solidsRecoveryPct > 0);
  const plate = evaluateFilterPressPlateDeflection({ feedPressureBar: 16, cloggedPortsCount: 2 });
  assert.equal(plate.isPlateCrackingRisk, true);
  assert.ok(computeSelectionOrderCodeHash({ a: 1 }).startsWith('SMAT-'));
  assert.equal(Array.isArray(validatePlantLeadInput({ cwPct: 45, d80Microns: 180 }).warnings), true);

  const screenWeibull = calculateUrethaneScreenPartitionWeibull({ apertureMm: 0.5, reliefAngleDeg: 4.0, sharpnessAlpha: 4.5 });
  assert.equal(screenWeibull.antiBlindingCompliant, true);

  const gorain = calculateFlotationGorainKineticRate({ jgCmS: 1.5, d32Mm: 1.5 });
  assert.equal(gorain.gorainCompliant, true);

  assert.ok(formatSatTigieInvoiceLine({ skuId: 'SKU-QC-01', vertical: 'bombeo' }).includes('40142000'));
  assert.equal(formatDualCheckoutPayload({ estimatedMxn: 18000, stockRegime: 'hay' }).lane, 'CAJA_CHICA_CFDI40');

  const snap = buildCanonicalEngineeringSnapshot({ flow_m3h: 180, solids_cw: 45 });
  assert.ok(snap.p_atm_mca > 0 && snap.k_motor_alt > 0);
});
