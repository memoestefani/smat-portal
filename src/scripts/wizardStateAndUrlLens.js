// @ts-nocheck
/**
 * wizardStateAndUrlLens.js
 * ---------------------------------------------------------------------------
 * Costura Modular C4 extraída desde quoteWizardController.js (D3-V50 / D5-V50).
 * Lente bidireccional PutGet / GetPut unificada sobre `SMAT_WORKBENCH_STATE_KEY`
 * (`smat_workbench_state_v2`) para hidratación de URL, perfil de mina, metrología,
 * parámetros avanzados (altitud, JRP, flotación P/Rf, ciclón/criba, tempC, ERP) y recolección RFQ.
 */

import { computeWizardViewState } from './quoteWizardController.js';
import {
  buildSmatCode,
  decodeSmatCode,
  matchMiningGroupByEmailDomain,
  resolveMiningUnitPulpPreset
} from './wizardMiningAndCodeDecoder.js';
import {
  ROLE_ALIAS_MAP,
  normalizeFiltrationConditionKey,
  normalizeFlotationConditionKey,
  resolveFiltrationDomChipKey,
  resolveFlotationDomChipKey,
  resolveUrlContextDescriptor
} from './wizardUrlAndPresetRouter.js';
import {
  SMAT_WORKBENCH_STATE_KEY,
  loadWorkbenchState,
  mergeWorkbenchLensState,
  normalizeCircuitSerie,
  normalizeMaterialKey,
  parseUrlContextParams,
  saveWorkbenchSession,
  workbenchStateLens
} from './workbenchBus.js';

export const CANONICAL_WORKBENCH_STORAGE_KEY = SMAT_WORKBENCH_STATE_KEY;

/**
 * Purga claves de sesión legadas y migra sin pérdida al store único `SMAT_WORKBENCH_STATE_KEY`.
 */
export function sanitizeAndMigrateStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('smat_workbench_draft');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('smat_workbench_session');
    }
    localStorage.removeItem('smat_workbench_v1');
    const rawWbSess = localStorage.getItem('smat_workbench_session');
    if (rawWbSess && (rawWbSess.includes('6X4D') || rawWbSess.includes('D4147'))) {
      localStorage.removeItem('smat_workbench_session');
    }
    const rawLegacySplit = localStorage.getItem('smat_workbench_v2');
    const rawCanonical = localStorage.getItem(CANONICAL_WORKBENCH_STORAGE_KEY);
    if (rawLegacySplit) {
      const parsedSplit = JSON.parse(rawLegacySplit);
      const parsedCanon = rawCanonical ? JSON.parse(rawCanonical) : {};
      const mergedV2 = mergeWorkbenchLensState(parsedSplit, parsedCanon);
      if (mergedV2 && typeof mergedV2.details === 'string' && (mergedV2.details.includes('6X4D') || mergedV2.details.includes('A05'))) {
        mergedV2.details = '';
      }
      localStorage.setItem(CANONICAL_WORKBENCH_STORAGE_KEY, JSON.stringify(mergedV2));
      localStorage.removeItem('smat_workbench_v2');
    }
    const rawV2 = localStorage.getItem(CANONICAL_WORKBENCH_STORAGE_KEY);
    if (rawV2) {
      const s = JSON.parse(rawV2);
      if (s && typeof s.details === 'string' && (s.details.includes('6X4D') || s.details.includes('A05'))) {
        s.details = '';
        localStorage.setItem(CANONICAL_WORKBENCH_STORAGE_KEY, JSON.stringify(s));
      }
    }
    workbenchStateLens.migrateLegacyStorage();
  } catch (_e) { }
}

/**
 * Inicializa campos de solicitante guardados en perfil local (`smat_user_profile`).
 */
export function initProfileFromStorage(doc, dom = {}, onUpdated = null) {
  if (!doc || typeof localStorage === 'undefined') return null;
  try {
    const cached = localStorage.getItem('smat_user_profile');
    if (!cached) return null;
    const p = JSON.parse(cached);
    if (p.name && dom.inputName) dom.inputName.value = p.name;
    if (p.company && dom.inputCompany) dom.inputCompany.value = p.company;
    if (p.phone && dom.inputPhone) dom.inputPhone.value = p.phone;
    if (p.email && dom.inputEmail) dom.inputEmail.value = p.email;
    if (p.destination && dom.inputDest) dom.inputDest.value = p.destination;

    const chip = doc.getElementById('returning-user-chip');
    const chipText = doc.getElementById('user-chip-text');
    if (chip && chipText && p.name) {
      chip.classList.remove('hidden');
      chip.removeAttribute('hidden');
      const strong = chipText.querySelector('strong');
      if (strong) strong.textContent = `${p.name} (${p.company || 'Mina'})`;
    }
    if (typeof onUpdated === 'function') onUpdated();
    return p;
  } catch (_e) {
    return null;
  }
}

