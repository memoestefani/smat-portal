// @ts-check
/**
 * rfqSessionStore.js
 * ---------------------------------------------------------------------------
 * Store SSOT Unico Tipado de Sesion B2B y Memorias Tecnicas Trans-Ruta (D2-V56 / SLICE-V56-05).
 * Unifica las llaves fragmentadas heredadas sobre `smat_rfq_session_v3` con:
 *   - Migracion read-once desde llaves legacy (`smat_rfq_session_v3_migrated`)
 *   - Campos con unidades fisicas explicitas (`metrology.oreSolidsSg` vs `cyclone.feedPulpSgKgL`)
 *   - Estado de outbox unificado (`outbox.dispatchStatus`, `outbox.lastPayload`) hacia `/acuse/`
 */

import {
  RFQ_SHARE_QUERY_PARAM,
  decodeRfqSharePayload,
  encodeRfqSharePayload,
} from './rfqShareCodec.js';

export const RFQ_SESSION_STORAGE_KEY = 'smat_rfq_session_v3';
const RFQ_SESSION_MIGRATED_FLAG = 'smat_rfq_session_v3_migrated';
export const RFQ_SESSION_UPDATE_EVENT = 'smat:rfq-session-updated';
export const SMAT_ENGINEERING_CONTEXT_KEY = 'smat_engineering_context_v1';

const LEGACY_KEYS = Object.freeze({
  workbench: 'smat_workbench_state_v2',
  context: 'smat_engineering_context_v1',
  tray: 'smat_requisition_tray_v3',
});

/**
 * @typedef {Object} RfqSessionItem
 * @property {string} id
 * @property {string} skuId
 * @property {string} atomicCode
 * @property {string} nameEs
 * @property {string} nameEn
 * @property {string} circuit
 * @property {string} material
 * @property {number} unitWeightKg
 * @property {number} qty
 * @property {'STOCK_SS' | 'PARO_DE_LINEA'} criticalityMode
 */

/**
 * @typedef {Object} SmatRfqSessionV3
 * @property {number} version
 * @property {string} updatedAtIso
 * @property {string[]} dirtyFields
 * @property {boolean} coreReturnEnabled
 * @property {Record<string, any>} plantContext
 * @property {Record<string, any>} contact
 * @property {RfqSessionItem[]} items
 * @property {Record<string, any>} stationSnapshots
 * @property {{ oreSolidsSg?: number, solidsPctCw?: number, pulpDensityKgL?: number }} metrology
 * @property {{ feedPulpSgKgL?: number, underflowSgKgL?: number, overflowSgKgL?: number, d50cMicrons?: number }} cyclone
 * @property {{ rateConstantPerMin?: number, rateConstantPerSec?: number, sbInverseSeconds?: number }} flotation
 * @property {{ dispatchStatus: any, lastPayload: Record<string, any> | null }} outbox
 */

/**
 * @returns {SmatRfqSessionV3}
 */
function createDefaultSession() {
  return {
    version: 3,
    updatedAtIso: new Date().toISOString(),
    dirtyFields: [],
    coreReturnEnabled: false,
    plantContext: {
      miningGroupId: '',
      miningUnitName: '',
      company: '',
      name: '',
      email: '',
      phone: '',
      destination: 'warehouse_durango_pickup',
      clientRef: '',
      details: '',
      circuit: 'bombeo',
      activeCircuit: 'bombeo',
      urgency: 'PARO_DE_LINEA',
    },
    contact: {
      company: '',
      name: '',
      email: '',
      phone: '',
      destination: 'warehouse_durango_pickup',
      clientRef: '',
      details: '',
    },
    items: [],
    stationSnapshots: {},
    metrology: {},
    cyclone: {},
    flotation: {},
    outbox: {
      dispatchStatus: null,
      lastPayload: null,
    },
  };
}

/**
 * Deriva el estado explícito del ciclo de vida de sesión (`EMPTY` -> `DRAFT` -> `VERIFIED`)
 * para evitar folios o alertas P1 sintéticas cuando el usuario no ha capturado datos reales.
 * @param {Partial<SmatRfqSessionV3>|null} [session=null]
 * @returns {'EMPTY' | 'DRAFT' | 'VERIFIED'}
 */
