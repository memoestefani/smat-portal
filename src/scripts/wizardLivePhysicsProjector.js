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
import {
  formatCheckoutLaneHuman,
  formatDischargeRegimeHuman
} from './i18nDomainLabels.js';

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
    if (el.children && el.children.length > 0) {
      const leafSpan = el.querySelector?.('[data-schema-leaf]');
      if (leafSpan) leafSpan.textContent = String(text);
      else if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = `${String(text)} `;
      else el.setAttribute?.('data-schema-display', String(text));
    } else {
      el.textContent = String(text);
    }
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
  const driveEval = payload.driveEval || {};
  const frameEval = payload.frameEval || payload.frameSelect || {};
  const hybridEval = payload.hybridEval || {};
  const interferenceEval = payload.interferenceEval || payload.clearanceEval || {};
  const seqEval = payload.seqEval || payload.assemblySeq || {};
  const isEs = payload.isEs !== undefined ? payload.isEs : true;

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

  const maxRpmVal = frameEval.maxRpm ?? 2200;
  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-drive-frame-specs',
    isEs
      ? `Flecha Ø${shaftDiaMm} mm • Capacidad C ≥ ${recDynamicCkN} kN • P_máx ${maxPowerKw} kW • n_máx ${maxRpmVal} RPM • Factor Servicio ${frameServiceFactor} • a_ISO Laberinto ${aIsoLab}× vs Fieltro ${aIsoCont}×`
      : `Shaft Ø${shaftDiaMm} mm • Dynamic C ≥ ${recDynamicCkN} kN • P_max ${maxPowerKw} kW • n_max ${maxRpmVal} RPM • Service Factor ${frameServiceFactor} • a_ISO Labyrinth ${aIsoLab}× vs Felt ${aIsoCont}×`
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
  if (hybEl && hybEl.classList) {
    hybEl.classList.remove('hidden');
    hybEl.classList.add('is-visible-block');
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

  // Salidas antes descartadas (UNREAD RETURNS: DEB-V50-13): Serie, Masa Activa, Izaje NIOSH, Material Activo y Híbrido
  const activeSeriesVal = activeInterf.activeSeries ?? activeInterf.selectedPartSpec?.series ?? activeInterf.pipeSeries ?? '6x4';
  const activeWeightVal = activeInterf.activeWeightKg ?? activeInterf.selectedPartSpec?.weight_kg ?? activeInterf.totalAssemblyMassKg ?? 0;
  const activeHoistVal = Boolean(activeInterf.activeNioshHoistRequired ?? (Number(activeWeightVal) >= 23));
  const activeMaterialVal = activeInterf.activeMaterialCode ?? activeInterf.selectedPartSpec?.material ?? hybridEval.impellerMaterialCode ?? 'A05';

  setNodeTextAndAttrs(wizardRoot, '#wb-asm-active-series', String(activeSeriesVal));
  setNodeTextAndAttrs(wizardRoot, '#wb-asm-active-weight', `${Number(activeWeightVal).toFixed(1)} kg`);
  setNodeTextAndAttrs(wizardRoot, '#wb-asm-active-hoist', activeHoistVal ? (isEs ? 'Izaje Mecánico (>=23 kg)' : 'Hoist Required (>=23 kg)') : (isEs ? 'Manual (<23 kg)' : 'Manual (<23 kg)'), {
    'data-niosh-hoist': String(activeHoistVal)
  });
  setNodeTextAndAttrs(wizardRoot, '#wb-asm-active-material', String(activeMaterialVal));
  setNodeTextAndAttrs(wizardRoot, '#wb-hybrid-verdict', hybRec ? (isEs ? 'Híbrido A05+R55 Recomendado' : 'Hybrid A05+R55 Recommended') : (isEs ? 'Monometálico Cr27 / R55' : 'Monometallic Cr27 / R55'), {
    'data-hybrid-recommended': String(hybRec)
  });
  setNodeTextAndAttrs(wizardRoot, '#wb-hybrid-mass-savings', `-${Number(hybridEval.massSavingsPct ?? 31.8).toFixed(1)}%`);

  const volLoss = activeInterf.volumetricEfficiencyDropPct ?? activeInterf.volumetricEfficiencyLossPct ?? 1.6;
  const pipeLoss = activeInterf.pipeVelocityMarginLossPct ?? Number((volLoss * 0.75).toFixed(2));
  setNodeTextAndAttrs(wizardRoot, '#trib-vol-loss-out', `-${Number(volLoss).toFixed(1)}%`);
  setNodeTextAndAttrs(wizardRoot, '#trib-pipe-loss-out', `-${Number(pipeLoss).toFixed(1)}%`);
  setNodeTextAndAttrs(wizardRoot, '#trib-status-out', collisionNote);
}

