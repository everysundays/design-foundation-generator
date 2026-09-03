// Theme Editor - a local clone of tweakcn.com/editor/theme's core experience:
// a color/typography/other sidebar editing a shadcn/ui-style CSS variable set,
// with a live preview that is the ONLY thing that reflects the active theme.
//
// Preview isolation is structural: the preview is a real <iframe>, a separate
// document from this page. The sidebar/toolbar chrome is styled entirely by
// styles.css and never touches the theme's CSS variables - editing a color
// cannot visibly affect anything outside the iframe, by construction.

const STORAGE_KEY = 'themeEditor.savedThemes';

// Shadcn's own zinc/neutral default (matches tweakcn's un-set starting theme).
const DEFAULT_THEME = {
    name: 'default',
    title: 'Default',
    cssVars: {
        theme: {
            radius: '0.625rem',
            'font-sans': 'Inter, sans-serif',
            'font-serif': 'ui-serif, serif',
            'font-mono': 'ui-monospace, monospace',
            'tracking-normal': '0em'
        },
        light: {
            background: '#ffffff', foreground: 'oklch(0.205 0 0)',
            card: '#ffffff', 'card-foreground': 'oklch(0.205 0 0)',
            popover: '#ffffff', 'popover-foreground': 'oklch(0.205 0 0)',
            primary: 'oklch(0.205 0 0)', 'primary-foreground': 'oklch(0.985 0 0)',
            secondary: 'oklch(0.97 0 0)', 'secondary-foreground': 'oklch(0.205 0 0)',
            muted: 'oklch(0.97 0 0)', 'muted-foreground': 'oklch(0.556 0 0)',
            accent: 'oklch(0.97 0 0)', 'accent-foreground': 'oklch(0.205 0 0)',
            destructive: 'oklch(0.577 0.245 27.325)', 'destructive-foreground': 'oklch(0.985 0 0)',
            border: 'oklch(0.922 0 0)', input: 'oklch(0.922 0 0)', ring: 'oklch(0.708 0 0)',
            'chart-1': 'oklch(0.646 0.222 41.116)', 'chart-2': 'oklch(0.6 0.118 184.704)',
            'chart-3': 'oklch(0.398 0.07 227.392)', 'chart-4': 'oklch(0.828 0.189 84.429)',
            'chart-5': 'oklch(0.769 0.188 70.08)',
            sidebar: 'oklch(0.985 0 0)', 'sidebar-foreground': 'oklch(0.205 0 0)',
            'sidebar-primary': 'oklch(0.205 0 0)', 'sidebar-primary-foreground': 'oklch(0.985 0 0)',
            'sidebar-accent': 'oklch(0.97 0 0)', 'sidebar-accent-foreground': 'oklch(0.205 0 0)',
            'sidebar-border': 'oklch(0.922 0 0)', 'sidebar-ring': 'oklch(0.708 0 0)'
        },
        dark: {
            background: 'oklch(0.145 0 0)', foreground: 'oklch(0.985 0 0)',
            card: 'oklch(0.205 0 0)', 'card-foreground': 'oklch(0.985 0 0)',
            popover: 'oklch(0.205 0 0)', 'popover-foreground': 'oklch(0.985 0 0)',
            primary: 'oklch(0.922 0 0)', 'primary-foreground': 'oklch(0.205 0 0)',
            secondary: 'oklch(0.269 0 0)', 'secondary-foreground': 'oklch(0.985 0 0)',
            muted: 'oklch(0.269 0 0)', 'muted-foreground': 'oklch(0.708 0 0)',
            accent: 'oklch(0.269 0 0)', 'accent-foreground': 'oklch(0.985 0 0)',
            destructive: 'oklch(0.704 0.191 22.216)', 'destructive-foreground': 'oklch(0.985 0 0)',
            border: 'oklch(1 0 0 / 10%)', input: 'oklch(1 0 0 / 15%)', ring: 'oklch(0.556 0 0)',
            'chart-1': 'oklch(0.488 0.243 264.376)', 'chart-2': 'oklch(0.696 0.17 162.48)',
            'chart-3': 'oklch(0.769 0.188 70.08)', 'chart-4': 'oklch(0.627 0.265 303.9)',
            'chart-5': 'oklch(0.645 0.246 16.439)',
            sidebar: 'oklch(0.205 0 0)', 'sidebar-foreground': 'oklch(0.985 0 0)',
            'sidebar-primary': 'oklch(0.488 0.243 264.376)', 'sidebar-primary-foreground': 'oklch(0.985 0 0)',
            'sidebar-accent': 'oklch(0.269 0 0)', 'sidebar-accent-foreground': 'oklch(0.985 0 0)',
            'sidebar-border': 'oklch(1 0 0 / 10%)', 'sidebar-ring': 'oklch(0.556 0 0)'
        }
    }
};

// Signal colors (brand/state meaning) - shown as foldable groups in the
// Colors tab.
const COLOR_GROUPS = [
    { key: 'primary', label: 'Primary', open: true, fields: [['primary', 'Background'], ['primary-foreground', 'Foreground']] },
    { key: 'secondary', label: 'Secondary', open: true, fields: [['secondary', 'Background'], ['secondary-foreground', 'Foreground']] },
    { key: 'accent', label: 'Accent', fields: [['accent', 'Background'], ['accent-foreground', 'Foreground']] },
    { key: 'base', label: 'Base', fields: [['background', 'Background'], ['foreground', 'Foreground']] },
    { key: 'muted', label: 'Muted', fields: [['muted', 'Background'], ['muted-foreground', 'Foreground']] },
    { key: 'destructive', label: 'Destructive', fields: [['destructive', 'Background'], ['destructive-foreground', 'Foreground']] },
    { key: 'chart', label: 'Chart', fields: [['chart-1', 'Chart 1'], ['chart-2', 'Chart 2'], ['chart-3', 'Chart 3'], ['chart-4', 'Chart 4'], ['chart-5', 'Chart 5']] }
];

const SWATCH_KEYS = ['primary', 'secondary', 'accent', 'background'];

// --- Color parsing (reused technique from token-generator: paint on a
// canvas and read the rendered pixel back, rather than trust
// getComputedStyle's string - modern browsers echo oklch()/lab()/etc.
// back verbatim instead of normalizing to rgb(), which breaks string
// parsing but never breaks actual pixel rendering). ---
function cssColorToHex(value) {
    if (!cssColorToHex._ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        cssColorToHex._ctx = canvas.getContext('2d', { willReadFrequently: true });
    }
    const ctx = cssColorToHex._ctx;
    const sentinel = '#010203';
    ctx.fillStyle = sentinel;
    ctx.fillStyle = value;
    if (ctx.fillStyle === sentinel) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
}

// --- State ---
let allThemes = [DEFAULT_THEME, ...(typeof tweakcnThemes !== 'undefined' ? tweakcnThemes : [])];
let customThemes = {}; // name -> { light: {...}, dark: {...} }

let state = {
    themeName: 'Default',
    mode: 'light',
    vars: { light: {}, dark: {} },
    loadedVars: { light: {}, dark: {} },
    activePreview: 'overview'
};

let activePaletteSource = 'tailwind';

// The authoritative palette-token link for every color field, keyed by
// mode then CSS var key: { source, name, hex }. Different palette sources -
// and even different rows of the same source (Tailwind's zinc-50,
// neutral-50 and mauve-50 are all #fafafa) - can share an exact hex, so a
// hex value alone can't tell two different token names apart. Rather than
// re-guessing a name from the hex on every render (ambiguous whenever a
// collision like that exists, and liable to disagree with itself between
// the field's label and the popover's "current swatch" highlight), every
// palette-sourced field gets its link resolved once - immediately on pick,
// or via snapVarsToPalette() at load/import time - and that resolved
// {source, name} is treated as ground truth from then on: the var's stored
// value is snapped to the link's exact swatch hex, so "what's linked" and
// "what's applied" can never drift apart. See PALETTE_COLOR_KEYS below for
// which var keys this covers.
let tokenLinks = { light: {}, dark: {} };
// Snapshot of tokenLinks at the moment a theme was loaded - lets the
// per-field reset button restore the original link, not just the original
// hex (which alone would leave the field's label to be re-guessed).
let loadedTokenLinks = { light: {}, dark: {} };

let undoStack = [];
let redoStack = [];

// Every vendored/default theme only defines one "radius" var - Card Radius,
// Form Field Radius, and Button Radius are new, so all three start equal to
// it until tuned apart.
function withRadiusFallback(vars) {
    const base = vars.radius || '0.5rem';
    return { 'radius-card': base, 'radius-field': base, 'radius-button': base, ...vars };
}

// Same idea for spacing: themes only define one "spacing" var - Gap/Grid/
// Padding Vertical/Padding Horizontal are new, so all four start equal to
// it. Gap and Grid are each a single value (not split into -x/-y) - unlike
// padding, every gap-N usage across the templates is a plain single-axis
// flex/grid/wrap gap, so a split axis pair just meant one of the two
// sliders never visibly did anything for most layouts. See
// buildGapOverrideCss below for how Gap (flex contexts) and Grid (actual
// CSS grid contexts) end up driving different elements from the same
// gap-N/gap-x-N/gap-y-N classes.
function withSpacingFallback(vars) {
    const base = vars.spacing || '0.25rem';
    return { 'spacing-gap': base, 'spacing-grid': base, 'spacing-padding-y': base, 'spacing-padding-x': base, ...vars };
}

// The Padding/Gap/Grid sliders pick from a fixed set of rem tokens rather
// than a free decimal - same "resolve to a known reference" idea as the
// Colors tab's palette restriction, just for the base spacing unit instead
// of a color - and, like the color palette, the token SET itself depends on
// activePaletteSource: Tailwind and Atlassian each publish their own real
// spacing scale, and the two don't line up (Tailwind's base unit is 4px/
// 0.25rem; Atlassian's is 8px/0.5rem - https://atlassian.design/foundations/
// spacing). Each slider's range input steps through indices into
// currentSpacingTokens(); nearestSpacingTokenIndex maps a loaded/imported
// rem value, or a value carried over from switching source, back onto it.
const TAILWIND_SPACING_TOKENS = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
// Tailwind's OWN name for each of the values above isn't the rem number -
// it's the multiplier that appears in the utility class itself (gap-0.5,
// p-1, ...), i.e. remValue / 0.25rem. Shown in the field instead of the
// resolved measurement, same reason the Colors tab shows "orange-600"
// instead of a raw hex - the rem number is a derived value, not the token.
const TAILWIND_SPACING_NAMES = ['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4'];
// Atlassian's own space.* tokens (space.0 through space.250) - not
// Tailwind's numbers reused, real values off their spacing scale table.
const ATLASSIAN_SPACING_TOKENS = [0, 0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.25];
const ATLASSIAN_SPACING_NAMES = ['space.0', 'space.025', 'space.050', 'space.075', 'space.100', 'space.150', 'space.200', 'space.250'];

function currentSpacingTokens() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_SPACING_TOKENS : TAILWIND_SPACING_TOKENS;
}

function currentSpacingNames() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_SPACING_NAMES : TAILWIND_SPACING_NAMES;
}

function nearestSpacingTokenIndex(remValue) {
    const tokens = currentSpacingTokens();
    let bestIndex = 0;
    let bestDist = Infinity;
    tokens.forEach((token, i) => {
        const dist = Math.abs(token - remValue);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });
    return bestIndex;
}

// Same real-token-scale idea as spacing, for the Card/Form Field/Button
// Radius sliders - Tailwind's own default borderRadius scale
// (none/sm/DEFAULT/md/lg/xl/2xl/3xl) and Atlassian's real radius.* tokens
// (https://atlassian.design/foundations/radius). "full" (Tailwind's own
// pill/circle value, and Atlassian's radius.full/radius.tile) is left out
// of both - it's a qualitatively different "fully round" case, not a step
// on the same linear scale as the rest, and doesn't make sense on a slider
// alongside them.
const TAILWIND_RADIUS_TOKENS = [0, 0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.5];
const TAILWIND_RADIUS_NAMES = ['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', '3xl'];
// Atlassian's radius.xsmall..radius.xxlarge (2/4/6/8/12/16px)
const ATLASSIAN_RADIUS_TOKENS = [0.125, 0.25, 0.375, 0.5, 0.75, 1];
const ATLASSIAN_RADIUS_NAMES = ['radius.xsmall', 'radius.small', 'radius.medium', 'radius.large', 'radius.xlarge', 'radius.xxlarge'];

function currentRadiusTokens() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_RADIUS_TOKENS : TAILWIND_RADIUS_TOKENS;
}

function currentRadiusNames() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_RADIUS_NAMES : TAILWIND_RADIUS_NAMES;
}

function nearestRadiusTokenIndex(remValue) {
    const tokens = currentRadiusTokens();
    let bestIndex = 0;
    let bestDist = Infinity;
    tokens.forEach((token, i) => {
        const dist = Math.abs(token - remValue);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });
    return bestIndex;
}

// The measurement keys the Element tab's sliders own. `radius`/`spacing`
// themselves (the single vars every vendored theme ships) are deliberately
// NOT in here: they're the untouched record of what the theme said, and
// nothing in the preview reads them - only the derived per-part keys below
// do (see withRadiusFallback/withSpacingFallback).
const RADIUS_KEYS = ['radius-card', 'radius-field', 'radius-button'];
const SPACING_KEYS = ['spacing-padding-y', 'spacing-padding-x', 'spacing-gap', 'spacing-grid'];

// A stored measurement is a CSS length string ("0.5rem", "8px", "0rem").
// parseFloat alone would read "8px" as 8rem, and `parseFloat(x) || fallback`
// would turn a legitimate 0 (Tailwind "none", Atlassian space.0) into the
// fallback - so this is the one place a stored value gets turned into a rem
// number. px is converted at 16px/rem, the root font-size the preview iframe
// runs at (it never sets its own), which is also what makes remToPx honest.
function measurementToRem(raw, fallback) {
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return fallback;
    return /px\s*$/.test(String(raw).trim()) ? num / 16 : num;
}

function remToPx(rem) {
    return Math.round(rem * 16 * 100) / 100;
}

