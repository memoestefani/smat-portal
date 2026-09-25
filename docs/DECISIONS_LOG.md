# Registro Histórico de Decisiones Arquitectónicas y Comerciales (ADR) — SMAT Minerals

**Estatus:** Vigente  
**Fecha de Ratificación:** 23 de Septiembre de 2026  
**Alcance:** Capa Pública Web (`site/`) y Compuerta de Integridad en Rust (`smat-gate`)

---

## 🏛️ Matriz de las 10 Decisiones Estratégicas B2B

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1** | Navegación de Circuito (Concepto 3.3) | **1-A: Mapeo de 3 Circuitos Reales en SVG Semántico** | Elimina la "estatua bonita" y modelos 3D pesados. Provee un atajo sobrio de 3 circuitos mineros regionales conectando nodos de falla directamente con stock físico en Durango. |
| **2** | Certeza y Garantía Comercial | **2-A: Pacto de Certeza y Garantía en Patio Durango** | Matriz desacoplada en `data/trust.json`. Delimita qué cubre el taller local (balanceo dinámico ISO G2.5, ajuste milimétrico), qué cubre la fundición OEM y qué condiciones declinamos cotizar (estilo Vanta/Deel). |
| **3** | Segmentación Multi-Comprador | **3-A: Selector de Perspectiva por Rol en Home** | Conmutador interactivo sin recarga de página (Mantenimiento, Metalurgia, Compras) anclado al mismo inventario. Evita la fragmentación en micrositios aislados. |
| **4** | Fichas Técnicas como Sistemas de Decisión | **4-A: Bloque 'Criterio de Decisión y Límites'** | Cada uno de los 9 roles técnicos incluye variables requeridas de pulpa (SG, d80, pH), reglas de descarte (A05 vs Hule) y costo de mala selección evitado. |
| **5** | Prueba Técnica y Casos de Éxito | **5-A: Fichas de Campo Anonimizadas por Servicio Severo** | 3 reportes técnicos en `data/cases.json` por condición de pulpa y resultado medible sin violar convenios de confidencialidad (NDA) de grupos mineros. |
| **6** | Ingesta de Urgencias (Canal Fantasma) | **6-A: Triaje de Foto Rota con Compresión Canvas** | Compresión en memoria en 40 ms y derivación directa a WhatsApp con SLA < 45 min para turnos nocturnos de mina. |
| **7** | Cierre Formal de Requisición B2B | **7-A: Acuse Imprimible (@media print) con Folio ERP** | Resumen formal en `/acuse/` y `/en/thank-you/` con folio institucional `SMAT-2026-XXXX`, tabla ejecutiva y botón de impresión limpia para SAP Ariba, Coupa y Oracle. |
| **8** | Captura de Leads Serverless | **8-A: Formulario Dual con Honeypot 'website' y Apps Script** | Campo oculto anti-spam + script `tools/google_apps_script/Code.gs` listo para volcar atómicamente a Google Sheets con alerta Gmail ($0/mes, cero servidores). |
| **9** | Posicionamiento GEO y Schema.org | **9-A: Grafo JSON-LD con FAQPage y Breadcrumbs** | FAQs técnicas de tiempos de entrega en Durango y balanceo dinámico para Google AI Overviews + generación física de `sitemap.xml` con `@astrojs/sitemap`. |
| **10** | Blindaje y Cero Debris | **10-A: Expansión de smat-gate a 9 Compuertas en Rust** | Crate `crates/smat-gate` con 9 compuertas deterministas (auditoría de paridad, anti-fuga regex, simetría bilingüe, redirecciones 301, NAP, cero placeholders, criterios D10, vista impresa D11 y no-debris D12). |

---

## 🚀 Matriz de Decisiones Estratégicas B2B — Segunda Ola (Decisiones 1-A a 8-A)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-A** | Reconocimiento sin Fricción | **B2B Local-First Identity Cache** | Persistencia en `localStorage` (`smat_user_profile`) con chip visual (*"👤 Reconociendo a: Ing. X [Cambiar datos]"*). Permite cotizaciones subsecuentes en 1 clic sin contraseñas ni base de datos de usuarios ($0/mes). |
| **2-A** | Blindaje Anti-Coyote | **Sello de Taller Durango y Protocolo ISO 1940 G2.5** | Atado al folio institucional `SMAT-2026-XXXX`. Cláusula restrictiva de garantía válida exclusivamente para piezas con balanceo en banco y verificación dimensional 1:1 en patio Mariano Salas #114, neutralizando brokers informales. |
| **3-A** | Enriquecimiento de Dominio Minero | **Diccionario Estático de 25 Grupos Mineros (`mining_groups.json`)** | Autocompletado client-side por dominio corporativo (`@firstmajestic.com`, `@fresnilloplc.com`, etc.) con sugerencias de unidades operativas mineras sin costo de API ($0 USD/mes). |
| **4-A** | Segmentación en Portada | **3 Misiones Operativas de Planta** | Conmutador principal reorientado a intención real de mina: *🔥 Paro Inmediato*, *⚙️ Desgaste Recurrente / Proceso*, *📋 Requisición Formal / CapEx*, sincronizado con el catálogo y anclas P&ID. |
| **5-A** | Circuito P&ID Reactivo | **Nodos con Doble Acción y Deep-Link** | Cada nodo ofrece `[ Ver Ficha → ]` y `[ ⚡ Cotizar Refacción ]` con scroll suave a `#rfq` y preselección del equipo, más vinculación directa con casos de campo de 1,200 t/d. |
| **6-C** | Compromiso de Taller Sobrio | **SLA de Mismo Día Hábil y Línea 24/7 (Decisión Explícita 6-C)** | Erradicación total de afirmaciones dudosas de "< 45 minutos" en todo el portal. Sustituido por atención técnica especializada en el mismo día hábil (Lun-Vie 08:00 a 18:00 CST) y teléfono de guardia 24/7: (618) 810-4408. |
| **7-A** | Salida Multi-Canal sin Imposiciones | **Matriz Cuádruple de Exportación de Requisición** | Tras el peaje ligero: `[ 📋 Copiar Partidas ]` (portapapeles atómico con toast), `[ ✉️ Enviar por Correo ]` (`mailto:` estructurado), `[ 💬 WhatsApp ]` (directo no forzado) y `[ 🖨️ Acuse ERP ]` (`/acuse/` para SAP/Coupa). |
| **8-A** | Compuerta Soberana y Cero Debris | **10 Gates en Rust (`smat-gate`) y Cero Basura** | Gate D13 (`verify_mining_groups_dataset`), suite de pruebas nativas en Node (`npm test`), purga determinista con `tools/clean_debris.ps1`, 0 errores en `npm run check` y 36 rutas estáticas compiladas. |

---

## 💎 Matriz de Decisiones Estratégicas B2B — Tercera Ola: Frontera UX y Conversión por Gratitud (Decisiones 1-C a 8-C)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | Tipografía & Tono | **Fusión Híbrida "Executive Industrial"** | Trilogía tipográfica: *Newsreader Serif* (títulos institucionales y solvencia fiduciaria) + *Inter Sans* (controles ergonómicos de 48px y UI) + *JetBrains Mono* (tolerancias mm, dureza HB y folios serializados). |
| **2-C** | Paleta Cromática | **Deep Navy Frame & Technical Chalk Canvas** | Marco estructural `#0B132B`, lienzos de trabajo claros `#F8FAFC` con texto carbón `#0F172A`, y acentos en Cobre Forjado `#C25E00` y Verde Esmeralda Taller `#059669`. Centralizada en `src/styles/tokens.css` para calibración ágil de marca. |
| **3-C** | Arquitectura de Conversión | **Split Live Engineering Workbench** | Desaparición del formulario ciego. Interfaz dividida interactiva con renderizado en tiempo real de la Ficha Técnica Oficial membretada (`SMAT-2026-XXXX`) a medida que el usuario interactúa. |
| **4-C** | Generador de Gratitud Inmediata | **Micro-Simulador de Pulpa Durand-Condolios** | Motor matemático en cliente (`slurryEngine.js`) que calcula velocidad crítica $V_c$, riesgo de embancamiento y comparativa de vida útil A05 (>650 HB) vs Caucho antes de solicitar datos de contacto. |
| **5-C** | Descongestión de Portada | **Consola Central de Doble Entrada** | Dos compuertas de intención claras (*🔥 Paro Urgente de Planta* vs *⚙️ Circuito P&ID / CapEx*) que sincronizan el Workbench en un único flujo sin fatiga de scroll. |
| **6-C** | Blindaje Anti-Acoso | **Pacto de Privacidad y Cero Acoso Comercial** | Sello visual prominente que desarticula el miedo a llamadas insistentes garantizando que los datos son solo para trazabilidad de folio de taller y soporte solicitado. |
| **7-C** | Exportabilidad Cuádruple | **Suite de Exportación 1-Click para SAP/ERP** | Partidas en texto plano formateado, PDF membretado `@media print`, correo estructurado con folio y WhatsApp de guardia 24/7. |
| **8-C** | Cero Conceptos Huérfanos | **15 Compuertas Soberanas en Rust y Cero Debris** | Incorporación de Gates D14 (`verify_slurry_engine_module`) y D15 (`verify_design_tokens_and_workbench`), 9 unit tests en Node, 0 errores en Astro check y 36 rutas estáticas compiladas. |

