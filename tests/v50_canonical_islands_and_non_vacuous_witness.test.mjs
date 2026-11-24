// tests/v50_canonical_islands_and_non_vacuous_witness.test.mjs
// Suite V5.0: Islas Canónicas, Biyección Two-Sort (EngineSchema <-> DOM),
// Testigos Activos No-Vacuos (Δx => Δy ≠ 0), Cero Debris y Contrato SSOT 19 SKUs.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { verifyDropInEquivalence } from '../src/scripts/dropInEquivalenceGuard.js';
import {
  ENGINE_SCHEMA_REGISTRY,
  listAllEngineSchemas,
} from '../src/scripts/engineSchemaRegistry.js';

function collectDeclaredDomIds() {
  const inputs = [];
  const outputs = [];
  const pushId = (sel, target) => {
    if (typeof sel === 'string' && sel.startsWith('#')) {
      const id = sel.slice(1).split(/[,\s]/)[0].trim();
      if (id && !target.includes(id)) target.push(id);
    }
  };
  for (const s of listAllEngineSchemas()) {
    for (const inp of s.inputsSchema) {
      pushId(inp.domBinding, inputs);
      for (const a of inp.aliasBindings || []) pushId(a, inputs);
    }
    for (const out of s.outputsSchema) {
      pushId(out.domBinding, outputs);
      for (const a of out.aliasBindings || []) pushId(a, outputs);
    }
  }
  return { inputs, outputs };
}
import {
  calculateFlotationGorainKineticRate,
  calculateUrethaneScreenPartitionWeibull,
} from '../src/scripts/mechanicalAndSeparationEngine.js';
import { calculateDriveKinematics } from '../src/scripts/pumpAssemblyAndDriveEngine.js';
import {
  getQuickProductsByAvenue,
  verifyCatalogReferentialIntegrity,
} from '../src/scripts/quickProductsCatalog.js';
import { calculateCoupledReorderWindowDays } from '../src/scripts/requisitionTrayBus.js';
import {
  buildAcuseUrlParams,
  buildCanonicalEngineeringSnapshotImpl,
  formatSapTsv,
} from '../src/scripts/sapAndLeadExportEngine.js';
import {
  calculateAltitudeCorrection,
  calculateGyMinimumSampleMass,
  calculateMarcyScaleReading,
  calculateSlurryMetrics,
  calculateThreeCupMarcyCycloneBalance,
  evaluateCentrifugalSealPressureBalance,
  recommendAstmSieveSeries,
  validatePlantLeadInput,
} from '../src/scripts/slurryEngine.js';
import {
  bindCanonicalFiltrationCalculator,
  bindCanonicalFlotationCalculator,
  bindCanonicalTribologySelector,
} from '../src/scripts/verticalCalculatorsAndLabelsBridge.js';
import {
  calculateFilterPressCycleCapacity,
} from '../src/scripts/mechanicalAndSeparationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function walkFiles(dirPath, extFilter = null) {
  const out = [];
  if (!fs.existsSync(dirPath)) return out;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, extFilter));
    } else if (!extFilter || extFilter.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function createInteractiveDom(initial = {}) {
  const nodes = new Map();
  for (const [id, spec] of Object.entries(initial)) {
    const listeners = new Map();
    const isObj = typeof spec === 'object' && spec !== null;
    nodes.set(id, {
      id,
      value: isObj ? String(spec.value ?? '') : String(spec),
      checked: isObj ? Boolean(spec.checked) : false,
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add() { },
        remove() { },
        toggle() { },
      },
      setAttribute() { },
      getAttribute() {
        return null;
      },
      addEventListener(evt, fn) {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(fn);
      },
      dispatchEvent(evt = 'input') {
        const type = typeof evt === 'string' ? evt : evt.type;
        (listeners.get(type) || []).forEach((fn) => fn({ type, target: this }));
      },
    });
  }
  return {
    nodes,
    querySelectorAll(selector) {
      const seen = new Set();
      const matched = [];
      for (const rawPart of String(selector).split(',')) {
        const p = rawPart.trim();
        if (!p) continue;
        if (p.startsWith('#')) {
          const hit = nodes.get(p.slice(1));
          if (hit && !seen.has(hit)) { seen.add(hit); matched.push(hit); }
        } else {
          const schemaMatch = p.match(/^\[data-schema-output="([^"]+)"\]$/);
          if (schemaMatch) {
            const hit = nodes.get(schemaMatch[1]);
            if (hit && !seen.has(hit)) { seen.add(hit); matched.push(hit); }
          }
        }
      }
      return matched;
    },
    querySelector(selector) {
      const parts = String(selector)
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''));
      for (const p of parts) {
        if (nodes.has(p)) return nodes.get(p);
      }
      return null;
    },
  };
}

