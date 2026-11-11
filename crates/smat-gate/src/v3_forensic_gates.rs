use regex::Regex;
use std::fs;
use std::path::Path;

/// 28. Gate MVP v3 (D1, D2, D4, D6): Bijeccion de 19 SKUs Quick-Checkout, 13 partes atomicas (incl. D075C21) y capa Rayos-X CAD
pub fn verify_quick_checkout_and_cad_bijection(site_root: &Path) -> Result<(), String> {
    let qc_path = site_root.join("data").join("quick_checkout_Catalog.json");
    if !qc_path.exists() {
        return Err("Falta data/quick_checkout_Catalog.json (D1)".to_string());
    }
    let qc_raw = fs::read_to_string(&qc_path).map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr
        .as_array()
        .ok_or("quick_checkout_Catalog.json debe ser un arreglo JSON")?;
    if skus.len() != 19 {
        return Err(format!(
            "quick_checkout_Catalog.json debe contener exactamente 19 SKUs Tier-1 (encontrados: {})",
            skus.len()
        ));
    }

    let atomic_path = site_root.join("data").join("atomic_parts.json");
    let atomic_raw = fs::read_to_string(&atomic_path).map_err(|e| e.to_string())?;
    let atomic_arr: serde_json::Value =
        serde_json::from_str(&atomic_raw).map_err(|e| e.to_string())?;
    let parts = atomic_arr
        .as_array()
        .ok_or("atomic_parts.json debe ser un arreglo JSON")?;
    if parts.len() < 13 {
        return Err(format!(
            "atomic_parts.json debe contener al menos 13 partes atomicas (encontradas: {})",
            parts.len()
        ));
    }
    let has_d075c21 = parts
        .iter()
        .any(|p| p.get("part_number").and_then(|v| v.as_str()) == Some("D075C21"));
    if !has_d075c21 {
        return Err(
            "atomic_parts.json carece de la Camisa Protectora de Flecha D075C21 (D6)".to_string(),
        );
    }

    for rel in [
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
        "src/components/TechnicalDiagrams.astro",
        "src/components/PumpAssemblyReport.astro",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!(
                "Falta archivo requerido para bijeccion CAD/Quick-Checkout: {}",
                rel
            ));
        }
    }

    let diag_src = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro"))
        .map_err(|e| e.to_string())?;
    if !diag_src.contains("data-layer=\"xray-wear\"") || !diag_src.contains("0.76") {
        return Err("TechnicalDiagrams.astro carece de data-layer=\"xray-wear\" o referencia ISO/IEC 7810 (0.76 mm)".to_string());
    }

    Ok(())
}

/// 29. Gate MVP v3 (D3, D5, D7, D8, D9): Verificabilidad Fisica de SLAs, Bandeja c*mu, Balance 3 Vasos Marcy y Costuras LCOM4
pub fn verify_sla_verifiability_and_lcom4_seam(site_root: &Path) -> Result<(), String> {
    for rel in [
        "src/scripts/requisitionTrayBus.js",
        "src/components/RequisitionTraySummary.astro",
        "src/pages/clasificacion/index.astro",
        "src/pages/en/classification/index.astro",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!("Falta componente/ruta del MVP v3.0: {}", rel));
        }
    }

    let engine_src = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js"))
        .map_err(|e| e.to_string())?;
    for fn_sig in [
        "export function calculateThreeCupMarcyCycloneBalance",
        "export function evaluateFilterPressPlateDeflection",
        "export function computeSelectionOrderCodeHash",
    ] {
        if !engine_src.contains(fn_sig) {
            return Err(format!("slurryEngine.js carece de {}", fn_sig));
        }
    }

    let tray_src = fs::read_to_string(site_root.join("src/scripts/requisitionTrayBus.js"))
        .map_err(|e| e.to_string())?;
    for fn_sig in [
        "export function buildCmuPrioritySubjectLine",
        "export function buildSmatVendorPassportPayload",
        "export function encodeReorderUrlQuery",
    ] {
        if !tray_src.contains(fn_sig) {
            return Err(format!("requisitionTrayBus.js carece de {}", fn_sig));
        }
    }

    let flot_es = fs::read_to_string(site_root.join("src/pages/flotacion/index.astro"))
        .map_err(|e| e.to_string())?;
    let filt_es = fs::read_to_string(site_root.join("src/pages/filtracion/index.astro"))
        .map_err(|e| e.to_string())?;
    if !flot_es.contains("id=\"flotation-dropin-matrix\"") {
        return Err("flotacion/index.astro carece de #flotation-dropin-matrix (D8)".to_string());
    }
    if !filt_es.contains("id=\"nom141-plate-flexure-verifier\"") {
        return Err(
            "filtracion/index.astro carece de #nom141-plate-flexure-verifier (D8)".to_string(),
        );
    }

    Ok(())
}