export function deriveSessionLifecycleState(session = null) {
  const s = /** @type {Record<string, any>} */ (session || loadRfqSession());
  const items = Array.isArray(s?.items) ? s.items : [];
  const snapshots = s?.stationSnapshots && typeof s.stationSnapshots === 'object' ? s.stationSnapshots : {};
  const hasSnapshots = Object.values(snapshots).some(
    (snap) => snap && typeof snap === 'object' && Object.keys(snap).length > 0
  );
  const contact = s?.contact || {};
  const plant = s?.plantContext || {};
  const nameVal = String(contact.name || plant.name || '').trim();
  const companyVal = String(contact.company || plant.company || plant.miningUnitName || '').trim();
  const channelVal = String(contact.email || plant.email || contact.phone || plant.phone || '').trim();
  const hasRequester = Boolean(nameVal && channelVal);
  if (items.length === 0 && !hasSnapshots && !hasRequester && !companyVal) {
    return 'EMPTY';
  }
  if ((items.length > 0 || hasSnapshots) && hasRequester && Boolean(companyVal)) {
    return 'VERIFIED';
  }
  return 'DRAFT';
}

/**
 * @param {'localStorage' | 'sessionStorage'} [kind='localStorage']
 * @returns {Storage | null}
 */
function getStorageSafe(kind = 'localStorage') {
  if (typeof window === 'undefined') return null;
  try {
    return window[kind] || null;
  } catch (_e) {
    return null;
  }
}

/**
 * @param {Record<string, any>} [raw={}]
 * @returns {RfqSessionItem | null}
 */
function normalizeItem(raw = {}) {
  const skuId = String(raw.skuId || raw.id || raw.code || '').trim().toUpperCase();
  if (!skuId) return null;
  return {
    id: skuId,
    skuId,
    atomicCode: String(raw.atomicCode || raw.code || skuId).trim().toUpperCase(),
    nameEs: String(raw.nameEs || raw.name_es || `Componente ${skuId}`).trim(),
    nameEn: String(raw.nameEn || raw.name_en || `Component ${skuId}`).trim(),
    circuit: String(raw.circuit || 'bombeo').trim().toLowerCase(),
    material: String(raw.material || 'Cr27 ASTM A532').trim(),
    unitWeightKg: Math.max(0.1, Number(raw.unitWeightKg ?? raw.weight_kg ?? 12.0)),
    qty: Math.max(1, Math.min(999, Math.round(Number(raw.qty) || 1))),
    criticalityMode: String(raw.criticalityMode || '').toUpperCase() === 'STOCK_SS' ? 'STOCK_SS' : 'PARO_DE_LINEA',
  };
}

/**
 * @param {Record<string, any>} [raw={}]
 * @returns {SmatRfqSessionV3}
 */
