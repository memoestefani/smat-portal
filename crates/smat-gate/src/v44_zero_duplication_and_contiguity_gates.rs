use std::fs;
use std::path::Path;

/// Gate 47 (V4.4 — D1-V44 a D9-V44, ARB-SMAT-52, GOLD-718):
/// Verifica determinísticamente los 5 invariantes científicos de la ronda V4.4:
/// 1. Pureza Escalar ISO 80000-1 en `verticalCalculatorsAndLabelsBridge.js` (0 inyección de paréntesis en spans escalares).
/// 2. Eliminación de redundancia lado-a-lado (`mode="media-only"`) y transductor reactivo `.smat-slug-mat-chip` en `/productos/[slug]/` y `/en/products/[slug]/`.
/// 3. Tercera Forma Normal Visual (`3NF`: `Cards ⊥ Table`) en `/catalogo/[code]/` y `/en/catalog/[code]/`.
/// 4. Contigüidad espacial Hidrociclón 3 Vasos ↔ Criba Weibull en `/clasificacion/` y purga del `<script>` aislado en `CycloneAndScreenReport.astro`.
/// 5. Extracción modular `LCOM4=1` (`wizardCircuitXorStatechart.js`) y proyección Harel XOR completa en `/cotizar/`.
pub fn check_v44_scalar_purity_zero_duplication_and_xor_contiguity_gate_47(
    site_root: &Path,
) -> Result<String, String> {
    // 1. Sub-candado 47A: Pureza Escalar ISO 80000-1 en verticalCalculatorsAndLabelsBridge.js (D1-V44)
    let bridge_src = fs::read_to_string(site_root.join("src/scripts/verticalCalculatorsAndLabelsBridge.js"))
        .map_err(|e| e.to_string())?;
    for banned_scalar_stuffing in [
        "`${res.maxBendingStressMpa} MPa (ΔP_asim=",
        "`FS ${res.flexuralSafetyFactor} (${res.cyclesPerDay}",
        "sbOut.textContent = `${sbVal} (N_js=",
        "vtipOut.textContent = `${vtipVal} (",
    ] {
        if bridge_src.contains(banned_scalar_stuffing) {
            return Err(format!(
                "Gate 47A (D1-V44 DEB-V44-01/02): verticalCalculatorsAndLabelsBridge.js aún inyecta paréntesis en nodo escalar: '{}'",
                banned_scalar_stuffing
            ));
        }
    }
    if !bridge_src.contains("recomputeScreenWeibull") || !bridge_src.contains("onManualScreenChange") {
        return Err(
            "Gate 47A (D4-V44): bindCoupledClassificationStation debe sincronizar bidireccionalmente #cyc-* y #csr-* (recomputeScreenWeibull / onManualScreenChange)".to_string(),
        );
    }

    // 2. Sub-candado 47B: Modo media-only y selector reactivo en /productos/[slug]/ (D2-V44)
    let qcard_src = fs::read_to_string(site_root.join("src/components/ProductQuickCard.astro"))
        .map_err(|e| e.to_string())?;
    if !qcard_src.contains("mode?: 'card' | 'media-only'") || !qcard_src.contains("const isMediaOnly = mode === 'media-only'") {
        return Err(
            "Gate 47B (D2-V44 DEB-V44-03): ProductQuickCard.astro debe soportar mode='media-only' para suprimir el footer transaccional duplicado".to_string(),
        );
    }
    for slug_rel in ["src/pages/productos/[slug].astro", "src/pages/en/products/[slug].astro"] {
        let slug_src = fs::read_to_string(site_root.join(slug_rel)).map_err(|e| e.to_string())?;
        if !slug_src.contains("mode=\"media-only\"") {
            return Err(format!(
                "Gate 47B (D2-V44): {} debe invocar <ProductQuickCard ... mode=\"media-only\" />",
                slug_rel
            ));
        }
        if !slug_src.contains("activateSlugMatChip") {
            return Err(format!(
                "Gate 47B (D2-V44): {} debe enlazar el transductor reactivo activateSlugMatChip sobre .smat-slug-mat-chip",
                slug_rel
            ));
        }
    }

    // 3. Sub-candado 47C: Tercera Forma Normal Visual (Cards ⊥ Table) en /catalogo/[code]/ (D3-V44)
    for code_rel in ["src/pages/catalogo/[code].astro", "src/pages/en/catalog/[code].astro"] {
        let code_src = fs::read_to_string(site_root.join(code_rel)).map_err(|e| e.to_string())?;
        for duplicated_th in [
            "<th>Masa Unitaria e Izaje NIOSH:</th>",
            "<th>Espesor de Pared Crítico:</th>",
            "<th>Diámetro Exterior (∅D₂):</th>",
            "<th>Paso Máximo de Esfera (Sólidos):</th>",
            "<th>Estación y Precedencia BOM:</th>",
            "<th>Unit Mass & NIOSH Handling:</th>",
            "<th>Critical Wall Thickness:</th>",
            "<th>Outer Diameter (∅D₂):</th>",
            "<th>Max Sphere Passage (Solids):</th>",
            "<th>BOM Station & Precedence:</th>",
        ] {
            if code_src.contains(duplicated_th) {
                return Err(format!(
                    "Gate 47C (D3-V44 DEB-V44-05): {} aún repite en <table class=\"spec-table\"> la fila '{}' que ya vive en .atomic-engineering-cards",
                    code_rel, duplicated_th
                ));
            }
        }
    }

    // 4. Sub-candado 47D: Contigüidad espacial en /clasificacion/ y 0 <script> aislado en CycloneAndScreenReport.astro (D4-V44)
    let csr_src = fs::read_to_string(site_root.join("src/components/CycloneAndScreenReport.astro"))
        .map_err(|e| e.to_string())?;
    if csr_src.contains("<script>") || csr_src.contains("initCycloneScreenWeibullVerifier") {
        return Err(
            "Gate 47D (D4-V44 DEB-V44-06): CycloneAndScreenReport.astro aún contiene el <script> aislado que sobrescribe con 420 um".to_string(),
        );
    }
    for clas_rel in [
        "src/pages/clasificacion/index.astro",
        "src/pages/en/classification/index.astro",
    ] {
        let clas_src = crate::read_page_with_islands_composite(site_root, clas_rel)?;
        for req_id in [
            "id=\"cyc-coupled-screen-station\"",
            "id=\"csr-aperture-mm\"",
            "id=\"csr-relief-deg\"",
            "id=\"csr-feed-um\"",
            "id=\"wb-scr-res-weibull\"",
            "id=\"csr-rfq-link\"",
        ] {
            if !clas_src.contains(req_id) {
                return Err(format!(
                    "Gate 47D (D4-V44): {} debe co-localizar {} en la estación acoplada superior",
                    clas_rel, req_id
                ));
            }
        }
    }

    // 5. Sub-candado 47E: Módulo LCOM4=1 wizardCircuitXorStatechart.js y proyección XOR en /cotizar/ (D5..D7-V44 & D9-V44)
    let xor_path = site_root.join("src/scripts/wizardCircuitXorStatechart.js");
    if !xor_path.exists() {
        return Err(
            "Gate 47E (D9-V44): No existe src/scripts/wizardCircuitXorStatechart.js (costura LCOM4=1)".to_string(),
        );
    }
    let xor_src = fs::read_to_string(&xor_path).map_err(|e| e.to_string())?;
    for req_sym in [
        "export const CIRCUIT_XOR_VIEW_SPEC",
        "export function getCircuitXorViewProjection",
        "export function applyCircuitStatechartXOR",
        "export function renderWetEndMaterialMatrixCard",
        "wb-symptom-context-details",
        "wb-drive-and-tradein-contextual-card",
        "wb-engineering-config-summary-text",
        "wb-step2-durand-controls-wrap",
    ] {
        if !xor_src.contains(req_sym) {
            return Err(format!(
                "Gate 47E (D5..D7-V44): wizardCircuitXorStatechart.js debe contener '{}'",
                req_sym
            ));
        }
    }

    let qw_astro = format!(
        "{}\n{}",
        fs::read_to_string(site_root.join("src/components/QuoteWizard.astro"))
            .map_err(|e| e.to_string())?,
        fs::read_to_string(site_root.join("src/components/cores/PumpingHydraulicsCore.astro"))
            .map_err(|e| e.to_string())?
    );
    for req_anchor in [
        "id=\"wb-engineering-config-summary-text\"",
        "id=\"wb-step2-durand-controls-wrap\"",
        "id=\"wb-step2-hint-title\"",
        "id=\"wb-step2-hint-body\"",
    ] {
        if !qw_astro.contains(req_anchor) {
            return Err(format!(
                "Gate 47E (D6..D7-V44): QuoteWizard.astro debe declarar el ancla '{}'",
                req_anchor
            ));
        }
    }

    Ok("OK: Pureza escalar ISO 80000-1, modo media-only en [slug].astro, 3NF en [code].astro, contigüidad en /clasificacion/ y statechart XOR wizardCircuitXorStatechart.js verificados.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::find_site_root;

    #[test]
    fn test_v44_scalar_purity_zero_duplication_and_xor_contiguity_gate_47() {
        let root = find_site_root();
        let res = check_v44_scalar_purity_zero_duplication_and_xor_contiguity_gate_47(&root);
        assert!(res.is_ok(), "Gate 47 falló: {:?}", res.err());
    }
}
