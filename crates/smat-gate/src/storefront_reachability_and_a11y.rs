use regex::Regex;
use serde::Deserialize;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Deserialize)]
struct CatalogSlugEntry {
    id: String,
    slug_es: String,
    slug_en: String,
}

fn collect_html_files(dir: &Path) -> Vec<std::path::PathBuf> {
    if !dir.is_dir() {
        return Vec::new();
    }
    WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_type().is_file()
                && e.path().extension().and_then(|s| s.to_str()) == Some("html")
        })
        .map(|e| e.path().to_path_buf())
        .collect()
}

/// Gate V10.1-1: Cero títulos HTML con marca duplicada (`SMAT Minerals | ... | SMAT Minerals`).
pub fn verify_no_duplicate_brand_titles(site_root: &Path) -> Result<(), String> {
    let layout_path = site_root.join("src/layouts/BaseLayout.astro");
    if layout_path.exists() {
        let layout_src = fs::read_to_string(&layout_path).map_err(|e| e.to_string())?;
        if !layout_src.contains("SMAT Minerals/i.test(title)") {
            return Err(
                "BaseLayout.astro debe deduplicar 'SMAT Minerals' antes de concatenar '| SMAT Minerals'"
                    .to_string(),
            );
        }
    }

    let dist_dir = site_root.join("dist");
    if !dist_dir.is_dir() {
        return Ok(());
    }

    let title_re = Regex::new(r"(?is)<title>(.*?)</title>").map_err(|e| e.to_string())?;
    for html_path in collect_html_files(&dist_dir) {
        let html = fs::read_to_string(&html_path).unwrap_or_default();
        if let Some(caps) = title_re.captures(&html) {
            let title_inner = caps[1].to_lowercase();
            let count = title_inner.matches("smat minerals").count();
            if count > 1 {
                return Err(format!(
                    "Título duplicado ('SMAT Minerals' aparece {} veces) en {}",
                    count,
                    html_path.display()
                ));
            }
        }
    }

    Ok(())
}

/// Gate V10.1-2: 23/23 SKUs canónicos alcanzables directamente desde Home o las 5 Verticales ES & EN.
pub fn verify_all_23_skus_reachable_from_hubs(site_root: &Path) -> Result<(), String> {
    let catalog_path = site_root.join("data/quick_checkout_Catalog.json");
    let raw = fs::read_to_string(&catalog_path).map_err(|e| e.to_string())?;
    let catalog: Vec<CatalogSlugEntry> = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    if catalog.len() != 23 {
        return Err(format!(
            "quick_checkout_Catalog.json debe contener 23 SKUs (hay {})",
            catalog.len()
        ));
    }

    let dist_dir = site_root.join("dist");
    if !dist_dir.is_dir() {
        return Ok(());
    }

    let es_hubs = [
        "index.html",
        "bombeo/index.html",
        "clasificacion/index.html",
        "flotacion/index.html",
        "filtracion/index.html",
        "control-de-procesos/index.html",
    ];
    let mut es_corpus = String::new();
    for rel in es_hubs {
        let p = dist_dir.join(rel);
        if p.exists() {
            es_corpus.push_str(&fs::read_to_string(&p).unwrap_or_default());
        }
    }

    let en_hubs = [
        "en/index.html",
        "en/pumping/index.html",
        "en/classification/index.html",
        "en/flotation/index.html",
        "en/filtration/index.html",
        "en/process-control/index.html",
    ];
    let mut en_corpus = String::new();
    for rel in en_hubs {
        let p = dist_dir.join(rel);
        if p.exists() {
            en_corpus.push_str(&fs::read_to_string(&p).unwrap_or_default());
        }
    }

    for entry in &catalog {
        let es_needle = format!("/productos/{}/", entry.slug_es);
        if !es_corpus.is_empty() && !es_corpus.contains(&es_needle) {
            return Err(format!(
                "SKU {} ({}) no alcanzable desde Home/5 Verticales ES",
                entry.id, es_needle
            ));
        }
        let en_needle = format!("/en/products/{}/", entry.slug_en);
        if !en_corpus.is_empty() && !en_corpus.contains(&en_needle) {
            return Err(format!(
                "SKU {} ({}) no alcanzable desde Home/5 Verticales EN",
                entry.id, en_needle
            ));
        }
    }

    Ok(())
}