function normalizeSession(raw = {}) {
  const base = createDefaultSession();
  const src = raw && typeof raw === 'object' ? raw : {};
  const plant = src.plantContext && typeof src.plantContext === 'object' ? src.plantContext : {};
  const contactSrc = src.contact && typeof src.contact === 'object' ? src.contact : {};
  const rawDest = String(contactSrc.destination ?? plant.destination ?? base.contact.destination).trim();
  const normalizedDest =
    !rawDest ||
      rawDest.toLowerCase().includes('retiro en almacén central durango') ||
      rawDest.toLowerCase().includes('durango central warehouse pickup')
      ? 'warehouse_durango_pickup'
      : rawDest;
  const mergedContact = {
    ...base.contact,
    company: String(contactSrc.company ?? plant.company ?? base.contact.company),
    name: String(contactSrc.name ?? plant.name ?? base.contact.name),
    email: String(contactSrc.email ?? plant.email ?? base.contact.email),
    phone: String(contactSrc.phone ?? plant.phone ?? base.contact.phone),
    destination: normalizedDest,
    clientRef: String(contactSrc.clientRef ?? plant.clientRef ?? base.contact.clientRef),
    details: String(contactSrc.details ?? plant.details ?? base.contact.details),
  };
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const items = rawItems.map((it) => normalizeItem(it)).filter((it) => it !== null);
  const dirtyFields = Array.isArray(src.dirtyFields)
    ? Array.from(new Set(src.dirtyFields.map((f) => String(f).trim()).filter(Boolean)))
    : [];
  const stationSnapshots =
    src.stationSnapshots && typeof src.stationSnapshots === 'object' ? { ...src.stationSnapshots } : {};

  const outboxSrc = src.outbox && typeof src.outbox === 'object' ? src.outbox : {};
  const stationOutbox = stationSnapshots.outbox && typeof stationSnapshots.outbox === 'object' ? stationSnapshots.outbox : {};

  return {
    version: 3,
    updatedAtIso: String(src.updatedAtIso || base.updatedAtIso),
    dirtyFields,
    coreReturnEnabled: Boolean(src.coreReturnEnabled),
    plantContext: {
      ...base.plantContext,
      ...plant,
      ...mergedContact,
      urgency: String(plant.urgency || 'PARO_DE_LINEA').toUpperCase() === 'STOCK_SS' ? 'STOCK_SS' : 'PARO_DE_LINEA',
    },
    contact: mergedContact,
    items,
    stationSnapshots,
    metrology: src.metrology && typeof src.metrology === 'object' ? { ...src.metrology } : {},
    cyclone: src.cyclone && typeof src.cyclone === 'object' ? { ...src.cyclone } : {},
    flotation: src.flotation && typeof src.flotation === 'object' ? { ...src.flotation } : {},
    outbox: {
      dispatchStatus: outboxSrc.dispatchStatus ?? stationOutbox.dispatchStatus ?? null,
      lastPayload: outboxSrc.lastPayload ?? stationOutbox.lastPayload ?? null,
    },
  };
}

/**
 * Migración read-once desde llaves legacy hacia `smat_rfq_session_v3`.
 * @returns {SmatRfqSessionV3}
 */
function readLegacyIntoSessionOnce() {
  const ls = getStorageSafe('localStorage');
  const ss = getStorageSafe('sessionStorage');
  const base = createDefaultSession();
  if (!ls && !ss) return base;
  try {
    if (ls?.getItem(RFQ_SESSION_MIGRATED_FLAG) === '1' || ss?.getItem(RFQ_SESSION_MIGRATED_FLAG) === '1') {
      return base;
    }
  } catch (_e) { }

  let migrated = false;
  try {
    const rawTray = ls?.getItem(LEGACY_KEYS.tray);
    if (rawTray) {
      const parsed = JSON.parse(rawTray);
      if (Array.isArray(parsed?.items)) {
        base.items = parsed.items.map((it) => normalizeItem(it)).filter((it) => it !== null);
        base.coreReturnEnabled = Boolean(parsed.coreReturnEnabled);
        migrated = true;
      }
    }
    const rawCtx = ss?.getItem(LEGACY_KEYS.context) || ls?.getItem(LEGACY_KEYS.context);
    if (rawCtx) {
      const ctx = JSON.parse(rawCtx);
      if (ctx && typeof ctx === 'object') {
        base.stationSnapshots = { ...base.stationSnapshots, ...ctx };
        if (ctx.processControl?.specificGravity) {
          base.metrology.oreSolidsSg = Number(ctx.processControl.specificGravity);
        }
        if (ctx.classification?.feedSg) {
          base.cyclone.feedPulpSgKgL = Number(ctx.classification.feedSg);
        }
        migrated = true;
      }
    }
    const rawWb = ls?.getItem(LEGACY_KEYS.workbench);
    if (rawWb) {
      const wb = JSON.parse(rawWb);
      if (wb && typeof wb === 'object') {
        base.plantContext = {
          ...base.plantContext,
          company: String(wb.company || ''),
          name: String(wb.name || ''),
          email: String(wb.email || ''),
          phone: String(wb.phone || ''),
          circuit: String(wb.circuit || 'bombeo'),
        };
        if (wb.solidsSg) base.metrology.oreSolidsSg = Number(wb.solidsSg);
        if (wb.cycloneCircuit?.feedSg) base.cyclone.feedPulpSgKgL = Number(wb.cycloneCircuit.feedSg);
        migrated = true;
      }
    }
  } catch (_e) { }

  const normalized = migrated ? normalizeSession(base) : base;
  if (migrated) {
    const serialized = JSON.stringify(normalized);
    try {
      ls?.setItem(RFQ_SESSION_STORAGE_KEY, serialized);
      ss?.setItem(RFQ_SESSION_STORAGE_KEY, serialized);
      ls?.setItem(RFQ_SESSION_MIGRATED_FLAG, '1');
      ss?.setItem(RFQ_SESSION_MIGRATED_FLAG, '1');
    } catch (_e) { }
  }
  return normalized;
}

