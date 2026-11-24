/**
 * schemaRuntimeBinder.js
 * ---------------------------------------------------------------------------
 * Enlazador Ejecutivo Runtime EngineSchema <-> DOM (D1-V51 / Two-Sort Partition).
 * Zero-HTML, Zero-innerHTML, Zero-eval.
 *
 * Responsabilidades:
 * 1. Leer entradas tipadas de cada `[data-domain-root="<domain>"]` sin mapas paralelos.
 * 2. Proyectar salidas físicas formateadas hacia todos los nodos `[data-schema-output]` y
 *    selectores/aliases canónicos, preservando nodos hijos declarativos (sin borrar #metric-wear-ratio).
 * 3. Verificar contención estricta de dominio VPL (`verifyVplDomScopeContainment`).
 */

import {
  ENGINE_SCHEMA_REGISTRY,
  TWO_SORT_PARTITION_VERSION,
  formatSchemaOutputValue,
  getEngineSchema,
  listAllEngineSchemas,
  validateSchemaPayload
} from './engineSchemaRegistry.js';

function queryAllSafe(root, selector) {
  if (!root || !selector) return [];
  const list = [];
  if (typeof root.matches === 'function' && root.matches(selector)) {
    list.push(root);
  }
  if (typeof root.querySelectorAll === 'function') {
    const found = root.querySelectorAll(selector);
    if (found && typeof found.length === 'number') {
      for (let i = 0; i < found.length; i += 1) {
        if (found[i] && !list.includes(found[i])) list.push(found[i]);
      }
    }
  } else if (typeof root.querySelector === 'function') {
    const one = root.querySelector(selector);
    if (one && !list.includes(one)) list.push(one);
  }
  return list;
}

function resolveCandidateRoots(root, domainId) {
  if (!root) return [];
  const roots = queryAllSafe(root, `[data-domain-root="${domainId}"]`);
  if (roots.length > 0) return roots;
  // Compatibilidad con mocks simples o fragmentos que ya actúan como raíz del documento/componente
  return [root];
}

export function getDomainRouteMode(domainId, pathname = '/') {
  const schema = getEngineSchema(domainId);
  if (!schema) return 'none';
  const norm = String(pathname || '/').trim() || '/';
  const matchRoute = (list) =>
    Array.isArray(list) && list.some((r) => r === norm || (r.includes('[') && norm.startsWith(r.split('[')[0])));
  if (matchRoute(schema.interactiveRoutes)) return 'interactive';
  if (matchRoute(schema.readonlyRoutes)) return 'readonly';
  if (matchRoute(schema.routes)) return 'interactive';
  return 'none';
}

function readSingleNodeValue(node, fieldDef) {
  if (!node) return { found: false, value: undefined };
  const tag = String(node.tagName || '').toLowerCase();
  const typeAttr = String(node.type || node.getAttribute?.('type') || '').toLowerCase();

  if (fieldDef.type === 'boolean') {
    if (typeAttr === 'checkbox' || typeAttr === 'radio') {
      return { found: true, value: Boolean(node.checked) };
    }
    const pressed = node.getAttribute?.('aria-pressed');
    if (pressed !== null && pressed !== undefined) {
      return { found: true, value: pressed === 'true' };
    }
    return { found: true, value: String(node.value ?? node.textContent ?? '').toLowerCase() === 'true' };
  }

  if (fieldDef.type === 'array') {
    const rawAttr = node.getAttribute?.('data-array-value') ?? node.value ?? node.textContent ?? '';
    if (Array.isArray(node.value)) return { found: true, value: node.value };
    const trimmed = String(rawAttr || '').trim();
    if (!trimmed) return { found: true, value: [] };
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return { found: true, value: parsed };
      } catch (_e) {
        // continuar con split por coma
      }
    }
    return { found: true, value: trimmed.split(',').map((s) => s.trim()).filter(Boolean) };
  }

  if (tag === 'button' || (!('value' in node) && !tag)) {
    const pressed = node.getAttribute?.('aria-pressed');
    const isPressed = pressed === 'true' || node.classList?.contains?.('active');
    if (pressed !== null || node.classList?.contains?.('stress-chip') || node.hasAttribute?.('data-wb-altitude-btn') || node.hasAttribute?.('data-jrp-crit-btn')) {
      if (!isPressed) return { found: false, value: undefined };
    }
    const attrVal =
      node.getAttribute?.('data-wb-altitude-btn') ??
      node.getAttribute?.('data-alt') ??
      node.getAttribute?.('data-symptom') ??
      node.getAttribute?.('data-jrp-crit-btn') ??
      node.getAttribute?.('data-value') ??
      node.value ??
      node.textContent;
    if (attrVal === undefined || attrVal === null) return { found: false, value: undefined };
    return { found: true, value: fieldDef.type === 'number' ? Number(attrVal) : String(attrVal).trim() };
  }

  const raw = node.value;
  if (raw === undefined || raw === null || raw === '') return { found: false, value: undefined };
  return { found: true, value: fieldDef.type === 'number' ? Number(raw) : String(raw) };
}

