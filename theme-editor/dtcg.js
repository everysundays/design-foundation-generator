// dtcg.js - tokens.json export / import for Theme Editor v2.
//
// Writes and reads the Tokens Studio / Penpot importer dialect (see
// penpot/tokens.example.json): a file
// is a map of token SETS, each set a nested group tree whose leaves are
// `{ "$type": ..., "$value": ... }`, plus `$metadata.tokenSetOrder` and
// `$themes`. References are `{group.name}` strings that resolve across
// every set enabled in a theme.
//
// Sets produced:
//   global     palette.*, space.*, radius.*, border.width.*, border.style.*,
//              shadow.*, font.family.*, font.size.*, font.lineHeight.*, type.*
//              + $extensions["theme-editor"] = { version, name, source, families }
//   light/dark color.<role> -> "{palette.<name>}" when linked into the active
//              source, else the literal value
//   component  component.<element>[.<variant>].<part>[.<prop>][-<state>] -> "{ref}"
//
// Naming rules worth knowing:
// * Scale entries keep the source's OWN token name as a single flat key, so
//   Atlassian's "space.100" is written as global.space["space.100"] and is
//   referenced as "{space.space.100}" - exactly what parseRef/refToVar in
//   foundation.js already produce. Tokens Studio flattens nested groups and
//   dotted keys to the same path, so the importer reads both spellings.
// * A state token would otherwise be the PARENT of nothing and the CHILD of
//   a token (`button.primary.bg.color` is a token, `.hover` extends it), and
//   a token object can't also be a group. So the state joins the last
//   segment with "-": `button.primary.bg.color.hover` is emitted as
//   component.button.primary.bg["color-hover"]. parseTokensJson reverses
//   it: a leaf whose last "-<suffix>" is hover|focus|active|disabled is a
//   state token. (No part/prop name ends in one of those words.)
// * Lengths are exported in px (Penpot), the editor keeps rem (16px/rem).
//   A type set's size/leading is a "{font.size.<name>}" ref when the rem
//   sits exactly on a scale entry, else a px literal.

const DTCG_COLOR_ROLES = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    'shadow-color'
];

const DTCG_STATES = ['hover', 'focus', 'active', 'disabled'];
const DTCG_FONT_KEYS = ['sans', 'serif', 'mono'];
const DTCG_PALETTE_SPECIALS = [['white', '#ffffff'], ['black', '#000000'], ['transparent', 'transparent']];
const DTCG_SET_ORDER = ['global', 'light', 'dark', 'component'];

// $extensions['theme-editor'].version - bumped only when the extension's own
// shape changes in a way older code can't read; an additive key (semantic,
// groups, customElements, typeSets, …) never bumps it. See the cross-card
// "$extensions convention" note: every such key is emitted only when
// non-empty/non-default so plain deep-equal checks and Penpot round-trips
// of an unmodified export stay byte-identical to before that key existed.
const DTCG_FILE_VERSION = 2;

// A user-typed semantic token name (mirrors semantic.js's SEMANTIC_NAME_RE -
// duplicated, not imported: dtcg.js must never call into semantic.js, see
// tests/dtcg.test.js's loader).
const DTCG_IDENT_RE = /^[a-z][a-z0-9-]*$/;

// parseRef kind -> DTCG/Tokens Studio $type.
const DTCG_TYPE_OF_KIND = {
    color: 'color', palette: 'color', space: 'spacing', radius: 'borderRadius',
    borderWidth: 'strokeWidth', borderStyle: 'strokeStyle', shadow: 'boxShadow',
    type: 'typography', typeSize: 'fontSizes', typeLeading: 'lineHeights', fontFamily: 'fontFamilies'
};

// --- small helpers ---

function dtcgToken(type, value, extra) {
    return Object.assign({ $type: type, $value: value }, extra || {});
}

function dtcgIsToken(node) {
    return !!node && typeof node === 'object' && !Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, '$value');
}

function dtcgIsGroup(node) {
    return !!node && typeof node === 'object' && !Array.isArray(node) && !dtcgIsToken(node);
}

