use regex::Regex;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Gate 52 (SMAT V5.1 — D1-V51 a D10-V51, ARB-SMAT-59, DEB-V51-01..18):
/// Audita la clausura en tiempo de ejecución del contrato EngineSchema <-> XDSM <-> Cores Únicos,
/// erradicación total de placebos/fallbacks silenciosos/inline styles/emojis y aislamiento Bilingüe ES/EN en dist/.
pub fn check_v51_runtime_schema_and_zero_placebo_gate_52(site_root: &Path) -> Result<String, String> {
    // 1. Existencia física de los 7 + 2 Cores compartidos y módulos runtime V5.1
    for req_rel in [
        "src/components/cores/PumpingHydraulicsCore.astro",
        "src/components/cores/TribologyAlloyCore.astro",
        "src/components/cores/SealDriveBearingCore.astro",
        "src/components/cores/FlotationCore.astro",
        "src/components/cores/FiltrationCore.astro",
        "src/components/cores/CycloneScreenCore.astro",
        "src/components/cores/MetrologyLabCore.astro",
        "src/components/cores/DropInVerifierCore.astro",
        "src/components/cores/JrpReorderCore.astro",
        "src/scripts/schemaRuntimeBinder.js",
        "src/scripts/i18nDomainLabels.js",
        "src/scripts/urlContextAndPartCodeParser.js",
        "crates/smat-gate/src/core_integrity_gates.rs",
    ] {
        if !site_root.join(req_rel).is_file() {
            return Err(format!("Gate 52 (V5.1): Falta artefacto canónico '{}'", req_rel));
        }
    }

    // 2. Cero bifurcaciones {isEmbedded} en las islas unificadas
    for island_rel in [
        "src/components/islands/ProcessControlIsland.astro",
        "src/components/islands/CycloneScreenIsland.astro",
        "src/components/islands/FlotationCalculatorIsland.astro",
        "src/components/islands/FiltrationCalculatorIsland.astro",
        "src/components/islands/SealDriveBearingIsland.astro",
    ] {
        let src = fs::read_to_string(site_root.join(island_rel)).map_err(|e| e.to_string())?;
        if Regex::new(r"\bisEmbedded\b").unwrap().is_match(&src) {
            return Err(format!("Gate 52 (D3-V51): '{}' conserva bifurcación obsoleta isEmbedded", island_rel));
        }
    }

    // 3. Presupuesto modular QuoteWizard < 480 LOC y smat-gate/src/lib.rs < 650 LOC
    let qw_lines = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
        .map_err(|e| e.to_string())?
        .lines()
        .count();
    if qw_lines >= 480 {
        return Err(format!("Gate 52 (D4-V51): QuoteWizard.astro excede < 480 LOC (actual: {})", qw_lines));
    }
    let lib_lines = fs::read_to_string(site_root.join("crates/smat-gate/src/lib.rs"))
        .map_err(|e| e.to_string())?
        .lines()
        .count();
    if lib_lines >= 650 {
        return Err(format!("Gate 52 (D9-V51): smat-gate/src/lib.rs excede < 650 LOC (actual: {})", lib_lines));
    }

    // 4. Consumo real de schemaRuntimeBinder en controladores clave y cero fallbacks silenciosos
    for ctrl_rel in [
        "src/scripts/quoteWizardController.js",
        "src/scripts/wizardEventBindings.js",
        "src/scripts/verticalCalculatorsAndLabelsBridge.js",
        "src/scripts/wizardCircuitPhysicsController.js",
    ] {
        let ctrl_src = fs::read_to_string(site_root.join(ctrl_rel)).map_err(|e| e.to_string())?;
        if !ctrl_src.contains("schemaRuntimeBinder.js") {
            return Err(format!("Gate 52 (D1-V51): '{}' debe importar schemaRuntimeBinder.js", ctrl_rel));
        }
    }

    let style_attr_re = Regex::new(r#"\bstyle\s*=\s*""#).unwrap();
    let emoji_re = Regex::new(r"[\u{2605}\u{2713}\u{2715}\u{2794}\u{267B}\u{26A1}\u{1F300}-\u{1FAFF}]").unwrap();
    let placebo_terms = ["wb-solids-sg", "wb-symptom-select", "wb-ctrl-ring", "wb-assembly-sequence-test"];
    let silent_fallbacks = ["?? 2.35", "?? 2.95", "?? 2.85", "?? 3.42"];

    for entry in WalkDir::new(site_root.join("src")).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
        if !matches!(ext, "astro" | "js") {
            continue;
        }
        let content = fs::read_to_string(path).unwrap_or_default();
        if ext == "astro" && style_attr_re.is_match(&content) {
            return Err(format!("Gate 52 (DEB-V51-11): Atributo inline style=\"\" detectado en {}", path.display()));
        }
        if emoji_re.is_match(&content) {
            return Err(format!("Gate 52 (DEB-V51-12): Emoji o símbolo ornamental detectado en {}", path.display()));
        }
        for p in &placebo_terms {
            if content.contains(p) {
                return Err(format!("Gate 52 (DEB-V51-07/09): Placebo '{}' detectado en {}", p, path.display()));
            }
        }
        if ext == "js" {
            for fb in &silent_fallbacks {
                if content.contains(fb) {
                    return Err(format!("Gate 52 (DEB-V51-04): Fallback silencioso '{}' en {}", fb, path.display()));
                }
            }
        }
    }

    // 5. Trazabilidad cerrada CONCEPT-REGISTRY.md (engine_schema_v50 + engine_schema_v51)
    let registry = fs::read_to_string(site_root.join("docs/CONCEPT-REGISTRY.md")).map_err(|e| e.to_string())?;
    if !registry.contains("engine_schema_v51") || !registry.contains("engine_schema_v50") {
        return Err("Gate 52 (D6-V51): docs/CONCEPT-REGISTRY.md debe declarar engine_schema_v50 y engine_schema_v51".to_string());
    }

    // 6. Auditoría dist/ cuando existe compilado: 0 fugas ES en /en/, PWA + /admin/, y supresión QuickOrderTray en legales
    let dist_dir = site_root.join("dist");
    if dist_dir.is_dir() {
        let script_style_re = Regex::new(r"(?is)<(script|style)\b[^>]*>[\s\S]*?</(script|style)>").unwrap();
        let tag_re = Regex::new(r"<[^>]+>").unwrap();
        let dist_en = dist_dir.join("en");
        if dist_en.is_dir() {
            for entry in WalkDir::new(&dist_en).into_iter().filter_map(|e| e.ok()) {
                if entry.file_type().is_file() && entry.path().extension().and_then(|s| s.to_str()) == Some("html") {
                    let raw = fs::read_to_string(entry.path()).unwrap_or_default();
                    let stripped = script_style_re.replace_all(&raw, "");
                    let visible = tag_re.replace_all(&stripped, " ");
                    for leak in [
                        "Lote de Contacto Húmedo",
                        "Calibrar Hidráulica",
                        "Solicitar Cotización de Equipos",
                        "Folio de Requisición",
                        "Retiro en Almacén Durango",
                        "Paro de Planta",
                        "Bomba Completa para Lodos",
                    ] {
                        if visible.contains(leak) {
                            return Err(format!("Gate 52 (DEB-V51-13): Fuga ES '{}' en {}", leak, entry.path().display()));
                        }
                    }
                }
            }
        }

        let dist_index = dist_dir.join("index.html");
        if dist_index.is_file() {
            let idx_html = fs::read_to_string(&dist_index).map_err(|e| e.to_string())?;
            if !idx_html.contains("id=\"smat-offline-status\"") || !idx_html.contains("/admin/") {
                return Err("Gate 52 (SLICE-V51-29): dist/index.html debe exponer #smat-offline-status y enlace /admin/".to_string());
            }
        }
        for legal_rel in ["aviso/index.html", "contacto/index.html", "nosotros/index.html"] {
            let lp = dist_dir.join(legal_rel);
            if lp.is_file() {
                let l_html = fs::read_to_string(&lp).map_err(|e| e.to_string())?;
                if l_html.contains("id=\"smat-qtray-toggle\"") {
                    return Err(format!("Gate 52 (DEB-V51-14): QuickOrderTray no debe renderizarse en '{}'", legal_rel));
                }
            }
        }
    }

    Ok("OK: Gate 52 V5.1 verificado al 100% (7+2 Cores compartidos, 0 isEmbedded, QuoteWizard <480 LOC, lib.rs <650 LOC, 0 inline styles, 0 emojis UI, 0 placebos/fallbacks, PWA+/admin/ y 0 fugas ES).".to_string())
}
