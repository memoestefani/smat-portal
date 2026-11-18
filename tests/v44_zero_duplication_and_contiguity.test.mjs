import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bindCanonicalFiltrationCalculator,
  bindCanonicalFlotationCalculator,
  bindCoupledClassificationStation,
} from '../src/scripts/verticalCalculatorsAndLabelsBridge.js';
import {
  CIRCUIT_XOR_VIEW_SPEC,
  getCircuitXorViewProjection,
  applyCircuitStatechartXOR,
  renderWetEndMaterialMatrixCard,
} from '../src/scripts/wizardCircuitXorStatechart.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function createInteractiveDomMock(initialValues = {}) {
  const nodes = new Map();
  for (const [id, val] of Object.entries(initialValues)) {
    const listeners = {};
    nodes.set(id, {
      id,
      tagName: id.endsWith('-details') ? 'DETAILS' : 'DIV',
      value: String(val),
      textContent: String(val),
      href: '',
      style: { display: '' },
      attributes: new Map(),
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this._set.has(c)) { this._set.delete(c); return false; }
            this._set.add(c); return true;
          }
          if (force) this._set.add(c); else this._set.delete(c);
          return Boolean(force);
        },
      },
      setAttribute(k, v) { this.attributes.set(k, String(v)); },
      getAttribute(k) { return this.attributes.get(k) ?? null; },
      removeAttribute(k) { this.attributes.delete(k); },
      addEventListener(type, fn) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
      },
      dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt?.type || 'input';
        for (const fn of listeners[type] || []) fn(evt);
      },
    });
  }
  return {
    getElementById(id) {
      return nodes.get(id) || null;
    },
    querySelector(selector) {
      const parts = String(selector).split(',').map((s) => s.trim());
      for (const part of parts) {
        const cleanId = part.startsWith('#') ? part.slice(1) : part;
        if (nodes.has(cleanId)) return nodes.get(cleanId);
      }
      return null;
    },
    nodes,
  };
}

test('D1-V44 (1-C+ / ARB-SMAT-52): ISO 80000-1 Scalar Purity — numeric spans never contain parentheses or bullet stuffing', () => {
  // 1. Filtración (/filtracion/repuestos/ y /filtracion/)
  const filtMock = createInteractiveDomMock({
    'rep-pressure-bar': '14',
    'rep-clogged-ports': '2',
    'rep-plate-width': '1500',
    'rep-plate-thickness': '65',
    'rep-cake-moisture': '14',
    'rep-stress-out': '',
    'rep-fs-out': '',
    'rep-status-out': '',
  });
  bindCanonicalFiltrationCalculator(filtMock, 'es');
  const repStress = filtMock.getElementById('rep-stress-out').textContent;
  const repFs = filtMock.getElementById('rep-fs-out').textContent;
  const repStatus = filtMock.getElementById('rep-status-out').textContent;

  assert.equal(repStress.includes('('), false, '#rep-stress-out must not contain parentheses');
  assert.equal(repStress.includes('|'), false, '#rep-stress-out must not contain pipe separators');
  assert.equal(repFs.includes('('), false, '#rep-fs-out must not contain parentheses');
  assert.equal(repFs.includes('•'), false, '#rep-fs-out must not contain bullets');
  assert.ok(repStatus.includes('ΔP_asim'), '#rep-status-out must carry secondary ΔP_asim breakdown');
  assert.ok(repStatus.includes('ciclos/d'), '#rep-status-out must carry cycles/day breakdown');

  // 2. Flotación (/flotacion/celdas/)
  const flotMock = createInteractiveDomMock({
    'celdas-jg-input': '1.5',
    'celdas-d32-input': '1.6',
    'celdas-dia-select': '0.61',
    'celdas-rpm-input': '215',
    'celdas-sb-output': '',
    'celdas-k-output': '',
    'celdas-vtip-output': '',
    'celdas-njs-output': '',
    'celdas-status-output': '',
  });
  bindCanonicalFlotationCalculator(flotMock, 'es');
  for (const scalarId of ['celdas-sb-output', 'celdas-k-output', 'celdas-vtip-output', 'celdas-njs-output']) {
    const txt = flotMock.getElementById(scalarId).textContent;
    assert.equal(txt.includes('('), false, `#${scalarId} must be a pure scalar without '(' (got: ${txt})`);
    assert.equal(txt.includes(')'), false, `#${scalarId} must be a pure scalar without ')' (got: ${txt})`);
    assert.equal(txt.includes('•'), false, `#${scalarId} must be a pure scalar without '•' (got: ${txt})`);
  }
  const flotStatus = flotMock.getElementById('celdas-status-output').textContent;
  assert.ok(flotStatus.includes('N_js='), '#celdas-status-output must carry Zwietering N_js diagnostic');
  assert.ok(flotStatus.includes('PU '), '#celdas-status-output must carry PU wear multiplier diagnostic');
});