// "{a.b.c}" -> "a.b.c", anything else -> null.
function dtcgRefOf(value) {
    const m = typeof value === 'string' ? value.match(/^\{([^{}]+)\}$/) : null;
    return m ? m[1] : null;
}

function dtcgRound(n, digits) {
    const f = Math.pow(10, digits);
    return Math.round(n * f) / f;
}

// Length of a scale entry as the exported px string ("16px"; radius "full"
// has no px and keeps its own value, "9999px").
function dtcgEntryPx(entry) {
    return entry.px === null || entry.px === undefined ? entry.value : `${entry.px}px`;
}

function dtcgRemToPx(rem) {
    return `${dtcgRound(rem * 16, 2)}px`;
}

function dtcgPxToRem(px) {
    return `${dtcgRound(px / 16, 4)}rem`;
}

// "var(--font-sans)" -> "sans", else null.
function dtcgFamilyVarKey(value) {
    const m = typeof value === 'string' ? value.match(/^var\(--font-(sans|serif|mono)\)$/) : null;
    return m ? m[1] : null;
}

// Every token leaf of a group as [name, token], name = path joined with ".",
// so nested groups and flat dotted keys read the same way.
function dtcgLeaves(group, prefix) {
    const out = [];
    if (!dtcgIsGroup(group)) return out;
    Object.keys(group).forEach(key => {
        if (key.startsWith('$')) return;
        const node = group[key];
        const name = prefix ? `${prefix}.${key}` : key;
        if (dtcgIsToken(node)) out.push([name, node]);
        else if (dtcgIsGroup(node)) out.push(...dtcgLeaves(node, name));
    });
    return out;
}

function dtcgHasTokens(set) {
    return dtcgLeaves(set, '').length > 0;
}

// Type sets from the vars when the caller passes none: every `type-<set>-size`.
function dtcgTypeSetsFromVars(vars) {
    return Object.keys(vars || {})
        .map(k => k.match(/^type-(.+)-size$/))
        .filter(Boolean)
        .map(m => ({ key: m[1] }));
}

// --- export ---

