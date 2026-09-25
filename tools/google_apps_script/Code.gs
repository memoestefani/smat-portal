/**
 * SMAT MINERALS - Google Apps Script Lead Intake Webhook
 * Archivo: tools/google_apps_script/Code.gs
 * Versión: 2.0 (GOLD-131 / GOLD-140 / Decisión 8-A)
 * 
 * Instrucciones de Despliegue en Google Workspace:
 * 1. Cree una Google Sheet con nombre "SMAT_LEADS_OPERACION" en su Google Drive.
 * 2. Vaya a Extensiones > Apps Script.
 * 3. Pegue este código reemplazando cualquier contenido previo.
 * 4. Haga clic en "Implementar" > "Nueva implementación".
 * 5. Tipo: "Aplicación web".
 * 6. Ejecutar como: "Yo (propietario de la cuenta)".
 * 7. Quién tiene acceso: "Cualquier persona" (permite a Cloudflare Pages hacer fetch POST).
 * 8. Copie la URL del Webhook generada.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Esperar hasta 10 segundos para concurrencia atómica
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

    // 1. TRAMPA HONEYPOT ANTI-SPAM (Decisión 8-A / GOLD-121)
    // Si el campo invisible 'website' viene lleno por un bot, descartar silenciosamente sin alertar ni escribir
    if (params.website && String(params.website).trim().length > 0) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        code: 200,
        message: "Request accepted"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LEADS");
    
    // Si no existe la pestaña LEADS, inicializarla con cabeceras formales
    if (!sheet) {
      sheet = ss.insertSheet("LEADS");
      var headers = [
        "created_at",
        "folio",
        "urgencia",
        "nombre",
        "empresa",
        "telefono",
        "correo",
        "equipo_solicitado",
        "detalles_pulpa",
        "destino_entrega",
        "canal_origen",
        "estatus"
      ];
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f1f5f9");
    }

    var now = new Date();
    var createdAt = Utilities.formatDate(now, "America/Monterrey", "yyyy-MM-dd HH:mm:ss");
    var folio = params.folio || ("SMAT-" + now.getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000));
    var urgencia = params.urgencia || "general";
    var nombre = params.nombre || params.contact_name || "";
    var empresa = params.empresa || params.company_name || "";
    var telefono = params.telefono || params.phone_number || "";
    var correo = params.correo || params.email_address || "";
    var equipo = params.equipo || params.role_id || "";
    var detalles = params.detalles || params.spec_details || "";
    var destino = params.destino || params.destination || "Durango";
    var canal = params.canal || "web_quote_wizard";
    var estatus = "NUEVO_SIN_CONTACTAR";

    // Insertar fila atómicamente
    sheet.appendRow([
      createdAt,
      folio,
      urgencia,
      nombre,
      empresa,
      telefono,
      correo,
      equipo,
      detalles,
      destino,
      canal,
      estatus
    ]);

    var lastRow = sheet.getLastRow();
    var sheetUrl = ss.getUrl() + "#gid=" + sheet.getSheetId() + "&range=A" + lastRow;

    // 2. DISPARO DE ALERTA POR GMAIL (Google Workspace sin cuotas SMTP)
    var emailSubject = (urgencia === "paro" ? "🚨 [URGENTE - PARO] " : "🏭 [NUEVO LEAD] ") + "Folio: " + folio + " - " + empresa;
    var emailBody = 
      "NUEVA SOLICITUD RECIBIDA EN SMATMINERALS.COM\n" +
      "--------------------------------------------------\n" +
      "Folio Formal: " + folio + "\n" +
      "Prioridad: " + (urgencia === "paro" ? "🚨 PARO DE PLANTA / PRIORIDAD" : "🏭 PROYECTO CAPEX") + "\n" +
      "Fecha: " + createdAt + "\n\n" +
      "DATOS DEL CONTACTO:\n" +
      "Nombre: " + nombre + "\n" +
      "Mina / Empresa: " + empresa + "\n" +
      "Teléfono / WhatsApp: " + telefono + "\n" +
      "Correo: " + correo + "\n" +
      "Destino: " + destino + "\n\n" +
      "ESPECIFICACIÓN:\n" +
      "Línea / Equipo: " + equipo + "\n" +
      "Detalles de Pulpa: " + detalles + "\n\n" +
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
