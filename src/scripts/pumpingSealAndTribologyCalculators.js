// src/scripts/pumpingSealAndTribologyCalculators.js
// Calculadoras canónicas interactivas de Bombeo de Pulpa (D9-V43 y D10-V43):
// 1. Balance de Presión de Sellado Centrífugo Expeller (Rama 02A Seco vs 02B Prensaestopas Húmedo)
// 2. Selector Tribológico Finnie-Hutchings (5 Ramas de Material + Tenacidad K_Ic + Cavitación NPSHa)

import { selectOptimalMaterial, evaluateHybridWetEndConfiguration, WET_END_MATERIAL_KITS } from './tribologyAndCompatibilityEngine.js';
import { evaluatePumpAssemblySequence } from './pumpAssemblyAndDriveEngine.js';
import { saveEngineeringContextSnapshot } from './wizardCircuitPhysicsController.js';
import { commitVerticalSimulation } from './verticalStateAndCtaSyncBridge.js';

export const PUMPING_CALCULATOR_STATE = {
  version: '4.3.0',
  lastSealCalc: null,
  lastTribologyCalc: null,
  lastUpdatedIso: null,
};

function clampNum(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Evalúa el balance hidrodinámico de presiones en la cámara de sellado (Estación 02: Rama 02A vs 02B)
 * comparando la contrapresión centrífuga del Expeller + Anillo Expulsor frente a la carga positiva de succión.
 */
export function evaluateCentrifugalSealPressureBalance(params = {}) {
  const dischargeHeadM = clampNum(params.dischargeHeadM, 5, 110, 28);
  const suctionHeadM = clampNum(params.suctionHeadM, 0, 25, 3.2);
  const expellerDiaMm = clampNum(params.expellerDiaMm, 140, 520, 280);
  const pumpRpm = clampNum(params.pumpRpm, 400, 2200, 1150);
  const slurrySg = clampNum(params.slurrySg, 1.0, 2.3, 1.38);

  const g = 9.80665;
  const omegaRadS = (2 * Math.PI * pumpRpm) / 60;
  const rExpM = (expellerDiaMm / 1000) * 0.5;
  const rHubM = rExpM * 0.38;

  // Cabeza centrífuga generada por las paletas del Expeller secundario (vórtice forzado)
  const expellerCounterHeadM = Number(((0.62 * Math.pow(omegaRadS, 2) * (Math.pow(rExpM, 2) - Math.pow(rHubM, 2))) / (2 * g)).toFixed(2));
  const expellerCounterPressureKpa = Number((slurrySg * g * expellerCounterHeadM).toFixed(1));
  const suctionPressureKpa = Number((slurrySg * g * suctionHeadM).toFixed(1));
  const dischargePressureKpa = Number((slurrySg * g * dischargeHeadM).toFixed(1));
  const stuffingBoxResidualKpa = Number((suctionPressureKpa + 0.12 * dischargePressureKpa).toFixed(1));
  const netSealMarginKpa = Number((expellerCounterPressureKpa - stuffingBoxResidualKpa).toFixed(1));
  const suctionToDischargeRatio = Number((suctionHeadM / Math.max(1, dischargeHeadM)).toFixed(3));
  const requiredGlandWaterPressureKpa = Number((stuffingBoxResidualKpa + 70.0).toFixed(1));
  const requiredGlandWaterPressurePsi = Number((requiredGlandWaterPressureKpa * 0.145038).toFixed(1));

  const expellerViable = suctionToDischargeRatio <= 0.18 && netSealMarginKpa >= 5.0;
  const recommendedSealBranch = expellerViable ? 'expeller_dry' : 'gland_water';
  const recommendedStationCode = expellerViable ? '02A' : '02B';
  const recommendedSkuId = 'SMAT-SEAL-EXPELLER';

  const summaryEs = expellerViable
    ? `Rama 02A Viable (Sellado Seco Expeller • 0 L/min agua): Margen centrífugo positivo (+${netSealMarginKpa} kPa, Hs/Hd = ${(suctionToDischargeRatio * 100).toFixed(1)}% ≤ 18%). Contrapresión Expeller (${expellerCounterPressureKpa} kPa) supera la presión en caja de estopas (${stuffingBoxResidualKpa} kPa).`
    : `Rama 02B Requerida (Prensaestopas Húmedo Flush): Carga de succión elevada (Hs/Hd = ${(suctionToDischargeRatio * 100).toFixed(1)}%, margen ${netSealMarginKpa} kPa). Suministre agua de sello a ≥ ${requiredGlandWaterPressureKpa} kPa (${requiredGlandWaterPressurePsi} psi = P_caja + 10 psi) con Anillo Linterna 316 SS y Manga 420 SS.`;
  const summaryEn = expellerViable
    ? `Branch 02A Viable (Dry Expeller Seal • 0 GPM gland water): Positive centrifugal margin (+${netSealMarginKpa} kPa, Hs/Hd = ${(suctionToDischargeRatio * 100).toFixed(1)}% ≤ 18%). Expeller counter-pressure (${expellerCounterPressureKpa} kPa) exceeds stuffing box pressure (${stuffingBoxResidualKpa} kPa).`
    : `Branch 02B Required (Flushed Gland Packing): High positive suction head (Hs/Hd = ${(suctionToDischargeRatio * 100).toFixed(1)}%, margin ${netSealMarginKpa} kPa). Supply gland flush water at ≥ ${requiredGlandWaterPressureKpa} kPa (${requiredGlandWaterPressurePsi} psi = P_box + 10 psi) with 316 SS Lantern Ring & 420 SS Sleeve.`;

  const result = {
    dischargeHeadM,
    suctionHeadM,
    expellerDiaMm,
    pumpRpm,
    slurrySg,
    expellerCounterHeadM,
    expellerCounterPressureKpa,
    suctionPressureKpa,
    dischargePressureKpa,
    stuffingBoxResidualKpa,
    netSealMarginKpa,
    suctionToDischargeRatio,
    requiredGlandWaterPressureKpa,
    requiredGlandWaterPressurePsi,
    expellerViable,
    recommendedSealBranch,
    recommendedStationCode,
    recommendedSkuId,
    summaryEs,
    summaryEn,
  };

  PUMPING_CALCULATOR_STATE.lastSealCalc = result;
  PUMPING_CALCULATOR_STATE.lastUpdatedIso = new Date().toISOString();
  return result;
}

/**
 * Conecta de forma canónica la calculadora interactiva de Sellado Centrífugo (Estación 02: 02A vs 02B)
 * en `/bombeo/sello/` y `/en/pumping/seal/` (`D9-V43`).
 */
export function bindCanonicalSealBalanceCalculator(root, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  PUMPING_CALCULATOR_STATE.lastUpdatedIso = new Date().toISOString();

  const hdEl = root.querySelector('#seal-hd-m');
  const hsEl = root.querySelector('#seal-hs-m');
  const diaEl = root.querySelector('#seal-exp-dia');
  const rpmEl = root.querySelector('#seal-rpm');
  const sgEl = root.querySelector('#seal-sg');

  const pexpOut = root.querySelector('#seal-pexp-out');
  const pboxOut = root.querySelector('#seal-pbox-out');
  const pwaterOut = root.querySelector('#seal-pwater-out');
  const branchOut = root.querySelector('#seal-branch-out');
  const statusOut = root.querySelector('#seal-status-out');

  function recompute() {
    if (!hdEl || !hsEl) return null;
    const dischargeHeadM = Number(hdEl.value) || 28;
    const suctionHeadM = Number(hsEl.value) || 3.2;
    const expellerDiaMm = diaEl ? Number(diaEl.value) || 280 : 280;
    const pumpRpm = rpmEl ? Number(rpmEl.value) || 1150 : 1150;
    const slurrySg = sgEl ? Number(sgEl.value) || 1.38 : 1.38;

    const res = evaluateCentrifugalSealPressureBalance({
      dischargeHeadM,
      suctionHeadM,
      expellerDiaMm,
      pumpRpm,
      slurrySg,
    });

    if (pexpOut) pexpOut.textContent = `${res.expellerCounterPressureKpa} kPa`;
    if (pboxOut) pboxOut.textContent = `${res.stuffingBoxResidualKpa} kPa`;
    if (pwaterOut) {
      pwaterOut.textContent = res.expellerViable
        ? (isEn ? '0 L/min (Dry 02A)' : '0 L/min (Seco 02A)')
        : `≥ ${res.requiredGlandWaterPressureKpa} kPa (${res.requiredGlandWaterPressurePsi} psi)`;
    }
    if (branchOut) {
      branchOut.textContent = res.expellerViable
        ? (isEn ? '02A · Dry Expeller Seal' : '02A · Expeller Centrífugo Seco')
        : (isEn ? '02B · Flushed Gland Packing' : '02B · Prensaestopas Húmedo');
    }
    if (statusOut) {
      statusOut.textContent = isEn ? res.summaryEn : res.summaryEs;
      if (statusOut.style) {
        statusOut.style.background = res.expellerViable ? '#ecfdf5' : '#fffbeb';
        statusOut.style.color = res.expellerViable ? '#065f46' : '#92400e';
      }
    }

    const sealPayload = {
      sealBranch: res.recommendedSealBranch,
      seal_branch: res.recommendedSealBranch,
      sealStationCode: res.recommendedStationCode,
      dischargeHeadM,
      suctionHeadM,
      expellerDiaMm,
      pumpRpm,
      slurrySg,
      expellerCounterPressureKpa: res.expellerCounterPressureKpa,
      requiredGlandWaterPressureKpa: res.requiredGlandWaterPressureKpa,
    };
    saveEngineeringContextSnapshot('bombeo', sealPayload);
    commitVerticalSimulation('bombeo', sealPayload, {
      root,
      queryPatch: {
        seal_branch: res.recommendedSealBranch,
        hd_m: dischargeHeadM,
        hs_m: suctionHeadM,
        exp_dia: expellerDiaMm,
        n2_rpm: pumpRpm,
        sg: slurrySg,
      },
    });
    return res;
  }

  [hdEl, hsEl, diaEl, rpmEl, sgEl].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', recompute);
      el.addEventListener('change', recompute);
    }
  });

  return recompute();
}

