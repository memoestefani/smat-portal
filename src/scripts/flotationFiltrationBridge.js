// @ts-check
/**
 * flotationFiltrationBridge.js
 * ---------------------------------------------------------------------------
 * Módulo cohesivo (LCOM4 = 1, < 250 LOC) extraído de verticalCalculatorsAndLabelsBridge.js
 * (`SLICE-V56-07` / `D4-V56`). Enlaza Flotación (Gorain + Zwietering con unidades explícitas
 * `rateConstantPerMin` y `rateConstantPerSec`) y Filtración Prensa (Timoshenko + Darcy-Ruth).
 */

import {
  calculateFlotationGorainKineticRate,
  evaluateFilterPressPlateDeflection,
} from './slurryEngine.js';
import {
  projectDomainOutputs,
  readAllCanonicalInputs,
} from './schemaRuntimeBinder.js';
import { solveXdsmMultidisciplinaryDag } from './wizardXdsmDagSolver.js';
import {
  hydrateVerticalInputsFromUnifiedState,
  syncReactiveTraySkuButton,
} from './verticalBidirectionalHydrationLens.js';
import {
  bindAtomicPartTrayButtons,
  commitVerticalSimulation,
} from './verticalStateAndCtaSyncBridge.js';
import {
  calculateFilterPressCycleCapacity,
  evaluateFlotationCellHydrodynamics,
} from './mechanicalAndSeparationEngine.js';
import { saveStationSnapshot } from './rfqSessionStore.js';
import { formatScientificUnit } from './i18nDomainLabels.js';

/**
 * Conecta de forma canónica cualquier calculadora de Filtración Prensa (#filt-* o #rep-*).
 * @param {any} root
 * @param {string} [lang='es']
 * @param {Record<string, any>} [_options={}]
 */
