/**
 * wizardCircuitPhysicsController.js
 * ---------------------------------------------------------------------------
 * Costura Modular LCOM4 = 1 (∂(C) = 0, D1-V39 a D5-V39, D10-V39)
 * 1. Bus Bidireccional PutGet Trans-Página (`smat_engineering_context_v1` en `sessionStorage` / `localStorage`)
 *    que sincroniza sin amnesia las calculadoras de `/flotacion/celdas/`, `/filtracion/`,
 *    `/clasificacion/` y `/bombeo/skid/` con `/cotizar/` (`QuoteWizard.astro` y `LiveEngineeringDossier.astro`).
 * 2. Evaluadores físicos en vivo para `/cotizar/`:
 *    - Flotación: `evaluateFlotationCellHydrodynamics` (Gorain $S_b, k, v_{\text{tip}}$ + Zwietering $N_{js}$).
 *    - Filtración: `calculateFilterPressCycleCapacity` (Timoshenko $\sigma_{\max}, \text{FS}$ + Darcy-Ruth ciclos/día).
 *    - Clasificación: `evaluateHydrocycloneCutPoint` (3 Vasos Marcy $\text{CC}\%$ + Plitt $d_{50c}$ + Weibull $\alpha$).
 *    - Bombeo / Tren Motriz: `selectBearingFrameByPowerAndRpm` + `evaluateHybridWetEndConfiguration` (`Rama D`).
 */

import {
  calculateThreeCupMarcyCycloneBalance,
  evaluateFilterPressPlateDeflection
} from './slurryEngine.js';
import {
  calculateFlotationGorainKineticRate,
  calculateUrethaneScreenPartitionWeibull
} from './mechanicalAndSeparationEngine.js';
import {
  calculateDriveAndBearingKinematics,
  selectBearingFrameByPowerAndRpm,
  evaluateHybridWetEndConfiguration,
  evaluateWetEndAssemblyInterference,
  evaluatePumpAssemblySequence
} from './pumpAssemblyAndDriveEngine.js';
import {
  projectPumpDriveAndHybridTelemetry,
  projectClassificationAndScreenTelemetry,
  projectFlotationAndFiltrationTelemetry
} from './wizardLivePhysicsProjector.js';

export const SMAT_ENGINEERING_CONTEXT_KEY = 'smat_engineering_context_v1';

const DEFAULT_ENGINEERING_CONTEXT = Object.freeze({
  activeCircuit: 'bombeo',
  updatedAtIso: '2026-11-17T00:00:00Z',
  flotation: {
    cellVolumeKey: '100ft',
    rotorDiaM: 0.61,
    jgCmS: 1.5,
    d32Mm: 1.6,
    rotorRpm: 215,
    sbInverseSeconds: 56.25,
    tipSpeedMS: 6.87,
    rateConstantMin: 1.185,
    zwieteringNjsRpm: 178,
    gorainCompliant: true,
    recommendedSkuId: 'SMAT-FLOT-MECH-18SP'
  },
  filtration: {
    plateWidthMm: 1200,
    feedPressureBar: 12,
    cloggedPortsCount: 0,
    plateThicknessMm: 65,
    cakeMoistureTargetPct: 14,
    maxBendingStressMpa: 3.54,
    flexuralSafetyFactor: 4.10,
    cyclesPerDay: 36,
    dryTonnesPerDay: 285,
    isPlateCrackingRisk: false,
    nom141Compliant: true,
    recommendedSkuId: 'SMAT-FILT-CLOTH-PLATE'
  },
  classification: {
    feedSg: 1.35,
    underflowSg: 1.82,
    overflowSg: 1.15,
    solidsSg: 2.7,
    feedPressureKpa: 95,
    cycloneDiameterMm: 380,
    apertureMm: 0.5,
    circulatingLoadPct: 248.5,
    cutPointD50cUm: 58.4,
    sharpnessAlpha: 4.4,
    isRopingRisk: false,
    recommendedSkuId: 'SMAT-CYC-COUPLED-KIT'
  },
  driveAndHybrid: {
    arrangementCode: 'CV',
    motorRpm: 1775,
    driverPulleyMm: 220,
    drivenPulleyMm: 340,
    motorPowerKw: 55,
    pipeSeries: '6x4',
    bearingFrameCode: 'FRAME-D',
    bearingCartridgeCode: 'DAM005',
    bearingL10Hours: 42500,
    beltRadialLoadKn: 4.2,
    hybridMassSavingsPct: 31.8,
    hybridSavedMassKg: 239.2
  }
});

let memoryContextFallback = structuredClone(DEFAULT_ENGINEERING_CONTEXT);

