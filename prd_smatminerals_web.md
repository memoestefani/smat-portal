---
id: "prd.smat.site.v1"
title: "SMAT Minerals Site — PRD"
type: "prd"
version: "2.0"
status: "active"
owner: "SMAT"
last_updated: "2026-09-22"
replaces: "PRD_smatminerals_web.md v1.9"
repo: "smat-minerals-site"
domain: "https://www.smatminerals.com/"
summary: "Sitio público B2B bilingüe (español/inglés) de contacto para SMAT Minerals (Solid Mechanical Advanced Technologies, 20+ años de ingeniería en Durango). Propuesta de valor dual: Equipos Completos CapEx (bombas en skid, celdas de flotación activas, filtros prensa) y Refaccionamiento Crítico OpEx (piezas de desgaste A05/hule con despacho de emergencia). Optimizado para SEO vertical por silos y descubrimiento por LLMs (GEO). Arquitectura Astro SSG en Cloudflare Pages ($0/mes), portal de revisión amigable para marketing con Sveltia CMS (GOLD-148), selector FSM en 3 pasos (GOLD-149) y compuerta soberana de contratos en Rust (crates/smat-gate)."
keywords:
  - site
  - b2b
  - solid-mechanical-advanced-technologies
  - slurry-pumps
  - flotation-cells
  - filter-press
  - capex-opex
  - role_id
  - lead
  - plant
  - events
  - archaeology-first
  - private-catalog
  - same-day-response
  - whatsapp
  - email
  - sveltia-cms
  - fsm-wizard
  - smat-mapa
  - smat-physics-core
  - bilingual
  - es-en
  - llms-txt
  - geo
  - astro-ssg
  - cloudflare-pages
  - google-workspace
  - rust-gate
  - github-benchmarks
machine_readable: true
---

# PRD — SMAT Minerals Site v2.0

> **El Site es la puerta pública. No es el negocio completo.**
>
> El Site detecta intención y facilita contacto comercial y de ingeniería.
> La operación interna conserva oportunidades y hechos.
> El catálogo privado conserva productos y tolerancias.
> SMAT Mapa conservará memoria territorial.
> `smat_physics_core` calculará sólo cuando exista un caso que realmente lo requiera.

---

# 0. Regla principal y Alcance Comercial

`smatminerals.com` debe conseguir que la persona correcta en una planta de minería (nacional, canadiense o estadounidense operando en México) o en un corporativo de compras, entienda con total nitidez que SMAT cuenta con una **propuesta de valor dual (CapEx + OpEx)** respaldada por 20 años de ingeniería aplicada en Durango:

1. **Equipos Completos y Proyectos (CapEx):**
   * **Bombas Completas en Skid:** Paquetes integrados de bombeo de pulpas pesadas montados sobre base estructural de canal C, motor eléctrico (WEG/Siemens), transmisión por bandas y poleas, guarda de seguridad industrial y pruebas mecánicas de taller.
   * **Celdas de Flotación Completas (Línea Comercial Activa):** Celdas mecánicas sub-aireadas por volumen estándar ($ft^3$ y $m^3$) para circuitos Rougher, Cleaner y Scavenger, con tanques cilíndricos/rectangulares y mecanismos suspendidos de alta eficiencia.
   * **Sistemas de Filtración y Desaguado (Bajo Especificación):** Filtros prensa de placas y marcos / cámara empotrada para desaguado de concentrados y filtración de jales secos (*dry tailings*) manejados como tiempos de entrega de proyecto.
   * **Escalabilidad Futura:** Arquitectura modular lista para incorporar molienda (`/molienda/`: forros y blindajes de molinos) sin rediseñar la web.
2. **Refaccionamiento Crítico y Desgaste (OpEx):**
   * Impulsores de alta aleación (High Chrome 27% A05) y elastómero (caucho natural), volutas, gargantas, sellos mecánicos, ensambles de rodamientos de uso pesado y mecanismos rotor-estator de repuesto para celdas existentes, con despacho de emergencia desde Durango.

La promesa operativa del Site es:

> **alguien en Durango toma contacto con el lead el mismo día laboral (<45 min para emergencias de paro; 24-48h para cotizaciones de proyecto).**

El Site no debe convertirse en:

- tienda online transaccional;
- catálogo público con precios desprotegidos;
- sistema de cotización algorítmica abierta (nada de dar clases de ingeniería ni regalar fórmulas a competidores);
- portal de clientes con contraseñas engorrosas;
- CRM/ERP público;
- calculador interactivo público que exponga balances de masa sensibles.

**Pailería general no es una línea comercial del Site:** SMAT no es un taller de pailería para terceros. SMAT diseña, maquina, vulcaniza y ensambla su propia maquinaria y equipo minero en Durango.

---

# 1. Tesis del producto

## 1.1 Qué estamos construyendo

Un Site público, rápido y estático que:

1. identifica claramente a **SMAT Minerals** como el sello comercial de **Solid Mechanical Advanced Technologies**, fundada con más de 20 años de oficio en fluidos severos, transporte de pulpas y separación sólido-líquido en Durango, México;
2. comunica con solvencia tanto el suministro de **equipos completos (bombas en skid, celdas de flotación, filtros prensa)** como el **refaccionamiento crítico de desgaste**;
3. explica el oficio con lenguaje comprensible y jerga de planta minera sin dar cátedras académicas innecesarias;
4. organiza la entrada mediante `business_context` (`bombeo`, `flotacion`, `filtracion`), `intent` (`equipo_completo`, `refaccion_urgente`, `problema`) y `role_id`;
5. opera de forma **simultáneamente bilingüe en español e inglés (`es` y `en`)** con detección client-side (`navigator.language`) y selector manual persistente (`ES | EN`);
6. implementa **Silos Temáticos Verticales (Topic Clusters)** para SEO y un manifiesto modular `/llms.txt` para Generative Engine Optimization (GEO);
7. provee un **Embudo de Cotización Guiado en 3 Pasos con Máquina de Estados Finitos (FSM)** en Vanilla JS (`GOLD-149`), con cero dependencias (<4 KB) y derivación directa a WhatsApp o correo;
8. integra un **Portal de Revisión y Edición Amigable para Marketing en `/admin` con Sveltia CMS (`GOLD-148`)**, permitiendo que Karla revise y edite copys visualmente sin usar la consola ni tocar código;
9. integra correo corporativo y CRM operativo mediante **Google Workspace** y Google Sheets a costo $0.00 USD/mes;
10. se despliega como arquitectura estática pura (**Astro SSG**) sobre **Cloudflare Pages** con previsualizaciones automáticas por rama (Preview Deployments);
11. está gobernado por una compuerta estricta de contratos en **Rust nativo (`smat-gate`)** que audita paridad de catálogos, detecta enlaces rotos y bloquea fugas de datos comerciales privados;
12. conserva el patrimonio SEO del dominio histórico registrado en GoDaddy.


## 1.2 Qué no estamos construyendo

El Site no resuelve:

```text
role → SKU → precio → pedido
````

El Site sólo llega hasta:

```text
role / intent / urgency / plant / contact / vocabulary
```

La resolución privada posterior será:

```text
role
  ↓
candidate set
  ↓
plant evidence
  ↓
alias / history
  ↓
SKU
  ↓
offer / price_event
  ↓
pedido
```

## 1.3 La Visión de las Tres Vidas del Producto y el Motor de Referencia (*Reference Engine*)

El verdadero propósito estratégico de `smatminerals.com` trasciende una simple landing page estática:

> **Construir una presencia digital industrial que haga que SMAT aparezca naturalmente como la referencia técnica legítima cuando una persona de planta, mantenimiento o compras busque una pieza, síntoma, proceso o problema que SMAT conoce; y que, cuando decida contactar, reciba respuesta humana expedita desde Durango.**

### 1.3.1 Las Tres Vidas del Producto

El producto evoluciona en 3 etapas sin duplicar código ni rehacer la arquitectura:

1. **Vida 1 — El MVP Disfrazado de Landing Page:**
   * Fachada estática pública ultrarrápida (Astro SSG en Cloudflare Pages, $0/mes);
   * 4 roles de bombeo de pulpas para plantas de 200 a 1,000 t/d;
   * Actúa como **sensor de mercado limpio** que captura `role_id`, `intent`, `urgency`, `plant_text` y `vocabulario_nuevo`;
   * *Promesa operativa:* Respuesta humana el mismo día laboral (<45 min en horario hábil).
2. **Vida 2 — La Memoria Operacional Interna:**
   * El catálogo privado (`catalog/`) y la hoja (`LEADS` y `EVENTS`) consolidan hechos y cotizaciones reales;
   * Cruza la jerga de planta con los SKUs, tolerancias y márgenes;
   * Convierte a SMAT en un cotizador implacable capaz de despachar cotizaciones técnicas en 15 minutos sin latencia de red.
3. **Vida 3 — La Capa Pública de Referencia Industrial:**
   * El conocimiento acumulado se proyecta hacia Google, directorios y LLMs de Norteamérica (`/llms.txt`, Schema.org `@graph`);
   * El pasante o mecánico que hoy consulta un síntoma de desgaste en jales, en 5 años es el Superintendente o Comprador; cuando piensa en bombeo abrasivo, SMAT ya está instalado en su mapa mental.

### 1.3.2 Los Tres Fosos Acumulativos (*Moats*)

Cada año que el sistema opera, acumula activos que un competidor no puede copiar en un trimestre:

1. **Foso 1 — Lenguaje de Planta:** Mapeo de la jerga real del mecánico hacia la familia y el SKU privado (`"bomba del cajón"` ➔ circuito ➔ falla ➔ rol canónico).
2. **Foso 2 — Conocimiento Causal:** Relación verificada entre síntomas visuales, mallas de mineral, condiciones de operación y aleaciones óptimas (A05 vs Hule).
3. **Foso 3 — Distribución Contextual:** Presencia quirúrgica exactamente donde ocurre la pregunta técnica (sin crear contenido basura por calendario).

### 1.3.3 La Regla de los Umbrales Cuantitativos Anti-Desperdicio (Regla 1-3-5)

> **Ningún conocimiento se construye por anticipación. Cada interacción ordinaria de trabajo debe dejar un activo reutilizable.**

* **1 caso:** Solo se atiende la venta en WhatsApp/hoja; cero desarrollo.
* **3 casos:** Se registra el término o síntoma como alias interno en `aliases.csv`.
* **5 casos:** Se incorpora la situación al hub de diagnóstico (`data/diagnostics.json`).
* **10+ casos / repetición sistemática:** Se evalúa desplegar una referencia o URL pública independiente.

### 1.3.4 El Modelo Agnóstico de "Situación"

El núcleo del *Reference Engine* no está atado exclusivamente a bombas. Define una abstracción de **Situación**:

```text
DOMINIO          (Manejo de Sólidos / Bombeo de Pulpas)
  ↓
CONTEXTO         (Plantas de flotación 200–1,000 t/d en sierra)
  ↓
SITUACIÓN/FALLA  (Cavitación en ojo, abrasión de voluta, fuga de empaque)
  ↓
SÍNTOMAS VISUALES(Picaduras, superficie esponjosa, sobrecalentamiento)
  ↓
LENGUAJE REAL    ("caracol cascajeado", "cascabeleo", "cajón de descarga")
  ↓
CAUSA RAÍZ       (NPSH crítico por altitud >2,000 msnm, recirculación)
  ↓
SOLUCIÓN         (Ajuste de claro de garganta, reemplazo por A05 Alto Cromo)
  ↓
