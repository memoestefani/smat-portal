import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TWO_SORT_PARTITION_VERSION,
  listAllEngineSchemas,
  listAllDeclaredDomIds,
  validateSchemaPayload,
  verifyConceptRegistryCoverage
} from '../src/scripts/engineSchemaRegistry.js';
import {
  formatSapTsv,
  parseSmatPartCode,
  buildAcuseUrlParams,
  buildCanonicalEngineeringSnapshotImpl,
  buildLeadWebhookPayload,
  formatWhatsappUrlImpl,
  resolveInternalBudgetCategory
} from '../src/scripts/sapAndLeadExportEngine.js';
import {
  evaluateHybridWetEndConfiguration,
  DRIVE_ARRANGEMENTS,
  calculateDriveKinematics,
  calculateMarcyScale
} from '../src/scripts/pumpAssemblyAndDriveEngine.js';
import { normalizePartTokenTwoStage, verifyDropInEquivalence } from '../src/scripts/dropInEquivalenceGuard.js';
import {
  calculateSlurryMetrics,
  calculateAltitudeCorrection,
  validatePlantLeadInput,
  calculateThreeCupMarcyCycloneBalance
} from '../src/scripts/slurryEngine.js';
import { calculateCoupledReorderWindowDays } from '../src/scripts/requisitionTrayBus.js';
import {
  calculateFlotationGorainKineticRate,
  calculateUrethaneScreenPartitionWeibull
} from '../src/scripts/mechanicalAndSeparationEngine.js';
import {
  XDSM_DISCIPLINE_ORDER,
  solveXdsmMultidisciplinaryDag,
  computeSobolFirstOrderIndices
} from '../src/scripts/wizardXdsmDagSolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('D1-V50 Two-Sort Partition: engineSchemaRegistry.js contiene 0 HTML/eval y cubre los 11 dominios', () => {
  assert.equal(TWO_SORT_PARTITION_VERSION, '5.1.0');
  const regSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/engineSchemaRegistry.js'), 'utf8');
  assert.equal(regSrc.includes('innerHTML'), false, 'No debe contener innerHTML (Two-Sort Sigma_Markup perp Sigma_Script)');
  assert.equal(/\beval\s*\(/.test(regSrc), false, 'No debe contener eval');
  assert.equal(regSrc.includes('wb-assembly-sequence-test'), false, 'ID fantasma -test prohibido en esquema');

  const schemas = listAllEngineSchemas();
  assert.equal(schemas.length, 11, 'Deben existir exactamente 11 dominios en ENGINE_SCHEMA_REGISTRY');
  for (const s of schemas) {
    assert.ok(s.inputsSchema.length > 0, `${s.id} debe declarar inputsSchema`);
    assert.ok(s.outputsSchema.length > 0, `${s.id} debe declarar outputsSchema`);
    assert.equal(s.allowUnboundReasons.length, 0, `${s.id} no puede tener exenciones huerfanas`);
  }

  const declared = listAllDeclaredDomIds();
  assert.ok(declared.inputs.includes('wb-assembly-sequence'), 'Debe declarar #wb-assembly-sequence canónico');
  assert.ok(declared.inputs.includes('wb-altitude-input'), 'Debe declarar input numérico libre de altitud');
  assert.ok(declared.inputs.includes('wb-flot-p') && declared.inputs.includes('wb-flot-rf'), 'Debe declarar P y R_f en Flotación');
  assert.ok(declared.outputs.includes('wb-cyc-res-cvu'), 'Debe declarar salida cvUnderflow en Ciclón');
});

test('D6-V50 Pre/Post-RS Traceability: 100% de los conceptos de CONCEPT-REGISTRY.md cubiertos en EngineSchema', () => {
  const concepts = [
    'role_id', 'intent', 'urgency', 'metallurgy', 'decision_criteria',
    'circuits', 'trust_charter', 'field_cases', 'faqs', 'print_receipt',
    'NAP', '301 Mappings', 'locale_pref', 'quick_checkout_skus',
    'atomic_parts_13', 'workbench_lens_v2', 'hybrid_a05_r55'
  ];
  const res = verifyConceptRegistryCoverage(concepts);
  assert.equal(res.closed, true, `Conceptos sin dueño en EngineSchema: ${res.missingConcepts.join(', ')}`);
});