export function bindCanonicalFiltrationCalculator(root, lang = 'es', _options = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';

  const pEl = /** @type {any} */ (root.querySelector('[data-schema-input="filtration.feedPressureBar"], #filt-pressure-bar, #wb-filt-pressure, #wb-filt-pressure-bar'));
  const cEl = /** @type {any} */ (root.querySelector('[data-schema-input="filtration.cloggedPortsCount"], #filt-clogged-ports, #wb-filt-clogged, #wb-filt-clogged-ports'));
  const wEl = /** @type {any} */ (root.querySelector('[data-schema-input="filtration.plateWidthMm"], #filt-plate-width, #wb-filt-width, #wb-filt-plate-width, #wb-plate-size'));
  const tEl = /** @type {any} */ (root.querySelector('[data-schema-input="filtration.plateThicknessMm"], #filt-plate-thickness, #wb-filt-thickness, #wb-filt-thickness-mm'));
  const mEl = /** @type {any} */ (root.querySelector('[data-schema-input="filtration.cakeMoistureTargetPct"], #filt-cake-moisture, #wb-filt-moisture, #wb-filt-moisture-pct'));

  const secondaryEl = root.querySelector('#filt-res-secondary');
  const sumEl = root.querySelector('#filt-res-summary, #wb-filt-res-status');
  const nomOutEl = root.querySelector('#wb-filt-res-nom141');
  const cycleMinEl = root.querySelector('#wb-filt-res-cycle-min');
  const asymDpEl = root.querySelector('#wb-filt-res-asym-dp');
  const skusEl = root.querySelector('#wb-filt-res-skus');
  const readoutBox = root.querySelector('#filt-timoshenko-readout');
  const shifterBadgeEl = root.querySelector('#filt-shifter-sku-badge');
  const nom141BadgeEl = root.querySelector('#filt-nom141-badge');

  const hydration = hydrateVerticalInputsFromUnifiedState(root, 'filtration');

  function recompute(isInitialMount = false) {
    if (!pEl || !cEl || !tEl) return null;
    const feedPressureBar = Number(pEl.value) || 12;
    const cloggedPortsCount = Number(cEl.value) || 0;
    const rawW = wEl ? Number(String(wEl.value || '').replace(/[^0-9.]/g, '')) : 1200;
    const plateWidthMm = Number.isFinite(rawW) && rawW >= 630 ? rawW : 1200;
    const plateThicknessMm = Number(tEl.value) || 65;
    const cakeMoistureTargetPct = mEl ? Number(mEl.value) || 14 : 14;

    const canonical = readAllCanonicalInputs(root, {
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });
    const dag = solveXdsmMultidisciplinaryDag(canonical);
    const dagFilt = dag.filtrationEval || {};
    const baseEval = evaluateFilterPressPlateDeflection({
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });
    const cycleRes = calculateFilterPressCycleCapacity({
      ...baseEval,
      ...dagFilt,
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });
    const res = {
      ...baseEval,
      ...cycleRes,
      recommendedShifterSkuId: baseEval.recommendedShifterSkuId || 'SMAT-FILT-SHIFTER-CHAIN',
      nom141MoistureCompliant: baseEval.nom141MoistureCompliant,
    };

    projectDomainOutputs(root, 'filtration', res, isEn ? 'en' : 'es');
    saveStationSnapshot('filtration', {
      feedPressureBar: res.feedPressureBar,
      maxBendingStressMpa: res.maxBendingStressMpa,
      cyclesPerDay: res.cyclesPerDay,
      dryTonnesPerDay: res.dryTonnesPerDay,
    });
    if (nomOutEl) {
      nomOutEl.textContent = res.nom141Compliant !== false
        ? (isEn ? 'NOM-141 OK' : 'Cumple NOM-141')
        : (isEn ? 'NOM-141 Alert' : 'Alerta NOM-141');
    }
    if (cycleMinEl) {
      cycleMinEl.textContent = isEn
        ? `Filtration ${res.filtrationMinutes} min + Turnaround 12 min = ${res.totalCycleMin} min/cycle`
        : `Filtrado ${res.filtrationMinutes} min + Descarga 12 min = ${res.totalCycleMin} min/ciclo`;
    }
    if (asymDpEl) {
      asymDpEl.textContent = `ΔP = ${res.deltaPAsymmetricMpa} MPa | σ_adm,PP = ${res.ppFatigueAllowableMpa} MPa`;
    }
    if (skusEl) {
      const packSku = res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId || 'SMAT-FILT-CLOTH-PLATE';
      const shifterSku = res.recommendedShifterSkuId || 'SMAT-FILT-SHIFTER-CHAIN';
      skusEl.textContent = isEn
        ? `Plates & Cloth: ${packSku} | Shifter: ${shifterSku}`
        : `Placas y Tela: ${packSku} | Corre-Placas: ${shifterSku}`;
    }
    const secondaryBreakdown = isEn
      ? `ΔP_asym = ${res.deltaPAsymmetricMpa} MPa · σ_adm = ${res.ppFatigueAllowableMpa} MPa · ${res.cyclesPerDay} cyc/d · ${res.dryTonnesPerDay} t/d (${res.filtrationMinutes}+12=${res.totalCycleMin} min)`
      : `ΔP_asim = ${res.deltaPAsymmetricMpa} MPa · σ_adm = ${res.ppFatigueAllowableMpa} MPa · ${res.cyclesPerDay} ciclos/d · ${res.dryTonnesPerDay} t/d (${res.filtrationMinutes}+12=${res.totalCycleMin} min)`;
    if (secondaryEl) {
      secondaryEl.textContent = secondaryBreakdown;
    }
    if (shifterBadgeEl) {
      shifterBadgeEl.textContent = res.recommendedShifterSkuId;
    }
    if (nom141BadgeEl) {
      nom141BadgeEl.textContent = res.nom141MoistureCompliant
        ? (isEn ? `NOM-141 Moisture OK (${cakeMoistureTargetPct}% ≤ 16%)` : `NOM-141 Humedad OK (${cakeMoistureTargetPct}% ≤ 16%)`)
        : (isEn ? `NOM-141 Alert (${cakeMoistureTargetPct}% > 16%)` : `Alerta NOM-141 (${cakeMoistureTargetPct}% > 16%)`);
    }
    const isAlert = Boolean(res.isPlateCrackingRisk || !res.nom141Compliant);
    if (sumEl) {
      const baseSummary = isEn ? res.summaryEn : res.summaryEs;
      const skuTail = skusEl
        ? `Shifter: ${res.recommendedShifterSkuId}`
        : (isEn
          ? `Plate: ${res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId} | Shifter: ${res.recommendedShifterSkuId}`
          : `Placa/Tela: ${res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId} | Corre-Placas: ${res.recommendedShifterSkuId}`);
      sumEl.textContent = secondaryEl
        ? `${baseSummary} | ${skuTail}`
        : `${baseSummary} | ${secondaryBreakdown} | ${skuTail}`;
      sumEl.classList?.toggle('is-alert-state', isAlert);
      sumEl.classList?.toggle('is-optimal-state', !isAlert);
    }
    if (readoutBox) {
      readoutBox.classList?.toggle('is-alert-state', isAlert);
      readoutBox.classList?.toggle('is-optimal-state', !isAlert);
    }

    syncReactiveTraySkuButton(root, {
      skuId: res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId || 'SMAT-FILT-CLOTH-PLATE',
      partCode: `${plateWidthMm}x${plateWidthMm}`,
      title: isEn
        ? `Filter Press Plates & Cloths (${plateWidthMm}×${plateWidthMm} mm, ${feedPressureBar} bar)`
        : `Placas y Lonas Filtro Prensa (${plateWidthMm}×${plateWidthMm} mm, ${feedPressureBar} bar)`,
      series: `${plateWidthMm}mm`,
      material: 'PP_VIRGEN',
      circuit: 'filtracion',
      category: 'FILTRACION_PRENSA',
    });

    commitVerticalSimulation('filtracion', {
      ...res,
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    }, {
      root,
      skipStorageWrite: Boolean(isInitialMount) && !hydration.hasPersistedState,
      queryPatch: {
        bar: feedPressureBar,
        clogged_ports: cloggedPortsCount,
        plate_mm: plateWidthMm,
        thickness_mm: plateThicknessMm,
        moisture_pct: cakeMoistureTargetPct,
        stress_mpa: res.maxBendingStressMpa,
        fs: res.flexuralSafetyFactor,
      },
    });
    return res;
  }

  bindAtomicPartTrayButtons(root);

  [pEl, cEl, wEl, tEl, mEl].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', () => recompute(false));
      el.addEventListener('change', () => recompute(false));
    }
  });

  return recompute(true);
}

