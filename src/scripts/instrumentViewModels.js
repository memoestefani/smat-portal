// @ts-check
/**
 * instrumentViewModels.js
 * ---------------------------------------------------------------------------
 * Capa Canónica de Proyección ViewModel Tipada (`D2-V57`, `ARB-SMAT-66`).
 * Cierra retornos útiles del backend (`totalUnits`, `lineCount`, `wearMultiplierVsCr27`,
 * `isCorrosiveAcidic`, `targetRelativeStdErrorPercent`, `recommendationEs/En`,
 * `isValidAssembly`, `collisionRiskEs/En`, `fullMetalMassKg`, `bearingServiceFactor`,
 * `ceramicSafeTipSpeed`, `cmuScore`) clasificándolos en KPIs primarios y detalle técnico.
 */

import { formatScientificUnit } from './i18nDomainLabels.js';

/**
 * Proyecta el resultado de `parseBomPasteInput` exponiendo `lineCount` y `totalUnits` (`ERG-SMAT-008/009`).
 * @param {{ matched?: any[], unmatched?: any[], totalUnits?: number, lineCount?: number }} [parsed={}]
 * @param {'es'|'en'} [lang='es']
 */
export function buildBomPasteViewModel(parsed = {}, lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const matchedCount = Array.isArray(parsed.matched) ? parsed.matched.length : 0;
  const unmatchedCount = Array.isArray(parsed.unmatched) ? parsed.unmatched.length : 0;
  const lineCount = Number.isFinite(Number(parsed.lineCount)) ? Number(parsed.lineCount) : matchedCount + unmatchedCount;
  const totalUnits = Number.isFinite(Number(parsed.totalUnits))
    ? Number(parsed.totalUnits)
    : (Array.isArray(parsed.matched) ? parsed.matched.reduce((acc, r) => acc + (Number(r?.qty) || 0), 0) : 0);

  const badgeEs = `${lineCount} línea(s) detectada(s) · ${totalUnits} pieza(s) totales (${matchedCount} SKU válido(s)${unmatchedCount > 0 ? `, ${unmatchedCount} sin coincidencia` : ''})`;
  const badgeEn = `${lineCount} line(s) detected · ${totalUnits} total unit(s) (${matchedCount} valid SKU(s)${unmatchedCount > 0 ? `, ${unmatchedCount} unmatched` : ''})`;

  return {
    lineCount,
    totalUnits,
    matchedCount,
    unmatchedCount,
    badgeEs,
    badgeEn,
    badgeText: isEn ? badgeEn : badgeEs,
  };
}

/**
 * Proyecta métricas enriquecidas de selección tribológica, armado 5-5-4 y cinemática de accionamiento.
 * @param {{ optimalMaterial?: Record<string, any>, hybridEval?: Record<string, any>, assemblySeqEval?: Record<string, any>, driveEval?: Record<string, any> }} [params={}]
 * @param {'es'|'en'} [lang='es']
 */
