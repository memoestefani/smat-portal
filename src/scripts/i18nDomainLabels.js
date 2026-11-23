/**
 * i18nDomainLabels.js
 * ---------------------------------------------------------------------------
 * Diccionario Bilingüe Único ES/EN orientado a ingeniería operativa (`SLICE-V51-28`, `D8-V51`).
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
      methodologyNote: 'Cinética Gorain Sb-Jg y tiempo de residencia para celdas mecánicas 50–300 ft³.'
    },
    en: {
      title: 'Flotation Cell Aeration & Recovery',
      fluxLabel: 'Superficial Gas Velocity (Jg)',
      recoveryLabel: 'Estimated Kinetic Recovery',
      methodologyNote: 'Gorain Sb-Jg flotation rate model across 50–300 ft³ cell banks.'
    }
  },
  filtration: {
    es: {
      title: 'Desaguado y Filtración de Concentrados / Jales',
      complianceLabel: 'Cumplimiento Apilamiento en Seco',
      deflectionLabel: 'Rigidez Estructural de Viga',
      methodologyNote: 'Criterio Darcy de torta comprimida, flexión Timoshenko (16 bar) y norma NOM-141-SEMARNAT.'
    },
    en: {
      title: 'Concentrate & Tailings Filter Press Dewatering',
      complianceLabel: 'Dry-Stack Structural Compliance',
      deflectionLabel: 'Sidebar Structural Deflection',
      methodologyNote: 'Darcy cake dewatering cycle, Timoshenko beam check (16 bar), and dry-stack stability.'
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
  'P1-PARO-PLANTA': { es: 'Prioridad Alta (Paro de Planta)', en: 'High Priority (Plant Shutdown)' },
  'P1-CAJA-CHICA-HAY': { es: 'Compra Directa en Existencia (≤ 30 min)', en: 'In-Stock Direct Purchase (≤ 30 min)' },
  'P2-REPOSICION-LOTE': { es: 'Reposición Programada (≤ 60 min)', en: 'Scheduled Replenishment (≤ 60 min)' },
  'P3-PROYECTO-50%-ANTICIPO': { es: 'Fabricación Bajo Plano (50% Anticipo)', en: 'Custom Fabrication (50% Advance)' },
  STOCK_SS: { es: 'Stock Preventivo de Almacén', en: 'Preventive Warehouse Stock' },
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
 * Fuente Única de Verdad (SSOT) para la taxonomía de las 3 Puertas de Don Manuel (D2-V53C).
 */
export const SMAT_SUPPLY_DOORS = Object.freeze({
  door1: Object.freeze({
    id: 'door1',
    hrefEs: '/equipos/',
    hrefEn: '/en/process-equipment/',
    badgeEs: 'Puerta 1 • Equipos de Proceso',
    badgeEn: 'Door 1 • Process Equipment',
    labelEs: 'Puerta 1: Equipos de Proceso',
    labelEn: 'Door 1: Process Equipment',
  }),
  door2: Object.freeze({
    id: 'door2',
    hrefEs: '/bombeo/',
    hrefEn: '/en/pumping/',
    badgeEs: 'Puerta 2 • Bombas para Lodos y Spare Parts',
    badgeEn: 'Door 2 • Slurry Pumps & Spare Parts',
    labelEs: 'Puerta 2: Bombas para Lodos y Spare Parts',
    labelEn: 'Door 2: Slurry Pumps & Spare Parts',
  }),
  door3: Object.freeze({
    id: 'door3',
    hrefEs: '/control-de-procesos/',
    hrefEn: '/en/process-control/',
    badgeEs: 'Puerta 3 • Control de Procesos y Laboratorio',
    badgeEn: 'Door 3 • Process Control & Laboratory',
    labelEs: 'Puerta 3: Control de Procesos y Laboratorio',
    labelEn: 'Door 3: Process Control & Laboratory',
  }),
  classificationSubEs: 'Sub-circuito • Puerta 1 · Clasificación e Hidrociclones',
  classificationSubEn: 'Sub-circuit • Door 1 · Classification & Hydrocyclones',
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
