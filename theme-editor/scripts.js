// Theme Editor v2 - design-system creator. The sidebar edits three token
// layers (foundation subset -> semantic -> component part) and a preview
// iframe renders three pages (Foundation, Typography, Elements) from those
// tokens alone - see REQUIREMENTS-v2.md and ARCHITECTURE-v2.md.
//
// Preview isolation is structural: the preview is a real <iframe>, a separate
// document from this page. The editor chrome is styled entirely by styles.css
// and never touches the design system's CSS variables.
//
// Sibling modules (plain globals, see index.html load order): foundation.js
// (FOUNDATION scales + ref helpers), components.js (ELEMENTS spec, seeding,
// wiring CSS, gallery), pages.js (Foundation/Typography page HTML), dtcg.js
// (tokens.json export/import).

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
    palette: { families: [] },
    loadedPalette: { families: [] },
    components: {},
    loadedComponents: {},
    activePage: 'elements',
    selection: null
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

// --- Palette subset ---
function neutralFamilyFor(sourceKey) {
    return sourceKey === 'atlassian' ? 'Neutral' : 'neutral';
}

function isSpecialName(name) {
    return POPOVER_SPECIALS.some(([, special]) => special === name);
}

// Families the current links land in (both modes), in source order, plus a
// neutral ramp if none of them is neutral-ish - a system with no neutral
// can't build a surface.
function derivePaletteFamilies() {
    const used = new Set();
    ['light', 'dark'].forEach(mode => {
        Object.values(tokenLinks[mode]).forEach(link => {
            if (link.source !== activePaletteSource) return;
            const family = paletteFamilyOfName(activePaletteSource, link.name);
            if (family) used.add(family);
        });
    });
    if (![...used].some(f => /neutral|gray|zinc|slate|stone|mauve|olive|mist|taupe/i.test(f))) used.add(neutralFamilyFor(activePaletteSource));
    return foundationOf(activePaletteSource).color.families().filter(f => used.has(f));
}

function unionFamilies(a, b) {
    const set = new Set([...a, ...b]);
    return foundationOf(activePaletteSource).color.families().filter(f => set.has(f));
}

// A link "is in the palette" when it names a swatch of the active source that
// sits in the declared subset (specials always count).
function isLinkInPalette(link) {
    if (!link || link.source !== activePaletteSource) return false;
    if (isSpecialName(link.name)) return true;
    const family = paletteFamilyOfName(activePaletteSource, link.name);
    return !!family && state.palette.families.includes(family);
}

function toggleRamp(family) {
    const families = state.palette.families;
    const next = families.includes(family) ? families.filter(f => f !== family) : unionFamilies(families, [family]);
    if (!next.length) return;
    pushUndo();
    state.palette.families = next;
    renderAll();
}

// --- Load / undo ---
function undoSnapshot() {
    return JSON.stringify({ source: activePaletteSource, vars: state.vars, tokenLinks, components: state.components, palette: state.palette });
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

function applyLoaded({ name, vars, links, families, components }) {
    state.themeName = name;
    state.vars = { light: { ...vars.light }, dark: { ...vars.dark } };
    state.loadedVars = { light: { ...vars.light }, dark: { ...vars.dark } };
    tokenLinks = { light: { ...links.light }, dark: { ...links.dark } };
    loadedTokenLinks = { light: { ...links.light }, dark: { ...links.dark } };
    state.palette = { families: families && families.length ? [...families] : derivePaletteFamilies() };
    state.loadedPalette = { families: [...state.palette.families] };
    state.components = { ...components };
    state.loadedComponents = { ...components };
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
            components: { ...seedComponentsFor(vars.light), ...(saved.components || {}) }
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
    renderColorGroups();
    if (key.startsWith('type-') || key.startsWith('font-')) renderTypographyTab();
    renderInspector();
}

function setComponentToken(id, ref) {
    pushUndo();
    state.components[id] = ref;
    renderPreview();
    renderInspector();
}

function clearComponentToken(id) {
    if (!Object.prototype.hasOwnProperty.call(state.components, id)) return;
    pushUndo();
    delete state.components[id];
    renderPreview();
    renderInspector();
}

function updateUndoRedoButtons() {
    document.getElementById('undoButton').disabled = undoStack.length === 0;
    document.getElementById('redoButton').disabled = redoStack.length === 0;
}

// --- Sidebar tabs ---
function showSidebarTab(key) {
    document.querySelectorAll('.sidebar-tab').forEach(b => b.classList.toggle('active', b.dataset.sidebarTab === key));
    document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.toggle('active', p.dataset.sidebarPanel === key));
}

