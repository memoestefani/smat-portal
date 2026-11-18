// tests/v39_apple_hig_backend_exposure.test.mjs
// Suite de Verificación V3.9: Exposición Total del Backend en la UI bajo Primeros Principios Apple HIG
// y Soberanía de Inventarios (Cero Exposición Pública de Cantidades Físicas de Almacén Durango)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  sanitizePublicAtomicPartSpecs,
  buildSmatVendorVcardString,
  buildSapAnexo22ComplianceSummary
} from '../src/scripts/vendorPassportAndTradeInController.js';
import {
  evaluateFlotationCellHydrodynamics,
  calculateFilterPressCycleCapacity,
  evaluateHydrocycloneCutPoint,
  SMAT_ENGINEERING_CONTEXT_KEY
} from '../src/scripts/wizardCircuitPhysicsController.js';
import {
  calculateDriveAndBearingKinematics,
  selectBearingFrameByPowerAndRpm,
  evaluateHybridWetEndConfiguration
} from '../src/scripts/pumpAssemblyAndDriveEngine.js';
import { evaluateBearingCartridgeCoreTradeIn } from '../src/scripts/requisitionTrayBus.js';
import { getAtomicPartSpecs } from '../src/scripts/districtProfilesAndSkuCatalog.js';
import { formatDossierCircuitPhysicsRow } from '../src/scripts/quoteDossierRenderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

test('D1-V39: evaluateFlotationCellHydrodynamics calcula S_b de Gorain, N_js de Zwietering y k cinético en /cotizar/', () => {
  const res = evaluateFlotationCellHydrodynamics({
    rotorDiaM: 0.61,
    rotorRpm: 215,
    jgCmS: 1.5,
    d32Mm: 1.6,
    solidsCwPct: 38,
    d80Microns: 150
  });
  assert.ok(res.sbInverseSeconds > 50, 'S_b debe ser > 50 s⁻¹');
  assert.ok(res.rateConstantMin > 0.5, 'Constante k de Gorain debe ser > 0.5 min⁻¹');
  assert.ok(res.zwieteringNjsRpm > 50, 'N_js de Zwietering debe ser positivo');
  assert.strictEqual(typeof res.suspensionSafe, 'boolean');
  assert.ok(res.summaryEs.includes('Sb ='), 'Resumen ES debe incluir Sb');

  const row = formatDossierCircuitPhysicsRow('flotacion', { flotation: res }, { clientReorderWindowDays: 90 }, true);
  assert.ok(row.value.includes('Sb') || row.value.includes('k ='), 'Fila del Dossier debe reflejar Sb / k');
});

test('D2-V39: calculateFilterPressCycleCapacity acopla Ruth (t_f ~ L²) + Timoshenko FS en /cotizar/', () => {
  const safeRes = calculateFilterPressCycleCapacity({
    plateWidthMm: 1500,
    chamberCount: 40,
    feedPressureBar: 12,
    cloggedPortsCount: 0,
    plateThicknessMm: 65,
    cakeMoistureTargetPct: 14
  });
  assert.ok(safeRes.cyclesPerDay >= 8, 'Ciclos por día debe ser >= 8');
  assert.ok(safeRes.dryTonnesPerDay > 50, 'Capacidad diaria debe ser > 50 t/día');
  assert.ok(safeRes.flexuralSafetyFactor >= 1.5, 'FS Timoshenko sin puertos tapados debe ser >= 1.5');
  assert.strictEqual(safeRes.isPlateCrackingRisk, false);

  const cloggedRes = calculateFilterPressCycleCapacity({
    plateWidthMm: 1500,
    chamberCount: 40,
    feedPressureBar: 16,
    cloggedPortsCount: 2,
    plateThicknessMm: 50,
    cakeMoistureTargetPct: 14
  });
  assert.strictEqual(cloggedRes.isPlateCrackingRisk, true, '2 puertos obstruidos a 16 bar en 50 mm debe activar alerta Timoshenko');
});

test('D3-V39: 5to chip XOR Clasificación / Ciclones y evaluateHydrocycloneCutPoint (Plitt d50c + Roping Concha)', () => {
  const qwSrc = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf8');
  const calcSrc = fs.readFileSync(path.join(siteRoot, 'src/components/WizardCircuitCalculators.astro'), 'utf8');
  assert.ok(qwSrc.includes('data-circuit="clasificacion"'), 'QuoteWizard.astro debe exponer el 5to chip XOR data-circuit="clasificacion"');
  assert.ok(calcSrc.includes('id="circuit-panel-clasificacion"'), 'WizardCircuitCalculators.astro debe incluir #circuit-panel-clasificacion');

  const cycRes = evaluateHydrocycloneCutPoint({
    cycloneDiameterMm: 380,
    vortexDiameterMm: 100,
    apexDiameterMm: 50,
    feedPressureKpa: 95,
    feedSg: 1.35,
    underflowSg: 1.82,
    overflowSg: 1.15,
    solidsSg: 2.7
  });
  assert.ok(cycRes.cutPointD50cUm > 20, 'Corte Plitt d50c debe ser > 20 µm');
  assert.ok(cycRes.circulatingLoadPct > 50, 'Carga circulante debe ser > 50%');
  assert.ok(cycRes.sharpnessAlpha >= 4.0, 'Nitidez Weibull alpha debe ser >= 4.0');
});

