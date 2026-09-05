// Theme Editor v3 - "touch and go" design-system creator. The right pane is
// the Elements gallery (every base element x variant x state, rendered from
// the token chain alone); the left sidebar is the PICKER: select a part in
// the gallery, open a foundation tab (Colors / Space / Radius / Border /
// Shadow / Type), see which entry that part uses (marked), click another
// entry to assign it. A Summary tab collects what the work uses and keeps the
// semantic-role list so values can be reconciled to roles later.
// Work is tracked on the GitHub Project board linked from the root README;
// the board, not a doc, is the source of truth for what gets built.
//
// Preview isolation is structural: the preview is a real <iframe>, a separate
// document from this page. The editor chrome is styled entirely by styles.css
// / panels.css and never touches the design system's CSS variables.
//
// Sibling modules (plain globals, see index.html load order): foundation.js
// (FOUNDATION scales + ref helpers), components.js (ELEMENTS spec, seeding,
// wiring CSS, gallery), panels.js (sidebar panel HTML), dtcg.js (tokens.json
// export/import).

// Local Docker save-server (theme-editor/save-server/) - writes a saved
// system to theme-editor/systems/<name>.json. Independent of localStorage.
const SAVE_SERVER_URL = 'http://localhost:4521';

const STORAGE_KEY = 'themeEditor.savedSystems';
// v1 stored { name: { light, dark } } under this key - still readable, as
// plain semantic vars (links re-snapped, components re-seeded on load).
const LEGACY_STORAGE_KEY = 'themeEditor.savedThemes';

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

// Semantic color roles, as foldable groups in the Colors tab. Signal colors
// first, then element-part roles, then the shadow color (the one non-shadcn
// role: every foundation shadow step draws in it).
const COLOR_GROUPS = [
    { key: 'primary', label: 'Primary', open: true, fields: [['primary', 'Background'], ['primary-foreground', 'Foreground']] },
    { key: 'secondary', label: 'Secondary', open: true, fields: [['secondary', 'Background'], ['secondary-foreground', 'Foreground']] },
    { key: 'accent', label: 'Accent', fields: [['accent', 'Background'], ['accent-foreground', 'Foreground']] },
    { key: 'base', label: 'Base', fields: [['background', 'Background'], ['foreground', 'Foreground']] },
    { key: 'muted', label: 'Muted', fields: [['muted', 'Background'], ['muted-foreground', 'Foreground']] },
    { key: 'destructive', label: 'Destructive', fields: [['destructive', 'Background'], ['destructive-foreground', 'Foreground']] },
    { key: 'chart', label: 'Chart', fields: [['chart-1', 'Chart 1'], ['chart-2', 'Chart 2'], ['chart-3', 'Chart 3'], ['chart-4', 'Chart 4'], ['chart-5', 'Chart 5']] }
];

const ELEMENT_GROUPS = [
    { key: 'card', label: 'Card', fields: [['card', 'Card'], ['card-foreground', 'Card Foreground']] },
    { key: 'popover', label: 'Popover', fields: [['popover', 'Popover'], ['popover-foreground', 'Popover Foreground']] },
    { key: 'border-input', label: 'Border & Input', fields: [['border', 'Border'], ['input', 'Input'], ['ring', 'Ring']] },
    { key: 'sidebar', label: 'Sidebar', fields: [
        ['sidebar', 'Sidebar'], ['sidebar-foreground', 'Sidebar Foreground'],
        ['sidebar-primary', 'Sidebar Primary'], ['sidebar-primary-foreground', 'Sidebar Primary Foreground'],
        ['sidebar-accent', 'Sidebar Accent'], ['sidebar-accent-foreground', 'Sidebar Accent Foreground'],
        ['sidebar-border', 'Sidebar Border'], ['sidebar-ring', 'Sidebar Ring']
    ] },
    { key: 'shadow', label: 'Shadow', fields: [['shadow-color', 'Shadow Color']] }
];

const ALL_COLOR_GROUPS = [...COLOR_GROUPS, ...ELEMENT_GROUPS];

// Every palette-linkable semantic color key (34: the 33 shadcn roles plus
// shadow-color).
const LINKABLE_COLOR_KEYS = ALL_COLOR_GROUPS.flatMap(g => g.fields.map(([key]) => key));
const COLOR_LABELS = Object.fromEntries(ALL_COLOR_GROUPS.flatMap(g => g.fields.map(([key, label]) => [key, g.label === label ? label : `${g.label} ${label}`])));

const SWATCH_KEYS = ['primary', 'secondary', 'accent', 'background'];

// --- Color parsing: paint on a canvas and read the pixel back, since modern
// browsers echo oklch()/lab() back verbatim from getComputedStyle. ---
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

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function colorDistanceSq(hexA, hexB) {
    const [r1, g1, b1] = hexToRgb(hexA);
    const [r2, g2, b2] = hexToRgb(hexB);
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// --- State ---
let allThemes = [DEFAULT_THEME, ...(typeof tweakcnThemes !== 'undefined' ? tweakcnThemes : [])];
let customSystems = {};   // name -> { source, palette, vars, tokenLinks, components }
let customThemes = {};    // legacy v1 saves: name -> { light, dark }

let activePaletteSource = 'tailwind';

let state = {
    themeName: 'Default',
    mode: 'light',
    vars: { light: {}, dark: {} },
    loadedVars: { light: {}, dark: {} },
    // v2's declared palette subset is gone; `families` is kept as "every
    // family of the source" so saves and the DTCG export keep their shape.
    palette: { families: [] },
    loadedPalette: { families: [] },
    components: {},
    loadedComponents: {},
    // User-added Space/Border/Shadow values beyond the source's fixed scale
    // (see foundation.js's CUSTOM_SCALE) - points at that source's slot.
    customScale: emptyCustomScale(),
    loadedCustomScale: emptyCustomScale(),
    // Which sidebar tab is showing (summary | colors | space | radius |
    // border | shadow | type) - the tab decides which prop KIND a click assigns.
    activeTab: 'colors',
    // kind -> prop key, for parts with several props of one kind (padding x/y).
    activeProp: {},
    selection: null           // { element, variant, part, state } | null
};

// Authoritative palette-token link for every semantic color, keyed by mode
// then CSS var key: { source, name, hex }. See v1's rationale: a hex alone
// can't name its token (zinc-50/neutral-50/mauve-50 all #fafafa), so the
// link is resolved once (on pick / snap) and treated as ground truth.
let tokenLinks = { light: {}, dark: {} };
let loadedTokenLinks = { light: {}, dark: {} };

let undoStack = [];
let redoStack = [];

function measurementToRem(raw, fallback) {
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return fallback;
    return /px\s*$/.test(String(raw).trim()) ? num / 16 : num;
}

function remToPx(rem) {
    return Math.round(rem * 16 * 100) / 100;
}

// --- Typography sets ---
// Each set is five CSS vars: --type-<key>-family/-weight/-size/-leading/
// -tracking. Family references the theme's family token (var(--font-sans))
// so the chain set -> family token -> face stays visible. abbr/color are
// editor chrome for the badge shown in the sidebar and the preview gutter.
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

function typeSizeEntries() { return scaleEntries(activePaletteSource, 'typeSize'); }
function typeLeadingEntries() { return scaleEntries(activePaletteSource, 'typeLeading'); }
function typeSizeLeading() { return foundationOf(activePaletteSource).typeSizeLeading; }

function nearestEntryIndex(entries, rem) {
    let bestIndex = 0;
    let bestDist = Infinity;
    entries.forEach((entry, i) => {
        if (entry.rem === null || entry.rem === undefined) return;
        const dist = Math.abs(entry.rem - rem);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });
    return bestIndex;
}

// Nearest scale entry's name when the value sits on the scale, else the raw
// rem - so an off-scale import is never misreported as a token.
function typeTokenLabel(entries, rem) {
    const i = nearestEntryIndex(entries, rem);
    return entries[i] && Math.abs(entries[i].rem - rem) < 0.001 ? entries[i].name : `${rem}rem`;
}

function typeVarKey(setKey, prop) {
    return `type-${setKey}-${prop}`;
}

// Snaps every set's size/leading onto the active source's scale so the
// sidebar names the token the preview renders. Returns whether anything moved.
function snapTypeToScale(vars) {
    let changed = false;
    const sizes = typeSizeEntries();
    const leadings = typeLeadingEntries();
    TYPE_SETS.forEach(set => {
        [['size', sizes, set.size], ['leading', leadings, set.leading]].forEach(([prop, entries, fallback]) => {
            const key = typeVarKey(set.key, prop);
            if (vars[key] === undefined) return;
            const rem = measurementToRem(vars[key], fallback);
            const snapped = `${entries[nearestEntryIndex(entries, rem)].rem}rem`;
            if (vars[key] !== snapped) { vars[key] = snapped; changed = true; }
        });
    });
    return changed;
}

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

// No vendored theme defines shadow-color; every foundation shadow step draws
// in it, so it must exist.
function withShadowFallback(vars) {
    return { 'shadow-color': '#000000', ...vars };
}

function withFallbacks(vars) {
    return withTypographyFallback(withShadowFallback(vars));
}

function flattenVars(theme) {
    const t = theme.cssVars.theme || {};
    return {
        light: withFallbacks({ ...t, ...(theme.cssVars.light || {}) }),
        dark: withFallbacks({ ...t, ...(theme.cssVars.dark || {}) })
    };
}

// --- Palette helpers ---
function isSpecialName(name) {
    return POPOVER_SPECIALS.some(([, special]) => special === name);
}

// Every family of the active source. v3 shows the whole palette; the
// "subset" a system declares is simply everything (see state.palette).
function allFamilies() {
    return [...foundationOf(activePaletteSource).color.families()];
}

// A semantic color "is linked" when its link names a swatch (or a special)
// of the active source.
function isLinkInPalette(link) {
    return !!link && link.source === activePaletteSource;
}

// --- Load / undo ---
function undoSnapshot() {
    return JSON.stringify({ source: activePaletteSource, vars: state.vars, tokenLinks, components: state.components, palette: state.palette, customScale: state.customScale });
}

function restoreSnapshot(json) {
    const snap = JSON.parse(json);
    // A Tailwind<->Atlassian switch remaps every ref, so a snapshot taken
    // under the other source only makes sense with that source active.
    if (snap.source && snap.source !== activePaletteSource && typeof setPaletteSourceUi === 'function') {
        activePaletteSource = snap.source;
        setPaletteSourceUi(snap.source);
    }
    state.vars = snap.vars;
    tokenLinks = snap.tokenLinks;
    state.components = snap.components || state.components;
    state.palette = snap.palette || state.palette;
    state.customScale = setCustomScaleFor(activePaletteSource, cloneCustomScale(snap.customScale));
}

function pushUndo() {
    undoStack.push(undoSnapshot());
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
}

function pushUndoSnapshot(json) {
    undoStack.push(json);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
}

function seedComponentsFor(vars) {
    const radiusRem = measurementToRem(vars.radius, 0.5);
    return typeof seedComponentTokens === 'function' ? seedComponentTokens(activePaletteSource, { radiusRem }) : {};
}

function applyLoaded({ name, vars, links, families, components, customScale }) {
    state.themeName = name;
    state.vars = { light: { ...vars.light }, dark: { ...vars.dark } };
    state.loadedVars = { light: { ...vars.light }, dark: { ...vars.dark } };
    tokenLinks = { light: { ...links.light }, dark: { ...links.dark } };
    loadedTokenLinks = { light: { ...links.light }, dark: { ...links.dark } };
    state.palette = { families: allFamilies() };
    state.loadedPalette = { families: [...state.palette.families] };
    state.components = { ...components };
    state.loadedComponents = { ...components };
    // activePaletteSource is already correct here - loadTheme flips it (for a
    // saved system) before calling applyLoaded.
    state.customScale = setCustomScaleFor(activePaletteSource, cloneCustomScale(customScale));
    state.loadedCustomScale = cloneCustomScale(state.customScale);
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
    renderAll();
}

function loadTheme(name) {
    const saved = customSystems[name];
    if (saved && saved.vars) {
        if (saved.source && saved.source !== activePaletteSource) setPaletteSourceUi(saved.source);
        const vars = { light: withFallbacks({ ...saved.vars.light }), dark: withFallbacks({ ...saved.vars.dark }) };
        const links = saved.tokenLinks || { light: {}, dark: {} };
        applyLoaded({
            name, vars, links,
            families: saved.palette && saved.palette.families,
            components: { ...seedComponentsFor(vars.light), ...(saved.components || {}) },
            customScale: saved.customScale
        });
        return;
    }
    const legacy = customThemes[name];
    const theme = allThemes.find(t => t.title === name || t.name === name);
    const flat = legacy
        ? { light: withFallbacks({ ...legacy.light }), dark: withFallbacks({ ...legacy.dark }) }
        : flattenVars(theme || DEFAULT_THEME);
    // Every linkable color gets linked and snapped to its nearest swatch of
    // the whole source; the palette subset is then derived from what got used.
    const links = {
        light: snapVarsToPalette(flat.light, activePaletteSource, LINKABLE_COLOR_KEYS),
        dark: snapVarsToPalette(flat.dark, activePaletteSource, LINKABLE_COLOR_KEYS)
    };
    snapTypeToScale(flat.light);
    snapTypeToScale(flat.dark);
    applyLoaded({ name, vars: flat, links, families: null, components: seedComponentsFor(flat.light) });
}

function currentVars() {
    return state.vars[state.mode];
}

// True while the user is typing/dragging inside the sidebar panel - rebuilding
// the panel's DOM mid-keystroke would steal focus from that control.
function panelHasFocus() {
    const active = document.activeElement;
    const body = document.getElementById('panelBody');
    return !!(active && body && body.contains(active) && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName));
}

