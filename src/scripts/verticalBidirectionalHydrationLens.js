/**
 * verticalBidirectionalHydrationLens.js
 * ---------------------------------------------------------------------------
 * Lentes Bidireccionales Simétricas (`GetPut` $\prec$ `PutGet`, Foster et al. 2007;
 * Diskin et al. 2011; localthought/devonian) para pre-hidratación anti-amnesia de las
 * 11 calculadoras verticales, sincronización reactiva `[data-vertical-tray-btn]` y
 * controladores unificados ES/EN de Soporte de Rodamientos (`/bombeo/soporte/`)
 * y Tren Motriz (`/bombeo/skid/`) (`LCOM4 = 1`, `D2-V48`, `D3-V48`, `D4-V48`, `D9-V48`).
 */

import {
  loadUnifiedEngineeringAndWorkbenchState,
  commitVerticalSimulation,
  bindAtomicPartTrayButtons,
} from './verticalStateAndCtaSyncBridge.js';
import {
  calculateDriveAndBearingKinematics,
  selectBearingFrameByPowerAndRpm,
  evaluateHybridWetEndConfiguration,
} from './pumpAssemblyAndDriveEngine.js';
import { initCoreTradeInWidgets } from './vendorPassportAndTradeInController.js';

function mapCanonicalMaterialToTribologyBranch(rawMaterial = '') {
  const m = String(rawMaterial || '').trim().toLowerCase();
  if (!m) return undefined;
  if (m === 'hybrid_a05_r55' || m === 'hibrido_a05_r55') return 'hibrido_a05_r55';
  if (m === 'ceramica_sic' || m === 'sic') return 'ceramica_sic';
  if (m === 'hule_natural' || m === 'r55' || m === 'rubber') return 'rubber';
  if (m === 'poliuretano' || m === 'u01' || m === 'polyurethane') return 'polyurethane';
  if (m === 'alto_cromo_cr27' || m === 'a05' || m === 'metal') return 'metal';
  return m;
}

export const VERTICAL_STATION_LENS_DESCRIPTORS = Object.freeze({
  seal: {
    '#seal-hd-m': (f) => f.dischargeHeadM,
    '#seal-hs-m': (f) => f.suctionHeadM,
    '#seal-exp-dia': (f) => f.expellerDiaMm,
    '#seal-rpm': (f) => f.pumpRpm,
    '#seal-sg': (f) => f.sg,
  },
  tribology: {
    '#trib-d80-um': (f) => f.d80Um,
    '#trib-vtip-ms': (f) => f.tipSpeedMs,
    '#trib-ph': (f) => f.pulpPh,
    '#trib-branch': (f) => mapCanonicalMaterialToTribologyBranch(f.materialKey),
    '#trib-series': (f) => f.pipeSeries,
  },
  bearing: {
    '[data-bear-arr]': (f) => f.arrangementCode,
    '[data-bear-c]': (f) => f.dynamicCapacityCkN,
    '[data-bear-kw]': (f) => f.motorPowerKw,
  },
  skid: {
    '[data-kin-arrangement]': (f) => f.arrangementCode,
    '[data-kin-motor-rpm]': (f) => f.motorRpm,
    '[data-kin-driver]': (f) => f.driverPulleyMm,
    '[data-kin-driven]': (f) => f.drivenPulleyMm,
    '[data-kin-power]': (f) => f.motorPowerKw,
    '[data-kin-impeller]': (f) => f.impellerDiaMm,
    '[data-kin-material]': (f) => f.materialKey,
    '[data-kin-capacity-c]': (f) => f.dynamicCapacityCkN,
  },
  filtration: {
    '#filt-pressure-bar': (f) => f.feedPressureBar,
    '#filt-clogged-ports': (f) => f.cloggedPortsCount,
    '#filt-plate-width': (f) => f.plateWidthMm,
    '#filt-plate-thickness': (f) => f.plateThicknessMm,
    '#filt-cake-moisture': (f) => f.cakeMoistureTargetPct,
    '#rep-pressure-bar': (f) => f.feedPressureBar,
    '#rep-clogged-ports': (f) => f.cloggedPortsCount,
    '#rep-plate-width': (f) => f.plateWidthMm,
    '#rep-plate-thickness': (f) => f.plateThicknessMm,
    '#rep-cake-moisture': (f) => f.cakeMoistureTargetPct,
  },
  flotation: {
    '#flot-jg-input, #celdas-jg-input': (f) => f.jgCmS,
    '#flot-d32-input, #celdas-d32-input': (f) => f.d32Mm,
    '#flot-rotor-dia, #celdas-dia-select': (f) => f.cellVolumeKey,
    '#flot-rotor-rpm, #celdas-rpm-input': (f) => f.rotorRpm,
    '#flot-d80-input, #celdas-d80-input': (f) => f.d80Um,
    '#flot-cw-input, #celdas-cw-input': (f) => f.cw,
  },
  classification: {
    '#cyc-feed-sg': (f) => f.sg,
    '#cyc-underflow-sg': (f) => f.underflowSg,
    '#cyc-overflow-sg': (f) => f.overflowSg,
    '#cyc-solids-sg': (f) => f.solidsSg,
    '#cyc-apex-mm': (f) => f.apexMm,
    '#cyc-vortex-mm': (f) => f.vortexMm,
    '#cyc-pressure-kpa': (f) => f.feedPressureKpa,
    '#csr-aperture-mm': (f) => f.apertureMm,
    '#csr-feed-um': (f) => f.feedTopSizeUm,
  },
});

