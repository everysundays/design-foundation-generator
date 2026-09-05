// Google Fonts - resolving a type set's family token down to the face it
// actually renders, the searchable catalogue the picker lists, and building
// the @import/<link> URL the preview and the exported design-system.css both
// load faces from (only the weights actually in use, intersected with what
// each family really ships).
//
// Self-contained on purpose: no typeVarKey/TYPE_SETS globals from scripts.js
// (the family var key is inlined below). Loaded after fonts-catalogue.js and
// before components.js (see index.html), so scripts.js can call these as
// ordinary globals; tests/fonts.test.js vm-loads foundation.js,
// fonts-catalogue.js and this file alone.

function firstFamily(value) {
    return (value || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
}

// A type set's family var is either a token reference (var(--font-sans)) or
// a literal face; either way this resolves to the face name alone.
function resolveTypeFace(vars, setKey) {
    const value = vars[`type-${setKey}-family`] || '';
    const ref = value.match(/^var\(--font-(sans|serif|mono)\)$/);
    return firstFamily(ref ? vars[`font-${ref[1]}`] : value);
}

// `vars` is one vars object (a single mode) or an array of them (e.g.
// [light, dark]) - the export unions both modes so a face picked while the
// editor sits in dark mode still gets an @import.
function varsList(vars) {
    return Array.isArray(vars) ? vars : [vars];
}

// --- Catalogue lookup (GOOGLE_FONTS_CATALOGUE - fonts-catalogue.js) --------

// family (lowercased) -> { family (canonical case), category, weights[] }.
// Built lazily and cached - GOOGLE_FONTS_CATALOGUE never changes at runtime.
let _catalogueIndex = null;
function catalogueIndex() {
    if (_catalogueIndex) return _catalogueIndex;
    _catalogueIndex = new Map();
    const rows = typeof GOOGLE_FONTS_CATALOGUE !== 'undefined' ? GOOGLE_FONTS_CATALOGUE : [];
    rows.forEach(([family, category, weights]) => {
        _catalogueIndex.set(family.toLowerCase(), { family, category, weights });
    });
    return _catalogueIndex;
}

// The catalogue entry for `name` (case-insensitive, exact family match), or
// null when it isn't a Google Fonts family - a system stack (system-ui,
// ui-serif, ...) or a typed custom face alike.
function catalogueEntry(name) {
    if (!name) return null;
    const hit = catalogueIndex().get(String(name).trim().toLowerCase());
    return hit ? { category: hit.category, weights: hit.weights.slice() } : null;
}

// Every catalogue family whose name contains `query` (case-insensitive),
// ranked prefix-matches-first then alphabetically within each rank, capped
// at `limit` - 1946 rows must never render at once. An empty query returns
// the first `limit` families in the same order (so opening the picker with
// nothing typed still shows something to scroll).
function searchCatalogue(query, limit = 60) {
    const q = String(query || '').trim().toLowerCase();
    const rows = typeof GOOGLE_FONTS_CATALOGUE !== 'undefined' ? GOOGLE_FONTS_CATALOGUE : [];
    const matches = [];
    rows.forEach(([family, category]) => {
        const idx = q ? family.toLowerCase().indexOf(q) : 0;
        if (idx === -1) return;
        matches.push({ family, category, rank: idx === 0 ? 0 : 1 });
    });
    matches.sort((a, b) => a.rank - b.rank || a.family.localeCompare(b.family));
    return matches.slice(0, limit).map(({ family, category }) => ({ family, category }));
}

const FONT_POOL_GENERICS = { sans: 'sans-serif', serif: 'serif', mono: 'monospace' };

// The CSS value a catalogue pick commits to a family var: always quoted plus
// the pool's own generic, regardless of the family's Google category
// (Display/Handwriting faces still fall back through `pool`'s generic, not
// their own category). A name the catalogue doesn't know - a typed raw value
// - is returned verbatim, so this is also safe to call on arbitrary text.
function familyCssValue(name, pool) {
    if (!catalogueEntry(name)) return name;
    return `'${name}', ${FONT_POOL_GENERICS[pool] || 'sans-serif'}`;
}

// --- @import / <link> URL ---------------------------------------------------

// Map<family, Set<weight-as-string>>: every catalogue-or-not face actually in
// play across the given vars object(s), with the weights it's asked to
// render at. The three family tokens always contribute their default weight
// (400) even when no set follows them, so a token face picked but not yet
// assigned to any set still loads; a set's own weight (falling back to its
// own default when the var isn't set) adds on top of that.
function collectFamilyWeights(vars, typeSets) {
    const weights = new Map();
    const add = (family, weight) => {
        if (!family) return;
        if (!weights.has(family)) weights.set(family, new Set());
        if (weight !== undefined && weight !== null && weight !== '') weights.get(family).add(String(weight));
    };
    varsList(vars).forEach(v => {
        if (!v) return;
        ['sans', 'serif', 'mono'].forEach(pool => add(firstFamily(v[`font-${pool}`]), '400'));
        (typeSets || []).forEach(set => add(resolveTypeFace(v, set.key), v[`type-${set.key}-weight`] || set.weight || '400'));
    });
    return weights;
}

// Every distinct catalogue face the system actually uses, across every vars
// object given (see collectFamilyWeights) - alphabetical, weights dropped.
function googleFamilies(vars, typeSets) {
    return [...collectFamilyWeights(vars, typeSets).keys()].filter(f => catalogueEntry(f)).sort();
}

// One css2 URL for every catalogue face in use, each carrying only the
// weights some set (or a bare family token) actually asked for, intersected
// with the weights that family really ships - ascending, and never a weight
// the family lacks (Google's css2 endpoint 400s the WHOLE request over one
// unsupported weight, which would blank every Google face in the preview at
// once). A family requested at weights the catalogue doesn't have any of
// falls back to no explicit list at all (Google serves its default face)
// rather than being dropped outright.
function googleFontsHref(vars, typeSets) {
    const weights = collectFamilyWeights(vars, typeSets);
    const families = [...weights.keys()].filter(f => catalogueEntry(f)).sort();
    if (!families.length) return '';
    const params = families.map(family => {
        const supported = new Set(catalogueEntry(family).weights.map(String));
        const used = [...new Set([...weights.get(family)].filter(w => supported.has(w)))].map(Number).sort((a, b) => a - b);
        const spec = used.length ? `:wght@${used.join(';')}` : '';
        return `family=${encodeURIComponent(family).replace(/%20/g, '+')}${spec}`;
    });
    return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

// The @import statement buildDesignSystemCss prepends, or '' when the system
// uses only system faces (system-ui / Georgia / ui-monospace / ...).
function fontImportCss(vars, typeSets) {
    const href = googleFontsHref(vars, typeSets);
    return href ? `@import url("${href}");\n\n` : '';
}