// What the active design system's spacing scale is actually built on -
// shown as a header line above the Spacing sliders so the "1" / "space.100"
// token names have a visible anchor to a real measurement.
const SPACING_UNIT_NOTES = {
    tailwind: 'Tailwind unit = 4px (0.25rem)',
    atlassian: 'Atlassian unit = 8px (0.5rem)'
};

// Measurement counterpart of snapVarsToPalette: a loaded/imported theme (or
// one carried across a Tailwind/Atlassian switch) can hold a radius or
// spacing value that doesn't sit on the active token scale at all - tweakcn
// themes routinely ship --radius: 0.625rem, which is no Tailwind step. The
// sliders always DISPLAYED the nearest token for such a value, but the
// stored var kept the off-scale number, so the preview rendered one thing
// while the sidebar claimed another - exactly the "what's linked vs what's
// applied" drift the color side closes by snapping to the swatch hex. This
// rewrites each measurement key to its nearest token's exact rem so the two
// can't disagree. Returns whether anything actually moved, so callers that
// want an undo entry only push one when there's something to undo.
function snapMeasurementsToScale(vars) {
    let changed = false;
    const snap = (keys, tokens, nearestIndex, fallback) => {
        keys.forEach(key => {
            if (vars[key] === undefined) return;
            const rem = measurementToRem(vars[key], fallback);
            const snapped = `${tokens[nearestIndex(rem)]}rem`;
            if (vars[key] !== snapped) { vars[key] = snapped; changed = true; }
        });
    };
    snap(RADIUS_KEYS, currentRadiusTokens(), nearestRadiusTokenIndex, 0.5);
    snap(SPACING_KEYS, currentSpacingTokens(), nearestSpacingTokenIndex, 0.25);
    // Type-set size and line-height are measurements on the same footing:
    // Tailwind's text-lg (1.125rem) has no Atlassian font.size.* twin, so a
    // Tailwind-authored set carried across the switch would otherwise keep
    // rendering 18px while its field can only say "1.125rem" - the exact
    // "sidebar names one thing, preview renders another" drift this snap
    // exists to close. Same pass, same undo semantics as radius/spacing.
    const sizeTokens = currentTypeSizeTokens();
    const leadingTokens = currentTypeLeadingTokens();
    snap(TYPE_SETS.map(set => typeVarKey(set.key, 'size')), sizeTokens, rem => nearestTypeTokenIndex(sizeTokens, rem), 1);
    snap(TYPE_SETS.map(set => typeVarKey(set.key, 'leading')), leadingTokens, rem => nearestTypeTokenIndex(leadingTokens, rem), 1.5);
    return changed;
}

// No theme (including DEFAULT_THEME) is required to define shadow-* vars.
// cssVarBlockFor only emits --shadow-color-a (which every boxShadow key
// depends on) when vars['shadow-color'] is present, so without this a theme
// that omits shadow-color makes every box-shadow utility in the preview
// invalid - not just dim, entirely absent - and the sidebar sliders read
// their own hardcoded fallbacks with nothing wired to actually show.
function withShadowFallback(vars) {
    return {
        'shadow-color': '#000000',
        'shadow-opacity': '0.1',
        'shadow-blur': '3px',
        'shadow-spread': '0px',
        'shadow-offset-x': '0px',
        'shadow-offset-y': '1px',
        ...vars
    };
}

// --- Typography scale ---
// Typography is edited as SETS (roles a designer actually assigns text to:
// display, heading, ...), not as three bare font-family strings. Each set is
// five CSS vars - --type-<key>-family/-weight/-size/-leading/-tracking - so a
// template (or an exported theme) can style a role with one var each and
// never repeat a magic size. A set's family deliberately references the
// theme's family token (`var(--font-sans)`), not a face name: the chain is
// set -> family token -> face, so switching Sans in the sidebar re-fonts
// every set that leans on it instead of forcing seven separate edits. A set
// can still break the chain and name a face (or a custom stack) directly.
// `abbr`/`color` are the badge shown next to the set in the sidebar AND in
// the Typography preview's gutter (the token-generator "typography-name"
// idea) - editor chrome colors, deliberately not theme vars, so a badge is
// always legible whatever palette is being edited.
const TYPE_SETS = [
    { key: 'display',    label: 'Display',    abbr: 'D',  color: '#7c3aed', family: 'sans', weight: '700', size: 2.25,  leading: 2.5,  tracking: '-0.025em' },
    { key: 'heading',    label: 'Heading',    abbr: 'H',  color: '#2563eb', family: 'sans', weight: '600', size: 1.5,   leading: 2,    tracking: '-0.015em' },
    { key: 'subheading', label: 'Subheading', abbr: 'SH', color: '#0891b2', family: 'sans', weight: '500', size: 1.125, leading: 1.75, tracking: '0em' },
    { key: 'body',       label: 'Body',       abbr: 'B',  color: '#16a34a', family: 'sans', weight: '400', size: 1,     leading: 1.5,  tracking: '0em' },
    { key: 'label',      label: 'Label',      abbr: 'L',  color: '#d97706', family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' },
    { key: 'caption',    label: 'Caption',    abbr: 'C',  color: '#db2777', family: 'sans', weight: '400', size: 0.75,  leading: 1,    tracking: '0em' },
    { key: 'code',       label: 'Code',       abbr: 'M',  color: '#475569', family: 'mono', weight: '400', size: 0.875, leading: 1.25, tracking: '0em' }
];

const TYPE_WEIGHTS = [['300', '300 Light'], ['400', '400 Regular'], ['500', '500 Medium'], ['600', '600 Semibold'], ['700', '700 Bold'], ['800', '800 Extrabold']];

// Same "pick from the active design system's real scale" rule as the
// spacing/radius sliders above, for font size and line height. Tailwind's
// own fontSize scale (text-xs..text-7xl) and Atlassian's font.size.* tokens
// (https://atlassian.design/foundations/typography) - stored in rem for both
// so a set's vars stay unit-consistent with --spacing-*/--radius-*, and
// Atlassian's px values are just divided by 16.
const TAILWIND_TYPE_SIZE_TOKENS = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75, 4.5];
const TAILWIND_TYPE_SIZE_NAMES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'];
// Tailwind pairs every size with a default line-height (text-xs is
// 0.75rem/1rem, text-5xl and up are 1 = the size itself). Moving the size
// slider drops the leading onto this pairing so the two never drift into an
// off-scale combination by accident - leading stays independently editable
// afterwards.
const TAILWIND_TYPE_SIZE_LEADING = [1, 1.25, 1.5, 1.75, 1.75, 2, 2.25, 2.5, 3, 3.75, 4.5];
// Tailwind v4's leading-<n> is any multiple of the 0.25rem base unit
// (calc(var(--spacing) * n)), so 3..20 are all real, nameable tokens - and
// 20 (5rem) is enough headroom above the largest size (7xl, 4.5rem).
const TAILWIND_TYPE_LEADING_TOKENS = Array.from({ length: 18 }, (_, i) => (i + 3) * 0.25);
const TAILWIND_TYPE_LEADING_NAMES = TAILWIND_TYPE_LEADING_TOKENS.map((_, i) => `${i + 3}`);

const ATLASSIAN_TYPE_SIZE_TOKENS = [11, 12, 14, 16, 20, 24, 28, 32, 36].map(px => px / 16);
const ATLASSIAN_TYPE_SIZE_NAMES = ['font.size.050', 'font.size.075', 'font.size.100', 'font.size.200', 'font.size.300', 'font.size.400', 'font.size.500', 'font.size.600', 'font.size.800'];
// Atlassian's font.lineHeight.* pairing for each size above (their
// body/heading tokens: 11-12px on 16, 14 on 20, 16-20 on 24, 24 on 28, ...).
const ATLASSIAN_TYPE_SIZE_LEADING = [16, 16, 20, 24, 24, 28, 32, 40, 40].map(px => px / 16);
const ATLASSIAN_TYPE_LEADING_TOKENS = [16, 20, 24, 28, 32, 40].map(px => px / 16);
const ATLASSIAN_TYPE_LEADING_NAMES = ['font.lineHeight.100', 'font.lineHeight.200', 'font.lineHeight.300', 'font.lineHeight.400', 'font.lineHeight.500', 'font.lineHeight.600'];

function currentTypeSizeTokens() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_TYPE_SIZE_TOKENS : TAILWIND_TYPE_SIZE_TOKENS;
}

function currentTypeSizeNames() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_TYPE_SIZE_NAMES : TAILWIND_TYPE_SIZE_NAMES;
}

function currentTypeSizeLeading() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_TYPE_SIZE_LEADING : TAILWIND_TYPE_SIZE_LEADING;
}

function currentTypeLeadingTokens() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_TYPE_LEADING_TOKENS : TAILWIND_TYPE_LEADING_TOKENS;
}

function currentTypeLeadingNames() {
    return activePaletteSource === 'atlassian' ? ATLASSIAN_TYPE_LEADING_NAMES : TAILWIND_TYPE_LEADING_NAMES;
}

function nearestTypeTokenIndex(tokens, remValue) {
    let bestIndex = 0;
    let bestDist = Infinity;
    tokens.forEach((token, i) => {
        const dist = Math.abs(token - remValue);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });
    return bestIndex;
}

// The readout shown for a size/leading value: the nearest token's real name
// when the value sits on the active scale, otherwise the raw rem - so an
// imported off-scale value (say 1.3rem from another tool) is never
// misreported as "xl" until the slider is actually moved onto it.
function typeTokenLabel(tokens, names, remValue) {
    const i = nearestTypeTokenIndex(tokens, remValue);
    return Math.abs(tokens[i] - remValue) < 0.001 ? names[i] : `${remValue}rem`;
}

function typeVarKey(setKey, prop) {
    return `type-${setKey}-${prop}`;
}

// No vendored theme defines --type-* vars (the concept is this editor's),
// so every set starts from TYPE_SETS' defaults - same pattern as
// withRadiusFallback/withSpacingFallback: only fill what's missing, never
// override a value a theme/import actually carries.
function withTypographyFallback(vars) {
    const defaults = {};
    TYPE_SETS.forEach(set => {
        defaults[typeVarKey(set.key, 'family')] = `var(--font-${set.family})`;
        defaults[typeVarKey(set.key, 'weight')] = set.weight;
        defaults[typeVarKey(set.key, 'size')] = `${set.size}rem`;
        defaults[typeVarKey(set.key, 'leading')] = `${set.leading}rem`;
        defaults[typeVarKey(set.key, 'tracking')] = set.tracking;
    });
    return { ...defaults, ...vars };
}

function withFallbacks(vars) {
    return withTypographyFallback(withShadowFallback(withSpacingFallback(withRadiusFallback(vars))));
}

function flattenVars(theme) {
    const t = theme.cssVars.theme || {};
    return {
        light: withFallbacks({ ...t, ...(theme.cssVars.light || {}) }),
        dark: withFallbacks({ ...t, ...(theme.cssVars.dark || {}) })
    };
}

function loadTheme(name) {
    const theme = allThemes.find(t => t.title === name || t.name === name);
    const custom = customThemes[name];
    const flat = custom
        ? { light: withFallbacks({ ...custom.light }), dark: withFallbacks({ ...custom.dark }) }
        : flattenVars(theme || DEFAULT_THEME);
    // Every palette-sourced field (LINKABLE_COLOR_KEYS) gets linked and its
    // value snapped to that link's exact swatch hex right away, rather than
    // carrying the theme's raw value forward and re-guessing a name for it
    // on every render - see the tokenLinks comment above for why that guess
    // is unreliable whenever two palette entries share a hex.
    const links = {
        light: snapVarsToPalette(flat.light, activePaletteSource, LINKABLE_COLOR_KEYS),
        dark: snapVarsToPalette(flat.dark, activePaletteSource, LINKABLE_COLOR_KEYS)
    };
    // Same treatment for the radius/spacing keys - before loadedVars is
    // copied below, so the Reset button restores the on-scale value too,
    // not the raw off-scale one the theme shipped with.
    snapMeasurementsToScale(flat.light);
    snapMeasurementsToScale(flat.dark);
    state.themeName = name;
    state.vars = { light: { ...flat.light }, dark: { ...flat.dark } };
    state.loadedVars = { light: { ...flat.light }, dark: { ...flat.dark } };
    tokenLinks = { light: { ...links.light }, dark: { ...links.dark } };
    loadedTokenLinks = { light: { ...links.light }, dark: { ...links.dark } };
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
    renderAll();
}

function currentVars() {
    return state.vars[state.mode];
}

function pushUndo() {
    undoStack.push(JSON.stringify({ vars: state.vars, tokenLinks }));
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
}

// `link` (when passed) replaces the field's tokenLinks entry atomically
// with the value write, both landing after pushUndo's snapshot - mutating
// tokenLinks before calling setVar would let pushUndo capture the already-
// updated link, which undo could never then roll back.
function setVar(key, value, { record = true, link } = {}) {
    if (record) pushUndo();
    state.vars[state.mode][key] = value;
    if (link !== undefined) {
        if (link) tokenLinks[state.mode][key] = link;
        else delete tokenLinks[state.mode][key];
    }
    renderPreview();
    renderColorGroups();
    // renderElementTab rebuilds the shadow-color row (createColorFieldRow),
    // so a pick from ITS palette popover needs this to actually show up -
    // renderColorGroups alone only covers the Colors tab. Scoped to
    // Element-tab keys so an ordinary color-field edit (primary, etc.)
    // doesn't pay for a redundant re-render.
    if (key.startsWith('radius-') || key.startsWith('spacing-') || key.startsWith('shadow-')) {
        renderElementTab();
    }
    // The type-set fold summaries ("Sans->Inter · 2xl · 600") resolve
    // through the family tokens, so a Sans/Serif/Mono change has to refresh
    // them too, not just a --type-* edit.
    if (key.startsWith('type-') || key.startsWith('font-')) {
        renderTypographyTab();
    }
}

function updateUndoRedoButtons() {
    document.getElementById('undoButton').disabled = undoStack.length === 0;
    document.getElementById('redoButton').disabled = redoStack.length === 0;
}

