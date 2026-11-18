/**
 * wizardCircuitXorStatechart.js
 * ---------------------------------------------------------------------------
 * Costura Modular Cohesiva LCOM4 = 1 (∂(C) = 0, D5-V44 a D7-V44 & D9-V44)
 * Statechart Ortogonal XOR de Harel (1987, DOI: 10.1016/0167-6423(87)90035-9)
 * que gobierna declarativamente la proyección visual de `/cotizar/` (`QuoteWizard.astro`)
 * entre los 5 circuitos (`bombeo`, `clasificacion`, `flotacion`, `filtracion`, `control_procesos`),
 * garantizando 0 contaminación de síntomas de bombas, bastidores o tuberías Durand fuera de su dominio,
 * más la proyección reactiva de la matriz tribológica `WET_END_MATERIAL_MATRIX`.
 */

import { WET_END_MATERIAL_MATRIX } from './tribologyAndCompatibilityEngine.js';
import { evaluateHybridWetEndConfiguration } from './pumpAssemblyAndDriveEngine.js';

export const CIRCUIT_XOR_VIEW_SPEC = Object.freeze({
  bombeo: Object.freeze({
    circuit: 'bombeo',
    activePanelId: 'circuit-panel-bombeo',
    showPumpSymptomsDrawer: true,
    showDriveAndTradeInCard: true,
    showPumpOnlyEngineeringControls: true,
    showFlotGorainLiveBox: false,
    showFiltTimoshenkoLiveBox: false,
    showStep2DurandPipeControls: true,
    showStep2ClearanceAndBeltKinematics: true,
    showStep2MechDiagnosticsInline: true,
    showStep2ControlSummary: false,
    engineeringConfigSummaryEs:
      '+ Configuración de Alcance (Refacciones / Paquete CAPEX), Material Cr27/Hule y Arreglo V-Belt',
    engineeringConfigSummaryEn:
      '+ Scope Config (Spares / CAPEX Package), Cr27/Rubber Material & V-Belt Arrangement',
    step2HintTitleEs: '¿Cuenta con datos de bombeo de pulpa o tonelaje diario?',
    step2HintTitleEn: 'Working from slurry pumping data or daily tonnage?',
    step2HintBodyEs:
      'Calibre caudal, % de sólidos, granulometría d80 y claro axial (0.76 mm) para prevenir asentamiento Durand y cavitación en altura.',
    step2HintBodyEn:
      'Calibrate flow rate, % solids, d80 particle size, and axial clearance (0.76 mm) to prevent Durand settling and altitude cavitation.',
  }),
  clasificacion: Object.freeze({
    circuit: 'clasificacion',
    activePanelId: 'circuit-panel-clasificacion',
    showPumpSymptomsDrawer: false,
    showDriveAndTradeInCard: false,
    showPumpOnlyEngineeringControls: false,
    showFlotGorainLiveBox: false,
    showFiltTimoshenkoLiveBox: false,
    showStep2DurandPipeControls: true,
    showStep2ClearanceAndBeltKinematics: false,
    showStep2MechDiagnosticsInline: false,
    showStep2ControlSummary: false,
    engineeringConfigSummaryEs:
      '+ Configuración de Alcance en Clasificación (Ápex SiC / Conos PU / Mallas TH48-30 y Cédula)',
    engineeringConfigSummaryEn:
      '+ Classification Scope Config (SiC Apex / PU Cones / TH48-30 Screens & Schedule)',
    step2HintTitleEs: '¿Cuenta con datos de alimentación a batería de hidrociclones o cribas?',
    step2HintTitleEn: 'Working from hydrocyclone cluster or screen feed data?',
    step2HintBodyEs:
      'Ajuste caudal de línea de alimentación a ciclones, % de sólidos y corte d80 para sincronizar el régimen de Plitt y la partición Weibull.',
    step2HintBodyEn:
      'Adjust cyclone feed line flow, % solids, and d80 cut to synchronize the Plitt regime and Weibull screen partition.',
  }),
  flotacion: Object.freeze({
    circuit: 'flotacion',
    activePanelId: 'circuit-panel-flotacion',
    showPumpSymptomsDrawer: false,
    showDriveAndTradeInCard: false,
    showPumpOnlyEngineeringControls: false,
    showFlotGorainLiveBox: true,
    showFiltTimoshenkoLiveBox: false,
    showStep2DurandPipeControls: true,
    showStep2ClearanceAndBeltKinematics: false,
    showStep2MechDiagnosticsInline: false,
    showStep2ControlSummary: false,
    engineeringConfigSummaryEs:
      '+ Configuración de Alcance en Flotación (Mecanismos Drop-In #18 SP / #24 / #30 y Elastómero PU/Hule)',
    engineeringConfigSummaryEn:
      '+ Flotation Scope Config (Drop-In #18 SP / #24 / #30 Mechanisms & PU/Rubber Elastomer)',
    step2HintTitleEs: '¿Cuenta con flujo de pulpa hacia el banco de celdas Rougher / Scavenger?',
    step2HintTitleEn: 'Working from slurry feed flow to the Rougher / Scavenger cell bank?',
    step2HintBodyEs:
      'Calibre densidad de pulpa en banco de flotación, granulometría de liberación d80 y pH de reactivos para el dimensionamiento cinético.',
    step2HintBodyEn:
      'Calibrate flotation bank pulp density, liberation d80, and reagent pH for kinetic sizing.',
  }),
  filtracion: Object.freeze({
    circuit: 'filtracion',
    activePanelId: 'circuit-panel-filtracion',
    showPumpSymptomsDrawer: false,
    showDriveAndTradeInCard: false,
    showPumpOnlyEngineeringControls: false,
    showFlotGorainLiveBox: false,
    showFiltTimoshenkoLiveBox: true,
    showStep2DurandPipeControls: true,
    showStep2ClearanceAndBeltKinematics: false,
    showStep2MechDiagnosticsInline: false,
    showStep2ControlSummary: false,
    engineeringConfigSummaryEs:
      '+ Configuración de Alcance en Filtración Prensa (Placas PP 16 bar, Lonas y Corre-Placas)',
    engineeringConfigSummaryEn:
      '+ Filter Press Scope Config (16-bar PP Plates, Filter Cloths & Plate Shifter)',
    step2HintTitleEs: '¿Cuenta con caudal y % de sólidos de alimentación al Filtro Prensa?',
    step2HintTitleEn: 'Working from slurry feed flow and % solids to the Filter Press?',
    step2HintBodyEs:
      'Calibre concentración de sólidos de entrada, granulometría y pH para estimar la carga de alimentación a cámaras de filtrado.',
    step2HintBodyEn:
      'Calibrate feed solids concentration, particle size, and pH to estimate filter chamber feed loading.',
  }),
  control_procesos: Object.freeze({
    circuit: 'control_procesos',
    activePanelId: 'circuit-panel-control',
    showPumpSymptomsDrawer: false,
    showDriveAndTradeInCard: false,
    showPumpOnlyEngineeringControls: false,
    showFlotGorainLiveBox: false,
    showFiltTimoshenkoLiveBox: false,
    showStep2DurandPipeControls: false,
    showStep2ClearanceAndBeltKinematics: false,
    showStep2MechDiagnosticsInline: false,
    showStep2ControlSummary: true,
    engineeringConfigSummaryEs:
      '+ Configuración de Alcance en Laboratorio Metalúrgico (Balanza Marcy, Filtro Batch y Tamices ASTM E11)',
    engineeringConfigSummaryEn:
      '+ Metallurgical Lab Scope Config (Marcy Scale, Batch Pressure Filter & ASTM E11 Sieves)',
    step2HintTitleEs: 'Estación Metrológica de Laboratorio Activa (Cero Tubería de Bombeo)',
    step2HintTitleEn: 'Active Laboratory Metrology Station (Zero Slurry Pipework)',
    step2HintBodyEs:
      'Los instrumentos de control metalúrgico (Balanza Marcy, Filtro Batch 100 psi y Tamices ASTM E11) se calibran directamente con la cédula de gravedad específica Ss y malla P80.',
    step2HintBodyEn:
      'Metallurgical control instruments (Marcy Scale, 100-psi Batch Filter, and ASTM E11 Sieves) are calibrated directly from ore specific gravity Ss and P80 mesh.',
  }),
});

