/**
 * SMAT Minerals - Pure URL Context, Role Alias & Condition Preset Router (SLICE-V36-01)
 * Extraído por costura limpia LCOM4 = 1 (∂(C) = 0) desde quoteWizardController.js (D13-V36 / D6-V36 / DEB-V36-07).
 * Implementa el morfismo sobreyectivo de slugs URL (Furnas 1987, DOI: 10.1145/32206.32212) y
 * lentes bidireccionales PutGet (Foster et al. 2007; Barbosa et al. 2010) sin dependencia del DOM.
 */

export const ROLE_ALIAS_MAP = Object.freeze({
  impulsor: 'solo_impulsor',
  impulsor_bomba: 'solo_impulsor',
  impulsor_5_alabes: 'solo_impulsor',
  'impulsor-5-alabes': 'solo_impulsor',
  revestimientos: 'kit_wet_end',
  bombeo_hule_cromo: 'kit_wet_end',
  kit_wet_end: 'kit_wet_end',
  throatbush: 'solo_voluta',
  cuello_succion: 'solo_voluta',
  'cuello-succion': 'solo_voluta',
  voluta: 'solo_voluta',
  solo_voluta: 'solo_voluta',
  forro_fpl: 'solo_voluta',
  sello: 'kit_sellado',
  sello_expulsor: 'kit_sellado',
  'sello-expulsor': 'kit_sellado',
  expeller_seal: 'kit_sellado',
  expeller: 'kit_sellado',
  camisa_flecha: 'kit_sellado',
  'camisa-flecha': 'kit_sellado',
  kit_sellado: 'kit_sellado',
  soporte: 'kit_rodamientos',
  soporte_rodamiento: 'kit_rodamientos',
  soporte_rodamientos: 'kit_rodamientos',
  'soporte-rodamientos': 'kit_rodamientos',
  bearing_assembly: 'kit_rodamientos',
  cartucho_rodamiento: 'kit_rodamientos',
  cartucho_rodamientos: 'kit_rodamientos',
  'cartucho-rodamientos': 'kit_rodamientos',
  kit_rodamientos: 'kit_rodamientos',
  skid_bomba: 'skid_bomba',
  hidrociclon: 'hidrociclon_apex_vortex',
  hidrociclones: 'hidrociclon_apex_vortex',
  hidrociclon_apex_vortex: 'hidrociclon_apex_vortex',
  'apex-boquilla-hidrociclon': 'hidrociclon_apex_vortex',
  apex_boquilla_hidrociclon: 'hidrociclon_apex_vortex',
  'hidrociclones-d6-d20-conos-cabezales': 'hidrociclon_apex_vortex',
  'hidrociclones-uretanos-sic': 'hidrociclon_apex_vortex',
  'urethane-sic-hydrocyclones': 'hidrociclon_apex_vortex',
  malla_criba: 'malla_criba_poliuretano',
  malla_criba_poliuretano: 'malla_criba_poliuretano',
  cribado: 'malla_criba_poliuretano',
  'mallas-finas-uretano-th48-30': 'malla_criba_poliuretano',
  'modulos-poliuretano-criba-1x1': 'malla_criba_poliuretano',
  celda_completa: 'celda_flotacion',
  celda_flotacion: 'celda_flotacion',
  mecanismos_flotacion: 'rotor_estator',
  mecanismo_completo: 'rotor_estator',
  'mecanismo-completo': 'rotor_estator',
  'kit-rotor-estator-flotacion': 'rotor_estator',
  'flotation-rotor-stator-kit': 'rotor_estator',
  rotor_estator: 'rotor_estator',
  manto_difusor: 'manto_difusor',
  bateria_celdas: 'bateria_celdas',
  prensa_completa: 'filtro_prensa',
  filtro_prensa: 'filtro_prensa',
  repuestos_prensa: 'placas_telas',
  placas_filtrantes: 'placas_telas',
  kit_placas_telas: 'placas_telas',
  'kit-placas-telas': 'placas_telas',
  placas_telas: 'placas_telas',
  placas_membrana: 'placas_membrana',
  bomba_prensa: 'bomba_prensa',
  balanza_marcy: 'balanza_marcy',
  filtro_batch_lab: 'filtro_batch_lab',
  tamices_laboratorio: 'tamices_laboratorio',
  tamices_astm_e11: 'tamices_laboratorio',
  custom: 'balanza_marcy'
});