test('V50-T1 Biyección Estructural Two-Sort: 100% de domBindings (11 dominios) existen en el DOM compuesto Astro', () => {
  const canonicalUiFiles = [
    path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'),
    path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'),
    path.join(SITE_ROOT, 'src/components/PumpAssemblyReport.astro'),
    path.join(SITE_ROOT, 'src/components/SharePurchasing.astro'),
    path.join(SITE_ROOT, 'src/components/QuickOrderTray.astro'),
    ...walkFiles(path.join(SITE_ROOT, 'src/components/islands'), ['.astro']),
    ...walkFiles(path.join(SITE_ROOT, 'src/components/cores'), ['.astro']),
  ];
  const combinedUiMarkup = canonicalUiFiles.map((p) => fs.readFileSync(p, 'utf8')).join('\n');

  const declared = collectDeclaredDomIds();
  const schemas = listAllEngineSchemas();
  assert.equal(schemas.length, 11, 'Deben existir exactamente 11 dominios en ENGINE_SCHEMA_REGISTRY');

  const missingInputs = declared.inputs.filter((id) => !combinedUiMarkup.includes(`id="${id}"`));
  const missingOutputs = declared.outputs.filter((id) => !combinedUiMarkup.includes(`id="${id}"`));

  assert.deepEqual(
    missingInputs,
    [],
    `Inputs declarados en EngineSchema sin elemento DOM real: ${missingInputs.join(', ')}`
  );
  assert.deepEqual(
    missingOutputs,
    [],
    `Outputs declarados en EngineSchema sin elemento DOM real: ${missingOutputs.join(', ')}`
  );
});

