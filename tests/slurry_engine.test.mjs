import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSlurryMetrics, SLURRY_PRESETS, MECHANICAL_DIAGNOSTICS } from '../src/scripts/slurryEngine.js';

test('1. Cálculo de Pulpa Gruesa de Molienda (A05 Recomendado por Alto Impacto)', () => {
  const result = calculateSlurryMetrics({
    flowM3H: 220,
    solidsWeightPercent: 55,
    particleSizeD80Microns: 250,
    solidsSpecificGravity: 2.75,
    pipeDiameterMm: 200
  });

  const { results } = result;

  assert.ok(results.slurrySpecificGravity > 1.45 && results.slurrySpecificGravity < 1.65, 'Gravedad específica de pulpa debe estar en rango minero');
  assert.ok(results.criticalSettlingVelocityMs > 1.5 && results.criticalSettlingVelocityMs < 4.0, 'Velocidad crítica de Durand debe ser coherente');
  
  assert.equal(results.recommendedMaterial, 'A05', 'Partículas >150 µm deben recomendar High Chrome A05');
  assert.ok(results.wearLifeRatio >= 2.5, 'El ratio de vida útil de A05 debe superar al elastómero en partículas gruesas');
  assert.ok(results.estimatedImpellerLifeHours > 800, 'Estimación de horas de impulsor debe ser realista');
});

test('2. Cálculo de Finos de Flotación (Caucho Recomendado por Rebote Elástico)', () => {
  const result = calculateSlurryMetrics({
    flowM3H: 120,
    solidsWeightPercent: 28,
    particleSizeD80Microns: 45,
    solidsSpecificGravity: 2.65,
    pipeDiameterMm: 150
  });

  const { results } = result;

  assert.equal(results.recommendedMaterial, 'RUBBER', 'Finos <75 µm con baja concentración deben recomendar Caucho');
  assert.ok(results.materialNameEs.includes('Caucho Natural'), 'Nombre en español debe reflejar elastómero');
  assert.ok(results.rationaleEs.includes('rebote elástico'), 'La justificación debe explicar el mecanismo de desgaste');
});

test('3. Detección de Riesgo de Sedimentación (Velocidad Insuficiente)', () => {
  const result = calculateSlurryMetrics({
    flowM3H: 15,
    solidsWeightPercent: 50,
    particleSizeD80Microns: 300,
    pipeDiameterMm: 250
  });

  const { results } = result;
  assert.equal(results.flowCondition, 'settling_risk', 'Debe alertar sobre riesgo de sedimentación');
  assert.ok(results.flowConditionText.includes('sedimentación'), 'El texto debe advertir al operador');
});

test('4. Resiliencia y Sanitización de Entradas Fuera de Límite', () => {
  const result = calculateSlurryMetrics({
    flowM3H: -500,
    solidsWeightPercent: 120,
    particleSizeD80Microns: 0,
    solidsSpecificGravity: 'invalid'
  });

  assert.ok(result.results.slurrySpecificGravity > 1.0, 'Debe calcular con límites sanitizados');
  assert.ok(result.results.criticalSettlingVelocityMs > 0, 'La velocidad crítica debe ser positiva');
});

test('5. Verificación de Presets Mineros Canónicos (Decisión 3-C)', () => {
  assert.ok(SLURRY_PRESETS.sag_primary, 'Debe existir preset SAG');
  assert.ok(SLURRY_PRESETS.flotation_rougher, 'Debe existir preset Flotación');
  assert.ok(SLURRY_PRESETS.tailings_thickened, 'Debe existir preset Jales Espesados');
  assert.ok(SLURRY_PRESETS.emergency_6x4, 'Debe existir preset Emergencia 6x4');

  // Test SAG calculation
  const sagRes = calculateSlurryMetrics(SLURRY_PRESETS.sag_primary);
  assert.equal(sagRes.results.recommendedMaterial, 'A05', 'SAG primario debe requerir A05');

  // Test Flotation calculation
  const flotRes = calculateSlurryMetrics(SLURRY_PRESETS.flotation_rougher);
  assert.equal(flotRes.results.recommendedMaterial, 'RUBBER', 'Flotación finos debe requerir Caucho');
});

test('6. Verificación de Diagnósticos de Fallas Mecánicas (Decisión 1-A)', () => {
  assert.ok(MECHANICAL_DIAGNOSTICS.cavitation, 'Diagnóstico de cavitación presente');
  assert.ok(MECHANICAL_DIAGNOSTICS.liner_grooving, 'Diagnóstico de surcos presente');
  assert.ok(MECHANICAL_DIAGNOSTICS.bearing_vibration, 'Diagnóstico de vibración presente');
  assert.ok(MECHANICAL_DIAGNOSTICS.packing_leak, 'Diagnóstico de fuga de empaque presente');
  
  assert.ok(MECHANICAL_DIAGNOSTICS.bearing_vibration.actionEs.includes('balanceo dinámico'), 'Debe incluir directiva de balanceo dinámico');
});