export const FLOTATION_CONDITION_ALIAS_MAP = Object.freeze({
  sulfuros_alta_agitacion: 'sulfuros_alta_agitacion',
  oxidos_particula_gruesa: 'oxidos_particula_gruesa',
  espuma_inestable: 'espuma_inestable',
  reactivos_espuma: 'espuma_inestable',
  'reactivos-espuma': 'espuma_inestable',
  arenero_sedimentacion: 'arenero_sedimentacion',
  arena_gruesa_fondo: 'arenero_sedimentacion',
  'arena-gruesa-fondo': 'arenero_sedimentacion',
  limpieza_selectiva: 'limpieza_selectiva'
});

export const FILTRATION_CONDITION_ALIAS_MAP = Object.freeze({
  jales_secos: 'jales_secos',
  concentrado_fino: 'concentrado_fino',
  chorro_entre_placas: 'chorro_entre_placas',
  fuga_chorreo: 'chorro_entre_placas',
  'fuga-chorreo': 'chorro_entre_placas',
  tela_cegada: 'tela_cegada',
  ciclo_lento: 'tela_cegada',
  'ciclo-lento': 'tela_cegada',
  alta_temperatura_acida: 'alta_temperatura_acida'
});

export const FLOTATION_DOM_CHIP_MAP = Object.freeze({
  sulfuros_alta_agitacion: 'sulfuros_alta_agitacion',
  reactivos_ph_extremo: 'reactivos_ph_extremo',
  espuma_inestable: 'reactivos_ph_extremo',
  reactivos_espuma: 'reactivos_ph_extremo',
  'reactivos-espuma': 'reactivos_ph_extremo',
  espumado_intenso: 'espumado_intenso',
  oxidos_particula_gruesa: 'espumado_intenso',
  limpieza_selectiva: 'espumado_intenso',
  vibracion_flecha: 'vibracion_flecha',
  arenero_sedimentacion: 'vibracion_flecha',
  arena_gruesa_fondo: 'vibracion_flecha',
  'arena-gruesa-fondo': 'vibracion_flecha'
});

export const FILTRATION_DOM_CHIP_MAP = Object.freeze({
  jales_secos: 'jales_secos',
  recuperacion_agua: 'recuperacion_agua',
  concentrado_fino: 'recuperacion_agua',
  colmatacion_telas: 'colmatacion_telas',
  tela_cegada: 'colmatacion_telas',
  ciclo_lento: 'colmatacion_telas',
  'ciclo-lento': 'colmatacion_telas',
  alta_presion_16bar: 'alta_presion_16bar',
  chorro_entre_placas: 'alta_presion_16bar',
  fuga_chorreo: 'alta_presion_16bar',
  'fuga-chorreo': 'alta_presion_16bar',
  alta_temperatura_acida: 'alta_presion_16bar'
});

/**
 * Resuelve el valor exacto del atributo data-flot-cond en el DOM de QuoteWizard.astro (D2-V37 / DEB-V37-03).
 * @param {string} [rawCond='']
 * @returns {string}
 */
export function resolveFlotationDomChipKey(rawCond = '') {
  if (!rawCond) return '';
  const clean = String(rawCond).trim().toLowerCase();
  return FLOTATION_DOM_CHIP_MAP[clean] || clean;
}

/**
 * Resuelve el valor exacto del atributo data-filt-cond en el DOM de QuoteWizard.astro (D2-V37 / DEB-V37-03).
 * @param {string} [rawCond='']
 * @returns {string}
 */
