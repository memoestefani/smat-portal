use crate::{read_page_with_islands_composite, read_quote_wizard_composite};
use regex::Regex;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// 1. Verifica paridad del catálogo maestro y existencia de SSOTs requeridos
pub fn verify_catalog_parity(site_root: &Path) -> Result<(), String> {
    let roles_path = site_root.join("data").join("roles.json");
    let copy_path = site_root.join("data").join("roles.copy.json");
    let company_path = site_root.join("data").join("company.json");
    let atomic_path = site_root.join("data").join("atomic_parts.json");

    if !roles_path.exists() {
        return Err(format!("No existe {}", roles_path.display()));
    }
    if copy_path.exists() {
        return Err("Debris detectado: data/roles.copy.json debe ser eliminado (DEB-SMAT-04)".to_string());
    }
    if !company_path.exists() {
        return Err(format!("No existe {}", company_path.display()));
    }
    if !atomic_path.exists() {
        return Err(format!("No existe {}", atomic_path.display()));
    }

    let roles_str = fs::read_to_string(&roles_path).map_err(|e| e.to_string())?;
    let _roles_val: serde_json::Value =
        serde_json::from_str(&roles_str).map_err(|e| format!("JSON invalido en roles.json: {}", e))?;

    let company_str = fs::read_to_string(&company_path).map_err(|e| e.to_string())?;
    let _company_val: serde_json::Value =
        serde_json::from_str(&company_str).map_err(|e| format!("JSON invalido en company.json: {}", e))?;

    // Verificar que ni Footer.astro ni LiveEngineeringDossier.astro interpolen objetos crudos [object Object]
    for rel in ["src/components/Footer.astro", "src/components/LiveEngineeringDossier.astro"] {
        let p = site_root.join(rel);
        if p.exists() {
            let content = fs::read_to_string(&p).map_err(|e| e.to_string())?;
            if content.contains("companyData.contact.phones[0]}")
                || content.contains("companyData.contact.phones[1]}")
                || content.contains("companyData.contact.emails[0]}")
                || content.contains("companyData.contact.emails[1]}")
            {
                return Err(format!("Interpolacion de objeto crudo [object Object] detectada en {}", rel));
            }
        }
    }

    Ok(())
}

