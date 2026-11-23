import {
  recoverInterruptedOutboxEntries,
  enqueueIdempotentOutboxEntry,
  resolveHonestWebhookStatus,
  computeOutboxRetryJitterMs,
} from './leadOutboxStateMachine.js';

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

  const renderOutboxStatus = (attemptCount = 1) => {
    const statusEl = doc.getElementById('wb-outbox-status-msg');
    if (!statusEl) return;
    const isEn = doc.documentElement?.lang === 'en';
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    const resolution = resolveHonestWebhookStatus({ endpointUrl: '', isOnline, isEn });
    statusEl.textContent = resolution.message;
    statusEl.className = `wb-outbox-status font-mono-tech ${resolution.cssClass}`;
    win.dispatchEvent(new CustomEvent('smat:outbox-updated', { detail: { attemptCount, isOnline } }));
  };

  const outboxBtn = doc.getElementById('wb-submit-outbox-btn');
  if (outboxBtn && outboxBtn.getAttribute('data-outbox-bound') !== '1') {
    outboxBtn.setAttribute('data-outbox-bound', '1');
    outboxBtn.addEventListener('click', () => {
      const folio = (doc.getElementById('live-folio')?.textContent || 'SMAT-2026-8810').trim();
      const email = doc.getElementById('wb-email')?.value?.trim() || '';
      const updated = enqueueIdempotentOutboxEntry(readOutboxQueue(), {
        idempotencyKey: `${folio}:${email || 'anon'}`,
        folio,
        email,
        status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'pending' : 'draft',
      });
      try {
        win.localStorage?.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      renderOutboxStatus(updated.length);
    });

    win.addEventListener('online', () => {
      const q = readOutboxQueue();
      if (!q.some((x) => x?.status === 'pending')) return;
      const delayMs = computeOutboxRetryJitterMs(q.length);
      win.setTimeout(() => renderOutboxStatus(q.length), Math.min(delayMs, 2500));
    });
    win.addEventListener('smat:outbox-retry', () => renderOutboxStatus(readOutboxQueue().length));
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
