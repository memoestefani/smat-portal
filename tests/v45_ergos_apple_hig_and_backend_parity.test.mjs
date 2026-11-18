// tests/v45_ergos_apple_hig_and_backend_parity.test.mjs
// Suite de verificación de extremo a extremo para la Ronda V4.5 (D1-V45 a D10-V45, ARB-SMAT-53, GOLD-719, Gate 48).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  projectVerticalPayloadToWorkbenchPatch,
  syncVerticalCtaLinks,
  commitVerticalSimulation,
  loadUnifiedEngineeringAndWorkbenchState,
  bindAtomicPartTrayButtons
} from '../src/scripts/verticalStateAndCtaSyncBridge.js';
import { initPumpAssemblyReport } from '../src/scripts/pumpAssemblyReportController.js';
import {
  saveEngineeringContextSnapshot,
  loadEngineeringContextSnapshot
} from '../src/scripts/wizardCircuitPhysicsController.js';
import {
  loadWorkbenchState,
  saveWorkbenchState
} from '../src/scripts/workbenchBus.js';
import {
  bindCanonicalSealBalanceCalculator,
  bindCanonicalTribologySelector
} from '../src/scripts/pumpingSealAndTribologyCalculators.js';
import {
  WET_END_MATERIAL_MATRIX,
  WET_END_MATERIAL_KITS
} from '../src/scripts/tribologyAndCompatibilityEngine.js';
import {
  getQuickProductsByAvenue,
  AVENUE_METADATA
} from '../src/scripts/quickProductsCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function installMockWebStorage() {
  const localStore = new Map();
  const sessionStore = new Map();
  globalThis.window = globalThis.window || {};
  globalThis.window.localStorage = {
    getItem: (k) => (localStore.has(k) ? localStore.get(k) : null),
    setItem: (k, v) => localStore.set(k, String(v)),
    removeItem: (k) => localStore.delete(k),
    clear: () => localStore.clear()
  };
  globalThis.window.sessionStorage = {
    getItem: (k) => (sessionStore.has(k) ? sessionStore.get(k) : null),
    setItem: (k, v) => sessionStore.set(k, String(v)),
    removeItem: (k) => sessionStore.delete(k),
    clear: () => sessionStore.clear()
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.sessionStorage = globalThis.window.sessionStorage;
  return { localStore, sessionStore };
}

test('D1-V45 (1): projectVerticalPayloadToWorkbenchPatch y commitVerticalSimulation sincronizan smat_engineering_context_v1, smat_workbench_state_v2 y href de CTAs', () => {
  installMockWebStorage();

  // Primero guardamos estado de flotación
  commitVerticalSimulation('flotacion', {
    jgCmS: 1.55,
    d32Mm: 1.35,
    sbInverseS: 68.89,
    recommendedMechanism: '18 SP'
  });

  // Luego guardamos estado de filtración y verificamos que saveEngineeringContextSnapshot preserva flotación (PutGet DEB-V45-08)
  const anchors = [
    {
      href: '/cotizar/?circuito=filtracion&equipo=filtro_prensa#rfq',
      getAttribute(attr) { return attr === 'href' ? this.href : null; },
      setAttribute(attr, val) { if (attr === 'href') this.href = val; }
    }
  ];
  const mockRoot = {
    querySelectorAll: () => anchors
  };

  commitVerticalSimulation('filtracion', {
    plateWidthMm: 1500,
    feedPressureBar: 16,
    cakeMoistureTargetPct: 11.5,
    cyclesPerDay: 22
  }, {
    root: mockRoot,
    queryPatch: {
      filt_plate_mm: 1500,
      filt_pressure_bar: 16
    }
  });

  const ctx = loadEngineeringContextSnapshot();
  assert.ok(ctx.flotation, 'saveEngineeringContextSnapshot debe preservar la rama flotation previa (DEB-V45-08)');
  assert.equal(ctx.flotation.jgCmS, 1.55);
  assert.ok(ctx.filtration, 'saveEngineeringContextSnapshot debe registrar la rama filtration');
  assert.equal(ctx.filtration.plateWidthMm, 1500);

  const wb = loadWorkbenchState();
  assert.equal(wb.circuit, 'filtracion');
  assert.equal(wb.plateWidthMm, 1500);
  assert.equal(wb.feedPressureBar, 16);

  assert.ok(anchors[0].href.includes('circuito=filtracion'), 'syncVerticalCtaLinks debe preservar circuito=filtracion en CTA href');
  assert.ok(anchors[0].href.includes('filt_plate_mm=1500'), 'syncVerticalCtaLinks debe inyectar filt_plate_mm=1500 en CTA href');
  assert.ok(anchors[0].href.endsWith('#rfq'), 'syncVerticalCtaLinks debe preservar el hash #rfq');
});

