/**
 * verticalCalculatorsAndLabelsBridge.js
 * ---------------------------------------------------------------------------
 * Costura Modular Cohesiva LCOM4 = 1 (∂(C) = 0, D1-V42 a D5-V42)
 * 1. Diccionarios biyectivos bilingües cero-snake_case:
 *    - `formatMaterialHumanLabel(rawKey, lang)`
 *    - `formatStationHumanBadge(stationId, lang)`
 *    - `formatDiagramHumanTitle(diagramId, lang)` (16/16 DiagramKind)
 * 2. Controladores canónicos unificados para las páginas verticales:
 *    - `bindCanonicalFiltrationCalculator(root, lang)` (#filt-* y #rep-*)
 *    - `bindCanonicalFlotationCalculator(root, lang)` (#flot-*)
 *    - `bindCoupledClassificationStation(root, lang)` (#cyc-* ↔ #csr-*)
 */

import {
  evaluateFilterPressPlateDeflection,
  calculateFlotationGorainKineticRate,
  calculateThreeCupMarcyCycloneBalance,
  calculateUrethaneScreenPartitionWeibull,
} from './slurryEngine.js';
import {
  calculateFilterPressCycleCapacity,
  evaluateFlotationCellHydrodynamics,
  evaluateHydrocycloneCutPoint,
  saveEngineeringContextSnapshot,
} from './wizardCircuitPhysicsController.js';
import {
  saveWorkbenchSession,
  loadWorkbenchSession,
} from './workbenchBus.js';
export {
  evaluateCentrifugalSealPressureBalance,
  bindCanonicalSealBalanceCalculator,
  bindCanonicalTribologySelector,
} from './pumpingSealAndTribologyCalculators.js';