export function saveUserProfileSnapshot(d = {}) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('smat_user_profile', JSON.stringify({
      name: d.name || '',
      company: d.company || '',
      phone: d.phone || '',
      email: d.email || '',
      destination: d.destination || ''
    }));
  } catch (_e) { }
}

/**
 * Hidrata entradas de metrología de laboratorio desde el estado canónico.
 */
export function hydrateMetrologyInputsFromState(dom = {}) {
  try {
    const st = loadWorkbenchState() || {};
    const wm = st.metrology || {};
    const pairs = [
      ['specificGravity', dom.ctrlSgInput],
      ['topSizeD95Mm', dom.ctrlD95Input],
      ['liberationSizeMicrons', dom.ctrlLibInput],
      ['headGradePercent', dom.ctrlGradeInput],
      ['airPressurePsi', dom.ctrlAirPsiInput],
      ['samplingConstantC', dom.ctrlGyCInput],
      ['relativeErrorSigma', dom.ctrlGyErrInput],
      ['rosinRammlerSlopeN', dom.ctrlRrNInput],
      ['retainedPercentAtP80', dom.ctrlRetP80Input]
    ];
    for (const [k, el] of pairs) {
      if (wm[k] !== undefined && el) el.value = String(wm[k]);
    }
    if ((wm.cw !== undefined || wm.solidsPctCw !== undefined) && dom.ctrlCwInput) {
      dom.ctrlCwInput.value = String(wm.cw ?? wm.solidsPctCw);
    }
    if ((wm.sm !== undefined || wm.pulpDensityKgL !== undefined) && dom.ctrlRhopInput) {
      dom.ctrlRhopInput.value = String(wm.sm ?? wm.pulpDensityKgL);
    }
    if ((wm.p80 !== undefined || wm.targetP80Microns !== undefined) && dom.ctrlP80Input) {
      dom.ctrlP80Input.value = String(wm.p80 ?? wm.targetP80Microns);
    }
  } catch (_e) { }
}

/**
 * Hidrata los controles del Wizard desde `SMAT_WORKBENCH_STATE_KEY`.
 */
