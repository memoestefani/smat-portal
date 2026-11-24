// @ts-check
/**
 * requisitionPriorityAndJrpEngine.js
 * ---------------------------------------------------------------------------
 * Núcleo puro Zero-DOM extraído por costura LCOM4 (`∂(C) = 0`) de `requisitionTrayBus.js`:
 *   - Regla c*mu (Van Mieghem 1995) y carril de checkout CFDI 4.0 / OC SAP
 *   - Ventanas armónicas de reabastecimiento conjunto (s, S) (Jackson-Maxwell-Muckstadt)
 *   - Economía circular Core Trade-In DAM005 (-22% / -12% / 0%)
 */

import { formatCheckoutLaneHuman } from './i18nDomainLabels.js';

/**
 * Calcula el descriptor de prioridad c*mu (Van Mieghem 1995) y el carril de checkout
 * según urgencia de planta, monto estimado (< 25,000 MXN vs > 25,000 MXN) y régimen (hay / se_pide / se_fabrica).
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function computeCmuPriorityDescriptor(params = {}) {
  const isEn = String(params.lang || '').toLowerCase() === 'en';
  const rawUrg = String(params.urgency || '').trim();
  const rawCrit = String(params.criticalityMode || '').trim();
  const itemsArr = Array.isArray(params.items) ? params.items : null;
  const isUnsetEmpty =
    itemsArr !== null &&
    itemsArr.length === 0 &&
    (!rawUrg || rawUrg.toUpperCase() === 'UNSET') &&
    (!rawCrit || rawCrit.toUpperCase() === 'UNSET');

  if (isUnsetEmpty) {
    const labelEs = 'Borrador Técnico • Sin partidas activas';
    const labelEn = 'Technical Draft • No active items';
    return {
      priorityCode: isEn ? 'DRAFT' : 'BORRADOR',
      cmuScore: 0,
      priorityRankScore: 0,
      checkoutLane: 'ORDEN_COMPRA_SAP',
      checkoutLaneLabelEs: formatCheckoutLaneHuman('ORDEN_COMPRA_SAP', 'es'),
      checkoutLaneLabelEn: formatCheckoutLaneHuman('ORDEN_COMPRA_SAP', 'en'),
      stockRegime: 'hay',
      advancePaymentPct: 0,
      slaResponseMinutes: 0,
      labelEs,
      labelEn,
      priorityLabelEs: labelEs,
      priorityLabelEn: labelEn,
    };
  }

  const hasTrayShape = itemsArr !== null || Boolean(rawCrit && rawCrit.toUpperCase() !== 'UNSET');
  const rawUrgency = rawUrg || (hasTrayShape && rawCrit.toUpperCase() === 'PARO_DE_LINEA' ? 'paro_de_linea' : 'normal');
  const urgency = String(rawUrgency).toLowerCase();
  const estimatedTotalMxn = Math.max(0, Number(params.estimatedTotalMxn ?? 18000));
  const stockRegime = String(params.stockRegime || 'hay').toLowerCase();

  const isPettyCash = estimatedTotalMxn > 0 && estimatedTotalMxn <= 25000;
  const checkoutLane = isPettyCash ? 'CAJA_CHICA_CFDI40' : 'ORDEN_COMPRA_SAP';
  const checkoutLaneLabelEs = formatCheckoutLaneHuman(checkoutLane, 'es');
  const checkoutLaneLabelEn = formatCheckoutLaneHuman(checkoutLane, 'en');

  if (urgency === 'emergency' || urgency === 'paro_de_linea') {
    const labelEs = 'P1 · PARO DE LÍNEA (Atención Ingeniería < 15 min)';
    const labelEn = 'P1 · LINE DOWNTIME (Engineering SLA < 15 min)';
    return {
      priorityCode: isEn ? 'P1-LINE-STOP' : 'P1-PARO-PLANTA',
      cmuScore: 98.5,
      priorityRankScore: 4800,
      checkoutLane,
      checkoutLaneLabelEs,
      checkoutLaneLabelEn,
      stockRegime,
      advancePaymentPct: stockRegime === 'se_fabrica' ? 50 : 0,
      slaResponseMinutes: 15,
      labelEs,
      labelEn,
      priorityLabelEs: labelEs,
      priorityLabelEn: labelEn,
    };
  }

  if (stockRegime === 'se_fabrica') {
    const labelEs = 'P3 · FABRICACIÓN BAJO PLANO (50% Anticipo + OC)';
    const labelEn = 'P3 · CUSTOM FABRICATION (50% Advance + PO)';
    return {
      priorityCode: 'P3-PROYECTO-50%-ANTICIPO',
      cmuScore: 62.0,
      priorityRankScore: 3020,
      checkoutLane: 'ORDEN_COMPRA_SAP',
      checkoutLaneLabelEs: formatCheckoutLaneHuman('ORDEN_COMPRA_SAP', 'es'),
      checkoutLaneLabelEn: formatCheckoutLaneHuman('ORDEN_COMPRA_SAP', 'en'),
      stockRegime,
      advancePaymentPct: 50,
      slaResponseMinutes: 120,
      labelEs,
      labelEn,
      priorityLabelEs: labelEs,
      priorityLabelEn: labelEn,
    };
  }

  if (isPettyCash && stockRegime === 'hay') {
    const labelEs = 'P1 · CAJA CHICA (< 25,000 MXN · CFDI 4.0 Hoy)';
    const labelEn = 'P1 · PETTY CASH (< 25,000 MXN · CFDI 4.0 Today)';
    return {
      priorityCode: 'P1-CAJA-CHICA-HAY',
      cmuScore: 91.0,
      priorityRankScore: 4435,
      checkoutLane: 'CAJA_CHICA_CFDI40',
      checkoutLaneLabelEs: formatCheckoutLaneHuman('CAJA_CHICA_CFDI40', 'es'),
      checkoutLaneLabelEn: formatCheckoutLaneHuman('CAJA_CHICA_CFDI40', 'en'),
      stockRegime,
      advancePaymentPct: 0,
      slaResponseMinutes: 30,
      labelEs,
      labelEn,
      priorityLabelEs: labelEs,
      priorityLabelEn: labelEn,
    };
  }

  const labelEs = 'P2 · REPOSICIÓN PROGRAMADA / ORDEN DE COMPRA';
  const labelEn = 'P2 · SCHEDULED REPLENISHMENT / PURCHASE ORDER';
  return {
    priorityCode: 'P2-REPOSICION-LOTE',
    cmuScore: 76.0,
    priorityRankScore: 3705,
    checkoutLane,
    checkoutLaneLabelEs,
    checkoutLaneLabelEn,
    stockRegime,
    advancePaymentPct: stockRegime === 'se_pide' ? 30 : 0,
    slaResponseMinutes: 60,
    labelEs,
    labelEn,
    priorityLabelEs: labelEs,
    priorityLabelEn: labelEn,
  };
}

/**
 * Calcula las ventanas deterministas de reorden acoplado (Día 90 / Día 150 / Día 180)
 * para sincronización de extremo húmedo 5:5:4 bajo política (s, S).
 *
 * @param {any} [telemetry={}]
 * @returns {any}
 */
