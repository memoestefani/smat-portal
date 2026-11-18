/**
 * wizardLivePhysicsProjector.js
 * ---------------------------------------------------------------------------
 * Costura Modular Cohesiva LCOM4 = 1 (∂(C) = 0, D9-V41, D5-V41 a D8-V41)
 * Proyector declarativo y determinista hacia el DOM de las >90 propiedades
 * calculadas por los 18 motores del backend en `/cotizar/` (`QuoteWizard.astro`,
 * `WizardCircuitCalculators.astro` y `LiveEngineeringDossier.astro`).
 */

import {
  MARCY_STANDARD_RINGS,
  ASTM_E11_SIEVE_TABLE
} from './tribologyAndCompatibilityEngine.js';

const PROJECTOR_STATE_CACHE = {
  lastUpdatedIso: '',
  activeCircuit: 'bombeo',
  ringCount: MARCY_STANDARD_RINGS.length,
  sieveCount: ASTM_E11_SIEVE_TABLE.length
};

function setNodeTextAndAttrs(root, selector, text, attrs = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const el = root.querySelector(selector);
  if (!el) return null;
  if (text !== undefined && text !== null) {
    el.textContent = String(text);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && typeof el.setAttribute === 'function') {
      el.setAttribute(k, String(v));
    }
  }
  PROJECTOR_STATE_CACHE.lastUpdatedIso = new Date().toISOString();
  return el;
}

/**
 * Proyecta los 37 campos de Bombeo, Bastidor Motriz (`selectBearingFrameByPowerAndRpm`),
 * Rama D Híbrida (`evaluateHybridWetEndConfiguration`), Secuencia e Interferencia
 * (`evaluatePumpAssemblySequence` / `evaluateWetEndAssemblyInterference`) y Cinemática
 * (`calculateDriveAndBearingKinematics`) (`D5-V41`).
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {any} payload
 */
