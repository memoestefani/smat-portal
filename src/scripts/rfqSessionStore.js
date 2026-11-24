/**
 * rfqSessionStore.js
 * ---------------------------------------------------------------------------
 * Store SSOT Unico de Sesion B2B y Memorias Tecnicas Trans-Ruta (D3-V55).
 * Unifica las llaves fragmentadas heredadas sobre `smat_rfq_session_v3` con
 * proteccion de intencion manual (`dirtyFields`), memorias por estacion y
 * enlace compartible Ingeniero -> Compras (`rfqShareCodec.js`).
 */

import {
  RFQ_SHARE_QUERY_PARAM,
  decodeRfqSharePayload,
  encodeRfqSharePayload,
} from './rfqShareCodec.js';

export const RFQ_SESSION_STORAGE_KEY = 'smat_rfq_session_v3';
export const RFQ_SESSION_UPDATE_EVENT = 'smat:rfq-session-updated';
export const SMAT_ENGINEERING_CONTEXT_KEY = 'smat_engineering_context_v1';

const LEGACY_KEYS = Object.freeze({
  workbench: 'smat_workbench_state_v2',
  context: 'smat_engineering_context_v1',
  tray: 'smat_requisition_tray_v3',
});

function createDefaultSession() {
  return {
    version: 3,
    updatedAtIso: new Date().toISOString(),
    dirtyFields: [],
    plantContext: {
      miningGroupId: '',
      miningUnitName: '',
      company: '',
      name: '',
      email: '',
      phone: '',
      destination: 'Retiro en Almacén Central Durango (Coordinación con Folio)',
      details: '',
      circuit: 'bombeo',
      urgency: 'PARO_DE_LINEA',
    },
    items: [],
    stationSnapshots: {},
  };
}

function getStorageSafe(kind = 'localStorage') {
  if (typeof window === 'undefined') return null;
  try {
    return window[kind] || null;
  } catch (_e) {
    return null;
  }
}

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

function normalizeSession(raw = {}) {
  const base = createDefaultSession();
  const src = raw && typeof raw === 'object' ? raw : {};
  const plant = src.plantContext && typeof src.plantContext === 'object' ? src.plantContext : {};
  const rawItems = Array.isArray(src.items) ? src.items : [];
  const items = rawItems.map((it) => normalizeItem(it)).filter(Boolean);
  const dirtyFields = Array.isArray(src.dirtyFields)
    ? Array.from(new Set(src.dirtyFields.map((f) => String(f).trim()).filter(Boolean)))
    : [];

  return {
    version: 3,
    updatedAtIso: String(src.updatedAtIso || base.updatedAtIso),
    dirtyFields,
    plantContext: {
      ...base.plantContext,
      ...plant,
      urgency: String(plant.urgency || 'PARO_DE_LINEA').toUpperCase() === 'STOCK_SS' ? 'STOCK_SS' : 'PARO_DE_LINEA',
    },
    items,
    stationSnapshots:
      src.stationSnapshots && typeof src.stationSnapshots === 'object' ? { ...src.stationSnapshots } : {},
  };
}

function readLegacyIntoSession() {
  const ls = getStorageSafe('localStorage');
  const ss = getStorageSafe('sessionStorage');
  const base = createDefaultSession();
  let migrated = false;

  try {
    const rawTray = ls?.getItem(LEGACY_KEYS.tray);
    if (rawTray) {
      const parsed = JSON.parse(rawTray);
      if (Array.isArray(parsed?.items)) {
        base.items = parsed.items.map((it) => normalizeItem(it)).filter(Boolean);
        migrated = true;
      }
    }
    const rawCtx = ss?.getItem(LEGACY_KEYS.context) || ls?.getItem(LEGACY_KEYS.context);
    if (rawCtx) {
      const ctx = JSON.parse(rawCtx);
      if (ctx && typeof ctx === 'object') {
        base.stationSnapshots = { ...base.stationSnapshots, ...ctx };
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
        migrated = true;
      }
    }
  } catch (_e) { }

  return migrated ? normalizeSession(base) : base;
}

/**
 * Lee el estado unificado `smat_rfq_session_v3` migrando llaves heredadas si aplica.
 * @returns {ReturnType<typeof createDefaultSession>}
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
  return readLegacyIntoSession();
}

/**
 * Persiste el estado unificado y notifica suscriptores DOM.
 * @param {Record<string, any>} nextSession
 * @returns {ReturnType<typeof createDefaultSession>}
 */
export function saveRfqSession(nextSession = {}) {
  const normalized = normalizeSession({
    ...nextSession,
    updatedAtIso: new Date().toISOString(),
  });
  const serialized = JSON.stringify(normalized);
  const ls = getStorageSafe('localStorage');
  const ss = getStorageSafe('sessionStorage');
  try {
    ls?.setItem(RFQ_SESSION_STORAGE_KEY, serialized);
    ss?.setItem(RFQ_SESSION_STORAGE_KEY, serialized);
  } catch (_e) { }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent(RFQ_SESSION_UPDATE_EVENT, { detail: normalized }));
  }
  return normalized;
}

