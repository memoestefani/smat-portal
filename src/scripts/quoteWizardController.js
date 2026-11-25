// @ts-check
/**
 * quoteWizardController.js
 * ---------------------------------------------------------------------------
 * Fachada Task-First de Checkout B2B para `/cotizar/` y `/en/quote/` (`SLICE-V55-12`).
 * Desacoplada de calculadoras verticales e inline projectors obsoletos.
 */

import {
  bindVendorPassportDownloadButtons,
  initCoreTradeInWidgets,
} from './vendorPassportAndTradeInController.js';
import { initMiningPresetTelemetryBridge } from './wizardMiningAndCodeDecoder.js';
import { getDomainRouteMode } from './schemaRuntimeBinder.js';
import { resolveUrlContextDescriptor } from './wizardUrlAndPresetRouter.js';
import {
  RFQ_SESSION_STORAGE_KEY,
  RFQ_SESSION_UPDATE_EVENT,
  hydrateRfqSessionFromUrl,
  loadRfqSession,
} from './rfqSessionStore.js';
import { getTrayState } from './requisitionTrayBus.js';
import { PIPE_SERIES_DIAMETER_MM } from './slurryEngine.js';
import {
  generateSmatPartCode,
  getAtomicPartSpecs,
  parseUrlContextParams,
  resolveInternalBudgetCategory,
} from './workbenchBus.js';
import { projectLiveDossierSummary, switchDossierTabView } from './wizardDossierProjector.js';
import { bindAllWizardEventListeners, collectWizardDomRefs } from './wizardEventBindings.js';

/**
 * Resuelve vista canónica determinista de checkout sin efectos laterales DOM.
 * @param {Record<string, any>} [state={}]
 * @param {Record<string, any>|string} [urlParams={}]
 */
export function computeWizardViewState(state = {}, urlParams = {}) {
  const ctx = typeof urlParams === 'string' ? parseUrlContextParams(urlParams) : (urlParams || {});
  const desc = resolveUrlContextDescriptor(ctx);
  const rawCircuitInput = ctx.circuito || state.circuit || 'bombeo';
  const circuit = rawCircuitInput === 'control' || rawCircuitInput === 'lab'
    ? 'control_procesos'
    : (rawCircuitInput === 'clasificacion' ? 'bombeo' : rawCircuitInput);

  let pipeSize = state.pipeSize || '6x4';
  if (ctx.serie) {
    const sNorm = String(ctx.serie).toLowerCase().trim();
    if (PIPE_SERIES_DIAMETER_MM[sNorm]) pipeSize = sNorm;
    else {
      const hit = ['14x12', '12x10', '10x8', '8x6', '6x4', '4x3', '3x2', '2x1.5', '1.5x1'].find((k) => sNorm.includes(k));
      if (hit) pipeSize = hit;
    }
  }

  const smatCode = generateSmatPartCode({
    circuit,
    role_id: desc.canonicalRole,
    pipe_size: circuit === 'bombeo' ? pipeSize : '',
    size_val: pipeSize,
  });

  return {
    circuit,
    roleId: desc.canonicalRole,
    sku: ctx.sku || state.sku || null,
    selectedMaterial: ctx.material || state.material || 'A05',
    coupledClassificationActive: rawCircuitInput === 'clasificacion' || desc.canonicalRole === 'hidrociclon_apex_vortex',
    flotCondition: desc.normalizedFlotCondition,
    filtCondition: desc.normalizedFiltCondition,
    cycloneCircuit: desc.marcyThreeCup,
    pipeSize,
    smatCode,
    partSpecs: getAtomicPartSpecs(ctx.codigo || ctx.pieza || state.atomicCode || desc.canonicalRole, pipeSize),
    budgetCategory: resolveInternalBudgetCategory({ circuit, role_id: desc.canonicalRole, smat_code: smatCode }),
    drawers: {
      dispatchOpen: Boolean(ctx.mina || state.step3Open),
    },
  };
}