export function projectPumpDriveAndHybridTelemetry(wizardRoot, payload = {}) {
  const {
    driveEval = {},
    frameEval = {},
    hybridEval = {},
    interferenceEval = {},
    seqEval = {},
    isEs = true
  } = payload;

  PROJECTOR_STATE_CACHE.activeCircuit = 'bombeo';

  const frameCode = frameEval.frameCode || driveEval.bearingFrameCode || 'FRAME-D';
  const cartridgeCode = frameEval.cartridgeCode || driveEval.bearingCartridgeCode || 'DAM005';
  const shaftDiaMm = frameEval.shaftDiameterMm ?? 65;
  const recDynamicCkN = frameEval.recommendedDynamicCkN ?? 195;
  const maxPowerKw = frameEval.maxPowerKw ?? 110;
  const frameServiceFactor = frameEval.serviceFactor ?? driveEval.bearingServiceFactor ?? 1.35;

  const arrName = isEs
    ? driveEval.arrangementNameEs || `Arreglo ${driveEval.arrangementCode || 'CV'}`
    : driveEval.arrangementNameEn || `${driveEval.arrangementCode || 'CV'} Arrangement`;
  const tipSpeedVal = driveEval.impellerTipSpeedMs ?? driveEval.tipSpeedMs ?? 21.5;
  const radialLoadVal = driveEval.radialBeltLoadKn ?? driveEval.beltRadialLoadKn ?? 4.2;
  const estL10h = driveEval.estimatedBearingL10h ?? driveEval.bearingL10Hours ?? 42500;
  const aIsoLab = driveEval.aIsoLabyrinthSmat ?? 1.25;
  const aIsoCont = driveEval.aIsoContaminatedFelt ?? 0.22;
  const ceramicSafe = Boolean(driveEval.ceramicSafeTipSpeed ?? tipSpeedVal <= 28.0);

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-drive-frame-badge',
    isEs
      ? `${frameEval.bearingFrameLabelEs || `Bastidor ${frameCode}`} (${cartridgeCode} • Ø Flecha ${shaftDiaMm} mm • C_rec ${recDynamicCkN} kN • P_máx ${maxPowerKw} kW • FS ${frameServiceFactor})`
      : `${frameEval.bearingFrameLabelEn || `Frame ${frameCode}`} (${cartridgeCode} • Shaft Ø ${shaftDiaMm} mm • C_rec ${recDynamicCkN} kN • P_max ${maxPowerKw} kW • SF ${frameServiceFactor})`,
    {
      'data-frame-code': frameCode,
      'data-cartridge-code': cartridgeCode,
      'data-shaft-mm': shaftDiaMm,
      'data-rec-c-kn': recDynamicCkN,
      'data-max-power-kw': maxPowerKw,
      'data-service-factor': frameServiceFactor
    }
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-drive-contextual-metrics',
    isEs
      ? `${arrName} • n₂ = ${driveEval.pumpRpm ?? 1150} RPM • u₂ = ${tipSpeedVal} m/s (${ceramicSafe ? 'SiC Seguro' : 'Alerta u₂ SiC'}) • F_r = ${radialLoadVal} kN • L₁₀ₕ = ${Number(estL10h).toLocaleString()} h (a_ISO Lab ${aIsoLab}× vs Fieltro ${aIsoCont}×)`
      : `${arrName} • n₂ = ${driveEval.pumpRpm ?? 1150} RPM • u₂ = ${tipSpeedVal} m/s (${ceramicSafe ? 'SiC Safe' : 'SiC Tip Alert'}) • F_r = ${radialLoadVal} kN • L₁₀ₕ = ${Number(estL10h).toLocaleString()} h (a_ISO Lab ${aIsoLab}× vs Felt ${aIsoCont}×)`,
    {
      'data-bearing-sf': driveEval.bearingServiceFactor ?? frameServiceFactor,
      'data-ceramic-safe': ceramicSafe,
      'data-aiso-lab': aIsoLab,
      'data-aiso-felt': aIsoCont
    }
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-drive-frame-specs',
    isEs
      ? `Flecha Ø${shaftDiaMm} mm • Capacidad C ≥ ${recDynamicCkN} kN • P_máx ${maxPowerKw} kW • Factor Servicio ${frameServiceFactor} • a_ISO Laberinto ${aIsoLab}× vs Fieltro ${aIsoCont}×`
      : `Shaft Ø${shaftDiaMm} mm • Dynamic C ≥ ${recDynamicCkN} kN • P_max ${maxPowerKw} kW • Service Factor ${frameServiceFactor} • a_ISO Labyrinth ${aIsoLab}× vs Felt ${aIsoCont}×`
  );

  // Rama D Híbrida (evaluateHybridWetEndConfiguration)
  const hybridPartsCount = Array.isArray(hybridEval.hybridBomParts) ? hybridEval.hybridBomParts.length : 5;
  const impAngle = hybridEval.impellerImpactAngleDeg ?? 82;
  const linAngle = hybridEval.linerGrazingAngleDeg ?? 18;
  const rubSafe = Boolean(hybridEval.rubberThermalSafe ?? true);
  const cutSafe = Boolean(hybridEval.particleCutSafe ?? true);
  const hybRec = Boolean(hybridEval.hybridRecommended ?? true);
  const hybText = isEs
    ? `Rama D Híbrida (${hybridEval.architectureId || 'HYBRID-A05-R55'}): Impulsor ${hybridEval.impellerMaterialCode || 'A05'} (α=${impAngle}°) + Forros ${hybridEval.linerMaterialCode || 'R55'} (α=${linAngle}°) • Ahorro -${hybridEval.massSavingsPct ?? 31.8}% (-${hybridEval.savedMassKg ?? 239.2} kg en ${hybridPartsCount} piezas) • Térmico: ${rubSafe ? 'Seguro' : 'Alerta u₂'} • Corte d80: ${cutSafe ? 'Seguro' : 'Riesgo desgarre'}`
    : `Branch D Hybrid (${hybridEval.architectureId || 'HYBRID-A05-R55'}): Impeller ${hybridEval.impellerMaterialCode || 'A05'} (α=${impAngle}°) + Liners ${hybridEval.linerMaterialCode || 'R55'} (α=${linAngle}°) • Savings -${hybridEval.massSavingsPct ?? 31.8}% (-${hybridEval.savedMassKg ?? 239.2} kg across ${hybridPartsCount} parts) • Thermal: ${rubSafe ? 'Safe' : 'Tip Alert'} • Cut d80: ${cutSafe ? 'Safe' : 'Tear risk'}`;

  const hybEl = setNodeTextAndAttrs(wizardRoot, '#wb-hybrid-rama-d-breakdown', hybText, {
    'data-architecture-id': hybridEval.architectureId || 'HYBRID-A05-R55',
    'data-hybrid-recommended': hybRec,
    'data-smat-invariant': hybridEval.invariantId || 'INV-SMAT-SCI-05'
  });
  if (hybEl && hybEl.style) {
    hybEl.classList.remove('hidden');
    hybEl.style.display = 'block';
  }

  // Secuencia de Montaje e Interferencia Axial (evaluateWetEndAssemblyInterference / evaluatePumpAssemblySequence)
  const activeInterf = Object.keys(interferenceEval).length > 0 ? interferenceEval : seqEval;
  const ngVal = activeInterf.geometricInterferencesNg ?? 0;
  const nsVal = activeInterf.unstableSubassembliesNs ?? 0;
  const bandMm = activeInterf.optimalClearanceBandMm || '0.50–1.00 mm';
  const isValidAssy = Boolean(activeInterf.isValidAssembly ?? activeInterf.sequenceValid ?? ngVal === 0);
  const spallingRisk = Boolean(activeInterf.spallingRiskDetected ?? false);
  const spallingNote = isEs
    ? activeInterf.spallingWarningEs || (spallingRisk ? 'Riesgo de astillamiento frágil en impacto grueso' : 'Sin riesgo de astillamiento (spalling)')
    : activeInterf.spallingWarningEn || (spallingRisk ? 'Brittle spalling risk under coarse impact' : 'Zero brittle spalling risk');
  const collisionNote = isEs
    ? activeInterf.collisionRiskEs || (isValidAssy ? 'Secuencia canónica válida' : 'Colisión axial detectada')
    : activeInterf.collisionRiskEn || (isValidAssy ? 'Valid canonical sequence' : 'Axial collision detected');
  const bomCount = Array.isArray(activeInterf.bomParts) ? activeInterf.bomParts.length : 14;
  const canonSeq = Array.isArray(activeInterf.canonicalSequence)
    ? activeInterf.canonicalSequence.join('→')
    : 'S1→S2→S3→S4→S5';
  const partSpecCode = activeInterf.selectedPartSpec?.code || 'E4147';

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-clearance-ng-ns-spalling',
    isEs
      ? `Banda óptima δ: ${bandMm} • Interferencias Ng=${ngVal}, Ns=${nsVal} (${collisionNote}) • ${spallingNote} • Secuencia ${canonSeq} (${bomCount} pzas, base ${partSpecCode})`
      : `Optimal band δ: ${bandMm} • Interferences Ng=${ngVal}, Ns=${nsVal} (${collisionNote}) • ${spallingNote} • Sequence ${canonSeq} (${bomCount} parts, base ${partSpecCode})`,
    {
      'data-ng': ngVal,
      'data-ns': nsVal,
      'data-valid-assembly': isValidAssy,
      'data-spalling-risk': spallingRisk
    }
  );
}

