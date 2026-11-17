// @ts-nocheck
/**
 * wizardMiningAndCodeDecoder.js
 * ---------------------------------------------------------------------------
 * Sub-módulo extraído por Costura Limpia LCOM4 = 1 (∂(C) = 0, D9-V37 / DEB-V37-01)
 * desde quoteWizardController.js.
 *
 * Responsabilidades:
 * 1. Proyección declarativa DOM ([data-wb-field] / [data-wb-bind]) y FORMATTERS_BY_FIELD.
 * 2. Codificación y decodificación determinista de códigos institucionales SMAT y piezas atómicas.
 * 3. Inferencia de perfiles reológicos por unidad minera (resolveMiningUnitPulpPreset) y dominio corporativo.
 * 4. Compresión de fotografías de placa en memoria (Canvas -> JPEG Blob) sin servidor.
 */

import {
  generateSmatPartCode,
  parseSmatPartCode,
  resolveMiningDistrictPreset
} from './workbenchBus.js';

/**
 * Mapa de formateadores declarativos para proyección directa DOM (Decisión 2-C+)
 */
export const FORMATTERS_BY_FIELD = Object.freeze({
  durandFactorFL: (v) => (v !== undefined && v !== null ? Number(v).toFixed(2) : '1.08'),
  solidsVolumetricPercent: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(1)}%` : '23.3%'),
  recommendedPipeVelocityMs: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} m/s` : '3.02 m/s'),
  criticalSettlingVelocityMs: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} m/s` : '2.42 m/s'),
  actualPipeVelocityMs: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} m/s` : '3.15 m/s'),
  slurrySpecificGravity: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} kg/L` : '1.40 kg/L'),
  pulpPh: (v) => (v !== undefined && v !== null ? `pH ${Number(v).toFixed(1)}` : 'pH 7.0'),
  sealBranch: (v) => (v === 'gland_water' ? 'Prensaestopa Húmedo (Est. 02B)' : 'Expulsor Seco (Est. 02A)'),
  impellerExitWidthMm: (v) => (v !== undefined && v !== null ? `${Number(v)} mm` : '48 mm'),
  dynamicCapacityCkN: (v) => (v !== undefined && v !== null ? `${Number(v)} kN` : '145 kN')
});

function resolveStateFieldPath(stateObj, fieldPath) {
  if (!stateObj || !fieldPath) return undefined;
  if (Object.prototype.hasOwnProperty.call(stateObj, fieldPath)) {
    return stateObj[fieldPath];
  }
  const segments = String(fieldPath).split('.');
  let cur = stateObj;
  for (let i = 0; i < segments.length; i += 1) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = cur[segments[i]];
  }
  return cur;
}

/**
 * Proyecta declarativamente el estado de ingeniería hacia cualquier nodo con [data-wb-field] o [data-wb-bind]
 * erradicando el acoplamiento manual ad-hoc (Decisión 2-C+).
 * @param {ParentNode} root
 * @param {Object} state
 * @returns {number} Cantidad de nodos actualizados
 */
export function projectWorkbenchToDOM(root, state = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  let updatedCount = 0;
  const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
  const fieldNodes = root.querySelectorAll('[data-wb-field]');
  fieldNodes.forEach((node) => {
    const fieldKey = (typeof node.getAttribute === 'function' ? node.getAttribute('data-wb-field') : null) || (node.dataset && node.dataset.wbField);
    const rawVal = resolveStateFieldPath(state, fieldKey);
    if (rawVal !== undefined && rawVal !== null) {
      const formatter = FORMATTERS_BY_FIELD[fieldKey];
      const formatted = formatter ? formatter(rawVal, state) : String(rawVal);
      if (node.tagName === 'INPUT' || node.tagName === 'SELECT' || node.tagName === 'TEXTAREA') {
        if (activeEl !== node) node.value = String(rawVal);
      } else {
        node.textContent = formatted;
      }
      updatedCount += 1;
    }
  });
  const bindNodes = root.querySelectorAll('[data-wb-bind]');
  bindNodes.forEach((node) => {
    const bindKey = (typeof node.getAttribute === 'function' ? node.getAttribute('data-wb-bind') : null) || (node.dataset && node.dataset.wbBind);
    const rawVal = resolveStateFieldPath(state, bindKey);
    if (rawVal !== undefined && rawVal !== null && activeEl !== node) {
      node.value = String(rawVal);
      updatedCount += 1;
    }
  });
  return updatedCount;
}

/**
 * Genera el código institucional SMAT por circuito, rol y serie (SMAT-PUMP-6X4-WETKIT, etc.)
 */
export function buildSmatCode(arg1, arg2, arg3, _arg4) {
  if (arg1 === 'bombeo' || arg1 === 'flotacion' || arg1 === 'filtracion' || arg1 === 'control_procesos' || arg1 === 'clasificacion') {
    return generateSmatPartCode({
      circuit: arg1,
      role_id: String(arg2 || ''),
      pipe_size: arg1 === 'bombeo' ? String(arg3 || '6x4') : '',
      size_val: String(arg3 || '')
    });
  }
  return generateSmatPartCode({
    role_id: String(arg1 || ''),
    details: String(arg2 || '')
  });
}

/**
 * Decodifica un código institucional SMAT o código atómico universal (D3147..DAM005)
 */
export function decodeSmatCode(codeStr, lang = 'es') {
  const parsed = parseSmatPartCode(codeStr, lang);
  if (!parsed || !parsed.valid) return null;
  return {
    circuit: parsed.circuit,
    role: parsed.ui_role || parsed.role_id || parsed.role,
    size: parsed.size || parsed.pipe_size || '6x4',
    code: parsed.code || parsed.raw,
    atomic_code: parsed.atomic_code || '',
    atomic_label: parsed.atomic_label || '',
    atomic_metallurgy: parsed.atomic_metallurgy || parsed.alloy || 'High Chrome A05 (27% Cr, ≥ 650 HB)'
  };
}

/**
 * Resuelve los parámetros reológicos pre-calibrados (Cw, d80, Ss, pH, Q, altitud) para una unidad minera
 */
export function resolveMiningUnitPulpPreset(groupObj, unitObj, currentAltitude = 2400) {
  if (!groupObj || !unitObj) return null;
  const profileText = unitObj.pulp_profile || '';
  const pLower = profileText.toLowerCase();
  const districtPreset = resolveMiningDistrictPreset(groupObj.id || unitObj.name) || {};
  let presetCw = districtPreset.solidsCw || 45;
  let presetD80 = districtPreset.d80Microns || 180;
  let presetSg = districtPreset.solidsSg || 2.8;
  const presetAlt = districtPreset.altitudeM || currentAltitude;
  const presetPh = districtPreset.pulpPh || 7.5;
  const presetFlow = districtPreset.flowM3h || 180;

  if (pLower.includes('hierro') || pLower.includes('ferro') || pLower.includes('manganeso') || pLower.includes('pellet')) {
    presetCw = 60;
    presetD80 = 190;
    presetSg = 4.1;
  } else if (pLower.includes('alta densidad') || pLower.includes('abrasiv') || pLower.includes('skarn') || pLower.includes('cobre') || pLower.includes('sag') || pLower.includes('pesad')) {
    presetCw = 56;
    presetD80 = 210;
    presetSg = 3.2;
  } else if (pLower.includes('jales') || pLower.includes('relave') || pLower.includes('espesad') || pLower.includes('filtr')) {
    presetCw = 58;
    presetD80 = 135;
    presetSg = 2.9;
  } else if (pLower.includes('flotaci') || pLower.includes('cianura') || pLower.includes('fina')) {
    presetCw = 40;
    presetD80 = 105;
    presetSg = 2.7;
  }

  return {
    profileText,
    companyLabel: `${groupObj.name} / ${String(unitObj.name || '').split('(')[0].trim()}`,
    destinationLabel: unitObj.name || '',
    presetFlow,
    presetCw,
    presetD80,
    presetSg,
    presetPh,
    presetAlt
  };
}

/**
 * Busca el grupo minero correspondiente al dominio de un correo corporativo
 */
export function matchMiningGroupByEmailDomain(email = '', miningGroups = []) {
  const clean = String(email || '').trim();
  if (!clean.includes('@') || !Array.isArray(miningGroups)) return null;
  const domain = clean.split('@')[1]?.toLowerCase().trim();
  if (!domain) return null;
  return miningGroups.find((g) => Array.isArray(g.domains) && g.domains.includes(domain)) || null;
}

export { resolveBomPartSpecs } from './pumpAssemblyAndDriveEngine.js';