test('D2-V44 & D3-V44 (2-C+ & 3-C+): Zero side-by-side duplication in [slug].astro (media-only) and Visual 3NF in [code].astro', () => {
  const qcardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(qcardSrc.includes("mode?: 'card' | 'media-only'"));
  assert.ok(qcardSrc.includes("const isMediaOnly = mode === 'media-only'"));

  for (const slugRel of ['src/pages/productos/[slug].astro', 'src/pages/en/products/[slug].astro']) {
    const slugSrc = fs.readFileSync(path.join(SITE_ROOT, slugRel), 'utf8');
    assert.ok(slugSrc.includes('mode="media-only"'), `${slugRel} must pass mode="media-only" to ProductQuickCard`);
    assert.ok(slugSrc.includes('activateSlugMatChip'), `${slugRel} must wire reactive material chips`);
    assert.equal(
      slugSrc.includes('Escala Cotidiana de Calibración (ISO/IEC 7810)') ||
        slugSrc.includes('Everyday Calibration Scale (ISO/IEC 7810)'),
      false,
      `${slugRel} must not repeat the 3rd 0.76 mm KPI box in header`
    );
  }

  for (const codeRel of ['src/pages/catalogo/[code].astro', 'src/pages/en/catalog/[code].astro']) {
    const codeSrc = fs.readFileSync(path.join(SITE_ROOT, codeRel), 'utf8');
    for (const dupHeader of [
      '<th>Masa Unitaria e Izaje NIOSH:</th>',
      '<th>Espesor de Pared Crítico:</th>',
      '<th>Diámetro Exterior (∅D₂):</th>',
      '<th>Paso Máximo de Esfera (Sólidos):</th>',
      '<th>Estación y Precedencia BOM:</th>',
      '<th>Unit Mass & NIOSH Handling:</th>',
      '<th>Critical Wall Thickness:</th>',
      '<th>Outer Diameter (∅D₂):</th>',
      '<th>Max Sphere Passage (Solids):</th>',
      '<th>BOM Station & Precedence:</th>',
    ]) {
      assert.equal(codeSrc.includes(dupHeader), false, `${codeRel} must obey Visual 3NF (no duplicate row ${dupHeader})`);
    }
  }
});

test('D4-V44 (4-C+): Contiguous Coupled Station in /clasificacion/ and bidirectional #cyc-* <-> #csr-* cascade', () => {
  const csrSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/CycloneAndScreenReport.astro'), 'utf8');
  assert.equal(csrSrc.includes('<script>'), false, 'CycloneAndScreenReport.astro must not contain an isolated <script>');

  for (const clasRel of ['src/pages/clasificacion/index.astro', 'src/pages/en/classification/index.astro']) {
    const clasSrc = fs.readFileSync(path.join(SITE_ROOT, clasRel), 'utf8');
    assert.ok(clasSrc.includes('id="cyc-coupled-screen-station"'));
    assert.ok(clasSrc.includes('id="csr-aperture-mm"'));
    assert.ok(clasSrc.includes('id="csr-relief-deg"'));
    assert.ok(clasSrc.includes('id="csr-feed-um"'));
    assert.ok(clasSrc.includes('id="csr-weibull-out"'));
    assert.ok(clasSrc.includes('id="csr-rfq-link"'));
  }

  const cycMock = createInteractiveDomMock({
    'cyc-feed-sg': '1.35',
    'cyc-underflow-sg': '1.82',
    'cyc-overflow-sg': '1.15',
    'cyc-solids-sg': '2.70',
    'cyc-apex-mm': '50',
    'cyc-vortex-mm': '100',
    'cyc-pressure-kpa': '95',
    'cyc-res-regime': '',
    'cyc-res-recovery': '',
    'cyc-res-circload': '',
    'cyc-res-cvu': '',
    'cyc-res-d50c': '',
    'cyc-res-action': '',
    'cyc-screen-coupling-badge': '',
    'cyc-recommended-sku-link': '',
    'cyc-rfq-link': '',
    'csr-aperture-mm': '0.50',
    'csr-relief-deg': '4.0',
    'csr-feed-um': '163',
    'csr-weibull-out': '',
    'csr-rfq-link': '',
  });

  const res1 = bindCoupledClassificationStation(cycMock, 'es');
  assert.ok(res1);
  const initialWeibullText = cycMock.getElementById('csr-weibull-out').textContent;
  assert.ok(initialWeibullText.includes('Retención Oversize:'));
  assert.ok(cycMock.getElementById('csr-rfq-link').href.includes('aperture_mm=0.5'));

  // Manual edit on screen aperture (#csr-aperture-mm) updates Weibull readout and #csr-rfq-link
  const apInput = cycMock.getElementById('csr-aperture-mm');
  apInput.value = '0.25';
  apInput.dispatchEvent({ type: 'input' });
  const updatedWeibullText = cycMock.getElementById('csr-weibull-out').textContent;
  assert.notEqual(updatedWeibullText, initialWeibullText, 'Changing #csr-aperture-mm must update #csr-weibull-out');
  assert.ok(cycMock.getElementById('csr-rfq-link').href.includes('aperture_mm=0.25'));
});

