// @ts-check
/**
 * domainMaterialSpecResolver.js
 * ---------------------------------------------------------------------------
 * Resolvedor Zero-DOM de especificación y dureza material por dominio, SKU y aleación.
 * Erradica la contaminación de dureza de hierro blanco (≥ 650 HB) sobre circuitos
 * poliméricos o elastoméricos (Flotación PU, Filtración PP, Cribas y Laboratorio).
 */

/**
 * @param {string} [raw='']
 * @returns {'hybrid_a05_r55'|'hule_natural'|'poliuretano'|'ceramica_sic'|'alto_cromo_cr27'|'polipropileno'|'acero_inox'}
 */
function normalizeMaterialToken(raw = '') {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'alto_cromo_cr27';
  if (s.includes('hybrid') || s.includes('hibrid') || s.includes('a05+r55') || s.includes('a05_r55')) {
    return 'hybrid_a05_r55';
  }
  if (s === 'sic' || s.includes('ceram') || s.includes('carburo') || s.includes('silicon')) {
    return 'ceramica_sic';
  }
  if (s === 'r55' || s.includes('hule') || s.includes('rubber') || s.includes('caucho')) {
    return 'hule_natural';
  }
  if (s === 'u01' || s === 'pu' || s.includes('poliuretano') || s.includes('urethane')) {
    return 'poliuretano';
  }
  if (s.includes('pp') || s.includes('polipropileno') || s.includes('polypropylene') || s.includes('lona') || s.includes('cloth')) {
    return 'polipropileno';
  }
  if (s.includes('304') || s.includes('inox') || s.includes('brass') || s.includes('laton')) {
    return 'acero_inox';
  }
  return 'alto_cromo_cr27';
}

/**
 * Resuelve la insignia de material y dureza mecánica real del dominio activo.
 *
 * @param {{
 *   circuit?: string,
 *   skuId?: string,
 *   materialCode?: string,
 *   impellerMaterialCode?: string,
 *   linerMaterialCode?: string,
 *   isEmpty?: boolean,
 *   locale?: 'es' | 'en'
 * }} [input={}]
 * @returns {{
 *   domainCategory: string,
 *   badge: string,
 *   hardnessSpec: string,
 *   impellerMaterialCode: string,
 *   linerMaterialCode: string
 * }}
 */