/**
 * Inicializa la consola Task-First de Checkout B2B en `/cotizar/` y `/en/quote/`.
 */
export function initQuoteWizardController() {
  if (typeof document === 'undefined') return null;
  const container = document.getElementById('rfq');
  if (!container) return null;

  const win = typeof window !== 'undefined' ? window : null;
  const pathname = win?.location?.pathname || '/cotizar/';
  const jrpMode = getDomainRouteMode('jrp', pathname);
  const erpMode = getDomainRouteMode('erpExport', pathname);
  if (jrpMode !== 'interactive' && erpMode !== 'interactive') return null;

  if (win?.location?.search) hydrateRfqSessionFromUrl(win.location.search);
  const nowDateIso = new Date().toISOString().slice(0, 10);
  const liveDateEl = document.getElementById('live-date');
  if (liveDateEl) liveDateEl.textContent = nowDateIso;
  const sessionSnapshot = loadRfqSession();
  const isEs = (document.documentElement?.lang || container.getAttribute('data-lang') || 'es').toLowerCase() !== 'en';
  const dom = collectWizardDomRefs(document);
  const state = {
    isEs,
    isOpex: true,
    currentCircuit: sessionSnapshot.plantContext?.activeCircuit || 'bombeo',
    urlCtx: win?.location?.search ? parseUrlContextParams(win.location.search) : {},
    hasTrayItems: Array.isArray(sessionSnapshot.items) && sessionSnapshot.items.length > 0,
    sessionKey: RFQ_SESSION_STORAGE_KEY,
    sessionEvent: RFQ_SESSION_UPDATE_EVENT,
  };

  const actions = {
    updateDossier: () => projectLiveDossierSummary({ doc: document, dom, state }),
    switchTab: (tab) => switchDossierTabView(tab, dom),
  };

  bindAllWizardEventListeners({ doc: document, win, dom, state, actions });
  bindVendorPassportDownloadButtons(document, isEs ? 'es' : 'en');
  initCoreTradeInWidgets(document, isEs ? 'es' : 'en');
  initMiningPresetTelemetryBridge(document);

  const bomDialog = /** @type {HTMLDialogElement | null} */ (document.getElementById('smat-bom-import-dialog'));
  const openBomBtn = document.getElementById('wb-open-bom-modal-btn');
  const closeBomBtn = document.getElementById('wb-close-bom-modal-btn');
  if (bomDialog && openBomBtn && openBomBtn.dataset.bomModalBound !== '1') {
    openBomBtn.dataset.bomModalBound = '1';
    openBomBtn.addEventListener('click', () => {
      if (typeof bomDialog.showModal === 'function' && !bomDialog.open) bomDialog.showModal();
    });
    closeBomBtn?.addEventListener('click', () => bomDialog.close());
    bomDialog.addEventListener('click', (ev) => {
      if (ev.target === bomDialog) bomDialog.close();
    });
  }

  const syncFabricacionTerms = () => {
    const fabWrap = document.getElementById('wb-fab-advance-wrap');
    if (!fabWrap) return;
    const tray = getTrayState();
    const needsFab = hasFabricacionItem(tray.items || []);
    fabWrap.classList.toggle('hidden', !needsFab);
    fabWrap.hidden = !needsFab;
  };
  syncFabricacionTerms();
  win?.addEventListener('smat:tray-updated', syncFabricacionTerms);
  win?.addEventListener(RFQ_SESSION_UPDATE_EVENT, syncFabricacionTerms);

  return actions.updateDossier();
}

/**
 * Predicado puro: indica si alguna partida del carrito requiere fabricación bajo plano (`se_fabrica`).
 * @param {any[]} [items=[]]
 * @returns {boolean}
 */
function hasFabricacionItem(items = []) {
  return Array.isArray(items) && items.some((it) => it?.stockRegime === 'se_fabrica');
}
