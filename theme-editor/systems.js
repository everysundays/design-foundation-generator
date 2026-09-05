// systems.js - defaulting for a saved design system (Theme Editor v3).
//
// A "saved system" is the shape buildSystemSnapshot() writes: { source,
// palette, vars, tokenLinks, components, customScale } - produced by the
// browser Save (localStorage, scripts.js customSystems) and, eventually, a
// repo-fetched systems/<name>.json. Older saves can be missing any field but
// `vars` (a v2 save had no `source`; a hand-edited or pre-customScale save
// can lack `customScale`/`palette`/`tokenLinks` entirely).
//
// normalizeSystem(raw) is the single place that shape gets completed before
// the rest of the app (loadTheme, restoreSnapshot, the picker) touches it:
// pure, never mutates `raw`, always returns a fresh object with every field
// present - or null when `raw` isn't a saved system at all (no `vars`),
// which the caller treats as "drop this entry".
//
// Loaded after foundation.js (needs FOUNDATION / foundationOf /
// cloneCustomScale) and before scripts.js.
function normalizeSystem(raw) {
    if (!raw || typeof raw !== 'object' || !raw.vars || typeof raw.vars !== 'object') return null;
    const source = FOUNDATION[raw.source] ? raw.source : 'tailwind';
    const mode = (obj, key) => (obj && typeof obj === 'object' && obj[key] && typeof obj[key] === 'object') ? { ...obj[key] } : {};
    const families = raw.palette && Array.isArray(raw.palette.families)
        ? [...raw.palette.families]
        : [...foundationOf(source).color.families()];
    return {
        source,
        palette: { families },
        vars: { light: mode(raw.vars, 'light'), dark: mode(raw.vars, 'dark') },
        tokenLinks: { light: mode(raw.tokenLinks, 'light'), dark: mode(raw.tokenLinks, 'dark') },
        components: (raw.components && typeof raw.components === 'object') ? { ...raw.components } : {},
        customScale: cloneCustomScale(raw.customScale)
    };
}

// parseRepoIndex(parsed) - validates the parsed JSON body of the repo's
// systems/index.json (an array of non-empty names, nothing else). Returns
// the array unchanged when valid, else null - the caller (scripts.js's
// loadRepoSystems) treats null the same as a missing/unreadable file: log
// one warning, show no repo rows.
function parseRepoIndex(parsed) {
    if (!Array.isArray(parsed)) return null;
    if (!parsed.every(name => typeof name === 'string' && name.length > 0)) return null;
    return parsed;
}

// listSystems(repo, browser, presets) - the Design system picker's full row
// list, in display order, with same-name entries collapsed to whichever
// source wins.
//
// `repo`     name -> normalized system (systems/<name>.json, via the static
//            file server - see loadRepoSystems). Wins any name collision:
//            it is the canonical copy once a system has been saved to repo.
// `browser`  { systems, legacy } - scripts.js's two localStorage-backed
//            maps (customSystems, the v3 shape this module normalizes; and
//            customThemes, the older v1 { light, dark } shape).
// `presets`  the built-in/tweakcn theme list (allThemes) - objects with a
//            `title` (or `name`).
//
// Order is repo, then browser (systems before legacy), then preset; the
// first group to name a given name wins and later duplicates are dropped,
// so a browser save shadowed by a repo file of the same name renders (and
// loads) as a single row. Rows don't carry `vars` - resolving a name's
// colors for the swatch dots means looking in the right one of those three
// places, which is a scripts.js concern (flattenVars for presets), not
// this foundation-only module's.
function listSystems(repo, browser, presets) {
    const seen = new Set();
    const rows = [];
    const add = (name, group, deletable) => {
        if (!name || seen.has(name)) return;
        seen.add(name);
        rows.push({ name, group, deletable });
    };
    Object.keys(repo || {}).forEach(name => add(name, 'repo', false));
    const browserSystems = (browser && browser.systems) || {};
    const browserLegacy = (browser && browser.legacy) || {};
    Object.keys(browserSystems).forEach(name => add(name, 'browser', true));
    Object.keys(browserLegacy).forEach(name => add(name, 'browser', true));
    (presets || []).forEach(theme => add(theme && (theme.title || theme.name), 'preset', false));
    return rows;
}
