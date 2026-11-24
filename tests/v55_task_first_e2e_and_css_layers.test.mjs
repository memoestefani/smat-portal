import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseBomPasteInput } from '../src/scripts/bomPasteParser.js';
import { getQuickProductsCatalog } from '../src/scripts/quickProductsCatalog.js';
import {
  buildShareableRfqUrl,
  clearRfqSession,
  hydrateRfqSessionFromUrl,
  loadRfqSession,
  saveStationSnapshot,
  upsertSessionItem,
} from '../src/scripts/rfqSessionStore.js';
import {
  MINING_UNITS_COUNT,
  QUICK_CHECKOUT_SKU_LIST,
} from '../src/scripts/wizardCatalogData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function installBrowserStub() {
  const localMap = new Map();
  const sessionMap = new Map();
  globalThis.window = {
    location: { origin: 'https://www.smatminerals.com', search: '' },
    localStorage: {
      getItem: (k) => (localMap.has(k) ? localMap.get(k) : null),
      setItem: (k, v) => localMap.set(k, String(v)),
      removeItem: (k) => localMap.delete(k),
    },
    sessionStorage: {
      getItem: (k) => (sessionMap.has(k) ? sessionMap.get(k) : null),
      setItem: (k, v) => sessionMap.set(k, String(v)),
      removeItem: (k) => sessionMap.delete(k),
    },
    dispatchEvent: () => true,
  };
}

test('SLICE-V55-24: Proyección SSOT única en wizardCatalogData desde getQuickProductsCatalog (19 SKUs, 52 minas)', () => {
  const catalog = getQuickProductsCatalog();
  assert.equal(catalog.length, 19);
  assert.equal(QUICK_CHECKOUT_SKU_LIST.length, catalog.length);
  assert.equal(QUICK_CHECKOUT_SKU_LIST[0].id, catalog[0].id);
  assert.equal(MINING_UNITS_COUNT, 52);

  const wizardDataSrc = fs.readFileSync(
    path.join(SITE_ROOT, 'src/scripts/wizardCatalogData.js'),
    'utf8'
  );
  assert.equal(wizardDataSrc.includes('quick_checkout_Catalog.json'), false);
  assert.ok(wizardDataSrc.includes('getQuickProductsCatalog'));
});

test('SLICE-V55-25A: Flujo E2E Task-First (Estación -> rfqSessionStore -> BOM Fast-Lane -> ?rfq_v3= -> Acuse)', () => {
  installBrowserStub();
  clearRfqSession();

  saveStationSnapshot('flotacion', { jgCmS: 1.8, rotorRpm: 225, recommendedSkuId: 'SMAT-FLOT-MECH-18SP' });
  const pasted = parseBomPasteInput('SMAT-FLOT-MECH-18SP x 2\nSMAT-PUMP-WETKIT-554 x 1');
  assert.equal(pasted.matched.length, 2);
  for (const row of pasted.matched) {
    upsertSessionItem({ skuId: row.skuId, qty: row.qty, circuit: row.circuit });
  }

  const shareUrl = buildShareableRfqUrl({ lang: 'es' });
  assert.ok(shareUrl.startsWith('https://www.smatminerals.com/cotizar/?rfq_v3='));

  clearRfqSession();
  const hydrated = hydrateRfqSessionFromUrl(shareUrl.slice(shareUrl.indexOf('?'), shareUrl.indexOf('#')));
  assert.equal(hydrated.hydrated, true);
  const restored = loadRfqSession();
  assert.equal(restored.items.length, 2);
  assert.equal(restored.stationSnapshots.flotacion.jgCmS, 1.8);

  const acuseSrc = fs.readFileSync(
    path.join(SITE_ROOT, 'src/components/islands/AcuseSheetIsland.astro'),
    'utf8'
  );
  assert.ok(acuseSrc.includes('is-webhook-preview'));
  assert.equal(acuseSrc.includes('class="acuse-webhook-banner is-webhook-blocked"'), false);

  const outboxBinderSrc = fs.readFileSync(
    path.join(SITE_ROOT, 'src/scripts/quoteOutboxDomBinder.js'),
    'utf8'
  );
  assert.ok(outboxBinderSrc.includes('flushPendingOutbox'));
  assert.equal(fs.existsSync(path.join(SITE_ROOT, 'public/admin/index.html')), false);
});

test('SLICE-V55-25B: Capas CSS @layer, 0 !important no-print, Superficie Única y Payload /cotizar/ < 110 KB', () => {
  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.ok(globalCss.includes('@layer reset, tokens, base, components, utilities;'));
  assert.ok(globalCss.includes('.smat-logo-wrap--36'));

  const baseLayout = fs.readFileSync(path.join(SITE_ROOT, 'src/layouts/BaseLayout.astro'), 'utf8');
  assert.equal(baseLayout.includes('!important'), false);
  assert.ok(baseLayout.includes('clip-path: inset(50%)'));

  const tribCore = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/TribologyAlloyCore.astro'), 'utf8');
  assert.equal(tribCore.includes('embeddedInWizard'), false);

  for (const islandRel of [
    'src/components/islands/FlotationCalculatorIsland.astro',
    'src/components/islands/FiltrationCalculatorIsland.astro',
  ]) {
    const islandSrc = fs.readFileSync(path.join(SITE_ROOT, islandRel), 'utf8');
    assert.ok(islandSrc.includes("variant === 'hub'"), `${islandRel} debe montar Core solo en hub`);
    assert.equal(islandSrc.includes('!showVerticalShell'), false, `${islandRel} no debe mantener rama !showVerticalShell`);
  }

  const catIsland = fs.readFileSync(
    path.join(SITE_ROOT, 'src/components/islands/CatalogFacetedIsland.astro'),
    'utf8'
  );
  assert.equal(catIsland.includes('catalog-official-header'), false);
  assert.equal(catIsland.includes('Integridad Referencial: Verificada'), false);
  assert.equal(catIsland.includes('smat-ssot-audit-panel'), false);

  const swSrc = fs.readFileSync(path.join(SITE_ROOT, 'public/sw.js'), 'utf8');
  assert.ok(swSrc.includes('smat-pwa-v5.5'));
  assert.ok(swSrc.includes('SMAT_FLUSH_OUTBOX'));

  const distCotizar = path.join(SITE_ROOT, 'dist/cotizar/index.html');
  const distEnQuote = path.join(SITE_ROOT, 'dist/en/quote/index.html');
  if (fs.existsSync(distCotizar)) {
    const htmlEs = fs.readFileSync(distCotizar, 'utf8');
    const bytesEs = Buffer.byteLength(htmlEs, 'utf8');
    assert.ok(bytesEs < 110_000, `dist/cotizar/index.html debe ser < 110 KB, actual: ${bytesEs}`);
    assert.equal(htmlEs.includes('data-mining-groups'), false);
    assert.equal(htmlEs.includes('data-quick-catalog'), false);
    assert.ok(fs.existsSync(distEnQuote), 'dist/en/quote/index.html debe existir');
  }
});