test('D1-V45 (2) & DEB-V45-01/02: purga total de statements void muertos en las 5 páginas Astro', () => {
  const targetFiles = [
    'src/pages/acuse.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/clasificacion/index.astro'
  ];
  for (const rel of targetFiles) {
    const content = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(!content.includes('void enrichTrayItemsPreservingMetadata'), `${rel} no debe contener void enrichTrayItemsPreservingMetadata`);
    assert.ok(!content.includes('void saveEngineeringContextSnapshot'), `${rel} no debe contener void saveEngineeringContextSnapshot`);
  }
});

test('D2-V45 & DEB-V45-07: loadUnifiedEngineeringAndWorkbenchState e initAcuseSheetController calculan ventana JRP (s, S) dinámica por partida y exponen Pasaporte B2B', () => {
  installMockWebStorage();

  saveWorkbenchState({
    circuit: 'bombeo',
    role: 'kit_wet_end',
    sg: 4.1,
    cw: 62,
    d80: 520,
    criticalityMode: 'paro_planta'
  });

  saveEngineeringContextSnapshot('flotacion', {
    jgCmS: 1.6,
    sbInverseS: 68.5
  });

  const unified = loadUnifiedEngineeringAndWorkbenchState('?circuito=bombeo&sg=4.1&d80=520');
  assert.equal(Number(unified.sg), 4.1);
  assert.equal(Number(unified.d50Um), 520);
  assert.ok(unified.flotation, 'loadUnifiedEngineeringAndWorkbenchState debe adjuntar flotation desde smat_engineering_context_v1');

  const acuseCtrlSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/acuseSheetController.js'), 'utf8');
  assert.ok(acuseCtrlSrc.includes('loadUnifiedEngineeringAndWorkbenchState'), 'acuseSheetController.js debe hidratar desde las 3 fuentes');
  assert.ok(acuseCtrlSrc.includes('criticalityMode: it.criticalityMode'), 'acuseSheetController.js debe pasar criticalityMode real por partida a calculateCoupledReorderWindowDays');
  assert.ok(acuseCtrlSrc.includes('bindVendorPassportDownloadButtons'), 'acuseSheetController.js debe enlazar los botones de descarga del Pasaporte B2B');
});

