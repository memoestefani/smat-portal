/**
 * SMAT Minerals - Pump 5-5-4 Assembly Sequence, Drive Kinematics & Hybrid Wet-End Engine (SLICE-V34-12)
 * Extraído por costura limpia LCOM4 desde tribologyAndCompatibilityEngine.js (D8-V34 / DEB-V34-08).
 */
import { WET_END_MATERIAL_MATRIX, calculateMarcyScaleReading } from './tribologyAndCompatibilityEngine.js';

function clamp(val, min, max, fallback) {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * Estaciones de Ensamble de una Bomba Centrífuga Horizontal para Lodos (Arbitraje #6, INV-SMAT-SCI-10)
 * Basado en Matrices de Interferencia Axial A_{I,-X} y Matriz de Soporte S (DOI: 10.1109/tase.2012.2235144).
 */
export const PUMP_ASSEMBLY_STATIONS = [
  {
    station: 1,
    stationNumber: 1,
    id: 'drive_end',
    nameEs: 'Estación 1: Extremo Motriz y Base Estructural',
    nameEn: 'Station 1: Drive End & Structural Frame',
    titleEs: 'Estación 1: Extremo Motriz y Base Estructural',
    titleEn: 'Station 1: Drive End & Structural Frame',
    descriptionEs: 'Bastidor con tornillo micrométrico y cartucho Bearing Assembly ISO 281.',
    descriptionEn: 'Base frame with micrometer screw and ISO 281 Bearing Assembly cartridge.',
    calibrationLawEs: 'Módulo sellado intercambiable (ISO 281 rodillos cónicos p = 10/3)',
    calibrationLawEn: 'Drop-in sealed cartridge module (ISO 281 tapered rollers p = 10/3)',
    partsEs: ['01. Bastidor / Cuna con Tornillo de Ajuste Axial (Frame)', '02. Conjunto Rodamiento Cilíndrico (Bearing Assembly / Housing)', '03. Plato Soporte Metálico (Frame Plate)'],
    partsEn: ['01. Base Frame with Axial Adjusting Screw', '02. Cylindrical Bearing Assembly / Housing', '03. Cast Iron Frame Plate'],
    roleId: 'soporte',
    lotRatioNoteEs: 'Módulo sellado intercambiable (ISO 281 rodillos cónicos p = 10/3)',
    lotRatioNoteEn: 'Drop-in sealed cartridge module (ISO 281 tapered rollers p = 10/3)'
  },
  {
    station: 2,
    stationNumber: 2,
    id: 'sealing_fork',
    nameEs: 'Estación 2: Bifurcación de Sellado Centrífugo (Sin Sello Mecánico)',
    nameEn: 'Station 2: Centrifugal Shaft Sealing Fork (Zero Mechanical Seal)',
    titleEs: 'Estación 2: Bifurcación de Sellado Centrífugo (Sin Sello Mecánico)',
    titleEn: 'Station 2: Centrifugal Shaft Sealing Fork (Zero Mechanical Seal)',
    descriptionEs: 'Camisa endurecida, anillo expulsor y turbina centrífuga seca o prensaestopa.',
    descriptionEn: 'Hardened shaft sleeve, expeller ring, and dry dynamic expeller or gland packing.',
    calibrationLawEs: 'Sellado centrífugo en seco para evitar dilución de pulpa y fallas por abrasión',
    calibrationLawEn: 'Dry centrifugal expeller seal prevents pulp dilution and abrasive seal failure',
    partsEs: ['04. Camisa de Flecha (Shaft Sleeve)', '05. Anillo Expulsor + Cámara Centrífuga (Expeller Ring)', '06. Expulsor Dinámico Seco (Expeller)', '07. Prensaestopa, Anillo Linterna y Empaquetadura PTFE/Grafito'],
    partsEn: ['04. Hardened Shaft Sleeve', '05. Expeller Ring & Chamber', '06. Dynamic Dry Expeller', '07. Gland Follower, Lantern Ring & Braided PTFE/Graphite Packing'],
    roleId: 'sello',
    lotRatioNoteEs: 'Sellado centrífugo en seco para evitar dilución de pulpa y fallas por abrasión',
    lotRatioNoteEn: 'Dry centrifugal expeller seal prevents pulp dilution and abrasive seal failure'
  },
  {
    station: 3,
    stationNumber: 3,
    id: 'wet_end_fork',
    nameEs: 'Estación 3: Bifurcación de Contacto Húmedo (Lote 5 – 5 – 4)',
    nameEn: 'Station 3: Bifurcated Wet-End Assembly (5 – 5 – 4 Wear Lot)',
    titleEs: 'Estación 3: Bifurcación de Contacto Húmedo (Lote 5 – 5 – 4)',
    titleEn: 'Station 3: Bifurcated Wet-End Assembly (5 – 5 – 4 Wear Lot)',
    descriptionEs: 'Rama A Metálica (Voluta Monolítica + FPL Insert) vs Rama B Elastómero (FPL + CPL).',
    descriptionEn: 'Branch A Metal (Monolithic Volute + FPL Insert) vs Branch B Elastomer (FPL + CPL).',
    calibrationLawEs: 'Rotación acoplada 5 Impulsores : 5 Throatbush : 4 Volutas/Liners',
    calibrationLawEn: 'Coupled wear rotation: 5 Impellers : 5 Throatbushes : 4 Volutes/Liners',
    partsEs: [
      '08A [Rama Metal]. Plato Posterior Metálico (FPL Insert)',
      '08B [Rama Hule/PU]. Forro Lado Soporte (Frame Plate Liner - FPL)',
      '09. Impulsor Cerrado de 5 Álabes (roscado en flecha tras montar 08A/08B)',
      '10A [Rama Metal]. Voluta Monolítica de Alto Cromo (1 sola pieza rígida)',
      '10B [Rama Hule/PU]. Forro Lado Succión (Cover Plate Liner - CPL)',
      '11. Cuello de Succión Cónico (Throatbush)'
    ],
    partsEn: [
      '08A [Metal Branch]. Frame Plate Liner Insert (FPL Insert)',
      '08B [Rubber/PU Branch]. Frame Plate Liner (FPL Rear Half)',
      '09. Closed 5-Vane Impeller (threaded onto shaft after mounting 08A/08B)',
      '10A [Metal Branch]. Monolithic High Chrome Volute (1-piece shell)',
      '10B [Rubber/PU Branch]. Cover Plate Liner (CPL Front Half)',
      '11. Tapered Suction Throatbush'
    ],
    roleId: 'revestimientos',
    lotRatioNoteEs: 'Rotación acoplada 5 Impulsores : 5 Throatbush : 4 Volutas/Liners',
    lotRatioNoteEn: 'Coupled wear rotation: 5 Impellers : 5 Throatbushes : 4 Volutes/Liners'
  },
  {
    station: 4,
    stationNumber: 4,
    id: 'suction_closure',
    nameEs: 'Estación 4: Cierre de Carcasa Bipartida y Succión',
    nameEn: 'Station 4: Split-Casing Closure & Suction Cover Plate',
    titleEs: 'Estación 4: Cierre de Carcasa Bipartida y Succión',
    titleEn: 'Station 4: Split-Casing Closure & Suction Cover Plate',
    descriptionEs: 'Asiento cónico del Throatbush y cierre con plato cubierta lado succión.',
    descriptionEn: 'Conical Throatbush seating and closure with suction-side Cover Plate.',
    calibrationLawEs: 'Torque cruzado simétrico de carcasa exterior',
    calibrationLawEn: 'Symmetrical cross-pattern torque on outer split casing',
    partsEs: ['12. Plato Cubierta Lado Succión (Cover Plate)', '13. Pernos Pasantes de Carcasa y Abrazadera de Descarga'],
    partsEn: ['12. Suction Side Cover Plate', '13. Casing Through-Bolts & Discharge Clamp'],
    roleId: 'skid_bomba',
    lotRatioNoteEs: 'Torque cruzado simétrico de carcasa exterior',
    lotRatioNoteEn: 'Symmetrical cross-pattern torque on outer split casing'
  },
  {
    station: 5,
    stationNumber: 5,
    id: 'axial_calibration',
    nameEs: 'Estación 5: Calibración Post-Armado de Claro Axial Frontal (δ = 0.5 – 1.0 mm)',
    nameEn: 'Station 5: Post-Assembly Front Axial Clearance Calibration (δ = 0.5 – 1.0 mm)',
    titleEs: 'Estación 5: Calibración Post-Armado de Claro Axial Frontal (δ = 0.5 – 1.0 mm)',
    titleEn: 'Station 5: Post-Assembly Front Axial Clearance Calibration (δ = 0.5 – 1.0 mm)',
    descriptionEs: 'Ajuste axial del Bearing Assembly para suprimir recirculación frontal.',
    descriptionEn: 'Axial Bearing Assembly adjustment to suppress front-shroud recirculation.',
    calibrationLawEs: 'Anula el vórtice de recirculación frontal Δην ∝ (δ/b2)^1.5',
    calibrationLawEn: 'Suppresses front-shroud recirculation vortex Δην ∝ (δ/b2)^1.5',
    partsEs: ['14. Tornillo Micrométrico del Bearing Assembly: avanzar conjunto hacia succión hasta contacto leve con Throatbush, retroceder 1/2 vuelta (0.5–1.0 mm) y fijar pernos de cuna'],
    partsEn: ['14. Bearing Assembly Adjusting Screw: advance cartridge toward suction until light rub against Throatbush, back off 1/2 turn (0.5–1.0 mm), and lock cradle bolts'],
    roleId: 'revestimientos',
    lotRatioNoteEs: 'Anula el vórtice de recirculación frontal Δην ∝ (δ/b2)^1.5',
    lotRatioNoteEn: 'Suppresses front-shroud recirculation vortex Δην ∝ (δ/b2)^1.5'
  }
];

export const PUMP_554_ASSEMBLY_STATIONS = PUMP_ASSEMBLY_STATIONS;

/**
 * Cédula Canónica Unificada de 14 Componentes del Despiece de Bomba Horizontal para Lodos (Estaciones 1 a 5)
 * Fuente única de verdad para PumpAssemblyReport.astro, QuoteWizard.astro y evaluación NIOSH (>= 23 kg).
 */
export const PUMP_554_BOM_14_PARTS = [
  {
    pos: '01',
    station: 'EST-01',
    stationNumber: 1,
    partKey: 'frame',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Soporte Base (Frame / Pedestal)',
    nameEn: 'Pump Frame / Pedestal Base',
    specEs: 'Cuna maquinada con tornillo de ajuste axial externo',
    specEn: 'Machined cradle with external axial adjusting screw',
    weightKgBySeries: { '3x2': 85.0, '6x4': 165.0, '8x6': 310.0 },
    weightKg: 165.0,
    nioshHoistRequired: true,
    equipo: 'soporte_rodamiento',
    pieza: 'frame_pedestal',
    material: 'acero_4140_iso281'
  },
  {
    pos: '02',
    station: 'EST-01',
    stationNumber: 1,
    partKey: 'bearing_assembly',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Cartucho Bearing Assembly (Eje + Rodamientos ISO 281)',
    nameEn: 'Bearing Assembly Cartridge (Shaft + ISO 281 Bearings)',
    specEs: 'Rodamientos cónicos espalda con espalda + retenes laberinto',
    specEn: 'Back-to-back tapered roller bearings + labyrinth seals',
    weightKgBySeries: { '3x2': 48.0, '6x4': 94.0, '8x6': 185.0 },
    weightKg: 94.0,
    nioshHoistRequired: true,
    equipo: 'soporte_rodamiento',
    pieza: 'bearing_assembly',
    material: 'acero_4140_iso281'
  },
  {
    pos: '03',
    station: 'EST-02',
    stationNumber: 2,
    partKey: 'shaft_sleeve',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Camisa Protectora de Eje (Shaft Sleeve) + O-Rings',
    nameEn: 'Hardened Shaft Sleeve + Seal O-Rings',
    specEs: 'Acero endurecido / recubrimiento cerámico en zona de sello',
    specEn: 'Hardened alloy / ceramic-coated sleeve in seal zone',
    weightKgBySeries: { '3x2': 4.2, '6x4': 7.8, '8x6': 14.5 },
    weightKg: 7.8,
    nioshHoistRequired: false,
    equipo: 'sello_expulsor',
    pieza: 'shaft_sleeve',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '04',
    station: 'EST-02',
    stationNumber: 2,
    partKey: 'expeller_ring',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Caja de Sello / Anillo Expulsor (Expeller Ring / Stuffing Box)',
    nameEn: 'Expeller Ring / Stuffing Box Housing',
    specEs: 'Cámara secundaria con grasera o anillo linterna',
    specEn: 'Secondary seal chamber with grease port or lantern ring',
    weightKgBySeries: { '3x2': 18.5, '6x4': 29.0, '8x6': 54.0 },
    weightKg: 29.0,
    nioshHoistRequired: true,
    equipo: 'sello_expulsor',
    pieza: 'expeller_ring',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '05',
    station: 'EST-02',
    stationNumber: 2,
    partKey: 'expeller_dry',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Expulsor Centrífugo Seco (Expeller)',
    nameEn: 'Centrifugal Dry Expeller',
    specEs: 'Turbina auxiliar que abate presión en estopera sin agua externa',
    specEn: 'Auxiliary rotor that relieves stuffing box pressure without water',
    weightKgBySeries: { '3x2': 9.5, '6x4': 16.5, '8x6': 31.0 },
    weightKg: 16.5,
    nioshHoistRequired: false,
    equipo: 'sello_expulsor',
    pieza: 'expeller_sello',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '06',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'frame_plate',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Carcasa Lado Soporte (Frame Plate)',
    nameEn: 'Frame Plate (Drive-Side Outer Casing)',
    specEs: 'Mitad estructural posterior en hierro nodular con espárragos',
    specEn: 'Rear ductile iron structural half-casing with mounting studs',
    weightKgBySeries: { '3x2': 62.0, '6x4': 128.0, '8x6': 245.0 },
    weightKg: 128.0,
    nioshHoistRequired: true,
    equipo: 'skid_bomba',
    pieza: 'frame_plate',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '07',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'fpl_insert',
    branch: 'alto_cromo_cr27',
    branchLabelEs: 'Rama A • Alto Cromo',
    branchLabelEn: 'Branch A • High Chrome',
    nameEs: 'Plato de Desgaste Posterior (Frame Plate Liner Insert — FPL Insert)',
    nameEn: 'Frame Plate Liner Insert (FPL Insert — Rear Wear Plate)',
    specEs: 'Aleación Cr27% ASTM A532 (≥650 HB) con pernos posteriores',
    specEn: 'ASTM A532 Cr27% (≥650 HB) rear wear plate with studs',
    weightKgBySeries: { '3x2': 24.0, '6x4': 48.0, '8x6': 96.0 },
    weightKg: 48.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'fpl_insert',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '08',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'frame_plate_liner',
    branch: 'hule_natural',
    branchLabelEs: 'Rama B • Hule / PU',
    branchLabelEn: 'Branch B • Rubber / PU',
    nameEs: 'Forro Posterior Vulcanizado (Frame Plate Liner — FPL)',
    nameEn: 'Molded Frame Plate Liner (FPL — Rubber or Polyurethane)',
    specEs: 'Hule Natural (55–65 Shore A) o Poliuretano con alma de acero',
    specEn: 'Natural Rubber (55–65 Shore A) or Polyurethane with steel backing',
    weightKgBySeries: { '3x2': 14.0, '6x4': 26.5, '8x6': 52.0 },
    weightKg: 26.5,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'liner_fpl',
    material: 'hule_natural'
  },
  {
    pos: '09',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'impeller',
    branch: 'common',
    branchLabelEs: 'Ambas Ramas (5-5-4)',
    branchLabelEn: 'Both Branches (5-5-4)',
    nameEs: 'Impulsor Cerrado de 5 Álabes (Closed Impeller)',
    nameEn: '5-Vane Closed Slurry Impeller',
    specEs: 'Con álabes expulsores posteriores; Alto Cromo ≥650 HB, Hule o PU',
    specEn: 'With back pump-out vanes; High Chrome ≥650 HB, Rubber, or PU',
    weightKgBySeries: { '3x2': 32.5, '6x4': 68.0, '8x6': 142.0 },
    weightKg: 68.0,
    nioshHoistRequired: true,
    equipo: 'impulsor_bomba',
    pieza: 'impulsor_5_alabes',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '10',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'monolithic_volute',
    branch: 'alto_cromo_cr27',
    branchLabelEs: 'Rama A • Alto Cromo',
    branchLabelEn: 'Branch A • High Chrome',
    nameEs: 'Voluta Monolítica (Metal Volute Liner)',
    nameEn: 'Monolithic High-Chrome Volute Liner',
    specEs: 'Caracol envolvente de 1 pieza en Alto Cromo Cr27% para molienda SAG',
    specEn: '1-piece Cr27% high-chrome scroll liner for coarse primary duty',
    weightKgBySeries: { '3x2': 78.0, '6x4': 162.0, '8x6': 320.0 },
    weightKg: 162.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'voluta_liners',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '11',
    station: 'EST-03',
    stationNumber: 3,
    partKey: 'cover_plate_liner',
    branch: 'hule_natural',
    branchLabelEs: 'Rama B • Hule / PU',
    branchLabelEn: 'Branch B • Rubber / PU',
    nameEs: 'Forro Frontal Lado Succión (Cover Plate Liner — CPL)',
    nameEn: 'Cover Plate Liner (CPL — Suction-Side Split Liner)',
    specEs: 'Mitad frontal en Hule Natural o Poliuretano que cierra la voluta con el FPL',
    specEn: 'Front elastomer half-liner that mates with FPL to form the volute',
    weightKgBySeries: { '3x2': 15.5, '6x4': 28.0, '8x6': 56.0 },
    weightKg: 28.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'liner_cpl',
    material: 'hule_natural'
  },
  {
    pos: '12',
    station: 'EST-04',
    stationNumber: 4,
    partKey: 'throatbush',
    branch: 'common',
    branchLabelEs: 'Ambas Ramas (5-5-4)',
    branchLabelEn: 'Both Branches (5-5-4)',
    nameEs: 'Cuello / Anillo de Desgaste de Succión (Throatbush)',
    nameEn: 'Suction Wear Ring (Throatbush)',
    specEs: 'Cara cónica frontal de sacrificio; controla recirculación con el impulsor',
    specEn: 'Conical front wear face; controls suction eye recirculation',
    weightKgBySeries: { '3x2': 21.0, '6x4': 44.0, '8x6': 88.0 },
    weightKg: 44.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'throatbush',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '13',
    station: 'EST-04',
    stationNumber: 4,
    partKey: 'cover_plate',
    branch: 'common',
    branchLabelEs: 'Común',
    branchLabelEn: 'Common',
    nameEs: 'Tapa Carcasa Lado Succión + Pernos (Cover Plate & Clamp Bolts)',
    nameEn: 'Suction Cover Plate & Casing Clamp Bolts',
    specEs: 'Mitad frontal bridada con orejas de izaje y espárragos pasantes',
    specEn: 'Flanged suction outer casing half with lifting lugs and clamp bolts',
    weightKgBySeries: { '3x2': 58.0, '6x4': 118.0, '8x6': 230.0 },
    weightKg: 118.0,
    nioshHoistRequired: true,
    equipo: 'skid_bomba',
    pieza: 'cover_plate',
    material: 'alto_cromo_cr27'
  },
  {
    pos: '14',
    station: 'EST-05',
    stationNumber: 5,
    partKey: 'axial_clearance_adjustment',
    branch: 'common',
    branchLabelEs: 'Lote Completo',
    branchLabelEn: 'Complete Kit',
    nameEs: 'Lote Húmedo Sincronizado 5-5-4 (5 Juegos Liners + 5 Impulsores + 4 Sellos)',
    nameEn: 'Synchronized 5-5-4 Wet-End Kit (5 Liner Sets + 5 Impellers + 4 Seals)',
    specEs: 'Suministro programado por campaña con calibración δ = 0.5–1.0 mm',
    specEn: 'Campaign-synchronized wet-end lot with δ = 0.5–1.0 mm calibration',
    weightKgBySeries: { '3x2': 680.0, '6x4': 1410.0, '8x6': 2850.0 },
    weightKg: 1410.0,
    nioshHoistRequired: true,
    equipo: 'bombeo_hule_cromo',
    pieza: 'lote_554',
    material: 'alto_cromo_cr27'
  }
];

/**
 * Evalúa la validez cinemática de una secuencia de armado de bomba de lodos y cuantifica
 * el impacto del claro axial frontal δ_frontal sobre la eficiencia volumétrica y vida del lote 5-5-4.
 * Referencias: HyperbolicCurve/Assembly-sequence-planning-algorithm (SHA-256: 8dc91ac2...fb90867c35)
 * y Gandhi et al. (2001, DOI: 10.1115/1.1366322).
 */
export function evaluatePumpAssemblySequence(params = {}) {
  const opts = typeof params === 'number' ? { frontClearanceMm: params } : (params || {});
  const branchRaw = String(opts.wetEndBranch || opts.material || 'metal').toLowerCase();
  const isCeramic = branchRaw === 'ceramica_sic' || branchRaw === 'sic' || branchRaw === 'ceramic';
  const isElastomer = !isCeramic && (branchRaw === 'rubber' || branchRaw === 'hule' || branchRaw === 'hule_natural' || branchRaw === 'polyurethane' || branchRaw === 'poliuretano');
  const wetEndBranch = isCeramic
    ? 'ceramica_sic'
    : (isElastomer ? (branchRaw.includes('poly') || branchRaw.includes('poli') ? 'polyurethane' : 'rubber') : 'metal');
  const isMonolithicArchitecture = wetEndBranch === 'metal' || wetEndBranch === 'ceramica_sic';
  const sealBranch = opts.sealBranch === 'gland_water' ? 'gland_water' : 'expeller_dry';

  const clearanceMm = clamp(opts.frontClearanceMm, 0.1, 8.0, 0.75);
  const b2Mm = clamp(opts.impellerExitWidthMm, 15.0, 180.0, 48.0);
  const d80Val = clamp(opts.d80Microns ?? opts.particleSizeD80Microns ?? 180, 5, 10000, 180);
  const tipSpeedVal = clamp(opts.impellerTipSpeedMs ?? opts.tipSpeedMs ?? 20.0, 5, 45, 20.0);
  const seriesRaw = String(opts.pipeSeries || '6x4').toLowerCase();
  const seriesKey = (seriesRaw.includes('3x2') || seriesRaw.includes('4x3') || seriesRaw.includes('1.5x1'))
    ? '3x2'
    : ((seriesRaw.includes('8x6') || seriesRaw.includes('10x8')) ? '8x6' : '6x4');

  const canonicalSequence = isMonolithicArchitecture
    ? ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'fpl_insert', 'impeller', 'monolithic_volute', 'throatbush', 'cover_plate', 'axial_clearance_adjustment']
    : ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'frame_plate_liner', 'impeller', 'cover_plate_liner', 'throatbush', 'cover_plate', 'axial_clearance_adjustment'];

  let sequenceToTest = Array.isArray(opts.customOrder) && opts.customOrder.length > 0
    ? opts.customOrder
    : canonicalSequence;

  let outOfOrderStationId = null;
  const collisionDetailsEs = [];
  const collisionDetailsEn = [];

  if (Array.isArray(opts.attemptedStationOrder) && opts.attemptedStationOrder.length > 0) {
    const normalizedStations = opts.attemptedStationOrder.map((s) => {
      const numMatch = String(s).match(/\d+/);
      return numMatch ? Number(numMatch[0]) : Number(s);
    });
    for (let i = 0; i < normalizedStations.length; i++) {
      if (normalizedStations[i] !== i + 1) {
        outOfOrderStationId = `EST-0${normalizedStations[i]}`;
        break;
      }
    }
    if (outOfOrderStationId) {
      collisionDetailsEs.push(`Estación fuera de secuencia axial (${outOfOrderStationId}): debe respetarse la precedencia EST-01 ➔ EST-02 ➔ EST-03 ➔ EST-04 ➔ EST-05.`);
      collisionDetailsEn.push(`Out-of-order axial station (${outOfOrderStationId}): must follow EST-01 ➔ EST-02 ➔ EST-03 ➔ EST-04 ➔ EST-05 precedence.`);
    }
  } else if (typeof opts.sequencePreset === 'string' && opts.sequencePreset !== 'canonical') {
    if (opts.sequencePreset === 'impeller_before_rear_liner') {
      outOfOrderStationId = 'EST-02';
      const rearPart = isMonolithicArchitecture ? 'fpl_insert' : 'frame_plate_liner';
      sequenceToTest = ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, 'impeller', rearPart, 'throatbush', 'cover_plate', 'axial_clearance_adjustment'];
    } else if (opts.sequencePreset === 'cover_before_throatbush') {
      outOfOrderStationId = 'EST-04';
      const rearPart = isMonolithicArchitecture ? 'fpl_insert' : 'frame_plate_liner';
      sequenceToTest = ['frame', 'bearing_assembly', 'frame_plate', 'shaft_sleeve', sealBranch, rearPart, 'impeller', 'cover_plate', 'throatbush', 'axial_clearance_adjustment'];
    }
  }

  let geometricInterferencesNg = outOfOrderStationId ? 1 : 0;
  let unstableSubassembliesNs = 0;

  const idxImpeller = sequenceToTest.indexOf('impeller');
  const idxRearLiner = sequenceToTest.indexOf(isMonolithicArchitecture ? 'fpl_insert' : 'frame_plate_liner');
  const idxThroatbush = sequenceToTest.indexOf('throatbush');
  const idxFramePlate = sequenceToTest.indexOf('frame_plate');
  const idxCoverPlate = sequenceToTest.indexOf('cover_plate');

  if (idxImpeller !== -1 && idxRearLiner !== -1 && idxImpeller < idxRearLiner) {
    geometricInterferencesNg += 1;
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-03';
    collisionDetailsEs.push('Colisión axial A_{I,-X} en EST-03: El plato posterior (FPL Insert / Liner FPL) no puede atravesar el diámetro exterior ØD₂ del impulsor ya roscado.');
    collisionDetailsEn.push('Axial collision A_{I,-X} in EST-03: Rear wear plate (FPL Insert / FPL Liner) cannot pass over the outer diameter ØD₂ of an already-threaded impeller.');
  }
  if (idxImpeller !== -1 && idxThroatbush !== -1 && idxThroatbush < idxImpeller) {
    geometricInterferencesNg += 1;
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-04';
    collisionDetailsEs.push('Colisión axial A_{I,-X} en EST-03/04: El cuello de succión (Throatbush) bloquea el ingreso frontal del impulsor.');
    collisionDetailsEn.push('Axial collision A_{I,-X} in EST-03/04: Suction Throatbush blocks frontal insertion of the impeller.');
  }
  if (idxRearLiner !== -1 && idxFramePlate !== -1 && idxRearLiner < idxFramePlate) {
    unstableSubassembliesNs += 1;
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-03';
    collisionDetailsEs.push('Subensamble inestable S en EST-03: No se puede fijar el plato/forro posterior sin montar antes la carcasa lado soporte (Frame Plate #06).');
    collisionDetailsEn.push('Unstable subassembly S in EST-03: Rear wear plate/liner cannot be anchored before mounting the drive-side Frame Plate (#06).');
  }
  if (idxCoverPlate !== -1 && idxThroatbush !== -1 && idxCoverPlate < idxThroatbush) {
    geometricInterferencesNg += 1;
    if (!outOfOrderStationId) outOfOrderStationId = 'EST-04';
    collisionDetailsEs.push('Colisión axial A_{I,-X} en EST-04: La tapa de succión (Cover Plate #13) impide asentar el Throatbush (#12) desde el interior.');
    collisionDetailsEn.push('Axial collision A_{I,-X} in EST-04: Closing the Suction Cover Plate (#13) first blocks internal seating of the Throatbush (#12).');
  }

  const targetBranchFilter = isMonolithicArchitecture ? 'alto_cromo_cr27' : 'hule_natural';
  const fractureToughnessMpaSqrtM = isCeramic
    ? WET_END_MATERIAL_MATRIX.ceramica_sic.fractureToughnessMpaSqrtM
    : (wetEndBranch === 'polyurethane'
      ? WET_END_MATERIAL_MATRIX.poliuretano.fractureToughnessMpaSqrtM
      : (wetEndBranch === 'rubber' ? WET_END_MATERIAL_MATRIX.hule_natural.fractureToughnessMpaSqrtM : WET_END_MATERIAL_MATRIX.alto_cromo_cr27.fractureToughnessMpaSqrtM));
  const spallingRiskDetected = Boolean(isCeramic && (d80Val > 800 || tipSpeedVal > 28.0));
  const spallingWarningEs = spallingRiskDetected
    ? `Alerta Hutchings-Ashby (K_Ic = 4.1 MPa·√m): Con d80 = ${d80Val} µm (> 800 µm) o u₂ = ${tipSpeedVal.toFixed(1)} m/s (> 28.0 m/s), el impacto balístico supera la tenacidad a la fractura del Carburo de Silicio SiC. Se recomienda Alto Cromo 27% Cr (A05, K_Ic ≥ 18 MPa·√m).`
    : 'Sin riesgo de desconchamiento frágil (Spalling) en régimen cinemático actual.';
  const spallingWarningEn = spallingRiskDetected
    ? `Hutchings-Ashby Alert (K_Ic = 4.1 MPa·√m): At d80 = ${d80Val} µm (> 800 µm) or u₂ = ${tipSpeedVal.toFixed(1)} m/s (> 28.0 m/s), ballistic impact exceeds SiC fracture toughness. 27% High Chrome (A05, K_Ic ≥ 18 MPa·√m) is recommended.`
    : 'No brittle spalling risk under current kinematic regime.';
  const selectedPartSpec = PUMP_554_BOM_14_PARTS
    .filter((item) => item.branch === 'common' || item.branch === targetBranchFilter)
    .map((item) => {
      const seriesMass = item.weightKgBySeries?.[seriesKey] ?? item.weightKg;
      const hoistReq = seriesMass >= 23.0;
      return {
        ...item,
        activeSeries: seriesKey,
        activeWeightKg: seriesMass,
        activeNioshHoistRequired: hoistReq
      };
    });

  const singlePumpParts = selectedPartSpec.filter((item) => item.pos !== '14');
  const totalAssemblyMassKg = Number(singlePumpParts.reduce((acc, item) => acc + item.activeWeightKg, 0).toFixed(1));
  const nioshHoistPartsCount = singlePumpParts.filter((item) => item.activeNioshHoistRequired).length;
  const sequenceValid = geometricInterferencesNg === 0 && unstableSubassembliesNs === 0 && outOfOrderStationId === null;

  const kr = 2.85;
  const volumetricLossFraction = kr * Math.pow(clearanceMm / b2Mm, 1.5);
  const volumetricEfficiencyDropPct = Number(Math.min(45.0, volumetricLossFraction * 100).toFixed(2));
  const baselineDropPct = Number((kr * Math.pow(0.75 / b2Mm, 1.5) * 100).toFixed(2));
  const excessRecirculationRatio = Number((volumetricEfficiencyDropPct / Math.max(0.1, baselineDropPct)).toFixed(2));

  const clearanceStatus = clearanceMm >= 0.5 && clearanceMm <= 1.0
    ? 'OPTIMAL_CALIBRATION'
    : (clearanceMm < 0.5 ? 'RUBBING_RISK' : 'EXCESS_RECIRCULATION_WEAR');

  let wearRatioImpact554 = '5:5:4 (Rotación acoplada nominal)';
  let wearRatioImpact554En = '5:5:4 (Coupled nominal wear lot)';
  if (clearanceMm < 0.5) {
    wearRatioImpact554 = 'Riesgo de fricción axial Impulsor-Throatbush (< 0.5 mm)';
    wearRatioImpact554En = 'Axial rubbing risk Impeller-Throatbush (< 0.5 mm)';
  } else if (clearanceMm > 2.0) {
    wearRatioImpact554 = '5:9:4 (Vórtice severo: consume ~9 Throatbushes por lote)';
    wearRatioImpact554En = '5:9:4 (Severe vortex: consumes ~9 Throatbushes per lot)';
  } else if (clearanceMm > 1.0) {
    wearRatioImpact554 = '5:7:4 (Aceleración de desgaste en Throatbush +40%)';
    wearRatioImpact554En = '5:7:4 (Accelerated Throatbush wear +40%)';
  }

  const pipeVelocityMarginLossPct = Number((volumetricEfficiencyDropPct * 0.85).toFixed(2));

  return {
    wetEndBranch,
    sealBranch,
    pipeSeries: seriesKey,
    stations: PUMP_ASSEMBLY_STATIONS,
    bomParts: PUMP_554_BOM_14_PARTS,
    selectedPartSpec,
    totalAssemblyMassKg,
    nioshHoistPartsCount,
    canonicalSequence,
    geometricInterferencesNg,
    unstableSubassembliesNs,
    isValidAssembly: sequenceValid,
    sequenceValid,
    outOfOrderStationId,
    collisionDetailsEs,
    collisionDetailsEn,
    collisionRiskEs: sequenceValid
      ? 'Secuencia axial libre de colisiones geométricas (Ng = 0, Ns = 0)'
      : `SECUENCIA INVÁLIDA (${outOfOrderStationId}): ${collisionDetailsEs.join(' ')}`,
    collisionRiskEn: sequenceValid
      ? 'Axial sequence free of geometric collisions (Ng = 0, Ns = 0)'
      : `INVALID SEQUENCE (${outOfOrderStationId}): ${collisionDetailsEn.join(' ')}`,
    frontClearanceMm: clearanceMm,
    impellerExitWidthMm: b2Mm,
    optimalClearanceBandMm: [0.5, 1.0],
    volumetricEfficiencyDropPct,
    volumetricLossPct: volumetricEfficiencyDropPct,
    volumetricEfficiencyLossPct: volumetricEfficiencyDropPct,
    volumetricEffLossPct: volumetricEfficiencyDropPct,
    excessRecirculationRatio,
    clearanceStatus,
    wearRatioImpact554,
    wearRatioImpact554En,
    pipeVelocityMarginLossPct,
    fractureToughnessMpaSqrtM,
    spallingRiskDetected,
    spallingWarningEs,
    spallingWarningEn,
    structuralReasonEs: isCeramic
      ? 'El Carburo de Silicio Sinterizado (SiC, ≥ 2200 HV, Mohs 9.2, K_Ic = 4.1 MPa·√m) emplea arquitectura de Voluta Compuesta Monolítica + Throatbush SiC para resistir abrasión por sílice fina-media y pH extremo (1.0–13.5), limitado a d80 ≤ 800 µm y u₂ ≤ 28.0 m/s.'
      : (wetEndBranch === 'metal'
        ? 'El alto cromo (≥650 HB) posee módulo elástico E ≈ 210 GPa y soporta esfuerzos de membrana en succión como Voluta Monolítica de 1 pieza + FPL Insert posterior + Throatbush frontal.'
        : 'El hule/poliuretano (E ≈ 0.01–0.05 GPa) requiere respaldo metálico continuo contra colapso por vacío en el ojo de succión, dividiendo la carcasa húmeda en 2 mitades simétricas (Frame Plate Liner + Cover Plate Liner) + Throatbush.'),
    structuralReasonEn: isCeramic
      ? 'Sintered Silicon Carbide (SiC, ≥ 2200 HV, Mohs 9.2, K_Ic = 4.1 MPa·√m) uses a Monolithic Composite Volute + SiC Throatbush architecture to resist fine-to-medium silica abrasion and extreme pH (1.0–13.5), bounded to d80 ≤ 800 µm and u₂ ≤ 28.0 m/s.'
      : (wetEndBranch === 'metal'
        ? 'High chrome white iron (≥650 HB, E ≈ 210 GPa) resists suction vacuum hoop stresses as a 1-piece Monolithic Volute + rear FPL Insert + front Throatbush.'
        : 'Elastomers (rubber/polyurethane, E ≈ 0.01–0.05 GPa) require continuous split-casing metal backing against suction vacuum buckling, using 2 symmetrical halves (Frame Plate Liner + Cover Plate Liner) + Throatbush.')
  };
}