// --- Sidebar: Colors ---
// Which groups are expanded, keyed by group.key - persists across
// renderColorGroups() calls (which rebuild the DOM from scratch on every
// edit) so tuning a color no longer re-folds the section you're working in.
// Element-part colors (card, popover, border/input/ring, sidebar) get their
// own foldable sections, same pattern as the signal-color groups above -
// both live together in the Colors tab (ELEMENT_GROUPS below COLOR_GROUPS)
// so every color-to-palette-token assignment sits in one place and the
// preview updates are visible without switching tabs.
const ELEMENT_GROUPS = [
    { key: 'card', label: 'Card', fields: [['card', 'Card'], ['card-foreground', 'Card Foreground']] },
    { key: 'popover', label: 'Popover', fields: [['popover', 'Popover'], ['popover-foreground', 'Popover Foreground']] },
    { key: 'border-input', label: 'Border & Input', fields: [['border', 'Border'], ['input', 'Input'], ['ring', 'Ring']] },
    { key: 'sidebar', label: 'Sidebar', fields: [
        ['sidebar', 'Sidebar'], ['sidebar-foreground', 'Sidebar Foreground'],
        ['sidebar-primary', 'Sidebar Primary'], ['sidebar-primary-foreground', 'Sidebar Primary Foreground'],
        ['sidebar-accent', 'Sidebar Accent'], ['sidebar-accent-foreground', 'Sidebar Accent Foreground'],
        ['sidebar-border', 'Sidebar Border'], ['sidebar-ring', 'Sidebar Ring']
    ] }
];

const ALL_COLOR_GROUPS = [...COLOR_GROUPS, ...ELEMENT_GROUPS];

// Every CSS var key that's editable through a palette-popover field in the
// Colors tab - the set that drives that tab's rendering AND (via
// cssVarBlockFor) gets a derived --key-rgb var so Tailwind's opacity
// modifiers can blend it. shadow-color is ALSO a palette-popover field (see
// createColorFieldRow in renderElementTab) but lives in the Element tab and
// never goes through Tailwind's colors config, so it's kept out of this
// array - LINKABLE_COLOR_KEYS below is the superset used for load/import
// time linking, where both belong.
const PALETTE_COLOR_KEYS = ALL_COLOR_GROUPS.flatMap(g => g.fields.map(([key]) => key));
const LINKABLE_COLOR_KEYS = [...PALETTE_COLOR_KEYS, 'shadow-color'];

const openGroups = new Set(ALL_COLOR_GROUPS.filter(g => g.open).map(g => g.key));

// Renders one set of foldable color-groups (fold-preview swatches, persisted
// open/close state) into a container - shared by the Colors tab's signal
// colors and the Element tab's decorative colors. Every field in every group
// is palette-sourced-only, per createColorFieldRow below.
function renderFoldableGroups(groups, containerId, searchTerm) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const vars = currentVars();

    groups.forEach(group => {
        const visibleFields = group.fields.filter(([key, label]) =>
            !searchTerm || key.includes(searchTerm) || label.toLowerCase().includes(searchTerm) || group.label.toLowerCase().includes(searchTerm)
        );
        if (!visibleFields.length) return;

        const details = document.createElement('details');
        details.className = 'color-group';
        details.open = searchTerm ? true : openGroups.has(group.key);
        details.addEventListener('toggle', () => {
            if (details.open) openGroups.add(group.key); else openGroups.delete(group.key);
            updateToggleAllColorGroupsButton();
        });

        const summary = document.createElement('summary');
        summary.className = 'color-group-label';
        const summaryText = document.createElement('span');
        summaryText.textContent = group.label;
        const summarySwatches = document.createElement('span');
        summarySwatches.className = 'color-group-fold-swatches';
        visibleFields.forEach(([key]) => {
            const dot = document.createElement('span');
            dot.className = 'color-group-fold-swatch';
            dot.style.backgroundColor = cssColorToHex(vars[key]) || '#000000';
            summarySwatches.appendChild(dot);
        });
        summary.append(summaryText, summarySwatches);
        details.appendChild(summary);

        const body = document.createElement('div');
        body.className = 'color-group-body';

        visibleFields.forEach(([key, label]) => body.appendChild(createColorFieldRow(key, label, vars)));

        details.appendChild(body);
        container.appendChild(details);
    });
}

function renderColorGroups() {
    const search = document.getElementById('colorSearchInput').value.trim().toLowerCase();
    renderFoldableGroups(ALL_COLOR_GROUPS, 'colorGroups', search);
    updateToggleAllColorGroupsButton();
    renderColorLinkSummary();
}

// Every palette-sourced key whose ACTIVE-mode tokenLinks entry is missing.
// Counts LINKABLE_COLOR_KEYS (not just the Colors-tab PALETTE_COLOR_KEYS) so
// shadow-color - the one linkable field that lives in the Element tab -
// can't quietly stay unlinked while the Colors tab reports "all linked".
// A link picked under the OTHER palette source still counts as linked: the
// point of the check is "exactly one palette token accounts for this hex",
// and a cross-source link satisfies that (its row shows "No color" only
// because nothing in the grid on screen corresponds to it).
function unlinkedColorKeys() {
    return LINKABLE_COLOR_KEYS.filter(key => !tokenLinks[state.mode][key]);
}

// The "N of M colors linked" line above the groups - the owner's single
// glance answer to "is every semantic color pinned to a palette token in
// this mode?". Re-rendered from renderColorGroups so every path that can
// change a link (pick, reset, undo/redo, import, mode switch via renderAll)
// keeps it honest without separate wiring.
function renderColorLinkSummary() {
    const unlinked = unlinkedColorKeys();
    const total = LINKABLE_COLOR_KEYS.length;
    const linked = total - unlinked.length;
    const text = document.getElementById('colorLinkSummaryText');
    const modeLabel = state.mode === 'dark' ? 'dark' : 'light';
    text.textContent = `${linked} of ${total} colors linked (${modeLabel})`;
    text.classList.toggle('color-link-summary-text-warning', unlinked.length > 0);
    // Name the offenders in the tooltip - shadow-color isn't in any Colors-
    // tab group, so a count alone could send someone hunting for a dot that
    // isn't on this tab.
    text.title = unlinked.length ? `Unlinked: ${unlinked.join(', ')}` : 'Every color resolves to a palette token';
    document.getElementById('snapAllColorsButton').hidden = unlinked.length === 0;
}

// The Colors tab's collapse/expand-all button - label/icon reflects the
// ACTION a click will take, not the current state: once every group is
// open it reads "Collapse all", otherwise "Expand all" (so a partially-open
// set of groups always offers "expand the rest" first).
function updateToggleAllColorGroupsButton() {
    const btn = document.getElementById('toggleAllColorGroupsButton');
    const allOpen = ALL_COLOR_GROUPS.every(g => openGroups.has(g.key));
    btn.title = allOpen ? 'Collapse all' : 'Expand all';
    btn.classList.toggle('expanded', allOpen);
}

function setAllColorGroupsOpen(open) {
    ALL_COLOR_GROUPS.forEach(g => { if (open) openGroups.add(g.key); else openGroups.delete(g.key); });
    renderColorGroups();
}

// Builds one color field row (swatch, label, token-name input, palette-picker
// button, reset button) - shared by the foldable Colors-tab groups and the
// flat Element-tab color list. Every field here is a palette-sourced slot,
// so only a palette swatch may set it, never typed free text: the input is
// read-only, and shows the field's resolved tokenLinks entry - the actual
// linked palette token, not a hex-based guess. A field linked under a
// different source than the one currently browsed shows "No color" rather
// than a same-looking nearest-match guess in the new source - the swatch
// still shows the real applied color (switching sources never repaints
// anything), but the label deliberately doesn't pretend to name it under a
// palette it wasn't actually picked from. That's the cue to reassign it
// from the source on screen if you want one.
function createColorFieldRow(key, label, vars) {
    const value = vars[key] || '';
    const hex = cssColorToHex(value) || '#000000';

    const row = document.createElement('div');
    row.className = 'color-field-row';

    const swatch = document.createElement('span');
    swatch.className = 'color-field-swatch';
    swatch.style.backgroundColor = hex;

    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'color-field-label';
    fieldLabel.textContent = label;

    const link = tokenLinks[state.mode][key];
    const linkMatchesSource = link && link.source === activePaletteSource;

    // Three distinct states, because they call for different fixes: linked
    // under the source on screen (show the token name); linked under the
    // OTHER source ("No color" - switch source, or reassign); no link at all
    // ("Unlinked" + amber dot - the hex came from an Import or a theme value
    // no swatch matched, and nothing accounts for it until it's picked or
    // snapped). Only the last one counts against the Colors-tab summary.
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'color-field-input' + (linkMatchesSource ? '' : ' color-field-input-unlinked');
    input.value = linkMatchesSource ? link.name : (link ? 'No color' : 'Unlinked');
    input.title = linkMatchesSource
        ? `${PALETTE_SOURCES[activePaletteSource].label} ${link.name}`
        : (link
            ? `Linked to ${PALETTE_SOURCES[link.source].label} ${link.name} - not in the ${PALETTE_SOURCES[activePaletteSource].label} grid on screen`
            : 'Not linked to any palette token - pick a swatch, or use "Snap all to palette"');
    input.readOnly = true;
    if (!link) {
        const dot = document.createElement('span');
        dot.className = 'color-field-unlinked-dot';
        dot.title = input.title;
        swatch.appendChild(dot);
    }

    // Only pass a currentName when the field's link belongs to the palette
    // source currently on screen - a link picked under Atlassian has no
    // corresponding swatch in the Tailwind grid to highlight as "current".
    const openPicker = () => openColorPalettePopover(paletteBtn, linkMatchesSource ? link.name : null, (newHex, newName) => {
        setVar(key, newHex, { link: { source: activePaletteSource, name: newName, hex: newHex.toLowerCase() } });
    });
    // stopPropagation is required, not cosmetic: the document-level
    // outside-click handler that closes the popover checks e.target against
    // it on the very same click, and this click's target (the input) is
    // never inside the not-yet-open popover - without stopping it here, the
    // bubbled click would close the popover the instant openPicker() opens it.
    input.addEventListener('click', (e) => { e.stopPropagation(); openPicker(); });

    const paletteBtn = document.createElement('button');
    paletteBtn.className = 'color-field-palette-btn';
    paletteBtn.title = `Pick from ${PALETTE_SOURCES[activePaletteSource].label} palette`;
    paletteBtn.innerHTML = '<i class="fas fa-swatchbook"></i>';
    paletteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPicker();
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'color-field-reset';
    resetBtn.title = 'Reset to loaded value';
    resetBtn.innerHTML = '<i class="fas fa-rotate-left"></i>';
    resetBtn.addEventListener('click', () => {
        const loaded = state.loadedVars[state.mode][key] || '';
        const loadedLink = loadedTokenLinks[state.mode][key];
        setVar(key, loaded, { link: loadedLink ? { ...loadedLink } : null });
    });

    row.append(swatch, fieldLabel, input, paletteBtn, resetBtn);
    return row;
}

