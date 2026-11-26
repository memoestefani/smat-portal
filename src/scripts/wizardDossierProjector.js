// @ts-check
/**
 * wizardDossierProjector.js
 * ---------------------------------------------------------------------------
 * Proyector Puro del Dossier de Ingeniería en Vivo y Checkout B2B (`SLICE-V56-03`).
 * Opera únicamente sobre dominios de checkout (`jrp`, `erpExport`) y snapshots
 * guardados de estaciones sin cálculos inline acoplados ni `innerHTML`.
 */

import rolesDataJson from '../../data/roles.json' with { type: 'json' };
import { resolveDomainMaterialSpec } from './domainMaterialSpecResolver.js';
import { resolveEmptyRequisitionViewState } from './emptyRequisitionGate.js';
import {
  buildRolesCriteriaMap,
  formatCatalogPartCodeHuman,
  formatDischargeRegimeHuman,
  formatLogisticsDestinationHuman,
  formatMaterialKeyHuman,
} from './i18nDomainLabels.js';
import { buildDossierPriorityViewModel } from './instrumentViewModels.js';
import {
  DEFAULT_CLASSIFICATION_CRITERIA_MAP,
  DOSSIER_FORMATTERS_BY_FIELD,
  formatDossierCircuitPhysicsRow,
  formatDossierMetrologyBadge,
  formatDossierSimulationBanner,
} from './quoteDossierRenderer.js';
import { computeWizardViewState } from './quoteWizardController.js';
import {
  calculateCoupledReorderWindowDays,
  computeCmuPriorityDescriptor,
  getTrayState,
} from './requisitionTrayBus.js';
import {
  deriveSessionLifecycleState,
  isCommittedCartActive,
  loadEngineeringContextSnapshot,
  loadRfqSession,
} from './rfqSessionStore.js';
import {
  INTERNAL_PRIVATE_OUTPUT_KEYS,
  OUTPUT_VISIBILITY_TAXONOMY,
  auditSchemaOutputParity,
  projectDomainOutputs, verifyVplDomScopeContainment,
} from './schemaRuntimeBinder.js';
import { calculateSlurryMetrics, validatePlantLeadInput } from './slurryEngine.js';
import { buildSapAnexo22ComplianceSummary } from './vendorPassportAndTradeInController.js';
import { QUICK_CHECKOUT_SKU_LIST, findMiningGroupById } from './wizardCatalogData.js';
import { FORMATTERS_BY_FIELD, buildSmatCode, projectWorkbenchToDOM } from './wizardMiningAndCodeDecoder.js';
import { resolveUrlContextDescriptor } from './wizardUrlAndPresetRouter.js';
import { computeSobolFirstOrderIndices } from './wizardXdsmDagSolver.js';
import { buildCanonicalEngineeringSnapshot } from './workbenchBus.js';

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

  /** @type {Record<string, string>} */
  const labelByKey = {
    pumping: isEs ? 'Bombeo Hidráulico' : 'Hydraulic Pumping',
    sealDrive: isEs ? 'Sellado y Transmisión' : 'Seal & Drive',
    cycloneScreen: isEs ? 'Clasificación y Cribas' : 'Cyclones & Screens',
    flotation: isEs ? 'Flotación Celda' : 'Flotation Cell',
    filtration: isEs ? 'Filtración Prensa' : 'Filter Press',
    metrology: isEs ? 'Control / Laboratorio' : 'Process Control / Lab',
  };

  const buildHumanSnapshotSummary = (snap) => {
    const langTag = isEs ? 'es' : 'en';
    const explicit = isEs ? (snap.summaryEs || snap.summary) : (snap.summaryEn || snap.summary);
    if (explicit) return String(explicit).trim();
    /** @type {string[]} */
    const parts = [];
    const series = snap.pipeSeries || snap.pipe_size;
    if (series) parts.push(`${isEs ? 'Serie' : 'Series'} ${series}`);
    const rawMat = snap.materialKey || snap.wetEndMaterial || snap.pump_material;
    if (rawMat) parts.push(formatMaterialKeyHuman(String(rawMat), langTag));
    const flow = snap.flowM3H ?? snap.flow;
    if (flow !== undefined && Number.isFinite(Number(flow))) parts.push(`${Number(flow)} m³/h`);
    const solids = snap.solidsPct ?? snap.cvPct;
    if (solids !== undefined && Number.isFinite(Number(solids))) parts.push(`${Number(solids)}% Cv`);
    if (snap.tipSpeedMs !== undefined && Number.isFinite(Number(snap.tipSpeedMs))) parts.push(`u₂ ${Number(snap.tipSpeedMs).toFixed(1)} m/s`);
    if (snap.bearingL10Hours !== undefined && Number.isFinite(Number(snap.bearingL10Hours))) {
      parts.push(`L₁₀ₕ ${Number(snap.bearingL10Hours).toLocaleString(isEs ? 'es-MX' : 'en-US')} h`);
    }
    if (snap.d50cMicrons !== undefined && Number.isFinite(Number(snap.d50cMicrons))) parts.push(`d₅₀c ${Number(snap.d50cMicrons)} µm`);
    if (snap.solidsRecoveryPct !== undefined && Number.isFinite(Number(snap.solidsRecoveryPct))) {
      parts.push(`${Number(snap.solidsRecoveryPct).toFixed(1)}% ${isEs ? 'recup.' : 'recovery'}`);
    }
    if (snap.cycleTimeMin !== undefined && Number.isFinite(Number(snap.cycleTimeMin))) {
      parts.push(`${Number(snap.cycleTimeMin).toFixed(1)} ${isEs ? 'min/ciclo' : 'min/cycle'}`);
    }
    if (snap.sauterDiameterMm !== undefined && Number.isFinite(Number(snap.sauterDiameterMm))) {
      parts.push(`d₃₂ ${Number(snap.sauterDiameterMm).toFixed(2)} mm`);
    }
    if (snap.recommendedMassKg !== undefined && Number.isFinite(Number(snap.recommendedMassKg))) {
      parts.push(`${Number(snap.recommendedMassKg).toFixed(2)} kg`);
    }
    if (parts.length > 0) return parts.join(' • ');
    return isEs ? 'Parámetros técnicos adjuntos' : 'Attached engineering parameters';
  };

  const nodes = entries.map(([key, snap]) => {
    const li = doc.createElement('li');
    const regimeTag = key === 'cycloneScreen' && snap.dischargeRegime
      ? ` (${formatDischargeRegimeHuman(snap.dischargeRegime, isEs ? 'es' : 'en')})`
      : '';
    const summary = buildHumanSnapshotSummary(snap);
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
  const doc = /** @type {Document|null} */ (ctx.doc || (typeof document !== 'undefined' ? document : null));
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

  const session = /** @type {Record<string, any>} */ (loadRfqSession());
  const trayStateNow = getTrayState();
  const engCtx = /** @type {Record<string, any>} */ (loadEngineeringContextSnapshot());
  const urlDesc = resolveUrlContextDescriptor(state.urlCtx || {});
  const viewState = computeWizardViewState({ circuit: state.currentCircuit }, state.urlCtx || {});
  const primaryTray = trayStateNow.items?.[0] || null;
  const matchedCatalog = QUICK_CHECKOUT_SKU_LIST.find((s) => s.id === primaryTray?.id);

  const contactFallback = session.contact || session.plantContext || {};
  const capturedName = dom.inputName?.value.trim() || contactFallback.name || session.plantContext?.name || '';
  const miningGrp = findMiningGroupById(dom.selectMiningGroup?.value || session.plantContext?.miningGroupId || '');
  const capturedCompany = dom.inputCompany?.value.trim() || contactFallback.company || session.plantContext?.company || miningGrp?.name || '';
  const capturedPhone = dom.inputPhone?.value.trim() || contactFallback.phone || session.plantContext?.phone || '';
  const capturedEmail = dom.inputEmail?.value.trim() || contactFallback.email || session.plantContext?.email || '';
  const hasUrlContext = Boolean(state.urlCtx?.sku || state.urlCtx?.codigo || state.urlCtx?.equipo || state.urlCtx?.circuito);
  const lifecycleState = deriveSessionLifecycleState({
    ...session,
    items: trayStateNow.items || session.items || [],
    contact: {
      ...(session.contact || {}),
      name: capturedName,
      company: capturedCompany,
      phone: capturedPhone,
      email: capturedEmail,
    },
  });
  const isCartCommitted = isCommittedCartActive(
    { ...session, items: trayStateNow.items || session.items || [] },
    typeof window !== 'undefined' ? window.location?.search || '' : ''
  );
  const isEmptySession = (lifecycleState === 'EMPTY' || !isCartCommitted) && !hasUrlContext;
  const emptyView = resolveEmptyRequisitionViewState(trayStateNow, isEs ? 'es' : 'en', hasUrlContext);
  const showEmptyStarter = emptyView.isEmpty && (!trayStateNow.items || trayStateNow.items.length === 0);

  const headerThumb = doc.querySelector('.wb-header-durango-thumb');
  if (headerThumb) headerThumb.classList.toggle('hidden', showEmptyStarter);
  const starterCard = doc.getElementById('wb-empty-starter-card');
  if (starterCard) starterCard.classList.toggle('hidden', !showEmptyStarter);
  const tabsBar = doc.querySelector('[data-dossier-tabs-bar]');
  if (tabsBar) tabsBar.classList.toggle('hidden', showEmptyStarter);
  const nextStepBtn = /** @type {HTMLButtonElement | null} */ (doc.querySelector('[data-qw-next-step="2"]'));
  if (nextStepBtn) {
    nextStepBtn.disabled = showEmptyStarter;
    nextStepBtn.setAttribute('aria-disabled', showEmptyStarter ? 'true' : 'false');
  }

  const dossierRoot = doc.getElementById('live-engineering-dossier');
  if (dossierRoot) {
    dossierRoot.setAttribute('data-dossier-mode', isEmptySession ? 'empty' : 'active');
  }
  const dossierBody = doc.querySelector('[data-dossier-on-demand-body]');
  if (dossierBody) {
    dossierBody.classList.toggle('hidden', isEmptySession && trayStateNow.items.length === 0);
  }
  const emptyGuide = doc.querySelector('[data-dossier-empty-guide]');
  if (emptyGuide) emptyGuide.classList.toggle('hidden', !isEmptySession);
  const pumpSection = doc.getElementById('live-section-pump-hydraulics');
  const activeCircuitCandidate = String(primaryTray?.circuit || state.currentCircuit || 'bombeo').toLowerCase();
  if (pumpSection) {
    pumpSection.classList.toggle('hidden', isEmptySession || activeCircuitCandidate !== 'bombeo');
  }
  const miniFolioEl = doc.getElementById('mini-folio-text');
  if (miniFolioEl && isEmptySession) {
    miniFolioEl.textContent = isEs ? 'BORRADOR' : 'DRAFT';
  }

  if (isEmptySession && (!trayStateNow.items || trayStateNow.items.length === 0)) {
    const emptyCode = '';
    setText('live-smat-code', emptyCode);
    setText('live-part-name', isEs ? 'Sin partidas en carrito todavía' : 'No line items in cart yet');
    setText('gate-lead-status', emptyView.emptyStatusLabel);
    return {
      mode: 'empty',
      isEmpty: true,
      schemaCount: 0,
      scopeContainmentValid: true,
      smatCode: emptyCode,
    };
  }

  const smatCode = isEmptySession
    ? (isEs ? 'SMAT-BORRADOR (Sin partidas)' : 'SMAT-DRAFT (No items)')
    : (primaryTray?.id ||
      matchedCatalog?.id ||
      viewState.smatCode ||
      buildSmatCode(state.currentCircuit || 'bombeo', urlDesc.canonicalRole || 'kit_wet_end', '6x4', 'A05'));

  const nameVal = capturedName || (isEs ? '— Pendiente de captura —' : '— Pending requester —');
  const compVal = capturedCompany || (isEs ? '— Seleccionar unidad o compañía —' : '— Select site or company —');
  const contactLine = [capturedPhone, capturedEmail].filter(Boolean).join(' • ') || (isEs ? 'Capturar teléfono o correo en Paso 2' : 'Enter phone or email in Step 2');
  const rawDestVal = dom.inputDest?.value.trim() || dom.erpDestination?.value.trim() || contactFallback.destination || session.plantContext?.destination || 'warehouse_durango_pickup';
  const destVal = formatLogisticsDestinationHuman(rawDestVal, isEs ? 'es' : 'en');
  const clientRefVal = dom.inputClientRef?.value.trim() || contactFallback.clientRef || session.plantContext?.clientRef || '';
  const detailsText = dom.inputDetails?.value.trim() || contactFallback.details || session.plantContext?.details || (isEs ? 'Pendiente de especificación dimensional en Almacén Central Durango.' : 'Pending 1:1 dimensional specification at Durango Central Warehouse.');

  setText('live-requester', nameVal);
  setText('live-company', compVal);
  setText('live-contact', contactLine);
  setText('live-destination', destVal);
  setText('live-smat-code', smatCode);
  setText('sap-live-code', smatCode);
  setText('sap-live-dest', destVal);

  const partLabel = isEmptySession
    ? (isEs ? 'Sin partidas agregadas todavía (use Lista Rápida o Catálogo)' : 'No items in tray yet (use Quick Parts List or Catalog)')
    : (primaryTray
      ? `${isEs ? primaryTray.nameEs : primaryTray.nameEn} (×${primaryTray.qty})`
      : formatCatalogPartCodeHuman(smatCode, isEs ? 'es' : 'en'));
  setText('live-part-name', partLabel);
  setText('live-part-details', detailsText);
  setText('sap-live-part', partLabel);

  const activeCircuitKey = String(primaryTray?.circuit || state.currentCircuit || 'bombeo').toLowerCase();
  const matSpec = resolveDomainMaterialSpec({
    circuit: activeCircuitKey,
    skuId: primaryTray?.id || (isEmptySession ? '' : smatCode),
    materialCode: primaryTray?.material || state.urlCtx?.material || '',
    isEmpty: isEmptySession,
    locale: isEs ? 'es' : 'en',
  });
  setText('live-alloy-badge', matSpec.badge);
  setText('dossier-part-hardness', matSpec.hardnessSpec);

  if (dom.liveClientRefBox) dom.liveClientRefBox.classList.toggle('hidden', !clientRefVal);
  if (dom.liveClientRefText) dom.liveClientRefText.textContent = clientRefVal;

  const criteriaMap = /** @type {Record<string, any>} */ (buildRolesCriteriaMap(rolesDataJson));
  const fallbackCriteria =
    criteriaMap[urlDesc.canonicalRole]?.[isEs ? 'rule_es' : 'rule_en'] ||
    DEFAULT_CLASSIFICATION_CRITERIA_MAP[urlDesc.canonicalRole]?.[isEs ? 'rule_es' : 'rule_en'] ||
    (isEs
      ? 'Intercambiabilidad dimensional 1:1 • Dureza >600 HB • Disponibilidad verificable en Almacén Durango'
      : '1:1 dimensional fit • Hardness >600 HB • Verified availability at Durango Warehouse');
  setText('live-role-criteria', fallbackCriteria);

  const cmuNow = computeCmuPriorityDescriptor({
    urgency: isEmptySession ? '' : (isOpex ? 'paro_de_linea' : 'programado'),
    criticalityMode: isEmptySession ? 'UNSET' : (dom.jrpCriticality?.value || (isOpex ? 'PARO_DE_LINEA' : 'STOCK_SS')),
    items: trayStateNow.items || [],
    estimatedTotalMxn: isOpex ? 18500 : 85000,
    stockRegime: isOpex ? 'hay' : 'se_fabrica',
    lang: isEs ? 'es' : 'en',
  });

  if (dom.livePriorityTag) {
    dom.livePriorityTag.textContent = isEmptySession
      ? (isEs ? 'Borrador Técnico • Sin partidas activas' : 'Technical Draft • No active items')
      : (isEs
        ? (cmuNow.priorityLabelEs || 'Prioridad Operativa • Paro de Planta')
        : (cmuNow.priorityLabelEn || 'Operational Priority • Plant Shutdown'));
    dom.livePriorityTag.classList?.toggle('is-priority-opex', !isEmptySession && isOpex);
    dom.livePriorityTag.classList?.toggle('is-priority-capex', !isEmptySession && !isOpex);
  }
  const laneLabel = isEmptySession
    ? (isEs ? 'Por asignar (Bandeja vacía)' : 'Unassigned (Empty Tray)')
    : (isEs ? (cmuNow.checkoutLaneLabelEs || 'Despacho Programado') : (cmuNow.checkoutLaneLabelEn || 'Scheduled Dispatch'));
  setText('live-budget-category-pill', `${isEs ? 'Carril' : 'Lane'}: ${laneLabel}`);

  const jrpHours = Number(dom.jrpWearInput?.value || 2400);
  const jrpDaily = Number(dom.jrpDailyInput?.value || 24);
  const jrpCrit = dom.jrpCriticality?.value || (isOpex ? 'PARO_DE_LINEA' : 'STOCK_SS');
  const pumpingSnap = session.stationSnapshots?.pumping || engCtx.pumping || {};
  const metSnap = session.stationSnapshots?.metrology || engCtx.metrology || {};
  const cycSnap = session.stationSnapshots?.cycloneScreen || engCtx.classification || {};
  const flowVal = Number(pumpingSnap.flowM3H || engCtx.flowM3H || 180);
  const cwVal = Number(pumpingSnap.solidsWeightPercent || engCtx.solidsWeightPercent || 45);
  const d80Val = Number(pumpingSnap.particleSizeD80Microns || engCtx.particleSizeD80Microns || 180);
  const oreSgVal = Number(metSnap.oreSolidsSg || pumpingSnap.solidsSpecificGravity || 2.7);
  const pulpSgVal = Number(cycSnap.feedPulpSgKgL || pumpingSnap.slurrySpecificGravity || 1.45);
  const altVal = Number(session.plantContext?.altitudeM || engCtx.altitudeM || 2200);
  const pipeSeriesVal = viewState.pipeSize || '6x4';

  const jrpEval = calculateCoupledReorderWindowDays({
    sg: pulpSgVal,
    d50Um: d80Val,
    estimatedWearHours: jrpHours,
    dailyOperatingHours: jrpDaily,
    criticalityMode: jrpCrit,
    stockRegime: isOpex ? 'hay' : 'se_fabrica',
  });

  const hm = calculateSlurryMetrics({
    flowM3H: flowVal,
    solidsWeightPercent: cwVal,
    particleSizeD80Microns: d80Val,
    solidsSpecificGravity: oreSgVal,
    pipeSeries: pipeSeriesVal,
    altitudeM: altVal,
    pH: 7.0,
  });
  const gateOut = validatePlantLeadInput({
    flowM3h: flowVal,
    cwPct: cwVal,
    d80Microns: d80Val,
    pulpPh: 7.0,
    altitudeM: altVal,
    tempC: 25,
    lang: isEs ? 'es' : 'en',
  });
  const priorityVm = buildDossierPriorityViewModel(cmuNow, hm, gateOut, isEs ? 'es' : 'en');
  setText(
    'gate-lead-status',
    isEmptySession
      ? (isEs ? 'BORRADOR EN CAPTURA • SIN PARTIDAS ACTIVAS' : 'DRAFT IN PROGRESS • NO ACTIVE ITEMS')
      : `${isEs ? gateOut.badgeLabelEs : gateOut.badgeLabelEn} • ${priorityVm.priorityBadge}`
  );

  const banner = formatDossierSimulationBanner(state.currentCircuit || 'bombeo', isEs, urlDesc.canonicalRole);
  const physRow = formatDossierCircuitPhysicsRow(state.currentCircuit || 'bombeo', engCtx, { clientReorderWindowDays: jrpEval.reorderWindowDays }, isEs);
  setText('live-table-circuit-physics-label', physRow.label);
  setText('live-table-circuit-physics-val', `${banner.contextPill} • ${physRow.value} • ${priorityVm.cmuSummary}`);

  if (metSnap && Object.keys(metSnap).length > 0) {
    const elRow = doc.getElementById('live-row-metrology');
    if (elRow) elRow.classList.remove('hidden');
    setText('live-table-metrology', formatDossierMetrologyBadge(metSnap, isEs));
  }

  const sobolRes = computeSobolFirstOrderIndices(
    (v) => calculateSlurryMetrics({
      flowM3H: v.flowM3H,
      solidsWeightPercent: v.solidsWeightPercent,
      particleSizeD80Microns: v.particleSizeD80Microns,
      solidsSpecificGravity: oreSgVal,
      pipeSeries: pipeSeriesVal,
      altitudeM: v.altitudeM,
    }).estimatedImpellerLifeHours,
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
  const domDriver = sobolRes.ranked?.[0] || { name: 'flowM3H', si: 0 };
  const sobolDominantSiText = `${domDriver.name} (${(Number(domDriver.si || 0) * 100).toFixed(1)}% · σ²=${Number(sobolRes.totalVariance || 0).toFixed(0)} · Int ${(Number(sobolRes.interactionResidual || 0) * 100).toFixed(1)}%)`;
  setText(
    'live-table-sobol-drivers',
    `${sobolSummary} • Cv ${FORMATTERS_BY_FIELD.solidsVolumetricPercent(hm.solidsVolumetricPercent)} • ${DOSSIER_FORMATTERS_BY_FIELD.actualPipeVelocityMs(hm.actualPipeVelocityMs)}`
  );
  setText('dossier-metric-sobol-driver', `${isEs ? 'Factor Principal' : 'Primary Driver'}: ${sobolDominantSiText}`);

  const anexo = buildSapAnexo22ComplianceSummary({
    circuit: state.currentCircuit || 'bombeo',
    smatCode,
    stockRegime: isOpex ? 'hay' : 'se_fabrica',
    estimatedMxn: isOpex ? 18500 : 85000,
    lang: isEs ? 'es' : 'en',
  });
  setText('sap-live-anexo22-tuple', anexo?.summaryText || anexo?.satTigieLine || `SAT 8413.91.01 • ${smatCode}`);

  setText('live-material-reason', isEs ? hm.materialReasonEs : hm.materialReasonEn);

  const totalTrayQty = (trayStateNow.items || []).reduce((acc, it) => acc + Math.max(1, Number(it?.qty || 1)), 0);
  if (dom.erpQuantity && totalTrayQty > 0) dom.erpQuantity.value = String(totalTrayQty);
  const folio = doc.getElementById('live-folio')?.textContent?.trim() || (isEmptySession ? (isEs ? 'BORRADOR' : 'DRAFT') : 'SMAT-2026-8810');
  const phoneVal = capturedPhone || '';
  const emailVal = capturedEmail || '';
  const erpSnapshot = buildCanonicalEngineeringSnapshot({
    folio,
    contact_name: nameVal,
    company_name: compVal,
    phone_number: phoneVal,
    email_address: emailVal,
    delivery_destination: destVal,
    placa_ref: clientRefVal,
    smat_code: smatCode,
    quantity: Number(dom.erpQuantity?.value || totalTrayQty || 1),
    logistics_mode: dom.inputDest?.value || 'retiro_durango',
  });
  const erpDictamen = isEmptySession
    ? (isEs ? 'En espera de partidas (Borrador)' : 'Awaiting line items (Draft)')
    : (erpSnapshot.dictamen_estructural || (isEs ? gateOut.badgeLabelEs : gateOut.badgeLabelEn));
  const erpGate = erpSnapshot.clasificacion_compuerta || priorityVm.priorityCode || (isEs ? 'BORRADOR' : 'DRAFT');
  const erpSla = isEmptySession
    ? (isEs ? 'Sin SLA activo hasta capturar partidas' : 'No active SLA until items are added')
    : (isEs ? (hm.slaCommitmentEs || 'Atención ingeniería Durango') : 'Durango Engineering SLA');
  setText('dossier-sla-commitment', erpSla);
  setText('dossier-dual-checkout', laneLabel);
  setText('dossier-structural-verdict', `${erpDictamen} [${erpGate}]`);

  projectAttachedStationSnapshots(doc, session, isEs);
  projectDomainOutputs(container, 'jrp', {
    ...jrpEval,
    eligible: Boolean(trayStateNow.coreReturnEnabled),
    version: trayStateNow.version || 3,
  }, isEs ? 'es' : 'en');
  projectDomainOutputs(container, 'erpExport', erpSnapshot, isEs ? 'es' : 'en');
  projectWorkbenchToDOM(container, { ...hm, smat_code: smatCode });

  const erpParity = auditSchemaOutputParity('erpExport', erpSnapshot, container);
  const hasLeakedPrivate = INTERNAL_PRIVATE_OUTPUT_KEYS.some((pk) => erpParity.leakedPrivateKeys.includes(pk));
  container.setAttribute?.(
    'data-schema-parity',
    hasLeakedPrivate ? OUTPUT_VISIBILITY_TAXONOMY.INTERNAL_PRIVATE : (erpParity.valid ? OUTPUT_VISIBILITY_TAXONOMY.PRIMARY : 'partial')
  );
  const scopeReport = verifyVplDomScopeContainment(container);
  return {
    schemaCount: scopeReport.checkedCount,
    scopeContainmentValid: scopeReport.valid,
    smatCode,
    slurryMetrics: hm,
    jrpEval,
    sobolRes,
    snapshot: erpSnapshot,
  };
}
