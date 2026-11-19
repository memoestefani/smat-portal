// tests/v481_solar_contrast_fold_and_tour27.test.mjs
// Suite de verificación V4.8.1 (ARB-SMAT-57, D1-V481..D5-V481, DEB-V481-01..08, Gate 48J).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(SITE_ROOT, '..');

function readSiteFile(relPath) {
  return fs.readFileSync(path.join(SITE_ROOT, relPath), 'utf8');
}

function parseHexRgb(hex) {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function wcagLuminance(hex) {
  const rgb = parseHexRgb(hex);
  assert.ok(rgb, `Color hex inválido: ${hex}`);
  const lin = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function wcagContrastRatio(fgHex, bgHex) {
  const l1 = wcagLuminance(fgHex);
  const l2 = wcagLuminance(bgHex);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function apcaLuminance(hex) {
  const rgb = parseHexRgb(hex);
  assert.ok(rgb, `Color APCA hex inválido: ${hex}`);
  const y =
    0.2126729 * Math.pow(rgb[0] / 255, 2.4) +
    0.7151522 * Math.pow(rgb[1] / 255, 2.4) +
    0.0721750 * Math.pow(rgb[2] / 255, 2.4);
  return y >= 0.022 ? y : y + Math.pow(0.022 - y, 1.414);
}

function apcaContrastMagnitude(fgHex, bgHex) {
  const yTxt = apcaLuminance(fgHex);
  const yBg = apcaLuminance(bgHex);
  if (Math.abs(yBg - yTxt) < 0.0005) return 0;
  if (yBg > yTxt) {
    const sapc = (Math.pow(yBg, 0.56) - Math.pow(yTxt, 0.57)) * 1.14;
    return sapc < 0.1 ? 0 : Math.abs((sapc - 0.027) * 100);
  }
  const sapc = (Math.pow(yBg, 0.65) - Math.pow(yTxt, 0.62)) * 1.14;
  return sapc > -0.1 ? 0 : Math.abs((sapc + 0.027) * 100);
}

test('D3-V481 / DEB-V481-01: Tokens :root declarados sin variables fantasma y pares solares >= 7.0:1 AAA y APCA |Lc| >= 75', () => {
  const tokensCss = readSiteFile('src/styles/tokens.css');
  const globalCss = readSiteFile('src/styles/global.css');
  const slugCss = readSiteFile('src/styles/productSlugSolar.css');
  const cycloneAstro = readSiteFile('src/components/CycloneAndScreenReport.astro');

  const roots = `${tokensCss}\n${globalCss}`;
  const declared = new Map();
  for (const m of roots.matchAll(/(--smat-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    declared.set(m[1], m[2].trim());
  }

  for (const reqToken of [
    '--smat-solar-accent',
    '--smat-solar-emerald',
    '--smat-solar-sky-ink',
    '--smat-solar-amber-border',
    '--smat-solar-emerald-border',
    '--smat-hero-pad-y',
    '--smat-h1-op',
    '--smat-stage-pad-top',
  ]) {
    assert.ok(declared.has(reqToken), `Falta variable CSS soberana en :root: ${reqToken}`);
  }

  for (const [label, src] of [
    ['tokens.css', tokensCss],
    ['global.css', globalCss],
    ['productSlugSolar.css', slugCss],
    ['CycloneAndScreenReport.astro', cycloneAstro],
  ]) {
    for (const m of src.matchAll(/var\(\s*(--smat-(?:solar|hero|h1|stage)[a-z0-9-]*)/g)) {
      assert.ok(declared.has(m[1]), `Variable fantasma var(${m[1]}) usada en ${label}`);
    }
  }

  const solarAccent = declared.get('--smat-solar-accent');
  const solarEmerald = declared.get('--smat-solar-emerald');
  const solarSkyInk = declared.get('--smat-solar-sky-ink');
  const solarMuted = declared.get('--smat-solar-muted');
  const pairs = [
    [solarAccent, '#ffffff', 'solar-accent / white'],
    [solarAccent, '#f8fafc', 'solar-accent / solar-bg'],
    ['#ffffff', solarAccent, 'white / solar-accent'],
    [solarEmerald, '#ecfdf5', 'solar-emerald / emerald-bg'],
    [solarEmerald, '#ffffff', 'solar-emerald / white'],
    [solarSkyInk, '#eff6ff', 'solar-sky-ink / info-bg'],
    [solarSkyInk, '#f8fafc', 'solar-sky-ink / solar-bg'],
    [solarMuted, '#f8fafc', 'solar-muted / solar-bg'],
    [solarMuted, '#fffbeb', 'solar-muted / amber-bg'],
  ];

  for (const [fg, bg, desc] of pairs) {
    const cr = wcagContrastRatio(fg, bg);
    const lc = apcaContrastMagnitude(fg, bg);
    assert.ok(cr >= 7.0, `${desc} (${fg}/${bg}) WCAG CR=${cr.toFixed(2)} < 7.0`);
    assert.ok(lc >= 75.0, `${desc} (${fg}/${bg}) APCA |Lc|=${lc.toFixed(1)} < 75`);
  }
});

test('D3-V481 / DEB-V481-02: Cero tonos sub-AAA en CycloneAndScreenReport/equipos/clasificacion y [slug] ES/EN < 550 LOC con productSlugSolar.css', () => {
  const audited = [
    'src/components/CycloneAndScreenReport.astro',
    'src/styles/productSlugSolar.css',
    'src/pages/equipos/index.astro',
    'src/pages/en/process-equipment/index.astro',
    'src/pages/clasificacion/index.astro',
    'src/pages/en/classification/index.astro',
  ];
  for (const rel of audited) {
    const lower = readSiteFile(rel).toLowerCase();
    for (const badHex of ['#d97706', '#b45309', '#047857', '#0369a1']) {
      assert.ok(!lower.includes(badHex), `Literal sub-AAA ${badHex} encontrado en ${rel}`);
    }
    if (rel.includes('equipos') || rel.includes('process-equipment')) {
      assert.ok(!lower.includes('#9a3412'), `#9a3412 (<7.0:1 en #f8fafc) presente en ${rel}`);
    }
  }

  for (const slugRel of ['src/pages/productos/[slug].astro', 'src/pages/en/products/[slug].astro']) {
    const src = readSiteFile(slugRel);
    const lines = src.split(/\r?\n/).length;
    assert.ok(src.includes('productSlugSolar.css'), `${slugRel} debe importar productSlugSolar.css`);
    assert.ok(src.includes('id="stratum1-slug-card"'), `${slugRel} debe definir id="stratum1-slug-card"`);
    assert.ok(lines < 550, `${slugRel} (${lines} LOC) debe mantenerse < 550 LOC tras extracción CSS`);
  }
});

test('D1-V481 & D2-V481: Ritmo fluido, Display-First (.smat-stratum1-display < .smat-inputs-2col) e id="stratum1-*" en 16 subrutas verticales', () => {
  const globalCss = readSiteFile('src/styles/global.css');
  for (const utility of ['.smat-compact-hero', '.smat-stage-compact', '.smat-stratum1-display', '.smat-inputs-2col']) {
    assert.ok(globalCss.includes(utility), `global.css debe declarar utilidad ${utility}`);
  }

  const verticalSubpages = [
    ['src/pages/bombeo/impulsor.astro', 'stratum1-impeller-sim'],
    ['src/pages/en/pumping/impeller.astro', 'stratum1-impeller-sim'],
    ['src/pages/bombeo/revestimientos.astro', 'stratum1-liners-sim'],
    ['src/pages/en/pumping/liners.astro', 'stratum1-liners-sim'],
    ['src/pages/bombeo/sello.astro', 'stratum1-seal-sim'],
    ['src/pages/en/pumping/seal.astro', 'stratum1-seal-sim'],
    ['src/pages/bombeo/soporte.astro', 'stratum1-bearing-inspector'],
    ['src/pages/en/pumping/bearing-assembly.astro', 'stratum1-bearing-inspector'],
    ['src/pages/filtracion/prensa.astro', 'stratum1-press-sim'],
    ['src/pages/en/filtration/press.astro', 'stratum1-press-sim'],
    ['src/pages/filtracion/repuestos.astro', 'stratum1-parts-sim'],
    ['src/pages/en/filtration/parts.astro', 'stratum1-parts-sim'],
    ['src/pages/flotacion/celdas.astro', 'stratum1-cells-sim'],
    ['src/pages/en/flotation/cells.astro', 'stratum1-cells-sim'],
    ['src/pages/flotacion/mecanismos.astro', 'stratum1-mechanisms-sim'],
    ['src/pages/en/flotation/mechanisms.astro', 'stratum1-mechanisms-sim'],
  ];

  for (const [rel, expectedId] of verticalSubpages) {
    const src = readSiteFile(rel);
    assert.ok(src.includes(`id="${expectedId}"`), `${rel} debe declarar id="${expectedId}"`);
    assert.ok(src.includes('smat-compact-hero'), `${rel} debe usar .smat-compact-hero`);
    const dispIdx = src.indexOf('smat-stratum1-display');
    const inpIdx = src.indexOf('smat-inputs-2col');
    assert.ok(dispIdx !== -1 && inpIdx !== -1 && dispIdx < inpIdx, `${rel} debe renderizar .smat-stratum1-display ANTES de .smat-inputs-2col`);
  }

  for (const rel of ['src/pages/control-de-procesos/index.astro', 'src/pages/en/process-control/index.astro']) {
    const src = readSiteFile(rel);
    assert.ok(src.includes('smat-compact-hero'), `${rel} debe usar .smat-compact-hero`);
    assert.ok(src.includes('smat-stage-compact'), `${rel} debe usar .smat-stage-compact`);
    assert.ok(src.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), `${rel} debe compactar .metrology-inputs-grid en 2 cols móvil`);
  }
});

function readAstroWithImportedComponents(relPath, visited = new Set()) {
  const norm = relPath.replace(/\\/g, '/');
  if (visited.has(norm)) return '';
  visited.add(norm);
  const absPath = path.join(SITE_ROOT, norm);
  if (!fs.existsSync(absPath)) return '';
  let combined = fs.readFileSync(absPath, 'utf8');
  const dir = path.dirname(norm);
  for (const m of combined.matchAll(/import\s+[A-Za-z0-9_$]+\s+from\s+['"]([^'"]+\.astro)['"]/g)) {
    const childRel = path.posix.normalize(path.posix.join(dir, m[1]));
    combined += '\n' + readAstroWithImportedComponents(childRel, visited);
  }
  return combined;
}

test('D4-V481 & DEB-V481-05/07: ergos/tour.toml cubre 27/27 actos sin centinelas muertos y cero bindings hydration sin usar', () => {
  const tourToml = fs.readFileSync(path.join(PROJECT_ROOT, 'ergos/tour.toml'), 'utf8');
  assert.ok(tourToml.includes('auto_discover_routes = true'), 'ergos/tour.toml debe habilitar auto_discover_routes = true');

  const actBlocks = tourToml.split('[[acts]]').slice(1);
  assert.equal(actBlocks.length, 27, `ergos/tour.toml debe declarar exactamente 27 actos (encontrados: ${actBlocks.length})`);

  for (const forbidden of ['#balanza-marcy', '#flight-deck', '.door-card', '#copy-toast', '#planta_durango', '#expeller_seal']) {
    assert.ok(!tourToml.includes(forbidden), `Selector muerto/prohibido ${forbidden} en ergos/tour.toml`);
  }

  const routeToFile = {
    '/': 'src/pages/index.astro',
    '/cotizar/': 'src/pages/cotizar.astro',
    '/control-de-procesos/': 'src/pages/control-de-procesos/index.astro',
    '/diagnostico/': 'src/pages/diagnostico.astro',
    '/acuse/': 'src/pages/acuse.astro',
    '/aviso/': 'src/pages/aviso.astro',
    '/bombeo/': 'src/pages/bombeo/index.astro',
    '/bombeo/impulsor/': 'src/pages/bombeo/impulsor.astro',
    '/bombeo/revestimientos/': 'src/pages/bombeo/revestimientos.astro',
    '/bombeo/sello/': 'src/pages/bombeo/sello.astro',
    '/bombeo/skid/': 'src/pages/bombeo/skid.astro',
    '/bombeo/soporte/': 'src/pages/bombeo/soporte.astro',
    '/catalogo/': 'src/pages/catalogo.astro',
    '/catalogo/anillo-expulsor/': 'src/pages/catalogo/[code].astro',
    '/clasificacion/': 'src/pages/clasificacion/index.astro',
    '/contacto/': 'src/pages/contacto.astro',
    '/cumplimiento/': 'src/pages/cumplimiento.astro',
    '/equipos/': 'src/pages/equipos/index.astro',
    '/filtracion/': 'src/pages/filtracion/index.astro',
    '/filtracion/prensa/': 'src/pages/filtracion/prensa.astro',
    '/filtracion/repuestos/': 'src/pages/filtracion/repuestos.astro',
    '/flotacion/': 'src/pages/flotacion/index.astro',
    '/flotacion/celdas/': 'src/pages/flotacion/celdas.astro',
    '/flotacion/mecanismos/': 'src/pages/flotacion/mecanismos.astro',
    '/garantia/': 'src/pages/garantia.astro',
    '/nosotros/': 'src/pages/nosotros.astro',
    '/productos/anillo-camara-expulsora-d4029/': 'src/pages/productos/[slug].astro',
  };

  const baseLayout = readSiteFile('src/layouts/BaseLayout.astro');
  const seenRoutes = new Set();
  for (const block of actBlocks) {
    const pathMatch = block.match(/path_or_hash\s*=\s*"([^"]+)"/);
    const selMatch = block.match(/wait_selector\s*=\s*"([^"]+)"/);
    assert.ok(pathMatch && selMatch, `Bloque [[acts]] inválido:\n${block}`);
    const route = pathMatch[1];
    const sel = selMatch[1];
    seenRoutes.add(route);
    assert.ok(routeToFile[route], `Ruta inesperada en tour.toml: ${route}`);
    const pageSrc = `${baseLayout}\n${readAstroWithImportedComponents(routeToFile[route])}`;
    if (sel.startsWith('#')) {
      assert.ok(pageSrc.includes(`id="${sel.slice(1)}"`), `El selector ${sel} de tour.toml no existe en ${routeToFile[route]}`);
    } else if (sel.includes('.')) {
      const cls = sel.split('.').pop();
      assert.ok(pageSrc.includes(cls), `La clase ${cls} de tour.toml no existe en ${routeToFile[route]}`);
    } else if (sel === 'main') {
      assert.ok(pageSrc.includes('<main'), `Falta <main> en ${routeToFile[route]}`);
    }
  }
  assert.equal(seenRoutes.size, 27, 'Los 27 actos deben apuntar a 27 rutas ES distintas');

  const lensJs = readSiteFile('src/scripts/verticalBidirectionalHydrationLens.js');
  assert.ok(!lensJs.includes('const hydration ='), 'DEB-V481-07: No debe haber `const hydration =` sin usar en verticalBidirectionalHydrationLens.js');
});