/**
 * Lee el estado unificado `smat_rfq_session_v3` migrando llaves heredadas una sola vez.
 * @returns {SmatRfqSessionV3}
 */
export function loadRfqSession() {
  const ls = getStorageSafe('localStorage');
  const ss = getStorageSafe('sessionStorage');
  for (const store of [ls, ss]) {
    if (!store) continue;
    try {
      const raw = store.getItem(RFQ_SESSION_STORAGE_KEY);
      if (raw) return normalizeSession(JSON.parse(raw));
    } catch (_e) { }
  }
  return readLegacyIntoSessionOnce();
}

/**
 * Persiste el estado unificado fusionando el complemento existente y notificando suscriptores DOM.
 * @param {Record<string, any>} [nextSession={}]
 * @returns {SmatRfqSessionV3}
 */
export function saveRfqSession(nextSession = {}) {
  const isFullReset = nextSession && nextSession.__replaceSession === true;
  const current = isFullReset ? createDefaultSession() : loadRfqSession();
  const patch = nextSession && typeof nextSession === 'object' ? nextSession : {};

  const mergedInput = {
    ...current,
    ...patch,
    plantContext: {
      ...current.plantContext,
      ...(patch.plantContext || {}),
      ...(patch.contact || {}),
    },
    contact: {
      ...current.contact,
      ...(patch.contact || {}),
    },
    items: Array.isArray(patch.items) ? patch.items : current.items,
    dirtyFields: Array.isArray(patch.dirtyFields) ? patch.dirtyFields : current.dirtyFields,
    stationSnapshots: {
      ...current.stationSnapshots,
      ...(patch.stationSnapshots || {}),
    },
    metrology: {
      ...current.metrology,
      ...(patch.metrology || {}),
    },
    cyclone: {
      ...current.cyclone,
      ...(patch.cyclone || {}),
    },
    flotation: {
      ...current.flotation,
      ...(patch.flotation || {}),
    },
    outbox: {
      ...current.outbox,
      ...(patch.outbox || {}),
    },
    updatedAtIso: new Date().toISOString(),
  };

  const normalized = normalizeSession(mergedInput);
  const serialized = JSON.stringify(normalized);
  const ls = getStorageSafe('localStorage');
  const ss = getStorageSafe('sessionStorage');
  try {
    ls?.setItem(RFQ_SESSION_STORAGE_KEY, serialized);
    ss?.setItem(RFQ_SESSION_STORAGE_KEY, serialized);
    ls?.setItem(RFQ_SESSION_MIGRATED_FLAG, '1');
  } catch (_e) { }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent(RFQ_SESSION_UPDATE_EVENT, { detail: normalized }));
  }
  return normalized;
}

/**
 * @param {string} [fieldName='']
 * @returns {SmatRfqSessionV3}
 */
export function markFieldUserDirty(fieldName = '') {
  const field = String(fieldName || '').trim();
  if (!field) return loadRfqSession();
  const current = loadRfqSession();
  if (!current.dirtyFields.includes(field)) {
    const nextDirty = [...current.dirtyFields, field];
    return saveRfqSession({ dirtyFields: nextDirty });
  }
  return current;
}

/**
 * @param {string} [fieldName='']
 * @param {SmatRfqSessionV3 | Record<string, any> | null} [session=null]
 * @returns {boolean}
 */
export function isFieldUserDirty(fieldName = '', session = null) {
  const active = session || loadRfqSession();
  return Array.isArray(active.dirtyFields) && active.dirtyFields.includes(String(fieldName || '').trim());
}

/**
 * Guarda la memoria tecnica de una estacion respetando campos y unidades aisladas.
 * @param {string} [stationKey='pumping']
 * @param {Record<string, any>} [snapshot={}]
 * @returns {SmatRfqSessionV3}
 */
