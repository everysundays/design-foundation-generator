// Foundation scales - "the values available in the system". One entry per
// design-system source (Tailwind v4 / Atlassian); every other layer (semantic
// colors, type sets, component-part tokens) may only reference an entry that
// exists here. Nothing in the preview is allowed to carry a raw value that
// doesn't resolve through one of these scales.
//
// Every scale is a list of { name, value, px } where `name` is the source's
// OWN token name (Tailwind's "4" / "lg", Atlassian's "space.100" /
// "radius.large"), `value` is the CSS the preview renders, and `px` the
// resolved measurement shown beside the name (null for non-lengths).
//
// A reference ("ref") is a dotted string naming one entry of one scale:
//   palette.neutral-200   color.primary       space.4       radius.lg
//   border.width.1        border.style.solid  shadow.sm     type.body
//   font.size.base        font.lineHeight.6   font.family.sans
// refToVar/refToCss turn a ref into the CSS custom property the preview
// emits for it (see scripts.js cssVarBlockFor).

const SHADOW_COLOR_VAR = 'var(--shadow-color, #000000)';

// A shadow step is a list of layers [x, y, blur, spread, alpha] (px, px, px,
// px, 0-1). The color comes from the semantic --shadow-color so a shadow is
// still a foundation shape + a palette-linked color, never a literal rgba.
function shadowLayersToCss(layers) {
    if (!layers.length) return 'none';
    return layers.map(([x, y, blur, spread, alpha]) =>
        `${x}px ${y}px ${blur}px ${spread}px rgb(from ${SHADOW_COLOR_VAR} r g b / ${alpha})`
    ).join(', ');
}

function remEntry(name, rem) {
    return { name, value: `${rem}rem`, rem, px: Math.round(rem * 16 * 100) / 100 };
}
function pxEntry(name, px) {
    return { name, value: `${px}px`, rem: px / 16, px };
}

const TAILWIND_SPACE_STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24];
const ATLASSIAN_SPACE = [['space.0', 0], ['space.025', 2], ['space.050', 4], ['space.075', 6], ['space.100', 8], ['space.150', 12], ['space.200', 16], ['space.250', 20], ['space.300', 24], ['space.400', 32], ['space.500', 40], ['space.600', 48], ['space.800', 64], ['space.1000', 80]];

