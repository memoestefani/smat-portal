// @ts-check
/**
 * wizardEventBindings.js
 * ---------------------------------------------------------------------------
 * Enlaces DOM de Checkout B2B, FastLane BOM Parser y Memos Trans-Ruta (`SLICE-V56-02`).
 */

import { parseBomPasteInput } from './bomPasteParser.js';
import { buildBomPasteViewModel } from './instrumentViewModels.js';
import {
  MINING_GROUPS_CATALOG,
  QUICK_CHECKOUT_SKU_LIST,
  findMiningGroupById,
  findMiningUnitByName,
} from './wizardCatalogData.js';
import {
  decodeSmatCode,
  matchMiningGroupByEmailDomain,
  renderMiningPresetTelemetry,
  resolveMiningUnitPulpPreset,
} from './wizardMiningAndCodeDecoder.js';
import { addTrayItem, buildCmuPrioritySubjectLine, getTrayState } from './requisitionTrayBus.js';
import {
  buildShareableRfqUrl,
  clearRfqSession,
  hydrateRfqSessionFromUrl,
  isFieldUserDirty,
  loadRfqSession,
  markFieldUserDirty,
  removeSessionItem,
  saveRfqSession,
  subscribeRfqSession,
  upsertSessionItem,
} from './rfqSessionStore.js';
import { RFQ_SHARE_MAX_CHARS } from './rfqShareCodec.js';
import { bindDomainSchemaRoot } from './schemaRuntimeBinder.js';
import {
  buildAcuseUrlParams,
  buildCanonicalEngineeringSnapshot,
  formatMailtoUrl,
  formatSapPlaintext,
  formatSapTsv,
  formatWhatsappUrl,
  normalizeCircuitSerie,
  normalizeMaterialKey,
} from './workbenchBus.js';
import { flashInk, projectAttachedStationSnapshots, switchDossierTabView } from './wizardDossierProjector.js';

/**
 * Recolecta referencias DOM exclusivas del Checkout /cotizar/.
 * @param {Document} doc
 * @returns {Record<string, any>}
 */
export function collectWizardDomRefs(doc) {
  if (!doc) return {};
  const byId = (id) => doc.getElementById(id);
  return {
    container: byId('rfq'),
    btnOpex: byId('btn-intent-opex'),
    btnCapex: byId('btn-intent-capex'),
    inputDetails: byId('wb-details'),
    inputClientRef: byId('wb-client-ref'),
    inputName: byId('wb-name'),
    inputCompany: byId('wb-company'),
    inputPhone: byId('wb-phone'),
    inputEmail: byId('wb-email'),
    inputDest: byId('wb-destination'),
    erpQuantity: byId('wb-erp-quantity'),
    erpDestination: byId('wb-erp-destination'),
    jrpWearInput: byId('wb-jrp-wear-hours'),
    jrpDailyInput: byId('wb-jrp-daily-hours'),
    jrpCriticality: byId('wb-jrp-criticality'),
    coreTradeInToggle: byId('wb-core-tradein-toggle'),
    selectMiningGroup: byId('wb-mining-group-select'),
    selectMiningUnit: byId('wb-mining-unit-select'),
    pulpProfileBadge: byId('wb-step1-pulp-profile-badge'),
    miningTelemetryBox: byId('wb-mining-preset-telemetry'),
    bomInput: byId('fastlane-bom-input'),
    bomApplyBtn: byId('fastlane-bom-apply-btn'),
    bomFeedback: byId('fastlane-bom-feedback'),
    btnShareLink: byId('btn-share-purchasing-link'),
    btnShareDossier: byId('btn-share-purchasing-link-dossier'),
    shareFeedback: byId('share-purchasing-feedback'),
    tabBtnMaint: byId('tab-btn-maint'),
    tabBtnSap: byId('tab-btn-sap'),
    paneMaint: byId('pane-maint'),
    paneSap: byId('pane-sap'),
    sapJustificationText: byId('sap-justification-text'),
    liveFolio: byId('live-folio'),
    liveSmatCode: byId('live-smat-code'),
    livePriorityTag: byId('live-priority-tag'),
    liveClientRefBox: byId('live-client-ref-box'),
    liveClientRefText: byId('live-client-ref-text'),
    wbToast: byId('wb-toast'),
    drawerOverlay: byId('drawer-overlay'),
    drawerMount: byId('drawer-dossier-mount'),
    qualityModal: byId('quality-report-modal'),
  };
}

