/**
 * SMAT Minerals - Slurry & Wear Mathematical Engine (Decisiones 1-C, 3-C, 4-C y 5-C)
 * Ecuación Canónica de Durand-Condolios, Matriz Metalúrgica A05 vs. Caucho,
 * Presets de Operación Minera y Motor de Diagnóstico de Fallas Mecánicas.
 * Zero-Dependencies, Sub-Millisecond Client/Server Execution.
 */

export const SLURRY_PRESETS = {
  sag_primary: {
    id: 'sag_primary',
    nameEs: 'Molienda SAG / Primaria (Gruesos)',
    nameEn: 'SAG / Primary Grinding (Coarse)',
    flowM3H: 450,
    solidsWeightPercent: 28,
    particleSizeD80Microns: 450,
    solidsSpecificGravity: 2.7,
    pipeDiameterMm: 250,
    defaultRole: 'impulsor',
    tagEs: 'Alto Impacto • High Chrome A05',
    tagEn: 'High Impact • High Chrome A05'
  },
  flotation_rougher: {
    id: 'flotation_rougher',
    nameEs: 'Celdas de Flotación (Finos & Reactivos)',
    nameEn: 'Flotation Cells (Fines & Reagents)',
    flowM3H: 300,
    solidsWeightPercent: 18,
    particleSizeD80Microns: 74,
    solidsSpecificGravity: 2.65,
    pipeDiameterMm: 200,
    defaultRole: 'rotor_estator',
    tagEs: 'Rebote Elástico • Caucho Vulcanizado',
    tagEn: 'Elastic Rebound • Vulcanized Rubber'
  },
  tailings_thickened: {
    id: 'tailings_thickened',
    nameEs: 'Línea de Jales / Relaves Espesados',
    nameEn: 'Thickened Tailings / High Density',
    flowM3H: 600,
    solidsWeightPercent: 55,
    particleSizeD80Microns: 150,
    solidsSpecificGravity: 2.8,
    pipeDiameterMm: 300,
    defaultRole: 'skid_bomba',
    tagEs: 'Alta Fricción • High Chrome A05',
    tagEn: 'High Friction • High Chrome A05'
  },
  emergency_6x4: {
    id: 'emergency_6x4',
    nameEs: 'Pieza Crítica por Paro Bomba 6x4',
    nameEn: '6x4 Critical Outage Spares',
    flowM3H: 350,
    solidsWeightPercent: 32,
    particleSizeD80Microns: 300,
    solidsSpecificGravity: 2.7,
    pipeDiameterMm: 200,
    defaultRole: 'revestimientos',
    tagEs: 'Refacción en Almacén Durango',
    tagEn: 'In-Stock Spares • Durango Warehouse'
  }
};

export const MECHANICAL_DIAGNOSTICS = {
  cavitation: {
    id: 'cavitation',
    symptomEs: 'Golpeteo hidráulico o ruido de grava en carcasa (Cavitación)',
    symptomEn: 'Hydraulic pinging or gravel noise in pump casing (Cavitation)',
    causeEs: 'Cavitación hidráulica por NPSHa insuficiente o succión estrangulada en cajón.',
    causeEn: 'Hydraulic cavitation due to low NPSHa or choked suction intake.',
    actionEs: 'Verificar sumergencia de cajón de succión. Instalar sello dinámico expulsor para eliminar vacío en estopa.',
    actionEn: 'Check sump submergence. Fit dynamic expeller seal to relieve suction vacuum.',
    threshold: 'NPSHa < NPSHr + 1.5 m (ΔNPSH altitud > 2.0 m)',
    stationNumber: 2,
    recommendedMaterial: 'alto_cromo_cr27',
    recommendedClearanceMm: 0.75,
    recommendedRole: 'sello'
  },
  liner_grooving: {
    id: 'liner_grooving',
    symptomEs: 'Desgaste abrasivo acelerado y surcos en cuello de succión o voluta',
    symptomEn: 'Accelerated abrasive wear and localized grooving on throatbush / volute',
    causeEs: 'Recirculación abrasiva de sólidos gruesos de molienda (>300 µm).',
    causeEn: 'Abrasive recirculation of coarse grinding particles (>300 µm).',
    actionEs: 'Reajuste milimétrico de claros de acople o actualización a aleación High Chrome 27% (A05) >650 HB.',
    actionEn: 'Precision clearance adjustment or upgrade to High Chrome 27% (A05) >650 HB alloy.',
    threshold: 'δ_frontal > 1.5 mm (Δη_v > 15%) o d80 > 300 µm',
    stationNumber: 5,
    recommendedMaterial: 'alto_cromo_cr27',
    recommendedClearanceMm: 0.65,
    recommendedRole: 'revestimientos'
  },
  bearing_vibration: {
    id: 'bearing_vibration',
    symptomEs: 'Vibración armónica excesiva y calentamiento en soporte de rodamientos',
    symptomEn: 'Harmonic vibration and bearing cartridge overheating',
    causeEs: 'Desbalance dinámico por desgaste asimétrico del impulsor o fatiga de rodamientos.',
    causeEn: 'Dynamic unbalance from uneven impeller erosion or bearing fatigue.',
    actionEs: 'Despacho de ensamble de rodamientos Timken y balanceo dinámico en banco de pruebas de Almacén Durango.',
    actionEn: 'Dispatch Timken bearing cartridge assembly with shop dynamic balancing inspection in Durango Warehouse.',
    threshold: 'L10h < 15,000 h o Fr > 18 kN (Tensión V-Belt)',
    stationNumber: 1,
    recommendedMaterial: 'alto_cromo_cr27',
    recommendedClearanceMm: 0.75,
    recommendedRole: 'soporte'
  },
  packing_leak: {
    id: 'packing_leak',
    symptomEs: 'Fuga continua de pulpa y daño prematuro en casquillo de flecha',
    symptomEn: 'Continuous slurry leakage and shaft sleeve scoring',
    causeEs: 'Empaquetadura calcinada o presión insuficiente de agua de sello.',
    causeEn: 'Burnt gland packing or low seal water pressure.',
    actionEs: 'Instalación de casquillo cerámico o conversión a sello dinámico libre de agua de sellado.',
    actionEn: 'Install ceramic-coated sleeve or convert to waterless expeller dynamic seal.',
    threshold: 'u2 > 24.5 m/s en elastómero o P_agua < P_descarga + 0.7 bar',
    stationNumber: 2,
    recommendedMaterial: 'alto_cromo_cr27',
    recommendedClearanceMm: 0.75,
    recommendedRole: 'sello'
  }
};

/**
 * Calcula la corrección por altitud minera (msnm) para presión atmosférica, NPSHa y derating de motor (Normas HI / IEC 60034-1)
 * @param {number} altitudeM - Altitud sobre el nivel del mar en metros
 */
export function calculateAltitudeCorrection(altitudeM = 0) {
  const alt = Math.max(0, Math.min(5000, Number(altitudeM) || 0));
  // Presión barométrica estándar: Patm(h) = 10.33 - (h / 900) m.c.a.
  const pAtm = Math.max(5.0, 10.33 - (alt / 900));
  const deltaNpsh = 10.33 - pAtm;

  // Derating motor IEC 60034-1 (>1000m reduce refrigeración ~1% por cada 100m sobre 1000m)
  let motorDeratingFactor = 1.0;
  if (alt > 1000) {
    motorDeratingFactor = Math.max(0.70, 1.0 - ((alt - 1000) / 10000));
  }

  let altitudeTier = 'sea_level';
  let altitudeTierText = 'Nivel del Mar (0 - 500 msnm) — Presión barométrica nominal 10.3 mca.';
  if (alt >= 2000) {
    altitudeTier = 'high_altitude';
    altitudeTierText = `Sierra Minera (${alt} msnm) — Presión barométrica reducida (${pAtm.toFixed(2)} mca). Requiere verificar NPSHa para evitar cavitación en cajón de succión.`;
  } else if (alt >= 800) {
    altitudeTier = 'mid_altitude';
    altitudeTierText = `Meseta / Valle Minero (${alt} msnm) — Presión barométrica ${pAtm.toFixed(2)} mca.`;
  }

  return {
    altitudeM: alt,
    pAtmHeadMca: Number(pAtm.toFixed(2)),
    barometricPressureKpa: Number((pAtm * 9.80665).toFixed(2)),
    deltaNpshLossM: Number(deltaNpsh.toFixed(2)),
    npshSafeMarginWarning: deltaNpsh >= 1.5,
    motorDeratingFactor: Number(motorDeratingFactor.toFixed(3)),
    altitudeTier,
    altitudeTierText
  };
}

/**
 * Calcula métricas completas de pulpa usando Durand-Condolios y matriz metalúrgica
 */
export const PIPE_SERIES_DIAMETER_MM = {
  '1.5x1': 50,
  '2x1.5': 50,
  '3x2': 100,
  '4x3': 100,
  '6x4': 150,
  '8x6': 200,
  '10x8': 250,
  '12x10': 300,
  '14x12': 350
};
export const PIPE_DIAMETERS_MM = PIPE_SERIES_DIAMETER_MM;

/**
 * Resuelve el diámetro interno nominal de tubería (mm) a partir de la clave de serie de bomba
 * ('1.5x1', '3x2', '4x3', '6x4', '8x6', '10x8') o un valor numérico directo en milímetros.
 * @param {string|number} [pipeSeriesOrMm='6x4']
 * @returns {number} Diámetro interno en milímetros (50 a 600 mm)
 */
export function resolvePipeDiameterMm(pipeSeriesOrMm = '6x4') {
  if (typeof pipeSeriesOrMm === 'number' && !Number.isNaN(pipeSeriesOrMm)) {
    return Math.max(50, Math.min(600, pipeSeriesOrMm));
  }
  const raw = String(pipeSeriesOrMm || '6x4').trim().toLowerCase();
  if (PIPE_SERIES_DIAMETER_MM[raw] !== undefined) {
    return PIPE_SERIES_DIAMETER_MM[raw];
  }
  if (raw.includes('10x8')) return 250;
  if (raw.includes('8x6')) return 200;
  if (raw.includes('6x4')) return 150;
  if (raw.includes('4x3') || raw.includes('3x2')) return 100;
  if (raw.includes('1.5x1') || raw.includes('2x1.5')) return 50;
  const parsed = Number(raw);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return Math.max(50, Math.min(600, parsed));
  }
  return 150;
}

