/**
 * SMAT Minerals — Despacho de Transporte Webhook Outbox (`SLICE-V54-05`)
 * Separa el transporte HTTP `fetch()` del núcleo puro exportador SAP/TSV
 * para respetar el Invariante Zero-Network en `sapAndLeadExportEngine.js`.
 */

import { DEFAULT_SMAT_LEAD_WEBHOOK_URL } from './districtProfilesAndSkuCatalog.js';
import { isPlaceholderWebhookUrl } from './leadOutboxStateMachine.js';
import { buildLeadWebhookPayload } from './sapAndLeadExportEngine.js';

/**
 * Despacho asíncrono con verificación real de código HTTP para la FSM outbox del Paso 3.
 * @param {Record<string, any>} [d={}]
 * @param {string} [channelOrigin='web_quote_outbox']
 * @param {string} [webhookUrl='']
 * @returns {Promise<{ httpStatus: number, dispatched: boolean, payload?: any, error?: string }>}
 */
export async function dispatchLeadWebhookAsync(d = {}, channelOrigin = 'web_quote_outbox', webhookUrl = '') {
  const honeypotVal = d.website || d.website_honeypot || '';
  if (honeypotVal && String(honeypotVal).trim().length > 0) {
    return { httpStatus: 403, dispatched: false, error: 'honeypot_blocked' };
  }
  const resolvedEndpoint = String(
    webhookUrl ||
    (typeof window !== 'undefined' && window.SMAT_LEAD_WEBHOOK_URL) ||
    DEFAULT_SMAT_LEAD_WEBHOOK_URL
  ).trim();
  if (isPlaceholderWebhookUrl(resolvedEndpoint) || typeof fetch !== 'function') {
    return { httpStatus: 0, dispatched: false };
  }
  const payload = buildLeadWebhookPayload(d, channelOrigin);
  try {
    const resp = await fetch(resolvedEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const code = Number(resp?.status) || (resp?.ok ? 200 : 500);
    return { httpStatus: code, dispatched: code === 200, payload };
  } catch (err) {
    return { httpStatus: 503, dispatched: false, payload, error: String(err?.message || err || 'network_error') };
  }
}
