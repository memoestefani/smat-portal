// @ts-nocheck
/**
 * quoteWizardController.js
 * ---------------------------------------------------------------------------
 * Fachada Orquestadora XDSM Única del Quote Wizard (`/cotizar/` y `/en/quote/`).
 * Ejecuta exclusivamente `readAllCanonicalInputs` + `solveXdsmMultidisciplinaryDag`
 * una sola vez por ciclo reactivo (`D1-V51` / `D2-V51`), sin fallbacks ni recálculos en sombra.
 */

import { evaluatePumpAssemblySequence } from '../scripts/pumpAssemblyAndDriveEngine.js';
import { DOSSIER_FORMATTERS_BY_FIELD, formatDossierCircuitPhysicsRow, formatDossierMetrologyBadge, formatDossierSimulationBanner } from '../scripts/quoteDossierRenderer.js';
import { readAllCanonicalInputs, projectDomainOutputs } from '../scripts/schemaRuntimeBinder.js';
import { getTrayState } from '../scripts/requisitionTrayBus.js';
import { MECHANICAL_DIAGNOSTICS, PIPE_SERIES_DIAMETER_MM, resolvePipeDiameterMm } from '../scripts/slurryEngine.js';
import { applyCircuitStatechartXOR, CIRCUIT_XOR_VIEW_SPEC, getCircuitXorViewProjection } from '../scripts/wizardCircuitXorStatechart.js';
import { projectLiveDossierSummary, switchDossierTabView } from '../scripts/wizardDossierProjector.js';
import { bindAllWizardEventListeners, collectWizardDomRefs } from '../scripts/wizardEventBindings.js';
import { buildSmatCode, decodeSmatCode, FORMATTERS_BY_FIELD, matchMiningGroupByEmailDomain, projectWorkbenchToDOM, resolveMiningUnitPulpPreset } from '../scripts/wizardMiningAndCodeDecoder.js';
import { applyUrlContextToWizard, collectWizardPayloadData, hydrateMetrologyInputsFromState, hydrateSessionIntoWizardDom, initProfileFromStorage, sanitizeAndMigrateStorage } from '../scripts/wizardStateAndUrlLens.js';
import {
  FILTRATION_CONDITION_ALIAS_MAP,
  FLOTATION_CONDITION_ALIAS_MAP,
  normalizeFiltrationConditionKey,
  normalizeFlotationConditionKey,
  parseMarcyThreeCupUrlParams,
  resolveCanonicalRoleFromUrlParam,
  resolveFiltrationDomChipKey,
  resolveFlotationDomChipKey,
  resolveUrlContextDescriptor,
  ROLE_ALIAS_MAP
} from '../scripts/wizardUrlAndPresetRouter.js';
import { solveXdsmMultidisciplinaryDag } from '../scripts/wizardXdsmDagSolver.js';
import { ATOMIC_PARTS_CATALOG, dispatchLeadWebhook, generateSmatPartCode, getAtomicPartSpecs, loadWorkbenchSession, parseUrlContextParams } from '../scripts/workbenchBus.js';

export { buildSmatCode, CIRCUIT_XOR_VIEW_SPEC, decodeSmatCode, DOSSIER_FORMATTERS_BY_FIELD, FILTRATION_CONDITION_ALIAS_MAP, FLOTATION_CONDITION_ALIAS_MAP, formatDossierMetrologyBadge, formatDossierSimulationBanner, FORMATTERS_BY_FIELD, getCircuitXorViewProjection, matchMiningGroupByEmailDomain, normalizeFiltrationConditionKey, normalizeFlotationConditionKey, parseMarcyThreeCupUrlParams, projectWorkbenchToDOM, resolveCanonicalRoleFromUrlParam, resolveFiltrationDomChipKey, resolveFlotationDomChipKey, resolveMiningUnitPulpPreset, resolveUrlContextDescriptor, ROLE_ALIAS_MAP };

/**
 * Transductor determinista puro de Mealy: `(state, urlParams) -> viewState` (evaluación Node sin DOM).
 */
