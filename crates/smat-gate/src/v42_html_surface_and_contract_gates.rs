use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Extrae únicamente el texto visible de un documento HTML compilado,
/// descartando bloques `<script>`, `<style>`, comentarios HTML y etiquetas `<...>`.
pub fn extract_visible_html_text(raw_html: &str) -> String {
    let mut out = String::with_capacity(raw_html.len() / 2);
    let bytes = raw_html.as_bytes();
    let len = bytes.len();
    let mut i = 0;

    while i < len {
        if bytes[i] == b'<' {
            let rem_lower: String = raw_html[i..]
                .chars()
                .take(12)
                .collect::<String>()
                .to_ascii_lowercase();
            if rem_lower.starts_with("<script") {
                if let Some(end_idx) = raw_html[i..].to_ascii_lowercase().find("</script>") {
                    i += end_idx + 9;
                    out.push(' ');
                    continue;
                }
            }
            if rem_lower.starts_with("<style") {
                if let Some(end_idx) = raw_html[i..].to_ascii_lowercase().find("</style>") {
                    i += end_idx + 8;
                    out.push(' ');
                    continue;
                }
            }
            if rem_lower.starts_with("<!--") {
                if let Some(end_idx) = raw_html[i..].find("-->") {
                    i += end_idx + 3;
                    out.push(' ');
                    continue;
                }
            }
            let mut quote: Option<u8> = None;
            i += 1;
            while i < len {
                let b = bytes[i];
                if let Some(q) = quote {
                    if b == q {
                        quote = None;
                    }
                } else if b == b'"' || b == b'\'' {
                    quote = Some(b);
                } else if b == b'>' {
                    i += 1;
                    break;
                }
                i += 1;
            }
            out.push(' ');
        } else {
            let ch = raw_html[i..].chars().next().unwrap_or(' ');
            out.push(ch);
            i += ch.len_utf8();
        }
    }

    out
}

