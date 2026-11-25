// tests/v80_amazon_zero_oem_and_links.test.mjs
// Verificación V8.0 Ola A: Triple candado Cero-OEM, Congruencia Material-Visual, y Cero Enlaces 404.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertEntryHygiene,
  assertUniqueSourceSha256,
  assertZeroOemTextOrPath,
  validateMediaGallerySpec
} from '../tools/media_hygiene_guard.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

test('V80-A07: media_hygiene_guard rechaza marcas OEM, clase material opuesta y clones source_sha256', () => {
  assert.throws(() => assertZeroOemTextOrPath('Bomba warman 8 x 6.jpg', 'test'), /E_OEM_TRADEMARK_LEAK/);
  assert.throws(() => assertZeroOemTextOrPath('30tyler.JPG', 'test'), /E_OEM_TRADEMARK_LEAK/);

  assert.throws(
    () =>
      assertEntryHygiene(
        {
          relPath: 'impulsor_hule.jpg',
          visual_brand_audit: 'CLEAN_ZERO_OEM',
          material_class: 'R55_RUBBER'
        },
        'A05_METAL',
        'SMAT-PUMP-IMP-AH[0]'
      ),
    /E_MATERIAL_CLASS_MISMATCH/
  );

  assert.throws(
    () =>
      assertEntryHygiene(
        {
          relPath: 'sello_cartucho.jpg',
          visual_brand_audit: 'CLEAN_ZERO_OEM',
          material_class: 'MECHANICAL_SEAL'
        },
        'EXPELLER_DRY_SEAL',
        'SMAT-PUMP-EXPELLER-KIT[0]'
      ),
    /E_MATERIAL_CLASS_MISMATCH/
  );

  assert.throws(
    () =>
      assertEntryHygiene(
        {
          relPath: 'pieza_limpia.jpg',
          material_class: 'A05_METAL'
        },
        'A05_METAL',
        'MISSING_AUDIT'
      ),
    /E_UNAUDITED_BRAND_IMAGE/
  );

  assert.throws(
    () =>
      assertUniqueSourceSha256([
        { id: 'SKU-A', source_sha256: 'abc123' },
        { id: 'SKU-B', source_sha256: 'abc123' }
      ]),
    /E_SOURCE_SHA256_CLONE/
  );
});

test('V80-A09/A10: media_gallery_spec y manifest WebP 100% curados sin marcas OEM, XRF Cr27 en slide v2 y EXIF limpio', () => {
  const curaduria = JSON.parse(
    fs.readFileSync(path.join(SITE_ROOT, 'data/fototeca_curaduria_manifest.json'), 'utf8')
  );
  assert.ok(curaduria.bucket_counts['00_CUARENTENA_MARCAS_Y_AGUA'] >= 50);
  assert.ok(curaduria.bucket_counts['01_APROBADAS_LIMPIAS'] >= 65);

  const specDoc = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/media_gallery_spec.json'), 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/quick_checkout_Catalog.json'), 'utf8'));
  const atomicParts = JSON.parse(fs.readFileSync(path.join(SITE_ROOT, 'data/atomic_parts.json'), 'utf8'));

  const validation = validateMediaGallerySpec(specDoc, catalog, atomicParts);
  assert.equal(validation.checkedSkus, 19);
  assert.equal(validation.checkedAtomic, 13);

  const impSlides = specDoc.sku_galleries['SMAT-PUMP-IMP-AH'].slides;
  assert.ok(
    impSlides[1].relPath.includes('xrf_cr27'),
    'SMAT-PUMP-IMP-AH[1] debe exponer la prueba real XRF Cr 27.209% (INV-SMAT-SCI-09)'
  );

  const rawSpecText = JSON.stringify(specDoc).toLowerCase();
  for (const banned of ['warman', 'tyler', 'ro tap', 'ro-tap', 'dscf7828', 'dscf7835', 'malla para criba']) {
    assert.equal(rawSpecText.includes(banned), false, `Token prohibido '${banned}' sigue en media_gallery_spec.json`);
  }

  const manifest = JSON.parse(
    fs.readFileSync(path.join(SITE_ROOT, 'public/images/productos/manifest.json'), 'utf8')
  );
  assert.equal(manifest.hygiene_version, 'v8.0-zero-oem');
  assert.equal(manifest.unique_source_sha256, 19);
  assert.equal(manifest.exif_stripped_all, true);
});

