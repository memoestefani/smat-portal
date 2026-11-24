import {
  WEBHOOK_OUTBOX_STATES,
  isPlaceholderWebhookUrl,
  recoverInterruptedOutboxEntries,
  enqueueIdempotentOutboxEntry,
  resolveHonestWebhookStatus,
  computeOutboxRetryJitterMs,
} from './leadOutboxStateMachine.js';
import { dispatchLeadWebhookAsync } from './leadWebhookTransport.js';

/**
 * Monta la cola outbox idempotente y navegacion FSM del asistente en DOM vivo.
 * @param {Document} [doc]
 * @param {Window} [win]
 */
export function initQuoteOutboxController(
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null
) {
  if (!doc || !win) return;
  const OUTBOX_STORAGE_KEY = 'smat_lead_outbox_v1';
  const readOutboxQueue = () => {
    try {
      const raw = win.localStorage?.getItem(OUTBOX_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const recovered = recoverInterruptedOutboxEntries(Array.isArray(parsed) ? parsed : []);
      win.localStorage?.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(recovered));
      return recovered;
    } catch {
      return [];
    }
  };
  readOutboxQueue();

  const resolveEndpointUrl = () => (
    doc.getElementById('rfq')?.getAttribute('data-lead-endpoint') ||
    win.SMAT_LEAD_WEBHOOK_URL ||
    ''
  ).trim();

  const renderOutboxStatus = (attemptCount = 1, httpStatus = 0) => {
    const statusEl = doc.getElementById('wb-outbox-status-msg');
    if (!statusEl) return null;
    const isEn = doc.documentElement?.lang === 'en';
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    const endpointUrl = resolveEndpointUrl();
    const resolution = resolveHonestWebhookStatus({ endpointUrl, httpStatus, isOnline, isEn });
    statusEl.textContent = resolution.message;
    statusEl.setAttribute('data-outbox-state', resolution.dataAttr);
    statusEl.className = `wb-outbox-status font-mono-tech ${resolution.cssClass}`;
    win.dispatchEvent(new CustomEvent('smat:outbox-updated', { detail: { attemptCount, isOnline, state: resolution.state } }));
    return resolution;
  };

  const outboxBtn = doc.getElementById('wb-submit-outbox-btn');
  if (outboxBtn && outboxBtn.getAttribute('data-outbox-bound') !== '1') {
    outboxBtn.setAttribute('data-outbox-bound', '1');
    outboxBtn.addEventListener('click', async () => {
      const folio = (doc.getElementById('live-folio')?.textContent || 'SMAT-2026-8810').trim();
      const email = doc.getElementById('wb-email')?.value?.trim() || '';
      const name = doc.getElementById('wb-name')?.value?.trim() || '';
      const company = doc.getElementById('wb-company')?.value?.trim() || '';
      const phone = doc.getElementById('wb-phone')?.value?.trim() || '';
      const details = doc.getElementById('wb-details')?.value?.trim() || '';
      const endpointUrl = resolveEndpointUrl();
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
      const canDispatchNow = isOnline && !isPlaceholderWebhookUrl(endpointUrl);

      const updated = enqueueIdempotentOutboxEntry(readOutboxQueue(), {
        idempotencyKey: `${folio}:${email || 'anon'}`,
        folio,
        email,
        status: !isOnline ? 'pending' : (canDispatchNow ? 'sending' : 'draft'),
      });
      try {
        win.localStorage?.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      if (!canDispatchNow) {
        renderOutboxStatus(updated.length, 0);
        return;
      }

      const sendResult = await dispatchLeadWebhookAsync(
        { folio, name, company, phone, email, details },
        'web_quote_outbox',
        endpointUrl
      );
      const nextStatus = sendResult.httpStatus === 200 ? 'sent' : 'pending';
      const settled = enqueueIdempotentOutboxEntry(readOutboxQueue(), {
        idempotencyKey: `${folio}:${email || 'anon'}`,
        folio,
        email,
        status: nextStatus === 'sent' ? WEBHOOK_OUTBOX_STATES.CONFIRMED_HTTP_200 : 'pending',
      });
      try {
        win.localStorage?.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(settled));
      } catch {
        /* ignore */
      }
      renderOutboxStatus(settled.length, sendResult.httpStatus);
    });

    const flushPendingOutbox = async () => {
      const q = readOutboxQueue();
      const pending = q.filter((x) => x?.status === 'pending');
      if (pending.length === 0) {
        renderOutboxStatus(q.length, 0);
        return;
      }
      const endpointUrl = resolveEndpointUrl();
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
      if (!isOnline || isPlaceholderWebhookUrl(endpointUrl)) {
        renderOutboxStatus(q.length, 0);
        return;
      }
      let currentQueue = q;
      let lastHttp = 0;
      for (const entry of pending) {
        const res = await dispatchLeadWebhookAsync(
          { folio: entry.folio, email: entry.email || '' },
          'web_quote_outbox_retry',
          endpointUrl
        );
        lastHttp = res.httpStatus || 0;
        currentQueue = enqueueIdempotentOutboxEntry(currentQueue, {
          ...entry,
          attempts: (Number(entry.attempts) || 1) + 1,
          status: lastHttp === 200 ? WEBHOOK_OUTBOX_STATES.CONFIRMED_HTTP_200 : 'pending',
        });
      }
      try {
        win.localStorage?.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(currentQueue));
      } catch {
        /* ignore */
      }
      renderOutboxStatus(currentQueue.length, lastHttp);
    };

    win.addEventListener('online', () => {
      const q = readOutboxQueue();
      if (!q.some((x) => x?.status === 'pending')) return;
      const delayMs = computeOutboxRetryJitterMs(q.length);
      win.setTimeout(() => { void flushPendingOutbox(); }, Math.min(delayMs, 2500));
    });
    win.addEventListener('smat:outbox-retry', () => { void flushPendingOutbox(); });
  }

  doc.querySelectorAll('.qw-fsm-nav-btn[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target') || '';
      const targetEl = targetId ? doc.getElementById(targetId) : null;
      if (!targetEl) return;
      const detailsEl = targetEl.querySelector('details');
      if (detailsEl) detailsEl.open = true;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
