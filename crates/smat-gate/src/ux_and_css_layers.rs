use regex::Regex;
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Invariante 9: Landmark <main> unico por pagina HTML y cero tokens internos visibles en dist/.
pub fn verify_single_main_and_zero_raw_tokens(site_root: &Path) -> Result<(), String> {
    let dist_dir = site_root.join("dist");
    if !dist_dir.is_dir() {
        return Ok(());
    }

    let raw_tokens = [
        "CAJA_CHICA_CFDI40",
        "DRAFT_LOCAL",
        "(bound-",
        "Driver Sobol",
        "smat_vendor_passport_v1",
        "Foto Studio 100%",
        "Simulador Durand",
        "Catálogo Oficial · SMAT",
        "AV-01",
        "AV-02",
        "Estrato 1",
        "Raíz normalizada",
        "Puerta 1",
        "Puerta 2",
        "Puerta 3",
        "Pinza Térmica IEC",
        "EN_COLA_OFFLINE",
    ];
    let script_re = Regex::new(r"(?is)<script\b[^>]*>[\s\S]*?</script>").unwrap();
    let style_re = Regex::new(r"(?is)<style\b[^>]*>[\s\S]*?</style>").unwrap();
    let tag_re = Regex::new(r"<[^>]+>").unwrap();
    for entry in WalkDir::new(&dist_dir).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file()
            || entry.path().extension().and_then(|s| s.to_str()) != Some("html")
        {
            continue;
        }
        let html = fs::read_to_string(entry.path()).unwrap_or_default();
        let main_count = html.matches("<main").count();
        let fname = entry.path().file_name().unwrap_or_default().to_string_lossy();
        if fname != "404.html" && main_count != 1 {
            return Err(format!(
                "Se requiere exactamente 1 <main> en {} (encontrados: {})",
                entry.path().display(),
                main_count
            ));
        }
        let no_scripts = script_re.replace_all(&html, " ");
        let no_styles = style_re.replace_all(&no_scripts, " ");
        let visible_text = tag_re.replace_all(&no_styles, " ");
        for tok in raw_tokens {
            if visible_text.contains(tok) {
                return Err(format!(
                    "Token interno visible '{}' en {}",
                    tok,
                    entry.path().display()
                ));
            }
        }
    }

    Ok(())
}

/// Invariante 10: Higiene de cores/*.astro (0 style= inline, 0 emojis), @media print y offline discreto.
pub fn verify_print_pwa_and_core_hygiene(site_root: &Path) -> Result<(), String> {
    let cores_dir = site_root.join("src/components/cores");
    if cores_dir.is_dir() {
        for entry in fs::read_dir(&cores_dir).map_err(|e| e.to_string())?.flatten() {
            let p = entry.path();
            if p.extension().and_then(|s| s.to_str()) == Some("astro") {
                let text = fs::read_to_string(&p).unwrap_or_default();
                if text.contains("style=\"") || text.contains("style='") {
                    return Err(format!("Estilo inline prohibido en {}", p.display()));
                }
            }
        }
    }

    let footer = fs::read_to_string(site_root.join("src/components/Footer.astro"))
        .map_err(|e| e.to_string())?;
    if !footer.contains("id=\"smat-offline-status\"") || !footer.contains("hidden") {
        return Err("Footer.astro debe conservar #smat-offline-status con hidden inicial".to_string());
    }
    if footer.contains("/admin/") {
        return Err("Footer.astro no debe exponer enlace publico /admin/".to_string());
    }

    let acuse = fs::read_to_string(site_root.join("src/components/islands/AcuseSheetIsland.astro"))
        .unwrap_or_default();
    if !acuse.contains("@media print") {
        return Err("AcuseSheetIsland.astro requiere soporte @media print".to_string());
    }

    verify_instrument_shell_input_first(site_root)?;
    verify_v58_instrument_and_mobile_header(site_root)?;
    verify_v59_xray_and_mobile_cols(site_root)?;
    verify_v60_storefront_photo_first(site_root)?;
    verify_v80_zero_dossier_duplicate_cta(site_root)?;

    Ok(())
}

/// Invariante V8.0: Cero botones duplicados `[data-add-tray-sku]` ni defaults sintéticos en `LiveEngineeringDossier.astro`.
pub fn verify_v80_zero_dossier_duplicate_cta(site_root: &Path) -> Result<(), String> {
    let dossier = fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro"))
        .map_err(|e| format!("Error leyendo LiveEngineeringDossier.astro: {}", e))?;
    verify_v80_dossier_markup(&dossier)
}