const BRIDGE_RUNTIME_REGISTRY = {
  lastBoundCircuit: 'none',
  lastUpdatedIso: '',
  materialMap: {
    alto_cromo_cr27: {
      es: 'Alto Cromo ASTM A532 Cr27 (A05 · ≥650 HB)',
      en: 'High Chrome ASTM A532 Cr27 (A05 · ≥650 HB)',
    },
    A05: {
      es: 'Alto Cromo ASTM A532 Cr27 (A05 · ≥650 HB)',
      en: 'High Chrome ASTM A532 Cr27 (A05 · ≥650 HB)',
    },
    alto_cromo_a49: {
      es: 'Hierro Alto Cromo Molibdeno (A49 · pH Ácido)',
      en: 'High Chrome Molybdenum Iron (A49 · Acidic pH)',
    },
    A49: {
      es: 'Hierro Alto Cromo Molibdeno (A49 · pH Ácido)',
      en: 'High Chrome Molybdenum Iron (A49 · Acidic pH)',
    },
    poliuretano_minero: {
      es: 'Poliuretano Minero Anti-Corte (U01 · Shore A 90–95)',
      en: 'Cut-Resistant Mining Polyurethane (U01 · Shore A 90–95)',
    },
    U01: {
      es: 'Poliuretano Minero Anti-Corte (U01 · Shore A 90–95)',
      en: 'Cut-Resistant Mining Polyurethane (U01 · Shore A 90–95)',
    },
    PU: {
      es: 'Poliuretano Minero Anti-Corte (U01 · Shore A 90–95)',
      en: 'Cut-Resistant Mining Polyurethane (U01 · Shore A 90–95)',
    },
    hule_natural_r55: {
      es: 'Elastómero Natural Anti-Abrasivo (R55 · Shore A 52–58)',
      en: 'Anti-Abrasive Natural Rubber (R55 · Shore A 52–58)',
    },
    R55: {
      es: 'Elastómero Natural Anti-Abrasivo (R55 · Shore A 52–58)',
      en: 'Anti-Abrasive Natural Rubber (R55 · Shore A 52–58)',
    },
    ceramica_sic: {
      es: 'Carburo de Silicio Sinterizado (SiC · ≥2200 HV)',
      en: 'Sintered Silicon Carbide (SiC · ≥2200 HV)',
    },
    SiC: {
      es: 'Carburo de Silicio Sinterizado (SiC · ≥2200 HV)',
      en: 'Sintered Silicon Carbide (SiC · ≥2200 HV)',
    },
    hybrid_a05_r55: {
      es: 'Híbrido Impulsor A05 + Forros R55 (Rama D)',
      en: 'Hybrid A05 Impeller + R55 Liners (Branch D)',
    },
  },
  stationMap: {
    drive_end: {
      es: 'ESTACIÓN 01 · TREN MOTRIZ',
      en: 'STATION 01 · DRIVE END',
    },
    sealing_fork: {
      es: 'ESTACIÓN 02 · SELLADO CENTRÍFUGO',
      en: 'STATION 02 · CENTRIFUGAL SEAL',
    },
    wet_end_fork: {
      es: 'ESTACIÓN 03 · EXTREMO HÚMEDO',
      en: 'STATION 03 · WET END',
    },
    suction_closure: {
      es: 'ESTACIÓN 04 · CIERRE DE SUCCIÓN',
      en: 'STATION 04 · SUCTION CLOSURE',
    },
    axial_calibration: {
      es: 'ESTACIÓN 05 · CALIBRACIÓN AXIAL',
      en: 'STATION 05 · AXIAL CALIBRATION',
    },
  },
  diagramMap: {
    impeller_5vane: {
      es: 'Impulsor Cerrado de 5 Álabes (E4147)',
      en: '5-Vane Closed Slurry Impeller (E4147)',
    },
    wet_kit_554: {
      es: 'Lote Sincronizado de Extremo Húmedo 5:5:4',
      en: '5:5:4 Synchronized Wet-End Overhaul Kit',
    },
    expeller_seal: {
      es: 'Sello Centrífugo Seco y Camisa HVOF D075C21',
      en: 'Dry Expeller Seal & D075C21 HVOF Shaft Sleeve',
    },
    bearing_cartridge: {
      es: 'Cartucho de Rodamientos Sellado ISO 281 (DAM005)',
      en: 'ISO 281 Sealed Bearing Cartridge Assembly (DAM005)',
    },
    volute_liner: {
      es: 'Revestimiento de Voluta y Cuello Ajustable',
      en: 'Spiral Volute Liner & Adjustable Throatbush',
    },
    cyclone_d6_d20: {
      es: 'Hidrociclón Clasificador D6"–D20" (5 Zonas)',
      en: 'D6"–D20" Classification Hydrocyclone (5 Zones)',
    },
    coupled_pump_cyclone: {
      es: 'Paquete Casado Bomba de Lodos + Batería de Hidrociclones',
      en: 'Coupled Slurry Pump + Hydrocyclone Cluster Package',
    },
    urethane_screen_th48: {
      es: 'Malla Fina de Poliuretano Alta Frecuencia TH48-30',
      en: 'TH48-30 High-Frequency Fine Urethane Screen',
    },
    urethane_screen_panel_305: {
      es: 'Panel Modular de Poliuretano 305×305 mm (1\'×1\')',
      en: '305×305 mm (1\'×1\') Modular Polyurethane Screen Panel',
    },
    filter_press: {
      es: 'Paquete de Placas de Polipropileno y Lonas 16 bar',
      en: '16-bar Polypropylene Recessed Plates & Filter Cloths',
    },
    filter_plate_shifter: {
      es: 'Mecanismo Corre-Placas (Plate Shifter) y Cadenas',
      en: 'Automated Plate Shifter Mechanism & Traction Chains',
    },
    flotation_cell: {
      es: 'Mecanismo Suspendido Rotor-Estator de Flotación',
      en: 'Suspended Flotation Rotor-Stator Mechanism',
    },
    marcy_scale: {
      es: 'Balanza de Densidad de Pulpa Marcy y Vaso 1000 cm³',
      en: 'Marcy Pulp Density Scale & 1000 cm³ Stainless Cup',
    },
    batch_filter: {
      es: 'Filtro Prensa de Laboratorio Batch (100 psi)',
      en: '100 psi Pneumatic Laboratory Batch Pressure Filter',
    },
    astm_sieves: {
      es: 'Serie de Tamices Certificados ASTM E11 (8")',
      en: 'ASTM E11 Certified 8" Test Sieve Stack',
    },
    lab_comminution_pan: {
      es: 'Pulverizador de Discos y Molienda de Laboratorio',
      en: 'Laboratory Disc Pulverizer & Comminution Set',
    },
  },
};

