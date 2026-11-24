// @ts-check
/**
 * acuseSheetController.js
 * ---------------------------------------------------------------------------
 * Controlador compartido para el Acuse Formal Imprimible B2B (/acuse/ y /en/thank-you/).
 * Extraído por Costura Modular LCOM4 (∂(C) = 0, D5-V35 / D12-V35 / SLICE-V56-04).
 * Hidrata la bandeja multi-partida sin pérdida de metadatos (PutGet Lens), renderiza
 * las tuplas fiscales SAT CFDI 4.0 + TIGIE + Ventana JRP (s, S) por partida, y oculta
 * filas exclusivas de bombas cuando la requisición es de otro circuito.
 */

import { resolveDomainMaterialSpec } from './domainMaterialSpecResolver.js';
import { formatCheckoutLaneHuman, formatLogisticsDestinationHuman } from './i18nDomainLabels.js';
import { resolveHonestWebhookStatus } from './leadOutboxStateMachine.js';
import { getQuickProductBySlugOrAlias } from './quickProductsCatalog.js';
import { calculateCoupledReorderWindowDays } from './requisitionTrayBus.js';
import { deriveSessionLifecycleState, loadRfqSession, saveRfqSession } from './rfqSessionStore.js';
import {
  bindVendorPassportDownloadButtons,
  buildSapAnexo22ComplianceSummary,
  buildSmatVendorVcardString,
} from './vendorPassportAndTradeInController.js';
import { loadUnifiedEngineeringAndWorkbenchState } from './verticalStateAndCtaSyncBridge.js';
import { formatDualCheckoutPayload, formatSatTigieInvoiceLine } from './workbenchExportFormatters.js';

/**
 * Construye ViewModel puro y verificable sin navegador para la hoja formal B2B (/acuse/ y /en/thank-you/).
 * Garantiza estado EMPTY honesto cuando `items = []` y sin parámetros explícitos de URL.
 *
 * @param {{
 *   lifecycleState?: 'EMPTY'|'DRAFT'|'VERIFIED',
 *   hasUrlRequisition?: boolean,
 *   items?: any[],
 *   circuit?: string,
 *   material?: string,
 *   skuId?: string,
 *   locale?: 'es'|'en',
 *   folioParam?: string,
 *   urgencyParam?: string,
 * }} [input={}]
 */
export function buildAcuseViewModel(input = {}) {
  const isEn = String(input.locale || 'es').toLowerCase() === 'en';
  const items = Array.isArray(input.items) ? input.items : [];
  const hasUrlRequisition = Boolean(input.hasUrlRequisition);
  const lifecycleState = input.lifecycleState || (items.length > 0 ? 'DRAFT' : 'EMPTY');
  const isEmptyRequisition = lifecycleState === 'EMPTY' && !hasUrlRequisition && items.length === 0;
  const leadItem = items[0] || null;

  const folio = input.folioParam || (isEmptyRequisition
    ? (isEn ? 'SMAT-DRAFT' : 'SMAT-BORRADOR')
    : ('SMAT-' + new Date().getFullYear() + '-REQ'));

  const urgencia = isEmptyRequisition
    ? 'borrador'
    : (input.urgencyParam || 'proyecto');

  const matSpec = resolveDomainMaterialSpec({
    circuit: input.circuit || leadItem?.circuit || 'bombeo',
    skuId: input.skuId || leadItem?.id || '',
    materialCode: input.material || leadItem?.material || '',
    isEmpty: isEmptyRequisition,
    locale: isEn ? 'en' : 'es',
  });

  const urgencyHeading = isEmptyRequisition
    ? (isEn ? 'STATUS: NO REQUISITION ISSUED' : 'ESTADO: BORRADOR SIN REQUISICIÓN')
    : (urgencia === 'paro'
      ? (isEn ? 'PRIORITY: PLANT SHUTDOWN' : 'PRIORIDAD: [PARO DE PLANTA]')
      : (isEn ? 'PRIORITY: SCHEDULED PROJECT' : 'PRIORIDAD: [PROYECTO / PROGRAMADO]'));

  return {
    isEmptyRequisition,
    folio,
    urgencia,
    urgencyHeading,
    matSpec,
    orderCodeLabel: isEmptyRequisition
      ? (isEn ? 'LOCAL DRAFT • CONFIGURE SPARES IN QUOTE WIZARD' : 'BORRADOR LOCAL • CONFIGURE REFACCIONES EN COTIZADOR')
      : '',
  };
}

function computeFnv1aOrderHash(seedStr = '') {
  let h = 0x811c9dc5;
  const str = String(seedStr || 'SMAT-DEFAULT');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'SMAT-ORD-' + h.toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
}

/**
 * @param {any[]} [rawItems=[]]
 * @param {any[]} [existingItems=[]]
 */
