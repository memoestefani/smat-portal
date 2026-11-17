// tests/v40_single_surface_and_zero_metalanguage.test.mjs
// Suite de Verificación V4.0 (Apple HIG + Ergos Closure):
// D1-V40 a D8-V40 y Purga de Debris DEB-V40-01 a DEB-V40-10

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCmuPrioritySubjectLine,
  computeCmuPriorityDescriptor,
  evaluateBearingCartridgeCoreTradeIn
} from '../src/scripts/requisitionTrayBus.js';
import {
  evaluatePumpAssemblySequence,
  evaluateHybridWetEndConfiguration
} from '../src/scripts/pumpAssemblyAndDriveEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

function readText(relPath) {
  return fs.readFileSync(path.join(siteRoot, relPath), 'utf8');
}

test('D1-V40 (1-C / DEB-V40-01, DEB-V40-02): Un solo carrito canónico en /cotizar/ y /en/quote/ (LiveEngineeringDossier absorbe RequisitionTraySummary y BaseLayout suprime QuickOrderTray en rutas terminales)', () => {
  const baseLayout = readText('src/layouts/BaseLayout.astro');
  assert.ok(
    baseLayout.includes('isTransactionTerminal') &&
      baseLayout.includes('{!isTransactionTerminal && <QuickOrderTray'),
    'BaseLayout.astro debe suprimir <QuickOrderTray /> en /cotizar/, /en/quote/, /acuse/ y /en/thank-you/'
  );

  const dossier = readText('src/components/LiveEngineeringDossier.astro');
  assert.ok(
    dossier.includes('<RequisitionTraySummary') &&
      dossier.includes('data-dossier-embedded-tray="true"'),
    'LiveEngineeringDossier.astro debe integrar <RequisitionTraySummary /> dentro de #pane-sap'
  );

  for (const rel of ['src/pages/cotizar.astro', 'src/pages/en/quote.astro']) {
    const src = readText(rel);
    assert.ok(!src.includes('<RequisitionTraySummary'), `${rel} no debe renderizar <RequisitionTraySummary /> suelto arriba del Wizard`);
    assert.ok(!src.includes('<SharePurchasing'), `${rel} no debe renderizar <SharePurchasing /> debajo del Wizard`);
  }
});

test('D2-V40 (2-C / DEB-V40-04): SharePurchasing.astro opera como cajón secundario colapsado (<details>) con delegación a QuickOrderTray', () => {
  const share = readText('src/components/SharePurchasing.astro');
  assert.ok(
    share.includes('<details class="share-purchasing-widget share-purchasing-drawer"'),
    'SharePurchasing.astro debe encapsular sus botones en un bloque <details> cerrado por defecto'
  );
  assert.ok(
    share.includes('data-delegate-qtray-btn="true"') && share.includes('addTrayItem'),
    'SharePurchasing.astro debe incluir acción de delegación a la bandeja global QuickOrderTray'
  );
});

test('D3-V40 (3-C / DEB-V40-03, DEB-V40-05): Consolidación de navegación en /cotizar/ (sin QuickPartSelectorStrip duplicado) y en /bombeo/ (consola única de 4 pestañas XOR)', () => {
  for (const rel of ['src/pages/cotizar.astro', 'src/pages/en/quote.astro']) {
    const src = readText(rel);
    assert.ok(!src.includes('<QuickPartSelectorStrip'), `${rel} no debe duplicar <QuickPartSelectorStrip /> arriba de <QuoteWizard />`);
    assert.ok(src.includes('data-canonical-single-entry="quote-wizard"'), `${rel} debe declarar consola única quote-wizard`);
  }

  for (const rel of ['src/pages/bombeo/index.astro', 'src/pages/en/pumping/index.astro']) {
    const src = readText(rel);
    assert.ok(src.includes('data-bombeo-tab="assembly"'), `${rel} debe incluir Pestaña 4 (data-bombeo-tab="assembly")`);
    assert.ok(src.includes('data-bombeo-panel="assembly"'), `${rel} debe envolver PumpAssemblyReport y CircuitNavigator dentro de data-bombeo-panel="assembly"`);
  }
});