---

## 🌟 Matriz de Decisiones Estratégicas B2B — Quinta Ola: Ingesta Directa, Catálogo Digital & Blindaje IP (Decisiones 1-C a 7-C Ratificadas)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | Hero & Ingesta Prioritaria | **B2B Executive Hero con Tarjeta de Identificación Rápida y Logística** | El comprador formal encuentra en la cabecera del Wizard los campos esenciales (Nombre, Mina/Empresa, Teléfono, Correo y Modalidad de Entrega) para entablar contacto sin fricción ni rodeos. |
| **2-C** | Memoria Hidráulica Durand | **Acordeón Plegable de Ingeniería (`<details class="durand-accordion">`)** | El simulador matemático Durand-Condolios se empaqueta de forma elegante: accesible en 1 clic para el superintendente de procesos o metalurgista, pero sin sobrecargar ni intimidar a la compradora de adquisiciones. |
| **3-C** | Selector de Misión & Paquetes | **Conmutador de Misión: Equipos Completos / Circuito vs Refacciones de Desgaste** | Se omite deliberadamente la palabra *"arranque"* para evitar reclamos de comisionamiento en sitio. Al seleccionar *Equipos Completos*, se despliega un checklist de paquete (Bomba en Skid, Celdas de flotación, Filtro prensa, Refacciones iniciales de desgaste). |
| **4-C** | Higiene de Propiedad Intelectual | **Cero Menciones de Marcas de Terceros & Nomenclatura Universal** | Erradicación total de marcas comerciales registradas ajenas (`Warman`, `Denver`, `Metso`, `Outotec`). Empleo estricto de terminología universal de ingeniería de procesos (*"Bombas centrífugas para lodos abrasivos y pulpas pesadas series 4x3 C a 10x8 F, acople dimensional estándar 1:1, bridas ANSI, A05 >650 HB"*). |
| **5-C** | Catálogo Digital Interactivo | **Catálogo Digital Móvil y PDF Imprimible A4 (`/catalogo/` y `/en/catalog/`)** | 4 secciones estructuradas (Bombeo, Flotación, Filtración, Logística de Planta) con series dimensionales, apto para consulta en celular en mina o descarga en PDF A4 para requisiciones internas, libre de datos bancarios sensibles. |
| **6-C** | Elección de Canal de Contacto | **Selector Libre de Canal de Respuesta & Pacto de Privacidad** | La compradora elige explícitamente cómo desea ser contactada (`[ 📞 Llamada telefónica ]`, `[ 💬 WhatsApp de guardia ]`, `[ ✉️ Correo formal con PDF ]`), respaldado por el Pacto de Cero Acoso Comercial ni llamadas spam. |
| **7-C** | Integridad Soberana & Cero Debris | **40 Rutas Estáticas, 18 Compuertas en Rust (`smat-gate`) y 24 Tests Node** | Expansión a 40 páginas estáticas simétricas ES/EN ($0/mes Cloudflare Pages), compuerta de higiene de marcas registradas (Gate D21), suite completa de 24 tests deterministas en Node y purga de debris con script powershell. |

---

## 🛡️ Matriz de Decisiones Estratégicas B2B — Sexta Ola: Saneamiento Operativo, Espejo Unidireccional & Rigor de Planta (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | Saneamiento de Reclamos ISO | **Balanceo Dinámico en Banco de Pruebas & Metrología Física** | Erradicación total de promesas formales de certificaciones ISO 1940 o certificados contractuales en el portal público. Sustituido por lenguaje técnico aterrizado de planta (*"Inspección dimensional 1:1, balanceo dinámico en banco de pruebas y aleación High Chrome A05 >650 HB"*). |
| **2-C** | Espejo Unidireccional Canónico | **ES $\rightarrow$ EN Unidirectional Mirror** | La versión en inglés (`/en/*`) es hija estricta y dependiente del modelo en español (`/*`). Ambas versiones mantienen 100% de paridad semántica, estructural y de navegación sin disonancias cognitivas. |
| **3-C** | Suministro & Stock Modulado | **Configuración Bajo Pedido vs. Refacciones en Rotación** | Claridad en la capacidad de suministro: bombas completas en skid, celdas de flotación y filtros prensa se ensamblan bajo pedido según las variables de pulpa del cliente; refacciones comunes de desgaste operan bajo rotación continua. |
| **4-C** | Cobertura Logística Nacional | **3 Modalidades desde Planta Durango** | Despacho a toda la República Mexicana desde Durango (*Retiro en Planta Central, Fletera Consolidada Ocurre, Flete Dedicado directo a mina*) con fletes y tiempos cotizados formalmente según destino. |
| **5-C** | Circuito Orientativo de Planta | **Checklist Orientativo de 4 Partidas** | Despliegue de opciones para proyectos de circuito (*Bomba en Skid, Batería de Celdas, Filtro Prensa, Paquete de Desgaste Inicial*), canalizando el dimensionamiento final al contacto técnico directo. |
| **6-C** | Poda de Verborrea Defensiva | **Tono B2B Industrial Positivo y Soberano** | Eliminación de quejas contra intermediarios y tecnicismos de software web innecesarios (*"local-first cache"*, *"declinamos cotizar"*). Adopción de un tono sobrio, fiduciario y acogedor para compradores mineros formales. |
| **7-C** | Catálogo Digital A4 Imprimible | **Catálogo con Series Dimensionales y Cláusula Técnica** | Documento web y PDF descargable con tablas de dimensionamiento estándar (series C, D, E, F) y cláusula de confirmación previa con departamento de ingeniería. |

---

## ⚡ Matriz de Decisiones Estratégicas B2B — Séptima Ola: Acompañamiento Técnico, Consola Adaptativa y Cero Fricción (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | Acompañamiento y Validación Técnica | **Cláusula de Validación de Compatibilidad Ligada a Propuesta Formal** | Se acogen con agrado datos de pruebas metalúrgicas de laboratorio, curvas de consumo y estudios de factibilidad (PEA) para validar compatibilidad y dimensionamiento con equipos SMAT. El soporte se vincula al suministro y cotización formal de equipos, evitando consultoría genérica desvinculada. |
| **2-C** | Consola Adaptativa por Intención | **Conmutador Inteligente CapEx vs OpEx en 1 Clic** | Al seleccionar *Equipos Completos / Circuito (CapEx)* se despliega el checklist de 4 partidas y se oculta la carga de fotos de piezas rotas. Al seleccionar *Refacciones de Desgaste (OpEx)* se activan la búsqueda por modelo y el triaje de fotos en 1 solo clic. |
| **3-C** | Matriz de Capacidades y Entregables | **Rangos Nominales + Anuncio de Entregables de Ingeniería de Detalle** | Exposición de rangos operativos estándar (50 a 300 ft³, bombas 4x3 a 10x8, filtros 800x800) y compromiso formal de entrega de memoria de cálculo hidráulica, planos preliminares de huella y propuesta económica formal al entablar contacto. |
| **4-C** | Logística Neutral de Corredores | **Corredores Logísticos Habituales con Terminología Neutral** | Retiro en Planta Central Durango, Fletera Consolidada Nacional Ocurre, y Flete Dedicado directo a mina o enlace multimodal marítimo a penínsulas (ej. Baja California Sur) sin nombrar marcas comerciales de fleteras privadas. |
| **5-C** | Acuse y Catálogo Técnico A4 | **Acuse Oficial (@media print) + Catálogo Técnico A4 en PDF** | Acuse institucional con folio `SMAT-2026-XXXX`, tabla ejecutiva de partidas y botón de impresión limpia, complementado con Catálogo A4 imprimible con series C, D, E, F y cláusula de banco de pruebas. |
| **6-C** | Libertad de Canal de Contacto | **Selector Tripartito de Canal Preferido & Pacto de Cero Acoso** | Canal de atención a libre elección del cliente (`[ 📞 Llamada telefónica ]`, `[ 💬 WhatsApp de guardia ]`, `[ ✉️ Correo formal con PDF ]`), con garantía expresa de no realizar llamadas no solicitadas ni prospección agresiva. |
| **7-C** | Integración de Equipos Especiales | **Soporte Sobrio y Natural para Equipos Fuera de Catálogo** | Enlace secundario discreto dentro del flujo de selección de equipo para cotizar requerimientos dimensionales específicos o equipos complementarios de circuito sin crear distracciones visuales. |

---