export function calculateCoupledReorderWindowDays(telemetry = {}) {
  const sg = Math.max(1.0, Math.min(2.4, Number(telemetry.sg ?? (telemetry.solidsVolumetricPct ? 1.0 + telemetry.solidsVolumetricPct * 0.018 : 1.50))));
  const d50Um = Math.max(15, Math.min(1000, Number(telemetry.d50Um ?? telemetry.d80Microns ?? 120)));
  const tipSpeedMs = Math.max(8, Math.min(38, Number(telemetry.tipSpeedMs ?? 21.5)));
  const rawCrit = String(telemetry.criticalityMode || 'normal').trim().toLowerCase();
  const isParoPlanta = rawCrit === 'paro_planta' || rawCrit === 'emergency' || rawCrit === 'critical' || rawCrit === 'paro_de_linea';
  const criticalityMode = isParoPlanta ? 'paro_planta' : 'normal';
  const criticalityFactor = isParoPlanta ? 0.75 : 1.0;

  const baseSeverity = (sg / 1.50) * Math.pow(d50Um / 120, 0.15) * Math.pow(tipSpeedMs / 21.5, 0.25);
  const severityFactor = Number((baseSeverity * (isParoPlanta ? 1.33 : 1.0)).toFixed(2));
  const baseWearHours = Math.max(240, Number(telemetry.estimatedWearHours ?? telemetry.predictedWearHours ?? 2160));
  const dailyHours = Math.max(1, Math.min(24, Number(telemetry.dailyOperatingHours ?? telemetry.operatingHoursPerDay ?? 24)));
  const wearAcceleratedLifeHours = Math.max(240, Math.round((baseWearHours * criticalityFactor) / Math.max(0.6, baseSeverity)));
  const rawLifeDays = Math.round(wearAcceleratedLifeHours / dailyHours);

  const sleeveInspectionDay = Math.round(90 * criticalityFactor);
  const impellerThroatbushSwapDay = Math.round(150 * criticalityFactor);
  const voluteLinerOverhaulDay = Math.round(180 * criticalityFactor);
  let reorderWindowDays = rawLifeDays <= 105 ? 90 : (rawLifeDays <= 165 ? 150 : 180);
  if (isParoPlanta) {
    reorderWindowDays = Math.min(reorderWindowDays, 90);
  }

  return {
    sleeveInspectionDay,
    impellerThroatbushSwapDay,
    voluteLinerOverhaulDay,
    t10InspectionDays: sleeveInspectionDay,
    t50ReorderTriggerDays: impellerThroatbushSwapDay,
    t80CriticalChangeoutDays: voluteLinerOverhaulDay,
    reorderWindowDays,
    recommendedWindowDays: reorderWindowDays,
    leadTimeBufferDays: isParoPlanta ? 7 : 14,
    predictedWearHours: baseWearHours,
    operatingHoursPerDay: dailyHours,
    rawLifeDays,
    criticalityMode,
    criticalityFactor,
    severityFactor,
    wearSeverityFactor: severityFactor,
    wearAcceleratedLifeHours,
    dispatchModeLabelEs: isParoPlanta
      ? 'Despacho Crítico Paro de Planta (Política Armónica s,S 0.75×)'
      : 'Despacho Programado Almacén Central Durango (Política s,S)',
    dispatchModeLabelEn: isParoPlanta
      ? 'Critical Plant-Stop Dispatch (Harmonic s,S Policy 0.75×)'
      : 'Scheduled Dispatch Durango Central Warehouse (s,S Policy)',
    policySummaryEs: `Día ${sleeveInspectionDay}: Camisa HVOF D075C21 + Expulsor | Día ${impellerThroatbushSwapDay}: Impulsor E4147 + Throatbush E4083 | Día ${voluteLinerOverhaulDay}: Overhaul Voluta D3110 5:5:4`,
    policySummaryEn: `Day ${sleeveInspectionDay}: D075C21 HVOF Sleeve + Expeller | Day ${impellerThroatbushSwapDay}: E4147 Impeller + E4083 Throatbush | Day ${voluteLinerOverhaulDay}: D3110 Volute 5:5:4 Overhaul`,
  };
}

