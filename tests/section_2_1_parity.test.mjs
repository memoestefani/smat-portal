import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(SITE_ROOT, 'src');
const DIST_DIR = path.join(SITE_ROOT, 'dist');

function readText(relPath) {
  return fs.readFileSync(path.join(SITE_ROOT, relPath), 'utf8');
}

function collectFiles(dir, extList = ['.astro', '.js', '.mjs', '.css']) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full, extList));
    } else if (extList.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

test('Sección 2.1.1: Las 12 Fichas Atómicas (/catalogo/[code] y /en/catalog/[code]) exponen los 6 campos físicos críticos, NIOSH LI_eje y SharePurchasing', () => {
  const atomicCodes = ['d3147', 'e4147', 'f6147', 'dam028', 'eam028', 'e4083'];
  const esTemplate = readText('src/pages/catalogo/[code].astro');
  const enTemplate = readText('src/pages/en/catalog/[code].astro');

  for (const tpl of [esTemplate, enTemplate]) {
    assert.ok(tpl.includes('getAtomicPartSpecs'), 'Template debe invocar getAtomicPartSpecs');
    assert.ok(tpl.includes('weight_kg'), 'Template debe exponer weight_kg');
    assert.ok(tpl.includes('niosh_handling_mode'), 'Template debe exponer niosh_handling_mode');
    assert.ok(tpl.includes('niosh_lifting_index_shaft'), 'Template debe exponer niosh_lifting_index_shaft (Waters-NIOSH 1993)');
    assert.ok(tpl.includes('impeller_diameter_mm'), 'Template debe exponer impeller_diameter_mm');
    assert.ok(tpl.includes('max_particle_mm'), 'Template debe exponer max_particle_mm');
    assert.ok(tpl.includes('station_number'), 'Template debe exponer station_number');
    assert.ok(tpl.includes('assembly_order_note'), 'Template debe exponer assembly_order_note');
    assert.ok(tpl.includes('wall_thickness_mm'), 'Template debe exponer wall_thickness_mm');
    assert.ok(tpl.includes('<SharePurchasing'), 'Template debe montar <SharePurchasing />');
  }

  if (fs.existsSync(DIST_DIR)) {
    for (const code of atomicCodes) {
      const esHtml = readText(`dist/catalogo/${code}/index.html`);
      const enHtml = readText(`dist/en/catalog/${code}/index.html`);
      for (const html of [esHtml, enHtml]) {
        assert.ok(html.includes('data-testid="atomic-engineering-cards"'), `Ficha ${code} debe renderizar atomic-engineering-cards`);
        assert.ok(html.includes('data-testid="spec-weight-kg"'), `Ficha ${code} debe renderizar peso en kg`);
        assert.ok(html.includes('data-testid="spec-niosh-mode"'), `Ficha ${code} debe renderizar modo e índice NIOSH LI_eje`);
        assert.ok(html.includes('data-testid="spec-station-number"'), `Ficha ${code} debe renderizar estación de armado`);
        assert.ok(html.includes('copy-tsv-btn'), `Ficha ${code} debe incluir botón TSV SAP/Excel de SharePurchasing`);
      }
    }
  }
});

test('Sección 2.1.2: WET_END_MATERIAL_MATRIX.ceramica_sic (Carburo de Silicio Sinterizado SiC, >=2200 HV, Mohs 9.2) está expuesto en selectores y tablas UI', () => {
  const quoteWizard = readText('src/components/QuoteWizard.astro');
  const skidEs = readText('src/pages/bombeo/skid.astro');
  const skidEn = readText('src/pages/en/pumping/skid.astro');
  const revEs = readText('src/pages/bombeo/revestimientos.astro');
  const revEn = readText('src/pages/en/pumping/liners.astro');

  assert.ok(quoteWizard.includes('value="ceramica_sic"'), 'QuoteWizard.astro debe exponer <option value="ceramica_sic">');
  assert.ok(skidEs.includes('value="ceramica_sic"'), 'bombeo/skid.astro debe exponer <option value="ceramica_sic">');
  assert.ok(skidEn.includes('value="ceramica_sic"'), 'en/pumping/skid.astro debe exponer <option value="ceramica_sic">');
  assert.ok(revEs.includes('ceramica_sic') || revEs.includes('WET_END_MATERIAL_MATRIX'), 'bombeo/revestimientos.astro debe renderizar matriz de 4 materiales con SiC');
  assert.ok(revEn.includes('ceramica_sic') || revEn.includes('WET_END_MATERIAL_MATRIX'), 'en/pumping/liners.astro debe renderizar matriz de 4 materiales con SiC');
});

test('Sección 2.1.3 y DEB-21-01/02: SharePurchasing usa &detalles= canónico, hidrata estado vivo del bus y expone formatSapTsv()', () => {
  const sharePurchasing = readText('src/components/SharePurchasing.astro');
  assert.ok(!sharePurchasing.includes('&detalle='), 'SharePurchasing no debe contener el typo &detalle= (DEB-21-01)');
  assert.ok(sharePurchasing.includes('detalles: detallesText') && sharePurchasing.includes('buildAcuseUrlParams'), 'SharePurchasing debe usar parámetro detalles canónico');
  assert.ok(sharePurchasing.includes('loadWorkbenchState'), 'SharePurchasing debe hidratarse con loadWorkbenchState');
  assert.ok(sharePurchasing.includes('buildCanonicalEngineeringSnapshot'), 'SharePurchasing debe usar buildCanonicalEngineeringSnapshot');
  assert.ok(sharePurchasing.includes('formatSapTsv'), 'SharePurchasing debe exponer formatSapTsv (DEB-21-02)');
  assert.ok(sharePurchasing.includes('copy-tsv-btn'), 'SharePurchasing debe renderizar botón .copy-tsv-btn');
});

test('Sección 2.1.4 y DEB-21-03/04: quoteWizardController consume ?serie= en los 4 circuitos, normaliza material (A05/R55/PU/SiC) y activa flot_condition / filt_condition', () => {
  const controller = readText('src/scripts/quoteWizardController.js');
  assert.ok(controller.includes('normalizeMaterialKey'), 'quoteWizardController debe usar normalizeMaterialKey');
  assert.ok(controller.includes('normalizeCircuitSerie'), 'quoteWizardController debe usar normalizeCircuitSerie');
  assert.ok(controller.includes('selectFlotCapacity'), 'quoteWizardController debe hidratar selectFlotCapacity desde ?serie=');
  assert.ok(controller.includes('selectFiltCapacity'), 'quoteWizardController debe hidratar selectFiltCapacity desde ?serie=');
  assert.ok(controller.includes('selectCtrlSpec'), 'quoteWizardController debe hidratar selectCtrlSpec desde ?serie=');
  assert.ok(controller.includes('ctx.flot_condition'), 'quoteWizardController debe hidratar flot_condition desde URL');
  assert.ok(controller.includes('ctx.filt_condition'), 'quoteWizardController debe hidratar filt_condition desde URL');
});

test('Sección 2.1.5 y DEB-21-05: Cero enlaces RFQ muertos hacia Home (/?circuito= o /?equipo=) en todo src/', () => {
  const srcFiles = collectFiles(SRC_DIR, ['.astro', '.js']);
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(SITE_ROOT, file);
    assert.ok(!content.includes('href="/?circuito='), `${rel} no debe apuntar RFQ a /?circuito=`);
    assert.ok(!content.includes('href="/en/?circuito='), `${rel} no debe apuntar RFQ a /en/?circuito=`);
    assert.ok(!content.includes('href="/?equipo='), `${rel} no debe apuntar RFQ a /?equipo=`);
    assert.ok(!content.includes('href="/en/?equipo='), `${rel} no debe apuntar RFQ a /en/?equipo=`);
    assert.ok(!content.includes('&detalle='), `${rel} no debe usar el parámetro roto &detalle=`);
  }
});

