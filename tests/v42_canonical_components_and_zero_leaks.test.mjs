import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  formatMaterialHumanLabel,
  formatStationHumanBadge,
  formatDiagramHumanTitle,
  bindCanonicalFiltrationCalculator,
  bindCanonicalFlotationCalculator,
  bindCoupledClassificationStation,
} from '../src/scripts/verticalCalculatorsAndLabelsBridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function createInteractiveDomMock(initialValues = {}) {
  const nodes = new Map();
  const getOrCreate = (id) => {
    if (!nodes.has(id)) {
      const listeners = new Map();
      const attrs = new Map();
      nodes.set(id, {
        id,
        value: initialValues[id] !== undefined ? String(initialValues[id]) : '',
        textContent: '',
        href: '',
        style: {},
        addEventListener(evt, fn) {
          if (!listeners.has(evt)) listeners.set(evt, []);
          listeners.get(evt).push(fn);
        },
        dispatchEvent(evtObj) {
          const type = typeof evtObj === 'string' ? evtObj : evtObj?.type || 'input';
          const list = listeners.get(type) || [];
          list.forEach((fn) => fn(evtObj));
        },
        setAttribute(k, v) {
          attrs.set(k, String(v));
        },
        getAttribute(k) {
          return attrs.has(k) ? attrs.get(k) : null;
        },
      });
    }
    return nodes.get(id);
  };

  for (const k of Object.keys(initialValues)) {
    getOrCreate(k);
  }

  return {
    nodes,
    querySelector(selector) {
      const parts = String(selector)
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''));
      for (const p of parts) {
        if (nodes.has(p)) return nodes.get(p);
      }
      return getOrCreate(parts[0]);
    },
  };
}

test('D4-V42 & D5-V42: Bijective human label dictionaries eliminate raw snake_case across materials, 5 stations, and all 16 diagram_id values', () => {
  assert.ok(formatMaterialHumanLabel('poliuretano_minero', 'es').includes('Poliuretano Minero'));
  assert.ok(formatMaterialHumanLabel('poliuretano_minero', 'en').includes('Polyurethane'));
  assert.ok(formatMaterialHumanLabel('alto_cromo_cr27', 'es').includes('Alto Cromo ASTM A532 Cr27'));

  for (const stId of ['drive_end', 'sealing_fork', 'wet_end_fork', 'suction_closure', 'axial_calibration']) {
    const esBadge = formatStationHumanBadge(stId, 'es');
    const enBadge = formatStationHumanBadge(stId, 'en');
    assert.equal(esBadge.includes('_'), false, `Spanish station badge for ${stId} must not contain snake_case`);
    assert.equal(enBadge.includes('_'), false, `English station badge for ${stId} must not contain snake_case`);
  }

  const all16Diagrams = [
    'impeller_5vane',
    'wet_kit_554',
    'expeller_seal',
    'bearing_cartridge',
    'volute_liner',
    'cyclone_d6_d20',
    'coupled_pump_cyclone',
    'urethane_screen_th48',
    'urethane_screen_panel_305',
    'filter_press',
    'filter_plate_shifter',
    'flotation_cell',
    'marcy_scale',
    'batch_filter',
    'astm_sieves',
    'lab_comminution_pan',
  ];
  for (const diagId of all16Diagrams) {
    const esTitle = formatDiagramHumanTitle(diagId, 'es');
    const enTitle = formatDiagramHumanTitle(diagId, 'en');
    assert.equal(esTitle.includes('_'), false, `Spanish diagram title for ${diagId} must not contain snake_case`);
    assert.equal(enTitle.includes('_'), false, `English diagram title for ${diagId} must not contain snake_case`);
  }
});

