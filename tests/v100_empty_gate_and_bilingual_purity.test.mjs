import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import atomicParts from '../data/atomic_parts.json' with { type: 'json' };
import quickCatalog from '../data/quick_checkout_Catalog.json' with { type: 'json' };
import { buildAcuseViewModel } from '../src/scripts/acuseSheetController.js';
import { resolveEmptyRequisitionViewState, shouldSuppressEmptyFolio } from '../src/scripts/emptyRequisitionGate.js';
import { buildCmuPrioritySubjectLine } from '../src/scripts/requisitionTrayBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

/**
 * Índice de legibilidad Fernández-Huerta: 206.84 - 0.60 * P - 1.02 * F
 * P = sílabas por cada 100 palabras, F = promedio de palabras por oración.
 */
function countSpanishSyllables(word) {
  const clean = String(word || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-záéíóúüñ]/g, '');
  if (!clean) return 0;
  const groups = clean.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function computeFernandezHuertaScore(text) {
  const sentences = String(text || '')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter((w) => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(w));
  if (!words.length || !sentences.length) return 0;
  const totalSyllables = words.reduce((acc, w) => acc + countSpanishSyllables(w), 0);
  const P = (totalSyllables / words.length) * 100;
  const F = words.length / sentences.length;
  return 206.84 - 0.6 * P - 1.02 * F;
}

test('V100-C23..C25: EMPTY_CART_GATE puro y sin folios ni badges sintéticos en SSR', () => {
  assert.equal(shouldSuppressEmptyFolio({ items: [] }, false), true);
  assert.equal(shouldSuppressEmptyFolio({ items: [] }, true), false);
  assert.equal(buildCmuPrioritySubjectLine({ items: [] }, { lang: 'es' }), '');
  assert.equal(buildCmuPrioritySubjectLine({ items: [] }, { lang: 'en' }), '');

  const acuseEmpty = buildAcuseViewModel({ items: [], locale: 'es', hasUrlRequisition: false });
  assert.equal(acuseEmpty.isEmptyRequisition, true);
  assert.equal(acuseEmpty.folio, '');
  assert.equal(acuseEmpty.urgencyHeading, '');
  assert.equal(acuseEmpty.sapPreviewText, '');

  const gateView = resolveEmptyRequisitionViewState({ items: [] }, 'es', false);
  assert.equal(gateView.allowNextStep, false);
  assert.equal(gateView.showHeaderThumb, false);
  assert.equal(gateView.showDossierTabs, false);

  const qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.ok(qwSrc.includes('id="wb-empty-starter-card"'));
  assert.ok(qwSrc.includes('wb-header-durango-thumb hidden'));
  assert.ok(qwSrc.includes('data-qw-next-step="2" disabled'));
  assert.equal((qwSrc.match(/class="wb-quick-sku-btn"/g) || []).length, 4);

  const traySrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/RequisitionTraySummary.astro'), 'utf8');
  assert.equal(traySrc.includes('[SMAT-DGO] [BORRADOR'), false);
  assert.ok(traySrc.includes('req-tray-cmu-strip hidden'));

  const dossierSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.ok(dossierSrc.includes('dossier-tab-switcher hidden'));

  const acuseSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/AcuseSheetIsland.astro'), 'utf8');
  assert.ok(acuseSrc.includes('id="acuse-empty-state-card"'));
  assert.equal(acuseSrc.includes('FOLIO: SMAT-2026-RFQ'), false);
  assert.equal(acuseSrc.includes('DESPACHO PRIORITARIO'), false);
});

test('V100-C16..C22: Descompresión Cowan, 8/23 inicial en catálogo y Diagnóstico Foto-Primero', () => {
  for (const [rel, accId] of [
    ['src/components/islands/PumpingAssistantStratum2.astro', 'bombeo-calculator-accordion'],
    ['src/components/islands/CycloneScreenIsland.astro', 'cyc-sim-accordion'],
    ['src/components/islands/FiltrationCalculatorIsland.astro', 'filt-sim-accordion'],
    ['src/components/islands/FlotationCalculatorIsland.astro', 'flot-sim-accordion'],
    ['src/components/islands/CatalogFacetedIsland.astro', 'atomic-parts-catalog-drawer'],
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    const tag = src.match(new RegExp(`<details[^>]*id="${accId}"[^>]*>`));
    assert.ok(tag, `${rel} debe exponer <details id="${accId}"> cerrado`);
    assert.equal(/\bopen\b/.test(tag[0]), false, `${rel} #${accId} no debe iniciar abierto`);
  }

  const avenuesSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/CatalogAvenuesMatrix.astro'), 'utf8');
  assert.ok(avenuesSrc.includes('id="catalog-show-all-btn"'));
  assert.ok(avenuesSrc.includes('Math.min(6, allSkus.length)'));

  const diagCardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticFailureCard.astro'), 'utf8');
  assert.ok(diagCardSrc.indexOf('smat-diag-media-top') < diagCardSrc.indexOf('diag-header'));
  assert.ok(diagCardSrc.indexOf('smat-diag-thumb') < diagCardSrc.indexOf('diag-body'));
});

test('V100-C26..C28: Pureza Bilingüe ES/EN, Cero AISC en nosotros y Fernández-Huerta >= 55.0', () => {
  for (const p of atomicParts) {
    assert.ok(p.metallurgy_es && p.metallurgy_en, `${p.code} debe separar metallurgy_es y metallurgy_en`);
    assert.equal(p.metallurgy_es.includes('Class III Type A'), false, `${p.code}.metallurgy_es no debe contener inglés`);
  }

  for (const sku of quickCatalog) {
    assert.equal(/Class III Type A|Throatbush|Plate Shifter|Bearing Assembly/i.test(sku.title_es), false, `${sku.id} title_es con anglicismo`);
  }

  const nosSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/pages/nosotros.astro'), 'utf8');
  assert.equal(nosSrc.includes('BRIEFING EJECUTIVO'), false);
  const subMatch = nosSrc.match(/<p class="subtitle">([\s\S]*?)<\/p>/);
  assert.ok(subMatch, 'nosotros.astro debe conservar <p class="subtitle">');
  const fhScore = computeFernandezHuertaScore(subMatch[1]);
  assert.ok(fhScore >= 55.0, `Índice Fernández-Huerta en nosotros.astro (${fhScore.toFixed(1)}) debe ser >= 55.0`);

  const distAcuse = path.join(SITE_ROOT, 'dist/acuse/index.html');
  if (fs.existsSync(distAcuse)) {
    const html = fs.readFileSync(distAcuse, 'utf8');
    assert.equal(html.includes('FOLIO: SMAT-2026-RFQ'), false);
    assert.equal(html.includes('DESPACHO PRIORITARIO'), false);
  }
});
