// @ts-check
/**
 * emptyRequisitionGate.js
 * ---------------------------------------------------------------------------
 * Máquina de estado pura `EMPTY_CART_GATE` (Decisión D10 / SLICE-V10-C23)
 * compartida por `/cotizar/`, `/acuse/` y sus espejos EN (`/en/quote/`, `/en/thank-you/`).
 * Impide mostrar folios sintéticos, badges `DESPACHO PRIORITARIO` o cabeceras
 * `[SMAT-DGO] [BORRADOR...]` cuando `items.length === 0`.
 */

/**
 * Determina si se deben suprimir folio, códigos hash y badges de despacho prioritario.
 * @param {{ items?: any[] } | null | undefined} [trayState={}]
 * @param {boolean} [hasUrlRequisition=false]
 * @returns {boolean}
 */
export function shouldSuppressEmptyFolio(trayState = {}, hasUrlRequisition = false) {
  if (hasUrlRequisition) return false;
  const items = Array.isArray(trayState?.items) ? trayState.items : [];
  return items.length === 0;
}

/**
 * Resuelve de forma determinista el estado visual de arranque sin partidas.
 * @param {{ items?: any[] } | null | undefined} [trayState={}]
 * @param {'es'|'en'|string} [lang='es']
 * @param {boolean} [hasUrlRequisition=false]
 */
export function resolveEmptyRequisitionViewState(trayState = {}, lang = 'es', hasUrlRequisition = false) {
  const isEn = String(lang || 'es').toLowerCase() === 'en';
  const isEmpty = shouldSuppressEmptyFolio(trayState, hasUrlRequisition);

  return {
    isEmpty,
    showDossierTabs: !isEmpty,
    showDossierBody: !isEmpty,
    showHeaderThumb: !isEmpty,
    showCmuStrip: !isEmpty,
    allowNextStep: !isEmpty,
    emptyFolioLabel: '',
    emptyStatusLabel: isEmpty
      ? (isEn ? "You haven't generated a requisition yet" : 'Aún no has generado una requisición')
      : '',
    headline: isEmpty
      ? (isEn ? 'Build your spare parts list in seconds' : 'Arma tu lista de refacciones en segundos')
      : (isEn ? 'Requisition Ready for Dispatch' : 'Requisición Lista para Despacho'),
    bodyText: isEmpty
      ? (isEn
          ? 'Add items with real warehouse photography from the catalog, pick a top-selling SKU below, or import your Excel/SAP list.'
          : 'Agrega productos con fotografía real desde el catálogo, elige uno de los más solicitados abajo o importa tu lista Excel/SAP.')
      : '',
    ctaCatalogLabel: isEn ? 'Browse catalog with photos →' : 'Explorar catálogo con fotos →',
    ctaCatalogHref: isEn ? '/en/catalog/' : '/catalogo/',
    ctaQuoteLabel: isEn ? 'Open B2B Quote Wizard →' : 'Abrir cotizador B2B →',
    ctaQuoteHref: isEn ? '/en/quote/#rfq' : '/cotizar/#rfq',
    ctaImportLabel: isEn ? 'Import Excel / SAP List' : 'Importar lista Excel / SAP',
  };
}