function writeLeafSafeText(node, text) {
  if (!node) return;
  const children = node.children;
  if (children && children.length > 0) {
    const leafSpan = node.querySelector?.('[data-schema-leaf]');
    if (leafSpan) {
      leafSpan.textContent = text;
      return;
    }
    if (children.length === 1 && (!children[0].children || children[0].children.length === 0)) {
      children[0].textContent = text;
      return;
    }
    if (node.firstChild && node.firstChild.nodeType === 3) {
      node.firstChild.textContent = `${text} `;
      return;
    }
    node.setAttribute?.('data-schema-display', text);
    return;
  }
  node.textContent = text;
}

/**
 * Lee y normaliza todas las entradas declaradas por el `inputsSchema` de un dominio.
 *
 * @param {Document|Element} root
 * @param {string} domainId
 * @returns {Record<string, any>}
 */
function readDomainInputs(root, domainId) {
  const schema = getEngineSchema(domainId);
  if (!schema) return {};
  const candidateRoots = resolveCandidateRoots(root, domainId);
  const raw = {};

  for (const fieldDef of schema.inputsSchema) {
    const selectors = [
      `[data-schema-input="${domainId}.${fieldDef.field}"]`,
      fieldDef.domBinding,
      ...(fieldDef.aliasBindings || [])
    ].filter(Boolean);

    let captured = undefined;
    let bestPriority = -1;

    for (const scope of candidateRoots) {
      for (const sel of selectors) {
        const nodes = queryAllSafe(scope, sel);
        for (const node of nodes) {
          const parsed = readSingleNodeValue(node, fieldDef);
          if (!parsed.found) continue;
          const touched = node.dataset?.userTouched === 'true' ? 2 : 1;
          const exactAttrBonus = sel.startsWith('[data-schema-input=') ? 1 : 0;
          const score = touched * 10 + exactAttrBonus;
          if (score > bestPriority) {
            bestPriority = score;
            captured = parsed.value;
          }
        }
      }
    }

    if (captured !== undefined) {
      raw[fieldDef.field] = captured;
    }
  }

  return validateSchemaPayload(domainId, raw).normalized;
}

/**
 * Lee y fusiona el vector completo de entradas canónicas de los 11 dominios registrados.
 *
 * @param {Document|Element} root
 * @param {Record<string, any>} [overrides={}]
 * @returns {Record<string, any>}
 */
export function readAllCanonicalInputs(root, overrides = {}) {
  const merged = {};
  const touchedScores = {};
  const candidateDocs = root ? [root] : [];

  for (const schema of listAllEngineSchemas()) {
    const domainValues = readDomainInputs(root, schema.id);
    for (const fieldDef of schema.inputsSchema) {
      const f = fieldDef.field;
      const val = domainValues[f];
      let score = 0;
      if (candidateDocs[0]) {
        const attrNodes = queryAllSafe(candidateDocs[0], `[data-schema-input="${schema.id}.${f}"]`);
        const domNodes = fieldDef.domBinding ? queryAllSafe(candidateDocs[0], fieldDef.domBinding) : [];
        if (attrNodes.some((n) => n.dataset?.userTouched === 'true') || domNodes.some((n) => n.dataset?.userTouched === 'true')) {
          score = 3;
        } else if (attrNodes.length > 0 || domNodes.length > 0) {
          score = 1;
        }
      }
      if (!(f in merged) || score > (touchedScores[f] ?? -1)) {
        merged[f] = val;
        touchedScores[f] = score;
      }
    }
  }

  return { ...merged, ...(overrides || {}) };
}

/**
 * Proyecta salidas calculadas hacia todos los nodos DOM declarados para un dominio.
 *
 * @param {Document|Element} root
 * @param {string} domainId
 * @param {Record<string, any>} [values={}]
 * @param {'es'|'en'} [locale='es']
 * @returns {number} Cantidad de nodos DOM actualizados
 */
