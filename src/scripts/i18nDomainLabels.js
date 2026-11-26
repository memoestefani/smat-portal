// @ts-check
/**
 * i18nDomainLabels.js
 * ---------------------------------------------------------------------------
 * Diccionario Bilingüe Único ES/EN orientado a ingeniería operativa (`SLICE-V51-28`, `D8-V51`, `SLICE-V56-14`).
 * Desacopla títulos primarios de interfaz (legibilidad INFLESZ >= 55.0 sin epónimos académicos)
 * preservando atribución científica rigurosa en `methodologyNote` para notas y tooltips.
 */

const DOMAIN_LABELS_I18N = Object.freeze({
  pumping: {
    es: {
      title: 'Selección Hidráulica de Bombeo',
      velocityMetric: 'Velocidad Crítica Mínima (Transporte)',
      actualVelocity: 'Velocidad Real en Tubería',
      safetyMargin: 'Margen Contra Embancamiento',
      methodologyNote: 'Correlación Durand-Condolios de velocidad límite de depósito y corrección de altitud.'
    },
    en: {
      title: 'Hydraulic Slurry Pumping Sizing',
      velocityMetric: 'Minimum Critical Velocity (Transport)',
      actualVelocity: 'Actual Pipe Velocity',
      safetyMargin: 'Sanding Safety Margin',
      methodologyNote: 'Durand-Condolios limit deposit velocity model with barometric altitude derating.'
    }
  },
  tribology: {
    es: {
      title: 'Metalurgia en Contacto Húmedo y Desgaste',
      alloyLabel: 'Material Recomendado en Servicio',
      tipSpeedLabel: 'Velocidad Periférica del Impulsor',
      methodologyNote: 'Selección tribológica ASTM A532 III-A / Elastómero / SiC y par de montaje.'
    },
    en: {
      title: 'Wet-End Metallurgy & Wear Selection',
      alloyLabel: 'Recommended Wet-End Material',
      tipSpeedLabel: 'Impeller Peripheral Tip Speed',
      methodologyNote: 'Tribological matching (ASTM A532 III-A / Elastomer / SiC) and shaft assembly torque.'
    }
  },
  cyclone: {
    es: {
      title: 'Clasificación en Hidrociclón y Cribado',
      cutSizeLabel: 'Corte de Partícula (d50c)',
      balanceLabel: 'Balance por 3 Densidades de Pulpa',
      methodologyNote: 'Partición empírica Plitt d50c, corrección 3 vasos Marcy y distribución Weibull en uretano.'
    },
    en: {
      title: 'Hydrocyclone Classification & Screening',
      cutSizeLabel: 'Cut Point Particle Size (d50c)',
      balanceLabel: 'Three-Stream Pulp Density Balance',
      methodologyNote: 'Plitt cut-size estimation, 3-cup Marcy mass balance, and Weibull screen efficiency.'
    }
  },
  flotation: {
    es: {
      title: 'Mecanismos de Flotación y Aireación',
      fluxLabel: 'Velocidad Superficial de Aire (Jg)',
      recoveryLabel: 'Recuperación Cinética Estimada',
      methodologyNote: 'Cinética de dispersión aire-pulpa y tiempo de residencia para celdas mecánicas 50–300 ft³.'
    },
    en: {
      title: 'Flotation Cell Aeration & Recovery',
      fluxLabel: 'Superficial Gas Velocity (Jg)',
      recoveryLabel: 'Estimated Kinetic Recovery',
      methodologyNote: 'Air-slurry dispersion kinetics and residence time across 50–300 ft³ cell banks.'
    }
  },
  filtration: {
    es: {
      title: 'Desaguado y Filtración de Concentrados / Jales',
      complianceLabel: 'Cumplimiento Apilamiento en Seco',
      deflectionLabel: 'Rigidez Estructural de Viga',
      methodologyNote: 'Ciclo de desaguado de torta, verificación estructural de viga (16 bar) y norma NOM-141-SEMARNAT.'
    },
    en: {
      title: 'Concentrate & Tailings Filter Press Dewatering',
      complianceLabel: 'Dry-Stack Structural Compliance',
      deflectionLabel: 'Sidebar Structural Deflection',
      methodologyNote: 'Filter cake dewatering cycle, sidebar structural deflection check (16 bar), and dry-stack stability.'
    }
  },
  metrology: {
    es: {
      title: 'Control de Pulpa, Muestreo y Tamizado',
      sampleMassLabel: 'Masa Mínima Representativa de Muestra',
      sieveLabel: 'Serie Estándar ASTM E11 / Corte P80',
      methodologyNote: 'Tablas Marcy (1000 cm³), ecuación de muestreo de Pierre Gy y distribución Rosin-Rammler.'
    },
    en: {
      title: 'Pulp Control, Sampling & Sieve Analysis',
      sampleMassLabel: 'Minimum Representative Sample Mass',
      sieveLabel: 'ASTM E11 Standard Stack / P80 Size',
      methodologyNote: 'Marcy 1000 cm³ density rings, Pierre Gy sampling invariance, and Rosin-Rammler fit.'
    }
  },
  sealDrive: {
    es: {
      title: 'Sellado Centrífugo Seco, Transmisión y Rodamientos',
      bearingLifeLabel: 'Vida Útil Estimada de Rodamientos',
      clearanceLabel: 'Claro Axial de Ajuste (Ref. Tarjeta 0.76 mm)',
      methodologyNote: 'Presión dinámica de expulsor, bandas en V e índice L10mh ISO 281 + ergonómica NIOSH.'
    },
    en: {
      title: 'Dry Expeller Seal, Belt Drive & Bearing Life',
      bearingLifeLabel: 'Estimated Bearing Service Life',
      clearanceLabel: 'Axial Clearance Setting (0.76 mm Gauge)',
      methodologyNote: 'Expeller head sealing balance, V-belt kinematics, ISO 281 L10mh & NIOSH rigging check.'
    }
  },
  jrp: {
    es: {
      title: 'Planeación Preventiva de Repuestos por Campaña',
      windowLabel: 'Ventana Recomendada de Reorden',
      methodologyNote: 'Reemplazo acoplado armónico (T0/2, T0, 2T0), prioridad de paro c*mu y programa Core Trade-In.'
    },
    en: {
      title: 'Preventive Campaign Spares Planning',
      windowLabel: 'Recommended Preventive Reorder Window',
      methodologyNote: 'Coupled JRP campaign policy (T0/2, T0, 2T0), c*mu urgency priority & Core Trade-In credit.'
    }
  },
  catalogFacet: {
    es: {
      title: 'Catálogo Unificado de Equipos y Refacciones',
      integrityLabel: 'Trazabilidad Piezas <-> SKUs',
      methodologyNote: 'Cobertura bidireccional verificada entre BOM atómica, 19 SKUs canónicos y diagramas técnicos.'
    },
    en: {
      title: 'Unified Process Equipment & Spares Catalog',
      integrityLabel: 'Parts <-> SKU Traceability',
      methodologyNote: 'Verified bidirectional mapping across atomic BOM parts, 19 SKUs, and CAD schematics.'
    }
  }
});