export function enrichTrayItemsPreservingMetadata(rawItems = [], existingItems = []) {
  const existingById = new Map(
    (Array.isArray(existingItems) ? existingItems : []).map((it) => [String(it.id || it.skuId || '').toUpperCase(), it])
  );
  return rawItems.map((entry) => {
    const id = String(entry.id || entry.skuId || 'SMAT-PUMP-IMP-AH').trim().toUpperCase();
    const prev = /** @type {Record<string, any>} */ (existingById.get(id) || {});
    const catalogSku = /** @type {Record<string, any> | null} */ (getQuickProductBySlugOrAlias(id));
    const vertical = catalogSku?.vertical || prev.circuit || entry.circuit || 'bombeo';
    const satLine = formatSatTigieInvoiceLine({ skuId: id, vertical });
    const stockRegime = catalogSku?.stock_regime || prev.stockRegime || 'hay';
    return {
      ...prev,
      ...entry,
      id: catalogSku?.id || id,
      skuId: catalogSku?.id || id,
      atomicCode: prev.atomicCode || (catalogSku?.atomic_codes && catalogSku.atomic_codes[0]) || id,
      nameEs: prev.nameEs || catalogSku?.title_es || `Componente Industrial ${id}`,
      nameEn: prev.nameEn || catalogSku?.title_en || `Industrial Component ${id}`,
      circuit: vertical,
      material: entry.material || prev.material || catalogSku?.default_material || 'A05',
      unitWeightKg: Number(prev.unitWeightKg || catalogSku?.mass_kg || 12.0),
      qty: Math.max(1, Number(entry.qty || prev.qty || 1)),
      criticalityMode: (entry.criticalityMode || prev.criticalityMode) === 'STOCK_SS' ? 'STOCK_SS' : 'PARO_DE_LINEA',
      coupledPairSku: catalogSku?.coupled_pair_sku || 'SMAT-PUMP-WETKIT-554',
      reorderWindowDays: Number(catalogSku?.reorder_window_days || 90),
      stockRegime,
      satLine
    };
  });
}

function isNonPumpDomain(circuit = '', skuId = '', code = '') {
  const c = String(circuit || '').toLowerCase();
  const s = String(skuId || '').toUpperCase();
  const k = String(code || '').toUpperCase();
  if (
    c === 'bombeo' ||
    s.startsWith('SMAT-PUMP-') ||
    s.startsWith('SMAT-SEAL-') ||
    s.startsWith('SMAT-BEAR-') ||
    s.startsWith('SMAT-SKID-') ||
    s === 'SMAT-COUPLED-PUMP-CYC' ||
    k.startsWith('SMAT-PUMP-') ||
    k.startsWith('SMAT-SEAL-') ||
    k.startsWith('SMAT-BEAR-') ||
    k.startsWith('SMAT-SKID-')
  ) {
    return false;
  }
  return Boolean(c || s || k);
}

/**
 * @param {'es' | 'en'} [lang='es']
 * @param {Record<string, any>} [_options={}]
 */