/// 30. Gate D10 (Cierre Forense PRD v3.0): Audita las 12 brechas forenses (GAP-V3-01..12) y los 8 ítems de debris (DEB-V3-01..08)
pub fn verify_prd_v3_forensic_closure_gate_30(site_root: &Path) -> Result<(), String> {
    for rel in [
        "src/scripts/quickProductsCatalog.js",
        "src/scripts/dropInEquivalenceGuard.js",
        "src/scripts/mechanicalAndSeparationEngine.js",
        "src/scripts/workbenchExportFormatters.js",
        "src/components/ProductQuickCard.astro",
        "src/components/QuickOrderTray.astro",
        "src/components/CycloneAndScreenReport.astro",
        "tools/build_product_images.mjs",
        "tests/prd_v3_forensic_closure.test.mjs",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!(
                "Falta artefacto del Cierre Forense PRD v3.0 (Gate 30): {}",
                rel
            ));
        }
    }

    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json"))
        .map_err(|e| e.to_string())?;
    for banned_frame in ["4/3 C", "6/4 D", "8/6 E", "AHR"] {
        if qc_raw.contains(banned_frame) {
            return Err(format!(
                "quick_checkout_Catalog.json contiene nomenclatura de bastidor OEM prohibida: {}",
                banned_frame
            ));
        }
    }
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr
        .as_array()
        .ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;
    if skus.len() != 19 {
        return Err(format!(
            "Se esperaban 19 SKUs en quick_checkout_Catalog.json, encontrados: {}",
            skus.len()
        ));
    }

    for sku in skus {
        let id = sku
            .get("sku_id")
            .and_then(|v| v.as_str())
            .unwrap_or("UNKNOWN");
        let regime = sku
            .get("stock_regime")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        if !["hay", "se_pide", "se_fabrica"].contains(&regime) {
            return Err(format!(
                "SKU {} carece de stock_regime valido (hay|se_pide|se_fabrica): {}",
                id, regime
            ));
        }
        let gate_lock = sku.get("gate_lock").and_then(|v| v.as_str()).unwrap_or("");
        if !["G1", "G2", "G3", "G4", "G5"].contains(&gate_lock) {
            return Err(format!(
                "SKU {} carece de gate_lock valido (G1..G5): {}",
                id, gate_lock
            ));
        }
        if sku
            .get("sat_tuple")
            .and_then(|s| s.get("clave_prod_serv"))
            .is_none()
        {
            return Err(format!("SKU {} carece de sat_tuple.clave_prod_serv", id));
        }
        if sku.get("geometric_triplet_mm").is_none() {
            return Err(format!("SKU {} carece de geometric_triplet_mm", id));
        }
        let photo_rel = sku.get("photo_webp").and_then(|v| v.as_str()).unwrap_or("");
        let clean_rel = photo_rel.trim_start_matches('/');
        let photo_path = site_root.join("public").join(clean_rel);
        if !photo_path.exists() {
            return Err(format!(
                "SKU {} carece de imagen WebP fisica en public/{}",
                id, clean_rel
            ));
        }
        let meta = fs::metadata(&photo_path).map_err(|e| e.to_string())?;
        if meta.len() == 0 || meta.len() > 46080 {
            return Err(format!(
                "Imagen WebP {} excede presupuesto de 45 KB ({} bytes)",
                clean_rel,
                meta.len()
            ));
        }
    }

    let diag_src = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro"))
        .map_err(|e| e.to_string())?;
    if !diag_src.contains("urethane_screen_panel_305") {
        return Err(
            "TechnicalDiagrams.astro carece de urethane_screen_panel_305 (sobreyectividad 16/16)"
                .to_string(),
        );
    }

    for check_rel in [
        "src/components/SharePurchasing.astro",
        "src/pages/catalogo.astro",
        "src/pages/en/catalog.astro",
        "src/pages/catalogo/[code].astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/cells.astro",
        "src/pages/filtracion/repuestos.astro",
    ] {
        let content = fs::read_to_string(site_root.join(check_rel)).map_err(|e| e.to_string())?;
        if content.contains("Banco Durango")
            || content.contains("Balanceo Dinámico en Banco de Pruebas")
        {
            return Err(format!(
                "{} aun contiene claim obsoleto 'Banco Durango' / 'Balanceo Dinámico en Banco de Pruebas' (DEB-V3-03/04)",
                check_rel
            ));
        }
    }

    let redirects_raw =
        fs::read_to_string(site_root.join("public/_redirects")).map_err(|e| e.to_string())?;
    for req_legacy in [
        "/products/slurry-pump.html",
        "/products/hydrocyclone.html",
        "/products/flotation-cell.html",
        "/products/filter-press.html",
        "/products/screen-panel.html",
        "/products/mining-Shovel-Rope.html",
    ] {
        if !redirects_raw.contains(req_legacy) {
            return Err(format!(
                "public/_redirects carece de regla Wayback 301: {}",
                req_legacy
            ));
        }
    }

    Ok(())
}