export function hydrateSessionIntoWizardDom(doc, dom = {}, state = {}, callbacks = {}) {
  try {
    const rawFallback = typeof localStorage !== 'undefined' ? localStorage.getItem(CANONICAL_WORKBENCH_STORAGE_KEY) : null;
    const s = loadWorkbenchState() || (rawFallback ? JSON.parse(rawFallback) : null);
    if (!s) return state;

    if (s.name && dom.inputName) dom.inputName.value = s.name;
    if (s.company && dom.inputCompany) dom.inputCompany.value = s.company;
    if (s.phone && dom.inputPhone) dom.inputPhone.value = s.phone;
    if (s.email && dom.inputEmail) dom.inputEmail.value = s.email;
    if (s.destination && dom.inputDest) dom.inputDest.value = s.destination;
    if (s.details && dom.inputDetails) dom.inputDetails.value = s.details;
    if (s.clientRef && dom.inputClientRef) dom.inputClientRef.value = s.clientRef;
    if (s.circuit && typeof callbacks.setCircuit === 'function') callbacks.setCircuit(s.circuit);
    if (s.role && dom.selectRole) dom.selectRole.value = s.role;
    if (s.pipe_size && dom.selectPipeSize) dom.selectPipeSize.value = s.pipe_size;

    if (s.stress_symptom && dom.inputStressSymptom) {
      dom.inputStressSymptom.value = s.stress_symptom;
      dom.stressChips?.forEach((c) => {
        const match = c.getAttribute('data-symptom') === s.stress_symptom;
        c.classList.toggle('active', match);
        c.classList.toggle('chip-ghost', !match);
        c.setAttribute('data-confirmed', match ? 'true' : 'false');
        c.setAttribute('aria-pressed', match ? 'true' : 'false');
      });
    }
    if (s.flot_role && dom.selectRoleFlot) dom.selectRoleFlot.value = s.flot_role;
    if (s.flot_capacity && dom.selectFlotCapacity) dom.selectFlotCapacity.value = s.flot_capacity;
    if (s.filt_role && dom.selectRoleFilt) dom.selectRoleFilt.value = s.filt_role;
    if (s.filt_capacity && dom.selectFiltCapacity) dom.selectFiltCapacity.value = s.filt_capacity;
    if (s.dim_outer_dia && dom.dimOuterDia) dom.dimOuterDia.value = s.dim_outer_dia;
    if (s.dim_shaft_bore && dom.dimShaftBore) dom.dimShaftBore.value = s.dim_shaft_bore;

    if (s.flow && dom.sliderFlow) dom.sliderFlow.value = s.flow;
    if (s.solids && dom.sliderSolids) dom.sliderSolids.value = s.solids;
    if (s.d80 && dom.sliderD80) dom.sliderD80.value = s.d80;
    if (s.downtime && dom.sliderDowntime) dom.sliderDowntime.value = s.downtime;

    if (s.altitude !== undefined && s.altitude !== '') {
      state.selectedAltitude = Number(s.altitude);
      const altInput = doc?.getElementById?.('wb-altitude-input');
      if (altInput) altInput.value = String(state.selectedAltitude);
      dom.altChips?.forEach((c) => c.classList.toggle('active', Number(c.getAttribute('data-alt')) === state.selectedAltitude));
      if (dom.valAltitude) dom.valAltitude.textContent = `${state.selectedAltitude.toLocaleString()} msnm`;
    }

    const optIds = [
      [s.predictedWearHours, 'wb-jrp-wear-hours'],
      [s.operatingHoursPerDay, 'wb-jrp-daily-hours'],
      [s.criticalityMode, 'wb-jrp-criticality'],
      [s.tempC, 'wb-temp-c'],
      [s.quantity, 'wb-erp-quantity'],
      [(s.logistics_mode && !s.destination) ? s.logistics_mode : '', 'wb-destination'],
      [s.delivery_destination, 'wb-erp-destination'],
      [s.floatabilityP, 'wb-flot-p'],
      [s.frothRecoveryRf, 'wb-flot-rf']
    ];
    for (const [val, id] of optIds) {
      const el = doc?.getElementById?.(id);
      if (el && val !== undefined && val !== '') el.value = String(val);
    }

    if (s.tcoAlloy) {
      state.selectedTcoAlloy = s.tcoAlloy;
      dom.tcoAlloyBtns?.forEach((b) => b.classList.toggle('active', b.getAttribute('data-alloy') === state.selectedTcoAlloy));
    }
    return state;
  } catch (_e) {
    return state;
  }
}

/**
 * Recolecta el paquete completo del Wizard incluyendo 100% de variables hidráulicas, JRP, térmicas y ERP.
 */
