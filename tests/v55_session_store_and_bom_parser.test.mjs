import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RFQ_SESSION_STORAGE_KEY,
  buildShareableRfqUrl,
  clearRfqSession,
  hydrateRfqSessionFromUrl,
  isFieldUserDirty,
  loadRfqSession,
  markFieldUserDirty,
  saveStationSnapshot,
  upsertSessionItem,
} from '../src/scripts/rfqSessionStore.js';
import {
  RFQ_SHARE_MAX_CHARS,
  decodeRfqSharePayload,
  encodeRfqSharePayload,
} from '../src/scripts/rfqShareCodec.js';
import { parseBomPasteInput } from '../src/scripts/bomPasteParser.js';
import {
  MINING_GROUPS_CATALOG,
  MINING_UNITS_COUNT,
  findMiningGroupById,
  findMiningUnitByName,
} from '../src/scripts/wizardCatalogData.js';
import { ENGINE_SCHEMA_REGISTRY } from '../src/scripts/engineSchemaRegistry.js';
import { getDomainRouteMode } from '../src/scripts/schemaRuntimeBinder.js';
import { calculateThreeCupMarcyCycloneBalance } from '../src/scripts/slurryEngine.js';
import { resolveEmptyRequisitionViewState, shouldSuppressEmptyFolio } from '../src/scripts/emptyRequisitionGate.js';

function installStorageStub() {
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
  return { localMap, sessionMap };
}

test('SLICE-V55-05: rfqSessionStore + rfqShareCodec round-trip, dirty-flag y enlace compartible Ingeniero->Compras', () => {
  const { localMap } = installStorageStub();
  clearRfqSession();
  upsertSessionItem({ skuId: 'SMAT-PUMP-6X4-WETKIT', qty: 2, circuit: 'bombeo' });
  saveStationSnapshot('pumping', { flowM3H: 210, criticalVelocityMs: 3.15 });
  markFieldUserDirty('company');

  const stored = JSON.parse(localMap.get(RFQ_SESSION_STORAGE_KEY));
  assert.equal(stored.version, 3);
  assert.equal(stored.items[0].qty, 2);
  assert.equal(isFieldUserDirty('company', stored), true);

  const token = encodeRfqSharePayload(stored);
  assert.ok(token.length > 20 && token.length <= RFQ_SHARE_MAX_CHARS);
  const decoded = decodeRfqSharePayload(token);
  assert.equal(decoded.items[0].skuId, 'SMAT-PUMP-6X4-WETKIT');
  assert.equal(decoded.stationSnapshots.pumping.flowM3H, 210);
  assert.equal(decodeRfqSharePayload('!!!bad_token!!!'), null);

  const shareUrl = buildShareableRfqUrl({ lang: 'es' });
  assert.ok(shareUrl.startsWith('https://www.smatminerals.com/cotizar/?rfq_v3='));

  clearRfqSession();
  const query = shareUrl.slice(shareUrl.indexOf('?'), shareUrl.indexOf('#'));
  const hydrated = hydrateRfqSessionFromUrl(query);
  assert.equal(hydrated.hydrated, true);
  assert.equal(loadRfqSession().items[0].qty, 2);
});

test('SLICE-V55-06: bomPasteParser tolera BOM UTF-8, CSV/TSV y texto libre; wizardCatalogData expone 52 unidades mineras', () => {
  assert.equal(MINING_GROUPS_CATALOG.length, 25);
  assert.equal(MINING_UNITS_COUNT, 52);
  const fresnillo = findMiningGroupById('fresnillo-plc');
  assert.ok(fresnillo && findMiningUnitByName('fresnillo-plc', 'Saucito'));

  const pasted = '\uFEFFSKU,Cantidad\nSMAT-PUMP-WETKIT-554\t3\n4x SMAT-CYC-D6-D20\nUNKNOWN-PART-999';
  const parsed = parseBomPasteInput(pasted);
  assert.equal(parsed.matched.length, 2);
  assert.equal(parsed.totalUnits, 7);
  assert.equal(parsed.unmatched.length, 1);
});

test('SLICE-V55-07/08: interactiveRoutes vs readonlyRoutes y clasificacion nominal spray al inicio', () => {
  assert.equal(getDomainRouteMode('pumping', '/bombeo/'), 'interactive');
  assert.equal(getDomainRouteMode('pumping', '/cotizar/'), 'none');
  assert.equal(getDomainRouteMode('erpExport', '/acuse/'), 'readonly');
  assert.equal(getDomainRouteMode('jrp', '/productos/kit-wet-end-6x4/'), 'readonly');
  assert.deepEqual(ENGINE_SCHEMA_REGISTRY.pumping.readonlyRoutes, []);

  const nominalCyc = calculateThreeCupMarcyCycloneBalance();
  assert.ok(nominalCyc.cvUnderflow < 0.52, `cvUnderflow inicial debe ser <0.52 (actual=${nominalCyc.cvUnderflow})`);
  assert.ok(nominalCyc.circulatingLoadPct < 400, `CC% inicial debe ser nominal (actual=${nominalCyc.circulatingLoadPct})`);
  assert.equal(nominalCyc.isRopingCritical, false);

  const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const bomSrc = fs.readFileSync(path.join(siteRoot, 'src/components/wizard/FastLaneBomBar.astro'), 'utf8');
  assert.ok(bomSrc.includes('<dialog id="smat-bom-import-dialog"'), 'FastLaneBomBar debe abrirse en modal dialog opt-in');
});

test('SLICE-V10-C23/C25: EMPTY_CART_GATE suprime folios sintéticos y expone arranque honesto', () => {
  assert.equal(shouldSuppressEmptyFolio({ items: [] }, false), true);
  assert.equal(shouldSuppressEmptyFolio({ items: [] }, true), false);
  assert.equal(shouldSuppressEmptyFolio({ items: [{ id: 'SMAT-PUMP-IMP-AH', qty: 1 }] }, false), false);

  const emptyEs = resolveEmptyRequisitionViewState({ items: [] }, 'es', false);
  assert.equal(emptyEs.isEmpty, true);
  assert.equal(emptyEs.showDossierTabs, false);
  assert.equal(emptyEs.showHeaderThumb, false);
  assert.equal(emptyEs.allowNextStep, false);
  assert.equal(emptyEs.emptyFolioLabel, '');
  assert.ok(emptyEs.emptyStatusLabel.includes('Aún no has generado una requisición'));

  const activeEn = resolveEmptyRequisitionViewState({ items: [{ id: 'SMAT-CYC-D6-D20', qty: 2 }] }, 'en', false);
  assert.equal(activeEn.isEmpty, false);
  assert.equal(activeEn.showDossierTabs, true);
  assert.equal(activeEn.allowNextStep, true);

  const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const acuseSrc = fs.readFileSync(path.join(siteRoot, 'src/components/islands/AcuseSheetIsland.astro'), 'utf8');
  assert.equal(acuseSrc.includes('SMAT-2026-RFQ'), false, 'AcuseSheetIsland SSR vacío no debe emitir SMAT-2026-RFQ');
  assert.ok(acuseSrc.includes('id="acuse-empty-state-card"'), 'AcuseSheetIsland debe renderizar tarjeta honesta vacía');
});
