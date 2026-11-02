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
    nameEs: 'Refacción Urgente Bomba 6x4',
    nameEn: '6x4 Emergency Spares',
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
    recommendedRole: 'sello'
  },
  liner_grooving: {
    id: 'liner_grooving',
    symptomEs: 'Desgaste abrasivo acelerado y surcos en garganta o voluta',
    symptomEn: 'Accelerated abrasive wear and localized grooving on throatbush / volute',
    causeEs: 'Recirculación abrasiva de sólidos gruesos de molienda (>300 µm).',
    causeEn: 'Abrasive recirculation of coarse grinding particles (>300 µm).',
    actionEs: 'Reajuste milimétrico de claros de acople o actualización a aleación High Chrome 27% (A05) >650 HB.',
    actionEn: 'Precision clearance adjustment or upgrade to High Chrome 27% (A05) >650 HB alloy.',
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
    deltaNpshLossM: Number(deltaNpsh.toFixed(2)),
    motorDeratingFactor: Number(motorDeratingFactor.toFixed(3)),
    altitudeTier,
    altitudeTierText
  };
}

/**
 * Calcula métricas completas de pulpa usando Durand-Condolios y matriz metalúrgica
 */
export function calculateSlurryMetrics({
  flowM3H = 150,
  solidsWeightPercent = 45,
  particleSizeD80Microns = 180,
  solidsSpecificGravity = 2.7,
  pipeDiameterMm = 150,
  altitudeM = 0
} = {}) {
  // 1. Sanitización y límites físicos mineros
  const Q = Math.max(10, Math.min(3000, Number(flowM3H) || 150));
  const Cw = Math.max(5, Math.min(75, Number(solidsWeightPercent) || 45));
  const d80 = Math.max(20, Math.min(2000, Number(particleSizeD80Microns) || 180));
  const Ss = Math.max(1.5, Math.min(5.5, Number(solidsSpecificGravity) || 2.7));
  const D_mm = Math.max(50, Math.min(600, Number(pipeDiameterMm) || 150));
  const D_m = D_mm / 1000;
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

  // 8. Matriz Metalúrgica: High Chrome A05 (>650 HB) vs. Caucho Natural
  let recommendedMaterial = 'A05';
  let materialNameEs = 'High Chrome 27% (A05) con Dureza >650 HB';
  let materialNameEn = 'High Chrome 27% (A05) Hardness >650 HB';
  let wearLifeRatio = 1.0;
  let rationaleEs = '';
  let rationaleEn = '';

  if (d80 > 150) {
    // Partículas gruesas / cortantes de molienda: A05 domina
    recommendedMaterial = 'A05';
    wearLifeRatio = (d80 > 300) ? 3.8 : 2.6;
    rationaleEs = `Para partículas gruesas de molienda (${Math.round(d80)} µm) con alta energía de impacto, la aleación High Chrome 27% (A05) con dureza >650 HB ofrece ${wearLifeRatio.toFixed(1)}× mayor vida útil contra desgaste severo.`;
    rationaleEn = `For coarse grinding particles (${Math.round(d80)} µm) with high impact energy, High Chrome 27% (A05) (>650 HB) delivers ${wearLifeRatio.toFixed(1)}× longer wear life by preventing matrix erosion.`;
  } else if (d80 < 75 && Cw < 40) {
    // Finos de flotación / jales ligeros: Caucho es ideal
    recommendedMaterial = 'RUBBER';
    materialNameEs = 'Caucho Natural Vulcanizado de Alta Resiliencia';
    materialNameEn = 'High-Resilience Natural Vulcanized Rubber';
    wearLifeRatio = 2.4;
    rationaleEs = `Para finos de flotación (${Math.round(d80)} µm), el Caucho Natural Vulcanizado absorbe el micro-impacto por rebote elástico, superando a las aleaciones duras en pulpas con reactivos.`;
    rationaleEn = `For fine flotation tails (${Math.round(d80)} µm), natural vulcanized rubber absorbs micro-impacts via elastic rebound, outlasting hard alloys in reagent slurries.`;
  } else {
    // Rango intermedio (75 a 150 µm)
    recommendedMaterial = 'A05';
    wearLifeRatio = 1.5;
    rationaleEs = `En rango intermedio (${Math.round(d80)} µm), High Chrome A05 (>650 HB) provee máxima estabilidad dimensional y resistencia contra recirculación bajo presiones severas.`;
    rationaleEn = `In the intermediate range (${Math.round(d80)} µm), High Chrome A05 (>650 HB) provides superior dimensional stability and slip resistance under high discharge heads.`;
  }

  // 9. Estimación de Horas Operativas de Vida de Impulsor (Baseline Durango 1,200 t/d)
  const baseHours = recommendedMaterial === 'A05' ? 2400 : 2800;
  const severityFactor = (Cw / 45) * Math.pow(d80 / 180, 0.35) * (actualPipeVelocity / 3.0);
  const estimatedImpellerLifeHours = Math.round(baseHours / Math.max(0.5, Math.min(2.5, severityFactor)));

  // 10. Factor de Abatimiento de Carga y Eficiencia Hidráulica Cave / McElvain (INV-SMAT-PHY-001)
  const headLossK = 0.000385 * Math.pow(d80 / 100, 0.35) * (Ss - 1) * Cw;
  const headDeratingFactorHr = Math.max(0.65, Math.min(0.99, 1.0 - headLossK));
  const effDeratingFactorEr = Math.max(0.60, Math.min(0.98, headDeratingFactorHr - 0.02 * (Cv / 20)));

  return {
    inputs: { flowM3H: Q, solidsWeightPercent: Cw, particleSizeD80Microns: d80, solidsSpecificGravity: Ss, pipeDiameterMm: D_mm, altitudeM: altitudeData.altitudeM },
    results: {
      slurrySpecificGravity: Number(Sm.toFixed(3)),
      solidsVolumetricPercent: Number(Cv.toFixed(1)),
      durandFactorFL: Number(FL.toFixed(2)),
      criticalSettlingVelocityMs: Number(Vc.toFixed(2)),
      recommendedPipeVelocityMs: Number(recommendedPipeVelocity.toFixed(2)),
      actualPipeVelocityMs: Number(actualPipeVelocity.toFixed(2)),
      headDeratingFactorHr: Number(headDeratingFactorHr.toFixed(3)),
      effDeratingFactorEr: Number(effDeratingFactorEr.toFixed(3)),
      flowCondition,
      flowConditionText,
      recommendedMaterial,
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
  { mesh: '#4', apertureMicrons: 4750, apertureMm: 4.75 },
  { mesh: '#6', apertureMicrons: 3350, apertureMm: 3.35 },
  { mesh: '#8', apertureMicrons: 2360, apertureMm: 2.36 },
  { mesh: '#10', apertureMicrons: 2000, apertureMm: 2.00 },
  { mesh: '#12', apertureMicrons: 1700, apertureMm: 1.70 },
  { mesh: '#16', apertureMicrons: 1180, apertureMm: 1.18 },
  { mesh: '#20', apertureMicrons: 850, apertureMm: 0.85 },
  { mesh: '#30', apertureMicrons: 600, apertureMm: 0.60 },
  { mesh: '#40', apertureMicrons: 425, apertureMm: 0.425 },
  { mesh: '#50', apertureMicrons: 300, apertureMm: 0.30 },
  { mesh: '#70', apertureMicrons: 212, apertureMm: 0.212 },
  { mesh: '#100', apertureMicrons: 150, apertureMm: 0.150 },
  { mesh: '#140', apertureMicrons: 106, apertureMm: 0.106 },
  { mesh: '#200', apertureMicrons: 75, apertureMm: 0.075 },
  { mesh: '#270', apertureMicrons: 53, apertureMm: 0.053 },
  { mesh: '#325', apertureMicrons: 45, apertureMm: 0.045 },
  { mesh: '#400', apertureMicrons: 38, apertureMm: 0.038 },
  { mesh: '#500', apertureMicrons: 25, apertureMm: 0.025 },
  { mesh: '#635', apertureMicrons: 20, apertureMm: 0.020 }
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
export function calculateMarcyScaleReading(params = {}) {
  const ss = clamp(params.solidsSpecificGravity, 1.8, 5.2, 2.8);

  let rhoP;
  let cwPercent;

  if (typeof params.pulpDensityKgL === 'number' && !Number.isNaN(params.pulpDensityKgL)) {
    // Modo directo: ρp -> Cw = 100 * Ss * (ρp - 1) / (ρp * (Ss - 1))
    const maxRho = ss * 0.85 + 0.15;
    rhoP = clamp(params.pulpDensityKgL, 1.01, maxRho, 1.40);
    const rawCw = (100 * ss * (rhoP - 1.0)) / (rhoP * (ss - 1.0));
    cwPercent = clamp(rawCw, 1, 90, 45);
  } else {
    // Modo inverso: Cw -> ρp = 100 * Ss / (Cw + Ss * (100 - Cw))
    cwPercent = clamp(params.solidsWeightPercent, 1, 88, 45);
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

  return {
    solidsSpecificGravity: Number(ss.toFixed(2)),
    pulpDensityKgL: Number(rhoP.toFixed(3)),
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
 */
export function calculateGyMinimumSampleMass(params = {}) {
  const dMm = clamp(params.topSizeD95Mm, 0.02, 25.0, 2.0);
  const cConst = clamp(params.samplingConstantC, 0.2, 15.0, 1.6);
  const sFse = clamp(params.targetRelativeStdError, 0.01, 0.20, 0.05);
  const cw = clamp(params.solidsWeightPercent, 10, 80, 40);

  // En la ecuación dimensional de Gy con c en g/cm³ y d en cm: Ms (gramos) = c * (d_cm^3) / (s_FSE^2)
  // Para pulpas finas de planta aseguramos piso físico de 250 g secos para análisis granulométrico + químico
  const dCm = dMm / 10.0;
  const theoreticalGrams = (cConst * Math.pow(dCm, 3)) / Math.pow(sFse, 2);
  const minDrySampleGrams = Math.max(250, Math.round(theoreticalGrams));
  const minDrySampleKg = Number((minDrySampleGrams / 1000).toFixed(2));

  // Volumen equivalente de pulpa a filtrar en el Filtro de Presión Batch SMAT (asumiendo Ss ~ 2.8)
  const slurryRho = (100 * 2.8) / (cw + 2.8 * (100 - cw));
  const wetSlurryMassGrams = minDrySampleGrams / (cw / 100);
  const requiredPulpLiters = Number((wetSlurryMassGrams / (slurryRho * 1000)).toFixed(2));
  const batchFilterCycles = Math.max(1, Math.ceil(requiredPulpLiters / 8.0));

  return {
    topSizeD95Mm: Number(dMm.toFixed(2)),
    samplingConstantC: Number(cConst.toFixed(2)),
    targetRelativeStdErrorPercent: Number((sFse * 100).toFixed(1)),
    theoreticalGyGrams: Number(theoreticalGrams.toFixed(1)),
    minDrySampleGrams,
    minDrySampleKg,
    requiredPulpLiters,
    batchFilterCycles,
    recommendedAirPressurePsi: '80 - 100 psi (5.5 - 6.9 bar)',
    recommendationEs: batchFilterCycles === 1
      ? `Carga directa en 1 ciclo del Filtro de Presión Batch SMAT (${requiredPulpLiters} L de pulpa a 80-100 psi)`
      : `Fraccionar con cuarteador de rifle o procesar en ${batchFilterCycles} cargas del Filtro Batch SMAT`,
    recommendationEn: batchFilterCycles === 1
      ? `Direct single-charge dewatering in SMAT Batch Pressure Filter (${requiredPulpLiters} L pulp at 80-100 psi)`
      : `Split via riffle splitter or process across ${batchFilterCycles} SMAT Batch Filter charges`
  };
}

/**
 * Selecciona la columna óptima de 6 Tamices Certificados ASTM E11 / ISO 3310-1 centrada en el P80 objetivo
 * y calcula la coordenada doble-logarítmica de Rosin-Rammler y' = log10(log10(100 / R)).
 * Referencia Kernel: tomjrob/pyRR (RRYScale.py)
 *
 * @param {Object} params
 * @param {number} [params.targetP80Microns=150] - Tamaño P80 objetivo de molienda o clasificación (µm)
 * @param {string} [params.screeningMode='wet'] - 'wet' (tamizado húmedo -> Acero Inox) o 'dry' (Bronce / Acero Inox)
 * @param {number} [params.retainedPercentAtP80=20] - % retenido acumulado R (por definición 20% en el corte P80)
 */
export function recommendAstmSieveSeries(params = {}) {
  const targetP80 = clamp(params.targetP80Microns, 20, 3350, 150);
  const mode = params.screeningMode === 'dry' ? 'dry' : 'wet';
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

  // Construir pila de 6 tamices (2 por encima del P80, el tamiz P80 y 3 por debajo hasta finos)
  const startIdx = Math.max(0, Math.min(closestIdx - 2, ASTM_E11_SIEVE_TABLE.length - 6));
  const selectedSieves = ASTM_E11_SIEVE_TABLE.slice(startIdx, startIdx + 6);
  const primaryControlSieve = ASTM_E11_SIEVE_TABLE[closestIdx];

  // Transformación linealizada de Rosin-Rammler (tomjrob/pyRR): y' = log10(log10(100 / R))
  const rosinRammlerYPrime = Number(Math.log10(Math.log10(100.0 / retainedR)).toFixed(4));

  const requiresStainless = mode === 'wet' || targetP80 <= 106;

  return {
    targetP80Microns: targetP80,
    primaryControlMesh: primaryControlSieve.mesh,
    primaryApertureMicrons: primaryControlSieve.apertureMicrons,
    sieveStack: selectedSieves,
    sieveStackSummary: selectedSieves.map((s) => `${s.mesh} (${s.apertureMicrons} µm)`).join(' ➔ '),
    rosinRammlerYPrime,
    recommendedFrameMaterialEs: requiresStainless
      ? 'Marco y Malla en Acero Inoxidable Certificado ASTM E11 (8" o 12") + Tapa y Cazuela'
      : 'Marco en Bronce o Acero Inoxidable Certificado ASTM E11 (8" o 12") + Tapa y Cazuela',
    recommendedFrameMaterialEn: requiresStainless
      ? 'ASTM E11 Certified Full Stainless Steel Frame & Cloth (8" or 12") + Cover & Pan'
      : 'ASTM E11 Certified Brass or Stainless Steel Frame (8" or 12") + Cover & Pan'
  };
}

/**
 * Matriz de Materiales en Contacto Húmedo (Arbitraje Epistémico #5, INV-SMAT-SCI-01 y INV-SMAT-SCI-09)
 * Discriminación pre-atentiva (<150 ms) por reflectancia óptica y límites tribológicos.
 */
export const WET_END_MATERIAL_MATRIX = {
  alto_cromo: {
    id: 'alto_cromo',
    code: 'A05',
    nameEs: 'Alto Cromo 27% (≥ 650 HB)',
    nameEn: '27% High Chrome White Iron (≥ 650 HB)',
    visualCueEs: 'Acabado Metálico Maquinado / Esmalte Azul',
    visualCueEn: 'Machined Specular Metallic / Blue Enamel',
    swatchHex: '#1E3A8A',
    accentHex: '#64748B',
    hardness: '≥ 650 HB (60–62 HRC)',
    maxTipSpeedMs: 28.5,
    d80RangeMicrons: [150, 6000],
    phRange: [4.0, 12.5],
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Impulsor Cerrado 5 Álabes', 'Voluta Monolítica (1 pieza)', 'Cuello de Succión (Throatbush)', 'Plato Posterior (FPL Insert)'],
    partsIncludedEn: ['Closed 5-Vane Impeller', 'Monolithic Volute (1-piece)', 'Suction Throatbush', 'Frame Plate Liner Insert (FPL Insert)'],
    dutyApplicationEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    dutyApplicationEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.'
  },
  hule: {
    id: 'hule',
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
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor Revestido en Hule'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Rubber-Lined Impeller'],
    dutyApplicationEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    dutyApplicationEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.'
  },
  poliuretano: {
    id: 'poliuretano',
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
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor / Expulsor en Poliuretano'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Polyurethane Impeller / Expeller'],
    dutyApplicationEs: 'Baterías de hidrociclones, remolienda y pulpas finas a medias con alta velocidad superficial o pH ácido.',
    dutyApplicationEn: 'Hydrocyclone clusters, regrind duties, and fine-to-medium slurries with high velocity or acidic pH.'
  }
};

/**
 * Estaciones de Ensamble de una Bomba Centrífuga Horizontal para Lodos (Arbitraje #6, INV-SMAT-SCI-10)
 * Basado en Matrices de Interferencia Axial A_{I,-X} y Matriz de Soporte S (DOI: 10.1109/tase.2012.2235144).
 */
export const PUMP_ASSEMBLY_STATIONS = [
  {
    stationNumber: 1,
    id: 'drive_end',
    titleEs: 'Estación 1: Extremo Motriz y Base Estructural',
    titleEn: 'Station 1: Drive End & Structural Frame',
    partsEs: ['01. Bastidor / Cuna con Tornillo de Ajuste Axial (Frame)', '02. Conjunto Rodamiento Cilíndrico (Bearing Assembly / Housing)', '03. Plato Soporte Metálico (Frame Plate)'],
    partsEn: ['01. Base Frame with Axial Adjusting Screw', '02. Cylindrical Bearing Assembly / Housing', '03. Cast Iron Frame Plate'],
    roleId: 'soporte',
    lotRatioNoteEs: 'Módulo sellado intercambiable (ISO 281 rodillos cónicos p = 10/3)',
    lotRatioNoteEn: 'Drop-in sealed cartridge module (ISO 281 tapered rollers p = 10/3)'
  },
  {
    stationNumber: 2,
    id: 'sealing_fork',
    titleEs: 'Estación 2: Bifurcación de Sellado Centrífugo (Sin Sello Mecánico)',
    titleEn: 'Station 2: Centrifugal Shaft Sealing Fork (Zero Mechanical Seal)',
    partsEs: ['04. Camisa de Flecha (Shaft Sleeve)', '05. Anillo Expulsor + Cámara Centrífuga (Expeller Ring)', '06. Expulsor Dinámico Seco (Expeller)', '07. Prensaestopa, Anillo Linterna y Empaquetadura PTFE/Grafito'],
    partsEn: ['04. Hardened Shaft Sleeve', '05. Expeller Ring & Chamber', '06. Dynamic Dry Expeller', '07. Gland Follower, Lantern Ring & Braided PTFE/Graphite Packing'],
    roleId: 'sello',
    lotRatioNoteEs: 'Sellado centrífugo en seco para evitar dilución de pulpa y fallas por abrasión',
    lotRatioNoteEn: 'Dry centrifugal expeller seal prevents pulp dilution and abrasive seal failure'
  },
  {
    stationNumber: 3,
    id: 'wet_end_fork',
    titleEs: 'Estación 3: Bifurcación de Contacto Húmedo (Lote 5 – 5 – 4)',
    titleEn: 'Station 3: Bifurcated Wet-End Assembly (5 – 5 – 4 Wear Lot)',
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
    stationNumber: 4,
    id: 'suction_closure',
    titleEs: 'Estación 4: Cierre de Carcasa Bipartida y Succión',
    titleEn: 'Station 4: Split-Casing Closure & Suction Cover Plate',
    partsEs: ['12. Plato Cubierta Lado Succión (Cover Plate)', '13. Pernos Pasantes de Carcasa y Abrazadera de Descarga'],
    partsEn: ['12. Suction Side Cover Plate', '13. Casing Through-Bolts & Discharge Clamp'],
    roleId: 'skid_bomba',
    lotRatioNoteEs: 'Torque cruzado simétrico de carcasa exterior',
    lotRatioNoteEn: 'Symmetrical cross-pattern torque on outer split casing'
  },
  {
    stationNumber: 5,
    id: 'axial_calibration',
    titleEs: 'Estación 5: Calibración Post-Armado de Claro Axial Frontal (δ = 0.5 – 1.0 mm)',
    titleEn: 'Station 5: Post-Assembly Front Axial Clearance Calibration (δ = 0.5 – 1.0 mm)',
    partsEs: ['14. Tornillo Micrométrico del Bearing Assembly: avanzar conjunto hacia succión hasta contacto leve con Throatbush, retroceder 1/2 vuelta (0.5–1.0 mm) y fijar pernos de cuna'],
    partsEn: ['14. Bearing Assembly Adjusting Screw: advance cartridge toward suction until light rub against Throatbush, back off 1/2 turn (0.5–1.0 mm), and lock cradle bolts'],
    roleId: 'revestimientos',
    lotRatioNoteEs: 'Anula el vórtice de recirculación frontal Δην ∝ (δ/b2)^1.5',
    lotRatioNoteEn: 'Suppresses front-shroud recirculation vortex Δην ∝ (δ/b2)^1.5'
  }
];

/**
 * Evalúa la validez cinemática de una secuencia de armado de bomba de lodos y cuantifica
 * el impacto del claro axial frontal δ_frontal sobre la eficiencia volumétrica y vida del lote 5-5-4.
 * Referencias: HyperbolicCurve/Assembly-sequence-planning-algorithm (SHA-256: 8dc91ac2...fb90867c35)
 * y Gandhi et al. (2001, DOI: 10.1115/1.1366322).
 *
 * @param {Object} params
 * @param {'metal'|'rubber'|'polyurethane'} [params.wetEndBranch='metal']
 * @param {'expeller_dry'|'gland_water'} [params.sealBranch='expeller_dry']
 * @param {number} [params.frontClearanceMm=0.75] - Claro axial frontal δ_frontal entre impulsor y throatbush (mm)
 * @param {number} [params.impellerExitWidthMm=48] - Ancho de salida del impulsor b2 (mm)
 * @param {string[]} [params.customOrder] - Secuencia opcional para verificar colisiones geométricas Ng
 */
export function evaluatePumpAssemblySequence(params = {}) {
  const branchRaw = String(params.wetEndBranch || 'metal').toLowerCase();
  const isElastomer = branchRaw === 'rubber' || branchRaw === 'hule' || branchRaw === 'polyurethane' || branchRaw === 'poliuretano';
  const wetEndBranch = isElastomer ? (branchRaw.includes('poly') || branchRaw.includes('poli') ? 'polyurethane' : 'rubber') : 'metal';
  const sealBranch = params.sealBranch === 'gland_water' ? 'gland_water' : 'expeller_dry';

  const clearanceMm = clamp(params.frontClearanceMm, 0.1, 8.0, 0.75);
  const b2Mm = clamp(params.impellerExitWidthMm, 15.0, 180.0, 48.0);

  // Secuencia canónica libre de interferencias (Ng = 0, Ns = 0)
  const canonicalSequence = wetEndBranch === 'metal'
    ? ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'fpl_insert', 'impeller', 'monolithic_volute', 'throatbush', 'cover_plate', 'axial_clearance_adjustment']
    : ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'frame_plate_liner', 'impeller', 'cover_plate_liner', 'throatbush', 'cover_plate', 'axial_clearance_adjustment'];

  const sequenceToTest = Array.isArray(params.customOrder) && params.customOrder.length > 0
    ? params.customOrder
    : canonicalSequence;

  // Verificación de Matriz de Interferencia Axial A_{I,-X} y Soporte S:
  // 1) El plato posterior (fpl_insert o frame_plate_liner) y el sello deben montarse ANTES de roscar el impulsor (D2 > D_hub).
  // 2) El impulsor debe roscarse ANTES de cerrar la voluta/cover_plate_liner y el throatbush.
  let geometricInterferencesNg = 0;
  let unstableSubassembliesNs = 0;

  const idxImpeller = sequenceToTest.indexOf('impeller');
  const idxRearLiner = sequenceToTest.indexOf(wetEndBranch === 'metal' ? 'fpl_insert' : 'frame_plate_liner');
  const idxThroatbush = sequenceToTest.indexOf('throatbush');
  const idxFramePlate = sequenceToTest.indexOf('frame_plate');
  const idxCoverPlate = sequenceToTest.indexOf('cover_plate');

  if (idxImpeller !== -1 && idxRearLiner !== -1 && idxImpeller < idxRearLiner) {
    geometricInterferencesNg += 1; // Colisión axial: el plato posterior no puede atravesar el diámetro exterior del impulsor D2
  }
  if (idxImpeller !== -1 && idxThroatbush !== -1 && idxThroatbush < idxImpeller) {
    geometricInterferencesNg += 1; // Colisión axial: el cuello cierra el acceso frontal al impulsor
  }
  if (idxRearLiner !== -1 && idxFramePlate !== -1 && idxRearLiner < idxFramePlate) {
    unstableSubassembliesNs += 1; // Operación inestable: liner sin plato soporte rígido previo
  }
  if (idxCoverPlate !== -1 && idxThroatbush !== -1 && idxCoverPlate < idxThroatbush) {
    geometricInterferencesNg += 1; // Colisión: Cover Plate bloquea inserción del Throatbush
  }

  // Ley de pérdida volumétrica por recirculación en el claro frontal: Δην = kr * (δ / b2)^1.5 (Gandhi et al., 2001)
  const kr = 2.85;
  const volumetricLossFraction = kr * Math.pow(clearanceMm / b2Mm, 1.5);
  const volumetricEfficiencyDropPct = Number(Math.min(45.0, volumetricLossFraction * 100).toFixed(2));
  const baselineDropPct = Number((kr * Math.pow(0.75 / b2Mm, 1.5) * 100).toFixed(2));
  const excessRecirculationRatio = Number((volumetricEfficiencyDropPct / Math.max(0.1, baselineDropPct)).toFixed(2));

  const clearanceStatus = clearanceMm >= 0.5 && clearanceMm <= 1.0
    ? 'OPTIMAL_CALIBRATION'
    : (clearanceMm < 0.5 ? 'RUBBING_RISK' : 'EXCESS_RECIRCULATION_WEAR');

  return {
    wetEndBranch,
    sealBranch,
    canonicalSequence,
    geometricInterferencesNg,
    unstableSubassembliesNs,
    isValidAssembly: geometricInterferencesNg === 0 && unstableSubassembliesNs === 0,
    frontClearanceMm: clearanceMm,
    optimalClearanceBandMm: [0.5, 1.0],
    volumetricEfficiencyDropPct,
    excessRecirculationRatio,
    clearanceStatus,
    structuralReasonEs: wetEndBranch === 'metal'
      ? 'El alto cromo (≥650 HB) posee módulo elástico E ≈ 210 GPa y soporta esfuerzos de membrana en succión como Voluta Monolítica de 1 pieza + FPL Insert posterior + Throatbush frontal.'
      : 'El hule/poliuretano (E ≈ 0.01–0.05 GPa) requiere respaldo metálico continuo contra colapso por vacío en el ojo de succión, dividiendo la carcasa húmeda en 2 mitades simétricas (Frame Plate Liner + Cover Plate Liner) + Throatbush.',
    structuralReasonEn: wetEndBranch === 'metal'
      ? 'High chrome white iron (≥650 HB, E ≈ 210 GPa) resists suction vacuum hoop stresses as a 1-piece Monolithic Volute + rear FPL Insert + front Throatbush.'
      : 'Elastomers (rubber/polyurethane, E ≈ 0.01–0.05 GPa) require continuous split-casing metal backing against suction vacuum buckling, using 2 symmetrical halves (Frame Plate Liner + Cover Plate Liner) + Throatbush.'
  };
}

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
    applicationEs: 'Motor montado sobre pedestal posterior elevado detrás del Bearing Assembly con transmisión por bandas en V. Ideal para potencias medias y altas manteniendo el motor por encima del nivel de inundación del foso.',
    applicationEn: 'Motor mounted on an elevated rear pedestal behind the Bearing Assembly with V-belt drive. Ideal for medium-to-high horsepower while keeping the motor above sump flood level.'
  },
  CRZ: {
    code: 'CRZ',
    nameEs: 'Arreglo CRZ / बेल्ट Lateral (Motor Lateral en Bastidor Compartido)',
    nameEn: 'CRZ / CR Arrangement (Side-by-Side Belt Drive on Shared Skid)',
    footprintFactor: 1.0,
    sumpFloodImmunity: false,
    beltDriven: true,
    maxRecommendedMotorKw: 560,
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
 * @param {Object} params
 * @param {'CV'|'ZVZ'|'CRZ'|'DC'} [params.arrangement='CV']
 * @param {number} [params.motorRpm=1780] - Velocidad nominal del motor eléctrico (4 polos 60 Hz = 1780 RPM)
 * @param {number} [params.driverPulleyMm=180] - Diámetro de paso de polea motriz (motor, mm)
 * @param {number} [params.drivenPulleyMm=320] - Diámetro de paso de polea conducida (bomba, mm)
 * @param {number} [params.impellerDiameterMm=380] - Diámetro exterior del impulsor D2 (mm)
 * @param {number} [params.shaftPowerKw=45] - Potencia en la flecha P (kW)
 * @param {number} [params.dynamicCapacityCkN=195] - Capacidad de carga dinámica C del Bearing Assembly (kN)
 */
export function calculateDriveAndBearingKinematics(params = {}) {
  const arrKey = String(params.arrangement || 'CV').toUpperCase();
  const arrangementInfo = DRIVE_ARRANGEMENT_CATALOG[arrKey] || DRIVE_ARRANGEMENT_CATALOG.CV;

  const motorRpm = clamp(params.motorRpm, 600, 3600, 1780);
  const driverMm = clamp(params.driverPulleyMm, 80, 900, 180);
  const drivenMm = clamp(params.drivenPulleyMm, 80, 1400, 320);
  const impellerMm = clamp(params.impellerDiameterMm, 120, 1100, 380);
  const powerKw = clamp(params.shaftPowerKw, 2.2, 750, 45);
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

  return {
    arrangement: arrangementInfo.code,
    arrangementNameEs: arrangementInfo.nameEs,
    arrangementNameEn: arrangementInfo.nameEn,
    sumpFloodImmunity: arrangementInfo.sumpFloodImmunity,
    footprintFactor: arrangementInfo.footprintFactor,
    motorRpm,
    pumpRpm,
    speedMultiplier,
    reductionRatio,
    impellerDiameterMm: impellerMm,
    tipSpeedMs,
    rubberSafeTipSpeed,
    recommendedWetMaterialByTipSpeed: rubberSafeTipSpeed ? 'Hule Natural / Poliuretano / Alto Cromo' : 'Exclusivo Alto Cromo ≥ 650 HB (u2 > 24.5 m/s)',
    beltRadialLoadKn,
    equivalentLoadPkN,
    bearingL10Hours
  };
}