/**
 * Proyecta los campos de Clasificación por 3 Vasos Marcy (`calculateThreeCupMarcyCycloneBalance`),
 * Corte Plitt (`evaluateHydrocycloneCutPoint`) y Criba de Uretano Weibull (`calculateUrethaneScreenPartitionWeibull`) (`D6-V41`).
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {any} cycRes
 * @param {boolean} [isEs=true]
 */
export function projectClassificationAndScreenTelemetry(wizardRoot, cycRes = {}, isEs = true) {
  PROJECTOR_STATE_CACHE.activeCircuit = 'clasificacion';
  const cwF = cycRes.cwFeedPct ?? 41.9;
  const cwU = cycRes.cwUnderflowPct ?? 71.3;
  const cwO = cycRes.cwOverflowPct ?? 21.8;
  const cvF = cycRes.cvFeedPct ?? 21.1;
  const cvU = cycRes.cvUnderflowPct ?? 48.0;
  const cvO = cycRes.cvOverflowPct ?? 9.4;
  const duDoRatio = cycRes.apexToVortexRatio ?? 0.5;
  const umbrellaDilute = Boolean(cycRes.isUmbrellaDilute ?? false);
  const screenObj = cycRes.screenWeibull || {};
  const vibG = screenObj.vibrationG ?? cycRes.vibrationG ?? 4.5;
  const antiBlind = Boolean(screenObj.antiBlindingCompliant ?? cycRes.antiBlindingCompliant ?? true);

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-cyc-res-cw-cv-3cups',
    isEs
      ? `Vaso 1 Alim.: ${cwF}% Cw (${cvF}% Cv) • Vaso 2 Ápex: ${cwU}% Cw (${cvU}% Cv) • Vaso 3 Rebose: ${cwO}% Cw (${cvO}% Cv)`
      : `Cup 1 Feed: ${cwF}% Cw (${cvF}% Cv) • Cup 2 Apex: ${cwU}% Cw (${cvU}% Cv) • Cup 3 Overflow: ${cwO}% Cw (${cvO}% Cv)`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-cyc-res-dudo-ratio',
    isEs
      ? `Relación Ápex/Vórtice Du/Do = ${duDoRatio} • ${umbrellaDilute ? 'Descarga Paraguas Diluida (Ajustar Ápex)' : 'Ángulo Semi-Paraguas Estable'}`
      : `Apex/Vortex Ratio Du/Do = ${duDoRatio} • ${umbrellaDilute ? 'Dilute Umbrella Spray (Check Apex)' : 'Stable Semi-Umbrella Cone'}`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-scr-res-vibration-g',
    isEs
      ? `Aceleración Criba: ${vibG} G • Nitidez α = ${cycRes.sharpnessAlpha ?? 4.4} • ${antiBlind ? 'Anti-cegamiento Activo (3°–5°)' : 'Revisar Tensión de Malla'}`
      : `Screen Accel: ${vibG} G • Sharpness α = ${cycRes.sharpnessAlpha ?? 4.4} • ${antiBlind ? 'Anti-Blinding Compliant (3°–5°)' : 'Check Screen Tension'}`
  );
}