export function formatMaterialHumanLabel(rawKey, lang = 'es') {
  const key = String(rawKey || '').trim();
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();
  const entry = BRIDGE_RUNTIME_REGISTRY.materialMap[key];
  if (entry) {
    return isEn ? entry.en : entry.es;
  }
  return key.replace(/_/g, ' ');
}

export function formatStationHumanBadge(stationId, lang = 'es') {
  const key = String(stationId || '').trim();
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();
  const entry = BRIDGE_RUNTIME_REGISTRY.stationMap[key];
  if (entry) {
    return isEn ? entry.en : entry.es;
  }
  return isEn ? 'STATION · ASSEMBLY' : 'ESTACIÓN · ENSAMBLE';
}

export function formatDiagramHumanTitle(diagramId, lang = 'es') {
  const key = String(diagramId || '').trim();
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();
  const entry = BRIDGE_RUNTIME_REGISTRY.diagramMap[key];
  if (entry) {
    return isEn ? entry.en : entry.es;
  }
  return isEn ? 'SMAT Engineering CAD Blueprint' : 'Plano CAD de Ingeniería SMAT';
}

/**
 * Conecta de forma canónica cualquier calculadora de Filtración Prensa (#filt-* o #rep-*)
 * evaluando simultáneamente Timoshenko (`evaluateFilterPressPlateDeflection`) y Darcy-Ruth
 * (`calculateFilterPressCycleCapacity`) y persistiendo en `smat_engineering_context_v1` (`D1-V42`).
 */
export function bindCanonicalFiltrationCalculator(root, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastBoundCircuit = 'filtracion';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();

  const pEl = root.querySelector('#filt-pressure-bar, #rep-pressure-bar');
  const cEl = root.querySelector('#filt-clogged-ports, #rep-clogged-ports');
  const wEl = root.querySelector('#filt-plate-width, #rep-plate-width');
  const tEl = root.querySelector('#filt-plate-thickness, #rep-plate-thickness');
  const mEl = root.querySelector('#filt-cake-moisture, #rep-cake-moisture');

  const stressEl = root.querySelector('#filt-res-stress, #rep-stress-out');
  const fsEl = root.querySelector('#filt-res-fs, #rep-fs-out');
  const secondaryEl = root.querySelector('#filt-res-secondary');
  const sumEl = root.querySelector('#filt-res-summary, #rep-status-out');
  const readoutBox = root.querySelector('#rep-timoshenko-readout');

  function recompute() {
    if (!pEl || !cEl || !wEl || !tEl) return null;
    const feedPressureBar = Number(pEl.value) || 12;
    const cloggedPortsCount = Number(cEl.value) || 0;
    const plateWidthMm = Number(wEl.value) || 1200;
    const plateThicknessMm = Number(tEl.value) || 65;
    const cakeMoistureTargetPct = mEl ? Number(mEl.value) || 14 : 14;

    const baseEval = evaluateFilterPressPlateDeflection({
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });
    const res = calculateFilterPressCycleCapacity({
      ...baseEval,
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });

    if (stressEl) {
      stressEl.textContent = `${res.maxBendingStressMpa} MPa`;
    }
    if (fsEl) {
      fsEl.textContent = `FS ${res.flexuralSafetyFactor}`;
    }
    const secondaryBreakdown = isEn
      ? `ΔP_asym = ${res.deltaPAsymmetricMpa} MPa · σ_adm = ${res.ppFatigueAllowableMpa} MPa · ${res.cyclesPerDay} cyc/d · ${res.dryTonnesPerDay} t/d (${res.filtrationMinutes}+12=${res.totalCycleMin} min)`
      : `ΔP_asim = ${res.deltaPAsymmetricMpa} MPa · σ_adm = ${res.ppFatigueAllowableMpa} MPa · ${res.cyclesPerDay} ciclos/d · ${res.dryTonnesPerDay} t/d (${res.filtrationMinutes}+12=${res.totalCycleMin} min)`;
    if (secondaryEl) {
      secondaryEl.textContent = secondaryBreakdown;
    }
    const isAlert = Boolean(res.isPlateCrackingRisk || !res.nom141Compliant);
    if (sumEl) {
      const baseSummary = isEn ? res.summaryEn : res.summaryEs;
      const skuTail = isEn
        ? `Plate: ${res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId} | Shifter: ${res.recommendedPlateSkuId}`
        : `Placa/Tela: ${res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId} | Corre-Placas: ${res.recommendedPlateSkuId}`;
      const isRepStatusMode = sumEl.id === 'rep-status-out';
      sumEl.textContent = (secondaryEl && !isRepStatusMode)
        ? `${baseSummary} | ${skuTail}`
        : `${baseSummary} | ${secondaryBreakdown} | ${skuTail}`;
      if (sumEl.style && !readoutBox) {
        sumEl.style.background = isAlert ? '#fef2f2' : '#ecfdf5';
        sumEl.style.color = isAlert ? '#991b1b' : '#065f46';
      }
    }
    if (readoutBox && readoutBox.style) {
      readoutBox.style.background = isAlert ? '#fef2f2' : '#ecfdf5';
      readoutBox.style.color = isAlert ? '#991b1b' : '#065f46';
    }

    saveEngineeringContextSnapshot('filtracion', {
      ...res,
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });
    return res;
  }

  [pEl, cEl, wEl, tEl, mEl].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', recompute);
      el.addEventListener('change', recompute);
    }
  });

  return recompute();
}

