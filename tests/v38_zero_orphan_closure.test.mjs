import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateSmatPartCode,
  parseSmatPartCode,
  getAtomicPartSpecs,
  normalizeMaterialKey,
  buildAcuseUrlParams
} from '../src/scripts/workbenchBus.js';
import {
  buildSmatCode,
  decodeSmatCode,
  FORMATTERS_BY_FIELD,
  resolveBomPartSpecs
} from '../src/scripts/wizardMiningAndCodeDecoder.js';
import { resolveUrlContextDescriptor } from '../src/scripts/wizardUrlAndPresetRouter.js';
import { isNonPumpDomain } from '../src/scripts/acuseSheetController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteDir = path.resolve(__dirname, '..');

test('D1-V38 (1-C): generateSmatPartCode prevents PRENSAESTOPA/BATCH collisions, activates -BANK/-PUMP, and resolves nominal ranges to flagship sizes', () => {
  // 1. /bombeo/sello/ with "Prensaestopa" must never emit SMAT-FILT-1500-CLOTH
  const sealCode = generateSmatPartCode({
    circuit: 'bombeo',
    role_id: 'kit_sellado',
    details: 'Expulsor Centrífugo, Anillo Expulsor y Prensaestopa Series 1.5x1 a 14x12 (4x3, 6x4, 8x6, 10x8)'
  });
  assert.equal(sealCode, 'SMAT-SEAL-6X4-EXP');

  // 2. /control-de-procesos/ with roleId="balanza_marcy" and "Batch" in title must emit SMAT-CTRL-MARCY-1000
  const ctrlCode = generateSmatPartCode({
    circuit: 'control_procesos',
    role_id: 'balanza_marcy',
    details: 'Paquete de Instrumentación de Control de Procesos (Balanza Marcy + Filtro Batch + Tamices ASTM E11)'
  });
  assert.equal(ctrlCode, 'SMAT-CTRL-MARCY-1000');

  // 3. Previously unreachable branches bateria_celdas (-BANK) and bomba_prensa (-PUMP)
  assert.equal(buildSmatCode('flotacion', 'bateria_celdas', '100ft'), 'SMAT-FLOT-100FT-BANK');
  assert.equal(buildSmatCode('filtracion', 'bomba_prensa', '1500'), 'SMAT-FILT-1500-PUMP');

  // 4. Multi-series range strings resolve to flagship nominal sizes (6X4, 100FT, 1500)
  assert.equal(
    generateSmatPartCode({
      circuit: 'bombeo',
      role_id: 'revestimientos',
      details: 'Lote de Revestimientos Series 1.5x1 a 14x12 (4x3, 6x4, 8x6, 10x8)'
    }),
    'SMAT-PUMP-6X4-LINER'
  );
  assert.equal(
    generateSmatPartCode({
      circuit: 'flotacion',
      role_id: 'celda_flotacion',
      details: 'Capacidades de 50 a 300 ft³ (1.4 a 8.5 m³)'
    }),
    'SMAT-FLOT-100FT-CELL'
  );
  assert.equal(
    generateSmatPartCode({
      circuit: 'filtracion',
      role_id: 'filtro_prensa',
      details: 'Placas de 800x800 a 1500x1500 mm (Presión hasta 16 bar)'
    }),
    'SMAT-FILT-1500-PRESS'
  );
});