export function calculateSlurryMetrics({
  flowM3H = 150,
  solidsWeightPercent = 45,
  particleSizeD80Microns = 180,
  solidsSpecificGravity = 2.7,
  pipeDiameterMm,
  pipeSeries = '6x4',
  altitudeM = 0,
  pH = 7.5,
  stressSymptom = ''
} = {}) {
  // 1. Sanitización y límites físicos mineros
  const Q = Math.max(10, Math.min(3000, Number(flowM3H) || 150));
  const Cw = Math.max(5, Math.min(75, Number(solidsWeightPercent) || 45));
  const d80 = Math.max(20, Math.min(2000, Number(particleSizeD80Microns) || 180));
  const Ss = Math.max(1.5, Math.min(5.5, Number(solidsSpecificGravity) || 2.7));
  const resolvedD = pipeDiameterMm !== undefined && pipeDiameterMm !== null && pipeDiameterMm !== ''
    ? resolvePipeDiameterMm(pipeDiameterMm)
    : resolvePipeDiameterMm(pipeSeries);
  const D_mm = Math.max(50, Math.min(600, Number(resolvedD) || 150));
  const D_m = D_mm / 1000;
  const phVal = Math.max(1.0, Math.min(14.0, Number(pH) || 7.5));
  const symptomKey = String(stressSymptom || '').trim().toLowerCase();
  const g = 9.81;

  // Corrección por altitud
  const altitudeData = calculateAltitudeCorrection(altitudeM);

  // 2. Gravedad específica de la pulpa (Sm)
  // Sm = 100 / ( (Cw / Ss) + (100 - Cw) )
  const Sm = 100 / ((Cw / Ss) + (100 - Cw));

  // 3. Concentración volumétrica de sólidos (Cv %)
  const Cv = (Cw * Sm) / Ss;

  // 4. Factor de Durand (FL) calibrado para pulpas de molienda y flotación
  let FL = 1.32 * Math.pow(d80 / 150, 0.12);
  if (Cv < 15) FL *= 0.90;
  else if (Cv > 35) FL *= 1.05;
  FL = Math.max(0.92, Math.min(1.48, FL));

  // 5. Velocidad Crítica de Sedimentación (Vc en m/s) - Durand-Condolios
  // Vc = FL * sqrt( 2 * g * D * (Ss - 1) )
  const Vc = FL * Math.sqrt(2 * g * D_m * (Ss - 1));
  const recommendedPipeVelocity = Vc * 1.25; // Margen de seguridad 25% contra embancamiento

  // 6. Velocidad real en tubería (Vact en m/s)
  const pipeAreaM2 = Math.PI * Math.pow(D_m / 2, 2);
  const flowM3S = Q / 3600;
  const actualPipeVelocity = flowM3S / pipeAreaM2;

  // 7. Evaluación de Riesgo de Embancamiento / Taponamiento
  let flowCondition = 'optimal';
  let flowConditionText = 'Velocidad de flujo segura dentro de rango óptimo de bombeo (libre de sedimentación y libre de desgaste excesivo).';
  if (actualPipeVelocity < Vc) {
    flowCondition = 'settling_risk';
    flowConditionText = 'Riesgo de sedimentación: velocidad inferior al límite de Durand. Aumente caudal o reduzca diámetro para evitar taponamiento en la tubería.';
  } else if (actualPipeVelocity > Vc * 2.2) {
    flowCondition = 'high_wear';
    flowConditionText = 'Exceso de velocidad en línea: desgaste acelerado por abrasión en codos y voluta.';
  }

  // 8. Matriz Tri-Compuesto: High Chrome A05 (>650 HB) vs. Caucho Natural R55 vs. Poliuretano U01 (Shore A 85-95)
  let recommendedMaterial = 'A05';
  let recommendedMaterialKey = 'alto_cromo_cr27';
  let recommendedMaterialCode = 'A05';
  let materialNameEs = 'High Chrome 27% (A05) con Dureza >650 HB';
  let materialNameEn = 'High Chrome 27% (A05) Hardness >650 HB';
  let wearLifeRatio = 1.0;
  let rationaleEs = '';
  let rationaleEn = '';

  const isCoarseImpact = d80 >= 450 || (d80 >= 250 && Cw >= 50) || symptomKey === 'roca_dura';
  const isFineLightRubber = ((d80 < 75 && Cw < 40) || (d80 <= 150 && Cw < 40 && actualPipeVelocity <= 2.6)) && symptomKey !== 'arena_fina' && symptomKey !== 'acido_quimica' && phVal >= 4.0;
  const isPolyurethaneRegime = !isCoarseImpact && !isFineLightRubber && (
    symptomKey === 'arena_fina' ||
    symptomKey === 'acido_quimica' ||
    phVal < 4.5 ||
    (d80 >= 75 && d80 <= 450 && (actualPipeVelocity > 2.4 || Cw <= 48))
  );

  if (isCoarseImpact) {
    // Partículas gruesas / cortantes de molienda: A05 domina
    recommendedMaterial = 'A05';
    recommendedMaterialKey = 'alto_cromo_cr27';
    recommendedMaterialCode = 'A05';
    wearLifeRatio = (d80 > 300) ? 3.8 : 2.6;
    rationaleEs = `Para partículas gruesas de molienda (${Math.round(d80)} µm) con alta energía de impacto, la aleación High Chrome 27% (A05) con dureza >650 HB ofrece ${wearLifeRatio.toFixed(1)}× mayor vida útil contra desgaste severo.`;
    rationaleEn = `For coarse grinding particles (${Math.round(d80)} µm) with high impact energy, High Chrome 27% (A05) (>650 HB) delivers ${wearLifeRatio.toFixed(1)}× longer wear life by preventing matrix erosion.`;
  } else if (isFineLightRubber) {
    // Finos de flotación / jales ligeros: Caucho es ideal
    recommendedMaterial = 'RUBBER';
    recommendedMaterialKey = 'hule_natural';
    recommendedMaterialCode = 'R55';
    materialNameEs = 'Caucho Natural Vulcanizado de Alta Resiliencia';
    materialNameEn = 'High-Resilience Natural Vulcanized Rubber';
    wearLifeRatio = 2.4;
    rationaleEs = `Para finos de flotación (${Math.round(d80)} µm), el Caucho Natural Vulcanizado absorbe el micro-impacto por rebote elástico, superando a las aleaciones duras en pulpas con reactivos.`;
    rationaleEn = `For fine flotation tails (${Math.round(d80)} µm), natural vulcanized rubber absorbs micro-impacts via elastic rebound, outlasting hard alloys in reagent slurries.`;
  } else if (isPolyurethaneRegime) {
    // Régimen de corte fino/intermedio a velocidad o ataque químico/ácido: Poliuretano U01 domina
    recommendedMaterial = 'PU';
    recommendedMaterialKey = 'poliuretano';
    recommendedMaterialCode = 'U01';
    materialNameEs = 'Poliuretano Elastómero Grado Minero (U01, Shore A 85–95)';
    materialNameEn = 'Mining-Grade Cast Polyurethane Elastomer (U01, Shore A 85–95)';
    wearLifeRatio = 2.1;
    rationaleEs = `Para pulpa de corte intermedio (${Math.round(d80)} µm, V = ${actualPipeVelocity.toFixed(2)} m/s, pH ${phVal.toFixed(1)}), el Poliuretano U01 (Shore A 85–95) ofrece ${wearLifeRatio.toFixed(1)}× mayor resistencia al corte direccional, hidrociclones y ataque químico que el hule convencional.`;
    rationaleEn = `For intermediate cutting slurry (${Math.round(d80)} µm, V = ${actualPipeVelocity.toFixed(2)} m/s, pH ${phVal.toFixed(1)}), Cast Polyurethane U01 (Shore A 85–95) delivers ${wearLifeRatio.toFixed(1)}× higher resistance to directional cutting, hydrocyclone feed, and chemical attack.`;
  } else {
    // Rango intermedio denso de alta presión (75 a 150 µm, Cw >= 42%): High Chrome A05
    recommendedMaterial = 'A05';
    recommendedMaterialKey = 'alto_cromo_cr27';
    recommendedMaterialCode = 'A05';
    wearLifeRatio = 1.5;
    rationaleEs = `En rango intermedio denso (${Math.round(d80)} µm, ${Cw}% Cw), High Chrome A05 (>650 HB) provee máxima estabilidad dimensional y resistencia contra recirculación bajo presiones severas.`;
    rationaleEn = `In the dense intermediate range (${Math.round(d80)} µm, ${Cw}% Cw), High Chrome A05 (>650 HB) provides superior dimensional stability and slip resistance under high discharge heads.`;
  }

  // 9. Estimación de Horas Operativas de Vida de Impulsor (Baseline Durango 1,200 t/d)
  const baseHours = recommendedMaterial === 'A05' ? 2400 : (recommendedMaterial === 'PU' ? 2600 : 2800);
  const severityFactor = (Cw / 45) * Math.pow(d80 / 180, 0.35) * (actualPipeVelocity / 3.0);
  const estimatedImpellerLifeHours = Math.round(baseHours / Math.max(0.5, Math.min(2.5, severityFactor)));

  // 10. Factor de Abatimiento de Carga y Eficiencia Hidráulica Cave / McElvain (INV-SMAT-PHY-001)
  const headLossK = 0.000385 * Math.pow(d80 / 100, 0.35) * (Ss - 1) * Cw;
  const headDeratingFactorHr = Math.max(0.65, Math.min(0.99, 1.0 - headLossK));
  const effDeratingFactorEr = Math.max(0.60, Math.min(0.98, headDeratingFactorHr - 0.02 * (Cv / 20)));

  // 11. Pinza Termo-Barométrica de Altitud TEFC IEC 60034-1 (Arbitraje Epistémico #15 / INV-SMAT-SCI-23)
  const rawCombinedMultiplier = 1.0 / Math.max(0.25, effDeratingFactorEr * altitudeData.motorDeratingFactor);
  const combinedMotorAltitudeMultiplier = Number(rawCombinedMultiplier.toFixed(3));
  const motorSizingPenaltyPct = Number(((rawCombinedMultiplier - 1.0) * 100.0).toFixed(1));

  const roundedSm = Number(Sm.toFixed(3));
  const roundedVc = Number(Vc.toFixed(2));
  const roundedVact = Number(actualPipeVelocity.toFixed(2));

  return {
    solidsSpecificGravity: Ss,
    pipeDiameterMm: D_mm,
    slurrySpecificGravity: roundedSm,
    criticalVelocityMS: roundedVc,
    criticalVelocityMs: roundedVc,
    actualVelocityMS: roundedVact,
    actualPipeVelocityMs: roundedVact,
    durandFactorFL: Number(FL.toFixed(2)),
    solidsVolumetricPercent: Number(Cv.toFixed(1)),
    recommendedPipeVelocityMs: Number(recommendedPipeVelocity.toFixed(2)),
    headDeratingFactorHr: Number(headDeratingFactorHr.toFixed(3)),
    effDeratingFactorEr: Number(effDeratingFactorEr.toFixed(3)),
    estimatedImpellerLifeHours,
    wearLifeRatio: Number(wearLifeRatio.toFixed(1)),
    pAtmHeadMca: altitudeData.pAtmHeadMca,
    deltaNpshLossM: altitudeData.deltaNpshLossM,
    motorDeratingFactor: altitudeData.motorDeratingFactor,
    combinedMotorAltitudeMultiplier,
    motorSizingPenaltyPct,
    altitudeTierText: altitudeData.altitudeTierText,
    recommendedMaterial,
    recommendedMaterialKey,
    recommendedMaterialCode,
    materialReasonEs: rationaleEs,
    materialReasonEn: rationaleEn,
    inputs: {
      flowM3H: Q,
      solidsWeightPercent: Cw,
      particleSizeD80Microns: d80,
      solidsSpecificGravity: Ss,
      pipeDiameterMm: D_mm,
      pipeSeries: String(pipeSeries || '6x4'),
      altitudeM: altitudeData.altitudeM,
      pH: phVal,
      stressSymptom: symptomKey
    },
    results: {
      slurrySpecificGravity: roundedSm,
      solidsVolumetricPercent: Number(Cv.toFixed(1)),
      durandFactorFL: Number(FL.toFixed(2)),
      criticalSettlingVelocityMs: roundedVc,
      recommendedPipeVelocityMs: Number(recommendedPipeVelocity.toFixed(2)),
      actualPipeVelocityMs: roundedVact,
      headDeratingFactorHr: Number(headDeratingFactorHr.toFixed(3)),
      effDeratingFactorEr: Number(effDeratingFactorEr.toFixed(3)),
      pAtmHeadMca: altitudeData.pAtmHeadMca,
      deltaNpshLossM: altitudeData.deltaNpshLossM,
      motorDeratingFactor: altitudeData.motorDeratingFactor,
      combinedMotorAltitudeMultiplier,
      motorSizingPenaltyPct,
      flowCondition,
      flowConditionText,
      recommendedMaterial,
      recommendedMaterialKey,
      recommendedMaterialCode,
      materialNameEs,
      materialNameEn,
      wearLifeRatio: Number(wearLifeRatio.toFixed(1)),
      rationaleEs,
      rationaleEn,
      estimatedImpellerLifeHours,
      altitudeCorrection: altitudeData
    }
  };
}

