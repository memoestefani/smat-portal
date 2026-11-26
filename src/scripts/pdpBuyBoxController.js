// @ts-check
/**
 * pdpBuyBoxController.js
 * ---------------------------------------------------------------------------
 * Controlador de interacción del Buy Box, chips de aleación, Lightbox HD y
 * widgets JRP/Intercambio en ProductDetailIsland.astro (SLICE-V10-C11 / LCOM4 C2).
 */
import { initCoreTradeInWidgets } from './vendorPassportAndTradeInController.js';
import { initHarmonicJrpWindowAndPairCard } from './catalogDropInAndJrpProjector.js';

/**
 * Inicializa todos los controles interactivos del Buy Box PDP.
 * @param {Document | null} [doc]
 */
export function initProductDetailIsland(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || typeof doc.querySelector !== 'function') return;
  const root = /** @type {HTMLElement | null} */ (doc.querySelector('[data-pdp-root]'));
  if (!root) return;

  const lang = root.dataset.lang === 'en' ? 'en' : 'es';
  initCoreTradeInWidgets(root, lang);
  initHarmonicJrpWindowAndPairCard(root, lang);

  const lightbox = /** @type {HTMLDialogElement | null} */ (doc.getElementById('smat-pdp-lightbox'));
  const lightboxImg = /** @type {HTMLImageElement | null} */ (doc.getElementById('smat-lightbox-img'));
  const lightboxCloseBtn = /** @type {HTMLButtonElement | null} */ (lightbox?.querySelector('[data-lightbox-close]') || null);

  if (lightbox && lightboxImg) {
    root.querySelectorAll('[data-lightbox-open]').forEach((btn) => {
      const openBtn = /** @type {HTMLElement} */ (btn);
      if (openBtn.dataset.lightboxBound === '1') return;
      openBtn.dataset.lightboxBound = '1';
      openBtn.addEventListener('click', () => {
        const activePhotoPanel = /** @type {HTMLImageElement | null} */ (
          root.querySelector('.smat-qcard-panel--photo:not(.hidden) img.smat-qcard-photo')
        );
        const firstPhoto = /** @type {HTMLImageElement | null} */ (root.querySelector('img.smat-qcard-photo'));
        const baseSrc = activePhotoPanel?.getAttribute('src') || firstPhoto?.getAttribute('src') || '';
        if (baseSrc) {
          const hdSrc = baseSrc.includes('-hd.webp') ? baseSrc : baseSrc.replace(/\.webp(\?.*)?$/, '-hd.webp');
          lightboxImg.onerror = () => {
            lightboxImg.onerror = null;
            lightboxImg.src = baseSrc;
          };
          lightboxImg.src = hdSrc;
        }
        if (typeof lightbox.showModal === 'function' && !lightbox.open) {
          lightbox.showModal();
        }
      });
    });

    if (lightboxCloseBtn && lightboxCloseBtn.dataset.closeBound !== '1') {
      lightboxCloseBtn.dataset.closeBound = '1';
      lightboxCloseBtn.addEventListener('click', () => lightbox.close());
    }
    if (lightbox.dataset.backdropBound !== '1') {
      lightbox.dataset.backdropBound = '1';
      lightbox.addEventListener('click', (ev) => {
        if (ev.target === lightbox) lightbox.close();
      });
    }
  }

  const winEl = doc.getElementById('wb-jrp-window-days');
  if (winEl && !winEl.dataset.sepAdded) {
    winEl.dataset.sepAdded = '1';
    winEl.insertAdjacentText('afterend', ' · ');
  }

  const matSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-slug-mat-select]'));
  const alloyChips = Array.from(root.querySelectorAll('[data-alloy-chip]'));
  const qtyInput = /** @type {HTMLInputElement | null} */ (root.querySelector('#slug-qty-input'));
  const trayBtn = /** @type {HTMLElement | null} */ (root.querySelector('[data-slug-add-to-tray]'));
  const waBtn = /** @type {HTMLAnchorElement | null} */ (root.querySelector('[data-slug-wa-btn]'));
  const wbBtn = /** @type {HTMLAnchorElement | null} */ (root.querySelector('[data-slug-workbench-btn]'));

  const syncAlloyChipState = (activeVal) => {
    alloyChips.forEach((chipEl) => {
      const val = chipEl.getAttribute('data-alloy-chip') || '';
      const active = val === activeVal;
      chipEl.classList.toggle('is-active', active);
      chipEl.classList.toggle('is-default', active);
      chipEl.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const syncControls = () => {
    const mat = matSelect?.value || '';
    const qty = Math.max(1, Math.min(999, Number(qtyInput?.value) || 1));
    if (mat) syncAlloyChipState(mat);

    if (trayBtn) {
      if (mat) trayBtn.setAttribute('data-sku-material', mat);
      trayBtn.setAttribute('data-sku-qty', String(qty));
    }
    if (waBtn && mat) {
      const skuId = waBtn.getAttribute('data-sku-id') || '';
      const skuTitle = waBtn.getAttribute('data-sku-title') || '';
      const mass = waBtn.getAttribute('data-sku-mass') || '15';
      const isEn = lang === 'en';
      const msg = isEn
        ? `[SMAT-DGO] Hello SMAT, please confirm availability and lead time for ${qty}x ${skuId} (${skuTitle}) in ${mat} [Mass: ${mass} kg].`
        : `[SMAT-DGO] Hola SMAT, solicito confirmar disponibilidad para ${qty}x ${skuId} (${skuTitle}) en ${mat} [Masa: ${mass} kg].`;
      waBtn.href = `https://wa.me/526183670664?text=${encodeURIComponent(msg)}`;
    }
    if (wbBtn && mat) {
      const skuId = wbBtn.getAttribute('data-sku-id') || '';
      const base = lang === 'en' ? '/en/quote/' : '/cotizar/';
      wbBtn.href = `${base}?sku=${encodeURIComponent(skuId)}&mat=${encodeURIComponent(mat)}&qty=${qty}#rfq`;
    }
  };

  alloyChips.forEach((chipEl) => {
    const btn = /** @type {HTMLElement} */ (chipEl);
    if (btn.dataset.alloyBound === '1') return;
    btn.dataset.alloyBound = '1';
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-alloy-chip') || '';
      if (matSelect && val) {
        matSelect.value = val;
        matSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  if (matSelect && matSelect.dataset.slugBound !== '1') {
    matSelect.dataset.slugBound = '1';
    matSelect.addEventListener('change', syncControls);
    syncControls();
  }

  if (qtyInput && qtyInput.dataset.slugBound !== '1') {
    qtyInput.dataset.slugBound = '1';
    qtyInput.addEventListener('input', syncControls);
    qtyInput.addEventListener('change', syncControls);
  }

  root.querySelectorAll('input[data-tradein-mode]').forEach((radio) => {
    const inputEl = /** @type {HTMLInputElement} */ (radio);
    if (inputEl.dataset.tradeinRadioBound === '1') return;
    inputEl.dataset.tradeinRadioBound = '1';
    inputEl.addEventListener('change', () => {
      if (!inputEl.checked) return;
      const modeVal = inputEl.getAttribute('data-tradein-mode') || 'new';
      if (trayBtn) trayBtn.setAttribute('data-sku-tradein', modeVal);
      const coreToggle = /** @type {HTMLInputElement | null} */ (root.querySelector('#wb-core-tradein-toggle'));
      if (coreToggle) {
        coreToggle.checked = modeVal === 'exchange';
        coreToggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}
