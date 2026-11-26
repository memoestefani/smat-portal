use regex::Regex;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Invariante 1: Paridad y validez estructural de catalogos SSOT en `data/` sin debris ni interpolacion cruda.
pub fn verify_catalog_and_ssot_parity(site_root: &Path) -> Result<(), String> {
    let required_json = [
        "data/roles.json",
        "data/company.json",
        "data/atomic_parts.json",
        "data/quick_checkout_Catalog.json",
        "data/mining_groups.json",
    ];
    for rel in required_json {
        let p = site_root.join(rel);
        if !p.exists() {
            return Err(format!("Falta archivo SSOT requerido: {}", rel));
        }
        let raw = fs::read_to_string(&p).map_err(|e| format!("Error leyendo {}: {}", rel, e))?;
        let _: serde_json::Value =
            serde_json::from_str(&raw).map_err(|e| format!("JSON invalido en {}: {}", rel, e))?;
    }

    if site_root.join("data/roles.copy.json").exists() {
        return Err("Debris detectado: data/roles.copy.json debe permanecer eliminado".to_string());
    }

    verify_v80_media_gallery_spec_zero_oem(site_root)?;
    verify_v100_almacen_reuse_cap(site_root)?;

    for rel in [
        "src/components/Footer.astro",
        "src/components/LiveEngineeringDossier.astro",
    ] {
        let p = site_root.join(rel);
        if p.exists() {
            let content = fs::read_to_string(&p).map_err(|e| e.to_string())?;
            if content.contains("companyData.contact.phones[0]}")
                || content.contains("companyData.contact.phones[1]}")
                || content.contains("companyData.contact.emails[0]}")
                || content.contains("companyData.contact.emails[1]}")
            {
                return Err(format!("Interpolacion de objeto crudo [object Object] en {}", rel));
            }
        }
    }

    Ok(())
}

/// Invariante 2: Escaneo anti-fugas de precios comerciales, margenes, secretos bancarios y placeholders.
pub fn verify_leak_scanner_and_zero_placeholders(site_root: &Path) -> Result<(), String> {
    let price_re =
        Regex::new(r"(\$\s*[0-9]+(\.[0-9]{2})?|\b(USD|MXN)\s*[0-9]+([.,][0-9]+)?)").unwrap();
    let margin_re = Regex::new(r"(?i)margen\s*[:=]\s*[0-9]+%?").unwrap();
    let secret_words = ["Cuenta BBVA", "CLABE", "saldo bancario", "factura proveedor"];
    let bad_placeholders = [
        "lorem ipsum",
        "dolor sit amet",
        "TODO:",
        "FIXME:",
        "temp_placeholder",
        "mockup_image",
    ];

    for dir in ["data", "public", "src"] {
        let dir_path = site_root.join(dir);
        if !dir_path.exists() {
            continue;
        }
        for entry in WalkDir::new(dir_path).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() {
                continue;
            }
            let ext = entry
                .path()
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            if !["json", "astro", "ts", "js", "html", "md"].contains(&ext) {
                continue;
            }
            let content = fs::read_to_string(entry.path()).unwrap_or_default();
            if price_re.is_match(&content) {
                return Err(format!("Fuga de precio detectada en {}", entry.path().display()));
            }
            if margin_re.is_match(&content) {
                return Err(format!("Fuga de margen detectada en {}", entry.path().display()));
            }
            for secret in secret_words {
                if content.contains(secret) {
                    return Err(format!("Secreto '{}' detectado en {}", secret, entry.path().display()));
                }
            }
            let lower = content.to_lowercase();
            for bad in bad_placeholders {
                if lower.contains(&bad.to_lowercase()) {
                    return Err(format!(
                        "Placeholder '{}' detectado en {}",
                        bad,
                        entry.path().display()
                    ));
                }
            }
        }
    }

    Ok(())
}