test('Sección 2.1.6 y 2.1.7: Subpáginas de Bombeo, Flotación, Filtración y Control de Procesos exponen decision_criteria de roles.json, cinemática ISO 281 L10mh, JKMRC Sb y Darcy-Ruth', () => {
  const pagesWithRoles = [
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
    'src/pages/flotacion/celdas.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/flotacion/mecanismos.astro',
    'src/pages/en/flotation/mechanisms.astro',
    'src/pages/filtracion/prensa.astro',
    'src/pages/en/filtration/press.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/en/filtration/parts.astro',
    'src/pages/control-de-procesos/index.astro',
    'src/pages/en/process-control/index.astro'
  ];

  for (const pagePath of pagesWithRoles) {
    const content = readText(pagePath);
    assert.ok(content.includes('rolesData') && content.includes('decision_criteria'), `${pagePath} debe importar roles.json y renderizar decision_criteria`);
  }

  // Verificar calculadoras/comparadores científicos en Bombeo, Flotación y Filtración
  const soporteEs = readText('src/pages/bombeo/soporte.astro');
  const soporteEn = readText('src/pages/en/pumping/bearing-assembly.astro');
  assert.ok(soporteEs.includes('data-bearing-inspector') && soporteEs.includes('calculateDriveAndBearingKinematics'), 'soporte.astro debe incluir inspector ISO 281:2007');
  assert.ok(soporteEn.includes('data-bearing-inspector') && soporteEn.includes('calculateDriveAndBearingKinematics'), 'bearing-assembly.astro debe incluir inspector ISO 281:2007');

  const selloEs = readText('src/pages/bombeo/sello.astro');
  const selloEn = readText('src/pages/en/pumping/seal.astro');
  assert.ok(selloEs.includes('seal_branch=expeller_dry') && selloEs.includes('DAM028') && selloEs.includes('EAM028'), 'sello.astro debe exponer Estación 02A/02B y fichas DAM028/EAM028');
  assert.ok(selloEn.includes('seal_branch=expeller_dry') && selloEn.includes('DAM028') && selloEn.includes('EAM028'), 'seal.astro debe exponer Estación 02A/02B y fichas DAM028/EAM028');

  const celdasEs = readText('src/pages/flotacion/celdas.astro');
  const prensaEs = readText('src/pages/filtracion/prensa.astro');
  assert.ok(celdasEs.includes('Gorain') && celdasEs.includes('power_range'), 'flotacion/celdas.astro debe exponer ley JKMRC Gorain Sb y power_range');
  assert.ok(prensaEs.includes('Darcy-Ruth') && prensaEs.includes('power_range'), 'filtracion/prensa.astro debe exponer ley Darcy-Ruth y power_range');
});

test('Sección 2.1.8 y DEB-21-08: Contraste WCAG AAA (#7c2d12 / #ffffff) en botones cobre y paridad móvil 390x844 en /en/quote/', () => {
  const circuitNav = readText('src/components/CircuitNavigator.astro');
  const workbenchCss = readText('src/styles/workbench.css');
  const enQuote = readText('src/pages/en/quote.astro');

  assert.ok(circuitNav.includes('#7c2d12'), 'CircuitNavigator.astro debe usar #7c2d12 en .node-cta-rfq para contraste AAA');
  assert.ok(workbenchCss.includes('#7c2d12'), 'workbench.css debe usar #7c2d12 en .btn-open-drawer para contraste AAA');
  assert.ok(enQuote.includes('@media (max-width: 768px)'), 'en/quote.astro debe incluir regla compacta móvil @media (max-width: 768px)');
});
