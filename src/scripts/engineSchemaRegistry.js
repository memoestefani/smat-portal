/**
 * engineSchemaRegistry.js
 * ---------------------------------------------------------------------------
 * Fuente Única de Verdad Estática EngineSchema <-> DOM en Partición de Dos Sorts
 * (Sigma_Markup perp Sigma_Script, Leroy POPL 2009 / Cardelli 1988 / [ARB-SMAT-58]).
 *
 * REGLAS INVARIANTES (D1-V50 / D5-V50 / D6-V50):
 * 1. Prohibido emitir HTML, <script> o inyección de marcado DOM dentro de este registro.
 * 2. Cada dominio declara sus entradas (inputsSchema con rankeo Sobol Tier 1/2),
 *    salidas proyectables (outputsSchema con pureza escalar ISO 80000-1) y anclas DOM reales.
 * 3. Trazabilidad cerrada Pre-RS/Post-RS hacia docs/CONCEPT-REGISTRY.md (cero conceptos huérfanos).
 */

export const TWO_SORT_PARTITION_VERSION = '5.0.0';

/**
 * @typedef {Object} SchemaFieldBinding
 * @property {string} field
 * @property {'number'|'string'|'boolean'|'enum'} type
 * @property {number|null} [min]
 * @property {number|null} [max]
 * @property {string|number|boolean|null} defaultValue
 * @property {1|2} sobolTier
 * @property {number} sobolSensitivityScore
 * @property {string} domBinding
 * @property {string[]} [aliasBindings]
 */

/**
 * @typedef {Object} SchemaOutputBinding
 * @property {string} field
 * @property {string} unit
 * @property {boolean} isoPure
 * @property {string} domBinding
 * @property {string[]} [aliasBindings]
 */

/**
 * @typedef {Object} EngineDomainSchema
 * @property {string} id
 * @property {string} islandComponent
 * @property {string[]} conceptRefs
 * @property {string[]} arbitrageRefs
 * @property {string[]} routes
 * @property {SchemaFieldBinding[]} inputsSchema
 * @property {SchemaOutputBinding[]} outputsSchema
 * @property {string[]} allowUnboundReasons
 */