const FOUNDATION = {
    tailwind: {
        key: 'tailwind',
        label: 'Tailwind v4',
        unitNote: 'Tailwind unit = 4px (0.25rem)',
        color: {
            families: () => TAILWIND_PALETTE_FAMILIES,
            rows: () => TAILWIND_PALETTE_ROWS,
            names: () => TAILWIND_PALETTE_NAMES,
            shades: () => TAILWIND_PALETTE_SHADES
        },
        space: TAILWIND_SPACE_STEPS.map(n => remEntry(String(n), n * 0.25)),
        radius: [
            remEntry('none', 0), remEntry('xs', 0.125), remEntry('sm', 0.25), remEntry('md', 0.375), remEntry('lg', 0.5),
            remEntry('xl', 0.75), remEntry('2xl', 1), remEntry('3xl', 1.5), remEntry('4xl', 2),
            { name: 'full', value: '9999px', rem: null, px: null }
        ],
        borderWidth: [pxEntry('0', 0), pxEntry('1', 1), pxEntry('2', 2), pxEntry('4', 4), pxEntry('8', 8)],
        borderStyle: [
            { name: 'solid', value: 'solid', px: null }, { name: 'dashed', value: 'dashed', px: null },
            { name: 'dotted', value: 'dotted', px: null }, { name: 'none', value: 'none', px: null }
        ],
        shadow: [
            { name: 'none', layers: [] },
            { name: '2xs', layers: [[0, 1, 0, 0, 0.05]] },
            { name: 'xs', layers: [[0, 1, 2, 0, 0.05]] },
            { name: 'sm', layers: [[0, 1, 3, 0, 0.1], [0, 1, 2, -1, 0.1]] },
            { name: 'md', layers: [[0, 4, 6, -1, 0.1], [0, 2, 4, -2, 0.1]] },
            { name: 'lg', layers: [[0, 10, 15, -3, 0.1], [0, 4, 6, -4, 0.1]] },
            { name: 'xl', layers: [[0, 20, 25, -5, 0.1], [0, 8, 10, -6, 0.1]] },
            { name: '2xl', layers: [[0, 25, 50, -12, 0.25]] }
        ].map(s => ({ ...s, value: shadowLayersToCss(s.layers), px: null })),
        typeSize: [['xs', 0.75], ['sm', 0.875], ['base', 1], ['lg', 1.125], ['xl', 1.25], ['2xl', 1.5], ['3xl', 1.875], ['4xl', 2.25], ['5xl', 3], ['6xl', 3.75], ['7xl', 4.5]].map(([n, r]) => remEntry(n, r)),
        // Tailwind pairs every size with a default line-height; the size
        // slider drops leading onto this pairing (index-aligned with typeSize).
        typeSizeLeading: [1, 1.25, 1.5, 1.75, 1.75, 2, 2.25, 2.5, 3, 3.75, 4.5],
        typeLeading: Array.from({ length: 18 }, (_, i) => remEntry(String(i + 3), (i + 3) * 0.25))
    },
    atlassian: {
        key: 'atlassian',
        label: 'Atlassian',
        unitNote: 'Atlassian unit = 8px (0.5rem)',
        color: {
            families: () => ATLASSIAN_PALETTE_FAMILIES,
            rows: () => ATLASSIAN_PALETTE_ROWS,
            names: () => ATLASSIAN_PALETTE_NAMES,
            shades: () => ATLASSIAN_DEFAULT_SHADES
        },
        space: ATLASSIAN_SPACE.map(([n, px]) => pxEntry(n, px)),
        radius: [
            pxEntry('radius.xsmall', 2), pxEntry('radius.small', 4), pxEntry('radius.medium', 6), pxEntry('radius.large', 8),
            pxEntry('radius.xlarge', 12), pxEntry('radius.xxlarge', 16),
            { name: 'radius.full', value: '9999px', rem: null, px: null }
        ],
        borderWidth: [pxEntry('border.width.0', 0), pxEntry('border.width', 1), pxEntry('border.width.outline', 2), pxEntry('border.width.indicator', 3)],
        borderStyle: [
            { name: 'solid', value: 'solid', px: null }, { name: 'dashed', value: 'dashed', px: null },
            { name: 'dotted', value: 'dotted', px: null }, { name: 'none', value: 'none', px: null }
        ],
        shadow: [
            { name: 'none', layers: [] },
            { name: 'elevation.shadow.raised', layers: [[0, 1, 1, 0, 0.25], [0, 0, 1, 0, 0.31]] },
            { name: 'elevation.shadow.overflow', layers: [[0, 0, 12, 0, 0.16], [0, 0, 1, 0, 0.12]] },
            { name: 'elevation.shadow.overlay', layers: [[0, 8, 12, 0, 0.15], [0, 0, 1, 0, 0.31]] }
        ].map(s => ({ ...s, value: shadowLayersToCss(s.layers), px: null })),
        typeSize: [['font.size.050', 11], ['font.size.075', 12], ['font.size.100', 14], ['font.size.200', 16], ['font.size.300', 20], ['font.size.400', 24], ['font.size.500', 28], ['font.size.600', 32], ['font.size.800', 36]].map(([n, px]) => pxEntry(n, px)),
        typeSizeLeading: [16, 16, 20, 24, 24, 28, 32, 40, 40].map(px => px / 16),
        typeLeading: [['font.lineHeight.100', 16], ['font.lineHeight.200', 20], ['font.lineHeight.300', 24], ['font.lineHeight.400', 28], ['font.lineHeight.500', 32], ['font.lineHeight.600', 40]].map(([n, px]) => pxEntry(n, px))
    }
};

// Scale key -> the kind of value it holds, for the inspector's pickers.
const SCALE_FOR_KIND = {
    space: 'space', radius: 'radius', borderWidth: 'borderWidth', borderStyle: 'borderStyle',
    shadow: 'shadow', typeSize: 'typeSize', typeLeading: 'typeLeading'
};

// Ref prefix for each scale kind (and back).
const KIND_PREFIX = {
    space: 'space', radius: 'radius', borderWidth: 'border.width', borderStyle: 'border.style',
    shadow: 'shadow', typeSize: 'font.size', typeLeading: 'font.lineHeight'
};

function foundationOf(sourceKey) {
    return FOUNDATION[sourceKey] || FOUNDATION.tailwind;
}

function scaleEntries(sourceKey, kind) {
    return foundationOf(sourceKey)[kind] || [];
}

function scaleRef(kind, name) {
    return `${KIND_PREFIX[kind]}.${name}`;
}

// Splits a ref into { kind, name }. kind is one of: palette, color, space,
// radius, borderWidth, borderStyle, shadow, type, typeSize, typeLeading,
// fontFamily. Returns null for anything that isn't a ref.
function parseRef(ref) {
    if (typeof ref !== 'string') return null;
    const m = ref.match(/^(palette|color|space|radius|border\.width|border\.style|shadow|type|font\.size|font\.lineHeight|font\.family)\.(.+)$/);
    if (!m) return null;
    const kind = { 'border.width': 'borderWidth', 'border.style': 'borderStyle', 'font.size': 'typeSize', 'font.lineHeight': 'typeLeading', 'font.family': 'fontFamily' }[m[1]] || m[1];
    return { kind, name: m[2] };
}

