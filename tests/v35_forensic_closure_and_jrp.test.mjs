import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ATOMIC_PARTS_CATALOG,
  parseUrlContextParams,
  getAtomicPartSpecs
} from '../src/scripts/districtProfilesAndSkuCatalog.js';

import {
  computeWizardViewState,
  formatDossierSimulationBanner,
  formatDossierMetrologyBadge
} from '../src/scripts/quoteWizardController.js';

import {
  enrichTrayItemsPreservingMetadata,
  isNonPumpDomain,
  computeFnv1aOrderHash
} from '../src/scripts/acuseSheetController.js';

import {
  calculateFlotationGorainKineticRate,
  evaluateFilterPressPlateDeflection
} from '../src/scripts/slurryEngine.js';

import {
  calculateUrethaneScreenPartitionWeibull
} from '../src/scripts/mechanicalAndSeparationEngine.js';

import {
  calculateCoupledReorderWindowDays,
  buildSmatVendorPassportPayload
} from '../src/scripts/requisitionTrayBus.js';

import {
  formatDualCheckoutPayload
} from '../src/scripts/workbenchExportFormatters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('D1-V35 (SLICE-V35-05..06): Clausura 1-hop en public/_redirects y 0 destinos de valvulas eliminadas', () => {
  const redirectsRaw = fs.readFileSync(path.join(SITE_ROOT, 'public', '_redirects'), 'utf8');
  const map = new Map();
  let ruleCount = 0;
  for (const line of redirectsRaw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      ruleCount += 1;
      const src = parts[0].replace(/\/$/, '');
      const dst = parts[1].split('#')[0].replace(/\/$/, '');
      map.set(src, dst);
    }
  }
  assert.ok(ruleCount >= 105, 'Deben existir >= 105 reglas 301 en _redirects');
  for (const [src, dst] of map.entries()) {
    assert.ok(!map.has(dst), `Cadena 2-hop prohibida detectada: ${src} -> ${dst} -> ${map.get(dst)}`);
    assert.ok(
      !dst.includes('manga-elastomero-valvula-pinch-lodos') &&
      !dst.includes('valvula-guillotina-bidireccional-lodos'),
      `Destino de valvula eliminada en _redirects: ${src} -> ${dst}`
    );
  }
});

test('D2-V35 (SLICE-V35-07 & SLICE-V35-18): Puente Plano 1 <-> Plano 2 (?sku=SMAT-*, ?mat=, hidrociclon_apex_vortex)', () => {
  const ctxCyc = parseUrlContextParams('?sku=SMAT-CYC-D6-D20&mat=SiC');
  assert.equal(ctxCyc.sku, 'SMAT-CYC-D6-D20');
  assert.equal(ctxCyc.circuito, 'clasificacion');
  assert.equal(ctxCyc.rol, 'hidrociclon_apex_vortex');
  assert.equal(ctxCyc.material, 'SiC');

  const viewState = computeWizardViewState({}, '?sku=SMAT-CYC-D6-D20&mat=SiC');
  assert.equal(viewState.circuit, 'bombeo');
  assert.equal(viewState.roleId, 'hidrociclon_apex_vortex');
  assert.equal(viewState.selectedMaterial, 'SiC');
  assert.equal(viewState.coupledClassificationActive, true);
  assert.equal(viewState.panels.clasificacionVisible, true);

  const banner = formatDossierSimulationBanner('clasificacion', true, 'hidrociclon_apex_vortex');
  assert.ok(banner.headline.includes('Plitt'));
  const badge = formatDossierMetrologyBadge({ cw: 42.5, sm: 1.38, p80: 105 }, true);
  assert.ok(badge.includes('Cw 42.5%'));
});

test('D3-V35 (SLICE-V35-08..10): Simuladores interactivos Plano 3 ejecutables y conectados en <script>', () => {
  const gorain = calculateFlotationGorainKineticRate({ jgCmS: 1.5, d32Mm: 1.55, rotorDiaM: 0.61, rotorRpm: 215 });
  assert.ok(gorain.sbInverseSeconds >= 55);
  assert.equal(typeof gorain.tipSpeedMS, 'number');

  const plate = evaluateFilterPressPlateDeflection({ plateWidthMm: 1200, feedPressureBar: 14, plateThicknessMm: 65 });
  assert.equal(typeof plate.maxBendingStressMpa, 'number');

  const screen = calculateUrethaneScreenPartitionWeibull({ apertureMm: 1.2, feedParticleUm: 1600, reliefAngleDeg: 4.0 });
  assert.equal(typeof screen.partitionToOversizePct, 'number');

  const jrp = calculateCoupledReorderWindowDays({ sg: 1.5, d50Um: 120 });
  assert.equal(jrp.sleeveInspectionDay, 90);
  assert.equal(jrp.impellerThroatbushSwapDay, 150);

  const dualPayload = formatDualCheckoutPayload({ estimatedMxn: 18500, stockRegime: 'hay' });
  assert.ok(dualPayload.lane.includes('CAJA_CHICA'));
});

