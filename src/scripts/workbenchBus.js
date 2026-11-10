import atomicPartsJson from '../../data/atomic_parts.json' with { type: 'json' };
import miningGroupsJson from '../../data/mining_groups.json' with { type: 'json' };
import { WET_END_MATERIAL_MATRIX } from './tribologyAndCompatibilityEngine.js';
import { DEFAULT_SMAT_LEAD_WEBHOOK_URL, ATOMIC_PARTS_CATALOG, resolveAtomicPartCode, getAtomicPartSpecs, formatNioshErgonomicStatus, parseUrlContextParams, generateSmatPartCode, formatSapTsv, parseSmatPartCode , formatSapPlaintextImpl, formatMailtoUrlImpl, formatWhatsappUrlImpl, buildCanonicalEngineeringSnapshotImpl, buildAcuseUrlParams, resolveInternalBudgetCategory, buildLeadWebhookPayload, dispatchLeadWebhook } from './districtProfilesAndSkuCatalog.js';
export const ATOMIC_PARTS_SSOT_COUNT = Array.isArray(atomicPartsJson) ? atomicPartsJson.length : 13;
export * from './districtProfilesAndSkuCatalog.js';
export const SMAT_WORKBENCH_EVENT = 'smat:workbench_update';
const DISTRICT_CALIBRATION_PROFILES = {
  'fresnillo-plc': { altitudeM: 2250, solidsSg: 3.1, solidsCw: 52, d80Microns: 210, pulpPh: 7.8, flowM3h: 220, recommendedPipeSize: '6x4' },
  'penoles': { altitudeM: 2350, solidsSg: 3.2, solidsCw: 54, d80Microns: 240, pulpPh: 7.5, flowM3h: 240, recommendedPipeSize: '6x4' },
  'first-majestic': { altitudeM: 2100, solidsSg: 2.7, solidsCw: 44, d80Microns: 140, pulpPh: 10.5, flowM3h: 160, recommendedPipeSize: '4x3' },
  'pan-american-silver': { altitudeM: 2450, solidsSg: 3.0, solidsCw: 50, d80Microns: 195, pulpPh: 8.0, flowM3h: 190, recommendedPipeSize: '6x4' },
  'grupo-mexico': { altitudeM: 1650, solidsSg: 2.8, solidsCw: 55, d80Microns: 260, pulpPh: 8.2, flowM3h: 450, recommendedPipeSize: '8x6' },
  'endeavour-silver': { altitudeM: 2400, solidsSg: 2.8, solidsCw: 48, d80Microns: 165, pulpPh: 9.2, flowM3h: 150, recommendedPipeSize: '4x3' },
  'minera-frisco': { altitudeM: 2150, solidsSg: 3.0, solidsCw: 50, d80Microns: 220, pulpPh: 7.6, flowM3h: 210, recommendedPipeSize: '6x4' }
};
export function resolveMiningDistrictPreset(query = '') {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const qTokens = q
    .replace(/[()/,-]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 4 && !['unidad', 'mina', 'minera', 'planta', 'grupo'].includes(tok));
  const groups = Array.isArray(miningGroupsJson?.groups) ? miningGroupsJson.groups : [];
  for (const grp of groups) {
    const grpNameLower = String(grp.name || '').toLowerCase();
    const grpMatch = String(grp.id || '').toLowerCase() === q || grpNameLower.includes(q);
    const units = Array.isArray(grp.units) ? grp.units : [];
    const matchedUnit = units.find((u) => {
      const uLower = String(u.name || '').toLowerCase();
      if (uLower.includes(q) || q.includes(uLower)) return true;
      return qTokens.some((tok) => uLower.includes(tok));
    });
    if (grpMatch || matchedUnit) {
      const unitObj = matchedUnit || units[0] || { name: grp.name, pulp_profile: 'Bombeo de pulpa mineral en planta concentradora' };
      const baseCal = DISTRICT_CALIBRATION_PROFILES[grp.id] || { altitudeM: 2200, solidsSg: 2.8, solidsCw: 48, d80Microns: 180, pulpPh: 7.5, flowM3h: 180, recommendedPipeSize: '6x4' };
      const profLower = String(unitObj.pulp_profile || '').toLowerCase();
      let defaultCircuit = 'bombeo';
      if (profLower.includes('flotación') || profLower.includes('flotacion')) defaultCircuit = 'flotacion';
      else if (profLower.includes('filtración') || profLower.includes('filtracion') || profLower.includes('jales')) defaultCircuit = 'filtracion';
      return { matched: true, groupId: grp.id, groupName: grp.name, unitName: unitObj.name, mineName: unitObj.name, pulpProfileEs: unitObj.pulp_profile, pulpProfile: unitObj.pulp_profile, defaultCircuit, altitudeMsnm: baseCal.altitudeM, solidsPct: baseCal.solidsCw, ...baseCal };
    }
  }
  return null;
}
export function publishWorkbenchUpdate(detail) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(SMAT_WORKBENCH_EVENT, {
      detail,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }
}
export function subscribeWorkbenchUpdate(callback) {
  if (typeof window === 'undefined') return () => { };
  const handler = (event) => callback(event.detail);
  window.addEventListener(SMAT_WORKBENCH_EVENT, handler);
  return () => window.removeEventListener(SMAT_WORKBENCH_EVENT, handler);
}
export function formatSapPlaintext(data = {}) { return formatSapPlaintextImpl(data); }
export function formatMailtoUrl(data = {}) { return formatMailtoUrlImpl(data); }
export function formatWhatsappUrl(data = {}) { return formatWhatsappUrlImpl(data); }
export function buildCanonicalEngineeringSnapshot(d = {}) { return buildCanonicalEngineeringSnapshotImpl(d); }
const SMAT_SESSION_KEY = 'smat_workbench_session';
export const SMAT_WORKBENCH_STATE_KEY = 'smat_workbench_state_v2';
export const DEFAULT_WORKBENCH_STATE_V2 = Object.freeze({ version: 2, circuit: 'bombeo', role: 'kit_wet_end', pipe_size: '6x4', stress_symptom: '', flot_role: 'rotor_estator', flot_capacity: '100ft', flot_condition: '', filt_role: 'placas_telas', filt_capacity: '1500', filt_condition: '', ctrl_role: 'balanza_marcy', ctrl_spec: 'marcy_12_rings', flow: 180, solids: 45, d80: 180, sg: 2.7, ph: 7.0, altitude: 2400, downtime: 4, tcoAlloy: 'A05', isOpex: true, pump_material: 'alto_cromo_cr27', drive_arrangement: 'CV', seal_branch: 'expeller_dry', b2_mm: 48, cap_c_kn: 145, claro_mm: 0.75, driver_pulley_mm: 220, driven_pulley_mm: 340, motor_rpm: 1775, shaft_power_kw: 55, sequence_preset: 'canonical', rhop: 1.402, lib_um: 100, grade: 0.05, rr_n: 1.08, d95: 0.21, p80: 150, gy_kg: 0.25, name: '', company: '', phone: '', email: '', destination: 'Retiro en Almacén Central Durango (Coordinación con Folio)', details: '', clientRef: '', dim_outer_dia: '', dim_shaft_bore: '', pulpPh: 7.0, sealBranch: 'expeller_dry', impellerExitWidthMm: 48, dynamicCapacityCkN: 145, oreDensitySg: 1.402, cycloneCircuit: Object.freeze({ feedSg: 1.35, underflowSg: 1.82, overflowSg: 1.15, apexMm: 50, vortexMm: 100, d50cMicrons: 74, solidsRecoveryPct: 84.2, ropingRisk: false }) });
export function normalizeMaterialKey(raw = '') {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'alto_cromo_cr27';
  if (s === 'ceramica_sic' || s === 'sic' || s === 'ceramic' || s.includes('ceramica') || s.includes('carburo')) {
    return 'ceramica_sic';
  }
  if (s === 'hule_natural' || s === 'hule' || s === 'rubber' || s === 'r55' || s.includes('caucho') || s.includes('hule')) {
    return 'hule_natural';
  }
  if (s === 'poliuretano' || s === 'polyurethane' || s === 'pu' || s === 'u01' || s.includes('poliuretano')) {
    return 'poliuretano';
  }
  return 'alto_cromo_cr27';
}
export function normalizeCircuitSerie(circuit = 'bombeo', rawSerie = '') {
  const c = String(circuit || 'bombeo').trim().toLowerCase();
  const v = String(rawSerie || '').trim().toLowerCase();
  if (c === 'flotacion') {
    if (v.includes('50')) return { targetField: 'flot_capacity', value: '50ft' };
    if (v.includes('200')) return { targetField: 'flot_capacity', value: '200ft' };
    if (v.includes('300')) return { targetField: 'flot_capacity', value: '300ft' };
    return { targetField: 'flot_capacity', value: '100ft' };
  }
  if (c === 'filtracion') {
    if (v.includes('800')) return { targetField: 'filt_capacity', value: '800' };
    if (v.includes('1200')) return { targetField: 'filt_capacity', value: '1200' };
    if (v.includes('2000')) return { targetField: 'filt_capacity', value: '2000' };
    return { targetField: 'filt_capacity', value: '1500' };
  }
  if (c === 'control_procesos' || c === 'control') {
    if (v.includes('batch') || v.includes('100psi')) return { targetField: 'ctrl_spec', value: 'batch_100psi' };
    if (v.includes('astm') || v.includes('tamiz') || v.includes('sieve') || v.includes('8in')) return { targetField: 'ctrl_spec', value: 'astm_8in_inox' };
    return { targetField: 'ctrl_spec', value: 'marcy_12_rings' };
  }
  let pipe = v || '6x4';
  if (pipe.includes('d') && !pipe.includes('1')) {
    pipe = pipe.replace(/d$/i, '');
  }
  const validPipes = ['1.5x1', '2x1.5', '3x2', '4x3', '6x4', '8x6', '10x8', '12x10', '14x12'];
  const matched = validPipes.find((p) => pipe === p || pipe.includes(p)) || '6x4';
  return { targetField: 'pipe_size', value: matched };
}
export function normalizeWorkbenchStateV2(partial = {}) {
  const src = partial && typeof partial === 'object' ? partial : {};
  const kin = src.kinematics && typeof src.kinematics === 'object' ? src.kinematics : {};
  const met = src.metrology && typeof src.metrology === 'object' ? src.metrology : {};
  const ce = src.clearance_eval && typeof src.clearance_eval === 'object' ? src.clearance_eval : {};
  const resolvedPumpMat = normalizeMaterialKey(
    src.pump_material || src.wet_material || src.material || src.wetEndMaterial || DEFAULT_WORKBENCH_STATE_V2.pump_material
  );
  let resolvedPipe = String(src.pipe_size || src.pipeSize || src.serie || DEFAULT_WORKBENCH_STATE_V2.pipe_size).toLowerCase();
  if (resolvedPipe.includes('d') && !resolvedPipe.includes('1')) {
    resolvedPipe = resolvedPipe.replace(/d$/i, '');
  }
  let cleanDetails = String(src.details ?? DEFAULT_WORKBENCH_STATE_V2.details);
  if (cleanDetails.includes('6X4D') || cleanDetails.includes('A49')) {
    cleanDetails = '';
  }
  const normalized = {
    ...DEFAULT_WORKBENCH_STATE_V2,
    ...src,
    version: 2,
    circuit: String(src.circuit || src.circuito || DEFAULT_WORKBENCH_STATE_V2.circuit),
    role: String(src.role || src.role_id || src.equipo || DEFAULT_WORKBENCH_STATE_V2.role),
    pipe_size: resolvedPipe || '6x4',
    pipeSize: resolvedPipe || '6x4',
    flow: Number(src.flow ?? src.flowM3H ?? DEFAULT_WORKBENCH_STATE_V2.flow) || DEFAULT_WORKBENCH_STATE_V2.flow,
    solids: Number(src.solids ?? src.cw ?? src.solidsWeightPercent ?? met.cw ?? DEFAULT_WORKBENCH_STATE_V2.solids) || DEFAULT_WORKBENCH_STATE_V2.solids,
    d80: Number(src.d80 ?? src.particleSizeD80Microns ?? DEFAULT_WORKBENCH_STATE_V2.d80) || DEFAULT_WORKBENCH_STATE_V2.d80,
    sg: Number(src.sg ?? src.solidsSpecificGravity ?? met.specificGravity ?? DEFAULT_WORKBENCH_STATE_V2.sg) || DEFAULT_WORKBENCH_STATE_V2.sg,
    ph: Number(src.ph ?? src.pulpPh ?? DEFAULT_WORKBENCH_STATE_V2.ph),
    altitude: Number(src.altitude ?? src.altitudeM ?? DEFAULT_WORKBENCH_STATE_V2.altitude),
    downtime: Number(src.downtime ?? DEFAULT_WORKBENCH_STATE_V2.downtime) || DEFAULT_WORKBENCH_STATE_V2.downtime,
    tcoAlloy: String(src.tcoAlloy || DEFAULT_WORKBENCH_STATE_V2.tcoAlloy),
    isOpex: src.isOpex !== undefined ? Boolean(src.isOpex) : DEFAULT_WORKBENCH_STATE_V2.isOpex,
    pump_material: resolvedPumpMat,
    drive_arrangement: String(src.drive_arrangement || src.transmision || kin.arrangement || DEFAULT_WORKBENCH_STATE_V2.drive_arrangement).toUpperCase(),
    seal_branch: String(src.seal_branch || src.sealBranch || ce.sealBranch || DEFAULT_WORKBENCH_STATE_V2.seal_branch),
    b2_mm: Number(src.b2_mm ?? src.impellerExitWidthMm ?? ce.impellerExitWidthMm ?? DEFAULT_WORKBENCH_STATE_V2.b2_mm) || DEFAULT_WORKBENCH_STATE_V2.b2_mm,
    cap_c_kn: Number(src.cap_c_kn ?? src.dynamicCapacityCkN ?? kin.dynamicCapacityCkN ?? DEFAULT_WORKBENCH_STATE_V2.cap_c_kn) || DEFAULT_WORKBENCH_STATE_V2.cap_c_kn,
    claro_mm: Number(src.claro_mm ?? src.clearance_mm ?? src.frontClearanceMm ?? ce.frontClearanceMm ?? DEFAULT_WORKBENCH_STATE_V2.claro_mm),
    driver_pulley_mm: Number(src.driver_pulley_mm ?? kin.driverPulleyMm ?? DEFAULT_WORKBENCH_STATE_V2.driver_pulley_mm) || DEFAULT_WORKBENCH_STATE_V2.driver_pulley_mm,
    driven_pulley_mm: Number(src.driven_pulley_mm ?? kin.drivenPulleyMm ?? DEFAULT_WORKBENCH_STATE_V2.driven_pulley_mm) || DEFAULT_WORKBENCH_STATE_V2.driven_pulley_mm,
    motor_rpm: Number(src.motor_rpm ?? kin.motorRpm ?? DEFAULT_WORKBENCH_STATE_V2.motor_rpm) || DEFAULT_WORKBENCH_STATE_V2.motor_rpm,
    shaft_power_kw: Number(src.shaft_power_kw ?? kin.shaftPowerKw ?? DEFAULT_WORKBENCH_STATE_V2.shaft_power_kw) || DEFAULT_WORKBENCH_STATE_V2.shaft_power_kw,
    sequence_preset: String(src.sequence_preset || src.assemblySequencePreset || DEFAULT_WORKBENCH_STATE_V2.sequence_preset),
    rhop: Number(src.rhop ?? src.oreDensitySg ?? met.sm ?? met.pulpDensityKgL ?? DEFAULT_WORKBENCH_STATE_V2.rhop) || DEFAULT_WORKBENCH_STATE_V2.rhop,
    lib_um: Number(src.lib_um ?? met.liberationSizeMicrons ?? DEFAULT_WORKBENCH_STATE_V2.lib_um) || DEFAULT_WORKBENCH_STATE_V2.lib_um,
    grade: Number(src.grade ?? met.oreGradeDecimal ?? DEFAULT_WORKBENCH_STATE_V2.grade) || DEFAULT_WORKBENCH_STATE_V2.grade,
    rr_n: Number(src.rr_n ?? met.rosinRammlerSlopeN ?? DEFAULT_WORKBENCH_STATE_V2.rr_n) || DEFAULT_WORKBENCH_STATE_V2.rr_n,
    d95: Number(src.d95 ?? met.topSizeD95Mm ?? DEFAULT_WORKBENCH_STATE_V2.d95) || DEFAULT_WORKBENCH_STATE_V2.d95,
    p80: Number(src.p80 ?? met.targetP80Microns ?? DEFAULT_WORKBENCH_STATE_V2.p80) || DEFAULT_WORKBENCH_STATE_V2.p80,
    gy_kg: Number(src.gy_kg ?? met.dryMassKg ?? met.gySampleMassKg ?? DEFAULT_WORKBENCH_STATE_V2.gy_kg) || DEFAULT_WORKBENCH_STATE_V2.gy_kg,
    details: cleanDetails
  };
  if (Number.isNaN(normalized.ph) || normalized.ph <= 0) normalized.ph = 7.0;
  if (Number.isNaN(normalized.altitude) || normalized.altitude < 0) normalized.altitude = 2400;
  if (Number.isNaN(normalized.claro_mm) || normalized.claro_mm <= 0) normalized.claro_mm = 0.75;
  normalized.material = resolvedPumpMat;
  normalized.clearance_mm = normalized.claro_mm;
  normalized.frontClearanceMm = normalized.claro_mm;
  normalized.pulpPh = normalized.ph;
  normalized.sealBranch = normalized.seal_branch;
  normalized.impellerExitWidthMm = normalized.b2_mm;
  normalized.dynamicCapacityCkN = normalized.cap_c_kn;
  normalized.oreDensitySg = normalized.rhop;
  const rawCyc = (src.cycloneCircuit && typeof src.cycloneCircuit === 'object')
    ? src.cycloneCircuit
    : (met.cycloneCircuit && typeof met.cycloneCircuit === 'object' ? met.cycloneCircuit : {});
  normalized.cycloneCircuit = { feedSg: Number(rawCyc.feedSg ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.feedSg) || 1.35, underflowSg: Number(rawCyc.underflowSg ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.underflowSg) || 1.82, overflowSg: Number(rawCyc.overflowSg ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.overflowSg) || 1.15, apexMm: Number(rawCyc.apexMm ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.apexMm) || 50, vortexMm: Number(rawCyc.vortexMm ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.vortexMm) || 100, d50cMicrons: Number(rawCyc.d50cMicrons ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.d50cMicrons) || 74, solidsRecoveryPct: Number(rawCyc.solidsRecoveryPct ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.solidsRecoveryPct) || 84.2, ropingRisk: Boolean(rawCyc.ropingRisk ?? DEFAULT_WORKBENCH_STATE_V2.cycloneCircuit.ropingRisk) };
  return normalized;
}
export const workbenchStateLens = Object.freeze({
  get(state) {
    return normalizeWorkbenchStateV2(state);
  },
  put(state, viewPatch = {}) {
    const base = normalizeWorkbenchStateV2(state);
    if (!viewPatch || typeof viewPatch !== 'object') return base;
    const mappedPatch = { ...viewPatch };
    if (mappedPatch.pipeSize !== undefined && mappedPatch.pipe_size === undefined) mappedPatch.pipe_size = mappedPatch.pipeSize;
    if (mappedPatch.pulpPh !== undefined && mappedPatch.ph === undefined) mappedPatch.ph = mappedPatch.pulpPh;
    if (mappedPatch.sealBranch !== undefined && mappedPatch.seal_branch === undefined) mappedPatch.seal_branch = mappedPatch.sealBranch;
    if (mappedPatch.impellerExitWidthMm !== undefined && mappedPatch.b2_mm === undefined) mappedPatch.b2_mm = mappedPatch.impellerExitWidthMm;
    if (mappedPatch.dynamicCapacityCkN !== undefined && mappedPatch.cap_c_kn === undefined) mappedPatch.cap_c_kn = mappedPatch.dynamicCapacityCkN;
    if (mappedPatch.oreDensitySg !== undefined && mappedPatch.rhop === undefined) mappedPatch.rhop = mappedPatch.oreDensitySg;
    if (mappedPatch.claro_mm !== undefined) {
      mappedPatch.clearance_mm = Number(mappedPatch.claro_mm);
      mappedPatch.frontClearanceMm = Number(mappedPatch.claro_mm);
    } else if (mappedPatch.clearance_mm !== undefined) {
      mappedPatch.claro_mm = Number(mappedPatch.clearance_mm);
      mappedPatch.frontClearanceMm = Number(mappedPatch.clearance_mm);
    } else if (mappedPatch.frontClearanceMm !== undefined) {
      mappedPatch.claro_mm = Number(mappedPatch.frontClearanceMm);
      mappedPatch.clearance_mm = Number(mappedPatch.frontClearanceMm);
    }
    const incomingMatRaw = mappedPatch.pump_material || mappedPatch.wet_material || mappedPatch.material || mappedPatch.wetEndMaterial;
    if (incomingMatRaw !== undefined) {
      const normalizedIncomingMat = normalizeMaterialKey(incomingMatRaw);
      mappedPatch.pump_material = normalizedIncomingMat;
      mappedPatch.material = normalizedIncomingMat;
      if (mappedPatch.claro_mm === undefined && mappedPatch.frontClearanceMm === undefined) {
        const prevMatSpec = WET_END_MATERIAL_MATRIX[base.pump_material] || WET_END_MATERIAL_MATRIX.alto_cromo_cr27;
        const nextMatSpec = WET_END_MATERIAL_MATRIX[normalizedIncomingMat] || WET_END_MATERIAL_MATRIX.alto_cromo_cr27;
        if (Math.abs(Number(base.claro_mm) - Number(prevMatSpec.optimalFrontClearanceMm)) < 0.05) {
          mappedPatch.claro_mm = Number(nextMatSpec.optimalFrontClearanceMm);
        }
      }
    }
    if (mappedPatch.circuito !== undefined && mappedPatch.circuit === undefined) mappedPatch.circuit = mappedPatch.circuito;
    if (mappedPatch.equipo !== undefined && mappedPatch.role === undefined) mappedPatch.role = mappedPatch.equipo;
    if (mappedPatch.serie !== undefined && mappedPatch.pipe_size === undefined) mappedPatch.pipe_size = mappedPatch.serie;
    if (mappedPatch.transmision !== undefined && mappedPatch.drive_arrangement === undefined) mappedPatch.drive_arrangement = mappedPatch.transmision;
    return normalizeWorkbenchStateV2({ ...base, ...mappedPatch });
  },
  toSearchParams(state = {}) {
    const s = normalizeWorkbenchStateV2(state);
    return new URLSearchParams({ circuito: String(s.circuit), equipo: String(s.role), serie: String(s.pipe_size), flow: String(s.flow), cw: String(s.solids), d80: String(s.d80), sg: String(s.sg), ph: String(s.ph), material: String(s.pump_material), transmision: String(s.drive_arrangement), seal_branch: String(s.seal_branch), b2_mm: String(s.b2_mm), cap_c_kn: String(s.cap_c_kn), driver_mm: String(s.driver_pulley_mm), driven_mm: String(s.driven_pulley_mm), motor_rpm: String(s.motor_rpm), power_kw: String(s.shaft_power_kw), claro_mm: String(s.claro_mm), rhop: String(s.rhop), lib_um: String(s.lib_um), grade: String(s.grade), rr_n: String(s.rr_n), p80: String(s.p80), d95: String(s.d95), gy_kg: String(s.gy_kg) });
  },
  fromSearchParams(searchOrParams = '', baseState = {}) {
    const rawStr = typeof searchOrParams === 'string'
      ? searchOrParams
      : (searchOrParams && typeof searchOrParams.toString === 'function' ? searchOrParams.toString() : '');
    const ctx = parseUrlContextParams(rawStr);
    const patch = {};
    if (ctx.circuito) patch.circuit = ctx.circuito;
    if (ctx.equipo) patch.role = ctx.equipo;
    if (ctx.serie) {
      patch.pipe_size = ctx.serie;
      patch.pipeSize = ctx.serie;
    }
    if (ctx.flow !== null) patch.flow = Number(ctx.flow);
    if (ctx.cw !== null || ctx.solids !== null) patch.solids = Number(ctx.cw ?? ctx.solids);
    if (ctx.d80 !== null) patch.d80 = Number(ctx.d80);
    if (ctx.sg !== null) patch.sg = Number(ctx.sg);
    if (ctx.ph !== null) patch.ph = Number(ctx.ph);
    if (ctx.material) patch.pump_material = ctx.material;
    if (ctx.transmision) patch.drive_arrangement = ctx.transmision;
    if (ctx.seal_branch) patch.seal_branch = ctx.seal_branch;
    if (ctx.b2_mm !== null) patch.b2_mm = Number(ctx.b2_mm);
    if (ctx.cap_c_kn !== null) patch.cap_c_kn = Number(ctx.cap_c_kn);
    if (ctx.driver_mm !== null) patch.driver_pulley_mm = Number(ctx.driver_mm);
    if (ctx.driven_mm !== null) patch.driven_pulley_mm = Number(ctx.driven_mm);
    if (ctx.motor_rpm !== null) patch.motor_rpm = Number(ctx.motor_rpm);
    if (ctx.power_kw !== null) patch.shaft_power_kw = Number(ctx.power_kw);
    if (ctx.claro_mm !== null) patch.claro_mm = Number(ctx.claro_mm);
    if (ctx.rhop !== null) patch.rhop = Number(ctx.rhop);
    if (ctx.lib_um !== null) patch.lib_um = Number(ctx.lib_um);
    if (ctx.grade !== null) patch.grade = Number(ctx.grade);
    if (ctx.rr_n !== null) patch.rr_n = Number(ctx.rr_n);
    if (ctx.p80 !== null) patch.p80 = Number(ctx.p80);
    if (ctx.d95 !== null) patch.d95 = Number(ctx.d95);
    if (ctx.gy_kg !== null) patch.gy_kg = Number(ctx.gy_kg);
    return this.put(baseState, patch);
  },
  migrateLegacyStorage() {
    if (typeof window === 'undefined') return normalizeWorkbenchStateV2({});
    let merged = {};
    try {
      if (window.localStorage) {
        window.localStorage.removeItem('smat_workbench_draft');
        window.localStorage.removeItem('smat_workbench_v1');
        const rawLegacyV2 = window.localStorage.getItem('smat_workbench_v2');
        if (rawLegacyV2) {
          try {
            const parsedLegacyV2 = JSON.parse(rawLegacyV2);
            if (parsedLegacyV2 && typeof parsedLegacyV2 === 'object') {
              merged = { ...merged, ...parsedLegacyV2 };
            }
          } catch (_err) { }
          window.localStorage.removeItem('smat_workbench_v2');
        }
        const rawV2 = window.localStorage.getItem(SMAT_WORKBENCH_STATE_KEY);
        if (rawV2) merged = { ...merged, ...JSON.parse(rawV2) };
      }
      if (window.sessionStorage) {
        const rawSess = window.sessionStorage.getItem(SMAT_SESSION_KEY);
        if (rawSess) {
          if (rawSess.includes('6X4D') || rawSess.includes('A49')) {
            window.sessionStorage.removeItem(SMAT_SESSION_KEY);
          } else {
            merged = { ...merged, ...JSON.parse(rawSess) };
          }
        }
        const rawCat = window.sessionStorage.getItem('smat_catalog_selected');
        if (rawCat) {
          const parsedCat = JSON.parse(rawCat);
          if (parsedCat && parsedCat.serie) merged.pipe_size = parsedCat.serie;
          window.sessionStorage.removeItem('smat_catalog_selected');
        }
      }
    } catch (_e) { }
    const canonical = normalizeWorkbenchStateV2(merged);
    saveWorkbenchSession(canonical);
    return canonical;
  }
});
export function saveWorkbenchSession(state = {}) {
  if (typeof window === 'undefined') return null;
  try {
    const existing = loadWorkbenchSession() || {};
    const mergedRaw = { ...existing, ...state };
    const canonical = normalizeWorkbenchStateV2(mergedRaw);
    const serialized = JSON.stringify(canonical);
    if (window.sessionStorage) {
      window.sessionStorage.setItem(SMAT_SESSION_KEY, serialized);
      window.sessionStorage.setItem(SMAT_WORKBENCH_STATE_KEY, serialized);
    }
    if (window.localStorage) {
      window.localStorage.setItem(SMAT_WORKBENCH_STATE_KEY, serialized);
    }
    return canonical;
  } catch (_e) {
    return null;
  }
}
export function loadWorkbenchSession() {
  if (typeof window === 'undefined') return null;
  try {
    const rawSess = window.sessionStorage ? window.sessionStorage.getItem(SMAT_SESSION_KEY) : null;
    const rawLocal = window.localStorage ? window.localStorage.getItem(SMAT_WORKBENCH_STATE_KEY) : null;
    if (!rawSess && !rawLocal) return null;
    const parsedLocal = rawLocal ? JSON.parse(rawLocal) : {};
    const parsedSess = rawSess ? JSON.parse(rawSess) : {};
    return normalizeWorkbenchStateV2({ ...parsedLocal, ...parsedSess });
  } catch (_e) {
    return null;
  }
}
export function mergeWorkbenchLensState(incomingPartial = {}, existingState = {}) {
  const base = normalizeWorkbenchStateV2(existingState || {});
  if (!incomingPartial || typeof incomingPartial !== 'object') return base;
  const definedEntries = {};
  for (const [k, v] of Object.entries(incomingPartial)) {
    if (v !== undefined && v !== null && v !== '') {
      definedEntries[k] = v;
    }
  }
  return workbenchStateLens.put(base, definedEntries);
}
export function buildWizardUrl(opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'es';
  const basePath = lang === 'en' ? '/en/quote/' : '/cotizar/';
  const params = new URLSearchParams();
  const circuito = opts.circuito || opts.circuit || '';
  const equipo = opts.equipo || opts.role || '';
  const pieza = opts.pieza || '';
  const codigo = opts.codigo || '';
  const serie = opts.serie || opts.pipe_size || '';
  const estacion = opts.estacion || opts.station || '';
  const pesoKg = opts.peso_kg ?? opts.weight_kg ?? '';
  const claroMm = opts.claro_mm ?? '';
  const b2Mm = opts.b2_mm ?? '';
  const sealBranch = opts.seal_branch || '';
  const transmision = opts.transmision || opts.arreglo || '';
  const isMechanicalBearingOnly =
    pieza === 'cartucho_rodamientos' ||
    equipo === 'kit_rodamientos' ||
    opts.omitWetMaterial === true;
  if (circuito) params.set('circuito', String(circuito));
  if (equipo) params.set('equipo', String(equipo));
  if (pieza) params.set('pieza', String(pieza));
  if (codigo) params.set('codigo', String(codigo));
  if (serie) params.set('serie', String(serie));
  if (!isMechanicalBearingOnly && opts.material) {
    params.set('material', normalizeMaterialKey(opts.material));
  }
  if (estacion) params.set('estacion', String(estacion));
  if (pesoKg !== '' && pesoKg !== null && pesoKg !== undefined) params.set('peso_kg', String(pesoKg));
  if (claroMm !== '' && claroMm !== null && claroMm !== undefined) params.set('claro_mm', String(claroMm));
  if (b2Mm !== '' && b2Mm !== null && b2Mm !== undefined) params.set('b2_mm', String(b2Mm));
  if (sealBranch) params.set('seal_branch', String(sealBranch));
  if (transmision) params.set('transmision', String(transmision));
  const queryStr = params.toString();
  return `${basePath}${queryStr ? `?${queryStr}` : ''}#rfq`;
}
export {
  loadWorkbenchSession as loadWorkbenchState, saveWorkbenchSession as saveWorkbenchState, dispatchLeadWebhook as sendLeadToServer
};
export { SAT_TIGIE_BY_VERTICAL, formatSatTigieInvoiceLine, formatDualCheckoutPayload } from './workbenchExportFormatters.js';