/**
 * Conecta de forma canónica el selector tribológico Finnie-Hutchings + Tenacidad K_Ic + Despiece 5-5-4
 * en `/bombeo/impulsor/`, `/bombeo/revestimientos/`, `/en/pumping/impeller/` y `/en/pumping/liners/` (`D10-V43`).
 */
export function bindCanonicalTribologySelector(root, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';

  const d80El = root.querySelector('#trib-d80-um');
  const vtipEl = root.querySelector('#trib-vtip-ms');
  const phEl = root.querySelector('#trib-ph');
  const branchEl = root.querySelector('#trib-branch');
  const seriesEl = root.querySelector('#trib-series');

  const matOut = root.querySelector('#trib-mat-out');
  const kicOut = root.querySelector('#trib-kic-out');
  const archOut = root.querySelector('#trib-arch-out');
  const statusOut = root.querySelector('#trib-status-out');

  function recompute() {
    if (!d80El || !vtipEl) return null;
    const d80Microns = Number(d80El.value) || 450;
    const impellerTipSpeedMs = Number(vtipEl.value) || 22.5;
    const slurryPh = phEl ? Number(phEl.value) || 7.5 : 7.5;
    const selectedBranch = branchEl ? String(branchEl.value || 'auto') : 'auto';
    const pipeSeries = seriesEl ? String(seriesEl.value || '6x4') : '6x4';

    const matEval = selectOptimalMaterial(d80Microns, 45, slurryPh);
    const hybridEval = evaluateHybridWetEndConfiguration({
      d80Microns,
      tipSpeedMs: impellerTipSpeedMs,
      pulpPh: slurryPh,
      solidsWeightPercent: 45,
      pipeSeries,
    });

    const effectiveBranch = selectedBranch === 'auto'
      ? (matEval.materialKey === 'ceramica_sic'
        ? 'ceramica_sic'
        : (matEval.materialKey === 'hule_natural'
          ? 'rubber'
          : (matEval.materialKey === 'poliuretano' ? 'polyurethane' : 'metal')))
      : selectedBranch;

    const asmEval = evaluatePumpAssemblySequence({
      wetEndBranch: effectiveBranch,
      d80Microns,
      impellerTipSpeedMs,
      pipeSeries,
      frontClearanceMm: 0.75,
    });

    if (matOut) {
      matOut.textContent = effectiveBranch === 'hibrido_a05_r55'
        ? (isEn ? 'Hybrid Branch D: A05 Impeller + R55 Liners' : 'Rama D Híbrida: Impulsor A05 + Forros R55')
        : (isEn ? matEval.nameEn : matEval.nameEs);
    }
    if (kicOut) {
      kicOut.textContent = `${asmEval.fractureToughnessMpaSqrtM} MPa·√m`;
    }
    if (archOut) {
      archOut.textContent = `${asmEval.totalAssemblyMassKg} kg · ${asmEval.nioshHoistPartsCount} NIOSH ≥ 23 kg (${asmEval.pipeSeries})`;
    }
    const resolvedMaterialKey = effectiveBranch === 'hibrido_a05_r55'
      ? 'hybrid_a05_r55'
      : (matEval.materialKey || 'alto_cromo_cr27');
    const kitSpec = WET_END_MATERIAL_KITS[resolvedMaterialKey] || WET_END_MATERIAL_KITS.alto_cromo_cr27;
    const kitDuty = kitSpec
      ? (isEn ? kitSpec.dutyApplicationEn : kitSpec.dutyApplicationEs)
      : '';
    const kicTag = asmEval.spallingRiskDetected
      ? (isEn ? 'Spalling Risk!' : '¡Riesgo Spalling!')
      : (isEn ? 'Toughness OK' : 'Tenacidad OK');

    if (statusOut) {
      const reason = isEn ? asmEval.structuralReasonEn : asmEval.structuralReasonEs;
      const warn = isEn ? asmEval.spallingWarningEn : asmEval.spallingWarningEs;
      statusOut.textContent = `${kicTag} | ${reason} | ${warn}${kitDuty ? ' | ' + kitDuty : ''}`;
      if (statusOut.style) {
        statusOut.style.background = asmEval.spallingRiskDetected ? '#fef2f2' : '#ecfdf5';
        statusOut.style.color = asmEval.spallingRiskDetected ? '#991b1b' : '#065f46';
      }
    }

    const combined = {
      ...matEval,
      ...hybridEval,
      ...asmEval,
      materialKey: resolvedMaterialKey,
      d80Microns,
      impellerTipSpeedMs,
      slurryPh,
      effectiveBranch,
      pipeSeries,
    };
    PUMPING_CALCULATOR_STATE.lastTribologyCalc = combined;
    PUMPING_CALCULATOR_STATE.lastUpdatedIso = new Date().toISOString();
    saveEngineeringContextSnapshot('bombeo', combined);
    commitVerticalSimulation('bombeo', combined, {
      root,
      queryPatch: {
        material: resolvedMaterialKey,
        d80: d80Microns,
        u2_ms: impellerTipSpeedMs,
        ph: slurryPh,
        serie: pipeSeries,
      },
    });
    return combined;
  }

  [d80El, vtipEl, phEl, branchEl, seriesEl].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', recompute);
      el.addEventListener('change', recompute);
    }
  });

  return recompute();
}