## 🏔️ Matriz de Decisiones Estratégicas B2B — Octava Ola: Ergonomía Editorial, Lienzo Mineral & Test Don Manuel (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | Navegación y Consola en Portada | **Consola Unificada en Home + Enrutamiento Limpio a Módulos Especializados** | Se elimina el sistema de pestañas pesadas (`mode-simulator`, `mode-circuits`, `mode-triaging`) que saturaba la portada. La consola `QuoteWizard` es la protagonista ergonómica central, complementada abajo por 2 tarjetas de enlace fluido a `/bombeo/` (P&ID interactivo) y `/diagnostico/` (Triaje de fallas mecánicas). |
| **2-C** | Simulador de Pulpa y Curvas de Desgaste | **Asistente Práctico "Simulador de Caudal y Desgaste de Pulpa" en Acordeón Inteligente** | El cálculo hidráulico se presenta como un asistente de planta opcional en acordeón (`#durand-accordion`). Provee 4 presets de 1 clic (Molienda SAG, Flotación Sulfuros, Jales Espesados, Relaves Finos), traduciendo variables complejas a impacto directo: velocidad crítica $V_c$, aleación recomendada A05 (>650 HB) y vida útil estimada en horas. |
| **3-C** | Paleta y Dirección de Arte Global | **Estandarización Global en "Lienzo Mineral Editorial" (`#FAFAF9` / `#FFFFFF`)** | Erradicación total de fondos oscuros fragmentados (`#121c2e`, `#0b111e`, `#0f172a`) en `/contacto/`, `/garantia/`, `/diagnostico/` y sus contrapartes en inglés. Todas las 40 rutas comparten una atmósfera luminosa, limpia y de alta legibilidad editorial B2B. |
| **4-C** | Jerarquía de Ficha Técnica y Salida | **Jerarquía de Exportación con Botón Rey PDF + Pastillas Secundarias** | El botón de descarga PDF oficial (`#wb-pdf-btn`, `.export-btn-king`) domina como acción principal en color cobre forjado (`#C25E00`), seguido de una fila de pastillas secundarias (`#wb-copy-btn` para SAP/PO, `#wb-whatsapp-btn`, `#wb-email-btn`). En móviles, una barra flotante inferior permite abrir el resumen deslizable en bottom-sheet. |
| **5-C** | Tono y Accesibilidad Lingüística | **Lenguaje de Taller y Mina Sobrio, Riguroso y Directo ("Test Don Manuel de 70 Años")** | Purga de tecnicismos web y software ajenos al operador o comprador de mina (`RFC 6068`, `Honeypot`, `LocalStorage`, `JSON-LD`). Se priorizan términos directos de campo: *"Refacciones de desgaste"*, *"Banco de pruebas en Durango"*, *"Caudal de pulpa"*, *"Dureza comprobada"*. |
| **6-C** | Propuesta de Valor y Retorno (TCO) | **Matriz de Reducción de Costo Operativo (TCO) en Portada** | Sección visual de 3 pilares estratégicos en el home: **2.5x Mayor Vida Útil** (colada High Chrome A05 >650 HB que reduce paros no programados), **Disponibilidad Inmediata desde Durango** (embarque sin demoras de aduana ni importación marítima) y **Acople 1:1 en Banco de Pruebas** (tolerancias verificadas para montaje directo en patio). |
| **7-C** | Poda de Debris UX y Colisión Visual | **Desactivación Reactiva de Botón Flotante de WhatsApp en Cotizador** | Mediante un `IntersectionObserver` de cero dependencias en `WhatsAppButton.astro`, el botón flotante de WhatsApp se oculta suavemente al hacer scroll dentro del área `#rfq` del cotizador, evitando sobreposición sobre los botones de exportación y ficha técnica. |

---

## 🏔️ Matriz de Decisiones Estratégicas B2B — Novena Ola: Multiequipo Integral, Frontera Apple-Tier y Calibración de Lenguaje de Mina (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | **Flujo Progresivo del Cotizador** | **Reordenamiento Progresivo Natural (01 Equipo $\rightarrow$ 02 Simulador $\rightarrow$ 03 Identificación/Despacho)** | Elimina la resistencia psicológica inicial. Don Manuel elige primero su equipo o refacción (Bombas, Celdas de Flotación o Filtros Prensa); el compromiso de identidad se realiza al sellar y emitir el folio `SMAT-2026-XXXX`. |
| **2-C** | **Dualidad de Comprador B2B** | **Consola Bifronte (Mina en Teléfono + PDF & Texto SAP para Adquisiciones)** | El operador en tajo utiliza controles táctiles amplios de 48px en móvil; la compradora de adquisiciones obtiene en 1 clic el bloque formateado de texto plano para pegar en SAP Ariba / Coupa y la Ficha Técnica PDF membretada. |
| **3-C** | **Urgencias de Tajo (2:00 AM)** | **Bypass de Emergencia Directo a WhatsApp de Guardia de Planta** | Botón prominente de foto de placa rota + enlace pre-cargado a WhatsApp de planta para resolver paros nocturnos de molienda y flotación sin obligar a llenar formularios. |
| **4-C** | **Ergonomía Táctil y Poda** | **Reubicación Just-in-Time y Selectores Concisos** | Traslado de la nota de laboratorio de mineral al interior del simulador; reducción del pacto de privacidad a 1 línea sobria bajo la exportación; condensación de textos en el selector de entrega (`#wb-destination`). |
| **5-C** | **Saneamiento de Subpáginas de Silo** | **Unificación en Lienzo Mineral (#FAFAF9) + Retiro de Cotizadores Duplicados** | Las 18 páginas de `/bombeo/*`, `/flotacion/*` y `/filtracion/*` (y sus contrapartes en inglés) se homologan al fondo claro `#FAFAF9` y tarjetas blancas `#FFFFFF`, retirando componentes `<QuoteWizard />` duplicados en favor de deep-links limpios a la consola central (`/?equipo=[slug]#rfq`). |
| **6-C** | **Comunicación TCO Sobria** | **Tríada de Capacidades Reales (Sin Falsas Promesas de Horas)** | Exposición de 3 capacidades reales: 1) **2.5x Mayor Resistencia al Desgaste** (aleación A05 >650 HB y elastómeros pesados); 2) **Stock Inmediato en Durango** sin esperas de aduana ni importación marítima; 3) **Acople 1:1 en Banco de Pruebas** verificado antes de salir a mina. Cero promesas falsas de "48 hrs garantizadas". |
| **7-C** | **Posicionamiento Multiequipo Integral** | **Ecosistema de Procesamiento de Minerales (Bombas, Celdas y Filtros)** | Redefinición del Hero H1 y subtítulo para abarcar con igual solvencia Bombas de Pulpa, Celdas de Flotación y Filtros Prensa. Sustitución sistemática del término abstracto *"metalúrgico"* por lenguaje directo de materiales, procesos de mineral y dureza. |
| **8-C** | **Prevención de Fugas de Leads** | **Ficha Oficial Membretada con Folio como Recompensa Fiduciaria** | El usuario entrega sus datos voluntariamente porque ve en tiempo real el valor de la Ficha Técnica membretada con folio institucional lista para su descarga e integración a compras. |

---

## 🏆 Matriz de Decisiones Estratégicas B2B — Décima Ola: Foco de Rendimiento Real, Opción C y Sanitización Total (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | **Banda Monumental de Rendimiento Real** | **Banda de 4 Columnas Fácticas (650+ HB, Stock Durango, 1:1 Fit, Mismo Día)** | Sustituye la sección TCO redundante y erradica afirmaciones de "2.5x mayor vida útil garantizada". Comunica 4 hechos duros verificables: dureza `650+ HB` en colada A05, despacho desde `Stock Durango`, verificación dimensional `1:1 Fit` en banco de pruebas y soporte de ingeniería en el `Mismo Día`. |
| **2-C** | **Ingesta de Equipos Especiales** | **Revelación Just-in-Time vía `<details class="custom-equip-details">`** | Elimina formularios paralelos. Don Manuel o el comprador pueden desplegar una sección limpia para especificar ciclones, agitadores o dimensiones especiales que se integran en tiempo real a la Ficha Técnica. |
| **3-C** | **Reubicación de Límites Técnicos** | **Matriz Completa en `/garantia/` + Micro-Compromiso en Home (`hideBoundaries={true}`)** | La matriz de rechazo exhaustiva se preserva en `/garantia/` y `/en/warranty/`; en Home se muestra una pastilla de micro-compromiso de 1 línea con enlace al protocolo completo. |
| **4-C** | **Poda Lingüística y Densidad (-30%)** | **Test Don Manuel de 70 Años con Datos Duros Preservados** | Reducción del 30% del volumen de palabras en subtítulos y explicaciones, conservando intactos los datos de ingeniería ($V_c$, HB, caudales, molienda, flotación). |
| **5-C** | **Selector Táctil de Canales** | **Segmented Control Táctil (`#wb-channel-selector`)** | 3 botones táctiles ergonómicos (`[ 💬 WhatsApp ] [ 📞 Llamada ] [ ✉️ Correo PDF ]`) con conmutación visual de 1 toque. |
| **6-C** | **Tarjetas Arquitectónicas Minerales** | **Tarjetas 100% Clickeables con Micro-Badges (`[ P&ID ]` y `[ DIAGNÓSTICO ]`)** | Fusión sinérgica de diseño mineral de tarjeta completa interactiva con badges de alto contraste. |
| **7-C** | **Retorno Operativo Fáctico** | **Ventajas Fácticas sin Falsas Garantías** | Todo beneficio se sustenta en propiedades metalúrgicas y stock físico local, sin promesas contractuales engañosas. |
| **8-C** | **Ficha Técnica & Folio Docked** | **Ticket Persistente en Desktop y Bottom-Sheet Deslizable en Móvil** | El Live Dossier y su folio `SMAT-2026-XXXX` permanecen visibles durante toda la interacción técnica. |
| **Opción C** | **Conciliación de Domicilio Fiscal y Almacén Central** | **Distinción Formal: Domicilio Fiscal (Facturación/Alta) vs Almacén Central Durango (Despacho)** | El domicilio de Mariano Salas #114 se formaliza para facturación (CFDI 4.0) y alta de proveedores en ERP. El Almacén Central y patio de carga en Durango se presentan como centro de distribución y entrega física coordinada mediante folio confirmado, eliminando el término erróneo "planta" y transparentando la operación. |
| **Sanitización** | **Sanitización de Datos de Clientes y Minas** | **Cero Nombres Propios Privados en Placeholders y UI Pública** | Erradicación total de referencias a personas o minas privadas (`Carlos Mendoza`, `Minera San Martín`, `First Majestic`, `Tayoltita`) en placeholders y variables por defecto, reemplazados por ejemplos genéricos industriales (`Ej. Ing. J. Pérez / Residente`, `Ej. Unidad Minera / Compañía`, `ejemplo@unidadminera.com`). |