export function collectWizardPayloadData(doc, dom = {}, state = {}) {
  const securityField = doc?.getElementById?.('wb-website')?.value;
  if (securityField && securityField.trim().length > 0) return null;

  const isEs = Boolean(state.isEs);
  const name = dom.inputName?.value.trim() || (isEs ? 'Ing. Residente / Solicitante' : 'Lead Process Engineer');
  const company = dom.inputCompany?.value.trim() || (isEs ? 'Unidad Minera / Compañía' : 'Mining Operation / Company');
  const phone = dom.inputPhone?.value.trim() || '(618) 810-4408';
  const email = dom.inputEmail?.value.trim() || (isEs ? 'contacto@minera.com' : 'contact@miningco.com');
  const destination = dom.inputDest?.value.trim()
    || doc?.getElementById?.('wb-erp-destination')?.value?.trim()
    || 'Retiro en Almacén Central Durango (Coordinación con Folio)';
  const clientRef = dom.inputClientRef?.value.trim() || '';
  const details = dom.inputDetails?.value.trim() || 'Verificación dimensional 1:1';
  const dimDia = dom.dimOuterDia?.value.trim() || '';
  const dimBore = dom.dimShaftBore?.value.trim() || '';

  const circuit = state.currentCircuit || 'bombeo';
  let role = '';
  let roleId = '';
  let sizeVal = '';
  let condVal = '';

  if (circuit === 'bombeo') {
    const roleOpt = dom.selectRole?.options[dom.selectRole.selectedIndex];
    role = roleOpt ? roleOpt.text : 'Kit Extremo Húmedo';
    roleId = dom.selectRole?.value || 'kit_wet_end';
    sizeVal = dom.selectPipeSize?.value || '6x4';
    condVal = dom.inputStressSymptom?.value || 'roca_dura';
  } else if (circuit === 'flotacion') {
    const roleOptF = dom.selectRoleFlot?.options[dom.selectRoleFlot.selectedIndex];
    role = roleOptF ? roleOptF.text : 'Mecanismo Rotor/Estator';
    roleId = dom.selectRoleFlot?.value || 'rotor_estator';
    sizeVal = dom.selectFlotCapacity?.value || '100ft';
    condVal = dom.inputFlotCondition?.value || 'sulfuros_alta_agitacion';
  } else if (circuit === 'control_procesos') {
    const roleOptC = dom.selectRoleCtrl?.options[dom.selectRoleCtrl.selectedIndex];
    role = roleOptC ? roleOptC.text : 'Balanza de Densidad de Pulpa (Tipo Marcy)';
    roleId = dom.selectRoleCtrl?.value || 'balanza_marcy';
    sizeVal = dom.selectCtrlSpec?.value || 'marcy_12_rings';
    condVal = 'control_laboratorio';
  } else if (circuit === 'clasificacion') {
    const selectRoleClasCollect = doc.getElementById('wb-role-cyc');
    const selectClasSizeCollect = doc.getElementById('wb-cyc-series');
    const selectClasLinerCollect = doc.getElementById('wb-cyc-liner');
    const roleOptCl = selectRoleClasCollect?.options?.[selectRoleClasCollect.selectedIndex];
    role = roleOptCl ? roleOptCl.text : 'Kit Apex + Vortex Finder Antiabrasivo (Ciclón Plitt)';
    roleId = selectRoleClasCollect?.value || 'apex_vortex_kit';
    sizeVal = `D${selectClasSizeCollect?.value || '380'}`;
    condVal = selectClasLinerCollect?.value || 'ceramica_sic';
  } else {
    const roleOptP = dom.selectRoleFilt?.options[dom.selectRoleFilt.selectedIndex];
    role = roleOptP ? roleOptP.text : 'Placas y Telas Filtrantes';
    roleId = dom.selectRoleFilt?.value || 'placas_telas';
    sizeVal = dom.selectFiltCapacity?.value || '1500';
    condVal = dom.inputFiltCondition?.value || 'jales_secos';
  }

  const smatCode = (dom.liveSmatCode ? dom.liveSmatCode.textContent : '') || buildSmatCode(circuit, roleId, sizeVal, condVal);
  const checkedChan = doc.querySelector('input[name="channel_pref"]:checked');
  const channelPref = checkedChan ? checkedChan.value : 'whatsapp';
  const pkgItems = Array.from(doc.querySelectorAll('input[name="pkg_item"]:checked')).map((c) => c.value);

  const qtyVal = Math.max(1, Math.round(Number(doc.getElementById('wb-erp-quantity')?.value ?? 1)));
  const logisticsMode = String(doc.getElementById('wb-destination')?.value || 'retiro');
  const tempCVal = Number(doc.getElementById('wb-temp-c')?.value ?? 35);
  const strictBlindCheck = Boolean(doc.getElementById('wb-strict-blind-check')?.checked);
  const misionVal = state.isOpex ? 'refacciones' : 'equipos';

  const partSpecs = state.currentPartSpecs || {};
  const clearanceEval = state.currentClearanceEval || {};
  const kinematics = state.currentKinematics || {};
  const metrology = state.currentMetrology || {};
  const pumpMat = doc.getElementById('wb-pump-material')?.value || 'alto_cromo_cr27';
  const driveArr = doc.getElementById('wb-drive-arrangement')?.value || 'CV';

  const data = {
    folio: state.currentFolio,
    name,
    company,
    phone,
    email,
    circuit,
    role,
    role_id: roleId,
    size_val: sizeVal,
    condition_val: condVal,
    smat_code: smatCode,
    atomic_code: state.currentAtomicCode || '',
    pulp_profile: state.selectedUnitPulpProfile || '',
    metrics: state.currentHydraulicMetrics || {},
    tco: state.currentTcoMetrics || {},
    alloy: (state.currentHydraulicMetrics && state.currentHydraulicMetrics.recommended_alloy) || 'High Chrome A05 (>650 HB)',
    details,
    client_reference: clientRef,
    placa_ref: clientRef,
    quantity: qtyVal,
    cantidad: qtyVal,
    logistics_mode: logisticsMode,
    canal_preferido: channelPref,
    channel_preference: channelPref,
    mision: misionVal,
    mission: misionVal,
    delivery_destination: destination,
    destination,
    tempC: tempCVal,
    strictBlindCheck,
    dim_outer_dia: dimDia,
    dim_shaft_bore: dimBore,
    isOpex: Boolean(state.isOpex),
    package_items: state.isOpex ? [] : pkgItems,
    is_custom: Boolean(state.isCustomEquipment),
    custom_notes: state.isCustomEquipment
      ? [dom.customEquipType?.value?.trim(), dom.customEquipCapacity?.value?.trim(), dom.customEquipNotes?.value?.trim()].filter(Boolean).join(' — ')
      : '',
    pump_material: pumpMat,
    wet_material: pumpMat,
    material: pumpMat,
    drive_arrangement: driveArr,
    transmision: driveArr,
    assembly_station: partSpecs.station || 'S3',
    station_number: partSpecs.station_number || 3,
    estacion: partSpecs.station_number || 3,
    part_weight_kg: partSpecs.weight_kg || 68.0,
    peso_kg: partSpecs.weight_kg || 68.0,
    front_clearance_mm: clearanceEval.frontClearanceMm || 0.75,
    claro_mm: clearanceEval.frontClearanceMm || 0.75,
    delta_eta_v: clearanceEval.volumetricEfficiencyDropPct ?? clearanceEval.volumetricEfficiencyLossPct ?? 1.6,
    tip_speed_ms: kinematics.tipSpeedMs || 19.9,
    u2_ms: kinematics.tipSpeedMs || 19.9,
    pump_rpm: kinematics.pumpRpm || 1149,
    n2_rpm: kinematics.pumpRpm || 1149,
    belt_radial_load_kn: kinematics.beltRadialLoadKn || 0,
    fr_kn: kinematics.beltRadialLoadKn || 0,
    sump_flood_immunity: kinematics.sumpFloodImmunity || 'HIGH',
    inmunidad_sumidero: kinematics.sumpFloodImmunity || 'HIGH',
    structural_reason: clearanceEval.structuralReasonEs || '',
    razon_estructural: clearanceEval.structuralReasonEs || '',
    bearing_l10h: kinematics.bearingL10Hours ?? kinematics.estimatedL10hHours ?? 28500,
    l10h: kinematics.bearingL10Hours ?? kinematics.estimatedL10hHours ?? 28500,
    metrology_summary: metrology.summary || metrology.raw || '',
    metrologia: metrology.summary || metrology.raw || '',
    part_slug: partSpecs.slug || roleId,
    part_specs: partSpecs,
    clearance_eval: clearanceEval,
    kinematics,
    metrology,
    cyclone_circuit: (loadWorkbenchState() || {}).cycloneCircuit || null,
    g5_advance_confirmed: Boolean(doc.getElementById('wb-g5-advance-confirm')?.checked)
  };
  saveUserProfileSnapshot(data);
  return data;
}