function clamp(val, min, max, fallback) {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * 12 Anillos Intercambiables Estándar para Balanza de Densidad de Pulpa tipo Marcy (Ss 2.2 a 4.4)
 */
export const MARCY_STANDARD_RINGS = [2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4];

/**
 * Serie Maestra de Tamices Certificados ASTM E11 / ISO 3310-1 (Progresión 4√2 desde Malla #4 hasta #635 / 20 µm)
 */
export const ASTM_E11_SIEVE_TABLE = [
  { mesh: '#4', tylerEquivalent: '4 Mesh', apertureMicrons: 4750, apertureMm: 4.75, wireDiameterMm: 1.60 },
  { mesh: '#6', tylerEquivalent: '6 Mesh', apertureMicrons: 3350, apertureMm: 3.35, wireDiameterMm: 1.25 },
  { mesh: '#8', tylerEquivalent: '8 Mesh', apertureMicrons: 2360, apertureMm: 2.36, wireDiameterMm: 1.00 },
  { mesh: '#10', tylerEquivalent: '9 Mesh', apertureMicrons: 2000, apertureMm: 2.00, wireDiameterMm: 0.90 },
  { mesh: '#12', tylerEquivalent: '10 Mesh', apertureMicrons: 1700, apertureMm: 1.70, wireDiameterMm: 0.80 },
  { mesh: '#16', tylerEquivalent: '14 Mesh', apertureMicrons: 1180, apertureMm: 1.18, wireDiameterMm: 0.63 },
  { mesh: '#20', tylerEquivalent: '20 Mesh', apertureMicrons: 850, apertureMm: 0.85, wireDiameterMm: 0.50 },
  { mesh: '#30', tylerEquivalent: '28 Mesh', apertureMicrons: 600, apertureMm: 0.60, wireDiameterMm: 0.40 },
  { mesh: '#40', tylerEquivalent: '35 Mesh', apertureMicrons: 425, apertureMm: 0.425, wireDiameterMm: 0.28 },
  { mesh: '#50', tylerEquivalent: '48 Mesh', apertureMicrons: 300, apertureMm: 0.30, wireDiameterMm: 0.20 },
  { mesh: '#70', tylerEquivalent: '65 Mesh', apertureMicrons: 212, apertureMm: 0.212, wireDiameterMm: 0.14 },
  { mesh: '#100', tylerEquivalent: '100 Mesh', apertureMicrons: 150, apertureMm: 0.150, wireDiameterMm: 0.10 },
  { mesh: '#140', tylerEquivalent: '150 Mesh', apertureMicrons: 106, apertureMm: 0.106, wireDiameterMm: 0.071 },
  { mesh: '#200', tylerEquivalent: '200 Mesh', apertureMicrons: 75, apertureMm: 0.075, wireDiameterMm: 0.050 },
  { mesh: '#270', tylerEquivalent: '270 Mesh', apertureMicrons: 53, apertureMm: 0.053, wireDiameterMm: 0.036 },
  { mesh: '#325', tylerEquivalent: '325 Mesh', apertureMicrons: 45, apertureMm: 0.045, wireDiameterMm: 0.032 },
  { mesh: '#400', tylerEquivalent: '400 Mesh', apertureMicrons: 38, apertureMm: 0.038, wireDiameterMm: 0.025 },
  { mesh: '#500', tylerEquivalent: '500 Mesh', apertureMicrons: 25, apertureMm: 0.025, wireDiameterMm: 0.020 },
  { mesh: '#635', tylerEquivalent: '635 Mesh', apertureMicrons: 20, apertureMm: 0.020, wireDiameterMm: 0.016 }
];

/**
 * Calcula la lectura gravimétrica bidireccional de una Balanza de Pulpa tipo Marcy (vaso de 1000 cm³)
 * y determina el anillo intercambiable óptimo (Ss ∈ [2.2, 4.4]) junto con el desvío por cambio de mineral.
 * Referencia Kernel: clayton-iliquin/software-MetalurgIA (pages/1_Tools.py)
 *
 * @param {Object} params
 * @param {number} [params.solidsSpecificGravity=2.8] - Gravedad específica del mineral seco Ss (g/cm³)
 * @param {number} [params.pulpDensityKgL] - Densidad de pulpa medida ρp (kg/L o g/cm³). Si se omite, se calcula desde solidsWeightPercent.
 * @param {number} [params.solidsWeightPercent=45] - Concentración de sólidos en peso Cw (%) si no se provee pulpDensityKgL.
 */
export function selectOptimalMaterial(d80Microns = 180, cwPercent = 45, pulpPh = 7.5) {
  const d80 = clamp(d80Microns, 10, 5000, 180);
  const cw = clamp(cwPercent, 1, 85, 45);
  const phVal = clamp(pulpPh, 1.0, 14.0, 7.5);
  const isCorrosiveAcidic = phVal < 4.0;
  if (isCorrosiveAcidic && d80 <= 300) {
    return {
      id: 'rubber',
      code: 'R55',
      materialKey: 'hule_natural',
      isCorrosiveAcidic: true,
      nameEs: 'Caucho Natural Vulcanizado Resistente a Acidez (R55)',
      nameEn: 'Acid-Resistant Vulcanized Natural Rubber (R55)'
    };
  }
  if (d80 >= 300 || cw >= 50) {
    return {
      id: 'high_chrome',
      code: 'A05',
      materialKey: 'alto_cromo_cr27',
      isCorrosiveAcidic,
      nameEs: 'Alto Cromo ASTM A532 Cr27% (>650 HB)',
      nameEn: 'High Chrome ASTM A532 Cr27% (>650 HB)'
    };
  }
  return {
    id: 'polyurethane',
    code: 'U01',
    materialKey: 'poliuretano',
    isCorrosiveAcidic,
    nameEs: 'Poliuretano Grado Minero U01 (Shore A 85–95)',
    nameEn: 'Mining-Grade Polyurethane U01 (Shore A 85–95)'
  };
}

export function calculateMarcyScaleReading(params = {}) {
  let ss = clamp(params.solidsSpecificGravity ?? params.solidsSg ?? params.oreDensitySg, 1.8, 5.2, 2.8);

  let rhoP;
  let cwPercent;
  const rawRhoInput = params.pulpDensityKgL ?? params.pulpDensitySg;

  if (params.solveFor === 'ore_density_rhop' && typeof rawRhoInput === 'number' && !Number.isNaN(rawRhoInput)) {
    // Inversión para despejar gravedad específica del mineral seco Ss (oreDensitySg) dados ρp y Cw
    rhoP = clamp(rawRhoInput, 1.01, 4.5, 1.40);
    cwPercent = clamp(params.solidsWeightPercent ?? params.weightPercentSolids, 1, 90, 45);
    const denom = 100 - rhoP * (100 - cwPercent);
    if (denom > 0.01) {
      ss = clamp((rhoP * cwPercent) / denom, 1.8, 5.2, 2.8);
    }
  } else if (typeof rawRhoInput === 'number' && !Number.isNaN(rawRhoInput)) {
    // Modo directo: ρp -> Cw = 100 * Ss * (ρp - 1) / (ρp * (Ss - 1))
    const maxRho = ss * 0.85 + 0.15;
    rhoP = clamp(rawRhoInput, 1.01, maxRho, 1.40);
    const rawCw = (100 * ss * (rhoP - 1.0)) / (rhoP * (ss - 1.0));
    cwPercent = clamp(rawCw, 1, 90, 45);
  } else {
    // Modo inverso: Cw -> ρp = 100 * Ss / (Cw + Ss * (100 - Cw))
    cwPercent = clamp(params.solidsWeightPercent ?? params.weightPercentSolids, 1, 88, 45);
    rhoP = (100 * ss) / (cwPercent + ss * (100 - cwPercent));
  }

  const cvPercent = (cwPercent / ss) / ((cwPercent / ss) + (100 - cwPercent)) * 100;
  const cupNetMassGrams = Math.round(rhoP * 1000);
  const drySolidsMassGramsInCup = Math.round(cupNetMassGrams * (cwPercent / 100));

  // Seleccionar el anillo Marcy estándar más cercano dentro de los 12 anillos SMAT (2.2 a 4.4)
  let recommendedRingSg = MARCY_STANDARD_RINGS[0];
  let minDiff = Math.abs(ss - recommendedRingSg);
  for (const ringSg of MARCY_STANDARD_RINGS) {
    const diff = Math.abs(ss - ringSg);
    if (diff < minDiff) {
      minDiff = diff;
      recommendedRingSg = ringSg;
    }
  }

  // Calcular la lectura aparente en ese anillo y el sesgo si se dejara puesto un anillo genérico de 2.6
  const ringApparentCw = clamp(
    (100 * recommendedRingSg * (rhoP - 1.0)) / (rhoP * (recommendedRingSg - 1.0)),
    1,
    95,
    cwPercent
  );
  const genericRing26Cw = clamp(
    (100 * 2.6 * (rhoP - 1.0)) / (rhoP * (2.6 - 1.0)),
    1,
    95,
    cwPercent
  );
  const wrongRingBiasPoints = Number(Math.abs(cwPercent - genericRing26Cw).toFixed(1));
  const roundedRhoP = Number(rhoP.toFixed(3));

  return {
    solidsSpecificGravity: Number(ss.toFixed(2)),
    oreDensitySg: Number(ss.toFixed(2)),
    pulpDensityKgL: roundedRhoP,
    pulpDensitySg: roundedRhoP,
    slurryDensityKgL: roundedRhoP,
    solidsWeightPercent: Number(cwPercent.toFixed(1)),
    solidsVolumePercent: Number(cvPercent.toFixed(1)),
    cupNetMassGrams,
    drySolidsMassGramsInCup,
    recommendedRingSg: Number(recommendedRingSg.toFixed(1)),
    ringApparentCw: Number(ringApparentCw.toFixed(1)),
    wrongRingBiasPoints,
    recommendedContainerEs: cwPercent >= 45
      ? 'Vaso de 1000 cm³ en Acero Inoxidable 304 (alta abrasión en molienda/ciclones)'
      : 'Vaso de 1000 cm³ en Acrílico o Acero Inoxidable 304 (flotación y espesamiento)',
    recommendedContainerEn: cwPercent >= 45
      ? '1000 cm³ 304 Stainless Steel Container (high-abrasion grinding/cyclone duty)'
      : '1000 cm³ Clear Acrylic or 304 Stainless Container (flotation & thickener duty)'
  };
}

/**
 * Calcula la Masa Mínima Representativa de Muestra según la Teoría de Muestreo de Pierre Gy:
 * Ms = (c * d_n^3) / s_FSE^2
 * y determina el régimen de desaguado en el Filtro de Presión Batch de Laboratorio SMAT.
 * Referencia Kernel: robertorolo/nomograma (nomograma.py)
 *
 * @param {Object} params
 * @param {number} [params.topSizeD95Mm=2.0] - Tamaño nominal máximo de partícula d95 (mm)
 * @param {number} [params.samplingConstantC=1.6] - Constante intrínseca de heterogeneidad del mineral c (g/cm³)
 * @param {number} [params.targetRelativeStdError=0.05] - Error estándar relativo admisible s_FSE (ej. 0.05 = 5%)
 * @param {number} [params.solidsWeightPercent=40] - % de sólidos en peso para estimar volumen de pulpa en litro
 * @param {number} [params.solidsSpecificGravity=2.8] - Gravedad específica del mineral seco Ss (g/cm³)
 * @param {string|number} [params.airPressurePsi='80–100 psi'] - Rango o valor de presión neumática en el filtro de laboratorio
 * @param {number} [params.liberationSizeMicrons=100] - Tamaño de liberación del mineral valioso dl (µm)
 * @param {number} [params.oreGradeDecimal=0.02] - Ley crítica decimal del mineral valioso (0.001 a 0.50)
 */
export function calculateGyMinimumSampleMass(params = {}) {
  const rawMm = params.topSizeD95Mm ?? (params.d95Cm !== undefined ? Number(params.d95Cm) * 10.0 : 2.0);
  const dMm = clamp(rawMm, 0.02, 25.0, 2.0);
  const ss = clamp(params.solidsSpecificGravity ?? params.solidsSg, 1.8, 5.2, 2.8);
  const libMicrons = clamp(params.liberationSizeMicrons, 5, 2000, 100);
  const oreGrade = clamp(params.oreGradeDecimal, 0.0001, 0.80, 0.02);

  // Si se provee samplingConstantC explícito se usa; si no, se estima o toma default 1.6 g/cm³
  const cConst = clamp(params.samplingConstantC, 0.2, 15.0, 1.6);
  const sFse = clamp(params.targetRelativeStdError ?? params.relativeVarianceError ?? params.samplingRelativeVariance, 0.01, 0.20, 0.05);
  const cw = clamp(params.solidsWeightPercent, 10, 80, 40);

  // Régimen de presión neumática seleccionada en Estación 02 (60–80 psi vs 80–100 psi)
  const rawPressure = String(params.airPressurePsi ?? '80 - 100 psi').trim();
  const numPressure = Number(params.airPressurePsi);
  const isHighPressure = (!Number.isNaN(numPressure) && numPressure >= 80) || rawPressure.includes('100') || rawPressure.includes('90');
  const numericAirPressurePsi = !Number.isNaN(numPressure) && numPressure > 0 ? numPressure : (isHighPressure ? 90 : 70);
  const recommendedAirPressurePsi = isHighPressure
    ? '80 - 100 psi (5.5 - 6.9 bar)'
    : '60 - 80 psi (4.1 - 5.5 bar)';
  const estimatedCycleMinutes = isHighPressure ? 6 : 9;
  const residualCakeMoisturePct = isHighPressure ? 9.5 : 12.5;

  // En la ecuación dimensional de Gy con c en g/cm³ y d en cm: Ms (gramos) = c * (d_cm^3) / (s_FSE^2)
  // Para pulpas finas de planta aseguramos piso físico de 250 g secos para análisis granulométrico + químico
  const dCm = dMm / 10.0;
  const theoreticalGrams = (cConst * Math.pow(dCm, 3)) / Math.pow(sFse, 2);
  const minDrySampleGrams = Math.max(250, Math.round(theoreticalGrams));
  const minDrySampleKg = Number((minDrySampleGrams / 1000).toFixed(2));

  // Volumen equivalente de pulpa a filtrar en el Filtro de Presión Batch SMAT usando Ss dinámico
  const slurryRho = (100 * ss) / (cw + ss * (100 - cw));
  const wetSlurryMassGrams = minDrySampleGrams / (cw / 100);
  const requiredPulpLiters = Number((wetSlurryMassGrams / (slurryRho * 1000)).toFixed(2));
  const batchFilterCycles = Math.max(1, Math.ceil(requiredPulpLiters / 8.0));

  return {
    topSizeD95Mm: Number(dMm.toFixed(2)),
    solidsSpecificGravity: Number(ss.toFixed(2)),
    samplingConstantC: Number(cConst.toFixed(2)),
    liberationSizeMicrons: Math.round(libMicrons),
    oreGradeDecimal: Number(oreGrade.toFixed(4)),
    targetRelativeStdError: Number(sFse.toFixed(4)),
    targetRelativeStdErrorPercent: Number((sFse * 100).toFixed(1)),
    theoreticalGyGrams: Number(theoreticalGrams.toFixed(1)),
    minDrySampleGrams,
    minDrySampleKg,
    minimumSampleMassKg: minDrySampleKg,
    requiredPulpLiters,
    slurrySampleLiters: requiredPulpLiters,
    wetPulpVolumeLiters: requiredPulpLiters,
    batchFilterCycles,
    airPressurePsi: numericAirPressurePsi,
    recommendedAirPressurePsi,
    estimatedCycleMinutes,
    recommendedCycleMinutes: estimatedCycleMinutes,
    residualCakeMoisturePct,
    estimatedCakeMoisturePct: residualCakeMoisturePct,
    filterPressStatus: batchFilterCycles === 1 ? '1 carga directa' : `${batchFilterCycles} cargas (Fraccionar)`,
    recommendationEs: batchFilterCycles === 1
      ? `Carga directa en 1 ciclo del Filtro de Presión Batch SMAT (${requiredPulpLiters} L de pulpa a ${recommendedAirPressurePsi}, ~${estimatedCycleMinutes} min)`
      : `Fraccionar con cuarteador de rifle o procesar en ${batchFilterCycles} cargas del Filtro Batch SMAT (${recommendedAirPressurePsi}, ~${estimatedCycleMinutes * batchFilterCycles} min totales)`,
    recommendationEn: batchFilterCycles === 1
      ? `Direct single-charge dewatering in SMAT Batch Pressure Filter (${requiredPulpLiters} L pulp at ${recommendedAirPressurePsi}, ~${estimatedCycleMinutes} min)`
      : `Split via riffle splitter or process across ${batchFilterCycles} SMAT Batch Filter charges (${recommendedAirPressurePsi}, ~${estimatedCycleMinutes * batchFilterCycles} min total)`
  };
}

/**
 * Selecciona la columna óptima de Tamices Certificados ASTM E11 / ISO 3310-1 centrada en el P80 objetivo
 * y calcula la distribución granulométrica completa y coordenada doble-logarítmica de Rosin-Rammler y' = log10(log10(100 / R)).
 * Referencia Kernel: tomjrob/pyRR (RRYScale.py)
 *
 * @param {Object} params
 * @param {number} [params.targetP80Microns=150] - Tamaño P80 objetivo de molienda o clasificación (µm)
 * @param {number} [params.topSizeD95Mm=12.7] - Tamaño superior d95 (mm)
 * @param {string} [params.screeningMode='auto'] - 'auto', 'wet' (tamizado húmedo -> Acero Inox) o 'dry' (Bronce / Acero Inox)
 * @param {number} [params.frameDiameterInches=8] - Diámetro de marco certificado (8 o 12 pulgadas)
 * @param {number} [params.retainedPercentAtP80=20] - % retenido acumulado R (por definición 20% en el corte P80)
 * @param {number} [params.rosinRammlerSlopeN] - Pendiente de uniformidad n de Rosin-Rammler
 */
export function recommendAstmSieveSeries(params = {}) {
  const targetP80 = clamp(params.targetP80Microns, 20, 3350, 150);
  const rawMode = String(params.screeningMode || 'auto').toLowerCase();
  const wetScreeningRequired = rawMode === 'dry' ? false : (rawMode === 'wet' ? true : targetP80 <= 150);
  const mode = wetScreeningRequired ? 'wet' : 'dry';
  const frameDiameterInches = Number(params.frameDiameterInches) === 12 ? 12 : 8;
  const retainedR = clamp(params.retainedPercentAtP80, 1, 99, 20);

  // Encontrar el tamiz ASTM E11 más próximo al P80 objetivo
  let closestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < ASTM_E11_SIEVE_TABLE.length; i++) {
    const dist = Math.abs(Math.log(ASTM_E11_SIEVE_TABLE[i].apertureMicrons) - Math.log(targetP80));
    if (dist < bestDist) {
      bestDist = dist;
      closestIdx = i;
    }
  }

  // Construir pila de tamices (6 tamices en modo clásico o 7 tamices con topSizeD95Mm explícito)
  const stackLen = params.retainedPercentAtP80 !== undefined && params.topSizeD95Mm === undefined ? 6 : 7;
  const startIdx = Math.max(0, Math.min(closestIdx - 2, ASTM_E11_SIEVE_TABLE.length - stackLen));
  const rawSieves = ASTM_E11_SIEVE_TABLE.slice(startIdx, startIdx + stackLen);
  const primaryControlSieve = ASTM_E11_SIEVE_TABLE[closestIdx];

  // Transformación linealizada de Rosin-Rammler (tomjrob/pyRR): y' = log10(log10(100 / R))
  const rosinRammlerYPrime = Number(Math.log10(Math.log10(100.0 / retainedR)).toFixed(4));
  const rosinRammlerSlopeN = Number(clamp(params.rosinRammlerSlopeN, 0.4, 2.5, targetP80 <= 106 ? 1.25 : 1.08).toFixed(2));
  const requiresStainless = wetScreeningRequired;
  const frameMaterialLabel = requiresStainless ? 'Acero Inoxidable 304/316' : 'Bronce / Acero Inox';

  // Calcular distribución granulométrica Rosin-Rammler por malla: R(d) = 100 * exp( -ln(100/retainedR) * (d / P80)^n )
  const kScale = Math.log(100.0 / retainedR);
  let prevCumRetained = 0.0;
  const selectedSieves = rawSieves.map((s) => {
    const ratio = s.apertureMicrons / targetP80;
    const rawR = 100.0 * Math.exp(-kScale * Math.pow(ratio, rosinRammlerSlopeN));
    const cumulativeRetainedPct = Number(clamp(rawR, 0.1, 99.9, 20.0).toFixed(1));
    const retainedIndividualPct = Number(Math.max(0.1, cumulativeRetainedPct - prevCumRetained).toFixed(1));
    prevCumRetained = cumulativeRetainedPct;
    const cumulativePassingPct = Number((100.0 - cumulativeRetainedPct).toFixed(1));
    const rosinRammlerY = Number(Math.log10(Math.log10(100.0 / cumulativeRetainedPct)).toFixed(4));
    return {
      ...s,
      sieveNumber: s.mesh,
      frameMaterial: frameMaterialLabel,
      frameDiameterInches,
      cumulativeRetainedPct,
      retainedIndividualPct,
      cumulativePassingPct,
      rosinRammlerY,
      isPrimaryP80Control: s.mesh === primaryControlSieve.mesh
    };
  });

  return {
    targetP80Microns: targetP80,
    screeningMode: mode,
    wetScreeningRequired,
    frameDiameterInches,
    primaryControlMesh: primaryControlSieve.mesh,
    primaryApertureMicrons: primaryControlSieve.apertureMicrons,
    sieveStack: selectedSieves,
    recommendedSeries: selectedSieves.slice(0, 6),
    sieveStackSummary: selectedSieves.map((s) => `${s.mesh} (${s.apertureMicrons} µm)`).join(' ➔ '),
    rosinRammlerYPrime,
    rosinRammlerSlopeN,
    retainedPercentAtP80: retainedR,
    characteristicSizeD63Microns: Math.round(targetP80 * Math.pow(1.0 / kScale, 1.0 / rosinRammlerSlopeN)),
    recommendedFrameMaterialEs: requiresStainless
      ? `Marco y Malla en Acero Inoxidable Certificado ASTM E11 (${frameDiameterInches}") + Tapa y Cazuela`
      : `Marco en Bronce o Acero Inoxidable Certificado ASTM E11 (${frameDiameterInches}") + Tapa y Cazuela`,
    recommendedFrameMaterialEn: requiresStainless
      ? `ASTM E11 Certified Full Stainless Steel Frame & Cloth (${frameDiameterInches}") + Cover & Pan`
      : `ASTM E11 Certified Brass or Stainless Steel Frame (${frameDiameterInches}") + Cover & Pan`
  };
}

