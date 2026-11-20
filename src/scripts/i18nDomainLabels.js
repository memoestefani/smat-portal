/**
 * i18nDomainLabels.js
 * ---------------------------------------------------------------------------
 * Diccionario Bilingüe Único ES/EN orientado a ingeniería operativa (`SLICE-V51-28`, `D8-V51`).
 * Desacopla títulos primarios de interfaz (legibilidad INFLESZ >= 55.0 sin epónimos académicos)
 * preservando atribución científica rigurosa en `methodologyNote` para notas y tooltips.
 */

export const DOMAIN_LABELS_I18N = Object.freeze({
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
