/**
 * wizardXdsmDagSolver.js
 * ---------------------------------------------------------------------------
 * Núcleo Multidisciplinario DAG / XDSM Puro (Costura LCOM4 C2, D3-V50 / D5-V50,
 * Martins & Lambe 2013 DOI: 10.1007/s00158-012-0763-y, Saltelli Sobol 2013).
 *
 * REGLAS ESTRICTAS (Zero-DOM + Zero-Network):
 * 1. Prohibido acceder a APIs globales del navegador o almacenamiento de sesión (Zero-DOM estricto).
 * 2. Ejecución topológica acíclica XDSM en < 2 ms:
 *    Altitud [0..5000] -> Hidráulica/Durand -> Tribología/Híbrido/Secuencia ->
 *    Acoplamiento Desgaste->JRP -> Cinemática/Sellado -> Subcircuitos (Flotación/
 *    Filtración/Ciclón+Criba/Metrología) -> Compuerta de Plausibilidad -> ERP.
 */

import { validateSchemaPayload } from './engineSchemaRegistry.js';
import {
  calculateFlotationGorainKineticRate,
  calculateUrethaneScreenPartitionWeibull
} from './mechanicalAndSeparationEngine.js';
import {
  calculateDriveAndBearingKinematics,
  calculateDriveKinematics,
  DRIVE_ARRANGEMENTS,
  evaluateHybridWetEndConfiguration,
  evaluatePumpAssemblySequence,
  evaluateWetEndAssemblyInterference,
  selectBearingFrameByPowerAndRpm
} from './pumpAssemblyAndDriveEngine.js';
import { evaluateCentrifugalSealPressureBalance } from './pumpingSealAndTribologyCalculators.js';
import {
  calculateCoupledReorderWindowDays,
  computeCmuPriorityDescriptor,
  evaluateBearingCartridgeCoreTradeIn
} from './requisitionTrayBus.js';
import {
  buildAcuseUrlParams,
  buildLeadWebhookPayload,
  formatSapTsv,
  parseSmatPartCode
} from './sapAndLeadExportEngine.js';
import {
  calculateAltitudeCorrection,
  calculateSlurryMetrics,
  calculateThreeCupMarcyCycloneBalance,
  evaluateFilterPressPlateDeflection,
  resolvePipeDiameterMm,
  validatePlantLeadInput
} from './slurryEngine.js';
import {
  calculateGyMinimumSampleMass,
  calculateMarcyScaleReading,
  recommendAstmSieveSeries,
  selectOptimalMaterial,
  WET_END_MATERIAL_MATRIX
} from './tribologyAndCompatibilityEngine.js';

export const XDSM_DISCIPLINE_ORDER = Object.freeze([
  '1_pumping_hydraulics',
  '2_seal_drive_kinematics',
  '3_tribology_hybrid_assembly',
  '4_jrp_wear_coupling',
  '5_circuit_submodels',
  '6_metrology_lab',
  '7_plausibility_and_erp_export'
]);

/**
 * Manifiesto Topológico Explícito del Grafo MDAO/XDSM (Martins & Lambe 2013).
 * Registra dependencias exactas `consumes` -> `produces` entre las 7 disciplinas.
 */