/// 2. Escanea contra fugas de precios, margenes y secretos industriales
pub fn verify_leak_scanner(site_root: &Path) -> Result<(), String> {
    let price_re = Regex::new(r"(\$\s*[0-9]+(\.[0-9]{2})?|\b(USD|MXN)\s*[0-9]+([.,][0-9]+)?)").unwrap();
    let margin_re = Regex::new(r"(?i)margen\s*[:=]\s*[0-9]+%?").unwrap();
    let secret_words = ["Cuenta BBVA", "CLABE", "saldo bancario", "factura proveedor"];

    let scan_dirs = ["data", "public", "src"];
    for dir in &scan_dirs {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }

        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if ["json", "astro", "ts", "js", "html", "md"].contains(&ext) {
                    let content = fs::read_to_string(entry.path()).unwrap_or_default();
                    if price_re.is_match(&content) {
                        return Err(format!("Fuga de precio detectada en {}", entry.path().display()));
                    }
                    if margin_re.is_match(&content) {
                        return Err(format!("Fuga de margen detectada en {}", entry.path().display()));
                    }
                    for secret in &secret_words {
                        if content.contains(secret) {
                            return Err(format!("Secreto '{}' detectado en {}", secret, entry.path().display()));
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// 3. Gate D9: Verifica simetría bilingüe estricta entre rutas ES y EN
pub fn verify_bilingual_symmetry(site_root: &Path) -> Result<(), String> {
    let es_pages = [
        "index.astro",
        "catalogo.astro",
        "nosotros.astro",
        "contacto.astro",
        "diagnostico.astro",
        "acuse.astro",
    ];
    let en_pages = [
        "index.astro",
        "catalog.astro",
        "about.astro",
        "contact.astro",
        "diagnostics.astro",
        "thank-you.astro",
    ];

    let pages_dir = site_root.join("src").join("pages");
    let en_dir = pages_dir.join("en");

    for es_file in &es_pages {
        let p = pages_dir.join(es_file);
        if !p.exists() {
            return Err(format!("Falta pagina en espanol: {}", es_file));
        }
    }

    for en_file in &en_pages {
        let p = en_dir.join(en_file);
        if !p.exists() {
            return Err(format!("Falta pagina en ingles: en/{}", en_file));
        }
    }

    let roles_path = site_root.join("data").join("roles.json");
    if roles_path.exists() {
        let roles_str = fs::read_to_string(&roles_path).unwrap_or_default();
        let roles_val: serde_json::Value = serde_json::from_str(&roles_str).unwrap_or_default();
        if let Some(roles_arr) = roles_val.get("roles").and_then(|r| r.as_array()) {
            for role in roles_arr {
                if role.get("title_es").is_none() || role.get("title_en").is_none() {
                    return Err(format!("Rol {} carece de simetria de titulos ES/EN", role["id"]));
                }
                if role.get("subtitle_es").is_none() || role.get("subtitle_en").is_none() {
                    return Err(format!("Rol {} carece de subtitulos bilingues", role["id"]));
                }
            }
        }
    }

    Ok(())
}

/// 4. Verifica integridad de redirecciones 301 deterministas
pub fn verify_redirect_integrity(site_root: &Path) -> Result<(), String> {
    let redirects_path = site_root.join("public").join("_redirects");
    if !redirects_path.exists() {
        return Err("No existe public/_redirects".to_string());
    }

    let content = fs::read_to_string(&redirects_path).map_err(|e| e.to_string())?;
    let lines: Vec<&str> = content.lines().filter(|l| !l.trim().is_empty() && !l.starts_with('#')).collect();

    if lines.len() < 30 {
        return Err(format!("Menos de 30 reglas en _redirects (encontradas: {})", lines.len()));
    }

    for line in lines {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 3 {
            return Err(format!("Regla invalida en _redirects: '{}'", line));
        }
        if parts[2] != "301" && parts[2] != "302" {
            return Err(format!("Codigo de estado no determinista en: '{}'", line));
        }
    }

    Ok(())
}

/// 5. Verifica consistencia de NAP (Mariano Salas #114, Durango)
pub fn verify_nap_integrity(site_root: &Path) -> Result<(), String> {
    let company_path = site_root.join("data").join("company.json");
    if !company_path.exists() {
        return Err("No existe data/company.json".to_string());
    }

    let comp_str = fs::read_to_string(&company_path).map_err(|e| e.to_string())?;
    let comp_val: serde_json::Value = serde_json::from_str(&comp_str).map_err(|e| e.to_string())?;

    let address_obj = &comp_val["address"];
    let street = address_obj["street"].as_str().unwrap_or("");
    let city = address_obj["city"].as_str().unwrap_or("");

    let phones = comp_val["contact"]["phones"].as_array();
    let phone_str = phones.and_then(|p| p.get(0)).and_then(|p0| p0["display"].as_str()).unwrap_or("");

    let emails = comp_val["contact"]["emails"].as_array();
    let email_str = emails.and_then(|e| e.get(0)).and_then(|e0| e0["address"].as_str()).unwrap_or("");

    if !street.contains("Mariano Salas") || !city.contains("Durango") {
        return Err("NAP violado: Direccion fisica no coincide con patio central Durango".to_string());
    }
    if !phone_str.contains("618") {
        return Err("NAP violado: Telefono de Durango no coincide".to_string());
    }
    if !email_str.contains("smatminerals.com") {
        return Err("NAP violado: Dominio de correo no coincide".to_string());
    }

    Ok(())
}

/// 6. Verifica ausencia de placeholders y mockups
pub fn verify_zero_placeholders(site_root: &Path) -> Result<(), String> {
    let bad_words = ["lorem ipsum", "dolor sit amet", "TODO:", "FIXME:", "temp_placeholder", "mockup_image"];
    let scan_dirs = ["src", "data"];

    for dir in &scan_dirs {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }

        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if ["astro", "ts", "js", "json", "html"].contains(&ext) {
                    let content = fs::read_to_string(entry.path()).unwrap_or_default();
                    for bad in &bad_words {
                        if content.to_lowercase().contains(&bad.to_lowercase()) {
                            return Err(format!("Placeholder '{}' detectado en {}", bad, entry.path().display()));
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// 7. Gate D10: Verifica criterios de decisión B2B en data/roles.json
pub fn verify_decision_criteria(site_root: &Path) -> Result<(), String> {
    let roles_path = site_root.join("data").join("roles.json");
    if !roles_path.exists() {
        return Err("No existe data/roles.json".to_string());
    }

    let content = fs::read_to_string(&roles_path).map_err(|e| e.to_string())?;
    let val: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    let verticals = val.get("verticals").and_then(|v| v.as_array()).ok_or("Formato invalido de verticals")?;

    let mut total_roles = 0;
    for vert in verticals {
        if let Some(capex) = vert.get("capex").and_then(|c| c.as_array()) {
            for r in capex {
                total_roles += 1;
                if r.get("decision_criteria").is_none() {
                    return Err(format!("Rol {} carece de decision_criteria", r["role_id"]));
                }
            }
        }
        if let Some(opex) = vert.get("opex").and_then(|o| o.as_array()) {
            for r in opex {
                total_roles += 1;
                if r.get("decision_criteria").is_none() {
                    return Err(format!("Rol {} carece de decision_criteria", r["role_id"]));
                }
            }
        }
    }

    if total_roles < 8 {
        return Err(format!("Se esperan al menos 8 roles, encontrados {}", total_roles));
    }

    Ok(())
}

/// 8. Gate D11: Verifica soporte de vista imprimible ERP en acuse
pub fn verify_print_view_parity(site_root: &Path) -> Result<(), String> {
    let acuse_path = site_root.join("src").join("pages").join("acuse.astro");
    let ty_path = site_root.join("src").join("pages").join("en").join("thank-you.astro");

    if !acuse_path.exists() || !ty_path.exists() {
        return Err("No existen las paginas de confirmacion imprimible".to_string());
    }

    let acuse_content = fs::read_to_string(&acuse_path).map_err(|e| e.to_string())?;
    let ty_content = fs::read_to_string(&ty_path).map_err(|e| e.to_string())?;

    if !acuse_content.contains("@media print") || !acuse_content.contains("print-btn") {
        return Err("acuse.astro carece de directivas de impresion @media print".to_string());
    }
    if !ty_content.contains("@media print") || !ty_content.contains("print-btn") {
        return Err("thank-you.astro carece de directivas de impresion @media print".to_string());
    }

    Ok(())
}

/// 9. Gate D12: Verifica erradicación total de debris y archivos temporales
pub fn verify_no_orphan_debris(site_root: &Path) -> Result<(), String> {
    let forbidden_exts = ["bak", "tmp", "old", "orig", "DS_Store"];
    for entry in WalkDir::new(site_root).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if forbidden_exts.contains(&ext) {
                    return Err(format!("Archivo de debris detectado: {}", path.display()));
                }
            }
        }
    }
    Ok(())
}

/// 10. Gate D13: Verifica dataset estático de grupos mineros
pub fn verify_mining_groups_dataset(site_root: &Path) -> Result<(), String> {
    let groups_path = site_root.join("data").join("mining_groups.json");
    if !groups_path.exists() {
        return Err("No existe data/mining_groups.json".to_string());
    }

    let content = fs::read_to_string(&groups_path).map_err(|e| e.to_string())?;
    let val: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    let groups = val.get("groups").and_then(|g| g.as_array()).ok_or("Formato invalido de grupos")?;

    if groups.len() < 20 {
        return Err(format!("Dataset debe contener al menos 20 grupos, encontrados {}", groups.len()));
    }

    for g in groups {
        if g.get("id").is_none() || g.get("name").is_none() || g.get("domains").is_none() {
            return Err(format!("Grupo minero incompleto: {:?}", g));
        }
    }

    Ok(())
}

/// 11. Gate D14: Verifica motor hidráulico de pulpa Durand
pub fn verify_slurry_engine_module(site_root: &Path) -> Result<(), String> {
    let script_path = site_root.join("src").join("scripts").join("slurryEngine.js");
    let test_path = site_root.join("tests").join("slurry_engine.test.mjs");

    if !script_path.exists() {
        return Err("No existe src/scripts/slurryEngine.js".to_string());
    }
    if !test_path.exists() {
        return Err("No existe tests/slurry_engine.test.mjs".to_string());
    }

    let script_content = fs::read_to_string(&script_path).map_err(|e| e.to_string())?;
    let required_terms = ["calculateSlurryMetrics", "SLURRY_PRESETS", "MECHANICAL_DIAGNOSTICS", "High Chrome 27% (A05)", "Caucho Natural Vulcanizado"];
    for term in &required_terms {
        if !script_content.contains(term) {
            return Err(format!("slurryEngine.js carece del termino obligatorio '{}'", term));
        }
    }

    Ok(())
}

/// 12. Gate D15: Audita tokens de diseño modular y Live Workbench
pub fn verify_design_tokens_and_workbench(site_root: &Path) -> Result<(), String> {
    let tokens_path = site_root.join("src").join("styles").join("tokens.css");
    let wizard_path = site_root.join("src").join("components").join("QuoteWizard.astro");

    if !tokens_path.exists() {
        return Err("No existe src/styles/tokens.css".to_string());
    }
    if !wizard_path.exists() {
        return Err("No existe src/components/QuoteWizard.astro".to_string());
    }

    let tokens_content = fs::read_to_string(&tokens_path).map_err(|e| e.to_string())?;
    let required_tokens = ["--smat-font-editorial", "--smat-font-ui", "--smat-font-mono", "--smat-navy-950", "--smat-canvas-bg", "--smat-copper-accent"];
    for tok in &required_tokens {
        if !tokens_content.contains(tok) {
            return Err(format!("tokens.css carece del token semantico '{}'", tok));
        }
    }

    let wizard_content = read_quote_wizard_composite(site_root)?;
    let required_workbench = ["workbench-split", "live-folio", "SMAT-2026", "wb-copy-btn", "wb-pdf-btn"];
    for w in &required_workbench {
        if !wizard_content.contains(w) {
            return Err(format!("QuoteWizard.astro carece del elemento de consola '{}'", w));
        }
    }

    Ok(())
}

/// 13. Gate D16: Audita EventBus y Suite de Exportación de 4 Vías (Decisiones 5-C y 6-C)
pub fn verify_event_bus_and_export_suite(site_root: &Path) -> Result<(), String> {
    let bus_path = site_root.join("src").join("scripts").join("workbenchBus.js");

    if !bus_path.exists() {
        return Err("No existe src/scripts/workbenchBus.js".to_string());
    }

    let bus_content = fs::read_to_string(&bus_path).map_err(|e| e.to_string())?;
    let required_bus = ["publishWorkbenchUpdate", "formatSapPlaintext", "formatMailtoUrl", "formatWhatsappUrl"];
    for term in &required_bus {
        if !bus_content.contains(term) {
            return Err(format!("workbenchBus.js carece de '{}'", term));
        }
    }

    let wizard_content = read_quote_wizard_composite(site_root)?;
    let required_drawer = ["mini-dossier-bar", "drawer-sheet", "preset-chips-grid", "custom-equip-details"];
    for elem in &required_drawer {
        if !wizard_content.contains(elem) {
            return Err(format!("QuoteWizard.astro carece del elemento '{}'", elem));
        }
    }

    Ok(())
}

/// 14. Gate D17: Audita montaje directo de QuoteWizard y Trust Matrix (Decisiones 1-C++ y 4-C)
pub fn verify_flight_deck_and_trust_matrix(site_root: &Path) -> Result<(), String> {
    let deck_path = site_root.join("src").join("components").join("FlightDeck.astro");
    let persp_path = site_root.join("src").join("components").join("PerspectiveSelector.astro");
    let trust_path = site_root.join("src").join("components").join("TrustMatrix.astro");

    if deck_path.exists() {
        return Err("src/components/FlightDeck.astro debe estar eliminado (DEB-E3-02)".to_string());
    }
    if persp_path.exists() {
        return Err("src/components/PerspectiveSelector.astro debe estar eliminado (DEB-E3-01)".to_string());
    }
    if !trust_path.exists() {
        return Err("No existe src/components/TrustMatrix.astro".to_string());
    }

    let index_content = read_page_with_islands_composite(site_root, "src/pages/index.astro")?;
    let en_content = read_page_with_islands_composite(site_root, "src/pages/en/index.astro")?;

    let cotizar_content = fs::read_to_string(site_root.join("src/pages/cotizar.astro")).unwrap_or_default();
    if !cotizar_content.contains("QuoteWizard") || !cotizar_content.contains("extension-card") || !index_content.contains("TrustMatrix") {
        return Err("cotizar.astro no integra QuoteWizard/extension-card o index.astro no integra TrustMatrix".to_string());
    }
    let quote_en_content = fs::read_to_string(site_root.join("src/pages/en/quote.astro")).unwrap_or_default();
    if !quote_en_content.contains("QuoteWizard") || !quote_en_content.contains("extension-card") || !en_content.contains("TrustMatrix") {
        return Err("en/quote.astro no integra QuoteWizard/extension-card o en/index.astro no integra TrustMatrix".to_string());
    }

    Ok(())
}

/// 15. Gate D18: Audita la ausencia estricta de promesas falsas ("45 min", "24/7", etc.)
pub fn verify_no_false_sla_promises(site_root: &Path) -> Result<(), String> {
    let scan_dirs = ["src/components", "src/pages"];
    for dir in &scan_dirs {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }

        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let content = fs::read_to_string(entry.path()).unwrap_or_default().to_lowercase();
                if content.contains("45 min") || content.contains("45m") {
                    return Err(format!("Promesa falsa de '45 min' detectada en {}", entry.path().display()));
                }
                if content.contains("24/7") {
                    return Err(format!("Promesa falsa de '24/7' detectada en {}", entry.path().display()));
                }
            }
        }
    }
    Ok(())
}

/// 16. Gate D19: Audita la accesibilidad total y ausencia de rutas huérfanas en las 40 páginas estáticas
pub fn verify_40_routes_reachability(site_root: &Path) -> Result<(), String> {
    let header_path = site_root.join("src").join("components").join("Header.astro");
    let footer_path = site_root.join("src").join("components").join("Footer.astro");

    if !header_path.exists() {
        return Err("No existe Header.astro".to_string());
    }
    if !footer_path.exists() {
        return Err("No existe Footer.astro".to_string());
    }

    let header_content = fs::read_to_string(&header_path).unwrap_or_default();
    let footer_content = fs::read_to_string(&footer_path).unwrap_or_default();
    let combined_nav = format!("{}\n{}", header_content, footer_content);

    let required_routes_es = [
        "/equipos/",
        "/control-de-procesos/",
        "/cotizar/",
        "/catalogo/",
        "/bombeo/",
        "/bombeo/skid/",
        "/bombeo/impulsor/",
        "/bombeo/revestimientos/",
        "/bombeo/sello/",
        "/bombeo/soporte/",
        "/flotacion/",
        "/flotacion/celdas/",
        "/flotacion/mecanismos/",
        "/filtracion/",
        "/filtracion/prensa/",
        "/filtracion/repuestos/",
        "/diagnostico/",
        "/garantia/",
        "/nosotros/",
        "/contacto/",
        "/aviso/",
        "/acuse/",
    ];

    let required_routes_en = [
        "/en/process-equipment/",
        "/en/process-control/",
        "/en/quote/",
        "/en/catalog/",
        "/en/pumping/",
        "/en/pumping/skid/",
        "/en/pumping/impeller/",
        "/en/pumping/liners/",
        "/en/pumping/seal/",
        "/en/pumping/bearing-assembly/",
        "/en/flotation/",
        "/en/flotation/cells/",
        "/en/flotation/mechanisms/",
        "/en/filtration/",
        "/en/filtration/press/",
        "/en/filtration/parts/",
        "/en/diagnostics/",
        "/en/warranty/",
        "/en/about/",
        "/en/contact/",
        "/en/privacy/",
        "/en/thank-you/",
    ];

    for route in &required_routes_es {
        if !combined_nav.contains(route) {
            return Err(format!("Ruta estática en español huérfana (sin enlace en navegación): {}", route));
        }
    }

    for route in &required_routes_en {
        if !combined_nav.contains(route) {
            return Err(format!("Ruta estática en inglés huérfana (sin enlace en navegación): {}", route));
        }
    }

    Ok(())
}

/// 17. Gate D20: Audita erradicación de lenguaje informal ("taller" y "workshop") en src/ y data/
pub fn verify_linguistic_ethos(site_root: &Path) -> Result<(), String> {
    let scan_dirs = ["src", "data"];
    let word_re = Regex::new(r"(?i)\b(taller|workshop)\b").unwrap();

    for dir in &scan_dirs {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }

        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if ["astro", "ts", "js", "json", "html"].contains(&ext) {
                    let content = fs::read_to_string(entry.path()).unwrap_or_default();
                    if word_re.is_match(&content) {
                        return Err(format!("Término informal prohibido detectado en {}", entry.path().display()));
                    }
                }
            }
        }
    }
    Ok(())
}

