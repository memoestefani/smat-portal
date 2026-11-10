/**
 * workbenchExportFormatters.js
 * ---------------------------------------------------------------------------
 * Costura Modular LCOM4 (∂(C) = 0, D8 / SLICE-FC-12) para Formateadores B2B
 * de Doble Carril (< $25,000 MXN Caja Chica CFDI 4.0 vs > $25,000 MXN OC SAP/Oracle)
 * y Tuplas Fiscales SAT / TIGIE.
 */

export const SAT_TIGIE_BY_VERTICAL = Object.freeze({
  bombeo: {
    claveProdServ: '40142000',
    claveUnidad: 'H87',
    fraccionArancelaria: '8413.91.99.00',
    unspsc: '40151500'
  },
  clasificacion: {
    claveProdServ: '40161500',
    claveUnidad: 'H87',
    fraccionArancelaria: '8474.90.99.00',
    unspsc: '20121500'
  },
  flotacion: {
    claveProdServ: '40142000',
    claveUnidad: 'KT',
    fraccionArancelaria: '8474.90.99.00',
    unspsc: '20121500'
  },
  valvulas: {
    claveProdServ: '40141600',
    claveUnidad: 'H87',
    fraccionArancelaria: '8481.80.99.00',
    unspsc: '40141600'
  },
  filtracion: {
    claveProdServ: '40161500',
    claveUnidad: 'H87',
    fraccionArancelaria: '8421.99.99.00',
    unspsc: '40161500'
  },
  control: {
    claveProdServ: '41111500',
    claveUnidad: 'H87',
    fraccionArancelaria: '9016.00.99.00',
    unspsc: '41111500'
  }
});

/**
 * Devuelve la línea fiscal SAT CFDI 4.0 + Fracción TIGIE para una partida B2B.
 */
export function formatSatTigieInvoiceLine(item = {}) {
  const vertical = String(item.vertical || item.circuit || 'bombeo').toLowerCase();
  const tuple = SAT_TIGIE_BY_VERTICAL[vertical] || SAT_TIGIE_BY_VERTICAL.bombeo;
  const skuId = String(item.skuId || item.id || 'SKU-QC-01').toUpperCase();
  return `${skuId} | SAT ProdServ: ${tuple.claveProdServ} | Unidad: ${tuple.claveUnidad} | TIGIE: ${tuple.fraccionArancelaria} | UNSPSC: ${tuple.unspsc}`;
}

/**
 * Construye el payload estructurado de Doble Carril de Compra (PRD v3.0 §6.2).
 */
export function formatDualCheckoutPayload(params = {}) {
  const estimatedMxn = Math.max(0, Number(params.estimatedMxn ?? 18500));
  const stockRegime = String(params.stockRegime || 'hay').toLowerCase();
  const isPettyCash = estimatedMxn <= 25000 && stockRegime === 'hay';

  return {
    lane: isPettyCash ? 'CAJA_CHICA_CFDI40' : 'ORDEN_COMPRA_SAP',
    estimatedMxn,
    stockRegime,
    requiresAdvancePct: stockRegime === 'se_fabrica' ? 50 : stockRegime === 'se_pide' ? 30 : 0,
    cfdiVersion: '4.0',
    hubLocation: 'Durango, DGO, MX (C.P. 34080)'
  };
}
