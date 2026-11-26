// @ts-check
/**
 * pumpingStratum2Controller.js
 * ---------------------------------------------------------------------------
 * Controlador desacoplado (LCOM4 C2, SLICE-V10-C16) para PumpingAssistantStratum2.astro.
 * Ejecuta los DAGs de Hidráulica (Durand), Tribología, Sellado y Armado 5-5-4 bajo demanda
 * sin bloquear el renderizado inicial de tarjetas comprables (/bombeo/ y /en/pumping/).
 */

import { initPumpingTabRouter, resolvePumpingTabDeepLink } from './pumpingTabRouter.js';
import {
  bindAtomicPartTrayButtons,
  bindCalculatedKitToTrayButtons,
} from './verticalStateAndCtaSyncBridge.js';
import { bindCanonicalSealBalanceCalculator, bindCanonicalTribologySelector } from './verticalCalculatorsAndLabelsBridge.js';
import { initBearingSupportInspector, initSkidKinematicsInspector } from './verticalBidirectionalHydrationLens.js';
import {
  bindDomainSchemaRoot,
  projectDomainOutputs,
  readAllCanonicalInputs,
} from './schemaRuntimeBinder.js';
import { solveXdsmMultidisciplinaryDag } from './wizardXdsmDagSolver.js';

/**
 * Ejecuta el DAG de la estación de tribología y proyección al DOM.
 * @param {HTMLElement} tribRoot
 * @param {'es'|'en'} lang
 */
function runTribologyStationDag(tribRoot, lang) {
  const inputs = /** @type {Record<string, any>} */ (readAllCanonicalInputs(tribRoot));
  const dag = solveXdsmMultidisciplinaryDag(inputs);
  const trib = dag.tribologyEval || {};
  const asm = dag.assemblyEval || {};
  const hyb = dag.hybridEval || {};
  const interf = dag.interferenceEval || {};
  const matCode = asm.activeMaterialCode || 'A05';
  const impCode = asm.impellerMaterialCode || (matCode === 'R55' ? 'R55' : 'A05');
  const linCode = asm.linerMaterialCode || (inputs.tribologyMaterial === 'hybrid_a05_r55' ? 'R55' : matCode);
  const interfLabel = (interf.hasCollision || asm.sequenceValid === false)
    ? (lang === 'en' ? `Collision (${interf.conflictStation || 'SEQ'})` : `Colisión (${interf.conflictStation || 'SEQ'})`)
    : `Ng=${asm.geometricInterferencesNg ?? 0} · Ns=${asm.unstableSubassembliesNs ?? 0}`;
  projectDomainOutputs(
    tribRoot,
    'tribology',
    {
      recommendedMaterial: trib.recommendedMaterial || inputs.tribologyMaterial,
      hybridRecommended: hyb.hybridRecommended
        ? (lang === 'en' ? 'Hybrid A05+R55 Recommended' : 'Híbrido A05+R55 Recomendado')
        : (lang === 'en' ? 'Monometallic A05/R55' : 'Monometálico Cr27/R55'),
      hybridMassSavingsPct: hyb.massSavingsPct ?? 31.8,
      activeSeries: asm.pipeSeries || inputs.pipeSeries || '6x4',
      activeWeightKg: asm.totalAssemblyMassKg ?? 492,
      activeNioshHoistRequired: asm.nioshHoistPartsCount ? `${asm.nioshHoistPartsCount} piezas ≥ 23 kg` : 'Manual',
      activeMaterialCode: matCode,
      impellerMaterialCode: impCode,
      linerMaterialCode: linCode,
      interferenceEval: interfLabel,
      volumetricLossPct: asm.volumetricEfficiencyDropPct ?? 1.6,
      pipeVelocityMarginLossPct: asm.pipeVelocityMarginLossPct ?? 1.2,
      statusMessage: lang === 'en' ? (asm.structuralReasonEn || 'Toughness OK') : (asm.structuralReasonEs || 'Tenacidad OK'),
    },
    lang
  );
}

/**
 * Ejecuta el DAG hidráulico principal de transporte de pulpa y altitud.
 * @param {HTMLElement} root
 * @param {boolean} isEs
 */