/// 18. Gate D21: Audita higiene de propiedad intelectual y marcas de terceros (Decisión 4-C)
pub fn verify_trademark_hygiene(site_root: &Path) -> Result<(), String> {
    let scan_dirs = ["src", "data"];
    let brand_re = Regex::new(r"(?i)\b(warman|denver|metso|outotec)\b").unwrap();

    for dir in &scan_dirs {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }

        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if ["astro", "ts", "js", "json", "html"].contains(&ext) {
                    let content = fs::read_to_string(entry.path()).unwrap_or_default();
                    if brand_re.is_match(&content) {
                        return Err(format!("Marca de tercero detectada en {}", entry.path().display()));
                    }
                }
            }
        }
    }
    Ok(())
}

/// 19. Gate D22: Verifica cabeceras de seguridad Cloudflare Pages (_headers)
pub fn verify_security_headers(site_root: &Path) -> Result<(), String> {
    let headers_path = site_root.join("public").join("_headers");
    if !headers_path.exists() {
        return Err("No existe public/_headers".to_string());
    }
    let content = fs::read_to_string(&headers_path).map_err(|e| e.to_string())?;
    if !content.contains("X-Frame-Options: DENY") {
        return Err("_headers debe contener X-Frame-Options: DENY".to_string());
    }
    if !content.contains("X-Content-Type-Options: nosniff") {
        return Err("_headers debe contener X-Content-Type-Options: nosniff".to_string());
    }
    Ok(())
}

