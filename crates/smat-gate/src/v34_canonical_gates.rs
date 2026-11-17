use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

/// 34. Gate V3.4 (D1-V34, D2-V34, D7-V34, DEB-V34-01..03):
/// Verifica exhaustividad 16/16 de diagram_id en build_product_images.mjs, biyección 19/19 de fotos y 0 archivos .webp huérfanos.
pub fn check_v34_svg_exhaustiveness_and_zero_orphan_webp(site_root: &Path) -> Result<(), String> {
    let builder_src = fs::read_to_string(site_root.join("tools/build_product_images.mjs"))
        .map_err(|e| e.to_string())?;
    for req_diagram in [
        "impeller_5vane",
        "material_kit_grid",
        "expeller_seal",
        "bearing_cartridge",
        "cyclone_apex",
        "cyclone_d6_d20",
        "coupled_pump_cyclone",
        "urethane_screen_panel_305",
        "urethane_screen_th48",
        "flotation_cell",
        "pinch_knife_valve",
        "marcy_scale",
        "astm_sieves",
        "lab_comminution_pan",
        "batch_filter",
        "filter_press",
        "filter_plate_shifter",
    ] {
        if !builder_src.contains(req_diagram) {
            return Err(format!(
                "D2-V34 (DEB-V34-02): tools/build_product_images.mjs carece de rama CAD SVG explicita '{}'",
                req_diagram
            ));
        }
    }
    if builder_src.contains("for (const alias of (sku.slug_aliases") {
        return Err("D7-V34 (DEB-V34-03): tools/build_product_images.mjs aun contiene bucle de escritura de alias .webp".to_string());
    }

    let prod_img_dir = site_root.join("public/images/productos");
    let mut webp_count = 0usize;
    for entry in fs::read_dir(&prod_img_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().extension().and_then(|s| s.to_str()) == Some("webp") {
            webp_count += 1;
        }
    }
    if webp_count != 19 {
        return Err(format!(
            "D7-V34 (DEB-V34-03): public/images/productos/ debe contener exactamente 19 archivos .webp canonicos, encontrados: {}",
            webp_count
        ));
    }

    Ok(())
}

/// 35. Gate V3.4 (D3-V34, DEB-V34-04):
/// Verifica pureza ontológica de SKUs de laboratorio (0 alias de válvulas en SMAT-LAB-PULV-DISC y SMAT-LAB-FILTRO-BATCH) y diagram_id de SMAT-SCR-MOD-1X1.
pub fn check_v34_lab_sku_domain_purity(site_root: &Path) -> Result<(), String> {
    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json"))
        .map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr
        .as_array()
        .ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;

    for sku in skus {
        let id = sku.get("sku_id").and_then(|v| v.as_str()).unwrap_or("");
        if id == "SMAT-LAB-PULV-DISC" || id == "SMAT-LAB-FILTRO-BATCH" {
            let raw_sku = serde_json::to_string(sku).unwrap_or_default();
            for forbidden in [
                "valvula-pinch",
                "valvula-cuchilla",
                "pinch-valve",
                "knife-gate-valve",
                "pinch-knife-valve",
                "avenida_4_flotacion_valvulas",
            ] {
                if raw_sku.contains(forbidden) {
                    return Err(format!(
                        "D3-V34 (DEB-V34-04): SKU de laboratorio '{}' aun contiene contaminacion de valvulas '{}'",
                        id, forbidden
                    ));
                }
            }
        }
        if id == "SMAT-SCR-MOD-1X1" {
            let diag_id = sku.get("diagram_id").and_then(|v| v.as_str()).unwrap_or("");
            if diag_id != "urethane_screen_panel_305" {
                return Err(format!(
                    "D2-V34: SMAT-SCR-MOD-1X1 debe usar diagram_id 'urethane_screen_panel_305', encontrado: '{}'",
                    diag_id
                ));
            }
        }
    }

    Ok(())
}

