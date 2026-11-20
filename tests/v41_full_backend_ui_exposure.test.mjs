import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  saveEngineeringContextSnapshot,
  loadEngineeringContextSnapshot,
  evaluateFlotationCellHydrodynamics,
  calculateFilterPressCycleCapacity,
} from '../src/scripts/wizardCircuitPhysicsController.js';
import {
  evaluateBearingCartridgeCoreTradeIn,
} from '../src/scripts/vendorPassportAndTradeInController.js';
import {
  computeCmuPriorityDescriptor,
  calculateCoupledReorderWindowDays,
} from '../src/scripts/requisitionTrayBus.js';
import {
  projectPumpDriveAndHybridTelemetry,
  projectClassificationAndScreenTelemetry,
  projectFlotationAndFiltrationTelemetry,
  projectMetrologyAndReorderTelemetry,
  projectHydraulicAltitudeAndLeadValidation,
} from '../src/scripts/wizardLivePhysicsProjector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function createMockRoot() {
  const nodes = new Map();
  return {
    nodes,
    querySelector(sel) {
      if (!nodes.has(sel)) {
        const attrs = new Map();
        nodes.set(sel, {
          textContent: '',
          style: {},
          classList: {
            remove() {},
            add() {},
          },
          setAttribute(k, v) {
            attrs.set(k, String(v));
          },
          getAttribute(k) {
            return attrs.has(k) ? attrs.get(k) : null;
          },
        });
      }
      return nodes.get(sel);
    },
  };
}

function readQuoteWizardComposite() {
  let qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  const wccSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/WizardCircuitCalculators.astro'), 'utf8');
  const cycSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CycloneScreenIsland.astro'), 'utf8');
  const flotSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/FlotationCalculatorIsland.astro'), 'utf8');
  const filtSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/FiltrationCalculatorIsland.astro'), 'utf8');
  const ctrlSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProcessControlIsland.astro'), 'utf8');
  const sealSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/SealDriveBearingIsland.astro'), 'utf8');
  const expandedCalculators = `${wccSrc}\n${cycSrc}\n${flotSrc}\n${filtSrc}\n${sealSrc}`;
  qwSrc = qwSrc.replace(/<ProcessControlIsland\b[^>]*\/>/, ctrlSrc);
  qwSrc = qwSrc.replace(/<WizardCircuitCalculators\b[^>]*\/>/, expandedCalculators);
  return qwSrc;
}

test('D1-V41 & DEB-V41-01..02: QuoteWizard.astro decouples <WizardCircuitCalculators /> and promotes all 4 non-pumping panels out of #circuit-panel-bombeo and <details>', () => {
  const rawQwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  const qwSrc = readQuoteWizardComposite();

  const idxBombeoOpen = qwSrc.indexOf('id="circuit-panel-bombeo"');
  const idxAtomicPartCard = qwSrc.indexOf('id="wb-atomic-part-card"');
  const idxCalculators = rawQwSrc.indexOf('<WizardCircuitCalculators');
  const idxCtrlIsland = rawQwSrc.indexOf('<ProcessControlIsland');
  const idxFlot = qwSrc.indexOf('id="circuit-panel-flotacion"');
  const idxFilt = qwSrc.indexOf('id="circuit-panel-filtracion"');
  const idxCtrl = qwSrc.indexOf('id="circuit-panel-control"');
  const idxDetails = qwSrc.indexOf('id="wb-engineering-config-details"');
  const rawIdxDetails = rawQwSrc.indexOf('id="wb-engineering-config-details"');
  const rawIdxBombeo = rawQwSrc.indexOf('id="circuit-panel-bombeo"');

  assert.ok(idxBombeoOpen > 0, '#circuit-panel-bombeo must exist');
  assert.ok(idxCalculators > rawIdxBombeo, '<WizardCircuitCalculators /> must appear after #circuit-panel-bombeo');
  assert.ok(idxCtrlIsland > rawIdxBombeo && idxCtrlIsland < rawIdxDetails, '<ProcessControlIsland /> must appear before <details id="wb-engineering-config-details">');
  assert.ok(idxFlot < idxDetails, '#circuit-panel-flotacion must appear before <details id="wb-engineering-config-details">');
  assert.ok(idxFilt < idxDetails, '#circuit-panel-filtracion must appear before <details id="wb-engineering-config-details">');
  assert.ok(idxCtrl < idxDetails, '#circuit-panel-control must appear before <details id="wb-engineering-config-details">');
  assert.ok(idxCalculators < rawIdxDetails, '<WizardCircuitCalculators /> must appear before <details id="wb-engineering-config-details">');

  // Verify #circuit-panel-bombeo closes before #wb-atomic-part-card
  const sliceBetweenBombeoAndPartCard = qwSrc.slice(idxBombeoOpen, idxAtomicPartCard);
  assert.ok(
    sliceBetweenBombeoAndPartCard.includes('</div>'),
    '#circuit-panel-bombeo must close before #wb-atomic-part-card and <WizardCircuitCalculators />'
  );
});

