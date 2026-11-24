// @ts-nocheck
/**
 * wizardDossierProjector.js
 * ---------------------------------------------------------------------------
 * Proyector Puro del Dossier de Ingeniería en Vivo y Checkout B2B (`SLICE-V55-12`).
 * Opera únicamente sobre dominios de checkout (`jrp`, `erpExport`) y snapshots
 * guardados de estaciones sin cálculos inline acoplados ni `innerHTML`.
 */

import { projectDomainOutputs, verifyVplDomScopeContainment } from './schemaRuntimeBinder.js';
import {
  buildRolesCriteriaMap,
  formatCatalogPartCodeHuman,
  formatDischargeRegimeHuman,
} from './i18nDomainLabels.js';
import { computeSobolFirstOrderIndices } from './wizardXdsmDagSolver.js';
import {
  DEFAULT_CLASSIFICATION_CRITERIA_MAP,
  DOSSIER_FORMATTERS_BY_FIELD,
  formatDossierCircuitPhysicsRow,
  formatDossierMetrologyBadge,
  formatDossierSimulationBanner,
} from './quoteDossierRenderer.js';
import { FORMATTERS_BY_FIELD, buildSmatCode, projectWorkbenchToDOM } from './wizardMiningAndCodeDecoder.js';
import { computeWizardViewState } from './quoteWizardController.js';
import { buildSapAnexo22ComplianceSummary } from './vendorPassportAndTradeInController.js';
import {
  calculateCoupledReorderWindowDays,
  computeCmuPriorityDescriptor,
  getTrayState,
} from './requisitionTrayBus.js';
import { loadEngineeringContextSnapshot, loadRfqSession } from './rfqSessionStore.js';
import { resolveUrlContextDescriptor } from './wizardUrlAndPresetRouter.js';
import { QUICK_CHECKOUT_SKU_LIST, findMiningGroupById } from './wizardCatalogData.js';
import { buildCanonicalEngineeringSnapshot } from './workbenchBus.js';
import { calculateSlurryMetrics, validatePlantLeadInput } from './slurryEngine.js';

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
 * Renderiza memorias técnicas adjuntas desde estaciones verticales vía DOM seguro.
 * @param {Document} doc
 * @param {Record<string, any>} session
 * @param {boolean} isEs
 */
export function projectAttachedStationSnapshots(doc, session = {}, isEs = true) {
  if (!doc) return 0;
  const card = doc.getElementById('attached-station-snapshots');
  const listEl = doc.getElementById('attached-station-snapshots-list');
  if (!card || !listEl) return 0;

  const entries = Object.entries(session?.stationSnapshots || {}).filter(
    ([, snap]) => snap && typeof snap === 'object' && Object.keys(snap).length > 0
  );
  if (entries.length === 0) {
    card.classList.add('hidden');
    listEl.replaceChildren();
    return 0;
  }

  const labelByKey = {
    pumping: isEs ? 'Bombeo Hidráulico' : 'Hydraulic Pumping',
    sealDrive: isEs ? 'Sellado y Transmisión' : 'Seal & Drive',
    cycloneScreen: isEs ? 'Clasificación y Cribas' : 'Cyclones & Screens',
    flotation: isEs ? 'Flotación Celda' : 'Flotation Cell',
    filtration: isEs ? 'Filtración Prensa' : 'Filter Press',
    metrology: isEs ? 'Control / Laboratorio' : 'Process Control / Lab',
  };

  const nodes = entries.map(([key, snap]) => {
    const li = doc.createElement('li');
    const regimeTag = key === 'cycloneScreen' && snap.dischargeRegime
      ? ` (${formatDischargeRegimeHuman(snap.dischargeRegime, isEs ? 'es' : 'en')})`
      : '';
    const summary = isEs
      ? (snap.summaryEs || snap.summary || JSON.stringify(snap).slice(0, 120))
      : (snap.summaryEn || snap.summary || JSON.stringify(snap).slice(0, 120));
    li.textContent = `${labelByKey[key] || key}: ${summary}${regimeTag}`;
    return li;
  });
  listEl.replaceChildren(...nodes);
  card.classList.remove('hidden');
  return entries.length;
}

/**
 * Proyecta el resumen ejecutivo B2B en el Dossier Vivo sobre `jrp` y `erpExport`.
 * @param {Record<string, any>} ctx
 * @returns {Record<string, any>}
 */
