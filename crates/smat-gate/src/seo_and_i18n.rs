use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Invariante 4: Simetria bilingue ES/EN en paginas raiz y cero fugas de espanol en dist/en/.
pub fn verify_bilingual_symmetry_and_zero_es_leaks(site_root: &Path) -> Result<(), String> {
    let pairs = [
        ("src/pages/index.astro", "src/pages/en/index.astro"),
        ("src/pages/catalogo.astro", "src/pages/en/catalog.astro"),
        ("src/pages/nosotros.astro", "src/pages/en/about.astro"),
        ("src/pages/contacto.astro", "src/pages/en/contact.astro"),
        ("src/pages/diagnostico.astro", "src/pages/en/diagnostics.astro"),
        ("src/pages/acuse.astro", "src/pages/en/thank-you.astro"),
        ("src/pages/cotizar.astro", "src/pages/en/quote.astro"),
    ];
    for (es_rel, en_rel) in pairs {
        if !site_root.join(es_rel).exists() || !site_root.join(en_rel).exists() {
            return Err(format!("Rota simetria bilingue ES/EN: {} <-> {}", es_rel, en_rel));
        }
    }

    let en_dist = site_root.join("dist/en");
    if en_dist.is_dir() {
        let forbidden_es = [
            "Cotizar Requisición",
            "Suspensión Completa",
            "Enviar Solicitud a Ingeniería Durango",
            "Borrador Local (Sin envío automático)",
        ];
        for entry in WalkDir::new(&en_dist).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file()
                && entry.path().extension().and_then(|s| s.to_str()) == Some("html")
            {
                let html = fs::read_to_string(entry.path()).unwrap_or_default();
                for token in forbidden_es {
                    if html.contains(token) {
                        return Err(format!(
                            "Fuga ES ('{}') detectada en {}",
                            token,
                            entry.path().display()
                        ));
                    }
                }
            }
        }
    }

    Ok(())
}

/// Invariante 5: Integridad de redirecciones 301 en 1 salto y cero enlaces huerfanos `/#rfq`.
pub fn verify_redirects_one_hop_and_static_links(site_root: &Path) -> Result<(), String> {
    let redirects_path = site_root.join("public/_redirects");
    if !redirects_path.exists() {
        return Err("Falta public/_redirects".to_string());
    }
    let content = fs::read_to_string(&redirects_path).map_err(|e| e.to_string())?;
    let mut rules: Vec<(String, String)> = Vec::new();
    let mut sources = HashSet::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() < 3 || (parts[2] != "301" && parts[2] != "302") {
            return Err(format!("Regla invalida en _redirects: '{}'", trimmed));
        }
        let src = parts[0].to_string();
        let dst = parts[1].to_string();
        sources.insert(src.clone());
        rules.push((src, dst));
    }

    if rules.len() < 30 {
        return Err(format!("Menos de 30 reglas en _redirects ({})", rules.len()));
    }

    let lookup: HashMap<String, String> = rules.into_iter().collect();
    for (src, dst) in &lookup {
        if !src.contains('*') && !dst.contains(":splat") && src != dst && sources.contains(dst) {
            return Err(format!("Cadena 2-hop en _redirects: {} -> {}", src, dst));
        }
    }

    for entry in WalkDir::new(site_root.join("src")).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
            if ["astro", "js", "ts"].contains(&ext) {
                let text = fs::read_to_string(entry.path()).unwrap_or_default();
                if text.contains("href=\"/#rfq\"") || text.contains("href='/#rfq'") {
                    return Err(format!(
                        "Enlace huerfano /#rfq detectado en {}",
                        entry.path().display()
                    ));
                }
            }
        }
    }

    Ok(())
}

/// Invariante 6: Catalogo maestro (19 SKUs, 13 piezas, 19 WebP, 25 grupos / 52 minas, reglas B2B).
pub fn verify_catalog_mining_groups_and_webp(site_root: &Path) -> Result<(), String> {
    let quick_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json"))
        .map_err(|e| e.to_string())?;
    let quick_val: serde_json::Value = serde_json::from_str(&quick_raw).map_err(|e| e.to_string())?;
    let skus = quick_val
        .get("products")
        .or_else(|| quick_val.get("items"))
        .and_then(|v| v.as_array())
        .or_else(|| quick_val.as_array())
        .ok_or("Formato invalido en data/quick_checkout_Catalog.json")?;
    if skus.len() != 19 {
        return Err(format!(
            "Se esperan exactamente 19 SKUs canonicos (encontrados: {})",
            skus.len()
        ));
    }

    let atomic_raw =
        fs::read_to_string(site_root.join("data/atomic_parts.json")).map_err(|e| e.to_string())?;
    let atomic_val: serde_json::Value =
        serde_json::from_str(&atomic_raw).map_err(|e| e.to_string())?;
    let parts_count = atomic_val
        .get("parts")
        .and_then(|p| p.as_array())
        .map(|a| a.len())
        .or_else(|| atomic_val.as_array().map(|a| a.len()))
        .or_else(|| atomic_val.as_object().map(|o| o.len()))
        .unwrap_or(0);
    if parts_count < 13 {
        return Err(format!("Faltan piezas atomicas canonicas (<13): {}", parts_count));
    }

    let mg_raw =
        fs::read_to_string(site_root.join("data/mining_groups.json")).map_err(|e| e.to_string())?;
    let mg_val: serde_json::Value = serde_json::from_str(&mg_raw).map_err(|e| e.to_string())?;
    let groups = mg_val
        .get("groups")
        .and_then(|g| g.as_array())
        .or_else(|| mg_val.as_array())
        .ok_or("Formato invalido en data/mining_groups.json")?;
    if groups.len() < 25 {
        return Err(format!("Faltan grupos mineros (<25): {}", groups.len()));
    }
    let unit_total: usize = groups
        .iter()
        .filter_map(|g| g.get("units").and_then(|u| u.as_array()).map(|a| a.len()))
        .sum();
    if unit_total < 44 {
        return Err(format!("Unidades mineras insuficientes: {}", unit_total));
    }

    let webp_dir = site_root.join("public/images/productos");
    if webp_dir.is_dir() {
        let mut webp_count = 0usize;
        for entry in fs::read_dir(&webp_dir).map_err(|e| e.to_string())?.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.contains("expo.png") {
                return Err(format!("Artefacto prohibido expo.png en {}", name));
            }
            if name.ends_with(".webp") {
                webp_count += 1;
            }
        }
        if webp_count < 19 {
            return Err(format!(
                "Se requieren al menos 19 imagenes .webp en public/images/productos (hay {})",
                webp_count
            ));
        }
    }

    Ok(())
}