---

## ⚡ Matriz de Decisiones Estratégicas B2B — Décima Primera Ola: Consolidación "The One", Tríada de Proceso y Erradicación de Debris (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-A** | Cintillo & Header | **Tríada de Proceso + Atención al Cliente** | `Header.astro` muestra `Equipos de Proceso y Refaccionamiento Crítico en Stock en Durango` y `Atención al Cliente: (618) 810-4408`. |
| **2-A** | Hero Principal | **Tríada de Materiales HD y 4 Pilares de Proceso** | H1 en `index.astro` centrado en Plantas Concentradoras y de Beneficio; 4 tarjetas (`3 Circuitos`, `Materiales HD`, `Stock Buffer`, `Acople 1:1`). |
| **3-A** | FlightDeck Workbench | **Hub de 3 Dimensiones de Ingeniería con Selector Visual** | Pestañas equilibradas para Bombeo de Pulpa, Celdas de Flotación y Filtración de Jales Secos que alimentan el mismo dossier. |
| **4-A** | QuoteWizard | **12 Roles Normalizados con Sanitización Completa** | Selector CAPEX/OPEX sin sesgo de bombas, placeholders genéricos y folio `SMAT-2026-XXXX`. |
| **5-A** | TrustMatrix | **Tríada de Certificación de Materiales y Límites de Ingeniería** | Certificación de colada A05 >650 HB, elastómeros vulcanizados y polipropileno a 16 bar; cláusulas sobrias de no cotizar a ciegas. |
| **6-A** | Catálogo Digital | **Arquitectura Editorial de 3 Verticales & Print** | Fichas técnicas completas con CSS `@media print` optimizado para compradores corporativos. |
| **7-A** | Casos de Campo | **3 Casos Anonimizados por Distrito Minero** | Casos reales de campo en Durango (Bombeo), Zacatecas (Flotación) y Chihuahua (Filtración). |
| **8-A** | Política Logística | **Buffer Estratégico Respetuoso** | Posicionamiento como aliado que absorbe costos de inventario e importación internacional sin confrontar a las mineras. |
| **9-A** | Dirección & Almacén | **Domicilio Fiscal vs Almacén Central Durango** | Domicilio fiscal en `Mariano Salas #114` (CFDI 4.0 / ERP); Almacén y patio en Durango para recolección física programada con folio. |
| **10-A** | Testing & Calidad | **Suite Completa de Invariantes** | Validación integral con Node tests, Rust gates, paridad JSON, Astro check y SSG build sin regresiones. |
| **UX-Opt** | Erradicación de "Triaje" | **Diagnóstico Rápido de Fallas Mecánicas** | Sustitución sistemática del término confuso "triaje" por "Diagnóstico de Fallas Mecánicas en Planta". |

---

## 🏛️ Matriz de Decisiones Estratégicas B2B — Décima Segunda Ola: Cierre de Brechas de Primeros Principios & Nivel 1 Soberano (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-A** | Verificabilidad de Confianza | **Protocolos a Solicitud Formal bajo Folio** | Se publican los estándares ASTM A532 (>650 HB) y balanceo dinámico, entregando los reportes oficiales de ensayo como anexo técnico tras la apertura de relación comercial y generación de folio (cero PDFs públicos expuestos a scraping). |
| **2-A** | Densidad Paramétrica | **Tabla Paramétrica Rápida de Series y Marcos (`#parametric-pumps-table`)** | Consolidación en `/catalogo/` y `/en/catalog/` de series (4x3 C a 10x8 F), marcos (C a F), Top Size (28 a 86 mm) y potencias de motor en una vista de alta densidad (<15s de inspección) con CTA directos. |
| **3-A** | Cálculo Económico (TCO) | **Micro-Calculador de Costo de Paro de Molienda (`#tco-accordion`)** | Módulo integrado en `QuoteWizard.astro` que cuantifica las toneladas secas de mineral en riesgo de no procesamiento ($Q \times S_m \times C_w \times \text{horas}$) para justificar la adquisición ante comités de compras. |
| **4-A** | Enrutamiento Deep-Linking | **Deep-Linking Determinista por Modo y Equipo** | Enrutamiento directo vía URL (`/#rfq?equipo=...&origen=diagnostico&falla=...&urgencia=paro`) que pre-selecciona el rol y abre la consola en el paso exacto en 1 clic. |
| **5-A** | Régimen Hidráulico Visual | **Semáforo Visual de Sedimentación Durand (`#regime-pill`)** | Barra reactiva de régimen de flujo en el cotizador (Verde $V > 1.25 V_c$, Ámbar $V \approx V_c$, Rojo $V < V_c$) conectada a las salidas de `slurryEngine.js`. |
| **6-A** | IP Propia e Ingesta Confidencial | **Código SMAT Propio + Ingesta Confidencial de Datos de Cliente** | Generación en tiempo real de claves SMAT (ej. `SMAT-PUMP-6X4D-A05-EXP`) y campo seguro `#wb-client-ref` para cotejo dimensional 1:1 en privado, con cero exposición de marcas OEM ajenas. |
| **7-A** | Puente Diagnóstico-Cotización | **CTAs Contextuales en Tarjetas de Falla Mecánica** | Botones contextuales en las 6 tarjetas de falla en `DiagnosticsHub.astro` que derivan directamente al Wizard con parámetros técnicos pre-cargados. |
| **8-A** | Dossier Técnico Adaptativo | **Pestañas de Vista Dual: Mantenimiento vs Compras/SAP** | Conmutador de vistas en el Dossier: *Vista Mantenimiento* (planos de acople, especificación de aleación y balanceo dinámico) vs *Vista Compras/SAP* (datos fiscales, partidas tabuladas y plazo de despacho). |
| **9-A** | Capacidad Logística Durango | **Posicionamiento de Capacidad Logística sin Filtrar Inventarios** | Posicionamiento de la capacidad de suministro y retiro en patio de maniobras de Durango coordinado con folio de cotización confirmado, sin exponer inventarios cuantitativos a terceros. |
| **10-A** | Exportabilidad ERP Avanzada | **Salida Dual Plaintext / Tabla TSV para SAP y Excel** | Botones de copiado: 1) Texto plano descriptivo para correo/WhatsApp y 2) Tabla TSV delimitada por tabulaciones `\t` de 11 columnas para pegar en celdas de SAP/Excel sin desalineación. |

---

