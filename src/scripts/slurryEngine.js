export const SLURRY_PRESETS = {
  sag_primary: { id: 'sag_primary', nameEs: 'Molienda SAG / Primaria (Gruesos)', nameEn: 'SAG / Primary Grinding (Coarse)', flowM3H: 450, solidsWeightPercent: 28, particleSizeD80Microns: 450, solidsSpecificGravity: 2.7, pipeDiameterMm: 250, defaultRole: 'impulsor', tagEs: 'Alto Impacto • High Chrome A05', tagEn: 'High Impact • High Chrome A05'
  },
  flotation_rougher: { id: 'flotation_rougher', nameEs: 'Celdas de Flotación (Finos & Reactivos)', nameEn: 'Flotation Cells (Fines & Reagents)', flowM3H: 300, solidsWeightPercent: 18, particleSizeD80Microns: 74, solidsSpecificGravity: 2.65, pipeDiameterMm: 200, defaultRole: 'rotor_estator', tagEs: 'Rebote Elástico • Caucho Vulcanizado', tagEn: 'Elastic Rebound • Vulcanized Rubber'
  },
  tailings_thickened: { id: 'tailings_thickened', nameEs: 'Línea de Jales / Relaves Espesados', nameEn: 'Thickened Tailings / High Density', flowM3H: 600, solidsWeightPercent: 55, particleSizeD80Microns: 150, solidsSpecificGravity: 2.8, pipeDiameterMm: 300, defaultRole: 'skid_bomba', tagEs: 'Alta Fricción • High Chrome A05', tagEn: 'High Friction • High Chrome A05'
  },
  emergency_6x4: { id: 'emergency_6x4', nameEs: 'Pieza Crítica por Paro Bomba 6x4', nameEn: '6x4 Critical Outage Spares', flowM3H: 350, solidsWeightPercent: 32, particleSizeD80Microns: 300, solidsSpecificGravity: 2.7, pipeDiameterMm: 200, defaultRole: 'revestimientos', tagEs: 'Refacción en Almacén Durango', tagEn: 'In-Stock Spares • Durango Warehouse'
  }
};
export const MECHANICAL_DIAGNOSTICS = {
  cavitation: {
    id: 'cavitation',
    symptomEs: 'Golpeteo hidráulico o ruido de grava en carcasa (Cavitación)', symptomEn: 'Hydraulic pinging or gravel noise in pump casing (Cavitation)',
    causeEs: 'Cavitación hidráulica por NPSHa insuficiente o succión estrangulada en cajón.', causeEn: 'Hydraulic cavitation due to low NPSHa or choked suction intake.',
    actionEs: 'Verificar sumergencia de cajón de succión. Instalar sello dinámico expulsor para eliminar vacío en estopa.', actionEn: 'Check sump submergence. Fit dynamic expeller seal to relieve suction vacuum.', threshold: 'NPSHa < NPSHr + 1.5 m (ΔNPSH altitud > 2.0 m)', stationNumber: 2, recommendedMaterial: 'alto_cromo_cr27', recommendedClearanceMm: 0.75, recommendedRole: 'sello'
  },
  liner_grooving: {
    id: 'liner_grooving',
    symptomEs: 'Desgaste abrasivo acelerado y surcos en cuello de succión o voluta', symptomEn: 'Accelerated abrasive wear and localized grooving on throatbush / volute',
    causeEs: 'Recirculación abrasiva de sólidos gruesos de molienda (>300 µm).', causeEn: 'Abrasive recirculation of coarse grinding particles (>300 µm).',
    actionEs: 'Reajuste milimétrico de claros de acople o actualización a aleación High Chrome 27% (A05) >650 HB.', actionEn: 'Precision clearance adjustment or upgrade to High Chrome 27% (A05) >650 HB alloy.', threshold: 'δ_frontal > 1.5 mm (Δη_v > 15%) o d80 > 300 µm', stationNumber: 5, recommendedMaterial: 'alto_cromo_cr27', recommendedClearanceMm: 0.65, recommendedRole: 'revestimientos'
  },
  bearing_vibration: {
    id: 'bearing_vibration',
    symptomEs: 'Vibración armónica excesiva y calentamiento en soporte de rodamientos', symptomEn: 'Harmonic vibration and bearing cartridge overheating',
    causeEs: 'Desbalance dinámico por desgaste asimétrico del impulsor o fatiga de rodamientos.', causeEn: 'Dynamic unbalance from uneven impeller erosion or bearing fatigue.',
    actionEs: 'Despacho de ensamble de rodamientos con Garantía de Ajuste Dimensional Drop-In 1:1 y Trazabilidad de Lote en Almacén Durango.', actionEn: 'Dispatch bearing cartridge assembly with 1:1 Drop-In Dimensional Fit Guarantee and Batch Traceability in Durango Warehouse.', threshold: 'L10h < 15,000 h o Fr > 18 kN (Tensión V-Belt)', stationNumber: 1, recommendedMaterial: 'alto_cromo_cr27', recommendedClearanceMm: 0.75, recommendedRole: 'soporte'
  },
  seal_stuffing_box: {
    id: 'seal_stuffing_box',
    symptomEs: 'Fuga en Estopero, Dilución de Pulpa y Rayado de Camisa de Flecha (Estación 02)', symptomEn: 'Stuffing Box Leakage, Slurry Dilution & Shaft Sleeve Scoring (Station 02)',
    causeEs: 'Presión de succión > 15% de H o intrusión de sílice fina bajo empaquetadura en camisa estándar.', causeEn: 'Suction head > 15% of total head H or fine silica intrusion under gland packing on standard sleeve.',
    actionEs: 'Instalar Camisa Recubierta HVOF WC-CoCr (D075C21, ≥68 HRC) y Expulsor Centrífugo Seco D4028 + Cámara D4029.', actionEn: 'Install HVOF WC-CoCr Coated Shaft Sleeve (D075C21, ≥68 HRC) and D4028 Dry Expeller + D4029 Chamber.', threshold: 'Hs/H > 0.15 o P_sello < P_descarga + 0.7 bar (Ra camisa > 0.2 µm)', stationNumber: 2, recommendedMaterial: 'alto_cromo_cr27', recommendedClearanceMm: 0.75, recommendedRole: 'sello'
  },
  bearing_shaft_fatigue: {
    id: 'bearing_shaft_fatigue',
    symptomEs: 'Sobrecalentamiento (>85 °C), Contaminación de Aceite y Fatiga ISO 281 en Cartucho (Estación 01)', symptomEn: 'Overheating (>85 °C), Oil Contamination & ISO 281 Bearing Cartridge Fatigue (Station 01)',
    causeEs: 'Ingreso de humedad/sílice por retenes desgastados (a_ISO cae de 1.25 a 0.22) o tensión excesiva de bandas V.', causeEn: 'Moisture/silica ingress through worn seals (a_ISO drops from 1.25 to 0.22) or excessive V-belt radial load.',
    actionEs: 'Reemplazo Drop-In por Cartucho Completo DAM005 (Eje SAE 4140 + Rodamientos ISO 281 + Laberinto Purgante).', actionEn: 'Drop-in replacement with DAM005 Complete Bearing Cartridge (SAE 4140 Shaft + ISO 281 Rollers + Labyrinth Seal).', threshold: 'L10mh < 15,000 h (a_ISO = 0.22) o T_caja > 85 °C', stationNumber: 1, recommendedMaterial: 'alto_cromo_cr27', recommendedClearanceMm: 0.75, recommendedRole: 'soporte'
  },
  packing_leak: {
    id: 'packing_leak',
    symptomEs: 'Fuga continua de pulpa y daño prematuro en casquillo de flecha', symptomEn: 'Continuous slurry leakage and shaft sleeve scoring',
    causeEs: 'Empaquetadura calcinada o presión insuficiente de agua de sello.', causeEn: 'Burnt gland packing or low seal water pressure.',
    actionEs: 'Instalación de casquillo cerámico o conversión a sello dinámico libre de agua de sellado.', actionEn: 'Install ceramic-coated sleeve or convert to waterless expeller dynamic seal.', threshold: 'u2 > 24.5 m/s en elastómero o P_agua < P_descarga + 0.7 bar', stationNumber: 2, recommendedMaterial: 'alto_cromo_cr27', recommendedClearanceMm: 0.75, recommendedRole: 'sello'
  }
};
export function calculateAltitudeCorrection(altitudeM = 0) {
  const alt = Math.max(0, Math.min(5000, Number(altitudeM) || 0));
  const pAtm = Math.max(5.0, 10.33 - (alt / 900));
  const deltaNpsh = 10.33 - pAtm;
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
  return { altitudeM: alt, pAtmHeadMca: Number(pAtm.toFixed(2)), barometricPressureKpa: Number((pAtm * 9.80665).toFixed(2)), deltaNpshLossM: Number(deltaNpsh.toFixed(2)), npshSafeMarginWarning: deltaNpsh >= 1.5, motorDeratingFactor: Number(motorDeratingFactor.toFixed(3)), altitudeTier, altitudeTierText };
}
export const PIPE_SERIES_DIAMETER_MM = { '1.5x1': 50, '2x1.5': 50, '3x2': 100, '4x3': 100, '6x4': 150, '8x6': 200, '10x8': 250, '12x10': 300, '14x12': 350 };
export const PIPE_DIAMETERS_MM = PIPE_SERIES_DIAMETER_MM;
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
export function calculateSlurryMetrics({ flowM3H = 150, solidsWeightPercent = 45, particleSizeD80Microns = 180, solidsSpecificGravity = 2.7, pipeDiameterMm, pipeSeries = '6x4', altitudeM = 0, pH = 7.5, stressSymptom = '' } = {}) {
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
  const altitudeData = calculateAltitudeCorrection(altitudeM);
  const Sm = 100 / ((Cw / Ss) + (100 - Cw));
  const Cv = (Cw * Sm) / Ss;
  let FL = 1.32 * Math.pow(d80 / 150, 0.12);
  if (Cv < 15) FL *= 0.90;
  else if (Cv > 35) FL *= 1.05;
  FL = Math.max(0.92, Math.min(1.48, FL));
  const Vc = FL * Math.sqrt(2 * g * D_m * (Ss - 1));
  const recommendedPipeVelocity = Vc * 1.25; // Margen de seguridad 25% contra embancamiento
  const pipeAreaM2 = Math.PI * Math.pow(D_m / 2, 2);
  const flowM3S = Q / 3600;
  const actualPipeVelocity = flowM3S / pipeAreaM2;
  let flowCondition = 'optimal';
  let flowConditionText = 'Velocidad de flujo segura dentro de rango óptimo de bombeo (libre de sedimentación y libre de desgaste excesivo).';
  if (actualPipeVelocity < Vc) {
    flowCondition = 'settling_risk';
    flowConditionText = 'Riesgo de sedimentación: velocidad inferior al límite de Durand. Aumente caudal o reduzca diámetro para evitar taponamiento en la tubería.';
  } else if (actualPipeVelocity > Vc * 2.2) {
    flowCondition = 'high_wear';
    flowConditionText = 'Exceso de velocidad en línea: desgaste acelerado por abrasión en codos y voluta.';
  }
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
    recommendedMaterial = 'A05';
    recommendedMaterialKey = 'alto_cromo_cr27';
    recommendedMaterialCode = 'A05';
    wearLifeRatio = (d80 > 300) ? 3.8 : 2.6;
    rationaleEs = `Para partículas gruesas de molienda (${Math.round(d80)} µm) con alta energía de impacto, la aleación High Chrome 27% (A05) con dureza >650 HB ofrece ${wearLifeRatio.toFixed(1)}× mayor vida útil contra desgaste severo.`;
    rationaleEn = `For coarse grinding particles (${Math.round(d80)} µm) with high impact energy, High Chrome 27% (A05) (>650 HB) delivers ${wearLifeRatio.toFixed(1)}× longer wear life by preventing matrix erosion.`;
  } else if (isFineLightRubber) {
    recommendedMaterial = 'RUBBER';
    recommendedMaterialKey = 'hule_natural';
    recommendedMaterialCode = 'R55';
    materialNameEs = 'Caucho Natural Vulcanizado de Alta Resiliencia';
    materialNameEn = 'High-Resilience Natural Vulcanized Rubber';
    wearLifeRatio = 2.4;
    rationaleEs = `Para finos de flotación (${Math.round(d80)} µm), el Caucho Natural Vulcanizado absorbe el micro-impacto por rebote elástico, superando a las aleaciones duras en pulpas con reactivos.`;
    rationaleEn = `For fine flotation tails (${Math.round(d80)} µm), natural vulcanized rubber absorbs micro-impacts via elastic rebound, outlasting hard alloys in reagent slurries.`;
  } else if (isPolyurethaneRegime) {
    recommendedMaterial = 'PU';
    recommendedMaterialKey = 'poliuretano';
    recommendedMaterialCode = 'U01';
    materialNameEs = 'Poliuretano Elastómero Grado Minero (U01, Shore A 85–95)';
    materialNameEn = 'Mining-Grade Cast Polyurethane Elastomer (U01, Shore A 85–95)';
    wearLifeRatio = 2.1;
    rationaleEs = `Para pulpa de corte intermedio (${Math.round(d80)} µm, V = ${actualPipeVelocity.toFixed(2)} m/s, pH ${phVal.toFixed(1)}), el Poliuretano U01 (Shore A 85–95) ofrece ${wearLifeRatio.toFixed(1)}× mayor resistencia al corte direccional, hidrociclones y ataque químico que el hule convencional.`;
    rationaleEn = `For intermediate cutting slurry (${Math.round(d80)} µm, V = ${actualPipeVelocity.toFixed(2)} m/s, pH ${phVal.toFixed(1)}), Cast Polyurethane U01 (Shore A 85–95) delivers ${wearLifeRatio.toFixed(1)}× higher resistance to directional cutting, hydrocyclone feed, and chemical attack.`;
  } else {
    recommendedMaterial = 'A05';
    recommendedMaterialKey = 'alto_cromo_cr27';
    recommendedMaterialCode = 'A05';
    wearLifeRatio = 1.5;
    rationaleEs = `En rango intermedio denso (${Math.round(d80)} µm, ${Cw}% Cw), High Chrome A05 (>650 HB) provee máxima estabilidad dimensional y resistencia contra recirculación bajo presiones severas.`;
    rationaleEn = `In the dense intermediate range (${Math.round(d80)} µm, ${Cw}% Cw), High Chrome A05 (>650 HB) provides superior dimensional stability and slip resistance under high discharge heads.`;
  }
  const baseHours = recommendedMaterial === 'A05' ? 2400 : (recommendedMaterial === 'PU' ? 2600 : 2800);
  const severityFactor = (Cw / 45) * Math.pow(d80 / 180, 0.35) * (actualPipeVelocity / 3.0);
  const estimatedImpellerLifeHours = Math.round(baseHours / Math.max(0.5, Math.min(2.5, severityFactor)));
  const headLossK = 0.000385 * Math.pow(d80 / 100, 0.35) * (Ss - 1) * Cw;
  const headDeratingFactorHr = Math.max(0.65, Math.min(0.99, 1.0 - headLossK));
  const effDeratingFactorEr = Math.max(0.60, Math.min(0.98, headDeratingFactorHr - 0.02 * (Cv / 20)));
  const rawCombinedMultiplier = 1.0 / Math.max(0.25, effDeratingFactorEr * altitudeData.motorDeratingFactor);
  const combinedMotorAltitudeMultiplier = Number(rawCombinedMultiplier.toFixed(3));
  const motorSizingPenaltyPct = Number(((rawCombinedMultiplier - 1.0) * 100.0).toFixed(1));
  const roundedSm = Number(Sm.toFixed(3));
  const roundedVc = Number(Vc.toFixed(2));
  const roundedVact = Number(actualPipeVelocity.toFixed(2));
  return {
    solidsSpecificGravity: Ss, pipeDiameterMm: D_mm,
    slurrySpecificGravity: roundedSm,
    criticalVelocityMS: roundedVc, criticalVelocityMs: roundedVc, actualVelocityMS: roundedVact, actualPipeVelocityMs: roundedVact,
    durandFactorFL: Number(FL.toFixed(2)), solidsVolumetricPercent: Number(Cv.toFixed(1)), recommendedPipeVelocityMs: Number(recommendedPipeVelocity.toFixed(2)),
    headDeratingFactorHr: Number(headDeratingFactorHr.toFixed(3)), effDeratingFactorEr: Number(effDeratingFactorEr.toFixed(3)), estimatedImpellerLifeHours, wearLifeRatio: Number(wearLifeRatio.toFixed(1)),
    pAtmHeadMca: altitudeData.pAtmHeadMca, deltaNpshLossM: altitudeData.deltaNpshLossM, motorDeratingFactor: altitudeData.motorDeratingFactor,
    combinedMotorAltitudeMultiplier, motorSizingPenaltyPct, altitudeTierText: altitudeData.altitudeTierText,
    recommendedMaterial, recommendedMaterialKey, recommendedMaterialCode, materialReasonEs: rationaleEs, materialReasonEn: rationaleEn,
    inputs: {
      flowM3H: Q, solidsWeightPercent: Cw, particleSizeD80Microns: d80, solidsSpecificGravity: Ss, pipeDiameterMm: D_mm,
      pipeSeries: String(pipeSeries || '6x4'),
      altitudeM: altitudeData.altitudeM,
      pH: phVal,
      stressSymptom: symptomKey
    },
    results: { slurrySpecificGravity: roundedSm, solidsVolumetricPercent: Number(Cv.toFixed(1)), durandFactorFL: Number(FL.toFixed(2)), criticalSettlingVelocityMs: roundedVc, recommendedPipeVelocityMs: Number(recommendedPipeVelocity.toFixed(2)), actualPipeVelocityMs: roundedVact, headDeratingFactorHr: Number(headDeratingFactorHr.toFixed(3)), effDeratingFactorEr: Number(effDeratingFactorEr.toFixed(3)), pAtmHeadMca: altitudeData.pAtmHeadMca, deltaNpshLossM: altitudeData.deltaNpshLossM, motorDeratingFactor: altitudeData.motorDeratingFactor, combinedMotorAltitudeMultiplier, motorSizingPenaltyPct, flowCondition, flowConditionText, recommendedMaterial, recommendedMaterialKey, recommendedMaterialCode, materialNameEs, materialNameEn, wearLifeRatio: Number(wearLifeRatio.toFixed(1)), rationaleEs, rationaleEn, estimatedImpellerLifeHours, altitudeCorrection: altitudeData }
  };
}
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
  const hasPartCodeOrDims = Boolean(params.smat_code || params.atomic_code || params.dim_outer_dia || params.dim_shaft_bore || params.pipe_size);
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
    slaCommitmentEs = 'Atención Prioritaria Paro de Planta • Garantía de Ajuste Dimensional Drop-In 1:1 y Trazabilidad de Lote en Durango';
  }
  return { plausible, classification, badgeLabelEs, badgeLabelEn, slaCommitmentEs, activeTrustBoundaryId, activeTrustBoundaryTitleEs, activeTrustBoundaryReasonEs, warnings };
}
export function calculateThreeCupMarcyCycloneBalance({ feedSg = 1.35, underflowSg = 1.82, overflowSg = 1.15, solidsSg = 2.7, apexDiameterMm = 50, vortexDiameterMm = 100, feedPressureKpa = 95, cycloneDiameterMm = 380 } = {}) {
  const safeSolidsSg = Math.max(1.8, Math.min(5.5, Number(solidsSg) || 2.7));
  const safeFeedSg = Math.max(1.02, Math.min(safeSolidsSg - 0.05, Number(feedSg) || 1.35));
  const safeOverflowSg = Math.max(1.01, Math.min(safeFeedSg - 0.01, Number(overflowSg) || 1.15));
  const safeUnderflowSg = Math.max(safeFeedSg + 0.02, Math.min(safeSolidsSg - 0.02, Number(underflowSg) || 1.82));
  const safeApexMm = Math.max(12, Math.min(250, Number(apexDiameterMm) || 50));
  const safeVortexMm = Math.max(25, Math.min(400, Number(vortexDiameterMm) || 100));
  const safePressureKpa = Math.max(20, Math.min(350, Number(feedPressureKpa) || 95));
  const safeCycloneDcMm = Math.max(100, Math.min(1000, Number(cycloneDiameterMm) || 380));
  const sgToCwFraction = (rhoP) => {
    if (rhoP <= 1.0) return 0;
    return (safeSolidsSg * (rhoP - 1.0)) / (rhoP * (safeSolidsSg - 1.0));
  };
  const cwToCvFraction = (cw) => {
    if (cw <= 0) return 0;
    return cw / (cw + (1.0 - cw) * safeSolidsSg);
  };
  const cwFeed = sgToCwFraction(safeFeedSg);
  const cwUnderflow = sgToCwFraction(safeUnderflowSg);
  const cwOverflow = sgToCwFraction(safeOverflowSg);
  const cvFeed = cwToCvFraction(cwFeed);
  const cvUnderflow = cwToCvFraction(cwUnderflow);
  const cvOverflow = cwToCvFraction(cwOverflow);
  const denomRs = cwFeed * Math.max(0.001, cwUnderflow - cwOverflow);
  const numRs = cwUnderflow * Math.max(0, cwFeed - cwOverflow);
  const solidsRecoveryFraction = Math.max(0.05, Math.min(0.98, numRs / denomRs));
  const solidsRecoveryPct = Number((solidsRecoveryFraction * 100).toFixed(1));
  const circulatingLoadPct = Number(((solidsRecoveryFraction / Math.max(0.02, 1.0 - solidsRecoveryFraction)) * 100).toFixed(0));
  const apexToVortexRatio = Number((safeApexMm / safeVortexMm).toFixed(3));
  const dcCm = safeCycloneDcMm / 10;
  const doCm = safeVortexMm / 10;
  const duCm = safeApexMm / 10;
  const headMetersSlurry = safePressureKpa / (9.80665 * safeFeedSg);
  const plittVolumetricTerm = Math.exp(6.3 * cvFeed);
  const geomFactor = (Math.pow(dcCm, 0.46) * Math.pow(doCm, 0.60)) / Math.pow(duCm, 0.71);
  const d50cRaw = (14.8 * geomFactor * plittVolumetricTerm) / (Math.pow(Math.max(1.5, headMetersSlurry), 0.38) * Math.sqrt(Math.max(0.5, safeSolidsSg - 1.0)));
  const d50cMicrons = Math.round(Math.max(15, Math.min(450, d50cRaw)));
  const isRopingCritical = cvUnderflow >= 0.56 || (apexToVortexRatio < 0.45 && cvUnderflow >= 0.50);
  const isUmbrellaDilute = cvUnderflow <= 0.36 || apexToVortexRatio > 0.78;
  let dischargeRegime = 'SEMI_UMBRELLA_OPTIMAL';
  let regimeLabelEs = 'Descarga Semi-Paraguas Óptima (Aire Central Estable)';
  let regimeLabelEn = 'Optimal Semi-Umbrella Discharge (Stable Air Core)';
  let recommendedSkuId = 'SMAT-CYC-D6-D20';
  let diagnosticActionEs = 'Relación Du/Do y fracción volumétrica C_v,u en ventana metalúrgica óptima. Mantenga monitoreo preventivo de diámetro de Apex con galga cilíndrica.';
  let diagnosticActionEn = 'Du/Do ratio and underflow volumetric fraction C_v,u within optimal metallurgical window. Maintain preventive Apex gauge checks.';
  if (isRopingCritical) {
    dischargeRegime = 'ROPING_CORDON';
    regimeLabelEs = 'ALERTA DE ACORDONAMIENTO (ROPING) • BLOQUEO VOLUMÉTRICO EN APEX';
    regimeLabelEn = 'ROPING DISCHARGE ALERT • APEX VOLUMETRIC CHOKING';
    recommendedSkuId = 'SMAT-CYC-D6-D20';
    diagnosticActionEs = `Fracción volumétrica en descarga C_v,u = ${(cvUnderflow * 100).toFixed(1)}% supera el límite de empaquetamiento libre (56%) con relación Du/Do = ${apexToVortexRatio}. Los gruesos cortocircuitan al rebalse (Vortex). Instale inserto de Apex de mayor orificio interno (Cerámica SiC / Cr27 SMAT-CYC-D6-D20).`;
    diagnosticActionEn = `Underflow volumetric fraction C_v,u = ${(cvUnderflow * 100).toFixed(1)}% exceeds free-packing limit (56%) at Du/Do = ${apexToVortexRatio}. Coarse particles bypass to overflow (Vortex). Install larger bore Apex insert (SiC Ceramic / Cr27 SMAT-CYC-D6-D20).`;
  } else if (isUmbrellaDilute) {
    dischargeRegime = 'UMBRELLA_SPRAY';
    regimeLabelEs = 'DESCARGA EN ABANICO EXCESIVO (APEX DESGASTADO) • RECIRCULACIÓN DE FINOS';
    regimeLabelEn = 'EXCESSIVE UMBRELLA SPRAY (WORN APEX) • FINES BYPASS TO UNDERFLOW';
    recommendedSkuId = 'SMAT-COUPLED-PUMP-CYC';
    diagnosticActionEs = `Fracción volumétrica baja en descarga C_v,u = ${(cvUnderflow * 100).toFixed(1)}% por desgaste radial del Apex (Du/Do = ${apexToVortexRatio}). Exceso de agua y finos retornan al molino elevando la carga circulante (${circulatingLoadPct}%). Reemplace Apex desgastado y revise buscador de vórtice (SMAT-CYC-D6-D20 / SMAT-COUPLED-PUMP-CYC).`;
    diagnosticActionEn = `Low underflow volumetric fraction C_v,u = ${(cvUnderflow * 100).toFixed(1)}% due to radial Apex wear (Du/Do = ${apexToVortexRatio}). Excess water and fines bypass back to the mill raising circulating load (${circulatingLoadPct}%). Replace worn Apex and inspect Vortex Finder (SMAT-CYC-D6-D20 / SMAT-COUPLED-PUMP-CYC).`;
  }
  return {
    feedSg: Number(safeFeedSg.toFixed(3)), underflowSg: Number(safeUnderflowSg.toFixed(3)), overflowSg: Number(safeOverflowSg.toFixed(3)), solidsSg: Number(safeSolidsSg.toFixed(2)),
    cwFeedPct: Number((cwFeed * 100).toFixed(1)), cwUnderflowPct: Number((cwUnderflow * 100).toFixed(1)), cwOverflowPct: Number((cwOverflow * 100).toFixed(1)),
    cvFeedPct: Number((cvFeed * 100).toFixed(1)), cvUnderflowPct: Number((cvUnderflow * 100).toFixed(1)), cvOverflowPct: Number((cvOverflow * 100).toFixed(1)),
    cvUnderflow: Number(cvUnderflow.toFixed(4)),
    solidsRecoveryPct, circulatingLoadPct, apexDiameterMm: safeApexMm, vortexDiameterMm: safeVortexMm, apexToVortexRatio, d50cMicrons,
    isRopingCritical, isUmbrellaDilute, dischargeRegime, regimeLabelEs, regimeLabelEn, recommendedSkuId, diagnosticActionEs, diagnosticActionEn
  };
}
export function evaluateFilterPressPlateDeflection({ feedPressureBar = 12, cloggedPortsCount = 0, plateWidthMm = 1200, plateThicknessMm = 65, cakeMoistureTargetPct = 14 } = {}) {
  const safePressureBar = Math.max(4, Math.min(25, Number(feedPressureBar) || 12));
  const safeCloggedPorts = Math.max(0, Math.min(4, Math.round(Number(cloggedPortsCount) || 0)));
  const safeWidthMm = Math.max(630, Math.min(2000, Number(plateWidthMm) || 1200));
  const safeThicknessMm = Math.max(40, Math.min(120, Number(plateThicknessMm) || 65));
  const safeMoisturePct = Math.max(8, Math.min(28, Number(cakeMoistureTargetPct) || 14));
  const portAsymmetryFactor = safeCloggedPorts === 0
    ? 0.18
    : Math.min(1.0, 0.38 + safeCloggedPorts * 0.22);
  const deltaPAsymmetricMpa = Number((safePressureBar * 0.1 * portAsymmetryFactor).toFixed(3));
  const timoshenkoBeta = 0.048;
  const slendernessRatio = safeWidthMm / safeThicknessMm;
  const maxBendingStressMpa = Number((timoshenkoBeta * deltaPAsymmetricMpa * Math.pow(slendernessRatio, 2)).toFixed(2));
  const ppFatigueAllowableMpa = 14.5;
  const flexuralSafetyFactor = Number((ppFatigueAllowableMpa / Math.max(0.5, maxBendingStressMpa)).toFixed(2));
  const isPlateCrackingRisk = flexuralSafetyFactor < 1.25 || safeCloggedPorts >= 2;
  const nom141Compliant = safeMoisturePct <= 16.0 && !isPlateCrackingRisk;
  return { feedPressureBar: safePressureBar, cloggedPortsCount: safeCloggedPorts, plateWidthMm: safeWidthMm, plateThicknessMm: safeThicknessMm, cakeMoistureTargetPct: safeMoisturePct, deltaPAsymmetricMpa, maxBendingStressMpa, ppFatigueAllowableMpa, flexuralSafetyFactor, isPlateCrackingRisk, nom141Compliant, recommendedClothSkuId: 'SMAT-FILT-CLOTH-PLATE', recommendedPlateSkuId: 'SMAT-FILT-SHIFTER-CHAIN',
    summaryEs: isPlateCrackingRisk
      ? `Riesgo crítico de fractura en membrana/recámara (σ_max = ${maxBendingStressMpa} MPa, FS = ${flexuralSafetyFactor} < 1.25). Desbloquee puertos de alimentación e instale Placas de Polipropileno Virgen con Anillos de Cuello y Telas Calandradas (SMAT-FILT-CLOTH-PLATE) y Corre-Placas (SMAT-FILT-SHIFTER-CHAIN).`
      : `Operación estructural segura (σ_max = ${maxBendingStressMpa} MPa, FS = ${flexuralSafetyFactor}). Cumple criterio de torta seca NOM-141 (${safeMoisturePct}% humedad residual).`
  };
}
export function computeSelectionOrderCodeHash(payload = {}) {
  const canonicalKeys = Object.keys(payload || {}).sort();
  const normalizedPairs = canonicalKeys.map((k) => `${k}:${String(payload[k] ?? '').trim().toUpperCase()}`);
  const canonicalString = normalizedPairs.join('|') || 'SMAT-DEFAULT-V3';
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonicalString.length; i += 1) {
    hash ^= canonicalString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return `SMAT-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
export { calculateUrethaneScreenPartitionWeibull, calculateFlotationGorainKineticRate } from './mechanicalAndSeparationEngine.js';
export * from './tribologyAndCompatibilityEngine.js';