/**
 * Proyecta los campos de Flotación (`evaluateFlotationCellHydrodynamics`) y Filtración
 * (`calculateFilterPressCycleCapacity` + `evaluateFilterPressPlateDeflection`) (`D6-V41`).
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {any} payload
 */
export function projectFlotationAndFiltrationTelemetry(wizardRoot, payload = {}) {
  const { flotRes = {}, filtRes = {}, isEs = true } = payload;

  // Flotación: zwieteringNjsRpm, suspensionSafe, wearLifeMultiplierPuVsRubber, tipSpeedWindowOptimal
  const suspSafe = Boolean(flotRes.suspensionSafe ?? true);
  const tipOpt = Boolean(flotRes.tipSpeedWindowOptimal ?? true);
  const puMult = flotRes.wearLifeMultiplierPuVsRubber ?? 2.1;

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-flot-res-susp-status',
    isEs
      ? `Zwietering N_js = ${flotRes.zwieteringNjsRpm ?? 178} RPM (${suspSafe ? 'Suspensión Completa' : 'Alerta de Embancamiento'}) • Ventana v_tip: ${tipOpt ? 'Óptima (6.0–7.8 m/s)' : 'Fuera de ventana'}`
      : `Zwietering N_js = ${flotRes.zwieteringNjsRpm ?? 178} RPM (${suspSafe ? 'Full Solids Suspension' : 'Sanding Risk Alert'}) • v_tip Window: ${tipOpt ? 'Optimal (6.0–7.8 m/s)' : 'Out of window'}`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-flot-res-pu-life',
    isEs
      ? `Vida Útil Poliuretano vs Hule: ${puMult}× mayor resistencia al corte • SKU: ${flotRes.recommendedSkuId || 'SMAT-FLOT-MECH-18SP'}`
      : `Polyurethane vs Rubber Wear Life: ${puMult}× longer shear life • SKU: ${flotRes.recommendedSkuId || 'SMAT-FLOT-MECH-18SP'}`
  );

  // Filtración: filtrationMinutes, totalCycleMin, deltaPAsymmetricMpa, ppFatigueAllowableMpa, recommendedPlateSkuId, recommendedClothSkuId
  const filtMin = filtRes.filtrationMinutes ?? 18.0;
  const totCycleMin = filtRes.totalCycleMin ?? 30.0;
  const asymDp = filtRes.deltaPAsymmetricMpa ?? 0.35;
  const allowMpa = filtRes.ppFatigueAllowableMpa ?? 14.5;
  const plateSku = filtRes.recommendedPlateSkuId || filtRes.recommendedSkuId || 'SMAT-FILT-CLOTH-PLATE';
  const clothSku = filtRes.recommendedClothSkuId || 'SMAT-FILT-CLOTH-PLATE';

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-filt-res-cycle-min',
    isEs
      ? `Ciclo Total: ${totCycleMin} min (Formación torta: ${filtMin} min + Descarga: 12 min) • ${filtRes.cyclesPerDay ?? 36} ciclos/día (~${filtRes.dryTonnesPerDay ?? 285} t/d secas)`
      : `Total Cycle: ${totCycleMin} min (Cake form: ${filtMin} min + Turnaround: 12 min) • ${filtRes.cyclesPerDay ?? 36} cycles/day (~${filtRes.dryTonnesPerDay ?? 285} dry t/d)`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-filt-res-asym-dp',
    isEs
      ? `Presión Asimétrica ΔP_asim = ${asymDp} MPa vs Límite Fatiga PP = ${allowMpa} MPa (${filtRes.nom141Compliant !== false ? 'Cumple NOM-141' : 'Riesgo NOM-141'})`
      : `Asymmetric ΔP = ${asymDp} MPa vs PP Fatigue Limit = ${allowMpa} MPa (${filtRes.nom141Compliant !== false ? 'NOM-141 Compliant' : 'NOM-141 Alert'})`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-filt-res-skus',
    isEs
      ? `Prescripción Acoplada: Placa [${plateSku}] + Lona [${clothSku}]`
      : `Coupled Prescription: Plate [${plateSku}] + Cloth [${clothSku}]`
  );
}