test('D2-V41 & DEB-V41-08: saveEngineeringContextSnapshot supports polymorphic 1-arg (partialObject) and 2-arg (domainKey, payload) calls', () => {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
    dispatchEvent: () => true,
  };

  // 1-arg call from clasificacion / bombeo
  const snap1 = saveEngineeringContextSnapshot({
    activeCircuit: 'clasificacion',
    classification: { d50cUm: 74.5, cwFeedPct: 38.2 },
  });
  assert.equal(snap1.activeCircuit, 'clasificacion');
  assert.equal(snap1.classification.d50cUm, 74.5);

  // 2-arg call from flotacion/celdas.astro
  const snap2 = saveEngineeringContextSnapshot('flotacion', {
    cellModel: 'XJM-S45',
    sbMin1: 52.4,
    jgCmS: 1.45,
    njsRpm: 168,
  });
  assert.equal(snap2.activeCircuit, 'flotacion');
  assert.equal(snap2.flotation.cellModel, 'XJM-S45');
  assert.equal(snap2.flotation.sbMin1, 52.4);
  assert.equal(snap2.classification.d50cUm, 74.5, 'Prior classification state must be preserved in PutGet lens');

  // 2-arg call from filtracion/index.astro
  const snap3 = saveEngineeringContextSnapshot('filtracion', {
    plateFormat: '1500x1500',
    cyclesPerDay: 42.5,
    dryTonnesPerDay: 680,
  });
  assert.equal(snap3.activeCircuit, 'filtracion');
  assert.equal(snap3.filtration.plateFormat, '1500x1500');
  assert.equal(snap3.filtration.cyclesPerDay, 42.5);

  const loaded = loadEngineeringContextSnapshot();
  assert.equal(loaded.flotation.cellModel, 'XJM-S45');
  assert.equal(loaded.filtration.plateFormat, '1500x1500');
});

test('D3-V41 & DEB-V41-03: evaluateBearingCartridgeCoreTradeIn implements 3 tiers (-22% / -12% / 0%) and canonical Durango address', () => {
  const tier1 = evaluateBearingCartridgeCoreTradeIn(
    { housingCondition: 'h7_intact', boreIntact: true, hasStructuralWeld: false },
    true
  );
  assert.equal(tier1.discountPct, 22);
  assert.equal(tier1.creditFactor, 0.78);
  assert.equal(tier1.rmaCode, 'RMA-CORE-DAM005-INTACT');
  assert.equal(tier1.co2SavedKg, 35);
  assert.ok(tier1.returnAddress.includes('Mariano Salas #114'));

  const tier2 = evaluateBearingCartridgeCoreTradeIn(
    { housingCondition: 'minor_scoring_rebore', boreIntact: true, hasStructuralWeld: false },
    'minor_scoring_rebore'
  );
  assert.equal(tier2.discountPct, 12);
  assert.equal(tier2.creditFactor, 0.88);
  assert.equal(tier2.rmaCode, 'RMA-CORE-DAM005-REBORE');

  const tier3 = evaluateBearingCartridgeCoreTradeIn(
    { housingCondition: 'cracked_housing', boreIntact: false, hasStructuralWeld: true },
    'cracked_housing'
  );
  assert.equal(tier3.discountPct, 0);
  assert.equal(tier3.creditFactor, 1.0);
  assert.equal(tier3.rmaCode, 'RMA-CORE-DAM005-NONE');
});

test('D4-V41 & DEB-V41-04..05: Single <RequisitionTraySummary /> instance and zero duplicate #metric-delta-npsh IDs', () => {
  const qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  const dossierSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');

  assert.equal(qwSrc.includes('<RequisitionTraySummary'), false, 'QuoteWizard.astro must not mount duplicate RequisitionTraySummary');
  assert.equal(dossierSrc.includes('<RequisitionTraySummary'), true, 'LiveEngineeringDossier.astro must mount canonical RequisitionTraySummary');
  assert.equal(dossierSrc.includes('id="dossier-metric-delta-npsh"'), true, 'LiveEngineeringDossier.astro must use #dossier-metric-delta-npsh');
  assert.equal(dossierSrc.includes('id="metric-delta-npsh"'), false, 'LiveEngineeringDossier.astro must not duplicate #metric-delta-npsh');
});

