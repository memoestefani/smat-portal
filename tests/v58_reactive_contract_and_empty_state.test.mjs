import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import atomicParts from '../data/atomic_parts.json' with { type: 'json' };
import rolesData from '../data/roles.json' with { type: 'json' };
import { parseBomPasteInput } from '../src/scripts/bomPasteParser.js';
import { buildCatalogFacetedViewModel } from '../src/scripts/catalogFacetedViewModel.js';
import {
  buildBomPasteViewModel,
  buildMetrologyViewModel,
  buildTribologyAssemblyViewModel,
  projectViewModelToDom,
} from '../src/scripts/instrumentViewModels.js';
import { resolvePumpingTabDeepLink } from '../src/scripts/pumpingTabRouter.js';
import {
  buildCmuPrioritySubjectLine,
  computeCmuPriorityDescriptor,
} from '../src/scripts/requisitionTrayBus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, '..');

function walkFiles(dirPath, exts) {
  const out = [];
  if (!fs.existsSync(dirPath)) return out;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

test('V58-G1: Zero Phantom DOM IDs across scripts vs components & live #wb-jrp-daily-hours', () => {
  const purgedPhantoms = [
    'trib-vtip-ms',
    'trib-branch',
    'cyc-res-recovery',
    'cyc-res-action',
    'csr-weibull-out',
    'filt-res-secondary',
    'filt-timoshenko-readout',
    'met-sg-input',
  ];

  const scriptFiles = walkFiles(path.join(SITE_ROOT, 'src/scripts'), ['.js']);
  for (const file of scriptFiles) {
    const code = fs.readFileSync(file, 'utf8');
    for (const ghost of purgedPhantoms) {
      assert.equal(
        code.includes(ghost),
        false,
        `Purged phantom ID '${ghost}' must not reappear in ${path.relative(SITE_ROOT, file)}`
      );
    }
  }

  const componentCorpus = walkFiles(path.join(SITE_ROOT, 'src/components'), ['.astro'])
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');

  for (const bridgeRel of [
    'src/scripts/pumpingSealAndTribologyCalculators.js',
    'src/scripts/cycloneScreenBridge.js',
    'src/scripts/flotationFiltrationBridge.js',
    'src/scripts/catalogDropInAndJrpProjector.js',
  ]) {
    const code = fs.readFileSync(path.join(SITE_ROOT, bridgeRel), 'utf8');
    const idMatches = [...code.matchAll(/querySelector(?:All)?\(['"`]#([a-z0-9-]+)['"`]\)|getElementById\(['"`]([a-z0-9-]+)['"`]\)/gi)];
    for (const m of idMatches) {
      const targetId = m[1] || m[2];
      if (!targetId) continue;
      assert.ok(
        componentCorpus.includes(`id="${targetId}"`) || componentCorpus.includes(`id='${targetId}'`),
        `Referenced DOM ID '#${targetId}' in ${bridgeRel} must exist in src/components/*.astro`
      );
    }
  }

  const qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  const bindingsSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/wizardEventBindings.js'), 'utf8');
  assert.ok(qwSrc.includes('id="wb-jrp-daily-hours"'));
  assert.ok(bindingsSrc.includes('wb-jrp-daily-hours'));
});

test('V58-G2: Native InstrumentShell visual order (no Flexbox order:) & preserved SI typography', () => {
  const css = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/cores-apple.css'), 'utf8');
  const inputsBlock = css.match(/\.smat-instrument-inputs\s*\{[^}]*\}/)?.[0] || '';
  const verdictBlock = css.match(/\.smat-instrument-verdict\s*\{[^}]*\}/)?.[0] || '';
  const kpiStrongBlock = css.match(/\.instrument-kpi-cell\s+strong\s*\{[^}]*\}/)?.[0] || '';

  assert.ok(inputsBlock.length > 0 && verdictBlock.length > 0);
  assert.equal(/\border\s*:/.test(inputsBlock), false, '.smat-instrument-inputs must not use Flexbox order:');
  assert.equal(/\border\s*:/.test(verdictBlock), false, '.smat-instrument-verdict must not use Flexbox order:');
  assert.equal(/text-transform\s*:\s*uppercase/.test(kpiStrongBlock), false, '.instrument-kpi-cell strong must preserve SI symbol case');
});