/**
 * Carga la instantánea de contexto de ingeniería desde `sessionStorage` / `localStorage`
 * preservando el complemento (`GetPut` / `PutGet`, `D10-V39`).
 *
 * @returns {any}
 */
export function loadEngineeringContextSnapshot() {
  try {
    if (typeof window !== 'undefined') {
      const rawSession = window.sessionStorage?.getItem(SMAT_ENGINEERING_CONTEXT_KEY);
      const rawLocal = window.localStorage?.getItem(SMAT_ENGINEERING_CONTEXT_KEY);
      const raw = rawSession || rawLocal;
      if (raw) {
        const parsed = JSON.parse(raw);
        return mergeEngineeringContext(parsed, DEFAULT_ENGINEERING_CONTEXT);
      }
    }
  } catch (_) {
    // Fallback en memoria
  }
  return structuredClone(memoryContextFallback);
}

/**
 * Normaliza entradas polimórficas (1 argumento `{ flotation, ... }` o 2 argumentos `(circuitSlug, payloadObj)`)
 * hacia la estructura canónica de `DEFAULT_ENGINEERING_CONTEXT` (`D2-V41` — Ley `PutGet`).
 *
 * @param {any} circuitOrPartial
 * @param {any} [maybePayload]
 * @returns {any}
 */
function normalizeEngineeringContextInput(circuitOrPartial = {}, maybePayload = null) {
  if (typeof circuitOrPartial === 'string') {
    const slug = circuitOrPartial.trim().toLowerCase();
    const p = maybePayload && typeof maybePayload === 'object' ? maybePayload : {};
    if (slug === 'flotacion' || slug === 'flotation') {
      return {
        activeCircuit: 'flotacion',
        flotation: {
          ...p,
          rotorDiaM: Number(p.rotorDiaM ?? p.rotorDiameterM ?? DEFAULT_ENGINEERING_CONTEXT.flotation.rotorDiaM),
          jgCmS: Number(p.jgCmS ?? p.superficialGasVelocityCmS ?? DEFAULT_ENGINEERING_CONTEXT.flotation.jgCmS),
          d32Mm: Number(p.d32Mm ?? p.bubbleDiameterMm ?? p.sauterBubbleDiaMm ?? DEFAULT_ENGINEERING_CONTEXT.flotation.d32Mm)
        }
      };
    }
    if (slug === 'filtracion' || slug === 'filtration') {
      return {
        activeCircuit: 'filtracion',
        filtration: { ...p }
      };
    }
    if (slug === 'clasificacion' || slug === 'classification') {
      return {
        activeCircuit: 'clasificacion',
        classification: {
          ...p,
          cutPointD50cUm: Number(p.cutPointD50cUm ?? p.d50cMicrons ?? DEFAULT_ENGINEERING_CONTEXT.classification.cutPointD50cUm)
        }
      };
    }
    if (slug === 'bombeo' || slug === 'pumping' || slug === 'driveandhybrid') {
      return {
        activeCircuit: 'bombeo',
        driveAndHybrid: {
          ...p,
          arrangementCode: String(p.arrangementCode ?? p.arrangement ?? DEFAULT_ENGINEERING_CONTEXT.driveAndHybrid.arrangementCode),
          motorPowerKw: Number(p.motorPowerKw ?? p.shaftPowerKw ?? DEFAULT_ENGINEERING_CONTEXT.driveAndHybrid.motorPowerKw),
          recommendedDynamicCkN: Number(p.recommendedDynamicCkN ?? p.dynamicCapacityCkN ?? 0)
        }
      };
    }
    if (slug === 'control_procesos' || slug === 'control' || slug === 'process_control') {
      return {
        activeCircuit: 'control_procesos',
        processControl: { ...p }
      };
    }
    return { activeCircuit: slug };
  }
  return circuitOrPartial && typeof circuitOrPartial === 'object' ? circuitOrPartial : {};
}

/**
 * Fusiona sin pérdida una actualización parcial sobre el contexto de ingeniería (`PutGet`).
 * Soporta firma de 1 objeto `(partialObj, base)` y firma polimórfica de 2 argumentos `(circuitSlug, payloadObj)`.
 *
 * @param {any} circuitOrPartial
 * @param {any} [maybePayloadOrBase]
 * @returns {any}
 */
