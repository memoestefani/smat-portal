import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FORMATTERS_BY_FIELD,
  projectWorkbenchToDOM,
  buildSmatCode,
  decodeSmatCode,
  resolveMiningUnitPulpPreset,
  matchMiningGroupByEmailDomain
} from '../src/scripts/wizardMiningAndCodeDecoder.js';
import {
  resolveFlotationDomChipKey,
  resolveFiltrationDomChipKey,
  resolveUrlContextDescriptor
} from '../src/scripts/wizardUrlAndPresetRouter.js';
import {
  computeWizardViewState
} from '../src/scripts/quoteWizardController.js';
import {
  parseUrlContextParams,
  getAtomicPartSpecs
} from '../src/scripts/districtProfilesAndSkuCatalog.js';
import {
  buildAcuseUrlParams
} from '../src/scripts/sapAndLeadExportEngine.js';
import {
  WET_END_MATERIAL_MATRIX
} from '../src/scripts/tribologyAndCompatibilityEngine.js';
import {
  normalizeMaterialKey
} from '../src/scripts/workbenchBus.js';
import {
  getQuickProductsCatalog
} from '../src/scripts/quickProductsCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

function readText(relPath) {
  return fs.readFileSync(path.join(siteRoot, relPath), 'utf8');
}

test('D1-V37 (1-C / DEB-V37-11) & INV-SMAT-SCI-52: 0 módulos huérfanos en inventario/inventario_smat.md, 0 duplicado raíz y 0 funciones InDegree_UI = 0', () => {
  const invPath = path.resolve(siteRoot, '../inventario/inventario_smat.md');
  const rootDupPath = path.resolve(siteRoot, '../inventario_smat.md');
  assert.equal(fs.existsSync(invPath), true, 'Debe existir inventario/inventario_smat.md');
  assert.equal(fs.existsSync(rootDupPath), false, 'No debe existir el duplicado raíz smat/inventario_smat.md');

  const invText = fs.readFileSync(invPath, 'utf8');
  for (const modName of [
    'mechanicalAndSeparationEngine.js',
    'quickProductsCatalog.js',
    'workbenchExportFormatters.js',
    'wizardUrlAndPresetRouter.js',
    'wizardMiningAndCodeDecoder.js'
  ]) {
    assert.ok(invText.includes(modName), `inventario/inventario_smat.md debe registrar ${modName}`);
  }

  const qwCtrl = readText('src/scripts/quoteWizardController.js');
  assert.ok(qwCtrl.includes('selectOptimalMaterial('), 'quoteWizardController.js debe invocar selectOptimalMaterial en runtime');

  for (const catRel of ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro']) {
    const catSrc = readText(catRel);
    assert.ok(catSrc.includes('getQuickProductsByAvenue('), `${catRel} debe invocar getQuickProductsByAvenue`);
    assert.ok(catSrc.includes('verifyCatalogReferentialIntegrity('), `${catRel} debe invocar verifyCatalogReferentialIntegrity`);
    assert.ok(catSrc.includes('verifyDiagramSurjectivity('), `${catRel} debe invocar verifyDiagramSurjectivity`);
  }
});

test('D2-V37 (2-C / DEB-V37-03): Preservación PutGet de rol de kit frente a atomic_codes, propagación Marcy 3-Vasos en buildAcuseUrlParams y mapeo de chips DOM', () => {
  const wetKitCtx = parseUrlContextParams('?sku=SMAT-PUMP-WETKIT-554');
  assert.equal(wetKitCtx.equipo, 'kit_wet_end', 'SMAT-PUMP-WETKIT-554 debe preservar el rol kit_wet_end');
  assert.equal(wetKitCtx.codigo, null, 'SMAT-PUMP-WETKIT-554 (kit multi-pieza) no debe forzar codigo=D3147 que sobreescribe el rol a solo_impulsor');
  assert.equal(wetKitCtx.atomic_part?.part_number, 'E4147', 'SMAT-PUMP-WETKIT-554 debe asociar E4147 (6x4) como referencia atómica base');

  const coupledCtx = parseUrlContextParams('?sku=SMAT-COUPLED-PUMP-CYC');
  assert.equal(coupledCtx.equipo, 'skid_bomba', 'SMAT-COUPLED-PUMP-CYC debe preservar skid_bomba');
  assert.equal(coupledCtx.codigo, null, 'SMAT-COUPLED-PUMP-CYC no debe forzar codigo individual');

  const damCtx = parseUrlContextParams('?sku=DAM005');
  assert.equal(damCtx.equipo, 'kit_rodamientos', '?sku=DAM005 debe resolver a kit_rodamientos');
  assert.equal(damCtx.codigo, 'DAM005');

  const ctrlAliasState = computeWizardViewState({}, '?circuito=control&equipo=balanza_marcy');
  assert.equal(ctrlAliasState.circuit, 'control_procesos', '?circuito=control debe normalizar a control_procesos');

  assert.equal(resolveFlotationDomChipKey('reactivos_espuma'), 'reactivos_ph_extremo');
  assert.equal(resolveFlotationDomChipKey('arena_gruesa_fondo'), 'vibracion_flecha');
  assert.equal(resolveFiltrationDomChipKey('fuga_chorreo'), 'alta_presion_16bar');
  assert.equal(resolveFiltrationDomChipKey('ciclo_lento'), 'colmatacion_telas');

  const desc = resolveUrlContextDescriptor(parseUrlContextParams('?circuito=clasificacion&rho_f=1.44&rho_u=1.96&rho_o=1.17&rs_pct=87.2&cv_u=56.1&d50c=66&roping_risk=1'));
  assert.equal(desc.marcyThreeCup.hasUrlTelemetry, true);
  assert.equal(desc.marcyThreeCup.solidsRecoveryPct, 87.2);

  const acuseParams = buildAcuseUrlParams({
    folio: 'SMAT-2026-V37',
    cyclone_circuit: desc.marcyThreeCup,
    g5_advance_confirmed: true
  });
  assert.equal(acuseParams.get('rs_pct'), '87.2');
  assert.equal(acuseParams.get('d50c'), '66');
  assert.equal(acuseParams.get('roping_risk'), '1');
  assert.equal(acuseParams.get('g5_confirm'), '1');
});

