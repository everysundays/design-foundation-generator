// semantic.js - the mutable list of semantic design tokens (Summary tab's
// "Semantic roles" section, plus one per-kind section for every non-color
// scale kind - see SEMANTIC_SCALE_KINDS below): starts as the 33 built-in
// color roles and grows as the user adds their own ("+ Add" row - see
// scripts.js addSemanticColorToken / addSemanticScaleToken). Pure
// data/validation helpers only - no DOM, no editor state; scripts.js owns
// state.semanticTokens and is the only caller. Loaded after dtcg.js, before
// scripts.js - dtcg.js must never call into this file (see
// tests/dtcg.test.js's smaller loader, which has no semantic.js and keeps
// its own copy of the role list for that reason).
//
// A token is `{ kind, name }` (color) or `{ kind, name, ref }` (every other
// kind - `ref` is the foundation ref it currently targets, e.g. 'space.6';
// color has no `ref` because its value comes from tokenLinks/state.vars like
// any other semantic color, not from a scale entry). "Token before step":
// every resolver that walks a ref (scripts.js resolveToFoundation/
// describeRef/computeMarks, dtcg.js's export/import translation,
// switchPaletteSource's remap) must check resolveSemanticTarget() FIRST and
// only fall back to treating the ref as a literal foundation step when that
// returns null - a token's name and a step's name share the same ref prefix
// (space.card-padding vs space.6) and are told apart only by this list.
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

// Appends one token; returns a NEW array (never mutates `list`). `ref` is
// the foundation ref a non-color kind targets (e.g. 'space.6') - omitted for
// 'color', whose value lives in tokenLinks/state.vars instead.
function addSemanticToken(list, kind, name, ref) {
    const entry = { kind, name: String(name).trim() };
    if (kind !== 'color') entry.ref = ref;
    return [...(Array.isArray(list) ? list : []), entry];
}

// A saved/imported list, made safe. Not an array -> the 33 defaults (a saved
// system predating this field, or a corrupt one). Otherwise every entry is
// checked (kind/name present, name a valid identifier, a non-color entry
// additionally needs a `ref` that parses as a ref) and de-duplicated by
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
        if (t.kind === 'color') {
            seen.add(key);
            out.push({ kind: t.kind, name });
        } else {
            if (typeof t.ref !== 'string' || !t.ref || (typeof parseRef === 'function' && !parseRef(t.ref))) return;
            seen.add(key);
            out.push({ kind: t.kind, name, ref: t.ref });
        }
    });
    return out.length ? out : defaultSemanticTokens();
}

// --- Non-color kinds: a token targets a foundation scale entry -------------
// (color instead links a palette swatch/role - see addSemanticColorToken).
// This is the kind-generic machinery space (this card) and radius/border-
// width/border-style/shadow (later cards, same shape) share; 'type' semantic
// tokens are a different shape (a type SET, not a scale entry) and aren't
// part of this list.
const SEMANTIC_SCALE_KINDS = ['space', 'radius', 'borderWidth', 'borderStyle', 'shadow'];

// The target ref a semantic token names (e.g. 'space.card-padding' ->
// 'space.6'), or null when `ref` doesn't name a token at all - a literal
// foundation-step ref, an unknown name, or not a ref. "Token before step":
// callers resolve a ref through this FIRST and only treat it as a literal
// step ref when this returns null (see the file header).
function resolveSemanticTarget(list, ref) {
    const parsed = typeof parseRef === 'function' ? parseRef(ref) : null;
    if (!parsed || parsed.kind === 'color') return null;
    const token = (Array.isArray(list) ? list : []).find(t => t && t.kind === parsed.kind && t.name === parsed.name && typeof t.ref === 'string');
    return token ? token.ref : null;
}