function buildTokensJson(ctx) {
    ctx = ctx || {};
    const source = FOUNDATION[ctx.source] ? ctx.source : 'tailwind';
    const families = Array.isArray(ctx.families) ? ctx.families.slice() : [];
    const vars = { light: (ctx.vars && ctx.vars.light) || {}, dark: (ctx.vars && ctx.vars.dark) || {} };
    const links = { light: (ctx.links && ctx.links.light) || {}, dark: (ctx.links && ctx.links.dark) || {} };
    const components = ctx.components || {};
    const typeSets = Array.isArray(ctx.typeSets) && ctx.typeSets.length ? ctx.typeSets : dtcgTypeSetsFromVars(vars.light);

    // The full semantic-token list ctx carries (color AND non-color kinds -
    // card 9 generalises this beyond card 8's color-only reading). The
    // color-role list is the 33 built-ins by default; ctx from a system
    // carrying user-added tokens (or a renamed/removed built-in, once a
    // later card supports that) passes its own list instead.
    const ctxAllTokens = Array.isArray(ctx.semanticTokens)
        ? ctx.semanticTokens.filter(t => t && typeof t.kind === 'string' && typeof t.name === 'string' && t.name)
        : null;
    const ctxColorTokens = ctxAllTokens ? ctxAllTokens.filter(t => t.kind === 'color') : null;
    const ctxNonColorTokens = ctxAllTokens ? ctxAllTokens.filter(t => t.kind !== 'color' && typeof t.ref === 'string' && t.ref) : [];
    // Checked against ctxAllTokens (was the list provided at all?), never
    // ctxColorTokens itself - a provided list that happens to carry zero
    // color entries (a fixture isolating a single non-color token, say) is
    // still "provided" and must not fall back to the 33 defaults; an EMPTY
    // array is truthy, so testing ctxColorTokens directly here would do
    // exactly that and silently drop every role (including shadow-color,
    // which every shadow step's {color.shadow-color} reference depends on).
    const roles = ctxAllTokens ? ctxColorTokens.map(t => t.name) : DTCG_COLOR_ROLES;
    // Set comparison, not positional: the live app's own default order
    // (scripts.js/semantic.js SEMANTIC_COLOR_ROLES, grouped for the Summary
    // tab) is not this file's DTCG_COLOR_ROLES order, even though both list
    // the same 33 names - an order-sensitive check would call every export
    // of an untouched system "non-default" and pollute it with a redundant
    // extension key.
    const roleSet = new Set(roles);
    const rolesAreDefault = roleSet.size === DTCG_COLOR_ROLES.length && DTCG_COLOR_ROLES.every(r => roleSet.has(r));
    const tokensAreDefault = rolesAreDefault && ctxNonColorTokens.length === 0;
    // Non-color tokens as real alias tokens under global.semantic.<kind-path>
    // (KIND_PREFIX - the exact same group nesting a plain ref already uses,
    // e.g. borderWidth -> "border.width") - so `{semantic.space.card-padding}`
    // resolves inside the file for any DTCG consumer, not only this app.
    const semanticGroup = {};
    ctxNonColorTokens.forEach(t => {
        const $type = DTCG_TYPE_OF_KIND[t.kind];
        if (!$type) return;
        const segments = (KIND_PREFIX[t.kind] || t.kind).split('.');
        let node = semanticGroup;
        segments.forEach(seg => {
            if (!dtcgIsGroup(node[seg])) node[seg] = {};
            node = node[seg];
        });
        node[t.name] = dtcgToken($type, `{${t.ref}}`);
    });
    // Every non-color token's own ref (e.g. 'space.card-padding') - a
    // component pointed at one of these is exported as
    // "{semantic.<ref>}" instead of "{<ref>}" (see the component loop
    // below), since global.<kind-prefix> has no entry for a token's name,
    // only global.semantic.<kind-path> does.
    const nonColorTokenRefs = new Set(ctxNonColorTokens.map(t => scaleRef(t.kind, t.name)));

    const scaleGroup = (kind, type) => {
        const group = {};
        scaleEntries(source, kind).forEach(entry => { group[entry.name] = dtcgToken(type, dtcgEntryPx(entry)); });
        return group;
    };

    // palette: the subset + specials + whatever a link still points at
    // outside the subset, so no "{palette.x}" reference ever dangles.
    const palette = {};
    families.forEach(family => {
        paletteFamilyEntries(source, family).forEach(entry => { palette[entry.name] = dtcgToken('color', entry.hex); });
    });
    DTCG_PALETTE_SPECIALS.forEach(([name, hex]) => { palette[name] = dtcgToken('color', hex); });
    ['light', 'dark'].forEach(mode => {
        Object.keys(links[mode]).forEach(key => {
            const link = links[mode][key];
            if (!link || link.source !== source || !roles.includes(key)) return;
            if (palette[link.name]) return;
            const entry = paletteEntryByName(source, link.name);
            const hex = entry ? entry.hex : link.hex;
            if (hex) palette[link.name] = dtcgToken('color', hex);
        });
    });

    const shadow = {};
    scaleEntries(source, 'shadow').forEach(entry => {
        const layers = entry.layers || [];
        const value = layers.map(([x, y, blur, spread]) => ({
            x: `${x}px`, y: `${y}px`, blur: `${blur}px`, spread: `${spread}px`,
            color: '{color.shadow-color}', type: 'dropShadow'
        }));
        const extra = layers.length ? { $description: `alpha ${layers.map(l => l[4]).join(', ')}` } : null;
        shadow[entry.name] = dtcgToken('boxShadow', value, extra);
    });

    const fontFamily = {};
    DTCG_FONT_KEYS.forEach(key => {
        const value = vars.light[`font-${key}`];
        if (typeof value === 'string' && value) fontFamily[key] = dtcgToken('fontFamilies', value);
    });

    // A type set is a typography composite: family/size/leading become refs
    // when they sit on a token, weight and tracking are literals.
    const lengthOrRef = (raw, kind, prefix) => {
        if (typeof raw !== 'string') return null;
        const remMatch = raw.match(/^(-?[\d.]+)rem$/);
        const pxMatch = raw.match(/^(-?[\d.]+)px$/);
        const rem = remMatch ? parseFloat(remMatch[1]) : pxMatch ? parseFloat(pxMatch[1]) / 16 : NaN;
        if (Number.isNaN(rem)) return raw;
        const entry = scaleEntryForRem(source, kind, rem);
        return entry ? `{${prefix}.${entry.name}}` : dtcgRemToPx(rem);
    };
    const type = {};
    typeSets.forEach(set => {
        const key = set.key;
        const get = prop => vars.light[`type-${key}-${prop}`];
        if (['family', 'weight', 'size', 'leading', 'tracking'].every(p => get(p) === undefined)) return;
        const value = {};
        const family = get('family');
        const familyKey = dtcgFamilyVarKey(family);
        if (familyKey) value.fontFamily = `{font.family.${familyKey}}`;
        else if (typeof family === 'string' && family) value.fontFamily = family;
        if (get('weight') !== undefined) value.fontWeight = String(get('weight'));
        const size = lengthOrRef(get('size'), 'typeSize', 'font.size');
        if (size !== null) value.fontSize = size;
        const leading = lengthOrRef(get('leading'), 'typeLeading', 'font.lineHeight');
        if (leading !== null) value.lineHeight = leading;
        if (get('tracking') !== undefined) value.letterSpacing = String(get('tracking'));
        type[key] = dtcgToken('typography', value);
    });

    const global = {
        palette,
        space: scaleGroup('space', 'spacing'),
        radius: scaleGroup('radius', 'borderRadius'),
        border: {
            width: scaleGroup('borderWidth', 'strokeWidth'),
            style: scaleGroup('borderStyle', 'strokeStyle')
        },
        shadow,
        font: {
            family: fontFamily,
            size: scaleGroup('typeSize', 'fontSizes'),
            lineHeight: scaleGroup('typeLeading', 'lineHeights')
        },
        type,
        $extensions: {
            'theme-editor': Object.assign(
                { version: DTCG_FILE_VERSION, name: ctx.name || 'Untitled', source, families: families.slice() },
                (ctxAllTokens && !tokensAreDefault)
                    // `builtin` (card 14): a renamed built-in color role's
                    // stable identity - carried along whenever it's a
                    // non-empty string so a round trip through this file
                    // doesn't strip it (see parseTokensJson's matching
                    // read-back); omitted entirely for a plain/never-renamed
                    // entry, so an export with no renamed role stays exactly
                    // byte-identical to before this field existed.
                    ? { semantic: { tokens: ctxAllTokens.map(t => (t.builtin ? { kind: t.kind, name: t.name, builtin: t.builtin } : { kind: t.kind, name: t.name })) } }
                    : null
            )
        }
    };
    // Only when a non-color token actually exists - an unmodified export
    // (no semantic tokens beyond the 33 defaults) carries no `semantic` key
    // at all, keeping it byte-identical to before this card.
    if (Object.keys(semanticGroup).length) global.semantic = semanticGroup;

    const colorSet = mode => {
        const color = {};
        roles.forEach(role => {
            const raw = vars[mode][role];
            if (raw === undefined || raw === null) return;
            const link = links[mode][role];
            const linked = link && link.source === source && palette[link.name];
            color[role] = dtcgToken('color', linked ? `{palette.${link.name}}` : String(raw));
        });
        return { color };
    };

    // component: nest by dotted id, state folded into the leaf (see header).
    const component = {};
    Object.keys(components).forEach(id => {
        const ref = components[id];
        const parsed = parseRef(ref);
        if (!parsed) return;
        const $type = DTCG_TYPE_OF_KIND[parsed.kind];
        if (!$type) return;
        const segments = id.split('.');
        if (segments.length > 2 && DTCG_STATES.includes(segments[segments.length - 1])) {
            const state = segments.pop();
            segments[segments.length - 1] += `-${state}`;
        }
        let node = component;
        for (let i = 0; i < segments.length - 1; i++) {
            const seg = segments[i];
            if (!dtcgIsGroup(node[seg])) node[seg] = {};
            node = node[seg];
        }
        // A ref naming a non-color semantic token (e.g. 'space.card-padding')
        // has no entry under global.<kind> - only global.semantic.<kind-path>
        // does (built above) - so it is written as "{semantic.<ref>}" instead
        // of the plain "{<ref>}" a literal foundation step gets.
        const exported = nonColorTokenRefs.has(ref) ? `semantic.${ref}` : ref;
        node[segments[segments.length - 1]] = dtcgToken($type, `{${exported}}`);
    });

    return {
        global,
        light: colorSet('light'),
        dark: colorSet('dark'),
        component: { component },
        $metadata: { tokenSetOrder: DTCG_SET_ORDER.slice() },
        $themes: [
            { id: 'light', name: 'Light', group: 'mode', selectedTokenSets: { global: 'source', light: 'enabled', component: 'enabled' } },
            { id: 'dark', name: 'Dark', group: 'mode', selectedTokenSets: { global: 'source', dark: 'enabled', component: 'enabled' } }
        ]
    };
}

