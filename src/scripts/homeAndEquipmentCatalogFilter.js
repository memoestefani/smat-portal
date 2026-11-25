// @ts-check
/**
 * Faceted Catalog Filter, Atomic Parts Filter & URL Query Sync (`SLICE-V80-B02`)
 */

import { bindDropInEquivalenceVerifier } from './catalogDropInAndJrpProjector.js';

/**
 * Evaluates whether a canonical SKU card matches the active family filter chip.
 * @param {string} skuId
 * @param {string} vertical
 * @param {string} filterId
 * @returns {boolean}
 */
function matchesFamilyFilter(skuId = '', vertical = '', filterId = 'all') {
  if (!filterId || filterId === 'all') return true;
  if (filterId === 'atomicas') return false;
  if (filterId === 'tamices') {
    return skuId === 'SMAT-LAB-TAMIZ-E11' || skuId === 'SMAT-LAB-ROTAP-MECH';
  }
  if (filterId === 'sello_potencia') {
    return skuId === 'SMAT-PUMP-EXPELLER-KIT' || skuId === 'SMAT-PUMP-BRG-005M';
  }
  return vertical === filterId;
}

/**
 * Evaluates multi-token boolean AND lexical matching against a pre-indexed search blob.
 * @param {string} searchBlob
 * @param {string} rawQuery
 * @returns {boolean}
 */
