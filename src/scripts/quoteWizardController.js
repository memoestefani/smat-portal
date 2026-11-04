// @ts-nocheck
/**
 * SMAT Minerals - QuoteWizard Pure Mealy State Transducer & Reactive Controller (Parnas Slice MS-06)
 * Desacoplado de QuoteWizard.astro para cumplir el presupuesto modular Parnas y ley de divulgación progresiva.
 */
import {
  calculateSlurryMetrics,
  calculateAltitudeCorrection,
  validatePlantLeadInput,
  evaluateWetEndAssemblyInterference,
  evaluatePumpAssemblySequence,
  calculateDriveAndBearingKinematics,
  calculateMarcyScaleReading,
  calculateGyMinimumSampleMass,
  recommendAstmSieveSeries,
  resolvePipeDiameterMm,
  PIPE_SERIES_DIAMETER_MM,
  WET_END_MATERIAL_MATRIX,
  SLURRY_PRESETS,
  MECHANICAL_DIAGNOSTICS
} from '../scripts/slurryEngine.js';
import {
  DEFAULT_SMAT_LEAD_WEBHOOK_URL,
  SMAT_WORKBENCH_STATE_KEY,
  normalizeMaterialKey,
  normalizeCircuitSerie,
  normalizeWorkbenchStateV2,
  workbenchStateLens,
  ATOMIC_PARTS_CATALOG,
  resolveAtomicPartCode,
  getAtomicPartSpecs,
  formatNioshErgonomicStatus,
  mergeWorkbenchLensState,
  resolveMiningDistrictPreset,
  buildCanonicalEngineeringSnapshot,
  publishWorkbenchUpdate,
  subscribeWorkbenchUpdate,
  parseUrlContextParams,
  formatSapPlaintext,
  formatSapTsv,
  formatMailtoUrl,
  formatWhatsappUrl,
  generateSmatPartCode,
  parseSmatPartCode,
  buildAcuseUrlParams,
  buildLeadWebhookPayload,
  sendLeadToServer,
  dispatchLeadWebhook,
  saveWorkbenchSession,
  loadWorkbenchSession,
  saveWorkbenchState,
  loadWorkbenchState
} from '../scripts/workbenchBus.js';

export const ROLE_ALIAS_MAP = {
  impulsor: 'solo_impulsor',
  impulsor_bomba: 'solo_impulsor',
  revestimientos: 'kit_wet_end',
  bombeo_hule_cromo: 'kit_wet_end',
  sello: 'kit_sellado',
  sello_expulsor: 'kit_sellado',
  soporte: 'kit_rodamientos',
  soporte_rodamiento: 'kit_rodamientos',
  skid_bomba: 'skid_bomba',
  celda_completa: 'celda_flotacion',
  mecanismos_flotacion: 'rotor_estator',
  prensa_completa: 'filtro_prensa',
  repuestos_prensa: 'placas_telas',
  placas_filtrantes: 'placas_telas',
  balanza_marcy: 'balanza_marcy',
  filtro_batch_lab: 'filtro_batch_lab',
  tamices_laboratorio: 'tamices_laboratorio',
  tamices_astm_e11: 'tamices_laboratorio',
  custom: 'balanza_marcy'
};

/**
 * Transductor determinista puro de Mealy: (state, urlParams) -> viewState
 * Evaluable en Node.js sin DOM (Decisión 1-C+ / 2-C+).
 */
export function computeWizardViewState(state = {}, urlParams = {}) {
  // Tri-Compound lookup: { A05: 'Alto Cromo Cr27 (A05)', PU: 'Poliuretano Elastómero U01', RUBBER: 'Hule Natural R55' }
  const ctx = typeof urlParams === 'string' ? parseUrlContextParams(urlParams) : (urlParams || {});
  const rawRole = ctx.rol || ctx.equipo || state.roleId || '';
  const mappedRole = rawRole ? (ROLE_ALIAS_MAP[rawRole] || rawRole) : 'kit_wet_end';

  let circuit = ctx.circuito || state.circuit || 'bombeo';
  if (!ctx.circuito && rawRole) {
    const rLower = String(rawRole).toLowerCase();
    if (rLower.includes('marcy') || rLower.includes('balanza') || rLower.includes('batch') || rLower.includes('tamiz') || rLower === 'custom') {
      circuit = 'control_procesos';
    } else if (rLower.includes('flot') || rLower.includes('celda') || rLower.includes('rotor') || rLower.includes('mecanismo')) {
      circuit = 'flotacion';
    } else if (rLower.includes('filt') || rLower.includes('prensa') || rLower.includes('placa') || rLower.includes('tela')) {
      circuit = 'filtracion';
    }
  }

  let pipeSize = state.pipeSize || '6x4';
  if (ctx.serie) {
    const sNorm = String(ctx.serie).toLowerCase().trim();
    if (PIPE_SERIES_DIAMETER_MM[sNorm]) {
      pipeSize = sNorm;
    } else if (sNorm.includes('14x12')) pipeSize = '14x12';
    else if (sNorm.includes('12x10')) pipeSize = '12x10';
    else if (sNorm.includes('10x8')) pipeSize = '10x8';
    else if (sNorm.includes('8x6')) pipeSize = '8x6';
    else if (sNorm.includes('6x4')) pipeSize = '6x4';
    else if (sNorm.includes('4x3')) pipeSize = '4x3';
    else if (sNorm.includes('3x2')) pipeSize = '3x2';
    else if (sNorm.includes('2x1.5')) pipeSize = '2x1.5';
    else if (sNorm.includes('1.5x1')) pipeSize = '1.5x1';
  }

  const atomicRef = ctx.codigo || ctx.pieza || state.atomicCode || mappedRole;
  const partSpecs = getAtomicPartSpecs(atomicRef, pipeSize);
  const smatCode = generateSmatPartCode({
    circuit,
    role_id: mappedRole,
    pipe_size: circuit === 'bombeo' ? pipeSize : '',
    size_val: pipeSize
  });

  const openStep2 = Boolean(ctx.flow || ctx.solids || ctx.cw || ctx.d80 || ctx.p80 || ctx.claro_mm || state.step2Open);
  const openStep3 = Boolean(ctx.mina || state.step3Open);
  const openSymptomDrawer = Boolean(ctx.sintoma || ctx.falla || ctx.mina || ctx.urgencia || state.stressSymptom);
  const openEngineeringDrawer = Boolean(circuit !== 'bombeo' || ctx.material || ctx.transmision || ctx.pieza || ctx.metrologia || state.userTouchedEngineering);
  const openSmartPasteDrawer = Boolean(ctx.codigo || state.smartPasteOpen);
  const pipeOrSeries = ctx.serie ? String(ctx.serie) : pipeSize;
  const budgetCategory = (circuit === 'flotacion' || circuit === 'filtracion')
    ? 'PROYECTO_EQUIPOS'
    : (circuit === 'control_procesos' ? 'CONTROL_PROCESOS' : 'OPERACION_SPARE_PARTS');

  return {
    circuit,
    roleId: mappedRole,
    pipeSize,
    pipeOrSeries,
    budgetCategory,
    smatCode,
    partSpecs,
    openStep2,
    openStep3,
    openSymptomDrawer,
    openEngineeringDrawer,
    openSmartPasteDrawer,
    drawers: {
      symptomOpen: openSymptomDrawer,
      engineeringConfigOpen: openEngineeringDrawer,
      smartPasteOpen: openSmartPasteDrawer,
      durandOpen: openStep2,
      dispatchOpen: openStep3
    },
    panels: {
      bombeoVisible: circuit === 'bombeo',
      flotacionVisible: circuit === 'flotacion',
      filtracionVisible: circuit === 'filtracion',
      controlVisible: circuit === 'control_procesos',
      recirculationAlertVisible: mappedRole === 'solo_impulsor' || mappedRole === 'solo_voluta'
    },
    hasActiveDiagFilter: Boolean(MECHANICAL_DIAGNOSTICS && ATOMIC_PARTS_CATALOG && evaluatePumpAssemblySequence && dispatchLeadWebhook && loadWorkbenchSession)
  };
}

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