/**
 * Obtiene etiqueta operativa traducida y nota metodológica secundaria sin epónimos en títulos primarios.
 * @param {string} domain
 * @param {string} key
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function getDomainLabel(domain, key, lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const bucket = DOMAIN_LABELS_I18N[domain] || DOMAIN_LABELS_I18N.pumping;
  const localeMap = isEn ? bucket.en : bucket.es;
  return String(localeMap?.[key] ?? DOMAIN_LABELS_I18N.pumping[isEn ? 'en' : 'es'][key] ?? key);
}

/**
 * Construye el mapa de criterios metalúrgicos y riesgo evitado por rol desde roles.json (`SLICE-V51-28`).
 * @param {object} rolesData
 * @returns {Record<string, object>}
 */
export function buildRolesCriteriaMap(rolesData) {
  const criteriaMap = {};
  for (const vertical of rolesData?.verticals || []) {
    for (const role of [...(vertical.capex || []), ...(vertical.opex || [])]) {
      if (role?.decision_criteria) {
        criteriaMap[role.role_id] = {
          rule_es: role.decision_criteria.metallurgy_rule_es,
          rule_en: role.decision_criteria.metallurgy_rule_en,
          risk_es: role.decision_criteria.risk_avoided_es,
          risk_en: role.decision_criteria.risk_avoided_en,
          vars_es: role.decision_criteria.required_slurry_vars_es || '',
          vars_en: role.decision_criteria.required_slurry_vars_en || '',
          series: role.series || '',
          spec_es: role.spec_summary_es || '',
          spec_en: role.spec_summary_en || '',
        };
      }
    }
  }
  return criteriaMap;
}