test('7. Corrección por Altitud Minera y Derating de Motor (Decisión 5-A)', async () => {
  const { calculateAltitudeCorrection } = await import('../src/scripts/slurryEngine.js');
  
  // Test nivel del mar (0 msnm)
  const sea = calculateAltitudeCorrection(0);
  assert.equal(sea.pAtmHeadMca, 10.33, 'A 0 msnm Patm debe ser 10.33 mca');
  assert.equal(sea.deltaNpshLossM, 0, 'A 0 msnm no hay pérdida de NPSH');
  assert.equal(sea.motorDeratingFactor, 1.0, 'A 0 msnm factor de motor es 1.0');

  // Test meseta (1500 msnm)
  const meseta = calculateAltitudeCorrection(1500);
  assert.ok(meseta.pAtmHeadMca < 9.0 && meseta.pAtmHeadMca > 8.5, 'A 1500 msnm Patm debe estar entre 8.5 y 9.0 mca');
  assert.ok(meseta.deltaNpshLossM > 1.5, 'Pérdida de NPSH debe ser mayor a 1.5 m');
  assert.equal(meseta.altitudeTier, 'mid_altitude', 'Tier debe ser meseta');

  // Test sierra minera (2400 msnm)
  const sierra = calculateAltitudeCorrection(2400);
  assert.ok(sierra.pAtmHeadMca < 7.8 && sierra.pAtmHeadMca > 7.5, 'A 2400 msnm Patm debe rondar 7.66 mca');
  assert.ok(sierra.motorDeratingFactor < 0.90, 'Motor IEC debe sufrir derating térmico a 2400m');
  assert.equal(sierra.altitudeTier, 'high_altitude', 'Tier debe ser sierra');

  // Test integration in calculateSlurryMetrics
  const resAltitude = calculateSlurryMetrics({
    flowM3H: 200,
    solidsWeightPercent: 45,
    particleSizeD80Microns: 180,
    altitudeM: 2400
  });
  assert.ok(resAltitude.results.altitudeCorrection, 'Resultado de métricas debe incluir datos de altitud');
  assert.equal(resAltitude.results.altitudeCorrection.altitudeM, 2400, 'Altitud debe reflejar 2400 msnm');
  assert.ok(resAltitude.results.altitudeCorrection.deltaNpshLossM > 2.5, 'Pérdida de NPSH calculada');
});

test('8. Ecuación Bidireccional de Balanza Marcy y Selección de 12 Anillos Ss (2.2 a 4.4)', async () => {
  const { calculateMarcyScaleReading, MARCY_STANDARD_RINGS } = await import('../src/scripts/slurryEngine.js');

  assert.equal(MARCY_STANDARD_RINGS.length, 12, 'Deben existir los 12 anillos estándar de 2.2 a 4.4');

  // Mineral polimetálico Ss = 3.2 con densidad de pulpa 1.50 kg/L
  const reading = calculateMarcyScaleReading({
    solidsSpecificGravity: 3.2,
    pulpDensityKgL: 1.50
  });

  assert.equal(reading.recommendedRingSg, 3.2, 'Debe seleccionar el anillo exacto Ss = 3.2');
  assert.equal(reading.cupNetMassGrams, 1500, 'Vaso de 1000 cm³ a 1.50 kg/L debe pesar 1500 g netos');
  assert.ok(reading.solidsWeightPercent > 48 && reading.solidsWeightPercent < 49, 'Cw debe ser ~48.5% según ecuación de Marcy');
  assert.ok(reading.wrongRingBiasPoints > 4.0, 'Usar anillo incorrecto 2.6 en mineral 3.2 genera sesgo > 4 puntos porcentuales');

  // Modo inverso: de % Sólidos Cw a densidad de pulpa ρp
  const inverse = calculateMarcyScaleReading({
    solidsSpecificGravity: 2.8,
    solidsWeightPercent: 50
  });
  assert.equal(inverse.pulpDensityKgL, 1.474, 'A Ss=2.8 y Cw=50%, ρp debe ser exacto 280/190 = 1.474 kg/L');
  assert.equal(inverse.recommendedRingSg, 2.8, 'Debe recomendar el anillo 2.8');
});

test('9. Masa Mínima Representativa de Pierre Gy y Dimensionamiento de Filtro Batch de Laboratorio', async () => {
  const { calculateGyMinimumSampleMass } = await import('../src/scripts/slurryEngine.js');

  // Muestra gruesa de descarga de molino (d95 = 6 mm)
  const coarse = calculateGyMinimumSampleMass({
    topSizeD95Mm: 6.0,
    samplingConstantC: 1.6,
    targetRelativeStdError: 0.05,
    solidsWeightPercent: 50
  });

  assert.ok(coarse.minDrySampleGrams >= 250, 'Debe respetar piso físico de laboratorio');
  assert.ok(coarse.requiredPulpLiters > 0.2, 'Debe calcular litros equivalentes de pulpa');
  assert.ok(coarse.recommendedAirPressurePsi.includes('100 psi'), 'Debe especificar rango neumático de 80-100 psi');
});