export function buildTribologyAssemblyViewModel(params = {}, lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const mat = params.optimalMaterial || {};
  const hyb = params.hybridEval || {};
  const seq = params.assemblySeqEval || {};
  const drv = params.driveEval || {};

  const wearMultiplierVsCr27 = Number(mat.wearMultiplierVsCr27 ?? 1.0);
  const isCorrosiveAcidic = Boolean(mat.isCorrosiveAcidic);
  const fullMetalMassKg = Number(hyb.fullMetalMassKg ?? 0);
  const hybridPartsCount = Array.isArray(hyb.hybridBomParts) ? hyb.hybridBomParts.length : 0;
  const architectureId = String(hyb.architectureId || 'BRANCH_D_HYBRID');
  const isValidAssembly = seq.isValidAssembly !== false;
  const collisionText = isEn
    ? String(seq.collisionRiskEn || (isValidAssembly ? 'Canonical EST-01→EST-05 sequence verified (zero clash).' : 'Assembly collision risk detected.'))
    : String(seq.collisionRiskEs || (isValidAssembly ? 'Secuencia canónica EST-01→EST-05 verificada (cero colisión).' : 'Riesgo de colisión de armado detectado.'));
  const canonicalSeqText = Array.isArray(seq.canonicalSequence) ? seq.canonicalSequence.join(' → ') : 'EST-01 → EST-02 → EST-03 → EST-04 → EST-05';
  const bomTotalCount = Array.isArray(seq.bomParts) ? seq.bomParts.length : 0;
  const activeBranchPartsCount = Array.isArray(seq.selectedPartSpec) ? seq.selectedPartSpec.length : 0;
  const bearingServiceFactor = Number(drv.bearingServiceFactor ?? 1.5);
  const ceramicSafeTipSpeed = Boolean(drv.ceramicSafeTipSpeed ?? true);
  const arrangementName = isEn ? String(drv.arrangementNameEn || drv.arrangement || 'CV') : String(drv.arrangementNameEs || drv.arrangement || 'CV');
  const radialLoadKn = Number(drv.radialBeltLoadKn ?? drv.beltRadialLoadKn ?? 0);
  const bearingL10h = Number(drv.estimatedBearingL10h ?? drv.bearingL10Hours ?? 0);

  return {
    headline: isEn
      ? `${arrangementName} · Wear ${wearMultiplierVsCr27.toFixed(1)}× vs Cr27${isCorrosiveAcidic ? ' · Acidic Guard Active' : ''}`
      : `${arrangementName} · Vida ${wearMultiplierVsCr27.toFixed(1)}× vs Cr27${isCorrosiveAcidic ? ' · Resguardo Ácido' : ''}`,
    primaryKpis: [
      { key: 'wearMultiplierVsCr27', label: isEn ? 'Wear Ratio vs Cr27' : 'Factor Vida vs Cr27', value: `${wearMultiplierVsCr27.toFixed(1)}×` },
      { key: 'bearingServiceFactor', label: isEn ? 'Bearing Service Factor' : 'Factor Servicio Rodamiento', value: `${bearingServiceFactor.toFixed(2)}×` },
      { key: 'estimatedBearingL10h', label: isEn ? 'ISO 281 L₁₀ₕ' : 'Vida ISO 281 L₁₀ₕ', value: bearingL10h > 0 ? `${bearingL10h.toLocaleString(isEn ? 'en-US' : 'es-MX')} h` : '—' },
      { key: 'fullMetalMassKg', label: isEn ? 'Full Metal vs Hybrid' : 'Masa Full Metal / Híbrida', value: fullMetalMassKg > 0 ? `${fullMetalMassKg} kg (${architectureId})` : architectureId },
    ],
    technicalDetails: [
      { key: 'ceramicSafeTipSpeed', label: isEn ? 'SiC Tip Limit (≤28 m/s)' : 'Límite Punta SiC (≤28 m/s)', value: ceramicSafeTipSpeed ? (isEn ? 'Safe' : 'Seguro') : (isEn ? 'Exceeded' : 'Excedido') },
      { key: 'radialBeltLoadKn', label: isEn ? 'Belt Radial Load F_r' : 'Carga Radial Banda F_r', value: `${radialLoadKn.toFixed(2)} kN` },
      { key: 'hybridBomParts', label: isEn ? 'Hybrid Kit Parts' : 'Piezas Kit Híbrido', value: String(hybridPartsCount) },
      { key: 'assemblyBomSpec', label: isEn ? '5-5-4 Branch List' : 'Lista Rama 5-5-4', value: bomTotalCount > 0 ? `${activeBranchPartsCount}/${bomTotalCount}` : '14' },
      { key: 'canonicalSequence', label: isEn ? 'Canonical Order' : 'Orden Canónico', value: canonicalSeqText },
    ],
    collisionAlert: {
      isValidAssembly,
      text: collisionText,
    },
  };
}

/**
 * Proyecta los resultados de Metrología (Marcy, Muestreo Gy, Tamices ASTM) eliminando huérfanos.
 * @param {{ marcy?: Record<string, any>, gy?: Record<string, any>, astm?: Record<string, any> }} [params={}]
 * @param {'es'|'en'} [lang='es']
 */
export function buildMetrologyViewModel(params = {}, lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const marcy = params.marcy || {};
  const gy = params.gy || {};
  const astm = params.astm || {};

  const pulpDensitySg = Number(marcy.pulpDensitySg ?? marcy.marcyDensityKgL ?? 1.407);
  const slurryDensityKgL = Number(marcy.slurryDensityKgL ?? pulpDensitySg);
  const ringApparentCw = Number(marcy.ringApparentCw ?? marcy.cwPct ?? 45);
  const targetRelErr = Number(gy.targetRelativeStdErrorPercent ?? 5.0);
  const gyRec = isEn
    ? String(gy.recommendationEn || 'Maintain minimum representative sample mass split prior to lab drying.')
    : String(gy.recommendationEs || 'Conservar masa mínima representativa antes de cuarteo y secado.');
  const recommendedSeries = String(astm.recommendedSeries || 'ASTM E11 √2 (8")');

  return {
    headline: gyRec,
    primaryKpis: [
      { key: 'slurryDensityKgL', label: isEn ? 'Slurry Density ρ_p' : 'Densidad Pulpa ρ_p', value: `${slurryDensityKgL.toFixed(3)} kg/L` },
      { key: 'ringApparentCw', label: isEn ? 'Ring % Solids' : '% Sólidos Anillo', value: `${ringApparentCw.toFixed(1)}%` },
      { key: 'targetRelativeStdErrorPercent', label: isEn ? 'Gy Target Error' : 'Error Objetivo Gy', value: `±${targetRelErr.toFixed(1)}%` },
      { key: 'recommendedSeries', label: isEn ? 'Sieve Stack' : 'Serie Tamices', value: recommendedSeries },
    ],
    technicalDetails: [
      { key: 'pulpDensitySg', label: 'SG', value: pulpDensitySg.toFixed(3) },
      { key: 'gyRecommendation', label: isEn ? 'Sampling Note' : 'Nota de Muestreo', value: gyRec },
    ],
    gyRecommendation: gyRec,
  };
}

