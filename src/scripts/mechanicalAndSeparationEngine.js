/**
 * mechanicalAndSeparationEngine.js
 * ---------------------------------------------------------------------------
 * Costura Modular LCOM4 (∂(C) = 0, D8 / SLICE-FC-12) para Cribado Fino en Uretano
 * (TH48-30, Weibull α ≥ 4.2, ARB-SMAT-29), Cinética de Flotación JKMRC (Gorain 1997,
 * ARB-SMAT-30) y Acoplamiento Hidrociclón-Prensa.
 */

import {
  calculateThreeCupMarcyCycloneBalance,
  evaluateFilterPressPlateDeflection
} from './slurryEngine.js';

/**
 * Calcula la curva de partición de Whiten/Weibull y la dilatación elástica anti-cegamiento
 * para mallas finas de uretano TH48-30 y paneles modulares 1'x1' (Avenida 3).
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function calculateUrethaneScreenPartitionWeibull(params = {}) {
  const apertureMm = Math.max(0.15, Math.min(25.0, Number(params.apertureMm ?? 0.50)));
  const reliefAngleDeg = Math.max(1.5, Math.min(8.0, Number(params.reliefAngleDeg ?? 4.0)));
  const vibrationG = Math.max(2.0, Math.min(7.0, Number(params.vibrationG ?? 4.5)));
  const sharpnessAlpha = Math.max(2.5, Math.min(8.0, Number(params.sharpnessAlpha ?? 4.4)));
  const feedParticleUm = Math.max(20, Math.min(5000, Number(params.feedParticleUm ?? 420)));

  const d50Um = apertureMm * 1000;
  const ratio = feedParticleUm / d50Um;
  const expTerm = Math.exp(sharpnessAlpha * (1 - ratio));
  const partitionToOversizePct = Number(((100 / (1 + expTerm))).toFixed(2));
  const elasticDilationPct = Number(((vibrationG * 0.68) * (reliefAngleDeg / 4.0)).toFixed(2));

  return {
    apertureMm,
    reliefAngleDeg,
    vibrationG,
    sharpnessAlpha,
    d50Um,
    partitionToOversizePct,
    elasticDilationPct,
    antiBlindingCompliant: reliefAngleDeg >= 3.0 && reliefAngleDeg <= 5.5 && sharpnessAlpha >= 4.2,
    recommendedSkuId: apertureMm <= 1.5 ? 'SMAT-SCR-TH48-30' : 'SMAT-SCR-MOD-1X1'
  };
}

/**
 * Calcula la constante cinética de flotación de primer orden k = P * S_b * R_f (Gorain 1997)
 * y el vector de línea base hidrodinámica Anti-Morita [I_motor, u_rotor, S_b >= 50 s^-1].
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function calculateFlotationGorainKineticRate(params = {}) {
  const superficialGasVelocityCmS = Math.max(0.5, Math.min(3.5, Number(params.jgCmS ?? 1.5)));
  const sauterBubbleDiaMm = Math.max(0.8, Math.min(3.0, Number(params.d32Mm ?? 1.6)));
  const rotorDiameterM = Math.max(0.25, Math.min(1.5, Number(params.rotorDiaM ?? 0.61)));
  const rotorRpm = Math.max(100, Math.min(450, Number(params.rotorRpm ?? 215)));
  const floatabilityFactorP = Math.max(0.0001, Math.min(0.02, Number(params.floatabilityP ?? params.pFloatability ?? 0.0045)));
  const frothRecoveryRf = Math.max(0.2, Math.min(1.0, Number(params.frothRecoveryRf ?? params.frothRecovery ?? 0.78)));

  // S_b = 6 * J_g / d_32 (con J_g en cm/s y d_32 en cm -> 60 * J_g_cm_s / d32_mm)
  const sbInverseSeconds = Number(((60 * superficialGasVelocityCmS) / sauterBubbleDiaMm).toFixed(2));
  const tipSpeedMS = Number((Math.PI * rotorDiameterM * (rotorRpm / 60)).toFixed(2));
  const rateConstantMin = Number((floatabilityFactorP * sbInverseSeconds * frothRecoveryRf * 60).toFixed(3));

  return {
    sbInverseSeconds,
    tipSpeedMS,
    rateConstantMin,
    floatabilityP: Number(floatabilityFactorP.toFixed(5)),
    frothRecoveryRf: Number(frothRecoveryRf.toFixed(3)),
    gorainCompliant: sbInverseSeconds >= 50.0,
    tipSpeedWindowOptimal: tipSpeedMS >= 6.0 && tipSpeedMS <= 7.8,
    recommendedSkuId: 'SMAT-FLOT-MECH-18SP'
  };
}

/**
 * Evaluacion hidro-cinetica completa de celda de flotacion (Gorain + Zwietering N_js).
 * Consolidada desde wizardCircuitPhysicsController.js (D4-V55).
 */
export function evaluateFlotationCellHydrodynamics(params = {}) {
  const gorain = calculateFlotationGorainKineticRate(params);
  const rotorDiaM = Math.max(0.25, Math.min(1.5, Number(params.rotorDiaM ?? 0.61)));
  const rotorRpm = Math.max(100, Math.min(450, Number(params.rotorRpm ?? 215)));
  const d80Microns = Math.max(30, Math.min(600, Number(params.d80Microns ?? 150)));
  const solidsCwPct = Math.max(15, Math.min(65, Number(params.solidsCwPct ?? 35)));

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
 * Capacidad de ciclo Darcy-Ruth acoplada con pandeo flexural Timoshenko y NOM-141.
 */
export function calculateFilterPressCycleCapacity(params = {}) {
  const plateEval = evaluateFilterPressPlateDeflection(params);
  const plateWidthMm = Number(params.plateWidthMm ?? 1200);
  const feedPressureBar = Math.max(4, Math.min(25, Number(params.feedPressureBar ?? 12)));
  const plateThicknessMm = Math.max(45, Math.min(110, Number(params.plateThicknessMm ?? 65)));
  const chamberCount = Math.max(10, Math.min(120, Number(params.chamberCount ?? (plateWidthMm >= 1500 ? 60 : 40))));

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
 * Evaluacion unificada de 3 Vasos Marcy, corte hidrodinamico Plitt (d50c) y criba Weibull.
 */
export function evaluateHydrocycloneCutPoint(params = {}) {
  const balance = calculateThreeCupMarcyCycloneBalance(params);
  const d50cVal = Number(balance.d50cMicrons ?? 133);
  const rmVal = Number(balance.solidsRecoveryPct ?? 72.2);
  const ropEs = balance.regimeLabelEs ?? 'Descarga Semi-Paraguas Óptima';
  const ropEn = balance.regimeLabelEn ?? 'Optimal Semi-Umbrella Discharge';
  const screen = calculateUrethaneScreenPartitionWeibull({
    apertureMm: params.apertureMm ?? 0.5,
    reliefAngleDeg: params.reliefAngleDeg ?? 4.0,
    vibrationG: params.vibrationG ?? 4.5,
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