function runPumpingCoreDag(root, isEs) {
  const inputs = /** @type {Record<string, any>} */ (readAllCanonicalInputs(root));
  const dag = solveXdsmMultidisciplinaryDag(inputs);
  const res = dag.slurryEval?.results || {};
  const alt = dag.altitudeEval || {};
  const sens = dag.sensitivity || {};
  /** @type {Record<string, string>} */
  const altTierMapEs = { sea_level: 'Nivel del Mar', mid_altitude: 'Meseta Minera', high_altitude: 'Sierra Alta' };
  /** @type {Record<string, string>} */
  const altTierMapEn = { sea_level: 'Sea Level', mid_altitude: 'Mining Plateau', high_altitude: 'High Altitude' };
  const rawTier = String(alt.altitudeTier || 'mid_altitude');
  const altTierHuman = (isEs ? altTierMapEs : altTierMapEn)[rawTier] || rawTier;
  const sobolSiPct = Number((Number(sens.sobolDominantSi ?? 0.42) * 100).toFixed(1));
  const interPct = Number((Number(sens.interactionResidual ?? 0.05) * 100).toFixed(1));
  const outPayload = {
    ...res,
    ...alt,
    altitudeTier: altTierHuman,
    criticalVelocityMs: res.criticalSettlingVelocityMs,
    combinedMotorAltitudeMultiplier: dag.slurryEval?.combinedMotorAltitudeMultiplier ?? alt.combinedMotorAltitudeMultiplier,
    motorSizingPenaltyPct: dag.slurryEval?.motorSizingPenaltyPct ?? alt.motorSizingPenaltyPct,
    sobolDominantDriver: sens.sobolDominantDriver || (isEs ? 'Caudal de Pulpa Q' : 'Slurry Flow Rate Q'),
    sobolDominantSi: sobolSiPct,
    totalVariance: Number(sens.totalVariance ?? 0),
    interactionResidual: interPct,
    activeTrustBoundaryId: dag.leadValidation?.activeTrustBoundaryId || 'NONE',
  };
  projectDomainOutputs(root, 'pumping', outPayload, isEs ? 'es' : 'en');
  const npshBanner = root.querySelector('#pumping-npsh-warning-banner');
  if (npshBanner) npshBanner.classList.toggle('hidden', !alt.npshSafeMarginWarning);
  const sobolFill = /** @type {HTMLElement | null} */ (root.querySelector('#pumping-sobol-fill'));
  if (sobolFill) sobolFill.style.width = `${Math.max(8, Math.min(100, sobolSiPct))}%`;
  const alertBox = root.querySelector('#trust-boundary-alert');
  const alertTitle = root.querySelector('#trust-boundary-title');
  const alertReason = root.querySelector('#trust-boundary-reason');
  const hasBound = Boolean(dag.leadValidation?.activeTrustBoundaryId && dag.leadValidation.activeTrustBoundaryId !== 'NONE');
  if (alertBox) alertBox.classList.toggle('hidden', !hasBound);
  if (hasBound && alertTitle) alertTitle.textContent = isEs ? (dag.leadValidation.activeTrustBoundaryTitleEs || '') : (dag.leadValidation.activeTrustBoundaryTitleEn || '');
  if (hasBound && alertReason) alertReason.textContent = isEs ? (dag.leadValidation.activeTrustBoundaryReasonEs || '') : (dag.leadValidation.activeTrustBoundaryReasonEn || '');
  /**
   * @param {string} sel
   * @param {string} txt
   */
  const setTxt = (sel, txt) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = txt;
  };
  setTxt('#val-flow', `${Math.round(Number(inputs.flowM3H))} m³/h`);
  setTxt('#val-solids', `${Math.round(Number(inputs.solidsWeightPercent))}%`);
  setTxt('#val-d80', `${Math.round(Number(inputs.particleSizeD80Microns))} µm`);
  setTxt('#val-sg', Number(inputs.solidsSpecificGravity).toFixed(2));
  setTxt('#val-ph', `pH ${Number(inputs.pH).toFixed(1)}`);
  setTxt('#val-altitude', `${Math.round(Number(inputs.altitudeM)).toLocaleString('en-US')} ${isEs ? 'msnm' : 'MASL'}`);

  const cta = /** @type {HTMLAnchorElement | null} */ (root.querySelector('#pumping-island-quote-cta'));
  if (cta) {
    const base = isEs ? '/cotizar/' : '/en/quote/';
    cta.href = `${base}?circuito=bombeo&serie=${encodeURIComponent(String(inputs.pipeSeries || '6x4'))}&flow=${Math.round(Number(inputs.flowM3H))}&solids=${Math.round(Number(inputs.solidsWeightPercent))}&d80=${Math.round(Number(inputs.particleSizeD80Microns))}&sg=${Number(inputs.solidsSpecificGravity).toFixed(2)}&alt=${Math.round(Number(inputs.altitudeM))}#rfq`;
  }
}

/**
 * Inicializa PumpingAssistantStratum2 en modo acordeón progresivo (Cowan <= 8.50).
 */
