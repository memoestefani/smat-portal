use std::path::{Path, PathBuf};

pub mod physics_and_schema;
pub mod security_and_leaks;
pub mod seo_and_i18n;
pub mod ux_and_css_layers;

pub struct GateReport {
    pub name: String,
    pub passed: bool,
    pub details: String,
}

fn make_gate_report<T>(name: &str, res: Result<T, String>, ok_msg: &str) -> GateReport {
    match res {
        Ok(_) => GateReport {
            name: name.to_string(),
            passed: true,
            details: ok_msg.to_string(),
        },
        Err(err) => GateReport {
            name: name.to_string(),
            passed: false,
            details: err,
        },
    }
}

pub fn find_site_root() -> PathBuf {
    let mut current = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    for _ in 0..5 {
        if current.join("data").join("company.json").exists() {
            return current;
        }
        if let Some(parent) = current.parent() {
            current = parent.to_path_buf();
        } else {
            break;
        }
    }
    PathBuf::from(".")
}

/// Ejecuta las 11 compuertas conductuales consolidadas de SMAT Minerals (`V5.5`).
pub fn run_all_checks(site_root: &Path) -> Vec<GateReport> {
    vec![
        make_gate_report(
            "1. Paridad SSOT y Cero Debris en data/",
            security_and_leaks::verify_catalog_and_ssot_parity(site_root),
            "OK: SSOT JSON valido y cero roles.copy.json.",
        ),
        make_gate_report(
            "2. Escaner Anti-Fugas (Precios/Secretos) y Cero Placeholders",
            security_and_leaks::verify_leak_scanner_and_zero_placeholders(site_root),
            "OK: Cero precios, secretos o placeholders.",
        ),
        make_gate_report(
            "3. Cabeceras Seguridad, NAP Durango y SLAs Honestos",
            security_and_leaks::verify_security_headers_nap_and_honest_sla(site_root),
            "OK: Headers DENY/nosniff, NAP Durango y 0 promesas falsas.",
        ),
        make_gate_report(
            "4. Simetria Bilingue ES/EN y Cero Fugas ES en /en/",
            seo_and_i18n::verify_bilingual_symmetry_and_zero_es_leaks(site_root)
                .and_then(|_| security_and_leaks::verify_v100_es_purity_and_empty_acuse(site_root)),
            "OK: Rutas ES/EN simetricas, 0 fugas ES/EN y EMPTY_CART_GATE verificado.",
        ),
        make_gate_report(
            "5. Redirecciones 301 en 1 Salto y Cero Enlaces /#rfq",
            seo_and_i18n::verify_redirects_one_hop_and_static_links(site_root),
            "OK: 301s deterministas 1-hop y cero enlaces rotos.",
        ),
        make_gate_report(
            "6. Integridad 23 SKUs (19+4 Proyecto), 13 Piezas Atomicas, 52 Minas y 23+ WebP",
            seo_and_i18n::verify_catalog_mining_groups_and_webp(site_root),
            "OK: Catalogo canonico 23 SKUs, grupos mineros y assets WebP verificados.",
        ),
        make_gate_report(
            "7. Limites Fisicos y Termicos (R55 <= 70 C, SiC <= 28.0 m/s)",
            physics_and_schema::verify_physics_and_thermal_bounds(site_root),
            "OK: Motores Durand, Gy, ASTM, Expeller, V-Belt y cotas R55/SiC verificados.",
        ),
        make_gate_report(
            "8. Contrato Schema, PWA Precache, Outbox Honesto y 0 Exports Muertos",
            physics_and_schema::verify_schema_outbox_pwa_and_zero_dead_exports(site_root),
            "OK: Two-Sort limpio, SW precache, outbox desacoplado y 0 exports muertos.",
        ),
        make_gate_report(
            "9. Landmark <main> Unico y Cero Tokens Crudos en dist/",
            ux_and_css_layers::verify_single_main_and_zero_raw_tokens(site_root),
            "OK: 1 <main> por HTML y 0 tokens internos visibles.",
        ),
        make_gate_report(
            "10. Higiene Cores, @media print y Offline Discreto en Footer",
            ux_and_css_layers::verify_print_pwa_and_core_hygiene(site_root),
            "OK: 0 estilos inline en cores/, @media print y offline discreto.",
        ),
        make_gate_report(
            "11. Checkout B2B Task-First (< 65 KB, 0 <details> Anidados, 0 IDs Duplicados)",
            ux_and_css_layers::verify_task_first_checkout_hygiene(site_root),
            "OK: Checkout /cotizar/ ligero, plano y con IDs unicos.",
        ),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_behavioral_gates_pass() {
        let root = find_site_root();
        let reports = run_all_checks(&root);
        let failures: Vec<String> = reports
            .into_iter()
            .filter(|r| !r.passed)
            .map(|r| format!("{} -> {}", r.name, r.details))
            .collect();
        assert!(
            failures.is_empty(),
            "Fallaron compuertas conductuales:\n{}",
            failures.join("\n")
        );
    }

    #[test]
    fn test_individual_domains_and_bounds() {
        let root = find_site_root();
        assert!(security_and_leaks::verify_catalog_and_ssot_parity(&root).is_ok());
        assert!(security_and_leaks::verify_leak_scanner_and_zero_placeholders(&root).is_ok());
        assert!(security_and_leaks::verify_security_headers_nap_and_honest_sla(&root).is_ok());
        assert!(seo_and_i18n::verify_bilingual_symmetry_and_zero_es_leaks(&root).is_ok());
        assert!(security_and_leaks::verify_v100_es_purity_and_empty_acuse(&root).is_ok());
        assert!(seo_and_i18n::verify_redirects_one_hop_and_static_links(&root).is_ok());
        assert!(seo_and_i18n::verify_catalog_mining_groups_and_webp(&root).is_ok());
        assert!(physics_and_schema::verify_physics_and_thermal_bounds(&root).is_ok());
        assert!(physics_and_schema::verify_schema_outbox_pwa_and_zero_dead_exports(&root).is_ok());
        assert!(ux_and_css_layers::verify_single_main_and_zero_raw_tokens(&root).is_ok());
        assert!(ux_and_css_layers::verify_print_pwa_and_core_hygiene(&root).is_ok());
        assert!(ux_and_css_layers::verify_task_first_checkout_hygiene(&root).is_ok());
    }
}