/// Invariante 3: Cabeceras Cloudflare Pages, identidad NAP Durango y cero SLAs falsos.
pub fn verify_security_headers_nap_and_honest_sla(site_root: &Path) -> Result<(), String> {
    let headers_path = site_root.join("public/_headers");
    if !headers_path.exists() {
        return Err("Falta public/_headers".to_string());
    }
    let headers = fs::read_to_string(&headers_path).map_err(|e| e.to_string())?;
    if !headers.contains("X-Frame-Options: DENY") || !headers.contains("X-Content-Type-Options: nosniff") {
        return Err("public/_headers debe declarar X-Frame-Options: DENY y nosniff".to_string());
    }

    let comp_raw = fs::read_to_string(site_root.join("data/company.json")).map_err(|e| e.to_string())?;
    let comp_val: serde_json::Value = serde_json::from_str(&comp_raw).map_err(|e| e.to_string())?;
    let street = comp_val["address"]["street"].as_str().unwrap_or("");
    let city = comp_val["address"]["city"].as_str().unwrap_or("");
    let phone0 = comp_val["contact"]["phones"][0]["display"].as_str().unwrap_or("");
    let email0 = comp_val["contact"]["emails"][0]["address"].as_str().unwrap_or("");

    if !street.contains("Mariano Salas")
        || !city.contains("Durango")
        || !phone0.contains("618")
        || !email0.contains("smatminerals.com")
    {
        return Err("NAP inconsistente respecto a Mariano Salas #114, Durango (618)".to_string());
    }

    let false_sla_re = Regex::new(r"(?i)\b45\s*min(utos|utes)?\b").unwrap();
    for entry in WalkDir::new(site_root.join("src")).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
            if ["astro", "js", "ts"].contains(&ext) {
                let text = fs::read_to_string(entry.path()).unwrap_or_default();
                if false_sla_re.is_match(&text) {
                    return Err(format!(
                        "Promesa SLA falsa ('45 min') detectada en {}",
                        entry.path().display()
                    ));
                }
                let rel_norm = entry.path().to_string_lossy().replace('\\', "/");
                if let Some(bad_v57) = find_v57_prohibited_copy_in_source(&rel_norm, &text) {
                    return Err(format!(
                        "Token V5.7 prohibido '{}' detectado en {}",
                        bad_v57,
                        entry.path().display()
                    ));
                }
                if let Some(bad_v60) = find_v60_prohibited_commercial_copy(&rel_norm, &text) {
                    return Err(format!(
                        "Copy interno V6.0 prohibido '{}' detectado en {}",
                        bad_v60,
                        entry.path().display()
                    ));
                }
                if let Some(bad_sla) = find_v90_prohibited_sla_copy(&text) {
                    return Err(format!(
                        "SLA inflado V9.0 prohibido '{}' detectado en {}",
                        bad_sla,
                        entry.path().display()
                    ));
                }
            }
        }
    }

    verify_v58_en_dist_leaks(site_root)?;
    verify_v59_storage_whitelist_and_material_purity(site_root)?;

    Ok(())
}

/// Invariante V5.9: máximo 3 llaves permitidas en `localStorage.setItem`, sin lecturas legadas ni hardcode >=650 HB en Flotación.
pub fn verify_v59_storage_whitelist_and_material_purity(site_root: &Path) -> Result<(), String> {
    let scripts_dir = site_root.join("src/scripts");
    if scripts_dir.is_dir() {
        for entry in fs::read_dir(&scripts_dir).map_err(|e| e.to_string())?.flatten() {
            let p = entry.path();
            if p.extension().and_then(|s| s.to_str()) == Some("js") {
                let text = fs::read_to_string(&p).unwrap_or_default();
                let fname = p.file_name().unwrap_or_default().to_string_lossy();
                find_v59_disallowed_storage_write(&fname, &text)?;
            }
        }
    }
    let resolver_path = scripts_dir.join("domainMaterialSpecResolver.js");
    if !resolver_path.exists() {
        return Err("Falta domainMaterialSpecResolver.js para aislamiento material por circuito".to_string());
    }
    let header_src = fs::read_to_string(site_root.join("src/components/Header.astro")).unwrap_or_default();
    if header_src.contains("smat_requisition_tray_v3") {
        return Err("Header.astro no debe conservar lectura legada smat_requisition_tray_v3".to_string());
    }
    Ok(())
}

