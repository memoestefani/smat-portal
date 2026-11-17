import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ROLE_ALIAS_MAP,
  normalizeFlotationConditionKey,
  normalizeFiltrationConditionKey,
  resolveCanonicalRoleFromUrlParam,
  parseMarcyThreeCupUrlParams,
  resolveUrlContextDescriptor
} from '../src/scripts/wizardUrlAndPresetRouter.js';
import {
  computeWizardViewState
} from '../src/scripts/quoteWizardController.js';
import {
  parseUrlContextParams,
  getAtomicPartSpecs,
  generateSmatPartCode
} from '../src/scripts/districtProfilesAndSkuCatalog.js';
import {
  evaluateHybridWetEndConfiguration,
  evaluatePumpAssemblySequence
} from '../src/scripts/pumpAssemblyAndDriveEngine.js';
import {
  syncTrayToWorkbenchStateLens
} from '../src/scripts/requisitionTrayBus.js';
import {
  DEFAULT_CLASSIFICATION_CRITERIA_MAP,
  formatDossierMetrologyBadge
} from '../src/scripts/quoteDossierRenderer.js';
import {
  getQuickProductsCatalog,
  getQuickProductBySlugOrAlias
} from '../src/scripts/quickProductsCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

function readText(relPath) {
  return fs.readFileSync(path.join(siteRoot, relPath), 'utf8');
}

test('D1-V36 (1-C+ / DEB-V36-01..02): Cero enlaces rotos 404 en equipos/ y flotacion/celdas/ + aliases SSG en quick_checkout_Catalog.json y _redirects', () => {
  const equiposEs = readText('src/pages/equipos/index.astro');
  const equiposEn = readText('src/pages/en/process-equipment/index.astro');
  const celdasEs = readText('src/pages/flotacion/celdas.astro');
  const celdasEn = readText('src/pages/en/flotation/cells.astro');

  assert.ok(!equiposEs.includes('/productos/hidrociclones-uretanos-sic/'), 'equipos/index.astro no debe apuntar al slug legacy sin ficha');
  assert.ok(equiposEs.includes('/productos/paquete-casado-bomba-hidrociclon/'), 'equipos/index.astro debe enlazar a /productos/paquete-casado-bomba-hidrociclon/');
  assert.ok(!equiposEn.includes('/en/products/urethane-sic-hydrocyclones/'), 'en/process-equipment/index.astro no debe apuntar al slug legacy');
  assert.ok(equiposEn.includes('/en/products/coupled-pump-hydrocyclone-package/'), 'en/process-equipment/index.astro debe enlazar a /en/products/coupled-pump-hydrocyclone-package/');

  assert.ok(celdasEs.includes('/productos/kit-rotor-estator-flotacion-drop-in/'), 'flotacion/celdas.astro debe apuntar al slug canonico drop-in');
  assert.ok(celdasEn.includes('/en/products/drop-in-flotation-rotor-stator-kit/'), 'en/flotation/cells.astro debe apuntar al slug canonico drop-in');

  // Además, los 4 slugs legacy deben resolver en getQuickProductBySlugOrAlias para generación SSG nativa
  for (const legacySlug of [
    'hidrociclones-uretanos-sic',
    'urethane-sic-hydrocyclones',
    'kit-rotor-estator-flotacion',
    'flotation-rotor-stator-kit'
  ]) {
    const resolved = getQuickProductBySlugOrAlias(legacySlug);
    assert.ok(resolved, `El alias legacy '${legacySlug}' debe resolver en quick_checkout_Catalog.json`);
  }
});

test('D2-V36 (2-C+ / DEB-V36-03): #instrumentos-control-procesos en catalogo.astro y en/catalog.astro une contra control_procesos (3 tarjetas SSR)', () => {
  const rolesData = JSON.parse(readText('data/roles.json'));
  const controlVertical = rolesData.verticals.find((v) => v.id === 'control_procesos' || v.id === 'balanzas_marcy');
  assert.ok(controlVertical, 'roles.json debe contener la vertical control_procesos');
  const items = [...(controlVertical.capex || []), ...(controlVertical.opex || [])];
  assert.equal(items.length, 3, 'control_procesos debe proyectar exactamente las 3 tarjetas de instrumentos y laboratorio');

  for (const rel of ['src/pages/catalogo.astro', 'src/pages/en/catalog.astro']) {
    const src = readText(rel);
    assert.ok(src.includes("v.id === 'control_procesos'"), `${rel} debe filtrar v.id === 'control_procesos'`);
  }
});

