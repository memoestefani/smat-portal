use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};

pub mod core_integrity_gates;
pub use core_integrity_gates::*;
pub mod v3_forensic_gates;
pub use v3_forensic_gates::*;
pub mod v34_canonical_gates;
pub use v34_canonical_gates::*;
pub mod v42_html_surface_and_contract_gates;
pub use v42_html_surface_and_contract_gates::*;
pub mod v43_contract_and_sensitivity_gates;
pub use v43_contract_and_sensitivity_gates::*;
pub mod v44_zero_duplication_and_contiguity_gates;
pub use v44_zero_duplication_and_contiguity_gates::*;
pub mod v45_ergos_and_backend_parity_gates;
pub use v45_ergos_and_backend_parity_gates::*;
pub mod v48_instrument_first_and_lens_gates;
pub use v48_instrument_first_and_lens_gates::*;
pub mod solar_contrast_and_token_gate;
pub use solar_contrast_and_token_gate::*;
pub mod v50_canonical_islands_and_two_sort_gate;
pub use v50_canonical_islands_and_two_sort_gate::*;
pub mod v51_runtime_schema_and_zero_placebo_gate;
pub use v51_runtime_schema_and_zero_placebo_gate::*;
pub mod v53_landmarks_and_zero_orphan_gate;
pub use v53_landmarks_and_zero_orphan_gate::*;

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

pub fn read_page_with_islands_composite(site_root: &Path, page_rel: &str) -> Result<String, String> {
    let mut content = fs::read_to_string(site_root.join(page_rel))
        .map_err(|e| format!("Error leyendo {}: {}", page_rel, e))?;
    let tag_re = Regex::new(r"<([A-Z][A-Za-z0-9]*(?:Island|Core)|WizardCircuitCalculators)\b[^>]*/>")
        .map_err(|e| e.to_string())?;
    for _depth in 0..4 {
        let mut changed = false;
        let current = content.clone();
        let mut next = String::with_capacity(current.len() + 4096);
        let mut last = 0usize;
        for cap in tag_re.captures_iter(&current) {
            if let (Some(m), Some(name)) = (cap.get(0), cap.get(1)) {
                let comp_name = name.as_str();
                let rel_island = if comp_name == "WizardCircuitCalculators" {
                    "src/components/WizardCircuitCalculators.astro".to_string()
                } else if comp_name.ends_with("Core") {
                    format!("src/components/cores/{}.astro", comp_name)
                } else {
                    format!("src/components/islands/{}.astro", comp_name)
                };
                let full_island = site_root.join(&rel_island);
                if full_island.is_file() {
                    if let Ok(island_src) = fs::read_to_string(&full_island) {
                        next.push_str(&current[last..m.start()]);
                        next.push_str(&format!("<!-- composite:{} -->\n{}\n", rel_island, island_src));
                        last = m.end();
                        changed = true;
                    }
                }
            }
        }
        if !changed {
            break;
        }
        next.push_str(&current[last..]);
        content = next;
    }
    Ok(content)
}

pub fn read_technical_diagrams_composite(site_root: &Path) -> Result<String, String> {
    let mut combined = fs::read_to_string(site_root.join("src/components/TechnicalDiagrams.astro"))
        .map_err(|e| e.to_string())?;
    let diagrams_dir = site_root.join("src/components/diagrams");
    if diagrams_dir.is_dir() {
        let mut entries: Vec<_> = fs::read_dir(&diagrams_dir)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| p.extension().and_then(|s| s.to_str()) == Some("astro"))
            .collect();
        entries.sort();
        for p in entries {
            if let Ok(src) = fs::read_to_string(&p) {
                combined.push('\n');
                combined.push_str(&src);
            }
        }
    }
    Ok(combined)
}

pub fn read_quote_wizard_composite(site_root: &Path) -> Result<String, String> {
    let qw = read_page_with_islands_composite(site_root, "src/components/QuoteWizard.astro")?;
    let mut parts = vec![qw];
    for rel in [
        "src/components/WizardCircuitCalculators.astro",
        "src/components/LiveEngineeringDossier.astro",
        "src/scripts/engineSchemaRegistry.js",
        "src/scripts/schemaRuntimeBinder.js",
        "src/scripts/wizardXdsmDagSolver.js",
        "src/scripts/quoteWizardController.js",
        "src/scripts/wizardCircuitXorStatechart.js",
        "src/scripts/wizardCircuitPhysicsController.js",
        "src/scripts/quoteDossierRenderer.js",
        "src/scripts/wizardDossierProjector.js",
        "src/scripts/wizardStateAndUrlLens.js",
        "src/scripts/wizardEventBindings.js",
        "src/scripts/wizardLivePhysicsProjector.js",
        "src/scripts/sapAndLeadExportEngine.js",
        "src/scripts/wizardMiningAndCodeDecoder.js",
        "src/styles/workbench.css",
        "src/styles/workbench-core.css",
        "src/styles/workbench-circuits-sticky.css",
        "src/styles/workbench-dossier.css",
        "src/styles/workbench-export-solar.css",
    ] {
        if let Ok(src) = fs::read_to_string(site_root.join(rel)) {
            parts.push(src);
        }
    }
    Ok(parts.join("\n"))
}

