// @ts-check
/**
 * verticalStateAndCtaSyncBridge.js
 * ---------------------------------------------------------------------------
 * Bus Isomórfico Libre de Glitches entre Calculadoras Verticales, Store Único
 * Tipado `smat_rfq_session_v3` y Enlaces CTA Reactivos (`/cotizar/?...`).
 *
 * Aislamiento dimensional (`D2-V56`):
 *   - `metrology.oreSolidsSg` (gravedad específica mineral seco, 2.2..5.5) nunca
 *     contamina `cyclone.feedPulpSgKgL` (densidad de pulpa kg/L, 1.02..3.5).
 */

import {
  hasUserInteractedTelemetry,
  loadEphemeralStationTelemetry,
  saveEphemeralStationTelemetry,
} from './ephemeralTelemetryStore.js';
import { addTrayItem } from './requisitionTrayBus.js';
import {
  RFQ_SESSION_STORAGE_KEY,
  SMAT_ENGINEERING_CONTEXT_KEY,
  commitEphemeralTelemetryToRfq,
  loadEngineeringContextSnapshot,
  loadRfqSession,
  saveEngineeringContextSnapshot,
  saveRfqSession
} from './rfqSessionStore.js';

/**
 * Mapea una instantánea parcial de una vertical hacia las llaves planas compatibles
 * con el enlace Reactivo sin destruir el complemento existente.
 *
 * @param {string} vertical
 * @param {Record<string, any>} payload
 * @param {Record<string, any>} [prevWb={}]
 * @returns {Record<string, any>}
 */