test('10. Selección de Serie de Tamices ASTM E11 / ISO 3310 y Transformación de Rosin-Rammler', async () => {
  const { recommendAstmSieveSeries, ASTM_E11_SIEVE_TABLE } = await import('../src/scripts/slurryEngine.js');

  // Verificar que la tabla incluye hasta malla #635 (20 micrones) según folleto SMAT
  const finest = ASTM_E11_SIEVE_TABLE[ASTM_E11_SIEVE_TABLE.length - 1];
  assert.equal(finest.mesh, '#635', 'El tamiz más fino debe ser malla #635');
  assert.equal(finest.apertureMicrons, 20, 'Malla #635 corresponde a 20 micrones');

  // Serie centrada en P80 = 75 µm (Malla #200) en húmedo
  const series = recommendAstmSieveSeries({
    targetP80Microns: 75,
    screeningMode: 'wet',
    retainedPercentAtP80: 20
  });

  assert.equal(series.primaryControlMesh, '#200', 'P80 de 75 µm debe centrarse en Malla #200');
  assert.equal(series.sieveStack.length, 6, 'Debe recomendar una columna de 6 tamices ASTM E11');
  assert.ok(series.recommendedFrameMaterialEs.includes('Acero Inoxidable'), 'Tamizado húmedo fino exige Acero Inoxidable');
  assert.ok(series.rosinRammlerYPrime < -0.15 && series.rosinRammlerYPrime > -0.16, 'Rosin-Rammler y\' para R=20% debe ser ~ -0.1555');
});

test('11. Matrices de Interferencia en Despiece Bifurcado (Metal vs Hule/PU) y Calibración Axial Post-Armado (Arbitraje #6)', async () => {
  const { evaluatePumpAssemblySequence, PUMP_ASSEMBLY_STATIONS, WET_END_MATERIAL_MATRIX } = await import('../src/scripts/slurryEngine.js');

  assert.equal(PUMP_ASSEMBLY_STATIONS.length, 5, 'El reporte de armado debe constar de 5 estaciones canónicas');
  assert.ok(WET_END_MATERIAL_MATRIX.alto_cromo && WET_END_MATERIAL_MATRIX.hule && WET_END_MATERIAL_MATRIX.poliuretano, 'Debe definir la tríada de materiales Alto Cromo, Hule y Poliuretano');

  // 1) Rama Metálica con claro axial calibrado (0.75 mm dentro de [0.5, 1.0] mm)
  const metalOk = evaluatePumpAssemblySequence({
    wetEndBranch: 'metal',
    sealBranch: 'expeller_dry',
    frontClearanceMm: 0.75,
    impellerExitWidthMm: 48
  });
  assert.equal(metalOk.isValidAssembly, true, 'Secuencia canónica metálica debe tener Ng=0 y Ns=0');
  assert.equal(metalOk.geometricInterferencesNg, 0, 'Cero colisiones geométricas');
  assert.equal(metalOk.clearanceStatus, 'OPTIMAL_CALIBRATION', '0.75 mm debe estar en la banda óptima [0.5, 1.0] mm');
  assert.ok(metalOk.canonicalSequence.includes('monolithic_volute') && metalOk.canonicalSequence.includes('fpl_insert'), 'Rama metálica usa Voluta Monolítica + FPL Insert');

  // 2) Rama Elastómero (Hule) usa 2 mitades simétricas (Frame Plate Liner + Cover Plate Liner)
  const rubberOk = evaluatePumpAssemblySequence({
    wetEndBranch: 'rubber',
    sealBranch: 'expeller_dry',
    frontClearanceMm: 0.8
  });
  assert.equal(rubberOk.isValidAssembly, true, 'Secuencia canónica de hule debe ser válida');
  assert.ok(rubberOk.canonicalSequence.includes('frame_plate_liner') && rubberOk.canonicalSequence.includes('cover_plate_liner'), 'Rama hule usa FPL + CPL simétricos');

  // 3) Secuencia inválida: intentar montar el impulsor ANTES del plato posterior (FPL Insert) genera colisión Ng > 0
  const invalidOrder = evaluatePumpAssemblySequence({
    wetEndBranch: 'metal',
    customOrder: ['frame', 'bearing_assembly', 'frame_plate', 'impeller', 'fpl_insert', 'monolithic_volute', 'throatbush', 'cover_plate']
  });
  assert.equal(invalidOrder.isValidAssembly, false, 'Montar impulsor antes del FPL Insert debe ser inválido');
  assert.ok(invalidOrder.geometricInterferencesNg >= 1, 'Debe detectar interferencia geométrica axial Ng >= 1');

  // 4) Claro axial descalibrado (3.2 mm > 1.0 mm) dispara alerta de recirculación severa
  const wornClearance = evaluatePumpAssemblySequence({
    wetEndBranch: 'metal',
    frontClearanceMm: 3.2,
    impellerExitWidthMm: 48
  });
  assert.equal(wornClearance.clearanceStatus, 'EXCESS_RECIRCULATION_WEAR', 'Claro > 1.0 mm debe alertar recirculación excesiva');
  assert.ok(wornClearance.excessRecirculationRatio > 8.0, 'A 3.2 mm vs 0.75 mm la pérdida por recirculación (δ/b2)^1.5 se multiplica > 8x');
});