// `link` (when passed) replaces the field's tokenLinks entry atomically with
// the value write, both landing after pushUndo's snapshot.
function setVar(key, value, { record = true, link } = {}) {
    if (record) pushUndo();
    state.vars[state.mode][key] = value;
    if (link !== undefined) {
        if (link) tokenLinks[state.mode][key] = link;
        else delete tokenLinks[state.mode][key];
    }
    renderPreview();
    if (key.startsWith('type-') || key.startsWith('font-') || key.startsWith('tracking')) renderTypographyTab();
    if (panelHasFocus()) {
        // Keep the control the user is in; the panel's own readouts refresh
        // on the next full render (blur, tab switch, gallery click).
            renderSemanticRolesIfMounted();
        return;
    }
    renderPanel();
}

function setComponentToken(id, ref) {
    pushUndo();
    state.components[id] = ref;
    renderAll();
}

function clearComponentToken(id) {
    if (!Object.prototype.hasOwnProperty.call(state.components, id)) return;
    pushUndo();
    delete state.components[id];
    renderAll();
}

// Adds a user-defined entry to one of the Space/Border-width/Border-style/
// Shadow scales (see panels.js's `allowAdd` add-row). Returns an error string
// on failure (nothing is changed), or null on success.
function addCustomScaleEntry(kind, rawName, rawValue) {
    const name = String(rawName || '').trim();
    const value = String(rawValue || '').trim();
    const label = (typeof PANEL_KIND_LABELS !== 'undefined' && PANEL_KIND_LABELS[kind]) || kind;
    if (!name || !value) return 'Enter a name and a value.';
    const id = cssIdent(name);
    if (scaleEntries(activePaletteSource, kind).some(e => cssIdent(e.name) === id)) {
        return `"${name}" collides with an existing ${label} entry.`;
    }
    let entry;
    if (kind === 'borderStyle') {
        entry = { name, value, px: null };
    } else if (kind === 'shadow') {
        const nums = value.split(/\s+/).map(Number);
        if (nums.length !== 5 || nums.some(n => !Number.isFinite(n))) {
            return 'Shadow needs 5 numbers: x y blur spread alpha (e.g. 0 4 12 0 0.15).';
        }
        const layers = [nums];
        entry = { name, layers, value: shadowLayersToCss(layers), px: null };
    } else {
        const rem = measurementToRem(value, NaN);
        if (!Number.isFinite(rem)) return 'Enter a number (rem) or a px value, e.g. 4.5 or 72px.';
        entry = remEntry(name, rem);
    }
    pushUndo();
    state.customScale[kind].push(entry);
    renderAll();
    return null;
}

function updateUndoRedoButtons() {
    document.getElementById('undoButton').disabled = undoStack.length === 0;
    document.getElementById('redoButton').disabled = redoStack.length === 0;
}

// --- Sidebar tabs ---
const SIDEBAR_TABS = ['summary', 'colors', 'space', 'radius', 'border', 'shadow', 'type'];

function showSidebarTab(key) {
    if (!SIDEBAR_TABS.includes(key)) return;
    state.activeTab = key;
    document.querySelectorAll('.sidebar-tab').forEach(b => b.classList.toggle('active', b.dataset.sidebarTab === key));
    renderPanel();
}

// --- Semantic roles (Summary tab) ---
// The 34 palette-linked roles as foldable groups, rendered into the Summary
// panel's #semanticRolesMount so a role can still be re-linked through the
// palette popover and reconciled with what the work actually uses.
const openGroups = new Set(ALL_COLOR_GROUPS.filter(g => g.open).map(g => g.key));

function renderFoldableGroups(groups, container) {
    container.innerHTML = '';
    const vars = currentVars();

    groups.forEach(group => {
        const details = document.createElement('details');
        details.className = 'color-group';
        details.dataset.group = group.key;
        details.open = openGroups.has(group.key);
        details.addEventListener('toggle', () => {
            if (details.open) openGroups.add(group.key); else openGroups.delete(group.key);
        });

        const summary = document.createElement('summary');
        summary.className = 'color-group-label';
        const summaryText = document.createElement('span');
        summaryText.textContent = group.label;
        const summarySwatches = document.createElement('span');
        summarySwatches.className = 'color-group-fold-swatches';
        group.fields.forEach(([key]) => {
            const dot = document.createElement('span');
            dot.className = 'color-group-fold-swatch';
            dot.style.backgroundColor = cssColorToHex(vars[key]) || '#000000';
            summarySwatches.appendChild(dot);
        });
        summary.append(summaryText, summarySwatches);
        details.appendChild(summary);

        const body = document.createElement('div');
        body.className = 'color-group-body';
        group.fields.forEach(([key, label]) => body.appendChild(createColorFieldRow(key, label, vars)));
        details.appendChild(body);
        container.appendChild(details);
    });
}

// Every semantic color whose active-mode link doesn't name a swatch of the
// active source (no link, or a link from the other source).
function unlinkedColorKeys() {
    return LINKABLE_COLOR_KEYS.filter(key => !isLinkInPalette(tokenLinks[state.mode][key]));
}

// Renders the roles section (link summary line + snap-all + groups) into the
// Summary panel's mount. No-op when the Summary panel isn't showing.
function renderSemanticRoles() {
    const mount = document.getElementById('semanticRolesMount');
    if (!mount) return;
    mount.innerHTML = '';
    const unlinked = unlinkedColorKeys();
    const total = LINKABLE_COLOR_KEYS.length;

    const summaryRow = document.createElement('div');
    summaryRow.className = 'color-link-summary';
    const text = document.createElement('span');
    text.className = 'color-link-summary-text' + (unlinked.length ? ' color-link-summary-text-warning' : '');
    text.textContent = `${total - unlinked.length} of ${total} roles linked (${state.mode})`;
    text.title = unlinked.length ? `Unlinked: ${unlinked.join(', ')}` : `Every role resolves to a ${foundationOf(activePaletteSource).label} swatch`;
    summaryRow.appendChild(text);
    if (unlinked.length) {
        const snap = document.createElement('button');
        snap.className = 'color-link-summary-button';
        snap.textContent = 'Snap all to palette';
        snap.addEventListener('click', () => {
            pushUndo();
            Object.assign(tokenLinks[state.mode], snapVarsToPalette(state.vars[state.mode], activePaletteSource, unlinkedColorKeys()));
            renderAll();
        });
        summaryRow.appendChild(snap);
    }
    mount.appendChild(summaryRow);

    const groups = document.createElement('div');
    groups.className = 'color-groups';
    renderFoldableGroups(ALL_COLOR_GROUPS, groups);
    mount.appendChild(groups);
}

function renderSemanticRolesIfMounted() {
    if (document.getElementById('semanticRolesMount')) renderSemanticRoles();
}

