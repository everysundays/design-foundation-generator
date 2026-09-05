// tailwind.js - Tailwind v4 theme.css export for Theme Editor v2.
//
// Builds a single self-contained stylesheet a Tailwind v4 project can
// @import right after "tailwindcss" itself: `@custom-variant dark` +
// `:root`/`.dark` carrying every semantic color role (and the palette swatches
// they link to) + an `@theme inline` block that turns this system's own
// foundation scales into Tailwind utilities (spacing, radius, shadow, font
// sizes/leadings, font families). Border width/style have no v4 "@theme"
// namespace, so they stay plain :root custom properties.
//
// Naming rule: every @theme name comes from the ACTIVE foundation's own scale
// step name (foundation.js scaleEntries - never a tokens.json key, so a
// rename in dtcg.js's DTCG_SCALE_GROUP_PATH never touches this file), with
// its source group stripped the same way foundation.js's own prefixedVar
// does (Atlassian's "space.100" -> "100", "radius.large" -> "large",
// "elevation.shadow.raised" -> "raised"). Where prefixedVar/refToVar would
// turn a leftover "." into "-" (cssIdent), twKey turns it into "_" instead:
// Tailwind v4's own key resolver (#resolveKey in tailwindcss/src/theme.ts)
// looks up an escaped-dot custom property first, then falls back to the
// underscore spelling - so "space.0.5" must come out as "--spacing-0_5", not
// "--spacing-0-5" (refToVar's spelling, which v4 does not resolve for p-0.5).
//
// This module carries no state and touches nothing but its ctx argument -
// see exportCtx() in scripts.js for the {name, source, vars, links,
// components, typeSets, semanticTokens?} shape it expects. It never resolves
// a non-color token to var(--space-6): that variable is not defined in this
// file (DTCG's global.space.* scale lives in tokens.json, not here), so
// every semantic space/radius/shadow token is inlined as the literal length
// its ref resolves to instead.

// Kinds that have a Tailwind v4 "@theme" namespace, and the CSS custom
// property prefix each one maps to. borderWidth/borderStyle/palette/color/
// fontFamily/type are deliberately absent - they are plain vars (border) or
// handled by their own dedicated block (palette/color/fontFamily) below.
const TW_THEME_NAMESPACE = { space: 'spacing', radius: 'radius', shadow: 'shadow', typeSize: 'text', typeLeading: 'leading' };

// Extra source-name groups to strip beyond foundation.js's own KIND_PREFIX
// (mirrors refToVar's shadow special-case: Atlassian's shadow steps are
// named "elevation.shadow.<x>", not "shadow.<x>").
const TW_EXTRA_GROUPS = { shadow: ['elevation.shadow'] };

// Semantic (non-color) token kinds this export understands today - see the
// card's DoD: a later semantic space/radius/shadow token needs no change
// here because it is read from ctx.semanticTokens generically below.
const TW_SEMANTIC_KINDS = ['space', 'radius', 'shadow'];

function twGroupsFor(kind) {
    const base = KIND_PREFIX[kind];
    return base ? [base, ...(TW_EXTRA_GROUPS[kind] || [])] : (TW_EXTRA_GROUPS[kind] || []);
}