// --- Sidebar: Typography / Other ---
const FONT_OPTIONS = {
    sans: ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Work Sans', 'system-ui'],
    serif: ['Source Serif 4', 'Georgia', 'Playfair Display', 'ui-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'ui-monospace']
};

function renderTypographyTab() {
    const vars = currentVars();
    const populate = (id, list, currentValue) => {
        const select = document.getElementById(id);
        select.innerHTML = '';
        const values = new Set(list);
        if (currentValue) values.add(currentValue.split(',')[0].trim().replace(/^["']|["']$/g, ''));
        [...values].forEach(font => {
            const opt = document.createElement('option');
            opt.value = font;
            opt.textContent = font;
            select.appendChild(opt);
        });
        select.value = currentValue ? currentValue.split(',')[0].trim().replace(/^["']|["']$/g, '') : list[0];
    };
    populate('fontSansSelect', FONT_OPTIONS.sans, vars['font-sans']);
    populate('fontSerifSelect', FONT_OPTIONS.serif, vars['font-serif']);
    populate('fontMonoSelect', FONT_OPTIONS.mono, vars['font-mono']);

    const tracking = parseFloat(vars['tracking-normal']) || 0;
    document.getElementById('letterSpacingRange').value = tracking;
    document.getElementById('letterSpacingNumber').value = tracking;

    renderTypeSetGroups(vars);
}

// Which of FONT_OPTIONS' faces are served by Google Fonts (the rest are
// system/generic names that need no download). Only these ever get a
// fonts.googleapis.com request - see googleFontsHref.
const GOOGLE_FONTS = new Set(['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Work Sans', 'Source Serif 4', 'Playfair Display', 'JetBrains Mono', 'Fira Code']);

// First family of a CSS font-family list, unquoted: "'Playfair Display',
// serif" -> "Playfair Display". Same parse the pool selects above use.
function firstFamily(value) {
    return (value || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
}

// A set's family var is one of three shapes, and the sidebar select has to
// show which: a reference to a theme family token (`var(--font-sans)`), a
// face straight out of FONT_OPTIONS, or anything else (custom stack).
function typeFamilySelection(value) {
    const ref = (value || '').match(/^var\(--font-(sans|serif|mono)\)$/);
    if (ref) return ref[1];
    const face = firstFamily(value);
    return Object.values(FONT_OPTIONS).some(list => list.includes(face)) ? face : 'custom';
}

// Follow a set's family var through the token chain to the face that
// actually renders - what the fold summary, the preview legend and the
// Google Fonts request all need, since `var(--font-sans)` on its own names
// nothing.
function resolveTypeFace(vars, setKey) {
    const value = vars[typeVarKey(setKey, 'family')] || '';
    const ref = value.match(/^var\(--font-(sans|serif|mono)\)$/);
    return firstFamily(ref ? vars[`font-${ref[1]}`] : value);
}

// One-line readout for a set: the resolved face (with the token it came
// through, so the chain stays visible), then size/leading as scale token
// names and the weight - the same string the preview legend shows.
function typeSetSummary(vars, set) {
    const familyValue = vars[typeVarKey(set.key, 'family')] || '';
    const ref = familyValue.match(/^var\(--font-(sans|serif|mono)\)$/);
    const face = resolveTypeFace(vars, set.key) || '?';
    const family = ref ? `${ref[1][0].toUpperCase()}${ref[1].slice(1)}→${face}` : face;
    const size = typeTokenLabel(currentTypeSizeTokens(), currentTypeSizeNames(), parseFloat(vars[typeVarKey(set.key, 'size')]) || set.size);
    const leading = typeTokenLabel(currentTypeLeadingTokens(), currentTypeLeadingNames(), parseFloat(vars[typeVarKey(set.key, 'leading')]) || set.leading);
    const weight = vars[typeVarKey(set.key, 'weight')] || set.weight;
    return `${family} · ${size} / ${leading} · ${weight}`;
}

// Builds the per-set foldable groups ONCE into #typeSetGroups - unlike
// renderColorGroups, which rebuilds its DOM on every edit, the set groups
// keep their DOM (so a <details> stays open/closed on its own and a
// half-typed custom family isn't wiped mid-keystroke) and only have their
// values refreshed by renderTypeSetGroups. Listeners are wired here, at
// build time, for the same reason.
function buildTypeSetGroups() {
    const container = document.getElementById('typeSetGroups');
    const el = (tag, className, props = {}) => Object.assign(document.createElement(tag), { className, ...props });
    const option = (value, text) => Object.assign(document.createElement('option'), { value, textContent: text });

    TYPE_SETS.forEach(set => {
        const details = el('details', 'color-group type-set-group');
        details.dataset.set = set.key;
        if (set.key === 'display' || set.key === 'body') details.open = true;

        const summary = el('summary', 'color-group-label');
        const title = el('span', 'type-set-title');
        const badge = el('span', 'type-set-badge', { textContent: set.abbr });
        // Raw data in, styling in CSS: the badge color is a per-set editor
        // constant, so it travels as a custom property the stylesheet reads.
        badge.style.setProperty('--type-badge-color', set.color);
        title.append(badge, document.createTextNode(set.label));
        const meta = el('span', 'type-set-fold-meta', { id: `typeMeta-${set.key}` });
        summary.append(title, meta);

        const body = el('div', 'color-group-body');

        // Family: theme tokens first (the default - keeps the chain), then
        // the concrete pools, then custom.
        const familyLabel = el('label', 'field-label', { textContent: 'Font', htmlFor: `typeFamily-${set.key}` });
        const familySelect = el('select', 'field-select', { id: `typeFamily-${set.key}` });
        const tokenGroup = Object.assign(document.createElement('optgroup'), { label: 'Theme family tokens' });
        tokenGroup.append(option('sans', 'Sans (font-sans)'), option('serif', 'Serif (font-serif)'), option('mono', 'Mono (font-mono)'));
        familySelect.append(tokenGroup);
        Object.entries(FONT_OPTIONS).forEach(([pool, faces]) => {
            const group = Object.assign(document.createElement('optgroup'), { label: `${pool[0].toUpperCase()}${pool.slice(1)} faces` });
            faces.forEach(face => group.append(option(face, face)));
            familySelect.append(group);
        });
        familySelect.append(option('custom', 'Custom…'));
        const customInput = el('input', 'field-select type-custom-family', { id: `typeCustom-${set.key}`, type: 'text', placeholder: "'My Face', sans-serif", hidden: true });

        const weightLabel = el('label', 'field-label', { textContent: 'Weight', htmlFor: `typeWeight-${set.key}` });
        const weightSelect = el('select', 'field-select', { id: `typeWeight-${set.key}` });
        TYPE_WEIGHTS.forEach(([value, text]) => weightSelect.append(option(value, text)));

        // Size / line height: same index-into-real-token-scale sliders as the
        // Element tab's spacing, readout in the readonly token field, rem in
        // its title (see renderTypeSetGroups / the input handlers below).
        const sizeLabel = el('label', 'field-label', { textContent: 'Size', htmlFor: `typeSize-${set.key}` });
        const sizeRow = el('div', 'field-row');
        const sizeRange = el('input', 'field-range', { id: `typeSize-${set.key}`, type: 'range', min: 0, step: 1 });
        const sizeName = el('input', 'field-number field-number-token', { id: `typeSizeName-${set.key}`, type: 'text', readOnly: true });
        const sizeReadout = el('span', 'field-readout', { id: `typeSizeReadout-${set.key}` });
        sizeRow.append(sizeRange, sizeName, sizeReadout);

        const leadingLabel = el('label', 'field-label', { textContent: 'Line Height', htmlFor: `typeLeading-${set.key}` });
        const leadingRow = el('div', 'field-row');
        const leadingRange = el('input', 'field-range', { id: `typeLeading-${set.key}`, type: 'range', min: 0, step: 1 });
        const leadingName = el('input', 'field-number field-number-token', { id: `typeLeadingName-${set.key}`, type: 'text', readOnly: true });
        const leadingReadout = el('span', 'field-readout', { id: `typeLeadingReadout-${set.key}` });
        leadingRow.append(leadingRange, leadingName, leadingReadout);

        const trackingLabel = el('label', 'field-label', { textContent: 'Letter Spacing', htmlFor: `typeTracking-${set.key}` });
        const trackingRow = el('div', 'field-row');
        const trackingRange = el('input', 'field-range', { id: `typeTracking-${set.key}`, type: 'range', min: -0.1, max: 0.1, step: 0.005 });
        const trackingNumber = el('input', 'field-number', { id: `typeTrackingNumber-${set.key}`, type: 'number', step: 0.005 });
        const trackingUnit = el('span', 'field-unit', { textContent: 'em' });
        trackingRow.append(trackingRange, trackingNumber, trackingUnit);

        body.append(familyLabel, familySelect, customInput, weightLabel, weightSelect, sizeLabel, sizeRow, leadingLabel, leadingRow, trackingLabel, trackingRow);
        details.append(summary, body);
        container.append(details);

        // --- wiring ---
        familySelect.addEventListener('change', () => {
            const choice = familySelect.value;
            customInput.hidden = choice !== 'custom';
            if (choice === 'custom') {
                // Seed the text box with what the set currently resolves to,
                // then let the user type - nothing is written until they do.
                customInput.value = currentVars()[typeVarKey(set.key, 'family')] || '';
                customInput.focus();
                return;
            }
            if (choice === 'sans' || choice === 'serif' || choice === 'mono') {
                setVar(typeVarKey(set.key, 'family'), `var(--font-${choice})`);
                return;
            }
            // A concrete face gets its pool's generic as a fallback, so the
            // exported var is a complete font-family value on its own.
            const pool = Object.keys(FONT_OPTIONS).find(p => FONT_OPTIONS[p].includes(choice)) || 'sans';
            const generic = { sans: 'sans-serif', serif: 'serif', mono: 'monospace' }[pool];
            const quoted = /\s/.test(choice) ? `'${choice}'` : choice;
            setVar(typeVarKey(set.key, 'family'), `${quoted}, ${generic}`);
        });
        customInput.addEventListener('input', () => {
            if (customInput.value.trim()) setVar(typeVarKey(set.key, 'family'), customInput.value.trim());
        });
        weightSelect.addEventListener('change', () => setVar(typeVarKey(set.key, 'weight'), weightSelect.value));

        sizeRange.addEventListener('input', () => {
            const i = Number(sizeRange.value);
            const rem = currentTypeSizeTokens()[i];
            // One undo step for the pair: the size write records, the paired
            // leading follows with record:false so undo restores both at once.
            setVar(typeVarKey(set.key, 'size'), `${rem}rem`);
            setVar(typeVarKey(set.key, 'leading'), `${currentTypeSizeLeading()[i]}rem`, { record: false });
        });
        leadingRange.addEventListener('input', () => {
            setVar(typeVarKey(set.key, 'leading'), `${currentTypeLeadingTokens()[Number(leadingRange.value)]}rem`);
        });

        const syncTracking = (val) => {
            trackingRange.value = val;
            trackingNumber.value = val;
            setVar(typeVarKey(set.key, 'tracking'), `${val}em`);
        };
        trackingRange.addEventListener('input', () => syncTracking(trackingRange.value));
        trackingNumber.addEventListener('input', () => syncTracking(trackingNumber.value));
    });
}

// Refreshes every set group's inputs from vars. Slider maxes are set here
// (not at build time) because the token set is activePaletteSource-
// dependent - switching Tailwind<->Atlassian re-snaps each slider onto the
// nearest value in the new scale, same as the Element tab.
function renderTypeSetGroups(vars) {
    const container = document.getElementById('typeSetGroups');
    if (!container) return;
    if (!container.children.length) buildTypeSetGroups();

    const sizeTokens = currentTypeSizeTokens();
    const sizeNames = currentTypeSizeNames();
    const leadingTokens = currentTypeLeadingTokens();
    const leadingNames = currentTypeLeadingNames();

    TYPE_SETS.forEach(set => {
        const familyValue = vars[typeVarKey(set.key, 'family')] || '';
        const selection = typeFamilySelection(familyValue);
        const familySelect = document.getElementById(`typeFamily-${set.key}`);
        const customInput = document.getElementById(`typeCustom-${set.key}`);
        familySelect.value = selection;
        customInput.hidden = selection !== 'custom';
        // Don't clobber the field while it's being typed into - setVar
        // re-renders on every keystroke.
        if (selection === 'custom' && document.activeElement !== customInput) customInput.value = familyValue;

        document.getElementById(`typeWeight-${set.key}`).value = vars[typeVarKey(set.key, 'weight')] || set.weight;

        const size = parseFloat(vars[typeVarKey(set.key, 'size')]) || set.size;
        const sizeIndex = nearestTypeTokenIndex(sizeTokens, size);
        const sizeRange = document.getElementById(`typeSize-${set.key}`);
        sizeRange.max = sizeTokens.length - 1;
        sizeRange.value = sizeIndex;
        const sizeName = document.getElementById(`typeSizeName-${set.key}`);
        sizeName.value = typeTokenLabel(sizeTokens, sizeNames, size);
        sizeName.title = `${sizeTokens[sizeIndex]}rem`;
        // Readout shows the value actually applied (not the snapped token),
        // so an off-scale import reads honestly until the slider moves.
        document.getElementById(`typeSizeReadout-${set.key}`).textContent = `${Math.round(size * 16)}px`;

        const leading = parseFloat(vars[typeVarKey(set.key, 'leading')]) || set.leading;
        const leadingIndex = nearestTypeTokenIndex(leadingTokens, leading);
        const leadingRange = document.getElementById(`typeLeading-${set.key}`);
        leadingRange.max = leadingTokens.length - 1;
        leadingRange.value = leadingIndex;
        const leadingName = document.getElementById(`typeLeadingName-${set.key}`);
        leadingName.value = typeTokenLabel(leadingTokens, leadingNames, leading);
        leadingName.title = `${leadingTokens[leadingIndex]}rem`;
        document.getElementById(`typeLeadingReadout-${set.key}`).textContent = `${Math.round(leading * 16)}px`;

        const tracking = parseFloat(vars[typeVarKey(set.key, 'tracking')]) || 0;
        document.getElementById(`typeTracking-${set.key}`).value = tracking;
        document.getElementById(`typeTrackingNumber-${set.key}`).value = tracking;

        document.getElementById(`typeMeta-${set.key}`).textContent = typeSetSummary(vars, set);
    });
}

// Only the families that actually render in the preview get requested:
// the three theme family tokens (body text and every template's font-sans/
// serif/mono utilities use them) plus any face a set names directly. Fixed
// 400/500/600/700 - every GOOGLE_FONTS face carries all four, whereas a
// weight one face lacks makes the Google CSS API reject the WHOLE request.
function googleFontsHref(vars) {
    const faces = new Set(['font-sans', 'font-serif', 'font-mono'].map(k => firstFamily(vars[k])));
    TYPE_SETS.forEach(set => faces.add(resolveTypeFace(vars, set.key)));
    const wanted = [...faces].filter(f => GOOGLE_FONTS.has(f)).sort();
    if (!wanted.length) return '';
    return `https://fonts.googleapis.com/css2?${wanted.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`;
}

// Preview-only companions to the --type-* vars (not exported; buildCodeOutput
// reads state.vars directly): per-set badge color/abbreviation and the
// resolved summary string, so templates/typography.js can paint its gutter
// badges and legend purely from CSS (`content: var(--type-heading-abbr)`)
// and keep TYPE_SETS as the single source for both sidebar and preview.
function typeMetaCss(vars) {
    return TYPE_SETS.map(set =>
        `  --type-${set.key}-badge: ${set.color};\n` +
        `  --type-${set.key}-abbr: "${set.abbr}";\n` +
        `  --type-${set.key}-meta: "${typeSetSummary(vars, set).replace(/"/g, "'")}";`
    ).join('\n');
}

// The <head> fragment buildPreviewDocument injects for typography, and what
// syncPreviewTypeHead keeps current on the in-place (no reload) edit path.
function buildTypeHeadHtml(vars) {
    const href = googleFontsHref(vars);
    return `<link id="google-fonts" rel="stylesheet"${href ? ` href="${href}"` : ''}>
<style id="type-meta">
  :root {
${typeMetaCss(vars)}
  }
</style>`;
}

function syncPreviewTypeHead(doc, vars) {
    const link = doc.getElementById('google-fonts');
    const href = googleFontsHref(vars);
    // Only touch the href when it actually changed - re-setting it makes the
    // browser re-fetch and briefly fall back to the generic family.
    if (link && link.getAttribute('href') !== href) {
        if (href) link.setAttribute('href', href);
        else link.removeAttribute('href');
    }
    const meta = doc.getElementById('type-meta');
    if (meta) meta.textContent = `:root {\n${typeMetaCss(vars)}\n}`;
}

// tailwind.config fragments so any template can use a set as a utility:
// font-heading (family) and text-heading (size + line-height + tracking +
// weight, Tailwind's tuple fontSize form) - optional for templates, but it
// means a template never has to spell out five var() references by hand.
function typeFontFamilyConfig() {
    return TYPE_SETS.map(set => `${set.key}: ['var(--type-${set.key}-family)']`).join(', ');
}

function typeFontSizeConfig() {
    return TYPE_SETS.map(set =>
        `${set.key}: ['var(--type-${set.key}-size)', { lineHeight: 'var(--type-${set.key}-leading)', letterSpacing: 'var(--type-${set.key}-tracking)', fontWeight: 'var(--type-${set.key}-weight)' }]`
    ).join(',\n          ');
}

function renderElementTab() {
    const vars = currentVars();

    // The token name goes in the readonly field, the resolved measurement in
    // the readout span beside it ("lg" + "8px", "space.100" + "8px") - both
    // visible at once, since a title tooltip alone hides the one number the
    // owner actually wants certainty about. measurementToRem (not bare
    // parseFloat-or-fallback) so a real 0 ("none", space.0) isn't mistaken
    // for a missing value and shown as the fallback token.
    const radiusTokens = currentRadiusTokens();
    const radiusNames = currentRadiusNames();
    [['radius-card', 'cardRadiusRange', 'cardRadiusNumber', 'cardRadiusReadout'], ['radius-field', 'fieldRadiusRange', 'fieldRadiusNumber', 'fieldRadiusReadout'],
     ['radius-button', 'buttonRadiusRange', 'buttonRadiusNumber', 'buttonRadiusReadout']]
        .forEach(([key, rangeId, numberId, readoutId]) => {
            const val = measurementToRem(vars[key], 0.5);
            const tokenIndex = nearestRadiusTokenIndex(val);
            const rangeEl = document.getElementById(rangeId);
            rangeEl.max = radiusTokens.length - 1;
            rangeEl.value = tokenIndex;
            const numberEl = document.getElementById(numberId);
            numberEl.value = radiusNames[tokenIndex];
            numberEl.title = `${radiusTokens[tokenIndex]}rem`;
            document.getElementById(readoutId).textContent = `${remToPx(radiusTokens[tokenIndex])}px`;
        });

    document.getElementById('spacingUnitNote').textContent = SPACING_UNIT_NOTES[activePaletteSource] || SPACING_UNIT_NOTES.tailwind;
    const spacingTokens = currentSpacingTokens();
    const spacingNames = currentSpacingNames();
    [['spacing-padding-y', 'paddingYRange', 'paddingYNumber', 'paddingYReadout'], ['spacing-padding-x', 'paddingXRange', 'paddingXNumber', 'paddingXReadout'],
     ['spacing-gap', 'gapRange', 'gapNumber', 'gapReadout'], ['spacing-grid', 'gridRange', 'gridNumber', 'gridReadout']]
        .forEach(([key, rangeId, numberId, readoutId]) => {
            const val = measurementToRem(vars[key], 0.25);
            const tokenIndex = nearestSpacingTokenIndex(val);
            const rangeEl = document.getElementById(rangeId);
            rangeEl.max = spacingTokens.length - 1;
            rangeEl.value = tokenIndex;
            const numberEl = document.getElementById(numberId);
            numberEl.value = spacingNames[tokenIndex];
            numberEl.title = `${spacingTokens[tokenIndex]}rem`;
            document.getElementById(readoutId).textContent = `${remToPx(spacingTokens[tokenIndex])}px`;
        });

    // Same palette-sourced field as every Colors-tab entry - not a native
    // <input type="color"> - so the shadow color is a real, nameable
    // Tailwind/Atlassian token like everything else, not an arbitrary hex.
    document.getElementById('shadowColorRow').replaceChildren(createColorFieldRow('shadow-color', 'Color', vars));
    const shadowFields = [
        ['shadow-opacity', 'shadowOpacityRange', 'shadowOpacityNumber', 0.1],
        ['shadow-blur', 'shadowBlurRange', 'shadowBlurNumber', 3],
        ['shadow-spread', 'shadowSpreadRange', 'shadowSpreadNumber', 0],
        ['shadow-offset-x', 'shadowOffsetXRange', 'shadowOffsetXNumber', 0],
        ['shadow-offset-y', 'shadowOffsetYRange', 'shadowOffsetYNumber', 1]
    ];
    shadowFields.forEach(([key, rangeId, numberId, fallback]) => {
        const val = parseFloat(vars[key]) || fallback;
        document.getElementById(rangeId).value = val;
        document.getElementById(numberId).value = val;
    });
}

// --- Theme picker ---
function themeSwatchHtml(vars) {
    return SWATCH_KEYS.map(key => {
        const hex = cssColorToHex(vars[key]) || '#ccc';
        return `<span class="theme-swatch-dot" style="background:${hex}"></span>`;
    }).join('');
}

function renderThemePickerButton() {
    document.getElementById('themeNameLabel').textContent = state.themeName;
    document.getElementById('themeSwatchDots').innerHTML = themeSwatchHtml(currentVars());
}

function renderThemePickerList() {
    const listEl = document.getElementById('themePickerList');
    const search = document.getElementById('themeSearchInput').value.trim().toLowerCase();
    listEl.innerHTML = '';

    const renderRow = (name, vars, isCustom) => {
        if (search && !name.toLowerCase().includes(search)) return;
        const row = document.createElement('button');
        row.className = 'theme-picker-row';
        if (name === state.themeName) row.classList.add('active');
        row.innerHTML = `<span class="theme-swatch-dots">${themeSwatchHtml(vars)}</span><span class="theme-picker-row-name">${name}</span>`;
        if (isCustom) {
            const del = document.createElement('span');
            del.className = 'theme-picker-row-delete';
            del.innerHTML = '<i class="fas fa-trash"></i>';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                delete customThemes[name];
                saveCustomThemes();
                renderThemePickerList();
            });
            row.appendChild(del);
        }
        row.addEventListener('click', () => {
            loadTheme(name);
            document.getElementById('themePickerMenu').hidden = true;
        });
        listEl.appendChild(row);
    };

    Object.entries(customThemes).forEach(([name, vars]) => renderRow(name, vars.light, true));
    allThemes.forEach(theme => renderRow(theme.title, flattenVars(theme).light, false));
}

// --- Color palette popover (Tailwind v4 / Atlassian swatch grid, matching tweakcn's own picker) ---
const PALETTE_SOURCES = {
    tailwind: {
        label: 'Tailwind v4',
        rows: () => (typeof TAILWIND_PALETTE_ROWS !== 'undefined' ? TAILWIND_PALETTE_ROWS : []),
        names: () => (typeof TAILWIND_PALETTE_NAMES !== 'undefined' ? TAILWIND_PALETTE_NAMES : [])
    },
    atlassian: {
        label: 'Atlassian',
        rows: () => (typeof ATLASSIAN_PALETTE_ROWS !== 'undefined' ? ATLASSIAN_PALETTE_ROWS : []),
        names: () => (typeof ATLASSIAN_PALETTE_NAMES !== 'undefined' ? ATLASSIAN_PALETTE_NAMES : [])
    }
};

// White/black/transparent sit outside the row grid (own strip at the top of
// the popover) but are still real, nameable picks - shared here so both the
// popover and the nearest-match lookup below stay in sync.
const POPOVER_SPECIALS = [['#ffffff', 'white'], ['#000000', 'black'], ['transparent', 'transparent']];

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function colorDistanceSq(hexA, hexB) {
    const [r1, g1, b1] = hexToRgb(hexA);
    const [r2, g2, b2] = hexToRgb(hexB);
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// Resolves a hex to its closest swatch in a given palette source, returning
// both that swatch's reference name AND its exact hex (distance 0 - i.e. an
// exact match - for anything actually picked from that same palette). Two
// swatches - even across different families of the same source, e.g.
// Tailwind's zinc-50/neutral-50/mauve-50, all #fafafa - can tie on hex, so
// this always resolves the same way for a given hex: family order in
// TAILWIND_PALETTE_FAMILIES/ATLASSIAN_PALETTE_FAMILIES is the fixed
// tie-break, first match wins. That's a deterministic choice among equally
// "correct" candidates, not a proof no ambiguity ever existed - see
// tokenLinks above for why the result gets recorded once and reused rather
// than re-derived (and thus liable to disagree with itself) on every render.
function resolvePaletteEntry(hex, sourceKey) {
    let best = null;
    let bestDist = Infinity;
    POPOVER_SPECIALS.forEach(([swatchHex, name]) => {
        if (swatchHex === 'transparent') return;
        const dist = colorDistanceSq(hex, swatchHex);
        if (dist < bestDist) { bestDist = dist; best = { name, hex: swatchHex }; }
    });
    const source = PALETTE_SOURCES[sourceKey];
    const names = source.names();
    source.rows().forEach((row, rowIndex) => {
        row.forEach((swatchHex, colIndex) => {
            const dist = colorDistanceSq(hex, swatchHex);
            if (dist < bestDist) { bestDist = dist; best = { name: names[rowIndex] && names[rowIndex][colIndex], hex: swatchHex }; }
        });
    });
    return best;
}

// Exact-name lookup, the inverse of resolvePaletteEntry: given a token name
// that claims to belong to `sourceKey`, return that swatch's {name, hex} or
// null if no such name exists there. Used by Import to honor a token map
// carried in from a previous Code export (see buildCodeOutput) - a carried
// name is only trusted once it's found in the real palette, and the hex
// applied is the palette's own, never the one written in the file.
function findPaletteEntryByName(sourceKey, name) {
    const special = POPOVER_SPECIALS.find(([, specialName]) => specialName === name);
    if (special) return { name: special[1], hex: special[0] };
    const source = PALETTE_SOURCES[sourceKey];
    if (!source) return null;
    const names = source.names();
    const rows = source.rows();
    for (let rowIndex = 0; rowIndex < names.length; rowIndex++) {
        const colIndex = (names[rowIndex] || []).indexOf(name);
        if (colIndex !== -1 && rows[rowIndex] && rows[rowIndex][colIndex]) {
            return { name, hex: rows[rowIndex][colIndex] };
        }
    }
    return null;
}

// Links every key in `keys` to its nearest swatch in `sourceKey` (mutating
// `vars[key]` to that swatch's exact hex, so the link and the applied color
// can never drift apart) and returns the { key: {source, name, hex} } map
// driving tokenLinks. Used at theme-load time, after a raw CSS import, and
// by the Colors tab's "Snap all to palette" button - the only paths that
// can hand a palette-sourced field a value that didn't come from the
// popover itself.
function snapVarsToPalette(vars, sourceKey, keys) {
    const links = {};
    keys.forEach(key => {
        const raw = vars[key];
        if (raw === undefined) return;
        const hex = cssColorToHex(raw);
        if (!hex) return;
        const entry = resolvePaletteEntry(hex, sourceKey);
        if (!entry) return;
        vars[key] = entry.hex;
        links[key] = { source: sourceKey, name: entry.name, hex: entry.hex };
    });
    return links;
}

// Not the native `title` attribute - browsers gate that behind a fixed hover
// delay (~600ms-1s) that can't be shortened from CSS/JS. Also not a CSS
// ::after on the swatch - the popover scrolls (overflow-y:auto), which crops
// any descendant tooltip that lands outside its box. A single shared element,
// repositioned in JS and appended outside the scrolling popover, shows
// instantly (no transition) and clamps to the viewport so it's never cropped.
function showSwatchTooltip(anchorEl, text) {
    const tip = document.getElementById('swatchTooltip');
    tip.textContent = text;
    tip.hidden = false;
    const anchorRect = anchorEl.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const left = Math.max(4, Math.min(anchorRect.left + anchorRect.width / 2 - tipRect.width / 2, window.innerWidth - tipRect.width - 4));
    const above = anchorRect.top - tipRect.height - 4;
    const top = above < 4 ? anchorRect.bottom + 4 : above;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function hideSwatchTooltip() {
    document.getElementById('swatchTooltip').hidden = true;
}

function makePopoverSwatch(popover, hex, name, extraClass) {
    const btn = document.createElement('button');
    btn.className = 'popover-swatch' + (extraClass ? ` ${extraClass}` : '');
    btn.style.backgroundColor = hex === 'transparent' ? '' : hex;
    btn.dataset.hex = hex.toLowerCase();
    if (name) btn.dataset.name = name;
    const tooltipText = name ? `${name} — ${hex}` : hex;
    btn.setAttribute('aria-label', tooltipText);
    if (name) {
        const label = document.createElement('span');
        label.className = 'popover-swatch-name';
        label.textContent = name;
        btn.appendChild(label);
    }
    btn.addEventListener('mouseenter', () => showSwatchTooltip(btn, tooltipText));
    btn.addEventListener('mouseleave', hideSwatchTooltip);
    btn.addEventListener('focus', () => showSwatchTooltip(btn, tooltipText));
    btn.addEventListener('blur', hideSwatchTooltip);
    btn.addEventListener('click', () => {
        if (popover._onSelect) popover._onSelect(hex, name);
        closeColorPalettePopover();
    });
    return btn;
}

function renderColorPopoverGrid() {
    const popover = document.getElementById('colorPalettePopover');
    const grid = popover.querySelector('.color-popover-grid');
    grid.innerHTML = '';
    const source = PALETTE_SOURCES[activePaletteSource];
    const names = source.names();
    source.rows().forEach((row, rowIndex) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'color-popover-row';
        row.forEach((hex, colIndex) => rowEl.appendChild(makePopoverSwatch(popover, hex, names[rowIndex] && names[rowIndex][colIndex])));
        grid.appendChild(rowEl);
    });
    popover.querySelector('.color-popover-header span:nth-child(2)').textContent = source.label;
}

function closeColorPalettePopover() {
    document.getElementById('colorPalettePopover').hidden = true;
    hideSwatchTooltip();
}

function buildColorPalettePopover() {
    const popover = document.getElementById('colorPalettePopover');
    const specials = popover.querySelector('.color-popover-specials');

    POPOVER_SPECIALS.forEach(([hex, name]) => {
        specials.appendChild(makePopoverSwatch(popover, hex, name, hex === 'transparent' ? 'popover-swatch-transparent' : ''));
    });

    renderColorPopoverGrid();

    popover.querySelectorAll('[data-popover-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            popover.querySelectorAll('[data-popover-view]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            popover.querySelector('.color-popover-grid').classList.toggle('list-view', btn.dataset.popoverView === 'list');
        });
    });

    document.addEventListener('click', (e) => {
        if (!popover.hidden && !popover.contains(e.target) && !e.target.closest('.color-field-palette-btn')) {
            closeColorPalettePopover();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeColorPalettePopover();
    });
    // A click that lands inside the <iframe> preview never bubbles to this
    // document (it's a separate browsing context) - so a click there could
    // never reach the listener above and the popover would stay open
    // forever. Clicking into the iframe does move focus into it though,
    // which fires `blur` on the top window - close on that instead.
    window.addEventListener('blur', () => {
        if (!popover.hidden && document.activeElement === document.getElementById('previewFrame')) {
            closeColorPalettePopover();
        }
    });
}

// currentName - not currentHex - because hex alone is ambiguous whenever
// the palette has a same-hex collision (Tailwind's zinc-50/neutral-50/
// mauve-50 all #fafafa): matching by hex would mark every one of those as
// "current" for a single linked field, which is exactly the confusing
// multi-highlight tokenLinks exists to avoid. Pass null when the field's
// link (if any) belongs to a different palette source than the one this
// popover is currently showing - nothing in this grid actually corresponds
// to it, so nothing should be marked current.
function openColorPalettePopover(anchor, currentName, onSelect) {
    const popover = document.getElementById('colorPalettePopover');
    const rect = anchor.getBoundingClientRect();
    popover.hidden = false;
    const popoverWidth = popover.offsetWidth || 320;
    const left = Math.min(rect.left, window.innerWidth - popoverWidth - 12);
    popover.style.top = `${rect.bottom + 6}px`;
    popover.style.left = `${Math.max(8, left)}px`;
    popover._onSelect = onSelect;

    // Mark the one swatch the field is actually linked to, so re-opening
    // the picker shows what's already applied, not just a blank grid.
    popover.querySelectorAll('.popover-swatch-current').forEach(el => el.classList.remove('popover-swatch-current'));
    if (currentName) {
        popover.querySelectorAll(`.popover-swatch[data-name="${CSS.escape(currentName)}"]`).forEach(el => el.classList.add('popover-swatch-current'));
    }
}

// --- localStorage ---
function saveCustomThemes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customThemes));
}
function loadCustomThemesFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) customThemes = JSON.parse(raw);
    } catch (e) { console.warn('Could not load saved themes:', e); }
}