/**
 * Formatea un rango numérico `[min, max]` conforme a ISO 80000-1 sin concatenar arreglos.
 * @param {number[]|string} range
 * @param {string} [unit='']
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatNumericRange(range, unit = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const nfLocale = isEn ? 'en-US' : 'es-MX';
  const suffix = unit ? ` ${unit}` : '';
  if (Array.isArray(range) && range.length >= 2) {
    const a = Number(range[0]);
    const b = Number(range[1]);
    const fa = Number.isFinite(a) ? a.toLocaleString(nfLocale) : String(range[0]);
    const fb = Number.isFinite(b) ? b.toLocaleString(nfLocale) : String(range[1]);
    return `${fa}–${fb}${suffix}`;
  }
  return `${String(range ?? '—')}${suffix}`;
}

const HUMAN_MATERIAL_LABELS = Object.freeze({
  alto_cromo_cr27: { es: 'Alto Cromo Cr27 (≥650 HB)', en: '27% High Chrome (≥650 HB)' },
  alto_cromo_a49: { es: 'Alto Cromo Cr28 A49', en: '28% High Chrome A49' },
  hule_natural: { es: 'Hule Natural R55 (55–65 Shore A)', en: 'Natural Rubber R55 (55–65 Shore A)' },
  hule_natural_r55: { es: 'Hule Natural R55 (55–65 Shore A)', en: 'Natural Rubber R55 (55–65 Shore A)' },
  poliuretano: { es: 'Poliuretano Minero U01 (85–95 Shore A)', en: 'Mining Polyurethane U01 (85–95 Shore A)' },
  poliuretano_u01: { es: 'Poliuretano Minero U01 (85–95 Shore A)', en: 'Mining Polyurethane U01 (85–95 Shore A)' },
  ceramica_sic: { es: 'Carburo de Silicio Sinterizado SiC', en: 'Sintered Silicon Carbide SiC' },
  hybrid_a05_r55: { es: 'Híbrido Impulsor A05 + Forros R55', en: 'Hybrid A05 Impeller + R55 Liners' },
  hibrido_a05_r55: { es: 'Híbrido Impulsor A05 + Forros R55', en: 'Hybrid A05 Impeller + R55 Liners' },
});

/**
 * Traduce una clave técnica de aleación o configuración híbrida a etiqueta humana.
 * @param {string} rawKey
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatMaterialKeyHuman(rawKey = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const k = String(rawKey || '').trim().toLowerCase();
  const entry = HUMAN_MATERIAL_LABELS[k];
  if (entry) return isEn ? entry.en : entry.es;
  return String(rawKey || '').replace(/_/g, ' ').trim();
}

const HUMAN_CYCLONE_REGIME_LABELS = Object.freeze({
  SEMI_UMBRELLA_OPTIMAL: { es: 'Descarga Spray Nominal (Aire Estable)', en: 'Nominal Spray Discharge (Stable Core)' },
  SEMI_UMBRELLA: { es: 'Descarga Spray Nominal (Aire Estable)', en: 'Nominal Spray Discharge (Stable Core)' },
  ROPING_CORDON: { es: 'Alerta Acordonamiento (Roping en Ápex)', en: 'Roping Alert (Apex Volumetric Choking)' },
  UMBRELLA_SPRAY: { es: 'Abanico Diluido (Ápex Desgastado)', en: 'Dilute Umbrella Spray (Worn Apex)' },
});

/**
 * Traduce códigos de régimen hidrociclónico a etiqueta legible en ES/EN.
 * @param {string} rawRegime
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatCycloneRegimeHuman(rawRegime = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const k = String(rawRegime || '').trim().toUpperCase();
  const entry = HUMAN_CYCLONE_REGIME_LABELS[k];
  if (entry) return isEn ? entry.en : entry.es;
  return String(rawRegime || '').replace(/_/g, ' ').trim();
}

const HUMAN_CHECKOUT_LANE_LABELS = Object.freeze({
  CAJA_CHICA_CFDI40: { es: 'Compra Directa (CFDI 4.0)', en: 'Direct Purchase (CFDI 4.0)' },
  ORDEN_COMPRA_SAP: { es: 'Orden de Compra ERP/SAP', en: 'ERP/SAP Purchase Order' },
});

/**
 * Traduce el carril de pago/facturación interno a texto claro de usuario.
 * @param {string} rawLane
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatCheckoutLaneHuman(rawLane = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const k = String(rawLane || '').trim().toUpperCase();
  const entry = HUMAN_CHECKOUT_LANE_LABELS[k];
  if (entry) return isEn ? entry.en : entry.es;
  return isEn ? 'Standard Procurement Order' : 'Orden de Suministro Estándar';
}

const HUMAN_URGENCY_BAND_LABELS = Object.freeze({
  IMMEDIATE_PICK: { es: 'Surtido Inmediato en Almacén', en: 'Immediate Warehouse Dispatch' },
  PARO_DE_LINEA: { es: 'Prioridad Alta (Paro de Planta)', en: 'High Priority (Plant Shutdown)' },
  PARO_PROTEGIDO: { es: 'Paro Protegido en Planta', en: 'Protected Plant Uptime' },
  'P1-PARO-PLANTA': { es: 'Prioridad Alta (Paro de Planta)', en: 'High Priority (Plant Shutdown)' },
  'P1-CAJA-CHICA-HAY': { es: 'Compra Directa en Existencia (≤ 30 min)', en: 'In-Stock Direct Purchase (≤ 30 min)' },
  'P2-REPOSICION-LOTE': { es: 'Reposición Programada (≤ 60 min)', en: 'Scheduled Replenishment (≤ 60 min)' },
  'P3-PROYECTO-50%-ANTICIPO': { es: 'Fabricación Bajo Plano (50% Anticipo)', en: 'Custom Fabrication (50% Advance)' },
  STOCK_SS: { es: 'Stock Preventivo de Almacén', en: 'Preventive Warehouse Stock' },
  HOIST_REQUIRED: { es: 'Requiere Polipasto / Grúa (≥ 23 kg)', en: 'Hoist / Crane Mandatory (≥ 23 kg)' },
  ASSISTED_SHAFT_MOUNT_2P: { es: 'Montaje Asistido 2 Operadores', en: '2-Operator Assisted Shaft Mount' },
  MANUAL_SAFE: { es: 'Carga Manual Segura (1 Operador)', en: 'Safe Manual Handling (1 Operator)' },
  MANUAL_1P_SAFE: { es: 'Carga Manual Segura (1 Operador)', en: 'Safe Manual Handling (1 Operator)' },
});

/**
 * Traduce códigos de prioridad o surtido logístico sin exponer fórmulas internas (cμ=).
 * @param {string} rawUrgency
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatUrgencyBandHuman(rawUrgency = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const k = String(rawUrgency || '').trim().toUpperCase();
  const entry = HUMAN_URGENCY_BAND_LABELS[k];
  if (entry) return isEn ? entry.en : entry.es;
  return String(rawUrgency || '').replace(/_/g, ' ').trim();
}

const HUMAN_CATALOG_PART_LABELS = Object.freeze({
  FILTRO_BATCH_LAB: { es: 'Filtro de Presión Batch (Lab)', en: 'Batch Pressure Filter (Lab)' },
  BALANZA_MARCY: { es: 'Balanza de Densidad Marcy', en: 'Marcy Pulp Density Scale' },
  TAMICES_ASTM: { es: 'Juego de Tamices ASTM E11', en: 'ASTM E11 Test Sieve Stack' },
});

/**
 * Traduce claves internas de rol/instrumento en etiquetas limpias para el catálogo.
 * @param {string} rawCode
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatCatalogPartCodeHuman(rawCode = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const k = String(rawCode || '').trim().toUpperCase();
  const entry = HUMAN_CATALOG_PART_LABELS[k];
  if (entry) return isEn ? entry.en : entry.es;
  return String(rawCode || '').replace(/_/g, ' ').trim();
}

/**
 * Taxonomía comercial limpia de las líneas operativas (sin etiquetas internas de puertas).
 */