// One semantic color row: swatch, label, read-only token-name field, palette
// button, reset. Only a palette swatch may set it - never typed free text.
function createColorFieldRow(key, label, vars) {
    const value = vars[key] || '';
    const hex = cssColorToHex(value) || '#000000';

    const row = document.createElement('div');
    row.className = 'color-field-row';
    row.dataset.key = key;

    const swatch = document.createElement('span');
    swatch.className = 'color-field-swatch';
    swatch.style.backgroundColor = hex;

    const fieldLabel = document.createElement('label');
    fieldLabel.className = 'color-field-label';
    fieldLabel.textContent = label;

    const link = tokenLinks[state.mode][key];
    const inPalette = isLinkInPalette(link);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'color-field-input' + (inPalette ? '' : ' color-field-input-unlinked');
    input.value = inPalette ? link.name : (link ? 'Other source' : 'Unlinked');
    input.title = inPalette
        ? `${foundationOf(activePaletteSource).label} ${link.name}`
        : (link
            ? `Linked to ${(FOUNDATION[link.source] || {}).label || link.source} ${link.name} - not the active design system`
            : 'Not linked to any palette token - pick a swatch, or use "Snap all to palette"');
    input.readOnly = true;
    if (!inPalette) {
        const dot = document.createElement('span');
        dot.className = 'color-field-unlinked-dot';
        dot.title = input.title;
        swatch.appendChild(dot);
    }

    const openPicker = () => openColorPalettePopover(paletteBtn, inPalette ? link.name : null, (newHex, newName) => {
        setVar(key, newHex, { link: { source: activePaletteSource, name: newName, hex: newHex.toLowerCase() } });
    });
    input.addEventListener('click', (e) => { e.stopPropagation(); openPicker(); });

    const paletteBtn = document.createElement('button');
    paletteBtn.className = 'color-field-palette-btn';
    paletteBtn.title = `Pick from the ${foundationOf(activePaletteSource).label} palette`;
    paletteBtn.innerHTML = '<i class="fas fa-swatchbook"></i>';
    paletteBtn.addEventListener('click', (e) => { e.stopPropagation(); openPicker(); });

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

// Jump to a role's row in the Summary tab (used when a tooltip names a role).
function revealSemanticRow(key) {
    const group = ALL_COLOR_GROUPS.find(g => g.fields.some(([k]) => k === key));
    if (!group) return;
    openGroups.add(group.key);
    showSidebarTab('summary');
    const row = document.querySelector(`.color-field-row[data-key="${CSS.escape(key)}"]`);
    if (!row) return;
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row.classList.add('color-field-row-flash');
    setTimeout(() => row.classList.remove('color-field-row-flash'), 1000);
}


// --- Sidebar: Typography ---
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
        if (currentValue) values.add(firstFamily(currentValue));
        [...values].forEach(font => {
            const opt = document.createElement('option');
            opt.value = font;
            opt.textContent = font;
            select.appendChild(opt);
        });
        select.value = currentValue ? firstFamily(currentValue) : list[0];
    };
    populate('fontSansSelect', FONT_OPTIONS.sans, vars['font-sans']);
    populate('fontSerifSelect', FONT_OPTIONS.serif, vars['font-serif']);
    populate('fontMonoSelect', FONT_OPTIONS.mono, vars['font-mono']);

    const tracking = parseFloat(vars['tracking-normal']) || 0;
    document.getElementById('letterSpacingRange').value = tracking;
    document.getElementById('letterSpacingNumber').value = tracking;

    renderTypeSetGroups(vars);
}

const GOOGLE_FONTS = new Set(['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Work Sans', 'Source Serif 4', 'Playfair Display', 'JetBrains Mono', 'Fira Code']);