/**
 * Conecta de forma canónica la calculadora de Flotación (#flot-*) con tasa cinética
 * explícita en `min⁻¹` (`rateConstantPerMin`) y `s⁻¹` (`rateConstantPerSec`).
 * @param {any} root
 * @param {string} [lang='es']
 * @param {Record<string, any>} [_options={}]
 */
export function bindCanonicalFlotationCalculator(root, lang = 'es', _options = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';

  const jgEl = /** @type {any} */ (root.querySelector('#flot-jg-input, #celdas-jg-input, #wb-flot-jg'));
  const d32El = /** @type {any} */ (root.querySelector('#flot-d32-input, #celdas-d32-input, #wb-flot-d32'));
  const diaEl = /** @type {any} */ (root.querySelector('#flot-rotor-dia, #celdas-dia-select, #wb-flot-dia, #wb-flot-rotor-dia'));
  const rpmEl = /** @type {any} */ (root.querySelector('#flot-rotor-rpm, #celdas-rpm-input, #wb-flot-rpm'));
  const d80El = /** @type {any} */ (root.querySelector('#flot-d80-input, #celdas-d80-input, #wb-flot-d80'));
  const cwEl = /** @type {any} */ (root.querySelector('#flot-cw-input, #celdas-cw-input, #wb-flot-cw'));
  const pEl = /** @type {any} */ (root.querySelector('#flot-p-input, #celdas-p-input, #wb-flot-p'));
  const rfEl = /** @type {any} */ (root.querySelector('#flot-rf-input, #celdas-rf-input, #wb-flot-rf'));
  const puLifeOut = root.querySelector('#wb-flot-res-pu-life');
  const statusOut = root.querySelector('#flot-status-out, #celdas-status-output, #wb-flot-res-susp-status');
  const readoutBox = root.querySelector('#flot-gorain-readout, #celdas-gorain-readout');

  const hydration = hydrateVerticalInputsFromUnifiedState(root, 'flotation');

  function recompute(isInitialMount = false) {
    if (!jgEl || !d32El || !diaEl || !rpmEl) return null;
    const jgCmS = Number(jgEl.value) || 1.5;
    const d32Mm = Number(d32El.value) || 1.6;
    const rotorDiaM = Number(diaEl.value) || 0.61;
    const rotorRpm = Number(rpmEl.value) || 215;
    const particleSizeUm = d80El ? Number(d80El.value) || 150 : 150;
    const solidsCwPct = cwEl ? Number(cwEl.value) || 35 : 35;
    const floatabilityP = pEl ? (Number(pEl.value) || 0.0045) : 0.0045;
    const frothRecoveryRf = rfEl ? (Number(rfEl.value) || 0.78) : 0.78;

    const baseGorain = calculateFlotationGorainKineticRate({
      rotorDiaM,
      jgCmS,
      d32Mm,
      rotorRpm,
      floatabilityP,
      frothRecoveryRf,
    });
    const rawHydro = evaluateFlotationCellHydrodynamics({
      ...baseGorain,
      rotorDiaM,
      jgCmS,
      d32Mm,
      rotorRpm,
      particleSizeUm,
      solidsCwPct,
      floatabilityP,
      frothRecoveryRf,
    });
    const rateConstantPerMin = Number(rawHydro.rateConstantMin ?? baseGorain.rateConstantMin);
    const rateConstantPerSec = Number((rateConstantPerMin / 60).toFixed(4));
    const res = {
      ...rawHydro,
      rateConstantPerMin,
      rateConstantPerSec,
      rateConstantMin: rateConstantPerMin,
    };

    projectDomainOutputs(root, 'flotation', res, isEn ? 'en' : 'es');
    saveStationSnapshot('flotation', {
      sbInverseSeconds: res.sbInverseSeconds,
      rateConstantMin: rateConstantPerMin,
      rateConstantPerMin,
      rateConstantPerSec,
      zwieteringNjsRpm: res.zwieteringNjsRpm,
      tipSpeedMS: res.tipSpeedMS,
    });
    const sbVal = res.sbInverseSeconds;
    const kVal = rateConstantPerMin;
    const vtipVal = res.tipSpeedMS;
    const sbOutEl = root.querySelector('#wb-flot-res-sb');
    const kOutEl = root.querySelector('#wb-flot-res-k');
    if (sbOutEl) sbOutEl.textContent = formatScientificUnit(sbVal, 's⁻¹', 1);
    if (kOutEl) kOutEl.textContent = formatScientificUnit(kVal, 'min⁻¹', 3);
    if (puLifeOut) {
      puLifeOut.textContent = isEn
        ? `${res.wearLifeMultiplierPuVsRubber}× · u₂ ${res.tipSpeedWindowOptimal ? 'optimal (5.5–7.5 m/s)' : 'adjust RPM'}`
        : `${res.wearLifeMultiplierPuVsRubber}× · u₂ ${res.tipSpeedWindowOptimal ? 'óptima (5.5–7.5 m/s)' : 'ajustar RPM'}`;
    }
    if (statusOut) {
      const baseSummary = isEn ? res.summaryEn : res.summaryEs;
      const tipTag = `${res.tipSpeedWindowOptimal ? (isEn ? 'Optimal Window' : 'Ventana Óptima') : (isEn ? 'Adjust RPM' : 'Ajustar RPM')} · PU ${res.wearLifeMultiplierPuVsRubber}×`;
      statusOut.textContent = `${baseSummary} · ${tipTag}`;
    }
    if (readoutBox) {
      const isOptimal = Boolean(res.gorainCompliant) && Boolean(res.suspensionSafe);
      readoutBox.classList?.toggle('is-optimal-state', isOptimal);
      readoutBox.classList?.toggle('is-alert-state', !isOptimal);
    }

    syncReactiveTraySkuButton(root, {
      skuId: res.recommendedSkuId || 'SMAT-FLOT-MECH-18SP',
      partCode: `Ø${rotorDiaM}m`,
      title: isEn
        ? `Flotation Rotor-Stator Assembly (Ø${rotorDiaM} m, Sb=${sbVal} s⁻¹)`
        : `Mecanismo Rotor-Estator Flotación (Ø${rotorDiaM} m, Sb=${sbVal} s⁻¹)`,
      series: `${rotorDiaM}m`,
      material: 'PU_SHORE90',
      circuit: 'flotacion',
      category: 'FLOTACION_ROTOR',
    });

    commitVerticalSimulation('flotacion', {
      ...res,
      cellVolumeKey: String(rotorDiaM),
      rotorDiameterM: rotorDiaM,
      superficialGasVelocityCmS: jgCmS,
      bubbleDiameterMm: d32Mm,
      rotorRpm,
      particleSizeUm,
      solidsCwPct,
      floatabilityP,
      frothRecoveryRf,
    }, {
      root,
      skipStorageWrite: Boolean(isInitialMount) && !hydration.hasPersistedState,
      queryPatch: {
        rotor_m: rotorDiaM,
        jg: jgCmS,
        d32: d32Mm,
        rpm: rotorRpm,
        d80: particleSizeUm,
        cw: solidsCwPct,
        p_flot: floatabilityP,
        rf_froth: frothRecoveryRf,
        sb: sbVal,
        k: kVal,
        vtip: vtipVal,
        njs: res.zwieteringNjsRpm,
      },
    });
    return res;
  }

  bindAtomicPartTrayButtons(root);

  [jgEl, d32El, diaEl, rpmEl, d80El, cwEl, pEl, rfEl].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', () => recompute(false));
      el.addEventListener('change', () => recompute(false));
    }
  });

  return recompute(true);
}