// --- Preview (iframe) ---
// The sidebar's Shadow fields (color/opacity/blur/spread/offset-x/offset-y)
// only set raw CSS variables - nothing composes them into an actual
// box-shadow. Derive one here (`--shadow-color-a`, the shadow color with its
// opacity baked in via CSS relative-color syntax) so Tailwind's boxShadow
// theme keys below have something real to point at.
// Tailwind's own default numeric spacing scale (v3/Play CDN doesn't expose
// v4's single-`--spacing`-multiplier mechanism, so p-*/px-*/py-*/gap-* can't
// be pulled from a CSS var just by editing tailwind.config). Neither `gap`
// nor `padding` has independent per-axis theme keys - one scale drives every
// direction at once (gap/gap-x/gap-y all share `theme.gap`; p/px/py/pt/pb/pl/pr
// all share `theme.padding`) - so x and y can't point at different vars
// through config alone. Instead, the gap/padding utilities actually used
// across the templates (grepped, not guessed) each get a generated override
// stylesheet, keeping their normal relative weight (N) but multiplied
// against our own --spacing-gap and --spacing-padding-x/-y.
const SPACING_SCALE = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];

// Generated once (pure function of the fixed scale, not of live var values -
// only the vars it references change at runtime) and injected as a <style>
// after Tailwind's own stylesheet. !important is deliberate here: Tailwind's
// CDN script injects its utility stylesheet at a time we don't control, so
// source order alone isn't reliable - this is overriding a third-party
// framework's generated output, not a case the "never !important" component
// rule is about.
//
// Grid vs Gap is a SEMANTIC split (does this gap sit between separate
// cards/sections, or between parts within one component), not a syntactic
// one - it can't be inferred from whether the container happens to be
// display:flex or display:grid. The templates use flex for both: cards.js
// stacks its "Total Revenue" and "Upgrade" cards with `flex flex-col gap-4`
// (between cards - should be Grid) right alongside a checkbox's icon+label
// on `flex items-center gap-2` (within one control - should be Gap). And
// they use grid for both directions too: dashboard.js's 3 stat cards are a
// `grid ... gap-4` (between cards - Grid), while cards.js's Name/Email
// fields inside the Upgrade card are ALSO a `grid ... gap-3` (within one
// card - should be Gap). So every container that's genuinely "between
// cards" carries an explicit `theme-grid-gap` marker class in the template
// (grepped case by case, not inferred) and gets --spacing-grid; every
// gap-N/gap-x-N/gap-y-N WITHOUT that marker - the default, and the common
// case - gets --spacing-gap.
//
// Responsive variants: the templates also use `lg:p-6` (dashboard.js) and
// `md:pt-14`/`md:px-16` (marketing.js). Tailwind compiles those to the same
// utility inside a min-width media query WITHOUT !important, so a base
// `.p-4 { ... !important }` override silently beat `lg:p-6` at every width -
// the responsive step just stopped happening. Every override is therefore
// emitted again per screen prefix, inside the matching media query: same
// !important, same specificity, and source order (base first, wider screens
// last) then decides exactly the way Tailwind's own stylesheet does.
// Tailwind's default screens (https://tailwindcss.com/docs/screens).
const RESPONSIVE_SCREENS = [['sm', '640px'], ['md', '768px'], ['lg', '1024px'], ['xl', '1280px']];