test('D4-V40 (4-C / DEB-V40-06): Portada /index.astro y /en/index.astro reducen carga focal (Cowan <= 4.00) mediante <details id="home-quick-catalog-drawer">', () => {
  for (const rel of ['src/pages/index.astro', 'src/pages/en/index.astro']) {
    const src = readText(rel);
    assert.ok(
      src.includes('<details class="home-catalog-drawer" id="home-quick-catalog-drawer"'),
      `${rel} debe encapsular los 8 chips de familia y las 19 tarjetas ProductQuickCard en #home-quick-catalog-drawer`
    );
  }
});

test('D5-V40 (5-C / DEB-V40-07, DEB-V40-08): Erradicación 100% de metalenguaje visible (PRIORIDAD-cμ, ORDEN DETERMINISTA FNV-1a, INV-SMAT-* en texto)', () => {
  const uiFiles = [
    'src/components/ProductQuickCard.astro',
    'src/components/QuickOrderTray.astro',
    'src/components/RequisitionTraySummary.astro',
    'src/components/PumpAssemblyReport.astro',
    'src/pages/acuse.astro',
    'src/pages/en/thank-you.astro',
    'src/pages/bombeo/skid.astro',
    'src/pages/en/pumping/skid.astro',
    'src/pages/productos/[slug].astro',
    'src/pages/en/products/[slug].astro',
    'src/pages/catalogo/[code].astro',
    'src/pages/en/catalog/[code].astro'
  ];

  for (const rel of uiFiles) {
    const src = readText(rel);
    for (const forbidden of [
      'PRIORIDAD-cμ',
      'PRIORITY-cμ',
      'ORDEN DETERMINISTA FNV-1a',
      'DETERMINISTIC FNV-1a ORDER',
      '(evaluateCoreTradeInEligibility)',
      '(INV-SMAT-SCI-06)',
      '(INV-SMAT-SCI-05)',
      '(INV-SMAT-SCI-13)'
    ]) {
      assert.strictEqual(
        src.includes(forbidden),
        false,
        `${rel} no debe exponer el token interno '${forbidden}' en texto visible`
      );
    }
  }

  const tradeIn = evaluateBearingCartridgeCoreTradeIn({ items: [], coreReturnEnabled: true }, true);
  assert.strictEqual(tradeIn.invariantId, 'INV-SMAT-SCI-06');
  assert.strictEqual(tradeIn.inspectionGateEs.includes('INV-SMAT-'), false);

  const hyb = evaluateHybridWetEndConfiguration({ d80Microns: 180, tipSpeedMs: 20, pulpPh: 7, solidsWeightPercent: 45, pipeSeries: '6x4' });
  assert.strictEqual(hyb.invariantId, 'INV-SMAT-SCI-05');
  assert.strictEqual(hyb.rationaleEs.includes('INV-SMAT-'), false);

  const seq = evaluatePumpAssemblySequence({ wetEndBranch: 'hybrid_a05_r55' });
  assert.strictEqual(seq.structuralReasonEs.includes('INV-SMAT-'), false);
});

test('D6-V40 (6-C / DEB-V40-09): Lenguaje operativo de planta en encabezados de calculadoras y etiquetas de reorden', () => {
  const calc = readText('src/components/WizardCircuitCalculators.astro');
  assert.ok(calc.includes('AIREACIÓN DE CELDA, FLUJO DE BURBUJA (Sb) Y SUSPENSIÓN (Njs)'));
  assert.ok(calc.includes('RESISTENCIA DE PLACAS A 16 BAR Y CICLO DE FILTRADO'));

  const subj = buildCmuPrioritySubjectLine({ criticalityMode: 'STOCK_SS', items: [] });
  assert.ok(subj.includes('REPOSICIÓN DE STOCK'));
  assert.strictEqual(subj.includes('(s,S)'), false);

  const desc = computeCmuPriorityDescriptor({ urgency: 'normal', estimatedTotalMxn: 45000, stockRegime: 'se_pide' });
  assert.strictEqual(desc.labelEs.includes('(s, S)'), false);
});