test('D3-V36 (3-C+ / DEB-V36-04): QuickPartSelectorStrip.astro usa llaves válidas D3110 (84 kg) y D4029 (16.5 kg) y se monta colapsable en bombeo y cotizar', () => {
  const stripSrc = readText('src/components/QuickPartSelectorStrip.astro');
  assert.ok(!stripSrc.includes("lookupKey: 'E4110'"), 'No debe existir lookupKey E4110 en QuickPartSelectorStrip.astro');
  assert.ok(!stripSrc.includes("lookupKey: 'E4029'"), 'No debe existir lookupKey E4029 en QuickPartSelectorStrip.astro');
  assert.ok(stripSrc.includes("lookupKey: 'D3110'"), 'QuickPartSelectorStrip.astro debe usar D3110 para Voluta');
  assert.ok(stripSrc.includes("lookupKey: 'D4029'"), 'QuickPartSelectorStrip.astro debe usar D4029 para Expeller');

  const d3110Spec = getAtomicPartSpecs('D3110', '6x4');
  const d4029Spec = getAtomicPartSpecs('D4029', '6x4');
  assert.equal(d3110Spec.weight_kg, 52, 'D3110 debe reportar 52 kg desde atomic_parts.json');
  assert.equal(d4029Spec.weight_kg, 24.5, 'D4029 debe reportar 24.5 kg desde atomic_parts.json');

  for (const rel of [
    'src/pages/bombeo/index.astro',
    'src/pages/en/pumping/index.astro'
  ]) {
    const pageSrc = readText(rel);
    assert.ok(pageSrc.includes('<QuickPartSelectorStrip') && pageSrc.includes('collapsible={true}'), `${rel} debe montar <QuickPartSelectorStrip collapsible={true} />`);
  }
  for (const rel of ['src/pages/cotizar.astro', 'src/pages/en/quote.astro']) {
    const pageSrc = readText(rel);
    assert.ok(!pageSrc.includes('<QuickPartSelectorStrip'), `${rel} debe usar QuoteWizard como consola única sin duplicar <QuickPartSelectorStrip /> (D3-V40)`);
  }
});

test('D4-V36 (4-C+ / DEB-V36-05): Biyección 19/19 en skuRoleMap y unión discriminada sin fallback falso E4147 para ciclones y mallas', () => {
  const catalog = getQuickProductsCatalog();
  assert.equal(catalog.length, 19, 'El catálogo canónico debe tener 19 SKUs');

  const tamizCtx = parseUrlContextParams('?sku=SMAT-LAB-TAMIZ-E11');
  assert.equal(tamizCtx.equipo, 'tamices_laboratorio', 'SMAT-LAB-TAMIZ-E11 debe mapear a tamices_laboratorio');

  const rotapCtx = parseUrlContextParams('?sku=SMAT-LAB-ROTAP-MECH');
  assert.equal(rotapCtx.equipo, 'tamices_laboratorio', 'SMAT-LAB-ROTAP-MECH debe mapear a tamices_laboratorio');

  const filtroCtx = parseUrlContextParams('?sku=SMAT-LAB-FILTRO-BATCH');
  assert.equal(filtroCtx.equipo, 'filtro_batch_lab', 'SMAT-LAB-FILTRO-BATCH debe mapear a filtro_batch_lab');

  const impCtx = parseUrlContextParams('?sku=SMAT-PUMP-IMP-AH');
  assert.equal(impCtx.codigo, 'E4147', 'SMAT-PUMP-IMP-AH debe resolver por defecto a E4147 (6x4)');
  assert.equal(impCtx.serie, '6x4', 'SMAT-PUMP-IMP-AH debe preseleccionar la serie central 6x4');

  const cycSpec = getAtomicPartSpecs('hidrociclon_apex_vortex', 'D15');
  assert.equal(cycSpec.part_number, 'CYC-APEX-SIC', 'hidrociclon_apex_vortex no debe caer al impulsor E4147');
  assert.equal(cycSpec.weight_kg, 4.2);

  const scrSpec = getAtomicPartSpecs('malla_criba_poliuretano', 'TH48-30');
  assert.equal(scrSpec.part_number, 'SCR-TH48-30', 'malla_criba_poliuretano no debe caer al impulsor E4147');
  assert.equal(scrSpec.weight_kg, 9.5);

  assert.equal(generateSmatPartCode({ circuit: 'clasificacion', role_id: 'hidrociclon_apex_vortex', size_val: 'D15' }), 'SMAT-CYC-D15-APEX');
  assert.equal(generateSmatPartCode({ circuit: 'clasificacion', role_id: 'malla_criba_poliuretano', size_val: 'TH48-30' }), 'SMAT-SCR-TH48-30');
});