test('12. Cinemática de Transmisión por Poleas (CV / ZVZ / CRZ / DC), Velocidad Periférica u2 y Vida ISO 281 del Bearing Assembly (Arbitraje #7)', async () => {
  const { calculateDriveAndBearingKinematics, DRIVE_ARRANGEMENT_CATALOG } = await import('../src/scripts/slurryEngine.js');

  assert.ok(DRIVE_ARRANGEMENT_CATALOG.CV && DRIVE_ARRANGEMENT_CATALOG.ZVZ && DRIVE_ARRANGEMENT_CATALOG.CRZ && DRIVE_ARRANGEMENT_CATALOG.DC, 'Debe incluir los 4 arreglos CV, ZVZ, CRZ y DC');
  assert.equal(DRIVE_ARRANGEMENT_CATALOG.CV.sumpFloodImmunity, true, 'CV protege al motor sobre nivel de inundación de sumidero');
  assert.equal(DRIVE_ARRANGEMENT_CATALOG.ZVZ.sumpFloodImmunity, true, 'ZVZ protege al motor sobre nivel de inundación de sumidero');

  // Caso 1: Bomba 6x4 en arreglo CV con motor 1780 RPM, poleas 180/320 mm e impulsor 380 mm
  const cvDrive = calculateDriveAndBearingKinematics({
    arrangement: 'CV',
    motorRpm: 1780,
    driverPulleyMm: 180,
    drivenPulleyMm: 320,
    impellerDiameterMm: 380,
    shaftPowerKw: 45,
    dynamicCapacityCkN: 195
  });
  assert.equal(cvDrive.pumpRpm, 1001, '1780 * (180/320) = 1001 RPM');
  assert.ok(cvDrive.tipSpeedMs > 19.5 && cvDrive.tipSpeedMs < 20.5, 'u2 = π * 0.38 * 1001 / 60 ≈ 19.92 m/s');
  assert.equal(cvDrive.rubberSafeTipSpeed, true, 'A 19.92 m/s <= 24.5 m/s es apto para Hule, Poliuretano y Alto Cromo');
  assert.ok(cvDrive.bearingL10Hours > 25000, 'Vida nominal ISO 281 L10h debe superar 25,000 horas');

  // Caso 2: Alta velocidad periférica (u2 > 24.5 m/s) exige exclusivamente Alto Cromo
  const highSpeed = calculateDriveAndBearingKinematics({
    arrangement: 'ZVZ',
    motorRpm: 1780,
    driverPulleyMm: 280,
    drivenPulleyMm: 320,
    impellerDiameterMm: 380,
    shaftPowerKw: 90
  });
  assert.ok(highSpeed.tipSpeedMs > 24.5, 'u2 debe superar 24.5 m/s');
  assert.equal(highSpeed.rubberSafeTipSpeed, false, 'Superado 24.5 m/s debe vetar hule por desgarre centrífugo/térmico');
  assert.ok(highSpeed.recommendedWetMaterialByTipSpeed.includes('Alto Cromo'), 'Debe exigir Alto Cromo >= 650 HB');
});

test('13. Consolidación Canónica Sin Debris (MS-01 / Decisión 8-C) e Invariantes Físicos INV-SMAT-SCI-12..14', async () => {
  const {
    WET_END_MATERIAL_MATRIX,
    WET_END_MATERIAL_KITS,
    DRIVE_ARRANGEMENT_CATALOG,
    DRIVE_ARRANGEMENTS,
    evaluatePumpAssemblySequence,
    evaluateWetEndAssemblyInterference,
    calculateDriveAndBearingKinematics,
    calculateDriveKinematics,
    recommendAstmSieveSeries,
    MECHANICAL_DIAGNOSTICS
  } = await import('../src/scripts/slurryEngine.js');

  assert.equal(WET_END_MATERIAL_KITS, WET_END_MATERIAL_MATRIX, 'Alias canónico sin duplicación de matriz de materiales');
  assert.equal(DRIVE_ARRANGEMENTS, DRIVE_ARRANGEMENT_CATALOG, 'Alias canónico sin duplicación de arreglos de transmisión');
  assert.equal(evaluateWetEndAssemblyInterference, evaluatePumpAssemblySequence, 'Alias canónico sin duplicación de evaluador de claro axial');
  assert.equal(calculateDriveKinematics, calculateDriveAndBearingKinematics, 'Alias canónico sin duplicación de motor cinemático');

  const worn = evaluateWetEndAssemblyInterference({ frontClearanceMm: 2.8, impellerExitWidthMm: 48 });
  assert.ok(worn.wearRatioImpact554.includes('5:9:4'), 'Claro axial > 2.0 mm debe degradar el lote 5:5:4 a 5:9:4');
  assert.ok(worn.pipeVelocityMarginLossPct > 2.0, 'Recirculación frontal debe cuantificar pérdida de margen de velocidad en tubería');

  const rubberOverheat = calculateDriveKinematics({
    arrangement: 'ZVZ',
    motorRpm: 1780,
    driverPulleyMm: 290,
    drivenPulleyMm: 310,
    impellerDiameterMm: 380,
    wetEndMaterial: 'hule_natural'
  });
  assert.equal(rubberOverheat.rubberThermalLimitExceeded, true, 'Hule natural con u2 > 24.5 m/s debe disparar rubberThermalLimitExceeded');

  const sieveRes = recommendAstmSieveSeries({ targetP80Microns: 106, rosinRammlerSlopeN: 1.18 });
  assert.equal(sieveRes.rosinRammlerSlopeN, 1.18, 'Debe conservar pendiente de uniformidad Rosin-Rammler n');

  for (const key of ['cavitation', 'liner_grooving', 'bearing_vibration', 'packing_leak']) {
    assert.ok(MECHANICAL_DIAGNOSTICS[key].threshold, `MECHANICAL_DIAGNOSTICS.${key} debe incluir threshold físico`);
    assert.ok(MECHANICAL_DIAGNOSTICS[key].stationNumber >= 1, `MECHANICAL_DIAGNOSTICS.${key} debe enlazar estación de despiece`);
  }
});

