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
      patch.pulpPh = Number(p.slurryPh);
    }
    if (Number.isFinite(Number(p.slurrySg))) {
      patch.sg = Number(p.slurrySg);
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
 * @param {{ root?: any, queryPatch?: Record<string, any> }} [options]
 */
export function commitVerticalSimulation(vertical = 'bombeo', payload = {}, options = {}) {
  const mergedCtx = saveEngineeringContextSnapshot(vertical, payload);
  let wbNext = {};
  try {
    const prevWb = loadWorkbenchSession() || {};
    wbNext = projectVerticalPayloadToWorkbenchPatch(vertical, payload, prevWb);
    saveWorkbenchSession(wbNext);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SMAT_WORKBENCH_STATE_KEY, JSON.stringify(wbNext));
    }
  } catch (_) {
    // Entorno sin WebStorage
  }

  const ctaCount = options && options.root
    ? syncVerticalCtaLinks(options.root, vertical, options.queryPatch || payload)
    : 0;

  return {
    engineeringContext: mergedCtx,
    workbenchState: wbNext,
    syncedCtaCount: ctaCount,
  };
}

/**
 * Hidrata de forma unificada los tres silos de estado (`URLSearchParams` ⊕
 * `smat_workbench_state_v2` ⊕ `smat_engineering_context_v1` ⊕ `smat_last_rfq_payload`)
 * para garantizar cero pérdida de telemetría en `/acuse/` y `/cotizar/` (`D6-V45`).
 *
 * @param {string} [searchStr]
 */
export function loadUnifiedEngineeringAndWorkbenchState(searchStr = '') {
  const rawSearch = searchStr || (typeof window !== 'undefined' && window.location ? window.location.search : '');
  const urlParams = new URLSearchParams(rawSearch);

  let wbV2 = {};
  let engCtx = {};
  let cachedRfq = {};

  try {
    wbV2 = loadWorkbenchSession() || {};
  } catch (_) {}
  try {
    engCtx = loadEngineeringContextSnapshot() || {};
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const rawRfq = window.sessionStorage.getItem('smat_last_rfq_payload');
      if (rawRfq) cachedRfq = JSON.parse(rawRfq) || {};
    }
  } catch (_) {}

  const pc = engCtx.processControl || {};
  const cyc = engCtx.classification || {};
  const flot = engCtx.flotation || {};
  const filt = engCtx.filtration || {};
  const drive = engCtx.driveAndHybrid || {};

  const resolvedSg = Number(
    urlParams.get('sg')
      || urlParams.get('rho_f')
      || wbV2.sg
      || wbV2.solidsSg
      || pc.specificGravity
      || cyc.feedSg
      || drive.slurrySg
      || 1.5
  ) || 1.5;

  const resolvedD50Um = Number(
    urlParams.get('d80')
      || urlParams.get('p80')
      || urlParams.get('d50c')
      || wbV2.d80
      || wbV2.d50c
      || cyc.cutPointD50cUm
      || cyc.d50cMicrons
      || flot.particleSizeUm
      || drive.d80Microns
      || 120
  ) || 120;

  const resolvedCw = Number(
    urlParams.get('cw')
      || urlParams.get('solids')
      || wbV2.cw
      || wbV2.solidsPct
      || pc.solidsPctCw
      || flot.solidsCwPct
      || 45
  ) || 45;

  return {
    urlParams,
    wbV2,
    engCtx,
    cachedRfq,
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
 * `root` (tarjetas de `#fichas-atomicas` en `/catalogo/` y tarjetas de piezas atómicas en
 * `/bombeo/{sello,impulsor,revestimientos}/`) hacia `addTrayItem` del bus `smat_requisition_tray_v3`
 * (`D5-V46`, Dual-Channel B2B Fast-Lane, Jackson, Maxwell & Muckstadt 1985).
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
          circuit: 'bombeo',
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