/**
 * Matriz Canónica Unificada de Materiales en Contacto Húmedo (Arbitrajes #5 y #8, INV-SMAT-SCI-01, INV-SMAT-SCI-09, INV-SMAT-SCI-13)
 * Discriminación pre-atentiva (<150 ms) por reflectancia óptica y límites tribológicos.
 */
export const WET_END_MATERIAL_MATRIX = {
  alto_cromo: {
    id: 'alto_cromo',
    key: 'alto_cromo_cr27',
    code: 'A05',
    nameEs: 'Alto Cromo 27% (≥ 650 HB)',
    nameEn: '27% High Chrome White Iron (≥ 650 HB)',
    visualCueEs: 'Acabado Metálico Maquinado / Esmalte Azul',
    visualCueEn: 'Machined Specular Metallic / Blue Enamel',
    swatchHex: '#1E3A8A',
    accentHex: '#64748B',
    hardness: '≥ 650 HB (60–62 HRC)',
    maxTipSpeedMs: 32.0,
    d80RangeMicrons: [150, 6000],
    phRange: [4.0, 12.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.75,
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Impulsor Cerrado 5 Álabes', 'Voluta Monolítica (1 pieza)', 'Cuello de Succión (Throatbush)', 'Plato Posterior (FPL Insert)'],
    partsIncludedEn: ['Closed 5-Vane Impeller', 'Monolithic Volute (1-piece)', 'Suction Throatbush', 'Frame Plate Liner Insert (FPL Insert)'],
    dutyApplicationEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    dutyApplicationEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.',
    idealForEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    idealForEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.'
  },
  alto_cromo_cr27: {
    id: 'alto_cromo',
    key: 'alto_cromo_cr27',
    code: 'A05',
    nameEs: 'Alto Cromo 27% (≥ 650 HB)',
    nameEn: '27% High Chrome White Iron (≥ 650 HB)',
    visualCueEs: 'Acabado Metálico Maquinado / Esmalte Azul',
    visualCueEn: 'Machined Specular Metallic / Blue Enamel',
    swatchHex: '#1E3A8A',
    accentHex: '#64748B',
    hardness: '≥ 650 HB (60–62 HRC)',
    maxTipSpeedMs: 32.0,
    d80RangeMicrons: [150, 6000],
    phRange: [4.0, 12.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.75,
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Impulsor Cerrado 5 Álabes', 'Voluta Monolítica (1 pieza)', 'Cuello de Succión (Throatbush)', 'Plato Posterior (FPL Insert)'],
    partsIncludedEn: ['Closed 5-Vane Impeller', 'Monolithic Volute (1-piece)', 'Suction Throatbush', 'Frame Plate Liner Insert (FPL Insert)'],
    dutyApplicationEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    dutyApplicationEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.',
    idealForEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    idealForEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.'
  },
  hule: {
    id: 'hule',
    key: 'hule_natural',
    code: 'R55',
    nameEs: 'Hule Natural Antiabrasivo (Shore A 55–65)',
    nameEn: 'Wear-Resistant Natural Rubber (Shore A 55–65)',
    visualCueEs: 'Elastómero Negro Mate Moldeado por Compresión',
    visualCueEn: 'Compression-Molded Matte Black Elastomer',
    swatchHex: '#18181B',
    accentHex: '#3F3F46',
    hardness: 'Shore A 55–65',
    maxTipSpeedMs: 24.5,
    d80RangeMicrons: [10, 150],
    phRange: [3.5, 11.0],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.85,
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor Revestido en Hule'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Rubber-Lined Impeller'],
    dutyApplicationEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    dutyApplicationEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.',
    idealForEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    idealForEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.'
  },
  hule_natural: {
    id: 'hule',
    key: 'hule_natural',
    code: 'R55',
    nameEs: 'Hule Natural Antiabrasivo (Shore A 55–65)',
    nameEn: 'Wear-Resistant Natural Rubber (Shore A 55–65)',
    visualCueEs: 'Elastómero Negro Mate Moldeado por Compresión',
    visualCueEn: 'Compression-Molded Matte Black Elastomer',
    swatchHex: '#18181B',
    accentHex: '#3F3F46',
    hardness: 'Shore A 55–65',
    maxTipSpeedMs: 24.5,
    d80RangeMicrons: [10, 150],
    phRange: [3.5, 11.0],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.85,
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor Revestido en Hule'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Rubber-Lined Impeller'],
    dutyApplicationEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    dutyApplicationEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.',
    idealForEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    idealForEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.'
  },
  poliuretano: {
    id: 'poliuretano',
    key: 'poliuretano',
    code: 'U01',
    nameEs: 'Poliuretano Elastómero (Shore A 85–95)',
    nameEn: 'Cast Polyurethane Elastomer (Shore A 85–95)',
    visualCueEs: 'Alta Cromaticidad Amarillo / Rojo Industrial',
    visualCueEn: 'High-Chroma Industrial Yellow / Red',
    swatchHex: '#EAB308',
    accentHex: '#DC2626',
    hardness: 'Shore A 85–95',
    maxTipSpeedMs: 26.0,
    d80RangeMicrons: [20, 350],
    phRange: [2.0, 11.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.80,
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor / Expulsor en Poliuretano'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Polyurethane Impeller / Expeller'],
    dutyApplicationEs: 'Baterías de hidrociclones, remolienda y pulpas finas a medias con alta velocidad superficial o pH ácido.',
    dutyApplicationEn: 'Hydrocyclone clusters, regrind duties, and fine-to-medium slurries with high velocity or acidic pH.',
    idealForEs: 'Baterías de hidrociclones, remolienda y pulpas finas a medias con alta velocidad superficial o pH ácido.',
    idealForEn: 'Hydrocyclone clusters, regrind duties, and fine-to-medium slurries with high velocity or acidic pH.'
  },
  ceramica_sic: {
    id: 'ceramica_sic',
    key: 'ceramica_sic',
    code: 'SiC',
    nameEs: 'Compuesto Cerámico Carburo de Silicio (SiC)',
    nameEn: 'Silicon Carbide (SiC) Ceramic Composite',
    visualCueEs: 'Matriz Gris Grafito Sinterizada',
    visualCueEn: 'Sintered Graphite-Gray Ceramic Matrix',
    swatchHex: '#334155',
    accentHex: '#0F172A',
    hardness: '≥ 2200 HV (Mohs 9.2)',
    maxTipSpeedMs: 30.0,
    d80RangeMicrons: [30, 800],
    phRange: [1.0, 13.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.65,
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Cuello de Succión SiC (Throatbush)', 'Voluta Compuesta SiC', 'Impulsor Alto Cromo / SiC'],
    partsIncludedEn: ['SiC Suction Throatbush', 'SiC Composite Volute', 'High Chrome / SiC Impeller'],
    dutyApplicationEs: 'Alimentación de alta presión a hidrociclones y pulpas de sílice extrema con pH agresivo.',
    dutyApplicationEn: 'High-pressure hydrocyclone feed and extreme silica slurries with aggressive pH.',
    idealForEs: 'Alimentación de alta presión a hidrociclones y pulpas de sílice extrema con pH agresivo.',
    idealForEn: 'High-pressure hydrocyclone feed and extreme silica slurries with aggressive pH.'
  }
};

export const WET_END_MATERIAL_KITS = WET_END_MATERIAL_MATRIX;

/**
 * Estaciones de Ensamble de una Bomba Centrífuga Horizontal para Lodos (Arbitraje #6, INV-SMAT-SCI-10)
 * Basado en Matrices de Interferencia Axial A_{I,-X} y Matriz de Soporte S (DOI: 10.1109/tase.2012.2235144).
 */
export const PUMP_ASSEMBLY_STATIONS = [
  {
    station: 1,
    stationNumber: 1,
    id: 'drive_end',
    nameEs: 'Estación 1: Extremo Motriz y Base Estructural',
    nameEn: 'Station 1: Drive End & Structural Frame',
    titleEs: 'Estación 1: Extremo Motriz y Base Estructural',
    titleEn: 'Station 1: Drive End & Structural Frame',
    descriptionEs: 'Bastidor con tornillo micrométrico y cartucho Bearing Assembly ISO 281.',
    descriptionEn: 'Base frame with micrometer screw and ISO 281 Bearing Assembly cartridge.',
    calibrationLawEs: 'Módulo sellado intercambiable (ISO 281 rodillos cónicos p = 10/3)',
    calibrationLawEn: 'Drop-in sealed cartridge module (ISO 281 tapered rollers p = 10/3)',
    partsEs: ['01. Bastidor / Cuna con Tornillo de Ajuste Axial (Frame)', '02. Conjunto Rodamiento Cilíndrico (Bearing Assembly / Housing)', '03. Plato Soporte Metálico (Frame Plate)'],
    partsEn: ['01. Base Frame with Axial Adjusting Screw', '02. Cylindrical Bearing Assembly / Housing', '03. Cast Iron Frame Plate'],
    roleId: 'soporte',
    lotRatioNoteEs: 'Módulo sellado intercambiable (ISO 281 rodillos cónicos p = 10/3)',
    lotRatioNoteEn: 'Drop-in sealed cartridge module (ISO 281 tapered rollers p = 10/3)'
  },
  {
    station: 2,
    stationNumber: 2,
    id: 'sealing_fork',
    nameEs: 'Estación 2: Bifurcación de Sellado Centrífugo (Sin Sello Mecánico)',
    nameEn: 'Station 2: Centrifugal Shaft Sealing Fork (Zero Mechanical Seal)',
    titleEs: 'Estación 2: Bifurcación de Sellado Centrífugo (Sin Sello Mecánico)',
    titleEn: 'Station 2: Centrifugal Shaft Sealing Fork (Zero Mechanical Seal)',
    descriptionEs: 'Camisa endurecida, anillo expulsor y turbina centrífuga seca o prensaestopa.',
    descriptionEn: 'Hardened shaft sleeve, expeller ring, and dry dynamic expeller or gland packing.',
    calibrationLawEs: 'Sellado centrífugo en seco para evitar dilución de pulpa y fallas por abrasión',
    calibrationLawEn: 'Dry centrifugal expeller seal prevents pulp dilution and abrasive seal failure',
    partsEs: ['04. Camisa de Flecha (Shaft Sleeve)', '05. Anillo Expulsor + Cámara Centrífuga (Expeller Ring)', '06. Expulsor Dinámico Seco (Expeller)', '07. Prensaestopa, Anillo Linterna y Empaquetadura PTFE/Grafito'],
    partsEn: ['04. Hardened Shaft Sleeve', '05. Expeller Ring & Chamber', '06. Dynamic Dry Expeller', '07. Gland Follower, Lantern Ring & Braided PTFE/Graphite Packing'],
    roleId: 'sello',
    lotRatioNoteEs: 'Sellado centrífugo en seco para evitar dilución de pulpa y fallas por abrasión',
    lotRatioNoteEn: 'Dry centrifugal expeller seal prevents pulp dilution and abrasive seal failure'
  },
  {
    station: 3,
    stationNumber: 3,
    id: 'wet_end_fork',
    nameEs: 'Estación 3: Bifurcación de Contacto Húmedo (Lote 5 – 5 – 4)',
    nameEn: 'Station 3: Bifurcated Wet-End Assembly (5 – 5 – 4 Wear Lot)',
    titleEs: 'Estación 3: Bifurcación de Contacto Húmedo (Lote 5 – 5 – 4)',
    titleEn: 'Station 3: Bifurcated Wet-End Assembly (5 – 5 – 4 Wear Lot)',
    descriptionEs: 'Rama A Metálica (Voluta Monolítica + FPL Insert) vs Rama B Elastómero (FPL + CPL).',
    descriptionEn: 'Branch A Metal (Monolithic Volute + FPL Insert) vs Branch B Elastomer (FPL + CPL).',
    calibrationLawEs: 'Rotación acoplada 5 Impulsores : 5 Throatbush : 4 Volutas/Liners',
    calibrationLawEn: 'Coupled wear rotation: 5 Impellers : 5 Throatbushes : 4 Volutes/Liners',
    partsEs: [
      '08A [Rama Metal]. Plato Posterior Metálico (FPL Insert)',
      '08B [Rama Hule/PU]. Forro Lado Soporte (Frame Plate Liner - FPL)',
      '09. Impulsor Cerrado de 5 Álabes (roscado en flecha tras montar 08A/08B)',
      '10A [Rama Metal]. Voluta Monolítica de Alto Cromo (1 sola pieza rígida)',
      '10B [Rama Hule/PU]. Forro Lado Succión (Cover Plate Liner - CPL)',
      '11. Cuello de Succión Cónico (Throatbush)'
    ],
    partsEn: [
      '08A [Metal Branch]. Frame Plate Liner Insert (FPL Insert)',
      '08B [Rubber/PU Branch]. Frame Plate Liner (FPL Rear Half)',
      '09. Closed 5-Vane Impeller (threaded onto shaft after mounting 08A/08B)',
      '10A [Metal Branch]. Monolithic High Chrome Volute (1-piece shell)',
      '10B [Rubber/PU Branch]. Cover Plate Liner (CPL Front Half)',
      '11. Tapered Suction Throatbush'
    ],
    roleId: 'revestimientos',
    lotRatioNoteEs: 'Rotación acoplada 5 Impulsores : 5 Throatbush : 4 Volutas/Liners',
    lotRatioNoteEn: 'Coupled wear rotation: 5 Impellers : 5 Throatbushes : 4 Volutes/Liners'
  },
  {
    station: 4,
    stationNumber: 4,
    id: 'suction_closure',
    nameEs: 'Estación 4: Cierre de Carcasa Bipartida y Succión',
    nameEn: 'Station 4: Split-Casing Closure & Suction Cover Plate',
    titleEs: 'Estación 4: Cierre de Carcasa Bipartida y Succión',
    titleEn: 'Station 4: Split-Casing Closure & Suction Cover Plate',
    descriptionEs: 'Asiento cónico del Throatbush y cierre con plato cubierta lado succión.',
    descriptionEn: 'Conical Throatbush seating and closure with suction-side Cover Plate.',
    calibrationLawEs: 'Torque cruzado simétrico de carcasa exterior',
    calibrationLawEn: 'Symmetrical cross-pattern torque on outer split casing',
    partsEs: ['12. Plato Cubierta Lado Succión (Cover Plate)', '13. Pernos Pasantes de Carcasa y Abrazadera de Descarga'],
    partsEn: ['12. Suction Side Cover Plate', '13. Casing Through-Bolts & Discharge Clamp'],
    roleId: 'skid_bomba',
    lotRatioNoteEs: 'Torque cruzado simétrico de carcasa exterior',
    lotRatioNoteEn: 'Symmetrical cross-pattern torque on outer split casing'
  },
  {
    station: 5,
    stationNumber: 5,
    id: 'axial_calibration',
    nameEs: 'Estación 5: Calibración Post-Armado de Claro Axial Frontal (δ = 0.5 – 1.0 mm)',
    nameEn: 'Station 5: Post-Assembly Front Axial Clearance Calibration (δ = 0.5 – 1.0 mm)',
    titleEs: 'Estación 5: Calibración Post-Armado de Claro Axial Frontal (δ = 0.5 – 1.0 mm)',
    titleEn: 'Station 5: Post-Assembly Front Axial Clearance Calibration (δ = 0.5 – 1.0 mm)',
    descriptionEs: 'Ajuste axial del Bearing Assembly para suprimir recirculación frontal.',
    descriptionEn: 'Axial Bearing Assembly adjustment to suppress front-shroud recirculation.',
    calibrationLawEs: 'Anula el vórtice de recirculación frontal Δην ∝ (δ/b2)^1.5',
    calibrationLawEn: 'Suppresses front-shroud recirculation vortex Δην ∝ (δ/b2)^1.5',
    partsEs: ['14. Tornillo Micrométrico del Bearing Assembly: avanzar conjunto hacia succión hasta contacto leve con Throatbush, retroceder 1/2 vuelta (0.5–1.0 mm) y fijar pernos de cuna'],
    partsEn: ['14. Bearing Assembly Adjusting Screw: advance cartridge toward suction until light rub against Throatbush, back off 1/2 turn (0.5–1.0 mm), and lock cradle bolts'],
    roleId: 'revestimientos',
    lotRatioNoteEs: 'Anula el vórtice de recirculación frontal Δην ∝ (δ/b2)^1.5',
    lotRatioNoteEn: 'Suppresses front-shroud recirculation vortex Δην ∝ (δ/b2)^1.5'
  }
];

export const PUMP_554_ASSEMBLY_STATIONS = PUMP_ASSEMBLY_STATIONS;

/**
 * Cédula Canónica Unificada de 14 Componentes del Despiece de Bomba Horizontal para Lodos (Estaciones 1 a 5)
 * Fuente única de verdad para PumpAssemblyReport.astro, QuoteWizard.astro y evaluación NIOSH (>= 23 kg).
 */
export const PUMP_554_BOM_14_PARTS = [
  {
    pos: '01',
    station: 'EST-01',
    stationNumber: 1,
    partKey: 'frame',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Soporte Base (Frame / Pedestal)',
    nameEn: 'Pump Frame / Pedestal Base',
    specEs: 'Cuna maquinada con tornillo de ajuste axial externo',
    specEn: 'Machined cradle with external axial adjusting screw',
    weightKgBySeries: { '3x2': 85.0, '6x4': 165.0, '8x6': 310.0 },
    weightKg: 165.0,
    nioshHoistRequired: true,
    equipo: 'soporte_rodamiento',
    pieza: 'frame_pedestal',
    material: 'acero_4140_iso281'
  },
  {
    pos: '02',
    station: 'EST-01',
    stationNumber: 1,
    partKey: 'bearing_assembly',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Cartucho Bearing Assembly (Eje + Rodamientos ISO 281)',
    nameEn: 'Bearing Assembly Cartridge (Shaft + ISO 281 Bearings)',
    specEs: 'Rodamientos cónicos espalda con espalda + retenes laberinto',
    specEn: 'Back-to-back tapered roller bearings + labyrinth seals',
    weightKgBySeries: { '3x2': 48.0, '6x4': 94.0, '8x6': 185.0 },
    weightKg: 94.0,
    nioshHoistRequired: true,
    equipo: 'soporte_rodamiento',
    pieza: 'bearing_assembly',
    material: 'acero_4140_iso281'
  },
  {
    pos: '03',
    station: 'EST-02',
    stationNumber: 2,
    partKey: 'shaft_sleeve',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Camisa Protectora de Eje (Shaft Sleeve) + O-Rings',
    nameEn: 'Hardened Shaft Sleeve + Seal O-Rings',
    specEs: 'Acero endurecido / recubrimiento cerámico en zona de sello',
    specEn: 'Hardened alloy / ceramic-coated sleeve in seal zone',
    weightKgBySeries: { '3x2': 4.2, '6x4': 7.8, '8x6': 14.5 },
    weightKg: 7.8,
    nioshHoistRequired: false,
    equipo: 'sello_expulsor',
    pieza: 'shaft_sleeve',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '04',
    station: 'EST-02',
    stationNumber: 2,
    partKey: 'expeller_ring',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Caja de Sello / Anillo Expulsor (Expeller Ring / Stuffing Box)',
    nameEn: 'Expeller Ring / Stuffing Box Housing',
    specEs: 'Cámara secundaria con grasera o anillo linterna',
    specEn: 'Secondary seal chamber with grease port or lantern ring',
    weightKgBySeries: { '3x2': 18.5, '6x4': 29.0, '8x6': 54.0 },
    weightKg: 29.0,
    nioshHoistRequired: true,
    equipo: 'sello_expulsor',
    pieza: 'expeller_ring',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '05',
    station: 'EST-02',
    stationNumber: 2,
    partKey: 'expeller_dry',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Expulsor Centrífugo Seco (Expeller)',
    nameEn: 'Centrifugal Dry Expeller',
    specEs: 'Turbina auxiliar que abate presión en estopera sin agua externa',
    specEn: 'Auxiliary rotor that relieves stuffing box pressure without water',
    weightKgBySeries: { '3x2': 9.5, '6x4': 16.5, '8x6': 31.0 },
    weightKg: 16.5,
    nioshHoistRequired: false,
    equipo: 'sello_expulsor',
    pieza: 'expeller_sello',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '06',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'frame_plate',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Carcasa Lado Soporte (Frame Plate)',
    nameEn: 'Frame Plate (Drive-Side Outer Casing)',
    specEs: 'Mitad estructural posterior en hierro nodular con espárragos',
    specEn: 'Rear ductile iron structural half-casing with mounting studs',
    weightKgBySeries: { '3x2': 62.0, '6x4': 128.0, '8x6': 245.0 },
    weightKg: 128.0,
    nioshHoistRequired: true,
    equipo: 'skid_bomba',
    pieza: 'frame_plate',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '07',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'fpl_insert',
    branch: 'alto_cromo_cr27',
    branchLabelEs: 'Rama A • Alto Cromo',
    branchLabelEn: 'Branch A • High Chrome',
    nameEs: 'Plato de Desgaste Posterior (Frame Plate Liner Insert — FPL Insert)',
    nameEn: 'Frame Plate Liner Insert (FPL Insert — Rear Wear Plate)',
    specEs: 'Aleación Cr27% ASTM A532 (≥650 HB) con pernos posteriores',
    specEn: 'ASTM A532 Cr27% (≥650 HB) rear wear plate with studs',
    weightKgBySeries: { '3x2': 24.0, '6x4': 48.0, '8x6': 96.0 },
    weightKg: 48.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'fpl_insert',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '08',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'frame_plate_liner',
    branch: 'hule_natural',
    branchLabelEs: 'Rama B • Hule / PU',
    branchLabelEn: 'Branch B • Rubber / PU',
    nameEs: 'Forro Posterior Vulcanizado (Frame Plate Liner — FPL)',
    nameEn: 'Molded Frame Plate Liner (FPL — Rubber or Polyurethane)',
    specEs: 'Hule Natural (55–65 Shore A) o Poliuretano con alma de acero',
    specEn: 'Natural Rubber (55–65 Shore A) or Polyurethane with steel backing',
    weightKgBySeries: { '3x2': 14.0, '6x4': 26.5, '8x6': 52.0 },
    weightKg: 26.5,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'liner_fpl',
    material: 'hule_natural'
  },
  {
    pos: '09',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'impeller',
    branch: 'common',
    branchLabelEs: 'Ambas Ramas (5-5-4)',
    branchLabelEn: 'Both Branches (5-5-4)',
    nameEs: 'Impulsor Cerrado de 5 Álabes (Closed Impeller)',
    nameEn: '5-Vane Closed Slurry Impeller',
    specEs: 'Con álabes expulsores posteriores; Alto Cromo ≥650 HB, Hule o PU',
    specEn: 'With back pump-out vanes; High Chrome ≥650 HB, Rubber, or PU',
    weightKgBySeries: { '3x2': 32.5, '6x4': 68.0, '8x6': 142.0 },
    weightKg: 68.0,
    nioshHoistRequired: true,
    equipo: 'impulsor_bomba',
    pieza: 'impulsor_5_alabes',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '10',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'monolithic_volute',
    branch: 'alto_cromo_cr27',
    branchLabelEs: 'Rama A • Alto Cromo',
    branchLabelEn: 'Branch A • High Chrome',
    nameEs: 'Voluta Monolítica (Metal Volute Liner)',
    nameEn: 'Monolithic High-Chrome Volute Liner',
    specEs: 'Caracol envolvente de 1 pieza en Alto Cromo Cr27% para molienda SAG',
    specEn: '1-piece Cr27% high-chrome scroll liner for coarse primary duty',
    weightKgBySeries: { '3x2': 78.0, '6x4': 162.0, '8x6': 320.0 },
    weightKg: 162.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'voluta_liners',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '11',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'cover_plate_liner',
    branch: 'hule_natural',
    branchLabelEs: 'Rama B • Hule / PU',
    branchLabelEn: 'Branch B • Rubber / PU',
    nameEs: 'Forro Frontal Lado Succión (Cover Plate Liner — CPL)',
    nameEn: 'Cover Plate Liner (CPL — Suction-Side Split Liner)',
    specEs: 'Mitad frontal en Hule Natural o Poliuretano que cierra la voluta con el FPL',
    specEn: 'Front elastomer half-liner that mates with FPL to form the volute',
    weightKgBySeries: { '3x2': 15.5, '6x4': 28.0, '8x6': 56.0 },
    weightKg: 28.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'liner_cpl',
    material: 'hule_natural'
  },
  {
    pos: '12',
    station: 'EST-04',
    stationNumber: 4,
    partKey: 'throatbush',
    branch: 'common',
    branchLabelEs: 'Ambas Ramas (5-5-4)',
    branchLabelEn: 'Both Branches (5-5-4)',
    nameEs: 'Cuello / Anillo de Desgaste de Succión (Throatbush)',
    nameEn: 'Suction Wear Ring (Throatbush)',
    specEs: 'Cara cónica frontal de sacrificio; controla recirculación con el impulsor',
    specEn: 'Conical front wear face; controls suction eye recirculation',
    weightKgBySeries: { '3x2': 21.0, '6x4': 44.0, '8x6': 88.0 },
    weightKg: 44.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'throatbush',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '13',
    station: 'EST-04',
    stationNumber: 4,
    partKey: 'cover_plate',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Tapa Carcasa Lado Succión + Pernos (Cover Plate & Clamp Bolts)',
    nameEn: 'Suction Cover Plate & Casing Clamp Bolts',
    specEs: 'Mitad frontal bridada con orejas de izaje y espárragos pasantes',
    specEn: 'Flanged suction outer casing half with lifting lugs and clamp bolts',
    weightKgBySeries: { '3x2': 58.0, '6x4': 118.0, '8x6': 230.0 },
    weightKg: 118.0,
    nioshHoistRequired: true,
    equipo: 'skid_bomba',
    pieza: 'cover_plate',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '14',
    station: 'EST-05',
    stationNumber: 5,
    partKey: 'axial_clearance_adjustment',
    branch: 'common',
    branchLabelEs: 'Lote Completo',
    branchLabelEn: 'Complete Kit',
    nameEs: 'Lote Húmedo Sincronizado 5-5-4 (5 Juegos Liners + 5 Impulsores + 4 Sellos)',
    nameEn: 'Synchronized 5-5-4 Wet-End Kit (5 Liner Sets + 5 Impellers + 4 Seals)',
    specEs: 'Suministro programado por campaña con calibración δ = 0.5–1.0 mm',
    specEn: 'Campaign-synchronized wet-end lot with δ = 0.5–1.0 mm calibration',
    weightKgBySeries: { '3x2': 680.0, '6x4': 1410.0, '8x6': 2850.0 },
    weightKg: 1410.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'lote_554',
    material: 'alto_cromo_cr27'
  }
];

/**
 * Evalúa la validez cinemática de una secuencia de armado de bomba de lodos y cuantifica
 * el impacto del claro axial frontal δ_frontal sobre la eficiencia volumétrica y vida del lote 5-5-4.
 * Referencias: HyperbolicCurve/Assembly-sequence-planning-algorithm (SHA-256: 8dc91ac2...fb90867c35)
 * y Gandhi et al. (2001, DOI: 10.1115/1.1366322).
 *
 * @param {Object} params
 * @param {string} [params.wetEndBranch='metal']
 * @param {string} [params.sealBranch='expeller_dry']
 * @param {number} [params.frontClearanceMm=0.75] - Claro axial frontal δ_frontal entre impulsor y throatbush (mm)
 * @param {number} [params.rearClearanceMm=2.5] - Claro axial posterior δ_posterior (mm)
 * @param {number} [params.impellerDiameterMm=380] - Diámetro exterior del impulsor D2 (mm)
 * @param {number} [params.impellerExitWidthMm=48] - Ancho de salida del impulsor b2 (mm)
 * @param {string[]} [params.customOrder] - Secuencia opcional de piezas para verificar colisiones geométricas Ng
 * @param {Array<number|string>} [params.attemptedStationOrder] - Orden opcional de estaciones [1, 2, 3, 4, 5]
 * @param {string} [params.sequencePreset='canonical'] - Preset de secuencia ('canonical' | 'impeller_before_rear_liner' | 'cover_before_throatbush')
 * @param {string} [params.pipeSeries='6x4'] - Serie de bomba ('3x2', '6x4', '8x6') para cálculo de masa NIOSH
 */
export function evaluatePumpAssemblySequence(params = {}) {
  const opts = typeof params === 'number' ? { frontClearanceMm: params } : (params || {});
  const branchRaw = String(opts.wetEndBranch || 'metal').toLowerCase();
  const isElastomer = branchRaw === 'rubber' || branchRaw === 'hule' || branchRaw === 'polyurethane' || branchRaw === 'poliuretano';
  const wetEndBranch = isElastomer ? (branchRaw.includes('poly') || branchRaw.includes('poli') ? 'polyurethane' : 'rubber') : 'metal';
  const sealBranch = opts.sealBranch === 'gland_water' ? 'gland_water' : 'expeller_dry';

  const clearanceMm = clamp(opts.frontClearanceMm, 0.1, 8.0, 0.75);
  const b2Mm = clamp(opts.impellerExitWidthMm, 15.0, 180.0, 48.0);
  const seriesRaw = String(opts.pipeSeries || '6x4').toLowerCase();
  const seriesKey = (seriesRaw.includes('3x2') || seriesRaw.includes('4x3') || seriesRaw.includes('1.5x1'))
    ? '3x2'
    : ((seriesRaw.includes('8x6') || seriesRaw.includes('10x8')) ? '8x6' : '6x4');

  // Secuencia canónica libre de interferencias (Ng = 0, Ns = 0)
  const canonicalSequence = wetEndBranch === 'metal'
    ? ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'fpl_insert', 'impeller', 'monolithic_volute', 'throatbush', 'cover_plate', 'axial_clearance_adjustment']
    : ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'frame_plate_liner', 'impeller', 'cover_plate_liner', 'throatbush', 'cover_plate', 'axial_clearance_adjustment'];

  let sequenceToTest = Array.isArray(opts.customOrder) && opts.customOrder.length > 0
    ? opts.customOrder
    : canonicalSequence;

  // Evaluar orden de estaciones si se provee attemptedStationOrder (ej. [1, 2, 3, 4, 5] o preset de prueba)
  let outOfOrderStationId = null;
  const collisionDetailsEs = [];
  const collisionDetailsEn = [];

  if (Array.isArray(opts.attemptedStationOrder) && opts.attemptedStationOrder.length > 0) {
    const normalizedStations = opts.attemptedStationOrder.map((s) => {
      const numMatch = String(s).match(/\d+/);
      return numMatch ? Number(numMatch[0]) : Number(s);
    });
    for (let i = 0; i < normalizedStations.length; i++) {
      if (normalizedStations[i] !== i + 1) {
        outOfOrderStationId = `EST-0${normalizedStations[i]}`;
        break;
      }
    }
    if (outOfOrderStationId) {
      collisionDetailsEs.push(`Estación fuera de secuencia axial (${outOfOrderStationId}): debe respetarse la precedencia EST-01 ➔ EST-02 ➔ EST-03 ➔ EST-04 ➔ EST-05.`);
      collisionDetailsEn.push(`Out-of-order axial station (${outOfOrderStationId}): must follow EST-01 ➔ EST-02 ➔ EST-03 ➔ EST-04 ➔ EST-05 precedence.`);
    }
  } else if (typeof opts.sequencePreset === 'string' && opts.sequencePreset !== 'canonical') {
    if (opts.sequencePreset === 'impeller_before_rear_liner') {
      outOfOrderStationId = 'EST-02';
      const rearPart = wetEndBranch === 'metal' ? 'fpl_insert' : 'frame_plate_liner';
      sequenceToTest = ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'impeller', rearPart, 'throatbush', 'cover_plate', 'axial_clearance_adjustment'];
    } else if (opts.sequencePreset === 'cover_before_throatbush') {
      outOfOrderStationId = 'EST-04';
      const rearPart = wetEndBranch === 'metal' ? 'fpl_insert' : 'frame_plate_liner';
      sequenceToTest = ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, rearPart, 'impeller', 'cover_plate', 'throatbush', 'axial_clearance_adjustment'];
    }
  }

  // Verificación de Matriz de Interferencia Axial A_{I,-X} y Soporte S:
  // 1) El plato posterior (fpl_insert o frame_plate_liner) y el sello deben montarse ANTES de roscar el impulsor (D2 > D_hub).
  // 2) El impulsor debe roscarse ANTES de cerrar la voluta/cover_plate_liner y el throatbush.
  let geometricInterferencesNg = outOfOrderStationId ? 1 : 0;
  let unstableSubassembliesNs = 0;

  const idxImpeller = sequenceToTest.indexOf('impeller');
  const idxRearLiner = sequenceToTest.indexOf(wetEndBranch === 'metal' ? 'fpl_insert' : 'frame_plate_liner');
  const idxThroatbush = sequenceToTest.indexOf('throatbush');
  const idxFramePlate = sequenceToTest.indexOf('frame_plate');
  const idxCoverPlate = sequenceToTest.indexOf('cover_plate');

  if (idxImpeller !== -1 && idxRearLiner !== -1 && idxImpeller < idxRearLiner) {
    geometricInterferencesNg += 1; // Colisión axial: el plato posterior no puede atravesar el diámetro exterior del impulsor D2
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-03';
    collisionDetailsEs.push('Colisión axial A_{I,-X} en EST-03: El plato posterior (FPL Insert / Liner FPL) no puede atravesar el diámetro exterior ØD₂ del impulsor ya roscado.');
    collisionDetailsEn.push('Axial collision A_{I,-X} in EST-03: Rear wear plate (FPL Insert / FPL Liner) cannot pass over the outer diameter ØD₂ of an already-threaded impeller.');
  }
  if (idxImpeller !== -1 && idxThroatbush !== -1 && idxThroatbush < idxImpeller) {
    geometricInterferencesNg += 1; // Colisión axial: el cuello cierra el acceso frontal al impulsor
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-04';
    collisionDetailsEs.push('Colisión axial A_{I,-X} en EST-03/04: El cuello de succión (Throatbush) bloquea el ingreso frontal del impulsor.');
    collisionDetailsEn.push('Axial collision A_{I,-X} in EST-03/04: Suction Throatbush blocks frontal insertion of the impeller.');
  }
  if (idxRearLiner !== -1 && idxFramePlate !== -1 && idxRearLiner < idxFramePlate) {
    unstableSubassembliesNs += 1; // Operación inestable: liner sin plato soporte rígido previo
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-03';
    collisionDetailsEs.push('Subensamble inestable S en EST-03: No se puede fijar el plato/forro posterior sin montar antes la carcasa lado soporte (Frame Plate #06).');
    collisionDetailsEn.push('Unstable subassembly S in EST-03: Rear wear plate/liner cannot be anchored before mounting the drive-side Frame Plate (#06).');
  }
  if (idxCoverPlate !== -1 && idxThroatbush !== -1 && idxCoverPlate < idxThroatbush) {
    geometricInterferencesNg += 1; // Colisión: Cover Plate bloquea inserción del Throatbush
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-04';
    collisionDetailsEs.push('Colisión axial A_{I,-X} en EST-04: La tapa de succión (Cover Plate #13) impide asentar el Throatbush (#12) desde el interior.');
    collisionDetailsEn.push('Axial collision A_{I,-X} in EST-04: Closing the Suction Cover Plate (#13) first blocks internal seating of the Throatbush (#12).');
  }

  // Filtrar las piezas activas del BOM de 14 componentes (excluyendo la posición #14 de lote de campaña para la masa de 1 bomba armada)
  const targetBranchFilter = wetEndBranch === 'metal' ? 'alto_cromo_cr27' : 'hule_natural';
  const selectedPartSpec = PUMP_554_BOM_14_PARTS
    .filter((item) => item.branch === 'common' || item.branch === targetBranchFilter)
    .map((item) => {
      const seriesMass = item.weightKgBySeries?.[seriesKey] ?? item.weightKg;
      const hoistReq = seriesMass >= 23.0;
      return {
        ...item,
        activeSeries: seriesKey,
        activeWeightKg: seriesMass,
        activeNioshHoistRequired: hoistReq
      };
    });

  const singlePumpParts = selectedPartSpec.filter((item) => item.pos !== '14');
  const totalAssemblyMassKg = Number(singlePumpParts.reduce((acc, item) => acc + item.activeWeightKg, 0).toFixed(1));
  const nioshHoistPartsCount = singlePumpParts.filter((item) => item.activeNioshHoistRequired).length;
  const sequenceValid = geometricInterferencesNg === 0 && unstableSubassembliesNs === 0 && outOfOrderStationId === null;

  // Ley de pérdida volumétrica por recirculación en el claro frontal: Δην = kr * (δ / b2)^1.5 (Gandhi et al., 2001; Arbitraje #9 DOI: 10.1063/5.0331598)
  const kr = 2.85;
  const volumetricLossFraction = kr * Math.pow(clearanceMm / b2Mm, 1.5);
  const volumetricEfficiencyDropPct = Number(Math.min(45.0, volumetricLossFraction * 100).toFixed(2));
  const baselineDropPct = Number((kr * Math.pow(0.75 / b2Mm, 1.5) * 100).toFixed(2));
  const excessRecirculationRatio = Number((volumetricEfficiencyDropPct / Math.max(0.1, baselineDropPct)).toFixed(2));

  const clearanceStatus = clearanceMm >= 0.5 && clearanceMm <= 1.0
    ? 'OPTIMAL_CALIBRATION'
    : (clearanceMm < 0.5 ? 'RUBBING_RISK' : 'EXCESS_RECIRCULATION_WEAR');

  // Impacto acoplado en la rotación del Lote 5-5-4 y en el margen de velocidad crítica en tubería (INV-SMAT-SCI-12)
  let wearRatioImpact554 = '5:5:4 (Rotación acoplada nominal)';
  let wearRatioImpact554En = '5:5:4 (Coupled nominal wear lot)';
  if (clearanceMm < 0.5) {
    wearRatioImpact554 = 'Riesgo de fricción axial Impulsor-Throatbush (< 0.5 mm)';
    wearRatioImpact554En = 'Axial rubbing risk Impeller-Throatbush (< 0.5 mm)';
  } else if (clearanceMm > 2.0) {
    wearRatioImpact554 = '5:9:4 (Vórtice severo: consume ~9 Throatbushes por lote)';
    wearRatioImpact554En = '5:9:4 (Severe vortex: consumes ~9 Throatbushes per lot)';
  } else if (clearanceMm > 1.0) {
    wearRatioImpact554 = '5:7:4 (Aceleración de desgaste en Throatbush +40%)';
    wearRatioImpact554En = '5:7:4 (Accelerated Throatbush wear +40%)';
  }

  const pipeVelocityMarginLossPct = Number((volumetricEfficiencyDropPct * 0.85).toFixed(2));

  return {
    wetEndBranch,
    sealBranch,
    pipeSeries: seriesKey,
    stations: PUMP_ASSEMBLY_STATIONS,
    bomParts: PUMP_554_BOM_14_PARTS,
    selectedPartSpec,
    totalAssemblyMassKg,
    nioshHoistPartsCount,
    canonicalSequence,
    geometricInterferencesNg,
    unstableSubassembliesNs,
    isValidAssembly: sequenceValid,
    sequenceValid,
    outOfOrderStationId,
    collisionDetailsEs,
    collisionDetailsEn,
    collisionRiskEs: sequenceValid
      ? 'Secuencia axial libre de colisiones geométricas (Ng = 0, Ns = 0)'
      : `SECUENCIA INVÁLIDA (${outOfOrderStationId}): ${collisionDetailsEs.join(' ')}`,
    collisionRiskEn: sequenceValid
      ? 'Axial sequence free of geometric collisions (Ng = 0, Ns = 0)'
      : `INVALID SEQUENCE (${outOfOrderStationId}): ${collisionDetailsEn.join(' ')}`,
    frontClearanceMm: clearanceMm,
    impellerExitWidthMm: b2Mm,
    optimalClearanceBandMm: [0.5, 1.0],
    volumetricEfficiencyDropPct,
    volumetricLossPct: volumetricEfficiencyDropPct,
    volumetricEfficiencyLossPct: volumetricEfficiencyDropPct,
    volumetricEffLossPct: volumetricEfficiencyDropPct,
    excessRecirculationRatio,
    clearanceStatus,
    wearRatioImpact554,
    wearRatioImpact554En,
    pipeVelocityMarginLossPct,
    structuralReasonEs: wetEndBranch === 'metal'
      ? 'El alto cromo (≥650 HB) posee módulo elástico E ≈ 210 GPa y soporta esfuerzos de membrana en succión como Voluta Monolítica de 1 pieza + FPL Insert posterior + Throatbush frontal.'
      : 'El hule/poliuretano (E ≈ 0.01–0.05 GPa) requiere respaldo metálico continuo contra colapso por vacío en el ojo de succión, dividiendo la carcasa húmeda en 2 mitades simétricas (Frame Plate Liner + Cover Plate Liner) + Throatbush.',
    structuralReasonEn: wetEndBranch === 'metal'
      ? 'High chrome white iron (≥650 HB, E ≈ 210 GPa) resists suction vacuum hoop stresses as a 1-piece Monolithic Volute + rear FPL Insert + front Throatbush.'
      : 'Elastomers (rubber/polyurethane, E ≈ 0.01–0.05 GPa) require continuous split-casing metal backing against suction vacuum buckling, using 2 symmetrical halves (Frame Plate Liner + Cover Plate Liner) + Throatbush.'
  };
}

