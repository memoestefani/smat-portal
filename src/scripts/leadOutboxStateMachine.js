// @ts-check
/**
 * leadOutboxStateMachine.js
 * ---------------------------------------------------------------------------
 * Máquina de estados finitos (FSM) honesta y sin dependencias externas para
 * despacho de requisiciones / webhooks B2B (patrón `tiagoccepp/offline-outbox-js`, MIT).
 *
 * Garantía anti-placebo (ARB-SMAT-60): jamás reporta estado `CONFIRMADO_HTTP_200`
 * ni `SENT` sin verificación explícita de URL real configurada y `HTTP 200`.
 */

export const WEBHOOK_OUTBOX_STATES = Object.freeze({
  DRAFT_LOCAL: 'BORRADOR_LOCAL',
  QUEUED_OFFLINE: 'EN_COLA_OFFLINE',
  CONFIRMED_HTTP_200: 'CONFIRMADO_HTTP_200',
  FAILED_HTTP: 'ERROR_HTTP',
});

const PLACEHOLDER_URL_FRAGMENTS = Object.freeze([
  'akfycbzsmatdurangoleadintakewebhook',
  'example.com',
  'localhost',
  'your_script_id',
  'placeholder',
  'changeme',
]);

/**
 * Determina si la URL de webhook configurada está vacía o es un marcador de posición.
 * @param {string} [url='']
 * @returns {boolean}
 */
export function isPlaceholderWebhookUrl(url = '') {
  const normalized = String(url || '').trim().toLowerCase();
  if (!normalized || !normalized.startsWith('http')) return true;
  return PLACEHOLDER_URL_FRAGMENTS.some((frag) => normalized.includes(frag));
}

/**
 * Recupera entradas de cola persistidas tras recarga: cualquier ítem en `sending`
 * sin acuse del servidor regresa a `pending` para evitar pérdida silenciosa.
 * @param {Array<Record<string, unknown>>} [entries=[]]
 * @returns {Array<Record<string, unknown>>}
 */
export function recoverInterruptedOutboxEntries(entries = []) {
  if (!Array.isArray(entries)) return [];
  return entries.map((item) => {
    if (!item || typeof item !== 'object') return item;
    return item.status === 'sending' ? { ...item, status: 'pending' } : { ...item };
  });
}

/**
 * Resuelve el estado real del despacho webhook con mensajes bilingües honestos.
 * @param {object} [params]
 * @returns {{
 *   state: string,
 *   dataAttr: string,
 *   cssClass: string,
 *   message: string,
 *   verifiedDelivery: boolean
 * }}
 */
export function resolveHonestWebhookStatus({
  endpointUrl = '',
  webhookFlag = '',
  httpStatus = 0,
  isOnline = true,
  isEn = false,
} = {}) {
  const flag = String(webhookFlag || '').trim().toLowerCase();
  const statusCode = Number(httpStatus) || 0;
  const placeholder = isPlaceholderWebhookUrl(endpointUrl);

  if (flag === 'blocked' || flag === 'honeypot_blocked' || (statusCode >= 400 && statusCode > 0) || flag === 'error' || flag === 'failed') {
    return {
      state: WEBHOOK_OUTBOX_STATES.FAILED_HTTP,
      dataAttr: 'blocked',
      cssClass: 'is-webhook-blocked',
      verifiedDelivery: false,
      message: isEn
        ? 'Webhook Status: HTTP Error — Local draft preserved; open Requisition Preview (A4) or send via WhatsApp / Email to Durango.'
        : 'Estado Webhook: Error HTTP — Borrador local resguardado; abra la Vista Previa de Requisición (A4) o envíe por WhatsApp / correo a Durango.',
    };
  }

  if ((statusCode === 200 || flag === 'confirmed_200') && !placeholder) {
    return {
      state: WEBHOOK_OUTBOX_STATES.CONFIRMED_HTTP_200,
      dataAttr: 'confirmed_200',
      cssClass: 'is-webhook-sent',
      verifiedDelivery: true,
      message: isEn
        ? 'Webhook Status: Confirmed (HTTP 200) — Durango Engineering verified receipt. View Requisition Preview (A4) anytime.'
        : 'Estado Webhook: Confirmado (HTTP 200) — Recepción verificada por Ingeniería Durango. Consulte su Vista Previa de Requisición (A4).',
    };
  }

  if (!isOnline || flag === 'queued' || flag === 'offline') {
    return {
      state: WEBHOOK_OUTBOX_STATES.QUEUED_OFFLINE,
      dataAttr: 'queued_offline',
      cssClass: 'is-webhook-blocked',
      verifiedDelivery: false,
      message: isEn
        ? 'Webhook Status: Offline Queue — Saved locally pending connectivity; open Requisition Preview (A4), WhatsApp or PDF.'
        : 'Estado Webhook: En Cola Offline — Guardado localmente sin conexión; listo para Vista Previa de Requisición (A4), WhatsApp o PDF.',
    };
  }

  return {
    state: WEBHOOK_OUTBOX_STATES.DRAFT_LOCAL,
    dataAttr: 'draft_local',
    cssClass: 'is-webhook-draft',
    verifiedDelivery: false,
    message: isEn
      ? 'Local Draft Saved — Use Requisition Preview (A4), WhatsApp, or Email below to dispatch to Durango Warehouse.'
      : 'Borrador Local Guardado — Use Vista Previa de Requisición (A4), WhatsApp o Correo abajo para enviar a Durango.',
  };
}

/**
 * Calcula retardo acotado con backoff exponencial + jitter determinista para reintentos de outbox.
 * @param {number} [attempt=1]
 * @returns {number}
 */
export function computeOutboxRetryJitterMs(attempt = 1) {
  const n = Math.max(1, Math.min(6, Math.floor(Number(attempt) || 1)));
  const expBase = Math.min(30000, 1000 * Math.pow(2, n - 1));
  const deterministicJitter = (n * 197) % 450;
  return expBase + deterministicJitter;
}

/**
 * Inserta o actualiza idempotentemente una entrada de requisición en la cola local offline-first.
 * @param {Array<Record<string, any>>} [entries=[]]
 * @param {Record<string, any>} [entry={}]
 * @returns {Array<Record<string, any>>}
 */
export function enqueueIdempotentOutboxEntry(entries = [], entry = {}) {
  const recovered = recoverInterruptedOutboxEntries(entries);
  const key = String(entry?.idempotencyKey || entry?.folio || '').trim();
  if (!key) return recovered;
  const nextItem = {
    ...entry,
    idempotencyKey: key,
    status: entry?.status || 'pending',
    attempts: Math.max(1, Number(entry?.attempts) || 1),
    updatedAt: entry?.updatedAt || new Date().toISOString(),
  };
  const filtered = recovered.filter((item) => item && item.idempotencyKey !== key);
  return [...filtered, nextItem];
}
