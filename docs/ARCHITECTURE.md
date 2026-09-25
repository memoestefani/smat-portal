# Arquitectura del Sistema Web — SMAT Minerals v2.3

## 1. Visión General
El sitio web de **SMAT Minerals (`smatminerals.com`)** está concebido como una arquitectura desacoplada, estática y sin servidor ($0.00 USD/mes), orientada al rendimiento extremo ($<50$ ms TTFB), a la confianza institucional y a la conversión sin fricción de leads B2B en la industria minera de Norteamérica.

## 2. Diagrama de Capas

```text
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO EN PLANTA / MINA                 │
│              (Navegador Móvil / Desktop con guantes)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 CAPA DE BORDE (EDGE HOSTING)                │
│                 Cloudflare Pages (Zero-Cost)                │
│   ├── 40 Páginas HTML SSG precompiladas por Astro 5         │
│   ├── Catálogo Digital Interactivo A4 (/catalogo/, /catalog/)│
│   ├── Reglas de redirección determinista (_redirects)       │
│   └── Sveltia CMS SPA (/admin/)                             │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        Web Worker (Partytown)          OAuth Proxy Worker
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    TELEMETRÍA ASÍNCRONA      │ │     ACCESO EDITORIAL        │
│   Google Analytics 4 (GA4)   │ │  Google Workspace Karla    │
│  - lead_paro_urgente         │ │  (karla@smatminerals.com)   │
│  - lead_proyecto_capex       │ │  ➔ Rama preview en GitHub   │
│  - rfq_forward_purchasing    │ └─────────────────────────────┘
└──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              PIPELINE PRIVADO DE INGENIERÍA                 │
│   - Despacho y planta en Mariano Salas #114, Durango        │
│   - Verificación dimensional y balanceo dinámico ISO G2.5   │
│   - Atención técnica especializada Lun-Vie 08:00 a 18:00    │
└─────────────────────────────────────────────────────────────┘
```

## 3. Principios Arquitectónicos
1. **SSG Puro (Static Site Generation):** Todo el árbol de 40 páginas se compila en tiempo de compilación. Cero bases de datos públicas expuestas, eliminando vectores de ataque e inyecciones SQL.
2. **Hermetismo de Secretos Industriales:** El árbol `site/` no contiene precios, costos, cuentas bancarias ni archivos privados de `ideas/`.
3. **Optimización en el Cliente (Client-Side Compression):** Las imágenes capturadas en mina se comprimen mediante HTML5 Canvas en memoria del cliente antes del envío (12 MB ➔ 250 KB en 40 ms), asegurando estabilidad en redes 3G lentas.
4. **Zero-FOUC Locale Switching:** Micro-script en `<head>` previene parpadeos de idioma redirigiendo síncronamente antes del primer render.
5. **Arquitectura de Ingesta Directa y Frontera UX (Novena Ola Estratégica):**
   - **Flujo Progresivo Natural del Cotizador:** Secuencia ergonómica desacoplada (Paso 01: Selección de Equipo/Refacción $\rightarrow$ Paso 02: Simulador de Pulpa Opcional $\rightarrow$ Paso 03: Identificación y Despacho) con emisión de Folio Institucional `SMAT-2026-XXXX`.
   - **Consola Bifronte y Dualidad de Comprador B2B:** Controles táctiles industriales de 48px para operadores en tajo móvil + Formateo en 1 clic de requisición en texto plano para SAP Ariba / Coupa / Oracle y Ficha Técnica oficial membretada `@media print`.
   - **Bypass de Urgencias Nocturnas (2:00 AM):** Enlace directo pre-cargado a WhatsApp de guardia de planta con foto de placa rota para paros de molienda y flotación sin forzar llenado de formularios.
   - **Consola Central Única & Deep-Linking Quirúrgico:** Eliminación de los 18 componentes `<QuoteWizard />` duplicados en las subpáginas de silo (`/bombeo/*`, `/flotacion/*`, `/filtracion/*`), sustituyéndolos por llamadas a la acción ligeras con deep-link a la consola central (`/?equipo=[slug]#rfq` y `/en/?equipo=[slug]#rfq`).
   - **Ecosistema Multiequipo Integral:** Homologación arquitectónica y jerárquica de Bombas de Pulpa Slurry, Celdas de Flotación y Filtros Prensa con lenguaje directo de materiales (High Chrome A05 >650 HB y elastómeros pesados), erradicando jerga abstracta ("metalúrgico").
   - **Estandarización Global en Lienzo Mineral Blanco Calizo (`#FAFAF9` / `#FFFFFF`):** 100% de las 40 rutas estáticas unificadas en fondo claro y tarjetas blancas de alto contraste y serenidad visual B2B.
   - **Simulador Durand en Acordeón Plegable (`<details class="durand-accordion">`):** Memoria de cálculo matemática disponible a 1 clic con 4 presets de pulpa (Molienda SAG, Flotación Sulfuros, Jales Espesados, Relaves Finos).
   - **Higiene de Propiedad Intelectual:** Cero marcas de terceros (`Warman`, `Denver`, `Metso`, `Outotec`); uso estricto de nomenclatura universal de ingeniería de procesos.
   - **Catálogo Digital Ejecutivo Móvil / A4 (`/catalogo/` y `/en/catalog/`):** 4 secciones de productos y logística con especificaciones dimensionales y soporte `@media print` A4.
   - **Preferencia de Canal de Respuesta & Pacto de Privacidad:** Elección entre llamada telefónica, WhatsApp de guardia o correo formal con PDF, garantizando cero acoso comercial.
   - **Event Bus Reactivo (`smat:workbench_update`):** Sincronización client-side desacoplada entre islas de Astro, el live dossier y la consola de exportación.
   - **Blindaje Soberano (`crates/smat-gate`):** 18 compuertas deterministas en Rust que auditan paridad de datos, cero secretos, simetría bilingüe, 40 rutas alcanzables, cero promesas falsas, lenguaje formal, higiene de transportistas e higiene de propiedad intelectual.
   - **Caché Local-First B2B (`localStorage.smat_user_profile`):** Reconocimiento inmediato de usuario recurrente con chip visual (*"👤 Reconociendo a: Ing. X"*).
   - **Enriquecimiento de Dominios Mineros (`data/mining_groups.json`):** Mapeo de 25 corporativos mineros mexicanos y autocompletado de unidades al ingresar correo institucional.
   - **Blindaje de Planta Durango y Protocolo de Banco de Pruebas:** Cláusula de validez en `/acuse/` y `/en/thank-you/` que ata la garantía al folio institucional `SMAT-2026-XXXX`, balanceo dinámico en banco de pruebas y verificación dimensional 1:1 en Mariano Salas #114.
   - **Ethos Under-Promise & Over-Deliver:** Atención técnica seria en horario laboral (Lun-Vie 08:00 a 18:00 CST) con respuesta ágil sin promesas engañosas ni reclamos de SLAs artificiales.
   - **Matriz TCO y Valor Diferencial:** Sección en portada que expone el retorno operativo fundamentado en 2.5x mayor resistencia al desgaste (A05 >650 HB), stock físico en Durango y acople 1:1 verificado en banco de pruebas.
   - **Poda de Debris UX y Desactivación de Colisión Visual:** `IntersectionObserver` que desvanece suavemente el botón flotante de WhatsApp dentro de la zona del cotizador para evitar traslapes visuales.



