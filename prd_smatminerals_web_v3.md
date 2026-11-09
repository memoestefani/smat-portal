---
id: "prd.smat.site.v3"
title: "SMAT Minerals Site — PRD v3.0 (Acople Directo 1:1, Paquetes Casados del Circuito Húmedo, Directivas Don Manuel y Venta Dual B2C/B2B)"
type: "prd"
version: "3.0"
status: "approved-architecture-zero-orphans"
owner: "SMAT"
last_updated: "2026-11-09"
replaces: "prd_smatminerals_web.md v2.3 + PRD_SMAT_SITE_V3_ALINEACION_ESTRATEGICA.md v3.1"
repo: "smat-minerals-site"
domain: "https://www.smatminerals.com/"
summary: "Sitio web B2C y B2B bilingüe (ES/EN) para SMAT Minerals en Durango (90 rutas SSG). Une las 11 Directivas de Don Manuel y el Blindaje Anti-Luis (Cotejo Criptográfico Unidireccional FNV-1a + 3 Cotas Públicas) con el paradigma de Acople Directo (Drop-In 1:1), Paquetes Casados del Circuito Húmedo, Venta Dual B2C/B2B en 3 Escalones con Kit Fiscal SAT CFDI 4.0 y Desbloqueo de las 3 Restricciones Vinculantes de Hausmann-Rodrik-Velasco (Tira Pre-Triada [SMAT-DGO] con prioridad c-mu de Kingman, Pasaporte de Alta de Proveedor y Enlace Perpetuo de Recompra ?reorder=1 con ventana preventiva (s, S)). Cubre las 5 Avenidas y la Sub-avenida 6A, catálogo SSOT de 19 productos en caja rápida (/productos/[slug]/ = 38 páginas SSG derivado de catalog_master.json con clausura biyectiva hacia las 12 fichas /catalogo/[code]/ y 0 JSONs huérfanos), 15 diagramas CAD con Rayos X en TechnicalDiagrams.astro, Barra de Pedido Ortogonal (QuickOrderTray.astro + requisitionTrayBus.js), rescate 301 de 38 rutas de Wayback Machine y compuertas en Rust (Gates 1 a 28 + ortho + nexus + ciencia + research + faro)."
keywords:
  - site-v3
  - don-manuel-11-directives
  - blindaje-anti-luis-fnv1a
  - b2c-b2b-dual-cfdi40
  - wet-circuit-drop-in
  - coupled-pump-cyclone-roping
  - slurry-pumps-554
  - hydrocyclones-d6-d20
  - screens-th48
  - filter-press-16bar
  - marcy-scale-sieves
  - flotation-anti-morita
  - quick-products-ssg-ssot
  - quick-order-tray-orthogonal
  - faro-inventory-sira
  - rust-gate-28
machine_readable: true
---

# PRD — SMAT Minerals Site v3.0
## Acople Directo (*Drop-In 1:1*), Paquetes Casados del Circuito Húmedo, Directivas de Don Manuel y Venta Dual B2C / B2B

> **El sitio es una herramienta de venta ágil tipo B2C (`Menor a 25,000 MXN`) y cotización formal B2B (`Mayor a 25,000 MXN`) desde Durango.**
>
> No es un folleto frío ni un examen de física que frena al cliente, ni tampoco regala ingeniería interna a intermediarios.
> El superintendente de planta, el jefe de mantenimiento, el jefe de laboratorio o el comprador de mina halla su pieza en menos de 30 segundos. Ve el lienzo Tri-Modal contiguo (`Plano CAD ⇄ Foto Real Cero-OEM ⇄ Rayos X 5:5:4 + Tarjeta Plástica 0.76 mm`), verifica su código de almacén sin exponer tablas OEM, elige su lote o equipo y pide por WhatsApp o baja su hoja en PDF con **Kit Fiscal SAT CFDI 4.0** para Contraloría y SAP.

---

# 0. El Problema del Mercado, Arbitraje Epistémico y la Escalera de 3 Escalones

## 0.1 El Hueco del Mercado, las 3 Restricciones Vinculantes ($\lambda_{\max}$) y Arbitraje Epistémico (`ARB-DOM-01` a `ARB-DOM-13` y `ARB-SMAT-01` a `ARB-SMAT-24`)

En México operan de **100 a 125 plantas de mina medianas (`150 a 4,000 tpd`)**. Procesan plata, oro, plomo, zinc y cobre en vía húmeda. Estas minas gastan de **`34.1M a 44.1M USD al año` (`680M a 880M MXN al año`)** en piezas de desgaste y equipos de planta.

Todas sufren cuatro frenos diarios en planta y tres **restricciones vinculantes (*Binding Constraints* de `Hausmann, Rodrik & Velasco 2005`, `ARB-SMAT-22`)** en el cierre comercial:
1. **Abandono de las marcas grandes (`ARB-DOM-01`, `ARB-DOM-02`):** Dan plazos de **16 a 36 semanas** y precios de **2.5x a 4.0x**. Una hora de paro en molino o bomba cuesta de **`5,000 a 25,000 USD`**.
2. **Vendedores locales sueltos (`ARB-DOM-06`, `ARB-DOM-12`, `ARB-SMAT-19`):** Venden piezas sueltas sin cuidar el lazo cerrado de molienda-clasificación (`Plitt 1976`, `Minerals Engineering 2018`). Si cae la presión del ciclón de `12 psi` a `7 psi` por desgaste axial del impulsor ($\delta_{\text{frontal}} > 2.0\text{ mm}$) o el hidrociclón colapsa a régimen de *acordonamiento (roping)* ($C_{v,\text{UF}} > 0.52 \iff C_{w,\text{UF}} > 76\%\text{–}78\%$), el proveedor de la bomba culpa al del ciclón y el del ciclón culpa a la malla.
3. **Bloqueo político — Caso "La Morita" (`ARB-DOM-04`, `ARB-SMAT-21`):** Por *escalada de compromiso* (`Staw 1976`), ningún gerente de planta acepta frente a su corporativo que compró mal un banco de celdas hasta que hay crisis total. Vender tanques soldados en frío exige obra civil, activa bloqueo político interno y quema margen en fletes de aire; en cambio, un **Cartucho Rotor-Estator *Drop-In*** montado sobre el tanque existente en un turno y medido con variables hidrodinámicas aislables ($\text{Amperes } I, u_{\text{rotor}}, J_g \to S_b$, `Holmström 1979`) elimina el riesgo político.
4. **Freno por exceso de teoría y bloqueo de Caja Chica en Contraloría (`ARB-DOM-03`, `ARB-SMAT-20`):** Cuando alguien busca una **Balanza Marcy**, un **Vaso de `1,000 mL`**, un **Tamiz `#200`** o un **Impulsor `6x4`**, pedirle datos de laboratorio antes de ver la foto y el botón de WhatsApp mata la venta rápida; y si el recibo de compra rápida (`Menor a 25,000 MXN`) carece de `ClaveProdServ SAT`, `ClaveUnidad H87` y `UsoCFDI`, Contraloría bloquea el reembolso de tarjeta corporativa (`Karjalainen & Van Raaij 2011`).
5. **Las 3 Restricciones Vinculantes Post-Clic ($\lambda_{\text{Triaje-Durango}}, \lambda_{\text{Alta-Compras}}, \lambda_{\text{Recompra}}$ — `ARB-SMAT-22`, `INV-SMAT-SCI-36`, `INV-SMAT-SCI-37`):** Cuando la web logra que el cliente pida en 30 segundos, el cuello de botella ($\lambda_{\max}$) se desplaza a:
   * **$\lambda_{\text{Triaje-Durango}}$ (Tiempo de despacho $\tau_s$ en Durango — Ecuación de Kingman y Regla $c\mu$):** Si el mensaje de WhatsApp llega sin clasificar, el escritorio de ingeniería en Durango tarda $\tau_s \approx 25\text{ min}$ cruzando existencias, pesos y fletes (`W_q \to \infty`). Por ello, el sitio inyecta al pie de WhatsApp y `/acuse/` la **Tira Determinista Pre-Triada `[SMAT-DGO]` con índice de prioridad $c\mu$ (`P1-PARO-PLANTA`, `P1-CAJA-CHICA-HAY`, `P2-REPOSICION-LOTE`, `P3-PROYECTO-50%-ANTICIPO`), régimen (`n×HAY + m×SE_PIDE`), masa total estimada en kg (corte flete Express $\le 30\text{ kg}$ vs. LTL Tarima $> 30\text{ kg}$ + alerta NIOSH $LI_{\text{shaft}}$), tupla SAT CFDI 4.0 y corredor logístico (`D1 = 1-C++`)**, bajando $\tau_s$ a **`1.5 min`**.
   * **$\lambda_{\text{Alta-Compras}}$ y $\lambda_{\text{Recompra}}$ (Fricción de Alta de Proveedor y Olvido de Re-Pedido a los 90/180 Días):** El sitio imprime en `/acuse/` y en el Dossier A4 el **Pasaporte de Alta de Proveedor SMAT** (hidratado de `data/company.json` + matriz CFDI 4.0), un **Enlace Perpetuo Idempotente de Recompra en 1 Clic (`/cotizar/?reorder=1&tray=SKU1:qty:opt,...`)** y la **Ventana Preventiva de Reorden $(s, S)$ en días (`Arrow, Harris & Marschak 1951`, $T_{\text{reorder}} = \hat{\tau}_{\text{vida}} - L_{\text{entrega}} - z_{0.95}\sigma_L$: ej. *Día 90* para Lote `5:5:4` y *Apex*, *Día 150* para Malla `TH48-30` · `D2 = 2-C++`)**.

## 0.2 La Escalera de Venta en 3 Escalones y Compuerta de Admisión `G1–G5` (Las 5 Avenidas + `6A`)