## 🚀 Matriz de Decisiones Estratégicas B2B — Décima Tercera Ola: Cierre de Brechas al 100% y Frontera B2B Industrial (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-A** | Verificabilidad de Ensayos | **Facsímil Interactivo de Certificado de Calidad ASTM A532** | Visor modal interactivo (`QualityReportModal.astro`) con facsímil tipo de reporte metalúrgico ASTM A532 (>650 HB, 658 HBW) y balanceo dinámico ISO 1940 G2.5 con datos confidenciales anonimizados en `/garantia/` y `/en/warranty/`. |
| **2-A [MVP]** | Ergonomía Dimensional | **Esquema SVG Reactivo de Cotas Clave de Montaje** | Mini-diagrama acotado en SVG (`#pump-mounting-diagram`) en la tabla paramétrica rápida que resalta las cotas $A, B, C, D$ (succión, descarga, distancia entre pernos y altura de eje) según la serie seleccionada (4x3 C a 10x8 F). |
| **3-A [MVP]** | Cálculo TCO Avanzado | **Conmutador TCO de Aleación y Paros Evitados** | Selector de metalurgia en el TCO (`#tco-alloy-toggle`: *A05 >650 HB vs Fundición Estándar*) que calcula el ahorro en paros de turno evitados (~2,400 h vs ~800 h -> ~7 paros evitados/año). |
| **4-A** | Persistencia de Sesión | **Persistencia Transparente en `sessionStorage`** | Sincronización del estado del Workbench Bus en la sesión activa (`saveWorkbenchSession`, `loadWorkbenchSession`) para retener variables al navegar entre páginas sin ensuciar la URL. |
| **5-A** | Corrección por Altitud | **Selector de 3 Pisos de Altitud Minera** | Selector de 3 pisos operativos (`#wb-altitude-selector`: *0m Costa, 1,500m Meseta, 2,400m Sierra*) con ajuste de $P_{\text{atm}}$, $\Delta\text{NPSH}$ y factor de derating térmico de motor $k_h$ según normas HI / IEC 60034-1. |
| **6-A** | Reórdenes 1-Clic | **Decodificador Inteligente de Código SMAT** | Campo en QuoteWizard (`#wb-code-decoder-input` y `parseSmatPartCode`) que recibe una clave SMAT previa y auto-configura serie, marco, metalurgia y componentes en 1 clic. |
| **7-A** | Búsqueda por Síntoma | **Filtro Reactivo por Síntoma en Hub de Diagnóstico** | Barra de búsqueda instantánea client-side (`#diag-search-input`) en `DiagnosticsHub.astro` que filtra tarjetas por síntomas (*cavitación, vibración, fuga, recirculación, álabes*). |
| **8-A** | Aprobación Corporativa | **Justificación Técnica Normalizada para ERP** | Párrafo ejecutivo formal de justificación de compra en `#pane-sap` (`#sap-justification-box`) listo para anexar a SAP Ariba, Coupa o memorándum de compras. |
| **9-C** | Logística Soberana | **Capacidad de Despacho sin Tablas de Tránsito Públicas** | Preservación de la política soberana de despacho nacional, retiro coordinado en Durango y fletes dedicados sin publicar tablas de tiempos de tránsito por distrito minero. |
| **10-C** | Suite de Exportación Limpia | **Tríada Rey: PDF Imprimible, Plaintext y Tabla TSV** | Mantenimiento de la suite de exportación limpia sin añadir botones JSON superfluos, protegiendo la sobriedad ejecutiva. |

---

## 💎 Matriz de Decisiones Estratégicas B2B — Décima Cuarta Ola: Apple Pro Industrial Design & First-Principles Workflow (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-A** | Jerarquía de Superficies | **Sistema Multicapa Mineral Especular Industrial** | Implementación de tokens `--apple-bg-canvas` (#0a0d14), `--apple-bg-surface` (#111622), `--apple-bg-surface-elevated` (#161d2e), `--apple-border-specular` (inset 0 1px 0 rgba(255,255,255,0.12)) y `--apple-shadow-elevation`. |
| **2-A** | Densidad Numérica y Tipografía | **Números Tabulares Universales & Pila SF Mono / Roboto Mono** | Clases `.pro-tabular-nums` con `font-variant-numeric: tabular-nums` y token `--apple-font-mono: "SF Mono", "Roboto Mono"`, garantizando cero saltos de diseño (0 Layout Shift) durante cálculos en tiempo real. |
| **3-A** | Microfísica de Resortes | **Curvas de Amortiguamiento Apple Snappy / Smooth** | Micro-transiciones basadas en resortes naturales `cubic-bezier(0.16, 1, 0.3, 1)` a 150ms en switches, botones segmentados y chips de altitud/presets. |
| **4-A** | Diagramación Interactiva | **Sincronización Bidireccional Esquema SVG y Tabla Paramétrica** | Al posicionar el cursor sobre cualquier fila de la tabla paramétrica en `/catalogo/` y `/en/catalog/`, las cotas $A, B, C, D$ del diagrama SVG se iluminan en cobalto eléctrico `#38BDF8` y acotan milimétricamente las dimensiones del marco. |
| **5-A** | Feedback Táctil Visual | **Micro-Animación de Copiado Grado Stripe con Reset Temporal** | Transformación reactiva de los botones `#wb-copy-btn` y `#wb-copy-tsv-btn` con micro-escala 1.02, borde verde esmeralda y confirmación visual `✓ COPIADO AL PORTAPAPELES` y `✓ TSV COPIADO PARA EXCEL / SAP` durante 2.2s. |
| **6-A** | Telemetría Crítica | **LEDs Pulsantes de Misión Crítica en Régimen de Flujo** | Píldora de régimen Durand (`#regime-pill`) con LED animado `@keyframes status-pulse-green/amber/red` según velocidad crítica $V_c$, mitigando riesgos de sedimentación en tiempo real. |
| **7-A** | Spotlight B2B Instantáneo | **Búsqueda Instantánea con Resaltado Tipográfico `<mark>`** | Búsqueda client-side en `DiagnosticsHub.astro` con marcas amarillas `.pro-search-highlight` y atajo de teclado `Cmd/Ctrl+K` para inspección en <100ms. |
| **8-A** | Facsímil Metrológico | **Visor Glassmorphism de Certificado de Calidad ASTM A532** | Modal de reporte de colada (`QualityReportModal.astro`) con `backdrop-filter: blur(20px)`, borde especular, bandas de tolerancia sombreadas y sello de balanceo dinámico ISO 1940 G2.5. |
| **9-A** | Ergonomía Pro Keyboard | **Atajos de Teclado Globales Pro (1, 2, 3, Cmd+K, Cmd+Shift+C, Esc)** | Presets rápidos de pulpa (`1`: Molienda SAG, `2`: Flotación Rougher, `3`: Jales Espesados), atajo de foco `Cmd+K`, exportación TSV `Cmd+Shift+C` y cierre con `Esc`. |
| **10-A** | Flujo Continuo Sin Fricción | **Puente Contextual Bidireccional Diagnóstico -> Requisición** | Transición no destructiva desde `DiagnosticsHub` a `QuoteWizard` vía hash/query params y `sessionStorage`, auto-inyectando contexto de falla, serie y cálculo de paros evitados. |

## 🌿 Matriz de Decisiones Estratégicas B2B — Décima Quinta Ola: Calma Visual, Reducción Radical de Ruido y Flujo Apple Pro al 100% (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-A** | Malla Espacial & Reducción de Cajas | **Malla Espacial de 8 Puntos & Poda del 70% de Sub-cajas** | Tokens `--smat-space-2xs` a `3xl` (4px a 96px). Supresión de cajas anidadas, bordes punteados y fondos pastel ruidosos. Jerarquía gobernada por espacio en blanco generoso y líneas capilares milimétricas de 1px. |
| **2-A** | Higiene Tipográfica e Iconografía | **Erradicación Total de Emojis por Micro-Iconos 1.5px y Tipografía Sobria** | Purga del 100% de emojis consumer (`⚙️`, `🌊`, `🔍`, `⚡`, `⚠️`, `✅`, `❌`, `🛡️`, `🚨`, etc.) en todo el árbol de componentes. Sustitución por micro-iconos vectoriales mono-línea de 1.5px y mayúsculas técnicas (*small-caps*). |
| **3-A** | Flujo del Cotizador | **Flujo Pro en 3 Actos Tranquilos con Progressive Disclosure** | Desarticulación del abarrotamiento simultáneo en `QuoteWizard.astro`. Tres actos espaciados ergonómicamente con padding de 24px: *Acto 1: Selección de Partida*, *Acto 2: Parámetros Hidráulicos & TCO*, *Acto 3: Despacho & Live Dossier*. |
| **4-A** | Ficha Metrológica A4 | **Live Dossier Monolítico Oficial Continuo (Data Sheet Standard A4)** | Ficha técnica oficial estructurada como una sola hoja continua blanca editorial sin sub-cajas punteadas. Encabezados sobrios, líneas capilares sutiles, justificación técnica formal para compras ERP y suite de exportación rey (PDF dominante + copiado TSV/Plaintext). |
| **5-A** | Ritmo Vertical de Portada | **Separación Holgada de 80px a 96px entre Bloques Maestros** | Estandarización de `--smat-space-2xl: 80px` en `index.astro` y `en/index.astro`, permitiendo que el contenido respire con elegancia monumental de grado de adquisición. |
| **6-A** | Consola Paramétrica de Catálogo | **Separación de 32px e Integración Visual Esquema SVG y Tabla** | Separación holgada de 32px (`--smat-space-lg`) entre el diagrama de cotas de montaje y la tabla paramétrica rápida con clase `.pro-tabular-nums` en `/catalogo/` y `/en/catalog/`. |
| **7-A** | Módulos de Diagnóstico | **Tarjetas de Diagnóstico Minimalistas con Micro-LEDs de Telemetría** | Simplificación de las tarjetas en `DiagnosticsHub.astro` con fondos limpios blanco/grafito, micro-LED de telemetría y botones de acción minerales sin fondos pastel estridentes. |
| **8-A** | Consistencia Cromática 90/10 | **Regla 90/10 en Escala Mineral Pura** | 90% de la interfaz gobernada por carbón `#090D16`, grafito `#111622`, blanco papel y pizarra editorial; 10% reservado para acento de cobre forjado `#C25E00` y telemetría crítica de régimen. |
| **9-A** | Respaldo Operativo Editorial | **Citas Ejecutivas Sobrias de Campo** | Testimonios de campo y respaldo de patio de maniobras estructurados con solvencia fiduciaria y tipografía sobria, sin decoraciones de e-commerce retail. |
| **10-A** | Microfísica de Precisión | **Micro-Transiciones a 200ms con Resorte Apple Snappy** | Curvas de amortiguamiento `cubic-bezier(0.16, 1, 0.3, 1)` aplicadas a botones de intención, conmutadores y acordeones para máxima sensación de precisión instrumental. |

