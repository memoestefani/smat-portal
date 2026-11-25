import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseBomPasteInput } from '../src/scripts/bomPasteParser.js';
import { MINING_GROUPS_CATALOG } from '../src/scripts/wizardCatalogData.js';
import { matchMiningGroupByEmailDomain } from '../src/scripts/wizardMiningAndCodeDecoder.js';
import {
  clearRfqSession,
  loadRfqSession,
  saveRfqSession,
  saveStationSnapshot,
  upsertSessionItem,
} from '../src/scripts/rfqSessionStore.js';
import {
  hydrateVerticalInputsFromUnifiedState,
} from '../src/scripts/verticalBidirectionalHydrationLens.js';
import { evaluateFlotationCellHydrodynamics } from '../src/scripts/mechanicalAndSeparationEngine.js';
import { resolveHonestWebhookStatus, WEBHOOK_OUTBOX_STATES } from '../src/scripts/leadOutboxStateMachine.js';
import { formatMaterialKeyHuman, formatUrgencyBandHuman } from '../src/scripts/i18nDomainLabels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');

function installMockWindowStorage() {
  const lsMap = new Map();
  const ssMap = new Map();
  globalThis.window = globalThis.window || {};
  const listeners = new Map();
  globalThis.window.addEventListener = (t, fn) => {
    if (!listeners.has(t)) listeners.set(t, []);
    listeners.get(t).push(fn);
  };
  globalThis.window.removeEventListener = () => {};
  globalThis.window.dispatchEvent = () => true;
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.window.localStorage = {
    getItem: (k) => (lsMap.has(k) ? lsMap.get(k) : null),
    setItem: (k, v) => lsMap.set(k, String(v)),
    removeItem: (k) => lsMap.delete(k),
  };
  globalThis.window.sessionStorage = {
    getItem: (k) => (ssMap.has(k) ? ssMap.get(k) : null),
    setItem: (k, v) => ssMap.set(k, String(v)),
    removeItem: (k) => ssMap.delete(k),
  };
}

function makeMockInput(id, value = '') {
  const attrs = new Map([['id', id]]);
  const listeners = [];
  return {
    tagName: 'INPUT',
    id,
    value: String(value),
    dataset: {},
    classList: { toggle: () => {}, add: () => {}, remove: () => {} },
    getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
    setAttribute: (k, v) => attrs.set(k, String(v)),
    addEventListener: (_t, fn) => listeners.push(fn),
    dispatchEvent: (ev) => listeners.forEach((fn) => fn(ev)),
  };
}

test('SLICE-V56-16A: Costura real BOM (row.skuId) -> Store v3 -> Outbox -> Acuse + Email 25 grupos', () => {
  installMockWindowStorage();
  clearRfqSession();
  const parsed = parseBomPasteInput('SMAT-PUMP-WETKIT-554\t2\n4x SMAT-CYC-D6-D20');
  assert.ok(parsed.matched.length >= 2, 'BOM multilinea debe resolver >= 2 SKUs reales');
  for (const row of parsed.matched) {
    assert.ok(row.skuId, 'La fila del parser BOM debe exponer row.skuId');
    upsertSessionItem({
      skuId: row.skuId,
      atomicCode: row.atomicCode || row.skuId,
      nameEs: row.nameEs,
      nameEn: row.nameEn,
      qty: row.qty,
      circuit: row.circuit,
      criticalityMode: 'PARO_DE_LINEA',
    });
  }
  const snapPayload = { folio: 'SMAT-2026-V56TEST', skuCount: parsed.matched.length };
  saveStationSnapshot('outbox', {
    dispatchStatus: { state: WEBHOOK_OUTBOX_STATES.DRAFT_LOCAL, verifiedDelivery: false },
    lastPayload: snapPayload,
  });
  const stored = loadRfqSession();
  assert.equal(stored.items.length, parsed.matched.length);
  assert.equal(stored.outbox?.lastPayload?.folio, 'SMAT-2026-V56TEST');

  const miningMatch = matchMiningGroupByEmailDomain('ingeniero@fresnilloplc.com', MINING_GROUPS_CATALOG);
  assert.ok(MINING_GROUPS_CATALOG.length === 25, 'El catálogo debe contener exactamente 25 grupos mineros');
  assert.ok(miningMatch && miningMatch.id, 'El correo corporativo debe resolver al grupo minero real');
});