// null | { what: 'step', source, name } | { what: 'token', name }: whichever
// existing CSS var a candidate (kind, name) token would collide with -
// checked against every FOUNDATION source's scale (built-in AND that
// source's custom entries, so a token is safe under both Tailwind and
// Atlassian and can never be shadowed by a later custom step either) and
// every token already in `list` (any kind, so two different scale kinds
// that happened to spell the same var still catch each other). Used by both
// the add-token flow (scripts.js addSemanticScaleToken) and the add-custom-
// step flow (addCustomScaleEntry), so "name a step like an existing token"
// and "name a token like an existing step" are refused by the exact same
// check. `excludeIndex` (optional) skips one entry of `list` - a future
// rename checks a token against every entry BUT itself.
function varCollision(kind, name, list, excludeIndex) {
    const candidateVar = typeof refToVar === 'function' ? refToVar(scaleRef(kind, name)) : null;
    if (!candidateVar) return null;
    const sources = typeof FOUNDATION === 'object' && FOUNDATION ? Object.keys(FOUNDATION) : [];
    for (let s = 0; s < sources.length; s++) {
        const sourceKey = sources[s];
        const entries = scaleEntries(sourceKey, kind);
        for (let i = 0; i < entries.length; i++) {
            if (refToVar(scaleRef(kind, entries[i].name)) === candidateVar) {
                return { what: 'step', source: sourceKey, name: entries[i].name };
            }
        }
    }
    const tokens = Array.isArray(list) ? list : [];
    for (let i = 0; i < tokens.length; i++) {
        if (i === excludeIndex) continue;
        const t = tokens[i];
        if (!t || typeof t.name !== 'string') continue;
        const tVar = t.kind === 'color' ? `--${t.name}` : refToVar(scaleRef(t.kind, t.name));
        if (tVar === candidateVar) return { what: 'token', name: t.name };
    }
    return null;
}

// A varCollision() result as a user-facing refusal string - shared by both
// call sites so the same collision reads identically from either side.
function semanticVarCollisionMessage(name, collision) {
    if (!collision) return null;
    if (collision.what === 'token') return `"${name}" collides with the "${collision.name}" token.`;
    const label = (typeof FOUNDATION === 'object' && FOUNDATION[collision.source] && FOUNDATION[collision.source].label) || collision.source;
    return `"${name}" collides with the ${label} step "${collision.name}".`;
}

// Re-targets every non-color token across a Foundation switch (see
// scripts.js switchPaletteSource) - a token's own name never changes, only
// what it points at; color tokens are untouched here (their re-linking is
// switchPaletteSource's existing snapVarsToPalette pass). A component
// pointing AT a token (e.g. 'space.card-padding') is unaffected by the
// separate remapComponentTokens pass, since 'card-padding' never matches a
// real step name in either source's scale - it keeps pointing at the token.
function remapSemanticTokens(list, from, to) {
    return (Array.isArray(list) ? list : []).map(t => {
        if (!t || t.kind === 'color' || typeof t.ref !== 'string') return t;
        return { ...t, ref: remapRef(t.ref, from, to) };
    });
}

// `  --space-card-padding: var(--space-6);` for every token of `kind` - the
// design-system CSS's own definition of a token's var, always pointing at
// var(--<step>) rather than the step's literal value, so re-targeting a
// token (scripts.js setSemanticTokenTarget) moves every part through this
// one line without touching the parts' own assignments. '' when `list` has
// no token of `kind`.
function semanticVarLines(list, kind) {
    return (Array.isArray(list) ? list : [])
        .filter(t => t && t.kind === kind && typeof t.ref === 'string')
        .map(t => `  ${refToVar(scaleRef(kind, t.name))}: var(${refToVar(t.ref)});`)
        .join('\n');
}

// --- Type: a token targets a type SET, not a scale entry --------------------
// (see the file header - 'type' is deliberately left out of
// SEMANTIC_SCALE_KINDS above). Its ref is still 'type.<setKey>' - the exact
// shape scaleRef('type', name) already produces (KIND_PREFIX.type) and
// parseRef/refToVar already understood before this card (a component could
// already point straight at a set, e.g. 'type.body') - so the only new work
// is resolving THROUGH a token to the set it aliases, with a safe fallback,
// and a name check against the live set list instead of scaleEntries().
// TYPE_SETS itself lives in scripts.js (typesets.js once card 39 lands) and
// is always passed in here as `typeSets`, never read as a global, so this
// file's only dependency stays foundation.js.

// The set a token falls back to when its own target is missing: Body (the
// natural default, and card 41's own re-point target for a removed set) -
// never TYPE_SETS[0]/Display, the most visually extreme choice.
const SEMANTIC_TYPE_FALLBACK_KEY = 'body';