export function computeWizardViewState(state = {}, urlParams = {}) {
  const ctx = typeof urlParams === 'string' ? parseUrlContextParams(urlParams) : (urlParams || {});
  const rawCircuitInput = ctx.circuito || state.circuit || '';
  const rawRole = ctx.rol || ctx.equipo || state.roleId || (rawCircuitInput === 'clasificacion' ? 'hidrociclon_apex_vortex' : '');
  const mappedRole = resolveCanonicalRoleFromUrlParam(rawRole, ctx.pieza || '', rawCircuitInput);
  const flotCondition = normalizeFlotationConditionKey(ctx.flot_condition || state.flot_condition || '');
  const filtCondition = normalizeFiltrationConditionKey(ctx.filt_condition || state.filt_condition || '');
  const cycloneCircuit = parseMarcyThreeCupUrlParams(typeof urlParams === 'string' ? urlParams : ctx);

  let circuit = rawCircuitInput || 'bombeo';
  if (circuit === 'control' || circuit === 'lab') {
    circuit = 'control_procesos';
  } else if (circuit === 'clasificacion') {
    circuit = 'bombeo';
  } else if (!ctx.circuito && rawRole) {
    const rLower = String(rawRole).toLowerCase();
    if (rLower.includes('marcy') || rLower.includes('balanza') || rLower.includes('batch') || rLower.includes('tamiz') || rLower === 'custom') {
      circuit = 'control_procesos';
    } else if (rLower.includes('flot') || rLower.includes('celda') || rLower.includes('rotor') || rLower.includes('mecanismo')) {
      circuit = 'flotacion';
    } else if (rLower.includes('filt') || rLower.includes('prensa') || rLower.includes('placa') || rLower.includes('tela')) {
      circuit = 'filtracion';
    } else if (rLower.includes('hidrociclon') || rLower.includes('malla_criba') || rLower.includes('cribado')) {
      circuit = 'bombeo';
    }
  }

  const coupledClassificationActive = rawCircuitInput === 'clasificacion' || mappedRole === 'hidrociclon_apex_vortex' || mappedRole === 'malla_criba_poliuretano';
  const selectedMaterial = ctx.material || state.material || 'A05';
  const resolvedSku = ctx.sku || state.sku || null;

  let pipeSize = state.pipeSize || '6x4';
  if (ctx.serie) {
    const sNorm = String(ctx.serie).toLowerCase().trim();
    if (PIPE_SERIES_DIAMETER_MM[sNorm]) pipeSize = sNorm;
    else {
      const matchSeries = ['14x12', '12x10', '10x8', '8x6', '6x4', '4x3', '3x2', '2x1.5', '1.5x1'].find((k) => sNorm.includes(k));
      if (matchSeries) pipeSize = matchSeries;
    }
  }

  const atomicRef = ctx.codigo || ctx.pieza || state.atomicCode || mappedRole;
  const partSpecs = getAtomicPartSpecs(atomicRef, pipeSize);
  const smatCode = generateSmatPartCode({
    circuit,
    role_id: mappedRole,
    pipe_size: circuit === 'bombeo' ? pipeSize : '',
    size_val: pipeSize
  });

  const openStep2 = Boolean(ctx.flow || ctx.solids || ctx.cw || ctx.d80 || ctx.p80 || ctx.claro_mm || state.step2Open);
  const openStep3 = Boolean(ctx.mina || state.step3Open);
  const openSymptomDrawer = Boolean(ctx.sintoma || ctx.falla || ctx.mina || ctx.urgencia || state.stressSymptom);
  const openEngineeringDrawer = Boolean(circuit !== 'bombeo' || ctx.material || ctx.transmision || ctx.pieza || ctx.metrologia || state.userTouchedEngineering);
  const openSmartPasteDrawer = Boolean(ctx.codigo || state.smartPasteOpen);
  const pipeOrSeries = ctx.serie ? String(ctx.serie) : pipeSize;
  const budgetCategory = (circuit === 'flotacion' || circuit === 'filtracion')
    ? 'PROYECTO_EQUIPOS'
    : (circuit === 'control_procesos' ? 'CONTROL_PROCESOS' : 'OPERACION_SPARE_PARTS');

  return {
    circuit,
    roleId: mappedRole,
    sku: resolvedSku,
    selectedMaterial,
    coupledClassificationActive,
    flotCondition,
    filtCondition,
    cycloneCircuit,
    pipeSize,
    pipeOrSeries,
    budgetCategory,
    smatCode,
    partSpecs,
    openStep2,
    openStep3,
    openSymptomDrawer,
    openEngineeringDrawer,
    openSmartPasteDrawer,
    drawers: {
      symptomOpen: openSymptomDrawer,
      engineeringConfigOpen: openEngineeringDrawer,
      smartPasteOpen: openSmartPasteDrawer,
      durandOpen: openStep2,
      dispatchOpen: openStep3
    },
    panels: {
      bombeoVisible: circuit === 'bombeo',
      clasificacionVisible: coupledClassificationActive,
      flotacionVisible: circuit === 'flotacion',
      filtracionVisible: circuit === 'filtracion',
      controlVisible: circuit === 'control_procesos',
      recirculationAlertVisible: mappedRole === 'solo_impulsor' || mappedRole === 'solo_voluta'
    },
    hasActiveDiagFilter: Boolean(MECHANICAL_DIAGNOSTICS && ATOMIC_PARTS_CATALOG && evaluatePumpAssemblySequence && dispatchLeadWebhook && loadWorkbenchSession && DOSSIER_FORMATTERS_BY_FIELD && formatDossierMetrologyBadge)
  };
}

