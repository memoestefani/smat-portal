import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCatalogFacetedViewModel } from '../src/scripts/catalogFacetedViewModel.js';
import { verifyDropInEquivalence } from '../src/scripts/dropInEquivalenceGuard.js';
import {
  TWO_SORT_PARTITION_VERSION,
  formatSchemaOutputValue,
  listAllEngineSchemas
} from '../src/scripts/engineSchemaRegistry.js';
import {
  WEBHOOK_OUTBOX_STATES,
  isPlaceholderWebhookUrl,
  recoverInterruptedOutboxEntries,
  resolveHonestWebhookStatus
} from '../src/scripts/leadOutboxStateMachine.js';
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

function listAllDeclaredDomIds() {
  const inputs = [];
  const outputs = [];
  const pushId = (sel, target) => {
    if (typeof sel === 'string' && sel.startsWith('#')) {
      const id = sel.slice(1).split(/[,\s]/)[0].trim();
      if (id && !target.includes(id)) target.push(id);
    }
  };
  for (const s of listAllEngineSchemas()) {
    for (const inp of s.inputsSchema) {
      pushId(inp.domBinding, inputs);
      for (const a of inp.aliasBindings || []) pushId(a, inputs);
    }
    for (const out of s.outputsSchema) {
      pushId(out.domBinding, outputs);
      for (const a of out.aliasBindings || []) pushId(a, outputs);
    }
  }
  return { inputs, outputs };
}

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
      out = out.replace(/<([A-Z][A-Za-z0-9]*(?:Island|Core|Bar|Tray|Summary)|LiveEngineeringDossier)\b[^>]*\/>/g, (_m, comp) => {
        const candidates = [
          path.join(SITE_ROOT, 'src/components', `${comp}.astro`),
          path.join(SITE_ROOT, 'src/components/wizard', `${comp}.astro`),
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
    'PumpingHubIsland.astro'
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
  const distBombeo = path.join(SITE_ROOT, 'dist/bombeo/index.html');
  const distFlot = path.join(SITE_ROOT, 'dist/flotacion/index.html');
  const distFilt = path.join(SITE_ROOT, 'dist/filtracion/index.html');
  const distClas = path.join(SITE_ROOT, 'dist/clasificacion/index.html');
  const distCtrl = path.join(SITE_ROOT, 'dist/control-de-procesos/index.html');
  const hasDist =
    fs.existsSync(distCotizar) &&
    fs.existsSync(distCatalog) &&
    fs.existsSync(distBombeo) &&
    fs.existsSync(distFlot) &&
    fs.existsSync(distFilt) &&
    fs.existsSync(distClas) &&
    fs.existsSync(distCtrl);
  if (process.env.SMAT_REQUIRE_DIST === '1') {
    assert.ok(hasDist, 'dist/ Task-First routes deben existir en SMAT_REQUIRE_DIST=1');
  }

  const cotizarHtml = hasDist ? fs.readFileSync(distCotizar, 'utf8') : loadCompositeQuoteWizardSourceFallback();
  const catalogHtml = hasDist
    ? fs.readFileSync(distCatalog, 'utf8')
    : [
      'src/components/Header.astro',
      'src/components/islands/CatalogFacetedIsland.astro',
    ].map((rel) => fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8')).join('\n');
  const verticalsHtml = hasDist
    ? [distBombeo, distFlot, distFilt, distClas, distCtrl].map((p) => fs.readFileSync(p, 'utf8')).join('\n')
    : [
      'src/components/islands/PumpingHubIsland.astro',
      'src/components/cores/PumpingHydraulicsCore.astro',
      'src/components/cores/TribologyAlloyCore.astro',
      'src/components/cores/SealDriveBearingCore.astro',
      'src/components/islands/FlotationCalculatorIsland.astro',
      'src/components/cores/FlotationCore.astro',
      'src/components/islands/FiltrationCalculatorIsland.astro',
      'src/components/cores/FiltrationCore.astro',
      'src/components/islands/CycloneScreenIsland.astro',
      'src/components/cores/CycloneScreenCore.astro',
      'src/components/islands/ProcessControlIsland.astro',
      'src/components/cores/MetrologyLabCore.astro',
    ].map((rel) => fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8')).join('\n');
  const fullCorpus = `${cotizarHtml}\n${catalogHtml}\n${verticalsHtml}`;

  const declared = listAllDeclaredDomIds();
  const missingInputs = declared.inputs.filter((id) => !fullCorpus.includes(`id="${id}"`));
  const missingOutputs = declared.outputs.filter((id) => !fullCorpus.includes(`id="${id}"`));
  assert.deepEqual(missingInputs, [], `Inputs ausentes en corpus Task-First dist/: ${missingInputs.join(', ')}`);
  assert.deepEqual(missingOutputs, [], `Outputs ausentes en corpus Task-First dist/: ${missingOutputs.join(', ')}`);

  const cotizarDoc = buildLiveHtmlDom(cotizarHtml);
  const containment = verifyVplDomScopeContainment(cotizarDoc);
  assert.equal(containment.valid, true, `Violaciones de contención VPL: ${containment.violations.join(', ')}`);
  assert.ok(containment.checkedCount >= 10, `Deben validarse >= 10 affordances checkout en /cotizar/ (actual: ${containment.checkedCount})`);

  const fullDoc = buildLiveHtmlDom(fullCorpus);
  const fullContainment = verifyVplDomScopeContainment(fullDoc);
  assert.equal(fullContainment.valid, true, `Violaciones VPL globales: ${fullContainment.violations.join(', ')}`);
  assert.ok(fullContainment.checkedCount >= 40, `Deben validarse >= 40 affordances globales (actual: ${fullContainment.checkedCount})`);
});

test('V51-T2 Testigo Activo End-to-End (Checkout Task-First jrp/erpExport + XDSM DAG 11 KPIs Δy != 0)', () => {
  const distCotizar = path.join(SITE_ROOT, 'dist/cotizar/index.html');
  const html = fs.existsSync(distCotizar) ? fs.readFileSync(distCotizar, 'utf8') : loadCompositeQuoteWizardSourceFallback();
  const doc = buildLiveHtmlDom(html);

  const checkoutDomains = ['jrp', 'erpExport'];
  let callbackFires = 0;
  const runCheckoutPipeline = () => {
    const canonical = readAllCanonicalInputs(doc);
    const snap = solveXdsmMultidisciplinaryDag(canonical, { lang: 'es' });
    projectDomainOutputs(doc, 'jrp', { ...(snap.reorderEval || {}), ...(snap.tradeInEval || {}), ...(snap.cmuDescriptor || {}) }, 'es');
    projectDomainOutputs(doc, 'erpExport', snap.erpBundle || {}, 'es');
    return snap;
  };

  const boundCount = bindDomainSchemaRoot(doc, checkoutDomains, () => {
    callbackFires += 1;
    runCheckoutPipeline();
  });
  assert.ok(boundCount >= 5, `bindDomainSchemaRoot debe enlazar controles checkout reales en /cotizar/ (actual: ${boundCount})`);

  runCheckoutPipeline();
  const jrpBefore = doc.querySelector('#wb-jrp-window-days')?.textContent || '';
  const jrpInput = doc.querySelector('#wb-jrp-wear-hours');
  assert.ok(jrpInput, 'Debe existir #wb-jrp-wear-hours en /cotizar/');
  jrpInput.value = '4800';
  jrpInput.dispatchEvent({ type: 'input', target: jrpInput });
  jrpInput.dispatchEvent({ type: 'change', target: jrpInput });

  const qtyInput = doc.querySelector('#wb-erp-quantity');
  assert.ok(qtyInput, 'Debe existir #wb-erp-quantity en /cotizar/');
  qtyInput.value = '12';
  qtyInput.dispatchEvent({ type: 'input', target: qtyInput });

  assert.ok(callbackFires >= 2, `Cambios checkout deben disparar listeners canónicos (disparos: ${callbackFires})`);
  assert.notEqual(doc.querySelector('#wb-jrp-window-days')?.textContent, jrpBefore, 'JRP #wb-jrp-window-days debe actualizarse');

  // Testigo determinista de la física transversal completa del solver XDSM (11 dominios)
  const snapLow = solveXdsmMultidisciplinaryDag({
    flowM3H: 180,
    solidsWeightPercent: 45,
    particleSizeD80Microns: 180,
    pipeSeries: '6x4',
    altitudeM: 2200,
    frontClearanceMm: 0.5,
    motorPowerKw: 90,
    jgCmS: 1.2,
    feedPressureBar: 8,
    apexDiameterMm: 45,
    predictedWearHours: 2400,
    quantity: 1
  });
  const snapHigh = solveXdsmMultidisciplinaryDag({
    flowM3H: 480,
    solidsWeightPercent: 58,
    particleSizeD80Microns: 450,
    pipeSeries: '8x6',
    altitudeM: 4100,
    frontClearanceMm: 2.1,
    motorPowerKw: 220,
    jgCmS: 2.4,
    feedPressureBar: 16,
    apexDiameterMm: 68,
    predictedWearHours: 4800,
    quantity: 12
  });
  assert.notEqual(snapHigh.slurryEval.results.criticalSettlingVelocityMs, snapLow.slurryEval.results.criticalSettlingVelocityMs);
  assert.notEqual(snapHigh.altitudeEval.motorDeratingFactor, snapLow.altitudeEval.motorDeratingFactor);
  assert.notEqual(snapHigh.flotationEval.sbInverseSeconds, snapLow.flotationEval.sbInverseSeconds);
  assert.notEqual(snapHigh.filtrationEval.dryTonnesPerDay, snapLow.filtrationEval.dryTonnesPerDay);
  assert.notEqual(snapHigh.cycloneScreenEval.d50cMicrons, snapLow.cycloneScreenEval.d50cMicrons);

  const fullDocWitness = buildLiveHtmlDom(fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProcessControlIsland.astro'), 'utf8'));
  projectSnapshotToDom(fullDocWitness, snapHigh, 'es');
  assert.ok(snapHigh.sensitivity.sobolDominantDriver.length > 3, 'Sobol driver debe calcularse en XDSM');

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
  assert.equal(fs.existsSync(path.join(SITE_ROOT, 'public/admin/index.html')), false, 'Debris /admin/ eliminado en V5.5');

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

  // 2. Sin <main> anidado en AcuseSheetIsland, ProductDetailIsland y páginas legales/producto
  for (const rel of [
    'src/components/islands/AcuseSheetIsland.astro',
    'src/components/islands/ProductDetailIsland.astro',
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

  // 3. Separador tipográfico después de #wb-jrp-window-days en fichas [slug] / ProductDetailIsland + pdpBuyBoxController
  const pdpIslandSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/ProductDetailIsland.astro'), 'utf8');
  const pdpCtrlSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/pdpBuyBoxController.js'), 'utf8');
  for (const slugRel of ['src/pages/productos/[slug].astro', 'src/pages/en/products/[slug].astro']) {
    const slugSrc = fs.readFileSync(path.join(SITE_ROOT, slugRel), 'utf8');
    const combinedSlugSrc = `${slugSrc}\n${pdpIslandSrc}\n${pdpCtrlSrc}`;
    assert.ok(combinedSlugSrc.includes("insertAdjacentText('afterend', ' · ')"), `${slugRel} / ProductDetailIsland debe insertar ' · ' tras #wb-jrp-window-days`);
  }

  // 4. SealDriveBearingCore SSR dinámico (cero 1001 RPM / 42800 hardcoded) y DropInVerifierCore retirado
  const sdbSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/SealDriveBearingCore.astro'), 'utf8');
  assert.equal(sdbSrc.includes('calculateDriveAndBearingKinematics'), true);
  assert.equal(sdbSrc.includes('1001 RPM'), false);
  assert.equal(sdbSrc.includes('l10h=42800'), false);

  assert.equal(fs.existsSync(path.join(SITE_ROOT, 'src/components/cores/DropInVerifierCore.astro')), false);
  const catalogSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/CatalogFacetedIsland.astro'), 'utf8');
  assert.equal(catalogSrc.includes('>A05<'), false);
  assert.equal(catalogSrc.includes('>SAT H87<'), false);

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

  assert.equal(SMAT_SUPPLY_DOORS.door1.hrefEs, '/catalogo/');
  assert.equal(SMAT_SUPPLY_DOORS.door2.hrefEs, '/bombeo/');
  assert.equal(SMAT_SUPPLY_DOORS.door3.hrefEs, '/control-de-procesos/');
  assert.equal(formatDischargeRegimeHuman('ROPING_CORDON', 'es').includes('ROPING_CORDON'), false);
  assert.equal(formatDischargeRegimeHuman('ROPING_CORDON', 'en').includes('ROPING_CORDON'), false);

  const layoutSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/layouts/BaseLayout.astro'), 'utf8');
  const baseResetCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/base-reset.css'), 'utf8');
  assert.ok(baseResetCss.includes('label:has(> input[type="checkbox"])'));
  assert.ok(baseResetCss.includes('clip-path: inset(50%)'));
  assert.ok(baseResetCss.includes('width: 20px'));
  assert.equal(/<style\b/i.test(layoutSrc), false, 'BaseLayout.astro debe tener 0 bloques <style> sin @layer');
  assert.equal(layoutSrc.includes('!important'), false, 'BaseLayout.astro debe tener 0 !important globales');

  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.ok(globalCss.includes('@layer reset, tokens, base, components, utilities;'));
  assert.ok(globalCss.includes('.smat-logo-wrap--36'));

  const wizardCtrl = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/quoteWizardController.js'), 'utf8');
  assert.ok(wizardCtrl.includes('nowDateIso'));
  assert.ok(wizardCtrl.includes('live-date'));

  const pumpHub = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingHubIsland.astro'), 'utf8');
  assert.ok(pumpHub.includes('PumpingParametricTable'));
  const tribCore = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/TribologyAlloyCore.astro'), 'utf8');
  const sdbCore = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/SealDriveBearingCore.astro'), 'utf8');
  assert.ok(tribCore.includes('tribology') && sdbCore.includes('sealDrive'));
});

test('V54 Ola A (SLICE-V54-01..09): Transporte Outbox desacoplado, PWA precache, R55 <= 70 C y 0 exports muertos', async () => {
  const { dispatchLeadWebhookAsync } = await import('../src/scripts/leadWebhookTransport.js');
  const sapSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/sapAndLeadExportEngine.js'), 'utf8');
  assert.equal(/\bfetch\s*\(/.test(sapSrc), false, 'sapAndLeadExportEngine.js debe cumplir Zero-Network (sin fetch directo)');

  const binderSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/quoteOutboxDomBinder.js'), 'utf8');
  assert.equal(binderSrc.includes("endpointUrl: ''"), false, 'quoteOutboxDomBinder.js no debe hardcodear endpointUrl vacio');
  assert.ok(binderSrc.includes('data-lead-endpoint'), 'quoteOutboxDomBinder.js debe leer #rfq[data-lead-endpoint]');

  const blocked = await dispatchLeadWebhookAsync({ folio: 'SMAT-TEST', website: 'spam-bot' }, 'test', 'https://hooks.smatminerals.com/intake');
  assert.equal(blocked.httpStatus, 403);
  const draftRes = await dispatchLeadWebhookAsync({ folio: 'SMAT-TEST' }, 'test', 'https://script.google.com/macros/s/AKfycbzSmatDurangoLeadIntakeWebhookV2/exec');
  assert.equal(draftRes.dispatched, false);

  const swSrc = fs.readFileSync(path.join(SITE_ROOT, 'public/sw.js'), 'utf8');
  for (const route of ['/cotizar/', '/bombeo/', '/filtracion/', '/flotacion/', '/control-de-procesos/']) {
    assert.ok(swSrc.includes(`'${route}'`), `sw.js debe precachear ruta critica '${route}'`);
  }
  const footerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Footer.astro'), 'utf8');
  assert.ok(footerSrc.includes('data-pwa-ready="1"'), 'Footer debe exponer indicador discreto data-pwa-ready');
});