function semanticTypeFallbackKey(typeSets) {
    const sets = Array.isArray(typeSets) ? typeSets : [];
    if (sets.some(s => s && s.key === SEMANTIC_TYPE_FALLBACK_KEY)) return SEMANTIC_TYPE_FALLBACK_KEY;
    return sets.length ? sets[0].key : null;
}

// A ref naming a set directly (a token's own `.ref`, e.g. 'type.label', or a
// component pointed straight at a set) -> the TYPE_SETS entry it names, or
// the fallback (semanticTypeFallbackKey) when that set no longer exists -
// never null while `typeSets` is non-empty, so re-targeting or removing a
// set can never leave a token's alias vars pointing at nothing.
function resolveTypeSetForRef(ref, typeSets) {
    const sets = Array.isArray(typeSets) ? typeSets : [];
    const parsed = typeof parseRef === 'function' ? parseRef(ref) : null;
    const direct = parsed && parsed.kind === 'type' ? sets.find(s => s && s.key === parsed.name) : null;
    if (direct) return direct;
    const fallbackKey = semanticTypeFallbackKey(sets);
    return fallbackKey ? sets.find(s => s && s.key === fallbackKey) : null;
}

// A `type.<name>` ref -> the TYPE_SETS entry it renders as, when `name`
// names a semantic type TOKEN ("token before step", see the file header):
// resolveSemanticTarget finds the token, resolveTypeSetForRef resolves (and
// fallback-repairs) what it targets. null when `ref` doesn't name a token at
// all, so a literal `type.<setKey>` ref is left to the caller's own direct
// lookup, unchanged from before this kind existed.
function resolveSemanticTypeSet(list, ref, typeSets) {
    const tokenTarget = resolveSemanticTarget(list, ref);
    return tokenTarget ? resolveTypeSetForRef(tokenTarget, typeSets) : null;
}

// A candidate type-token name, refused for the usual reasons
// (semanticNameError: identifier format, unique against every existing
// token of any kind - a type var is always namespaced under "--type-", so
// unlike color/scale tokens it never needs the reserved-prefix check) or
// because it collides (by refToVar) with an existing type-SET key, built-in
// or user-added - the reverse of a future type-set-name check (see the
// board's "13 vs 39" note: both cards refuse the other's names off the one
// shared `type.<x>` ref namespace). `typeSets` is the live set list
// (TYPE_SETS today).
function typeTokenNameError(name, list, typeSets) {
    const err = semanticNameError(name, list, []);
    if (err) return err;
    const trimmed = String(name).trim();
    const candidateVar = refToVar(`type.${trimmed}`);
    const clash = (Array.isArray(typeSets) ? typeSets : []).find(s => s && refToVar(`type.${s.key}`) === candidateVar);
    return clash ? `"${trimmed}" collides with the "${clash.label}" type set.` : null;
}

// The five `--type-<token>-<field>: var(--type-<set>-<field>);` design-
// system-CSS lines for every semantic type token in `list` - the type-kind
// counterpart to semanticVarLines, needed because a type token's target is
// a TYPE_SETS entry rather than a scaleEntries() step, resolved (with
// fallback) through resolveTypeSetForRef. '' when `list` has no type token.
function semanticTypeAliasLines(list, typeSets) {
    const tokens = (Array.isArray(list) ? list : []).filter(t => t && t.kind === 'type' && typeof t.ref === 'string');
    if (!tokens.length) return '';
    // Mirrors components.js TYPE_PROP_FIELDS (duplicated, not imported - the
    // same reason dtcg.js's own DTCG_IDENT_RE mirrors this file's
    // SEMANTIC_NAME_RE: keeps this file loadable/testable without
    // components.js).
    const fields = ['family', 'weight', 'size', 'leading', 'tracking'];
    return tokens.map(t => {
        const set = resolveTypeSetForRef(t.ref, typeSets);
        if (!set) return '';
        const tokenVar = refToVar(`type.${t.name}`);
        const setVar = refToVar(`type.${set.key}`);
        return fields.map(f => `  ${tokenVar}-${f}: var(${setVar}-${f});`).join('\n');
    }).filter(Boolean).join('\n');
}