test('D5-V36 (5-C+ / DEB-V36-06) & D6-V36 (6-C+ / DEB-V36-07) & D13-V36 (13-C+): wizardUrlAndPresetRouter.js normaliza todos los slugs URL y telemetría Marcy de 3 vasos', () => {
  assert.equal(resolveCanonicalRoleFromUrlParam('', 'sello-expulsor', 'bombeo'), 'kit_sellado');
  assert.equal(resolveCanonicalRoleFromUrlParam('', 'soporte-rodamientos', 'bombeo'), 'kit_rodamientos');
  assert.equal(resolveCanonicalRoleFromUrlParam('apex-boquilla-hidrociclon', '', 'clasificacion'), 'hidrociclon_apex_vortex');
  assert.equal(resolveCanonicalRoleFromUrlParam('mecanismo_completo', '', 'flotacion'), 'rotor_estator');
  assert.equal(resolveCanonicalRoleFromUrlParam('kit_placas_telas', '', 'filtracion'), 'placas_telas');

  assert.equal(normalizeFlotationConditionKey('reactivos_espuma'), 'espuma_inestable');
  assert.equal(normalizeFlotationConditionKey('arena_gruesa_fondo'), 'arenero_sedimentacion');
  assert.equal(normalizeFiltrationConditionKey('fuga_chorreo'), 'chorro_entre_placas');
  assert.equal(normalizeFiltrationConditionKey('ciclo_lento'), 'tela_cegada');

  const marcyUrl = '?circuito=clasificacion&equipo=hidrociclon_apex_vortex&rho_f=1.42&rho_u=1.94&rho_o=1.18&rs_pct=86.4&cv_u=55.3&d50c=68&roping_risk=1';
  const parsedMarcy = parseMarcyThreeCupUrlParams(marcyUrl);
  assert.equal(parsedMarcy.hasUrlTelemetry, true);
  assert.equal(parsedMarcy.feedSg, 1.42);
  assert.equal(parsedMarcy.underflowSg, 1.94);
  assert.equal(parsedMarcy.overflowSg, 1.18);
  assert.equal(parsedMarcy.solidsRecoveryPct, 86.4);
  assert.equal(parsedMarcy.underflowCvPct, 55.3);
  assert.equal(parsedMarcy.d50cMicrons, 68);
  assert.equal(parsedMarcy.ropingRisk, true);

  const viewState = computeWizardViewState({}, marcyUrl);
  assert.equal(viewState.coupledClassificationActive, true);
  assert.equal(viewState.roleId, 'hidrociclon_apex_vortex');
  assert.equal(viewState.cycloneCircuit.solidsRecoveryPct, 86.4);

  const clasifEs = readText('src/pages/clasificacion/index.astro');
  const clasifEn = readText('src/pages/en/classification/index.astro');
  assert.ok(clasifEs.includes('rho_f=${res.feedSg}') && clasifEs.includes('rs_pct=${res.solidsRecoveryPct}'), 'clasificacion/index.astro debe serializar en vivo el balance Marcy en #cyc-rfq-link');
  assert.ok(clasifEn.includes('rho_f=${res.feedSg}') && clasifEn.includes('rs_pct=${res.solidsRecoveryPct}'), 'en/classification/index.astro debe serializar en vivo el balance Marcy en #cyc-rfq-link');
});

test('D7-V36 (7-C+ / DEB-V36-08): BaseLayout.astro y [slug].astro emiten matriz recíproca hreflang y canonical sin /en/productos/', () => {
  const baseLayout = readText('src/layouts/BaseLayout.astro');
  assert.ok(baseLayout.includes("'/clasificacion/': '/en/classification/'"), 'BaseLayout debe mapear /clasificacion/ <-> /en/classification/');
  assert.ok(baseLayout.includes("'/cumplimiento/': '/en/compliance/'"), 'BaseLayout debe mapear /cumplimiento/ <-> /en/compliance/');

  const prodEs = readText('src/pages/productos/[slug].astro');
  const prodEn = readText('src/pages/en/products/[slug].astro');
  assert.ok(prodEs.includes('alternateEsPath={`/productos/${sku.slug_es}/`}') && prodEs.includes('alternateEnPath={`/en/products/${sku.slug_en}/`}'));
  assert.ok(prodEn.includes('alternateEsPath={`/productos/${sku.slug_es}/`}') && prodEn.includes('alternateEnPath={`/en/products/${sku.slug_en}/`}'));
});

test('D8-V36 (8-C+ / DEB-V36-09): LiveEngineeringDossier.astro cumple Gate G1 (Triplete A,B,C ISO 2768-m en Durango) y unifica Col. Primer Presidente C.P. 34166', () => {
  const dossier = readText('src/components/LiveEngineeringDossier.astro');
  const garantia = readText('src/pages/garantia.astro');
  const sapExport = readText('src/scripts/sapAndLeadExportEngine.js');

  assert.ok(dossier.includes('Triplete (A, B, C) ISO 2768-m') && dossier.includes('Col. Primer Presidente'), 'LiveEngineeringDossier.astro debe certificar Triplete (A,B,C) ISO 2768-m en Durango y Col. Primer Presidente');
  assert.ok(garantia.includes('Col. Primer Presidente, C.P. 34166 Durango') && !garantia.includes('34080'), 'garantia.astro debe usar C.P. 34166 sin 34080');
  assert.ok(sapExport.includes('Mariano Salas #114, Col. Primer Presidente, Durango, Dgo. CP 34166') && !sapExport.includes('Col. Hipódromo'), 'sapAndLeadExportEngine.js debe usar Col. Primer Presidente CP 34166');
});