/**
 * @param {any} doc
 * @param {Record<string, any>} dom
 * @param {any} groupObj
 * @param {string} [selectedUnit='']
 * @param {boolean} [isEs=true]
 */
function hydrateMiningUnitsDropdown(doc, dom, groupObj, selectedUnit = '', isEs = true) {
  if (!doc || !dom.selectMiningUnit) return;
  const placeholder = doc.createElement('option');
  placeholder.value = '';
  placeholder.textContent = isEs ? '— Seleccionar unidad o distrito —' : '— Select site or district —';
  const options = [placeholder];
  for (const unit of groupObj?.units || []) {
    const opt = doc.createElement('option');
    opt.value = unit.name;
    opt.textContent = `${unit.name} (${unit.state || 'MX'} • ${unit.altitudeM || 1900} m)`;
    options.push(opt);
  }
  dom.selectMiningUnit.replaceChildren(...options);
  if (selectedUnit) dom.selectMiningUnit.value = selectedUnit;
}

/**
 * @param {any} doc
 * @param {Record<string, any>} dom
 * @param {any} session
 * @param {boolean} isEs
 */
function hydrateCheckoutDomFromSession(doc, dom, session, isEs) {
  if (!session) return;
  const contact = { ...(session.plantContext || {}), ...(session.contact || {}) };
  /** @type {Array<[string, any]>} */
  const map = [
    ['name', dom.inputName],
    ['company', dom.inputCompany],
    ['phone', dom.inputPhone],
    ['email', dom.inputEmail],
    ['clientRef', dom.inputClientRef],
    ['details', dom.inputDetails],
  ];
  for (const [key, el] of map) {
    if (el && contact[key] && (!el.value || !isFieldUserDirty(key, session))) {
      el.value = contact[key];
    }
  }
  if (dom.erpDestination && contact.destination && !isFieldUserDirty('destination', session)) {
    dom.erpDestination.value = contact.destination;
  }
  const grpId = session.plantContext?.miningGroupId;
  if (dom.selectMiningGroup && grpId) {
    dom.selectMiningGroup.value = grpId;
    const grpObj = findMiningGroupById(grpId);
    hydrateMiningUnitsDropdown(doc, dom, grpObj, session.plantContext?.miningUnitName || '', isEs);
  }
}

/**
 * @param {Record<string, any>} dom
 * @param {string} msg
 */
function showToastFeedback(dom, msg) {
  if (!dom.wbToast) return;
  dom.wbToast.textContent = msg;
  dom.wbToast.classList.remove('hidden');
  setTimeout(() => dom.wbToast?.classList.add('hidden'), 2600);
}

/**
 * @param {any} win
 * @param {string} text
 */
function copyTextSafe(win, text) {
  try {
    win?.navigator?.clipboard?.writeText?.(text);
  } catch {
    /* headless / clipboard denied */
  }
}

/**
 * Conecta todos los listeners del flujo Task-First de Checkout B2B.
 * @param {Record<string, any>} ctx
 */
