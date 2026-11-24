// @ts-check
/**
 * quoteDossierRenderer.js
 * ---------------------------------------------------------------------------
 * Renderizador declarativo puro del Dossier de Ingeniería en Vivo (Plano 2)
 * extraído en la costura ∂(C)=0 de quoteWizardController.js (D12-V35).
 */

export const DOSSIER_FORMATTERS_BY_FIELD = Object.freeze({
  durandFactorFL: (v) => (v !== undefined && v !== null ? Number(v).toFixed(2) : '1.08'),
  solidsVolumetricPercent: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(1)}%` : '23.3%'),
  recommendedPipeVelocityMs: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} m/s` : '3.02 m/s'),
  criticalSettlingVelocityMs: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} m/s` : '2.42 m/s'),
  actualPipeVelocityMs: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} m/s` : '3.15 m/s'),
  slurrySpecificGravity: (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} kg/L` : '1.40 kg/L'),
  pulpPh: (v) => (v !== undefined && v !== null ? `pH ${Number(v).toFixed(1)}` : 'pH 7.0'),
  sealBranch: (v) => (v === 'gland_water' ? 'Prensaestopa Húmedo (Est. 02B)' : 'Expulsor Seco (Est. 02A)'),
  impellerExitWidthMm: (v) => (v !== undefined && v !== null ? `${Number(v)} mm` : '48 mm'),
  dynamicCapacityCkN: (v) => (v !== undefined && v !== null ? `${Number(v)} kN` : '145 kN')
});

/**
 * Resuelve el encabezado y contexto del simulador del Dossier según el circuito activo
 * (incluyendo la región acoplada Bombeo + Clasificación D6-D20 / Mallas PU).
 *
 * @param {string} circuit
 * @param {boolean} isEs
 * @param {string} [roleId='']
 * @returns {{ headline: string, contextPill: string }}
 */
export function formatDossierSimulationBanner(circuit, isEs = true, roleId = '') {
  const rLower = String(roleId || '').toLowerCase();
  if (circuit === 'clasificacion' || rLower.includes('hidrociclon') || rLower.includes('malla_criba')) {
    return {
      headline: isEs
        ? 'Bombeo + Clasificación Acoplada (Durand-Condolios + Plitt d50c)'
        : 'Coupled Pumping + Classification (Durand-Condolios + Plitt d50c)',
      contextPill: isEs ? 'Bombeo + Ciclones • Plitt' : 'Pumping + Cyclones • Plitt'
    };
  }
  if (circuit === 'flotacion') {
    return {
      headline: isEs
        ? 'Cinética de celda y retención de volumen'
        : 'Cell Kinetics & Volume Retention',
      contextPill: isEs ? 'Flotación • Agitación' : 'Flotation • Kinetics'
    };
  }
  if (circuit === 'filtracion') {
    return {
      headline: isEs
        ? 'Deshidratación de torta y ciclo de filtrado'
        : 'Cake Dewatering & Filter Cycle',
      contextPill: isEs ? 'Filtración • 16 bar' : 'Filtration • 16 bar'
    };
  }
  if (circuit === 'control_procesos') {
    return {
      headline: isEs
        ? 'Control gravimétrico de pulpa y granulometría (Marcy / ASTM E11)'
        : 'Pulp Gravimetric Control & Particle Sizing (Marcy / ASTM E11)',
      contextPill: isEs ? 'Control • Laboratorio' : 'Control • Lab'
    };
  }
  return {
    headline: isEs
      ? 'Transporte hidráulico y velocidad crítica (Durand)'
      : 'Slurry Hydraulic Transport & Critical Velocity (Durand)',
    contextPill: isEs ? 'Bombeo • Durand' : 'Pumping • Durand'
  };
}

/**
 * Sintetiza una insignia legible para el estado metrológico de laboratorio o ciclones en el Dossier.
 *
 * @param {any} metrology
 * @param {boolean} isEs
 * @returns {string}
 */
export function formatDossierMetrologyBadge(metrology, isEs = true) {
  if (!metrology || typeof metrology !== 'object') return '';
  const parts = [];
  if (Number.isFinite(Number(metrology.cw || metrology.solidsPctCw))) {
    parts.push(`Cw ${Number(metrology.cw || metrology.solidsPctCw).toFixed(1)}%`);
  }
  if (Number.isFinite(Number(metrology.sm || metrology.pulpDensityKgL))) {
    parts.push(`ρp ${Number(metrology.sm || metrology.pulpDensityKgL).toFixed(2)} kg/L`);
  }
  if (Number.isFinite(Number(metrology.p80 || metrology.targetP80Microns))) {
    parts.push(`P80 ${Number(metrology.p80 || metrology.targetP80Microns).toFixed(0)} µm`);
  }
  if (metrology.cycloneCircuit && typeof metrology.cycloneCircuit === 'object') {
    const cyc = metrology.cycloneCircuit;
    if (Number.isFinite(Number(cyc.solidsRecoveryPct))) {
      parts.push(`Rs ${Number(cyc.solidsRecoveryPct).toFixed(1)}%`);
    }
    if (Number.isFinite(Number(cyc.d50cMicrons))) {
      parts.push(`d50c ${Number(cyc.d50cMicrons).toFixed(0)} µm`);
    }
  }
  if (parts.length === 0) {
    return String(metrology.summary || metrology.raw || '');
  }
  return (isEs ? 'Metrología: ' : 'Metrology: ') + parts.join(' • ');
}

export const DEFAULT_CLASSIFICATION_CRITERIA_MAP = Object.freeze({
  hidrociclon_apex_vortex: {
    rule_es: 'Ápex Monolítico SiC (≥2200 HV, Mohs 9.2) cuando Cv,u > 48% o ΔP ≥ 12 psi; Conos PU U01 (85 Shore A) con escalón interno δ_r ≤ 0.76 mm para suprimir roping.',
    rule_en: 'Monolithic SiC Apex (≥2200 HV, Mohs 9.2) when Cv,u > 48% or ΔP ≥ 12 psi; U01 PU Cone Liners (85 Shore A) with inter-cone step δ_r ≤ 0.76 mm to suppress roping.',
    risk_es: 'Previene colapso del núcleo de aire (acordonamiento Cv,u > 52%) y bypass de gruesos a flotación.',
    risk_en: 'Prevents air-core collapse (roping Cv,u > 52%) and coarse particle bypass to flotation.',
    vars_es: 'ρ_f (Alimentación), ρ_u (Descarga), ρ_o (Rebose), ΔP (kPa), du/do (mm)',
    vars_en: 'ρ_f (Feed SG), ρ_u (Underflow SG), ρ_o (Overflow SG), ΔP (kPa), du/do (mm)',
    series: 'D6, D10, D10B, D15, D20, D26',
    spec_es: '5 Zonas de Hidrociclón + Balance 3 Vasos Marcy',
    spec_en: '5-Zone Hydrocyclone + 3-Cup Marcy Balance'
  },
  malla_criba_poliuretano: {
    rule_es: 'Malla Tensada TH48-30 / Panel Modular 1\'x1\' (305×305 mm) en Poliuretano Colado 85 Shore A con alivio troncocónico θ = 3°–5° (Weibull α ≥ 4.2).',
    rule_en: 'Tensioned TH48-30 Screen / 1\'x1\' (305×305 mm) Modular Panel in Cast 85 Shore A Polyurethane with θ = 3°–5° conical relief (Weibull α ≥ 4.2).',
    risk_es: 'Erradica el cegamiento crónico por partículas críticas (near-size) y reduce paros por cambio de cama completa.',
    rule_vars: 'Abertura de corte (mm/µm), % Sólidos Cw, Carga circulante',
    vars_es: 'Abertura de corte (mm/µm), % Sólidos Cw, Carga circulante',
    vars_en: 'Slot aperture (mm/µm), Solids % Cw, Circulating load',
    series: 'TH48-30 (48"×30"), Módulo 1\'x1\' (305×305×30 mm)',
    spec_es: 'Avenida 3 • Cribado de Alta Frecuencia y Desaguado',
    spec_en: 'Avenue 3 • High-Frequency Screening & Dewatering'
  }
});

/**
 * Formatea la fila dinámica `#live-row-circuit-physics` del Dossier A4 según el circuito activo,
 * el desglose híbrido `Rama D` (`A05 + R55`) y la Ventana Preventiva de Reabastecimiento del Cliente (`D1-V39..D8-V39`).
 *
 * @param {string} circuit
 * @param {any} engCtx
 * @param {any} partSpecs
 * @param {boolean} isEs
 * @param {string} [matCodeVal='alto_cromo_cr27']
 * @returns {{ label: string, value: string }}
 */