// --- import ---

// Which palette source the given palette names belong to (most matches wins,
// Tailwind on a tie / no matches).
function dtcgInferSource(names) {
    let best = 'tailwind';
    let bestCount = -1;
    Object.keys(FOUNDATION).forEach(key => {
        const known = new Set(FOUNDATION[key].color.names().flat());
        const count = names.filter(n => known.has(n)).length;
        if (count > bestCount) { best = key; bestCount = count; }
    });
    return best;
}

function dtcgInferFamilies(source, names) {
    const present = new Set();
    names.forEach(n => { const f = paletteFamilyOfName(source, n); if (f) present.add(f); });
    return FOUNDATION[source].color.families().filter(f => present.has(f));
}

function parseTokensJson(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error('Not a tokens file: expected a JSON object of token sets');
    }
    const setNames = Object.keys(obj).filter(k => !k.startsWith('$') && dtcgIsGroup(obj[k]) && dtcgHasTokens(obj[k]));
    if (!setNames.length) {
        throw new Error('Not a tokens file: no token set contains "$type"/"$value" tokens');
    }
    const declaredOrder = obj.$metadata && Array.isArray(obj.$metadata.tokenSetOrder) ? obj.$metadata.tokenSetOrder : [];
    const order = declaredOrder.filter(n => setNames.includes(n)).concat(setNames.filter(n => !declaredOrder.includes(n)));

    const globalName = setNames.includes('global') ? 'global' : (order.find(n => obj[n].palette) || order[0]);
    const global = obj[globalName];
    const colorSets = order.filter(n => n !== globalName && dtcgIsGroup(obj[n].color));
    const lightName = setNames.includes('light') ? 'light' : (colorSets[0] || (dtcgIsGroup(global.color) ? globalName : null));
    const darkName = setNames.includes('dark') ? 'dark' : (colorSets.find(n => n !== lightName) || null);
    const componentName = setNames.includes('component') ? 'component' : order.find(n => dtcgIsGroup(obj[n].component));

    const ext = (global.$extensions && global.$extensions['theme-editor']) || {};
    const paletteLeaves = dtcgLeaves(global.palette, '');
    const paletteNames = paletteLeaves.map(([name]) => name);
    const source = FOUNDATION[ext.source] ? ext.source : dtcgInferSource(paletteNames);
    const families = Array.isArray(ext.families) ? ext.families.slice() : dtcgInferFamilies(source, paletteNames);

    const result = {
        name: typeof ext.name === 'string' && ext.name ? ext.name : 'Imported tokens',
        source,
        families,
        vars: { light: {}, dark: {} },
        links: { light: {}, dark: {} },
        components: {},
        warnings: []
    };

    // Palette lookups: the source's own swatches, the specials, then any
    // literal the file's palette group carries (custom ramps).
    const fileHex = {};
    paletteLeaves.forEach(([name, tok]) => { if (typeof tok.$value === 'string' && !dtcgRefOf(tok.$value)) fileHex[name] = tok.$value; });
    const paletteHex = name => {
        const entry = paletteEntryByName(source, name);
        if (entry) return entry.hex;
        const special = DTCG_PALETTE_SPECIALS.find(([n]) => n === name);
        if (special) return special[1];
        return fileHex[name] || null;
    };

    const readColorSet = (set, mode) => {
        const leaves = dtcgLeaves(set && set.color, '');
        const byRole = {};
        leaves.forEach(([role, tok]) => { byRole[role] = tok; });
        // Resolve a role's value, following {color.x} aliases inside the set
        // and ending on a palette link or a literal.
        const resolve = (role, depth) => {
            const tok = byRole[role];
            if (!tok) return null;
            const value = tok.$value;
            const ref = dtcgRefOf(value);
            if (!ref) return { value: value, link: null };
            if (ref.startsWith('palette.')) {
                const name = ref.slice('palette.'.length);
                const hex = paletteHex(name);
                if (hex === null) {
                    result.warnings.push(`${mode}.color.${role}: unknown palette token "${name}"`);
                    return { value: value, link: null };
                }
                return { value: hex, link: { source, name, hex } };
            }
            if (ref.startsWith('color.') && depth < 8) {
                const inner = resolve(ref.slice('color.'.length), depth + 1);
                if (inner) return inner;
            }
            result.warnings.push(`${mode}.color.${role}: unresolved reference ${value}`);
            return { value: value, link: null };
        };
        Object.keys(byRole).forEach(role => {
            const r = resolve(role, 0);
            if (!r || r.value === undefined) return;
            result.vars[mode][role] = typeof r.value === 'string' ? r.value : String(r.value);
            if (r.link) result.links[mode][role] = r.link;
        });
    };
    if (lightName) readColorSet(obj[lightName], 'light');
    if (darkName) readColorSet(obj[darkName], 'dark');
    else {
        result.vars.dark = Object.assign({}, result.vars.light);
        result.links.dark = Object.assign({}, result.links.light);
    }

    // Semantic token list: the extension's own list when the file carries
    // one (a color entry with no value in either mode, or a non-color entry
    // with no value under global.semantic, is dropped - it named something
    // that no longer resolves to anything); otherwise every built-in color
    // role plus any other identifier-valid color leaf the color sets above
    // just populated result.vars with (a plain export with no "theme-editor"
    // extension, or a foreign Tokens Studio file, that still carries a
    // non-built-in color role - see readColorSet's generic leaf copy; a
    // foreign file has no non-color tokens to recover this way, since their
    // value lives only under our own extension's bookkeeping). Computed
    // here, before font/type parsing adds their own keys to result.vars, so
    // the color fallback only ever scans color-role leaves.
    //
    // A non-color token's value has no per-mode set to live in the way
    // color does - it is the alias token under global.semantic.<kind-path>
    // (built by buildTokensJson, KIND_PREFIX is the exact same group nesting
    // a plain ref already uses), read back here into `ref`.
    const semanticGroupRef = (kind, name) => {
        const segments = (KIND_PREFIX[kind] || kind).split('.');
        let node = global.semantic;
        for (let i = 0; i < segments.length; i++) {
            if (!node || typeof node !== 'object') return null;
            node = node[segments[i]];
        }
        return node && typeof node === 'object' && node[name] ? dtcgRefOf(node[name].$value) : null;
    };
    const extSemanticTokens = ext.semantic && Array.isArray(ext.semantic.tokens) ? ext.semantic.tokens : null;
    const colorLeafNames = new Set([...Object.keys(result.vars.light), ...Object.keys(result.vars.dark)]);
    if (extSemanticTokens) {
        const seen = new Set();
        result.semanticTokens = [];
        extSemanticTokens.forEach(t => {
            if (!t || typeof t.kind !== 'string' || typeof t.name !== 'string' || !t.name) return;
            const key = `${t.kind}:${t.name}`;
            if (seen.has(key)) return;
            if (t.kind === 'color') {
                if (!colorLeafNames.has(t.name)) {
                    result.warnings.push(`semantic token "${t.name}": no color value in light or dark - dropped`);
                    return;
                }
                seen.add(key);
                // `builtin` (card 14): read back verbatim when the file
                // carries one (buildTokensJson only ever writes a non-empty
                // string) - scripts.js normalizeSemanticTokens is still the
                // one place that BACKFILLS a missing builtin by name match,
                // so an older export or a foreign tokens file (no builtin at
                // all) still round-trips a renamed-away role correctly.
                result.semanticTokens.push(typeof t.builtin === 'string' && t.builtin ? { kind: t.kind, name: t.name, builtin: t.builtin } : { kind: t.kind, name: t.name });
                return;
            }
            const ref = semanticGroupRef(t.kind, t.name);
            if (!ref) {
                result.warnings.push(`semantic token "${t.kind}.${t.name}": no value in global.semantic - dropped`);
                return;
            }
            seen.add(key);
            result.semanticTokens.push({ kind: t.kind, name: t.name, ref });
        });
    } else {
        const extra = [];
        colorLeafNames.forEach(name => {
            if (DTCG_COLOR_ROLES.includes(name)) return;
            if (DTCG_IDENT_RE.test(name)) extra.push(name);
            else result.warnings.push(`color.${name}: not a valid token name - dropped from the semantic token list`);
        });
        extra.sort();
        result.semanticTokens = DTCG_COLOR_ROLES.map(name => ({ kind: 'color', name })).concat(extra.map(name => ({ kind: 'color', name })));
    }

    // font.family.* -> font-sans|serif|mono in both modes
    dtcgLeaves(global.font && global.font.family, '').forEach(([key, tok]) => {
        if (!DTCG_FONT_KEYS.includes(key) || typeof tok.$value !== 'string') return;
        result.vars.light[`font-${key}`] = tok.$value;
        result.vars.dark[`font-${key}`] = tok.$value;
    });

    // type.<set> composite -> the five type-<set>-* vars in both modes
    const remOf = (raw, kind, prefix) => {
        if (typeof raw !== 'string') return null;
        const ref = dtcgRefOf(raw);
        if (ref) {
            if (!ref.startsWith(`${prefix}.`)) return null;
            const entry = findScaleEntry(source, kind, ref.slice(prefix.length + 1));
            return entry && entry.rem !== null && entry.rem !== undefined ? `${entry.rem}rem` : null;
        }
        const px = raw.match(/^(-?[\d.]+)px$/);
        if (px) return dtcgPxToRem(parseFloat(px[1]));
        if (/^(-?[\d.]+)rem$/.test(raw)) return raw;
        return null;
    };
    dtcgLeaves(global.type, '').forEach(([set, tok]) => {
        const v = tok.$value;
        if (!v || typeof v !== 'object') return;
        const out = {};
        const familyRef = dtcgRefOf(v.fontFamily);
        if (familyRef && familyRef.startsWith('font.family.')) out.family = `var(--font-${familyRef.slice('font.family.'.length)})`;
        else if (typeof v.fontFamily === 'string' && v.fontFamily) out.family = v.fontFamily;
        if (v.fontWeight !== undefined) out.weight = String(v.fontWeight);
        const size = remOf(v.fontSize, 'typeSize', 'font.size');
        if (size) out.size = size;
        const leading = remOf(v.lineHeight, 'typeLeading', 'font.lineHeight');
        if (leading) out.leading = leading;
        out.tracking = v.letterSpacing !== undefined ? String(v.letterSpacing) : '0em';
        Object.keys(out).forEach(prop => {
            result.vars.light[`type-${set}-${prop}`] = out[prop];
            result.vars.dark[`type-${set}-${prop}`] = out[prop];
        });
    });

    // component.* -> components[id] = ref, undoing the "-<state>" leaf rule.
    // A ref naming a non-color semantic token round-trips through the exact
    // string after "semantic." (buildTokensJson's `{semantic.<ref>}`) - that
    // remainder already IS the in-app ref (e.g. "space.card-padding"), same
    // grammar parseRef expects, so no separate kind/name lookup is needed.
    if (componentName) {
        dtcgLeaves(obj[componentName].component, '').forEach(([path, tok]) => {
            let ref = dtcgRefOf(tok.$value);
            if (!ref) return;
            if (ref.startsWith('semantic.')) ref = ref.slice('semantic.'.length);
            if (!parseRef(ref)) return;
            const segments = path.split('.');
            const m = segments[segments.length - 1].match(/^(.+)-(hover|focus|active|disabled)$/);
            if (m) { segments[segments.length - 1] = m[1]; segments.push(m[2]); }
            result.components[segments.join('.')] = ref;
        });
    }

    return result;
}