/// 20. Gate D23: Audita erradicación total de promesas engañosas de emergencia y 24/7 (Decisión 9-B)
pub fn verify_no_emergency_claims(site_root: &Path) -> Result<(), String> {
    let scan_dirs = ["src"];
    let forbidden_re = Regex::new(r"(?i)\b(guardia 24/7|servicio de emergencia|emergencia 6x4)\b").unwrap();

    for dir in &scan_dirs {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }

        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if ["astro", "ts", "js", "json", "html"].contains(&ext) {
                    let content = fs::read_to_string(entry.path()).unwrap_or_default();
                    if forbidden_re.is_match(&content) {
                        return Err(format!("Claim de emergencia engañoso detectado en {}", entry.path().display()));
                    }
                }
            }
        }
    }
    Ok(())
}

pub fn verify_solar_wcag_aaa_and_etapa3_parity(site_root: &Path) -> Result<(), String> {
    if site_root.join("src/components/FlightDeck.astro").exists() {
        return Err("FlightDeck.astro debe estar eliminado fisicamente (DEB-E3-02)".to_string());
    }
    if site_root.join("src/components/PerspectiveSelector.astro").exists() {
        return Err("PerspectiveSelector.astro debe estar eliminado fisicamente (DEB-E3-01)".to_string());
    }

    let tokens = fs::read_to_string(site_root.join("src/styles/tokens.css")).map_err(|e| e.to_string())?;
    if !tokens.contains("--smat-blue-royal: #0c4a6e;") {
        return Err("tokens.css debe definir --smat-blue-royal: #0c4a6e; (9.61:1 WCAG AAA)".to_string());
    }
    if !tokens.contains("--smat-copper-accent: #7c2d12;") {
        return Err("tokens.css debe definir --smat-copper-accent: #7c2d12; (10.65:1 WCAG AAA)".to_string());
    }

    let qw = read_quote_wizard_composite(site_root)?;
    for req in [
        "WET_END_MATERIAL_MATRIX",
        "wb-material-matrix-card",
        "wb-step1-xor-circuit-bar",
        "wb-ctrl-rhop",
        "wb-ctrl-air-psi",
        "wb-ctrl-gy-c",
        "wb-ctrl-gy-err",
        "wb-ctrl-rr-n",
        "wb-ctrl-ret-p80",
        "metric-drive-rpm",
        "metric-drive-fr",
        "metric-drive-flood",
        "metric-structural-reason",
        "wb-step2-control-summary",
        "hydrateMetrologyInputsFromState",
    ] {
        if !qw.contains(req) {
            return Err(format!("QuoteWizard compuesto carece del elemento de Etapa 3 '{}'", req));
        }
    }

    Ok(())
}

