// @ts-nocheck
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
  if (parts.length === 0) {
    return String(metrology.summary || metrology.raw || '');
  }
  return (isEs ? 'Metrología: ' : 'Metrology: ') + parts.join(' • ');
}