export const XDSM_DISCIPLINE_GRAPH = Object.freeze([
  {
    step: 1,
    id: '1_pumping_hydraulics',
    domain: 'pumping',
    consumes: ['flowM3H', 'solidsWeightPercent', 'particleSizeD80Microns', 'solidsSpecificGravity', 'pipeSeries', 'altitudeM', 'pH', 'stressSymptom'],
    produces: ['slurryEval.results', 'altitudeEval', 'sensitivity.sobolDominantDriver']
  },
  {
    step: 2,
    id: '2_seal_drive_kinematics',
    domain: 'sealDrive',
    consumes: ['dischargeHeadM', 'suctionHeadM', 'expellerDiaMm', 'pumpRpm', 'slurrySg', 'arrangementCode', 'motorRpm', 'driverPulleyMm', 'drivenPulleyMm', 'motorPowerKw', 'slurryEval.results.slurrySpecificGravity'],
    produces: ['driveEval', 'frameEval', 'sealBalanceEval', 'derivedTorqueNm']
  },
  {
    step: 3,
    id: '3_tribology_hybrid_assembly',
    domain: 'tribology',
    consumes: ['tribologyMaterial', 'frontClearanceMm', 'particleSizeD80Microns', 'pulpPh', 'driveEval.tipSpeedMs', 'derivedTorqueNm', 'assemblySequence', 'attemptedStationOrder'],
    produces: ['optimalMaterial', 'hybridEval', 'interferenceEval', 'assemblySeqEval']
  },
  {
    step: 4,
    id: '4_jrp_wear_coupling',
    domain: 'jrp',
    consumes: ['slurryEval.results.estimatedImpellerLifeHours', 'predictedWearHours', 'operatingHoursPerDay', 'criticalityMode', 'coreReturnEnabled', 'urgency', 'trayItems', 'driveEval.tipSpeedMs'],
    produces: ['reorderEval', 'tradeInEval', 'cmuDescriptor']
  },
  {
    step: 5,
    id: '5_circuit_submodels',
    domain: 'flotation+filtration+cycloneScreen',
    consumes: ['jgCmS', 'd32Mm', 'rotorDiaM', 'rotorRpm', 'floatabilityP', 'frothRecoveryRf', 'plateWidthMm', 'feedPressureBar', 'cloggedPortsCount', 'plateThicknessMm', 'cakeMoistureTargetPct', 'feedSg', 'underflowSg', 'overflowSg', 'apertureMm'],
    produces: ['flotationEval', 'filtrationEval', 'cycloneScreenEval']
  },
  {
    step: 6,
    id: '6_metrology_lab',
    domain: 'metrology',
    consumes: ['marcyMode', 'solidsSpecificGravity', 'measuredSpGr', 'solidsWeightPercent', 'topSizeMm', 'liberationSizeMicrons', 'oreGradeDecimal', 'samplingConstantC', 'targetRelativeStdError', 'targetP80Microns', 'rosinRammlerSlopeN', 'retainedPercentAtP80'],
    produces: ['marcyEval', 'gyEval', 'sieveEval']
  },
  {
    step: 7,
    id: '7_plausibility_and_erp_export',
    domain: 'erpExport',
    consumes: ['slurryEval', 'tribology', 'assemblySeqEval', 'reorderEval', 'cmuDescriptor', 'quantity', 'placa_ref', 'logistics_mode', 'delivery_destination'],
    produces: ['leadValidation', 'parsedPart', 'erpBundle']
  }
]);

/**
 * Resuelve el grafo multidisciplinario XDSM completo en una sola pasada determinista sin DOM.
 *
 * @param {Record<string, any>} [rawState={}]
 * @returns {Record<string, any>}
 */