// `build(sel)` produces one stylesheet body; `sel('p-0.5')` hands it the
// escaped class selector for the current variant (".p-0\.5", ".lg\:p-0\.5").
// A literal "." or ":" would otherwise start a new class / pseudo-class.
function withResponsiveVariants(build) {
    const escape = cls => cls.replace(/\./g, '\\.');
    const blocks = [build(cls => `.${escape(cls)}`)];
    RESPONSIVE_SCREENS.forEach(([prefix, minWidth]) => {
        blocks.push(`@media (min-width: ${minWidth}) {\n${build(cls => `.${prefix}\\:${escape(cls)}`)}\n}`);
    });
    return blocks.join('\n');
}

function buildGapOverrideCss() {
    return withResponsiveVariants(sel => {
        const rules = [];
        SPACING_SCALE.forEach(n => {
            const grid = `calc(var(--spacing-grid) * ${n})`;
            const flex = `calc(var(--spacing-gap) * ${n})`;
            rules.push(`.theme-grid-gap${sel(`gap-${n}`)} { row-gap: ${grid} !important; column-gap: ${grid} !important; }`);
            rules.push(`.theme-grid-gap${sel(`gap-x-${n}`)} { column-gap: ${grid} !important; }`);
            rules.push(`.theme-grid-gap${sel(`gap-y-${n}`)} { row-gap: ${grid} !important; }`);
            rules.push(`${sel(`gap-${n}`)}:not(.theme-grid-gap) { row-gap: ${flex} !important; column-gap: ${flex} !important; }`);
            rules.push(`${sel(`gap-x-${n}`)}:not(.theme-grid-gap) { column-gap: ${flex} !important; }`);
            rules.push(`${sel(`gap-y-${n}`)}:not(.theme-grid-gap) { row-gap: ${flex} !important; }`);
        });
        return rules.join('\n');
    });
}

function buildPaddingOverrideCss() {
    // !important belongs INSIDE each declaration (before its own semicolon) -
    // appending it once after a multi-declaration block produces a dangling,
    // invalid trailing fragment that gets silently dropped, leaving every
    // declaration in that rule un-important.
    const sideDecls = {
        p: (x, y) => `padding-block: ${y} !important; padding-inline: ${x} !important;`,
        px: (x) => `padding-inline: ${x} !important;`,
        py: (x, y) => `padding-block: ${y} !important;`,
        pt: (x, y) => `padding-top: ${y} !important;`,
        pb: (x, y) => `padding-bottom: ${y} !important;`,
        pl: (x) => `padding-left: ${x} !important;`,
        pr: (x) => `padding-right: ${x} !important;`
    };
    return withResponsiveVariants(sel => {
        const rules = [];
        Object.entries(sideDecls).forEach(([prefix, makeDecl]) => {
            SPACING_SCALE.forEach(n => {
                const x = `calc(var(--spacing-padding-x) * ${n})`;
                const y = `calc(var(--spacing-padding-y) * ${n})`;
                rules.push(`${sel(`${prefix}-${n}`)} { ${makeDecl(x, y)} }`);
            });
        });
        return rules.join('\n');
    });
}

// Margins (mt-1 under a title, mb-3 under a heading, mt-8 between the
// Overview sections, pl-12 indenting a tag) and space-x/space-y (typography.js
// stacks its sections with space-y-10) are the other half of the templates'
// spacing, and had no override at all - they stayed on Tailwind's fixed
// 0.25rem scale no matter what the sliders said, which is exactly the "does
// this actually resolve to my unit?" doubt the Element tab exists to remove.
// They're gap-shaped (space between siblings, not inside a box), so they
// follow --spacing-gap by default and --spacing-grid under the same
// `theme-grid-gap` marker gap-N uses - space-y is literally Tailwind's
// pre-`gap` way of writing the same thing. Only numeric steps are covered;
// mx-auto/ml-auto/mt-auto aren't lengths and stay as-is.
function buildMarginOverrideCss() {
    const sideDecls = {
        m: v => `margin: ${v} !important;`,
        mx: v => `margin-inline: ${v} !important;`,
        my: v => `margin-block: ${v} !important;`,
        mt: v => `margin-top: ${v} !important;`,
        mb: v => `margin-bottom: ${v} !important;`,
        ml: v => `margin-left: ${v} !important;`,
        mr: v => `margin-right: ${v} !important;`
    };
    // Tailwind's own space-* selector: every child after the first (hidden
    // ones excluded). Its --tw-space-*-reverse axis flip isn't used anywhere
    // in the templates, so the override sets the one leading margin only.
    const siblings = '> :not([hidden]) ~ :not([hidden])';
    return withResponsiveVariants(sel => {
        const rules = [];
        Object.entries(sideDecls).forEach(([prefix, makeDecl]) => {
            SPACING_SCALE.forEach(n => {
                rules.push(`${sel(`${prefix}-${n}`)} { ${makeDecl(`calc(var(--spacing-gap) * ${n})`)} }`);
            });
        });
        SPACING_SCALE.forEach(n => {
            const grid = `calc(var(--spacing-grid) * ${n})`;
            const flex = `calc(var(--spacing-gap) * ${n})`;
            rules.push(`.theme-grid-gap${sel(`space-y-${n}`)} ${siblings} { margin-top: ${grid} !important; }`);
            rules.push(`.theme-grid-gap${sel(`space-x-${n}`)} ${siblings} { margin-left: ${grid} !important; }`);
            rules.push(`${sel(`space-y-${n}`)}:not(.theme-grid-gap) ${siblings} { margin-top: ${flex} !important; }`);
            rules.push(`${sel(`space-x-${n}`)}:not(.theme-grid-gap) ${siblings} { margin-left: ${flex} !important; }`);
        });
        return rules.join('\n');
    });
}

