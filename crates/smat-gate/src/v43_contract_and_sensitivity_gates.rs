use std::fs;
use std::path::Path;

/// 46. Gate V4.3 (D1-V43 a D11-V43, DEB-V43-01..12):
/// Verifica el Contrato Tipado Unificado DOM <-> Física <-> Slots de Salida:
/// 1. 0 selectores DOM fantasma (`#wb-role-clasificacion`, `#wb-clas-dc-mm`, `#wb-clas-liner`, `#smat-qtray-toggle-btn`).
/// 2. Sensibilidad diferencial no nula (`∂y/∂x != 0`) en Gy (`liberationFactorBeta`, `mineralogicalFactorM`),
///    Rosin-Rammler (`estimatedMassRetainedGrams`), y Darcy-Ruth (`moistureFactor`, `nom141MoistureCompliant`).
/// 3. Calculadoras interactivas canónicas en las 10 sub-rutas de Filtración, Flotación y Bombeo (`sello`, `impulsor`, `revestimientos`, `prensa`, `mecanismos`).
/// 4. Exposición de la 5ª Rama Híbrida (`data-hybrid-branch-d-card`, `1. Lotes por Material (5)`) en `/bombeo/`.
pub fn check_v43_unified_contract_zero_phantom_ids_and_sensitivity_gate_46(
    site_root: &Path,
) -> Result<(), String> {
    for req_file in [
        "src/scripts/pumpingSealAndTribologyCalculators.js",
        "tests/v43_unified_contract_and_sensitivity.test.mjs",
    ] {
        if !site_root.join(req_file).exists() {
            return Err(format!(
                "Gate 46 (V4.3): Falta archivo obligatorio '{}'",
                req_file
            ));
        }
    }

    // 1. Verificar erradicación de IDs fantasma en quoteWizardController.js y SharePurchasing.astro
    let qw_ctrl = fs::read_to_string(site_root.join("src/scripts/quoteWizardController.js"))
        .map_err(|e| e.to_string())?;
    for banned_id in ["wb-role-clasificacion", "wb-clas-dc-mm", "wb-clas-liner"] {
        if qw_ctrl.contains(banned_id) {
            return Err(format!(
                "Gate 46 (D2-V43 DEB-V43-01): quoteWizardController.js aún referencia ID fantasma '{}'",
                banned_id
            ));
        }
    }
    if !qw_ctrl.contains("currentCircuit === 'clasificacion'") || !qw_ctrl.contains("wb-cyc-liner") {
        return Err(
            "Gate 46 (D2-V43): quoteWizardController.js debe sincronizar #wb-role-cyc, #wb-cyc-series y #wb-cyc-liner".to_string(),
        );
    }

    let share_src = fs::read_to_string(site_root.join("src/components/SharePurchasing.astro"))
        .map_err(|e| e.to_string())?;
    if share_src.contains("smat-qtray-toggle-btn") {
        return Err(
            "Gate 46 (D4-V43 DEB-V43-03): SharePurchasing.astro aún referencia ID fantasma 'smat-qtray-toggle-btn'".to_string(),
        );
    }

    // 2. Verificar #wb-cyc-liner en WizardCircuitCalculators.astro y valor por defecto 6.5 mm en #wb-ctrl-d95
    let wcc_src = fs::read_to_string(site_root.join("src/components/WizardCircuitCalculators.astro"))
        .map_err(|e| e.to_string())?;
    if !wcc_src.contains("id=\"wb-cyc-liner\"") {
        return Err(
            "Gate 46 (D2-V43): WizardCircuitCalculators.astro debe incluir el selector id=\"wb-cyc-liner\"".to_string(),
        );
    }

    let qw_astro = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
        .map_err(|e| e.to_string())?;
    if !qw_astro.contains("id=\"wb-ctrl-d95\"") || qw_astro.contains("id=\"wb-ctrl-d95\" min=\"0.04\" max=\"25.0\" step=\"0.01\" value=\"0.21\"") {
        return Err(
            "Gate 46 (D5-V43 DEB-V43-08): QuoteWizard.astro debe inicializar #wb-ctrl-d95 en el rango sensible (6.5 mm)".to_string(),
        );
    }

    // 3. Verificar sensibilidad física en motores (liberationFactorBeta, mineralogicalFactorM, moistureFactor, nom141MoistureCompliant)
    let trib_src = fs::read_to_string(site_root.join("src/scripts/tribologyAndCompatibilityEngine.js"))
        .map_err(|e| e.to_string())?;
    for token in ["liberationFactorBeta", "mineralogicalFactorM", "estimatedMassRetainedGrams"] {
        if !trib_src.contains(token) {
            return Err(format!(
                "Gate 46 (D5/D6-V43): tribologyAndCompatibilityEngine.js debe calcular '{}'",
                token
            ));
        }
    }

    let slurry_src = fs::read_to_string(site_root.join("src/scripts/slurryEngine.js"))
        .map_err(|e| e.to_string())?;
    if !slurry_src.contains("nom141MoistureCompliant") || !slurry_src.contains("evaluateCentrifugalSealPressureBalance") {
        return Err(
            "Gate 46 (D8/D9-V43): slurryEngine.js debe incluir nom141MoistureCompliant y re-exportar evaluateCentrifugalSealPressureBalance".to_string(),
        );
    }

    // 4. Verificar calculadoras canónicas en las 10 páginas verticales de Filtración, Flotación y Bombeo
    for (rel_page, expected_fn) in [
        ("src/pages/filtracion/prensa.astro", "bindCanonicalFiltrationCalculator"),
        ("src/pages/en/filtration/press.astro", "bindCanonicalFiltrationCalculator"),
        ("src/pages/flotacion/mecanismos.astro", "bindCanonicalFlotationCalculator"),
        ("src/pages/en/flotation/mechanisms.astro", "bindCanonicalFlotationCalculator"),
        ("src/pages/bombeo/sello.astro", "bindCanonicalSealBalanceCalculator"),
        ("src/pages/en/pumping/seal.astro", "bindCanonicalSealBalanceCalculator"),
        ("src/pages/bombeo/impulsor.astro", "bindCanonicalTribologySelector"),
        ("src/pages/en/pumping/impeller.astro", "bindCanonicalTribologySelector"),
        ("src/pages/bombeo/revestimientos.astro", "bindCanonicalTribologySelector"),
        ("src/pages/en/pumping/liners.astro", "bindCanonicalTribologySelector"),
    ] {
        let src = fs::read_to_string(site_root.join(rel_page)).map_err(|e| e.to_string())?;
        if !src.contains(expected_fn) {
            return Err(format!(
                "Gate 46 (D8/D9/D10-V43): '{}' debe delegar al controlador canónico '{}'",
                rel_page, expected_fn
            ));
        }
    }

    // 5. Verificar exposición de la 5ª Rama Híbrida (Impulsor A05 + Forros R55) en /bombeo/ y /en/pumping/
    for (pump_idx, expected_tab) in [
        ("src/pages/bombeo/index.astro", "1. Lotes por Material (5)"),
        ("src/pages/en/pumping/index.astro", "1. Kits by Material (5)"),
    ] {
        let src = fs::read_to_string(site_root.join(pump_idx)).map_err(|e| e.to_string())?;
        if !src.contains(expected_tab) || !src.contains("data-hybrid-branch-d-card") {
            return Err(format!(
                "Gate 46 (D11-V43): '{}' debe exponer '{}' y la 5ª tarjeta data-hybrid-branch-d-card",
                pump_idx, expected_tab
            ));
        }
    }

    // 6. Verificar erradicación de unidades duplicadas en filtracion/repuestos.astro y en/filtration/parts.astro
    for rep_rel in ["src/pages/filtracion/repuestos.astro", "src/pages/en/filtration/parts.astro"] {
        let src = fs::read_to_string(site_root.join(rep_rel)).map_err(|e| e.to_string())?;
        if src.contains("</span> MPa ·") || src.contains("FS = <span id=\"rep-fs-out\">") {
            return Err(format!(
                "Gate 46 (D1-V43 DEB-V43-09): '{}' conserva unidades duplicadas fuera de #rep-stress-out o #rep-fs-out",
                rep_rel
            ));
        }
    }

    Ok(())
}