/// 36. Gate V3.4 (D4-V34, DEB-V34-05):
/// Verifica cierre 100% de rutas SSG en /catalogo/[code] y /en/catalog/[code] (9 códigos con aleación + 7 slugs descriptivos) y 0 enlaces rotos en /clasificacion/.
pub fn check_v34_atomic_catalog_and_hub_link_closure(site_root: &Path) -> Result<(), String> {
    let cat_es = fs::read_to_string(site_root.join("src/pages/catalogo/[code].astro"))
        .map_err(|e| e.to_string())?
        .to_lowercase();
    let cat_en = fs::read_to_string(site_root.join("src/pages/en/catalog/[code].astro"))
        .map_err(|e| e.to_string())?
        .to_lowercase();

    for alloy_code in [
        "d3147-a05",
        "d3147-r55",
        "e4147-a05",
        "e4147-r55",
        "f6147-a05",
        "dam028-a05",
        "eam028-a05",
        "e4083-a05",
        "e4083-r55",
    ] {
        if !cat_es.contains(alloy_code) || !cat_en.contains(alloy_code) {
            return Err(format!(
                "D4-V34: catalogo/[code].astro o en/catalog/[code].astro carece del codigo compuesto '{}'",
                alloy_code
            ));
        }
    }

    for slug_es in [
        "voluta-revestimiento",
        "cartucho-rodamientos",
        "anillo-expulsor",
        "camisa-flecha",
        "empaque-prensaestopa",
        "flecha-principal",
        "sellos-laberinto",
    ] {
        if !cat_es.contains(slug_es) {
            return Err(format!(
                "D4-V34: src/pages/catalogo/[code].astro carece del slug descriptivo '{}'",
                slug_es
            ));
        }
    }

    for slug_en in [
        "volute-liner",
        "bearing-assembly-cartridge",
        "expeller-ring",
        "shaft-sleeve",
        "gland-packing",
        "main-shaft",
        "labyrinth-seals",
    ] {
        if !cat_en.contains(slug_en) {
            return Err(format!(
                "D4-V34: src/pages/en/catalog/[code].astro carece del slug descriptivo '{}'",
                slug_en
            ));
        }
    }

    let clasif_es = fs::read_to_string(site_root.join("src/pages/clasificacion/index.astro"))
        .map_err(|e| e.to_string())?;
    let clasif_en = fs::read_to_string(site_root.join("src/pages/en/classification/index.astro"))
        .map_err(|e| e.to_string())?;
    if clasif_es.contains("/productos/paquete-casado-bomba-ciclones/") {
        return Err("D4-V34 (DEB-V34-05): src/pages/clasificacion/index.astro aun contiene enlace roto /productos/paquete-casado-bomba-ciclones/".to_string());
    }
    if clasif_en.contains("/en/products/coupled-slurry-pump-cyclone-package/") {
        return Err("D4-V34 (DEB-V34-05): src/pages/en/classification/index.astro aun contiene enlace roto /en/products/coupled-slurry-pump-cyclone-package/".to_string());
    }

    Ok(())
}