function firstFamily(value) {
    return (value || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
}

function typeFamilySelection(value) {
    const ref = (value || '').match(/^var\(--font-(sans|serif|mono)\)$/);
    if (ref) return ref[1];
    const face = firstFamily(value);
    return Object.values(FONT_OPTIONS).some(list => list.includes(face)) ? face : 'custom';
}

function resolveTypeFace(vars, setKey) {
    const value = vars[typeVarKey(setKey, 'family')] || '';
    const ref = value.match(/^var\(--font-(sans|serif|mono)\)$/);
    return firstFamily(ref ? vars[`font-${ref[1]}`] : value);
}

// "Sans→Inter · 2xl / 8 · 600" - the one-line readout for a set, shared by
// the sidebar fold line and the preview pages.
function typeSetSummary(vars, set) {
    const familyValue = vars[typeVarKey(set.key, 'family')] || '';
    const ref = familyValue.match(/^var\(--font-(sans|serif|mono)\)$/);
    const face = resolveTypeFace(vars, set.key) || '?';
    const family = ref ? `${ref[1][0].toUpperCase()}${ref[1].slice(1)}→${face}` : face;
    const size = typeTokenLabel(typeSizeEntries(), parseFloat(vars[typeVarKey(set.key, 'size')]) || set.size);
    const leading = typeTokenLabel(typeLeadingEntries(), parseFloat(vars[typeVarKey(set.key, 'leading')]) || set.leading);
    const weight = vars[typeVarKey(set.key, 'weight')] || set.weight;
    return `${family} · ${size} / ${leading} · ${weight}`;
}

// Built once; values refreshed by renderTypeSetGroups so folds and half-typed
// custom families survive re-renders.
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
        badge.style.setProperty('--type-badge-color', set.color);
        title.append(badge, document.createTextNode(set.label));
        const meta = el('span', 'type-set-fold-meta', { id: `typeMeta-${set.key}` });
        summary.append(title, meta);

        const body = el('div', 'color-group-body');

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

        familySelect.addEventListener('change', () => {
            const choice = familySelect.value;
            customInput.hidden = choice !== 'custom';
            if (choice === 'custom') {
                customInput.value = currentVars()[typeVarKey(set.key, 'family')] || '';
                customInput.focus();
                return;
            }
            if (choice === 'sans' || choice === 'serif' || choice === 'mono') {
                setVar(typeVarKey(set.key, 'family'), `var(--font-${choice})`);
                return;
            }
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
            const entry = typeSizeEntries()[i];
            // One undo step for the pair: the paired leading follows with record:false.
            setVar(typeVarKey(set.key, 'size'), `${entry.rem}rem`);
            setVar(typeVarKey(set.key, 'leading'), `${typeSizeLeading()[i]}rem`, { record: false });
        });
        leadingRange.addEventListener('input', () => {
            setVar(typeVarKey(set.key, 'leading'), `${typeLeadingEntries()[Number(leadingRange.value)].rem}rem`);
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

function renderTypeSetGroups(vars) {
    const container = document.getElementById('typeSetGroups');
    if (!container) return;
    if (!container.children.length) buildTypeSetGroups();

    const sizes = typeSizeEntries();
    const leadings = typeLeadingEntries();

    TYPE_SETS.forEach(set => {
        const familyValue = vars[typeVarKey(set.key, 'family')] || '';
        const selection = typeFamilySelection(familyValue);
        const familySelect = document.getElementById(`typeFamily-${set.key}`);
        const customInput = document.getElementById(`typeCustom-${set.key}`);
        familySelect.value = selection;
        customInput.hidden = selection !== 'custom';
        if (selection === 'custom' && document.activeElement !== customInput) customInput.value = familyValue;

        document.getElementById(`typeWeight-${set.key}`).value = vars[typeVarKey(set.key, 'weight')] || set.weight;

        const size = parseFloat(vars[typeVarKey(set.key, 'size')]) || set.size;
        const sizeIndex = nearestEntryIndex(sizes, size);
        const sizeRange = document.getElementById(`typeSize-${set.key}`);
        sizeRange.max = sizes.length - 1;
        sizeRange.value = sizeIndex;
        const sizeName = document.getElementById(`typeSizeName-${set.key}`);
        sizeName.value = typeTokenLabel(sizes, size);
        sizeName.title = `${sizes[sizeIndex].rem}rem`;
        document.getElementById(`typeSizeReadout-${set.key}`).textContent = `${Math.round(size * 16)}px`;

        const leading = parseFloat(vars[typeVarKey(set.key, 'leading')]) || set.leading;
        const leadingIndex = nearestEntryIndex(leadings, leading);
        const leadingRange = document.getElementById(`typeLeading-${set.key}`);
        leadingRange.max = leadings.length - 1;
        leadingRange.value = leadingIndex;
        const leadingName = document.getElementById(`typeLeadingName-${set.key}`);
        leadingName.value = typeTokenLabel(leadings, leading);
        leadingName.title = `${leadings[leadingIndex].rem}rem`;
        document.getElementById(`typeLeadingReadout-${set.key}`).textContent = `${Math.round(leading * 16)}px`;

        const tracking = parseFloat(vars[typeVarKey(set.key, 'tracking')]) || 0;
        document.getElementById(`typeTracking-${set.key}`).value = tracking;
        document.getElementById(`typeTrackingNumber-${set.key}`).value = tracking;

        document.getElementById(`typeMeta-${set.key}`).textContent = typeSetSummary(vars, set);
    });
}

function googleFontsHref(vars) {
    const faces = new Set(['font-sans', 'font-serif', 'font-mono'].map(k => firstFamily(vars[k])));
    TYPE_SETS.forEach(set => faces.add(resolveTypeFace(vars, set.key)));
    const wanted = [...faces].filter(f => GOOGLE_FONTS.has(f)).sort();
    if (!wanted.length) return '';
    return `https://fonts.googleapis.com/css2?${wanted.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`;
}

// Preview-only companions to the --type-* vars: per-set badge color/abbr and
// the resolved summary string, painted by the pages with `content: var(...)`.
function typeMetaCss(vars) {
    return TYPE_SETS.map(set =>
        `  --type-${set.key}-badge: ${set.color};\n` +
        `  --type-${set.key}-abbr: "${set.abbr}";\n` +
        `  --type-${set.key}-meta: "${typeSetSummary(vars, set).replace(/"/g, "'")}";`
    ).join('\n');
}

function syncPreviewTypeHead(doc, vars) {
    const link = doc.getElementById('google-fonts');
    const href = googleFontsHref(vars);
    if (link && link.getAttribute('href') !== href) {
        if (href) link.setAttribute('href', href);
        else link.removeAttribute('href');
    }
    const meta = doc.getElementById('type-meta');
    if (meta) meta.textContent = `:root {\n${typeMetaCss(vars)}\n}`;
}

// --- Theme picker ("Start from") ---
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

    const renderRow = (name, vars, deletable) => {
        if (search && !name.toLowerCase().includes(search)) return;
        const row = document.createElement('button');
        row.className = 'theme-picker-row';
        if (name === state.themeName) row.classList.add('active');
        row.innerHTML = `<span class="theme-swatch-dots">${themeSwatchHtml(vars)}</span><span class="theme-picker-row-name">${name}</span>`;
        if (deletable) {
            const del = document.createElement('span');
            del.className = 'theme-picker-row-delete';
            del.innerHTML = '<i class="fas fa-trash"></i>';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                delete customSystems[name];
                delete customThemes[name];
                saveCustomSystems();
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

    Object.entries(customSystems).forEach(([name, sys]) => renderRow(name, sys.vars.light, true));
    Object.entries(customThemes).forEach(([name, vars]) => { if (!customSystems[name]) renderRow(name, vars.light, true); });
    allThemes.forEach(theme => renderRow(theme.title, flattenVars(theme).light, false));
}

// --- Color palette popover ---
const POPOVER_SPECIALS = [['#ffffff', 'white'], ['#000000', 'black'], ['transparent', 'transparent']];

// Nearest swatch of a source to a hex. `families` (optional) restricts the
// search to the palette subset. Ties resolve by source family order.
function resolvePaletteEntry(hex, sourceKey, families) {
    let best = null;
    let bestDist = Infinity;
    POPOVER_SPECIALS.forEach(([swatchHex, name]) => {
        if (swatchHex === 'transparent') return;
        const dist = colorDistanceSq(hex, swatchHex);
        if (dist < bestDist) { bestDist = dist; best = { name, hex: swatchHex }; }
    });
    const color = foundationOf(sourceKey).color;
    const names = color.names();
    const fams = color.families();
    color.rows().forEach((row, rowIndex) => {
        if (families && !families.includes(fams[rowIndex])) return;
        row.forEach((swatchHex, colIndex) => {
            const dist = colorDistanceSq(hex, swatchHex);
            if (dist < bestDist) { bestDist = dist; best = { name: names[rowIndex] && names[rowIndex][colIndex], hex: swatchHex }; }
        });
    });
    return best;
}

function findPaletteEntryByName(sourceKey, name) {
    const special = POPOVER_SPECIALS.find(([, specialName]) => specialName === name);
    if (special) return { name: special[1], hex: special[0] };
    const entry = paletteEntryByName(sourceKey, name);
    return entry ? { name: entry.name, hex: entry.hex } : null;
}

// Links every key to its nearest swatch (mutating vars[key] to that swatch's
// exact hex) and returns the { key: {source, name, hex} } map.
function snapVarsToPalette(vars, sourceKey, keys, families) {
    const links = {};
    keys.forEach(key => {
        const raw = vars[key];
        if (raw === undefined) return;
        const hex = cssColorToHex(raw);
        if (!hex) return;
        const entry = resolvePaletteEntry(hex, sourceKey, families);
        if (!entry) return;
        vars[key] = entry.hex;
        links[key] = { source: sourceKey, name: entry.name, hex: entry.hex };
    });
    return links;
}

// Tooltip text is line-based (see panelTip): the first line is the title,
// every other line is `label: a, b, c (+N)` and renders as a label followed
// by one pill per token name. A single-line text stays a plain readout.
function tooltipHtml(text) {
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = String(text).split('\n');
    const title = `<div class="swatch-tooltip-title">${esc(lines[0])}</div>`;
    const rows = lines.slice(1).map(line => {
        const at = line.indexOf(': ');
        if (at === -1) return `<div class="swatch-tooltip-row">${esc(line)}</div>`;
        const label = line.slice(0, at);
        let rest = line.slice(at + 2);
        let more = '';
        const m = /\s*\(\+(\d+)\)$/.exec(rest);
        if (m) { more = `<span class="swatch-tooltip-more">+${m[1]}</span>`; rest = rest.slice(0, m.index); }
        const pills = rest.split(', ').filter(Boolean).map(n => `<span class="swatch-tooltip-pill">${esc(n)}</span>`).join('');
        return `<div class="swatch-tooltip-row"><span class="swatch-tooltip-label">${esc(label)}</span>${pills}${more}</div>`;
    }).join('');
    return title + rows;
}

function showSwatchTooltip(anchorEl, text) {
    const tip = document.getElementById('swatchTooltip');
    tip.innerHTML = tooltipHtml(text);
    tip.hidden = false;
    const gap = 6, edge = 8;
    const anchorRect = anchorEl.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const left = Math.max(edge, Math.min(anchorRect.left + anchorRect.width / 2 - tipRect.width / 2, window.innerWidth - tipRect.width - edge));
    // Above the anchor by default; below it when that would run past the top.
    const above = anchorRect.top - tipRect.height - gap;
    const top = above < edge ? anchorRect.bottom + gap : above;
    tip.classList.toggle('swatch-tooltip-below', above < edge);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function hideSwatchTooltip() {
    document.getElementById('swatchTooltip').hidden = true;
}

// A swatch button. onSelect receives (hex, name, ref): ref is the token
// reference a component picker stores (`palette.<name>` / `color.<role>`).
function makePopoverSwatch(popover, hex, name, extraClass, ref) {
    const btn = document.createElement('button');
    btn.className = 'popover-swatch' + (extraClass ? ` ${extraClass}` : '');
    btn.style.backgroundColor = hex === 'transparent' ? '' : hex;
    btn.dataset.hex = hex.toLowerCase();
    if (name) btn.dataset.name = name;
    btn.dataset.ref = ref || `palette.${name}`;
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
        if (popover._onSelect) popover._onSelect(hex, name, btn.dataset.ref);
        closeColorPalettePopover();
    });
    return btn;
}

// Every ramp of the active source.
function renderColorPopoverGrid() {
    const popover = document.getElementById('colorPalettePopover');
    const grid = popover.querySelector('.color-popover-grid');
    grid.innerHTML = '';
    allFamilies().forEach(family => {
        const rowEl = document.createElement('div');
        rowEl.className = 'color-popover-row';
        paletteFamilyEntries(activePaletteSource, family).forEach(entry => rowEl.appendChild(makePopoverSwatch(popover, entry.hex, entry.name)));
        grid.appendChild(rowEl);
    });
    popover.querySelector('.color-popover-header span:nth-child(2)').textContent = foundationOf(activePaletteSource).label;
}

// Semantic-role strip for component pickers: every color role as a swatch,
// so a part can point at `color.primary` rather than a palette step.
function renderColorPopoverSemantic(show) {
    const popover = document.getElementById('colorPalettePopover');
    const strip = popover.querySelector('.color-popover-semantic');
    strip.innerHTML = '';
    strip.hidden = !show;
    if (!show) return;
    const vars = currentVars();
    LINKABLE_COLOR_KEYS.forEach(key => {
        const hex = cssColorToHex(vars[key]) || '#000000';
        const btn = makePopoverSwatch(popover, hex, key, 'popover-swatch-semantic', `color.${key}`);
        btn.querySelector('.popover-swatch-name').textContent = key;
        strip.appendChild(btn);
    });
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
        if (!popover.hidden && !popover.contains(e.target) && !e.target.closest('.color-field-palette-btn, .inspector-color-btn')) {
            closeColorPalettePopover();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeColorPalettePopover();
    });
    // A click inside the iframe never bubbles here; it does move focus.
    window.addEventListener('blur', () => {
        if (!popover.hidden && document.activeElement === document.getElementById('previewFrame')) closeColorPalettePopover();
    });
}

// currentName marks the linked palette swatch; opts.semantic adds the role
// strip and opts.currentRef marks whichever entry (role or swatch) the
// component token currently references.
function openColorPalettePopover(anchor, currentName, onSelect, opts = {}) {
    const popover = document.getElementById('colorPalettePopover');
    renderColorPopoverSemantic(!!opts.semantic);
    const rect = anchor.getBoundingClientRect();
    popover.hidden = false;
    const popoverWidth = popover.offsetWidth || 320;
    const left = Math.min(rect.left, window.innerWidth - popoverWidth - 12);
    const maxTop = window.innerHeight - popover.offsetHeight - 8;
    popover.style.top = `${Math.max(8, Math.min(rect.bottom + 6, maxTop))}px`;
    popover.style.left = `${Math.max(8, left)}px`;
    popover._onSelect = onSelect;

    popover.querySelectorAll('.popover-swatch-current').forEach(el => el.classList.remove('popover-swatch-current'));
    const currentRef = opts.currentRef || (currentName ? `palette.${currentName}` : null);
    if (currentRef) {
        popover.querySelectorAll(`.popover-swatch[data-ref="${CSS.escape(currentRef)}"]`).forEach(el => el.classList.add('popover-swatch-current'));
    }
}

// --- localStorage ---
// The full shape of one saved system - used by both the localStorage Save
// (customSystems[name], below) and the "Save to repo" fetch to the local
// save-server (see SAVE_SERVER_URL).
function buildSystemSnapshot() {
    return {
        source: activePaletteSource,
        palette: { families: [...state.palette.families] },
        vars: { light: { ...state.vars.light }, dark: { ...state.vars.dark } },
        tokenLinks: { light: { ...tokenLinks.light }, dark: { ...tokenLinks.dark } },
        components: { ...state.components },
        customScale: cloneCustomScale(state.customScale)
    };
}

function saveCustomSystems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customSystems));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(customThemes));
}
function loadCustomSystemsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) customSystems = JSON.parse(raw) || {};
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) customThemes = JSON.parse(legacy) || {};
    } catch (e) { console.warn('Could not load saved systems:', e); }
}

// --- Preview document ---
function scaleKinds() {
    return ['space', 'radius', 'borderWidth', 'borderStyle', 'shadow', 'typeSize', 'typeLeading'];
}