pub fn verify_modular_parnas_and_zero_fake_data_step_gate(site_root: &Path) -> Result<(), String> {
    let qw_path = site_root.join("src/components/QuoteWizard.astro");
    let dossier_path = site_root.join("src/components/LiveEngineeringDossier.astro");
    let ctrl_path = site_root.join("src/scripts/quoteWizardController.js");
    let css_path = site_root.join("src/styles/workbench.css");
    let footer_path = site_root.join("src/components/Footer.astro");

    for p in [&qw_path, &dossier_path, &ctrl_path, &css_path, &footer_path] {
        if !p.exists() {
            return Err(format!("No existe el modulo requerido '{}'", p.display()));
        }
    }

    let qw_raw = fs::read_to_string(&qw_path).map_err(|e| e.to_string())?;
    let line_count = qw_raw.lines().count();
    if line_count >= 1150 {
        return Err(format!("QuoteWizard.astro excede el presupuesto modular (<1150 lineas): {} lineas", line_count));
    }
    if qw_raw.contains("data-step=\"2\"") || qw_raw.contains("data-step='2'") {
        return Err("QuoteWizard.astro contiene atributos falsos data-step=\"2\" prohibidos por DEB-R1-01..03".to_string());
    }

    let dossier_raw = fs::read_to_string(&dossier_path).map_err(|e| e.to_string())?;
    if dossier_raw.contains("data-step=\"2\"") || dossier_raw.contains("data-step='2'") {
        return Err("LiveEngineeringDossier.astro contiene data-step=\"2\" prohibido".to_string());
    }

    let footer_raw = fs::read_to_string(&footer_path).map_err(|e| e.to_string())?;
    if footer_raw.contains("--color-") {
        return Err("Footer.astro contiene variables CSS huerfanas --color-* (DEB-R1-04)".to_string());
    }

    Ok(())
}

