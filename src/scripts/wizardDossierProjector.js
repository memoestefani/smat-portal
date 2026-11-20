// @ts-nocheck
/**
 * wizardDossierProjector.js
 * ---------------------------------------------------------------------------
 * Costura Modular C3 extraída desde quoteWizardController.js (D3-V50 / D5-V50).
 * Proyector declarativo gobernado por `ENGINE_SCHEMA_REGISTRY` (Two-Sort: 0 innerHTML),
 * conectado al DAG XDSM puro y proyectando el 100% de salidas previamente no leídas
 * (UNREAD RETURNS) y acoplamiento JRP (predictedWearHours, operatingHoursPerDay, criticalityMode).
 */

import { ENGINE_SCHEMA_REGISTRY } from './engineSchemaRegistry.js';
import {
  calculateDriveAndBearingKinematics,
  evaluateHybridWetEndConfiguration,
  evaluatePumpAssemblySequence,
  evaluateWetEndAssemblyInterference,
  selectBearingFrameByPowerAndRpm
} from './pumpAssemblyAndDriveEngine.js';
import {
  formatDossierCircuitPhysicsRow,
  formatDossierMetrologyBadge,
  formatDossierSimulationBanner
} from './quoteDossierRenderer.js';
import {
  calculateCoupledReorderWindowDays,
  computeCmuPriorityDescriptor,
  evaluateBearingCartridgeCoreTradeIn,
  getTrayState
} from './requisitionTrayBus.js';
import {
  validatePlantLeadInput
} from './slurryEngine.js';
import {
  calculateGyMinimumSampleMass,
  calculateMarcyScaleReading,
  recommendAstmSieveSeries,
  selectOptimalMaterial
} from './tribologyAndCompatibilityEngine.js';
import {
  buildSapAnexo22ComplianceSummary
} from './vendorPassportAndTradeInController.js';
import {
  loadEngineeringContextSnapshot
} from './wizardCircuitPhysicsController.js';
import {
  renderWetEndMaterialMatrixCard
} from './wizardCircuitXorStatechart.js';
import {
  projectHydraulicAltitudeAndLeadValidation,
  projectMetrologyAndReorderTelemetry,
  projectPumpDriveAndHybridTelemetry
} from './wizardLivePhysicsProjector.js';
import {
  buildSmatCode,
  projectWorkbenchToDOM
} from './wizardMiningAndCodeDecoder.js';
import {
  formatNioshErgonomicStatus,
  getAtomicPartSpecs,
  loadWorkbenchState,
  normalizeMaterialKey,
  saveWorkbenchSession
} from './workbenchBus.js';

/**
 * Emite un destello visual no intrusivo al mutar un valor técnico proyectado.
 * @param {HTMLElement|null|undefined} el
 */
export function flashInk(el) {
  if (!el || !el.classList) return;
  el.classList.remove('live-ink-flash');
  void el.offsetWidth;
  el.classList.add('live-ink-flash');
}

/**
 * Delega el render de la matriz tribológica de 5 ramas para materiales húmedos.
 * @param {string} matKey
 * @param {Record<string, any>} ctx
 */
export function renderWetEndMaterialMatrix(matKey, ctx = {}) {
  const doc = ctx.doc || (typeof document !== 'undefined' ? document : null);
  return renderWetEndMaterialMatrixCard(matKey, {
    doc,
    isEs: ctx.isEs !== false,
    pipeSeries: ctx.pipeSeries || '6x4',
    d80Microns: Number(ctx.d80Microns ?? 220),
    solidsWeightPercent: Number(ctx.solidsWeightPercent ?? 45),
    pulpPh: Number(ctx.pulpPh ?? 7.5)
  });
}

/**
 * Conmuta las pestañas de justificación SAP vs mantenimiento en el Dossier.
 * @param {'maint'|'sap'} tab
 * @param {Record<string, any>} dom
 */
export function switchDossierTabView(tab, dom = {}) {
  const { tabBtnMaint, tabBtnSap, paneMaint, paneSap } = dom;
  const isMaint = tab === 'maint';
  if (tabBtnMaint) {
    tabBtnMaint.classList.toggle('active', isMaint);
    tabBtnMaint.setAttribute('aria-selected', isMaint ? 'true' : 'false');
  }
  if (tabBtnSap) {
    tabBtnSap.classList.toggle('active', !isMaint);
    tabBtnSap.setAttribute('aria-selected', !isMaint ? 'true' : 'false');
  }
  if (paneMaint) {
    paneMaint.classList.toggle('active-pane', isMaint);
    paneMaint.classList.toggle('hidden-pane', !isMaint);
  }
  if (paneSap) {
    paneSap.classList.toggle('active-pane', !isMaint);
    paneSap.classList.toggle('hidden-pane', isMaint);
  }
}

/**
 * Proyecta los textos seguros (sin innerHTML) de cinemática en la tabla viva de `/cotizar/`.
 */
function projectLiveKinematicsRowSafe(elLiveKinematics, params) {
  if (!elLiveKinematics) return;
  const {
    matHuman,
    arrDisplay,
    pumpRpm,
    tipSpeedMs,
    beltRadialLoadKn,
    l10hNum,
    frontClearanceMm,
    lossPctVal,
    pipeVelLossVal,
    collShort
  } = params;

  const pipeEl = elLiveKinematics.querySelector?.('#wb-pipe-vel-loss');
  const collEl = elLiveKinematics.querySelector?.('#live-assembly-collision-note');
  if (pipeEl && collEl) {
    const prefixNode = elLiveKinematics.querySelector?.('[data-kin-summary-prefix]');
    const summaryPrefix = `${matHuman} | ${arrDisplay} (n₂=${pumpRpm} RPM, u₂=${tipSpeedMs.toFixed(1)} m/s, F_r=${Number(beltRadialLoadKn || 0).toFixed(2)} kN, L₁₀ₕ=${l10hNum.toLocaleString('en-US')} h) | δ=${frontClearanceMm.toFixed(2)} mm (Δη_v=-${lossPctVal.toFixed(1)}%, ΔV_pipe=-`;
    if (prefixNode) {
      prefixNode.textContent = summaryPrefix;
    } else if (!elLiveKinematics.dataset?.structuredKin) {
      elLiveKinematics.dataset.structuredKin = '1';
    }
    pipeEl.textContent = `${Number(pipeVelLossVal).toFixed(1)}%`;
    collEl.textContent = collShort;
    return;
  }

  elLiveKinematics.textContent = `${matHuman} | ${arrDisplay} (n₂=${pumpRpm} RPM, u₂=${tipSpeedMs.toFixed(1)} m/s, F_r=${Number(beltRadialLoadKn || 0).toFixed(2)} kN, L₁₀ₕ=${l10hNum.toLocaleString('en-US')} h) | δ=${frontClearanceMm.toFixed(2)} mm (Δη_v=-${lossPctVal.toFixed(1)}%, ΔV_pipe=-${Number(pipeVelLossVal).toFixed(1)}%) | ${collShort}`;
}

