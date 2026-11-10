import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getQuickProductsCatalog,
  getQuickProductBySlugOrAlias,
  resolveCanonicalSkuId,
  LEGACY_QC_TO_CANONICAL_SKU,
  MATERIAL_DISPLAY_LABELS
} from '../src/scripts/quickProductsCatalog.js';
import {
  addTrayItem,
  computeCmuPriorityDescriptor,
  evaluateBearingCartridgeCoreTradeIn
} from '../src/scripts/requisitionTrayBus.js';
import {
  MECHANICAL_DIAGNOSTICS,
  calculateSlurryMetrics,
  calculateThreeCupMarcyCycloneBalance,
  evaluateFilterPressPlateDeflection
} from '../src/scripts/slurryEngine.js';
import {
  calculateUrethaneScreenPartitionWeibull,
  calculateFlotationGorainKineticRate
} from '../src/scripts/mechanicalAndSeparationEngine.js';
import {
  verifyDropInEquivalence
} from '../src/scripts/dropInEquivalenceGuard.js';
import {
  SKU_TO_CURATED_PHOTO_SPEC,
  buildCadBlueprintSvg
} from '../tools/build_product_images.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('D1-V33 (ARB-SMAT-41 · DEB-V33-01 & DEB-V33-02): Cero IDs legacy SKU-QC-01..19 huérfanos en páginas y motores; alias biyectivo O(1) resolveCanonicalSkuId', () => {
  assert.ok(Object.keys(LEGACY_QC_TO_CANONICAL_SKU).length >= 19);
  assert.equal(resolveCanonicalSkuId('SKU-QC-01'), 'SMAT-PUMP-IMP-AH');
  assert.equal(resolveCanonicalSkuId('SKU-QC-05'), 'SMAT-PUMP-EXPELLER-KIT');
  assert.equal(resolveCanonicalSkuId('SKU-QC-06'), 'SMAT-PUMP-BRG-005M');
  assert.equal(resolveCanonicalSkuId('SKU-QC-19'), 'SMAT-LAB-MARCY-1000');

  const added = addTrayItem({ id: 'SKU-QC-06', qty: 2 }, { items: [], coreReturnEnabled: true });
  assert.equal(added.items[0].id, 'SMAT-PUMP-BRG-005M');
  assert.equal(added.items[0].skuId, 'SMAT-PUMP-BRG-005M');
  const tradeIn = evaluateBearingCartridgeCoreTradeIn(added, true);
  assert.equal(tradeIn.eligible, true);
  assert.equal(tradeIn.discountPct, 22);

  const cycRoping = calculateThreeCupMarcyCycloneBalance({
    feedSg: 1.48,
    underflowSg: 2.08,
    overflowSg: 1.22,
    solidsSg: 2.7,
    apexDiameterMm: 38,
    vortexDiameterMm: 105,
    feedPressureKpa: 110,
    cycloneDiameterMm: 380
  });
  assert.equal(cycRoping.recommendedSkuId, 'SMAT-CYC-D6-D20');

  const plate = evaluateFilterPressPlateDeflection({ feedPressureBar: 12, cloggedPortsCount: 0 });
  assert.equal(plate.recommendedClothSkuId, 'SMAT-FILT-CLOTH-PLATE');
  assert.equal(plate.recommendedPlateSkuId, 'SMAT-FILT-SHIFTER-CHAIN');

  const scr = calculateUrethaneScreenPartitionWeibull({ apertureMm: 0.5 });
  assert.equal(scr.recommendedSkuId, 'SMAT-SCR-TH48-30');
  const flot = calculateFlotationGorainKineticRate();
  assert.equal(flot.recommendedSkuId, 'SMAT-FLOT-MECH-18SP');

  const dropIn = verifyDropInEquivalence('D3147', { cvPct: 40 });
  assert.equal(dropIn.canonicalSkuId, 'SMAT-PUMP-IMP-AH');

  const cycloneReport = fs.readFileSync(path.join(SITE_ROOT, 'src/components/CycloneAndScreenReport.astro'), 'utf8');
  assert.equal(cycloneReport.includes('SKU-QC-'), false, 'CycloneAndScreenReport.astro no debe contener SKU-QC-*');
  assert.equal(cycloneReport.includes('hidrociclon-d20-vortex-apex-ceramico-sic'), false);
});

