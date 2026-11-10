/**
 * mechanicalAndSeparationEngine.js
 * ---------------------------------------------------------------------------
 * Costura Modular LCOM4 (∂(C) = 0, D8 / SLICE-FC-12) para Cribado Fino en Uretano
 * (TH48-30, Weibull α ≥ 4.2, ARB-SMAT-29), Cinética de Flotación JKMRC (Gorain 1997,
 * ARB-SMAT-30) y Acoplamiento Hidrociclón-Prensa.
 */

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
    recommendedSkuId: apertureMm <= 1.5 ? 'SKU-QC-13' : 'SKU-QC-09'
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
  const floatabilityFactorP = Math.max(0.0001, Math.min(0.02, Number(params.floatabilityP ?? 0.0045)));
  const frothRecoveryRf = Math.max(0.2, Math.min(1.0, Number(params.frothRecoveryRf ?? 0.78)));

  // S_b = 6 * J_g / d_32 (con J_g en cm/s y d_32 en cm -> 60 * J_g_cm_s / d32_mm)
  const sbInverseSeconds = Number(((60 * superficialGasVelocityCmS) / sauterBubbleDiaMm).toFixed(2));
  const tipSpeedMS = Number((Math.PI * rotorDiameterM * (rotorRpm / 60)).toFixed(2));
  const rateConstantMin = Number((floatabilityFactorP * sbInverseSeconds * frothRecoveryRf * 60).toFixed(3));

  return {
    sbInverseSeconds,
    tipSpeedMS,
    rateConstantMin,
    gorainCompliant: sbInverseSeconds >= 50.0,
    tipSpeedWindowOptimal: tipSpeedMS >= 6.0 && tipSpeedMS <= 7.8,
    recommendedSkuId: 'SKU-QC-14'
  };
}