export function formatDossierCircuitPhysicsRow(
  circuit = 'bombeo',
  engCtx = {},
  partSpecs = {},
  isEs = true,
  matCodeVal = 'alto_cromo_cr27'
) {
  const reorderWindow = partSpecs?.clientReorderWindowDays || 90;
  const reorderSuffix = isEs
    ? `Ciclo preventivo en mina: ${reorderWindow} días`
    : `Preventive plant cycle: ${reorderWindow} days`;

  if (circuit === 'flotacion' && engCtx?.flotation) {
    const f = engCtx.flotation;
    return {
      label: isEs ? 'Cinética Gorain / Zwietering:' : 'Gorain / Zwietering Kinetics:',
      value: `${isEs ? f.summaryEs : f.summaryEn} • ${reorderSuffix}`
    };
  }
  if (circuit === 'filtracion' && engCtx?.filtration) {
    const flt = engCtx.filtration;
    return {
      label: isEs ? 'Flexión Timoshenko / Darcy:' : 'Timoshenko / Darcy Cycle:',
      value: `${isEs ? flt.summaryEs : flt.summaryEn} • ${reorderSuffix}`
    };
  }
  if (circuit === 'clasificacion' && engCtx?.classification) {
    const c = engCtx.classification;
    return {
      label: isEs ? 'Balance 3 Vasos / Plitt:' : '3-Cup Balance / Plitt:',
      value: `${isEs ? c.summaryEs : c.summaryEn} • ${reorderSuffix}`
    };
  }
  if (matCodeVal === 'hybrid_a05_r55' && engCtx?.driveAndHybrid) {
    const dh = engCtx.driveAndHybrid;
    return {
      label: isEs ? 'Rama D Híbrida (A05+R55):' : 'Branch D Hybrid (A05+R55):',
      value: isEs
        ? `Ahorro en maniobra: -${dh.hybridSavedMassKg ?? 239.2} kg (-${dh.hybridMassSavingsPct ?? 31.8}% vs Full Metal) • Impulsor A05 + Forros R55 • ${reorderSuffix}`
        : `Rigging mass savings: -${dh.hybridSavedMassKg ?? 239.2} kg (-${dh.hybridMassSavingsPct ?? 31.8}% vs Full Metal) • A05 Impeller + R55 Liners • ${reorderSuffix}`
    };
  }
  return {
    label: isEs ? 'Planeación Preventiva y Bastidor:' : 'Preventive Cycle & Frame:',
    value: isEs
      ? `${engCtx?.driveAndHybrid?.bearingFrameCode || 'FRAME-D'} (${engCtx?.driveAndHybrid?.bearingCartridgeCode || 'DAM005'}) • ${reorderSuffix} • Despacho Programado Durango`
      : `${engCtx?.driveAndHybrid?.bearingFrameCode || 'FRAME-D'} (${engCtx?.driveAndHybrid?.bearingCartridgeCode || 'DAM005'}) • ${reorderSuffix} • Durango Scheduled Dispatch`
  };
}