// The whole token chain as CSS custom properties: palette -> scales ->
// semantic (as var() into the palette when linked) -> type sets -> component
// parts. This is what the preview renders from and what the CSS export emits.
function cssVarBlockFor(vars, links) {
    const lines = [];
    const source = activePaletteSource;
    foundationOf(source).color.families().forEach(family => {
        paletteFamilyEntries(source, family).forEach(entry => lines.push(`  ${refToVar(`palette.${entry.name}`)}: ${entry.hex};`));
    });
    lines.push('  --palette-white: #ffffff;', '  --palette-black: #000000;', '  --palette-transparent: transparent;');

    scaleKinds().forEach(kind => {
        scaleEntries(source, kind).forEach(entry => lines.push(`  ${refToVar(scaleRef(kind, entry.name))}: ${entry.value};`));
    });

    const emitted = new Set();
    LINKABLE_COLOR_KEYS.forEach(key => {
        if (vars[key] === undefined) return;
        const link = links[key];
        const linked = isLinkInPalette(link) && (isSpecialName(link.name) || !!paletteEntryByName(source, link.name));
        lines.push(`  --${key}: ${linked ? `var(${refToVar(`palette.${link.name}`)})` : vars[key]};`);
        emitted.add(key);
    });

    ['font-sans', 'font-serif', 'font-mono', 'tracking-normal'].forEach(key => {
        if (vars[key] === undefined) return;
        lines.push(`  --${key}: ${vars[key]};`);
        emitted.add(key);
    });

    TYPE_SETS.forEach(set => {
        ['family', 'weight', 'size', 'leading', 'tracking'].forEach(prop => {
            const key = typeVarKey(set.key, prop);
            const raw = vars[key];
            if (raw === undefined) return;
            emitted.add(key);
            let value = raw;
            if (prop === 'size' || prop === 'leading') {
                const entry = scaleEntryForRem(source, prop === 'size' ? 'typeSize' : 'typeLeading', measurementToRem(raw, NaN));
                if (entry) value = `var(${refToVar(scaleRef(prop === 'size' ? 'typeSize' : 'typeLeading', entry.name))})`;
            }
            lines.push(`  --${key}: ${value};`);
        });
    });

    // Anything else the theme carried (its own --radius, --spacing, …) rides
    // along untouched so nothing that referenced it breaks.
    Object.entries(vars).forEach(([key, value]) => {
        if (!emitted.has(key)) lines.push(`  --${key}: ${value};`);
    });

    if (typeof componentVarLines === 'function') lines.push(componentVarLines(state.components, source));
    return lines.join('\n');
}

function themeVarsCss(vars, links) {
    return `@layer tokens {\n:root {\n${cssVarBlockFor(vars, links)}\n}\n}`;
}

function safeBuild(fnName, ...args) {
    const fn = typeof window !== 'undefined' ? window[fnName] : undefined;
    if (typeof fn !== 'function') return `<div class="page"><p>${fnName} is not loaded.</p></div>`;
    try { return fn(...args); } catch (e) { console.error(`${fnName} failed`, e); return `<div class="page"><p>${fnName} failed: ${e.message}</p></div>`; }
}

