// @ts-check
/**
 * catalogOmniboxSearch.js
 * ---------------------------------------------------------------------------
 * Omnibox B2B de 1 línea para Portada ES/EN (`SLICE-V80-B01`):
 * - Busca sobre los 19 SKUs canónicos + 13 piezas atómicas en `<= 150 ms`.
 * - Invoca silenciosamente `verifyDropInEquivalence` (FNV-1a, 0 raíces OEM)
 *   cuando la consulta parece un código de 5+ caracteres.
 * - Cero lecturas/escrituras en `localStorage` (preserva lista blanca V5.9).
 */

import atomicPartsCatalog from '../../data/atomic_parts.json' with { type: 'json' };
import { verifyDropInEquivalence } from './dropInEquivalenceGuard.js';
import { getQuickProductsCatalog } from './quickProductsCatalog.js';

/**
 * Normaliza un texto para comparación insensible a acentos y mayúsculas.
 * @param {string} raw
 * @returns {string}
 */
function normalizeSearchText(raw) {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Ejecuta búsqueda unificada sobre 19 SKUs + 13 piezas atómicas + Drop-In FNV-1a.
 * @param {string} rawQuery
 * @param {'es'|'en'} [lang='es']
 * @returns {{ dropInMatch: Record<string, any> | null, items: Array<{ kind: 'sku'|'atomic', code: string, title: string, href: string, subtitle: string }> }}
 */
function searchCatalogAndAtomic(rawQuery = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const query = String(rawQuery || '').trim();
  if (!query) return { dropInMatch: null, items: [] };

  const normQuery = normalizeSearchText(query);
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const compactAlnum = query.replace(/[^a-z0-9]/gi, '');

  let dropInMatch = null;
  if (compactAlnum.length >= 4) {
    const eq = verifyDropInEquivalence(query);
    if (eq && eq.matched && eq.sku) {
      dropInMatch = eq;
    }
  }

  /** @type {Array<{ kind: 'sku'|'atomic', code: string, title: string, href: string, subtitle: string, score: number }>} */
  const ranked = [];
  const seenHref = new Set();

  if (dropInMatch?.sku) {
    const s = dropInMatch.sku;
    const href = isEn ? `/en/products/${s.slug_en}/` : `/productos/${s.slug_es}/`;
    seenHref.add(href);
    ranked.push({
      kind: 'sku',
      code: s.id,
      title: isEn ? s.title_en : s.title_es,
      href,
      subtitle: isEn
        ? `1:1 Verified Fit · ${dropInMatch.alloySuffix || s.default_material || 'A05'}`
        : `Acople 1:1 Verificado · ${dropInMatch.alloySuffix || s.default_material || 'A05'}`,
      score: 100,
    });
  }

  const catalog = getQuickProductsCatalog();
  for (const sku of catalog) {
    const href = isEn ? `/en/products/${sku.slug_en}/` : `/productos/${sku.slug_es}/`;
    if (seenHref.has(href)) continue;
    const title = isEn ? sku.title_en : sku.title_es;
    const blob = normalizeSearchText([
      sku.id,
      sku.title_es,
      sku.title_en,
      sku.oem_cross_ref,
      sku.vertical,
      ...(Array.isArray(sku.atomic_codes) ? sku.atomic_codes : []),
    ].join(' '));
    if (tokens.every((tok) => blob.includes(tok))) {
      seenHref.add(href);
      ranked.push({
        kind: 'sku',
        code: sku.id,
        title,
        href,
        subtitle: sku.oem_cross_ref || sku.default_material || 'A05',
        score: normalizeSearchText(sku.id).includes(normQuery) ? 80 : 50,
      });
    }
  }

  for (const part of /** @type {Array<Record<string, any>>} */ (atomicPartsCatalog)) {
    const href = isEn ? `/en/catalog/${part.code}/` : `/catalogo/${part.code}/`;
    if (seenHref.has(href)) continue;
    const title = isEn ? part.name_en : part.name_es;
    const blob = normalizeSearchText([
      part.part_number,
      part.code,
      part.frame,
      part.name_es,
      part.name_en,
      part.type_es,
      part.type_en,
      part.metallurgy,
    ].join(' '));
    if (tokens.every((tok) => blob.includes(tok))) {
      seenHref.add(href);
      ranked.push({
        kind: 'atomic',
        code: String(part.part_number || part.code),
        title,
        href,
        subtitle: `${isEn ? 'Frame' : 'Serie'} ${part.frame} · ${part.weight_kg} kg`,
        score: normalizeSearchText(part.part_number).includes(normQuery) ? 90 : 45,
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  return {
    dropInMatch,
    items: ranked.slice(0, 6).map(({ kind, code, title, href, subtitle }) => ({ kind, code, title, href, subtitle })),
  };
}

/**
 * Conecta el Omnibox de 1 línea `#home-omnibox-input` en Portada ES/EN (`debounce 150 ms`).
 * @param {ParentNode | Document | null} [root]
 * @param {'es'|'en'} [lang='es']
 */
export function initHomeOmniboxSearch(root = typeof document !== 'undefined' ? document : null, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return;
  const input = /** @type {HTMLInputElement | null} */ (root.querySelector('#home-omnibox-input'));
  const resultsBox = /** @type {HTMLElement | null} */ (root.querySelector('#home-omnibox-results'));
  const form = /** @type {HTMLFormElement | null} */ (root.querySelector('#home-omnibox-form'));
  if (!input || !resultsBox) return;
  if (input.dataset.omniboxBound === '1') return;
  input.dataset.omniboxBound = '1';

  const isEn = String(lang).toLowerCase() === 'en';
  /** @type {ReturnType<typeof setTimeout> | null} */
  let debounceTimer = null;

  const renderResults = () => {
    const q = input.value.trim();
    if (!q) {
      resultsBox.replaceChildren();
      resultsBox.hidden = true;
      return;
    }

    const { items } = searchCatalogAndAtomic(q, lang);
    const doc = input.ownerDocument || document;
    const nodes = [];

    if (items.length === 0) {
      const emptyEl = doc.createElement('a');
      emptyEl.className = 'home-omnibox-item';
      emptyEl.href = `${isEn ? '/en/quote/' : '/cotizar/'}?pieza=${encodeURIComponent(q)}#rfq`;
      const strong = doc.createElement('strong');
      strong.textContent = isEn ? `Quote custom part "${q}" →` : `Cotizar código "${q}" directamente →`;
      emptyEl.appendChild(strong);
      nodes.push(emptyEl);
    } else {
      for (const item of items) {
        const link = doc.createElement('a');
        link.className = 'home-omnibox-item';
        link.href = item.href;

        const codeBadge = doc.createElement('span');
        codeBadge.className = 'home-omnibox-code';
        codeBadge.textContent = item.code;

        const textWrap = doc.createElement('span');
        textWrap.className = 'home-omnibox-text';
        const titleEl = doc.createElement('strong');
        titleEl.textContent = item.title;
        const subEl = doc.createElement('small');
        subEl.textContent = item.subtitle;
        textWrap.appendChild(titleEl);
        textWrap.appendChild(subEl);

        link.appendChild(codeBadge);
        link.appendChild(textWrap);
        nodes.push(link);
      }
    }

    resultsBox.replaceChildren(...nodes);
    resultsBox.hidden = false;
  };

  input.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderResults, 150);
  });

  if (form) {
    form.addEventListener('submit', (ev) => {
      const q = input.value.trim();
      if (!q) return;
      const { items } = searchCatalogAndAtomic(q, lang);
      if (items.length === 1 && items[0].href && typeof window !== 'undefined') {
        ev.preventDefault();
        window.location.href = items[0].href;
      }
    });
  }
}