/// 37. Gate V3.4 (D5-V34, D6-V34, D8-V34, DEB-V34-06..09):
/// Verifica Dual CTA + hidratación ?reorder=1 en QuickOrderTray, índice cμ en ProductQuickCard, 0 SKU-QC-01 en thank-you.astro y costuras LCOM4 <= 900 LOC.
pub fn check_v34_qtray_dual_cta_qcard_cmu_and_reorder_hydration(
    site_root: &Path,
) -> Result<(), String> {
    let qtray = fs::read_to_string(site_root.join("src/components/QuickOrderTray.astro"))
        .map_err(|e| e.to_string())?;
    for req_tray in [
        "id=\"smat-qtray-pdf-link\"",
        "data-qtray-qty-delta=\"-1\"",
        "data-qtray-qty-delta=\"1\"",
        "updateTrayItemQty",
        "hydrateTrayFromReorderQuery",
    ] {
        if !qtray.contains(req_tray) {
            return Err(format!(
                "D5-V34: QuickOrderTray.astro carece de '{}'",
                req_tray
            ));
        }
    }

    let qcard = fs::read_to_string(site_root.join("src/components/ProductQuickCard.astro"))
        .map_err(|e| e.to_string())?;
    if !qcard.contains("[SMAT-DGO | PRIORIDAD-cμ") {
        return Err("D6-V34: ProductQuickCard.astro no inyecta [SMAT-DGO | PRIORIDAD-cμ en el enlace WhatsApp".to_string());
    }

    let ty_en = fs::read_to_string(site_root.join("src/pages/en/thank-you.astro"))
        .map_err(|e| e.to_string())?;
    if ty_en.contains("SKU-QC-01") {
        return Err("D6-V34 (DEB-V34-06): src/pages/en/thank-you.astro aun contiene el fallback legado 'SKU-QC-01'".to_string());
    }

    for seam_rel in [
        "src/scripts/districtProfilesAndSkuCatalog.js",
        "src/scripts/sapAndLeadExportEngine.js",
        "src/scripts/tribologyAndCompatibilityEngine.js",
        "src/scripts/pumpAssemblyAndDriveEngine.js",
    ] {
        let p = site_root.join(seam_rel);
        if !p.exists() {
            return Err(format!(
                "D8-V34: Falta modulo extraido por costura LCOM4 '{}'",
                seam_rel
            ));
        }
        let loc = fs::read_to_string(&p)
            .map_err(|e| e.to_string())?
            .lines()
            .count();
        if loc > 900 {
            return Err(format!(
                "D8-V34 (DEB-V34-07/08): '{}' excede 900 LOC ({} lineas)",
                seam_rel, loc
            ));
        }
    }

    Ok(())
}