export const evaluateWetEndAssemblyInterference = evaluatePumpAssemblySequence;

/**
 * Catálogo de los 4 Arreglos Cinemáticos de Transmisión para Bombas de Lodos (Arbitraje #7, INV-SMAT-SCI-11)
 * Referencias visuales Don Manuel: ref2_cv_transmission.jpg (CV) y ref3_how_it_works.jpg (ZVZ/CRZ).
 */
export const DRIVE_ARRANGEMENT_CATALOG = {
  CV: {
    code: 'CV',
    nameEs: 'Arreglo CV (Motor Superior / Overhead sobre Bearing Assembly)',
    nameEn: 'CV Arrangement (Overhead Motor Mounted Above Bearing Assembly)',
    footprintFactor: 0.55,
    sumpFloodImmunity: true,
    beltDriven: true,
    maxRecommendedMotorKw: 75,
    descriptionEs: 'Montaje compacto con motor elevado sobre cuna superior del Bearing Assembly y guarda amarilla/naranja. Ahorra 45% de huella en piso y protege al motor eléctrico de derrames e inundaciones de pulpa en trincheras.',
    descriptionEn: 'Compact overhead motor cradle mounted above the Bearing Assembly. Saves 45% floor space and protects the electric motor from sump slurry spills and flooding.',
    applicationEs: 'Montaje compacto con motor elevado sobre cuna superior del Bearing Assembly y guarda amarilla/naranja. Ahorra 45% de huella en piso y protege al motor eléctrico de derrames e inundaciones de pulpa en trincheras.',
    applicationEn: 'Compact overhead motor cradle mounted above the Bearing Assembly. Saves 45% floor space and protects the electric motor from sump slurry spills and flooding.'
  },
  ZVZ: {
    code: 'ZVZ',
    nameEs: 'Arreglo ZVZ (Motor Trasero Elevado sobre Bastidor Común)',
    nameEn: 'ZVZ Arrangement (Elevated Rear Motor on Shared Base Frame)',
    footprintFactor: 0.85,
    sumpFloodImmunity: true,
    beltDriven: true,
    maxRecommendedMotorKw: 315,
    descriptionEs: 'Motor montado sobre pedestal posterior elevado detrás del Bearing Assembly con transmisión por bandas en V. Ideal para potencias medias y altas manteniendo el motor por encima del nivel de inundación del foso.',
    descriptionEn: 'Motor mounted on an elevated rear pedestal behind the Bearing Assembly with V-belt drive. Ideal for medium-to-high horsepower while keeping the motor above sump flood level.',
    applicationEs: 'Motor montado sobre pedestal posterior elevado detrás del Bearing Assembly con transmisión por bandas en V. Ideal para potencias medias y altas manteniendo el motor por encima del nivel de inundación del foso.',
    applicationEn: 'Motor mounted on an elevated rear pedestal behind the Bearing Assembly with V-belt drive. Ideal for medium-to-high horsepower while keeping the motor above sump flood level.'
  },
  CRZ: {
    code: 'CRZ',
    nameEs: 'Arreglo CRZ / Banda Lateral (Motor Lateral en Bastidor Compartido)',
    nameEn: 'CRZ / CR Arrangement (Side-by-Side Belt Drive on Shared Skid)',
    footprintFactor: 1.0,
    sumpFloodImmunity: false,
    beltDriven: true,
    maxRecommendedMotorKw: 560,
    descriptionEs: 'Motor colocado paralelamente al costado de la bomba sobre base estructural de acero con rieles tensores. Facilita el cambio rápido de poleas (H ∝ N²) para compensar desgaste del impulsor.',
    descriptionEn: 'Motor mounted side-by-side next to the pump on a heavy structural skid with slide rails. Enables rapid sheave ratio changes (H ∝ N²) to compensate for impeller wear.',
    applicationEs: 'Motor colocado paralelamente al costado de la bomba sobre base estructural de acero con rieles tensores. Facilita el cambio rápido de poleas (H ∝ N²) para compensar desgaste del impulsor.',
    applicationEn: 'Motor mounted side-by-side next to the pump on a heavy structural skid with slide rails. Enables rapid sheave ratio changes (H ∝ N²) to compensate for impeller wear.'
  },
  DC: {
    code: 'DC',
    nameEs: 'Arreglo DC (Acoplamiento Directo Flexible Colineal)',
    nameEn: 'DC Arrangement (In-Line Direct Flexible Coupling)',
    footprintFactor: 1.15,
    sumpFloodImmunity: false,
    beltDriven: false,
    maxRecommendedMotorKw: 1000,
    descriptionEs: 'Acoplamiento colineal directo entre motor (con variador de frecuencia VFD) y la flecha del Bearing Assembly. Cero carga radial de bandas sobre los rodamientos (Fr = 0).',
    descriptionEn: 'Collinear direct coupling between motor (with VFD speed control) and Bearing Assembly shaft. Zero V-belt radial overhung load on bearings (Fr = 0).',
    applicationEs: 'Acoplamiento colineal directo entre motor (con variador de frecuencia VFD) y la flecha del Bearing Assembly. Cero carga radial de bandas sobre los rodamientos (Fr = 0).',
    applicationEn: 'Collinear direct coupling between motor (with VFD speed control) and Bearing Assembly shaft. Zero V-belt radial overhung load on bearings (Fr = 0).'
  }
};

