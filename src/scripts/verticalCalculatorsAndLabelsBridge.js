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
  calculateFlotationGorainKineticRate,
  calculateThreeCupMarcyCycloneBalance,
  calculateUrethaneScreenPartitionWeibull,
  evaluateFilterPressPlateDeflection,
} from './slurryEngine.js';
import {
  hydrateVerticalInputsFromUnifiedState,
  syncReactiveTraySkuButton,
} from './verticalBidirectionalHydrationLens.js';
import {
  bindAtomicPartTrayButtons,
  commitVerticalSimulation
} from './verticalStateAndCtaSyncBridge.js';
import {
  calculateFilterPressCycleCapacity,
  evaluateFlotationCellHydrodynamics,
  evaluateHydrocycloneCutPoint,
} from './wizardCircuitPhysicsController.js';
import {
  loadWorkbenchSession,
  saveWorkbenchSession,
} from './workbenchBus.js';
export {
  bindCanonicalSealBalanceCalculator,
  bindCanonicalTribologySelector, evaluateCentrifugalSealPressureBalance
} from './pumpingSealAndTribologyCalculators.js';
export {
  commitVerticalSimulation, loadUnifiedEngineeringAndWorkbenchState,
  projectVerticalPayloadToWorkbenchPatch, syncVerticalCtaLinks
} from './verticalStateAndCtaSyncBridge.js';

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
export function bindCanonicalFiltrationCalculator(root, lang = 'es', _options = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastBoundCircuit = 'filtracion';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();

  const pEl = root.querySelector('#filt-pressure-bar, #wb-filt-pressure-bar');
  const cEl = root.querySelector('#filt-clogged-ports, #wb-filt-clogged-ports');
  const wEl = root.querySelector('#filt-plate-width, #wb-filt-plate-width, #wb-plate-size');
  const tEl = root.querySelector('#filt-plate-thickness, #wb-filt-thickness-mm');
  const mEl = root.querySelector('#filt-cake-moisture, #wb-filt-moisture-pct');

  const stressEl = root.querySelector('#filt-res-stress, #wb-filt-res-stress');
  const fsEl = root.querySelector('#filt-res-fs, #wb-filt-res-fs');
  const secondaryEl = root.querySelector('#filt-res-secondary');
  const sumEl = root.querySelector('#filt-res-summary, #wb-filt-res-status');
  const cyclesEl = root.querySelector('#wb-filt-res-cycles');
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

    const baseEval = evaluateFilterPressPlateDeflection({
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    });
    const cycleRes = calculateFilterPressCycleCapacity({
      ...baseEval,
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

    if (stressEl) {
      stressEl.textContent = `${res.maxBendingStressMpa} MPa`;
    }
    if (fsEl) {
      fsEl.textContent = `FS ${res.flexuralSafetyFactor}`;
    }
    if (cyclesEl) {
      cyclesEl.textContent = isEn
        ? `${res.cyclesPerDay} cyc/d (${res.dryTonnesPerDay} t/d)`
        : `${res.cyclesPerDay} ciclos/d (${res.dryTonnesPerDay} t/d)`;
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
      const plateSku = res.recommendedRecessedPlateSkuId || 'SMAT-FILT-CLOTH-PLATE';
      const clothSku = res.recommendedClothSkuId || 'SMAT-CL-PP750';
      skusEl.textContent = isEn
        ? `Plate: ${plateSku} | Cloth: ${clothSku}`
        : `Placa: ${plateSku} | Tela: ${clothSku}`;
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
      const skuTail = isEn
        ? `Plate: ${res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId} | Shifter: ${res.recommendedShifterSkuId}`
        : `Placa/Tela: ${res.recommendedRecessedPlateSkuId || res.recommendedClothSkuId} | Corre-Placas: ${res.recommendedShifterSkuId}`;
      sumEl.textContent = secondaryEl
        ? `${baseSummary} | ${skuTail}`
        : `${baseSummary} | ${secondaryBreakdown} | ${skuTail}`;
      if (sumEl.style && !readoutBox && sumEl.id === 'filt-res-summary') {
        sumEl.style.background = isAlert ? '#fef2f2' : '#ecfdf5';
        sumEl.style.color = isAlert ? '#991b1b' : '#064e3b';
      }
    }
    if (readoutBox && readoutBox.style) {
      readoutBox.style.background = isAlert ? '#fef2f2' : '#ecfdf5';
      readoutBox.style.color = isAlert ? '#991b1b' : '#064e3b';
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

    const filtPayload = {
      ...res,
      feedPressureBar,
      cloggedPortsCount,
      plateWidthMm,
      plateThicknessMm,
      cakeMoistureTargetPct,
    };
    commitVerticalSimulation('filtracion', filtPayload, {
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
 * Conecta de forma canónica la calculadora de Flotación (#flot-*) ejecutando
 * `evaluateFlotationCellHydrodynamics` (Gorain $S_b, k, v_{\text{tip}}$ + Zwietering $N_{js}$) (`D1-V42` / `D1-V44`).
 */
export function bindCanonicalFlotationCalculator(root, lang = 'es', _options = {}) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  BRIDGE_RUNTIME_REGISTRY.lastBoundCircuit = 'flotacion';
  BRIDGE_RUNTIME_REGISTRY.lastUpdatedIso = new Date().toISOString();

  const jgEl = root.querySelector('#flot-jg-input, #celdas-jg-input, #wb-flot-jg');
  const d32El = root.querySelector('#flot-d32-input, #celdas-d32-input, #wb-flot-d32');
  const diaEl = root.querySelector('#flot-rotor-dia, #celdas-dia-select, #wb-flot-dia, #wb-flot-rotor-dia');
  const rpmEl = root.querySelector('#flot-rotor-rpm, #celdas-rpm-input, #wb-flot-rpm');
  const d80El = root.querySelector('#flot-d80-input, #celdas-d80-input, #wb-flot-d80');
  const cwEl = root.querySelector('#flot-cw-input, #celdas-cw-input, #wb-flot-cw');
  const pEl = root.querySelector('#flot-p-input, #celdas-p-input, #wb-flot-p');
  const rfEl = root.querySelector('#flot-rf-input, #celdas-rf-input, #wb-flot-rf');
  const sbOut = root.querySelector('#flot-sb-out, #celdas-sb-output, #wb-flot-res-sb');
  const kOut = root.querySelector('#flot-k-out, #celdas-k-output, #wb-flot-res-k');
  const vtipOut = root.querySelector('#flot-vtip-out, #celdas-vtip-output, #wb-flot-res-vtip');
  const njsOut = root.querySelector('#flot-njs-out, #celdas-njs-output, #wb-flot-res-njs');
  const pOut = root.querySelector('#flot-p-out, #celdas-p-output, #wb-flot-res-p');
  const rfOut = root.querySelector('#flot-rf-out, #celdas-rf-output, #wb-flot-res-rf');
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
    const res = evaluateFlotationCellHydrodynamics({
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

    const sbVal = res.sbInverseSeconds ?? res.bubbleSurfaceAreaFluxSb;
    const kVal = res.rateConstantMin ?? res.firstOrderRateConstantKMin;
    const vtipVal = res.tipSpeedMS ?? res.impellerTipSpeedMs;
    const isWb = sbOut?.id === 'wb-flot-res-sb';

    if (sbOut) {
      sbOut.textContent = isWb ? `${sbVal} s⁻¹` : String(sbVal);
    }
    if (kOut) {
      kOut.textContent = isWb ? `${kVal} min⁻¹` : String(kVal);
    }
    if (vtipOut) {
      vtipOut.textContent = isWb ? `${vtipVal} m/s` : String(vtipVal);
    }
    if (njsOut) {
      njsOut.textContent = isWb ? `${res.zwieteringNjsRpm} RPM` : String(res.zwieteringNjsRpm);
    }
    if (pOut) {
      pOut.textContent = Number(baseGorain.floatabilityP ?? floatabilityP).toFixed(4);
    }
    if (rfOut) {
      rfOut.textContent = Number(baseGorain.frothRecoveryRf ?? frothRecoveryRf).toFixed(2);
    }
    if (puLifeOut) {
      puLifeOut.textContent = isEn
        ? `PU vs Rubber Life: ${res.wearLifeMultiplierPuVsRubber}× · u₂ ${res.tipSpeedWindowOptimal ? 'optimal (5.5–7.5 m/s)' : 'adjust RPM'}`
        : `Vida PU vs Hule: ${res.wearLifeMultiplierPuVsRubber}× · u₂ ${res.tipSpeedWindowOptimal ? 'óptima (5.5–7.5 m/s)' : 'ajustar RPM'}`;
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
      readoutBox.style.color = isOptimal ? '#064e3b' : '#7c2d12';
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

    const flotPayload = {
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
    };
    commitVerticalSimulation('flotacion', flotPayload, {
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

/**
 * Conecta en una sola estación acoplada el Balance de 3 Vasos Marcy + Plitt ($d_{50c}$)
 * con la Criba de Uretano Weibull ($d_{80} = 2.2 \times d_{50c}$) en `/clasificacion/` (`D2-V42` / `D4-V44`).
 */
export function bindCoupledClassificationStation(root, lang = 'es', _options = {}) {
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
  const csrVibrationInput = root.querySelector('#csr-vibration-g');
  const csrAlphaInput = root.querySelector('#csr-alpha-select');
  const csrWeibullOut = root.querySelector('#csr-weibull-out');
  const csrRfqLink = root.querySelector('#csr-rfq-link');
  const screenTrayBtn = root.querySelector('[data-screen-tray-btn]');

  const hydration = hydrateVerticalInputsFromUnifiedState(root, 'classification');

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
    const cycPayload = {
      ...res,
      ...coupledEval,
      feedPressureKpa: res.feedPressureKpa,
      apexMm: res.apexDiameterMm,
      vortexMm: res.vortexDiameterMm,
      coupledScreenFeedD80Um: coupledD80Um,
      apertureMm: weibullRes.apertureMm,
      reliefAngleDeg: weibullRes.reliefAngleDeg,
      partitionToOversizePct: weibullRes.partitionToOversizePct,
    };

    if (!skipWrite) {
      const prev = loadWorkbenchSession();
      saveWorkbenchSession({
        ...prev,
        hasUserCalibration: true,
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
    }

    commitVerticalSimulation('clasificacion', cycPayload, {
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