test('D4-V39: selectBearingFrameByPowerAndRpm + evaluateBearingCartridgeCoreTradeIn en fichas y /cotizar/', () => {
  const frameRes = selectBearingFrameByPowerAndRpm({ motorPowerKw: 55, pumpRpm: 1200, pipeSeries: '6x4' });
  assert.ok(frameRes.frameCode, 'Debe devolver frameCode');
  assert.strictEqual(frameRes.cartridgeCode, 'DAM005');

  const kinRes = calculateDriveAndBearingKinematics({
    arrangement: 'CV',
    motorRpm: 1775,
    driverPulleyMm: 220,
    drivenPulleyMm: 340,
    shaftPowerKw: 55,
    dynamicCapacityCkN: 145
  });
  assert.ok(kinRes.bearingFrameCode, 'calculateDriveAndBearingKinematics debe incluir bearingFrameCode');
  assert.strictEqual(kinRes.bearingCartridgeCode, 'DAM005');

  const tradeIn = evaluateBearingCartridgeCoreTradeIn(
    {
      items: [{ id: 'SMAT-PUMP-BRG-005M', skuId: 'SMAT-PUMP-BRG-005M', atomicCode: 'DAM005', qty: 1 }],
      coreReturnEnabled: true
    },
    true
  );
  assert.strictEqual(tradeIn.coreReturnEnabled, true);
  assert.ok(tradeIn.discountPct >= 18, 'Descuento Core Trade-In debe ser >= 18%');

  for (const rel of [
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro',
    'src/pages/catalogo/[code].astro',
    'src/pages/en/catalog/[code].astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/en/pumping/bearing-assembly.astro'
  ]) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf8');
    assert.ok(content.includes('data-core-tradein-widget'), `${rel} debe exponer [data-core-tradein-widget]`);
  }
});

test('D5-V39: evaluateHybridWetEndConfiguration (Rama D Finnie-Hutchings) expone desglose de masa e izaje NIOSH', () => {
  const hyb = evaluateHybridWetEndConfiguration({
    d80Microns: 180,
    pulpPh: 7.0,
    tipSpeedMs: 19.9,
    solidsWeightPercent: 45,
    pipeSeries: '6x4'
  });
  assert.strictEqual(hyb.architectureId, 'hybrid_a05_impeller_r55_liners');
  assert.ok(hyb.fullMetalMassKg > 500, 'Masa full metal serie 6x4 debe superar 500 kg');
  assert.ok(hyb.savedMassKg > 50, 'Ahorro de masa en forros de hule debe superar 50 kg');
  assert.ok(hyb.massSavingsPct >= 8, 'Reducción porcentual de masa debe ser >= 8%');

  const qwSrc = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.ok(qwSrc.includes('id="wb-hybrid-rama-d-breakdown"'), 'QuoteWizard.astro debe incluir #wb-hybrid-rama-d-breakdown');
});

test('D6-V39: Selector de Unidad Minera promovido a cabecera del Paso 1', () => {
  const qwSrc = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf8');
  const idxStep1Bar = qwSrc.indexOf('id="wb-step1-xor-circuit-bar"');
  const idxPresetBar = qwSrc.indexOf('id="wb-mining-preset-bar"');
  const idxStep2 = qwSrc.indexOf('id="stage-2"');
  assert.ok(idxStep1Bar !== -1 && idxPresetBar !== -1 && idxStep2 !== -1);
  assert.ok(idxPresetBar > idxStep1Bar && idxPresetBar < idxStep2, '#wb-mining-preset-bar debe estar en Paso 1 antes del Paso 2');
});