/**
 * Calcula la cinemática de transmisión por poleas (CV / ZVZ / CRZ / DC), la velocidad periférica
 * del impulsor u2 (m/s) y la vida nominal ISO 281 L10h del Bearing Assembly con rodamientos de rodillos (p = 10/3).
 * Referencias Kernel: bijankle/Slurry-Pump-Calc (engine.js), cozy51/BearingLifeCalculator (bearingLife.ts)
 * y RishiNxp/Belt-Pulley-Calculator (drive.ts).
 *
 * @param {Object} [params]
 * @param {'CV'|'ZVZ'|'CRZ'|'DC'|string} [params.arrangement='CV']
 * @param {'CV'|'ZVZ'|'CRZ'|'DC'|string} [params.arrangementCode]
 * @param {number} [params.motorRpm=1780] - Velocidad nominal del motor eléctrico (4 polos 60 Hz = 1780 RPM)
 * @param {number} [params.driverPulleyMm=180] - Diámetro de paso de polea motriz (motor, mm)
 * @param {number} [params.drivenPulleyMm=320] - Diámetro de paso de polea conducida (bomba, mm)
 * @param {number} [params.impellerDiameterMm=380] - Diámetro exterior del impulsor D2 (mm)
 * @param {number} [params.shaftPowerKw=45] - Potencia en la flecha P (kW)
 * @param {number} [params.motorPowerKw] - Alias de potencia nominal de motor (kW)
 * @param {number} [params.dynamicCapacityCkN=195] - Capacidad de carga dinámica C del Bearing Assembly (kN)
 * @param {string} [params.wetEndMaterial] - Material húmedo para verificar límite térmico viscoelástico
 */
