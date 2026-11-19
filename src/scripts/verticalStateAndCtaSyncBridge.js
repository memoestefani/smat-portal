/**
 * verticalStateAndCtaSyncBridge.js
 * ---------------------------------------------------------------------------
 * Bus Isomórfico Libre de Glitches entre Calculadoras Verticales, Stores de
 * Sesión (`smat_engineering_context_v1` ⇄ `smat_workbench_state_v2`) y Enlaces
 * CTA Reactivos (`/cotizar/?...` y `/en/quote/?...`) (`D5-V45` / `D6-V45`,
 * Arbitraje Epistémico `[ARB-SMAT-53]`, LCOM4 = 1).
 *
 * Leyes Matemáticas:
 *   1. Propagación Reactiva Libre de Glitches Topológicos (Cooper & Krishnamurthi 2006):
 *      S --(e)--> (Store_1 ⊕ Store_2) --(π)--> DOM × URL_CTA
 *   2. Lentes Bidireccionales con Preservación de Complemento PutGet / PutPut
 *      (Foster et al. 2007; Barbosa et al. 2010).
 */

import {
  SMAT_ENGINEERING_CONTEXT_KEY,
  loadEngineeringContextSnapshot,
  mergeEngineeringContext,
  saveEngineeringContextSnapshot,
} from './wizardCircuitPhysicsController.js';
import {
  SMAT_WORKBENCH_STATE_KEY,
  loadWorkbenchSession,
  saveWorkbenchSession,
} from './workbenchBus.js';
import { addTrayItem } from './requisitionTrayBus.js';

/**
 * Mapea una instantánea parcial de una vertical hacia las llaves planas canónicas
 * de `smat_workbench_state_v2` sin destruir el complemento existente (`PutGet`).
 *
 * @param {string} vertical
 * @param {Record<string, any>} payload
 * @param {Record<string, any>} prevWb
 * @returns {Record<string, any>}
 */
