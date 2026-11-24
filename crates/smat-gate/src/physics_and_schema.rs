use regex::Regex;
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Invariante 7: Cotas fisicas del nucleo de pulpa (R55 <= 70 C, SiC <= 28.0 m/s, motores expuestos).
pub fn verify_physics_and_thermal_bounds(site_root: &Path) -> Result<(), String> {
    let slurry = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js"))
        .map_err(|e| format!("Error leyendo slurryEngine.js: {}", e))?;
    if !slurry.contains("tempC > 70") || slurry.contains("tempC > 110") {
        return Err("slurryEngine.js debe fijar techo termico R55 en tempC > 70 (sin 110 C)".to_string());
    }
    if slurry.contains("29.5") || !slurry.contains("28.0") {
        return Err("slurryEngine.js debe alinear limite cinematico SiC a 28.0 m/s".to_string());
    }
    for fn_name in [
        "validatePlantLeadInput",
        "evaluateCentrifugalSealPressureBalance",
    ] {
        if !slurry.contains(fn_name) {
            return Err(format!("Falta motor fisico '{}' en slurryEngine.js", fn_name));
        }
    }

    let tribo = fs::read_to_string(site_root.join("src/scripts/tribologyAndCompatibilityEngine.js"))
        .map_err(|e| e.to_string())?;
    for fn_name in ["calculateGyMinimumSampleMass", "recommendAstmSieveSeries"] {
        if !tribo.contains(fn_name) {
            return Err(format!("Falta funcion '{}' en tribologyAndCompatibilityEngine.js", fn_name));
        }
    }

    let drive = fs::read_to_string(site_root.join("src/scripts/pumpAssemblyAndDriveEngine.js"))
        .map_err(|e| e.to_string())?;
    if !drive.contains("calculateDriveAndBearingKinematics") {
        return Err("Falta calculateDriveAndBearingKinematics en pumpAssemblyAndDriveEngine.js".to_string());
    }

    Ok(())
}

/// Invariante 8: Contrato Two-Sort en EngineSchema, 0 exports JS muertos en produccion y Outbox/PWA honestos.
pub fn verify_schema_outbox_pwa_and_zero_dead_exports(site_root: &Path) -> Result<(), String> {
    let reg = fs::read_to_string(site_root.join("src/scripts/engineSchemaRegistry.js"))
        .map_err(|e| e.to_string())?;
    if reg.contains("innerHTML") || reg.contains("eval(") {
        return Err("engineSchemaRegistry.js viola particion Two-Sort (HTML/eval prohibidos)".to_string());
    }

    let outbox_binder = fs::read_to_string(site_root.join("src/scripts/quoteOutboxDomBinder.js"))
        .map_err(|e| e.to_string())?;
    if outbox_binder.contains("endpointUrl: ''") || !outbox_binder.contains("data-lead-endpoint") {
        return Err("quoteOutboxDomBinder.js debe leer data-lead-endpoint sin endpointUrl: '' hardcoded".to_string());
    }

    let sw = fs::read_to_string(site_root.join("public/sw.js")).map_err(|e| e.to_string())?;
    for route in [
        "/cotizar/",
        "/bombeo/",
        "/filtracion/",
        "/flotacion/",
        "/control-de-procesos/",
    ] {
        if !sw.contains(route) {
            return Err(format!("public/sw.js PRECACHE_SHELL omite ruta critica '{}'", route));
        }
    }

    // Cero exports JS muertos en produccion (excluye tests/)
    let mut prod_corpus = String::new();
    for entry in WalkDir::new(site_root.join("src")).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
            if ["astro", "js", "ts"].contains(&ext) {
                prod_corpus.push_str(&fs::read_to_string(entry.path()).unwrap_or_default());
                prod_corpus.push('\n');
            }
        }
    }

    let export_decl_re = Regex::new(
        r"(?m)^\s*export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)"
    ).unwrap();
    let reexport_list_re = Regex::new(r"(?s)export\s*\{([^}]*)\}").unwrap();

    let scripts_dir = site_root.join("src/scripts");
    for entry in fs::read_dir(&scripts_dir).map_err(|e| e.to_string())?.flatten() {
        let p = entry.path();
        if p.extension().and_then(|s| s.to_str()) != Some("js") {
            continue;
        }
        let text = fs::read_to_string(&p).unwrap_or_default();
        let mut exported: HashSet<String> = HashSet::new();
        for cap in export_decl_re.captures_iter(&text) {
            if let Some(m) = cap.get(1) {
                exported.insert(m.as_str().to_string());
            }
        }
        for cap in reexport_list_re.captures_iter(&text) {
            if let Some(block) = cap.get(1) {
                for item in block.as_str().split(',') {
                    let clean = item
                        .trim()
                        .split_whitespace()
                        .last()
                        .unwrap_or("")
                        .trim();
                    if !clean.is_empty() && clean.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
                        exported.insert(clean.to_string());
                    }
                }
            }
        }

        let fname = p.file_name().unwrap_or_default().to_string_lossy();
        for sym in exported {
            // Conteo simple de referencias externas por simbolo en el arbol src/
            let sym_re = Regex::new(&format!(r"\b{}\b", regex::escape(&sym))).unwrap();
            let total_hits = sym_re.find_iter(&prod_corpus).count();
            let self_hits = sym_re.find_iter(&text).count();
            if total_hits <= self_hits {
                return Err(format!(
                    "Export JS muerto en produccion '{}' dentro de src/scripts/{}",
                    sym, fname
                ));
            }
        }
    }

    verify_no_ts_nocheck_or_hidden_schema_text(&scripts_dir, &site_root.join("src/components"))?;

    Ok(())
}

