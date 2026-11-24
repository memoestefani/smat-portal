/**
 * wizardCatalogData.js
 * ---------------------------------------------------------------------------
 * Modulo ES SSOT para grupos mineros y SKUs de caja rapida en cliente/SSR.
 * Erradica la serializacion inline de 58.5 KB de blobs JSON en `#rfq` y deriva
 * el conteo real de unidades mineras (`52`) desde `data/mining_groups.json`.
 */

import miningGroupsJson from '../../data/mining_groups.json' with { type: 'json' };
import { getQuickProductsCatalog } from './quickProductsCatalog.js';

export const MINING_GROUPS_CATALOG = Object.freeze(
  Array.isArray(miningGroupsJson?.groups) ? miningGroupsJson.groups : []
);

export const MINING_UNITS_COUNT = MINING_GROUPS_CATALOG.reduce(
  (sum, grp) => sum + (Array.isArray(grp.units) ? grp.units.length : 0),
  0
);

export const QUICK_CHECKOUT_SKU_LIST = Object.freeze(getQuickProductsCatalog());

export function findMiningGroupById(groupId = '') {
  const id = String(groupId || '').trim().toLowerCase();
  if (!id) return null;
  return MINING_GROUPS_CATALOG.find((g) => String(g.id || '').toLowerCase() === id) || null;
}

export function findMiningUnitByName(groupId = '', unitName = '') {
  const grp = findMiningGroupById(groupId);
  if (!grp || !Array.isArray(grp.units)) return null;
  const target = String(unitName || '').trim().toLowerCase();
  return grp.units.find((u) => String(u.name || '').toLowerCase() === target) || grp.units[0] || null;
}