test('D5-V44..D7-V44 & D9-V44 (5-C+..7-C+ & 9-C+): Harel XOR Statechart projection across all 5 circuits in wizardCircuitXorStatechart.js', () => {
  assert.equal(Object.keys(CIRCUIT_XOR_VIEW_SPEC).length, 5);

  const domMock = createInteractiveDomMock({
    'circuit-panel-bombeo': '',
    'circuit-panel-clasificacion': '',
    'circuit-panel-flotacion': '',
    'circuit-panel-filtracion': '',
    'circuit-panel-control': '',
    'wb-flot-gorain-live-box': '',
    'wb-filt-timoshenko-live-box': '',
    'wb-symptom-context-details': '',
    'wb-drive-and-tradein-contextual-card': '',
    'wb-pump-only-engineering-controls': '',
    'wb-engineering-config-summary-text': '',
    'wb-step2-durand-controls-wrap': '',
    'sim-quick-summary-bar': '',
    'wb-clearance-kinematics-card': '',
    'mech-diagnostics-inline': '',
    'wb-step2-control-summary': '',
    'wb-step2-hint-title': '',
    'wb-step2-hint-body': '',
    'wb-mat-code-badge': '',
    'wb-mat-hardness': '',
    'wb-mat-tip-limit': '',
    'wb-mat-wear-554': '',
    'wb-mat-d80-ph': '',
    'wb-mat-parts-list': '',
    'wb-mat-duty-desc': '',
    'wb-hybrid-rama-d-breakdown': '',
  });

  // 1. Bombeo: symptoms drawer and DAM005 trade-in card visible, Durand controls visible
  domMock.getElementById('wb-symptom-context-details').setAttribute('open', '');
  applyCircuitStatechartXOR('bombeo', { doc: domMock, isEs: true });
  assert.equal(domMock.getElementById('wb-symptom-context-details').style.display, '');
  assert.equal(domMock.getElementById('wb-drive-and-tradein-contextual-card').style.display, 'block');
  assert.equal(domMock.getElementById('wb-step2-durand-controls-wrap').style.display, '');
  assert.equal(domMock.getElementById('wb-clearance-kinematics-card').style.display, '');
  assert.equal(domMock.getElementById('wb-step2-control-summary').style.display, 'none');

  // 2. Filtracion: symptoms drawer hidden & closed, DAM005 trade-in card hidden, summary contextualized
  applyCircuitStatechartXOR('filtracion', { doc: domMock, isEs: true });
  assert.equal(domMock.getElementById('wb-symptom-context-details').style.display, 'none');
  assert.equal(domMock.getElementById('wb-symptom-context-details').getAttribute('open'), null);
  assert.equal(domMock.getElementById('wb-drive-and-tradein-contextual-card').style.display, 'none');
  assert.equal(domMock.getElementById('wb-clearance-kinematics-card').style.display, 'none');
  assert.equal(
    domMock.getElementById('wb-engineering-config-summary-text').textContent.includes('Cr27/Hule'),
    false,
    'Filtration summary must not mention pump Cr27/Rubber'
  );

  // 3. Control de Procesos: Durand pipe controls hidden, lab metrology summary visible
  const ctrlProj = getCircuitXorViewProjection('control_procesos', true);
  assert.equal(ctrlProj.showStep2DurandPipeControls, false);
  applyCircuitStatechartXOR('control_procesos', { doc: domMock, isEs: true });
  assert.equal(domMock.getElementById('wb-step2-durand-controls-wrap').style.display, 'none');
  assert.equal(domMock.getElementById('wb-step2-control-summary').style.display, 'block');

  // 4. Wet-End Material Matrix Card (Rama D Híbrida)
  const matObj = renderWetEndMaterialMatrixCard('hybrid_a05_r55', { doc: domMock, isEs: true, pipeSeries: '6x4' });
  assert.ok(matObj);
  assert.ok(domMock.getElementById('wb-hybrid-rama-d-breakdown').textContent.includes('[RAMA D]'));
});
