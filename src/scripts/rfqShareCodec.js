/**
 * rfqShareCodec.js
 * ---------------------------------------------------------------------------
 * Codec URL-safe determinista y compacto (?rfq_v3=...) para transferir una
 * requisicion completa de Ingeniero a Compras en 1 clic sin servidor (cero costo de nube).
 * Inspirado en `afeiship/url-state-codec` y `bepalo/rjson` (D3-V55).
 */

export const RFQ_SHARE_QUERY_PARAM = 'rfq_v3';
export const RFQ_SHARE_MAX_CHARS = 1800;

function toBase64UrlUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  const b64 = typeof btoa === 'function'
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64UrlUtf8(token) {
  const padded = String(token || '').replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = `${padded}${'='.repeat(padLen)}`;
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

function sanitizeShareStationSnapshot(snap = {}) {
  if (!snap || typeof snap !== 'object') return null;
  const clean = {};
  for (const [k, v] of Object.entries(snap)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'number' && Number.isFinite(v)) clean[k] = Number(v.toFixed(4));
    else if (typeof v === 'boolean') clean[k] = v;
    else if (typeof v === 'string') clean[k] = v.slice(0, 64);
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Codifica el estado compartido de requisicion B2B dentro del limite URL-safe.
 * @param {Record<string, any>} session
 * @returns {string}
 */
export function encodeRfqSharePayload(session = {}) {
  const ctx = session.plantContext || {};
  const rawItems = Array.isArray(session.items) ? session.items : [];
  const compactItems = rawItems
    .slice(0, 24)
    .map((it) => [
      String(it.skuId || it.id || '').trim().toUpperCase().slice(0, 48),
      Math.max(1, Math.min(999, Math.round(Number(it.qty) || 1))),
      it.criticalityMode === 'STOCK_SS' ? 'S' : 'P',
    ])
    .filter(([id]) => Boolean(id));

  const stations = {};
  const rawSnaps = session.stationSnapshots || {};
  for (const [key, val] of Object.entries(rawSnaps)) {
    const s = sanitizeShareStationSnapshot(val);
    if (s) stations[key.slice(0, 20)] = s;
  }

  const compact = {
    v: 3,
    p: {
      g: String(ctx.miningGroupId || '').slice(0, 40),
      u: String(ctx.miningUnitName || '').slice(0, 80),
      c: String(ctx.company || '').slice(0, 80),
      k: String(ctx.circuit || 'bombeo').slice(0, 24),
      r: ctx.urgency === 'STOCK_SS' ? 'S' : 'P',
    },
    i: compactItems,
    s: stations,
  };

  let token = toBase64UrlUtf8(JSON.stringify(compact));
  if (token.length > RFQ_SHARE_MAX_CHARS) {
    // Recorta memorias secundarias si excede presupuesto de enlace WhatsApp/Outlook
    compact.s = {};
    token = toBase64UrlUtf8(JSON.stringify(compact));
  }
  if (token.length > RFQ_SHARE_MAX_CHARS) {
    compact.i = compact.i.slice(0, 10);
    token = toBase64UrlUtf8(JSON.stringify(compact));
  }
  return token.slice(0, RFQ_SHARE_MAX_CHARS);
}

/**
 * Decodifica un token `?rfq_v3=...` de forma segura devolviendo `null` si es invalido.
 * @param {string} rawToken
 * @returns {Record<string, any> | null}
 */
export function decodeRfqSharePayload(rawToken = '') {
  const clean = String(rawToken || '').trim();
  if (!clean || clean.length > RFQ_SHARE_MAX_CHARS) return null;
  if (!/^[A-Za-z0-9\-_]+$/.test(clean)) return null;
  try {
    const parsed = JSON.parse(fromBase64UrlUtf8(clean));
    if (!parsed || typeof parsed !== 'object' || parsed.v !== 3) return null;
    const p = parsed.p && typeof parsed.p === 'object' ? parsed.p : {};
    const items = Array.isArray(parsed.i)
      ? parsed.i
          .filter((row) => Array.isArray(row) && typeof row[0] === 'string' && row[0].trim())
          .map((row) => ({
            id: String(row[0]).trim().toUpperCase(),
            skuId: String(row[0]).trim().toUpperCase(),
            qty: Math.max(1, Math.min(999, Math.round(Number(row[1]) || 1))),
            criticalityMode: row[2] === 'S' ? 'STOCK_SS' : 'PARO_DE_LINEA',
          }))
      : [];
    const stationSnapshots = {};
    if (parsed.s && typeof parsed.s === 'object') {
      for (const [k, v] of Object.entries(parsed.s)) {
        const sanitized = sanitizeShareStationSnapshot(v);
        if (sanitized) stationSnapshots[k] = sanitized;
      }
    }
    return {
      version: 3,
      plantContext: {
        miningGroupId: String(p.g || ''),
        miningUnitName: String(p.u || ''),
        company: String(p.c || ''),
        circuit: String(p.k || 'bombeo'),
        urgency: p.r === 'S' ? 'STOCK_SS' : 'PARO_DE_LINEA',
      },
      items,
      stationSnapshots,
    };
  } catch (_e) {
    return null;
  }
}