test('D1-V50 validateSchemaPayload valida rangos físicos sin NaN ni escapes', () => {
  const ok = validateSchemaPayload('pumping', { flowM3H: 420, altitudeM: 3250, tempC: 48, strictBlindCheck: true });
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized.altitudeM, 3250);
  assert.equal(ok.normalized.tempC, 48);
  assert.equal(ok.normalized.strictBlindCheck, true);

  const clamped = validateSchemaPayload('flotation', { floatabilityP: 0.015, frothRecoveryRf: 0.92 });
  assert.equal(clamped.valid, true);
  assert.equal(clamped.normalized.floatabilityP, 0.015);
  assert.equal(clamped.normalized.frothRecoveryRf, 0.92);
});

test('D5-V50 Cobertura pura de exportación SAP TSV, parseSmatPartCode, Acuse y Drop-In satTuple', () => {
  const tsv = formatSapTsv({
    folio: 'SMAT-TEST-01',
    role: 'Impulsor 6x4',
    smat_code: 'SMAT-PUMP-6X4-WETKIT',
    quantity: 4,
    placa_ref: 'TAG-ML-02',
    destination: 'Fresnillo LTL'
  });
  assert.ok(tsv.includes('FOLIO_SMAT\tFECHA'));
  assert.ok(tsv.includes('4\t'));
  assert.ok(tsv.includes('TAG-ML-02'));

  const parsed = parseSmatPartCode('SMAT-PUMP-6X4-A05-IMP', 'es');
  assert.equal(parsed?.valid, true);
  assert.equal(parsed?.circuit, 'bombeo');

  const urlParams = buildAcuseUrlParams({ folio: 'SMAT-99', equipment: 'Bomba 6x4', circuit: 'bombeo' });
  assert.equal(urlParams.get('folio'), 'SMAT-99');

  const drop = verifyDropInEquivalence('D3147A05');
  assert.equal(drop.matched, true);
  assert.ok(drop.satTuple && drop.satTuple.clave_prod_serv, 'Drop-In debe retornar satTuple completo');
});

test('D5-V50 Altitud continua [0, 5000] y variables térmicas/ciegas producen diferencia real en slurryEngine', () => {
  const sea = calculateAltitudeCorrection(0);
  const andes = calculateAltitudeCorrection(3250);
  assert.ok(andes.deltaNpshLossM > sea.deltaNpshLossM, '3250 msnm debe perder más NPSHa que nivel del mar');
  assert.ok(andes.motorDeratingFactor < sea.motorDeratingFactor, '3250 msnm debe deratear motor IEC');

  const leadFail = validatePlantLeadInput({ wetMaterial: 'R55', tempC: 125, strictBlindCheck: true });
  assert.equal(leadFail.plausible, false);
  assert.equal(leadFail.activeTrustBoundaryId, 'bound-ph-temp');

  const metrics = calculateSlurryMetrics({ flowM3H: 380, solidsWeightPercent: 48, altitudeM: 1950 });
  assert.ok(metrics.estimatedImpellerLifeHours > 0);
  const cyc = calculateThreeCupMarcyCycloneBalance({ feedSg: 1.4, underflowSg: 1.92, overflowSg: 1.15 });
  assert.ok(cyc.cvUnderflow > 0);

  const flotLow = calculateFlotationGorainKineticRate({ floatabilityP: 0.002, frothRecoveryRf: 0.55 });
  const flotHigh = calculateFlotationGorainKineticRate({ floatabilityP: 0.012, frothRecoveryRf: 0.90 });
  assert.ok(flotHigh.rateConstantMin > flotLow.rateConstantMin);

  const scr = calculateUrethaneScreenPartitionWeibull({ reliefAngleDeg: 4.5, vibrationG: 5.2, sharpnessAlpha: 4.8 });
  assert.equal(scr.antiBlindingCompliant, true);

  const jrpLong = calculateCoupledReorderWindowDays({ predictedWearHours: 4800, operatingHoursPerDay: 24, criticalityMode: 'normal' });
  const jrpShort = calculateCoupledReorderWindowDays({ predictedWearHours: 1400, operatingHoursPerDay: 24, criticalityMode: 'paro_planta' });
  assert.ok(jrpShort.reorderWindowDays <= jrpLong.reorderWindowDays);
  assert.equal(jrpShort.criticalityMode, 'paro_planta');
  assert.equal(jrpLong.predictedWearHours, 4800);
  assert.equal(jrpLong.operatingHoursPerDay, 24);
  assert.ok(flotLow.floatabilityP === 0.002 && flotLow.frothRecoveryRf === 0.55);
});