/**
 * Conecta de forma canónica la calculadora de Flotación (#flot-*) ejecutando
 * `evaluateFlotationCellHydrodynamics` (Gorain $S_b, k, v_{\text{tip}}$ + Zwietering $N_{js}$) (`D1-V42` / `D1-V44`).
 */
export function bindCanonicalFlotationCalculator(root, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastBoundCircuit = 'flotacion';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();

  const jgEl = root.querySelector('#flot-jg-input, #celdas-jg-input');
  const d32El = root.querySelector('#flot-d32-input, #celdas-d32-input');
  const diaEl = root.querySelector('#flot-rotor-dia, #celdas-dia-select');
  const rpmEl = root.querySelector('#flot-rotor-rpm, #celdas-rpm-input');
  const d80El = root.querySelector('#flot-d80-input, #celdas-d80-input');
  const cwEl = root.querySelector('#flot-cw-input, #celdas-cw-input');
  const sbOut = root.querySelector('#flot-sb-out, #celdas-sb-output');
  const kOut = root.querySelector('#flot-k-out, #celdas-k-output');
  const vtipOut = root.querySelector('#flot-vtip-out, #celdas-vtip-output');
  const njsOut = root.querySelector('#flot-njs-out, #celdas-njs-output');
  const statusOut = root.querySelector('#flot-status-out, #celdas-status-output');
  const readoutBox = root.querySelector('#flot-gorain-readout, #celdas-gorain-readout');

  function recompute() {
    if (!jgEl || !d32El || !diaEl || !rpmEl) return null;
    const jgCmS = Number(jgEl.value) || 1.5;
    const d32Mm = Number(d32El.value) || 1.6;
    const rotorDiaM = Number(diaEl.value) || 0.61;
    const rotorRpm = Number(rpmEl.value) || 215;
    const particleSizeUm = d80El ? Number(d80El.value) || 150 : 150;
    const solidsCwPct = cwEl ? Number(cwEl.value) || 35 : 35;

    const baseGorain = calculateFlotationGorainKineticRate({
      rotorDiaM,
      jgCmS,
      d32Mm,
      rotorRpm,
    });
    const res = evaluateFlotationCellHydrodynamics({
      ...baseGorain,
      rotorDiaM,
      jgCmS,
      d32Mm,
      rotorRpm,
      particleSizeUm,
      solidsCwPct,
    });

    const sbVal = res.sbInverseSeconds ?? res.bubbleSurfaceAreaFluxSb;
    const kVal = res.rateConstantMin ?? res.firstOrderRateConstantKMin;
    const vtipVal = res.tipSpeedMS ?? res.impellerTipSpeedMs;

    if (sbOut) {
      sbOut.textContent = String(sbVal);
    }
    if (kOut) {
      kOut.textContent = String(kVal);
    }
    if (vtipOut) {
      vtipOut.textContent = String(vtipVal);
    }
    if (njsOut) {
      njsOut.textContent = String(res.zwieteringNjsRpm);
    }
    if (statusOut) {
      const baseSummary = isEn ? res.summaryEn : res.summaryEs;
      const suspTag = `N_js=${res.zwieteringNjsRpm} RPM (${res.suspensionSafe ? (isEn ? 'Suspension OK' : 'Suspensión OK') : (isEn ? 'Sanding Risk' : 'Alerta Arenero')})`;
      const tipTag = `${res.tipSpeedWindowOptimal ? (isEn ? 'Optimal Window' : 'Ventana Óptima') : (isEn ? 'Adjust RPM' : 'Ajustar RPM')} · PU ${res.wearLifeMultiplierPuVsRubber}×`;
      statusOut.textContent = `${baseSummary} · ${suspTag} · ${tipTag}`;
    }
    if (readoutBox && readoutBox.style) {
      const isOptimal = Boolean(res.gorainCompliant ?? res.isOptimalDispersion) && Boolean(res.suspensionSafe);
      readoutBox.style.background = isOptimal ? '#ecfdf5' : '#fffbeb';
      readoutBox.style.color = isOptimal ? '#065f46' : '#92400e';
    }

    saveEngineeringContextSnapshot('flotacion', {
      ...res,
      rotorDiameterM: rotorDiaM,
      superficialGasVelocityCmS: jgCmS,
      bubbleDiameterMm: d32Mm,
      rotorRpm,
      particleSizeUm,
      solidsCwPct,
    });
    return res;
  }

  [jgEl, d32El, diaEl, rpmEl, d80El, cwEl].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', recompute);
      el.addEventListener('change', recompute);
    }
  });

  return recompute();
}

