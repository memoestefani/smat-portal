import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { verifyDropInEquivalence } from '../src/scripts/dropInEquivalenceGuard.js';
import {
  TWO_SORT_PARTITION_VERSION,
  listAllDeclaredDomIds,
  listAllEngineSchemas
} from '../src/scripts/engineSchemaRegistry.js';
import {
  bindDomainSchemaRoot,
  projectDomainOutputs,
  readAllCanonicalInputs,
  verifyVplDomScopeContainment
} from '../src/scripts/schemaRuntimeBinder.js';
import {
  computeSobolFirstOrderIndices,
  solveXdsmMultidisciplinaryDag
} from '../src/scripts/wizardXdsmDagSolver.js';
import { formatSchemaOutputValue } from '../src/scripts/engineSchemaRegistry.js';
import {
  WEBHOOK_OUTBOX_STATES,
  isPlaceholderWebhookUrl,
  recoverInterruptedOutboxEntries,
  resolveHonestWebhookStatus
} from '../src/scripts/leadOutboxStateMachine.js';
import { buildCatalogFacetedViewModel } from '../src/scripts/catalogFacetedViewModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function walkFiles(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

function parseAttributes(attrText) {
  const attrs = new Map();
  const re = /([A-Za-z_:][-A-Za-z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(attrText)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    attrs.set(key, val);
  }
  return attrs;
}

function toDatasetKey(attrName) {
  return attrName
    .slice(5)
    .replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase());
}

/**
 * Constructor DOM en memoria sobre HTML real compilado (sin jsdom externo ni mocks fijos).
 */