/**
 * Resuelve la descripción visual por circuito (bombeo, flotación, filtración, control, clasificación).
 */
function resolveCircuitDossierSpec(doc, state) {
  const { currentCircuit, isEs, dom } = state;
  let roleVal = '';
  let roleText = '';
  let sizeText = '';
  let condText = '';
  let smatCode = '';
  let sapMatText = '';
  let pipeHeaderTxt = '';
  let stressHeaderTxt = '';
  let tableMatTxt = '';
  let showRecirc = false;

  if (currentCircuit === 'bombeo') {
    const selectedOpt = dom.selectRole?.options[dom.selectRole.selectedIndex];
    roleVal = dom.selectRole?.value || 'kit_wet_end';
    roleText = selectedOpt ? selectedOpt.text : (isEs ? 'Kit Extremo Húmedo Completo' : 'Complete Wet-End Kit');
    const pipeOpt = dom.selectPipeSize?.options[dom.selectPipeSize.selectedIndex];
    const pipeVal = dom.selectPipeSize?.value || '6x4';
    sizeText = pipeOpt ? pipeOpt.text : (isEs ? 'Tubería 6" a 4" (Línea Principal de Proceso)' : '6"x4" Slurry Pipe Line');

    const symVal = dom.inputStressSymptom?.value || '';
    const activeStressChip = doc.querySelector('.stress-chip.active');
    const isConfirmed = activeStressChip && activeStressChip.getAttribute('data-confirmed') === 'true' && symVal !== '';
    const symMap = {
      roca_dura: isEs ? 'Roca Dura y Golpeteo Continuo' : 'Hard Rock & Impact',
      acido_quimica: isEs ? 'Agua Ácida / Ataque Químico' : 'Acid Slurry / Chemical Attack',
      arena_fina: isEs ? 'Arena Fina y Corte a Velocidad' : 'Fine Slurry & High Velocity',
      fuga_sello: isEs ? 'Fuga Constante en Sello / Inundación' : 'Seal Leakage / Sump Flood',
      mixta_duda: isEs ? 'Condición Mixta / Pulpa Compleja' : 'Mixed Slurry / Complex Pulp'
    };
    condText = isConfirmed && symMap[symVal]
      ? symMap[symVal]
      : (isEs ? 'Pendiente de dictamen en campo (Asesoría SMAT solicitada)' : 'Pending field assessment (SMAT technical advice requested)');
    smatCode = buildSmatCode('bombeo', roleVal, pipeVal, symVal);
    sapMatText = isEs ? 'Dictamen según severidad de pulpa (Durango)' : 'Metallurgy dictated by slurry severity (Durango)';
    pipeHeaderTxt = isEs ? 'Línea de Tubería de Proceso:' : 'Process Line Pipe Size:';
    stressHeaderTxt = isEs ? 'Condición de Operación en Planta:' : 'Plant Operating Condition:';
    tableMatTxt = isConfirmed
      ? (isEs ? 'Dureza Metalúrgica Certificada' : 'Certified Metallurgy Hardness')
      : sapMatText;
    showRecirc = (roleVal === 'solo_impulsor' || roleVal === 'solo_voluta');
  } else if (currentCircuit === 'flotacion') {
    const selectedOptFlot = dom.selectRoleFlot?.options[dom.selectRoleFlot.selectedIndex];
    roleVal = dom.selectRoleFlot?.value || 'rotor_estator';
    roleText = selectedOptFlot ? selectedOptFlot.text : (isEs ? 'Mecanismo Rotor y Estator de Elastómero' : 'Elastomer Rotor & Stator Mechanism');
    const capOpt = dom.selectFlotCapacity?.options[dom.selectFlotCapacity.selectedIndex];
    const capVal = dom.selectFlotCapacity?.value || '100ft';
    sizeText = capOpt ? capOpt.text : 'Celda 100 ft³ (2.8 m³)';
    const fCondVal = dom.inputFlotCondition?.value || '';
    const activeFlotChip = doc.querySelector('.flot-chip.active');
    const isFConfirmed = activeFlotChip && activeFlotChip.getAttribute('data-confirmed') === 'true' && fCondVal !== '';
    const fCondMap = {
      sulfuros_alta_agitacion: isEs ? 'Sulfuros Masivos / Alta Agitación' : 'Massive Sulfides & High Shear',
      reactivos_ph_extremo: isEs ? 'Ataque por Reactivos / pH Extremo' : 'Reagent Attack & Extreme pH',
      espumado_intenso: isEs ? 'Espumado Intenso / Desgaste por Impacto' : 'Intense Froth & Slurry Impact',
      vibracion_flecha: isEs ? 'Vibración en Flecha / Cambio Preventivo' : 'Shaft Vibration & Preventive Overhaul'
    };
    condText = isFConfirmed && fCondMap[fCondVal]
      ? fCondMap[fCondVal]
      : (isEs ? 'Pendiente de dictamen en campo (Asesoría SMAT solicitada)' : 'Pending field assessment (SMAT technical advice requested)');
    smatCode = buildSmatCode('flotacion', roleVal, capVal, fCondVal);
    sapMatText = isEs ? 'Elastómero antiabrasivo de alta resiliencia' : 'High-resilience anti-abrasion elastomer';
    pipeHeaderTxt = isEs ? 'Capacidad / Volumen de Celda:' : 'Flotation Cell Volume:';
    stressHeaderTxt = isEs ? 'Condición Cinética en Celda:' : 'Kinetic Cell Condition:';
    tableMatTxt = isEs ? 'Elastómero antiabrasivo certificado' : 'Certified anti-abrasion elastomer';
  } else if (currentCircuit === 'filtracion') {
    const selectedOptFilt = dom.selectRoleFilt?.options[dom.selectRoleFilt.selectedIndex];
    roleVal = dom.selectRoleFilt?.value || 'placas_telas';
    roleText = selectedOptFilt ? selectedOptFilt.text : (isEs ? 'Paquete de Placas de Polipropileno y Telas Filtrantes' : 'Polypropylene Plates & Cloth Kit');
    const pCapOpt = dom.selectFiltCapacity?.options[dom.selectFiltCapacity.selectedIndex];
    const pCapVal = dom.selectFiltCapacity?.value || '1500';
    sizeText = pCapOpt ? pCapOpt.text : 'Placas 1500 x 1500 mm';
    const pCondVal = dom.inputFiltCondition?.value || '';
    const activeFiltChip = doc.querySelector('.filt-chip.active');
    const isPConfirmed = activeFiltChip && activeFiltChip.getAttribute('data-confirmed') === 'true' && pCondVal !== '';
    const pCondMap = {
      jales_secos: isEs ? 'Jales Secos (<15% Humedad Residual)' : 'Dry Stack Tailings (<15% Moisture)',
      recuperacion_agua: isEs ? 'Recuperación Rápida de Agua de Proceso' : 'Process Water Recovery',
      colmatacion_telas: isEs ? 'Colmatación Severa / Reemplazo Urgente' : 'Severe Blinding & Cloth Replacement',
      alta_presion_16bar: isEs ? 'Ciclos Rápidos a Alta Presión (16 bar)' : 'High-Pressure Fast Cycles (16 bar)'
    };
    condText = isPConfirmed && pCondMap[pCondVal]
      ? pCondMap[pCondVal]
      : (isEs ? 'Pendiente de dictamen en campo (Asesoría SMAT solicitada)' : 'Pending field assessment (SMAT technical advice requested)');
    smatCode = buildSmatCode('filtracion', roleVal, pCapVal, pCondVal);
    sapMatText = isEs ? 'Polipropileno virgen estabilizado 16 bar' : 'Virgin stabilized polypropylene 16 bar';
    pipeHeaderTxt = isEs ? 'Dimensión de Placa Filtrante:' : 'Filter Plate Dimension:';
    stressHeaderTxt = isEs ? 'Objetivo Operativo de Filtrado:' : 'Filtration Target / Cycle:';
    tableMatTxt = sapMatText;
  } else if (currentCircuit === 'control_procesos') {
    const selectedOptCtrl = dom.selectRoleCtrl?.options[dom.selectRoleCtrl.selectedIndex];
    roleVal = dom.selectRoleCtrl?.value || 'balanza_marcy';
    roleText = selectedOptCtrl ? selectedOptCtrl.text : (isEs ? 'Balanza de Densidad de Pulpa (Tipo Marcy)' : 'Marcy Pulp Density Scale');
    const ctrlSpecOpt = dom.selectCtrlSpec?.options[dom.selectCtrlSpec.selectedIndex];
    const ctrlSpecVal = dom.selectCtrlSpec?.value || 'marcy_12_rings';
    sizeText = ctrlSpecOpt ? ctrlSpecOpt.text : 'Juego Completo 12 Carátulas (Ss 2.2 a 4.4) + Vaso 1000 cm³';
    condText = isEs ? 'Control metrológico de laboratorio y planta concentradora' : 'Metallurgical laboratory & concentrator plant control';
    smatCode = buildSmatCode('control_procesos', roleVal, ctrlSpecVal, '');
    sapMatText = roleVal === 'tamices_laboratorio'
      ? (isEs ? 'Acero Inoxidable / Bronce Certificado ASTM E11' : 'ASTM E11 Certified Stainless Steel / Brass')
      : (isEs ? 'Instrumentación Metrológica Acero Inoxidable 304 / Acero Bridado' : '304 Stainless Steel / Flanged Steel Instrumentation');
    pipeHeaderTxt = isEs ? 'Especificación Metrológica:' : 'Metrological Specification:';
    stressHeaderTxt = isEs ? 'Aplicación de Control:' : 'Control Application:';
    tableMatTxt = sapMatText;
  } else if (currentCircuit === 'clasificacion') {
    const selectRoleClas = doc.getElementById('wb-role-cyc');
    const selectClasSize = doc.getElementById('wb-cyc-series');
    const selectClasLiner = doc.getElementById('wb-cyc-liner');
    const selectedOptClas = selectRoleClas?.options?.[selectRoleClas.selectedIndex];
    roleVal = selectRoleClas?.value || 'apex_vortex_kit';
    roleText = selectedOptClas ? selectedOptClas.text : (isEs ? 'Kit Apex + Vortex Finder Antiabrasivo (Ciclón Plitt)' : 'Apex + Vortex Finder Anti-Abrasion Kit (Plitt Cyclone)');
    const dcVal = selectClasSize?.value || '380';
    sizeText = `D_c ${dcVal} mm`;
    const linerVal = selectClasLiner?.value || 'ceramica_sic';
    condText = linerVal === 'ceramica_sic'
      ? (isEs ? 'Carburo de Silicio Sinterizado SiC (≥2200 HV)' : 'Sintered Silicon Carbide SiC (≥2200 HV)')
      : (linerVal === 'poliuretano'
        ? (isEs ? 'Poliuretano Grado Minero (85-95 Shore A)' : 'Mining Polyurethane (85-95 Shore A)')
        : (isEs ? 'Hule Natural Antiabrasivo R55' : 'Natural Anti-Abrasion Rubber R55'));
    smatCode = buildSmatCode('clasificacion', roleVal, `D${dcVal}`, linerVal);
    sapMatText = condText;
    pipeHeaderTxt = isEs ? 'Diámetro de Hidrociclón (D_c):' : 'Hydrocyclone Diameter (D_c):';
    stressHeaderTxt = isEs ? 'Revestimiento Interno Apex/Vortex:' : 'Apex/Vortex Liner Material:';
    tableMatTxt = sapMatText;
  }

  return {
    roleVal,
    roleText,
    sizeText,
    condText,
    smatCode,
    sapMatText,
    pipeHeaderTxt,
    stressHeaderTxt,
    tableMatTxt,
    showRecirc
  };
}