test('D3-V37 (3-C / DEB-V37-02): Unión discriminada de 4 circuitos en getAtomicPartSpecs sin caer en falso positivo E4147 (68 kg)', () => {
  const flotSpec = getAtomicPartSpecs('rotor_estator', '100ft');
  assert.equal(flotSpec.part_number, 'FLOT-MECH-18SP');
  assert.equal(flotSpec.weight_kg, 210.0);
  assert.equal(flotSpec.circuit, 'flotacion');

  const filtSpec = getAtomicPartSpecs('placas_telas', '1200');
  assert.equal(filtSpec.part_number, 'FILT-PP-1200');
  assert.equal(filtSpec.weight_kg, 34.0);
  assert.equal(filtSpec.circuit, 'filtracion');

  const memSpec = getAtomicPartSpecs('placas_membrana', '1200');
  assert.equal(memSpec.part_number, 'FILT-SHIFTER-16B');
  assert.equal(memSpec.weight_kg, 48.0);

  const marcySpec = getAtomicPartSpecs('balanza_marcy', 'marcy_12_rings');
  assert.equal(marcySpec.part_number, 'LAB-MARCY-1000');
  assert.equal(marcySpec.weight_kg, 3.8);
  assert.equal(marcySpec.circuit, 'control_procesos');

  const batchSpec = getAtomicPartSpecs('filtro_batch_lab', 'batch_100psi');
  assert.equal(batchSpec.part_number, 'LAB-BATCH-100PSI');
  assert.equal(batchSpec.weight_kg, 28.0);

  const sieveSpec = getAtomicPartSpecs('tamices_laboratorio', 'sieves_8in_e11');
  assert.equal(sieveSpec.part_number, 'LAB-ASTM-E11');
  assert.equal(sieveSpec.weight_kg, 0.9);
});

test('D4-V37 (4-C / DEB-V37-04): Rama D Híbrida (hybrid_a05_r55) seleccionable en QuoteWizard.astro y WET_END_MATERIAL_MATRIX', () => {
  const qwSrc = readText('src/components/QuoteWizard.astro');
  assert.ok(qwSrc.includes('<option value="hybrid_a05_r55">'), 'QuoteWizard.astro debe incluir <option value="hybrid_a05_r55"> en #wb-pump-material');
  assert.ok(WET_END_MATERIAL_MATRIX.hybrid_a05_r55, 'WET_END_MATERIAL_MATRIX debe definir hybrid_a05_r55');
  assert.equal(WET_END_MATERIAL_MATRIX.hybrid_a05_r55.code, 'A05+R55');
  assert.equal(normalizeMaterialKey('hybrid_a05_r55'), 'hybrid_a05_r55');
  assert.equal(normalizeMaterialKey('hibrido_a05_r55'), 'hybrid_a05_r55');
});

test('D5-V37 (5-C / DEB-V37-05): Cero enlaces en mayúsculas /catalogo/D075C21/ en Footer e index y reglas 301 en _redirects', () => {
  for (const rel of ['src/components/Footer.astro', 'src/pages/index.astro', 'src/pages/en/index.astro']) {
    const src = readText(rel);
    assert.ok(!src.includes('/catalogo/D075C21/'), `${rel} no debe enlazar a /catalogo/D075C21/ en mayúsculas`);
    assert.ok(!src.includes('/en/catalog/D075C21/'), `${rel} no debe enlazar a /en/catalog/D075C21/ en mayúsculas`);
  }
  const redirects = readText('public/_redirects');
  assert.ok(redirects.includes('/catalogo/D075C21 /catalogo/d075c21/ 301'));
  assert.ok(redirects.includes('/en/catalog/D075C21 /en/catalog/d075c21/ 301'));
});