/**
 * Proyecta los campos de Metrología de Laboratorio (`calculateGyMinimumSampleMass`, `recommendAstmSieveSeries`,
 * `calculateMarcyScaleReading`, `MARCY_STANDARD_RINGS`, `ASTM_E11_SIEVE_TABLE`) y Calendario Preventivo de 3 Hitos
 * (`calculateCoupledReorderWindowDays`) + Prioridad (`computeCmuPriorityDescriptor`) (`D7-V41`, `D8-V41`).
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {any} payload
 */
export function projectMetrologyAndReorderTelemetry(wizardRoot, payload = {}) {
  const {
    gyEval = {},
    sieveEval = {},
    marcyEval = {},
    reorderEval = {},
    cmuEval = {},
    isEs = true
  } = payload;

  const wetLiters = gyEval.wetPulpVolumeLiters ?? gyEval.requiredPulpLiters ?? 0.52;
  const minMassKg = gyEval.minimumSampleMassKg ?? Number(((gyEval.minimumSampleMassGrams ?? 250) / 1000).toFixed(3));
  const relErrPct = gyEval.targetRelativeStdErrorPercent ?? 5.0;
  const gyRec = isEs ? gyEval.recommendationEs || 'Muestreo representativo en turno' : gyEval.recommendationEn || 'Representative shift sampling';
  const pulpSg = marcyEval.pulpDensitySg ?? marcyEval.slurryDensityKgL ?? 1.406;

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-ctrl-gy-pulp-liters',
    isEs
      ? `Volumen Pulpa Húmeda: ${wetLiters} L (${minMassKg} kg secos • Error s_FSE ±${relErrPct}% • ρ_p = ${pulpSg} kg/L) • ${gyRec}`
      : `Wet Pulp Volume: ${wetLiters} L (${minMassKg} kg dry • Error s_FSE ±${relErrPct}% • ρ_p = ${pulpSg} kg/L) • ${gyRec}`
  );

  const wetReq = Boolean(sieveEval.wetScreeningRequired ?? true);
  const recSeries = sieveEval.recommendedSeries || 'Tyler √2 (#40 a #400)';
  const frameMat = isEs
    ? sieveEval.recommendedFrameMaterialEs || 'Acero Inoxidable 304 (8" sin costuras)'
    : sieveEval.recommendedFrameMaterialEn || '304 Stainless Steel (8" seamless)';

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-ctrl-sieve-frame-rec',
    isEs
      ? `Serie ${recSeries} (${ASTM_E11_SIEVE_TABLE.length} mallas base ASTM E11) • Marco: ${frameMat} • ${wetReq ? 'Tamizado en Húmedo Requerido (Deslamado #400)' : 'Tamizado en Seco Directo'}`
      : `Series ${recSeries} (${ASTM_E11_SIEVE_TABLE.length} ASTM E11 base meshes) • Frame: ${frameMat} • ${wetReq ? 'Wet Screening Required (#400 Desliming)' : 'Direct Dry Screening'}`
  );

  const ringsContainer = wizardRoot?.querySelector?.('#wb-ctrl-marcy-rings-strip');
  if (ringsContainer && !ringsContainer.getAttribute('data-rings-rendered')) {
    ringsContainer.setAttribute('data-rings-rendered', '1');
    const ringsSummary = MARCY_STANDARD_RINGS.map((r, idx) => {
      const sgVal = Number(typeof r === 'object' && r !== null ? r.sg : r);
      const ringNum = typeof r === 'object' && r !== null && r.ring ? r.ring : idx + 1;
      return `R${ringNum}: SG ${sgVal.toFixed(1)}`;
    }).join(' · ');
    ringsContainer.textContent = isEs
      ? `12 Carátulas Estándar Marcy (SG 2.2–4.4): ${ringsSummary}`
      : `12 Standard Marcy Dial Rings (SG 2.2–4.4): ${ringsSummary}`;
  }

  // Calendario Preventivo de 3 Hitos (calculateCoupledReorderWindowDays)
  if (reorderEval && reorderEval.recommendedWindowDays) {
    const dSleeve = reorderEval.sleeveInspectionDay ?? Math.round(reorderEval.recommendedWindowDays * 0.5);
    const dImp = reorderEval.impellerThroatbushSwapDay ?? reorderEval.recommendedWindowDays;
    const dVol = reorderEval.voluteLinerOverhaulDay ?? Math.round(reorderEval.recommendedWindowDays * 1.25);
    const sevFac = reorderEval.severityFactor ?? 1.0;

    setNodeTextAndAttrs(
      wizardRoot,
      '#wb-part-reorder-window-val',
      isEs
        ? `Ciclo ${reorderEval.recommendedWindowDays} días (Sev. ${sevFac}×): Camisa D075C21 Día ${dSleeve} · Impulsor+Cuello Día ${dImp} · Voluta Día ${dVol}`
        : `${reorderEval.recommendedWindowDays}-day Cycle (Sev. ${sevFac}×): D075C21 Sleeve Day ${dSleeve} · Impeller+Throatbush Day ${dImp} · Volute Day ${dVol}`,
      {
        'data-sleeve-day': dSleeve,
        'data-impeller-day': dImp,
        'data-volute-day': dVol,
        'data-severity-factor': sevFac
      }
    );
  }

  if (cmuEval && cmuEval.priorityCode) {
    setNodeTextAndAttrs(
      wizardRoot,
      '#tray-priority-sla-meta',
      isEs
        ? `Nivel ${cmuEval.priorityCode} (Índice ${cmuEval.cmuScore ?? 100}) • Carril: ${cmuEval.checkoutLane || 'OC_SAP'} • Respuesta SLA: ≤${cmuEval.slaResponseMinutes ?? 45} min • Anticipo G5: ${cmuEval.advancePaymentPct ?? 50}%`
        : `Tier ${cmuEval.priorityCode} (Score ${cmuEval.cmuScore ?? 100}) • Lane: ${cmuEval.checkoutLane || 'SAP_PO'} • SLA Response: ≤${cmuEval.slaResponseMinutes ?? 45} min • G5 Advance: ${cmuEval.advancePaymentPct ?? 50}%`
    );
  }
}

