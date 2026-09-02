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

// Same idea for spacing: themes only define one "spacing" var - Gap/Padding
// Vertical/Padding Horizontal are new, so all three start equal to it. Gap
// is a single value (not split into -x/-y) - unlike padding, every gap-N
// usage across the templates is a plain single-axis flex/wrap gap, so a
// split axis pair just meant one of the two sliders never visibly did
// anything for most layouts. See buildGapOverrideCss below.
function withSpacingFallback(vars) {
    const base = vars.spacing || '0.25rem';
    return { 'spacing-gap': base, 'spacing-padding-y': base, 'spacing-padding-x': base, ...vars };
}

// The Padding/Gap sliders pick from a fixed set of rem tokens rather than a
// free decimal - same "resolve to a known reference" idea as the Colors
// tab's palette restriction, just for the base spacing unit instead of a
// color. Each slider's range input steps through indices into this array;
// nearestSpacingTokenIndex maps a loaded/imported rem value back onto it.
const SPACING_TOKENS = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

function nearestSpacingTokenIndex(remValue) {
    let bestIndex = 0;
    let bestDist = Infinity;
    SPACING_TOKENS.forEach((token, i) => {
        const dist = Math.abs(token - remValue);
        if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });
    return bestIndex;
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

function withFallbacks(vars) {
    return withShadowFallback(withSpacingFallback(withRadiusFallback(vars)));
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
    // Every palette-sourced field (PALETTE_COLOR_KEYS) gets linked and its
    // value snapped to that link's exact swatch hex right away, rather than
    // carrying the theme's raw value forward and re-guessing a name for it
    // on every render - see the tokenLinks comment above for why that guess
    // is unreliable whenever two palette entries share a hex.
    const links = {
        light: snapVarsToPalette(flat.light, activePaletteSource, PALETTE_COLOR_KEYS),
        dark: snapVarsToPalette(flat.dark, activePaletteSource, PALETTE_COLOR_KEYS)
    };
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

// Every CSS var key that's editable through a palette-popover field (as
// opposed to e.g. the Shadow group's native <input type="color">) - the set
// tokenLinks/snapVarsToPalette resolve and keep snapped to a palette swatch.
const PALETTE_COLOR_KEYS = ALL_COLOR_GROUPS.flatMap(g => g.fields.map(([key]) => key));

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

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'color-field-input' + (linkMatchesSource ? '' : ' color-field-input-unlinked');
    input.value = linkMatchesSource ? link.name : 'No color';
    input.readOnly = true;

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
}

function renderElementTab() {
    const vars = currentVars();

    const cardRadius = parseFloat(vars['radius-card']) || 0.5;
    document.getElementById('cardRadiusRange').value = cardRadius;
    document.getElementById('cardRadiusNumber').value = cardRadius;

    const fieldRadius = parseFloat(vars['radius-field']) || 0.5;
    document.getElementById('fieldRadiusRange').value = fieldRadius;
    document.getElementById('fieldRadiusNumber').value = fieldRadius;

    const buttonRadius = parseFloat(vars['radius-button']) || 0.5;
    document.getElementById('buttonRadiusRange').value = buttonRadius;
    document.getElementById('buttonRadiusNumber').value = buttonRadius;

    [['spacing-padding-y', 'paddingYRange', 'paddingYNumber'], ['spacing-padding-x', 'paddingXRange', 'paddingXNumber'],
     ['spacing-gap', 'gapRange', 'gapNumber']]
        .forEach(([key, rangeId, numberId]) => {
            const val = parseFloat(vars[key]) || 0.25;
            const tokenIndex = nearestSpacingTokenIndex(val);
            document.getElementById(rangeId).value = tokenIndex;
            document.getElementById(numberId).value = SPACING_TOKENS[tokenIndex];
        });

    const shadowHex = cssColorToHex(vars['shadow-color']) || '#000000';
    document.getElementById('shadowColorInput').value = vars['shadow-color'] || shadowHex;
    document.getElementById('shadowColorPicker').value = shadowHex;
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

// Links every key in `keys` to its nearest swatch in `sourceKey` (mutating
// `vars[key]` to that swatch's exact hex, so the link and the applied color
// can never drift apart) and returns the { key: {source, name, hex} } map
// driving tokenLinks. Used at theme-load time and after a raw CSS import -
// the only two paths that can hand a palette-sourced field a value that
// didn't come from the popover itself.
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
// rule is about. One shared --spacing-gap drives row-gap and column-gap
// together (not a split -x/-y pair) - every gap-N in the templates sits on a
// single-row/single-column flex or wrap, so only one axis is ever visually
// relevant at a time and a second slider had nothing to actually show.
function buildGapOverrideCss() {
    const rules = [];
    SPACING_SCALE.forEach(n => {
        const g = `calc(var(--spacing-gap) * ${n})`;
        const selector = `${n}`.replace('.', '\\.'); // e.g. gap-0.5 -> gap-0\.5 (a literal "." starts a new class selector otherwise)
        rules.push(`.gap-${selector} { row-gap: ${g} !important; column-gap: ${g} !important; }`);
        rules.push(`.gap-x-${selector} { column-gap: ${g} !important; }`);
        rules.push(`.gap-y-${selector} { row-gap: ${g} !important; }`);
    });
    return rules.join('\n');
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
    const rules = [];
    Object.entries(sideDecls).forEach(([prefix, makeDecl]) => {
        SPACING_SCALE.forEach(n => {
            const x = `calc(var(--spacing-padding-x) * ${n})`;
            const y = `calc(var(--spacing-padding-y) * ${n})`;
            const selector = `${prefix}-${n}`.replace('.', '\\.'); // e.g. p-0.5 -> p-0\.5 (a literal "." starts a new class selector otherwise)
            rules.push(`.${selector} { ${makeDecl(x, y)} }`);
        });
    });
    return rules.join('\n');
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
function cssVarBlockFor(vars) {
    const lines = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`);
    if (vars['shadow-color']) {
        lines.push(`  --shadow-color-a: rgb(from var(--shadow-color) r g b / var(--shadow-opacity, 1));`);
    }
    PALETTE_COLOR_KEYS.forEach(key => {
        const hex = cssColorToHex(vars[key]);
        if (hex) lines.push(`  --${key}-rgb: ${hexToRgb(hex).join(' ')};`);
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
          sm: 'calc(var(--radius-field) - 4px)', md: 'calc(var(--radius-field) - 2px)',
          lg: 'var(--radius-card)', xl: 'calc(var(--radius-card) + 4px)', '2xl': 'calc(var(--radius-card) + 8px)',
          btn: 'var(--radius-button)'
        },
        fontFamily: {
          sans: ['var(--font-sans)'], serif: ['var(--font-serif)'], mono: ['var(--font-mono)']
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
function buildCodeOutput() {
    const light = Object.entries(state.vars.light).map(([k, v]) => `  --${k}: ${v};`).join('\n');
    const dark = Object.entries(state.vars.dark).map(([k, v]) => `  --${k}: ${v};`).join('\n');
    return `:root {\n${light}\n}\n\n.dark {\n${dark}\n}`;
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
            // Field names are resolved against activePaletteSource - re-derive them
            renderColorGroups();
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
    const makeRadiusSync = (key, rangeId, numberId) => (val) => {
        document.getElementById(rangeId).value = val;
        document.getElementById(numberId).value = val;
        setVar(key, `${val}rem`);
    };
    const syncCardRadius = makeRadiusSync('radius-card', 'cardRadiusRange', 'cardRadiusNumber');
    document.getElementById('cardRadiusRange').addEventListener('input', (e) => syncCardRadius(e.target.value));
    document.getElementById('cardRadiusNumber').addEventListener('input', (e) => syncCardRadius(e.target.value));

    const syncFieldRadius = makeRadiusSync('radius-field', 'fieldRadiusRange', 'fieldRadiusNumber');
    document.getElementById('fieldRadiusRange').addEventListener('input', (e) => syncFieldRadius(e.target.value));
    document.getElementById('fieldRadiusNumber').addEventListener('input', (e) => syncFieldRadius(e.target.value));

    const syncButtonRadius = makeRadiusSync('radius-button', 'buttonRadiusRange', 'buttonRadiusNumber');
    document.getElementById('buttonRadiusRange').addEventListener('input', (e) => syncButtonRadius(e.target.value));
    document.getElementById('buttonRadiusNumber').addEventListener('input', (e) => syncButtonRadius(e.target.value));

    // The range input's value is a SPACING_TOKENS index, not a rem amount -
    // the paired number field is a readonly readout of the resolved token,
    // not a free-text input, so only the range needs a listener.
    const makeSpacingSync = (key, rangeId, numberId) => (tokenIndex) => {
        const rem = SPACING_TOKENS[tokenIndex];
        document.getElementById(numberId).value = rem;
        setVar(key, `${rem}rem`);
    };
    [['spacing-padding-y', 'paddingYRange', 'paddingYNumber'], ['spacing-padding-x', 'paddingXRange', 'paddingXNumber'],
     ['spacing-gap', 'gapRange', 'gapNumber']]
        .forEach(([key, rangeId, numberId]) => {
            const sync = makeSpacingSync(key, rangeId, numberId);
            document.getElementById(rangeId).addEventListener('input', (e) => sync(e.target.value));
        });

    // Shadow fields
    document.getElementById('shadowColorInput').addEventListener('change', (e) => {
        document.getElementById('shadowColorPicker').value = cssColorToHex(e.target.value) || '#000000';
        setVar('shadow-color', e.target.value);
    });
    document.getElementById('shadowColorPicker').addEventListener('input', (e) => {
        document.getElementById('shadowColorInput').value = e.target.value;
        setVar('shadow-color', e.target.value);
    });
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
        const matches = [...text.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)];
        if (!matches.length) {
            errorEl.textContent = 'No --variable: value; declarations found.';
            return;
        }
        pushUndo();
        matches.forEach(([, key, value]) => { state.vars[state.mode][key.trim()] = value.trim(); });
        // Imported values (like a theme's own baked-in defaults) didn't come
        // through the popover, so they need the same link-and-snap pass
        // loadTheme gives every color - limited to the keys this import
        // actually touched, so unrelated fields' existing links are untouched.
        const importedKeys = PALETTE_COLOR_KEYS.filter(key => matches.some(([, k]) => k.trim() === key));
        Object.assign(tokenLinks[state.mode], snapVarsToPalette(state.vars[state.mode], activePaletteSource, importedKeys));
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
