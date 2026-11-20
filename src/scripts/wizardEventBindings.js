// @ts-nocheck
/**
 * wizardEventBindings.js
 * ---------------------------------------------------------------------------
 * Costura Modular C1 extraída desde quoteWizardController.js (D1-V50 / D3-V50).
 * Enlace automático declarativo de listeners DOM gobernado por `ENGINE_SCHEMA_REGISTRY`
 * (sin innerHTML, con #wb-assembly-sequence canónico y entradas continuas V5.0).
 */

import { listAllEngineSchemas } from './engineSchemaRegistry.js';
import { SLURRY_PRESETS } from './slurryEngine.js';
import {
  DEFAULT_SMAT_LEAD_WEBHOOK_URL,
  saveWorkbenchSession,
  publishWorkbenchUpdate,
  subscribeWorkbenchUpdate,
  formatSapPlaintext,
  formatSapTsv,
  formatMailtoUrl,
  formatWhatsappUrl,
  buildAcuseUrlParams,
  buildLeadWebhookPayload,
  sendLeadToServer
} from './workbenchBus.js';
import {
  DEFAULT_CLASSIFICATION_CRITERIA_MAP
} from './quoteDossierRenderer.js';
import { decodeSmatCode } from './wizardMiningAndCodeDecoder.js';
import {
  bindWizardCircuitCalculators
} from './wizardCircuitPhysicsController.js';
import {
  bindVendorPassportDownloadButtons,
  initCoreTradeInWidgets
} from './vendorPassportAndTradeInController.js';
import {
  switchDossierTabView,
  flashInk
} from './wizardDossierProjector.js';
import {
  applyMiningUnitPresetToDom,
  detectAndBindMiningDomain
} from './wizardStateAndUrlLens.js';

/**
 * Recolecta en un solo descriptor todas las referencias DOM usadas por `/cotizar/`.
 * Unifica `#wb-assembly-sequence` erradicando `-test` (`DEB-V50-03`).
 */