/// Verifica 0 `@ts-nocheck` en `src/scripts/*.js` y 0 `data-schema-*` sobre nodos ocultos en Astro.
pub fn verify_no_ts_nocheck_or_hidden_schema_text(scripts_dir: &Path, components_dir: &Path) -> Result<(), String> {
    for entry in fs::read_dir(scripts_dir).map_err(|e| e.to_string())?.flatten() {
        let p = entry.path();
        if p.extension().and_then(|s| s.to_str()) == Some("js") {
            let text = fs::read_to_string(&p).unwrap_or_default();
            if has_ts_nocheck_directive(&text) {
                return Err(format!("Prohibido @ts-nocheck en {}", p.display()));
            }
        }
    }

    for entry in WalkDir::new(components_dir).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file()
            && entry.path().extension().and_then(|s| s.to_str()) == Some("astro")
        {
            let text = fs::read_to_string(entry.path()).unwrap_or_default();
            if let Some(offending) = find_hidden_schema_element(&text) {
                return Err(format!(
                    "Nodo oculto con data-schema-* prohibido en {}: {}",
                    entry.path().display(),
                    offending
                ));
            }
        }
    }

    Ok(())
}

fn has_ts_nocheck_directive(js_text: &str) -> bool {
    js_text.contains("@ts-nocheck")
}

fn find_hidden_schema_element(astro_text: &str) -> Option<String> {
    let tag_re = Regex::new(r"(?is)<[a-z][a-z0-9-]*\b[^>]*data-schema-(?:input|output)\s*=[^>]*>").unwrap();
    let hard_hidden_re = Regex::new(r#"(?i)(?:\btype\s*=\s*["']hidden["']|\bsr-only\b)"#).unwrap();
    let bool_hidden_re = Regex::new(r#"(?i)\bhidden\b(?:\s|>|/|=)"#).unwrap();
    for cap in tag_re.find_iter(astro_text) {
        let tag = cap.as_str();
        if hard_hidden_re.is_match(tag)
            || (tag.contains("data-schema-input") && bool_hidden_re.is_match(tag))
        {
            return Some(tag.chars().take(90).collect());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::{find_hidden_schema_element, has_ts_nocheck_directive};

    #[test]
    fn rejects_ts_nocheck_and_hidden_schema_dom() {
        assert!(has_ts_nocheck_directive("// @ts-nocheck\nexport const x = 1;"));
        assert!(!has_ts_nocheck_directive("// @ts-check\nexport const x = 1;"));
        assert!(find_hidden_schema_element(r#"<input type="hidden" data-schema-input="jrp.version" />"#).is_some());
        assert!(find_hidden_schema_element(r#"<span class="sr-only" data-schema-output="jrp.x">1</span>"#).is_some());
        assert!(find_hidden_schema_element(r#"<input type="number" data-schema-input="jrp.predictedWearHours" />"#).is_none());
    }
}