export function resolveDomainMaterialSpec(input = {}) {
  const isEs = String(input.locale || 'es').toLowerCase() !== 'en';
  if (input.isEmpty) {
    return {
      domainCategory: 'draft',
      badge: isEs ? 'Borrador • Sin partidas seleccionadas' : 'Draft • No active items',
      hardnessSpec: isEs ? 'Por especificar (Borrador)' : 'Pending part selection (Draft)',
      impellerMaterialCode: '',
      linerMaterialCode: '',
    };
  }

  const circuitRaw = String(input.circuit || '').trim().toLowerCase();
  const sku = String(input.skuId || '').trim().toUpperCase();
  const matRaw = String(input.materialCode || '').trim();

  const isFlotation = circuitRaw === 'flotacion' || circuitRaw === 'flotation' || sku.startsWith('SMAT-FLOT-');
  const isFiltration = circuitRaw === 'filtracion' || circuitRaw === 'filtration' || sku.startsWith('SMAT-FILT-');
  const isClassification =
    circuitRaw === 'clasificacion' ||
    circuitRaw === 'classification' ||
    sku.startsWith('SMAT-CYC-') ||
    sku.includes('SCREEN');
  const isMetrology =
    circuitRaw === 'control_procesos' ||
    circuitRaw === 'process_control' ||
    circuitRaw === 'metrology' ||
    sku.startsWith('SMAT-LAB-') ||
    sku.startsWith('SMAT-SIEVE-');

  if (isFlotation) {
    return {
      domainCategory: 'flotacion',
      badge: isEs ? 'Poliuretano Shore A 85–95 / Hule R55' : 'Mining PU Shore A 85–95 / R55',
      hardnessSpec: isEs ? 'Shore A 85–95 (Elastómero de Celda)' : '85–95 Shore A (Cell Elastomer)',
      impellerMaterialCode: 'U01',
      linerMaterialCode: 'R55',
    };
  }

  if (isFiltration) {
    return {
      domainCategory: 'filtracion',
      badge: isEs ? 'Polipropileno Virgen 16 bar + Lona Calandrada' : 'Virgin PP 16 bar + Calendered Cloth',
      hardnessSpec: isEs ? 'PP Copolímero 16 bar (NOM-141)' : 'Virgin PP 16 bar (NOM-141)',
      impellerMaterialCode: 'PP-16BAR',
      linerMaterialCode: 'CAL-CLOTH',
    };
  }

  if (isClassification) {
    const useSiC = sku.includes('APEX') || sku.includes('CYC') || normalizeMaterialToken(matRaw) === 'ceramica_sic';
    return {
      domainCategory: 'clasificacion',
      badge: isEs ? 'SiC Sinterizado / Poliuretano TH48-30' : 'Sintered SiC / TH48-30 Polyurethane',
      hardnessSpec: useSiC
        ? (isEs ? '≥ 2200 HV / Mohs 9.2 (SiC) • PU 85 Shore A' : '≥ 2200 HV / Mohs 9.2 (SiC) • 85 Shore A PU')
        : (isEs ? '85–90 Shore A (Poliuretano TH48-30)' : '85–90 Shore A (TH48-30 Polyurethane)'),
      impellerMaterialCode: useSiC ? 'SiC' : 'U01',
      linerMaterialCode: 'U01',
    };
  }

  if (isMetrology) {
    return {
      domainCategory: 'control_procesos',
      badge: isEs ? 'Acero Inoxidable 304 / Latón Certificado ASTM E11' : '304 Stainless / ASTM E11 Certified Brass',
      hardnessSpec: isEs ? 'Inox 304 / Latón Calibrado ASTM E11' : '304 Stainless / Calibrated ASTM E11',
      impellerMaterialCode: 'SS304',
      linerMaterialCode: 'ASTM-E11',
    };
  }

  const mat = normalizeMaterialToken(matRaw);
  if (mat === 'hybrid_a05_r55') {
    const impCode = String(input.impellerMaterialCode || 'A05');
    const linCode = String(input.linerMaterialCode || 'R55');
    return {
      domainCategory: 'bombeo_hybrid',
      badge: isEs
        ? `Rama D Híbrida: Impulsor ${impCode} + Forros ${linCode}`
        : `Hybrid Branch D: ${impCode} Impeller + ${linCode} Liners`,
      hardnessSpec: isEs
        ? `≥ 650 HB (${impCode}) + 55–65 Shore A (${linCode})`
        : `≥ 650 HB (${impCode}) + 55–65 Shore A (${linCode})`,
      impellerMaterialCode: impCode,
      linerMaterialCode: linCode,
    };
  }

  if (mat === 'hule_natural') {
    return {
      domainCategory: 'bombeo_elastomer',
      badge: isEs ? 'Hule Natural Antiabrasivo R55' : 'Natural Anti-Abrasion Rubber R55',
      hardnessSpec: isEs ? '55–65 Shore A (Resiliencia R55)' : '55–65 Shore A (R55 Resilience)',
      impellerMaterialCode: 'R55',
      linerMaterialCode: 'R55',
    };
  }

  if (mat === 'poliuretano') {
    return {
      domainCategory: 'bombeo_pu',
      badge: isEs ? 'Poliuretano Grado Minero U01' : 'Mining Polyurethane U01',
      hardnessSpec: isEs ? '85–95 Shore A (Elastómero U01)' : '85–95 Shore A (U01 Elastomer)',
      impellerMaterialCode: 'U01',
      linerMaterialCode: 'U01',
    };
  }

  if (mat === 'ceramica_sic') {
    return {
      domainCategory: 'bombeo_ceramic',
      badge: isEs ? 'Carburo de Silicio Sinterizado SiC' : 'Sintered Silicon Carbide SiC',
      hardnessSpec: isEs ? '≥ 2200 HV / Mohs 9.2 (K_Ic = 4.1 MPa·√m)' : '≥ 2200 HV / Mohs 9.2 (K_Ic = 4.1 MPa·√m)',
      impellerMaterialCode: 'SiC',
      linerMaterialCode: 'SiC',
    };
  }

  return {
    domainCategory: 'bombeo_cr27',
    badge: isEs ? 'Alto Cromo ASTM A532 Cr27% (A05)' : '27% High Chrome ASTM A532 (A05)',
    hardnessSpec: isEs ? '≥ 650 HB (Brinell) / 58–62 HRC' : '≥ 650 HB (Brinell) / 58–62 HRC',
    impellerMaterialCode: 'A05',
    linerMaterialCode: 'A05',
  };
}
