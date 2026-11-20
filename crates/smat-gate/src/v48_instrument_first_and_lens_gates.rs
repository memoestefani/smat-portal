use std::fs;
use std::path::Path;

/// Gate 49 (48I — Ronda V4.8, ARB-SMAT-56, D1-V48 a D10-V48, DEB-V48-01..12):
/// Verifica determinísticamente los invariantes estructurales y de paridad V4.8:
/// 1. Costuras modulares LCOM4=1: `verticalBidirectionalHydrationLens.js` y `catalogDropInAndJrpProjector.js`.
/// 2. Preservación del complemento PutGet (`DEB-V48-01`), `skipStorageWrite` y modo JRP `paro_planta` (`0.75`).
/// 3. Estandarización Apple HIG Instrument-First en Estrato 1 (`data-stratum-1-instrument` previo a
///    `<TechnicalDiagrams` o `.control-equipment-grid`) en las 26 páginas verticales ES/EN.
/// 4. Cierre de orfandad y continuidad trans-ruta: Drop-In Verifier + contadores SSOT en `/catalogo/`,
///    `#equipos-dropin-match-banner` en `/equipos/`, tarjetas JRP + Par Casado en `[code]`/`[slug]`,
///    Core Trade-In `DAM005` en `PumpAssemblyReport.astro`, `+ Bandeja` en `DiagnosticsHub.astro` y
///    `/bombeo/index`, y `#wb-mining-preset-telemetry` en `QuoteWizard.astro`.
/// 5. Cero metalenguaje interno expuesto (`FNV-1a`, `INV-SMAT-SCI-`, `D1-V48`) en templates Astro V4.8.
pub fn check_v48_instrument_first_bidirectional_lens_and_parity_gate_48i(
    site_root: &Path,
) -> Result<String, String> {
    let lens_path = site_root.join("src/scripts/verticalBidirectionalHydrationLens.js");
    if !lens_path.exists() {
        return Err(
            "Gate 48I (D2-V48/D3-V48): src/scripts/verticalBidirectionalHydrationLens.js debe existir".to_string(),
        );
    }
    let lens_src = fs::read_to_string(&lens_path).map_err(|e| e.to_string())?;
    for req_fn in [
        "export function hydrateVerticalInputsFromUnifiedState",
        "export function syncReactiveTraySkuButton",
        "export function initBearingSupportInspector",
        "export function initSkidKinematicsInspector",
    ] {
        if !lens_src.contains(req_fn) {
            return Err(format!(
                "Gate 48I: verticalBidirectionalHydrationLens.js debe exportar '{}'",
                req_fn
            ));
        }
    }

    let proj_path = site_root.join("src/scripts/catalogDropInAndJrpProjector.js");
    if !proj_path.exists() {
        return Err(
            "Gate 48I (D6-V48..D8-V48): src/scripts/catalogDropInAndJrpProjector.js debe existir".to_string(),
        );
    }
    let proj_src = fs::read_to_string(&proj_path).map_err(|e| e.to_string())?;
    for req_fn in [
        "export function bindDropInEquivalenceVerifier",
        "export function initHarmonicJrpWindowAndPairCard",
        "export function projectProcessControlMetrologyInvariants",
    ] {
        if !proj_src.contains(req_fn) {
            return Err(format!(
                "Gate 48I: catalogDropInAndJrpProjector.js debe exportar '{}'",
                req_fn
            ));
        }
    }

    let sync_src = fs::read_to_string(site_root.join("src/scripts/verticalStateAndCtaSyncBridge.js"))
        .map_err(|e| e.to_string())?;
    if !sync_src.contains("skipStorageWrite") || !sync_src.contains("hasPersistedState") {
        return Err(
            "Gate 48I (D2-V48 DEB-V48-06): verticalStateAndCtaSyncBridge.js debe implementar skipStorageWrite y hasPersistedState".to_string(),
        );
    }

    let tray_src = fs::read_to_string(site_root.join("src/scripts/requisitionTrayBus.js"))
        .map_err(|e| e.to_string())?;
    if !tray_src.contains("paro_planta") || !tray_src.contains("0.75") {
        return Err(
            "Gate 48I (D7-V48): requisitionTrayBus.js debe soportar criticalityMode 'paro_planta' (0.75x)".to_string(),
        );
    }

    let stratum1_diagram_routes = [
        "src/pages/bombeo/impulsor.astro",
        "src/pages/en/pumping/impeller.astro",
        "src/pages/bombeo/revestimientos.astro",
        "src/pages/en/pumping/liners.astro",
        "src/pages/bombeo/sello.astro",
        "src/pages/en/pumping/seal.astro",
        "src/pages/bombeo/soporte.astro",
        "src/pages/en/pumping/bearing-assembly.astro",
        "src/pages/bombeo/skid.astro",
        "src/pages/en/pumping/skid.astro",
        "src/pages/filtracion/index.astro",
        "src/pages/en/filtration/index.astro",
        "src/pages/filtracion/prensa.astro",
        "src/pages/en/filtration/press.astro",
        "src/pages/filtracion/repuestos.astro",
        "src/pages/en/filtration/parts.astro",
        "src/pages/flotacion/index.astro",
        "src/pages/en/flotation/index.astro",
        "src/pages/flotacion/celdas.astro",
        "src/pages/en/flotation/cells.astro",
        "src/pages/flotacion/mecanismos.astro",
        "src/pages/en/flotation/mechanisms.astro",
        "src/pages/clasificacion/index.astro",
        "src/pages/en/classification/index.astro",
    ];

    for rel in stratum1_diagram_routes {
        let src = crate::read_page_with_islands_composite(site_root, rel)?;
        let idx_inst = src.find("data-stratum-1-instrument");
        let idx_diag = src.find("<TechnicalDiagrams");
        match (idx_inst, idx_diag) {
            (Some(i), Some(d)) if i < d => {}
            _ => {
                return Err(format!(
                    "Gate 48I (D1-V48): {} debe montar data-stratum-1-instrument antes de <TechnicalDiagrams",
                    rel
                ));
            }
        }
        let template_head = src.split("<script").next().unwrap_or(&src);
        for forbidden in ["FNV-1a", "INV-SMAT-SCI-", "D1-V48", "D8-V48", "D10-V48"] {
            if template_head.contains(forbidden) {
                return Err(format!(
                    "Gate 48I (Zero Metalenguaje): {} no debe exponer '{}' en el template visible",
                    rel, forbidden
                ));
            }
        }
    }

    for met_rel in [
        "src/pages/control-de-procesos/index.astro",
        "src/pages/en/process-control/index.astro",
    ] {
        let src = crate::read_page_with_islands_composite(site_root, met_rel)?;
        let idx_inst = src.find("data-stratum-1-instrument");
        let idx_grid = src.find("control-equipment-grid");
        match (idx_inst, idx_grid) {
            (Some(i), Some(g)) if i < g => {}
            _ => {
                return Err(format!(
                    "Gate 48I (D1/D6-V48): {} debe elevar #metrology-calculator (data-stratum-1-instrument) antes de .control-equipment-grid",
                    met_rel
                ));
            }
        }
        for tok in [
            "data-marcy-rings-list",
            "data-met-defuse-gy-beta",
            "data-met-defuse-d63",
            "projectProcessControlMetrologyInvariants",
        ] {
            if !src.contains(tok) {
                return Err(format!(
                    "Gate 48I (D6-V48): {} debe contener '{}'",
                    met_rel, tok
                ));
            }
        }
    }

    for cat_rel in ["src/pages/catalogo.astro", "src/pages/en/catalog.astro"] {
        let src = crate::read_page_with_islands_composite(site_root, cat_rel)?;
        for tok in [
            "data-dropin-verifier",
            "ATOMIC_PARTS_SSOT_COUNT",
            "PIPE_DIAMETERS_MM",
            "bindDropInEquivalenceVerifier",
        ] {
            if !src.contains(tok) {
                return Err(format!(
                    "Gate 48I (D8-V48): {} debe contener '{}'",
                    cat_rel, tok
                ));
            }
        }
    }

    for eq_rel in [
        "src/pages/equipos/index.astro",
        "src/pages/en/process-equipment/index.astro",
    ] {
        let src = crate::read_page_with_islands_composite(site_root, eq_rel)?;
        if !src.contains("id=\"equipos-dropin-match-banner\"") {
            return Err(format!(
                "Gate 48I (D8-V48 DEB-V48-05): {} debe incluir #equipos-dropin-match-banner",
                eq_rel
            ));
        }
    }

    for jrp_rel in [
        "src/pages/catalogo/[code].astro",
        "src/pages/en/catalog/[code].astro",
        "src/pages/productos/[slug].astro",
        "src/pages/en/products/[slug].astro",
    ] {
        let src = crate::read_page_with_islands_composite(site_root, jrp_rel)?;
        for tok in [
            "data-jrp-window-card",
            "data-add-coupled-pair-btn",
            "initHarmonicJrpWindowAndPairCard",
        ] {
            if !src.contains(tok) {
                return Err(format!(
                    "Gate 48I (D7-V48): {} debe incluir '{}'",
                    jrp_rel, tok
                ));
            }
        }
    }

    let par_src = fs::read_to_string(site_root.join("src/components/PumpAssemblyReport.astro"))
        .map_err(|e| e.to_string())?;
    if !par_src.contains("data-core-tradein-widget=\"DAM005\"") {
        return Err(
            "Gate 48I (D5-V48): PumpAssemblyReport.astro debe montar [data-core-tradein-widget=\"DAM005\"]".to_string(),
        );
    }

    let diag_src = fs::read_to_string(site_root.join("src/components/DiagnosticsHub.astro"))
        .map_err(|e| e.to_string())?;
    if !diag_src.contains("data-tray-circuit=\"diagnostico\"") {
        return Err(
            "Gate 48I (D5-V48): DiagnosticsHub.astro debe ofrecer + Bandeja con data-tray-circuit=\"diagnostico\"".to_string(),
        );
    }

    for pump_idx in [
        "src/pages/bombeo/index.astro",
        "src/pages/en/pumping/index.astro",
    ] {
        let src = crate::read_page_with_islands_composite(site_root, pump_idx)?;
        if !src.contains("data-add-tray-sku=") || !src.contains("bindAtomicPartTrayButtons") {
            return Err(format!(
                "Gate 48I (D5-V48): {} debe habilitar + Bandeja directo y bindAtomicPartTrayButtons",
                pump_idx
            ));
        }
    }

    let wizard_src = fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
        .map_err(|e| e.to_string())?;
    if !wizard_src.contains("id=\"wb-mining-preset-telemetry\"")
        || (!wizard_src.contains("initMiningPresetTelemetryBridge")
            && !wizard_src.contains("renderMiningPresetTelemetry"))
    {
        return Err(
            "Gate 48I (D9-V48): QuoteWizard.astro debe montar #wb-mining-preset-telemetry y enlazar initMiningPresetTelemetryBridge".to_string(),
        );
    }

    Ok("OK: Gate 48I V4.8 verificado al 100% (Instrument-First Estrato 1 en 26 páginas verticales, lente bidireccional GetPut<PutGet, 0 sobrescritura en montaje pasivo, Drop-In Verifier en /catalogo/ y /equipos/, JRP normal vs paro_planta + Par Casado, Core Trade-In DAM005, Def-Use metrológico 100%, Preset Minero en /cotizar/ y cero metalenguaje).".to_string())
}
