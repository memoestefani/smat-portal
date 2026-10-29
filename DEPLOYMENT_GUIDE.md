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

Un cambio **no se publica** si alguno falla. Las 20 compuertas viven en [`crates/smat-gate`](crates/smat-gate/src/lib.rs) y los 140 tests en [`tests/b2b_functions.test.mjs`](tests/b2b_functions.test.mjs):

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
- **v3.2 (actual):** arquitectura unificada sin conceptos huérfanos (19/19 componentes activos), cerebro cliente único (`QuoteWizard.astro` conectado directamente a `slurryEngine.js` y `workbenchBus.js`), revelación progresiva en 3 etapas con resumen hidráulico en vivo, continuidad transaccional lossless 100% (`workbenchBus` ➔ `Code.gs` ➔ `acuse.astro` ➔ `Sveltia CMS`), `CircuitNavigator.astro` multi-rol en las 3 verticales y `SharePurchasing.astro` en las 10 subpáginas de Bombeo. Verificación: 146/146 tests y 20/20 compuertas.