test('D5-V41 through D9-V41: wizardLivePhysicsProjector.js and physics controllers expose all >90 return fields cleanly', () => {
  const mockRoot = createMockRoot();

  projectPumpDriveAndHybridTelemetry(mockRoot, {
    driveEval: {
      arrangementCode: 'CV',
      pumpRpm: 1180,
      impellerTipSpeedMs: 21.4,
      radialBeltLoadKn: 4.5,
      estimatedBearingL10h: 44000,
      aIsoLabyrinthSmat: 1.85,
      aIsoContaminatedFelt: 0.22,
      ceramicSafeTipSpeed: true,
    },
    frameEval: {
      frameCode: 'DAM005M',
      cartridgeCode: 'DAM005',
      maxPowerKw: 60,
      maxRpm: 1400,
      shaftDiameterMm: 65,
      recommendedDynamicCkN: 138,
      serviceFactor: 1.45,
    },
    hybridEval: {
      architectureId: 'HYBRID-A05-R55',
      impellerMaterialCode: 'A05',
      linerMaterialCode: 'R55',
      impellerImpactAngleDeg: 78,
      linerGrazingAngleDeg: 18,
      rubberThermalSafe: true,
      particleCutSafe: true,
    },
    interferenceEval: {
      geometricInterferencesNg: 0,
      unstableSubassembliesNs: 0,
      optimalClearanceBandMm: '0.50–1.00 mm',
      spallingWarningEs: 'Sin riesgo de astillamiento',
    },
    isEs: true,
  });

  assert.ok(mockRoot.querySelector('#wb-drive-frame-specs').textContent.includes('60 kW'));
  assert.ok(mockRoot.querySelector('#wb-clearance-ng-ns-spalling').textContent.includes('Ng=0'));
  assert.ok(mockRoot.querySelector('#wb-hybrid-rama-d-breakdown').textContent.includes('HYBRID-A05-R55'));

  projectClassificationAndScreenTelemetry(
    mockRoot,
    {
      cwFeedPct: 38.2,
      cwUnderflowPct: 72.4,
      cwOverflowPct: 24.1,
      cvFeedPct: 18.5,
      cvUnderflowPct: 48.2,
      cvOverflowPct: 10.2,
      apexToVortexRatio: 0.48,
      isUmbrellaDilute: false,
      sharpnessAlpha: 4.4,
      screenWeibull: {
        vibrationG: 4.35,
        antiBlindingCompliant: true,
      },
    },
    true
  );
  assert.ok(mockRoot.querySelector('#wb-cyc-res-cw-cv-3cups').textContent.includes('38.2% Cw'));
  assert.ok(mockRoot.querySelector('#wb-scr-res-vibration-g').textContent.includes('4.35 G'));

  const flotData = evaluateFlotationCellHydrodynamics({
    rotorDiaM: 0.61,
    rotorRpm: 215,
    d80Microns: 120,
    solidsCwPct: 34,
  });
  const filtData = calculateFilterPressCycleCapacity({
    chamberCount: 80,
    cakeThicknessMm: 32,
    feedSolidsCwPct: 38,
    feedPressureBar: 12,
  });
  assert.equal(typeof filtData.filtrationMinutes, 'number');

  projectFlotationAndFiltrationTelemetry(mockRoot, {
    flotRes: flotData,
    filtRes: filtData,
    isEs: true,
  });
  assert.ok(mockRoot.querySelector('#wb-flot-res-pu-life').textContent.includes('Poliuretano vs Hule'));
  assert.ok(mockRoot.querySelector('#wb-filt-res-skus').textContent.includes(filtData.recommendedPlateSkuId));

  const reorder = calculateCoupledReorderWindowDays({
    estimatedWearHours: 2160,
    dailyOperatingHours: 24,
  });
  assert.equal(reorder.reorderWindowDays, 90);
  assert.equal(reorder.t10InspectionDays, 90);
  assert.equal(reorder.t50ReorderTriggerDays, 150);
  assert.equal(reorder.t80CriticalChangeoutDays, 180);

  const cmu = computeCmuPriorityDescriptor({
    urgency: 'paro_de_linea',
    estimatedTotalMxn: 18000,
    stockRegime: 'hay',
  });
  assert.equal(typeof cmu.priorityRankScore, 'number');
  assert.ok(cmu.priorityLabelEs.length > 0);

  projectMetrologyAndReorderTelemetry(mockRoot, {
    gyEval: {
      wetPulpVolumeLiters: 29.4,
      minimumSampleMassKg: 14.8,
      targetRelativeStdErrorPercent: 5.0,
    },
    sieveEval: {
      recommendedFrameMaterialEs: 'Acero Inoxidable 304',
      wetScreeningRequired: true,
    },
    reorderEval: reorder,
    cmuEval: cmu,
    isEs: true,
  });
  assert.ok(mockRoot.querySelector('#wb-ctrl-gy-pulp-liters').textContent.includes('29.4 L'));
  assert.ok(mockRoot.querySelector('#wb-part-reorder-window-val').textContent.includes('90 días'));

  const cacheState = projectHydraulicAltitudeAndLeadValidation(mockRoot, {
    simMetrics: {
      combinedMotorAltitudeMultiplier: 1.326,
      results: {
        flowConditionText: 'Turbulento Heterogéneo Seguro',
        materialNameEs: 'Alto Cromo ASTM A532 Cr27',
        materialReasonEs: 'Alta energía de impacto',
      },
    },
    altData: {
      pAtmHeadMca: 7.66,
      barometricPressureKpa: 75.6,
      deltaNpshLossM: 2.67,
      motorDeratingFactor: 0.91,
      altitudeTier: 'HIGH_SIERRA',
    },
    leadValid: {
      slaCommitmentEs: 'PLANTA MINERA VERIFICADA',
      warnings: [],
    },
    isEs: true,
  });
  assert.ok(mockRoot.querySelector('#wb-altitude-live-strip').textContent.includes('75.6 kPa'));
  assert.ok(cacheState.ringCount >= 12);
});