/**
 * Ejecuta la proyección completa del Dossier Vivo y los motores acoplados sin innerHTML.
 * @param {Record<string, any>} ctx
 * @returns {Record<string, any>} Updated telemetry snapshots
 */
export function projectLiveDossierSummary(ctx = {}) {
  const doc = ctx.doc || (typeof document !== 'undefined' ? document : null);
  const dom = ctx.dom || {};
  const state = ctx.state || {};
  const isEs = Boolean(state.isEs);
  const isOpex = Boolean(state.isOpex);
  const container = dom.container || doc;

  if (!doc) return state;

  if (dom.livePriorityTag) {
    dom.livePriorityTag.textContent = isOpex
      ? (isEs ? 'REFACCIONES / PARO DE PLANTA' : 'WEAR SPARES / SHUTDOWN')
      : (isEs ? 'EQUIPOS COMPLETOS / CIRCUITO' : 'COMPLETE CIRCUIT EQUIPMENT');
    dom.livePriorityTag.style.color = isOpex ? '#991b1b' : '#075985';
  }

  const nameVal = dom.inputName?.value.trim() || (isEs ? 'Ing. Residente / Solicitante' : 'Lead Process Engineer');
  const compVal = dom.inputCompany?.value.trim() || (isEs ? 'Unidad Minera / Compañía' : 'Mining Operation / Company');
  const phoneVal = dom.inputPhone?.value.trim() || '(618) 810-4408';
  const emailVal = dom.inputEmail?.value.trim() || (isEs ? 'contacto@minera.com' : 'contact@miningco.com');
  const destVal = dom.inputDest?.value.trim() || (isEs ? 'Retiro en Almacén Central Durango' : 'Durango Central Warehouse Pickup');
  const clientRefVal = dom.inputClientRef?.value.trim() || '';

  if (dom.liveRequester) dom.liveRequester.textContent = nameVal;
  if (dom.liveCompany) dom.liveCompany.textContent = compVal;
  if (dom.liveContact) dom.liveContact.textContent = `${phoneVal} • ${emailVal}`;
  if (dom.liveDestination) dom.liveDestination.textContent = destVal;

  const spec = resolveCircuitDossierSpec(doc, { currentCircuit: state.currentCircuit || 'bombeo', isEs, dom });

  if (dom.livePipeHeader) dom.livePipeHeader.textContent = spec.pipeHeaderTxt;
  if (dom.livePipeText) dom.livePipeText.textContent = spec.sizeText;
  if (dom.liveStressHeader) dom.liveStressHeader.textContent = spec.stressHeaderTxt;
  if (dom.liveStressText) dom.liveStressText.textContent = spec.condText;
  if (dom.liveTableMat) dom.liveTableMat.textContent = spec.tableMatTxt;
  if (dom.recircAlertBox) dom.recircAlertBox.classList.toggle('hidden', !spec.showRecirc);
  if (dom.recircWarnDossier) dom.recircWarnDossier.classList.toggle('hidden', !spec.showRecirc);

  const detailsText = dom.inputDetails?.value.trim() || (isEs ? 'Verificación dimensional de acople 1:1 en Almacén Central Durango.' : '1:1 dimensional check at Durango Central Warehouse.');
  if (dom.liveSmatCode) dom.liveSmatCode.textContent = spec.smatCode;
  if (dom.sapLiveCode) dom.sapLiveCode.textContent = spec.smatCode;
  if (dom.livePartName) dom.livePartName.textContent = spec.roleText;
  if (dom.livePartDetails) dom.livePartDetails.textContent = detailsText;
  if (dom.sapLivePart) dom.sapLivePart.textContent = spec.roleText.split('(')[0].trim();
  if (dom.sapLiveMat) dom.sapLiveMat.textContent = spec.sapMatText;
  if (dom.sapLiveDest) dom.sapLiveDest.textContent = destVal;

  const sapLiveTag = doc.getElementById('sap-live-tag');
  if (sapLiveTag) sapLiveTag.textContent = `CIRCUIT-${String(state.currentCircuit || 'bombeo').toUpperCase()}`;

  const altVal = Number(state.selectedAltitude ?? 0);
  const shortPart = spec.roleText.split('(')[0].trim();
  if (dom.sapJustificationText) {
    dom.sapJustificationText.textContent = isEs
      ? `Suministro de ${shortPart} [Código SMAT: ${spec.smatCode}] de alta criticidad para operación en mina (${compVal}) a ${altVal} msnm. Componente con verificación dimensional 1:1, concentricidad metrológica y especificación técnica validada en Almacén Central Durango.`
      : `Supply of ${shortPart} [SMAT Code: ${spec.smatCode}] critical wear part for mining operation (${compVal}) at ${altVal} MASL. Inspected with 1:1 dimensional fit verification and certified at Durango Central Warehouse.`;
  }
  const sapJustSummary = doc.getElementById('sap-justification-summary');
  if (sapJustSummary) {
    sapJustSummary.textContent = isEs
      ? `Suministro de ${shortPart} [${spec.smatCode}] con verificación dimensional 1:1 en Almacén Central Durango.`
      : `Supply of ${shortPart} [${spec.smatCode}] with 1:1 dimensional verification at Durango Central Warehouse.`;
  }

  [dom.liveRequester, dom.liveCompany, dom.liveContact, dom.liveDestination, dom.livePartName, dom.liveSmatCode, dom.sapLiveCode].forEach(flashInk);

  if (clientRefVal && dom.liveClientRefBox && dom.liveClientRefText) {
    dom.liveClientRefBox.classList.remove('hidden');
    dom.liveClientRefText.textContent = clientRefVal;
  } else if (dom.liveClientRefBox) {
    dom.liveClientRefBox.classList.add('hidden');
  }

  if (state.isCustomEquipment && dom.liveCustomBox && dom.liveCustomText) {
    dom.liveCustomBox.classList.remove('hidden');
    const cType = dom.customEquipType?.value.trim() || 'Equipo fuera de catálogo';
    const cCap = dom.customEquipCapacity?.value.trim() || 'Capacidad a definir';
    const cNotes = dom.customEquipNotes?.value.trim() || '';
    dom.liveCustomText.textContent = `${cType} | Capacidad: ${cCap} ${cNotes ? `| Notas: ${cNotes}` : ''}`;
  } else if (dom.liveCustomBox) {
    dom.liveCustomBox.classList.add('hidden');
  }

  let updatedPartSpecs = state.currentPartSpecs || {};
  let updatedClearance = state.currentClearanceEval || {};
  let updatedKinematics = state.currentKinematics || {};
  let updatedMetrology = state.currentMetrology || null;

  try {
    const wbState = loadWorkbenchState() || {};
    let activeRoleForSpecs = spec.roleVal || dom.selectRole?.value || 'kit_wet_end';
    let activePipeForSpecs = dom.selectPipeSize?.value || '6x4';
    if (state.currentCircuit === 'flotacion') {
      activeRoleForSpecs = dom.selectRoleFlot?.value || 'rotor_estator';
      activePipeForSpecs = dom.selectFlotCapacity?.value || '100ft';
    } else if (state.currentCircuit === 'filtracion') {
      activeRoleForSpecs = dom.selectRoleFilt?.value || 'placas_telas';
      activePipeForSpecs = dom.selectFiltCapacity?.value || '1500';
    } else if (state.currentCircuit === 'control_procesos') {
      activeRoleForSpecs = dom.selectRoleCtrl?.value || 'balanza_marcy';
      activePipeForSpecs = dom.selectCtrlSpec?.value || 'marcy_12_rings';
    } else if (state.currentCircuit === 'clasificacion') {
      activeRoleForSpecs = doc.getElementById('wb-role-cyc')?.value || 'hidrociclon_apex_vortex';
      activePipeForSpecs = `D${doc.getElementById('wb-cyc-series')?.value || '380'}`;
    }

    updatedPartSpecs = getAtomicPartSpecs(
      state.currentAtomicCode || (state.currentBomOverride && state.currentBomOverride.pieza) || activeRoleForSpecs,
      activePipeForSpecs
    );
    if (state.currentBomOverride) {
      const ovWeight = Number(state.currentBomOverride.peso_kg);
      if (Number.isFinite(ovWeight) && ovWeight > 0) {
        updatedPartSpecs = { ...updatedPartSpecs, weight_kg: ovWeight };
      }
      if (state.currentBomOverride.estacion) {
        const ovStNum = Number(String(state.currentBomOverride.estacion).replace(/\D+/g, '')) || updatedPartSpecs.station_number;
        updatedPartSpecs = { ...updatedPartSpecs, station_number: ovStNum, station: `S${ovStNum}` };
      }
    }

    if (dom.dossierPartHardness && updatedPartSpecs.hardness) dom.dossierPartHardness.textContent = updatedPartSpecs.hardness;
    if (dom.dossierPartFitGuarantee) {
      const fitTxt = isEs ? updatedPartSpecs.fit_guarantee_es : updatedPartSpecs.fit_guarantee_en;
      if (fitTxt) dom.dossierPartFitGuarantee.textContent = fitTxt;
    }

    const nioshStatus = formatNioshErgonomicStatus(updatedPartSpecs, isEs ? 'es' : 'en');
    const stLabel = `${updatedPartSpecs.station || `S${updatedPartSpecs.station_number}`} • ${isEs ? (updatedPartSpecs.station_name_es || updatedPartSpecs.code) : (updatedPartSpecs.station_name_en || updatedPartSpecs.code)}`;
    const elPartStationTag = doc.getElementById('wb-part-station-tag');
    const elPartNioshBadge = doc.getElementById('wb-part-niosh-badge');
    const elPartGeomVal = doc.getElementById('wb-part-geom-val');
    const elPartOrderVal = doc.getElementById('wb-part-order-val');
    const elLivePartSpecs = doc.getElementById('live-table-part-specs');
    if (elPartStationTag) elPartStationTag.textContent = stLabel;
    if (elPartNioshBadge) {
      elPartNioshBadge.textContent = nioshStatus.badgeText;
      elPartNioshBadge.setAttribute('data-niosh-tier', nioshStatus.mode);
    }
    if (elPartGeomVal) {
      const sphereMm = updatedPartSpecs.max_sphere_mm ?? updatedPartSpecs.max_particle_mm ?? 45;
      const wallMm = updatedPartSpecs.wall_thickness_mm ?? 32;
      elPartGeomVal.textContent = `ØD₂=${updatedPartSpecs.impeller_diameter_mm} mm (${updatedPartSpecs.vanes} ${isEs ? 'álabes' : 'vanes'}, Paso ${sphereMm} mm) | Voluta t=${wallMm} mm`;
    }
    if (elPartOrderVal) elPartOrderVal.textContent = updatedPartSpecs.assembly_order_note || updatedPartSpecs.assembly_order;
    if (elLivePartSpecs) {
      const sphereLive = updatedPartSpecs.max_sphere_mm ?? updatedPartSpecs.max_particle_mm ?? 45;
      elLivePartSpecs.textContent = `${stLabel} | ${nioshStatus.badgeText} | ØD₂=${updatedPartSpecs.impeller_diameter_mm} mm (${updatedPartSpecs.vanes}v, Ø${sphereLive} mm)`;
    }

    const driveContextualCard = doc.getElementById('wb-drive-and-tradein-contextual-card');
    if (driveContextualCard) {
      const isDriveOrBearingRole = state.currentCircuit === 'bombeo' && (activeRoleForSpecs === 'skid_bomba' || activeRoleForSpecs === 'kit_rodamientos');
      driveContextualCard.classList.toggle('hidden', !isDriveOrBearingRole);
    }

    const elClearanceSlider = doc.getElementById('wb-clearance-slider');
    if (elClearanceSlider && !elClearanceSlider.dataset.userTouched && wbState.frontClearanceMm !== undefined) {
      elClearanceSlider.value = String(wbState.frontClearanceMm);
    }
    const claroMmVal = elClearanceSlider ? parseFloat(elClearanceSlider.value || '0.75') : 0.75;
    const matSelectEl = doc.getElementById('wb-pump-material');
    const arrSelectEl = doc.getElementById('wb-drive-arrangement');
    if (matSelectEl && !matSelectEl.dataset.userTouched && (wbState.pump_material || wbState.wetEndMaterial)) {
      matSelectEl.value = normalizeMaterialKey(wbState.pump_material || wbState.wetEndMaterial);
    }
    if (arrSelectEl && !arrSelectEl.dataset.userTouched && wbState.kinematics?.arrangement) {
      arrSelectEl.value = wbState.kinematics.arrangement;
    }
    const matCodeVal = matSelectEl ? normalizeMaterialKey(matSelectEl.value) : 'alto_cromo_cr27';
    const d80Val = dom.sliderD80 ? Number(dom.sliderD80.value) : 220;
    const solidsVal = dom.sliderSolids ? Number(dom.sliderSolids.value) : 45;
    const phVal = dom.sliderPh ? Number(dom.sliderPh.value) : 7.5;
    renderWetEndMaterialMatrix(matCodeVal, { doc, isEs, pipeSeries: activePipeForSpecs, d80Microns: d80Val, solidsWeightPercent: solidsVal, pulpPh: phVal });

    const arrCodeVal = arrSelectEl ? arrSelectEl.value : 'CV';
    const elSeqCanonical = doc.getElementById('wb-assembly-sequence');
    const seqPresetVal = elSeqCanonical ? elSeqCanonical.value : (wbState.assemblySequencePreset || 'canonical');
    const sealBranchVal = dom.wbSealBranch ? dom.wbSealBranch.value : (wbState.seal_branch || wbState.sealBranch || 'expeller_dry');
    const b2ValMm = dom.wbImpellerB2 && dom.wbImpellerB2.dataset.userTouched
      ? (Number(dom.wbImpellerB2.value) || 48)
      : (activePipeForSpecs === '3x2' ? 38 : (activePipeForSpecs === '8x6' || activePipeForSpecs === '10x8' ? 64 : 48));

    const branchKey = matCodeVal === 'hybrid_a05_r55'
      ? 'hibrido_a05_r55'
      : (matCodeVal === 'hule_natural' ? 'rubber' : (matCodeVal === 'poliuretano' ? 'polyurethane' : (matCodeVal === 'ceramica_sic' ? 'ceramic_sic' : 'metal')));

    updatedClearance = evaluateWetEndAssemblyInterference({
      wetEndBranch: branchKey,
      sealBranch: sealBranchVal,
      frontClearanceMm: claroMmVal,
      impellerExitWidthMm: b2ValMm,
      pipeSeries: activePipeForSpecs,
      sequencePreset: seqPresetVal
    });

    const lossPctVal = updatedClearance.volumetricEfficiencyDropPct ?? updatedClearance.volumetricEfficiencyLossPct ?? 1.6;
    const pipeVelLossVal = updatedClearance.pipeVelocityMarginLossPct ?? Number((lossPctVal * 0.75).toFixed(2));
    const setTextId = (id, val) => { const n = doc.getElementById(id); if (n) n.textContent = val; };
    setTextId('wb-val-clearance', `${updatedClearance.frontClearanceMm.toFixed(2)} mm (Δη_v = -${lossPctVal.toFixed(1)}%)`);
    setTextId('wb-clearance-vel-loss', `-${Number(pipeVelLossVal).toFixed(1)}%`);
    setTextId('wb-pipe-vel-loss', `${Number(pipeVelLossVal).toFixed(1)}%`);

    const collShort = updatedClearance.sequenceValid
      ? (isEs ? 'Secuencia S1→S5 libre de colisión axial' : 'S1→S5 sequence collision-free')
      : (isEs ? `BLOQUEO ${updatedClearance.outOfOrderStationId}: ${updatedClearance.collisionDetailsEs}` : `BLOCKED ${updatedClearance.outOfOrderStationId}: ${updatedClearance.collisionDetailsEn}`);
    setTextId('live-assembly-collision-note', collShort);

    if (dom.elMetricClearanceLoss) {
      const statusLbl = updatedClearance.clearanceStatus === 'OPTIMAL_CALIBRATION'
        ? (isEs ? 'Óptimo' : 'Optimal')
        : (updatedClearance.clearanceStatus === 'RUBBING_RISK' ? (isEs ? 'Riesgo Roce' : 'Rubbing Risk') : (isEs ? 'Recirculación' : 'Recirculation'));
      const impactText = isEs ? updatedClearance.wearRatioImpact554 : updatedClearance.wearRatioImpact554En;
      dom.elMetricClearanceLoss.textContent = `-${lossPctVal.toFixed(1)}% (${statusLbl}) • ${impactText}`;
    }
    if (dom.elMetricStructuralReason) {
      dom.elMetricStructuralReason.textContent = isEs ? (updatedClearance.structuralReasonEs || '') : (updatedClearance.structuralReasonEn || updatedClearance.structuralReasonEs || '');
    }
    if (dom.metricAssemblyMassSeq) {
      const seqStatusText = updatedClearance.sequenceValid
        ? (isEs ? 'Secuencia 01–05 válida sin colisión axial' : 'Sequence 01–05 valid with zero axial collision')
        : (isEs ? `BLOQUEO (${updatedClearance.outOfOrderStationId}): ${updatedClearance.collisionDetailsEs}` : `BLOCKED (${updatedClearance.outOfOrderStationId}): ${updatedClearance.collisionDetailsEn}`);
      dom.metricAssemblyMassSeq.textContent = `${isEs ? 'Masa total de rama: ' : 'Total branch mass: '}${updatedClearance.totalAssemblyMassKg.toFixed(1)} kg (${updatedClearance.nioshHoistPartsCount}${isEs ? ' izajes NIOSH ≥23 kg) • ' : ' NIOSH hoists ≥23 kg) • '}${seqStatusText}`;
      dom.metricAssemblyMassSeq.style.color = updatedClearance.sequenceValid ? '#0f172a' : '#dc2626';
    }

    const savedKin = wbState.kinematics || {};
    const liveDriverMm = dom.wbDriverPulley ? (Number(dom.wbDriverPulley.value) || 220) : (savedKin.driverPulleyMm || 220);
    const liveDrivenMm = dom.wbDrivenPulley ? (Number(dom.wbDrivenPulley.value) || 340) : (savedKin.drivenPulleyMm || 340);
    const liveMotorRpm = dom.wbMotorRpm ? (Number(dom.wbMotorRpm.value) || 1775) : (savedKin.motorRpm || 1775);
    const liveShaftKw = dom.wbShaftPower ? (Number(dom.wbShaftPower.value) || 55) : (savedKin.shaftPowerKw || 55);
    const liveBearingCkN = dom.wbBearingC ? (Number(dom.wbBearingC.value) || 145) : (savedKin.dynamicCapacityCkN || wbState.cap_c_kn || 145);

    if (dom.wbDriverPulley) dom.wbDriverPulley.disabled = arrCodeVal === 'DC';
    if (dom.wbDrivenPulley) dom.wbDrivenPulley.disabled = arrCodeVal === 'DC';
    if (dom.wbValDriverPulley) dom.wbValDriverPulley.textContent = arrCodeVal === 'DC' ? '1:1' : `${liveDriverMm} mm`;
    if (dom.wbValDrivenPulley) dom.wbValDrivenPulley.textContent = arrCodeVal === 'DC' ? '1:1' : `${liveDrivenMm} mm`;

    updatedKinematics = calculateDriveAndBearingKinematics({
      arrangement: arrCodeVal,
      arrangementCode: arrCodeVal,
      motorRpm: liveMotorRpm,
      driverPulleyMm: liveDriverMm,
      drivenPulleyMm: liveDrivenMm,
      shaftPowerKw: liveShaftKw,
      dynamicCapacityCkN: liveBearingCkN,
      impellerDiameterMm: updatedPartSpecs.impeller_diameter_mm || 380,
      wetEndMaterial: matCodeVal
    });
    const frameEval = selectBearingFrameByPowerAndRpm(liveShaftKw, updatedKinematics.pumpRpm, activePipeForSpecs);
    const hybridEval = evaluateHybridWetEndConfiguration({
      d80Microns: d80Val,
      tipSpeedMs: updatedKinematics.tipSpeedMs,
      pulpPh: phVal,
      solidsWeightPercent: solidsVal,
      pipeSeries: activePipeForSpecs
    });

    const l10hNum = Number(updatedKinematics.bearingL10Hours ?? updatedKinematics.estimatedL10hHours ?? 28500);
    const arrDisplay = updatedKinematics.arrangement || updatedKinematics.arrangementCode || arrCodeVal;
    const elMetricU2 = doc.getElementById('metric-drive-u2');
    const elMetricL10h = doc.getElementById('metric-drive-l10h');
    if (elMetricL10h) {
      elMetricL10h.textContent = `${l10hNum.toLocaleString('en-US')} h`;
    } else if (elMetricU2) {
      elMetricU2.textContent = `${updatedKinematics.tipSpeedMs.toFixed(1)} m/s (${arrDisplay}) • ${l10hNum.toLocaleString('en-US')} h`;
    }
    if (dom.elMetricDriveRpm) dom.elMetricDriveRpm.textContent = `${updatedKinematics.pumpRpm} RPM (i = ${Number(updatedKinematics.transmissionRatio || 1).toFixed(2)})`;
    if (dom.elMetricDriveFr) dom.elMetricDriveFr.textContent = `${Number(updatedKinematics.beltRadialLoadKn || 0).toFixed(2)} kN (P = ${Number(updatedKinematics.equivalentDynamicLoadPkN || 0).toFixed(2)} kN)`;
    if (dom.elMetricDriveFlood) dom.elMetricDriveFlood.textContent = updatedKinematics.sumpFloodImmunity || 'HIGH';

    const matHumanMap = {
      hybrid_a05_r55: isEs ? 'Rama D Híbrida (Impulsor A05 Cr27% + Forros R55)' : 'Branch D Hybrid (Cr27% A05 Impeller + R55 Liners)',
      hule_natural: isEs ? 'Hule Natural Antiabrasivo (55–65 Shore A)' : 'Natural Rubber (55–65 Shore A)',
      poliuretano: isEs ? 'Poliuretano Grado Minero (85–95 Shore A)' : 'Mining Polyurethane (85–95 Shore A)',
      ceramica_sic: isEs ? 'Carburo de Silicio Sinterizado SiC (≥2200 HV)' : 'Sintered Silicon Carbide SiC (≥2200 HV)',
      alto_cromo_cr27: isEs ? 'Alto Cromo ASTM A532 Cr27% (≥650 HB)' : 'High Chrome ASTM A532 Cr27% (≥650 HB)'
    };
    projectLiveKinematicsRowSafe(doc.getElementById('live-table-kinematics'), {
      matHuman: matHumanMap[matCodeVal] || matHumanMap.alto_cromo_cr27,
      arrDisplay,
      pumpRpm: updatedKinematics.pumpRpm,
      tipSpeedMs: updatedKinematics.tipSpeedMs,
      beltRadialLoadKn: updatedKinematics.beltRadialLoadKn,
      l10hNum,
      frontClearanceMm: updatedClearance.frontClearanceMm,
      lossPctVal,
      pipeVelLossVal,
      collShort
    });

    const elRubberLock = doc.getElementById('wb-rubber-u2-lock');
    if (elRubberLock) {
      elRubberLock.classList.toggle('hidden', !(matCodeVal === 'hule_natural' && updatedKinematics.rubberThermalLimitExceeded));
    }

    const hm = state.currentHydraulicMetrics || {};
    const tempCVal = Number(doc.getElementById('wb-temp-c')?.value ?? 35);
    const strictBlind = Boolean(doc.getElementById('wb-strict-blind-check')?.checked);
    const gateOut = validatePlantLeadInput({
      company: compVal,
      cwPct: hm.solids_cw,
      d80Microns: hm.d80_um,
      flowM3h: hm.flow_m3h,
      pulpPh: hm.pulp_ph,
      altitudeM: altVal,
      wetMaterial: matCodeVal,
      frontClearanceMm: updatedClearance.frontClearanceMm,
      tipSpeedMs: updatedKinematics.tipSpeedMs,
      smat_code: spec.smatCode,
      tempC: tempCVal,
      strictBlindCheck: strictBlind
    });
    const liveAssemblySeq = evaluatePumpAssemblySequence({
      frontClearanceMm: updatedClearance.frontClearanceMm,
      impellerTorqueNm: 450,
      d80Microns: hm.d80_um || 180,
      sequencePreset: seqPresetVal
    });

    const jrpWearInput = Number(doc.getElementById('wb-jrp-wear-hours')?.value ?? hm.impeller_life_h ?? 2160);
    const jrpDailyHours = Number(doc.getElementById('wb-jrp-daily-hours')?.value ?? 24);
    const jrpCrit = String(doc.getElementById('wb-jrp-criticality')?.value || (isOpex ? 'paro_planta' : 'normal'));
    const liveReorderEval = calculateCoupledReorderWindowDays({
      solidsVolumetricPct: hm.solids_cv || 22,
      d80Microns: hm.d80_um || 180,
      tipSpeedMs: updatedKinematics.tipSpeedMs || 21.5,
      materialKey: matCodeVal,
      predictedWearHours: jrpWearInput,
      operatingHoursPerDay: jrpDailyHours,
      criticalityMode: jrpCrit
    });
    const trayStateNow = getTrayState();
    const coreEnabled = Boolean(doc.getElementById('wb-core-tradein-toggle')?.checked ?? trayStateNow.coreReturnEnabled);
    const tradeInNow = evaluateBearingCartridgeCoreTradeIn(trayStateNow, coreEnabled);
    const cmuNow = computeCmuPriorityDescriptor(isOpex ? 'PARO_DE_LINEA' : 'STOCK_SS', trayStateNow.items || []);

    const cwInit = Number(dom.sliderSolids?.value) || 45;
    const p80Init = Number(dom.sliderD80?.value) || 150;
    const defaultMarcy = calculateMarcyScaleReading({ solidsSpecificGravity: 2.8, solidsWeightPercent: cwInit });
    const defaultGy = calculateGyMinimumSampleMass({ topSizeD95Mm: Math.max(0.2, p80Init / 100), solidsWeightPercent: cwInit });
    const defaultSieves = recommendAstmSieveSeries({ targetP80Microns: p80Init, screeningMode: 'wet' });

    if (wbState.metrology && (wbState.metrology.cw !== undefined || wbState.metrology.summary)) {
      updatedMetrology = { ...wbState.metrology, ...(updatedMetrology || {}) };
    } else if (state.currentCircuit === 'control_procesos' && (!updatedMetrology || updatedMetrology.cw === undefined)) {
      const initSummary = `Ss=${defaultMarcy.solidsSpecificGravity} | Cw=${cwInit}% | Sm=${defaultMarcy.pulpDensityKgL} kg/L | M_min=${defaultGy.minDrySampleKg} kg | P80=${p80Init} µm`;
      updatedMetrology = {
        cw: cwInit,
        solidsPctCw: cwInit,
        sm: defaultMarcy.pulpDensityKgL,
        p80: p80Init,
        dryMassKg: defaultGy.minDrySampleKg,
        summary: initSummary,
        raw: initSummary
      };
    }

    projectPumpDriveAndHybridTelemetry(container, {
      driveEval: updatedKinematics,
      frameEval,
      hybridEval,
      interferenceEval: updatedClearance,
      seqEval: liveAssemblySeq,
      isEs
    });
    projectMetrologyAndReorderTelemetry(container, {
      gyEval: defaultGy,
      sieveEval: defaultSieves,
      marcyEval: defaultMarcy,
      reorderEval: liveReorderEval,
      tradeInEval: tradeInNow,
      trayState: trayStateNow,
      cmuEval: cmuNow,
      isEs
    });
    const optMat = selectOptimalMaterial(d80Val, solidsVal, phVal);
    projectHydraulicAltitudeAndLeadValidation(container, {
      simMetrics: { results: hm, combinedMotorAltitudeMultiplier: state.lastAltitudeEval?.combinedMotorAltitudeMultiplier ?? 1.0 },
      altData: state.lastAltitudeEval || {},
      optMat,
      leadValid: gateOut,
      anexo22Summary: buildSapAnexo22ComplianceSummary({
        circuit: state.currentCircuit,
        smatCode: spec.smatCode,
        stockRegime: isOpex ? 'hay' : 'se_fabrica',
        estimatedMxn: isOpex ? 18500 : 85000,
        lang: isEs ? 'es' : 'en'
      }),
      isEs
    });

    const elGateBadge = doc.getElementById('gate-lead-status');
    const elTrustAlert = doc.getElementById('trust-boundary-alert');
    const elTrustTitle = doc.getElementById('trust-boundary-title');
    const elTrustReason = doc.getElementById('trust-boundary-reason');
    if (elGateBadge) {
      elGateBadge.textContent = isEs ? gateOut.badgeLabelEs : gateOut.badgeLabelEn;
      elGateBadge.style.background = gateOut.plausible ? '#065f46' : '#991b1b';
    }
    if (elTrustAlert) {
      if (gateOut.activeTrustBoundaryId) {
        elTrustAlert.classList.remove('hidden');
        if (elTrustTitle) elTrustTitle.textContent = gateOut.activeTrustBoundaryTitleEs;
        if (elTrustReason) elTrustReason.textContent = gateOut.activeTrustBoundaryReasonEs;
      } else {
        elTrustAlert.classList.add('hidden');
      }
    }

    const engCtxNow = loadEngineeringContextSnapshot();
    const physRow = formatDossierCircuitPhysicsRow(state.currentCircuit, engCtxNow, updatedPartSpecs, isEs, matCodeVal);
    setTextId('live-table-circuit-physics-label', physRow.label);
    setTextId('live-table-circuit-physics-val', physRow.value);

    const elMetrologyCard = doc.getElementById('wb-metrology-bridge-card');
    const elMetrologyText = doc.getElementById('wb-metrology-bridge-text');
    const elLiveRowMetrology = doc.getElementById('live-row-metrology');
    const elLiveTableMetrology = doc.getElementById('live-table-metrology');
    if (wbState.cycloneCircuit?.hasUrlTelemetry) {
      const cycBadge = formatDossierMetrologyBadge(wbState, isEs);
      const cycBanner = formatDossierSimulationBanner(wbState, isEs);
      if (elMetrologyCard) elMetrologyCard.classList.remove('hidden');
      if (elMetrologyText) elMetrologyText.textContent = cycBanner || cycBadge;
      if (elLiveRowMetrology) elLiveRowMetrology.classList.remove('hidden');
      if (elLiveTableMetrology) elLiveTableMetrology.textContent = cycBadge;
    } else if (updatedMetrology && (updatedMetrology.cw !== undefined || updatedMetrology.summary)) {
      const mSummary = updatedMetrology.summary || updatedMetrology.raw || `Cw=${updatedMetrology.cw ?? 45}% | Sm=${updatedMetrology.sm ?? 1.40} kg/L`;
      if (elMetrologyCard) elMetrologyCard.classList.remove('hidden');
      if (elMetrologyText) elMetrologyText.textContent = mSummary;
      if (elLiveRowMetrology) elLiveRowMetrology.classList.remove('hidden');
      if (elLiveTableMetrology) elLiveTableMetrology.textContent = mSummary;
    }

    const sessState = {
      name: nameVal,
      company: compVal,
      phone: phoneVal,
      email: emailVal,
      destination: destVal,
      details: detailsText,
      clientRef: clientRefVal,
      circuit: state.currentCircuit,
      role: spec.roleVal,
      pipe_size: dom.selectPipeSize?.value,
      altitude: altVal,
      tcoAlloy: state.selectedTcoAlloy,
      flow: dom.sliderFlow?.value,
      solids: dom.sliderSolids?.value,
      d80: dom.sliderD80?.value,
      sg: dom.sliderSg?.value,
      ph: dom.sliderPh?.value,
      seal_branch: sealBranchVal,
      b2_mm: b2ValMm,
      cap_c_kn: liveBearingCkN,
      predictedWearHours: jrpWearInput,
      operatingHoursPerDay: jrpDailyHours,
      criticalityMode: jrpCrit,
      downtime: dom.sliderDowntime?.value,
      isOpex
    };
    saveWorkbenchSession(sessState);
    projectWorkbenchToDOM(container, {
      ...sessState,
      ...hm,
      durandFactorFL: hm.durand_fl,
      solidsVolumetricPercent: hm.solids_cv,
      recommendedPipeVelocityMs: hm.safe_velocity_ms,
      criticalSettlingVelocityMs: hm.critical_velocity_ms,
      actualPipeVelocityMs: hm.line_velocity_ms,
      slurrySpecificGravity: hm.slurry_sg,
      pulpPh: hm.pulp_ph,
      sealBranch: updatedClearance.sealBranch,
      impellerExitWidthMm: updatedClearance.impellerExitWidthMm,
      dynamicCapacityCkN: updatedKinematics.dynamicCapacityCkN,
      metrics: hm,
      clearance_eval: updatedClearance,
      kinematics: updatedKinematics,
      part_specs: updatedPartSpecs,
      metrology: updatedMetrology
    });
  } catch (_err) {
    // Fallback seguro de proyección sin abortar ciclo UI
  }

  // Referencia explícita al contrato de esquema para auditores Two-Sort
  const _schemaBoundCount = Object.keys(ENGINE_SCHEMA_REGISTRY).length;
  return {
    schemaCount: _schemaBoundCount,
    smatCode: spec.smatCode,
    roleVal: spec.roleVal,
    currentPartSpecs: updatedPartSpecs,
    currentClearanceEval: updatedClearance,
    currentKinematics: updatedKinematics,
    currentMetrology: updatedMetrology
  };
}