export function projectVerticalPayloadToWorkbenchPatch(vertical = 'bombeo', payload = {}, prevWb = {}) {
  const slug = String(vertical || 'bombeo').trim().toLowerCase();
  const p = payload && typeof payload === 'object' ? payload : {};
  /** @type {Record<string, any>} */
  const patch = {
    ...prevWb,
    circuit: slug,
    circuito: slug,
  };

  if (slug === 'bombeo' || slug === 'pumping') {
    if (p.sealBranch || p.recommendedSealBranch || p.seal_branch) {
      const sb = String(p.sealBranch || p.recommendedSealBranch || p.seal_branch);
      patch.sealBranch = sb;
      patch.seal_branch = sb;
    }
    if (p.sealStationCode) {
      patch.stationCode = String(p.sealStationCode);
      patch.estacion = String(p.sealStationCode);
    }
    const matKey = p.materialKey || p.wetEndMaterial || p.effectiveBranch || p.pump_material;
    if (matKey) {
      patch.pump_material = String(matKey);
      patch.selectedMaterial = String(matKey);
    }
    if (Number.isFinite(Number(p.d80Microns))) patch.d80 = Number(p.d80Microns);
    if (Number.isFinite(Number(p.impellerTipSpeedMs ?? p.tipSpeedMs))) {
      patch.tipSpeedU2Ms = Number(p.impellerTipSpeedMs ?? p.tipSpeedMs);
      patch.u2_ms = patch.tipSpeedU2Ms;
    }
    if (Number.isFinite(Number(p.slurryPh))) {
      patch.ph = Number(p.slurryPh);
      patch.pulpPh = Number(p.slurryPh);
    }
    if (Number.isFinite(Number(p.slurrySg))) patch.sg = Number(p.slurrySg);
    if (Number.isFinite(Number(p.dischargeHeadM ?? p.hdM))) patch.dischargeHeadM = Number(p.dischargeHeadM ?? p.hdM);
    if (Number.isFinite(Number(p.suctionHeadM ?? p.hsM))) patch.suctionHeadM = Number(p.suctionHeadM ?? p.hsM);
    if (Number.isFinite(Number(p.expellerDiaMm))) patch.expellerDiaMm = Number(p.expellerDiaMm);
    if (Number.isFinite(Number(p.pumpRpm))) patch.pumpRpm = Number(p.pumpRpm);
    if (Number.isFinite(Number(p.motorRpm))) {
      patch.motor_rpm = Number(p.motorRpm);
      patch.motorRpm = Number(p.motorRpm);
    }
    if (Number.isFinite(Number(p.driverPulleyMm))) {
      patch.driver_pulley_mm = Number(p.driverPulleyMm);
      patch.driverPulleyMm = Number(p.driverPulleyMm);
    }
    if (Number.isFinite(Number(p.drivenPulleyMm))) {
      patch.driven_pulley_mm = Number(p.drivenPulleyMm);
      patch.drivenPulleyMm = Number(p.drivenPulleyMm);
    }
    if (Number.isFinite(Number(p.motorPowerKw ?? p.shaftPowerKw ?? p.powerKw))) {
      const kw = Number(p.motorPowerKw ?? p.shaftPowerKw ?? p.powerKw);
      patch.shaft_power_kw = kw;
      patch.motorPowerKw = kw;
    }
    if (Number.isFinite(Number(p.impellerDiaMm))) patch.impellerDiaMm = Number(p.impellerDiaMm);
    if (p.pipeSeries || p.serie || p.pipeSize || p.pipe_size) {
      const ps = String(p.pipeSeries || p.serie || p.pipeSize || p.pipe_size);
      patch.pipe_size = ps;
      patch.pipeSize = ps;
      patch.serie = ps;
    }
    if (Number.isFinite(Number(p.frontClearanceMm ?? p.claro_mm))) {
      const cl = Number(p.frontClearanceMm ?? p.claro_mm);
      patch.frontClearanceMm = cl;
      patch.claro_mm = cl;
      patch.clearance_mm = cl;
    }
    if (Number.isFinite(Number(p.bearingL10Hours))) patch.l10hHours = Number(p.bearingL10Hours);
    if (Number.isFinite(Number(p.dynamicCapacityCkN ?? p.recommendedDynamicCkN))) {
      const ckn = Number(p.dynamicCapacityCkN ?? p.recommendedDynamicCkN);
      patch.cap_c_kn = ckn;
      patch.dynamicCapacityCkN = ckn;
    }
    if (p.arrangement || p.arrangementCode) {
      patch.drive_arrangement = String(p.arrangement || p.arrangementCode);
      patch.driveArrangement = patch.drive_arrangement;
    }
  } else if (slug === 'filtracion' || slug === 'filtration') {
    patch.filtration = { ...(prevWb.filtration || {}), ...p };
    if (Number.isFinite(Number(p.feedPressureBar))) patch.feedPressureBar = Number(p.feedPressureBar);
    if (Number.isFinite(Number(p.plateWidthMm))) patch.plateWidthMm = Number(p.plateWidthMm);
    if (Number.isFinite(Number(p.cakeMoistureTargetPct))) patch.cakeMoistureTargetPct = Number(p.cakeMoistureTargetPct);
  } else if (slug === 'flotacion' || slug === 'flotation') {
    patch.flotation = { ...(prevWb.flotation || {}), ...p };
    if (Number.isFinite(Number(p.particleSizeUm))) patch.d80 = Number(p.particleSizeUm);
    if (Number.isFinite(Number(p.solidsCwPct))) {
      patch.cw = Number(p.solidsCwPct);
      patch.solidsPct = Number(p.solidsCwPct);
    }
  } else if (slug === 'clasificacion' || slug === 'classification') {
    patch.cycloneCircuit = { ...(prevWb.cycloneCircuit || {}), ...p };
    if (Number.isFinite(Number(p.d50cMicrons ?? p.cutPointD50cUm))) {
      patch.d50c = Number(p.d50cMicrons ?? p.cutPointD50cUm);
      patch.d80 = patch.d50c;
    }
    if (Number.isFinite(Number(p.feedPulpSgKgL ?? p.feedSg))) {
      patch.feedPulpSgKgL = Number(p.feedPulpSgKgL ?? p.feedSg);
    }
  } else if (slug === 'control_procesos' || slug === 'process_control') {
    if (Number.isFinite(Number(p.oreSolidsSg ?? p.specificGravity))) {
      patch.oreSolidsSg = Number(p.oreSolidsSg ?? p.specificGravity);
      patch.solidsSg = patch.oreSolidsSg;
    }
    if (Number.isFinite(Number(p.solidsPctCw))) {
      patch.cw = Number(p.solidsPctCw);
      patch.solidsPct = Number(p.solidsPctCw);
    }
    if (Number.isFinite(Number(p.pulpDensityKgL))) {
      patch.rhop = Number(p.pulpDensityKgL);
    }
  }

  return patch;
}