function assignControlValueSafely(el, rawVal) {
  if (!el || rawVal === undefined || rawVal === null || rawVal === '') return false;
  const tag = String(el.tagName || '').toUpperCase();
  const strVal = String(rawVal).trim();
  if (!strVal) return false;

  if (tag === 'SELECT' || (el.options && typeof el.options.length === 'number')) {
    const opts = Array.from(el.options || []);
    if (opts.length > 0) {
      const exact = opts.find((o) => String(o.value) === strVal);
      if (exact) {
        el.value = exact.value;
        return true;
      }
      const numTarget = Number(strVal);
      if (Number.isFinite(numTarget)) {
        let bestOpt = null;
        let bestDist = Infinity;
        for (const o of opts) {
          const ov = Number(o.value);
          if (!Number.isFinite(ov)) continue;
          const d = Math.abs(ov - numTarget);
          if (d < bestDist) {
            bestDist = d;
            bestOpt = o;
          }
        }
        if (bestOpt) {
          el.value = bestOpt.value;
          return true;
        }
      }
      return false;
    }
  }

  const numVal = Number(strVal);
  if (el.type === 'number' || el.type === 'range') {
    if (!Number.isFinite(numVal)) return false;
    const min = el.min !== '' && el.min !== undefined ? Number(el.min) : -Infinity;
    const max = el.max !== '' && el.max !== undefined ? Number(el.max) : Infinity;
    const clamped = Math.max(
      Number.isFinite(min) ? min : -Infinity,
      Math.min(Number.isFinite(max) ? max : Infinity, numVal)
    );
    el.value = String(clamped);
    return true;
  }

  el.value = strVal;
  return true;
}

/**
 * Ejecuta la fase `GetPut` de la lente bidireccional estrictamente ANTES del `update()` inicial
 * en cada calculadora vertical, evitando Amnesia por Sobreescritura de Defaults (`DEB-V48-06`).
 */
export function hydrateVerticalInputsFromUnifiedState(root, stationKey = 'seal', searchStr = '') {
  const unifiedState = loadUnifiedEngineeringAndWorkbenchState(searchStr);
  if (!root || typeof root.querySelector !== 'function' || !unifiedState.hasPersistedState) {
    return {
      hydratedCount: 0,
      hasPersistedState: Boolean(unifiedState.hasPersistedState),
      unifiedState,
    };
  }

  const descriptor = VERTICAL_STATION_LENS_DESCRIPTORS[stationKey] || {};
  const f = unifiedState.persistedFields || {};
  let hydratedCount = 0;

  for (const [selector, getter] of Object.entries(descriptor)) {
    const el = root.querySelector(selector);
    if (!el) continue;
    const val = getter(f);
    if (assignControlValueSafely(el, val)) {
      hydratedCount += 1;
    }
  }

  return {
    hydratedCount,
    hasPersistedState: unifiedState.hasPersistedState,
    unifiedState,
  };
}

/**
 * Sincroniza dinámicamente los atributos `data-add-tray-sku` / `data-tray-*` del botón
 * rápido `[data-vertical-tray-btn]` cuando cambian serie, material o régimen en la calculadora.
 */