pub fn find_v59_disallowed_storage_write(fname: &str, js_text: &str) -> Result<(), String> {
    let re = Regex::new(r#"localStorage\??\.setItem\(\s*['"`]([^'"`]+)['"`]"#).unwrap();
    let allowed = ["smat_rfq_session_v3", "smat_locale_pref", "smat_lead_outbox_v1"];
    for cap in re.captures_iter(js_text) {
        if let Some(m) = cap.get(1) {
            let key = m.as_str();
            if !allowed.contains(&key) {
                return Err(format!("Llave localStorage V5.9 no autorizada '{}' en {}", key, fname));
            }
        }
    }
    Ok(())
}

/// Invariante V5.8: bloquea fugas monolingües ES y placeholders en `dist/en/**/*.html`.
pub fn verify_v58_en_dist_leaks(site_root: &Path) -> Result<(), String> {
    let dist_en = site_root.join("dist/en");
    if !dist_en.is_dir() {
        return Ok(());
    }
    for entry in WalkDir::new(&dist_en).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file()
            && entry.path().extension().and_then(|s| s.to_str()) == Some("html")
        {
            let html = fs::read_to_string(entry.path()).unwrap_or_default();
            if let Some(leak) = find_v58_en_leak_in_html(&html) {
                return Err(format!(
                    "Fuga V5.8 '{}' detectada en {}",
                    leak,
                    entry.path().display()
                ));
            }
        }
    }
    Ok(())
}

pub fn find_v58_en_leak_in_html(html: &str) -> Option<&'static str> {
    for forbidden in ["30 HP a 250 HP", "15 HP a 60 HP", "P1-PARO-PLANTA", "PARO DE LÍNEA"] {
        if html.contains(forbidden) {
            return Some(forbidden);
        }
    }
    None
}

/// Audita cadenas editoriales/tipográficas prohibidas en `src/` bajo SMAT V5.7.
pub fn find_v57_prohibited_copy_in_source(rel_norm: &str, text: &str) -> Option<&'static str> {
    if rel_norm.ends_with(".astro") || rel_norm.ends_with(".js") || rel_norm.ends_with(".ts") {
        for forbidden in [
            "EN STOCK DURANGO",
            "Foto Real Cero-OEM",
            "Zero-OEM Real Photo",
            "I04 (Equipo de cómputo",
        ] {
            if text.contains(forbidden) {
                return Some(forbidden);
            }
        }
    }
    if rel_norm.contains("components/cores/") && rel_norm.ends_with(".astro") {
        for ascii_exp in ["s^-1", "min^-1"] {
            if text.contains(ascii_exp) {
                return Some(ascii_exp);
            }
        }
    }
    None
}

/// Audita copy interno / técnico V6.0 y V7.0 prohibido en las vistas orientadas al comprador.
pub fn find_v60_prohibited_commercial_copy(rel_norm: &str, text: &str) -> Option<&'static str> {
    let target_files = [
        "ProductQuickCard.astro",
        "ProductDetailIsland.astro",
        "HomeLandingIsland.astro",
        "CatalogFacetedIsland.astro",
        "contacto.astro",
        "contact.astro",
        "QuoteWizard.astro",
        "DiagnosticsHub.astro",
        "nosotros.astro",
        "about.astro",
    ];
    if target_files.iter().any(|f| rel_norm.ends_with(f)) {
        for forbidden in [
            "Foto Studio 100%",
            "Catálogo Oficial · SMAT",
            "Simulador Durand",
            "Durand Simulator",
            "Paso 01: Elige por código",
            "Puerta 1",
            "Puerta 2",
            "Puerta 3",
            "7 Avenidas",
            "Catálogo Omnicanal",
            "Raíz normalizada",
            "Operación JRP",
            "Rama D",
        ] {
            if text.contains(forbidden) {
                return Some(forbidden);
            }
        }
    }
    None
}