export function calculateDriveAndBearingKinematics(params = {}) {
  const arrKey = String(params.arrangement || params.arrangementCode || 'CV').toUpperCase();
  const arrangementInfo = DRIVE_ARRANGEMENT_CATALOG[arrKey] || DRIVE_ARRANGEMENT_CATALOG.CV;

  const motorRpm = clamp(params.motorRpm, 600, 3600, 1780);
  const driverMm = clamp(params.driverPulleyMm, 80, 900, 180);
  const drivenMm = clamp(params.drivenPulleyMm, 80, 1400, 320);
  const impellerMm = clamp(params.impellerDiameterMm, 120, 1100, 380);
  const powerKw = clamp(params.shaftPowerKw ?? params.motorPowerKw, 2.2, 750, 45);
  const capacityCkN = clamp(params.dynamicCapacityCkN, 45, 950, 195);

  const speedMultiplier = arrangementInfo.beltDriven ? Number((driverMm / drivenMm).toFixed(4)) : 1.0;
  const reductionRatio = arrangementInfo.beltDriven ? Number((drivenMm / driverMm).toFixed(4)) : 1.0;
  const pumpRpm = Math.round(motorRpm * speedMultiplier);

  // Velocidad periférica del impulsor: u2 = (π * D_imp * N) / 60 (bijankle/Slurry-Pump-Calc)
  const tipSpeedMs = Number(((Math.PI * (impellerMm * 1e-3) * pumpRpm) / 60.0).toFixed(2));

  // Tensión y carga radial de bandas en V sobre el voladizo del Bearing Assembly: Fr = kb * (9550 * P_kW) / (N * R_pulley_m)
  const kbBeltFactor = arrangementInfo.beltDriven ? 2.5 : 0.0;
  const drivenRadiusM = (drivenMm * 1e-3) / 2.0;
  const beltRadialLoadKn = arrangementInfo.beltDriven
    ? Number(((kbBeltFactor * 9550.0 * powerKw) / (Math.max(100, pumpRpm) * drivenRadiusM * 1000.0)).toFixed(2))
    : 0.0;

  // Carga dinámica equivalente P (kN) sobre rodamientos de rodillos cónicos (empuje hidráulico + carga radial de polea)
  const hydraulicThrustKn = Number((0.18 * powerKw).toFixed(2));
  const equivalentLoadPkN = Number(Math.max(4.5, beltRadialLoadKn + 1.5 * hydraulicThrustKn).toFixed(2));

  // Vida nominal ISO 281 para rodamientos de rodillos (exponente p = 10/3, cozy51/BearingLifeCalculator)
  const rollerExponent = 10.0 / 3.0;
  const l10MillionRevs = Math.pow(capacityCkN / equivalentLoadPkN, rollerExponent);
  const bearingL10Hours = Math.round((1_000_000.0 / (60.0 * Math.max(100, pumpRpm))) * l10MillionRevs);

  const rubberSafeTipSpeed = tipSpeedMs <= WET_END_MATERIAL_MATRIX.hule.maxTipSpeedMs;
  const matRaw = String(params.wetEndMaterial || params.materialKey || '').toLowerCase();
  const isRubberSelected = matRaw.includes('hule') || matRaw.includes('rubber') || matRaw === 'r55';
  const rubberThermalLimitExceeded = isRubberSelected && !rubberSafeTipSpeed;

  return {
    arrangement: arrangementInfo.code,
    arrangementCode: arrangementInfo.code,
    arrangementNameEs: arrangementInfo.nameEs,
    arrangementNameEn: arrangementInfo.nameEn,
    sumpFloodImmunity: arrangementInfo.sumpFloodImmunity,
    sumpFloodImmunityEn: arrangementInfo.sumpFloodImmunity ? 'Elevated Motor (Splash Immune)' : 'Baseplate Level',
    footprintFactor: arrangementInfo.footprintFactor,
    motorRpm,
    driverPulleyMm: driverMm,
    drivenPulleyMm: drivenMm,
    shaftPowerKw: powerKw,
    dynamicCapacityCkN: capacityCkN,
    wetEndMaterial: matRaw || 'alto_cromo_cr27',
    pumpRpm,
    speedMultiplier,
    reductionRatio,
    impellerDiameterMm: impellerMm,
    tipSpeedMs,
    impellerTipSpeedMs: tipSpeedMs,
    rubberSafeTipSpeed,
    rubberThermalLimitExceeded,
    recommendedWetMaterialByTipSpeed: rubberSafeTipSpeed ? 'Hule Natural / Poliuretano / Alto Cromo' : 'Exclusivo Alto Cromo ≥ 650 HB (u2 > 24.5 m/s)',
    beltRadialLoadKn,
    radialBeltLoadKn: beltRadialLoadKn,
    equivalentLoadPkN,
    bearingL10Hours,
    estimatedBearingL10h: bearingL10Hours,
    estimatedL10hHours: bearingL10Hours
  };
}