/**
 * Reescribe en vivo todos los enlaces CTA hacia `/cotizar/` o `/en/quote/`.
 *
 * @param {any} root
 * @param {string} [vertical='bombeo']
 * @param {Record<string, any>} [queryPatch={}]
 * @returns {number} Cantidad de enlaces CTA sincronizados
 */
export function syncVerticalCtaLinks(root, vertical = 'bombeo', queryPatch = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  const links = Array.from(root.querySelectorAll('a[href*="/cotizar/"], a[href*="/en/quote/"]'));
  let updatedCount = 0;

  for (const link of links) {
    const rawHref = typeof link.getAttribute === 'function' ? link.getAttribute('href') : link.href;
    if (!rawHref) continue;

    const hashIdx = rawHref.indexOf('#');
    const hashPart = hashIdx >= 0 ? rawHref.slice(hashIdx) : '#rfq';
    const beforeHash = hashIdx >= 0 ? rawHref.slice(0, hashIdx) : rawHref;
    const qIdx = beforeHash.indexOf('?');
    const basePath = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
    const queryStr = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : '';

    const params = new URLSearchParams(queryStr);
    if (!params.get('circuito') && vertical) {
      params.set('circuito', String(vertical));
    }

    const rawFixedAttr = typeof link.getAttribute === 'function'
      ? String(link.getAttribute('data-card-fixed-params') || '')
      : String(link.dataset?.cardFixedParams || '');
    const fixedKeys = new Set(
      rawFixedAttr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const isAtomicPartCard = params.has('codigo');
    if (isAtomicPartCard) {
      fixedKeys.add('codigo');
      fixedKeys.add('serie');
      if (params.has('material')) fixedKeys.add('material');
      if (params.has('seal_branch')) fixedKeys.add('seal_branch');
    }

    for (const [k, v] of Object.entries(queryPatch || {})) {
      if (v === undefined || v === null || v === '') continue;
      if ((k === 'equipo' || k === 'pieza' || k === 'flot_condition' || k === 'filt_condition' || k === 'codigo') && params.has(k)) {
        continue;
      }
      if (fixedKeys.has(k) && params.has(k)) {
        continue;
      }
      params.set(k, String(v));
    }

    const nextHref = `${basePath}?${params.toString()}${hashPart}`;
    if (typeof link.setAttribute === 'function') {
      link.setAttribute('href', nextHref);
    }
    link.href = nextHref;
    updatedCount += 1;
  }

  return updatedCount;
}

/**
 * Ejecuta una transacción atómica sobre `smat_rfq_session_v3` y sincroniza los enlaces CTA.
 *
 * @param {string} [vertical='bombeo']
 * @param {Record<string, any>} [payload={}]
 * @param {{ root?: any, queryPatch?: Record<string, any>, skipStorageWrite?: boolean, explicitCommit?: boolean, commit?: boolean, userInteracted?: boolean }} [options={}]
 */
export function commitVerticalSimulation(vertical = 'bombeo', payload = {}, options = {}) {
  const skipWrite = Boolean(options && options.skipStorageWrite);
  const explicitCommit = Boolean(options && (options.explicitCommit || options.commit));
  let mergedCtx = null;
  /** @type {Record<string, any>} */
  let wbNext = {};
  if (!skipWrite) {
    if (explicitCommit) {
      if (hasUserInteractedTelemetry()) {
        commitEphemeralTelemetryToRfq(vertical);
      }
      mergedCtx = saveEngineeringContextSnapshot(vertical, payload, { explicitCommit: true });
      const sess = loadRfqSession();
      wbNext = projectVerticalPayloadToWorkbenchPatch(vertical, payload, sess.plantContext || {});
      saveRfqSession({
        plantContext: {
          ...sess.plantContext,
          circuit: vertical,
          activeCircuit: vertical,
        },
      });
    } else {
      const eph = saveEphemeralStationTelemetry(vertical, payload, {
        userInteracted: Boolean(options?.userInteracted),
        circuit: vertical,
      });
      mergedCtx = eph.stationSnapshots;
      wbNext = projectVerticalPayloadToWorkbenchPatch(vertical, payload, loadRfqSession().plantContext || {});
    }
  } else {
    mergedCtx = loadEngineeringContextSnapshot();
    wbNext = loadRfqSession().plantContext || {};
  }

  const ctaCount = options && options.root
    ? syncVerticalCtaLinks(options.root, vertical, options.queryPatch || payload)
    : 0;

  return {
    engineeringContext: mergedCtx,
    workbenchState: wbNext,
    syncedCtaCount: ctaCount,
    skippedStorageWrite: skipWrite,
    storageLane: skipWrite ? 'none' : (explicitCommit ? 'committed_rfq' : 'ephemeral_session'),
  };
}

const KNOWN_ENGINEERING_URL_PARAMS = [
  'sg', 'rho_f', 'd80', 'p80', 'd50c', 'cw', 'solids', 'ph', 'vtip', 'u2_ms',
  'serie', 'material', 'seal_branch', 'hd_m', 'hs_m', 'exp_dia', 'n2_rpm',
  'arr', 'transmision', 'power_kw', 'cap_c', 'cap_c_kn', 'motor_rpm', 'dp_mot',
  'dp_bom', 'imp_dia', 'press_bar', 'plate_mm', 'cake_pct', 'jg', 'd32',
  'rpm', 'cell', 'apex_mm', 'vortex_mm', 'press_kpa', 'uf_sg', 'of_sg',
  'solids_sg', 'aperture_mm', 'feed_um',
];

/**
 * @param {...any} candidates
 */
function firstDefinedValue(...candidates) {
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return undefined;
}

/**
 * @param {...any} candidates
 */
function firstFiniteNumber(...candidates) {
  for (const val of candidates) {
    if (val === undefined || val === null || val === '') continue;
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Hidrata de forma unificada desde `URLSearchParams` y `smat_rfq_session_v3`
 * respetando aislamiento dimensional entre `oreSolidsSg` y `feedPulpSgKgL`.
 *
 * @param {string} [searchStr='']
 */
export function loadUnifiedEngineeringAndWorkbenchState(searchStr = '') {
  const rawSearch = searchStr || (typeof window !== 'undefined' && window.location ? window.location.search : '');
  const urlParams = new URLSearchParams(rawSearch);

  const session = loadRfqSession();
  const ephemeral = loadEphemeralStationTelemetry();
  const engCtx = /** @type {Record<string, any>} */ ({
    ...(ephemeral.stationSnapshots || {}),
    ...(session.stationSnapshots || {}),
  });
  const outbox = session.outbox || { dispatchStatus: null, lastPayload: null };

  const pc = engCtx.metrology || engCtx.processControl || {};
  const cyc = engCtx.classification || engCtx.cycloneScreen || {};
  const flot = engCtx.flotation || {};
  const filt = engCtx.filtration || {};
  const pump = engCtx.pumping || engCtx.driveAndHybrid || {};

  const hasUrlParams = KNOWN_ENGINEERING_URL_PARAMS.some((k) => urlParams.has(k));
  const hasCommittedStations = Object.entries(session.stationSnapshots || {}).some(
    ([k, v]) => k !== 'outbox' && v && typeof v === 'object' && v.passive !== true && Object.keys(v).length > 0
  );
  const hasTypedPersisted = Boolean(
    Object.keys(session.metrology || {}).length > 0 ||
    Object.keys(session.cyclone || {}).length > 0 ||
    Object.keys(session.flotation || {}).length > 0 ||
    session.items.length > 0 ||
    ephemeral.userInteracted === true
  );

  const hasPersistedState = Boolean(hasUrlParams || hasCommittedStations || hasTypedPersisted);

  const persistedFields = {
    sg: firstFiniteNumber(
      urlParams.get('sg'),
      urlParams.get('rho_f'),
      pump.slurrySg,
      cyc.feedPulpSgKgL,
      cyc.feedSg
    ),
    feedPulpSgKgL: firstFiniteNumber(
      urlParams.get('rho_f'),
      session.cyclone?.feedPulpSgKgL,
      cyc.feedPulpSgKgL,
      cyc.feedSg
    ),
    oreSolidsSg: firstFiniteNumber(
      urlParams.get('solids_sg'),
      session.metrology?.oreSolidsSg,
      pc.oreSolidsSg,
      pc.specificGravity
    ),
    d50Um: firstFiniteNumber(
      urlParams.get('d50c'),
      urlParams.get('d80'),
      urlParams.get('p80'),
      cyc.cutPointD50cUm,
      cyc.d50cMicrons,
      flot.particleSizeUm,
      pump.d80Microns
    ),
    d80Um: firstFiniteNumber(
      urlParams.get('d80'),
      urlParams.get('p80'),
      urlParams.get('d50c'),
      pump.d80Microns,
      flot.particleSizeUm,
      cyc.cutPointD50cUm
    ),
    cw: firstFiniteNumber(
      urlParams.get('cw'),
      urlParams.get('solids'),
      session.metrology?.solidsPctCw,
      pc.solidsPctCw,
      flot.solidsCwPct,
      pump.solidsWeightPercent
    ),
    pulpPh: firstFiniteNumber(urlParams.get('ph'), pump.slurryPh, pump.pulpPh),
    tipSpeedMs: firstFiniteNumber(urlParams.get('vtip'), urlParams.get('u2_ms'), pump.impellerTipSpeedMs, pump.tipSpeedMs),
    pipeSeries: firstDefinedValue(urlParams.get('serie'), pump.pipeSeries),
    materialKey: firstDefinedValue(urlParams.get('material'), pump.materialKey, pump.effectiveBranch, pump.wetEndMaterial),
    sealBranch: firstDefinedValue(urlParams.get('seal_branch'), pump.sealBranch),
    dischargeHeadM: firstFiniteNumber(urlParams.get('hd_m'), pump.dischargeHeadM),
    suctionHeadM: firstFiniteNumber(urlParams.get('hs_m'), pump.suctionHeadM),
    expellerDiaMm: firstFiniteNumber(urlParams.get('exp_dia'), pump.expellerDiaMm),
    pumpRpm: firstFiniteNumber(urlParams.get('n2_rpm'), pump.pumpRpm),
    arrangementCode: firstDefinedValue(urlParams.get('arr'), urlParams.get('transmision'), pump.arrangementCode, pump.arrangement),
    motorPowerKw: firstFiniteNumber(urlParams.get('power_kw'), pump.motorPowerKw, pump.shaftPowerKw),
    dynamicCapacityCkN: firstFiniteNumber(urlParams.get('cap_c'), urlParams.get('cap_c_kn'), pump.dynamicCapacityCkN, pump.recommendedDynamicCkN),
    motorRpm: firstFiniteNumber(urlParams.get('motor_rpm'), pump.motorRpm),
    driverPulleyMm: firstFiniteNumber(urlParams.get('dp_mot'), pump.driverPulleyMm),
    drivenPulleyMm: firstFiniteNumber(urlParams.get('dp_bom'), pump.drivenPulleyMm),
    impellerDiaMm: firstFiniteNumber(urlParams.get('imp_dia'), pump.impellerDiaMm),
    feedPressureBar: firstFiniteNumber(urlParams.get('press_bar'), filt.feedPressureBar, filt.pressureBar),
    cloggedPortsCount: firstFiniteNumber(filt.cloggedPortsCount),
    plateWidthMm: firstFiniteNumber(urlParams.get('plate_mm'), filt.plateWidthMm),
    plateThicknessMm: firstFiniteNumber(filt.plateThicknessMm),
    cakeMoistureTargetPct: firstFiniteNumber(urlParams.get('cake_pct'), filt.cakeMoistureTargetPct),
    cellVolumeKey: firstDefinedValue(urlParams.get('cell'), flot.cellVolumeKey, flot.cellDiaM),
    jgCmS: firstFiniteNumber(urlParams.get('jg'), flot.jgCmS),
    d32Mm: firstFiniteNumber(urlParams.get('d32'), flot.d32Mm),
    rotorRpm: firstFiniteNumber(urlParams.get('rpm'), flot.rotorRpm),
    underflowSg: firstFiniteNumber(urlParams.get('uf_sg'), cyc.underflowSg),
    overflowSg: firstFiniteNumber(urlParams.get('of_sg'), cyc.overflowSg),
    solidsSg: firstFiniteNumber(
      urlParams.get('solids_sg'),
      cyc.solidsSg,
      session.metrology?.oreSolidsSg,
      pc.oreSolidsSg,
      pc.specificGravity
    ),
    apexMm: firstFiniteNumber(urlParams.get('apex_mm'), cyc.apexMm),
    vortexMm: firstFiniteNumber(urlParams.get('vortex_mm'), cyc.vortexMm),
    feedPressureKpa: firstFiniteNumber(urlParams.get('press_kpa'), cyc.feedPressureKpa),
    apertureMm: firstFiniteNumber(urlParams.get('aperture_mm'), cyc.apertureMm),
    feedTopSizeUm: firstFiniteNumber(urlParams.get('feed_um'), cyc.feedTopSizeUm, cyc.d80Microns),
  };

  const resolvedSg = persistedFields.sg || Number(cyc.feedPulpSgKgL || cyc.feedSg || pump.slurrySg || 1.5) || 1.5;
  const resolvedD50Um = persistedFields.d50Um || Number(cyc.cutPointD50cUm || cyc.d50cMicrons || flot.particleSizeUm || pump.d80Microns || 120) || 120;
  const resolvedCw = persistedFields.cw || Number(pc.solidsPctCw || flot.solidsCwPct || 45) || 45;

  return {
    urlParams,
    wbV2: session.plantContext || {},
    engCtx,
    cachedRfq: outbox.lastPayload || {},
    hasPersistedState,
    persistedFields,
    sg: resolvedSg,
    d50Um: resolvedD50Um,
    cw: resolvedCw,
    flotation: flot,
    filtration: filt,
    classification: cyc,
    driveAndHybrid: pump,
    processControl: pc,
    storageKeys: {
      sessionStorageKey: RFQ_SESSION_STORAGE_KEY,
      engineeringContextKey: SMAT_ENGINEERING_CONTEXT_KEY,
    },
  };
}

/**
 * Enlaza de forma idempotente todos los botones `[data-add-tray-sku]`.
 *
 * @param {any} [root]
 * @returns {number} Cantidad de botones `[data-add-tray-sku]` enlazados
 */
export function bindAtomicPartTrayButtons(root = typeof document !== 'undefined' ? document : null) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  const buttons = Array.from(root.querySelectorAll('[data-add-tray-sku]'));
  let boundCount = 0;

  for (const btn of buttons) {
    if (btn.dataset && btn.dataset.trayBound === '1') continue;
    if (btn.dataset) btn.dataset.trayBound = '1';
    const originalLabel = (btn.textContent || '').trim();
    const isEn = typeof window !== 'undefined' && window.location && String(window.location.pathname || '').startsWith('/en/');

    if (typeof btn.addEventListener === 'function') {
      btn.addEventListener('click', (/** @type {any} */ ev) => {
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        const getAttr = (name, prop) => (typeof btn.getAttribute === 'function' ? btn.getAttribute(name) : null) || btn.dataset?.[prop] || '';
        const skuId = String(getAttr('data-add-tray-sku', 'addTraySku') || '').trim();
        if (!skuId) return;
        const partCode = String(getAttr('data-tray-part-code', 'trayPartCode') || '').trim();
        const title = String(getAttr('data-tray-title', 'trayTitle') || partCode || skuId).trim();
        const series = String(getAttr('data-tray-series', 'traySeries') || '').trim();
        const material = String(getAttr('data-tray-material', 'trayMaterial') || 'A05').trim();
        const circuit = String(getAttr('data-tray-circuit', 'trayCircuit') || 'bombeo').trim() || 'bombeo';
        const category = String(getAttr('data-tray-category', 'trayCategory') || 'BOMBA_SLURRY').trim();
        const source = String(getAttr('data-tray-source', 'traySource') || 'atomic_part_card').trim();

        addTrayItem({
          id: skuId,
          skuId,
          atomicCode: partCode || skuId,
          code: partCode || skuId,
          nameEs: title,
          nameEn: title,
          title,
          subtitle: series ? `${partCode || skuId} · Serie ${series}` : (partCode || skuId),
          circuit,
          category,
          partCode: partCode || skuId,
          material,
          series,
          qty: 1,
          source,
        });

        btn.textContent = isEn ? 'In Tray' : 'En Bandeja';
        if (typeof setTimeout === 'function') {
          setTimeout(() => {
            btn.textContent = originalLabel || (isEn ? '+ Tray' : '+ Bandeja');
          }, 1600);
        }
      });
    }
    boundCount += 1;
  }

  return boundCount;
}

const DEFAULT_CALCULATED_KIT_BY_VERTICAL = {
  bombeo: [
    { id: 'SMAT-PUMP-WETKIT-554', code: 'LOTE-554', titleEs: 'Lote Húmedo 5-5-4 Bomba Lodos AH', titleEn: '5-5-4 Slurry Pump Wet-End Lot', defaultMaterial: 'A05' },
    { id: 'SMAT-PUMP-BRG-005M', code: 'DAM005', titleEs: 'Cartucho de Rodamientos Bearing Assembly', titleEn: 'Bearing Assembly Cartridge 005M', defaultMaterial: 'SAE4140' },
  ],
  filtracion: [
    { id: 'SMAT-FILT-CLOTH-PLATE', code: 'PLACA-PP-16B', titleEs: 'Lonas y Placas de Polipropileno 16 bar', titleEn: '16-Bar Polypropylene Filter Plates & Cloths', defaultMaterial: 'PP' },
  ],
  flotacion: [
    { id: 'SMAT-FLOT-MECH-18SP', code: 'MECH-18SP', titleEs: 'Mecanismo Suspendido de Flotación #18 SP / #24 / #30', titleEn: 'Suspended Flotation Mechanism #18 SP / #24 / #30', defaultMaterial: 'U01' },
  ],
  clasificacion: [
    { id: 'SMAT-CYC-D6-D20', code: 'APEX-SIC', titleEs: 'Hidrociclón Completo y Boquillas Ápex SiC', titleEn: 'Hydrocyclone Assembly & SiC Apex Spigots', defaultMaterial: 'SiC' },
    { id: 'SMAT-SCR-TH48-30', code: 'TH48-30', titleEs: 'Mallas Finas de Uretano TH48-30', titleEn: 'TH48-30 Fine Urethane Screens', defaultMaterial: 'U01' },
  ],
  control: [
    { id: 'SMAT-LAB-MARCY-1000', code: 'MARCY-1000', titleEs: 'Balanza Marcy de Densidad de Pulpa', titleEn: 'Marcy Pulp Density Scale', defaultMaterial: 'SS304' },
    { id: 'SMAT-LAB-TAMIZ-E11', code: 'TAMIZ-E11', titleEs: 'Tamices Certificados ASTM E11', titleEn: 'ASTM E11 Certified Test Sieves', defaultMaterial: 'SS304' },
  ],
};

/**
 * Conecta botones `[data-add-calculated-kit]` en las 4 verticales y laboratorio para
 * agregar el kit o paquete dimensionado directamente a la Bandeja (`requisitionTrayBus`).
 *
 * @param {any} [root]
 * @param {'es'|'en'} [lang='es']
 * @returns {number}
 */
export function bindCalculatedKitToTrayButtons(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es'
) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  const buttons = Array.from(root.querySelectorAll('[data-add-calculated-kit]'));
  let count = 0;

  for (const btn of buttons) {
    if (btn.dataset && btn.dataset.kitTrayBound === '1') continue;
    if (btn.dataset) btn.dataset.kitTrayBound = '1';
    const originalText = (btn.textContent || '').trim();

    if (typeof btn.addEventListener === 'function') {
      btn.addEventListener('click', (/** @type {any} */ ev) => {
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        const verticalRaw = String(btn.getAttribute?.('data-add-calculated-kit') || 'bombeo').toLowerCase();
        const kitKey = verticalRaw === 'control_procesos' ? 'control' : verticalRaw;
        const isEn =
          lang === 'en' ||
          (typeof window !== 'undefined' && window.location && String(window.location.pathname || '').startsWith('/en/'));

        const matEl = root.querySelector?.('#trib-mat-select, #wb-material, [data-kit-material-select]');
        const activeMaterial = String(matEl?.value || '').trim();
        const seriesEl = root.querySelector?.('#wb-pipe-size, #pump-series-select, #filt-plate-width, [data-kit-series-select]');
        const activeSeries = String(seriesEl?.value || '').trim();

        let entries = DEFAULT_CALCULATED_KIT_BY_VERTICAL[kitKey] || DEFAULT_CALCULATED_KIT_BY_VERTICAL.bombeo;
        const customAttr = btn.getAttribute?.('data-kit-skus');
        if (customAttr) {
          try {
            const parsed = JSON.parse(customAttr);
            if (Array.isArray(parsed) && parsed.length > 0) entries = parsed;
          } catch {
            // fallback deterministic default kit
          }
        }

        for (const item of entries) {
          const title = isEn ? (item.titleEn || item.titleEs || item.id) : (item.titleEs || item.titleEn || item.id);
          addTrayItem({
            id: item.id,
            skuId: item.id,
            atomicCode: item.code || item.id,
            code: item.code || item.id,
            nameEs: item.titleEs || title,
            nameEn: item.titleEn || title,
            title,
            subtitle: activeSeries ? `${item.code || item.id} · ${activeSeries}` : (item.code || item.id),
            circuit: verticalRaw,
            category: 'CALCULATED_KIT',
            partCode: item.code || item.id,
            material: activeMaterial || item.defaultMaterial || 'A05',
            series: activeSeries,
            qty: 1,
            source: `vertical_calc_${kitKey}`,
          });
        }

        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
          window.dispatchEvent(new CustomEvent('smat:calculated-kit-added', { detail: { vertical: kitKey, items: entries.map((e) => e.id) } }));
        }

        btn.textContent = isEn ? 'Calculated Kit Added' : 'Kit Calculado Agregado';
        if (typeof setTimeout === 'function') {
          setTimeout(() => {
            btn.textContent = originalText;
          }, 1800);
        }
      });
    }
    count += 1;
  }

  return count;
}
