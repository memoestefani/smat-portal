/**
 * SMAT Minerals — SAP Plaintext/TSV Formatter, Part Code Decoder & Lead Webhook Export Engine
 * Extraído por costura limpia LCOM4 Parnas (∂(C)=0) desde districtProfilesAndSkuCatalog.js (SLICE-V34-11 · D8-V34).
 */
import {
  DEFAULT_SMAT_LEAD_WEBHOOK_URL,
  resolveAtomicPartCode,
  getAtomicPartSpecs,
  formatNioshErgonomicStatus,
  generateSmatPartCode
} from './districtProfilesAndSkuCatalog.js';

/**
 * Genera salida en formato TSV (Tab-Separated Values) estructurada para pegar en SAP / Excel (Decisión 10-A)
 * @param {Object} data 
 * @returns {string}
 */
export function formatSapTsv(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const date = data.date || new Date().toISOString().split('T')[0];
  const partName = (data.part_name || data.role || 'Impulsor de Proceso').replace(/[\t\n\r]/g, ' ');
  const smatCode = (data.smat_code || generateSmatPartCode(data)).replace(/[\t\n\r]/g, ' ');
  const qty = data.quantity || 1;
  const alloy = (data.metrics?.recommended_alloy || 'Dureza Metalúrgica Certificada').replace(/[\t\n\r]/g, ' ');
  const dest = (data.destination || 'Retiro en Almacén Central Durango').replace(/[\t\n\r]/g, ' ');
  const requester = (data.contact_name || data.name || 'Ingeniería').replace(/[\t\n\r]/g, ' ');
  const company = (data.company_name || data.company || 'Unidad Minera').replace(/[\t\n\r]/g, ' ');
  const phone = (data.phone_number || data.phone || '(618) 810-4408').replace(/[\t\n\r]/g, ' ');
  const clientRef = (data.client_reference || data.placa_ref || 'CONFIDENCIAL-1:1').replace(/[\t\n\r]/g, ' ');

  const headers = ['FOLIO_SMAT', 'FECHA', 'PARTIDA_DESCRIPCION', 'CODIGO_CONFIGURACION_SMAT', 'CANTIDAD', 'MATERIAL_ESPECIFICADO', 'REF_CLIENTE_CONFIDENCIAL', 'DESTINO_LOGISTICO', 'SOLICITANTE', 'EMPRESA', 'CONTACTO'];
  const row = [folio, date, partName, smatCode, qty, alloy, clientRef, dest, requester, company, phone];

  return `${headers.join('\t')}\n${row.join('\t')}`;
}

/**
 * Decodifica un código de configuración SMAT a objeto estructurado (Decisión 6-A)
 * Soporta tanto los nuevos códigos institucionales limpios (SMAT-PUMP-6X4-WETKIT)
 * como códigos históricos (SMAT-PUMP-6X4D-A05-IMP) y piezas atómicas (D3147..E4083).
 * @param {string} code - e.g. SMAT-PUMP-6X4-WETKIT o SMAT-FLOT-100FT-MECH
 * @param {'es'|'en'} [lang='es']
 * @returns {Object|null}
 */
