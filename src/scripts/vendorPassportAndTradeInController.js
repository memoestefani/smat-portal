/**
 * vendorPassportAndTradeInController.js
 * ---------------------------------------------------------------------------
 * Costura Modular LCOM4 = 1 (∂(C) = 0, D6-V39, D8-V39, D9-V39, D10-V39)
 * 1. Membrana Soberana Cero-Exposición Pública de Inventarios (`sanitizePublicAtomicPartSpecs`):
 *    Elimina conteos internos de almacén (`warehouse_audit`, `physical_stock_durango_units`,
 *    `unit_replacement_value_mxn`, `warehouse_total_mxn`, `warehouse_total_units`, `boxes_breakdown`)
 *    de todo payload expuesto al navegador y calcula la Ventana Preventiva de Reabastecimiento
 *    del Cliente (`clientReorderWindowDays`, `90 / 150 / 180` días).
 * 2. Generador RFC 6350 vCard 4.0 (`buildSmatVendorVcardString`) + Pasaporte ERP (`.json` SAP/Coupa)
 *    y Línea Fiscal Anexo 22 / TIGIE (`buildSapAnexo22ComplianceSummary`) en `#pane-sap`.
 * 3. Widget Interactivo *SMAT Core Trade-In (-22%)* (`initCoreTradeInWidgets`) para las 4 superficies
 *    del Cartucho de Rodamientos `DAM005` (`SMAT-PUMP-BRG-005M`).
 */

import {
  getTrayState,
  saveTrayState,
  addTrayItem,
  buildSmatVendorPassportPayload,
  calculateCoupledReorderWindowDays,
  evaluateBearingCartridgeCoreTradeIn
} from './requisitionTrayBus.js';
import {
  formatSatTigieInvoiceLine,
  formatDualCheckoutPayload
} from './workbenchExportFormatters.js';

/**
 * Sanitiza una ficha o colección de piezas atómicas para eliminar al 100% cualquier
 * dato de inventario interno de SMAT antes de serializar al DOM o entregar a la UI pública,
 * enriqueciéndola con la Ventana Sugerida de Re-Pedido Preventivo del Cliente (`D8-V39`).
 *
 * @param {any} rawInput - Objeto individual o arreglo de piezas atómicas
 * @returns {any}
 */
export function sanitizePublicAtomicPartSpecs(rawInput) {
  if (Array.isArray(rawInput)) {
    return rawInput.map((item) => sanitizePublicAtomicPartSpecs(item));
  }
  if (!rawInput || typeof rawInput !== 'object') {
    return rawInput;
  }

  const forbiddenPublicInventoryKeys = [
    'warehouse_audit',
    'physical_stock_durango_units',
    'unit_replacement_value_mxn',
    'physical_audit_date',
    'warehouse_total_mxn',
    'warehouse_total_units',
    'verified_box_count',
    'boxes_breakdown'
  ];

  const clean = { ...rawInput };
  for (const key of forbiddenPublicInventoryKeys) {
    if (key in clean) {
      delete clean[key];
    }
  }

  const circuit = String(clean.circuit || 'bombeo').toLowerCase();
  const isElastomerOrCloth =
    String(clean.metallurgy || '').toLowerCase().includes('hule') ||
    String(clean.metallurgy || '').toLowerCase().includes('poliuretano') ||
    circuit === 'filtracion';
  const defaultWearHours =
    circuit === 'control_procesos'
      ? 4320
      : isElastomerOrCloth
        ? 3600
        : 2160;
  const rawWindow = calculateCoupledReorderWindowDays({
    estimatedWearHours: Number(clean.estimated_wear_hours) || defaultWearHours,
    dailyOperatingHours: 24
  });
  const computedDays =
    typeof rawWindow === 'object' && rawWindow !== null
      ? Number(rawWindow.reorderWindowDays || rawWindow.recommendedWindowDays)
      : Number(rawWindow);
  const clientReorderWindowDays = [90, 150, 180].includes(computedDays)
    ? computedDays
    : circuit === 'control_procesos'
      ? 180
      : isElastomerOrCloth
        ? 150
        : 90;

  clean.clientReorderWindowDays = clientReorderWindowDays;
  clean.client_reorder_window_days = clientReorderWindowDays;
  clean.dispatchSlaLabelEs =
    clean.dispatchSlaLabelEs ||
    `Ciclo sugerido en planta: cada ${clientReorderWindowDays} días • Despacho Programado Durango`;
  clean.dispatchSlaLabelEn =
    clean.dispatchSlaLabelEn ||
    `Suggested plant cycle: every ${clientReorderWindowDays} days • Durango Scheduled Dispatch`;

  return clean;
}

