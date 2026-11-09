import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  PIPE_SERIES_DIAMETER_MM,
  WET_END_MATERIAL_MATRIX,
  evaluateWetEndAssemblyInterference
} from '../src/scripts/slurryEngine.js';
import {
  SMAT_WORKBENCH_STATE_KEY,
  workbenchStateLens,
  mergeWorkbenchLensState,
  formatNioshErgonomicStatus,
  getAtomicPartSpecs,
  buildWizardUrl,
  formatSapPlaintext
} from '../src/scripts/workbenchBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

test('1. [DECISIÓN 1 / DEB-V42-01] Unificación de localStorage sobre SMAT_WORKBENCH_STATE_KEY y Lente Bidireccional PutGet (GOLD-604)', () => {
  assert.equal(SMAT_WORKBENCH_STATE_KEY, 'smat_workbench_state_v2');

  const controllerSrc = fs.readFileSync(path.join(siteRoot, 'src/scripts/quoteWizardController.js'), 'utf-8');
  assert.ok(
    controllerSrc.includes('var STORAGE_KEY_V2 = SMAT_WORKBENCH_STATE_KEY;'),
    'quoteWizardController.js debe unificar STORAGE_KEY_V2 = SMAT_WORKBENCH_STATE_KEY'
  );
  assert.ok(
    controllerSrc.includes("localStorage.removeItem('smat_workbench_v2')"),
    'quoteWizardController.js debe migrar y purgar la clave legada smat_workbench_v2'
  );

  // Verificación formal de las 3 Leyes de Lentes (Foster et al., ACM TOPLAS 2007)
  const initialState = workbenchStateLens.get({
    process_circuit: 'bombeo',
    role: 'kit_wet_end',
    pipe_size: '6x4',
    pump_material: 'alto_cromo_cr27',
    drive_arrangement: 'CV',
    seal_branch: 'expeller_dry',
    clearance_mm: 0.75,
    b2_mm: 48
  });

  // Ley 1: GetPut — put(s, get(s)) = s
  const getPutState = mergeWorkbenchLensState(initialState, initialState);
  assert.equal(getPutState.pump_material, initialState.pump_material);
  assert.equal(getPutState.clearance_mm, initialState.clearance_mm);
  assert.equal(getPutState.seal_branch, initialState.seal_branch);

  // Ley 2: PutGet — get(put(s, v)) = v (ej. actualización desde PumpAssemblyReport con claro_mm=1.85 y ceramica_sic)
  const updatedView = {
    pump_material: 'ceramica_sic',
    claro_mm: 1.85,
    b2_mm: 64,
    seal_branch: 'gland_water'
  };
  const putGetState = mergeWorkbenchLensState(updatedView, initialState);
  assert.equal(putGetState.pump_material, 'ceramica_sic');
  assert.equal(putGetState.clearance_mm, 1.85);
  assert.equal(putGetState.b2_mm, 64);
  assert.equal(putGetState.seal_branch, 'gland_water');

  // Ley 3: PutPut — put(put(s, v1), v2) = put(s, v2)
  const v1 = { pump_material: 'hule_natural', claro_mm: 1.1 };
  const v2 = { pump_material: 'ceramica_sic', claro_mm: 0.65 };
  const putPutLeft = mergeWorkbenchLensState(v2, mergeWorkbenchLensState(v1, initialState));
  const putPutRight = mergeWorkbenchLensState(v2, initialState);
  assert.equal(putPutLeft.pump_material, putPutRight.pump_material);
  assert.equal(putPutLeft.clearance_mm, putPutRight.clearance_mm);
});

test('2. [DECISIÓN 2 / DEB-V42-02] Paridad de ceramica_sic y Ergonomía Waters-NIOSH 1993 de 3 Niveles en /acuse/ y /en/thank-you/', () => {
  const acuseEs = fs.readFileSync(path.join(siteRoot, 'src/pages/acuse.astro'), 'utf-8');
  const acuseEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/thank-you.astro'), 'utf-8');

  for (const [label, content] of [['acuse.astro', acuseEs], ['en/thank-you.astro', acuseEn]]) {
    assert.ok(
      content.includes("material === 'ceramica_sic'"),
      `${label} debe reconocer la clave canónica ceramica_sic`
    );
    assert.ok(
      content.includes('K_Ic=4.1 MPa·√m') && content.includes('≥2200 HV'),
      `${label} debe mostrar las propiedades físicas de SiC (≥2200 HV, K_Ic=4.1 MPa·√m)`
    );
    assert.ok(
      content.includes('HOIST_REQUIRED') &&
      content.includes('ASSISTED_SHAFT_MOUNT_2P') &&
      content.includes('MANUAL_SAFE_1P') &&
      content.includes('11.1'),
      `${label} debe implementar la evaluación Waters-NIOSH 1993 de 3 niveles con RWL_shaft = 11.1 kg`
    );
  }
});