export function resolveFiltrationDomChipKey(rawCond = '') {
  if (!rawCond) return '';
  const clean = String(rawCond).trim().toLowerCase();
  return FILTRATION_DOM_CHIP_MAP[clean] || clean;
}

/**
 * Normaliza llaves de condición operativa en Flotación emitidas desde subpáginas, diagnóstico y CaseCards (D6-V36).
 * @param {string} [rawCond='']
 * @returns {string}
 */
export function normalizeFlotationConditionKey(rawCond = '') {
  if (!rawCond) return '';
  const clean = String(rawCond).trim().toLowerCase();
  return FLOTATION_CONDITION_ALIAS_MAP[clean] || clean;
}

/**
 * Normaliza llaves de condición operativa en Filtración emitidas desde subpáginas, diagnóstico y CaseCards (D6-V36).
 * @param {string} [rawCond='']
 * @returns {string}
 */
export function normalizeFiltrationConditionKey(rawCond = '') {
  if (!rawCond) return '';
  const clean = String(rawCond).trim().toLowerCase();
  return FILTRATION_CONDITION_ALIAS_MAP[clean] || clean;
}

/**
 * Resuelve el rol canónico de workbench a partir de ?rol=, ?equipo=, ?pieza= y ?circuito= (D6-V36).
 * @param {string} [rawRole='']
 * @param {string} [rawPieza='']
 * @param {string} [rawCircuit='']
 * @returns {string}
 */
export function resolveCanonicalRoleFromUrlParam(rawRole = '', rawPieza = '', rawCircuit = '') {
  const candidate = String(rawRole || rawPieza || '').trim();
  if (candidate) {
    const lower = candidate.toLowerCase();
    if (ROLE_ALIAS_MAP[candidate]) return ROLE_ALIAS_MAP[candidate];
    if (ROLE_ALIAS_MAP[lower]) return ROLE_ALIAS_MAP[lower];
    if (lower.includes('apex') || lower.includes('vortex') || lower.includes('hidrociclon') || lower.includes('cyclone')) {
      return 'hidrociclon_apex_vortex';
    }
    if (lower.includes('malla') || lower.includes('criba') || lower.includes('th48') || lower.includes('screen')) {
      return 'malla_criba_poliuretano';
    }
    if (lower.includes('sello') || lower.includes('expulsor') || lower.includes('expeller') || lower.includes('camisa')) {
      return 'kit_sellado';
    }
    if (lower.includes('soporte') || lower.includes('rodamiento') || lower.includes('bearing') || lower.includes('cartucho')) {
      return 'kit_rodamientos';
    }
    if (lower.includes('impulsor') || lower.includes('impeller')) {
      return 'solo_impulsor';
    }
    if (lower.includes('throatbush') || lower.includes('cuello') || lower.includes('voluta')) {
      return 'solo_voluta';
    }
    if (lower.includes('mecanismo') || lower.includes('rotor') || lower.includes('estator')) {
      return 'rotor_estator';
    }
    if (lower.includes('placa') || lower.includes('tela') || lower.includes('shifter')) {
      return 'placas_telas';
    }
    return candidate;
  }
  const cLower = String(rawCircuit || '').trim().toLowerCase();
  if (cLower === 'clasificacion') return 'hidrociclon_apex_vortex';
  if (cLower === 'flotacion') return 'rotor_estator';
  if (cLower === 'filtracion') return 'placas_telas';
  if (cLower === 'control_procesos') return 'balanza_marcy';
  return 'kit_wet_end';
}

/**
 * Extrae y normaliza la telemetría de la Báscula Marcy de 3 Vasos desde parámetros URL (D5-V36).
 * @param {Object|URLSearchParams|string} [input={}]
 */