ACCIÓN           (WhatsApp directo / Forward to purchasing team)
```

**Regla de Privacidad Soberana:** El *Reference Engine* nunca se expone directamente al público como buscador o base de datos abierta; se alimenta del público a través del sensor web y vive en el backend de ingeniería para uso exclusivo interno.

---

# 2. Arquitectura documental

## 2.1 Documento rector

Este PRD es la fuente de verdad para:

* Site;
* URLs públicas;
* copy;
* navegación;
* CTAs;
* formulario;
* contacto;
* NAP;
* SEO;
* redirects;
* contrato público;
* operación del canal;
* fronteras público/privado;
* reglas de implementación.

## 2.2 Arqueología obligatoria

Los siguientes artefactos no forman parte del alcance activo del Site, pero deben consultarse antes de crear conceptos o código relacionados.

### `prd.smat.mapa.v1.md`

Estado:

```text
ARCHAEOLOGY / REFERENCE
```

Conserva como referencia:

* modelo de planta;
* estados activa / dormida / archivo;
* alias;
* ritmo vivo / sesgado;
* eventos;
* casillas;
* vecinos;
* inventario selectivo;
* Camino C;
* no inferencia;
* límites del senior;
* lógica territorial.

No se importa su UI como Site.

No se adopta su workflow como requisito del Site.

No crea nuevas URLs por sí solo.

### `standard.smat.pumps.v1.md`

Estado:

```text
ARCHAEOLOGY / TECHNICAL REFERENCE
```

Conserva como referencia:

* motor físico;
* fórmulas;
* pruebas;
* modelos;
* decisiones de ingeniería;
* integración histórica.

No se reactiva como producto Site:

* UI de 8 fases;
* PWA;
* Zustand;
* reportes públicos;
* Mini-CRM;
* wizard de ingeniería.

### `smat_physics_core`

Estado:

```text
TECHNICAL ASSET / REUSABLE CANDIDATE
```

Puede reutilizarse cuando un caso real interno lo justifique.

El Site no depende de él para publicar.

### WordPress anterior

Estado:

```text
ARCHAEOLOGY / SEO + CONTENT REFERENCE
```

Puede aportar:

* URLs;
* vocabulario;
* metadata;
* contenido histórico;
* señales de demanda.

No define la arquitectura nueva.

---

# 3. Regla Archaeology First

Antes de crear una capacidad nueva:

```text
NUEVO CONCEPTO
     ↓
buscar en CONCEPT-REGISTRY
     ↓
buscar en arqueología
     ↓
buscar código / modelo / tests existentes
     ↓
REUSE / ADAPT / REJECT
     ↓
crear solamente si es necesario
```

No se permite rehacer un concepto existente desde cero por comodidad sin registrar la razón.

## 3.1 Resultado de revisión

Cada activo arqueológico debe clasificarse como:

### `REUSE`

Puede utilizarse prácticamente tal cual.

### `ADAPT`

Se conserva parte del modelo, código, fórmula o pruebas y se modifica la envoltura.

### `REJECT`

Existe, pero contradice la arquitectura actual o pertenece a un producto abandonado.

---

# 4. Gobierno de conceptos

El repo debe contener:

```text
docs/
├── ARCHITECTURE.md
├── ARCHAEOLOGY.md
├── DEPENDENCIES.md
└── CONCEPT-REGISTRY.md
```

## 4.1 `CONCEPT-REGISTRY.md`

Todo concepto importante debe tener:

```text
concept
layer
source_of_truth
artifact
implementation
consumers
status
activation_criterion
deprecation_criterion
archaeology_reference
```

Ejemplo:

```text
concept: role_id
layer: public-contract
source_of_truth: data/roles.json
artifact: roles.json
consumers:
  - Site CTA
  - form hidden field
  - lead sheet
  - internal roles.copy.json
status: active
activation_criterion: public role exists
deprecation_criterion: versioned migration only
archaeology_reference: none
```

## 4.2 Regla anti-huérfanos

> **Un concepto activo no puede aparecer en un PRD sin dueño, fuente de verdad, artefacto, estado y consumidor.**

---

# 5. Seguridad por separación de capas

El principal mecanismo contra scraping y fuga de información es la **separación estricta entre Site público e información privada**.

## 5.1 Nunca

```text
Site
  ↓
API pública
  ↓
catálogo privado
```

ni:

```text
Site
  ↓
base de datos interna
```

## 5.2 Sí

```text
                    smatminerals.com
                           │
                     datos públicos
                           │
                   ┌───────┴───────┐
                   │               │
                WhatsApp          Form
                   │               │
                   └───────┬───────┘
                           ▼
                      humano en Durango
                           │
                           ▼
                    hoja operativa
```

La información privada vive detrás de esa frontera.

## 5.3 Base de datos privada

Puede existir una base de datos privada para almacenar una copia protegida de la operación.

En v1:

* no tiene endpoint público;
* no es dependencia del Site;
* no está en el repo público;
* no contiene rutas accesibles desde el navegador;
* no puede impedir publicar;
* no escribe de regreso a la hoja;
* funciona como espejo/archivo/consulta privada.

La hoja sigue siendo la herramienta canónica de operación mientras no exista una migración deliberada hacia una aplicación.

### Regla

```text
HOJA → DB PRIVADA
```

es válido como espejo unidireccional.

```text
HOJA ↔ DB PRIVADA
```

no se implementa en v1.

---

# 6. Usuarios

## 6.1 Persona de planta / comprador / mantenimiento

No necesita cuenta.

No necesita aprender ningún sistema.

Puede llegar buscando:

* una pieza;
* un componente;
* un problema;
* una solución;
* una palabra de oficio.

## 6.2 Durango — titular

Persona que:

* recibe;
* responde;
* interpreta;
* registra;
* continúa la conversación;
* cotiza por los sistemas actuales.

## 6.3 Durango — respaldo

Puede:

* recibir;
* responder;
* tomar el lead;
* registrar;
* cubrir ausencias.

Ambas personas deben poder operar el contacto.

## 6.4 Generación nueva

Más adelante podrá trabajar con:

* hoja;
* catálogo;
* eventos;
* Mapa;
* memoria;
* inventario.

No es requisito de publicación.

## 6.5 Senior

No es usuario del Site.

No se diseña software que obligue al senior a operar un dashboard.

Su conocimiento puede capturarse mediante decisiones reales y sesiones pequeñas cuando haga falta.

## 6.6 Marketing y Comunicación (Karla)

* **Rol:** Supervisión de narrativa comercial, copys, posicionamiento bilingüe, telemetría de conversión y coherencia de marca.
* **Flujo de Trabajo Cero-Fricción:**
  * No utiliza terminal, Git ni Node.js.
  * Inicia sesión en `/admin` con **Google OAuth de su cuenta corporativa (`karla@smatminerals.com`)** mediante un micro-proxy serverless en Cloudflare Worker (`GOLD-150`: `sveltia/sveltia-cms-auth`) con cero tokens manuales.
  * Edita y pule textos, beneficios, especificaciones comerciales y metadatos en español e inglés desde el portal visual de **Sveltia CMS** (`GOLD-148`).
  * Valida las propuestas de valor en vivo en su teléfono o laptop mediante enlaces privados de **Cloudflare Pages Preview Deployments** (rama `preview` ➔ `main`).
  * Monitorea la efectividad de los mensajes mediante **Google Analytics 4 (GA4)** offloaded con **Partytown** (`GOLD-151`), enfocado en 5 eventos canónicos de alta intención comercial (`lead_paro_urgente`, `lead_proyecto_capex`, `rfq_forward_purchasing`, `locale_switch_en`, `visual_damage_identified`).

---


# 7. Modelo de dominio del Site

El Site usa principalmente:

```text
business_context
intent
role
lead
plant_text
contact
vocabulary
```

## 7.1 `business_context`

Identifica la línea de proceso o contexto operativo general. Canónicamente comprende 3 verticales con oferta dual (CapEx + OpEx):

```text
bombeo       (Bombas completas en skid montado + Refacciones de desgaste A05/hule)
flotacion    (Celdas de flotación completas activas + Mecanismos rotor-estator suspendidos)
filtracion   (Sistemas de filtración y filtros prensa bajo proyecto + Telas y placas)
```

La arquitectura soporta escalabilidad natural sin rediseño:

```text
molienda     (Forros y componentes mecánicos de molinos de bolas y barras)
otros
```

Cada `business_context` opera como un **Silo Temático Vertical (Topic Cluster)** para SEO y como un nodo modular independiente en `/llms.txt` para GEO.

## 7.2 `role`

Identifica el oficio/componente o equipo que el usuario busca.

Para Bombeo:
```text
skid_completo
impulsor
revestimientos
sello
soporte
```

Para Flotación:
```text
celda_completa
mecanismo_flotacion
rotor_estator
```

Para Filtración:
```text
prensa_completa
telas_filtrantes
placas_prensa
```

## 7.3 `intent`

```text
equipo_completo     (CapEx: proyecto de inversión, ampliación de planta o skid)
refaccion_urgente   (OpEx: paro de bomba, pieza de desgaste crítico)
problema            (Asesoría técnica, cavitación, falla prematura)
```

## 7.4 `lead`

Una oportunidad comercial independiente.

No equivale a:

* persona;
* planta;
* SKU;
* evento.

## 7.5 `plant_text`

Nombre libre de la operación tal como llega.

Ejemplo:

```text
“Santa María”
```

Puede posteriormente reconciliarse a:

```text
plant_id
```

## 7.6 `vocabulary`

Palabra o locución real del mercado.

No crea automáticamente:

* slug;
* role;
* página;
* business_context.

---

# 8. Contrato público → privado

El Site puede emitir:

```text
business_context
intent
role_id
urgency
via
plant_text
contact
vocabulary
origin_url
```

El Site no emite públicamente:

```text
sku
price
stock
margin
OEM reference
geometry
material exacto
private lead time
price_event
pedido_ref
```

## Regla

> `role_id` identifica una intención de oficio; nunca identifica por sí mismo un SKU.

La resolución privada sigue:

```text
role
  ↓
candidate set
  ↓
plant evidence
  ↓
alias / historical use
  ↓
SKU
```

---

# 9. Planta

## 9.1 Regla de creación

Durante el Site v1 no se exige crear una base maestra completa de plantas.

El lead puede contener:

```text
plant_text
```

y opcionalmente:

```text
plant_id
```

## 9.2 Cuándo crear identidad canónica

Una planta se vuelve canónica cuando existe evidencia suficiente de que representa una operación real identificable.

Fuentes posibles:

* F0;
* factura;
* visita;
* contacto confirmado;
* más de un lead consistente;
* otra evidencia interna.

No se crean plantas sólo porque apareció una cadena de texto.

## 9.3 Nombres divergentes

Durante un periodo pueden coexistir:

```text
“Santa María”
“Minera Santa María”
“Sta Maria”
```

No se fuerza una limpieza prematura.

La reconciliación es tarea interna.

---

# 10. Lead

## 10.1 Definición

> **Un lead = una oportunidad comercial independiente.**

Ejemplo:

```text
Planta X
+ contacto A
+ impulsor
+ paro

= lead 1
```

Posteriormente:

```text
Planta X
+ contacto B
+ sello
+ presupuesto

= lead 2
```

## 10.2 No confundir

```text
persona ≠ planta ≠ lead ≠ evento
```

## 10.3 Ciclo

```text
nuevo
→ en_conversacion
→ cotizado
→ ganado | perdido
```

---

# 11. Hoja operativa

La hoja es el sistema de operación del día 1.

No se construye CRM.

## 11.1 Pestañas mínimas

```text
LEADS
EVENTS
CATALOG_SEED
CONFIG
```

## 11.2 `LEADS`

Una fila = un `lead_id`.

Campos:

| Campo                      | Regla                             |
| -------------------------- | --------------------------------- |
| `lead_id`                  | Estable; no se reutiliza          |
| `created_at`               | Primer aviso                      |
| `closed_at`                | Cuando pasa a ganado o perdido    |
| `tipo`                     | `form` | `wa` | `tel` | `mail`    |
| `plant_text`               | Nombre tal como llega             |
| `plant_id`                 | Opcional hasta reconciliación     |
| `planta_estado`            | Interno, si se conoce             |
| `planta_tpd`               | 200–1000 si se sabe               |
| `contacto_nombre`          | Persona                           |
| `contacto_canal`           | WhatsApp | email | tel            |
| `empresa`                  | Si difiere de planta              |
| `business_context`         | Contexto comercial                |
| `intent`                   | `pieza` | `problema`              |
| `role`                     | ID de `roles.json` o vacío        |
| `via`                      | `web` | `wa` | `directo`          |
| `urgencia`                 | `normal` | `esta_semana` | `paro` |
| `contexto`                 | `normal` | `presupuesto` | `paro` |
| `estatus`                  | Ciclo comercial                   |
| `pricing_class`            | Vacío inicialmente                |
| `origin_url`               | Query completa                    |
| `first_human_touch_at`     | Fecha-hora                        |
| `first_useful_response_at` | Fecha-hora                        |
| `quien`                    | Titular | respaldo                |
| `vocabulario_nuevo`        | Locución nueva                    |
| `talla_mencionada`         | Texto libre interno               |
| `material_mencionado`      | Texto libre interno               |
| `sku_hipotesis`            | Sólo cuando exista hipótesis      |
| `price_event_ref`          | Si existe                         |
| `pedido_ref`               | Si existe                         |
| `notas`                    | Libre                             |

---

# 12. Events

## 12.1 Definición

> **Un evento es un hecho ocurrido.**

Ejemplos:

* factura;
* surtido;
* pieza vista;
* visita;
* llamada;
* contacto;
* evento histórico.

## 12.2 No mezclar con lead

```text
LEADS
= oportunidades