test('3. [DECISIÓN 3 / DEB-V42-03] Paridad SSG Total en /catalogo/ y /en/catalog/ (9 Series, 4 Materiales, 6 Piezas Atómicas y 3 Instrumentos Lab)', () => {
  const catEs = fs.readFileSync(path.join(siteRoot, 'src/pages/catalogo.astro'), 'utf-8');
  const catEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/catalog.astro'), 'utf-8');

  const nineSeriesKeys = Object.keys(PIPE_SERIES_DIAMETER_MM);
  assert.equal(nineSeriesKeys.length, 9, 'PIPE_SERIES_DIAMETER_MM debe tener 9 series');
  const uniqueAlloyCodes = new Set(Object.values(WET_END_MATERIAL_MATRIX).map((m) => m.code));
  assert.equal(uniqueAlloyCodes.size, 4, 'WET_END_MATERIAL_MATRIX debe tener 4 aleaciones únicas (A05, R55, U01, SiC)');

  for (const [label, content] of [['catalogo.astro', catEs], ['en/catalog.astro', catEn]]) {
    assert.ok(content.includes('PIPE_SERIES_DIAMETER_MM'), `${label} debe importar PIPE_SERIES_DIAMETER_MM`);
    assert.ok(content.includes('WET_END_MATERIAL_MATRIX'), `${label} debe importar WET_END_MATERIAL_MATRIX`);
    assert.ok(content.includes('formatNioshErgonomicStatus'), `${label} debe importar formatNioshErgonomicStatus`);
    assert.ok(content.includes('buildWizardUrl'), `${label} debe importar buildWizardUrl`);

    for (const sKey of ['1.5x1', '2x1.5', '3x2', '4x3', '6x4', '8x6', '10x8', '12x10', '14x12']) {
      assert.ok(content.includes(`serie=${sKey}`), `${label} debe incluir enlace de cotización para la serie ${sKey}`);
    }
    assert.ok(content.includes('controlProcessItems'), `${label} debe renderizar los 3 instrumentos de control de procesos desde roles.json`);
  }
});

test('4. [DECISIÓN 4 / DEB-V42-04] Evaluación Waters-NIOSH 1993 (RWL_shaft = 11.1 kg) y Rama ceramica_sic en Motor y Consola', () => {
  // Nivel 1: <= 11.1 kg -> MANUAL_SAFE_1P
  const tier1 = formatNioshErgonomicStatus(8.2, 'es');
  assert.equal(tier1.tier, 'MANUAL_SAFE_1P');
  assert.equal(tier1.hoistRequired, false);
  assert.equal(tier1.twoPersonAssistRequired, false);
  assert.ok(tier1.liftingIndexShaft <= 1.0);

  // Nivel 2: 11.1 < w < 23.0 kg -> ASSISTED_SHAFT_MOUNT_2P (ej. Anillo Expulsor DAM028 de 18.5 kg)
  const specDAM028 = getAtomicPartSpecs('DAM028', '4x3');
  assert.equal(specDAM028.weight_kg, 18.5);
  assert.equal(specDAM028.niosh_ergonomic_tier, 'ASSISTED_SHAFT_MOUNT_2P');
  const tier2 = formatNioshErgonomicStatus(specDAM028, 'es');
  assert.equal(tier2.tier, 'ASSISTED_SHAFT_MOUNT_2P');
  assert.equal(tier2.twoPersonAssistRequired, true);
  assert.equal(tier2.hoistRequired, false);
  assert.ok(tier2.badgeEs.includes('11.1–23 kg'));

  // Nivel 3: >= 23.0 kg -> HOIST_REQUIRED (ej. Impulsor E4147 de 38.4 kg o Cartucho DAM005 de 54.0 kg)
  const specDAM005 = getAtomicPartSpecs('DAM005', '6x4');
  assert.equal(specDAM005.weight_kg, 54.0);
  const tier3 = formatNioshErgonomicStatus(specDAM005, 'es');
  assert.equal(tier3.tier, 'HOIST_REQUIRED');
  assert.equal(tier3.hoistRequired, true);

  // Verificación de ceramica_sic en evaluateWetEndAssemblyInterference y SAP Plaintext
  const sicEval = evaluateWetEndAssemblyInterference({
    wetEndBranch: 'ceramica_sic',
    sealBranch: 'expeller_dry',
    frontClearanceMm: 0.65,
    impellerExitWidthMm: 48,
    pipeSeries: '6x4'
  });
  assert.equal(sicEval.wetEndBranch, 'ceramica_sic');
  assert.ok(sicEval.structuralReasonEs.includes('SiC'));

  const sapText = formatSapPlaintext({
    folio: 'SMAT-2026-9901',
    role: 'kit_sellado',
    code: 'DAM028',
    series: '4x3',
    pump_material: 'ceramica_sic'
  });
  assert.ok(sapText.includes('ASSISTED_SHAFT_MOUNT_2P'), 'SAP Plaintext debe reportar ASSISTED_SHAFT_MOUNT_2P para pieza DAM028 de 18.5 kg');
});

