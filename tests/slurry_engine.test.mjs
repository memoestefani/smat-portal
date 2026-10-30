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