function buildPreviewDocument(vars, links) {
    const href = googleFontsHref(vars);
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@layer reset, tokens, base, components, states, pages;
@import url("preview/reset.css") layer(reset);
@import url("preview/components.css") layer(components);
@import url("preview/pages.css") layer(pages);
</style>
<link id="google-fonts" rel="stylesheet"${href ? ` href="${href}"` : ''}>
<style id="theme-vars">${themeVarsCss(vars, links)}</style>
<style id="wiring">${safeBuild('buildWiringCss')}</style>
<style id="type-meta">:root {
${typeMetaCss(vars)}
}</style>
</head>
<body data-route="elements" data-inspect-state="${state.selection ? state.selection.state : 'default'}">
<section data-page="elements"><div class="page gallery-page">${safeBuild('buildGalleryHtml')}</div></section>
<script src="preview/frame.js"><\/script>
</body>
</html>`;
}

function previewDocument() {
    const iframe = document.getElementById('previewFrame');
    const doc = iframe.contentDocument;
    return doc && doc.getElementById('theme-vars') ? doc : null;
}

// The gallery shows ONE instance per element. The selected element's stage
// renders the variant + state being inspected; every other stage sits at its
// first variant, default state. Only stages whose shown pair changed are
// re-rendered, so unrelated DOM stays put.
function syncGalleryStages(doc) {
    if (typeof renderGalleryInstance !== 'function') return;
    const sel = state.selection;
    doc.querySelectorAll('[data-page="elements"] .gallery-stage[data-gallery-element]').forEach(stage => {
        const key = stage.dataset.galleryElement;
        const spec = elementSpec(key);
        if (!spec) return;
        const mine = sel && sel.element === key;
        const variant = mine ? (sel.variant || '') : ((spec.variants && spec.variants[0]) || '');
        const st = mine ? sel.state : 'default';
        if (stage.dataset.variant === variant && stage.dataset.state === st) return;
        stage.dataset.variant = variant;
        stage.dataset.state = st;
        stage.innerHTML = renderGalleryInstance(key, variant || null, st);
    });
}

// Marks the selected part in the gallery for the state being inspected.
function applySelectionHighlight(doc) {
    syncGalleryStages(doc);
    doc.querySelectorAll('[data-selected]').forEach(el => el.removeAttribute('data-selected'));
    const sel = state.selection;
    doc.body.dataset.inspectState = sel ? sel.state : 'default';
    if (!sel) return;
    const stage = doc.querySelector(`[data-page="elements"] .gallery-stage[data-gallery-element="${CSS.escape(sel.element)}"]`);
    const root = stage && stage.querySelector(`[data-element="${CSS.escape(sel.element)}"]`);
    if (!root) return;
    const part = root.dataset.part === sel.part ? root : root.querySelector(`[data-part="${CSS.escape(sel.part)}"]`);
    if (part) part.setAttribute('data-selected', '');
}

// Edits patch the one theme-vars <style> in place; the gallery DOM stays put
// so selection survives. A full srcdoc build happens only once (or if the
// document went away).
function renderPreview() {
    const iframe = document.getElementById('previewFrame');
    const vars = currentVars();
    const links = tokenLinks[state.mode];
    const doc = previewDocument();
    if (doc) {
        doc.getElementById('theme-vars').textContent = themeVarsCss(vars, links);
        syncPreviewTypeHead(doc, vars);
        applySelectionHighlight(doc);
        return;
    }
    iframe.srcdoc = buildPreviewDocument(vars, links);
}

function scrollGalleryTo(cat) {
    const doc = previewDocument();
    document.querySelectorAll('.gallery-nav-button').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    if (!doc) return;
    if (cat === 'all') { doc.defaultView.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const section = doc.getElementById(`cat-${cat}`);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAll() {
    renderPanel();
    renderThemePickerButton();
    renderColorPopoverGrid();
    renderPreview();
}

// --- Selection, active property, marks, strip, panel ---
const STATE_LABELS = { default: 'Default', hover: 'Hover', focus: 'Focus', active: 'Active', disabled: 'Disabled' };

// Which prop kind(s) each sidebar tab assigns.
const TAB_KINDS = { colors: ['color'], space: ['space'], radius: ['radius'], border: ['borderWidth', 'borderStyle'], shadow: ['shadow'], type: ['type'], summary: [] };
// Ref kind (parseRef) -> prop kind a click on that ref assigns.
const REF_KIND_TO_PROP_KIND = { palette: 'color', color: 'color', space: 'space', radius: 'radius', borderWidth: 'borderWidth', borderStyle: 'borderStyle', shadow: 'shadow', type: 'type' };

// elementSpec(keyOrSpec) comes from components.js.

function titleCase(text) {
    return String(text || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Token id per the contract grammar: element[.variant].part[.prop][.state]
// (prop only for multi-prop parts, state only when not default). Same result
// as components.js tokenId(), kept local so it works with a raw prop key.
function componentId(element, variant, part, prop, stateKey) {
    const segments = [element];
    if (variant) segments.push(variant);
    segments.push(part);
    if (prop) segments.push(prop);
    if (stateKey && stateKey !== 'default') segments.push(stateKey);
    return segments.join('.');
}

function partPropId(spec, variant, part, prop, stateKey) {
    return componentId(spec.key, variant, part.key, part.props.length > 1 ? prop.key : null, stateKey);
}

function componentRef(id) {
    if (typeof resolveComponentRef === 'function') return resolveComponentRef(id, state.components);
    return state.components[id];
}

function selectedSpec() {
    const sel = state.selection;
    return sel && typeof elementSpec === 'function' ? elementSpec(sel.element) : null;
}

function selectedPartSpec() {
    const spec = selectedSpec();
    if (!spec) return null;
    return spec.parts.find(p => p.key === state.selection.part) || spec.parts[0];
}

// The part a tab edits for one kind: the selected part when it has a prop of
// that kind, else the element's first part that does - so clicking a button's
// label and then opening Space still lets you set the button's padding
// ("touch and go" - the tab always has something to assign to).
function effectivePartSpec(kind) {
    const spec = selectedSpec();
    const part = selectedPartSpec();
    if (!spec || !part) return null;
    if (part.props.some(p => p.kind === kind)) return part;
    return spec.parts.find(p => p.props.some(q => q.kind === kind)) || null;
}

// The effective part's props of one kind (e.g. padding -> [x, y] for 'space').
function activeProps(selection, kind) {
    const spec = selectedSpec();
    const part = effectivePartSpec(kind);
    if (!spec || !part || !selection) return [];
    return part.props.filter(p => p.kind === kind);
}

// The one prop of `kind` a click assigns: the remembered chip, else the first.
function activePropSpec(kind) {
    const props = activeProps(state.selection, kind);
    if (!props.length) return null;
    const chosen = state.activeProp[kind];
    return props.find(p => p.key === chosen) || props[0];
}

function activeTokenId(kind) {
    const spec = selectedSpec();
    const part = effectivePartSpec(kind);
    const prop = activePropSpec(kind);
    if (!spec || !part || !prop) return null;
    return partPropId(spec, state.selection.variant, part, prop, state.selection.state);
}

// Follows a ref to the foundation entry it lands on: color.<role> -> the
// role's palette link (or null when unlinked); everything else is itself.
function resolveToFoundation(ref, mode) {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    if (parsed.kind === 'color') {
        const link = tokenLinks[mode || state.mode][parsed.name];
        return link && link.source === activePaletteSource ? `palette.${link.name}` : null;
    }
    return ref;
}

// Full chain for a ref: "color.border → neutral-200 (#e5e5e5)".
function describeRef(ref) {
    const parsed = parseRef(ref);
    if (!parsed) return String(ref);
    const { kind, name } = parsed;
    if (kind === 'color') {
        const link = tokenLinks[state.mode][name];
        const hex = cssColorToHex(currentVars()[name] || '') || '?';
        return `${ref} → ${link ? link.name : 'unlinked'} (${hex})`;
    }
    if (kind === 'palette') {
        const entry = findPaletteEntryByName(activePaletteSource, name);
        return `${ref} (${entry ? entry.hex : '?'})`;
    }
    if (kind === 'type') {
        const set = TYPE_SETS.find(s => s.key === name);
        return set ? `${ref} → ${typeSetSummary(currentVars(), set)}` : ref;
    }
    const entry = findScaleEntry(activePaletteSource, kind, name);
    return entry && entry.px !== null && entry.px !== undefined ? `${ref} (${entry.px}px)` : ref;
}

function elementLabel(element, variant, part) {
    const spec = typeof elementSpec === 'function' ? elementSpec(element) : null;
    const crumbs = [spec ? spec.label : titleCase(element)];
    if (variant) crumbs.push(titleCase(variant));
    if (part) {
        const p = spec && spec.parts.find(x => x.key === part);
        crumbs.push(p ? (p.label || titleCase(part)) : titleCase(part));
    }
    return crumbs.join(' › ');
}

// Every token id of the selected element (all parts, props, states) - what
// "used" marks are computed over.
function selectedElementIds() {
    const spec = selectedSpec();
    if (!spec) return [];
    const ids = [];
    const variant = state.selection.variant;
    spec.parts.forEach(part => part.props.forEach(prop => spec.states.forEach(st => ids.push(partPropId(spec, variant, part, prop, st)))));
    return ids;
}

// ctx.marks[ref] = { count, ids, roles, used, active } per the v3 contract.
function computeMarks() {
    const marks = {};
    const entry = (ref) => (marks[ref] = marks[ref] || { count: 0, ids: [], roles: [], used: false, active: false });

    if (typeof componentTokenIds === 'function') {
        componentTokenIds().forEach(id => {
            const target = resolveToFoundation(componentRef(id), state.mode);
            if (!target) return;
            const m = entry(target);
            m.count += 1;
            m.ids.push(id);
        });
    }

    LINKABLE_COLOR_KEYS.forEach(role => {
        const link = tokenLinks[state.mode][role];
        if (link && link.source === activePaletteSource) entry(`palette.${link.name}`).roles.push(role);
    });

    selectedElementIds().forEach(id => {
        const target = resolveToFoundation(componentRef(id), state.mode);
        if (target) entry(target).used = true;
    });

    const kinds = TAB_KINDS[state.activeTab] || [];
    kinds.forEach(kind => {
        const id = activeTokenId(kind);
        if (!id) return;
        const target = resolveToFoundation(componentRef(id), state.mode);
        if (target) entry(target).active = true;
    });
    return marks;
}

function panelCtx() {
    return {
        source: activePaletteSource,
        foundation: foundationOf(activePaletteSource),
        mode: state.mode,
        vars: state.vars,
        links: tokenLinks,
        components: state.components,
        // The panel's chips/marks follow the part the active tab actually
        // edits (see effectivePartSpec), not necessarily the clicked one.
        selection: (() => {
            if (!state.selection) return null;
            const kinds = TAB_KINDS[state.activeTab] || [];
            const target = kinds.length ? effectivePartSpec(kinds[0]) : null;
            return target ? { ...state.selection, part: target.key } : state.selection;
        })(),
        activeProps: state.activeProp,
        marks: computeMarks(),
        typeSets: TYPE_SETS,
        typeSetSummary,
        elementLabel
    };
}

// --- Panels ---
// Typography controls are real DOM with listeners wired once; they're moved
// between the hidden template and the Type panel's mount, never rebuilt.
function parkTypeControls() {
    const template = document.getElementById('typeControlsTemplate');
    const mount = document.getElementById('typeControlsMount');
    if (!template || !mount) return;
    while (mount.firstChild) template.appendChild(mount.firstChild);
}

function mountTypeControls() {
    const template = document.getElementById('typeControlsTemplate');
    const mount = document.getElementById('typeControlsMount');
    if (!template || !mount) return;
    while (template.firstChild) mount.appendChild(template.firstChild);
}

function renderPanel() {
    const body = document.getElementById('panelBody');
    if (!body) return;
    // The hovered swatch is about to be replaced - don't leave its tip behind.
    hideSwatchTooltip();
    parkTypeControls();
    const ctx = panelCtx();
    const tab = state.activeTab;
    let html = '';
    if (tab === 'colors') html = safeBuild('buildColorsPanelHtml', ctx);
    else if (tab === 'space') html = safeBuild('buildScalePanelHtml', 'space', ctx, { allowAdd: true });
    else if (tab === 'radius') html = safeBuild('buildScalePanelHtml', 'radius', ctx);
    else if (tab === 'border') html = safeBuild('buildBorderPanelHtml', ctx);
    else if (tab === 'shadow') html = safeBuild('buildScalePanelHtml', 'shadow', ctx, { allowAdd: true });
    else if (tab === 'type') html = safeBuild('buildTypePanelHtml', ctx);
    else html = safeBuild('buildSummaryPanelHtml', ctx);
    body.innerHTML = safeBuild('buildSelectionStripHtml', ctx) + html;
    if (tab === 'type') {
        mountTypeControls();
        renderTypographyTab();
    }
    if (tab === 'summary') renderSemanticRoles();
}

// One delegated click handler for every panel: chips choose the prop a kind
// assigns; refs assign to the active token of their kind.
function onPanelClick(e) {
    const pick = e.target.closest('.fp-strip [data-variant], .fp-strip [data-state]');
    if (pick && pick.closest('#panelBody')) {
        const sel = state.selection;
        if (sel) selectElement(sel.element, pick.dataset.variant || sel.variant, sel.part, pick.dataset.state || sel.state);
        return;
    }
    const chip = e.target.closest('[data-prop]');
    if (chip && chip.closest('#panelBody')) {
        const kindHolder = chip.closest('[data-kind]');
        const kind = chip.dataset.kind || (kindHolder && kindHolder.dataset.kind) || (TAB_KINDS[state.activeTab] || [])[0];
        if (kind) state.activeProp[kind] = chip.dataset.prop;
            renderPanel();
        return;
    }
    const addBtn = e.target.closest('[data-add-confirm]');
    if (addBtn && addBtn.closest('#panelBody')) {
        const row = addBtn.closest('[data-add-kind]');
        const kind = row.dataset.addKind;
        const nameInput = row.querySelector('[data-add-field="name"]');
        const valueInput = row.querySelector('[data-add-field="value"]');
        const errorEl = row.querySelector('[data-add-error]');
        const err = addCustomScaleEntry(kind, nameInput.value, valueInput.value);
        if (errorEl) {
            errorEl.textContent = err || '';
            errorEl.hidden = !err;
        }
        return;
    }
    const target = e.target.closest('[data-ref]');
    if (!target || !target.closest('#panelBody')) return;
    const ref = target.dataset.ref;
    const parsed = parseRef(ref);
    if (!parsed) return;
    const kind = REF_KIND_TO_PROP_KIND[parsed.kind];
    const id = kind ? activeTokenId(kind) : null;
    if (!id) return;
    setComponentToken(id, ref);
}

function selectElement(element, variant, part, stateKey) {
    const spec = elementSpec(element);
    if (!spec) return;
    state.selection = {
        element,
        variant: variant || (spec.variants ? spec.variants[0] : null),
        part: part || spec.parts[0].key,
        state: spec.states.includes(stateKey) ? stateKey : 'default'
    };
    if (!spec.parts.some(p => p.key === state.selection.part)) state.selection.part = spec.parts[0].key;
    renderPanel();
    const doc = previewDocument();
    if (doc) applySelectionHighlight(doc);
}

function clearSelection() {
    state.selection = null;
    renderPanel();
    const doc = previewDocument();
    if (doc) applySelectionHighlight(doc);
}


// --- Palette source switch ---
function setPaletteSourceUi(sourceKey) {
    activePaletteSource = sourceKey;
    document.getElementById('palettePickerLabel').textContent = foundationOf(sourceKey).label.replace(' v4', '');
    document.querySelectorAll('[data-palette-source]').forEach(b => b.classList.toggle('active', b.dataset.paletteSource === sourceKey));
}

// Re-sources the whole system: every semantic color re-snaps to the new
// source's nearest swatch, type sets and component tokens re-map to the new
// scales, and the palette subset is re-derived. One undo step.
function switchPaletteSource(next) {
    const prev = activePaletteSource;
    if (prev === next) return;
    const snapshot = undoSnapshot();
    setPaletteSourceUi(next);
    // Custom entries are per-source (foundation.js's CUSTOM_SCALE) - repoint
    // at `next`'s slot rather than remap; `prev`'s slot is untouched, so
    // switching back restores them.
    state.customScale = customScaleFor(next);
    ['light', 'dark'].forEach(mode => {
        tokenLinks[mode] = { ...tokenLinks[mode], ...snapVarsToPalette(state.vars[mode], next, LINKABLE_COLOR_KEYS) };
        snapTypeToScale(state.vars[mode]);
    });
    if (typeof remapComponentTokens === 'function') state.components = remapComponentTokens(state.components, prev, next);
    state.palette.families = allFamilies();
    pushUndoSnapshot(snapshot);
    renderAll();
}

// --- Export ---
const TOKEN_LINKS_MARKER = 'theme-editor:token-links';

function exportCtx() {
    return {
        name: state.themeName,
        source: activePaletteSource,
        families: state.palette.families,
        vars: state.vars,
        links: tokenLinks,
        components: state.components,
        typeSets: TYPE_SETS
    };
}

function typeTokenComment(key, value) {
    const typeProp = /^type-[a-z]+-(size|leading)$/.exec(key);
    if (!typeProp) return '';
    const kind = typeProp[1] === 'size' ? 'typeSize' : 'typeLeading';
    const entries = scaleEntries(activePaletteSource, kind);
    const rem = measurementToRem(value, 1);
    const i = nearestEntryIndex(entries, rem);
    const label = `${activePaletteSource} ${entries[i].name} (${entries[i].px}px)`;
    return Math.abs(entries[i].rem - rem) < 0.0001 ? ` /* ${label} */` : ` /* off-scale - nearest ${label} */`;
}

// Annotated CSS: each semantic var with its linked token as a trailing
// comment, then the component vars, then the token map in a marked comment
// block Import can restore exact links from.
function buildAnnotatedCss() {
    const block = (mode) => Object.entries(state.vars[mode]).map(([k, v]) => {
        const link = tokenLinks[mode][k];
        let note = '';
        if (link) note = ` /* ${link.source} ${link.name} */`;
        else if (LINKABLE_COLOR_KEYS.includes(k)) note = ' /* unlinked */';
        else note = typeTokenComment(k, v);
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
    const components = typeof componentVarLines === 'function' ? componentVarLines(state.components, activePaletteSource) : '';
    return `:root {\n${block('light')}\n}\n\n.dark {\n${block('dark')}\n}\n\n/* component part tokens (${activePaletteSource} scales) */\n:root {\n${components}\n}\n\n/* ${TOKEN_LINKS_MARKER}\n${JSON.stringify(tokenMap, null, 2)}\n*/`;
}

let componentsCssText = null;
async function fetchComponentsCss() {
    if (componentsCssText !== null) return componentsCssText;
    try {
        const res = await fetch('preview/components.css');
        componentsCssText = res.ok ? await res.text() : `/* preview/components.css could not be fetched (HTTP ${res.status}) */`;
    } catch (e) {
        componentsCssText = `/* preview/components.css could not be fetched: ${e.message} */`;
    }
    return componentsCssText;
}

async function buildDesignSystemCss() {
    const componentsCss = await fetchComponentsCss();
    const wiring = typeof buildWiringCss === 'function' ? buildWiringCss() : '/* components.js not loaded */';
    return `/* ${state.themeName} - design system (${foundationOf(activePaletteSource).label} scales) */\n` +
        `@layer tokens, components, states;\n\n` +
        `@layer tokens {\n:root {\n${cssVarBlockFor(state.vars.light, tokenLinks.light)}\n}\n\n.dark {\n${cssVarBlockFor(state.vars.dark, tokenLinks.dark)}\n}\n}\n\n` +
        `${wiring}\n\n@layer components {\n${componentsCss}\n}\n`;
}

const EXPORT_TABS = {
    tokens: { filename: 'tokens.json', build: async () => JSON.stringify(typeof buildTokensJson === 'function' ? buildTokensJson(exportCtx()) : { error: 'dtcg.js not loaded' }, null, 2) },
    css: { filename: 'design-system.css', build: buildDesignSystemCss },
    annotated: { filename: 'theme.css', build: async () => buildAnnotatedCss() }
};
let activeExportTab = 'tokens';

async function renderExport() {
    const output = document.getElementById('exportOutput');
    document.querySelectorAll('[data-export-tab]').forEach(b => b.classList.toggle('active', b.dataset.exportTab === activeExportTab));
    output.textContent = 'Building…';
    try {
        output.textContent = await EXPORT_TABS[activeExportTab].build();
    } catch (e) {
        output.textContent = `Export failed: ${e.message}`;
        console.error(e);
    }
}

function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadText(filename, text, type = 'text/plain') {
    downloadBlob(filename, new Blob([text], { type }));
}

// --- Zip (STORE method, no compression - plenty for text exports, and needs
// no external library) - "Download zip" bundles every EXPORT_TABS format
// into one file so it isn't a separate manual download per tab. ---
function crc32(bytes) {
    let crc = ~0;
    for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (~crc) >>> 0;
}

function buildZip(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const dosDate = 0x21; // 1980-01-01 - a generated export has no meaningful mtime

    files.forEach(({ name, content }) => {
        const nameBytes = encoder.encode(name);
        const dataBytes = encoder.encode(content);
        const crc = crc32(dataBytes);

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0, true);
        local.setUint16(8, 0, true); // method: 0 = store
        local.setUint16(10, 0, true);
        local.setUint16(12, dosDate, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, dataBytes.length, true);
        local.setUint32(22, dataBytes.length, true);
        local.setUint16(26, nameBytes.length, true);
        local.setUint16(28, 0, true);
        localParts.push(new Uint8Array(local.buffer), nameBytes, dataBytes);

        const central = new DataView(new ArrayBuffer(46));
        central.setUint32(0, 0x02014b50, true);
        central.setUint16(4, 20, true);
        central.setUint16(6, 20, true);
        central.setUint16(8, 0, true);
        central.setUint16(10, 0, true);
        central.setUint16(12, 0, true);
        central.setUint16(14, dosDate, true);
        central.setUint32(16, crc, true);
        central.setUint32(20, dataBytes.length, true);
        central.setUint32(24, dataBytes.length, true);
        central.setUint16(28, nameBytes.length, true);
        central.setUint16(30, 0, true);
        central.setUint16(32, 0, true);
        central.setUint16(34, 0, true);
        central.setUint16(36, 0, true);
        central.setUint32(38, 0, true);
        central.setUint32(42, offset, true);
        centralParts.push(new Uint8Array(central.buffer), nameBytes);

        offset += 30 + nameBytes.length + dataBytes.length;
    });

    const centralStart = offset;
    const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);

    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(4, 0, true);
    end.setUint16(6, 0, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, centralStart, true);
    end.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

// --- Import ---
function detectImportKind(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) return 'json';
    if (/^﻿?---\s*\r?\n/.test(trimmed)) return 'designmd';
    return 'css';
}

function applyTokensImport(parsed) {
    if (parsed.source && FOUNDATION[parsed.source] && parsed.source !== activePaletteSource) setPaletteSourceUi(parsed.source);
    const vars = { light: withFallbacks({ ...(parsed.vars.light || {}) }), dark: withFallbacks({ ...(parsed.vars.dark || parsed.vars.light || {}) }) };
    const links = { light: { ...(parsed.links.light || {}) }, dark: { ...(parsed.links.dark || {}) } };
    // Anything the file left unlinked still gets its nearest swatch so the
    // subset can be derived and the summary line is honest.
    ['light', 'dark'].forEach(mode => {
        const missing = LINKABLE_COLOR_KEYS.filter(key => !links[mode][key]);
        Object.assign(links[mode], snapVarsToPalette(vars[mode], activePaletteSource, missing));
        snapTypeToScale(vars[mode]);
    });
    applyLoaded({
        name: parsed.name || 'Imported system',
        vars, links,
        families: parsed.families,
        components: { ...seedComponentsFor(vars.light), ...(parsed.components || {}) }
    });
}

function applyCssImport(text) {
    let carriedLinks = null;
    const carriedMatch = text.match(new RegExp(`${TOKEN_LINKS_MARKER}\\s*([\\s\\S]*?)\\*/`));
    if (carriedMatch) {
        try { carriedLinks = JSON.parse(carriedMatch[1]); } catch (e) { carriedLinks = null; }
    }
    const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const parseDecls = (css) => [...css.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k.trim(), v.trim()]);
    const darkIndex = stripped.search(/\.dark\s*\{/);
    const perMode = darkIndex === -1
        ? { [state.mode]: parseDecls(stripped) }
        : { light: parseDecls(stripped.slice(0, darkIndex)), dark: parseDecls(stripped.slice(darkIndex)) };
    if (!Object.values(perMode).some(decls => decls.length)) throw new Error('No --variable: value; declarations found.');
    pushUndo();
    Object.entries(perMode).forEach(([mode, decls]) => {
        decls.forEach(([key, value]) => {
            // Component var lines from our own export are derived, not source.
            if (typeof ELEMENTS !== 'undefined' && ELEMENTS.some(e => key.startsWith(`${e.key}-`))) return;
            state.vars[mode][key] = value;
        });
        snapTypeToScale(state.vars[mode]);
        const importedKeys = LINKABLE_COLOR_KEYS.filter(key => decls.some(([k]) => k === key));
        Object.assign(tokenLinks[mode], snapVarsToPalette(state.vars[mode], activePaletteSource, importedKeys));
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
    state.palette.families = allFamilies();
    renderAll();
}

// DESIGN.md front matter: `colors:` keys mapped onto semantic roles
// (case/separator-insensitive, `on-x` / `x-foreground` -> `x-foreground`),
// applied to the active mode and snapped to the palette.
const DESIGN_MD_ROLE_ALIASES = {
    primary: 'primary', secondary: 'secondary', accent: 'accent', tertiary: 'accent',
    background: 'background', bg: 'background', surface: 'card', foreground: 'foreground', text: 'foreground',
    muted: 'muted', destructive: 'destructive', error: 'destructive', danger: 'destructive',
    border: 'border', outline: 'border', card: 'card', popover: 'popover', ring: 'ring', input: 'input'
};

function designMdRoleFor(key) {
    const norm = String(key).trim().toLowerCase();
    const fg = norm.match(/^on[\s_-]*(.+)$/) || norm.match(/^(.+?)[\s_-]*foreground$/);
    if (fg) {
        const base = DESIGN_MD_ROLE_ALIASES[fg[1].replace(/[\s_-]+/g, '')];
        return base ? `${base}-foreground` : null;
    }
    return DESIGN_MD_ROLE_ALIASES[norm.replace(/[\s_-]+/g, '')] || null;
}

function applyDesignMdImport(text) {
    if (typeof jsyaml === 'undefined') throw new Error('js-yaml is not loaded, so DESIGN.md front matter cannot be parsed.');
    const fmMatch = text.replace(/^﻿/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/);
    if (!fmMatch) throw new Error('No YAML front matter found (expected the file to start with a "---" fenced block).');
    let data;
    try { data = jsyaml.load(fmMatch[1]); } catch (e) { throw new Error(`Couldn't parse the front matter as YAML: ${e.message}`); }
    if (!data || typeof data !== 'object' || !data.colors || typeof data.colors !== 'object') throw new Error('No "colors:" block found in the front matter.');
    const roles = {};
    Object.entries(data.colors).forEach(([key, value]) => {
        if (typeof value !== 'string') return;
        const role = designMdRoleFor(key);
        const hex = cssColorToHex(value);
        if (role && hex) roles[role] = hex;
    });
    if (!Object.keys(roles).length) throw new Error('No colors in the front matter map onto a semantic role.');
    pushUndo();
    Object.assign(state.vars[state.mode], roles);
    Object.assign(tokenLinks[state.mode], snapVarsToPalette(state.vars[state.mode], activePaletteSource, Object.keys(roles)));
    // A rounded/radius value re-seeds the radius of the box-shaped elements.
    const rounded = data.rounded && typeof data.rounded === 'object' ? (data.rounded.md || data.rounded.default || Object.values(data.rounded)[0]) : data.radius;
    if (typeof rounded === 'string' || typeof rounded === 'number') {
        const entry = nearestScaleEntry(activePaletteSource, 'radius', measurementToRem(rounded, 0.5));
        if (entry) {
            ['button', 'input', 'select', 'textarea', 'card', 'tab', 'popover'].forEach(elementKey => {
                const spec = elementSpec(elementKey);
                if (!spec || !spec.parts.some(p => p.key === 'radius')) return;
                (spec.variants || [null]).forEach(variant => { state.components[componentId(elementKey, variant, 'radius', null, null)] = scaleRef('radius', entry.name); });
            });
        }
    }
    if (typeof data.name === 'string' && data.name.trim()) state.themeName = data.name.trim();
    state.palette.families = allFamilies();
    renderAll();
}

