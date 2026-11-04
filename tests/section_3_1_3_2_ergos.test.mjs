import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

test('Sec 3.1 & 3.2 - MS-01: Erradicación de código muerto DEB-31-01 (BaseLayout #rfq redirect) y DEB-31-02 (DiagnosticsHub #rfq dead handler)', () => {
  const baseLayout = fs.readFileSync(path.join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf-8');
  const diagHub = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  assert.ok(
    !baseLayout.includes("hash.indexOf('#rfq') === 0"),
    'BaseLayout.astro no debe contener redirección legada #rfq (DEB-31-01)'
  );
  assert.ok(
    baseLayout.includes('smat_locale_pref'),
    'BaseLayout.astro debe conservar la detección Zero-FOUC de idioma smat_locale_pref'
  );
  assert.ok(
    !diagHub.includes("document.getElementById('rfq')"),
    'DiagnosticsHub.astro no debe buscar #rfq inexistente en /diagnostico/ (DEB-31-02)'
  );
});

test('Sec 3.1 & 3.2 - MS-02: Erradicación física de DualHubView.astro (DEB-32-01) y enriquecimiento de CircuitNavigator.astro con rolesData', () => {
  const dualHubPath = path.join(siteRoot, 'src/components/DualHubView.astro');
  assert.equal(fs.existsSync(dualHubPath), false, 'DualHubView.astro debe estar físicamente eliminado (DEB-32-01)');

  const circuitNav = fs.readFileSync(path.join(siteRoot, 'src/components/CircuitNavigator.astro'), 'utf-8');
  assert.ok(circuitNav.includes("import rolesData from '../../data/roles.json'"), 'CircuitNavigator debe importar rolesData');
  assert.ok(circuitNav.includes('class="decision-criteria-box cn-criteria-chip"'), 'CircuitNavigator debe renderizar .decision-criteria-box.cn-criteria-chip por nodo P&ID');
  assert.ok(circuitNav.includes('subscribeWorkbenchUpdate') && circuitNav.includes('publishWorkbenchUpdate'), 'CircuitNavigator debe sincronizarse con workbenchBus.js');
});

test('Sec 3.1 & 3.2 - MS-03: Puerta 1 (/equipos/ y /en/process-equipment/) sin DualHubView duplicado y con CircuitNavigator en <details class="equipos-circuit-appendix">', () => {
  const eqEs = fs.readFileSync(path.join(siteRoot, 'src/pages/equipos/index.astro'), 'utf-8');
  const eqEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-equipment/index.astro'), 'utf-8');

  assert.ok(!eqEs.includes('DualHubView') && !eqEn.includes('DualHubView'), 'Puerta 1 ES/EN no debe importar ni renderizar DualHubView');
  assert.ok(!eqEs.includes('equipos-segmented-control') && !eqEn.includes('equipos-segmented-control'), 'Puerta 1 ES/EN no debe tener switcher redundante P&ID vs DualHub');
  assert.ok(eqEs.includes('id="equipos-circuit-appendix"') && eqEn.includes('id="equipos-circuit-appendix"'), 'Puerta 1 ES/EN debe alojar CircuitNavigator en <details id="equipos-circuit-appendix">');
  assert.ok(eqEs.includes('@media (max-width: 768px)') && eqEn.includes('@media (max-width: 768px)'), 'Puerta 1 ES/EN debe compactar fold móvil a @media (max-width: 768px)');
});

test('Sec 3.1 & 3.2 - MS-04: Puerta 2 (/bombeo/ y /en/pumping/) con catálogo tabulado único #bombeo-catalog-tabs, sin .wet-lot-callout redundante (DEB-32-02) y CircuitNavigator colapsado', () => {
  const bEs = fs.readFileSync(path.join(siteRoot, 'src/pages/bombeo/index.astro'), 'utf-8');
  const bEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/pumping/index.astro'), 'utf-8');

  assert.ok(!bEs.includes('class="card wet-lot-callout"') && !bEn.includes('class="card wet-lot-callout"'), 'Puerta 2 ES/EN no debe duplicar .wet-lot-callout (DEB-32-02)');
  assert.ok(bEs.includes('id="bombeo-catalog-tabs"') && bEn.includes('id="bombeo-catalog-tabs"'), 'Puerta 2 ES/EN debe consolidar tarjetas en #bombeo-catalog-tabs');
  assert.ok(bEs.includes('data-bombeo-tab="systems"') && bEs.includes('data-bombeo-tab="atomic"'), 'Puerta 2 ES debe tener tabs systems y atomic');
  assert.ok(bEn.includes('data-bombeo-tab="systems"') && bEn.includes('data-bombeo-tab="atomic"'), 'Puerta 2 EN debe tener tabs systems y atomic');
  assert.ok(bEs.includes('getAtomicPartSpecs(part.part_number)') && bEn.includes('getAtomicPartSpecs(part.part_number)'), 'Tab atomic debe mostrar specs físicos getAtomicPartSpecs (weight_kg NIOSH)');
  assert.ok(bEs.includes('id="bombeo-circuit-drawer"') && bEn.includes('id="bombeo-circuit-drawer"'), 'Puerta 2 ES/EN debe envolver CircuitNavigator en <details id="bombeo-circuit-drawer">');
});

test('Sec 3.1 & 3.2 - MS-05: QuoteWizard.astro con "Input First, Readout Second" (#wb-role antes de #wb-atomic-part-card) y sin .circuit-context-banner redundante (DEB-32-03)', () => {
  const wizard = fs.readFileSync(path.join(siteRoot, 'src/components/QuoteWizard.astro'), 'utf-8');
  const wbCss = fs.readFileSync(path.join(siteRoot, 'src/styles/workbench.css'), 'utf-8');

  assert.ok(!wizard.includes('class="circuit-context-banner"'), 'QuoteWizard.astro no debe contener .circuit-context-banner redundante (DEB-32-03)');

  const idxRole = wizard.indexOf('id="wb-role"');
  const idxPipeSize = wizard.indexOf('id="wb-pipe-size"');
  const idxAtomicCard = wizard.indexOf('id="wb-atomic-part-card"');

  assert.ok(idxRole > 0 && idxPipeSize > 0 && idxAtomicCard > 0, 'Deben existir #wb-role, #wb-pipe-size y #wb-atomic-part-card en QuoteWizard.astro');
  assert.ok(
    idxRole < idxAtomicCard && idxPipeSize < idxAtomicCard,
    `Ley Apple HIG Input First, Readout Second: #wb-role (${idxRole}) y #wb-pipe-size (${idxPipeSize}) deben preceder a #wb-atomic-part-card (${idxAtomicCard})`
  );

  assert.ok(
    wbCss.includes('.workbench-header .workbench-subtitle') && wbCss.includes('.console-bay-banner'),
    'workbench.css debe compactar .workbench-subtitle y .console-bay-banner en móvil @media (max-width: 768px)'
  );
});

test('Sec 3.1 & 3.2 - MS-06: /cotizar.astro y /en/quote.astro con .quote-route-banner y .doors-breadcrumb compactos en móvil @media (max-width: 768px)', () => {
  const cotEs = fs.readFileSync(path.join(siteRoot, 'src/pages/cotizar.astro'), 'utf-8');
  const cotEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/quote.astro'), 'utf-8');

  assert.ok(cotEs.includes('@media (max-width: 768px)') && cotEs.includes('flex-wrap: nowrap'), 'cotizar.astro debe convertir .doors-breadcrumb en strip horizontal nowrap en móvil');
  assert.ok(cotEn.includes('@media (max-width: 768px)') && cotEn.includes('flex-wrap: nowrap'), 'en/quote.astro debe convertir .doors-breadcrumb en strip horizontal nowrap en móvil');
});

test('Sec 3.1 & 3.2 - MS-07: Puerta 3 (/control-de-procesos/ y /en/process-control/) con CERO tokens LaTeX crudos ($...$) (DEB-32-04) y CircuitNavigator en <details id="metrology-circuit-drawer">', () => {
  const ctrlEs = fs.readFileSync(path.join(siteRoot, 'src/pages/control-de-procesos/index.astro'), 'utf-8');
  const ctrlEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/process-control/index.astro'), 'utf-8');

  const rawLatexTokens = ['$P_{80}$', '$S_s$', '$C_w$', '$\\rho_p$', '$M_s$', '$d_{95}$', '$a_L$', '$c$', "$y'$", '$n$'];
  for (const token of rawLatexTokens) {
    assert.ok(!ctrlEs.includes(token), `control-de-procesos/index.astro no debe contener token LaTeX crudo ${token} (DEB-32-04)`);
    assert.ok(!ctrlEn.includes(token), `en/process-control/index.astro no debe contener token LaTeX crudo ${token} (DEB-32-04)`);
  }

  assert.ok(ctrlEs.includes('P<sub>80</sub>') && ctrlEs.includes('S<sub>s</sub>') && ctrlEs.includes('C<sub>w</sub>') && ctrlEs.includes('ρ<sub>p</sub>'), 'control-de-procesos/index.astro debe usar subíndices HTML nativos');
  assert.ok(ctrlEn.includes('P<sub>80</sub>') && ctrlEn.includes('S<sub>s</sub>') && ctrlEn.includes('C<sub>w</sub>') && ctrlEn.includes('ρ<sub>p</sub>'), 'en/process-control/index.astro debe usar subíndices HTML nativos');
  assert.ok(ctrlEs.includes('id="metrology-circuit-drawer"') && ctrlEn.includes('id="metrology-circuit-drawer"'), 'Puerta 3 ES/EN debe envolver CircuitNavigator en <details id="metrology-circuit-drawer">');
});

test('Sec 3.1 & 3.2 - MS-08: DiagnosticsHub.astro con .diag-filter-chips en strip horizontal scrollable (flex-wrap: nowrap; overflow-x: auto) en móvil @media (max-width: 768px)', () => {
  const diagHub = fs.readFileSync(path.join(siteRoot, 'src/components/DiagnosticsHub.astro'), 'utf-8');

  assert.ok(diagHub.includes('@media (max-width: 768px)'), 'DiagnosticsHub.astro debe tener media query @media (max-width: 768px)');
  assert.ok(diagHub.includes('flex-wrap: nowrap') && diagHub.includes('overflow-x: auto'), 'DiagnosticsHub.astro debe convertir .diag-filter-chips en strip horizontal scrollable en móvil');
});