test('D4-V35 & D5-V35 (SLICE-V35-11..12): Pureza 3NF en quick_checkout_Catalog.json y Acuse Polimorfico SAT/JRP (PutGet Lens)', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data', 'quick_checkout_Catalog.json'), 'utf8'));
  const marcy = catalog.find((s) => s.sku_id === 'SMAT-LAB-MARCY-1000');
  const cloth = catalog.find((s) => s.sku_id === 'SMAT-FILT-CLOTH-PLATE');
  const marcyOpt0 = typeof marcy.config_options_es[0] === 'string' ? marcy.config_options_es[0] : marcy.config_options_es[0].label;
  const clothOpt0 = typeof cloth.config_options_es[0] === 'string' ? cloth.config_options_es[0] : cloth.config_options_es[0].label;
  assert.ok(marcyOpt0.includes('1000 cm³'), 'Balanza Marcy debe tener opciones de dial/vaso, no aleaciones de bomba');
  assert.ok(clothOpt0.includes('Polipropileno'), 'Placas y telas deben tener opciones de polimero/presion, no aleaciones de bomba');

  const existingLocal = [
    {
      id: 'SMAT-LAB-MARCY-1000',
      skuId: 'SMAT-LAB-MARCY-1000',
      qty: 1,
      nameEs: 'Balanza Marcy CS-1',
      material: 'Inox 304',
      unitWeightKg: 4.8
    }
  ];
  const enriched = enrichTrayItemsPreservingMetadata(
    [{ id: 'SMAT-LAB-MARCY-1000', skuId: 'SMAT-LAB-MARCY-1000', qty: 2 }],
    existingLocal
  );
  assert.equal(enriched[0].qty, 2);
  assert.equal(enriched[0].nameEs, 'Balanza Marcy CS-1');
  assert.equal(enriched[0].material, 'Inox 304');
  assert.ok(enriched[0].satLine.includes('41111505') || enriched[0].satLine.includes('SAT'));
  assert.equal(isNonPumpDomain('control_procesos', 'SMAT-LAB-MARCY-1000', 'SMAT-LAB-MARCY-1000'), true);
  assert.equal(isNonPumpDomain('bombeo', 'SMAT-PUMP-IMP-AH', 'SMAT-PUMP-6X4-WETKIT'), false);
  assert.ok(computeFnv1aOrderHash('SMAT-LAB-MARCY-1000').startsWith('SMAT-ORD-'));

  const passport = buildSmatVendorPassportPayload({});
  assert.equal(passport.jsonMetadata.postalCode, '34166');
});

test('D6-V35 & D7-V35 (SLICE-V35-13..16): Mapeo 1:1 D3147/F6147 (masas reales distintas) y 0 cutwater', () => {
  const specD3147 = ATOMIC_PARTS_CATALOG.D3147;
  const specE4147 = ATOMIC_PARTS_CATALOG.E4147;
  const specF6147 = ATOMIC_PARTS_CATALOG.F6147;
  assert.equal(specD3147.weight_kg, 32.5);
  assert.equal(specE4147.weight_kg, 68);
  assert.equal(specF6147.weight_kg, 142);
  assert.notEqual(specD3147.weight_kg, specE4147.weight_kg);
  assert.notEqual(specF6147.weight_kg, specE4147.weight_kg);

  for (const rel of [
    'data/atomic_parts.json',
    'data/roles.json',
    'data/circuits.json',
    'data/diagnostics.json',
    'src/components/TechnicalDiagrams.astro',
    'src/pages/en/about.astro'
  ]) {
    const raw = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8').toLowerCase();
    assert.ok(!raw.includes('cutwater'), `${rel} no debe contener el termino prohibido 'cutwater'`);
  }
});
