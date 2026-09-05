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

// Pairs a source's typeSize entries with the leading (rem) each one defaults
// to, index-aligned with the list `entries` was built from. Stored ON each
// entry (never as a parallel array) so the pairing survives scaleEntries
// merging/sorting a user's added steps in - see pairedLeadingRem, below.
function withLeadings(entries, leadingRems) {
    return entries.map((entry, i) => ({ ...entry, leading: leadingRems[i] }));
}

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
        // Tailwind pairs every size with a default line-height (see
        // withLeadings/pairedLeadingRem) - the size slider drops leading onto
        // this pairing.
        typeSize: withLeadings(
            [['xs', 0.75], ['sm', 0.875], ['base', 1], ['lg', 1.125], ['xl', 1.25], ['2xl', 1.5], ['3xl', 1.875], ['4xl', 2.25], ['5xl', 3], ['6xl', 3.75], ['7xl', 4.5]].map(([n, r]) => remEntry(n, r)),
            [1, 1.25, 1.5, 1.75, 1.75, 2, 2.25, 2.5, 3, 3.75, 4.5]
        ),
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
        typeSize: withLeadings(
            [['font.size.050', 11], ['font.size.075', 12], ['font.size.100', 14], ['font.size.200', 16], ['font.size.300', 20], ['font.size.400', 24], ['font.size.500', 28], ['font.size.600', 32], ['font.size.800', 36]].map(([n, px]) => pxEntry(n, px)),
            [16, 16, 20, 24, 24, 28, 32, 40, 40].map(px => px / 16)
        ),
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

// --- Custom scale entries ---
// User-added values beyond what a source's fixed scale ships (Space/Radius/
// Border width/Border style/Shadow/Type size/Type leading - see panels.js
// buildScalePanelHtml's `allowAdd` and buildTypeScaleListHtml).
// Kept per-source, like FOUNDATION itself, so a system's additions don't leak
// across a Tailwind<->Atlassian switch; scripts.js repoints state.customScale
// at the active source's slot on load/switch/undo (see setCustomScaleFor).
// A typeSize entry carries a `leading` (rem) alongside name/value/rem/px -
// see withLeadings/pairedLeadingRem.
function emptyCustomScale() {
    return { space: [], radius: [], borderWidth: [], borderStyle: [], shadow: [], typeSize: [], typeLeading: [] };
}

function cloneCustomScale(customScale) {
    const src = customScale || {};
    return {
        space: [...(src.space || [])], radius: [...(src.radius || [])],
        borderWidth: [...(src.borderWidth || [])], borderStyle: [...(src.borderStyle || [])],
        shadow: [...(src.shadow || [])],
        // Missing on a system saved before this card shipped - default to [],
        // never dropping the rest of an older customScale (see systems.js
        // normalizeSystem, which will own this default once it lands).
        typeSize: [...(src.typeSize || [])], typeLeading: [...(src.typeLeading || [])]
    };
}

const CUSTOM_SCALE = { tailwind: emptyCustomScale(), atlassian: emptyCustomScale() };

// Points CUSTOM_SCALE[sourceKey] at a specific object (on load / undo-restore)
// rather than mutating in place, so a reference held elsewhere (e.g. a
// just-taken snapshot) never sees a later push.
function setCustomScaleFor(sourceKey, customScale) {
    CUSTOM_SCALE[sourceKey] = customScale || emptyCustomScale();
    return CUSTOM_SCALE[sourceKey];
}

// Get-or-create: what addCustomScaleEntry pushes into and state.customScale
// points at while `sourceKey` is the active source.
function customScaleFor(sourceKey) {
    if (!CUSTOM_SCALE[sourceKey]) CUSTOM_SCALE[sourceKey] = emptyCustomScale();
    return CUSTOM_SCALE[sourceKey];
}

// --- Removed (deleted) built-in scale steps ---
// A SIBLING of CUSTOM_SCALE, never a field inside it - customScale's shape is
// "every key holds an array of entry objects" (dtcg.js's import walks it that
// way), which a `removed` map of plain names would break. Holds, per source,
// the built-in step NAMES a user has deleted (see scripts.js deleteScaleEntry
// / panels.js panelEntryHtml's delete control). scaleEntries filters these
// out of the BASE list only - a custom entry of the same name still shows
// (re-adding a deleted built-in), and baseScaleEntry/remapRef's from-side
// deliberately ignore this map so a seeded ref naming a since-deleted step
// still resolves by its original value.
function emptyRemovedScale() {
    return { space: [], radius: [], borderWidth: [], borderStyle: [], shadow: [], typeSize: [], typeLeading: [] };
}

function cloneRemovedScale(removedScale) {
    const src = removedScale || {};
    return {
        space: [...(src.space || [])], radius: [...(src.radius || [])],
        borderWidth: [...(src.borderWidth || [])], borderStyle: [...(src.borderStyle || [])],
        shadow: [...(src.shadow || [])],
        // Missing on a system saved before this card shipped (or on a
        // tokens.json import, which never carries deletions at all) -
        // default to [], same convention as cloneCustomScale.
        typeSize: [...(src.typeSize || [])], typeLeading: [...(src.typeLeading || [])]
    };
}