export function parseSmatPartCode(code = '', lang = 'es') {
  if (!code || typeof code !== 'string') return null;
  const clean = code.trim().toUpperCase();

  // Soporte directo para las 6 refacciones atómicas universales (D3147..E4083)
  const atomicMatch = resolveAtomicPartCode(clean);
  if (atomicMatch) {
    return {
      valid: true,
      raw: clean,
      code: atomicMatch.smat_code,
      atomic_code: atomicMatch.part_number,
      atomic_label: lang === 'en' ? atomicMatch.name_en : atomicMatch.name_es,
      atomic_metallurgy: atomicMatch.metallurgy,
      circuit: atomicMatch.circuit,
      line: atomicMatch.role === 'kit_sellado' ? 'SEAL' : 'PUMP',
      series: atomicMatch.pipe_size.toUpperCase(),
      pipe_size: atomicMatch.pipe_size,
      size: atomicMatch.pipe_size,
      frame: atomicMatch.frame,
      alloyOrType: 'A05',
      role: atomicMatch.role,
      role_id: atomicMatch.role,
      isOpex: true,
      mission: 'refacciones',
      alloy: atomicMatch.metallurgy,
      name_es: atomicMatch.name_es,
      name_en: atomicMatch.name_en
    };
  }

  if (!clean.startsWith('SMAT-')) return null;

  const parts = clean.split('-');
  if (parts.length < 3) return null;

  const line = parts[1]; // PUMP, FLOT, FILT, SEAL, BEAR, SKID, CTRL
  const series = parts[2]; // 6X4, 6X4D, 3X2, 4X3C, 8X6, 10X8, 100FT, 50FT, 1500, PRESS
  const token3 = parts[3] || '';

  let circuit = 'bombeo';
  let role_id = 'impulsor';
  let ui_role = 'kit_wet_end';
  let size = '6x4';
  let isOpex = true;
  let mission = 'refacciones';
  let alloy = clean.includes('RUB') || clean.includes('R55')
    ? 'Caucho Natural Vulcanizado'
    : (token3 === 'U01' || clean.includes('-U01')
      ? 'U01'
      : (parts.includes('PU')
        ? 'Poliuretano Elastómero U01 (Shore A 85–95)'
        : (token3 === 'A05' || clean.includes('A05') ? 'A05' : 'Dureza Metalúrgica Certificada')));

  if (line === 'SKID') {
    role_id = 'skid_bomba';
    ui_role = 'skid_bomba';
    isOpex = false;
    mission = 'equipos';
  } else if (line === 'PUMP') {
    if (clean.includes('WETKIT')) {
      role_id = 'kit_wet_end';
      ui_role = 'kit_wet_end';
    } else if (clean.includes('VOL')) {
      role_id = 'solo_voluta';
      ui_role = 'solo_voluta';
    } else if (clean.includes('LINER')) {
      role_id = 'revestimientos';
      ui_role = 'solo_voluta';
    } else {
      role_id = 'impulsor';
      ui_role = 'solo_impulsor';
    }
  } else if (line === 'SEAL') {
    role_id = 'sello';
    ui_role = 'kit_sellado';
  } else if (line === 'BEAR') {
    role_id = 'soporte';
    ui_role = 'kit_rodamientos';
  } else if (line === 'FLOT') {
    circuit = 'flotacion';
    if (clean.includes('50FT')) size = '50ft';
    else if (clean.includes('200FT')) size = '200ft';
    else if (clean.includes('300FT')) size = '300ft';
    else size = '100ft';
    if (clean.includes('CELL')) {
      role_id = 'celda_flotacion';
      ui_role = 'celda_flotacion';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('BANK')) {
      role_id = 'bateria_celdas';
      ui_role = 'bateria_celdas';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('SHROUD')) {
      role_id = 'manto_difusor';
      ui_role = 'manto_difusor';
    } else {
      role_id = 'rotor_estator';
      ui_role = 'rotor_estator';
    }
  } else if (line === 'CTRL') {
    circuit = 'control_procesos';
    if (clean.includes('BATCH')) {
      role_id = 'filtro_batch_lab';
      ui_role = 'filtro_batch_lab';
      size = 'batch_100psi';
      isOpex = false;
      mission = 'equipos';
      alloy = 'Acero Estructural Bridado (60-100 psi)';
    } else if (clean.includes('SIEVE') || clean.includes('ASTM')) {
      role_id = 'tamices_laboratorio';
      ui_role = 'tamices_laboratorio';
      size = 'astm_8in_inox';
      isOpex = true;
      mission = 'refacciones';
      alloy = 'Acero Inoxidable / Bronce Certificado ASTM E11';
    } else {
      role_id = 'balanza_marcy';
      ui_role = 'balanza_marcy';
      size = 'marcy_12_rings';
      isOpex = false;
      mission = 'equipos';
      alloy = 'Vaso 1000 cm³ Acero Inox 304 + 12 Anillos (Ss 2.2-4.4)';
    }
  } else if (line === 'FILT') {
    circuit = 'filtracion';
    if (clean.includes('800')) size = '800';
    else if (clean.includes('1200')) size = '1200';
    else if (clean.includes('2000')) size = '2000';
    else size = '1500';
    if (clean.includes('PRESS') || clean.includes('16BAR')) {
      role_id = 'filtro_prensa';
      ui_role = 'filtro_prensa';
      isOpex = false;
      mission = 'equipos';
    } else if (clean.includes('MEMBR')) {
      role_id = 'placas_membrana';
      ui_role = 'placas_membrana';
    } else if (clean.includes('PUMP')) {
      role_id = 'bomba_prensa';
      ui_role = 'bomba_prensa';
    } else {
      role_id = 'placas_telas';
      ui_role = 'placas_telas';
    }
  }

  if (circuit === 'bombeo') {
    if (clean.includes('1.5X1')) size = '1.5x1';
    else if (clean.includes('2X1.5')) size = '2x1.5';
    else if (clean.includes('4X3')) size = '4x3';
    else if (clean.includes('3X2')) size = '3x2';
    else if (clean.includes('8X6')) size = '8x6';
    else if (clean.includes('10X8')) size = '10x8';
    else if (clean.includes('12X10')) size = '12x10';
    else if (clean.includes('14X12')) size = '14x12';
    else size = '6x4';
  }

  // Extraer marco dimensional (C, D, E, F) si aplica en códigos legacy
  let frame = '';
  const frameMatch = series.match(/\d+X\d+([A-Z])/);
  if (frameMatch) frame = frameMatch[1];

  const resolvedSpecs = circuit === 'bombeo' ? getAtomicPartSpecs(ui_role, size) : null;

  return {
    valid: true,
    raw: clean,
    code: clean,
    atomic_code: resolvedSpecs ? (resolvedSpecs.part_number || '') : '',
    atomic_label: resolvedSpecs ? (lang === 'en' ? resolvedSpecs.name_en : resolvedSpecs.name_es) : '',
    atomic_metallurgy: resolvedSpecs ? (resolvedSpecs.metallurgy || '') : '',
    circuit,
    line,
    series,
    size,
    frame,
    alloyOrType: token3,
    role: role_id,
    role_id,
    ui_role,
    isOpex,
    mission,
    alloy
  };
}

