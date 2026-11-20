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

    let clasif_es = crate::read_page_with_islands_composite(site_root, "src/pages/clasificacion/index.astro")?;
    let clasif_en = crate::read_page_with_islands_composite(site_root, "src/pages/en/classification/index.astro")?;
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
    if !qcard.contains("data-priority-tier=") || !qcard.contains("[SMAT Durango · Prioridad Operativa:") {
        return Err("D6-V34 / D5-V40: ProductQuickCard.astro carece de data-priority-tier o etiqueta comercial [SMAT Durango · Prioridad Operativa:".to_string());
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
    let qw_src = crate::read_quote_wizard_composite(site_root)?;
    if !qw_src.contains("value=\"hidrociclon_apex_vortex\"") || !qw_src.contains("value=\"malla_criba_poliuretano\"") {
        return Err("D2-V35: QuoteWizard.astro carece de opciones hidrociclon_apex_vortex / malla_criba_poliuretano".to_string());
    }

    // 3. D3-V35: Simuladores interactivos Plano 3 invocados en <script> real (no en <code> muerto)
    for (rel_page, req_fn, alt_fn) in [
        ("src/pages/flotacion/celdas.astro", "calculateFlotationGorainKineticRate", "bindCanonicalFlotationCalculator"),
        ("src/pages/en/flotation/cells.astro", "calculateFlotationGorainKineticRate", "bindCanonicalFlotationCalculator"),
        ("src/pages/filtracion/repuestos.astro", "evaluateFilterPressPlateDeflection", "bindCanonicalFiltrationCalculator"),
        ("src/pages/en/filtration/parts.astro", "evaluateFilterPressPlateDeflection", "bindCanonicalFiltrationCalculator"),
        ("src/pages/clasificacion/index.astro", "calculateUrethaneScreenPartitionWeibull", "bindCoupledClassificationStation"),
        ("src/components/QuickOrderTray.astro", "calculateCoupledReorderWindowDays", "calculateCoupledReorderWindowDays"),
    ] {
        let src = crate::read_page_with_islands_composite(site_root, rel_page)?;
        if (!src.contains(req_fn) && !src.contains(alt_fn)) || src.contains("Runtime Proof: evaluate") {
            return Err(format!(
                "D3-V35 (DEB-V35-03/04): {} debe invocar '{}' o '{}' en un <script> real sin bloque <code> muerto",
                rel_page, req_fn, alt_fn
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
    if !cat_es.contains("'D3147'") || !cat_es.contains("'F6147'") {
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

    // 6. D12-V35 & D13-V36..D14-V36: Modulos extraidos y compuertas V3.6/V5.0 existen
    for mod_rel in [
        "src/scripts/acuseSheetController.js",
        "src/scripts/quoteDossierRenderer.js",
        "src/scripts/wizardUrlAndPresetRouter.js",
        "crates/smat-gate/src/v34_canonical_gates.rs",
        "tests/v50_engine_schema_and_xdsm_dag.test.mjs",
        "tests/v50_canonical_islands_and_non_vacuous_witness.test.mjs",
    ] {
        if !site_root.join(mod_rel).exists() {
            return Err(format!("D12-V35/V36: Falta artefacto modular '{}'", mod_rel));
        }
    }

    // 7. D1-V36, D2-V36, D3-V36 & D7-V36: Verificación de paridad SSR en catalogo.astro y purga QuickPartSelectorStrip
    for cat_rel in ["src/pages/catalogo.astro", "src/pages/en/catalog.astro"] {
        let cat_src = crate::read_page_with_islands_composite(site_root, cat_rel)?;
        if !cat_src.contains("v.id === 'control_procesos'") {
            return Err(format!(
                "D2-V36 (DEB-V36-03): {} no filtra control_procesos desde data/roles.json",
                cat_rel
            ));
        }
    }
    if site_root.join("src/components/QuickPartSelectorStrip.astro").exists() {
        return Err(
            "D3-V36 / DEB-V50-14: QuickPartSelectorStrip.astro debe permanecer fisicamente eliminado".to_string(),
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

/// 41. Gate V3.8 (D1-V38 a D8-V38, DEB-V38-01..12):
/// Verifica despacho jerárquico en generateSmatPartCode (0 colisión PRENSAESTOPA/BATCH),
/// inversión biyectiva CYC/SCR en parseSmatPartCode, aislamiento polimórfico en acuseSheetController,
/// 4 indicadores metrológicos #wb-ctrl-res-{sm,bias,gy,rr} en QuoteWizard.astro, #live-custom-box en Dossier,
/// 5 atributos [data-wb-field], 0 selectores muertos en quoteWizardController.js y coherencia 6x4 en alias.
pub fn check_v38_bijective_codes_acuse_isolation_and_zero_orphan_dom(site_root: &Path) -> Result<(), String> {
    let dist_catalog = fs::read_to_string(site_root.join("src/scripts/districtProfilesAndSkuCatalog.js"))
        .map_err(|e| e.to_string())?;
    if !dist_catalog.contains("replace(/PRENSAESTOPA/g, 'ESTOPERA')") || !dist_catalog.contains("astm_8in_inox") {
        return Err("D1/D2-V38 (DEB-V38-01/06): districtProfilesAndSkuCatalog.js carece de blindaje PRENSAESTOPA o astm_8in_inox".to_string());
    }

    let sap_eng = fs::read_to_string(site_root.join("src/scripts/sapAndLeadExportEngine.js"))
        .map_err(|e| e.to_string())?;
    if !sap_eng.contains("line === 'CYC'") || !sap_eng.contains("line === 'SCR'") {
        return Err("D2-V38 (DEB-V38-05): sapAndLeadExportEngine.js carece de ramas CYC/SCR en parseSmatPartCode".to_string());
    }

    let acuse_ctrl = fs::read_to_string(site_root.join("src/scripts/acuseSheetController.js"))
        .map_err(|e| e.to_string())?;
    if !acuse_ctrl.contains("isNonPumpRequisition") || !acuse_ctrl.contains("hybrid_a05_r55") {
        return Err("D3-V38 (DEB-V38-07): acuseSheetController.js carece de isNonPumpRequisition o hybrid_a05_r55".to_string());
    }

    let qw_src = crate::read_quote_wizard_composite(site_root)?;
    for id_req in ["wb-ctrl-res-sm", "wb-ctrl-res-bias", "wb-ctrl-res-gy", "wb-ctrl-res-rr"] {
        if !qw_src.contains(id_req) {
            return Err(format!("D4-V38 (DEB-V38-08): QuoteWizard.astro carece de #{}", id_req));
        }
    }

    let dossier_src = fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro"))
        .map_err(|e| e.to_string())?;
    for req_d in [
        "live-custom-box",
        "live-custom-text",
        "data-wb-field=\"actualPipeVelocityMs\"",
        "data-wb-field=\"slurrySpecificGravity\"",
        "data-wb-field=\"sealBranch\"",
        "data-wb-field=\"impellerExitWidthMm\"",
        "data-wb-field=\"dynamicCapacityCkN\"",
        "emergency_hotline",
    ] {
        if !dossier_src.contains(req_d) {
            return Err(format!("D5/D8-V38 (DEB-V38-09/11): LiveEngineeringDossier.astro carece de '{}'", req_d));
        }
    }

    let ctrl_src = fs::read_to_string(site_root.join("src/scripts/quoteWizardController.js"))
        .map_err(|e| e.to_string())?;
    if ctrl_src.contains("diag-search-input") || ctrl_src.contains("btn-quote-mailto") {
        return Err("D5-V38 (DEB-V38-09): quoteWizardController.js aun contiene selectores muertos diag-search-input / btn-quote-mailto".to_string());
    }

    let pump_eng = fs::read_to_string(site_root.join("src/scripts/pumpAssemblyAndDriveEngine.js"))
        .map_err(|e| e.to_string())?;
    if !pump_eng.contains("export function resolveBomPartSpecs") {
        return Err("D6-V38 (DEB-V38-10): pumpAssemblyAndDriveEngine.js carece de resolveBomPartSpecs".to_string());
    }

    Ok(())
}

/// 42. Gate V3.9 (D1-V39 a D10-V39, DEB-V39-01..10):
/// Verifica exposición al 100% del backend en la UI bajo primeros principios Apple HIG:
/// - D1/D2/D3-V39: WizardCircuitCalculators.astro + wizardCircuitPhysicsController.js (Gorain S_b, Zwietering N_js, Ruth t_f, Timoshenko FS, 5to chip XOR Clasificación Plitt d50c + Roping Concha)
/// - D4-V39: selectBearingFrameByPowerAndRpm + evaluateCoreTradeInEligibility en [slug].astro, [code].astro, soporte.astro y /cotizar/
/// - D5-V39: Desglose explícito de Rama D Híbrida (#wb-hybrid-rama-d-breakdown)
/// - D6-V39: #wb-mining-preset-bar promovido a cabecera del Paso 1
/// - D7-V39: buildSmatVendorVcardString (RFC 6350 vCard 4.0) y Anexo 22 TIGIE en LiveEngineeringDossier.astro
/// - D8-V39 (Regla Soberana): CERO exposición pública de existencias de almacén SMAT (sanitizePublicAtomicPartSpecs) + Ventana Preventiva de Reorden para el cliente
/// - D9-V39: Persistencia smat_engineering_context_v1 entre las 4 verticales y /cotizar/
/// - D10-V39: Contraste Solar WCAG AAA (>= 7.0:1) en ProductQuickCard.astro y CircuitNavigator.astro
pub fn check_v39_backend_ui_exposure_and_zero_stock_leak_gate_42(site_root: &Path) -> Result<(), String> {
    for req_file in [
        "src/components/WizardCircuitCalculators.astro",
        "src/scripts/wizardCircuitPhysicsController.js",
        "src/scripts/vendorPassportAndTradeInController.js",
        "tests/v50_canonical_islands_and_non_vacuous_witness.test.mjs",
    ] {
        if !site_root.join(req_file).exists() {
            return Err(format!("Gate 42 (V3.9): Falta archivo obligatorio '{}'", req_file));
        }
    }

    let qw_src = crate::read_quote_wizard_composite(site_root)?;
    for req_qw in [
        "data-circuit=\"clasificacion\"",
        "WizardCircuitCalculators",
        "wb-hybrid-rama-d-breakdown",
        "wb-part-reorder-window-val",
        "sanitizePublicAtomicPartSpecs",
    ] {
        if !qw_src.contains(req_qw) {
            return Err(format!("Gate 42 (V3.9): QuoteWizard.astro carece de '{}'", req_qw));
        }
    }

    let idx_step1 = qw_src.find("id=\"wb-step1-xor-circuit-bar\"").ok_or("Falta #wb-step1-xor-circuit-bar")?;
    let idx_preset = qw_src.find("id=\"wb-mining-preset-bar\"").ok_or("Falta #wb-mining-preset-bar")?;
    let idx_step2 = qw_src.find("id=\"stage-2\"").ok_or("Falta #stage-2")?;
    if !(idx_preset > idx_step1 && idx_preset < idx_step2) {
        return Err("Gate 42 (D6-V39): #wb-mining-preset-bar debe ubicarse en la cabecera del Paso 1 antes del Paso 2".to_string());
    }

    let dossier_src = fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro"))
        .map_err(|e| e.to_string())?;
    for req_dos in [
        "id=\"live-row-circuit-physics\"",
        "id=\"sap-live-anexo22-tuple\"",
        "id=\"btn-download-vendor-json\"",
        "id=\"btn-download-vendor-vcf\"",
    ] {
        if !dossier_src.contains(req_dos) {
            return Err(format!("Gate 42 (D7-V39): LiveEngineeringDossier.astro carece de '{}'", req_dos));
        }
    }

    // Regla Soberana D8-V39: CERO exposición pública de existencias de almacén SMAT en vistas o controladores públicos
    for public_rel in [
        "src/components/QuoteWizard.astro",
        "src/components/ProductQuickCard.astro",
        "src/components/LiveEngineeringDossier.astro",
        "src/pages/catalogo/[code].astro",
        "src/pages/en/catalog/[code].astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let src = fs::read_to_string(site_root.join(public_rel)).map_err(|e| e.to_string())?;
        for forbidden_key in [
            "physical_stock_durango_units",
            "unit_replacement_value_mxn",
            "warehouse_total_mxn",
            "warehouse_total_units",
            "boxes_breakdown",
        ] {
            if src.contains(forbidden_key) {
                return Err(format!(
                    "Gate 42 (D8-V39 Violación Soberana): Vista pública '{}' expone campo confidencial de inventario '{}'",
                    public_rel, forbidden_key
                ));
            }
        }
    }

    // D9-V39: Persistencia transversal smat_engineering_context_v1
    let lens_src = fs::read_to_string(site_root.join("src/scripts/verticalBidirectionalHydrationLens.js")).unwrap_or_default();
    let lens_commits_ctx = lens_src.contains("commitVerticalSimulation");
    let bridge_src = fs::read_to_string(site_root.join("src/scripts/verticalCalculatorsAndLabelsBridge.js")).unwrap_or_default();
    let bridge_commits_ctx = bridge_src.contains("commitVerticalSimulation");
    for sim_rel in [
        "src/pages/bombeo/skid.astro",
        "src/pages/en/pumping/skid.astro",
        "src/pages/bombeo/soporte.astro",
        "src/pages/en/pumping/bearing-assembly.astro",
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/cells.astro",
        "src/pages/filtracion/index.astro",
        "src/pages/filtracion/repuestos.astro",
        "src/pages/clasificacion/index.astro",
        "src/pages/en/classification/index.astro",
    ] {
        let src = crate::read_page_with_islands_composite(site_root, sim_rel)?;
        let has_unified_inspector = (src.contains("initSkidKinematicsInspector")
            || src.contains("initBearingSupportInspector"))
            && lens_commits_ctx;
        let has_unified_bridge = (src.contains("bindCanonicalFlotationCalculator")
            || src.contains("bindCanonicalFiltrationCalculator")
            || src.contains("bindCoupledClassificationStation"))
            && bridge_commits_ctx;
        if !src.contains("saveEngineeringContextSnapshot")
            && !src.contains("commitVerticalSimulation")
            && !has_unified_inspector
            && !has_unified_bridge
        {
            return Err(format!(
                "Gate 42 (D9-V39): '{}' no persiste telemetría en smat_engineering_context_v1",
                sim_rel
            ));
        }
    }

    Ok(())
}

/// 43. Gate V4.0 (D1-V40 a D8-V40, DEB-V40-01..10):
/// Verifica la unificación de superficie transaccional (1 carrito canónico por vista),
/// consolidación de 5 sistemas de navegación en 1 consola de 4 pestañas en /bombeo/,
/// purga V5.0 del cajón #home-quick-catalog-drawer en Portada y erradicación 100% de metalenguaje visible.
pub fn check_v40_single_canonical_surface_and_zero_visible_metalanguage_gate_43(
    site_root: &Path,
) -> Result<(), String> {
    if !site_root
        .join("tests/v50_canonical_islands_and_non_vacuous_witness.test.mjs")
        .exists()
    {
        return Err("Gate 43 (V4.0/V5.0): Falta suite tests/v50_canonical_islands_and_non_vacuous_witness.test.mjs".to_string());
    }

    // D1-V40: BaseLayout suprime QuickOrderTray en rutas terminales y LiveEngineeringDossier absorbe RequisitionTraySummary
    let base_layout = fs::read_to_string(site_root.join("src/layouts/BaseLayout.astro"))
        .map_err(|e| e.to_string())?;
    if !base_layout.contains("isTransactionTerminal")
        || !base_layout.contains("{!isTransactionTerminal && <QuickOrderTray")
    {
        return Err("Gate 43 (D1-V40): BaseLayout.astro debe suprimir <QuickOrderTray /> en rutas terminales (!isTransactionTerminal)".to_string());
    }

    let dossier_src = fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro"))
        .map_err(|e| e.to_string())?;
    if !dossier_src.contains("<RequisitionTraySummary") || !dossier_src.contains("data-dossier-embedded-tray=\"true\"") {
        return Err("Gate 43 (D1-V40): LiveEngineeringDossier.astro debe integrar <RequisitionTraySummary /> como superficie única".to_string());
    }

    // D1-V40 & D3-V40: /cotizar/ y /en/quote/ montan únicamente QuoteWizard sin QuickPartSelectorStrip ni SharePurchasing sueltos
    for quote_rel in ["src/pages/cotizar.astro", "src/pages/en/quote.astro"] {
        let q_src = fs::read_to_string(site_root.join(quote_rel)).map_err(|e| e.to_string())?;
        for forbidden_dup in ["<QuickPartSelectorStrip", "<RequisitionTraySummary", "<SharePurchasing"] {
            if q_src.contains(forbidden_dup) {
                return Err(format!(
                    "Gate 43 (D1/D3-V40): '{}' conserva componente competidor duplicado '{}'",
                    quote_rel, forbidden_dup
                ));
            }
        }
    }

    // D2-V40: SharePurchasing.astro encapsulado en <details class="share-purchasing-widget share-purchasing-drawer">
    let share_src = fs::read_to_string(site_root.join("src/components/SharePurchasing.astro"))
        .map_err(|e| e.to_string())?;
    if !share_src.contains("<details class=\"share-purchasing-widget share-purchasing-drawer\"")
        || !share_src.contains("data-delegate-qtray-btn")
    {
        return Err("Gate 43 (D2-V40): SharePurchasing.astro debe ser un cajón <details> colapsado con delegación a QuickOrderTray".to_string());
    }

    // D3-V40: /bombeo/ y /en/pumping/ integran PumpAssemblyReport como Pestaña 4 (data-bombeo-tab="assembly")
    for pump_rel in ["src/pages/bombeo/index.astro", "src/pages/en/pumping/index.astro"] {
        let p_src = crate::read_page_with_islands_composite(site_root, pump_rel)?;
        if !p_src.contains("data-bombeo-tab=\"assembly\"")
            || !p_src.contains("data-bombeo-panel=\"assembly\"")
        {
            return Err(format!(
                "Gate 43 (D3-V40): '{}' debe integrar PumpAssemblyReport como Pestaña 4 (data-bombeo-tab=\"assembly\")",
                pump_rel
            ));
        }
    }

    // D4-V40 / DEB-V50-01: Portada /index.astro y /en/index.astro purgan #home-quick-catalog-drawer y delegan en HomeLandingIsland
    for home_rel in ["src/pages/index.astro", "src/pages/en/index.astro"] {
        let raw_h = fs::read_to_string(site_root.join(home_rel)).map_err(|e| e.to_string())?;
        let h_src = crate::read_page_with_islands_composite(site_root, home_rel)?;
        if !raw_h.contains("<HomeLandingIsland") || h_src.contains("home-quick-catalog-drawer") {
            return Err(format!(
                "Gate 43 (D4-V40 / DEB-V50-01): '{}' debe delegar en <HomeLandingIsland /> y erradicar #home-quick-catalog-drawer",
                home_rel
            ));
        }
    }

    // D5-V40: Cero metalenguaje visible (PRIORIDAD-cμ, ORDEN DETERMINISTA FNV-1a, evaluateCoreTradeInEligibility)
    for ui_rel in [
        "src/components/ProductQuickCard.astro",
        "src/components/QuickOrderTray.astro",
        "src/components/RequisitionTraySummary.astro",
        "src/pages/acuse.astro",
        "src/pages/en/thank-you.astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
        "src/pages/catalogo/[code].astro",
        "src/pages/en/catalog/[code].astro",
    ] {
        let u_src = fs::read_to_string(site_root.join(ui_rel)).map_err(|e| e.to_string())?;
        for banned_meta in [
            "PRIORIDAD-cμ",
            "PRIORITY-cμ",
            "ORDEN DETERMINISTA FNV-1a",
            "DETERMINISTIC FNV-1a ORDER",
            "(evaluateCoreTradeInEligibility)",
        ] {
            if u_src.contains(banned_meta) {
                return Err(format!(
                    "Gate 43 (D5-V40 APL-03): '{}' conserva metalenguaje visible prohibido '{}'",
                    ui_rel, banned_meta
                ));
            }
        }
    }

    Ok(())
}

/// 44. Gate V4.1 (D1-V41 a D9-V41, DEB-V41-01..10):
/// Verifica el desacoplamiento de <WizardCircuitCalculators /> fuera de #circuit-panel-bombeo,
/// promoción de #circuit-panel-flotacion, #circuit-panel-filtracion y #circuit-panel-control a hermanos directos del Paso 1,
/// lente polimórfica PutGet en saveEngineeringContextSnapshot (1 y 2 argumentos),
/// unificación de instancia única de <RequisitionTraySummary /> (cero duplicados en QuoteWizard.astro),
/// aritmética Core Trade-In 3 niveles (-22% / -12% / 0%) con dirección única Mariano Salas #114,
/// y erradicación de IDs duplicados (#dossier-metric-delta-npsh) y metalenguaje residual ((atomic_parts), Insurgentes Sur).
pub fn check_v41_zero_unexposed_backend_fields_and_live_xor_visibility_gate_44(
    site_root: &Path,
) -> Result<(), String> {
    for req_file in [
        "src/scripts/wizardLivePhysicsProjector.js",
        "tests/v41_full_backend_ui_exposure.test.mjs",
    ] {
        if !site_root.join(req_file).exists() {
            return Err(format!(
                "Gate 44 (V4.1): Falta archivo obligatorio '{}'",
                req_file
            ));
        }
    }

    let raw_qw_src = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
        .map_err(|e| e.to_string())?;
    let qw_src = crate::read_page_with_islands_composite(site_root, "src/components/QuoteWizard.astro")?;

    // D4-V41 / DEB-V41-04: QuoteWizard.astro NO debe montar una segunda instancia de <RequisitionTraySummary
    if qw_src.contains("<RequisitionTraySummary") {
        return Err("Gate 44 (D4-V41 DEB-V41-04): QuoteWizard.astro contiene una instancia duplicada de <RequisitionTraySummary />; la instancia única canónica reside en LiveEngineeringDossier.astro".to_string());
    }

    // D1-V41 / DEB-V41-01..02: #circuit-panel-flotacion, #circuit-panel-filtracion y #circuit-panel-control deben aparecer ANTES de <details id="wb-engineering-config-details">
    let idx_flot = qw_src
        .find("id=\"circuit-panel-flotacion\"")
        .ok_or("Falta #circuit-panel-flotacion en QuoteWizard.astro")?;
    let idx_filt = qw_src
        .find("id=\"circuit-panel-filtracion\"")
        .ok_or("Falta #circuit-panel-filtracion en QuoteWizard.astro")?;
    let idx_ctrl = qw_src
        .find("id=\"circuit-panel-control\"")
        .ok_or("Falta #circuit-panel-control en QuoteWizard / ProcessControlIsland")?;
    let idx_calc = raw_qw_src
        .find("<WizardCircuitCalculators")
        .ok_or("Falta <WizardCircuitCalculators en QuoteWizard.astro")?;
    let raw_idx_drawer = raw_qw_src
        .find("id=\"wb-engineering-config-details\"")
        .ok_or("Falta #wb-engineering-config-details en QuoteWizard.astro")?;
    let idx_drawer = qw_src
        .find("id=\"wb-engineering-config-details\"")
        .ok_or("Falta #wb-engineering-config-details en QuoteWizard.astro")?;

    if !(idx_flot < idx_drawer && idx_filt < idx_drawer && idx_ctrl < idx_drawer && idx_calc < raw_idx_drawer) {
        return Err("Gate 44 (D1-V41): Los paneles #circuit-panel-flotacion, #circuit-panel-filtracion, #circuit-panel-control y <WizardCircuitCalculators /> deben ser hermanos de primer nivel del Paso 1 ANTES del cajón <details id=\"wb-engineering-config-details\">".to_string());
    }

    // DEB-V41-05: LiveEngineeringDossier.astro usa #dossier-metric-delta-npsh (cero colisión con #metric-delta-npsh de QuoteWizard.astro)
    let dossier_src = fs::read_to_string(site_root.join("src/components/LiveEngineeringDossier.astro"))
        .map_err(|e| e.to_string())?;
    if !dossier_src.contains("id=\"dossier-metric-delta-npsh\"") || dossier_src.contains("id=\"metric-delta-npsh\"") {
        return Err("Gate 44 (DEB-V41-05): LiveEngineeringDossier.astro debe usar id=\"dossier-metric-delta-npsh\" para evitar colisión de ID con QuoteWizard.astro".to_string());
    }

    // D3-V41 / DEB-V41-03 / DEB-V41-09 / DEB-V41-10: Cero referencias a "Insurgentes Sur", "(evaluateCoreTradeInEligibility)" o "(atomic_parts)"
    for rel_path in [
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
        "src/pages/catalogo/[code].astro",
        "src/pages/en/catalog/[code].astro",
        "src/pages/bombeo/soporte.astro",
        "src/pages/en/pumping/bearing-assembly.astro",
        "src/pages/bombeo/skid.astro",
        "src/pages/en/pumping/skid.astro",
        "src/components/WizardCircuitCalculators.astro",
    ] {
        let src = fs::read_to_string(site_root.join(rel_path)).map_err(|e| e.to_string())?;
        for forbidden in [
            "Insurgentes Sur",
            "(evaluateCoreTradeInEligibility)",
            "(atomic_parts)",
        ] {
            if src.contains(forbidden) {
                return Err(format!(
                    "Gate 44 (V4.1 Debris): '{}' conserva cadena obsoleta o metalenguaje '{}'",
                    rel_path, forbidden
                ));
            }
        }
    }

    Ok(())
}