/// Invariante V8.0: Valida `data/media_gallery_spec.json` y rechaza marcas OEM/chatarra.
pub fn verify_v80_media_gallery_spec_zero_oem(site_root: &Path) -> Result<(), String> {
    let spec_path = site_root.join("data/media_gallery_spec.json");
    if !spec_path.exists() {
        return Err("Falta data/media_gallery_spec.json V8.0".to_string());
    }
    let raw = fs::read_to_string(&spec_path)
        .map_err(|e| format!("Error leyendo data/media_gallery_spec.json: {}", e))?;
    let _: serde_json::Value = serde_json::from_str(&raw)
        .map_err(|e| format!("JSON invalido en data/media_gallery_spec.json: {}", e))?;
    if let Some(oem) = find_v80_oem_brand_in_spec(&raw) {
        return Err(format!(
            "Marca OEM o basura prohibida '{}' en data/media_gallery_spec.json",
            oem
        ));
    }
    Ok(())
}

pub fn find_v90_prohibited_sla_copy(text: &str) -> Option<&'static str> {
    let lower = text.to_ascii_lowercase();
    for forbidden in [
        "24-48h",
        "24–48 h",
        "24-48 h",
        "24–48h",
        "metalurgia de fundición oem",
        "oem foundry metallurgy",
    ] {
        if lower.contains(forbidden) {
            return Some(forbidden);
        }
    }
    None
}

pub fn find_v80_oem_brand_in_spec(raw: &str) -> Option<&'static str> {
    let lower = raw.to_ascii_lowercase();
    for tok in [
        "warman",
        "safematic",
        "tyler",
        "ro-tap",
        "ro tap",
        "metso",
        "ruite",
        "longteng",
        "xkjgroup",
        "copilot_2026",
        "shibo",
        "pinnxun",
        "allpumpscn",
        "029a05",
    ] {
        if lower.contains(tok) {
            return Some(tok);
        }
    }
    None
}

pub fn check_almacen_reuse_cap_entries(pairs: &[(&str, &str)], max_uses: usize) -> Result<(), String> {
    use std::collections::{HashMap, HashSet};
    let mut by_img: HashMap<&str, HashSet<&str>> = HashMap::new();
    for &(route_family, img) in pairs {
        by_img.entry(img).or_default().insert(route_family);
    }
    for (img, routes) in by_img {
        if routes.len() > max_uses {
            return Err(format!(
                "Reciclaje excesivo de foto de almacen '{}' en {} familias (> {}): {:?}",
                img,
                routes.len(),
                max_uses,
                routes
            ));
        }
    }
    Ok(())
}

pub fn verify_v100_almacen_reuse_cap(site_root: &Path) -> Result<(), String> {
    let re_img = Regex::new(r"/images/almacen/[a-z0-9\-]+\.webp").unwrap();
    let sources: &[(&str, &str)] = &[
        ("home", "src/components/islands/HomeLandingIsland.astro"),
        ("cotizar", "src/components/QuoteWizard.astro"),
        ("contacto", "src/pages/contacto.astro"),
        ("contacto", "src/pages/en/contact.astro"),
        ("cumplimiento", "src/pages/cumplimiento.astro"),
        ("cumplimiento", "src/pages/en/compliance.astro"),
        ("garantia", "src/pages/garantia.astro"),
        ("garantia", "src/pages/en/warranty.astro"),
        ("nosotros", "src/pages/nosotros.astro"),
        ("nosotros", "src/pages/en/about.astro"),
    ];
    let mut pairs_owned: Vec<(&str, String)> = Vec::new();
    for &(family, rel) in sources {
        let p = site_root.join(rel);
        if !p.exists() {
            continue;
        }
        let content = fs::read_to_string(&p).map_err(|e| e.to_string())?;
        for m in re_img.find_iter(&content) {
            pairs_owned.push((family, m.as_str().to_string()));
        }
    }
    let pairs: Vec<(&str, &str)> = pairs_owned.iter().map(|(f, s)| (*f, s.as_str())).collect();
    check_almacen_reuse_cap_entries(&pairs, 2)
}

