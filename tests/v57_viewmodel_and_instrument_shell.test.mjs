import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  deriveSessionLifecycleState,
  loadRfqSession,
} from '../src/scripts/rfqSessionStore.js';
import { parseBomPasteInput } from '../src/scripts/bomPasteParser.js';
import {
  buildBomPasteViewModel,
  buildTribologyAssemblyViewModel,
  buildMetrologyViewModel,
  buildDossierPriorityViewModel,
} from '../src/scripts/instrumentViewModels.js';
import {
  formatLogisticsDestinationHuman,
  formatScientificUnit,
} from '../src/scripts/i18nDomainLabels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('D1-V57/D3-V57: Ciclo de vida EMPTY -> DRAFT -> VERIFIED y defaults honestos en SSR', () => {
  const empty = loadRfqSession();
  assert.equal(deriveSessionLifecycleState(empty), 'EMPTY');
  assert.equal(empty.plantContext.destination, 'warehouse_durango_pickup');

  const draft = {
    ...empty,
    items: [{ skuId: 'SMAT-PUMP-IMP-AH', qty: 2 }],
  };
  assert.equal(deriveSessionLifecycleState(draft), 'DRAFT');

  const verified = {
    ...draft,
    contact: {
      name: 'Ing. Ruiz',
      company: 'Mina Durango',
      email: 'ruiz@minadurango.com',
      phone: '6181234567',
    },
  };
  assert.equal(deriveSessionLifecycleState(verified), 'VERIFIED');

  const dossierSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.equal(dossierSrc.includes('id="live-folio">SMAT-2026-8810'), false, 'LiveEngineeringDossier no debe pre-inyectar folio sintético SMAT-2026-8810 en #live-folio');
  assert.equal(dossierSrc.includes('contacto@minera.com'), false, 'LiveEngineeringDossier no debe pre-inyectar correo ficticio');

  const traySrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/RequisitionTraySummary.astro'), 'utf8');
  assert.equal(traySrc.includes('SMAT-7A4F-9C12'), false, 'RequisitionTraySummary no debe mostrar referencia sintética cuando la bandeja está vacía');
});

test('D2-V57/D8-V57: ViewModels proyectan totalUnits/lineCount, wearMultiplier, Gy, c*mu y cero fugas ES/EN', () => {
  const parsed = parseBomPasteInput('SMAT-PUMP-IMP-AH 2\nSMAT-FLOT-MECH-18SP 3');
  assert.equal(parsed.lineCount, 2);
  assert.equal(parsed.totalUnits, 5);

  const bomVmEs = buildBomPasteViewModel(parsed, 'es');
  const bomVmEn = buildBomPasteViewModel(parsed, 'en');
  assert.match(bomVmEs.badgeText, /2 línea.*5 pieza/);
  assert.match(bomVmEn.badgeText, /2 line.*5 .*unit/);

  const tribVm = buildTribologyAssemblyViewModel(
    {
      optimalMaterial: { wearMultiplierVsCr27: 1.0 },
      hybridEval: { fullMetalMassKg: 420, architectureId: 'RAMA_D' },
      driveEval: { bearingServiceFactor: 1.5, bearingL10Hours: 48000, radialBeltLoadKn: 4.2, ceramicSafeTipSpeed: true },
      assemblySeqEval: { isValidAssembly: true, canonicalSequence: ['EST-01', 'EST-02', 'EST-03'] },
    },
    'en'
  );
  assert.ok(tribVm.primaryKpis.some((k) => k.key === 'wearMultiplierVsCr27'));
  assert.ok(tribVm.primaryKpis.some((k) => k.key === 'fullMetalMassKg' && k.value.includes('420 kg')));

  const metVm = buildMetrologyViewModel(
    { marcy: { pulpDensitySg: 1.41, ringApparentCw: 45 }, gy: { targetRelativeStdErrorPercent: 5, recommendationEn: 'Dry representative sample split.' }, astm: { recommendedSeries: 'ASTM E11' } },
    'en'
  );
  assert.equal(metVm.headline, 'Dry representative sample split.');

  const prioVm = buildDossierPriorityViewModel(
    { urgencyCode: 'P1', cmuScore: 95.5 },
    { criticalVelocityMs: 2.42 },
    { plausible: true },
    'en'
  );
  assert.match(prioVm.headline, /P1.*95\.5.*2\.42 m\/s/);

  assert.equal(
    formatLogisticsDestinationHuman('Retiro en Almacén Central Durango (Coordinación con Folio)', 'en'),
    'Durango Central Warehouse Pickup (Scheduled by Folio)'
  );
  assert.equal(formatScientificUnit(56.34, 's^-1', 1), '56.3 s⁻¹');
  assert.equal(formatScientificUnit(11.846, 'min^-1', 3), '11.846 min⁻¹');
});

test('D4-V57..D9-V57: InstrumentShell Input-First, CFDI I08, EST-03, Filtración distinta, roles flow_range y Copy Limpio', () => {
  for (const coreFile of [
    'MetrologyLabCore.astro',
    'CycloneScreenCore.astro',
    'FiltrationCore.astro',
    'FlotationCore.astro',
    'PumpingHydraulicsCore.astro',
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores', coreFile), 'utf8');
    const iInputs = src.indexOf('slot="inputs"');
    const iVerdict = src.indexOf('slot="verdict"');
    assert.ok(iInputs !== -1 && iVerdict !== -1 && iInputs < iVerdict, `${coreFile} debe renderizar inputs antes de verdict en InstrumentShell`);
    assert.equal(src.includes('s^-1'), false, `${coreFile} no debe exponer exponente ASCII s^-1`);
    assert.equal(src.includes('min^-1'), false, `${coreFile} no debe exponer exponente ASCII min^-1`);
  }

  const trayBus = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/requisitionTrayBus.js'), 'utf8');
  assert.ok(trayBus.includes('I08 (Otra maquinaria y equipo)'), 'requisitionTrayBus debe usar clave CFDI I08');
  assert.equal(trayBus.includes('I04 (Equipo de cómputo'), false);

  const diagHub = fs.readFileSync(path.join(SITE_ROOT, 'src/components/DiagnosticsHub.astro'), 'utf8');
  assert.ok(diagHub.includes('resolvedStationNumber'), 'DiagnosticsHub debe derivar el número de estación desde station_id');

  const flotBridge = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/flotationFiltrationBridge.js'), 'utf8');
  assert.ok(flotBridge.includes('shifterSku') && flotBridge.includes('Corre-Placas'), 'Filtración debe distinguir Placas/Tela vs Corre-Placas');

  const qcard = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.equal(qcard.includes('EN STOCK DURANGO'), false);
  assert.equal(qcard.includes('Foto Real Cero-OEM'), false);

  const sealIsland = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/SealDriveBearingIsland.astro'), 'utf8');
  assert.ok(sealIsland.includes('roleObj?.flow_range'), 'SealDriveBearingIsland debe proyectar roles.json::flow_range');

  const mgJson = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/mining_groups.json'), 'utf8'));
  assert.equal('total_groups' in mgJson, false, 'mining_groups.json no debe conservar total_groups huérfano');
});