/**
 * Proyecta los campos de Clasificación por 3 Vasos Marcy (`calculateThreeCupMarcyCycloneBalance`),
 * Corte Plitt (`evaluateHydrocycloneCutPoint`) y Criba de Uretano Weibull (`calculateUrethaneScreenPartitionWeibull`) (`D6-V41`).
 *
 * @param {HTMLElement|Document} wizardRoot
 * @param {any} cycResOrPayload
 * @param {boolean} [isEs=true]
 */
export function projectClassificationAndScreenTelemetry(wizardRoot, cycResOrPayload = {}, isEs = true) {
  PROJECTOR_STATE_CACHE.activeCircuit = 'clasificacion';
  const raw = cycResOrPayload || {};
  const cycRes = raw.cycRes || raw;
  const scrRes = raw.scrRes || cycRes.screenWeibull || {};
  const langEs = raw.isEs !== undefined ? raw.isEs : isEs;
  const cwF = cycRes.cwFeedPct ?? 41.9;
  const cwU = cycRes.cwUnderflowPct ?? 71.3;
  const cwO = cycRes.cwOverflowPct ?? 21.8;
  const cvF = cycRes.cvFeedPct ?? 21.1;
  const cvU = cycRes.cvUnderflow ?? cycRes.cvUnderflowPct ?? 48.0;
  const cvO = cycRes.cvOverflowPct ?? 9.4;
  const duDoRatio = cycRes.apexToVortexRatio ?? 0.5;
  const umbrellaDilute = Boolean(cycRes.isUmbrellaDilute ?? false);
  const cutD50c = cycRes.cutPointD50cUm ?? cycRes.d50cMicrons ?? 74;
  const vibG = scrRes.vibrationG ?? cycRes.vibrationG ?? 4.5;
  const alphaVal = scrRes.sharpnessAlpha ?? cycRes.sharpnessAlpha ?? 4.4;
  const antiBlind = Boolean(scrRes.antiBlindingCompliant ?? cycRes.antiBlindingCompliant ?? true);

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-cyc-res-cw-cv-3cups',
    langEs
      ? `Vaso 1 Alim.: ${cwF}% Cw (${cvF}% Cv) • Vaso 2 Ápex: ${cwU}% Cw (${cvU}% Cv) • Vaso 3 Rebose: ${cwO}% Cw (${cvO}% Cv) • d50c=${cutD50c} µm`
      : `Cup 1 Feed: ${cwF}% Cw (${cvF}% Cv) • Cup 2 Apex: ${cwU}% Cw (${cvU}% Cv) • Cup 3 Overflow: ${cwO}% Cw (${cvO}% Cv) • d50c=${cutD50c} µm`
  );

  setNodeTextAndAttrs(wizardRoot, '#wb-cyc-res-cc', `${cycRes.circulatingLoadPct ?? 215}%`);
  setNodeTextAndAttrs(wizardRoot, '#wb-cyc-res-d50', `${cutD50c} µm`);
  setNodeTextAndAttrs(wizardRoot, '#wb-cyc-res-cvu', `${Number(cvU).toFixed(2)}`);
  setNodeTextAndAttrs(wizardRoot, '#wb-cyc-res-dudo', `${duDoRatio}`);
  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-cyc-res-roping',
    formatDischargeRegimeHuman(cycRes.dischargeRegime || (umbrellaDilute ? 'UMBRELLA_DILUTE' : 'SEMI_UMBRELLA'), langEs ? 'es' : 'en')
  );
  setNodeTextAndAttrs(wizardRoot, '#wb-scr-res-oversize', `${scrRes.partitionToOversizePct ?? 91.5}%`);
  setNodeTextAndAttrs(wizardRoot, '#wb-scr-res-dilation', `${scrRes.elasticDilationPct ?? 1.8}%`);
  setNodeTextAndAttrs(wizardRoot, '#wb-scr-res-weibull', `α=${alphaVal}`);

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-cyc-res-dudo-ratio',
    langEs
      ? `Relación Ápex/Vórtice Du/Do = ${duDoRatio} • ${umbrellaDilute ? 'Descarga Paraguas Diluida (Ajustar Ápex)' : 'Ángulo Semi-Paraguas Estable'}`
      : `Apex/Vortex Ratio Du/Do = ${duDoRatio} • ${umbrellaDilute ? 'Dilute Umbrella Spray (Check Apex)' : 'Stable Semi-Umbrella Cone'}`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-scr-res-vibration-g',
    langEs
      ? `Aceleración Criba: ${vibG} G • Nitidez α = ${alphaVal} • ${antiBlind ? 'Anti-cegamiento Activo (3°–5°)' : 'Revisar Tensión de Malla'}`
      : `Screen Accel: ${vibG} G • Sharpness α = ${alphaVal} • ${antiBlind ? 'Anti-Blinding Compliant (3°–5°)' : 'Check Screen Tension'}`
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
      ? `Zwietering N_js = ${flotRes.zwieteringNjsRpm ?? 178} RPM (${suspSafe ? 'Suspensión Completa' : 'Alerta de Embancamiento'}) • Ventana u₂: ${tipOpt ? 'Óptima (6.0–7.8 m/s)' : 'Fuera de ventana'}`
      : `Zwietering N_js = ${flotRes.zwieteringNjsRpm ?? 178} RPM (${suspSafe ? 'Full Solids Suspension' : 'Sanding Risk Alert'}) • u₂ Window: ${tipOpt ? 'Optimal (6.0–7.8 m/s)' : 'Out of window'}`
  );

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-flot-res-pu-life',
    isEs
      ? `Vida Útil Poliuretano vs Hule: ${puMult}× mayor resistencia al corte • SKU: ${flotRes.recommendedSkuId || 'SMAT-FLOT-MECH-18SP'}`
      : `Polyurethane vs Rubber Wear Life: ${puMult}× longer shear life • SKU: ${flotRes.recommendedSkuId || 'SMAT-FLOT-MECH-18SP'}`
  );
  if (flotRes.sbInverseSeconds !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-sb', `${flotRes.sbInverseSeconds} s⁻¹`);
  if (flotRes.rateConstantMin !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-k', `${flotRes.rateConstantMin} min⁻¹`);
  if (flotRes.tipSpeedMS !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-vtip', `${flotRes.tipSpeedMS} m/s`);
  if (flotRes.zwieteringNjsRpm !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-njs', `${flotRes.zwieteringNjsRpm} RPM`);
  if (flotRes.floatabilityP !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-p', `${flotRes.floatabilityP}`);
  if (flotRes.frothRecoveryRf !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-rf', `${flotRes.frothRecoveryRf}`);
  if (flotRes.recommendedSkuId) setNodeTextAndAttrs(wizardRoot, '#wb-flot-res-sku', flotRes.recommendedSkuId);

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
  if (filtRes.maxBendingStressMpa !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-filt-res-stress', `${filtRes.maxBendingStressMpa} MPa`);
  if (filtRes.flexuralSafetyFactor !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-filt-res-fs', `${filtRes.flexuralSafetyFactor}`);
  if (filtRes.cyclesPerDay !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-filt-res-cycles', `${filtRes.cyclesPerDay} c/d`);
  if (filtRes.dryTonnesPerDay !== undefined) setNodeTextAndAttrs(wizardRoot, '#wb-filt-res-tpd', `${filtRes.dryTonnesPerDay} t/d`);
  setNodeTextAndAttrs(wizardRoot, '#wb-filt-res-nom141', filtRes.nom141Compliant !== false ? (isEs ? 'Cumple NOM-141' : 'NOM-141 OK') : (isEs ? 'Alerta NOM-141' : 'NOM-141 Alert'));
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
  const gyEval = payload.gyEval || {};
  const sieveEval = payload.sieveEval || {};
  const marcyEval = payload.marcyEval || {};
  const reorderEval = payload.reorderEval || payload.reorderRes || {};
  const tradeInEval = payload.tradeInEval || {};
  const trayState = payload.trayState || {};
  const cmuEval = payload.cmuEval || {};
  const isEs = payload.isEs !== undefined ? payload.isEs : true;

  const wetLiters = gyEval.wetPulpVolumeLiters ?? gyEval.requiredPulpLiters ?? 0.52;
  const minMassKg = gyEval.minimumSampleMassKg ?? Number(((gyEval.minimumSampleMassGrams ?? 250) / 1000).toFixed(3));
  const relErrPct = gyEval.targetRelativeStdErrorPercent ?? 5.0;
  const gyRec = isEs ? gyEval.recommendationEs || 'Muestreo representativo en turno' : gyEval.recommendationEn || 'Representative shift sampling';
  const pulpSg = marcyEval.pulpDensitySg ?? marcyEval.pulpDensityKgL ?? marcyEval.slurryDensityKgL ?? 1.406;

  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-sm', `${Number(pulpSg).toFixed(3)} kg/L`);
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-cw', `${Number(marcyEval.cwPct ?? marcyEval.solidsWeightPercent ?? 45).toFixed(1)}%`);
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-gy', `${minMassKg} kg`);
  const topSieve = (Array.isArray(sieveEval.sieveStack) && sieveEval.sieveStack[0]?.sieveNumber) || sieveEval.sieveNumber || sieveEval.primaryControlMesh || '#100';
  const drySampleG = sieveEval.drySampleMassGrams ?? Math.round(minMassKg * 1000);
  const hoistReq = Boolean(gyEval.hoistRequired ?? (minMassKg >= 23));
  const twoPersonReq = Boolean(gyEval.twoPersonAssistRequired ?? (minMassKg >= 15 && minMassKg < 23));
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-sieve', String(topSieve));
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-drysample', `${drySampleG} g`);
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-hoist', hoistReq ? (isEs ? 'Requiere polipasto (>=23 kg)' : 'Hoist Required (>=23 kg)') : (isEs ? 'Manual seguro' : 'Safe Manual'));
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-two-person', twoPersonReq ? (isEs ? 'Asistencia 2 operadores' : 'Two-Person Assist') : (isEs ? '1 operador' : 'Single Operator'));
  setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-rr', `n=${sieveEval.rosinRammlerUniformityN ?? sieveEval.rosinRammlerSlopeN ?? 1.08}`);
  const firstSieve = Array.isArray(sieveEval.sieveStack) ? sieveEval.sieveStack[0] : null;
  const rrYVal = sieveEval.rosinRammlerY ?? firstSieve?.rosinRammlerY ?? sieveEval.rosinRammlerYPrime;
  if (rrYVal !== undefined) {
    setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-rry', `y=${Number(rrYVal).toFixed(4)}`);
  }
  const recContainer = isEs ? marcyEval.recommendedContainerEs : marcyEval.recommendedContainerEn;
  if (recContainer) {
    setNodeTextAndAttrs(wizardRoot, '#wb-ctrl-res-container', recContainer);
  }

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
    setNodeTextAndAttrs(wizardRoot, '#jrp-stage-1-days', `${dSleeve} d`);
    setNodeTextAndAttrs(wizardRoot, '#jrp-stage-2-days', `${dImp} d`);
    setNodeTextAndAttrs(wizardRoot, '#jrp-stage-3-days', `${dVol} d`);
    setNodeTextAndAttrs(wizardRoot, '#wb-jrp-window-days', `${reorderEval.reorderWindowDays ?? reorderEval.recommendedWindowDays} d`);
    if (reorderEval.rawLifeDays !== undefined) {
      setNodeTextAndAttrs(wizardRoot, '#wb-jrp-raw-life-days', `${reorderEval.rawLifeDays} d`);
    }
  }

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-core-tradein-eligible',
    Boolean(tradeInEval.eligible ?? true) ? (isEs ? 'Casco DAM005 Elegible (-22%/-12%)' : 'DAM005 Core Eligible (-22%/-12%)') : (isEs ? 'No elegible' : 'Ineligible')
  );
  setNodeTextAndAttrs(wizardRoot, '#qtray-state-version', `v${trayState.version ?? tradeInEval.version ?? 3}`);

  if (cmuEval && cmuEval.priorityCode) {
    const laneHuman = formatCheckoutLaneHuman(cmuEval.checkoutLane || 'ORDEN_COMPRA_SAP', isEs ? 'es' : 'en');
    setNodeTextAndAttrs(
      wizardRoot,
      '#tray-priority-sla-meta',
      isEs
        ? `Nivel ${cmuEval.priorityCode} (Índice ${cmuEval.cmuScore ?? 100}) • Carril: ${laneHuman} • Atención Durango Lun–Vie 8–18h • Anticipo G5: ${cmuEval.advancePaymentPct ?? 50}%`
        : `Tier ${cmuEval.priorityCode} (Score ${cmuEval.cmuScore ?? 100}) • Lane: ${laneHuman} • Durango Desk Mon–Fri 8–18h • G5 Advance: ${cmuEval.advancePaymentPct ?? 50}%`
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
  const simMetrics = payload.simMetrics || payload.slurryRes || {};
  const altData = payload.altData || payload.altRes || {};
  const optMat = payload.optMat || payload.matOpt || {};
  const leadValid = payload.leadValid || payload.leadVal || {};
  const isEs = payload.isEs !== undefined ? payload.isEs : true;

  const results = simMetrics.results || simMetrics;
  const baroKpa = altData.barometricPressureKpa ?? results.altitudeCorrection?.barometricPressureKpa ?? 101.32;
  const altTier = altData.altitudeTier || results.altitudeTier || 'sea_level';
  const altTierTxt = altData.altitudeTierText || results.altitudeTierText || '';
  const npshWarn = Boolean(altData.npshSafeMarginWarning ?? results.npshSafeMarginWarning ?? false);
  const kMotorAlt = Number(simMetrics.combinedMotorAltitudeMultiplier ?? results.combinedMotorAltitudeMultiplier ?? altData.combinedMotorAltitudeMultiplier ?? 1.0);
  const patmVal = Number(altData.pAtmHeadMca ?? results.pAtmHeadMca ?? 10.33);
  const deltaNpshVal = Number(altData.deltaNpshLossM ?? results.deltaNpshLossM ?? 0);
  const motorDeratVal = Number(altData.motorDeratingFactor ?? results.motorDeratingFactor ?? 1.0);
  const penaltyPct = Number(simMetrics.motorSizingPenaltyPct ?? results.motorSizingPenaltyPct ?? altData.motorSizingPenaltyPct ?? Math.round((1 / Math.max(0.5, motorDeratVal) - 1) * 1000) / 10);

  setNodeTextAndAttrs(wizardRoot, '#metric-patm', `${patmVal.toFixed(2)} mca`);
  setNodeTextAndAttrs(wizardRoot, '#metric-patm-mca', `${patmVal.toFixed(2)} mca`);
  setNodeTextAndAttrs(wizardRoot, '#metric-delta-npsh', `-${deltaNpshVal.toFixed(2)} m`);
  setNodeTextAndAttrs(wizardRoot, '#dossier-metric-delta-npsh', `-${deltaNpshVal.toFixed(2)} m NPSHa`);
  setNodeTextAndAttrs(wizardRoot, '#metric-iec-derating', `${motorDeratVal.toFixed(3)}`);
  setNodeTextAndAttrs(wizardRoot, '#metric-motor-iec', `${motorDeratVal.toFixed(3)}`);
  setNodeTextAndAttrs(wizardRoot, '#metric-k-motor-alt', `${kMotorAlt.toFixed(3)}x`);
  setNodeTextAndAttrs(wizardRoot, '#metric-motor-penalty-pct', `+${penaltyPct.toFixed(1)}%`);

  const smVal = results.slurrySpecificGravity ?? results.slurry_sg;
  const cvVal = results.solidsVolumetricPercent ?? results.solids_cv;
  const hrVal = results.headDeratingFactorHr ?? results.head_ratio;
  const erVal = results.effDeratingFactorEr ?? results.eff_ratio_er;
  const lifeVal = results.estimatedImpellerLifeHours ?? results.impeller_life_h;
  const wearMult = results.wearLifeRatio ?? results.wear_life_ratio ?? optMat.wearMultiplierVsCr27;
  const flVal = results.durandFactorFL ?? results.durand_fl;
  const vRecVal = results.recommendedPipeVelocityMs ?? results.safe_velocity_ms;
  const vCritRaw = results.criticalSettlingVelocityMs ?? results.criticalVelocityMs ?? results.critical_velocity_ms;
  const vActRaw = results.actualPipeVelocityMs ?? results.actualVelocityMs ?? results.line_velocity_ms;

  if (smVal !== undefined) setNodeTextAndAttrs(wizardRoot, '#metric-sm', `${Number(smVal).toFixed(2)}`);
  if (cvVal !== undefined) setNodeTextAndAttrs(wizardRoot, '#metric-cv', `${Number(cvVal).toFixed(1)}%`);
  if (vCritRaw !== undefined) setNodeTextAndAttrs(wizardRoot, '#metric-vc', `${Number(vCritRaw).toFixed(2)} m/s`);
  if (vActRaw !== undefined) setNodeTextAndAttrs(wizardRoot, '#metric-vact', `${Number(vActRaw).toFixed(2)}`);
  if (vRecVal !== undefined) setNodeTextAndAttrs(wizardRoot, '#metric-v-rec', `${Number(vRecVal).toFixed(2)} m/s`);
  if (flVal !== undefined) setNodeTextAndAttrs(wizardRoot, '#metric-fl', `${Number(flVal).toFixed(2)}`);
  if (hrVal !== undefined) {
    setNodeTextAndAttrs(wizardRoot, '#metric-hr', `${Number(hrVal).toFixed(3)}`);
    setNodeTextAndAttrs(wizardRoot, '#metric-derating-hr', `HR ${Number(hrVal).toFixed(2)}`);
  }
  if (erVal !== undefined) {
    setNodeTextAndAttrs(wizardRoot, '#metric-er', `${Number(erVal).toFixed(3)}`);
    setNodeTextAndAttrs(wizardRoot, '#metric-derating-er', `${Number(erVal).toFixed(2)}`);
  }
  if (lifeVal !== undefined) {
    const lifeFormatted = Number(lifeVal).toLocaleString('en-US');
    const multLabel = wearMult !== undefined ? ` (${Number(wearMult).toFixed(1)}× vs FG)` : '';
    setNodeTextAndAttrs(wizardRoot, '#metric-wear-hours', `${lifeFormatted} h${multLabel}`);
  }
  if (wearMult !== undefined) {
    setNodeTextAndAttrs(wizardRoot, '#metric-wear-ratio', `${Number(wearMult).toFixed(1)}×`);
  }
  const sobolDriver = payload.sobolDriver || results.sobolDominantDriver;
  if (sobolDriver) {
    setNodeTextAndAttrs(wizardRoot, '#metric-sobol-driver', String(sobolDriver));
  }

  setNodeTextAndAttrs(
    wizardRoot,
    '#wb-altitude-live-strip',
    `Patm = ${patmVal.toFixed(2)} mca (${baroKpa} kPa) | -ΔNPSHa = ${deltaNpshVal.toFixed(2)} m | IEC 60034-1 = ${motorDeratVal.toFixed(3)} | K_motor,alt = ${kMotorAlt.toFixed(3)}x | ${altTierTxt}`,
    {
      'data-altitude-tier': altTier,
      'data-baro-kpa': baroKpa,
      'data-npsh-warning': npshWarn
    }
  );

  const flowCondTxt = results.flowConditionText || results.flowCondition || '';
  const vCritStr = vCritRaw !== undefined ? Number(vCritRaw).toFixed(2) : '—';
  const vActStr = vActRaw !== undefined ? Number(vActRaw).toFixed(2) : '—';
  const matName = isEs
    ? results.materialNameEs || optMat.nameEs || results.recommendedMaterial || results.recommended_alloy
    : results.materialNameEn || optMat.nameEn || results.recommendedMaterial || results.recommended_alloy;
  const matReason = isEs
    ? results.materialReasonEs || optMat.rationaleEs || results.rationaleEs
    : results.materialReasonEn || optMat.rationaleEn || results.rationaleEn;
  const wearMultLabel = wearMult ?? 1.0;
  const isAcid = Boolean(optMat.isCorrosiveAcidic ?? false);

  if (matReason) {
    setNodeTextAndAttrs(
      wizardRoot,
      '#metric-rationale',
      `${matName ? `[${matName} • ${wearMultLabel}×] ` : ''}${matReason} (${flowCondTxt ? `${flowCondTxt} • ` : ''}v=${vActStr}/${vCritStr} m/s${isAcid ? (isEs ? ' • Régimen Ácido' : ' • Acidic Regime') : ''})`
    );
  }

  if (payload.anexo22Summary) {
    const ax = payload.anexo22Summary;
    const contact = ax.passport?.contact || {};
    const meta = ax.passport?.jsonMetadata || {};
    setNodeTextAndAttrs(
      wizardRoot,
      '#sap-live-anexo22-tuple',
      `${ax.satTigieLine || ''} • ${ax.laneLabel || ''} (${ax.dualCheckout?.requiresAdvancePct ?? ax.requiresAdvancePct ?? 0}% ${isEs ? 'anticipo' : 'deposit'})`,
      {
        'data-hub-location': ax.passport?.industrialHub || ax.hubLocation || 'Durango CP 34166',
        'data-currencies': (meta.currencySupport || ax.currencySupport || ['MXN', 'USD']).join(','),
        'data-sales-email': contact.salesEmail || ax.salesEmail || 'ventas@smatminerals.com',
        'data-eng-email': contact.engineeringEmail || ax.engineeringEmail || 'contacto@smatminerals.com',
        'data-phone-office': contact.phoneOffice || ax.phoneOffice || '+52 618 810 4408',
        'data-phone-wa': contact.phoneWhatsapp || ax.phoneWhatsapp || '+52 618 367 0664'
      }
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