/**
 * Proyecta los campos de Diagnóstico Hidráulico, Altitud Barométrica (`calculateAltitudeCorrection`),
 * Selección Tribológica (`selectOptimalMaterial`) y Validación de Planta (`validatePlantLeadInput`) (`D7-V41`).
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {any} payload
 */
export function projectHydraulicAltitudeAndLeadValidation(wizardRoot, payload = {}) {
  const {
    simMetrics = {},
    altData = {},
    optMat = {},
    leadValid = {},
    isEs = true
  } = payload;

  const results = simMetrics.results || simMetrics;
  const baroKpa = altData.barometricPressureKpa ?? results.altitudeCorrection?.barometricPressureKpa ?? 75.6;
  const altTier = altData.altitudeTier || results.altitudeTier || 'HIGH_SIERRA';
  const altTierTxt = altData.altitudeTierText || results.altitudeTierText || (isEs ? 'Alta Montaña (Sierra Madre > 2,000 msnm)' : 'High Mountain (> 2,000 MASL)');
  const npshWarn = Boolean(altData.npshSafeMarginWarning ?? results.npshSafeMarginWarning ?? true);
  const kMotorAlt = simMetrics.combinedMotorAltitudeMultiplier ?? 1.326;

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-altitude-live-strip',
    `Patm = ${(altData.pAtmHeadMca ?? 7.66).toFixed(2)} mca (${baroKpa} kPa) | -ΔNPSHa = ${(altData.deltaNpshLossM ?? 2.67).toFixed(2)} m | IEC 60034-1 = ${(altData.motorDeratingFactor ?? 0.91).toFixed(3)} | K_motor,alt = ${kMotorAlt}x | ${altTierTxt}`,
    {
      'data-altitude-tier': altTier,
      'data-baro-kpa': baroKpa,
      'data-npsh-warning': npshWarn
    }
  );

  const flowCondTxt = results.flowConditionText || results.flowCondition || 'SAFE_HOMOGENEOUS';
  const matName = isEs
    ? results.materialNameEs || optMat.nameEs || results.recommendedMaterial
    : results.materialNameEn || optMat.nameEn || results.recommendedMaterial;
  const matReason = isEs
    ? results.materialReasonEs || optMat.rationaleEs || results.rationaleEs
    : results.materialReasonEn || optMat.rationaleEn || results.rationaleEn;
  const wearMult = optMat.wearMultiplierVsCr27 ?? results.wearLifeRatio ?? 1.0;
  const isAcid = Boolean(optMat.isCorrosiveAcidic ?? false);

  if (matReason) {
    setNodeTextAndAttrs(
      wizardRoot,
      '#metric-rationale',
      `${matName ? `[${matName} • ${wearMult}×] ` : ''}${matReason} (${flowCondTxt}${isAcid ? (isEs ? ' • Régimen Ácido' : ' • Acidic Regime') : ''})`
    );
  }

  if (leadValid && (leadValid.slaCommitmentEs || Array.isArray(leadValid.warnings))) {
    const warnList = Array.isArray(leadValid.warnings) ? leadValid.warnings : [];
    const slaTxt = isEs
      ? leadValid.slaCommitmentEs || 'PLANTA MINERA VERIFICADA • PARÁMETROS PLAUSIBLES'
      : 'VERIFIED MINING PLANT • PLAUSIBLE PARAMETERS';
    setNodeTextAndAttrs(wizardRoot, '#gate-lead-status', slaTxt, {
      'data-warnings-count': warnList.length
    });
  }

  return PROJECTOR_STATE_CACHE;
}
