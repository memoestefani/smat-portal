import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

test('MVP v3.0 — D1 & D6: 19 SKUs en quick_checkout_Catalog.json, 13 partes atómicas (incl. D075C21) y rutas SSG /productos/[slug] + /en/products/[slug]', () => {
  const qcPath = path.join(siteRoot, 'data/quick_checkout_Catalog.json');
  assert.ok(fs.existsSync(qcPath), 'Debe existir data/quick_checkout_Catalog.json');
  const qc = JSON.parse(fs.readFileSync(qcPath, 'utf-8'));
  assert.equal(qc.length, 19, 'Deben existir exactamente 19 SKUs Quick-Checkout Tier-1');

  const atomicPath = path.join(siteRoot, 'data/atomic_parts.json');
  const atomic = JSON.parse(fs.readFileSync(atomicPath, 'utf-8'));
  assert.equal(atomic.length, 13, 'Deben existir las 13 refacciones atómicas (6 originales + D075C21 + 6 componentes de kit)');
  assert.ok(atomic.some((p) => p.part_number === 'D075C21'), 'atomic_parts.json debe incluir D075C21 (Camisa de Flecha)');

  assert.ok(fs.existsSync(path.join(siteRoot, 'src/pages/productos/[slug].astro')));
  assert.ok(fs.existsSync(path.join(siteRoot, 'src/pages/en/products/[slug].astro')));
});

test('MVP v3.0 — D2 & D4: Capa de Rayos X Pre-Atentiva (data-layer="xray-wear"), Escala ISO/IEC 7810 (0.76 mm) y Hash FNV-1a en Reporte de Armado', async () => {
  const diag = fs.readFileSync(path.join(siteRoot, 'src/components/TechnicalDiagrams.astro'), 'utf-8');
  assert.ok(diag.includes('data-layer="xray-wear"'), 'TechnicalDiagrams.astro debe incluir data-layer="xray-wear"');
  assert.ok(diag.includes('data-iso7810-scale="0.76mm"'), 'TechnicalDiagrams.astro debe incluir escala cotidiana ISO 7810 (0.76 mm)');
  assert.ok(diag.includes('#dc2626') && diag.includes('#d97706') && diag.includes('#0284c7'), 'Debe incluir las 3 bandas cromáticas de desgaste');

  const report = fs.readFileSync(path.join(siteRoot, 'src/components/PumpAssemblyReport.astro'), 'utf-8');
  assert.ok(report.includes('data-toggle-xray'), 'PumpAssemblyReport.astro debe incluir botón [data-toggle-xray]');
  assert.ok(report.includes('data-selection-order-hash'), 'PumpAssemblyReport.astro debe mostrar el código hash determinista');
  assert.ok(report.includes('D075C21'), 'PumpAssemblyReport.astro debe referenciar la camisa D075C21 en Estación 02');
});

test('MVP v3.0 — D3 & D5: Bandeja de Requisición Multi-Ítem (RequisitionTraySummary.astro), Regla c*mu, Pasaporte Proveedor (.vcf/.json) y Reorden (s, S)', () => {
  const trayComp = fs.readFileSync(path.join(siteRoot, 'src/components/RequisitionTraySummary.astro'), 'utf-8');
  assert.ok(trayComp.includes('id="tray-cmu-subject-line"'), 'RequisitionTraySummary.astro debe mostrar cabecera de prioridad c*mu');
  assert.ok(trayComp.includes('id="tray-items-tbody"'), 'RequisitionTraySummary.astro debe renderizar tabla multi-partida');

  const acuseEs = fs.readFileSync(path.join(siteRoot, 'src/pages/acuse.astro'), 'utf-8');
  const acuseEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/thank-you.astro'), 'utf-8');
  for (const content of [acuseEs, acuseEn]) {
    assert.ok(content.includes('id="download-vendor-vcard-btn"'), 'Acuse debe incluir descarga de Pasaporte Proveedor (.vcf)');
    assert.ok(content.includes('id="download-vendor-json-btn"'), 'Acuse debe incluir descarga JSON de alta ERP');
    assert.ok(content.includes('id="reorder-ss-link"'), 'Acuse debe incluir enlace de Reorden 1-Clic bajo política (s, S)');
  }
});

test('MVP v3.0 — D7 & D8: Vertical /clasificacion/ (Balance 3 Vasos Marcy + Plitt d50c + Roping), Matriz Drop-In en /flotacion/ y Verificador NOM-141 Timoshenko en /filtracion/', () => {
  const clasEs = fs.readFileSync(path.join(siteRoot, 'src/pages/clasificacion/index.astro'), 'utf-8');
  const clasEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/classification/index.astro'), 'utf-8');
  for (const c of [clasEs, clasEn]) {
    assert.ok(c.includes('id="marcy-3cup-cyclone-calculator"'), 'Clasificación debe incluir calculadora de 3 Vasos Marcy');
    assert.ok(c.includes('calculateThreeCupMarcyCycloneBalance'), 'Clasificación debe invocar calculateThreeCupMarcyCycloneBalance');
  }

  const flotEs = fs.readFileSync(path.join(siteRoot, 'src/pages/flotacion/index.astro'), 'utf-8');
  const flotEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/flotation/index.astro'), 'utf-8');
  for (const f of [flotEs, flotEn]) {
    assert.ok(f.includes('id="flotation-dropin-matrix"'), 'Flotación debe incluir #flotation-dropin-matrix');
  }

  const filtEs = fs.readFileSync(path.join(siteRoot, 'src/pages/filtracion/index.astro'), 'utf-8');
  const filtEn = fs.readFileSync(path.join(siteRoot, 'src/pages/en/filtration/index.astro'), 'utf-8');
  for (const fl of [filtEs, filtEn]) {
    assert.ok(fl.includes('id="nom141-plate-flexure-verifier"'), 'Filtración debe incluir #nom141-plate-flexure-verifier');
    assert.ok(fl.includes('evaluateFilterPressPlateDeflection'), 'Filtración debe invocar evaluateFilterPressPlateDeflection');
  }
});

test('MVP v3.0 — D9: Orden topológico en package.json (preflight), presupuesto ortho.toml y 0 debris en crates/smat-gate/target/.ortho_doctor_cache', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(siteRoot, 'package.json'), 'utf-8'));
  assert.ok(pkg.scripts.preflight.includes('astro check') && pkg.scripts.preflight.includes('astro build') && pkg.scripts.preflight.includes('npm test') && pkg.scripts.preflight.includes('npm run gate'));

  const orthoToml = fs.readFileSync(path.join(siteRoot, 'ortho.toml'), 'utf-8');
  assert.ok(orthoToml.includes('max_html_tags = 680'));
  assert.ok(!orthoToml.includes('src/pages/catalogo/index.astro'), 'ortho.toml no debe apuntar al archivo inexistente catalogo/index.astro');

  const nestedCache = path.join(siteRoot, 'crates/smat-gate/target/.ortho_doctor_cache');
  assert.equal(fs.existsSync(nestedCache), false, 'El directorio residual .ortho_doctor_cache anidado no debe existir');
});