/**
 * Genera una cadena RFC 6350 vCard 4.0 completa para alta inmediata de contacto industrial
 * e ingeniería SMAT Minerals en Apple Contacts, Outlook y directorios corporativos ERP (`D9-V39`).
 *
 * @param {any} [companyMeta={}]
 * @returns {string}
 */
export function buildSmatVendorVcardString(companyMeta = {}) {
  const passport = buildSmatVendorPassportPayload(companyMeta);
  const tradeName = passport.tradeName || 'SMAT Minerals';
  const companyName = passport.companyName || 'SMAT Minerals';
  const contactEmail = passport.contactEmail || 'ventas@smatminerals.com';
  const cfdiVersion = passport.cfdiVersion || 'CFDI 4.0';
  const rfcStatus = passport.rfcStatus || '32-D Positiva';
  const claveUnidad = passport.defaultClaveUnidad || 'H87';
  const claveProdServ = passport.defaultClaveProdServ || '40142000';
  const unspscArr = Array.isArray(passport.unspscCodes) ? passport.unspscCodes : ['40151500'];
  const corridorsArr = Array.isArray(passport.corridorsCovered) ? passport.corridorsCovered : ['Sierra Madre DGO', 'Zacatecas', 'Sonora'];
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `FN:${tradeName} — Ingeniería y Suministro Minero`,
    `ORG:${companyName};Ingeniería de Aplicaciones y Almacén Central Durango`,
    'TITLE:Mesa de Ingeniería de Planta y Atención a Compras B2B',
    'TEL;TYPE=work,voice;VALUE=uri:tel:+52-618-810-4408',
    'TEL;TYPE=cell,text;VALUE=uri:tel:+52-618-367-0664',
    `EMAIL;TYPE=work:${contactEmail}`,
    'ADR;TYPE=work:;;Mariano Salas #114\\, Col. Primer Presidente;Durango;Dgo.;34166;México',
    'URL:https://smatminerals.com',
    `NOTE:Cumplimiento Fiscal ${cfdiVersion} (${rfcStatus}) | Unidad SAT ${claveUnidad} (${claveProdServ}) | UNSPSC ${unspscArr.join('/')} | Cobertura: ${corridorsArr.join(', ')}`,
    'END:VCARD'
  ];
  return lines.join('\r\n');
}

/**
 * Construye el dictamen fiscal dinámico SAT CFDI 4.0 / Anexo 22 + Doble Carril de Compra
 * para proyectar en vivo dentro de `#pane-sap` de `LiveEngineeringDossier.astro` (`D9-V39`).
 *
 * @param {any} [params={}]
 * @returns {any}
 */
export function buildSapAnexo22ComplianceSummary(params = {}) {
  const circuit = String(params.circuit || 'bombeo').toLowerCase();
  const skuId = String(params.skuId || params.smatCode || 'SMAT-PUMP-6X4-WETKIT').toUpperCase();
  const stockRegime = String(params.stockRegime || 'hay').toLowerCase();
  const estimatedMxn = Number(params.estimatedMxn ?? 18500);
  const isEs = params.lang !== 'en';

  const satTigieLine = formatSatTigieInvoiceLine({
    vertical: circuit === 'control_procesos' ? 'control' : circuit,
    skuId
  });
  const dualCheckout = formatDualCheckoutPayload({
    estimatedMxn,
    stockRegime
  });
  const passport = buildSmatVendorPassportPayload(params.companyMeta || {});

  const laneLabel = isEs
    ? dualCheckout.lane === 'CAJA_CHICA_CFDI40'
      ? 'Carril Ágil Caja Chica CFDI 4.0 (G03) / Orden de Compra'
      : 'Carril Institucional Orden de Compra SAP / Coupa / Oracle (G03 / I04)'
    : dualCheckout.lane === 'CAJA_CHICA_CFDI40'
      ? 'Fast-Track Petty Cash CFDI 4.0 (G03) / Purchase Order'
      : 'Institutional SAP / Coupa / Oracle Purchase Order Lane (G03 / I04)';

  return {
    satTigieLine,
    dualCheckout,
    passport,
    laneLabel,
    summaryText: `${satTigieLine} • ${laneLabel}`
  };
}

/**
 * Dispara la descarga en el navegador de un archivo `.json` o `.vcf` del Pasaporte de Proveedor
 * y copia un respaldo al portapapeles si está disponible (`D9-V39`).
 *
 * @param {'json'|'vcf'} kind
 * @param {any} [companyMeta={}]
 * @returns {{ filename: string, mimeType: string, content: string }}
 */