export function mergeEngineeringContext(circuitOrPartial = {}, maybePayloadOrBase = null) {
  const isTwoArgSlugCall = typeof circuitOrPartial === 'string';
  const partial = normalizeEngineeringContextInput(
    circuitOrPartial,
    isTwoArgSlugCall ? maybePayloadOrBase : null
  );
  const current = (!isTwoArgSlugCall && maybePayloadOrBase) ? maybePayloadOrBase : loadEngineeringContextSnapshot();
  return {
    activeCircuit: partial.activeCircuit || partial.circuit || current.activeCircuit || 'bombeo',
    updatedAtIso: partial.updatedAtIso || new Date().toISOString(),
    flotation: {
      ...DEFAULT_ENGINEERING_CONTEXT.flotation,
      ...(current.flotation || {}),
      ...(partial.flotation || {})
    },
    filtration: {
      ...DEFAULT_ENGINEERING_CONTEXT.filtration,
      ...(current.filtration || {}),
      ...(partial.filtration || {})
    },
    classification: {
      ...DEFAULT_ENGINEERING_CONTEXT.classification,
      ...(current.classification || {}),
      ...(partial.classification || {})
    },
    driveAndHybrid: {
      ...DEFAULT_ENGINEERING_CONTEXT.driveAndHybrid,
      ...(current.driveAndHybrid || {}),
      ...(partial.driveAndHybrid || {})
    },
    processControl: {
      ...(current.processControl || {}),
      ...(partial.processControl || {})
    }
  };
}

/**
 * Persiste una actualización parcial en `sessionStorage` y `localStorage` (`smat_engineering_context_v1`).
 * Soporta tanto `saveEngineeringContextSnapshot({ flotation: {...} })` como
 * `saveEngineeringContextSnapshot('flotacion', { rotorDiameterM, ... })` (`D2-V41`).
 *
 * @param {any} circuitOrPartial
 * @param {any} [maybePayload]
 * @returns {any}
 */
export function saveEngineeringContextSnapshot(circuitOrPartial = {}, maybePayload = null) {
  const normalizedPartial = normalizeEngineeringContextInput(circuitOrPartial, maybePayload);
  const currentBase = loadEngineeringContextSnapshot();
  const merged = mergeEngineeringContext(normalizedPartial, currentBase || memoryContextFallback);
  memoryContextFallback = merged;
  try {
    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(merged);
      window.sessionStorage?.setItem(SMAT_ENGINEERING_CONTEXT_KEY, serialized);
      window.localStorage?.setItem(SMAT_ENGINEERING_CONTEXT_KEY, serialized);
    }
  } catch (_) {
    // Entorno sin WebStorage
  }
  return merged;
}