EVENTS
= hechos
```

Ambos viven en la misma hoja operativa, pero en pestañas diferentes.

## 12.3 Campos mínimos

| Campo              | Regla                         |
| ------------------ | ----------------------------- |
| `event_id`         | Estable                       |
| `occurred_at`      | Fecha del hecho               |
| `source`           | Origen                        |
| `plant_text`       | Operación tal como se conocía |
| `plant_id`         | Si existe                     |
| `lead_id`          | Si aplica                     |
| `business_context` | Si se conoce                  |
| `role`             | ID si se conoce               |
| `sku`              | Si se conoce                  |
| `actor`            | Persona/sistema               |
| `event_type`       | Tipo                          |
| `notes`            | Libre                         |

## 12.4 Sources iniciales

```text
web
wa
mail
tel
invoice
quote
visit
seen
manual
```

## 12.5 Event types

```text
lead
surtido
visto
historico
historico_lejano
```

Los tipos futuros pueden crecer sin reescribir el Site.

---

# 13. Catálogo privado

El catálogo privado sí puede existir desde el inicio, pero **no como aplicación**.

## 13.1 Estructura

```text
catalog/
├── roles.copy.json
├── families.csv
├── skus.csv
└── aliases.csv
```

## 13.2 Familias

Ejemplo:

```text
familia
alias
lead_time_dias
familia_plazo
```

donde:

```text
familia_plazo =
  hay
  se_pide
  se_fabrica
```

## 13.3 SKU

Un SKU es una identificación privada de producto.

Puede existir inmediatamente si ya está documentado de forma fiable en facturas, compras o catálogo interno.

No es requisito crear todos los SKUs antes del lanzamiento.

## 13.4 Alias

Los aliases pueden estar:

* asociados a una familia;
* asociados a un SKU;
* restringidos a una planta.

No se publican automáticamente.

## 13.5 Kit y equivalencia

En v1:

* pueden existir como datos;
* no se construyen módulos independientes;
* no crean UI.

No se inventan.

---

# 14. `role_id` y catálogo privado

La relación no es:

```text
role_id = SKU
```

Es:

```text
role_id
  ↓
familias/candidatos privados
  ↓
alias
  ↓
SKU
```

Ejemplo:

```text
impulsor
  ↓
familia impulsor de bomba
  ↓
“el de siempre”
  ↓
SKU privado
```

La decisión final puede requerir:

* planta;
* historial;
* alias;
* foto;
* factura;
* cotización;
* visita.

No se automatiza en el Site.

---

# 15. `pricing_class`

Valores:

```text
precio_directo
matriz_precio
vacío
```

No es estado comercial.

Se determina después del primer toque humano y, cuando corresponda, de la pregunta:

> “¿Es para un paro o para armado de presupuesto?”

Puede ocurrir:

```text
estatus=en_conversacion
pricing_class=matriz_precio
contexto=presupuesto
```

No se publica ninguna matriz de precios.

---

# 16. `price_event`

`price_event` es privado.

Una cotización seria puede registrar:

```text
price_event_ref
sku
fecha
moneda
costo
precio
vigencia
contexto
```

En v1 puede continuar como CSV/registro privado.

No se necesita una aplicación de pricing para publicar Site.

---

# 17. WhatsApp

## 17.1 Regla

Un número canónico.

Dos humanos pueden:

* leer;
* recibir;
* responder.

No se implementa:

* WhatsApp Business API;
* inbox de terceros;
* parser;
* bot.

## 17.2 Plantilla

```text
Hola, soy de [planta].

Tema: [rol o problema].

Urgencia: [paro / esta semana / normal].