/**
 * Evalúa la elegibilidad y bonificación de Economía Circular Industrial (-22% / -12% / 0% Core Trade-In)
 * para intercambio de Cartucho de Rodamientos (Bearing Assembly DAM005 / Estación 01)
 * sin dependencias DOM ni de almacenamiento Web.
 *
 * @param {any} [trayState={}]
 * @param {boolean|string|null} [coreReturnOverride=null]
 * @returns {any}
 */
export function evaluateBearingCartridgeCoreTradeIn(trayState = {}, coreReturnOverride = null) {
  const state = trayState && typeof trayState === 'object' ? trayState : {};
  const items = Array.isArray(state.items) ? state.items : [];
  const rawCondition = String(
    (typeof coreReturnOverride === 'string' ? coreReturnOverride : '') ||
    state.housingCondition ||
    'h7_intact'
  ).toLowerCase();

  const isCrackedOrWelded =
    rawCondition.includes('crack') ||
    rawCondition.includes('weld') ||
    rawCondition.includes('fractur') ||
    state.hasStructuralWeld === true ||
    state.boreIntact === false;
  const isMinorRebore =
    !isCrackedOrWelded &&
    (rawCondition.includes('minor') ||
      rawCondition.includes('rebore') ||
      rawCondition.includes('seizure') ||
      rawCondition.includes('scoring'));

  const coreReturnEnabled =
    typeof coreReturnOverride === 'boolean'
      ? coreReturnOverride
      : typeof coreReturnOverride === 'string'
        ? !isCrackedOrWelded
        : Boolean(state.coreReturnEnabled);

  const eligibleItems = items.filter((item) => {
    const token = `${item.id || ''} ${item.skuId || ''} ${item.atomicCode || ''} ${item.nameEs || ''} ${item.nameEn || ''}`.toUpperCase();
    return (
      token.includes('DAM005') ||
      token.includes('SMAT-PUMP-BRG-005M') ||
      token.includes('SMAT-PUMP-LINERS-AH') ||
      token.includes('SMAT-FLOT-MECH-18SP') ||
      token.includes('SMAT-LAB-MARCY-1000') ||
      token.includes('CARTUCHO') ||
      token.includes('BEARING') ||
      token.includes('RODAMIENTO')
    );
  });

  const eligible = (eligibleItems.length > 0 || items.length === 0) && !isCrackedOrWelded;
  const tierDiscount = isCrackedOrWelded ? 0 : isMinorRebore ? 12 : 22;
  const discountPct = eligible && coreReturnEnabled ? tierDiscount : 0;
  const creditFactor = Number((1.0 - discountPct / 100.0).toFixed(2));
  const rmaCode =
    discountPct === 22
      ? 'RMA-CORE-DAM005-INTACT'
      : discountPct === 12
        ? 'RMA-CORE-DAM005-REBORE'
        : 'RMA-CORE-DAM005-NONE';
  const co2SavedKg = discountPct === 22 ? 35 : discountPct === 12 ? 28 : 0;
  const returnAddress = 'Mariano Salas #114, Col. Primer Presidente, Durango, Dgo. CP 34166';

  const policyNoteEs =
    discountPct === 22
      ? `Bonificación -22% (${rmaCode}) al entregar casco DAM005 H7 íntegro en Almacén Central (${returnAddress}) • ${co2SavedKg} kg CO₂e evitados.`
      : discountPct === 12
        ? `Bonificación -12% (${rmaCode} por re-encamisado H7) en Almacén Central (${returnAddress}) • ${co2SavedKg} kg CO₂e evitados.`
        : `Suministro directo de cartucho nuevo DAM005 (Factor 1.00x). Recepción en ${returnAddress}.`;
  const policyNoteEn =
    discountPct === 22
      ? `-22% Core Trade-In credit (${rmaCode}) upon returning intact DAM005 H7 housing at Central Warehouse (${returnAddress}) • ${co2SavedKg} kg CO₂e saved.`
      : discountPct === 12
        ? `-12% Core Trade-In credit (${rmaCode} H7 rebore tier) at Central Warehouse (${returnAddress}) • ${co2SavedKg} kg CO₂e saved.`
        : `Direct new DAM005 cartridge supply (Factor 1.00x). Central Warehouse: ${returnAddress}.`;

  return {
    version: state.version ?? 3,
    eligible,
    coreReturnEnabled: eligible && coreReturnEnabled,
    discountPct,
    creditFactor,
    rmaCode,
    co2SavedKg,
    returnAddress,
    housingCondition: isCrackedOrWelded ? 'cracked_housing' : isMinorRebore ? 'minor_scoring' : 'h7_intact',
    eligibleItemIds: eligibleItems.map((i) => i.id),
    invariantId: 'INV-SMAT-SCI-06',
    housingMaterial: 'Hierro Dúctil GGG40 + Eje SAE 4140 Bonificado (ISO 281)',
    policyNoteEs,
    policyNoteEn,
    inspectionGateEs: policyNoteEs,
    inspectionGateEn: policyNoteEn,
  };
}