test('D6-V37 (6-C / DEB-V37-06), D7-V37 (7-C / DEB-V37-07) & D8-V37 (8-C / DEB-V37-08): Deduplicación 50% SVG en ProductQuickCard, 3 regímenes de stock, y botón Par Casado + chips interactivos en [slug].astro', () => {
  const qcardSrc = readText('src/components/ProductQuickCard.astro');
  const tdMatches = qcardSrc.match(/<TechnicalDiagrams\b/g) || [];
  assert.equal(tdMatches.length, 1, 'ProductQuickCard.astro debe montar exactamente 1 instancia de <TechnicalDiagrams />');
  assert.ok(qcardSrc.includes('[data-layer="xray-wear"]'), 'ProductQuickCard.astro debe conmutar [data-layer="xray-wear"] sobre la instancia única');
  assert.ok(qcardSrc.includes('.smat-slug-mat-chip[data-mat-code]'), 'ProductQuickCard.astro debe escuchar clics en .smat-slug-mat-chip');

  const catalog = getQuickProductsCatalog();
  const regimes = new Set(catalog.map((s) => s.stock_regime));
  assert.equal(regimes.has('hay'), true);
  assert.equal(regimes.has('se_pide'), true);
  assert.equal(regimes.has('se_fabrica'), true, 'El catálogo de 19 SKUs debe cubrir los 3 regímenes (hay, se_pide, se_fabrica)');

  for (const slugRel of ['src/pages/productos/[slug].astro', 'src/pages/en/products/[slug].astro']) {
    const slugSrc = readText(slugRel);
    assert.ok(!slugSrc.includes(".split(' ')[0]"), `${slugRel} no debe truncar el título del SKU acoplado a la primera palabra`);
    assert.ok(slugSrc.includes('data-add-coupled-pair-btn={coupledSku.id}'), `${slugRel} debe incluir el botón data-add-coupled-pair-btn`);
    assert.ok(slugSrc.includes('role="button" tabindex="0" data-mat-code={mat}'), `${slugRel} debe hacer interactivos los chips de aleación`);
  }
});

test('D9-V37 (9-C / DEB-V37-01) & D10-V37 (10-C / DEB-V37-09..10): Extracción LCOM4 wizardMiningAndCodeDecoder.js (<= 25 funciones en quoteWizardController.js) y gobernanza documental v3.7', () => {
  assert.equal(typeof projectWorkbenchToDOM, 'function');
  assert.equal(typeof FORMATTERS_BY_FIELD.slurrySpecificGravity, 'function');
  assert.equal(buildSmatCode('bombeo', 'solo_impulsor', '6x4', 'roca_dura'), 'SMAT-PUMP-6X4-IMP');
  assert.equal(decodeSmatCode('E4147')?.atomic_code, 'E4147');

  const preset = resolveMiningUnitPulpPreset({ id: 'fresnillo-plc', name: 'Fresnillo plc' }, { name: 'Saucito (Zacatecas)', pulp_profile: 'Sulfuros abrasivos molienda SAG' }, 2200);
  assert.equal(preset.presetCw, 56);
  const matchedGroup = matchMiningGroupByEmailDomain('ing@fresnilloplc.com', [{ id: 'fresnillo-plc', name: 'Fresnillo plc', domains: ['fresnilloplc.com'] }]);
  assert.equal(matchedGroup?.id, 'fresnillo-plc');

  const qwCtrlSrc = readText('src/scripts/quoteWizardController.js');
  const fnDecls = (qwCtrlSrc.match(/\bfunction\s+[a-zA-Z0-9_]+\s*\(/g) || []).length;
  assert.ok(fnDecls <= 25, `quoteWizardController.js debe tener <= 25 declaraciones function (actual: ${fnDecls})`);

  assert.equal(fs.existsSync(path.join(siteRoot, 'prd_smatminerals_web.md')), false, 'No debe existir site/prd_smatminerals_web.md legacy');
  const adminCfg = readText('public/admin/config.yml');
  assert.ok(adminCfg.includes('data/quick_checkout_Catalog.json'), 'public/admin/config.yml debe incluir data/quick_checkout_Catalog.json');
  const archDoc = readText('docs/ARCHITECTURE.md');
  assert.ok(archDoc.includes('v3.7'), 'docs/ARCHITECTURE.md debe estar actualizado a v3.7');
});