export const evaluateWetEndAssemblyInterference = evaluatePumpAssemblySequence;

/**
 * Catálogo de los 4 Arreglos Cinemáticos de Transmisión para Bombas de Lodos (Arbitraje #7, INV-SMAT-SCI-11)
 * Referencias visuales Don Manuel: ref2_cv_transmission.jpg (CV) y ref3_how_it_works.jpg (ZVZ/CRZ).
 */
export const DRIVE_ARRANGEMENT_CATALOG = {
  CV: {
    code: 'CV',
    nameEs: 'Arreglo CV (Motor Superior / Overhead sobre Bearing Assembly)',
    nameEn: 'CV Arrangement (Overhead Motor Mounted Above Bearing Assembly)',
    footprintFactor: 0.55,
    sumpFloodImmunity: true,
    beltDriven: true,
    maxRecommendedMotorKw: 75,
    descriptionEs: 'Montaje compacto con motor elevado sobre cuna superior del Bearing Assembly y guarda amarilla/naranja. Ahorra 45% de huella en piso y protege al motor eléctrico de derrames e inundaciones de pulpa en trincheras.',
    descriptionEn: 'Compact overhead motor cradle mounted above the Bearing Assembly. Saves 45% floor space and protects the electric motor from sump slurry spills and flooding.',
    applicationEs: 'Montaje compacto con motor elevado sobre cuna superior del Bearing Assembly y guarda amarilla/naranja. Ahorra 45% de huella en piso y protege al motor eléctrico de derrames e inundaciones de pulpa en trincheras.',
    applicationEn: 'Compact overhead motor cradle mounted above the Bearing Assembly. Saves 45% floor space and protects the electric motor from sump slurry spills and flooding.'
  },
  ZVZ: {
    code: 'ZVZ',
    nameEs: 'Arreglo ZVZ (Motor Trasero Elevado sobre Bastidor Común)',
    nameEn: 'ZVZ Arrangement (Elevated Rear Motor on Shared Base Frame)',
    footprintFactor: 0.85,
    sumpFloodImmunity: true,
    beltDriven: true,
    maxRecommendedMotorKw: 315,
    descriptionEs: 'Motor montado sobre pedestal posterior elevado detrás del Bearing Assembly con transmisión por bandas en V. Ideal para potencias medias y altas manteniendo el motor por encima del nivel de inundación del foso.',
    descriptionEn: 'Motor mounted on an elevated rear pedestal behind the Bearing Assembly with V-belt drive. Ideal for medium-to-high horsepower while keeping the motor above sump flood level.',
    applicationEs: 'Motor montado sobre pedestal posterior elevado detrás del Bearing Assembly con transmisión por bandas en V. Ideal para potencias medias y altas manteniendo el motor por encima del nivel de inundación del foso.',
    applicationEn: 'Motor mounted on an elevated rear pedestal behind the Bearing Assembly with V-belt drive. Ideal for medium-to-high horsepower while keeping the motor above sump flood level.'
  },
  CRZ: {
    code: 'CRZ',
    nameEs: 'Arreglo CRZ / Banda Lateral (Motor Lateral en Bastidor Compartido)',
    nameEn: 'CRZ / CR Arrangement (Side-by-Side Belt Drive on Shared Skid)',
    footprintFactor: 1.0,
    sumpFloodImmunity: false,
    beltDriven: true,
    maxRecommendedMotorKw: 560,
    descriptionEs: 'Motor colocado paralelamente al costado de la bomba sobre base estructural de acero con rieles tensores. Facilita el cambio rápido de poleas (H ∝ N²) para compensar desgaste del impulsor.',
    descriptionEn: 'Motor mounted side-by-side next to the pump on a heavy structural skid with slide rails. Enables rapid sheave ratio changes (H ∝ N²) to compensate for impeller wear.',
    applicationEs: 'Motor colocado paralelamente al costado de la bomba sobre base estructural de acero con rieles tensores. Facilita el cambio rápido de poleas (H ∝ N²) para compensar desgaste del impulsor.',
    applicationEn: 'Motor mounted side-by-side next to the pump on a heavy structural skid with slide rails. Enables rapid sheave ratio changes (H ∝ N²) to compensate for impeller wear.'
  },
  DC: {
    code: 'DC',
    nameEs: 'Arreglo DC (Acoplamiento Directo Flexible Colineal)',
    nameEn: 'DC Arrangement (In-Line Direct Flexible Coupling)',
    footprintFactor: 1.15,
    sumpFloodImmunity: false,
    beltDriven: false,
    maxRecommendedMotorKw: 1000,
    descriptionEs: 'Acoplamiento colineal directo entre motor (con variador de frecuencia VFD) y la flecha del Bearing Assembly. Cero carga radial de bandas sobre los rodamientos (Fr = 0).',
    descriptionEn: 'Collinear direct coupling between motor (with VFD speed control) and Bearing Assembly shaft. Zero V-belt radial overhung load on bearings (Fr = 0).',
    applicationEs: 'Acoplamiento colineal directo entre motor (con variador de frecuencia VFD) y la flecha del Bearing Assembly. Cero carga radial de bandas sobre los rodamientos (Fr = 0).',
    applicationEn: 'Collinear direct coupling between motor (with VFD speed control) and Bearing Assembly shaft. Zero V-belt radial overhung load on bearings (Fr = 0).'
  }
};

