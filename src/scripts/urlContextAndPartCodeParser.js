/**
 * SMAT Minerals - URL Context Hydration & Institutional Part Code Generator (`SLICE-V51-32`, `D9-V51`)
 * Extraído por costura limpia LCOM4 desde districtProfilesAndSkuCatalog.js.
 */
import { getQuickProductBySlugOrAlias } from './quickProductsCatalog.js';
import { resolveAtomicPartCode } from './districtProfilesAndSkuCatalog.js';

/**
 * Parsea los parámetros de contexto desde la URL (#rfq?equipo=... o ?equipo=... o combinación de search + hash)
 * @param {string} [urlOrSearch='']
 * @param {string} [hashOptional='']
 * @returns {Object}
 */
export function parseUrlContextParams(urlOrSearch = '', hashOptional = '') {
  if (!urlOrSearch && !hashOptional && typeof window !== 'undefined') {
    urlOrSearch = window.location.search || '';
    hashOptional = window.location.hash || '';
  }

  const result = {
    equipo: null,
    rol: null,
    mina: null,
    urgencia: null,
    modo: null,
    origen: null,
    serie: null,
    sintoma: null,
    falla: null,
    codigo: null,
    circuito: null,
    flow: null,
    solids: null,
    d80: null,
    pieza: null,
    material: null,
    transmision: null,
    estacion: null,
    claro_mm: null,
    u2_ms: null,
    l10h: null,
    peso_kg: null,
    metrologia: null,
    sg: null,
    cw: null,
    gy_kg: null,
    p80: null,
    d95: null,
    ph: null,
    seal_branch: null,
    b2_mm: null,
    cap_c_kn: null,
    rhop: null,
    lib_um: null,
    grade: null,
    air_psi: null,
    gy_c: null,
    gy_err: null,
    rr_n: null,
    ret_p80: null,
    n2_rpm: null,
    fr_kn: null,
    driver_mm: null,
    driven_mm: null,
    motor_rpm: null,
    power_kw: null,
    inmunidad_sumidero: null,
    razon_estructural: null,
    cv: null,
    fl: null,
    v_rec: null,
    pipeOrSeries: null,
    pulpPh: null,
    sealBranch: null,
    impellerExitWidthMm: null,
    dynamicCapacityCkN: null,
    driverPulleyMm: null,
    drivenPulleyMm: null,
    motorRpm: null,
    shaftPowerKw: null,
    oreDensitySg: null,
    solidsSg: null,
    solidsWeightPercent: null,
    gyD95Cm: null,
    liberationSizeMicrons: null,
    criticalGradeDecimal: null,
    airPressurePsi: null,
    gyConstantC: null,
    gyRelativeError: null,
    rosinRammlerSlopeN: null,
    particleSizeD80Microns: null,
    flot_condition: null,
    filt_condition: null,
    rho_f: null,
    rho_u: null,
    rho_o: null,
    rs_pct: null,
    cv_u: null,
    d50c: null,
    roping_risk: null,
    g5_confirm: null,
    sku: null,
    atomic_part: null
  };

  if (!urlOrSearch && !hashOptional) return result;

  function extractQuerySegment(segment) {
    if (!segment) return '';
    let s = String(segment);
    const qIdx = s.indexOf('?');
    if (qIdx !== -1) {
      s = s.substring(qIdx + 1);
    } else if (s.startsWith('#')) {
      return '';
    } else {
      s = s.replace(/^[#?]/, '');
    }
    const hIdx = s.indexOf('#');
    if (hIdx !== -1) {
      s = s.substring(0, hIdx);
    }
    return s;
  }

  const rawParts = [extractQuerySegment(urlOrSearch), extractQuerySegment(hashOptional)].filter(Boolean);
  let raw = rawParts.join('&');
  if (!raw && urlOrSearch && !urlOrSearch.startsWith('#')) {
    raw = urlOrSearch.replace(/^[#?]/, '');
    const hIdx = raw.indexOf('#');
    if (hIdx !== -1) raw = raw.substring(0, hIdx);
  }
  if (!raw) return result;

  try {
    const params = new URLSearchParams(raw);
    if (params.has('equipo')) result.equipo = params.get('equipo');
    else if (params.has('role_id')) result.equipo = params.get('role_id');
    else if (params.has('role')) result.equipo = params.get('role');

    if (params.has('pieza')) result.pieza = params.get('pieza');
    else if (params.has('part')) result.pieza = params.get('part');

    if (params.has('material')) result.material = params.get('material');
    else if (params.has('aleacion')) result.material = params.get('aleacion');
    else if (params.has('mat')) result.material = params.get('mat');

    if (params.has('transmision')) result.transmision = params.get('transmision').toUpperCase();
    else if (params.has('drive')) result.transmision = params.get('drive').toUpperCase();
    else if (params.has('drive_arr')) result.transmision = params.get('drive_arr').toUpperCase();
    if (result.transmision) result.drive_arr = result.transmision;

    if (params.has('flot_condition')) result.flot_condition = params.get('flot_condition');
    if (params.has('filt_condition')) result.filt_condition = params.get('filt_condition');
    if (params.has('rho_f')) result.rho_f = params.get('rho_f');
    else if (params.has('feed_sg')) result.rho_f = params.get('feed_sg');
    if (params.has('rho_u')) result.rho_u = params.get('rho_u');
    else if (params.has('underflow_sg')) result.rho_u = params.get('underflow_sg');
    if (params.has('rho_o')) result.rho_o = params.get('rho_o');
    else if (params.has('overflow_sg')) result.rho_o = params.get('overflow_sg');
    if (params.has('rs_pct')) result.rs_pct = params.get('rs_pct');
    else if (params.has('solids_recovery_pct')) result.rs_pct = params.get('solids_recovery_pct');
    if (params.has('cv_u')) result.cv_u = params.get('cv_u');
    else if (params.has('underflow_cv')) result.cv_u = params.get('underflow_cv');
    if (params.has('d50c')) result.d50c = params.get('d50c');
    else if (params.has('d50c_um')) result.d50c = params.get('d50c_um');
    if (params.has('roping_risk')) result.roping_risk = params.get('roping_risk');
    if (params.has('g5_confirm')) result.g5_confirm = params.get('g5_confirm');

    if (params.has('estacion')) result.estacion = params.get('estacion');
    if (params.has('claro_mm')) result.claro_mm = params.get('claro_mm');
    else if (params.has('clearance')) result.claro_mm = params.get('clearance');

    if (params.has('u2_ms')) result.u2_ms = params.get('u2_ms');
    else if (params.has('tip_speed')) result.u2_ms = params.get('tip_speed');

    if (params.has('l10h')) result.l10h = params.get('l10h');
    if (params.has('peso_kg')) result.peso_kg = params.get('peso_kg');
    if (params.has('metrologia')) result.metrologia = params.get('metrologia');
    if (params.has('sg')) result.sg = params.get('sg');
    if (params.has('cw')) result.cw = params.get('cw');
    if (params.has('gy_kg')) result.gy_kg = params.get('gy_kg');
    if (params.has('p80')) result.p80 = params.get('p80');
    if (params.has('d95')) result.d95 = params.get('d95');
    if (params.has('ph')) result.ph = params.get('ph');
    if (params.has('seal_branch')) result.seal_branch = params.get('seal_branch');
    else if (params.has('sello_rama')) result.seal_branch = params.get('sello_rama');
    if (params.has('b2_mm')) result.b2_mm = params.get('b2_mm');
    if (params.has('cap_c_kn')) result.cap_c_kn = params.get('cap_c_kn');
    if (params.has('rhop')) result.rhop = params.get('rhop');
    if (params.has('lib_um')) result.lib_um = params.get('lib_um');
    if (params.has('grade')) result.grade = params.get('grade');
    if (params.has('air_psi')) result.air_psi = params.get('air_psi');
    if (params.has('gy_c')) result.gy_c = params.get('gy_c');
    if (params.has('gy_err')) result.gy_err = params.get('gy_err');
    if (params.has('rr_n')) result.rr_n = params.get('rr_n');
    if (params.has('ret_p80')) result.ret_p80 = params.get('ret_p80');
    if (params.has('n2_rpm')) result.n2_rpm = params.get('n2_rpm');
    if (params.has('fr_kn')) result.fr_kn = params.get('fr_kn');
    if (params.has('driver_mm')) result.driver_mm = params.get('driver_mm');
    if (params.has('driven_mm')) result.driven_mm = params.get('driven_mm');
    if (params.has('motor_rpm')) result.motor_rpm = params.get('motor_rpm');
    if (params.has('power_kw')) result.power_kw = params.get('power_kw');
    if (params.has('inmunidad_sumidero')) result.inmunidad_sumidero = params.get('inmunidad_sumidero');
    if (params.has('razon_estructural')) result.razon_estructural = params.get('razon_estructural');
    if (params.has('cv')) result.cv = params.get('cv');
    if (params.has('fl')) result.fl = params.get('fl');
    if (params.has('v_rec')) result.v_rec = params.get('v_rec');

    if (params.has('rol')) result.rol = params.get('rol');
    else if (params.has('perspectiva')) result.rol = params.get('perspectiva');

    if (params.has('mina')) result.mina = params.get('mina');
    else if (params.has('empresa')) result.mina = params.get('empresa');

    if (params.has('urgencia')) result.urgencia = params.get('urgencia');
    else if (params.has('tipo')) result.urgencia = params.get('tipo');
    if (params.has('modo')) result.modo = params.get('modo');
    if (params.has('origen')) result.origen = params.get('origen');
    if (params.has('serie')) result.serie = params.get('serie');
    else if (params.has('bomba')) result.serie = params.get('bomba');
    result.pipeOrSeries = result.serie;
    if (result.ph !== null) result.pulpPh = Number(result.ph);
    if (result.seal_branch !== null) result.sealBranch = result.seal_branch;
    if (result.b2_mm !== null) result.impellerExitWidthMm = Number(result.b2_mm);
    if (result.cap_c_kn !== null) result.dynamicCapacityCkN = Number(result.cap_c_kn);
    if (result.driver_mm !== null) result.driverPulleyMm = Number(result.driver_mm);
    if (result.driven_mm !== null) result.drivenPulleyMm = Number(result.driven_mm);
    if (result.motor_rpm !== null) result.motorRpm = Number(result.motor_rpm);
    if (result.power_kw !== null) result.shaftPowerKw = Number(result.power_kw);
    if (result.rhop !== null) result.oreDensitySg = Number(result.rhop);
    if (result.sg !== null) result.solidsSg = Number(result.sg);
    if (result.cw !== null) result.solidsWeightPercent = Number(result.cw);
    if (params.has('d95_cm')) {
      result.d95 = params.get('d95_cm');
      result.gyD95Cm = Number(result.d95);
    } else if (result.d95 !== null) {
      result.gyD95Cm = Number(result.d95);
    }
    if (result.lib_um !== null) result.liberationSizeMicrons = Number(result.lib_um);
    if (result.grade !== null) result.criticalGradeDecimal = Number(result.grade);
    if (result.air_psi !== null) result.airPressurePsi = Number(result.air_psi);
    if (result.gy_c !== null) result.gyConstantC = Number(result.gy_c);
    if (result.gy_err !== null) result.gyRelativeError = Number(result.gy_err);
    if (result.rr_n !== null) result.rosinRammlerSlopeN = Number(result.rr_n);
    if (params.has('sintoma')) result.sintoma = params.get('sintoma');
    if (params.has('falla')) result.falla = params.get('falla');
    else if (params.has('failure')) result.falla = params.get('failure');

    if (params.has('circuito')) result.circuito = params.get('circuito');
    else if (params.has('circuit')) result.circuito = params.get('circuit');
    if (result.circuito === 'control' || result.circuito === 'lab') {
      result.circuito = 'control_procesos';
    }

    const rawSku = params.get('sku') || params.get('sku_id');
    if (rawSku) {
      const resolvedSku = getQuickProductBySlugOrAlias(rawSku);
      if (resolvedSku) {
        result.sku = resolvedSku.id;
        if (!result.circuito) {
          const catMap = {
            lab: 'control_procesos',
            pumping: 'bombeo',
            classification: 'clasificacion',
            filtration: 'filtracion',
            flotation: 'flotacion'
          };
          result.circuito = catMap[resolvedSku.category_id] || resolvedSku.vertical || 'bombeo';
        }
        if (!result.equipo) {
          const skuRoleMap = {
            'SMAT-PUMP-WETKIT-554': 'kit_wet_end',
            'SMAT-PUMP-IMP-AH': 'solo_impulsor',
            'SMAT-PUMP-LINERS-AH': 'solo_voluta',
            'SMAT-PUMP-EXPELLER-KIT': 'kit_sellado',
            'SMAT-PUMP-BRG-005M': 'kit_rodamientos',
            'SMAT-COUPLED-PUMP-CYC': 'skid_bomba',
            'SMAT-CYC-D6-D20': 'hidrociclon_apex_vortex',
            'SMAT-SCR-TH48-30': 'malla_criba_poliuretano',
            'SMAT-SCR-MOD-1X1': 'malla_criba_poliuretano',
            'SMAT-FILT-CLOTH-PLATE': 'placas_telas',
            'SMAT-FILT-SHIFTER-CHAIN': 'placas_telas',
            'SMAT-FLOT-MECH-18SP': 'celda_flotacion',
            'SMAT-LAB-MARCY-1000': 'balanza_marcy',
            'SMAT-LAB-VASO-1000': 'balanza_marcy',
            'SMAT-LAB-TAMIZ-E11': 'tamices_laboratorio',
            'SMAT-LAB-ROTAP-MECH': 'tamices_laboratorio',
            'SMAT-LAB-PULV-DISC': 'balanza_marcy',
            'SMAT-LAB-PLATO-TENT': 'balanza_marcy',
            'SMAT-LAB-FILTRO-BATCH': 'filtro_batch_lab',
            'SMAT-LAB-FILTER-LPLT': 'filtro_batch_lab',
            'SMAT-LAB-FILTER-BARREL': 'filtro_batch_lab',
            'SMAT-LAB-FILTER-SPARES': 'filtro_batch_lab',
            'SMAT-LAB-BOND-JAR': 'filtro_batch_lab'
          };
          result.equipo = skuRoleMap[resolvedSku.id] || (resolvedSku.id.startsWith('SMAT-LAB-') ? 'balanza_marcy' : 'kit_wet_end');
        }
        if (!result.rol) {
          result.rol = result.equipo;
        }
        if (!result.material && (params.get('mat') || params.get('material') || resolvedSku.default_material)) {
          result.material = params.get('mat') || params.get('material') || resolvedSku.default_material || null;
        }
        if (!params.has('codigo') && !params.has('code') && Array.isArray(resolvedSku.atomic_codes) && resolvedSku.atomic_codes.length > 0) {
          const singlePartSkus = ['SMAT-PUMP-IMP-AH', 'SMAT-PUMP-LINERS-AH'];
          const preferredCode = resolvedSku.atomic_codes.includes('E4147')
            ? 'E4147'
            : resolvedSku.atomic_codes[0];
          const firstAtomic = resolveAtomicPartCode(preferredCode);
          if (firstAtomic) {
            result.atomic_part = firstAtomic;
            if (singlePartSkus.includes(resolvedSku.id)) {
              result.codigo = firstAtomic.part_number;
            }
            if (!result.serie) result.serie = firstAtomic.pipe_size;
          }
        }
      } else {
        const atomicFromSku = resolveAtomicPartCode(rawSku);
        if (atomicFromSku) {
          result.sku = atomicFromSku.part_number;
          result.atomic_part = atomicFromSku;
          if (!result.codigo) result.codigo = atomicFromSku.part_number;
          if (!result.circuito) result.circuito = atomicFromSku.circuit;
          if (!result.equipo) result.equipo = atomicFromSku.role;
          if (!result.rol) result.rol = atomicFromSku.role;
          if (!result.serie) result.serie = atomicFromSku.pipe_size;
        } else {
          result.sku = String(rawSku).trim().toUpperCase();
        }
      }
    }

    if (result.falla && (!result.equipo || !result.sintoma)) {
      const failureMap = {
        throatbush_recirculation: { equipo: 'solo_voluta', sintoma: 'arena_fina' },
        impeller_cavitation_erosion: { equipo: 'solo_impulsor', sintoma: 'roca_dura' },
        volute_cutwater_gouging: { equipo: 'kit_wet_end', sintoma: 'roca_dura' },
        liner_elastomer_tearing: { equipo: 'kit_wet_end', sintoma: 'acido_quimica' },
        seal_stuffing_box: { equipo: 'kit_sellado', sintoma: 'fuga_sello' },
        bearing_shaft_fatigue: { equipo: 'kit_rodamientos', sintoma: 'mixta_duda' }
      };
      const mappedFailure = failureMap[String(result.falla).trim().toLowerCase()];
      if (mappedFailure) {
        if (!result.equipo) result.equipo = mappedFailure.equipo;
        if (!result.sintoma) result.sintoma = mappedFailure.sintoma;
      }
    }

    if (params.has('flow')) result.flow = params.get('flow');
    if (params.has('solids')) result.solids = params.get('solids');
    else if (params.has('cw')) result.solids = params.get('cw');
    if (params.has('d80')) result.d80 = params.get('d80');
    else if (params.has('p80')) result.d80 = params.get('p80');
    if (result.d80 !== null) result.particleSizeD80Microns = Number(result.d80);

    // Si el usuario seleccionó una pieza específica en 1 clic sin pasar equipo, mapear al rol correspondiente
    if (!result.equipo && result.pieza) {
      const pLower = result.pieza.toLowerCase();
      if (pLower.includes('impulsor') || pLower.includes('impeller')) result.equipo = 'impulsor';
      else if (pLower.includes('throatbush') || pLower.includes('cuello') || pLower.includes('voluta') || pLower.includes('liner') || pLower.includes('fpl') || pLower.includes('554') || pLower.includes('5-5-4')) result.equipo = 'revestimientos';
      else if (pLower.includes('expeller') || pLower.includes('sello') || pLower.includes('camisa') || pLower.includes('sleeve')) result.equipo = 'sello';
      else if (pLower.includes('bearing') || pLower.includes('soporte') || pLower.includes('rodamiento')) result.equipo = 'soporte';
    }

    const rawCode = params.get('codigo') || params.get('code');
    if (rawCode) {
      result.codigo = rawCode.trim().toUpperCase();
      const atomic = resolveAtomicPartCode(result.codigo);
      if (atomic) {
        result.atomic_part = atomic;
        if (!result.circuito) result.circuito = atomic.circuit;
        if (!result.equipo) result.equipo = atomic.role;
        if (!result.serie) result.serie = atomic.pipe_size;
      }
    }
  } catch (_err) {
    // Resiliente ante cadenas malformadas
  }

  return result;
}

/**
 * Genera el Código de Configuración Institucional SMAT Limpio (Decisiones 1-B y 3-B)
 * Cero letras de bastidor (B/C/D/E/F) y cero sufijos de aleación en la salida del cliente.
 * @param {Object} data
 * @returns {string} e.g. SMAT-PUMP-6X4-WETKIT o SMAT-FLOT-100FT-MECH
 */
export function generateSmatPartCode(data = {}) {
  const circuit = (data.circuit || data.process_circuit || '').toLowerCase();
  const role = data.role_id || data.role || 'kit_wet_end';
  const roleLower = String(role).toLowerCase();
  const details = String(data.details || data.spec_details || '').toUpperCase().replace(/PRENSAESTOPA/g, 'ESTOPERA');
  const pipe = String(data.pipe_size || data.pipe || '').toLowerCase();
  const sizeVal = String(data.size_val || data.flot_capacity || data.filt_capacity || '').toLowerCase();
  const isPump = circuit === 'bombeo' || circuit === 'pumping';
  const isClass = circuit === 'clasificacion' || circuit === 'classification';

  const isCtrl = !isPump && !isClass && (circuit === 'control_procesos' || circuit === 'control' || roleLower.includes('marcy') || roleLower.includes('balanza') || roleLower.includes('batch') || roleLower.includes('tamiz') || roleLower.includes('tamices') || roleLower.includes('sieve') || (!circuit && (details.includes('MARCY') || details.includes('TAMIZ') || details.includes('ASTM E11'))));
  const isFlot = !isPump && !isClass && !isCtrl && (circuit === 'flotacion' || roleLower.includes('celda') || roleLower.includes('flotacion') || roleLower.includes('rotor') || roleLower.includes('estator') || roleLower.includes('mecanismo') || (!circuit && (details.includes('FLOT') || details.includes('CELDA'))));
  const isFilt = !isPump && !isClass && !isCtrl && !isFlot && (circuit === 'filtracion' || roleLower.includes('filtro') || roleLower.includes('prensa') || roleLower.includes('placa') || roleLower.includes('tela') || (!circuit && (details.includes('FILT') || details.includes('PRENSA'))));

  if (isCtrl) {
    if (roleLower.includes('marcy') || roleLower.includes('balanza')) return 'SMAT-CTRL-MARCY-1000';
    if (roleLower.includes('batch')) return 'SMAT-CTRL-BATCH-LAB';
    if (roleLower.includes('tamiz') || roleLower.includes('tamices') || roleLower.includes('sieve')) return 'SMAT-CTRL-SIEVE-ASTM';
    if (details.includes('BATCH')) return 'SMAT-CTRL-BATCH-LAB';
    if (details.includes('TAMIZ') || details.includes('ASTM')) return 'SMAT-CTRL-SIEVE-ASTM';
    return 'SMAT-CTRL-MARCY-1000';
  }

  if (isFlot) {
    let cap = '100FT';
    const dFlot = /\b50\b.*\b(?:A|TO|-)\b.*\b300\b/i.test(details) ? '' : details;
    if (sizeVal.includes('50') || dFlot.includes('50')) cap = '50FT';
    else if (sizeVal.includes('200') || dFlot.includes('200')) cap = '200FT';
    else if (sizeVal.includes('300') || dFlot.includes('300')) cap = '300FT';
    else if (sizeVal.includes('100') || dFlot.includes('100')) cap = '100FT';

    if (roleLower === 'bateria_celdas' || roleLower.includes('bateria')) return `SMAT-FLOT-${cap}-BANK`;
    if (roleLower === 'celda_flotacion' || roleLower.includes('celda')) return `SMAT-FLOT-${cap}-CELL`;
    if (roleLower === 'manto_difusor' || roleLower.includes('difusor')) return `SMAT-FLOT-${cap}-SHROUD`;
    return `SMAT-FLOT-${cap}-MECH`;
  }

  if (isFilt) {
    let pCap = '1500';
    const dFilt = /800.*\b(?:A|TO|-)\b.*1500/i.test(details) ? '' : details;
    if (sizeVal.includes('800') || dFilt.includes('800')) pCap = '800';
    else if (sizeVal.includes('1200') || dFilt.includes('1200')) pCap = '1200';
    else if (sizeVal.includes('2000') || dFilt.includes('2000')) pCap = '2000';
    else if (sizeVal.includes('1500') || dFilt.includes('1500')) pCap = '1500';

    if (roleLower === 'bomba_prensa') return `SMAT-FILT-${pCap}-PUMP`;
    if (roleLower === 'filtro_prensa' || roleLower.includes('prensa')) return `SMAT-FILT-${pCap}-PRESS`;
    if (roleLower === 'placas_membrana' || roleLower.includes('membrana')) return `SMAT-FILT-${pCap}-MEMBR`;
    return `SMAT-FILT-${pCap}-CLOTH`;
  }

  if (roleLower.includes('hidrociclon') || roleLower.includes('apex') || roleLower.includes('vortex')) {
    let cycTag = 'D15';
    if (sizeVal.includes('d6') || pipe.includes('d6') || details.includes('D6')) cycTag = 'D6';
    else if (sizeVal.includes('d10') || pipe.includes('d10') || details.includes('D10')) cycTag = 'D10';
    else if (sizeVal.includes('d20') || pipe.includes('d20') || details.includes('D20')) cycTag = 'D20';
    return `SMAT-CYC-${cycTag}-APEX`;
  }
  if (roleLower.includes('malla_criba') || roleLower.includes('cribado') || roleLower.includes('th48')) {
    if (sizeVal.includes('1x1') || details.includes('1X1') || details.includes('305')) return 'SMAT-SCR-MOD-1X1';
    return 'SMAT-SCR-TH48-30';
  }

  // Bombeo: series puramente nominales (sin letras de bastidor B/C/D/E/F)
  let pipeTag = '6X4';
  const dPipe = /\b(?:1\.5X1|4X3)\b.*\b(?:A|TO|-)\b.*\b(?:14X12|10X8)\b/i.test(details) ? '' : details;
  if (pipe === '1.5x1' || dPipe.includes('1.5X1')) pipeTag = '1.5X1';
  else if (pipe === '2x1.5' || dPipe.includes('2X1.5')) pipeTag = '2X1.5';
  else if (pipe === '3x2' || dPipe.includes('3X2') || (roleLower === 'sello' && dPipe.includes('4X3'))) pipeTag = '3X2';
  else if (pipe === '4x3' || dPipe.includes('4X3')) pipeTag = '4X3';
  else if (pipe === '6x4' || dPipe.includes('6X4')) pipeTag = '6X4';
  else if (pipe === '8x6' || dPipe.includes('8X6')) pipeTag = '8X6';
  else if (pipe === '10x8' || dPipe.includes('10X8')) pipeTag = '10X8';
  else if (pipe === '12x10' || dPipe.includes('12X10')) pipeTag = '12X10';
  else if (pipe === '14x12' || dPipe.includes('14X12')) pipeTag = '14X12';

  if (roleLower.includes('kit_sellado') || roleLower === 'sello') return `SMAT-SEAL-${pipeTag}-EXP`;
  if (roleLower.includes('kit_rodamientos') || roleLower === 'soporte') return `SMAT-BEAR-${pipeTag}-ASSY`;
  if (roleLower.includes('skid') || roleLower.includes('bomba_skid')) return `SMAT-SKID-${pipeTag}-STD`;
  if (roleLower.includes('solo_impulsor') || roleLower.includes('impulsor')) return `SMAT-PUMP-${pipeTag}-IMP`;
  if (roleLower.includes('solo_voluta') || roleLower.includes('voluta')) return `SMAT-PUMP-${pipeTag}-VOL`;
  if (roleLower.includes('revestimiento') || roleLower.includes('liner')) return `SMAT-PUMP-${pipeTag}-LINER`;
  return `SMAT-PUMP-${pipeTag}-WETKIT`;
}