test('14. Paridad Científica 10 Decisiones (1-C+ a 10-C+): 9 Series de Tubería, pH Corrosivo, Inversión Bidireccional Marcy, S5a/S5b y Capacidad Dinámica C', async () => {
  const {
    PIPE_DIAMETERS_MM,
    calculateSlurryMetrics,
    selectOptimalMaterial,
    calculateMarcyScale,
    evaluateWetEndAssemblyInterference,
    calculateDriveAndBearingKinematics
  } = await import('../src/scripts/slurryEngine.js');

  // 1) Las 9 series de tubería desde 1.5x1 hasta 14x12 deben calcular métricas Durand válidas
  const expectedSeries = ['1.5x1', '2x1.5', '3x2', '4x3', '6x4', '8x6', '10x8', '12x10', '14x12'];
  assert.deepEqual(Object.keys(PIPE_DIAMETERS_MM), expectedSeries, 'PIPE_DIAMETERS_MM debe exponer las 9 series de tubería');
  for (const serie of expectedSeries) {
    const res = calculateSlurryMetrics({
      flowM3H: 180,
      solidsWeightPercent: 45,
      oreDensitySg: 2.8,
      particleSizeD80Microns: 180,
      pipeSize: serie,
      pulpPh: 7.5
    });
    assert.ok(res.criticalVelocityMs > 0, `Serie ${serie} debe producir velocidad crítica > 0`);
    assert.ok(res.durandFactorFL > 0, `Serie ${serie} debe exponer durandFactorFL`);
    assert.ok(res.solidsVolumetricPercent > 0, `Serie ${serie} debe exponer solidsVolumetricPercent`);
    assert.ok(res.recommendedPipeVelocityMs > res.criticalVelocityMs, `Serie ${serie} debe exponer recommendedPipeVelocityMs`);
  }

  // 2) Impacto del pH ácido (< 4.0) en selectOptimalMaterial
  const acidicMat = selectOptimalMaterial(150, 40, 2.5);
  assert.equal(acidicMat.id, 'rubber', 'A pH 2.5 con finos debe recomendar elastómero resistente a acidez');
  assert.equal(acidicMat.isCorrosiveAcidic, true, 'A pH < 4.0 debe marcar isCorrosiveAcidic = true');

  // 3) Inversión algebraica bidireccional de Balanza Marcy (Cw <-> rho_p)
  const forward = calculateMarcyScale({ oreDensitySg: 3.2, solidsWeightPercent: 50 });
  const inverted = calculateMarcyScale({
    pulpDensitySg: forward.pulpDensitySg,
    solidsWeightPercent: 50,
    solveFor: 'ore_density_rhop'
  });
  assert.ok(Math.abs(inverted.oreDensitySg - 3.2) <= 0.02, `Inversión Marcy debe recuperar rho_p ≈ 3.2 (obtenido: ${inverted.oreDensitySg})`);
  assert.ok(forward.drySolidsMassGramsInCup > 0, 'Debe exponer masa de sólidos secos en vaso de 1000 cm3');
  assert.ok(typeof forward.wrongRingBiasPoints === 'number', 'Debe cuantificar sesgo de carátula incorrecta');

  // 4) Impacto de ancho de salida b2 y rama de sellado S5a/S5b en evaluateWetEndAssemblyInterference
  const sealDry = evaluateWetEndAssemblyInterference({
    wetEndBranch: 'metal',
    sealBranch: 'expeller_dry',
    frontClearanceMm: 1.5,
    impellerExitWidthMm: 36
  });
  const sealWater = evaluateWetEndAssemblyInterference({
    wetEndBranch: 'metal',
    sealBranch: 'gland_water',
    frontClearanceMm: 1.5,
    impellerExitWidthMm: 64
  });
  assert.ok(sealDry.canonicalSequence.includes('expeller_dry'), 'Rama S5a incluye expeller_dry en secuencia canónica');
  assert.ok(sealWater.canonicalSequence.includes('gland_water'), 'Rama S5b incluye gland_water en secuencia canónica');
  assert.ok(sealDry.volumetricEfficiencyLossPct > sealWater.volumetricEfficiencyLossPct, 'Menor ancho b2 (36 mm vs 64 mm) a igual claro δ produce mayor pérdida porcentual (δ/b2)^1.5');

  // 5) Impacto de Capacidad Dinámica C (kN) en vida ISO 281 L10h
  const lowC = calculateDriveAndBearingKinematics({ dynamicCapacityCkN: 140, shaftPowerKw: 55 });
  const highC = calculateDriveAndBearingKinematics({ dynamicCapacityCkN: 240, shaftPowerKw: 55 });
  assert.ok(highC.bearingL10Hours > lowC.bearingL10Hours * 3, 'Incrementar C de 140 a 240 kN multiplica L10h cúbicamente ((C/P)^10/3)');
});

