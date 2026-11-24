/**
 * pumpingTabRouter.js — Deep-link & station tab router for /bombeo/ and /en/pumping/.
 * Resolves `?tab=&sub=&focus=` and assembly `#anchor` routes without duplicated tab logic.
 */

const ASSEMBLY_HASHES = new Set([
  '#pump-assembly-report',
  '#como-se-arma-una-bomba',
  '#how-a-slurry-pump-is-assembled'
]);

const CATALOG_TABS = new Set(['kits', 'systems', 'atomic']);
const SEAL_SUBTABS = new Set(['seal', 'skid', 'bearing']);
const TRIBOLOGY_FOCUS = new Set(['impeller', 'liners']);

/**
 * Pure URL deep-link resolver for pumping hub stations & legacy catalog disclosure tabs.
 * @param {string} [search]
 * @param {string} [hash]
 */
export function resolvePumpingTabDeepLink(search = '', hash = '') {
  const cleanHash = String(hash || '').trim().toLowerCase();
  if (ASSEMBLY_HASHES.has(cleanHash)) {
    return {
      targetKind: 'station',
      station: 'assembly',
      subTab: null,
      focus: null,
      catalogTab: null,
      expandDisclosure: false
    };
  }

  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const rawTab = String(params.get('tab') || '').trim().toLowerCase();
  const rawSub = String(params.get('sub') || '').trim().toLowerCase();
  const rawFocus = String(params.get('focus') || params.get('variant') || '').trim().toLowerCase();

  if (!rawTab && !rawSub && !rawFocus) return null;

  if (CATALOG_TABS.has(rawTab)) {
    return {
      targetKind: 'catalog',
      station: null,
      subTab: null,
      focus: null,
      catalogTab: rawTab,
      expandDisclosure: true
    };
  }

  if (rawTab === 'assembly') {
    return {
      targetKind: 'station',
      station: 'assembly',
      subTab: null,
      focus: null,
      catalogTab: null,
      expandDisclosure: false
    };
  }

  if (['tribology', 'impeller', 'liners'].includes(rawTab) || TRIBOLOGY_FOCUS.has(rawFocus)) {
    const focus = TRIBOLOGY_FOCUS.has(rawFocus)
      ? rawFocus
      : TRIBOLOGY_FOCUS.has(rawTab)
        ? rawTab
        : null;
    return {
      targetKind: 'station',
      station: 'tribology',
      subTab: null,
      focus,
      catalogTab: null,
      expandDisclosure: false
    };
  }

  if (['seals', 'seal', 'skid', 'bearing'].includes(rawTab) || SEAL_SUBTABS.has(rawSub)) {
    const subTab = SEAL_SUBTABS.has(rawSub)
      ? rawSub
      : SEAL_SUBTABS.has(rawTab)
        ? rawTab
        : 'seal';
    return {
      targetKind: 'station',
      station: 'seals',
      subTab,
      focus: null,
      catalogTab: null,
      expandDisclosure: false
    };
  }

  if (rawTab === 'hydraulics') {
    return {
      targetKind: 'station',
      station: 'hydraulics',
      subTab: null,
      focus: rawFocus || null,
      catalogTab: null,
      expandDisclosure: false
    };
  }

  return null;
}

/**
 * Bind station tabs, catalog disclosure tabs, and URL deep-link restoration on PumpingHubIsland.
 * @param {HTMLElement | null} root
 * @param {ReturnType<typeof resolvePumpingTabDeepLink>} [initialDeepLink]
 */
export function initPumpingTabRouter(root, initialDeepLink = null) {
  if (!root || root.dataset.bombeoTabsBound === 'true') return;
  root.dataset.bombeoTabsBound = 'true';

  const stationBtns = root.querySelectorAll('[data-station-tab]');
  const stationPanels = root.querySelectorAll('[data-station-panel]');

  const activateStation = (rawTarget, subTab = null, focus = null) => {
    const lower = String(rawTarget || 'hydraulics').toLowerCase();
    const normalized = ['tribology', 'impeller', 'liners'].includes(lower)
      ? 'tribology'
      : ['seal', 'skid', 'bearing', 'seals'].includes(lower)
        ? 'seals'
        : lower === 'assembly'
          ? 'assembly'
          : 'hydraulics';

    stationBtns.forEach((btn) => {
      const on = btn.getAttribute('data-station-tab') === normalized;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    stationPanels.forEach((panel) => {
      const on = panel.getAttribute('data-station-panel') === normalized;
      if (on) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    if (normalized === 'seals') {
      const targetSub = subTab && SEAL_SUBTABS.has(subTab)
        ? subTab
        : SEAL_SUBTABS.has(lower)
          ? lower
          : null;
      if (targetSub) {
        const subBtn = root.querySelector(
          `#pumping-seals-station [data-sdb-tab="${targetSub}"], #pumping-seals-station [data-tab="${targetSub}"]`
        );
        if (subBtn instanceof HTMLElement) subBtn.click();
      }
    }

    if (normalized === 'tribology' && focus) {
      const tribPanel = root.querySelector('#pumping-tribology-station');
      if (tribPanel instanceof HTMLElement) {
        tribPanel.dataset.focusVariant = focus;
        const focusTarget = tribPanel.querySelector(`[data-trib-focus="${focus}"], [data-variant="${focus}"]`);
        if (focusTarget instanceof HTMLElement) focusTarget.click();
      }
    }
  };

  stationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateStation(btn.getAttribute('data-station-tab') || 'hydraulics');
    });
  });

  const tabBtns = root.querySelectorAll('[data-bombeo-tab]');
  const tabPanels = root.querySelectorAll('[data-bombeo-panel]');
  const disclosure = root.querySelector('#bombeo-catalog-disclosure') || document.getElementById('bombeo-catalog-disclosure');

  const activateCatalogTab = (target, expandDisclosure = false) => {
    if (expandDisclosure && disclosure instanceof HTMLDetailsElement) {
      disclosure.open = true;
    }
    tabBtns.forEach((btn) => {
      const active = btn.getAttribute('data-bombeo-tab') === target;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    tabPanels.forEach((panel) => {
      const active = panel.getAttribute('data-bombeo-panel') === target;
      panel.classList.toggle('is-active', active);
    });
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateCatalogTab(btn.getAttribute('data-bombeo-tab') || 'kits');
    });
  });

  if (typeof window !== 'undefined') {
    const resolved = initialDeepLink || resolvePumpingTabDeepLink(window.location.search, window.location.hash);
    if (resolved) {
      if (resolved.targetKind === 'catalog' && resolved.catalogTab) {
        activateCatalogTab(resolved.catalogTab, resolved.expandDisclosure);
      } else if (resolved.station) {
        activateStation(resolved.station, resolved.subTab, resolved.focus);
      }
    }
  }

  document
    .querySelectorAll('a[href="#pump-assembly-report"], a[href="#como-se-arma-una-bomba"], a[href="#how-a-slurry-pump-is-assembled"]')
    .forEach((link) => {
      link.addEventListener('click', () => activateStation('assembly'));
    });
}