function runImport(text) {
    const kind = detectImportKind(text);
    if (kind === 'json') {
        let obj;
        try { obj = JSON.parse(text); } catch (e) { throw new Error(`Not valid JSON: ${e.message}`); }
        if (typeof parseTokensJson !== 'function') throw new Error('dtcg.js is not loaded.');
        applyTokensImport(parseTokensJson(obj));
        return;
    }
    if (kind === 'designmd') { applyDesignMdImport(text); return; }
    applyCssImport(text);
}

// --- Event wiring ---
document.addEventListener('DOMContentLoaded', () => {
    loadCustomSystemsFromStorage();
    buildColorPalettePopover();
    loadTheme('Default');

    // Sidebar resize handle
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

    document.querySelectorAll('.sidebar-tab').forEach(btn => {
        btn.addEventListener('click', () => showSidebarTab(btn.dataset.sidebarTab));
    });

    // Panels: one delegated click handler, plus tooltips for [data-tip].
    const panelBody = document.getElementById('panelBody');
    panelBody.addEventListener('click', onPanelClick);
    panelBody.addEventListener('mouseover', (e) => {
        const tipped = e.target.closest('[data-tip]');
        if (tipped && panelBody.contains(tipped)) showSwatchTooltip(tipped, tipped.dataset.tip);
    });
    panelBody.addEventListener('mouseout', (e) => {
        const tipped = e.target.closest('[data-tip]');
        if (tipped && !(e.relatedTarget && tipped.contains(e.relatedTarget))) hideSwatchTooltip();
    });
    panelBody.addEventListener('focusin', (e) => {
        const tipped = e.target.closest('[data-tip]');
        if (tipped) showSwatchTooltip(tipped, tipped.dataset.tip);
    });
    panelBody.addEventListener('focusout', hideSwatchTooltip);

    // Gallery category nav
    document.querySelectorAll('.gallery-nav-button').forEach(btn => {
        btn.addEventListener('click', () => scrollGalleryTo(btn.dataset.cat));
    });

    // Messages from the preview frame (see preview/frame.js).
    window.addEventListener('message', (e) => {
        const iframe = document.getElementById('previewFrame');
        if (e.source !== iframe.contentWindow || !e.data || typeof e.data.type !== 'string') return;
        const msg = e.data;
        if (msg.type === 'ds:ready') {
            const doc = previewDocument();
            if (doc) applySelectionHighlight(doc);
        } else if (msg.type === 'ds:select') {
            selectElement(msg.element, msg.variant || null, msg.part, msg.state || 'default');
        } else if (msg.type === 'ds:clear') {
            clearSelection();
        }
    });

    // Theme picker
    document.getElementById('themePickerButton').addEventListener('click', () => {
        const menu = document.getElementById('themePickerMenu');
        menu.hidden = !menu.hidden;
        if (!menu.hidden) { renderThemePickerList(); document.getElementById('themeSearchInput').focus(); }
    });
    document.getElementById('themeSearchInput').addEventListener('input', renderThemePickerList);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#themePickerButton') && !e.target.closest('#themePickerMenu')) document.getElementById('themePickerMenu').hidden = true;
    });

    // Design-system source switcher
    document.getElementById('palettePickerButton').addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('palettePickerMenu');
        menu.hidden = !menu.hidden;
    });
    document.querySelectorAll('[data-palette-source]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchPaletteSource(btn.dataset.paletteSource);
            document.getElementById('palettePickerMenu').hidden = true;
        });
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#palettePickerButton') && !e.target.closest('#palettePickerMenu')) document.getElementById('palettePickerMenu').hidden = true;
    });

    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        state.mode = state.mode === 'light' ? 'dark' : 'light';
        document.getElementById('darkModeToggle').innerHTML = state.mode === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        renderAll();
    });

    // Undo/redo
    document.getElementById('undoButton').addEventListener('click', () => {
        if (!undoStack.length) return;
        redoStack.push(undoSnapshot());
        restoreSnapshot(undoStack.pop());
        updateUndoRedoButtons();
        renderAll();
    });
    document.getElementById('redoButton').addEventListener('click', () => {
        if (!redoStack.length) return;
        undoStack.push(undoSnapshot());
        restoreSnapshot(redoStack.pop());
        updateUndoRedoButtons();
        renderAll();
    });

    // Reset
    document.getElementById('resetButton').addEventListener('click', () => {
        pushUndo();
        state.vars = { light: { ...state.loadedVars.light }, dark: { ...state.loadedVars.dark } };
        tokenLinks = { light: { ...loadedTokenLinks.light }, dark: { ...loadedTokenLinks.dark } };
        state.components = { ...state.loadedComponents };
        state.palette = { families: [...state.loadedPalette.families] };
        state.customScale = setCustomScaleFor(activePaletteSource, cloneCustomScale(state.loadedCustomScale));
        renderAll();
    });

    // Typography inputs (live in #typeControlsTemplate until the Type panel mounts them)
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

    // Export modal
    document.getElementById('exportButton').addEventListener('click', () => {
        document.getElementById('exportModal').hidden = false;
        renderExport();
    });
    document.getElementById('closeExportModal').addEventListener('click', () => document.getElementById('exportModal').hidden = true);
    document.querySelectorAll('[data-export-tab]').forEach(btn => {
        btn.addEventListener('click', () => { activeExportTab = btn.dataset.exportTab; renderExport(); });
    });
    document.getElementById('copyExportButton').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('exportOutput').textContent);
    });
    document.getElementById('downloadExportButton').addEventListener('click', () => {
        const tab = EXPORT_TABS[activeExportTab];
        downloadText(tab.filename, document.getElementById('exportOutput').textContent, activeExportTab === 'tokens' ? 'application/json' : 'text/css');
    });

    // Import modal
    document.getElementById('importButton').addEventListener('click', () => document.getElementById('importModal').hidden = false);
    document.getElementById('closeImportModal').addEventListener('click', () => document.getElementById('importModal').hidden = true);
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        file.text().then(text => { document.getElementById('importTextarea').value = text; });
        e.target.value = '';
    });
    document.getElementById('applyImportButton').addEventListener('click', () => {
        const text = document.getElementById('importTextarea').value;
        const errorEl = document.getElementById('importError');
        errorEl.textContent = '';
        try {
            runImport(text);
        } catch (err) {
            errorEl.textContent = err.message;
            console.error(err);
            return;
        }
        document.getElementById('importModal').hidden = true;
        document.getElementById('importTextarea').value = '';
    });

    // Save modal
    document.getElementById('saveButton').addEventListener('click', () => {
        document.getElementById('saveNameInput').value = state.themeName === 'Default' ? '' : state.themeName;
        document.getElementById('saveModal').hidden = false;
    });
    document.getElementById('closeSaveModal').addEventListener('click', () => document.getElementById('saveModal').hidden = true);
    document.getElementById('confirmSaveButton').addEventListener('click', () => {
        const name = document.getElementById('saveNameInput').value.trim();
        if (!name) return;
        customSystems[name] = buildSystemSnapshot();
        saveCustomSystems();
        state.themeName = name;
        renderThemePickerButton();
        document.getElementById('saveModal').hidden = true;
    });

    // Save to repo - POSTs the same shape to the local save-server (see
    // theme-editor/save-server/), which writes theme-editor/systems/<name>.json
    // on disk. Independent of the localStorage Save above; needs the server
    // running (`docker compose up` in theme-editor/save-server/).
    const saveRepoButton = document.getElementById('saveToRepoButton');
    if (saveRepoButton) saveRepoButton.addEventListener('click', async () => {
        const name = document.getElementById('saveNameInput').value.trim();
        const errorEl = document.getElementById('saveRepoError');
        if (!name) return;
        if (errorEl) errorEl.hidden = true;
        try {
            const res = await fetch(`${SAVE_SERVER_URL}/api/systems/${encodeURIComponent(name)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildSystemSnapshot())
            });
            if (!res.ok) throw new Error(`Server responded ${res.status}`);
        } catch (e) {
            if (errorEl) {
                errorEl.textContent = `Couldn't reach the save-server at ${SAVE_SERVER_URL} - is it running? (docker compose up in theme-editor/save-server/)`;
                errorEl.hidden = false;
            }
            console.error('Save to repo failed:', e);
        }
    });

    // Download zip - every EXPORT_TABS format (tokens.json, design-system.css,
    // theme.css) bundled into one file, downloaded immediately. No server,
    // no separate Export-tab-by-tab download.
    const downloadZipButton = document.getElementById('downloadZipButton');
    if (downloadZipButton) downloadZipButton.addEventListener('click', async () => {
        const name = document.getElementById('saveNameInput').value.trim() || state.themeName || 'design-system';
        const files = [];
        for (const [key, tab] of Object.entries(EXPORT_TABS)) {
            try { files.push({ name: `${name}/${tab.filename}`, content: await tab.build() }); }
            catch (e) { console.error(`Download zip: ${key} export failed`, e); }
        }
        downloadBlob(`${name}.zip`, buildZip(files));
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
    });
});