test('SLICE-V56-16B: Aislamiento dimensional oreSolidsSg vs feedPulpSgKgL + Isomorfismo SSR Flotación', () => {
  installMockWindowStorage();
  saveRfqSession({
    metrology: { oreSolidsSg: 2.3 },
    cyclone: { feedPulpSgKgL: 1.42 },
  });
  const cycFeed = makeMockInput('cyc-feed-sg', '1.35');
  const cycSolids = makeMockInput('cyc-solids-sg', '2.65');
  const root = {
    querySelector: (sel) => root.querySelectorAll(sel)[0] || null,
    querySelectorAll: (sel) => {
      const ids = sel.split(',').map((s) => s.trim().replace(/^#/, ''));
      const out = [];
      if (ids.includes('cyc-feed-sg')) out.push(cycFeed);
      if (ids.includes('cyc-solids-sg')) out.push(cycSolids);
      return out;
    },
  };
  hydrateVerticalInputsFromUnifiedState(root, 'classification', '');
  assert.equal(cycFeed.value, '1.42', 'feedPulpSgKgL no debe contaminarse con metrology.oreSolidsSg (2.30)');
  assert.equal(cycSolids.value, '2.3', 'oreSolidsSg debe mapear únicamente a cyc-solids-sg');

  const flotSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/FlotationCore.astro'), 'utf8');
  assert.ok(flotSrc.includes('evaluateFlotationCellHydrodynamics'), 'FlotationCore debe importar el motor real en SSR');
  const flotEval = evaluateFlotationCellHydrodynamics({
    cellVolumeFt3: 100,
    superficialGasVelocityCmS: 1.2,
    bubbleSizeD32Mm: 1.4,
    floatabilityFactorP: 0.0023,
    frothRecoveryRf: 0.75,
    residenceTimeMin: 4.5,
  });
  assert.ok(flotEval.rateConstantMin > 1.0, `Cinética debe reportarse en min^-1 (actual: ${flotEval.rateConstantMin})`);
  assert.ok(flotEval.summaryEn.includes(`${flotEval.rateConstantMin} min⁻¹`));
});

test('SLICE-V56-16C: Cero @ts-nocheck, cero HTML roto, etiquetas humanas y CSS en @layer', () => {
  const scriptsDir = path.join(SITE_ROOT, 'src/scripts');
  for (const fname of fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(scriptsDir, fname), 'utf8');
    assert.equal(src.includes('@ts-nocheck'), false, `Prohibido @ts-nocheck en src/scripts/${fname}`);
  }

  const fastLaneSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/wizard/FastLaneBomBar.astro'), 'utf8');
  assert.equal(fastLaneSrc.includes('&#10;'), false, 'FastLaneBomBar no debe emitir &#10; literal');
  assert.ok(fastLaneSrc.includes('<dialog id="smat-bom-import-dialog"'), 'FastLaneBomBar debe encapsularse en modal dialog opt-in');

  const qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.ok(qwSrc.includes('id="wb-fab-advance-wrap"'), 'Anticipo 50%/50% debe condicionarse en #wb-fab-advance-wrap');
  assert.ok(qwSrc.includes('id="wb-mining-unit-select"'), 'Grupo/Unidad Minera debe ubicarse en QuoteWizard');

  const dossierSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  const summaryBlocks = dossierSrc.match(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi) || [];
  for (const blk of summaryBlocks) {
    assert.equal(/<button\b/i.test(blk), false, 'LiveEngineeringDossier no debe anidar <button> dentro de <summary>');
  }

  const pdpSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro'), 'utf8');
  assert.equal(pdpSrc.includes('${atomicPart.niosh_handling_mode}'), false, 'ProductDetailIsland no debe interpolar HOIST_REQUIRED crudo');

  assert.equal(formatUrgencyBandHuman('HOIST_REQUIRED', 'en').includes('HOIST_REQUIRED'), false);
  assert.equal(formatMaterialKeyHuman('alto_cromo_cr27', 'en').includes('alto_cromo'), false);

  const outboxDraftEn = resolveHonestWebhookStatus({ isOnline: true, isEn: true });
  assert.ok(outboxDraftEn.message.includes('Requisition Preview (A4)'));
  const outboxDraftEs = resolveHonestWebhookStatus({ isOnline: true, isEn: false });
  assert.ok(outboxDraftEs.message.includes('Vista Previa de Requisición (A4)'));

  const acuseCtrl = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/acuseSheetController.js'), 'utf8');
  assert.equal(acuseCtrl.includes('smat_last_rfq_payload'), false);
  assert.equal(acuseCtrl.includes('smat_last_rfq_dispatch_status'), false);

  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.ok(globalCss.includes('@layer reset, tokens, base, components, utilities;'));

  const distEnDir = path.join(SITE_ROOT, 'dist/en');
  if (fs.existsSync(distEnDir)) {
    const walkHtml = (dir) => {
      const acc = [];
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) acc.push(...walkHtml(p));
        else if (p.endsWith('.html')) acc.push(p);
      }
      return acc;
    };
    for (const htmlPath of walkHtml(distEnDir)) {
      const textOnly = fs
        .readFileSync(htmlPath, 'utf8')
        .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
      for (const leak of ['PARO PROTEGIDO', 'AVISO DE RECIRCULACIÓN', 'USD/hora', 'HOIST_REQUIRED', 'PARO DE LÍNEA', 'CAJA_CHICA_CFDI40']) {
        assert.equal(textOnly.includes(leak), false, `Fuga '${leak}' detectada en ${path.relative(SITE_ROOT, htmlPath)}`);
      }
    }
  }
});