export function collectWizardDomRefs(doc) {
  if (!doc) return {};
  const byId = (id) => doc.getElementById(id);
  const all = (sel) => doc.querySelectorAll(sel);

  return {
    container: byId('rfq'),
    btnOpex: byId('btn-intent-opex'),
    btnCapex: byId('btn-intent-capex'),
    selectRole: byId('wb-role'),
    inputDetails: byId('wb-details'),
    inputClientRef: byId('wb-client-ref'),
    inputName: byId('wb-name'),
    inputCompany: byId('wb-company'),
    inputPhone: byId('wb-phone'),
    inputEmail: byId('wb-email'),
    inputDest: byId('wb-destination'),
    circuitPills: all('.circuit-pill'),
    inputCircuit: byId('wb-process-circuit'),
    panelBombeo: byId('circuit-panel-bombeo'),
    panelFlotacion: byId('circuit-panel-flotacion'),
    panelFiltracion: byId('circuit-panel-filtracion'),
    panelControl: byId('circuit-panel-control'),
    selectRoleCtrl: byId('wb-role-ctrl'),
    selectCtrlSpec: byId('wb-ctrl-spec'),
    selectPipeSize: byId('wb-pipe-size'),
    stressChips: all('.stress-chip'),
    inputStressSymptom: byId('wb-stress-symptom'),
    recircAlertBox: byId('recirculation-alert-box'),
    recircWarnDossier: byId('live-recirc-warning-dossier'),
    selectRoleFlot: byId('wb-role-flot'),
    selectFlotCapacity: byId('wb-flot-capacity'),
    flotChips: all('.flot-chip'),
    inputFlotCondition: byId('wb-flot-condition'),
    selectRoleFilt: byId('wb-role-filt'),
    selectFiltCapacity: byId('wb-filt-capacity'),
    filtChips: all('.filt-chip'),
    inputFiltCondition: byId('wb-filt-condition'),
    dimOuterDia: byId('wb-dim-dia'),
    dimShaftBore: byId('wb-dim-bore'),
    livePipeHeader: byId('live-pipe-header'),
    livePipeText: byId('live-pipe-text'),
    liveStressHeader: byId('live-stress-header'),
    liveStressText: byId('live-stress-text'),
    presetChips: all('.preset-chip'),
    customEquipDetails: byId('custom-equip-details'),
    customEquipType: byId('custom-equip-type'),
    customEquipCapacity: byId('custom-equip-capacity'),
    customEquipNotes: byId('custom-equip-notes'),
    liveCustomBox: byId('live-custom-box'),
    liveCustomText: byId('live-custom-text'),
    sliderFlow: byId('slider-flow'),
    sliderSolids: byId('slider-solids'),
    sliderD80: byId('slider-d80'),
    sliderSg: byId('slider-sg'),
    sliderPh: byId('slider-ph'),
    sliderDowntime: byId('slider-downtime'),
    valFlow: byId('val-flow'),
    valSolids: byId('val-solids'),
    valD80: byId('val-d80'),
    valSg: byId('val-sg'),
    valPh: byId('val-ph'),
    valPipeMm: byId('val-pipe-mm'),
    valDowntime: byId('val-downtime'),
    wbSealBranch: byId('wb-seal-branch'),
    wbImpellerB2: byId('wb-impeller-b2'),
    wbBearingC: byId('wb-bearing-c'),
    ctrlSgInput: byId('wb-ctrl-sg'),
    ctrlCwInput: byId('wb-ctrl-cw'),
    ctrlRhopInput: byId('wb-ctrl-rhop'),
    ctrlD95Input: byId('wb-ctrl-d95'),
    ctrlLibInput: byId('wb-ctrl-lib'),
    ctrlGradeInput: byId('wb-ctrl-grade'),
    ctrlAirPsiInput: byId('wb-ctrl-air-psi'),
    ctrlGyCInput: byId('wb-ctrl-gy-c'),
    ctrlGyErrInput: byId('wb-ctrl-gy-err'),
    ctrlP80Input: byId('wb-ctrl-p80'),
    ctrlRrNInput: byId('wb-ctrl-rr-n'),
    ctrlRetP80Input: byId('wb-ctrl-ret-p80'),
    ctrlSieveTbody: byId('wb-ctrl-sieve-tbody'),
    wbDriverPulley: byId('wb-driver-pulley'),
    wbDrivenPulley: byId('wb-driven-pulley'),
    wbValDriverPulley: byId('wb-val-driver-pulley'),
    wbValDrivenPulley: byId('wb-val-driven-pulley'),
    wbMotorRpm: byId('wb-motor-rpm'),
    wbShaftPower: byId('wb-shaft-power'),
    wbAssemblySequence: byId('wb-assembly-sequence'),
    metricAssemblyMassSeq: byId('metric-assembly-mass-seq'),
    elMetricDriveRpm: byId('metric-drive-rpm'),
    elMetricDriveFr: byId('metric-drive-fr'),
    elMetricDriveFlood: byId('metric-drive-flood'),
    elMetricStructuralReason: byId('metric-structural-reason'),
    elMetricClearanceLoss: byId('metric-clearance-loss'),
    metricVc: byId('metric-vc'),
    metricMaterial: byId('metric-material'),
    metricLife: byId('metric-life'),
    regimePill: byId('regime-pill'),
    regimeDetail: byId('regime-detail'),
    tcoTonnageVal: byId('tco-tonnage-val'),
    miniAlloyBadge: byId('mini-alloy-badge'),
    miniFolioText: byId('mini-folio-text'),
    altChips: all('.alt-chip'),
    altNumericInput: byId('wb-altitude-input'),
    valAltitude: byId('val-altitude'),
    altitudeNpshHint: byId('altitude-npsh-hint'),
    tcoAlloyBtns: all('.tco-alloy-btn'),
    tcoSavingsVal: byId('tco-savings-val'),
    inputDecoder: byId('wb-code-decoder-input'),
    btnDecoder: byId('wb-code-decode-btn'),
    decoderStatus: byId('decoder-status'),
    tabBtnMaint: byId('tab-btn-maint'),
    tabBtnSap: byId('tab-btn-sap'),
    paneMaint: byId('pane-maint'),
    paneSap: byId('pane-sap'),
    sapJustificationText: byId('sap-justification-text'),
    liveFolio: byId('live-folio'),
    liveSmatCode: byId('live-smat-code'),
    livePriorityTag: byId('live-priority-tag'),
    liveRequester: byId('live-requester'),
    liveCompany: byId('live-company'),
    liveContact: byId('live-contact'),
    liveDestination: byId('live-destination'),
    livePartName: byId('live-part-name'),
    livePartDetails: byId('live-part-details'),
    liveClientRefBox: byId('live-client-ref-box'),
    liveClientRefText: byId('live-client-ref-text'),
    liveTableFlow: byId('live-table-flow'),
    liveTableD80: byId('live-table-d80'),
    liveTableVc: byId('live-table-vc'),
    liveTableMat: byId('live-table-mat'),
    dossierPartHardness: byId('dossier-part-hardness'),
    dossierPartFitGuarantee: byId('dossier-part-fit-guarantee'),
    sapLivePart: byId('sap-live-part'),
    sapLiveCode: byId('sap-live-code'),
    sapLiveMat: byId('sap-live-mat'),
    sapLiveDest: byId('sap-live-dest'),
    selectPumpMaterial: byId('wb-pump-material'),
    selectDriveArrangement: byId('wb-drive-arrangement'),
    sliderClearance: byId('wb-clearance-slider'),
    btnSwitchCr27: byId('wb-switch-cr27-btn'),
    btnApplyMetrology: byId('wb-apply-metrology-btn'),
    btnOpenStep2: byId('btn-open-step2'),
    btnOpenStep3: byId('btn-open-step3'),
    step3Accordion: byId('wb-step3-accordion'),
    jrpWearInput: byId('wb-jrp-wear-hours'),
    jrpDailyInput: byId('wb-jrp-daily-hours'),
    jrpCriticality: byId('wb-jrp-criticality'),
    coreTradeInToggle: byId('wb-core-tradein-toggle'),
    tempCInput: byId('wb-temp-c'),
    strictBlindCheck: byId('wb-strict-blind-check'),
    erpQuantity: byId('wb-erp-quantity'),
    erpLogistics: byId('wb-erp-logistics-mode'),
    erpDestination: byId('wb-erp-destination')
  };
}