// Turns a token name into a CSS-identifier-safe fragment: "space.100" ->
// "space-100", "Neutral200" -> "neutral200", "0.5" -> "0-5".
function cssIdent(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Atlassian's names already carry their group ("space.200", "radius.large",
// "font.size.100"), so a naive prefix would double it (--space-space-200).
// Strip the group part when the name starts with it.
function prefixedVar(prefix, name, ...groupIdents) {
    let id = cssIdent(name);
    [prefix, ...groupIdents].forEach(g => {
        if (id === g) id = 'default';                       // Atlassian "border.width" (the 1px step)
        else if (id.startsWith(`${g}-`)) id = id.slice(g.length + 1);
    });
    return `--${prefix}-${id}`;
}

// The CSS custom property a foundation/semantic ref is emitted as. Always
// derive var names through this (never by hand-concatenating a prefix and a
// name) so every module agrees on the spelling.
function refToVar(ref) {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    const { kind, name } = parsed;
    switch (kind) {
        case 'palette': return `--palette-${cssIdent(name)}`;
        case 'color': return `--${name}`;
        case 'space': return prefixedVar('space', name);
        case 'radius': return prefixedVar('radius', name);
        case 'borderWidth': return prefixedVar('border-width', name);
        case 'borderStyle': return prefixedVar('border-style', name);
        case 'shadow': return prefixedVar('shadow', name, 'elevation-shadow');
        case 'typeSize': return prefixedVar('font-size', name);
        case 'typeLeading': return prefixedVar('font-leading', name, 'font-lineheight');
        case 'fontFamily': return `--font-${cssIdent(name)}`;
        case 'type': return `--type-${cssIdent(name)}`;
        default: return null;
    }
}

function findScaleEntry(sourceKey, kind, name) {
    return scaleEntries(sourceKey, kind).find(e => e.name === name) || null;
}

// Nearest entry of a length scale to a rem value (ties -> first). Entries
// with no rem (radius "full") never match by distance.
function nearestScaleEntry(sourceKey, kind, rem) {
    let best = null;
    let bestDist = Infinity;
    scaleEntries(sourceKey, kind).forEach(entry => {
        if (entry.rem === null || entry.rem === undefined) return;
        const dist = Math.abs(entry.rem - rem);
        if (dist < bestDist) { bestDist = dist; best = entry; }
    });
    return best;
}

// Same for the value of a ref from ANOTHER source: resolve to rem, then
// nearest in the new source. Non-length kinds (style) map by name, shadows
// by index position, so switching Tailwind<->Atlassian never leaves a
// component token pointing at a name the new scale doesn't have.
function remapRef(ref, fromSource, toSource) {
    const parsed = parseRef(ref);
    if (!parsed) return ref;
    const { kind, name } = parsed;
    if (['space', 'radius', 'borderWidth', 'typeSize', 'typeLeading'].includes(kind)) {
        const entry = findScaleEntry(fromSource, kind, name);
        if (!entry) return ref;
        if (entry.rem === null) {
            const full = scaleEntries(toSource, kind).find(e => e.rem === null);
            return full ? scaleRef(kind, full.name) : ref;
        }
        const nearest = nearestScaleEntry(toSource, kind, entry.rem);
        return nearest ? scaleRef(kind, nearest.name) : ref;
    }
    if (kind === 'shadow') {
        const from = scaleEntries(fromSource, kind);
        const to = scaleEntries(toSource, kind);
        const i = from.findIndex(e => e.name === name);
        if (i === -1) return ref;
        const j = Math.min(to.length - 1, Math.round(i / Math.max(1, from.length - 1) * (to.length - 1)));
        return scaleRef(kind, to[j].name);
    }
    return ref;
}

// Human label for an entry: "4 · 16px", "lg · 8px", "solid".
function scaleEntryLabel(entry) {
    if (!entry) return '?';
    if (entry.px === null || entry.px === undefined) return entry.name;
    return `${entry.name} · ${entry.px}px`;
}

// The stored --type-<set>-size/-leading values are rem strings; this names
// the scale entry they sit on (exact match only), else null.
function scaleEntryForRem(sourceKey, kind, rem) {
    const entry = nearestScaleEntry(sourceKey, kind, rem);
    return entry && Math.abs(entry.rem - rem) < 0.001 ? entry : null;
}

// --- Palette (color ramps) helpers ---

function paletteFamilyOfName(sourceKey, name) {
    const f = foundationOf(sourceKey).color;
    const names = f.names();
    for (let r = 0; r < names.length; r++) {
        if (names[r].includes(name)) return f.families()[r];
    }
    return null;
}

// Every swatch of one family as [{ name, hex, shade }].
function paletteFamilyEntries(sourceKey, family) {
    const f = foundationOf(sourceKey).color;
    const r = f.families().indexOf(family);
    if (r === -1) return [];
    const shades = (sourceKey === 'atlassian' && family === 'Neutral') ? ATLASSIAN_NEUTRAL_SHADES : f.shades();
    return f.rows()[r].map((hex, i) => ({ name: f.names()[r][i], hex, shade: shades[i] }));
}

function paletteEntryByName(sourceKey, name) {
    const f = foundationOf(sourceKey).color;
    const names = f.names();
    for (let r = 0; r < names.length; r++) {
        const c = names[r].indexOf(name);
        if (c !== -1) return { name, hex: f.rows()[r][c], family: f.families()[r] };
    }
    return null;
}
