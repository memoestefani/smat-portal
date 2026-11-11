/**
 * SMAT Minerals - Tribology, Metallurgy, Metrology & Material Compatibility Engine (SLICE-V31-02 / SLICE-V34-12)
 * Extraído por costura limpia LCOM4 desde slurryEngine.js (D2 + D8 + DEB-V34-08).
 */

function clamp(val, min, max, fallback) {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * 12 Anillos Intercambiables Estándar para Balanza de Densidad de Pulpa tipo Marcy (Ss 2.2 a 4.4)
 */
export const MARCY_STANDARD_RINGS = [2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4];

/**
 * Serie Maestra de Tamices Certificados ASTM E11 / ISO 3310-1 (Progresión 4√2 desde Malla #4 hasta #635 / 20 µm)
 */
export const ASTM_E11_SIEVE_TABLE = [
  { mesh: '#4', tylerEquivalent: '4 Mesh', apertureMicrons: 4750, apertureMm: 4.75, wireDiameterMm: 1.60 },
  { mesh: '#6', tylerEquivalent: '6 Mesh', apertureMicrons: 3350, apertureMm: 3.35, wireDiameterMm: 1.25 },
  { mesh: '#8', tylerEquivalent: '8 Mesh', apertureMicrons: 2360, apertureMm: 2.36, wireDiameterMm: 1.00 },
  { mesh: '#10', tylerEquivalent: '9 Mesh', apertureMicrons: 2000, apertureMm: 2.00, wireDiameterMm: 0.90 },
  { mesh: '#12', tylerEquivalent: '10 Mesh', apertureMicrons: 1700, apertureMm: 1.70, wireDiameterMm: 0.80 },
  { mesh: '#16', tylerEquivalent: '14 Mesh', apertureMicrons: 1180, apertureMm: 1.18, wireDiameterMm: 0.63 },
  { mesh: '#20', tylerEquivalent: '20 Mesh', apertureMicrons: 850, apertureMm: 0.85, wireDiameterMm: 0.50 },
  { mesh: '#30', tylerEquivalent: '28 Mesh', apertureMicrons: 600, apertureMm: 0.60, wireDiameterMm: 0.40 },
  { mesh: '#40', tylerEquivalent: '35 Mesh', apertureMicrons: 425, apertureMm: 0.425, wireDiameterMm: 0.28 },
  { mesh: '#50', tylerEquivalent: '48 Mesh', apertureMicrons: 300, apertureMm: 0.30, wireDiameterMm: 0.20 },
  { mesh: '#70', tylerEquivalent: '65 Mesh', apertureMicrons: 212, apertureMm: 0.212, wireDiameterMm: 0.14 },
  { mesh: '#100', tylerEquivalent: '100 Mesh', apertureMicrons: 150, apertureMm: 0.150, wireDiameterMm: 0.10 },
  { mesh: '#140', tylerEquivalent: '150 Mesh', apertureMicrons: 106, apertureMm: 0.106, wireDiameterMm: 0.071 },
  { mesh: '#200', tylerEquivalent: '200 Mesh', apertureMicrons: 75, apertureMm: 0.075, wireDiameterMm: 0.050 },
  { mesh: '#270', tylerEquivalent: '270 Mesh', apertureMicrons: 53, apertureMm: 0.053, wireDiameterMm: 0.036 },
  { mesh: '#325', tylerEquivalent: '325 Mesh', apertureMicrons: 45, apertureMm: 0.045, wireDiameterMm: 0.032 },
  { mesh: '#400', tylerEquivalent: '400 Mesh', apertureMicrons: 38, apertureMm: 0.038, wireDiameterMm: 0.025 },
  { mesh: '#500', tylerEquivalent: '500 Mesh', apertureMicrons: 25, apertureMm: 0.025, wireDiameterMm: 0.020 },
  { mesh: '#635', tylerEquivalent: '635 Mesh', apertureMicrons: 20, apertureMm: 0.020, wireDiameterMm: 0.016 }
];

/**
 * Selecciona el material tribológico óptimo según tamaño de partícula d80, concentración de sólidos Cw y pH.
 */
export function selectOptimalMaterial(d80Microns = 180, cwPercent = 45, pulpPh = 7.5) {
  const d80 = clamp(d80Microns, 10, 5000, 180);
  const cw = clamp(cwPercent, 1, 85, 45);
  const phVal = clamp(pulpPh, 1.0, 14.0, 7.5);
  const isCorrosiveAcidic = phVal < 4.0;
  if (isCorrosiveAcidic && d80 <= 300) {
    return {
      id: 'rubber',
      code: 'R55',
      materialKey: 'hule_natural',
      fractureToughnessMpaSqrtM: 12.0,
      wearMultiplierVsCr27: 0.85,
      isCorrosiveAcidic: true,
      spallingRiskDetected: false,
      nameEs: 'Caucho Natural Vulcanizado Resistente a Acidez (R55)',
      nameEn: 'Acid-Resistant Vulcanized Natural Rubber (R55)'
    };
  }
  if (phVal < 3.5 && d80 > 300 && d80 <= 800) {
    return {
      id: 'ceramica_sic',
      code: 'SiC',
      materialKey: 'ceramica_sic',
      fractureToughnessMpaSqrtM: 4.1,
      wearMultiplierVsCr27: 2.25,
      isCorrosiveAcidic: true,
      spallingRiskDetected: false,
      nameEs: 'Compuesto Cerámico Carburo de Silicio (SiC ≥ 2200 HV)',
      nameEn: 'Silicon Carbide (SiC ≥ 2200 HV) Ceramic Composite'
    };
  }
  if (d80 >= 300 || cw >= 50) {
    return {
      id: 'high_chrome',
      code: 'A05',
      materialKey: 'alto_cromo_cr27',
      fractureToughnessMpaSqrtM: 20.0,
      wearMultiplierVsCr27: 1.0,
      isCorrosiveAcidic,
      spallingRiskDetected: false,
      nameEs: 'Alto Cromo ASTM A532 Cr27% (>650 HB)',
      nameEn: 'High Chrome ASTM A532 Cr27% (>650 HB)'
    };
  }
  return {
    id: 'polyurethane',
    code: 'U01',
    materialKey: 'poliuretano',
    fractureToughnessMpaSqrtM: 14.0,
    wearMultiplierVsCr27: 1.15,
    isCorrosiveAcidic,
    spallingRiskDetected: false,
    nameEs: 'Poliuretano Grado Minero U01 (Shore A 85–95)',
    nameEn: 'Mining-Grade Polyurethane U01 (Shore A 85–95)'
  };
}

export function calculateMarcyScaleReading(params = {}) {
  let ss = clamp(params.solidsSpecificGravity ?? params.solidsSg ?? params.oreDensitySg, 1.8, 5.2, 2.8);

  let rhoP;
  let cwPercent;
  const rawRhoInput = params.pulpDensityKgL ?? params.pulpDensitySg;

  if (params.solveFor === 'ore_density_rhop' && typeof rawRhoInput === 'number' && !Number.isNaN(rawRhoInput)) {
    rhoP = clamp(rawRhoInput, 1.01, 4.5, 1.40);
    cwPercent = clamp(params.solidsWeightPercent ?? params.weightPercentSolids, 1, 90, 45);
    const denom = 100 - rhoP * (100 - cwPercent);
    if (denom > 0.01) {
      ss = clamp((rhoP * cwPercent) / denom, 1.8, 5.2, 2.8);
    }
  } else if (typeof rawRhoInput === 'number' && !Number.isNaN(rawRhoInput)) {
    const maxRho = ss * 0.85 + 0.15;
    rhoP = clamp(rawRhoInput, 1.01, maxRho, 1.40);
    const rawCw = (100 * ss * (rhoP - 1.0)) / (rhoP * (ss - 1.0));
    cwPercent = clamp(rawCw, 1, 90, 45);
  } else {
    cwPercent = clamp(params.solidsWeightPercent ?? params.weightPercentSolids, 1, 88, 45);
    rhoP = (100 * ss) / (cwPercent + ss * (100 - cwPercent));
  }

  const cvPercent = (cwPercent / ss) / ((cwPercent / ss) + (100 - cwPercent)) * 100;
  const cupNetMassGrams = Math.round(rhoP * 1000);
  const drySolidsMassGramsInCup = Math.round(cupNetMassGrams * (cwPercent / 100));

  let recommendedRingSg = MARCY_STANDARD_RINGS[0];
  let minDiff = Math.abs(ss - recommendedRingSg);
  for (const ringSg of MARCY_STANDARD_RINGS) {
    const diff = Math.abs(ss - ringSg);
    if (diff < minDiff) {
      minDiff = diff;
      recommendedRingSg = ringSg;
    }
  }

  const ringApparentCw = clamp(
    (100 * recommendedRingSg * (rhoP - 1.0)) / (rhoP * (recommendedRingSg - 1.0)),
    1,
    95,
    cwPercent
  );
  const genericRing26Cw = clamp(
    (100 * 2.6 * (rhoP - 1.0)) / (rhoP * (2.6 - 1.0)),
    1,
    95,
    cwPercent
  );
  const wrongRingBiasPoints = Number(Math.abs(cwPercent - genericRing26Cw).toFixed(1));
  const roundedRhoP = Number(rhoP.toFixed(3));

  return {
    solidsSpecificGravity: Number(ss.toFixed(2)),
    oreDensitySg: Number(ss.toFixed(2)),
    pulpDensityKgL: roundedRhoP,
    pulpDensitySg: roundedRhoP,
    slurryDensityKgL: roundedRhoP,
    solidsWeightPercent: Number(cwPercent.toFixed(1)),
    solidsVolumePercent: Number(cvPercent.toFixed(1)),
    cupNetMassGrams,
    drySolidsMassGramsInCup,
    recommendedRingSg: Number(recommendedRingSg.toFixed(1)),
    ringApparentCw: Number(ringApparentCw.toFixed(1)),
    wrongRingBiasPoints,
    recommendedContainerEs: cwPercent >= 45
      ? 'Vaso de 1000 cm³ en Acero Inoxidable 304 (alta abrasión en molienda/ciclones)'
      : 'Vaso de 1000 cm³ en Acrílico o Acero Inoxidable 304 (flotación y espesamiento)',
    recommendedContainerEn: cwPercent >= 45
      ? '1000 cm³ 304 Stainless Steel Container (high-abrasion grinding/cyclone duty)'
      : '1000 cm³ Clear Acrylic or 304 Stainless Container (flotation & thickener duty)'
  };
}

/**
 * Calcula la Masa Mínima Representativa de Muestra según la Teoría de Muestreo de Pierre Gy:
 * Ms = (c * d_n^3) / s_FSE^2
 * y determina el régimen de desaguado en el Filtro de Presión Batch de Laboratorio SMAT.
 */
export function calculateGyMinimumSampleMass(params = {}) {
  const rawMm = params.topSizeD95Mm ?? (params.d95Cm !== undefined ? Number(params.d95Cm) * 10.0 : 2.0);
  const dMm = clamp(rawMm, 0.02, 25.0, 2.0);
  const ss = clamp(params.solidsSpecificGravity ?? params.solidsSg, 1.8, 5.2, 2.8);
  const libMicrons = clamp(params.liberationSizeMicrons, 5, 2000, 100);
  const oreGrade = clamp(params.oreGradeDecimal, 0.0001, 0.80, 0.02);

  const cConst = clamp(params.samplingConstantC, 0.2, 15.0, 1.6);
  const sFse = clamp(params.targetRelativeStdError ?? params.relativeVarianceError ?? params.samplingRelativeVariance, 0.01, 0.20, 0.05);
  const cw = clamp(params.solidsWeightPercent, 10, 80, 40);

  const rawPressure = String(params.airPressurePsi ?? '80 - 100 psi').trim();
  const numPressure = Number(params.airPressurePsi);
  const isHighPressure = (!Number.isNaN(numPressure) && numPressure >= 80) || rawPressure.includes('100') || rawPressure.includes('90');
  const numericAirPressurePsi = !Number.isNaN(numPressure) && numPressure > 0 ? numPressure : (isHighPressure ? 90 : 70);
  const recommendedAirPressurePsi = isHighPressure
    ? '80 - 100 psi (5.5 - 6.9 bar)'
    : '60 - 80 psi (4.1 - 5.5 bar)';
  const estimatedCycleMinutes = isHighPressure ? 6 : 9;
  const residualCakeMoisturePct = isHighPressure ? 9.5 : 12.5;

  const dCm = dMm / 10.0;
  const theoreticalGrams = (cConst * Math.pow(dCm, 3)) / Math.pow(sFse, 2);
  const minDrySampleGrams = Math.max(250, Math.round(theoreticalGrams));
  const minDrySampleKg = Number((minDrySampleGrams / 1000).toFixed(2));

  const slurryRho = (100 * ss) / (cw + ss * (100 - cw));
  const wetSlurryMassGrams = minDrySampleGrams / (cw / 100);
  const requiredPulpLiters = Number((wetSlurryMassGrams / (slurryRho * 1000)).toFixed(2));
  const batchFilterCycles = Math.max(1, Math.ceil(requiredPulpLiters / 8.0));

  return {
    topSizeD95Mm: Number(dMm.toFixed(2)),
    solidsSpecificGravity: Number(ss.toFixed(2)),
    samplingConstantC: Number(cConst.toFixed(2)),
    liberationSizeMicrons: Math.round(libMicrons),
    oreGradeDecimal: Number(oreGrade.toFixed(4)),
    targetRelativeStdError: Number(sFse.toFixed(4)),
    targetRelativeStdErrorPercent: Number((sFse * 100).toFixed(1)),
    theoreticalGyGrams: Number(theoreticalGrams.toFixed(1)),
    minDrySampleGrams,
    minDrySampleKg,
    minimumSampleMassKg: minDrySampleKg,
    requiredPulpLiters,
    slurrySampleLiters: requiredPulpLiters,
    wetPulpVolumeLiters: requiredPulpLiters,
    batchFilterCycles,
    airPressurePsi: numericAirPressurePsi,
    recommendedAirPressurePsi,
    estimatedCycleMinutes,
    recommendedCycleMinutes: estimatedCycleMinutes,
    residualCakeMoisturePct,
    estimatedCakeMoisturePct: residualCakeMoisturePct,
    filterPressStatus: batchFilterCycles === 1 ? '1 carga directa' : `${batchFilterCycles} cargas (Fraccionar)`,
    recommendationEs: batchFilterCycles === 1
      ? `Carga directa en 1 ciclo del Filtro de Presión Batch SMAT (${requiredPulpLiters} L de pulpa a ${recommendedAirPressurePsi}, ~${estimatedCycleMinutes} min)`
      : `Fraccionar con cuarteador de rifle o procesar en ${batchFilterCycles} cargas del Filtro Batch SMAT (${recommendedAirPressurePsi}, ~${estimatedCycleMinutes * batchFilterCycles} min totales)`,
    recommendationEn: batchFilterCycles === 1
      ? `Direct single-charge dewatering in SMAT Batch Pressure Filter (${requiredPulpLiters} L pulp at ${recommendedAirPressurePsi}, ~${estimatedCycleMinutes} min)`
      : `Split via riffle splitter or process across ${batchFilterCycles} SMAT Batch Filter charges (${recommendedAirPressurePsi}, ~${estimatedCycleMinutes * batchFilterCycles} min total)`
  };
}

/**
 * Selecciona la columna óptima de Tamices Certificados ASTM E11 / ISO 3310-1 centrada en el P80 objetivo
 * y calcula la distribución granulométrica completa y coordenada doble-logarítmica de Rosin-Rammler y' = log10(log10(100 / R)).
 */
export function recommendAstmSieveSeries(params = {}) {
  const targetP80 = clamp(params.targetP80Microns, 20, 3350, 150);
  const rawMode = String(params.screeningMode || 'auto').toLowerCase();
  const wetScreeningRequired = rawMode === 'dry' ? false : (rawMode === 'wet' ? true : targetP80 <= 150);
  const mode = wetScreeningRequired ? 'wet' : 'dry';
  const frameDiameterInches = Number(params.frameDiameterInches) === 12 ? 12 : 8;
  const retainedR = clamp(params.retainedPercentAtP80, 1, 99, 20);

  let closestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < ASTM_E11_SIEVE_TABLE.length; i++) {
    const dist = Math.abs(Math.log(ASTM_E11_SIEVE_TABLE[i].apertureMicrons) - Math.log(targetP80));
    if (dist < bestDist) {
      bestDist = dist;
      closestIdx = i;
    }
  }

  const stackLen = params.retainedPercentAtP80 !== undefined && params.topSizeD95Mm === undefined ? 6 : 7;
  const startIdx = Math.max(0, Math.min(closestIdx - 2, ASTM_E11_SIEVE_TABLE.length - stackLen));
  const rawSieves = ASTM_E11_SIEVE_TABLE.slice(startIdx, startIdx + stackLen);
  const primaryControlSieve = ASTM_E11_SIEVE_TABLE[closestIdx];

  const rosinRammlerYPrime = Number(Math.log10(Math.log10(100.0 / retainedR)).toFixed(4));
  const rosinRammlerSlopeN = Number(clamp(params.rosinRammlerSlopeN, 0.4, 2.5, targetP80 <= 106 ? 1.25 : 1.08).toFixed(2));
  const requiresStainless = wetScreeningRequired;
  const frameMaterialLabel = requiresStainless ? 'Acero Inoxidable 304/316' : 'Bronce / Acero Inox';

  const kScale = Math.log(100.0 / retainedR);
  let prevCumRetained = 0.0;
  const selectedSieves = rawSieves.map((s) => {
    const ratio = s.apertureMicrons / targetP80;
    const rawR = 100.0 * Math.exp(-kScale * Math.pow(ratio, rosinRammlerSlopeN));
    const cumulativeRetainedPct = Number(clamp(rawR, 0.1, 99.9, 20.0).toFixed(1));
    const retainedIndividualPct = Number(Math.max(0.1, cumulativeRetainedPct - prevCumRetained).toFixed(1));
    prevCumRetained = cumulativeRetainedPct;
    const cumulativePassingPct = Number((100.0 - cumulativeRetainedPct).toFixed(1));
    const rosinRammlerY = Number(Math.log10(Math.log10(100.0 / cumulativeRetainedPct)).toFixed(4));
    return {
      ...s,
      sieveNumber: s.mesh,
      frameMaterial: frameMaterialLabel,
      frameDiameterInches,
      cumulativeRetainedPct,
      retainedIndividualPct,
      cumulativePassingPct,
      rosinRammlerY,
      isPrimaryP80Control: s.mesh === primaryControlSieve.mesh
    };
  });

  return {
    targetP80Microns: targetP80,
    screeningMode: mode,
    wetScreeningRequired,
    frameDiameterInches,
    primaryControlMesh: primaryControlSieve.mesh,
    primaryApertureMicrons: primaryControlSieve.apertureMicrons,
    sieveStack: selectedSieves,
    recommendedSeries: selectedSieves.slice(0, 6),
    sieveStackSummary: selectedSieves.map((s) => `${s.mesh} (${s.apertureMicrons} µm)`).join(' ➔ '),
    rosinRammlerYPrime,
    rosinRammlerSlopeN,
    retainedPercentAtP80: retainedR,
    characteristicSizeD63Microns: Math.round(targetP80 * Math.pow(1.0 / kScale, 1.0 / rosinRammlerSlopeN)),
    recommendedFrameMaterialEs: requiresStainless
      ? `Marco y Malla en Acero Inoxidable Certificado ASTM E11 (${frameDiameterInches}") + Tapa y Cazuela`
      : `Marco en Bronce o Acero Inoxidable Certificado ASTM E11 (${frameDiameterInches}") + Tapa y Cazuela`,
    recommendedFrameMaterialEn: requiresStainless
      ? `ASTM E11 Certified Full Stainless Steel Frame & Cloth (${frameDiameterInches}") + Cover & Pan`
      : `ASTM E11 Certified Brass or Stainless Steel Frame (${frameDiameterInches}") + Cover & Pan`
  };
}

