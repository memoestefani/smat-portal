/**
 * engineSchemaRegistry.js
 * ---------------------------------------------------------------------------
 * Fuente Única de Verdad Ejecutable EngineSchema <-> DOM en Partición de Dos Sorts
 * (Sigma_Markup perp Sigma_Script, Leroy POPL 2009 / Cardelli 1988 / [ARB-SMAT-58, ARB-SMAT-59]).
 *
 * REGLAS INVARIANTES (D1-V51 / D5-V51 / D6-V51):
 * 1. Prohibido emitir HTML, <script> o evaluación dinámica (eval / new Function) en este registro.
 * 2. Cada dominio declara rootSelector `[data-domain-root="<id>"]`, inputsSchema (con schemaKey
 *    `data-schema-input="<domain>.<field>"` + ancla DOM canónica sin placebos) y outputsSchema
 *    (con pureza escalar ISO 80000-1 y `data-schema-output="<domain>.<field>"`).
 * 3. Trazabilidad cerrada Pre-RS/Post-RS hacia docs/CONCEPT-REGISTRY.md (18/18 conceptos cubiertos).
 */

export const TWO_SORT_PARTITION_VERSION = '5.1.0';

/**
 * @typedef {Object} SchemaFieldBinding
 * @property {string} field
 * @property {'number'|'string'|'boolean'|'enum'|'array'} type
 * @property {number|null} [min]
 * @property {number|null} [max]
 * @property {string|number|boolean|Array<any>|null} defaultValue
 * @property {1|2} sobolTier
 * @property {number} sobolSensitivityScore
 * @property {string} domBinding
 * @property {string} schemaKey
 * @property {string[]} [aliasBindings]
 */

/**
 * @typedef {Object} SchemaOutputBinding
 * @property {string} field
 * @property {string} unit
 * @property {boolean} isoPure
 * @property {string} domBinding
 * @property {string} schemaKey
 * @property {number} [decimals]
 * @property {string[]} [aliasBindings]
 */