test('D3-V50 & D5-V50 XDSM DAG Puro resuelve 7 disciplinas acopladas y Sobol cuantifica S_i > 0 sin DOM', () => {
  assert.equal(XDSM_DISCIPLINE_ORDER.length, 7);
  const dagSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/wizardXdsmDagSolver.js'), 'utf8');
  assert.equal(/\b(document|window|localStorage|sessionStorage)\b/.test(dagSrc), false, 'DAG puro sin acceso al DOM');

  const outLowWear = solveXdsmMultidisciplinaryDag({
    flowM3H: 480,
    solidsWeightPercent: 58,
    particleSizeD80Microns: 220,
    altitudeM: 3100,
    criticalityMode: 'paro_planta',
    predictedWearHours: 1200,
    floatabilityP: 0.009,
    frothRecoveryRf: 0.85,
    quantity: 3,
    placa_ref: 'TAG-BOMBA-07',
    logistics_mode: 'consolidation',
    canal_preferido: 'whatsapp',
    mision: 'sustitucion_inmediata',
    delivery_destination: 'Zacatecas / Fresnillo'
  });

  assert.equal(outLowWear.disciplineOrder.length, 7);
  assert.ok(outLowWear.arrangementCount >= 4);
  assert.equal(outLowWear.driveKinematicsAliasReady, true);
  assert.ok(outLowWear.altitudeEval.deltaNpshLossM > 2.0);
  assert.ok(outLowWear.reorderEval.reorderWindowDays <= 90);
  assert.ok(outLowWear.erpBundle.sapTsv.includes('TAG-BOMBA-07'));
  assert.ok(outLowWear.erpBundle.sapTsv.includes('3\t'));
  assert.ok(outLowWear.erpBundle.acuseParams.includes('folio='));

  const sobol = computeSobolFirstOrderIndices(
    (v) => calculateSlurryMetrics({
      flowM3H: v.flowM3H,
      solidsWeightPercent: v.solidsWeightPercent,
      particleSizeD80Microns: v.particleSizeD80Microns,
      altitudeM: v.altitudeM
    }).results.estimatedImpellerLifeHours,
    [
      { name: 'flowM3H', min: 150, max: 650 },
      { name: 'solidsWeightPercent', min: 25, max: 65 },
      { name: 'particleSizeD80Microns', min: 45, max: 350 },
      { name: 'altitudeM', min: 0, max: 4500 }
    ],
    24
  );

  assert.ok(sobol.totalVariance > 0, 'Varianza global Sobol debe ser positiva');
  assert.ok(sobol.ranked.length === 4);
  assert.ok(sobol.ranked[0].si > 0, 'Al menos un parámetro Tier 1 debe dominar S_i > 0');
});

test('SLICE-V50-04: Reconciliación 6 exports, parámetros ERP completos y parseo 2 etapas', () => {
  assert.ok(Object.keys(DRIVE_ARRANGEMENTS).length >= 4);
  const drive = calculateDriveKinematics({ motorPowerKw: 90, arrangement: 'CR', driveRatio: 1.5 });
  assert.ok(drive.pumpRpm > 0);
  const marcy = calculateMarcyScale({ solidsSpecificGravity: 2.8, solidsWeightPercent: 48 });
  assert.ok(marcy.pulpDensityKgL > 1.0);
  const hybrid = evaluateHybridWetEndConfiguration({ d80Microns: 260, tipSpeedMs: 24, solidsWeightPercent: 52 });
  assert.ok(hybrid && typeof hybrid === 'object');

  const leadBadTemp = validatePlantLeadInput({ wetMaterial: 'R55', tempC: 118, strictBlindCheck: true });
  assert.equal(leadBadTemp.plausible, false);
  assert.equal(leadBadTemp.tempC, 118);
  assert.equal(leadBadTemp.strictBlindCheck, true);

  const norm = normalizePartTokenTwoStage('E4147A05');
  assert.equal(norm.cleaned, 'E4147A05');
  assert.equal(norm.baseRoot, 'E4147');
  assert.equal(norm.alloySuffix, 'A05');

  const erpData = {
    folio: 'SMAT-ERP-50',
    quantity: 6,
    placa_ref: 'BOMBA-MO-04',
    logistics_mode: 'dedicado',
    canal_preferido: 'correo',
    mision: 'equipos',
    delivery_destination: 'Cananea Sonora Mina',
    circuit: 'bombeo',
    pipe_size: '8x6',
    role: 'solo_impulsor'
  };
  const snap = buildCanonicalEngineeringSnapshotImpl(erpData);
  assert.equal(snap.cantidad, 6);
  assert.equal(snap.placa_ref, 'BOMBA-MO-04');
  assert.equal(snap.logistics_mode, 'dedicado');
  assert.equal(snap.canal_preferido, 'correo');
  assert.equal(snap.mision, 'equipos');
  assert.equal(snap.delivery_destination, 'Cananea Sonora Mina');

  const qs = buildAcuseUrlParams(erpData);
  assert.equal(qs.get('cantidad'), '6');
  assert.equal(qs.get('placa_ref'), 'BOMBA-MO-04');
  assert.equal(qs.get('logistics_mode'), 'dedicado');
  assert.equal(qs.get('canal_preferido'), 'correo');
  assert.equal(qs.get('mision'), 'equipos');
  assert.equal(qs.get('delivery_destination'), 'Cananea Sonora Mina');

  const hook = buildLeadWebhookPayload(erpData, 'unit_test');
  assert.equal(hook.cantidad, 6);
  assert.equal(hook.delivery_destination, 'Cananea Sonora Mina');
  assert.ok(formatWhatsappUrlImpl(erpData).includes('BOMBA-MO-04'));
  assert.ok(resolveInternalBudgetCategory(erpData).length > 0);
});

