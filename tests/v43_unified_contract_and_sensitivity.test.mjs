import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  calculateGyMinimumSampleMass,
  evaluateCentrifugalSealPressureBalance,
  evaluateFilterPressPlateDeflection,
  evaluatePumpAssemblySequence,
  recommendAstmSieveSeries,
} from '../src/scripts/slurryEngine.js';
import {
  bindCanonicalFiltrationCalculator,
  bindCanonicalFlotationCalculator,
  bindCanonicalSealBalanceCalculator,
  bindCanonicalTribologySelector,
} from '../src/scripts/verticalCalculatorsAndLabelsBridge.js';
import { calculateFilterPressCycleCapacity } from '../src/scripts/wizardCircuitPhysicsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function createDomMock(initialValues = {}) {
  const nodes = new Map();
  for (const [id, val] of Object.entries(initialValues)) {
    const listeners = new Map();
    nodes.set(id, {
      id,
      value: String(val),
      textContent: '',
      style: {},
      addEventListener(evt, fn) {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(fn);
      },
      dispatchEvent(type = 'input') {
        (listeners.get(type) || []).forEach((fn) => fn({ type }));
      },
    });
  }
  return {
    nodes,
    querySelector(selector) {
      const parts = String(selector)
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''));
      for (const p of parts) {
        if (nodes.has(p)) return nodes.get(p);
      }
      return null;
    },
  };
}

test('D5-V43 & D6-V43: Pierre Gy and ASTM Rosin-Rammler exhibit non-zero partial derivatives ∂y/∂x != 0 across all declared inputs', () => {
  // 1. Pierre Gy sensitivity to liberationSizeMicrons (dl) and oreGradeDecimal (aL)
  const gyFineLib = calculateGyMinimumSampleMass({
    topSizeD95Mm: 8.5,
    liberationSizeMicrons: 45,
    oreGradeDecimal: 0.04,
    targetRelativeStdError: 0.05,
  });
  const gyCoarseLib = calculateGyMinimumSampleMass({
    topSizeD95Mm: 8.5,
    liberationSizeMicrons: 350,
    oreGradeDecimal: 0.04,
    targetRelativeStdError: 0.05,
  });
  assert.notEqual(
    gyFineLib.theoreticalGyGrams,
    gyCoarseLib.theoreticalGyGrams,
    '∂M_s/∂d_l must be non-zero when liberationSizeMicrons changes'
  );

  const gyLowGrade = calculateGyMinimumSampleMass({
    topSizeD95Mm: 8.5,
    liberationSizeMicrons: 100,
    oreGradeDecimal: 0.005,
    targetRelativeStdError: 0.05,
  });
  const gyHighGrade = calculateGyMinimumSampleMass({
    topSizeD95Mm: 8.5,
    liberationSizeMicrons: 100,
    oreGradeDecimal: 0.25,
    targetRelativeStdError: 0.05,
  });
  assert.ok(
    gyLowGrade.theoreticalGyGrams > gyHighGrade.theoreticalGyGrams,
    'Lower ore grade a_L must require a larger representative sample mass M_s'
  );

  // Also verify legacy alias compatibility (headGradePercent & relativeErrorSigma)
  const gyAlias = calculateGyMinimumSampleMass({
    topSizeD95Mm: 8.5,
    liberationSizeMicrons: 100,
    headGradePercent: 0.5,
    relativeErrorSigma: 0.02,
  });
  assert.equal(gyAlias.targetRelativeStdError, 0.02);
  assert.equal(gyAlias.oreGradeDecimal, 0.005);

  // 2. ASTM E11 Sieve Series sensitivity to topSizeD95Mm and drySampleMassGrams
  const sieveSmallMass = recommendAstmSieveSeries({
    targetP80Microns: 150,
    topSizeD95Mm: 1.5,
    drySampleMassGrams: 300,
  });
  const sieveLargeMass = recommendAstmSieveSeries({
    targetP80Microns: 150,
    topSizeD95Mm: 12.0,
    drySampleMassGrams: 1200,
  });
  assert.notEqual(
    sieveSmallMass.rosinRammlerSlopeN,
    sieveLargeMass.rosinRammlerSlopeN,
    '∂n/∂d95 must be non-zero when topSizeD95Mm changes'
  );
  assert.notEqual(
    sieveSmallMass.sieveStack[0].estimatedMassRetainedGrams,
    sieveLargeMass.sieveStack[0].estimatedMassRetainedGrams,
    '∂m_ret/∂M_dry must be non-zero when drySampleMassGrams changes'
  );
});

