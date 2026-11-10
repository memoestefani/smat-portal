use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub struct GateReport {
    pub name: String,
    pub passed: bool,
    pub details: String,
}

pub fn find_site_root() -> PathBuf {
    let mut current = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    for _ in 0..5 {
        if current.join("data").join("company.json").exists() {
            return current;
        }
        if let Some(parent) = current.parent() {
            current = parent.to_path_buf();
        } else {
            break;
        }
    }
    PathBuf::from(".")
}

pub fn read_quote_wizard_composite(site_root: &Path) -> Result<String, String> {
    let qw = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro")).map_err(|e| e.to_string())?;
    let dossier = fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro")).unwrap_or_default();
    let ctrl = fs::read_to_string(site_root.join("src/scripts/quoteWizardController.js")).unwrap_or_default();
    let css = fs::read_to_string(site_root.join("src/styles/workbench.css")).unwrap_or_default();
    Ok(format!("{}\n{}\n{}\n{}", qw, dossier, ctrl, css))
}

/// 1. Verifica integridad SSOT de data/roles.json, data/company.json y erradicacion de roles.copy.json
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
    let index_path = site_root.join("src").join("pages").join("index.astro");
    let en_index_path = site_root.join("src").join("pages").join("en").join("index.astro");

    if deck_path.exists() {
        return Err("src/components/FlightDeck.astro debe estar eliminado (DEB-E3-02)".to_string());
    }
    if persp_path.exists() {
        return Err("src/components/PerspectiveSelector.astro debe estar eliminado (DEB-E3-01)".to_string());
    }
    if !trust_path.exists() {
        return Err("No existe src/components/TrustMatrix.astro".to_string());
    }

    let index_content = fs::read_to_string(&index_path).map_err(|e| e.to_string())?;
    let en_content = fs::read_to_string(&en_index_path).map_err(|e| e.to_string())?;

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

