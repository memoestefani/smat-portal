/**
 * SMAT Minerals — B2B Multi-Item Requisition Tray & Vendor Passport Bus (MVP v3.0 · D3, D5)
 * Implementa la Bandeja Persistente de Requisición Industrial (localStorage + CustomEvent),
 * la Regla de Prioridad Generalizada c*mu (Van Mieghem 1995) para bandeja de entrada en Durango,
 * el Pasaporte de Alta de Proveedor (vCard .vcf + JSON UNSPSC/ASTM) y el enlace de Reorden (s, S).
 */

import { resolveCanonicalSkuId } from './quickProductsCatalog.js';
import {
  calculateCoupledReorderWindowDays,
  computeCmuPriorityDescriptor,
  evaluateBearingCartridgeCoreTradeIn as evaluateBearingCartridgeCoreTradeInPure,
} from './requisitionPriorityAndJrpEngine.js';
import { loadRfqSession, saveRfqSession } from './rfqSessionStore.js';
import { computeSelectionOrderCodeHash } from './slurryEngine.js';
import { loadWorkbenchSession, saveWorkbenchSession, workbenchStateLens } from './workbenchBus.js';

export {
  calculateCoupledReorderWindowDays,
  computeCmuPriorityDescriptor
};

export const SMAT_TRAY_UPDATE_EVENT = 'smat:tray-updated';

const DEFAULT_TRAY_STATE = Object.freeze({
  version: 3,
  criticalityMode: 'UNSET',
  coreReturnEnabled: false,
  items: [],
  updatedAtIso: '2026-11-09T00:00:00.000Z'
});

/**
 * Normaliza un ítem individual de la bandeja de requisición B2B,
 * migrando transparentemente cualquier ID legado a su ID canónico SMAT-*.
 * @param {any} rawItem
 * @returns {any}
 */
function normalizeTrayItem(rawItem = {}) {
  const rawId = String(rawItem.skuId || rawItem.code || rawItem.id || 'SMAT-PUMP-IMP-AH').trim().toUpperCase();
  const id = String(resolveCanonicalSkuId(rawId) || rawId).trim().toUpperCase();
  const qty = Math.max(1, Math.min(999, Math.round(Number(rawItem.qty) || 1)));
  const criticalityMode = String(rawItem.criticalityMode || 'PARO_DE_LINEA').toUpperCase() === 'STOCK_SS'
    ? 'STOCK_SS'
    : 'PARO_DE_LINEA';

  return {
    id,
    skuId: id,
    atomicCode: String(rawItem.atomicCode || rawItem.code || id).trim().toUpperCase(),
    nameEs: String(rawItem.nameEs || rawItem.name_es || `Componente Industrial ${id}`).trim(),
    nameEn: String(rawItem.nameEn || rawItem.name_en || `Industrial Component ${id}`).trim(),
    circuit: String(rawItem.circuit || 'bombeo').trim().toLowerCase(),
    material: String(rawItem.material || 'Cr27 ASTM A532').trim(),
    unitWeightKg: Math.max(0.1, Number(rawItem.unitWeightKg ?? rawItem.weight_kg ?? 12.0)),
    qty,
    criticalityMode
  };
}

/**
 * Lee y normaliza el estado actual de la bandeja exclusivamente desde `rfqSessionStore`.
 * @param {any} [rawOverride=null]
 * @returns {any}
 */
export function getTrayState(rawOverride = null) {
  let raw = rawOverride;
  if (!raw && typeof window !== 'undefined') {
    try {
      const unified = loadRfqSession();
      raw = {
        items: Array.isArray(unified?.items) ? unified.items : [],
        coreReturnEnabled: Boolean(unified?.coreReturnEnabled),
        criticalityMode: unified?.plantContext?.urgency || 'UNSET',
        updatedAtIso: unified?.updatedAtIso,
      };
    } catch (_e) {
      raw = null;
    }
  }

  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_TRAY_STATE, items: [] };
  }

  const items = Array.isArray(raw.items)
    ? raw.items.map((item) => normalizeTrayItem(item)).filter((item) => Boolean(item.id))
    : [];

  const hasLineStopItem = items.some((i) => i.criticalityMode === 'PARO_DE_LINEA');
  const rawCrit = String(raw.criticalityMode || '').toUpperCase();
  const criticalityMode =
    items.length === 0 && rawCrit !== 'STOCK_SS' && rawCrit !== 'PARO_DE_LINEA'
      ? 'UNSET'
      : (rawCrit === 'STOCK_SS' && !hasLineStopItem ? 'STOCK_SS' : 'PARO_DE_LINEA');

  return {
    version: 3,
    criticalityMode,
    coreReturnEnabled: Boolean(raw.coreReturnEnabled),
    items,
    updatedAtIso: String(raw.updatedAtIso || DEFAULT_TRAY_STATE.updatedAtIso)
  };
}

