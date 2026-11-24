# Guía Canónica de Despliegue ($0/mes) — SMAT Minerals Site v5.7

> **Repositorio:** [`memoestefani/smat-portal`](https://github.com/memoestefani/smat-portal) (rama de producción: `main`)  
> **Dominio:** https://smatminerals.com  
> **Hosting:** Cloudflare Pages (plan Free), sitio 100% estático (`output: 'static'`, Astro 5)  
> **Presupuesto:** $0.00 USD/mes. Sin backend, sin base de datos, sin dependencias de cliente pesadas.  
> **Compuerta de calidad:** `npm run preflight` = `build:images` + `compile_redirects.ps1` + `tsc --noEmit` + `astro check` + `astro build` + `npm test` + `npm run gate`

---

## 1. Matriz de Infraestructura

| Servicio | Costo | Función | Evidencia en el repo |
|---|---|---|---|
| GitHub | $0 | Repositorio y disparador de despliegue | `origin = github.com/memoestefani/smat-portal` |
| Cloudflare Pages | $0 | Hosting estático, CDN, certificados, cabeceras y `201` redirecciones 301 | `@astrojs/cloudflare`, `public/_headers`, `data/redirects.csv` → `public/_redirects` |
| Service Worker PWA | $0 | Modo desconectado en campamento minero | `public/sw.js` (`smat-pwa-v5.5`) |
| Telemetría | $0 | Google Analytics 4 solo si existe `PUBLIC_GA_ID` | `BaseLayout.astro` (sin ID fijo en código) |

No hay variables de entorno obligatorias. Única opcional: `PUBLIC_GA_ID`.

---

## 2. Invariantes que Bloquean un Despliegue

Un cambio **no se publica** si alguno falla. Las **11 compuertas comportamentales** (`smat-gate v2.2`) y sus **7 unit tests Rust** viven en [`crates/smat-gate`](crates/smat-gate/src/lib.rs) (`physics_and_schema.rs`, `security_and_leaks.rs`, `seo_and_i18n.rs`, `ux_and_css_layers.rs`) junto con **63 pruebas en Node.js** dentro de `tests/*.test.mjs`:

1. **Paridad de catálogo y cero debris:** `data/roles.json`, `data/quick_checkout_Catalog.json` y `data/atomic_parts.json` válidos; `0` archivos `roles.copy.json`, `0` módulos `@ts-nocheck` en `src/scripts/`.
2. **Cero fugas comerciales:** sin `$` seguido de cifras ni `margen:` en `data/`, `public/` o `src/`.
3. **Cero marcas ajenas:** sin `warman`, `denver`, `metso`, `outotec`, ni transportistas (`castores`, `tresguerras`, `potosinos`).
4. **Cero palabras prohibidas:** `taller`, `workshop`.
5. **Cero promesas falsas ni SLA inflado:** sin `45 min`, `24/7`, `24-48h`, "servicio de emergencia", "2.5x garantizado".
6. **Cascada CSS `@layer` y accesibilidad DOM:** todas las hojas CSS encapsuladas en `@layer` (salvo `.hidden`/`[hidden]` y `@media print`), `0` `<button>` anidados dentro de `<summary>`, `0` elementos `data-schema-*` ocultos (`hidden`/`sr-only`) y landmark `<main>` único por HTML.
7. **Simetría bilingüe, cero fugas en `/en/` y `201` redirects 301:** `0` fugas ES ni enums internos crudos (`HOIST_REQUIRED`, `CAJA_CHICA_CFDI40`, `alto_cromo_cr27`, `PARO PROTEGIDO`, `PARO DE LÍNEA`, `USD/hora`) en `dist/en/` ni en snapshots hidratados; redirecciones 301 deterministas de 1 salto desde `data/redirects.csv`.
8. **NAP consistente** (Mariano Salas #114, Col. Primer Presidente, Durango, Dgo. CP 34166).
9. **Cabeceras de seguridad** (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) y vista imprimible del acuse (`A4`).
10. **IDs críticos del cotizador** (`rfq`, `live-folio`, `wb-pdf-btn`, `wb-copy-btn`, `wb-submit-outbox-btn`, etc.) y payload ligero en `/cotizar/`.

### Directivas de Don Manuel (revisión de campo antes de publicar)
Antes de cada publicación verifica que no reaparezcan:
- "Bombeo" en títulos principales (usar **Bombas para Lodos**), "en Skid Estructural", "rodete", "garganta" (usar **Cuello**).
- "Sello mecánico" como producto ofertado (SMAT vende expulsor centrífugo y prensaestopa).
- Etiquetas `OPEX` / `CAPEX`, "stock en almacén", "entrega inmediata", "banco de pruebas en Durango".
- El texto "Facilite su Requisición o RFQ" (blindaje anti-"Luis").

---

## 3. Pipeline Local de Verificación (Pre-Flight)

Desde `c:\Users\52331\Documents\Proyectos\smat\site`:

```powershell
# Verificación completa unificada (19 WebP + 201 redirects + tsc + astro check + build + 63 pruebas Node + 11 compuertas Rust)
npm run preflight
```

Si deseas ejecutar cada etapa individualmente (en hosts de 8 GB RAM usar `-j 1` para Cargo):

```powershell
tsc --noEmit                                  # esperado: 0 errors
npx astro check                               # esperado: 0 errors, 0 warnings
npx astro build                               # genera dist/
npm test                                      # esperado: 67/67 PASS
npm run gate                                  # esperado: 11/11 PASS
cargo test --manifest-path crates/smat-gate/Cargo.toml -j 1 -- --test-threads=1  # esperado: 9/9 PASS
npm run preview                               # revisión visual en http://localhost:4321
```

---

## 4. Flujo de Publicación a GitHub (`origin/main`)

```powershell
# 1. Ejecutar compuerta completa
npm run preflight

# 2. Revisar archivos modificados
git status

# 3. Commit con mensaje convencional y push a main
git add -A
git commit -m "feat: <descripción concisa del cambio>"
git push origin main
```

---

## 5. Configuración de Cloudflare Pages

| Campo | Valor |
|---|---|
| Repositorio conectado | `memoestefani/smat-portal` |
| Rama de producción | `main` |
| Comando de build | `npm run build` |
| Directorio de salida | `dist` |
| Versión de Node | Node ≥ 20 |
| Dominio personalizado | `smatminerals.com` |

Archivos que Cloudflare lee automáticamente desde `dist/`:
- `_headers` → seguridad (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- `_redirects` → `201` redirecciones 301 compiladas desde `data/redirects.csv` hacia URLs canónicas ES/EN.

---

## 6. Pruebas de Humo Post-Despliegue

```powershell
# 1. Cabeceras de seguridad
curl.exe -s -I https://smatminerals.com | Select-String "x-frame-options|x-content-type-options"

# 2. Páginas clave devuelven 200
foreach ($p in "/", "/cotizar/", "/bombeo/", "/catalogo/", "/equipos/", "/flotacion/", "/filtracion/", "/en/", "/en/quote/", "/en/pumping/", "/en/catalog/") {
  "{0} -> {1}" -f $p, (curl.exe -s -o NUL -w "%{http_code}" "https://smatminerals.com$p")
}
```

Revisión manual en producción (2 minutos):
1. El botón de WhatsApp abre `wa.me/526183670664`.
2. El cotizador (`/cotizar/#rfq`) carga y genera el folio `SMAT-2026-…`.
3. En `/bombeo/` operan las estaciones en pestañas únicas (`#bombeo-station-tabs`) sin calculadoras duplicadas en subrutas.
4. Los diagramas técnicos CAD/blueprint se ven correctamente en móvil y escritorio.

---

## 7. Reversión (Rollback) en 1 Minuto

Si algo sale mal tras publicar:
1. Cloudflare Pages → proyecto → **Deployments** → elegir el despliegue anterior bueno → **Rollback to this deployment**.
2. En git: `git revert HEAD` y `git push origin main`.

---

## 8. Seguridad y Datos que Nunca Deben Subirse

- Nunca versionar: `.env`, bases de precios históricas (`SMAT_Catalogo_*.csv`), la carpeta `2_smat/ideas/adSMAT22` (ERP, CFDI, estados de cuenta) ni datos bancarios (`Cuenta BBVA`, `CLABE`, `saldo bancario`).
- El PRD y los análisis estratégicos viven fuera de este repositorio (`smat/PRD_SMAT_SITE_V3_ALINEACION_ESTRATEGICA.md`); no se publican con el sitio.

---

## 9. Historial de Versiones

- **v2.2 / v2.3:** distribución B2B, fichas atómicas anti-scraping, briefing AISC, WhatsApp oficial (618) 367-0664.
- **v3.1:** directivas de campo de Don Manuel: Bombas para Lodos, 8 diagramas técnicos CAD/blueprint (`TechnicalDiagrams.astro`), lote de contacto húmedo 5‑5‑4, Bearing Assembly / Housing, sin sello mecánico, Mecanismos para Celdas de Flotación y Acondicionadores, Filtros Prensa, Balanzas de Densidad Marcy y blindaje anti-"Luis".
- **v3.2:** arquitectura unificada sin conceptos huérfanos (19/19 componentes activos), cerebro cliente único (`QuoteWizard.astro` conectado directamente a `slurryEngine.js` y `workbenchBus.js`), revelación progresiva en 3 etapas con resumen hidráulico en vivo, continuidad transaccional lossless 100% (`workbenchBus` ➔ `Code.gs` ➔ `acuse.astro` ➔ `Sveltia CMS`), `CircuitNavigator.astro` multi-rol en las 3 verticales y `SharePurchasing.astro` en las 10 subpáginas de Bombeo.
- **v3.3:** Arquitectura de las Tres Puertas de Don Manuel: portada minimalista de baja carga cognitiva (`/` y `/en/`), **Puerta 1: Equipos de Proceso** (`/equipos/` y `/en/process-equipment/`), **Puerta 2: Bombas para Lodos y Spare Parts** (`/bombeo/` y `/en/pumping/` con lote 5-5-4 y matriz comparativa), **Puerta 3: Control de Procesos** (`/control-de-procesos/` y `/en/process-control/` con Balanza Marcy, Filtro Batch de Laboratorio y Tamices Certificados ASTM E11 / ISO 3310 + calculadora metrológica interactiva), ruta dedicada de cotizador (`/cotizar/` y `/en/quote/`), 10 diagramas vectoriales CAD (`TechnicalDiagrams.astro`) y enrutamiento presupuestal interno silencioso (`resolveInternalBudgetCategory`).
- **v3.4:** Pieza Primero, Cero Rollo y Reporte Interactivo de Armado de Bomba: eliminación de párrafo redundante en Hero (`/` y `/en/`), chips clicables de piezas en las 3 puertas, cinta superior de selección rápida en 1 clic (`<QuickPartSelectorStrip />`), reporte interactivo de 5 estaciones de armado (`<PumpAssemblyReport />` con bifurcación Wet-End Alto Cromo ≥650 HB vs. Hule/Poliuretano, calibración de claro axial frontal $\delta = 0.5\text{–}1.0\text{ mm}$ y BOM de 14 piezas), muestrario visual por material (`material_kit_grid`), selector de arreglos de transmisión V-Belt (`CV`, `ZVZ`, `CRZ`, `DC` + `drive_arrangements` y `suction_throatbush`), y erradicación del 100% de enlaces huérfanos `/#rfq` hacia `/cotizar/` y `/en/quote/`.
- **v3.5:** Paridad Backend-UI 100%, Store Físico Unificado por Circuito y Descompresión Cognitiva Apple HIG / Ergos (`Cowan Score <= 4.50`): consolidación canónica de `slurryEngine.js`, Store Físico Unificado en `workbenchBus.js`, Segmented Controls Apple HIG en `/equipos/`, `/control-de-procesos/` y `/cotizar/`.
- **v3.6:** Cierre integral de las 10 Decisiones de Etapa 3 (Lente Ingeniero de Apple de 42 Años): erradicación de triple redundancia en portada (`/index.astro` y `/en/index.astro`, eliminación física de `PerspectiveSelector.astro` y `FlightDeck.astro`), contraste solar WCAG AAA en patio de mina (`--smat-copper-accent: #7c2d12` `10.65:1` y `--smat-blue-royal: #0c4a6e` `9.61:1`), barra XOR de 4 circuitos en Paso 01 (`#wb-step1-xor-circuit-bar`), paridad metrológica bidireccional total (Báscula Marcy bidireccional `%Cw` ↔ `ρ_p`, Muestreo Pierre Gy con presión de aire, constante `C` y error relativo, Torre ASTM E11 de 6 columnas con `isPrimaryP80Control`), matriz comparativa `WET_END_MATERIAL_MATRIX` (`#wb-material-matrix-card`) y cierre ERP de 4 canales con soporte `U01` y series `12x10` / `14x12`.
- **v4.0:** Paridad Total Backend → UI (100% sin funciones huérfanas), Pinza Termo-Barométrica de Altitud ($K_{\text{motor,alt}} = (\eta_r \cdot f_{\text{IEC}}(z))^{-1}$, `pAtmHeadMca`, `deltaNpshLossM`, `motorDeratingFactor`, `effDeratingFactorEr`, `estimatedImpellerLifeHours`), Compuerta Interactiva de Plausibilidad Física y Límites de Rechazo (`validatePlantLeadInput` + `data/trust.json` en `#gate-lead-status` y `#trust-boundary-alert`), Inversión Gravimétrica de 3 Vías en Báscula Marcy (`solveFor: 'ore_density_rhop'`), Presets por Distrito Minero (`resolveMiningDistrictPreset`), Snapshot Canónico Único de 38 Campos (`buildCanonicalEngineeringSnapshot` con `0 [DTO-DROP]` hacia `Code.gs`, `/acuse/`, SAP y WhatsApp) y Geometría Móvil Instrument-First Above-the-Fold (`360×740 px`).
- **v4.1:** Cierre Forense de Sección 2.1 ("Capacidades del Backend Ocultas o Truncadas en la UI" — 50 rutas bilingües):
  1. **12 Fichas Atómicas Completas (`/catalogo/[code]` y `/en/catalog/[code]`):** Exposición de los 6 campos físicos de `data/atomic_parts.json` y `getAtomicPartSpecs()` (`weight_kg`, `niosh_handling_mode`, `impeller_diameter_mm`, `max_particle_mm`, `station_number` + `assembly_order_note`, `wall_thickness_mm`), ecuación Waters-NIOSH 1993 de montaje horizontal en eje ($RWL_{\text{eje}} = 11.1\text{ kg}$, $LI_{\text{eje}}$) y tarjeta `<SharePurchasing />` hidratada en vivo.
  2. **Carburo de Silicio Sinterizado (`ceramica_sic`, $\ge 2200\text{ HV}$, Mohs $9.2$) y Tenacidad a la Fractura Evans-Wilshaw ($K_{Ic} = 4.1\text{ MPa}\sqrt{\text{m}}$):** Expuesto en `QuoteWizard.astro`, `/bombeo/skid/`, `/en/pumping/skid/`, `/bombeo/revestimientos/` y `/en/pumping/liners/`, con alerta de fractura frágil (*spalling*) para $d_{80} > 800\,\mu\text{m}$ o $u_2 > 28\text{ m/s}$.
  3. **Hidratación Dinámica en `SharePurchasing.astro` y Exportación TSV SAP/Excel:** Corrección de `&detalle=` $\to$ `&detalles=` (`DEB-21-01`), lectura en vivo de `loadWorkbenchState()` + `buildCanonicalEngineeringSnapshot()` y botón `.copy-tsv-btn` (`formatSapTsv`, `DEB-21-02`).
  4. **Pre-llenado Multi-Circuito Completo en `quoteWizardController.js`:** Normalización canónica `normalizeMaterialKey` (`A05`/`R55`/`PU`/`SiC`) y `normalizeCircuitSerie` (`?serie=` hidrata `selectPipeSize`, `selectFlotCapacity`, `selectFiltCapacity` y `selectCtrlSpec`), más activación de `flot_condition` y `filt_condition` (`DEB-21-03`, `DEB-21-04`).
  5. **Erradicación de Enlaces RFQ Muertos (`DEB-21-05`) y Paridad Científica en las 26 Subpáginas de Bombeo, Flotación y Filtración:** `CircuitNavigator.astro` y todas las subpáginas apuntan a `/cotizar/` y `/en/quote/` con `circuito=`, `equipo=`, `serie=`, `material=`, `estacion=`; exposición del 100% de `decision_criteria` de `data/roles.json`, inspector ISO 281:2007 ($L_{10mh}$ con $a_{\text{ISO}} = 1.25$ Laberinto vs. $0.22$ Fieltro contaminado) en `/bombeo/soporte/`, comparador Estación 02A/02B en `/bombeo/sello/`, flujo superficial de burbuja JKMRC Gorain ($S_b = 6 J_g / d_{32}$) en `/flotacion/celdas/` y compresibilidad de torta Darcy-Ruth ($\alpha = \alpha_0 (\Delta P)^s$) en `/filtracion/prensa/`.
  6. **Contraste Solar WCAG AAA (`10.65:1`) y Paridad Móvil `390×844` en `/en/quote/`:** Botones `.node-cta-rfq` y `.btn-open-drawer` en `#7c2d12` / `#ffffff` (`DEB-21-08`).
- **v4.2:** Cierre Quirúrgico de Secciones 3.1 y 3.2 (Erradicación de Redundancias, Fricción Móvil `390×844` y Código Muerto — 27 Gates en `smat-gate`):
  1. **Eliminación física de `DualHubView.astro` (`DEB-32-01`) y Consolidación en `CircuitNavigator.astro`:** `CircuitNavigator.astro` absorbe `rolesData` (`decision_criteria`: `required_slurry_vars_es/en`, `metallurgy_rule_es/en`, `risk_avoided_es/en`) y sincronización con `workbenchBus.js`, eliminando la duplicación de las 9 tarjetas en `/equipos/` y `/en/process-equipment/`.
  2. **Consolidación Tabulada en `/bombeo/` y `/en/pumping/` (`#bombeo-catalog-tabs`, `DEB-32-02`):** Eliminación de `.wet-lot-callout` redundante y unificación de las 5 tarjetas por sub-ensamble y las 6 tarjetas atómicas (`D3147`–`E4083` enriquecidas con `weight_kg` NIOSH) en un solo selector tabulado Apple HIG, con `CircuitNavigator` plegado en `<details id="bombeo-circuit-drawer">`.
  3. **Ley Apple HIG *Input First, Readout Second* en `QuoteWizard.astro` (`DEB-32-03`):** Reordenamiento de `#wb-role` y `#wb-pipe-size` por encima de `#wb-atomic-part-card` y eliminación del banner redundante `.circuit-context-banner`.
  4. **Erradicación de 28 Tokens LaTeX Crudos (`$...$`) en `/control-de-procesos/` y `/en/process-control/` (`DEB-32-04`) y Fold Móvil `@media (max-width: 768px)`:** Reemplazo por subíndices HTML nativos (`P<sub>80</sub>`, `S<sub>s</sub>`, `C<sub>w</sub>`, `ρ<sub>p</sub>`, `M<sub>s</sub>`, `d<sub>95</sub>`, `a<sub>L</sub>`), compactación de cabeceras y conversión de `.doors-breadcrumb` y `.diag-filter-chips` en strips horizontales scrollables de 1 fila en móvil.
  5. **Paridad SSOT en Tiempo de Ejecución, Lente Bidireccional PutGet, Ergonomía Waters-NIOSH 1993 de 3 Niveles y Polaridad Solar WCAG AAA (`GOLD-605`, `DEB-V42-01` a `DEB-V42-08`):** Unificación de `localStorage` sobre `SMAT_WORKBENCH_STATE_KEY` (`'smat_workbench_state_v2'`) + `mergeWorkbenchLensState()`, evaluación ergonómica de 3 niveles `formatNioshErgonomicStatus()` ($\text{RWL}_{\text{shaft}} = 11.1\text{ kg}$ a $H=42\text{ cm}$), soporte de `ceramica_sic` ($K_{Ic}=4.1\text{ MPa}\sqrt{\text{m}}$) en `/acuse/` y `/en/thank-you/`, paridad SSG total en `/catalogo/` y `/en/catalog/` (9 series, 4 aleaciones, 6 fichas atómicas y 3 instrumentos Lab), propagación reactiva `syncAllAssemblyLinks()` en `PumpAssemblyReport.astro` (14 enlaces BOM + 5 estaciones), consolidación 3-Tab XOR (`kits`, `systems`, `atomic`) en `/bombeo/` y `/en/pumping/`, y migración de `CaseCards.astro`, `nosotros.astro` y `en/about.astro` a Polaridad Solar WCAG AAA (`#F8FAFC` / `#FFFFFF`, contraste $\ge 9.6:1$).
- **v4.3 / MVP v3.0 (actual):** Cierre Integral de las 10 Decisiones Cero-Huérfanos (`D1 = 1-C++++` a `D10 = 10-C++++`, 29 Gates en `smat-gate`, 261 tests en Node.js y 92 páginas estáticas en `dist/`):
  1. **Catálogo SSOT de 19 SKUs en Caja Rápida (`data/quick_checkout_Catalog.json`, `38` páginas SSG `/productos/[slug]/` + `/en/products/[slug]/`) y 13 Piezas Atómicas (`data/atomic_parts.json`, `26` fichas `/catalogo/[code]/` + `/en/catalog/[code]/` incluyendo camisa `D075C21`, `D1`, `D6`):** Clausura relacional bidireccional entre los 19 SKUs Tier-1 y las 13 piezas atómicas con enlace directo a la Bandeja de Requisición B2B.
  2. **15 Esquemas CAD Vectoriales con Capa Pre-Atentiva de Rayos X (`data-layer="xray-wear"`) y Escala Cotidiana ISO/IEC 7810 (`0.76 mm`, `D2`, `D4`):** Conmutador interactivo de desgaste en `TechnicalDiagrams.astro` y `PumpAssemblyReport.astro`, junto con código de ordenamiento determinista `FNV-1a` (`computeSelectionOrderCodeHash`, `SMAT-XXXX-YYYY`).
  3. **Bandeja de Requisición Multi-Ítem (`requisitionTrayBus.js` + `RequisitionTraySummary.astro`), Regla $c\mu$, Pasaporte de Proveedor SAT CFDI 4.0 (`.vcf` + `.json`) y Reorden $(s, S)$ (`D3`, `D5`):** Factorización modular por costura limpia (`QuoteWizard.astro < 900 LOC`), tira pre-triada `[SMAT-DGO]` en WhatsApp, enlace idempotente `?reorder=1&tray=...` y evidencia física verificable (`ASTM A532 Cr27 >= 58 HRC`, Incoterms `EXW/DAP Durango`) en `/acuse/` y `/en/thank-you/`.
  4. **Nueva Vertical `/clasificacion/` y `/en/classification/` (Báscula Virtual de 3 Vasos Marcy + Corte $d_{50c}$ de Plitt + Alerta de Acordonamiento *Roping*), Matriz *Drop-In* en `/flotacion/` y Verificador Estructural Timoshenko NOM-141 en `/filtracion/` (`D7`, `D8`):** Integración completa de `calculateThreeCupMarcyCycloneBalance` y `evaluateFilterPressPlateDeflection` en `slurryEngine.js` y sincronización de `state.metrology.cycloneCircuit` con `/control-de-procesos/`.
  5. **Gobernanza Determinista (`Gates 28 y 29` en `crates/smat-gate/src/lib.rs`, `tests/mvp_v3_decisions.test.mjs`, `ortho.toml` y `package.json`, `D9`, `D10`):** Orden topológico `preflight` (`astro check && npm test && astro build && npm run gate`) y eliminación total de residuos (`clean_debris.ps1`).
- **v3.7 (`GOLD-703` / `ARB-SMAT-45` / `Gate 40`):** Biyección Runtime 4-Circuitos (`getAtomicPartSpecs` con ramas de Flotación, Filtración y Laboratorio), preservación PutGet de rol de kit (`kit_wet_end`, `skid_bomba`), quinta opción de material `hybrid_a05_r55` (Rama D Híbrida Finnie-Hutchings), normalización POSIX a minúsculas `/catalogo/d075c21/` + reglas `301`, deduplicación del 50% de nodos SVG en `ProductQuickCard.astro`, botón `[ + Agregar Par Casado Sincronizado ]` y chips interactivos en `productos/[slug].astro`, extracción $\text{LCOM}_4 = 1$ de `wizardMiningAndCodeDecoder.js` y `wizardUrlAndPresetRouter.js`, `316` tests en Node.js, `32` tests en `smat-gate` y `SIRA = 100%` en `faro.exe verify smat`.
- **v4.1 (`GOLD-715` / `ARB-SMAT-49` / `Gate 44`):** Desacople Físico y Visibilidad XOR Viva de las 3 Calculadoras Físicas del Paso 01 en `/cotizar/` y `/en/quote/` (`#circuit-panel-clasificacion`, `#wb-flot-gorain-live-box`, `#wb-filt-timoshenko-live-box`), Lente Polimórfica PutGet por Circuito (`mergeWorkbenchLensState`), Core Trade-In de 3 Niveles (`-22%`, `-12%`, `0%` en `DAM005`), instancia única de `<RequisitionTraySummary />` sin IDs duplicados (`#metric-delta-npsh`) y proyección reactiva de >90 propiedades en `wizardLivePhysicsProjector.js` (`LCOM4 = 1`).
- **v4.2 (`GOLD-716` / `ARB-SMAT-50` / `Gate 45`):** Unificación de Calculadoras Verticales mediante el Puente Canónico `verticalCalculatorsAndLabelsBridge.js` (`LCOM4 = 1`, `bindCanonicalFiltrationCalculator`, `bindCanonicalFlotationCalculator`, `bindCoupledClassificationStation` con acople visual y funcional 3 Vasos Marcy + Criba Weibull `#cyc-screen-coupling-badge`), eliminación física de la `<section>` duplicada de Modos 05 y 06 en `/diagnostico/` y `/en/diagnostics/`, traducción biyectiva del 100% de llaves `snake_case` (`poliuretano_minero`, `alto_cromo_cr27`, `drive_end..axial_calibration` y los 16 `sku.diagram_id`), erradicación de `ROLES.JSON`, `(roles.json)`, ``(`control_procesos`)``, `buildSmatVendorPassportPayload`, `(Statechart XOR)`, `• D7` y `• D8` en los `286` archivos `dist/**/*.html`, clausura del 100% de los campos de retorno en los 26 motores (`0` llaves huérfanas), `346` tests en Node.js (`19` suites) y `37` compuertas deterministas en `smat-gate` (`SIRA = 100%`).
- **v4.3 (`GOLD-717` / `ARB-SMAT-51` / `Gate 46`):** Contrato Tipado Unificado DOM $\leftrightarrow$ Física $\leftrightarrow$ Slots de Salida (`0` IDs fantasma `#wb-role-clasificacion`, `#wb-clas-dc-mm`, `#wb-clas-liner`, `#wb-throatbush-clearance`, `#smat-qtray-toggle-btn`), sensibilidad diferencial no nula ($\frac{\partial y}{\partial x} \neq 0$) en Pierre Gy (`liberationFactorBeta`, `mineralogicalFactorM`), ASTM E11 Rosin-Rammler (`estimatedMassRetainedGrams`, pendiente adaptativa $n(d_{95})$) y Darcy-Ruth (`moistureFactor` y alerta explícita `NOM-141` cuando la humedad supera `16.0%`), módulo canónico `pumpingSealAndTribologyCalculators.js` (`LCOM4 = 1`, `evaluateCentrifugalSealPressureBalance`, `bindCanonicalSealBalanceCalculator`, `bindCanonicalTribologySelector`) conectado en `/bombeo/sello/`, `/bombeo/impulsor/` y `/bombeo/revestimientos/`, calculadoras interactivas en `/filtracion/prensa/` y `/flotacion/mecanismos/`, exposición de la 5ª tarjeta `Rama D Híbrida: Impulsor A05 + Forros R55` (`1. Lotes por Material (5)`) en `/bombeo/` y `/en/pumping/`, `20` suites de pruebas en Node.js y `38` compuertas deterministas en `smat-gate` (`SIRA = 100%`).
- **v4.4 (`GOLD-718` / `ARB-SMAT-52` / `Gate 47`):** Pureza Escalar ISO 80000-1 en `verticalCalculatorsAndLabelsBridge.js` (`0` paréntesis o separadores inyectados en `#rep-stress-out`, `#rep-fs-out`, `#celdas-sb-output`, `#celdas-vtip-output`), modo `media-only` en `ProductQuickCard.astro` dentro de `/productos/[slug]/` y `/en/products/[slug]/` con selector reactivo `.smat-slug-mat-chip` (`0` duplicación lado a lado), Tercera Forma Normal Visual (`3NF`: $\text{Keys}(\text{Cards}) \cap \text{Keys}(\text{Table}) = \emptyset$) en `/catalogo/[code]/` y `/en/catalog/[code]/`, co-localización contigua `#cyc-coupled-screen-station` (`#csr-*`) junto al Balance de 3 Vasos Marcy en `/clasificacion/` y `/en/classification/` con purga del `<script>` aislado en `CycloneAndScreenReport.astro`, extracción modular $\text{LCOM}_4 = 1$ de `wizardCircuitXorStatechart.js` (`CIRCUIT_XOR_VIEW_SPEC`, `getCircuitXorViewProjection`, `applyCircuitStatechartXOR`, `renderWetEndMaterialMatrixCard`) gobernando `#wb-symptom-context-details`, `#wb-drive-and-tradein-contextual-card`, `#wb-engineering-config-summary-text` y `#wb-step2-durand-controls-wrap` en `/cotizar/`, `354` tests en Node.js (`21` suites), `40` tests unitarios en Rust y `45/45` compuertas deterministas en `smat-gate` (`SIRA = 100%`).
- **v4.5 (`GOLD-721` / `ARB-SMAT-53` / `Gate 48`):** Bus Isomórfico Glitch-Free `verticalStateAndCtaSyncBridge.js` (`commitVerticalSimulation`, `syncVerticalCtaLinks`, `loadUnifiedEngineeringAndWorkbenchState`) sincronizando `smat_engineering_context_v1` y `smat_workbench_state_v2` sin pérdida (`saveEngineeringContextSnapshot` hace merge sobre `loadEngineeringContextSnapshot()`), hidratación JRP $(s,S)$ dinámica por partida en `/acuse/` (`acuseSheetController.js`), calculadora Gorain $S_b$ + Zwietering $N_{js}$ en `/flotacion/`, componente SSOT `<CatalogAvenuesMatrix />` (7 Avenidas / 19 SKUs + 5ª rama `hybrid_a05_r55`) en `/catalogo/`, botones de descarga del Pasaporte B2B (`.vcf` / `.json`) en `SharePurchasing.astro` y `/acuse/`, sufijo monotónico SSR `uid` en los 13 `<pattern>` de `TechnicalDiagrams.astro` (`INV-ERG-23 = 0` duplicados), pliegue above-the-fold (`INV-ERG-11/12`), ley de Fitts $\ge 48 \times 48\text{ px}$ y contraste solar WCAG AAA $\ge 7.2:1$ sin interpolación gris en `.diag-pill` (`ergos.exe tour` `5/5` Conforme en `tepehuana` y `ingeniero_apple_mac`).
- **v4.6 (`GOLD-721` / `ARB-SMAT-54` / `Gate 48G`):** Clausura Residual 100% de Persistencia en `/bombeo/soporte/` y `/en/pumping/bearing-assembly/` vía `commitVerticalSimulation('bombeo', ...)`, Lente `Pinned-Key Alignment` (`data-card-fixed-params="material"|"seal_branch"` y `codigo=`) en `syncVerticalCtaLinks`, paridad 5/5 materiales SSOT (`hybrid_a05_r55`) en `/bombeo/{impulsor,revestimientos}/` y `/en/pumping/{impeller,liners}/`, canonicalización de las 9/9 filas de series con `circuito=bombeo` en `/catalogo/` y `/en/catalog/`, botón directo `+ Bandeja` (`[data-add-tray-sku]`, `bindAtomicPartTrayButtons`) en `#fichas-atomicas` y sub-rutas de bombeo, proyección `Def-Use` de `PUMP_554_ASSEMBLY_STATIONS` en `PumpAssemblyReport.astro` (`945 LOC < 950 LOC`) con extracción modular $\text{LCOM}_4 = 1$ ($\partial(C) = 0$) de `pumpAssemblyReportController.js`, pureza escalar ISO 80000-1 desde el HTML SSR en `#seal-pbox-out` y `#trib-kic-out` (`0` paréntesis), `366` tests en Node.js (`22` suites), `41` tests unitarios en Rust y `46/46` compuertas deterministas en `smat-gate` (`SIRA = 100%`).
- **v4.7 (`GOLD-721` / `ARB-SMAT-55` / `Gate 48H`):** Par Focal Ortogonal (`1 Primario + 1 Secundario`) en `.hero-actions` de `/` y `/en/` (`3.3b`, eliminando los 2 botones redundantes de `/bombeo/#pump-assembly-report` y `/clasificacion/`), partición cociente $\mathcal{C}_{19} / \sim_{\text{avenue}}$ en las 7 Avenidas SSOT (`[data-home-avenue-group]`, `AV-01`..`AV-07`) dentro de `#home-quick-catalog-drawer` (`3.4b-1`) con ocultamiento automático de grupos vacíos mediante el módulo compartido $\text{LCOM}_4 = 1$ ($\partial(C) = 0$) `homeAndEquipmentCatalogFilter.js`, proyección SSOT de los 19 SKUs canónicos con buscador léxico instantáneo `#equipos-sku-search` (`min-height: 48px`) y botón directo `+ Bandeja` (`[data-add-tray-sku]`) en `/equipos/` y `/en/process-equipment/` (`3.4b-2`), `369` tests en Node.js (`22` suites), `41` tests unitarios en Rust y `46/46` compuertas deterministas en `smat-gate` (`SIRA = 100%`).
- **v5.0 (`GOLD-740` / `ARB-SMAT-58` / `Gate 51`):** Arquitectura de **11 Islas Canónicas Únicas** ES/EN con **18 pares** de rutas wrapper delgadas (`<= 35 LOC` en páginas estáticas), partición estática **Two-Sort `EngineSchema <-> DOM`** (`engineSchemaRegistry.js`, 11 dominios, 0 `innerHTML`/eval), núcleo DAG XDSM puro (`wizardXdsmDagSolver.js` sin acceso al DOM + adelgazamiento modular `quoteWizardController.js` a `394 LOC` y `TechnicalDiagrams.astro` a `100 LOC`), purga física de `QuickPartSelectorStrip.astro` y `#home-quick-catalog-drawer` (`dist/index.html = 59,379 bytes < 90 KB`), eliminación de IDs duplicados y empuje móvil en `/clasificacion/`, consolidación a **6 suites** no-vacuas (`45/45` tests JS sin omisiones), **`Gate 51`** en `smat-gate` (`49/49` compuertas en `--check` y `45/45` unit tests en Rust), paridad `ortho` (`budget-guard` y `surface-guard --strict` con `0` violaciones), `faro` `SIRA = 100%` y gira headless CDP `ergos` `27/27 ✅ Conforme` (`0` hallazgos críticos) tanto en `tepehuana` como en `ingeniero_apple_mac`.
- **v5.3 (Ola C1+C2 — `GOLD-745` / `ARB-SMAT-61` / `Gate 53`):** Clausura integral **Ola C1 + C2**: landmark único `<main>` en el 100% de páginas compiladas (incluyendo `AcuseSheetIsland.astro` y rutas legales/producto), diccionario humano `i18nDomainLabels.js` sin tokens crudos ni `CAPEX`/`OPEX`, bandeja unificada en `<dialog id="smat-qtray-drawer">` con tecla `Escape` y blancos táctiles Fitts `>= 48px`, apertura contextual de parámetros Tier 2 en `PumpingHydraulicsCore.astro`, badge offline reactivo `#smat-offline-status` (`hidden` en reposo), cola local idempotente con jitter acotado (`#wb-submit-outbox-btn` en Paso 3 de `QuoteWizard.astro`), proyección de drivers Sobol $S_1$ en `#live-table-sobol-drivers` con `.mini-dossier-bar` no oclusiva (`position: static`), erradicación de los `12` exports JS muertos fuera de la allowlist de `11` contratos de test, **`Gate 53`** (`53/53` compuertas Rust en `--check`, `47` unit tests Rust, `7` suites Node.js sin fallos) y tour headless CDP `ergos` `27/27 ✅ Conforme`.
- **v5.3.1 (Ola C3 / `ARB-SMAT-62` / `Gate 53`):** Cierre completo **APL-01..04**: checkboxes Fitts (`20x20 px` dentro de `<label>` `>= 48px`), fuente única `SMAT_SUPPLY_DOORS` en Portada/Navbar/Footer/Islas verticales (`Equipos`, `Bombas`, `Control`), barra de navegación de una sola fila con 5 enlaces concisos, erradicación en DOM vivo de `CAJA_CHICA_CFDI40`, `ROPING_CORDON`, `Tray: v3` y `Driver Sobol:`, `#live-date` dinámico sincronizado con folio, revelación progresiva `Cowan <= 8.50` en catálogo y núcleos/islas de control y tribología, y candados anti-regresión en `Gate 53`.
- **v5.5 (`61e7613`):** Arquitectura Task-First para `/cotizar/`, consolidación en 11 compuertas comportamentales (`crates/smat-gate/src/{physics_and_schema,security_and_leaks,seo_and_i18n,ux_and_css_layers}.rs`), purga de debris `/admin`, PWA `smat-pwa-v5.5`, y superficie vertical unificada en Flotación y Filtración.
- **v5.6:** Contratos tipados ejecutables (`tsc --noEmit` + `checkJs` con `0` `@ts-nocheck`), almacén único transaccional `rfqSessionStore.js` (`SmatRfqSessionV3`) con aislamiento dimensional (`metrology.oreSolidsSg` vs `cyclone.feedPulpSgKgL`), división pura de puentes verticales (`flotationFiltrationBridge.js`, `cycloneScreenBridge.js`), cascada CSS 100% encapsulada en `@layer` (`ux_and_css_layers.rs` + `0` fallos de contraste en Ergos), superficie única de bombeo en `/bombeo/` (`#bombeo-station-tabs`), revelación progresiva en `FastLaneBomBar`/`RequisitionTraySummary`, purga de `<button>` dentro de `<summary>`, erradicación de fugas post-render en DOM (`SLICE-V56-18`), `60/60` pruebas Node.js, `11/11` compuertas `smat-gate` y `5/5` unit tests en Rust.
- **v5.7 (`[ARB-SMAT-66]`):** Capa tipada `instrumentViewModels.js` + ciclo de vida honesto `EMPTY → DRAFT → VERIFIED` (sin folios ni correos ficticios en reposo), `<InstrumentShell>` *Input-First* en Metrología/Clasificación/Filtración/Flotación/Bombeo, corrección CFDI `I08`, estación `EST-03`, SKU distinto Placa/Tela vs Corre-Placas, Unicode `s⁻¹`/`min⁻¹`, descompresión Cowan Apple *Master-Detail* en `/catalogo/`, `/cotizar/` y `/equipos/`, CTA único en `/bombeo/*`, blindaje `smat-gate` V5.7 y suite `v57_viewmodel_and_instrument_shell.test.mjs`.
- **v5.8 (actual — `[ARB-SMAT-67]`):** Unificación del Contrato Único Reactivo Backend↔UI (`projectViewModelToDom` con `[data-vm-slot]`, `0` IDs fantasma y guarda `EMPTY` bilingüe ES/EN), Stepper no bloqueante de 3 pasos en `/cotizar/` exponiendo las 52 Unidades Mineras, `#wb-jrp-daily-hours` y exportaciones directas, menú móvil `393 px` con botón explícito `Menú`/`Menu`, `pumpingTabRouter.js` con deep-links `?tab=&sub=&focus=` y 4ª pestaña `Armado 5-5-4` en `/bombeo/`, paridad SSOT (`power_range_es/en`, `assembly_order`, `wet_end_kit_ratio`, `linked_atomic_codes`, `secondary_diagram_id`), suite `tests/v58_reactive_contract_and_empty_state.test.mjs` y endurecimiento `smat-gate`.