/**
 * Matriz Canónica Unificada de Materiales en Contacto Húmedo (Arbitrajes #5 y #8, INV-SMAT-SCI-01, INV-SMAT-SCI-09, INV-SMAT-SCI-13)
 */
export const WET_END_MATERIAL_MATRIX = {
  alto_cromo: {
    id: 'alto_cromo',
    key: 'alto_cromo_cr27',
    code: 'A05',
    nameEs: 'Alto Cromo 27% (≥ 650 HB)',
    nameEn: '27% High Chrome White Iron (≥ 650 HB)',
    visualCueEs: 'Acabado Metálico Maquinado / Esmalte Azul',
    visualCueEn: 'Machined Specular Metallic / Blue Enamel',
    swatchHex: '#1E3A8A',
    accentHex: '#64748B',
    hardness: '≥ 650 HB (60–62 HRC)',
    fractureToughnessMpaSqrtM: 20.0,
    wearMultiplierVsCr27: 1.0,
    maxTipSpeedMs: 32.0,
    d80RangeMicrons: [150, 6000],
    phRange: [4.0, 12.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.75,
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Impulsor Cerrado 5 Álabes', 'Voluta Monolítica (1 pieza)', 'Cuello de Succión (Throatbush)', 'Plato Posterior (FPL Insert)'],
    partsIncludedEn: ['Closed 5-Vane Impeller', 'Monolithic Volute (1-piece)', 'Suction Throatbush', 'Frame Plate Liner Insert (FPL Insert)'],
    dutyApplicationEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    dutyApplicationEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.',
    idealForEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    idealForEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.'
  },
  alto_cromo_cr27: {
    id: 'alto_cromo',
    key: 'alto_cromo_cr27',
    code: 'A05',
    nameEs: 'Alto Cromo 27% (≥ 650 HB)',
    nameEn: '27% High Chrome White Iron (≥ 650 HB)',
    visualCueEs: 'Acabado Metálico Maquinado / Esmalte Azul',
    visualCueEn: 'Machined Specular Metallic / Blue Enamel',
    swatchHex: '#1E3A8A',
    accentHex: '#64748B',
    hardness: '≥ 650 HB (60–62 HRC)',
    fractureToughnessMpaSqrtM: 20.0,
    wearMultiplierVsCr27: 1.0,
    maxTipSpeedMs: 32.0,
    d80RangeMicrons: [150, 6000],
    phRange: [4.0, 12.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.75,
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Impulsor Cerrado 5 Álabes', 'Voluta Monolítica (1 pieza)', 'Cuello de Succión (Throatbush)', 'Plato Posterior (FPL Insert)'],
    partsIncludedEn: ['Closed 5-Vane Impeller', 'Monolithic Volute (1-piece)', 'Suction Throatbush', 'Frame Plate Liner Insert (FPL Insert)'],
    dutyApplicationEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    dutyApplicationEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.',
    idealForEs: 'Descarga de molino SAG/bolas, alimentación primaria a hidrociclones y partículas gruesas con bordes cortantes.',
    idealForEn: 'SAG/ball mill discharge, primary hydrocyclone feed, and coarse sharp-edged ore particles.'
  },
  hule: {
    id: 'hule',
    key: 'hule_natural',
    code: 'R55',
    nameEs: 'Hule Natural Antiabrasivo (Shore A 55–65)',
    nameEn: 'Wear-Resistant Natural Rubber (Shore A 55–65)',
    visualCueEs: 'Elastómero Negro Mate Moldeado por Compresión',
    visualCueEn: 'Compression-Molded Matte Black Elastomer',
    swatchHex: '#18181B',
    accentHex: '#3F3F46',
    hardness: 'Shore A 55–65',
    fractureToughnessMpaSqrtM: 12.0,
    wearMultiplierVsCr27: 0.85,
    maxTipSpeedMs: 24.5,
    d80RangeMicrons: [10, 150],
    phRange: [3.5, 11.0],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.85,
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor Revestido en Hule'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Rubber-Lined Impeller'],
    dutyApplicationEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    dutyApplicationEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.',
    idealForEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    idealForEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.'
  },
  hule_natural: {
    id: 'hule',
    key: 'hule_natural',
    code: 'R55',
    nameEs: 'Hule Natural Antiabrasivo (Shore A 55–65)',
    nameEn: 'Wear-Resistant Natural Rubber (Shore A 55–65)',
    visualCueEs: 'Elastómero Negro Mate Moldeado por Compresión',
    visualCueEn: 'Compression-Molded Matte Black Elastomer',
    swatchHex: '#18181B',
    accentHex: '#3F3F46',
    hardness: 'Shore A 55–65',
    fractureToughnessMpaSqrtM: 12.0,
    wearMultiplierVsCr27: 0.85,
    maxTipSpeedMs: 24.5,
    d80RangeMicrons: [10, 150],
    phRange: [3.5, 11.0],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.85,
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor Revestido en Hule'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Rubber-Lined Impeller'],
    dutyApplicationEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    dutyApplicationEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.',
    idealForEs: 'Circuitos de flotación, espesadores y colas/jales finos (d80 < 150 µm) sin partículas cortantes gruesas.',
    idealForEn: 'Flotation circuits, thickeners, and fine tailings (d80 < 150 µm) free of coarse tramp metal or sharp rock.'
  },
  poliuretano: {
    id: 'poliuretano',
    key: 'poliuretano',
    code: 'U01',
    nameEs: 'Poliuretano Elastómero (Shore A 85–95)',
    nameEn: 'Cast Polyurethane Elastomer (Shore A 85–95)',
    visualCueEs: 'Alta Cromaticidad Amarillo / Rojo Industrial',
    visualCueEn: 'High-Chroma Industrial Yellow / Red',
    swatchHex: '#EAB308',
    accentHex: '#DC2626',
    hardness: 'Shore A 85–95',
    fractureToughnessMpaSqrtM: 14.0,
    wearMultiplierVsCr27: 1.15,
    maxTipSpeedMs: 26.0,
    d80RangeMicrons: [20, 350],
    phRange: [2.0, 11.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.80,
    wetEndArchitecture: 'split_molded_liners_fpl_cpl',
    partsIncludedEs: ['Forro Lado Soporte (Frame Plate Liner)', 'Forro Lado Succión (Cover Plate Liner)', 'Cuello de Succión (Throatbush)', 'Impulsor / Expulsor en Poliuretano'],
    partsIncludedEn: ['Frame Plate Liner (FPL)', 'Cover Plate Liner (CPL)', 'Suction Throatbush', 'Polyurethane Impeller / Expeller'],
    dutyApplicationEs: 'Baterías de hidrociclones, remolienda y pulpas finas a medias con alta velocidad superficial o pH ácido.',
    dutyApplicationEn: 'Hydrocyclone clusters, regrind duties, and fine-to-medium slurries with high velocity or acidic pH.',
    idealForEs: 'Baterías de hidrociclones, remolienda y pulpas finas a medias con alta velocidad superficial o pH ácido.',
    idealForEn: 'Hydrocyclone clusters, regrind duties, and fine-to-medium slurries with high velocity or acidic pH.'
  },
  ceramica_sic: {
    id: 'ceramica_sic',
    key: 'ceramica_sic',
    code: 'SiC',
    nameEs: 'Compuesto Cerámico Carburo de Silicio (SiC)',
    nameEn: 'Silicon Carbide (SiC) Ceramic Composite',
    visualCueEs: 'Matriz Gris Grafito Sinterizada',
    visualCueEn: 'Sintered Graphite-Gray Ceramic Matrix',
    swatchHex: '#334155',
    accentHex: '#0F172A',
    hardness: '≥ 2200 HV (Mohs 9.2)',
    fractureToughnessMpaSqrtM: 4.1,
    wearMultiplierVsCr27: 2.25,
    maxTipSpeedMs: 28.0,
    d80RangeMicrons: [30, 800],
    phRange: [1.0, 13.5],
    wearRatio554: '5:5:4',
    recommendedClearanceMm: 0.65,
    wetEndArchitecture: 'monolithic_volute_plus_fpl_insert',
    partsIncludedEs: ['Cuello de Succión SiC (Throatbush)', 'Voluta Compuesta SiC', 'Impulsor Alto Cromo / SiC'],
    partsIncludedEn: ['SiC Suction Throatbush', 'SiC Composite Volute', 'High Chrome / SiC Impeller'],
    dutyApplicationEs: 'Alimentación de alta presión a hidrociclones y pulpas de sílice extrema con pH agresivo.',
    dutyApplicationEn: 'High-pressure hydrocyclone feed and extreme silica slurries with aggressive pH.',
    idealForEs: 'Alimentación de alta presión a hidrociclones y pulpas de sílice extrema con pH agresivo.',
    idealForEn: 'High-pressure hydrocyclone feed and extreme silica slurries with aggressive pH.'
  }
};

export const WET_END_MATERIAL_KITS = WET_END_MATERIAL_MATRIX;

export * from './pumpAssemblyAndDriveEngine.js';
