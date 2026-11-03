/**
 * SMAT MINERALS - Google Apps Script Lead Intake Webhook
 * Archivo: tools/google_apps_script/Code.gs
 * Versión: 3.1 (Pipeline Transaccional Completo + Memoria Hidráulica Durand + TCO + Piezas Atómicas + 9 Campos de Ingeniería)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else {
      params = e.parameter || {};
    }
    var data = params;

    // 1. TRAMPA HONEYPOT ANTI-SPAM (Decisión 8-A / GOLD-121)
    if (data.website && String(data.website).trim().length > 0) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        code: 200,
        message: "Request accepted"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LEADS");

    if (!sheet) {
      sheet = ss.insertSheet("LEADS");
      var headers = [
        'created_at',
        'folio',
        'urgencia',
        'puerta_interna',
        'nombre',
        'empresa',
        'telefono',
        'correo',
        'equipo_solicitado',
        'codigo_smat',
        'codigo_pieza_atomica',
        'referencia_cliente',
        'medidas_flexometro',
        'perfil_pulpa_mina',
        'memoria_hidraulica_durand',
        'proyeccion_tco',
        'material_bombeo',
        'arreglo_transmision',
        'estacion_armado',
        'peso_pieza_kg',
        'claro_axial_mm',
        'perdida_eficiencia_vol_pct',
        'velocidad_periferica_u2_ms',
        'vida_rodamiento_l10h',
        'memoria_metrologica',
        'detalles_pulpa',
        'destino_entrega',
        'canal_origen',
        'estatus'
      ];
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f1f5f9");
    }

    var now = new Date();
    var createdAt = Utilities.formatDate(now, "America/Monterrey", "yyyy-MM-dd HH:mm:ss");
    var folio = data.folio || ("SMAT-" + now.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000));
    var urgencia = data.urgencia || "general";
    var puertaInterna = data.puerta_interna || "OPERACION_SPARE_PARTS";
    var nombre = data.nombre || data.contact_name || "";
    var empresa = data.empresa || data.company_name || "";
    var telefono = data.telefono || data.phone_number || "";
    var correo = data.correo || data.email_address || "";
    var equipo = data.equipo || data.role_id || "";
    var codigoSmat = data.codigo || data.smat_code || "";
    var codigoAtomico = data.atomic_code || data.pieza || "";
    var refCliente = data.referencia_cliente || data.client_reference || "";
    var medidasFlex = data.medidas_flexometro || data.medidas || "";
    var perfilPulpa = data.perfil_pulpa || data.pulp_profile || "";
    var memoriaHidraulica = data.memoria_hidraulica_durand || data.memoria_hidraulica || data.hidraulica || "";
    var tcoResumen = data.proyeccion_tco || data.tco_resumen || data.tco || "";
    var materialWetEnd = data.material_bombeo || data.material_wet_end || data.material || "";
    var arregloTransmision = data.arreglo_transmision || data.transmision || "";
    var estacionDespiece = data.estacion_armado || data.estacion_despiece || data.estacion || "";
    var pesoPiezaKg = data.peso_pieza_kg || data.peso_kg || "";
    var claroAxialMm = data.claro_axial_mm || data.claro_mm || "";
    var perdidaEficienciaVolPct = data.perdida_eficiencia_vol_pct || data.delta_eta_v || "";
    var velocidadPuntaU2 = data.velocidad_periferica_u2_ms || data.velocidad_punta_u2_ms || data.u2_ms || "";
    var vidaRodamientoL10h = data.vida_rodamiento_l10h || data.l10h || "";
    var cedulaMetrologia = data.memoria_metrologica || data.cedula_metrologia || data.metrologia || "";
    var detalles = data.detalles || data.spec_details || "";
    var destino = data.destino || data.destination || "Durango";
    var canal = data.canal || "web_quote_wizard";
    var estatus = "NUEVO_SIN_CONTACTAR";

    sheet.appendRow([
      createdAt,
      folio,
      urgencia,
      puertaInterna,
      nombre,
      empresa,
      telefono,
      correo,
      equipo,
      codigoSmat,
      codigoAtomico,
      refCliente,
      medidasFlex,
      perfilPulpa,
      memoriaHidraulica,
      tcoResumen,
      materialWetEnd,
      arregloTransmision,
      estacionDespiece,
      pesoPiezaKg,
      claroAxialMm,
      perdidaEficienciaVolPct,
      velocidadPuntaU2,
      vidaRodamientoL10h,
      cedulaMetrologia,
      detalles,
      destino,
      canal,
      estatus
    ]);

    var lastRow = sheet.getLastRow();
    var sheetUrl = ss.getUrl() + "#gid=" + sheet.getSheetId() + "&range=A" + lastRow;

    var emailSubject = (urgencia === "paro" ? "🚨 [URGENTE - PARO] " : "🏭 [NUEVO LEAD] ") + "Folio: " + folio + " - " + empresa;
    var emailBody =
      "NUEVA SOLICITUD RECIBIDA EN SMATMINERALS.COM\n" +
      "--------------------------------------------------\n" +
      "Folio Formal: " + folio + "\n" +
      "Puerta Comercial: " + puertaInterna + "\n" +
      "Código SMAT: " + codigoSmat + (codigoAtomico ? " (Refacción: " + codigoAtomico + ")" : "") + "\n" +
      "Prioridad: " + (urgencia === "paro" ? "🚨 PARO DE PLANTA / PRIORIDAD" : "🏭 PROYECTO DE EQUIPAMIENTO") + "\n" +
      "Canal de Salida: " + canal + "\n" +
      "Fecha: " + createdAt + "\n\n" +
      "DATOS DEL CONTACTO:\n" +
      "Nombre: " + nombre + "\n" +
      "Mina / Empresa: " + empresa + "\n" +
      (perfilPulpa ? "Perfil Mineral Detectado: " + perfilPulpa + "\n" : "") +
      "Teléfono / WhatsApp: " + telefono + "\n" +
      "Correo: " + correo + "\n" +
      "Destino: " + destino + "\n\n" +
      "ESPECIFICACIÓN E INGENIERÍA (Cédula de Ingeniería Mecánica y Metrológica):\n" +
      "Línea / Equipo: " + equipo + "\n" +
      (refCliente ? "Referencia Interna Cliente: " + refCliente + "\n" : "") +
      (medidasFlex ? "Medidas de Campo (Flexómetro): " + medidasFlex + "\n" : "") +
      (memoriaHidraulica ? "Memoria Hidráulica Durand: " + memoriaHidraulica + "\n" : "") +
      (tcoResumen ? "Proyección TCO / Continuidad: " + tcoResumen + "\n" : "") +
      (materialWetEnd ? "Material Bombeo / Wet-End: " + materialWetEnd + "\n" : "") +
      (arregloTransmision ? "Arreglo Transmisión V-Belt: " + arregloTransmision + "\n" : "") +
      (estacionDespiece ? "Estación de Armado BOM: " + estacionDespiece + " (" + (pesoPiezaKg || "N/A") + " kg)\n" : "") +
      (claroAxialMm ? "Claro Axial Frontal (δ): " + claroAxialMm + " mm (Pérdida Δηv: " + (perdidaEficienciaVolPct || "0") + "%)\n" : "") +
      (velocidadPuntaU2 ? "Cinemática (u2 / L10h): u2=" + velocidadPuntaU2 + " m/s | L10h=" + (vidaRodamientoL10h || "N/A") + " h\n" : "") +
      (cedulaMetrologia ? "Cédula Metrológica Lab: " + cedulaMetrologia + "\n" : "") +
      "Detalles de Operación: " + detalles + "\n\n" +
      "--------------------------------------------------\n" +
      "Ver Fila en Google Sheets:\n" + sheetUrl + "\n";

    try {
      MailApp.sendEmail({
        to: "ventas@smatminerals.com",
        subject: emailSubject,
        body: emailBody
      });
    } catch (mailErr) {
      Logger.log("Error enviando alerta por correo: " + mailErr);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      code: 200,
      folio: folio,
      message: "Lead registrado exitosamente"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      code: 500,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