export function solveXdsmMultidisciplinaryDag(rawState = {}) {
  const s = rawState || {};
  const pCheck = validateSchemaPayload('pumping', s);
  const pumpIn = pCheck.normalized;

  const pipeSeries = String(s.pipeSeries || pumpIn.pipeSeries || '6x4');
  const pipeDiameterMm = resolvePipeDiameterMm(pipeSeries);
  const altData = calculateAltitudeCorrection(pumpIn.altitudeM);

  const slurryEval = calculateSlurryMetrics({
    flowM3H: pumpIn.flowM3H,
    solidsWeightPercent: pumpIn.solidsWeightPercent,
    particleSizeD80Microns: pumpIn.particleSizeD80Microns,
    solidsSpecificGravity: pumpIn.solidsSpecificGravity,
    pipeDiameterMm,
    pipeSeries,
    altitudeM: pumpIn.altitudeM,
    pH: pumpIn.pH,
    stressSymptom: pumpIn.stressSymptom
  });
  const simRes = slurryEval.results || {};

  // 2. Sellado y Cinemática (con reconciliación de exports canónicos)
  const sealCheck = validateSchemaPayload('sealDrive', s);
  const sealIn = sealCheck.normalized;
  const arrangementCount = Object.keys(DRIVE_ARRANGEMENTS || {}).length;
  const driveEval = calculateDriveAndBearingKinematics({
    arrangement: sealIn.arrangementCode,
    arrangementCode: sealIn.arrangementCode,
    motorRpm: sealIn.motorRpm,
    driverPulleyMm: sealIn.driverPulleyMm,
    drivenPulleyMm: sealIn.drivenPulleyMm,
    shaftPowerKw: sealIn.motorPowerKw,
    motorPowerKw: sealIn.motorPowerKw,
    impellerDiameterMm: Number(s.impellerDiameterMm) || 380,
    wetEndMaterial: s.tribologyMaterial || simRes.recommendedMaterialKey || 'alto_cromo_cr27',
    pipeSeries
  });
  const frameEval = selectBearingFrameByPowerAndRpm(sealIn.motorPowerKw, driveEval.pumpRpm, pipeSeries);
  const sealBalanceEval = evaluateCentrifugalSealPressureBalance({
    dischargeHeadM: sealIn.dischargeHeadM,
    suctionHeadM: sealIn.suctionHeadM,
    expellerDiaMm: sealIn.expellerDiaMm,
    pumpRpm: sealIn.pumpRpm || driveEval.pumpRpm,
    slurrySg: sealIn.slurrySg || simRes.slurrySpecificGravity
  });

  // 3. Tribología, Rama D Híbrida y Secuencia de Ensamble S1..S5
  const tribCheck = validateSchemaPayload('tribology', {
    ...s,
    particleSizeD80Microns: pumpIn.particleSizeD80Microns,
    pulpPh: pumpIn.pH,
    tipSpeedMs: driveEval.tipSpeedMs,
    solidsWeightPercent: pumpIn.solidsWeightPercent,
    pipeSeries
  });
  const tribIn = tribCheck.normalized;
  const optimalMaterial = selectOptimalMaterial(
    tribIn.particleSizeD80Microns,
    tribIn.solidsWeightPercent,
    tribIn.pulpPh
  );
  const matKey = String(tribIn.tribologyMaterial || optimalMaterial.materialKey || 'alto_cromo_cr27');
  const matMeta = WET_END_MATERIAL_MATRIX[matKey] || WET_END_MATERIAL_MATRIX.alto_cromo_cr27 || {};
  const wetBranch = matKey === 'hybrid_a05_r55'
    ? 'hibrido_a05_r55'
    : (matKey === 'hule_natural' ? 'rubber' : (matKey === 'poliuretano' ? 'polyurethane' : (matKey === 'ceramica_sic' ? 'ceramic_sic' : 'metal')));

  const hybridEval = evaluateHybridWetEndConfiguration({
    d80Microns: tribIn.particleSizeD80Microns,
    tipSpeedMs: driveEval.tipSpeedMs,
    pulpPh: tribIn.pulpPh,
    solidsWeightPercent: tribIn.solidsWeightPercent,
    pipeSeries
  });
  const derivedTorqueNm = Number(((sealIn.motorPowerKw * 9549.2966) / Math.max(100, driveEval.pumpRpm)).toFixed(1));
  const impellerTorqueNm = Number(s.impellerTorqueNm ?? tribIn.impellerTorqueNm ?? derivedTorqueNm);
  const attemptedStationOrder = Array.isArray(s.attemptedStationOrder)
    ? s.attemptedStationOrder
    : (Array.isArray(tribIn.attemptedStationOrder) && tribIn.attemptedStationOrder.length ? tribIn.attemptedStationOrder : undefined);

  const interferenceEval = evaluateWetEndAssemblyInterference({
    wetEndBranch: wetBranch,
    sealBranch: sealBalanceEval.recommendedSealBranch || 'expeller_dry',
    frontClearanceMm: tribIn.frontClearanceMm,
    impellerExitWidthMm: Number(s.impellerExitWidthMm) || 48,
    pipeSeries,
    sequencePreset: tribIn.assemblySequence
  });
  const assemblySeqEval = evaluatePumpAssemblySequence({
    wetEndBranch: wetBranch,
    frontClearanceMm: tribIn.frontClearanceMm,
    impellerTorqueNm,
    d80Microns: tribIn.particleSizeD80Microns,
    impellerTipSpeedMs: driveEval.tipSpeedMs,
    pipeSeries,
    sequencePreset: tribIn.assemblySequence,
    attemptedStationOrder
  });

  // 4. Acoplamiento automático Desgaste predicho -> Ventana Armónica JRP (s, S)
  const jrpCheck = validateSchemaPayload('jrp', s);
  const jrpIn = jrpCheck.normalized;
  const trayItems = Array.isArray(jrpIn.trayItems) && jrpIn.trayItems.length
    ? jrpIn.trayItems
    : (Array.isArray(s.trayItems) ? s.trayItems : []);
  const coupledWearHours = Number(s.predictedWearHours) || simRes.estimatedImpellerLifeHours || jrpIn.predictedWearHours;
  const reorderEval = calculateCoupledReorderWindowDays({
    sg: simRes.slurrySpecificGravity,
    d50Um: pumpIn.particleSizeD80Microns,
    tipSpeedMs: driveEval.tipSpeedMs,
    predictedWearHours: coupledWearHours,
    operatingHoursPerDay: jrpIn.operatingHoursPerDay,
    criticalityMode: jrpIn.criticalityMode,
    materialKey: matKey
  });
  const tradeInEval = evaluateBearingCartridgeCoreTradeIn(
    { items: trayItems, coreReturnEnabled: jrpIn.coreReturnEnabled },
    jrpIn.coreReturnEnabled
  );

  // 5. Sub-circuitos Proceso: Flotación (con P y R_f), Filtración, Ciclón + Criba (10+ params + cvUnderflow)
  const flotIn = validateSchemaPayload('flotation', s).normalized;
  const gorainEval = calculateFlotationGorainKineticRate({
    jgCmS: flotIn.jgCmS,
    d32Mm: flotIn.d32Mm,
    rotorDiaM: flotIn.rotorDiaM,
    rotorRpm: flotIn.rotorRpm,
    floatabilityP: flotIn.floatabilityP,
    frothRecoveryRf: flotIn.frothRecoveryRf
  });
  const zwieteringNjsRpm = Math.round(
    (142 * Math.pow(flotIn.d80Microns / 150, 0.2) * Math.pow(flotIn.solidsWeightPercent / 35, 0.13)) /
    Math.pow(flotIn.rotorDiaM / 0.61, 0.85)
  );
  const flotationEval = {
    ...gorainEval,
    floatabilityP: flotIn.floatabilityP,
    frothRecoveryRf: flotIn.frothRecoveryRf,
    rotorDiaM: flotIn.rotorDiaM,
    rotorRpm: flotIn.rotorRpm,
    zwieteringNjsRpm,
    suspensionSafe: flotIn.rotorRpm >= zwieteringNjsRpm,
    wearLifeMultiplierPuVsRubber: gorainEval.tipSpeedMS > 6.5 ? 2.1 : 1.7
  };

  const filtIn = validateSchemaPayload('filtration', s).normalized;
  const filtPlate = evaluateFilterPressPlateDeflection(filtIn);
  const chamberCount = filtIn.plateWidthMm >= 1500 ? 60 : 40;
  const moistureFactor = Math.pow(14.0 / Math.max(8, filtPlate.cakeMoistureTargetPct), 0.35);
  const filtrationMinutes = Number((18.0 * Math.pow(filtIn.plateThicknessMm / 65, 1.6) * Math.pow(12 / filtIn.feedPressureBar, 0.45) * moistureFactor).toFixed(1));
  const totalCycleMin = Number((filtrationMinutes + 12.0).toFixed(1));
  const cyclesPerDay = Math.max(8, Math.round((22.5 * 60) / totalCycleMin));
  const dryTonnesPerDay = Math.round(cyclesPerDay * chamberCount * Math.pow((filtIn.plateWidthMm * 0.86) / 1000, 2) * 2 * (filtIn.plateThicknessMm / 1000) * 0.5 * 1.85);
  const filtrationEval = { ...filtPlate, filtrationMinutes, totalCycleMin, cyclesPerDay, dryTonnesPerDay };

  const cycIn = validateSchemaPayload('cycloneScreen', s).normalized;
  const cycBalance = calculateThreeCupMarcyCycloneBalance({
    feedSg: cycIn.feedSg,
    underflowSg: cycIn.underflowSg,
    overflowSg: cycIn.overflowSg,
    solidsSg: cycIn.solidsSg,
    apexDiameterMm: cycIn.apexDiameterMm,
    vortexDiameterMm: cycIn.vortexDiameterMm,
    feedPressureKpa: cycIn.feedPressureKpa,
    cycloneDiameterMm: cycIn.cycloneDiameterMm
  });
  const screenWeibull = calculateUrethaneScreenPartitionWeibull({
    apertureMm: cycIn.apertureMm,
    reliefAngleDeg: cycIn.reliefAngleDeg,
    vibrationG: cycIn.vibrationG,
    sharpnessAlpha: cycIn.sharpnessAlpha,
    feedParticleUm: cycBalance.d50cMicrons * 2.2
  });
  const cycloneScreenEval = { ...cycBalance, screenWeibull };

  // 6. Metrología de Laboratorio (Marcy 3 modos + Pierre Gy + ASTM E11)
  const metIn = validateSchemaPayload('metrology', s).normalized;
  const marcyEval = calculateMarcyScaleReading({
    solidsSpecificGravity: metIn.solidsSpecificGravity,
    solidsWeightPercent: metIn.solidsWeightPercent ?? pumpIn.solidsWeightPercent,
    pulpDensityKgL: metIn.measuredSpGr,
    solveFor: metIn.marcyMode === 'cw_pct' || metIn.marcyMode === 'cw' ? 'sm' : metIn.marcyMode
  });
  const gyEval = calculateGyMinimumSampleMass({
    topSizeD95Mm: metIn.topSizeMm,
    liberationSizeMicrons: metIn.liberationSizeMicrons ?? (Number(s.liberationSizeMicrons) || 100),
    oreGradeDecimal: metIn.oreGradeDecimal ?? (Number(s.oreGradeDecimal) || 0.05),
    samplingConstantC: metIn.samplingConstantC ?? (metIn.liberationFactorBeta || 0.5) * (metIn.mineralogicalFactorM || 20) * 0.16,
    targetRelativeStdError: metIn.targetRelativeStdError ?? 0.05,
    airPressurePsi: metIn.airPressurePsi ?? 90,
    solidsSpecificGravity: marcyEval.solidsSpecificGravity ?? metIn.solidsSpecificGravity,
    solidsWeightPercent: marcyEval.solidsWeightPercent
  });
  const sieveEvalRaw = recommendAstmSieveSeries({
    targetP80Microns: metIn.targetP80Microns,
    topSizeD95Mm: metIn.topSizeMm,
    rosinRammlerSlopeN: metIn.rosinRammlerSlopeN,
    retainedPercentAtP80: metIn.retainedPercentAtP80,
    drySampleMassGrams: Math.max(250, Math.round(gyEval.minDrySampleGrams))
  });
  const sieveEval = {
    ...sieveEvalRaw,
    rosinRammlerY: Array.isArray(sieveEvalRaw.sieveStack) && sieveEvalRaw.sieveStack[0]
      ? sieveEvalRaw.sieveStack[0].rosinRammlerY
      : sieveEvalRaw.rosinRammlerYPrime
  };

  // 7. Compuerta de Plausibilidad Física, Sensibilidad Sobol en vivo y Proyección ERP
  const erpIn = validateSchemaPayload('erpExport', s).normalized;
  const leadValidation = validatePlantLeadInput({
    company: s.company || '',
    cwPct: pumpIn.solidsWeightPercent,
    d80Microns: pumpIn.particleSizeD80Microns,
    flowM3h: pumpIn.flowM3H,
    pulpPh: pumpIn.pH,
    altitudeM: pumpIn.altitudeM,
    tempC: pumpIn.tempC,
    strictBlindCheck: pumpIn.strictBlindCheck,
    wetMaterial: matKey,
    frontClearanceMm: tribIn.frontClearanceMm,
    tipSpeedMs: driveEval.tipSpeedMs,
    smat_code: s.smat_code || 'SMAT-PUMP-6X4-WETKIT'
  });
  const parsedPart = parseSmatPartCode(s.smat_code || 'SMAT-PUMP-6X4-WETKIT', 'es');
  const trayTotalEstimateMxn = trayItems.reduce((acc, it) => acc + Math.max(0, Number(it?.unitPriceMxn || it?.priceMxn || 0)) * Math.max(1, Number(it?.qty || 1)), 0);
  const cmuDescriptor = computeCmuPriorityDescriptor({
    urgency: jrpIn.urgency || s.urgency || (jrpIn.criticalityMode === 'paro_planta' ? 'paro_de_linea' : 'programado'),
    criticalityMode: jrpIn.criticalityMode,
    items: trayItems,
    estimatedTotalMxn: s.estimatedTotalMxn ?? (trayTotalEstimateMxn > 0 ? trayTotalEstimateMxn : (jrpIn.criticalityMode === 'paro_planta' ? 18500 : 85000)),
    stockRegime: s.stockRegime || 'hay'
  });

  const sensitivity = computeSobolFirstOrderIndices(
    (v) => calculateSlurryMetrics({
      flowM3H: v.flowM3H,
      solidsWeightPercent: v.solidsWeightPercent,
      particleSizeD80Microns: v.particleSizeD80Microns,
      altitudeM: v.altitudeM,
      solidsSpecificGravity: pumpIn.solidsSpecificGravity,
      pipeSeries
    }).results.estimatedImpellerLifeHours,
    [
      { name: 'flowM3H', min: 50, max: 1200 },
      { name: 'solidsWeightPercent', min: 15, max: 68 },
      { name: 'particleSizeD80Microns', min: 38, max: 600 },
      { name: 'altitudeM', min: 0, max: 4500 }
    ],
    16
  );
  const topSobol = sensitivity.ranked[0] || { name: 'solidsWeightPercent', si: 0 };
  const sobolDominantDriver = `${topSobol.name} (S₁=${topSobol.si.toFixed(2)})`;
  if (slurryEval.results) {
    slurryEval.results.sobolDominantDriver = sobolDominantDriver;
  }

  const erpSnapshot = {
    folio: erpIn.folio || 'SMAT-2026-8810',
    nombre: s.nombre || s.name || '',
    empresa: s.empresa || s.company || '',
    role: s.role || 'kit_wet_end',
    smat_code: s.smat_code || 'SMAT-PUMP-6X4-WETKIT',
    quantity: erpIn.quantity,
    placa_ref: erpIn.placa_ref,
    logistics_mode: erpIn.logistics_mode,
    destination: erpIn.delivery_destination || erpIn.logistics_mode,
    alloy: matMeta.code || optimalMaterial.code,
    circuit: s.circuit || 'bombeo'
  };

  return {
    disciplineGraph: XDSM_DISCIPLINE_GRAPH,
    disciplineOrder: XDSM_DISCIPLINE_ORDER,
    arrangementCount,
    driveKinematicsAliasReady: typeof calculateDriveKinematics === 'function',
    derivedTorqueNm,
    altitudeEval: altData,
    slurryEval,
    driveEval,
    frameEval,
    sealBalanceEval,
    optimalMaterial,
    hybridEval,
    interferenceEval,
    assemblySeqEval,
    reorderEval,
    tradeInEval,
    flotationEval,
    filtrationEval,
    cycloneScreenEval,
    marcyEval,
    gyEval,
    sieveEval,
    leadValidation,
    parsedPart,
    cmuDescriptor,
    sensitivity: {
      ...sensitivity,
      sobolDominantDriver,
      sobolDominantSi: topSobol.si
    },
    erpBundle: {
      sapTsv: formatSapTsv(erpSnapshot),
      acuseParams: buildAcuseUrlParams(erpSnapshot).toString(),
      webhookPayload: buildLeadWebhookPayload(erpSnapshot, 'xdsm_solver')
    }
  };
}