// ============================================================================
// TESTS 222–226 (MS-P4-02): Pinza Termo-Barométrica TEFC (Decisión 1),
// Derating Hidráulico ηr < HR + Vida Útil (Decisión 2) y Compuerta
// Física validatePlantLeadInput + data/trust.json (Decisión 3)
// ============================================================================
test('MS-P4-02 (Tests 222-226): Pinza Termo-Barométrica K_motor,alt, ηr < HR y validatePlantLeadInput', async () => {
  const {
    calculateAltitudeCorrection,
    calculateSlurryMetrics,
    validatePlantLeadInput
  } = await import('../src/scripts/slurryEngine.js');

  // Test 222: Corrección barométrica a 0, 1500, 2400 (Durango/Zacatecas) y 3200 msnm
  const sea = calculateAltitudeCorrection(0);
  const dgo = calculateAltitudeCorrection(2400);
  const highSierra = calculateAltitudeCorrection(3200);
  assert.equal(sea.pAtmHeadMca, 10.33);
  assert.equal(sea.motorDeratingFactor, 1.0);
  assert.equal(sea.npshSafeMarginWarning, false);
  assert.ok(dgo.deltaNpshLossM >= 2.6 && dgo.deltaNpshLossM <= 2.7, `A 2400 msnm se pierden ~2.67 m de NPSHa (obtenido: ${dgo.deltaNpshLossM})`);
  assert.equal(dgo.motorDeratingFactor, 0.86, 'A 2400 msnm el derating térmico IEC 60034-1 es 0.860');
  assert.equal(dgo.npshSafeMarginWarning, true, 'A 2400 msnm debe activar npshSafeMarginWarning');
  assert.ok(highSierra.barometricPressureKpa < 70, 'A 3200 msnm la presión barométrica cae por debajo de 70 kPa');

  // Test 223: Pinza Termo-Barométrica combinada K_motor,alt = 1 / (ηr * f_IEC(z)) en calculateSlurryMetrics
  const slurryDgo = calculateSlurryMetrics({
    flowM3H: 220,
    solidsWeightPercent: 52,
    oreDensitySg: 2.9,
    particleSizeD80Microns: 240,
    pipeSize: '6x4',
    altitudeM: 2400
  });
  assert.ok(slurryDgo.effDeratingFactorEr < slurryDgo.headDeratingFactorHr, 'Por ley física Cave/McElvain ηr < HR en pulpas densas');
  const expectedK = Number((1 / (slurryDgo.effDeratingFactorEr * slurryDgo.motorDeratingFactor)).toFixed(3));
  assert.equal(slurryDgo.combinedMotorAltitudeMultiplier, expectedK, 'Debe exponer K_motor,alt exacto en top-level y results');
  assert.ok(slurryDgo.motorSizingPenaltyPct > 25, `En sierra minera (2400 msnm, 52% Cw) la sobrecarga combinada supera +25% (${slurryDgo.motorSizingPenaltyPct}%)`);
  assert.ok(slurryDgo.estimatedImpellerLifeHours >= 900 && slurryDgo.estimatedImpellerLifeHours <= 4800, 'Debe exponer estimatedImpellerLifeHours');
  assert.ok(slurryDgo.wearLifeRatio >= 2.0, 'Debe exponer wearLifeRatio');

  // Test 224: Compuerta validatePlantLeadInput — Lead prioritario de planta minera verificada
  const gateValid = validatePlantLeadInput({
    company: 'Minera Fresnillo S.A. de C.V.',
    cwPct: 48,
    d80Microns: 180,
    flowM3h: 200,
    pulpPh: 7.2,
    altitudeM: 2200,
    wetMaterial: 'A05',
    frontClearanceMm: 0.75,
    tipSpeedMs: 21.0,
    smat_code: 'SMAT-PUMP-6X4-WETKIT'
  });
  assert.equal(gateValid.plausible, true);
  assert.equal(gateValid.classification, 'PRIORITY_MINING_PLANT');
  assert.equal(gateValid.activeTrustBoundaryId, null);

  // Test 225: Compuerta validatePlantLeadInput — Disparo causal de bound-ph-temp en Hule con acidez extrema o gruesos
  const gateRubberBound = validatePlantLeadInput({
    company: 'Planta Lixiviación',
    cwPct: 45,
    d80Microns: 750,
    flowM3h: 180,
    pulpPh: 1.2,
    wetMaterial: 'hule_natural'
  });
  assert.equal(gateRubberBound.plausible, false);
  assert.equal(gateRubberBound.activeTrustBoundaryId, 'bound-ph-temp');
  assert.equal(gateRubberBound.classification, 'OUT_OF_DOMAIN_WARNING');

  // Test 226: Compuerta validatePlantLeadInput — Disparo causal de bound-unapproved-mods cuando claro δ < 0.35 mm
  const gateClearanceBound = validatePlantLeadInput({
    company: 'Unidad Sabinas',
    cwPct: 45,
    d80Microns: 180,
    flowM3h: 180,
    frontClearanceMm: 0.20,
    wetMaterial: 'A05'
  });
  assert.equal(gateClearanceBound.plausible, false);
  assert.equal(gateClearanceBound.activeTrustBoundaryId, 'bound-unapproved-mods');
});