export const DRIVE_ARRANGEMENTS = DRIVE_ARRANGEMENT_CATALOG;
export const calculateDriveKinematics = calculateDriveAndBearingKinematics;
export const calculateMarcyScale = calculateMarcyScaleReading;

/**
 * Compuerta Soberana de Plausibilidad Física y Límites de Rechazo Técnico (Decisión 3 / INV-SMAT-GTE-001 + data/trust.json)
 * Espejo determinista 1:1 en JS de validate_plant_lead_input (crates/smat-gate/src/lib.rs) sin bloquear leads exploratorios.
 * @param {Object} params
 */
export function validatePlantLeadInput(params = {}) {
  const cw = Number(params.cwPct ?? params.solidsWeightPercent ?? params.solids_cw ?? 45);
  const d80 = Number(params.d80Microns ?? params.particleSizeD80Microns ?? params.d80_um ?? 180);
  const flow = Number(params.flowM3h ?? params.flowM3H ?? params.flow_m3h ?? 180);
  const ph = Number(params.pulpPh ?? params.pH ?? params.ph ?? 7.5);
  const alt = Number(params.altitudeM ?? params.altitude_msnm ?? 2200);
  const tempC = Number(params.tempC ?? params.temperatureC ?? 35);
  const claroMm = Number(params.frontClearanceMm ?? params.claro_mm ?? 0.75);
  const tipSpeedMs = Number(params.tipSpeedMs ?? params.u2_ms ?? 19.9);
  const materialRaw = String(params.wetMaterial ?? params.material ?? params.recommendedMaterial ?? 'A05').toLowerCase();
  const companyRaw = String(params.company ?? params.company_name ?? '').trim();
  const hasPartCodeOrDims = Boolean(
    params.smat_code ||
    params.atomic_code ||
    params.dim_outer_dia ||
    params.dim_shaft_bore ||
    params.pipe_size
  );

  const warnings = [];
  if (cw <= 0 || cw > 78) {
    warnings.push(`Concentración Cw (${cw}%) fuera de envolvente física de bombeo centrífugo (1% - 78%).`);
  }
  if (d80 < 5 || d80 > 6000) {
    warnings.push(`Granulometría d80 (${d80} µm) fuera de dominio metrológico estándar (5 - 6000 µm).`);
  }
  if (flow < 1 || flow > 5000) {
    warnings.push(`Caudal Q (${flow} m³/h) fuera de rango nominal de serie SMAT (1 - 5000 m³/h).`);
  }
  if (ph < 0.5 || ph > 14.0) {
    warnings.push(`pH (${ph}) fuera de escala química acuosa (0.5 - 14.0).`);
  }
  if (alt < 0 || alt > 5000) {
    warnings.push(`Altitud (${alt} msnm) fuera de envolvente orográfica minera (0 - 5000 msnm).`);
  }

  // Evaluación causal de los 3 Límites de Rechazo Técnico (data/trust.json)
  let activeTrustBoundaryId = null;
  let activeTrustBoundaryTitleEs = '';
  let activeTrustBoundaryReasonEs = '';

  const isRubber = materialRaw.includes('hule') || materialRaw.includes('rubber') || materialRaw === 'r55';
  if (isRubber && (ph < 1.5 || tempC > 110 || d80 > 600)) {
    activeTrustBoundaryId = 'bound-ph-temp';
    activeTrustBoundaryTitleEs = 'Límite Técnico (bound-ph-temp): Químicos o Temperatura Extrema en Hule Natural';
    activeTrustBoundaryReasonEs = `Con pH ${ph.toFixed(1)}, T=${tempC}°C o d80=${Math.round(d80)} µm, el hule natural sufre degradación o desgarre prematuro. Se recomienda migrar a Aleación Especial / Alto Cromo A05 o Poliuretano U01.`;
  } else if (claroMm < 0.35 || (isRubber && tipSpeedMs > 24.5) || tipSpeedMs > 29.5) {
    activeTrustBoundaryId = 'bound-unapproved-mods';
    activeTrustBoundaryTitleEs = 'Límite Técnico (bound-unapproved-mods): Interferencia Mecánica o Sobrecarga Cinemática';
    activeTrustBoundaryReasonEs = claroMm < 0.35
      ? `Claro axial δ=${claroMm.toFixed(2)} mm inferior al umbral de dilatación térmica (0.35 mm): riesgo inminente de amarre frontal contra placa de succión.`
      : `Velocidad periférica u₂=${tipSpeedMs.toFixed(1)} m/s excede el límite endotérmico seguro del revestimiento seleccionado.`;
  } else if (!hasPartCodeOrDims && Boolean(params.strictBlindCheck)) {
    activeTrustBoundaryId = 'bound-blind-quote';
    activeTrustBoundaryTitleEs = 'Límite Técnico (bound-blind-quote): Cotización a Ciegas Sin Datos Mínimos';
    activeTrustBoundaryReasonEs = 'Para garantizar intercambiabilidad 1:1 sin retrabajos en paro de planta, indique serie de bomba, código de pieza o medidas básicas con flexómetro.';
  }

  const plausible = warnings.length === 0 && activeTrustBoundaryId === null;
  const isIdentifiedPlant = companyRaw.length >= 2 && !companyRaw.toLowerCase().includes('no especificado');

  let classification = 'GENERAL_INQUIRY';
  let badgeLabelEs = 'PARÁMETROS FÍSICAMENTE PLAUSIBLES • REVISIÓN INGENIERÍA';
  let badgeLabelEn = 'PHYSICALLY PLAUSIBLE PARAMETERS • ENGINEERING REVIEW';
  let slaCommitmentEs = 'SLA Mismo Día Hábil • Validación dimensional 1:1 en Almacén Durango';

  if (!plausible) {
    classification = 'OUT_OF_DOMAIN_WARNING';
    badgeLabelEs = 'ALERTA DE FRONTERA TÉCNICA • REQUIERE AJUSTE DE INGENIERÍA';
    badgeLabelEn = 'TECHNICAL BOUNDARY ALERT • REQUIRES ENGINEERING REVIEW';
    slaCommitmentEs = 'Revisión prioritaria con Ingeniería de Aplicación en Durango antes de despacho';
  } else if (isIdentifiedPlant) {
    classification = 'PRIORITY_MINING_PLANT';
    badgeLabelEs = 'PLANTA MINERA VERIFICADA • PARÁMETROS PLAUSIBLES (SLA PRIORITARIO)';
    badgeLabelEn = 'VERIFIED MINING PLANT • PLAUSIBLE PARAMETERS (PRIORITY SLA)';
    slaCommitmentEs = 'Atención Inmediata Paro de Planta • Cotejo 1:1 en Banco de Pruebas Durango';
  }

  return {
    plausible,
    classification,
    badgeLabelEs,
    badgeLabelEn,
    slaCommitmentEs,
    activeTrustBoundaryId,
    activeTrustBoundaryTitleEs,
    activeTrustBoundaryReasonEs,
    warnings
  };
}