function matchesEquipmentSearchQuery(searchBlob = '', rawQuery = '') {
  const tokens = String(rawQuery || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const normalizedBlob = String(searchBlob || '').toLowerCase();
  return tokens.every((token) => normalizedBlob.includes(token));
}

/**
 * Applies faceted family + avenue filters across all SKU cards and atomic cards without cloning.
 * @param {ParentNode} root
 * @param {string} [filterId='all']
 * @param {string} [avenueFilter='all']
 * @param {string} [rawQuery='']
 * @returns {{ visibleCards: number, visibleGroups: number, visibleAtomics: number }}
 */
function applyHomeAvenueCatalogFilter(root, filterId = 'all', avenueFilter = 'all', rawQuery = '') {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return { visibleCards: 0, visibleGroups: 0, visibleAtomics: 0 };
  }

  const cards = root.querySelectorAll('[data-sku-family], [data-catalog-sku-id]');
  let visibleCards = 0;

  cards.forEach((el) => {
    const card = /** @type {HTMLElement} */ (el);
    const vertical = card.getAttribute('data-sku-family') || card.getAttribute('data-vertical') || '';
    const skuId = card.getAttribute('data-catalog-sku-id') || card.getAttribute('data-sku-id') || '';
    const facetAvenues = (card.getAttribute('data-facet-avenues') || card.getAttribute('data-primary-avenue') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const searchBlob = card.getAttribute('data-search-blob') || card.textContent || skuId;

    const matchFamily = matchesFamilyFilter(skuId, vertical, filterId);
    const matchAvenue = !avenueFilter || avenueFilter === 'all' || facetAvenues.includes(avenueFilter);
    const matchQuery = matchesEquipmentSearchQuery(searchBlob, rawQuery);
    const isMatch = matchFamily && matchAvenue && matchQuery;

    if (card.style) card.style.display = isMatch ? '' : 'none';
    card.setAttribute('data-filter-visible', isMatch ? 'true' : 'false');
    if (isMatch) visibleCards += 1;
  });

  let visibleAtomics = 0;
  const atomicCards = root.querySelectorAll('#fichas-atomicas .atomic-part-card');
  atomicCards.forEach((el) => {
    const ac = /** @type {HTMLElement} */ (el);
    const blob = [ac.getAttribute('data-part-code'), ac.textContent].filter(Boolean).join(' ');
    const isMatch = matchesEquipmentSearchQuery(blob, rawQuery);
    if (ac.style) ac.style.display = isMatch ? '' : 'none';
    if (isMatch) visibleAtomics += 1;
  });

  if (filterId === 'atomicas' && typeof root.querySelector === 'function') {
    const d1 = /** @type {HTMLDetailsElement | null} */ (root.querySelector('#catalog-bombeo-drawer'));
    const d2 = /** @type {HTMLDetailsElement | null} */ (root.querySelector('#catalog-alloys-and-parts-drawer'));
    if (d1) d1.open = true;
    if (d2) d2.open = true;
  }

  const countOut = typeof root.querySelector === 'function' ? root.querySelector('#catalog-visible-sku-count') : null;
  if (countOut) {
    countOut.textContent = String(filterId === 'atomicas' ? visibleAtomics : visibleCards);
  }

  const avenueGroups = root.querySelectorAll('[data-home-avenue-group], [data-catalog-avenue-section]');
  let visibleGroups = 0;

  avenueGroups.forEach((el) => {
    const group = /** @type {HTMLElement} */ (el);
    const groupCards = group.querySelectorAll('[data-sku-family], [data-catalog-sku-id]');
    let hasVisibleCard = false;
    groupCards.forEach((cEl) => {
      const card = /** @type {HTMLElement} */ (cEl);
      const hidden = (card.style && card.style.display === 'none') || card.getAttribute('data-filter-visible') === 'false';
      if (!hidden) hasVisibleCard = true;
    });
    if (group.style) group.style.display = hasVisibleCard ? '' : 'none';
    group.setAttribute('data-avenue-group-visible', hasVisibleCard ? 'true' : 'false');
    if (hasVisibleCard) visibleGroups += 1;
  });

  return { visibleCards, visibleGroups, visibleAtomics };
}

/**
 * Sincroniza los filtros activos del catálogo con la query string compartible (`?familia=&avenida=&q=`).
 * @param {string} familia
 * @param {string} avenida
 * @param {string} q
 */
function syncCatalogFiltersToUrl(familia, avenida, q) {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  if (familia && familia !== 'all') url.searchParams.set('familia', familia);
  else url.searchParams.delete('familia');
  if (avenida && avenida !== 'all') url.searchParams.set('avenida', avenida);
  else url.searchParams.delete('avenida');
  if (q && q.trim()) url.searchParams.set('q', q.trim());
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Binds faceted avenue/family filters, search input, URL query hydration, and Drop-In Verifier.
 * @param {ParentNode | null} [root]
 * @param {'es'|'en'} [lang='es']
 */
export function bindHomeCatalogDrawerAndDropIn(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es'
) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  const chips = root.querySelectorAll('[data-family-chip]');
  const avenueBtns = root.querySelectorAll('[data-facet-avenue-btn]');
  const facetSearch = /** @type {HTMLInputElement | null} */ (
    typeof root.querySelector === 'function' ? root.querySelector('#catalog-facet-search') : null
  );

  let activeFamily = 'all';
  let activeAvenue = 'all';

  if (typeof window !== 'undefined' && window.location?.search) {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('familia')) activeFamily = sp.get('familia') || 'all';
    if (sp.get('avenida')) activeAvenue = sp.get('avenida') || 'all';
    if (sp.get('q') && facetSearch && !facetSearch.value) {
      facetSearch.value = sp.get('q') || '';
    }
  }

  const refresh = () => {
    const qVal = facetSearch?.value || '';
    applyHomeAvenueCatalogFilter(root, activeFamily, activeAvenue, qVal);
    syncCatalogFiltersToUrl(activeFamily, activeAvenue, qVal);
  };

  chips.forEach((el) => {
    const chip = /** @type {HTMLElement} */ (el);
    const val = chip.getAttribute('data-family-chip') || 'all';
    const isInitialActive = val === activeFamily;
    chip.setAttribute('aria-pressed', isInitialActive ? 'true' : 'false');
    if (chip.classList) chip.classList.toggle('part-chip--highlight', isInitialActive);

    if (chip.dataset && chip.dataset.homeChipBound === 'true') return;
    if (chip.dataset) chip.dataset.homeChipBound = 'true';

    chip.addEventListener('click', () => {
      activeFamily = val;
      chips.forEach((otherEl) => {
        const c = /** @type {HTMLElement} */ (otherEl);
        const active = c === chip;
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (c.classList) c.classList.toggle('part-chip--highlight', active);
      });
      refresh();
    });
  });

  avenueBtns.forEach((el) => {
    const btn = /** @type {HTMLElement} */ (el);
    if (btn.dataset && btn.dataset.avenueBound === 'true') return;
    if (btn.dataset) btn.dataset.avenueBound = 'true';

    btn.addEventListener('click', () => {
      activeAvenue = btn.getAttribute('data-facet-avenue-btn') || 'all';
      avenueBtns.forEach((otherEl) => {
        const b = /** @type {HTMLElement} */ (otherEl);
        const active = b === btn;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (b.classList) b.classList.toggle('is-active', active);
      });
      refresh();
    });
  });

  if (facetSearch && (!facetSearch.dataset || facetSearch.dataset.facetSearchBound !== 'true')) {
    if (facetSearch.dataset) facetSearch.dataset.facetSearchBound = 'true';
    facetSearch.addEventListener('input', refresh);
  }

  if (activeFamily !== 'all' || activeAvenue !== 'all' || (facetSearch && facetSearch.value.trim())) {
    applyHomeAvenueCatalogFilter(root, activeFamily, activeAvenue, facetSearch?.value || '');
  }

  bindDropInEquivalenceVerifier(root instanceof Document ? root : document, lang);
}