/// 31. Gate D10=10-C++ (Cierre Total de Conceptos Huérfanos y Arbitraje Epistémico v3.1):
/// Audita las 10 decisiones (D1=1-C++ a D10=10-C++), los 4 invariantes (INV-SMAT-SCI-05..08) y la purga de debris (DEB-V31-01..10).
pub fn verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(
    site_root: &Path,
) -> Result<(), String> {
    for rel in [
        "ortho.toml",
        "src/scripts/tribologyAndCompatibilityEngine.js",
        "src/scripts/districtProfilesAndSkuCatalog.js",
        "src/pages/cumplimiento.astro",
        "src/pages/en/compliance.astro",
        "tests/smat_v3_total_closure.test.mjs",
    ] {
        if !site_root.join(rel).exists() {
            return Err(format!(
                "Falta artefacto del Cierre Total v3.1 (Gate 31): {}",
                rel
            ));
        }
    }

    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json"))
        .map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr
        .as_array()
        .ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;
    let mut distinct_webp_payloads = std::collections::BTreeSet::new();
    for sku in skus {
        let id = sku
            .get("sku_id")
            .and_then(|v| v.as_str())
            .unwrap_or("UNKNOWN");
        let wa = sku
            .get("warehouse_audit")
            .ok_or_else(|| format!("SKU {} carece de warehouse_audit (D1=1-C++)", id))?;
        if wa.get("warehouse_total_mxn").and_then(|v| v.as_u64()) != Some(1_646_850) {
            return Err(format!(
                "SKU {} tiene warehouse_total_mxn distinto de 1646850",
                id
            ));
        }
        if wa.get("warehouse_total_units").and_then(|v| v.as_u64()) != Some(383) {
            return Err(format!(
                "SKU {} tiene warehouse_total_units distinto de 383",
                id
            ));
        }
        let photo_rel = sku
            .get("photo_webp")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .trim_start_matches('/');
        let bytes =
            fs::read(site_root.join("public").join(photo_rel)).map_err(|e| e.to_string())?;
        distinct_webp_payloads.insert(bytes);
    }
    if distinct_webp_payloads.len() != 19 {
        return Err(format!(
            "D3=3-C++: Se esperaban 19 imagenes WebP unicas sin colision, encontradas: {}",
            distinct_webp_payloads.len()
        ));
    }

    let diag_raw =
        fs::read_to_string(site_root.join("data/diagnostics.json")).map_err(|e| e.to_string())?;
    let diag_val: serde_json::Value = serde_json::from_str(&diag_raw).map_err(|e| e.to_string())?;
    let modes = diag_val
        .get("diagnostics")
        .and_then(|v| v.as_array())
        .ok_or("diagnostics.json carece de diagnostics")?;
    if modes.len() != 6 {
        return Err(format!(
            "D2=2-C++: diagnostics.json debe tener 6 diagnostics, encontrados: {}",
            modes.len()
        ));
    }
    let pump_report = fs::read_to_string(site_root.join("src/components/PumpAssemblyReport.astro"))
        .map_err(|e| e.to_string())?;
    if !pump_report.contains("data-assembly-branch-btn=\"hybrid_a05_r55\"")
        || !pump_report.contains("data-wet-branch=\"hybrid_a05_r55\"")
    {
        return Err(
            "D2=2-C++: PumpAssemblyReport.astro carece del 4to selector hibrido A05 + R55"
                .to_string(),
        );
    }

    let rtb_src = fs::read_to_string(site_root.join("src/scripts/requisitionTrayBus.js"))
        .map_err(|e| e.to_string())?;
    if !rtb_src.contains("evaluateBearingCartridgeCoreTradeIn")
        || !rtb_src.contains("syncTrayToWorkbenchStateLens")
    {
        return Err("D4=4-C++: requisitionTrayBus.js carece de evaluateBearingCartridgeCoreTradeIn o syncTrayToWorkbenchStateLens".to_string());
    }
    let qtray_src = fs::read_to_string(site_root.join("src/components/QuickOrderTray.astro"))
        .map_err(|e| e.to_string())?;
    if !qtray_src.contains("data-core-tradein-toggle") {
        return Err(
            "D4=4-C++: QuickOrderTray.astro carece de data-core-tradein-toggle".to_string(),
        );
    }

    let celdas_src = fs::read_to_string(site_root.join("src/pages/flotacion/celdas.astro"))
        .map_err(|e| e.to_string())?;
    if !celdas_src.contains("data-cell-dropin-matrix=\"gorain-1997\"") {
        return Err(
            "D5=5-C++: flotacion/celdas.astro carece de data-cell-dropin-matrix=gorain-1997"
                .to_string(),
        );
    }
    let rep_src = fs::read_to_string(site_root.join("src/pages/filtracion/repuestos.astro"))
        .map_err(|e| e.to_string())?;
    if !rep_src.contains("data-plate-flexure-panel=\"timoshenko-g5\"") {
        return Err(
            "D5=5-C++: filtracion/repuestos.astro carece de data-plate-flexure-panel=timoshenko-g5"
                .to_string(),
        );
    }
    for solar_rel in [
        "src/pages/flotacion/index.astro",
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/index.astro",
        "src/pages/en/flotation/cells.astro",
        "src/pages/filtracion/index.astro",
        "src/pages/filtracion/repuestos.astro",
        "src/pages/en/filtration/index.astro",
        "src/pages/en/filtration/parts.astro",
    ] {
        let s = fs::read_to_string(site_root.join(solar_rel)).map_err(|e| e.to_string())?;
        if s.to_lowercase().contains("#090d16") {
            return Err(format!(
                "D6=6-C++ (DEB-V31-03): {} aun contiene token oscuro #090d16",
                solar_rel
            ));
        }
    }

    let slurry_lines = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js"))
        .map_err(|e| e.to_string())?
        .lines()
        .count();
    if slurry_lines > 390 {
        return Err(format!(
            "D8=8-C++: slurryEngine.js excede 390 lineas ({})",
            slurry_lines
        ));
    }
    let wb_lines = fs::read_to_string(site_root.join("src/scripts/workbenchBus.js"))
        .map_err(|e| e.to_string())?
        .lines()
        .count();
    if wb_lines > 420 {
        return Err(format!(
            "D8=8-C++: workbenchBus.js excede 420 lineas ({})",
            wb_lines
        ));
    }

    Ok(())
}

