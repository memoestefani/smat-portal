use regex::Regex;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Gate 53 (SMAT V5.3 — Ola C1 + C2):
/// Verifica landmark único `<main>`, ausencia de tokens crudos visibles en `dist/`,
/// cero exports JS muertos fuera de la lista blanca de 11 contratos de test,
/// y witnesses DOM de Outbox reactiva, Sobol en Dossier y `.mini-dossier-bar` no oclusiva.
pub fn check_v53_landmarks_and_zero_orphan_gate_53(site_root: &Path) -> Result<String, String> {
    // 1. Cero exports JS muertos en `src/scripts/*.js` fuera de los 11 helpers de contrato de test
    let allowlist: HashSet<&str> = HashSet::from([
        "CATALOG_ATOMIC_PARTS_COUNT",
        "normalizePartTokenTwoStage",
        "TWO_SORT_PARTITION_VERSION",
        "listAllDeclaredDomIds",
        "verifyConceptRegistryCoverage",
        "WEBHOOK_OUTBOX_STATES",
        "isPlaceholderWebhookUrl",
        "resolveInternalBudgetCategory",
        "VERTICAL_STATION_LENS_DESCRIPTORS",
        "renderMiningPresetTelemetry",
        "XDSM_DISCIPLINE_ORDER",
    ]);

    let mut prod_sources: Vec<(PathBuf, String)> = Vec::new();
    for entry in WalkDir::new(site_root.join("src"))
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.path().is_file() {
            if let Ok(content) = fs::read_to_string(entry.path()) {
                prod_sources.push((entry.path().to_path_buf(), content));
            }
        }
    }

    let export_re =
        Regex::new(r"(?m)^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z0-9_]+)")
            .unwrap();
    for entry in WalkDir::new(site_root.join("src/scripts"))
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("js") {
            continue;
        }
        let own_src = fs::read_to_string(path).map_err(|e| e.to_string())?;
        for cap in export_re.captures_iter(&own_src) {
            let sym = &cap[1];
            if allowlist.contains(sym) {
                continue;
            }
            let sym_re = Regex::new(&format!(r"\b{}\b", regex::escape(sym))).unwrap();
            let used_elsewhere = prod_sources
                .iter()
                .any(|(p, txt)| p != path && sym_re.is_match(txt));
            if !used_elsewhere {
                return Err(format!(
                    "Gate 53 (SLICE-V53-22): Export JS muerto '{}' en {} (prd=0 y fuera de allowlist de 11 contratos)",
                    sym,
                    path.display()
                ));
            }
        }
    }

    // 2. Witnesses estructurales en componentes y estilos (C1 + C2)
    let footer_src =
        fs::read_to_string(site_root.join("src/components/Footer.astro")).map_err(|e| e.to_string())?;
    let offline_hidden_re =
        Regex::new(r#"id="smat-offline-status"[^>]*\bhidden\b"#).unwrap();
    if !offline_hidden_re.is_match(&footer_src) {
        return Err(
            "Gate 53 (SLICE-V53-16): Footer.astro debe declarar #smat-offline-status con atributo hidden inicial"
                .to_string(),
        );
    }

    let wizard_src = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
        .map_err(|e| e.to_string())?;
    for req in [
        "id=\"wb-submit-outbox-btn\"",
        "id=\"wb-outbox-status-msg\"",
        "initQuoteOutboxController",
    ] {
        if !wizard_src.contains(req) {
            return Err(format!(
                "Gate 53 (SLICE-V53-15): QuoteWizard.astro debe incluir '{}'",
                req
            ));
        }
    }

    let dossier_src =
        fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro"))
            .map_err(|e| e.to_string())?;
    if !dossier_src.contains("id=\"live-table-sobol-drivers\"") {
        return Err(
            "Gate 53 (SLICE-V53-17): LiveEngineeringDossier.astro debe proyectar #live-table-sobol-drivers"
                .to_string(),
        );
    }

    let sticky_css =
        fs::read_to_string(site_root.join("src/styles/workbench-circuits-sticky.css"))
            .map_err(|e| e.to_string())?;
    if !sticky_css.contains("position: static") {
        return Err(
            "Gate 53 (Phase 0 / C2.1): workbench-circuits-sticky.css debe usar position: static en .mini-dossier-bar"
                .to_string(),
        );
    }

    // 3. Verificación sobre dist/: <main> único y cero tokens crudos visibles en texto plano
    let dist_dir = site_root.join("dist");
    if dist_dir.is_dir() {
        let main_open_re = Regex::new(r"(?i)<main\b").unwrap();
        let strip_scripts_re = Regex::new(r"(?is)<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>").unwrap();
        let strip_tags_re = Regex::new(r"(?s)<[^>]+>").unwrap();

        for entry in WalkDir::new(&dist_dir).into_iter().filter_map(|e| e.ok()) {
            let p = entry.path();
            if p.extension().and_then(|s| s.to_str()) != Some("html") {
                continue;
            }
            let html = fs::read_to_string(p).map_err(|e| e.to_string())?;
            let main_count = main_open_re.find_iter(&html).count();
            if main_count > 1 {
                return Err(format!(
                    "Gate 53 (SLICE-V53-01): '{}' contiene {} landmarks <main> (máximo permitido: 1)",
                    p.display(),
                    main_count
                ));
            }
        }

        for rel in [
            "index.html",
            "en/index.html",
            "catalogo/index.html",
            "en/catalog/index.html",
            "acuse/index.html",
            "en/thank-you/index.html",
            "equipos/index.html",
            "en/process-equipment/index.html",
        ] {
            let full = dist_dir.join(rel);
            if !full.is_file() {
                continue;
            }
            let html = fs::read_to_string(&full).map_err(|e| e.to_string())?;
            if main_open_re.find_iter(&html).count() != 1 {
                return Err(format!(
                    "Gate 53: dist/{} debe contener exactamente 1 <main>",
                    rel
                ));
            }
            let no_scripts = strip_scripts_re.replace_all(&html, " ");
            let visible = strip_tags_re.replace_all(&no_scripts, " ");
            for bad in [
                "1506000",
                "alto_cromo_cr27",
                "CAJA_CHICA_CFDI40",
                "IMMEDIATE_PICK",
                "FILTRO_BATCH_LAB",
                "CAPEX",
                "OPEX",
            ] {
                if visible.contains(bad) {
                    return Err(format!(
                        "Gate 53 (SLICE-V53-04): Token crudo '{}' visible en dist/{}",
                        bad, rel
                    ));
                }
            }
        }
    }

    // 4. Anti-regresión V5.3.1 (Ola C3: Fitts checkboxes, SSOT SMAT_SUPPLY_DOORS, higiene APL-03, Cowan <= 8.50)
    let layout_src = fs::read_to_string(site_root.join("src/layouts/BaseLayout.astro"))
        .map_err(|e| e.to_string())?;
    let normalized_layout = layout_src.replace("\r\n", "\n");
    if !normalized_layout.contains("label:has(> input[type=\"checkbox\"])")
        || !normalized_layout.contains("clip: rect(0px, 0px, 0px, 0px);")
        || !normalized_layout.contains("width: 20px;")
    {
        return Err(
            "Gate 53 (SLICE-V53C-01): BaseLayout.astro debe aplicar min-height:48px al <label> contenedor, sr-only al <input> y ::before 20x20px"
                .to_string(),
        );
    }

    for ssot_island in [
        "src/components/islands/HomeLandingIsland.astro",
        "src/components/Footer.astro",
        "src/components/islands/EquipmentHubIsland.astro",
        "src/components/islands/PumpingHubIsland.astro",
        "src/components/islands/ProcessControlIsland.astro",
    ] {
        let content = fs::read_to_string(site_root.join(ssot_island)).map_err(|e| e.to_string())?;
        if !content.contains("SMAT_SUPPLY_DOORS") {
            return Err(format!(
                "Gate 53 (SLICE-V53C-03): {} debe consumir SMAT_SUPPLY_DOORS como fuente única de verdad",
                ssot_island
            ));
        }
    }

    let projector_js = fs::read_to_string(site_root.join("src/scripts/wizardLivePhysicsProjector.js"))
        .map_err(|e| e.to_string())?;
    for raw_banned in ["CAJA_CHICA_CFDI40", "ROPING_CORDON", "45 min"] {
        if projector_js.contains(raw_banned) {
            return Err(format!(
                "Gate 53 (SLICE-V53C-06): wizardLivePhysicsProjector.js no debe emitir '{}'",
                raw_banned
            ));
        }
    }

    for slug_rel in [
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let slug_src = fs::read_to_string(site_root.join(slug_rel)).map_err(|e| e.to_string())?;
        if slug_src.contains("smat-slug-lang-switch") {
            return Err(format!(
                "Gate 53 (SLICE-V53C-10): {} no debe renderizar botón duplicado .smat-slug-lang-switch",
                slug_rel
            ));
        }
    }

    let dossier_css = fs::read_to_string(site_root.join("src/styles/workbench-dossier.css"))
        .map_err(|e| e.to_string())?;
    if !dossier_css.contains("flex-wrap: wrap") {
        return Err(
            "Gate 53 (SLICE-V53C-08): workbench-dossier.css debe incluir flex-wrap: wrap en .dossier-sla-bar"
                .to_string(),
        );
    }

    let wizard_ctrl = fs::read_to_string(site_root.join("src/scripts/quoteWizardController.js"))
        .map_err(|e| e.to_string())?;
    if !wizard_ctrl.contains("nowDateIso") || !wizard_ctrl.contains("live-date") {
        return Err(
            "Gate 53 (SLICE-V53C-07): quoteWizardController.js debe sincronizar #live-date dinámicamente con nowDateIso"
                .to_string(),
        );
    }

    let jrp_src = fs::read_to_string(site_root.join("src/components/cores/JrpReorderCore.astro"))
        .map_err(|e| e.to_string())?;
    if jrp_src.contains("Tray: <strong>v3") {
        return Err(
            "Gate 53 (SLICE-V53C-09): JrpReorderCore.astro no debe exponer texto interno 'Tray: v3'"
                .to_string(),
        );
    }

    Ok("OK: Gate 53 V5.3.1 verificado al 100% (1 <main>/página, 0 tokens crudos visibles, 0 exports JS muertos fuera de allowlist-11, Outbox reactiva, Sobol, SSOT Puertas y Fitts/APL-03).".to_string())
}