/**
 * @typedef {Object} EngineDomainSchema
 * @property {string} id
 * @property {string} rootSelector
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
    rootSelector: '[data-domain-root="pumping"]',
    islandComponent: 'PumpingHubIsland.astro',
    conceptRefs: ['circuits', 'role_id', 'intent', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-17', 'ARB-SMAT-22', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/bombeo/', '/en/pumping/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'flowM3H', type: 'number', min: 10, max: 3000, defaultValue: 180, sobolTier: 1, sobolSensitivityScore: 0.42, domBinding: '#slider-flow', schemaKey: 'pumping.flowM3H', aliasBindings: ['[data-schema-input="pumping.flowM3H"]'] },
      { field: 'solidsWeightPercent', type: 'number', min: 5, max: 75, defaultValue: 45, sobolTier: 1, sobolSensitivityScore: 0.24, domBinding: '#slider-solids', schemaKey: 'pumping.solidsWeightPercent', aliasBindings: ['[data-schema-input="pumping.solidsWeightPercent"]'] },
      { field: 'particleSizeD80Microns', type: 'number', min: 20, max: 2000, defaultValue: 180, sobolTier: 1, sobolSensitivityScore: 0.16, domBinding: '#slider-d80', schemaKey: 'pumping.particleSizeD80Microns', aliasBindings: ['[data-schema-input="pumping.particleSizeD80Microns"]'] },
      { field: 'solidsSpecificGravity', type: 'number', min: 1.5, max: 5.5, defaultValue: 2.7, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#slider-sg', schemaKey: 'pumping.solidsSpecificGravity', aliasBindings: ['[data-schema-input="pumping.solidsSpecificGravity"]'] },
      { field: 'pipeSeries', type: 'enum', defaultValue: '6x4', sobolTier: 1, sobolSensitivityScore: 0.31, domBinding: '#wb-pipe-size', schemaKey: 'pumping.pipeSeries', aliasBindings: ['[data-schema-input="pumping.pipeSeries"]'] },
      { field: 'altitudeM', type: 'number', min: 0, max: 5000, defaultValue: 2200, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#wb-altitude-input', schemaKey: 'pumping.altitudeM', aliasBindings: ['[data-schema-input="pumping.altitudeM"]', '[data-wb-altitude-btn]'] },
      { field: 'pH', type: 'number', min: 1.0, max: 14.0, defaultValue: 7.5, sobolTier: 2, sobolSensitivityScore: 0.05, domBinding: '#slider-ph', schemaKey: 'pumping.pH', aliasBindings: ['[data-schema-input="pumping.pH"]'] },
      { field: 'stressSymptom', type: 'string', defaultValue: 'roca_dura', sobolTier: 2, sobolSensitivityScore: 0.04, domBinding: '#wb-stress-symptom', schemaKey: 'pumping.stressSymptom', aliasBindings: ['[data-schema-input="pumping.stressSymptom"]', '.stress-chip'] },
      { field: 'tempC', type: 'number', min: 0, max: 140, defaultValue: 35, sobolTier: 2, sobolSensitivityScore: 0.03, domBinding: '#wb-temp-c', schemaKey: 'pumping.tempC', aliasBindings: ['[data-schema-input="pumping.tempC"]'] },
      { field: 'strictBlindCheck', type: 'boolean', defaultValue: false, sobolTier: 2, sobolSensitivityScore: 0.02, domBinding: '#wb-strict-blind-check', schemaKey: 'pumping.strictBlindCheck', aliasBindings: ['[data-schema-input="pumping.strictBlindCheck"]'] }
    ],
    outputsSchema: [
      { field: 'slurrySpecificGravity', unit: 'kg/L', decimals: 2, isoPure: true, domBinding: '#metric-sm', schemaKey: 'pumping.slurrySpecificGravity', aliasBindings: ['[data-schema-output="pumping.slurrySpecificGravity"]'] },
      { field: 'criticalVelocityMs', unit: 'm/s', decimals: 2, isoPure: true, domBinding: '#metric-vc', schemaKey: 'pumping.criticalVelocityMs', aliasBindings: ['[data-schema-output="pumping.criticalVelocityMs"]'] },
      { field: 'actualPipeVelocityMs', unit: 'm/s', decimals: 2, isoPure: true, domBinding: '#metric-vact', schemaKey: 'pumping.actualPipeVelocityMs', aliasBindings: ['[data-schema-output="pumping.actualPipeVelocityMs"]'] },
      { field: 'durandFactorFL', unit: '-', decimals: 2, isoPure: true, domBinding: '#metric-fl', schemaKey: 'pumping.durandFactorFL', aliasBindings: ['[data-schema-output="pumping.durandFactorFL"]'] },
      { field: 'solidsVolumetricPercent', unit: '%', decimals: 1, isoPure: true, domBinding: '#metric-cv', schemaKey: 'pumping.solidsVolumetricPercent', aliasBindings: ['[data-schema-output="pumping.solidsVolumetricPercent"]'] },
      { field: 'recommendedPipeVelocityMs', unit: 'm/s', decimals: 2, isoPure: true, domBinding: '#metric-v-rec', schemaKey: 'pumping.recommendedPipeVelocityMs', aliasBindings: ['[data-schema-output="pumping.recommendedPipeVelocityMs"]'] },
      { field: 'headDeratingFactorHr', unit: '-', decimals: 3, isoPure: true, domBinding: '#metric-hr', schemaKey: 'pumping.headDeratingFactorHr', aliasBindings: ['[data-schema-output="pumping.headDeratingFactorHr"]', '#metric-derating-hr'] },
      { field: 'effDeratingFactorEr', unit: '-', decimals: 3, isoPure: true, domBinding: '#metric-er', schemaKey: 'pumping.effDeratingFactorEr', aliasBindings: ['[data-schema-output="pumping.effDeratingFactorEr"]', '#metric-derating-er'] },
      { field: 'estimatedImpellerLifeHours', unit: 'h', decimals: 0, isoPure: true, domBinding: '#metric-wear-hours', schemaKey: 'pumping.estimatedImpellerLifeHours', aliasBindings: ['[data-schema-output="pumping.estimatedImpellerLifeHours"]', '#metric-life'] },
      { field: 'wearLifeRatio', unit: 'x', decimals: 1, isoPure: true, domBinding: '#metric-wear-ratio', schemaKey: 'pumping.wearLifeRatio', aliasBindings: ['[data-schema-output="pumping.wearLifeRatio"]'] },
      { field: 'pAtmHeadMca', unit: 'mca', decimals: 2, isoPure: true, domBinding: '#metric-patm-mca', schemaKey: 'pumping.pAtmHeadMca', aliasBindings: ['[data-schema-output="pumping.pAtmHeadMca"]', '#metric-patm'] },
      { field: 'deltaNpshLossM', unit: 'm', decimals: 2, isoPure: true, domBinding: '#dossier-metric-delta-npsh', schemaKey: 'pumping.deltaNpshLossM', aliasBindings: ['[data-schema-output="pumping.deltaNpshLossM"]', '#metric-delta-npsh'] },
      { field: 'motorDeratingFactor', unit: '-', decimals: 3, isoPure: true, domBinding: '#metric-motor-iec', schemaKey: 'pumping.motorDeratingFactor', aliasBindings: ['[data-schema-output="pumping.motorDeratingFactor"]', '#metric-iec-derating'] },
      { field: 'combinedMotorAltitudeMultiplier', unit: 'x', decimals: 3, isoPure: true, domBinding: '#metric-k-motor-alt', schemaKey: 'pumping.combinedMotorAltitudeMultiplier', aliasBindings: ['[data-schema-output="pumping.combinedMotorAltitudeMultiplier"]'] },
      { field: 'motorSizingPenaltyPct', unit: '%', decimals: 1, isoPure: true, domBinding: '#metric-motor-penalty-pct', schemaKey: 'pumping.motorSizingPenaltyPct', aliasBindings: ['[data-schema-output="pumping.motorSizingPenaltyPct"]'] },
      { field: 'activeTrustBoundaryId', unit: 'id', isoPure: false, domBinding: '#trust-boundary-alert', schemaKey: 'pumping.activeTrustBoundaryId', aliasBindings: ['[data-schema-output="pumping.activeTrustBoundaryId"]'] },
      { field: 'sobolDominantDriver', unit: 'text', isoPure: false, domBinding: '#metric-sobol-driver', schemaKey: 'pumping.sobolDominantDriver', aliasBindings: ['[data-schema-output="pumping.sobolDominantDriver"]'] }
    ],
    allowUnboundReasons: []
  },

  tribology: {
    id: 'tribology',
    rootSelector: '[data-domain-root="tribology"]',
    islandComponent: 'TribologyAlloyIsland.astro',
    conceptRefs: ['metallurgy', 'hybrid_a05_r55', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-16', 'ARB-SMAT-44', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/bombeo/impulsor/', '/en/pumping/impeller/', '/bombeo/revestimientos/', '/en/pumping/liners/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'tribologyMaterial', type: 'enum', defaultValue: 'alto_cromo_cr27', sobolTier: 1, sobolSensitivityScore: 0.48, domBinding: '#trib-mat-select', schemaKey: 'tribology.tribologyMaterial', aliasBindings: ['[data-schema-input="tribology.tribologyMaterial"]', '#wb-pump-material'] },
      { field: 'frontClearanceMm', type: 'number', min: 0.2, max: 6.0, defaultValue: 0.75, sobolTier: 1, sobolSensitivityScore: 0.27, domBinding: '#trib-clearance-mm', schemaKey: 'tribology.frontClearanceMm', aliasBindings: ['[data-schema-input="tribology.frontClearanceMm"]', '#wb-clearance-slider'] },
      { field: 'particleSizeD80Microns', type: 'number', min: 10, max: 5000, defaultValue: 240, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#trib-d80-um', schemaKey: 'tribology.particleSizeD80Microns', aliasBindings: ['[data-schema-input="tribology.particleSizeD80Microns"]', '#slider-d80'] },
      { field: 'pulpPh', type: 'number', min: 1.0, max: 14.0, defaultValue: 7.5, sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#trib-ph', schemaKey: 'tribology.pulpPh', aliasBindings: ['[data-schema-input="tribology.pulpPh"]', '#slider-ph'] },
      { field: 'tipSpeedMs', type: 'number', min: 5, max: 42, defaultValue: 21.5, sobolTier: 1, sobolSensitivityScore: 0.29, domBinding: '#trib-u2-ms', schemaKey: 'tribology.tipSpeedMs', aliasBindings: ['[data-schema-input="tribology.tipSpeedMs"]'] },
      { field: 'solidsWeightPercent', type: 'number', min: 5, max: 80, defaultValue: 45, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#slider-solids', schemaKey: 'tribology.solidsWeightPercent', aliasBindings: ['[data-schema-input="tribology.solidsWeightPercent"]'] },
      { field: 'pipeSeries', type: 'enum', defaultValue: '6x4', sobolTier: 2, sobolSensitivityScore: 0.06, domBinding: '#wb-pipe-size', schemaKey: 'tribology.pipeSeries', aliasBindings: ['[data-schema-input="tribology.pipeSeries"]'] },
      { field: 'assemblySequence', type: 'enum', defaultValue: 'canonical', sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-assembly-sequence', schemaKey: 'tribology.assemblySequence', aliasBindings: ['[data-schema-input="tribology.assemblySequence"]'] },
      { field: 'impellerTorqueNm', type: 'number', min: 50, max: 2500, defaultValue: 456, sobolTier: 2, sobolSensitivityScore: 0.10, domBinding: '#trib-torque-nm', schemaKey: 'tribology.impellerTorqueNm', aliasBindings: ['[data-schema-input="tribology.impellerTorqueNm"]'] },
      { field: 'attemptedStationOrder', type: 'array', defaultValue: ['1', '2', '3', '4', '5'], sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#trib-station-order', schemaKey: 'tribology.attemptedStationOrder', aliasBindings: ['[data-schema-input="tribology.attemptedStationOrder"]'] }
    ],
    outputsSchema: [
      { field: 'recommendedMaterial', unit: 'code', isoPure: false, domBinding: '#trib-mat-out', schemaKey: 'tribology.recommendedMaterial', aliasBindings: ['[data-schema-output="tribology.recommendedMaterial"]'] },
      { field: 'hybridRecommended', unit: 'bool', isoPure: false, domBinding: '#wb-hybrid-verdict', schemaKey: 'tribology.hybridRecommended', aliasBindings: ['[data-schema-output="tribology.hybridRecommended"]'] },
      { field: 'hybridMassSavingsPct', unit: '%', decimals: 1, isoPure: true, domBinding: '#wb-hybrid-mass-savings', schemaKey: 'tribology.hybridMassSavingsPct', aliasBindings: ['[data-schema-output="tribology.hybridMassSavingsPct"]'] },
      { field: 'activeSeries', unit: 'in', isoPure: false, domBinding: '#wb-asm-active-series', schemaKey: 'tribology.activeSeries', aliasBindings: ['[data-schema-output="tribology.activeSeries"]'] },
      { field: 'activeWeightKg', unit: 'kg', decimals: 1, isoPure: true, domBinding: '#wb-asm-active-weight', schemaKey: 'tribology.activeWeightKg', aliasBindings: ['[data-schema-output="tribology.activeWeightKg"]'] },
      { field: 'activeNioshHoistRequired', unit: 'bool', isoPure: false, domBinding: '#wb-asm-active-hoist', schemaKey: 'tribology.activeNioshHoistRequired', aliasBindings: ['[data-schema-output="tribology.activeNioshHoistRequired"]'] },
      { field: 'activeMaterialCode', unit: 'code', isoPure: false, domBinding: '#wb-asm-active-material', schemaKey: 'tribology.activeMaterialCode', aliasBindings: ['[data-schema-output="tribology.activeMaterialCode"]'] },
      { field: 'volumetricLossPct', unit: '%', decimals: 1, isoPure: true, domBinding: '#trib-vol-loss-out', schemaKey: 'tribology.volumetricLossPct', aliasBindings: ['[data-schema-output="tribology.volumetricLossPct"]'] },
      { field: 'pipeVelocityMarginLossPct', unit: '%', decimals: 1, isoPure: true, domBinding: '#trib-pipe-loss-out', schemaKey: 'tribology.pipeVelocityMarginLossPct', aliasBindings: ['[data-schema-output="tribology.pipeVelocityMarginLossPct"]', '#wb-clearance-vel-loss'] },
      { field: 'statusMessage', unit: 'text', isoPure: false, domBinding: '#trib-status-out', schemaKey: 'tribology.statusMessage', aliasBindings: ['[data-schema-output="tribology.statusMessage"]'] }
    ],
    allowUnboundReasons: []
  },

  sealDrive: {
    id: 'sealDrive',
    rootSelector: '[data-domain-root="sealDrive"]',
    islandComponent: 'SealDriveBearingIsland.astro',
    conceptRefs: ['atomic_parts_13', 'role_id', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-14', 'ARB-SMAT-15', 'ARB-SMAT-56', 'ARB-SMAT-59'],
    routes: ['/bombeo/sello/', '/en/pumping/seal/', '/bombeo/skid/', '/en/pumping/skid/', '/bombeo/soporte/', '/en/pumping/bearing-assembly/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'dischargeHeadM', type: 'number', min: 5, max: 110, defaultValue: 28, sobolTier: 1, sobolSensitivityScore: 0.34, domBinding: '#seal-hd-m', schemaKey: 'sealDrive.dischargeHeadM', aliasBindings: ['[data-schema-input="sealDrive.dischargeHeadM"]'] },
      { field: 'suctionHeadM', type: 'number', min: 0, max: 25, defaultValue: 3.2, sobolTier: 1, sobolSensitivityScore: 0.39, domBinding: '#seal-hs-m', schemaKey: 'sealDrive.suctionHeadM', aliasBindings: ['[data-schema-input="sealDrive.suctionHeadM"]'] },
      { field: 'expellerDiaMm', type: 'number', min: 140, max: 520, defaultValue: 280, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#seal-exp-dia', schemaKey: 'sealDrive.expellerDiaMm', aliasBindings: ['[data-schema-input="sealDrive.expellerDiaMm"]'] },
      { field: 'pumpRpm', type: 'number', min: 400, max: 2200, defaultValue: 1150, sobolTier: 1, sobolSensitivityScore: 0.25, domBinding: '#seal-rpm', schemaKey: 'sealDrive.pumpRpm', aliasBindings: ['[data-schema-input="sealDrive.pumpRpm"]'] },
      { field: 'slurrySg', type: 'number', min: 1.0, max: 2.3, defaultValue: 1.38, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#seal-sg', schemaKey: 'sealDrive.slurrySg', aliasBindings: ['[data-schema-input="sealDrive.slurrySg"]'] },
      { field: 'arrangementCode', type: 'enum', defaultValue: 'CV', sobolTier: 1, sobolSensitivityScore: 0.22, domBinding: '#wb-drive-arrangement', schemaKey: 'sealDrive.arrangementCode', aliasBindings: ['[data-schema-input="sealDrive.arrangementCode"]', '[data-kin-arrangement]'] },
      { field: 'motorRpm', type: 'number', min: 500, max: 3600, defaultValue: 1775, sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-motor-rpm', schemaKey: 'sealDrive.motorRpm', aliasBindings: ['[data-schema-input="sealDrive.motorRpm"]', '[data-kin-motor-rpm]'] },
      { field: 'driverPulleyMm', type: 'number', min: 80, max: 800, defaultValue: 220, sobolTier: 2, sobolSensitivityScore: 0.15, domBinding: '#wb-driver-pulley', schemaKey: 'sealDrive.driverPulleyMm', aliasBindings: ['[data-schema-input="sealDrive.driverPulleyMm"]', '[data-kin-driver-mm]'] },
      { field: 'drivenPulleyMm', type: 'number', min: 100, max: 1200, defaultValue: 340, sobolTier: 2, sobolSensitivityScore: 0.15, domBinding: '#wb-driven-pulley', schemaKey: 'sealDrive.drivenPulleyMm', aliasBindings: ['[data-schema-input="sealDrive.drivenPulleyMm"]', '[data-kin-driven-mm]'] },
      { field: 'motorPowerKw', type: 'number', min: 5, max: 1200, defaultValue: 55, sobolTier: 1, sobolSensitivityScore: 0.37, domBinding: '#wb-shaft-power', schemaKey: 'sealDrive.motorPowerKw', aliasBindings: ['[data-schema-input="sealDrive.motorPowerKw"]', '[data-kin-power-kw]', '[data-bear-power-kw]'] }
    ],
    outputsSchema: [
      { field: 'expellerCounterPressureKpa', unit: 'kPa', decimals: 1, isoPure: true, domBinding: '#seal-pexp-out', schemaKey: 'sealDrive.expellerCounterPressureKpa', aliasBindings: ['[data-schema-output="sealDrive.expellerCounterPressureKpa"]'] },
      { field: 'stuffingBoxResidualKpa', unit: 'kPa', decimals: 1, isoPure: true, domBinding: '#seal-pbox-out', schemaKey: 'sealDrive.stuffingBoxResidualKpa', aliasBindings: ['[data-schema-output="sealDrive.stuffingBoxResidualKpa"]'] },
      { field: 'requiredGlandWaterPressureKpa', unit: 'kPa', decimals: 1, isoPure: true, domBinding: '#seal-pwater-out', schemaKey: 'sealDrive.requiredGlandWaterPressureKpa', aliasBindings: ['[data-schema-output="sealDrive.requiredGlandWaterPressureKpa"]'] },
      { field: 'recommendedStationCode', unit: 'code', isoPure: false, domBinding: '#seal-branch-out', schemaKey: 'sealDrive.recommendedStationCode', aliasBindings: ['[data-schema-output="sealDrive.recommendedStationCode"]'] },
      { field: 'pumpRpm', unit: 'RPM', decimals: 0, isoPure: true, domBinding: '#wb-kin-pump-rpm', schemaKey: 'sealDrive.pumpRpm', aliasBindings: ['[data-schema-output="sealDrive.pumpRpm"]', '[data-kin-pump-rpm]'] },
      { field: 'tipSpeedMs', unit: 'm/s', decimals: 1, isoPure: true, domBinding: '#wb-kin-u2', schemaKey: 'sealDrive.tipSpeedMs', aliasBindings: ['[data-schema-output="sealDrive.tipSpeedMs"]', '[data-kin-u2]'] },
      { field: 'beltRadialLoadKn', unit: 'kN', decimals: 2, isoPure: true, domBinding: '#wb-kin-fr', schemaKey: 'sealDrive.beltRadialLoadKn', aliasBindings: ['[data-schema-output="sealDrive.beltRadialLoadKn"]', '[data-kin-fr]', '[data-bear-fr]'] },
      { field: 'bearingL10Hours', unit: 'h', decimals: 0, isoPure: true, domBinding: '#wb-kin-l10h', schemaKey: 'sealDrive.bearingL10Hours', aliasBindings: ['[data-schema-output="sealDrive.bearingL10Hours"]', '[data-kin-l10h]', '[data-bear-l10h]'] },
      { field: 'l10mhLabyrinthHours', unit: 'h', decimals: 0, isoPure: true, domBinding: '#wb-bear-l10mh-lab', schemaKey: 'sealDrive.l10mhLabyrinthHours', aliasBindings: ['[data-schema-output="sealDrive.l10mhLabyrinthHours"]', '[data-bear-l10mh-lab]'] },
      { field: 'l10mhContaminatedHours', unit: 'h', decimals: 0, isoPure: true, domBinding: '#wb-bear-l10mh-contam', schemaKey: 'sealDrive.l10mhContaminatedHours', aliasBindings: ['[data-schema-output="sealDrive.l10mhContaminatedHours"]', '[data-bear-l10mh-contam]'] }
    ],
    allowUnboundReasons: []
  },

  flotation: {
    id: 'flotation',
    rootSelector: '[data-domain-root="flotation"]',
    islandComponent: 'FlotationCalculatorIsland.astro',
    conceptRefs: ['circuits', 'decision_criteria', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-28', 'ARB-SMAT-30', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/flotacion/', '/en/flotation/', '/flotacion/celdas/', '/en/flotation/cells/', '/flotacion/mecanismos/', '/en/flotation/mechanisms/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'jgCmS', type: 'number', min: 0.5, max: 3.5, defaultValue: 1.5, sobolTier: 1, sobolSensitivityScore: 0.41, domBinding: '#wb-flot-jg', schemaKey: 'flotation.jgCmS', aliasBindings: ['[data-schema-input="flotation.jgCmS"]'] },
      { field: 'd32Mm', type: 'number', min: 0.8, max: 3.0, defaultValue: 1.6, sobolTier: 1, sobolSensitivityScore: 0.36, domBinding: '#wb-flot-d32', schemaKey: 'flotation.d32Mm', aliasBindings: ['[data-schema-input="flotation.d32Mm"]'] },
      { field: 'rotorDiaM', type: 'number', min: 0.25, max: 1.5, defaultValue: 0.61, sobolTier: 1, sobolSensitivityScore: 0.19, domBinding: '#wb-flot-dia', schemaKey: 'flotation.rotorDiaM', aliasBindings: ['[data-schema-input="flotation.rotorDiaM"]'] },
      { field: 'rotorRpm', type: 'number', min: 100, max: 450, defaultValue: 215, sobolTier: 1, sobolSensitivityScore: 0.18, domBinding: '#wb-flot-rpm', schemaKey: 'flotation.rotorRpm', aliasBindings: ['[data-schema-input="flotation.rotorRpm"]'] },
      { field: 'floatabilityP', type: 'number', min: 0.0001, max: 0.02, defaultValue: 0.0045, sobolTier: 2, sobolSensitivityScore: 0.22, domBinding: '#wb-flot-p', schemaKey: 'flotation.floatabilityP', aliasBindings: ['[data-schema-input="flotation.floatabilityP"]'] },
      { field: 'frothRecoveryRf', type: 'number', min: 0.2, max: 1.0, defaultValue: 0.78, sobolTier: 2, sobolSensitivityScore: 0.17, domBinding: '#wb-flot-rf', schemaKey: 'flotation.frothRecoveryRf', aliasBindings: ['[data-schema-input="flotation.frothRecoveryRf"]'] },
      { field: 'd80Microns', type: 'number', min: 15, max: 600, defaultValue: 110, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-flot-d80', schemaKey: 'flotation.d80Microns', aliasBindings: ['[data-schema-input="flotation.d80Microns"]'] },
      { field: 'solidsWeightPercent', type: 'number', min: 10, max: 65, defaultValue: 35, sobolTier: 2, sobolSensitivityScore: 0.07, domBinding: '#wb-flot-cw', schemaKey: 'flotation.solidsWeightPercent', aliasBindings: ['[data-schema-input="flotation.solidsWeightPercent"]'] }
    ],
    outputsSchema: [
      { field: 'sbInverseSeconds', unit: 's^-1', decimals: 1, isoPure: true, domBinding: '#wb-flot-res-sb', schemaKey: 'flotation.sbInverseSeconds', aliasBindings: ['[data-schema-output="flotation.sbInverseSeconds"]'] },
      { field: 'rateConstantMin', unit: 'min^-1', decimals: 3, isoPure: true, domBinding: '#wb-flot-res-k', schemaKey: 'flotation.rateConstantMin', aliasBindings: ['[data-schema-output="flotation.rateConstantMin"]'] },
      { field: 'tipSpeedMS', unit: 'm/s', decimals: 2, isoPure: true, domBinding: '#wb-flot-res-vtip', schemaKey: 'flotation.tipSpeedMS', aliasBindings: ['[data-schema-output="flotation.tipSpeedMS"]'] },
      { field: 'zwieteringNjsRpm', unit: 'RPM', decimals: 0, isoPure: true, domBinding: '#wb-flot-res-njs', schemaKey: 'flotation.zwieteringNjsRpm', aliasBindings: ['[data-schema-output="flotation.zwieteringNjsRpm"]'] },
      { field: 'floatabilityP', unit: '-', decimals: 4, isoPure: true, domBinding: '#wb-flot-res-p', schemaKey: 'flotation.floatabilityP', aliasBindings: ['[data-schema-output="flotation.floatabilityP"]'] },
      { field: 'frothRecoveryRf', unit: '-', decimals: 2, isoPure: true, domBinding: '#wb-flot-res-rf', schemaKey: 'flotation.frothRecoveryRf', aliasBindings: ['[data-schema-output="flotation.frothRecoveryRf"]'] },
      { field: 'recommendedSkuId', unit: 'sku', isoPure: false, domBinding: '#wb-flot-res-sku', schemaKey: 'flotation.recommendedSkuId', aliasBindings: ['[data-schema-output="flotation.recommendedSkuId"]'] }
    ],
    allowUnboundReasons: []
  },

  filtration: {
    id: 'filtration',
    rootSelector: '[data-domain-root="filtration"]',
    islandComponent: 'FiltrationCalculatorIsland.astro',
    conceptRefs: ['circuits', 'decision_criteria', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-26', 'ARB-SMAT-51', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/filtracion/', '/en/filtration/', '/filtracion/prensa/', '/en/filtration/press/', '/filtracion/repuestos/', '/en/filtration/parts/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'plateWidthMm', type: 'number', min: 630, max: 2000, defaultValue: 1200, sobolTier: 1, sobolSensitivityScore: 0.34, domBinding: '#filt-plate-width', schemaKey: 'filtration.plateWidthMm', aliasBindings: ['[data-schema-input="filtration.plateWidthMm"]'] },
      { field: 'feedPressureBar', type: 'number', min: 4, max: 25, defaultValue: 12, sobolTier: 1, sobolSensitivityScore: 0.28, domBinding: '#wb-filt-pressure', schemaKey: 'filtration.feedPressureBar', aliasBindings: ['[data-schema-input="filtration.feedPressureBar"]'] },
      { field: 'cloggedPortsCount', type: 'number', min: 0, max: 4, defaultValue: 0, sobolTier: 1, sobolSensitivityScore: 0.31, domBinding: '#wb-filt-clogged', schemaKey: 'filtration.cloggedPortsCount', aliasBindings: ['[data-schema-input="filtration.cloggedPortsCount"]'] },
      { field: 'plateThicknessMm', type: 'number', min: 40, max: 120, defaultValue: 65, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-filt-thickness', schemaKey: 'filtration.plateThicknessMm', aliasBindings: ['[data-schema-input="filtration.plateThicknessMm"]'] },
      { field: 'cakeMoistureTargetPct', type: 'number', min: 8, max: 28, defaultValue: 14, sobolTier: 1, sobolSensitivityScore: 0.22, domBinding: '#filt-cake-moisture', schemaKey: 'filtration.cakeMoistureTargetPct', aliasBindings: ['[data-schema-input="filtration.cakeMoistureTargetPct"]'] }
    ],
    outputsSchema: [
      { field: 'maxBendingStressMpa', unit: 'MPa', decimals: 2, isoPure: true, domBinding: '#wb-filt-res-stress', schemaKey: 'filtration.maxBendingStressMpa', aliasBindings: ['[data-schema-output="filtration.maxBendingStressMpa"]'] },
      { field: 'flexuralSafetyFactor', unit: 'FS', decimals: 2, isoPure: true, domBinding: '#wb-filt-res-fs', schemaKey: 'filtration.flexuralSafetyFactor', aliasBindings: ['[data-schema-output="filtration.flexuralSafetyFactor"]'] },
      { field: 'cyclesPerDay', unit: 'c/d', decimals: 0, isoPure: true, domBinding: '#wb-filt-res-cycles', schemaKey: 'filtration.cyclesPerDay', aliasBindings: ['[data-schema-output="filtration.cyclesPerDay"]'] },
      { field: 'dryTonnesPerDay', unit: 't/d', decimals: 0, isoPure: true, domBinding: '#wb-filt-res-tpd', schemaKey: 'filtration.dryTonnesPerDay', aliasBindings: ['[data-schema-output="filtration.dryTonnesPerDay"]', '#filt-res-summary'] },
      { field: 'nom141Compliant', unit: 'bool', isoPure: false, domBinding: '#wb-filt-res-nom141', schemaKey: 'filtration.nom141Compliant', aliasBindings: ['[data-schema-output="filtration.nom141Compliant"]'] }
    ],
    allowUnboundReasons: []
  },

  cycloneScreen: {
    id: 'cycloneScreen',
    rootSelector: '[data-domain-root="cycloneScreen"]',
    islandComponent: 'CycloneScreenIsland.astro',
    conceptRefs: ['circuits', 'decision_criteria', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-26', 'ARB-SMAT-30', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/clasificacion/', '/en/classification/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'feedSg', type: 'number', min: 1.02, max: 3.5, defaultValue: 1.35, sobolTier: 1, sobolSensitivityScore: 0.26, domBinding: '#wb-cyc-sg-feed', schemaKey: 'cycloneScreen.feedSg', aliasBindings: ['[data-schema-input="cycloneScreen.feedSg"]'] },
      { field: 'underflowSg', type: 'number', min: 1.15, max: 4.5, defaultValue: 1.82, sobolTier: 1, sobolSensitivityScore: 0.34, domBinding: '#wb-cyc-sg-uf', schemaKey: 'cycloneScreen.underflowSg', aliasBindings: ['[data-schema-input="cycloneScreen.underflowSg"]'] },
      { field: 'overflowSg', type: 'number', min: 1.01, max: 2.5, defaultValue: 1.15, sobolTier: 1, sobolSensitivityScore: 0.19, domBinding: '#wb-cyc-sg-of', schemaKey: 'cycloneScreen.overflowSg', aliasBindings: ['[data-schema-input="cycloneScreen.overflowSg"]'] },
      { field: 'solidsSg', type: 'number', min: 1.8, max: 5.5, defaultValue: 2.7, sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-cyc-solids-sg', schemaKey: 'cycloneScreen.solidsSg', aliasBindings: ['[data-schema-input="cycloneScreen.solidsSg"]'] },
      { field: 'apexDiameterMm', type: 'number', min: 12, max: 250, defaultValue: 50, sobolTier: 1, sobolSensitivityScore: 0.24, domBinding: '#wb-cyc-apex-mm', schemaKey: 'cycloneScreen.apexDiameterMm', aliasBindings: ['[data-schema-input="cycloneScreen.apexDiameterMm"]'] },
      { field: 'vortexDiameterMm', type: 'number', min: 25, max: 400, defaultValue: 100, sobolTier: 1, sobolSensitivityScore: 0.21, domBinding: '#wb-cyc-vortex-mm', schemaKey: 'cycloneScreen.vortexDiameterMm', aliasBindings: ['[data-schema-input="cycloneScreen.vortexDiameterMm"]'] },
      { field: 'feedPressureKpa', type: 'number', min: 20, max: 350, defaultValue: 95, sobolTier: 1, sobolSensitivityScore: 0.18, domBinding: '#wb-cyc-pressure-kpa', schemaKey: 'cycloneScreen.feedPressureKpa', aliasBindings: ['[data-schema-input="cycloneScreen.feedPressureKpa"]'] },
      { field: 'cycloneDiameterMm', type: 'number', min: 100, max: 1000, defaultValue: 380, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-cyc-series', schemaKey: 'cycloneScreen.cycloneDiameterMm', aliasBindings: ['[data-schema-input="cycloneScreen.cycloneDiameterMm"]'] },
      { field: 'apertureMm', type: 'number', min: 0.15, max: 25.0, defaultValue: 0.5, sobolTier: 1, sobolSensitivityScore: 0.29, domBinding: '#csr-aperture-mm', schemaKey: 'cycloneScreen.apertureMm', aliasBindings: ['[data-schema-input="cycloneScreen.apertureMm"]'] },
      { field: 'reliefAngleDeg', type: 'number', min: 1.5, max: 8.0, defaultValue: 4.0, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#csr-relief-deg', schemaKey: 'cycloneScreen.reliefAngleDeg', aliasBindings: ['[data-schema-input="cycloneScreen.reliefAngleDeg"]'] },
      { field: 'vibrationG', type: 'number', min: 2.0, max: 7.0, defaultValue: 4.5, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-scr-vibration-g', schemaKey: 'cycloneScreen.vibrationG', aliasBindings: ['[data-schema-input="cycloneScreen.vibrationG"]'] },
      { field: 'sharpnessAlpha', type: 'number', min: 2.5, max: 8.0, defaultValue: 4.4, sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#wb-scr-alpha', schemaKey: 'cycloneScreen.sharpnessAlpha', aliasBindings: ['[data-schema-input="cycloneScreen.sharpnessAlpha"]'] }
    ],
    outputsSchema: [
      { field: 'circulatingLoadPct', unit: '%', decimals: 1, isoPure: true, domBinding: '#wb-cyc-res-cc', schemaKey: 'cycloneScreen.circulatingLoadPct', aliasBindings: ['[data-schema-output="cycloneScreen.circulatingLoadPct"]'] },
      { field: 'd50cMicrons', unit: 'µm', decimals: 0, isoPure: true, domBinding: '#wb-cyc-res-d50', schemaKey: 'cycloneScreen.d50cMicrons', aliasBindings: ['[data-schema-output="cycloneScreen.d50cMicrons"]'] },
      { field: 'cvUnderflow', unit: 'frac', decimals: 3, isoPure: true, domBinding: '#wb-cyc-res-cvu', schemaKey: 'cycloneScreen.cvUnderflow', aliasBindings: ['[data-schema-output="cycloneScreen.cvUnderflow"]'] },
      { field: 'apexToVortexRatio', unit: '-', decimals: 2, isoPure: true, domBinding: '#wb-cyc-res-dudo', schemaKey: 'cycloneScreen.apexToVortexRatio', aliasBindings: ['[data-schema-output="cycloneScreen.apexToVortexRatio"]'] },
      { field: 'dischargeRegime', unit: 'state', isoPure: false, domBinding: '#wb-cyc-res-roping', schemaKey: 'cycloneScreen.dischargeRegime', aliasBindings: ['[data-schema-output="cycloneScreen.dischargeRegime"]'] },
      { field: 'partitionToOversizePct', unit: '%', decimals: 1, isoPure: true, domBinding: '#wb-scr-res-oversize', schemaKey: 'cycloneScreen.partitionToOversizePct', aliasBindings: ['[data-schema-output="cycloneScreen.partitionToOversizePct"]'] },
      { field: 'elasticDilationPct', unit: '%', decimals: 2, isoPure: true, domBinding: '#wb-scr-res-dilation', schemaKey: 'cycloneScreen.elasticDilationPct', aliasBindings: ['[data-schema-output="cycloneScreen.elasticDilationPct"]'] },
      { field: 'sharpnessAlpha', unit: '-', decimals: 2, isoPure: true, domBinding: '#wb-scr-res-weibull', schemaKey: 'cycloneScreen.sharpnessAlpha', aliasBindings: ['[data-schema-output="cycloneScreen.sharpnessAlpha"]', '#csr-weibull-out'] }
    ],
    allowUnboundReasons: []
  },

  metrology: {
    id: 'metrology',
    rootSelector: '[data-domain-root="metrology"]',
    islandComponent: 'ProcessControlIsland.astro',
    conceptRefs: ['atomic_parts_13', 'decision_criteria', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-11', 'ARB-SMAT-51', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/control-de-procesos/', '/en/process-control/', '/cotizar/', '/en/quote/'],
    inputsSchema: [
      { field: 'marcyMode', type: 'enum', defaultValue: 'cw', sobolTier: 1, sobolSensitivityScore: 0.24, domBinding: '#wb-ctrl-solve-mode', schemaKey: 'metrology.marcyMode', aliasBindings: ['[data-schema-input="metrology.marcyMode"]'] },
      { field: 'solidsSpecificGravity', type: 'number', min: 2.2, max: 4.4, defaultValue: 2.8, sobolTier: 1, sobolSensitivityScore: 0.27, domBinding: '#wb-ctrl-sg', schemaKey: 'metrology.solidsSpecificGravity', aliasBindings: ['[data-schema-input="metrology.solidsSpecificGravity"]'] },
      { field: 'solidsWeightPercent', type: 'number', min: 10, max: 75, defaultValue: 45, sobolTier: 1, sobolSensitivityScore: 0.41, domBinding: '#wb-ctrl-cw', schemaKey: 'metrology.solidsWeightPercent', aliasBindings: ['[data-schema-input="metrology.solidsWeightPercent"]'] },
      { field: 'measuredSpGr', type: 'number', min: 1.05, max: 2.4, defaultValue: 1.406, sobolTier: 1, sobolSensitivityScore: 0.44, domBinding: '#wb-ctrl-rhop', schemaKey: 'metrology.measuredSpGr', aliasBindings: ['[data-schema-input="metrology.measuredSpGr"]'] },
      { field: 'topSizeMm', type: 'number', min: 0.04, max: 25.0, defaultValue: 6.5, sobolTier: 1, sobolSensitivityScore: 0.31, domBinding: '#wb-ctrl-d95', schemaKey: 'metrology.topSizeMm', aliasBindings: ['[data-schema-input="metrology.topSizeMm"]'] },
      { field: 'liberationSizeMicrons', type: 'number', min: 10, max: 1000, defaultValue: 100, sobolTier: 2, sobolSensitivityScore: 0.15, domBinding: '#wb-ctrl-lib', schemaKey: 'metrology.liberationSizeMicrons', aliasBindings: ['[data-schema-input="metrology.liberationSizeMicrons"]'] },
      { field: 'oreGradeDecimal', type: 'number', min: 0.001, max: 0.95, defaultValue: 0.05, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-ctrl-grade', schemaKey: 'metrology.oreGradeDecimal', aliasBindings: ['[data-schema-input="metrology.oreGradeDecimal"]'] },
      { field: 'airPressurePsi', type: 'number', min: 60, max: 100, defaultValue: 90, sobolTier: 2, sobolSensitivityScore: 0.08, domBinding: '#wb-ctrl-air-psi', schemaKey: 'metrology.airPressurePsi', aliasBindings: ['[data-schema-input="metrology.airPressurePsi"]'] },
      { field: 'samplingConstantC', type: 'number', min: 0.05, max: 50, defaultValue: 1.35, sobolTier: 2, sobolSensitivityScore: 0.13, domBinding: '#wb-ctrl-gy-c', schemaKey: 'metrology.samplingConstantC', aliasBindings: ['[data-schema-input="metrology.samplingConstantC"]'] },
      { field: 'targetRelativeStdError', type: 'number', min: 0.01, max: 0.2, defaultValue: 0.05, sobolTier: 2, sobolSensitivityScore: 0.16, domBinding: '#wb-ctrl-gy-err', schemaKey: 'metrology.targetRelativeStdError', aliasBindings: ['[data-schema-input="metrology.targetRelativeStdError"]'] },
      { field: 'targetP80Microns', type: 'number', min: 25, max: 2000, defaultValue: 150, sobolTier: 1, sobolSensitivityScore: 0.28, domBinding: '#wb-ctrl-p80', schemaKey: 'metrology.targetP80Microns', aliasBindings: ['[data-schema-input="metrology.targetP80Microns"]'] },
      { field: 'rosinRammlerSlopeN', type: 'number', min: 0.5, max: 2.5, defaultValue: 1.15, sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#wb-ctrl-rr-n', schemaKey: 'metrology.rosinRammlerSlopeN', aliasBindings: ['[data-schema-input="metrology.rosinRammlerSlopeN"]'] },
      { field: 'retainedPercentAtP80', type: 'number', min: 5, max: 40, defaultValue: 20, sobolTier: 2, sobolSensitivityScore: 0.09, domBinding: '#wb-ctrl-ret-p80', schemaKey: 'metrology.retainedPercentAtP80', aliasBindings: ['[data-schema-input="metrology.retainedPercentAtP80"]'] }
    ],
    outputsSchema: [
      { field: 'marcyDensityKgL', unit: 'kg/L', decimals: 3, isoPure: true, domBinding: '#wb-ctrl-res-sm', schemaKey: 'metrology.marcyDensityKgL', aliasBindings: ['[data-schema-output="metrology.marcyDensityKgL"]'] },
      { field: 'cwPct', unit: '%', decimals: 1, isoPure: true, domBinding: '#wb-ctrl-res-cw', schemaKey: 'metrology.cwPct', aliasBindings: ['[data-schema-output="metrology.cwPct"]'] },
      { field: 'wrongRingBiasPoints', unit: 'pts', decimals: 1, isoPure: true, domBinding: '#wb-ctrl-res-bias', schemaKey: 'metrology.wrongRingBiasPoints', aliasBindings: ['[data-schema-output="metrology.wrongRingBiasPoints"]'] },
      { field: 'minimumSampleMassKg', unit: 'kg', decimals: 2, isoPure: true, domBinding: '#wb-ctrl-res-gy', schemaKey: 'metrology.minimumSampleMassKg', aliasBindings: ['[data-schema-output="metrology.minimumSampleMassKg"]'] },
      { field: 'sieveNumber', unit: 'mesh', isoPure: false, domBinding: '#wb-ctrl-res-sieve', schemaKey: 'metrology.sieveNumber', aliasBindings: ['[data-schema-output="metrology.sieveNumber"]'] },
      { field: 'drySampleMassGrams', unit: 'g', decimals: 0, isoPure: true, domBinding: '#wb-ctrl-res-drysample', schemaKey: 'metrology.drySampleMassGrams', aliasBindings: ['[data-schema-output="metrology.drySampleMassGrams"]'] },
      { field: 'hoistRequired', unit: 'bool', isoPure: false, domBinding: '#wb-ctrl-res-hoist', schemaKey: 'metrology.hoistRequired', aliasBindings: ['[data-schema-output="metrology.hoistRequired"]'] },
      { field: 'twoPersonAssistRequired', unit: 'bool', isoPure: false, domBinding: '#wb-ctrl-res-two-person', schemaKey: 'metrology.twoPersonAssistRequired', aliasBindings: ['[data-schema-output="metrology.twoPersonAssistRequired"]'] },
      { field: 'rosinRammlerUniformityN', unit: '-', decimals: 2, isoPure: true, domBinding: '#wb-ctrl-res-rr', schemaKey: 'metrology.rosinRammlerUniformityN', aliasBindings: ['[data-schema-output="metrology.rosinRammlerUniformityN"]'] },
      { field: 'rosinRammlerY', unit: '-', decimals: 4, isoPure: true, domBinding: '#wb-ctrl-res-rry', schemaKey: 'metrology.rosinRammlerY', aliasBindings: ['[data-schema-output="metrology.rosinRammlerY"]'] },
      { field: 'recommendedContainerEs', unit: 'text', isoPure: false, domBinding: '#wb-ctrl-res-container', schemaKey: 'metrology.recommendedContainerEs', aliasBindings: ['[data-schema-output="metrology.recommendedContainerEs"]', '[data-schema-output="metrology.recommendedContainerEn"]'] }
    ],
    allowUnboundReasons: []
  },

  catalogFacet: {
    id: 'catalogFacet',
    rootSelector: '[data-domain-root="catalogFacet"]',
    islandComponent: 'CatalogFacetedIsland.astro',
    conceptRefs: ['quick_checkout_skus', 'atomic_parts_13', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-35', 'ARB-SMAT-55', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/', '/en/', '/catalogo/', '/en/catalog/', '/equipos/', '/en/process-equipment/'],
    inputsSchema: [
      { field: 'avenueFilter', type: 'enum', defaultValue: 'all', sobolTier: 1, sobolSensitivityScore: 0.40, domBinding: '[data-facet-avenue-btn]', schemaKey: 'catalogFacet.avenueFilter', aliasBindings: ['[data-schema-input="catalogFacet.avenueFilter"]'] },
      { field: 'verticalFilter', type: 'enum', defaultValue: 'all', sobolTier: 1, sobolSensitivityScore: 0.35, domBinding: '[data-family-chip]', schemaKey: 'catalogFacet.verticalFilter', aliasBindings: ['[data-schema-input="catalogFacet.verticalFilter"]'] },
      { field: 'searchQuery', type: 'string', defaultValue: '', sobolTier: 1, sobolSensitivityScore: 0.45, domBinding: '#equipos-sku-search', schemaKey: 'catalogFacet.searchQuery', aliasBindings: ['[data-schema-input="catalogFacet.searchQuery"]', '#catalog-facet-search'] }
    ],
    outputsSchema: [
      { field: 'visibleSkuCount', unit: 'count', decimals: 0, isoPure: true, domBinding: '#catalog-visible-sku-count', schemaKey: 'catalogFacet.visibleSkuCount', aliasBindings: ['[data-schema-output="catalogFacet.visibleSkuCount"]'] },
      { field: 'catalogCardGrid', unit: 'dom', isoPure: false, domBinding: '[data-add-tray-sku]', schemaKey: 'catalogFacet.catalogCardGrid', aliasBindings: ['[data-schema-output="catalogFacet.catalogCardGrid"]'] }
    ],
    allowUnboundReasons: []
  },

  dropIn: {
    id: 'dropIn',
    rootSelector: '[data-domain-root="dropIn"]',
    islandComponent: 'CatalogFacetedIsland.astro',
    conceptRefs: ['quick_checkout_skus', 'workbench_lens_v2', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-27', 'ARB-SMAT-39', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/', '/en/', '/catalogo/', '/en/catalog/', '/equipos/', '/en/process-equipment/'],
    inputsSchema: [
      { field: 'rawPartQuery', type: 'string', defaultValue: '', sobolTier: 1, sobolSensitivityScore: 0.90, domBinding: '[data-dropin-input]', schemaKey: 'dropIn.rawPartQuery', aliasBindings: ['[data-schema-input="dropIn.rawPartQuery"]'] }
    ],
    outputsSchema: [
      { field: 'canonicalSkuId', unit: 'sku', isoPure: false, domBinding: '[data-dropin-result]', schemaKey: 'dropIn.canonicalSkuId', aliasBindings: ['[data-schema-output="dropIn.canonicalSkuId"]'] },
      { field: 'satTuple', unit: 'cfdi', isoPure: false, domBinding: '[data-dropin-result]', schemaKey: 'dropIn.satTuple', aliasBindings: ['[data-schema-output="dropIn.satTuple"]'] },
      { field: 'alloySuffix', unit: 'code', isoPure: false, domBinding: '[data-dropin-result]', schemaKey: 'dropIn.alloySuffix', aliasBindings: ['[data-schema-output="dropIn.alloySuffix"]'] },
      { field: 'normalizedRoot', unit: 'root', isoPure: false, domBinding: '[data-dropin-root]', schemaKey: 'dropIn.normalizedRoot', aliasBindings: ['[data-schema-output="dropIn.normalizedRoot"]'] }
    ],
    allowUnboundReasons: []
  },

  jrp: {
    id: 'jrp',
    rootSelector: '[data-domain-root="jrp"]',
    islandComponent: 'AtomicPartIsland.astro',
    conceptRefs: ['workbench_lens_v2', 'print_receipt', 'atomic_parts_13', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-43', 'ARB-SMAT-56', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/catalogo/[code]/', '/en/catalog/[code]/', '/productos/[slug]/', '/en/products/[slug]/', '/cotizar/', '/en/quote/', '/acuse/', '/en/thank-you/'],
    inputsSchema: [
      { field: 'predictedWearHours', type: 'number', min: 720, max: 18000, defaultValue: 2400, sobolTier: 1, sobolSensitivityScore: 0.46, domBinding: '#wb-jrp-wear-hours', schemaKey: 'jrp.predictedWearHours', aliasBindings: ['[data-schema-input="jrp.predictedWearHours"]'] },
      { field: 'operatingHoursPerDay', type: 'number', min: 1, max: 24, defaultValue: 24, sobolTier: 2, sobolSensitivityScore: 0.19, domBinding: '#wb-jrp-daily-hours', schemaKey: 'jrp.operatingHoursPerDay', aliasBindings: ['[data-schema-input="jrp.operatingHoursPerDay"]'] },
      { field: 'criticalityMode', type: 'enum', defaultValue: 'normal', sobolTier: 1, sobolSensitivityScore: 0.35, domBinding: '#wb-jrp-criticality', schemaKey: 'jrp.criticalityMode', aliasBindings: ['[data-schema-input="jrp.criticalityMode"]', '[data-jrp-crit-btn]'] },
      { field: 'coreReturnEnabled', type: 'boolean', defaultValue: false, sobolTier: 2, sobolSensitivityScore: 0.14, domBinding: '#wb-core-tradein-toggle', schemaKey: 'jrp.coreReturnEnabled', aliasBindings: ['[data-schema-input="jrp.coreReturnEnabled"]'] },
      { field: 'urgency', type: 'enum', defaultValue: 'programado', sobolTier: 1, sobolSensitivityScore: 0.25, domBinding: '[data-jrp-criticality-toggle]', schemaKey: 'jrp.urgency', aliasBindings: ['[data-schema-input="jrp.urgency"]'] },
      { field: 'trayItems', type: 'array', defaultValue: [], sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '[data-quick-order-tray]', schemaKey: 'jrp.trayItems', aliasBindings: ['[data-schema-input="jrp.trayItems"]'] }
    ],
    outputsSchema: [
      { field: 'sleeveInspectionDay', unit: 'd', decimals: 0, isoPure: true, domBinding: '#jrp-stage-1-days', schemaKey: 'jrp.sleeveInspectionDay', aliasBindings: ['[data-schema-output="jrp.sleeveInspectionDay"]'] },
      { field: 'impellerThroatbushSwapDay', unit: 'd', decimals: 0, isoPure: true, domBinding: '#jrp-stage-2-days', schemaKey: 'jrp.impellerThroatbushSwapDay', aliasBindings: ['[data-schema-output="jrp.impellerThroatbushSwapDay"]'] },
      { field: 'voluteLinerOverhaulDay', unit: 'd', decimals: 0, isoPure: true, domBinding: '#jrp-stage-3-days', schemaKey: 'jrp.voluteLinerOverhaulDay', aliasBindings: ['[data-schema-output="jrp.voluteLinerOverhaulDay"]'] },
      { field: 'reorderWindowDays', unit: 'd', decimals: 0, isoPure: true, domBinding: '#wb-jrp-window-days', schemaKey: 'jrp.reorderWindowDays', aliasBindings: ['[data-schema-output="jrp.reorderWindowDays"]'] },
      { field: 'rawLifeDays', unit: 'd', decimals: 0, isoPure: true, domBinding: '#wb-jrp-raw-life-days', schemaKey: 'jrp.rawLifeDays', aliasBindings: ['[data-schema-output="jrp.rawLifeDays"]'] },
      { field: 'eligible', unit: 'bool', isoPure: false, domBinding: '#wb-core-tradein-eligible', schemaKey: 'jrp.eligible', aliasBindings: ['[data-schema-output="jrp.eligible"]'] },
      { field: 'version', unit: 'int', decimals: 0, isoPure: true, domBinding: '#qtray-state-version', schemaKey: 'jrp.version', aliasBindings: ['[data-schema-output="jrp.version"]'] }
    ],
    allowUnboundReasons: []
  },

  erpExport: {
    id: 'erpExport',
    rootSelector: '[data-domain-root="erpExport"]',
    islandComponent: 'QuoteWizard.astro',
    conceptRefs: ['print_receipt', 'NAP', 'urgency', '301 Mappings', 'locale_pref', 'trust_charter', 'field_cases', 'faqs', 'engine_schema_v50', 'engine_schema_v51'],
    arbitrageRefs: ['ARB-SMAT-29', 'ARB-SMAT-53', 'ARB-SMAT-58', 'ARB-SMAT-59'],
    routes: ['/cotizar/', '/en/quote/', '/acuse/', '/en/thank-you/'],
    inputsSchema: [
      { field: 'quantity', type: 'number', min: 1, max: 500, defaultValue: 1, sobolTier: 1, sobolSensitivityScore: 0.25, domBinding: '#wb-erp-quantity', schemaKey: 'erpExport.quantity', aliasBindings: ['[data-schema-input="erpExport.quantity"]'] },
      { field: 'placa_ref', type: 'string', defaultValue: '', sobolTier: 2, sobolSensitivityScore: 0.10, domBinding: '#wb-client-ref', schemaKey: 'erpExport.placa_ref', aliasBindings: ['[data-schema-input="erpExport.placa_ref"]'] },
      { field: 'logistics_mode', type: 'enum', defaultValue: 'Retiro en Almacén Central Durango (Coordinación con Folio)', sobolTier: 2, sobolSensitivityScore: 0.12, domBinding: '#wb-destination', schemaKey: 'erpExport.logistics_mode', aliasBindings: ['[data-schema-input="erpExport.logistics_mode"]'] },
      { field: 'delivery_destination', type: 'string', defaultValue: 'Durango', sobolTier: 2, sobolSensitivityScore: 0.11, domBinding: '#wb-erp-destination', schemaKey: 'erpExport.delivery_destination', aliasBindings: ['[data-schema-input="erpExport.delivery_destination"]'] }
    ],
    outputsSchema: [
      { field: 'sapTsv', unit: 'tsv', isoPure: false, domBinding: '#wb-copy-tsv-btn', schemaKey: 'erpExport.sapTsv', aliasBindings: ['[data-schema-output="erpExport.sapTsv"]'] },
      { field: 'whatsappUrl', unit: 'url', isoPure: false, domBinding: '#wb-whatsapp-btn', schemaKey: 'erpExport.whatsappUrl', aliasBindings: ['[data-schema-output="erpExport.whatsappUrl"]'] },
      { field: 'acuseUrlParams', unit: 'url', isoPure: false, domBinding: '#wb-pdf-btn', schemaKey: 'erpExport.acuseUrlParams', aliasBindings: ['[data-schema-output="erpExport.acuseUrlParams"]'] }
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
 * Localiza la definición tipada de entrada o salida para un dominio y campo dado.
 * @param {string} domainId
 * @param {'inputsSchema'|'outputsSchema'} kind
 * @param {string} field
 * @returns {SchemaFieldBinding|SchemaOutputBinding|null}
 */