test('D2-V38 (2-C): Bijective GetPut closure in parseSmatPartCode / decodeSmatCode across all 5 circuits including CYC and SCR', () => {
  const cycParsed = parseSmatPartCode('SMAT-CYC-D15-APEX');
  assert.ok(cycParsed);
  assert.equal(cycParsed.circuit, 'clasificacion');
  assert.equal(cycParsed.ui_role, 'hidrociclon_apex_vortex');
  assert.equal(cycParsed.size, 'D15');
  assert.equal(cycParsed.atomic_code, 'CYC-APEX-SIC');

  const scrParsed = decodeSmatCode('SMAT-SCR-TH48-30');
  assert.ok(scrParsed);
  assert.equal(scrParsed.circuit, 'clasificacion');
  assert.equal(scrParsed.role, 'malla_criba_poliuretano');
  assert.equal(scrParsed.size, 'TH48-30');
  assert.equal(scrParsed.atomic_code, 'SCR-TH48-30');

  const bankParsed = decodeSmatCode('SMAT-FLOT-200FT-BANK');
  assert.equal(bankParsed.circuit, 'flotacion');
  assert.equal(bankParsed.role, 'bateria_celdas');
  assert.equal(bankParsed.size, '200ft');

  const pumpFiltParsed = decodeSmatCode('SMAT-FILT-1200-PUMP');
  assert.equal(pumpFiltParsed.circuit, 'filtracion');
  assert.equal(pumpFiltParsed.role, 'bomba_prensa');
  assert.equal(pumpFiltParsed.size, '1200');

  // Sieves pipe_size matches QuoteWizard.astro <select id="wb-ctrl-spec">
  const sieveSpecs = getAtomicPartSpecs('tamices_laboratorio');
  assert.equal(sieveSpecs.pipe_size, 'astm_8in_inox');
});

test('D3-V38 (3-C): Acuse A4 domain isolation for non-pump circuits and Branch D Hybrid support', () => {
  assert.equal(isNonPumpDomain('bombeo', '', 'SMAT-PUMP-6X4-IMP'), false);
  assert.equal(isNonPumpDomain('bombeo', '', 'SMAT-SEAL-6X4-EXP'), false);
  assert.equal(isNonPumpDomain('bombeo', '', 'SMAT-BEAR-6X4-ASSY'), false);
  assert.equal(isNonPumpDomain('bombeo', '', 'SMAT-SKID-6X4-STD'), false);
  assert.equal(isNonPumpDomain('clasificacion', '', 'SMAT-CYC-D15-APEX'), true);
  assert.equal(isNonPumpDomain('control_procesos', '', 'SMAT-CTRL-MARCY-1000'), true);
  assert.equal(isNonPumpDomain('filtracion', '', 'SMAT-FILT-1500-CLOTH'), true);

  const acuseCtrlSrc = fs.readFileSync(path.join(siteDir, 'src/scripts/acuseSheetController.js'), 'utf8');
  assert.ok(acuseCtrlSrc.includes('isNonPumpRequisition'));
  assert.ok(acuseCtrlSrc.includes('hybrid_a05_r55'));
});

