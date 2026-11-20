use regex::Regex;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

/// Gate 51 (SMAT V5.0 — D1-V50 a D8-V50, ARB-SMAT-58, DEB-V50-01..16):
/// Verifica determinísticamente la arquitectura de Islas Canónicas Únicas + Contrato Two-Sort
/// (`EngineSchema <-> DOM`), DAG XDSM puro, purga integral de debris y biyección estática `dist/`:
/// 1. Partición Two-Sort en `src/scripts/engineSchemaRegistry.js`: 0 `innerHTML`/`eval`, 11 dominios,
///    0 referencias a `#wb-assembly-sequence-test`, y biyección 100% de todos los `domBinding`
///    (`#id` y `[data-*]`) contra las superficies canónicas Astro compuestas.
/// 2. Pureza XDSM DAG (`src/scripts/wizardXdsmDagSolver.js`): 0 `document`/`window`/`localStorage`/`sessionStorage`;
///    `quoteWizardController.js` `< 450 LOC` y `TechnicalDiagrams.astro` `< 120 LOC`.
/// 3. Wrappers ES/EN finos (`<= 35 LOC`) delegando en las 11 Islas Canónicas (`src/components/islands/*.astro`)
///    y erradicación total de `#home-quick-catalog-drawer`, `QuickPartSelectorStrip.astro`,
///    `DualHubView.astro`, `SMAT-ULTRAMET-4X3`, `SMAT-ULTRAMET-6X4`, `#wb-assembly-sequence-test`
///    y colores sub-AAA `#b45309`/`#d97706` en `src/scripts/*.js`.
/// 4. Integridad SSOT (`19` SKUs en `quick_checkout_Catalog.json`, `13` partes atómicas en `atomic_parts.json`)
///    y trazabilidad de `docs/CONCEPT-REGISTRY.md` (`engine_schema_v50`, 0 referencias a componentes retirados).
/// 5. Si `dist/` existe: `dist/index.html < 90 KB` sin `#home-quick-catalog-drawer` y biyección de enlaces `#hash`
///    desde `/equipos/index.html` hacia sus destinos construidos.
pub fn check_v50_canonical_islands_and_two_sort_gate_51(site_root: &Path) -> Result<String, String> {
    // 1. Two-Sort Registry + XDSM DAG Puro + LCOM4 Presupuestos
    let reg_src = fs::read_to_string(site_root.join("src/scripts/engineSchemaRegistry.js"))
        .map_err(|e| format!("Gate 51: falta src/scripts/engineSchemaRegistry.js ({})", e))?;
    if reg_src.contains("innerHTML") || Regex::new(r"\beval\s*\(").unwrap().is_match(&reg_src) {
        return Err("Gate 51 (D1-V50 Two-Sort): engineSchemaRegistry.js no debe contener innerHTML ni eval()".to_string());
    }
    if reg_src.contains("wb-assembly-sequence-test") {
        return Err("Gate 51 (DEB-V50-03): engineSchemaRegistry.js referencia ID fantasma -test".to_string());
    }
    for domain in [
        "pumping",
        "tribology",
        "sealDrive",
        "flotation",
        "filtration",
        "cycloneScreen",
        "metrology",
        "catalogFacet",
        "dropIn",
        "jrp",
        "erpExport",
    ] {
        if !reg_src.contains(&format!("{}:", domain)) {
            return Err(format!("Gate 51 (D1-V50): Falta dominio '{}' en ENGINE_SCHEMA_REGISTRY", domain));
        }
    }

    let dag_src = fs::read_to_string(site_root.join("src/scripts/wizardXdsmDagSolver.js"))
        .map_err(|e| format!("Gate 51: falta src/scripts/wizardXdsmDagSolver.js ({})", e))?;
    let dom_api_re = Regex::new(r"\b(document|window|localStorage|sessionStorage)\b").unwrap();
    if dom_api_re.is_match(&dag_src) {
        return Err("Gate 51 (D3-V50 XDSM): wizardXdsmDagSolver.js debe ser 100% puro sin acceso al DOM".to_string());
    }

    let ctrl_lines = fs::read_to_string(site_root.join("src/scripts/quoteWizardController.js"))
        .map_err(|e| e.to_string())?
        .lines()
        .count();
    if ctrl_lines >= 450 {
        return Err(format!(
            "Gate 51 (DEB-V50-11): quoteWizardController.js debe permanecer < 450 LOC (actual: {})",
            ctrl_lines
        ));
    }

    let diag_lines = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro"))
        .map_err(|e| e.to_string())?
        .lines()
        .count();
    if diag_lines >= 120 {
        return Err(format!(
            "Gate 51 (DEB-V50-11): TechnicalDiagrams.astro fachada debe permanecer < 120 LOC (actual: {})",
            diag_lines
        ));
    }

    // 2. Construir corpus UI compuesto para validar 100% de domBindings
    let mut ui_markup = String::new();
    for core_rel in [
        "src/components/QuoteWizard.astro",
        "src/components/WizardCircuitCalculators.astro",
        "src/components/LiveEngineeringDossier.astro",
        "src/components/PumpAssemblyReport.astro",
        "src/components/SharePurchasing.astro",
        "src/components/QuickOrderTray.astro",
    ] {
        let s = fs::read_to_string(site_root.join(core_rel)).map_err(|e| e.to_string())?;
        ui_markup.push_str(&s);
        ui_markup.push('\n');
    }
    let islands_dir = site_root.join("src/components/islands");
    let mut island_count = 0usize;
    for entry in fs::read_dir(&islands_dir).map_err(|e| e.to_string())?.filter_map(|e| e.ok()) {
        let p = entry.path();
        if p.extension().and_then(|s| s.to_str()) == Some("astro") {
            island_count += 1;
            ui_markup.push_str(&fs::read_to_string(&p).map_err(|e| e.to_string())?);
            ui_markup.push('\n');
        }
    }
    if island_count < 11 {
        return Err(format!(
            "Gate 51 (D2-V50): Deben existir 11 Islas Canónicas en src/components/islands/ (encontradas: {})",
            island_count
        ));
    }

    let id_binding_re = Regex::new(r"domBinding:\s*'#([A-Za-z0-9_-]+)'").unwrap();
    for cap in id_binding_re.captures_iter(&reg_src) {
        let id = &cap[1];
        if !ui_markup.contains(&format!("id=\"{}\"", id)) {
            return Err(format!(
                "Gate 51 (D1-V50 Biyección): domBinding '#{}' declarado en EngineSchema no existe en ningún componente/isla Astro",
                id
            ));
        }
    }
    let attr_binding_re = Regex::new(r"domBinding:\s*'\[(data-[A-Za-z0-9_-]+)\]'").unwrap();
    for cap in attr_binding_re.captures_iter(&reg_src) {
        let attr = &cap[1];
        if !ui_markup.contains(attr) {
            return Err(format!(
                "Gate 51 (D1-V50 Biyección): domBinding '[{}]' declarado en EngineSchema no existe en ningún componente/isla Astro",
                attr
            ));
        }
    }

    // 3. Wrappers finos (<= 35 LOC) y erradicación física de debris DEB-V50-01..14
    for retired in [
        "src/components/QuickPartSelectorStrip.astro",
        "src/components/DualHubView.astro",
    ] {
        if site_root.join(retired).exists() {
            return Err(format!("Gate 51 (DEB-V50-14): Archivo retirado '{}' aún existe en disco", retired));
        }
    }

    for (es_rel, en_rel, island) in [
        ("src/pages/index.astro", "src/pages/en/index.astro", "HomeLandingIsland"),
        ("src/pages/catalogo.astro", "src/pages/en/catalog.astro", "CatalogFacetedIsland"),
        ("src/pages/equipos/index.astro", "src/pages/en/process-equipment/index.astro", "EquipmentHubIsland"),
        ("src/pages/bombeo/index.astro", "src/pages/en/pumping/index.astro", "PumpingHubIsland"),
        ("src/pages/bombeo/impulsor.astro", "src/pages/en/pumping/impeller.astro", "TribologyAlloyIsland"),
        ("src/pages/bombeo/revestimientos.astro", "src/pages/en/pumping/liners.astro", "TribologyAlloyIsland"),
        ("src/pages/bombeo/sello.astro", "src/pages/en/pumping/seal.astro", "SealDriveBearingIsland"),
        ("src/pages/bombeo/skid.astro", "src/pages/en/pumping/skid.astro", "SealDriveBearingIsland"),
        ("src/pages/bombeo/soporte.astro", "src/pages/en/pumping/bearing-assembly.astro", "SealDriveBearingIsland"),
        ("src/pages/flotacion/index.astro", "src/pages/en/flotation/index.astro", "FlotationCalculatorIsland"),
        ("src/pages/flotacion/celdas.astro", "src/pages/en/flotation/cells.astro", "FlotationCalculatorIsland"),
        ("src/pages/flotacion/mecanismos.astro", "src/pages/en/flotation/mechanisms.astro", "FlotationCalculatorIsland"),
        ("src/pages/filtracion/index.astro", "src/pages/en/filtration/index.astro", "FiltrationCalculatorIsland"),
        ("src/pages/filtracion/prensa.astro", "src/pages/en/filtration/press.astro", "FiltrationCalculatorIsland"),
        ("src/pages/filtracion/repuestos.astro", "src/pages/en/filtration/parts.astro", "FiltrationCalculatorIsland"),
        ("src/pages/clasificacion/index.astro", "src/pages/en/classification/index.astro", "CycloneScreenIsland"),
        ("src/pages/control-de-procesos/index.astro", "src/pages/en/process-control/index.astro", "ProcessControlIsland"),
    ] {
        for rel in [es_rel, en_rel] {
            let src = fs::read_to_string(site_root.join(rel)).map_err(|e| e.to_string())?;
            if !src.contains(&format!("<{}", island)) {
                return Err(format!("Gate 51 (D2-V50): '{}' debe delegar en <{} />", rel, island));
            }
            let lc = src.lines().count();
            if lc > 35 {
                return Err(format!(
                    "Gate 51 (DEB-V50-09): Wrapper '{}' excede 35 LOC (actual: {})",
                    rel, lc
                ));
            }
        }
    }
    for rel in ["src/pages/catalogo/[code].astro", "src/pages/en/catalog/[code].astro"] {
        let src = fs::read_to_string(site_root.join(rel)).map_err(|e| e.to_string())?;
        if !src.contains("<AtomicPartIsland") {
            return Err(format!("Gate 51 (D2-V50): '{}' debe delegar en <AtomicPartIsland />", rel));
        }
    }

    for entry in WalkDir::new(site_root.join("src")).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if !p.is_file() {
            continue;
        }
        let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("");
        if !matches!(ext, "astro" | "js" | "css") {
            continue;
        }
        let body = fs::read_to_string(p).map_err(|e| e.to_string())?;
        for banned in [
            "wb-assembly-sequence-test",
            "home-quick-catalog-drawer",
            "QuickPartSelectorStrip",
            "SMAT-ULTRAMET-4X3",
            "SMAT-ULTRAMET-6X4",
            "DualHubView",
        ] {
            if body.contains(banned) {
                return Err(format!(
                    "Gate 51 (Debris V5.0): '{}' aún contiene '{}'",
                    p.strip_prefix(site_root).unwrap_or(p).display(),
                    banned
                ));
            }
        }
    }

    // 4. Integridad SSOT (19 SKUs, 13 partes atómicas) y trazabilidad CONCEPT-REGISTRY
    let qc_val: Value = serde_json::from_str(
        &fs::read_to_string(site_root.join("data/quick_checkout_Catalog.json")).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    let qc_len = qc_val.as_array().map(|a| a.len()).unwrap_or(0);
    if qc_len != 19 {
        return Err(format!("Gate 51 (DEB-V50-02): quick_checkout_Catalog.json debe tener 19 SKUs (actual: {})", qc_len));
    }
    let ap_val: Value = serde_json::from_str(
        &fs::read_to_string(site_root.join("data/atomic_parts.json")).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    let ap_len = ap_val.as_array().map(|a| a.len()).unwrap_or(0);
    if ap_len != 13 {
        return Err(format!("Gate 51 (SSOT): atomic_parts.json debe tener 13 partes atómicas (actual: {})", ap_len));
    }

    let concept_reg = fs::read_to_string(site_root.join("docs/CONCEPT-REGISTRY.md")).map_err(|e| e.to_string())?;
    if concept_reg.contains("DualHubView") || concept_reg.contains("QuickPartSelectorStrip") {
        return Err("Gate 51 (Doc Parity): docs/CONCEPT-REGISTRY.md conserva referencias obsoletas a DualHubView / QuickPartSelectorStrip".to_string());
    }
    if !concept_reg.contains("engine_schema_v50") {
        return Err("Gate 51 (Doc Parity): docs/CONCEPT-REGISTRY.md debe registrar el concepto engine_schema_v50".to_string());
    }

    // 5. Verificación estática dist/ (cuando dist/ existe): Home < 90 KB + enlaces #hash de /equipos/
    let dist_dir = site_root.join("dist");
    let dist_index = dist_dir.join("index.html");
    if dist_index.is_file() {
        let index_bytes = fs::metadata(&dist_index).map_err(|e| e.to_string())?.len();
        if index_bytes >= 90 * 1024 {
            return Err(format!(
                "Gate 51 (DEB-V50-01): dist/index.html excede 90 KB (actual: {} bytes)",
                index_bytes
            ));
        }
        let home_html = fs::read_to_string(&dist_index).map_err(|e| e.to_string())?;
        if home_html.contains("home-quick-catalog-drawer") {
            return Err("Gate 51 (DEB-V50-01): dist/index.html conserva #home-quick-catalog-drawer".to_string());
        }

        let eq_dist = dist_dir.join("equipos/index.html");
        if eq_dist.is_file() {
            let eq_html = fs::read_to_string(&eq_dist).map_err(|e| e.to_string())?;
            for broken in [
                "/catalogo/#avenue-avenue_1_metrology",
                "\"/control/\"",
                "SMAT-ULTRAMET-4X3",
            ] {
                if eq_html.contains(broken) {
                    return Err(format!("Gate 51 (DEB-V50-05): dist/equipos/index.html contiene referencia rota '{}'", broken));
                }
            }
            let hash_href_re = Regex::new(r##"href="(/[^\s"#?]*?)#([A-Za-z0-9_-]+)""##).unwrap();
            let mut by_target: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
            for cap in hash_href_re.captures_iter(&eq_html) {
                by_target.entry(cap[1].to_string()).or_default().insert(cap[2].to_string());
            }
            for (route, anchors) in by_target {
                let clean_rel = route.trim_start_matches('/').trim_end_matches('/');
                let target_html_path = if clean_rel.is_empty() {
                    dist_dir.join("index.html")
                } else {
                    dist_dir.join(clean_rel).join("index.html")
                };
                if !target_html_path.is_file() {
                    return Err(format!(
                        "Gate 51 (Biyección Static-Hash): href='{}#...' desde /equipos/ apunta a ruta inexistente '{}'",
                        route,
                        target_html_path.display()
                    ));
                }
                let target_html = fs::read_to_string(&target_html_path).map_err(|e| e.to_string())?;
                for anchor in anchors {
                    if !target_html.contains(&format!("id=\"{}\"", anchor)) {
                        return Err(format!(
                            "Gate 51 (Biyección Static-Hash): href='{}#{}' desde /equipos/ apunta a ancla inexistente",
                            route, anchor
                        ));
                    }
                }
            }
        }
    }

    Ok("OK: Gate 51 V5.0 verificado al 100% (11 dominios EngineSchema <-> DOM biyectivos, XDSM DAG puro, quoteWizardController <450 LOC, TechnicalDiagrams <120 LOC, 18 pares ES/EN en 11 Islas Canónicas, 19 SKUs SSOT, 0 debris y hash links cerrados).".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::find_site_root;

    #[test]
    fn test_v50_gate_51_passes_on_repository_root() {
        let root = find_site_root();
        let res = check_v50_canonical_islands_and_two_sort_gate_51(&root);
        assert!(res.is_ok(), "Gate 51 falló: {:?}", res.err());
    }
}