// Like foundation.js's prefixedVar, but for Tailwind v4 @theme keys: strips
// a leading source group (dotted, e.g. "font.size") the same way, then turns
// "." into "_" (not "-") and anything else unsafe into "-". "0.5" -> "0_5",
// "space.100" -> "100", "elevation.shadow.raised" -> "raised".
function twKey(name, groups) {
    let id = String(name).toLowerCase();
    (groups || []).some(g => {
        const gl = String(g).toLowerCase();
        if (id === gl) { id = 'default'; return true; }
        if (id.startsWith(`${gl}.`)) { id = id.slice(gl.length + 1); return true; }
        return false;
    });
    return id.replace(/\./g, '_').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

// The @theme custom property a foundation ref resolves to, or null for a
// kind with no v4 namespace (border width/style, palette, color, fontFamily,
// type). Exposed standalone so a semantic-token card can sanity-check a
// target ref the same way this module does.
function twThemeVar(ref) {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    const ns = TW_THEME_NAMESPACE[parsed.kind];
    if (!ns) return null;
    return `--${ns}-${twKey(parsed.name, twGroupsFor(parsed.kind))}`;
}

// Resolved hex for a palette name in `source`: the source's own swatch, else
// one of the three DTCG specials (white/black/transparent), else null (the
// name isn't in this source at all - the caller falls back to a literal).
function twPaletteHex(source, name) {
    const special = DTCG_PALETTE_SPECIALS.find(([n]) => n === name);
    if (special) return special[1];
    const entry = paletteEntryByName(source, name);
    return entry ? entry.hex : null;
}

// A semantic color's link, resolved to a { name, hex } this file can declare
// a --palette-<name> for - or null when the link is missing, points at
// another source (a cross-Foundation link, kept as a literal instead, same
// as buildTokensJson/cssVarBlockFor), or names a swatch this source doesn't
// have.
function twLinkedPalette(source, link) {
    if (!link || link.source !== source) return null;
    const hex = twPaletteHex(source, link.name);
    return hex ? { name: link.name, hex } : null;
}

function twHeaderComment(name, label) {
    return [
        `/* ${name || 'Untitled'} - Tailwind v4 theme (${label} scales)`,
        ' *',
        ' * Add this file to your build right after Tailwind\'s own entry point',
        ' * so @theme inline below can see the utilities it feeds.',
        ' *',
        ' * Naming: every name below is this system\'s OWN foundation step name',
        ' * (never a tokens.json key), with its source group stripped the way',
        ' * this editor\'s own --var spellings are, and "." turned into "_" -',
        ' * Tailwind v4 looks up the literal-dot custom property first, then',
        ' * falls back to the underscore spelling, so a step named "0.5" is',
        ' * written here as "0_5" (e.g. --spacing-0_5).',
        ' *',
        ' * "--spacing: initial;" comes first so only the steps this system',
        ' * defines produce spacing utilities (p-*, m-*, gap-*, ...) - Tailwind\'s',
        ' * own bare-number spacing scale is turned off on purpose.',
        ' *',
        ' * Fonts are literal font stacks inside @theme inline, not var(...):',
        ' * this system\'s own "--font-sans" var IS the v4 "--font-sans" @theme',
        ' * key, so a var() here would resolve to itself. Fonts do not vary by',
        ' * mode, so writing them once loses nothing.',
        ' *',
        ' * This file carries only foundation, palette and semantic vars - no',
        ' * component-part tokens, and it never pulls in a font stylesheet',
        ' * (see design-system.css).',
        ' */'
    ].join('\n');
}

// ctx: { name, source, vars: {light, dark}, links: {light, dark}, semanticTokens? }
// (see exportCtx() in scripts.js). semanticTokens is [{ kind, name, ref, builtin? }];
// until a semantic-token card lands there are none, so that section of
// @theme inline is simply empty and the 33 DTCG_COLOR_ROLES stand in for the
// (not yet built) semantic color-token list.
function buildTailwindCss(ctx) {
    ctx = ctx || {};
    const source = FOUNDATION[ctx.source] ? ctx.source : 'tailwind';
    const label = foundationOf(source).label;
    const vars = { light: (ctx.vars && ctx.vars.light) || {}, dark: (ctx.vars && ctx.vars.dark) || {} };
    const links = { light: (ctx.links && ctx.links.light) || {}, dark: (ctx.links && ctx.links.dark) || {} };
    const semanticTokens = Array.isArray(ctx.semanticTokens) ? ctx.semanticTokens : [];
    const colorTokens = semanticTokens.filter(t => t && t.kind === 'color' && t.name);
    const roles = colorTokens.length ? colorTokens.map(t => t.name) : DTCG_COLOR_ROLES.slice();

    // Palette vars: only names a light OR dark link actually points at (DoD
    // line 6), declared once in :root - .dark's var(--palette-x) resolves
    // through the cascade without redeclaring it.
    const paletteNames = new Set();
    ['light', 'dark'].forEach(mode => {
        roles.forEach(role => {
            const linked = twLinkedPalette(source, links[mode][role]);
            if (linked) paletteNames.add(linked.name);
        });
    });

    const rootLines = Array.from(paletteNames).sort()
        .map(name => `  ${refToVar(`palette.${name}`)}: ${twPaletteHex(source, name)};`);
    roles.forEach(role => {
        const raw = vars.light[role];
        if (raw === undefined || raw === null) return;
        const linked = twLinkedPalette(source, links.light[role]);
        rootLines.push(`  --${role}: ${linked ? `var(${refToVar(`palette.${linked.name}`)})` : raw};`);
    });
    scaleEntries(source, 'borderWidth').forEach(e => rootLines.push(`  ${refToVar(scaleRef('borderWidth', e.name))}: ${e.value};`));
    scaleEntries(source, 'borderStyle').forEach(e => rootLines.push(`  ${refToVar(scaleRef('borderStyle', e.name))}: ${e.value};`));

    const darkLines = [];
    roles.forEach(role => {
        const raw = vars.dark[role];
        if (raw === undefined || raw === null) return;
        const linked = twLinkedPalette(source, links.dark[role]);
        darkLines.push(`  --${role}: ${linked ? `var(${refToVar(`palette.${linked.name}`)})` : raw};`);
    });

    const themeLines = [];
    // Only alias a role that will actually be declared somewhere in :root/
    // .dark - a role absent from both modes would otherwise leave this
    // var(--role) dangling (DoD: no var() this file doesn't define itself).
    roles.forEach(role => {
        if (vars.light[role] === undefined && vars.dark[role] === undefined) return;
        themeLines.push(`  --color-${role}: var(--${role});`);
    });

    themeLines.push('  --spacing: initial;');
    scaleEntries(source, 'space').forEach(e => themeLines.push(`  ${twThemeVar(scaleRef('space', e.name))}: ${e.value};`));
    scaleEntries(source, 'radius').forEach(e => themeLines.push(`  ${twThemeVar(scaleRef('radius', e.name))}: ${e.value};`));
    scaleEntries(source, 'shadow').forEach(e => themeLines.push(`  ${twThemeVar(scaleRef('shadow', e.name))}: ${e.value};`));

    ['sans', 'serif', 'mono'].forEach(key => {
        const value = vars.light[`font-${key}`];
        if (typeof value === 'string' && value) themeLines.push(`  --font-${key}: ${value};`);
    });

    // --text-<size> pairs with --text-<size>--line-height only when the
    // active source itself pairs that size with a leading (typeSizeLeading
    // is index-aligned over the BUILT-IN steps only); a custom size carries
    // its own pairing only if the entry says so explicitly.
    const builtinTypeSizeCount = foundationOf(source).typeSize.length;
    const typeSizeLeadingArr = foundationOf(source).typeSizeLeading || [];
    scaleEntries(source, 'typeSize').forEach((entry, i) => {
        const varName = twThemeVar(scaleRef('typeSize', entry.name));
        themeLines.push(`  ${varName}: ${entry.value};`);
        const leadingRem = i < builtinTypeSizeCount ? typeSizeLeadingArr[i] : (typeof entry.leading === 'number' ? entry.leading : undefined);
        if (leadingRem !== undefined) themeLines.push(`  ${varName}--line-height: ${leadingRem}rem;`);
    });
    scaleEntries(source, 'typeLeading').forEach(e => themeLines.push(`  ${twThemeVar(scaleRef('typeLeading', e.name))}: ${e.value};`));

    // Semantic space/radius/shadow tokens (colour already covered by `roles`
    // above): a LITERAL length resolved through the target step, never a
    // var() - --space-<step> is not a variable this file defines.
    semanticTokens.forEach(t => {
        if (!t || !TW_SEMANTIC_KINDS.includes(t.kind) || !t.name) return;
        const target = parseRef(t.ref);
        if (!target || target.kind !== t.kind) return;
        const entry = findScaleEntry(source, t.kind, target.name);
        if (!entry) return;
        const varName = twThemeVar(`${KIND_PREFIX[t.kind]}.${t.name}`);
        if (!varName) return;
        themeLines.push(`  ${varName}: ${entry.value}; /* ${t.ref} */`);
    });

    return `${twHeaderComment(ctx.name, label)}

@custom-variant dark (&:is(.dark *));

:root {
${rootLines.join('\n')}
}

.dark {
${darkLines.join('\n')}
}

@theme inline {
${themeLines.join('\n')}
}
`;
}