pub fn verify_v80_dossier_markup(dossier_src: &str) -> Result<(), String> {
    if dossier_src.contains("data-add-tray-sku") {
        return Err("LiveEngineeringDossier.astro no debe exponer botones duplicados [data-add-tray-sku]".to_string());
    }
    if dossier_src.contains("SMAT-PUMP-6X4-WETKIT") {
        return Err("LiveEngineeringDossier.astro no debe inyectar SMAT-PUMP-6X4-WETKIT en SSR vacio".to_string());
    }
    Ok(())
}

/// Invariante V6.0: Tarjeta de tienda con atributo homogéneo, ProductQuickCard foto-default y ProductDetailIsland sin precios.
pub fn verify_v60_storefront_photo_first(site_root: &Path) -> Result<(), String> {
    let sf_card = fs::read_to_string(site_root.join("src/components/ProductStorefrontCard.astro"))
        .map_err(|e| format!("Falta ProductStorefrontCard.astro V6.0: {}", e))?;
    if !sf_card.contains("data-ergos-homogeneous-card") {
        return Err("ProductStorefrontCard.astro debe declarar data-ergos-homogeneous-card".to_string());
    }

    let qcard = fs::read_to_string(site_root.join("src/components/ProductQuickCard.astro"))
        .map_err(|e| format!("Error leyendo ProductQuickCard.astro: {}", e))?;
    verify_v60_qcard_photo_default(&qcard)?;

    let pdp = fs::read_to_string(site_root.join("src/components/islands/ProductDetailIsland.astro"))
        .map_err(|e| format!("Falta ProductDetailIsland.astro V6.0: {}", e))?;
    if !pdp.contains("data-slug-add-to-tray") {
        return Err("ProductDetailIsland.astro debe exponer Buy Box [data-slug-add-to-tray]".to_string());
    }

    if site_root.join("src/components/islands/AtomicPartIsland.astro").exists() {
        return Err("AtomicPartIsland.astro debe estar eliminado en V7.0 (unificado en ProductDetailIsland.astro)".to_string());
    }

    let slug_css = fs::read_to_string(site_root.join("src/styles/productSlugSolar.css"))
        .map_err(|e| format!("Error leyendo productSlugSolar.css: {}", e))?;
    if !slug_css.contains("minmax(0, 7fr) minmax(0, 5fr)") {
        return Err("productSlugSolar.css debe usar minmax(0, 7fr) minmax(0, 5fr) para evitar desborde".to_string());
    }
    Ok(())
}

pub fn verify_v60_qcard_photo_default(qcard_src: &str) -> Result<(), String> {
    if !qcard_src.contains("data-qcard-tab=\"photo\"") || !qcard_src.contains("aria-selected=\"true\"") {
        return Err("ProductQuickCard.astro debe iniciar con la pestaña de fotografía real activa (aria-selected=true)".to_string());
    }
    Ok(())
}

/// Invariante V5.9: TechnicalDiagrams opt-in (`showXrayOverlay = false`) y `.smat-inputs-2col` mobile-first (`1fr`).
pub fn verify_v59_xray_and_mobile_cols(site_root: &Path) -> Result<(), String> {
    let diag = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro"))
        .map_err(|e| format!("Error leyendo TechnicalDiagrams.astro: {}", e))?;
    if !diag.contains("showXrayOverlay = false") || !diag.contains("data-xray-toggle") {
        return Err("TechnicalDiagrams.astro debe iniciar con showXrayOverlay = false y botón data-xray-toggle".to_string());
    }
    let global_css = fs::read_to_string(site_root.join("src/styles/global.css"))
        .map_err(|e| format!("Error leyendo global.css: {}", e))?;
    verify_v59_mobile_cols_css(&global_css)
}

pub fn verify_v59_mobile_cols_css(global_css: &str) -> Result<(), String> {
    let block_re = Regex::new(r"(?s)\.smat-inputs-2col\s*\{([^}]*)\}").unwrap();
    if let Some(cap) = block_re.captures(global_css) {
        let block = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        if block.contains("minmax(0, 1fr)") && !block.contains("repeat(2") {
            return Ok(());
        }
    }
    Err("global.css .smat-inputs-2col debe ser mobile-first (minmax(0, 1fr))".to_string())
}