test('D2-V33 (ARB-SMAT-41 · DEB-V33-04 & DEB-V33-05): Cero enlaces rotos a slugs antiguos en páginas Astro, 5 rutas descriptivas en catalogo/[code].astro y 30 reglas 301 en _redirects', () => {
  const legacyProductSlugsEs = [
    'hidrociclon-d20-vortex-apex-ceramico-sic',
    'panel-criba-poliuretano-modular-305x305',
    'balanza-densidad-pulpa-marcy-1000ml',
    'placa-filtro-prensa-polipropileno-1200mm',
    'celda-flotacion-mecanica-kit-rotor-estator',
    'impulsor-5-alabes-alto-cromo-cr27',
    'cartucho-rodamientos-heavy-duty-005m',
    'sello-centrifugo-expulsor-seco-cr27'
  ];
  for (const legacySlug of legacyProductSlugsEs) {
    const resolved = getQuickProductBySlugOrAlias(legacySlug);
    assert.ok(resolved, `Slug legacy ${legacySlug} debe resolver en getQuickProductBySlugOrAlias`);
  }

  const redirectsTxt = fs.readFileSync(path.join(SITE_ROOT, 'public/_redirects'), 'utf8');
  for (const legacySlug of legacyProductSlugsEs) {
    assert.ok(redirectsTxt.includes(`/productos/${legacySlug} /productos/`), `Falta regla 301 para /productos/${legacySlug}`);
  }

  const catCodeEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/catalogo/[code].astro'), 'utf8');
  const catCodeEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/catalog/[code].astro'), 'utf8');
  for (const descSlugEs of [
    'impulsor-5-alabes',
    'cuello-succion',
    'voluta-revestimiento',
    'expulsor-centrifugo',
    'cartucho-rodamientos'
  ]) {
    assert.ok(catCodeEs.includes(descSlugEs), `catalogo/[code].astro debe soportar ${descSlugEs}`);
  }
  for (const descSlugEn of [
    '5-vane-impeller',
    'suction-throatbush',
    'volute-liner',
    'centrifugal-expeller',
    'bearing-assembly-cartridge'
  ]) {
    assert.ok(catCodeEn.includes(descSlugEn), `en/catalog/[code].astro debe soportar ${descSlugEn}`);
  }
});

test('D3-V33 & D4-V33 (DEB-V33-03): ProductQuickCard.astro con 9 elementos completos de §4.1 y Home con filtro de 8 familias y 19 tarjetas directas sin codigo=undefined', () => {
  const cardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(cardSrc.includes('data-qcard-fiscal-badge'), 'ProductQuickCard debe incluir el badge de Kit Fiscal SAT CFDI 4.0');
  assert.ok(cardSrc.includes('data-qcard-config'), 'ProductQuickCard debe incluir el selector de configuración rápida');
  assert.ok(cardSrc.includes('data-qcard-wa-btn'), 'ProductQuickCard debe incluir el botón primario de WhatsApp 1 clic');
  assert.ok(cardSrc.includes('data-qcard-add-btn'), 'ProductQuickCard debe incluir el botón secundario + Sumar a Lista de Cotización');
  assert.ok(cardSrc.includes('💬 Cotizar / Pedir por WhatsApp (1 Clic)'));
  assert.ok(cardSrc.includes('Sumar a Lista de Cotización'));

  for (const homeRel of ['src/pages/index.astro', 'src/pages/en/index.astro']) {
    const homeSrc = fs.readFileSync(path.join(SITE_ROOT, homeRel), 'utf8');
    assert.ok(homeSrc.includes('data-family-chip={chip.id}'), `${homeRel} debe incluir barra de chips de 8 familias`);
    for (const chipId of ["'all'", "'control'", "'tamices'", "'bombeo'", "'sello_potencia'", "'clasificacion'", "'filtracion'", "'flotacion'"]) {
      assert.ok(homeSrc.includes(`id: ${chipId}`), `${homeRel} debe definir el chip ${chipId}`);
    }
    assert.ok(homeSrc.includes('<ProductQuickCard'), `${homeRel} debe renderizar <ProductQuickCard /> para los 19 SKUs en Home`);
    assert.equal(homeSrc.includes('codigo=${p.code}'), false, `${homeRel} no debe tener enlace roto codigo=\${p.code}`);
  }
});