/**
 * Evalúa la hidrodinámica completa de celda de flotación acoplando la cinética de Gorain (1997)
 * ($S_b = 6J_g/d_{32}$, $k = P \cdot S_b \cdot R_f$) con el criterio de suspensión de Zwietering ($N_{js}$) (`D1-V39`).
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function evaluateFlotationCellHydrodynamics(params = {}) {
  const gorain = calculateFlotationGorainKineticRate(params);
  const rotorDiaM = Math.max(0.25, Math.min(1.5, Number(params.rotorDiaM ?? 0.61)));
  const rotorRpm = Math.max(100, Math.min(450, Number(params.rotorRpm ?? 215)));
  const d80Microns = Math.max(30, Math.min(600, Number(params.d80Microns ?? 150)));
  const solidsCwPct = Math.max(15, Math.min(65, Number(params.solidsCwPct ?? 35)));

  // Criterio de Zwietering N_js (RPM mínimas para suspensión completa de sulfuros)
  const zwieteringNjsRpm = Math.round(
    (142 * Math.pow(d80Microns / 150, 0.2) * Math.pow(solidsCwPct / 35, 0.13)) /
      Math.pow(rotorDiaM / 0.61, 0.85)
  );
  const suspensionSafe = rotorRpm >= zwieteringNjsRpm;
  const wearLifeMultiplierPuVsRubber = gorain.tipSpeedMS > 6.5 ? 2.1 : 1.7;

  return {
    ...gorain,
    rotorDiaM,
    rotorRpm,
    zwieteringNjsRpm,
    suspensionSafe,
    wearLifeMultiplierPuVsRubber,
    summaryEs: `Flujo Burbuja Sb = ${gorain.sbInverseSeconds} s⁻¹ | k = ${gorain.rateConstantMin} min⁻¹ | v_tip = ${gorain.tipSpeedMS} m/s | Suspensión N_js = ${zwieteringNjsRpm} RPM (${suspensionSafe ? 'Suspensión Completa' : 'Riesgo de Arenero'})`,
    summaryEn: `Bubble Flux Sb = ${gorain.sbInverseSeconds} s⁻¹ | k = ${gorain.rateConstantMin} min⁻¹ | v_tip = ${gorain.tipSpeedMS} m/s | Suspension N_js = ${zwieteringNjsRpm} RPM (${suspensionSafe ? 'Full Suspension' : 'Sanding Risk'})`
  };
}

/**
 * Evalúa la capacidad de ciclo de filtración Darcy-Ruth acoplada con el pandeo flexural de placas
 * de polipropileno Timoshenko y cumplimiento de humedad NOM-141 (`D2-V39`).
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function calculateFilterPressCycleCapacity(params = {}) {
  const plateEval = evaluateFilterPressPlateDeflection(params);
  const plateWidthMm = Number(params.plateWidthMm ?? 1200);
  const feedPressureBar = Math.max(4, Math.min(25, Number(params.feedPressureBar ?? 12)));
  const plateThicknessMm = Math.max(45, Math.min(110, Number(params.plateThicknessMm ?? 65)));
  const chamberCount = Math.max(10, Math.min(120, Number(params.chamberCount ?? (plateWidthMm >= 1500 ? 60 : 40))));

  // Tiempo de ciclo por ley parabólica Darcy-Ruth acoplada con desaguado capilar de humedad objetivo
  const moistureFactor = Math.pow(14.0 / Math.max(8, plateEval.cakeMoistureTargetPct), 0.35);
  const filtrationMinutes = Number(
    (18.0 * Math.pow(plateThicknessMm / 65, 1.6) * Math.pow(12 / feedPressureBar, 0.45) * moistureFactor).toFixed(1)
  );
  const mechanicalTurnaroundMin = 12.0;
  const totalCycleMin = Number((filtrationMinutes + mechanicalTurnaroundMin).toFixed(1));
  const cyclesPerDay = Math.max(8, Math.round((22.5 * 60) / totalCycleMin));
  const areaPerPlateM2 = Math.pow((plateWidthMm * 0.86) / 1000, 2) * 2;
  const dryTonnesPerDay = Math.round(
    cyclesPerDay * chamberCount * areaPerPlateM2 * (plateThicknessMm / 1000) * 0.5 * 1.85
  );

  const statusTagEs = plateEval.isPlateCrackingRisk
    ? 'Alerta: Desbloquear Puertos'
    : (!plateEval.nom141Compliant ? `Alerta NOM-141 (${plateEval.cakeMoistureTargetPct}% > 16%)` : 'NOM-141 Segura');
  const statusTagEn = plateEval.isPlateCrackingRisk
    ? 'Alert: Clear Feed Ports'
    : (!plateEval.nom141Compliant ? `NOM-141 Alert (${plateEval.cakeMoistureTargetPct}% > 16%)` : 'NOM-141 Compliant');

  return {
    ...plateEval,
    plateWidthMm,
    feedPressureBar,
    plateThicknessMm,
    filtrationMinutes,
    totalCycleMin,
    cyclesPerDay,
    dryTonnesPerDay,
    summaryEs: `Esfuerzo Placa σ_max = ${plateEval.maxBendingStressMpa} MPa (FS ${plateEval.flexuralSafetyFactor}) | ${cyclesPerDay} ciclos/día (~${dryTonnesPerDay} t/d secas) | Humedad ${plateEval.cakeMoistureTargetPct}% (${statusTagEs})`,
    summaryEn: `Plate Stress σ_max = ${plateEval.maxBendingStressMpa} MPa (SF ${plateEval.flexuralSafetyFactor}) | ${cyclesPerDay} cycles/day (~${dryTonnesPerDay} dry t/d) | Moisture ${plateEval.cakeMoistureTargetPct}% (${statusTagEn})`
  };
}

/**
 * Evalúa de forma unificada el Balance Metalúrgico de 3 Vasos Marcy ($\text{CC}\%$), el corte
 * hidrodinámico de Plitt ($d_{50c}$, riesgo de acordonamiento *roping*) y la partición Weibull
 * de mallas de uretano `TH48-30` (`D3-V39`).
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function evaluateHydrocycloneCutPoint(params = {}) {
  const balance = calculateThreeCupMarcyCycloneBalance(params);
  const d50cVal = Number(balance.d50cMicrons ?? balance.estimatedD50cMicrons ?? 58.4);
  const rmVal = Number(balance.solidsRecoveryPct ?? balance.massRecoveryUnderflowPct ?? 84.2);
  const ropEs = balance.regimeLabelEs ?? balance.ropingStatusEs ?? 'Descarga Normal';
  const ropEn = balance.regimeLabelEn ?? balance.ropingStatusEn ?? 'Normal Discharge';
  const screen = calculateUrethaneScreenPartitionWeibull({
    apertureMm: params.apertureMm ?? 0.5,
    reliefAngleDeg: params.reliefAngleDeg ?? 4.0,
    sharpnessAlpha: params.sharpnessAlpha ?? 4.4,
    feedParticleUm: d50cVal * 2.2
  });

  return {
    ...balance,
    screenWeibull: screen,
    cutPointD50cUm: d50cVal,
    sharpnessAlpha: screen.sharpnessAlpha,
    summaryEs: `3 Vasos Marcy: CC = ${balance.circulatingLoadPct}% (Rm = ${rmVal}%) | Corte d50c = ${d50cVal} µm (${ropEs}) | Criba Uretano α = ${screen.sharpnessAlpha}`,
    summaryEn: `3-Cup Marcy: CL = ${balance.circulatingLoadPct}% (Rm = ${rmVal}%) | Cut d50c = ${d50cVal} µm (${ropEn}) | Urethane Screen α = ${screen.sharpnessAlpha}`
  };
}

/**
 * Enlaza los controles interactivos de Flotación (Gorain), Filtración (Timoshenko),
 * Clasificación (3 Vasos Marcy + Plitt) y Tren Motriz / Rama D Híbrida dentro de `/cotizar/`.
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {(snapshot: any) => void} [onPhysicsUpdate]
 */