/// Invariante V5.8: prohíbe Flexbox `order:` en contenedores `<InstrumentShell>`, prohíbe `uppercase` en `.instrument-kpi-cell`
/// y exige control móvil explícito (`header-mobile-menu`) en `Header.astro`.
pub fn verify_v58_instrument_and_mobile_header(site_root: &Path) -> Result<(), String> {
    let cores_css = fs::read_to_string(site_root.join("src/styles/cores-apple.css"))
        .map_err(|e| format!("Error leyendo cores-apple.css: {}", e))?;
    verify_v58_cores_css_text(&cores_css)?;

    let header = fs::read_to_string(site_root.join("src/components/Header.astro"))
        .map_err(|e| format!("Error leyendo Header.astro: {}", e))?;
    if !header.contains("header-mobile-menu") {
        return Err("Header.astro debe exponer #header-mobile-menu con botón explícito Menú/Menu".to_string());
    }
    Ok(())
}

pub fn verify_v58_cores_css_text(cores_css: &str) -> Result<(), String> {
    let order_block_re = Regex::new(r"(?s)\.smat-instrument-(inputs|verdict)\s*\{([^}]*)\}").unwrap();
    for cap in order_block_re.captures_iter(cores_css) {
        let block = cap.get(2).map(|m| m.as_str()).unwrap_or("");
        if Regex::new(r"(?i)\border\s*:").unwrap().is_match(block) {
            return Err("cores-apple.css no debe reordenar .smat-instrument-* mediante CSS order:".to_string());
        }
    }
    let kpi_block_re = Regex::new(r"(?s)\.instrument-kpi-cell[^{]*\{([^}]*)\}").unwrap();
    for cap in kpi_block_re.captures_iter(cores_css) {
        let block = cap.get(1).map(|m| m.as_str()).unwrap_or("");
        if block.contains("text-transform: uppercase") || block.contains("text-transform:uppercase") {
            return Err("cores-apple.css no debe aplicar text-transform: uppercase en .instrument-kpi-cell (protege σ_max y d₅₀c)".to_string());
        }
    }
    Ok(())
}

/// Invariante V5.7: verifica que `<InstrumentShell>` exista y los 5 núcleos canónicos rendericen `slot="inputs"` antes de `slot="verdict"`.
pub fn check_input_first_order(astro_text: &str) -> bool {
    match (astro_text.find("slot=\"inputs\""), astro_text.find("slot=\"verdict\"")) {
        (Some(inp), Some(ver)) => inp < ver,
        _ => false,
    }
}

pub fn verify_instrument_shell_input_first(site_root: &Path) -> Result<(), String> {
    let shell_path = site_root.join("src/components/cores/InstrumentShell.astro");
    if !shell_path.is_file() {
        return Err("Falta componente canonico src/components/cores/InstrumentShell.astro".to_string());
    }
    for rel in [
        "src/components/cores/MetrologyLabCore.astro",
        "src/components/cores/CycloneScreenCore.astro",
        "src/components/cores/FiltrationCore.astro",
        "src/components/cores/FlotationCore.astro",
        "src/components/cores/PumpingHydraulicsCore.astro",
    ] {
        let p = site_root.join(rel);
        let text = fs::read_to_string(&p).map_err(|e| format!("Error leyendo {}: {}", rel, e))?;
        if !check_input_first_order(&text) {
            return Err(format!("{} debe colocar slot=\"inputs\" antes de slot=\"verdict\" (V5.7 Input-First)", rel));
        }
    }
    Ok(())
}