export function formatSapPlaintextImpl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const date = data.date || new Date().toISOString().split('T')[0];
  const requester = data.contact_name || data.name || 'Ingeniería / Residente';
  const company = data.company_name || data.company || 'Unidad Minera / Empresa';
  const phoneVal = data.phone_number || data.phone || '';
  const emailVal = data.email_address || data.email || '';
  const contact = phoneVal ? `${phoneVal} • ${emailVal}` : (emailVal || 'N/A');
  const logisticsLabels = { retiro: 'Retiro en Almacén Central Durango (Coordinación con Folio)', fletera: 'Fletera Consolidada Nacional (Ocurre en Destino)', dedicado: 'Flete Dedicado Directo / Enlace Multimodal a Mina' };
  const logisticsMode = data.logistics_mode || data.logistics || 'retiro';
  const logisticsText = logisticsLabels[logisticsMode] || logisticsMode;
  const channelLabels = {
    llamada: 'Llamada telefónica directa',
    whatsapp: 'WhatsApp de Planta (L-V 08:00-18:00)',
    correo: 'Correo formal con cotización PDF'
  };
  const channelMode = data.channel_preference || data.canal_preferido || data.channel_pref || 'whatsapp';
  const channelText = channelLabels[channelMode] || channelMode;
  const missionLabels = {
    equipos: 'Equipos Completos / Circuito de Planta',
    refacciones: 'Refaccionamiento Crítico de Desgaste'
  };
  const missionMode = data.mission || data.mision || data.mission_type || (data.package_items && data.package_items.length > 0 ? 'equipos' : 'refacciones');
  const missionText = missionLabels[missionMode] || missionMode;
  const destination = data.destination || data.delivery_destination || data.destino || 'Retiro en Almacén Central Durango';
  const partName = data.part_name || data.role || 'Impulsor de 5 álabes High Chrome 27% (A05) >650 HB';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const atomicCode = data.atomic_code || '';
  const clientRef = data.client_reference || '';
  const pulpProfile = data.pulp_profile || '';
  const dimDia = data.dim_outer_dia || '';
  const dimBore = data.dim_shaft_bore || '';
  const partQty = data.quantity || 1;
  const metrics = data.metrics || {};
  const tco = data.tco || {};
  const isCustom = data.is_custom || false;
  const customNotes = data.custom_notes || '';
  const packageItems = data.package_items || [];
  let lines = [
    `=================================================================`,
    `REQUISICIÓN TÉCNICA FORMAL - SMAT MINERALS (DURANGO, MÉXICO)`,
    `FOLIO INSTITUCIONAL: ${folio}  |  FECHA: ${date}`,
    `=================================================================`,
    ``,
    `1. DATOS DE CONTROL Y DESTINO FOB:`,
    `   - Solicitante:   ${requester}`,
    `   - Mina/Empresa:  ${company}`,
    `   - Contacto:      ${contact}`,
    `   - Canal Preferido: ${channelText}`,
    `   - Modalidad Logística: ${logisticsText}`,
    `   - Punto Entrega: ${destination}`,
  ];
  if (pulpProfile) {
    lines.push(`   - Perfil Mineral Unidad: ${pulpProfile}`);
  }
  lines.push(
    ``,
    `2. ESPECIFICACIÓN TÉCNICA DE PARTIDA (SAP / ERP):`,
    `   - Tipo de Solicitud: ${missionText}`,
    `   - Partida / Equipo:  ${partName}`,
    `   - Código SMAT:       ${smatCode}${atomicCode ? ` (Refacción Específica: ${atomicCode})` : ''}`,
    `   - Cantidad:          ${partQty} pza(s)`,
    `   - Domicilio Fiscal:  Mariano Salas #114, Col. Hipódromo, Durango, Dgo. CP 34166`,
    `   - Almacén/Despacho:  Durango, Dgo. (Retiro en patio coordinado con folio)`
  );
  const rawLookupCode = data.atomic_code || data.code || data.codigo || '';
  const ps = data.part_specs || (rawLookupCode ? getAtomicPartSpecs(rawLookupCode, data.series || data.pipe_size || '6x4') : {});
  const ce = data.clearance_eval || {};
  const kin = data.kinematics || {};
  const met = data.metrology || {};
  const resolvedDrive = data.transmision || data.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedMat = data.material || data.wet_material || data.pump_material || '';
  const resolvedStation = data.estacion || data.station_number || data.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = data.peso_kg || data.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = data.claro_mm || data.front_clearance_mm || ce.frontClearanceMm || '';
  const resolvedDeltaEta = data.delta_eta_v !== undefined ? data.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct);
  const resolvedU2 = data.u2_ms || data.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedPumpRpm = data.n2_rpm || data.pump_rpm || kin.pumpRpm || '';
  const resolvedFrKn = data.fr_kn !== undefined ? data.fr_kn : (data.belt_radial_load_kn ?? kin.beltRadialLoadKn ?? '');
  const resolvedFlood = data.inmunidad_sumidero || data.sump_flood_immunity || kin.sumpFloodImmunity || '';
  const resolvedStructural = data.razon_estructural || data.structural_reason || ce.structuralReasonEs || '';
  const resolvedL10h = data.l10h || data.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = data.metrologia || data.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );
  if (clientRef) {
    lines.push(`   - Referencia Interna Cliente: ${clientRef}`);
  }
  if (dimDia || dimBore) {
    lines.push(`   - Medidas Campo (Flexómetro): DE ~${dimDia || 'N/A'} mm | Barreno/Flecha ~${dimBore || 'N/A'} mm`);
  }
  if (resolvedDrive) {
    lines.push(`   - Arreglo Transmisión:        ${String(resolvedDrive).toUpperCase()} (Cinemática de Poleas / Acoplamiento)`);
  }
  if (resolvedMat) {
    lines.push(`   - Material Contacto Húmedo:   ${resolvedMat}`);
  }
  if (resolvedStation) {
    const stStr = String(resolvedStation).replace(/^S/i, '');
    lines.push(`   - Estación de Armado BOM:     Estación 0${stStr}`);
  }
  if (resolvedWeight) {
    const wKg = Number(resolvedWeight);
    const nioshEval = formatNioshErgonomicStatus(wKg, 'es');
    lines.push(`   - Masa Unitaria / Izaje:      ${wKg.toFixed(1)} kg (${nioshEval.detailText} • [${nioshEval.tier}])`);
  }
  if (resolvedClaro) {
    const lossStr = resolvedDeltaEta !== undefined ? ` | Pérdida Recirculación Δη_v: ${resolvedDeltaEta}%` : '';
    const pipeLossVal = data.pipe_vel_loss_pct !== undefined ? data.pipe_vel_loss_pct : ce.pipeVelocityMarginLossPct;
    const pipeLossStr = pipeLossVal !== undefined && pipeLossVal !== '' ? ` | Δv_tubería = -${pipeLossVal}%` : '';
    lines.push(`   - Calibración Claro Axial δ:  ${resolvedClaro} mm${lossStr}${pipeLossStr}`);
  }
  if (resolvedStructural) {
    lines.push(`   - Dictamen Estructural:       ${resolvedStructural}`);
  }
  if (resolvedU2 || resolvedL10h || resolvedPumpRpm || resolvedFrKn !== '') {
    const u2Val = resolvedU2 || '19.9';
    const l10Val = resolvedL10h || '28500';
    const rpmSuffix = resolvedPumpRpm ? ` | n2 = ${resolvedPumpRpm} RPM` : '';
    const frSuffix = resolvedFrKn !== '' ? ` | Fr = ${Number(resolvedFrKn).toFixed(2)} kN` : '';
    const floodSuffix = resolvedFlood ? ` | Sumidero = ${resolvedFlood}` : '';
    lines.push(`   - Cinemática V-Belt & ISO281: u2 = ${u2Val} m/s${rpmSuffix}${frSuffix} | Vida Rodamientos L10h = ${l10Val} h${floodSuffix}`);
  }
  if (resolvedMetrology) {
    lines.push(`   - Cédula Metrológica Lab:     ${resolvedMetrology}`);
  }
  if (data.details) {
    lines.push(`   - Notas de Operación:         ${data.details}`);
  }
  if (packageItems.length > 0) {
    lines.push(`   - Partidas Requeridas en Circuito:`);
    const itemNames = {
      bomba_skid: 'Bomba centrífuga para lodos sobre base estructural con motor acoplado',
      celdas_flotacion: 'Batería de mecanismos de flotación',
      filtro_prensa: 'Filtro prensa para deshidratación y jales secos',
      refacciones_inicio: 'Paquete de refacciones de desgaste (impulsores, telas, sellos)'
    };
    for (const it of packageItems) {
      lines.push(`     • ${itemNames[it] || it}`);
    }
  }
  if (isCustom) {
    lines.push(`   - Estatus:       [EQUIPO ESPECIAL FUERA DE CATÁLOGO]`);
    if (customNotes) {
      lines.push(`   - Requerimiento: ${customNotes}`);
    }
  }
  if (metrics.solids_cw !== undefined || metrics.critical_velocity_ms !== undefined || metrics.flow_m3h !== undefined) {
    lines.push(``);
    lines.push(`3. MEMORIA DE CÁLCULO HIDRÁULICO (FÓRMULA DURAND-CONDOLIOS):`);
    if (metrics.flow_m3h !== undefined) lines.push(`   - Flujo de Operación:        ${metrics.flow_m3h} m³/h`);
    if (metrics.solids_cw !== undefined) lines.push(`   - Concentración de Sólidos:  ${metrics.solids_cw}% Cw (S_s: ${metrics.solid_sg || 2.7}${metrics.d80_um ? `, d80: ${metrics.d80_um} µm` : ''})`);
    if (metrics.slurry_sg !== undefined) lines.push(`   - Densidad de Pulpa (S_m):   ${metrics.slurry_sg} kg/L${metrics.solids_cv !== undefined ? ` (${metrics.solids_cv}% Cv)` : ''}`);
    if (metrics.head_ratio !== undefined) lines.push(`   - Factor Derating (HR / ηr): ${metrics.head_ratio} / Er (Cave): ${metrics.eff_ratio_er || data.eff_ratio_er || '0.84'}`);
    if (metrics.impeller_life_h !== undefined || data.impeller_life_h !== undefined) {
      lines.push(`   - Vida Estimada Impulsor:    ${metrics.impeller_life_h || data.impeller_life_h} h (${metrics.wear_life_ratio || data.wear_life_ratio || '3.8'}x vs Fierro Gris)`);
    }
    if (metrics.critical_velocity_ms !== undefined) lines.push(`   - Velocidad Límite Durand:   ${metrics.critical_velocity_ms} m/s (Evita arenamiento)`);
    if (metrics.altitude_msnm !== undefined) {
      const patm = metrics.p_atm_mca || data.p_atm_mca || '7.66';
      const dnpsh = metrics.delta_npsh_m || data.delta_npsh_m || '2.67';
      const fIec = metrics.motor_derating_iec || data.motor_derating_iec || '0.860';
      const kAlt = metrics.k_motor_alt || data.k_motor_alt || '1.38';
      lines.push(`   - Altitud y Pinza Térmica:   ${metrics.altitude_msnm} msnm (Patm=${patm} mca, -ΔNPSHa=${dnpsh} m, IEC=${fIec}, K_motor,alt = ${kAlt}x)`);
    }
    if (metrics.recommended_alloy) lines.push(`   - Metalurgia Sugerida:       ${metrics.recommended_alloy}`);
    const tcoTons = tco.tco_tons_at_risk !== undefined ? tco.tco_tons_at_risk : metrics.tco_tons_at_risk;
    const tcoHrs = tco.tco_downtime_hrs !== undefined ? tco.tco_downtime_hrs : metrics.tco_downtime_hrs;
    const tcoSummary = tco.tco_summary || metrics.tco_summary || '';
    if (tcoTons !== undefined || tcoSummary) {
      lines.push(`   - Continuidad / TCO:         ~${tcoTons || 0} ton en riesgo (${tcoHrs || 4}h paro) | ${tcoSummary}`);
    }
  }
  lines.push(``);
  lines.push(`4. PROTOCOLO DE INSPECCIÓN Y CONDICIONES DE SUMINISTRO:`);
  lines.push(`   - Verificación de concentricidad y plantilla maestra 1:1 en Almacén Central Durango.`);
  lines.push(`   - Verificación metrológica de acople dimensional 1:1 y Dureza Metalúrgica Certificada.`);
  lines.push(`   - Validación preliminar de compatibilidad según datos de laboratorio vinculada a la cotización formal.`);
  lines.push(`   - Ensambles completos configurados sobre pedido; refacciones con rotación continua.`);
  lines.push(`   - Despacho nacional desde Almacén Central Durango: (618) 810-4408 | ventas@smatminerals.com`);
  lines.push(`=================================================================`);
  return lines.join('\n');
}