/**
 * Devuelve la proyección declarativa XOR correspondiente al circuito activo (`D5-V44` a `D7-V44`).
 *
 * @param {string} circuit
 * @param {boolean} [isEs=true]
 */
export function getCircuitXorViewProjection(circuit, isEs = true) {
  const key = String(circuit || 'bombeo').trim().toLowerCase();
  const spec = CIRCUIT_XOR_VIEW_SPEC[key] || CIRCUIT_XOR_VIEW_SPEC.bombeo;
  return {
    ...spec,
    engineeringConfigSummary: isEs ? spec.engineeringConfigSummaryEs : spec.engineeringConfigSummaryEn,
    step2HintTitle: isEs ? spec.step2HintTitleEs : spec.step2HintTitleEn,
    step2HintBody: isEs ? spec.step2HintBodyEs : spec.step2HintBodyEn,
  };
}

function setNodeVisibility(el, visible, visibleDisplay = '') {
  if (!el) return;
  if (visible) {
    el.classList?.remove('hidden');
    if (typeof el.removeAttribute === 'function') el.removeAttribute('hidden');
    if (el.style) el.style.display = visibleDisplay;
  } else {
    el.classList?.add('hidden');
    if (typeof el.setAttribute === 'function') el.setAttribute('hidden', '');
    if (el.style) el.style.display = 'none';
    if (typeof el.removeAttribute === 'function' && el.tagName === 'DETAILS') {
      el.removeAttribute('open');
    }
  }
}

