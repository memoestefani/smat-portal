import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RFQ_SESSION_STORAGE_KEY,
  deriveSessionLifecycleState,
  loadRfqSession,
} from '../src/scripts/rfqSessionStore.js';
import { EPHEMERAL_TELEMETRY_KEY } from '../src/scripts/ephemeralTelemetryStore.js';
import { resolveDomainMaterialSpec } from '../src/scripts/domainMaterialSpecResolver.js';
import { buildAcuseViewModel } from '../src/scripts/acuseSheetController.js';
import { commitVerticalSimulation } from '../src/scripts/verticalStateAndCtaSyncBridge.js';
import { calculateMarcyScaleReading } from '../src/scripts/tribologyAndCompatibilityEngine.js';
import { ENGINE_SCHEMA_REGISTRY } from '../src/scripts/engineSchemaRegistry.js';
import {
  INTERNAL_PRIVATE_OUTPUT_KEYS,
  auditSchemaOutputParity,
} from '../src/scripts/schemaRuntimeBinder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function createStorageStub() {
  const map = new Map();
  return {
    _map: map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(String(k)); },
    clear: () => { map.clear(); },
  };
}

test('D1/D12-V59 (1): Lista blanca estricta de <=3 llaves localStorage y migración/purga sin re-escritura legada', () => {
  const allowedLocalKeys = new Set(['smat_rfq_session_v3', 'smat_locale_pref', 'smat_lead_outbox_v1']);
  const srcScriptsDir = path.join(SITE_ROOT, 'src/scripts');
  const setItemRe = /localStorage\??\.setItem\(\s*(['"`])([^'"`]+)\1/g;

  for (const name of fs.readdirSync(srcScriptsDir)) {
    if (!name.endsWith('.js')) continue;
    const text = fs.readFileSync(path.join(srcScriptsDir, name), 'utf8');
    let m;
    while ((m = setItemRe.exec(text)) !== null) {
      assert.ok(allowedLocalKeys.has(m[2]), `${name} escribió llave localStorage no autorizada '${m[2]}'`);
    }
  }

  const headerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Header.astro'), 'utf8');
  assert.equal(headerSrc.includes('smat_requisition_tray_v3'), false, 'Header.astro no debe leer la llave legada smat_requisition_tray_v3');
  assert.ok(headerSrc.includes('id="header-outbox-pending-badge"'), 'Header.astro debe montar el badge condicional de outbox pendiente');

  const trayBusSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/requisitionTrayBus.js'), 'utf8');
  assert.equal(/localStorage\??\.setItem/.test(trayBusSrc), false, 'requisitionTrayBus.js debe delegar persistencia a rfqSessionStore');
});

test('D2/D4-V59 (2 & 3): Aislamiento ephemeralTelemetry ⊥ committedRfq, EMPTY honesto y pureza material por dominio', () => {
  const ls = createStorageStub();
  const ss = createStorageStub();
  const prevWin = globalThis.window;
  globalThis.window = {
    localStorage: ls,
    sessionStorage: ss,
    location: { search: '', hash: '', pathname: '/bombeo/' },
    history: { replaceState: () => {} },
    dispatchEvent: () => true,
  };

  try {
    commitVerticalSimulation('bombeo', { flowM3H: 310, slurrySpecificGravity: 1.48 }, { root: null });
    assert.equal(ls._map.has(RFQ_SESSION_STORAGE_KEY), false, 'Simulación pasiva no debe contaminar smat_rfq_session_v3 en localStorage');
    assert.equal(ss._map.has(EPHEMERAL_TELEMETRY_KEY), true, 'Simulación pasiva debe almacenarse exclusivamente en sessionStorage');

    const session = loadRfqSession();
    assert.equal(session.items.length, 0);
    assert.equal(session.plantContext.urgency, 'UNSET');
    assert.equal(deriveSessionLifecycleState(session), 'EMPTY');

    const emptyAcuse = buildAcuseViewModel({
      lifecycleState: deriveSessionLifecycleState(session),
      items: session.items,
      locale: 'en',
    });
    assert.equal(emptyAcuse.isEmptyRequisition, true);
    assert.equal(String(emptyAcuse.folio || '').includes('SMAT-2026-'), false, 'Acuse vacío no debe inventar folio SMAT-2026-*');
    assert.equal(String(emptyAcuse.urgencyHeading || '').includes('PLANT SHUTDOWN'), false, 'Acuse vacío no debe mostrar PLANT SHUTDOWN');
  } finally {
    globalThis.window = prevWin;
  }

  const flotSpec = resolveDomainMaterialSpec({ circuit: 'flotacion', skuId: 'SMAT-FLOT-100FT-MECH', locale: 'es' });
  assert.equal(flotSpec.hardnessSpec.includes('650 HB'), false, 'Flotación PU nunca debe recibir 650 HB de alto cromo');
  assert.ok(flotSpec.badge.includes('U01') || flotSpec.badge.includes('Poliuretano'));

  const filtSpec = resolveDomainMaterialSpec({ circuit: 'filtracion', skuId: 'SMAT-FILT-CLOTH-PLATE', locale: 'en' });
  assert.equal(filtSpec.hardnessSpec.includes('650 HB'), false, 'Filtración PP nunca debe recibir 650 HB de alto cromo');
});

test('D5..D11-V59 (4 & 5): Paridad Backend->Schema, Rayos X Opt-In, Marcy 45.0% exacto y Omnicanalidad', () => {
  for (const domainId of ['pumping', 'tribology', 'sealDrive', 'filtration', 'cycloneScreen', 'erpExport']) {
    const schema = ENGINE_SCHEMA_REGISTRY[domainId];
    assert.ok(schema, `Debe existir esquema '${domainId}'`);
    const synthetic = {};
    for (const o of schema.outputsSchema) {
      synthetic[o.field] = 1;
    }
    const parity = auditSchemaOutputParity(domainId, synthetic, null);
    assert.equal(parity.valid, true, `auditSchemaOutputParity falló para ${domainId}: ${parity.violations.join(', ')}`);
  }

  const leaked = auditSchemaOutputParity('pumping', {
    warehouse_total_mxn: 120000,
    physical_stock_durango_units: 8,
    unit_replacement_value_mxn: 15000,
  }, {
    querySelector: (sel) => (sel.includes('warehouse_total_mxn') ? {} : null),
  });
  assert.equal(leaked.valid, false);
  assert.ok(leaked.leakedPrivateKeys.includes('warehouse_total_mxn'));
  assert.equal(INTERNAL_PRIVATE_OUTPUT_KEYS.length >= 3, true);

  const tribOutputs = new Set(ENGINE_SCHEMA_REGISTRY.tribology.outputsSchema.map((o) => o.field));
  assert.ok(tribOutputs.has('impellerMaterialCode') && tribOutputs.has('linerMaterialCode'), 'ERG-SMAT-006/007 declarados en tribology');

  const marcyGetPut = calculateMarcyScaleReading({ solidsSpecificGravity: 2.8, pulpDensityKgL: 1.407 });
  assert.equal(marcyGetPut.solidsWeightPercent, 45.0, 'Marcy GetPut debe resolver 45.0% exacto con ρp=1.407 kg/L y Ss=2.8');

  const techDiagramsSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/TechnicalDiagrams.astro'), 'utf8');
  assert.ok(techDiagramsSrc.includes('showXrayOverlay = false'), 'TechnicalDiagrams debe iniciar con showXrayOverlay = false');
  assert.ok(techDiagramsSrc.includes('data-xray-toggle'), 'TechnicalDiagrams debe exponer botón opt-in [data-xray-toggle]');

  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.match(globalCss, /\.smat-inputs-2col\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/, 'Mobile-first 1 columna base en .smat-inputs-2col');
});