/**
 * Procesa URL query/hash hacia estado e inputs del Wizard (lente GetPut sin amnesia).
 */
export function applyUrlContextToWizard(doc, dom = {}, state = {}, callbacks = {}) {
  if (typeof window === 'undefined' || !doc) return;
  const rawSearch = window.location.search || '';
  const rawHash = window.location.hash || '';
  if (!rawSearch && !rawHash) return;

  const ctx = parseUrlContextParams(rawSearch, rawHash);
  const hasAnyParam = Object.keys(ctx).some((k) => ctx[k] !== null && ctx[k] !== '');
  if (!hasAnyParam) {
    if (rawHash.includes('rfq')) {
      doc.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  try {
    const viewState = computeWizardViewState({ circuit: state.currentCircuit }, ctx);
    const drawers = [
      [viewState.openSymptomDrawer, doc.getElementById('wb-symptom-context-details')],
      [viewState.openEngineeringDrawer, doc.getElementById('wb-engineering-config-details')],
      [viewState.openSmartPasteDrawer, doc.getElementById('wb-smart-paste-details')],
      [viewState.openStep3, dom.step3Accordion]
    ];
    for (const [shouldOpen, drawerEl] of drawers) {
      if (shouldOpen && drawerEl) drawerEl.open = true;
    }

    const isEs = Boolean(state.isEs);
    const urlDesc = resolveUrlContextDescriptor(ctx);
    const rawUrlRole = ctx.rol || ctx.equipo || '';
    const urlRole = (rawUrlRole || ctx.pieza) ? urlDesc.canonicalRole : '';
    if (urlDesc.marcyThreeCup && urlDesc.marcyThreeCup.hasUrlTelemetry) {
      saveWorkbenchSession({ cycloneCircuit: urlDesc.marcyThreeCup });
    }

    const urlBindings = [
      [ctx.ph, dom.sliderPh, false],
      [ctx.seal_branch, dom.wbSealBranch, true],
      [ctx.b2_mm, dom.wbImpellerB2, true],
      [ctx.cap_c_kn, dom.wbBearingC, true],
      [ctx.driver_mm || ctx.driverPulleyMm, dom.wbDriverPulley, true],
      [ctx.driven_mm || ctx.drivenPulleyMm, dom.wbDrivenPulley, true],
      [ctx.motor_rpm || ctx.motorRpm, dom.wbMotorRpm, true],
      [ctx.power_kw || ctx.shaftPowerKw, dom.wbShaftPower, true],
      [ctx.sg, dom.sliderSg, false],
      [ctx.sg, dom.ctrlSgInput, false],
      [ctx.solids || ctx.cw, dom.ctrlCwInput, false],
      [ctx.rhop || ctx.oreDensitySg, dom.ctrlRhopInput, false],
      [ctx.d95, dom.ctrlD95Input, false],
      [ctx.lib_um || ctx.liberationSizeMicrons, dom.ctrlLibInput, false],
      [ctx.grade || ctx.headGradePercent, dom.ctrlGradeInput, false],
      [ctx.air_psi || ctx.airPressurePsi, dom.ctrlAirPsiInput, false],
      [ctx.gy_c || ctx.samplingConstantC, dom.ctrlGyCInput, false],
      [ctx.gy_err || ctx.relativeErrorSigma, dom.ctrlGyErrInput, false],
      [ctx.d80 || ctx.p80, dom.ctrlP80Input, false],
      [ctx.rr_n || ctx.rosinRammlerSlopeN, dom.ctrlRrNInput, false],
      [ctx.ret_p80 || ctx.retainedPercentAtP80, dom.ctrlRetP80Input, false],
      [ctx.flow, dom.sliderFlow, false],
      [ctx.solids || ctx.cw, dom.sliderSolids, false],
      [ctx.d80 || ctx.p80, dom.sliderD80, false]
    ];
    for (const [val, el, markTouched] of urlBindings) {
      if (val && el) {
        el.value = String(val);
        if (markTouched && el.dataset) el.dataset.userTouched = 'true';
      }
    }

    if (ctx.claro_mm && dom.sliderClearance) {
      dom.sliderClearance.value = ctx.claro_mm;
      if (dom.sliderClearance.dataset) dom.sliderClearance.dataset.userTouched = 'true';
      const durandAccClaro = doc.getElementById('durand-accordion');
      if (durandAccClaro) durandAccClaro.open = true;
    }

    if (ctx.altitud || ctx.altitude || ctx.altitudeM) {
      const altParsed = Number(ctx.altitud ?? ctx.altitude ?? ctx.altitudeM);
      if (Number.isFinite(altParsed)) {
        state.selectedAltitude = Math.max(0, Math.min(5000, altParsed));
        const altInput = doc.getElementById('wb-altitude-input');
        if (altInput) altInput.value = String(state.selectedAltitude);
      }
    }

    if (ctx.codigo) {
      const cleanCodigo = ctx.codigo.trim().toUpperCase();
      if (dom.inputDecoder) dom.inputDecoder.value = cleanCodigo;
      const decoded = decodeSmatCode(cleanCodigo);
      if (decoded) {
        state.currentAtomicCode = decoded.atomic_code || '';
        if (typeof callbacks.setCircuit === 'function') callbacks.setCircuit(decoded.circuit);
        const effRole = urlRole || decoded.role;
        if (decoded.circuit === 'bombeo') {
          if (dom.selectRole) dom.selectRole.value = effRole;
          if (dom.selectPipeSize) dom.selectPipeSize.value = decoded.size;
        } else if (decoded.circuit === 'flotacion') {
          if (dom.selectRoleFlot) dom.selectRoleFlot.value = effRole;
          if (dom.selectFlotCapacity) dom.selectFlotCapacity.value = decoded.size;
        } else if (decoded.circuit === 'filtracion') {
          if (dom.selectRoleFilt) dom.selectRoleFilt.value = effRole;
          if (dom.selectFiltCapacity) dom.selectFiltCapacity.value = decoded.size;
        } else if (decoded.circuit === 'control_procesos') {
          if (dom.selectRoleCtrl) dom.selectRoleCtrl.value = effRole;
          if (dom.selectCtrlSpec) dom.selectCtrlSpec.value = decoded.size;
        }
        if (dom.inputDetails) {
          dom.inputDetails.value = decoded.atomic_code
            ? `${isEs ? 'Refacción específica ' : 'Specific spare '}${decoded.atomic_code} (${decoded.atomic_label}) - ${decoded.atomic_metallurgy}.`
            : `Configuración código ${decoded.code}.`;
        }
        if (dom.decoderStatus) {
          const statusLbl = decoded.atomic_code ? `${decoded.atomic_code} → ${decoded.code}` : decoded.code;
          dom.decoderStatus.textContent = isEs ? `Configuración cargada: ${statusLbl}` : `Configuration loaded: ${statusLbl}`;
          dom.decoderStatus.className = 'decoder-status success';
        }
      }
    } else {
      if (typeof callbacks.setCircuit === 'function') callbacks.setCircuit(viewState.circuit);
      const roleTargetMap = {
        bombeo: dom.selectRole,
        flotacion: dom.selectRoleFlot,
        filtracion: dom.selectRoleFilt,
        control_procesos: dom.selectRoleCtrl
      };
      const targetSel = roleTargetMap[state.currentCircuit];
      if (urlRole && targetSel) {
        const mapped = ROLE_ALIAS_MAP[urlRole] || urlRole;
        const idx = Array.from(targetSel.options || []).findIndex(
          (o) => o.value === mapped || o.value === urlRole || o.text.toLowerCase().includes(urlRole.toLowerCase())
        );
        if (idx >= 0) targetSel.selectedIndex = idx;
      }
    }

    const normSerieUrl = ctx.serie ? normalizeCircuitSerie(state.currentCircuit, ctx.serie) : null;
    if (normSerieUrl) {
      if (normSerieUrl.targetField === 'pipe_size' && dom.selectPipeSize) dom.selectPipeSize.value = normSerieUrl.value;
      else if (normSerieUrl.targetField === 'flot_capacity' && dom.selectFlotCapacity) dom.selectFlotCapacity.value = normSerieUrl.value;
      else if (normSerieUrl.targetField === 'filt_capacity' && dom.selectFiltCapacity) dom.selectFiltCapacity.value = normSerieUrl.value;
      else if (normSerieUrl.targetField === 'ctrl_spec' && dom.selectCtrlSpec) dom.selectCtrlSpec.value = normSerieUrl.value;
    }

    if (ctx.flot_condition && dom.inputFlotCondition) {
      const domFlotKey = resolveFlotationDomChipKey(ctx.flot_condition) || normalizeFlotationConditionKey(ctx.flot_condition);
      dom.inputFlotCondition.value = domFlotKey;
      dom.flotChips?.forEach((c) => {
        const isMatch = c.getAttribute('data-flot-cond') === domFlotKey;
        c.classList.toggle('active', isMatch);
        c.classList.toggle('chip-ghost', !isMatch);
        c.setAttribute('data-confirmed', isMatch ? 'true' : 'false');
      });
    }
    if (ctx.filt_condition && dom.inputFiltCondition) {
      const domFiltKey = resolveFiltrationDomChipKey(ctx.filt_condition) || normalizeFiltrationConditionKey(ctx.filt_condition);
      dom.inputFiltCondition.value = domFiltKey;
      dom.filtChips?.forEach((c) => {
        const isMatch = c.getAttribute('data-filt-cond') === domFiltKey;
        c.classList.toggle('active', isMatch);
        c.classList.toggle('chip-ghost', !isMatch);
        c.setAttribute('data-confirmed', isMatch ? 'true' : 'false');
      });
    }

    if (ctx.material && dom.selectPumpMaterial) {
      dom.selectPumpMaterial.value = normalizeMaterialKey(ctx.material);
      if (dom.selectPumpMaterial.dataset) dom.selectPumpMaterial.dataset.userTouched = 'true';
    }
    if (ctx.transmision && dom.selectDriveArrangement) {
      dom.selectDriveArrangement.value = String(ctx.transmision).toUpperCase();
      if (dom.selectDriveArrangement.dataset) dom.selectDriveArrangement.dataset.userTouched = 'true';
    }
    if (ctx.mina && dom.inputCompany) dom.inputCompany.value = ctx.mina;
    if (ctx.cantidad && doc.getElementById('wb-erp-quantity')) doc.getElementById('wb-erp-quantity').value = String(ctx.cantidad);
    if (ctx.placa_ref && dom.inputClientRef) dom.inputClientRef.value = ctx.placa_ref;

    if (ctx.urgencia === 'capex' || ctx.urgencia === 'proyecto') dom.btnCapex?.click();
    else if (ctx.urgencia === 'opex' || ctx.urgencia === 'paro') dom.btnOpex?.click();

    if (typeof callbacks.runSlurryCalculation === 'function') callbacks.runSlurryCalculation();
    if (typeof callbacks.updateRoleCriteriaBar === 'function') callbacks.updateRoleCriteriaBar();
    if (typeof callbacks.updateDossier === 'function') callbacks.updateDossier();
    if (rawHash.includes('rfq')) doc.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth' });
  } catch (_e) { }
}

/**
 * Aplica preset de unidad minera y actualiza inputs + perfil de pulpa.
 */
export function applyMiningUnitPresetToDom(doc, dom = {}, state = {}, groupObj, unitObj, callbacks = {}) {
  const resolved = resolveMiningUnitPulpPreset(groupObj, unitObj, state.selectedAltitude || 0);
  if (!resolved) return;
  const isEs = Boolean(state.isEs);
  const profileText = resolved.profileText || '';
  state.selectedUnitPulpProfile = profileText;

  if (dom.inputCompany) {
    dom.inputCompany.value = resolved.companyLabel;
    if (dom.inputCompany.dataset) dom.inputCompany.dataset.autofilled = 'true';
  }
  if (dom.inputDest) dom.inputDest.value = resolved.destinationLabel;

  const step1PulpBadge = doc.getElementById('wb-step1-pulp-profile-badge');
  const unitPulpBadge = doc.getElementById('unit-pulp-profile-badge');
  if (step1PulpBadge && profileText) {
    step1PulpBadge.classList.remove('hidden');
    step1PulpBadge.textContent = `${isEs ? 'Perfil de pulpa pre-cargado (' : 'Pre-loaded slurry profile ('}${unitObj.name}): ${profileText}`;
  }
  if (unitPulpBadge && profileText) {
    unitPulpBadge.classList.remove('hidden');
    unitPulpBadge.textContent = `${isEs ? 'Perfil Mineral Detectado (' : 'Detected Mineral Profile ('}${unitObj.name}): ${profileText}`;
  }

  if (dom.sliderFlow) dom.sliderFlow.value = String(resolved.presetFlow);
  if (dom.sliderSolids) dom.sliderSolids.value = String(resolved.presetCw);
  if (dom.sliderD80) dom.sliderD80.value = String(resolved.presetD80);
  if (dom.sliderSg) dom.sliderSg.value = String(resolved.presetSg);
  if (dom.sliderPh) dom.sliderPh.value = String(resolved.presetPh);
  if (resolved.presetAlt !== undefined) {
    state.selectedAltitude = Number(resolved.presetAlt);
    const altInput = doc.getElementById('wb-altitude-input');
    if (altInput) altInput.value = String(state.selectedAltitude);
    if (dom.valAltitude) dom.valAltitude.textContent = `${state.selectedAltitude.toLocaleString()} msnm`;
  }
  if (dom.ctrlSgInput) dom.ctrlSgInput.value = String(resolved.presetSg);
  if (dom.ctrlCwInput) dom.ctrlCwInput.value = String(resolved.presetCw);
  if (dom.ctrlP80Input) dom.ctrlP80Input.value = String(resolved.presetD80);

  if (typeof callbacks.runSlurryCalculation === 'function') callbacks.runSlurryCalculation();
  if (typeof callbacks.updateDossier === 'function') callbacks.updateDossier();
}

export function detectAndBindMiningDomain(doc, dom = {}, state = {}, miningGroups = [], callbacks = {}) {
  const match = matchMiningGroupByEmailDomain(dom.inputEmail?.value, miningGroups);
  const hintBox = doc.getElementById('mining-group-hint');
  const hintName = doc.getElementById('hint-group-name');
  const unitChips = doc.getElementById('unit-chips-container');
  if (!match || !hintBox || !hintName || !unitChips) {
    if (hintBox) hintBox.classList.add('hidden');
    return null;
  }
  hintBox.classList.remove('hidden');
  hintName.textContent = match.name;
  if (dom.inputCompany && (!dom.inputCompany.value || dom.inputCompany.dataset?.autofilled === 'true')) {
    dom.inputCompany.value = match.name;
    if (dom.inputCompany.dataset) dom.inputCompany.dataset.autofilled = 'true';
  }
  while (unitChips.firstChild) unitChips.removeChild(unitChips.firstChild);
  for (const u of (match.units || [])) {
    const chip = doc.createElement('button');
    chip.type = 'button';
    chip.className = 'unit-chip-btn';
    chip.textContent = u.name;
    if (u.pulp_profile) chip.setAttribute('data-pulp-profile', u.pulp_profile);
    chip.addEventListener('click', () => applyMiningUnitPresetToDom(doc, dom, state, match, u, callbacks));
    unitChips.appendChild(chip);
  }
  if (typeof callbacks.updateDossier === 'function') callbacks.updateDossier();
  return match;
}