---

## 🏔️ Matriz de Decisiones Estratégicas B2B — Décima Sexta Ola: Ergonomía de Flujo, Calma Visual y Claridad para Don Manuel (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Comercial |
|---|---|---|---|
| **1-C** | Vitrina Táctil Previa al Cotizador | **Vitrina de 3 Módulos de Hardware en Portada con Deep-Link** | Se erradica el "asalto en la puerta". Don Manuel ve primero los fierros físicos (Bombas en Skid 4x3-10x8, Refacciones Críticas A05 >650 HB y Celdas & Filtros) con especificaciones de patio y botón `[ Configurar y Cotizar ↓ ]` con scroll suave hacia el cotizador pre-cargado. |
| **2-C** | Arquitectura de Lenguaje en Doble Capa | **Filtro Don Manuel (Titular Directo de Mina + Subtítulo Técnico en Small-Caps)** | Poda de verbórrea académica ("ingesta", "FOB destination", "transparencia radical"). Titulares directos (*"Datos o foto de la placa vieja"*, *"Lugar de entrega o quién recoge en Durango"*, *"Cálculo de flujo para que no se embanque su tubería"*), manteniendo las normas ASTM A532, ISO 1940 G2.5 y fórmula Durand $V_c$ como respaldo técnico irrefutable. |
| **3-C** | Desanidación del Simulador y TCO Continuo | **Integración Continua del Ahorro TCO sin Acordeones Dobles** | Eliminación de `<details class="tco-accordion">` dentro de `#durand-accordion`. Al mover los sliders o presets, las toneladas en riesgo, aleación y paros de turno evitados se calculan en tiempo real en una tarjeta continua y visible sin clics ocultos. |
| **4-C** | Reubicación del Decodificador SMAT | **Pastilla Secundaria Discreta Fuera del Flujo Principal** | La barra de código previo se retira del tope del Acto 1 y se reubica como enlace desplegable discreto `[ ↺ ¿Cuenta con código SMAT de cotización previa o folio anterior? ]`, liberando el túnel para usuarios nuevos sin perder la función para compradores recurrentes. |
| **5-C** | Live Dossier A4 Unificado Continuo | **Ficha Técnica Monolítica A4 con Impresión Nativa `@page`** | Fusión de las vistas de taller y SAP en una sola hoja membretada continua: especificaciones técnicas de patio arriba y estructura de partidas SAP/ERP + datos fiscales abajo. `@media print` optimizado con `@page { size: A4; margin: 12mm 15mm; }`. |
| **6-C** | Captura Dual Ligera de Foto en Cliente | **Compresión In-Memory en Canvas (1200px, 0.7 JPEG) + WhatsApp** | Reducción de peso en cliente en 30ms sin servidor ni costo de storage, integrando el recordatorio de foto adjunta en el chat de guardia con folio automático `SMAT-2026-XXXX`. |
| **7-C** | 3 Tarjetas de Certeza Física de Taller | **Tríada de Certeza de Patio y Límites Honestos sin Tabla Horizontal** | Rediseño de la matriz en 3 bloques físicos claros: 1) *Lo que probamos en Almacén Durango*, 2) *Lo que cubre la fundición OEM*, 3) *Límites honestos: cuándo decimos NO de frente*, eliminando el scroll horizontal en dispositivos móviles. |
| **8-C** | Consistencia Mineral Geológica | **Paleta Mineral Estricta Carbón/Papel/Cobre 90/10** | Cero fondos pastel ruidosos en badges o tarjetas; superficies limpias gobernadas por carbón `#090D16`, blanco papel `#FFFFFF`, base `#FAFAF9` y acento en cobre `#C25E00`. |
| **9-C** | Evidencia de Campo Formato Bitácora | **Bitácora Técnica de Guardia con Datos Duros Anonimizados** | Los casos de estudio se estructuran como bitácoras de turno de planta minera reales: distrito minero, t/d, condición de pulpa, refacción instalada y días de vida útil ganados con paros evitados. |
| **10-C** | Enlace Bidireccional Catálogo -> Cotizador | **Pre-Carga Automática de Serie vía URL y SessionStorage** | Al pulsar "Cotizar" sobre cualquier serie de la tabla paramétrica en `/catalogo/` o `/en/catalog/`, los parámetros viajan en la URL y `sessionStorage`, seleccionando el equipo y rellenando los datos de acople dimensional 1:1 en el cotizador. |

---