/**
 * Calcula la cinemática de transmisión por poleas (CV / ZVZ / CRZ / DC), la velocidad periférica
 * del impulsor u2 (m/s) y la vida nominal ISO 281 L10h del Bearing Assembly con rodamientos de rodillos (p = 10/3).
 */
export function calculateDriveAndBearingKinematics(params = {}) {
  const arrKey = String(params.arrangement || params.arrangementCode || 'CV').toUpperCase();
  const arrangementInfo = DRIVE_ARRANGEMENT_CATALOG[arrKey] || DRIVE_ARRANGEMENT_CATALOG.CV;

  const motorRpm = clamp(params.motorRpm, 600, 3600, 1780);
  const driverMm = clamp(params.driverPulleyMm, 80, 900, 180);
  const drivenMm = clamp(params.drivenPulleyMm, 80, 1400, 320);
  const impellerMm = clamp(params.impellerDiameterMm, 120, 1100, 380);
  const powerKw = clamp(params.shaftPowerKw ?? params.motorPowerKw, 2.2, 750, 45);
  const capacityCkN = clamp(params.dynamicCapacityCkN, 45, 950, 195);

  const speedMultiplier = arrangementInfo.beltDriven ? Number((driverMm / drivenMm).toFixed(4)) : 1.0;
  const reductionRatio = arrangementInfo.beltDriven ? Number((drivenMm / driverMm).toFixed(4)) : 1.0;
  const pumpRpm = Math.round(motorRpm * speedMultiplier);

  const tipSpeedMs = Number(((Math.PI * (impellerMm * 1e-3) * pumpRpm) / 60.0).toFixed(2));

  const kbBeltFactor = arrangementInfo.beltDriven ? 2.5 : 0.0;
  const drivenRadiusM = (drivenMm * 1e-3) / 2.0;
  const beltRadialLoadKn = arrangementInfo.beltDriven
    ? Number(((kbBeltFactor * 9550.0 * powerKw) / (Math.max(100, pumpRpm) * drivenRadiusM * 1000.0)).toFixed(2))
    : 0.0;

  const hydraulicThrustKn = Number((0.18 * powerKw).toFixed(2));
  const equivalentLoadPkN = Number(Math.max(4.5, beltRadialLoadKn + 1.5 * hydraulicThrustKn).toFixed(2));

  const rollerExponent = 10.0 / 3.0;
  const l10MillionRevs = Math.pow(capacityCkN / equivalentLoadPkN, rollerExponent);
  const bearingL10Hours = Math.round((1_000_000.0 / (60.0 * Math.max(100, pumpRpm))) * l10MillionRevs);

  const rubberSafeTipSpeed = tipSpeedMs <= WET_END_MATERIAL_MATRIX.hule.maxTipSpeedMs;
  const ceramicSafeTipSpeed = tipSpeedMs <= WET_END_MATERIAL_MATRIX.ceramica_sic.maxTipSpeedMs;
  const matRaw = String(params.wetEndMaterial || params.materialKey || '').toLowerCase();
  const isRubberSelected = matRaw.includes('hule') || matRaw.includes('rubber') || matRaw === 'r55';
  const isCeramicSelected = matRaw.includes('ceramica') || matRaw.includes('sic') || matRaw === 'ceramic';
  const rubberThermalLimitExceeded = isRubberSelected && !rubberSafeTipSpeed;
  const ceramicSpallingSpeedExceeded = isCeramicSelected && !ceramicSafeTipSpeed;

  const aIsoLabyrinthSmat = 1.25;
  const aIsoContaminatedFelt = 0.22;
  const l10mhLabyrinthHours = Math.round(bearingL10Hours * aIsoLabyrinthSmat);
  const l10mhContaminatedHours = Math.round(bearingL10Hours * aIsoContaminatedFelt);

  return {
    arrangement: arrangementInfo.code,
    arrangementCode: arrangementInfo.code,
    arrangementNameEs: arrangementInfo.nameEs,
    arrangementNameEn: arrangementInfo.nameEn,
    sumpFloodImmunity: arrangementInfo.sumpFloodImmunity,
    sumpFloodImmunityEn: arrangementInfo.sumpFloodImmunity ? 'Elevated Motor (Splash Immune)' : 'Baseplate Level',
    footprintFactor: arrangementInfo.footprintFactor,
    motorRpm,
    driverPulleyMm: driverMm,
    drivenPulleyMm: drivenMm,
    shaftPowerKw: powerKw,
    dynamicCapacityCkN: capacityCkN,
    wetEndMaterial: matRaw || 'alto_cromo_cr27',
    pumpRpm,
    speedMultiplier,
    reductionRatio,
    impellerDiameterMm: impellerMm,
    tipSpeedMs,
    impellerTipSpeedMs: tipSpeedMs,
    rubberSafeTipSpeed,
    ceramicSafeTipSpeed,
    rubberThermalLimitExceeded,
    ceramicSpallingSpeedExceeded,
    recommendedWetMaterialByTipSpeed: rubberSafeTipSpeed
      ? 'Hule Natural / Poliuretano / Cerámica SiC / Alto Cromo'
      : (ceramicSafeTipSpeed
        ? 'Cerámica SiC (d80 ≤ 800 µm) / Exclusivo Alto Cromo ≥ 650 HB (u2 > 24.5 m/s)'
        : 'Exclusivo Alto Cromo ≥ 650 HB (u2 > 28.0 m/s)'),
    beltRadialLoadKn,
    radialBeltLoadKn: beltRadialLoadKn,
    equivalentLoadPkN,
    bearingL10Hours,
    estimatedBearingL10h: bearingL10Hours,
    estimatedL10hHours: bearingL10Hours,
    aIsoLabyrinthSmat,
    aIsoContaminatedFelt,
    l10mhLabyrinthHours,
    l10mhContaminatedHours
  };
}

