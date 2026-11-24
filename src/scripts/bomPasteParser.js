/**
 * bomPasteParser.js
 * ---------------------------------------------------------------------------
 * Parser tolerante (BOM UTF-8, TSV Excel/SAP, CSV y texto libre) para el carril
 * Fast-Lane de Reorden B2B SKU / Drop-In en /cotizar/ (D5-V55).
 * Patron inspirado en `sandeshbagmare/columncheck`.
 */

import { verifyDropInEquivalence } from './dropInEquivalenceGuard.js';
import { getQuickProductBySlugOrAlias } from './quickProductsCatalog.js';
import { parseUrlContextParams } from './urlContextAndPartCodeParser.js';

function parseLineTokens(line) {
  const sep = line.includes('\t') ? /\t+/ : (line.includes(';') ? /;+/ : (line.includes(',') ? /,+|\s+/ : /\s+/));
  const cols = line.split(sep).map((c) => c.trim()).filter(Boolean);
  if (cols.length === 0) return null;

  // Ignora cabeceras comunes de Excel/SAP
  const joinedLower = cols.join(' ').toLowerCase();
  if (/^(sku|codigo|código|material|part|qty|cantidad)\b/.test(joinedLower) && cols.length <= 3) {
    return null;
  }

  let codeToken = cols[0];
  let qty = 1;

  // Soporta formatos "4x SMAT-...", "SMAT-... x 4", "SMAT-... 4"
  const xPrefix = line.match(/^\s*(\d+)\s*[xX*]\s*([A-Za-z0-9._\-/]+)\s*$/);
  const xSuffix = line.match(/^\s*([A-Za-z0-9._\-/]+)\s*[xX*]\s*(\d+)\s*$/);
  if (xPrefix) {
    qty = Number(xPrefix[1]);
    codeToken = xPrefix[2];
  } else if (xSuffix) {
    codeToken = xSuffix[1];
    qty = Number(xSuffix[2]);
  } else if (cols.length >= 2) {
    const maybeLastQty = Number(String(cols[cols.length - 1]).replace(/[^\d]/g, ''));
    const maybeFirstQty = Number(String(cols[0]).replace(/[^\d]/g, ''));
    if (Number.isFinite(maybeLastQty) && maybeLastQty > 0 && /^\d+$/.test(cols[cols.length - 1])) {
      qty = maybeLastQty;
      codeToken = cols[0];
    } else if (/^\d+$/.test(cols[0]) && Number.isFinite(maybeFirstQty) && maybeFirstQty > 0) {
      qty = maybeFirstQty;
      codeToken = cols[1];
    }
  }

  return {
    rawLine: line,
    codeToken: String(codeToken || '').trim(),
    qty: Math.max(1, Math.min(999, Math.round(qty || 1))),
  };
}

/**
 * Parsea texto pegado desde Excel, SAP o WhatsApp hacia partidas listas para Bandeja.
 * @param {string} rawText
 */
export function parseBomPasteInput(rawText = '') {
  const cleaned = String(rawText || '').replace(/^\uFEFF/, '');
  const rawLines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const matched = [];
  const unmatched = [];

  for (const line of rawLines) {
    const parsed = parseLineTokens(line);
    if (!parsed || !parsed.codeToken) continue;

    const directSku = getQuickProductBySlugOrAlias(parsed.codeToken);
    if (directSku) {
      matched.push({
        skuId: directSku.id,
        qty: parsed.qty,
        source: 'SKU_CANONICAL',
        nameEs: directSku.name_es,
        nameEn: directSku.name_en,
        unitWeightKg: directSku.weight_kg || 12,
        circuit: directSku.circuit || 'bombeo',
      });
      continue;
    }

    const dropIn = verifyDropInEquivalence(parsed.codeToken);
    if (dropIn?.matched && dropIn.recommendedSku) {
      const linked = getQuickProductBySlugOrAlias(dropIn.recommendedSku);
      matched.push({
        skuId: dropIn.recommendedSku,
        qty: parsed.qty,
        source: 'DROP_IN_EQUIVALENCE',
        nameEs: linked?.name_es || dropIn.partNameEs || dropIn.recommendedSku,
        nameEn: linked?.name_en || dropIn.partNameEn || dropIn.recommendedSku,
        unitWeightKg: linked?.weight_kg || 14,
        circuit: 'bombeo',
      });
      continue;
    }

    const smatDecoded = parseUrlContextParams(`?codigo=${encodeURIComponent(parsed.codeToken)}`);
    if (smatDecoded?.decodedPart) {
      matched.push({
        skuId: smatDecoded.decodedPart.recommendedSkuId || 'SMAT-PUMP-6X4-WETKIT',
        atomicCode: smatDecoded.decodedPart.atomicCode || parsed.codeToken.toUpperCase(),
        qty: parsed.qty,
        source: 'SMAT_PART_CODE',
        nameEs: smatDecoded.decodedPart.roleEs || parsed.codeToken,
        nameEn: smatDecoded.decodedPart.roleEn || parsed.codeToken,
        unitWeightKg: 14,
        circuit: smatDecoded.circuit || 'bombeo',
      });
      continue;
    }

    unmatched.push(parsed.rawLine);
  }

  const totalUnits = matched.reduce((acc, row) => acc + row.qty, 0);
  return { matched, unmatched, totalUnits, lineCount: rawLines.length };
}