/**
 * Persiste el estado de la bandeja únicamente en `smat_rfq_session_v3` y emite el evento DOM reactivo.
 * @param {any} nextState
 * @returns {any}
 */
export function saveTrayState(nextState = {}) {
  const normalized = getTrayState(nextState);
  if (typeof window !== 'undefined') {
    try {
      const unified = loadRfqSession();
      saveRfqSession({
        ...unified,
        items: normalized.items,
        coreReturnEnabled: Boolean(normalized.coreReturnEnabled),
        plantContext: {
          ...(unified.plantContext || {}),
          urgency: normalized.items.length > 0 ? normalized.criticalityMode : 'UNSET',
        },
      });
      if (normalized.items.length > 0) {
        syncTrayToWorkbenchStateLens(normalized);
      }
      if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent(SMAT_TRAY_UPDATE_EVENT, { detail: normalized }));
      }
    } catch (_e) { }
  }
  return normalized;
}

/**
 * Agrega o incrementa un SKU / pieza atómica en la bandeja de requisición.
 * @param {any} item
 * @param {any} [currentState=null]
 * @returns {any}
 */
export function addTrayItem(item = {}, currentState = null) {
  const state = getTrayState(currentState);
  const incoming = normalizeTrayItem(item);
  const existingIndex = state.items.findIndex((i) => i.id === incoming.id);

  const nextItems = [...state.items];
  if (existingIndex >= 0) {
    const prev = nextItems[existingIndex];
    nextItems[existingIndex] = normalizeTrayItem({
      ...prev,
      ...incoming,
      qty: prev.qty + incoming.qty
    });
  } else {
    nextItems.push(incoming);
  }

  return saveTrayState({
    ...state,
    criticalityMode: incoming.criticalityMode === 'PARO_DE_LINEA' ? 'PARO_DE_LINEA' : state.criticalityMode,
    items: nextItems,
    updatedAtIso: new Date().toISOString()
  });
}

/**
 * Elimina un SKU o pieza atómica de la bandeja por su identificador.
 * @param {string} skuOrCode
 * @param {any} [currentState=null]
 * @returns {any}
 */
export function removeTrayItem(skuOrCode = '', currentState = null) {
  const state = getTrayState(currentState);
  const rawTarget = String(skuOrCode || '').trim().toUpperCase();
  const canonicalTarget = String(resolveCanonicalSkuId(rawTarget) || rawTarget).trim().toUpperCase();
  const nextItems = state.items.filter(
    (i) =>
      i.id !== rawTarget &&
      i.id !== canonicalTarget &&
      i.skuId !== rawTarget &&
      i.skuId !== canonicalTarget &&
      i.atomicCode !== rawTarget
  );
  return saveTrayState({
    ...state,
    items: nextItems,
    updatedAtIso: new Date().toISOString()
  });
}

/**
 * Actualiza la cantidad y/o el modo de criticidad (PARO_DE_LINEA vs STOCK_SS) de una partida.
 * @param {string} skuOrCode
 * @param {number} qty
 * @param {string|null} [criticalityMode=null]
 * @param {any} [currentState=null]
 * @returns {any}
 */