export function triggerVendorPassportDownload(kind = 'json', companyMeta = {}) {
  const isVcf = kind === 'vcf';
  const content = isVcf
    ? buildSmatVendorVcardString(companyMeta)
    : JSON.stringify(buildSmatVendorPassportPayload(companyMeta), null, 2);
  const filename = isVcf
    ? 'SMAT_Minerals_Proveedor_Oficial.vcf'
    : 'SMAT_Minerals_Vendor_Passport_SAP_ERP.json';
  const mimeType = isVcf
    ? 'text/vcard;charset=utf-8'
    : 'application/json;charset=utf-8';

  if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (_) {
      // Fallback silencioso en entornos sin DOM completo
    }
  }
  return { filename, mimeType, content };
}

/**
 * Enlaza los botones de descarga del Pasaporte ERP (`.json` y `.vcf`) en `LiveEngineeringDossier.astro`.
 *
 * @param {Document|HTMLElement} [rootDoc]
 */
export function bindVendorPassportDownloadButtons(rootDoc = typeof document !== 'undefined' ? document : null) {
  if (!rootDoc) return;
  const btnJson = rootDoc.querySelector('#btn-download-vendor-json');
  const btnVcf = rootDoc.querySelector('#btn-download-vendor-vcf');
  const statusEl = rootDoc.querySelector('#sap-vendor-passport-status');

  if (btnJson && btnJson.getAttribute('data-passport-bound') !== '1') {
    btnJson.setAttribute('data-passport-bound', '1');
    btnJson.addEventListener('click', () => {
      const res = triggerVendorPassportDownload('json');
      if (statusEl) {
        statusEl.textContent = `✓ ${res.filename} generado (CFDI 4.0 / Anexo 22 / SAP)`;
        statusEl.classList.remove('hidden');
      }
    });
  }

  if (btnVcf && btnVcf.getAttribute('data-passport-bound') !== '1') {
    btnVcf.setAttribute('data-passport-bound', '1');
    btnVcf.addEventListener('click', () => {
      const res = triggerVendorPassportDownload('vcf');
      if (statusEl) {
        statusEl.textContent = `✓ ${res.filename} descargado (RFC 6350 vCard 4.0)`;
        statusEl.classList.remove('hidden');
      }
    });
  }
}

/**
 * Inicializa y sincroniza todos los widgets interactivos `[data-core-tradein-widget]`
 * para el programa *SMAT Core Trade-In (-22%)* del Cartucho `DAM005` (`SMAT-PUMP-BRG-005M`)
 * en sus 4 superficies (`/productos/cartucho-rodamientos-005m/`, `/catalogo/dam005/`,
 * `/bombeo/soporte/` y `/cotizar/`) (`D6-V39`).
 *
 * @param {Document|HTMLElement} [rootDoc]
 * @param {(evalResult: any) => void} [onTradeInChange]
 */