pub fn verify_manuel_lexical_and_route_separation_gate(site_root: &Path) -> Result<(), String> {
    let slurry = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js")).map_err(|e| e.to_string())?;
    if slurry.contains("Refacción Urgente") || slurry.contains("surcos en garganta") {
        return Err("slurryEngine.js contiene lexico prohibido ('Refacción Urgente' o 'surcos en garganta')".to_string());
    }

    let contacto_es = fs::read_to_string(site_root.join("src/pages/contacto.astro")).map_err(|e| e.to_string())?;
    let contacto_en = fs::read_to_string(site_root.join("src/pages/en/contact.astro")).map_err(|e| e.to_string())?;
    if contacto_es.contains("<QuoteWizard") || contacto_en.contains("<QuoteWizard") {
        return Err("contacto.astro o en/contact.astro siguen incrustando <QuoteWizard /> duplicado (DEB-R1-07)".to_string());
    }

    Ok(())
}

pub fn verify_backend_ui_parity_and_apple_cowan(site_root: &Path) -> Result<(), String> {
    let mut report_str = fs::read_to_string(site_root.join("src/components/PumpAssemblyReport.astro")).map_err(|e| e.to_string())?;
    if let Ok(ctrl_str) = fs::read_to_string(site_root.join("src/scripts/pumpAssemblyReportController.js")) {
        report_str.push('\n');
        report_str.push_str(&ctrl_str);
    }
    if !report_str.contains("evaluateWetEndAssemblyInterference") || !report_str.contains("data-clearance-slider") {
        return Err("PumpAssemblyReport.astro no expone evaluateWetEndAssemblyInterference ni el calibrador de claro axial".to_string());
    }

    let skid_es = read_page_with_islands_composite(site_root, "src/pages/bombeo/skid.astro")?;
    let skid_en = read_page_with_islands_composite(site_root, "src/pages/en/pumping/skid.astro")?;
    let lens_src = fs::read_to_string(site_root.join("src/scripts/verticalBidirectionalHydrationLens.js")).unwrap_or_default();
    let lens_has_kin = lens_src.contains("calculateDriveAndBearingKinematics");
    let skid_es_ok = skid_es.contains("calculateDriveAndBearingKinematics") || (skid_es.contains("initSkidKinematicsInspector") && lens_has_kin);
    let skid_en_ok = skid_en.contains("calculateDriveAndBearingKinematics") || (skid_en.contains("initSkidKinematicsInspector") && lens_has_kin);
    if !skid_es_ok || !skid_en_ok {
        return Err("skid.astro o en/pumping/skid.astro no exponen calculateDriveAndBearingKinematics".to_string());
    }

    let qw_str = read_quote_wizard_composite(site_root)?;
    for req in [
        "evaluateWetEndAssemblyInterference",
        "calculateDriveAndBearingKinematics",
        "getAtomicPartSpecs",
        "metric-v-actual",
        "metric-derating-er",
        "metric-delta-npsh",
        "wb-clearance-slider",
        "wb-rubber-u2-lock",
        "wb-atomic-part-card",
        "projectWorkbenchToDOM",
        "slider-ph",
        "wb-seal-branch",
        "wb-impeller-b2",
        "wb-bearing-c",
        "metric-fl",
        "metric-cv",
        "metric-v-rec",
    ] {
        if !qw_str.contains(req) {
            return Err(format!("QuoteWizard.astro carece de paridad backend-UI: falta '{}'", req));
        }
    }

    let diag_str = fs::read_to_string(site_root.join("src/components/DiagnosticsHub.astro")).map_err(|e| e.to_string())?;
    if !diag_str.contains("MECHANICAL_DIAGNOSTICS") {
        return Err("DiagnosticsHub.astro no consume MECHANICAL_DIAGNOSTICS desde slurryEngine.js".to_string());
    }

    let astro_cfg = fs::read_to_string(site_root.join("astro.config.mjs")).map_err(|e| e.to_string())?;
    if !astro_cfg.contains("process.env.PUBLIC_GA_ID") {
        return Err("astro.config.mjs debe condicionar partytown a process.env.PUBLIC_GA_ID (DEB-05)".to_string());
    }

    Ok(())
}

