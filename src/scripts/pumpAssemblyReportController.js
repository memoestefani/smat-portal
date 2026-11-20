/**
 * pumpAssemblyReportController.js
 * ---------------------------------------------------------------------------
 * Controlador Modular LCOM4 = 1 (∂(C) = 0) para el Reporte de Armado de Bombas
 * en 5 Estaciones (`PumpAssemblyReport.astro`, `D6-V46`, `[ARB-SMAT-54]`).
 *
 * Responsabilidad Única:
 *   Orquestar el Calibrador en Vivo de Claro Axial Frontal δ_frontal (Ley de
 *   Recirculación de Gülich Δη_v = k_r·(δ/b_2)^1.5), la validación topológica
 *   de secuencia 01–05 (`evaluatePumpAssemblySequence`), la Rama D Híbrida
 *   (`evaluateHybridWetEndConfiguration`), la capa de Rayos X de desgaste y la
 *   persistencia transaccional dual (`commitVerticalSimulation('bombeo', ...)`).
 */

import {
  evaluateWetEndAssemblyInterference,
  evaluatePumpAssemblySequence,
  evaluateHybridWetEndConfiguration,
} from './pumpAssemblyAndDriveEngine.js';
import { computeSelectionOrderCodeHash } from './slurryEngine.js';
import { saveWorkbenchState, loadWorkbenchState } from './workbenchBus.js';
import { commitVerticalSimulation } from './verticalStateAndCtaSyncBridge.js';

/**
 * Inicializa todas las instancias de `[data-pump-assembly-report]` dentro de `root`.
 *
 * @param {any} [root]
 * @returns {number} Cantidad de reportes inicializados
 */
