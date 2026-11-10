import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  evaluateHybridWetEndConfiguration,
  MECHANICAL_DIAGNOSTICS,
  calculateFlotationGorainKineticRate,
  evaluateFilterPressPlateDeflection
} from '../src/scripts/slurryEngine.js';

import {
  evaluateBearingCartridgeCoreTradeIn,
  syncTrayToWorkbenchStateLens,
  buildSmatVendorPassportPayload
} from '../src/scripts/requisitionTrayBus.js';

import {
  ATOMIC_PARTS_CATALOG,
  resolveMiningDistrictPreset
} from '../src/scripts/workbenchBus.js';

import { computeImageDHash64 } from '../tools/build_product_images.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('D1 = 1-C++ (SLICE-V31-01): Señalización Física de Inventario DeHoratius & Raman (2008) en los 19 SKUs y 13 partes atómicas', () => {
  const qcCatalog = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json'), 'utf8'));
  const atomicParts = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/atomic_parts.json'), 'utf8'));

  assert.equal(qcCatalog.length, 19, 'Deben existir 19 SKUs en quick_checkout_Catalog.json');
  for (const sku of qcCatalog) {
    assert.ok(sku.warehouse_audit, `SKU ${sku.sku_id} debe tener warehouse_audit`);
    assert.equal(sku.warehouse_audit.physical_audit_date, '2026-11-10');
    assert.equal(sku.warehouse_audit.warehouse_total_mxn, 1646850);
    assert.equal(sku.warehouse_audit.warehouse_total_units, 383);
    assert.equal(sku.warehouse_audit.warehouse_active_sku_count, 35);
    assert.equal(typeof sku.warehouse_audit.availability_tier, 'string');
    assert.ok(sku.warehouse_audit.availability_tier.length > 0);
  }

  assert.equal(atomicParts.length, 13, 'Deben existir 13 partes atómicas en atomic_parts.json');
  for (const part of atomicParts) {
    assert.equal(typeof part.physical_stock_durango_units, 'number', `Parte ${part.part_code} debe tener physical_stock_durango_units numérico`);
    assert.equal(typeof part.unit_replacement_value_mxn, 'number', `Parte ${part.part_code} debe tener unit_replacement_value_mxn numérico`);
  }
});

test('D2 = 2-C++ (SLICE-V31-02..03 / INV-SMAT-SCI-05): Tribología Híbrida de Extremo Húmedo (A05 + R55) y 6 Modos Canónicos de Falla', () => {
  const hybrid = evaluateHybridWetEndConfiguration({ d80Microns: 220, solidsWeightPercent: 48, pulpPh: 7.5, tipSpeedMs: 21.5 });
  assert.equal(hybrid.architectureId, 'hybrid_a05_impeller_r55_liners');
  assert.equal(hybrid.impellerMaterialCode, 'A05');
  assert.equal(hybrid.linerMaterialCode, 'R55');
  assert.equal(hybrid.hybridRecommended, true);
  assert.ok(hybrid.massSavingsPct > 0);

  const diagKeys = Object.keys(MECHANICAL_DIAGNOSTICS);
  assert.ok(diagKeys.includes('seal_stuffing_box'), 'MECHANICAL_DIAGNOSTICS debe incluir seal_stuffing_box');
  assert.ok(diagKeys.includes('bearing_shaft_fatigue'), 'MECHANICAL_DIAGNOSTICS debe incluir bearing_shaft_fatigue');

  const diagJson = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/diagnostics.json'), 'utf8'));
  assert.equal(diagJson.diagnostics.length, 6, 'diagnostics.json debe tener 6 modos canónicos de falla');

  const pumpReport = fs.readFileSync(path.join(SITE_ROOT, 'src/components/PumpAssemblyReport.astro'), 'utf8');
  assert.ok(pumpReport.includes('data-assembly-branch-btn="hybrid_a05_r55"'));
  assert.ok(pumpReport.includes('data-wet-branch="hybrid_a05_r55"'));
});