/**
 * Estima índices de sensibilidad global Sobol' de primer orden (esquema Saltelli determinista)
 * sobre puntos de cuadratura pseudo-ortogonales Halton para auditar ranking Tier 1 vs Tier 2.
 *
 * @param {(vec: Record<string, number>) => number} modelFn
 * @param {Array<{ name: string, min: number, max: number }>} paramSpecs
 * @param {number} [nSamples=64]
 * @returns {{ totalVariance: number, indices: Record<string, number>, ranked: Array<{ name: string, si: number }> }}
 */
export function computeSobolFirstOrderIndices(modelFn, paramSpecs = [], nSamples = 64) {
  if (typeof modelFn !== 'function' || !Array.isArray(paramSpecs) || paramSpecs.length === 0) {
    return { totalVariance: 0, indices: {}, ranked: [] };
  }
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
  const halton = (idx, base) => {
    let f = 1;
    let r = 0;
    let i = idx;
    while (i > 0) {
      f /= base;
      r += f * (i % base);
      i = Math.floor(i / base);
    }
    return r;
  };
  const d = paramSpecs.length;
  const sampleMatrix = (primeOffset) => {
    const rows = [];
    for (let i = 1; i <= nSamples; i += 1) {
      const vec = {};
      for (let j = 0; j < d; j += 1) {
        const spec = paramSpecs[j];
        const u = halton(i + 17, primes[(j + primeOffset) % primes.length]);
        vec[spec.name] = spec.min + u * (spec.max - spec.min);
      }
      rows.push(vec);
    }
    return rows;
  };

  const matA = sampleMatrix(0);
  const matB = sampleMatrix(d);
  const yA = matA.map((v) => Number(modelFn(v)));
  const yB = matB.map((v) => Number(modelFn(v)));
  const allY = yA.concat(yB);
  const meanY = allY.reduce((a, b) => a + b, 0) / allY.length;
  const meanB = yB.reduce((a, b) => a + b, 0) / yB.length;
  const variance = allY.reduce((acc, val) => acc + Math.pow(val - meanY, 2), 0) / Math.max(1, allY.length - 1);

  const indices = {};
  const ranked = [];
  for (let j = 0; j < d; j += 1) {
    const key = paramSpecs[j].name;
    let saltelliSum = 0;
    for (let i = 0; i < nSamples; i += 1) {
      const hybrid = { ...matA[i], [key]: matB[i][key] };
      const yAb = Number(modelFn(hybrid));
      saltelliSum += (yB[i] - meanB) * (yAb - yA[i]);
    }
    const siRaw = variance > 1e-12 ? Math.max(0, Math.min(1, saltelliSum / (nSamples * variance))) : 0;
    const si = Number(siRaw.toFixed(4));
    indices[key] = si;
    ranked.push({ name: key, si });
  }
  ranked.sort((a, b) => b.si - a.si);
  return { totalVariance: Number(variance.toFixed(6)), indices, ranked };
}