pub fn verify_pump_assembly_and_zero_orphan_rfq_links(site_root: &Path) -> Result<(), String> {
    let report_path = site_root.join("src").join("components").join("PumpAssemblyReport.astro");
    let strip_path = site_root.join("src").join("components").join("QuickPartSelectorStrip.astro");
    if !report_path.exists() {
        return Err("No existe src/components/PumpAssemblyReport.astro".to_string());
    }
    if strip_path.exists() {
        return Err("DEB-V50-14: src/components/QuickPartSelectorStrip.astro debe estar eliminado fisicamente".to_string());
    }

    let src_dir = site_root.join("src");
    for entry in WalkDir::new(&src_dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
            if ext == "astro" {
                let content = fs::read_to_string(entry.path()).unwrap_or_default();
                if content.contains("href=\"/#rfq") || content.contains("href='/#rfq") || content.contains("href=\"/en/#rfq") || content.contains("href='/en/#rfq") {
                    return Err(format!("Enlace huerfano /#rfq o /en/#rfq detectado en {}", entry.path().display()));
                }
            }
        }
    }
    Ok(())
}

pub fn verify_backend_ui_full_parity_and_altitude_pincer(site_root: &Path) -> Result<(), String> {
    let header_path = site_root.join("src").join("components").join("Header.astro");
    let header_src = fs::read_to_string(&header_path).map_err(|e| format!("Error leyendo Header.astro: {}", e))?;
    if header_src.contains("background: #E56B38;") {
        return Err("DEB-P4-01: Header.astro aun contiene background: #E56B38 (ratio 6.01:1 < 7.0:1 WCAG AAA)".to_string());
    }

    let dossier_path = site_root.join("src").join("components").join("LiveEngineeringDossier.astro");
    let dossier_src = fs::read_to_string(&dossier_path).map_err(|e| format!("Error leyendo LiveEngineeringDossier.astro: {}", e))?;
    if dossier_src.contains("<button type=\"button\" id=\"btn-quote-mailto\"") {
        return Err("DEB-P4-04: LiveEngineeringDossier.astro aun contiene el boton muerto #btn-quote-mailto".to_string());
    }
    for req_id in [
        "id=\"gate-lead-status\"",
        "id=\"trust-boundary-alert\"",
        "id=\"live-role-criteria\"",
        "id=\"metric-hr\"",
        "id=\"metric-er\"",
        "id=\"metric-wear-hours\"",
        "id=\"metric-patm-mca\"",
        "id=\"dossier-metric-delta-npsh\"",
        "id=\"metric-motor-iec\"",
        "id=\"metric-k-motor-alt\"",
        "id=\"wb-pipe-vel-loss\"",
        "id=\"live-assembly-collision-note\"",
    ] {
        if !dossier_src.contains(req_id) {
            return Err(format!("LiveEngineeringDossier.astro carece de {}", req_id));
        }
    }

    let wizard_path = site_root.join("src").join("components").join("QuoteWizard.astro");
    let wizard_raw = fs::read_to_string(&wizard_path).map_err(|e| format!("Error leyendo QuoteWizard.astro: {}", e))?;
    let wizard_lines = wizard_raw.lines().count();
    if wizard_lines >= 1150 {
        return Err(format!("QuoteWizard.astro excede presupuesto Parnas (< 1150 lineas): {} lineas", wizard_lines));
    }
    let wizard_src = read_quote_wizard_composite(site_root)?;
    for req_wiz in [
        "id=\"btn-apply-mining-preset\"",
        "id=\"wb-ctrl-solve-mode\"",
        "id=\"btn-apply-ss-to-circuit\"",
        "id=\"wb-altitude-live-strip\"",
        "id=\"wb-clearance-vel-loss\"",
    ] {
        if !wizard_src.contains(req_wiz) {
            return Err(format!("QuoteWizard.astro carece de {}", req_wiz));
        }
    }

    let engine_path = site_root.join("src").join("scripts").join("slurryEngine.js");
    let engine_src = fs::read_to_string(&engine_path).map_err(|e| format!("Error leyendo slurryEngine.js: {}", e))?;
    for req_eng in [
        "combinedMotorAltitudeMultiplier",
        "motorSizingPenaltyPct",
        "barometricPressureKpa",
        "npshSafeMarginWarning",
        "export function validatePlantLeadInput",
    ] {
        if !engine_src.contains(req_eng) {
            return Err(format!("slurryEngine.js carece de {}", req_eng));
        }
    }

    let bus_path = site_root.join("src").join("scripts").join("workbenchBus.js");
    let bus_src = fs::read_to_string(&bus_path).map_err(|e| format!("Error leyendo workbenchBus.js: {}", e))?;
    for req_bus in [
        "export function resolveMiningDistrictPreset",
        "export function buildCanonicalEngineeringSnapshot",
    ] {
        if !bus_src.contains(req_bus) {
            return Err(format!("workbenchBus.js carece de {}", req_bus));
        }
    }

    Ok(())
}

