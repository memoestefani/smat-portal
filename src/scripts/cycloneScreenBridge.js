// @ts-check
/**
 * cycloneScreenBridge.js
 * ---------------------------------------------------------------------------
 * Módulo cohesivo (LCOM4 = 1, < 260 LOC) extraído de verticalCalculatorsAndLabelsBridge.js
 * (`SLICE-V56-07` / `D4-V56`). Enlaza Balance 3 Vasos Marcy + Plitt (d50c) con
 * Criba de Uretano Weibull (d80 = 2.2 × d50c) usando `cyclone.feedPulpSgKgL` aislado.
 */

import {
  calculateThreeCupMarcyCycloneBalance,
  calculateUrethaneScreenPartitionWeibull,
} from './slurryEngine.js';
import { projectDomainOutputs } from './schemaRuntimeBinder.js';
import {
  hydrateVerticalInputsFromUnifiedState,
  syncReactiveTraySkuButton,
} from './verticalBidirectionalHydrationLens.js';
import {
  bindAtomicPartTrayButtons,
  commitVerticalSimulation,
} from './verticalStateAndCtaSyncBridge.js';
import { evaluateHydrocycloneCutPoint } from './mechanicalAndSeparationEngine.js';
import { saveStationSnapshot } from './rfqSessionStore.js';

/**
 * Conecta en una sola estación acoplada el Balance de 3 Vasos Marcy + Plitt (d50c)
 * con la Criba de Uretano Weibull (d80 = 2.2 × d50c) en `/clasificacion/`.
 * @param {any} root
 * @param {string} [lang='es']
 * @param {Record<string, any>} [_options={}]
 */