/** @type {Record<string, EngineDomainSchema>} */
export const ENGINE_SCHEMA_REGISTRY = Object.freeze({
  pumping: {
    id: 'pumping',
    islandComponent: 'PumpingHubIsland.astro',
    conceptRefs: ['circuits', 'role_id', 'intent', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-17', 'ARB-SMAT-22', 'ARB-SMAT-58'],
    routes: ['/bombeo/', '/en/pumping/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'flowM3H', type: 'number', min: 10, max: 3000, defaultValue: 150, sobolTier: 1, sobolSensitivityScore: 0.42, domBinding: '#slider-flow' },
      { field: 'solidsWeightPercent', type: 'number', min: 5, max: 75, defaultValue: 45, sobolTier: 1, sobolSensitivityScore: 0.24, domBinding: '#slider-solids' },
      { field: 'particleSizeD80Microns', type: 'number', min: 20, max: 2000, defaultValue: 180, sobolTier: 1, sobolSensitivityScore: 0.16, domBinding: '#slider-d80' },
      { field: 'solidsSpecificGravity', type: 'number', min: 1.5, max: 5.5, defaultValue: 2.7, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-solids-sg' },
      { field: 'pipeSeries', type: 'enum', defaultValue: '6x4', sobolTier: 1, sobolSensitivityScore: 0.31, domBinding: '#wb-pipe-size' },
      { field: 'altitudeM', type: 'number', min: 0, max: 5000, defaultValue: 0, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#wb-altitude-input', aliasBindings: ['[data-wb-altitude-btn]'] },
      { field: 'pH', type: 'number', min: 1.0, max: 14.0, defaultValue: 7.5, sobolTier: 2, sobolSensitivityScore: 0.05, domBinding: '#slider-ph' },
      { field: 'stressSymptom', type: 'string', defaultValue: '', sobolTier: 2, sobolSensitivityScore: 0.04, domBinding: '#wb-symptom-select' },
      { field: 'tempC', type: 'number', min: 0, max: 140, defaultValue: 35, sobolTier: 2, sobolSensitivityScore: 0.03, domBinding: '#wb-temp-c' },
      { field: 'strictBlindCheck', type: 'boolean', defaultValue: false, sobolTier: 2, sobolSensitivityScore: 0.02, domBinding: '#wb-strict-blind-check' }
    ],
    outputsSchema: [
      { field: 'slurrySpecificGravity', unit: 'SG', isoPure: true, domBinding: '#metric-sm' },
      { field: 'criticalVelocityMs', unit: 'm/s', isoPure: true, domBinding: '#metric-vc' },
      { field: 'actualPipeVelocityMs', unit: 'm/s', isoPure: true, domBinding: '#metric-vact' },
      { field: 'durandFactorFL', unit: '-', isoPure: true, domBinding: '#metric-durand-fl' },
      { field: 'solidsVolumetricPercent', unit: '%', isoPure: true, domBinding: '#metric-cv' },
      { field: 'recommendedPipeVelocityMs', unit: 'm/s', isoPure: true, domBinding: '#metric-v-rec' },
      { field: 'headDeratingFactorHr', unit: '-', isoPure: true, domBinding: '#metric-hr' },
      { field: 'effDeratingFactorEr', unit: '-', isoPure: true, domBinding: '#metric-er' },
      { field: 'estimatedImpellerLifeHours', unit: 'h', isoPure: true, domBinding: '#metric-wear-hours' },
      { field: 'wearLifeRatio', unit: 'x', isoPure: true, domBinding: '#metric-wear-ratio' },
      { field: 'pAtmHeadMca', unit: 'mca', isoPure: true, domBinding: '#metric-patm' },
      { field: 'deltaNpshLossM', unit: 'm', isoPure: true, domBinding: '#metric-delta-npsh' },
      { field: 'motorDeratingFactor', unit: '-', isoPure: true, domBinding: '#metric-iec-derating' },
      { field: 'combinedMotorAltitudeMultiplier', unit: 'x', isoPure: true, domBinding: '#metric-k-motor-alt' },
      { field: 'motorSizingPenaltyPct', unit: '%', isoPure: true, domBinding: '#metric-motor-penalty-pct' },
      { field: 'activeTrustBoundaryId', unit: 'id', isoPure: false, domBinding: '#trust-boundary-alert' }
    ],
    allowUnboundReasons: []
  },

  tribology: {
    id: 'tribology',
    islandComponent: 'TribologyAlloyIsland.astro',
    conceptRefs: ['metallurgy', 'hybrid_a05_r55', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-16', 'ARB-SMAT-44', 'ARB-SMAT-58'],
    routes: ['/bombeo/impulsor/', '/en/pumping/impeller/', '/bombeo/revestimientos/', '/en/pumping/liners/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'tribologyMaterial', type: 'enum', defaultValue: 'alto_cromo_cr27', sobolTier: 1, sobolSensitivityScore: 0.48, domBinding: '#trib-mat-select', aliasBindings: ['#wb-pump-material'] },
      { field: 'frontClearanceMm', type: 'number', min: 0.2, max: 6.0, defaultValue: 0.75, sobolTier: 1, sobolSensitivityScore: 0.27, domBinding: '#trib-clearance-mm', aliasBindings: ['#wb-clearance-slider'] },
      { field: 'particleSizeD80Microns', type: 'number', min: 10, max: 5000, defaultValue: 240, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#trib-d80-um', aliasBindings: ['#slider-d80'] },
      { field: 'pulpPh', type: 'number', min: 1.0, max: 14.0, defaultValue: 7.5, sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#trib-ph', aliasBindings: ['#slider-ph'] },
      { field: 'tipSpeedMs', type: 'number', min: 5, max: 42, defaultValue: 21.5, sobolTier: 1, sobolSensitivityScore: 0.29, domBinding: '#trib-u2-ms' },
      { field: 'solidsWeightPercent', type: 'number', min: 5, max: 80, defaultValue: 45, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#slider-solids' },
      { field: 'pipeSeries', type: 'enum', defaultValue: '6x4', sobolTier: 2, sobolSensitivityScore: 0.06, domBinding: '#wb-pipe-size' },
      { field: 'assemblySequence', type: 'enum', defaultValue: 'canonical', sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-assembly-sequence' }
    ],
    outputsSchema: [
      { field: 'recommendedMaterial', unit: 'code', isoPure: false, domBinding: '#trib-mat-out' },
      { field: 'hybridRecommended', unit: 'bool', isoPure: false, domBinding: '#wb-hybrid-verdict' },
      { field: 'hybridMassSavingsPct', unit: '%', isoPure: true, domBinding: '#wb-hybrid-mass-savings' },
      { field: 'activeSeries', unit: 'in', isoPure: true, domBinding: '#wb-asm-active-series' },
      { field: 'activeWeightKg', unit: 'kg', isoPure: true, domBinding: '#wb-asm-active-weight' },
      { field: 'activeNioshHoistRequired', unit: 'bool', isoPure: false, domBinding: '#wb-asm-active-hoist' },
      { field: 'activeMaterialCode', unit: 'code', isoPure: false, domBinding: '#wb-asm-active-material' },
      { field: 'volumetricLossPct', unit: '%', isoPure: true, domBinding: '#trib-vol-loss-out' },
      { field: 'pipeVelocityMarginLossPct', unit: '%', isoPure: true, domBinding: '#trib-pipe-loss-out' },
      { field: 'statusMessage', unit: 'text', isoPure: false, domBinding: '#trib-status-out' }
    ],
    allowUnboundReasons: []
  },

  sealDrive: {
    id: 'sealDrive',
    islandComponent: 'SealDriveBearingIsland.astro',
    conceptRefs: ['atomic_parts_13', 'role_id', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-14', 'ARB-SMAT-15', 'ARB-SMAT-56'],
    routes: ['/bombeo/sello/', '/en/pumping/seal/', '/bombeo/skid/', '/en/pumping/skid/', '/bombeo/soporte/', '/en/pumping/bearing-assembly/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'dischargeHeadM', type: 'number', min: 5, max: 110, defaultValue: 28, sobolTier: 1, sobolSensitivityScore: 0.34, domBinding: '#seal-hd-m' },
      { field: 'suctionHeadM', type: 'number', min: 0, max: 25, defaultValue: 3.2, sobolTier: 1, sobolSensitivityScore: 0.39, domBinding: '#seal-hs-m' },
      { field: 'expellerDiaMm', type: 'number', min: 140, max: 520, defaultValue: 280, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#seal-exp-dia' },
      { field: 'pumpRpm', type: 'number', min: 400, max: 2200, defaultValue: 1150, sobolTier: 1, sobolSensitivityScore: 0.25, domBinding: '#seal-rpm' },
      { field: 'slurrySg', type: 'number', min: 1.0, max: 2.3, defaultValue: 1.38, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#seal-sg' },
      { field: 'arrangementCode', type: 'enum', defaultValue: 'CV', sobolTier: 1, sobolSensitivityScore: 0.22, domBinding: '#wb-drive-arrangement', aliasBindings: ['[data-kin-arrangement]'] },
      { field: 'motorRpm', type: 'number', min: 500, max: 3600, defaultValue: 1775, sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-motor-rpm', aliasBindings: ['[data-kin-motor-rpm]'] },
      { field: 'driverPulleyMm', type: 'number', min: 80, max: 800, defaultValue: 220, sobolTier: 2, sobolSensitivityScore: 0.15, domBinding: '#wb-driver-pulley', aliasBindings: ['[data-kin-driver-mm]'] },
      { field: 'drivenPulleyMm', type: 'number', min: 100, max: 1200, defaultValue: 340, sobolTier: 2, sobolSensitivityScore: 0.15, domBinding: '#wb-driven-pulley', aliasBindings: ['[data-kin-driven-mm]'] },
      { field: 'motorPowerKw', type: 'number', min: 5, max: 1200, defaultValue: 55, sobolTier: 1, sobolSensitivityScore: 0.37, domBinding: '#wb-shaft-power', aliasBindings: ['[data-kin-power-kw]', '[data-bear-power-kw]'] }
    ],
    outputsSchema: [
      { field: 'expellerCounterPressureKpa', unit: 'kPa', isoPure: true, domBinding: '#seal-pexp-out' },
      { field: 'stuffingBoxResidualKpa', unit: 'kPa', isoPure: true, domBinding: '#seal-pbox-out' },
      { field: 'requiredGlandWaterPressureKpa', unit: 'kPa', isoPure: true, domBinding: '#seal-pwater-out' },
      { field: 'recommendedStationCode', unit: 'code', isoPure: false, domBinding: '#seal-branch-out' },
      { field: 'pumpRpm', unit: 'RPM', isoPure: true, domBinding: '#wb-kin-pump-rpm', aliasBindings: ['[data-kin-pump-rpm]'] },
      { field: 'tipSpeedMs', unit: 'm/s', isoPure: true, domBinding: '#wb-kin-u2', aliasBindings: ['[data-kin-u2]'] },
      { field: 'beltRadialLoadKn', unit: 'kN', isoPure: true, domBinding: '#wb-kin-fr', aliasBindings: ['[data-kin-fr]', '[data-bear-fr]'] },
      { field: 'bearingL10Hours', unit: 'h', isoPure: true, domBinding: '#wb-kin-l10h', aliasBindings: ['[data-kin-l10h]', '[data-bear-l10h]'] },
      { field: 'l10mhLabyrinthHours', unit: 'h', isoPure: true, domBinding: '#wb-bear-l10mh-lab', aliasBindings: ['[data-bear-l10mh-lab]'] },
      { field: 'l10mhContaminatedHours', unit: 'h', isoPure: true, domBinding: '#wb-bear-l10mh-contam', aliasBindings: ['[data-bear-l10mh-contam]'] }
    ],
    allowUnboundReasons: []
  },

  flotation: {
    id: 'flotation',
    islandComponent: 'FlotationCalculatorIsland.astro',
    conceptRefs: ['circuits', 'decision_criteria', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-28', 'ARB-SMAT-30', 'ARB-SMAT-58'],
    routes: ['/flotacion/', '/en/flotation/', '/flotacion/celdas/', '/en/flotation/cells/', '/flotacion/mecanismos/', '/en/flotation/mechanisms/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'jgCmS', type: 'number', min: 0.5, max: 3.5, defaultValue: 1.5, sobolTier: 1, sobolSensitivityScore: 0.41, domBinding: '#wb-flot-jg', aliasBindings: ['#celdas-jg-input'] },
      { field: 'd32Mm', type: 'number', min: 0.8, max: 3.0, defaultValue: 1.6, sobolTier: 1, sobolSensitivityScore: 0.36, domBinding: '#wb-flot-d32', aliasBindings: ['#celdas-d32-input'] },
      { field: 'rotorDiaM', type: 'number', min: 0.25, max: 1.5, defaultValue: 0.61, sobolTier: 1, sobolSensitivityScore: 0.19, domBinding: '#wb-flot-dia', aliasBindings: ['#celdas-dia-select'] },
      { field: 'rotorRpm', type: 'number', min: 100, max: 450, defaultValue: 215, sobolTier: 1, sobolSensitivityScore: 0.18, domBinding: '#wb-flot-rpm', aliasBindings: ['#celdas-rpm-input'] },
      { field: 'floatabilityP', type: 'number', min: 0.0001, max: 0.02, defaultValue: 0.0045, sobolTier: 2, sobolSensitivityScore: 0.22, domBinding: '#wb-flot-p', aliasBindings: ['#celdas-p-input'] },
      { field: 'frothRecoveryRf', type: 'number', min: 0.2, max: 1.0, defaultValue: 0.78, sobolTier: 2, sobolSensitivityScore: 0.17, domBinding: '#wb-flot-rf', aliasBindings: ['#celdas-rf-input'] },
      { field: 'd80Microns', type: 'number', min: 15, max: 600, defaultValue: 110, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-flot-d80', aliasBindings: ['#celdas-d80-input'] },
      { field: 'solidsWeightPercent', type: 'number', min: 10, max: 65, defaultValue: 35, sobolTier: 2, sobolSensitivityScore: 0.07, domBinding: '#wb-flot-cw', aliasBindings: ['#celdas-cw-input'] }
    ],
    outputsSchema: [
      { field: 'sbInverseSeconds', unit: 's^-1', isoPure: true, domBinding: '#wb-flot-res-sb', aliasBindings: ['#celdas-sb-output'] },
      { field: 'rateConstantMin', unit: 'min^-1', isoPure: true, domBinding: '#wb-flot-res-k', aliasBindings: ['#celdas-k-output'] },
      { field: 'tipSpeedMS', unit: 'm/s', isoPure: true, domBinding: '#wb-flot-res-vtip', aliasBindings: ['#celdas-vtip-output'] },
      { field: 'zwieteringNjsRpm', unit: 'RPM', isoPure: true, domBinding: '#wb-flot-res-njs', aliasBindings: ['#celdas-njs-output'] },
      { field: 'floatabilityP', unit: '-', isoPure: true, domBinding: '#wb-flot-res-p' },
      { field: 'frothRecoveryRf', unit: '-', isoPure: true, domBinding: '#wb-flot-res-rf' },
      { field: 'recommendedSkuId', unit: 'sku', isoPure: false, domBinding: '#wb-flot-res-sku' }
    ],
    allowUnboundReasons: []
  },

  filtration: {
    id: 'filtration',
    islandComponent: 'FiltrationCalculatorIsland.astro',
    conceptRefs: ['circuits', 'decision_criteria', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-26', 'ARB-SMAT-51', 'ARB-SMAT-58'],
    routes: ['/filtracion/', '/en/filtration/', '/filtracion/prensa/', '/en/filtration/press/', '/filtracion/repuestos/', '/en/filtration/parts/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'plateWidthMm', type: 'number', min: 630, max: 2000, defaultValue: 1200, sobolTier: 1, sobolSensitivityScore: 0.34, domBinding: '#wb-filt-width', aliasBindings: ['#filt-plate-width'] },
      { field: 'feedPressureBar', type: 'number', min: 4, max: 25, defaultValue: 12, sobolTier: 1, sobolSensitivityScore: 0.28, domBinding: '#wb-filt-pressure', aliasBindings: ['#filt-pressure-bar'] },
      { field: 'cloggedPortsCount', type: 'number', min: 0, max: 4, defaultValue: 0, sobolTier: 1, sobolSensitivityScore: 0.31, domBinding: '#wb-filt-clogged', aliasBindings: ['#filt-clogged-ports'] },
      { field: 'plateThicknessMm', type: 'number', min: 40, max: 120, defaultValue: 65, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-filt-thickness', aliasBindings: ['#filt-plate-thickness'] },
      { field: 'cakeMoistureTargetPct', type: 'number', min: 8, max: 28, defaultValue: 14, sobolTier: 1, sobolSensitivityScore: 0.22, domBinding: '#wb-filt-moisture', aliasBindings: ['#filt-cake-moisture'] }
    ],
    outputsSchema: [
      { field: 'maxBendingStressMpa', unit: 'MPa', isoPure: true, domBinding: '#wb-filt-res-stress', aliasBindings: ['#filt-res-stress'] },
      { field: 'flexuralSafetyFactor', unit: 'FS', isoPure: true, domBinding: '#wb-filt-res-fs', aliasBindings: ['#filt-res-fs'] },
      { field: 'cyclesPerDay', unit: 'c/d', isoPure: true, domBinding: '#wb-filt-res-cycles', aliasBindings: ['#filt-res-secondary'] },
      { field: 'dryTonnesPerDay', unit: 't/d', isoPure: true, domBinding: '#wb-filt-res-tpd', aliasBindings: ['#filt-res-summary'] },
      { field: 'nom141Compliant', unit: 'bool', isoPure: false, domBinding: '#wb-filt-res-nom141' }
    ],
    allowUnboundReasons: []
  },

  cycloneScreen: {
    id: 'cycloneScreen',
    islandComponent: 'CycloneScreenIsland.astro',
    conceptRefs: ['circuits', 'decision_criteria', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-26', 'ARB-SMAT-30', 'ARB-SMAT-58'],
    routes: ['/clasificacion/', '/en/classification/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'feedSg', type: 'number', min: 1.02, max: 3.5, defaultValue: 1.35, sobolTier: 1, sobolSensitivityScore: 0.26, domBinding: '#wb-cyc-sg-feed' },
      { field: 'underflowSg', type: 'number', min: 1.15, max: 4.5, defaultValue: 1.82, sobolTier: 1, sobolSensitivityScore: 0.34, domBinding: '#wb-cyc-sg-uf' },
      { field: 'overflowSg', type: 'number', min: 1.01, max: 2.5, defaultValue: 1.15, sobolTier: 1, sobolSensitivityScore: 0.19, domBinding: '#wb-cyc-sg-of' },
      { field: 'solidsSg', type: 'number', min: 1.8, max: 5.5, defaultValue: 2.7, sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-cyc-solids-sg' },
      { field: 'apexDiameterMm', type: 'number', min: 12, max: 250, defaultValue: 50, sobolTier: 1, sobolSensitivityScore: 0.24, domBinding: '#wb-cyc-apex-mm' },
      { field: 'vortexDiameterMm', type: 'number', min: 25, max: 400, defaultValue: 100, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#wb-cyc-vortex-mm' },
      { field: 'feedPressureKpa', type: 'number', min: 20, max: 350, defaultValue: 95, sobolTier: 1, sobolSensitivityScore: 0.18, domBinding: '#wb-cyc-pressure-kpa' },
      { field: 'cycloneDiameterMm', type: 'number', min: 100, max: 1000, defaultValue: 380, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-cyc-series' },
      { field: 'apertureMm', type: 'number', min: 0.15, max: 25.0, defaultValue: 0.5, sobolTier: 1, sobolSensitivityScore: 0.29, domBinding: '#wb-scr-aperture-mm' },
      { field: 'reliefAngleDeg', type: 'number', min: 1.5, max: 8.0, defaultValue: 4.0, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#wb-scr-relief-deg' },
      { field: 'vibrationG', type: 'number', min: 2.0, max: 7.0, defaultValue: 4.5, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-scr-vibration-g' },
      { field: 'sharpnessAlpha', type: 'number', min: 2.5, max: 8.0, defaultValue: 4.4, sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#wb-scr-alpha' }
    ],
    outputsSchema: [
      { field: 'circulatingLoadPct', unit: '%', isoPure: true, domBinding: '#wb-cyc-res-cc' },
      { field: 'd50cMicrons', unit: 'um', isoPure: true, domBinding: '#wb-cyc-res-d50' },
      { field: 'cvUnderflow', unit: 'frac', isoPure: true, domBinding: '#wb-cyc-res-cvu' },
      { field: 'apexToVortexRatio', unit: '-', isoPure: true, domBinding: '#wb-cyc-res-dudo' },
      { field: 'dischargeRegime', unit: 'state', isoPure: false, domBinding: '#wb-cyc-res-roping' },
      { field: 'partitionToOversizePct', unit: '%', isoPure: true, domBinding: '#wb-scr-res-oversize' },
      { field: 'elasticDilationPct', unit: '%', isoPure: true, domBinding: '#wb-scr-res-dilation' },
      { field: 'sharpnessAlpha', unit: '-', isoPure: true, domBinding: '#wb-scr-res-weibull' }
    ],
    allowUnboundReasons: []
  },

  metrology: {
    id: 'metrology',
    islandComponent: 'ProcessControlIsland.astro',
    conceptRefs: ['atomic_parts_13', 'decision_criteria', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-11', 'ARB-SMAT-51', 'ARB-SMAT-58'],
    routes: ['/control-de-procesos/', '/en/process-control/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'marcyRingId', type: 'enum', defaultValue: '2.7', sobolTier: 1, sobolSensitivityScore: 0.25, domBinding: '#wb-ctrl-ring' },
      { field: 'marcyMode', type: 'enum', defaultValue: 'cw_pct', sobolTier: 1, sobolSensitivityScore: 0.22, domBinding: '#wb-ctrl-marcy-mode' },
      { field: 'measuredSpGr', type: 'number', min: 1.0, max: 4.5, defaultValue: 1.45, sobolTier: 1, sobolSensitivityScore: 0.44, domBinding: '#wb-ctrl-density' },
      { field: 'solidsSpecificGravity', type: 'number', min: 1.8, max: 5.5, defaultValue: 2.7, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#wb-ctrl-ss' },
      { field: 'topSizeMm', type: 'number', min: 0.05, max: 150, defaultValue: 12.7, sobolTier: 1, sobolSensitivityScore: 0.31, domBinding: '#wb-ctrl-topsize' },
      { field: 'liberationFactorBeta', type: 'number', min: 0.1, max: 2.0, defaultValue: 0.5, sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-ctrl-gy-beta' },
      { field: 'mineralogicalFactorM', type: 'number', min: 0.5, max: 50.0, defaultValue: 20.0, sobolTier: 2, sobolSensitivityScore: 0.13, domBinding: '#wb-ctrl-gy-m' },
      { field: 'estimatedMassRetainedGrams', type: 'number', min: 1, max: 5000, defaultValue: 180, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-ctrl-mass-retained' },
      { field: 'targetP80Microns', type: 'number', min: 20, max: 5000, defaultValue: 150, sobolTier: 1, sobolSensitivityScore: 0.28, domBinding: '#wb-ctrl-p80' }
    ],
    outputsSchema: [
      { field: 'marcyDensityKgL', unit: 'kg/L', isoPure: true, domBinding: '#wb-ctrl-res-sm' },
      { field: 'cwPct', unit: '%', isoPure: true, domBinding: '#wb-ctrl-res-cw' },
      { field: 'minimumSampleMassKg', unit: 'kg', isoPure: true, domBinding: '#wb-ctrl-res-gy' },
      { field: 'sieveNumber', unit: 'mesh', isoPure: false, domBinding: '#wb-ctrl-res-sieve' },
      { field: 'drySampleMassGrams', unit: 'g', isoPure: true, domBinding: '#wb-ctrl-res-drysample' },
      { field: 'hoistRequired', unit: 'bool', isoPure: false, domBinding: '#wb-ctrl-res-hoist' },
      { field: 'twoPersonAssistRequired', unit: 'bool', isoPure: false, domBinding: '#wb-ctrl-res-two-person' },
      { field: 'rosinRammlerUniformityN', unit: '-', isoPure: true, domBinding: '#wb-ctrl-res-rr' }
    ],
    allowUnboundReasons: []
  },

  catalogFacet: {
    id: 'catalogFacet',
    islandComponent: 'CatalogFacetedIsland.astro',
    conceptRefs: ['quick_checkout_skus', 'atomic_parts_13', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-35', 'ARB-SMAT-55', 'ARB-SMAT-58'],
    routes: ['/', '/en/', '/catalogo/', '/en/catalog/', '/equipos/', '/en/process-equipment/'],
    inputsSchema: [
      { field: 'avenueFilter', type: 'enum', defaultValue: 'all', sobolTier: 1, sobolSensitivityScore: 0.40, domBinding: '[data-facet-avenue-btn]' },
      { field: 'verticalFilter', type: 'enum', defaultValue: 'all', sobolTier: 1, sobolSensitivityScore: 0.35, domBinding: '[data-family-chip]' },
      { field: 'searchQuery', type: 'string', defaultValue: '', sobolTier: 1, sobolSensitivityScore: 0.45, domBinding: '#equipos-sku-search', aliasBindings: ['#catalog-facet-search'] }
    ],
    outputsSchema: [
      { field: 'visibleSkuCount', unit: 'count', isoPure: true, domBinding: '#catalog-visible-sku-count' },
      { field: 'catalogCardGrid', unit: 'dom', isoPure: false, domBinding: '[data-add-tray-sku]' }
    ],
    allowUnboundReasons: []
  },

  dropIn: {
    id: 'dropIn',
    islandComponent: 'CatalogFacetedIsland.astro',
    conceptRefs: ['quick_checkout_skus', 'workbench_lens_v2', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-27', 'ARB-SMAT-39', 'ARB-SMAT-58'],
    routes: ['/', '/en/', '/catalogo/', '/en/catalog/', '/equipos/', '/en/process-equipment/'],
    inputsSchema: [
      { field: 'rawPartQuery', type: 'string', defaultValue: '', sobolTier: 1, sobolSensitivityScore: 0.90, domBinding: '[data-dropin-input]' }
    ],
    outputsSchema: [
      { field: 'canonicalSkuId', unit: 'sku', isoPure: false, domBinding: '[data-dropin-result]' },
      { field: 'satTuple', unit: 'cfdi', isoPure: false, domBinding: '[data-dropin-result]' },
      { field: 'alloySuffix', unit: 'code', isoPure: false, domBinding: '[data-dropin-result]' }
    ],
    allowUnboundReasons: []
  },

  jrp: {
    id: 'jrp',
    islandComponent: 'AtomicPartIsland.astro',
    conceptRefs: ['workbench_lens_v2', 'print_receipt', 'atomic_parts_13', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-43', 'ARB-SMAT-56', 'ARB-SMAT-58'],
    routes: ['/catalogo/[code]/', '/en/catalog/[code]/', '/productos/[slug]/', '/en/products/[slug]/', '/cotizar/', '/en/quote/', '/acuse/', '/en/thank-you/'],
    inputsSchema: [
      { field: 'predictedWearHours', type: 'number', min: 720, max: 18000, defaultValue: 2400, sobolTier: 1, sobolSensitivityScore: 0.46, domBinding: '#wb-jrp-wear-hours' },
      { field: 'operatingHoursPerDay', type: 'number', min: 1, max: 24, defaultValue: 24, sobolTier: 2, sobolSensitivityScore: 0.19, domBinding: '#wb-jrp-daily-hours' },
      { field: 'criticalityMode', type: 'enum', defaultValue: 'normal', sobolTier: 1, sobolSensitivityScore: 0.35, domBinding: '#wb-jrp-criticality', aliasBindings: ['[data-jrp-crit-btn]'] },
      { field: 'coreReturnEnabled', type: 'boolean', defaultValue: false, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-core-tradein-toggle' }
    ],
    outputsSchema: [
      { field: 'sleeveInspectionDay', unit: 'd', isoPure: true, domBinding: '#jrp-stage-1-days' },
      { field: 'impellerThroatbushSwapDay', unit: 'd', isoPure: true, domBinding: '#jrp-stage-2-days' },
      { field: 'voluteLinerOverhaulDay', unit: 'd', isoPure: true, domBinding: '#jrp-stage-3-days' },
      { field: 'reorderWindowDays', unit: 'd', isoPure: true, domBinding: '#wb-jrp-window-days' },
      { field: 'eligible', unit: 'bool', isoPure: false, domBinding: '#wb-core-tradein-eligible' },
      { field: 'version', unit: 'int', isoPure: true, domBinding: '#qtray-state-version' }
    ],
    allowUnboundReasons: []
  },

  erpExport: {
    id: 'erpExport',
    islandComponent: 'QuoteWizard.astro',
    conceptRefs: ['print_receipt', 'NAP', 'urgency', '301 Mappings', 'locale_pref', 'trust_charter', 'field_cases', 'faqs', 'engine_schema_v50'],
    arbitrageRefs: ['ARB-SMAT-29', 'ARB-SMAT-53', 'ARB-SMAT-58'],
    routes: ['/cotizar/', '/en/quote/', '/acuse/', '/en/thank-you/'],
    inputsSchema: [
      { field: 'quantity', type: 'number', min: 1, max: 500, defaultValue: 1, sobolTier: 1, sobolSensitivityScore: 0.25, domBinding: '#wb-erp-quantity' },
      { field: 'placa_ref', type: 'string', defaultValue: '', sobolTier: 2, sobolSensitivityScore: 0.10, domBinding: '#wb-client-ref' },
      { field: 'logistics_mode', type: 'enum', defaultValue: 'Durango', sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-erp-logistics-mode' },
      { field: 'delivery_destination', type: 'string', defaultValue: 'Durango', sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#wb-erp-destination' }
    ],
    outputsSchema: [
      { field: 'sapTsv', unit: 'tsv', isoPure: false, domBinding: '#wb-copy-tsv-btn' },
      { field: 'whatsappUrl', unit: 'url', isoPure: false, domBinding: '#wb-whatsapp-btn' },
      { field: 'acuseUrlParams', unit: 'url', isoPure: false, domBinding: '#wb-pdf-btn' }
    ],
    allowUnboundReasons: []
  }
});

/**
 * Devuelve la lista ordenada de todos los esquemas declarados en el registro Two-Sort.
 * @returns {EngineDomainSchema[]}
 */
export function listAllEngineSchemas() {
  return Object.values(ENGINE_SCHEMA_REGISTRY);
}

/**
 * Obtiene un esquema por identificador de dominio.
 * @param {string} domainId
 * @returns {EngineDomainSchema|null}
 */
export function getEngineSchema(domainId) {
  return ENGINE_SCHEMA_REGISTRY[String(domainId || '').trim()] || null;
}

/**
 * Recolecta todos los selectores #id declarados en inputsSchema y outputsSchema (excluyendo selectores de atributo).
 * @returns {{ inputs: string[], outputs: string[] }}
 */
export function listAllDeclaredDomIds() {
  const inputs = [];
  const outputs = [];
  const collectHashIds = (selector, target) => {
    if (typeof selector === 'string' && selector.startsWith('#')) {
      const cleanId = selector.slice(1).split(/[,\s]/)[0].trim();
      if (cleanId && !target.includes(cleanId)) target.push(cleanId);
    }
  };
  for (const schema of listAllEngineSchemas()) {
    for (const inp of schema.inputsSchema) {
      collectHashIds(inp.domBinding, inputs);
      if (Array.isArray(inp.aliasBindings)) {
        for (const alias of inp.aliasBindings) collectHashIds(alias, inputs);
      }
    }
    for (const out of schema.outputsSchema) {
      collectHashIds(out.domBinding, outputs);
      if (Array.isArray(out.aliasBindings)) {
        for (const alias of out.aliasBindings) collectHashIds(alias, outputs);
      }
    }
  }
  return { inputs, outputs };
}

/**
 * Normaliza y valida una carga útil contra el inputsSchema de un dominio.
 * Garantiza ausencia total de evaluación dinámica y acotación segura de rangos.
 *
 * @param {string} domainId
 * @param {Record<string, any>} [payload={}]
 * @returns {{ valid: boolean, normalized: Record<string, any>, violations: string[] }}
 */
export function validateSchemaPayload(domainId, payload = {}) {
  const schema = getEngineSchema(domainId);
  if (!schema) {
    return { valid: false, normalized: {}, violations: [`UNKNOWN_DOMAIN:${domainId}`] };
  }
  const normalized = {};
  const violations = [];
  for (const fieldDef of schema.inputsSchema) {
    const raw = payload && Object.prototype.hasOwnProperty.call(payload, fieldDef.field)
      ? payload[fieldDef.field]
      : fieldDef.defaultValue;
    if (fieldDef.type === 'number') {
      const num = Number(raw);
      if (!Number.isFinite(num)) {
        violations.push(`NAN_${fieldDef.field}`);
        normalized[fieldDef.field] = fieldDef.defaultValue;
      } else {
        const minVal = typeof fieldDef.min === 'number' ? fieldDef.min : -Infinity;
        const maxVal = typeof fieldDef.max === 'number' ? fieldDef.max : Infinity;
        if (num < minVal || num > maxVal) {
          violations.push(`RANGE_${fieldDef.field}:${num}∉[${minVal},${maxVal}]`);
        }
        normalized[fieldDef.field] = Math.max(minVal, Math.min(maxVal, num));
      }
    } else if (fieldDef.type === 'boolean') {
      normalized[fieldDef.field] = Boolean(raw);
    } else {
      normalized[fieldDef.field] = raw === undefined || raw === null ? String(fieldDef.defaultValue ?? '') : String(raw);
    }
  }
  return { valid: violations.length === 0, normalized, violations };
}

/**
 * Auditoría de trazabilidad Pre-RS/Post-RS: verifica que todo concepto en `CONCEPT-REGISTRY.md`
 * esté cubierto por al menos un dominio de `ENGINE_SCHEMA_REGISTRY`.
 *
 * @param {string[]} registeredConcepts
 * @returns {{ closed: boolean, missingConcepts: string[] }}
 */
export function verifyConceptRegistryCoverage(registeredConcepts = []) {
  const covered = new Set();
  for (const schema of listAllEngineSchemas()) {
    for (const ref of schema.conceptRefs) covered.add(ref);
  }
  const missingConcepts = registeredConcepts.filter((c) => !covered.has(c));
  return { closed: missingConcepts.length === 0, missingConcepts };
}