export function syncReactiveTraySkuButton(root, spec = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  const buttons = Array.from(root.querySelectorAll('[data-vertical-tray-btn]'));
  let updated = 0;
  for (const btn of buttons) {
    const setAttr = (name, prop, val) => {
      if (val === undefined || val === null || val === '') return;
      if (typeof btn.setAttribute === 'function') btn.setAttribute(name, String(val));
      if (btn.dataset) btn.dataset[prop] = String(val);
    };
    setAttr('data-add-tray-sku', 'addTraySku', spec.skuId);
    setAttr('data-tray-part-code', 'trayPartCode', spec.partCode);
    setAttr('data-tray-title', 'trayTitle', spec.title);
    setAttr('data-tray-series', 'traySeries', spec.series);
    setAttr('data-tray-material', 'trayMaterial', spec.material);
    setAttr('data-tray-circuit', 'trayCircuit', spec.circuit);
    setAttr('data-tray-category', 'trayCategory', spec.category);
    updated += 1;
  }
  return updated;
}

/**
 * Controlador canónico unificado (ES/EN) del Inspector ISO 281:2007 en `/bombeo/soporte/`
 * y `/en/pumping/bearing-assembly/` con pre-hidratación `GetPut` (`D3-V48`, purga `DEB-V48-03`).
 */
export function initBearingSupportInspector(root = typeof document !== 'undefined' ? document : null, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  initCoreTradeInWidgets(root, isEn ? 'en' : 'es');
  bindAtomicPartTrayButtons(root);

  const box = root.querySelector('[data-bearing-inspector]');
  if (!box) return null;

  const arrSel = box.querySelector('[data-bear-arr]');
  const cSel = box.querySelector('[data-bear-c]');
  const kwInput = box.querySelector('[data-bear-kw]');
  const kwLbl = box.querySelector('[data-bear-kw-lbl]');
  const frEl = box.querySelector('[data-bear-fr]');
  const rpmEl = box.querySelector('[data-bear-rpm]');
  const l10hEl = box.querySelector('[data-bear-l10h]');
  const labEl = box.querySelector('[data-bear-l10mh-lab]');
  const contEl = box.querySelector('[data-bear-l10mh-cont]');
  const frameSpecEl = box.querySelector('[data-bear-frame-spec]');
  const frameLimEl = box.querySelector('[data-bear-frame-limits]');

  hydrateVerticalInputsFromUnifiedState(box, 'bearing');

  const update = (isInitialMount = false) => {
    const arrangement = arrSel?.value || 'CV';
    const dynamicCapacityCkN = Number(cSel?.value) || 195;
    const shaftPowerKw = Number(kwInput?.value) || 45;
    if (kwLbl) kwLbl.textContent = `${shaftPowerKw} kW`;
    const res = calculateDriveAndBearingKinematics({
      arrangement,
      dynamicCapacityCkN,
      shaftPowerKw,
    });
    const frameEval = selectBearingFrameByPowerAndRpm(shaftPowerKw, res.pumpRpm, '6x4');
    if (frEl) frEl.textContent = `${res.beltRadialLoadKn.toFixed(2)} kN (P = ${res.equivalentLoadPkN.toFixed(2)} kN)`;
    if (rpmEl) rpmEl.textContent = `n₂ = ${res.pumpRpm} RPM • u₂ = ${res.tipSpeedMs.toFixed(2)} m/s`;
    if (l10hEl) {
      l10hEl.textContent = isEn
        ? `ISO 281 Base L₁₀h = ${res.bearingL10Hours.toLocaleString('en-US')} h (e_c ≥ 0.6)`
        : `Base ISO 281 L₁₀h = ${res.bearingL10Hours.toLocaleString('es-MX')} h (e_c ≥ 0.6)`;
    }
    if (labEl) labEl.textContent = `${res.l10mhLabyrinthHours.toLocaleString(isEn ? 'en-US' : 'es-MX')} h (a_ISO = ${res.aIsoLabyrinthSmat}×)`;
    if (contEl) contEl.textContent = `${res.l10mhContaminatedHours.toLocaleString(isEn ? 'en-US' : 'es-MX')} h (a_ISO = ${res.aIsoContaminatedFelt}×)`;
    if (frameSpecEl) {
      const label = isEn ? frameEval.labelEn : frameEval.labelEs;
      frameSpecEl.textContent = isEn
        ? `${label} (Shaft Ø${frameEval.shaftDiameterMm} mm)`
        : `${label} (Ø Eje ${frameEval.shaftDiameterMm} mm)`;
    }
    if (frameLimEl) {
      frameLimEl.textContent = `P_max = ${frameEval.maxPowerKw} kW • n_max = ${frameEval.maxRpm} RPM • C_din = ${frameEval.recommendedDynamicCkN} kN`;
    }

    syncReactiveTraySkuButton(box, {
      skuId: 'SMAT-PUMP-BRG-005M',
      partCode: frameEval.cartridgeCode || 'DAM005',
      title: isEn
        ? `Bearing Assembly Cartridge (${frameEval.frameCode}, C=${res.dynamicCapacityCkN} kN)`
        : `Cartucho Rodamientos Completo (${frameEval.frameCode}, C=${res.dynamicCapacityCkN} kN)`,
      series: res.arrangement,
      material: 'GGG40',
      circuit: 'bombeo',
    });

    const { wetEndMaterial: _ignoredWetMat, ...bearingCommitPayload } = res;
    commitVerticalSimulation('bombeo', { ...bearingCommitPayload, ...frameEval }, {
      root,
      skipStorageWrite: Boolean(isInitialMount),
      queryPatch: {
        transmision: res.arrangement,
        cap_c_kn: res.dynamicCapacityCkN,
        power_kw: res.shaftPowerKw,
        fr_kn: res.beltRadialLoadKn.toFixed(2),
        l10h: res.bearingL10Hours,
      },
    });
    return { ...res, ...frameEval };
  };

  if (!box.dataset || box.dataset.bearBound !== '1') {
    if (box.dataset) box.dataset.bearBound = '1';
    [arrSel, cSel, kwInput].forEach((el) => {
      if (el && typeof el.addEventListener === 'function') {
        el.addEventListener('input', () => update(false));
        el.addEventListener('change', () => update(false));
      }
    });
  }

  return update(true);
}