export function initPumpAssemblyReport(root = typeof document !== 'undefined' ? document : null) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  const reports = Array.from(root.querySelectorAll('[data-pump-assembly-report]'));
  let initializedCount = 0;

  reports.forEach((section) => {
    const buttons = section.querySelectorAll('[data-assembly-branch-btn]');
    const xrayToggleBtn = section.querySelector('[data-toggle-xray]');
    const xrayLayer = section.querySelector('[data-layer="xray-wear"]');
    const orderHashBadge = section.querySelector('[data-selection-order-hash]');
    const rows = section.querySelectorAll('[data-bom-row]');
    const bomLinks = section.querySelectorAll('[data-bom-quote-link]');
    const stationCtas = section.querySelectorAll('[data-station-cta]');
    const lotCta = section.querySelector('.assembly-report__lot-cta');
    const svgBranches = section.querySelectorAll('[data-svg-branch]');
    let activeBranch = 'metal';
    let activeMaterialKey = 'alto_cromo_cr27';

    const slider = section.querySelector('[data-clearance-slider]');
    const b2Select = section.querySelector('[data-clearance-b2]');
    const sealSelect = section.querySelector('[data-seal-branch-select]');
    const seqSelect = section.querySelector('[data-clearance-seq-select]');
    const readoutEl = section.querySelector('[data-clearance-readout]');
    const lossEl = section.querySelector('[data-clearance-loss]');
    const ratioEl = section.querySelector('[data-clearance-ratio]');
    const statusEl = section.querySelector('[data-clearance-status]');
    const vcLossEl = section.querySelector('[data-clearance-vc-loss]');
    const lot554El = section.querySelector('[data-clearance-lot554]');
    const massTotalEl = section.querySelector('[data-clearance-mass-total]');
    const seqStatusEl = section.querySelector('[data-clearance-seq-status]');
    const quoteCta = section.querySelector('[data-clearance-quote-cta]');
    const svgValEl = section.querySelector('[data-est-05-val]');
    const svgBoxEl = section.querySelector('[data-est-05-box]');
    const isEnDoc = typeof document !== 'undefined' && document.documentElement && document.documentElement.lang === 'en';

    const syncAllAssemblyLinks = (frontClearanceMm, impellerExitWidthMm, sealBranch, pipeSeries) => {
      const claroStr = Number(frontClearanceMm).toFixed(2);
      bomLinks.forEach((link) => {
        const base = link.getAttribute('data-quote-base') || '/cotizar/';
        const eq = link.getAttribute('data-base-equipo') || 'bombeo_hule_cromo';
        const pz = link.getAttribute('data-base-pieza') || 'lote_554';
        const baseMat = link.getAttribute('data-base-material') || 'alto_cromo_cr27';
        const st = link.getAttribute('data-base-station') || 'S4';
        const wt = link.getAttribute('data-base-weight') || '38.4';
        const resolvedMat = activeMaterialKey === 'ceramica_sic' && (baseMat === 'alto_cromo_cr27' || baseMat === 'hule_natural')
          ? 'ceramica_sic'
          : (activeMaterialKey !== 'alto_cromo_cr27' && st !== 'S1' ? activeMaterialKey : baseMat);
        link.href = `${base}?circuito=bombeo&equipo=${eq}&pieza=${pz}&material=${resolvedMat}&serie=${pipeSeries}&estacion=${st}&peso_kg=${wt}&claro_mm=${claroStr}&b2_mm=${impellerExitWidthMm}&seal_branch=${sealBranch}#rfq`;
      });
      stationCtas.forEach((link) => {
        const base = link.getAttribute('data-quote-base') || '/cotizar/';
        const st = link.getAttribute('data-station-cta') || 'S4';
        link.href = `${base}?circuito=bombeo&equipo=bombeo_hule_cromo&estacion=${st}&material=${activeMaterialKey}&serie=${pipeSeries}&claro_mm=${claroStr}&b2_mm=${impellerExitWidthMm}&seal_branch=${sealBranch}#rfq`;
      });
      if (lotCta) {
        const base = isEnDoc ? '/en/quote/' : '/cotizar/';
        lotCta.href = `${base}?circuito=bombeo&equipo=bombeo_hule_cromo&pieza=lote_554&material=${activeMaterialKey}&serie=${pipeSeries}&estacion=S4&claro_mm=${claroStr}&b2_mm=${impellerExitWidthMm}&seal_branch=${sealBranch}#rfq`;
      }
    };

    const updateClearanceSimulation = () => {
      if (!slider) return;
      const frontClearanceMm = Number(slider.value) || 0.75;
      const impellerExitWidthMm = b2Select ? Number(b2Select.value) || 48 : 48;
      const sealBranch = sealSelect ? sealSelect.value : 'expeller_dry';
      const pipeSeries = impellerExitWidthMm <= 38 ? '3x2' : (impellerExitWidthMm >= 64 ? '8x6' : '6x4');
      const sequencePreset = seqSelect ? seqSelect.value : 'canonical';
      const res = evaluateWetEndAssemblyInterference({
        wetEndBranch: activeBranch,
        sealBranch,
        frontClearanceMm,
        impellerExitWidthMm,
        pipeSeries,
        sequencePreset,
      });

      if (readoutEl) readoutEl.textContent = `${res.frontClearanceMm.toFixed(2)} mm`;
      if (orderHashBadge) {
        const codeHash = computeSelectionOrderCodeHash({
          branch: activeBranch,
          mat: activeMaterialKey,
          seal: sealBranch,
          b2: impellerExitWidthMm,
          claro: res.frontClearanceMm.toFixed(2),
        });
        orderHashBadge.textContent = `Ref: ${codeHash}`;
      }
      if (lossEl) lossEl.textContent = `${res.volumetricEfficiencyDropPct.toFixed(2)}%`;
      if (ratioEl) {
        ratioEl.textContent = isEnDoc
          ? `${res.excessRecirculationRatio.toFixed(2)}× baseline recirculation`
          : `${res.excessRecirculationRatio.toFixed(2)}× recirculación base`;
      }
      if (statusEl) {
        let label = isEnDoc ? 'OPTIMAL CALIBRATION (0.5–1.0 mm)' : 'CALIBRACIÓN ÓPTIMA (0.5–1.0 mm)';
        if (res.clearanceStatus === 'RUBBING_RISK') {
          label = isEnDoc ? 'CRITICAL: AXIAL RUBBING RISK (< 0.5 mm)' : 'CRÍTICO: RIESGO DE ROCE AXIAL (< 0.5 mm)';
        } else if (res.clearanceStatus === 'EXCESS_RECIRCULATION_WEAR') {
          label = isEnDoc ? 'WARNING: EXCESS VORTEX WEAR (> 1.0 mm)' : 'ALERTA: VÓRTICE DE RECIRCULACIÓN (> 1.0 mm)';
        }
        statusEl.textContent = label;
      }
      if (vcLossEl) {
        vcLossEl.textContent = isEnDoc
          ? `Pipe Vc margin impact: -${res.pipeVelocityMarginLossPct.toFixed(2)}%`
          : `Margen Vc tubería: -${res.pipeVelocityMarginLossPct.toFixed(2)}%`;
      }
      const isHybridActive = activeMaterialKey === 'hybrid_a05_r55' || activeMaterialKey === 'hibrido_a05_r55';
      const hybridEval = isHybridActive
        ? evaluateHybridWetEndConfiguration({ d80Microns: 220, tipSpeedMs: 21.8, pulpPh: 7.5, solidsWeightPercent: 48, pipeSeries })
        : null;
      const seqAudit = evaluatePumpAssemblySequence({
        frontClearanceMm,
        impellerTorqueNm: 450,
        d80Microns: 220,
        wetEndBranch: activeMaterialKey,
        sealBranch,
        pipeSeries,
        sequencePreset,
      });
      if (lot554El) {
        lot554El.textContent = hybridEval
          ? (isEnDoc
            ? `${hybridEval.wearSynchronizationRatio} • Finnie-Hutchings (Impeller A05 α=${hybridEval.impellerImpactAngleDeg}° + Liners R55 α=${hybridEval.linerGrazingAngleDeg}°, Thermal=${hybridEval.rubberThermalSafe ? 'OK' : 'Alert'}, Cut=${hybridEval.particleCutSafe ? 'OK' : 'Alert'})`
            : `${hybridEval.wearSynchronizationRatio} • Finnie-Hutchings (Impulsor A05 α=${hybridEval.impellerImpactAngleDeg}° + Forros R55 α=${hybridEval.linerGrazingAngleDeg}°, Térmico=${hybridEval.rubberThermalSafe ? 'OK' : 'Alerta'}, Corte=${hybridEval.particleCutSafe ? 'OK' : 'Alerta'})`)
          : (isEnDoc ? res.wearRatioImpact554En : res.wearRatioImpact554);
      }
      if (massTotalEl) {
        massTotalEl.textContent = hybridEval
          ? (isEnDoc
            ? `${hybridEval.singlePumpMassKg.toFixed(1)} kg (-${hybridEval.massSavingsPct}% mass vs full metal) • ${res.nioshHoistPartsCount} NIOSH hoists`
            : `${hybridEval.singlePumpMassKg.toFixed(1)} kg (-${hybridEval.massSavingsPct}% masa vs 100% metal) • ${res.nioshHoistPartsCount} izajes NIOSH`)
          : (isEnDoc
            ? `${res.totalAssemblyMassKg.toFixed(1)} kg • ${res.nioshHoistPartsCount} NIOSH hoists (≥23 kg)`
            : `${res.totalAssemblyMassKg.toFixed(1)} kg • ${res.nioshHoistPartsCount} izajes NIOSH (≥23 kg)`);
      }
      if (seqStatusEl) {
        const bandStr = Array.isArray(seqAudit.optimalClearanceBandMm) ? seqAudit.optimalClearanceBandMm.join('–') : '0.5–1.0';
        const spallStr = isEnDoc ? seqAudit.spallingWarningEn : seqAudit.spallingWarningEs;
        seqStatusEl.textContent = res.sequenceValid
          ? (isEnDoc
            ? `Sequence 01–05 valid (Ng=${seqAudit.geometricInterferencesNg}, Ns=${seqAudit.unstableSubassembliesNs}, Band ${bandStr} mm • ${spallStr})`
            : `Secuencia 01–05 válida (Ng=${seqAudit.geometricInterferencesNg}, Ns=${seqAudit.unstableSubassembliesNs}, Banda ${bandStr} mm • ${spallStr})`)
          : (isEnDoc ? `BLOCKED (${res.outOfOrderStationId}): ${res.collisionDetailsEn}` : `BLOQUEO (${res.outOfOrderStationId}): ${res.collisionDetailsEs}`);
      }
      if (svgValEl) svgValEl.textContent = `${res.frontClearanceMm.toFixed(2)} mm`;
      if (svgBoxEl) {
        const strokeColor = !res.sequenceValid || res.clearanceStatus === 'RUBBING_RISK'
          ? '#dc2626'
          : (res.clearanceStatus === 'OPTIMAL_CALIBRATION' ? '#15803d' : '#7c2d12');
        svgBoxEl.setAttribute('stroke', strokeColor);
      }
      if (quoteCta) {
        const base = quoteCta.getAttribute('data-quote-base') || '/cotizar/';
        quoteCta.href = `${base}?circuito=bombeo&equipo=bombeo_hule_cromo&pieza=throatbush&material=${activeMaterialKey}&estacion=S5&claro_mm=${res.frontClearanceMm.toFixed(2)}&seal_branch=${res.sealBranch}&b2_mm=${res.impellerExitWidthMm}#rfq`;
      }
      syncAllAssemblyLinks(res.frontClearanceMm, res.impellerExitWidthMm, res.sealBranch, pipeSeries);

      const prev = loadWorkbenchState() || {};
      saveWorkbenchState({
        ...prev,
        pump_material: activeMaterialKey,
        frontClearanceMm: res.frontClearanceMm,
        claro_mm: res.frontClearanceMm,
        clearance_mm: res.frontClearanceMm,
        seal_branch: res.sealBranch,
        sealBranch: res.sealBranch,
        b2_mm: res.impellerExitWidthMm,
        impellerExitWidthMm: res.impellerExitWidthMm,
        volumetricLossPct: res.volumetricEfficiencyDropPct,
        clearanceStatus: res.clearanceStatus,
        assemblySequencePreset: sequencePreset,
        assemblySequenceValid: res.sequenceValid,
        totalAssemblyMassKg: res.totalAssemblyMassKg,
        nioshHoistPartsCount: res.nioshHoistPartsCount,
      });
      commitVerticalSimulation('bombeo', {
        wetEndMaterial: activeMaterialKey,
        frontClearanceMm: res.frontClearanceMm,
        sealBranch: res.sealBranch,
        impellerExitWidthMm: res.impellerExitWidthMm,
        volumetricEfficiencyDropPct: res.volumetricEfficiencyDropPct,
        clearanceStatus: res.clearanceStatus,
        totalAssemblyMassKg: res.totalAssemblyMassKg,
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selectedBranch = btn.getAttribute('data-assembly-branch-btn') || 'all';
        activeBranch = (selectedBranch === 'hule_natural' || selectedBranch === 'hybrid_a05_r55') ? 'rubber' : (selectedBranch === 'ceramica_sic' ? 'ceramica_sic' : 'metal');
        activeMaterialKey = selectedBranch === 'all' ? 'alto_cromo_cr27' : selectedBranch;
        if (selectedBranch === 'ceramica_sic' && slider) {
          slider.value = '0.65';
        }
        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        rows.forEach((row) => {
          const rowBranch = row.getAttribute('data-bom-branch') || 'common';
          const visible = selectedBranch === 'all'
            || rowBranch === 'common'
            || rowBranch === selectedBranch
            || (selectedBranch === 'ceramica_sic' && rowBranch === 'alto_cromo_cr27')
            || (selectedBranch === 'hybrid_a05_r55' && rowBranch === 'hule_natural');
          row.style.display = visible ? '' : 'none';
        });

        svgBranches.forEach((g) => {
          const gBranch = g.getAttribute('data-svg-branch');
          const isHybridSel = selectedBranch === 'hybrid_a05_r55' || selectedBranch === 'hibrido_a05_r55';
          const active = selectedBranch === 'all'
            || gBranch === selectedBranch
            || (selectedBranch === 'ceramica_sic' && gBranch === 'alto_cromo_cr27')
            || (isHybridSel && (gBranch === 'alto_cromo_cr27' || gBranch === 'hule_natural'));
          g.style.opacity = active ? '1' : '0.28';
        });
        updateClearanceSimulation();
      });
    });

    if (slider) slider.addEventListener('input', updateClearanceSimulation);
    if (b2Select) b2Select.addEventListener('change', updateClearanceSimulation);
    if (sealSelect) sealSelect.addEventListener('change', updateClearanceSimulation);
    if (seqSelect) seqSelect.addEventListener('change', updateClearanceSimulation);
    if (xrayToggleBtn && xrayLayer) {
      xrayToggleBtn.addEventListener('click', () => {
        const isPressed = xrayToggleBtn.getAttribute('aria-pressed') === 'true';
        const nextState = !isPressed;
        xrayToggleBtn.setAttribute('aria-pressed', String(nextState));
        xrayToggleBtn.classList.toggle('is-active', nextState);
        xrayLayer.style.display = nextState ? '' : 'none';
        xrayToggleBtn.textContent = isEnDoc
          ? (nextState ? 'Wear X-Ray Layer: ON' : 'Wear X-Ray Layer: OFF')
          : (nextState ? 'Rayos X de Desgaste: ACTIVO' : 'Rayos X de Desgaste: OCULTO');
      });
    }
    updateClearanceSimulation();
    initializedCount += 1;
  });

  return initializedCount;
}