export function updateTrayItemQty(skuOrCode = '', qty = 1, criticalityMode = null, currentState = null) {
  const state = getTrayState(currentState);
  const rawTarget = String(skuOrCode || '').trim().toUpperCase();
  const canonicalTarget = String(resolveCanonicalSkuId(rawTarget) || rawTarget).trim().toUpperCase();
  const safeQty = Math.max(0, Math.min(999, Math.round(Number(qty) || 0)));

  if (safeQty === 0) {
    return removeTrayItem(canonicalTarget, state);
  }

  const nextItems = state.items.map((item) => {
    if (
      item.id === rawTarget ||
      item.id === canonicalTarget ||
      item.skuId === rawTarget ||
      item.skuId === canonicalTarget ||
      item.atomicCode === rawTarget
    ) {
      return normalizeTrayItem({
        ...item,
        qty: safeQty,
        criticalityMode: criticalityMode || item.criticalityMode
      });
    }
    return item;
  });

  return saveTrayState({
    ...state,
    items: nextItems,
    updatedAtIso: new Date().toISOString()
  });
}

/**
 * Vacía la bandeja de requisición.
 * @returns {any}
 */
export function clearTray() {
  return saveTrayState({ ...DEFAULT_TRAY_STATE, items: [] });
}

/**
 * Construye la línea de asunto de enrutamiento prioritario bajo la regla generalizada c*mu
 * (Van Mieghem 1995) para clasificación instantánea en bandeja de ingeniería de aplicación.
 * Formato: [SMAT-DGO] [PARO DE LÍNEA | C_v=58% Cr27 | 3 SKUs | Ref: SMAT-XXXX-YYYY]
 *
 * @param {any} [trayState={}]
 * @param {any} [telemetry={}]
 * @returns {string}
 */
export function buildCmuPrioritySubjectLine(trayState = {}, telemetry = {}) {
  const state = getTrayState(trayState);
  const isEn = String(telemetry?.lang || (typeof document !== 'undefined' ? document.documentElement?.lang : '') || '').toLowerCase() === 'en';
  if (!state.items.length) {
    return isEn
      ? '[SMAT-DGO] [DRAFT — NO ACTIVE ITEMS | Add SKUs or paste BOM]'
      : '[SMAT-DGO] [BORRADOR — SIN PARTIDAS | Agregue SKUs o pegue lista BOM]';
  }
  const skuCount = state.items.length;
  const isLineStop = state.criticalityMode === 'PARO_DE_LINEA' || state.items.some((i) => i.criticalityMode === 'PARO_DE_LINEA');
  const modeTag = isLineStop
    ? (isEn ? 'LINE-STOP' : 'PARO DE LÍNEA')
    : (isEn ? 'STOCK REPLENISHMENT' : 'REPOSICIÓN DE STOCK');
  const skuLabel = skuCount === 1 ? '1 SKU' : `${skuCount} SKUs`;

  const cvPct = Math.round(Number(telemetry.cvPct ?? telemetry.solidsVolumetricPercent ?? telemetry.cwPct ?? 48));
  const rawMat = String(telemetry.material || (state.items[0] && state.items[0].material) || 'Cr27').toUpperCase();
  let alloyShort = 'Cr27';
  if (rawMat.includes('SIC') || rawMat.includes('CERAM')) alloyShort = 'SiC';
  else if (rawMat.includes('R55') || rawMat.includes('HULE') || rawMat.includes('RUBBER')) alloyShort = 'R55';
  else if (rawMat.includes('PU') || rawMat.includes('U01') || rawMat.includes('POLI')) alloyShort = 'PU-U01';

  const orderHash = telemetry.orderHash || computeSelectionOrderCodeHash({
    mode: isLineStop ? 'PARO DE LÍNEA' : 'REPOSICIÓN DE STOCK',
    skus: state.items.map((i) => `${i.id}x${i.qty}`).join(','),
    alloy: alloyShort,
    cv: cvPct
  });

  return `[SMAT-DGO] [${modeTag} | C_v=${cvPct}% ${alloyShort} | ${skuLabel} | Ref: ${orderHash}]`;
}

/**
 * Construye el Pasaporte de Alta de Proveedor B2B (vCard .vcf + JSON estructurado UNSPSC/Incoterms)
 * para compras mineras (SAP Ariba, Coupa, Oracle Procurement).
 *
 * @param {any} [companyMeta={}]
 * @returns {any}
 */
