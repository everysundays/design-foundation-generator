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
