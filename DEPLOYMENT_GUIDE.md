# Guía Canónica de Despliegue ($0/mes) — SMAT Minerals Site v3.1

> **Repositorio:** [`memoestefani/smat-portal`](https://github.com/memoestefani/smat-portal) (rama de producción: `main`)  
> **Dominio:** https://smatminerals.com  
> **Hosting:** Cloudflare Pages (plan Free), sitio 100% estático (`output: 'static'`, Astro 5)  
> **Presupuesto:** $0.00 USD/mes. Sin backend, sin base de datos, sin dependencias de cliente pesadas.  
> **Compuerta de calidad:** `npm run preflight` = `astro check` + `npm test` + `npm run gate` + `astro build`

---

## 1. Matriz de Infraestructura

| Servicio | Costo | Función | Evidencia en el repo |
|---|---|---|---|
| GitHub | $0 | Repositorio y disparador de despliegue | `origin = github.com/memoestefani/smat-portal` |
| Cloudflare Pages | $0 | Hosting estático, CDN, certificados, cabeceras | `@astrojs/cloudflare`, `public/_headers`, `public/_redirects` |
| Sveltia CMS (`/admin`) | $0 | Edición de contenido por marketing sin terminal | `public/admin/config.yml`; excluido en `robots.txt` y `noindex` |
| Service Worker PWA | $0 | Modo desconectado en campamento minero | `public/sw.js` (< 5 KB, caché `smat-pwa-v2.1`) |
| Telemetría | $0 | Google Analytics 4 solo si existe `PUBLIC_GA_ID` | `BaseLayout.astro` (sin ID fijo en código) |

No hay variables de entorno obligatorias. Única opcional: `PUBLIC_GA_ID`.

---

## 2. Invariantes que Bloquean un Despliegue

Un cambio **no se publica** si alguno falla. Las 26 compuertas viven en [`crates/smat-gate`](crates/smat-gate/src/lib.rs) y los 230 tests en [`tests/b2b_functions.test.mjs`](tests/b2b_functions.test.mjs) + [`tests/slurry_engine.test.mjs`](tests/slurry_engine.test.mjs):

1. **Paridad de catálogo:** `data/roles.json` y `data/roles.copy.json` idénticos byte a byte (ambos versionados en Git).
2. **Cero fugas comerciales:** sin `$` seguido de cifras ni `margen:` en `data/`, `public/` o `src/`.
3. **Cero marcas ajenas:** sin `warman`, `denver`, `metso`, `outotec`, ni transportistas (`castores`, `tresguerras`, `potosinos`).
4. **Cero palabras prohibidas:** `taller`, `workshop`.
5. **Cero promesas falsas:** `45 min`, `24/7`, "servicio de emergencia", "2.5x garantizado".
6. **40 rutas alcanzables** (20 ES + 20 EN) desde `Header.astro` + `Footer.astro`.
7. **Simetría bilingüe** ES/EN y 40 redirecciones 301 válidas.
8. **NAP consistente** (Mariano Salas #114, Durango).
9. **Cabeceras de seguridad** (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) y vista imprimible del acuse.
10. **IDs críticos del cotizador** (`rfq`, `live-folio`, `wb-pdf-btn`, `wb-copy-btn`, etc.).

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
# Verificación completa unificada (tipos + 140 tests + 20 compuertas Rust + build estático)
npm run preflight
```

Si deseas ejecutar cada etapa individualmente:

```powershell
npx astro check                               # esperado: 0 errors, 0 warnings
npm test                                      # esperado: 140 pass, 0 fail
npm run gate                                  # esperado: 20/20 PASS
npx astro build                               # genera dist/ (52 páginas estáticas)
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
- `_redirects` → 40 redirecciones 301 de las URLs antiguas de WordPress.

---

## 6. Pruebas de Humo Post-Despliegue

```powershell
# 1. Cabeceras de seguridad
curl.exe -s -I https://smatminerals.com | Select-String "x-frame-options|x-content-type-options"

# 2. Páginas clave devuelven 200
foreach ($p in "/", "/bombeo/", "/bombeo/soporte/", "/flotacion/", "/filtracion/", "/en/", "/en/pumping/") {
  "{0} -> {1}" -f $p, (curl.exe -s -o NUL -w "%{http_code}" "https://smatminerals.com$p")
}
```

Revisión manual en producción (2 minutos):
1. El botón de WhatsApp abre `wa.me/526183670664`.
2. El cotizador (`#rfq`) carga y genera el folio `SMAT-2026-…`.
3. `/admin` no aparece en buscadores (`noindex`).
4. Los 8 diagramas técnicos CAD/blueprint se ven correctamente en móvil y escritorio.

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
- **v4.2 (actual):** Cierre Quirúrgico de Secciones 3.1 y 3.2 (Erradicación de Redundancias, Fricción Móvil `390×844` y Código Muerto — 27 Gates en `smat-gate`):
  1. **Eliminación física de `DualHubView.astro` (`DEB-32-01`) y Consolidación en `CircuitNavigator.astro`:** `CircuitNavigator.astro` absorbe `rolesData` (`decision_criteria`: `required_slurry_vars_es/en`, `metallurgy_rule_es/en`, `risk_avoided_es/en`) y sincronización con `workbenchBus.js`, eliminando la duplicación de las 9 tarjetas en `/equipos/` y `/en/process-equipment/`.
  2. **Consolidación Tabulada en `/bombeo/` y `/en/pumping/` (`#bombeo-catalog-tabs`, `DEB-32-02`):** Eliminación de `.wet-lot-callout` redundante y unificación de las 5 tarjetas por sub-ensamble y las 6 tarjetas atómicas (`D3147`–`E4083` enriquecidas con `weight_kg` NIOSH) en un solo selector tabulado Apple HIG, con `CircuitNavigator` plegado en `<details id="bombeo-circuit-drawer">`.
  3. **Ley Apple HIG *Input First, Readout Second* en `QuoteWizard.astro` (`DEB-32-03`):** Reordenamiento de `#wb-role` y `#wb-pipe-size` por encima de `#wb-atomic-part-card` y eliminación del banner redundante `.circuit-context-banner`.
  4. **Erradicación de 28 Tokens LaTeX Crudos (`$...$`) en `/control-de-procesos/` y `/en/process-control/` (`DEB-32-04`) y Fold Móvil `@media (max-width: 768px)`:** Reemplazo por subíndices HTML nativos (`P<sub>80</sub>`, `S<sub>s</sub>`, `C<sub>w</sub>`, `ρ<sub>p</sub>`, `M<sub>s</sub>`, `d<sub>95</sub>`, `a<sub>L</sub>`), compactación de cabeceras y conversión de `.doors-breadcrumb` y `.diag-filter-chips` en strips horizontales scrollables de 1 fila en móvil.