test('SLICE-V50-08: Fachada quoteWizardController < 450 LOC, sin -test fantasma y conserva 23 exports', async () => {
  const ctrlPath = path.join(SITE_ROOT, 'src/scripts/quoteWizardController.js');
  const ctrlSrc = fs.readFileSync(ctrlPath, 'utf8');
  const lineCount = ctrlSrc.split(/\r?\n/).length;
  assert.ok(lineCount < 450, `quoteWizardController.js debe ser < 450 LOC, actual: ${lineCount}`);
  assert.equal(ctrlSrc.includes('wb-assembly-sequence-test'), false, 'Cero referencias al ID fantasma -test');

  const ctrlMod = await import('../src/scripts/quoteWizardController.js');
  const requiredExports = [
    'CIRCUIT_XOR_VIEW_SPEC', 'getCircuitXorViewProjection', 'DOSSIER_FORMATTERS_BY_FIELD',
    'formatDossierSimulationBanner', 'formatDossierMetrologyBadge', 'ROLE_ALIAS_MAP',
    'FLOTATION_CONDITION_ALIAS_MAP', 'FILTRATION_CONDITION_ALIAS_MAP',
    'normalizeFlotationConditionKey', 'normalizeFiltrationConditionKey',
    'resolveFlotationDomChipKey', 'resolveFiltrationDomChipKey',
    'resolveCanonicalRoleFromUrlParam', 'parseMarcyThreeCupUrlParams',
    'resolveUrlContextDescriptor', 'FORMATTERS_BY_FIELD', 'projectWorkbenchToDOM',
    'buildSmatCode', 'decodeSmatCode', 'resolveMiningUnitPulpPreset',
    'matchMiningGroupByEmailDomain', 'computeWizardViewState', 'initQuoteWizardController'
  ];
  for (const sym of requiredExports) {
    assert.ok(sym in ctrlMod, `Export requerido faltante en quoteWizardController.js: ${sym}`);
  }

  const vs = ctrlMod.computeWizardViewState({}, '?circuito=flotacion&rol=rotor_estator');
  assert.equal(vs.circuit, 'flotacion');
  assert.equal(vs.panels.flotacionVisible, true);
});

test('SLICE-V50-08B: Dominio B2B puro migrado (URL context, grupos mineros, códigos SMAT, mailto y SAP plaintext)', async () => {
  const wbMod = await import('../src/scripts/workbenchBus.js');
  const ctx = wbMod.parseUrlContextParams('?circuito=bombeo&serie=6x4&flow=320&cw=50&altitud=2400', '#rfq');
  assert.equal(ctx.circuito, 'bombeo');
  assert.equal(ctx.serie, '6x4');

  const smatCode = wbMod.generateSmatPartCode({ circuit: 'bombeo', role_id: 'solo_impulsor', pipe_size: '6x4' });
  assert.ok(smatCode.startsWith('SMAT-PUMP-6X4'));

  const mailHref = wbMod.formatMailtoUrl({
    folio: 'SMAT-MAIL-01',
    contact_name: 'Ing. Prueba',
    company_name: 'Unidad Minera Norte',
    smat_code: smatCode,
    target_email: 'ventas@smatminerals.com'
  });
  assert.ok(mailHref.startsWith('mailto:ventas@smatminerals.com'));
  assert.ok(mailHref.includes('SMAT-MAIL-01'));

  const plain = wbMod.formatSapPlaintext({
    folio: 'SMAT-TXT-01',
    logistics_mode: 'dedicado',
    canal_preferido: 'correo',
    delivery_destination: 'Zacatecas',
    quantity: 5,
    placa_ref: 'TAG-P5'
  });
  assert.ok(plain.includes('Durango'));
  assert.ok(plain.includes('5 pza(s)'));
  assert.ok(plain.includes('TAG-P5'));
});