/**
 * Controlador canónico unificado (ES/EN) del Calibrador Cinemático en `/bombeo/skid/`
 * y `/en/pumping/skid/` con `GetPut`, 5/5 materiales (`hybrid_a05_r55`), `commitVerticalSimulation`,
 * widget Core Trade-In `DAM005` y `+ Bandeja` (`D3-V48`, `D9-V48`, purga `DEB-V48-04`).
 */
export function initSkidKinematicsInspector(root = typeof document !== 'undefined' ? document : null, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  initCoreTradeInWidgets(root, isEn ? 'en' : 'es');
  bindAtomicPartTrayButtons(root);

  const panel = root.querySelector('[data-skid-kinematics]');
  if (!panel) return null;

  const arrSel = panel.querySelector('[data-kin-arrangement]');
  const motorRpmSel = panel.querySelector('[data-kin-motor-rpm]');
  const driverInput = panel.querySelector('[data-kin-driver]');
  const drivenInput = panel.querySelector('[data-kin-driven]');
  const powerInput = panel.querySelector('[data-kin-power]');
  const impSel = panel.querySelector('[data-kin-impeller]');
  const matSel = panel.querySelector('[data-kin-material]');
  const capCInput = panel.querySelector('[data-kin-capacity-c]');

  const driverVal = panel.querySelector('[data-kin-driver-val]');
  const drivenVal = panel.querySelector('[data-kin-driven-val]');
  const powerVal = panel.querySelector('[data-kin-power-val]');
  const rpmEl = panel.querySelector('[data-kin-rpm]');
  const ratioEl = panel.querySelector('[data-kin-ratio]');
  const u2El = panel.querySelector('[data-kin-u2]');
  const u2StatusEl = panel.querySelector('[data-kin-u2-status]');
  const frEl = panel.querySelector('[data-kin-fr]');
  const frSubEl = panel.querySelector('[data-kin-fr-sub]');
  const l10hEl = panel.querySelector('[data-kin-l10h]');
  const l10mhEl = panel.querySelector('[data-kin-l10mh]');
  const hybridNoteEl = panel.querySelector('[data-kin-hybrid-note]');
  const alertBox = panel.querySelector('[data-kin-rubber-alert]');
  const switchBtn = panel.querySelector('[data-kin-switch-a05]');
  const ctaEl = panel.querySelector('[data-kin-cta]');

  hydrateVerticalInputsFromUnifiedState(panel, 'skid');

  const updateKinematics = (isInitialMount = false) => {
    const arrangement = arrSel?.value || 'CV';
    const motorRpm = Number(motorRpmSel?.value) || 1780;
    const driverPulleyMm = Number(driverInput?.value) || 180;
    const drivenPulleyMm = Number(drivenInput?.value) || 320;
    const shaftPowerKw = Number(powerInput?.value) || 45;
    const impellerDiameterMm = Number(impSel?.value) || 380;
    const wetEndMaterial = matSel?.value || 'alto_cromo_cr27';
    const dynamicCapacityCkN = Number(capCInput?.value) || 145;

    if (driverInput) driverInput.disabled = arrangement === 'DC';
    if (drivenInput) drivenInput.disabled = arrangement === 'DC';
    if (driverVal) driverVal.textContent = arrangement === 'DC' ? (isEn ? '1:1 Direct' : 'Acoplado 1:1') : `${driverPulleyMm} mm`;
    if (drivenVal) drivenVal.textContent = arrangement === 'DC' ? (isEn ? '1:1 Direct' : 'Acoplado 1:1') : `${drivenPulleyMm} mm`;
    if (powerVal) powerVal.textContent = `${shaftPowerKw} kW (${Math.round(shaftPowerKw * 1.341)} HP)`;

    const engineMat = wetEndMaterial === 'hybrid_a05_r55' ? 'hule_natural' : wetEndMaterial;
    const res = calculateDriveAndBearingKinematics({
      arrangement,
      motorRpm,
      driverPulleyMm,
      drivenPulleyMm,
      impellerDiameterMm,
      shaftPowerKw,
      dynamicCapacityCkN,
      wetEndMaterial: engineMat,
    });
    const seriesByDia = { 270: '4x3', 380: '6x4', 510: '8x6', 640: '10x8' };
    const pipeSeries = seriesByDia[impellerDiameterMm] || '6x4';
    const frameEval = selectBearingFrameByPowerAndRpm(shaftPowerKw, res.pumpRpm, pipeSeries);
    const hybridEval = evaluateHybridWetEndConfiguration({ tipSpeedMs: res.tipSpeedMs, pipeSeries });

    if (rpmEl) rpmEl.textContent = `${res.pumpRpm} RPM`;
    if (ratioEl) {
      ratioEl.textContent = `Motor ${res.motorRpm} RPM • i=${res.reductionRatio.toFixed(2)}:1 (${res.speedMultiplier.toFixed(2)}×) • ${frameEval.frameCode} (Ø${frameEval.shaftDiameterMm} mm, ${frameEval.maxPowerKw} kW)`;
    }
    if (u2El) u2El.textContent = `${res.tipSpeedMs.toFixed(2)} m/s`;
    if (u2StatusEl) {
      u2StatusEl.textContent = wetEndMaterial === 'hybrid_a05_r55'
        ? (isEn
          ? `Hybrid A05+R55 (${res.tipSpeedMs <= 24.5 ? 'Within R55 24.5 m/s limit' : 'Exceeds 24.5 m/s'}) • K_Ic=18.5 MPa·√m`
          : `Rama D Híbrida A05+R55 (${res.tipSpeedMs <= 24.5 ? 'Bajo límite R55 24.5 m/s' : 'Excede 24.5 m/s'}) • K_Ic=18.5 MPa·√m`)
        : (res.rubberSafeTipSpeed
          ? (isEn ? `Safe Hule/PU/A05 (Suggested: ${res.recommendedWetMaterialByTipSpeed})` : `Apto Hule/PU/A05 (Sugerido: ${res.recommendedWetMaterialByTipSpeed})`)
          : (isEn ? `Exceeds 24.5 m/s: Exclusive ${res.recommendedWetMaterialByTipSpeed}` : `Excede 24.5 m/s: Exclusivo ${res.recommendedWetMaterialByTipSpeed}`));
    }
    if (frEl) frEl.textContent = `${res.beltRadialLoadKn.toFixed(2)} kN`;
    if (frSubEl) frSubEl.textContent = `P=${res.equivalentLoadPkN.toFixed(2)} kN (C=${res.dynamicCapacityCkN} / C_rec=${frameEval.recommendedDynamicCkN} kN) • ${res.footprintFactor.toFixed(2)}×`;
    if (l10hEl) l10hEl.textContent = `${res.bearingL10Hours.toLocaleString(isEn ? 'en-US' : 'es-MX')} h`;
    if (l10mhEl) l10mhEl.textContent = `L₁₀ₘₕ Laberinto: ${res.l10mhLabyrinthHours.toLocaleString(isEn ? 'en-US' : 'es-MX')} h (a_ISO=${res.aIsoLabyrinthSmat}×)`;
    if (hybridNoteEl) {
      hybridNoteEl.textContent = wetEndMaterial === 'hybrid_a05_r55'
        ? (isEn
          ? `Hybrid Branch D Savings: -${hybridEval.massSavingsPct}% (-${hybridEval.savedMassKg} kg NIOSH) • A05 Impeller + R55 Liners`
          : `Rama D Híbrida A05+R55: Ahorro -${hybridEval.massSavingsPct}% masa (-${hybridEval.savedMassKg} kg NIOSH)`)
        : '';
    }
    if (alertBox && alertBox.style) {
      alertBox.style.display = (res.rubberThermalLimitExceeded || res.ceramicSpallingSpeedExceeded) ? 'flex' : 'none';
    }
    if (ctaEl) {
      const base = ctaEl.getAttribute?.('data-quote-base') || (isEn ? '/en/quote/' : '/cotizar/');
      ctaEl.href = `${base}?circuito=bombeo&equipo=skid_bomba&serie=${pipeSeries}&transmision=${res.arrangement}&material=${wetEndMaterial}&driver_mm=${res.driverPulleyMm}&driven_mm=${res.drivenPulleyMm}&motor_rpm=${res.motorRpm}&power_kw=${res.shaftPowerKw}&n2_rpm=${res.pumpRpm}&fr_kn=${res.beltRadialLoadKn.toFixed(2)}&u2_ms=${res.tipSpeedMs.toFixed(2)}&l10h=${res.bearingL10Hours}&cap_c_kn=${res.dynamicCapacityCkN}#rfq`;
    }

    syncReactiveTraySkuButton(panel, {
      skuId: 'SMAT-PUMP-DRIVE-SKID',
      partCode: `${res.arrangement}-${pipeSeries}`,
      title: isEn
        ? `Motor-Pump Skid ${res.arrangement} (${pipeSeries}, ${shaftPowerKw} kW, ${wetEndMaterial})`
        : `Tren Motriz Bomba ${res.arrangement} (${pipeSeries}, ${shaftPowerKw} kW, ${wetEndMaterial})`,
      series: pipeSeries,
      material: wetEndMaterial === 'hybrid_a05_r55' ? 'HYBRID' : wetEndMaterial,
      circuit: 'bombeo',
    });

    commitVerticalSimulation('bombeo', {
      ...res,
      ...frameEval,
      pipeSeries,
      materialKey: wetEndMaterial,
      impellerDiaMm: impellerDiameterMm,
      hybridMassSavingsPct: hybridEval.massSavingsPct,
    }, {
      root,
      skipStorageWrite: Boolean(isInitialMount),
      queryPatch: {
        serie: pipeSeries,
        transmision: res.arrangement,
        material: wetEndMaterial,
        power_kw: res.shaftPowerKw,
        n2_rpm: res.pumpRpm,
        u2_ms: res.tipSpeedMs.toFixed(2),
        l10h: res.bearingL10Hours,
        cap_c_kn: res.dynamicCapacityCkN,
      },
    });
    return { ...res, wetEndMaterial, pipeSeries };
  };

  if (!panel.dataset || panel.dataset.skidBound !== '1') {
    if (panel.dataset) panel.dataset.skidBound = '1';
    [arrSel, motorRpmSel, driverInput, drivenInput, powerInput, impSel, matSel, capCInput].forEach((el) => {
      if (el && typeof el.addEventListener === 'function') {
        el.addEventListener('input', () => updateKinematics(false));
        el.addEventListener('change', () => updateKinematics(false));
      }
    });
    if (switchBtn && matSel && typeof switchBtn.addEventListener === 'function') {
      switchBtn.addEventListener('click', () => {
        matSel.value = 'alto_cromo_cr27';
        updateKinematics(false);
      });
    }
  }

  return updateKinematics(true);
}