export function formatMailtoUrlImpl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const company = data.company_name || data.company || 'Unidad Minera';
  const partName = data.part_name || data.role || 'Refaccionamiento Minero';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const targetEmail = data.target_email || data.email_address || 'ventas@smatminerals.com';
  const subject = `[Requisición ${folio}] [${smatCode}] ${company} - ${partName}`;
  const body = formatSapPlaintextImpl(data);
  return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function formatWhatsappUrlImpl(data = {}) {
  const folio = data.folio || 'SMAT-2026-8810';
  const requester = data.contact_name || data.name || 'Ingeniero Solicitante';
  const company = data.company_name || data.company || 'Empresa';
  const phoneContact = data.phone_number || data.phone || '';
  const partName = data.part_name || data.role || 'Refacción de Bomba';
  const smatCode = data.smat_code || generateSmatPartCode(data);
  const atomicCode = data.atomic_code || '';
  const circuit = (data.circuit || 'BOMBEO').toUpperCase();
  const priorityTag = data.isOpex === false ? '[PROYECTO DE PLANTA]' : '[PARO DE PLANTA]';
  const rawLookupCode = data.atomic_code || data.code || data.codigo || '';
  const ps = data.part_specs || (rawLookupCode ? getAtomicPartSpecs(rawLookupCode, data.series || data.pipe_size || '6x4') : {});
  const ce = data.clearance_eval || {};
  const kin = data.kinematics || {};
  const met = data.metrology || {};
  const m = data.metrics || {};
  const resolvedMat = data.material || data.wet_material || data.pump_material || '';
  const resolvedDrive = data.transmision || data.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedStation = data.estacion || data.station_number || data.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = data.peso_kg || data.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = data.claro_mm !== undefined ? data.claro_mm : (data.front_clearance_mm ?? ce.frontClearanceMm ?? '');
  const resolvedDeltaEta = data.delta_eta_v !== undefined ? data.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct ?? '');
  const resolvedU2 = data.u2_ms || data.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedPumpRpm = data.n2_rpm || data.pump_rpm || kin.pumpRpm || '';
  const resolvedFrKn = data.fr_kn !== undefined ? data.fr_kn : (data.belt_radial_load_kn ?? kin.beltRadialLoadKn ?? '');
  const resolvedFlood = data.inmunidad_sumidero || data.sump_flood_immunity || kin.sumpFloodImmunity || '';
  const resolvedL10h = data.l10h || data.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = data.metrologia || data.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );
  const lines = [
    `Hola SMAT Durango, requiero cotización y confirmación de stock para:`,
    `*Prioridad:* ${priorityTag}`,
    `*Folio:* ${folio}`,
    `*Circuito:* ${circuit}`,
    `*Mina:* ${company} (${requester}${phoneContact ? ` • ${phoneContact}` : ''})`,
    `*Equipo/Partida:* ${partName}`,
    `*Código SMAT:* ${smatCode}${atomicCode ? ` (Refacción: ${atomicCode})` : ''}`
  ];
  if (data.pulp_profile) {
    lines.push(`*Perfil Mineral:* ${data.pulp_profile}`);
  }
  if (resolvedMat || resolvedDrive || resolvedStation || resolvedWeight) {
    const mechParts = [];
    if (resolvedMat) mechParts.push(`Mat: ${resolvedMat}`);
    if (resolvedDrive) mechParts.push(`Transmisión: ${resolvedDrive}`);
    if (resolvedStation) mechParts.push(`Estación: ${resolvedStation}`);
    if (resolvedWeight) mechParts.push(`Masa NIOSH: ${resolvedWeight} kg`);
    lines.push(`*Ingeniería / BOM:* ${mechParts.join(' | ')}`);
  }
  if (resolvedClaro !== '' || resolvedU2 || resolvedL10h || resolvedPumpRpm || resolvedFrKn !== '') {
    const kinParts = [];
    if (resolvedClaro !== '') {
      kinParts.push(`Claro axial δ=${resolvedClaro} mm${resolvedDeltaEta !== '' ? ` (Δηv=-${resolvedDeltaEta}%)` : ''}`);
    }
    if (resolvedU2) kinParts.push(`u2=${resolvedU2} m/s`);
    if (resolvedPumpRpm) kinParts.push(`n2=${resolvedPumpRpm} RPM`);
    if (resolvedFrKn !== '') kinParts.push(`Fr=${Number(resolvedFrKn).toFixed(2)} kN`);
    if (resolvedL10h) kinParts.push(`L10h=${resolvedL10h} h`);
    if (resolvedFlood) kinParts.push(`Sumidero=${resolvedFlood}`);
    lines.push(`*Claro Axial y Cinemática V-Belt:* ${kinParts.join(' | ')}`);
  }
  if (m.flow_m3h !== undefined || m.slurry_sg !== undefined) {
    lines.push(`*Hidráulica Durand:* ${m.flow_m3h || 180} m³/h @ ${m.solids_cw || 45}% Cw, Sm=${m.slurry_sg || '1.40'} kg/L, Vc=${m.critical_velocity_ms || '2.35'} m/s, HR=${m.head_ratio || '0.88'}`);
  }
  if (resolvedMetrology) {
    lines.push(`*Cédula Metrológica Lab:* ${resolvedMetrology}`);
  }
  if (data.dim_outer_dia || data.dim_shaft_bore) {
    lines.push(`*Medidas flexómetro:* DE ${data.dim_outer_dia || 'N/A'}, Barreno ${data.dim_shaft_bore || 'N/A'}`);
  }
  if (data.details) {
    lines.push(`*Detalles:* ${data.details}`);
  }
  if (data.client_reference) {
    lines.push(`*Ref. Cliente:* ${data.client_reference}`);
  }
  if (data.destination) {
    lines.push(`*Destino:* ${data.destination}`);
  }
  lines.push(``);
  lines.push(`*Instrucción de Almacén Durango:* Favor de adjuntar fotografía de la pieza con un flexómetro de referencia para cotejo 1:1.`);
  if (data.has_photo) {
    lines.push(`[Adjunto foto de placa/equipo para cotejo 1:1]`);
  }
  lines.push(`Favor de confirmar tiempo de despacho en Almacén Central Durango.`);
  const text = lines.join('\n');
  const phone = '526183670664';
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildCanonicalEngineeringSnapshotImpl(d = {}) {
  const m = d.metrics || {};
  const tco = d.tco || {};
  const ps = d.part_specs || {};
  const ce = d.clearance_eval || {};
  const kin = d.kinematics || {};
  const met = d.metrology || {};
  const gate = d.gate_eval || {};
  const measures = (d.dim_outer_dia || d.dim_shaft_bore)
    ? `DE ~${d.dim_outer_dia || 'N/A'} mm | Barreno/Flecha ~${d.dim_shaft_bore || 'N/A'} mm`
    : (d.medidas || '');
  const flowM3h = m.flow_m3h ?? d.flow_m3h ?? 180;
  const solidsCw = m.solids_cw ?? d.solids_cw ?? 45;
  const d80Um = m.d80_um ?? d.d80_um ?? 180;
  const slurrySg = m.slurry_sg ?? d.slurry_sg ?? '1.40';
  const solidsCv = d.cv ?? d.solidsVolumetricPercent ?? m.solids_cv ?? '23.3';
  const critVel = m.critical_velocity_ms ?? d.critical_velocity_ms ?? '2.35';
  const safeVel = d.v_rec ?? d.recommendedPipeVelocityMs ?? m.safe_velocity_ms ?? '2.82';
  const durandFl = d.fl ?? d.durandFactorFL ?? m.durand_fl ?? '1.08';
  const headRatio = m.head_ratio ?? d.headDeratingFactorHr ?? '0.88';
  const effRatio = d.eff_ratio_er ?? m.eff_ratio_er ?? d.effDeratingFactorEr ?? '0.84';
  const impellerLifeH = d.impeller_life_h ?? m.impeller_life_h ?? d.estimatedImpellerLifeHours ?? 1850;
  const wearLifeRatio = d.wear_life_ratio ?? m.wear_life_ratio ?? d.wearLifeRatio ?? '3.8';
  const altitudeMsnm = m.altitude_msnm ?? d.altitude_msnm ?? d.altitudeM ?? 2200;
  const pAtmMca = d.p_atm_mca ?? m.p_atm_mca ?? d.pAtmHeadMca ?? Number(Math.max(5.0, 10.33 - (Number(altitudeMsnm) / 900)).toFixed(2));
  const deltaNpshM = d.delta_npsh_m ?? m.delta_npsh_m ?? d.deltaNpshLossM ?? Number((10.33 - Number(pAtmMca)).toFixed(2));
  const motorDeratingIec = d.motor_derating_iec ?? m.motor_derating_iec ?? d.motorDeratingFactor ?? (Number(altitudeMsnm) > 1000 ? Number(Math.max(0.70, 1.0 - ((Number(altitudeMsnm) - 1000) / 10000)).toFixed(3)) : 1.0);
  const kMotorAlt = d.k_motor_alt ?? m.k_motor_alt ?? d.combinedMotorAltitudeMultiplier ?? Number((1.0 / Math.max(0.25, Number(effRatio) * Number(motorDeratingIec))).toFixed(3));
  const recAlloy = m.recommended_alloy || d.recommended_alloy || 'High Chrome A05 (>650 HB)';
  const hydraulicsStr = (m.flow_m3h !== undefined || m.slurry_sg !== undefined || d.hidraulica)
    ? (d.hidraulica || `Q: ${flowM3h} m³/h | Cw: ${solidsCw}% (d80: ${d80Um} µm) | Sm: ${slurrySg} kg/L (${solidsCv}% Cv) | Vc: ${critVel} m/s | HR: ${headRatio} | ηr: ${effRatio} | Vida: ${impellerLifeH}h (${wearLifeRatio}x) | ${recAlloy}`)
    : '';
  const tcoTons = tco.tco_tons_at_risk !== undefined ? tco.tco_tons_at_risk : m.tco_tons_at_risk;
  const tcoHrs = tco.tco_downtime_hrs !== undefined ? tco.tco_downtime_hrs : m.tco_downtime_hrs;
  const tcoSummary = tco.tco_summary || m.tco_summary || '';
  const tcoStr = (tcoTons !== undefined || tcoSummary)
    ? `~${tcoTons || 0} ton en riesgo (${tcoHrs || 4}h) | ${tcoSummary}`
    : (d.tco_str || '');
  const resolvedMat = d.material || d.wet_material || d.pump_material || '';
  const resolvedDrive = d.transmision || d.drive_arrangement || kin.arrangement || kin.arrangementCode || '';
  const resolvedStation = d.estacion || d.station_number || d.assembly_station || ps.station_number || ps.station || '';
  const resolvedWeight = d.peso_kg || d.part_weight_kg || ps.weight_kg || '';
  const resolvedClaro = d.claro_mm !== undefined ? d.claro_mm : (d.front_clearance_mm ?? ce.frontClearanceMm ?? '');
  const resolvedDeltaEta = d.delta_eta_v !== undefined ? d.delta_eta_v : (ce.volumetricEfficiencyDropPct ?? ce.volumetricEfficiencyLossPct);
  const resolvedPipeVelLoss = d.pipe_vel_loss_pct !== undefined ? d.pipe_vel_loss_pct : (ce.pipeVelocityMarginLossPct ?? '');
  const resolvedU2 = d.u2_ms || d.tip_speed_ms || kin.tipSpeedMs || '';
  const resolvedPumpRpm = d.n2_rpm || d.pump_rpm || kin.pumpRpm || '';
  const resolvedFrKn = d.fr_kn !== undefined ? d.fr_kn : (d.belt_radial_load_kn ?? kin.beltRadialLoadKn);
  const resolvedFlood = d.inmunidad_sumidero || d.sump_flood_immunity || kin.sumpFloodImmunity || '';
  const resolvedStructural = d.razon_estructural || d.structural_reason || ce.structuralReasonEs || '';
  const resolvedL10h = d.l10h || d.bearing_l10h || kin.bearingL10Hours || kin.estimatedL10hHours || '';
  const resolvedMetrology = d.metrologia || dataMetrologyFallback(d, met);
  const phVal = (d.ph !== undefined && d.ph !== '') ? d.ph : ((d.pulpPh !== undefined && d.pulpPh !== '') ? d.pulpPh : m.pulp_ph);
  const sealBranch = d.seal_branch || d.sealBranch || ce.sealBranch || '';
  const b2Mm = d.b2_mm || d.impellerExitWidthMm || ce.impellerExitWidthMm || '';
  const capCKn = d.cap_c_kn || d.dynamicCapacityCkN || kin.dynamicCapacityCkN || '';
  const rhopVal = d.rhop ?? d.oreDensitySg ?? met.sm ?? met.pulpDensityKgL;
  const gateClass = d.gate_classification || gate.classification || 'PRIORITY_MINING_PLANT';
  const trustBoundaryId = d.trust_boundary_id || gate.activeTrustBoundaryId || '';
  return {
    folio: d.folio || 'SMAT-2026-RFQ',
    urgencia: d.isOpex === false ? 'proyecto' : 'paro',
    puerta_interna: resolveInternalBudgetCategory(d),
    nombre: d.name || d.contact_name || d.nombre || '',
    empresa: d.company || d.company_name || d.empresa || '',
    telefono: d.phone || d.phone_number || d.telefono || '',
    correo: d.email || d.email_address || d.correo || '',
    equipo: d.part_name || d.role || d.equipo || '',
    codigo: d.smat_code || d.codigo || generateSmatPartCode(d),
    pieza: d.atomic_code || d.pieza || d.part_slug || '',
    ref_cliente: d.client_reference || d.ref_cliente || '',
    medidas: measures,
    perfil_pulpa: d.pulp_profile || d.perfil_pulpa || '',
    hidraulica: hydraulicsStr,
    tco: tcoStr,
    material: resolvedMat ? String(resolvedMat) : '',
    transmision: resolvedDrive ? String(resolvedDrive) : '',
    estacion: resolvedStation ? String(resolvedStation) : '',
    peso_kg: resolvedWeight !== '' && resolvedWeight !== undefined ? Number(resolvedWeight) : '',
    claro_mm: resolvedClaro !== '' && resolvedClaro !== undefined ? Number(resolvedClaro) : '',
    delta_eta_v: resolvedDeltaEta !== undefined && resolvedDeltaEta !== '' ? Number(resolvedDeltaEta) : '',
    pipe_vel_loss_pct: resolvedPipeVelLoss !== undefined && resolvedPipeVelLoss !== '' ? Number(resolvedPipeVelLoss) : '',
    u2_ms: resolvedU2 !== '' && resolvedU2 !== undefined ? Number(resolvedU2) : '',
    n2_rpm: resolvedPumpRpm !== '' && resolvedPumpRpm !== undefined ? Number(resolvedPumpRpm) : '',
    fr_kn: resolvedFrKn !== undefined && resolvedFrKn !== '' ? Number(resolvedFrKn) : '',
    inmunidad_sumidero: resolvedFlood ? String(resolvedFlood) : '',
    razon_estructural: resolvedStructural ? String(resolvedStructural) : '',
    l10h: resolvedL10h !== '' && resolvedL10h !== undefined ? Number(resolvedL10h) : '',
    metrologia: resolvedMetrology ? String(resolvedMetrology) : '',
    ph: phVal !== undefined && phVal !== '' ? Number(phVal) : '',
    seal_branch: sealBranch ? String(sealBranch) : '',
    b2_mm: b2Mm !== '' && b2Mm !== undefined ? Number(b2Mm) : '',
    cap_c_kn: capCKn !== '' && capCKn !== undefined ? Number(capCKn) : '',
    fl: (d.fl !== undefined || d.durandFactorFL !== undefined || m.durand_fl !== undefined) ? Number(durandFl) : '',
    cv: (d.cv !== undefined || d.solidsVolumetricPercent !== undefined || m.solids_cv !== undefined) ? Number(solidsCv) : '',
    v_rec: (d.v_rec !== undefined || d.recommendedPipeVelocityMs !== undefined || m.safe_velocity_ms !== undefined) ? Number(safeVel) : '',
    rhop: rhopVal !== undefined ? Number(rhopVal) : '',
    lib_um: met.liberationSizeMicrons !== undefined ? Number(met.liberationSizeMicrons) : (d.lib_um !== undefined ? Number(d.lib_um) : ''),
    grade: (met.headGradePercent !== undefined || met.oreGradeDecimal !== undefined) ? Number(met.headGradePercent ?? met.oreGradeDecimal) : (d.grade !== undefined ? Number(d.grade) : ''),
    air_psi: met.airPressurePsi !== undefined ? Number(met.airPressurePsi) : (d.air_psi !== undefined ? Number(d.air_psi) : ''),
    gy_c: met.samplingConstantC !== undefined ? Number(met.samplingConstantC) : (d.gy_c !== undefined ? Number(d.gy_c) : ''),
    gy_err: met.relativeErrorSigma !== undefined ? Number(met.relativeErrorSigma) : (d.gy_err !== undefined ? Number(d.gy_err) : ''),
    rr_n: met.rosinRammlerSlopeN !== undefined ? Number(met.rosinRammlerSlopeN) : (d.rr_n !== undefined ? Number(d.rr_n) : ''),
    ret_p80: met.retainedPercentAtP80 !== undefined ? Number(met.retainedPercentAtP80) : (d.ret_p80 !== undefined ? Number(d.ret_p80) : ''),
    eff_ratio_er: Number(effRatio),
    impeller_life_h: Number(impellerLifeH),
    wear_life_ratio: Number(wearLifeRatio),
    p_atm_mca: Number(pAtmMca),
    delta_npsh_m: Number(deltaNpshM),
    motor_derating_iec: Number(motorDeratingIec),
    k_motor_alt: Number(kMotorAlt),
    gate_classification: String(gateClass),
    trust_boundary_id: String(trustBoundaryId),
    detalles: d.details || d.detalles || '',
    destino: d.destination || d.destino || ''
  };
}

