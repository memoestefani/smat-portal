/**
 * catalogDropInAndJrpProjector.js
 * ---------------------------------------------------------------------------
 * Costura Modular Cohesiva LCOM4 = 1 ($\partial(C) = 0$) para:
 *   1. Verificador Zero-OEM FNV-1a + Triplete Geométrico $(A,B,C)$ en `/`, `/catalogo/` y `/equipos/` (`D8-V48`).
 *   2. Tarjeta Armónica JRP `(s, c, S)` de 3 etapas hidratada desde el bus unificado con toggle
 *      `normal` vs `paro_planta` + Par Casado sincronizado en `/catalogo/[code]/` y `/productos/[slug]/` (`D7-V48`).
 *   3. Clausura `Def-Use` 100% en `/control-de-procesos/` (`MARCY_STANDARD_RINGS`, Gy, ASTM E11) (`D6/D10-V48`).
 */

import { verifyDropInEquivalence } from './dropInEquivalenceGuard.js';
import { calculateCoupledReorderWindowDays, addTrayItem } from './requisitionTrayBus.js';
import {
  loadUnifiedEngineeringAndWorkbenchState,
  bindAtomicPartTrayButtons,
} from './verticalStateAndCtaSyncBridge.js';
import { MARCY_STANDARD_RINGS } from './tribologyAndCompatibilityEngine.js';

/**
 * Enlaza el verificador dimensional equivalente FNV-1a + triplete geométrico $(A, B, C)$
 * con acción directa 1-clic `+ Bandeja` (`[data-add-tray-sku]`) (`D8-V48`, purga `DEB-V48-05`).
 */
export function bindDropInEquivalenceVerifier(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es'
) {
  if (!root || typeof root.querySelectorAll !== 'function') return 0;
  const isEn = String(lang).toLowerCase() === 'en';
  const boxes = Array.from(root.querySelectorAll('[data-dropin-verifier], [data-dropin-verifier-en]'));
  let bound = 0;

  for (const verifierBox of boxes) {
    if (verifierBox.dataset && verifierBox.dataset.bound === 'true') continue;
    if (verifierBox.dataset) verifierBox.dataset.bound = 'true';

    const input = verifierBox.querySelector('[data-dropin-input], [data-dropin-input-en]');
    const btn = verifierBox.querySelector('[data-dropin-btn], [data-dropin-btn-en]');
    const resultEl = verifierBox.querySelector('[data-dropin-result], [data-dropin-result-en]');

    const runCheck = () => {
      const code = input && typeof input.value === 'string' ? input.value : '';
      const res = verifyDropInEquivalence(code);
      if (!resultEl) return res;
      if (resultEl.style) resultEl.style.display = 'block';

      if (res.matched && res.geometricTripletMm) {
        const trayBtnHtml = isEn
          ? `<button type="button" class="btn btn-outline" style="margin-left:0.5rem;padding:0.28rem 0.65rem;font-size:0.76rem;min-height:48px;" data-add-tray-sku="${res.canonicalSkuId}" data-tray-part-code="${res.atomicCode || res.canonicalSkuId}" data-tray-title="${res.titleEn}" data-tray-material="${res.alloyCode}" data-tray-circuit="catalogo">+ Add to Tray</button>`
          : `<button type="button" class="btn btn-outline" style="margin-left:0.5rem;padding:0.28rem 0.65rem;font-size:0.76rem;min-height:48px;" data-add-tray-sku="${res.canonicalSkuId}" data-tray-part-code="${res.atomicCode || res.canonicalSkuId}" data-tray-title="${res.titleEs}" data-tray-material="${res.alloyCode}" data-tray-circuit="catalogo">+ Bandeja</button>`;
        if (isEn) {
          resultEl.innerHTML = `✅ DROP-IN MATCH: <strong>${res.canonicalSkuId}</strong> (${res.titleEn}) | Alloy: <strong>${res.alloyCode}</strong> | ${res.geometricTripletMm.label_en} (${res.toleranceStd}) | Regime: <strong>${res.regimeBadgeEn}</strong> · <a href="/en/products/${res.slugEn}/" style="color:#b45309;text-decoration:underline;">Open Sheet →</a> ${trayBtnHtml}`;
        } else {
          resultEl.innerHTML = `✅ MATCH DROP-IN: <strong>${res.canonicalSkuId}</strong> (${res.titleEs}) | Aleación: <strong>${res.alloyCode}</strong> | ${res.geometricTripletMm.label_es} (${res.toleranceStd}) | Régimen: <strong>${res.regimeBadgeEs}</strong> · <a href="/productos/${res.slugEs}/" style="color:#b45309;text-decoration:underline;">Abrir Ficha →</a> ${trayBtnHtml}`;
        }
        bindAtomicPartTrayButtons(resultEl);
      } else {
        const msg = isEn ? res.reasonEn : res.reasonEs;
        resultEl.innerHTML = `ℹ️ ${msg}`;
      }
      return res;
    };

    if (btn && typeof btn.addEventListener === 'function') {
      btn.addEventListener('click', runCheck);
    }
    if (input && typeof input.addEventListener === 'function') {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          runCheck();
        }
      });
    }
    if (typeof window !== 'undefined' && window.location && window.location.search && input) {
      const params = new URLSearchParams(window.location.search);
      const urlSku = params.get('sku');
      if (urlSku) {
        input.value = urlSku;
        runCheck();
      }
    }
    bound += 1;
  }

  return bound;
}