test('D7-V39: buildSmatVendorVcardString (RFC 6350 vCard 4.0) y Anexo 22 TIGIE en LiveEngineeringDossier.astro', () => {
  const vcf = buildSmatVendorVcardString();
  assert.ok(vcf.startsWith('BEGIN:VCARD\r\nVERSION:4.0\r\n'), 'Debe iniciar con cabecera RFC 6350 vCard 4.0');
  assert.ok(vcf.includes('ORG:SMAT Minerals'), 'vCard debe incluir ORG:SMAT Minerals');
  assert.ok(vcf.endsWith('END:VCARD'), 'Debe cerrar con END:VCARD');

  const anexo = buildSapAnexo22ComplianceSummary({ circuit: 'bombeo', skuId: 'SMAT-PUMP-6X4-WETKIT' });
  assert.ok(anexo.summaryText.includes('TIGIE') || anexo.satTigieLine.includes('TIGIE'), 'Resumen Anexo 22 debe incluir TIGIE');

  const dossierSrc = fs.readFileSync(path.join(siteRoot, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.ok(dossierSrc.includes('id="btn-download-vendor-json"'), 'Dossier debe incluir #btn-download-vendor-json');
  assert.ok(dossierSrc.includes('id="btn-download-vendor-vcf"'), 'Dossier debe incluir #btn-download-vendor-vcf');
  assert.ok(dossierSrc.includes('id="sap-live-anexo22-tuple"'), 'Dossier debe incluir #sap-live-anexo22-tuple');
});

test('D8-V39 (Regla Soberana): CERO exposición pública de existencias de almacén SMAT + Ventana Preventiva de Reorden para el cliente', () => {
  const spec = getAtomicPartSpecs('E4147', '6x4');
  assert.ok(spec, 'Debe resolver E4147');
  assert.strictEqual(spec.warehouse_audit, undefined, 'getAtomicPartSpecs NUNCA debe exponer warehouse_audit al cliente');
  assert.strictEqual(spec.physical_stock_durango_units, undefined, 'NUNCA debe exponer physical_stock_durango_units');
  assert.strictEqual(spec.unit_replacement_value_mxn, undefined, 'NUNCA debe exponer unit_replacement_value_mxn');
  assert.strictEqual(spec.warehouse_total_mxn, undefined, 'NUNCA debe exponer warehouse_total_mxn');
  assert.ok([90, 150, 180].includes(spec.client_reorder_window_days), 'Debe exponer client_reorder_window_days (90/150/180 días)');

  const rawMock = {
    code: 'e4147',
    part_number: 'E4147',
    station_number: 3,
    warehouse_audit: {
      physical_stock_durango_units: 99,
      unit_replacement_value_mxn: 12345,
      warehouse_total_mxn: 999999
    }
  };
  const clean = sanitizePublicAtomicPartSpecs(rawMock);
  assert.strictEqual(clean.warehouse_audit, undefined);
  assert.strictEqual(JSON.stringify(clean).includes('physical_stock_durango_units'), false);
  assert.strictEqual(clean.client_reorder_window_days, 90);

  // Verificar que ninguna vista pública (.astro) ni controlador de UI filtre campos internos de inventario
  const publicFiles = [
    'src/components/QuoteWizard.astro',
    'src/components/ProductQuickCard.astro',
    'src/components/LiveEngineeringDossier.astro',
    'src/pages/catalogo/[code].astro',
    'src/pages/en/catalog/[code].astro',
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro'
  ];
  for (const rel of publicFiles) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf8');
    for (const forbidden of [
      'physical_stock_durango_units',
      'unit_replacement_value_mxn',
      'warehouse_total_mxn',
      'warehouse_total_units',
      'boxes_breakdown'
    ]) {
      assert.strictEqual(
        content.includes(forbidden),
        false,
        `Fuga de inventario interno '${forbidden}' detectada en vista pública ${rel}`
      );
    }
  }
});

test('D9-V39: Persistencia de telemetría transversal smat_engineering_context_v1 entre las 4 verticales y /cotizar/', () => {
  assert.strictEqual(SMAT_ENGINEERING_CONTEXT_KEY, 'smat_engineering_context_v1');
  for (const rel of [
    'src/pages/bombeo/skid.astro',
    'src/pages/en/pumping/skid.astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/en/pumping/bearing-assembly.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/clasificacion/index.astro',
    'src/pages/en/classification/index.astro'
  ]) {
    const content = fs.readFileSync(path.join(siteRoot, rel), 'utf8');
    assert.ok(
      content.includes('saveEngineeringContextSnapshot') || content.includes('commitVerticalSimulation'),
      `${rel} debe persistir telemetría en smat_engineering_context_v1 mediante saveEngineeringContextSnapshot o commitVerticalSimulation`
    );
  }
});

test('D10-V39: Polaridad Solar WCAG AAA (>= 7.0:1) en ProductQuickCard.astro y CircuitNavigator.astro', () => {
  const pqc = fs.readFileSync(path.join(siteRoot, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.strictEqual(pqc.includes('background: #d97706;\n    color: #ffffff;'), false, 'ProductQuickCard no debe usar #ffffff sobre #d97706 (3.19:1)');
  assert.ok(pqc.includes('#92400e'), 'ProductQuickCard debe usar #92400e (7.68:1 WCAG AAA) con #ffffff');

  const nav = fs.readFileSync(path.join(siteRoot, 'src/components/CircuitNavigator.astro'), 'utf8');
  assert.ok(nav.includes('background: #7c2d12;'), 'CircuitNavigator .node-cta-rfq debe usar #7c2d12 (9.12:1 WCAG AAA)');
});