test('V50-T2 Paridad Islas Canónicas, Wrappers Bilingües y Estrato-1 Above-the-Fold', () => {
  const wrapperPairs = [
    ['src/pages/index.astro', 'src/pages/en/index.astro', 'HomeLandingIsland'],
    ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro', 'CatalogFacetedIsland'],
    ['src/pages/equipos/index.astro', 'src/pages/en/process-equipment/index.astro', 'EquipmentHubIsland'],
    ['src/pages/bombeo/index.astro', 'src/pages/en/pumping/index.astro', 'PumpingHubIsland'],
    ['src/pages/bombeo/impulsor.astro', 'src/pages/en/pumping/impeller.astro', 'TribologyAlloyIsland'],
    ['src/pages/bombeo/revestimientos.astro', 'src/pages/en/pumping/liners.astro', 'TribologyAlloyIsland'],
    ['src/pages/bombeo/sello.astro', 'src/pages/en/pumping/seal.astro', 'SealDriveBearingIsland'],
    ['src/pages/bombeo/skid.astro', 'src/pages/en/pumping/skid.astro', 'SealDriveBearingIsland'],
    ['src/pages/bombeo/soporte.astro', 'src/pages/en/pumping/bearing-assembly.astro', 'SealDriveBearingIsland'],
    ['src/pages/flotacion/index.astro', 'src/pages/en/flotation/index.astro', 'FlotationCalculatorIsland'],
    ['src/pages/flotacion/celdas.astro', 'src/pages/en/flotation/cells.astro', 'FlotationCalculatorIsland'],
    ['src/pages/flotacion/mecanismos.astro', 'src/pages/en/flotation/mechanisms.astro', 'FlotationCalculatorIsland'],
    ['src/pages/filtracion/index.astro', 'src/pages/en/filtration/index.astro', 'FiltrationCalculatorIsland'],
    ['src/pages/filtracion/prensa.astro', 'src/pages/en/filtration/press.astro', 'FiltrationCalculatorIsland'],
    ['src/pages/filtracion/repuestos.astro', 'src/pages/en/filtration/parts.astro', 'FiltrationCalculatorIsland'],
    ['src/pages/clasificacion/index.astro', 'src/pages/en/classification/index.astro', 'CycloneScreenIsland'],
    ['src/pages/control-de-procesos/index.astro', 'src/pages/en/process-control/index.astro', 'ProcessControlIsland'],
    ['src/pages/catalogo/[code].astro', 'src/pages/en/catalog/[code].astro', 'AtomicPartIsland'],
    ['src/pages/acuse.astro', 'src/pages/en/thank-you.astro', 'AcuseSheetIsland'],
  ];

  for (const [esRel, enRel, expectedIsland] of wrapperPairs) {
    for (const rel of [esRel, enRel]) {
      const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
      assert.ok(src.includes(`<${expectedIsland}`), `${rel} debe delegar en <${expectedIsland} />`);
      if (!rel.includes('[code].astro')) {
        const lines = src.split(/\r?\n/).length;
        assert.ok(lines <= 35, `${rel} debe ser wrapper fino <= 35 LOC (actual: ${lines})`);
      }
    }
  }

  const calculatorIslands = [
    'TribologyAlloyIsland.astro',
    'SealDriveBearingIsland.astro',
    'FlotationCalculatorIsland.astro',
    'FiltrationCalculatorIsland.astro',
    'CycloneScreenIsland.astro',
    'ProcessControlIsland.astro',
  ];
  const coreDir = path.join(SITE_ROOT, 'src/components/cores');
  for (const islandFile of calculatorIslands) {
    const rawSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands', islandFile), 'utf8');
    assert.equal(/\bisEmbedded\b/.test(rawSrc), false, `${islandFile} no debe conservar bifurcación {isEmbedded}`);
    const expandedSrc = rawSrc.replace(/<([A-Z][A-Za-z0-9]*Core)\b[^>]*\/>/g, (_m, coreName) => {
      const p = path.join(coreDir, `${coreName}.astro`);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    });
    const idxStratum1 = expandedSrc.includes('smat-stratum1-display')
      ? expandedSrc.indexOf('smat-stratum1-display')
      : expandedSrc.indexOf('data-stratum-1-instrument');
    const idxInputs = expandedSrc.includes('smat-inputs-2col')
      ? expandedSrc.indexOf('smat-inputs-2col')
      : expandedSrc.indexOf('metrology-inputs-grid');
    assert.ok(idxStratum1 !== -1, `${islandFile} debe declarar .smat-stratum1-display o data-stratum-1-instrument`);
    assert.ok(idxInputs !== -1, `${islandFile} debe declarar .smat-inputs-2col o .metrology-inputs-grid`);
    assert.ok(idxStratum1 < idxInputs, `${islandFile}: Estrato 1 debe renderizarse ANTES de los inputs`);
  }
});