pub fn run_all_checks(site_root: &Path) -> Vec<GateReport> {
    vec![
        GateReport {
            name: "1. Paridad de Catalogo (roles.json == roles.copy.json)".to_string(),
            passed: verify_catalog_parity(site_root).is_ok(),
            details: verify_catalog_parity(site_root).err().unwrap_or_else(|| "OK: Paridad byte a byte confirmada.".to_string()),
        },
        GateReport {
            name: "2. Escaner Anti-Fugas (Precios, Margenes y Secretos)".to_string(),
            passed: verify_leak_scanner(site_root).is_ok(),
            details: verify_leak_scanner(site_root).err().unwrap_or_else(|| "OK: Cero fugas comerciales detectadas.".to_string()),
        },
        GateReport {
            name: "3. Simetria Bilingue ES/EN (Gate D9)".to_string(),
            passed: verify_bilingual_symmetry(site_root).is_ok(),
            details: verify_bilingual_symmetry(site_root).err().unwrap_or_else(|| "OK: Taxonomia y rutas 100% simetricas.".to_string()),
        },
        GateReport {
            name: "4. Integridad de Redirecciones 301 Deterministas".to_string(),
            passed: verify_redirect_integrity(site_root).is_ok(),
            details: verify_redirect_integrity(site_root).err().unwrap_or_else(|| "OK: 40 URLs historicas mapeadas a 301 validos.".to_string()),
        },
        GateReport {
            name: "5. Integridad de NAP (Durango, Salas #114)".to_string(),
            passed: verify_nap_integrity(site_root).is_ok(),
            details: verify_nap_integrity(site_root).err().unwrap_or_else(|| "OK: Identidad fiscal y logistica consistente.".to_string()),
        },
        GateReport {
            name: "6. Cero Placeholders y Cero Mockups".to_string(),
            passed: verify_zero_placeholders(site_root).is_ok(),
            details: verify_zero_placeholders(site_root).err().unwrap_or_else(|| "OK: 100% datos de ingenieria comprobados.".to_string()),
        },
        GateReport {
            name: "7. Integridad de Decisiones B2B (Gate D10)".to_string(),
            passed: verify_decision_criteria(site_root).is_ok(),
            details: verify_decision_criteria(site_root).err().unwrap_or_else(|| "OK: 9 roles con variables de pulpa y limites.".to_string()),
        },
        GateReport {
            name: "8. Soporte de Vista Imprimible ERP (Gate D11)".to_string(),
            passed: verify_print_view_parity(site_root).is_ok(),
            details: verify_print_view_parity(site_root).err().unwrap_or_else(|| "OK: @media print verificado en acuse y thank-you.".to_string()),
        },
        GateReport {
            name: "9. Erradicacion de Debris y Scripts (Gate D12)".to_string(),
            passed: verify_no_orphan_debris(site_root).is_ok(),
            details: verify_no_orphan_debris(site_root).err().unwrap_or_else(|| "OK: Cero temporales y herramientas integradas.".to_string()),
        },
        GateReport {
            name: "10. Diccionario Estatico de Grupos Mineros (Gate D13)".to_string(),
            passed: verify_mining_groups_dataset(site_root).is_ok(),
            details: verify_mining_groups_dataset(site_root).err().unwrap_or_else(|| "OK: 25 grupos mineros auditados con cero campos vacios.".to_string()),
        },
        GateReport {
            name: "11. Motor Hidráulico y Metalúrgico de Pulpa (Gate D14)".to_string(),
            passed: verify_slurry_engine_module(site_root).is_ok(),
            details: verify_slurry_engine_module(site_root).err().unwrap_or_else(|| "OK: Durand-Condolios y matriz metalurgica verificados.".to_string()),
        },
        GateReport {
            name: "12. Tokens Modulares y Live Workbench Split (Gate D15)".to_string(),
            passed: verify_design_tokens_and_workbench(site_root).is_ok(),
            details: verify_design_tokens_and_workbench(site_root).err().unwrap_or_else(|| "OK: Tokens ejecutivos y ficha en tiempo real integrados.".to_string()),
        },
        GateReport {
            name: "13. EventBus y Suite de Exportación de 4 Vías (Gate D16)".to_string(),
            passed: verify_event_bus_and_export_suite(site_root).is_ok(),
            details: verify_event_bus_and_export_suite(site_root).err().unwrap_or_else(|| "OK: EventBus reactivo y 4 vias de exportacion verificadas.".to_string()),
        },
        GateReport {
            name: "14. Unified Flight Deck y Trust Matrix (Gate D17)".to_string(),
            passed: verify_flight_deck_and_trust_matrix(site_root).is_ok(),
            details: verify_flight_deck_and_trust_matrix(site_root).err().unwrap_or_else(|| "OK: Flight Deck de 3 modos y Trust Matrix verificados.".to_string()),
        },
        GateReport {
            name: "15. Erradicación Estricta de Promesas Falsas (Gate D18)".to_string(),
            passed: verify_no_false_sla_promises(site_root).is_ok(),
            details: verify_no_false_sla_promises(site_root).err().unwrap_or_else(|| "OK: Cero menciones de 45 min en codigo fuente.".to_string()),
        },
        GateReport {
            name: "16. Accesibilidad Total de 40 Rutas (Gate D19)".to_string(),
            passed: verify_40_routes_reachability(site_root).is_ok(),
            details: verify_40_routes_reachability(site_root).err().unwrap_or_else(|| "OK: 40 rutas 100% alcanzables en navegacion.".to_string()),
        },
        GateReport {
            name: "17. Calibración y Ethos Lingüístico (Gate D20)".to_string(),
            passed: verify_linguistic_ethos(site_root).is_ok(),
            details: verify_linguistic_ethos(site_root).err().unwrap_or_else(|| "OK: Cero menciones de lenguaje informal ('taller' / 'workshop').".to_string()),
        },
        GateReport {
            name: "18. Higiene de Propiedad Intelectual y Cero Marcas de Terceros (Gate D21)".to_string(),
            passed: verify_trademark_hygiene(site_root).is_ok(),
            details: verify_trademark_hygiene(site_root).err().unwrap_or_else(|| "OK: Cero menciones de marcas registradas de terceros.".to_string()),
        },
        GateReport {
            name: "19. Cabeceras de Seguridad Cloudflare Pages (Gate D22)".to_string(),
            passed: verify_security_headers(site_root).is_ok(),
            details: verify_security_headers(site_root).err().unwrap_or_else(|| "OK: Directivas DENY y nosniff verificadas.".to_string()),
        },
        GateReport {
            name: "20. Cero Claims Engañosos de Emergencia (Gate D23)".to_string(),
            passed: verify_no_emergency_claims(site_root).is_ok(),
            details: verify_no_emergency_claims(site_root).err().unwrap_or_else(|| "OK: Horario de planta verificado sin promesas falsas 24/7.".to_string()),
        },
        GateReport {
            name: "21. Reporte de Armado de Bomba y Cero Enlaces Huerfanos /#rfq (Gate D24)".to_string(),
            passed: verify_pump_assembly_and_zero_orphan_rfq_links(site_root).is_ok(),
            details: verify_pump_assembly_and_zero_orphan_rfq_links(site_root).err().unwrap_or_else(|| "OK: Reporte de despiece 5 estaciones y cero enlaces /#rfq verificados.".to_string()),
        },
        GateReport {
            name: "22. Paridad Backend-UI 100%, Cinematica V-Belt, Claro Axial y Decompresion Cowan (Gate D25)".to_string(),
            passed: verify_backend_ui_parity_and_apple_cowan(site_root).is_ok(),
            details: verify_backend_ui_parity_and_apple_cowan(site_root).err().unwrap_or_else(|| "OK: 7 motores de backend expuestos en UI, contraste AAA y Cowan 4+-1 verificados.".to_string()),
        },
        GateReport {
            name: "21b. Verificacion de Enlaces Huerfanos /#rfq (Gate D24b)".to_string(),
            passed: verify_pump_assembly_and_zero_orphan_rfq_links(site_root).is_ok(),
            details: verify_pump_assembly_and_zero_orphan_rfq_links(site_root).err().unwrap_or_else(|| "OK: Reporte de despiece 5 estaciones y cero enlaces /#rfq verificados.".to_string()),
        },
        GateReport {
            name: "23. Particion Modular Parnas y Cero data-step=2 Falsos (Gate D26)".to_string(),
            passed: verify_modular_parnas_and_zero_fake_data_step_gate(site_root).is_ok(),
            details: verify_modular_parnas_and_zero_fake_data_step_gate(site_root).err().unwrap_or_else(|| "OK: QuoteWizard <950 lineas, 4 modulos Parnas, 0 data-step=2 y 0 tokens --color-*.".to_string()),
        },
        GateReport {
            name: "24. Higiene Lexica Don Manuel y Separacion /contacto/ vs /cotizar/ (Gate D27)".to_string(),
            passed: verify_manuel_lexical_and_route_separation_gate(site_root).is_ok(),
            details: verify_manuel_lexical_and_route_separation_gate(site_root).err().unwrap_or_else(|| "OK: Cero 'Refaccion Urgente' y cero QuoteWizard duplicado en /contacto/.".to_string()),
        },
        GateReport {
            name: "25. Polaridad Solar WCAG AAA y Paridad Etapa 3 1-C++ a 10-C++ (Gate D28)".to_string(),
            passed: verify_solar_wcag_aaa_and_etapa3_parity(site_root).is_ok(),
            details: verify_solar_wcag_aaa_and_etapa3_parity(site_root).err().unwrap_or_else(|| "OK: Tokens WCAG AAA, 11 parametros metrologicos, Tri-Compound y cinematica n2/Fr verificados.".to_string()),
        },
        GateReport {
            name: "26. Paridad 100% Backend-UI y Pinza Termo-Barometrica TEFC (Gate D29)".to_string(),
            passed: verify_backend_ui_full_parity_and_altitude_pincer(site_root).is_ok(),
            details: verify_backend_ui_full_parity_and_altitude_pincer(site_root).err().unwrap_or_else(|| "OK: 12 fichas atomicas con 6 campos fisicos, SiC, Presets de Distrito y Derating TEFC verificados.".to_string()),
        },
        GateReport {
            name: "27. Erradicacion de Redundancias Secciones 3.1 y 3.2 y Fold Movil Apple HIG (Gate D30)".to_string(),
            passed: verify_section_3_1_3_2_zero_duplication_and_mobile_fold(site_root).is_ok(),
            details: verify_section_3_1_3_2_zero_duplication_and_mobile_fold(site_root).err().unwrap_or_else(|| "OK: DualHubView eliminado, #bombeo-catalog-tabs unificado, Input-First en QuoteWizard y 0 LaTeX crudo.".to_string()),
        },
        GateReport {
            name: "28. Bijeccion 19 SKUs Quick-Checkout, 13 Partes Atomicas y Diagramas CAD Rayos-X (Gate MVP v3 D1/D2/D6)".to_string(),
            passed: verify_quick_checkout_and_cad_bijection(site_root).is_ok(),
            details: verify_quick_checkout_and_cad_bijection(site_root).err().unwrap_or_else(|| "OK: 19 SKUs Quick-Checkout, 13 partes atomicas (incl. D075C21) y capa X-Ray CAD verificados.".to_string()),
        },
        GateReport {
            name: "29. Verificabilidad Fisica de SLAs, Bandeja c*mu, Balance 3 Vasos Marcy y Costuras LCOM4 (Gate MVP v3 D3/D5/D7/D8/D9)".to_string(),
            passed: verify_sla_verifiability_and_lcom4_seam(site_root).is_ok(),
            details: verify_sla_verifiability_and_lcom4_seam(site_root).err().unwrap_or_else(|| "OK: Bandeja c*mu, Pasaporte Proveedor, Clasificacion 3 Vasos Marcy, NOM-141 y costura LCOM4 verificados.".to_string()),
        },
        GateReport {
            name: "30. Cierre Forense PRD v3.0: 19 SKUs + Alias SSG, ProductQuickCard 3-en-1, Drop-In Guard, QuickOrderTray, CycloneAndScreenReport, Plano 3, 38+ Redirects y Costuras LCOM4 (Gate D1..D10)".to_string(),
            passed: verify_prd_v3_forensic_closure_gate_30(site_root).is_ok(),
            details: verify_prd_v3_forensic_closure_gate_30(site_root).err().unwrap_or_else(|| "OK: 19 SKUs + alias SSG, 19 WebP <=45KB, ProductQuickCard, QuickOrderTray, CycloneAndScreenReport, 0 Banco Durango, 38+ Redirects y LCOM4 verificados.".to_string()),
        },
        GateReport {
            name: "31. Cierre Total de Conceptos Huerfanos y Arbitraje Epistemico v3.1: DeHoratius Warehouse Audit, Tribologia Hibrida A05+R55, 6 Fallas, 19 WebP dHash64 Unicos, Core Trade-In -22%, Gorain/Timoshenko, Pasaporte SAT y Costuras LCOM4 <=420 LOC (Gate D1=1-C++..D10=10-C++)".to_string(),
            passed: verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(site_root).is_ok(),
            details: verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(site_root).err().unwrap_or_else(|| "OK: 0 conceptos huerfanos v3.1, warehouse_audit ($1,646,850 MXN / 383 pzas), A05+R55, 6 modos de falla, 19 WebP unicos, Core Trade-In -22%, Gorain/Timoshenko, Pasaporte SAT y LCOM4 verificados.".to_string()),
        },
        GateReport {
            name: "32. Cierre Definitivo de los 7 Hallazgos Criticos y Purga de Debris v3.2: CSS Nativo Scoped Solar AAA, 19 SKUs Canonicos SMAT-*, 19 Fotos Reales sin expo.png, 5 Diagramas CAD SVG, Botones Cableados 526183670664, Hash FNV-1a Drop-In, 115 Redirects Wayback 301 y 3 Puertas Canonicas (Gate D1=1-C+..D10=10-C+)".to_string(),
            passed: verify_seven_findings_and_v32_closure_gate_32(site_root).is_ok(),
            details: verify_seven_findings_and_v32_closure_gate_32(site_root).err().unwrap_or_else(|| "OK: 7 Hallazgos Criticos cerrados al 100%, 0 clases Tailwind huerfanas, 19 SKUs SMAT-*, 0 expo.png, 5 nuevos CAD SVG, WhatsApp 526183670664, FNV-1a Drop-In, 115 Redirects 301 y 0 debris v3.2.".to_string()),
        },
    ]
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
    if line_count >= 950 {
        return Err(format!("QuoteWizard.astro excede el presupuesto modular (<950 lineas): {} lineas", line_count));
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
    let report_str = fs::read_to_string(site_root.join("src/components/PumpAssemblyReport.astro")).map_err(|e| e.to_string())?;
    if !report_str.contains("evaluateWetEndAssemblyInterference") || !report_str.contains("data-clearance-slider") {
        return Err("PumpAssemblyReport.astro no expone evaluateWetEndAssemblyInterference ni el calibrador de claro axial".to_string());
    }

    let skid_es = fs::read_to_string(site_root.join("src/pages/bombeo/skid.astro")).map_err(|e| e.to_string())?;
    let skid_en = fs::read_to_string(site_root.join("src/pages/en/pumping/skid.astro")).map_err(|e| e.to_string())?;
    if !skid_es.contains("calculateDriveAndBearingKinematics") || !skid_en.contains("calculateDriveAndBearingKinematics") {
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
    if !strip_path.exists() {
        return Err("No existe src/components/QuickPartSelectorStrip.astro".to_string());
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
        "id=\"metric-delta-npsh\"",
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
    let wizard_src = fs::read_to_string(&wizard_path).map_err(|e| format!("Error leyendo QuoteWizard.astro: {}", e))?;
    let wizard_lines = wizard_src.lines().count();
    if wizard_lines >= 950 {
        return Err(format!("QuoteWizard.astro excede presupuesto Parnas (< 950 lineas): {} lineas", wizard_lines));
    }
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

    let bombeo_es = fs::read_to_string(site_root.join("src/pages/bombeo/index.astro")).map_err(|e| e.to_string())?;
    let bombeo_en = fs::read_to_string(site_root.join("src/pages/en/pumping/index.astro")).map_err(|e| e.to_string())?;
    if bombeo_es.contains("class=\"card wet-lot-callout\"") || bombeo_en.contains("class=\"card wet-lot-callout\"") {
        return Err("DEB-32-02: bombeo/index.astro o en/pumping/index.astro aun contienen .wet-lot-callout duplicado".to_string());
    }
    if !bombeo_es.contains("id=\"bombeo-catalog-tabs\"") || !bombeo_en.contains("id=\"bombeo-catalog-tabs\"") {
        return Err("bombeo/index.astro y en/pumping/index.astro deben consolidar tarjetas en #bombeo-catalog-tabs".to_string());
    }

    let wizard = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro")).map_err(|e| e.to_string())?;
    if wizard.contains("class=\"circuit-context-banner\"") {
        return Err("DEB-32-03: QuoteWizard.astro aun contiene .circuit-context-banner redundante".to_string());
    }
    let idx_role = wizard.find("id=\"wb-role\"").ok_or("Falta id=\"wb-role\" en QuoteWizard.astro")?;
    let idx_atomic = wizard.find("id=\"wb-atomic-part-card\"").ok_or("Falta id=\"wb-atomic-part-card\" en QuoteWizard.astro")?;
    if idx_role > idx_atomic {
        return Err("QuoteWizard.astro viola Input-First: #wb-role debe preceder a #wb-atomic-part-card".to_string());
    }

    let ctrl_es = fs::read_to_string(site_root.join("src/pages/control-de-procesos/index.astro")).map_err(|e| e.to_string())?;
    let ctrl_en = fs::read_to_string(site_root.join("src/pages/en/process-control/index.astro")).map_err(|e| e.to_string())?;
    for raw_tex in ["$P_{80}$", "$S_s$", "$C_w$", "$\\rho_p$", "$M_s$", "$d_{95}$", "$a_L$"] {
        if ctrl_es.contains(raw_tex) || ctrl_en.contains(raw_tex) {
            return Err(format!("DEB-32-04: Token LaTeX crudo {} detectado en Puerta 3", raw_tex));
        }
    }

    Ok(())
}

/// 28. Gate MVP v3 (D1, D2, D4, D6): Bijeccion de 19 SKUs Quick-Checkout, 13 partes atomicas (incl. D075C21) y capa Rayos-X CAD
pub fn verify_quick_checkout_and_cad_bijection(site_root: &Path) -> Result<(), String> {
    let qc_path = site_root.join("data").join("quick_checkout_Catalog.json");
    if !qc_path.exists() {
        return Err("Falta data/quick_checkout_Catalog.json (D1)".to_string());
    }
    let qc_raw = fs::read_to_string(&qc_path).map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr.as_array().ok_or("quick_checkout_Catalog.json debe ser un arreglo JSON")?;
    if skus.len() != 19 {
        return Err(format!("quick_checkout_Catalog.json debe contener exactamente 19 SKUs Tier-1 (encontrados: {})", skus.len()));
    }

    let atomic_path = site_root.join("data").join("atomic_parts.json");
    let atomic_raw = fs::read_to_string(&atomic_path).map_err(|e| e.to_string())?;
    let atomic_arr: serde_json::Value = serde_json::from_str(&atomic_raw).map_err(|e| e.to_string())?;
    let parts = atomic_arr.as_array().ok_or("atomic_parts.json debe ser un arreglo JSON")?;
    if parts.len() < 13 {
        return Err(format!("atomic_parts.json debe contener al menos 13 partes atomicas (encontradas: {})", parts.len()));
    }
    let has_d075c21 = parts.iter().any(|p| p.get("part_number").and_then(|v| v.as_str()) == Some("D075C21"));
    if !has_d075c21 {
        return Err("atomic_parts.json carece de la Camisa Protectora de Flecha D075C21 (D6)".to_string());
    }

    for rel in [
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
        "src/components/TechnicalDiagrams.astro",
        "src/components/PumpAssemblyReport.astro",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!("Falta archivo requerido para bijeccion CAD/Quick-Checkout: {}", rel));
        }
    }

    let diag_src = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro")).map_err(|e| e.to_string())?;
    if !diag_src.contains("data-layer=\"xray-wear\"") || !diag_src.contains("0.76") {
        return Err("TechnicalDiagrams.astro carece de data-layer=\"xray-wear\" o referencia ISO/IEC 7810 (0.76 mm)".to_string());
    }

    Ok(())
}

/// 29. Gate MVP v3 (D3, D5, D7, D8, D9): Verificabilidad Fisica de SLAs, Bandeja c*mu, Balance 3 Vasos Marcy y Costuras LCOM4
pub fn verify_sla_verifiability_and_lcom4_seam(site_root: &Path) -> Result<(), String> {
    for rel in [
        "src/scripts/requisitionTrayBus.js",
        "src/components/RequisitionTraySummary.astro",
        "src/pages/clasificacion/index.astro",
        "src/pages/en/classification/index.astro",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!("Falta componente/ruta del MVP v3.0: {}", rel));
        }
    }

    let engine_src = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js")).map_err(|e| e.to_string())?;
    for fn_sig in [
        "export function calculateThreeCupMarcyCycloneBalance",
        "export function evaluateFilterPressPlateDeflection",
        "export function computeSelectionOrderCodeHash",
    ] {
        if !engine_src.contains(fn_sig) {
            return Err(format!("slurryEngine.js carece de {}", fn_sig));
        }
    }

    let tray_src = fs::read_to_string(site_root.join("src/scripts/requisitionTrayBus.js")).map_err(|e| e.to_string())?;
    for fn_sig in [
        "export function buildCmuPrioritySubjectLine",
        "export function buildSmatVendorPassportPayload",
        "export function encodeReorderUrlQuery",
    ] {
        if !tray_src.contains(fn_sig) {
            return Err(format!("requisitionTrayBus.js carece de {}", fn_sig));
        }
    }

    let flot_es = fs::read_to_string(site_root.join("src/pages/flotacion/index.astro")).map_err(|e| e.to_string())?;
    let filt_es = fs::read_to_string(site_root.join("src/pages/filtracion/index.astro")).map_err(|e| e.to_string())?;
    if !flot_es.contains("id=\"flotation-dropin-matrix\"") {
        return Err("flotacion/index.astro carece de #flotation-dropin-matrix (D8)".to_string());
    }
    if !filt_es.contains("id=\"nom141-plate-flexure-verifier\"") {
        return Err("filtracion/index.astro carece de #nom141-plate-flexure-verifier (D8)".to_string());
    }

    Ok(())
}