export function saveStationSnapshot(stationKey = 'pumping', snapshot = {}) {
  const key = String(stationKey || 'pumping').trim();
  const current = loadRfqSession();
  const prevStation = current.stationSnapshots[key] || {};
  const snapData = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const stationPatch = {
    [key]: {
      ...prevStation,
      ...snapData,
      updatedAtIso: new Date().toISOString(),
    },
  };
  /** @type {Record<string, any>} */
  const domainPatch = { stationSnapshots: stationPatch };
  if (key === 'metrology' || key === 'processControl') {
    const oreSg = Number(snapData.oreSolidsSg ?? snapData.specificGravity ?? current.metrology.oreSolidsSg);
    domainPatch.metrology = {
      ...(Number.isFinite(oreSg) && oreSg > 0 ? { oreSolidsSg: oreSg } : {}),
      ...(snapData.solidsPctCw !== undefined ? { solidsPctCw: Number(snapData.solidsPctCw) } : {}),
      ...(snapData.pulpDensityKgL !== undefined ? { pulpDensityKgL: Number(snapData.pulpDensityKgL) } : {}),
    };
  } else if (key === 'cycloneScreen' || key === 'classification') {
    const feedPulpSg = Number(snapData.feedPulpSgKgL ?? snapData.feedSg ?? current.cyclone.feedPulpSgKgL);
    domainPatch.cyclone = {
      ...(Number.isFinite(feedPulpSg) && feedPulpSg > 0 ? { feedPulpSgKgL: feedPulpSg } : {}),
      ...(snapData.d50cMicrons !== undefined ? { d50cMicrons: Number(snapData.d50cMicrons) } : {}),
    };
  } else if (key === 'flotation') {
    const kMin = Number(snapData.rateConstantPerMin ?? snapData.rateConstantMin);
    domainPatch.flotation = {
      ...(Number.isFinite(kMin) ? { rateConstantPerMin: kMin, rateConstantPerSec: Number((kMin / 60).toFixed(4)) } : {}),
      ...(snapData.sbInverseSeconds !== undefined ? { sbInverseSeconds: Number(snapData.sbInverseSeconds) } : {}),
    };
  } else if (key === 'outbox') {
    domainPatch.outbox = {
      dispatchStatus: snapData.dispatchStatus ?? current.outbox.dispatchStatus,
      lastPayload: snapData.lastPayload ?? current.outbox.lastPayload,
    };
  }
  return saveRfqSession(domainPatch);
}

const CIRCUIT_TO_CANONICAL_STATION = Object.freeze({
  bombeo: 'pumping',
  flotacion: 'flotation',
  filtracion: 'filtration',
  clasificacion: 'classification',
  control_procesos: 'metrology',
});

/**
 * Compatibilidad directa para islas verticales previas que llamaban a `saveEngineeringContextSnapshot`.
 * @param {string | Record<string, any>} [circuitOrPartial={}]
 * @param {Record<string, any> | null} [maybePayload=null]
 */
export function saveEngineeringContextSnapshot(circuitOrPartial = {}, maybePayload = null) {
  if (typeof circuitOrPartial === 'string' && maybePayload && typeof maybePayload === 'object') {
    const rawKey = String(circuitOrPartial || '').trim();
    const canonicalKey = CIRCUIT_TO_CANONICAL_STATION[rawKey] || rawKey;
    const s = saveStationSnapshot(canonicalKey, maybePayload);
    return s.stationSnapshots;
  }
  const partial = circuitOrPartial && typeof circuitOrPartial === 'object' ? circuitOrPartial : {};
  return saveRfqSession({ stationSnapshots: partial }).stationSnapshots;
}

/**
 * @returns {Record<string, any>}
 */
export function loadEngineeringContextSnapshot() {
  return loadRfqSession().stationSnapshots || {};
}

/**
 * @param {any} dispatchStatus
 * @param {Record<string, any> | null} [lastPayload=null]
 */
function saveOutboxDispatchState(dispatchStatus, lastPayload = null) {
  return saveStationSnapshot('outbox', {
    dispatchStatus: dispatchStatus || null,
    lastPayload: lastPayload || null,
  });
}