`smatminerals.com` ordena la oferta en **3 escalones de confianza**, donde todo SKU admitido al catálogo cumple el vector determinista de 5 compuertas `G1–G5` ([`05_PROTOCOLO_ADMISION_CATALOGO_Y_AVENIDAS_TAM.md`](file:///C:/Users/52331/Documents/Proyectos/2_smat/ciencia/05_PROTOCOLO_ADMISION_CATALOGO_Y_AVENIDAS_TAM.md)):
* **`G1` (Intercambiabilidad *Drop-In* 1:1):** Montaje directo sin modificar bases ni tubería.
* **`G2` (Recurrencia OpEx o Llave Metrológica):** Desgaste periódico (`1.5 a 12 meses`) o instrumento que prescribe el reemplazo.
* **`G3` (Margen Bruto $\ge 35\%$):** Cero *commodities* de margen $<20\%$ (bolas de molienda, reactivos genéricos o banda transportadora lisa).
* **`G4` (Cero Obra Civil en Sitio):** Envío desde Durango e instalación mecánica en un turno.
* **`G5` (Blindaje de Flujo de Efectivo):** SKUs `make_to_order` (`🔵 se_fabrica`) exigen `50%` de anticipo confirmado.

Los 3 escalones operan así:
1. **Escalón 1 — Llave de Entrada Ágil (Avenida 5: Lab y Control · `ARB-DOM-10`, `ARB-SMAT-04`, `ARB-SMAT-20`):**
   * **Qué incluye:** **Balanza de Densidad de Pulpa Tipo Marcy (`1000 cm³` + 12 diales `SG 2.2–4.4`)**, **Vaso de Repuesto `1000 mL` (Inox `304` o Acrílico)**, **Tamices ASTM E11 (`#100` a `#635`)**, **Ro-Tap Mecánico**, **Plato de Tentadura**, **Molino de Discos** y **Filtro Prensa Batch (`60–100 psi`)**.
   * **Por qué abre cuentas:** Cuestan menos de `25,000 MXN`. Se pagan por caja chica o tarjeta corporativa sin licitar, respaldados por el **Kit Fiscal SAT CFDI 4.0 (`ClaveProdServ 41111500 / 41104800`, `ClaveUnidad H87`, `UsoCFDI I04 / G03`)**. Además, con esa misma Balanza Marcy la mina mide en 3 puntos cuándo urge cambiar el impulsor de la bomba o el *Apex* del ciclón.
2. **Escalón 2 — El Núcleo del Negocio (`70%` del TAM: Avenidas 1, 2 y 3 · `ARB-DOM-05`, `ARB-DOM-06`, `ARB-DOM-09`, `ARB-DOM-12`, `ARB-SMAT-19`):**
   * **Avenida 1 (Bombas para Lodos):** **Lotes de Contacto Húmedo `5:5:4`** (*5 Impulsores + 5 Cuellos + 4 Volutas* en Alto Cromo `A05 ≥650 HB`, Hule `R55`, Poliuretano `U01` o `SiC`), **Expulsor Centrífugo y Prensaestopa (Sin Sello Mecánico)**, **Bearing Assembly / Housing Completo (`005M`)** y **Bombas para Lodos (`3/2, 4/3, 6/4, 8/6`; rango `1.5x1"` a `14x12"`)**.
   * **Avenida 2 (Hidrociclones):** **Ciclones (`Serie D6, D10, D10B, D15, D20`)** y piezas internas (**Boquillas *Apex* en `SiC` / Uretano, *Vortex Finders*, Conos, Cilindros e Involuta**).
   * **Paquete Casado SMAT (`Bomba + Hidrociclón a 10–12 psi`):** SMAT entrega el Lote `5:5:4` de la bomba casado con los internos del ciclón (`4x3 + D10`, `6x4 + D15`, `8x6 + D20`). Así mantiene la presión (`10–12 psi`), evita la transición *Spray-to-Roping* ($C_{v,\text{UF}} \le 0.52$) y asegura el corte fino ($d_{50c}$) sin pretextos entre marcas.
   * **Avenida 3 (Cribado Fino):** **Mallas Finas (`Serie TH48-30`, ranura `0.15 a 0.50 mm`)** y **Paneles de Poliuretano `1'x1'` (`305x305x30 mm`)** con pin y camisa (*pin-and-sleeve*).
3. **Escalón 3 — Filtros Prensa y Mecanismos de Flotación (`25%` del TAM: Avenidas 4 y 6A · `ARB-DOM-04`, `ARB-DOM-07`, `ARB-DOM-08`, `ARB-DOM-11`, `ARB-SMAT-21`):**
   * **Avenida 4 (Filtros Prensa y Repuestos a `16 bar`):** **Lonas (`800` a `1500 mm`)**, **Placas de PP** (protegidas contra fractura por diferencial $\Delta P_{\text{cámara}} > 3.5\text{ bar}$ por lona cegada), **Corre-Placas (*Plate Shifters*) y Cadenas de Paso Pesado**. *(Los Filtros Prensa completos llevan sello `🔵 se_fabrica` y exigen `50%` de anticipo bajo Compuerta `G5`).*
   * **Avenida 6A (Mecanismos para Celdas de Flotación y Acondicionadores — Protocolo Científico Anti-Morita):** **Árbol Motriz *Drop-In* (`Serie Sub-A / DR 18 SP, 24, 30` para celdas de `50 a 300 ft³`)**, **Flechas `4140`**, **Tubos de aire** y **Rotores/Difusores `#30`**. Se montan directo sobre el tanque actual de la mina en un turno, sin obra civil, y se validan con línea base hidrodinámica aislable ($\text{Amperes } I, u_{\text{rotor}}, J_g \to S_b$).

## 0.3 Las 6 Reglas Inmutables del Sitio (Veto Estructural + Directivas de Don Manuel + `smat-gate`)

Al auditar [`smat/PRD_SMAT_SITE_V3_ALINEACION_ESTRATEGICA.md`](file:///C:/Users/52331/Documents/Proyectos/smat/PRD_SMAT_SITE_V3_ALINEACION_ESTRATEGICA.md), [`smat/inventario/inventario_smat.md`](file:///C:/Users/52331/Documents/Proyectos/smat/inventario/inventario_smat.md) y [`crates/smat-gate/src/lib.rs`](file:///C:/Users/52331/Documents/Proyectos/smat/site/crates/smat-gate/src/lib.rs) con `betsela.faro`, estas 6 reglas son ley en cada archivo de `src/` y `data/`:

1. **Léxico Exacto de Planta de Don Manuel (`Gates 17 y 24`):**
   * Se dice **"Bombas para Lodos"** (no *"Bombeo"* en títulos ni *"en Skid"*).
   * Se dice **"Impulsor"** (nunca *"rodete"*).
   * Se dice **"Cuello"** (nunca *"garganta"* ni *"surcos en garganta"*).
   * Se dice **"Bearing Assembly / Housing"** como unidad armada completa.
   * Se dice **"Expulsor y Prensaestopa (Sin Sello Mecánico)"** por la abrasión del lodo.
   * Se dice **"Mecanismos para Celdas de Flotación y Acondicionadores"** (nunca vender el tanque vacío en frío — **Regla Anti-Morita**).
   * Se dice **"Filtros Prensa"** sin etiquetas `OPEX` ni `CAPEX`.
   * **Nunca usar las palabras `"taller"` o `"workshop"` en `src/` o `data/`** (`Gate 17` frena el build con `\b(taller|workshop)\b`; usar siempre **"Planta"**).
2. **Los 3 Plazos Reales del Oficio (`hay | se_pide | se_fabrica` — Directiva 3 de Don Manuel + `Gates 15 y 20`):**
   * Nunca prometer *"Siempre listas en Durango"*, *"Entrega hoy"*, *"Prueba en banco en Durango"*, *"45 min"* o *"24/7"*.
   * Toda ficha usa los **3 plazos reales de envío desde Durango**:
     1. **`🟢 hay` (`stock_durango`):** *En Almacén Durango · Salida ágil (Lun–Vie 08:30–18:00 CST)*.
     2. **`🟡 se_pide` (`fast_assembly`):** *Pedido o Armado en Durango (Plazo a confirmar)*.
     3. **`🔵 se_fabrica` (`make_to_order`):** *Hecho Bajo Pedido · Pide 50% de Anticipo*.
3. **Blindaje Comercial Anti-"Luis" con Cotejo Unidireccional `FNV-1a` (`Directiva 11` de Don Manuel + `ARB-SMAT-20` + `INV-SMAT-SCI-32`):**
   * La web muestra medidas nominales (`3x2, 4x3, 6x4, 8x6` o `D6–D20`), el **Triplete Geométrico Público de 3 Cotas $(A: D_{\text{ext}}, B: d_{\text{flecha}}, C: \text{Succión}\times\text{Descarga})$** y materiales (`Alto Cromo, Hule, Poliuretano y SiC`), pero **jamás publica letras internas de marco ni planos de fabricación ni tablas de cruces OEM en texto plano** que ayuden a un tercero con conflicto de interés (*"Luis"*). Los SKUs visibles son 100% propios de SMAT (`SMAT-PUMP-6X4-WETKIT`). Para no dejar ciego al superintendente que busca un número de parte de almacén durante una emergencia, `src/scripts/dropInEquivalenceGuard.js` ejecuta un **cotejo criptográfico unidireccional (`fnv1a32("smat_dropin_v3:" + norm(input))`)** contra huellas con sal de 32 bits, confirmando en `< 0.1 ms` la equivalencia *Drop-In 1:1* sin almacenar ni una sola cadena OEM en el código fuente.
4. **Higiene de Marcas de Terceros (`Gate 18` · Decisión `3-C++`):**
   * Cero menciones a `warman|denver|metso|outotec` en `src/` o `data/`, y exclusión determinista en `tools/build_product_images.mjs` de cualquier fotografía cruda de bodega que muestre placas de identificación de terceros.
5. **Regla Anti-Pailería (`ARB-DOM-05`):**
   * Cero acero dulce `A36` suelto (`/paileria/` bloqueado con `410 Gone` / redirección).
6. **Sintaxis Monetaria Anti-Fuga de Precios (`Gate 2` `verify_leak_scanner` · Decisión `2-C++`):**
   * `Gate 2` prohíbe en `src/` y `data/` cualquier patrón `(\$|USD|MXN)\s*\d[\d,\.]*` para impedir fugas de precios unitarios. Por tanto, toda referencia a umbrales de caja chica o licitación en componentes y catálogos debe escribir la cifra **antes** del código ISO y **sin símbolo de pesos/dólar**: **`"Menor a 25,000 MXN"` / `"Mayor a 25,000 MXN"` (`"Under 25,000 MXN"` / `"Over 25,000 MXN"`)**.

---

# 1. Auditoría con `betsela.faro` de `smat/inventario`: ¿Qué Tiene Hoy el Sitio y Cómo se Transforma?

Al correr `faro.exe verify smat` y cruzar [`smat/inventario/inventario_smat.md`](file:///C:/Users/52331/Documents/Proyectos/smat/inventario/inventario_smat.md) con [`crates/smat-gate/src/lib.rs`](file:///C:/Users/52331/Documents/Proyectos/smat/site/crates/smat-gate/src/lib.rs), se demuestra que **el 88% del sitio actual se conserva intacto** y que los hallazgos estructurales de Paso 0 (`FAR-SMAT-01..03`, `RES-SMAT-01..05`, `ERG-SMAT-001`, `EIP-SMAT-01..02`) ya están cerrados con **`SIRA = 100%`**.

## 1.1 Las 7 Capacidades Certificadas y 34 Activos en `smat/inventario/inventario_smat.md` que se Aprovechan al 100% (`REUSE + EXTEND`)

El MVP 3.0 **no reconstruye el sitio desde cero**: aprovecha el **100% de las 7 tarjetas `INV-SMAT-*` y los 34 módulos ya construidos y probados en `smat/site`** (`50` rutas bilingües actuales, `9` catálogos `data/*.json`, `12` componentes `.astro`, `3` motores JS y `27` compuertas en Rust):

| ID en `inventario_smat.md` | Activos Existentes en `smat/site` que ya Funcionan Hoy (`Gates 1–27`) | Cómo los Aprovecha y Extiende el MVP `v3.0` (`REUSE + EXTEND`) |
| :--- | :--- | :--- |
| **`INV-SMAT-GTE-001`** (`smat-gate` + `TrustMatrix`) | [`site/crates/smat-gate/src/lib.rs`](file:///C:/Users/52331/Documents/Proyectos/smat/site/crates/smat-gate/src/lib.rs) (`Gates 1–27`), [`TrustMatrix.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/TrustMatrix.astro), `#gate-lead-status`, `#trust-boundary-alert` en [`LiveEngineeringDossier.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/LiveEngineeringDossier.astro). | **Se aprovechan intactas las 27 compuertas actuales** y `TrustMatrix.astro` en portada; sólo se añade `Gate 28` para certificar las 19 fichas de caja rápida (`38` rutas SSG), el hub `/clasificacion/`, la clausura bipartita con `/catalogo/[code]/` y las 38 redirecciones `301`. |
| **`INV-SMAT-PHY-001`** (Motor Físico `slurryEngine.js`) | [`site/src/scripts/slurryEngine.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/scripts/slurryEngine.js) (`analyzeSlurry`, `calculateMarcyScaleReading`, `calculateGyMinimumSampleMass`, `recommendAstmSieveSeries`, `evaluateFilterPressBatchSizing`, ISO 281 $L_{10mh}$, JKMRC $S_b = 6J_g/d_{32}$, Darcy-Ruth $\alpha(\Delta P)$). | **Se aprovecha el 100% de `slurryEngine.js`** y de `calculateMarcyScaleReading`, extendiéndolo con `computeCirculatingLoadAndRoping` (3 lecturas Marcy $\to \text{CC}\%$, transición *Spray-to-Roping* $I_{\text{roping}} = C_{v,\text{UF}}/0.52$ y partición Weibull en mallas) para `/clasificacion/` y `/control-de-procesos/`. |
| **`INV-SMAT-FSM-001`** (Cotizador, 50 Rutas Actuales y Catálogo Base) | [`QuoteWizard.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/QuoteWizard.astro), [`CircuitNavigator.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/CircuitNavigator.astro), [`CaseCards.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/CaseCards.astro), las 12 fichas atómicas en `/catalogo/[code].astro` (`/en/catalog/[code].astro`), `/bombeo/{index,skid,sellado,soporte}.astro`, `/flotacion/{index,celdas}.astro`, `/filtracion/{index,prensa,repuestos}.astro`, `/control-de-procesos/index.astro` y `/diagnostico.astro`. | **Se conservan las 50 rutas bilingües actuales y las 12 fichas `/catalogo/[code]/`** bajo subtipado conductual Liskov-Wing (`D4 = 4-C++`). En `QuoteWizard.astro` (`< 880 líneas`) se encapsulan los controles avanzados en `<details id="wb-advanced-telemetry">`; y sobre el mismo patrón de `/catalogo/[code].astro` se montan las 2 plantillas dinámicas `/productos/[slug].astro` y `/en/products/[slug].astro` (`38` páginas compiladas). |
| **`INV-SMAT-ASSY-001`** (Despiece 5 Zonas, `QuickPartSelectorStrip`, `TechnicalDiagrams` y V-Belt) | [`PumpAssemblyReport.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/PumpAssemblyReport.astro) (`#bombeo-catalog-tabs`, `[data-clearance-slider]`), [`QuickPartSelectorStrip.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/QuickPartSelectorStrip.astro), [`TechnicalDiagrams.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/TechnicalDiagrams.astro) y [`bombeo/skid.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/bombeo/skid.astro). | **Se aprovechan intactos `PumpAssemblyReport.astro` y `QuickPartSelectorStrip.astro`**, y se amplía [`TechnicalDiagrams.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/TechnicalDiagrams.astro) de 10 a **15 esquemas CAD con capa `data-layer="xray-wear"` y escala ISO 7810 (`0.76 mm`)** (`D6 = 6-C++`) para construir `CycloneAndScreenReport.astro` y el Lienzo Tri-Modal de `ProductQuickCard.astro`. |
| **`INV-SMAT-LENS-001`** (Lente `PutGet`, 9 Catálogos JSON, `SharePurchasing` y `/acuse/`) | [`workbenchBus.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/scripts/workbenchBus.js) (`smat_workbench_state_v2`), [`quoteWizardController.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/scripts/quoteWizardController.js), [`SharePurchasing.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/SharePurchasing.astro), [`acuse.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/acuse.astro) (`/en/thank-you.astro`) y los **9 catálogos `data/*.json` existentes** (`catalog_master.json`, `atomic_parts.json`, `parts_554.json`, `roles.json`, `circuits.json`, `skid_bom.json`, `diagnostics.json`, `case_studies.json`, `belt_drives.json`). | **Se aprovechan los 9 catálogos `data/*.json` existentes como única fuente de verdad (SSOT)** para derivar `quickProductsCatalog.js` (`0` JSONs nuevos), se factoriza la sub-lente en `src/scripts/requisitionTrayBus.js` (`D5 = 5-C++`, re-exportado en `workbenchBus.js` para mantener $\le 35$ funciones/archivo) y se inyectan en WhatsApp y `/acuse/` la **Tira `[SMAT-DGO]` (`D1 = 1-C++`)**, el **Pasaporte de Alta de Proveedor**, el enlace **`?reorder=1&tray=...`** y la **Ventana Preventiva $(s, S)$ en días (`D2 = 2-C++`)**. |
| **`INV-SMAT-CMS-001`** (Sveltia CMS, PWA Offline y Compilador `301`) | [`public/admin/index.html`](file:///C:/Users/52331/Documents/Proyectos/smat/site/public/admin/index.html), [`public/sw.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/public/sw.js), [`tools/clean_debris.ps1`](file:///C:/Users/52331/Documents/Proyectos/smat/site/tools/clean_debris.ps1), [`tools/compile_redirects.ps1`](file:///C:/Users/52331/Documents/Proyectos/smat/site/tools/compile_redirects.ps1), [`tools/generate_brand_assets.mjs`](file:///C:/Users/52331/Documents/Proyectos/smat/site/tools/generate_brand_assets.mjs) y [`site/ortho.toml`](file:///C:/Users/52331/Documents/Proyectos/smat/site/ortho.toml). | **Se aprovecha el pipeline `tools/compile_redirects.ps1` y `data/redirects.csv` existente** para inyectar las 38 rutas históricas de Wayback Machine, se corrigen rutas relativas `import.meta.dirname` en `tools/`, se ordena causalmente `preflight` (`D8 = 8-C++`) y se alinea `site/ortho.toml` a `OrthoManifest` (`D9 = 9-C++`). |
| **`INV-SMAT-SOL-001`** (Sistema Fotométrico Solar WCAG AAA y Print A4) | [`src/styles/tokens.css`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/styles/tokens.css), [`src/styles/global.css`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/styles/global.css), [`src/styles/workbench.css`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/styles/workbench.css) y [`BaseLayout.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/layouts/BaseLayout.astro). | **Se aprovecha el 100% del sistema de tokens solares (`#F8FAFC`, contraste $\ge 7.0:1$, botones $\ge 48\text{ px}$ y `@media print` A4)** para estilizar `ProductQuickCard.astro`, `QuickOrderTray.astro` y `/clasificacion/` sin crear hojas CSS duplicadas. |

## 1.2 Lo que Descubrió `betsela.faro` al Auditar `smat/inventario` (`FAR-SMAT-01` a `FAR-SMAT-03` — CERRADOS EN PASO 0)

Al ejecutar `faro.exe verify smat` y `faro.exe context smat`, el índice SIRA pasó de `32%` a **`100% ISOMORFO`** tras cerrar en **Paso 0 (`D0.1=0.1-C+` a `D0.10=0.10-C+`)** los hallazgos estructurales:

1. **`FAR-SMAT-01` (7 Archivos Reales en Disco inventariados en `inventario_smat.md` — `D0.1 = 0.1-C+`):**
   * `site/public/admin/index.html` (Portal Sveltia CMS)
   * `site/public/sw.js` (Service Worker Offline PWA)
   * `site/src/styles/tokens.css`, `site/src/styles/global.css` y `site/src/styles/workbench.css` (Sistema de Tokens Solares WCAG AAA)
   * `site/tools/clean_debris.ps1` y `site/tools/compile_redirects.ps1` (Herramientas de build y redirecciones `301`)
   * **Certificación en `smat/inventario/inventario_smat.md`:** Quedaron registradas las tarjetas `INV-SMAT-CMS-001` (Sveltia CMS + PWA + Redirects + `site/ortho.toml`), `INV-SMAT-SOL-001` (Sistema Fotométrico Solar CSS) y la Matriz de 34 Ítems y Sub-Sistemas con `affordance = "..."` en las 7 tarjetas `INV-SMAT-*`, elevando el SIRA a **`100%`**.
2. **`FAR-SMAT-02` (`find_project_prd` en [`betsela/faro/src/parity_engine.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/faro/src/parity_engine.rs) + filtro `is_narrative` en [`betsela/faro/src/inventory.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/faro/src/inventory.rs) — `D0.2 = 0.2-C+`):**
   * `find_project_prd` calcula ahora `score_prd_structural_entropy` sobre `{root, site, docs, spec}`, seleccionando automáticamente `site/prd_smatminerals_web_v3.md` y filtrando secciones diagnósticas/meta para certificar **`100% ISOMORFO` (`0` activos huérfanos)**.
3. **`FAR-SMAT-03` y Regla Cero Catálogos Huérfanos (`Gate 3`, `Gate 7`, `D0.8 = 0.8-C+` y `D1 = 1-C++` sobre `data/*.json`):**
   * `smat-gate` exige que [`data/roles.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/roles.json) conserve tanto el arreglo plano `"roles": [...]` (con `title_es`, `title_en`, `subtitle_es`, `subtitle_en` para `Gate 3`) como el arreglo `"verticals": [...]` con sub-arreglos `"capex"` y `"opex"` que contengan `"decision_criteria"` (`Gate 7`).
   * **Prohibición de `data/quick_products.json` huérfano y Clausura Relacional `19 × 12` (`D3 = 3-C++`):** No se crea ningún archivo JSON nuevo en `data/`. Los **19 productos de caja rápida (`38` rutas SSG)** se proyectan biyectivamente mediante [`src/scripts/quickProductsCatalog.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/scripts/quickProductsCatalog.js) directamente desde los catálogos SSOT existentes ([`data/catalog_master.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/catalog_master.json), [`data/atomic_parts.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/atomic_parts.json) y [`data/parts_554.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/parts_554.json)), vinculando cada una de las 12 fichas atómicas (`/catalogo/[code]/`) + la camisa cerámica `D075C21` mediante `linked_atomic_codes` y garantizando `[ORPHAN-DATA-CATALOG] = 0` en `ortho.exe`.

## 1.3 Línea Clara de Transformación Archivo por Archivo (`v2.3/v3.1` ➔ `v3.0 Final`)

| Fase | Tipo | Archivo Exacto | Cambio Quirúrgico Exacto |
| :-: | :-: | :--- | :--- |
| **1** | **NEW** | `src/scripts/quickProductsCatalog.js`, `src/scripts/dropInEquivalenceGuard.js` y `src/scripts/requisitionTrayBus.js` | **Proyección Biyectiva SSOT** de los **19 productos de caja rápida (`38` rutas SSG)** desde `data/{catalog_master,atomic_parts,parts_554}.json` (con vector de admisión `G1–G5`, plazos `hay \| se_pide \| se_fabrica`, `linked_atomic_codes` hacia las 12 fichas `/catalogo/[code]/`, pares casados `paired_bundle_skus`, ventana preventiva de reorden $(s, S)$ y **Kit Fiscal SAT CFDI 4.0**) + **Puente Criptográfico Unidireccional *Anti-Luis* (`fnv1a32` + 3 Cotas Públicas $A, B, C$)** + **Módulo Tensorial `requisitionTrayBus.js`** (`D5 = 5-C++`, re-exportado en `workbenchBus.js`, manteniendo $\le 35$ funciones por archivo). |
| **1** | **NEW** | `tools/build_product_images.mjs` + ajuste `tools/generate_brand_assets.mjs` | Pipeline determinista con `sharp` y rutas relativas `import.meta.dirname` (`D8 = 8-C++`) que procesa y recorta la **Lista Blanca Curada Cero-OEM** de [`2_smat/ideas/PAGINA SMAT MEMO/`](file:///C:/Users/52331/Documents/Proyectos/2_smat/ideas/PAGINA%20SMAT%20MEMO/00_README_ESTRUCTURA.md) hacia `public/images/productos/<slug>.webp` (`640×480 px`, fondo `#F8FAFC`, `< 45 KB`), excluyendo cualquier imagen con placas de marca de terceros. |
| **1** | **ADAPT** | [`data/roles.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/roles.json), [`data/circuits.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/circuits.json), [`data/catalog_master.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/catalog_master.json), [`data/redirects.csv`](file:///C:/Users/52331/Documents/Proyectos/smat/site/data/redirects.csv) y [`package.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/package.json) | Conservar intacta la estructura de `Gate 3` y `Gate 7` (`roles` + `verticals` con `decision_criteria`), enriquecer `catalog_master.json` con metadatos de los 19 productos de caja rápida, sumar la vertical `clasificacion`, agregar las **38 rutas `301` de Wayback Machine** y ordenar causalmente el script `preflight` en `package.json` (`build_product_images -> compile_redirects -> astro check -> astro build -> npm test -> npm run gate`, `D8 = 8-C++`). |
| **2** | **ADAPT** | [`src/scripts/workbenchBus.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/scripts/workbenchBus.js), [`src/scripts/slurryEngine.js`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/scripts/slurryEngine.js) y [`src/components/TechnicalDiagrams.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/TechnicalDiagrams.astro) | En `requisitionTrayBus.js` / `workbenchBus.js`: Lente ortogonal `SMAT_REQUISITION_TRAY_KEY = 'smat_requisition_tray_v1'` ($\mathcal{L}_{\text{kernel},34} \otimes \mathcal{L}_{\text{tray}}$ + sub-lente anidada `state.metrology.cycloneCircuit` sin mutar las 34 llaves raíz de `Gate 26`, `D7 = 7-C++`), **Tira Pre-Triada `[SMAT-DGO]` con prioridad $c\mu$ (`D1 = 1-C++`)**, **Pasaporte de Proveedor + Enlace `?reorder=1&tray=...` + Ventana $(s, S)$ (`D2 = 2-C++`)**. En `slurryEngine.js`: `computeCirculatingLoadAndRoping`. En `TechnicalDiagrams.astro`: **15 esquemas CAD con capa `data-layer="xray-wear"` y escala ISO 7810 (`0.76 mm`) (`D6 = 6-C++`)**. |
| **2** | **NEW** | `src/components/ProductQuickCard.astro` y `src/components/QuickOrderTray.astro` | `ProductQuickCard.astro`: Lienzo **Tri-Modal Contiguo (`640×480 px`, `CLS = 0.000`)** `[ 📐 Plano CAD | 📸 Foto Real Cero-OEM | 🔥 Rayos X 5:5:4 + Tarjeta 0.76 mm ]`, plazo honesto (`hay \| se_pide \| se_fabrica`), cotejo *Anti-Luis* `FNV-1a` y botones `[ 💬 Pedir por WhatsApp ]` + `[ + Sumar a Cotización ]`. `QuickOrderTray.astro`: Barra flotante inferior multi-partida con Kit Fiscal SAT CFDI 4.0 y Tira `[SMAT-DGO]` hacia WhatsApp y `/acuse/`. |
| **2** | **NEW** | `src/pages/productos/[slug].astro` y `src/pages/en/products/[slug].astro` | **2 plantillas dinámicas SSG (`getStaticPaths`)** que compilan las **38 páginas de producto (`19 ES` + `19 EN`)** sumando sólo **2 archivos fuente** al presupuesto `max_files = 140` de `site/ortho.toml`, con Lienzo Tri-Modal, Triplete Geométrico Público $(A, B, C)$, puente biyectivo hacia `/catalogo/[code]/`, guía en 3 pasos de `eipen` y pares casados. |
| **2** | **NEW** | `src/pages/clasificacion/index.astro`, `src/pages/en/classification/index.astro` y `src/components/CycloneAndScreenReport.astro` | Nuevo hub de Hidrociclones (`Serie D6–D20`), Paquete Casado `Bomba + Ciclón (10–12 psi)`, Mallas `TH48-30` y **Báscula Virtual de 3 Vasos Marcy** (`computeCirculatingLoadAndRoping`) con alerta de transición *Spray-to-Roping* ($C_{v,\text{UF}} > 0.52$). |
| **3** | **ADAPT** | [`src/pages/index.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/index.astro), [`src/pages/en/index.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/en/index.astro), [`src/components/Header.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/Header.astro) y [`src/components/Footer.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/Footer.astro) | Mostrar los **4 Nodos del Circuito Húmedo** (respetando los títulos de Don Manuel y `TrustMatrix`), los **8 chips de 1 clic**, las **6 tarjetas `ProductQuickCard.astro`**, el buscador *Drop-In* con cotejo `FNV-1a` y enlazar `/clasificacion/` y `/en/classification/` en navegación (`Gate 16`). |
| **3** | **ADAPT** | [`src/components/QuoteWizard.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/QuoteWizard.astro) y [`src/components/PumpAssemblyReport.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/components/PumpAssemblyReport.astro) | Mantener `< 900 líneas` y `#wb-role` antes de `#wb-atomic-part-card` (`Gates 23, 26, 27`, `CowanScore <= 4.50`), guardando los controles de teoría dentro de `<details id="wb-advanced-telemetry">` y `<details id="bom-clearance-calibrator">`. |
| **3** | **ADAPT** | [`src/pages/flotacion/celdas.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/flotacion/celdas.astro), [`src/pages/filtracion/repuestos.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/filtracion/repuestos.astro) y [`src/pages/control-de-procesos/index.astro`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/control-de-procesos/index.astro) | Alinear `celdas.astro` al **Protocolo Científico *Anti-Morita*** (Cartuchos Rotor-Estator `18 SP, 24, 30` *Drop-In* + 3 métricas aislables $I, u_{\text{rotor}}, J_g \to S_b$), sumar cascada Darcy-Ruth ($\Delta P_{\text{cámara}} > 3.5\text{ bar}$) + `Plate Shifters` en `repuestos.astro` y subir `#balanza-marcy` arriba del pliegue móvil ($y_{\text{top}} \le 430\text{ px}$). |
| **4** | **ADAPT** | [`smat/inventario/inventario_smat.md`](file:///C:/Users/52331/Documents/Proyectos/smat/inventario/inventario_smat.md), [`crates/smat-gate/src/lib.rs`](file:///C:/Users/52331/Documents/Proyectos/smat/site/crates/smat-gate/src/lib.rs) y motores `betsela` (`ciencia`, `research`, `faro`, `ortho`, `ergos`, `eipen`) | Sincronizar `inventario_smat.md` al `100% SIRA`, añadir `Gate 28` en `smat-gate` y cerrar los hallazgos remanentes `CIE-SMAT-04..06` en `betsela/ciencia` y `RES-SMAT-06..07` en `betsela/research`. |

---

# 2. Plano Visual de la Interfaz (`UI/UX Blueprint` con `betsela.ergos`, `betsela.eipen` y Directivas de Don Manuel)

## 2.1 Maqueta Visual de la Portada (`index.astro` — Primer Pliegue `360×740 px` y PC)

```text
+-----------------------------------------------------------------------+
| [🟢 Ingeniería y Almacén en Durango]       [WhatsApp: (618) 367-0664] | <- 32 px
+-----------------------------------------------------------------------+
| [LOGO SMAT] Bombas para Lodos | Ciclones y Mallas | Prensa/Flot | Lab | <- 56 px
+-----------------------------------------------------------------------+
| SMAT MINERALS • INGENIERÍA Y SUMINISTRO DESDE DURANGO                 |
| Bombas para Lodos, Hidrociclones, Mallas de Uretano y Refacciones     | <- Título corto
|                                                                       |
| Selección Directa por Lote, Equipo o Cotejo Drop-In (>= 48 px):       |
| [⚖️ Balanza Marcy + Vaso] [🔥 Lote 5:5:4 Bomba] [🌀 Ciclón D6-D20]    |
| [🔗 Paquete Bomba+Ciclón] [🟨 Malla TH48-30]    [🗜️ Placas y Shifter] |
| [🔍 Cotejar Código de Almacén / Medida (A, B, C) -> Equivalente 1:1 ] |
|                                                                       |
| [ 💬 Solicitar Cotización en 30 s (#0c4a6e, 9.4:1) ] [ 📐 Diagramas ] | <- y <= 460 px
+-----------------------------------------------------------------------+
| VITRINA DE PRODUCTOS Y LOTES DE CONTACTO HÚMEDO (6 Tarjetas en Home)  |
| +-----------------------------------+ +-----------------------------+ |
| | 🟢 Disponible en Durango (hay)    | | 🟢 Disponible Durango (hay) | |
| | [📐 CAD | 📸 Foto | 🔥 Rayos X ]  | | [📐 CAD | 📸 Foto | 🔥 RX ] | |
| |  (Diagrama / Foto Balanza Marcy)  | |  (Foto Vaso 1000 mL Inox)   | |
| | Balanza de Pulpa Tipo Marcy       | | Vaso Repuesto Marcy 1000 mL | |
| | • Lee densidad y % sólidos directo| | • Acero Inox 304 o Acrílico | |
| | • Con vaso 1000 cm³ + 12 diales   | | • Orificios de rebose 1:1   | |
| | Opción: [Vaso Inox 304 ▾] (48 px) | | Opción: [Vaso Inox 304 ▾]   | |
| | [💬 Cotizar por WhatsApp (1 Clic)]| | [💬 Cotizar por WhatsApp]   | |
| | [+ Sumar a Lista de Cotización]   | | [+ Sumar a Cotización]      | |
| +-----------------------------------+ +-----------------------------+ |
+-----------------------------------------------------------------------+
```

## 2.2 Maqueta Visual de `ProductQuickCard.astro` (Lienzo Tri-Modal Contiguo) y la Barra `QuickOrderTray.astro`

Respetando la Directiva 6 de Don Manuel (*"Por la imagen y el diagrama técnico compran; no compran de una por una, sino por lote de lo que está en contacto húmedo"*) y el principio de Contigüidad Espacial en Instrucciones Mecánicas (`Agrawala et al. 2003`, `ARB-SMAT-21`), cada tarjeta y ficha ofrece el **Lienzo Tri-Modal Contiguo (`640×480 px`, `aspect-ratio: 4/3`, `CLS = 0.000`)** **`[ 📐 Plano CAD | 📸 Foto Real Cero-OEM | 🔥 Rayos X Desgaste 5:5:4 ]`** y los dos carriles de pedido:

```text
+-----------------------------------------------------------------------+
| 🟢 DISPONIBLE EN ALMACÉN DURANGO (PLAZO ÁGIL L-V)          SKU: MARCY |
|-----------------------------------------------------------------------|
| Vista (>= 48 px): [ 📐 Plano CAD ] [ 📸 Foto Real ] [ 🔥 Rayos X 5:5:4 ]
|                                                                       |
|              +-----------------------------------------+              |
|              |   LIENZO TRI-MODAL CONTIGUO (CLS = 0)   |              |
|              |   CAD SVG / FOTO .WEBP / RAYOS X 5:5:4  |              |
|              |   + Escala Tarjeta ID 0.76 mm (#F8FAFC) |              |
|              +-----------------------------------------+              |
|                                                                       |
| Balanza de Densidad de Pulpa Tipo Marcy (1000 cm³ + 12 Carátulas)     |
| ✅ Lee densidad (g/L) y % de sólidos al instante sin secar muestra    |
| ✅ Vaso de 1,000 cm³ con tapones de rebose en Inox 304 o Acrílico     |
| ✅ Kit Fiscal SAT CFDI 4.0: ClaveProdServ 41111500 · Unidad H87 · I04 |
|                                                                       |
| Elige Configuración o Lote (Botones >= 48 px):                        |
| (•) Con Vaso Inox 304   ( ) Con Vaso Acrílico   ( ) Kit Doble Vaso    |
|                                                                       |
| [ 💬 Cotizar / Pedir por WhatsApp (1 Clic) ]  <- Fondo #065f46, 10.1:1|
| [ + Sumar a Lista de Cotización (Multi-Lote)] <- Fondo #0c4a6e, 9.4:1 |
+-----------------------------------------------------------------------+

Barra Flotante Inferior (`QuickOrderTray.astro` cuando hay >= 1 partida):
+-----------------------------------------------------------------------+
| 📋 Lista de Requisición SMAT (2 partidas · Con Claves SAT CFDI 4.0)   |
| [ 💬 Enviar Lista por WhatsApp ]  [ 🖨️ Emitir Hoja PDF / Folio SAP ]  |
+-----------------------------------------------------------------------+
```

## 2.3 Guía Práctica de 3 Pasos en Planta (`betsela.eipen` Closure + Metrology, Cero `"taller"`)

Cada ficha `/productos/[slug]/` muestra un recuadro **`📋 Cómo validar tu pieza en planta en 3 pasos`** (cumpliendo `Gate 17` sin usar la palabra `"taller"` y `Gate 2` sin usar signo `\$` antes de dígitos):

1. **Qué tener a la mano (`1. 🧰 Qué tomar`):**
   * Flexómetro, foto de tu pieza actual y, para ajustar el claro frontal del impulsor ($\delta_{\text{frontal}} = 0.75\text{ mm}$) contra el cuello, **una tarjeta plástica de ID estándar ISO/IEC 7810 (`85.60 × 53.98 × 0.76 mm`, error `0.00%` medido con `eipen metrology`)**.
2. **Qué revisar (`2. ⚙️ Qué hacer`):**
   * Confirma el **Triplete Geométrico Público $(A: D_{\text{ext}}, B: d_{\text{flecha}}, C: \text{Succión}\times\text{Descarga})$** (`ej. 3x2, 4x3, 6x4, 8x6` o `D6–D20`) o ingresa tu código de almacén en el verificador unidireccional *Drop-In*, y elige el material requerido para tu pulpa (**Alto Cromo `A05`, Hule `R55`, Poliuretano `U01` o Cerámica `SiC`**).
3. **Cómo pedir (`3. ✅ Cómo cerrar`):**
   * Para pedido ágil de caja chica (`Menor a 25,000 MXN`), toca **`[ 💬 Cotizar / Pedir por WhatsApp ]`**. Para armar un **Lote de Contacto Húmedo (`5 impulsores + 5 cuellos + 4 volutas`)** o paquete multi-partida (`Mayor a 25,000 MXN`), toca **`[ + Sumar a Lista de Cotización ]`** y baja el **Acuse PDF con folio `SMAT-RFQ` y Claves SAT CFDI 4.0 para Contraloría y Compras**.

## 2.4 Cierre de los Hallazgos de `betsela.ergos`, `betsela.eipen` y `betsela.faro`

| Código | Hallazgo Detectado por `ergos` / `eipen` / `faro` | Solución Exacta en `v3.0` |
| :--- | :--- | :--- |
| **`ERG-SMAT-002`** | `#btn-open-drawer` en `QuoteWizard` tiene contraste `6.01:1` (`< 7.0:1` WCAG AAA bajo sol). | Usar fondo azul oscuro `#0c4a6e` con texto blanco `#ffffff` (**contraste `9.42:1 ≥ 7.0:1`**). |
| **`ERG-SMAT-003`** | `a.node-cta.node-cta-rfq` en `/control-de-procesos/` tiene contraste `4.29:1` (`< 7.0:1`). | Usar fondo cobre oscuro `#7c2d12` con texto blanco `#ffffff` (**contraste `9.15:1 ≥ 7.0:1`**). |
| **`ERG-SMAT-005`** | En `/control-de-procesos/` móvil (`393×852 px`), `#balanza-marcy` queda en `top = 658 px > 639 px` (`BELOW_THE_FOLD`). | Reducir el alto del bloque superior de `/control-de-procesos/index.astro` para que `#balanza-marcy` inicie en **`top = 430 px ≤ 639 px`**. |
| **`ERG-SMAT-007`** | Enlaces `<a>` de `20 px` de alto (`< 48 px` Ley de Fitts) y rebote de ruta sin `/` en `ergos tour`. | Dar `min-height: 48px; display: inline-flex; align-items: center;` a los enlaces y resolver rutas con o sin `/` en el servidor de `ergos`. |
| **`ERG-SMAT-001..006`** | `ergos precheck` marca `<link rel="canonical">`, `og:url` y `https://wa.me/...` como fugas de red externa. | En `betsela/ergos/src/prechecks.rs`, ignorar etiquetas SEO pasivas (`canonical`, `alternate`, `og:*`, `twitter:*`) y ligas `<a href="https://wa.me/...">`. |
| **`EIP-SMAT-01..02`** | `eipen metrology -v 19 -u l` da `3800 tapas` en vez de `1 cubeta de 19 L`, y `readability` une rutas con `/` o `-`. | En `metrology_engine.rs`, desempatar eligiendo `discrete_units` más cercano a `1.0`; en `readability_engine.rs`, separar tokens por `['/', '-', '_', '|']`. |
| **`FAR-SMAT-01..03`** | `faro verify smat` da `SIRA = 32%` por 7 archivos sin tarjeta en `inventario_smat.md` y lectura de PRD antiguo en raíz. | Inventariar los 7 archivos + los módulos `v3.0` en `smat/inventario/inventario_smat.md` y actualizar `find_project_prd` en `betsela/faro` para certificar **`SIRA = 100%`**. |

---

# 3. Mapa de las 90 Rutas Bilingües y los 4 Nodos del Circuito Húmedo

El menú superior (`Header.astro`) usa los títulos sobrios de Don Manuel y guía al usuario por el flujo real de la planta:

| Nodo de Planta (Título Don Manuel) | Ruta Español (`ES`) | Ruta Inglés (`EN`) | Avenidas Cubiertas | Oferta Clave (*Drop-In 1:1* + Paquetes Casados + Caja Rápida) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Bombas para Lodos** | `/bombeo/` | `/en/pumping/` | **Avenida 1** (`17.5M–22.0M USD`) | • **Lote de Contacto Húmedo `5:5:4`** (*5 Impulsores + 5 Cuellos + 4 Volutas* en Alto Cromo, Hule, Poliuretano y SiC)<br/>• **Bearing Assembly / Housing Completo (`005M`)**<br/>• **Expulsor Centrífugo y Prensaestopa (Sin Sello Mecánico)** |
| **2. Hidrociclones y Mallas** | `/clasificacion/` | `/en/classification/` | **Avenida 2** (`4.5M–5.8M USD`) + **Avenida 3** (`4.8M–6.2M USD`) | • **Hidrociclones y Boquillas (`Serie D6, D10, D10B, D15, D20`)**: *Apex*, *Vortex Finder*, Conos, Cilindros e Involuta.<br/>• **Paquete Casado `Bomba + Ciclón` (`10–12 psi`)**.<br/>• **Mallas de Uretano (`Serie TH48-30`)** y **Paneles `1'x1'` (`305x305x30 mm`)**. |
| **3. Filtros Prensa y Mecanismos de Flotación** | `/filtracion/` y `/flotacion/` *(con Hub `/equipos/`)* | `/en/filtration/` y `/en/flotation/` | **Avenida 4** (`4.5M–6.0M USD`) + **Avenida 6A** (`2.5M–3.2M USD`) | • **Filtros Prensa:** Lonas (`800` a `1500 mm`), Placas PP (`16 bar`), **Corre-Placas (*Plate Shifters*) y Cadenas**.<br/>• **Mecanismos para Celdas de Flotación y Acondicionadores (`6A`):** **Árbol Motriz (`18 SP, 24, 30`)** y **Rotores/Difusores `#30`** sin obra civil. |
| **4. Control de Procesos y Balanzas** | `/control-de-procesos/` | `/en/process-control/` | **Avenida 5** (`0.8M–1.2M USD`) | • **Balanza de Densidad de Pulpa Tipo Marcy** (`1000 cm³` + 12 diales `SG 2.2–4.4`) y **Vaso `1000 mL`**<br/>• **Tamices ASTM E11** (`#100` a `#635`) y Ro-Tap<br/>• **Plato de Tentadura**, **Molino de Discos** y **Filtro Batch (`100 psi`)** |
| **5. Catálogo y Fichas** | `/catalogo/` y `/productos/[slug]/` | `/en/catalog/` y `/en/products/[slug]/` | Las 6 Avenidas | • **12 fichas base (`/catalogo/[code]/`)**, **19 fichas en caja rápida (`/productos/[slug]/` = `38` páginas SSG con clausura bipartita `linked_atomic_codes`)** y **3 Planos de Despiece**. |
| **6. Solicitar Cotización** | `/cotizar/` (+ `QuickOrderTray`) | `/en/quote/` (+ `QuickOrderTray`) | Venta Dual B2C/B2B | • **B2C (`Menor a 25,000 MXN`):** 1 clic a WhatsApp `618 367 0664` + Kit SAT CFDI 4.0 + Tira Pre-Triada `[SMAT-DGO]` (`D1 = 1-C++`).<br/>• **B2B (`Mayor a 25,000 MXN`):** Lista de Cotización + Acuse PDF `/acuse/` con Pasaporte de Proveedor + Enlace `?reorder=1&tray=...` + Ventana $(s, S)$ (`D2 = 2-C++`). |

---

# 4. Los 3 Planos de Despiece y Acople `1:1`

## 4.1 Plano 1 (En `/bombeo/`): Bomba para Lodos en 5 Zonas y 14 Piezas (`PumpAssemblyReport.astro`)
* **Se conserva completo:** El plano de las **5 Zonas (`EST-01 Bearing Assembly 005M` ➔ `EST-02 Expulsor y Prensaestopa Sin Sello Mecánico` ➔ `EST-03 Lote de Contacto Húmedo 5:5:4` ➔ `EST-04 Cuello de Succión` ➔ `EST-05 Luz Frontal δ = 0.5–1.0 mm`)** y la tabla de 14 piezas con peso NIOSH.
* **Vista limpia (`Decisión 5-C++` y `8-C++`):** Arriba se ve la **Guía de Planta con Tarjeta Plástica ISO/IEC 7810 (`0.76 mm`)**, y el control `#clearance-slider-s5` queda guardado en `<details id="bom-clearance-calibrator">` para no saturar la vista ni romper `Gate 22`.

## 4.2 Plano 2 (En `/clasificacion/` — *NUEVO*): Hidrociclón (`Serie D6–D20`) y Mallas (`CycloneAndScreenReport.astro`)
* **Plano de las 5 Zonas de Desgaste del Ciclón (`ARB-DOM-12`, `ARB-SMAT-19`):**
  * `#01 Cabezal de Entrada Involuta` — Recibe el lodo de la bomba a `10–12 psi`.
  * `#02 Buscador de Vórtice (Vortex Finder)` — Tubo superior de finos hacia flotación en Alto Cromo, Hule o Cerámica `SiC`.
  * `#03 Cuerpo Cilíndrico Medio` — Da estabilidad al giro del lodo.
  * `#04 Cono Superior e Inferior` — Conos en poliuretano (`85–95 Shore A`), hule o cerámica `SiC`.
  * `#05 Boquilla de Gruesos (Apex / Spigot)` — Regula el cono de salida (`40–45°`) para mantener $C_{v,\text{UF}} \le 0.52$ y evitar el cierre en cordón (*roping*).
* **Mallas Finas (`Serie TH48-30`) y Paneles `1'x1'` (`305×305×30 mm`):** Mallas de uretano anti-cegado con ranura de `0.15 a 0.50 mm` y fijación *pin-and-sleeve* gobernadas por la curva de partición de Weibull-Karra (`INV-SMAT-SCI-35`, $\alpha_{\text{uretano}} \ge 4.2$).

## 4.3 Plano 3 (En `/flotacion/celdas/` y `/filtracion/repuestos/`): Mecanismo de Flotación (`6A`) y Filtros Prensa (`16 bar`)
* **En `/flotacion/celdas/` (Directiva 4 de Don Manuel + Protocolo Científico *Anti-Morita* `ARB-DOM-04`, `ARB-SMAT-21`, `INV-SMAT-SCI-34`, `Decisión 7-C++`):**
  * `#01 Cabezal Motriz y Porta-Rodamientos (ISO 281)`
  * `#02 Flecha Central Balanceada en Acero 4140`
  * `#03 Tubo de Aire y Columna Central (Standpipe)`
  * `#04 Rotor Estrella en Hule o Poliuretano`
  * `#05 Difusor / Estator Radial (#18 SP, #24, #30)`
  * **Protocolo de Línea Base Hidrodinámica Aislable (`Staw 1976` + `Holmström 1979`):** En vez de cuestionar la compra histórica del tanque ni depender de la ley cambiante del mineral, el reemplazo *Drop-In* se valida con 3 métricas físicas aislables en un turno:
    1. **Consumo de corriente del motor ($\text{Amperes } I$)** en vacío y con pulpa.
    2. **Velocidad periférica del rotor ($u_{\text{rotor}} = \pi D_r N / 60 \in [6.0, 7.5]\text{ m/s}$)** para mantener el número de flujo de bombeo $N_Q = Q_p / (N D_r^3) \ge 0.18$.
    3. **Velocidad superficial de gas ($J_g \in [1.2, 2.5]\text{ cm/s} \implies S_b = 6 J_g / d_{32} \ge 50\text{ s}^{-1}$)**.
  * *Nota clave:* **"Mecanismos para Celdas de Flotación y Acondicionadores de montaje directo sobre celdas de `50 a 300 ft³`. Sin demoler tanques y sin obra civil."**
* **En `/filtracion/repuestos/` (Directiva 11 de Don Manuel + `ARB-DOM-08`, `ARB-SMAT-21`, `Decisión 6-C++`):**
  * `#01 Lonas Termoselladas (800 a 1500 mm)` — Permeabilidad controlada para evitar el cegado de poro.
  * `#02 Placas de Polipropileno de Cámara y Membrana (16 bar)` — Protegidas contra fractura por presión diferencial entre cámaras ($\Delta P_{\text{cámara}} > 3.5\text{ bar}$ cuando una lona se ciega bajo régimen Darcy-Ruth $\alpha(\Delta P) = \alpha_0 (1 + \Delta P / P_a)^s$).
  * `#03 Mecanismo Corre-Placas Completo (Plate Shifter)`
  * `#04 Cadena de Paso Pesado y Piñones de Tracción`
  * `#05 Bomba de Lodos de Alimentación al Filtro Prensa (16 bar)`
  * **Compuerta CapEx `G5` (`50%` de Anticipo):** Los Filtros Prensa completos llevan sello `🔵 se_fabrica` (`make_to_order`) y exigen confirmación de anticipo del `50%` antes de emitir requisición formal.

---

# 5. El Nuevo Hub de Clasificación (`/clasificacion/`), la Báscula Virtual de 3 Vasos Marcy y la Transición *Spray-to-Roping* (`Decisión 4-C++`)

La vista `/clasificacion/` (y `/en/classification/`) y el laboratorio `/control-de-procesos/` unen la **Balanza Marcy**, la **Bomba para Lodos**, el **Hidrociclón** y la **Malla de Uretano** mediante la función pura `computeCirculatingLoadAndRoping(sgSolid, cwFeed, cwOverflow, cwUnderflow, pressurePsi)` en `slurryEngine.js`:

1. **Tabla de Ciclones (`Serie D6, D10, D10B, D15, D20`):** Flujo (`m³/h`), presión ideal (`10 a 12 psi`) y corte de Plitt ($d_{50c}$ de `45 a 210 µm`):
   $$d_{50c} = \frac{F_{\text{Plitt}} \cdot D_c^{0.46} \cdot D_i^{0.60} \cdot D_o^{1.21} \cdot \exp(0.063\,C_v)}{D_u^{0.71} \cdot h^{0.38} \cdot Q^{0.45} \cdot (S_s - 1)^{0.5}}$$
2. **Báscula Virtual de 3 Vasos Marcy y Criterio Volumétrico *Spray-to-Roping* (`INV-SMAT-SCI-31`, `Minerals Engineering 2018` + `Plitt 1976`):**
   * El operador introduce o arrastra las 3 lecturas de su **Balanza Marcy SMAT** en Alimentación (`#marcy-cup-feed`, $C_{w,\text{F}}$), Finos (`#marcy-cup-of`, $C_{w,\text{OF}}$) y Gruesos (`#marcy-cup-uf`, $C_{w,\text{UF}}$). El motor calcula al instante la **Carga Circulante ($\text{CC}\%$)** y la **Concentración Volumétrica de Descarga ($C_{v,\text{UF}}$)**:
     $$\text{CC}\% = \left(\frac{\frac{1}{C_{w,\text{OF}}} - \frac{1}{C_{w,\text{F}}}}{\frac{1}{C_{w,\text{F}}} - \frac{1}{C_{w,\text{UF}}}}\right) \times 100, \qquad C_{v,\text{UF}} = \frac{C_{w,\text{UF}} / S_s}{\frac{C_{w,\text{UF}}}{S_s} + (1 - C_{w,\text{UF}})}, \qquad I_{\text{roping}} = \frac{C_{v,\text{UF}}}{0.52}$$
   * **Diagnóstico Hidrodinámico Acoplado en 1 Clic:**
     * Si $I_{\text{roping}} > 1.00$ ($C_{v,\text{UF}} > 0.52 \iff C_{w,\text{UF}} > 76\%\text{–}78\%$ para $S_s = 2.7$), alerta **Colapso del Núcleo de Aire (*Acordonamiento / Roping*)** por boquilla *Apex* subdimensionada o sobrecarga de gruesos, enviando arenas sin clasificar a flotación.
     * Si $C_{w,\text{UF}} < 65\%$ ($\text{CC}\% > 380\%$) o cae la presión a $\Delta P < 8\text{ psi}$ por abertura del claro axial del impulsor ($\delta_{\text{frontal}} > 2.0\text{ mm}$), alerta **Cortocircuito Hidráulico Bomba–Ciclón** y prescribe en 1 clic el **Paquete Casado (`4x3 + D10`, `6x4 + D15` o `8x6 + D20`: `Lote 5:5:4 + Kit Apex SiC / Vortex + Malla TH48-30`)**.

---

# 6. Catálogo SSOT de 19 Productos en Caja Rápida (`src/scripts/quickProductsCatalog.js`), Clausura Relacional `19 × 12`, Curación Fotográfica y Rescate `301`

## 6.1 Los 19 Productos con Página Propia (`/productos/[slug]/` y `/en/products/[slug]/` = `38` Páginas SSG) y Biyección `linked_atomic_codes`

Derivados biyectivamente en `src/scripts/quickProductsCatalog.js` desde `data/catalog_master.json`, `data/atomic_parts.json` y `data/parts_554.json` (`0` archivos JSON huérfanos en `data/` y `0` piezas atómicas huérfanas gracias a la clave foránea `linked_atomic_codes` + ventana preventiva $(s, S)$ en días):

| # | `slug_es` | `slug_en` | SKU Interno SMAT | Avenida | Plazo (`hay \| se_pide`) | Clave SAT (`CFDI 4.0`) | Fichas Atómicas `/catalogo/[code]/` (`D3 = 3-C++`) y Esquema CAD (`D6 = 6-C++`) | Par Casado + Reorden $(s, S)$ (`D2 = 2-C++`) |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `balanza-marcy` | `marcy-pulp-density-scale` | `SMAT-LAB-MARCY-1000` | Av. 5 · Lab | `🟢 hay` (`stock_durango`) | `41111500` (`H87 · I04`) | Diagrama `marcy_scale` + capa `xray-wear` | `SMAT-LAB-VASO-1000` (`Calibración 365 d`) |
| **2** | `vaso-balanza-marcy-1000ml` | `marcy-scale-cup-1000ml` | `SMAT-LAB-VASO-1000` | Av. 5 · Lab | `🟢 hay` (`stock_durango`) | `41121800` (`H87 · G03`) | Diagrama `marcy_scale` (Vaso Inox 304 / Acrílico) | `SMAT-LAB-MARCY-1000` (`Reorden 180 d`) |
| **3** | `tamices-certificados-astm-e11` | `astm-e11-certified-test-sieves` | `SMAT-LAB-TAMIZ-E11` | Av. 5 · Lab | `🟢 hay` (`stock_durango`) | `41104800` (`H87 · G03`) | Diagrama `astm_sieves` (`#100` a `#635`) | `SMAT-LAB-ROTAP-MECH` (`Reorden 120 d`) |
| **4** | `tamizador-mecanico-laboratorio` | `mechanical-sieve-shaker` | `SMAT-LAB-ROTAP-MECH` | Av. 5 · Lab | `🟡 se_pide` (`fast_assembly`) | `41104800` (`H87 · I04`) | Diagrama `astm_sieves` (Cinemática Ro-Tap) | `SMAT-LAB-TAMIZ-E11` (`Revisión 365 d`) |
| **5** | `plato-tentadura-metalurgico` | `metallurgical-gold-pan` | `SMAT-LAB-PLATO-TENT` | Av. 5 · Lab | `🟢 hay` (`stock_durango`) | `41104800` (`H87 · G03`) | Diagrama `lab_comminution_pan` + `xray-wear` | `SMAT-LAB-VASO-1000` (`Reorden 180 d`) |
| **6** | `pulverizador-discos-laboratorio` | `laboratory-disc-pulverizer` | `SMAT-LAB-PULV-DISC` | Av. 5 · Lab | `🟡 se_pide` (`fast_assembly`) | `41102900` (`H87 · I04`) | Diagrama `lab_comminution_pan` (Discos Alto Cromo) | `SMAT-LAB-TAMIZ-E11` (`Discos 150 d`) |
| **7** | `filtro-prensa-batch-laboratorio` | `laboratory-batch-pressure-filter` | `SMAT-LAB-FILTRO-BATCH` | Av. 5 · Lab | `🟢 hay` (`stock_durango`) | `41104900` (`H87 · I04`) | Diagrama `batch_filter` (`100 psi`) | `SMAT-LAB-MARCY-1000` (`Sellos 180 d`) |
| **8** | `impulsor-bomba-lodos-serie-ah` | `ah-series-slurry-pump-impeller` | `SMAT-PUMP-IMP-AH` | Av. 1 · Bombas | `🟢 hay` (`stock_durango`) | `40151510` (`H87 · G03`) | [`/catalogo/impulsor-5-alabes/`](file:///C:/Users/52331/Documents/Proyectos/smat/site/src/pages/catalogo/%5Bcode%5D.astro) · `impeller_5vane` | `SMAT-PUMP-WETKIT-554` (`Reorden 90 d`) |
| **9** | `lote-humedo-554-bomba-ah` | `slurry-pump-554-wet-end-lot` | `SMAT-PUMP-WETKIT-554` | Av. 1 · Bombas | `🟢 hay` (`stock_durango`) | `40151725` (`H87 · G03`) | `impulsor-5-alabes`, `cuello-succion`, `voluta-revestimiento` · `wet_kit_554` | `SMAT-COUPLED-PUMP-CYC` (`Reorden 90 d`) |
| **10** | `kit-sellado-seco-expeller-ah` | `expeller-centrifugal-dry-seal-kit` | `SMAT-PUMP-EXPELLER-KIT` | Av. 1 · Bombas | `🟢 hay` (`stock_durango`) | `40151725` (`H87 · G03`) | `expulsor-centrifugo`, `anillo-expulsor`, `camisa-flecha` (`D075C21`), `empaque-prensaestopa` · `expeller_seal` | `SMAT-PUMP-WETKIT-554` (`Reorden 90 d`) |
| **11** | `cartucho-rodamientos-005m` | `bearing-assembly-cartridge-005m` | `SMAT-PUMP-BRG-005M` | Av. 1 · Bombas | `🟢 hay` (`stock_durango`) | `31171500` (`H87 · G03`) | `cartucho-rodamientos`, `flecha-principal`, `sellos-laberinto` · `bearing_cartridge` | `SMAT-PUMP-WETKIT-554` (`Reorden 360 d`) |
| **12** | `lainas-succion-y-platos-ah` | `throatbush-and-frame-plate-liners` | `SMAT-PUMP-LINERS-AH` | Av. 1 · Bombas | `🟢 hay` (`stock_durango`) | `40151725` (`H87 · G03`) | `cuello-succion`, `plato-cubierta`, `plato-marco` · `volute_liner` / `throatbush` | `SMAT-PUMP-IMP-AH` (`Reorden 90 d`) |
| **13** | `hidrociclon-completo-y-boquillas-d6-d20` | `hydrocyclone-assembly-and-spigots-d6-d20` | `SMAT-CYC-D6-D20` | Av. 2 · Ciclón | `🟢 hay` (`stock_durango`) | `20122000` (`H87 · G03`) | Diagrama `cyclone_d6_d20` (5 zonas + *Apex SiC*) | `SMAT-COUPLED-PUMP-CYC` (`Apex 90 d`) |
| **14** | `paquete-casado-bomba-hidrociclon` | `coupled-pump-hydrocyclone-package` | `SMAT-COUPLED-PUMP-CYC` | Av. 1 + 2 · Par | `🟢 hay` (`stock_durango`) | `40151510` (`H87 · G03`) | `impulsor-5-alabes`, `cuello-succion`, `voluta-revestimiento` · `coupled_pump_cyclone` | `SMAT-LAB-MARCY-1000` (`Reorden 90 d`) |
| **15** | `mallas-finas-uretano-th48-30` | `high-frequency-urethane-screens-th48-30` | `SMAT-SCR-TH48-30` | Av. 3 · Mallas | `🟢 hay` (`stock_durango`) | `20122800` (`H87 · G03`) | Diagrama `urethane_screen_th48` (Weibull $\alpha \ge 4.2$) | `SMAT-SCR-MOD-1X1` (`Reorden 150 d`) |
| **16** | `modulos-poliuretano-1x1-pin-camisa` | `modular-polyurethane-screen-panels-1x1` | `SMAT-SCR-MOD-1X1` | Av. 3 · Mallas | `🟢 hay` (`stock_durango`) | `20122800` (`H87 · G03`) | Diagrama `urethane_screen_th48` (`305×305×30 mm`) | `SMAT-SCR-TH48-30` (`Reorden 150 d`) |
| **17** | `lonas-y-placas-filtro-prensa-16bar` | `filter-press-cloths-and-pp-plates-16bar` | `SMAT-FILT-CLOTH-PLATE` | Av. 4 · Prensa | `🟡 se_pide` (`fast_assembly`) | `40161500` (`H87 · G03`) | Diagrama `filter_press` (Darcy-Ruth $\Delta P_{\text{cámara}} > 3.5\text{ bar}$) | `SMAT-FILT-SHIFTER-CHAIN` (`Lonas 90 d`) |
| **18** | `mecanismo-plate-shifter-y-cadenas` | `filter-press-plate-shifter-and-chains` | `SMAT-FILT-SHIFTER-CHAIN` | Av. 4 · Prensa | `🟢 hay` (`stock_durango`) | `40161500` (`H87 · G03`) | Diagrama `filter_plate_shifter` (Piñón y Cadena) | `SMAT-FILT-CLOTH-PLATE` (`Reorden 180 d`) |
| **19** | `mecanismo-suspendido-flotacion-18sp` | `suspended-flotation-mechanism-18sp` | `SMAT-FLOT-MECH-18SP` | Av. 6A · Flot | `🟡 se_pide` (`fast_assembly`) | `20121900` (`H87 · I04`) | Diagrama `flotation_cell` (Árbol Motriz `18 SP / 24 / 30` + Rotor `#30`) | `SMAT-FILT-CLOTH-PLATE` (`Rotor 180 d`) |

## 6.2 Lista Blanca de Curación Fotográfica Cero-OEM (`tools/build_product_images.mjs` · `Decisión 5-C++`)
Para cumplir el `Gate 18` y la Directiva 6 de Don Manuel, `tools/build_product_images.mjs` procesa únicamente activos limpios de [`2_smat/ideas/PAGINA SMAT MEMO/`](file:///C:/Users/52331/Documents/Proyectos/2_smat/ideas/PAGINA%20SMAT%20MEMO/00_README_ESTRUCTURA.md) (`640×480 px`, fondo `#F8FAFC`, `.webp < 45 KB`):
* **Aceptados en Lista Blanca:** `05_Laboratorio_y_Control/` (Balanza Marcy, Vaso `1000 mL`, Tamices ASTM E11, Ro-Tap, Plato de Tentadura, Pulverizador y Filtro Batch), `01_Bombeo_de_Pulpa/Refacciones_Humedas_y_Secas/` (Impulsores Alto Cromo/Hule, Volutas, Cuellos, Expulsores y *Bearing Assembly* `005M` sin placas de terceros), `02_Clasificacion_y_Cribado/` (Hidrociclones `D6–D20`, Boquillas *Apex* y Mallas `TH48-30` / Paneles `1'x1'`) y `03_Flotacion_y_Procesos/` + `04_Filtracion_y_Deshidratado/` (Rotores/Difusores de poliuretano, Placas PP y Lonas).
* **Veto Determinista Cero-OEM:** Queda excluida cualquier toma cruda de bodega en `Bombas_Completas/` que exhiba placas de identificación o fundición con marcas de terceros (`Gate 18`).

## 6.3 Rescate `301` de las 38 Rutas de Wayback Machine (`Decisión 9-C++`)
En `data/redirects.csv` y `public/_redirects` se redirigen con y sin `/` final todas las ligas históricas (`2013–2025`):
* **Balanza Marcy y Vaso:** `/producto/balanza-marcy/` va a `/productos/balanza-marcy/ 301`. `/producto/balanza-marcy-2/` va a `/productos/vaso-balanza-marcy-1000ml/ 301`.
* **Tentadura, Ro-Tap y Tamices:** `/producto/plato-tentadura/` va a `/productos/plato-tentadura-metalurgico/ 301`. `/etiqueta-producto/rotap/` y `/etiqueta-producto/duratap/` van a `/productos/tamizador-mecanico-laboratorio/ 301`. `/etiqueta-producto/tamices/` va a `/productos/tamices-certificados-astm-e11/ 301`.
* **Lab e Hidrociclones:** `/laboratorio/` va a `/control-de-procesos/ 301`. `/categoria-producto/hidrociclon/` y `/clasificar_solidos.php` van a `/clasificacion/ 301`.
* **Mallas y Paneles:** `/categoria-producto/mallas/` va a `/productos/mallas-finas-uretano-th48-30/ 301`. `/etiqueta-producto/modulo-de-poliuretano/` va a `/productos/modulos-poliuretano-1x1-pin-camisa/ 301`.
* **Bombas para Lodos:** `/producto/impulsor-ah/` va a `/productos/impulsor-bomba-lodos-serie-ah/ 301`. `/producto/bearing-assembly-ah/` va a `/productos/cartucho-rodamientos-005m/ 301`. `/producto/expeller-ah/` y `/producto/2119/` van a `/productos/kit-sellado-seco-expeller-ah/ 301`. `/producto/2197/` va a `/productos/lainas-succion-y-platos-ah/ 301`. `/producto/bomba-lodos-ah/` va a `/productos/lote-humedo-554-bomba-ah/ 301`.
* **Flotación y Tienda:** `/equipos-para-la-flotacion-de-minerales/` va a `/productos/mecanismo-suspendido-flotacion-18sp/ 301`. `/shop/`, `/comprar/`, `/quote-list/` y `/carrito/` van a `/catalogo/ 301`.

---

# 7. Compuertas en Rust (`crates/smat-gate` Gate 28 + `faro` + `ortho` + `nexus` + `ciencia` + `research` + `eipen`)

1. **`Gate 28` en [`crates/smat-gate/src/lib.rs`](file:///C:/Users/52331/Documents/Proyectos/smat/site/crates/smat-gate/src/lib.rs) y Orden Causal `preflight` (`D3 = 3-C++`, `D4 = 4-C++`, `D8 = 8-C++`):**
   * El script `preflight` en [`site/package.json`](file:///C:/Users/52331/Documents/Proyectos/smat/site/package.json) ejecuta en orden topológico estricto: `node ./tools/build_product_images.mjs && powershell -ExecutionPolicy Bypass -File ./tools/compile_redirects.ps1 && astro check && astro build && npm test && npm run gate` (`D8 = 8-C++`).
   * Valida las 5 ramas en `roles.json` y `circuits.json` respetando `Gates 3 y 7`.
   * Valida que los **19 ítems** proyectados por `src/scripts/quickProductsCatalog.js` desde `data/catalog_master.json` tengan su foto `.webp < 45 KB`, su vista compilada en `dist/productos/<slug_es>/index.html` y `dist/en/products/<slug_en>/index.html` (`38` páginas SSG), su régimen (`stock_durango | fast_assembly | make_to_order`), su vector de admisión `G1–G5`, su clausura `linked_atomic_codes` hacia las 12 fichas `/catalogo/[code]/` + `D075C21`, su **Kit Fiscal SAT CFDI 4.0**, su **Tira Pre-Triada `[SMAT-DGO]` (`D1 = 1-C++`)**, su **Ventana Preventiva $(s, S)$ en días (`D2 = 2-C++`)** y su Triplete Geométrico Público $(A, B, C)$ sin violar `Gate 2` (cero `\$` antes de dígitos), `Gate 17` (`\b(taller|workshop)\b`) ni `Gate 18` (`warman|denver|metso|outotec`).
   * Valida que `QuoteWizard.astro` se mantenga en `< 880 líneas` (`Gate 23`) y que `wb-ctrl-gy-c`, `wb-ctrl-rr-n` y `wb-ctrl-solve-mode` vivan dentro de `<details id="wb-advanced-telemetry">` (`Gate 27`, `CowanScore <= 4.50`).
   * Valida las 38 reglas `301` de Wayback Machine.
2. **Perfeccionamiento Soberano de `ortho`, `nexus`, `ciencia` y `research` (`D9 = 9-C++` y `D10 = 10-C++`):**
   * **`ortho` (`ORT-SMAT-01..02`, `D9 = 9-C++` y `D10 = 10-C++`):**
     * Alinea [`site/ortho.toml`](file:///C:/Users/52331/Documents/Proyectos/smat/site/ortho.toml) con `OrthoManifest` (`[surface]` + `[budget]` con `max_html_tags = 680`, `max_css_bytes = 45000`, `max_total_bytes = 250000`, `max_files = 140`, `max_loc = 18000`, `max_functions_per_file = 35`) y deserializa los 4 campos de complejidad en `BudgetConfig` ([`budget_guard.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/ortho/crates/ortho-core/src/budget_guard.rs)) y detección Astro (`"astro"`) + `src/scripts/` en [`topology.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/ortho/crates/ortho-core/src/topology.rs).
     * **`ORT-SMAT-01` ([`surgery.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/ortho/crates/ortho-cli/src/commands/surgery.rs)):** En `find_balanced_brace_span`, evita clasificar cadenas JS en comillas simples con espacios precedidas por `:`, `,` o `+` (`{ es: 'Texto en español' }`) como lifetimes de Rust (`is_rust_lifetime` sólo aplica cuando no existe `'` de cierre en la misma línea) y añade estado léxico para literales regex `/.../`, restaurando `ortho outline --depth 2` sobre `quoteWizardController.js` (`L233-L2847` en vez de `L233-L233`).
   * **`nexus` (`NEX-SMAT-01`, `D10 = 10-C++`):** Hasheo de sub-árboles de Merkle por ancla semántica (`path#ARB-ID`) en [`stat_gate.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/nexus/src/stat_gate.rs) y [`main.rs`](file:///C:/Users/52331/Documents/Proyectos/betsela/nexus/src/main.rs) para que agregar nuevos bloques `ARB-SMAT-*` al final de `04_ARBITRAJE_EPISTEMICO.md` no dispare falsos bloqueos `STALE_DECISION` sobre decisiones ya verificadas.
   * **`ciencia` (`CIE-SMAT-07..09`, `D10 = 10-C++`):** Sincroniza el binario standalone `betsela/ciencia/target/release/ciencia.exe` con `betsela/target/release/ciencia.exe`, añade el brazo `"smat"` en `canonical_domain` ([`main.rs:768`](file:///C:/Users/52331/Documents/Proyectos/betsela/ciencia/src/main.rs)), suma `FaroBridge::count_markdown_table_invariants` en `audit_and_repair_project_science_pillars` (`main.rs:3167`) y filtra stopwords de meta-gobernanza en `ui_stopwords` (`main.rs:553`).
   * **`research` (`RES-SMAT-08..09`, `D10 = 10-C++`):** En [`betsela/research/src/main.rs:1700-1725`](file:///C:/Users/52331/Documents/Proyectos/betsela/research/src/main.rs), impide que tablas `ciencia` de 6 columnas (`is_ciencia_year_column(col1_trimmed)`) sobrescriban `cells[0]` (Dogma) cuando `cells[0]` cita un tag `(ARB-SMAT-XX)`, y extrae el ID canónico sin corromper las columnas de Dogma y Verdad Empírica.

---

# 8. Matriz Maestra de las 10 Decisiones Cero-Huérfanos y *Binding Constraints* HRV (`D1 = 1-C++` a `D10 = 10-C++`)

| Decisión | Arbitraje Epistémico e Invariante (`smat/ciencia/`) | `GOLD-*` en `ADOPTED_REGISTRY.md` | Repos de GitHub (`0–50 ⭐` Kernel) | Regla Canónica sin Ambigüedad ni Conceptos Huérfanos en `v3.0` |
| :--- | :--- | :--- | :--- | :--- |
| **`D1 = 1-C++`** Desbloqueo de $\lambda_{\text{Triaje-Durango}}$: Tira Pre-Triada `[SMAT-DGO]` con Prioridad $c\mu$ y Ecuación de Kingman | `ARB-SMAT-22` (`Hausmann, Rodrik & Velasco 2005`, `10.5089/9781498358088.001`; `Buyukkoc, Varaiya & Walrand 1985`, `10.2307/1427064`; `Kingman 1961`), `INV-SMAT-SCI-36` | `GOLD-136`, `GOLD-196`, `GOLD-242`, `GOLD-595`, `GOLD-605` | `nitinsingh34678-ctrl/RESQ-disaster-response-simulator` (`1 ⭐`, Math `40.0`, UCB1 `25.50`), `marko1olo/stomchat` (`5 ⭐`, Math `40.0`), `samueldlacruz/whanda` (`1 ⭐`) | Inyecta al pie de WhatsApp y `/acuse/` el vector `[SMAT-DGO \| PRIORIDAD-cμ (P1-PARO-PLANTA / P1-CAJA-CHICA-HAY / P2-REPOSICION-LOTE / P3-PROYECTO-50%-ANTICIPO) \| RÉGIMEN: n×HAY + m×SE_PIDE \| MASA-EST: kg (Express <=30kg vs LTL >30kg + NIOSH LI_shaft) \| CFDI \| CORREDOR]`, reduciendo $\tau_s$ en Durango de `25 min` a `≤ 1.5 min`. |
| **`D2 = 2-C++`** Desbloqueo de $\lambda_{\text{Alta-Compras}}$ y $\lambda_{\text{Recompra}}$: Pasaporte de Proveedor + Enlace `?reorder=1&tray=...` + Ventana $(s, S)$ | `ARB-SMAT-20`, `ARB-SMAT-22` (`Williamson 1979`, `10.1086/466942`; `Arrow, Harris & Marschak 1951`, `10.2307/1906813`), `INV-SMAT-SCI-33`, `INV-SMAT-SCI-37` | `GOLD-087`, `GOLD-167`, `GOLD-555`, `GOLD-605`, `GOLD-619`, `GOLD-642` | `adityarana1612/Logistics-Warehouse-Inventory-Optimization` (`0 ⭐`, Math `72.7`, UCB1 `27.80`), `Shashwat-Aneja/inventory-restock-predictor` (`2 ⭐`, Math `72.7`, UCB1 `27.41`), `iamhuitron/cfdi-sentinel` (`0 ⭐`, Math `72.7`) | Imprime en `/acuse/` (`/en/thank-you/`) y Dossier A4: (1) **Pasaporte de Alta de Proveedor SMAT** (`data/company.json` + CFDI 4.0); (2) **Enlace Idempotente de Recompra en 1 Clic** (`/cotizar/?reorder=1&tray=SKU1:qty:opt,...`); y (3) **Ventana Preventiva de Reorden $(s, S)$ en días** ($T_{\text{reorder}} = \hat{\tau}_{\text{vida}} - L_{\text{entrega}} - z_{0.95}\sigma_L$, ej. `Día 90` en Lote `5:5:4` y *Apex*). |
| **`D3 = 3-C++`** Clausura Relacional de Codd (`19` Productos = `38` Rutas SSG) + Puente Biyectivo `linked_atomic_codes` con `/catalogo/[code]/` | `ARB-SMAT-18`, `ARB-SMAT-21`, `ARB-SMAT-23` (`Codd 1970`, `10.1145/362384.362685`; `Ulrich 1995`; `Song & Zipkin 1996`), `INV-SMAT-SCI-38` | `GOLD-128`, `GOLD-188`, `GOLD-546`, `GOLD-603`, `GOLD-605`, `GOLD-640` | `cccp-education/workspace-bom` (`0 ⭐`, Math `81.7`, UCB1 `18.57`), `8126Lucas/pizza-BOM` (`0 ⭐`, Math `81.7`), `flamrdevs/astrobuckt` (`4 ⭐`) | Formaliza en la tabla de la Sección 6.1 los **19 productos canónicos (`19 ES` + `19 EN` = `38` rutas SSG)** incluyendo explícitamente `#19 SMAT-FLOT-MECH-18SP` y la camisa `D075C21` en `#10`, con clave foránea `linked_atomic_codes` sobreyectiva hacia las 12 fichas `/catalogo/[code]/` (`0` ítems huérfanos). |
| **`D4 = 4-C++`** Subtipado Conductual de Liskov-Wing ($\mathcal{S}_{\text{v3.0}} \preceq \mathcal{S}_{\text{v2.3}}$): Llaves Internas Intactas vs. Léxico VPL en 90 Rutas | `ARB-SMAT-14`, `ARB-SMAT-17`, `ARB-SMAT-24` (`Liskov & Wing 1994`, `10.1145/197320.197383`; `Alur & Madhusudan 2004`), Directivas Don Manuel | `GOLD-188`, `GOLD-200`, `GOLD-605`, `GOLD-634`, `GOLD-643` | `statewalker/statewalker-fsm` (`0 ⭐`, Math `81.7`), `EliahKagan/island-grammar` (`0 ⭐`), `danielroe/fnv1a-64` (`10 ⭐`, Math `40.0`) | Conserva el 100% de las 50 rutas existentes (`/bombeo/skid/`, `data/skid_bom.json`), atributos `data-testid` y las 34 llaves de `buildCanonicalEngineeringSnapshot()`, aplicando el léxico de Don Manuel y cotejo `FNV-1a` (`dropInEquivalenceGuard.js`) sobre el DOM visible de las **90 rutas bilingües**. |
| **`D5 = 5-C++`** *(Opcional)* Factorización Tensorial Parnas-McCabe (`requisitionTrayBus.js`) con Re-Exportación `Facade` | `ARB-SMAT-14`, `ARB-SMAT-20`, `ARB-SMAT-24` (`Parnas 1972`, `10.1145/361598.361623`; `McCabe 1976`, `10.1109/TSE.1976.233837`; `Hitz & Montazeri 1995`), `INV-SMAT-SCI-39` | `GOLD-570`, `GOLD-605`, `GOLD-642`, `GOLD-643` | `potfur/lcom` (`6 ⭐`), `FujiHaruka/eslint-plugin-lcom` (`10 ⭐`), `PeshoVurtoleta/lite-statechart` (`0 ⭐`, UCB1 `77.36`) | Extrae `src/scripts/requisitionTrayBus.js` (re-exportado vía `export * from './requisitionTrayBus.js'` en `workbenchBus.js`), manteniendo todos los módulos JS en `≤ 35` funciones (`max_functions_per_file = 35`) y `QuoteWizard.astro < 880` líneas (`Gate 23`). |
| **`D6 = 6-C++`** Señalización Multimedia de Mayer-Moreno: 15 Esquemas CAD + Capa Rayos X (`data-layer="xray-wear"`) + Tarjeta `0.76 mm` | `ARB-SMAT-05`, `ARB-SMAT-12`, `ARB-SMAT-21`, `ARB-SMAT-23` (`Mayer & Moreno 2003`, `10.1207/S15326985EP3801_6`; `Agrawala et al. 2003`, `10.1145/882262.882352`) | `GOLD-152`, `GOLD-173`, `GOLD-184`, `GOLD-604` | `maiani/vecview` (`0 ⭐`, Math `40.0`), `conao3/rust-document-packet` (`0 ⭐`, Math `72.7`), `kothf/step-viewer` (`1 ⭐`, Math `72.7`) | Amplía `TechnicalDiagrams.astro` de 10 a **15 esquemas CAD** (`+cyclone_d6_d20`, `coupled_pump_cyclone`, `urethane_screen_th48`, `lab_comminution_pan`, `filter_plate_shifter`), cada uno con capa conmutable `data-layer="xray-wear"` y escala ISO/IEC 7810 (`0.76 mm`), garantizando 3 vistas reales en los 19 productos (`CLS = 0.000`). |
| **`D7 = 7-C++`** Composición Asociativa de Lentes ($\mathcal{L}_{\text{metrology}} \circ \mathcal{L}_{\text{cycloneCircuit}}$) para la Báscula de 3 Vasos Marcy | `ARB-SMAT-13`, `ARB-SMAT-19`, `ARB-SMAT-23` (`Foster et al. 2007`, `10.1145/1232420.1232424`; `Plitt 1976`; `Minerals Eng. 2018`), `INV-SMAT-SCI-31`, `INV-SMAT-SCI-35` | `GOLD-007`, `GOLD-186`, `GOLD-605`, `GOLD-634`, `GOLD-639` | `C48H74/hydrocyclone-sizing` (`0 ⭐`, Math `40.0`), `aiswariakrishnan/Aiswaria` (`0 ⭐`, Math `72.7`), `foster-lenses/boomerang` (`GOLD-634`) | Anida el estado diagnóstico de los 3 vasos Marcy (`cwFeed`, `cwOverflow`, `cwUnderflow`, `cyclonePressurePsi`, `circulatingLoadPct`, `ropingIndex`, `prescribedPairSku`) dentro de `state.metrology.cycloneCircuit` y lo adjunta a `smat_requisition_tray_v1` (`&tray=`), preservando la aridad exacta de 34 llaves raíz (`Gate 26`). |
| **`D8 = 8-C++`** Monotonicidad Causal del DAG `preflight` en `package.json` y Rutas Relativas `import.meta.dirname` en `tools/` | `ARB-SMAT-18`, `ARB-SMAT-24` (`Mokhov, Mitchell & Peyton Jones 2018`, `10.1145/3236774`; `Kahn 1962`, `10.1145/368996.369025`) | `GOLD-195`, `GOLD-200`, `GOLD-610` | `copyleftdev/seiche` (`0 ⭐`, Math `40.0`), `reymom/rust-dag-executor` (`11 ⭐`, Math `72.7`), `bluwy/vite-plugin-cloudflare-redirect` (`8 ⭐`) | Reordena `preflight` en `site/package.json` a `build_product_images -> compile_redirects -> astro check -> astro build -> npm test -> npm run gate`, y reemplaza rutas absolutas legacy `2_smat/site` en `tools/generate_brand_assets.mjs` por `path.resolve(import.meta.dirname, '..')`. |
| **`D9 = 9-C++`** Alineación Canónica de `smat/site/ortho.toml` con `OrthoManifest` (`SurfaceConfig` + `BudgetConfig`) | `ARB-SMAT-18`, `ARB-SMAT-24` (`Horwitz, Reps & Binkley 1990`, `10.1145/77606.77608`; `McCabe 1976`), `INV-SMAT-SCI-39` | `GOLD-634`, `GOLD-636`, `GOLD-639`, `GOLD-643` | `kenrollins/cbom-workbench` (`0 ⭐`, Math `72.7`), `Truta446/token-budget-optimizer` (`0 ⭐`, Math `87.7`) | Configura en `site/ortho.toml` las secciones `[surface]` (`topology = "multi-page"`) y `[budget]` (`max_html_tags = 680`, `max_css_bytes = 45000`, `max_total_bytes = 250000`, `banned_tokens`, `max_files = 140`, `max_loc = 18000`, `max_functions_per_file = 35`). |
| **`D10 = 10-C++`** Perfeccionamiento Soberano de `ortho` (`ORT-SMAT-01..02`), `nexus` (`NEX-SMAT-01`), `ciencia` (`CIE-SMAT-07..09`) y `research` (`RES-SMAT-08..09`) | `ARB-SMAT-24` (`Merkle 1987`, `10.1007/3-540-48184-2_32`; `Alur & Madhusudan 2004`, `10.1145/1007352.1007390`), `ARB-ORT-101`, `ARB-NEX-55` | `GOLD-610`, `GOLD-639`, `GOLD-642`, `GOLD-643` | `seleb/lil-lexer` (`0 ⭐`, Math `40.0`), `ephraimpei/balanced-braces` (`0 ⭐`, Math `40.0`), `systemslibrarian/crypto-lab-merkle-proofs` (`0 ⭐`, Math `40.0`) | (1) `ortho`: corrige heurística de comillas simples JS y regex `/.../` en `find_balanced_brace_span` (`surgery.rs`) restaurando `outline --depth 2` en `quoteWizardController.js`, más soporte Astro en `topology.rs` y `BudgetConfig`; (2) `nexus`: hasheo Merkle por ancla `#ARB-ID` en `stat_gate.rs`; (3) `ciencia`: sincronización de binario, brazo `"smat"` y conteo tabular de 39 invariantes; (4) `research`: preservación de `cells[0]` en tablas `ciencia` de 6 columnas con tag `ARB-*`. |

---

# 9. Certificación de Ejecución al 100% de las 10 Decisiones (`D1 = 1-C++++` a `D10 = 10-C++++` · Micro-Slices `SLICE-11` a `SLICE-24`)

1. **`D1 = 1-C++++` (`SLICE-15`, `SLICE-19A`, `SLICE-19B`):** `data/quick_checkout_Catalog.json` formaliza los **19 SKUs Tier-1** con `linked_atomic_codes` sobreyectivos hacia las **13 piezas atómicas** de `data/atomic_parts.json` (incluyendo la camisa `D075C21`, `#13`), proyectando las **38 páginas SSG** (`/productos/[slug]/` y `/en/products/[slug]/`) y las **26 páginas atómicas** (`/catalogo/[code]/` y `/en/catalog/[code]/`) con clausura relacional bidireccional.
2. **`D2 = 2-C++++` (`SLICE-18`, `SLICE-19A`):** `TechnicalDiagrams.astro` expone los **15 esquemas CAD vectoriales** con capa interactiva `data-layer="xray-wear"` y escala dimensional ISO/IEC 7810 (`data-iso7810-scale="0.76mm"`), integrados en `PumpAssemblyReport.astro` (`[data-toggle-xray]`) y en el Lienzo Tri-Modal Contiguo de las 38 fichas de producto.
3. **`D3 = 3-C++++` (`SLICE-17`, `SLICE-22A`, `SLICE-22B`):** `src/scripts/requisitionTrayBus.js` implementa el bus transaccional con tira pre-triada `[SMAT-DGO]` ordenada por prioridad $c\mu$ (`P1-PARO-PLANTA | P1-CAJA-CHICA-HAY | P2-REPOSICION-LOTE | P3-PROYECTO-50%-ANTICIPO`), enlace idempotente `?reorder=1&tray=...`, ventana preventiva $(s, S)$ en días y **Pasaporte de Alta de Proveedor SAT CFDI 4.0** en `/acuse/` y `/en/thank-you/`.
4. **`D4 = 4-C++++` (`SLICE-16`, `SLICE-18`, `SLICE-19B`):** `computeSelectionOrderCodeHash` en `slurryEngine.js` calcula el código de ordenamiento `SMAT-{SIZE}-{FRAME}-{MAT}-{SEAL}-FNV{HEX8}` sin marcas de terceros (`Gate 18`), expuesto en `PumpAssemblyReport.astro` y en las 26 fichas `/catalogo/[code]/`.
5. **`D5 = 5-C++++` (`SLICE-17`, `SLICE-22B`, `SLICE-24`):** Reconciliación completa de promesas subjetivas de velocidad por **Evidencia Física y Contractual Verificable** (metalurgia ASTM A532 Clase III Tipo A Cr27 $\ge 58\text{ HRC}$, Incoterms 2020 EXW/DAP Durango, régimen `hay | se_pide | se_fabrica` y kit fiscal SAT CFDI 4.0).
6. **`D6 = 6-C++++` (`SLICE-17`, `SLICE-22A`):** Factorización Parnas-McCabe de `src/scripts/requisitionTrayBus.js` re-exportado vía `Facade` en `workbenchBus.js`, preservando las 34 llaves raíz de `buildCanonicalEngineeringSnapshot()` (`Gate 26`) y manteniendo `QuoteWizard.astro` bajo el límite estricto de `Gate 23` con `RequisitionTraySummary.astro`.
7. **`D7 = 7-C++++` (`SLICE-16`, `SLICE-20A`, `SLICE-20B`):** `calculateThreeCupMarcyCycloneBalance` en `slurryEngine.js` gobierna la **Báscula Virtual de 3 Vasos Marcy** (`#three-cup-marcy-simulator`) en `/clasificacion/`, `/en/classification/`, `/control-de-procesos/` y `/en/process-control/`, sincronizando `state.metrology.cycloneCircuit` y prescribiendo el paquete casado `Bomba + Hidrociclón` cuando $C_{v,\text{UF}} > 0.52$ (*roping*) o $\Delta P < 8\text{ psi}$.
8. **`D8 = 8-C++++` (`SLICE-16`, `SLICE-21A`, `SLICE-21B`):** Matriz de reemplazo mecánico *Drop-In* (`18 SP, 24, 30, 48`) con protocolo de línea base aislable ($I, u_{\text{rotor}}, J_g \to S_b$) en `/flotacion/` y `/en/flotation/`, y verificador estructural de placas de polipropileno por Timoshenko (`evaluateFilterPressPlateDeflection`, $\Delta P_{\text{cámara}} > 3.5\text{ bar}$) y cumplimiento NOM-141-SEMARNAT en `/filtracion/` y `/en/filtration/`.
9. **`D9 = 9-C++++` (`SLICE-14`, `SLICE-23`):** Purga de los 12 ítems de debris (`DEB-V3-01..12`), ordenamiento causal del DAG `preflight` en `package.json`, alineación de `site/ortho.toml`, y adición de **`Gate 28`** y **`Gate 29`** en `crates/smat-gate/src/lib.rs` + suite `tests/mvp_v3_decisions.test.mjs`.
10. **`D10 = 10-C++++` (`SLICE-11`, `SLICE-12`, `SLICE-13`):** Reparación verificada de los motores soberanos `research` (`RES-SMAT-01..05`), `ortho` (`ORT-SMAT-01..03`), `nexus` (`NEX-SMAT-01`) y `ciencia` (`CIE-SMAT-01`), homologada bajo **`GOLD-644`** en `betsela/research/ADOPTED_REGISTRY.md`.