export function bindCoupledClassificationStation(root, lang = 'es', _options = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';

  const feedInput = /** @type {any} */ (root.querySelector('#wb-cyc-sg-feed, #cyc-feed-sg'));
  const underInput = /** @type {any} */ (root.querySelector('#wb-cyc-sg-uf, #cyc-underflow-sg'));
  const overInput = /** @type {any} */ (root.querySelector('#wb-cyc-sg-of, #cyc-overflow-sg'));
  const solidsInput = /** @type {any} */ (root.querySelector('#wb-cyc-solids-sg, #cyc-solids-sg'));
  const apexInput = /** @type {any} */ (root.querySelector('#wb-cyc-apex-mm, #cyc-apex-mm'));
  const vortexInput = /** @type {any} */ (root.querySelector('#wb-cyc-vortex-mm, #cyc-vortex-mm'));
  const pressInput = /** @type {any} */ (root.querySelector('#wb-cyc-pressure-kpa, #cyc-pressure-kpa'));

  const regimeEl = root.querySelector('#cyc-res-regime, #wb-cyc-res-roping');
  const recEl = root.querySelector('#cyc-res-recovery');
  const cvuEl = root.querySelector('#cyc-res-cvu, #wb-cyc-res-cvu');
  const actionEl = root.querySelector('#cyc-res-action');
  const couplingBadgeEl = root.querySelector('#cyc-screen-coupling-badge');
  const skuLink = /** @type {any} */ (root.querySelector('#cyc-recommended-sku-link'));
  const rfqLink = /** @type {any} */ (root.querySelector('#cyc-rfq-link'));

  const csrApertureInput = /** @type {any} */ (root.querySelector('#csr-aperture-mm, #wb-scr-aperture-mm'));
  const csrReliefInput = /** @type {any} */ (root.querySelector('#csr-relief-deg, #wb-scr-relief-deg'));
  const csrFeedInput = /** @type {any} */ (root.querySelector('#csr-feed-um'));
  const csrVibrationInput = /** @type {any} */ (root.querySelector('#csr-vibration-g, #wb-scr-vibration-g'));
  const csrAlphaInput = /** @type {any} */ (root.querySelector('#csr-alpha-select, #wb-scr-alpha'));
  const csrWeibullOut = root.querySelector('#csr-weibull-out');
  const csrRfqLink = /** @type {any} */ (root.querySelector('#csr-rfq-link'));
  const screenTrayBtn = /** @type {any} */ (root.querySelector('[data-screen-tray-btn]'));

  const hydration = hydrateVerticalInputsFromUnifiedState(root, 'classification');

  /**
   * @param {number | null} [overrideFeedUm=null]
   */
  function recomputeScreenWeibull(overrideFeedUm = null) {
    const apertureMm = csrApertureInput ? Number(csrApertureInput.value) || 0.50 : 0.50;
    const reliefAngleDeg = csrReliefInput ? Number(csrReliefInput.value) || 4.0 : 4.0;
    const vibrationG = csrVibrationInput ? Number(csrVibrationInput.value) || 4.5 : 4.5;
    const sharpnessAlpha = csrAlphaInput ? Number(csrAlphaInput.value) || 4.4 : 4.4;
    const feedParticleUm =
      overrideFeedUm !== null
        ? Number(overrideFeedUm)
        : csrFeedInput
          ? Number(csrFeedInput.value) || 163
          : 163;
    if (csrFeedInput && overrideFeedUm !== null) {
      csrFeedInput.value = String(feedParticleUm);
    }
    const weibullRes = calculateUrethaneScreenPartitionWeibull({
      apertureMm,
      reliefAngleDeg,
      vibrationG,
      sharpnessAlpha,
      feedParticleUm,
    });
    if (csrWeibullOut) {
      csrWeibullOut.textContent = isEn
        ? `Oversize Partition: ${weibullRes.partitionToOversizePct}% · Dilation Δa/a: ${weibullRes.elasticDilationPct}% (${weibullRes.vibrationG}G · α=${weibullRes.sharpnessAlpha}, ${weibullRes.antiBlindingCompliant ? 'Anti-Blinding OK' : 'Review θ'}) · SKU: ${weibullRes.recommendedSkuId}`
        : `Retención Oversize: ${weibullRes.partitionToOversizePct}% · Dilatación Δa/a: ${weibullRes.elasticDilationPct}% (${weibullRes.vibrationG}G · α=${weibullRes.sharpnessAlpha}, ${weibullRes.antiBlindingCompliant ? 'Anti-Cegamiento OK' : 'Revisar θ'}) · SKU: ${weibullRes.recommendedSkuId}`;
    }
    if (csrRfqLink) {
      const basePath = isEn ? '/en/quote/' : '/cotizar/';
      csrRfqLink.href = `${basePath}?circuito=clasificacion&equipo=malla_criba_poliuretano&sku=${encodeURIComponent(weibullRes.recommendedSkuId)}&mat=poliuretano&aperture_mm=${apertureMm}&relief_deg=${reliefAngleDeg}&screen_d80_um=${feedParticleUm}#rfq`;
    }
    if (screenTrayBtn) {
      const setAttr = (name, prop, val) => {
        if (typeof screenTrayBtn.setAttribute === 'function') screenTrayBtn.setAttribute(name, String(val));
        if (screenTrayBtn.dataset) screenTrayBtn.dataset[prop] = String(val);
      };
      setAttr('data-add-tray-sku', 'addTraySku', weibullRes.recommendedSkuId || 'SMAT-SCR-URETHANE-PANEL');
      setAttr('data-tray-series', 'traySeries', `${apertureMm}mm`);
      setAttr('data-tray-material', 'trayMaterial', 'U01');
      setAttr('data-tray-circuit', 'trayCircuit', 'clasificacion');
    }
    return weibullRes;
  }

  function recompute(isInitialMount = false) {
    if (!feedInput || !underInput || !overInput) return null;
    const res = calculateThreeCupMarcyCycloneBalance({
      feedSg: Number(feedInput.value) || 1.35,
      underflowSg: Number(underInput.value) || 1.72,
      overflowSg: Number(overInput.value) || 1.15,
      solidsSg: solidsInput ? Number(solidsInput.value) || 2.7 : 2.7,
      apexDiameterMm: apexInput ? Number(apexInput.value) || 50 : 50,
      vortexDiameterMm: vortexInput ? Number(vortexInput.value) || 100 : 100,
      feedPressureKpa: pressInput ? Number(pressInput.value) || 95 : 95,
    });

    if (regimeEl && typeof regimeEl.setAttribute === 'function') {
      regimeEl.setAttribute('data-regime', res.dischargeRegime);
    }
    if (recEl) recEl.textContent = `${res.solidsRecoveryPct}%`;
    if (cvuEl) cvuEl.textContent = `${res.cvUnderflowPct}% (du/do=${res.apexToVortexRatio})`;

    const coupledD80Um = isInitialMount && hydration.hasPersistedState && hydration.unifiedState?.persistedFields?.feedTopSizeUm
      ? hydration.unifiedState.persistedFields.feedTopSizeUm
      : Math.round(res.d50cMicrons * 2.2);
    const weibullRes = recomputeScreenWeibull(coupledD80Um);

    if (couplingBadgeEl) {
      couplingBadgeEl.textContent = isEn
        ? `Coupled Closed-Circuit Flow: Cyclone Cut d50c = ${res.d50cMicrons} µm → Urethane Screen Feed d80 = ${coupledD80Um} µm`
        : `Flujo Acoplado en Circuito Cerrado: Corte Ciclón d50c = ${res.d50cMicrons} µm → Alimentación Criba d80 = ${coupledD80Um} µm`;
    }

    if (actionEl) {
      const threeCupsInfo = isEn
        ? `3 Cups: Feed Cw ${res.cwFeedPct}% (Cv ${res.cvFeedPct}%) | UF Cw ${res.cwUnderflowPct}% | OF Cw ${res.cwOverflowPct}% (Cv ${res.cvOverflowPct}%) • ${res.isUmbrellaDilute ? 'Dilute Umbrella' : 'Stable Cone'}`
        : `3 Vasos: Cw Alim ${res.cwFeedPct}% (Cv ${res.cvFeedPct}%) | Cw Desc ${res.cwUnderflowPct}% | Cw Reb ${res.cwOverflowPct}% (Cv ${res.cvOverflowPct}%) • ${res.isUmbrellaDilute ? 'Paraguas Diluido' : 'Paraguas Estable'}`;
      actionEl.textContent = `${isEn ? res.diagnosticActionEn : res.diagnosticActionEs} [${threeCupsInfo}]`;
    }

    const coupledEval = evaluateHydrocycloneCutPoint({
      feedSg: res.feedSg,
      underflowSg: res.underflowSg,
      overflowSg: res.overflowSg,
      feedPressureKpa: res.feedPressureKpa,
    });
    projectDomainOutputs(root, 'cycloneScreen', {
      ...res,
      ...coupledEval,
      partitionToOversizePct: weibullRes.partitionToOversizePct,
      elasticDilationPct: weibullRes.elasticDilationPct,
      sharpnessAlpha: weibullRes.sharpnessAlpha,
    }, isEn ? 'en' : 'es');
    saveStationSnapshot('cycloneScreen', {
      feedPulpSgKgL: res.feedSg,
      circulatingLoadPct: res.circulatingLoadPct,
      d50cMicrons: res.d50cMicrons,
      cvUnderflow: res.cvUnderflow,
      dischargeRegime: res.dischargeRegime,
      recommendedSkuId: res.recommendedSkuId,
    });

    if (skuLink) {
      if (isEn) {
        skuLink.href =
          res.recommendedSkuId === 'SMAT-COUPLED-PUMP-CYC'
            ? '/en/products/coupled-pump-hydrocyclone-package/'
            : '/en/products/hydrocyclone-assembly-and-spigots-d6-d20/';
        skuLink.textContent = `Configure Recommended Spare (${res.recommendedSkuId}) →`;
      } else {
        skuLink.href =
          res.recommendedSkuId === 'SMAT-COUPLED-PUMP-CYC'
            ? '/productos/paquete-casado-bomba-hidrociclon/'
            : '/productos/hidrociclon-completo-y-boquillas-d6-d20/';
        skuLink.textContent = `Configurar Repuesto Recomendado (${res.recommendedSkuId}) →`;
      }
    }

    if (rfqLink) {
      const matRec = res.isRopingCritical ? 'ceramica_sic' : 'alto_cromo_cr27';
      const basePath = isEn ? '/en/quote/' : '/cotizar/';
      rfqLink.href = `${basePath}?circuito=clasificacion&equipo=hidrociclon_apex_vortex&sku=${encodeURIComponent(res.recommendedSkuId)}&mat=${matRec}&rho_f=${res.feedSg}&rho_u=${res.underflowSg}&rho_o=${res.overflowSg}&rs_pct=${res.solidsRecoveryPct}&cv_u=${res.cvUnderflowPct}&d50c=${res.d50cMicrons}&aperture_mm=${weibullRes.apertureMm}&screen_d80_um=${coupledD80Um}&roping_risk=${res.isRopingCritical ? '1' : '0'}#rfq`;
    }

    syncReactiveTraySkuButton(root, {
      skuId: res.recommendedSkuId || 'SMAT-CYC-COUPLED-KIT',
      partCode: `${res.apexDiameterMm}/${res.vortexDiameterMm}`,
      title: isEn
        ? `Hydrocyclone Assembly (${res.d50cMicrons} µm cut, Apex ${res.apexDiameterMm} mm)`
        : `Hidrociclón Calibrado (Corte d50c ${res.d50cMicrons} µm, Apex ${res.apexDiameterMm} mm)`,
      series: `Ø${res.apexDiameterMm}/${res.vortexDiameterMm}`,
      material: res.isRopingCritical ? 'SiC' : 'R55',
      circuit: 'clasificacion',
      category: 'HIDROCICLON_CLASIFICACION',
    });

    const skipWrite = Boolean(isInitialMount) && !hydration.hasPersistedState;
    commitVerticalSimulation('clasificacion', {
      ...res,
      ...coupledEval,
      feedPulpSgKgL: res.feedSg,
      feedPressureKpa: res.feedPressureKpa,
      apexMm: res.apexDiameterMm,
      vortexMm: res.vortexDiameterMm,
      coupledScreenFeedD80Um: coupledD80Um,
      apertureMm: weibullRes.apertureMm,
      reliefAngleDeg: weibullRes.reliefAngleDeg,
      partitionToOversizePct: weibullRes.partitionToOversizePct,
    }, {
      root,
      skipStorageWrite: skipWrite,
      queryPatch: {
        rho_f: res.feedSg,
        uf_sg: res.underflowSg,
        of_sg: res.overflowSg,
        solids_sg: res.solidsSg,
        apex_mm: res.apexDiameterMm,
        vortex_mm: res.vortexDiameterMm,
        press_kpa: res.feedPressureKpa,
        d50c: res.d50cMicrons,
        aperture_mm: weibullRes.apertureMm,
      },
    });
    return res;
  }

  function onManualScreenChange() {
    const weibullRes = recomputeScreenWeibull(null);
    commitVerticalSimulation('clasificacion', {
      apertureMm: weibullRes.apertureMm,
      reliefAngleDeg: weibullRes.reliefAngleDeg,
      coupledScreenFeedD80Um: weibullRes.feedParticleUm,
      feedTopSizeUm: weibullRes.feedParticleUm,
      partitionToOversizePct: weibullRes.partitionToOversizePct,
    }, {
      root,
      queryPatch: {
        aperture_mm: weibullRes.apertureMm,
        feed_um: weibullRes.feedParticleUm,
      },
    });
  }

  bindAtomicPartTrayButtons(root);

  [feedInput, underInput, overInput, solidsInput, apexInput, vortexInput, pressInput].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', () => recompute(false));
      el.addEventListener('change', () => recompute(false));
    }
  });

  [csrApertureInput, csrReliefInput, csrFeedInput, csrVibrationInput, csrAlphaInput].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', onManualScreenChange);
      el.addEventListener('change', onManualScreenChange);
    }
  });

  return recompute(true);
}