export function initPumpingAssistantStratum2() {
  const root = /** @type {HTMLElement | null} */ (document.querySelector('[data-pumping-stratum2]'));
  if (!root) return;
  const isEs = root.dataset.lang !== 'en';
  /** @type {'es' | 'en'} */
  const lang = isEs ? 'es' : 'en';
  bindAtomicPartTrayButtons(root);
  bindCalculatedKitToTrayButtons(root, lang);

  const tribPanel = /** @type {HTMLElement | null} */ (root.querySelector('#pumping-tribology-station'));
  if (tribPanel && tribPanel.dataset.tribologyStationBound !== '1') {
    tribPanel.dataset.tribologyStationBound = '1';
    bindCanonicalTribologySelector(tribPanel, lang);
    bindDomainSchemaRoot(tribPanel, ['tribology'], () => runTribologyStationDag(tribPanel, lang));
    runTribologyStationDag(tribPanel, lang);
  }

  const sealPanel = /** @type {HTMLElement | null} */ (root.querySelector('#pumping-seals-station'));
  if (sealPanel && sealPanel.dataset.sealStationBound !== '1') {
    sealPanel.dataset.sealStationBound = '1';
    bindCanonicalSealBalanceCalculator(sealPanel, lang);
    initSkidKinematicsInspector(sealPanel, lang);
    initBearingSupportInspector(sealPanel, lang);
    bindDomainSchemaRoot(sealPanel, ['sealDrive'], () => {
      const inputs = readAllCanonicalInputs(sealPanel);
      const dag = solveXdsmMultidisciplinaryDag(inputs);
      projectDomainOutputs(
        sealPanel,
        'sealDrive',
        {
          ...(dag.sealBalanceEval || {}),
          ...(dag.driveEval || {}),
          serviceFactor: dag.frameEval?.serviceFactor,
          derivedTorqueNm: dag.derivedTorqueNm,
        },
        lang
      );
    });
  }

  const pumpingRoot = /** @type {HTMLElement | null} */ (root.querySelector('[data-domain-root="pumping"]'));
  if (pumpingRoot && pumpingRoot.dataset.pumpingCoreBound !== '1') {
    pumpingRoot.dataset.pumpingCoreBound = '1';
    bindDomainSchemaRoot(pumpingRoot, ['pumping'], () => runPumpingCoreDag(root, isEs));

    pumpingRoot.querySelectorAll('.stress-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const stressInput = /** @type {HTMLInputElement | null} */ (pumpingRoot.querySelector('#wb-stress-symptom'));
        const val = chip.getAttribute('data-symptom') || 'roca_dura';
        if (stressInput) {
          stressInput.value = val;
          stressInput.dataset.userTouched = 'true';
        }
        pumpingRoot.querySelectorAll('.stress-chip').forEach((c) => {
          const on = c === chip;
          c.classList.toggle('active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        runPumpingCoreDag(root, isEs);
      });
    });

    pumpingRoot.querySelectorAll('[data-wb-altitude-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const altVal = btn.getAttribute('data-wb-altitude-btn') || btn.getAttribute('data-alt') || '2400';
        const altInput = /** @type {HTMLInputElement | null} */ (pumpingRoot.querySelector('#wb-altitude-input'));
        if (altInput) {
          altInput.value = altVal;
          altInput.dataset.userTouched = 'true';
        }
        pumpingRoot.querySelectorAll('[data-wb-altitude-btn]').forEach((b) => b.classList.toggle('active', b === btn));
        runPumpingCoreDag(root, isEs);
      });
    });

    /** @type {Record<string, any>} */
    let presets = {};
    try {
      presets = JSON.parse(pumpingRoot.getAttribute('data-presets') || '{}');
    } catch (_e) { }
    pumpingRoot.querySelectorAll('.preset-chip[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = presets[btn.getAttribute('data-preset') || ''];
        if (!p) return;
        /**
         * @param {string} sel
         * @param {any} val
         */
        const setInput = (sel, val) => {
          const el = /** @type {HTMLInputElement | null} */ (pumpingRoot.querySelector(sel));
          if (el && val !== undefined) {
            el.value = String(val);
            el.dataset.userTouched = 'true';
          }
        };
        setInput('#slider-flow', p.flowM3H);
        setInput('#slider-solids', p.solidsWeightPercent);
        setInput('#slider-d80', p.particleSizeD80Microns);
        setInput('#slider-sg', p.solidsSpecificGravity);
        pumpingRoot.querySelectorAll('.preset-chip').forEach((b) => b.classList.toggle('active', b === btn));
        runPumpingCoreDag(root, isEs);
      });
    });

    runPumpingCoreDag(root, isEs);
  }

  const deepLink = typeof window !== 'undefined' ? resolvePumpingTabDeepLink(window.location.search, window.location.hash) : null;
  const calcAccordion = /** @type {HTMLDetailsElement | null} */ (root.querySelector('#bombeo-calculator-accordion'));
  if (calcAccordion) {
    if (deepLink) {
      calcAccordion.open = true;
    }
    if (calcAccordion.dataset.accSyncBound !== '1') {
      calcAccordion.dataset.accSyncBound = '1';
      calcAccordion.addEventListener('toggle', () => {
        if (calcAccordion.open) {
          if (pumpingRoot) runPumpingCoreDag(root, isEs);
          if (tribPanel) runTribologyStationDag(tribPanel, lang);
        }
      });
    }
  }
  initPumpingTabRouter(root, deepLink);
}