const REMOVED_SCALE = { tailwind: emptyRemovedScale(), atlassian: emptyRemovedScale() };

// Points REMOVED_SCALE[sourceKey] at a specific object (on load / undo-
// restore), like setCustomScaleFor.
function setRemovedScaleFor(sourceKey, removedScale) {
    REMOVED_SCALE[sourceKey] = removedScale || emptyRemovedScale();
    return REMOVED_SCALE[sourceKey];
}

// Get-or-create: what scripts.js's Foundation-switch handler points
// state.removedScale at while `sourceKey` is the active source.
function removedScaleFor(sourceKey) {
    if (!REMOVED_SCALE[sourceKey]) REMOVED_SCALE[sourceKey] = emptyRemovedScale();
    return REMOVED_SCALE[sourceKey];
}

// Type size/leading are the one pair of scales a user reasons about by rem
// order (a slider walks them low-to-high), so an added step has to land
// between its neighbours rather than trailing the built-ins like every other
// scale's add-row does.
const SORTED_KINDS = new Set(['typeSize', 'typeLeading']);

function scaleEntries(sourceKey, kind) {
    const removedNames = (REMOVED_SCALE[sourceKey] && REMOVED_SCALE[sourceKey][kind]) || [];
    const wholeBase = foundationOf(sourceKey)[kind] || [];
    const base = removedNames.length ? wholeBase.filter(e => !removedNames.includes(e.name)) : wholeBase;
    const custom = (CUSTOM_SCALE[sourceKey] && CUSTOM_SCALE[sourceKey][kind]) || [];
    if (!custom.length) return base;
    if (!SORTED_KINDS.has(kind)) return [...base, ...custom];
    const remOf = (e) => (e.rem === null || e.rem === undefined ? Infinity : e.rem);
    return [...base, ...custom].sort((a, b) => remOf(a) - remOf(b));
}

// Unfiltered FOUNDATION lookup - ignores removedScale (and customScale), so a
// seeded ref that names a step the user has since deleted (SEED_SPEC
// hard-codes Tailwind names like "space.4"/"radius.sm"/"shadow.xs") still
// resolves to its original value. Only ever a fallback: scaleEntries/
// findScaleEntry (the live, filtered-and-merged view) are tried first.
function baseScaleEntry(sourceKey, kind, name) {
    return (foundationOf(sourceKey)[kind] || []).find(e => e.name === name) || null;
}

// Deletes a step from `sourceKey`'s `kind` scale. A custom entry the user
// added is spliced out entirely; a built-in step is hidden by recording its
// name in removedScale - its FOUNDATION data never changes, so a custom
// step re-added under the same name (or a tokens.json import) can always
// find it via baseScaleEntry. Pure state mutation with no usage check - see
// scripts.js deleteScaleEntry for the in-use refusal built on top. Returns
// true when something changed, false for a name that isn't a real step at
// all (nothing for the caller to undo).
function removeScaleEntry(sourceKey, kind, name) {
    const custom = customScaleFor(sourceKey)[kind];
    const ci = custom.findIndex(e => e.name === name);
    if (ci !== -1) { custom.splice(ci, 1); return true; }
    const removed = removedScaleFor(sourceKey)[kind];
    if (removed.includes(name)) return false;
    if (!baseScaleEntry(sourceKey, kind, name)) return false;
    removed.push(name);
    return true;
}

// Same as scaleEntries, but never filters `keepName` out of the base list
// even when it's recorded in removedScale - reconstructs "the scale as if
// `keepName` were still present" whether it actually still is or was just
// removed. Lets nearestRemainingScaleEntry (below) work identically no
// matter when it runs relative to the removal itself - the DELETE-AN-
// IN-USE-STEP flow computes the retarget target BEFORE removeScaleEntry
// runs (name still present), while a node test may call it AFTER
// (idempotence) - both must agree. A deliberate near-duplicate of
// scaleEntries rather than a shared refactor, so this card's diff stays
// additive against the already-landed, already-tested function.
function scaleEntriesKeeping(sourceKey, kind, keepName) {
    const removedNames = (REMOVED_SCALE[sourceKey] && REMOVED_SCALE[sourceKey][kind]) || [];
    const wholeBase = foundationOf(sourceKey)[kind] || [];
    const base = wholeBase.filter(e => e.name === keepName || !removedNames.includes(e.name));
    const custom = (CUSTOM_SCALE[sourceKey] && CUSTOM_SCALE[sourceKey][kind]) || [];
    if (!custom.length) return base;
    if (!SORTED_KINDS.has(kind)) return [...base, ...custom];
    const remOf = (e) => (e.rem === null || e.rem === undefined ? Infinity : e.rem);
    return [...base, ...custom].sort((a, b) => remOf(a) - remOf(b));
}