export function markFieldUserDirty(fieldName = '') {
  const field = String(fieldName || '').trim();
  if (!field) return loadRfqSession();
  const current = loadRfqSession();
  if (!current.dirtyFields.includes(field)) {
    current.dirtyFields.push(field);
    return saveRfqSession(current);
  }
  return current;
}

export function isFieldUserDirty(fieldName = '', session = null) {
  const active = session || loadRfqSession();
  return Array.isArray(active.dirtyFields) && active.dirtyFields.includes(String(fieldName || '').trim());
}

/**
 * Guarda la memoria tecnica de una estacion respetando campos bloqueados por el usuario.
 */
export function saveStationSnapshot(stationKey = 'pumping', snapshot = {}) {
  const key = String(stationKey || 'pumping').trim();
  const current = loadRfqSession();
  const prevStation = current.stationSnapshots[key] || {};
  current.stationSnapshots[key] = {
    ...prevStation,
    ...(snapshot && typeof snapshot === 'object' ? snapshot : {}),
    updatedAtIso: new Date().toISOString(),
  };
  return saveRfqSession(current);
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
    const ss = getStorageSafe('sessionStorage');
    const ls = getStorageSafe('localStorage');
    const legacyBlob = JSON.stringify(s.stationSnapshots);
    try {
      ss?.setItem(SMAT_ENGINEERING_CONTEXT_KEY, legacyBlob);
      ls?.setItem(SMAT_ENGINEERING_CONTEXT_KEY, legacyBlob);
    } catch (_e) { }
    return s.stationSnapshots;
  }
  const partial = circuitOrPartial && typeof circuitOrPartial === 'object' ? circuitOrPartial : {};
  const current = loadRfqSession();
  current.stationSnapshots = { ...current.stationSnapshots, ...partial };
  return saveRfqSession(current).stationSnapshots;
}

export function loadEngineeringContextSnapshot() {
  return loadRfqSession().stationSnapshots || {};
}

export function upsertSessionItem(rawItem = {}) {
  const item = normalizeItem(rawItem);
  if (!item) return loadRfqSession();
  const current = loadRfqSession();
  const idx = current.items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    current.items[idx] = { ...current.items[idx], ...item, qty: current.items[idx].qty + item.qty };
  } else {
    current.items.push(item);
  }
  return saveRfqSession(current);
}

export function removeSessionItem(skuOrId = '') {
  const id = String(skuOrId || '').trim().toUpperCase();
  const current = loadRfqSession();
  current.items = current.items.filter((i) => i.id !== id && i.skuId !== id);
  return saveRfqSession(current);
}

export function clearRfqSession() {
  return saveRfqSession(createDefaultSession());
}

export function subscribeRfqSession(listener) {
  if (typeof window === 'undefined' || typeof listener !== 'function') return () => {};
  const handler = (ev) => listener(ev.detail || loadRfqSession());
  window.addEventListener(RFQ_SESSION_UPDATE_EVENT, handler);
  return () => window.removeEventListener(RFQ_SESSION_UPDATE_EVENT, handler);
}

/**
 * Construye enlace compartible `Ingeniero -> Compras` hacia /cotizar/ o /en/quote/.
 */
export function buildShareableRfqUrl(opts = {}) {
  const lang = String(opts.lang || 'es').toLowerCase() === 'en' ? 'en' : 'es';
  const session = opts.session || loadRfqSession();
  const token = encodeRfqSharePayload(session);
  const path = lang === 'en' ? '/en/quote/' : '/cotizar/';
  const origin = String(opts.origin || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '')).replace(/\/$/, '');
  return `${origin}${path}?${RFQ_SHARE_QUERY_PARAM}=${encodeURIComponent(token)}#rfq`;
}

/**
 * Hidrata `smat_rfq_session_v3` si la URL incluye `?rfq_v3=...` respetando `dirtyFields`.
 */
export function hydrateRfqSessionFromUrl(searchString = '') {
  const rawSearch = searchString || (typeof window !== 'undefined' ? window.location?.search || '' : '');
  const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
  const token = params.get(RFQ_SHARE_QUERY_PARAM);
  if (!token) return { hydrated: false, session: loadRfqSession() };
  const decoded = decodeRfqSharePayload(token);
  if (!decoded) return { hydrated: false, session: loadRfqSession() };

  const current = loadRfqSession();
  const next = { ...current };
  for (const [k, v] of Object.entries(decoded.plantContext || {})) {
    if (!v || isFieldUserDirty(k, current)) continue;
    next.plantContext[k] = v;
  }
  if (Array.isArray(decoded.items) && decoded.items.length > 0 && current.items.length === 0) {
    next.items = decoded.items.map((it) => normalizeItem(it)).filter(Boolean);
  }
  next.stationSnapshots = {
    ...(decoded.stationSnapshots || {}),
    ...(current.stationSnapshots || {}),
  };
  return { hydrated: true, session: saveRfqSession(next) };
}