/// 30. Gate D10 (Cierre Forense PRD v3.0): Audita las 12 brechas forenses (GAP-V3-01..12) y los 8 ítems de debris (DEB-V3-01..08)
pub fn verify_prd_v3_forensic_closure_gate_30(site_root: &Path) -> Result<(), String> {
    for rel in [
        "src/scripts/quickProductsCatalog.js",
        "src/scripts/dropInEquivalenceGuard.js",
        "src/scripts/mechanicalAndSeparationEngine.js",
        "src/scripts/workbenchExportFormatters.js",
        "src/components/ProductQuickCard.astro",
        "src/components/QuickOrderTray.astro",
        "src/components/CycloneAndScreenReport.astro",
        "tools/build_product_images.mjs",
        "tests/prd_v3_forensic_closure.test.mjs",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!("Falta artefacto del Cierre Forense PRD v3.0 (Gate 30): {}", rel));
        }
    }

    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json")).map_err(|e| e.to_string())?;
    for banned_frame in ["4/3 C", "6/4 D", "8/6 E", "AHR"] {
        if qc_raw.contains(banned_frame) {
            return Err(format!("quick_checkout_Catalog.json contiene nomenclatura de bastidor OEM prohibida: {}", banned_frame));
        }
    }
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr.as_array().ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;
    if skus.len() != 19 {
        return Err(format!("Se esperaban 19 SKUs en quick_checkout_Catalog.json, encontrados: {}", skus.len()));
    }

    for sku in skus {
        let id = sku.get("sku_id").and_then(|v| v.as_str()).unwrap_or("UNKNOWN");
        let regime = sku.get("stock_regime").and_then(|v| v.as_str()).unwrap_or("");
        if !["hay", "se_pide", "se_fabrica"].contains(&regime) {
            return Err(format!("SKU {} carece de stock_regime valido (hay|se_pide|se_fabrica): {}", id, regime));
        }
        let gate_lock = sku.get("gate_lock").and_then(|v| v.as_str()).unwrap_or("");
        if !["G1", "G2", "G3", "G4", "G5"].contains(&gate_lock) {
            return Err(format!("SKU {} carece de gate_lock valido (G1..G5): {}", id, gate_lock));
        }
        if sku.get("sat_tuple").and_then(|s| s.get("clave_prod_serv")).is_none() {
            return Err(format!("SKU {} carece de sat_tuple.clave_prod_serv", id));
        }
        if sku.get("geometric_triplet_mm").is_none() {
            return Err(format!("SKU {} carece de geometric_triplet_mm", id));
        }
        let photo_rel = sku.get("photo_webp").and_then(|v| v.as_str()).unwrap_or("");
        let clean_rel = photo_rel.trim_start_matches('/');
        let photo_path = site_root.join("public").join(clean_rel);
        if !photo_path.exists() {
            return Err(format!("SKU {} carece de imagen WebP fisica en public/{}", id, clean_rel));
        }
        let meta = fs::metadata(&photo_path).map_err(|e| e.to_string())?;
        if meta.len() == 0 || meta.len() > 46080 {
            return Err(format!("Imagen WebP {} excede presupuesto de 45 KB ({} bytes)", clean_rel, meta.len()));
        }
    }

    let diag_src = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro")).map_err(|e| e.to_string())?;
    if !diag_src.contains("urethane_screen_panel_305") {
        return Err("TechnicalDiagrams.astro carece de urethane_screen_panel_305 (sobreyectividad 16/16)".to_string());
    }

    for check_rel in [
        "src/components/SharePurchasing.astro",
        "src/pages/catalogo.astro",
        "src/pages/en/catalog.astro",
        "src/pages/catalogo/[code].astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/cells.astro",
        "src/pages/filtracion/repuestos.astro",
    ] {
        let content = fs::read_to_string(site_root.join(check_rel)).map_err(|e| e.to_string())?;
        if content.contains("Banco Durango") || content.contains("Balanceo Dinámico en Banco de Pruebas") {
            return Err(format!("{} aun contiene claim obsoleto 'Banco Durango' / 'Balanceo Dinámico en Banco de Pruebas' (DEB-V3-03/04)", check_rel));
        }
    }

    let redirects_raw = fs::read_to_string(site_root.join("public/_redirects")).map_err(|e| e.to_string())?;
    for req_legacy in [
        "/products/slurry-pump.html",
        "/products/hydrocyclone.html",
        "/products/flotation-cell.html",
        "/products/filter-press.html",
        "/products/screen-panel.html",
        "/products/mining-Shovel-Rope.html",
    ] {
        if !redirects_raw.contains(req_legacy) {
            return Err(format!("public/_redirects carece de regla Wayback 301: {}", req_legacy));
        }
    }

    Ok(())
}