test('SLICE-V56-18: projectAttachedStationSnapshots never leaks raw JSON or alto_cromo_cr27 enum keys', async () => {
  const { projectAttachedStationSnapshots } = await import('../src/scripts/wizardDossierProjector.js');
  const cardClasses = new Set(['hidden']);
  const appended = [];
  const makeEl = (tag = 'div') => ({
    tagName: tag.toUpperCase(),
    textContent: '',
    classList: {
      add: (...c) => c.forEach((x) => cardClasses.add(x)),
      remove: (...c) => c.forEach((x) => cardClasses.delete(x)),
      contains: (c) => cardClasses.has(c),
    },
    replaceChildren: (...nodes) => {
      appended.length = 0;
      appended.push(...nodes);
    },
  });
  const cardEl = makeEl('div');
  const listEl = makeEl('ul');
  const mockDoc = {
    getElementById: (id) => (id === 'attached-station-snapshots' ? cardEl : (id === 'attached-station-snapshots-list' ? listEl : null)),
    createElement: (tag) => makeEl(tag),
  };

  const count = projectAttachedStationSnapshots(mockDoc, {
    stationSnapshots: {
      pumping: {
        materialKey: 'alto_cromo_cr27',
        pipeSeries: '6x4',
        tipSpeedMs: 22.4,
      },
    },
  }, false);

  assert.equal(count, 1);
  assert.equal(cardClasses.has('hidden'), false);
  assert.equal(appended.length, 1);
  const rendered = appended[0].textContent;
  assert.equal(rendered.includes('alto_cromo_cr27'), false, `Raw enum leaked in DOM text: ${rendered}`);
  assert.equal(rendered.includes('{'), false, `Raw JSON leaked in DOM text: ${rendered}`);
  assert.ok(rendered.includes('27% High Chrome'), `Expected translated human label in: ${rendered}`);
});