export function resolveSchemaFieldSpec(domainId, kind, field) {
  const schema = getEngineSchema(domainId);
  if (!schema || !Array.isArray(schema[kind])) return null;
  return schema[kind].find((entry) => entry.field === field) || null;
}

/**
 * Formatea una salida escalar o de texto conforme a ISO 80000-1 sin emitir HTML.
 *
 * @param {string} domainId
 * @param {string} field
 * @param {unknown} value
 * @param {'es'|'en'} [locale='es']
 * @returns {string}
 */
export function formatSchemaOutputValue(domainId, field, value, locale = 'es') {
  if (value === undefined || value === null || value === '') return '—';
  const spec = resolveSchemaFieldSpec(domainId, 'outputsSchema', field);
  const unit = spec?.unit || '';
  if (typeof value === 'boolean') {
    if (locale === 'en') return value ? 'Yes' : 'No';
    return value ? 'Sí' : 'No';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const decimals = typeof spec?.decimals === 'number'
      ? spec.decimals
      : (Math.abs(value) >= 100 ? 0 : 2);
    const numStr = decimals === 0 ? Math.round(value).toLocaleString('en-US') : value.toFixed(decimals);
    if (!unit || unit === '-' || unit === 'frac' || unit === 'int' || unit === 'count') return numStr;
    if (unit === '%' || unit === 'x' || unit === '×') return `${numStr}${unit}`;
    if (unit === 'pts') return `±${numStr} pts`;
    return `${numStr} ${unit}`;
  }
  return String(value);
}

/**
 * Recolecta todos los selectores #id declarados en inputsSchema y outputsSchema.
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
    } else if (fieldDef.type === 'array') {
      if (Array.isArray(raw)) {
        normalized[fieldDef.field] = raw;
      } else if (typeof raw === 'string' && raw.trim()) {
        normalized[fieldDef.field] = raw.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        normalized[fieldDef.field] = Array.isArray(fieldDef.defaultValue) ? [...fieldDef.defaultValue] : [];
      }
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