// ============================================================================
// TESTS 227–231 (Sección 2.1): Carburo de Silicio Sinterizado (ceramica_sic),
// Tenacidad Evans-Wilshaw K_Ic, Vida Modificada ISO 281:2007 L_10mh y
// Ecuación Waters-NIOSH 1993 LI_eje en Fichas Atómicas
// ============================================================================
test('Sección 2.1 (Tests 227-231): Paridad Total Backend — SiC, ISO 281 L10mh, NIOSH 1993 y Normalizadores', async () => {
  const {
    WET_END_MATERIAL_MATRIX,
    selectOptimalMaterial,
    evaluatePumpAssemblySequence,
    calculateDriveAndBearingKinematics
  } = await import('../src/scripts/slurryEngine.js');
  const {
    getAtomicPartSpecs,
    normalizeMaterialKey,
    normalizeCircuitSerie,
    parseUrlContextParams
  } = await import('../src/scripts/workbenchBus.js');

  // Test 227: Matriz de 4 materiales con K_Ic (fractureToughnessMpaSqrtM) y wearMultiplierVsCr27
  assert.equal(WET_END_MATERIAL_MATRIX.ceramica_sic.fractureToughnessMpaSqrtM, 4.1);
  assert.equal(WET_END_MATERIAL_MATRIX.ceramica_sic.wearMultiplierVsCr27, 2.25);
  assert.equal(WET_END_MATERIAL_MATRIX.alto_cromo_cr27.fractureToughnessMpaSqrtM, 20.0);
  assert.equal(WET_END_MATERIAL_MATRIX.hule_natural.fractureToughnessMpaSqrtM, 12.0);
  assert.equal(WET_END_MATERIAL_MATRIX.poliuretano.fractureToughnessMpaSqrtM, 14.0);

  // Test 228: selectOptimalMaterial recomienda ceramica_sic en pulpas ácidas severas (pH < 3.5) con corte intermedio (300 < d80 <= 800 µm)
  const sicRec = selectOptimalMaterial(450, 48, 2.4);
  assert.equal(sicRec.id, 'ceramica_sic');
  assert.equal(sicRec.fractureToughnessMpaSqrtM, 4.1);
  assert.equal(sicRec.wearMultiplierVsCr27, 2.25);

  // Test 229: evaluatePumpAssemblySequence en rama ceramica_sic detecta riesgo de fractura frágil (spalling) con d80 > 800 µm o u2 > 28 m/s
  const sicSafe = evaluatePumpAssemblySequence({
    wetEndBranch: 'ceramica_sic',
    frontClearanceMm: 0.75,
    particleSizeD80Microns: 450,
    tipSpeedMs: 22.0
  });
  assert.equal(sicSafe.wetEndBranch, 'ceramica_sic');
  assert.equal(sicSafe.spallingRiskDetected, false);
  assert.equal(sicSafe.fractureToughnessMpaSqrtM, 4.1);

  const sicSpalling = evaluatePumpAssemblySequence({
    wetEndBranch: 'ceramica_sic',
    frontClearanceMm: 0.75,
    particleSizeD80Microns: 1100,
    tipSpeedMs: 29.5
  });
  assert.equal(sicSpalling.spallingRiskDetected, true);
  assert.ok(sicSpalling.spallingWarningEs.includes('K_Ic = 4.1'));

  // Test 230: calculateDriveAndBearingKinematics expone ISO 281:2007 L10mh con a_ISO = 1.25 (Laberinto SMAT) vs a_ISO = 0.22 (Fieltro Contaminado)
  const kin = calculateDriveAndBearingKinematics({
    arrangement: 'CV',
    motorRpm: 1780,
    driverPulleyMm: 180,
    drivenPulleyMm: 320,
    impellerDiameterMm: 380,
    shaftPowerKw: 45,
    dynamicCapacityCkN: 195,
    wetEndMaterial: 'ceramica_sic'
  });
  assert.equal(kin.aIsoLabyrinthSmat, 1.25);
  assert.equal(kin.aIsoContaminatedFelt, 0.22);
  assert.equal(kin.l10mhLabyrinthHours, Math.round(kin.bearingL10Hours * 1.25));
  assert.equal(kin.l10mhContaminatedHours, Math.round(kin.bearingL10Hours * 0.22));
  assert.equal(kin.ceramicSafeTipSpeed, true);
  assert.equal(kin.ceramicSpallingSpeedExceeded, false);

  // Test 231: Waters-NIOSH 1993 en las 6 fichas atómicas y normalizadores de material y serie por circuito
  const dam028 = getAtomicPartSpecs('DAM028');
  const d3147 = getAtomicPartSpecs('D3147');
  const e4147 = getAtomicPartSpecs('E4147');
  assert.equal(dam028.niosh_rwl_shaft_kg, 11.1);
  assert.equal(dam028.niosh_ergonomic_tier, 'ASSISTED_SHAFT_MOUNT_2P');
  assert.equal(d3147.niosh_ergonomic_tier, 'HOIST_MANDATORY');
  assert.equal(e4147.niosh_ergonomic_tier, 'HOIST_MANDATORY');

  assert.equal(normalizeMaterialKey('A05'), 'alto_cromo_cr27');
  assert.equal(normalizeMaterialKey('R55'), 'hule_natural');
  assert.equal(normalizeMaterialKey('PU'), 'poliuretano');
  assert.equal(normalizeMaterialKey('SiC'), 'ceramica_sic');

  assert.deepEqual(normalizeCircuitSerie('bombeo', '4x3'), { targetField: 'pipe_size', value: '4x3' });
  assert.deepEqual(normalizeCircuitSerie('flotacion', '100ft³'), { targetField: 'flot_capacity', value: '100ft' });
  assert.deepEqual(normalizeCircuitSerie('filtracion', '1200x1200'), { targetField: 'filt_capacity', value: '1200' });
  assert.deepEqual(normalizeCircuitSerie('control_procesos', 'astm_8in'), { targetField: 'ctrl_spec', value: 'astm_8in_inox' });

  const parsedCtx = parseUrlContextParams('?circuito=flotacion&equipo=celda_flotacion&serie=100ft&flot_condition=Sin+espuma+estable&drive_arr=ZVZ');
  assert.equal(parsedCtx.circuito, 'flotacion');
  assert.equal(parsedCtx.serie, '100ft');
  assert.equal(parsedCtx.flot_condition, 'Sin espuma estable');
  assert.equal(parsedCtx.drive_arr, 'ZVZ');
});