/**
 * Inicializa la consola del Quote Wizard conectando los módulos XDSM/DOM sobre `schemaRuntimeBinder`.
 */
export function initQuoteWizardController() {
  if (typeof document === 'undefined') return;
  const doc = document;
  const win = typeof window !== 'undefined' ? window : null;
  const dom = collectWizardDomRefs(doc);
  if (!dom.container) return;

  const isEs = (dom.container.getAttribute('data-lang') || 'es') !== 'en';
  const nowDateIso = new Date().toISOString().slice(0, 10);
  const currentFolio = `SMAT-${nowDateIso.replace(/-/g, '')}-${String(Math.floor(100 + Math.random() * 900))}`;
  if (dom.liveFolio) dom.liveFolio.textContent = currentFolio;
  const elLiveDate = doc.getElementById('live-date');
  if (elLiveDate) elLiveDate.textContent = nowDateIso;
  if (dom.miniFolioText) dom.miniFolioText.textContent = `Folio ${currentFolio}`;

  let miningGroups = [];
  try {
    const rawGrp = dom.container.getAttribute('data-mining-groups');
    if (rawGrp) miningGroups = JSON.parse(rawGrp);
  } catch (_e) { }

  const state = {
    isEs,
    currentFolio,
    currentCircuit: 'bombeo',
    isOpex: dom.container.getAttribute('data-default-type') !== 'capex',
    isCustomEquipment: false,
    selectedAltitude: 0,
    selectedTcoAlloy: 'A05',
    ctrlSolveMode: 'cw',
    leadEndpointUrl: dom.container.getAttribute('data-lead-endpoint') || '',
    miningGroups,
    currentAtomicCode: '',
    currentBomOverride: null,
    selectedUnitPulpProfile: '',
    hasProcessedPhoto: false,
    currentHydraulicMetrics: {},
    currentTcoMetrics: {},
    currentPartSpecs: {},
    currentClearanceEval: {},
    currentKinematics: {},
    currentMetrology: null,
    lastAltitudeEval: null,
    lastDagSnapshot: null
  };

  function runSlurryCalculation() {
    const canonicalInputs = readAllCanonicalInputs(doc);
    const Q = canonicalInputs.flowM3H;
    const Cw = canonicalInputs.solidsWeightPercent;
    const d80 = canonicalInputs.particleSizeD80Microns;
    const Ss = canonicalInputs.solidsSpecificGravity;
    const pHVal = canonicalInputs.pH;
    const pipeSeriesVal = canonicalInputs.pipeSeries;
    const D_mm = resolvePipeDiameterMm(pipeSeriesVal);
    const downtimeHours = Number(dom.sliderDowntime?.value) || 4;
    const trayState = getTrayState();

    const altitudeM = Number.isFinite(Number(dom.altNumericInput?.value))
      ? Number(dom.altNumericInput.value)
      : (state.selectedAltitude || canonicalInputs.altitudeM);
    state.selectedAltitude = altitudeM;

    if (dom.valFlow) dom.valFlow.textContent = `${Q} m³/h`;
    if (dom.valSolids) dom.valSolids.textContent = `${Cw}%`;
    if (dom.valD80) dom.valD80.textContent = `${d80} µm`;
    if (dom.valSg) dom.valSg.textContent = Ss.toFixed(2);
    if (dom.valPh) dom.valPh.textContent = `pH ${pHVal.toFixed(1)}`;
    if (dom.valPipeMm) dom.valPipeMm.textContent = `${pipeSeriesVal} (${D_mm} mm)`;
    if (dom.valDowntime) dom.valDowntime.textContent = `${downtimeHours} hrs`;

    const dagSnapshot = solveXdsmMultidisciplinaryDag({
      ...canonicalInputs,
      altitudeM,
      circuit: state.currentCircuit,
      urgency: state.isOpex ? 'paro_de_linea' : 'programado',
      criticalityMode: canonicalInputs.criticalityMode || (state.isOpex ? 'paro_planta' : 'normal'),
      trayItems: Array.isArray(trayState.items) ? trayState.items : [],
      stockRegime: state.isOpex ? 'hay' : 'se_fabrica',
      estimatedTotalMxn: state.isOpex ? 18500 : 85000,
      folio: currentFolio
    });
    state.lastDagSnapshot = dagSnapshot;

    const simOut = dagSnapshot.slurryEval || {};
    const res = simOut.results || {};
    const alt = dagSnapshot.altitudeEval || {};
    const matOpt = dagSnapshot.optimalMaterial || {};
    state.lastAltitudeEval = { ...alt, combinedMotorAltitudeMultiplier: simOut.combinedMotorAltitudeMultiplier };

    const Vc = Number(res.criticalVelocityMs ?? res.criticalSettlingVelocityMs);
    const V_actual = Number(res.actualVelocityMs ?? res.actualPipeVelocityMs);
    const Vrec = Number(res.recommendedPipeVelocityMs);
    const Sm = Number(res.slurrySpecificGravity);
    const Cv = Number(res.solidsVolumetricPercent);
    const hrFactor = Number(res.headDeratingFactorHr);
    const erFactor = Number(res.effDeratingFactorEr);
    const wearRatio = Number(res.wearLifeRatio);
    const lifeHrs = Number(res.estimatedImpellerLifeHours);

    const locale = isEs ? 'es' : 'en';
    projectDomainOutputs(doc, 'pumping', {
      ...res,
      criticalVelocityMs: Vc,
      actualPipeVelocityMs: V_actual,
      combinedMotorAltitudeMultiplier: simOut.combinedMotorAltitudeMultiplier,
      motorSizingPenaltyPct: simOut.motorSizingPenaltyPct,
      activeTrustBoundaryId: dagSnapshot.leadValidation?.activeTrustBoundaryId || '',
      sobolDominantDriver: dagSnapshot.sensitivity?.sobolDominantDriver || ''
    }, locale);

    if (dom.metricMaterial) dom.metricMaterial.textContent = isEs ? (res.materialNameEs || matOpt.nameEs) : (res.materialNameEn || matOpt.nameEn);
    if (dom.metricLife && dom.metricLife.children?.length === 0) {
      dom.metricLife.textContent = `~${lifeHrs} h (${wearRatio.toFixed(1)}×)`;
    }
    if (dom.altitudeNpshHint) {
      dom.altitudeNpshHint.textContent = isEs
        ? `Altitud ${altitudeM} msnm · Patm=${alt.pAtmHeadMca.toFixed(2)} mca · -ΔNPSHa=${alt.deltaNpshLossM.toFixed(2)} m · IEC=${alt.motorDeratingFactor.toFixed(3)}`
        : `Altitude ${altitudeM} MASL · Patm=${alt.pAtmHeadMca.toFixed(2)} mwc · -ΔNPSHa=${alt.deltaNpshLossM.toFixed(2)} m · IEC=${alt.motorDeratingFactor.toFixed(3)}`;
    }

    const elQuickVc = doc.getElementById('quick-vc');
    const elQuickSm = doc.getElementById('quick-sm-cv');
    const elQuickHr = doc.getElementById('quick-hr-derating');
    const elQuickMat = doc.getElementById('quick-alloy-ratio');
    if (elQuickVc) elQuickVc.textContent = `${Vc.toFixed(2)} m/s`;
    if (elQuickSm) elQuickSm.textContent = `${Sm.toFixed(2)} kg/L (${Cv.toFixed(1)}% Cv)`;
    if (elQuickHr) elQuickHr.textContent = `HR ${hrFactor.toFixed(2)} · Motor ${(alt.motorDeratingFactor * 100).toFixed(0)}%`;
    if (elQuickMat) elQuickMat.textContent = `${res.recommendedMaterial || matOpt.code} (${wearRatio.toFixed(1)}×)`;

    if (dom.liveTableFlow) dom.liveTableFlow.textContent = `${Q} m³/h @ ${Cw}% Cw (Sm=${Sm.toFixed(2)} kg/L, HR=${hrFactor.toFixed(2)})`;
    if (dom.liveTableD80) dom.liveTableD80.textContent = `d80=${d80} µm · ØD=${D_mm} mm`;
    if (dom.liveTableVc) dom.liveTableVc.textContent = `${Vc.toFixed(2)} m/s (Real: ${V_actual.toFixed(2)} m/s)`;

    if (state.currentCircuit === 'control_procesos') {
      const marcy = dagSnapshot.marcyEval || {};
      const gy = dagSnapshot.gyEval || {};
      const sieves = dagSnapshot.sieveEval || {};
      const setId = (id, t) => { const n = doc.getElementById(id); if (n) n.textContent = t; };
      setId('wb-ctrl-res-sm', `${Number(marcy.pulpDensityKgL).toFixed(3)} kg/L`);
      setId('wb-ctrl-res-bias', `±${Number(marcy.wrongRingBiasPoints || 0).toFixed(1)} pts %Cw`);
      setId('wb-ctrl-res-gy', `${Number(gy.minDrySampleKg).toFixed(2)} kg`);
      setId('wb-ctrl-res-rr', `${sieves.primaryControlMesh} · n=${Number(sieves.rosinRammlerSlopeN).toFixed(2)}`);
      state.currentMetrology = {
        cw: marcy.solidsWeightPercent,
        solidsPctCw: marcy.solidsWeightPercent,
        sm: marcy.pulpDensityKgL,
        specificGravity: marcy.solidsSpecificGravity,
        recommendedRingSg: marcy.recommendedRingSg,
        p80: canonicalInputs.targetP80Microns,
        primaryControlMesh: sieves.primaryControlMesh,
        rosinRammlerSlopeN: sieves.rosinRammlerSlopeN,
        rosinRammlerY: sieves.rosinRammlerY,
        recommendedContainerEs: marcy.recommendedContainerEs,
        recommendedContainerEn: marcy.recommendedContainerEn,
        dryMassKg: gy.minDrySampleKg,
        summary: `Ss=${marcy.solidsSpecificGravity} | Cw=${marcy.solidsWeightPercent}% | Sm=${Number(marcy.pulpDensityKgL).toFixed(3)} kg/L | M_min=${gy.minDrySampleKg} kg | P80=${canonicalInputs.targetP80Microns} µm`
      };
    }

    const dryTph = (Q * Cw * Ss) / 100;
    const tonsAtRisk = Math.round(dryTph * downtimeHours);
    if (dom.tcoTonnageVal) dom.tcoTonnageVal.textContent = `~${tonsAtRisk.toLocaleString()} ton`;
    if (dom.tcoSavingsVal) {
      dom.tcoSavingsVal.textContent = isEs
        ? `${state.selectedTcoAlloy}: vida relativa ${wearRatio.toFixed(1)}× vs hierro gris`
        : `${state.selectedTcoAlloy}: ${wearRatio.toFixed(1)}× relative wear life`;
    }

    state.currentHydraulicMetrics = {
      flow_m3h: Q,
      solids_cw: Cw,
      d80_um: d80,
      pulp_ph: pHVal,
      slurry_sg: Sm.toFixed(2),
      solids_cv: Cv.toFixed(1),
      critical_velocity_ms: Vc.toFixed(2),
      line_velocity_ms: V_actual.toFixed(2),
      safe_velocity_ms: Vrec.toFixed(2),
      durand_fl: Number(res.durandFactorFL).toFixed(2),
      head_ratio: hrFactor.toFixed(2),
      eff_ratio_er: erFactor.toFixed(2),
      impeller_life_h: lifeHrs,
      wear_life_ratio: wearRatio.toFixed(1),
      altitude_msnm: altitudeM,
      recommended_alloy: res.recommendedMaterial || matOpt.nameEs,
      sobolDominantDriver: dagSnapshot.sensitivity?.sobolDominantDriver || '',
      xdsmDisciplines: dagSnapshot.disciplineOrder.length
    };
    state.currentTcoMetrics = {
      tco_tons_at_risk: tonsAtRisk,
      tco_downtime_hrs: downtimeHours,
      tco_summary: dom.tcoSavingsVal ? dom.tcoSavingsVal.textContent : ''
    };
  }

  function updateDossier() {
    const out = projectLiveDossierSummary({ doc, dom, state });
    state.currentPartSpecs = out.currentPartSpecs || state.currentPartSpecs;
    state.currentClearanceEval = out.currentClearanceEval || state.currentClearanceEval;
    state.currentKinematics = out.currentKinematics || state.currentKinematics;
    state.currentMetrology = out.currentMetrology || state.currentMetrology;
  }

  function setCircuit(circuit) {
    state.currentCircuit = circuit || 'bombeo';
    if (dom.inputCircuit) dom.inputCircuit.value = state.currentCircuit;
    applyCircuitStatechartXOR(state.currentCircuit, { doc, isEs });
    dom.circuitPills?.forEach((p) => {
      const isMatch = p.getAttribute('data-circuit') === state.currentCircuit;
      p.classList.toggle('active', isMatch);
      p.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
    const simHeadline = doc.getElementById('sim-headline-text');
    const simContextPill = doc.getElementById('sim-circuit-context-pill');
    if (simHeadline) {
      const bannerMeta = formatDossierSimulationBanner(state.currentCircuit, isEs, dom.selectRole?.value || '');
      simHeadline.textContent = bannerMeta.headline;
      if (simContextPill) simContextPill.textContent = bannerMeta.contextPill;
    }
    updateDossier();
  }

  function updateRoleCriteriaBar() {
    const roleEl = doc.getElementById('wb-criteria-rule');
    if (!roleEl) return;
    const roleKey = state.currentCircuit === 'bombeo' ? (dom.selectRole?.value || 'kit_wet_end') : state.currentCircuit;
    const cObj = formatDossierCircuitPhysicsRow(state.currentCircuit, {}, state.currentPartSpecs, isEs, roleKey);
    roleEl.textContent = `${cObj.label}: ${cObj.value}`;
  }

  const actions = {
    setCircuit,
    runSlurryCalculation,
    updateDossier,
    updateRoleCriteriaBar,
    collectData: () => collectWizardPayloadData(doc, dom, state),
    checkUrlContext: () => applyUrlContextToWizard(doc, dom, state, actions),
    handleWorkbenchUpdateEvent: (evt) => {
      const detail = evt.detail || {};
      if (detail.intent === 'capex') dom.btnCapex?.click();
      else if (detail.intent === 'opex') dom.btnOpex?.click();
      if (detail.circuit) setCircuit(detail.circuit);
      runSlurryCalculation();
      updateDossier();
    },
    handleMissionEvent: (evt) => {
      const m = evt.detail?.mission;
      if (m === 'requisicion_capex') dom.btnCapex?.click();
      else if (m === 'paro_urgente' || m === 'desgaste_proceso') dom.btnOpex?.click();
      updateDossier();
    }
  };

  sanitizeAndMigrateStorage();
  hydrateSessionIntoWizardDom(doc, dom, state, actions);
  hydrateMetrologyInputsFromState(dom);
  bindAllWizardEventListeners({ doc, win, dom, state, actions });
  runSlurryCalculation();
  initProfileFromStorage(doc, dom, updateDossier);
  actions.checkUrlContext();
  updateRoleCriteriaBar();
  switchDossierTabView('maint', dom);
  updateDossier();
}