function buildLiveHtmlDom(rawHtml) {
  const cleaned = rawHtml
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const idIndex = new Map();
  const makeNode = (tagName, attrs = new Map(), parentElement = null) => {
    const classSet = new Set(String(attrs.get('class') || '').split(/\s+/).filter(Boolean));
    const listeners = new Map();
    const dataset = {};
    for (const [k, v] of attrs.entries()) {
      if (k.startsWith('data-')) dataset[toDatasetKey(k)] = v;
    }
    const node = {
      tagName: tagName.toUpperCase(),
      id: attrs.get('id') || '',
      type: attrs.get('type') || '',
      checked: attrs.has('checked'),
      value: attrs.has('value') ? attrs.get('value') : '',
      textContent: '',
      attributes: attrs,
      children: [],
      parentElement,
      parentNode: parentElement,
      dataset,
      classList: {
        contains: (c) => classSet.has(c),
        add: (...cs) => cs.forEach((c) => classSet.add(c)),
        remove: (...cs) => cs.forEach((c) => classSet.delete(c)),
        toggle: (c, force) => {
          const next = force !== undefined ? Boolean(force) : !classSet.has(c);
          if (next) classSet.add(c);
          else classSet.delete(c);
          return next;
        }
      },
      hasAttribute: (k) => attrs.has(String(k).toLowerCase()),
      getAttribute: (k) => {
        const lk = String(k).toLowerCase();
        if (lk.startsWith('data-')) {
          const dk = toDatasetKey(lk);
          if (dk in dataset) return String(dataset[dk]);
        }
        return attrs.has(lk) ? attrs.get(lk) : null;
      },
      setAttribute: (k, v) => {
        const lk = String(k).toLowerCase();
        const sv = String(v);
        attrs.set(lk, sv);
        if (lk === 'id') {
          node.id = sv;
          if (sv && !idIndex.has(sv)) idIndex.set(sv, node);
        }
        if (lk.startsWith('data-')) dataset[toDatasetKey(lk)] = sv;
      },
      addEventListener: (evt, fn) => {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(fn);
      },
      dispatchEvent: (evt) => {
        const type = typeof evt === 'string' ? evt : evt?.type;
        for (const fn of listeners.get(type) || []) {
          fn(typeof evt === 'object' ? evt : { type, target: node });
        }
        return true;
      },
      matches: (selector) => {
        return selector.split(',').some((rawPart) => {
          const part = rawPart.trim();
          if (!part) return false;
          if (part.startsWith('#')) return node.id === part.slice(1);
          if (part.startsWith('.')) return classSet.has(part.slice(1));
          const attrMatch = part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
          if (attrMatch) {
            const ak = attrMatch[1].toLowerCase();
            if (!node.hasAttribute(ak)) return false;
            return attrMatch[2] === undefined ? true : node.getAttribute(ak) === attrMatch[2];
          }
          return node.tagName.toLowerCase() === part.toLowerCase();
        });
      },
      querySelectorAll: (selector) => {
        const trimmed = String(selector).trim();
        if (node.parentElement === null && /^#[A-Za-z0-9_-]+$/.test(trimmed)) {
          const hit = idIndex.get(trimmed.slice(1));
          return hit ? [hit] : [];
        }
        const out = [];
        const walk = (cur) => {
          for (const ch of cur.children) {
            if (ch.matches(selector)) out.push(ch);
            walk(ch);
          }
        };
        walk(node);
        return out;
      },
      querySelector: (selector) => {
        const parts = String(selector).split(',').map((s) => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (node.parentElement === null && /^#[A-Za-z0-9_-]+$/.test(part)) {
            const hit = idIndex.get(part.slice(1));
            if (hit) return hit;
          }
          const findFirst = (cur) => {
            for (const ch of cur.children) {
              if (ch.matches(part)) return ch;
              const nested = findFirst(ch);
              if (nested) return nested;
            }
            return null;
          };
          const found = findFirst(node);
          if (found) return found;
        }
        return null;
      }
    };
    if (node.id && !idIndex.has(node.id)) idIndex.set(node.id, node);
    return node;
  };

  const root = makeNode('document', new Map(), null);
  const stack = [root];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
  const tagRe = /<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:\s+[^<>]*?)?)(\/?)>/g;
  let lastIndex = 0;
  let m;
  while ((m = tagRe.exec(cleaned)) !== null) {
    const textChunk = cleaned.slice(lastIndex, m.index).replace(/\s+/g, ' ').trim();
    if (textChunk) {
      const top = stack[stack.length - 1];
      top.textContent = top.textContent ? `${top.textContent} ${textChunk}` : textChunk;
    }
    lastIndex = tagRe.lastIndex;
    const isClose = m[1] === '/';
    const tag = m[2].toLowerCase();
    const selfClosing = m[4] === '/' || voidTags.has(tag);
    if (isClose) {
      for (let i = stack.length - 1; i >= 1; i -= 1) {
        if (stack[i].tagName.toLowerCase() === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const parent = stack[stack.length - 1];
    const el = makeNode(tag, parseAttributes(m[3] || ''), parent);
    parent.children.push(el);
    if (tag === 'option' && parent.tagName === 'SELECT') {
      if (el.attributes.has('selected') || !parent.value) {
        parent.value = el.attributes.has('value') ? el.attributes.get('value') : '';
      }
    }
    if (!selfClosing) stack.push(el);
  }
  return root;
}

function loadCompositeQuoteWizardSourceFallback() {
  const expand = (markup) => {
    let out = markup;
    for (let depth = 0; depth < 4; depth += 1) {
      let changed = false;
      out = out.replace(/<([A-Z][A-Za-z0-9]*(?:Island|Core)|WizardCircuitCalculators|LiveEngineeringDossier)\b[^>]*\/>/g, (_m, comp) => {
        const candidates = [
          path.join(SITE_ROOT, 'src/components', `${comp}.astro`),
          path.join(SITE_ROOT, 'src/components/islands', `${comp}.astro`),
          path.join(SITE_ROOT, 'src/components/cores', `${comp}.astro`)
        ];
        const hit = candidates.find((p) => fs.existsSync(p));
        if (!hit) return '';
        changed = true;
        return fs.readFileSync(hit, 'utf8').replace(/^---[\s\S]*?---/, '');
      });
      if (!changed) break;
    }
    return out;
  };
  return expand(fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8'));
}

function projectSnapshotToDom(root, snap, locale = 'es') {
  projectDomainOutputs(root, 'pumping', { ...(snap.slurryEval?.results || {}), ...(snap.altitudeEval || {}) }, locale);
  projectDomainOutputs(root, 'tribology', { ...(snap.optimalMaterial || {}), ...(snap.hybridEval || {}), ...(snap.interferenceEval || {}), ...(snap.assemblySeqEval || {}) }, locale);
  projectDomainOutputs(root, 'sealDrive', { ...(snap.sealBalanceEval || {}), ...(snap.driveEval || {}) }, locale);
  projectDomainOutputs(root, 'flotation', snap.flotationEval || {}, locale);
  projectDomainOutputs(root, 'filtration', snap.filtrationEval || {}, locale);
  projectDomainOutputs(root, 'cycloneScreen', { ...(snap.cycloneScreenEval || {}), ...(snap.cycloneScreenEval?.screenWeibull || {}) }, locale);
  projectDomainOutputs(root, 'metrology', { ...(snap.marcyEval || {}), ...(snap.gyEval || {}), ...(snap.sieveEval || {}) }, locale);
  projectDomainOutputs(root, 'jrp', { ...(snap.reorderEval || {}), ...(snap.tradeInEval || {}), ...(snap.cmuDescriptor || {}) }, locale);
  projectDomainOutputs(root, 'erpExport', snap.erpBundle || {}, locale);
}

test('V51-T1 DOM Real en dist/ & Cero Bifurcaciones {isEmbedded}: 11 Dominios Biyectivos + Contención VPL', () => {
  assert.equal(TWO_SORT_PARTITION_VERSION, '5.1.0');
  assert.equal(listAllEngineSchemas().length, 11);

  const qwRaw = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.ok(qwRaw.split(/\r?\n/).length < 480, `QuoteWizard.astro debe ser < 480 LOC (actual: ${qwRaw.split(/\r?\n/).length})`);

  for (const isl of [
    'ProcessControlIsland.astro',
    'CycloneScreenIsland.astro',
    'FlotationCalculatorIsland.astro',
    'FiltrationCalculatorIsland.astro',
    'SealDriveBearingIsland.astro'
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands', isl), 'utf8');
    assert.equal(/\bisEmbedded\b/.test(src), false, `${isl} no debe conservar bifurcación isEmbedded`);
  }

  for (const astroFile of walkFiles(path.join(SITE_ROOT, 'src'), ['.astro'])) {
    const content = fs.readFileSync(astroFile, 'utf8');
    assert.equal(/\bstyle\s*=\s*"/.test(content), false, `Inline style="" prohibido en ${path.relative(SITE_ROOT, astroFile)}`);
  }

  const distCotizar = path.join(SITE_ROOT, 'dist/cotizar/index.html');
  const distCatalog = path.join(SITE_ROOT, 'dist/catalogo/index.html');
  const distEquipos = path.join(SITE_ROOT, 'dist/equipos/index.html');
  const distImpulsor = path.join(SITE_ROOT, 'dist/bombeo/impulsor/index.html');
  const hasDist =
    fs.existsSync(distCotizar) &&
    fs.existsSync(distCatalog) &&
    fs.existsSync(distEquipos) &&
    fs.existsSync(distImpulsor);
  if (process.env.SMAT_REQUIRE_DIST === '1') {
    assert.ok(hasDist, 'dist/cotizar, dist/catalogo, dist/equipos y dist/bombeo/impulsor deben existir en SMAT_REQUIRE_DIST=1');
  }

  const cotizarHtml = hasDist ? fs.readFileSync(distCotizar, 'utf8') : loadCompositeQuoteWizardSourceFallback();
  const catalogHtml = hasDist
    ? fs.readFileSync(distCatalog, 'utf8')
    : fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CatalogFacetedIsland.astro'), 'utf8');
  const equiposHtml = hasDist
    ? fs.readFileSync(distEquipos, 'utf8')
    : [
      fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/EquipmentHubIsland.astro'), 'utf8'),
      fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/DropInVerifierCore.astro'), 'utf8'),
    ].join('\n');
  const impulsorHtml = hasDist
    ? fs.readFileSync(distImpulsor, 'utf8')
    : [
      fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/TribologyAlloyIsland.astro'), 'utf8'),
      fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/TribologyAlloyCore.astro'), 'utf8'),
    ].join('\n');
  const fullCorpus = `${cotizarHtml}\n${catalogHtml}\n${equiposHtml}\n${impulsorHtml}`;

  const declared = listAllDeclaredDomIds();
  const missingInputs = declared.inputs.filter((id) => !fullCorpus.includes(`id="${id}"`));
  const missingOutputs = declared.outputs.filter((id) => !fullCorpus.includes(`id="${id}"`));
  assert.deepEqual(missingInputs, [], `Inputs ausentes en dist/cotizar + dist/catalogo + dist/equipos + dist/bombeo/impulsor: ${missingInputs.join(', ')}`);
  assert.deepEqual(missingOutputs, [], `Outputs ausentes en dist/cotizar + dist/catalogo + dist/equipos + dist/bombeo/impulsor: ${missingOutputs.join(', ')}`);

  const cotizarDoc = buildLiveHtmlDom(cotizarHtml);
  const containment = verifyVplDomScopeContainment(cotizarDoc);
  assert.equal(containment.valid, true, `Violaciones de contención VPL: ${containment.violations.join(', ')}`);
  assert.ok(containment.checkedCount >= 40, `Deben validarse >= 40 affordances data-schema-* (actual: ${containment.checkedCount})`);
});

test('V51-T2 Testigo Activo End-to-End (bindDomainSchemaRoot -> XDSM DAG -> 11 KPIs Δy != 0)', () => {
  const distCotizar = path.join(SITE_ROOT, 'dist/cotizar/index.html');
  const html = fs.existsSync(distCotizar) ? fs.readFileSync(distCotizar, 'utf8') : loadCompositeQuoteWizardSourceFallback();
  const doc = buildLiveHtmlDom(html);

  const domains = ['pumping', 'tribology', 'sealDrive', 'flotation', 'filtration', 'cycloneScreen', 'metrology', 'jrp', 'erpExport'];
  let callbackFires = 0;
  const runPipeline = () => {
    const canonical = readAllCanonicalInputs(doc);
    const snap = solveXdsmMultidisciplinaryDag(canonical, { lang: 'es' });
    projectSnapshotToDom(doc, snap, 'es');
    return snap;
  };

  const boundCount = bindDomainSchemaRoot(doc, domains, () => {
    callbackFires += 1;
    runPipeline();
  });
  assert.ok(boundCount >= 40, `bindDomainSchemaRoot debe enlazar controles canónicos reales (actual: ${boundCount})`);

  runPipeline();
  const kpiIds = [
    'metric-sm', 'metric-vc', 'metric-vact', 'metric-fl', 'metric-cv', 'metric-v-rec',
    'metric-hr', 'metric-er', 'metric-wear-hours', 'metric-patm-mca', 'dossier-metric-delta-npsh',
    'metric-motor-iec', 'metric-k-motor-alt', 'metric-sobol-driver'
  ];
  const before = Object.fromEntries(kpiIds.map((id) => [id, doc.querySelector(`#${id}`)?.textContent || '']));

  const mutate = (selector, newVal) => {
    const el = doc.querySelector(selector);
    assert.ok(el, `Debe existir control ${selector} en DOM compilado`);
    el.value = String(newVal);
    el.dispatchEvent({ type: 'input', target: el });
    el.dispatchEvent({ type: 'change', target: el });
  };

  mutate('#slider-flow', 480);
  mutate('#slider-d80', 450);
  mutate('#wb-pipe-size', '8x6');
  mutate('#slider-solids', 58);
  mutate('#wb-altitude-input', 4100);
  mutate('[data-schema-input="tribology.frontClearanceMm"]', 2.1);
  mutate('[data-schema-input="sealDrive.motorPowerKw"]', 220);
  mutate('[data-schema-input="flotation.jgCmS"]', 2.4);
  mutate('[data-schema-input="filtration.feedPressureBar"]', 16);
  mutate('[data-schema-input="cycloneScreen.apexDiameterMm"]', 68);
  mutate('[data-schema-input="metrology.solidsWeightPercent"]', 54);
  mutate('#wb-jrp-wear-hours', 4800);
  mutate('#wb-erp-quantity', 12);

  assert.ok(callbackFires >= 11, `Todos los cambios DOM deben disparar listeners canónicos (disparos: ${callbackFires})`);
  const after = Object.fromEntries(kpiIds.map((id) => [id, doc.querySelector(`#${id}`)?.textContent || '']));
  for (const id of ['metric-sm', 'metric-vc', 'metric-vact', 'metric-hr', 'metric-er', 'metric-wear-hours', 'metric-patm-mca', 'dossier-metric-delta-npsh', 'metric-motor-iec', 'metric-k-motor-alt']) {
    assert.notEqual(after[id], before[id], `KPI sincronizado #${id} quedó congelado (${before[id]} === ${after[id]})`);
  }
  assert.ok(after['metric-sobol-driver'].length > 3, 'Sobol driver debe proyectarse en #metric-sobol-driver');
  assert.notEqual(doc.querySelector('#wb-filt-res-tpd')?.textContent, '', 'Filtración #wb-filt-res-tpd debe actualizarse');
  assert.notEqual(doc.querySelector('#wb-flot-res-sb')?.textContent, '', 'Flotación #wb-flot-res-sb debe actualizarse');
  assert.notEqual(doc.querySelector('#wb-cyc-res-d50')?.textContent, '', 'Ciclón #wb-cyc-res-d50 debe actualizarse');
  assert.notEqual(doc.querySelector('#wb-jrp-window-days')?.textContent, '', 'JRP #wb-jrp-window-days debe actualizarse');

  const dropRes = verifyDropInEquivalence('E4147A05');
  assert.equal(dropRes.matched, true);
  assert.ok(dropRes.canonicalSkuId.startsWith('SMAT-'));
});

test('V51-T3 Benchmark Analítico Sobol (Función Ishigami) + Hidráulica XDSM', () => {
  const ishigami = ({ x1, x2, x3 }) => (
    Math.sin(x1) + 7 * Math.pow(Math.sin(x2), 2) + 0.1 * Math.pow(x3, 4) * Math.sin(x1)
  );
  const res = computeSobolFirstOrderIndices(
    ishigami,
    [
      { name: 'x1', min: -Math.PI, max: Math.PI },
      { name: 'x2', min: -Math.PI, max: Math.PI },
      { name: 'x3', min: -Math.PI, max: Math.PI }
    ],
    256
  );
  assert.ok(res.indices.x2 > 0.30, `Ishigami S2 esperado > 0.30 (actual: ${res.indices.x2})`);
  assert.ok(res.indices.x1 > 0.20, `Ishigami S1 esperado > 0.20 (actual: ${res.indices.x1})`);
  assert.ok(res.indices.x3 < 0.10, `Ishigami S3 esperado < 0.10 (actual: ${res.indices.x3})`);
  assert.ok(res.indices.x2 > res.indices.x1 && res.indices.x1 > res.indices.x3, 'Ordenamiento teórico S2 > S1 > S3');

  const dag = solveXdsmMultidisciplinaryDag({ flowM3H: 250, solidsWeightPercent: 48, altitudeM: 2800 });
  assert.ok(dag.sensitivity.sobolDominantSi > 0, 'Sobol hidráulico debe producir índice dominante > 0');
});

test('V51-T4 Cero Fugas ES en dist/en/**/*.html, Cero Placebos y Cero Emojis UI', () => {
  const forbiddenEsLeaks = [
    'Lote de Contacto Húmedo',
    'Calibrar Hidráulica',
    'Solicitar Cotización de Equipos',
    'Folio de Requisición',
    'Retiro en Almacén Durango',
    'Paro de Planta',
    'Bomba Completa para Lodos'
  ];
  const distEnDir = path.join(SITE_ROOT, 'dist/en');
  if (fs.existsSync(distEnDir)) {
    for (const htmlFile of walkFiles(distEnDir, ['.html'])) {
      const textOnly = fs.readFileSync(htmlFile, 'utf8')
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ');
      for (const leak of forbiddenEsLeaks) {
        assert.equal(textOnly.includes(leak), false, `Fuga ES '${leak}' en ${path.relative(SITE_ROOT, htmlFile)}`);
      }
    }
  }

  for (const scriptFile of walkFiles(path.join(SITE_ROOT, 'src/scripts'), ['.js'])) {
    const src = fs.readFileSync(scriptFile, 'utf8');
    for (const badFallback of ['?? 2.35', '?? 2.95', '?? 2.85', '?? 3.42']) {
      assert.equal(src.includes(badFallback), false, `Fallback silencioso '${badFallback}' en ${path.relative(SITE_ROOT, scriptFile)}`);
    }
  }

  const badDingbatRe = /[\u2605\u2713\u2715\u2794\u267B]|\uD83D[\uDE80-\uDEF6]|\uD83E[\uDD00-\uDDFF]|\u26A1/;
  for (const srcFile of walkFiles(path.join(SITE_ROOT, 'src'), ['.astro', '.js'])) {
    const src = fs.readFileSync(srcFile, 'utf8');
    assert.equal(badDingbatRe.test(src), false, `Emoji o símbolo UI no permitido en ${path.relative(SITE_ROOT, srcFile)}`);
    for (const placebo of ['wb-solids-sg', 'wb-symptom-select', 'wb-ctrl-ring', 'wb-assembly-sequence-test']) {
      assert.equal(src.includes(placebo), false, `ID placebo '${placebo}' en ${path.relative(SITE_ROOT, srcFile)}`);
    }
  }
});

test('V52-T1 Zero-Crash Outbox FSM, Escritor Único Metrológico, Formateo Humano y Cero Placebos V5.2', () => {
  // 1. Outbox FSM honesta (cero SENT placebo sin HTTP 200)
  const draft = resolveHonestWebhookStatus({ endpointUrl: '', isOnline: true, isEn: false });
  assert.equal(draft.state, WEBHOOK_OUTBOX_STATES.DRAFT_LOCAL);
  assert.equal(draft.verifiedDelivery, false);
  const queued = resolveHonestWebhookStatus({ endpointUrl: '', isOnline: false, isEn: false });
  assert.equal(queued.state, WEBHOOK_OUTBOX_STATES.QUEUED_OFFLINE);
  const confirmed = resolveHonestWebhookStatus({ endpointUrl: 'https://hooks.smatminerals.com/intake', httpStatus: 200, isEn: false });
  assert.equal(confirmed.state, WEBHOOK_OUTBOX_STATES.CONFIRMED_HTTP_200);
  assert.equal(confirmed.verifiedDelivery, true);
  const err = resolveHonestWebhookStatus({ endpointUrl: 'https://hooks.smatminerals.com/intake', httpStatus: 503, isEn: true });
  assert.equal(err.state, WEBHOOK_OUTBOX_STATES.FAILED_HTTP);
  assert.equal(isPlaceholderWebhookUrl('akfycbzsmatdurangoleadintakewebhook'), true);
  const recovered = recoverInterruptedOutboxEntries([{ id: 1, status: 'sending' }]);
  assert.equal(recovered[0].status, 'pending');

  // 2. ViewModel SSR de CatalogFacetedIsland (13 piezas y rango formateado sin concatenación)
  const rawAtomicParts = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/atomic_parts.json'), 'utf8'));
  const vm = buildCatalogFacetedViewModel({ atomicParts: rawAtomicParts, locale: 'es' });
  assert.equal(vm.enrichedAtomicParts.length, 13);
  const firstWithD80 = vm.wetEndMaterialsList.find((item) => item.d80RangeMicrons && item.d80RangeMicrons !== '—');
  assert.ok(firstWithD80, 'Debe existir al menos 1 aleación con rango d80 formateado');
  assert.equal(firstWithD80.d80RangeMicrons.includes('1506000'), false, 'd80RangeMicrons no debe concatenar [150, 6000]');
  assert.ok(firstWithD80.d80RangeMicrons.includes('–'), 'd80RangeMicrons debe usar separador en-dash');

  // 3. formatSchemaOutputValue humaniza enums crudos y rangos
  assert.equal(formatSchemaOutputValue('tribology', 'recommendedMaterial', 'alto_cromo_cr27', 'es'), 'Alto Cromo Cr27 (≥650 HB)');
  assert.equal(formatSchemaOutputValue('cycloneScreen', 'dischargeRegime', 'ROPING_CORDON', 'en'), 'Roping Alert (Apex Volumetric Choking)');
  assert.equal(formatSchemaOutputValue('tribology', 'd80RangeMicrons', [150, 6000], 'es'), '150–6,000');

  // 4. Escritor único en MetrologyLabCore, cero /admin/ en Footer, cero unpkg CDN en admin
  const metCore = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/MetrologyLabCore.astro'), 'utf8');
  assert.equal(/data-schema-output="[^"]+"\s+data-met-defuse-/.test(metCore), false, 'MetrologyLabCore debe mantener escritor único');
  const footerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Footer.astro'), 'utf8');
  assert.equal(footerSrc.includes('/admin/'), false, 'Footer no debe exponer enlace público /admin/');
  const adminHtml = fs.readFileSync(path.join(SITE_ROOT, 'public/admin/index.html'), 'utf8');
  assert.equal(adminHtml.includes('unpkg.com'), false, 'public/admin/index.html debe operar Zero-Network sin CDN externo');

  // 5. En dist/en/quote: cero fugas ES de company.json o LiveEngineeringDossier
  const distEnQuote = path.join(SITE_ROOT, 'dist/en/quote/index.html');
  if (fs.existsSync(distEnQuote)) {
    const html = fs.readFileSync(distEnQuote, 'utf8');
    for (const leak of ['Lunes a Viernes', 'Acceso apto', 'Acople Brida', 'Grado G2.5']) {
      assert.equal(html.includes(leak), false, `dist/en/quote no debe contener fuga ES '${leak}'`);
    }
  }
});

test('V53-T1 Ola C1: Único <main>, Formateo Humano, Zero Hardcodes SSR y <dialog> en Bandeja', async () => {
  const { formatCheckoutLaneHuman, formatUrgencyBandHuman, formatCatalogPartCodeHuman } = await import(
    '../src/scripts/i18nDomainLabels.js'
  );

  // 1. Etiquetas humanas ES/EN sin enums técnicos crudos
  assert.equal(formatCheckoutLaneHuman('CAJA_CHICA_CFDI40', 'es').includes('CAJA_CHICA'), false);
  assert.equal(formatUrgencyBandHuman('IMMEDIATE_PICK', 'en').includes('IMMEDIATE_PICK'), false);
  assert.equal(formatCatalogPartCodeHuman('FILTRO_BATCH_LAB', 'es').includes('FILTRO_BATCH_LAB'), false);

  // 2. Sin <main> anidado en AcuseSheetIsland, AtomicPartIsland y páginas legales/producto
  for (const rel of [
    'src/components/islands/AcuseSheetIsland.astro',
    'src/components/islands/AtomicPartIsland.astro',
    'src/pages/cumplimiento.astro',
    'src/pages/garantia.astro',
    'src/pages/en/compliance.astro',
    'src/pages/en/warranty.astro',
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro',
  ]) {
    const content = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.equal(/<main\b/i.test(content), false, `${rel} no debe introducir <main> anidado dentro de BaseLayout`);
  }

  // 3. Separador tipográfico después de #wb-jrp-window-days en fichas [slug]
  for (const slugRel of ['src/pages/productos/[slug].astro', 'src/pages/en/products/[slug].astro']) {
    const slugSrc = fs.readFileSync(path.join(SITE_ROOT, slugRel), 'utf8');
    assert.ok(slugSrc.includes("insertAdjacentText('afterend', ' · ')"), `${slugRel} debe insertar ' · ' tras #wb-jrp-window-days`);
  }

  // 4. SealDriveBearingCore SSR dinámico (cero 1001 RPM / 42800 hardcoded) & DropInVerifierCore neutro
  const sdbSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/SealDriveBearingCore.astro'), 'utf8');
  assert.equal(sdbSrc.includes('calculateDriveAndBearingKinematics'), true);
  assert.equal(sdbSrc.includes('1001 RPM'), false);
  assert.equal(sdbSrc.includes('l10h=42800'), false);

  const dropInSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/DropInVerifierCore.astro'), 'utf8');
  const dropInBadge = dropInSrc.slice(dropInSrc.indexOf('smat-dropin-root-badge'));
  assert.equal(dropInBadge.includes('>A05<'), false);
  assert.equal(dropInBadge.includes('>SAT H87<'), false);

  // 5. Consolidación en Cyclone, Filtration y Flotation
  const cycSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/CycloneScreenCore.astro'), 'utf8');
  assert.equal(cycSrc.includes('id="btn-simulate-roping"'), true);
  assert.equal(cycSrc.includes('α = 4.40'), true);
  assert.equal(cycSrc.includes('id="csr-weibull-out"'), false);

  const filtSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/FiltrationCore.astro'), 'utf8');
  assert.equal(filtSrc.includes('id="filt-res-summary"'), false);
  assert.equal((filtSrc.match(/SMAT-FILT-CLOTH-PLATE/g) || []).length <= 1, true);

  const flotSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/FlotationCore.astro'), 'utf8');
  assert.equal(flotSrc.includes('id="celdas-gorain-readout"'), false);
});

test('V53-T2 Ola C2: Outbox Paso 3, Nivel 2 Contextual, Offline Reactivo, Dossier No Oclusivo y Sobol S1', () => {
  const wizardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.ok(wizardSrc.includes('id="wb-submit-outbox-btn"'));
  assert.ok(wizardSrc.includes('id="wb-outbox-status-msg"'));
  assert.ok(wizardSrc.includes('initQuoteOutboxController'));
  const outboxSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/leadOutboxStateMachine.js'), 'utf8');
  assert.ok(outboxSrc.includes('enqueueIdempotentOutboxEntry'));

  const pumpCore = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/PumpingHydraulicsCore.astro'), 'utf8');
  assert.ok(pumpCore.includes('id="pumping-tier2-params"'));
  assert.ok(pumpCore.includes('is-tier2-contextual-active'));

  const footerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Footer.astro'), 'utf8');
  assert.match(footerSrc, /id="smat-offline-status"[^>]*\bhidden\b/);

  const stickyCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/workbench-circuits-sticky.css'), 'utf8');
  assert.ok(stickyCss.includes('position: static'));

  const dossierSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.ok(dossierSrc.includes('id="live-table-sobol-drivers"'));
});

test('V53-T3 Ola C3: SSOT SMAT_SUPPLY_DOORS, Higiene APL-03, Checkboxes Fitts y Drawers Progresivos', async () => {
  const { SMAT_SUPPLY_DOORS, formatDischargeRegimeHuman } = await import('../src/scripts/i18nDomainLabels.js');

  assert.equal(SMAT_SUPPLY_DOORS.door1.hrefEs, '/equipos/');
  assert.equal(SMAT_SUPPLY_DOORS.door2.hrefEs, '/bombeo/');
  assert.equal(SMAT_SUPPLY_DOORS.door3.hrefEs, '/control-de-procesos/');
  assert.equal(formatDischargeRegimeHuman('ROPING_CORDON', 'es').includes('ROPING_CORDON'), false);
  assert.equal(formatDischargeRegimeHuman('ROPING_CORDON', 'en').includes('ROPING_CORDON'), false);

  const layoutSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/layouts/BaseLayout.astro'), 'utf8');
  assert.ok(layoutSrc.includes('label:has(> input[type="checkbox"])'));
  assert.ok(layoutSrc.includes('clip: rect(0px, 0px, 0px, 0px)'));
  assert.ok(layoutSrc.includes('width: 20px'));

  const wizardCtrl = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/quoteWizardController.js'), 'utf8');
  assert.ok(wizardCtrl.includes('nowDateIso'));
  assert.ok(wizardCtrl.includes('live-date'));

  const tribIsland = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/TribologyAlloyIsland.astro'), 'utf8');
  assert.ok(tribIsland.includes('id="tribology-material-matrix-drawer"'));
  assert.ok(tribIsland.includes('id="tribology-spares-and-specs-drawer"'));

  const sdbIsland = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/SealDriveBearingIsland.astro'), 'utf8');
  assert.ok(sdbIsland.includes('id="seal-branch-comparator-drawer"'));
  assert.ok(sdbIsland.includes('id="skid-arrangements-drawer"'));
});