export function projectLiveDossierSummary(ctx = {}) {
  const doc = ctx.doc || (typeof document !== 'undefined' ? document : null);
  const dom = ctx.dom || {};
  const state = ctx.state || {};
  const isEs = Boolean(state.isEs);
  const isOpex = Boolean(state.isOpex);
  const container = dom.container || doc;
  const setText = (id, txt) => {
    const el = doc?.getElementById?.(id);
    if (el && txt !== undefined && txt !== null) el.textContent = String(txt);
  };

  if (!doc) return state;

  const session = loadRfqSession();
  const trayStateNow = getTrayState();
  const engCtx = loadEngineeringContextSnapshot();
  const urlDesc = resolveUrlContextDescriptor(state.urlCtx || {});
  const viewState = computeWizardViewState({ circuit: state.currentCircuit }, state.urlCtx || {});
  const primaryTray = trayStateNow.items?.[0] || null;
  const matchedCatalog = QUICK_CHECKOUT_SKU_LIST.find((s) => s.id === primaryTray?.id);
  const smatCode =
    primaryTray?.id ||
    matchedCatalog?.id ||
    viewState.smatCode ||
    buildSmatCode(state.currentCircuit || 'bombeo', urlDesc.canonicalRole || 'kit_wet_end', '6x4', 'A05');

  const nameVal = dom.inputName?.value.trim() || session.contact?.name || (isEs ? 'Ing. Residente / Solicitante' : 'Lead Process Engineer');
  const miningGrp = findMiningGroupById(dom.selectMiningGroup?.value || session.plantContext?.miningGroupId || '');
  const compVal = dom.inputCompany?.value.trim() || session.contact?.company || miningGrp?.name || (isEs ? 'Unidad Minera / Compañía' : 'Mining Operation / Company');
  const phoneVal = dom.inputPhone?.value.trim() || session.contact?.phone || '(618) 810-4408';
  const emailVal = dom.inputEmail?.value.trim() || session.contact?.email || (isEs ? 'contacto@minera.com' : 'contact@miningco.com');
  const destVal = dom.inputDest?.value.trim() || dom.erpDestination?.value.trim() || session.contact?.destination || (isEs ? 'Retiro en Almacén Central Durango' : 'Durango Central Warehouse Pickup');
  const clientRefVal = dom.inputClientRef?.value.trim() || session.contact?.clientRef || '';
  const detailsText = dom.inputDetails?.value.trim() || session.contact?.details || (isEs ? 'Verificación dimensional de acople 1:1 en Almacén Central Durango.' : '1:1 dimensional check at Durango Central Warehouse.');

  setText('live-requester', nameVal);
  setText('live-company', compVal);
  setText('live-contact', `${phoneVal} • ${emailVal}`);
  setText('live-destination', destVal);
  setText('live-smat-code', smatCode);
  setText('sap-live-code', smatCode);
  setText('sap-live-dest', destVal);

  const partLabel = primaryTray
    ? `${isEs ? primaryTray.nameEs : primaryTray.nameEn} (×${primaryTray.qty})`
    : formatCatalogPartCodeHuman(smatCode, isEs ? 'es' : 'en');
  setText('live-part-name', partLabel);
  setText('live-part-details', detailsText);
  setText('sap-live-part', partLabel);

  if (dom.liveClientRefBox) dom.liveClientRefBox.classList.toggle('hidden', !clientRefVal);
  if (dom.liveClientRefText) dom.liveClientRefText.textContent = clientRefVal;

  const criteriaMap = buildRolesCriteriaMap({ verticals: [] });
  const fallbackCriteria =
    criteriaMap[urlDesc.canonicalRole]?.[isEs ? 'rule_es' : 'rule_en'] ||
    DEFAULT_CLASSIFICATION_CRITERIA_MAP[urlDesc.canonicalRole] ||
    (isEs
      ? 'Intercambiabilidad dimensional 1:1 • Dureza >600 HB • Disponibilidad en Almacén Durango'
      : '1:1 dimensional fit • Hardness >600 HB • Durango Warehouse availability');
  setText('live-role-criteria', fallbackCriteria);

  const cmuNow = computeCmuPriorityDescriptor({
    urgency: isOpex ? 'paro_de_linea' : 'programado',
    criticalityMode: dom.jrpCriticality?.value || (isOpex ? 'PARO_DE_LINEA' : 'STOCK_SS'),
    items: trayStateNow.items || [],
    estimatedTotalMxn: isOpex ? 18500 : 85000,
    stockRegime: isOpex ? 'hay' : 'se_fabrica',
  });

  if (dom.livePriorityTag) {
    dom.livePriorityTag.textContent = isEs
      ? (cmuNow.priorityLabelEs || 'Prioridad Operativa • Paro de Planta')
      : (cmuNow.priorityLabelEn || 'Operational Priority • Plant Shutdown');
    dom.livePriorityTag.classList?.toggle('is-priority-opex', isOpex);
    dom.livePriorityTag.classList?.toggle('is-priority-capex', !isOpex);
  }
  const laneLabel = isEs ? (cmuNow.checkoutLaneLabelEs || 'Despacho Programado') : (cmuNow.checkoutLaneLabelEn || 'Scheduled Dispatch');
  setText('live-budget-category-pill', `${isEs ? 'Carril' : 'Lane'}: ${laneLabel}`);

  const jrpHours = Number(dom.jrpWearInput?.value || 2400);
  const jrpDaily = Number(dom.jrpDailyInput?.value || 24);
  const jrpCrit = dom.jrpCriticality?.value || (isOpex ? 'PARO_DE_LINEA' : 'STOCK_SS');
  const jrpEval = calculateCoupledReorderWindowDays(jrpHours, jrpDaily, jrpCrit, trayStateNow.items || []);

  const flowVal = Number(engCtx?.flowM3H || 180);
  const cwVal = Number(engCtx?.solidsWeightPercent || 45);
  const d80Val = Number(engCtx?.particleSizeD80Microns || 180);
  const altVal = Number(session.plantContext?.altitudeM || engCtx?.altitudeM || 2200);
  const hm = calculateSlurryMetrics(flowVal, cwVal, d80Val, 1.4, '6x4', altVal, 7.0);
  const gateOut = validatePlantLeadInput({
    flowM3H: flowVal,
    solidsWeightPercent: cwVal,
    particleSizeD80Microns: d80Val,
    pulpPh: 7.0,
    altitudeM: altVal,
    tempC: 25,
    lang: isEs ? 'es' : 'en',
  });
  setText('gate-lead-status', isEs ? gateOut.badgeLabelEs : gateOut.badgeLabelEn);

  const banner = formatDossierSimulationBanner(state.currentCircuit || 'bombeo', isEs, urlDesc.canonicalRole);
  const physRow = formatDossierCircuitPhysicsRow(state.currentCircuit || 'bombeo', engCtx, { clientReorderWindowDays: jrpEval.reorderWindowDays }, isEs);
  setText('live-table-circuit-physics-label', physRow.label);
  setText('live-table-circuit-physics-val', `${banner.contextPill} • ${physRow.value}`);

  const metSnap = session.stationSnapshots?.metrology || engCtx?.metrology;
  if (metSnap) {
    const elRow = doc.getElementById('live-row-metrology');
    if (elRow) elRow.classList.remove('hidden');
    setText('live-table-metrology', formatDossierMetrologyBadge(metSnap, isEs));
  }

  const sobolRes = computeSobolFirstOrderIndices(
    (v) => Number(v.flowM3H || 180) * 0.65 + Number(v.solidsWeightPercent || 45) * 1.4 + Number(v.particleSizeD80Microns || 180) * 0.08 + Number(v.altitudeM || 2200) * 0.02,
    [
      { name: 'flowM3H', min: 50, max: 1200 },
      { name: 'solidsWeightPercent', min: 15, max: 68 },
      { name: 'particleSizeD80Microns', min: 38, max: 600 },
      { name: 'altitudeM', min: 0, max: 4500 },
    ],
    16
  );
  const sobolSummary = (sobolRes.ranked || [])
    .map((item) => `${item.name} ${(item.si * 100).toFixed(0)}%`)
    .join(' · ');
  setText('live-table-sobol-drivers', `${sobolSummary} • Cv ${FORMATTERS_BY_FIELD.solidsVolumetricPercent(hm.solids_cv)} • ${DOSSIER_FORMATTERS_BY_FIELD.actualPipeVelocityMs(hm.line_velocity_ms)}`);

  const anexo = buildSapAnexo22ComplianceSummary({
    circuit: state.currentCircuit || 'bombeo',
    smatCode,
    stockRegime: isOpex ? 'hay' : 'se_fabrica',
    estimatedMxn: isOpex ? 18500 : 85000,
    lang: isEs ? 'es' : 'en',
  });
  setText('sap-live-anexo22-tuple', anexo?.tupleText || `SAT 8413.91.01 • ${smatCode}`);

  const folio = doc.getElementById('live-folio')?.textContent?.trim() || 'SMAT-2026-8810';
  const erpSnapshot = buildCanonicalEngineeringSnapshot({
    folio,
    contact_name: nameVal,
    company_name: compVal,
    phone_number: phoneVal,
    email_address: emailVal,
    delivery_destination: destVal,
    placa_ref: clientRefVal,
    smat_code: smatCode,
    quantity: Number(dom.erpQuantity?.value || 1),
    logistics_mode: dom.inputDest?.value || 'retiro_durango',
  });

  projectAttachedStationSnapshots(doc, session, isEs);
  projectDomainOutputs(container, 'jrp', {
    ...jrpEval,
    eligible: Boolean(trayStateNow.coreReturnEnabled),
    version: trayStateNow.version || 3,
  }, isEs ? 'es' : 'en');
  projectDomainOutputs(container, 'erpExport', erpSnapshot, isEs ? 'es' : 'en');
  projectWorkbenchToDOM(container, { ...hm, smat_code: smatCode });

  const scopeReport = verifyVplDomScopeContainment(container);
  return {
    schemaCount: scopeReport.checkedCount,
    scopeContainmentValid: scopeReport.valid,
    smatCode,
    snapshot: erpSnapshot,
  };
}