/**
 * Proyecta prioridad c·μ, estado de compuerta física y velocidad crítica del Dossier.
 * @param {Record<string, any>} [cmuDescriptor={}]
 * @param {Record<string, any>} [slurryMetrics={}]
 * @param {Record<string, any>} [gateOut={}]
 * @param {'es'|'en'} [lang='es']
 */
export function buildDossierPriorityViewModel(cmuDescriptor = {}, slurryMetrics = {}, gateOut = {}, lang = 'es') {
  const isEn = String(lang).toLowerCase() === 'en';
  const priorityCode = String(cmuDescriptor.priorityCode || 'P1');
  const cmuScore = Number(cmuDescriptor.cmuScore ?? 0);
  const criticalVelocityMS = Number(slurryMetrics.criticalVelocityMS ?? slurryMetrics.criticalVelocityMs ?? 0);
  const plausible = gateOut.plausible !== false;

  return {
    headline: `${priorityCode} · cµ=${cmuScore.toFixed(1)} · v_c=${formatScientificUnit(criticalVelocityMS, 'm/s', 2)}`,
    primaryKpis: [
      { key: 'priorityCode', label: isEn ? 'Queue Code' : 'Código Cola', value: priorityCode },
      { key: 'cmuScore', label: isEn ? 'cµ Priority Index' : 'Índice Prioridad cµ', value: cmuScore.toFixed(1) },
      { key: 'criticalVelocityMS', label: isEn ? 'Settling v_c' : 'Vel. Crítica v_c', value: `${criticalVelocityMS.toFixed(2)} m/s` },
      { key: 'plausible', label: isEn ? 'Physics Gate' : 'Compuerta Física', value: plausible ? (isEn ? 'Plausible' : 'Plausible') : (isEn ? 'Out of Range' : 'Fuera de Rango') },
    ],
    priorityBadge: `${priorityCode} · cµ ${cmuScore.toFixed(1)}`,
    cmuSummary: isEn ? `Queue ${priorityCode} (cµ index ${cmuScore.toFixed(1)})` : `Cola ${priorityCode} (índice cµ ${cmuScore.toFixed(1)})`,
  };
}

/**
 * Proyecta un ViewModel tipado (`buildTribologyAssemblyViewModel` / `buildMetrologyViewModel` /
 * `buildBomPasteViewModel`) hacia los slots declarativos `[data-vm-slot]` dentro de `root`.
 * Garantiza paridad reactiva SSR + cliente sin selectores fantasma (`D1-V58`, `ARB-SMAT-67`).
 * @param {any} root
 * @param {Record<string, any>} [vm={}]
 */
export function projectViewModelToDom(root, vm = {}) {
  if (!root || typeof root.querySelectorAll !== 'function' || !vm) return 0;
  let updated = 0;

  root.querySelectorAll('[data-vm-slot]').forEach((slotEl) => {
    const key = slotEl.getAttribute?.('data-vm-slot') || '';
    if (!key) return;

    if (key === 'technicalDetails' && Array.isArray(vm.technicalDetails)) {
      slotEl.innerHTML = vm.technicalDetails
        .map((d) => `<div class="embedded-res-cell"><strong>${String(d.label || '')}</strong> <span>${String(d.value ?? '—')}</span></div>`)
        .join('');
      updated++;
      return;
    }

    if (key === 'primaryKpis' && Array.isArray(vm.primaryKpis)) {
      const cells = slotEl.querySelectorAll?.('[data-vm-kpi]') || [];
      if (cells.length > 0) {
        cells.forEach((cell) => {
          const kKey = cell.getAttribute?.('data-vm-kpi');
          const match = vm.primaryKpis.find((item) => item.key === kKey);
          if (match) {
            cell.textContent = String(match.value ?? '—');
            updated++;
          }
        });
      } else {
        slotEl.innerHTML = vm.primaryKpis
          .map((item) => `<div class="instrument-kpi-cell"><strong>${String(item.label || '')}</strong><span>${String(item.value ?? '—')}</span></div>`)
          .join('');
        updated++;
      }
      return;
    }

    if (key === 'collisionAlert' && vm.collisionAlert) {
      slotEl.textContent = String(vm.collisionAlert.text || '');
      if (slotEl.classList) {
        slotEl.classList.toggle('smat-sdb-status-ok', vm.collisionAlert.isValidAssembly !== false);
        slotEl.classList.toggle('smat-sdb-bear-warn', vm.collisionAlert.isValidAssembly === false);
      }
      updated++;
      return;
    }

    if (Object.prototype.hasOwnProperty.call(vm, key) && vm[key] !== undefined && vm[key] !== null) {
      slotEl.textContent = String(vm[key]);
      updated++;
    }
  });

  return updated;
}