test('D7-V43 & D8-V43: Darcy-Ruth cycle capacity responds to target cake moisture and triggers NOM-141 alert when moisture > 16.0%', () => {
  const dryCake = calculateFilterPressCycleCapacity({
    feedPressureBar: 14,
    cloggedPortsCount: 0,
    plateWidthMm: 1500,
    plateThicknessMm: 65,
    cakeMoistureTargetPct: 11.0,
  });
  const wetCake = calculateFilterPressCycleCapacity({
    feedPressureBar: 14,
    cloggedPortsCount: 0,
    plateWidthMm: 1500,
    plateThicknessMm: 65,
    cakeMoistureTargetPct: 21.0,
  });

  assert.ok(
    dryCake.filtrationMinutes > wetCake.filtrationMinutes,
    'Lower target cake moisture (11% vs 21%) must require longer Darcy-Ruth filtration time'
  );
  assert.equal(dryCake.nom141Compliant, true);
  assert.equal(wetCake.nom141Compliant, false);
  assert.equal(wetCake.nom141MoistureCompliant, false);
  assert.ok(
    wetCake.summaryEs.includes('Alerta NOM-141'),
    'Moisture > 16% must trigger NOM-141 alert in summaryEs instead of false-positive NOM-141 Segura'
  );
  assert.ok(
    wetCake.summaryEn.includes('NOM-141 Alert'),
    'Moisture > 16% must trigger NOM-141 alert in summaryEn'
  );

  const deflWet = evaluateFilterPressPlateDeflection({
    feedPressureBar: 12,
    cloggedPortsCount: 0,
    plateWidthMm: 1200,
    plateThicknessMm: 65,
    cakeMoistureTargetPct: 20.5,
  });
  assert.equal(deflWet.isPlateCrackingRisk, false);
  assert.equal(deflWet.nom141Compliant, false);
  assert.ok(deflWet.summaryEs.includes('Alerta NOM-141-SEMARNAT'));
});