/// Ejecuta las compuertas del invariante maestro (delegando los bloques de integridad base a core_integrity_gates)
pub fn run_all_checks(site_root: &Path) -> Vec<GateReport> {
    vec![
        make_gate_report("1. Paridad de Catalogo (roles.json == roles.copy.json)", verify_catalog_parity(site_root), "OK: Paridad byte a byte confirmada."),
        make_gate_report("2. Escaner Anti-Fugas (Precios, Margenes y Secretos)", verify_leak_scanner(site_root), "OK: Cero fugas comerciales detectadas."),
        make_gate_report("3. Simetria Bilingue ES/EN (Gate D9)", verify_bilingual_symmetry(site_root), "OK: Taxonomia y rutas 100% simetricas."),
        make_gate_report("4. Integridad de Redirecciones 301 Deterministas", verify_redirect_integrity(site_root), "OK: 40 URLs historicas mapeadas a 301 validos."),
        make_gate_report("5. Integridad de NAP (Durango, Salas #114)", verify_nap_integrity(site_root), "OK: Identidad fiscal y logistica consistente."),
        make_gate_report("6. Cero Placeholders y Cero Mockups", verify_zero_placeholders(site_root), "OK: 100% datos de ingenieria comprobados."),
        make_gate_report("7. Integridad de Decisiones B2B (Gate D10)", verify_decision_criteria(site_root), "OK: 9 roles con variables de pulpa y limites."),
        make_gate_report("8. Soporte de Vista Imprimible ERP (Gate D11)", verify_print_view_parity(site_root), "OK: @media print verificado en acuse y thank-you."),
        make_gate_report("9. Erradicacion de Debris y Scripts (Gate D12)", verify_no_orphan_debris(site_root), "OK: Cero temporales y herramientas integradas."),
        make_gate_report("10. Diccionario Estatico de Grupos Mineros (Gate D13)", verify_mining_groups_dataset(site_root), "OK: 25 grupos mineros auditados con cero campos vacios."),
        make_gate_report("11. Motor Hidráulico y Metalúrgico de Pulpa (Gate D14)", verify_slurry_engine_module(site_root), "OK: Durand-Condolios y matriz metalurgica verificados."),
        make_gate_report("12. Tokens Modulares y Live Workbench Split (Gate D15)", verify_design_tokens_and_workbench(site_root), "OK: Tokens ejecutivos y ficha en tiempo real integrados."),
        make_gate_report("13. EventBus y Suite de Exportación de 4 Vías (Gate D16)", verify_event_bus_and_export_suite(site_root), "OK: EventBus reactivo y 4 vias de exportacion verificadas."),
        make_gate_report("14. Unified Flight Deck y Trust Matrix (Gate D17)", verify_flight_deck_and_trust_matrix(site_root), "OK: Flight Deck de 3 modos y Trust Matrix verificados."),
        make_gate_report("15. Erradicación Estricta de Promesas Falsas (Gate D18)", verify_no_false_sla_promises(site_root), "OK: Cero menciones de 45 min en codigo fuente."),
        make_gate_report("16. Accesibilidad Total de 40 Rutas (Gate D19)", verify_40_routes_reachability(site_root), "OK: 40 rutas 100% alcanzables en navegacion."),
        make_gate_report("17. Calibración y Ethos Lingüístico (Gate D20)", verify_linguistic_ethos(site_root), "OK: Cero menciones de lenguaje informal ('taller' / 'workshop')."),
        make_gate_report("18. Higiene de Propiedad Intelectual y Cero Marcas de Terceros (Gate D21)", verify_trademark_hygiene(site_root), "OK: Cero menciones de marcas registradas de terceros."),
        make_gate_report("19. Cabeceras de Seguridad Cloudflare Pages (Gate D22)", verify_security_headers(site_root), "OK: Directivas DENY y nosniff verificadas."),
        make_gate_report("20. Cero Claims Engañosos de Emergencia (Gate D23)", verify_no_emergency_claims(site_root), "OK: Horario de planta verificado sin promesas falsas 24/7."),
        make_gate_report("21. Reporte de Armado de Bomba y Cero Enlaces Huerfanos /#rfq (Gate D24)", verify_pump_assembly_and_zero_orphan_rfq_links(site_root), "OK: Reporte de despiece 5 estaciones y cero enlaces /#rfq verificados."),
        make_gate_report("22. Paridad Backend-UI 100%, Cinematica V-Belt, Claro Axial y Decompresion Cowan (Gate D25)", verify_backend_ui_parity_and_apple_cowan(site_root), "OK: 7 motores de backend expuestos en UI, contraste AAA y Cowan 4+-1 verificados."),
        make_gate_report("21b. Verificacion de Enlaces Huerfanos /#rfq (Gate D24b)", verify_pump_assembly_and_zero_orphan_rfq_links(site_root), "OK: Reporte de despiece 5 estaciones y cero enlaces /#rfq verificados."),
        make_gate_report("23. Particion Modular Parnas y Cero data-step=2 Falsos (Gate D26)", verify_modular_parnas_and_zero_fake_data_step_gate(site_root), "OK: QuoteWizard <950 lineas, 4 modulos Parnas, 0 data-step=2 y 0 tokens --color-*."),
        make_gate_report("24. Higiene Lexica Don Manuel y Separacion /contacto/ vs /cotizar/ (Gate D27)", verify_manuel_lexical_and_route_separation_gate(site_root), "OK: Cero 'Refaccion Urgente' y cero QuoteWizard duplicado en /contacto/."),
        make_gate_report("25. Polaridad Solar WCAG AAA y Paridad Etapa 3 1-C++ a 10-C++ (Gate D28)", verify_solar_wcag_aaa_and_etapa3_parity(site_root), "OK: Tokens WCAG AAA, 11 parametros metrologicos, Tri-Compound y cinematica n2/Fr verificados."),
        make_gate_report("26. Paridad 100% Backend-UI y Pinza Termo-Barometrica TEFC (Gate D29)", verify_backend_ui_full_parity_and_altitude_pincer(site_root), "OK: 12 fichas atomicas con 6 campos fisicos, SiC, Presets de Distrito y Derating TEFC verificados."),
        make_gate_report("27. Erradicacion de Redundancias Secciones 3.1 y 3.2 y Fold Movil Apple HIG (Gate D30)", verify_section_3_1_3_2_zero_duplication_and_mobile_fold(site_root), "OK: DualHubView eliminado, #bombeo-catalog-tabs unificado, Input-First en QuoteWizard y 0 LaTeX crudo."),
        make_gate_report("28. Bijeccion 19 SKUs Quick-Checkout, 13 Partes Atomicas y Diagramas CAD Rayos-X (Gate MVP v3 D1/D2/D6)", verify_quick_checkout_and_cad_bijection(site_root), "OK: 19 SKUs Quick-Checkout, 13 partes atomicas (incl. D075C21) y capa X-Ray CAD verificados."),
        make_gate_report("29. Verificabilidad Fisica de SLAs, Bandeja c*mu, Balance 3 Vasos Marcy y Costuras LCOM4 (Gate MVP v3 D3/D5/D7/D8/D9)", verify_sla_verifiability_and_lcom4_seam(site_root), "OK: Bandeja c*mu, Pasaporte Proveedor, Clasificacion 3 Vasos Marcy, NOM-141 y costura LCOM4 verificados."),
        make_gate_report("30. Cierre Forense PRD v3.0: 19 SKUs + Alias SSG, ProductQuickCard 3-en-1, Drop-In Guard, QuickOrderTray, CycloneAndScreenReport, Plano 3, 38+ Redirects y Costuras LCOM4 (Gate D1..D10)", verify_prd_v3_forensic_closure_gate_30(site_root), "OK: 19 SKUs + alias SSG, 19 WebP <=45KB, ProductQuickCard, QuickOrderTray, CycloneAndScreenReport, 0 Banco Durango, 38+ Redirects y LCOM4 verificados."),
        make_gate_report("31. Cierre Total de Conceptos Huerfanos y Arbitraje Epistemico v3.1: DeHoratius Warehouse Audit, Tribologia Hibrida A05+R55, 6 Fallas, 19 WebP dHash64 Unicos, Core Trade-In -22%, Gorain/Timoshenko, Pasaporte SAT y Costuras LCOM4 <=420 LOC (Gate D1=1-C++..D10=10-C++)", verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(site_root), "OK: 0 conceptos huerfanos v3.1, warehouse_audit ($1,646,850 MXN / 383 pzas), A05+R55, 6 modos de falla, 19 WebP unicos, Core Trade-In -22%, Gorain/Timoshenko, Pasaporte SAT y LCOM4 verificados."),
        make_gate_report("32. Cierre Definitivo de los 7 Hallazgos Criticos y Purga de Debris v3.2: CSS Nativo Scoped Solar AAA, 19 SKUs Canonicos SMAT-*, 19 Fotos Reales sin expo.png, 5 Diagramas CAD SVG, Botones Cableados 526183670664, Hash FNV-1a Drop-In, 115 Redirects Wayback 301 y 3 Puertas Canonicas (Gate D1=1-C+..D10=10-C+)", verify_seven_findings_and_v32_closure_gate_32(site_root), "OK: 7 Hallazgos Criticos cerrados al 100%, 0 clases Tailwind huerfanas, 19 SKUs SMAT-*, 0 expo.png, 5 nuevos CAD SVG, WhatsApp 526183670664, FNV-1a Drop-In, 115 Redirects 301 y 0 debris v3.2."),
        make_gate_report("34. Exhaustividad 16/16 de Diagramas CAD SVG en build_product_images.mjs y 0 WebP Huerfanos (Gate V3.4 D1/D2/D7)", check_v34_svg_exhaustiveness_and_zero_orphan_webp(site_root), "OK: 16/16 ramas diagram_id explicitas y exactamente 19 archivos .webp canonicos."),
        make_gate_report("35. Pureza Ontologica de SKUs de Laboratorio y Diagrama Criba 305x305 (Gate V3.4 D2/D3)", check_v34_lab_sku_domain_purity(site_root), "OK: 0 contaminacion de valvulas en SKUs de laboratorio y diagram_id urethane_screen_panel_305."),
        make_gate_report("36. Cierre 100% de Rutas SSG en /catalogo/[code] (9 Aleaciones + 7 Slugs) y 0 Enlaces Rotos en /clasificacion/ (Gate V3.4 D4)", check_v34_atomic_catalog_and_hub_link_closure(site_root), "OK: 9 codigos compuestos + 7 slugs descriptivos SSG y enlace de paquete casado corregido."),
        make_gate_report("37. Dual CTA + Hidratacion ?reorder=1 en QuickOrderTray, Indice c*mu en ProductQuickCard y Costuras LCOM4 <=900 LOC (Gate V3.4 D5/D6/D8)", check_v34_qtray_dual_cta_qcard_cmu_and_reorder_hydration(site_root), "OK: Dual CTA + ?reorder=1 en QuickOrderTray, c*mu en ProductQuickCard, 0 SKU-QC-01 y 4 modulos LCOM4 <=900 LOC."),
        make_gate_report("38. Cierre Forense 100% V3.5: Clausura 1-Hop _redirects, Puente Plano 1-2 (?sku=SMAT-*, ?mat=), Simuladores Plano 3 en <script>, Par Casado JRP 19 SKUs, Acuse Polimorfico SAT/JRP, D3147/F6147 1:1 y 0 cutwater (Gate V3.5 D1..D12)", check_v35_zero_orphan_ast_and_dist_graph_closure(site_root), "OK: 0 cadenas 2-hop, puente Plano 1-2, 6 simuladores Plano 3 vivos, Par Casado JRP 19/19, Acuse SAT/JRP, D3147/F6147 y 0 cutwater verificados."),
        make_gate_report("41. Clausura Cero-Huerfanos V3.8: Biyeccion CYC/SCR en parseSmatPartCode, 0 Colision PRENSAESTOPA/BATCH, Aislamiento Acuse No-Bombeo, #wb-ctrl-res-{sm,bias,gy,rr}, #live-custom-box, 14 Partidas BOM y 5 [data-wb-field] (Gate V3.8 D1..D8)", check_v38_bijective_codes_acuse_isolation_and_zero_orphan_dom(site_root), "OK: Biyeccion 5 circuitos CYC/SCR, 0 colision PRENSAESTOPA/BATCH, Acuse aislado, #wb-ctrl-res-*, #live-custom-box, BOM 14 partidas y 0 llaves JSON huerfanas."),
        make_gate_report("42. Exposicion Total Backend-UI Apple HIG V3.9 y Soberania Cero-Fugas de Inventario: Gorain/Zwietering, Ruth/Timoshenko, 5to Chip XOR Clasificacion, Core Trade-In DAM005, Rama D Hibrida, Pasaporte vCard 4.0 + Anexo 22, smat_engineering_context_v1 y Contraste Solar AAA (Gate V3.9 D1..D10)", check_v39_backend_ui_exposure_and_zero_stock_leak_gate_42(site_root), "OK: 100% capacidades backend expuestas en UI (Apple HIG), 0 fugas publicas de inventario de almacen y contraste AAA verificado."),
        make_gate_report("43. Unificacion Transaccional V4.0 (1 Carrito Canonico por Vista), Consola 4-Tab en /bombeo/, Portada Cowan <= 4.00 y Cero Metalenguaje Visible APL-03 (Gate V4.0 D1..D8)", check_v40_single_canonical_surface_and_zero_visible_metalanguage_gate_43(site_root), "OK: 1 carrito canonico por vista, consola 4-tab en /bombeo/, portada Cowan <= 4.00 y 0 metalenguaje visible (PRIORIDAD-cμ, FNV-1a, INV-SMAT-*)."),
        make_gate_report("44. Visibilidad XOR Viva de las 3 Calculadoras en /cotizar/, Lente Polimorfica PutGet, Core Trade-In 3-Niveles (-22%/-12%/0%) y Proyeccion >90 Campos Backend (Gate V4.1 D1..D9)", check_v41_zero_unexposed_backend_fields_and_live_xor_visibility_gate_44(site_root), "OK: 3 calculadoras XOR vivas en /cotizar/, Lente PutGet polimorfica, Core Trade-In 3 niveles y >90 campos proyectados."),
        make_gate_report("45. Puente Canonico de Calculadoras Verticales (LCOM4=1), Clausura 100% de Retornos Backend (0 Huerfanos) y Cero Fugas Visibles en 286 Paginas dist/**/*.html (Gate V4.2 D1..D9)", check_v42_zero_visible_html_leaks_and_canonical_calculators_gate_45(site_root), "OK: Puente canonico verticalCalculatorsAndLabelsBridge.js (LCOM4=1), 0 campos huerfanos y 0 fugas snake_case/ROLES.JSON/D7/D8 en dist/**/*.html."),
        make_gate_report("46. Contrato Tipado Unificado DOM <-> Fisica <-> Slots, 0 IDs Fantasma, Sensibilidad Diferencial (∂y/∂x != 0) en Gy/RR/Darcy, Calculadoras de Bombeo y 5 Ramas de Material (Gate V4.3 D1..D11)", check_v43_unified_contract_zero_phantom_ids_and_sensitivity_gate_46(site_root), "OK: 0 IDs fantasma, sensibilidad diferencial no nula en Gy/Rosin-Rammler/Darcy-Ruth, alerta NOM-141 >16%, calculadoras interactivas en Bombeo/Filtracion/Flotacion y 5 ramas de material."),
        make_gate_report("47. Pureza Escalar ISO 80000-1 (0 Parentesis en Spans Numericos), Modo Media-Only en [slug].astro, 3NF Visual en [code].astro, Estacion Contigua 3 Vasos <-> Criba Weibull en /clasificacion/ y Statechart XOR wizardCircuitXorStatechart.js en /cotizar/ (Gate V4.4 D1..D9)", check_v44_scalar_purity_zero_duplication_and_xor_contiguity_gate_47(site_root), "OK: Pureza escalar ISO 80000-1, 0 duplicacion lado a lado en [slug].astro, 3NF en [code].astro, estacion contigua en /clasificacion/ y proyeccion Harel XOR en /cotizar/."),
        make_gate_report("48. Clausura Ergonomica Apple HIG + Tepehuana (0 Duplicados SVG INV-ERG-23, Pliegue Above-the-Fold, Fitts >= 48px, Contraste AAA >= 7.2:1), Bus Isomorfico Glitch-Free Verticales <-> Workbench <-> Acuse, Matriz 7 Avenidas / 19 SKUs en /catalogo/ y Pasaporte B2B .vcf/.json (Gate V4.5 D1..D10)", check_v45_ergos_apple_hig_and_backend_parity_gate_48(site_root), "OK: Bus isomorfico glitch-free, JRP dinamico en /acuse/, Gorain en /flotacion/, 7 Avenidas / 19 SKUs + 5 ramas en /catalogo/, Pasaporte B2B .vcf/.json, pureza escalar ISO 80000-1 y 0 violaciones CDP en ergos."),
        make_gate_report("49. Estandarizacion Instrument-First Estrato 1, Lente Bidireccional GetPut<PutGet, Drop-In Verifier, JRP Normal/Paro + Par Casado, Core Trade-In DAM005 y Def-Use 100% V4.8 (Gate 48I D1-V48..D10-V48)", check_v48_instrument_first_bidirectional_lens_and_parity_gate_48i(site_root), "OK: Estrato 1 Instrument-First en 26 rutas verticales ES/EN, lente bidireccional GetPut<PutGet, Drop-In Verifier /catalogo/ + /equipos/, JRP paro_planta + Par Casado, Core Trade-In DAM005, Def-Use metrológico y preset minero en /cotizar/."),
        make_gate_report("50. Clausura Solar WCAG AAA (>=7.0:1) + APCA (|Lc|>=75), Variables var(--*) Cerradas, Extraccion CSS [slug] (<550 LOC), Display-First Vertical y Tour 27/27 (Gate 48J D1-V481..D5-V481)", check_v481_solar_contrast_token_closure_and_tour27_gate_48j(site_root), "OK: Contraste solar WCAG AAA + APCA >= 75, tokens :root sin huecos, CSS compartido productSlugSolar.css, Estrato 1 Display-First y ergos/tour.toml 27/27."),
        make_gate_report("51. Islas Canonicas Unicas V5.0, Contrato Two-Sort EngineSchema <-> DOM, XDSM DAG Puro, Purga de Debris DEB-V50-01..16 y Biyeccion Static-Hash 19 SKUs (Gate V5.0)", check_v50_canonical_islands_and_two_sort_gate_51(site_root), "OK: 11 dominios Two-Sort 100% biyectivos en DOM, XDSM DAG puro, quoteWizardController <450 LOC, Islas Canonicas ES/EN, 0 debris y SSOT 19 SKUs verificados."),
        make_gate_report("52. Contrato Runtime Ejecutable EngineSchema <-> DOM, 7+2 Cores Unicos sin isEmbedded ni Placebos, Higiene Apple HIG y Cero Fugas ES V5.1 (Gate V5.1)", check_v51_runtime_schema_and_zero_placebo_gate_52(site_root), "OK: 7+2 Cores compartidos, 0 isEmbedded, QuoteWizard <480 LOC, lib.rs <650 LOC, 0 inline styles/emojis/placebos, PWA+/admin/ y 0 fugas ES."),
        make_gate_report("53. Landmarks Unicos <main>, Etiquetas Humanas, Bandeja Dialog, Outbox Idempotente, Sobol y Cero Exports JS Muertos V5.3 (Gate V5.3)", check_v53_landmarks_and_zero_orphan_gate_53(site_root), "OK: 1 <main>/pagina, 0 tokens crudos visibles, 0 exports JS muertos fuera de allowlist-11, Outbox reactiva y Sobol proyectado."),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gate_catalog_parity() {
        let root = find_site_root();
        assert!(verify_catalog_parity(&root).is_ok(), "Fallo en paridad de catalogo");
    }

    #[test]
    fn test_gate_leak_scanner() {
        let root = find_site_root();
        assert!(verify_leak_scanner(&root).is_ok(), "Fallo en detector de fugas");
    }

    #[test]
    fn test_gate_bilingual_symmetry() {
        let root = find_site_root();
        assert!(verify_bilingual_symmetry(&root).is_ok(), "Fallo en simetria bilingue");
    }

    #[test]
    fn test_gate_redirect_integrity() {
        let root = find_site_root();
        assert!(verify_redirect_integrity(&root).is_ok(), "Fallo en redirecciones 301");
    }

    #[test]
    fn test_gate_nap_integrity() {
        let root = find_site_root();
        assert!(verify_nap_integrity(&root).is_ok(), "Fallo en verificacion de NAP");
    }

    #[test]
    fn test_gate_zero_placeholders() {
        let root = find_site_root();
        assert!(verify_zero_placeholders(&root).is_ok(), "Fallo en detector de placeholders");
    }

    #[test]
    fn test_gate_decision_criteria() {
        let root = find_site_root();
        assert!(verify_decision_criteria(&root).is_ok(), "Fallo en criterios de decision");
    }

    #[test]
    fn test_gate_print_view_parity() {
        let root = find_site_root();
        assert!(verify_print_view_parity(&root).is_ok(), "Fallo en vista imprimible ERP");
    }

    #[test]
    fn test_gate_no_orphan_debris() {
        let root = find_site_root();
        assert!(verify_no_orphan_debris(&root).is_ok(), "Fallo en control de debris");
    }

    #[test]
    fn test_gate_mining_groups_dataset() {
        let root = find_site_root();
        assert!(verify_mining_groups_dataset(&root).is_ok(), "Fallo en dataset de grupos mineros");
    }

    #[test]
    fn test_gate_slurry_engine_module() {
        let root = find_site_root();
        assert!(verify_slurry_engine_module(&root).is_ok(), "Fallo en motor hidraulico de pulpa");
    }

    #[test]
    fn test_gate_design_tokens_and_workbench() {
        let root = find_site_root();
        assert!(verify_design_tokens_and_workbench(&root).is_ok(), "Fallo en tokens de diseno y live workbench");
    }

    #[test]
    fn test_gate_event_bus_and_export_suite() {
        let root = find_site_root();
        assert!(verify_event_bus_and_export_suite(&root).is_ok(), "Fallo en EventBus y Suite de Exportacion");
    }

    #[test]
    fn test_gate_flight_deck_and_trust_matrix() {
        let root = find_site_root();
        assert!(verify_flight_deck_and_trust_matrix(&root).is_ok(), "Fallo en Flight Deck y Trust Matrix");
    }

    #[test]
    fn test_gate_no_false_sla_promises() {
        let root = find_site_root();
        assert!(verify_no_false_sla_promises(&root).is_ok(), "Fallo en erradicacion de promesas falsas");
    }

    #[test]
    fn test_gate_40_routes_reachability() {
        let root = find_site_root();
        assert!(verify_40_routes_reachability(&root).is_ok(), "Fallo en accesibilidad de las 40 rutas estaticas");
    }

    #[test]
    fn test_gate_linguistic_ethos() {
        let root = find_site_root();
        assert!(verify_linguistic_ethos(&root).is_ok(), "Fallo en calibración de ethos lingüístico");
    }

    #[test]
    fn test_gate_trademark_hygiene() {
        let root = find_site_root();
        assert!(verify_trademark_hygiene(&root).is_ok(), "Fallo en higiene de propiedad intelectual");
    }

    #[test]
    fn test_gate_security_headers() {
        let root = find_site_root();
        assert!(verify_security_headers(&root).is_ok(), "Fallo en cabeceras de seguridad");
    }

    #[test]
    fn test_gate_no_emergency_claims() {
        let root = find_site_root();
        assert!(verify_no_emergency_claims(&root).is_ok(), "Fallo en erradicación de claims de emergencia");
        assert!(verify_pump_assembly_and_zero_orphan_rfq_links(&root).is_ok(), "Fallo en verificacion de reporte de armado y enlaces /#rfq");
        assert!(verify_backend_ui_parity_and_apple_cowan(&root).is_ok(), "Fallo en verificacion de paridad backend-UI y Cowan 4+-1");
        assert!(verify_modular_parnas_and_zero_fake_data_step_gate(&root).is_ok(), "Fallo en Gate 23: particion modular Parnas y cero data-step=2");
        assert!(verify_manuel_lexical_and_route_separation_gate(&root).is_ok(), "Fallo en Gate 24: higiene lexica Don Manuel y separacion de rutas");
        assert!(verify_solar_wcag_aaa_and_etapa3_parity(&root).is_ok(), "Fallo en Gate 25: polaridad solar WCAG AAA y paridad Etapa 3");
        assert!(verify_backend_ui_full_parity_and_altitude_pincer(&root).is_ok(), "Fallo en Gate 26: paridad 100% Backend-UI y pinza termo-barometrica TEFC");
    }

    #[test]
    fn test_gate_26_backend_ui_full_parity_and_altitude_pincer() {
        let root = find_site_root();
        assert!(
            verify_backend_ui_full_parity_and_altitude_pincer(&root).is_ok(),
            "Fallo en Gate 26: paridad 100% Backend-UI y pinza termo-barometrica TEFC"
        );
    }

    #[test]
    fn test_gate_27_section_3_1_3_2_ergos() {
        let root = find_site_root();
        assert!(
            verify_section_3_1_3_2_zero_duplication_and_mobile_fold(&root).is_ok(),
            "Fallo en Gate 27: erradicacion de redundancias Secciones 3.1 y 3.2 y fold movil Apple HIG"
        );
    }

    #[test]
    fn test_gate_28_quick_checkout_and_cad_bijection() {
        let root = find_site_root();
        assert!(
            verify_quick_checkout_and_cad_bijection(&root).is_ok(),
            "Fallo en Gate 28: bijeccion de 19 SKUs Quick-Checkout, 13 partes atomicas y capa X-Ray CAD"
        );
    }

    #[test]
    fn test_gate_29_sla_verifiability_and_lcom4_seam() {
        let root = find_site_root();
        assert!(
            verify_sla_verifiability_and_lcom4_seam(&root).is_ok(),
            "Fallo en Gate 29: verificabilidad fisica de SLAs, Bandeja c*mu, Balance 3 Vasos Marcy y costuras LCOM4"
        );
    }

    #[test]
    fn test_gate_30_prd_v3_forensic_closure() {
        let root = find_site_root();
        assert!(
            verify_prd_v3_forensic_closure_gate_30(&root).is_ok(),
            "Fallo en Gate 30: Cierre Forense PRD v3.0 (19 SKUs + Alias SSG, ProductQuickCard, Drop-In Guard, QuickOrderTray, CycloneAndScreenReport, 0 Banco Durango, 38+ Redirects)"
        );
    }

    #[test]
    fn test_gate_31_total_orphan_closure_and_epistemic_arbitrage() {
        let root = find_site_root();
        let res = verify_total_orphan_closure_and_epistemic_arbitrage_gate_31(&root);
        assert!(
            res.is_ok(),
            "Fallo en Gate 31 (Cierre Total v3.1): {:?}",
            res.err()
        );
    }

    #[test]
    fn test_gate_32_seven_findings_and_v32_closure() {
        let root = find_site_root();
        let res = verify_seven_findings_and_v32_closure_gate_32(&root);
        assert!(
            res.is_ok(),
            "Fallo en Gate 32 (Cierre Definitivo de los 7 Hallazgos Criticos v3.2): {:?}",
            res.err()
        );
    }

    #[test]
    fn test_gate_34_v34_svg_exhaustiveness_and_zero_orphan_webp() {
        let root = find_site_root();
        let res = check_v34_svg_exhaustiveness_and_zero_orphan_webp(&root);
        assert!(res.is_ok(), "Fallo en Gate 34 (V3.4 SVG Exhaustiveness & Zero Orphan WebP): {:?}", res.err());
    }

    #[test]
    fn test_gate_35_v34_lab_sku_domain_purity() {
        let root = find_site_root();
        let res = check_v34_lab_sku_domain_purity(&root);
        assert!(res.is_ok(), "Fallo en Gate 35 (V3.4 Lab SKU Domain Purity): {:?}", res.err());
    }

    #[test]
    fn test_gate_36_v34_atomic_catalog_and_hub_link_closure() {
        let root = find_site_root();
        let res = check_v34_atomic_catalog_and_hub_link_closure(&root);
        assert!(res.is_ok(), "Fallo en Gate 36 (V3.4 Atomic Catalog & Hub Link Closure): {:?}", res.err());
    }

    #[test]
    fn test_gate_37_v34_qtray_dual_cta_qcard_cmu_and_reorder_hydration() {
        let root = find_site_root();
        let res = check_v34_qtray_dual_cta_qcard_cmu_and_reorder_hydration(&root);
        assert!(res.is_ok(), "Fallo en Gate 37 (V3.4 QuickOrderTray Dual CTA, c*mu & LCOM4 Seams): {:?}", res.err());
    }

    #[test]
    fn test_gate_38_v35_zero_orphan_ast_and_dist_graph_closure() {
        let root = find_site_root();
        let res = check_v35_zero_orphan_ast_and_dist_graph_closure(&root);
        assert!(res.is_ok(), "Fallo en Gate 38 (V3.5 Forensic Closure & JRP): {:?}", res.err());
    }

    #[test]
    fn test_gate_41_v38_bijective_codes_acuse_isolation_and_zero_orphan_dom() {
        let root = find_site_root();
        let res = check_v38_bijective_codes_acuse_isolation_and_zero_orphan_dom(&root);
        assert!(res.is_ok(), "Fallo en Gate 41 (V3.8 Zero Orphan Closure): {:?}", res.err());
    }

    #[test]
    fn test_gate_42_v39_backend_ui_exposure_and_zero_stock_leak() {
        let root = find_site_root();
        let res = check_v39_backend_ui_exposure_and_zero_stock_leak_gate_42(&root);
        assert!(res.is_ok(), "Fallo en Gate 42 (V3.9 Apple HIG Backend Exposure & Zero Stock Leak): {:?}", res.err());
    }

    #[test]
    fn test_gate_43_v40_single_canonical_surface_and_zero_visible_metalanguage() {
        let root = find_site_root();
        let res = check_v40_single_canonical_surface_and_zero_visible_metalanguage_gate_43(&root);
        assert!(res.is_ok(), "Fallo en Gate 43 (V4.0 Single Canonical Surface & Zero Visible Metalanguage): {:?}", res.err());
    }

    #[test]
    fn test_gate_44_v41_zero_unexposed_backend_fields_and_live_xor_visibility() {
        let root = find_site_root();
        let res = check_v41_zero_unexposed_backend_fields_and_live_xor_visibility_gate_44(&root);
        assert!(res.is_ok(), "Fallo en Gate 44 (V4.1 Zero Unexposed Backend Fields & Live XOR Visibility): {:?}", res.err());
    }

    #[test]
    fn test_gate_45_v42_zero_visible_html_leaks_and_canonical_calculators() {
        let root = find_site_root();
        let res = check_v42_zero_visible_html_leaks_and_canonical_calculators_gate_45(&root);
        assert!(res.is_ok(), "Fallo en Gate 45 (V4.2 Zero Visible HTML Leaks & Canonical Calculators): {:?}", res.err());
    }

    #[test]
    fn test_gate_46_v43_unified_contract_zero_phantom_ids_and_sensitivity() {
        let root = find_site_root();
        let res = check_v43_unified_contract_zero_phantom_ids_and_sensitivity_gate_46(&root);
        assert!(res.is_ok(), "Fallo en Gate 46 (V4.3 Unified Contract, Zero Phantom IDs & Differential Sensitivity): {:?}", res.err());
    }

    #[test]
    fn test_gate_47_v44_scalar_purity_zero_duplication_and_xor_contiguity() {
        let root = find_site_root();
        let res = check_v44_scalar_purity_zero_duplication_and_xor_contiguity_gate_47(&root);
        assert!(res.is_ok(), "Fallo en Gate 47 (V4.4 Scalar Purity ISO 80000-1, Zero Duplication & XOR Contiguity): {:?}", res.err());
    }

    #[test]
    fn test_gate_48_v45_ergos_apple_hig_and_backend_parity() {
        let root = find_site_root();
        let res = check_v45_ergos_apple_hig_and_backend_parity_gate_48(&root);
        assert!(res.is_ok(), "Fallo en Gate 48 (V4.5 Ergos Apple HIG + Tepehuana & Backend-UI Parity): {:?}", res.err());
    }

    #[test]
    fn test_gate_48i_v48_instrument_first_and_bidirectional_lens() {
        let root = find_site_root();
        let res = check_v48_instrument_first_bidirectional_lens_and_parity_gate_48i(&root);
        assert!(res.is_ok(), "Fallo en Gate 48I (V4.8 Instrument-First Stratum 1, Bidirectional Lens & Parity): {:?}", res.err());
    }

    #[test]
    fn test_gate_48j_v481_solar_contrast_token_closure_and_tour27() {
        let root = find_site_root();
        let res = check_v481_solar_contrast_token_closure_and_tour27_gate_48j(&root);
        assert!(res.is_ok(), "Fallo en Gate 48J (V4.8.1 Solar AAA+APCA, Token Closure, [slug] CSS, Display-First & Tour 27/27): {:?}", res.err());
    }

    #[test]
    fn test_gate_51_v50_canonical_islands_and_two_sort() {
        let root = find_site_root();
        let res = check_v50_canonical_islands_and_two_sort_gate_51(&root);
        assert!(res.is_ok(), "Fallo en Gate 51 (V5.0 Islas Canonicas, Two-Sort EngineSchema <-> DOM, XDSM DAG y Purga Debris): {:?}", res.err());
    }

    #[test]
    fn test_gate_52_v51_runtime_schema_and_zero_placebo() {
        let root = find_site_root();
        let res = check_v51_runtime_schema_and_zero_placebo_gate_52(&root);
        assert!(res.is_ok(), "Fallo en Gate 52 (V5.1 Contrato Runtime EngineSchema, Cores Unicos y Cero Placebos): {:?}", res.err());
    }

    #[test]
    fn test_gate_53_v53_landmarks_and_zero_orphan() {
        let root = find_site_root();
        let res = check_v53_landmarks_and_zero_orphan_gate_53(&root);
        assert!(res.is_ok(), "Fallo en Gate 53 (V5.3 Landmarks <main>, Etiquetas Humanas, Dialog, Outbox, Sobol y Zero Dead Exports): {:?}", res.err());
    }
}