/// Invariante 11: Cuando /cotizar/ ya fue desacoplada a Checkout B2B puro, valida peso < 110 KB,
/// profundidad de <details> <= 1 y 0 IDs DOM duplicados en dist/cotizar/index.html.
pub fn verify_task_first_checkout_hygiene(site_root: &Path) -> Result<(), String> {
    let legacy_wcc = site_root.join("src/components/WizardCircuitCalculators.astro");
    if legacy_wcc.exists() {
        // Aun en ejecucion de Fases A1-A2 previas al retiro de WizardCircuitCalculators.astro.
        return Ok(());
    }

    for rel in ["dist/cotizar/index.html", "dist/en/quote/index.html"] {
        let p = site_root.join(rel);
        if !p.exists() {
            continue;
        }
        let html = fs::read_to_string(&p).map_err(|e| e.to_string())?;
        if html.len() > 110_000 {
            return Err(format!(
                "{} excede presupuesto Task-First de 110 KB ({} bytes)",
                rel,
                html.len()
            ));
        }

        let details_tag_re = Regex::new(r"(?i)<(/?)details\b").unwrap();
        let mut depth = 0usize;
        let mut max_depth = 0usize;
        for cap in details_tag_re.captures_iter(&html) {
            if cap.get(1).map(|m| m.as_str()) == Some("/") {
                depth = depth.saturating_sub(1);
            } else {
                depth += 1;
                if depth > max_depth {
                    max_depth = depth;
                }
            }
        }
        if max_depth > 1 {
            return Err(format!(
                "{} contiene <details> anidados (profundidad={})",
                rel, max_depth
            ));
        }

        let id_re = Regex::new(r#"\s+id\s*=\s*"([^"]+)""#).unwrap();
        let mut seen = HashSet::new();
        for cap in id_re.captures_iter(&html) {
            let id_val = cap[1].to_string();
            if !seen.insert(id_val.clone()) {
                return Err(format!("ID DOM duplicado '{}' en {}", id_val, rel));
            }
        }
    }

    // D6-V55: Capas @layer globales, .smat-logo-wrap--36 global y cero !important fuera de @media print
    let global_css = fs::read_to_string(site_root.join("src/styles/global.css"))
        .map_err(|e| e.to_string())?;
    if !global_css.contains("@layer") || !global_css.contains(".smat-logo-wrap--36") {
        return Err("src/styles/global.css debe declarar @layer y exportar .smat-logo-wrap--36 globalmente".to_string());
    }
    let layout_astro = fs::read_to_string(site_root.join("src/layouts/BaseLayout.astro"))
        .map_err(|e| e.to_string())?;
    if layout_astro.contains("!important") {
        return Err("src/layouts/BaseLayout.astro no debe contener !important global".to_string());
    }
    let print_block_re = Regex::new(r"(?is)@media\s+print\s*\{[\s\S]*?\n\}").unwrap();
    for css_rel in [
        "src/styles/global.css",
        "src/styles/cores-apple.css",
        "src/styles/workbench-core.css",
        "src/styles/workbench-circuits-sticky.css",
        "src/styles/workbench-export-solar.css",
        "src/styles/workbench-dossier.css",
    ] {
        let css_raw = fs::read_to_string(site_root.join(css_rel)).map_err(|e| e.to_string())?;
        let non_print = print_block_re.replace_all(&css_raw, "");
        if non_print.contains("!important") {
            return Err(format!("{} conserva !important fuera de @media print", css_rel));
        }
        verify_css_layers_in_text(css_rel, &css_raw)?;
    }

    let product_slug_css = fs::read_to_string(site_root.join("src/styles/productSlugSolar.css"))
        .map_err(|e| e.to_string())?;
    verify_css_layers_in_text("src/styles/productSlugSolar.css", &product_slug_css)?;

    let workbench_barrel = fs::read_to_string(site_root.join("src/styles/workbench.css"))
        .map_err(|e| e.to_string())?;
    for line in workbench_barrel.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("@import") && !trimmed.contains("layer(") {
            return Err(format!("src/styles/workbench.css debe importar con layer(...): {}", trimmed));
        }
    }

    // SLICE-V56-15: Cero placeholders HTML escapados &#10; y cero <button> dentro de <summary>
    let summary_re = Regex::new(r"(?is)<summary\b[^>]*>([\s\S]*?)</summary>").unwrap();
    let button_in_summary_re = Regex::new(r"(?is)<button\b").unwrap();
    for entry in WalkDir::new(site_root.join("src/components"))
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file()
            && entry.path().extension().and_then(|s| s.to_str()) == Some("astro")
        {
            let text = fs::read_to_string(entry.path()).unwrap_or_default();
            if text.contains("&#10;") {
                return Err(format!(
                    "Placeholder HTML escapado '&#10;' prohibido en {}",
                    entry.path().display()
                ));
            }
            for cap in summary_re.captures_iter(&text) {
                if let Some(inner) = cap.get(1) {
                    if button_in_summary_re.is_match(inner.as_str()) {
                        return Err(format!(
                            "Elemento <button> anidado dentro de <summary> prohibido en {}",
                            entry.path().display()
                        ));
                    }
                }
            }
        }
    }

    Ok(())
}