// The step nearest `name` (source `sourceKey`, scale `kind`) among the OTHER
// remaining entries - what deleting an IN-USE step retargets its
// component-part tokens to (see scripts.js deleteScaleStepInUse and
// components.js retargetRemovedRefs, which calls this). Per-kind rule:
//   - a length (rem) step: nearest by |rem diff| among the remaining rem
//     candidates, ties -> first in list order (nearestScaleEntry's own
//     rule); `name` itself has no rem (radius "full") -> the LARGEST
//     remaining rem entry; no remaining candidate has a rem either (every
//     other step left is itself rem-null) -> the first rem-null entry.
//   - shadow (ordered by position, nothing to measure a length against):
//     the candidate at the previous index of the full list, else the next
//     one (index 0) - a same-source cousin of remapRef's cross-source
//     index-position rule.
//   - borderStyle (no length, no meaningful order): "solid" if it remains,
//     else the first remaining entry.
// Returns null only when `name` is the scale's last entry - deleting it
// would leave nothing to move to, and the caller must refuse outright
// rather than delete into an empty scale.
function nearestRemainingScaleEntry(sourceKey, kind, name) {
    const full = scaleEntriesKeeping(sourceKey, kind, name);
    const candidates = full.filter(e => e.name !== name);
    if (!candidates.length) return null;
    if (kind === 'borderStyle') return candidates.find(e => e.name === 'solid') || candidates[0];
    if (kind === 'shadow') {
        const i = full.findIndex(e => e.name === name);
        const prev = i - 1;
        return prev >= 0 ? candidates[prev] : candidates[0];
    }
    const removed = full.find(e => e.name === name);
    const rem = removed && Number.isFinite(removed.rem) ? removed.rem : null;
    const withRem = candidates.filter(e => Number.isFinite(e.rem));
    if (rem === null) {
        return withRem.length ? withRem.reduce((best, e) => (e.rem > best.rem ? e : best)) : candidates[0];
    }
    if (!withRem.length) return candidates.find(e => e.rem === null) || candidates[0];
    return withRem.reduce((best, e) => (Math.abs(e.rem - rem) < Math.abs(best.rem - rem) ? e : best));
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
        // findScaleEntry first (the live, filtered-and-merged view - honours a
        // custom step that re-added this name with a new value); baseScaleEntry
        // as a fallback so a from-side step the user has since deleted (a
        // dangling SEED_SPEC ref, e.g. "space.4") still remaps by its
        // original value instead of passing the ref through unchanged.
        const entry = findScaleEntry(fromSource, kind, name) || baseScaleEntry(fromSource, kind, name);
        if (!entry) return ref;
        if (entry.rem === null) {
            const full = scaleEntries(toSource, kind).find(e => e.rem === null);
            return full ? scaleRef(kind, full.name) : ref;
        }
        const nearest = nearestScaleEntry(toSource, kind, entry.rem);
        return nearest ? scaleRef(kind, nearest.name) : ref;
    }
    if (kind === 'shadow') {
        const to = scaleEntries(toSource, kind);
        if (!to.length) return ref;
        const from = scaleEntries(fromSource, kind);
        let i = from.findIndex(e => e.name === name);
        let total = from.length;
        if (i === -1) {
            // Same from-side fallback as above, by index instead of rem
            // (shadow has no length to snap to): the step's position in the
            // UNFILTERED base list stands in for its position in the live one.
            const base = foundationOf(fromSource)[kind] || [];
            i = base.findIndex(e => e.name === name);
            if (i === -1) return ref;
            total = base.length;
        }
        const j = Math.min(to.length - 1, Math.round(i / Math.max(1, total - 1) * (to.length - 1)));
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

// The leading (rem) a Type size entry pairs with - what the size slider drops
// onto the leading slider, and what a blank leading box on the add-row
// defaults to. `sizeEntry.leading` when it's already set (every built-in
// carries one via withLeadings, and addCustomScaleEntry sets one on every
// step it adds); otherwise the leading of the nearest OTHER size step that
// has one. Either way the result is snapped onto a real Type leading step
// (nearestScaleEntry), so this never returns a blank, off-scale or NaN value
// - even for a bare entry (e.g. straight from remEntry) that isn't actually
// in the scale.
function pairedLeadingRem(sourceKey, sizeEntry) {
    let rem = sizeEntry && Number.isFinite(sizeEntry.leading) ? sizeEntry.leading : null;
    if (rem === null) {
        const ownRem = sizeEntry && Number.isFinite(sizeEntry.rem) ? sizeEntry.rem : 0;
        const nearest = scaleEntries(sourceKey, 'typeSize')
            .filter(e => Number.isFinite(e.leading))
            .reduce((best, e) => (best === null || Math.abs(e.rem - ownRem) < Math.abs(best.rem - ownRem)) ? e : best, null);
        rem = nearest ? nearest.leading : ownRem;
    }
    const snapped = nearestScaleEntry(sourceKey, 'typeLeading', rem);
    return snapped ? snapped.rem : rem;
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