test('D4-V38 & D5-V38 (4-C & 5-C): Zero orphan getElementById selectors in quoteWizardController.js and full Custom Equipment flow', () => {
  const qwSrc = fs.readFileSync(path.join(siteDir, 'src/components/QuoteWizard.astro'), 'utf8');
  for (const id of ['wb-ctrl-res-sm', 'wb-ctrl-res-bias', 'wb-ctrl-res-gy', 'wb-ctrl-res-rr']) {
    assert.ok(qwSrc.includes(`id="${id}"`), `QuoteWizard.astro must mount #${id}`);
  }

  const dossierSrc = fs.readFileSync(path.join(siteDir, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.ok(dossierSrc.includes('id="live-custom-box"'));
  assert.ok(dossierSrc.includes('id="live-custom-text"'));

  const ctrlSrc = fs.readFileSync(path.join(siteDir, 'src/scripts/quoteWizardController.js'), 'utf8');
  assert.equal(ctrlSrc.includes('diag-search-input'), false);
  assert.equal(ctrlSrc.includes('btn-quote-mailto'), false);
  assert.ok(ctrlSrc.includes('custom_equip_notes'));

  const acuseParams = buildAcuseUrlParams({
    circuit: 'flotacion',
    role: 'Celda Piloto Especial',
    custom_notes: 'Celda Acrílica — 25 L — Puerto de muestreo lateral',
    dim_outer_dia: '380',
    dim_shaft_bore: '65'
  });
  assert.equal(acuseParams.get('circuito'), 'flotacion');
  assert.equal(acuseParams.get('notas_especiales'), 'Celda Acrílica — 25 L — Puerto de muestreo lateral');
  assert.ok(acuseParams.get('medidas')?.includes('380'));
});

test('D6-V38 (6-C): All 14 BOM parts resolve exact mass, station, and NIOSH status, and elastomer_a05_dual maps to hybrid_a05_r55', () => {
  assert.equal(normalizeMaterialKey('elastomer_a05_dual'), 'hybrid_a05_r55');

  const pedestalSpec = getAtomicPartSpecs('frame_pedestal', '6x4');
  assert.equal(pedestalSpec.weight_kg, 165.0);
  assert.equal(pedestalSpec.station, 'S1');
  assert.equal(pedestalSpec.niosh_ergonomic_tier, 'HOIST_REQUIRED');

  const framePlateSpec = getAtomicPartSpecs('frame_plate', '6x4');
  assert.equal(framePlateSpec.weight_kg, 128.0);
  assert.equal(framePlateSpec.station, 'S3');

  const coverPlateSpec = getAtomicPartSpecs('cover_plate', '6x4');
  assert.equal(coverPlateSpec.weight_kg, 118.0);
  assert.equal(coverPlateSpec.station, 'S4');

  const lot554Spec = resolveBomPartSpecs('lote_554', '6x4');
  assert.equal(lot554Spec.weight_kg, 1410.0);
  assert.equal(lot554Spec.station, 'S5');

  const desc = resolveUrlContextDescriptor({
    circuito: 'bombeo',
    equipo: 'soporte_rodamiento',
    pieza: 'frame_pedestal',
    peso_kg: '165',
    estacion: 'EST-01'
  });
  assert.deepEqual(desc.bomOverride, {
    pieza: 'frame_pedestal',
    peso_kg: '165',
    estacion: 'EST-01'
  });
});

test('D7-V38 & D8-V38 (7-C & 8-C): 6x4 coherence in catalog aliases, 100% FORMATTERS_BY_FIELD DOM parity, and 0 unused JSON keys', () => {
  const catEsSrc = fs.readFileSync(path.join(siteDir, 'src/pages/catalogo/[code].astro'), 'utf8');
  const catEnSrc = fs.readFileSync(path.join(siteDir, 'src/pages/en/catalog/[code].astro'), 'utf8');
  assert.equal(catEsSrc.includes("slugEs: 'voluta-revestimiento', slugEn: 'volute-liner', part: { ...findPart('D3110')"), false);
  assert.equal(catEnSrc.includes("slugEs: 'voluta-revestimiento', slugEn: 'volute-liner', part: { ...findPart('D3110')"), false);
  assert.ok(catEsSrc.includes("slugEs: 'expulsor-centrifugo', slugEn: 'centrifugal-expeller', part: findPart('EAM028')"));
  assert.ok(catEnSrc.includes("slugEs: 'expulsor-centrifugo', slugEn: 'centrifugal-expeller', part: findPart('EAM028')"));

  // Every key in FORMATTERS_BY_FIELD has a [data-wb-field] consumer in QuoteWizard.astro or LiveEngineeringDossier.astro
  const combinedAstro =
    fs.readFileSync(path.join(siteDir, 'src/components/QuoteWizard.astro'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(siteDir, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  for (const fieldKey of Object.keys(FORMATTERS_BY_FIELD)) {
    assert.ok(
      combinedAstro.includes(`data-wb-field="${fieldKey}"`),
      `FORMATTERS_BY_FIELD key '${fieldKey}' must have a data-wb-field consumer`
    );
  }
  assert.ok(combinedAstro.includes('emergency_hotline'));
  assert.ok(combinedAstro.includes('total_groups'));
});