export function projectVerticalPayloadToWorkbenchPatch(vertical = 'bombeo', payload = {}, prevWb = {}) {
  const slug = String(vertical || 'bombeo').trim().toLowerCase();
  const p = payload && typeof payload === 'object' ? payload : {};
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
    if (Number.isFinite(Number(p.d80Microns))) {
      patch.d80 = Number(p.d80Microns);
    }
    if (Number.isFinite(Number(p.impellerTipSpeedMs ?? p.tipSpeedMs))) {
      patch.tipSpeedU2Ms = Number(p.impellerTipSpeedMs ?? p.tipSpeedMs);
      patch.u2_ms = Number(p.impellerTipSpeedMs ?? p.tipSpeedMs);
    }
    if (Number.isFinite(Number(p.slurryPh))) {
      patch.ph = Number(p.slurryPh);
      patch.pulpPh = Number(p.slurryPh);
    }
    if (Number.isFinite(Number(p.slurrySg))) {
      patch.sg = Number(p.slurrySg);
    }
    if (Number.isFinite(Number(p.dischargeHeadM ?? p.hdM))) {
      patch.dischargeHeadM = Number(p.dischargeHeadM ?? p.hdM);
    }
    if (Number.isFinite(Number(p.suctionHeadM ?? p.hsM))) {
      patch.suctionHeadM = Number(p.suctionHeadM ?? p.hsM);
    }
    if (Number.isFinite(Number(p.expellerDiaMm))) {
      patch.expellerDiaMm = Number(p.expellerDiaMm);
    }
    if (Number.isFinite(Number(p.pumpRpm))) {
      patch.pumpRpm = Number(p.pumpRpm);
    }
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
    if (Number.isFinite(Number(p.impellerDiaMm))) {
      patch.impellerDiaMm = Number(p.impellerDiaMm);
    }
    if (p.pipeSeries || p.serie || p.pipeSize || p.pipe_size) {
      const ps = String(p.pipeSeries || p.serie || p.pipeSize || p.pipe_size);
      patch.pipe_size = ps;
      patch.pipeSize = ps;
      patch.serie = ps;
    }
    if (Number.isFinite(Number(p.frontClearanceMm ?? p.claro_mm))) {
      patch.frontClearanceMm = Number(p.frontClearanceMm ?? p.claro_mm);
      patch.claro_mm = Number(p.frontClearanceMm ?? p.claro_mm);
      patch.clearance_mm = Number(p.frontClearanceMm ?? p.claro_mm);
    }
    if (Number.isFinite(Number(p.bearingL10Hours))) {
      patch.l10hHours = Number(p.bearingL10Hours);
    }
    if (Number.isFinite(Number(p.dynamicCapacityCkN ?? p.recommendedDynamicCkN))) {
      patch.cap_c_kn = Number(p.dynamicCapacityCkN ?? p.recommendedDynamicCkN);
      patch.dynamicCapacityCkN = Number(p.dynamicCapacityCkN ?? p.recommendedDynamicCkN);
    }
    if (p.arrangement || p.arrangementCode) {
      patch.drive_arrangement = String(p.arrangement || p.arrangementCode);
      patch.driveArrangement = String(p.arrangement || p.arrangementCode);
    }
  } else if (slug === 'filtracion' || slug === 'filtration') {
    patch.filtration = {
      ...(prevWb.filtration || {}),
      ...p,
    };
    if (Number.isFinite(Number(p.feedPressureBar))) {
      patch.feedPressureBar = Number(p.feedPressureBar);
    }
    if (Number.isFinite(Number(p.plateWidthMm))) {
      patch.plateWidthMm = Number(p.plateWidthMm);
    }
    if (Number.isFinite(Number(p.cakeMoistureTargetPct))) {
      patch.cakeMoistureTargetPct = Number(p.cakeMoistureTargetPct);
    }
  } else if (slug === 'flotacion' || slug === 'flotation') {
    patch.flotation = {
      ...(prevWb.flotation || {}),
      ...p,
    };
    if (Number.isFinite(Number(p.particleSizeUm))) {
      patch.d80 = Number(p.particleSizeUm);
    }
    if (Number.isFinite(Number(p.solidsCwPct))) {
      patch.cw = Number(p.solidsCwPct);
      patch.solidsPct = Number(p.solidsCwPct);
    }
  } else if (slug === 'clasificacion' || slug === 'classification') {
    patch.cycloneCircuit = {
      ...(prevWb.cycloneCircuit || {}),
      ...p,
    };
    if (Number.isFinite(Number(p.d50cMicrons ?? p.cutPointD50cUm))) {
      patch.d50c = Number(p.d50cMicrons ?? p.cutPointD50cUm);
      patch.d80 = Number(p.d50cMicrons ?? p.cutPointD50cUm);
    }
    if (Number.isFinite(Number(p.feedSg))) {
      patch.sg = Number(p.feedSg);
    }
  } else if (slug === 'control_procesos' || slug === 'process_control') {
    if (Number.isFinite(Number(p.specificGravity))) {
      patch.sg = Number(p.specificGravity);
      patch.solidsSg = Number(p.specificGravity);
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
 * Reescribe en vivo todos los enlaces CTA hacia `/cotizar/` o `/en/quote/` dentro
 * del contenedor `root`, preservando los query params específicos de cada tarjeta
 * (`equipo`, `pieza`, `serie`, `estacion`, `flot_condition`, `filt_condition`) e
 * inyectando `circuito` y los parámetros físicos simulados (`D5-V45`).
 *
 * @param {any} root
 * @param {string} vertical
 * @param {Record<string, any>} queryPatch
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

    // Lente Pinned-Key Alignment (D2-V46, Barbosa et al. 2010; localthought/devonian):
    // 1. Llaves estructurales de ruta ('equipo', 'pieza', 'flot_condition', 'filt_condition') siempre se preservan si existen.
    // 2. Si el enlace declara data-card-fixed-params="material" o "seal_branch" (o tiene codigo= de ficha atómica),
    //    preserva sus llaves identidad fijas mientras inyecta la telemetría física simulada y actualiza 'serie'
    //    cuando 'serie' no está fijada por codigo= ni en data-card-fixed-params.
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
 * Ejecuta una transacción atómica libre de glitches topológicos:
 *   1. Fusiona monótonamente `payload` en `smat_engineering_context_v1`.
 *   2. Sincroniza en espejo los campos canónicos hacia `smat_workbench_state_v2`.
 *   3. Reescribe en vivo los enlaces CTA `/cotizar/` y `/en/quote/` del contenedor.
 *
 * @param {string} vertical
 * @param {Record<string, any>} payload
 * @param {{ root?: any, queryPatch?: Record<string, any>, skipStorageWrite?: boolean }} [options]
 */
export function commitVerticalSimulation(vertical = 'bombeo', payload = {}, options = {}) {
  const skipWrite = Boolean(options && options.skipStorageWrite);
  let mergedCtx = null;
  let wbNext = {};
  if (!skipWrite) {
    mergedCtx = saveEngineeringContextSnapshot(vertical, payload);
    try {
      const prevWb = loadWorkbenchSession() || {};
      wbNext = {
        ...projectVerticalPayloadToWorkbenchPatch(vertical, payload, prevWb),
        hasUserCalibration: true,
      };
      saveWorkbenchSession(wbNext);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SMAT_WORKBENCH_STATE_KEY, JSON.stringify(wbNext));
      }
    } catch (_) {
      // Entorno sin WebStorage
    }
  } else {
    mergedCtx = loadEngineeringContextSnapshot();
    try {
      wbNext = loadWorkbenchSession() || {};
    } catch (_) {}
  }

  const ctaCount = options && options.root
    ? syncVerticalCtaLinks(options.root, vertical, options.queryPatch || payload)
    : 0;

  return {
    engineeringContext: mergedCtx,
    workbenchState: wbNext,
    syncedCtaCount: ctaCount,
    skippedStorageWrite: skipWrite,
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

function firstDefinedValue(...candidates) {
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return undefined;
}

function firstFiniteNumber(...candidates) {
  for (const val of candidates) {
    if (val === undefined || val === null || val === '') continue;
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Hidrata de forma unificada los tres silos de estado (`URLSearchParams` ⊕
 * `smat_workbench_state_v2` ⊕ `smat_engineering_context_v1` ⊕ `smat_last_rfq_payload`)
 * para garantizar cero pérdida de telemetría en `/acuse/`, `/cotizar/` y las 11
 * calculadoras verticales (`GetPut` $\prec$ `PutGet`, `D6-V45`, `D2..D4-V48`).
 *
 * @param {string} [searchStr]
 */
export function loadUnifiedEngineeringAndWorkbenchState(searchStr = '') {
  const rawSearch = searchStr || (typeof window !== 'undefined' && window.location ? window.location.search : '');
  const urlParams = new URLSearchParams(rawSearch);

  let wbV2 = {};
  let rawWbObj = null;
  let engCtx = {};
  let rawEngObj = null;
  let cachedRfq = {};
  let storageAvailable = false;

  try {
    wbV2 = loadWorkbenchSession() || {};
  } catch (_) {}
  try {
    engCtx = loadEngineeringContextSnapshot() || {};
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      storageAvailable = true;
      const rawWbStr = window.localStorage.getItem(SMAT_WORKBENCH_STATE_KEY);
      if (rawWbStr) rawWbObj = JSON.parse(rawWbStr);
      const rawEngStr = window.sessionStorage?.getItem(SMAT_ENGINEERING_CONTEXT_KEY)
        || window.localStorage.getItem(SMAT_ENGINEERING_CONTEXT_KEY);
      if (rawEngStr) rawEngObj = JSON.parse(rawEngStr);
      const rawRfq = window.sessionStorage?.getItem('smat_last_rfq_payload');
      if (rawRfq) cachedRfq = JSON.parse(rawRfq) || {};
    }
  } catch (_) {
    storageAvailable = false;
  }

  const pc = engCtx.processControl || {};
  const cyc = engCtx.classification || {};
  const flot = engCtx.flotation || {};
  const filt = engCtx.filtration || {};
  const drive = engCtx.driveAndHybrid || {};

  const hasUrlParams = KNOWN_ENGINEERING_URL_PARAMS.some((k) => urlParams.has(k));
  const engWasPersisted = Boolean(rawEngObj)
    || (!storageAvailable && Boolean(engCtx.updatedAtIso && engCtx.updatedAtIso !== '2026-11-17T00:00:00Z'));
  const wbNonDefault = !storageAvailable && Boolean(
    wbV2.hasUserCalibration
      || (wbV2.sg !== undefined && Number(wbV2.sg) !== 1.45)
      || (wbV2.d80 !== undefined && Number(wbV2.d80) !== 280)
      || (wbV2.ph !== undefined && Number(wbV2.ph) !== 7)
      || (wbV2.solids !== undefined && Number(wbV2.solids) !== 45)
      || (wbV2.pipe_size && wbV2.pipe_size !== '6x4')
      || (wbV2.drive_arrangement && wbV2.drive_arrangement !== 'CV')
      || (wbV2.shaft_power_kw !== undefined && Number(wbV2.shaft_power_kw) !== 45)
  );
  const wbSrc = rawWbObj && typeof rawWbObj === 'object' ? rawWbObj : (wbNonDefault ? wbV2 : {});
  const driveSrc = rawEngObj?.driveAndHybrid || (engWasPersisted ? drive : {});
  const filtSrc = rawEngObj?.filtration || (engWasPersisted ? filt : {});
  const flotSrc = rawEngObj?.flotation || (engWasPersisted ? flot : {});
  const cycSrc = rawEngObj?.classification || (engWasPersisted ? cyc : {});
  const pcSrc = rawEngObj?.processControl || (engWasPersisted ? pc : {});

  const hasPersistedState = Boolean(
    hasUrlParams || rawWbObj || rawEngObj || engWasPersisted || wbNonDefault
  );

  const persistedFields = {
    sg: firstFiniteNumber(
      urlParams.get('sg'), urlParams.get('rho_f'),
      wbSrc.sg, wbSrc.solidsSg, pcSrc.specificGravity, cycSrc.feedSg, driveSrc.slurrySg
    ),
    d50Um: firstFiniteNumber(
      urlParams.get('d50c'), urlParams.get('d80'), urlParams.get('p80'),
      wbSrc.d50c, wbSrc.d80, cycSrc.cutPointD50cUm, cycSrc.d50cMicrons,
      flotSrc.particleSizeUm, driveSrc.d80Microns
    ),
    d80Um: firstFiniteNumber(
      urlParams.get('d80'), urlParams.get('p80'), urlParams.get('d50c'),
      wbSrc.d80, driveSrc.d80Microns, flotSrc.particleSizeUm, cycSrc.cutPointD50cUm
    ),
    cw: firstFiniteNumber(
      urlParams.get('cw'), urlParams.get('solids'),
      wbSrc.cw, wbSrc.solids, wbSrc.solidsPct, pcSrc.solidsPctCw, flotSrc.solidsCwPct
    ),
    pulpPh: firstFiniteNumber(
      urlParams.get('ph'),
      wbSrc.ph, wbSrc.pulpPh, driveSrc.slurryPh
    ),
    tipSpeedMs: firstFiniteNumber(
      urlParams.get('vtip'), urlParams.get('u2_ms'),
      wbSrc.tipSpeedU2Ms, wbSrc.u2_ms, driveSrc.impellerTipSpeedMs, driveSrc.tipSpeedMs
    ),
    pipeSeries: firstDefinedValue(
      urlParams.get('serie'),
      wbSrc.pipe_size, wbSrc.pipeSize, wbSrc.serie, driveSrc.pipeSeries
    ),
    materialKey: firstDefinedValue(
      urlParams.get('material'),
      wbSrc.pump_material, wbSrc.material, wbSrc.selectedMaterial,
      driveSrc.materialKey, driveSrc.effectiveBranch, driveSrc.wetEndMaterial
    ),
    sealBranch: firstDefinedValue(
      urlParams.get('seal_branch'),
      wbSrc.seal_branch, wbSrc.sealBranch, driveSrc.sealBranch
    ),
    dischargeHeadM: firstFiniteNumber(
      urlParams.get('hd_m'),
      wbSrc.dischargeHeadM, driveSrc.dischargeHeadM
    ),
    suctionHeadM: firstFiniteNumber(
      urlParams.get('hs_m'),
      wbSrc.suctionHeadM, driveSrc.suctionHeadM
    ),
    expellerDiaMm: firstFiniteNumber(
      urlParams.get('exp_dia'),
      wbSrc.expellerDiaMm, driveSrc.expellerDiaMm
    ),
    pumpRpm: firstFiniteNumber(
      urlParams.get('n2_rpm'),
      wbSrc.pumpRpm, driveSrc.pumpRpm
    ),
    arrangementCode: firstDefinedValue(
      urlParams.get('arr'), urlParams.get('transmision'),
      wbSrc.drive_arrangement, wbSrc.driveArrangement, driveSrc.arrangementCode, driveSrc.arrangement
    ),
    motorPowerKw: firstFiniteNumber(
      urlParams.get('power_kw'),
      wbSrc.shaft_power_kw, wbSrc.motorPowerKw, driveSrc.motorPowerKw, driveSrc.shaftPowerKw
    ),
    dynamicCapacityCkN: firstFiniteNumber(
      urlParams.get('cap_c'), urlParams.get('cap_c_kn'),
      wbSrc.cap_c_kn, wbSrc.dynamicCapacityCkN, driveSrc.dynamicCapacityCkN, driveSrc.recommendedDynamicCkN
    ),
    motorRpm: firstFiniteNumber(
      urlParams.get('motor_rpm'),
      wbSrc.motor_rpm, wbSrc.motorRpm, driveSrc.motorRpm
    ),
    driverPulleyMm: firstFiniteNumber(
      urlParams.get('dp_mot'),
      wbSrc.driver_pulley_mm, wbSrc.driverPulleyMm, driveSrc.driverPulleyMm
    ),
    drivenPulleyMm: firstFiniteNumber(
      urlParams.get('dp_bom'),
      wbSrc.driven_pulley_mm, wbSrc.drivenPulleyMm, driveSrc.drivenPulleyMm
    ),
    impellerDiaMm: firstFiniteNumber(
      urlParams.get('imp_dia'),
      wbSrc.impellerDiaMm, driveSrc.impellerDiaMm
    ),
    feedPressureBar: firstFiniteNumber(
      urlParams.get('press_bar'),
      wbSrc.feedPressureBar, filtSrc.feedPressureBar, filtSrc.pressureBar
    ),
    cloggedPortsCount: firstFiniteNumber(
      filtSrc.cloggedPortsCount, wbSrc.filtration?.cloggedPortsCount
    ),
    plateWidthMm: firstFiniteNumber(
      urlParams.get('plate_mm'),
      wbSrc.plateWidthMm, filtSrc.plateWidthMm
    ),
    plateThicknessMm: firstFiniteNumber(
      filtSrc.plateThicknessMm, wbSrc.filtration?.plateThicknessMm
    ),
    cakeMoistureTargetPct: firstFiniteNumber(
      urlParams.get('cake_pct'),
      wbSrc.cakeMoistureTargetPct, filtSrc.cakeMoistureTargetPct
    ),
    cellVolumeKey: firstDefinedValue(
      urlParams.get('cell'),
      flotSrc.cellVolumeKey, flotSrc.cellDiaM
    ),
    jgCmS: firstFiniteNumber(
      urlParams.get('jg'),
      flotSrc.jgCmS
    ),
    d32Mm: firstFiniteNumber(
      urlParams.get('d32'),
      flotSrc.d32Mm
    ),
    rotorRpm: firstFiniteNumber(
      urlParams.get('rpm'),
      flotSrc.rotorRpm
    ),
    underflowSg: firstFiniteNumber(
      urlParams.get('uf_sg'),
      cycSrc.underflowSg
    ),
    overflowSg: firstFiniteNumber(
      urlParams.get('of_sg'),
      cycSrc.overflowSg
    ),
    solidsSg: firstFiniteNumber(
      urlParams.get('solids_sg'),
      cycSrc.solidsSg
    ),
    apexMm: firstFiniteNumber(
      urlParams.get('apex_mm'),
      cycSrc.apexMm
    ),
    vortexMm: firstFiniteNumber(
      urlParams.get('vortex_mm'),
      cycSrc.vortexMm
    ),
    feedPressureKpa: firstFiniteNumber(
      urlParams.get('press_kpa'),
      cycSrc.feedPressureKpa
    ),
    apertureMm: firstFiniteNumber(
      urlParams.get('aperture_mm'),
      cycSrc.apertureMm
    ),
    feedTopSizeUm: firstFiniteNumber(
      urlParams.get('feed_um'),
      cycSrc.feedTopSizeUm, cycSrc.d80Microns
    ),
  };

  const resolvedSg = persistedFields.sg || Number(pc.specificGravity || cyc.feedSg || drive.slurrySg || 1.5) || 1.5;
  const resolvedD50Um = persistedFields.d50Um || Number(cyc.cutPointD50cUm || cyc.d50cMicrons || flot.particleSizeUm || drive.d80Microns || 120) || 120;
  const resolvedCw = persistedFields.cw || Number(pc.solidsPctCw || flot.solidsCwPct || 45) || 45;

  return {
    urlParams,
    wbV2,
    engCtx,
    cachedRfq,
    hasPersistedState,
    persistedFields,
    sg: resolvedSg,
    d50Um: resolvedD50Um,
    cw: resolvedCw,
    flotation: flot,
    filtration: filt,
    classification: cyc,
    driveAndHybrid: drive,
    processControl: pc,
    storageKeys: {
      engineeringContextKey: SMAT_ENGINEERING_CONTEXT_KEY,
      workbenchStateKey: SMAT_WORKBENCH_STATE_KEY,
    },
  };
}

/**
 * Enlaza de forma idempotente todos los botones `[data-add-tray-sku]` en el contenedor
 * `root` (tarjetas de `#fichas-atomicas` en `/catalogo/`, sub-rutas verticales multi-circuito
 * y estaciones de diagnóstico/laboratorio) hacia `addTrayItem` del bus `smat_requisition_tray_v3`
 * (`D5-V46`, `D5-V48`, Dual-Channel B2B Fast-Lane, Jackson, Maxwell & Muckstadt 1985).
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
    if (btn.dataset) {
      btn.dataset.trayBound = '1';
    }
    const originalLabel = (btn.textContent || '').trim();
    const isEn = typeof window !== 'undefined' && window.location && String(window.location.pathname || '').startsWith('/en/');

    if (typeof btn.addEventListener === 'function') {
      btn.addEventListener('click', (ev) => {
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

        btn.textContent = isEn ? '✓ In Tray' : '✓ En Bandeja';
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