export function bindWizardCircuitCalculators(wizardRoot, onPhysicsUpdate = null) {
  if (!wizardRoot || typeof wizardRoot.querySelector !== 'function') return;

  const isEs = (wizardRoot.getAttribute?.('data-lang') || 'es') !== 'en';
  const savedCtx = loadEngineeringContextSnapshot();

  // 1. Hidratar valores iniciales desde `smat_engineering_context_v1` si existen
  const setInputVal = (selector, val) => {
    const el = wizardRoot.querySelector(selector);
    if (el && val !== undefined && val !== null) {
      el.value = String(val);
    }
  };

  if (savedCtx.flotation) {
    setInputVal('#wb-flot-jg', savedCtx.flotation.jgCmS);
    setInputVal('#wb-flot-d32', savedCtx.flotation.d32Mm);
    setInputVal('#wb-flot-rpm', savedCtx.flotation.rotorRpm);
    setInputVal('#wb-flot-rotor-dia', savedCtx.flotation.rotorDiaM);
  }
  if (savedCtx.filtration) {
    setInputVal('#wb-filt-pressure-bar', savedCtx.filtration.feedPressureBar);
    setInputVal('#wb-filt-clogged-ports', savedCtx.filtration.cloggedPortsCount);
    setInputVal('#wb-filt-thickness-mm', savedCtx.filtration.plateThicknessMm);
    setInputVal('#wb-filt-moisture-pct', savedCtx.filtration.cakeMoistureTargetPct);
  }
  if (savedCtx.classification) {
    setInputVal('#wb-cyc-sg-feed', savedCtx.classification.feedSg);
    setInputVal('#wb-cyc-sg-uf', savedCtx.classification.underflowSg);
    setInputVal('#wb-cyc-sg-of', savedCtx.classification.overflowSg);
    setInputVal('#wb-cyc-pressure-kpa', savedCtx.classification.feedPressureKpa);
    setInputVal('#wb-scr-aperture-mm', savedCtx.classification.apertureMm);
  }

  const recomputeAllCircuitPanels = () => {
    // A. Flotación Gorain + Zwietering
    const flotRes = evaluateFlotationCellHydrodynamics({
      jgCmS: Number(wizardRoot.querySelector('#wb-flot-jg')?.value ?? 1.5),
      d32Mm: Number(wizardRoot.querySelector('#wb-flot-d32')?.value ?? 1.6),
      rotorRpm: Number(wizardRoot.querySelector('#wb-flot-rpm')?.value ?? 215),
      rotorDiaM: Number(wizardRoot.querySelector('#wb-flot-rotor-dia')?.value ?? 0.61)
    });
    const elFlotSb = wizardRoot.querySelector('#wb-flot-res-sb');
    const elFlotK = wizardRoot.querySelector('#wb-flot-res-k');
    const elFlotNjs = wizardRoot.querySelector('#wb-flot-res-njs');
    const elFlotVtip = wizardRoot.querySelector('#wb-flot-res-vtip');
    if (elFlotSb) elFlotSb.textContent = `${flotRes.sbInverseSeconds} s⁻¹`;
    if (elFlotK) elFlotK.textContent = `${flotRes.rateConstantMin} min⁻¹`;
    if (elFlotNjs) elFlotNjs.textContent = `${flotRes.zwieteringNjsRpm} RPM`;
    if (elFlotVtip) elFlotVtip.textContent = `${flotRes.tipSpeedMS} m/s`;

    // B. Filtración Timoshenko + Darcy-Ruth
    const capSelectVal = Number(wizardRoot.querySelector('#wb-filt-capacity')?.value ?? 1500);
    const filtRes = calculateFilterPressCycleCapacity({
      plateWidthMm: capSelectVal || 1500,
      feedPressureBar: Number(wizardRoot.querySelector('#wb-filt-pressure-bar')?.value ?? 12),
      cloggedPortsCount: Number(wizardRoot.querySelector('#wb-filt-clogged-ports')?.value ?? 0),
      plateThicknessMm: Number(wizardRoot.querySelector('#wb-filt-thickness-mm')?.value ?? 65),
      cakeMoistureTargetPct: Number(wizardRoot.querySelector('#wb-filt-moisture-pct')?.value ?? 14)
    });
    const elFiltStress = wizardRoot.querySelector('#wb-filt-res-stress');
    const elFiltFs = wizardRoot.querySelector('#wb-filt-res-fs');
    const elFiltCycles = wizardRoot.querySelector('#wb-filt-res-cycles');
    const elFiltStatus = wizardRoot.querySelector('#wb-filt-res-status');
    if (elFiltStress) elFiltStress.textContent = `${filtRes.maxBendingStressMpa} MPa`;
    if (elFiltFs) elFiltFs.textContent = `FS ${filtRes.flexuralSafetyFactor}`;
    if (elFiltCycles) elFiltCycles.textContent = `${filtRes.cyclesPerDay} ciclos/d (${filtRes.dryTonnesPerDay} t/d)`;
    if (elFiltStatus) {
      elFiltStatus.textContent = filtRes.isPlateCrackingRisk
        ? isEs
          ? 'Alerta Puertos Obstruidos'
          : 'Clogged Ports Alert'
        : !filtRes.nom141Compliant
          ? isEs
            ? `Alerta NOM-141 (${filtRes.cakeMoistureTargetPct}% > 16%)`
            : `NOM-141 Alert (${filtRes.cakeMoistureTargetPct}% > 16%)`
          : isEs
            ? 'NOM-141 Segura'
            : 'NOM-141 Safe';
    }

    // Proyección de campos secundarios de Flotación y Filtración (V4.1 LCOM4=1)
    projectFlotationAndFiltrationTelemetry(wizardRoot, { flotRes, filtRes, isEs });

    // C. Clasificación 3 Vasos Marcy + Plitt + Weibull
    const cycSerieStr = String(wizardRoot.querySelector('#wb-cyc-series')?.value || '380');
    const cycRes = evaluateHydrocycloneCutPoint({
      feedSg: Number(wizardRoot.querySelector('#wb-cyc-sg-feed')?.value ?? 1.35),
      underflowSg: Number(wizardRoot.querySelector('#wb-cyc-sg-uf')?.value ?? 1.82),
      overflowSg: Number(wizardRoot.querySelector('#wb-cyc-sg-of')?.value ?? 1.15),
      feedPressureKpa: Number(wizardRoot.querySelector('#wb-cyc-pressure-kpa')?.value ?? 95),
      cycloneDiameterMm: Number(cycSerieStr) || 380,
      apertureMm: Number(wizardRoot.querySelector('#wb-scr-aperture-mm')?.value ?? 0.5)
    });
    const elCycCc = wizardRoot.querySelector('#wb-cyc-res-cc');
    const elCycD50 = wizardRoot.querySelector('#wb-cyc-res-d50');
    const elCycRoping = wizardRoot.querySelector('#wb-cyc-res-roping');
    const elScrWeibull = wizardRoot.querySelector('#wb-scr-res-weibull');
    if (elCycCc) elCycCc.textContent = `${cycRes.circulatingLoadPct}% (Rm ${cycRes.massRecoveryUnderflowPct}%)`;
    if (elCycD50) elCycD50.textContent = `${cycRes.cutPointD50cUm} µm`;
    if (elCycRoping) elCycRoping.textContent = isEs ? cycRes.ropingStatusEs : cycRes.ropingStatusEn;
    if (elScrWeibull) elScrWeibull.textContent = `α = ${cycRes.sharpnessAlpha} (${cycRes.screenWeibull.recommendedSkuId})`;

    // Proyección de Cw/Cv de los 3 Vasos Marcy, du/do y aceleración G de zaranda (V4.1)
    projectClassificationAndScreenTelemetry(wizardRoot, { cycRes, isEs });

    // D. Tren Motriz y Bastidor Contextual + Rama D Híbrida + Secuencia de Ensamble
    const pipeSeries = String(wizardRoot.querySelector('#wb-pipe-size')?.value || '6x4');
    const arrCode = String(wizardRoot.querySelector('#wb-drive-arrangement')?.value || 'CV');
    const motorRpm = Number(wizardRoot.querySelector('#wb-motor-rpm')?.value ?? 1775);
    const driverPulleyMm = Number(wizardRoot.querySelector('#wb-driver-pulley')?.value ?? 220);
    const drivenPulleyMm = Number(wizardRoot.querySelector('#wb-driven-pulley')?.value ?? 340);
    const motorPowerKw = Number(wizardRoot.querySelector('#wb-shaft-power')?.value ?? 55);
    const clearanceMm = Number(wizardRoot.querySelector('#wb-clearance-slider, #wb-throatbush-clearance')?.value ?? 0.8);
    const d80Val = Number(wizardRoot.querySelector('#slider-d80')?.value ?? 180);
    const seqPreset = String(wizardRoot.querySelector('#wb-assembly-sequence')?.value || 'canonical');

    const driveEval = calculateDriveAndBearingKinematics({
      arrangementCode: arrCode,
      motorRpm,
      driverPulleyMm,
      drivenPulleyMm,
      motorPowerKw,
      pipeSeries
    });
    const frameSelect = selectBearingFrameByPowerAndRpm(motorPowerKw, driveEval.pumpRpm, pipeSeries);
    const hybridEval = evaluateHybridWetEndConfiguration({
      d80Microns: d80Val,
      tipSpeedMs: driveEval.tipSpeedMs,
      pulpPh: Number(wizardRoot.querySelector('#slider-ph')?.value ?? 7.5),
      solidsWeightPercent: Number(wizardRoot.querySelector('#slider-solids')?.value ?? 45),
      pipeSeries
    });
    const clearanceEval = evaluateWetEndAssemblyInterference({
      frontClearanceMm: clearanceMm,
      d80Microns: d80Val,
      impellerTipSpeedMs: driveEval.tipSpeedMs,
      pipeSeries,
      sequencePreset: seqPreset
    });
    const assemblySeq = evaluatePumpAssemblySequence({
      frontClearanceMm: clearanceMm,
      impellerTorqueNm: 450,
      d80Microns: d80Val,
      impellerTipSpeedMs: driveEval.tipSpeedMs,
      pipeSeries,
      sequencePreset: seqPreset
    });

    const elFrameBadge = wizardRoot.querySelector('#wb-drive-frame-badge');
    const elDriveSummary = wizardRoot.querySelector('#wb-drive-contextual-metrics');
    if (elFrameBadge) {
      elFrameBadge.textContent = isEs ? driveEval.bearingFrameLabelEs : driveEval.bearingFrameLabelEn;
    }
    if (elDriveSummary) {
      elDriveSummary.textContent = isEs
        ? `Arreglo ${driveEval.arrangementCode} • n₂ = ${driveEval.pumpRpm} RPM • u₂ = ${driveEval.tipSpeedMs} m/s • F_r = ${driveEval.beltRadialLoadKn} kN • L₁₀ₕ = ${driveEval.bearingL10Hours.toLocaleString()} h`
        : `Arrangement ${driveEval.arrangementCode} • n₂ = ${driveEval.pumpRpm} RPM • u₂ = ${driveEval.tipSpeedMs} m/s • F_r = ${driveEval.beltRadialLoadKn} kN • L₁₀ₕ = ${driveEval.bearingL10Hours.toLocaleString()} h`;
    }

    projectPumpDriveAndHybridTelemetry(wizardRoot, {
      driveEval,
      frameSelect,
      hybridEval,
      clearanceEval,
      assemblySeq,
      isEs
    });

    const updatedSnapshot = saveEngineeringContextSnapshot({
      flotation: {
        jgCmS: flotRes.superficialGasVelocityCmS || Number(wizardRoot.querySelector('#wb-flot-jg')?.value ?? 1.5),
        d32Mm: flotRes.sauterBubbleDiaMm || Number(wizardRoot.querySelector('#wb-flot-d32')?.value ?? 1.6),
        rotorRpm: flotRes.rotorRpm,
        rotorDiaM: flotRes.rotorDiaM,
        sbInverseSeconds: flotRes.sbInverseSeconds,
        tipSpeedMS: flotRes.tipSpeedMS,
        rateConstantMin: flotRes.rateConstantMin,
        zwieteringNjsRpm: flotRes.zwieteringNjsRpm,
        suspensionSafe: flotRes.suspensionSafe,
        wearLifeMultiplierPuVsRubber: flotRes.wearLifeMultiplierPuVsRubber,
        tipSpeedWindowOptimal: flotRes.tipSpeedWindowOptimal,
        gorainCompliant: flotRes.gorainCompliant,
        summaryEs: flotRes.summaryEs,
        summaryEn: flotRes.summaryEn
      },
      filtration: {
        plateWidthMm: filtRes.plateWidthMm,
        feedPressureBar: filtRes.feedPressureBar,
        cloggedPortsCount: filtRes.cloggedPortsCount,
        plateThicknessMm: filtRes.plateThicknessMm,
        cakeMoistureTargetPct: filtRes.cakeMoistureTargetPct,
        maxBendingStressMpa: filtRes.maxBendingStressMpa,
        flexuralSafetyFactor: filtRes.flexuralSafetyFactor,
        filtrationMinutes: filtRes.filtrationMinutes,
        totalCycleMin: filtRes.totalCycleMin,
        cyclesPerDay: filtRes.cyclesPerDay,
        dryTonnesPerDay: filtRes.dryTonnesPerDay,
        deltaPAsymmetricMpa: filtRes.deltaPAsymmetricMpa,
        ppFatigueAllowableMpa: filtRes.ppFatigueAllowableMpa,
        recommendedPlateSkuId: filtRes.recommendedPlateSkuId,
        recommendedClothSkuId: filtRes.recommendedClothSkuId,
        isPlateCrackingRisk: filtRes.isPlateCrackingRisk,
        summaryEs: filtRes.summaryEs,
        summaryEn: filtRes.summaryEn
      },
      classification: {
        feedSg: cycRes.feedSg,
        underflowSg: cycRes.underflowSg,
        overflowSg: cycRes.overflowSg,
        feedPressureKpa: cycRes.feedPressureKpa,
        circulatingLoadPct: cycRes.circulatingLoadPct,
        cwFeedPct: cycRes.cwFeedPct,
        cwUnderflowPct: cycRes.cwUnderflowPct,
        cwOverflowPct: cycRes.cwOverflowPct,
        cvFeedPct: cycRes.cvFeedPct,
        cvOverflowPct: cycRes.cvOverflowPct,
        apexToVortexRatio: cycRes.apexToVortexRatio,
        cutPointD50cUm: cycRes.cutPointD50cUm,
        sharpnessAlpha: cycRes.sharpnessAlpha,
        isRopingRisk: cycRes.isRopingRisk,
        isUmbrellaDilute: cycRes.isUmbrellaDilute,
        summaryEs: cycRes.summaryEs,
        summaryEn: cycRes.summaryEn
      },
      driveAndHybrid: {
        arrangementCode: driveEval.arrangementCode,
        motorRpm: driveEval.motorRpm,
        driverPulleyMm: driveEval.driverPulleyMm,
        drivenPulleyMm: driveEval.drivenPulleyMm,
        motorPowerKw: driveEval.shaftPowerKw,
        pipeSeries,
        bearingFrameCode: driveEval.bearingFrameCode,
        bearingCartridgeCode: driveEval.bearingCartridgeCode,
        bearingL10Hours: driveEval.bearingL10Hours,
        beltRadialLoadKn: driveEval.beltRadialLoadKn,
        aIsoLabyrinthSmat: driveEval.aIsoLabyrinthSmat,
        aIsoContaminatedFelt: driveEval.aIsoContaminatedFelt,
        maxPowerKw: frameSelect.maxPowerKw,
        maxRpm: frameSelect.maxRpm,
        shaftDiameterMm: frameSelect.shaftDiameterMm,
        recommendedDynamicCkN: frameSelect.recommendedDynamicCkN,
        ceramicSafeTipSpeed: hybridEval.ceramicSafeTipSpeed,
        hybridMassSavingsPct: hybridEval.massSavingsPct,
        hybridSavedMassKg: hybridEval.savedMassKg,
        hybridSinglePumpMassKg: hybridEval.singlePumpMassKg,
        hybridFullMetalMassKg: hybridEval.fullMetalMassKg,
        hybridRationaleEs: hybridEval.rationaleEs,
        hybridRationaleEn: hybridEval.rationaleEn
      }
    });

    if (typeof onPhysicsUpdate === 'function') {
      onPhysicsUpdate(updatedSnapshot);
    }
    return updatedSnapshot;
  };

  const circuitInputs = wizardRoot.querySelectorAll('[data-wb-circuit-calc-input]');
  circuitInputs.forEach((inp) => {
    if (inp.getAttribute('data-calc-bound') === '1') return;
    inp.setAttribute('data-calc-bound', '1');
    inp.addEventListener('input', recomputeAllCircuitPanels);
    inp.addEventListener('change', recomputeAllCircuitPanels);
  });

  return recomputeAllCircuitPanels();
}