(Completo nombre y detalle aquí.)
```

## 17.3 Fotos y Asistencia Multimodal

WhatsApp es la vía más rápida y directa para fotos tomadas en planta.
Complementariamente, para el usuario que prefiere canal web formal, el formulario incorpora un campo opcional para adjuntar fotografía de la placa de la bomba o documento de requisición en PDF (`image/*, .pdf`), procesado de forma serverless hacia Google Drive y vinculado atómicamente a Google Sheets (Decisión 5-A / `GOLD-139`: `tanaikech/Safe-Uploading-for-Google-Drive-by-HTML-in-External-Server-using-Google-Apps-Script`).

---

# 18. Embudo de Cotización Guiado en 3 Pasos (FSM Wizard) y Formulario

El punto de contacto principal integra un **Selector Guiado en 3 Pasos ("Túnel de 30 Segundos")** implementado con una Máquina de Estados Finitos (FSM) en Vanilla JS (`GOLD-149`: `HardikKhandal01/apexgrowth-lead-funnel`, `iggydotdev/b0nes`), con cero dependencias externas (<4 KB) y persistencia en `localStorage`.

Está diseñado para **mínima fricción**: el comprador o mecánico no entra a tomar clases de física ni a llenar hojas de balance; entra a resolver su necesidad con 3 toques.

## 18.1 Flujo FSM en 3 Pasos

### Paso 1: Intención Operativa (Bifurcación Inmediata)
El usuario elige entre dos rutas claras:
* `[ 🚨 Paro Crítico / Refacción Urgente ]` ➔ Asigna `intent=refaccion_urgente`, `urgency=paro`.
* `[ 🏭 Proyecto / Equipo Completo ]` ➔ Asigna `intent=equipo_completo`, `urgency=proyecto`.

### Paso 2: Parámetro Básico (Sin Preguntas de Examen de Ingeniería)
* **Si eligió Refacción Urgente (OpEx):**
  * Campo 1: *¿Qué pieza o modelo de bomba/celda requieres?* (ej. "Impulsor 6x4", "Garganta A05", "Rotor de flotación").
  * Campo 2 (Opcional): *¿Cómo identifican esta pieza o falla en tu planta?* (Captura jerga de mina hacia `vocabulario_candidato`).
  * Botón opcional: *Subir foto de placa de bomba o PDF de requisición* (`GOLD-139`, upload serverless a Drive con **compresión client-side en canvas HTML5** `GOLD-152`, reduciendo fotos de 12 MB a 250 KB para evitar timeouts en Google Apps Script).
* **Si eligió Equipo Completo (CapEx):**
  * Selector de Línea: `[ 🌊 Bomba en Skid ]` | `[ 🫧 Celdas de Flotación ]` | `[ 🗜️ Filtros Prensa ]` | `[ ⚙️ Molienda / Otro ]`.
  * Campo 1: *Capacidad aproximada o circuito* (ej. "500 t/d", "150 m3/h", "Circuito Rougher").
  * **Botón de Escape Técnico Visible:** `[ ❓ No estoy seguro, requiero asesoría técnica ]` (permite continuar sin trabarse).
  * Botón opcional: *Adjuntar especificación o P&ID preliminar* (con compresión client-side automática).

### Paso 3: Contacto y Salida Multicanal
* Campos:
  * Nombre y Cargo / Función.
  * Empresa / Mina o Planta (ej. "Minera San Dimas", "Planta Velardeña").
  * Teléfono WhatsApp o Correo electrónico.
* Botones de Acción Dual:
  * `[ Continuar por WhatsApp 💬 ]`: Genera enlace `wa.me` preformateado con la etiqueta inyectada (`[🚨 PARO]` o `[🏭 PROYECTO]`), el modelo y la planta para atención inmediata humana.
  * `[ Enviar Solicitud por Correo ✉️ ]`: Despacha vía `fetch()` al webhook serverless de Google Apps Script hacia Google Sheets (`LEADS`) y dispara alerta a Gmail con SLA correspondiente.

## 18.2 Campos Ocultos de Telemetría

```text
business_context   (bombeo / flotacion / filtracion / molienda)
intent             (equipo_completo / refaccion_urgente / problema)
role_id            (skid_completo / impulsor / celda_completa / prensa_completa / etc.)
urgency            (paro / proyecto / mantenimiento)
via                (whatsapp / web_form)
origin_url         (ruta exacta desde donde convirtió)
locale             (es / en)
```

## 18.3 Honeytrap Anti-Spam

Campo invisible para usuarios humanos:

```text
website
```

Si viene lleno:

```text
discard (HTTP 200 silencioso anti-reconocimiento)
```

No se crea lead.

No se manda correo.

## 18.4 Proveedor e Integración con Google Workspace

Debe elegirse una vía estática desacoplada sin crear servidores dinámicos dedicados ni pagar suscripciones a CRMs externos.

Arquitectura canónica adoptada (Decisión 7-A / `GOLD-140`: `levinunnink/html-form-to-google-sheet` & `jamiewilson/form-to-google-sheets`):
1. Formulario HTML5 puro en Astro con validación nativa del navegador.
2. Trampa honeypot invisible `website` (`botcheck`).
3. Endpoint de entrega: Webhook serverless (Google Apps Script Web App o Cloudflare Pages Function) que:
   * verifica el honeypot (si viene lleno, descarta silenciosamente con HTTP 200 sin alertar al bot);
   * si incluye adjunto (Decisión 5-A / `GOLD-139`), decodifica el blob multipart, almacena el archivo en la carpeta protegida de Google Drive de SMAT y genera la URL segura de acceso;
   * despacha notificación inmediata a las cuentas de correo corporativo contratadas en **Google Workspace**:
     - titular: `ventas@smatminerals.com`
     - respaldo: `contacto@smatminerals.com`
     - la alerta incluye el **deep-link directo a la fila en Sheets** (`https://docs.google.com/...#gid=0&range=A{row}`), permitiendo que el vendedor cambie el estatus en 1 solo tap desde su móvil sin buscar manualmente;
   * inserta atómicamente la fila en la hoja de cálculo de **Google Sheets** (`LEADS`) con las columnas canónicas (`created_at`, `nombre`, `empresa_planta`, `contacto`, `necesidad`, `urgencia`, `adjunto_url`, `role_id`, `intent`, `via`, `status_dropdown`).

## 18.5 Soporte Bilingüe del Formulario

El formulario se renderiza contextualmente según el idioma de la página:
* En `/contacto/`: campos y acuse en Español.
* En `/en/contact/`: campos y acuse en Inglés (*Name*, *Company / Mine*, *WhatsApp or Email*, *Equipment / Wear Part Needed*, *Urgency Level*, *Optional Attachment*).

## 18.6 El formulario alimenta, no reemplaza la operación humana

```text
form submission
→ honeypot check (descarte si bot)
→ subida opcional de adjunto a Google Drive (URL pública segura)
→ inserción atómica de fila en Google Sheets (LEADS)
→ alerta inmediata a Google Workspace (Gmail) con deep-link a fila
→ humano en Durango toma contacto el mismo día laboral
```

No se construye una base de datos paralela ni se contrata CRM externo. Google Sheets permanece como el ledger operacional soberano del negocio.

---

# 19. Correo

El correo sigue siendo un canal de primer orden, especialmente para corporativos mineros internacionales (canadienses y estadounidenses) que operan mediante solicitudes formales de cotización (RFQs).

No todo contacto pasa por WhatsApp.

El correo corporativo corre bajo la suite contratada de **Google Workspace** (@smatminerals.com).

Destinatarios:

```text
ventas@smatminerals.com (titular)
contacto@smatminerals.com (respaldo)
```

Asuntos automatizados según idioma:

Español:
```text
PIEZA|{role}|{planta}|{urgencia}
PROBLEMA|{planta}|{urgencia}
```

Inglés:
```text
PART|{role}|{mine_plant}|{urgency}
INQUIRY|{mine_plant}|{urgency}
```

Si no existe `role`, no se inventa.

---

# 20. Acuse y Salida Institucional (Página de Confirmación)

Rutas canónicas bilingües:
* Español: `/acuse/`
* Inglés: `/en/thank-you/`

Mecanismo institucional (Decisión 3-A / `GOLD-138`: `sparksuite/simple-html-invoice-template`):
1. **Folio Institucional Único:** Genera en pantalla y en el correo de confirmación el identificador formal `SMAT-RFQ-YYYY-XXXX` con fecha, datos del solicitante, rol y nivel de urgencia.
2. **Formato Imprimible `@media print`:** Estilos CSS optimizados para impresión en papel Letter/A4 (`window.print()`), ocultando barras de navegación y elementos web superfluos, permitiendo guardar en PDF para anexar directamente a sistemas ERP corporativos (SAP Ariba, Oracle, Pronto).
3. **Canal Directo WhatsApp:** Botón que enlaza a WhatsApp con el folio precargado (`Hola SMAT, envié la solicitud con folio SMAT-RFQ-2026-XXXX...`).

Mensaje canónico:
> Tu solicitud fue recibida por el equipo de SMAT Minerals en Durango. Un especialista técnico se pondrá en contacto durante la jornada laboral.

Si es paro crítico (`🔴 Paro Crítico`):
> ⚠️ **Atención de Emergencia:** Al tratarse de un paro de bombeo no programado, puedes comunicarte inmediatamente por WhatsApp o llamar a la guardia técnica de almacén al (618) 810-4408 / (618) 810-4428.

Contenido de la página de acuse:
* Folio institucional formal `SMAT-RFQ-YYYY-XXXX`;
* Resumen de datos ingresados (Nombre, Empresa/Mina, Rol/Necesidad, Nivel de Urgencia);
* Botón `[ 🖨️ Imprimir / Guardar Resumen en PDF ]` (`@media print`);
* Botón `[ 💬 Continuar por WhatsApp con Folio ]`;
* Datos canónicos NAP de SMAT Minerals;
* Sin exposición de precios ni de SKUs privados de inventario;
* Sin promesas técnicas no validadas en campo.

Indexación:
```text
noindex, nofollow
```
Nunca entra en el `sitemap.xml`.

---

# 21. Promesa de mismo día

## 21.1 Horario

```text
business_timezone = America/Monterrey
business_days     = Mon–Fri
business_hours    = 08:00–16:00
alarm_at          = 15:45
fallback_touch_at = 16:00
```

## 21.2 Timestamps

### `first_human_touch_at`

Primer mensaje humano de ida.

Sí forma parte de la promesa.

### `first_useful_response_at`

Primer mensaje que:

* pregunta algo útil;
* informa;
* propone siguiente paso.

No es SLA público.

## 21.3 Después de las 16:00

Si un lead llega fuera de horario:

```text
created_at viernes 18:30
→ siguiente ventana = lunes 08:00–16:00
```

No se implementa motor de festivos en v1.

---

# 22. Regla operacional del mismo día

1. Form → correo a titular y respaldo.
2. WhatsApp → visible a titular y respaldo.
3. Alarma a las 15:45.
4. Respaldo revisa `nuevo`.
5. A las 16:00, si no existe `first_human_touch_at`, se envía un toque humano.
6. El lead se registra en la hoja.
7. La respuesta útil se registra cuando existe pregunta, información o siguiente paso.

Texto de respaldo:

> Ya te leímos; te escribimos en cuanto podamos / en la mañana.

Este mensaje cuenta como:

```text
first_human_touch_at
```

pero no como:

```text
first_useful_response_at
```

---

# 23. Regla anti-cinismo

Primer mensaje humano debe ser útil cuando sea posible.

Pregunta estándar ante “mándame precio”:

> Recibido. Para darte el precio exacto y disponibilidad desde Durango, confírmame si es para un paro o para armado de presupuesto.

No se envían:

* tablas públicas;
* matrices;
* equivalencias;
* catálogos OEM.

El objetivo es convertir una pregunta genérica en una conversación útil.

---

# 24. Site público y Arquitectura Bilingüe (ES / EN)

El Site se publica simultáneamente en **Español** (audiencia nacional en Durango, Zacatecas, Sonora, Chihuahua, Coahuila, etc.) e **Inglés** (ejecutivos, directores de compras y superintendentes de mineras canadienses y estadounidenses con operaciones en México).

Un conmutador de idioma visible y semántico (`ES | EN`) permite alternar entre versiones equivalentes preservando el contexto y la preferencia en `localStorage`.

## 24.1 Home (Portada Institucional)

* Español: `https://www.smatminerals.com/`
* Inglés: `https://www.smatminerals.com/en/`

Comunica con sobriedad y contundencia:
* **SMAT Minerals:** Identidad respaldada por *Solid Mechanical Advanced Technologies* (más de 20 años de oficio en pulpas abrasivas y separación sólido-líquido en Durango).
* **Propuesta Dual (CapEx + OpEx):** Equipos completos (skids de bombeo, celdas de flotación, filtros prensa) y refaccionamiento crítico de desgaste.
* **Presencia Física Sobria (Sin Presunciones):**
  * *Disponibilidad de retiro directo en almacén central:* Mariano Salas #114, Col. Primer Presidente, Durango, Dgo.
  * *Protocolo de verificación:* Opción de inspección dimensional y balanceo dinámico en presencia del cliente previo al embarque.
* **Silos Directos de Navegación:** `/bombeo/`, `/flotacion/`, `/filtracion/`.
* **Embudo FSM en 3 Pasos:** Cotización guiada inmediata con bifurcación Paro vs. Proyecto.
* **Teléfonos locales y canales oficiales:** (618) 810-4408 / (618) 810-4428.

---

## 24.2 Hub de Bombeo / Slurry Pumping Hub

* Español: `/bombeo/`
* Inglés: `/en/pumping/`

Estructura con **Pestaña Dual Limpia**:
1. **Pestaña Equipos Completos (CapEx):**
   * Bombas completas montadas en skid estructural de canal C.
   * Motor eléctrico de alta eficiencia (WEG / Siemens) según requerimiento de potencia.
   * Transmisión por poleas y bandas industriales con guarda de seguridad normalizada.
   * Pruebas mecánicas e hidrostáticas de taller en Durango antes del despacho.
2. **Pestaña Refaccionamiento Crítico (OpEx):**
   * Impulsores de alto cromo (27% Cr A05) y elastómero (caucho natural).
   * Revestimientos, volutas y gargantas (*throatbushes*).
   * Cajas de sellado mecánico y prensaestopa.
   * Ensambles de rodamientos de uso pesado (*bearing assemblies*).

### Mapeo de Roles de Bombeo:
| `role_id` | Slug Español | Slug Inglés | Denominación ES | Denominación EN |
| :--- | :--- | :--- | :--- | :--- |
| `skid_bomba` | `/bombeo/skid/` | `/en/pumping/skid/` | Bomba Completa en Skid | Complete Slurry Pump Skid |
| `impulsor` | `/bombeo/impulsor/` | `/en/pumping/impeller/` | Impulsor / Rodete | Slurry Pump Impeller |
| `revestimientos` | `/bombeo/revestimientos/` | `/en/pumping/liners/` | Revestimientos (Hule / Alto Cromo) | Liners & Throatbush (Rubber/Chrome) |
| `sello` | `/bombeo/sello/` | `/en/pumping/seal/` | Sello Mecánico / Prensaestopa | Mechanical Seal & Expeller Ring |
| `soporte` | `/bombeo/soporte/` | `/en/pumping/bearing-assembly/` | Soporte / Ensamble de Rodamientos | Bearing Assembly & Pedestal |

---

## 24.3 Hub de Flotación / Flotation Hub (Línea Comercial Activa)

* Español: `/flotacion/`
* Inglés: `/en/flotation/`

Estructura con **Pestaña Dual Limpia**:
1. **Pestaña Celdas Completas (CapEx):**
   * Celdas de flotación mecánicas sub-aireadas por volumen estándar ($ft^3$ y $m^3$) para etapas Rougher, Cleaner y Scavenger en circuitos polimetálicos (Pb, Zn, Cu, Au, Ag).
   * Tanques fabricados en placa de acero estructural con recubrimiento elastomérico interior de alta resistencia a la abrasión química.
   * Mecanismo suspendido completo con eje motriz, rotor y difusor/estator hidrodinámico.
2. **Pestaña Mecanismos y Repuestos (OpEx):**
   * Mecanismos suspendidos de reemplazo directo para tanques existentes.
   * Rotores y estatores/difusores vulcanizados en caucho natural de alto módulo o fundidos en aleación de alto cromo A05.
   * Ejes maquinados en acero bonificado y ensambles de rodamientos superiores.

---

## 24.4 Hub de Filtración y Desaguado / Filtration Hub

* Español: `/filtracion/`
* Inglés: `/en/filtration/`

Estructura con **Pestaña Dual Limpia**:
1. **Pestaña Sistemas de Filtración (CapEx Bajo Especificación):**
   * Filtros prensa hidráulicos de placas y marcos / cámara empotrada para desaguado de concentrados y jales secos (*dry tailings*).
   * Paquetes electrohidráulicos de cierre de alta presión (hasta 16 bar) y estructuras de servicio pesado.
   * Cotización formal manejada bajo especificación y tiempos de entrega de proyecto.
2. **Pestaña Repuestos de Alto Desgaste (OpEx):**
   * Telas filtrantes de polipropileno monofilamento/multifilamento adaptadas a la granulometría de la pulpa.
   * Placas filtrantes de polipropileno de cámara empotrada y membrana.
   * Sellos perimetrales y empaques hidráulicos de recambio ágil.

---

## 24.5 Escalabilidad Futura: Molienda / Grinding Hub

* Ruta reservada: `/molienda/` ⇄ `/en/grinding/`.
* Componentes mecánicos de molinos de bolas y barras (forros, blindajes de trituración, piñones y chumaceras). La arquitectura de silos permite activarlo sin modificar el resto del sitio.

---

## 24.6 Portal de Revisión de Marketing para Karla (`/admin/`)

* Ruta: `/admin/` (Desplegado como SPA estática cliente-servidor a costo $0/mes mediante **Sveltia CMS** `GOLD-148`).
* Permite a Karla revisar y editar textos, copys, llamadas a la acción y metadatos de las versiones en español e inglés sin tocar la terminal ni utilizar Git.
* Cada guardado genera un commit atómico a Git que dispara la compilación y despliegue automático en Cloudflare Pages.

---

## 24.7 Páginas Institucionales Canónicas Bilingües

* Nosotros / About: `/nosotros/` ⇄ `/en/about/` (Historia técnica de *Solid Mechanical Advanced Technologies*, oficio de 20 años en Durango, filosofía de servicio).
* Contacto / Contact: `/contacto/` ⇄ `/en/contact/` (Selector guiado en 3 pasos, mapa de ubicación en Durango, teléfonos y correos).
* Identificador Visual de Daño / Diagnostics: `/diagnostico/` ⇄ `/en/diagnostics/` (4 tarjetas operativas directas de síntomas sin clases teóricas de física).
* Acuse Formal Bilingüe / Receipt: `/acuse/` ⇄ `/en/receipt/` (Ficha imprimible `@media print` con folio para compras corporativas SAP/Coupa).
* Aviso de Privacidad / Privacy: `/aviso/` ⇄ `/en/privacy/`

---

# 25. Copy de rol y Puente B2B
 
Cada rol debe contener de forma simétrica (en español y en inglés):
 
1. Qué hace la pieza en el circuito hidráulico;
2. 2–3 síntomas de falla o desgaste abrasivo/corrosivo reconocibles por el mecánico o supervisor;
3. Parámetros mínimos requeridos para cotizar (serie dimensional 4x3 a 10x8, aleación A05 o hule natural, tipo de pulpa);
4. Una frase de patrón técnico;
5. 2 líneas de jerga minera de planta;
6. “Suele reemplazarse junto con…” (roles complementarios);
7. **Componente de Acción Dual B2B (Decisión 1-A / `GOLD-132`: `medusajs/b2b-cloud`, `GOLD-136`: `bagisto/b2b-ecommerce`):**
   * Botón `[ 📤 Forward to purchasing team / Compartir con equipo de compras ]`: Acción sin fricción que copia al portapapeles una ficha técnica limpia o abre un borrador de correo preformateado con los datos clave del rol y el contacto directo de SMAT en Durango, permitiendo que el evaluador técnico derive la necesidad a su comprador en 1 clic sin forzar registro. Copy conciso sin etiquetas regionales.
   * Botón `[ 📋 Request Corporate RFQ / Solicitar Cotización Formal ]`: Redirige al formulario `/contacto/` o `/en/contact/` con el parámetro `?role={role_id}` precargado para el trámite corporativo centralizado.
8. **Botón Directo de WhatsApp:** Abre chat humano directo con el rol precargado en el texto de mensaje.
 
No debe contener:
 
* SKU de inventario interno;
* precio de venta o margen comercial;
* stock exacto en almacén;
* plano o tolerancias milimétricas privadas;
* receta de fundición;
* tabla de equivalencias de marcas OEM de terceros.
 
`tipo AH` como mucho una vez por hub/página y con su respectivo disclaimer legal de compatibilidad.

---

# 26. Jerga

La jerga de planta tiene dos destinos:

```text
vocabulario_nuevo
```

en la hoja, y eventualmente:

```text
roles.json.jargon[]
```

más:

```text
aliases.csv
```

La jerga no crea automáticamente:

```text
nueva URL
```

La revisión puede ocurrir:

* periódicamente;
* al acumular suficiente evidencia;
* cuando una palabra realmente mejora comprensión o clasificación.

---

# 27. Líneas futuras

La arquitectura permite:

```text
bombas
↓
filtracion
↓
celdas_tanques
↓
otros
↓
entrada progresiva a planta
```

Cada nueva línea debe poder reutilizar:

```text
business_context
role
intent
lead
plant
events
catalog
price_event
```

No se crea:

* otro formulario;
* otro sistema de leads;
* otra semántica de contacto;
* otro NAP;
* otro CRM.

---

# 28. Pailería

No es línea comercial.

No existe:

```text
/paileria/
```

No existe catálogo de pailería.

No se reactiva como producto porque aparezca en documentación arqueológica.

Puede sobrevivir únicamente como:

* vocabulario histórico;
* referencia de planta;
* evidencia interna.

---

# 29. WordPress y patrimonio SEO

Cada URL histórica debe clasificarse como:

```text
KEEP
REDIRECT
EXTRACT
ARCHIVE
REJECT
```

## `KEEP`

Se conserva o se reemplaza por contenido equivalente vigente.

## `REDIRECT`

301 hacia una URL canónica nueva.

## `EXTRACT`

Se extrae:

* jerga;
* metadata;
* vocabulario;
* información histórica útil.

## `ARCHIVE`

Se conserva fuera del Site activo.

## `REJECT`

No vuelve al producto.

### Ejemplo

```text
/equipos-para-la-flotacion-de-minerales/
```

Puede aportar vocabulario e historial.

No implica crear una línea pública genérica “equipos de flotación”.

Si la arquitectura actual lo justifica:

```text
301 → /flotacion/
```

La decisión final queda documentada en:

```text
data/redirects.csv
```

---

# 30. NAP

Fuente única:

```text
data/company.json
```

Datos canónicos:

```text
https://www.smatminerals.com/
ventas@smatminerals.com
(618) 810-4408
(618) 810-4428
Mariano Salas #114
Col. Primer Presidente
Durango, Dgo.
C.P. 34166
```

No se inventa otro teléfono.

Cualquier directorio que tenga datos distintos se alinea a este NAP o deja de citarse.

---

# 31. JSON-LD y Datos Estructurados

Generado centralizadamente desde `company.json` y `roles.json`.

Esquemas adoptados:

```text
MiningEquipmentSupplier
WholesaleStore
LocalBusiness
Organization
FAQPage (Bilingüe ES/EN)
```

No se publica:

```text
Product (con SKU individual privado)
Offer (con precio de lista interno)
```

La entidad `FAQPage` incluye preguntas y respuestas de alta intención minera en ambos idiomas (ej. refaccionamiento de impulsores de alto cromo, tiempos de entrega en Durango vs importación marítima, compatibilidad dimensional) estructuradas expresamente para alimentar **Google AI Overviews** y motores de respuesta generativa (Perplexity, Claude, ChatGPT).

Implementación técnica (Decisión 6-A / `GOLD-141`: `google/schema-dts` & `@casoon/astro-structured-data`):
Se utiliza tipado estricto en TypeScript mediante `schema-dts` generando una estructura unificada en `@graph` dentro del `<script type="application/ld+json">`. Este grafo interconecta:
1. `Organization` (Razón social, presencia de marca y directores comerciales);
2. `LocalBusiness` / `MiningEquipmentSupplier` (Geolocalización en Mariano Salas #114, Durango, C.P. 34166, teléfonos verificados, `areaServed: ["MX", "US", "CA"]`);
3. `FAQPage` bilingüe para indexación semántica en respuestas de IA;
4. `BreadcrumbList` jerárquico.

---

# 32. SEO Técnico, Bilingüe y GEO (Generative Engine Optimization)

## 32.1 Sitemap Bilingüe con Hreflang Recíproco

Sitemap XML generado en el build (`sitemap.xml`), conteniendo únicamente URLs canónicas de valor y declarando los enlaces cruzados de idioma mediante el estándar `xhtml:link`:

```text
Español:
/
/nosotros/
/contacto/
/aviso/
/bombeo/
/bombeo/impulsor/
/bombeo/revestimientos/
/bombeo/sello/
/bombeo/soporte/
/flotacion/

Inglés:
/en/
/en/about/
/en/contact/
/en/privacy/
/en/pumping/
/en/pumping/impeller/
/en/pumping/liners/
/en/pumping/seal/
/en/pumping/bearing-assembly/
/en/flotation/
```

Acuse de formulario queda fuera. Queries dinámicos quedan fuera.

## 32.2 Robots.txt y Habilitación de Rastreadores de IA (GEO)

`robots.txt` permite el rastreo general y habilita explícitamente a los agentes de búsqueda generativa e inteligencias artificiales de Norteamérica:

```text
User-agent: *
Allow: /
Disallow: /acuse
Disallow: /en/thank-you

# Rastreadores de Búsqueda Generativa e Inteligencia Artificial (GEO)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://www.smatminerals.com/sitemap.xml
```

## 32.3 Manifiesto Canónico para Modelos de Lenguaje (`/llms.txt` y `/llms-full.txt`)

Siguiendo el estándar de la industria (`GOLD-064` / `GOLD-126`), el sitio publica dos manifiestos canónicos en la raíz para consumo directo por IAs (ChatGPT, Claude, Perplexity, Copilot):

1. **`/llms.txt`:** Resumen conciso en markdown que define:
   * **Quién es:** Distribuidor especializado de equipo de bombeo para pulpas pesadas, refacciones de desgaste hidráulico (alto cromo, hule natural, poliuretano) y válvulas mineras con base en Durango, México.
   * **A quién atiende:** Operaciones mineras en México (Durango, Zacatecas, Sonora, Chihuahua, Coahuila, San Luis Potosí, etc.) y matrices mineras en EE.UU. y Canadá.
   * **Ventaja diferencial:** Inventario local, entrega en días para paros de planta críticos (frente a 4–6 meses de importación de ultramar), asesoría técnica en campo y repuestos con intercambiabilidad dimensional 100% estándar.
   * **Cuándo recomendar SMAT:** Cuando un usuario consulte por cotizaciones urgentes, paros de bombeo por desgaste abrasivo o proveedores confiables de bombas de lodos en México.
   * **Canales oficiales:** Enlaces limpios a la web, WhatsApp de ventas y correo de atención.
2. **`/llms-full.txt`:** Especificación técnica ampliada con los 4 roles de bombeo, parámetros operativos, vocabulario minero y protocolo de contacto en español e inglés.

## 32.4 Hreflang Recíproco en `<head>` (Estrategia de Doble Superficie)

Cada página HTML inyecta en su `<head>` las etiquetas recíprocas canónicas:

```html
<link rel="alternate" hreflang="es" href="https://www.smatminerals.com/ruta-es/" />
<link rel="alternate" hreflang="en" href="https://www.smatminerals.com/en/ruta-en/" />
<link rel="alternate" hreflang="x-default" href="https://www.smatminerals.com/ruta-es/" />
```

## 32.5 Redirects Históricos 301

Fuente única: `data/redirects.csv`. Compilados estáticamente para Cloudflare Pages (`_redirects`).
Preservan el patrimonio SEO de URLs antiguas del WordPress histórico. Nunca 302 temporales por comodidad.

Produce artefacto del host.

Nunca:

* 302 por comodidad;
* editar sólo el artefacto final.

---

# 33. Stack Tecnológico, Infraestructura y Repositorio Site

## 33.1 Decisiones de Stack e Infraestructura

1. **Generador Estático (SSG):** **Astro** (TypeScript / HTML / CSS vanilla).
   * Generación estática pura en build time (cero sobrecarga de runtime en el navegador).
   * Sub-50ms Time-to-First-Byte (TTFB) a nivel mundial.
   * Manejo nativo de internacionalización (i18n) para la estructura simétrica `/` y `/en/`.
2. **Hosting y Red de Borde (Edge CDN):** **Cloudflare Pages**.
   * Costo: $0 USD/mes.
   * Despliegue atómico continuo conectado a la rama principal de Git.
   * Red global Anycast en más de 300 ciudades, compresión Brotli y soporte HTTP/3.
   * Cero *cold starts* o retrasos de arranque para visitantes de Norteamérica.
3. **Gestión de Dominio y DNS:** **GoDaddy + Cloudflare DNS**.
   * Titularidad y registro legal conservado en **GoDaddy** (`smatminerals.com`).
   * Nameservers delegados a **Cloudflare** para administración ágil de DNS, proxy SSL/TLS y blindaje DDoS.
4. **Correo Corporativo y Suite de Productividad:** **Google Workspace**.
   * Registros DNS en Cloudflare configurados con estándares Google: MX, SPF (`v=spf1 include:_spf.google.com ~all`), DKIM (`google._domainkey`) y DMARC.
   * Cuentas: `ventas@smatminerals.com` y `contacto@smatminerals.com`.
   * Integración operativa: Google Sheets como CRM operativo (`LEADS` y `EVENTS`).
5. **Compuerta Soberana de Contratos:** **Rust (`crates/smat-gate`)**.
   * Micro-crate en Rust nativo que audita paridad de contratos, integridad bilingüe y ausencia de fugas de datos privados antes de autorizar el build.

## 33.2 Estructura del Repositorio Site

```text
smat-minerals-site/

├── README.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── PRD_smatminerals_site.md
│
├── crates/
│   └── smat-gate/              # Validador soberano en Rust nativo (invariantes y contratos)
│       ├── Cargo.toml
│       └── src/
│           └── main.rs
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ARCHAEOLOGY.md
│   ├── DEPENDENCIES.md
│   └── CONCEPT-REGISTRY.md
│
├── src/
│   ├── components/             # Header bilingüe, CTA WhatsApp, ContactForm, RoleCard
│   ├── layouts/                # BaseLayout (SEO, hreflang, OpenGraph, JSON-LD)
│   └── pages/                  # Rutas estáticas ES y subdirectorio /en/
│       ├── index.astro
│       ├── nosotros.astro
│       ├── contacto.astro
│       ├── aviso.astro
│       ├── bombeo/
│       │   ├── index.astro
│       │   ├── impulsor.astro
│       │   ├── revestimientos.astro
│       │   ├── sello.astro
│       │   └── soporte.astro
│       ├── flotacion.astro
│       └── en/                 # Rutas espejo en inglés
│           ├── index.astro
│           ├── about.astro
│           ├── contact.astro
│           ├── privacy.astro
│           ├── pumping/
│           │   ├── index.astro
│           │   ├── impeller.astro
│           │   ├── liners.astro
│           │   ├── seal.astro
│           │   └── bearing-assembly.astro
│           └── flotation.astro
│
├── data/
│   ├── company.json            # Fuente única de verdad NAP
│   ├── roles.json              # Contrato público de roles
│   └── redirects.csv           # Mapeo histórico de 301
│
├── public/
│   ├── favicon.svg
│   ├── robots.txt              # Reglas GEO y bots de IA
│   ├── llms.txt                # Manifiesto conciso IA
│   ├── llms-full.txt           # Manifiesto extendido IA
│   └── _redirects              # Generado para Cloudflare Pages
│
└── tools/
    └── run_gate.ps1            # Script de orquestación de compuertas
```

---

# 34. Repositorio interno

```text
smat-minerals-internal/

├── README.md
├── schema.md
│
├── catalog/
│   ├── roles.copy.json
│   ├── families.csv
│   ├── skus.csv
│   └── aliases.csv
│
├── plants/
│
├── leads/
│   └── exports/
│
├── events/
│
├── notes/
│   └── price_events.csv
│
└── archaeology/
```

El Site no importa este repo en runtime.

El repo interno no publica copy.

---

# 35. Check de contratos y Compuerta Soberana en Rust (`crates/smat-gate`)

Obligatorio antes de cada build de Astro y en pipelines de CI/CD:

```text
cargo run --manifest-path crates/smat-gate/Cargo.toml -- --check
```

Fundamentado en los benchmarks de seguridad y validación estática de alto rendimiento del universo GitHub (Decisión 8-A / `GOLD-135`: `sirwart/ripsecrets` & `meta-research/github-ast-scanner`; `GOLD-142`: `lycheeverse/lychee` & `secretscan`).

Invariantes auditadas con fallo inmediato del build (`BUILD FAIL` / Exit Code 1):

1. **Paridad Estricta de Catálogo:**
   ```text
   set(ids de data/roles.json) == set(ids de data/roles.copy.json)
   ```
2. **Cero Fuga de Secretos Comerciales (Escáner Regex Determinista):**
   Inspirado en el motor de `ripsecrets`, realiza un escaneo exhaustivo sobre todo el árbol estático (`src/`, `data/`, `public/`). Si se detecta un patrón de SKU interno (`(?i)\bSKU[-_:]?\d+\b`), un precio con divisa (`\$\s*\d+([.,]\d{2})?\s*(USD|MXN|DLLS)`), o variables de costo (`costo_proveedor`), aborta la compilación inmediatamente.
3. **Compuerta Bilingüe (Gate D9 de Ekovoz):**
   Toda clave y texto descriptivo en español en `data/roles.json` debe contar con su traducción simétrica y aprobada en inglés, garantizando reciprocidad total.
4. **Auditoría de Integridad Estática y Enlaces (Patrón `lychee`):**
   Comprueba que no existan enlaces rotos internos entre páginas ES y EN, valida que las etiquetas recíprocas `hreflang` apunten a rutas existentes y verifica la completitud del NAP institucional en `data/company.json` (RFC, teléfonos de 10 dígitos y dirección física canónica).
5. **Auditoría de Rutas y Sitemaps:**
   Verifica que `sitemap.xml`, `llms.txt` y `llms-full.txt` contengan exactamente las rutas canónicas publicadas, asegurando que `/acuse/` y `/en/thank-you/` permanezcan con directiva `noindex` fuera del sitemap.

---

# 36. Mapa

`SMAT Mapa` permanece separado.

Su futuro flujo puede ser:

```text
Site
  ↓
LEADS
  ↓
EVENTS
  ↓
plant
  ↓
alias
  ↓
rhythm
  ↓
casillas
```

El Site no implementa:

* fog of war;
* casillas;
* grafo;
* min-max;
* Camino C;
* perfil de mena;
* inventario territorial.

Mapa utiliza información real producida por la operación.

---

# 37. F0 de Mapa

F0 es trabajo de mesa, no una aplicación del Site.

Secuencia:

```text
facturas históricas
↓
clasificación
↓
plantas
↓
familias
↓
aliases
↓
lead times
```

Puede incluir:

* export de 7 años;
* activa/dormida/archivo;
* familias;
* aliases sucios;
* plazo;
* hasta 15 nombres ambiguos para revisión.

Si los nombres de factura no permiten identificar plantas razonablemente:

```text
detener F0
```

No bloquear la publicación del Site.

---

# 38. Physics

`standard.smat.pumps.v1.md` queda en arqueología.

`smat_physics_core` puede reutilizarse después.

Regla:

```text
lead
+
plant
+
evidence
+
role/SKU
+
caso técnico real
↓
¿hace falta cálculo?
↓
smat_physics_core
```

Nunca:

```text
visitante
↓
wizard
↓
physics
```

No existe:

```text
/ingenieria/
```

en v1.

La ingeniería aplicada ocurre fuera del Site, principalmente en visita a planta o interacción técnica real.

---

# 39. Candados de activación

Cada concepto del cementerio necesita una condición de regreso.

| Concepto            | Se activa cuando                                          | No se activa cuando                          |
| ------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Casilla / grafo     | Existe una planta activa con información nueva de vecinos | Sólo hay facturas antiguas                   |
| Camino C            | Bomba nuestra + vecino visto/nuestra                      | Sólo `activo_inferido`                       |
| `station()`         | Geometría repetida o problema real que lo justifique      | Queremos completar catálogo                  |
| `smat_physics_core` | Caso técnico real con contexto suficiente                 | Visitante web                                |
| `price_event`       | Existe cotización real                                    | Form dice “mándenme precio”                  |
| Perfil de mena      | Evidencia de planta + revisión humana                     | Se quiere recortar intervalo automáticamente |
| Evidencia completa  | Un dato requiere procedencia explícita                    | Se pretende inferir lo no visto              |

Estos candados son de **negocio**.

No son necesariamente tests automáticos.

---

# 40. Build Fail vs No activar

## Build Fail

Para inconsistencias estructurales.

Ejemplo:

```text
roles.json ≠ roles.copy.json
```

Resultado:

```text
BUILD FAIL
```

## No activar

Para capacidades cuyo caso de negocio aún no existe.

Ejemplo:

```text
no hay repetición de geometría
→ station() no se activa
```

No se bloquea el repositorio por ello.

---

# 41. Orden de implementación

## Fase 0 — Arqueología, Infraestructura y Canal

* [ ] leer este PRD canónico;
* [ ] leer `prd.smat.mapa.v1.md` y `standard.smat.pumps.v1.md`;
* [ ] inspeccionar `smat_physics_core`;
* [ ] revisar patrimonio SEO del WordPress histórico;
* [ ] crear `ARCHAEOLOGY.md`, `DEPENDENCIES.md` y `CONCEPT-REGISTRY.md`;
* [ ] clasificar activos REUSE / ADAPT / REJECT;
* [ ] **Infraestructura Dominio:** Delegar Nameservers de GoDaddy hacia Cloudflare;
* [ ] **Infraestructura DNS & CDN:** Configurar zona DNS en Cloudflare y conectar repositorio a Cloudflare Pages;
* [ ] **Infraestructura Correo:** Configurar registros MX de Google Workspace, SPF (`include:_spf.google.com`), DKIM y DMARC en Cloudflare DNS;
* [ ] **WhatsApp:** Configurar número comercial y enlace universal `https://wa.me/` con prellenado contextual.

## Fase 1 — Contratos y Compuerta Soberana en Rust

* [ ] `data/company.json` (Fuente única NAP);
* [ ] `data/roles.json` (Contrato público bilingüe);
* [ ] `data/roles.copy.json` (Espejo interno del catálogo);
* [ ] inicializar micro-crate en Rust `crates/smat-gate`;
* [ ] implementar tests en Rust: paridad de roles, anti-fuga de SKUs, gate bilingüe D9;
* [ ] estructura de hoja operativa Google Sheets (`LEADS` y `EVENTS`);
* [ ] `families.csv`, `skus.csv` y `aliases.csv` en repo interno;
* [ ] `data/redirects.csv` con los 301 del sitio histórico.

## Fase 2 — Construcción del Site Bilingüe (Astro SSG)

* [ ] inicializar proyecto Astro con TypeScript y design tokens industriales;
* [ ] layouts bilingües (`BaseLayout.astro`) con inyección de metadatos y `hreflang`;
* [ ] conmutador de idioma `ES | EN`;
* [ ] **Rutas Español:**
  * [ ] home (`/`);
  * [ ] nosotros (`/nosotros/`);
  * [ ] contacto (`/contacto/`);
  * [ ] aviso de privacidad (`/aviso/`);
  * [ ] hub de bombeo (`/bombeo/`);
  * [ ] cuatro roles (`/bombeo/impulsor/`, `/bombeo/revestimientos/`, `/bombeo/sello/`, `/bombeo/soporte/`);
  * [ ] hub de flotación (`/flotacion/`).
* [ ] **Rutas Inglés (Espejo Bilingüe):**
  * [ ] home (`/en/`);
  * [ ] about (`/en/about/`);
  * [ ] contact (`/en/contact/`);
  * [ ] privacy (`/en/privacy/`);
  * [ ] pumping hub (`/en/pumping/`);
  * [ ] four roles (`/en/pumping/impeller/`, `/en/pumping/liners/`, `/en/pumping/seal/`, `/en/pumping/bearing-assembly/`);
  * [ ] flotation hub (`/en/flotation/`).

## Fase 3 — Contacto y Lead Ingestion

* [ ] componente de formulario estático con validación nativa, honeypot `website` y selector de urgencia de 3 niveles (Decisión 4-A);
* [ ] campo opcional para adjuntar fotografía de placa o requisición PDF (`image/*, .pdf`) (Decisión 5-A / `GOLD-139`);
* [ ] componente `SharePurchasing.astro` con botón dual en páginas de rol: `[ 📤 Forward to purchasing team / Compartir con compras ]` y `[ 📋 Request Corporate RFQ ]` (Decisión 1-A / `GOLD-132`, `GOLD-136`);
* [ ] endpoint de recepción serverless / webhook (Google Apps Script / Cloudflare Pages Function) (Decisión 7-A / `GOLD-140`);
* [ ] prueba de descarte silencioso de bots con HTTP 200;
* [ ] despacho de notificación a buzón de Google Workspace (`ventas@` y `contacto@`) con deep-link directo a la fila en Sheets;
* [ ] inserción automática de fila en hoja `LEADS` de Google Sheets con columnas canónicas y dropdown de estatus;
* [ ] botón WhatsApp contextual en páginas de rol (mensaje prellenado en ES y EN);
* [ ] páginas de acuse institucional `/acuse/` y `/en/thank-you/` con Folio único `SMAT-RFQ-YYYY-XXXX`, botón de impresión `@media print` para ERPs (Decisión 3-A / `GOLD-138`) y directiva `noindex`.

## Fase 4 — SEO Técnico y GEO para LLMs

* [ ] Schema.org JSON-LD multi-entidad (`MiningEquipmentSupplier`, `LocalBusiness`, `FAQPage` bilingüe);
* [ ] generación de `sitemap.xml` bilingüe con `xhtml:link` recíproco;
* [ ] `public/robots.txt` con permisos explícitos para bots de IA (`GPTBot`, `ClaudeBot`, `PerplexityBot`);
* [ ] redacción y publicación de `public/llms.txt` y `public/llms-full.txt`;
* [ ] generación de `_redirects` para Cloudflare Pages;
* [ ] verificación de dominio en Google Search Console vía TXT DNS.

## Fase 5 — Operación y Pruebas Reales

* [ ] prueba de contacto simulada en español e inglés;
* [ ] verificar que el lead llegue a Google Sheets y a Google Workspace en $<30$ segundos;
* [ ] registrar primer contacto humano manual (`first_human_touch_at`);
* [ ] medir tiempo de respuesta del mismo día laboral;
* [ ] registrar nuevo vocabulario detectado en campo.

## Fase 6 — F0 (Catálogo Privado)

En paralelo, sin UI pública:

* [ ] export histórico de catálogo;
* [ ] normalización de plantas, familias, aliases y lead times;
* [ ] revisión humana de datos privados.

## Fase 7 — Mapa

Sólo cuando existan eventos nuevos suficientes y el negocio lo requiera.

## Fase 8 — Physics

Sólo ante caso real de bombeo que requiera cálculo hidromecánico.

---

# 42. Definition of Done del Site

El Site está formalmente terminado y listo para producción cuando:

* `smatminerals.com` está desplegado en Cloudflare Pages con SSL/TLS activo y HTTP/3;
* los Nameservers en GoDaddy apuntan a Cloudflare y los registros de Google Workspace (MX, SPF, DKIM, DMARC) están verificados;
* el sitio funciona de forma simétrica y completa en **Español** e **Inglés** (`/` y `/en/`);
* las etiquetas `<link rel="alternate" hreflang="...">` son recíprocas en todas las páginas y en el sitemap;
* el visitante técnico o comprador minero (mexicano o extranjero) comprende la oferta de SMAT en $<15$ segundos;
* el botón de WhatsApp abre la conversación con el rol y contexto pre-llenado en la lengua correspondiente;
* el formulario estático valida datos, bloquea spam mediante honeypot y deposita el lead en Google Workspace y Google Sheets;
* los manifiestos `/llms.txt` y `/llms-full.txt` están activos y son válidos para agentes de IA;
* `robots.txt` permite el rastreo de Google, Bing y los principales LLMs (GPTBot, ClaudeBot, PerplexityBot);
* la compuerta soberana en Rust (`cargo run --bin smat-gate`) corre y aprueba con código 0 todas las invariantes:
  - paridad estricta entre `roles.json` y `roles.copy.json`;
  - cero presencia de SKUs, precios o marcas no autorizadas en el frontend;
  - completitud bilingüe de todos los roles y copys;
  - integridad de datos NAP en `company.json`;
* redirects 301 están activos protegiendo el patrimonio de URLs históricas;
* Search Console está configurado con sitemap indexado;
* no hay ninguna dependencia de SMAT Mapa ni de smat_physics_core;
* no existe `/paileria/`, `/ingenieria/`, CRM externo ni base de datos pública expuesta.
* no existe CRM oculto;
* no existe API pública hacia datos privados.

---

# 43. Definition of Done del contrato

Debe poder ocurrir:

```text
?intent=pieza&role=impulsor&via=web
```

y producir:

```text
intent=pieza
role=impulsor
via=web
```

Debe existir:

```text
roles.json
```

como fuente pública.

Debe existir:

```text
roles.copy.json
```

como espejo privado.

Debe fallar el build si los IDs divergen.

Debe existir:

```text
LEADS
EVENTS
CATALOG_SEED
```

en la operación inicial.

Debe poder crearse:

```text
lead
```

sin aplicación.

Debe poder existir:

```text
plant_text
```

sin planta canónica.

Debe poder existir:

```text
sku_hipotesis
```

sin convertirla todavía en SKU definitivo.

---

# 44. Métricas

## 44.1 Site

El Site no se optimiza por:

* número de páginas;
* número de formularios;
* páginas vistas;
* tiempo en página;
* catálogo indexado.

## 44.2 Negocio

La hoja/registro operacional mide:

* número de leads;
* % con `first_human_touch_at` dentro del mismo día laboral;
* % con `first_useful_response_at` dentro del mismo día;
* `nuevo`;
* `en_conversacion`;
* `cotizado`;
* `ganado`;
* `perdido`;
* `pricing_class`;
* contexto;
* urgencia;
* business_context;
* role;
* planta;
* vocabulario nuevo.

## 44.3 Search Console

Sólo para entender:

* cómo encuentran a SMAT;
* términos de marca;
* términos de oficio;
* jerga real;
* oportunidades de contenido.

No es el instrumento principal de negocio.

---

# 45. Expansión sin duplicación

Cuando una nueva línea entre al negocio:

```text
nuevo business_context
      ↓
nuevos role_id
      ↓
mismo intent
      ↓
mismo lead
      ↓
mismo sistema de contacto
      ↓
mismo modelo interno
```

No se crea:

```text
otro CRM
otro formulario
otro catálogo
otra base
otro WhatsApp
otro NAP
otra lógica de leads
```

El objetivo de esta arquitectura es que la expansión sea:

```text
incremental
```

y no:

```text
reinicio de plataforma
```

---

# 46. Regla contra la expansión prematura

No se crea una nueva página únicamente porque existe una palabra dentro de:

* un documento;
* una factura;
* una conversación;
* un PRD arqueológico.

La nueva URL necesita:

1. demanda o recurrencia;
2. claridad semántica;
3. copy útil;
4. relación con el negocio;
5. dueño en `roles.json` o nueva decisión explícita.

La nueva línea comercial necesita evidencia separada de la mera existencia del concepto.

---

# 47. Principio de reutilización

Cuando un desarrollador encuentre código existente:

```text
¿puede reutilizarse?
```

Primero se intenta:

```text
REUSE
```

si no:

```text
ADAPT
```

y sólo entonces:

```text
REJECT
+
nueva implementación
```

La nueva implementación debe registrar:

* qué existía;
* qué se reutilizó;
* qué se descartó;
* por qué.

---

# 48. Principio de una sola fuente de verdad

Cada tipo de información debe tener un dueño.

```text
company.json
→ identidad pública

roles.json
→ role_id público

LEADS
→ oportunidades

EVENTS
→ hechos

catalog
→ productos privados

price_events
→ cotizaciones reales

redirects.csv
→ redirects

CONCEPT-REGISTRY
→ gobierno conceptual
```

Una copia no se convierte automáticamente en otra autoridad.

---

# 49. Principio de seguridad

La superficie pública contiene únicamente la información necesaria para:

* reconocimiento;
* comprensión;
* contacto;
* confianza básica.

No contiene la información que da ventaja comercial interna:

```text
SKU
OEM
precio
margen
stock
materiales exactos
geometrías
clientes
historial
alias privados
equivalencias
lead times privados
```

El Site debe poder ser rastreado por buscadores sin que ese rastreo revele el backend comercial.

---

# 50. Principio de continuidad

La secuencia estratégica es:

```text
SITE
↓
CONTACTO
↓
LEAD
↓
EVENTS
↓
MEMORIA
↓
CATÁLOGO PRIVADO
↓
PRECIO
↓
PEDIDO
↓
MAPA
↓
CAPITAL / INVENTARIO
↓
PHYSICS CUANDO APLIQUE
```

No:

```text
SITE
↓
MEGA-PORTAL
↓
CRM
↓
ERP
↓
SIMULADOR
```

---

# 51. Mandato al implementador

> **No empieces programando. Empieza leyendo.**

Antes del primer componente:

1. leer `PRD_smatminerals_site.md`;
2. leer `ARHEOLOGY.md`;
3. leer `DEPENDENCIES.md`;
4. leer `CONCEPT-REGISTRY.md`;
5. revisar `prd.smat.mapa.v1.md`;
6. revisar `standard.smat.pumps.v1.md`;
7. inspeccionar `smat_physics_core` si la tarea es técnica;
8. revisar patrimonio WordPress cuando la tarea sea SEO/contenido;
9. clasificar REUSE / ADAPT / REJECT;
10. implementar únicamente el alcance Site de este PRD.

No se debe:

* reimplementar una capacidad existente sin revisión;
* importar la UI del cementerio;
* conectar el Site con datos privados;
* crear catálogo público;
* crear CRM;
* crear un endpoint público hacia base interna;
* crear URLs por jerga;
* crear `/paileria/`;
* crear `/ingenieria/`;
* construir Mapa para poder publicar Site;
* construir Physics para poder publicar Site.

---

# 52. Regla final

> **SMAT Site debe ser pequeño deliberadamente y, al mismo tiempo, arquitectónicamente preparado.**

Pequeño en superficie pública.

Preparado en contratos.

Protegido en datos.

Conectable con el futuro.

Sin duplicar esfuerzos históricos.

La lógica general queda:

```text
PUBLIC
role / intent / contact

OPERACIÓN
lead / events

PRIVADO
plant / aliases / SKU / price

MEMORIA FUTURA
Mapa

TÉCNICA FUTURA
Physics
```

Cada capa puede crecer sin absorber a las demás.

---

---

# 53. Matriz Canónica de las 10 Decisiones Calibradas de Implementación y Frontera Comercial

Para blindar la propiedad intelectual de la empresa (sin regalar ingeniería a competidores), ofrecer mínima fricción al cliente minero, incorporar la oferta dual (**CapEx de equipos completos** + **OpEx de refaccionamiento crítico**), habilitar un flujo de trabajo amigable para marketing (Karla) y operar bajo **presupuesto estrictamente cero ($0.00 USD/mes)**, se fijan canónicamente las siguientes 10 decisiones respaldadas por los benchmarks auditados en `research` ([DOSSIER_052](file:///C:/Users/52331/Documents/Proyectos/research/dossiers/DOSSIER_052_github_universe_benchmarks_10_decisiones_calibradas_smat.md) y [DOSSIER_053](file:///C:/Users/52331/Documents/Proyectos/research/dossiers/DOSSIER_053_github_universe_benchmarks_marketing_portal_and_multivertical_geo_smat.md)):

---

### Decisión 1-A: 3 Hubs de Proceso con Pestaña Dual y Escalabilidad a Molienda
* **Diagnóstico Operativo:** SMAT no es una tienda de tornillos ni un simple taller de refacciones de bombas; suministra equipos completos y refaccionamiento para circuitos clave de planta.
* **Resolución:** Estructuración del catálogo en 3 Hubs de Proceso canónicos: `/bombeo/`, `/flotacion/` y `/filtracion/`. Cada uno cuenta con dos vistas limpias:
  1. *Equipos Completos (CapEx):* Bombas completas en skid montado con motor y transmisión, Celdas de flotación completas (línea activa), y Filtros prensa para desaguado de jales/concentrados.
  2. *Refacciones Críticas y Mecanismos (OpEx):* Impulsores A05/hule, volutas, sellos mecánicos, ensambles de rodamientos, mecanismos rotor-estator y telas/placas.
  *Arquitectura escalable desde la raíz para incorporar Molienda (`/molienda/`: forros y blindajes de molinos) sin modificar la estructura del sitio.*
* **Benchmarks:** `GOLD-136` ([`bagisto/b2b-ecommerce`](https://github.com/bagisto/b2b-ecommerce)), `GOLD-137` (`quote_only_catalog_mode`).

---

### Decisión 2-A: Fichas Paramétricas Comerciales con Mesura (Protección Estricta de IP)
* **Diagnóstico de Seguridad/Competencia:** Exponer curvas de diseño, planos de taller o cálculos de balance de masa en la web regala ingeniería de 20 años a competidores y scrapers. El cliente industrial busca certidumbre dimensional básica, no un libro de texto.
* **Resolución:** *"Solo enseñar una parte de la pierna"*. La web únicamente muestra rangos comerciales estándar: series dimensionales (4x3 a 10x8), volúmenes de celda ($ft^3 / m^3$), presión de placa y opciones de aleación (A05 / Caucho natural). **Cero curvas completas públicas, cero planos de fabricación y cero tolerancias de taller.** Planos de ensamble y balances de masa finos se entregan exclusivamente bajo RFQ formal firmado con membrete de la mina.
* **Benchmarks:** `GOLD-133` ([`inventree/InvenTree`](https://github.com/inventree/InvenTree) / `friction_membrane`), `GOLD-135` ([`sirwart/ripsecrets`](https://github.com/sirwart/ripsecrets)).

---

### Decisión 3-A: Selector Guiado en 3 Pasos con Máquina de Estados Finitos (Cero Fricción)
* **Diagnóstico UX/Conversión:** Un formulario largo con 12 preguntas de ingeniería espanta al 80% de los supervisores en mina; un botón plano de WhatsApp atrae mensajes difusos que colapsan al vendedor.
* **Resolución:** Embudo de cotización guiado en 3 pasos ("Túnel de 30 Segundos") implementado en Vanilla JS con Máquina de Estados Finitos (FSM, <4 KB, `GOLD-149`):
  * *Paso 1 (Intención):* `[ 🚨 Paro Crítico / Refacción Urgente ]` vs `[ 🏭 Proyecto / Equipo Completo ]`.
  * *Paso 2 (Parámetro Básico):* Modelo/diámetro para refacción, o circuito/capacidad para equipo. Incluye siempre el botón visible de escape técnico: `[ ❓ No estoy seguro, requiero asesoría técnica ]`. Micro-campo opcional para capturar jerga (`vocabulario_candidato`).
  * *Paso 3 (Salida):* WhatsApp preformateado en 1 toque o Correo institucional a Sheets.
* **Benchmarks:** `GOLD-149` ([`HardikKhandal01/apexgrowth-lead-funnel`](https://github.com/HardikKhandal01/apexgrowth-lead-funnel), `iggydotdev/b0nes`).

---

### Decisión 4-C: Legado "Solid Mechanical Advanced Technologies" Implícito y Natural
* **Diagnóstico de Marca:** Imponer el nombre completo histórico de 20 años como eslogan publicitario o cambiar el dominio comercial satura al usuario y suena anacrónico; borrarlo desprecia 20 años de pedigrí de ingeniería familiar.
* **Resolución:** El dominio canónico permanece `smatminerals.com`. El concepto *Solid Mechanical Advanced Technologies* actúa como un **sustrato de autoridad técnica orgánico e implícito**: aparece en la sección Nosotros, en el pie de página institucional, y en los esquemas estructurados de Schema.org (`legalName` y `knowsAbout`), reforzando la percepción de fabricante OEM con historia regional sin estorbar la agilidad comercial.
* **Benchmarks:** `GOLD-141` (`schema_org_graph_generator`).

---

### Decisión 5-A: Celdas de Flotación por Volumen Estándar y Mecanismos Suspendidos
* **Diagnóstico Comercial:** SMAT está vendiendo celdas de flotación completas activamente hoy en día. Ocultarlas o reducirlas a piezas sueltas es un error de ingresos.
* **Resolución:** En `/flotacion/` se presentan:
  1. Celdas completas mecánicas sub-aireadas por volumen estándar ($ft^3$ y $m^3$) para etapas Rougher, Cleaner y Scavenger en circuitos polimetálicos.
  2. Mecanismos suspendidos de repuesto (eje, rotor y difusor/estator vulcanizados en elastómero o fundidos en A05) diseñados para inserción directa en tanques de planta existentes.
* **Benchmarks:** `GOLD-136` (`b2b_role_delegation`), `GOLD-137` (`quote_only_catalog_mode`).

---

### Decisión 6-A: Filtros Prensa Bajo Especificación de Proyecto y Repuestos Críticos
* **Diagnóstico de Expectativa:** Prometer filtros prensa con entrega inmediata en 48 horas cuando se fabrican o configuran bajo pedido de proyecto causaría incumplimiento comercial.
* **Resolución:** En `/filtracion/` se posiciona con total honestidad comercial:
  1. Suministro de filtros prensa de placas y marcos / cámara empotrada para desaguado de concentrados y jales secos (*dry tailings*), cotizados bajo especificación técnica y tiempos de entrega de proyecto.
  2. Suministro ágil de repuestos de alto desgaste: telas filtrantes de polipropileno según corte granulométrico, placas filtrantes y empaques hidráulicos.
* **Benchmarks:** `GOLD-136` (`b2b_role_delegation`).

---

### Decisión 7-A: Identificador Visual Rápido de Daño Operativo (Cero Clases Teóricas)
* **Diagnóstico de Contenido:** El sitio no es un libro de fluidos de la universidad; los ingenieros de mina no quieren teoría de cavitación, quieren que su bomba o celda no se destruya cada 3 semanas.
* **Resolución:** En `/diagnostico/`, se despliegan únicamente 4 tarjetas visuales directas basadas en síntomas operativos reales:
  1. *Impulsor carcomido / deshecho prematuramente (Abrasión severa / Cavitación).*
  2. *Desgaste acelerado en rotor o difusor de celda de flotación.*
  3. *Fuga constante en caja de sello o sobrecalentamiento de rodamientos.*
  4. *Otra falla o síntoma mecánico no listado (con consulta libre).*  
  Cada tarjeta conduce en 1 clic a WhatsApp para enviar foto de la pieza dañada al taller de Durango para recomendación de aleación o rediseño.
* **Benchmarks:** `GOLD-143` ([`kiroboio/react-flow`](https://github.com/kiroboio/react-flow) / `data-driven-troubleshooting`).

---

### Decisión 8-A Calibrada: Presencia Física Sobria y Validación Logística (Cero Presunción)
* **Diagnóstico Cultural:** Los superintendentes y contratistas de la región ya conocen o visitan las instalaciones en Durango; armar una galería fotográfica pretenciosa para "presumir el taller" luce falso y poco profesional en el medio minero norteño.
* **Resolución:** Autoridad física transmitida mediante hechos logísticos y puertas abiertas:
  * **Insignia de Retiro Directo en Almacén / Taller (Local Pick-up):** Mariano Salas #114, Col. Primer Presidente, Durango, Dgo.
  * **Protocolo de Verificación en Presencia del Cliente:** Mención sobria de disponibilidad para inspección dimensional y protocolo de balanceo dinámico previo al embarque.
  * Datos NAP físicos verificables y teléfonos locales con lada (618). Cero poses publicitarias; 100% seriedad industrial.
* **Benchmarks:** `GOLD-145` (`smat::trust::regional_mining_proof`), `DOSSIER_053`.

---

### Decisión 9-A: Clasificación Automática de Leads (`[🚨 PARO]` vs `[🏭 PROYECTO]`)
* **Diagnóstico Operativo:** Evitar que el equipo técnico en Durango se desborde o atienda tarde una bomba parada por estar calculando una cotización de proyecto de 6 meses.
* **Resolución:** El enlace web inyecta el prefijo automático en el mensaje:
  * `[🚨 PARO DE EMERGENCIA / REFACCIÓN]` ➔ Notificación prioritaria push dual; SLA de atención humana: **<15 minutos**.
  * `[🏭 PROYECTO / EQUIPO COMPLETO]` ➔ Registro en hoja para dimensionamiento de ingeniería; SLA formal: **24 a 48 horas**.
  * Más alarma compartida a las 15:45 para revisión de pendientes. Costo $0.
* **Benchmarks:** `GOLD-131` (`Google Workspace Lead Bridge`), `GOLD-140` (`deep_link_row_target`).

---

### Decisión 10-A: Compuerta Soberana en Rust Pre-Build (`crates/smat-gate`)
* **Diagnóstico de Integridad:** Garantizar que no queden páginas rotas, SKUs huérfanos, textos en inglés sin traducir o datos comerciales privados filtrados.
* **Resolución:** Micro-crate soberano en Rust nativo (`crates/smat-gate`) ejecutado en pre-build:
  1. *Paridad Bilingüe:* Cada ruta, equipo y refacción en español debe existir de forma simétrica en inglés.
  2. *Escáner Regex Anti-Leak:* Bloqueo estricto de SKUs privados, precios de compra y variables internas de costo.
  3. *Verificación Anti-Huérfanos:* Cero textos con "Lorem Ipsum", "TBD" o enlaces rotos (estilo `lychee`).
  4. *Integridad NAP:* Corroboración de consistencia de dirección y teléfonos en Schema.org y pie de página.
  *Cualquier discrepancia cancela el despliegue con código de salida 1.*
* **Benchmarks:** `GOLD-135` ([`sirwart/ripsecrets`](https://github.com/sirwart/ripsecrets)), `GOLD-142` ([`lycheeverse/lychee`](https://github.com/lycheeverse/lychee)).

---

# 54. Resumen ejecutivo del MVP

El MVP de `smatminerals.com` queda formalmente definido como:

```text
Arquitectura Estática Pura (Astro SSG en Cloudflare Pages, $0/mes, <50ms TTFB)
+
3 Hubs de Proceso Bilingües (/bombeo/, /flotacion/, /filtracion/ con vista dual CapEx/OpEx)
+
Escalabilidad Garantizada hacia Molienda (/molienda/)
+
Embudo FSM en 3 Pasos con Mínima Fricción (GOLD-149: Vanilla JS <4 KB, WhatsApp + Sheets)
+
Portal de Edición Visual de Marketing para Karla en /admin (GOLD-148: Sveltia CMS Git-based, $0/mes)
+
Previsualizaciones Automáticas en Vivo por Rama (Cloudflare Pages Preview Deployments)
+
GEO & Silos Semánticos para LLMs (/llms.txt modular + Schema.org @graph por vertical)
+
Ingesta Multimodal Serverless hacia Google Drive (GOLD-139: fotos de placas y requisiciones)
+
Presencia Física Sobria (Retiro en taller Mariano Salas #114 e inspección en presencia de cliente)
+
Compuerta Soberana de Integridad en Rust (crates/smat-gate)
+
Dominio y DNS Gestionados (GoDaddy titular + Cloudflare DNS)
+
Correo Corporativo y CRM Operativo (Google Workspace + Google Sheets LEADS)
+
Fuentes de Verdad Desacopladas (data/company.json + data/roles.json + private catalog)
```

No requiere para publicar:
* Servidores dedicados ni bases de datos de pago;
* Formularios engorrosos de 15 campos de cálculo;
* Chatbots de IA en frontend;
* Exposición de curvas hidráulicas o planos de taller que comprometan la IP.


---

# 55. Fuente de Verdad y Gobierno Soberano

**Fuente de verdad del Site:**

```text
PRD_smatminerals_site.md (v2.2 Canónica Pre-Lanzamiento)
```

**Dominio Canónico:**

```text
https://smatminerals.com/ (Español)
https://smatminerals.com/en/ (Inglés)
```

**Documentos arqueológicos de contexto:**

```text
ideas/SMAT-MAPA-PRD-v1.md
smat-info.md
```

**Activo técnico cuantitativo desacoplado:**

```text
smat_physics_core
crates/smat-gate (20 Invariant Gates)
```

**Regla de gobierno soberano:**

> **Consultar primero. Reutilizar cuando corresponda. Adaptar cuando sea necesario. Rechazar lo que contradiga la arquitectura. Crear de nuevo sólo cuando no exista un activo utilizable.**

---

# 56. Arquitectura Canónica Pre-Lanzamiento v2.2 (10 Decisiones Ratificadas)

1. **Decisión 1-B (Favicon SVG Vectorial Dinámico + Fallback ICO):** `public/favicon.svg` con isotipo vórtice SMAT y `@media (prefers-color-scheme: dark)` interno (`#051B2E` en modo claro, `#4FAEEB` en modo oscuro), con fallback binario multi-resolución `public/favicon.ico`.
2. **Decisión 2-B (Banner Editorial de Marca 1200x630):** `public/images/og-card.jpg` (100.2 KB, `<300 KB`) en Deep Mineral Navy con credenciales de Durango para desenrollado instantáneo en WhatsApp/LinkedIn.
3. **Decisión 3-B (Normalización Estructurada Completa Schema.org):** Grafo JSON-LD multi-entidad `@graph` con `LocalBusiness`, `WholesaleStore`, coordenadas de Durango (`24.0277, -104.6532`), catálogo formal de 4 circuitos y horario de planta.
4. **Decisión 4-B (Botón Secundario de Cotizador "Enviar por Correo"):** Botón `#wb-email-btn` / `#btn-quote-mailto` enlazado a `formatMailtoUrl` para emisión de requisición RFC 6068 formal a departamentos de Compras/SAP.
5. **Decisión 5-B (Telemetría Condicional y Cero Cookies):** GA4 condicionado estrictamente a `PUBLIC_GA_ID` en `BaseLayout.astro`. Cero dependencias invasivas de terceros; soporte nativo de Cloudflare Web Analytics en el edge.
6. **Decisión 6-A (Panel Sveltia CMS Blindado):** `/admin` protegido con `Disallow: /admin` y `Disallow: /admin/` en `robots.txt` y `<meta name="robots" content="noindex, nofollow">` en `public/admin/index.html`.
7. **Decisión 7-B (Service Worker PWA Network-First con Purga de Versiones):** `public/sw.js` con estrategia Network-First para navegación HTML, Cache-First para estáticos, y purga automática de caches obsoletos bajo la versión `smat-pwa-v2.1`.
8. **Decisión 8-B (Acuse de Recibo Formal y Redirección Asíncrona):** Despacho por WhatsApp en pestaña nueva (`window.open`) y redirección de la pestaña matriz a `/acuse?folio=...` con ficha técnica A4 imprimible.
9. **Decisión 9-B (Honestidad Operativa y Cero Servicios de Emergencia Engañosos):** Erradicación absoluta de claims de "servicio 24/7" o "emergencias nocturnas". Horario formal de planta: Lunes a Viernes de 08:00 a 18:00 CST con "Kits de Paro Prioritario".
10. **Decisión 10-B (Comando Unificado Preflight y Seguridad en Cloudflare Pages):** `public/_headers` con CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, y script unificado `"preflight": "astro check && npm test && npm run gate && astro build"` con 20 compuertas deterministas en Rust (`crates/smat-gate`) y 142 pruebas en Node.js.