export function bindAllWizardEventListeners(ctx = {}) {
  const { doc, win, dom = {}, state = {}, actions = {} } = ctx;
  if (!doc) return;
  const isEs = Boolean(state.isEs);

  if (win?.location?.search) hydrateRfqSessionFromUrl(win.location.search);
  hydrateCheckoutDomFromSession(doc, dom, loadRfqSession(), isEs);

  bindDomainSchemaRoot(doc, ['jrp', 'erpExport'], () => actions.updateDossier?.());

  const persistContact = (dirtyKey = '') => {
    if (dirtyKey) markFieldUserDirty(dirtyKey);
    const current = /** @type {Record<string, any>} */ (loadRfqSession());
    const contactPatch = {
      name: dom.inputName?.value.trim() || '',
      company: dom.inputCompany?.value.trim() || '',
      phone: dom.inputPhone?.value.trim() || '',
      email: dom.inputEmail?.value.trim() || '',
      destination: dom.erpDestination?.value.trim() || '',
      clientRef: dom.inputClientRef?.value.trim() || '',
      details: dom.inputDetails?.value.trim() || '',
    };
    saveRfqSession({
      ...current,
      plantContext: {
        ...(current.plantContext || {}),
        ...contactPatch,
      },
      contact: contactPatch,
    });
    actions.updateDossier?.();
  };

  /** @type {Array<[string, any]>} */
  ([
    ['name', dom.inputName],
    ['company', dom.inputCompany],
    ['phone', dom.inputPhone],
    ['email', dom.inputEmail],
    ['destination', dom.erpDestination],
    ['clientRef', dom.inputClientRef],
    ['details', dom.inputDetails],
  ]).forEach(([key, el]) => {
    el?.addEventListener('input', () => persistContact(key));
  });

  dom.inputDest?.addEventListener('change', () => persistContact('logisticsMode'));
  dom.erpQuantity?.addEventListener('input', () => actions.updateDossier?.());

  dom.inputEmail?.addEventListener('blur', () => {
    const email = dom.inputEmail?.value.trim() || '';
    const match = /** @type {Record<string, any> | null} */ (matchMiningGroupByEmailDomain(email, MINING_GROUPS_CATALOG));
    if (match?.id && dom.selectMiningGroup && !dom.selectMiningGroup.value) {
      dom.selectMiningGroup.value = match.id;
      hydrateMiningUnitsDropdown(doc, dom, match, '', isEs);
      const current = /** @type {Record<string, any>} */ (loadRfqSession());
      saveRfqSession({
        ...current,
        plantContext: {
          ...(current.plantContext || {}),
          miningGroupId: match.id,
          company: (!isFieldUserDirty('company') && match.name) ? match.name : (current.plantContext?.company || ''),
        },
      });
      if (match.name && dom.inputCompany && !isFieldUserDirty('company')) {
        dom.inputCompany.value = match.name;
      }
      actions.updateDossier?.();
    }
  });

  const setIntent = (isOpex) => {
    state.isOpex = Boolean(isOpex);
    dom.btnOpex?.classList.toggle('selected', state.isOpex);
    dom.btnCapex?.classList.toggle('selected', !state.isOpex);
    actions.updateDossier?.();
  };
  dom.btnOpex?.addEventListener('click', () => setIntent(true));
  dom.btnCapex?.addEventListener('click', () => setIntent(false));

  dom.selectMiningGroup?.addEventListener('change', () => {
    const grp = /** @type {Record<string, any> | null} */ (findMiningGroupById(dom.selectMiningGroup.value));
    hydrateMiningUnitsDropdown(doc, dom, grp, '', isEs);
    if (grp?.name && dom.inputCompany && !isFieldUserDirty('company')) {
      dom.inputCompany.value = grp.name;
    }
    const current = /** @type {Record<string, any>} */ (loadRfqSession());
    saveRfqSession({
      ...current,
      plantContext: {
        ...(current.plantContext || {}),
        miningGroupId: grp?.id || '',
        miningUnitName: '',
      },
    });
    actions.updateDossier?.();
  });

  dom.selectMiningUnit?.addEventListener('change', () => {
    const grp = /** @type {Record<string, any> | null} */ (findMiningGroupById(dom.selectMiningGroup?.value || ''));
    const unit = /** @type {Record<string, any> | null} */ (findMiningUnitByName(grp?.id || '', dom.selectMiningUnit.value));
    if (!unit) return;
    const preset = /** @type {Record<string, any> | null} */ (resolveMiningUnitPulpPreset(grp, unit, unit.altitudeM || 2200));
    if (dom.pulpProfileBadge && preset?.summaryEs) {
      dom.pulpProfileBadge.textContent = isEs ? preset.summaryEs : (preset.summaryEn || preset.summaryEs);
      dom.pulpProfileBadge.classList.remove('hidden');
    }
    if (dom.miningTelemetryBox) renderMiningPresetTelemetry(dom.miningTelemetryBox, preset, isEs ? 'es' : 'en');
    const current = /** @type {Record<string, any>} */ (loadRfqSession());
    saveRfqSession({
      ...current,
      plantContext: {
        ...(current.plantContext || {}),
        miningGroupId: grp?.id || '',
        miningUnitName: unit.name,
        altitudeM: unit.altitudeM || 2200,
      },
    });
    actions.updateDossier?.();
  });

  const updateFastLaneBomSummary = () => {
    const sumBox = dom.doc?.getElementById?.('fastlane-bom-summary');
    if (!sumBox) return;
    const rawNow = String(dom.bomInput?.value || '').trim();
    if (!rawNow) {
      sumBox.textContent = '';
      if (sumBox.dataset) {
        sumBox.dataset.matchedCount = '0';
        sumBox.dataset.unmatchedCount = '0';
      }
      sumBox.classList?.add('hidden');
      return;
    }
    const vm = buildBomPasteViewModel(parseBomPasteInput(rawNow), isEs ? 'es' : 'en');
    sumBox.textContent = vm.badgeText;
    if (sumBox.dataset) {
      sumBox.dataset.matchedCount = String(vm.matchedCount);
      sumBox.dataset.unmatchedCount = String(vm.unmatchedCount);
    }
    sumBox.classList?.remove('hidden');
  };

  dom.bomInput?.addEventListener('input', updateFastLaneBomSummary);
  updateFastLaneBomSummary();

  dom.bomApplyBtn?.addEventListener('click', () => {
    const raw = String(dom.bomInput?.value || '').trim();
    if (raw.toUpperCase() === 'CLEAR') {
      clearRfqSession();
      removeSessionItem('');
      updateFastLaneBomSummary();
      actions.updateDossier?.();
      return;
    }
    const parsed = parseBomPasteInput(raw);
    const bomVm = buildBomPasteViewModel(parsed, isEs ? 'es' : 'en');
    const sumBox = dom.doc?.getElementById?.('fastlane-bom-summary');
    if (sumBox) {
      sumBox.textContent = bomVm.badgeText;
      if (sumBox.dataset) {
        sumBox.dataset.matchedCount = String(bomVm.matchedCount);
        sumBox.dataset.unmatchedCount = String(bomVm.unmatchedCount);
      }
      sumBox.classList?.remove('hidden');
    }
    let addedCount = 0;
    for (const row of parsed.matched || []) {
      const cat = /** @type {Record<string, any> | null} */ (
        QUICK_CHECKOUT_SKU_LIST.find((s) => s.id === row.skuId) ||
        decodeSmatCode(row.skuId, isEs ? 'es' : 'en')
      );
      const nameEs = row.nameEs || cat?.title_es || cat?.role || row.skuId;
      const nameEn = row.nameEn || cat?.title_en || cat?.role || row.skuId;
      const circuit = row.circuit || cat?.vertical || cat?.circuit || 'bombeo';
      addTrayItem({
        id: row.skuId,
        qty: row.qty,
        nameEs,
        nameEn,
        circuit,
      });
      upsertSessionItem({
        id: row.skuId,
        skuId: row.skuId,
        atomicCode: row.atomicCode || row.skuId,
        qty: row.qty,
        nameEs,
        nameEn,
        circuit,
      });
      addedCount += 1;
    }
    if (addedCount === 0 && raw) {
      const decodedSingle = decodeSmatCode(raw, isEs ? 'es' : 'en');
      if (decodedSingle) {
        const singleId = String(decodedSingle.code || raw).toUpperCase();
        addTrayItem({
          id: singleId,
          qty: 1,
          nameEs: decodedSingle.atomic_label || decodedSingle.role || singleId,
          nameEn: decodedSingle.atomic_label || decodedSingle.role || singleId,
          circuit: decodedSingle.circuit || 'bombeo',
        });
        upsertSessionItem({
          id: singleId,
          skuId: singleId,
          atomicCode: decodedSingle.atomic_code || singleId,
          qty: 1,
          circuit: decodedSingle.circuit || 'bombeo',
        });
        addedCount = 1;
      }
    }
    if (dom.bomFeedback) {
      const missCount = parsed.unmatched?.length || 0;
      dom.bomFeedback.textContent = isEs
        ? `${addedCount} partida(s) agregadas${missCount ? ` · ${missCount} referencia(s) como nota` : ''}.`
        : `${addedCount} line(s) added${missCount ? ` · ${missCount} note ref(s)` : ''}.`;
      dom.bomFeedback.classList.remove('hidden');
    }
    flashInk(dom.liveSmatCode);
    actions.updateDossier?.();
  });

  const setWizardStep = (stepNum) => {
    const cleanStep = ['1', '2', '3'].includes(String(stepNum)) ? String(stepNum) : '1';
    doc.querySelectorAll('[data-qw-step-tab]').forEach((tab) => {
      const on = tab.getAttribute('data-qw-step-tab') === cleanStep;
      tab.classList?.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    doc.querySelectorAll('[data-qw-step-section]').forEach((panel) => {
      const on = panel.getAttribute('data-qw-step-section') === cleanStep;
      panel.classList?.toggle('hidden', !on);
      if (on) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  };
  doc.querySelectorAll?.('[data-qw-step-tab]').forEach((btn) => {
    btn.addEventListener('click', () => setWizardStep(btn.getAttribute('data-qw-step-tab')));
  });
  doc.querySelectorAll?.('[data-qw-next-step], [data-qw-prev-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-qw-next-step') || btn.getAttribute('data-qw-prev-step');
      if (next) setWizardStep(next);
    });
  });

  dom.jrpDailyInput?.addEventListener('input', () => actions.updateDossier?.());

  const handleShareClick = () => {
    const url = buildShareableRfqUrl({
      origin: win?.location?.origin || 'https://www.smatminerals.com',
      lang: isEs ? 'es' : 'en',
    });
    copyTextSafe(win, url);
    if (dom.shareFeedback) {
      dom.shareFeedback.textContent = isEs
        ? `Enlace de requisición copiado (${Math.min(url.length, RFQ_SHARE_MAX_CHARS)} chars).`
        : `Purchasing requisition link copied (${Math.min(url.length, RFQ_SHARE_MAX_CHARS)} chars).`;
      dom.shareFeedback.classList.remove('hidden');
    }
    showToastFeedback(dom, isEs ? 'Enlace para Compras copiado.' : 'Purchasing link copied.');
  };
  dom.btnShareLink?.addEventListener('click', handleShareClick);
  dom.btnShareDossier?.addEventListener('click', handleShareClick);

  dom.tabBtnMaint?.addEventListener('click', () => switchDossierTabView('maint', dom));
  dom.tabBtnSap?.addEventListener('click', () => switchDossierTabView('sap', dom));

  const buildCurrentSnap = () => buildCanonicalEngineeringSnapshot({
    folio: dom.liveFolio?.textContent?.trim() || 'SMAT-2026-8810',
    smat_code: dom.liveSmatCode?.textContent?.trim() || 'SMAT-PUMP-6X4-WETKIT',
    contact_name: dom.inputName?.value.trim() || '',
    company_name: dom.inputCompany?.value.trim() || '',
    phone_number: dom.inputPhone?.value.trim() || '',
    email_address: dom.inputEmail?.value.trim() || '',
    delivery_destination: dom.erpDestination?.value.trim() || 'Durango',
    placa_ref: dom.inputClientRef?.value.trim() || '',
    quantity: Number(dom.erpQuantity?.value || 1),
    logistics_mode: dom.inputDest?.value || 'retiro_durango',
  });

  doc.getElementById('wb-copy-btn')?.addEventListener('click', () => {
    copyTextSafe(win, formatSapPlaintext(buildCurrentSnap()));
    showToastFeedback(dom, isEs ? 'Especificación ERP/SAP copiada.' : 'ERP/SAP spec copied.');
  });
  const handleCopyTsv = () => {
    copyTextSafe(win, formatSapTsv(buildCurrentSnap()));
    showToastFeedback(dom, isEs ? 'Tabla TSV para SAP/Excel copiada.' : 'SAP/Excel TSV table copied.');
  };
  doc.getElementById('wb-copy-tsv-btn')?.addEventListener('click', handleCopyTsv);
  doc.getElementById('wb-step3-tsv-btn')?.addEventListener('click', handleCopyTsv);
  doc.getElementById('wb-whatsapp-btn')?.addEventListener('click', () => {
    const subj = buildCmuPrioritySubjectLine(getTrayState(), { cvPct: 45 });
    const url = formatWhatsappUrl({ ...buildCurrentSnap(), subject_prefix: subj });
    win?.open?.(url, '_blank', 'noopener,noreferrer');
  });
  doc.getElementById('wb-email-btn')?.addEventListener('click', () => {
    const url = formatMailtoUrl(buildCurrentSnap());
    if (win?.location) win.location.href = url;
  });
  doc.getElementById('wb-pdf-btn')?.addEventListener('click', () => {
    const params = buildAcuseUrlParams(buildCurrentSnap());
    const target = isEs ? `/acuse/${params}` : `/en/thank-you/${params}`;
    if (win?.location) win.location.href = target;
  });
  doc.getElementById('btn-copy-justification')?.addEventListener('click', () => {
    copyTextSafe(win, dom.sapJustificationText?.textContent || '');
    showToastFeedback(dom, isEs ? 'Justificación copiada.' : 'Justification copied.');
  });

  doc.getElementById('wb-cotejo-btn')?.addEventListener('click', () => {
    dom.qualityModal?.classList.remove('hidden');
    dom.qualityModal?.removeAttribute('hidden');
  });
  [doc.getElementById('btn-close-cotejo'), doc.getElementById('btn-close-cotejo-2')].forEach((b) => {
    b?.addEventListener('click', () => {
      dom.qualityModal?.classList.add('hidden');
      dom.qualityModal?.setAttribute('hidden', '');
    });
  });
  doc.getElementById('btn-open-drawer')?.addEventListener('click', () => {
    dom.drawerOverlay?.classList.remove('hidden');
    dom.drawerOverlay?.removeAttribute('hidden');
  });
  doc.getElementById('btn-close-drawer')?.addEventListener('click', () => {
    dom.drawerOverlay?.classList.add('hidden');
    dom.drawerOverlay?.setAttribute('hidden', '');
  });

  subscribeRfqSession((sess) => {
    projectAttachedStationSnapshots(doc, sess, isEs);
    actions.updateDossier?.();
  });
  if (state.urlCtx?.material) state.normalizedMat = normalizeMaterialKey(state.urlCtx.material);
  if (state.urlCtx?.serie) normalizeCircuitSerie(state.currentCircuit || 'bombeo', state.urlCtx.serie);
}
