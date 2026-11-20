use regex::Regex;
use std::collections::HashSet;
use std::fs;
use std::path::Path;

fn parse_hex_rgb(hex: &str) -> Option<(u8, u8, u8)> {
    let clean = hex.trim().trim_start_matches('#');
    if clean.len() != 6 {
        return None;
    }
    let r = u8::from_str_radix(&clean[0..2], 16).ok()?;
    let g = u8::from_str_radix(&clean[2..4], 16).ok()?;
    let b = u8::from_str_radix(&clean[4..6], 16).ok()?;
    Some((r, g, b))
}

fn linearize_wcag(channel: u8) -> f64 {
    let c = f64::from(channel) / 255.0;
    if c <= 0.03928 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}

pub fn relative_luminance_wcag(hex: &str) -> Option<f64> {
    let (r, g, b) = parse_hex_rgb(hex)?;
    Some(0.2126 * linearize_wcag(r) + 0.7152 * linearize_wcag(g) + 0.0722 * linearize_wcag(b))
}

pub fn contrast_ratio_wcag(fg_hex: &str, bg_hex: &str) -> Option<f64> {
    let l1 = relative_luminance_wcag(fg_hex)?;
    let l2 = relative_luminance_wcag(bg_hex)?;
    let (hi, lo) = if l1 >= l2 { (l1, l2) } else { (l2, l1) };
    Some((hi + 0.05) / (lo + 0.05))
}

fn apca_luminance(hex: &str) -> Option<f64> {
    let (r, g, b) = parse_hex_rgb(hex)?;
    let yr = (f64::from(r) / 255.0).powf(2.4);
    let yg = (f64::from(g) / 255.0).powf(2.4);
    let yb = (f64::from(b) / 255.0).powf(2.4);
    let y = 0.2126729 * yr + 0.7151522 * yg + 0.0721750 * yb;
    if y >= 0.022 {
        Some(y)
    } else {
        Some(y + (0.022 - y).powf(1.414))
    }
}

/// APCA-W3 0.0.98G-4g contrast magnitude (`|Lc|`, 0..108).
pub fn apca_lc_magnitude(fg_hex: &str, bg_hex: &str) -> Option<f64> {
    let y_txt = apca_luminance(fg_hex)?;
    let y_bg = apca_luminance(bg_hex)?;
    if (y_bg - y_txt).abs() < 0.0005 {
        return Some(0.0);
    }
    let lc = if y_bg > y_txt {
        let sapc = (y_bg.powf(0.56) - y_txt.powf(0.57)) * 1.14;
        if sapc < 0.1 {
            0.0
        } else {
            (sapc - 0.027) * 100.0
        }
    } else {
        let sapc = (y_bg.powf(0.65) - y_txt.powf(0.62)) * 1.14;
        if sapc > -0.1 {
            0.0
        } else {
            (sapc + 0.027) * 100.0
        }
    };
    Some(lc.abs())
}

fn read_text(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("No se pudo leer {}: {}", path.display(), e))
}

fn check_solar_pairs() -> Result<(), String> {
    let pairs = [
        ("#7c2d12", "#ffffff", "copper accent ink on pure white"),
        ("#7c2d12", "#f8fafc", "copper accent ink on solar canvas"),
        ("#ffffff", "#7c2d12", "white label on primary button"),
        ("#ffffff", "#431407", "white label on primary hover"),
        ("#064e3b", "#ecfdf5", "emerald ink on emerald badge bg"),
        ("#064e3b", "#ffffff", "emerald ink on pure white"),
        ("#0c4a6e", "#eff6ff", "sky ink on info badge bg"),
        ("#0c4a6e", "#f8fafc", "sky ink on solar canvas"),
        ("#334155", "#f8fafc", "muted slate ink on solar canvas"),
        ("#334155", "#fffbeb", "muted slate ink on warm amber bg"),
        ("#0f172a", "#ffffff", "primary ink on white"),
    ];
    for (fg, bg, desc) in pairs {
        let cr = contrast_ratio_wcag(fg, bg)
            .ok_or_else(|| format!("Color hex invalido en par {}: {} / {}", desc, fg, bg))?;
        let lc = apca_lc_magnitude(fg, bg)
            .ok_or_else(|| format!("Color hex APCA invalido en par {}: {} / {}", desc, fg, bg))?;
        if cr < 7.0 || lc < 75.0 {
            return Err(format!(
                "Gate 48J fallido ({}): {} sobre {} obtuvo WCAG {:.2}:1 (< 7.0:1) o APCA |Lc|={:.1} (< 75)",
                desc, fg, bg, cr, lc
            ));
        }
    }
    Ok(())
}