test('V80-A11..A14: 0 slugs rotos en Footer/Core/Scripts y productSlugSolar.css importado en [code].astro ES/EN', () => {
  const footerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Footer.astro'), 'utf8');
  assert.equal(footerSrc.includes('filter-press-plates-and-cloths-16bar'), false);
  assert.ok(footerSrc.includes('/en/products/filter-press-cloths-and-pp-plates-16bar/'));

  const cycCore = fs.readFileSync(path.join(SITE_ROOT, 'src/components/cores/CycloneScreenCore.astro'), 'utf8');
  assert.equal(cycCore.includes('malla-criba-poliuretano-alta-frecuencia'), false);
  assert.ok(cycCore.includes('mallas-finas-uretano-th48-30/'));

  for (const rel of [
    'src/components/cores/DropInVerifierCore.astro',
    'src/scripts/pumpingSealAndTribologyCalculators.js',
    'src/scripts/verticalBidirectionalHydrationLens.js',
    'src/scripts/catalogDropInAndJrpProjector.js'
  ]) {
    const txt = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    for (const dead of [
      '/equipos/',
      '/bombeo/skid/',
      '/bombeo/impulsor/',
      '/bombeo/revestimientos/',
      '/bombeo/sello/',
      '/bombeo/soporte/',
      '/en/pumping/skid/',
      '/en/pumping/impeller/',
      '/en/pumping/liners/',
      '/en/pumping/seal/'
    ]) {
      assert.equal(txt.includes(dead), false, `Ruta retirada '${dead}' sigue en ${rel}`);
    }
  }

  for (const rel of ['src/pages/catalogo/[code].astro', 'src/pages/en/catalog/[code].astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('productSlugSolar.css'), `${rel} debe importar productSlugSolar.css`);
  }
});

test('V80-B01..B14: Omnibox Home, Stratum2<=350 LOC, Checkout honesto, Trust Photos 640x480 y Cero Jerga', () => {
  const pumpingHub = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingHubIsland.astro'), 'utf8');
  assert.ok(pumpingHub.split(/\r?\n/).length <= 350, 'PumpingHubIsland.astro debe mantenerse <= 350 LOC');

  const dossier = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.ok(dossier.split(/\r?\n/).length <= 350, 'LiveEngineeringDossier.astro debe mantenerse <= 350 LOC');
  assert.equal(dossier.includes('data-add-tray-sku'), false, 'LiveEngineeringDossier no debe duplicar CTAs [data-add-tray-sku]');
  assert.equal(dossier.includes('SMAT-PUMP-6X4-WETKIT'), false);
  assert.equal(dossier.includes('Pinza Térmica IEC'), false);

  const homeIsland = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/HomeLandingIsland.astro'), 'utf8');
  assert.ok(homeIsland.includes('id="home-omnibox-input"'), 'HomeLandingIsland debe exponer #home-omnibox-input');

  const stratum2 = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingAssistantStratum2.astro'), 'utf8');
  assert.ok(stratum2.includes(':global(#wb-pipe-size)') && stratum2.includes('max-width: 100%'));
  assert.equal(stratum2.includes('Finnie-Hutchings'), false);
  assert.equal(stratum2.includes('Waters-NIOSH'), false);

  const labels = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/i18nDomainLabels.js'), 'utf8');
  for (const jargon of ['Gorain', 'Darcy', 'Timoshenko']) {
    assert.equal(labels.includes(jargon), false, `i18nDomainLabels.js no debe exponer epónimo '${jargon}'`);
  }

  const acuse = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/AcuseSheetIsland.astro'), 'utf8');
  const acuseVisible = acuse
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  assert.equal(/\bpayload\b/i.test(acuseVisible), false, 'AcuseSheetIsland.astro no debe exponer la palabra payload en texto visible');

  for (const rel of [
    'src/pages/garantia.astro',
    'src/pages/en/warranty.astro',
    'src/pages/cumplimiento.astro',
    'src/pages/en/compliance.astro',
    'src/pages/contacto.astro',
    'src/pages/en/contact.astro',
  ]) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(src.includes('<img') && src.includes('width="640"') && src.includes('height="480"'), `${rel} requiere foto real 640x480`);
  }

  for (const rel of ['src/pages/cumplimiento.astro', 'src/pages/en/compliance.astro']) {
    const src = fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');
    assert.ok(
      src.includes('<details class="compliance-json-box" id="compliance-json-drawer">'),
      `${rel} debe colapsar JSON técnico en #compliance-json-drawer`
    );
  }
});