export const SMAT_SUPPLY_DOORS = Object.freeze({
  door1: Object.freeze({
    id: 'door1',
    hrefEs: '/catalogo/',
    hrefEn: '/en/catalog/',
    badgeEs: 'Equipos de Proceso y Refacciones',
    badgeEn: 'Process Equipment & Spares',
    labelEs: 'Catálogo Maestro (Equipos y Refacciones)',
    labelEn: 'Master Catalog (Equipment & Spares)',
  }),
  door2: Object.freeze({
    id: 'door2',
    hrefEs: '/bombeo/',
    hrefEn: '/en/pumping/',
    badgeEs: 'Bombas para Lodos y Lotes 5-5-4',
    badgeEn: 'Slurry Pumps & 5-5-4 Wear Lots',
    labelEs: 'Bombas para Lodos y Refacciones',
    labelEn: 'Slurry Pumps & Spare Parts',
  }),
  door3: Object.freeze({
    id: 'door3',
    hrefEs: '/control-de-procesos/',
    hrefEn: '/en/process-control/',
    badgeEs: 'Control de Procesos y Laboratorio',
    badgeEn: 'Process Control & Laboratory',
    labelEs: 'Control de Procesos y Laboratorio',
    labelEn: 'Process Control & Laboratory',
  }),
  classificationSubEs: 'Clasificación • Hidrociclones D6–D20 y Cribas',
  classificationSubEn: 'Classification • D6–D20 Hydrocyclones & Screens',
});