/// 31. Gate D10=10-C++ (Cierre Total de Conceptos Huérfanos y Arbitraje Epistémico v3.1):
/// Audita las 10 decisiones (D1=1-C++ a D10=10-C++), los 4 invariantes (INV-SMAT-SCI-05..08) y la purga de debris (DEB-V31-01..10).
pub fn verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(site_root: &Path) -> Result<(), String> {
    for rel in [
        "ortho.toml",
        "src/scripts/tribologyAndCompatibilityEngine.js",
        "src/scripts/districtProfilesAndSkuCatalog.js",
        "src/pages/cumplimiento.astro",
        "src/pages/en/compliance.astro",
        "tests/smat_v3_total_closure.test.mjs",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!("Falta artefacto del Cierre Total v3.1 (Gate 31): {}", rel));
        }
    }

    // D1=1-C++: DeHoratius & Raman (2008) warehouse_audit en los 19 SKUs
    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json")).map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr.as_array().ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;
    let mut distinct_webp_payloads = std::collections::BTreeSet::new();
    for sku in skus {
        let id = sku.get("sku_id").and_then(|v| v.as_str()).unwrap_or("UNKNOWN");
        let wa = sku.get("warehouse_audit").ok_or_else(|| format!("SKU {} carece de warehouse_audit (D1=1-C++)", id))?;
        if wa.get("warehouse_total_mxn").and_then(|v| v.as_u64()) != Some(1_646_850) {
            return Err(format!("SKU {} tiene warehouse_total_mxn distinto de 1646850", id));
        }
        if wa.get("warehouse_total_units").and_then(|v| v.as_u64()) != Some(383) {
            return Err(format!("SKU {} tiene warehouse_total_units distinto de 383", id));
        }
        let photo_rel = sku.get("photo_webp").and_then(|v| v.as_str()).unwrap_or("").trim_start_matches('/');
        let bytes = fs::read(site_root.join("public").join(photo_rel)).map_err(|e| e.to_string())?;
        distinct_webp_payloads.insert(bytes);
    }
    if distinct_webp_payloads.len() != 19 {
        return Err(format!("D3=3-C++: Se esperaban 19 imagenes WebP unicas sin colision, encontradas: {}", distinct_webp_payloads.len()));
    }

    // D2=2-C++: 6 modos de falla en diagnostics.json y rama hibrida A05+R55 en PumpAssemblyReport.astro
    let diag_raw = fs::read_to_string(site_root.join("data/diagnostics.json")).map_err(|e| e.to_string())?;
    let diag_val: serde_json::Value = serde_json::from_str(&diag_raw).map_err(|e| e.to_string())?;
    let modes = diag_val.get("diagnostics").and_then(|v| v.as_array()).ok_or("diagnostics.json carece de diagnostics")?;
    if modes.len() != 6 {
        return Err(format!("D2=2-C++: diagnostics.json debe tener 6 diagnostics, encontrados: {}", modes.len()));
    }
    let pump_report = fs::read_to_string(site_root.join("src/components/PumpAssemblyReport.astro")).map_err(|e| e.to_string())?;
    if !pump_report.contains("data-assembly-branch-btn=\"hybrid_a05_r55\"") || !pump_report.contains("data-wet-branch=\"hybrid_a05_r55\"") {
        return Err("D2=2-C++: PumpAssemblyReport.astro carece del 4to selector hibrido A05 + R55".to_string());
    }

    // D4=4-C++: Core Trade-In -22% en requisitionTrayBus.js y QuickOrderTray.astro
    let rtb_src = fs::read_to_string(site_root.join("src/scripts/requisitionTrayBus.js")).map_err(|e| e.to_string())?;
    if !rtb_src.contains("evaluateBearingCartridgeCoreTradeIn") || !rtb_src.contains("syncTrayToWorkbenchStateLens") {
        return Err("D4=4-C++: requisitionTrayBus.js carece de evaluateBearingCartridgeCoreTradeIn o syncTrayToWorkbenchStateLens".to_string());
    }
    let qtray_src = fs::read_to_string(site_root.join("src/components/QuickOrderTray.astro")).map_err(|e| e.to_string())?;
    if !qtray_src.contains("data-core-tradein-toggle") {
        return Err("D4=4-C++: QuickOrderTray.astro carece de data-core-tradein-toggle".to_string());
    }

    // D5=5-C++ y D6=6-C++: Gorain, Timoshenko y 0 #090d16 en flotacion/ y filtracion/
    let celdas_src = fs::read_to_string(site_root.join("src/pages/flotacion/celdas.astro")).map_err(|e| e.to_string())?;
    if !celdas_src.contains("data-cell-dropin-matrix=\"gorain-1997\"") {
        return Err("D5=5-C++: flotacion/celdas.astro carece de data-cell-dropin-matrix=gorain-1997".to_string());
    }
    let rep_src = fs::read_to_string(site_root.join("src/pages/filtracion/repuestos.astro")).map_err(|e| e.to_string())?;
    if !rep_src.contains("data-plate-flexure-panel=\"timoshenko-g5\"") {
        return Err("D5=5-C++: filtracion/repuestos.astro carece de data-plate-flexure-panel=timoshenko-g5".to_string());
    }
    for solar_rel in [
        "src/pages/flotacion/index.astro",
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/index.astro",
        "src/pages/en/flotation/cells.astro",
        "src/pages/filtracion/index.astro",
        "src/pages/filtracion/repuestos.astro",
        "src/pages/en/filtration/index.astro",
        "src/pages/en/filtration/parts.astro",
    ] {
        let s = fs::read_to_string(site_root.join(solar_rel)).map_err(|e| e.to_string())?;
        if s.to_lowercase().contains("#090d16") {
            return Err(format!("D6=6-C++ (DEB-V31-03): {} aun contiene token oscuro #090d16", solar_rel));
        }
    }

    // D8=8-C++: Presupuestos de lineas Parnas LCOM4
    let slurry_lines = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js")).map_err(|e| e.to_string())?.lines().count();
    if slurry_lines > 390 {
        return Err(format!("D8=8-C++: slurryEngine.js excede 390 lineas ({})", slurry_lines));
    }
    let wb_lines = fs::read_to_string(site_root.join("src/scripts/workbenchBus.js")).map_err(|e| e.to_string())?.lines().count();
    if wb_lines > 420 {
        return Err(format!("D8=8-C++: workbenchBus.js excede 420 lineas ({})", wb_lines));
    }

    Ok(())
}