// Every PALETTE_COLOR_KEYS var gets a derived "R G B" channel companion
// (--primary-rgb, etc.) alongside its normal value - preview-only, not part
// of the exported Code view (buildCodeOutput reads state.vars directly,
// never this function). This is what lets buildPreviewDocument's Tailwind
// config below use the `rgb(var(--x-rgb) / <alpha-value>)` pattern instead
// of a plain `var(--x)`: Tailwind can only blend a `/NN` opacity modifier
// (bg-primary/40, text-primary/40, etc.) into a color it can decompose into
// channels - a bare CSS-variable reference holding an arbitrary oklch()/hex
// string isn't decomposable, so every opacity-modified utility on a theme
// color silently generated NO rule at all (not a faded color - nothing).
// cssColorToHex is the only reliable way to get channels out of whatever
// format the value is actually in (see its own comment on why - modern
// browsers echo oklch()/lab()/etc. back verbatim instead of normalizing).
//
// The same block also carries each color's linked palette-token NAME as a
// CSS string custom property (--link-primary: "tailwind neutral-900"), read
// by the Color Palette preview template via `content: var(--link-<key>)`.
// Not a window.__tokenLinks script global: a script only re-runs on a full
// srcdoc reload, and renderPreview deliberately avoids reloads - it patches
// this one <style>'s text in place on every edit - so a global would show
// the link as it was when the template first loaded, not the one just
// picked. Riding along in the patched block means a pick updates the
// label the same instant it updates the swatch, and a light/dark switch
// swaps both together (`links` defaults to the active mode's map, which is
// what `vars` is always taken from too).
function cssVarBlockFor(vars, links = tokenLinks[state.mode]) {
    const lines = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`);
    if (vars['shadow-color']) {
        lines.push(`  --shadow-color-a: rgb(from var(--shadow-color) r g b / var(--shadow-opacity, 1));`);
    }
    PALETTE_COLOR_KEYS.forEach(key => {
        const hex = cssColorToHex(vars[key]);
        if (hex) lines.push(`  --${key}-rgb: ${hexToRgb(hex).join(' ')};`);
    });
    lines.push(`  --link-mode: ${JSON.stringify(state.mode)};`);
    LINKABLE_COLOR_KEYS.forEach(key => {
        const link = links[key];
        // JSON.stringify yields a valid double-quoted CSS string - the token
        // name is the only untrusted-ish part and palette names never carry
        // quotes, but escaping is free.
        lines.push(`  --link-${key}: ${JSON.stringify(link ? `${link.source} ${link.name}` : 'unlinked')};`);
    });
    return lines.join('\n');
}

function buildPreviewDocument(vars, templateHtml) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"><\/script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        // rgb(var(--x-rgb) / <alpha-value>) - not a plain var(--x) - is what
        // makes opacity-modified utilities (bg-primary/40, text-primary/40,
        // hover:bg-primary/90, ...) actually blend instead of silently
        // generating nothing. <alpha-value> is a real Tailwind placeholder:
        // it's substituted with 1 for an unmodified utility (bg-primary) or
        // the requested fraction for a modified one, so this is one pattern
        // for both - see cssVarBlockFor above for where --x-rgb comes from.
        colors: {
          background: 'rgb(var(--background-rgb) / <alpha-value>)', foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
          card: 'rgb(var(--card-rgb) / <alpha-value>)', 'card-foreground': 'rgb(var(--card-foreground-rgb) / <alpha-value>)',
          popover: 'rgb(var(--popover-rgb) / <alpha-value>)', 'popover-foreground': 'rgb(var(--popover-foreground-rgb) / <alpha-value>)',
          primary: 'rgb(var(--primary-rgb) / <alpha-value>)', 'primary-foreground': 'rgb(var(--primary-foreground-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)', 'secondary-foreground': 'rgb(var(--secondary-foreground-rgb) / <alpha-value>)',
          muted: 'rgb(var(--muted-rgb) / <alpha-value>)', 'muted-foreground': 'rgb(var(--muted-foreground-rgb) / <alpha-value>)',
          accent: 'rgb(var(--accent-rgb) / <alpha-value>)', 'accent-foreground': 'rgb(var(--accent-foreground-rgb) / <alpha-value>)',
          destructive: 'rgb(var(--destructive-rgb) / <alpha-value>)', 'destructive-foreground': 'rgb(var(--destructive-foreground-rgb) / <alpha-value>)',
          border: 'rgb(var(--border-rgb) / <alpha-value>)', input: 'rgb(var(--input-rgb) / <alpha-value>)', ring: 'rgb(var(--ring-rgb) / <alpha-value>)',
          'chart-1': 'rgb(var(--chart-1-rgb) / <alpha-value>)', 'chart-2': 'rgb(var(--chart-2-rgb) / <alpha-value>)', 'chart-3': 'rgb(var(--chart-3-rgb) / <alpha-value>)',
          'chart-4': 'rgb(var(--chart-4-rgb) / <alpha-value>)', 'chart-5': 'rgb(var(--chart-5-rgb) / <alpha-value>)',
          sidebar: 'rgb(var(--sidebar-rgb) / <alpha-value>)', 'sidebar-foreground': 'rgb(var(--sidebar-foreground-rgb) / <alpha-value>)',
          'sidebar-primary': 'rgb(var(--sidebar-primary-rgb) / <alpha-value>)', 'sidebar-primary-foreground': 'rgb(var(--sidebar-primary-foreground-rgb) / <alpha-value>)',
          'sidebar-accent': 'rgb(var(--sidebar-accent-rgb) / <alpha-value>)', 'sidebar-accent-foreground': 'rgb(var(--sidebar-accent-foreground-rgb) / <alpha-value>)',
          'sidebar-border': 'rgb(var(--sidebar-border-rgb) / <alpha-value>)', 'sidebar-ring': 'rgb(var(--sidebar-ring-rgb) / <alpha-value>)'
        },
        borderRadius: {
          // Every bg-card container across the templates uses rounded-lg/xl -
          // never rounded-sm/md, which are reserved for form inputs/badges -
          // so mapping the small end to --radius-field and the large end to
          // --radius-card lets the two sidebar sliders adjust them independently
          // without touching any template markup. Buttons use the dedicated
          // rounded-btn utility below, tied to --radius-button instead.
          //
          // The +/- px steps are shadcn's own derivation (radius-sm = radius
          // - 4px, etc.), which is why they're kept - but at the "none" token
          // (0rem) and Atlassian's radius.xsmall (2px) they went negative,
          // and a negative border-radius is an invalid declaration the
          // browser drops entirely (square corners, not small ones). max()
          // floors each derived step at 0 so every token on the scale
          // produces a valid radius. Bare "rounded" (Tailwind's DEFAULT,
          // used on segmented-control chips and code spans) had no entry
          // and fell through to Tailwind's fixed 0.25rem - it's a field-
          // scale radius, mapped alongside sm. rounded-full is deliberately
          // NOT mapped: it's the pill/circle case (Atlassian radius.full),
          // not a step on this scale - see the radius token tables above.
          sm: 'max(0px, calc(var(--radius-field) - 4px))', DEFAULT: 'max(0px, calc(var(--radius-field) - 4px))',
          md: 'max(0px, calc(var(--radius-field) - 2px))',
          lg: 'var(--radius-card)', xl: 'calc(var(--radius-card) + 4px)', '2xl': 'calc(var(--radius-card) + 8px)',
          btn: 'var(--radius-button)'
        },
        fontFamily: {
          sans: ['var(--font-sans)'], serif: ['var(--font-serif)'], mono: ['var(--font-mono)'],
          // Typography sets as utilities (font-heading, text-heading, ...) -
          // see typeFontFamilyConfig/typeFontSizeConfig.
          ${typeFontFamilyConfig()}
        },
        fontSize: {
          ${typeFontSizeConfig()}
        },
        boxShadow: {
          '2xs': 'var(--shadow-offset-x) var(--shadow-offset-y) calc(var(--shadow-blur) * 0.5) var(--shadow-spread) var(--shadow-color-a)',
          xs: 'var(--shadow-offset-x) var(--shadow-offset-y) var(--shadow-blur) var(--shadow-spread) var(--shadow-color-a)',
          sm: 'var(--shadow-offset-x) var(--shadow-offset-y) var(--shadow-blur) var(--shadow-spread) var(--shadow-color-a), var(--shadow-offset-x) calc(var(--shadow-offset-y) + 1px) calc(var(--shadow-blur) * 0.5) var(--shadow-spread) var(--shadow-color-a)',
          DEFAULT: 'var(--shadow-offset-x) calc(var(--shadow-offset-y) * 1.5) calc(var(--shadow-blur) * 1.2) var(--shadow-spread) var(--shadow-color-a)',
          md: 'var(--shadow-offset-x) calc(var(--shadow-offset-y) * 2) calc(var(--shadow-blur) * 1.5) var(--shadow-spread) var(--shadow-color-a)',
          lg: 'var(--shadow-offset-x) calc(var(--shadow-offset-y) * 3) calc(var(--shadow-blur) * 2) var(--shadow-spread) var(--shadow-color-a)',
          xl: 'var(--shadow-offset-x) calc(var(--shadow-offset-y) * 4) calc(var(--shadow-blur) * 3) var(--shadow-spread) var(--shadow-color-a)',
          '2xl': 'var(--shadow-offset-x) calc(var(--shadow-offset-y) * 6) calc(var(--shadow-blur) * 4) var(--shadow-spread) var(--shadow-color-a)'
        }
      }
    }
  };
<\/script>
${buildTypeHeadHtml(vars)}
<style id="theme-vars">
  :root {
${cssVarBlockFor(vars)}
  }
</style>
<style>
  body { background: var(--background); color: var(--foreground); font-family: var(--font-sans); margin: 0; letter-spacing: var(--tracking-normal, 0); }
</style>
<style id="padding-override">
${buildPaddingOverrideCss()}
</style>
<style id="gap-override">
${buildGapOverrideCss()}
</style>
<style id="margin-override">
${buildMarginOverrideCss()}
</style>
</head>
<body>
${templateHtml}
</body>
</html>`;
}

function getTemplateHtml(key) {
    const templates = (typeof window !== 'undefined' && window.THEME_TEMPLATES) || {};
    if (templates[key]) return templates[key];
    return `<div style="padding:2rem;font-family:sans-serif;color:var(--muted-foreground)">Template "${key}" not built yet.</div>`;
}

// The iframe is a full page reload (via srcdoc) only when the template
// itself needs to change - Tailwind's CDN script has to re-run its JIT
// compile for new markup, which is unavoidable there. But a plain color/
// property edit doesn't touch markup at all, only CSS variable *values* -
// rewriting the whole document for that forced a full reload (blank flash,
// Tailwind recompiling from scratch) on every keystroke/slider tick. Instead,
// once a template is loaded, edits patch the existing "theme-vars" <style>
// element's text in place: a CSS custom-property update, not a navigation,
// so there's nothing to flicker.
let previewLoadedTemplate = null;

function renderPreview() {
    const iframe = document.getElementById('previewFrame');
    const vars = currentVars();

    if (previewLoadedTemplate === state.activePreview && iframe.contentDocument && iframe.contentDocument.getElementById('theme-vars')) {
        iframe.contentDocument.getElementById('theme-vars').textContent = `:root {\n${cssVarBlockFor(vars)}\n}`;
        // A family edit can need a Google Fonts face the document hasn't
        // loaded yet - patch the <link>/legend meta in place too, same
        // no-reload path.
        syncPreviewTypeHead(iframe.contentDocument, vars);
        return;
    }

    previewLoadedTemplate = state.activePreview;
    iframe.srcdoc = buildPreviewDocument(vars, getTemplateHtml(state.activePreview));
}

function renderAll() {
    renderColorGroups();
    renderTypographyTab();
    renderElementTab();
    renderThemePickerButton();
    renderPreview();
}

// --- Code modal ---
// Marker that heads the token-map comment appended to the export. Import
// looks for exactly this string to pull the map back out, so the two must
// agree - defined once here for both.
const TOKEN_LINKS_MARKER = 'theme-editor:token-links';

// Each palette-sourced color gets its linked token as a trailing comment
// (`--primary: #171717; /* tailwind neutral-900 */`) - or `/* unlinked */`
// when nothing accounts for it - so a reader of the exported CSS can see
// the mapping without opening the editor. Then the whole map is repeated
// as JSON inside one comment block: the per-line comments are for humans,
// the block is for carrying the mapping into a design-token file (and for
// Import to restore exact links instead of re-guessing nearest swatches -
// see the tokenLinks comment for why a hex alone can't name its token).
// Both are comments, so the output stays plain `--var: value;` CSS that
// Import (and tweakcn) parse exactly as before.
// Measurement counterpart of the color link comment above: the radius/
// spacing keys have no tokenLinks entry (their token is a pure function of
// value + activePaletteSource, see nearest*TokenIndex), so the name is
// re-derived here at export time - `--spacing-gap: 0.25rem; /* tailwind 1
// (4px) */`. The stored value is always on-scale after
// snapMeasurementsToScale, but if a hand-edited custom theme in
// localStorage somehow isn't, the comment says so instead of claiming a
// token the preview isn't actually rendering. Returns '' for any other key.
function tokenComment(key, value) {
    const isRadius = RADIUS_KEYS.includes(key);
    // --type-<set>-size / -leading sit on the typography scale (text-xs..,
    // font.size.*) rather than the spacing one - same comment shape so the
    // export reads uniformly: value, then the token it was picked from.
    const typeProp = /^type-[a-z]+-(size|leading)$/.exec(key);
    if (typeProp) {
        const tokens = typeProp[1] === 'size' ? currentTypeSizeTokens() : currentTypeLeadingTokens();
        const names = typeProp[1] === 'size' ? currentTypeSizeNames() : currentTypeLeadingNames();
        const rem = measurementToRem(value, 1);
        const index = nearestTypeTokenIndex(tokens, rem);
        const label = `${activePaletteSource} ${names[index]} (${remToPx(tokens[index])}px)`;
        const exact = Math.abs(tokens[index] - rem) < 0.0001;
        return exact ? ` /* ${label} */` : ` /* off-scale - nearest ${label} */`;
    }
    if (!isRadius && !SPACING_KEYS.includes(key)) return '';
    const tokens = isRadius ? currentRadiusTokens() : currentSpacingTokens();
    const names = isRadius ? currentRadiusNames() : currentSpacingNames();
    const rem = measurementToRem(value, isRadius ? 0.5 : 0.25);
    const index = isRadius ? nearestRadiusTokenIndex(rem) : nearestSpacingTokenIndex(rem);
    const label = `${activePaletteSource} ${names[index]} (${remToPx(tokens[index])}px)`;
    const exact = Math.abs(tokens[index] - rem) < 0.0001;
    return exact ? ` /* ${label} */` : ` /* off-scale - nearest ${label} */`;
}

function buildCodeOutput() {
    const block = (mode) => Object.entries(state.vars[mode]).map(([k, v]) => {
        const link = tokenLinks[mode][k];
        let note = '';
        if (link) note = ` /* ${link.source} ${link.name} */`;
        else if (LINKABLE_COLOR_KEYS.includes(k)) note = ' /* unlinked */';
        else note = tokenComment(k, v);
        return `  --${k}: ${v};${note}`;
    }).join('\n');
    const tokenMap = {};
    ['light', 'dark'].forEach(mode => {
        tokenMap[mode] = {};
        LINKABLE_COLOR_KEYS.forEach(key => {
            const link = tokenLinks[mode][key];
            if (link) tokenMap[mode][key] = { source: link.source, name: link.name, hex: link.hex };
        });
    });
    return `:root {\n${block('light')}\n}\n\n.dark {\n${block('dark')}\n}\n\n/* ${TOKEN_LINKS_MARKER}\n${JSON.stringify(tokenMap, null, 2)}\n*/`;
}

