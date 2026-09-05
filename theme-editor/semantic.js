// semantic.js - the mutable list of semantic design tokens (Summary tab's
// "Semantic roles" section): starts as the 33 built-in color roles and grows
// as the user adds their own ("+ Add" row - see scripts.js
// addSemanticColorToken). Pure data/validation helpers only - no DOM, no
// editor state; scripts.js owns state.semanticTokens and is the only caller.
// Loaded after dtcg.js, before scripts.js - dtcg.js must never call into
// this file (see tests/dtcg.test.js's smaller loader, which has no
// semantic.js and keeps its own copy of the role list for that reason).
//
// A token is `{ kind: 'color', name }`. Only the 'color' kind exists so far
// (this card only adds a color token); a later card generalises this file to
// the other foundation kinds (space/radius/border/shadow/type), reusing
// defaultSemanticTokens/normalizeSemanticTokens/semanticNameError as the
// 'color' case of a kind-generic table.
//
// Two "semantic role" lists live in this codebase and must be read as sets,
// not compared by order: this file's SEMANTIC_COLOR_ROLES (Summary/Colors
// tab UI order - COLOR_GROUPS then ELEMENT_GROUPS, see scripts.js
// ALL_COLOR_GROUPS) and dtcg.js's DTCG_COLOR_ROLES (tokens.json export
// order). tests/semantic.test.js asserts they're the same 33 names.

// The 33 built-in semantic color roles.
const SEMANTIC_COLOR_ROLES = [
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'accent', 'accent-foreground',
    'background', 'foreground', 'muted', 'muted-foreground', 'destructive', 'destructive-foreground',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
    'card', 'card-foreground', 'popover', 'popover-foreground', 'border', 'input', 'ring',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring', 'shadow-color'
];

// A user-typed token name: lowercase, starts with a letter, letters/digits/
// hyphens only after that - no dots (a dot re-nests a group in the DTCG
// export; see dtcg.js buildTokensJson/parseTokensJson).
const SEMANTIC_NAME_RE = /^[a-z][a-z0-9-]*$/;

// Every semantic color var sits bare (--<name> - see foundation.js
// refToVar's 'color' case) alongside the foundation's own prefixed
// namespaces; a name starting with one of these would silently shadow a
// scale/font/type variable in the CSS export. scripts.js additionally bars
// every ELEMENTS key (+ '-'), since component-part vars use `<element>-`
// too - kept out of this file so it stays loadable without components.js.
const SEMANTIC_RESERVED_PREFIXES = ['palette-', 'space-', 'radius-', 'border-width-', 'border-style-', 'shadow-', 'font-', 'type-', 'tracking-'];

function defaultSemanticTokens() {
    return SEMANTIC_COLOR_ROLES.map(name => ({ kind: 'color', name }));
}

// Every name of one kind, in list order (scripts.js linkableColorKeys() is
// semanticNames(state.semanticTokens, 'color')).
function semanticNames(list, kind) {
    return (Array.isArray(list) ? list : []).filter(t => t && t.kind === kind).map(t => t.name);
}

function isCssIdentifier(name) {
    return SEMANTIC_NAME_RE.test(String(name === undefined || name === null ? '' : name));
}

// null on success, a user-facing string otherwise. `list` is the live
// semanticTokens array (names are unique across every kind, not just the
// one being added); `reservedPrefixes` additionally bars a name that would
// shadow another namespace.
function semanticNameError(name, list, reservedPrefixes) {
    const trimmed = String(name === undefined || name === null ? '' : name).trim();
    if (!trimmed) return 'Enter a name.';
    if (!isCssIdentifier(trimmed)) return 'Use lowercase letters, numbers and hyphens, starting with a letter.';
    if ((Array.isArray(list) ? list : []).some(t => t && t.name === trimmed)) return `"${trimmed}" already exists.`;
    if ((Array.isArray(reservedPrefixes) ? reservedPrefixes : []).some(p => trimmed.startsWith(p))) {
        return `"${trimmed}" collides with a foundation or component variable.`;
    }
    return null;
}

// Appends one token; returns a NEW array (never mutates `list`).
function addSemanticToken(list, kind, name) {
    return [...(Array.isArray(list) ? list : []), { kind, name: String(name).trim() }];
}

// A saved/imported list, made safe. Not an array -> the 33 defaults (a saved
// system predating this field, or a corrupt one). Otherwise every entry is
// checked (kind/name present, name a valid identifier) and de-duplicated by
// kind+name; the survivors are returned as-is - an intentionally short list
// stays short, so a future "delete a built-in role" survives a reload -
// UNLESS every entry turns out invalid, which reads the same as "no list"
// and also falls back to the defaults.
function normalizeSemanticTokens(list) {
    if (!Array.isArray(list)) return defaultSemanticTokens();
    const seen = new Set();
    const out = [];
    list.forEach(t => {
        if (!t || typeof t.kind !== 'string' || typeof t.name !== 'string') return;
        const name = t.name.trim();
        if (!name || !isCssIdentifier(name)) return;
        const key = `${t.kind}:${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ kind: t.kind, name });
    });
    return out.length ? out : defaultSemanticTokens();
}