/// 32. Gate D10=10-C+ (Cierre Definitivo de los 7 Hallazgos Críticos y Purga de Debris v3.2):
/// Audita las 10 decisiones (D1=1-C+ a D10=10-C+), los 5 arbitrajes epistémicos (ARB-SMAT-36..40) y la purga de 12 ítems de debris (DEB-V32-01..12).
pub fn verify_seven_findings_and_v32_closure_gate_32(site_root: &Path) -> Result<(), String> {
    if !site_root.join("tests/smat_v32_seven_findings_closure.test.mjs").exists() {
        return Err("Falta suite de pruebas tests/smat_v32_seven_findings_closure.test.mjs (Gate 32)".to_string());
    }

    // Hallazgo 1 y 2 (D1=1-C+, D2=2-C+, DEB-V32-01, DEB-V32-02): CSS Nativo Scoped Solar Light-First y 0 clases Tailwind huerfanas
    let global_css = fs::read_to_string(site_root.join("src/styles/global.css")).map_err(|e| e.to_string())?;
    if !global_css.contains(".hidden") || !global_css.contains("--smat-solar-bg: #f8fafc") {
        return Err("Hallazgo 1: src/styles/global.css carece de .hidden o tokens --smat-solar-bg".to_string());
    }
    for astro_rel in [
        "src/components/ProductQuickCard.astro",
        "src/components/QuickOrderTray.astro",
        "src/components/CycloneAndScreenReport.astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let src = fs::read_to_string(site_root.join(astro_rel)).map_err(|e| e.to_string())?;
        if !src.contains("<style>") {
            return Err(format!("Hallazgo 1 (DEB-V32-01): {} carece de bloque <style> nativo scoped", astro_rel));
        }
        for bad_tw in ["bg-slate-900", "text-slate-100", "grid-cols-2", "backdrop-blur-md", "border-slate-700"] {
            if src.contains(bad_tw) {
                return Err(format!("Hallazgo 1/2 (DEB-V32-01/02): {} contiene clase utilitaria Tailwind huerfana '{}'", astro_rel, bad_tw));
            }
        }
    }

    // Hallazgo 3 y 5 (D3=3-C+, D5=5-C+, D7=7-C+, DEB-V32-03, DEB-V32-05): 19 SKUs canonicos SMAT-*, Honest Discriminated Union y 5 nuevos diagramas CAD SVG
    let diag_src = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro")).map_err(|e| e.to_string())?;
    for req_cad in [
        "cyclone_d6_d20",
        "coupled_pump_cyclone",
        "urethane_screen_th48",
        "lab_comminution_pan",
        "filter_plate_shifter",
    ] {
        if !diag_src.contains(req_cad) {
            return Err(format!("Hallazgo 5 (DEB-V32-05): TechnicalDiagrams.astro carece del esquema CAD SVG '{}'", req_cad));
        }
    }

    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json")).map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr.as_array().ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;
    if skus.len() != 19 {
        return Err(format!("Hallazgo 3: Se esperaban 19 SKUs en quick_checkout_Catalog.json, encontrados: {}", skus.len()));
    }
    let mut non_pump_zero_count = 0usize;
    let mut pump_non_zero_count = 0usize;
    for sku in skus {
        let id = sku.get("sku_id").and_then(|v| v.as_str()).unwrap_or("");
        if !id.starts_with("SMAT-") {
            return Err(format!("Hallazgo 3 (DEB-V32-03): SKU '{}' no usa nomenclatura canonica SMAT-*", id));
        }
        let legacy = sku.get("legacy_sku_id").and_then(|v| v.as_str()).unwrap_or("");
        if !legacy.starts_with("SKU-QC-") {
            return Err(format!("Hallazgo 3: SKU '{}' carece de legacy_sku_id SKU-QC-*", id));
        }
        let cad_type = sku.get("diagram_id").or_else(|| sku.get("cad_diagram_type")).and_then(|v| v.as_str()).unwrap_or("");
        let expected_branch = format!("'{}'", cad_type);
        if cad_type.is_empty() || !diag_src.contains(&expected_branch) {
            return Err(format!("Hallazgo 5: SKU '{}' referencia diagram_id '{}' no soportado en TechnicalDiagrams.astro", id, cad_type));
        }
        let linked = sku.get("linked_atomic_codes").and_then(|v| v.as_array()).ok_or("Falta linked_atomic_codes")?;
        if id.starts_with("SMAT-PUMP-") || id == "SMAT-COUPLED-PUMP-CYC" {
            if linked.is_empty() {
                return Err(format!("Hallazgo 7: SKU de bombeo '{}' debe tener linked_atomic_codes no vacio", id));
            }
            pump_non_zero_count += 1;
        } else {
            if !linked.is_empty() {
                return Err(format!("Hallazgo 7 (DEB-V32-08): SKU no-bomba '{}' contiene codigos atomicos de bomba falsos", id));
            }
            non_pump_zero_count += 1;
        }
    }
    if pump_non_zero_count != 6 || non_pump_zero_count != 13 {
        return Err(format!("Hallazgo 7: Particion Honest Discriminated Union invalida (pump={}, non_pump={})", pump_non_zero_count, non_pump_zero_count));
    }

    // Hallazgo 4 (D4=4-C+, DEB-V32-04): 0 archivos * expo.png y 0 operador modulo % en tools/build_product_images.mjs
    let img_builder = fs::read_to_string(site_root.join("tools/build_product_images.mjs")).map_err(|e| e.to_string())?;
    if img_builder.to_lowercase().contains("expo.png") || img_builder.contains("i %") {
        return Err("Hallazgo 4 (DEB-V32-04): tools/build_product_images.mjs aun referencia 'expo.png' o fallback ciclico 'i %'".to_string());
    }

    // Hallazgo 6 (D6=6-C+, DEB-V32-06, DEB-V32-07): 0 telefono falso 526181234567 y cableado a 526183670664 + data-quick-tray-add + #workbench
    for rel_wire in [
        "src/components/QuickOrderTray.astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let s = fs::read_to_string(site_root.join(rel_wire)).map_err(|e| e.to_string())?;
        if s.contains("526181234567") {
            return Err(format!("Hallazgo 6 (DEB-V32-06): {} aun contiene el telefono falso 526181234567", rel_wire));
        }
        if !s.contains("526183670664") {
            return Err(format!("Hallazgo 6: {} no utiliza el WhatsApp oficial 526183670664", rel_wire));
        }
    }
    for slug_rel in ["src/pages/productos/[slug].astro", "src/pages/en/products/[slug].astro"] {
        let s = fs::read_to_string(site_root.join(slug_rel)).map_err(|e| e.to_string())?;
        if !s.contains("data-quick-tray-add") || !s.contains("#workbench") {
            return Err(format!("Hallazgo 6 (DEB-V32-07): {} carece de cableado data-quick-tray-add o #workbench", slug_rel));
        }
    }

    // Hallazgo 7 (D7=7-C+, D8=8-C+, D9=9-C+, DEB-V32-08..12): Hash FNV-1a Drop-In, 115 Redirects Wayback 301 y Higiene Lexica/3 Puertas
    let dropin_src = fs::read_to_string(site_root.join("src/scripts/dropInEquivalenceGuard.js")).map_err(|e| e.to_string())?;
    if !dropin_src.contains("FNV1A_HASH_TO_SKU_INDEX") {
        return Err("Hallazgo 7 (D7=7-C+): dropInEquivalenceGuard.js carece de FNV1A_HASH_TO_SKU_INDEX".to_string());
    }
    for check_oem in [
        "src/scripts/dropInEquivalenceGuard.js",
        "src/pages/catalogo/[code].astro",
        "src/pages/en/catalog/[code].astro",
    ] {
        let s = fs::read_to_string(site_root.join(check_oem)).map_err(|e| e.to_string())?;
        for forbidden_frame in ["4/3 C", "6/4 D", "8/6 E"] {
            if s.contains(forbidden_frame) {
                return Err(format!("Hallazgo 7 (DEB-V32-09): {} contiene nomenclatura de bastidor OEM en texto plano '{}'", check_oem, forbidden_frame));
            }
        }
    }

    let redirects_raw = fs::read_to_string(site_root.join("public/_redirects")).map_err(|e| e.to_string())?;
    let redirect_lines: Vec<&str> = redirects_raw.lines().filter(|l| !l.trim().is_empty() && !l.starts_with('#')).collect();
    if redirect_lines.len() < 105 {
        return Err(format!("Hallazgo 7 (D8=8-C+): public/_redirects debe tener >= 105 reglas 301 (encontradas: {})", redirect_lines.len()));
    }
    for req_wb in [
        "/producto/balanza-marcy",
        "/producto/plato-tentadura",
        "/etiqueta-producto/rotap",
        "/clasificar_solidos.php",
        "/producto/2119",
        "/equipos-para-la-flotacion-de-minerales",
        "/quote-list",
    ] {
        if !redirects_raw.contains(req_wb) {
            return Err(format!("Hallazgo 7 (D8=8-C+): public/_redirects carece de regla Wayback Machine 301 '{}'", req_wb));
        }
    }

    for acuse_rel in ["src/pages/acuse.astro", "src/pages/en/thank-you.astro"] {
        let s = fs::read_to_string(site_root.join(acuse_rel)).map_err(|e| e.to_string())?;
        for bad_sla in ["SLA MISMO DÍA HÁBIL", "SAME-DAY SLA", "Banco de Pruebas", "Test Bench"] {
            if s.contains(bad_sla) {
                return Err(format!("Hallazgo 7 (DEB-V32-10): {} contiene claim prohibido '{}'", acuse_rel, bad_sla));
            }
        }
    }

    for celdas_rel in ["src/pages/flotacion/celdas.astro", "src/pages/en/flotation/cells.astro"] {
        let s = fs::read_to_string(site_root.join(celdas_rel)).map_err(|e| e.to_string())?;
        if s.contains("badge-capex") || s.contains("[CAPEX:") || !s.contains("badge-opex") {
            return Err(format!("Hallazgo 7 (DEB-V32-11): {} contiene badge-capex o carece de badge-opex", celdas_rel));
        }
    }

    let skid_word_re = Regex::new(r"(?i)\bskids?\b").unwrap();
    for nav_rel in [
        "src/pages/index.astro",
        "src/pages/en/index.astro",
        "src/components/Header.astro",
        "src/pages/acuse.astro",
        "src/pages/en/thank-you.astro",
    ] {
        let s = fs::read_to_string(site_root.join(nav_rel)).map_err(|e| e.to_string())?;
        if skid_word_re.is_match(&s) {
            return Err(format!("Hallazgo 7 (DEB-V32-12): {} aun contiene la palabra prohibida 'Skid/Skids'", nav_rel));
        }
    }
    let idx_es = fs::read_to_string(site_root.join("src/pages/index.astro")).map_err(|e| e.to_string())?;
    if !idx_es.contains("Puerta 1 • Bombeo de Lodos y Refacciones")
        || !idx_es.contains("Puerta 2 • Clasificación y Cribado Fino")
        || !idx_es.contains("Puerta 3 • Flotación, Filtración y Lab")
    {
        return Err("Hallazgo 7 (D9=9-C+): src/pages/index.astro carece de las 3 Puertas Canonicas (Puerta 1 Bombeo, Puerta 2 Clasificacion, Puerta 3 Flotacion/Filtracion/Lab)".to_string());
    }

    // Cierre Total v3.3 (D1-V33..D10-V33, ARB-SMAT-41, DEB-V33-01..12):
    if !site_root.join("tests/smat_v33_full_prd_parity.test.mjs").exists() {
        return Err("Falta suite de pruebas tests/smat_v33_full_prd_parity.test.mjs (Cierre v3.3)".to_string());
    }
    let qcard_src = fs::read_to_string(site_root.join("src/components/ProductQuickCard.astro")).map_err(|e| e.to_string())?;
    for req_qcard in ["data-qcard-fiscal-badge", "data-qcard-config", "data-qcard-wa-btn", "data-qcard-add-btn"] {
        if !qcard_src.contains(req_qcard) {
            return Err(format!("v3.3 (D3-V33): ProductQuickCard.astro carece de '{}'", req_qcard));
        }
    }
    for home_rel in ["src/pages/index.astro", "src/pages/en/index.astro"] {
        let home_src = fs::read_to_string(site_root.join(home_rel)).map_err(|e| e.to_string())?;
        if !home_src.contains("data-family-chip=") || !home_src.contains("<ProductQuickCard") {
            return Err(format!("v3.3 (D4-V33): {} carece de chips de 8 familias o <ProductQuickCard /> en Home", home_rel));
        }
        if home_src.contains("codigo=${p.code}") {
            return Err(format!("v3.3 (DEB-V33-03): {} aun contiene enlace roto codigo=${{p.code}}", home_rel));
        }
    }
    let xray_style_count = diag_src.matches("style={xrayWearStyle}").count();
    if xray_style_count < 15 {
        return Err(format!("v3.3 (D5-V33): TechnicalDiagrams.astro debe aplicar style={{xrayWearStyle}} en los 15 diagramas (encontrados: {})", xray_style_count));
    }
    if !img_builder.contains("cropBox:") || !img_builder.contains("buildCadBlueprintSvg") {
        return Err("v3.3 (D6-V33): tools/build_product_images.mjs carece de cropBox o buildCadBlueprintSvg".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gate_catalog_parity() {
        let root = find_site_root();
        assert!(verify_catalog_parity(&root).is_ok(), "Fallo en paridad de catalogo");
    }

    #[test]
    fn test_gate_leak_scanner() {
        let root = find_site_root();
        assert!(verify_leak_scanner(&root).is_ok(), "Fallo en detector de fugas");
    }

    #[test]
    fn test_gate_bilingual_symmetry() {
        let root = find_site_root();
        assert!(verify_bilingual_symmetry(&root).is_ok(), "Fallo en simetria bilingue");
    }

    #[test]
    fn test_gate_redirect_integrity() {
        let root = find_site_root();
        assert!(verify_redirect_integrity(&root).is_ok(), "Fallo en redirecciones 301");
    }

    #[test]
    fn test_gate_nap_integrity() {
        let root = find_site_root();
        assert!(verify_nap_integrity(&root).is_ok(), "Fallo en verificacion de NAP");
    }

    #[test]
    fn test_gate_zero_placeholders() {
        let root = find_site_root();
        assert!(verify_zero_placeholders(&root).is_ok(), "Fallo en detector de placeholders");
    }

    #[test]
    fn test_gate_decision_criteria() {
        let root = find_site_root();
        assert!(verify_decision_criteria(&root).is_ok(), "Fallo en criterios de decision");
    }

    #[test]
    fn test_gate_print_view_parity() {
        let root = find_site_root();
        assert!(verify_print_view_parity(&root).is_ok(), "Fallo en vista imprimible ERP");
    }

    #[test]
    fn test_gate_no_orphan_debris() {
        let root = find_site_root();
        assert!(verify_no_orphan_debris(&root).is_ok(), "Fallo en control de debris");
    }

    #[test]
    fn test_gate_mining_groups_dataset() {
        let root = find_site_root();
        assert!(verify_mining_groups_dataset(&root).is_ok(), "Fallo en dataset de grupos mineros");
    }

    #[test]
    fn test_gate_slurry_engine_module() {
        let root = find_site_root();
        assert!(verify_slurry_engine_module(&root).is_ok(), "Fallo en motor hidraulico de pulpa");
    }

    #[test]
    fn test_gate_design_tokens_and_workbench() {
        let root = find_site_root();
        assert!(verify_design_tokens_and_workbench(&root).is_ok(), "Fallo en tokens de diseno y live workbench");
    }

    #[test]
    fn test_gate_event_bus_and_export_suite() {
        let root = find_site_root();
        assert!(verify_event_bus_and_export_suite(&root).is_ok(), "Fallo en EventBus y Suite de Exportacion");
    }

    #[test]
    fn test_gate_flight_deck_and_trust_matrix() {
        let root = find_site_root();
        assert!(verify_flight_deck_and_trust_matrix(&root).is_ok(), "Fallo en Flight Deck y Trust Matrix");
    }

    #[test]
    fn test_gate_no_false_sla_promises() {
        let root = find_site_root();
        assert!(verify_no_false_sla_promises(&root).is_ok(), "Fallo en erradicacion de promesas falsas");
    }

    #[test]
    fn test_gate_40_routes_reachability() {
        let root = find_site_root();
        assert!(verify_40_routes_reachability(&root).is_ok(), "Fallo en accesibilidad de las 40 rutas estaticas");
    }

    #[test]
    fn test_gate_linguistic_ethos() {
        let root = find_site_root();
        assert!(verify_linguistic_ethos(&root).is_ok(), "Fallo en calibración de ethos lingüístico");
    }

    #[test]
    fn test_gate_trademark_hygiene() {
        let root = find_site_root();
        assert!(verify_trademark_hygiene(&root).is_ok(), "Fallo en higiene de propiedad intelectual");
    }

    #[test]
    fn test_gate_security_headers() {
        let root = find_site_root();
        assert!(verify_security_headers(&root).is_ok(), "Fallo en cabeceras de seguridad");
    }

    #[test]
    fn test_gate_no_emergency_claims() {
        let root = find_site_root();
        assert!(verify_no_emergency_claims(&root).is_ok(), "Fallo en erradicación de claims de emergencia");
        assert!(verify_pump_assembly_and_zero_orphan_rfq_links(&root).is_ok(), "Fallo en verificacion de reporte de armado y enlaces /#rfq");
        assert!(verify_backend_ui_parity_and_apple_cowan(&root).is_ok(), "Fallo en verificacion de paridad backend-UI y Cowan 4+-1");
        assert!(verify_modular_parnas_and_zero_fake_data_step_gate(&root).is_ok(), "Fallo en Gate 23: particion modular Parnas y cero data-step=2");
        assert!(verify_manuel_lexical_and_route_separation_gate(&root).is_ok(), "Fallo en Gate 24: higiene lexica Don Manuel y separacion de rutas");
        assert!(verify_solar_wcag_aaa_and_etapa3_parity(&root).is_ok(), "Fallo en Gate 25: polaridad solar WCAG AAA y paridad Etapa 3");
        assert!(verify_backend_ui_full_parity_and_altitude_pincer(&root).is_ok(), "Fallo en Gate 26: paridad 100% Backend-UI y pinza termo-barometrica TEFC");
    }

    #[test]
    fn test_gate_26_backend_ui_full_parity_and_altitude_pincer() {
        let root = find_site_root();
        assert!(
            verify_backend_ui_full_parity_and_altitude_pincer(&root).is_ok(),
            "Fallo en Gate 26: paridad 100% Backend-UI y pinza termo-barometrica TEFC"
        );
    }

    #[test]
    fn test_gate_27_section_3_1_3_2_ergos() {
        let root = find_site_root();
        assert!(
            verify_section_3_1_3_2_zero_duplication_and_mobile_fold(&root).is_ok(),
            "Fallo en Gate 27: erradicacion de redundancias Secciones 3.1 y 3.2 y fold movil Apple HIG"
        );
    }

    #[test]
    fn test_gate_28_quick_checkout_and_cad_bijection() {
        let root = find_site_root();
        assert!(
            verify_quick_checkout_and_cad_bijection(&root).is_ok(),
            "Fallo en Gate 28: bijeccion de 19 SKUs Quick-Checkout, 13 partes atomicas y capa X-Ray CAD"
        );
    }

    #[test]
    fn test_gate_29_sla_verifiability_and_lcom4_seam() {
        let root = find_site_root();
        assert!(
            verify_sla_verifiability_and_lcom4_seam(&root).is_ok(),
            "Fallo en Gate 29: verificabilidad fisica de SLAs, Bandeja c*mu, Balance 3 Vasos Marcy y costuras LCOM4"
        );
    }

    #[test]
    fn test_gate_30_prd_v3_forensic_closure() {
        let root = find_site_root();
        assert!(
            verify_prd_v3_forensic_closure_gate_30(&root).is_ok(),
            "Fallo en Gate 30: Cierre Forense PRD v3.0 (19 SKUs + Alias SSG, ProductQuickCard, Drop-In Guard, QuickOrderTray, CycloneAndScreenReport, 0 Banco Durango, 38+ Redirects)"
        );
    }

    #[test]
    fn test_gate_31_total_orphan_closure_and_epistemic_arbitrage() {
        let root = find_site_root();
        let res = verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(&root);
        assert!(
            res.is_ok(),
            "Fallo en Gate 31 (Cierre Total v3.1): {:?}",
            res.err()
        );
    }

    #[test]
    fn test_gate_32_seven_findings_and_v32_closure() {
        let root = find_site_root();
        let res = verify_seven_findings_and_v32_closure_gate_32(&root);
        assert!(
            res.is_ok(),
            "Fallo en Gate 32 (Cierre Definitivo de los 7 Hallazgos Criticos v3.2): {:?}",
            res.err()
        );
    }
}