// --- Sidebar: Colors ---
const openGroups = new Set(ALL_COLOR_GROUPS.filter(g => g.open).map(g => g.key));

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
        details.dataset.group = group.key;
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

// Every semantic color whose active-mode link doesn't land in the declared
// palette subset (no link, other source, or a ramp that was removed).
function unlinkedColorKeys() {
    return LINKABLE_COLOR_KEYS.filter(key => !isLinkInPalette(tokenLinks[state.mode][key]));
}

function renderColorLinkSummary() {
    const unlinked = unlinkedColorKeys();
    const total = LINKABLE_COLOR_KEYS.length;
    const linked = total - unlinked.length;
    const text = document.getElementById('colorLinkSummaryText');
    text.textContent = `${linked} of ${total} colors linked (${state.mode})`;
    text.classList.toggle('color-link-summary-text-warning', unlinked.length > 0);
    text.title = unlinked.length ? `Outside the palette: ${unlinked.join(', ')}` : 'Every color resolves to a palette token in the subset';
    document.getElementById('snapAllColorsButton').hidden = unlinked.length === 0;
}

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
    const sameSource = link && link.source === activePaletteSource;

    // Three states: in the palette (token name); linked but outside the
    // subset / other source ("Outside palette"); no link at all ("Unlinked").
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'color-field-input' + (inPalette ? '' : ' color-field-input-unlinked');
    input.value = inPalette ? link.name : (link ? 'Outside palette' : 'Unlinked');
    input.title = inPalette
        ? `${foundationOf(activePaletteSource).label} ${link.name}`
        : (link
            ? `Linked to ${(FOUNDATION[link.source] || {}).label || link.source} ${link.name} - not in this system's palette subset`
            : 'Not linked to any palette token - pick a swatch, or use "Snap all to palette"');
    input.readOnly = true;
    if (!inPalette) {
        const dot = document.createElement('span');
        dot.className = 'color-field-unlinked-dot';
        dot.title = input.title;
        swatch.appendChild(dot);
    }

    const openPicker = () => openColorPalettePopover(paletteBtn, sameSource ? link.name : null, (newHex, newName) => {
        setVar(key, newHex, { link: { source: activePaletteSource, name: newName, hex: newHex.toLowerCase() } });
    });
    input.addEventListener('click', (e) => { e.stopPropagation(); openPicker(); });

    const paletteBtn = document.createElement('button');
    paletteBtn.className = 'color-field-palette-btn';
    paletteBtn.title = `Pick from the ${foundationOf(activePaletteSource).label} palette subset`;
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