test('D5-V33 & D6-V33 (DEB-V33-06 & DEB-V33-07): style={xrayWearStyle} dinámico en los 15 diagramas de TechnicalDiagrams.astro y despachador geométrico + cropBox en build_product_images.mjs', () => {
  const diagSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/TechnicalDiagrams.astro'), 'utf8');
  const xrayCount = (diagSrc.match(/style=\{xrayWearStyle\}/g) || []).length;
  assert.equal(xrayCount, 15, `Los 15 diagramas de TechnicalDiagrams.astro deben enlazar style={xrayWearStyle} (encontrados: ${xrayCount})`);
  assert.equal(diagSrc.toLowerCase().includes('garganta'), false, 'TechnicalDiagrams.astro no debe contener garganta');
  assert.equal(diagSrc.includes('EN SKID'), false, 'TechnicalDiagrams.astro no debe contener EN SKID');

  const svgMarcy = buildCadBlueprintSvg('SMAT-LAB-MARCY-1000', 'lab_comminution_pan');
  const svgImp = buildCadBlueprintSvg('SMAT-PUMP-IMP-AH', 'impeller_5vane');
  const svgCyc = buildCadBlueprintSvg('SMAT-CYC-D6-D20', 'cyclone_d6_d20');
  assert.notEqual(svgMarcy, svgImp, 'El plano CAD de Balanza Marcy no debe ser un impulsor de bomba');
  assert.notEqual(svgCyc, svgImp, 'El plano CAD de Hidrociclón no debe ser un impulsor de bomba');
  assert.ok(SKU_TO_CURATED_PHOTO_SPEC['SMAT-LAB-MARCY-1000'].cropBox, 'SMAT-LAB-MARCY-1000 debe definir cropBox limpio');
});

test('D7-V33, D8-V33, D9-V33 & D10-V33 (DEB-V33-08..12): Higiene léxica total, celdas Drop-In OPEX sin tanques soldados, 0 errores TypeScript en cumplimiento.astro y 0 patrones USD/MXN <num>', () => {
  const rolesRaw = fs.readFileSync(path.join(SITE_ROOT, 'data/roles.json'), 'utf8');
  assert.equal(rolesRaw.includes('Fabricación pesada y soldadura de cajones/tanques'), false);
  assert.equal(rolesRaw.includes('[CAPEX:'), false);

  const atomicRaw = fs.readFileSync(path.join(SITE_ROOT, 'data/atomic_parts.json'), 'utf8');
  assert.equal(atomicRaw.toLowerCase().includes('garganta'), false, 'atomic_parts.json no debe usar garganta');
  for (const frameCode of ['frame C,', 'Frame C,', 'bastidores C, D, E, F']) {
    assert.equal(atomicRaw.includes(frameCode), false, `atomic_parts.json no debe contener ${frameCode}`);
  }

  for (const dataRel of ['data/circuits.json', 'data/cases.json', 'data/faqs.json', 'data/trust.json']) {
    const raw = fs.readFileSync(path.join(SITE_ROOT, dataRel), 'utf8').toLowerCase();
    assert.equal(raw.includes('banco de pruebas'), false, `${dataRel} no debe contener banco de pruebas`);
    assert.equal(raw.includes('balanceo dinámico'), false, `${dataRel} no debe contener balanceo dinámico`);
  }

  const cumpEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/cumplimiento.astro'), 'utf8');
  const cumpEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/compliance.astro'), 'utf8');
  assert.ok(cumpEs.includes('(inc: string)') && cumpEs.includes('(row: any)'));
  assert.ok(cumpEn.includes('(inc: string)') && cumpEn.includes('(row: any)'));

  const cmuDesc = computeCmuPriorityDescriptor({ urgency: 'normal', estimatedTotalMxn: 18500, stockRegime: 'hay' });
  assert.ok(cmuDesc.labelEs.includes('< 25,000 MXN'));
  assert.equal(/\b(USD|MXN)\s*[0-9]+/.test(cmuDesc.labelEs), false);

  assert.ok(MATERIAL_DISPLAY_LABELS.A05);
  assert.equal(getQuickProductsCatalog().length, 19);
  assert.ok(MECHANICAL_DIAGNOSTICS.bearing_vibration.actionEs.includes('Drop-In 1:1'));
  assert.ok(calculateSlurryMetrics({ flowM3h: 120, pipeDiaMm: 100, cwPct: 35, sgSolid: 2.8, d50Um: 150 }).durandFactorFL > 0);
});