/// Gate V10.1-3: Footer con conteo dinámico (sin 19 Productos/SKUs obsoleto) y alto contraste WCAG.
pub fn verify_footer_contrast_and_dynamic_count(site_root: &Path) -> Result<(), String> {
    let footer_path = site_root.join("src/components/Footer.astro");
    let footer_src = fs::read_to_string(&footer_path).map_err(|e| e.to_string())?;
    if !footer_src.contains("getQuickProductsCatalog") {
        return Err("Footer.astro debe calcular conteo de catálogo vía getQuickProductsCatalog".to_string());
    }
    if footer_src.contains("19 Productos") || footer_src.contains("19 SKUs") {
        return Err("Footer.astro conserva referencia obsoleta '19 Productos' / '19 SKUs'".to_string());
    }
    if !footer_src.contains("#e2e8f0") || !footer_src.contains("#cbd5e1") {
        return Err("Footer.astro debe definir alto contraste claro (#e2e8f0 / #cbd5e1) sobre fondo oscuro".to_string());
    }

    let dist_index = site_root.join("dist/index.html");
    if dist_index.exists() {
        let html = fs::read_to_string(&dist_index).unwrap_or_default();
        if html.contains("19 Productos") || html.contains("19 SKUs") {
            return Err("dist/index.html conserva conteo obsoleto '19 Productos' o '19 SKUs'".to_string());
        }
    }

    Ok(())
}

/// Gate V10.1-4: /en/quote/ libre de fugas en español (starter cards y cronograma JRP).
pub fn verify_en_quote_zero_es_leak(site_root: &Path) -> Result<(), String> {
    let en_quote_html = site_root.join("dist/en/quote/index.html");
    if !en_quote_html.exists() {
        return Ok(());
    }

    let html = fs::read_to_string(&en_quote_html).map_err(|e| e.to_string())?;
    let forbidden_es_in_quote = [
        "Inspección camisa",
        "Cambio húmedo",
        "Voluta / forro",
        "+ Impulsor AH",
        "+ Lote Húmedo",
        "+ Hidrociclón",
        "+ Balanza Marcy",
        "Partidas en tu Carrito",
        "Vaciar Bandeja",
    ];
    for token in forbidden_es_in_quote {
        if html.contains(token) {
            return Err(format!(
                "Fuga ES ('{}') detectada en {}",
                token,
                en_quote_html.display()
            ));
        }
    }

    Ok(())
}

pub fn verify_storefront_reachability_and_a11y(site_root: &Path) -> Result<(), String> {
    verify_no_duplicate_brand_titles(site_root)?;
    verify_all_23_skus_reachable_from_hubs(site_root)?;
    verify_footer_contrast_and_dynamic_count(site_root)?;
    verify_en_quote_zero_es_leak(site_root)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn make_temp_root(tag: &str) -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("smat_gate_{}_{}", tag, nanos));
        let _ = fs::create_dir_all(&dir);
        dir
    }

    #[test]
    fn test_duplicate_title_detector_catches_double_brand() {
        let root = make_temp_root("dup_title");
        let _ = fs::create_dir_all(root.join("src/layouts"));
        let _ = fs::create_dir_all(root.join("dist"));
        let _ = fs::write(
            root.join("src/layouts/BaseLayout.astro"),
            "const fullTitle = /SMAT Minerals/i.test(title) ? title : `${title} | SMAT Minerals`;",
        );
        let _ = fs::write(
            root.join("dist/index.html"),
            "<html><head><title>SMAT Minerals | Bombas | SMAT Minerals</title></head></html>",
        );

        let err = verify_no_duplicate_brand_titles(&root).unwrap_err();
        assert!(err.contains("duplicado"), "Error esperado, obtuvo: {}", err);

        let _ = fs::write(
            root.join("dist/index.html"),
            "<html><head><title>SMAT Minerals | Bombas</title></head></html>",
        );
        assert!(verify_no_duplicate_brand_titles(&root).is_ok());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn test_en_quote_es_leak_detector_blocks_spanish_strings() {
        let root = make_temp_root("en_quote_leak");
        let _ = fs::create_dir_all(root.join("dist/en/quote"));
        let _ = fs::write(
            root.join("dist/en/quote/index.html"),
            "<div>Inspección camisa 90 d</div>",
        );

        let err = verify_en_quote_zero_es_leak(&root).unwrap_err();
        assert!(err.contains("Inspección camisa"));

        let _ = fs::write(
            root.join("dist/en/quote/index.html"),
            "<div>Sleeve inspection 90 d</div>",
        );
        assert!(verify_en_quote_zero_es_leak(&root).is_ok());
        let _ = fs::remove_dir_all(&root);
    }
}