test('5. [DECISIÓN 5 / DEB-V42-05] Propagación Reactiva del Slider de Estación 05 y 4ª Rama ceramica_sic en PumpAssemblyReport.astro', () => {
  const report = fs.readFileSync(path.join(siteRoot, 'src/components/PumpAssemblyReport.astro'), 'utf-8');

  assert.ok(
    report.includes('data-assembly-branch-btn="ceramica_sic"') && report.includes('data-branch-btn="ceramica_sic"'),
    'PumpAssemblyReport.astro debe incluir el 4º botón de rama ceramica_sic (δ=0.65 mm)'
  );
  assert.ok(
    report.includes('syncAllAssemblyLinks') && report.includes('data-bom-quote-link') && report.includes('data-station-cta'),
    'PumpAssemblyReport.astro debe sincronizar dinámicamente claro_mm, b2_mm, seal_branch y material en los 14 enlaces BOM y 5 estaciones'
  );
  assert.ok(
    report.includes('min-height: 48px'),
    'PumpAssemblyReport.astro debe asegurar objetivos táctiles Fitts >= 48px en enlaces BOM y botones de estación'
  );
});

test('6. [DECISIÓN 6 / DEB-V42-06] Consolidación 3-Tab XOR en /bombeo/ y /en/pumping/ sin Redundancia Cuádruple', () => {
  const bombeoEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8');
  const pumpingEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8');

  for (const [label, content] of [['bombeo/index.astro', bombeoEs], ['en/pumping/index.astro', pumpingEn]]) {
    assert.ok(!content.includes('<QuickPartSelectorStrip'), `${label} no debe duplicar <QuickPartSelectorStrip arriba de la consola`);
    assert.ok(content.includes('data-bombeo-tab="kits"'), `${label} debe integrar los lotes por material como Tab 1 (kits)`);
    assert.ok(content.includes('data-bombeo-tab="systems"'), `${label} debe incluir Tab 2 (systems)`);
    assert.ok(content.includes('data-bombeo-tab="atomic"'), `${label} debe incluir Tab 3 (atomic)`);
    assert.ok(content.includes('<PumpAssemblyReport'), `${label} debe mantener el reporte interactivo de 5 estaciones`);
  }
});

test('7. [DECISIÓN 7 / DEB-V42-07] Normalización SSOT de QuickPartSelectorStrip.astro con buildWizardUrl() y sin acero_4140_iso281', () => {
  const strip = fs.readFileSync(path.join(siteRoot, 'src/components/QuickPartSelectorStrip.astro'), 'utf-8');

  assert.ok(!strip.includes('acero_4140_iso281'), 'QuickPartSelectorStrip.astro no debe emitir el parámetro inválido material=acero_4140_iso281');
  assert.ok(strip.includes('buildWizardUrl'), 'QuickPartSelectorStrip.astro debe construir enlaces con buildWizardUrl()');
  assert.ok(strip.includes('formatNioshErgonomicStatus'), 'QuickPartSelectorStrip.astro debe enriquecer cada tarjeta con Waters-NIOSH 1993');

  const bearingUrl = buildWizardUrl({
    lang: 'es',
    circuit: 'bombeo',
    role: 'soporte_rodamiento',
    part: 'bearing_assembly',
    code: 'DAM005',
    series: '6x4',
    station: 'S1',
    material: undefined,
    weightKg: 54.0,
    arrangement: 'CV'
  });
  assert.ok(bearingUrl.includes('circuito=bombeo'), 'URL de Bearing Assembly debe incluir circuito=bombeo');
  assert.ok(bearingUrl.includes('estacion=S1'), 'URL de Bearing Assembly debe incluir estacion=S1');
  assert.ok(!bearingUrl.includes('material='), 'URL de Bearing Assembly no debe inyectar material de extremo húmedo inválido');
});

test('8. [DECISIÓN 8 / DEB-V42-08] Polaridad Solar Industrial Light-First WCAG AAA en CaseCards.astro, nosotros.astro y en/about.astro', () => {
  const caseCards = fs.readFileSync(path.join(siteRoot, 'src/components/CaseCards.astro'), 'utf-8');
  const nosotrosEs = fs.readFileSync(path.join(siteRoot, 'src/pages/nosotros.astro'), 'utf-8');
  const aboutEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/about.astro'), 'utf-8');

  assert.ok(!caseCards.includes('#0b1120'), 'CaseCards.astro no debe contener fondo oscuro #0b1120');
  assert.ok(!caseCards.includes('#151d2e'), 'CaseCards.astro no debe contener tarjetas oscuras #151d2e');
  assert.ok(!caseCards.includes('#94a3b8'), 'CaseCards.astro no debe contener texto gris de bajo contraste #94a3b8');

  for (const [label, content] of [['nosotros.astro', nosotrosEs], ['en/about.astro', aboutEn]]) {
    assert.ok(!content.includes('radial-gradient(circle at 50% 20%, #1e293b'), `${label} no debe usar hero oscuro radial-gradient`);
    assert.ok(!content.includes('#94a3b8'), `${label} no debe usar subtítulo gris #94a3b8 (< 7:1 AAA)`);
    assert.ok(!content.includes('#64748b'), `${label} no debe usar texto secundario #64748b (< 7:1 AAA)`);
    assert.ok(content.includes('#7c2d12') && content.includes('#0f172a'), `${label} debe usar paleta Solar AAA (#0f172a 17.4:1 y #7c2d12 10.65:1)`);
  }
});