// ============================================================================
// TESTS MVP v3.0 (SLICE-16): Balance de Hidrociclón por 3 Vasos Marcy (D7),
// Deflexión de Placas de Filtro Prensa Timoshenko (D8) y Hash FNV-1a (D4)
// ============================================================================
test('SLICE-16: Balance de Masa de Hidrociclón por 3 Vasos Marcy, Plitt d50c, Roping y Deflexión Timoshenko', async () => {
  const {
    calculateThreeCupMarcyCycloneBalance,
    evaluateFilterPressPlateDeflection,
    computeSelectionOrderCodeHash
  } = await import('../src/scripts/slurryEngine.js');

  // 1) Operación normal en semi-paraguas
  const optimalCyc = calculateThreeCupMarcyCycloneBalance({
    feedSg: 1.35,
    underflowSg: 1.78,
    overflowSg: 1.15,
    solidsSg: 2.7,
    apexDiameterMm: 55,
    vortexDiameterMm: 100,
    feedPressureKpa: 95,
    cycloneDiameterMm: 380
  });
  assert.equal(optimalCyc.dischargeRegime, 'SEMI_UMBRELLA_OPTIMAL');
  assert.equal(optimalCyc.isRopingCritical, false);
  assert.ok(optimalCyc.solidsRecoveryPct > 65 && optimalCyc.solidsRecoveryPct < 95);
  assert.ok(optimalCyc.d50cMicrons >= 35 && optimalCyc.d50cMicrons <= 180);

  // 2) Condición de acordonamiento severo (Roping: C_v,u >= 0.56)
  const ropingCyc = calculateThreeCupMarcyCycloneBalance({
    feedSg: 1.48,
    underflowSg: 2.08,
    overflowSg: 1.22,
    solidsSg: 2.7,
    apexDiameterMm: 38,
    vortexDiameterMm: 105,
    feedPressureKpa: 110,
    cycloneDiameterMm: 380
  });
  assert.equal(ropingCyc.isRopingCritical, true);
  assert.equal(ropingCyc.dischargeRegime, 'ROPING_CORDON');
  assert.equal(ropingCyc.recommendedSkuId, 'SKU-QC-11');

  // 3) Deflexión de placas de filtro prensa (Timoshenko) y cumplimiento NOM-141
  const safePlate = evaluateFilterPressPlateDeflection({
    feedPressureBar: 12,
    cloggedPortsCount: 0,
    plateWidthMm: 1200,
    plateThicknessMm: 68,
    cakeMoistureTargetPct: 14
  });
  assert.equal(safePlate.isPlateCrackingRisk, false);
  assert.equal(safePlate.nom141Compliant, true);
  assert.equal(safePlate.recommendedClothSkuId, 'SKU-QC-17');
  assert.equal(safePlate.recommendedPlateSkuId, 'SKU-QC-18');

  const cloggedPlate = evaluateFilterPressPlateDeflection({
    feedPressureBar: 16,
    cloggedPortsCount: 3,
    plateWidthMm: 1500,
    plateThicknessMm: 55,
    cakeMoistureTargetPct: 19
  });
  assert.equal(cloggedPlate.isPlateCrackingRisk, true);
  assert.equal(cloggedPlate.nom141Compliant, false);

  // 4) Hash FNV-1a determinista de selección técnica (SMAT-XXXX-YYYY)
  const hashA = computeSelectionOrderCodeHash({ branch: 'metal', seal: 'expeller_dry', serie: '6x4', mat: 'A05' });
  const hashB = computeSelectionOrderCodeHash({ mat: 'A05', serie: '6x4', seal: 'expeller_dry', branch: 'metal' });
  assert.equal(hashA, hashB, 'El hash debe ser invariante al orden de las llaves del objeto');
  assert.match(hashA, /^SMAT-[0-9A-F]{4}-[0-9A-F]{4}$/);
});