export function initCoreTradeInWidgets(
  rootDoc = typeof document !== 'undefined' ? document : null,
  onTradeInChange = null
) {
  if (!rootDoc || typeof rootDoc.querySelectorAll !== 'function') return;

  const widgets = rootDoc.querySelectorAll('[data-core-tradein-widget]');
  widgets.forEach((widget) => {
    if (widget.getAttribute('data-tradein-bound') === '1') return;
    widget.setAttribute('data-tradein-bound', '1');

    const checkbox = widget.querySelector('[data-core-tradein-toggle]');
    const conditionSelect = widget.querySelector('[data-core-tradein-condition]');
    const statusBadge = widget.querySelector('[data-core-tradein-badge]');
    const detailNote = widget.querySelector('[data-core-tradein-note]');
    const addWithTradeInBtn = widget.querySelector('[data-core-tradein-add-btn]');
    const isEn = widget.getAttribute('data-lang') === 'en';

    const syncWidgetUi = (enabledOverride = null) => {
      const currentTray = getTrayState();
      const hasDam005InTray = currentTray.items.some(
        (it) =>
          String(it.id || '').includes('BRG-005M') ||
          String(it.atomicCode || '').toUpperCase() === 'DAM005'
      );
      const isChecked =
        enabledOverride !== null
          ? Boolean(enabledOverride)
          : checkbox instanceof HTMLInputElement
            ? checkbox.checked
            : Boolean(currentTray.coreReturnEnabled);
      const housingCondition =
        conditionSelect instanceof HTMLSelectElement
          ? conditionSelect.value
          : 'h7_intact';
      const conditionEligible = housingCondition !== 'cracked_housing';
      const effectiveEnabled = isChecked && conditionEligible;

      const simulatedTray = hasDam005InTray
        ? { ...currentTray, coreReturnEnabled: effectiveEnabled }
        : {
            ...currentTray,
            coreReturnEnabled: effectiveEnabled,
            items: [
              ...currentTray.items,
              {
                id: 'SMAT-PUMP-BRG-005M',
                skuId: 'SMAT-PUMP-BRG-005M',
                atomicCode: 'DAM005',
                nameEs: 'Cartucho de Rodamientos Completo 005M (DAM005)',
                qty: 1
              }
            ]
          };

      const evalResult = evaluateBearingCartridgeCoreTradeIn(simulatedTray, effectiveEnabled);

      if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = isChecked;
      }

      if (statusBadge) {
        if (!conditionEligible && isChecked) {
          statusBadge.textContent = isEn
            ? 'H7 Housing Required (No Cracks)'
            : 'Requiere Alojamiento H7 sin Fractura';
        } else if (evalResult.coreReturnEnabled) {
          statusBadge.textContent = isEn
            ? `Active: -${evalResult.discountPct}% Core Trade-In Credit (Factor ${evalResult.creditFactor}x)`
            : `Activo: -${evalResult.discountPct}% Crédito Core Trade-In (Factor ${evalResult.creditFactor}x)`;
        } else {
          statusBadge.textContent = isEn
            ? 'Available: -22% Core Exchange Credit (DAM005 H7)'
            : 'Disponible: -22% Crédito por Intercambio de Casco (DAM005 H7)';
        }
      }

      if (detailNote) {
        detailNote.textContent = !conditionEligible && isChecked
          ? isEn
            ? 'Fractured outer housings do not qualify for H7 remanufacturing core credit; direct new cartridge supply applies.'
            : 'Cascos con fractura estructural no califican para remanufactura H7; aplica suministro directo de cartucho nuevo.'
          : isEn
            ? evalResult.policyNoteEn
            : evalResult.policyNoteEs;
      }

      // Actualizar enlaces de WhatsApp o cotización en la misma vista
      const waLinks = document.querySelectorAll('[data-slug-wa-btn], [data-qcard-wa-btn], [data-core-tradein-wa-link]');
      waLinks.forEach((link) => {
        if (link instanceof HTMLAnchorElement && link.href.includes('wa.me/')) {
          try {
            const urlObj = new URL(link.href);
            const rawText = urlObj.searchParams.get('text') || '';
            const cleanText = rawText.replace(/\s*\|\s*Core Trade-In DAM005:\s*[^\]]+/gi, '');
            const tradeSuffix = evalResult.coreReturnEnabled
              ? isEn
                ? ' | Core Trade-In DAM005: -22% H7 Exchange Active'
                : ' | Core Trade-In DAM005: -22% Intercambio H7 Activo'
              : '';
            if (tradeSuffix && !cleanText.includes('Core Trade-In DAM005')) {
              urlObj.searchParams.set('text', `${cleanText}${tradeSuffix}`);
              link.href = urlObj.toString();
            } else if (!tradeSuffix) {
              urlObj.searchParams.set('text', cleanText);
              link.href = urlObj.toString();
            }
          } catch (_) {
            // Conservar enlace original si URL no es parseable
          }
        }
      });

      if (typeof onTradeInChange === 'function') {
        onTradeInChange(evalResult);
      }
      return evalResult;
    };

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        const isChecked = checkbox instanceof HTMLInputElement ? checkbox.checked : false;
        const currentTray = getTrayState();
        saveTrayState({ ...currentTray, coreReturnEnabled: isChecked });
        syncWidgetUi(isChecked);
      });
    }

    if (conditionSelect) {
      conditionSelect.addEventListener('change', () => {
        syncWidgetUi();
      });
    }

    if (addWithTradeInBtn) {
      addWithTradeInBtn.addEventListener('click', () => {
        if (checkbox instanceof HTMLInputElement) {
          checkbox.checked = true;
        }
        const updated = addTrayItem({
          id: 'SMAT-PUMP-BRG-005M',
          skuId: 'SMAT-PUMP-BRG-005M',
          atomicCode: 'DAM005',
          title: isEn
            ? 'Complete Bearing Cartridge Assembly 005M (Core Trade-In -22%)'
            : 'Cartucho de Rodamientos Completo 005M (Core Trade-In -22%)',
          material: 'SAE_4140_GGG40_LABYRINTH',
          regime: 'hay',
          massKg: 54.0,
          qty: 1
        });
        saveTrayState({ ...updated, coreReturnEnabled: true });
        syncWidgetUi(true);
      });
    }

    syncWidgetUi();
  });
}