export function projectDomainOutputs(root, domainId, values = {}, locale = 'es') {
  const schema = getEngineSchema(domainId);
  if (!root || !schema || !values) return 0;
  let updatedCount = 0;

  for (const outDef of schema.outputsSchema) {
    if (!Object.prototype.hasOwnProperty.call(values, outDef.field)) continue;
    const rawVal = values[outDef.field];
    if (rawVal === undefined) continue;
    const formatted = formatSchemaOutputValue(domainId, outDef.field, rawVal, locale);
    const selectors = [
      `[data-schema-output="${domainId}.${outDef.field}"]`,
      outDef.domBinding,
      ...(outDef.aliasBindings || [])
    ].filter(Boolean);

    const seen = new Set();
    for (const sel of selectors) {
      const nodes = queryAllSafe(root, sel);
      for (const node of nodes) {
        if (seen.has(node)) continue;
        seen.add(node);
        node.setAttribute?.('data-schema-value', String(rawVal));
        if (outDef.field === 'activeTrustBoundaryId') {
          const hasAlert = Boolean(rawVal);
          node.classList?.toggle?.('hidden', !hasAlert);
          updatedCount += 1;
          continue;
        }
        if (outDef.unit === 'url' && typeof node.setAttribute === 'function' && String(node.tagName || '').toLowerCase() === 'a') {
          node.setAttribute('href', String(rawVal));
          updatedCount += 1;
          continue;
        }
        if (outDef.unit === 'tsv' || outDef.unit === 'dom') {
          node.setAttribute?.('data-schema-ready', '1');
          updatedCount += 1;
          continue;
        }
        writeLeafSafeText(node, formatted);
        updatedCount += 1;
      }
    }
  }

  return updatedCount;
}

/**
 * Enlaza listeners de `input` y `change` de forma idempotente sobre uno o varios dominios
 * dentro de una raíz DOM, marcando `dataset.userTouched = 'true'` en interacción real.
 *
 * @param {Document|Element} root
 * @param {string|string[]} domainIds
 * @param {(ctx: { domainId: string, field: string, node: Element, event: Event }) => void} onChange
 * @returns {number} Cantidad de selectores/nodos enlazados
 */
export function bindDomainSchemaRoot(root, domainIds, onChange) {
  if (!root || typeof onChange !== 'function') return 0;
  const ids = Array.isArray(domainIds) ? domainIds : [domainIds];
  let boundCount = 0;

  for (const domainId of ids) {
    const schema = getEngineSchema(domainId);
    if (!schema) continue;
    const candidateRoots = resolveCandidateRoots(root, domainId);

    for (const scope of candidateRoots) {
      scope.setAttribute?.('data-schema-version', TWO_SORT_PARTITION_VERSION);
      for (const inp of schema.inputsSchema) {
        const selectors = [
          `[data-schema-input="${domainId}.${inp.field}"]`,
          inp.domBinding,
          ...(inp.aliasBindings || [])
        ].filter(Boolean);

        for (const sel of selectors) {
          const nodes = queryAllSafe(scope, sel);
          for (const node of nodes) {
            if (!node.addEventListener) continue;
            if (node.dataset?.schemaBoundDomains?.split(',').includes(domainId)) continue;
            if (node.dataset) {
              const prev = node.dataset.schemaBoundDomains ? `${node.dataset.schemaBoundDomains},` : '';
              node.dataset.schemaBoundDomains = `${prev}${domainId}`;
              node.dataset.schemaBound = '1';
            }
            const tag = String(node.tagName || '').toLowerCase();
            const evts = (tag === 'button') ? ['click'] : ['input', 'change'];
            for (const evtName of evts) {
              node.addEventListener(evtName, (event) => {
                if (node.dataset) node.dataset.userTouched = 'true';
                onChange({ domainId, field: inp.field, node, event });
              });
            }
            boundCount += 1;
          }
        }
      }
    }
  }

  return boundCount;
}

/**
 * Audita que toda affordance `[data-schema-input]` o `[data-schema-output]` en `root`
 * viva encerrada dentro de un contenedor `[data-domain-root]` compatible con su prefijo de dominio.
 *
 * @param {Document|Element} root
 * @returns {{ valid: boolean, checkedCount: number, violations: string[] }}
 */
export function verifyVplDomScopeContainment(root) {
  if (!root) return { valid: false, checkedCount: 0, violations: ['NULL_ROOT'] };
  const affordances = queryAllSafe(root, '[data-schema-input], [data-schema-output]');
  const violations = [];

  for (const node of affordances) {
    const key = node.getAttribute?.('data-schema-input') || node.getAttribute?.('data-schema-output') || '';
    const domain = key.split('.')[0]?.trim();
    if (!domain || !ENGINE_SCHEMA_REGISTRY[domain]) {
      violations.push(`UNKNOWN_SCHEMA_KEY:${key}`);
      continue;
    }
    let cur = node;
    let matchedRoot = false;
    while (cur) {
      const rootAttr = cur.getAttribute?.('data-domain-root');
      if (rootAttr) {
        const rootDomains = rootAttr.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
        if (rootDomains.includes(domain)) {
          matchedRoot = true;
          break;
        }
      }
      cur = cur.parentElement || cur.parentNode || null;
    }
    if (!matchedRoot) {
      violations.push(`UNCONTAINED_SCHEMA_NODE:${key}`);
    }
  }

  return {
    valid: violations.length === 0,
    checkedCount: affordances.length,
    violations
  };
}