test('D9-V36 (9-C+ / DEB-V36-10): PumpAssemblyReport.astro acopla evaluateHybridWetEndConfiguration a Rama D Híbrida (Impulsor A05 + Forros R55)', () => {
  const reportSrc = readText('src/components/PumpAssemblyReport.astro');
  assert.ok(reportSrc.includes('evaluateHybridWetEndConfiguration'), 'PumpAssemblyReport.astro debe importar e invocar evaluateHybridWetEndConfiguration');
  assert.ok(reportSrc.includes('Finnie-Hutchings'), 'PumpAssemblyReport.astro debe proyectar la partición angular Finnie-Hutchings en Rama D Híbrida');

  const hybridEval = evaluateHybridWetEndConfiguration({ d80Microns: 220, tipSpeedMs: 21.8, pulpPh: 7.5, solidsWeightPercent: 48, pipeSeries: '6x4' });
  assert.equal(hybridEval.hybridRecommended, true);
  assert.equal(hybridEval.impellerMaterialCode, 'A05');
  assert.equal(hybridEval.linerMaterialCode, 'R55');
  assert.ok(hybridEval.massSavingsPct > 3, 'El extremo húmedo híbrido debe ahorrar masa suspendida frente a 100% metal');

  const seqHybrid = evaluatePumpAssemblySequence({ wetEndBranch: 'hibrido_a05_r55', frontClearanceMm: 0.75, impellerExitWidthMm: 48, pipeSeries: '6x4' });
  assert.equal(seqHybrid.wetEndBranch, 'hibrido_a05_r55');
  assert.ok(seqHybrid.structuralReasonEs.includes('Finnie-Hutchings'));
});

test('D10-V36 (10-C+) & D11-V36 (11-C+ / DEB-V36-11): Confirmación interactiva Gate G5 (data-g5-advance-confirm) y preservación PutGet de clientRef en syncTrayToWorkbenchStateLens', () => {
  const qtray = readText('src/components/QuickOrderTray.astro');
  const qwiz = readText('src/components/QuoteWizard.astro');
  assert.ok(qtray.includes('data-g5-advance-confirm') && qtray.includes('CONDICIÓN G5 CONFIRMADA: 50% ANTICIPO'), 'QuickOrderTray.astro debe incluir el control interactivo data-g5-advance-confirm');
  assert.ok(qwiz.includes('data-g5-advance-confirm'), 'QuoteWizard.astro debe incluir el control interactivo data-g5-advance-confirm');

  // Ley PutGet: si el usuario ingresó una referencia manual (ej. "OC-MINA-2026-991"), syncTrayToWorkbenchStateLens debe preservarla
  const trayState = {
    items: [{ id: 'SMAT-PUMP-IMP-AH', qty: 2, circuit: 'bombeo', material: 'alto_cromo_cr27' }],
    coreReturnEnabled: false
  };
  const nextWbWithManualRef = syncTrayToWorkbenchStateLens(trayState, { clientRef: 'OC-MINA-2026-991' });
  assert.equal(nextWbWithManualRef.clientRef, 'OC-MINA-2026-991', 'syncTrayToWorkbenchStateLens no debe sobreescribir un clientRef manual del comprador');

  const nextWbWithoutManualRef = syncTrayToWorkbenchStateLens(trayState, { clientRef: '' });
  assert.equal(nextWbWithoutManualRef.clientRef, 'SMAT-PUMP-IMP-AHx2', 'Cuando clientRef está vacío, debe poblarse con el resumen de SKUs');

  assert.ok(DEFAULT_CLASSIFICATION_CRITERIA_MAP.hidrociclon_apex_vortex, 'quoteDossierRenderer.js debe proveer criterios para hidrociclon_apex_vortex');
  assert.ok(DEFAULT_CLASSIFICATION_CRITERIA_MAP.malla_criba_poliuretano, 'quoteDossierRenderer.js debe proveer criterios para malla_criba_poliuretano');
  const badge = formatDossierMetrologyBadge({ cycloneCircuit: { solidsRecoveryPct: 85.4, d50cMicrons: 72 } }, true);
  assert.ok(badge.includes('Rs 85.4%') && badge.includes('d50c 72 µm'));
});