// Jump from the preview's semantic list to the matching Colors-tab row.
function revealSemanticRow(key) {
    const group = ALL_COLOR_GROUPS.find(g => g.fields.some(([k]) => k === key));
    if (!group) return;
    showSidebarTab('colors');
    document.getElementById('colorSearchInput').value = '';
    openGroups.add(group.key);
    renderColorGroups();
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

// Only the declared subset's ramps are offered - the palette IS the subset.
function renderColorPopoverGrid() {
    const popover = document.getElementById('colorPalettePopover');
    const grid = popover.querySelector('.color-popover-grid');
    grid.innerHTML = '';
    const families = state.palette.families.length ? state.palette.families : foundationOf(activePaletteSource).color.families();
    families.forEach(family => {
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
    const families = new Set(state.palette.families);
    Object.values(links).forEach(link => {
        if (link.source !== source) return;
        const family = paletteFamilyOfName(source, link.name);
        if (family) families.add(family);
    });
    foundationOf(source).color.families().filter(f => families.has(f)).forEach(family => {
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
        const linked = link && link.source === source && (isSpecialName(link.name) || families.has(paletteFamilyOfName(source, link.name)));
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

function pagesCtx() {
    const foundation = foundationOf(activePaletteSource);
    return {
        source: activePaletteSource,
        foundation,
        families: state.palette.families,
        allFamilies: foundation.color.families(),
        vars: state.vars,
        links: tokenLinks,
        mode: state.mode,
        semanticGroups: ALL_COLOR_GROUPS,
        components: state.components,
        usage: typeof componentUsage === 'function' ? componentUsage(state.components) : {},
        typeSets: TYPE_SETS,
        typeSetSummary
    };
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
<body data-route="${state.activePage}" data-inspect-state="${state.selection ? state.selection.state : 'default'}">
<section data-page="foundation">${safeBuild('buildFoundationPageHtml', pagesCtx())}</section>
<section data-page="typography">${safeBuild('buildTypographyPageHtml', pagesCtx())}</section>
<section data-page="elements">${safeBuild('buildGalleryHtml')}</section>
<script src="preview/frame.js"><\/script>
</body>
</html>`;
}

function previewDocument() {
    const iframe = document.getElementById('previewFrame');
    const doc = iframe.contentDocument;
    return doc && doc.getElementById('theme-vars') ? doc : null;
}

// Marks the selected part in the gallery cell for the state being inspected.
function applySelectionHighlight(doc) {
    doc.querySelectorAll('[data-selected]').forEach(el => el.removeAttribute('data-selected'));
    const sel = state.selection;
    doc.body.dataset.inspectState = sel ? sel.state : 'default';
    if (!sel) return;
    const variantSel = sel.variant ? `[data-variant="${CSS.escape(sel.variant)}"]` : ':not([data-variant])';
    const root = doc.querySelector(`[data-page="elements"] [data-element="${CSS.escape(sel.element)}"]${variantSel}[data-state="${CSS.escape(sel.state)}"]`);
    if (!root) return;
    const part = root.dataset.part === sel.part ? root : root.querySelector(`[data-part="${CSS.escape(sel.part)}"]`);
    if (part) part.setAttribute('data-selected', '');
}

// Edits patch the one theme-vars <style> and re-render the two read-mostly
// pages; the gallery DOM stays put so selection survives. A full srcdoc
// build happens only once (or if the document went away).
function renderPreview() {
    const iframe = document.getElementById('previewFrame');
    const vars = currentVars();
    const links = tokenLinks[state.mode];
    const doc = previewDocument();
    if (doc) {
        doc.getElementById('theme-vars').textContent = themeVarsCss(vars, links);
        syncPreviewTypeHead(doc, vars);
        const foundationPage = doc.querySelector('[data-page="foundation"]');
        const typographyPage = doc.querySelector('[data-page="typography"]');
        const ctx = pagesCtx();
        if (foundationPage) foundationPage.innerHTML = safeBuild('buildFoundationPageHtml', ctx);
        if (typographyPage) typographyPage.innerHTML = safeBuild('buildTypographyPageHtml', ctx);
        doc.body.dataset.route = state.activePage;
        applySelectionHighlight(doc);
        return;
    }
    iframe.srcdoc = buildPreviewDocument(vars, links);
}

function renderPageTabs() {
    document.querySelectorAll('.preview-tab').forEach(b => b.classList.toggle('active', b.dataset.page === state.activePage));
}

function renderAll() {
    renderColorGroups();
    renderTypographyTab();
    renderThemePickerButton();
    renderColorPopoverGrid();
    renderPageTabs();
    renderInspector();
    renderPreview();
}

// --- Inspector ---
const STATE_LABELS = { default: 'Default', hover: 'Hover', focus: 'Focus', active: 'Active', disabled: 'Disabled' };

// elementSpec(keyOrSpec) comes from components.js.

function titleCase(text) {
    return String(text || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Token id per the contract grammar: element[.variant].part[.prop][.state]
// (prop only for multi-prop parts, state only when not default).
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

// Full chain for a ref, for the breadcrumb: "color.border → neutral-200 (#e5e5e5)".
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

// Short resolved readout for a prop row: hex, px, or the type summary.
function resolvedReadout(ref) {
    const parsed = parseRef(ref);
    if (!parsed) return { text: '?', hex: null };
    const { kind, name } = parsed;
    if (kind === 'color') {
        const hex = cssColorToHex(currentVars()[name] || '');
        const link = tokenLinks[state.mode][name];
        return { text: link ? `${link.name} ${hex || ''}` : (hex || 'unlinked'), hex };
    }
    if (kind === 'palette') {
        const entry = findPaletteEntryByName(activePaletteSource, name);
        return { text: entry ? entry.hex : '?', hex: entry ? (entry.hex === 'transparent' ? null : entry.hex) : null };
    }
    if (kind === 'type') {
        const set = TYPE_SETS.find(s => s.key === name);
        return { text: set ? typeSetSummary(currentVars(), set) : '?', hex: null };
    }
    const entry = findScaleEntry(activePaletteSource, kind, name);
    return { text: entry ? (entry.px !== null && entry.px !== undefined ? `${entry.px}px` : entry.value) : 'off-scale', hex: null };
}

function renderInspectorElementSelect() {
    const select = document.getElementById('inspectorElementSelect');
    if (!select || typeof ELEMENTS === 'undefined') return;
    if (!select.options.length) {
        const first = document.createElement('option');
        first.value = '';
        first.textContent = 'Pick an element…';
        select.appendChild(first);
        ELEMENTS.forEach(spec => {
            (spec.variants || [null]).forEach(variant => {
                const opt = document.createElement('option');
                opt.value = `${spec.key}|${variant || ''}`;
                opt.textContent = variant ? `${spec.label} · ${titleCase(variant)}` : spec.label;
                select.appendChild(opt);
            });
        });
    }
    const sel = state.selection;
    select.value = sel ? `${sel.element}|${sel.variant || ''}` : '';
}

function renderInspector() {
    const empty = document.getElementById('inspectorEmpty');
    const panel = document.getElementById('inspectorPanel');
    if (!empty || !panel) return;
    renderInspectorElementSelect();
    const sel = state.selection;
    const spec = sel && elementSpec(sel.element);
    if (!spec) {
        empty.hidden = false;
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }
    empty.hidden = true;
    panel.hidden = false;
    panel.innerHTML = '';
    const el = (tag, className, props = {}) => Object.assign(document.createElement(tag), { className, ...props });

    if (!spec.states.includes(sel.state)) sel.state = 'default';
    const selectedPart = spec.parts.find(p => p.key === sel.part) || spec.parts[0];
    sel.part = selectedPart.key;

    // Breadcrumb for the part's first property.
    const firstProp = selectedPart.props[0];
    const firstId = partPropId(spec, sel.variant, selectedPart, firstProp, sel.state);
    const crumbs = [spec.label];
    if (sel.variant) crumbs.push(titleCase(sel.variant));
    crumbs.push(selectedPart.label || titleCase(selectedPart.key));
    if (selectedPart.props.length > 1) crumbs.push(firstProp.label || titleCase(firstProp.key));
    const breadcrumb = el('div', 'inspector-breadcrumb', { textContent: `${crumbs.join(' › ')} → ${describeRef(componentRef(firstId))}` });
    breadcrumb.title = breadcrumb.textContent;
    panel.appendChild(breadcrumb);

    // State switch - a dot marks states carrying explicit overrides.
    const explicitStates = new Set();
    Object.keys(state.components).forEach(id => {
        const prefix = componentId(spec.key, sel.variant, '', null, null).replace(/\.$/, '');
        if (!id.startsWith(`${prefix}.`)) return;
        const last = id.split('.').pop();
        if (STATE_LABELS[last] && last !== 'default') explicitStates.add(last);
    });
    if (spec.states.length > 1) {
        const switcher = el('div', 'inspector-states');
        spec.states.forEach(st => {
            const btn = el('button', 'inspector-state-btn' + (st === sel.state ? ' active' : '') + (explicitStates.has(st) ? ' has-override' : ''), { textContent: STATE_LABELS[st] || titleCase(st), type: 'button' });
            btn.title = explicitStates.has(st) ? `${STATE_LABELS[st]} has its own values` : `${STATE_LABELS[st]} inherits default unless edited`;
            btn.addEventListener('click', () => {
                state.selection.state = st;
                renderInspector();
                const doc = previewDocument();
                if (doc) applySelectionHighlight(doc);
            });
            switcher.appendChild(btn);
        });
        panel.appendChild(switcher);
    }

    // Parts: the selected one open, the rest folded.
    spec.parts.forEach(part => {
        const details = el('details', 'color-group inspector-part');
        details.open = part.key === selectedPart.key;
        const summary = el('summary', 'color-group-label');
        summary.appendChild(el('span', '', { textContent: part.label || titleCase(part.key) }));
        summary.appendChild(el('span', 'inspector-part-count', { textContent: `${part.props.length} prop${part.props.length === 1 ? '' : 's'}` }));
        details.appendChild(summary);
        details.addEventListener('toggle', () => { if (details.open) { state.selection.part = part.key; } });
        const body = el('div', 'color-group-body');
        part.props.forEach(prop => body.appendChild(renderInspectorPropRow(spec, sel, part, prop)));
        details.appendChild(body);
        panel.appendChild(details);
    });
}

function renderInspectorPropRow(spec, sel, part, prop) {
    const el = (tag, className, props = {}) => Object.assign(document.createElement(tag), { className, ...props });
    const id = partPropId(spec, sel.variant, part, prop, sel.state);
    const defaultId = partPropId(spec, sel.variant, part, prop, 'default');
    const explicit = Object.prototype.hasOwnProperty.call(state.components, id);
    const inherited = sel.state !== 'default' && !explicit;
    const ref = componentRef(id) || componentRef(defaultId) || '';
    const kind = prop.kind;

    const row = el('div', 'inspector-prop' + (inherited ? ' inspector-prop-inherited' : ''));
    row.dataset.id = id;
    const head = el('div', 'inspector-prop-head');
    head.appendChild(el('span', 'inspector-prop-label', { textContent: prop.label || titleCase(prop.key || part.key) }));
    const chip = el('span', 'inspector-prop-chip', { textContent: ref });
    chip.title = id;
    head.appendChild(chip);
    if (inherited) head.appendChild(el('span', 'inspector-prop-inherit-note', { textContent: 'inherits default' }));
    if (explicit && sel.state !== 'default') {
        const inheritBtn = el('button', 'inspector-inherit-btn', { type: 'button', innerHTML: '<i class="fas fa-rotate-left"></i> inherit' });
        inheritBtn.title = 'Drop this state\'s own value and inherit the default state again';
        inheritBtn.addEventListener('click', () => clearComponentToken(id));
        head.appendChild(inheritBtn);
    }
    row.appendChild(head);

    const controlRow = el('div', 'inspector-prop-control');
    const readout = resolvedReadout(ref);
    if (kind === 'color') {
        const btn = el('button', 'inspector-color-btn', { type: 'button' });
        const swatch = el('span', 'color-field-swatch');
        if (readout.hex) swatch.style.backgroundColor = readout.hex;
        else swatch.classList.add('color-field-swatch-transparent');
        btn.append(swatch, el('span', 'inspector-color-btn-text', { textContent: readout.text }));
        btn.title = 'Pick a semantic role or a palette step';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openColorPalettePopover(btn, null, (hex, name, pickedRef) => setComponentToken(id, pickedRef), { semantic: true, currentRef: ref });
        });
        controlRow.appendChild(btn);
    } else if (kind === 'type') {
        const select = el('select', 'field-select inspector-select');
        TYPE_SETS.forEach(set => {
            const opt = el('option', '', { value: `type.${set.key}`, textContent: `${set.label} · ${typeSetSummary(currentVars(), set)}` });
            select.appendChild(opt);
        });
        select.value = ref;
        select.addEventListener('change', () => setComponentToken(id, select.value));
        controlRow.appendChild(select);
    } else if (KIND_PREFIX[kind]) {
        const select = el('select', 'field-select inspector-select');
        scaleEntries(activePaletteSource, kind).forEach(entry => {
            select.appendChild(el('option', '', { value: scaleRef(kind, entry.name), textContent: scaleEntryLabel(entry) }));
        });
        if (![...select.options].some(o => o.value === ref)) {
            select.appendChild(el('option', '', { value: ref, textContent: `${ref} (off-scale)` }));
        }
        select.value = ref;
        select.addEventListener('change', () => setComponentToken(id, select.value));
        controlRow.appendChild(select);
        controlRow.appendChild(el('span', 'field-readout', { textContent: readout.text }));
    } else {
        controlRow.appendChild(el('span', 'field-readout', { textContent: `${ref} (${kind})` }));
    }
    row.appendChild(controlRow);
    return row;
}

function selectElement(element, variant, part, stateKey) {
    const spec = elementSpec(element);
    if (!spec) return;
    state.selection = {
        element,
        variant: variant || (spec.variants ? spec.variants[0] : null),
        part: part || spec.parts[0].key,
        state: stateKey || 'default'
    };
    showSidebarTab('inspector');
    renderInspector();
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
    ['light', 'dark'].forEach(mode => {
        tokenLinks[mode] = { ...tokenLinks[mode], ...snapVarsToPalette(state.vars[mode], next, LINKABLE_COLOR_KEYS) };
        snapTypeToScale(state.vars[mode]);
    });
    if (typeof remapComponentTokens === 'function') state.components = remapComponentTokens(state.components, prev, next);
    state.palette.families = derivePaletteFamilies();
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

function downloadText(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    state.palette.families = unionFamilies(state.palette.families, derivePaletteFamilies());
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
    state.palette.families = unionFamilies(state.palette.families, derivePaletteFamilies());
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

    document.querySelectorAll('.preview-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activePage = btn.dataset.page;
            renderPageTabs();
            renderPreview();
        });
    });

    // Messages from the preview frame (see preview/frame.js).
    window.addEventListener('message', (e) => {
        const iframe = document.getElementById('previewFrame');
        if (e.source !== iframe.contentWindow || !e.data || typeof e.data.type !== 'string') return;
        const msg = e.data;
        if (msg.type === 'ds:ready') {
            const doc = previewDocument();
            if (doc) { doc.body.dataset.route = state.activePage; applySelectionHighlight(doc); }
        } else if (msg.type === 'ds:select') {
            selectElement(msg.element, msg.variant || null, msg.part, msg.state || 'default');
        } else if (msg.type === 'ds:action') {
            if (msg.action === 'toggle-ramp' && msg.family) toggleRamp(msg.family);
            else if (msg.action === 'edit-semantic' && msg.key) revealSemanticRow(msg.key);
        }
    });

    const inspectorSelect = document.getElementById('inspectorElementSelect');
    if (inspectorSelect) {
        inspectorSelect.addEventListener('change', () => {
            if (!inspectorSelect.value) { state.selection = null; renderInspector(); const doc = previewDocument(); if (doc) applySelectionHighlight(doc); return; }
            const [element, variant] = inspectorSelect.value.split('|');
            selectElement(element, variant || null, null, 'default');
            const doc = previewDocument();
            if (doc) {
                const root = doc.querySelector(`[data-page="elements"] [data-element="${CSS.escape(element)}"]`);
                if (root && state.activePage === 'elements') root.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
    }

    document.getElementById('colorSearchInput').addEventListener('input', renderColorGroups);
    document.getElementById('toggleAllColorGroupsButton').addEventListener('click', () => {
        const allOpen = ALL_COLOR_GROUPS.every(g => openGroups.has(g.key));
        setAllColorGroupsOpen(!allOpen);
    });
    // "Snap all to palette" - nearest swatch WITHIN the subset, one undo step.
    document.getElementById('snapAllColorsButton').addEventListener('click', () => {
        const unlinked = unlinkedColorKeys();
        if (!unlinked.length) return;
        pushUndo();
        Object.assign(tokenLinks[state.mode], snapVarsToPalette(state.vars[state.mode], activePaletteSource, unlinked, state.palette.families));
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
        if (!e.target.closest('#themePickerButton') && !e.target.closest('#themePickerMenu')) document.getElementById('themePickerMenu').hidden = true;
    });

    // Palette-source switcher
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
        customSystems[name] = {
            source: activePaletteSource,
            palette: { families: [...state.palette.families] },
            vars: { light: { ...state.vars.light }, dark: { ...state.vars.dark } },
            tokenLinks: { light: { ...tokenLinks.light }, dark: { ...tokenLinks.dark } },
            components: { ...state.components }
        };
        saveCustomSystems();
        state.themeName = name;
        renderThemePickerButton();
        document.getElementById('saveModal').hidden = true;
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
    });
});