pub fn check_v481_solar_contrast_token_closure_and_tour27_gate_48j(
    site_root: &Path,
) -> Result<(), String> {
    check_solar_pairs()?;

    let tokens_css = read_text(&site_root.join("src/styles/tokens.css"))?;
    let global_css = read_text(&site_root.join("src/styles/global.css"))?;
    let slug_css = read_text(&site_root.join("src/styles/productSlugSolar.css"))?;
    let cyclone_astro = read_text(&site_root.join("src/components/CycloneAndScreenReport.astro"))?;

    let css_roots = format!("{}\n{}", tokens_css, global_css);
    let required_tokens = [
        "--smat-solar-accent",
        "--smat-solar-emerald",
        "--smat-solar-sky-ink",
        "--smat-solar-amber-border",
        "--smat-solar-emerald-border",
        "--smat-hero-pad-y",
        "--smat-h1-op",
        "--smat-stage-pad-top",
    ];
    let re_decl = Regex::new(r"(--smat-[a-z0-9-]+)\s*:").map_err(|e| e.to_string())?;
    let declared_vars: HashSet<String> = re_decl
        .captures_iter(&css_roots)
        .map(|c| c[1].to_string())
        .collect();
    for req in required_tokens {
        if !declared_vars.contains(req) {
            return Err(format!(
                "Gate 48J (DEB-V481-01): Variable CSS soberana {} no declarada en :root (tokens.css / global.css)",
                req
            ));
        }
    }

    let re_usage = Regex::new(r"var\(\s*(--smat-(?:solar|hero|h1|stage)[a-z0-9-]*)").map_err(|e| e.to_string())?;
    for (src_name, src_body) in [
        ("tokens.css", &tokens_css),
        ("global.css", &global_css),
        ("productSlugSolar.css", &slug_css),
        ("CycloneAndScreenReport.astro", &cyclone_astro),
    ] {
        for cap in re_usage.captures_iter(src_body) {
            let var_name = &cap[1];
            if !declared_vars.contains(var_name) {
                return Err(format!(
                    "Gate 48J (DEB-V481-01): Variable fantasma var({}) usada en {} sin declaracion en :root",
                    var_name, src_name
                ));
            }
        }
    }

    // Bloqueo de literales de bajo contraste solar (< 7.0:1 AAA) en superficies auditadas
    let audited_solar_surfaces = [
        ("CycloneAndScreenReport.astro", cyclone_astro),
        ("productSlugSolar.css", slug_css.clone()),
        (
            "equipos/index.astro",
            crate::read_page_with_islands_composite(site_root, "src/pages/equipos/index.astro")?,
        ),
        (
            "en/process-equipment/index.astro",
            crate::read_page_with_islands_composite(site_root, "src/pages/en/process-equipment/index.astro")?,
        ),
        (
            "clasificacion/index.astro",
            crate::read_page_with_islands_composite(site_root, "src/pages/clasificacion/index.astro")?,
        ),
        (
            "en/classification/index.astro",
            crate::read_page_with_islands_composite(site_root, "src/pages/en/classification/index.astro")?,
        ),
    ];
    for (fname, content) in &audited_solar_surfaces {
        let lower = content.to_ascii_lowercase();
        for forbidden in ["#d97706", "#b45309", "#047857", "#0369a1"] {
            if lower.contains(forbidden) {
                return Err(format!(
                    "Gate 48J (D3-V481): Color sub-AAA prohibido {} detectado en {}",
                    forbidden, fname
                ));
            }
        }
        if fname.contains("equipos") || fname.contains("process-equipment") {
            if lower.contains("#9a3412") {
                return Err(format!(
                    "Gate 48J (D3-V481): #9a3412 sobre #f8fafc (< 7.0:1 AAA) presente en {}",
                    fname
                ));
            }
        }
    }

    // DEB-V50-04: Cero literales ámbar/naranja sub-AAA en src/scripts/*.js
    let scripts_dir = site_root.join("src/scripts");
    if let Ok(entries) = fs::read_dir(&scripts_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("js") {
                let js_src = read_text(&path)?;
                let lower = js_src.to_ascii_lowercase();
                for forbidden_js_hex in ["#b45309", "#d97706", "#92400e"] {
                    if lower.contains(forbidden_js_hex) {
                        return Err(format!(
                            "Gate 48J (DEB-V50-04): Color sub-AAA/legado prohibido {} detectado en {}",
                            forbidden_js_hex,
                            path.file_name().and_then(|s| s.to_str()).unwrap_or("script.js")
                        ));
                    }
                }
            }
        }
    }

    // Purga DEB-V481-02: ambos [slug].astro importan productSlugSolar.css y bajan de 550 LOC
    if slug_css.lines().count() < 150 {
        return Err("Gate 48J (DEB-V481-02): productSlugSolar.css parece incompleto".to_string());
    }
    for slug_rel in ["src/pages/productos/[slug].astro", "src/pages/en/products/[slug].astro"] {
        let slug_src = read_text(&site_root.join(slug_rel))?;
        let line_count = slug_src.lines().count();
        if !slug_src.contains("productSlugSolar.css") {
            return Err(format!(
                "Gate 48J (DEB-V481-02): {} debe importar styles/productSlugSolar.css",
                slug_rel
            ));
        }
        if line_count >= 550 {
            return Err(format!(
                "Gate 48J (DEB-V481-02): {} excede el limite de extraccion CSS ({} >= 550 LOC)",
                slug_rel, line_count
            ));
        }
        if !slug_src.contains("id=\"stratum1-slug-card\"") {
            return Err(format!(
                "Gate 48J (D2-V481): {} debe declarar id=\"stratum1-slug-card\"",
                slug_rel
            ));
        }
    }

    // Cobertura Estrato 1 IDs y Display-First encima de inputs 2-col
    let expected_ids = [
        ("src/pages/equipos/index.astro", "stratum1-equipos-search"),
        ("src/pages/en/process-equipment/index.astro", "stratum1-equipos-search"),
        ("src/pages/garantia.astro", "stratum1-warranty-trust"),
        ("src/pages/en/warranty.astro", "stratum1-warranty-trust"),
        ("src/pages/catalogo.astro", "stratum1-dropin-verifier"),
        ("src/pages/en/catalog.astro", "stratum1-dropin-verifier"),
        ("src/pages/catalogo/[code].astro", "stratum1-atomic-code-card"),
        ("src/pages/en/catalog/[code].astro", "stratum1-atomic-code-card"),
        ("src/pages/control-de-procesos/index.astro", "metrology-calculator"),
        ("src/pages/en/process-control/index.astro", "metrology-calculator"),
    ];
    for (rel, id_val) in expected_ids {
        let html = crate::read_page_with_islands_composite(site_root, rel)?;
        if !html.contains(&format!("id=\"{}\"", id_val)) && !html.contains(id_val) {
            return Err(format!(
                "Gate 48J (D2-V481): Falta id=\"{}\" en {}",
                id_val, rel
            ));
        }
    }

    let display_first_subpages = [
        ("src/pages/bombeo/impulsor.astro", "stratum1-impeller-sim"),
        ("src/pages/en/pumping/impeller.astro", "stratum1-impeller-sim"),
        ("src/pages/bombeo/revestimientos.astro", "stratum1-liners-sim"),
        ("src/pages/en/pumping/liners.astro", "stratum1-liners-sim"),
        ("src/pages/bombeo/sello.astro", "stratum1-seal-sim"),
        ("src/pages/en/pumping/seal.astro", "stratum1-seal-sim"),
        ("src/pages/bombeo/soporte.astro", "stratum1-bearing-inspector"),
        ("src/pages/en/pumping/bearing-assembly.astro", "stratum1-bearing-inspector"),
        ("src/pages/filtracion/prensa.astro", "stratum1-press-sim"),
        ("src/pages/en/filtration/press.astro", "stratum1-press-sim"),
        ("src/pages/filtracion/repuestos.astro", "stratum1-parts-sim"),
        ("src/pages/en/filtration/parts.astro", "stratum1-parts-sim"),
        ("src/pages/flotacion/celdas.astro", "stratum1-cells-sim"),
        ("src/pages/en/flotation/cells.astro", "stratum1-cells-sim"),
        ("src/pages/flotacion/mecanismos.astro", "stratum1-mechanisms-sim"),
        ("src/pages/en/flotation/mechanisms.astro", "stratum1-mechanisms-sim"),
    ];
    for (rel, id_val) in display_first_subpages {
        let src = crate::read_page_with_islands_composite(site_root, rel)?;
        if !src.contains(&format!("id=\"{}\"", id_val)) && !src.contains(id_val) {
            return Err(format!(
                "Gate 48J (D2-V481): Falta id=\"{}\" en {}",
                id_val, rel
            ));
        }
        let standalone_src = src
            .find("data-island-standalone")
            .map(|i| &src[i..])
            .unwrap_or(&src);
        let disp_pos = standalone_src.find("smat-stratum1-display").ok_or_else(|| {
            format!("Gate 48J (D2-V481): Falta banda Display-First .smat-stratum1-display en {}", rel)
        })?;
        let inputs_pos = standalone_src.find("smat-inputs-2col").ok_or_else(|| {
            format!("Gate 48J (D1-V481): Falta grid .smat-inputs-2col en {}", rel)
        })?;
        if disp_pos >= inputs_pos {
            return Err(format!(
                "Gate 48J (D2-V481): En {}, .smat-stratum1-display debe aparecer ANTES de .smat-inputs-2col",
                rel
            ));
        }
    }

    // Cobertura 27/27 en ergos/tour.toml sin centinelas muertos ni de transición
    let project_root = site_root
        .parent()
        .ok_or_else(|| "No se pudo resolver raiz SMAT desde site_root".to_string())?;
    let tour_toml = read_text(&project_root.join("ergos/tour.toml"))?;
    if !tour_toml.contains("auto_discover_routes = true") {
        return Err("Gate 48J (D4-V481): ergos/tour.toml debe declarar auto_discover_routes = true".to_string());
    }
    let acts_count = tour_toml.matches("[[acts]]").count();
    if acts_count < 27 {
        return Err(format!(
            "Gate 48J (D4-V481): ergos/tour.toml debe cubrir >= 27 actos (encontrados: {})",
            acts_count
        ));
    }
    if !tour_toml.contains("wait_selector = \".showcase-card\"")
        || !tour_toml.contains("wait_selector = \"#metrology-calculator\"")
    {
        return Err(
            "Gate 48J (D4-V481): tour.toml debe conservar .showcase-card en act_1_home y usar #metrology-calculator en act_3_metrology"
                .to_string(),
        );
    }
    for forbidden_sel in [
        "#balanza-marcy",
        "#flight-deck",
        ".door-card",
        "#copy-toast",
        "#planta_durango",
        "#expeller_seal",
    ] {
        if tour_toml.contains(forbidden_sel) {
            return Err(format!(
                "Gate 48J (DEB-V481-05): Selector prohibido/obsoleto {} en ergos/tour.toml",
                forbidden_sel
            ));
        }
    }

    // Purga DEB-V481-07 en verticalBidirectionalHydrationLens.js
    let lens_js = read_text(&site_root.join("src/scripts/verticalBidirectionalHydrationLens.js"))?;
    if lens_js.contains("const hydration =") {
        return Err(
            "Gate 48J (DEB-V481-07): Binding muerto `const hydration =` presente en verticalBidirectionalHydrationLens.js"
                .to_string(),
        );
    }

    Ok(())
}