export function parseMarcyThreeCupUrlParams(input = {}) {
  let getParam = (_k) => null;
  if (typeof input === 'string') {
    const q = input.includes('?') ? input.split('?')[1].split('#')[0] : input.replace(/^[#?]/, '');
    const sp = new URLSearchParams(q);
    getParam = (k) => sp.get(k);
  } else if (input && typeof input.get === 'function') {
    getParam = (k) => input.get(k);
  } else if (input && typeof input === 'object') {
    getParam = (k) => (input[k] !== undefined && input[k] !== null ? String(input[k]) : null);
  }

  const rawRf = getParam('rho_f') ?? getParam('feed_sg');
  const rawRu = getParam('rho_u') ?? getParam('underflow_sg');
  const rawRo = getParam('rho_o') ?? getParam('overflow_sg');
  const rawRs = getParam('rs_pct') ?? getParam('solids_recovery_pct');
  const rawCvU = getParam('cv_u') ?? getParam('underflow_cv');
  const rawD50c = getParam('d50c') ?? getParam('d50c_um');
  const rawRoping = getParam('roping_risk');

  const hasUrlTelemetry = Boolean(rawRf || rawRu || rawRo || rawRs || rawCvU);
  const feedSg = Number(rawRf) > 1.0 ? Number(rawRf) : 1.38;
  const underflowSg = Number(rawRu) > 1.0 ? Number(rawRu) : 1.88;
  const overflowSg = Number(rawRo) > 1.0 ? Number(rawRo) : 1.16;

  let solidsRecoveryPct = Number(rawRs);
  if (!Number.isFinite(solidsRecoveryPct) || solidsRecoveryPct <= 0) {
    const num = (feedSg - overflowSg) * (underflowSg - 1.0);
    const den = (underflowSg - overflowSg) * (feedSg - 1.0);
    solidsRecoveryPct = den > 0.0001 ? Number(Math.max(0, Math.min(99.5, (num / den) * 100)).toFixed(1)) : 84.2;
  }

  let underflowCvPct = Number(rawCvU);
  if (!Number.isFinite(underflowCvPct) || underflowCvPct <= 0) {
    underflowCvPct = Number((((underflowSg - 1.0) / (2.7 - 1.0)) * 100).toFixed(1));
  }
  const d50cMicrons = Number(rawD50c) > 0 ? Number(rawD50c) : 74;
  const ropingRisk = rawRoping !== null ? (rawRoping === '1' || rawRoping === 'true') : (underflowCvPct > 52.0 || underflowSg >= 1.92);

  return {
    hasUrlTelemetry,
    feedSg,
    underflowSg,
    overflowSg,
    solidsRecoveryPct,
    underflowCvPct,
    d50cMicrons,
    ropingRisk
  };
}

/**
 * Construye un descriptor normalizado completo a partir de ctx (parseUrlContextParams) para checkUrlContext (D13-V36).
 * @param {Object} [ctx={}]
 */
export function resolveUrlContextDescriptor(ctx = {}) {
  const rawRole = ctx.rol || ctx.equipo || '';
  const rawPieza = ctx.pieza || '';
  const canonicalRole = resolveCanonicalRoleFromUrlParam(rawRole, rawPieza, ctx.circuito || '');
  const normalizedFlotCondition = normalizeFlotationConditionKey(ctx.flot_condition || '');
  const normalizedFiltCondition = normalizeFiltrationConditionKey(ctx.filt_condition || '');
  const flotationDomChipKey = resolveFlotationDomChipKey(ctx.flot_condition || '');
  const filtrationDomChipKey = resolveFiltrationDomChipKey(ctx.filt_condition || '');
  const marcyThreeCup = parseMarcyThreeCupUrlParams(ctx);
  const bomOverride = (rawPieza || ctx.peso_kg || ctx.estacion)
    ? { pieza: rawPieza, peso_kg: ctx.peso_kg || '', estacion: ctx.estacion || '' }
    : null;
  return {
    canonicalRole,
    normalizedFlotCondition,
    normalizedFiltCondition,
    flotationDomChipKey,
    filtrationDomChipKey,
    marcyThreeCup,
    bomOverride
  };
}
