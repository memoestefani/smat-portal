/**
 * Home 7-Avenue Catalog Drawer Filter, Drop-In Verifier & Process Equipment SSOT Search/Tray Controller
 * [ARB-SMAT-55] — SLICE-V47-01 (D2-V47, D3-V47)
 *
 * Architectural Cohesion: LCOM4 = 1, boundary cut d(C) = 0.
 * - Eliminates the duplicated 61-LOC inline <script> blocks in index.astro and en/index.astro (DEB-V47-03).
 * - Implements 7-Avenue quotient-set filtering (C_19 / ~avenue) with automatic empty-group hiding.
 * - Implements multi-field boolean lexical search and 1-click Quote Tray binding for /equipos/ and /en/process-equipment/.
 */

import { verifyDropInEquivalence } from './dropInEquivalenceGuard.js';
import { bindAtomicPartTrayButtons } from './verticalStateAndCtaSyncBridge.js';

/**
 * Evaluates whether a canonical SKU card matches the active family filter chip.
 *
 * @param {string} skuId - Canonical SKU ID (e.g. 'SMAT-ULTRAMET-4X3')
 * @param {string} vertical - Primary vertical key ('bombeo', 'clasificacion', 'flotacion', 'filtracion', 'control')
 * @param {string} filterId - Active chip filter ID ('all', 'control', 'tamices', 'bombeo', 'sello_potencia', 'clasificacion', 'filtracion', 'flotacion')
 * @returns {boolean}
 */
export function matchesFamilyFilter(skuId = '', vertical = '', filterId = 'all') {
  if (!filterId || filterId === 'all') return true;
  if (filterId === 'tamices') {
    return skuId === 'SMAT-LAB-TAMIZ-E11' || skuId === 'SMAT-LAB-ROTAP-MECH';
  }
  if (filterId === 'sello_potencia') {
    return skuId === 'SMAT-PUMP-EXPELLER-KIT' || skuId === 'SMAT-PUMP-BRG-005M';
  }
  return vertical === filterId;
}

/**
 * Evaluates multi-token boolean AND lexical matching against a pre-indexed SKU search blob.
 *
 * @param {string} searchBlob - Concatenated searchable attributes (ID, title, codes, series, avenue, vertical)
 * @param {string} rawQuery - Raw user query from #equipos-sku-search
 * @returns {boolean}
 */
export function matchesEquipmentSearchQuery(searchBlob = '', rawQuery = '') {
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
 * Applies a family filter ID across all SKU cards and 7-Avenue groups inside a container.
 * Automatically hides any [data-home-avenue-group] whose child SKU cards are all hidden.
 *
 * @param {ParentNode} root - Document or container root
 * @param {string} filterId - Active family filter chip ID
 * @returns {{ visibleCards: number, visibleGroups: number }}
 */
export function applyHomeAvenueCatalogFilter(root, filterId = 'all') {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return { visibleCards: 0, visibleGroups: 0 };
  }

  const cards = root.querySelectorAll('[data-sku-family]');
  let visibleCards = 0;

  cards.forEach((card) => {
    const vertical = card.getAttribute('data-sku-family') || '';
    const skuId = card.getAttribute('data-sku-id') || '';
    const isMatch = matchesFamilyFilter(skuId, vertical, filterId);
    if (card.style) {
      card.style.display = isMatch ? '' : 'none';
    }
    card.setAttribute('data-filter-visible', isMatch ? 'true' : 'false');
    if (isMatch) visibleCards += 1;
  });

  const avenueGroups = root.querySelectorAll('[data-home-avenue-group]');
  let visibleGroups = 0;

  avenueGroups.forEach((group) => {
    const groupCards = group.querySelectorAll('[data-sku-family]');
    let hasVisibleCard = false;
    groupCards.forEach((card) => {
      const hidden =
        (card.style && card.style.display === 'none') ||
        card.getAttribute('data-filter-visible') === 'false';
      if (!hidden) {
        hasVisibleCard = true;
      }
    });
    if (group.style) {
      group.style.display = hasVisibleCard ? '' : 'none';
    }
    group.setAttribute('data-avenue-group-visible', hasVisibleCard ? 'true' : 'false');
    if (hasVisibleCard) visibleGroups += 1;
  });

  return { visibleCards, visibleGroups };
}

/**
 * Binds the 8 family filter chips inside #home-quick-catalog-drawer and the OEM Drop-In Verifier
 * on / and /en/.
 *
 * @param {ParentNode} [root]
 * @param {'es'|'en'} [lang='es']
 */