/// 38. Gate V3.5 (D1-V35 a D12-V35, DEB-V35-01..14):
/// Verifica clausura 1-hop en _redirects, puente Plano 1 <-> Plano 2 (?sku=SMAT-*, ?mat=),
/// simuladores interactivos Plano 3 en <script>, pureza 3NF en fichas /productos/[slug]/,
/// tabla multi-partida polimórfica SAT/JRP en /acuse/, mapeo 1:1 D3147/F6147, 0 cutwater y costuras ∂(C)=0.
pub fn check_v35_zero_orphan_ast_and_dist_graph_closure(site_root: &Path) -> Result<(), String> {
    // 1. D1-V35: 0 cadenas 2-hop en public/_redirects y 0 targets a valvulas eliminadas
    let redirects_raw = fs::read_to_string(site_root.join("public/_redirects"))
        .map_err(|e| e.to_string())?;
    let mut redirect_map = BTreeMap::new();
    for line in redirects_raw.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 2 {
            let src = parts[0].trim_end_matches('/');
            let dst = parts[1].split('#').next().unwrap_or(parts[1]).trim_end_matches('/');
            redirect_map.insert(src.to_string(), dst.to_string());
        }
    }
    for (src, dst) in &redirect_map {
        if let Some(hop2) = redirect_map.get(dst) {
            return Err(format!(
                "D1-V35 (DEB-V35-02): Cadena de redireccion 2-hop prohibida en _redirects: {} -> {} -> {}",
                src, dst, hop2
            ));
        }
        if dst.contains("manga-elastomero-valvula-pinch-lodos")
            || dst.contains("valvula-guillotina-bidireccional-lodos")
            || dst.contains("pinch-valve-elastomer-sleeve-slurry")
            || dst.contains("bidirectional-knife-gate-valve-slurry")
        {
            return Err(format!(
                "D1-V35 (DEB-V35-02): _redirects apunta a ruta de valvula eliminada: {} -> {}",
                src, dst
            ));
        }
    }

    // 2. D2-V35: Puente Plano 1 <-> Plano 2 (?sku=SMAT-*, ?mat=, hidrociclon_apex_vortex)
    let dist_src = fs::read_to_string(site_root.join("src/scripts/districtProfilesAndSkuCatalog.js"))
        .map_err(|e| e.to_string())?;
    if !dist_src.contains("skuRoleMap") || !dist_src.contains("hidrociclon_apex_vortex") {
        return Err("D2-V35: districtProfilesAndSkuCatalog.js carece de skuRoleMap o hidrociclon_apex_vortex".to_string());
    }
    let qw_src = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
        .map_err(|e| e.to_string())?;
    if !qw_src.contains("value=\"hidrociclon_apex_vortex\"") || !qw_src.contains("value=\"malla_criba_poliuretano\"") {
        return Err("D2-V35: QuoteWizard.astro carece de opciones hidrociclon_apex_vortex / malla_criba_poliuretano".to_string());
    }

    // 3. D3-V35: Simuladores interactivos Plano 3 invocados en <script> real (no en <code> muerto)
    for (rel_page, req_fn) in [
        ("src/pages/flotacion/celdas.astro", "calculateFlotationGorainKineticRate"),
        ("src/pages/en/flotation/cells.astro", "calculateFlotationGorainKineticRate"),
        ("src/pages/filtracion/repuestos.astro", "evaluateFilterPressPlateDeflection"),
        ("src/pages/en/filtration/parts.astro", "evaluateFilterPressPlateDeflection"),
        ("src/components/CycloneAndScreenReport.astro", "calculateUrethaneScreenPartitionWeibull"),
        ("src/components/QuickOrderTray.astro", "calculateCoupledReorderWindowDays"),
    ] {
        let src = fs::read_to_string(site_root.join(rel_page)).map_err(|e| e.to_string())?;
        if !src.contains(req_fn) || src.contains("Runtime Proof: evaluate") {
            return Err(format!(
                "D3-V35 (DEB-V35-03/04): {} debe invocar '{}' en un <script> real sin bloque <code> muerto",
                rel_page, req_fn
            ));
        }
    }

    // 4. D4-V35 & D5-V35: Par casado JRP en las 19 fichas y Tabla Multi-Partida en /acuse/
    for prod_rel in ["src/pages/productos/[slug].astro", "src/pages/en/products/[slug].astro"] {
        let prod_src = fs::read_to_string(site_root.join(prod_rel)).map_err(|e| e.to_string())?;
        if !prod_src.contains("data-coupled-sku") || (!prod_src.contains("/cotizar/?sku=") && !prod_src.contains("/en/quote/?sku=")) {
            return Err(format!(
                "D4-V35: {} carece de tarjeta de Par Casado JRP (data-coupled-sku) o enlace /cotizar/?sku=",
                prod_rel
            ));
        }
    }
    for acuse_rel in ["src/pages/acuse.astro", "src/pages/en/thank-you.astro"] {
        let acuse_src = fs::read_to_string(site_root.join(acuse_rel)).map_err(|e| e.to_string())?;
        if !acuse_src.contains("acuse-multi-item-tray-section")
            || !acuse_src.contains("enrichTrayItemsPreservingMetadata")
            || !acuse_src.contains("34166")
        {
            return Err(format!(
                "D5-V35 (DEB-V35-06): {} carece de tabla multi-partida SAT/JRP, enrichTrayItemsPreservingMetadata o C.P. 34166",
                acuse_rel
            ));
        }
    }

    // 5. D6-V35 & D7-V35: Mapeo 1:1 D3147/F6147 y erradicacion total de 'cutwater'
    let cat_es = fs::read_to_string(site_root.join("src/pages/catalogo/[code].astro"))
        .map_err(|e| e.to_string())?;
    if !cat_es.contains("findPart('D3147')") || !cat_es.contains("findPart('F6147')") {
        return Err("D6-V35: catalogo/[code].astro no mapea d3147 -> D3147 o f6147 -> F6147".to_string());
    }
    for no_cutwater_rel in [
        "data/atomic_parts.json",
        "data/roles.json",
        "data/circuits.json",
        "data/diagnostics.json",
        "src/components/TechnicalDiagrams.astro",
        "src/pages/en/about.astro",
    ] {
        let s = fs::read_to_string(site_root.join(no_cutwater_rel))
            .map_err(|e| e.to_string())?
            .to_lowercase();
        if s.contains("cutwater") {
            return Err(format!(
                "D7-V35 (DEB-V35-08): Termino prohibido 'cutwater' detectado en {}",
                no_cutwater_rel
            ));
        }
    }

    // 6. D12-V35 & D13-V36..D14-V36: Modulos extraidos y compuertas V3.6 existen
    for mod_rel in [
        "src/scripts/acuseSheetController.js",
        "src/scripts/quoteDossierRenderer.js",
        "src/scripts/wizardUrlAndPresetRouter.js",
        "crates/smat-gate/src/v34_canonical_gates.rs",
        "tests/v35_forensic_closure_and_jrp.test.mjs",
        "tests/v36_forensic_closure_and_epistemic_parity.test.mjs",
    ] {
        if !site_root.join(mod_rel).exists() {
            return Err(format!("D12-V35/V36: Falta artefacto modular '{}'", mod_rel));
        }
    }

    // 7. D1-V36, D2-V36, D3-V36 & D7-V36: Verificación de paridad SSR en catalogo.astro y hreflang en [slug].astro
    for cat_rel in ["src/pages/catalogo.astro", "src/pages/en/catalog.astro"] {
        let cat_src = fs::read_to_string(site_root.join(cat_rel)).map_err(|e| e.to_string())?;
        if !cat_src.contains("v.id === 'control_procesos'") {
            return Err(format!(
                "D2-V36 (DEB-V36-03): {} no filtra control_procesos desde data/roles.json",
                cat_rel
            ));
        }
    }
    let strip_src = fs::read_to_string(site_root.join("src/components/QuickPartSelectorStrip.astro"))
        .map_err(|e| e.to_string())?;
    if strip_src.contains("lookupKey: 'E4110'") || strip_src.contains("lookupKey: 'E4029'") {
        return Err(
            "D3-V36 (DEB-V36-04): QuickPartSelectorStrip.astro conserva lookupKey rotos E4110/E4029 en vez de D3110/D4029"
                .to_string(),
        );
    }
    for slug_rel in ["src/pages/productos/[slug].astro", "src/pages/en/products/[slug].astro"] {
        let slug_src = fs::read_to_string(site_root.join(slug_rel)).map_err(|e| e.to_string())?;
        if !slug_src.contains("alternateEsPath=") || !slug_src.contains("alternateEnPath=") {
            return Err(format!(
                "D7-V36 (DEB-V36-08): {} no inyecta alternateEsPath y alternateEnPath explicitos a BaseLayout",
                slug_rel
            ));
        }
        if !slug_src.contains("data-add-coupled-pair-btn") {
            return Err(format!(
                "D8-V37 (DEB-V37-08): {} carece de boton directo data-add-coupled-pair-btn para Par Casado",
                slug_rel
            ));
        }
    }

    // 8. Gate 40 (D1-V37..D10-V37): wizardMiningAndCodeDecoder.js, hybrid_a05_r55, lowercase d075c21 y 0 prd_smatminerals_web.md legacy
    if !site_root.join("src/scripts/wizardMiningAndCodeDecoder.js").exists() {
        return Err("D9-V37 (DEB-V37-01): Falta modulo extraido src/scripts/wizardMiningAndCodeDecoder.js".to_string());
    }
    if site_root.join("prd_smatminerals_web.md").exists() {
        return Err("D10-V37 (DEB-V37-09): Debe eliminarse el PRD v2.3 legacy site/prd_smatminerals_web.md".to_string());
    }
    if !qw_src.contains("value=\"hybrid_a05_r55\"") {
        return Err("D4-V37 (DEB-V37-04): QuoteWizard.astro carece de opcion value=\"hybrid_a05_r55\"".to_string());
    }
    let footer_src = fs::read_to_string(site_root.join("src/components/Footer.astro")).map_err(|e| e.to_string())?;
    if footer_src.contains("/catalogo/D075C21/") || footer_src.contains("/en/catalog/D075C21/") {
        return Err("D5-V37 (DEB-V37-05): Footer.astro conserva enlace en mayusculas /catalogo/D075C21/".to_string());
    }

    Ok(())
}