const HUMAN_DISCHARGE_REGIME_LABELS = Object.freeze({
  ROPING_CORDON: { es: 'Alerta de Acordonamiento (Roping en Ápex)', en: 'Roping Alert (Apex Volumetric Choking)' },
  UMBRELLA_DILUTE: { es: 'Descarga Diluida en Paraguas', en: 'Dilute Umbrella Spray Discharge' },
  SEMI_UMBRELLA: { es: 'Ángulo Semi-Paraguas Estable', en: 'Stable Semi-Umbrella Cone' },
  SPRAY_NORMAL: { es: 'Descarga Normal en Cono Abierto', en: 'Normal Open-Cone Spray' },
});

/**
 * Formatea el régimen de descarga de hidrociclón sin exponer tokens internos.
 * @param {string} [rawRegime='']
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatDischargeRegimeHuman(rawRegime = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const k = String(rawRegime || '').trim().toUpperCase();
  const entry = HUMAN_DISCHARGE_REGIME_LABELS[k];
  if (entry) return isEn ? entry.en : entry.es;
  return String(rawRegime || '').replace(/_/g, ' ').trim();
}

const HUMAN_LOGISTICS_DESTINATIONS = Object.freeze({
  warehouse_durango_pickup: {
    es: 'Retiro en Almacén Central Durango (Coordinación con Folio)',
    en: 'Durango Central Warehouse Pickup (Scheduled by Folio)',
  },
  retiro_durango: {
    es: 'Retiro en Almacén Central Durango (Coordinación con Folio)',
    en: 'Durango Central Warehouse Pickup (Scheduled by Folio)',
  },
  mine_site_freight: {
    es: 'Entrega DAP en Unidad Minera (Coordinación Logística)',
    en: 'DAP Mine Site Delivery (Logistics Coordination)',
  },
  flete_mina: {
    es: 'Entrega DAP en Unidad Minera (Coordinación Logística)',
    en: 'DAP Mine Site Delivery (Logistics Coordination)',
  },
});

/**
 * Traduce la clave o cadena legada de destino logístico sin fugar español hacia rutas `/en/`.
 * @param {string} [rawDestination='']
 * @param {'es'|'en'} [lang='es']
 * @returns {string}
 */
