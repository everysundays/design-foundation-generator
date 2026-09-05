// Google Fonts - resolving a type set's family token down to the face it
// actually renders, and building the @import/<link> URL the preview and the
// exported design-system.css both load faces from.
//
// Self-contained on purpose: no typeVarKey/TYPE_SETS globals from scripts.js
// (the family var key is inlined below) so this file, plus foundation.js,
// is the whole dependency of tests/fonts.test.js. Loaded before components.js
// (see index.html) so scripts.js can call these as ordinary globals.

// The catalogue this card ships with - every family the app can already pick
// from the Sans/Serif/Mono selects and the per-set family control. [36]
// replaces this with the full Google Fonts metadata snapshot.
const GOOGLE_FONTS = new Set(['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Work Sans', 'Source Serif 4', 'Playfair Display', 'JetBrains Mono', 'Fira Code']);

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

// Every distinct catalogue face the system actually uses: the three family
// tokens plus each type set's resolved face, across every vars object given.
function googleFamilies(vars, typeSets) {
    const faces = new Set();
    varsList(vars).forEach(v => {
        if (!v) return;
        ['font-sans', 'font-serif', 'font-mono'].forEach(k => faces.add(firstFamily(v[k])));
        (typeSets || []).forEach(set => faces.add(resolveTypeFace(v, set.key)));
    });
    return [...faces].filter(f => GOOGLE_FONTS.has(f)).sort();
}

function googleFontsHref(vars, typeSets) {
    const wanted = googleFamilies(vars, typeSets);
    if (!wanted.length) return '';
    return `https://fonts.googleapis.com/css2?${wanted.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`;
}

// The @import statement buildDesignSystemCss prepends, or '' when the system
// uses only system faces (system-ui / Georgia / ui-monospace / ...).
function fontImportCss(vars, typeSets) {
    const href = googleFontsHref(vars, typeSets);
    return href ? `@import url("${href}");\n\n` : '';
}