export function buildSmatVendorPassportPayload(companyMeta = {}) {
  const companyName = String(companyMeta.legalName || 'SMAT Minerals S.A. de C.V.');
  const industrialHub = 'Centro Logístico e Ingeniería de Aplicación: Mariano Salas #114, Col. Primer Presidente, Durango, DGO, C.P. 34166, México';
  const rfcStatus = 'Persona Moral Régimen General de Ley • Opinión de Cumplimiento SAT 32-D Positiva Vigente • REPSE / Padrón Minero';
  const incoterms = ['EXW Almacén Central Durango (Cotejo Dimensional 1:1 en Patio)', 'DAP Unidad Minera (Coordinación Directa con Folio Técnico)'];
  const unspscCodes = [
    { code: '40151500', descriptionEs: 'Bombas centrífugas para lodos abrasivos y repuestos de extremo húmedo', descriptionEn: 'Centrifugal slurry pumps and wet-end wear parts' },
    { code: '20121500', descriptionEs: 'Equipos de molienda, clasificación por hidrociclones y celdas de flotación', descriptionEn: 'Milling, hydrocyclone classification, and flotation cell equipment' },
    { code: '40161500', descriptionEs: 'Filtros prensa de placas empotradas, telas filtrantes y deshidratación de jales', descriptionEn: 'Recessed plate filter presses, filter cloths, and tailings dewatering' },
    { code: '41111500', descriptionEs: 'Instrumentación metalúrgica de planta: Balanzas Marcy, filtros LPLT y tamices ASTM E11', descriptionEn: 'Metallurgical plant instrumentation: Marcy scales, LPLT filters, and ASTM E11 sieves' }
  ];
  const metallurgyCert = 'Certificación de Colada ASTM A532 Clase III Tipo A (27% Cr, >= 650 HB / >= 58 HRC), Elastómero Natural Anti-Abrasivo Shore A 40-70 y Carburo de Silicio Sinterizado (SiC)';

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${companyName}`,
    `ORG:${companyName};Ingeniería de Aplicación y Suministro Minero`,
    'TITLE:Proveedor Industrial B2B • Bombas de Lodos, Hidrociclones, Flotación y Filtración',
    'TEL;TYPE=WORK,VOICE:+52-618-810-4408',
    'TEL;TYPE=CELL,VOICE:+52-618-367-0664',
    'EMAIL;TYPE=PREF,INTERNET:ventas@smatminerals.com',
    'EMAIL;TYPE=INTERNET:contacto@smatminerals.com',
    'ADR;TYPE=WORK:;;Mariano Salas #114, Col. Primer Presidente;Durango;DGO;34166;México',
    'URL:https://smatminerals.com',
    'NOTE:UNSPSC 40151500 / 20121500 / 40161500 / 41111500 | Incoterms EXW/DAP Durango | ASTM A532 Cr27 >= 650 HB',
    'END:VCARD'
  ];

  const jsonMetadata = {
    schema: 'smat.vendor.passport.v3',
    companyName,
    rfcStatus,
    cfdiVersion: '4.0',
    satRegimeCode: '601 - General de Ley Personas Morales',
    defaultCfdiUse: 'G01 (Adquisición de mercancías) / G03 (Gastos en general) / I08 (Otra maquinaria y equipo)',
    postalCode: '34166',
    currencySupport: ['MXN', 'USD'],
    industrialHub,
    contact: {
      salesEmail: 'ventas@smatminerals.com',
      engineeringEmail: 'contacto@smatminerals.com',
      phoneOffice: '+52 618 810 4408',
      phoneWhatsapp: '+52 618 367 0664'
    },
    incoterms,
    unspscCodes,
    metallurgyCert
  };

  return {
    companyName,
    rfcStatus,
    industrialHub,
    incoterms,
    unspscCodes,
    metallurgyCert,
    vcardText: vcardLines.join('\r\n'),
    jsonMetadata
  };
}

/**
 * Codifica las partidas actuales de la bandeja en un query string compacto (?reorder=1&tray=...)
 * para permitir reordenar bajo política de inventario (s, S) a 1 clic desde el acuse PDF/HTML.
 *
 * @param {any} [trayState={}]
 * @returns {string}
 */
export function encodeReorderUrlQuery(trayState = {}) {
  const state = getTrayState(trayState);
  if (!state.items.length) {
    return '?reorder=1&tray=SMAT-PUMP-IMP-AH:1:PARO_DE_LINEA';
  }
  const serialized = state.items
    .map((item) => `${encodeURIComponent(item.id)}:${item.qty}:${item.criticalityMode}`)
    .join(',');
  return `?reorder=1&tray=${serialized}`;
}

/**
 * Hidrata una bandeja de requisición a partir del query string de reorden (?reorder=1&tray=...).
 *
 * @param {string} [searchString='']
 * @returns {any}
 */
export function hydrateTrayFromReorderQuery(searchString = '') {
  const raw = String(searchString || '').trim();
  const cleanSearch = raw.startsWith('?') ? raw.slice(1) : raw;
  const params = new URLSearchParams(cleanSearch);
  const trayParam = params.get('tray') || '';
  if (!trayParam) {
    return getTrayState();
  }

  const rawTrayTokens = trayParam.split(',').map((s) => s.trim()).filter(Boolean);
  const items = rawTrayTokens.map((rawToken) => {
    const [idRaw, qtyRaw, modeRaw] = rawToken.split(':');
    return normalizeTrayItem({
      id: decodeURIComponent(idRaw || 'SMAT-PUMP-IMP-AH'),
      skuId: decodeURIComponent(idRaw || 'SMAT-PUMP-IMP-AH'),
      qty: Number(qtyRaw) || 1,
      criticalityMode: modeRaw === 'STOCK_SS' ? 'STOCK_SS' : 'PARO_DE_LINEA'
    });
  });

  return saveTrayState({
    version: 3,
    criticalityMode: items.some((i) => i.criticalityMode === 'PARO_DE_LINEA') ? 'PARO_DE_LINEA' : 'STOCK_SS',
    items,
    updatedAtIso: new Date().toISOString()
  });
}

/**
 * Evalúa la economía circular Core Trade-In DAM005 delegando al núcleo Zero-DOM
 * mientras hidrata `getTrayState()` cuando no se provee estado explícito.
 *
 * @param {any} [trayState=null]
 * @param {boolean|string|null} [coreReturnOverride=null]
 * @returns {any}
 */
export function evaluateBearingCartridgeCoreTradeIn(trayState = null, coreReturnOverride = null) {
  const state = trayState ? getTrayState(trayState) : getTrayState();
  return evaluateBearingCartridgeCoreTradeInPure(state, coreReturnOverride);
}

/**
 * Lente Simétrica Bidireccional (Hofmann et al., POPL 2011; Foster et al., 2007)
 * que sincroniza la bandeja B2B (`smat_requisition_tray_v3`) con el estado canónico
 * del Workbench (`smat_workbench_state_v2`) garantizando las leyes GetPut y PutGet.
 *
 * @param {any} [trayState={}]
 * @param {any} [baseWorkbenchState=null]
 * @returns {any}
 */
export function syncTrayToWorkbenchStateLens(trayState = {}, baseWorkbenchState = null) {
  const state = getTrayState(trayState);
  const currentWb = baseWorkbenchState || loadWorkbenchSession() || {};
  const leadItem = state.items[0] || null;
  const tradeIn = evaluateBearingCartridgeCoreTradeIn(state, state.coreReturnEnabled);

  const skuSummary = state.items.map((i) => `${i.id}x${i.qty}`).join(', ');
  const patch = {
    trayItemsCount: state.items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0),
    traySkuSummary: skuSummary,
    coreTradeInEnabled: tradeIn.coreReturnEnabled,
    coreTradeInDiscountPct: tradeIn.discountPct
  };

  if (leadItem) {
    if (leadItem.circuit) patch.circuit = leadItem.circuit;
    if (leadItem.material) patch.pump_material = leadItem.material;
    const prevRef = String(currentWb.clientRef || '').trim();
    const isAutoGeneratedRef = !prevRef || prevRef.includes('SMAT-') || /x\d+\b/i.test(prevRef);
    patch.clientRef = isAutoGeneratedRef ? skuSummary : prevRef;
  }

  const nextWb = workbenchStateLens.put(currentWb, patch);
  saveWorkbenchSession(nextWb);
  return nextWb;
}