export function formatLogisticsDestinationHuman(rawDestination = '', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const raw = String(rawDestination || '').trim();
  const low = raw.toLowerCase();
  if (
    !raw ||
    low === 'warehouse_durango_pickup' ||
    low === 'retiro_durango' ||
    low.includes('retiro en almacén central durango') ||
    low.includes('durango central warehouse pickup')
  ) {
    return isEn ? HUMAN_LOGISTICS_DESTINATIONS.warehouse_durango_pickup.en : HUMAN_LOGISTICS_DESTINATIONS.warehouse_durango_pickup.es;
  }
  if (low === 'mine_site_freight' || low === 'flete_mina' || low.includes('dap unidad minera') || low.includes('dap mine site')) {
    return isEn ? HUMAN_LOGISTICS_DESTINATIONS.mine_site_freight.en : HUMAN_LOGISTICS_DESTINATIONS.mine_site_freight.es;
  }
  return raw;
}

const UNICODE_UNIT_MAP = Object.freeze({
  's^-1': 's⁻¹',
  'min^-1': 'min⁻¹',
  'm3/h': 'm³/h',
  'm3/d': 'm³/d',
  'um': 'µm',
  'd50c': 'd₅₀c',
  'd80': 'd₈₀',
  'u2': 'u₂',
});

/**
 * Formatea una magnitud física con unidad tipográfica Unicode normalizada (cero `s^-1` / `min^-1` ASCII).
 * @param {number|string} value
 * @param {string} [unit='']
 * @param {number} [decimals]
 * @returns {string}
 */
export function formatScientificUnit(value, unit = '', decimals = undefined) {
  const cleanUnit = UNICODE_UNIT_MAP[String(unit || '').trim()] || String(unit || '')
    .replace(/s\^-1/g, 's⁻¹')
    .replace(/min\^-1/g, 'min⁻¹')
    .replace(/m3\/h/g, 'm³/h')
    .trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    const formatted = typeof decimals === 'number' ? value.toFixed(decimals) : String(value);
    return cleanUnit ? `${formatted} ${cleanUnit}` : formatted;
  }
  const str = String(value ?? '').trim();
  if (!str) return cleanUnit || '—';
  return cleanUnit ? `${str} ${cleanUnit}` : str;
}

/**
 * Traduce el régimen de inventario en etiqueta comercial legible (cero tokens crudos o precios literales).
 * @param {string} [stockRegime='hay']
 * @param {'es'|'en'} [lang='es']
 * @returns {{ label: string; tone: 'hay' | 'pide' | 'fabrica' | 'proyecto'; leadTime: string }}
 */
export function formatAvailabilityBadgeHuman(stockRegime = 'hay', lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const key = String(stockRegime || 'hay').trim().toLowerCase();
  if (key === 'bajo_proyecto' || key === 'proyecto') {
    return {
      label: isEn ? 'Project Order · Durango' : 'Bajo proyecto · Durango',
      tone: 'proyecto',
      leadTime: isEn ? 'Engineered quote via Durango' : 'Ingeniería y suministro bajo proyecto',
    };
  }
  if (key === 'se_pide') {
    return {
      label: isEn ? 'Fast Assembly · 5–10 Days' : 'Ensamble rápido · 5–10 días',
      tone: 'pide',
      leadTime: isEn ? '5–10 business days' : '5–10 días hábiles',
    };
  }
  if (key === 'se_fabrica') {
    return {
      label: isEn ? 'Made to Order' : 'Fabricación bajo plano',
      tone: 'fabrica',
      leadTime: isEn ? 'Scheduled under drawing' : 'Programación bajo plano',
    };
  }
  return {
    label: isEn ? 'Available · Durango' : 'Disponible · Durango',
    tone: 'hay',
    leadTime: isEn ? 'Direct dispatch from Durango' : 'Despacho directo desde Durango',
  };
}