test('D3-V43, D9-V43 & D10-V43: Pump assembly sequence aliases, Centrifugal Seal 02A/02B balance, and Tribology selector work end-to-end', () => {
  // 1. Parameter alias compatibility in evaluatePumpAssemblySequence
  const seqClearance = evaluatePumpAssemblySequence({
    clearanceMm: 2.4,
    impellerTorqueNm: 620,
    d80Um: 950,
    wetEndBranch: 'ceramica_sic',
  });
  assert.equal(seqClearance.frontClearanceMm, 2.4);
  assert.equal(seqClearance.impellerTorqueNm, 620);
  assert.equal(seqClearance.spallingRiskDetected, true);

  // 2. Centrifugal Seal Pressure Balance (02A Dry vs 02B Wet)
  const drySeal = evaluateCentrifugalSealPressureBalance({
    dischargeHeadM: 35,
    suctionHeadM: 2.5,
    expellerDiaMm: 300,
    pumpRpm: 1250,
    slurrySg: 1.35,
  });
  assert.equal(drySeal.expellerViable, true);
  assert.equal(drySeal.recommendedSealBranch, 'expeller_dry');
  assert.equal(drySeal.recommendedStationCode, '02A');

  const wetSeal = evaluateCentrifugalSealPressureBalance({
    dischargeHeadM: 22,
    suctionHeadM: 9.5,
    expellerDiaMm: 240,
    pumpRpm: 850,
    slurrySg: 1.55,
  });
  assert.equal(wetSeal.expellerViable, false);
  assert.equal(wetSeal.recommendedSealBranch, 'gland_water');
  assert.equal(wetSeal.recommendedStationCode, '02B');
  assert.ok(wetSeal.requiredGlandWaterPressurePsi > 15);

  // 3. Interactive DOM binding for Seal Balance (#seal-*) and Tribology (#trib-*)
  const sealDom = createDomMock({
    'seal-hd-m': '32',
    'seal-hs-m': '2.8',
    'seal-exp-dia': '290',
    'seal-rpm': '1200',
    'seal-sg': '1.38',
    'seal-pexp-out': '',
    'seal-pbox-out': '',
    'seal-pwater-out': '',
    'seal-branch-out': '',
    'seal-status-out': '',
  });
  const sealBound = bindCanonicalSealBalanceCalculator(sealDom, 'es');
  assert.ok(sealBound);
  assert.ok(sealDom.querySelector('#seal-pexp-out').textContent.includes('kPa'));
  assert.ok(sealDom.querySelector('#seal-branch-out').textContent.includes('02A'));

  const tribDom = createDomMock({
    'trib-d80-um': '950',
    'trib-u2-ms': '29.5',
    'trib-ph': '7.0',
    'trib-mat-select': 'ceramica_sic',
    'trib-series': '6x4',
    'trib-mat-out': '',
    'trib-kic-out': '',
    'trib-arch-out': '',
    'trib-status-out': '',
  });
  const tribBound = bindCanonicalTribologySelector(tribDom, 'es');
  assert.ok(tribBound);
  assert.equal(tribBound.spallingRiskDetected, true);
  assert.ok(tribDom.querySelector('#trib-status-out').textContent.includes('Spalling'));

  // 4. Hero card mode on Filtration (#filt-res-stress + #filt-res-secondary) and Flotation (#celdas-d80-input + #celdas-cw-input)
  const filtHeroDom = createDomMock({
    'filt-pressure-bar': '16',
    'filt-clogged-ports': '0',
    'filt-plate-width': '1500',
    'filt-plate-thickness': '65',
    'filt-cake-moisture': '14',
    'filt-res-stress': '',
    'filt-res-fs': '',
    'filt-res-secondary': '',
    'filt-res-summary': '',
  });
  bindCanonicalFiltrationCalculator(filtHeroDom, 'es');
  assert.equal(
    filtHeroDom.querySelector('#filt-res-stress').textContent.includes('ΔP_asim'),
    false,
    'Hero card #filt-res-stress must stay a clean scalar value without parenthetical string-stuffing'
  );
  assert.ok(
    filtHeroDom.querySelector('#filt-res-secondary').textContent.includes('ΔP_asim'),
    'Secondary slot #filt-res-secondary must receive the full Darcy-Ruth + Timoshenko breakdown'
  );

  const flotFullDom = createDomMock({
    'celdas-jg-input': '1.5',
    'celdas-d32-input': '1.6',
    'celdas-dia-select': '0.61',
    'celdas-rpm-input': '215',
    'celdas-d80-input': '120',
    'celdas-cw-input': '28',
    'celdas-sb-output': '',
    'celdas-k-output': '',
    'celdas-vtip-output': '',
    'celdas-njs-output': '',
    'celdas-status-output': '',
  });
  const flotOne = bindCanonicalFlotationCalculator(flotFullDom, 'es');
  const njsLow = flotOne.zwieteringNjsRpm;
  flotFullDom.querySelector('#celdas-d80-input').value = '480';
  flotFullDom.querySelector('#celdas-cw-input').value = '52';
  flotFullDom.querySelector('#celdas-d80-input').dispatchEvent('input');
  assert.notEqual(
    flotFullDom.querySelector('#celdas-njs-output').textContent,
    String(njsLow),
    'Changing #celdas-d80-input and #celdas-cw-input must update Zwietering N_js in #celdas-njs-output'
  );
});

test('D1-V43, D2-V43, D4-V43 & D11-V43: Zero phantom DOM IDs in controllers and 5-branch material showcase in /bombeo/', () => {
  const qwCtrl = [
    fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/quoteWizardController.js'), 'utf8'),
    fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/wizardDossierProjector.js'), 'utf8'),
    fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/wizardStateAndUrlLens.js'), 'utf8'),
  ].join('\n');
  assert.equal(qwCtrl.includes('wb-role-clasificacion'), false);
  assert.equal(qwCtrl.includes('wb-clas-dc-mm'), false);
  assert.equal(qwCtrl.includes('wb-clas-liner'), false);
  assert.ok(qwCtrl.includes("getElementById('wb-cyc-liner')"));

  const shareAstro = fs.readFileSync(path.join(SITE_ROOT, 'src/components/SharePurchasing.astro'), 'utf8');
  assert.equal(shareAstro.includes('smat-qtray-toggle-btn'), false);
  assert.ok(shareAstro.includes("getElementById('smat-qtray-toggle')"));

  const bombeoEs = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/bombeo/index.astro'), 'utf8');
  const bombeoEn = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/en/pumping/index.astro'), 'utf8');
  const pumpingIsland = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingHubIsland.astro'), 'utf8');
  assert.ok(bombeoEs.includes('<PumpingHubIsland'));
  assert.ok(bombeoEn.includes('<PumpingHubIsland'));
  assert.ok(pumpingIsland.includes('1. Kits por Material (5)') || pumpingIsland.includes('lotes-por-material'));
  assert.ok(pumpingIsland.includes('1. Kits by Material (5)') || pumpingIsland.includes('kits-by-material'));
  assert.ok(pumpingIsland.includes('data-hybrid-branch-d-card'));
});