export function initQuoteWizardController() {
  if (typeof document === 'undefined') return;
  var container = document.getElementById('rfq');
  if (!container) return;
  var isEs = container.getAttribute('data-lang') === 'es';
  var STORAGE_KEY_V2 = SMAT_WORKBENCH_STATE_KEY;

  // Controles Principales
  var btnOpex = document.getElementById('btn-intent-opex');
  var btnCapex = document.getElementById('btn-intent-capex');
  var selectRole = document.getElementById('wb-role');
  var inputDetails = document.getElementById('wb-details');
  var inputClientRef = document.getElementById('wb-client-ref');
  var inputName = document.getElementById('wb-name');
  var inputCompany = document.getElementById('wb-company');
  var inputPhone = document.getElementById('wb-phone');
  var inputEmail = document.getElementById('wb-email');
  var inputDest = document.getElementById('wb-destination');

  // Conmutador Multi-Circuito de Proceso (Decisión 8-C)
  var currentCircuit = 'bombeo';
  var circuitPills = document.querySelectorAll('.circuit-pill');
  var inputCircuit = document.getElementById('wb-process-circuit');
  var panelBombeo = document.getElementById('circuit-panel-bombeo');
  var panelFlotacion = document.getElementById('circuit-panel-flotacion');
  var panelFiltracion = document.getElementById('circuit-panel-filtracion');
  var panelControl = document.getElementById('circuit-panel-control');
  var selectRoleCtrl = document.getElementById('wb-role-ctrl');
  var selectCtrlSpec = document.getElementById('wb-ctrl-spec');

  // Parámetros Circuito 1: Bombeo de Pulpa
  var selectPipeSize = document.getElementById('wb-pipe-size');
  var stressChips = document.querySelectorAll('.stress-chip');
  var inputStressSymptom = document.getElementById('wb-stress-symptom');
  var recircAlertBox = document.getElementById('recirculation-alert-box');
  var recircWarnDossier = document.getElementById('live-recirc-warning-dossier');

  // Parámetros Circuito 2: Flotación de Minerales
  var selectRoleFlot = document.getElementById('wb-role-flot');
  var selectFlotCapacity = document.getElementById('wb-flot-capacity');
  var flotChips = document.querySelectorAll('.flot-chip');
  var inputFlotCondition = document.getElementById('wb-flot-condition');

  // Parámetros Circuito 3: Filtración y Jales Secos
  var selectRoleFilt = document.getElementById('wb-role-filt');
  var selectFiltCapacity = document.getElementById('wb-filt-capacity');
  var filtChips = document.querySelectorAll('.filt-chip');
  var inputFiltCondition = document.getElementById('wb-filt-condition');

  // Cotas de Cotejo Dimensional 1:1 Pieza Desgastada (Flexómetro)
  var dimOuterDia = document.getElementById('wb-dim-dia');
  var dimShaftBore = document.getElementById('wb-dim-bore');

  // Metadatos Dinámicos del Live Dossier Sección 2
  var livePipeHeader = document.getElementById('live-pipe-header');
  var livePipeText = document.getElementById('live-pipe-text');
  var liveStressHeader = document.getElementById('live-stress-header');
  var liveStressText = document.getElementById('live-stress-text');

  // Presets & Custom Equipment
  var presetChips = document.querySelectorAll('.preset-chip');
  var customEquipDetails = document.getElementById('custom-equip-details');
  var customEquipType = document.getElementById('custom-equip-type');
  var customEquipCapacity = document.getElementById('custom-equip-capacity');
  var customEquipNotes = document.getElementById('custom-equip-notes');
  var liveCustomBox = document.getElementById('live-custom-box');
  var liveCustomText = document.getElementById('live-custom-text');

  // Sliders de Simulación & TCO (Slices 1, 3, 4, 6)
  var sliderFlow = document.getElementById('slider-flow');
  var sliderSolids = document.getElementById('slider-solids');
  var sliderD80 = document.getElementById('slider-d80');
  var sliderSg = document.getElementById('slider-sg');
  var sliderPh = document.getElementById('slider-ph');
  var sliderDowntime = document.getElementById('slider-downtime');
  var valFlow = document.getElementById('val-flow');
  var valSolids = document.getElementById('val-solids');
  var valD80 = document.getElementById('val-d80');
  var valSg = document.getElementById('val-sg');
  var valPh = document.getElementById('val-ph');
  var valPipeMm = document.getElementById('val-pipe-mm');
  var valDowntime = document.getElementById('val-downtime');
  var wbSealBranch = document.getElementById('wb-seal-branch');
  var wbImpellerB2 = document.getElementById('wb-impeller-b2');
  var wbBearingC = document.getElementById('wb-bearing-c');

  // Controles Nativos de Control de Procesos (Slice 6 & Decisión 5-C++)
  var ctrlSgInput = document.getElementById('wb-ctrl-sg');
  var ctrlCwInput = document.getElementById('wb-ctrl-cw');
  var ctrlRhopInput = document.getElementById('wb-ctrl-rhop');
  var ctrlD95Input = document.getElementById('wb-ctrl-d95');
  var ctrlLibInput = document.getElementById('wb-ctrl-lib');
  var ctrlGradeInput = document.getElementById('wb-ctrl-grade');
  var ctrlAirPsiInput = document.getElementById('wb-ctrl-air-psi');
  var ctrlGyCInput = document.getElementById('wb-ctrl-gy-c');
  var ctrlGyErrInput = document.getElementById('wb-ctrl-gy-err');
  var ctrlP80Input = document.getElementById('wb-ctrl-p80');
  var ctrlRrNInput = document.getElementById('wb-ctrl-rr-n');
  var ctrlRetP80Input = document.getElementById('wb-ctrl-ret-p80');
  var ctrlSieveTbody = document.getElementById('wb-ctrl-sieve-tbody');
  var ctrlSolveMode = 'cw';

  // Controles Nativos de Cinemática V-Belt y Secuencia 01–05 (Slices 3 & 4 & Decisiones 6-C++ / 7-C++)
  var wbDriverPulley = document.getElementById('wb-driver-pulley');
  var wbDrivenPulley = document.getElementById('wb-driven-pulley');
  var wbValDriverPulley = document.getElementById('wb-val-driver-pulley');
  var wbValDrivenPulley = document.getElementById('wb-val-driven-pulley');
  var wbMotorRpm = document.getElementById('wb-motor-rpm');
  var wbShaftPower = document.getElementById('wb-shaft-power');
  var wbAssemblySeqTest = document.getElementById('wb-assembly-sequence-test');
  var metricAssemblyMassSeq = document.getElementById('metric-assembly-mass-seq');
  var wbStep2ControlSummary = document.getElementById('wb-step2-control-summary');
  var wbStep2ControlSummaryText = document.getElementById('wb-step2-control-summary-text');
  var wbClearanceKinematicsCard = document.getElementById('wb-clearance-kinematics-card');
  var elMetricDriveRpm = document.getElementById('metric-drive-rpm');
  var elMetricDriveFr = document.getElementById('metric-drive-fr');
  var elMetricDriveFlood = document.getElementById('metric-drive-flood');
  var elMetricStructuralReason = document.getElementById('metric-structural-reason');

  // Salidas Hidráulicas y Semáforo
  var metricVc = document.getElementById('metric-vc');
  var metricMaterial = document.getElementById('metric-material');
  var metricLife = document.getElementById('metric-life');
  var regimePill = document.getElementById('regime-pill');
  var regimeDetail = document.getElementById('regime-detail');
  var tcoTonnageVal = document.getElementById('tco-tonnage-val');
  var miniAlloyBadge = document.getElementById('mini-alloy-badge');
  var miniFolioText = document.getElementById('mini-folio-text');

  // Altitud Minera y Corrección Barométrica (Decisión 5-A)
  var selectedAltitude = 2400;
  var altChips = document.querySelectorAll('.alt-chip');
  var valAltitude = document.getElementById('val-altitude');
  var altitudeNpshHint = document.getElementById('altitude-npsh-hint');

  // Conmutador TCO de Aleación (Decisión 3-A)
  var selectedTcoAlloy = 'A05';
  var tcoAlloyBtns = document.querySelectorAll('.tco-alloy-btn');
  var tcoSavingsVal = document.getElementById('tco-savings-val');

  // Decodificador de Código SMAT (Decisión 6-A)
  var inputDecoder = document.getElementById('wb-code-decoder-input');
  var btnDecoder = document.getElementById('wb-code-decode-btn');
  var decoderStatus = document.getElementById('decoder-status');

  // Pestañas Duales del Dossier (Decisión 8-A)
  var tabBtnMaint = document.getElementById('tab-btn-maint');
  var tabBtnSap = document.getElementById('tab-btn-sap');
  var paneMaint = document.getElementById('pane-maint');
  var paneSap = document.getElementById('pane-sap');
  var sapJustificationText = document.getElementById('sap-justification-text');

  // Elementos del Dossier
  var liveFolio = document.getElementById('live-folio');
  var liveSmatCode = document.getElementById('live-smat-code');
  var livePriorityTag = document.getElementById('live-priority-tag');
  var liveRequester = document.getElementById('live-requester');
  var liveCompany = document.getElementById('live-company');
  var liveContact = document.getElementById('live-contact');
  var liveDestination = document.getElementById('live-destination');
  var livePartName = document.getElementById('live-part-name');
  var livePartDetails = document.getElementById('live-part-details');
  var liveClientRefBox = document.getElementById('live-client-ref-box');
  var liveClientRefText = document.getElementById('live-client-ref-text');
  var liveTableFlow = document.getElementById('live-table-flow');
  var liveTableD80 = document.getElementById('live-table-d80');
  var liveTableVc = document.getElementById('live-table-vc');
  var liveTableMat = document.getElementById('live-table-mat');
  var dossierPartHardness = document.getElementById('dossier-part-hardness');
  var dossierPartFitGuarantee = document.getElementById('dossier-part-fit-guarantee');

  // Elementos de la Vista SAP
  var sapLivePart = document.getElementById('sap-live-part');
  var sapLiveCode = document.getElementById('sap-live-code');
  var sapLiveMat = document.getElementById('sap-live-mat');
  var sapLiveDest = document.getElementById('sap-live-dest');

  // Generar Folio Inicial
  var currentFolio = 'SMAT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  if (liveFolio) liveFolio.textContent = currentFolio;
  if (miniFolioText) miniFolioText.textContent = currentFolio;

  var containerElem = document.getElementById('rfq');
  var defaultTypeAttr = containerElem ? containerElem.getAttribute('data-default-type') : 'opex';
  var isOpex = defaultTypeAttr !== 'capex';
  var isCustomEquipment = false;

  function renderWetEndMaterialMatrixCard(matKey) {
    var key = matKey || 'alto_cromo_cr27';
    var matObj = WET_END_MATERIAL_MATRIX[key] || WET_END_MATERIAL_MATRIX.alto_cromo_cr27;
    if (!matObj) return;
    var badgeEl = document.getElementById('wb-mat-code-badge');
    var hardEl = document.getElementById('wb-mat-hardness');
    var tipEl = document.getElementById('wb-mat-tip-limit');
    var wearEl = document.getElementById('wb-mat-wear-554');
    var d80PhEl = document.getElementById('wb-mat-d80-ph');
    var partsEl = document.getElementById('wb-mat-parts-list');
    var dutyEl = document.getElementById('wb-mat-duty-desc');
    if (badgeEl) badgeEl.textContent = matObj.code + ' • ' + (isEs ? matObj.nameEs : matObj.nameEn);
    if (hardEl) hardEl.textContent = matObj.hardness;
    if (tipEl) tipEl.textContent = '≤ ' + matObj.maxTipSpeedMs.toFixed(1) + ' m/s';
    if (wearEl) wearEl.textContent = matObj.wearRatio554 + ' (δ = ' + matObj.recommendedClearanceMm.toFixed(2) + ' mm)';
    if (d80PhEl) d80PhEl.textContent = matObj.d80RangeMicrons[0] + '–' + matObj.d80RangeMicrons[1] + ' µm • pH ' + matObj.phRange[0] + '–' + matObj.phRange[1];
    if (partsEl) partsEl.textContent = (isEs ? matObj.partsIncludedEs : matObj.partsIncludedEn).join(' + ');
    if (dutyEl) dutyEl.textContent = isEs ? matObj.dutyApplicationEs : matObj.dutyApplicationEn;
  }

  function applyCircuitStatechartXOR(circuit) {
    var engDrawer = document.getElementById('wb-engineering-config-details');
    if (engDrawer && circuit && circuit !== 'bombeo') {
      engDrawer.open = true;
    }
    if (wbStep2ControlSummary) {
      if (circuit === 'control_procesos') {
        wbStep2ControlSummary.classList.remove('hidden');
        wbStep2ControlSummary.style.display = 'block';
      } else {
        wbStep2ControlSummary.classList.add('hidden');
        wbStep2ControlSummary.style.display = 'none';
      }
    }
    if (wbClearanceKinematicsCard) {
      wbClearanceKinematicsCard.style.display = circuit === 'control_procesos' ? 'none' : '';
    }
  }

  // Controlador del Conmutador de Circuitos (Decisión 6-B, 8-C & 3-C++ Harel Statechart XOR)
  function setCircuit(circuit) {
    currentCircuit = circuit || 'bombeo';
    if (inputCircuit) inputCircuit.value = currentCircuit;
    applyCircuitStatechartXOR(currentCircuit);
    circuitPills.forEach(function (p) {
      var isMatch = p.getAttribute('data-circuit') === currentCircuit;
      if (isMatch) {
        p.classList.add('active');
        p.setAttribute('aria-pressed', 'true');
      } else {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      }
    });
    if (panelBombeo) {
      if (currentCircuit === 'bombeo') {
        panelBombeo.classList.remove('hidden');
        panelBombeo.style.display = '';
      } else {
        panelBombeo.classList.add('hidden');
        panelBombeo.style.display = 'none';
      }
    }
    if (panelFlotacion) {
      if (currentCircuit === 'flotacion') {
        panelFlotacion.classList.remove('hidden');
        panelFlotacion.style.display = '';
      } else {
        panelFlotacion.classList.add('hidden');
        panelFlotacion.style.display = 'none';
      }
    }
    if (panelFiltracion) {
      if (currentCircuit === 'filtracion') {
        panelFiltracion.classList.remove('hidden');
        panelFiltracion.style.display = '';
      } else {
        panelFiltracion.classList.add('hidden');
        panelFiltracion.style.display = 'none';
      }
    }
    if (panelControl) {
      if (currentCircuit === 'control_procesos') {
        panelControl.classList.remove('hidden');
        panelControl.style.display = '';
      } else {
        panelControl.classList.add('hidden');
        panelControl.style.display = 'none';
      }
    }

    var simHeadline = document.getElementById('sim-headline-text');
    var simContextPill = document.getElementById('sim-circuit-context-pill');
    if (simHeadline) {
      if (currentCircuit === 'flotacion') {
        simHeadline.textContent = isEs
          ? 'Cinética de celda y retención de volumen'
          : 'Cell Kinetics & Volume Retention';
        if (simContextPill) simContextPill.textContent = isEs ? 'Flotación • Agitación' : 'Flotation • Kinetics';
      } else if (currentCircuit === 'filtracion') {
        simHeadline.textContent = isEs
          ? 'Deshidratación de torta y ciclo de filtrado'
          : 'Cake Dewatering & Filter Cycle';
        if (simContextPill) simContextPill.textContent = isEs ? 'Filtración • 16 bar' : 'Filtration • 16 bar';
      } else if (currentCircuit === 'control_procesos') {
        simHeadline.textContent = isEs
          ? 'Control gravimétrico de pulpa y granulometría (Marcy / ASTM E11)'
          : 'Pulp Gravimetric Control & Particle Sizing (Marcy / ASTM E11)';
        if (simContextPill) simContextPill.textContent = isEs ? 'Control • Laboratorio' : 'Control • Lab';
      } else {
        simHeadline.textContent = isEs
          ? 'Transporte hidráulico y velocidad crítica (Durand)'
          : 'Slurry Hydraulic Transport & Critical Velocity (Durand)';
        if (simContextPill) simContextPill.textContent = isEs ? 'Bombeo • Durand' : 'Pumping • Durand';
      }
    }

    updateDossier();
  }

  circuitPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var c = pill.getAttribute('data-circuit');
      if (c) {
        setCircuit(c);
        publishWorkbenchUpdate({ circuit: c, intent: isOpex ? 'opex' : 'capex', source: 'QuoteWizard' });
      }
    });
  });

  // Barra de Asistencia Mutuamente Excluyente en Paso 01 (Decisión 3-B)
  var assistPills = document.querySelectorAll('.assist-pill-btn[data-assist-target]');
  var assistDrawers = ['worn-piece-details', 'smat-decoder-details', 'custom-equip-details']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function syncAssistPillsState() {
    assistPills.forEach(function (btn) {
      var targetId = btn.getAttribute('data-assist-target');
      var targetEl = targetId ? document.getElementById(targetId) : null;
      var isOpen = Boolean(targetEl && targetEl.open);
      btn.classList.toggle('active', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  assistPills.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-assist-target');
      var targetEl = targetId ? document.getElementById(targetId) : null;
      if (!targetEl) return;
      var willOpen = !targetEl.open;
      assistDrawers.forEach(function (d) {
        if (d && d !== targetEl) d.open = false;
      });
      targetEl.open = willOpen;
      syncAssistPillsState();
    });
  });

  assistDrawers.forEach(function (drawer) {
    drawer.addEventListener('toggle', function () {
      if (drawer.open) {
        assistDrawers.forEach(function (other) {
          if (other && other !== drawer) other.open = false;
        });
      }
      syncAssistPillsState();
    });
  });

  stressChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      stressChips.forEach(function (c) {
        c.classList.remove('active');
        c.classList.add('chip-ghost');
        c.setAttribute('data-confirmed', 'false');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.classList.remove('chip-ghost');
      chip.setAttribute('data-confirmed', 'true');
      chip.setAttribute('aria-pressed', 'true');
      if (inputStressSymptom) {
        inputStressSymptom.value = chip.getAttribute('data-symptom') || 'roca_dura';
      }
      flashInk(chip);
      runSlurryCalculation();
      updateDossier();
    });
  });

  flotChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      flotChips.forEach(function (c) {
        c.classList.remove('active');
        c.classList.add('chip-ghost');
        c.setAttribute('data-confirmed', 'false');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.classList.remove('chip-ghost');
      chip.setAttribute('data-confirmed', 'true');
      chip.setAttribute('aria-pressed', 'true');
      if (inputFlotCondition) {
        inputFlotCondition.value = chip.getAttribute('data-flot-cond') || 'sulfuros_alta_agitacion';
      }
      flashInk(chip);
      updateDossier();
    });
  });

  filtChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      filtChips.forEach(function (c) {
        c.classList.remove('active');
        c.classList.add('chip-ghost');
        c.setAttribute('data-confirmed', 'false');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.classList.remove('chip-ghost');
      chip.setAttribute('data-confirmed', 'true');
      chip.setAttribute('aria-pressed', 'true');
      if (inputFiltCondition) {
        inputFiltCondition.value = chip.getAttribute('data-filt-cond') || 'jales_secos';
      }
      flashInk(chip);
      updateDossier();
    });
  });

  // Ejemplos canónicos por circuito: SMAT-PUMP-6X4-WETKIT | SMAT-FLOT-100FT-MECH | SMAT-FILT-1500-PRESS
  function buildSmatCode(arg1, arg2, arg3, _arg4) {
    if (arg1 === 'bombeo' || arg1 === 'flotacion' || arg1 === 'filtracion' || arg1 === 'control_procesos') {
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

  var atomicPartsList = [];
  try {
    var rawAtomic = container?.getAttribute('data-atomic-parts');
    if (rawAtomic) atomicPartsList = JSON.parse(rawAtomic);
  } catch (e) { }
  var leadEndpointUrl = container?.getAttribute('data-lead-endpoint') || DEFAULT_SMAT_LEAD_WEBHOOK_URL;
  var currentAtomicCode = '';
  var currentHydraulicMetrics = {};
  var currentTcoMetrics = {};
  var currentPartSpecs = {};
  var currentClearanceEval = {};
  var currentKinematics = {};
  var currentMetrology = null;

  function decodeSmatCode(codeStr) {
    var parsed = parseSmatPartCode(codeStr, isEs ? 'es' : 'en');
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

  function handleDecodeAction() {
    var rawCode = inputDecoder?.value.trim();
    if (!rawCode) {
      if (decoderStatus) {
        decoderStatus.textContent = isEs ? 'Ingrese un código SMAT o refacción válido (ej. E4083 o SMAT-PUMP-6X4-WETKIT)' : 'Enter a valid SMAT or part code (e.g. E4083 or SMAT-PUMP-6X4-WETKIT)';
        decoderStatus.className = 'decoder-status error';
      }
      return;
    }

    var decoded = decodeSmatCode(rawCode);
    if (decoded) {
      currentAtomicCode = decoded.atomic_code || '';
      setCircuit(decoded.circuit);
      if (decoded.circuit === 'bombeo') {
        if (selectRole) selectRole.value = decoded.role;
        if (selectPipeSize) selectPipeSize.value = decoded.size;
      } else if (decoded.circuit === 'flotacion') {
        if (selectRoleFlot) selectRoleFlot.value = decoded.role;
        if (selectFlotCapacity) selectFlotCapacity.value = decoded.size;
      } else if (decoded.circuit === 'filtracion') {
        if (selectRoleFilt) selectRoleFilt.value = decoded.role;
        if (selectFiltCapacity) selectFiltCapacity.value = decoded.size;
      } else if (decoded.circuit === 'control_procesos') {
        if (selectRoleCtrl) selectRoleCtrl.value = decoded.role;
        if (selectCtrlSpec) selectCtrlSpec.value = decoded.size;
      }
      if (inputDetails) {
        if (decoded.atomic_code) {
          inputDetails.value = (isEs ? 'Refacción específica ' : 'Specific spare ') + decoded.atomic_code + ' (' + decoded.atomic_label + ') - ' + decoded.atomic_metallurgy + '. Verificación dimensional 1:1 en banco Durango.';
        } else {
          inputDetails.value = 'Configuración según código institucional ' + decoded.code + '. Verificación dimensional 1:1 en banco Durango.';
        }
      }
      if (decoderStatus) {
        var statusLabel = decoded.atomic_code ? (decoded.atomic_code + ' → ' + decoded.code) : decoded.code;
        decoderStatus.textContent = isEs ? 'Configuración cargada: ' + statusLabel : 'Configuration loaded: ' + statusLabel;
        decoderStatus.className = 'decoder-status success';
      }
      updateRoleCriteriaBar();
      runSlurryCalculation();
      updateDossier();
    } else {
      if (decoderStatus) {
        decoderStatus.textContent = isEs ? 'Código no reconocido. Verifique el formato institucional SMAT.' : 'Unrecognized code. Please verify SMAT standard format.';
        decoderStatus.className = 'decoder-status error';
      }
    }
  }

  if (btnDecoder) btnDecoder.addEventListener('click', handleDecodeAction);
  if (inputDecoder) {
    inputDecoder.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDecodeAction();
      }
    });
  }

  var presetsMap = {
    sag_primary: { flow: SLURRY_PRESETS.sag_primary.flowM3H, solids: SLURRY_PRESETS.sag_primary.solidsWeightPercent, d80: SLURRY_PRESETS.sag_primary.particleSizeD80Microns, circuit: 'bombeo', role: 'solo_impulsor', pipeSize: '8x6' },
    flotation_rougher: { flow: SLURRY_PRESETS.flotation_rougher.flowM3H, solids: SLURRY_PRESETS.flotation_rougher.solidsWeightPercent, d80: SLURRY_PRESETS.flotation_rougher.particleSizeD80Microns, circuit: 'flotacion', role: 'rotor_estator', flotCap: '100ft' },
    tailings_thickened: { flow: SLURRY_PRESETS.tailings_thickened.flowM3H, solids: SLURRY_PRESETS.tailings_thickened.solidsWeightPercent, d80: SLURRY_PRESETS.tailings_thickened.particleSizeD80Microns, circuit: 'bombeo', role: 'skid_bomba', pipeSize: '8x6' },
    emergency_6x4: { flow: SLURRY_PRESETS.emergency_6x4.flowM3H, solids: SLURRY_PRESETS.emergency_6x4.solidsWeightPercent, d80: SLURRY_PRESETS.emergency_6x4.particleSizeD80Microns, circuit: 'bombeo', role: 'kit_wet_end', pipeSize: '6x4' }
  };

  presetChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var pId = chip.getAttribute('data-preset');
      var p = presetsMap[pId];
      if (!p) return;

      presetChips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');

      var durandAcc = document.getElementById('durand-accordion');
      if (durandAcc) durandAcc.open = true;

      if (p.circuit) setCircuit(p.circuit);
      if (sliderFlow) sliderFlow.value = p.flow;
      if (sliderSolids) sliderSolids.value = p.solids;
      if (sliderD80) sliderD80.value = p.d80;

      if (p.circuit === 'flotacion') {
        if (selectRoleFlot && p.role) selectRoleFlot.value = p.role;
        if (selectFlotCapacity && p.flotCap) selectFlotCapacity.value = p.flotCap;
      } else {
        if (selectRole && p.role) selectRole.value = p.role;
        if (selectPipeSize && p.pipeSize) selectPipeSize.value = p.pipeSize;
      }

      runSlurryCalculation();
      updateDossier();
    });
  });

  if (customEquipDetails) {
    customEquipDetails.addEventListener('toggle', function () {
      isCustomEquipment = customEquipDetails.open;
      updateDossier();
    });

    [customEquipType, customEquipCapacity, customEquipNotes].forEach(function (inp) {
      if (inp) {
        inp.addEventListener('input', updateDossier);
      }
    });
  }

  var packageBundlePanel = document.getElementById('package-bundle-panel');
  var photoUploadRow = document.getElementById('photo-upload-row');
  var segmentBtns = document.querySelectorAll('.segment-btn');

  if (!isOpex) {
    if (btnCapex) {
      btnCapex.classList.add('selected');
      var rCapex = btnCapex.querySelector('input');
      if (rCapex) rCapex.checked = true;
    }
    if (btnOpex) btnOpex.classList.remove('selected');
    if (packageBundlePanel) packageBundlePanel.classList.remove('hidden');
    if (photoUploadRow) photoUploadRow.classList.add('hidden');
  }

  segmentBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      segmentBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var r = btn.querySelector('input');
      if (r) r.checked = true;
      updateDossier();
    });
  });

  if (btnOpex && btnCapex) {
    btnOpex.addEventListener('click', function () {
      isOpex = true;
      btnOpex.classList.add('selected');
      btnCapex.classList.remove('selected');
      btnOpex.querySelector('input').checked = true;
      if (packageBundlePanel) packageBundlePanel.classList.add('hidden');
      if (photoUploadRow) photoUploadRow.classList.remove('hidden');
      updateDossier();
    });

    btnCapex.addEventListener('click', function () {
      isOpex = false;
      btnCapex.classList.add('selected');
      btnOpex.classList.remove('selected');
      btnCapex.querySelector('input').checked = true;
      if (packageBundlePanel) packageBundlePanel.classList.remove('hidden');
      if (photoUploadRow) photoUploadRow.classList.add('hidden');
      updateDossier();
    });
  }

  document.querySelectorAll('input[name="pkg_item"]').forEach(function (cb) {
    cb.addEventListener('change', updateDossier);
  });

  var photoInput = document.getElementById('wb-photo-input');
  var photoStatus = document.getElementById('photo-status');
  var hasProcessedPhoto = false;

  if (photoInput && photoStatus) {
    photoInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;

      photoStatus.textContent = '...';
      var reader = new FileReader();
      reader.onload = function (evt) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement('canvas');
          var maxDim = 1200;
          var width = img.width;
          var height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(function (blob) {
            hasProcessedPhoto = true;
            var kb = blob ? Math.round(blob.size / 1024) : Math.round(file.size / 1024);
            var isEn = window.location.pathname.startsWith('/en');
            photoStatus.textContent = isEn
              ? '✓ Photo ready in memory (' + kb + ' KB) for 1:1 match'
              : '✓ Foto lista en memoria (' + kb + ' KB) para cotejo 1:1';
          }, 'image/jpeg', 0.7);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  altChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      altChips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      selectedAltitude = Number(chip.getAttribute('data-alt')) || 0;
      if (valAltitude) {
        valAltitude.textContent = selectedAltitude.toLocaleString() + ' msnm';
      }
      runSlurryCalculation();
      updateDossier();
    });
  });

  tcoAlloyBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tcoAlloyBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      selectedTcoAlloy = btn.getAttribute('data-alloy') || 'A05';
      runSlurryCalculation();
      updateDossier();
    });
  });

  function runSlurryCalculation() {
    var Q = Number(sliderFlow?.value) || 180;
    var Cw = Number(sliderSolids?.value) || 45;
    var d80 = Number(sliderD80?.value) || 180;
    var downtimeHours = Number(sliderDowntime?.value) || 4;
    var Ss = Number(sliderSg?.value) || 2.7;
    var pHVal = sliderPh ? (Number(sliderPh.value) || 7.0) : 7.0;
    var pipeSeriesVal = selectPipeSize?.value || '6x4';
    var D_mm = resolvePipeDiameterMm(pipeSeriesVal);
    var stressSymVal = inputStressSymptom?.value || '';

    if (valFlow) valFlow.textContent = Q + ' m³/h';
    if (valSolids) valSolids.textContent = Cw + '%';
    if (valD80) valD80.textContent = d80 + ' µm';
    if (valSg) valSg.textContent = Ss.toFixed(2);
    if (valPh) valPh.textContent = 'pH ' + pHVal.toFixed(1);
    if (valPipeMm) {
      valPipeMm.textContent = isEs
        ? `Diámetro interno hidráulico (D): ${D_mm} mm (Serie ${pipeSeriesVal})`
        : `Internal hydraulic diameter (D): ${D_mm} mm (${pipeSeriesVal} Series)`;
    }
    if (valDowntime) valDowntime.textContent = downtimeHours + ' hrs';

    var simOut = calculateSlurryMetrics({
      flowM3H: Q,
      solidsWeightPercent: Cw,
      particleSizeD80Microns: d80,
      solidsSpecificGravity: Ss,
      pipeDiameterMm: D_mm,
      pipeSeries: pipeSeriesVal,
      altitudeM: selectedAltitude,
      pH: pHVal,
      stressSymptom: stressSymVal
    });
    var res = simOut.results;
    var altData = calculateAltitudeCorrection(selectedAltitude);

    var pAtm = altData.pAtmHeadMca;
    var deltaNpsh = altData.deltaNpshLossM;
    var kh = altData.motorDeratingFactor;

    if (altitudeNpshHint) {
      if (selectedAltitude >= 2400) {
        altitudeNpshHint.textContent = isEs
          ? `Patm = ${pAtm.toFixed(2)} mca. ΔNPSHa = -${deltaNpsh.toFixed(2)} m. Derating de motor IEC: ${(kh * 100).toFixed(0)}% (Sierra Madre Occidental).`
          : `Patm = ${pAtm.toFixed(2)} mca. ΔNPSHa = -${deltaNpsh.toFixed(2)} m. IEC motor derating: ${(kh * 100).toFixed(0)}% (High altitude mining).`;
      } else if (selectedAltitude >= 1500) {
        altitudeNpshHint.textContent = isEs
          ? `Patm = ${pAtm.toFixed(2)} mca. ΔNPSHa = -${deltaNpsh.toFixed(2)} m. Derating motor: ${(kh * 100).toFixed(0)}% (Meseta Central).`
          : `Patm = ${pAtm.toFixed(2)} mca. ΔNPSHa = -${deltaNpsh.toFixed(2)} m. Motor derating: ${(kh * 100).toFixed(0)}% (Plateau).`;
      } else {
        altitudeNpshHint.textContent = isEs
          ? `Patm = 10.33 mca. Presión atmosférica plena al nivel del mar (Costa).`
          : `Patm = 10.33 mca. Full atmospheric pressure at sea level (Coast).`;
      }
    }

    var Sm = res.slurrySpecificGravity;
    var Cv = res.solidsVolumetricPercent;
    var Vc = res.criticalSettlingVelocityMs;
    var Vrec = res.recommendedPipeVelocityMs;
    var V_actual = res.actualPipeVelocityMs;
    var hrFactor = res.headDeratingFactorHr;
    var wearRatio = res.wearLifeRatio;

    if (regimePill && regimeDetail) {
      if (V_actual > Vrec) {
        regimePill.className = 'regime-pill safe';
        regimePill.innerHTML = `<span class="pulsing-dot pulsing-dot-green"></span> ${isEs ? 'Régimen Seguro / Flujo Homogéneo (V > 1.25 Vc)' : 'Safe Regime / Homogeneous Flow (V > 1.25 Vc)'}`;
        regimeDetail.textContent = isEs ? ('Velocidad en línea: ' + V_actual.toFixed(2) + ' m/s (Límite: ' + Vc.toFixed(2) + ' m/s)') : ('Line velocity: ' + V_actual.toFixed(2) + ' m/s (Limit: ' + Vc.toFixed(2) + ' m/s)');
      } else if (V_actual >= Vc) {
        regimePill.className = 'regime-pill warning';
        regimePill.innerHTML = `<span class="pulsing-dot pulsing-dot-amber"></span> ${isEs ? 'Límite de Depósito / Transición (V ≈ Vc)' : 'Deposition Boundary / Transition (V ≈ Vc)'}`;
        regimeDetail.textContent = isEs ? ('Operación en límite crítico: ' + V_actual.toFixed(2) + ' m/s') : ('Operating near critical limit: ' + V_actual.toFixed(2) + ' m/s');
      } else {
        regimePill.className = 'regime-pill danger';
        regimePill.innerHTML = `<span class="pulsing-dot pulsing-dot-red"></span> ${isEs ? 'Riesgo de Sedimentación / Embancamiento (V < Vc)' : 'Sanding / Settling Risk (V < Vc)'}`;
        regimeDetail.textContent = isEs ? ('Velocidad insuficiente: ' + V_actual.toFixed(2) + ' m/s < ' + Vc.toFixed(2) + ' m/s') : ('Insufficient velocity: ' + V_actual.toFixed(2) + ' m/s < ' + Vc.toFixed(2) + ' m/s');
      }
    }

    var tonsPerHourSlurry = Q * Sm;
    var tonsPerHourSolids = tonsPerHourSlurry * (Cw / 100);
    var tonsAtRisk = Math.round(tonsPerHourSolids * downtimeHours);
    if (tcoTonnageVal) {
      tcoTonnageVal.textContent = '~' + tonsAtRisk.toLocaleString() + ' ton';
    }

    if (tcoSavingsVal) {
      if (selectedTcoAlloy === 'A05') {
        tcoSavingsVal.textContent = isEs
          ? 'Aleación A05 (>650 HB) proyecta ~2,400 hrs de vida útil, evitando hasta ~7 paros no programados al año vs fundición estándar.'
          : 'A05 Alloy (>650 HB) projects ~2,400 hrs wear life, avoiding up to ~7 unscheduled shutdowns/yr vs standard iron.';
      } else {
        tcoSavingsVal.textContent = isEs
          ? 'Fundición convencional proyecta ~800 hrs de vida útil, requiriendo hasta 10 intervenciones de recambio por año.'
          : 'Standard iron projects ~800 hrs wear life, requiring up to 10 replacement shutdowns per year.';
      }
    }

    var normalizedRecMatKey = normalizeMaterialKey(res.recommendedMaterialKey || res.recommendedMaterial);
    var matEntry = WET_END_MATERIAL_MATRIX[normalizedRecMatKey] || WET_END_MATERIAL_MATRIX.alto_cromo_cr27;
    var matName = res.recommendedMaterial === 'A05'
      ? 'High Chrome A05 (>650 HB)'
      : (isEs ? matEntry.nameEs : matEntry.nameEn);
    var elPumpMatSelect = document.getElementById('wb-pump-material');
    if (elPumpMatSelect && !elPumpMatSelect.dataset.userTouched && normalizedRecMatKey) {
      elPumpMatSelect.value = normalizedRecMatKey;
    }
    renderWetEndMaterialMatrixCard(elPumpMatSelect ? normalizeMaterialKey(elPumpMatSelect.value) : normalizedRecMatKey);
    var lifeHrs = res.estimatedImpellerLifeHours;

    currentHydraulicMetrics = {
      flow_m3h: Q,
      solids_cw: Cw,
      d80_um: d80,
      solid_sg: Ss,
      pulp_ph: pHVal,
      pipe_diameter_mm: D_mm,
      pipe_series: pipeSeriesVal,
      slurry_sg: Number(Sm.toFixed(2)),
      solids_cv: Number(Cv.toFixed(1)),
      durand_fl: res.durandFactorFL,
      critical_velocity_ms: Number(Vc.toFixed(2)),
      safe_velocity_ms: Number(Vrec.toFixed(2)),
      line_velocity_ms: Number(V_actual.toFixed(2)),
      head_ratio: Number(hrFactor.toFixed(3)),
      eff_ratio_er: Number(res.effDeratingFactorEr.toFixed(3)),
      impeller_life_h: lifeHrs,
      motor_derating_iec: Number(kh.toFixed(3)),
      k_motor_alt: simOut.combinedMotorAltitudeMultiplier,
      motor_sizing_penalty_pct: simOut.motorSizingPenaltyPct,
      wear_life_ratio: wearRatio,
      altitude_msnm: selectedAltitude,
      p_atm_mca: Number(pAtm.toFixed(2)),
      patm_mca: Number(pAtm.toFixed(2)),
      delta_npsh_m: Number(deltaNpsh.toFixed(2)),
      recommended_alloy: matName,
      recommended_material_key: res.recommendedMaterialKey,
      recommended_material_code: res.recommendedMaterialCode,
      estimated_life_hrs: lifeHrs
    };

    var elAltLiveStrip = document.getElementById('wb-altitude-live-strip');
    if (elAltLiveStrip) {
      elAltLiveStrip.textContent = 'Patm = ' + pAtm.toFixed(2) + ' mca | -ΔNPSHa = ' + deltaNpsh.toFixed(2) + ' m | IEC 60034-1 = ' + kh.toFixed(3) + ' | K_motor,alt = ' + simOut.combinedMotorAltitudeMultiplier + 'x (+' + simOut.motorSizingPenaltyPct + '%)';
    }
    var elDossierHr = document.getElementById('metric-hr');
    var elDossierEr = document.getElementById('metric-er');
    var elDossierWearHours = document.getElementById('metric-wear-hours');
    var elDossierPatm = document.getElementById('metric-patm-mca');
    var elDossierMotorIec = document.getElementById('metric-motor-iec');
    var elDossierKMotorAlt = document.getElementById('metric-k-motor-alt');
    if (elDossierHr) elDossierHr.textContent = hrFactor.toFixed(3);
    if (elDossierEr) elDossierEr.textContent = res.effDeratingFactorEr.toFixed(3);
    if (elDossierWearHours) {
      elDossierWearHours.textContent = lifeHrs.toLocaleString('en-US') + ' h (' + wearRatio.toFixed(1) + 'x vs ' + (isEs ? 'FG' : 'GI') + ')';
    }
    if (elDossierPatm) elDossierPatm.textContent = pAtm.toFixed(2) + ' mca';
    if (elDossierMotorIec) elDossierMotorIec.textContent = kh.toFixed(3);
    if (elDossierKMotorAlt) elDossierKMotorAlt.textContent = simOut.combinedMotorAltitudeMultiplier + 'x';

    currentTcoMetrics = {
      tco_downtime_hrs: downtimeHours,
      tco_tons_at_risk: tonsAtRisk,
      tco_alloy: selectedTcoAlloy,
      tco_summary: tcoSavingsVal ? tcoSavingsVal.textContent : ''
    };

    var metricSmCv = document.getElementById('metric-sm-cv');
    var metricFl = document.getElementById('metric-fl');
    var metricCv = document.getElementById('metric-cv');
    var metricVRec = document.getElementById('metric-v-rec');
    var metricDeratingHr = document.getElementById('metric-derating-hr');
    var metricVActual = document.getElementById('metric-v-actual');
    var metricDeltaNpsh = document.getElementById('metric-delta-npsh');
    var metricRationale = document.getElementById('metric-rationale');
    var quickVc = document.getElementById('quick-vc');
    var quickSmCv = document.getElementById('quick-sm-cv');
    var quickHrDerating = document.getElementById('quick-hr-derating');
    var quickAlloyRatio = document.getElementById('quick-alloy-ratio');

    if (metricVc) metricVc.textContent = Vc.toFixed(2) + ' m/s';
    if (metricVActual) metricVActual.textContent = V_actual.toFixed(2) + ' / ' + Vrec.toFixed(2) + ' m/s';
    if (metricVRec) metricVRec.textContent = Vrec.toFixed(2) + ' m/s';
    if (metricFl && res.durandFactorFL !== undefined) metricFl.textContent = res.durandFactorFL.toFixed(2);
    if (metricCv) metricCv.textContent = Cv.toFixed(1) + '%';
    if (metricSmCv) metricSmCv.textContent = Sm.toFixed(2) + ' kg/L (' + Cv.toFixed(1) + '% Cv)';
    if (metricDeratingHr) {
      metricDeratingHr.innerHTML = 'HR ' + hrFactor.toFixed(2) + ' • ER <span id="metric-derating-er">' + res.effDeratingFactorEr.toFixed(2) + '</span>';
    }
    if (metricDeltaNpsh) {
      metricDeltaNpsh.textContent = '-' + deltaNpsh.toFixed(2) + ' m (Patm ' + pAtm.toFixed(2) + ' mca)';
    }
    document.querySelectorAll('#metric-delta-npsh').forEach(function (el) {
      el.textContent = '-' + deltaNpsh.toFixed(2) + ' m (Patm ' + pAtm.toFixed(2) + ' mca)';
    });
    if (metricMaterial) metricMaterial.textContent = matName;
    if (metricLife) metricLife.textContent = '~' + lifeHrs + ' h (' + wearRatio.toFixed(1) + '×)';
    if (metricRationale) metricRationale.textContent = isEs ? res.rationaleEs : res.rationaleEn;

    if (quickVc) quickVc.textContent = Vc.toFixed(2) + ' m/s';
    if (quickSmCv) quickSmCv.textContent = Sm.toFixed(2) + ' kg/L (' + Cv.toFixed(1) + '% Cv)';
    if (quickHrDerating) quickHrDerating.textContent = 'HR ' + hrFactor.toFixed(2) + ' • Motor ' + (kh * 100).toFixed(0) + '%';
    if (quickAlloyRatio) quickAlloyRatio.textContent = res.recommendedMaterial + ' (' + wearRatio.toFixed(1) + '×)';
    if (miniAlloyBadge) miniAlloyBadge.textContent = isEs ? 'Acople 1:1 Certificado' : 'Certified 1:1 Fit';

    var ctrlSgVal = ctrlSgInput ? (parseFloat(ctrlSgInput.value) || Ss) : Ss;
    var ctrlCwVal = ctrlCwInput ? (parseFloat(ctrlCwInput.value) || Cw) : Cw;
    var ctrlRhopVal = ctrlRhopInput ? (parseFloat(ctrlRhopInput.value) || Sm) : Sm;
    var ctrlP80Val = ctrlP80Input ? (parseFloat(ctrlP80Input.value) || d80) : d80;
    var ctrlD95Val = ctrlD95Input ? (parseFloat(ctrlD95Input.value) || Math.max(0.05, (ctrlP80Val * 1.4) / 1000)) : Math.max(0.05, (ctrlP80Val * 1.4) / 1000);
    var ctrlLibVal = ctrlLibInput ? (parseFloat(ctrlLibInput.value) || 75) : 75;
    var ctrlGradeVal = ctrlGradeInput ? (parseFloat(ctrlGradeInput.value) || 1.2) : 1.2;
    var ctrlAirPsiVal = ctrlAirPsiInput ? (parseFloat(ctrlAirPsiInput.value) || 85) : 85;
    var ctrlGyCVal = ctrlGyCInput ? (parseFloat(ctrlGyCInput.value) || 0.5) : 0.5;
    var ctrlGyErrVal = ctrlGyErrInput ? (parseFloat(ctrlGyErrInput.value) || 0.05) : 0.05;
    var ctrlRrNVal = ctrlRrNInput && ctrlRrNInput.value !== '' ? parseFloat(ctrlRrNInput.value) : undefined;
    var ctrlRetP80Val = ctrlRetP80Input && ctrlRetP80Input.value !== '' ? parseFloat(ctrlRetP80Input.value) : 20.0;
    var ctrlFrameInches = (selectCtrlSpec && selectCtrlSpec.value.includes('12in')) ? 12 : 8;

    var ctrlSolveSelect = document.getElementById('wb-ctrl-solve-mode');
    if (ctrlSolveSelect && ctrlSolveSelect.value) {
      ctrlSolveMode = ctrlSolveSelect.value;
    }

    var liveMarcy = ctrlSolveMode === 'ore_density_rhop'
      ? calculateMarcyScaleReading({ pulpDensityKgL: ctrlRhopVal, solidsWeightPercent: ctrlCwVal, solveFor: 'ore_density_rhop' })
      : (ctrlSolveMode === 'rhop'
        ? calculateMarcyScaleReading({ solidsSpecificGravity: ctrlSgVal, pulpDensityKgL: ctrlRhopVal, solveFor: 'cw' })
        : calculateMarcyScaleReading({ solidsSpecificGravity: ctrlSgVal, solidsWeightPercent: ctrlCwVal, solveFor: 'sm' }));

    if (ctrlSolveMode === 'ore_density_rhop' && ctrlSgInput && document.activeElement !== ctrlSgInput) {
      ctrlSgVal = Number(liveMarcy.oreDensitySg.toFixed(2));
      ctrlSgInput.value = String(ctrlSgVal);
    } else if (ctrlSolveMode === 'rhop' && ctrlCwInput && document.activeElement !== ctrlCwInput) {
      ctrlCwVal = Number(liveMarcy.solidsWeightPercent.toFixed(1));
      ctrlCwInput.value = String(ctrlCwVal);
    } else if (ctrlSolveMode === 'cw' && ctrlRhopInput && document.activeElement !== ctrlRhopInput) {
      ctrlRhopVal = Number(liveMarcy.pulpDensityKgL.toFixed(3));
      ctrlRhopInput.value = ctrlRhopVal.toFixed(3);
    }
    var elCtrlLiveMetrics = document.getElementById('wb-ctrl-live-metrics');
    if (elCtrlLiveMetrics) {
      elCtrlLiveMetrics.textContent = (isEs ? 'Lectura Marcy: ' : 'Marcy Reading: ') +
        'Ss=' + liveMarcy.oreDensitySg.toFixed(2) + ' | Cw=' + liveMarcy.solidsWeightPercent.toFixed(1) + '% | ρp=' + liveMarcy.pulpDensityKgL.toFixed(3) + ' kg/L (' + liveMarcy.cupNetMassGrams + ' g netos / ' + liveMarcy.drySolidsMassGramsInCup + ' g secos) • ' +
        (isEs ? liveMarcy.recommendedContainerEs : liveMarcy.recommendedContainerEn);
    }

    var liveGy = calculateGyMinimumSampleMass({
      topSizeD95Mm: ctrlD95Val,
      liberationSizeMicrons: ctrlLibVal,
      headGradePercent: ctrlGradeVal,
      relativeErrorSigma: ctrlGyErrVal,
      samplingConstantC: ctrlGyCVal,
      solidsWeightPercent: ctrlCwVal,
      solidsSpecificGravity: ctrlSgVal,
      airPressurePsi: ctrlAirPsiVal
    });
    var liveSieves = recommendAstmSieveSeries({
      targetP80Microns: ctrlP80Val,
      topSizeD95Mm: ctrlD95Val,
      rosinRammlerSlopeN: ctrlRrNVal,
      retainedPercentAtP80: ctrlRetP80Val,
      frameDiameterInches: ctrlFrameInches,
      screeningMode: 'auto',
      drySampleMassGrams: Math.max(200, Math.min(1000, Math.round(liveGy.minDrySampleKg * 1000)))
    });

    var elCtrlResSm = document.getElementById('wb-ctrl-res-sm');
    var elCtrlResBias = document.getElementById('wb-ctrl-res-bias');
    var elCtrlResGy = document.getElementById('wb-ctrl-res-gy');
    var elCtrlResRr = document.getElementById('wb-ctrl-res-rr');
    if (elCtrlResSm) {
      elCtrlResSm.textContent = liveMarcy.pulpDensityKgL.toFixed(3) + ' kg/L • ' + liveMarcy.drySolidsMassGramsInCup + ' g (' + (isEs ? 'Anillo Ss ' : 'Ring SG ') + liveMarcy.recommendedRingSg.toFixed(1) + ')';
    }
    if (elCtrlResBias) {
      elCtrlResBias.textContent = '±' + Number(liveMarcy.wrongRingBiasPoints || 0).toFixed(1) + ' pts %Cw';
    }
    if (elCtrlResGy) {
      elCtrlResGy.textContent = liveGy.minDrySampleKg.toFixed(2) + ' kg (' + liveGy.batchFilterCycles + (isEs ? ' ciclo Batch • ' : ' Batch cycle • ') + liveGy.recommendedCycleMinutes + ' min • ' + liveGy.estimatedCakeMoisturePct + '% H₂O • ' + liveGy.filterPressStatus + ')';
    }
    if (elCtrlResRr) {
      elCtrlResRr.textContent = liveSieves.primaryControlMesh + ' • n = ' + liveSieves.rosinRammlerSlopeN.toFixed(2) + ' (d₆₃.₂ = ' + liveSieves.characteristicSizeD63Microns + ' µm)';
    }

    if (ctrlSieveTbody && Array.isArray(liveSieves.sieveStack)) {
      ctrlSieveTbody.innerHTML = liveSieves.sieveStack.map(function (s) {
        var isPrimaryRow = Boolean(s.isPrimaryP80Control || s.isPrimaryCut);
        var rowBg = isPrimaryRow ? 'background:#f0f9ff; font-weight:800; border-bottom:1px solid #cbd5e1;' : 'border-bottom:1px solid #e2e8f0;';
        var cumRetPct = s.cumulativeRetainedPct !== undefined ? Number(s.cumulativeRetainedPct).toFixed(1) : (100 - s.cumulativePassingPct).toFixed(1);
        var massGrams = s.estimatedMassRetainedGrams !== undefined ? Number(s.estimatedMassRetainedGrams).toFixed(1) + ' g' : s.rosinRammlerY.toFixed(2);
        var roleLabel = isEs ? (s.roleEs || '') : (s.roleEn || '');
        return '<tr style="' + rowBg + '">' +
          '<td style="padding:0.2rem 0.35rem;">' + s.mesh + ' (' + s.tylerEquivalent + ')' + (isPrimaryRow ? ' • P80' : '') + '</td>' +
          '<td style="padding:0.2rem 0.35rem;">' + s.apertureMicrons + '</td>' +
          '<td style="padding:0.2rem 0.35rem;">' + s.retainedIndividualPct.toFixed(1) + '%</td>' +
          '<td style="padding:0.2rem 0.35rem;">' + cumRetPct + '%</td>' +
          '<td style="padding:0.2rem 0.35rem;">' + s.cumulativePassingPct.toFixed(1) + '%</td>' +
          '<td style="padding:0.2rem 0.35rem;">' + massGrams + (roleLabel ? ' • ' + roleLabel : '') + '</td>' +
          '</tr>';
      }).join('');
    }

    var liveSummary = 'Ss=' + liveMarcy.solidsSpecificGravity + ' | Cw=' + ctrlCwVal + '% | Sm=' + liveMarcy.pulpDensityKgL.toFixed(3) + ' kg/L (Anillo ' + liveMarcy.recommendedRingSg + ', Sesgo ±' + Number(liveMarcy.wrongRingBiasPoints || 0).toFixed(1) + ' pts) | M_min=' + liveGy.minDrySampleKg + ' kg (d95=' + liveGy.topSizeD95Mm + ' mm, d_l=' + ctrlLibVal + ' µm, ' + liveGy.batchFilterCycles + ' ciclo Batch @ ' + ctrlAirPsiVal + ' PSI) | P80=' + ctrlP80Val + ' µm (' + liveSieves.primaryControlMesh + ', n=' + liveSieves.rosinRammlerSlopeN + ')';
    if (wbStep2ControlSummaryText) {
      wbStep2ControlSummaryText.textContent = liveSummary;
    }

    if (currentCircuit === 'control_procesos' || (currentMetrology && currentMetrology.cw !== undefined)) {
      currentMetrology = {
        cw: ctrlCwVal,
        solidsPctCw: ctrlCwVal,
        sm: liveMarcy.pulpDensityKgL,
        pulpDensityKgL: liveMarcy.pulpDensityKgL,
        rhop: liveMarcy.pulpDensityKgL,
        specificGravity: liveMarcy.solidsSpecificGravity,
        recommendedRingSg: liveMarcy.recommendedRingSg,
        wrongRingBiasPoints: liveMarcy.wrongRingBiasPoints,
        drySolidsMassGramsInCup: liveMarcy.drySolidsMassGramsInCup,
        topSizeD95Mm: liveGy.topSizeD95Mm,
        liberationSizeMicrons: ctrlLibVal,
        headGradePercent: ctrlGradeVal,
        airPressurePsi: ctrlAirPsiVal,
        samplingConstantC: ctrlGyCVal,
        relativeErrorSigma: ctrlGyErrVal,
        p80: ctrlP80Val,
        targetP80Microns: ctrlP80Val,
        primaryControlMesh: liveSieves.primaryControlMesh,
        rosinRammlerSlopeN: liveSieves.rosinRammlerSlopeN,
        retainedPercentAtP80: ctrlRetP80Val,
        dryMassKg: liveGy.minDrySampleKg,
        gySampleMassKg: liveGy.minDrySampleKg,
        batchFilterCycles: liveGy.batchFilterCycles,
        estimatedCakeMoisturePct: liveGy.estimatedCakeMoisturePct,
        recommendedCycleMinutes: liveGy.recommendedCycleMinutes,
        sieveStack: liveSieves.sieveStack,
        summary: liveSummary,
        raw: liveSummary
      };
      if (currentCircuit === 'control_procesos') {
        if (quickVc) quickVc.textContent = 'Anillo Ss ' + liveMarcy.recommendedRingSg;
        if (quickSmCv) quickSmCv.textContent = liveMarcy.pulpDensityKgL.toFixed(3) + ' kg/L (' + ctrlCwVal + '% Cw)';
        if (quickHrDerating) quickHrDerating.textContent = 'Gy M_min ' + liveGy.minDrySampleKg + ' kg (' + liveGy.batchFilterCycles + '× Batch)';
        if (quickAlloyRatio) quickAlloyRatio.textContent = 'ASTM ' + liveSieves.primaryControlMesh + ' (' + ctrlP80Val + ' µm)';
      }
    }

    if (liveTableFlow) liveTableFlow.textContent = Q + ' m³/h @ ' + Cw + '% Sólidos (Ss = ' + Ss.toFixed(2) + ', Sm = ' + Sm.toFixed(2) + ' kg/L, Cv = ' + Cv.toFixed(1) + '%, HR = ' + hrFactor.toFixed(2) + ')';
    if (liveTableD80) liveTableD80.textContent = 'd80 = ' + d80 + ' µm • ØD = ' + D_mm + ' mm (' + (d80 > 150 ? 'Cuarzo / Abrasivo Grueso' : 'Finos de Flotación') + ')';
    if (liveTableVc) liveTableVc.textContent = Vc.toFixed(2) + ' m/s (Real: ' + V_actual.toFixed(2) + ' m/s • Margen: ' + Vrec.toFixed(2) + ' m/s)';

    var activeStress = document.querySelector('.stress-chip.active');
    var isConfirmedSymptom = activeStress && activeStress.getAttribute('data-confirmed') === 'true';
    if (liveTableMat) {
      liveTableMat.textContent = isConfirmedSymptom
        ? matName
        : (isEs ? 'Dictamen técnico según severidad de pulpa (Durango) • Sugerido: ' + matName : 'Technical metallurgy dictated per slurry severity (Durango) • Suggested: ' + matName);
    }
  }

  [sliderFlow, sliderSolids, sliderD80, sliderSg, sliderPh, sliderDowntime].forEach(function (s) {
    if (s) s.addEventListener('input', function () {
      if (s === sliderSg && ctrlSgInput) ctrlSgInput.value = sliderSg.value;
      if (s === sliderSolids && ctrlCwInput) {
        ctrlCwInput.value = sliderSolids.value;
        ctrlSolveMode = 'cw';
      }
      if (s === sliderD80 && ctrlP80Input) ctrlP80Input.value = sliderD80.value;
      runSlurryCalculation();
      updateDossier();
    });
  });

  [ctrlSgInput, ctrlCwInput, ctrlRhopInput, ctrlD95Input, ctrlLibInput, ctrlGradeInput, ctrlAirPsiInput, ctrlGyCInput, ctrlGyErrInput, ctrlP80Input, ctrlRrNInput, ctrlRetP80Input].forEach(function (ctrlInp) {
    if (ctrlInp) {
      ctrlInp.addEventListener('input', function () {
        if (ctrlInp === ctrlRhopInput) {
          ctrlSolveMode = 'rhop';
        } else if (ctrlInp === ctrlCwInput) {
          ctrlSolveMode = 'cw';
        }
        if (ctrlInp === ctrlSgInput && sliderSg) sliderSg.value = ctrlSgInput.value;
        if (ctrlInp === ctrlCwInput && sliderSolids) sliderSolids.value = ctrlCwInput.value;
        if (ctrlInp === ctrlP80Input && sliderD80) {
          var pVal = Math.min(500, Math.max(30, parseFloat(ctrlP80Input.value) || 150));
          sliderD80.value = String(pVal);
        }
        runSlurryCalculation();
        updateDossier();
      });
    }
  });

  function flashInk(el) {
    if (!el) return;
    el.classList.remove('live-ink-flash');
    void el.offsetWidth;
    el.classList.add('live-ink-flash');
  }

  function switchDossierTab(tab) {
    if (tab === 'maint') {
      if (tabBtnMaint) {
        tabBtnMaint.classList.add('active');
        tabBtnMaint.setAttribute('aria-selected', 'true');
      }
      if (tabBtnSap) {
        tabBtnSap.classList.remove('active');
        tabBtnSap.setAttribute('aria-selected', 'false');
      }
      if (paneMaint) {
        paneMaint.classList.add('active-pane');
        paneMaint.classList.remove('hidden-pane');
      }
      if (paneSap) {
        paneSap.classList.remove('active-pane');
        paneSap.classList.add('hidden-pane');
      }
    } else if (tab === 'sap') {
      if (tabBtnSap) {
        tabBtnSap.classList.add('active');
        tabBtnSap.setAttribute('aria-selected', 'true');
      }
      if (tabBtnMaint) {
        tabBtnMaint.classList.remove('active');
        tabBtnMaint.setAttribute('aria-selected', 'false');
      }
      if (paneSap) {
        paneSap.classList.add('active-pane');
        paneSap.classList.remove('hidden-pane');
      }
      if (paneMaint) {
        paneMaint.classList.remove('active-pane');
        paneMaint.classList.add('hidden-pane');
      }
    }
  }

  if (tabBtnMaint) {
    tabBtnMaint.addEventListener('click', function () { switchDossierTab('maint'); });
  }
  if (tabBtnSap) {
    tabBtnSap.addEventListener('click', function () { switchDossierTab('sap'); });
  }

  var btnCopyJust = document.getElementById('btn-copy-justification');
  if (btnCopyJust && sapJustificationText) {
    btnCopyJust.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var txt = sapJustificationText.textContent || '';
      navigator.clipboard.writeText(txt).then(function () {
        btnCopyJust.textContent = isEs ? '✓ Copiado' : '✓ Copied';
        setTimeout(function () {
          btnCopyJust.textContent = isEs ? 'Copiar' : 'Copy';
        }, 2000);
      });
    });
  }

  function updateDossier() {
    if (livePriorityTag) {
      livePriorityTag.textContent = isOpex
        ? (isEs ? 'REFACCIONES / PARO DE PLANTA' : 'WEAR SPARES / SHUTDOWN')
        : (isEs ? 'EQUIPOS COMPLETOS / CIRCUITO' : 'COMPLETE CIRCUIT EQUIPMENT');
      livePriorityTag.style.color = isOpex ? '#991b1b' : '#075985';
    }

    var nameVal = inputName?.value.trim() || (isEs ? 'Ing. Residente / Solicitante' : 'Lead Process Engineer');
    var compVal = inputCompany?.value.trim() || (isEs ? 'Unidad Minera / Compañía' : 'Mining Operation / Company');
    var phoneVal = inputPhone?.value.trim() || '(618) 810-4408';
    var emailVal = inputEmail?.value.trim() || (isEs ? 'contacto@minera.com' : 'contact@miningco.com');
    var destVal = inputDest?.value.trim() || (isEs ? 'Retiro en Almacén Central Durango' : 'Durango Central Warehouse Pickup');
    var clientRefVal = inputClientRef?.value.trim() || '';

    if (liveRequester) liveRequester.textContent = nameVal;
    if (liveCompany) liveCompany.textContent = compVal;
    if (liveContact) liveContact.textContent = phoneVal + ' • ' + emailVal;
    if (liveDestination) liveDestination.textContent = destVal;

    var roleVal = '';
    var roleText = '';
    var sizeText = '';
    var condText = '';
    var smatCode = '';
    var sapMatText = '';

    if (currentCircuit === 'bombeo') {
      var selectedOpt = selectRole?.options[selectRole.selectedIndex];
      roleVal = selectRole?.value || 'kit_wet_end';
      roleText = selectedOpt ? selectedOpt.text : 'Kit Extremo Húmedo Completo';

      var pipeOpt = selectPipeSize?.options[selectPipeSize.selectedIndex];
      var pipeVal = selectPipeSize?.value || '6x4';
      sizeText = pipeOpt ? pipeOpt.text : 'Tubería 6" a 4" (Línea Principal de Proceso)';

      var symVal = inputStressSymptom?.value || '';
      var activeStressChip = document.querySelector('.stress-chip.active');
      var isConfirmed = activeStressChip && activeStressChip.getAttribute('data-confirmed') === 'true' && symVal !== '';
      var symMap = {
        roca_dura: isEs ? 'Roca Dura y Golpeteo Continuo' : 'Hard Rock & Impact',
        acido_quimica: isEs ? 'Agua Ácida / Ataque Químico' : 'Acid Slurry / Chemical Attack',
        arena_fina: isEs ? 'Arena Fina y Corte a Velocidad' : 'Fine Slurry & High Velocity',
        fuga_sello: isEs ? 'Fuga Constante en Sello / Inundación' : 'Seal Leakage / Sump Flood',
        mixta_duda: isEs ? 'Condición Mixta / Pulpa Compleja' : 'Mixed Slurry / Complex Pulp'
      };
      condText = isConfirmed && symMap[symVal]
        ? symMap[symVal]
        : (isEs ? 'Pendiente de dictamen en campo (Asesoría SMAT solicitada)' : 'Pending field assessment (SMAT technical advice requested)');

      smatCode = buildSmatCode('bombeo', roleVal, pipeVal, symVal);
      sapMatText = isEs ? 'Dictamen según severidad de pulpa (Durango)' : 'Metallurgy dictated by slurry severity (Durango)';

      if (livePipeHeader) livePipeHeader.textContent = isEs ? 'Línea de Tubería de Proceso:' : 'Process Line Pipe Size:';
      if (livePipeText) livePipeText.textContent = sizeText;
      if (liveStressHeader) liveStressHeader.textContent = isEs ? 'Condición de Operación en Planta:' : 'Plant Operating Condition:';
      if (liveStressText) liveStressText.textContent = condText;
      if (liveTableMat) {
        liveTableMat.textContent = isConfirmed
          ? (isEs ? 'Dureza Metalúrgica Certificada' : 'Certified Metallurgy Hardness')
          : (isEs ? 'Dictamen técnico según severidad de pulpa (Durango)' : 'Technical metallurgy dictated per slurry severity (Durango)');
      }

      var isSinglePart = (roleVal === 'solo_impulsor' || roleVal === 'solo_voluta');
      if (recircAlertBox) {
        if (isSinglePart) recircAlertBox.classList.remove('hidden');
        else recircAlertBox.classList.add('hidden');
      }
      if (recircWarnDossier) {
        if (isSinglePart) recircWarnDossier.classList.remove('hidden');
        else recircWarnDossier.classList.add('hidden');
      }
    } else if (currentCircuit === 'flotacion') {
      var selectedOptFlot = selectRoleFlot?.options[selectRoleFlot.selectedIndex];
      roleVal = selectRoleFlot?.value || 'rotor_estator';
      roleText = selectedOptFlot ? selectedOptFlot.text : 'Mecanismo Rotor y Estator de Elastómero';

      var capOpt = selectFlotCapacity?.options[selectFlotCapacity.selectedIndex];
      var capVal = selectFlotCapacity?.value || '100ft';
      sizeText = capOpt ? capOpt.text : 'Celda 100 ft³ (2.8 m³)';

      var fCondVal = inputFlotCondition?.value || '';
      var activeFlotChip = document.querySelector('.flot-chip.active');
      var isFConfirmed = activeFlotChip && activeFlotChip.getAttribute('data-confirmed') === 'true' && fCondVal !== '';
      var fCondMap = {
        sulfuros_alta_agitacion: isEs ? 'Sulfuros Masivos / Alta Agitación' : 'Massive Sulfides & High Shear',
        reactivos_ph_extremo: isEs ? 'Ataque por Reactivos / pH Extremo' : 'Reagent Attack & Extreme pH',
        espumado_intenso: isEs ? 'Espumado Intenso / Desgaste por Impacto' : 'Intense Froth & Slurry Impact',
        vibracion_flecha: isEs ? 'Vibración en Flecha / Cambio Preventivo' : 'Shaft Vibration & Preventive Overhaul'
      };
      condText = isFConfirmed && fCondMap[fCondVal]
        ? fCondMap[fCondVal]
        : (isEs ? 'Pendiente de dictamen en campo (Asesoría SMAT solicitada)' : 'Pending field assessment (SMAT technical advice requested)');

      smatCode = buildSmatCode('flotacion', roleVal, capVal, fCondVal);
      sapMatText = isEs ? 'Elastómero antiabrasivo de alta resiliencia' : 'High-resilience anti-abrasion elastomer';

      if (livePipeHeader) livePipeHeader.textContent = isEs ? 'Capacidad / Volumen de Celda:' : 'Flotation Cell Volume:';
      if (livePipeText) livePipeText.textContent = sizeText;
      if (liveStressHeader) liveStressHeader.textContent = isEs ? 'Condición Cinética en Celda:' : 'Kinetic Cell Condition:';
      if (liveStressText) liveStressText.textContent = condText;
      if (liveTableMat) {
        liveTableMat.textContent = isEs ? 'Elastómero antiabrasivo certificado' : 'Certified anti-abrasion elastomer';
      }

      if (recircAlertBox) recircAlertBox.classList.add('hidden');
      if (recircWarnDossier) recircWarnDossier.classList.add('hidden');
    } else if (currentCircuit === 'filtracion') {
      var selectedOptFilt = selectRoleFilt?.options[selectRoleFilt.selectedIndex];
      roleVal = selectRoleFilt?.value || 'placas_telas';
      roleText = selectedOptFilt ? selectedOptFilt.text : 'Paquete de Placas de Polipropileno y Telas Filtrantes';

      var pCapOpt = selectFiltCapacity?.options[selectFiltCapacity.selectedIndex];
      var pCapVal = selectFiltCapacity?.value || '1500';
      sizeText = pCapOpt ? pCapOpt.text : 'Placas 1500 x 1500 mm';

      var pCondVal = inputFiltCondition?.value || '';
      var activeFiltChip = document.querySelector('.filt-chip.active');
      var isPConfirmed = activeFiltChip && activeFiltChip.getAttribute('data-confirmed') === 'true' && pCondVal !== '';
      var pCondMap = {
        jales_secos: isEs ? 'Jales Secos (<15% Humedad Residual)' : 'Dry Stack Tailings (<15% Moisture)',
        recuperacion_agua: isEs ? 'Recuperación Rápida de Agua de Proceso' : 'Process Water Recovery',
        colmatacion_telas: isEs ? 'Colmatación Severa / Reemplazo Urgente' : 'Severe Blinding & Cloth Replacement',
        alta_presion_16bar: isEs ? 'Ciclos Rápidos a Alta Presión (16 bar)' : 'High-Pressure Fast Cycles (16 bar)'
      };
      condText = isPConfirmed && pCondMap[pCondVal]
        ? pCondMap[pCondVal]
        : (isEs ? 'Pendiente de dictamen en campo (Asesoría SMAT solicitada)' : 'Pending field assessment (SMAT technical advice requested)');

      smatCode = buildSmatCode('filtracion', roleVal, pCapVal, pCondVal);
      sapMatText = isEs ? 'Polipropileno virgen estabilizado 16 bar' : 'Virgin stabilized polypropylene 16 bar';

      if (livePipeHeader) livePipeHeader.textContent = isEs ? 'Dimensión de Placa Filtrante:' : 'Filter Plate Dimension:';
      if (livePipeText) livePipeText.textContent = sizeText;
      if (liveStressHeader) liveStressHeader.textContent = isEs ? 'Objetivo Operativo de Filtrado:' : 'Filtration Target / Cycle:';
      if (liveStressText) liveStressText.textContent = condText;
      if (liveTableMat) {
        liveTableMat.textContent = isEs ? 'Polipropileno virgen estabilizado 16 bar' : 'Virgin stabilized polypropylene 16 bar';
      }

      if (recircAlertBox) recircAlertBox.classList.add('hidden');
      if (recircWarnDossier) recircWarnDossier.classList.add('hidden');
    } else if (currentCircuit === 'control_procesos') {
      var selectedOptCtrl = selectRoleCtrl?.options[selectRoleCtrl.selectedIndex];
      roleVal = selectRoleCtrl?.value || 'balanza_marcy';
      roleText = selectedOptCtrl ? selectedOptCtrl.text : 'Balanza de Densidad de Pulpa y % de Sólidos (Tipo Marcy)';

      var ctrlSpecOpt = selectCtrlSpec?.options[selectCtrlSpec.selectedIndex];
      var ctrlSpecVal = selectCtrlSpec?.value || 'marcy_12_rings';
      sizeText = ctrlSpecOpt ? ctrlSpecOpt.text : 'Juego Completo 12 Carátulas (Ss 2.2 a 4.4) + Vaso 1000 cm³';
      condText = isEs ? 'Control metrológico de laboratorio y planta concentradora' : 'Metallurgical laboratory & concentrator plant control';

      smatCode = buildSmatCode('control_procesos', roleVal, ctrlSpecVal, '');
      sapMatText = roleVal === 'tamices_laboratorio'
        ? (isEs ? 'Acero Inoxidable / Bronce Certificado ASTM E11' : 'ASTM E11 Certified Stainless Steel / Brass')
        : (isEs ? 'Instrumentación Metrológica Acero Inoxidable 304 / Acero Bridado' : '304 Stainless Steel / Flanged Steel Instrumentation');

      if (livePipeHeader) livePipeHeader.textContent = isEs ? 'Especificación Metrológica:' : 'Metrological Specification:';
      if (livePipeText) livePipeText.textContent = sizeText;
      if (liveStressHeader) liveStressHeader.textContent = isEs ? 'Aplicación de Control:' : 'Control Application:';
      if (liveStressText) liveStressText.textContent = condText;
      if (liveTableMat) liveTableMat.textContent = sapMatText;

      if (recircAlertBox) recircAlertBox.classList.add('hidden');
      if (recircWarnDossier) recircWarnDossier.classList.add('hidden');
    }

    var detailsText = inputDetails?.value.trim() || (isEs ? 'Verificación dimensional de acople 1:1 en banco de pruebas de almacén central Durango.' : '1:1 dimensional check on test bench at Durango central warehouse.');

    if (liveSmatCode) liveSmatCode.textContent = smatCode;
    if (sapLiveCode) sapLiveCode.textContent = smatCode;
    if (livePartName) livePartName.textContent = roleText;
    if (livePartDetails) livePartDetails.textContent = detailsText;

    if (sapLivePart) sapLivePart.textContent = roleText.split('(')[0].trim();
    if (sapLiveMat) sapLiveMat.textContent = sapMatText;
    if (sapLiveDest) sapLiveDest.textContent = destVal;

    var sapLiveTag = document.getElementById('sap-live-tag');
    if (sapLiveTag) sapLiveTag.textContent = 'CIRCUIT-' + currentCircuit.toUpperCase();

    if (sapJustificationText) {
      sapJustificationText.textContent = isEs
        ? `Suministro de ${roleText.split('(')[0].trim()} [Código SMAT: ${smatCode}] de alta criticidad para operación en mina (${compVal}) a ${selectedAltitude} msnm. Componente con verificación dimensional 1:1, balanceo dinámico ISO 1940 G2.5 en banco de pruebas y especificación técnica validada en Almacén Central Durango para prevenir paros de turno.`
        : `Supply of ${roleText.split('(')[0].trim()} [SMAT Code: ${smatCode}] critical wear part for mining operation (${compVal}) at ${selectedAltitude} MASL. Inspected with 1:1 dimensional fit verification, ISO 1940 G2.5 dynamic balancing, and technical verification at Durango Central Warehouse.`;
    }

    var sapJustSummary = document.getElementById('sap-justification-summary');
    if (sapJustSummary) {
      sapJustSummary.textContent = isEs
        ? `Suministro de ${roleText.split('(')[0].trim()} [${smatCode}] con verificación dimensional 1:1 en banco Durango para prevenir interrupciones operativas.`
        : `Supply of ${roleText.split('(')[0].trim()} [${smatCode}] with 1:1 bench verification at Durango to prevent operational downtime.`;
    }

    flashInk(liveRequester);
    flashInk(liveCompany);
    flashInk(liveContact);
    flashInk(liveDestination);
    flashInk(livePartName);
    flashInk(liveSmatCode);
    flashInk(sapLiveCode);

    if (clientRefVal && liveClientRefBox && liveClientRefText) {
      liveClientRefBox.classList.remove('hidden');
      liveClientRefText.textContent = clientRefVal;
    } else if (liveClientRefBox) {
      liveClientRefBox.classList.add('hidden');
    }

    if (isCustomEquipment && liveCustomBox && liveCustomText) {
      liveCustomBox.classList.remove('hidden');
      var cType = customEquipType?.value.trim() || 'Equipo fuera de catálogo';
      var cCap = customEquipCapacity?.value.trim() || 'Capacidad a definir';
      var cNotes = customEquipNotes?.value.trim() || '';
      liveCustomText.textContent = `${cType} | Capacidad: ${cCap} ${cNotes ? '| Notas: ' + cNotes : ''}`;
    } else if (liveCustomBox) {
      liveCustomBox.classList.add('hidden');
    }

    try {
      var wbState = loadWorkbenchState() || {};
      var activeRoleForSpecs = selectRole?.value || 'kit_wet_end';
      var activePipeForSpecs = selectPipeSize?.value || '6x4';
      currentPartSpecs = getAtomicPartSpecs(currentAtomicCode || activeRoleForSpecs, activePipeForSpecs);

      if (dossierPartHardness && currentPartSpecs.hardness) {
        dossierPartHardness.textContent = currentPartSpecs.hardness;
      }
      if (dossierPartFitGuarantee) {
        var fitGuaranteeTxt = isEs ? currentPartSpecs.fit_guarantee_es : currentPartSpecs.fit_guarantee_en;
        if (fitGuaranteeTxt) dossierPartFitGuarantee.textContent = fitGuaranteeTxt;
      }

      var elPartStationTag = document.getElementById('wb-part-station-tag');
      var elPartNioshBadge = document.getElementById('wb-part-niosh-badge');
      var elPartGeomVal = document.getElementById('wb-part-geom-val');
      var elPartOrderVal = document.getElementById('wb-part-order-val');
      var elLivePartSpecs = document.getElementById('live-table-part-specs');

      var stLabel = (currentPartSpecs.station || ('S' + currentPartSpecs.station_number)) + ' • ' + (isEs ? (currentPartSpecs.station_name_es || currentPartSpecs.code) : (currentPartSpecs.station_name_en || currentPartSpecs.code));
      var nioshStatus = formatNioshErgonomicStatus(currentPartSpecs, isEs ? 'es' : 'en');
      if (elPartStationTag) elPartStationTag.textContent = stLabel;
      if (elPartNioshBadge) {
        elPartNioshBadge.textContent = nioshStatus.badgeText;
        elPartNioshBadge.setAttribute('data-niosh-tier', nioshStatus.mode);
      }
      if (elPartGeomVal) {
        var sphereMm = currentPartSpecs.max_sphere_mm ?? currentPartSpecs.max_particle_mm ?? 45;
        var wallMm = currentPartSpecs.wall_thickness_mm ?? 32;
        elPartGeomVal.textContent = 'ØD₂=' + currentPartSpecs.impeller_diameter_mm + ' mm (' + currentPartSpecs.vanes + ' ' + (isEs ? 'álabes' : 'vanes') + ', Paso ' + sphereMm + ' mm) | Voluta t=' + wallMm + ' mm';
      }
      if (elPartOrderVal) {
        elPartOrderVal.textContent = currentPartSpecs.assembly_order_note || currentPartSpecs.assembly_order;
      }
      if (elLivePartSpecs) {
        var sphereLive = currentPartSpecs.max_sphere_mm ?? currentPartSpecs.max_particle_mm ?? 45;
        elLivePartSpecs.textContent = stLabel + ' | ' + nioshStatus.badgeText + ' | ØD₂=' + currentPartSpecs.impeller_diameter_mm + ' mm (' + currentPartSpecs.vanes + 'v, Ø' + sphereLive + ' mm)';
      }

      var elClearanceSlider = document.getElementById('wb-clearance-slider');
      if (elClearanceSlider && !elClearanceSlider.dataset.userTouched && wbState.frontClearanceMm !== undefined) {
        elClearanceSlider.value = String(wbState.frontClearanceMm);
      }
      var claroMmVal = elClearanceSlider ? parseFloat(elClearanceSlider.value || '0.75') : 0.75;
      var matSelectEl = document.getElementById('wb-pump-material');
      var arrSelectEl = document.getElementById('wb-drive-arrangement');
      if (matSelectEl && !matSelectEl.dataset.userTouched && (wbState.pump_material || wbState.wetEndMaterial)) {
        matSelectEl.value = normalizeMaterialKey(wbState.pump_material || wbState.wetEndMaterial);
      }
      if (arrSelectEl && !arrSelectEl.dataset.userTouched && wbState.kinematics && wbState.kinematics.arrangement) {
        arrSelectEl.value = wbState.kinematics.arrangement;
      }
      var matCodeVal = matSelectEl ? normalizeMaterialKey(matSelectEl.value) : 'alto_cromo_cr27';
      renderWetEndMaterialMatrixCard(matCodeVal);
      var arrCodeVal = arrSelectEl ? arrSelectEl.value : 'CV';
      var seqPresetVal = wbAssemblySeqTest ? wbAssemblySeqTest.value : (wbState.assemblySequencePreset || 'canonical');
      var sealBranchVal = wbSealBranch ? wbSealBranch.value : (wbState.seal_branch || wbState.sealBranch || 'expeller_dry');
      var b2ValMm = wbImpellerB2 && wbImpellerB2.dataset.userTouched
        ? (Number(wbImpellerB2.value) || 48)
        : (activePipeForSpecs === '3x2' ? 38 : (activePipeForSpecs === '8x6' || activePipeForSpecs === '10x8' ? 64 : 48));

      currentClearanceEval = evaluateWetEndAssemblyInterference({
        wetEndBranch: matCodeVal === 'hule_natural'
          ? 'rubber'
          : (matCodeVal === 'poliuretano' ? 'polyurethane' : (matCodeVal === 'ceramica_sic' ? 'ceramic_sic' : 'metal')),
        sealBranch: sealBranchVal,
        frontClearanceMm: claroMmVal,
        impellerExitWidthMm: b2ValMm,
        pipeSeries: activePipeForSpecs,
        sequencePreset: seqPresetVal
      });

      var lossPctVal = currentClearanceEval.volumetricEfficiencyDropPct ?? currentClearanceEval.volumetricEfficiencyLossPct ?? 1.6;
      var pipeVelLossVal = currentClearanceEval.pipeVelocityMarginLossPct ?? Number((lossPctVal * 0.75).toFixed(2));
      var elValClearance = document.getElementById('wb-val-clearance');
      var elMetricClearanceLoss = document.getElementById('metric-clearance-loss');
      var elClearanceVelLoss = document.getElementById('wb-clearance-vel-loss');
      var elDossierPipeVelLoss = document.getElementById('wb-pipe-vel-loss');
      var elLiveCollisionNote = document.getElementById('live-assembly-collision-note');
      if (elValClearance) elValClearance.textContent = currentClearanceEval.frontClearanceMm.toFixed(2) + ' mm (Δη_v = -' + lossPctVal.toFixed(1) + '%)';
      if (elClearanceVelLoss) elClearanceVelLoss.textContent = '-' + Number(pipeVelLossVal).toFixed(1) + '%';
      if (elDossierPipeVelLoss) elDossierPipeVelLoss.textContent = Number(pipeVelLossVal).toFixed(1) + '%';
      if (elLiveCollisionNote) {
        elLiveCollisionNote.textContent = currentClearanceEval.sequenceValid
          ? (isEs ? 'Secuencia S1→S5 libre de colisión axial' : 'S1→S5 sequence collision-free')
          : (isEs ? ('BLOQUEO ' + currentClearanceEval.outOfOrderStationId + ': ' + currentClearanceEval.collisionDetailsEs) : ('BLOCKED ' + currentClearanceEval.outOfOrderStationId + ': ' + currentClearanceEval.collisionDetailsEn));
      }
      if (elMetricClearanceLoss) {
        var statusLblEs = currentClearanceEval.clearanceStatus === 'OPTIMAL_CALIBRATION'
          ? (isEs ? 'Óptimo' : 'Optimal')
          : (currentClearanceEval.clearanceStatus === 'RUBBING_RISK' ? (isEs ? 'Riesgo Roce' : 'Rubbing Risk') : (isEs ? 'Recirculación' : 'Recirculation'));
        var impactText = isEs ? currentClearanceEval.wearRatioImpact554 : currentClearanceEval.wearRatioImpact554En;
        elMetricClearanceLoss.textContent = '-' + lossPctVal.toFixed(1) + '% (' + statusLblEs + ') • ' + impactText;
      }
      if (elMetricStructuralReason) {
        elMetricStructuralReason.textContent = isEs
          ? (currentClearanceEval.structuralReasonEs || '')
          : (currentClearanceEval.structuralReasonEn || currentClearanceEval.structuralReasonEs || '');
      }
      if (metricAssemblyMassSeq) {
        var seqStatusText = currentClearanceEval.sequenceValid
          ? (isEs ? 'Secuencia 01–05 válida sin colisión axial' : 'Sequence 01–05 valid with zero axial collision')
          : (isEs ? ('BLOQUEO (' + currentClearanceEval.outOfOrderStationId + '): ' + currentClearanceEval.collisionDetailsEs) : ('BLOCKED (' + currentClearanceEval.outOfOrderStationId + '): ' + currentClearanceEval.collisionDetailsEn));
        metricAssemblyMassSeq.textContent = (isEs ? 'Masa total de rama: ' : 'Total branch mass: ') +
          currentClearanceEval.totalAssemblyMassKg.toFixed(1) + ' kg (' +
          currentClearanceEval.nioshHoistPartsCount + (isEs ? ' izajes NIOSH ≥23 kg) • ' : ' NIOSH hoists ≥23 kg) • ') +
          seqStatusText;
        metricAssemblyMassSeq.style.color = currentClearanceEval.sequenceValid ? '#0f172a' : '#dc2626';
      }

      var savedKin = wbState.kinematics || {};
      if (wbDriverPulley && !wbDriverPulley.dataset.userTouched && savedKin.driverPulleyMm) {
        wbDriverPulley.value = String(savedKin.driverPulleyMm);
      }
      if (wbDrivenPulley && !wbDrivenPulley.dataset.userTouched && savedKin.drivenPulleyMm) {
        wbDrivenPulley.value = String(savedKin.drivenPulleyMm);
      }
      if (wbMotorRpm && !wbMotorRpm.dataset.userTouched && savedKin.motorRpm) {
        wbMotorRpm.value = String(savedKin.motorRpm);
      }
      if (wbShaftPower && !wbShaftPower.dataset.userTouched && savedKin.shaftPowerKw) {
        wbShaftPower.value = String(savedKin.shaftPowerKw);
      }

      var liveDriverMm = wbDriverPulley ? (Number(wbDriverPulley.value) || 220) : (savedKin.driverPulleyMm || 220);
      var liveDrivenMm = wbDrivenPulley ? (Number(wbDrivenPulley.value) || 340) : (savedKin.drivenPulleyMm || 340);
      var liveMotorRpm = wbMotorRpm ? (Number(wbMotorRpm.value) || 1775) : (savedKin.motorRpm || 1775);
      var liveShaftKw = wbShaftPower ? (Number(wbShaftPower.value) || 55) : (savedKin.shaftPowerKw || 55);
      var liveBearingCkN = wbBearingC ? (Number(wbBearingC.value) || 145) : (savedKin.dynamicCapacityCkN || wbState.cap_c_kn || 145);

      if (wbDriverPulley) wbDriverPulley.disabled = arrCodeVal === 'DC';
      if (wbDrivenPulley) wbDrivenPulley.disabled = arrCodeVal === 'DC';
      if (wbValDriverPulley) wbValDriverPulley.textContent = arrCodeVal === 'DC' ? '1:1' : (liveDriverMm + ' mm');
      if (wbValDrivenPulley) wbValDrivenPulley.textContent = arrCodeVal === 'DC' ? '1:1' : (liveDrivenMm + ' mm');

      currentKinematics = calculateDriveAndBearingKinematics({
        arrangement: arrCodeVal,
        arrangementCode: arrCodeVal,
        motorRpm: liveMotorRpm,
        driverPulleyMm: liveDriverMm,
        drivenPulleyMm: liveDrivenMm,
        shaftPowerKw: liveShaftKw,
        dynamicCapacityCkN: liveBearingCkN,
        impellerDiameterMm: currentPartSpecs.impeller_diameter_mm || 380,
        wetEndMaterial: matCodeVal
      });

      var elMetricU2 = document.getElementById('metric-drive-u2');
      var elMetricL10h = document.getElementById('metric-drive-l10h');
      var elLiveKinematics = document.getElementById('live-table-kinematics');
      var elRubberLock = document.getElementById('wb-rubber-u2-lock');
      var l10hNum = Number(currentKinematics.bearingL10Hours ?? currentKinematics.estimatedL10hHours ?? 28500);
      var arrDisplay = currentKinematics.arrangement || currentKinematics.arrangementCode || arrCodeVal;

      if (elMetricU2) {
        elMetricU2.innerHTML = currentKinematics.tipSpeedMs.toFixed(1) + ' m/s (' + arrDisplay + ') • <span id="metric-drive-l10h">' + l10hNum.toLocaleString('en-US') + ' h</span>';
      } else if (elMetricL10h) {
        elMetricL10h.textContent = l10hNum.toLocaleString('en-US') + ' h';
      }
      if (elMetricDriveRpm) {
        elMetricDriveRpm.textContent = currentKinematics.pumpRpm + ' RPM (i = ' + Number(currentKinematics.transmissionRatio || 1).toFixed(2) + ')';
      }
      if (elMetricDriveFr) {
        elMetricDriveFr.textContent = Number(currentKinematics.beltRadialLoadKn || 0).toFixed(2) + ' kN (P = ' + Number(currentKinematics.equivalentDynamicLoadPkN || 0).toFixed(2) + ' kN)';
      }
      if (elMetricDriveFlood) {
        elMetricDriveFlood.textContent = currentKinematics.sumpFloodImmunity || 'HIGH';
      }
      if (elLiveKinematics) {
        var matHuman = matCodeVal === 'hule_natural'
          ? (isEs ? 'Hule Natural Antiabrasivo (55–65 Shore A)' : 'Natural Rubber (55–65 Shore A)')
          : (matCodeVal === 'poliuretano'
            ? (isEs ? 'Poliuretano Grado Minero (85–95 Shore A)' : 'Mining Polyurethane (85–95 Shore A)')
            : (matCodeVal === 'ceramica_sic'
              ? (isEs ? 'Carburo de Silicio Sinterizado SiC (≥2200 HV, K_Ic=4.1 MPa·√m)' : 'Sintered Silicon Carbide SiC (≥2200 HV, K_Ic=4.1 MPa·√m)')
              : (isEs ? 'Alto Cromo ASTM A532 Cr27% (≥650 HB)' : 'High Chrome ASTM A532 Cr27% (≥650 HB)')));
        var collShort = currentClearanceEval.sequenceValid
          ? (isEs ? 'Secuencia S1→S5 libre de colisión axial' : 'S1→S5 sequence collision-free')
          : (isEs ? ('BLOQUEO ' + currentClearanceEval.outOfOrderStationId + ': ' + currentClearanceEval.collisionDetailsEs) : ('BLOCKED ' + currentClearanceEval.outOfOrderStationId + ': ' + currentClearanceEval.collisionDetailsEn));
        elLiveKinematics.innerHTML = matHuman + ' | ' + arrDisplay + ' (n₂=' + currentKinematics.pumpRpm + ' RPM, u₂=' + currentKinematics.tipSpeedMs.toFixed(1) + ' m/s, F_r=' + Number(currentKinematics.beltRadialLoadKn || 0).toFixed(2) + ' kN, L₁₀ₕ=' + l10hNum.toLocaleString('en-US') + ' h) | δ=' + currentClearanceEval.frontClearanceMm.toFixed(2) + ' mm (Δη_v=-' + lossPctVal.toFixed(1) + '%, ΔV_pipe=-<span id="wb-pipe-vel-loss" data-testid="wb-pipe-vel-loss">' + Number(pipeVelLossVal).toFixed(1) + '%</span>) | <span id="live-assembly-collision-note" data-testid="live-assembly-collision-note">' + collShort + '</span>';
      }
      if (elRubberLock) {
        var showRubberLock = (matCodeVal === 'hule_natural' && currentKinematics.rubberThermalLimitExceeded);
        elRubberLock.classList.toggle('hidden', !showRubberLock);
      }

      // Compuerta Interactiva de Plausibilidad Física y Límites de Rechazo (Decisión 3 / INV-SMAT-GTE-001)
      var gateOut = validatePlantLeadInput({
        company: compVal,
        cwPct: currentHydraulicMetrics.solids_cw,
        d80Microns: currentHydraulicMetrics.d80_um,
        flowM3h: currentHydraulicMetrics.flow_m3h,
        pulpPh: currentHydraulicMetrics.pulp_ph,
        altitudeM: selectedAltitude,
        wetMaterial: matCodeVal,
        frontClearanceMm: currentClearanceEval.frontClearanceMm,
        tipSpeedMs: currentKinematics.tipSpeedMs,
        smat_code: smatCode
      });
      var elGateBadge = document.getElementById('gate-lead-status');
      var elTrustAlert = document.getElementById('trust-boundary-alert');
      var elTrustTitle = document.getElementById('trust-boundary-title');
      var elTrustReason = document.getElementById('trust-boundary-reason');
      if (elGateBadge) {
        elGateBadge.textContent = isEs ? gateOut.badgeLabelEs : gateOut.badgeLabelEn;
        elGateBadge.style.background = gateOut.plausible ? '#065f46' : '#991b1b';
      }
      if (elTrustAlert) {
        if (gateOut.activeTrustBoundaryId) {
          elTrustAlert.classList.remove('hidden');
          if (elTrustTitle) elTrustTitle.textContent = gateOut.activeTrustBoundaryTitleEs;
          if (elTrustReason) elTrustReason.textContent = gateOut.activeTrustBoundaryReasonEs;
        } else {
          elTrustAlert.classList.add('hidden');
        }
      }

      if (wbState.metrology && (wbState.metrology.cw !== undefined || wbState.metrology.solidsPctCw !== undefined || wbState.metrology.summary || wbState.metrology.raw)) {
        var wm = wbState.metrology;
        var prevMet = currentMetrology || {};
        currentMetrology = Object.assign({}, wm, prevMet, {
          cw: prevMet.cw ?? wm.cw ?? wm.solidsPctCw ?? 45,
          solidsPctCw: prevMet.solidsPctCw ?? wm.solidsPctCw ?? wm.cw ?? 45,
          sm: prevMet.sm ?? wm.sm ?? wm.pulpDensityKgL ?? 1.40,
          pulpDensityKgL: prevMet.pulpDensityKgL ?? wm.pulpDensityKgL ?? wm.sm ?? 1.40,
          rhop: prevMet.rhop ?? wm.rhop ?? wm.pulpDensityKgL ?? wm.sm ?? 1.40,
          specificGravity: prevMet.specificGravity ?? wm.specificGravity ?? 2.8,
          recommendedRingSg: prevMet.recommendedRingSg ?? wm.recommendedRingSg ?? 2.8,
          wrongRingBiasPoints: prevMet.wrongRingBiasPoints ?? wm.wrongRingBiasPoints ?? 0,
          drySolidsMassGramsInCup: prevMet.drySolidsMassGramsInCup ?? wm.drySolidsMassGramsInCup ?? 550,
          topSizeD95Mm: prevMet.topSizeD95Mm ?? wm.topSizeD95Mm ?? 2.1,
          liberationSizeMicrons: prevMet.liberationSizeMicrons ?? wm.liberationSizeMicrons ?? 100,
          headGradePercent: prevMet.headGradePercent ?? wm.headGradePercent ?? 5.0,
          airPressurePsi: prevMet.airPressurePsi ?? wm.airPressurePsi ?? 85,
          samplingConstantC: prevMet.samplingConstantC ?? wm.samplingConstantC ?? 1.35,
          relativeErrorSigma: prevMet.relativeErrorSigma ?? wm.relativeErrorSigma ?? 0.05,
          p80: prevMet.p80 ?? wm.p80 ?? wm.targetP80Microns ?? 150,
          targetP80Microns: prevMet.targetP80Microns ?? wm.targetP80Microns ?? wm.p80 ?? 150,
          primaryControlMesh: prevMet.primaryControlMesh || wm.primaryControlMesh || '#100',
          rosinRammlerSlopeN: prevMet.rosinRammlerSlopeN ?? wm.rosinRammlerSlopeN ?? 1.08,
          retainedPercentAtP80: prevMet.retainedPercentAtP80 ?? wm.retainedPercentAtP80 ?? 20,
          dryMassKg: prevMet.dryMassKg ?? wm.dryMassKg ?? wm.gySampleMassKg ?? 0.25,
          gySampleMassKg: prevMet.gySampleMassKg ?? wm.gySampleMassKg ?? wm.dryMassKg ?? 0.25,
          batchFilterCycles: prevMet.batchFilterCycles ?? wm.batchFilterCycles ?? 1,
          estimatedCakeMoisturePct: prevMet.estimatedCakeMoisturePct ?? wm.estimatedCakeMoisturePct ?? 9.5,
          recommendedCycleMinutes: prevMet.recommendedCycleMinutes ?? wm.recommendedCycleMinutes ?? 12,
          sieveStack: prevMet.sieveStack || wm.sieveStack || [],
          summary: prevMet.summary || wm.summary || wm.raw,
          raw: prevMet.raw || wm.raw || wm.summary
        });
      } else if (currentCircuit === 'control_procesos' && (!currentMetrology || currentMetrology.cw === undefined)) {
        var cwInit = Number(sliderSolids?.value) || 45;
        var p80Init = Number(sliderD80?.value) || 150;
        var defaultMarcy = calculateMarcyScaleReading({ solidsSpecificGravity: 2.8, solidsWeightPercent: cwInit });
        var defaultGy = calculateGyMinimumSampleMass({ topSizeD95Mm: Math.max(0.2, p80Init / 100), solidsWeightPercent: cwInit });
        var defaultSieves = recommendAstmSieveSeries({ targetP80Microns: p80Init, screeningMode: 'wet' });
        var initSummary = 'Ss=' + defaultMarcy.solidsSpecificGravity + ' | Cw=' + cwInit + '% | Sm=' + defaultMarcy.pulpDensityKgL + ' kg/L (Anillo ' + defaultMarcy.recommendedRingSg + ') | M_min=' + defaultGy.minDrySampleKg + ' kg (' + defaultGy.batchFilterCycles + ' ciclo Batch) | P80=' + p80Init + ' µm (' + defaultSieves.primaryControlMesh + ', n=' + defaultSieves.rosinRammlerSlopeN + ')';
        currentMetrology = {
          cw: cwInit,
          solidsPctCw: cwInit,
          sm: defaultMarcy.pulpDensityKgL,
          pulpDensityKgL: defaultMarcy.pulpDensityKgL,
          specificGravity: defaultMarcy.solidsSpecificGravity,
          recommendedRingSg: defaultMarcy.recommendedRingSg,
          p80: p80Init,
          targetP80Microns: p80Init,
          primaryControlMesh: defaultSieves.primaryControlMesh,
          rosinRammlerSlopeN: defaultSieves.rosinRammlerSlopeN,
          dryMassKg: defaultGy.minDrySampleKg,
          gySampleMassKg: defaultGy.minDrySampleKg,
          batchFilterCycles: defaultGy.batchFilterCycles,
          summary: initSummary,
          raw: initSummary
        };
      }
      var elMetrologyCard = document.getElementById('wb-metrology-bridge-card');
      var elMetrologyText = document.getElementById('wb-metrology-bridge-text');
      var elLiveRowMetrology = document.getElementById('live-row-metrology');
      var elLiveTableMetrology = document.getElementById('live-table-metrology');
      if (currentMetrology && (currentMetrology.cw !== undefined || currentMetrology.raw || currentMetrology.summary)) {
        var mSummary = currentMetrology.summary || currentMetrology.raw || ('Cw=' + (currentMetrology.cw ?? 45) + '% | Sm=' + (currentMetrology.sm ?? 1.40) + ' kg/L | P80=' + (currentMetrology.p80 ?? 150) + ' µm (' + (currentMetrology.primaryControlMesh || '#100') + ') | M_min=' + (currentMetrology.dryMassKg ?? 0.25) + ' kg');
        if (elMetrologyCard) elMetrologyCard.classList.remove('hidden');
        if (elMetrologyText) elMetrologyText.textContent = mSummary;
        if (elLiveRowMetrology) elLiveRowMetrology.classList.remove('hidden');
        if (elLiveTableMetrology) elLiveTableMetrology.textContent = mSummary;
      }
    } catch (e) { }

    try {
      var sessState = {
        name: nameVal, company: compVal, phone: phoneVal, email: emailVal,
        destination: destVal, details: detailsText, clientRef: clientRefVal,
        circuit: currentCircuit,
        role: roleVal,
        pipe_size: selectPipeSize?.value,
        stress_symptom: isConfirmed ? symVal : '',
        flot_role: selectRoleFlot?.value,
        flot_capacity: selectFlotCapacity?.value,
        flot_condition: isFConfirmed ? fCondVal : '',
        filt_role: selectRoleFilt?.value,
        filt_capacity: selectFiltCapacity?.value,
        filt_condition: isPConfirmed ? pCondVal : '',
        dim_outer_dia: dimOuterDia?.value,
        dim_shaft_bore: dimShaftBore?.value,
        altitude: selectedAltitude, tcoAlloy: selectedTcoAlloy,
        flow: sliderFlow?.value, solids: sliderSolids?.value, d80: sliderD80?.value,
        sg: sliderSg?.value, ph: sliderPh?.value,
        seal_branch: wbSealBranch?.value || 'expeller_dry',
        b2_mm: wbImpellerB2?.value || 48,
        cap_c_kn: wbBearingC?.value || 145,
        downtime: sliderDowntime?.value, isOpex: isOpex
      };
      saveWorkbenchSession(sessState);
      projectWorkbenchToDOM(container, {
        ...sessState,
        ...currentHydraulicMetrics,
        durandFactorFL: currentHydraulicMetrics.durand_fl,
        solidsVolumetricPercent: currentHydraulicMetrics.solids_cv,
        recommendedPipeVelocityMs: currentHydraulicMetrics.safe_velocity_ms,
        criticalSettlingVelocityMs: currentHydraulicMetrics.critical_velocity_ms,
        actualPipeVelocityMs: currentHydraulicMetrics.line_velocity_ms,
        slurrySpecificGravity: currentHydraulicMetrics.slurry_sg,
        pulpPh: currentHydraulicMetrics.pulp_ph,
        wearRatioImpact554: isEs ? currentClearanceEval.wearRatioImpact554 : currentClearanceEval.wearRatioImpact554En,
        sealBranch: currentClearanceEval.sealBranch,
        impellerExitWidthMm: currentClearanceEval.impellerExitWidthMm,
        dynamicCapacityCkN: currentKinematics.dynamicCapacityCkN,
        metrics: currentHydraulicMetrics,
        clearance_eval: currentClearanceEval,
        kinematics: currentKinematics,
        part_specs: currentPartSpecs,
        metrology: currentMetrology
      });
    } catch (e) { }
  }

  if (selectPipeSize) {
    selectPipeSize.addEventListener('change', function () {
      runSlurryCalculation();
      updateDossier();
    });
  }

  [
    selectRole,
    selectRoleFlot, selectFlotCapacity,
    selectRoleFilt, selectFiltCapacity,
    dimOuterDia, dimShaftBore,
    inputDetails, inputClientRef, inputName, inputCompany, inputPhone, inputEmail, inputDest
  ].forEach(function (el) {
    if (el) {
      el.addEventListener('input', updateDossier);
      el.addEventListener('change', updateDossier);
    }
  });

  function initProfile() {
    try {
      var cached = localStorage.getItem('smat_user_profile');
      if (cached) {
        var p = JSON.parse(cached);
        if (p.name && inputName) inputName.value = p.name;
        if (p.company && inputCompany) inputCompany.value = p.company;
        if (p.phone && inputPhone) inputPhone.value = p.phone;
        if (p.email && inputEmail) inputEmail.value = p.email;
        if (p.destination && inputDest) inputDest.value = p.destination;

        var chip = document.getElementById('returning-user-chip');
        var chipText = document.getElementById('user-chip-text');
        if (chip && chipText && p.name) {
          chip.classList.remove('hidden');
          chip.removeAttribute('hidden');
          var strong = chipText.querySelector('strong');
          if (strong) strong.textContent = p.name + ' (' + (p.company || 'Mina') + ')';
        }
        updateDossier();
      }
    } catch (e) { }
  }

  function sanitizeAndMigrateStorage() {
    try {
      localStorage.removeItem('smat_workbench_draft');
      sessionStorage.removeItem('smat_workbench_session');
      localStorage.removeItem('smat_workbench_v1');
      var rawWbSess = localStorage.getItem('smat_workbench_session');
      if (rawWbSess && (rawWbSess.includes('6X4D') || rawWbSess.includes('D4147'))) {
        localStorage.removeItem('smat_workbench_session');
      }
      var rawLegacySplit = localStorage.getItem('smat_workbench_v2');
      var rawCanonical = localStorage.getItem(STORAGE_KEY_V2);
      if (rawLegacySplit) {
        var parsedSplit = JSON.parse(rawLegacySplit);
        var parsedCanon = rawCanonical ? JSON.parse(rawCanonical) : {};
        var mergedV2 = mergeWorkbenchLensState(parsedSplit, parsedCanon);
        if (mergedV2 && typeof mergedV2.details === 'string' && (mergedV2.details.includes('6X4D') || mergedV2.details.includes('A05'))) {
          mergedV2.details = '';
        }
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(mergedV2));
        localStorage.removeItem('smat_workbench_v2');
      }
      var rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (rawV2) {
        var s = JSON.parse(rawV2);
        if (s && typeof s.details === 'string' && (s.details.includes('6X4D') || s.details.includes('A05'))) {
          s.details = '';
          localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(s));
        }
      }
      workbenchStateLens.migrateLegacyStorage();
    } catch (e) { }
  }
  sanitizeAndMigrateStorage();

  function loadSessionState() {
    try {
      var s = loadWorkbenchState() || (localStorage.getItem(STORAGE_KEY_V2) ? JSON.parse(localStorage.getItem(STORAGE_KEY_V2)) : null);
      if (s) {
        if (s.name && inputName) inputName.value = s.name;
        if (s.company && inputCompany) inputCompany.value = s.company;
        if (s.phone && inputPhone) inputPhone.value = s.phone;
        if (s.email && inputEmail) inputEmail.value = s.email;
        if (s.destination && inputDest) inputDest.value = s.destination;
        if (s.details && inputDetails) inputDetails.value = s.details;
        if (s.clientRef && inputClientRef) inputClientRef.value = s.clientRef;

        if (s.circuit) {
          setCircuit(s.circuit);
        }
        if (s.role && selectRole) selectRole.value = s.role;
        if (s.pipe_size && selectPipeSize) selectPipeSize.value = s.pipe_size;
        if (s.stress_symptom && inputStressSymptom) {
          inputStressSymptom.value = s.stress_symptom;
          stressChips.forEach(function (c) {
            if (c.getAttribute('data-symptom') === s.stress_symptom) {
              c.classList.add('active');
              c.classList.remove('chip-ghost');
              c.setAttribute('data-confirmed', 'true');
              c.setAttribute('aria-pressed', 'true');
            } else {
              c.classList.remove('active');
              c.classList.add('chip-ghost');
              c.setAttribute('data-confirmed', 'false');
              c.setAttribute('aria-pressed', 'false');
            }
          });
        }
        if (s.flot_role && selectRoleFlot) selectRoleFlot.value = s.flot_role;
        if (s.flot_capacity && selectFlotCapacity) selectFlotCapacity.value = s.flot_capacity;
        if (s.flot_condition && inputFlotCondition) {
          inputFlotCondition.value = s.flot_condition;
          flotChips.forEach(function (c) {
            if (c.getAttribute('data-flot-cond') === s.flot_condition) {
              c.classList.add('active');
              c.classList.remove('chip-ghost');
              c.setAttribute('data-confirmed', 'true');
              c.setAttribute('aria-pressed', 'true');
            } else {
              c.classList.remove('active');
              c.classList.add('chip-ghost');
              c.setAttribute('data-confirmed', 'false');
              c.setAttribute('aria-pressed', 'false');
            }
          });
        }
        if (s.filt_role && selectRoleFilt) selectRoleFilt.value = s.filt_role;
        if (s.filt_capacity && selectFiltCapacity) selectFiltCapacity.value = s.filt_capacity;
        if (s.filt_condition && inputFiltCondition) {
          inputFiltCondition.value = s.filt_condition;
          filtChips.forEach(function (c) {
            if (c.getAttribute('data-filt-cond') === s.filt_condition) {
              c.classList.add('active');
              c.classList.remove('chip-ghost');
              c.setAttribute('data-confirmed', 'true');
              c.setAttribute('aria-pressed', 'true');
            } else {
              c.classList.remove('active');
              c.classList.add('chip-ghost');
              c.setAttribute('data-confirmed', 'false');
              c.setAttribute('aria-pressed', 'false');
            }
          });
        }
        if (s.dim_outer_dia && dimOuterDia) dimOuterDia.value = s.dim_outer_dia;
        if (s.dim_shaft_bore && dimShaftBore) dimShaftBore.value = s.dim_shaft_bore;

        if (s.flow && sliderFlow) sliderFlow.value = s.flow;
        if (s.solids && sliderSolids) sliderSolids.value = s.solids;
        if (s.d80 && sliderD80) sliderD80.value = s.d80;
        if (s.downtime && sliderDowntime) sliderDowntime.value = s.downtime;
        if (s.altitude) {
          selectedAltitude = Number(s.altitude);
          altChips.forEach(function (c) {
            if (Number(c.getAttribute('data-alt')) === selectedAltitude) c.classList.add('active');
            else c.classList.remove('active');
          });
          if (valAltitude) valAltitude.textContent = selectedAltitude.toLocaleString() + ' msnm';
        }
        if (s.tcoAlloy) {
          selectedTcoAlloy = s.tcoAlloy;
          tcoAlloyBtns.forEach(function (b) {
            if (b.getAttribute('data-alloy') === selectedTcoAlloy) b.classList.add('active');
            else b.classList.remove('active');
          });
        }
      }
    } catch (e) { }
  }

  document.getElementById('user-chip-reset')?.addEventListener('click', function () {
    try { localStorage.removeItem('smat_user_profile'); } catch (e) { }
    [inputName, inputCompany, inputPhone, inputEmail, inputDest, inputClientRef].forEach(function (i) { if (i) i.value = ''; });
    document.getElementById('returning-user-chip')?.classList.add('hidden');
    updateDossier();
  });

  function saveProfile(d) {
    try {
      localStorage.setItem('smat_user_profile', JSON.stringify({
        name: d.name, company: d.company, phone: d.phone, email: d.email, destination: d.destination
      }));
    } catch (e) { }
  }

  var miningGroups = [];
  try {
    var raw = container?.getAttribute('data-mining-groups');
    if (raw) miningGroups = JSON.parse(raw);
  } catch (e) { }

  var hintBox = document.getElementById('mining-group-hint');
  var hintName = document.getElementById('hint-group-name');
  var unitChips = document.getElementById('unit-chips-container');
  var unitPulpBadge = document.getElementById('unit-pulp-profile-badge');
  var step1GroupSelect = document.getElementById('wb-mining-group-select');
  var step1UnitSelect = document.getElementById('wb-mining-unit-select');
  var step1PulpBadge = document.getElementById('wb-step1-pulp-profile-badge');
  var selectedUnitPulpProfile = '';

  function applyMiningUnitPreset(groupObj, unitObj) {
    if (!groupObj || !unitObj) return;
    var profileText = unitObj.pulp_profile || '';
    selectedUnitPulpProfile = profileText;

    if (inputCompany) {
      inputCompany.value = groupObj.name + ' / ' + unitObj.name.split('(')[0].trim();
      inputCompany.dataset.autofilled = 'true';
    }
    if (inputDest) {
      inputDest.value = unitObj.name;
    }
    if (step1PulpBadge && profileText) {
      step1PulpBadge.classList.remove('hidden');
      step1PulpBadge.textContent = (isEs ? 'Perfil de pulpa pre-cargado (' : 'Pre-loaded slurry profile (') + unitObj.name + '): ' + profileText;
    }
    if (unitPulpBadge && profileText) {
      unitPulpBadge.classList.remove('hidden');
      unitPulpBadge.textContent = (isEs ? 'Perfil Mineral Detectado (' : 'Detected Mineral Profile (') + unitObj.name + '): ' + profileText;
    }

    var pLower = profileText.toLowerCase();
    var districtPreset = resolveMiningDistrictPreset(groupObj.id || unitObj.name) || {};
    var presetCw = districtPreset.solidsCw || 45;
    var presetD80 = districtPreset.d80Microns || 180;
    var presetSg = districtPreset.solidsSg || 2.8;
    var presetAlt = districtPreset.altitudeM || selectedAltitude;
    var presetPh = districtPreset.pulpPh || 7.5;
    var presetFlow = districtPreset.flowM3h || 180;
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

    if (sliderFlow) sliderFlow.value = String(presetFlow);
    if (sliderSolids) sliderSolids.value = String(presetCw);
    if (sliderD80) sliderD80.value = String(presetD80);
    if (sliderSg) sliderSg.value = String(presetSg);
    if (sliderPh) sliderPh.value = String(presetPh);
    if (presetAlt) {
      selectedAltitude = Number(presetAlt);
      if (valAltitude) valAltitude.textContent = selectedAltitude.toLocaleString() + ' msnm';
    }
    if (ctrlSgInput) ctrlSgInput.value = String(presetSg);
    if (ctrlCwInput) ctrlCwInput.value = String(presetCw);
    if (ctrlP80Input) ctrlP80Input.value = String(presetD80);

    if (inputDetails && profileText && !inputDetails.value.includes(profileText)) {
      var baseDet = inputDetails.value.trim();
      inputDetails.value = (baseDet ? baseDet + ' | ' : '') + (isEs ? 'Perfil de pulpa: ' : 'Pulp profile: ') + profileText;
    }
    runSlurryCalculation();
    updateDossier();
  }

  function filterStep1UnitsByGroup(groupId) {
    if (!step1UnitSelect) return;
    Array.from(step1UnitSelect.options).forEach(function (opt, idx) {
      if (idx === 0) return;
      var optGrp = opt.getAttribute('data-group-id') || '';
      opt.hidden = Boolean(groupId && optGrp !== groupId);
    });
  }

  step1GroupSelect?.addEventListener('change', function () {
    var gId = step1GroupSelect.value;
    filterStep1UnitsByGroup(gId);
    if (!gId) {
      if (step1UnitSelect) step1UnitSelect.value = '';
      if (step1PulpBadge) step1PulpBadge.classList.add('hidden');
      return;
    }
    var grp = miningGroups.find(function (g) { return g.id === gId; });
    if (grp && grp.units && grp.units.length > 0) {
      var firstU = grp.units[0];
      if (step1UnitSelect) step1UnitSelect.value = grp.id + '::' + firstU.name;
      applyMiningUnitPreset(grp, firstU);
    }
  });

  step1UnitSelect?.addEventListener('change', function () {
    var val = step1UnitSelect.value || '';
    if (!val || !val.includes('::')) {
      if (step1PulpBadge) step1PulpBadge.classList.add('hidden');
      return;
    }
    var parts = val.split('::');
    var gId = parts[0];
    var uName = parts.slice(1).join('::');
    if (step1GroupSelect && step1GroupSelect.value !== gId) {
      step1GroupSelect.value = gId;
      filterStep1UnitsByGroup(gId);
    }
    var grp = miningGroups.find(function (g) { return g.id === gId; });
    var unit = grp && grp.units ? grp.units.find(function (u) { return u.name === uName; }) : null;
    if (grp && unit) {
      applyMiningUnitPreset(grp, unit);
    }
  });

  function checkMiningDomain() {
    var email = inputEmail?.value.trim() || '';
    if (!email.includes('@')) {
      if (hintBox) hintBox.classList.add('hidden');
      return;
    }
    var domain = email.split('@')[1]?.toLowerCase().trim();
    var match = miningGroups.find(function (g) { return g.domains && g.domains.includes(domain); });

    if (match && hintBox && hintName && unitChips) {
      hintBox.classList.remove('hidden');
      hintName.textContent = match.name;
      if (step1GroupSelect && !step1GroupSelect.value) {
        step1GroupSelect.value = match.id;
        filterStep1UnitsByGroup(match.id);
      }
      if (inputCompany && (!inputCompany.value || inputCompany.dataset.autofilled === 'true')) {
        inputCompany.value = match.name;
        inputCompany.dataset.autofilled = 'true';
      }
      unitChips.innerHTML = '';
      if (match.units && match.units.length > 0) {
        var firstUnit = match.units[0];
        if (unitPulpBadge && firstUnit.pulp_profile) {
          unitPulpBadge.classList.remove('hidden');
          unitPulpBadge.textContent = (isEs ? 'Perfil Mineral de Unidad (' : 'Unit Mineral Profile (') + firstUnit.name + '): ' + firstUnit.pulp_profile;
        }
        match.units.forEach(function (u) {
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'unit-chip-btn';
          chip.textContent = u.name;
          if (u.pulp_profile) {
            chip.title = u.pulp_profile;
            chip.setAttribute('data-pulp-profile', u.pulp_profile);
          }
          chip.addEventListener('click', function () {
            if (step1GroupSelect) step1GroupSelect.value = match.id;
            if (step1UnitSelect) step1UnitSelect.value = match.id + '::' + u.name;
            applyMiningUnitPreset(match, u);
          });
          unitChips.appendChild(chip);
        });
      }
      updateDossier();
    } else {
      if (hintBox) hintBox.classList.add('hidden');
    }
  }

  inputEmail?.addEventListener('input', checkMiningDomain);

  function collectData() {
    var securityField = document.getElementById('wb-website')?.value;
    if (securityField && securityField.trim().length > 0) return null;

    var name = inputName?.value.trim() || (isEs ? 'Ing. Residente / Solicitante' : 'Lead Process Engineer');
    var company = inputCompany?.value.trim() || (isEs ? 'Unidad Minera / Compañía' : 'Mining Operation / Company');
    var phone = inputPhone?.value.trim() || '(618) 810-4408';
    var email = inputEmail?.value.trim() || (isEs ? 'contacto@minera.com' : 'contact@miningco.com');
    var destination = inputDest?.value.trim() || 'Retiro en Almacén Central Durango (Coordinación con Folio)';
    var clientRef = inputClientRef?.value.trim() || '';
    var details = inputDetails?.value.trim() || 'Verificación dimensional 1:1';
    var dimDia = dimOuterDia?.value.trim() || '';
    var dimBore = dimShaftBore?.value.trim() || '';

    var circuit = currentCircuit || 'bombeo';
    var role = '';
    var roleId = '';
    var sizeVal = '';
    var condVal = '';

    if (circuit === 'bombeo') {
      var roleOpt = selectRole?.options[selectRole.selectedIndex];
      role = roleOpt ? roleOpt.text : 'Kit Extremo Húmedo';
      roleId = selectRole?.value || 'kit_wet_end';
      sizeVal = selectPipeSize?.value || '6x4';
      condVal = inputStressSymptom?.value || 'roca_dura';
    } else if (circuit === 'flotacion') {
      var roleOptF = selectRoleFlot?.options[selectRoleFlot.selectedIndex];
      role = roleOptF ? roleOptF.text : 'Mecanismo Rotor/Estator';
      roleId = selectRoleFlot?.value || 'rotor_estator';
      sizeVal = selectFlotCapacity?.value || '100ft';
      condVal = inputFlotCondition?.value || 'sulfuros_alta_agitacion';
    } else if (circuit === 'control_procesos') {
      var roleOptC = selectRoleCtrl?.options[selectRoleCtrl.selectedIndex];
      role = roleOptC ? roleOptC.text : 'Balanza de Densidad de Pulpa (Tipo Marcy)';
      roleId = selectRoleCtrl?.value || 'balanza_marcy';
      sizeVal = selectCtrlSpec?.value || 'marcy_12_rings';
      condVal = 'control_laboratorio';
    } else {
      var roleOptP = selectRoleFilt?.options[selectRoleFilt.selectedIndex];
      role = roleOptP ? roleOptP.text : 'Placas y Telas Filtrantes';
      roleId = selectRoleFilt?.value || 'placas_telas';
      sizeVal = selectFiltCapacity?.value || '1500';
      condVal = inputFiltCondition?.value || 'jales_secos';
    }

    var smatCode = (liveSmatCode ? liveSmatCode.textContent : '') || buildSmatCode(circuit, roleId, sizeVal, condVal);

    var checkedChan = document.querySelector('input[name="channel_pref"]:checked');
    var channelPref = checkedChan ? checkedChan.value : 'whatsapp';

    var pkgItems = [];
    document.querySelectorAll('input[name="pkg_item"]:checked').forEach(function (c) {
      pkgItems.push(c.value);
    });

    var data = {
      folio: currentFolio, name: name, company: company, phone: phone, email: email,
      circuit: circuit,
      role: role, role_id: roleId,
      size_val: sizeVal,
      condition_val: condVal,
      smat_code: smatCode,
      atomic_code: currentAtomicCode || '',
      pulp_profile: selectedUnitPulpProfile || '',
      metrics: currentHydraulicMetrics || {},
      tco: currentTcoMetrics || {},
      alloy: (currentHydraulicMetrics && currentHydraulicMetrics.recommended_alloy) || 'High Chrome A05 (>650 HB)',
      details: details, client_reference: clientRef,
      dim_outer_dia: dimDia, dim_shaft_bore: dimBore,
      destination: destination, isOpex: isOpex,
      channel_preference: channelPref,
      mission: isOpex ? 'refacciones' : 'equipos',
      package_items: isOpex ? [] : pkgItems,
      is_custom: isCustomEquipment,
      custom_notes: isCustomEquipment ? `${customEquipType?.value || ''} - ${customEquipCapacity?.value || ''}` : '',
      pump_material: document.getElementById('wb-pump-material')?.value || 'alto_cromo_cr27',
      wet_material: document.getElementById('wb-pump-material')?.value || 'alto_cromo_cr27',
      material: document.getElementById('wb-pump-material')?.value || 'alto_cromo_cr27',
      drive_arrangement: document.getElementById('wb-drive-arrangement')?.value || 'CV',
      transmision: document.getElementById('wb-drive-arrangement')?.value || 'CV',
      assembly_station: (currentPartSpecs && currentPartSpecs.station) || 'S3',
      station_number: (currentPartSpecs && currentPartSpecs.station_number) || 3,
      estacion: (currentPartSpecs && currentPartSpecs.station_number) || 3,
      part_weight_kg: (currentPartSpecs && currentPartSpecs.weight_kg) || 68.0,
      peso_kg: (currentPartSpecs && currentPartSpecs.weight_kg) || 68.0,
      front_clearance_mm: (currentClearanceEval && currentClearanceEval.frontClearanceMm) || 0.75,
      claro_mm: (currentClearanceEval && currentClearanceEval.frontClearanceMm) || 0.75,
      delta_eta_v: (currentClearanceEval && (currentClearanceEval.volumetricEfficiencyDropPct ?? currentClearanceEval.volumetricEfficiencyLossPct)) || 1.6,
      tip_speed_ms: (currentKinematics && currentKinematics.tipSpeedMs) || 19.9,
      u2_ms: (currentKinematics && currentKinematics.tipSpeedMs) || 19.9,
      pump_rpm: (currentKinematics && currentKinematics.pumpRpm) || 1149,
      n2_rpm: (currentKinematics && currentKinematics.pumpRpm) || 1149,
      belt_radial_load_kn: (currentKinematics && currentKinematics.beltRadialLoadKn) || 0,
      fr_kn: (currentKinematics && currentKinematics.beltRadialLoadKn) || 0,
      sump_flood_immunity: (currentKinematics && currentKinematics.sumpFloodImmunity) || 'HIGH',
      inmunidad_sumidero: (currentKinematics && currentKinematics.sumpFloodImmunity) || 'HIGH',
      structural_reason: (currentClearanceEval && currentClearanceEval.structuralReasonEs) || '',
      razon_estructural: (currentClearanceEval && currentClearanceEval.structuralReasonEs) || '',
      bearing_l10h: (currentKinematics && (currentKinematics.bearingL10Hours ?? currentKinematics.estimatedL10hHours)) || 28500,
      l10h: (currentKinematics && (currentKinematics.bearingL10Hours ?? currentKinematics.estimatedL10hHours)) || 28500,
      metrology_summary: (currentMetrology && (currentMetrology.summary || currentMetrology.raw)) || '',
      metrologia: (currentMetrology && (currentMetrology.summary || currentMetrology.raw)) || '',
      part_slug: (currentPartSpecs && currentPartSpecs.slug) || roleId,
      part_specs: currentPartSpecs || {},
      clearance_eval: currentClearanceEval || {},
      kinematics: currentKinematics || {},
      metrology: currentMetrology || {}
    };
    saveProfile(data);
    return data;
  }

  function buildSpecText(d) {
    return formatSapPlaintext(d);
  }

  function buildTsvText(d) {
    return formatSapTsv(d);
  }

  function buildAcuseParams(d) {
    return buildAcuseUrlParams(d);
  }

  function dispatchLeadToBackend(d, channelOrigin) {
    if (!d) return;
    saveWorkbenchSession(d);
    var webhookPayload = buildLeadWebhookPayload(d, channelOrigin || 'web_quote_wizard');
    publishWorkbenchUpdate({ lastDispatch: channelOrigin, folio: webhookPayload.folio });
    var resolvedEndpoint = leadEndpointUrl || import.meta.env.PUBLIC_SMAT_LEAD_WEBHOOK_URL || DEFAULT_SMAT_LEAD_WEBHOOK_URL;
    sendLeadToServer(d, channelOrigin || 'web_quote_wizard', resolvedEndpoint);
  }
  subscribeWorkbenchUpdate(function (_detail) { });

  function triggerCopyFeedback(btn, successText) {
    if (!btn) return;
    var span = btn.querySelector('span:not(.pill-icon)') || btn;
    var originalHtml = span.innerHTML;
    btn.classList.add('copy-btn-success');
    span.textContent = successText;
    btn.style.borderColor = 'var(--apple-status-green, #10b981)';
    btn.style.transform = 'scale(1.02)';
    btn.style.transition = 'all 150ms var(--apple-spring-snappy, cubic-bezier(0.16, 1, 0.3, 1))';

    setTimeout(function () {
      btn.classList.remove('copy-btn-success');
      span.innerHTML = originalHtml;
      btn.style.borderColor = '';
      btn.style.transform = '';
    }, 2200);
  }

  var btnCopyPlain = document.getElementById('wb-copy-btn');
  btnCopyPlain?.addEventListener('click', function () {
    var d = collectData();
    if (!d) return;
    dispatchLeadToBackend(d, 'sap_plaintext_copy');
    var text = buildSpecText(d);
    navigator.clipboard.writeText(text).then(function () {
      triggerCopyFeedback(btnCopyPlain, isEs ? '✓ COPIADO AL PORTAPAPELES' : '✓ COPIED TO CLIPBOARD');
      var toast = document.getElementById('wb-toast');
      if (toast) {
        toast.textContent = isEs ? 'Requisición en texto plano copiada. Lista para pegar en correo o chat.' : 'Plaintext spec copied. Ready to paste into email or chat.';
        toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 3000);
      }
    });
  });

  var btnCopyTsv = document.getElementById('wb-copy-tsv-btn');
  btnCopyTsv?.addEventListener('click', function () {
    var d = collectData();
    if (!d) return;
    dispatchLeadToBackend(d, 'sap_tsv_copy');
    var tsv = buildTsvText(d);
    navigator.clipboard.writeText(tsv).then(function () {
      triggerCopyFeedback(btnCopyTsv, isEs ? '✓ TSV COPIADO PARA EXCEL / SAP' : '✓ TSV COPIED FOR EXCEL / SAP');
      var toast = document.getElementById('wb-toast');
      if (toast) {
        toast.textContent = isEs ? 'Tabla TSV copiada. Lista para pegar en celdas de SAP o Excel.' : 'TSV table copied. Ready to paste directly into SAP or Excel cells.';
        toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 3000);
      }
    });
  });

  window.addEventListener('keydown', function (e) {
    var targetTag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    var isInput = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select';

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      var searchInput = document.getElementById('diag-search-input') || document.getElementById('wb-code-decoder-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select?.();
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      btnCopyTsv?.click();
      return;
    }

    if (e.key === 'Escape') {
      document.getElementById('drawer-overlay')?.classList.add('hidden');
      document.getElementById('quality-report-modal')?.classList.add('hidden');
      return;
    }

    if (isInput) return;

    if (e.key === '1') {
      var p1 = document.querySelector('.preset-chip[data-preset="sag_primary"]');
      if (p1) p1.click();
    } else if (e.key === '2') {
      var p2 = document.querySelector('.preset-chip[data-preset="flotation_rougher"]');
      if (p2) p2.click();
    } else if (e.key === '3') {
      var p3 = document.querySelector('.preset-chip[data-preset="tailings_thickened"]');
      if (p3) p3.click();
    }
  });

  document.getElementById('wb-pdf-btn')?.addEventListener('click', function () {
    var d = collectData();
    if (!d) return;
    dispatchLeadToBackend(d, 'pdf_acuse');
    var params = buildAcuseParams(d);
    var isEnPage = window.location.pathname.startsWith('/en');
    window.location.href = isEnPage ? `/en/thank-you/?${params.toString()}` : `/acuse/?${params.toString()}`;
  });

  var triggerMailto = function () {
    var d = collectData();
    if (!d) return;
    dispatchLeadToBackend(d, 'mailto_rfc6068');
    var mailtoHref = formatMailtoUrl(Object.assign({}, d, { target_email: 'ventas@smatminerals.com' }));
    window.location.href = mailtoHref.startsWith('mailto:') ? mailtoHref : ('mailto:' + mailtoHref);
  };

  document.getElementById('wb-email-btn')?.addEventListener('click', triggerMailto);
  document.getElementById('btn-quote-mailto')?.addEventListener('click', triggerMailto);

  document.getElementById('wb-whatsapp-btn')?.addEventListener('click', function () {
    var d = collectData();
    if (!d) return;
    d.has_photo = Boolean(hasProcessedPhoto);
    dispatchLeadToBackend(d, 'whatsapp_durango');
    // Formato canónico: Circuito: ${encodeURIComponent(d.circuit.toUpperCase())}
    var waUrl = formatWhatsappUrl(d);

    var params = buildAcuseParams(d);
    var isEnPage = window.location.pathname.startsWith('/en');
    var targetAcuse = isEnPage ? `/en/thank-you/?${params.toString()}` : `/acuse/?${params.toString()}`;

    window.open(waUrl, '_blank');
    setTimeout(function () {
      window.location.href = targetAcuse;
    }, 350);
  });

  var rolesCriteriaAttr = container.getAttribute('data-roles-criteria');
  var rolesCriteriaData = {};
  try { rolesCriteriaData = JSON.parse(rolesCriteriaAttr || '{}'); } catch (e) { }

  var roleToCriteriaKey = {
    kit_wet_end: 'revestimientos',
    kit_sellado: 'sello',
    kit_rodamientos: 'soporte',
    skid_bomba: 'skid_bomba',
    solo_impulsor: 'impulsor',
    solo_voluta: 'revestimientos',
    rotor_estator: 'mecanismos_flotacion',
    celda_flotacion: 'celda_completa',
    bateria_celdas: 'celda_completa',
    manto_difusor: 'mecanismos_flotacion',
    placas_telas: 'repuestos_prensa',
    filtro_prensa: 'prensa_completa',
    placas_membrana: 'repuestos_prensa',
    bomba_prensa: 'skid_bomba',
    balanza_marcy: 'balanza_marcy',
    filtro_batch_lab: 'filtro_batch_lab',
    tamices_laboratorio: 'tamices_laboratorio'
  };

  function updateRoleCriteriaBar() {
    var ruleEl = document.getElementById('wb-criteria-rule');
    var riskEl = document.getElementById('wb-criteria-risk');
    var varsEl = document.getElementById('wb-criteria-vars');
    var seriesEl = document.getElementById('wb-criteria-series');
    if (!ruleEl || !riskEl) return;

    var activeRoleVal = 'kit_wet_end';
    if (currentCircuit === 'bombeo' && selectRole) activeRoleVal = selectRole.value;
    else if (currentCircuit === 'flotacion' && selectRoleFlot) activeRoleVal = selectRoleFlot.value;
    else if (currentCircuit === 'filtracion' && selectRoleFilt) activeRoleVal = selectRoleFilt.value;
    else if (currentCircuit === 'control_procesos' && selectRoleCtrl) activeRoleVal = selectRoleCtrl.value;

    var cKey = roleToCriteriaKey[activeRoleVal] || 'revestimientos';
    var cObj = rolesCriteriaData[cKey];
    if (cObj) {
      ruleEl.textContent = isEs ? cObj.rule_es : cObj.rule_en;
      riskEl.textContent = isEs ? cObj.risk_es : cObj.risk_en;
      if (varsEl && (cObj.vars_es || cObj.vars_en)) {
        var vVal = isEs ? cObj.vars_es : cObj.vars_en;
        varsEl.textContent = Array.isArray(vVal) ? vVal.join(' • ') : String(vVal);
      }
      if (seriesEl && (cObj.series || cObj.spec_es || cObj.spec_en)) {
        var sList = Array.isArray(cObj.series) ? cObj.series.join(', ') : String(cObj.series || '');
        var spTxt = isEs ? cObj.spec_es : cObj.spec_en;
        seriesEl.textContent = [sList, spTxt].filter(Boolean).join(' — ');
      }
      var elLiveRoleCriteria = document.getElementById('live-role-criteria');
      if (elLiveRoleCriteria) {
        var rTxt = isEs ? cObj.rule_es : cObj.rule_en;
        var kTxt = isEs ? cObj.risk_es : cObj.risk_en;
        elLiveRoleCriteria.textContent = rTxt + ' • ' + kTxt;
      }
    }
  }

  document.getElementById('wb-ctrl-solve-mode')?.addEventListener('change', function (e) {
    ctrlSolveMode = e.target.value || 'cw';
    runSlurryCalculation();
    updateDossier();
  });

  document.getElementById('btn-apply-ss-to-circuit')?.addEventListener('click', function () {
    if (ctrlSgInput && sliderSg) {
      sliderSg.value = ctrlSgInput.value;
      runSlurryCalculation();
      updateDossier();
    }
  });

  document.getElementById('btn-apply-mining-preset')?.addEventListener('click', function () {
    var gId = step1GroupSelect?.value || 'fresnillo-plc';
    var grp = miningGroups.find(function (g) { return g.id === gId; }) || miningGroups[0];
    if (grp && grp.units && grp.units.length > 0) {
      applyMiningUnitPreset(grp, grp.units[0]);
    }
  });

  [selectRole, selectRoleFlot, selectRoleFilt, selectRoleCtrl, selectCtrlSpec].forEach(function (sel) {
    if (sel) sel.addEventListener('change', function () {
      updateRoleCriteriaBar();
      updateDossier();
    });
  });

  var selectPumpMaterial = document.getElementById('wb-pump-material');
  var selectDriveArrangement = document.getElementById('wb-drive-arrangement');
  var sliderClearance = document.getElementById('wb-clearance-slider');
  var btnSwitchCr27 = document.getElementById('wb-switch-cr27-btn');
  var btnApplyMetrology = document.getElementById('wb-apply-metrology-btn');
  var btnOpenStep2 = document.getElementById('btn-open-step2');
  var btnOpenStep3 = document.getElementById('btn-open-step3');
  var step3Accordion = document.getElementById('wb-step3-accordion');

  if (btnOpenStep2) {
    btnOpenStep2.addEventListener('click', function () {
      var durandAcc = document.getElementById('durand-accordion');
      if (durandAcc) {
        durandAcc.open = true;
        durandAcc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
  if (btnOpenStep3) {
    btnOpenStep3.addEventListener('click', function () {
      if (step3Accordion) {
        step3Accordion.open = true;
        step3Accordion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(function () { inputName?.focus(); }, 180);
      }
    });
  }

  if (selectPumpMaterial) {
    selectPumpMaterial.addEventListener('change', function () {
      selectPumpMaterial.dataset.userTouched = 'true';
      updateDossier();
    });
  }
  if (selectDriveArrangement) {
    selectDriveArrangement.addEventListener('change', function () {
      selectDriveArrangement.dataset.userTouched = 'true';
      updateDossier();
    });
  }
  if (sliderClearance) {
    sliderClearance.addEventListener('input', function () {
      sliderClearance.dataset.userTouched = 'true';
      updateDossier();
    });
  }
  [wbDriverPulley, wbDrivenPulley, wbMotorRpm, wbShaftPower, wbAssemblySeqTest, wbSealBranch, wbImpellerB2, wbBearingC].forEach(function (kinEl) {
    if (kinEl) {
      kinEl.addEventListener('input', function () {
        kinEl.dataset.userTouched = 'true';
        updateDossier();
      });
      kinEl.addEventListener('change', function () {
        kinEl.dataset.userTouched = 'true';
        updateDossier();
      });
    }
  });
  if (btnSwitchCr27) {
    btnSwitchCr27.addEventListener('click', function () {
      if (selectPumpMaterial) {
        selectPumpMaterial.value = 'alto_cromo_cr27';
        selectPumpMaterial.dataset.userTouched = 'true';
      }
      updateDossier();
    });
  }
  if (btnApplyMetrology) {
    btnApplyMetrology.addEventListener('click', function () {
      if (currentMetrology) {
        var sgToApply = currentMetrology.specificGravity ?? currentMetrology.recommendedRingSg;
        var cwToApply = currentMetrology.cw ?? currentMetrology.solidsPctCw;
        var p80ToApply = currentMetrology.p80 ?? currentMetrology.targetP80Microns;
        if (sgToApply !== undefined && sliderSg) sliderSg.value = String(Number(sgToApply).toFixed(1));
        if (sgToApply !== undefined && ctrlSgInput) ctrlSgInput.value = String(Number(sgToApply).toFixed(1));
        if (cwToApply !== undefined && sliderSolids) sliderSolids.value = String(Math.round(Number(cwToApply)));
        if (cwToApply !== undefined && ctrlCwInput) ctrlCwInput.value = String(Math.round(Number(cwToApply)));
        if (p80ToApply !== undefined && sliderD80) sliderD80.value = String(Math.round(Number(p80ToApply)));
        if (p80ToApply !== undefined && ctrlP80Input) ctrlP80Input.value = String(Math.round(Number(p80ToApply)));
        var durandAcc = document.getElementById('durand-accordion');
        if (durandAcc) durandAcc.open = true;
        runSlurryCalculation();
        updateDossier();
      }
    });
  }

  function checkUrlContext() {
    var rawSearch = window.location.search || '';
    var rawHash = window.location.hash || '';
    if (!rawSearch && !rawHash) return;

    var ctx = parseUrlContextParams(rawSearch, rawHash);
    var hasAnyParam = Object.keys(ctx).some(function (k) { return ctx[k] !== null && ctx[k] !== ''; });
    if (!hasAnyParam) {
      if (rawHash.includes('rfq')) {
        var rfqOnlyEl = document.getElementById('rfq');
        if (rfqOnlyEl) rfqOnlyEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    try {
      var viewState = computeWizardViewState({ circuit: currentCircuit }, ctx);
      var symptomDrawer = document.getElementById('wb-symptom-context-details');
      var engDrawer = document.getElementById('wb-engineering-config-details');
      var smartDrawer = document.getElementById('wb-smart-paste-details');
      if (viewState.openSymptomDrawer && symptomDrawer) symptomDrawer.open = true;
      if (viewState.openEngineeringDrawer && engDrawer) engDrawer.open = true;
      if (viewState.openSmartPasteDrawer && smartDrawer) smartDrawer.open = true;
      if (viewState.openStep3 && step3Accordion) step3Accordion.open = true;

      var urlCodigo = ctx.codigo || '';
      var urlCircuit = ctx.circuito || '';
      var rawUrlRole = ctx.rol || ctx.equipo || '';
      var urlRole = rawUrlRole ? (ROLE_ALIAS_MAP[rawUrlRole] || rawUrlRole) : '';
      var urlSerie = ctx.serie || '';
      var urlFalla = ctx.falla || '';
      var urlSintoma = ctx.sintoma || '';
      var urlMina = ctx.mina || '';
      var urlUrgencia = ctx.urgencia || '';
      var urlFlow = ctx.flow || '';
      var urlSolids = ctx.solids || ctx.cw || '';
      var urlD80 = ctx.d80 || ctx.p80 || '';
      var urlPieza = ctx.pieza || '';
      var urlMaterial = ctx.material || '';
      var urlTransmision = (ctx.transmision || '').toUpperCase();
      var urlEstacion = (ctx.estacion || '').toUpperCase();
      var urlClaroMm = ctx.claro_mm || '';
      var urlMetrologia = ctx.metrologia || '';
      var urlSg = ctx.sg || '';
      var urlRhop = ctx.rhop || ctx.oreDensitySg || '';
      var urlD95 = ctx.d95 || '';
      var urlLibUm = ctx.lib_um || ctx.liberationSizeMicrons || '';
      var urlGrade = ctx.grade || ctx.headGradePercent || '';
      var urlAirPsi = ctx.air_psi || ctx.airPressurePsi || '';
      var urlGyC = ctx.gy_c || ctx.samplingConstantC || '';
      var urlGyErr = ctx.gy_err || ctx.relativeErrorSigma || '';
      var urlRrN = ctx.rr_n || ctx.rosinRammlerSlopeN || '';
      var urlRetP80 = ctx.ret_p80 || ctx.retainedPercentAtP80 || '';
      var urlGyKg = ctx.gy_kg || '';
      var urlPh = ctx.ph || '';
      var urlSealBranch = ctx.seal_branch || '';
      var urlB2Mm = ctx.b2_mm || '';
      var urlCapCKn = ctx.cap_c_kn || '';
      var urlDriverMm = ctx.driver_mm || ctx.driverPulleyMm || '';
      var urlDrivenMm = ctx.driven_mm || ctx.drivenPulleyMm || '';
      var urlMotorRpm = ctx.motor_rpm || ctx.motorRpm || '';
      var urlPowerKw = ctx.power_kw || ctx.shaftPowerKw || '';

      if (urlPh && sliderPh) sliderPh.value = urlPh;
      if (urlSealBranch && wbSealBranch) {
        wbSealBranch.value = urlSealBranch;
        wbSealBranch.dataset.userTouched = 'true';
      }
      if (urlB2Mm && wbImpellerB2) {
        wbImpellerB2.value = urlB2Mm;
        wbImpellerB2.dataset.userTouched = 'true';
      }
      if (urlCapCKn && wbBearingC) {
        wbBearingC.value = urlCapCKn;
        wbBearingC.dataset.userTouched = 'true';
      }
      if (urlDriverMm && wbDriverPulley) {
        wbDriverPulley.value = urlDriverMm;
        wbDriverPulley.dataset.userTouched = 'true';
      }
      if (urlDrivenMm && wbDrivenPulley) {
        wbDrivenPulley.value = urlDrivenMm;
        wbDrivenPulley.dataset.userTouched = 'true';
      }
      if (urlMotorRpm && wbMotorRpm) {
        wbMotorRpm.value = urlMotorRpm;
        wbMotorRpm.dataset.userTouched = 'true';
      }
      if (urlPowerKw && wbShaftPower) {
        wbShaftPower.value = urlPowerKw;
        wbShaftPower.dataset.userTouched = 'true';
      }

      if (urlSg && sliderSg) {
        sliderSg.value = urlSg;
        if (ctrlSgInput) ctrlSgInput.value = urlSg;
      }
      if (urlSolids && ctrlCwInput) ctrlCwInput.value = urlSolids;
      if (urlRhop && ctrlRhopInput) ctrlRhopInput.value = urlRhop;
      if (urlD95 && ctrlD95Input) ctrlD95Input.value = urlD95;
      if (urlLibUm && ctrlLibInput) ctrlLibInput.value = urlLibUm;
      if (urlGrade && ctrlGradeInput) ctrlGradeInput.value = urlGrade;
      if (urlAirPsi && ctrlAirPsiInput) ctrlAirPsiInput.value = urlAirPsi;
      if (urlGyC && ctrlGyCInput) ctrlGyCInput.value = urlGyC;
      if (urlGyErr && ctrlGyErrInput) ctrlGyErrInput.value = urlGyErr;
      if (urlD80 && ctrlP80Input) ctrlP80Input.value = urlD80;
      if (urlRrN && ctrlRrNInput) ctrlRrNInput.value = urlRrN;
      if (urlRetP80 && ctrlRetP80Input) ctrlRetP80Input.value = urlRetP80;

      if (urlClaroMm && sliderClearance) {
        sliderClearance.value = urlClaroMm;
        sliderClearance.dataset.userTouched = 'true';
        var durandAccClaro = document.getElementById('durand-accordion');
        if (durandAccClaro) durandAccClaro.open = true;
      }
      if (urlMetrologia || urlSg || urlGyKg || urlRhop || urlD95 || urlLibUm || urlGrade || urlAirPsi || urlRrN || urlRetP80) {
        var parsedMetro = { raw: urlMetrologia, summary: urlMetrologia };
        if (urlSg) parsedMetro.specificGravity = parseFloat(urlSg);
        if (urlSolids) {
          parsedMetro.cw = parseFloat(urlSolids);
          parsedMetro.solidsPctCw = parseFloat(urlSolids);
        }
        if (urlRhop) {
          parsedMetro.sm = parseFloat(urlRhop);
          parsedMetro.pulpDensityKgL = parseFloat(urlRhop);
          parsedMetro.rhop = parseFloat(urlRhop);
        }
        if (urlD95) parsedMetro.topSizeD95Mm = parseFloat(urlD95);
        if (urlLibUm) parsedMetro.liberationSizeMicrons = parseFloat(urlLibUm);
        if (urlGrade) parsedMetro.headGradePercent = parseFloat(urlGrade);
        if (urlAirPsi) parsedMetro.airPressurePsi = parseFloat(urlAirPsi);
        if (urlGyC) parsedMetro.samplingConstantC = parseFloat(urlGyC);
        if (urlGyErr) parsedMetro.relativeErrorSigma = parseFloat(urlGyErr);
        if (urlD80) {
          parsedMetro.p80 = parseFloat(urlD80);
          parsedMetro.targetP80Microns = parseFloat(urlD80);
        }
        if (urlRrN) parsedMetro.rosinRammlerSlopeN = parseFloat(urlRrN);
        if (urlRetP80) parsedMetro.retainedPercentAtP80 = parseFloat(urlRetP80);
        if (urlGyKg) {
          parsedMetro.dryMassKg = parseFloat(urlGyKg);
          parsedMetro.gySampleMassKg = parseFloat(urlGyKg);
        }
        if (urlMetrologia && !urlMetrologia.includes('|')) {
          urlMetrologia.split('_').forEach(function (token) {
            if (token.startsWith('Cw')) parsedMetro.cw = parseFloat(token.replace('Cw', ''));
            else if (token.startsWith('Sm')) parsedMetro.sm = parseFloat(token.replace('Sm', ''));
            else if (token.startsWith('P80-')) parsedMetro.p80 = parseFloat(token.replace('P80-', ''));
            else if (token.startsWith('WI')) parsedMetro.wi = parseFloat(token.replace('WI', ''));
            else if (token.startsWith('Press')) parsedMetro.dryMassKg = parseFloat(token.replace('Press', '').replace('kg', ''));
          });
        }
        currentMetrology = parsedMetro;
        saveWorkbenchState({ metrology: parsedMetro });
      }

      if (urlFlow && sliderFlow) sliderFlow.value = urlFlow;
      if (urlSolids && sliderSolids) sliderSolids.value = urlSolids;
      if (urlD80 && sliderD80) sliderD80.value = urlD80;
      if (urlFlow || urlSolids || urlD80) {
        var durandAcc = document.getElementById('durand-accordion');
        if (durandAcc) durandAcc.open = true;
      }

      if (urlCodigo) {
        var cleanCodigo = urlCodigo.trim().toUpperCase();
        if (inputDecoder) inputDecoder.value = cleanCodigo;
        var decoded = decodeSmatCode(cleanCodigo);
        if (decoded) {
          currentAtomicCode = decoded.atomic_code || '';
          setCircuit(decoded.circuit);
          if (decoded.circuit === 'bombeo') {
            if (selectRole) selectRole.value = decoded.role;
            if (selectPipeSize) selectPipeSize.value = decoded.size;
          } else if (decoded.circuit === 'flotacion') {
            if (selectRoleFlot) selectRoleFlot.value = decoded.role;
            if (selectFlotCapacity) selectFlotCapacity.value = decoded.size;
          } else if (decoded.circuit === 'filtracion') {
            if (selectRoleFilt) selectRoleFilt.value = decoded.role;
            if (selectFiltCapacity) selectFiltCapacity.value = decoded.size;
          } else if (decoded.circuit === 'control_procesos') {
            if (selectRoleCtrl) selectRoleCtrl.value = decoded.role;
            if (selectCtrlSpec) selectCtrlSpec.value = decoded.size;
          }
          if (inputDetails) {
            if (decoded.atomic_code) {
              inputDetails.value = (isEs ? 'Refacción específica ' : 'Specific spare ') + decoded.atomic_code + ' (' + decoded.atomic_label + ') - ' + decoded.atomic_metallurgy + '. Verificación dimensional 1:1 en banco Durango.';
            } else {
              inputDetails.value = 'Configuración según código institucional ' + decoded.code + '. Verificación dimensional 1:1 en banco Durango.';
            }
          }
          if (decoderStatus) {
            var statusLbl = decoded.atomic_code ? (decoded.atomic_code + ' → ' + decoded.code) : decoded.code;
            decoderStatus.textContent = isEs ? 'Configuración cargada: ' + statusLbl : 'Configuration loaded: ' + statusLbl;
            decoderStatus.className = 'decoder-status success';
          }
        }
      } else {
        setCircuit(viewState.circuit);

        if (urlRole && currentCircuit === 'bombeo' && selectRole) {
          for (var i = 0; i < selectRole.options.length; i++) {
            if (selectRole.options[i].value === urlRole || selectRole.options[i].text.toLowerCase().includes(urlRole.toLowerCase())) {
              selectRole.selectedIndex = i;
              break;
            }
          }
        } else if (urlRole && currentCircuit === 'flotacion' && selectRoleFlot) {
          for (var j = 0; j < selectRoleFlot.options.length; j++) {
            if (selectRoleFlot.options[j].value === urlRole || selectRoleFlot.options[j].text.toLowerCase().includes(urlRole.toLowerCase())) {
              selectRoleFlot.selectedIndex = j;
              break;
            }
          }
        } else if (urlRole && currentCircuit === 'filtracion' && selectRoleFilt) {
          for (var k = 0; k < selectRoleFilt.options.length; k++) {
            if (selectRoleFilt.options[k].value === urlRole || selectRoleFilt.options[k].text.toLowerCase().includes(urlRole.toLowerCase())) {
              selectRoleFilt.selectedIndex = k;
              break;
            }
          }
        } else if (urlRole && currentCircuit === 'control_procesos' && selectRoleCtrl) {
          for (var mIdx = 0; mIdx < selectRoleCtrl.options.length; mIdx++) {
            if (selectRoleCtrl.options[mIdx].value === urlRole || selectRoleCtrl.options[mIdx].text.toLowerCase().includes(urlRole.toLowerCase())) {
              selectRoleCtrl.selectedIndex = mIdx;
              break;
            }
          }
        }
      }

      if (!urlSerie) {
        try {
          var stored = sessionStorage.getItem('smat_catalog_selected');
          if (stored) {
            var parsedStored = JSON.parse(stored);
            if (parsedStored && parsedStored.serie) {
              urlSerie = parsedStored.serie;
              sessionStorage.removeItem('smat_catalog_selected');
            }
          }
        } catch (e) { }
      }

      if (urlSerie) {
        var normSerie = normalizeCircuitSerie(currentCircuit, urlSerie);
        if (normSerie.targetField === 'pipe_size' && selectPipeSize) {
          selectPipeSize.value = normSerie.value;
        } else if (normSerie.targetField === 'flot_capacity' && selectFlotCapacity) {
          selectFlotCapacity.value = normSerie.value;
        } else if (normSerie.targetField === 'filt_capacity' && selectFiltCapacity) {
          selectFiltCapacity.value = normSerie.value;
        } else if (normSerie.targetField === 'ctrl_spec' && selectCtrlSpec) {
          selectCtrlSpec.value = normSerie.value;
        }
      }

      if (ctx.flot_condition && inputFlotCondition) {
        inputFlotCondition.value = ctx.flot_condition;
        flotChips.forEach(function (c) {
          var isMatch = c.getAttribute('data-flot-cond') === ctx.flot_condition;
          c.classList.toggle('active', isMatch);
          c.classList.toggle('chip-ghost', !isMatch);
          c.setAttribute('data-confirmed', isMatch ? 'true' : 'false');
          c.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
        });
      }

      if (ctx.filt_condition && inputFiltCondition) {
        inputFiltCondition.value = ctx.filt_condition;
        filtChips.forEach(function (c) {
          var isMatch = c.getAttribute('data-filt-cond') === ctx.filt_condition;
          c.classList.toggle('active', isMatch);
          c.classList.toggle('chip-ghost', !isMatch);
          c.setAttribute('data-confirmed', isMatch ? 'true' : 'false');
          c.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
        });
      }

      if (urlSerie && inputDetails && !urlCodigo) {
        inputDetails.value = 'Requerimiento ' + urlSerie + ' - Verificación dimensional 1:1 en banco Durango';
      }

      if ((urlSintoma || urlFalla) && inputDetails && !urlSerie && !urlCodigo) {
        var desc = urlSintoma || urlFalla.replace(/_/g, ' ');
        inputDetails.value = 'Reemplazo prioritario por ' + desc + ' detectado en diagnóstico de planta';
      }

      if (urlMaterial && selectPumpMaterial) {
        selectPumpMaterial.value = normalizeMaterialKey(urlMaterial);
        selectPumpMaterial.dataset.userTouched = 'true';
      }
      if (urlTransmision && selectDriveArrangement) {
        selectDriveArrangement.value = urlTransmision;
        selectDriveArrangement.dataset.userTouched = 'true';
      }
      if (urlPieza || urlMaterial || urlTransmision || urlEstacion) {
        var partNotes = [];
        if (urlPieza) partNotes.push((isEs ? 'Pieza: ' : 'Part: ') + urlPieza);
        if (urlMaterial) partNotes.push((isEs ? 'Material: ' : 'Material: ') + urlMaterial);
        if (urlTransmision) partNotes.push((isEs ? 'Transmisión: Arreglo ' : 'Drive: Arrangement ') + urlTransmision);
        if (urlEstacion) partNotes.push((isEs ? 'Estación de Armado: ' : 'Assembly Station: ') + urlEstacion);
        if (inputDetails && !urlCodigo) {
          inputDetails.value = partNotes.join(' | ') + (isEs ? ' — Calibración axial δ = 0.5–1.0 mm' : ' — Axial clearance δ = 0.5–1.0 mm');
        }
        document.querySelectorAll('[data-quick-part-card]').forEach(function (cardEl) {
          var cPieza = cardEl.getAttribute('data-pieza');
          cardEl.classList.toggle('is-selected', Boolean(urlPieza && cPieza === urlPieza));
        });
      }

      if (urlMina && inputCompany) {
        inputCompany.value = urlMina;
      }

      if (urlUrgencia === 'capex' || urlUrgencia === 'proyecto') {
        btnCapex?.click();
      } else if (urlUrgencia === 'opex' || urlUrgencia === 'paro') {
        btnOpex?.click();
      }

      runSlurryCalculation();
      updateRoleCriteriaBar();
      updateDossier();

      if (window.location.hash.includes('rfq')) {
        var rfqEl = document.getElementById('rfq');
        if (rfqEl) {
          rfqEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (e) { }
  }

  var btnOpenDrawer = document.getElementById('btn-open-drawer');
  var btnCloseDrawer = document.getElementById('btn-close-drawer');
  var drawerOverlay = document.getElementById('drawer-overlay');
  var drawerMount = document.getElementById('drawer-dossier-mount');
  var mainDossierCard = document.getElementById('main-dossier-card');

  if (btnOpenDrawer && drawerOverlay && drawerMount && mainDossierCard) {
    btnOpenDrawer.addEventListener('click', function () {
      drawerMount.innerHTML = mainDossierCard.innerHTML;
      drawerOverlay.classList.remove('hidden');
      drawerOverlay.removeAttribute('hidden');

      drawerMount.querySelector('#wb-copy-btn')?.addEventListener('click', function () {
        document.getElementById('wb-copy-btn')?.click();
      });
      drawerMount.querySelector('#wb-copy-tsv-btn')?.addEventListener('click', function () {
        document.getElementById('wb-copy-tsv-btn')?.click();
      });
      drawerMount.querySelector('#wb-pdf-btn')?.addEventListener('click', function () {
        document.getElementById('wb-pdf-btn')?.click();
      });
      drawerMount.querySelector('#wb-whatsapp-btn')?.addEventListener('click', function () {
        document.getElementById('wb-whatsapp-btn')?.click();
      });
    });

    btnCloseDrawer?.addEventListener('click', function () {
      drawerOverlay.classList.add('hidden');
    });

    drawerOverlay.addEventListener('click', function (e) {
      if (e.target === drawerOverlay) {
        drawerOverlay.classList.add('hidden');
      }
    });
  }

  var btnCotejo = document.getElementById('wb-cotejo-btn');
  var modalCotejo = document.getElementById('quality-report-modal');
  var btnCloseCotejo = document.getElementById('btn-close-cotejo');
  var btnCloseCotejo2 = document.getElementById('btn-close-cotejo-2');

  if (btnCotejo && modalCotejo) {
    btnCotejo.addEventListener('click', function () {
      modalCotejo.classList.remove('hidden');
      modalCotejo.removeAttribute('hidden');
    });
    btnCloseCotejo?.addEventListener('click', function () {
      modalCotejo.classList.add('hidden');
    });
    btnCloseCotejo2?.addEventListener('click', function () {
      modalCotejo.classList.add('hidden');
    });
    modalCotejo.addEventListener('click', function (e) {
      if (e.target === modalCotejo) modalCotejo.classList.add('hidden');
    });
  }

  var offlinePill = document.getElementById('offline-network-pill');
  function updateNetworkStatus() {
    if (!navigator.onLine) {
      if (offlinePill) {
        offlinePill.classList.remove('hidden');
        offlinePill.removeAttribute('hidden');
      }
    } else {
      if (offlinePill) offlinePill.classList.add('hidden');
    }
  }
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  window.addEventListener('smat:workbench_update', function (evt) {
    var detail = evt.detail || {};
    if (detail.intent === 'capex') btnCapex?.click();
    else if (detail.intent === 'opex') btnOpex?.click();

    if (detail.circuit) setCircuit(detail.circuit);
    if (detail.role) {
      var mappedRole = ROLE_ALIAS_MAP[detail.role] || detail.role;
      if (currentCircuit === 'bombeo' && selectRole) selectRole.value = mappedRole;
      else if (currentCircuit === 'flotacion' && selectRoleFlot) selectRoleFlot.value = mappedRole;
      else if (currentCircuit === 'filtracion' && selectRoleFilt) selectRoleFilt.value = mappedRole;
    }
    if (detail.preset) {
      var presetChipEl = document.querySelector('.preset-chip[data-preset="' + detail.preset + '"]');
      if (presetChipEl) presetChipEl.click();
    }
    updateRoleCriteriaBar();
    runSlurryCalculation();
    updateDossier();
  });

  window.addEventListener('smat:mission', function (evt) {
    var m = evt.detail && evt.detail.mission;
    if (m === 'requisicion_capex') btnCapex?.click();
    else if (m === 'paro_urgente' || m === 'desgaste_proceso') btnOpex?.click();
    updateDossier();
  });

  window.addEventListener('hashchange', checkUrlContext);

  document.addEventListener('click', function (e) {
    var anchor = e.target && e.target.closest ? e.target.closest('a[href*="#rfq"]') : null;
    if (!anchor) return;
    var href = anchor.getAttribute('href') || '';
    try {
      var targetUrl = new URL(href, window.location.origin);
      if (targetUrl.pathname === window.location.pathname) {
        e.preventDefault();
        history.pushState(null, '', targetUrl.search + targetUrl.hash);
        checkUrlContext();
        var rfqEl = document.getElementById('rfq');
        if (rfqEl) rfqEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) { }
  });

  function hydrateMetrologyInputsFromState() {
    try {
      var st = loadWorkbenchState() || {};
      var wm = st.metrology || {};
      if (wm.specificGravity !== undefined && ctrlSgInput) ctrlSgInput.value = String(wm.specificGravity);
      if ((wm.cw !== undefined || wm.solidsPctCw !== undefined) && ctrlCwInput) ctrlCwInput.value = String(wm.cw ?? wm.solidsPctCw);
      if ((wm.sm !== undefined || wm.pulpDensityKgL !== undefined) && ctrlRhopInput) ctrlRhopInput.value = String(wm.sm ?? wm.pulpDensityKgL);
      if (wm.topSizeD95Mm !== undefined && ctrlD95Input) ctrlD95Input.value = String(wm.topSizeD95Mm);
      if (wm.liberationSizeMicrons !== undefined && ctrlLibInput) ctrlLibInput.value = String(wm.liberationSizeMicrons);
      if (wm.headGradePercent !== undefined && ctrlGradeInput) ctrlGradeInput.value = String(wm.headGradePercent);
      if (wm.airPressurePsi !== undefined && ctrlAirPsiInput) ctrlAirPsiInput.value = String(wm.airPressurePsi);
      if (wm.samplingConstantC !== undefined && ctrlGyCInput) ctrlGyCInput.value = String(wm.samplingConstantC);
      if (wm.relativeErrorSigma !== undefined && ctrlGyErrInput) ctrlGyErrInput.value = String(wm.relativeErrorSigma);
      if ((wm.p80 !== undefined || wm.targetP80Microns !== undefined) && ctrlP80Input) ctrlP80Input.value = String(wm.p80 ?? wm.targetP80Microns);
      if (wm.rosinRammlerSlopeN !== undefined && ctrlRrNInput) ctrlRrNInput.value = String(wm.rosinRammlerSlopeN);
      if (wm.retainedPercentAtP80 !== undefined && ctrlRetP80Input) ctrlRetP80Input.value = String(wm.retainedPercentAtP80);
    } catch (e) { }
  }

  sanitizeAndMigrateStorage();
  loadSessionState();
  hydrateMetrologyInputsFromState();
  runSlurryCalculation();
  initProfile();
  checkUrlContext();
  updateRoleCriteriaBar();
  switchDossierTab('maint');
  updateDossier();
}
