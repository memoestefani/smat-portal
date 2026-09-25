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