test('D3-V45: /flotacion/index.astro y /en/flotation/index.astro montan calculadora Gorain S_b + Zwietering N_js y SharePurchasing', () => {
  for (const rel of ['src/pages/flotacion/index.astro', 'src/pages/en/flotation/index.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('id="celdas-gorain-readout"'), `${rel} debe incluir #celdas-gorain-readout`);
    assert.ok(src.includes('bindCanonicalFlotationCalculator'), `${rel} debe invocar bindCanonicalFlotationCalculator`);
    assert.ok(src.includes('<SharePurchasing'), `${rel} debe montar <SharePurchasing />`);
  }
});

test('D4-V45 & DEB-V45-06: CatalogAvenuesMatrix.astro proyecta los 19 SKUs en 7 Avenidas y /catalogo/ expone la 5ª rama hybrid_a05_r55', () => {
  const byAvenue = getQuickProductsByAvenue();
  const avenueKeys = Object.keys(AVENUE_METADATA);
  assert.equal(avenueKeys.length, 7, 'AVENUE_METADATA debe cubrir las 7 avenidas canónicas');
  const uniqueSkus = new Set();
  for (const k of avenueKeys) {
    for (const item of (byAvenue[k] || [])) {
      uniqueSkus.add(item.sku_id);
    }
  }
  assert.equal(uniqueSkus.size, 19, 'getQuickProductsByAvenue debe cubrir exactamente los 19 SKUs canónicos únicos');

  assert.ok(WET_END_MATERIAL_MATRIX.hybrid_a05_r55, 'WET_END_MATERIAL_MATRIX debe definir hybrid_a05_r55');
  for (const rel of ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('<CatalogAvenuesMatrix'), `${rel} debe montar <CatalogAvenuesMatrix />`);
    assert.ok(src.includes('hybrid_a05_r55'), `${rel} debe incluir la 5ª rama hybrid_a05_r55`);
    assert.ok(!src.includes('EDICIÓN V3.1'), `${rel} no debe contener el badge obsoleto EDICIÓN V3.1`);
  }
});

test('D5-V45 & DEB-V45-10: pureza escalar ISO 80000-1 en #seal-pbox-out y #trib-kic-out + exposición de WET_END_MATERIAL_KITS', () => {
  installMockWebStorage();

  // Probamos bindCanonicalSealBalanceCalculator con DOM simulado
  const sealNodes = {
    '#seal-hd-m': { value: '28' },
    '#seal-hs-m': { value: '3.2' },
    '#seal-exp-dia': { value: '280' },
    '#seal-rpm': { value: '1150' },
    '#seal-sg': { value: '1.38' },
    '#seal-pexp-out': { textContent: '' },
    '#seal-pbox-out': { textContent: '' },
    '#seal-pwater-out': { textContent: '' },
    '#seal-branch-out': { textContent: '' },
    '#seal-status-out': { textContent: '', style: {} }
  };
  const sealRoot = {
    querySelector: (sel) => sealNodes[sel] || null,
    querySelectorAll: () => []
  };
  const sealRes = bindCanonicalSealBalanceCalculator(sealRoot, 'es');
  assert.ok(sealRes, 'bindCanonicalSealBalanceCalculator debe inicializar y retornar resultado');
  assert.ok(!sealNodes['#seal-pbox-out'].textContent.includes('('), '#seal-pbox-out no debe contener paréntesis (ISO 80000-1)');
  assert.match(sealNodes['#seal-pbox-out'].textContent, /^-?\d+(\.\d+)? kPa$/);

  // Probamos bindCanonicalTribologySelector con DOM simulado
  const tribNodes = {
    '#trib-d80-um': { value: '650' },
    '#trib-vtip-ms': { value: '24.5' },
    '#trib-ph': { value: '4.5' },
    '#trib-branch': { value: 'auto' },
    '#trib-series': { value: '6x4' },
    '#trib-mat-out': { textContent: '' },
    '#trib-kic-out': { textContent: '' },
    '#trib-arch-out': { textContent: '' },
    '#trib-status-out': { textContent: '', style: {} }
  };
  const tribRoot = {
    querySelector: (sel) => tribNodes[sel] || null,
    querySelectorAll: () => []
  };
  const tribRes = bindCanonicalTribologySelector(tribRoot, 'es');
  assert.ok(tribRes, 'bindCanonicalTribologySelector debe inicializar y retornar resultado');
  assert.ok(!tribNodes['#trib-kic-out'].textContent.includes('('), '#trib-kic-out no debe contener paréntesis (ISO 80000-1)');
  assert.match(tribNodes['#trib-kic-out'].textContent, /^\d+(\.\d+)? MPa·√m$/);
  assert.ok(Object.keys(WET_END_MATERIAL_KITS).length >= 3, 'WET_END_MATERIAL_KITS debe estar poblado');
});

