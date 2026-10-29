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
 * @returns {Object}
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