// --- Event wiring ---
document.addEventListener('DOMContentLoaded', () => {
    loadCustomThemesFromStorage();
    buildColorPalettePopover();
    loadTheme('Default');

    // Sidebar resize handle - drag sets --ui-sidebar-width directly (clamped
    // to the CSS min/max-width already on .sidebar, so the drag can't force
    // it narrower/wider than what the layout allows). Pointer capture keeps
    // move/up events targeting the handle even while dragging over the
    // cross-document preview iframe.
    (() => {
        const handle = document.getElementById('sidebarResizeHandle');
        const sidebar = document.querySelector('.sidebar');
        const root = document.documentElement;
        const MIN_WIDTH = 280;
        const MAX_WIDTH = 640;

        handle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            handle.setPointerCapture(e.pointerId);
            handle.classList.add('active');
            document.body.classList.add('resizing-sidebar');
            const startX = e.clientX;
            const startWidth = sidebar.getBoundingClientRect().width;

            const onMove = (moveEvent) => {
                const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (moveEvent.clientX - startX)));
                root.style.setProperty('--ui-sidebar-width', `${next}px`);
            };
            const onUp = () => {
                handle.classList.remove('active');
                document.body.classList.remove('resizing-sidebar');
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup', onUp);
            };
            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp);
        });
    })();

    // Sidebar tabs
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector(`.sidebar-panel[data-sidebar-panel="${btn.dataset.sidebarTab}"]`).classList.add('active');
        });
    });

    // Preview tabs
    document.querySelectorAll('.preview-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preview-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activePreview = btn.dataset.preview;
            renderPreview();
        });
    });

    document.getElementById('colorSearchInput').addEventListener('input', renderColorGroups);
    document.getElementById('toggleAllColorGroupsButton').addEventListener('click', () => {
        const allOpen = ALL_COLOR_GROUPS.every(g => openGroups.has(g.key));
        setAllColorGroupsOpen(!allOpen);
    });
    // "Snap all to palette" - one undo step for the whole batch (pushUndo
    // once, then write links directly rather than via setVar, which would
    // record a step per key). Only the ACTIVE mode's unlinked keys are
    // touched; already-linked fields keep the token they were picked as.
    document.getElementById('snapAllColorsButton').addEventListener('click', () => {
        const unlinked = unlinkedColorKeys();
        if (!unlinked.length) return;
        pushUndo();
        Object.assign(tokenLinks[state.mode], snapVarsToPalette(state.vars[state.mode], activePaletteSource, unlinked));
        renderAll();
    });

    // Theme picker
    document.getElementById('themePickerButton').addEventListener('click', () => {
        const menu = document.getElementById('themePickerMenu');
        menu.hidden = !menu.hidden;
        if (!menu.hidden) { renderThemePickerList(); document.getElementById('themeSearchInput').focus(); }
    });
    document.getElementById('themeSearchInput').addEventListener('input', renderThemePickerList);
    document.addEventListener('click', (e) => {
        const group = document.querySelector('.toolbar-group');
        if (!group.contains(e.target)) document.getElementById('themePickerMenu').hidden = true;
    });

    // Palette-source switcher (Tailwind / Atlassian) - controls which swatch
    // grid the color popover shows, independent of the active theme.
    document.getElementById('palettePickerButton').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('palettePickerMenu').hidden = !document.getElementById('palettePickerMenu').hidden;
    });
    document.querySelectorAll('[data-palette-source]').forEach(btn => {
        btn.addEventListener('click', () => {
            activePaletteSource = btn.dataset.paletteSource;
            document.getElementById('palettePickerLabel').textContent = PALETTE_SOURCES[activePaletteSource].label.replace(' v4', '');
            document.querySelectorAll('[data-palette-source]').forEach(b => b.classList.toggle('active', b === btn));
            renderColorPopoverGrid();
            // The Radius/Padding/Gap/Grid token SETS are source-dependent
            // (Tailwind vs Atlassian scales don't line up), so a value that
            // sat exactly on the old scale can be off the new one. Snap the
            // stored vars themselves - not just the slider positions - so the
            // preview renders the token the sidebar now names; without this
            // the slider re-snapped visually while the preview kept the old
            // scale's rem (see snapMeasurementsToScale). One undo entry, and
            // only when something actually moved - snapshotted BEFORE the
            // snap (pushUndo after the fact would capture the already-moved
            // vars, and undo could never roll them back).
            const preSwitch = JSON.stringify({ vars: state.vars, tokenLinks });
            const lightMoved = snapMeasurementsToScale(state.vars.light);
            const darkMoved = snapMeasurementsToScale(state.vars.dark);
            if (lightMoved || darkMoved) {
                undoStack.push(preSwitch);
                if (undoStack.length > 50) undoStack.shift();
                redoStack = [];
                updateUndoRedoButtons();
                renderPreview();
            }
            // Field names are resolved against activePaletteSource - re-derive them.
            renderColorGroups();
            renderElementTab();
            // Type-set size/line-height sliders step through a source-
            // dependent scale too (text-xs.. vs font.size.*).
            renderTypographyTab();
            document.getElementById('palettePickerMenu').hidden = true;
        });
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#palettePickerButton') && !e.target.closest('#palettePickerMenu')) {
            document.getElementById('palettePickerMenu').hidden = true;
        }
    });

    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        state.mode = state.mode === 'light' ? 'dark' : 'light';
        document.getElementById('darkModeToggle').innerHTML = state.mode === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        renderAll();
    });

    // Undo/redo - snapshots carry tokenLinks alongside vars (see pushUndo),
    // so a field's displayed/linked palette token rolls back in lockstep
    // with its value instead of staying on whatever was picked most recently.
    document.getElementById('undoButton').addEventListener('click', () => {
        if (!undoStack.length) return;
        redoStack.push(JSON.stringify({ vars: state.vars, tokenLinks }));
        const snap = JSON.parse(undoStack.pop());
        state.vars = snap.vars;
        tokenLinks = snap.tokenLinks;
        updateUndoRedoButtons();
        renderAll();
    });
    document.getElementById('redoButton').addEventListener('click', () => {
        if (!redoStack.length) return;
        undoStack.push(JSON.stringify({ vars: state.vars, tokenLinks }));
        const snap = JSON.parse(redoStack.pop());
        state.vars = snap.vars;
        tokenLinks = snap.tokenLinks;
        updateUndoRedoButtons();
        renderAll();
    });

    // Reset
    document.getElementById('resetButton').addEventListener('click', () => {
        pushUndo();
        state.vars = { light: { ...state.loadedVars.light }, dark: { ...state.loadedVars.dark } };
        tokenLinks = { light: { ...loadedTokenLinks.light }, dark: { ...loadedTokenLinks.dark } };
        renderAll();
    });

    // Typography inputs
    document.getElementById('fontSansSelect').addEventListener('change', (e) => setVar('font-sans', e.target.value));
    document.getElementById('fontSerifSelect').addEventListener('change', (e) => setVar('font-serif', e.target.value));
    document.getElementById('fontMonoSelect').addEventListener('change', (e) => setVar('font-mono', e.target.value));
    const syncLetterSpacing = (val) => {
        document.getElementById('letterSpacingRange').value = val;
        document.getElementById('letterSpacingNumber').value = val;
        setVar('tracking-normal', `${val}em`);
    };
    document.getElementById('letterSpacingRange').addEventListener('input', (e) => syncLetterSpacing(e.target.value));
    document.getElementById('letterSpacingNumber').addEventListener('input', (e) => syncLetterSpacing(e.target.value));

    // Element tab
    // Same index-into-real-token-scale pattern as spacing (see
    // makeSpacingSync below) - the range value is a currentRadiusTokens()
    // index, not a rem amount, and the number field shows the resolved
    // token's real name (Tailwind's sm/md/lg/... or Atlassian's radius.*).
    const makeRadiusSync = (key, rangeId, numberId) => (tokenIndex) => {
        const rem = currentRadiusTokens()[tokenIndex];
        const numberEl = document.getElementById(numberId);
        numberEl.value = currentRadiusNames()[tokenIndex];
        numberEl.title = `${rem}rem`;
        setVar(key, `${rem}rem`);
    };
    [['radius-card', 'cardRadiusRange', 'cardRadiusNumber'], ['radius-field', 'fieldRadiusRange', 'fieldRadiusNumber'],
     ['radius-button', 'buttonRadiusRange', 'buttonRadiusNumber']]
        .forEach(([key, rangeId, numberId]) => {
            const sync = makeRadiusSync(key, rangeId, numberId);
            document.getElementById(rangeId).addEventListener('input', (e) => sync(e.target.value));
        });

    // The range input's value is a currentSpacingTokens() index, not a rem
    // amount - the paired number field is a readonly readout of the
    // resolved token's real name (Tailwind's own multiplier name, or
    // Atlassian's space.* token - see currentSpacingNames), not a free-text
    // input, so only the range needs a listener. Reads both sets live (not
    // captured at wiring time) so they still resolve correctly after a
    // later Tailwind/Atlassian switch.
    const makeSpacingSync = (key, rangeId, numberId) => (tokenIndex) => {
        const rem = currentSpacingTokens()[tokenIndex];
        const numberEl = document.getElementById(numberId);
        numberEl.value = currentSpacingNames()[tokenIndex];
        numberEl.title = `${rem}rem`;
        setVar(key, `${rem}rem`);
    };
    [['spacing-padding-y', 'paddingYRange', 'paddingYNumber'], ['spacing-padding-x', 'paddingXRange', 'paddingXNumber'],
     ['spacing-gap', 'gapRange', 'gapNumber'], ['spacing-grid', 'gridRange', 'gridNumber']]
        .forEach(([key, rangeId, numberId]) => {
            const sync = makeSpacingSync(key, rangeId, numberId);
            document.getElementById(rangeId).addEventListener('input', (e) => sync(e.target.value));
        });

    // Shadow fields - color is rendered by renderElementTab via
    // createColorFieldRow (into #shadowColorRow), which wires its own
    // palette-popover/reset handlers, same as every Colors-tab field.
    [
        ['shadowOpacityRange', 'shadowOpacityNumber', 'shadow-opacity', ''],
        ['shadowBlurRange', 'shadowBlurNumber', 'shadow-blur', 'px'],
        ['shadowSpreadRange', 'shadowSpreadNumber', 'shadow-spread', 'px'],
        ['shadowOffsetXRange', 'shadowOffsetXNumber', 'shadow-offset-x', 'px'],
        ['shadowOffsetYRange', 'shadowOffsetYNumber', 'shadow-offset-y', 'px']
    ].forEach(([rangeId, numberId, key, unit]) => {
        const sync = (val) => {
            document.getElementById(rangeId).value = val;
            document.getElementById(numberId).value = val;
            setVar(key, `${val}${unit}`);
        };
        document.getElementById(rangeId).addEventListener('input', (e) => sync(e.target.value));
        document.getElementById(numberId).addEventListener('input', (e) => sync(e.target.value));
    });

    // Code modal
    document.getElementById('codeButton').addEventListener('click', () => {
        document.getElementById('codeOutput').textContent = buildCodeOutput();
        document.getElementById('codeModal').hidden = false;
    });
    document.getElementById('closeCodeModal').addEventListener('click', () => document.getElementById('codeModal').hidden = true);
    document.getElementById('copyCodeButton').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('codeOutput').textContent);
    });

    // Import modal
    document.getElementById('importButton').addEventListener('click', () => document.getElementById('importModal').hidden = false);
    document.getElementById('closeImportModal').addEventListener('click', () => document.getElementById('importModal').hidden = true);
    document.getElementById('applyImportButton').addEventListener('click', () => {
        const text = document.getElementById('importTextarea').value;
        const errorEl = document.getElementById('importError');
        errorEl.textContent = '';
        // A Code export carries its token map in a marked comment (see
        // buildCodeOutput) - pull it out BEFORE comments are stripped, and
        // treat a malformed one as absent rather than failing the import.
        let carriedLinks = null;
        const carriedMatch = text.match(new RegExp(`${TOKEN_LINKS_MARKER}\\s*([\\s\\S]*?)\\*/`));
        if (carriedMatch) {
            try { carriedLinks = JSON.parse(carriedMatch[1]); } catch (e) { carriedLinks = null; }
        }
        // Strip every comment first - the export's trailing
        // `/* tailwind neutral-900 */` notes never contain a `;` so they
        // couldn't leak into a value, but a commented-out `/* --old: x; */`
        // in someone's hand-written CSS would otherwise be imported as live.
        const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');
        const parseDecls = (css) => [...css.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k.trim(), v.trim()]);
        // Route `:root {}` and `.dark {}` blocks to their own modes when both
        // are present (the shape our own export and tweakcn's produce) -
        // reading them as one flat list applied every dark value on top of
        // its light twin in whichever mode happened to be active, so a Code
        // -> Import round-trip couldn't reproduce the theme. A paste with no
        // .dark block still goes to the active mode, as before.
        const darkIndex = stripped.search(/\.dark\s*\{/);
        const perMode = darkIndex === -1
            ? { [state.mode]: parseDecls(stripped) }
            : { light: parseDecls(stripped.slice(0, darkIndex)), dark: parseDecls(stripped.slice(darkIndex)) };
        if (!Object.values(perMode).some(decls => decls.length)) {
            errorEl.textContent = 'No --variable: value; declarations found.';
            return;
        }
        pushUndo();
        Object.entries(perMode).forEach(([mode, decls]) => {
            decls.forEach(([key, value]) => { state.vars[mode][key] = value; });
            // Pasted radius/spacing values land on the active token scale the
            // same way loadTheme's do (see snapMeasurementsToScale) - a
            // no-op for keys already on it, so untouched fields don't move.
            snapMeasurementsToScale(state.vars[mode]);
            // Imported values (like a theme's own baked-in defaults) didn't come
            // through the popover, so they need the same link-and-snap pass
            // loadTheme gives every color - limited to the keys this import
            // actually touched, so unrelated fields' existing links are untouched.
            const importedKeys = LINKABLE_COLOR_KEYS.filter(key => decls.some(([k]) => k === key));
            Object.assign(tokenLinks[mode], snapVarsToPalette(state.vars[mode], activePaletteSource, importedKeys));
            // A carried link beats the nearest-swatch guess: it names the
            // exact token that was picked, which the hex alone can't
            // recover (zinc-50/neutral-50/mauve-50 all #fafafa). Only
            // honored when the name really exists in the named source, and
            // the applied hex is that swatch's own, so link and value can't
            // disagree even if the file was hand-edited.
            const carried = carriedLinks && typeof carriedLinks === 'object' ? carriedLinks[mode] : null;
            if (!carried || typeof carried !== 'object') return;
            importedKeys.forEach(key => {
                const link = carried[key];
                if (!link || typeof link.source !== 'string' || typeof link.name !== 'string') return;
                const entry = findPaletteEntryByName(link.source, link.name);
                if (!entry) return;
                state.vars[mode][key] = entry.hex;
                tokenLinks[mode][key] = { source: link.source, name: entry.name, hex: entry.hex.toLowerCase() };
            });
        });
        renderAll();
        document.getElementById('importModal').hidden = true;
        document.getElementById('importTextarea').value = '';
    });

    // Save modal
    document.getElementById('saveButton').addEventListener('click', () => document.getElementById('saveModal').hidden = false);
    document.getElementById('closeSaveModal').addEventListener('click', () => document.getElementById('saveModal').hidden = true);
    document.getElementById('confirmSaveButton').addEventListener('click', () => {
        const name = document.getElementById('saveNameInput').value.trim();
        if (!name) return;
        customThemes[name] = { light: { ...state.vars.light }, dark: { ...state.vars.dark } };
        saveCustomThemes();
        state.themeName = name;
        renderThemePickerButton();
        document.getElementById('saveModal').hidden = true;
        document.getElementById('saveNameInput').value = '';
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
    });
});