pub fn verify_section_3_1_3_2_zero_duplication_and_mobile_fold(site_root: &Path) -> Result<(), String> {
    if site_root.join("src/components/DualHubView.astro").exists() {
        return Err("DEB-32-01: src/components/DualHubView.astro debe estar fisicamente eliminado".to_string());
    }

    let base_layout = fs::read_to_string(site_root.join("src/layouts/BaseLayout.astro")).map_err(|e| e.to_string())?;
    if base_layout.contains("hash.indexOf('#rfq') === 0") {
        return Err("DEB-31-01: BaseLayout.astro aun contiene redireccion legada #rfq".to_string());
    }

    let diag_hub = fs::read_to_string(site_root.join("src/components/DiagnosticsHub.astro")).map_err(|e| e.to_string())?;
    if diag_hub.contains("document.getElementById('rfq')") {
        return Err("DEB-31-02: DiagnosticsHub.astro aun contiene handler muerto #rfq".to_string());
    }

    let bombeo_es = read_page_with_islands_composite(site_root, "src/pages/bombeo/index.astro")?;
    let bombeo_en = read_page_with_islands_composite(site_root, "src/pages/en/pumping/index.astro")?;
    if bombeo_es.contains("class=\"card wet-lot-callout\"") || bombeo_en.contains("class=\"card wet-lot-callout\"") {
        return Err("DEB-32-02: bombeo/index.astro o en/pumping/index.astro aun contienen .wet-lot-callout duplicado".to_string());
    }
    if !bombeo_es.contains("id=\"bombeo-catalog-tabs\"") || !bombeo_en.contains("id=\"bombeo-catalog-tabs\"") {
        return Err("bombeo/index.astro y en/pumping/index.astro deben consolidar tarjetas en #bombeo-catalog-tabs".to_string());
    }

    let wizard = read_quote_wizard_composite(site_root)?;
    if wizard.contains("class=\"circuit-context-banner\"") {
        return Err("DEB-32-03: QuoteWizard.astro aun contiene .circuit-context-banner redundante".to_string());
    }
    let idx_role = wizard.find("id=\"wb-role\"").ok_or("Falta id=\"wb-role\" en QuoteWizard.astro")?;
    let idx_atomic = wizard.find("id=\"wb-atomic-part-card\"").ok_or("Falta id=\"wb-atomic-part-card\" en QuoteWizard.astro")?;
    if idx_role > idx_atomic {
        return Err("QuoteWizard.astro viola Input-First: #wb-role debe preceder a #wb-atomic-part-card".to_string());
    }

    let ctrl_es = read_page_with_islands_composite(site_root, "src/pages/control-de-procesos/index.astro")?;
    let ctrl_en = read_page_with_islands_composite(site_root, "src/pages/en/process-control/index.astro")?;
    for raw_tex in ["$P_{80}$", "$S_s$", "$C_w$", "$\\rho_p$", "$M_s$", "$d_{95}$", "$a_L$"] {
        if ctrl_es.contains(raw_tex) || ctrl_en.contains(raw_tex) {
            return Err(format!("DEB-32-04: Token LaTeX crudo {} detectado en Puerta 3", raw_tex));
        }
    }

    Ok(())
}
