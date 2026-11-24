// @ts-check
/**
 * ephemeralTelemetryStore.js
 * ---------------------------------------------------------------------------
 * Almacenamiento exclusivamente efímero en `sessionStorage` para simulaciones
 * pasivas y calibraciones exploratorias (`ephemeralTelemetry ⊥ committedRfq`).
 * Prohibido leer o escribir en `localStorage` para evitar contaminar `/cotizar/`
 * o `/acuse/` cuando el usuario aún no ha comprometido partidas (`Tray = 0`).
 */

export const EPHEMERAL_TELEMETRY_KEY = 'smat_ephemeral_telemetry_v1';

const CIRCUIT_TO_CANONICAL_STATION = Object.freeze({
  bombeo: 'pumping',
  pumping: 'pumping',
  flotacion: 'flotation',
  flotation: 'flotation',
  filtracion: 'filtration',
  filtration: 'filtration',
  clasificacion: 'classification',
  classification: 'classification',
  cycloneScreen: 'classification',
  control_procesos: 'metrology',
  process_control: 'metrology',
  processControl: 'metrology',
  metrology: 'metrology',
});

/**
 * @returns {Storage | null}
 */
function getSessionStorageSafe() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage || null;
  } catch (_e) {
    return null;
  }
}

/**
 * @returns {{ version: number, userInteracted: boolean, activeCircuit: string, stationSnapshots: Record<string, any>, metrology: Record<string, any>, cyclone: Record<string, any>, flotation: Record<string, any> }}
 */
function createEmptyTelemetry() {
  return {
    version: 1,
    userInteracted: false,
    activeCircuit: '',
    stationSnapshots: {},
    metrology: {},
    cyclone: {},
    flotation: {},
  };
}

/**
 * Lee el estado efímero de simuladores desde `sessionStorage`.
 * @returns {{ version: number, userInteracted: boolean, activeCircuit: string, stationSnapshots: Record<string, any>, metrology: Record<string, any>, cyclone: Record<string, any>, flotation: Record<string, any> }}
 */
export function loadEphemeralStationTelemetry() {
  const ss = getSessionStorageSafe();
  if (!ss) return createEmptyTelemetry();
  try {
    const raw = ss.getItem(EPHEMERAL_TELEMETRY_KEY);
    if (!raw) return createEmptyTelemetry();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createEmptyTelemetry();
    return {
      version: 1,
      userInteracted: Boolean(parsed.userInteracted),
      activeCircuit: String(parsed.activeCircuit || ''),
      stationSnapshots: parsed.stationSnapshots && typeof parsed.stationSnapshots === 'object' ? { ...parsed.stationSnapshots } : {},
      metrology: parsed.metrology && typeof parsed.metrology === 'object' ? { ...parsed.metrology } : {},
      cyclone: parsed.cyclone && typeof parsed.cyclone === 'object' ? { ...parsed.cyclone } : {},
      flotation: parsed.flotation && typeof parsed.flotation === 'object' ? { ...parsed.flotation } : {},
    };
  } catch (_e) {
    return createEmptyTelemetry();
  }
}

/**
 * Registra telemetría pasiva en `sessionStorage` sin promover la sesión `committedRfq`.
 *
 * @param {string} [stationKey='pumping']
 * @param {Record<string, any>} [snapshot={}]
 * @param {{ userInteracted?: boolean, circuit?: string }} [opts={}]
 */
export function saveEphemeralStationTelemetry(stationKey = 'pumping', snapshot = {}, opts = {}) {
  const rawKey = String(stationKey || 'pumping').trim();
  const key = CIRCUIT_TO_CANONICAL_STATION[rawKey] || rawKey;
  const current = loadEphemeralStationTelemetry();
  const snapData = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const next = {
    ...current,
    userInteracted: Boolean(opts.userInteracted ?? current.userInteracted),
    activeCircuit: String(opts.circuit || current.activeCircuit || ''),
    stationSnapshots: {
      ...current.stationSnapshots,
      [key]: {
        ...(current.stationSnapshots[key] || {}),
        ...snapData,
        passive: true,
        updatedAtIso: new Date().toISOString(),
      },
    },
    metrology: { ...current.metrology },
    cyclone: { ...current.cyclone },
    flotation: { ...current.flotation },
  };

  if (key === 'metrology') {
    const oreSg = Number(snapData.oreSolidsSg ?? snapData.specificGravity ?? next.metrology.oreSolidsSg);
    if (Number.isFinite(oreSg) && oreSg > 0) next.metrology.oreSolidsSg = oreSg;
    if (snapData.solidsPctCw !== undefined) next.metrology.solidsPctCw = Number(snapData.solidsPctCw);
    if (snapData.pulpDensityKgL !== undefined) next.metrology.pulpDensityKgL = Number(snapData.pulpDensityKgL);
  } else if (key === 'classification') {
    const feedSg = Number(snapData.feedPulpSgKgL ?? snapData.feedSg ?? next.cyclone.feedPulpSgKgL);
    if (Number.isFinite(feedSg) && feedSg > 0) next.cyclone.feedPulpSgKgL = feedSg;
    if (snapData.d50cMicrons !== undefined) next.cyclone.d50cMicrons = Number(snapData.d50cMicrons);
  } else if (key === 'flotation') {
    const kMin = Number(snapData.rateConstantPerMin ?? snapData.rateConstantMin);
    if (Number.isFinite(kMin)) {
      next.flotation.rateConstantPerMin = kMin;
      next.flotation.rateConstantPerSec = Number((kMin / 60).toFixed(4));
    }
    if (snapData.sbInverseSeconds !== undefined) next.flotation.sbInverseSeconds = Number(snapData.sbInverseSeconds);
  }

  const ss = getSessionStorageSafe();
  if (ss) {
    try {
      ss.setItem(EPHEMERAL_TELEMETRY_KEY, JSON.stringify(next));
    } catch (_e) { }
  }
  return next;
}

/**
 * Limpia la telemetría efímera en `sessionStorage`.
 */
export function clearEphemeralStationTelemetry() {
  const ss = getSessionStorageSafe();
  if (ss) {
    try {
      ss.removeItem(EPHEMERAL_TELEMETRY_KEY);
    } catch (_e) { }
  }
  return createEmptyTelemetry();
}

/**
 * Indica si el usuario interactuó explícitamente con algún simulador en esta pestaña.
 * @returns {boolean}
 */
export function hasUserInteractedTelemetry() {
  return loadEphemeralStationTelemetry().userInteracted === true;
}