/**
 * Enlaza automáticamente cada selector declarado en `ENGINE_SCHEMA_REGISTRY`.
 */
export function bindSchemaInputsAutomatically(doc, onChanged) {
  if (!doc || typeof onChanged !== 'function') return 0;
  let boundCount = 0;
  for (const schema of listAllEngineSchemas()) {
    for (const inp of schema.inputsSchema) {
      const selectors = [inp.domBinding, ...(inp.aliasBindings || [])].filter(Boolean);
      for (const sel of selectors) {
        const nodes = doc.querySelectorAll?.(sel) || [];
        nodes.forEach((node) => {
          if (node.dataset?.schemaBound === '1') return;
          if (node.dataset) node.dataset.schemaBound = '1';
          const handler = () => {
            if (node.dataset) node.dataset.userTouched = 'true';
            onChanged(inp.field, schema.id, node);
          };
          node.addEventListener('input', handler);
          node.addEventListener('change', handler);
          boundCount += 1;
        });
      }
    }
  }
  return boundCount;
}

/**
 * Registra todos los listeners interactivos de la consola de `/cotizar/` (`C1`).
 */
export function bindAllWizardEventListeners(ctx = {}) {
  const { doc, win, dom = {}, state = {}, actions = {} } = ctx;
  if (!doc) return;
  const isEs = Boolean(state.isEs);

  // 1. Enlace declarativo desde EngineSchema (incluye altitud libre, JRP, tempC, ciclón/criba, flotación P/Rf, ERP)
  bindSchemaInputsAutomatically(doc, () => {
    actions.runSlurryCalculation?.();
    actions.updateDossier?.();
  });

  // 2. Pills de circuito (XOR statechart)
  dom.circuitPills?.forEach((pill) => {
    pill.addEventListener('click', () => {
      const c = pill.getAttribute('data-circuit');
      if (c) {
        actions.setCircuit?.(c);
        publishWorkbenchUpdate({ circuit: c, intent: state.isOpex ? 'opex' : 'capex', source: 'QuoteWizard' });
      }
    });
  });

  // 3. Drawers de asistencia y diagnóstico
  const assistPills = doc.querySelectorAll('.assist-pill-btn[data-assist-target]');
  assistPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-assist-target');
      const targetEl = targetId ? doc.getElementById(targetId) : null;
      if (!targetEl) return;
      targetEl.open = !targetEl.open;
      btn.setAttribute('aria-expanded', targetEl.open ? 'true' : 'false');
    });
  });

  // 4. Chips de síntomas (bombeo, flotación, filtración)
  const bindChipGroup = (chips, hiddenInput, attrName, defaultVal, recalcSlurry) => {
    chips?.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => {
          c.classList.remove('active');
          c.classList.add('chip-ghost');
          c.setAttribute('data-confirmed', 'false');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.classList.remove('chip-ghost');
        chip.setAttribute('data-confirmed', 'true');
        chip.setAttribute('aria-pressed', 'true');
        if (hiddenInput) hiddenInput.value = chip.getAttribute(attrName) || defaultVal;
        flashInk(chip);
        if (recalcSlurry) actions.runSlurryCalculation?.();
        actions.updateDossier?.();
      });
    });
  };
  bindChipGroup(dom.stressChips, dom.inputStressSymptom, 'data-symptom', 'roca_dura', true);
  bindChipGroup(dom.flotChips, dom.inputFlotCondition, 'data-flot-cond', 'sulfuros_alta_agitacion', false);
  bindChipGroup(dom.filtChips, dom.inputFiltCondition, 'data-filt-cond', 'jales_secos', false);

  // 5. Decodificador inteligente de código SMAT / refacción
  const handleDecodeAction = () => {
    const rawCode = dom.inputDecoder?.value.trim();
    if (!rawCode) {
      if (dom.decoderStatus) {
        dom.decoderStatus.textContent = isEs ? 'Ingrese un código SMAT válido (ej. E4083 o SMAT-PUMP-6X4-WETKIT)' : 'Enter a valid SMAT code (e.g. E4083 or SMAT-PUMP-6X4-WETKIT)';
        dom.decoderStatus.className = 'decoder-status error';
      }
      return;
    }
    const decoded = decodeSmatCode(rawCode, isEs ? 'es' : 'en');
    if (decoded) {
      state.currentAtomicCode = decoded.atomic_code || '';
      actions.setCircuit?.(decoded.circuit);
      if (decoded.circuit === 'bombeo') {
        if (dom.selectRole) dom.selectRole.value = decoded.role;
        if (dom.selectPipeSize) dom.selectPipeSize.value = decoded.size;
      } else if (decoded.circuit === 'flotacion') {
        if (dom.selectRoleFlot) dom.selectRoleFlot.value = decoded.role;
        if (dom.selectFlotCapacity) dom.selectFlotCapacity.value = decoded.size;
      } else if (decoded.circuit === 'filtracion') {
        if (dom.selectRoleFilt) dom.selectRoleFilt.value = decoded.role;
        if (dom.selectFiltCapacity) dom.selectFiltCapacity.value = decoded.size;
      } else if (decoded.circuit === 'control_procesos') {
        if (dom.selectRoleCtrl) dom.selectRoleCtrl.value = decoded.role;
        if (dom.selectCtrlSpec) dom.selectCtrlSpec.value = decoded.size;
      }
      if (dom.inputDetails) {
        dom.inputDetails.value = decoded.atomic_code
          ? `${isEs ? 'Refacción específica ' : 'Specific spare '}${decoded.atomic_code} (${decoded.atomic_label}) - ${decoded.atomic_metallurgy}.`
          : `Configuración ${decoded.code}.`;
      }
      if (dom.decoderStatus) {
        const lbl = decoded.atomic_code ? `${decoded.atomic_code} → ${decoded.code}` : decoded.code;
        dom.decoderStatus.textContent = isEs ? `Configuración cargada: ${lbl}` : `Configuration loaded: ${lbl}`;
        dom.decoderStatus.className = 'decoder-status success';
      }
      actions.updateRoleCriteriaBar?.();
      actions.runSlurryCalculation?.();
      actions.updateDossier?.();
    } else if (dom.decoderStatus) {
      dom.decoderStatus.textContent = isEs ? 'Código no reconocido. Verifique el formato SMAT.' : 'Unrecognized code. Verify SMAT format.';
      dom.decoderStatus.className = 'decoder-status error';
    }
  };
  dom.btnDecoder?.addEventListener('click', handleDecodeAction);
  dom.inputDecoder?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleDecodeAction(); }
  });

  // 6. Presets rápidos de operación minera
  const presetsMap = {
    sag_primary: { flow: SLURRY_PRESETS.sag_primary.flowM3H, solids: SLURRY_PRESETS.sag_primary.solidsWeightPercent, d80: SLURRY_PRESETS.sag_primary.particleSizeD80Microns, circuit: 'bombeo', role: 'solo_impulsor', pipeSize: '8x6' },
    flotation_rougher: { flow: SLURRY_PRESETS.flotation_rougher.flowM3H, solids: SLURRY_PRESETS.flotation_rougher.solidsWeightPercent, d80: SLURRY_PRESETS.flotation_rougher.particleSizeD80Microns, circuit: 'flotacion', role: 'rotor_estator', flotCap: '100ft' },
    tailings_thickened: { flow: SLURRY_PRESETS.tailings_thickened.flowM3H, solids: SLURRY_PRESETS.tailings_thickened.solidsWeightPercent, d80: SLURRY_PRESETS.tailings_thickened.particleSizeD80Microns, circuit: 'bombeo', role: 'skid_bomba', pipeSize: '8x6' },
    emergency_6x4: { flow: SLURRY_PRESETS.emergency_6x4.flowM3H, solids: SLURRY_PRESETS.emergency_6x4.solidsWeightPercent, d80: SLURRY_PRESETS.emergency_6x4.particleSizeD80Microns, circuit: 'bombeo', role: 'kit_wet_end', pipeSize: '6x4' }
  };
  dom.presetChips?.forEach((chip) => {
    chip.addEventListener('click', () => {
      const p = presetsMap[chip.getAttribute('data-preset')];
      if (!p) return;
      dom.presetChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const durandAcc = doc.getElementById('durand-accordion');
      if (durandAcc) durandAcc.open = true;
      if (p.circuit) actions.setCircuit?.(p.circuit);
      if (dom.sliderFlow) dom.sliderFlow.value = p.flow;
      if (dom.sliderSolids) dom.sliderSolids.value = p.solids;
      if (dom.sliderD80) dom.sliderD80.value = p.d80;
      if (p.circuit === 'flotacion') {
        if (dom.selectRoleFlot && p.role) dom.selectRoleFlot.value = p.role;
        if (dom.selectFlotCapacity && p.flotCap) dom.selectFlotCapacity.value = p.flotCap;
      } else {
        if (dom.selectRole && p.role) dom.selectRole.value = p.role;
        if (dom.selectPipeSize && p.pipeSize) dom.selectPipeSize.value = p.pipeSize;
      }
      actions.runSlurryCalculation?.();
      actions.updateDossier?.();
    });
  });

  // 7. OPEX / CAPEX y equipo fuera de catálogo
  if (dom.customEquipDetails) {
    dom.customEquipDetails.addEventListener('toggle', () => {
      state.isCustomEquipment = dom.customEquipDetails.open;
      actions.updateDossier?.();
    });
    [dom.customEquipType, dom.customEquipCapacity, dom.customEquipNotes].forEach((inp) => {
      inp?.addEventListener('input', () => actions.updateDossier?.());
    });
  }

  const packageBundlePanel = doc.getElementById('package-bundle-panel');
  const photoUploadRow = doc.getElementById('photo-upload-row');
  const segmentBtns = doc.querySelectorAll('.segment-btn');
  segmentBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const r = btn.querySelector('input');
      if (r) r.checked = true;
      actions.updateDossier?.();
    });
  });
  if (dom.btnOpex && dom.btnCapex) {
    dom.btnOpex.addEventListener('click', () => {
      state.isOpex = true;
      dom.btnOpex.classList.add('selected');
      dom.btnCapex.classList.remove('selected');
      const r = dom.btnOpex.querySelector('input');
      if (r) r.checked = true;
      packageBundlePanel?.classList.add('hidden');
      photoUploadRow?.classList.remove('hidden');
      actions.updateDossier?.();
    });
    dom.btnCapex.addEventListener('click', () => {
      state.isOpex = false;
      dom.btnCapex.classList.add('selected');
      dom.btnOpex.classList.remove('selected');
      const r = dom.btnCapex.querySelector('input');
      if (r) r.checked = true;
      packageBundlePanel?.classList.remove('hidden');
      photoUploadRow?.classList.add('hidden');
      actions.updateDossier?.();
    });
  }
  doc.querySelectorAll('input[name="pkg_item"]').forEach((cb) => cb.addEventListener('change', () => actions.updateDossier?.()));

  // 8. Altitud (chips + entrada numérica libre [0, 5000]) y TCO
  const setAltitude = (altVal) => {
    const clamped = Math.max(0, Math.min(5000, Number(altVal) || 0));
    state.selectedAltitude = clamped;
    dom.altChips?.forEach((c) => c.classList.toggle('active', Number(c.getAttribute('data-alt')) === clamped));
    if (dom.altNumericInput && Number(dom.altNumericInput.value) !== clamped) dom.altNumericInput.value = String(clamped);
    if (dom.valAltitude) dom.valAltitude.textContent = `${clamped.toLocaleString()} msnm`;
    actions.runSlurryCalculation?.();
    actions.updateDossier?.();
  };
  dom.altChips?.forEach((chip) => chip.addEventListener('click', () => setAltitude(chip.getAttribute('data-alt'))));
  dom.altNumericInput?.addEventListener('input', () => setAltitude(dom.altNumericInput.value));
  dom.altNumericInput?.addEventListener('change', () => setAltitude(dom.altNumericInput.value));

  dom.tcoAlloyBtns?.forEach((btn) => {
    btn.addEventListener('click', () => {
      dom.tcoAlloyBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedTcoAlloy = btn.getAttribute('data-alloy') || 'A05';
      actions.runSlurryCalculation?.();
      actions.updateDossier?.();
    });
  });

  // 9. Pestañas del dossier + botones de contacto + inputs continuos
  dom.tabBtnMaint?.addEventListener('click', () => switchDossierTabView('maint', dom));
  dom.tabBtnSap?.addEventListener('click', () => switchDossierTabView('sap', dom));
  const btnCopyJust = doc.getElementById('btn-copy-justification');
  if (btnCopyJust && dom.sapJustificationText) {
    btnCopyJust.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard?.writeText(dom.sapJustificationText.textContent || '')?.then(() => {
        btnCopyJust.textContent = isEs ? 'Copiado' : 'Copied';
        setTimeout(() => { btnCopyJust.textContent = isEs ? 'Copiar' : 'Copy'; }, 2000);
      });
    });
  }

  dom.selectPipeSize?.addEventListener('change', () => { actions.runSlurryCalculation?.(); actions.updateDossier?.(); });
  dom.selectFlotCapacity?.addEventListener('change', () => actions.updateDossier?.());
  dom.selectFiltCapacity?.addEventListener('change', () => actions.updateDossier?.());

  [dom.selectRole, dom.selectRoleFlot, dom.selectRoleFilt, dom.selectRoleCtrl, dom.selectCtrlSpec].forEach((sel) => {
    sel?.addEventListener('change', () => {
      actions.updateRoleCriteriaBar?.();
      actions.updateDossier?.();
    });
  });

  [
    dom.sliderFlow, dom.sliderSolids, dom.sliderD80, dom.sliderSg, dom.sliderPh, dom.sliderDowntime,
    dom.ctrlSgInput, dom.ctrlCwInput, dom.ctrlRhopInput, dom.ctrlD95Input, dom.ctrlLibInput,
    dom.ctrlGradeInput, dom.ctrlAirPsiInput, dom.ctrlGyCInput, dom.ctrlGyErrInput, dom.ctrlP80Input,
    dom.ctrlRrNInput, dom.ctrlRetP80Input
  ].forEach((el) => {
    el?.addEventListener('input', () => {
      actions.runSlurryCalculation?.();
      actions.updateDossier?.();
    });
  });

  [
    dom.dimOuterDia, dom.dimShaftBore, dom.inputDetails, dom.inputClientRef,
    dom.inputName, dom.inputCompany, dom.inputPhone, dom.inputEmail, dom.inputDest
  ].forEach((el) => {
    el?.addEventListener('input', () => actions.updateDossier?.());
    el?.addEventListener('change', () => actions.updateDossier?.());
  });

  [
    dom.selectPumpMaterial, dom.selectDriveArrangement, dom.sliderClearance,
    dom.wbDriverPulley, dom.wbDrivenPulley, dom.wbMotorRpm, dom.wbShaftPower,
    dom.wbAssemblySequence, dom.wbSealBranch, dom.wbImpellerB2, dom.wbBearingC,
    dom.jrpWearInput, dom.jrpDailyInput, dom.jrpCriticality, dom.coreTradeInToggle,
    dom.tempCInput, dom.strictBlindCheck, dom.erpQuantity, dom.erpLogistics, dom.erpDestination
  ].forEach((el) => {
    const onKinChange = () => {
      if (el.dataset) el.dataset.userTouched = 'true';
      actions.updateDossier?.();
    };
    el?.addEventListener('input', onKinChange);
    el?.addEventListener('change', onKinChange);
  });

  dom.btnSwitchCr27?.addEventListener('click', () => {
    if (dom.selectPumpMaterial) {
      dom.selectPumpMaterial.value = 'alto_cromo_cr27';
      if (dom.selectPumpMaterial.dataset) dom.selectPumpMaterial.dataset.userTouched = 'true';
    }
    actions.updateDossier?.();
  });

  dom.btnApplyMetrology?.addEventListener('click', () => {
    const met = state.currentMetrology;
    if (!met) return;
    const sg = met.specificGravity ?? met.recommendedRingSg;
    const cw = met.cw ?? met.solidsPctCw;
    const p80 = met.p80 ?? met.targetP80Microns;
    if (sg !== undefined && dom.sliderSg) dom.sliderSg.value = String(Number(sg).toFixed(1));
    if (sg !== undefined && dom.ctrlSgInput) dom.ctrlSgInput.value = String(Number(sg).toFixed(1));
    if (cw !== undefined && dom.sliderSolids) dom.sliderSolids.value = String(Math.round(Number(cw)));
    if (cw !== undefined && dom.ctrlCwInput) dom.ctrlCwInput.value = String(Math.round(Number(cw)));
    if (p80 !== undefined && dom.sliderD80) dom.sliderD80.value = String(Math.round(Number(p80)));
    if (p80 !== undefined && dom.ctrlP80Input) dom.ctrlP80Input.value = String(Math.round(Number(p80)));
    const durandAcc = doc.getElementById('durand-accordion');
    if (durandAcc) durandAcc.open = true;
    actions.runSlurryCalculation?.();
    actions.updateDossier?.();
  });

  // 10. Foto flexómetro y exportación ERP / WhatsApp / Acuse
  const photoInput = doc.getElementById('wb-photo-input');
  const photoStatus = doc.getElementById('photo-status');
  if (photoInput && photoStatus) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      photoStatus.textContent = '...';
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = doc.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
            else { width = Math.round((width * maxDim) / height); height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            state.hasProcessedPhoto = true;
            const kb = blob ? Math.round(blob.size / 1024) : Math.round(file.size / 1024);
            photoStatus.textContent = isEs
              ? `Foto lista en memoria (${kb} KB) para cotejo 1:1`
              : `Photo ready in memory (${kb} KB) for 1:1 match`;
          }, 'image/jpeg', 0.7);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const dispatchLeadToBackend = (d, channelOrigin) => {
    if (!d) return;
    saveWorkbenchSession(d);
    const webhookPayload = buildLeadWebhookPayload(d, channelOrigin || 'web_quote_wizard');
    publishWorkbenchUpdate({ lastDispatch: channelOrigin, folio: webhookPayload.folio });
    const resolvedEndpoint = state.leadEndpointUrl || DEFAULT_SMAT_LEAD_WEBHOOK_URL;
    sendLeadToServer(d, channelOrigin || 'web_quote_wizard', resolvedEndpoint);
  };
  subscribeWorkbenchUpdate(() => { });

  const triggerCopyFeedback = (btn, successText) => {
    if (!btn) return;
    const span = btn.querySelector('span:not(.pill-icon)') || btn;
    const prevText = span.textContent;
    btn.classList.add('copy-btn-success');
    span.textContent = successText;
    setTimeout(() => {
      btn.classList.remove('copy-btn-success');
      span.textContent = prevText;
    }, 2200);
  };

  const btnCopyPlain = doc.getElementById('wb-copy-btn');
  btnCopyPlain?.addEventListener('click', () => {
    const d = actions.collectData?.();
    if (!d) return;
    dispatchLeadToBackend(d, 'sap_plaintext_copy');
    navigator.clipboard?.writeText(formatSapPlaintext(d))?.then(() => {
      triggerCopyFeedback(btnCopyPlain, isEs ? 'COPIADO AL PORTAPAPELES' : 'COPIED TO CLIPBOARD');
      const toast = doc.getElementById('wb-toast');
      if (toast) {
        toast.textContent = isEs ? 'Requisición en texto plano copiada.' : 'Plaintext requisition copied.';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
      }
    });
  });

  const btnCopyTsv = doc.getElementById('wb-copy-tsv-btn');
  btnCopyTsv?.addEventListener('click', () => {
    const d = actions.collectData?.();
    if (!d) return;
    dispatchLeadToBackend(d, 'sap_tsv_copy');
    navigator.clipboard?.writeText(formatSapTsv(d))?.then(() => {
      triggerCopyFeedback(btnCopyTsv, isEs ? 'TSV COPIADO PARA SAP / EXCEL' : 'TSV COPIED FOR SAP / EXCEL');
      const toast = doc.getElementById('wb-toast');
      if (toast) {
        toast.textContent = isEs ? 'Tabla TSV copiada para SAP o Excel.' : 'TSV table copied for SAP or Excel.';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
      }
    });
  });

  doc.getElementById('wb-pdf-btn')?.addEventListener('click', () => {
    const d = actions.collectData?.();
    if (!d || !win) return;
    dispatchLeadToBackend(d, 'pdf_acuse');
    const params = buildAcuseUrlParams(d);
    const isEnPage = win.location.pathname.startsWith('/en');
    win.location.href = isEnPage ? `/en/thank-you/?${params.toString()}` : `/acuse/?${params.toString()}`;
  });

  doc.getElementById('wb-email-btn')?.addEventListener('click', () => {
    const d = actions.collectData?.();
    if (!d || !win) return;
    dispatchLeadToBackend(d, 'mailto_rfc6068');
    const mailtoHref = formatMailtoUrl({ ...d, target_email: 'ventas@smatminerals.com' });
    win.location.href = mailtoHref.startsWith('mailto:') ? mailtoHref : `mailto:${mailtoHref}`;
  });

  doc.getElementById('wb-whatsapp-btn')?.addEventListener('click', () => {
    const d = actions.collectData?.();
    if (!d || !win) return;
    d.has_photo = Boolean(state.hasProcessedPhoto);
    dispatchLeadToBackend(d, 'whatsapp_durango');
    const waUrl = formatWhatsappUrl(d);
    const params = buildAcuseUrlParams(d);
    const isEnPage = win.location.pathname.startsWith('/en');
    const targetAcuse = isEnPage ? `/en/thank-you/?${params.toString()}` : `/acuse/?${params.toString()}`;
    win.open(waUrl, '_blank');
    setTimeout(() => { win.location.href = targetAcuse; }, 350);
  });

  // 11. Drawers móviles (sin innerHTML, clonado DOM seguro), modal cotejo, red y presets mineros
  const btnOpenDrawer = doc.getElementById('btn-open-drawer');
  const btnCloseDrawer = doc.getElementById('btn-close-drawer');
  const drawerOverlay = doc.getElementById('drawer-overlay');
  const drawerMount = doc.getElementById('drawer-dossier-mount');
  const mainDossierCard = doc.getElementById('main-dossier-card');
  if (btnOpenDrawer && drawerOverlay && drawerMount && mainDossierCard) {
    btnOpenDrawer.addEventListener('click', () => {
      drawerMount.replaceChildren(mainDossierCard.cloneNode(true));
      drawerOverlay.classList.remove('hidden');
      drawerOverlay.removeAttribute('hidden');
      drawerMount.querySelector('#wb-copy-btn')?.addEventListener('click', () => doc.getElementById('wb-copy-btn')?.click());
      drawerMount.querySelector('#wb-copy-tsv-btn')?.addEventListener('click', () => doc.getElementById('wb-copy-tsv-btn')?.click());
      drawerMount.querySelector('#wb-pdf-btn')?.addEventListener('click', () => doc.getElementById('wb-pdf-btn')?.click());
      drawerMount.querySelector('#wb-whatsapp-btn')?.addEventListener('click', () => doc.getElementById('wb-whatsapp-btn')?.click());
    });
    btnCloseDrawer?.addEventListener('click', () => drawerOverlay.classList.add('hidden'));
    drawerOverlay.addEventListener('click', (e) => { if (e.target === drawerOverlay) drawerOverlay.classList.add('hidden'); });
  }

  const btnCotejo = doc.getElementById('wb-cotejo-btn');
  const modalCotejo = doc.getElementById('quality-report-modal');
  if (btnCotejo && modalCotejo) {
    btnCotejo.addEventListener('click', () => { modalCotejo.classList.remove('hidden'); modalCotejo.removeAttribute('hidden'); });
    doc.getElementById('btn-close-cotejo')?.addEventListener('click', () => modalCotejo.classList.add('hidden'));
    doc.getElementById('btn-close-cotejo-2')?.addEventListener('click', () => modalCotejo.classList.add('hidden'));
    modalCotejo.addEventListener('click', (e) => { if (e.target === modalCotejo) modalCotejo.classList.add('hidden'); });
  }

  // Atajos teclado + pasos + dominio minero
  doc.getElementById('user-chip-reset')?.addEventListener('click', () => {
    try { localStorage.removeItem('smat_user_profile'); } catch (_e) { }
    [dom.inputName, dom.inputCompany, dom.inputPhone, dom.inputEmail, dom.inputDest, dom.inputClientRef].forEach((i) => { if (i) i.value = ''; });
    doc.getElementById('returning-user-chip')?.classList.add('hidden');
    actions.updateDossier?.();
  });

  dom.btnOpenStep2?.addEventListener('click', () => {
    const durandAcc = doc.getElementById('durand-accordion');
    if (durandAcc) { durandAcc.open = true; durandAcc.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  });
  dom.btnOpenStep3?.addEventListener('click', () => {
    if (dom.step3Accordion) {
      dom.step3Accordion.open = true;
      dom.step3Accordion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => dom.inputName?.focus(), 180);
    }
  });

  doc.getElementById('wb-ctrl-solve-mode')?.addEventListener('change', (e) => {
    state.ctrlSolveMode = e.target.value || 'cw';
    actions.runSlurryCalculation?.();
    actions.updateDossier?.();
  });
  doc.getElementById('btn-apply-ss-to-circuit')?.addEventListener('click', () => {
    if (dom.ctrlSgInput && dom.sliderSg) {
      dom.sliderSg.value = dom.ctrlSgInput.value;
      actions.runSlurryCalculation?.();
      actions.updateDossier?.();
    }
  });

  const miningGroups = state.miningGroups || [];
  const step1GroupSelect = doc.getElementById('wb-mining-group-select');
  const step1UnitSelect = doc.getElementById('wb-mining-unit-select');
  const step1PulpBadge = doc.getElementById('wb-step1-pulp-profile-badge');
  const filterStep1Units = (groupId) => {
    if (!step1UnitSelect) return;
    Array.from(step1UnitSelect.options).forEach((opt, idx) => {
      if (idx === 0) return;
      const optGrp = opt.getAttribute('data-group-id') || '';
      opt.hidden = Boolean(groupId && optGrp !== groupId);
    });
  };
  step1GroupSelect?.addEventListener('change', () => {
    const gId = step1GroupSelect.value;
    filterStep1Units(gId);
    if (!gId) {
      if (step1UnitSelect) step1UnitSelect.value = '';
      step1PulpBadge?.classList.add('hidden');
      return;
    }
    const grp = miningGroups.find((g) => g.id === gId);
    if (grp?.units?.length) {
      if (step1UnitSelect) step1UnitSelect.value = `${grp.id}::${grp.units[0].name}`;
      applyMiningUnitPresetToDom(doc, dom, state, grp, grp.units[0], actions);
    }
  });
  step1UnitSelect?.addEventListener('change', () => {
    const val = step1UnitSelect.value || '';
    if (!val.includes('::')) { step1PulpBadge?.classList.add('hidden'); return; }
    const [gId, ...rest] = val.split('::');
    const uName = rest.join('::');
    const grp = miningGroups.find((g) => g.id === gId);
    const unit = grp?.units?.find((u) => u.name === uName);
    if (grp && unit) applyMiningUnitPresetToDom(doc, dom, state, grp, unit, actions);
  });
  doc.getElementById('btn-apply-mining-preset')?.addEventListener('click', () => {
    const gId = step1GroupSelect?.value || 'fresnillo-plc';
    const grp = miningGroups.find((g) => g.id === gId) || miningGroups[0];
    if (grp?.units?.length) applyMiningUnitPresetToDom(doc, dom, state, grp, grp.units[0], actions);
  });
  dom.inputEmail?.addEventListener('input', () => detectAndBindMiningDomain(doc, dom, state, miningGroups, actions));

  if (win) {
    win.addEventListener('keydown', (e) => {
      const targetTag = e.target?.tagName?.toLowerCase() || '';
      const isInput = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        doc.getElementById('wb-code-decoder-input')?.focus();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        btnCopyTsv?.click();
        return;
      }
      if (e.key === 'Escape') {
        drawerOverlay?.classList.add('hidden');
        modalCotejo?.classList.add('hidden');
        return;
      }
      if (isInput) return;
      if (e.key === '1') doc.querySelector('.preset-chip[data-preset="sag_primary"]')?.click();
      else if (e.key === '2') doc.querySelector('.preset-chip[data-preset="flotation_rougher"]')?.click();
      else if (e.key === '3') doc.querySelector('.preset-chip[data-preset="tailings_thickened"]')?.click();
    });

    const offlinePill = doc.getElementById('offline-network-pill');
    const updateNet = () => {
      if (!offlinePill) return;
      if (!navigator.onLine) { offlinePill.classList.remove('hidden'); offlinePill.removeAttribute('hidden'); }
      else offlinePill.classList.add('hidden');
    };
    win.addEventListener('online', updateNet);
    win.addEventListener('offline', updateNet);
    updateNet();

    win.addEventListener('smat:workbench_update', (evt) => actions.handleWorkbenchUpdateEvent?.(evt));
    win.addEventListener('smat:mission', (evt) => actions.handleMissionEvent?.(evt));
    win.addEventListener('hashchange', () => actions.checkUrlContext?.());
  }

  doc.addEventListener('click', (e) => {
    const anchor = e.target?.closest?.('a[href*="#rfq"]');
    if (!anchor || !win) return;
    try {
      const targetUrl = new URL(anchor.getAttribute('href') || '', win.location.origin);
      if (targetUrl.pathname === win.location.pathname) {
        e.preventDefault();
        win.history.pushState(null, '', targetUrl.search + targetUrl.hash);
        actions.checkUrlContext?.();
        doc.getElementById('rfq')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (_err) { }
  });

  bindWizardCircuitCalculators(dom.container, () => actions.updateDossier?.());
  bindVendorPassportDownloadButtons(doc);
  initCoreTradeInWidgets(doc, () => actions.updateDossier?.());

  return { defaultCriteriaMap: DEFAULT_CLASSIFICATION_CRITERIA_MAP };
}
