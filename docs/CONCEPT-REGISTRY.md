# Registro Canónico de Conceptos (Anti-Huérfanos) — SMAT Minerals

Este documento establece la propiedad, fuente de verdad y consumidores de cada concepto técnico activo para evitar elementos huérfanos o desalineados:

| Concepto | Tipo | Fuente de Verdad | Dueño | Consumidores |
|---|---|---|---|---|
| `role_id` | Identificador Técnico | `data/roles.json` | Ingeniería SMAT | `DualHubView.astro`, `QuoteWizard.astro`, `SharePurchasing.astro`, `smat-gate` |
| `intent` | Intención de Cotización | Formulario RFQ | Operaciones / Ventas | `QuoteWizard.astro`, Eventos GA4 (`lead_paro_urgente`, `lead_proyecto_capex`) |
| `urgency` | Nivel de SLA | `data/diagnostics.json` | Planta Durango | WhatsApp Deep Link, Asistente de Cotización |
| `metallurgy` | Atributo Físico | `data/roles.json` | Ingeniería de Materiales | Fichas técnicas, `SharePurchasing.astro`, `llms-full.txt` |
| `decision_criteria` | Reglas y Límites de Pulpa | `data/roles.json` | Ingeniería de Procesos | `DualHubView.astro`, Fichas de rol, `smat-gate` (Gate D10) |
| `circuits` | P&ID Nodos y Fallas | `data/circuits.json` | Metalurgia Regional | `CircuitNavigator.astro`, `index.astro` (Decisión 1-A) |
| `trust_charter` | Pacto y Límites de Planta | `data/trust.json` | Dirección Comercial | `TrustMatrix.astro`, `/garantia/`, `/en/warranty/` (Decisión 2-A) |
| `field_cases` | Evidencia de Servicio Severo | `data/cases.json` | Ingeniería de Aplicaciones | `CaseCards.astro`, `index.astro` (Decisión 5-A) |
| `faqs` | Preguntas Frecuentes GEO | `data/faqs.json` | Marketing Técnico | `BaseLayout.astro` (Schema.org `FAQPage`) (Decisión 9-A) |
| `print_receipt` | Folio Formal para ERP | URL Params / Local | Compras / Facturación | `/acuse/`, `/en/thank-you/`, `smat-gate` (Gate D11) |
| `NAP` | Identidad Física | `data/company.json` | Dirección Legal | `Footer.astro`, `contacto.astro`, Schema.org, `smat-gate` |
| `301 Mappings` | Enrutamiento SEO | `data/redirects.csv` | Marketing / SEO | `public/_redirects`, `smat-gate` |
| `locale_pref` | Estado de Idioma | `localStorage` / Browser | Front-end | `BaseLayout.astro` (Micro-script Zero-FOUC), `Header.astro` |
