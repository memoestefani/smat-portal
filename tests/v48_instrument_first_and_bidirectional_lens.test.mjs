// tests/v48_instrument_first_and_bidirectional_lens.test.mjs
// Suite de verificación V4.8 (ARB-SMAT-56, D1-V48..D10-V48, DEB-V48-01..12, Gate 48I).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  saveEngineeringContextSnapshot,
  loadEngineeringContextSnapshot
} from '../src/scripts/wizardCircuitPhysicsController.js';
import {
  commitVerticalSimulation,
  loadUnifiedEngineeringAndWorkbenchState,
  bindAtomicPartTrayButtons
} from '../src/scripts/verticalStateAndCtaSyncBridge.js';
import {
  VERTICAL_STATION_LENS_DESCRIPTORS,
  hydrateVerticalInputsFromUnifiedState,
  syncReactiveTraySkuButton,
  initBearingSupportInspector,
  initSkidKinematicsInspector
} from '../src/scripts/verticalBidirectionalHydrationLens.js';
import {
  calculateCoupledReorderWindowDays,
  getTrayState,
  clearTray
} from '../src/scripts/requisitionTrayBus.js';
import {
  bindDropInEquivalenceVerifier,
  initHarmonicJrpWindowAndPairCard,
  projectProcessControlMetrologyInvariants
} from '../src/scripts/catalogDropInAndJrpProjector.js';
import { renderMiningPresetTelemetry } from '../src/scripts/wizardMiningAndCodeDecoder.js';
import {
  calculateMarcyScaleReading,
  calculateGyMinimumSampleMass,
  recommendAstmSieveSeries
} from '../src/scripts/slurryEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function installMockStorage() {
  const localMap = new Map();
  const sessionMap = new Map();
  globalThis.window = {
    location: { search: '' },
    localStorage: {
      getItem: (k) => (localMap.has(k) ? localMap.get(k) : null),
      setItem: (k, v) => localMap.set(k, String(v)),
      removeItem: (k) => localMap.delete(k),
      clear: () => localMap.clear()
    },
    sessionStorage: {
      getItem: (k) => (sessionMap.has(k) ? sessionMap.get(k) : null),
      setItem: (k, v) => sessionMap.set(k, String(v)),
      removeItem: (k) => sessionMap.delete(k),
      clear: () => sessionMap.clear()
    },
    dispatchEvent: () => true,
    addEventListener: () => {}
  };
  return { localMap, sessionMap };
}