test('D3 = 3-C++ (SLICE-V31-04 / DEB-V31-01): 19/19 Imágenes WebP Únicas con Huella Perceptual dHash de 64 bits (Zauner 2010)', async () => {
  const qcCatalog = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json'), 'utf8'));
  const sha256Set = new Set();
  const dhashSet = new Set();

  for (const sku of qcCatalog) {
    const rel = sku.photo_webp.replace(/^\//, '');
    const fullPath = path.join(SITE_ROOT, 'public', rel);
    assert.ok(fs.existsSync(fullPath), `Debe existir ${fullPath}`);
    const buf = fs.readFileSync(fullPath);
    assert.ok(buf.length > 0 && buf.length <= 46080, `${rel} debe pesar <= 45 KB (${buf.length} bytes)`);
    sha256Set.add(crypto.createHash('sha256').update(buf).digest('hex'));
    const dhash = await computeImageDHash64(buf);
    dhashSet.add(dhash);
  }

  assert.equal(sha256Set.size, 19, 'Las 19 imágenes WebP deben tener 19 hashes SHA-256 distintos (0 duplicados)');
  assert.equal(dhashSet.size, 19, 'Las 19 imágenes WebP deben tener 19 dHash64 perceptuales distintos');
});

test('D4 = 4-C++ (SLICE-V31-05 / INV-SMAT-SCI-06): Core Trade-In -22% (Savaskan 2004) y Lente PutGet syncTrayToWorkbenchStateLens', () => {
  const tradeInActive = evaluateBearingCartridgeCoreTradeIn(
    {
      items: [{ id: 'SKU-QC-06', skuId: 'SKU-QC-06', atomicCode: 'DAM005', nameEs: 'Cartucho de Rodamientos', qty: 1 }],
      coreReturnEnabled: true
    },
    true
  );
  assert.equal(tradeInActive.eligible, true);
  assert.equal(tradeInActive.coreReturnEnabled, true);
  assert.equal(tradeInActive.discountPct, 22);
  assert.equal(tradeInActive.creditFactor, 0.78);

  const lensResult = syncTrayToWorkbenchStateLens(
    {
      items: [
        {
          id: 'SKU-QC-06',
          skuId: 'SKU-QC-06',
          atomicCode: 'DAM005',
          circuit: 'bombeo',
          material: 'metal_a05',
          qty: 2
        }
      ],
      coreReturnEnabled: true
    },
    { circuit: 'clasificacion', pump_material: 'hule_natural' }
  );
  assert.equal(lensResult.circuit, 'bombeo');
  assert.equal(lensResult.pump_material, 'alto_cromo_cr27');
  assert.equal(lensResult.trayItemsCount, 2);
  assert.equal(lensResult.coreTradeInDiscountPct, 22);
});

test('D5 = 5-C++ & D6 = 6-C++ (SLICE-V31-06..07 / INV-SMAT-SCI-07..08 / DEB-V31-03): Hidrodinámica Gorain Sb >= 55 s^-1, Flexión Timoshenko y 0 #090d16', () => {
  const gorain = calculateFlotationGorainKineticRate({ jgCmS: 1.5, d32Mm: 1.6, rotorDiaM: 0.61, rotorRpm: 215 });
  assert.ok(gorain.sbInverseSeconds >= 55, `Gorain Sb (${gorain.sbInverseSeconds}) debe ser >= 55 s^-1`);
  assert.equal(gorain.gorainCompliant, true);

  const timoshenko = evaluateFilterPressPlateDeflection({ plateWidthMm: 1200, feedPressureBar: 12, plateThicknessMm: 65 });
  assert.ok(timoshenko.flexuralSafetyFactor >= 1.25, `Factor de seguridad Timoshenko (${timoshenko.flexuralSafetyFactor}) debe ser >= 1.25`);
  assert.equal(timoshenko.nom141Compliant, true);

  const solarFiles = [
    'src/pages/flotacion/index.astro',
    'src/pages/flotacion/celdas.astro',
    'src/pages/en/flotation/index.astro',
    'src/pages/en/flotation/cells.astro',
    'src/pages/filtracion/index.astro',
    'src/pages/filtracion/repuestos.astro',
    'src/pages/en/filtration/index.astro',
    'src/pages/en/filtration/parts.astro'
  ];
  for (const rel of solarFiles) {
    const content = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(!content.toLowerCase().includes('#090d16'), `${rel} no debe contener el fondo oscuro #090d16`);
  }
});

test('D7 = 7-C++ & D9 = 9-C++ (SLICE-V31-08..09): Pasaporte Fiscal SAT CFDI 4.0 en /cumplimiento/ y /garantia/ e Hidratación PutGet en /acuse/', () => {
  const passport = buildSmatVendorPassportPayload({});
  assert.equal(passport.companyName, 'SMAT Minerals S.A. de C.V.');
  assert.ok(passport.rfcStatus.includes('SAT 32-D'));
  assert.equal(passport.unspscCodes.length, 4);

  for (const rel of [
    'src/pages/cumplimiento.astro',
    'src/pages/en/compliance.astro'
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('compliance-vendor-passport-card'), `${rel} debe incluir #compliance-vendor-passport-card`);
  }

  for (const rel of [
    'src/pages/garantia.astro',
    'src/pages/en/warranty.astro'
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('/cumplimiento/') || src.includes('/en/compliance/'), `${rel} debe enlazar al Pasaporte Fiscal en /cumplimiento/ o /en/compliance/`);
  }

  for (const rel of ['src/pages/acuse.astro', 'src/pages/en/thank-you.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('dossier-order-code'), `${rel} debe incluir #dossier-order-code`);
    assert.ok(src.includes('sap-plaintext-block'), `${rel} debe incluir #sap-plaintext-block`);
  }
});

test('D8 = 8-C++ & D10 = 10-C++ (SLICE-V31-02, 05, 10): Costuras Limpias LCOM4 Parnas (slurryEngine <= 390 LOC, workbenchBus <= 420 LOC) y ortho.toml', () => {
  const slurryLines = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/slurryEngine.js'), 'utf8').split(/\r?\n/).length;
  const wbLines = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/workbenchBus.js'), 'utf8').split(/\r?\n/).length;
  assert.ok(slurryLines <= 390, `slurryEngine.js debe tener <= 390 líneas (actual: ${slurryLines})`);
  assert.ok(wbLines <= 420, `workbenchBus.js debe tener <= 420 líneas (actual: ${wbLines})`);
  assert.ok(Object.keys(ATOMIC_PARTS_CATALOG).length >= 13);
  assert.equal(typeof resolveMiningDistrictPreset, 'function');
  assert.ok(fs.existsSync(path.join(SITE_ROOT, 'ortho.toml')), 'Debe existir site/ortho.toml');
});
