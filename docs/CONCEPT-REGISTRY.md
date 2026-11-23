# Registro Canónico de Conceptos (Anti-Huérfanos) — SMAT Minerals

Este documento establece la propiedad, fuente de verdad y consumidores de cada concepto técnico activo para evitar elementos huérfanos o desalineados:

| Concepto | Tipo | Fuente de Verdad | Dueño | Consumidores |
|---|---|---|---|---|
| `role_id` | Identificador Técnico | `data/roles.json` | Ingeniería SMAT | `PumpingHubIsland.astro`, `QuoteWizard.astro`, `SharePurchasing.astro`, `smat-gate` |
| `intent` | Intención de Cotización | Formulario RFQ | Operaciones / Ventas | `QuoteWizard.astro`, Eventos GA4 (`lead_paro_urgente`, `lead_proyecto_capex`) |
| `urgency` | Nivel de SLA | `data/diagnostics.json` | Planta Durango | WhatsApp Deep Link, Asistente de Cotización |
| `metallurgy` | Atributo Físico | `data/roles.json` | Ingeniería de Materiales | Fichas técnicas, `SharePurchasing.astro`, `llms-full.txt` |
| `decision_criteria` | Reglas y Límites de Pulpa | `data/roles.json` | Ingeniería de Procesos | `TribologyAlloyIsland.astro`, `FiltrationCalculatorIsland.astro`, `FlotationCalculatorIsland.astro`, Fichas de rol, `smat-gate` (Gate D10) |
| `circuits` | P&ID Nodos y Fallas | `data/circuits.json` | Metalurgia Regional | `CircuitNavigator.astro`, `index.astro` (Decisión 1-A) |
| `trust_charter` | Pacto y Límites de Planta | `data/trust.json` | Dirección Comercial | `TrustMatrix.astro`, `/garantia/`, `/en/warranty/` (Decisión 2-A) |
| `field_cases` | Evidencia de Servicio Severo | `data/cases.json` | Ingeniería de Aplicaciones | `CaseCards.astro`, `index.astro` (Decisión 5-A) |
| `faqs` | Preguntas Frecuentes GEO | `data/faqs.json` | Marketing Técnico | `BaseLayout.astro` (Schema.org `FAQPage`) (Decisión 9-A) |
| `print_receipt` | Folio Formal para ERP | URL Params / Local | Compras / Facturación | `/acuse/`, `/en/thank-you/`, `smat-gate` (Gate D11) |
| `NAP` | Identidad Física | `data/company.json` | Dirección Legal | `Footer.astro`, `contacto.astro`, Schema.org, `smat-gate` |
| `301 Mappings` | Enrutamiento SEO | `data/redirects.csv` | Marketing / SEO | `public/_redirects`, `smat-gate` |
| `locale_pref` | Estado de Idioma | `localStorage` / Browser | Front-end | `BaseLayout.astro` (Micro-script Zero-FOUC), `Header.astro` |
| `quick_checkout_skus` | 19 SKUs Canónicos Caja Rápida | `data/quick_checkout_Catalog.json` | Ingeniería / Ventas | `quickProductsCatalog.js`, `ProductQuickCard.astro`, `productos/[slug].astro`, `QuickOrderTray.astro`, `smat-gate` |
| `atomic_parts_13` | 13 Piezas Atómicas BOM | `data/atomic_parts.json` | Ingeniería Planta | `districtProfilesAndSkuCatalog.js`, `AtomicPartIsland.astro`, `CatalogFacetedIsland.astro`, `PumpAssemblyReport.astro` |
| `workbench_lens_v2` | Lente Bidireccional PutGet | `smat_workbench_state_v2` | Arquitectura / UX | `workbenchBus.js`, `quoteWizardController.js`, `wizardStateAndUrlLens.js`, `wizardDossierProjector.js`, `wizardEventBindings.js`, `wizardMiningAndCodeDecoder.js`, `wizardUrlAndPresetRouter.js`, `acuse.astro` |
| `hybrid_a05_r55` | Rama D Híbrida Finnie-Hutchings | `WET_END_MATERIAL_MATRIX` | Metalurgia / Tribología | `tribologyAndCompatibilityEngine.js`, `pumpAssemblyAndDriveEngine.js`, `TribologyAlloyIsland.astro`, `SealDriveBearingIsland.astro`, `QuoteWizard.astro`, `PumpAssemblyReport.astro` |
| `engine_schema_v50` | Contrato Two-Sort 11 Dominios (`EngineSchema <-> DOM`) | `src/scripts/engineSchemaRegistry.js` | Arquitectura / Ingeniería | `wizardXdsmDagSolver.js`, `QuoteWizard.astro`, `src/components/islands/*.astro`, `smat-gate` (`Gate 51`) |
| `engine_schema_v51` | Contrato Runtime Ejecutable `EngineSchema <-> DOM` + Cores Únicos + `i18nDomainLabels` | `src/scripts/engineSchemaRegistry.js` | Arquitectura / Ingeniería | `schemaRuntimeBinder.js`, `src/components/cores/*.astro`, `i18nDomainLabels.js`, `urlContextAndPartCodeParser.js`, `smat-gate` (`Gate 52`) |
| `engine_schema_v52` | Clausura Estructural Zero-Crash, Escritor Único Metrológico, CSS Apple-Tier e Outbox Honesta | `src/scripts/engineSchemaRegistry.js` | Arquitectura / Ingeniería | `leadOutboxStateMachine.js`, `catalogFacetedViewModel.js`, `cores-apple.css`, `acuseSheetController.js`, `MetrologyLabCore.astro`, `smat-gate` (`Gate 52`) |
| `engine_schema_v53` | Landmark Único `<main>`, Etiquetas Humanas, Bandeja `<dialog>`, Outbox Idempotente, Sobol Dossier y Poda de Exports (`allowlist-11`) | `crates/smat-gate/src/v53_landmarks_and_zero_orphan_gate.rs` | Arquitectura / Ergos | `AcuseSheetIsland.astro`, `i18nDomainLabels.js`, `QuickOrderTray.astro`, `QuoteWizard.astro`, `LiveEngineeringDossier.astro`, `smat-gate` (`Gate 53`) |
| `SMAT_SUPPLY_DOORS` | Fuente Única de Verdad 3 Puertas (`Equipos`, `Bombas`, `Control`), Fitts `20x20`/`48px`, Drawers `Cowan <= 8.50` (`v5.3.1`) | `src/scripts/i18nDomainLabels.js` | Arquitectura / UX | `HomeLandingIsland.astro`, `Header.astro`, `Footer.astro`, `EquipmentHubIsland.astro`, `PumpingHubIsland.astro`, `ProcessControlIsland.astro`, `CatalogFacetedIsland.astro`, `TribologyAlloyIsland.astro`, `SealDriveBearingIsland.astro`, `v3_forensic_gates.rs`, `v53_landmarks_and_zero_orphan_gate.rs` |

> **Allowlist de 11 Helpers de Contrato de Test (`Gate 53`):** `CATALOG_ATOMIC_PARTS_COUNT`, `normalizePartTokenTwoStage`, `TWO_SORT_PARTITION_VERSION`, `listAllDeclaredDomIds`, `verifyConceptRegistryCoverage`, `WEBHOOK_OUTBOX_STATES`, `isPlaceholderWebhookUrl`, `resolveInternalBudgetCategory`, `VERTICAL_STATION_LENS_DESCRIPTORS`, `renderMiningPresetTelemetry`, `XDSM_DISCIPLINE_ORDER`.
