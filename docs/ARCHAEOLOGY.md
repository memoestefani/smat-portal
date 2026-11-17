# Arqueología y Trazabilidad Conceptual — SMAT Minerals

## 1. Contexto Arqueológico
El proyecto SMAT Minerals cuenta con más de dos décadas de historia bajo la denominación fundacional **Solid Mechanical Advanced Technologies**. En la transición hacia su nueva infraestructura digital, se auditaron los activos preexistentes bajo el marco `REUSE / ADAPT / REJECT`.

## 2. Clasificación Canónica de Elementos Arqueológicos

| Elemento | Fuente Original | Clasificación | Justificación y Destino |
|---|---|---|---|
| **Logotipo SMAT** | `ideas/cropped-Logo-Smat-horizontal-1.jpg` | **ADAPT** | Se conserva la geometría de marca histórica, adaptándola a formatos modernos WebP/SVG con relación de aspecto nítida. |
| **Bases de Precios Históricas** | `ideas/SMAT_Catalogo_2025...csv` | **REJECT (Público) / REUSE (Privado)** | Se rechaza terminantemente su publicación en el sitio web para evitar canibalización o escaneo de márgenes por competidores. Se reserva para el backend privado de cotización. |
| **Cuenta BBVA / Balances** | `ideas/Cuenta BBVA...` | **REJECT** | Información financiera estrictamente confidencial. Aislada mediante compuerta de seguridad y script `clean_debris.ps1`. |
| **Identidad Solid Mechanical** | Legado 20+ años | **ADAPT** | Se utiliza como sustrato orgánico de autoridad en página Nosotros, footer y Schema.org, sin ser un eslogan publicitario rígido. |
| **Portal Editorial** | Requerimiento Karla | **ADAPT** | Implementado vía Sveltia CMS sobre rama `preview` con Google OAuth, incluyendo el catálogo de 19 SKUs (`data/quick_checkout_Catalog.json`). |
| **URLs WordPress Anteriores** | Historial 145+ URLs | **ADAPT** | Compiladas determinísticamente a redirecciones `301` de 1 salto (`1-hop`) en `public/_redirects` incluyendo `/catalogo/D075C21/` $\to$ `/catalogo/d075c21/`. |
| **PRDs e Inventarios Duplicados** | `site/prd_smatminerals_web.md` y `/inventario_smat.md` | **REJECT / PURGED** | Purgados en v3.7 (`DEB-V37-09` y `DEB-V37-11`) para garantizar Fuente Única de Verdad (SSOT) en `site/prd_smatminerals_web_v3.md` e `inventario/inventario_smat.md`. |