/**
 * Aplica determinísticamente la proyección Statechart XOR de Harel sobre el DOM de `/cotizar/`
 * (`D5-V44`, `D6-V44`, `D7-V44`).
 *
 * @param {string} circuit
 * @param {object} [options]
 */
export function applyCircuitStatechartXOR(circuit, options = {}) {
  const doc = options.doc || (typeof document !== 'undefined' ? document : null);
  const isEs = options.isEs !== undefined ? Boolean(options.isEs) : true;
  const proj = getCircuitXorViewProjection(circuit, isEs);
  if (!doc || typeof doc.getElementById !== 'function') return proj;

  // 1. Paneles primarios de los 5 circuitos (Exclusión mutua Harel XOR)
  const panelIds = [
    'circuit-panel-bombeo',
    'circuit-panel-clasificacion',
    'circuit-panel-flotacion',
    'circuit-panel-filtracion',
    'circuit-panel-control',
  ];
  panelIds.forEach((id) => {
    const panelEl = doc.getElementById(id);
    const isVisible = id === proj.activePanelId;
    setNodeVisibility(panelEl, isVisible, id === 'circuit-panel-clasificacion' ? 'block' : '');
  });

  // 2. Calculadoras vivas de Flotación (Gorain) y Filtración (Timoshenko)
  setNodeVisibility(doc.getElementById('wb-flot-gorain-live-box'), proj.showFlotGorainLiveBox, 'block');
  setNodeVisibility(doc.getElementById('wb-filt-timoshenko-live-box'), proj.showFiltTimoshenkoLiveBox, 'block');

  // 3. D5-V44: Gaveta de 5 síntomas de bombas (#wb-symptom-context-details) exclusiva de bombeo
  setNodeVisibility(doc.getElementById('wb-symptom-context-details'), proj.showPumpSymptomsDrawer, '');

  // 4. D6-V44: Tarjeta contextual de Tren Motriz y Core Trade-In (-22% DAM005) exclusiva de bombeo
  setNodeVisibility(doc.getElementById('wb-drive-and-tradein-contextual-card'), proj.showDriveAndTradeInCard, 'block');
  setNodeVisibility(doc.getElementById('wb-pump-only-engineering-controls'), proj.showPumpOnlyEngineeringControls, '');

  const summarySpan = doc.getElementById('wb-engineering-config-summary-text');
  if (summarySpan) {
    summarySpan.textContent = proj.engineeringConfigSummary;
  }

  // 5. D7-V44: Proyección XOR del Paso 02 (#stage-2)
  setNodeVisibility(doc.getElementById('wb-step2-durand-controls-wrap'), proj.showStep2DurandPipeControls, '');
  setNodeVisibility(doc.getElementById('sim-quick-summary-bar'), proj.showStep2DurandPipeControls, '');
  setNodeVisibility(doc.getElementById('wb-clearance-kinematics-card'), proj.showStep2ClearanceAndBeltKinematics, '');
  setNodeVisibility(doc.getElementById('mech-diagnostics-inline'), proj.showStep2MechDiagnosticsInline, '');
  setNodeVisibility(doc.getElementById('wb-step2-control-summary'), proj.showStep2ControlSummary, 'block');

  const step2HintTitle = doc.getElementById('wb-step2-hint-title');
  const step2HintBody = doc.getElementById('wb-step2-hint-body');
  if (step2HintTitle) step2HintTitle.textContent = proj.step2HintTitle;
  if (step2HintBody) step2HintBody.textContent = proj.step2HintBody;

  return proj;
}