/**
 * @returns {{ dispatchStatus: any, lastPayload: Record<string, any> | null }}
 */
function loadOutboxDispatchState() {
  const sess = loadRfqSession();
  return sess.outbox || { dispatchStatus: null, lastPayload: null };
}

/**
 * @param {Record<string, any>} [rawItem={}]
 * @returns {SmatRfqSessionV3}
 */
export function upsertSessionItem(rawItem = {}) {
  const item = normalizeItem(rawItem);
  if (!item) return loadRfqSession();
  const current = loadRfqSession();
  const items = [...current.items];
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...item, qty: items[idx].qty + item.qty };
  } else {
    items.push(item);
  }
  return saveRfqSession({ items });
}

/**
 * @param {string} [skuOrId='']
 * @returns {SmatRfqSessionV3}
 */
export function removeSessionItem(skuOrId = '') {
  const id = String(skuOrId || '').trim().toUpperCase();
  const current = loadRfqSession();
  return saveRfqSession({
    items: current.items.filter((i) => i.id !== id && i.skuId !== id),
  });
}

/**
 * @returns {SmatRfqSessionV3}
 */
export function clearRfqSession() {
  return saveRfqSession({ ...createDefaultSession(), __replaceSession: true });
}

/**
 * @param {(session: SmatRfqSessionV3) => void} listener
 * @returns {() => void}
 */
export function subscribeRfqSession(listener) {
  if (typeof window === 'undefined' || typeof listener !== 'function') return () => { };
  /** @param {any} ev */
  const handler = (ev) => listener(ev?.detail || loadRfqSession());
  window.addEventListener(RFQ_SESSION_UPDATE_EVENT, handler);
  return () => window.removeEventListener(RFQ_SESSION_UPDATE_EVENT, handler);
}

/**
 * Construye enlace compartible `Ingeniero -> Compras` hacia /cotizar/ o /en/quote/.
 * @param {{ lang?: string, pathname?: string, session?: SmatRfqSessionV3, origin?: string }} [opts={}]
 * @returns {string}
 */
export function buildShareableRfqUrl(opts = {}) {
  const lang = String(opts.lang || 'es').toLowerCase() === 'en' ? 'en' : 'es';
  const session = opts.session || loadRfqSession();
  const token = encodeRfqSharePayload(session);
  const path = opts.pathname || (lang === 'en' ? '/en/quote/' : '/cotizar/');
  const origin = String(opts.origin || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '')).replace(/\/$/, '');
  return `${origin}${path}?${RFQ_SHARE_QUERY_PARAM}=${encodeURIComponent(token)}#rfq`;
}

/**
 * Hidrata `smat_rfq_session_v3` si la URL incluye `?rfq_v3=...` respetando `dirtyFields`.
 * @param {string} [searchString='']
 * @returns {{ hydrated: boolean, session: SmatRfqSessionV3 }}
 */
export function hydrateRfqSessionFromUrl(searchString = '') {
  const rawSearch = searchString || (typeof window !== 'undefined' ? window.location?.search || '' : '');
  const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
  const token = params.get(RFQ_SHARE_QUERY_PARAM);
  if (!token) return { hydrated: false, session: loadRfqSession() };
  const decoded = decodeRfqSharePayload(token);
  if (!decoded) return { hydrated: false, session: loadRfqSession() };

  const current = loadRfqSession();
  /** @type {Record<string, any>} */
  const nextPlant = { ...current.plantContext };
  for (const [k, v] of Object.entries(decoded.plantContext || {})) {
    if (!v || isFieldUserDirty(k, current)) continue;
    nextPlant[k] = v;
  }
  const nextItems = Array.isArray(decoded.items) && decoded.items.length > 0 && current.items.length === 0
    ? decoded.items.map((it) => normalizeItem(it)).filter((it) => it !== null)
    : current.items;
  const nextSnapshots = {
    ...(decoded.stationSnapshots || {}),
    ...(current.stationSnapshots || {}),
  };
  return {
    hydrated: true,
    session: saveRfqSession({
      plantContext: nextPlant,
      items: nextItems,
      stationSnapshots: nextSnapshots,
    }),
  };
}