export const DRIVE_ARRANGEMENTS = DRIVE_ARRANGEMENT_CATALOG;
export const calculateDriveKinematics = calculateDriveAndBearingKinematics;

export function calculateMarcyScale(params = {}) {
  return calculateMarcyScaleReading(params);
}

/**
 * Evalúa la configuración Híbrida de Extremo Húmedo (Impulsor Metálico Cr27 A05 + Forros Elastoméricos R55)
 * según la Partición Angular de Erosión de Finnie (1960), Hutchings (1992) y Bitter (1963) — INV-SMAT-SCI-05.
 */
export function evaluateHybridWetEndConfiguration({
  d80Microns = 240,
  tipSpeedMs = 21.5,
  pulpPh = 7.5,
  solidsWeightPercent = 45,
  pipeSeries = '6x4'
} = {}) {
  const d80 = clamp(d80Microns, 10, 5000, 240);
  const u2 = clamp(tipSpeedMs, 5, 42, 21.5);
  const ph = clamp(pulpPh, 1.0, 14.0, 7.5);
  const cw = clamp(solidsWeightPercent, 5, 80, 45);
  const rubberThermalSafe = u2 <= 24.5;
  const particleCutSafe = d80 <= 600;
  const hybridRecommended = rubberThermalSafe && particleCutSafe && d80 >= 90 && ph >= 3.5 && ph <= 11.5;

  const seriesKey = String(pipeSeries || '6x4').includes('3x2') || String(pipeSeries || '6x4').includes('4x3')
    ? '3x2'
    : (String(pipeSeries || '6x4').includes('8x6') ? '8x6' : '6x4');

  const hybridBomParts = PUMP_554_BOM_14_PARTS.filter((item) => {
    if (item.pos === '07' || item.pos === '10') return false;
    return item.branch === 'common' || item.branch === 'hule_natural';
  }).map((item) => {
    const activeWeightKg = item.weightKgBySeries?.[seriesKey] ?? item.weightKg;
    return {
      ...item,
      activeSeries: seriesKey,
      activeWeightKg,
      activeMaterialCode: item.partKey === 'impeller' ? 'A05' : (item.branch === 'hule_natural' ? 'R55' : 'A05')
    };
  });

  const singlePumpMassKg = Number(
    hybridBomParts.filter((p) => p.pos !== '14').reduce((acc, p) => acc + p.activeWeightKg, 0).toFixed(1)
  );
  const fullMetalMassKg = seriesKey === '3x2' ? 375.5 : (seriesKey === '8x6' ? 1489.0 : 752.3);
  const massSavingsPct = Number((((fullMetalMassKg - singlePumpMassKg) / fullMetalMassKg) * 100).toFixed(1));

  return {
    architectureId: 'hybrid_a05_impeller_r55_liners',
    impellerMaterialCode: 'A05',
    linerMaterialCode: 'R55',
    impellerImpactAngleDeg: [75, 90],
    linerGrazingAngleDeg: [8, 25],
    d80Microns: d80,
    tipSpeedMs: u2,
    pulpPh: ph,
    solidsWeightPercent: cw,
    rubberThermalSafe,
    particleCutSafe,
    hybridRecommended,
    wearSynchronizationRatio: hybridRecommended ? '5:5:4 (Sincronizado A05/R55)' : 'Usar 100% Alto Cromo A05 (u2 > 24.5 m/s o d80 > 600 µm)',
    singlePumpMassKg,
    massSavingsPct,
    hybridBomParts,
    rationaleEs: hybridRecommended
      ? `Configuración Híbrida Óptima (Finnie-Hutchings INV-SMAT-SCI-05): Impulsor Cerrado en Alto Cromo 27% A05 (resiste impacto frontal α ≈ 75°–90° con d80 = ${d80} µm) + Forros Bipartidos FPL/CPL en Hule Natural R55 (absorbe abrasión rasante α ≤ 25° a u₂ = ${u2} m/s ≤ 24.5 m/s), reduciendo ${massSavingsPct}% la masa suspendida en maniobra.`
      : `Fuera de ventana híbrida (u₂ = ${u2} m/s, d80 = ${d80} µm): excede límite viscoelástico (24.5 m/s) o umbral de desgarre de partícula cortante (600 µm). Se recomienda Extremo Húmedo 100% Metálico Cr27 A05.`,
    rationaleEn: hybridRecommended
      ? `Optimal Hybrid Wet-End (Finnie-Hutchings INV-SMAT-SCI-05): 27% High Chrome A05 Closed Impeller (resists leading-edge impact α ≈ 75°–90° at d80 = ${d80} µm) + Split R55 Natural Rubber Liners FPL/CPL (absorbs grazing abrasion α ≤ 25° at u₂ = ${u2} m/s ≤ 24.5 m/s), reducing rigging mass by ${massSavingsPct}%.`
      : `Outside hybrid window (u₂ = ${u2} m/s, d80 = ${d80} µm): exceeds viscoelastic thermal ceiling (24.5 m/s) or coarse tear threshold (600 µm). Full 27% High Chrome A05 Metal Wet-End recommended.`
  };
}