/// 32. Gate D10=10-C+ (Cierre Definitivo de los 7 Hallazgos Críticos y Purga de Debris v3.2):
pub fn verify_seven_findings_and_v32_closure_gate_32(site_root: &Path) -> Result<(), String> {
    if !site_root
        .join("tests/smat_v32_seven_findings_closure.test.mjs")
        .exists()
    {
        return Err(
            "Falta suite de pruebas tests/smat_v32_seven_findings_closure.test.mjs (Gate 32)"
                .to_string(),
        );
    }

    let global_css =
        fs::read_to_string(site_root.join("src/styles/global.css")).map_err(|e| e.to_string())?;
    if !global_css.contains(".hidden") || !global_css.contains("--smat-solar-bg: #f8fafc") {
        return Err(
            "Hallazgo 1: src/styles/global.css carece de .hidden o tokens --smat-solar-bg"
                .to_string(),
        );
    }
    for astro_rel in [
        "src/components/ProductQuickCard.astro",
        "src/components/QuickOrderTray.astro",
        "src/components/CycloneAndScreenReport.astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let src = fs::read_to_string(site_root.join(astro_rel)).map_err(|e| e.to_string())?;
        if !src.contains("<style>") {
            return Err(format!(
                "Hallazgo 1 (DEB-V32-01): {} carece de bloque <style> nativo scoped",
                astro_rel
            ));
        }
        for bad_tw in [
            "bg-slate-900",
            "text-slate-100",
            "grid-cols-2",
            "backdrop-blur-md",
            "border-slate-700",
        ] {
            if src.contains(bad_tw) {
                return Err(format!(
                    "Hallazgo 1/2 (DEB-V32-01/02): {} contiene clase utilitaria Tailwind huerfana '{}'",
                    astro_rel, bad_tw
                ));
            }
        }
    }

    let diag_src = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro"))
        .map_err(|e| e.to_string())?;
    for req_cad in [
        "cyclone_d6_d20",
        "coupled_pump_cyclone",
        "urethane_screen_th48",
        "lab_comminution_pan",
        "filter_plate_shifter",
    ] {
        if !diag_src.contains(req_cad) {
            return Err(format!(
                "Hallazgo 5 (DEB-V32-05): TechnicalDiagrams.astro carece del esquema CAD SVG '{}'",
                req_cad
            ));
        }
    }

    let qc_raw = fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json"))
        .map_err(|e| e.to_string())?;
    let qc_arr: serde_json::Value = serde_json::from_str(&qc_raw).map_err(|e| e.to_string())?;
    let skus = qc_arr
        .as_array()
        .ok_or("quick_checkout_Catalog.json debe ser un arreglo")?;
    if skus.len() != 19 {
        return Err(format!(
            "Hallazgo 3: Se esperaban 19 SKUs en quick_checkout_Catalog.json, encontrados: {}",
            skus.len()
        ));
    }
    let mut non_pump_zero_count = 0usize;
    let mut pump_non_zero_count = 0usize;
    for sku in skus {
        let id = sku.get("sku_id").and_then(|v| v.as_str()).unwrap_or("");
        if !id.starts_with("SMAT-") {
            return Err(format!(
                "Hallazgo 3 (DEB-V32-03): SKU '{}' no usa nomenclatura canonica SMAT-*",
                id
            ));
        }
        let legacy = sku
            .get("legacy_sku_id")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        if !legacy.starts_with("SKU-QC-") {
            return Err(format!(
                "Hallazgo 3: SKU '{}' carece de legacy_sku_id SKU-QC-*",
                id
            ));
        }
        let cad_type = sku
            .get("diagram_id")
            .or_else(|| sku.get("cad_diagram_type"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let expected_branch = format!("'{}'", cad_type);
        if cad_type.is_empty() || !diag_src.contains(&expected_branch) {
            return Err(format!(
                "Hallazgo 5: SKU '{}' referencia diagram_id '{}' no soportado en TechnicalDiagrams.astro",
                id, cad_type
            ));
        }
        let linked = sku
            .get("linked_atomic_codes")
            .and_then(|v| v.as_array())
            .ok_or("Falta linked_atomic_codes")?;
        if id.starts_with("SMAT-PUMP-") || id == "SMAT-COUPLED-PUMP-CYC" {
            if linked.is_empty() {
                return Err(format!(
                    "Hallazgo 7: SKU de bombeo '{}' debe tener linked_atomic_codes no vacio",
                    id
                ));
            }
            pump_non_zero_count += 1;
        } else {
            if !linked.is_empty() {
                return Err(format!(
                    "Hallazgo 7 (DEB-V32-08): SKU no-bomba '{}' contiene codigos atomicos de bomba falsos",
                    id
                ));
            }
            non_pump_zero_count += 1;
        }
    }
    if pump_non_zero_count != 6 || non_pump_zero_count != 13 {
        return Err(format!(
            "Hallazgo 7: Particion Honest Discriminated Union invalida (pump={}, non_pump={})",
            pump_non_zero_count, non_pump_zero_count
        ));
    }

    let img_builder = fs::read_to_string(site_root.join("tools/build_product_images.mjs"))
        .map_err(|e| e.to_string())?;
    if img_builder.to_lowercase().contains("expo.png") || img_builder.contains("i %") {
        return Err("Hallazgo 4 (DEB-V32-04): tools/build_product_images.mjs aun referencia 'expo.png' o fallback ciclico 'i %'".to_string());
    }

    for rel_wire in [
        "src/components/QuickOrderTray.astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let s = fs::read_to_string(site_root.join(rel_wire)).map_err(|e| e.to_string())?;
        if s.contains("526181234567") {
            return Err(format!(
                "Hallazgo 6 (DEB-V32-06): {} aun contiene el telefono falso 526181234567",
                rel_wire
            ));
        }
        if !s.contains("526183670664") {
            return Err(format!(
                "Hallazgo 6: {} no utiliza el WhatsApp oficial 526183670664",
                rel_wire
            ));
        }
    }
    for slug_rel in [
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let s = fs::read_to_string(site_root.join(slug_rel)).map_err(|e| e.to_string())?;
        if !s.contains("data-quick-tray-add") || !s.contains("#workbench") {
            return Err(format!(
                "Hallazgo 6 (DEB-V32-07): {} carece de cableado data-quick-tray-add o #workbench",
                slug_rel
            ));
        }
    }

    let dropin_src = fs::read_to_string(site_root.join("src/scripts/dropInEquivalenceGuard.js"))
        .map_err(|e| e.to_string())?;
    if !dropin_src.contains("FNV1A_HASH_TO_SKU_INDEX") {
        return Err(
            "Hallazgo 7 (D7=7-C+): dropInEquivalenceGuard.js carece de FNV1A_HASH_TO_SKU_INDEX"
                .to_string(),
        );
    }
    for check_oem in [
        "src/scripts/dropInEquivalenceGuard.js",
        "src/pages/catalogo/[code].astro",
        "src/pages/en/catalog/[code].astro",
    ] {
        let s = fs::read_to_string(site_root.join(check_oem)).map_err(|e| e.to_string())?;
        for forbidden_frame in ["4/3 C", "6/4 D", "8/6 E"] {
            if s.contains(forbidden_frame) {
                return Err(format!(
                    "Hallazgo 7 (DEB-V32-09): {} contiene nomenclatura de bastidor OEM en texto plano '{}'",
                    check_oem, forbidden_frame
                ));
            }
        }
    }

    let redirects_raw =
        fs::read_to_string(site_root.join("public/_redirects")).map_err(|e| e.to_string())?;
    let redirect_lines: Vec<&str> = redirects_raw
        .lines()
        .filter(|l| !l.trim().is_empty() && !l.starts_with('#'))
        .collect();
    if redirect_lines.len() < 105 {
        return Err(format!(
            "Hallazgo 7 (D8=8-C+): public/_redirects debe tener >= 105 reglas 301 (encontradas: {})",
            redirect_lines.len()
        ));
    }
    for req_wb in [
        "/producto/balanza-marcy",
        "/producto/plato-tentadura",
        "/etiqueta-producto/rotap",
        "/clasificar_solidos.php",
        "/producto/2119",
        "/equipos-para-la-flotacion-de-minerales",
        "/quote-list",
    ] {
        if !redirects_raw.contains(req_wb) {
            return Err(format!(
                "Hallazgo 7 (D8=8-C+): public/_redirects carece de regla Wayback Machine 301 '{}'",
                req_wb
            ));
        }
    }

    for acuse_rel in ["src/pages/acuse.astro", "src/pages/en/thank-you.astro"] {
        let s = fs::read_to_string(site_root.join(acuse_rel)).map_err(|e| e.to_string())?;
        for bad_sla in [
            "SLA MISMO DÍA HÁBIL",
            "SAME-DAY SLA",
            "Banco de Pruebas",
            "Test Bench",
        ] {
            if s.contains(bad_sla) {
                return Err(format!(
                    "Hallazgo 7 (DEB-V32-10): {} contiene claim prohibido '{}'",
                    acuse_rel, bad_sla
                ));
            }
        }
    }

    for celdas_rel in [
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/cells.astro",
    ] {
        let s = fs::read_to_string(site_root.join(celdas_rel)).map_err(|e| e.to_string())?;
        if s.contains("badge-capex") || s.contains("[CAPEX:") || !s.contains("badge-opex") {
            return Err(format!(
                "Hallazgo 7 (DEB-V32-11): {} contiene badge-capex o carece de badge-opex",
                celdas_rel
            ));
        }
    }

    let skid_word_re = Regex::new(r"(?i)\bskids?\b").unwrap();
    for nav_rel in [
        "src/pages/index.astro",
        "src/pages/en/index.astro",
        "src/components/Header.astro",
        "src/pages/acuse.astro",
        "src/pages/en/thank-you.astro",
    ] {
        let s = fs::read_to_string(site_root.join(nav_rel)).map_err(|e| e.to_string())?;
        if skid_word_re.is_match(&s) {
            return Err(format!(
                "Hallazgo 7 (DEB-V32-12): {} aun contiene la palabra prohibida 'Skid/Skids'",
                nav_rel
            ));
        }
    }
    let idx_es =
        fs::read_to_string(site_root.join("src/pages/index.astro")).map_err(|e| e.to_string())?;
    if !idx_es.contains("Puerta 1 • Bombeo de Lodos y Refacciones")
        || !idx_es.contains("Puerta 2 • Clasificación y Cribado Fino")
        || !idx_es.contains("Puerta 3 • Flotación, Filtración y Lab")
    {
        return Err("Hallazgo 7 (D9=9-C+): src/pages/index.astro carece de las 3 Puertas Canonicas (Puerta 1 Bombeo, Puerta 2 Clasificacion, Puerta 3 Flotacion/Filtracion/Lab)".to_string());
    }

    if !site_root
        .join("tests/smat_v33_full_prd_parity.test.mjs")
        .exists()
    {
        return Err(
            "Falta suite de pruebas tests/smat_v33_full_prd_parity.test.mjs (Cierre v3.3)"
                .to_string(),
        );
    }
    let qcard_src = fs::read_to_string(site_root.join("src/components/ProductQuickCard.astro"))
        .map_err(|e| e.to_string())?;
    for req_qcard in [
        "data-qcard-fiscal-badge",
        "data-qcard-config",
        "data-qcard-wa-btn",
        "data-qcard-add-btn",
    ] {
        if !qcard_src.contains(req_qcard) {
            return Err(format!(
                "v3.3 (D3-V33): ProductQuickCard.astro carece de '{}'",
                req_qcard
            ));
        }
    }
    for home_rel in ["src/pages/index.astro", "src/pages/en/index.astro"] {
        let home_src = fs::read_to_string(site_root.join(home_rel)).map_err(|e| e.to_string())?;
        if !home_src.contains("data-family-chip=") || !home_src.contains("<ProductQuickCard") {
            return Err(format!(
                "v3.3 (D4-V33): {} carece de chips de 8 familias o <ProductQuickCard /> en Home",
                home_rel
            ));
        }
        if home_src.contains("codigo=${p.code}") {
            return Err(format!(
                "v3.3 (DEB-V33-03): {} aun contiene enlace roto codigo=${{p.code}}",
                home_rel
            ));
        }
    }
    let xray_style_count = diag_src.matches("style={xrayWearStyle}").count();
    if xray_style_count < 15 {
        return Err(format!(
            "v3.3 (D5-V33): TechnicalDiagrams.astro debe aplicar style={{xrayWearStyle}} en los 15 diagramas (encontrados: {})",
            xray_style_count
        ));
    }
    if !img_builder.contains("cropBox:") || !img_builder.contains("buildCadBlueprintSvg") {
        return Err("v3.3 (D6-V33): tools/build_product_images.mjs carece de cropBox o buildCadBlueprintSvg".to_string());
    }

    Ok(())
}

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