test('D1-V42 & D2-V42: Canonical calculators execute live State <-> DOM bijectivity for Filtration (#filt-* and #rep-*), Flotation (#celdas-*), and Coupled Classification (#cyc-* -> #csr-*)', () => {
  // 1. Filtration (#rep-* in /filtracion/repuestos/)
  const filtMock = createInteractiveDomMock({
    'rep-pressure-bar': '15',
    'rep-clogged-ports': '2',
    'rep-plate-width': '1500',
    'rep-plate-thickness': '65',
    'rep-cake-moisture': '13.5',
    'rep-stress-out': '',
    'rep-fs-out': '',
    'rep-status-out': '',
  });
  const filtRes = bindCanonicalFiltrationCalculator(filtMock, 'es');
  assert.ok(filtRes, 'bindCanonicalFiltrationCalculator must return computed filtration metrics');
  assert.ok(filtRes.cyclesPerDay > 0);
  assert.ok(filtRes.dryTonnesPerDay > 0);
  assert.equal(filtMock.querySelector('#rep-fs-out').textContent.includes('('), false);
  assert.equal(filtMock.querySelector('#rep-stress-out').textContent.includes('('), false);
  assert.ok(filtMock.querySelector('#rep-status-out').textContent.includes('ciclos/d'));
  assert.ok(filtMock.querySelector('#rep-status-out').textContent.includes('ΔP_asim'));

  // 2. Flotation (#celdas-* in /flotacion/celdas/)
  const flotMock = createInteractiveDomMock({
    'celdas-jg-input': '1.6',
    'celdas-d32-input': '1.4',
    'celdas-dia-select': '0.68',
    'celdas-rpm-input': '220',
    'celdas-sb-output': '',
    'celdas-k-output': '',
    'celdas-vtip-output': '',
    'celdas-njs-output': '',
    'celdas-status-output': '',
  });
  const flotRes = bindCanonicalFlotationCalculator(flotMock, 'es');
  assert.ok(flotRes, 'bindCanonicalFlotationCalculator must return computed hydrodynamics');
  assert.ok(flotRes.zwieteringNjsRpm > 0);
  assert.equal(flotMock.querySelector('#celdas-sb-output').textContent.includes('('), false);
  assert.equal(flotMock.querySelector('#celdas-vtip-output').textContent.includes('('), false);
  assert.ok(flotMock.querySelector('#celdas-status-output').textContent.includes('N_js='));
  assert.ok(flotMock.querySelector('#celdas-status-output').textContent.includes('PU '));

  // 3. Coupled Classification (#cyc-* -> #csr-feed-um and #cyc-screen-coupling-badge)
  const cycMock = createInteractiveDomMock({
    'cyc-feed-sg': '1.38',
    'cyc-underflow-sg': '1.88',
    'cyc-overflow-sg': '1.16',
    'cyc-solids-sg': '2.75',
    'cyc-apex-mm': '50',
    'cyc-vortex-mm': '100',
    'cyc-pressure-kpa': '105',
    'csr-feed-um': '420',
  });
  const cycRes = bindCoupledClassificationStation(cycMock, 'es');
  assert.ok(cycRes, 'bindCoupledClassificationStation must return 3-cup cyclone balance');
  const expectedCoupledD80 = String(Math.round(cycRes.d50cMicrons * 2.2));
  assert.equal(cycMock.querySelector('#csr-feed-um').value, expectedCoupledD80);
  assert.ok(cycMock.querySelector('#cyc-screen-coupling-badge').textContent.includes(expectedCoupledD80));
});

test('D3-V42, D6-V42, D7-V42 & D9-V42: Zero duplicate Mode 05/06 section in /diagnostico/ and zero visible snake_case / ROLES.JSON / D7 / D8 leaks in templates', () => {
  for (const diagRel of ['src/pages/diagnostico.astro', 'src/pages/en/diagnostics.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, diagRel), 'utf8');
    assert.equal(src.includes('seal_stuffing_box'), false, `${diagRel} must not contain duplicate Mode 05 section`);
    assert.equal(src.includes('bearing_shaft_fatigue'), false, `${diagRel} must not contain duplicate Mode 06 section`);
  }

  const forbiddenSourcePatterns = [
    'ROLES.JSON',
    '(roles.json)',
    '(`control_procesos`)',
    '(`buildSmatVendorPassportPayload`)',
    '(Statechart XOR)',
    '(XOR Statechart)',
    '· D7 (7-C++)',
    '• D7',
    '• D8',
  ];

  const targetPages = [
    'src/components/QuoteWizard.astro',
    'src/components/ProductQuickCard.astro',
    'src/components/DiagnosticsHub.astro',
    'src/components/PumpAssemblyReport.astro',
    'src/pages/catalogo.astro',
    'src/pages/en/catalog.astro',
    'src/pages/cumplimiento.astro',
    'src/pages/en/compliance.astro',
    'src/pages/clasificacion/index.astro',
    'src/pages/en/classification/index.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/en/filtration/index.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/en/filtration/parts.astro',
    'src/pages/filtracion/prensa.astro',
    'src/pages/en/filtration/press.astro',
    'src/pages/flotacion/index.astro',
    'src/pages/en/flotation/index.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/flotacion/mecanismos.astro',
    'src/pages/en/flotation/mechanisms.astro',
    'src/pages/control-de-procesos/index.astro',
    'src/pages/en/process-control/index.astro',
  ];

  for (const rel of targetPages) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    for (const pat of forbiddenSourcePatterns) {
      assert.equal(src.includes(pat), false, `${rel} must not contain forbidden visible metalanguage '${pat}'`);
    }
  }
});