function dataMetrologyFallback(d, met) {
  return d.metrology_summary || met.summary || met.raw || (
    (met.cw !== undefined || met.solidsPctCw !== undefined)
      ? `Cw=${met.cw ?? met.solidsPctCw}% | Sm=${met.sm ?? met.pulpDensityKgL ?? 1.40} kg/L | P80=${met.p80 ?? met.targetP80Microns ?? 150} µm | Gy=${met.dryMassKg ?? met.gySampleMassKg ?? 0.25} kg`
      : ''
  );
}

export function buildAcuseUrlParams(d = {}) {
  const snap = buildCanonicalEngineeringSnapshotImpl(d);
  const paramsObj = {
    folio: snap.folio,
    nombre: snap.nombre,
    empresa: snap.empresa,
    telefono: snap.telefono,
    correo: snap.correo,
    equipo: snap.equipo,
    codigo: snap.codigo,
    detalles: snap.detalles,
    destino: snap.destino,
    urgencia: snap.urgencia
  };
  const optionalKeys = [
    'pieza', 'material', 'transmision', 'estacion', 'peso_kg',
    'claro_mm', 'delta_eta_v', 'pipe_vel_loss_pct', 'u2_ms', 'n2_rpm',
    'fr_kn', 'inmunidad_sumidero', 'razon_estructural', 'l10h', 'metrologia',
    'ref_cliente', 'medidas', 'perfil_pulpa', 'hidraulica', 'tco',
    'ph', 'seal_branch', 'b2_mm', 'cap_c_kn', 'fl', 'cv', 'v_rec',
    'rhop', 'lib_um', 'grade', 'air_psi', 'gy_c', 'gy_err', 'rr_n', 'ret_p80',
    'eff_ratio_er', 'impeller_life_h', 'wear_life_ratio',
    'p_atm_mca', 'delta_npsh_m', 'motor_derating_iec', 'k_motor_alt',
    'gate_classification', 'trust_boundary_id'
  ];
  for (const key of optionalKeys) {
    if (snap[key] !== undefined && snap[key] !== '') {
      paramsObj[key] = String(snap[key]);
    }
  }
  return new URLSearchParams(paramsObj);
}