class MockNode {
  constructor(tagName = 'div', attrs = {}, children = []) {
    this.tagName = String(tagName).toUpperCase();
    this.attrs = {};
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.listeners = new Map();
    this._textContent = '';
    this._innerHTML = '';
    this.value = attrs.value !== undefined ? String(attrs.value) : '';
    this.type = attrs.type || '';
    this.min = attrs.min !== undefined ? String(attrs.min) : '';
    this.max = attrs.max !== undefined ? String(attrs.max) : '';
    this.id = attrs.id || '';
    this.href = attrs.href || '';
    this.options = attrs.options || [];
    for (const [k, v] of Object.entries(attrs)) {
      if (k !== 'options') this.setAttribute(k, v);
    }
    for (const ch of children) this.appendChild(ch);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  getAttribute(name) {
    if (name === 'id' && this.id) return this.id;
    if (name === 'href' && this.href) return this.href;
    return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
  }

  setAttribute(name, value) {
    const str = String(value);
    this.attrs[name] = str;
    if (name === 'id') this.id = str;
    if (name === 'href') this.href = str;
    if (name.startsWith('data-')) {
      const camel = name
        .slice(5)
        .replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
      this.dataset[camel] = str;
    }
  }

  removeAttribute(name) {
    delete this.attrs[name];
    if (name.startsWith('data-')) {
      const camel = name
        .slice(5)
        .replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
      delete this.dataset[camel];
    }
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  dispatchEvent(evt) {
    const type = typeof evt === 'string' ? evt : evt?.type;
    const list = this.listeners.get(type) || [];
    for (const fn of list) fn(typeof evt === 'string' ? { type } : evt);
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(v) {
    this._textContent = String(v);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = String(html);
    this.children = [];
    // Parse simple generated button/anchor tokens for tests
    const btnRe = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
    let m;
    while ((m = btnRe.exec(this._innerHTML)) !== null) {
      const rawAttrs = m[1];
      const label = m[2];
      const parsed = {};
      const attrRe = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let am;
      while ((am = attrRe.exec(rawAttrs)) !== null) {
        parsed[am[1]] = am[2];
      }
      const btnNode = new MockNode('button', parsed);
      btnNode.textContent = label;
      this.children.push(btnNode);
    }
  }

  matchesSingleSelector(sel) {
    const s = sel.trim();
    if (!s) return false;
    if (s.startsWith('#')) return this.id === s.slice(1);
    const attrExact = s.match(/^\[([a-zA-Z0-9_-]+)="([^"]*)"\]$/);
    if (attrExact) return this.getAttribute(attrExact[1]) === attrExact[2];
    const attrBare = s.match(/^\[([a-zA-Z0-9_-]+)\]$/);
    if (attrBare) return this.getAttribute(attrBare[1]) !== null;
    if (s.startsWith('.')) {
      const cls = String(this.attrs.class || '').split(/\s+/);
      return cls.includes(s.slice(1));
    }
    if (s.startsWith('a[href*=')) {
      const m = s.match(/^a\[href\*="([^"]+)"\]$/);
      return this.tagName === 'A' && m && this.href.includes(m[1]);
    }
    return this.tagName === s.toUpperCase();
  }

  matchesSelector(selector) {
    return String(selector)
      .split(',')
      .some((part) => this.matchesSingleSelector(part));
  }

  _collectDescendants(selector, acc = []) {
    for (const child of this.children) {
      if (child.matchesSelector(selector)) acc.push(child);
      child._collectDescendants(selector, acc);
    }
    return acc;
  }

  querySelectorAll(selector) {
    return this._collectDescendants(selector, []);
  }

  querySelector(selector) {
    return this._collectDescendants(selector, [])[0] || null;
  }

  getElementById(id) {
    return this.querySelector(`#${id}`);
  }
}

test('D2-V48 / DEB-V48-01: saveEngineeringContextSnapshot y loadUnifiedEngineeringAndWorkbenchState preservan complemento', () => {
  installMockStorage();
  const initialUnified = loadUnifiedEngineeringAndWorkbenchState('');
  assert.equal(initialUnified.hasPersistedState, false);

  saveEngineeringContextSnapshot('flotacion', { jgCmS: 1.95, rotorRpm: 230 });
  saveEngineeringContextSnapshot('filtracion', { feedPressureBar: 16, cakeMoistureTargetPct: 12 });

  const snapshot = loadEngineeringContextSnapshot();
  assert.equal(snapshot.flotation.jgCmS, 1.95);
  assert.equal(snapshot.flotation.rotorRpm, 230);
  assert.equal(snapshot.filtration.feedPressureBar, 16);
  assert.equal(snapshot.filtration.cakeMoistureTargetPct, 12);

  const hydrated = loadUnifiedEngineeringAndWorkbenchState('?sg=3.15&cw=56&d50c=64&press_bar=15&jg=1.8');
  assert.equal(hydrated.hasPersistedState, true);
  assert.equal(hydrated.persistedFields.sg, 3.15);
  assert.equal(hydrated.persistedFields.cw, 56);
  assert.equal(hydrated.persistedFields.d50Um, 64);
  assert.equal(hydrated.persistedFields.feedPressureBar, 15);
  assert.equal(hydrated.persistedFields.jgCmS, 1.8);
});

test('D2-V48 / DEB-V48-06: commitVerticalSimulation({ skipStorageWrite: true }) no contamina storage y hydrateVerticalInputsFromUnifiedState pre-hidrata GetPut', () => {
  const { localMap, sessionMap } = installMockStorage();
  const quoteLink = new MockNode('a', { href: '/cotizar/?circuito=bombeo&equipo=kit_sellado#rfq' });
  const root = new MockNode('div', {}, [quoteLink]);

  const passiveResult = commitVerticalSimulation(
    'bombeo',
    { dischargeHeadM: 34, suctionHeadM: 4, sg: 1.44 },
    { root, queryPatch: { hd_m: 34, sg: 1.44 }, skipStorageWrite: true }
  );
  assert.equal(passiveResult.skippedStorageWrite, true);
  assert.equal(passiveResult.syncedCtaCount, 1);
  assert.equal(localMap.size, 0);
  assert.equal(sessionMap.size, 0);
  assert.ok(quoteLink.href.includes('hd_m=34'));

  const sealHd = new MockNode('input', { id: 'seal-hd-m', type: 'number', min: '5', max: '100', value: '25' });
  const sealHs = new MockNode('input', { id: 'seal-hs-m', type: 'number', min: '-5', max: '30', value: '2' });
  const sealExp = new MockNode('input', { id: 'seal-exp-dia', type: 'number', min: '80', max: '500', value: '180' });
  const sealRpm = new MockNode('input', { id: 'seal-rpm', type: 'number', min: '400', max: '2400', value: '1200' });
  const sealSg = new MockNode('input', { id: 'seal-sg', type: 'number', min: '1', max: '2.5', value: '1.35' });
  const sealRoot = new MockNode('section', {}, [sealHd, sealHs, sealExp, sealRpm, sealSg]);

  const hyd = hydrateVerticalInputsFromUnifiedState(sealRoot, 'seal', '?hd_m=42&hs_m=3.5&exp_dia=215&n2_rpm=1150&sg=1.48');
  assert.equal(hyd.hasPersistedState, true);
  assert.equal(hyd.hydratedCount, 5);
  assert.equal(sealHd.value, '42');
  assert.equal(sealHs.value, '3.5');
  assert.equal(sealExp.value, '215');
  assert.equal(sealRpm.value, '1150');
  assert.equal(sealSg.value, '1.48');
  assert.ok(Object.keys(VERTICAL_STATION_LENS_DESCRIPTORS).includes('filtration'));
  assert.ok(Object.keys(VERTICAL_STATION_LENS_DESCRIPTORS).includes('classification'));
});

test('D3-V48 / D4-V48: syncReactiveTraySkuButton, initBearingSupportInspector y initSkidKinematicsInspector (5/5 hybrid_a05_r55 + DAM005)', () => {
  installMockStorage();
  const reactiveBtn = new MockNode('button', {
    'data-vertical-tray-btn': '',
    'data-add-tray-sku': 'SMAT-PUMP-KIT-6X4',
    'data-tray-circuit': 'bombeo'
  });
  const wrap = new MockNode('div', {}, [reactiveBtn]);
  const updated = syncReactiveTraySkuButton(wrap, {
    skuId: 'SMAT-PUMP-BEARING-FRAME-D',
    partCode: 'DAM005',
    title: 'Cartucho Rodamientos Serie 6x4',
    series: '6x4',
    material: 'hybrid_a05_r55',
    circuit: 'bombeo'
  });
  assert.equal(updated, 1);
  assert.equal(reactiveBtn.getAttribute('data-add-tray-sku'), 'SMAT-PUMP-BEARING-FRAME-D');
  assert.equal(reactiveBtn.getAttribute('data-tray-material'), 'hybrid_a05_r55');

  const bearArr = new MockNode('select', { 'data-bear-arr': '', value: 'CV' });
  const bearC = new MockNode('input', { 'data-bear-c': '', type: 'number', min: '20', max: '500', value: '145' });
  const bearKw = new MockNode('input', { 'data-bear-kw': '', type: 'number', min: '5', max: '600', value: '75' });
  const bearFr = new MockNode('div', { 'data-bear-fr': '' });
  const bearOut = new MockNode('div', { 'data-bear-l10h': '' });
  const bearFrame = new MockNode('div', { 'data-bear-frame-spec': '' });
  const bearBtn = new MockNode('button', { 'data-vertical-tray-btn': '', 'data-add-tray-sku': 'SMAT-PUMP-BRG-005M' });
  const bearQuote = new MockNode('a', { href: '/cotizar/?circuito=bombeo&equipo=kit_rodamientos#rfq' });
  const bearBox = new MockNode('div', { 'data-bearing-inspector': '' }, [
    bearArr, bearC, bearKw, bearFr, bearOut, bearFrame, bearBtn, bearQuote
  ]);
  const bearRoot = new MockNode('main', {}, [bearBox]);
  initBearingSupportInspector(bearRoot, 'es');
  assert.ok(bearOut.textContent.includes('ISO 281'));
  assert.ok(bearFr.textContent.includes('kN'));
  assert.ok(bearQuote.href.includes('cap_c_kn=145'));

  const kinArr = new MockNode('select', { 'data-kin-arrangement': '', value: 'CV' });
  const kinMotor = new MockNode('input', { 'data-kin-motor-rpm': '', type: 'number', value: '1775' });
  const kinDriver = new MockNode('input', { 'data-kin-driver': '', type: 'number', value: '220' });
  const kinDriven = new MockNode('input', { 'data-kin-driven': '', type: 'number', value: '340' });
  const kinPower = new MockNode('input', { 'data-kin-power': '', type: 'number', value: '75' });
  const kinImp = new MockNode('input', { 'data-kin-impeller': '', type: 'number', value: '380' });
  const kinMat = new MockNode('select', { 'data-kin-material': '', value: 'hybrid_a05_r55' });
  const kinCapC = new MockNode('input', { 'data-kin-capacity-c': '', type: 'number', value: '145' });
  const kinPumpRpm = new MockNode('div', { 'data-kin-rpm': '' });
  const kinRatio = new MockNode('div', { 'data-kin-ratio': '' });
  const kinTip = new MockNode('div', { 'data-kin-u2': '' });
  const kinU2Status = new MockNode('div', { 'data-kin-u2-status': '' });
  const kinFr = new MockNode('div', { 'data-kin-fr': '' });
  const kinL10 = new MockNode('div', { 'data-kin-l10h': '' });
  const kinWear = new MockNode('div', { 'data-kin-hybrid-note': '' });
  const kinCta = new MockNode('a', { 'data-kin-cta': '', href: '/cotizar/?circuito=bombeo&equipo=skid_bomba#rfq' });
  const kinTray = new MockNode('button', { 'data-vertical-tray-btn': '', 'data-add-tray-sku': 'SMAT-PUMP-DRIVE-SKID' });
  const skidBox = new MockNode('div', { 'data-skid-kinematics': '' }, [
    kinArr, kinMotor, kinDriver, kinDriven, kinPower, kinImp, kinMat, kinCapC,
    kinPumpRpm, kinRatio, kinTip, kinU2Status, kinFr, kinL10, kinWear,
    kinCta, kinTray
  ]);
  initSkidKinematicsInspector(new MockNode('main', {}, [skidBox]), 'es');
  assert.ok(kinPumpRpm.textContent.includes('RPM'));
  assert.ok(kinWear.textContent.includes('A05+R55') && !kinWear.textContent.includes('undefined'));
  assert.ok(kinCta.href.includes('material=hybrid_a05_r55'));
});

test('D7-V48 / D8-V48 / D6-V48 / D9-V48: JRP Paro de Planta, Drop-In Verifier, Metrológica Marcy/Gy/ASTM y Preset Minero', () => {
  installMockStorage();
  clearTray();

  const normalJrp = calculateCoupledReorderWindowDays({ sg: 1.5, d50Um: 120, criticalityMode: 'normal' });
  const critJrp = calculateCoupledReorderWindowDays({ sg: 1.5, d50Um: 120, criticalityMode: 'paro_planta' });
  assert.deepEqual(
    [normalJrp.sleeveInspectionDay, normalJrp.impellerThroatbushSwapDay, normalJrp.voluteLinerOverhaulDay],
    [90, 150, 180]
  );
  assert.deepEqual(
    [critJrp.sleeveInspectionDay, critJrp.impellerThroatbushSwapDay, critJrp.voluteLinerOverhaulDay],
    [68, 113, 135]
  );

  // Drop-In Equivalence Verifier
  const dropInput = new MockNode('input', { 'data-dropin-input': '', value: 'E4147' });
  const dropBtn = new MockNode('button', { 'data-dropin-btn': '' });
  const dropResult = new MockNode('div', { 'data-dropin-result': '' });
  const dropBox = new MockNode('section', { 'data-dropin-verifier': '' }, [dropInput, dropBtn, dropResult]);
  const dropRoot = new MockNode('div', {}, [dropBox]);
  assert.equal(bindDropInEquivalenceVerifier(dropRoot, 'es'), 1);
  dropBtn.click();
  assert.equal(dropResult.style.display, 'block');
  assert.ok(dropResult.innerHTML.includes('MATCH DROP-IN'));
  assert.ok(dropResult.innerHTML.includes('data-add-tray-sku='));

  // JRP Card toggle normal <-> paro_planta + Coupled Pair tray push
  const sleeveEl = new MockNode('span', { 'data-jrp-sleeve-day': '' });
  const impEl = new MockNode('span', { 'data-jrp-impeller-day': '' });
  const volEl = new MockNode('span', { 'data-jrp-volute-day': '' });
  const winEl = new MockNode('span', { 'data-jrp-window-days': '' });
  const sevEl = new MockNode('span', { 'data-jrp-severity': '' });
  const telEl = new MockNode('span', { 'data-jrp-telemetry-badge': '' });
  const sumEl = new MockNode('span', { 'data-jrp-policy-summary': '' });
  const btnNorm = new MockNode('button', { 'data-jrp-criticality-toggle': 'normal' });
  const btnParo = new MockNode('button', { 'data-jrp-criticality-toggle': 'paro_planta' });
  const pairBtn = new MockNode('button', {
    'data-add-coupled-pair-btn': '',
    'data-pair-primary-sku': 'SMAT-PUMP-IMP-147',
    'data-pair-primary-title': 'Impulsor Cerrado E4147',
    'data-pair-secondary-sku': 'SMAT-PUMP-TB-083',
    'data-pair-secondary-title': 'Cuello E4083',
    'data-pair-series': '6x4',
    'data-pair-material': 'A05'
  });
  const jrpCard = new MockNode('section', { 'data-jrp-window-card': '', 'data-jrp-criticality': 'normal' }, [
    sleeveEl, impEl, volEl, winEl, sevEl, telEl, sumEl, btnNorm, btnParo, pairBtn
  ]);
  initHarmonicJrpWindowAndPairCard(new MockNode('div', {}, [jrpCard]), 'es');
  assert.equal(sleeveEl.textContent, 'Día 90');
  btnParo.click();
  assert.equal(jrpCard.getAttribute('data-jrp-criticality'), 'paro_planta');
  assert.equal(sleeveEl.textContent, 'Día 68');
  assert.equal(impEl.textContent, 'Día 113');
  assert.equal(volEl.textContent, 'Día 135');
  pairBtn.click();
  assert.equal(getTrayState().items.length, 2);

  // Process Control Def-Use projection
  const sgInput = new MockNode('input', { id: 'met-sg-input', value: '2.8' });
  const ringsBox = new MockNode('div', { 'data-marcy-rings-list': '' });
  const dWater = new MockNode('span', { 'data-met-defuse-water-ml': '' });
  const dCv = new MockNode('span', { 'data-met-defuse-cv-pct': '' });
  const dCup = new MockNode('span', { 'data-met-defuse-cup-mass': '' });
  const dDry = new MockNode('span', { 'data-met-defuse-dry-solids': '' });
  const dBeta = new MockNode('span', { 'data-met-defuse-gy-beta': '' });
  const dM = new MockNode('span', { 'data-met-defuse-gy-m': '' });
  const dPulp = new MockNode('span', { 'data-met-defuse-gy-pulp': '' });
  const dMin = new MockNode('span', { 'data-met-defuse-gy-minutes': '' });
  const dMoist = new MockNode('span', { 'data-met-defuse-gy-moisture': '' });
  const dStat = new MockNode('span', { 'data-met-defuse-gy-status': '' });
  const d63 = new MockNode('span', { 'data-met-defuse-d63': '' });
  const dCum = new MockNode('span', { 'data-met-defuse-cum-mass': '' });
  const dMat = new MockNode('span', { 'data-met-defuse-frame-mat': '' });
  const metRoot = new MockNode('div', {}, [
    sgInput, ringsBox, dWater, dCv, dCup, dDry,
    dBeta, dM, dPulp, dMin, dMoist, dStat, d63, dCum, dMat
  ]);
  const marcy = calculateMarcyScaleReading({ solidsSpecificGravity: 2.8, solidsWeightPercent: 50 });
  const gy = calculateGyMinimumSampleMass({ topSizeD95Mm: 0.105, solidsSpecificGravity: 2.8 });
  const sieveStack = recommendAstmSieveSeries({ targetP80Microns: 75 });
  const proj = projectProcessControlMetrologyInvariants(metRoot, 'es', { marcy, gy, sieveStack });
  assert.equal(proj.ringsCount, 12);
  assert.ok(ringsBox.innerHTML.includes('data-marcy-ring-sg='));
  assert.ok(dBeta.textContent.includes('β ='));
  assert.ok(d63.textContent.includes('µm'));

  // Mining Preset Telemetry
  const presetBox = new MockNode('div', { id: 'wb-mining-preset-telemetry', 'data-mining-preset-telemetry': '' });
  const presetRoot = new MockNode('div', {}, [presetBox]);
  const resolved = renderMiningPresetTelemetry(presetRoot, 'fresnillo-plc', 'es');
  assert.ok(resolved && resolved.matched);
  assert.equal(presetBox.style.display, 'block');
  assert.equal(presetBox.getAttribute('data-preset-group'), 'fresnillo-plc');
  assert.ok(presetBox.innerHTML.includes('m s.n.m.'));
  assert.equal(renderMiningPresetTelemetry(presetRoot, '', 'es'), null);
  assert.equal(presetBox.style.display, 'none');

  // Direct check of bindAtomicPartTrayButtons contract
  const trayBtn = new MockNode('button', {
    'data-add-tray-sku': 'SMAT-LAB-MARCY-1000',
    'data-tray-circuit': 'control_procesos'
  });
  assert.equal(bindAtomicPartTrayButtons(new MockNode('div', {}, [trayBtn])), 1);
});

function readPageWithIslandsComposite(rel) {
  let src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
  const islandDir = path.join(SITE_ROOT, 'src/components/islands');
  const coreDir = path.join(SITE_ROOT, 'src/components/cores');
  for (let depth = 0; depth < 3; depth += 1) {
    let changed = false;
    src = src.replace(/<([A-Z][A-Za-z0-9]*(?:Island|Core))\b[^>]*\/>/g, (_m, compName) => {
      const targetDir = compName.endsWith('Core') ? coreDir : islandDir;
      const compPath = path.join(targetDir, `${compName}.astro`);
      if (!fs.existsSync(compPath)) return '';
      changed = true;
      return fs.readFileSync(compPath, 'utf8');
    });
    if (!changed) break;
  }
  return src;
}

test('D1-V48 / D5-V48 / DEB-V48-03..05: Estrato 1 Above-the-Fold, paridad bilingüe y cero metalenguaje visible en V4.8', () => {
  const stratum1WithDiagram = [
    'src/pages/bombeo/impulsor.astro',
    'src/pages/en/pumping/impeller.astro',
    'src/pages/bombeo/revestimientos.astro',
    'src/pages/en/pumping/liners.astro',
    'src/pages/bombeo/sello.astro',
    'src/pages/en/pumping/seal.astro',
    'src/pages/bombeo/soporte.astro',
    'src/pages/en/pumping/bearing-assembly.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/en/pumping/skid.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/en/filtration/index.astro',
    'src/pages/filtracion/prensa.astro',
    'src/pages/en/filtration/press.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/en/filtration/parts.astro',
    'src/pages/flotacion/index.astro',
    'src/pages/en/flotation/index.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/flotacion/mecanismos.astro',
    'src/pages/en/flotation/mechanisms.astro',
    'src/pages/clasificacion/index.astro',
    'src/pages/en/classification/index.astro'
  ];

  for (const rel of stratum1WithDiagram) {
    const src = readPageWithIslandsComposite(rel);
    const idxInst = src.indexOf('data-stratum-1-instrument');
    const idxDiag = src.indexOf('<TechnicalDiagrams');
    assert.ok(idxInst !== -1, `${rel} debe declarar data-stratum-1-instrument`);
    assert.ok(idxDiag !== -1 && idxInst < idxDiag, `${rel} debe colocar el instrumento Estrato 1 antes de <TechnicalDiagrams`);
    const templatePart = src.split('<script')[0].replace(/<!--[\s\S]*?-->/g, '');
    for (const forbidden of ['FNV-1a', 'INV-SMAT-SCI-', 'D1-V48', 'D8-V48', 'D10-V48']) {
      assert.equal(templatePart.includes(forbidden), false, `${rel} no debe exponer metalenguaje '${forbidden}'`);
    }
  }

  for (const metRel of [
    'src/pages/control-de-procesos/index.astro',
    'src/pages/en/process-control/index.astro'
  ]) {
    const src = readPageWithIslandsComposite(metRel);
    const idxInst = src.indexOf('data-stratum-1-instrument');
    const idxGrid = src.indexOf('control-equipment-grid');
    assert.ok(idxInst !== -1 && idxGrid !== -1 && idxInst < idxGrid, `${metRel} debe colocar #metrology-calculator arriba de .control-equipment-grid`);
    assert.ok(src.includes('data-marcy-rings-list'), `${metRel} debe incluir data-marcy-rings-list`);
    assert.ok(src.includes('data-met-defuse-gy-beta'), `${metRel} debe incluir data-met-defuse-gy-beta`);
    assert.ok(src.includes('data-met-defuse-d63'), `${metRel} debe incluir data-met-defuse-d63`);
  }

  for (const catRel of ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro']) {
    const src = readPageWithIslandsComposite(catRel);
    assert.ok(src.includes('data-dropin-verifier'), `${catRel} debe incluir data-dropin-verifier`);
    assert.ok(src.includes('ATOMIC_PARTS_SSOT_COUNT'), `${catRel} debe proyectar ATOMIC_PARTS_SSOT_COUNT`);
    assert.ok(src.includes('PIPE_DIAMETERS_MM'), `${catRel} debe proyectar PIPE_DIAMETERS_MM`);
    assert.ok(src.includes('bindDropInEquivalenceVerifier'), `${catRel} debe invocar bindDropInEquivalenceVerifier`);
  }

  for (const eqRel of ['src/pages/equipos/index.astro', 'src/pages/en/process-equipment/index.astro']) {
    const src = readPageWithIslandsComposite(eqRel);
    assert.ok(src.includes('id="equipos-dropin-match-banner"'), `${eqRel} debe montar #equipos-dropin-match-banner`);
  }

  const wizardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  assert.ok(wizardSrc.includes('id="wb-mining-preset-telemetry"'), 'QuoteWizard.astro debe montar #wb-mining-preset-telemetry');
  assert.ok(wizardSrc.includes('initMiningPresetTelemetryBridge') || wizardSrc.includes('renderMiningPresetTelemetry'), 'QuoteWizard.astro debe invocar initMiningPresetTelemetryBridge / renderMiningPresetTelemetry');

  const parSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/PumpAssemblyReport.astro'), 'utf8');
  assert.ok(parSrc.includes('data-core-tradein-widget="DAM005"'), 'PumpAssemblyReport.astro debe montar Core Trade-In DAM005');

  const diagSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticsHub.astro'), 'utf8');
  assert.ok(diagSrc.includes('data-tray-circuit="diagnostico"'), 'DiagnosticsHub.astro debe ofrecer + Bandeja con circuito diagnostico');
});