/**
 * Inicializa la tarjeta Armónica JRP `(s, c, S)` de 3 etapas (`T0/2, T0, 2T0`)
 * hidratada con `sg` y `d50Um` reales del bus unificado, con selector `normal` vs
 * `paro_planta` y botón de Par Casado Sincronizado (`D7-V48`).
 */
export function initHarmonicJrpWindowAndPairCard(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es'
) {
  if (!root || typeof root.querySelectorAll !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  bindAtomicPartTrayButtons(root);

  const cards = Array.from(root.querySelectorAll('[data-jrp-window-card]'));
  if (cards.length === 0) return null;

  const unified = loadUnifiedEngineeringAndWorkbenchState();
  let lastEval = null;

  for (const card of cards) {
    let activeCrit = card.getAttribute?.('data-jrp-criticality') || 'normal';

    const sleeveEl = card.querySelector('[data-jrp-sleeve-day]');
    const impellerEl = card.querySelector('[data-jrp-impeller-day]');
    const voluteEl = card.querySelector('[data-jrp-volute-day]');
    const windowEl = card.querySelector('[data-jrp-window-days]');
    const severityEl = card.querySelector('[data-jrp-severity]');
    const telemetryBadgeEl = card.querySelector('[data-jrp-telemetry-badge]');
    const summaryEl = card.querySelector('[data-jrp-policy-summary]');
    const toggleBtns = Array.from(card.querySelectorAll('[data-jrp-criticality-toggle]'));
    const pairBtn = card.querySelector('[data-add-coupled-pair-btn]');

    const render = (critMode) => {
      activeCrit = critMode === 'paro_planta' ? 'paro_planta' : 'normal';
      if (typeof card.setAttribute === 'function') {
        card.setAttribute('data-jrp-criticality', activeCrit);
      }

      const jrp = calculateCoupledReorderWindowDays({
        sg: unified.sg,
        d50Um: unified.d50Um,
        criticalityMode: activeCrit,
      });
      lastEval = jrp;

      if (sleeveEl) sleeveEl.textContent = isEn ? `Day ${jrp.sleeveInspectionDay}` : `Día ${jrp.sleeveInspectionDay}`;
      if (impellerEl) impellerEl.textContent = isEn ? `Day ${jrp.impellerThroatbushSwapDay}` : `Día ${jrp.impellerThroatbushSwapDay}`;
      if (voluteEl) voluteEl.textContent = isEn ? `Day ${jrp.voluteLinerOverhaulDay}` : `Día ${jrp.voluteLinerOverhaulDay}`;
      if (windowEl) {
        windowEl.textContent = isEn
          ? `${jrp.recommendedWindowDays} d window`
          : `${jrp.recommendedWindowDays} d ventana`;
      }
      if (severityEl) severityEl.textContent = `${jrp.severityFactor}× (${jrp.criticalityFactor}×)`;
      if (telemetryBadgeEl) {
        telemetryBadgeEl.textContent = isEn
          ? `Session Pulp SG ${unified.sg.toFixed(2)} • d50 ${Math.round(unified.d50Um)} µm`
          : `Pulpa Sesión SG ${unified.sg.toFixed(2)} • d50 ${Math.round(unified.d50Um)} µm`;
      }
      if (summaryEl) {
        summaryEl.textContent = isEn ? jrp.policySummaryEn : jrp.policySummaryEs;
      }

      toggleBtns.forEach((b) => {
        const mode = b.getAttribute('data-jrp-criticality-toggle');
        const isActive = mode === activeCrit;
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (b.style) {
          b.style.background = isActive ? '#0c4a6e' : '#ffffff';
          b.style.color = isActive ? '#ffffff' : '#0f172a';
        }
      });
      return jrp;
    };

    if (!card.dataset || card.dataset.jrpBound !== '1') {
      if (card.dataset) card.dataset.jrpBound = '1';
      toggleBtns.forEach((btn) => {
        if (typeof btn.addEventListener === 'function') {
          btn.addEventListener('click', () => {
            render(btn.getAttribute('data-jrp-criticality-toggle') || 'normal');
          });
        }
      });

      if (pairBtn && typeof pairBtn.addEventListener === 'function') {
        pairBtn.addEventListener('click', () => {
          const getP = (attr, prop, fb = '') => pairBtn.getAttribute?.(attr) || pairBtn.dataset?.[prop] || fb;
          const pSku = getP('data-pair-primary-sku', 'pairPrimarySku', 'SMAT-PUMP-IMP-147');
          const pTitle = getP('data-pair-primary-title', 'pairPrimaryTitle', pSku);
          const sSku = getP('data-pair-secondary-sku', 'pairSecondarySku', 'SMAT-PUMP-TB-083');
          const sTitle = getP('data-pair-secondary-title', 'pairSecondaryTitle', sSku);
          const series = getP('data-pair-series', 'pairSeries', '6x4');
          const material = getP('data-pair-material', 'pairMaterial', 'A05');

          addTrayItem({
            id: pSku,
            skuId: pSku,
            atomicCode: pSku,
            nameEs: pTitle,
            nameEn: pTitle,
            series,
            material,
            circuit: 'bombeo',
            criticalityMode: activeCrit === 'paro_planta' ? 'PARO_DE_LINEA' : 'NORMAL',
            qty: 1,
            source: 'jrp_coupled_pair',
          });
          addTrayItem({
            id: sSku,
            skuId: sSku,
            atomicCode: sSku,
            nameEs: sTitle,
            nameEn: sTitle,
            series,
            material,
            circuit: 'bombeo',
            criticalityMode: activeCrit === 'paro_planta' ? 'PARO_DE_LINEA' : 'NORMAL',
            qty: 1,
            source: 'jrp_coupled_pair',
          });
          pairBtn.textContent = isEn ? '✓ Synchronized Pair Added' : '✓ Par Casado Agregado';
        });
      }
    }

    render(activeCrit);
  }

  return lastEval;
}

/**
 * Proyecta el 100% de invariantes de Pierre Gy, Rosin-Rammler y los 12 anillos
 * `MARCY_STANDARD_RINGS` en `/control-de-procesos/` (`D6-V48`, `D10-V48`, clausura `Def-Use`).
 */
export function projectProcessControlMetrologyInvariants(
  root = typeof document !== 'undefined' ? document : null,
  lang = 'es',
  snapshot = {}
) {
  if (!root || typeof root.querySelector !== 'function') return null;
  const isEn = String(lang).toLowerCase() === 'en';
  bindAtomicPartTrayButtons(root);

  const marcy = snapshot.marcy || null;
  const gy = snapshot.gy || null;
  const sieveStack = snapshot.sieveStack || null;

  const ringsContainer = root.querySelector('[data-marcy-rings-list]');
  if (ringsContainer && MARCY_STANDARD_RINGS.length > 0) {
    const activeRing = marcy ? Number(marcy.recommendedRingSg) : 2.8;
    if (!ringsContainer.dataset || ringsContainer.dataset.ringsRendered !== '1') {
      if (ringsContainer.dataset) ringsContainer.dataset.ringsRendered = '1';
      ringsContainer.innerHTML = MARCY_STANDARD_RINGS.map((r) => {
        const sgVal = Number(r?.oreSg ?? r).toFixed(1);
        return `<button type="button" class="marcy-ring-chip" data-marcy-ring-sg="${sgVal}" style="min-height:48px;min-width:56px;padding:0.25rem 0.55rem;border:1px solid #cbd5e1;border-radius:6px;background:#ffffff;color:#0f172a;font-family:var(--smat-font-mono);font-size:0.75rem;font-weight:700;cursor:pointer;">SG ${sgVal}</button>`;
      }).join('');

      const sgInput = root.querySelector('#met-sg-input');
      ringsContainer.querySelectorAll('[data-marcy-ring-sg]').forEach((chip) => {
        if (typeof chip.addEventListener === 'function' && sgInput) {
          chip.addEventListener('click', () => {
            sgInput.value = chip.getAttribute('data-marcy-ring-sg') || '2.8';
            if (typeof sgInput.dispatchEvent === 'function' && typeof Event === 'function') {
              sgInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        }
      });
    }
    ringsContainer.querySelectorAll('[data-marcy-ring-sg]').forEach((chip) => {
      const val = Number(chip.getAttribute('data-marcy-ring-sg'));
      const isMatch = Math.abs(val - activeRing) < 0.06;
      chip.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      if (chip.style) {
        chip.style.background = isMatch ? '#0c4a6e' : '#ffffff';
        chip.style.color = isMatch ? '#ffffff' : '#0f172a';
        chip.style.borderColor = isMatch ? '#0c4a6e' : '#cbd5e1';
      }
    });
  }

  let waterVolumeMlInCup = 0;
  let volumetricFractionCvPct = 0;
  if (marcy) {
    waterVolumeMlInCup = Math.max(0, Math.round(Number(marcy.cupNetMassGrams || 0) - Number(marcy.drySolidsMassGramsInCup || 0)));
    volumetricFractionCvPct = Number(marcy.solidsVolumePercent || 0);
    const setTxt = (sel, txt) => {
      const el = root.querySelector(sel);
      if (el) el.textContent = String(txt);
    };
    setTxt('[data-met-defuse-water-ml]', `${waterVolumeMlInCup} mL`);
    setTxt('[data-met-defuse-cv-pct]', `${volumetricFractionCvPct.toFixed(1)}%`);
    setTxt('[data-met-defuse-cup-mass]', `${marcy.cupNetMassGrams} g`);
    setTxt('[data-met-defuse-dry-solids]', `${marcy.drySolidsMassGramsInCup} g`);
  }

  if (gy) {
    const setTxt = (sel, txt) => {
      const el = root.querySelector(sel);
      if (el) el.textContent = String(txt);
    };
    setTxt('[data-met-defuse-gy-beta]', `β = ${gy.liberationFactorBeta}`);
    setTxt('[data-met-defuse-gy-m]', `m = ${gy.mineralogicalFactorM}`);
    setTxt('[data-met-defuse-gy-pulp]', `${gy.requiredPulpLiters} L`);
    setTxt('[data-met-defuse-gy-minutes]', `${gy.recommendedCycleMinutes} min`);
    setTxt('[data-met-defuse-gy-moisture]', `${gy.estimatedCakeMoisturePct}%`);
    setTxt('[data-met-defuse-gy-status]', String(gy.filterPressStatus || ''));
  }

  if (sieveStack) {
    const firstSieve = Array.isArray(sieveStack.sieveStack) && sieveStack.sieveStack[0] ? sieveStack.sieveStack[0] : null;
    const totalCumMass = Array.isArray(sieveStack.sieveStack) && sieveStack.sieveStack.length > 0
      ? Number(sieveStack.sieveStack[sieveStack.sieveStack.length - 1].cumulativeMassRetainedGrams || 0)
      : 0;
    const frameMat = firstSieve?.frameMaterial || sieveStack.recommendedFrameMaterialEs || (isEn ? '304/316 SS' : 'Acero Inox 304/316');
    const setTxt = (sel, txt) => {
      const el = root.querySelector(sel);
      if (el) el.textContent = String(txt);
    };
    setTxt('[data-met-defuse-d63]', `${sieveStack.characteristicSizeD63Microns} µm`);
    setTxt('[data-met-defuse-cum-mass]', `${totalCumMass.toFixed(1)} g`);
    setTxt('[data-met-defuse-frame-mat]', frameMat);
  }

  return {
    ringsCount: MARCY_STANDARD_RINGS.length,
    waterVolumeMlInCup,
    volumetricFractionCvPct,
    hasGyProjection: Boolean(gy),
    hasSieveProjection: Boolean(sieveStack),
  };
}