test('D6-V45..D10-V45 & DEB-V45-03..05: TechnicalDiagrams.astro sufija los 13 <pattern> con uid, DiagnosticsHub evita transition:all y tour.toml usa .showcase-card', () => {
  const diagSvgSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/TechnicalDiagrams.astro'), 'utf8');
  assert.ok(diagSvgSrc.includes('__smatSvgInstanceSeq'), 'TechnicalDiagrams.astro debe generar un contador monotónico SSR por invocación');
  for (const pat of [
    'grid-pump', 'grid-imp', 'grid-lin', 'grid-bear', 'grid-exp',
    'grid-flot', 'grid-filt', 'grid-marcy', 'grid-batch', 'grid-sieves',
    'grid-drives', 'grid-matkit', 'grid-suction'
  ]) {
    assert.ok(diagSvgSrc.includes(`id={\`${pat}-\${uid}\`}`), `TechnicalDiagrams.astro debe sufijar ${pat} con \${uid}`);
    assert.ok(diagSvgSrc.includes(`fill={\`url(#${pat}-\${uid})\`}`), `TechnicalDiagrams.astro debe referenciar url(#${pat}-\${uid})`);
  }

  const diagHubSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticsHub.astro'), 'utf8');
  assert.ok(!diagHubSrc.includes('transition: all 0.15s ease'), 'DiagnosticsHub.astro no debe usar transition: all en .diag-pill');
  assert.ok(diagHubSrc.includes('saveEngineeringContextSnapshot'), 'DiagnosticsHub.astro debe sincronizar smat_engineering_context_v1 al pulsar .diag-quote-btn');

  const tourTomlSrc = fs.readFileSync(path.join(SITE_ROOT, '../ergos/tour.toml'), 'utf8');
  assert.ok(tourTomlSrc.includes('wait_selector = ".showcase-card"'), 'smat/ergos/tour.toml debe esperar .showcase-card en act_1_home');
  assert.ok(!tourTomlSrc.includes('wait_selector = ".door-card"'), 'smat/ergos/tour.toml no debe contener el selector obsoleto .door-card');
});