test('V50-T3 Cero Debris Arqueológico, Cero Metalenguaje, Cero #b45309/#d97706 en UI y SSOT 19 SKUs', () => {
  const allSrcFiles = walkFiles(path.join(SITE_ROOT, 'src'), ['.astro', '.js']);
  const forbiddenArtifactPatterns = [
    { label: '#wb-assembly-sequence-test', re: /wb-assembly-sequence-test/ },
    { label: '#home-quick-catalog-drawer', re: /home-quick-catalog-drawer/ },
    { label: 'QuickPartSelectorStrip', re: /QuickPartSelectorStrip/ },
    { label: 'SMAT-ULTRAMET-4X3', re: /SMAT-ULTRAMET-4X3/ },
    { label: 'SMAT-ULTRAMET-6X4', re: /SMAT-ULTRAMET-6X4/ },
    { label: 'DualHubView.astro', re: /DualHubView/ },
  ];

  for (const filePath of allSrcFiles) {
    const rel = path.relative(SITE_ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    for (const pat of forbiddenArtifactPatterns) {
      assert.equal(pat.re.test(content), false, `Debris prohibido (${pat.label}) detectado en ${rel}`);
    }

    if (filePath.endsWith('.astro') && (rel.includes('components\\islands') || rel.includes('components/islands') || rel.includes('components\\cores') || rel.includes('components/cores') || rel.endsWith('QuoteWizard.astro'))) {
      const visibleTemplate = content.replace(/^---[\s\S]*?---/, '').split('<script')[0].replace(/<!--[\s\S]*?-->/g, '');
      const visibleProse = visibleTemplate.replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ');
      for (const jargon of ['SSOT', 'CONSOLA 4-TAB XOR', 'CANDADO G1', 'CANDADO G4', 'CANDADO G5', 'v_tip', 'T₀/2', 'FNV-1a']) {
        assert.equal(visibleProse.includes(jargon), false, `Metalenguaje '${jargon}' expuesto en template de ${rel}`);
      }
      assert.equal(/#b45309|#d97706/i.test(visibleTemplate), false, `Color sub-AAA en template de ${rel}`);
    }
  }

  assert.equal(fs.existsSync(path.join(SITE_ROOT, 'src/components/QuickPartSelectorStrip.astro')), false);

  const byAvenue = getQuickProductsByAvenue();
  const totalSkus = Object.values(byAvenue).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  assert.equal(totalSkus, 19, 'El catálogo rápido SSOT debe mantener exactamente 19 SKUs canónicos (zero bloat)');
  const integrity = verifyCatalogReferentialIntegrity();
  assert.equal(integrity.valid, true, 'Integridad referencial del catálogo 19 SKUs debe pasar');

  for (const humanRel of [
    'src/components/RequisitionTraySummary.astro',
    'src/components/QuickOrderTray.astro',
    'src/components/islands/AcuseSheetIsland.astro',
  ]) {
    const templateHtml = fs.readFileSync(path.join(SITE_ROOT, humanRel), 'utf8').replace(/^---[\s\S]*?---/, '').split('<script')[0];
    assert.equal(/\bIMMEDIATE_PICK\b|\bFILTRO_BATCH_LAB\b|Índice cμ =/.test(templateHtml), false, `Token técnico crudo expuesto en ${humanRel}`);
  }
});

test('V50-T4 Testigos Activos No-Vacuos (Δx => Δy ≠ 0) en los 11 dominios físicos y DOM reactivo', () => {
  // 1. Pumping: pH, altitud [0..5000] y tempC + strictBlindCheck
  const acidSlurry = calculateSlurryMetrics({ flowM3H: 220, pH: 2.2, solidsWeightPercent: 30, particleSizeD80Microns: 60 });
  const neutralSlurry = calculateSlurryMetrics({ flowM3H: 220, pH: 7.2, solidsWeightPercent: 30, particleSizeD80Microns: 60 });
  assert.notEqual(acidSlurry.results.recommendedMaterial, neutralSlurry.results.recommendedMaterial);

  const seaAlt = calculateAltitudeCorrection(0);
  const sierraAlt = calculateAltitudeCorrection(3800);
  assert.ok(sierraAlt.deltaNpshLossM > seaAlt.deltaNpshLossM);
  assert.ok(sierraAlt.motorDeratingFactor < seaAlt.motorDeratingFactor);

  const blindReject = validatePlantLeadInput({ wetMaterial: 'R55', tempC: 115, strictBlindCheck: true });
  assert.equal(blindReject.plausible, false);

  // 2. Tribology: frontClearanceMm + DOM selector (#trib-u2-ms / #trib-mat-select / #trib-clearance-mm)
  const tribDom = createInteractiveDom({
    'trib-d80-um': '180',
    'trib-u2-ms': '24.5',
    'trib-ph': '6.8',
    'trib-mat-select': 'auto',
    'trib-clearance-mm': '0.6',
    'trib-series': '6x4',
    'trib-mat-out': '',
    'trib-kic-out': '',
    'trib-arch-out': '',
    'trib-vol-loss-out': '',
    'trib-pipe-loss-out': '',
    'trib-status-out': '',
  });
  bindCanonicalTribologySelector(tribDom, 'es');
  const lossTight = tribDom.querySelector('#trib-vol-loss-out').textContent;
  tribDom.querySelector('#trib-clearance-mm').value = '2.8';
  tribDom.querySelector('#trib-mat-select').value = 'ceramica_sic';
  tribDom.querySelector('#trib-clearance-mm').dispatchEvent('input');
  assert.notEqual(tribDom.querySelector('#trib-vol-loss-out').textContent, lossTight);
  assert.ok(tribDom.querySelector('#trib-mat-out').textContent.includes('SiC'));

  // 3. Seal & Drive: 02A dry vs 02B wet & arrangement kinematics
  const sealDry = evaluateCentrifugalSealPressureBalance({ dischargeHeadM: 32, suctionHeadM: 2.0, expellerDiaMm: 300, pumpRpm: 1200, slurrySg: 1.35 });
  const sealWet = evaluateCentrifugalSealPressureBalance({ dischargeHeadM: 32, suctionHeadM: 10.5, expellerDiaMm: 220, pumpRpm: 800, slurrySg: 1.55 });
  assert.notEqual(sealDry.recommendedStationCode, sealWet.recommendedStationCode);

  const kinCv = calculateDriveKinematics({ arrangementCode: 'CV', motorRpm: 1780, driverPulleyMm: 220, drivenPulleyMm: 340, powerKw: 75, impellerDiaMm: 380, dynamicCapacityCkN: 145 });
  const kinDc = calculateDriveKinematics({ arrangementCode: 'DC', motorRpm: 1180, driverPulleyMm: 220, drivenPulleyMm: 220, powerKw: 75, impellerDiaMm: 380, dynamicCapacityCkN: 145 });
  assert.notEqual(kinCv.radialBeltLoadKn, kinDc.radialBeltLoadKn);

  // 4. Flotation: P (floatabilityP) & R_f (frothRecoveryRf) DOM + physics witness
  const kLow = calculateFlotationGorainKineticRate({ floatabilityP: 0.002, frothRecoveryRf: 0.55 });
  const kHigh = calculateFlotationGorainKineticRate({ floatabilityP: 0.015, frothRecoveryRf: 0.92 });
  assert.ok(kHigh.rateConstantMin > kLow.rateConstantMin);

  const flotDom = createInteractiveDom({
    'wb-flot-jg': '1.4',
    'wb-flot-d32': '1.5',
    'wb-flot-dia': '0.61',
    'wb-flot-rpm': '215',
    'wb-flot-d80': '120',
    'wb-flot-cw': '32',
    'wb-flot-p': '0.0025',
    'wb-flot-rf': '0.58',
    'wb-flot-res-sb': '',
    'wb-flot-res-k': '',
    'wb-flot-res-vtip': '',
    'wb-flot-res-njs': '',
    'wb-flot-res-status': '',
  });
  bindCanonicalFlotationCalculator(flotDom, 'es');
  const kBefore = flotDom.querySelector('#wb-flot-res-k').textContent;
  flotDom.querySelector('#wb-flot-p').value = '0.012';
  flotDom.querySelector('#wb-flot-rf').value = '0.90';
  flotDom.querySelector('#wb-flot-p').dispatchEvent('input');
  assert.notEqual(flotDom.querySelector('#wb-flot-res-k').textContent, kBefore);

  // 5. Filtration: DOM + Darcy-Ruth/Timoshenko NOM-141 sensitivity
  const filtDom = createInteractiveDom({
    'filt-pressure-bar': '12',
    'filt-clogged-ports': '0',
    'filt-plate-width': '1500',
    'filt-plate-thickness': '65',
    'filt-cake-moisture': '14',
    'wb-filt-res-stress': '',
    'wb-filt-res-fs': '',
    'filt-res-secondary': '',
    'filt-res-summary': '',
  });
  bindCanonicalFiltrationCalculator(filtDom, 'es');
  const stress12 = filtDom.querySelector('#wb-filt-res-stress').textContent;
  filtDom.querySelector('#filt-pressure-bar').value = '18';
  filtDom.querySelector('#filt-pressure-bar').dispatchEvent('input');
  assert.notEqual(filtDom.querySelector('#wb-filt-res-stress').textContent, stress12);
  const cyc14 = calculateFilterPressCycleCapacity({ feedPressureBar: 12, plateThicknessMm: 65, cakeMoistureTargetPct: 12 });
  const cyc22 = calculateFilterPressCycleCapacity({ feedPressureBar: 12, plateThicknessMm: 65, cakeMoistureTargetPct: 22 });
  assert.notEqual(cyc14.nom141Compliant, cyc22.nom141Compliant);

  // 6. Cyclone & Screen: 6 inputs non-vacuous
  const cycA = calculateThreeCupMarcyCycloneBalance({ feedSg: 1.38, underflowSg: 1.85, overflowSg: 1.15 });
  const cycB = calculateThreeCupMarcyCycloneBalance({ feedSg: 1.48, underflowSg: 2.02, overflowSg: 1.22 });
  assert.notEqual(cycA.cvUnderflow, cycB.cvUnderflow);
  const scrLo = calculateUrethaneScreenPartitionWeibull({ reliefAngleDeg: 3.0, vibrationG: 3.2, sharpnessAlpha: 2.5 });
  const scrHi = calculateUrethaneScreenPartitionWeibull({ reliefAngleDeg: 5.0, vibrationG: 5.4, sharpnessAlpha: 4.9 });
  assert.notEqual(scrLo.antiBlindingCompliant, scrHi.antiBlindingCompliant);

  // 7. Metrology: Marcy + Gy + ASTM
  const m1 = calculateMarcyScaleReading({ pulpDensityKgL: 1.32, solidsSpecificGravity: 2.8 });
  const m2 = calculateMarcyScaleReading({ pulpDensityKgL: 1.65, solidsSpecificGravity: 3.2 });
  assert.ok(m2.solidsWeightPercent > m1.solidsWeightPercent);
  assert.notEqual(m1.cupNetMassGrams, m2.cupNetMassGrams);
  const gyA = calculateGyMinimumSampleMass({ topSizeD95Mm: 6, liberationSizeMicrons: 75, oreGradeDecimal: 0.02, targetRelativeStdError: 0.05 });
  const gyB = calculateGyMinimumSampleMass({ topSizeD95Mm: 14, liberationSizeMicrons: 220, oreGradeDecimal: 0.15, targetRelativeStdError: 0.02 });
  assert.notEqual(gyA.theoreticalGyGrams, gyB.theoreticalGyGrams);
  const astmA = recommendAstmSieveSeries({ targetP80Microns: 106, topSizeD95Mm: 2.0, drySampleMassGrams: 400 });
  const astmB = recommendAstmSieveSeries({ targetP80Microns: 300, topSizeD95Mm: 10.0, drySampleMassGrams: 1100 });
  assert.notEqual(astmA.rosinRammlerSlopeN, astmB.rosinRammlerSlopeN);

  // 8. Drop-In, 9. JRP & 10. ERP Export
  const dropOk = verifyDropInEquivalence('E4147A05');
  const dropNo = verifyDropInEquivalence('INVALID-OEM-000');
  assert.equal(dropOk.matched, true);
  assert.equal(dropNo.matched, false);

  const jrpNorm = calculateCoupledReorderWindowDays({ predictedWearHours: 3600, operatingHoursPerDay: 24, criticalityMode: 'normal' });
  const jrpCrit = calculateCoupledReorderWindowDays({ predictedWearHours: 1440, operatingHoursPerDay: 24, criticalityMode: 'paro_planta' });
  assert.ok(jrpCrit.reorderWindowDays < jrpNorm.reorderWindowDays);

  const snap = buildCanonicalEngineeringSnapshotImpl({ folio: 'SMAT-WIT-50', quantity: 8, logistics_mode: 'dedicado', delivery_destination: 'Sombrerete' });
  assert.ok(formatSapTsv(snap).includes('SMAT-WIT-50'));
  assert.ok(buildAcuseUrlParams(snap).get('delivery_destination') === 'Sombrerete');
  assert.ok(ENGINE_SCHEMA_REGISTRY.catalogFacet.outputsSchema.length > 0);
});

test('V50-T5 Verificación Build Estático (cuando dist/ existe): dist/index.html < 90 KB y /catalogo/ con 19 SKUs', () => {
  const distIndex = path.join(SITE_ROOT, 'dist/index.html');
  const distCatalog = path.join(SITE_ROOT, 'dist/catalogo/index.html');
  if (!fs.existsSync(distIndex) || !fs.existsSync(distCatalog)) {
    assert.ok(true, 'Build dist/ aún no ejecutado en fase de implementación');
    return;
  }
  const indexBytes = fs.statSync(distIndex).size;
  assert.ok(indexBytes < 90 * 1024, `dist/index.html debe pesar < 90 KB (actual: ${(indexBytes / 1024).toFixed(1)} KB)`);
  const homeHtml = fs.readFileSync(distIndex, 'utf8');
  assert.equal(homeHtml.includes('home-quick-catalog-drawer'), false);

  const catHtml = fs.readFileSync(distCatalog, 'utf8');
  const byAvenue = getQuickProductsByAvenue();
  for (const list of Object.values(byAvenue)) {
    for (const sku of list) {
      assert.ok(catHtml.includes(sku.id), `dist/catalogo/index.html debe exponer SKU ${sku.id}`);
    }
  }
});