export function resolveInternalBudgetCategory(d = {}) {
  const circuit = String(d.circuit || d.process_circuit || '').toLowerCase();
  const role = String(d.role_id || d.role || '').toLowerCase();
  const code = String(d.smat_code || '').toUpperCase();
  if (
    circuit === 'control_procesos' ||
    code.startsWith('SMAT-CTRL-') ||
    role.includes('marcy') ||
    role.includes('balanza') ||
    role.includes('batch') ||
    role.includes('tamiz') ||
    role.includes('tamices')
  ) {
    return 'CONTROL_PROCESOS';
  }
  if (
    d.isOpex === false ||
    d.mission === 'equipos' ||
    code.startsWith('SMAT-SKID-') ||
    code.endsWith('-CELL') ||
    code.endsWith('-BANK') ||
    code.endsWith('-PRESS') ||
    role.includes('skid') ||
    role.includes('celda') ||
    role.includes('bateria') ||
    role.includes('filtro_prensa') ||
    role.includes('prensa_completa')
  ) {
    return 'PROYECTO_EQUIPOS';
  }
  return 'OPERACION_SPARE_PARTS';
}

export function buildLeadWebhookPayload(d = {}, channelOrigin = 'web_quote_wizard') {
  const honeypotVal = d.website || d.website_honeypot || '';
  const snap = buildCanonicalEngineeringSnapshotImpl(d);
  return {
    ...snap,
    codigo_smat: snap.codigo,
    atomic_code: snap.pieza,
    codigo_pieza_atomica: snap.pieza,
    referencia_cliente: snap.ref_cliente,
    medidas_flexometro: snap.medidas,
    perfil_pulpa_mina: snap.perfil_pulpa,
    memoria_hidraulica: snap.hidraulica,
    memoria_hidraulica_durand: snap.hidraulica,
    tco_resumen: snap.tco,
    proyeccion_tco: snap.tco,
    material_bombeo: snap.material,
    material_wet_end: snap.material,
    arreglo_transmision: snap.transmision,
    estacion_armado: snap.estacion,
    estacion_despiece: snap.estacion,
    peso_pieza_kg: snap.peso_kg,
    claro_axial_mm: snap.claro_mm,
    perdida_eficiencia_vol_pct: snap.delta_eta_v,
    velocidad_periferica_u2_ms: snap.u2_ms,
    velocidad_punta_u2_ms: snap.u2_ms,
    rpm_bomba_n2: snap.n2_rpm,
    carga_radial_fr_kn: snap.fr_kn,
    dictamen_estructural: snap.razon_estructural,
    vida_rodamiento_l10h: snap.l10h,
    memoria_metrologica: snap.metrologia,
    cedula_metrologia: snap.metrologia,
    derating_eficiencia_er: snap.eff_ratio_er,
    vida_estimada_impulsor_h: snap.impeller_life_h,
    perdida_npsh_altitud_m: snap.delta_npsh_m,
    derating_motor_iec: snap.motor_derating_iec,
    multiplicador_motor_altitud: snap.k_motor_alt,
    perdida_margen_vc_pct: snap.pipe_vel_loss_pct,
    clasificacion_compuerta: snap.gate_classification,
    especificacion_tecnica: snap.detalles,
    destino: snap.destino || 'Durango',
    modalidad_logistica: snap.destino || 'Durango',
    canal: channelOrigin,
    website: honeypotVal
  };
}

export function dispatchLeadWebhook(d = {}, channelOrigin = 'web_quote_wizard', webhookUrl = '') {
  const honeypotVal = d.website || d.website_honeypot || '';
  if (honeypotVal && String(honeypotVal).trim().length > 0) {
    return { status: 'honeypot_blocked', blocked: true, dispatched: false, sent: false };
  }
  const payload = buildLeadWebhookPayload(d, channelOrigin);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem('smat_last_rfq_payload', JSON.stringify(payload));
    } catch (_e) { }
  }
  const resolvedEndpoint =
    webhookUrl ||
    (typeof window !== 'undefined' && window.SMAT_LEAD_WEBHOOK_URL) ||
    DEFAULT_SMAT_LEAD_WEBHOOK_URL;
  if (resolvedEndpoint && typeof fetch === 'function') {
    try {
      fetch(resolvedEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(() => { });
    } catch (_e) { }
  }
  return { status: 'dispatched', blocked: false, dispatched: true, sent: Boolean(resolvedEndpoint), endpoint: resolvedEndpoint, payload };
}