test('V46-1 (D1-V46 / DEB-V46-01): /bombeo/soporte/ y /en/pumping/bearing-assembly/ sincronizan smat_engineering_context_v1, smat_workbench_state_v2 y todos los CTAs vía commitVerticalSimulation', () => {
  for (const rel of ['src/pages/bombeo/soporte.astro', 'src/pages/en/pumping/bearing-assembly.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes("commitVerticalSimulation('bombeo'"), `${rel} debe invocar commitVerticalSimulation('bombeo', ...)`);
    assert.ok(!src.includes("saveEngineeringContextSnapshot('bombeo'"), `${rel} no debe escribir sólo a saveEngineeringContextSnapshot sin cruzar a smat_workbench_state_v2 (DEB-V46-01)`);
  }
});

test('V46-2 (D2-V46 / DEB-V46-02): Pinned-Key Alignment Lens en syncVerticalCtaLinks preserva material=, seal_branch= y codigo= en tarjetas fijas y actualiza serie= en CTAs generales', () => {
  const links = [
    {
      href: '/cotizar/?circuito=bombeo&equipo=solo_impulsor&material=hule_natural&estacion=S3#rfq',
      fixed: 'material',
      getAttribute(attr) { return attr === 'href' ? this.href : (attr === 'data-card-fixed-params' ? this.fixed : null); },
      setAttribute(attr, val) { if (attr === 'href') this.href = val; }
    },
    {
      href: '/cotizar/?circuito=bombeo&equipo=kit_sellado&seal_branch=gland_water&estacion=S2#rfq',
      fixed: 'seal_branch',
      getAttribute(attr) { return attr === 'href' ? this.href : (attr === 'data-card-fixed-params' ? this.fixed : null); },
      setAttribute(attr, val) { if (attr === 'href') this.href = val; }
    },
    {
      href: '/cotizar/?codigo=D3147&circuito=bombeo&equipo=solo_impulsor&serie=3x2&peso_kg=18.5&estacion=S3#rfq',
      fixed: '',
      getAttribute(attr) { return attr === 'href' ? this.href : (attr === 'data-card-fixed-params' ? this.fixed : null); },
      setAttribute(attr, val) { if (attr === 'href') this.href = val; }
    },
    {
      href: '/cotizar/?circuito=bombeo&equipo=solo_impulsor&serie=6x4&material=alto_cromo_cr27&estacion=S3#rfq',
      fixed: '',
      getAttribute(attr) { return attr === 'href' ? this.href : (attr === 'data-card-fixed-params' ? this.fixed : null); },
      setAttribute(attr, val) { if (attr === 'href') this.href = val; }
    }
  ];
  const root = { querySelectorAll: () => links };

  syncVerticalCtaLinks(root, 'bombeo', {
    serie: '8x6',
    material: 'hybrid_a05_r55',
    seal_branch: 'expeller_dry',
    d80: 450,
    u2_ms: 23.5
  });

  // 1. Tarjeta con data-card-fixed-params="material" preserva material=hule_natural pero recibe serie=8x6 y d80=450
  assert.ok(links[0].href.includes('material=hule_natural'), 'Tarjeta fija de material debe preservar material=hule_natural');
  assert.ok(links[0].href.includes('serie=8x6'), 'Tarjeta de material debe recibir serie=8x6 simulada');
  assert.ok(links[0].href.includes('d80=450'), 'Tarjeta de material debe recibir telemetría d80=450');

  // 2. Tarjeta con data-card-fixed-params="seal_branch" preserva seal_branch=gland_water
  assert.ok(links[1].href.includes('seal_branch=gland_water'), 'Tarjeta 02B fija debe preservar seal_branch=gland_water');

  // 3. Ficha atómica con codigo=D3147 preserva codigo=D3147 y serie=3x2
  assert.ok(links[2].href.includes('codigo=D3147') && links[2].href.includes('serie=3x2'), 'Ficha atómica D3147 debe preservar codigo=D3147 y su serie=3x2');
  assert.ok(links[2].href.includes('u2_ms=23.5'), 'Ficha atómica D3147 debe recibir telemetría u2_ms=23.5');

  // 4. CTA general del simulador actualiza serie=8x6 y material=hybrid_a05_r55
  assert.ok(links[3].href.includes('serie=8x6') && links[3].href.includes('material=hybrid_a05_r55'), 'CTA general debe actualizar dinámicamente serie=8x6 y material=hybrid_a05_r55');
});

test('V46-3 (D3-V46 & D7-V46 / DEB-V46-03,04,10): Paridad 5/5 materiales SSOT (hybrid_a05_r55), data-card-fixed-params y pureza escalar ISO 80000-1 en SSR de las 6 sub-páginas de bombeo', () => {
  for (const rel of [
    'src/pages/bombeo/impulsor.astro',
    'src/pages/bombeo/revestimientos.astro',
    'src/pages/en/pumping/impeller.astro',
    'src/pages/en/pumping/liners.astro'
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('hybrid_a05_r55'), `${rel} debe proyectar la 5ª rama hybrid_a05_r55 en wetMaterials (D3-V46)`);
    assert.ok(src.includes('data-card-fixed-params="material"'), `${rel} debe declarar data-card-fixed-params="material" en sus tarjetas de aleación`);
    assert.ok(src.includes('<span id="trib-kic-out">18.5 MPa·√m</span>'), `${rel} debe renderizar #trib-kic-out como escalar puro ISO 80000-1 sin paréntesis en SSR (D7-V46)`);
  }

  for (const rel of ['src/pages/bombeo/sello.astro', 'src/pages/en/pumping/seal.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('data-card-fixed-params="seal_branch"'), `${rel} debe declarar data-card-fixed-params="seal_branch" en las tarjetas 02A y 02B`);
    assert.ok(src.includes('<span id="seal-pbox-out">88.8 kPa</span>'), `${rel} debe renderizar #seal-pbox-out como escalar puro ISO 80000-1 sin paréntesis en SSR (D7-V46)`);
  }
});

test('V46-4 (D4-V46 & D5-V46 / DEB-V46-05,07): 9/9 filas de series en /catalogo/ incluyen circuito=bombeo y fichas atómicas exponen botón + Bandeja [data-add-tray-sku]', () => {
  for (const rel of ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(!src.includes('?equipo=skid_bomba&serie='), `${rel} no debe tener ninguna fila de serie sin circuito=bombeo (D4-V46)`);
    for (const s of ['1.5x1', '2x1.5', '3x2', '4x3', '6x4', '8x6', '10x8', '12x10', '14x12']) {
      assert.ok(src.includes(`circuito=bombeo&equipo=skid_bomba&serie=${s}#rfq`), `${rel} debe tener enlace canónico circuito=bombeo para serie ${s}`);
    }
    assert.ok(src.includes('data-tray-source="catalog_fichas_atomicas"'), `${rel} debe exponer botón + Bandeja en #fichas-atomicas (D5-V46)`);
  }

  // Verificar funcionamiento de bindAtomicPartTrayButtons
  installMockWebStorage();
  let clickHandler = null;
  const mockBtn = {
    dataset: {},
    textContent: '+ Bandeja',
    getAttribute(name) {
      const map = {
        'data-add-tray-sku': 'SMAT-PUMP-IMP-147',
        'data-tray-part-code': 'E4147',
        'data-tray-title': 'Impulsor Cerrado 5 Álabes (E4147)',
        'data-tray-series': '6x4',
        'data-tray-material': 'A05'
      };
      return map[name] || '';
    },
    addEventListener(ev, fn) {
      if (ev === 'click') clickHandler = fn;
    }
  };
  const bound = bindAtomicPartTrayButtons({ querySelectorAll: () => [mockBtn] });
  assert.equal(bound, 1, 'bindAtomicPartTrayButtons debe enlazar el botón [data-add-tray-sku]');
  assert.ok(typeof clickHandler === 'function');
  clickHandler({ preventDefault() {} });
  const trayRaw = globalThis.window.localStorage.getItem('smat_requisition_tray_v3');
  assert.ok(trayRaw && trayRaw.includes('E4147'), 'El clic en [data-add-tray-sku] debe insertar la pieza E4147 en smat_requisition_tray_v3');
});

test('V46-5 (D6-V46 / DEB-V46-08,09): PumpAssemblyReport.astro (< 950 LOC) proyecta PUMP_554_ASSEMBLY_STATIONS y delega el controlador a pumpAssemblyReportController.js (LCOM4 = 1)', () => {
  const reportSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/PumpAssemblyReport.astro'), 'utf8');
  const lineCount = reportSrc.split(/\r?\n/).length;
  assert.ok(lineCount < 950, `PumpAssemblyReport.astro debe mantenerse < 950 LOC tras extracción LCOM4=1 (actual: ${lineCount} LOC)`);
  assert.ok(reportSrc.includes('PUMP_554_ASSEMBLY_STATIONS'), 'PumpAssemblyReport.astro debe importar PUMP_554_ASSEMBLY_STATIONS');
  assert.ok(reportSrc.includes('data-station-role={st.roleId}'), 'PumpAssemblyReport.astro debe proyectar data-station-role={st.roleId} en .station-card');
  assert.ok(reportSrc.includes('station-card__parts'), 'PumpAssemblyReport.astro debe proyectar las partes st.parts en .station-card');
  assert.ok(reportSrc.includes("from '../scripts/pumpAssemblyReportController.js'"), 'PumpAssemblyReport.astro debe delegar en pumpAssemblyReportController.js');
  assert.equal(typeof initPumpAssemblyReport, 'function', 'pumpAssemblyReportController.js debe exportar initPumpAssemblyReport');
});