/// Auditoría pura V10.0 sobre HTML compilado ES vs EN y estado vacío honesto de `/acuse/`.
pub fn find_v100_es_purity_leak_in_html(html: &str) -> Option<&'static str> {
    for forbidden in ["Class III Type A", "Piezas Atómicas", "Piezas Atomicas"] {
        if html.contains(forbidden) {
            return Some(forbidden);
        }
    }
    None
}

pub fn find_v100_empty_acuse_leak_in_html(html: &str) -> Option<&'static str> {
    for forbidden in ["DESPACHO PRIORITARIO", "FOLIO: SMAT-2026-RFQ"] {
        if html.contains(forbidden) {
            return Some(forbidden);
        }
    }
    None
}

/// Verifica en `dist/`:
///   1. Cero `Class III Type A` ni `Piezas Atómicas` en rutas ES (`dist/` excluyendo `dist/en/`).
///   2. Cero `DESPACHO PRIORITARIO` o `FOLIO: SMAT-2026-RFQ` en SSR vacío de `/acuse/` y `/en/thank-you/`.
pub fn verify_v100_es_purity_and_empty_acuse(site_root: &Path) -> Result<(), String> {
    let dist_dir = site_root.join("dist");
    if !dist_dir.is_dir() {
        return Ok(());
    }
    let dist_en_dir = dist_dir.join("en");
    for entry in WalkDir::new(&dist_dir).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        if entry.path().extension().and_then(|s| s.to_str()) != Some("html") {
            continue;
        }
        if entry.path().starts_with(&dist_en_dir) {
            continue;
        }
        let html = fs::read_to_string(entry.path()).unwrap_or_default();
        if let Some(leak) = find_v100_es_purity_leak_in_html(&html) {
            return Err(format!(
                "Fuga bilingüe V10.0 '{}' detectada en ruta ES {}",
                leak,
                entry.path().display()
            ));
        }
    }
    for acuse_rel in ["dist/acuse/index.html", "dist/en/thank-you/index.html"] {
        let acuse_path = site_root.join(acuse_rel);
        if !acuse_path.exists() {
            continue;
        }
        let acuse_html = fs::read_to_string(&acuse_path).unwrap_or_default();
        if let Some(leak) = find_v100_empty_acuse_leak_in_html(&acuse_html) {
            return Err(format!(
                "Fuga EMPTY_CART_GATE V10.0 '{}' detectada en {}",
                leak,
                acuse_rel
            ));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        check_almacen_reuse_cap_entries,
        find_v100_empty_acuse_leak_in_html,
        find_v100_es_purity_leak_in_html,
        find_v57_prohibited_copy_in_source,
        find_v58_en_leak_in_html,
        find_v59_disallowed_storage_write,
        find_v60_prohibited_commercial_copy,
        find_v80_oem_brand_in_spec,
    };

    #[test]
    fn rejects_v100_es_anglicisms_and_empty_acuse_leaks() {
        assert_eq!(
            find_v100_es_purity_leak_in_html("<span>ASTM A532 Class III Type A</span>"),
            Some("Class III Type A")
        );
        assert_eq!(
            find_v100_es_purity_leak_in_html("<h2>13 Piezas Atómicas</h2>"),
            Some("Piezas Atómicas")
        );
        assert_eq!(
            find_v100_es_purity_leak_in_html("<span>ASTM A532 Clase III Tipo A • Refacciones por Código</span>"),
            None
        );
        assert_eq!(
            find_v100_empty_acuse_leak_in_html("<span>DESPACHO PRIORITARIO ALMACÉN DURANGO</span>"),
            Some("DESPACHO PRIORITARIO")
        );
        assert_eq!(
            find_v100_empty_acuse_leak_in_html("<pre>FOLIO: SMAT-2026-RFQ</pre>"),
            Some("FOLIO: SMAT-2026-RFQ")
        );
        assert_eq!(
            find_v100_empty_acuse_leak_in_html("<h1>Aún no has generado una requisición</h1>"),
            None
        );
    }

    #[test]
    fn enforces_v100_almacen_reuse_cap() {
        assert!(check_almacen_reuse_cap_entries(
            &[("home", "/images/almacen/a.webp"), ("nosotros", "/images/almacen/a.webp")],
            2
        ).is_ok());
        assert!(check_almacen_reuse_cap_entries(
            &[
                ("home", "/images/almacen/a.webp"),
                ("nosotros", "/images/almacen/a.webp"),
                ("cotizar", "/images/almacen/a.webp")
            ],
            2
        ).is_err());
    }

    #[test]
    fn rejects_v80_oem_brands_in_media_gallery_spec() {
        assert_eq!(find_v80_oem_brand_in_spec(r#"{"caption":"Warman AH"}"#), Some("warman"));
        assert_eq!(find_v80_oem_brand_in_spec(r#"{"caption":"SHIBO crusher"}"#), Some("shibo"));
        assert_eq!(find_v80_oem_brand_in_spec(r#"{"src":"E029A05.jpg"}"#), Some("029a05"));
        assert_eq!(find_v80_oem_brand_in_spec(r#"{"src":"Copilot_20260412.png"}"#), Some("copilot_2026"));
        assert_eq!(find_v80_oem_brand_in_spec(r#"{"src":"almacen-bomba-6x4-dah.webp"}"#), None);
    }

    #[test]
    fn detects_v57_prohibited_copy_and_ascii_exponents() {
        assert_eq!(
            find_v57_prohibited_copy_in_source("src/components/ProductQuickCard.astro", "EN STOCK DURANGO (24-72 h)"),
            Some("EN STOCK DURANGO")
        );
        assert_eq!(
            find_v57_prohibited_copy_in_source("src/components/cores/FlotationCore.astro", "<span>56.3 s^-1</span>"),
            Some("s^-1")
        );
        assert_eq!(
            find_v57_prohibited_copy_in_source("src/components/cores/FlotationCore.astro", "<span>56.3 s⁻¹</span>"),
            None
        );
    }

    #[test]
    fn detects_v58_en_monolingual_leaks() {
        assert_eq!(find_v58_en_leak_in_html("<div>30 HP a 250 HP</div>"), Some("30 HP a 250 HP"));
        assert_eq!(find_v58_en_leak_in_html("<span>P1-PARO-PLANTA</span>"), Some("P1-PARO-PLANTA"));
        assert_eq!(find_v58_en_leak_in_html("<span>P1-LINE-STOP • 30 HP to 250 HP</span>"), None);
    }

    #[test]
    fn allows_only_whitelisted_v59_localstorage_keys() {
        assert!(find_v59_disallowed_storage_write("rfqSessionStore.js", "ls.setItem('smat_rfq_session_v3', '{}')").is_ok());
        assert!(find_v59_disallowed_storage_write("workbenchBus.js", "localStorage.setItem('smat_workbench_state_v2', '{}')").is_err());
    }

    #[test]
    fn rejects_v60_internal_jargon_in_buyer_views() {
        assert_eq!(
            find_v60_prohibited_commercial_copy("src/components/ProductQuickCard.astro", "Foto Studio 100%"),
            Some("Foto Studio 100%")
        );
        assert_eq!(
            find_v60_prohibited_commercial_copy("src/pages/contacto.astro", "Simulador Durand"),
            Some("Simulador Durand")
        );
        assert_eq!(
            find_v60_prohibited_commercial_copy("src/pages/contacto.astro", "Asesoría técnica en selección"),
            None
        );
        assert_eq!(
            find_v60_prohibited_commercial_copy("src/components/HomeLandingIsland.astro", "Puerta 1: Equipos"),
            Some("Puerta 1")
        );
        assert_eq!(
            find_v60_prohibited_commercial_copy("src/components/QuoteWizard.astro", "2. Operación JRP y Contacto"),
            Some("Operación JRP")
        );
        assert_eq!(
            find_v60_prohibited_commercial_copy("src/components/islands/CatalogFacetedIsland.astro", "incluye Rama D Híbrida"),
            Some("Rama D")
        );
    }
}