/// Verifica que ninguna hoja CSS declarativa contenga bloques top-level fuera de `@layer`
/// (excepto `@import`, `@layer ...;`, `@media print` y `.hidden` / `[hidden]`).
pub fn verify_css_layers_in_text(css_rel: &str, raw: &str) -> Result<(), String> {
    let comment_re = Regex::new(r"(?s)/\*.*?\*/").unwrap();
    let clean = comment_re.replace_all(raw, "");
    let bytes = clean.as_bytes();
    let mut i = 0usize;
    let mut depth = 0usize;
    let mut header = String::new();

    while i < bytes.len() {
        let ch = bytes[i] as char;
        if depth == 0 {
            if ch == ';' {
                let stmt = header.trim();
                if !stmt.is_empty()
                    && !stmt.starts_with("@layer")
                    && !stmt.starts_with("@import")
                    && !stmt.starts_with("@charset")
                {
                    return Err(format!("Declaración CSS sin capa en {}: '{}'", css_rel, stmt));
                }
                header.clear();
            } else if ch == '{' {
                let hdr = header.trim().replace('\r', " ").replace('\n', " ");
                let is_layer = hdr.starts_with("@layer ") || hdr == "@layer";
                let is_media_print = hdr.starts_with("@media print");
                let is_hidden_rule = hdr.contains(".hidden") || hdr.contains("[hidden]");
                if !is_layer && !is_media_print && !is_hidden_rule {
                    let preview: String = hdr.chars().take(60).collect();
                    return Err(format!(
                        "Regla CSS sin @layer detectada en {}: '{}'",
                        css_rel, preview
                    ));
                }
                header.clear();
                depth = 1;
            } else {
                header.push(ch);
            }
        } else if ch == '{' {
            depth += 1;
        } else if ch == '}' {
            depth -= 1;
        }
        i += 1;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        check_input_first_order,
        verify_css_layers_in_text,
        verify_v58_cores_css_text,
        verify_v59_mobile_cols_css,
        verify_v60_qcard_photo_default,
        verify_v80_dossier_markup,
    };

    #[test]
    fn accepts_valid_layered_css_with_print_and_hidden() {
        let css = r#"
            @layer reset, tokens, base, components, utilities;
            @import './tokens.css' layer(tokens);
            @layer base { a { color: inherit; } }
            @media print { body { color: #000 !important; } }
            .hidden, [hidden] { display: none; }
        "#;
        assert!(verify_css_layers_in_text("test.css", css).is_ok());
    }

    #[test]
    fn rejects_unlayered_component_rule() {
        let bad = r#"
            @layer components { .ok { color: #000; } }
            .rogue-unlayered { color: red; }
        "#;
        assert!(verify_css_layers_in_text("bad.css", bad).is_err());
    }

    #[test]
    fn validates_instrument_shell_input_first_order() {
        let good = r#"<div slot="inputs"></div><div slot="verdict"></div>"#;
        let bad = r#"<div slot="verdict"></div><div slot="inputs"></div>"#;
        assert!(check_input_first_order(good));
        assert!(!check_input_first_order(bad));
    }

    #[test]
    fn rejects_v58_css_order_and_kpi_uppercase() {
        let good = ".smat-instrument-inputs { display: grid; } .instrument-kpi-cell strong { font-weight: 700; }";
        let bad_order = ".smat-instrument-inputs { order: 2; }";
        let bad_case = ".instrument-kpi-cell strong { text-transform: uppercase; }";
        assert!(verify_v58_cores_css_text(good).is_ok());
        assert!(verify_v58_cores_css_text(bad_order).is_err());
        assert!(verify_v58_cores_css_text(bad_case).is_err());
    }

    #[test]
    fn enforces_v59_xray_optin_and_mobile_single_col() {
        assert!(verify_v59_mobile_cols_css(".smat-inputs-2col { display: grid; grid-template-columns: minmax(0, 1fr); }").is_ok());
        assert!(verify_v59_mobile_cols_css(".smat-inputs-2col { grid-template-columns: repeat(2, minmax(0, 1fr)); }").is_err());
    }

    #[test]
    fn enforces_v60_storefront_card_and_photo_tab_default() {
        assert!(verify_v60_qcard_photo_default("<button data-qcard-tab=\"photo\" aria-selected=\"true\">Foto</button>").is_ok());
        assert!(verify_v60_qcard_photo_default("<button data-qcard-tab=\"svg\">Plano</button>").is_err());
    }

    #[test]
    fn enforces_v80_zero_dossier_duplicate_cta_and_synthetic_sku() {
        assert!(verify_v80_dossier_markup("<a href=\"/catalogo/\">Ver catálogo</a>").is_ok());
        assert!(verify_v80_dossier_markup("<button data-add-tray-sku=\"X\">Agregar</button>").is_err());
        assert!(verify_v80_dossier_markup("<span>SMAT-PUMP-6X4-WETKIT</span>").is_err());
    }
}