## 🏛️ Matriz de Decisiones Estratégicas B2B — Décima Séptima Ola: Arquitectura Apple, Calma Visual y Cero Debris al 100% (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada (Opción C) | Justificación Técnica y Operativa |
|---|---|---|---|
| **1-C** | Portada Despejada de Foco Único | **Vitrina Física de 3 Equipos con Deep Link Directo** | Separación pulcra de la vitrina física de hardware (3 equipos) del entorno de cotización en lienzo enfocado. Scroll fluido y prellenado de equipo sin ruido inferior. |
| **2-C** | Fusión Canónica en 3 Tarjetas en TrustMatrix | **Poda de los 4 Pilares y Tabla de 12 Filas** | Eliminación de 250+ líneas de tablas horizontales redundantes (`.pillars-grid`, `.matrix-table-container`, `.boundaries-box`). Consolidación en 3 Tarjetas de Certeza Física de Patio (`.physical-certainty-grid`) y snippet de protocolo de calidad. |
| **3-C** | Encabezado Único en Diagnóstico | **Poda de la Cabecera Gemela en /diagnostico/** | Supresión de `.page-hero` duplicado en `diagnostico.astro` y `en/diagnostics.astro`. Promoción del encabezado dentro de `DiagnosticsHub.astro` como H1 semántico único con badge `[ ASISTENTE MECÁNICO DE CAMPO ]`, ahorrando 180px de scroll vertical. |
| **4-C** | Fontanería Universal de Enlaces | **Cero Dead Affordances en las 40 Páginas** | Corrección canónica de `Abrir Consola` (`href="/#rfq"` / `href="/en/#rfq"` con scroll suave), `#circuitos` hacia `/bombeo/` / `/en/pumping/` y query params en orden estándar RFC (`/?equipo=...#rfq`). Cero enlaces rotos. |
| **5-C** | TCO Demostrado Inmediato en Portada | **Métrica Fija Visible sin Obligar a Mover Sliders** | Exposición inmediata en la tarjeta de refacciones de la vitrina: `~2,400 h proyectadas en A05 • Evita hasta ~7 paros al año frente a fundición gris común`. |
| **6-C** | Armonización Cromática 90/10 en CaseCards | **Fondo Mineral Continuo y Acento Ámbar/Cobre** | Poda del fondo negro aislado (`#0d131f`) y de la pastilla verde esmeralda neón (`#34d399`). Integración con el lienzo mineral pizarra `#0b1120` y acento forjado `#f59e0b`. |
| **7-C** | Lenguaje Natural de Patio Don Manuel | **Erradicación de Términos Contables CapEx/OpEx** | Sustitución de etiquetas abstractas por terminología de planta: *"Equipo Completo con Motor y Patín"*, *"Refacciones Críticas de Desgaste"* y *"Celdas y Filtración de Jales"*. |
| **8-C** | Ergonomía Live Dossier en Laptops | **Breakpoint a 1200px con Barra Flotante Mini-Dossier** | En pantallas ≤1200px (1366x768 o 1280x800 típicas de mina), el formulario ocupa el 100% de ancho sin apretujar campos, habilitando la barra flotante inferior `[ 📄 Ver Requisición & Exportar ]`. |
| **9-C** | Puente Inteligente Diagnóstico ➔ Requisición | **Inyección de Sintoma en URL y Auto-Justificación** | Parámetros `?equipo=...&sintoma=...#rfq` viajan directamente al cotizador; `workbenchBus.js` y `QuoteWizard.astro` precargan el equipo y rellenan automáticamente la justificación técnica en el Live Dossier para compras ERP. |
| **10-C** | Testing B2B Expandido y Cero Código Muerto | **91 Tests Unitarios/E2E Green & 18 Gates en Rust** | Ampliación de 83 a 91 tests automatizados (`tests/b2b_functions.test.mjs`), 18/18 gates en Rust green, 0 errores en 60 archivos con `astro check`, 40 rutas estáticas compiladas en <3s y 0 archivos de debris. |

---

## 📄 Matriz de Decisiones Estratégicas B2B — Décima Octava Ola: Ergonomía de Consola, Metáfora de Hoja A4 y Cero Intimidación Visual (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada (Opción C) | Justificación Técnica y Operativa |
|---|---|---|---|
| **1-C** | Metáfora Espacial Mesa vs. Hoja A4 | **Mesa Técnica Neutra (#F1F5F9) y Hoja A4 Elevada (#FFFFFF)** | Adopción de benchmark `GOLD-169`. Se erradica la confusión entre controles y documento. La consola izquierda opera sobre la mesa grisácea mientras la derecha se erige como una auténtica hoja física de papel A4 blanco con sombra suave tridimensional y remate de cobre forjado de 2px. |
| **2-C** | Esqueleto Membretado con Tinta Viva | **Membrete Oficial Durango y Revelación Progresiva** | Adopción de benchmark `GOLD-172`. El membrete fiduciario aparece íntegro, pero las secciones inferiores se descubren ordenadamente conforme el usuario interactúa, eliminando el "monstruo de antemano" que simulaba una declaración de impuestos. |
| **3-C** | Conmutador Estricto de Pestañas | **Exclusión Mutua de Pestañas en Pantalla (<600px)** | Las pestañas `#tab-btn-maint` y `#tab-btn-sap` operan en pantalla como vistas mutuamente excluyentes, podando el mega-scroll de >2,000px a <600px; en `@media print` ambas vistas se fusionan para una exportación documental A4 completa. |
| **4-C** | Jerarquía Micro-Tipográfica Key-Value | **Pares Semánticos `<dl>/<dt>/<dd>` con Números Tabulares** | Adopción de benchmark `GOLD-171`. Etiquetas sobrias en 10px mayúsculas (*small-caps* `#64748B`) sobre valores en 13-14px semibold monoespaciados (`SF Mono`), permitiendo escanear cualquier parámetro en menos de 3 segundos. |
| **5-C** | Justificación Técnica ERP Comprimida | **Resumen Ejecutivo de 2 Líneas + Micro-Acordeón con Copiado** | Adopción de benchmark `GOLD-170`. Sustitución del muro de 12 líneas de prosa por un resumen ejecutivo visible + `<details class="erp-justification-drawer">` con botón de copiado al portapapeles en 1 clic. |
| **6-C** | Lienzo Izquierdo Despejado en 3 Actos | **Paso 01 Abierto, Paso 02 Asistente Opcional y Paso 03 Compacto** | Enfoque ergonómico calmado: selección de fierro inmediata en Paso 01, cálculo hidráulico Durand como valor agregado opcional en Paso 02, y contacto en 2 filas limpias en Paso 03. |
| **7-C** | Sello Metrológico Almacén Durango | **Badge Oficial de Inspección en Banco (ISO 1940 G2.5 • Acople 1:1)** | Adopción de benchmark `GOLD-173`. Sustitución de 8 líneas de cláusula legal abstracta por una insignia técnica de taller: balanceo dinámico ISO 1940 G2.5, acople dimensional de brida 1:1 y dureza $\ge 650\text{ HB}$ A05 en Mariano Salas #114. |
| **8-C** | Botonera Rey Adosada al Pie del Documento | **Botón Rey PDF en Cobre Forjado Permanente** | Botón dominante `[ 📄 Descargar Ficha Técnica en PDF ]` adosado permanentemente a la base de la hoja A4 sin obligar a scrollear 2,000px, escoltado por acciones discretas de WhatsApp y TSV. |
| **9-C** | Micro-Interacción Causa-Efecto | **Destello Especular de Tinta Viva (300ms)** | Al modificar cualquier campo o mover los controles a la izquierda, el valor en la hoja de papel emite un destello tenue en ámbar/cobre (`rgba(194, 94, 0, 0.22)`) desvanecido en 350ms, conectando causa y efecto al instante. |
| **10-C** | Blindaje y Testing B2B Expandido | **98 Tests Automatizados Green, 18 Gates Rust y Cero Debris** | Incorporación de Tests 85 a 91 en `tests/b2b_functions.test.mjs`, 18/18 compuertas en Rust aprobadas, 0 errores en `astro check`, 40 rutas estáticas compiladas en <3s y 0 archivos de debris. |

---

## 🏛️ Matriz de Decisiones Estratégicas B2B — Décima Novena Ola: Diferenciación Espacial Absoluta (Muelle Slate vs. Hoja A4 Blanca Iluminada) (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada (Opción C) | Justificación Técnica y Operativa |
|---|---|---|---|
| **1-C** | Muelle Unificado de Instrumentación | **Console Bay Slate (#F8FAFC, borde #CBD5E1)** | Adopción de benchmark `GOLD-174`. Erradicación del "síndrome de las 4 tarjetas blancas gemelas". La columna izquierda se consolida en un único chasis continuo de instrumentación de ingeniería, desmantelando los fondos blancos independientes de `.control-card`. |
| **2-C** | Pozos de Entrada en Blanco Puro | **Inputs y Selects con Bisel Interior (inset 0 1px 2px)** | Adopción de benchmark `GOLD-178`. Las ranuras `<input>`, `<select>` y `<textarea>` son las únicas cavidades blancas puras (`#FFFFFF`) a la izquierda, invitando intuitivamente a Don Manuel a escribir sin confusión respecto al documento. |
| **3-C** | Señalética Formal Estricta | **Rótulos de Cabecera Tipográficos SIN Íconos** | Adopción de benchmark `GOLD-175`. Cumplimiento al 100% de la directiva de la Dirección: `1. PANEL DE ENTRADA • CONFIGURACIÓN DE EQUIPO` vs `2. DOCUMENTO OFICIAL SMAT • EMISIÓN EN TIEMPO REAL (A4)` en small-caps sobrias, letter-spacing 0.05em, estrictamente sin emojis, SVGs ni pictogramas. |
| **4-C** | Oclusión Ambiental de Papel A4 | **Sombra Multicapa Tridimensional de Hoja Flotante** | Adopción de benchmark `GOLD-176`. Aplicación de sombra apilada con dispersión negativa (`0 1px 2px`, `0 12px 32px -4px`, `0 24px 48px -6px`), convirtiendo al `.dossier-card` en la única superficie física blanca iluminada que despega de la mesa técnica `#F1F5F9`. |
| **5-C** | Pestañas de Carpeta Técnica | **Cartelas de Expediente Físico con Borde Continuo** | Adopción de benchmark `GOLD-177`. Las pestañas `#tab-btn-maint` y `#tab-btn-sap` se integran como pestañas de folder de archivo de mina con conexión solapada (`border-bottom: 2px solid #FFFFFF`), erradicando botones flotantes desconectados. |
| **6-C** | Estado Fiduciario Guía | **Líneas Guía Serenas sin Layout Shift** | Parámetros pendientes de configuración se presentan con leyendas técnicas fiduciarias (`-- Pendiente de especificación --`), manteniendo la altura geométrica estable de la hoja en todo momento. |
| **7-C** | Cascada Calmada de 3 Pasos | **Progresión Serena de Foco Activo** | Paso 1 abierto con foco inmediato para selección de fierro, Paso 2 empaquetado como asistente Durand opcional de valor agregado, y Paso 3 en 2 filas limpias para despacho. |
| **8-C** | Tinta Viva Focalizada | **Destello Ámbar/Cobre (350ms) en Celda Activa** | Confirmación háptica-visual inmediata: al teclear a la izquierda, la celda afectada en la hoja A4 emite un destello tenue en cobre/ámbar que certifica la causa-efecto en tiempo real. |
| **9-C** | Pie de Hoja Fiduciario | **Botón Rey PDF en Cobre Forjado Permanente** | Botón dominante `[ 📄 Descargar Ficha Técnica en PDF ]` permanentemente accesible al pie del pliego A4, escoltado por copiado rápido de texto plano y TSV para compras SAP. |
| **10-C** | Batería de Testing B2B Expandida | **105 Tests Unitarios Green, 18 Gates Rust y Cero Debris** | Incorporación de Tests 92 a 98 en `tests/b2b_functions.test.mjs`, 18/18 compuertas soberanas en Rust aprobadas, 0 errores en `astro check`, 40 rutas estáticas compiladas en <3s y 0 archivos de debris. |

---

## ⚡ Matriz de Decisiones Estratégicas B2B — Vigésima Ola: Arquitectura Multi-Equipo Integral de Planta Húmeda, Resiliencia Offline-First en Sierra, Ficha de Cotejo Dimensional ANSI 1:1, Píldoras Táctiles Sin Íconos, Poda de Verbórrea para Don Manuel, Matriz TCO y Cero Debris (24 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada (Opción C / A) | Justificación Técnica y Operativa |
|---|---|---|---|
| **1-C** | Visión Multi-Equipo Integral | **3 Circuitos Clave de Planta Húmeda en Toda la Arquitectura** | SMAT Minerals no vende únicamente bombas: abarca integralmente los 3 circuitos húmedos de concentradora: 1) Molienda/Bombeo (Skids 4x3 a 10x8 e impulsores A05 $\ge 650\text{ HB}$), 2) Flotación (Celdas 50 a 300 ft³ y rotores/estatores), 3) Filtración (Filtros prensa 16 bar, placas y telas). H1, vitrinas y navegación calibrados simétricamente. |
| **2-C** | Cabecera Esbelta Unificada | **Header de 60px con Teléfono/WhatsApp y "Cotizar Refacción"** | Se compacta la cabecera ahorrando 50px de altura vertical. Botón renombrado a *"Cotizar Refacción"* (o *"Quote Spares"*), integración de teléfono directo de guardia `(618) 810-4408` y WhatsApp. |
| **3-C** | Poda de Cajas Intermedias Huérfanas | **Descenso Visual Directo H1 ➔ Tarjetas de Hardware** | Purga radical de las 4 mini-cajas intermedias (`.hero-kpis` / `.hero-stats`). Descenso directo y limpio desde el H1 monumental y CTAs de acción hacia las 3 tarjetas de hardware de planta húmeda. |
| **4-C** | Tarjetas de Hardware Apple Pro Key-Specs | **Ficha Tabular Pro de 4 Parámetros Verificables por Circuito** | Sustitución de prosa densa por 4 métricas técnicas duras por circuito (Caudal, Metalurgia ASTM A532 A05 $\ge 650$ HB, Balanceo ISO 1940 G2.5, Acople ANSI 1:1, Presión 16 bar, etc.). |
| **5-A** | Cumplimiento Fiscal y Bancario B2B | **Datos SAT 8413.91.01 y Bancarios a Solicitud Formal** | Para mantener la hoja física A4 ligera y legible para Don Manuel, los datos fiscales (RFC, clave SAT) se emiten previa confirmación de pedido. |
| **6-C** | Ficha de Cotejo Dimensional ANSI 1:1 | **Plano Técnico con Cotas A, B, C, D y Excentricidad <0.05 mm** | Botón `#wb-cotejo-btn` en la barra de exportación que despliega la Ficha de Cotejo Dimensional con tolerancias milimétricas en banco Durango con reloj comparador Mitutoyo y acotaciones ANSI B16.5. |
| **7-C** | Resiliencia Offline-First en Sierra | **Service Worker Ultraligero (<5KB) y Auto-Save en localStorage** | `public/sw.js` Cache-First para App Shell y estilos minerales. Persistencia reactiva en `localStorage` (`smat_workbench_draft`) e indicador de estado `#offline-network-pill` para campamentos sin cobertura en la Sierra Madre. |
| **8-C** | Erradicación del Botón Neón Flotante | **Canal WhatsApp Reubicado con Dignidad Fiduciaria** | Purga total del widget flotante verde neón (`#25D366`). WhatsApp integrado con rigor en la cabecera, en la botonera A4 adosada con folio activo y en el pie de página institucional. |
| **9-C** | Deep-Link RFC Fluido Catálogo ➔ Cotizador | **Parametrización Universal `/#rfq?equipo=...&serie=...`** | Botones de catálogo enlazan al cotizador preseleccionando automáticamente el circuito, serie y aleación en 1 clic sin fricción. |
| **10-C** | Píldoras Táctiles de Diagnóstico Sin Íconos | **Filtros Tipográficos con `aria-pressed` Estrictamente Sin Íconos** | Sustitución de barra de texto manual por selector de chips táctiles mecánicos (`[ TODOS ]`, `[ IMPULSOR DESGASTADO ]`, etc.), accesibles para mecánicos de mina con guantes, 100% tipográficos, cero emojis y cero SVGs. |
| **Item 11** | Matriz Fiduciaria TCO Multi-Equipo | **Tabla Comparativa de Disponibilidad y Costo de Paro** | Sección `.tco-matrix-section` contrastando Stock Durango (24-48h) vs. Importación Ultramarina (16-24 semanas) protegiendo el paro de molino a 40,000 USD/hora. |
| **Item 12** | Armonización Multi-Equipo de "Decimos NO" | **Criterios de Descarte Honesto para los 3 Circuitos** | Bombeo ($NPSH_a$ insuficiente), Flotación (turbulencia destructiva por sobre-aireación) y Filtración (jales arcillosos ultrafinos sin acondicionamiento previo). |
| **Calidad** | Blindaje y Testing B2B Expandido | **113 Tests Unitarios Green, 18 Gates Rust, 0 Errores en Build y Cero Debris** | Incorporación de Tests 99 a 106 en `tests/b2b_functions.test.mjs`, 18/18 gates en Rust green, 0 errores en `astro check`, 40 rutas estáticas compiladas en <7s y 0 archivos de debris. |

---

## ⚡ Matriz de Decisiones Estratégicas B2B — Vigésimo Tercera Ola: Fichas Atómicas Anti-Scraping, Briefing Ejecutivo de AISC Simétrico ES/EN, Inyección Territorial Invisible y WhatsApp Oficial 6183670664 (25 de Septiembre de 2026)

| # | Decisión | Alternativa Seleccionada | Justificación Técnica y Operativa |
|---|---|---|---|
| **1-B** | Identidad de Marca Institucional | **SMAT Minerals Sobrio (Sin R ni sufijos)** | Eliminación de símbolos de marca ruidosos o sufijos redundantes. La marca se expresa como SMAT Minerals, sobria, directa y con presencia industrial. |
| **2-B** | Honestidad Operativa y Poda de Certificados Ficticios | **Erradicación de Debris y Garantía 1:1 en Banco Durango** | Purgado completo del componente de laboratorio ficticio (`QualityReportModal.astro`). Cero afirmaciones sobre espectrometría in-house o escaneo láser. La garantía se fundamenta en dureza Brinell verificada ($\ge 650$ HB) y ajuste dimensional 1:1 en ensamble. |
| **3-B** | Presencia Multi-Equipo Equilibrada | **3 Circuitos de Planta Húmeda sin Encajonamiento** | Se mantiene la paridad visual e informativa entre Bombeo/Molienda, Flotación y Filtración, facilitando que compradores de pulpa encuentren lo que buscan sin encasillar a SMAT como simple tienda de bombas. |
| **4-B** | Protección Anti-Scraping y Fichas Atómicas | **6 Fichas Atómicas Universales Indexadas con Cero Dumps** | Creación de rutas dedicadas `catalogo/[code]` y `en/catalog/[code]` para 6 partes canónicas (`d3147`, `e4147`, `f6147`, `dam028`, `eam028`, `e4083`). Se bloquea la descarga masiva de CADs, matrices de tolerancia completas o bases de datos crudas para evitar el scraping de competidores. |
| **5-B** | Facilitador de RFQ y Protocolo de Cotejo | **RFQ de Contacto Directo con Directiva de Flexómetro** | El configurador funciona como facilitador de requisición técnica orientado a detonar contacto humano calificado. Se erradican promesas de cotización en 15 minutos; se instruye el envío de fotografía con flexómetro para cotejo 1:1. |
| **6-B** | Briefing Ejecutivo de AISC Simétrico ES/EN | **Briefing Corporativo de Impacto Económico en Mina** | Desarrollo simétrico en `/nosotros` y `/en/about` abordando el costo de paro de molino (20k a 150k USD/turno), la eliminación de tiempos de espera ultramarinos (16 a 24 semanas) mediante stock estratégico en Durango, y el impacto directo en el AISC de las operaciones mineras. |
| **7-B** | Inteligencia Territorial Invisible y WhatsApp Oficial | **Inyección en Schema.org `areaServed`, llms.txt v2.3 y WhatsApp `6183670664`** | Los 9 estados mineros prioritarios (Durango, Zacatecas, Chihuahua, Sonora, Coahuila, San Luis Potosí, Sinaloa, Hidalgo, Guerrero) se indexan para motores de búsqueda y LLMs sin exponer públicamente el censo privado de 116 operaciones. Actualización canónica de WhatsApp oficial a `+52 (618) 367-0664` (`526183670664`). |
| **Calidad** | Verificación Integral de Compilación y Gates | **147 Tests Green, 20 Gates Rust, 0 Errores en Build** | Verificación completa de suite unitaria de 147 pruebas, 20 compuertas soberanas en Rust (`crates/smat-gate`), preflight de compilación sin errores y generación de 52 rutas estáticas. |

---

## 🔒 Regla de Oro Invariable
> *"El sitio web de SMAT Minerals es la puerta pública del negocio, no el negocio completo. Protege los secretos comerciales y el software privado de ingeniería, garantiza TTFB < 50ms a costo $0 USD/mes, y asiste al comprador minero con rigor técnico, honestidad operativa y sin adjetivos vacíos."*