/**
 * Proyecta en el DOM la tarjeta tribológica viva `WET_END_MATERIAL_MATRIX` y el desglose
 * de ahorro de masa de `Rama D Híbrida` (`A05 + R55`) (`D9-V44` LCOM4=1).
 *
 * @param {string} matKey
 * @param {object} [options]
 */
export function renderWetEndMaterialMatrixCard(matKey, options = {}) {
  const doc = options.doc || (typeof document !== 'undefined' ? document : null);
  const isEs = options.isEs !== undefined ? Boolean(options.isEs) : true;
  if (!doc || typeof doc.getElementById !== 'function') return null;

  const key = matKey || 'alto_cromo_cr27';
  const matObj = WET_END_MATERIAL_MATRIX[key] || WET_END_MATERIAL_MATRIX.alto_cromo_cr27;
  if (!matObj) return null;

  const badgeEl = doc.getElementById('wb-mat-code-badge');
  const hardEl = doc.getElementById('wb-mat-hardness');
  const tipEl = doc.getElementById('wb-mat-tip-limit');
  const wearEl = doc.getElementById('wb-mat-wear-554');
  const d80PhEl = doc.getElementById('wb-mat-d80-ph');
  const partsEl = doc.getElementById('wb-mat-parts-list');
  const dutyEl = doc.getElementById('wb-mat-duty-desc');

  if (badgeEl) badgeEl.textContent = matObj.code + ' • ' + (isEs ? matObj.nameEs : matObj.nameEn);
  if (hardEl) hardEl.textContent = matObj.hardness;
  if (tipEl) tipEl.textContent = '≤ ' + matObj.maxTipSpeedMs.toFixed(1) + ' m/s';
  if (wearEl) wearEl.textContent = matObj.wearRatio554 + ' (δ = ' + matObj.recommendedClearanceMm.toFixed(2) + ' mm)';
  if (d80PhEl) {
    d80PhEl.textContent =
      matObj.d80RangeMicrons[0] + '–' + matObj.d80RangeMicrons[1] + ' µm • pH ' + matObj.phRange[0] + '–' + matObj.phRange[1];
  }
  if (partsEl) partsEl.textContent = (isEs ? matObj.partsIncludedEs : matObj.partsIncludedEn).join(' + ');
  if (dutyEl) dutyEl.textContent = isEs ? matObj.dutyApplicationEs : matObj.dutyApplicationEn;

  const hybridBreakdownEl = doc.getElementById('wb-hybrid-rama-d-breakdown');
  if (hybridBreakdownEl) {
    if (key === 'hybrid_a05_r55') {
      const pipeSer = options.pipeSeries || doc.getElementById('wb-pipe-size')?.value || '6x4';
      const d80Val = Number(options.d80Microns ?? doc.getElementById('slider-d80')?.value ?? 220);
      const cwVal = Number(options.solidsWeightPercent ?? doc.getElementById('slider-solids')?.value ?? 45);
      const phVal = Number(options.pulpPh ?? doc.getElementById('slider-ph')?.value ?? 7.5);
      const hybRes = evaluateHybridWetEndConfiguration({
        d80Microns: d80Val,
        tipSpeedMs: 21.5,
        pulpPh: phVal,
        solidsWeightPercent: cwVal,
        pipeSeries: pipeSer,
      });
      hybridBreakdownEl.textContent = isEs
        ? `[RAMA D] Ventaja Híbrida Rama D (${pipeSer}): Ahorro de -${hybRes.savedMassKg} kg (-${hybRes.massSavingsPct}% masa en grúa vs Full Metal ${hybRes.fullMetalMassKg} kg → ${hybRes.singlePumpMassKg} kg) • Impulsor/Cuello en A05 (≥650 HB) + Forros FPL/CPL en Hule R55.`
        : `[BRANCH D] Branch D Hybrid Advantage (${pipeSer}): Saves -${hybRes.savedMassKg} kg (-${hybRes.massSavingsPct}% rigging mass vs Full Metal ${hybRes.fullMetalMassKg} kg → ${hybRes.singlePumpMassKg} kg) • A05 Impeller/Throatbush (≥650 HB) + R55 Rubber Liners.`;
      hybridBreakdownEl.classList.remove('hidden');
      hybridBreakdownEl.style.display = 'block';
    } else {
      hybridBreakdownEl.classList.add('hidden');
      hybridBreakdownEl.style.display = 'none';
    }
  }
  return matObj;
}