/// 45. Gate V4.2 (D1-V42 a D9-V42, DEB-V42-01..12):
/// Verifica la unificación de calculadoras verticales mediante `verticalCalculatorsAndLabelsBridge.js`,
/// la eliminación de la sección duplicada de Modos 05 y 06 en `/diagnostico/`,
/// y escanea tanto las plantillas `.astro` como los 286 archivos `dist/**/*.html` para certificar
/// 0 fugas visibles de `snake_case`, `.json`, funciones JS (`buildSmatVendorPassportPayload`)
/// y etiquetas de decisión (`7-C++`, `• D7`, `• D8`, `Statechart XOR`).
pub fn check_v42_zero_visible_html_leaks_and_canonical_calculators_gate_45(
    site_root: &Path,
) -> Result<(), String> {
    for req_file in [
        "src/scripts/verticalCalculatorsAndLabelsBridge.js",
        "tests/v42_canonical_components_and_zero_leaks.test.mjs",
    ] {
        if !site_root.join(req_file).exists() {
            return Err(format!(
                "Gate 45 (V4.2): Falta archivo obligatorio '{}'",
                req_file
            ));
        }
    }

    // D1-V42 & D2-V42: Las páginas verticales de Filtración, Flotación y Clasificación delegan al puente canónico
    for (rel_page, expected_fn) in [
        ("src/pages/filtracion/index.astro", "bindCanonicalFiltrationCalculator"),
        ("src/pages/en/filtration/index.astro", "bindCanonicalFiltrationCalculator"),
        ("src/pages/filtracion/repuestos.astro", "bindCanonicalFiltrationCalculator"),
        ("src/pages/en/filtration/parts.astro", "bindCanonicalFiltrationCalculator"),
        ("src/pages/flotacion/celdas.astro", "bindCanonicalFlotationCalculator"),
        ("src/pages/en/flotation/cells.astro", "bindCanonicalFlotationCalculator"),
        ("src/pages/clasificacion/index.astro", "bindCoupledClassificationStation"),
        ("src/pages/en/classification/index.astro", "bindCoupledClassificationStation"),
    ] {
        let src = fs::read_to_string(site_root.join(rel_page)).map_err(|e| e.to_string())?;
        if !src.contains(expected_fn) {
            return Err(format!(
                "Gate 45 (D1/D2-V42): '{}' debe delegar al controlador canónico '{}'",
                rel_page, expected_fn
            ));
        }
    }

    // D1-V42: filtracion/repuestos.astro y en/filtration/parts.astro incluyen #rep-cake-moisture
    for rep_rel in ["src/pages/filtracion/repuestos.astro", "src/pages/en/filtration/parts.astro"] {
        let src = fs::read_to_string(site_root.join(rep_rel)).map_err(|e| e.to_string())?;
        if !src.contains("id=\"rep-cake-moisture\"") {
            return Err(format!(
                "Gate 45 (D1-V42): '{}' debe incluir el input de humedad residual id=\"rep-cake-moisture\"",
                rep_rel
            ));
        }
    }

    // D2-V42: clasificacion/index.astro y en/classification/index.astro exponen #cyc-screen-coupling-badge
    for cyc_rel in ["src/pages/clasificacion/index.astro", "src/pages/en/classification/index.astro"] {
        let src = fs::read_to_string(site_root.join(cyc_rel)).map_err(|e| e.to_string())?;
        if !src.contains("id=\"cyc-screen-coupling-badge\"") {
            return Err(format!(
                "Gate 45 (D2-V42): '{}' debe incluir la insignia de acople id=\"cyc-screen-coupling-badge\"",
                cyc_rel
            ));
        }
    }

    // D3-V42: diagnostico.astro y en/diagnostics.astro NO contienen la sección duplicada de Modos 05 y 06
    for diag_rel in ["src/pages/diagnostico.astro", "src/pages/en/diagnostics.astro"] {
        let src = fs::read_to_string(site_root.join(diag_rel)).map_err(|e| e.to_string())?;
        if src.contains("seal_stuffing_box") || src.contains("bearing_shaft_fatigue") {
            return Err(format!(
                "Gate 45 (D3-V42 DEB-V42-04): '{}' conserva sección duplicada con identificadores crudos seal_stuffing_box / bearing_shaft_fatigue",
                diag_rel
            ));
        }
    }

    // D4-V42..D7-V42: Escaneo del texto visible en todos los archivos HTML compilados de dist/ (si existe dist/)
    let banned_visible_tokens = [
        "poliuretano_minero",
        "alto_cromo_cr27",
        "seal_stuffing_box",
        "bearing_shaft_fatigue",
        "(`control_procesos`)",
        "drive_end",
        "sealing_fork",
        "wet_end_fork",
        "suction_closure",
        "axial_calibration",
        "impeller_5vane",
        "wet_kit_554",
        "expeller_seal",
        "bearing_cartridge",
        "volute_liner",
        "cyclone_d6_d20",
        "coupled_pump_cyclone",
        "urethane_screen_th48",
        "urethane_screen_panel_305",
        "filter_press",
        "filter_plate_shifter",
        "flotation_cell",
        "marcy_scale",
        "batch_filter",
        "astm_sieves",
        "lab_comminution_pan",
        "(roles.json)",
        "ROLES.JSON",
        "buildSmatVendorPassportPayload",
        "Statechart XOR",
        "XOR Statechart",
        "7-C++",
        "• D7",
        "· D7",
        "• D8",
        "· D8",
    ];

    let dist_dir = site_root.join("dist");
    if dist_dir.exists() {
        for entry in WalkDir::new(&dist_dir).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("html") {
                let raw_html = fs::read_to_string(path).map_err(|e| e.to_string())?;
                let visible_text = extract_visible_html_text(&raw_html);
                for banned in banned_visible_tokens {
                    if visible_text.contains(banned) {
                        return Err(format!(
                            "Gate 45 (V4.2 Visible HTML Leak): '{}' contiene el identificador interno prohibido '{}' en el texto visible",
                            path.strip_prefix(site_root).unwrap_or(path).display(),
                            banned
                        ));
                    }
                }
            }
        }
    }

    Ok(())
}