export function initAcuseSheetController(lang = 'es', _options = {}) {
  /** @type {'es' | 'en'} */
  const uiLang = lang === 'en' ? 'en' : 'es';
  const isEn = uiLang === 'en';

  function populateSheet() {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const rfqSession = /** @type {Record<string, any>} */ (loadRfqSession());
    const outboxSnapshot = /** @type {Record<string, any>} */ (
      rfqSession.outbox || rfqSession.stationSnapshots?.outbox || {}
    );
    const cached = /** @type {Record<string, any>} */ (outboxSnapshot.lastPayload || {});
    const wbV2 = /** @type {Record<string, any>} */ ({
      ...(rfqSession.plantContext || {}),
      ...(rfqSession.contact || {}),
    });
    /** @type {{ items: any[], coreReturnEnabled: boolean }} */
    const trayState = {
      items: Array.isArray(rfqSession.items) ? [...rfqSession.items] : [],
      coreReturnEnabled: Boolean(rfqSession.coreReturnEnabled),
    };

    const existingItems = Array.isArray(trayState.items) ? trayState.items : [];
    const trayQueryParam = urlParams.get('tray') || '';
    const skuQueryParam = urlParams.get('sku') || '';
    if (trayQueryParam) {
      const parsedItems = trayQueryParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => {
          const [id, qtyStr, crit] = entry.split(':');
          return {
            id: decodeURIComponent(id || 'SMAT-PUMP-IMP-AH').toUpperCase(),
            skuId: decodeURIComponent(id || 'SMAT-PUMP-IMP-AH').toUpperCase(),
            qty: Math.max(1, Number(qtyStr) || 1),
            criticalityMode: crit === 'STOCK_SS' ? 'STOCK_SS' : 'PARO_DE_LINEA'
          };
        });
      if (parsedItems.length > 0) {
        trayState.items = enrichTrayItemsPreservingMetadata(parsedItems, existingItems);
        saveRfqSession({
          ...rfqSession,
          items: trayState.items,
        });
      }
    } else if (skuQueryParam && existingItems.length === 0) {
      trayState.items = enrichTrayItemsPreservingMetadata(
        [{ id: skuQueryParam.toUpperCase(), skuId: skuQueryParam.toUpperCase(), qty: 1, criticalityMode: 'PARO_DE_LINEA' }],
        existingItems
      );
    } else if (existingItems.length > 0) {
      trayState.items = enrichTrayItemsPreservingMetadata(existingItems, existingItems);
    }

    const traySummary = Array.isArray(trayState.items) && trayState.items.length > 0
      ? trayState.items.map((i) => `${i.id}x${i.qty || 1}`).join(', ')
      : '';
    if (traySummary) {
      wbV2.traySkuSummary = traySummary;
      wbV2.clientRef = wbV2.clientRef || traySummary;
    }

    const unifiedState = /** @type {Record<string, any>} */ (loadUnifiedEngineeringAndWorkbenchState(window.location.search));
    const engCtx = unifiedState.engCtx || {};
    const resolvedSg = unifiedState.sg || 1.5;
    const resolvedD50Um = unifiedState.d50Um || 120;
    const jrpWindow = calculateCoupledReorderWindowDays({ sg: resolvedSg, d50Um: resolvedD50Um });
    const selectedLaneParam = urlParams.get('lane') || 'CAJA_CHICA_CFDI40';
    const checkoutMeta = formatDualCheckoutPayload({
      estimatedMxn: selectedLaneParam === 'ORDEN_COMPRA_SAP' ? 65000 : 18500,
      stockRegime: (trayState.items[0] && trayState.items[0].stockRegime) || 'hay'
    });

    const trayTbody = document.getElementById('acuse-multi-item-tray-tbody');
    if (trayTbody) {
      if (Array.isArray(trayState.items) && trayState.items.length > 0) {
        trayTbody.innerHTML = trayState.items
          .map(
            (it) => {
              const itemJrp = calculateCoupledReorderWindowDays({
                sg: resolvedSg,
                d50Um: resolvedD50Um,
                criticalityMode: it.criticalityMode,
                stockRegime: it.stockRegime,
              });
              return `
            <tr>
              <td class="acuse-cell-sku">${it.id}<br/><small>${it.material || 'STD'}</small></td>
              <td><strong>${isEn ? it.nameEn : it.nameEs}</strong><br/><small class="acuse-cell-sat">${it.satLine}</small></td>
              <td class="acuse-cell-qty">${it.qty}</td>
              <td class="acuse-cell-jrp">${it.coupledPairSku} (${isEn ? 'Cycle' : 'Ciclo'}: T10=${itemJrp.t10InspectionDays}d / T50=${itemJrp.t50ReorderTriggerDays}d / T80=${itemJrp.t80CriticalChangeoutDays}d · Buffer ${itemJrp.leadTimeBufferDays}d · Sev ${itemJrp.wearSeverityFactor}× · ${itemJrp.wearAcceleratedLifeHours}h · ${isEn ? itemJrp.dispatchModeLabelEn : itemJrp.dispatchModeLabelEs} · ${formatCheckoutLaneHuman(checkoutMeta.lane, uiLang)})</td>
            </tr>`;
            }
          )
          .join('');
      } else {
        trayTbody.innerHTML = `<tr><td colspan="4" class="acuse-empty-row">${isEn
            ? `Single-component technical specification (${jrpWindow.policySummaryEn})`
            : `Especificación técnica de componente individual (${jrpWindow.policySummaryEs})`
          }</td></tr>`;
      }
    }

    const isReorderOnly = urlParams.get('reorder') === '1' && Array.isArray(trayState.items) && trayState.items.length > 0;
    const hasPumpItem = Array.isArray(trayState.items) && trayState.items.some(
      (it) => !isNonPumpDomain(it.circuit, it.id, it.skuId)
    );
    const leadItem = Array.isArray(trayState.items) && trayState.items.length > 0 ? trayState.items[0] : null;
    const activeCircuit = urlParams.get('circuito') || cached.circuito || wbV2.circuit || engCtx.activeCircuit || '';
    const codigo = urlParams.get('codigo') || cached.codigo_smat || wbV2.equipCode || (leadItem ? leadItem.id : '');
    const isNonPumpRequisition = isNonPumpDomain(activeCircuit, urlParams.get('sku') || '', codigo) && !hasPumpItem;
    if ((isReorderOnly && !hasPumpItem) || isNonPumpRequisition) {
      ['row-field-hydraulics', 'row-field-material-drive', 'row-field-clearance-kinematics'].forEach((rowId) => {
        const tr = document.getElementById(rowId);
        if (tr) tr.classList.add('hidden');
      });
    }

    const sessionNow = loadRfqSession();
    const lifecycleState = deriveSessionLifecycleState({
      ...sessionNow,
      items: trayState.items || sessionNow.items || [],
    });
    const hasUrlRequisition = Boolean(urlParams.get('folio') || urlParams.get('codigo') || urlParams.get('equipo') || urlParams.get('tray') || urlParams.get('sku'));
    const acuseVm = buildAcuseViewModel({
      lifecycleState,
      hasUrlRequisition,
      items: trayState.items || [],
      circuit: activeCircuit || leadItem?.circuit || '',
      material: urlParams.get('material') || cached.material_bombeo || wbV2.pump_material || wbV2.selectedMaterial || leadItem?.material || '',
      skuId: urlParams.get('sku') || leadItem?.id || codigo || '',
      locale: isEn ? 'en' : 'es',
      folioParam: urlParams.get('folio') || cached.folio || wbV2.folio || '',
      urgencyParam: urlParams.get('urgencia') || (cached.urgencia && cached.urgencia.includes('PARO') ? 'paro' : (wbV2.urgency === 'PARO_DE_LINEA' ? 'paro' : (wbV2.urgency === 'STOCK_SS' ? 'proyecto' : ''))),
    });
    const isEmptyRequisition = acuseVm.isEmptyRequisition;

    const defaultRoleTitle = leadItem
      ? (isEn ? leadItem.nameEn : leadItem.nameEs)
      : (isEmptyRequisition
        ? (isEn ? 'No active items yet — Configure spares in Quote Wizard' : 'Sin partidas activas — Seleccione refacciones en el Cotizador')
        : (isEn ? 'Critical Slurry Pumping Wear Replacement' : 'Refaccionamiento Crítico de Pulpa / Bombeo'));

    const folio = isEmptyRequisition
      ? acuseVm.folio
      : (urlParams.get('folio') || cached.folio || wbV2.folio || ('SMAT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)));
    const nombre = urlParams.get('nombre') || urlParams.get('name') || cached.nombre || cached.name || wbV2.name || sessionNow.contact?.name || (isEn ? '— Pending capture in Quote Wizard —' : '— Pendiente de captura en Cotizador —');
    const empresa = urlParams.get('empresa') || urlParams.get('company') || cached.empresa || cached.company || wbV2.company || sessionNow.contact?.company || (isEn ? '— Select site or company —' : '— Seleccionar operación minera —');
    const telefono = urlParams.get('telefono') || urlParams.get('phone') || cached.telefono || cached.phone || wbV2.phone || sessionNow.contact?.phone || (isEn ? 'Pending capture' : 'Pendiente de captura');
    const correo = urlParams.get('correo') || urlParams.get('email') || cached.correo || cached.email || wbV2.email || sessionNow.contact?.email || '—';
    const equipo = urlParams.get('equipo') || urlParams.get('role') || cached.equipo || wbV2.equipTitle || defaultRoleTitle;
    const pieza = urlParams.get('pieza') || cached.codigo_pieza_atomica || wbV2.atomicPartCode || '';
    const refCliente = urlParams.get('ref_cliente') || cached.referencia_cliente || wbV2.clientRef || (isEn ? 'No internal reference declared' : 'Sin referencia interna declarada');
    const medidas = urlParams.get('medidas') || cached.medidas_flexometro || (isEn ? '1:1 dimensional verification at Durango Warehouse' : 'Verificación dimensional 1:1 en Almacén Durango');
    const perfilPulpa = urlParams.get('perfil_pulpa') || cached.perfil_pulpa_mina || '';
    const phVal = urlParams.get('ph') || cached.pulp_ph || wbV2.pulpPh || '7.5';
    const flVal = urlParams.get('fl') || cached.durand_fl || wbV2.durandFactorFL || '';
    const cvVal = urlParams.get('cv') || cached.solids_cv_pct || wbV2.solidsVolumetricPercent || '';
    const vRecVal = urlParams.get('v_rec') || cached.recommended_velocity_ms || wbV2.recommendedPipeVelocityMs || '';
    const erVal = urlParams.get('eff_ratio_er') || cached.eff_ratio_er || wbV2.eff_ratio_er || '0.88';
    const impLifeVal = urlParams.get('impeller_life_h') || cached.impeller_life_h || wbV2.impeller_life_h || '2800';
    const wearRatioVal = urlParams.get('wear_life_ratio') || cached.wear_life_ratio || wbV2.wear_life_ratio || '3.8';
    const pAtmMcaVal = urlParams.get('p_atm_mca') || cached.p_atm_mca || wbV2.p_atm_mca || '7.98';
    const deltaNpshVal = urlParams.get('delta_npsh_m') || cached.delta_npsh_m || wbV2.delta_npsh_m || '2.35';
    const motorDeratingVal = urlParams.get('motor_derating_iec') || cached.motor_derating_iec || wbV2.motor_derating_iec || '0.920';
    const kMotorAltVal = urlParams.get('k_motor_alt') || cached.k_motor_alt || wbV2.k_motor_alt || '1.24';
    const pipeVelLossVal = urlParams.get('pipe_vel_loss_pct') || cached.pipe_vel_loss_pct || wbV2.pipe_vel_loss_pct || '0.3';
    const gateClassVal = isEmptyRequisition ? 'DRAFT' : (urlParams.get('gate_classification') || cached.gate_classification || wbV2.gate_classification || 'STANDARD_PROJECT');
    const hidraulicaBase = urlParams.get('hidraulica') || cached.memoria_hidraulica_durand || (isEn ? 'Hydraulic calculation subject to plant flow rate and % solids confirmation.' : 'Cálculo hidráulico sujeto a confirmación de flujo y % de sólidos en planta.');
    const hidraulicaExtras = [
      `pH = ${phVal}`,
      flVal ? `F_L = ${flVal}` : '',
      cvVal ? `C_v = ${cvVal}%` : '',
      vRecVal ? `v_rec = ${vRecVal} m/s` : '',
      `η_r = ${erVal}`,
      `${isEn ? 'Impeller Life' : 'Vida Impulsor'} = ${impLifeVal} h (${wearRatioVal}x)`,
      `P_atm = ${pAtmMcaVal} mca (ΔNPSH = -${deltaNpshVal} m)`,
      `f_IEC = ${motorDeratingVal} (K_motor,alt = ${kMotorAltVal}x)`
    ].filter(Boolean).join(' | ');
    const hidraulica = hidraulicaBase.includes('K_motor,alt') ? hidraulicaBase : `${hidraulicaBase} (${hidraulicaExtras})`;
    const tco = urlParams.get('tco') || cached.proyeccion_tco || '';
    const notasEspeciales = urlParams.get('notas_especiales') || cached.custom_notes || wbV2.custom_notes || '';
    const detallesBase = urlParams.get('detalles') || urlParams.get('specs') || cached.especificacion_tecnica || cached.details || wbV2.notes || wbV2.details || (isEn ? 'Technical requisition subject to Durango yard dimensional inspection.' : 'Requisición técnica sujeta a validación dimensional de patio Durango.');
    const detalles = notasEspeciales && !detallesBase.includes(notasEspeciales) ? `${detallesBase} | ${notasEspeciales}` : detallesBase;
    const rawDestino = urlParams.get('destino') || cached.modalidad_logistica || wbV2.destination || sessionNow.contact?.destination || 'warehouse_durango_pickup';
    const destino = formatLogisticsDestinationHuman(rawDestino, isEn ? 'en' : 'es');
    const urgencia = acuseVm.urgencia;
    const material = urlParams.get('material') || cached.material_bombeo || wbV2.pump_material || wbV2.selectedMaterial || (leadItem ? leadItem.material : (isEmptyRequisition ? '' : 'alto_cromo_cr27'));
    const transmision = urlParams.get('transmision') || urlParams.get('arreglo') || cached.arreglo_transmision || wbV2.drive_arrangement || wbV2.driveArrangement || 'ZVZ';
    const estacion = urlParams.get('estacion') || cached.estacion_armado || wbV2.stationCode || 'S4';
    const sealBranch = urlParams.get('seal_branch') || cached.rama_sellado || wbV2.seal_branch || wbV2.sealBranch || 'expeller_dry';
    const pesoKg = urlParams.get('peso_kg') || cached.peso_pieza_kg || wbV2.partMassKg || wbV2.weight_kg || (leadItem ? String(leadItem.unitWeightKg) : '');
    const claroMm = urlParams.get('claro_mm') || cached.claro_axial_mm || wbV2.clearance_mm || wbV2.clearanceMm || '0.75';
    const b2Mm = urlParams.get('b2_mm') || cached.ancho_impulsor_b2_mm || wbV2.b2_mm || wbV2.impellerExitWidthMm || '48';
    const capCKn = urlParams.get('cap_c_kn') || cached.capacidad_rodamiento_c_kn || wbV2.cap_c_kn || wbV2.dynamicCapacityCkN || '185';
    const trustBoundaryId = urlParams.get('trust_boundary_id') || cached.trust_boundary_id || wbV2.trust_boundary_id || 'NONE';
    const deltaEtaV = urlParams.get('delta_eta_v') || cached.perdida_eficiencia_vol_pct || wbV2.volumetricEfficiencyDropPct || '0.3';
    const u2Ms = urlParams.get('u2_ms') || cached.velocidad_periferica_u2_ms || wbV2.tipSpeedU2Ms || '22.4';
    const n2Rpm = urlParams.get('n2_rpm') || cached.n2_rpm || (wbV2.kinematics && wbV2.kinematics.pumpRpm) || '1149';
    const frKn = urlParams.get('fr_kn') || cached.fr_kn || (wbV2.kinematics && wbV2.kinematics.beltRadialLoadKn) || '5.20';
    const floodImm = urlParams.get('inmunidad_sumidero') || cached.inmunidad_sumidero || (wbV2.kinematics && wbV2.kinematics.sumpFloodImmunity) || 'HIGH';
    const structReason = urlParams.get('razon_estructural') || cached.razon_estructural || (wbV2.clearance_eval && (isEn ? wbV2.clearance_eval.structuralReasonEn : wbV2.clearance_eval.structuralReasonEs)) || '';
    const l10h = urlParams.get('l10h') || cached.vida_rodamiento_l10h || wbV2.l10hHours || '38500';
    const rhopVal = urlParams.get('rhop') || cached.densidad_mineral_rhop || wbV2.oreDensitySg || '';
    const libUmVal = urlParams.get('lib_um') || wbV2.lib_um || '';
    const gradeVal = urlParams.get('grade') || wbV2.grade || '';
    const airPsiVal = urlParams.get('air_psi') || wbV2.air_psi || '';
    const rrNVal = urlParams.get('rr_n') || wbV2.rr_n || '';
    const retP80Val = urlParams.get('ret_p80') || wbV2.ret_p80 || '';
    const rhoFVal = urlParams.get('rho_f') || (wbV2.cycloneCircuit && wbV2.cycloneCircuit.feedSg) || '';
    const rhoUVal = urlParams.get('rho_u') || (wbV2.cycloneCircuit && wbV2.cycloneCircuit.underflowSg) || '';
    const rhoOVal = urlParams.get('rho_o') || (wbV2.cycloneCircuit && wbV2.cycloneCircuit.overflowSg) || '';
    const rsPctVal = urlParams.get('rs_pct') || (wbV2.cycloneCircuit && wbV2.cycloneCircuit.solidsRecoveryPct) || '';
    const cvUVal = urlParams.get('cv_u') || (wbV2.cycloneCircuit && wbV2.cycloneCircuit.underflowCvPct) || '';
    const d50cVal = urlParams.get('d50c') || (wbV2.cycloneCircuit && wbV2.cycloneCircuit.d50cMicrons) || '';
    const hasMarcy3Cup = Boolean(urlParams.get('rho_f') || urlParams.get('rho_u') || urlParams.get('rs_pct') || urlParams.get('circuito') === 'clasificacion' || wbV2.circuit === 'clasificacion');
    const marcy3CupSummary = hasMarcy3Cup
      ? `3-Vasos Marcy: ρ_f=${rhoFVal || '1.35'} | ρ_u=${rhoUVal || '1.82'} | ρ_o=${rhoOVal || '1.15'} | R_s=${rsPctVal || '84.2'}%${cvUVal ? ' | Cv,u=' + cvUVal + '%' : ''}${d50cVal ? ' | d50c=' + d50cVal + ' µm' : ''}`
      : '';
    const metrologiaBase = urlParams.get('metrologia') || cached.memoria_metrologica || '';
    const metroExtras = [
      libUmVal ? `d_l=${libUmVal} µm` : '',
      gradeVal ? `a_L=${gradeVal}%` : '',
      airPsiVal ? `P_air=${airPsiVal} PSI` : '',
      rrNVal ? `n=${rrNVal}` : '',
      retP80Val ? `R(P80)=${retP80Val}%` : '',
      marcy3CupSummary
    ].filter(Boolean).join(' | ');
    const metrologia = metrologiaBase
      ? (metroExtras && !metrologiaBase.includes('d_l=') && !metrologiaBase.includes('3-Vasos') ? `${metrologiaBase} (${metroExtras})` : metrologiaBase)
      : (rhopVal || marcy3CupSummary
        ? (isEn ? `Ore density ρ_p = ${rhopVal || '2.70'} t/m³ calibrated at metrology station${metroExtras ? ' (' + metroExtras + ')' : ''}.` : `Densidad mineral ρ_p = ${rhopVal || '2.70'} t/m³ calibrada en estación metrológica${metroExtras ? ' (' + metroExtras + ')' : ''}.`)
        : (isEn ? 'No laboratory pre-calibration attached (Marcy Scale / Bond / Filter Press).' : 'Sin pre-calibración de laboratorio adjunta (Balanza Marcy / Bond / Prensa).'));

    const elFolio = document.getElementById('display-folio');
    if (elFolio) elFolio.textContent = folio;

    const elDate = document.getElementById('display-date');
    if (elDate) {
      const now = new Date();
      elDate.textContent = now.toLocaleDateString(isEn ? 'en-US' : 'es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const elUrgency = document.getElementById('display-urgency');
    if (elUrgency) {
      elUrgency.textContent = acuseVm.urgencyHeading;
      elUrgency.classList.toggle('is-urgency-paro', !isEmptyRequisition && urgencia === 'paro');
    }

    const webhookStatus = outboxSnapshot.dispatchStatus || null;
    const webhookQueryOverride = urlParams.get('webhook');
    const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    const resolvedWebhook = resolveHonestWebhookStatus({
      endpointUrl: String(webhookStatus?.endpointUrl || ''),
      webhookFlag: webhookQueryOverride || webhookStatus?.status || (webhookStatus?.blocked ? 'blocked' : ''),
      httpStatus: Number(webhookStatus?.httpStatus || 0),
      isOnline: isOnlineNow,
      isEn,
    });
    const webhookBanner = document.getElementById('acuse-webhook-status');
    if (webhookBanner) {
      webhookBanner.setAttribute('data-webhook-state', resolvedWebhook.dataAttr);
      webhookBanner.setAttribute('data-outbox-state', resolvedWebhook.state);
      webhookBanner.classList.remove('is-webhook-blocked', 'is-webhook-sent');
      webhookBanner.classList.add(resolvedWebhook.cssClass);
      webhookBanner.textContent = resolvedWebhook.message;
    }

    const fullTcoAndProfile = [
      perfilPulpa ? `${isEn ? 'Mineral Profile' : 'Perfil Mineral'}: ${perfilPulpa}` : '',
      tco ? `${isEn ? 'Operational Impact' : 'Impacto Operativo'}: ${tco}` : '',
      trayState.coreReturnEnabled
        ? (isEn ? 'Circular Economy Core Trade-In: -22% on DAM005 Cartridge (H7 Bore Verified)' : 'Economía Circular Core Trade-In: -22% en Cartucho DAM005 (Alojamiento H7 Verificado)')
        : ''
    ].filter(Boolean).join(' • ') || (isEn ? 'Operational continuity assessment at Durango Central Warehouse.' : 'Evaluación de continuidad operativa en Almacén Central Durango.');

    const fullPayloadPre = document.getElementById('acuse-full-payload-pre');
    if (fullPayloadPre) {
      const detailPayload = {
        folio,
        urgencia,
        gate_classification: gateClassVal,
        trust_boundary_id: trustBoundaryId,
        webhook_status: resolvedWebhook.state,
        webhook_verified_delivery: resolvedWebhook.verifiedDelivery,
        memoria_hidraulica: hidraulica,
        estacion_despiece: estacion,
        cedula_metrologia: metrologia,
        tco_resumen: fullTcoAndProfile,
        material_wet_end: material,
        arreglo_transmision: transmision,
        rama_sellado: sealBranch,
        peso_pieza_kg: pesoKg || '0',
        claro_axial_mm: claroMm,
        ancho_impulsor_b2_mm: b2Mm,
        capacidad_rodamiento_c_kn: capCKn,
        velocidad_punta_u2_ms: u2Ms,
        rpm_bomba_n2: n2Rpm,
        carga_radial_fr_kn: frKn,
        vida_rodamiento_l10h: l10h,
        derating_eficiencia_er: erVal,
        vida_estimada_impulsor_h: impLifeVal,
        perdida_npsh_altitud_m: deltaNpshVal,
        derating_motor_iec: motorDeratingVal,
        multiplicador_motor_altitud: kMotorAltVal,
        perdida_margen_vc_pct: pipeVelLossVal,
        tray_items: trayState.items || []
      };
      fullPayloadPre.textContent = JSON.stringify(detailPayload, null, 2);
    }

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    const fullCode = [codigo, pieza ? `[${isEn ? 'Part' : 'Pieza'}: ${pieza}]` : '', traySummary ? `[${isEn ? 'Tray' : 'Bandeja'}: ${traySummary}]` : ''].filter(Boolean).join(' ') || (isEmptyRequisition ? acuseVm.folio : (isEn ? 'SMAT-STD (1:1 Fit)' : 'SMAT-STD (Cotejo 1:1)'));
    const orderHashCode = isEmptyRequisition ? acuseVm.folio : computeFnv1aOrderHash(`${fullCode}|${material}|${transmision}|${estacion}`);
    setText(
      'dossier-order-code',
      isEmptyRequisition
        ? acuseVm.orderCodeLabel
        : (isEn ? `${orderHashCode} • PRIORITY DISPATCH DURANGO HUB` : `${orderHashCode} • DESPACHO PRIORITARIO ALMACÉN DURANGO`)
    );
    if (traySummary) {
      setText('dossier-title', isEn ? `FORMAL ENGINEERING REQUISITION & QUOTATION RECEIPT (${traySummary})` : `ACUSE FORMAL DE SOLICITUD DE COTIZACIÓN TÉCNICA (${traySummary})`);
    }

    setText('field-name', nombre);
    setText('field-company', empresa);
    setText('field-phone', telefono);
    setText('field-email', correo);
    setText('field-destination', destino);
    setText('field-role', equipo);
    setText('field-code', fullCode);
    setText('field-client-ref', refCliente);
    setText('field-dimensions', medidas);
    setText('field-details', detalles);
    setText('field-hydraulics', hidraulica);

    const matLabel = isEmptyRequisition
      ? `${acuseVm.matSpec.badge} (${acuseVm.matSpec.hardnessSpec})`
      : (material === 'hybrid_a05_r55' || material === 'hibrido_a05_r55'
        ? (isEn ? 'Branch D Hybrid Wet-End: Cr27% A05 Impeller + R55 Natural Rubber Liners' : 'Rama D Híbrida de Extremo Húmedo: Impulsor Alto Cromo Cr27% A05 + Forros Hule R55')
        : (material === 'hule_natural' || material === 'R55'
          ? (isEn ? 'Anti-Abrasion Natural Rubber R55 (55–65 Shore A)' : 'Hule Natural Antiabrasivo R55 (55–65 Shore A)')
          : (material === 'poliuretano' || material === 'PU'
            ? (isEn ? 'Mining Polyurethane U01 (85–95 Shore A)' : 'Poliuretano Grado Minero U01 (85–95 Shore A)')
            : ((material === 'ceramica_sic' || material === 'carburo_silicio' || material === 'SiC')
              ? (isEn ? 'Sintered Silicon Carbide SiC (≥2200 HV, Mohs 9.2, K_Ic=4.1 MPa·√m)' : 'Carburo de Silicio Sinterizado SiC (≥2200 HV, Mohs 9.2, K_Ic=4.1 MPa·√m)')
              : `${acuseVm.matSpec.badge} (${acuseVm.matSpec.hardnessSpec})`))));
    const sealLabel = sealBranch === 'gland_water'
      ? (isEn ? 'S5b Flushed Gland Packing' : 'S5b Prensaestopa con Agua')
      : (isEn ? 'S5a Dry Centrifugal Expeller' : 'S5a Expulsor Centrífugo Seco');
    const wNum = Number(pesoKg) || 0;
    const liShaft = wNum > 0 ? (wNum / 11.1).toFixed(2) : '0.00';
    const nioshTier = wNum >= 23
      ? (isEn ? `Mandatory Hoist / Crane (≥23 kg NOM-036-1, LI_shaft=${liShaft})` : `Polipasto / Grúa Obligatorio (≥23 kg NOM-036-1, LI_shaft=${liShaft})`)
      : (wNum > 11.1
        ? (isEn ? `2-Tech Assisted Shaft Mount (11.1–23 kg NOM-036-1, RWL_shaft=11.1 kg, LI_shaft=${liShaft})` : `Montaje Asistido 2 Técnicos (11.1–23 kg NOM-036-1, RWL_shaft=11.1 kg, LI_shaft=${liShaft})`)
        : (isEn ? `Safe 1-Tech Manual Handling (≤11.1 kg NOM-036-1, LI_shaft=${liShaft})` : `Manejo Manual Seguro 1 Técnico (≤11.1 kg NOM-036-1, LI_shaft=${liShaft})`));
    const nioshLabel = pesoKg ? ` • ${isEn ? 'Weight' : 'Peso'}: ${pesoKg} kg (${nioshTier})` : '';
    setText(
      'field-material-drive',
      isEmptyRequisition
        ? `${matLabel} • ${acuseVm.urgencyHeading}`
        : (isEn
          ? `${matLabel} • V-Belt Drive: ${transmision} (Sump: ${floodImm}) • Station: ${estacion} (${sealLabel})${nioshLabel}`
          : `${matLabel} • Arreglo V-Belt: ${transmision} (Sumidero: ${floodImm}) • Estación: ${estacion} (${sealLabel})${nioshLabel}`)
    );
    setText(
      'field-clearance-kinematics',
      isEn
        ? `Axial Clearance δ = ${claroMm} mm (b₂ = ${b2Mm} mm, Δη_v = -${deltaEtaV}%, Δv_pipe = -${pipeVelLossVal}%) • n₂ = ${n2Rpm} RPM • u₂ = ${u2Ms} m/s • F_r = ${frKn} kN • C = ${capCKn} kN (ISO 281 Life L₁₀ₕ = ${Number(l10h).toLocaleString('en-US')} h)${structReason ? ' • ' + structReason : ''}`
        : `Claro Axial δ = ${claroMm} mm (b₂ = ${b2Mm} mm, Δη_v = -${deltaEtaV}%, Δv_pipe = -${pipeVelLossVal}%) • n₂ = ${n2Rpm} RPM • u₂ = ${u2Ms} m/s • F_r = ${frKn} kN • C = ${capCKn} kN (Vida ISO 281 L₁₀ₕ = ${Number(l10h).toLocaleString('es-MX')} h)${structReason ? ' • ' + structReason : ''}`
    );
    setText('field-metrology', metrologia);
    setText('field-tco', fullTcoAndProfile);
    setText(
      'field-type',
      isEmptyRequisition
        ? (isEn ? 'Technical Draft (Pending Quote Wizard selection)' : 'Borrador Técnico (Pendiente de selección en Cotizador)')
        : (isEn
          ? `${urgencia === 'paro' ? 'Emergency Plant Shutdown' : 'Formal Equipment Requisition / Project'} [${gateClassVal}${trustBoundaryId !== 'NONE' ? ' • ' + trustBoundaryId : ''}]`
          : `${urgencia === 'paro' ? 'Paro Operativo Prioritario' : 'Requisición Formal de Proyecto'} [${gateClassVal}${trustBoundaryId !== 'NONE' ? ' • ' + trustBoundaryId : ''}]`)
    );

    const sapTrayLines = Array.isArray(trayState.items) && trayState.items.length > 0
      ? trayState.items.map((it) => `LINE_ITEM: ${it.satLine} | QTY=${it.qty} | COUPLED=${it.coupledPairSku} (${it.reorderWindowDays}d)`)
      : [];
    const sapBlockText = isEmptyRequisition
      ? (isEn
        ? `FOLIO: ${folio} | STATUS: DRAFT (NO ACTIVE LINE ITEMS)\nACTION: Select spares or paste BOM in /en/quote/ before dispatching to Durango Warehouse.`
        : `FOLIO: ${folio} | ESTADO: BORRADOR SIN PARTIDAS ACTIVAS\nACCIÓN: Seleccione refacciones o pegue lista BOM en /cotizar/ antes de enviar al Almacén Durango.`)
      : [
        `FOLIO: ${folio} | ORDER_HASH: ${orderHashCode} | GATE: ${gateClassVal} | BOUNDARY: ${trustBoundaryId} | ${isEn ? 'LANE' : 'CARRIL'}: ${formatCheckoutLaneHuman(checkoutMeta.lane, uiLang)}`,
        `${isEn ? 'COMPANY' : 'EMPRESA'}: ${empresa} | ${isEn ? 'REQUESTER' : 'SOLICITANTE'}: ${nombre}`,
        `${isEn ? 'EQUIPMENT' : 'EQUIPO'}: ${equipo} (${fullCode})`,
        ...sapTrayLines,
        ...(isNonPumpRequisition
          ? []
          : [
            `${isEn ? 'METALLURGY & DRIVE' : 'METALURGIA Y ARREGLO'}: ${matLabel} | ${transmision} (${floodImm}) | ${estacion} (${sealLabel})${nioshLabel}`,
            `${isEn ? 'HYDRAULICS & ALTITUDE' : 'HIDRAULICA Y ALTITUD'}: ${hidraulica}`,
            `KINEMATICS: delta=${claroMm}mm (b2=${b2Mm}mm, dEtaV=-${deltaEtaV}%, dvPipe=-${pipeVelLossVal}%), n2=${n2Rpm}RPM, u2=${u2Ms}m/s, Fr=${frKn}kN, C=${capCKn}kN, L10h=${l10h}h${structReason ? ' | ' + structReason : ''}`
          ]),
        `${isEn ? 'METROLOGY' : 'METROLOGIA'}: ${metrologia}`
      ].join('\n');
    setText('sap-plaintext-block', sapBlockText);

    const copySapBtn = document.getElementById('copy-sap-acuse-btn');
    if (copySapBtn) {
      copySapBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(sapBlockText);
          copySapBtn.textContent = isEn ? 'SAP Text Copied' : 'Texto SAP Copiado';
        } catch (_e) { }
      };
    }

    const dlTsvBtn = document.getElementById('download-tsv-acuse-btn');
    if (dlTsvBtn) {
      dlTsvBtn.onclick = () => {
        const headers = ['Folio', 'Gate', 'Boundary', 'Empresa', 'Solicitante', 'Equipo', 'Codigo', 'Material', 'Arreglo', 'Inmunidad_Sumidero', 'Estacion', 'Sello', 'Peso_kg', 'NIOSH_Waters_Tier', 'Claro_mm', 'b2_mm', 'n2_RPM', 'u2_ms', 'Fr_kN', 'Capacidad_C_kN', 'L10h_h', 'Er_Cave', 'Vida_Impulsor_h', 'Delta_NPSH_m', 'Derating_IEC', 'K_Motor_Alt', 'Perdida_v_pct', 'Razon_Estructural', 'Hidraulica', 'Metrologia'];
        const row = [folio, gateClassVal, trustBoundaryId, empresa, nombre, equipo, fullCode, matLabel, transmision, floodImm, estacion, sealLabel, pesoKg || '0', nioshTier, claroMm, b2Mm, n2Rpm, u2Ms, frKn, capCKn, l10h, erVal, impLifeVal, deltaNpshVal, motorDeratingVal, kMotorAltVal, pipeVelLossVal, structReason, hidraulica, metrologia];
        const tsv = headers.join('\t') + '\n' + row.map((v) => String(v || '').replace(/[\t\r\n]+/g, ' ')).join('\t') + '\n';
        const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folio}_SAP_ERP.tsv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    bindVendorPassportDownloadButtons(document, uiLang);

    const vcardBtn = document.getElementById('download-vendor-vcard-btn');
    if (vcardBtn) {
      vcardBtn.onclick = () => {
        const vcf = buildSmatVendorVcardString();
        const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SMAT_Minerals_Vendor_Passport.vcf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    const jsonBtn = document.getElementById('download-vendor-json-btn');
    if (jsonBtn) {
      jsonBtn.onclick = () => {
        const anexo22 = buildSapAnexo22ComplianceSummary({
          circuit: activeCircuit || 'bombeo',
          smatCode: codigo || 'SMAT-PUMP-6X4-WETKIT',
          stockRegime: leadItem?.stockRegime || 'hay',
          estimatedMxn: selectedLaneParam === 'ORDEN_COMPRA_SAP' ? 65000 : 18500,
          lang: uiLang,
        });
        const payload = {
          schema: 'smat.vendor.passport.v3',
          companyName: 'SMAT Minerals S.A. de C.V.',
          industrialHub: 'Mariano Salas #114, Col. Primer Presidente, Durango, DGO, C.P. 34166, México',
          postalCode: '34166',
          incoterms: ['EXW Durango', isEn ? 'DAP Mine Site' : 'DAP Unidad Minera'],
          unspscCodes: ['40151500', '20121500', '40161500', '41111500'],
          metallurgyCert: 'ASTM A532 Clase III Tipo A Cr27 >= 650 HB / HRC >= 58',
          anexo22Compliance: anexo22,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SMAT_Minerals_Vendor_Passport.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }

    const reorderLink = document.getElementById('reorder-ss-link');
    if (reorderLink) {
      try {
        if (Array.isArray(trayState.items) && trayState.items.length > 0) {
          const ser = trayState.items.map((i) => `${encodeURIComponent(i.id)}:${i.qty}:STOCK_SS`).join(',');
          const baseQuote = isEn ? '/en/quote/' : '/cotizar/';
          reorderLink.setAttribute('href', `${baseQuote}?reorder=1&tray=${ser}#rfq`);
        }
      } catch (_e) { }
    }
  }

  populateSheet();
  document.addEventListener('astro:page-load', populateSheet);
}