test('V58-G3: Runtime EMPTY Guard, bilingual roles/catalog, reactive ViewModels & pumpingTabRouter', () => {
  const emptyEs = buildCmuPrioritySubjectLine({ items: [] }, { lang: 'es' });
  const emptyEn = buildCmuPrioritySubjectLine({ items: [] }, { lang: 'en' });
  for (const str of [emptyEs, emptyEn]) {
    assert.equal(/PARO DE L[IÍ]NEA|1 SKU|SMAT-23FC-5C55|P1-PARO-PLANTA/i.test(str), false, `Empty line leaked: ${str}`);
  }

  const emptyDescEn = computeCmuPriorityDescriptor({ items: [], lang: 'en' });
  assert.equal(emptyDescEn.cmuScore, 0);
  assert.equal(emptyDescEn.priorityCode.includes('PARO'), false);

  const urgentDescEn = computeCmuPriorityDescriptor({
    items: [{ id: 'X', qty: 1 }],
    criticalityMode: 'PARO_DE_LINEA',
    lang: 'en',
  });
  assert.equal(urgentDescEn.priorityCode, 'P1-LINE-STOP');

  const tribVm = buildTribologyAssemblyViewModel(
    { d80Um: 950, u2Ms: 28.5, ph: 7, material: 'ceramica_sic', series: '6x4', impellerDiameterMm: 381 },
    'es'
  );
  assert.ok(Array.isArray(tribVm.primaryKpis) && tribVm.primaryKpis.length >= 3);
  assert.ok(tribVm.technicalDetails.length > 0);

  const slotList = [
    { getAttribute: (k) => (k === 'data-vm-slot' ? 'headline' : null), textContent: '' },
    { getAttribute: (k) => (k === 'data-vm-slot' ? 'collisionAlert' : null), textContent: '', classList: { toggle() {} } },
  ];
  const mockRoot = {
    querySelectorAll(sel) {
      return sel === '[data-vm-slot]' ? slotList : [];
    },
    querySelector(sel) {
      const m = sel.match(/\[data-vm-slot="([^"]+)"\]/);
      return m ? slotList.find((el) => el.getAttribute('data-vm-slot') === m[1]) || null : null;
    },
  };
  const projCount = projectViewModelToDom(mockRoot, tribVm);
  assert.ok(projCount >= 2);
  assert.ok(slotList[0].textContent.length > 0);

  const metVm = buildMetrologyViewModel({ topSizeD95Mm: 9.5, liberationSizeMicrons: 105 }, 'en');
  assert.ok(metVm.gyRecommendation && metVm.gyRecommendation.length > 5);
  assert.equal(metVm.gyRecommendation.includes('Pierre Gy'), false);
  assert.equal(metVm.gyRecommendation.includes("y'="), false);

  const bomVm = buildBomPasteViewModel(parseBomPasteInput('SMAT-PUMP-WETKIT-554 2\nUNKNOWN-PART-999'), 'es');
  assert.equal(bomVm.matchedCount, 1);
  assert.equal(bomVm.unmatchedCount, 1);

  assert.equal(resolvePumpingTabDeepLink('?tab=seals&sub=bearing')?.subTab, 'bearing');
  assert.equal(resolvePumpingTabDeepLink('?tab=tribology&focus=liners')?.focus, 'liners');
  assert.equal(resolvePumpingTabDeepLink('', '#como-se-arma-una-bomba')?.station, 'assembly');

  const catVmEn = buildCatalogFacetedViewModel({ atomicParts, rolesData, locale: 'en' });
  assert.ok(catVmEn.bombeoPowerRange.includes('30 HP to 250 HP'));
  assert.equal(catVmEn.bombeoPowerRange.includes('30 HP a 250 HP'), false);

  const dossierSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/LiveEngineeringDossier.astro'), 'utf8');
  assert.equal(dossierSrc.includes("defaultPartSpecs.hardness || '≥ 650 HB"), false);
  const acuseCtrl = fs.readFileSync(path.join(SITE_ROOT, 'src/scripts/acuseSheetController.js'), 'utf8');
  assert.ok(acuseCtrl.includes('isEmptyRequisition'));
});

test('V58-G4: Mobile Menu, 3-Step QuoteWizard Stepper, Pumping Station 4 & SSOT Surface', () => {
  const headerSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/Header.astro'), 'utf8');
  const globalCss = fs.readFileSync(path.join(SITE_ROOT, 'src/styles/global.css'), 'utf8');
  assert.ok(headerSrc.includes('id="header-mobile-menu"'));
  assert.ok(headerSrc.includes('Menú') && headerSrc.includes('Menu'));
  assert.ok(globalCss.includes('.header-mobile-trigger'));

  const qwSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/QuoteWizard.astro'), 'utf8');
  const fastLaneSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/wizard/FastLaneBomBar.astro'), 'utf8');
  assert.ok(qwSrc.includes('id="qw-stepper-bar"'));
  assert.ok(qwSrc.includes('data-qw-step-tab="1"') && qwSrc.includes('data-qw-step-tab="2"') && qwSrc.includes('data-qw-step-tab="3"'));
  assert.ok(fastLaneSrc.indexOf('wb-mining-unit-select') < fastLaneSrc.indexOf('<details'));

  const pumpingSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/PumpingHubIsland.astro'), 'utf8');
  assert.ok(pumpingSrc.includes('pumpingTabRouter.js'));
  assert.ok(pumpingSrc.includes('id="pumping-assembly-station"'));

  const atomicSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/islands/AtomicPartIsland.astro'), 'utf8');
  const qcardSrc = fs.readFileSync(path.join(SITE_ROOT, 'src/components/ProductQuickCard.astro'), 'utf8');
  assert.ok(atomicSrc.includes('assembly_order') && atomicSrc.includes('wet_end_kit_ratio'));
  assert.ok(qcardSrc.includes('linked_atomic_codes') && qcardSrc.includes('secondary_diagram_id'));

  const distEnQuote = path.join(SITE_ROOT, 'dist/en/quote/index.html');
  if (fs.existsSync(distEnQuote)) {
    const html = fs.readFileSync(distEnQuote, 'utf8');
    assert.equal(html.includes('P1-PARO-PLANTA'), false);
    assert.equal(html.includes('≥ 650 HB (60–62 HRC)'), false);
  }
});