export function bindHomeCatalogDrawerAndDropIn(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es'
) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  const chips = root.querySelectorAll('[data-family-chip]');
  const drawer =
    typeof root.getElementById === 'function'
      ? root.getElementById('home-quick-catalog-drawer')
      : root.querySelector('#home-quick-catalog-drawer');

  chips.forEach((chip) => {
    if (chip.dataset && chip.dataset.homeChipBound === 'true') return;
    if (chip.dataset) chip.dataset.homeChipBound = 'true';

    chip.addEventListener('click', () => {
      const filterId = chip.getAttribute('data-family-chip') || 'all';
      chips.forEach((c) => {
        const active = c === chip;
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (c.classList) {
          c.classList.toggle('part-chip--highlight', active);
        }
      });

      applyHomeAvenueCatalogFilter(root, filterId);

      if (drawer && typeof drawer.open === 'boolean' && !drawer.open) {
        drawer.open = true;
      }
    });
  });

  // Bind Drop-In Equivalence Verifier (ES & EN)
  const verifierBox = root.querySelector('[data-dropin-verifier], [data-dropin-verifier-en]');
  if (!verifierBox) return;
  if (verifierBox.dataset && verifierBox.dataset.bound === 'true') return;
  if (verifierBox.dataset) verifierBox.dataset.bound = 'true';

  const input = verifierBox.querySelector('[data-dropin-input], [data-dropin-input-en]');
  const btn = verifierBox.querySelector('[data-dropin-btn], [data-dropin-btn-en]');
  const resultEl = verifierBox.querySelector('[data-dropin-result], [data-dropin-result-en]');

  const runCheck = () => {
    const code = input && typeof input.value === 'string' ? input.value : '';
    const res = verifyDropInEquivalence(code);
    if (!resultEl) return;
    if (resultEl.style) {
      resultEl.style.display = 'block';
    }
    if (res.matched && res.geometricTripletMm) {
      if (lang === 'en') {
        resultEl.innerHTML = `✅ DROP-IN MATCH: <strong>${res.canonicalSkuId}</strong> (${res.titleEn}) | Alloy: <strong>${res.alloyCode}</strong> | ${res.geometricTripletMm.label_en} (${res.toleranceStd}) | Regime: <strong>${res.regimeBadgeEn}</strong> (${res.gateLock}) | Scale: ${res.iso7810Scale} · <a href="/en/products/${res.slugEn}/" style="color:#b45309;text-decoration:underline;">Open Sheet →</a>`;
      } else {
        resultEl.innerHTML = `✅ MATCH DROP-IN: <strong>${res.canonicalSkuId}</strong> (${res.titleEs}) | Aleación: <strong>${res.alloyCode}</strong> | ${res.geometricTripletMm.label_es} (${res.toleranceStd}) | Régimen: <strong>${res.regimeBadgeEs}</strong> (${res.gateLock}) | Escala: ${res.iso7810Scale} · <a href="/productos/${res.slugEs}/" style="color:#b45309;text-decoration:underline;">Abrir Ficha →</a>`;
      }
      resultEl.textContent = resultEl.textContent || `${res.canonicalSkuId}`;
    } else {
      const msg = lang === 'en' ? res.reasonEn : res.reasonEs;
      resultEl.innerHTML = `ℹ️ ${msg}`;
      resultEl.textContent = `ℹ️ ${msg}`;
    }
  };

  if (btn && typeof btn.addEventListener === 'function') {
    btn.addEventListener('click', runCheck);
  }
  if (input && typeof input.addEventListener === 'function') {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        runCheck();
      }
    });
  }
  if (typeof window !== 'undefined' && window.location && window.location.search && input) {
    const params = new URLSearchParams(window.location.search);
    const urlSku = params.get('sku');
    if (urlSku) {
      input.value = urlSku;
      runCheck();
    }
  }
}

/**
 * Binds the instant lexical SKU search bar (#equipos-sku-search) and 1-click Quote Tray buttons
 * ([data-add-tray-sku]) on /equipos/ and /en/process-equipment/.
 *
 * @param {ParentNode} [root]
 * @param {'es'|'en'} [lang='es']
 */
export function bindEquipmentCatalogSearchAndTray(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es'
) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  // Bind all + Bandeja / + Tray buttons via canonical bridge
  bindAtomicPartTrayButtons(root);

  const searchInput =
    typeof root.getElementById === 'function'
      ? root.getElementById('equipos-sku-search')
      : root.querySelector('#equipos-sku-search');
  const countEl = root.querySelector('[data-equipos-search-count]');
  const pills = root.querySelectorAll('[data-equipos-sku-pill]');
  const blocks = root.querySelectorAll('[data-equipment-block]');
  const totalPills = pills.length;

  const updateFilter = (rawQuery = '') => {
    let visiblePills = 0;

    pills.forEach((pill) => {
      const blob =
        pill.getAttribute('data-equipos-search-blob') || pill.textContent || '';
      const isMatch = matchesEquipmentSearchQuery(blob, rawQuery);
      if (pill.style) {
        pill.style.display = isMatch ? '' : 'none';
      }
      pill.setAttribute('data-pill-visible', isMatch ? 'true' : 'false');
      if (isMatch) visiblePills += 1;
    });

    blocks.forEach((block) => {
      const blockPills = block.querySelectorAll('[data-equipos-sku-pill]');
      let hasVisiblePill = false;
      blockPills.forEach((pill) => {
        const hidden =
          (pill.style && pill.style.display === 'none') ||
          pill.getAttribute('data-pill-visible') === 'false';
        if (!hidden) hasVisiblePill = true;
      });
      const blockBlob = block.getAttribute('data-equipment-block-blob') || '';
      const blockMatchesDirectly =
        !String(rawQuery || '').trim() || matchesEquipmentSearchQuery(blockBlob, rawQuery);
      const showBlock = hasVisiblePill || (blockPills.length === 0 && blockMatchesDirectly);
      if (block.style) {
        block.style.display = showBlock ? '' : 'none';
      }
      block.setAttribute('data-block-visible', showBlock ? 'true' : 'false');
    });

    if (countEl) {
      countEl.textContent =
        lang === 'en'
          ? `Showing ${visiblePills} of ${totalPills} canonical SSOT SKUs across 7 Avenues`
          : `Mostrando ${visiblePills} de ${totalPills} SKUs canónicos SSOT en las 7 Avenidas`;
    }

    return { visiblePills, totalPills };
  };

  if (searchInput && typeof searchInput.addEventListener === 'function') {
    if (!searchInput.dataset || searchInput.dataset.equiposSearchBound !== 'true') {
      if (searchInput.dataset) searchInput.dataset.equiposSearchBound = 'true';
      searchInput.addEventListener('input', () => {
        updateFilter(searchInput.value || '');
      });
    }
  }

  return updateFilter(searchInput && typeof searchInput.value === 'string' ? searchInput.value : '');
}