/**
 * Conecta en una sola estación acoplada el Balance de 3 Vasos Marcy + Plitt ($d_{50c}$)
 * con la Criba de Uretano Weibull ($d_{80} = 2.2 \times d_{50c}$) en `/clasificacion/` (`D2-V42` / `D4-V44`).
 */
export function bindCoupledClassificationStation(root, lang = 'es') {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastBoundCircuit = 'clasificacion';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();

  const feedInput = root.querySelector('#cyc-feed-sg');
  const underInput = root.querySelector('#cyc-underflow-sg');
  const overInput = root.querySelector('#cyc-overflow-sg');
  const solidsInput = root.querySelector('#cyc-solids-sg');
  const apexInput = root.querySelector('#cyc-apex-mm');
  const vortexInput = root.querySelector('#cyc-vortex-mm');
  const pressInput = root.querySelector('#cyc-pressure-kpa');

  const regimeEl = root.querySelector('#cyc-res-regime');
  const recEl = root.querySelector('#cyc-res-recovery');
  const circEl = root.querySelector('#cyc-res-circload');
  const cvuEl = root.querySelector('#cyc-res-cvu');
  const d50El = root.querySelector('#cyc-res-d50c');
  const actionEl = root.querySelector('#cyc-res-action');
  const couplingBadgeEl = root.querySelector('#cyc-screen-coupling-badge');
  const skuLink = root.querySelector('#cyc-recommended-sku-link');
  const rfqLink = root.querySelector('#cyc-rfq-link');

  const csrApertureInput = root.querySelector('#csr-aperture-mm');
  const csrReliefInput = root.querySelector('#csr-relief-deg');
  const csrFeedInput = root.querySelector('#csr-feed-um');
  const csrWeibullOut = root.querySelector('#csr-weibull-out');
  const csrRfqLink = root.querySelector('#csr-rfq-link');

  function recomputeScreenWeibull(overrideFeedUm = null) {
    const apertureMm = csrApertureInput ? Number(csrApertureInput.value) || 0.50 : 0.50;
    const reliefAngleDeg = csrReliefInput ? Number(csrReliefInput.value) || 4.0 : 4.0;
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
      feedParticleUm,
    });
    if (csrWeibullOut) {
      csrWeibullOut.textContent = isEn
        ? `Oversize Partition: ${weibullRes.partitionToOversizePct}% · Dilation Δa/a: ${weibullRes.elasticDilationPct}% (${weibullRes.vibrationG}G, ${weibullRes.antiBlindingCompliant ? 'Anti-Blinding OK' : 'Review θ'}) · SKU: ${weibullRes.recommendedSkuId}`
        : `Retención Oversize: ${weibullRes.partitionToOversizePct}% · Dilatación Δa/a: ${weibullRes.elasticDilationPct}% (${weibullRes.vibrationG}G, ${weibullRes.antiBlindingCompliant ? 'Anti-Cegamiento OK' : 'Revisar θ'}) · SKU: ${weibullRes.recommendedSkuId}`;
    }
    if (csrRfqLink) {
      const basePath = isEn ? '/en/quote/' : '/cotizar/';
      csrRfqLink.href = `${basePath}?circuito=clasificacion&equipo=malla_criba_poliuretano&sku=${encodeURIComponent(weibullRes.recommendedSkuId)}&mat=poliuretano&aperture_mm=${apertureMm}&relief_deg=${reliefAngleDeg}&screen_d80_um=${feedParticleUm}#rfq`;
    }
    return weibullRes;
  }

  function recompute() {
    if (!feedInput || !underInput || !overInput) return null;
    const res = calculateThreeCupMarcyCycloneBalance({
      feedSg: Number(feedInput.value) || 1.35,
      underflowSg: Number(underInput.value) || 1.82,
      overflowSg: Number(overInput.value) || 1.15,
      solidsSg: solidsInput ? Number(solidsInput.value) || 2.7 : 2.7,
      apexDiameterMm: apexInput ? Number(apexInput.value) || 50 : 50,
      vortexDiameterMm: vortexInput ? Number(vortexInput.value) || 100 : 100,
      feedPressureKpa: pressInput ? Number(pressInput.value) || 95 : 95,
    });

    if (regimeEl) {
      regimeEl.textContent = isEn ? res.regimeLabelEn : res.regimeLabelEs;
      if (typeof regimeEl.setAttribute === 'function') {
        regimeEl.setAttribute('data-regime', res.dischargeRegime);
      }
    }
    if (recEl) recEl.textContent = `${res.solidsRecoveryPct}%`;
    if (circEl) circEl.textContent = `${res.circulatingLoadPct}%`;
    if (cvuEl) cvuEl.textContent = `${res.cvUnderflowPct}% (du/do=${res.apexToVortexRatio})`;
    if (d50El) d50El.textContent = `${res.d50cMicrons} µm`;

    const coupledD80Um = Math.round(res.d50cMicrons * 2.2);
    const weibullRes = recomputeScreenWeibull(coupledD80Um);

    if (couplingBadgeEl) {
      couplingBadgeEl.textContent = isEn
        ? `🔗 Coupled Closed-Circuit Flow: Cyclone Cut d50c = ${res.d50cMicrons} µm → Urethane Screen Feed d80 = ${coupledD80Um} µm`
        : `🔗 Flujo Acoplado en Circuito Cerrado: Corte Ciclón d50c = ${res.d50cMicrons} µm → Alimentación Criba d80 = ${coupledD80Um} µm`;
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

    const prev = loadWorkbenchSession();
    saveWorkbenchSession({
      ...prev,
      cycloneCircuit: {
        feedSg: res.feedSg,
        underflowSg: res.underflowSg,
        overflowSg: res.overflowSg,
        solidsRecoveryPct: res.solidsRecoveryPct,
        circulatingLoadPct: res.circulatingLoadPct,
        cvUnderflowPct: res.cvUnderflowPct,
        d50cMicrons: res.d50cMicrons,
        dischargeRegime: res.dischargeRegime,
        recommendedSkuId: res.recommendedSkuId,
      },
    });
    saveEngineeringContextSnapshot('clasificacion', {
      ...res,
      ...coupledEval,
      coupledScreenFeedD80Um: coupledD80Um,
      apertureMm: weibullRes.apertureMm,
      reliefAngleDeg: weibullRes.reliefAngleDeg,
      partitionToOversizePct: weibullRes.partitionToOversizePct,
    });
    return res;
  }

  function onManualScreenChange() {
    const weibullRes = recomputeScreenWeibull(null);
    saveEngineeringContextSnapshot('clasificacion', {
      apertureMm: weibullRes.apertureMm,
      reliefAngleDeg: weibullRes.reliefAngleDeg,
      coupledScreenFeedD80Um: weibullRes.feedParticleUm,
      partitionToOversizePct: weibullRes.partitionToOversizePct,
    });
  }

  [feedInput, underInput, overInput, solidsInput, apexInput, vortexInput, pressInput].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', recompute);
      el.addEventListener('change', recompute);
    }
  });

  [csrApertureInput, csrReliefInput, csrFeedInput].forEach((el) => {
    if (el && typeof el.addEventListener === 'function') {
      el.addEventListener('input', onManualScreenChange);
      el.addEventListener('change', onManualScreenChange);
    }
  });

  return recompute();
}
