let paletteGenerated = false;
let currentTypographyStyles = {};

let typescaleData = {
    size: {},
    "line-height": {}
};

// Spacing scale steps (multiples of the base unit, matching a 4-point grid)
const spacingSteps = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64];

// Border-radius scale: sm/md tied to the same base unit as spacing, full = pill
const radiusSteps = [
    { key: 'sm', multiplier: 1 },
    { key: 'md', multiplier: 2 },
    { key: 'full', px: 9999 }
];

const colorRolesTemplate = {
    "Primary": "Primary 40",
    "On Primary": "Primary 100",
    "Primary Container": "Primary 90",
    "On Primary Container": "Primary 10",
    "Primary Fixed": "Primary 90",
    "On Primary Fixed": "Primary 10",
    "Primary Fixed Dim": "Primary 80",
    "On Primary Fixed Variant": "Primary 30",

    "Secondary": "Secondary 40",
    "On Secondary": "Secondary 100",
    "Secondary Container": "Secondary 90",
    "On Secondary Container": "Secondary 10",
    "Secondary Fixed": "Secondary 90",
    "On Secondary Fixed": "Secondary 10",
    "Secondary Fixed Dim": "Secondary 80",
    "On Secondary Fixed Variant": "Secondary 30",

    "Tertiary": "Tertiary 40",
    "On Tertiary": "Tertiary 100",
    "Tertiary Container": "Tertiary 90",
    "On Tertiary Container": "Tertiary 10",
    "Tertiary Fixed": "Tertiary 90",
    "On Tertiary Fixed": "Tertiary 10",
    "Tertiary Fixed Dim": "Tertiary 80",
    "On Tertiary Fixed Variant": "Tertiary 30",

    "Error": "Error 40",
    "On Error": "Error 100",
    "Error Container": "Error 90",
    "On Error Container": "Error 10",

    "Background": "Neutral 98",
    "On Background": "Neutral 10",
    "Surface": "Neutral 98",
    "On Surface": "Neutral 10",
    "Surface Variant": "Neutral Variant 90",
    "On Surface Variant": "Neutral Variant 30",

    "Surface Container Highest": "Neutral 90",
    "Surface Container High": "Neutral 92",
    "Surface Container": "Neutral 94",
    "Surface Container Low": "Neutral 96",
    "Surface Container Lowest": "Neutral 100",

    "Surface Bright": "Neutral 98",
    "Surface Dim": "Neutral 87",

    "Outline": "Neutral Variant 50",
    "Outline Variant": "Neutral Variant 80",
    "Shadow": "Primary 0 45%",
    "Scrim": "Neutral 0 32%",

    "Inverse Surface": "Neutral 20",
    "Inverse On Surface": "Neutral 95",
    "Inverse Primary": "Primary 80",
    "Inverse Secondary": "Secondary 80",
    "Inverse Tertiary": "Tertiary 80",
    "Inverse Error": "Error 80",

    "state-layer/Enabled": "Primary 40 0%",
    "state-layer/Disabled": "Neutral 10 12%",
    "state-layer/Hovered": "Primary 40 8%",
    "state-layer/Focused": "Primary 40 10%",
    "state-layer/Pressed": "Primary 40 10%",
    "state-layer/Dragged": "Primary 40 10%"
};

// Penpot token names may only contain letters/digits separated by "." or "-"
// (no spaces, no "/") - this turns any human-readable label into a valid one.
function slugify(str) {
    return str
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Matches the key format used in the "palettes" group: "<color-name>.<step>"
function paletteKey(name, step) {
    return `${slugify(name)}.${step}`;
}

// Include the defaultScaleData constant
const defaultScaleData = {
    "scaffold": {
        "margin": { "$type": "number", "$value": 16 },
        "gap": { "$type": "number", "$value": 24 },
        "no-padding": { "$type": "number", "$value": 0 }
    },
    "component": {
        "margin": { "$type": "number", "$value": 16 },
        "gap": { "$type": "number", "$value": 12 },
        "padding": { "$type": "number", "$value": 16 },
        "grid": { "$type": "number", "$value": 24 }
    },
    "icon-small": { "$type": "number", "$value": 14 },
    "icon-big": { "$type": "number", "$value": 24 },
    "calendar": {
        "padding": { "$type": "number", "$value": 93 },
        "gap": { "$type": "number", "$value": 55 }
    },
    "corner": {
        "None": { "$type": "number", "$value": 0 },
        "Extra-small": { "$type": "number", "$value": 4 },
        "Small": { "$type": "number", "$value": 8 },
        "Medium": { "$type": "number", "$value": 12 },
        "Large": { "$type": "number", "$value": 16 },
        "Extra-large": { "$type": "number", "$value": 28 },
        "Full": { "$type": "number", "$value": 999 }
    },
    "element": {
        "margin": { "$type": "number", "$value": 16 },
        "padding": { "$type": "number", "$value": 16 },
        "grid": { "$type": "number", "$value": 24 },
        "gap": { "$type": "number", "$value": 20 }
    },
    "atom": {
        "margin": { "$type": "number", "$value": 16 },
        "padding": { "$type": "number", "$value": 16 },
        "grid": { "$type": "number", "$value": 8 },
        "gap": { "$type": "number", "$value": 4 }
    },
    "card": {
        "margin": { "$type": "number", "$value": 32 },
        "padding": { "$type": "number", "$value": 16 }
    }
};

// Constants and default values
const defaultColors = {
    "Primary": "#6750A4",
    "Secondary": "#4A4459",
    "Tertiary": "#7E5260",
    "Error": "#A53A36",
    "Neutral": "#606062",
    "Neutral Variant": "#6D786E"
};

const lastColors = {};

// The M3 role system (colorRolesTemplate) hardcodes these six seed names -
// rows for them always exist, in this order, and their name field is locked.
// Any other color name (manual or imported from a DESIGN.md) is a free-form
// "extra" row: still gets its own tonal scale, but isn't wired into M3 roles.
const CANONICAL_ROLES = ["Primary", "Secondary", "Tertiary", "Error", "Neutral", "Neutral Variant"];

// Library of named color sets ("design systems") selectable from the
// palette dropdown. Custom entries persist to localStorage; "Material
// Default" is the original built-in starting point and can't be deleted.
const PALETTE_LIBRARY_STORAGE_KEY = 'designFoundationGenerator.paletteLibrary';
const paletteLibrary = {
    "Material Default": { colors: { ...defaultColors }, builtin: true }
};

const steps = [100, 99, 98, 96, 95, 94, 92, 90, 87, 80, 70, 60, 50, 40, 30, 20, 10, 0];

// Updated font lists
const displayFonts = [
    'Playfair Display', 'Abril Fatface', 'Lobster', 'Dancing Script', 'Great Vibes',
    'Pacifico', 'Fredoka One', 'Amatic SC', 'Courgette', 'Satisfy'
    ];

const sansSerifFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
    'Raleway', 'PT Sans', 'Poppins', 'Noto Sans', 'Ubuntu', 'Mukta',
    'Nunito', 'Work Sans', 'Quicksand', 'Inter'
    ];


const fontWeights = [
    { name: 'Thin', value: '100' },
    { name: 'Extra Light', value: '200' },
    { name: 'Light', value: '300' },
    { name: 'Regular', value: '400' },
    { name: 'Medium', value: '500' },
    { name: 'Semi Bold', value: '600' },
    { name: 'Bold', value: '700' },
    { name: 'Extra Bold', value: '800' },
    { name: 'Black', value: '900' }
    ];


// Color conversion functions
function hexToRgb(hex) {
    return hex.replace(/^#/, '').match(/.{2}/g).map(val => parseInt(val, 16));
}

function rgbToHex([r, g, b]) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function hexToRgba(hex, alphaPercent) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;
}

function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if(max === min){
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = {
            [r]: (g - b) / d + (g < b ? 6 : 0),
            [g]: (b - r) / d + 2,
            [b]: (r - g) / d + 4
        }[max];
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb([h, s, l]) {
    h /= 360; s /= 100; l /= 100;
    if(s === 0){
        const val = l * 255;
        return [val, val, val];
    }
    const hue2rgb = (p, q, t) => {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3) * 255;
    const g = hue2rgb(p, q, h) * 255;
    const b = hue2rgb(p, q, h - 1/3) * 255;
    return [Math.round(r), Math.round(g), Math.round(b)];
}

// Normalize any valid CSS color string (hex, rgb(), hsl(), oklch(), named,
// etc.) to a "#RRGGBB" hex string, using the browser's own color parser
// rather than reimplementing one. Returns null if the value isn't a valid
// CSS color the browser recognizes.
//
// Reads back the actual rendered pixel from a 1x1 canvas rather than a
// computed-style string: newer browsers serialize getComputedStyle (and
// canvas fillStyle itself) for oklch()/oklab()/lch()/lab()/color() by
// echoing the original notation back rather than converting to rgb(), so
// parsing that string breaks for exactly the color functions this is meant
// to support. Actually painting and reading the pixel sidesteps the
// serialization format entirely and always yields concrete sRGB bytes.
function cssColorToHex(value) {
    if (!cssColorToHex._ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        cssColorToHex._ctx = canvas.getContext('2d', { willReadFrequently: true });
    }
    const ctx = cssColorToHex._ctx;
    const sentinel = '#010203'; // arbitrary value real input is vanishingly unlikely to serialize to
    ctx.fillStyle = sentinel;
    ctx.fillStyle = value;
    if (ctx.fillStyle === sentinel) return null; // fillStyle setter silently no-ops on invalid input

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return rgbToHex([r, g, b]);
}

// design.md role keys, normalized (lowercased, spaces/hyphens/underscores
// stripped) -> the canonical M3 seed name the generator already knows.
const roleKeyAliases = {
    primary: "Primary",
    secondary: "Secondary",
    tertiary: "Tertiary",
    error: "Error",
    neutral: "Neutral",
    neutralvariant: "Neutral Variant"
};

function normalizeRoleKey(key) {
    return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function titleCase(key) {
    return key.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// Parse a DESIGN.md file's YAML front matter into { name, colors, raw }.
//
// `colors` maps row names (canonical M3 roles where recognized, else a
// title-cased version of the front-matter key) to hex strings, for the
// Color tab's rows. "on-*" keys are skipped there - those are foreground
// colors the M3 role system derives on its own from the seed tones.
//
// `raw` keeps the front matter's own token tree - literal YAML keys, not
// role-aliased - for the Preview tab, which renders the design system's
// typography/components as themselves rather than through the M3 lens.
function parseDesignMd(text) {
    const fmMatch = text.replace(/^﻿/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/);
    if (!fmMatch) {
        throw new Error('No YAML front matter found (expected the file to start with a "---" fenced block).');
    }

    let data;
    try {
        data = jsyaml.load(fmMatch[1]);
    } catch (e) {
        throw new Error(`Couldn't parse the front matter as YAML: ${e.message}`);
    }
    if (!data || typeof data !== 'object') {
        throw new Error('Front matter did not parse to an object.');
    }
    if (!data.colors || typeof data.colors !== 'object') {
        throw new Error('No "colors:" block found in the front matter.');
    }

    const colors = {};
    const rawColors = {};
    Object.entries(data.colors).forEach(([key, value]) => {
        if (typeof value !== 'string') return;
        const hex = cssColorToHex(value);
        if (!hex) return;

        rawColors[key] = hex; // literal key, for {colors.x} reference resolution

        if (/^on[-_ ]/i.test(key) || /^on(?=[A-Z])/.test(key)) return;
        const alias = roleKeyAliases[normalizeRoleKey(key)];
        colors[alias || titleCase(key)] = hex;
    });

    const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};

    return {
        name: (typeof data.name === 'string' && data.name.trim()) || null,
        colors,
        raw: {
            colors: rawColors,
            typography: asObject(data.typography),
            rounded: asObject(data.rounded),
            spacing: asObject(data.spacing),
            components: asObject(data.components)
        }
    };
}

function ensureUniqueName(base) {
    let name = base;
    let i = 2;
    while (paletteLibrary[name]) {
        name = `${base} (${i++})`;
    }
    return name;
}

// Add (or overwrite, with confirmation) a palette parsed from DESIGN.md
// text, persist it, and switch the generator to show it.
function importDesignMd(text, fallbackName) {
    const parsed = parseDesignMd(text);
    if (Object.keys(parsed.colors).length === 0) {
        throw new Error('No usable colors found under "colors:" in the front matter.');
    }

    let name = parsed.name || fallbackName || 'Imported Palette';
    const existing = paletteLibrary[name];
    if (existing && existing.builtin) {
        name = ensureUniqueName(name);
    } else if (existing && !confirm(`"${name}" already exists. Overwrite it?`)) {
        name = ensureUniqueName(name);
    }

    // Any canonical M3 role the DESIGN.md doesn't define falls back to
    // whatever's currently active (preserving hand-tuning across imports),
    // and only to Material Default if nothing was ever set.
    const currentColors = getCurrentColorsFromRows();
    const colors = { ...parsed.colors };
    CANONICAL_ROLES.forEach(role => {
        if (!colors[role]) colors[role] = currentColors[role] || defaultColors[role];
    });

    paletteLibrary[name] = { colors, raw: parsed.raw, builtin: false };
    savePaletteLibrary();
    populatePaletteSelector();
    document.getElementById('paletteSelector').value = name;
    loadPalette(name);
}

// Add (or overwrite, with confirmation) a palette seeded from a vendored
// tweakcn theme preset (see tweakcn-presets.js), resolving its oklch()
// seed colors to hex via cssColorToHex - the same path importDesignMd
// uses for arbitrary CSS color strings. Structurally mirrors importDesignMd.
function importTweakcnPreset(preset) {
    const currentColors = getCurrentColorsFromRows();
    const colors = {};
    CANONICAL_ROLES.forEach(role => {
        const hex = cssColorToHex(preset.colors[role]);
        colors[role] = hex || currentColors[role] || defaultColors[role];
    });

    let name = preset.title;
    const existing = paletteLibrary[name];
    if (existing && existing.builtin) {
        name = ensureUniqueName(name);
    } else if (existing && !confirm(`"${name}" already exists. Overwrite it?`)) {
        name = ensureUniqueName(name);
    }

    paletteLibrary[name] = { colors, raw: null, builtin: false };
    savePaletteLibrary();
    populatePaletteSelector();
    document.getElementById('paletteSelector').value = name;
    loadPalette(name);
}

function populateTweakcnSelector() {
    const selector = document.getElementById('tweakcnPresetSelector');
    tweakcnPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.textContent = preset.title;
        selector.appendChild(option);
    });
}

function savePaletteLibrary() {
    const customOnly = {};
    Object.entries(paletteLibrary).forEach(([name, def]) => {
        if (!def.builtin) customOnly[name] = { colors: def.colors, raw: def.raw || null };
    });
    localStorage.setItem(PALETTE_LIBRARY_STORAGE_KEY, JSON.stringify(customOnly));
}

function loadPaletteLibraryFromStorage() {
    try {
        const raw = localStorage.getItem(PALETTE_LIBRARY_STORAGE_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw);
        Object.entries(stored).forEach(([name, def]) => {
            // Back-compat: an earlier version of this feature stored a bare
            // { name: hex } colors map with no wrapper.
            const hasWrapper = def && typeof def === 'object' && 'colors' in def;
            paletteLibrary[name] = {
                colors: hasWrapper ? def.colors : def,
                raw: hasWrapper ? (def.raw || null) : null,
                builtin: false
            };
        });
    } catch (e) {
        console.warn('Could not load saved palettes from localStorage:', e);
    }
}

function populatePaletteSelector() {
    const selector = document.getElementById('paletteSelector');
    const current = selector.value;
    selector.innerHTML = '';
    Object.keys(paletteLibrary).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
    });
    if (paletteLibrary[current]) selector.value = current;
}

// Read the currently-rendered color rows into a plain { name: hex } map,
// for "Save As..." (saving whatever the user has tuned, not just imports).
function getCurrentColorsFromRows() {
    const colors = {};
    document.querySelectorAll('.color-input-row').forEach(row => {
        const name = row.querySelector('input[type="text"]:first-child').value.trim();
        const hex = row.querySelector('input[type="text"]:nth-child(2)').value.trim();
        if (name && /^#[0-9A-F]{6}$/i.test(hex)) colors[name] = hex;
    });
    return colors;
}

// Name of the palette currently shown - the Preview tab reads this to find
// the active design system's raw (unmapped) token tree.
let currentPaletteName = 'Material Default';

// Switch the generator to a saved palette by name: re-render the color rows
// and immediately regenerate, so the switch is visible without another click.
function loadPalette(name) {
    const palette = paletteLibrary[name];
    if (!palette) return;
    currentPaletteName = name;
    initializeColorInputs(palette.colors);
    generatePalette();
}

// The active palette's raw, as-imported token tree (typography/rounded/
// spacing/components with their original keys), or null if the active
// palette wasn't imported from a DESIGN.md (e.g. "Material Default" or a
// hand-saved color set).
function getActiveRawDesignSystem() {
    const entry = paletteLibrary[currentPaletteName];
    return (entry && entry.raw) || null;
}

// Resolve a DESIGN.md component property value against that design
// system's own raw token tree. A literal value passes through unchanged;
// a "{group.key}" reference is looked up (following further indirection,
// e.g. a reference to a reference) and reported as broken if it doesn't
// resolve. Composite references (e.g. "{typography.label-md}" resolving
// to a whole typography object) are supported, per the DESIGN.md spec.
function resolveTokenRef(value, raw, depth = 0) {
    if (typeof value !== 'string') return { value, error: null };

    const match = value.match(/^\{([^}]+)\}$/);
    if (!match) return { value, error: null };
    if (depth > 5) return { value: null, error: `Reference nested too deep: ${value}` };

    const path = match[1].trim();
    const dot = path.indexOf('.');
    if (dot === -1) return { value: null, error: `Malformed reference: ${value}` };

    const group = path.slice(0, dot);
    const key = path.slice(dot + 1);
    const groupData = raw && raw[group];
    if (!groupData || !(key in groupData)) {
        return { value: null, error: `Broken reference: ${value}` };
    }

    return resolveTokenRef(groupData[key], raw, depth + 1);
}

// Resolve one of the generator's own M3 role tokens (e.g. "primary") from
// the generated jsonOutput tree, following its "{palettes.name.step}"
// references down to the actual hex value. Distinct from resolveTokenRef
// because these tokens are wrapped as { $type, $value } objects.
function resolveM3Token(roleName, tokens) {
    let entry = tokens && tokens[roleName];
    let depth = 0;
    while (entry && typeof entry.$value === 'string' && /^\{[^}]+\}$/.test(entry.$value) && depth < 5) {
        const path = entry.$value.slice(1, -1);
        const dot = path.indexOf('.');
        const group = path.slice(0, dot);
        const key = path.slice(dot + 1);
        entry = tokens[group] && tokens[group][key];
        depth++;
    }
    return (entry && typeof entry.$value === 'string') ? entry.$value : null;
}

// True for a CSS length the generator is willing to apply as an inline
// style (px/em/rem). DESIGN.md's "spacing" scale also allows bare,
// unitless numbers (column counts, ratios) - those are informational,
// not visual, so they're deliberately NOT treated as pixels here.
function isCssLength(value) {
    if (value === 0) return true;
    return typeof value === 'string' && /^-?\d*\.?\d+(px|em|rem)$/.test(value.trim());
}

function createPalette(colors) {
    const palette = document.getElementById('palette');
    palette.innerHTML = '';

// Create header row with degrees
    const headerRow = document.createElement('div');
    headerRow.className = 'color-row header-row';

    const emptyCell = document.createElement('div');
    emptyCell.className = 'color-label';
    headerRow.appendChild(emptyCell);

    steps.forEach(step => {
        const degreeCell = document.createElement('div');
        degreeCell.className = 'color-degree';
        degreeCell.textContent = step;
        headerRow.appendChild(degreeCell);
    });

    palette.appendChild(headerRow);

    const jsonOutput = {
        "palettes": {}
    };

    colors.forEach(({ name, hex }) => {
        const startRgb = hexToRgb(hex);
        const startHsl = rgbToHsl(startRgb);

        const colorPalette = steps.map(step => {
            const lightness = step;
            const rgb = hslToRgb([startHsl[0], startHsl[1], lightness]);
            return rgbToHex(rgb);
        });

// Create the visual palette rows
        const colorRow = document.createElement('div');
        colorRow.className = 'color-row';

        const label = document.createElement('div');
        label.className = 'color-label';
        label.textContent = name;
        colorRow.appendChild(label);

        colorPalette.forEach((colorHex, index) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = colorHex;
            colorBox.title = `${name} ${steps[index]}`;
            colorRow.appendChild(colorBox);
        });
        palette.appendChild(colorRow);

// Add each calculated color to the palette in the JSON output
        colorPalette.forEach((colorHex, index) => {
            jsonOutput["palettes"][paletteKey(name, steps[index])] = { "$type": "color", "$value": colorHex };
        });
    });

    return jsonOutput;
}

// Render the live spacing scale preview
function updateSpacingScale() {
    const baseUnit = parseFloat(document.getElementById('spacingBaseUnitInput').value) || 4;
    const container = document.getElementById('spacingScale');
    container.innerHTML = '';

    spacingSteps.forEach(step => {
        const px = step * baseUnit;

        const row = document.createElement('div');
        row.className = 'spacing-row';

        const label = document.createElement('div');
        label.className = 'spacing-label';
        label.textContent = `space-${step}`;

        const value = document.createElement('div');
        value.className = 'spacing-value';
        value.textContent = `${px}px`;

        const bar = document.createElement('div');
        bar.className = 'spacing-bar';
        bar.style.width = `${Math.min(px, 400)}px`;

        row.append(label, value, bar);
        container.appendChild(row);
    });
}

// Render the live border-radius preview
function updateRadiusScale() {
    const baseUnit = parseFloat(document.getElementById('spacingBaseUnitInput').value) || 4;
    const container = document.getElementById('radiusScale');
    container.innerHTML = '';

    radiusSteps.forEach(step => {
        const px = step.px !== undefined ? step.px : step.multiplier * baseUnit;

        const row = document.createElement('div');
        row.className = 'spacing-row';

        const label = document.createElement('div');
        label.className = 'spacing-label';
        label.textContent = `radius-${step.key}`;

        const value = document.createElement('div');
        value.className = 'spacing-value';
        value.textContent = step.key === 'full' ? 'pill' : `${px}px`;

        const swatch = document.createElement('div');
        swatch.className = 'radius-swatch';
        swatch.style.borderRadius = `${Math.min(px, 20)}px`;

        row.append(label, value, swatch);
        container.appendChild(row);
    });
}

function positionLegends() {
    const sample = document.querySelector('.sample');
    const legendItems = document.querySelectorAll('.typography-name');

    sample.querySelectorAll('*').forEach((element, index) => {
        if (index < legendItems.length) {
            const rect = element.getBoundingClientRect();
            const sampleRect = sample.getBoundingClientRect();
            legendItems[index].style.top = `${rect.top - sampleRect.top}px`;
        }
    });
}

// Function to generate the palette
function generatePalette() {
    const colors = [...document.querySelectorAll('.color-input-row')].map(row => ({
        name: row.querySelector('input[type="text"]:first-child').value,
        hex: row.querySelector('input[type="text"]:nth-child(2)').value
    })).filter(c => c.name && /^#[0-9A-F]{6}$/i.test(c.hex));

    if (colors.length) {
        const tokens = createPalette(colors);
        const jsonOutput = tokens; // keep existing variable name for the rest of this function

// Assign roles to reference colors from the palettes using the correct format
// (role labels like "Primary Fixed Dim" are slugified into valid token names;
//  refs with a trailing alpha, e.g. "Primary 40 8%", are resolved to a direct
//  rgba() value since Penpot token references can't carry an opacity modifier)
        Object.keys(colorRolesTemplate).forEach(role => {
            const paletteReference = colorRolesTemplate[role];
            const roleName = slugify(role);
            const alphaMatch = paletteReference.match(/^(.*)\s(\d+)%$/);

            if (alphaMatch) {
                const [, baseRef, alphaStr] = alphaMatch;
                const baseParts = baseRef.trim().split(/\s+/);
                const step = baseParts.pop();
                const name = baseParts.join(' ');
                const baseHex = tokens.palettes[paletteKey(name, step)]?.["$value"];
                jsonOutput[roleName] = {
                    "$type": "color",
                    "$value": baseHex ? hexToRgba(baseHex, parseInt(alphaStr, 10)) : "#000000"
                };
            } else {
                const parts = paletteReference.trim().split(/\s+/);
                const step = parts.pop();
                const name = parts.join(' ');
                jsonOutput[roleName] = { "$type": "color", "$value": `{palettes.${paletteKey(name, step)}}` };
            }
        });

// Include typography tokens (font family / weight / size / line-height / composite typography)
        const baseFontFamily = document.getElementById('baseFontSelector').value;
        const baseFontWeight = document.getElementById('baseFontWeightSelector').value;
        const headerFontFamily = document.getElementById('headerFontSelector').value;
        const headerFontWeight = document.getElementById('headerFontWeightSelector').value;
        const displayFontFamily = document.getElementById('displayFontSelector').value;
        const displayFontWeight = document.getElementById('displayFontWeightSelector').value;

        jsonOutput['font-family'] = {
            base: { "$type": "fontFamilies", "$value": baseFontFamily },
            header: { "$type": "fontFamilies", "$value": headerFontFamily },
            display: { "$type": "fontFamilies", "$value": displayFontFamily }
        };

        jsonOutput['font-weight'] = {
            base: { "$type": "fontWeights", "$value": baseFontWeight },
            header: { "$type": "fontWeights", "$value": headerFontWeight },
            display: { "$type": "fontWeights", "$value": displayFontWeight }
        };

        jsonOutput['font-size'] = {};
        jsonOutput['line-height'] = {};
        jsonOutput['typography'] = {};

        const familyAlias = family => {
            if (family === headerFontFamily) return 'header';
            if (family === displayFontFamily) return 'display';
            return 'base';
        };

        Object.entries(currentTypographyStyles).forEach(([key, style]) => {
            if (!style || !style.fontSize) return;

            jsonOutput['font-size'][key] = { "$type": "fontSizes", "$value": style.fontSize };
            jsonOutput['line-height'][key] = { "$type": "dimension", "$value": style.lineHeight };

            const typographyValue = {
                fontFamily: `{font-family.${familyAlias(style.fontFamily)}}`,
                fontWeight: style.fontWeight,
                fontSize: `{font-size.${key}}`,
                lineHeight: `{line-height.${key}}`
            };
            if (style.textDecoration && style.textDecoration !== 'none') {
                typographyValue.textDecoration = style.textDecoration;
            }

            jsonOutput['typography'][key] = { "$type": "typography", "$value": typographyValue };
        });

// Include spacing tokens (4-point-grid multiples of the base unit)
        const spacingBaseUnit = parseFloat(document.getElementById('spacingBaseUnitInput').value) || 4;
        jsonOutput['spacing'] = {};
        spacingSteps.forEach(step => {
            jsonOutput['spacing'][`space-${step}`] = { "$type": "spacing", "$value": `${step * spacingBaseUnit}px` };
        });

// Include border-radius tokens (sm/md tied to the base unit, full = pill)
        jsonOutput['radius'] = {};
        radiusSteps.forEach(step => {
            const px = step.px !== undefined ? step.px : step.multiplier * spacingBaseUnit;
            jsonOutput['radius'][`radius-${step.key}`] = { "$type": "borderRadius", "$value": `${px}px` };
        });

// Wrap the token tree in a Penpot-importable file: one token Set plus $metadata
        const fileOutput = {
            "Global": tokens,
            "$metadata": { "tokenSetOrder": ["Global"] }
        };

// Ensure JSON output element exists and update it
        let jsonOutputElem = document.getElementById('jsonOutput');
        if (!jsonOutputElem) {
            jsonOutputElem = document.createElement('pre');
            jsonOutputElem.id = 'jsonOutput';
            jsonOutputElem.className = 'json-output';
            jsonOutputElem.style.display = 'none';
            document.body.appendChild(jsonOutputElem);
        }
        const fullJsonString = JSON.stringify(fileOutput, null, 2);
        jsonOutputElem.textContent = fullJsonString;
        jsonOutputElem.dataset.fullJson = fullJsonString;

    } else {
        alert('Please enter all color names and valid hex codes');
    }

    paletteGenerated = true;
}

// --- Preview tab ------------------------------------------------------
// Reflects the active design system as itself: typography and components
// rendered from their own literal DESIGN.md values where available, with
// every fallback or broken reference surfaced as a warning rather than
// silently swallowed.

function pickToken(rawMap, preferredKeys, tokens, tokenGroup, tokenFallbackKey) {
    if (rawMap) {
        for (const key of preferredKeys) {
            const value = rawMap[key];
            if (isCssLength(value)) return value;
        }
    }
    const fallback = tokens && tokens[tokenGroup] && tokens[tokenGroup][tokenFallbackKey];
    return fallback ? fallback.$value : null;
}

function pickTypography(rawTypography, matchers) {
    if (!rawTypography) return null;
    const entries = Object.entries(rawTypography);
    for (const matcher of matchers) {
        const found = entries.find(([key]) => matcher.test(key));
        if (found) return found[1];
    }
    return null;
}

function applyTypographyStyle(el, style) {
    if (!style || typeof style !== 'object') return;
    if (style.fontFamily) el.style.fontFamily = style.fontFamily;
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.fontWeight !== undefined) el.style.fontWeight = style.fontWeight;
    if (style.letterSpacing) el.style.letterSpacing = style.letterSpacing;
    if (style.lineHeight !== undefined) el.style.lineHeight = String(style.lineHeight);
}

function getGeneratedTokens() {
    try {
        const fullJson = document.getElementById('jsonOutput').dataset.fullJson;
        return fullJson ? (JSON.parse(fullJson).Global || {}) : {};
    } catch (e) {
        return {};
    }
}

function renderPreview() {
    const raw = getActiveRawDesignSystem();
    const warnings = [];

    renderPreviewTypography(raw, warnings);
    renderPreviewComponents(raw, warnings, getGeneratedTokens());
    renderPreviewWarnings(warnings);
}

function renderPreviewWarnings(warnings) {
    const container = document.getElementById('previewWarnings');
    container.innerHTML = '';
    container.hidden = warnings.length === 0;
    warnings.forEach(message => {
        const item = document.createElement('li');
        item.className = 'preview-warning-item';
        item.textContent = message;
        container.appendChild(item);
    });
}

function makeTypographySample(name, style) {
    const row = document.createElement('div');
    row.className = 'preview-typography-item';

    const label = document.createElement('div');
    label.className = 'preview-typography-label';
    label.textContent = name;

    const sample = document.createElement('div');
    sample.className = 'preview-typography-sample';
    sample.textContent = 'The quick brown fox jumps over the lazy dog';
    applyTypographyStyle(sample, style);

    row.append(label, sample);
    return row;
}

function renderPreviewTypography(raw, warnings) {
    const container = document.getElementById('previewTypography');
    container.innerHTML = '';

    const entries = raw && raw.typography ? Object.entries(raw.typography) : [];

    if (!entries.length) {
        warnings.push('No typography tokens in this design system - showing the generator\'s own type scale instead.');
        [['Display (8xl)', currentTypographyStyles['8xl']], ['Header (4xl)', currentTypographyStyles['4xl']], ['Body', currentTypographyStyles['paragraph-regular']]]
            .forEach(([label, style]) => {
                if (style) container.appendChild(makeTypographySample(label, style));
            });
        return;
    }

    entries.forEach(([name, style]) => {
        if (style && typeof style === 'object') container.appendChild(makeTypographySample(name, style));
    });
}

// Render one entry from the DESIGN.md's own "components:" block, resolving
// each property against that design system's raw token tree. Unresolvable
// references are flagged on the box (and listed as warnings) rather than
// silently applying nothing.
function renderRawComponent(name, props, raw, warnings) {
    const box = document.createElement('div');
    box.className = 'preview-component-box';
    box.textContent = name;

    const errors = [];
    const resolve = (value) => {
        const resolved = resolveTokenRef(value, raw);
        if (resolved.error) errors.push(resolved.error);
        return resolved.error ? null : resolved.value;
    };

    if (props && typeof props === 'object') {
        Object.entries(props).forEach(([prop, value]) => {
            switch (prop) {
                case 'backgroundColor': {
                    const v = resolve(value);
                    if (v) box.style.backgroundColor = v;
                    break;
                }
                case 'textColor': {
                    const v = resolve(value);
                    if (v) box.style.color = v;
                    break;
                }
                case 'rounded': {
                    const v = resolve(value);
                    if (isCssLength(v)) box.style.borderRadius = v;
                    break;
                }
                case 'padding': {
                    const v = resolve(value);
                    if (isCssLength(v)) box.style.padding = v;
                    break;
                }
                case 'width':
                case 'height': {
                    const v = resolve(value);
                    if (isCssLength(v)) box.style[prop] = v;
                    break;
                }
                case 'size': {
                    const v = resolve(value);
                    if (isCssLength(v)) { box.style.width = v; box.style.height = v; }
                    break;
                }
                case 'typography': {
                    const v = resolve(value);
                    if (v && typeof v === 'object') applyTypographyStyle(box, v);
                    break;
                }
                default:
                    warnings.push(`"${name}": unknown component property "${prop}" (kept, not previewed)`);
            }
        });
    }

    if (errors.length) {
        box.classList.add('has-error');
        box.title = errors.join('\n');
        errors.forEach(error => warnings.push(`"${name}": ${error}`));
    }

    return box;
}

// No "components:" block was imported - build the same standard Button /
// Badge / Input / Card set penpot/build-components.js builds in Penpot,
// styled from whatever rounded/spacing/typography WAS imported, falling
// back per-value to the generator's own M3 roles / radius / spacing / type
// scale (which always resolve, since those are generated, not imported).
function renderFallbackLayout(raw, tokens) {
    const roundedSm = pickToken(raw && raw.rounded, ['sm', 'xs'], tokens, 'radius', 'radius-sm');
    const roundedFull = pickToken(raw && raw.rounded, ['full', 'pill'], tokens, 'radius', 'radius-full');
    const roundedMd = pickToken(raw && raw.rounded, ['md'], tokens, 'radius', 'radius-md');

    const spaceButtonV = pickToken(raw && raw.spacing, ['sm'], tokens, 'spacing', 'space-4');
    const spaceButtonH = pickToken(raw && raw.spacing, ['md'], tokens, 'spacing', 'space-6');
    const spaceBadgeV = pickToken(raw && raw.spacing, ['xs'], tokens, 'spacing', 'space-1');
    const spaceBadgeH = pickToken(raw && raw.spacing, ['sm'], tokens, 'spacing', 'space-3');
    const spaceInputV = pickToken(raw && raw.spacing, ['sm'], tokens, 'spacing', 'space-3');
    const spaceInputH = pickToken(raw && raw.spacing, ['md'], tokens, 'spacing', 'space-4');
    const spaceCard = pickToken(raw && raw.spacing, ['lg', 'xl'], tokens, 'spacing', 'space-6');

    const bodyType = pickTypography(raw && raw.typography, [/body/i, /paragraph/i]) || currentTypographyStyles['paragraph-regular'];
    const semiboldType = pickTypography(raw && raw.typography, [/label/i, /button/i]) || currentTypographyStyles['paragraph-semibold'] || bodyType;
    const smallType = pickTypography(raw && raw.typography, [/small/i, /caption/i]) || currentTypographyStyles['small-semibold'] || bodyType;
    const headingType = pickTypography(raw && raw.typography, [/h1|display|headline/i]) || currentTypographyStyles['lg'] || bodyType;

    const makeButton = (label, bgRole, textRole) => {
        const el = document.createElement('span');
        el.className = 'preview-btn';
        el.textContent = label;
        el.style.backgroundColor = resolveM3Token(bgRole, tokens) || '#888';
        el.style.color = resolveM3Token(textRole, tokens) || '#fff';
        if (roundedSm) el.style.borderRadius = roundedSm;
        if (spaceButtonV) { el.style.paddingTop = spaceButtonV; el.style.paddingBottom = spaceButtonV; }
        if (spaceButtonH) { el.style.paddingLeft = spaceButtonH; el.style.paddingRight = spaceButtonH; }
        applyTypographyStyle(el, semiboldType);
        return el;
    };

    const makeBadge = (label, bgRole, textRole) => {
        const el = document.createElement('span');
        el.className = 'preview-badge';
        el.textContent = label;
        el.style.backgroundColor = resolveM3Token(bgRole, tokens) || '#888';
        el.style.color = resolveM3Token(textRole, tokens) || '#fff';
        if (roundedFull) el.style.borderRadius = roundedFull;
        if (spaceBadgeV) { el.style.paddingTop = spaceBadgeV; el.style.paddingBottom = spaceBadgeV; }
        if (spaceBadgeH) { el.style.paddingLeft = spaceBadgeH; el.style.paddingRight = spaceBadgeH; }
        applyTypographyStyle(el, smallType);
        return el;
    };

    const buttonRow = document.createElement('div');
    buttonRow.className = 'preview-fallback-row';
    buttonRow.append(
        makeButton('Primary', 'primary', 'on-primary'),
        makeButton('Secondary', 'secondary', 'on-secondary'),
        makeButton('Danger', 'error', 'on-error')
    );

    const badgeRow = document.createElement('div');
    badgeRow.className = 'preview-fallback-row';
    badgeRow.append(
        makeBadge('Info', 'tertiary-container', 'on-tertiary-container'),
        makeBadge('Success', 'secondary-container', 'on-secondary-container'),
        makeBadge('Danger', 'error-container', 'on-error-container')
    );

    const input = document.createElement('div');
    input.className = 'preview-input';
    input.textContent = 'Email address';
    input.style.backgroundColor = resolveM3Token('surface', tokens) || '#fff';
    input.style.color = resolveM3Token('on-surface-variant', tokens) || '#333';
    input.style.borderColor = resolveM3Token('outline', tokens) || '#ccc';
    if (roundedSm) input.style.borderRadius = roundedSm;
    if (spaceInputV) { input.style.paddingTop = spaceInputV; input.style.paddingBottom = spaceInputV; }
    if (spaceInputH) { input.style.paddingLeft = spaceInputH; input.style.paddingRight = spaceInputH; }
    applyTypographyStyle(input, bodyType);

    const cardTitle = document.createElement('div');
    cardTitle.className = 'preview-card-title';
    cardTitle.textContent = 'Card title';
    cardTitle.style.color = resolveM3Token('on-surface', tokens) || '#111';
    applyTypographyStyle(cardTitle, headingType);

    const cardBody = document.createElement('div');
    cardBody.className = 'preview-card-body';
    cardBody.textContent = 'Supporting body copy for this card, styled entirely from available tokens.';
    cardBody.style.color = resolveM3Token('on-surface-variant', tokens) || '#555';
    applyTypographyStyle(cardBody, bodyType);

    const card = document.createElement('div');
    card.className = 'preview-card';
    card.style.backgroundColor = resolveM3Token('surface-container', tokens) || '#f5f5f5';
    if (roundedMd) card.style.borderRadius = roundedMd;
    if (spaceCard) card.style.padding = spaceCard;
    card.append(cardTitle, cardBody);

    const wrap = document.createElement('div');
    wrap.className = 'preview-fallback';
    wrap.append(buttonRow, badgeRow, input, card);
    return wrap;
}

function renderPreviewComponents(raw, warnings, tokens) {
    const container = document.getElementById('previewComponents');
    container.innerHTML = '';

    const componentEntries = raw && raw.components ? Object.entries(raw.components) : [];

    if (!componentEntries.length) {
        warnings.push('No components block in this design system - showing a standard Button / Badge / Input / Card layout built from the available tokens instead.');
        container.appendChild(renderFallbackLayout(raw, tokens));
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'preview-components-grid';
    componentEntries.forEach(([name, props]) => {
        grid.appendChild(renderRawComponent(name, props, raw, warnings));
    });
    container.appendChild(grid);
}

// Build a single color-input row. Canonical M3 roles get a locked name
// field (the role system references them by exact name); anything else is
// a free-form "extra" row with an editable name and a remove button.
function createColorRow(name, hex, index) {
    const isCanonical = CANONICAL_ROLES.includes(name);

    const colorRow = document.createElement('div');
    colorRow.className = 'color-input-row';
    colorRow.dataset.defaultHex = hex; // this row's own reset target

    const colorNameInput = createInput('text', name, isCanonical);
    if (isCanonical) colorNameInput.classList.add('read-only');
    const hexInput = createInput('text', hex, false, `hexInput${index}`);
    const colorPicker = createInput('color', hex, false);

    hexInput.addEventListener('input', () => {
// Sanitize and correct hex input before further processing
        const sanitizedHex = sanitizeHexInput(hexInput.value);
        hexInput.value = sanitizedHex;

        if (sanitizedHex) {
            syncColorInput(hexInput, colorPicker);
        }
    });

    colorPicker.addEventListener('input', () => syncColorInput(colorPicker, hexInput));

    const nameFor = () => colorNameInput.value;
    const defaultButton = createIconButton('fas fa-redo', 'default-button', () => resetToDefaultColor(hexInput, colorPicker, nameFor(), colorRow));
    const randomButton = createIconButton('fas fa-random', 'random-button', () => randomizeColor(hexInput, colorPicker, nameFor()));
    const lastColorButton = createIconButton('fas fa-arrow-left', 'last-button', () => revertToLastColor(hexInput, colorPicker, nameFor()));

    colorRow.append(colorNameInput, hexInput, colorPicker, defaultButton, randomButton, lastColorButton);

    if (!isCanonical) {
        const removeButton = createIconButton('fas fa-trash', 'remove-button', () => colorRow.remove());
        colorRow.appendChild(removeButton);
    }

    return colorRow;
}

// Function to initialize color inputs from a { name: hex } color set.
// Canonical M3 roles always render first (falling back to Material
// Default for any the set doesn't define), followed by any extra colors.
function initializeColorInputs(colors = defaultColors) {
    const colorInputsContainer = document.getElementById('colorInputs');
    colorInputsContainer.innerHTML = ''; // Clear any existing inputs

    const extraNames = Object.keys(colors).filter(name => !CANONICAL_ROLES.includes(name));

    [...CANONICAL_ROLES, ...extraNames].forEach((name, i) => {
        const hex = colors[name] || defaultColors[name] || '#888888';
        colorInputsContainer.appendChild(createColorRow(name, hex, i + 1));
    });
}

// Append one blank, editable "extra" color row without disturbing the
// rows already on screen (used by the "+ Add color" button).
function addCustomColorRow() {
    const colorInputsContainer = document.getElementById('colorInputs');
    const index = colorInputsContainer.children.length + 1;
    const randomHex = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`;
    colorInputsContainer.appendChild(createColorRow('New Color', randomHex, index));
}

// Function to create input fields
function createInput(type, value, readOnly = false, id = '') {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.readOnly = readOnly;
    if (id) input.id = id;
    input.className = 'form-control';
    if (type === 'text' && readOnly) {
input.style.width = '140px'; // Increased width for long names
} else {
    input.style.width = '100px';
}
if (type === 'color') {
input.style.cursor = 'default'; // Skip changing cursor on color picker
}
return input;
}

// Function to create icon-based buttons
function createIconButton(iconClass, className, onClick) {
    const button = document.createElement('button');
    const icon = document.createElement('i');
    icon.className = iconClass;
    button.appendChild(icon);
    button.className = className;
    button.addEventListener('click', onClick);
// Set fixed dimensions
    button.style.width = '40px';
    button.style.height = '40px';
    button.style.borderRadius = '50%';
    return button;
}

// Sync color inputs
function syncColorInput(source, target) {
    let color = source.value;
    if (!color.startsWith('#')) color = '#' + color;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        target.value = color;
    }
}

// Randomize color
function randomizeColor(input, picker, name) {
    if (!lastColors[name]) lastColors[name] = [];
    lastColors[name].push(input.value);
    const randomHex = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`;
    input.value = randomHex;
    picker.value = randomHex;
}

// Reset to this row's own default (the value it was loaded/imported with),
// not always the hardcoded Material Default - so this works for any
// palette in the library, not just the built-in one.
function resetToDefaultColor(input, picker, name, row) {
    if (!lastColors[name]) lastColors[name] = [];
    lastColors[name].push(input.value);
    const defaultHex = (row && row.dataset.defaultHex) || defaultColors[name] || input.value;
    input.value = defaultHex;
    picker.value = defaultHex;
}

// Revert to last color
function revertToLastColor(input, picker, name) {
    if (lastColors[name] && lastColors[name].length > 0) {
        const lastColor = lastColors[name].pop();
        input.value = lastColor;
        picker.value = lastColor;
    }
}

// Sanitize hex input
function sanitizeHexInput(hexInput) {
    let sanitizedHex = hexInput.replace(/#/g, '');
    if (sanitizedHex.length === 6) {
        return `#${sanitizedHex}`;
    }
    if (sanitizedHex.length === 3) {
        return `#${sanitizedHex.split('').map(char => char + char).join('')}`;
    }
    return '';
}

// Open tabs
function openTab(tabId) {
    const tabContentElements = document.querySelectorAll('.tab-content');
    tabContentElements.forEach(element => {
        element.classList.remove('active');
    });

    const tabButtonElements = document.querySelectorAll('.tab-button');
    tabButtonElements.forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="openTab('${tabId}')"]`).classList.add('active');

// Show or hide the Generate button based on the active tab
    const generateButton = document.getElementById('generateButton');
    if (tabId === 'colorTab') {
        generateButton.style.display = 'inline-flex';
    } else {
        generateButton.style.display = 'none';
    }

    if (tabId === 'previewTab') {
        // Always regenerate so the preview reflects any hand-tuned colors,
        // spacing, or typography made without clicking the sync button.
        generatePalette();
        renderPreview();
    }
}


// Populate font selectors with font previews
function populateFontSelectors() {
// For Display Text
    const displayFontSelector = document.getElementById('displayFontSelector');
    const displayFontWeightSelector = document.getElementById('displayFontWeightSelector');
    displayFonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        option.style.fontFamily = font;
        displayFontSelector.appendChild(option);
    });

    fontWeights.forEach(weight => {
        const option = document.createElement('option');
        option.value = weight.value;
        option.textContent = weight.name;
        displayFontWeightSelector.appendChild(option);
    });

// For Header and Base Text
    ['headerFontSelector', 'baseFontSelector'].forEach(selectorId => {
        const fontSelector = document.getElementById(selectorId);
        sansSerifFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            fontSelector.appendChild(option);
        });
    });

    ['headerFontWeightSelector', 'baseFontWeightSelector'].forEach(selectorId => {
        const fontWeightSelector = document.getElementById(selectorId);
        fontWeights.forEach(weight => {
            const option = document.createElement('option');
            option.value = weight.value;
            option.textContent = weight.name;
            fontWeightSelector.appendChild(option);
        });
    });

// Load fonts dynamically
    loadFontsDynamically();
}


// Load selected fonts dynamically
function loadFontsDynamically() {
    const allFonts = [...displayFonts, ...sansSerifFonts];
    const uniqueFonts = [...new Set(allFonts)].map(font => font.replace(' ', '+'));
    const fontWeightsValues = fontWeights.map(weight => weight.value);
    const fontLink = document.getElementById('dynamic-fonts');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(font => `${font}:wght@${fontWeightsValues.join(';')}`).join('&family=')}&display=swap`;
}


// Randomly select fonts for Display, Header, and Base text
function randomizeFonts() {
// Randomly select a display font
    const randomDisplayFont = displayFonts[Math.floor(Math.random() * displayFonts.length)];
    document.getElementById('displayFontSelector').value = randomDisplayFont;

// Randomly select header and base fonts (ensure they are different)
    const shuffledSansSerifFonts = sansSerifFonts.sort(() => 0.5 - Math.random());
    const [headerFont, baseFont] = shuffledSansSerifFonts.slice(0, 2);

    document.getElementById('headerFontSelector').value = headerFont;
    document.getElementById('baseFontSelector').value = baseFont;

// Set default font weights
    document.getElementById('displayFontWeightSelector').value = '700';
    document.getElementById('headerFontWeightSelector').value = '600';
    document.getElementById('baseFontWeightSelector').value = '400';
}

// Function to get abbreviation
function getAbbreviation(type) {
    const abbreviations = {
// T-shirt sizes (uppercase)
        '8xl': '8xl',
        '7xl': '7xl',
        '6xl': '6xl',
        '5xl': '5xl',
        '4xl': '4xl',
        '3xl': '3xl',
        '2xl': '2xl',
        'xl': 'xl',
        'lg': 'lg',
        'md': 'md',
        'sm': 'sm',
// Paragraph variants (lowercase)
        'paragraph-regular': 'p',
        'paragraph-medium': 'pm',
        'paragraph-semibold': 'ps',
        'paragraph-bold': 'pb',
        'paragraph-italic': 'pi',
// Small text variants
        'small-regular': 'small',
        'small-medium': 'sm',
        'small-semibold': 'ss',
        'small-bold': 'sb',
        'small-italic': 'si',
// Code styles (lowercase)
        'code-regular': 'code',
        'code-bold': 'cb',
        'code-italic': 'ci',
// Blockquote and links
        'blockquote': 'bq',
        'link': 'link',
        'link-hover': 'linkh',
// HTML types (as is)
        'H1': 'H1',
        'H2': 'H2',
        'H3': 'H3',
        'H4': 'H4',
        'H5': 'H5',
        'H6': 'H6',
        'p': 'p',
        'small': 'small',
        'code': 'code',
        'a': 'a',
    };
    return abbreviations[type] || type;
}


// Function to get equivalent types
function getEquivalentTypes(type) {
    const equivalentsMap = {
        '8xl': ['H1'],
        '4xl': ['H2'],
        '3xl': ['H3'],
        '2xl': ['H4'],
        'xl': ['H5'],
        'lg': ['H6'],
        'md': ['p'],
        'sm': ['small'],
// Add other mappings as needed
    };
    return equivalentsMap[type] || [];
}

// Function to create legend
function createLegend(usedTypes, typographyStyles) {
    const legendContainer = document.createElement('div');
    legendContainer.className = 'legend-container';

    const legendTitle = document.createElement('h4');
    legendTitle.textContent = 'Legend';
    legendContainer.appendChild(legendTitle);

    const legendList = document.createElement('ul');
    legendList.className = 'legend-list';

    usedTypes.forEach((value, type) => {
        const listItem = document.createElement('li');
        listItem.className = 'legend-item';

// Create color boxes
        const colorBoxes = document.createElement('div');
        colorBoxes.className = 'legend-color-boxes';

// Determine if it's a T-shirt size or HTML type
        const isTShirtSize = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'].includes(type);

// Add color boxes for type and its equivalents
        const typeColorBox = document.createElement('span');
        typeColorBox.className = 'legend-color-box';
        typeColorBox.style.backgroundColor = isTShirtSize ? '#4CAF50' : '#FFA500';
        colorBoxes.appendChild(typeColorBox);

        value.equivalents.forEach(eqType => {
            const eqColorBox = document.createElement('span');
            eqColorBox.className = 'legend-color-box';
            const eqIsTShirtSize = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'].includes(eqType);
            eqColorBox.style.backgroundColor = eqIsTShirtSize ? '#4CAF50' : '#FFA500';
            colorBoxes.appendChild(eqColorBox);
        });

// Create label with abbreviations
        const abbreviations = [type, ...value.equivalents].map(t => getAbbreviation(t)).join(' / ');

        const typeLabel = document.createElement('span');
        typeLabel.textContent = ` ${abbreviations}`;
        typeLabel.style.fontSize = `${value.fontSize}px`;
typeLabel.style.fontWeight = 'normal'; // Consistent font weight
typeLabel.style.fontStyle = 'normal'; // Consistent font style

listItem.appendChild(colorBoxes);
listItem.appendChild(typeLabel);
legendList.appendChild(listItem);
});

    legendContainer.appendChild(legendList);
    return legendContainer;
}



// Update typography in real-time
function updateTypography() {
// Base Text Settings
    const baseFontFamily = document.getElementById('baseFontSelector').value;
    const baseFontWeight = document.getElementById('baseFontWeightSelector').value;
    const baseFontSize = parseFloat(document.getElementById('baseFontSizeInput').value);
    const baseLineHeight = parseFloat(document.getElementById('baseLineHeightInput').value);
    const paragraphSpacing = parseFloat(document.getElementById('paragraphSpacingInput').value);

// Header Text Settings
    const headerFontFamily = document.getElementById('headerFontSelector').value;
    const headerFontWeight = document.getElementById('headerFontWeightSelector').value;
    const headerLineHeight = parseFloat(document.getElementById('headerLineHeightInput').value);

// Display Text Settings
    const displayFontFamily = document.getElementById('displayFontSelector').value;
    const displayFontWeight = document.getElementById('displayFontWeightSelector').value;
    const displayLineHeight = parseFloat(document.getElementById('displayLineHeightInput').value);

// Typography Scale Ratios
    const scaleRatios = {
        'sm': 0.875,
'md': 1,      // Base size
'lg': 1.25,
'xl': 1.5,
'2xl': 1.65,
'3xl': 2,
'4xl': 2.5,
'5xl': 3,
'6xl': 3.5,
'7xl': 4,
'8xl': 4.5
};

// Generate Typography Styles
const typographyStyles = {};

Object.keys(scaleRatios).forEach(sizeKey => {
    let fontSize = Math.round(baseFontSize * scaleRatios[sizeKey]);
    let lineHeight = Math.round(baseLineHeight * scaleRatios[sizeKey]);

// Round line height to nearest multiple of 4
    lineHeight = Math.ceil(lineHeight / 4) * 4;

    typographyStyles[sizeKey] = {
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
        fontFamily: baseFontFamily,
        fontWeight: baseFontWeight,
        marginBottom: `${paragraphSpacing}px`
    };
});

// Apply specific fonts for Header and Display Text
['lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'].forEach(sizeKey => {
    typographyStyles[sizeKey].fontFamily = headerFontFamily;
    typographyStyles[sizeKey].fontWeight = headerFontWeight;
typographyStyles[sizeKey].lineHeight = `${headerLineHeight}px`;  // Header-specific line height

});

['6xl', '7xl', '8xl'].forEach(sizeKey => {
    typographyStyles[sizeKey].fontFamily = displayFontFamily;
    typographyStyles[sizeKey].fontWeight = displayFontWeight;
typographyStyles[sizeKey].lineHeight = `${displayLineHeight}px`;  // Display-specific line height

});

// Update paragraph styles
['paragraph-regular', 'paragraph-medium', 'paragraph-semibold', 'paragraph-bold', 'paragraph-italic'].forEach(style => {
    typographyStyles[style] = {
        ...typographyStyles['md'],
        fontWeight: style.includes('medium') ? '500' : style.includes('semibold') ? '600' : style.includes('bold') ? '700' : baseFontWeight,
        fontStyle: style.includes('italic') ? 'italic' : 'normal',
        textDecoration: style.includes('underline') ? 'underline' : 'none',
        marginBottom: `${paragraphSpacing}px`
    };
});

// Small text variants
['small-regular', 'small-medium', 'small-semibold', 'small-bold', 'small-italic'].forEach(style => {
    typographyStyles[style] = {
        ...typographyStyles['sm'],
        fontWeight: style.includes('medium') ? '500' : style.includes('semibold') ? '600' : style.includes('bold') ? '700' : baseFontWeight,
        fontStyle: style.includes('italic') ? 'italic' : 'normal',
        textDecoration: style.includes('underline') ? 'underline' : 'none',
        marginBottom: `${paragraphSpacing}px`
    };
});

// Code styles
typographyStyles['code-regular'] = {
    ...typographyStyles['sm'],
    fontFamily: 'Courier New, monospace',
    fontWeight: '400',
    marginBottom: `${paragraphSpacing}px`
};
typographyStyles['code-bold'] = {
    ...typographyStyles['sm'],
    fontFamily: 'Courier New, monospace',
    fontWeight: '700',
    marginBottom: `${paragraphSpacing}px`
};
typographyStyles['code-italic'] = {
    ...typographyStyles['sm'],
    fontFamily: 'Courier New, monospace',
    fontStyle: 'italic',
    marginBottom: `${paragraphSpacing}px`
};

// Blockquote
typographyStyles['blockquote'] = {
    ...typographyStyles['lg'],
    fontStyle: 'italic',
    marginBottom: `${paragraphSpacing}px`
};

// Link styles
typographyStyles['link'] = {
    ...typographyStyles['md'],
    color: '#1a0dab',
    textDecoration: 'underline',
    marginBottom: `${paragraphSpacing}px`
};
typographyStyles['link-hover'] = {
    ...typographyStyles['md'],
    color: '#c61a09',
    textDecoration: 'underline',
    marginBottom: `${paragraphSpacing}px`
};

// Store for export (see generatePalette)
currentTypographyStyles = typographyStyles;

// Update Samples
updateSample('desktopSample', typographyStyles, false);
updateSample('mobileSample', typographyStyles, true);
}

// Function to update sample content
function updateSample(sampleId, typographyStyles, isMobile) {
    const sample = document.getElementById(sampleId);
    sample.innerHTML = getSampleContent();
    const elements = sample.querySelectorAll('[data-typography]');
    const paragraphSpacing = parseFloat(document.getElementById('paragraphSpacingInput').value);

    elements.forEach(element => {
        const type = element.getAttribute('data-typography');
        const style = typographyStyles[type];

if (!style) return; // Skip if style not defined

let fontSizeValue = parseFloat(style.fontSize);
let lineHeightValue = parseFloat(style.lineHeight);

if (isMobile) {
fontSizeValue = Math.max(14, fontSizeValue * 0.875); // Reduce font size by 12.5%, minimum 14px
lineHeightValue = lineHeightValue * 0.875;
}

element.style.fontSize = `${fontSizeValue}px`;
element.style.lineHeight = `${lineHeightValue}px`; // Ensure line height is applied
element.style.fontFamily = style.fontFamily;
element.style.fontWeight = style.fontWeight || 'normal';
element.style.fontStyle = style.fontStyle || 'normal';
element.style.textDecoration = style.textDecoration || 'none';
element.style.color = style.color || 'inherit';
element.style.textAlign = 'left';
element.style.marginBottom = `${paragraphSpacing}px`; // Apply paragraph spacing to all elements

// Add typography name badges inside the element
if (!isMobile && !element.querySelector('.typography-name-container')) {
    const badgeContainer = document.createElement('span');
    badgeContainer.className = 'typography-name-container';

// Get the abbreviations and determine if there are equivalents
    const abbreviation = getAbbreviation(type);
    const equivalents = getEquivalentTypes(type);
    const isEquivalent = equivalents.length > 0;

// Create the primary badge
    const primaryBadge = document.createElement('span');
    primaryBadge.className = 'typography-name';
    primaryBadge.textContent = abbreviation;
primaryBadge.style.backgroundColor = '#4CAF50'; // Green color

badgeContainer.appendChild(primaryBadge);

// If there are equivalents, create additional badges
if (isEquivalent) {
    equivalents.forEach(eqType => {
        const eqAbbreviation = getAbbreviation(eqType);
        const eqBadge = document.createElement('span');
        eqBadge.className = 'typography-name';
        eqBadge.textContent = eqAbbreviation;
eqBadge.style.backgroundColor = '#FFA500'; // Orange color
badgeContainer.appendChild(eqBadge);
});
}

element.appendChild(badgeContainer);
}
});
}

// Function to get sample content
function getSampleContent() {
    return `
    <h1 data-typography="8xl">Global Summit Insights Highlights</h1>
    <p data-typography="paragraph-regular">The annual global summit convened leaders from across the world to address pressing challenges facing our planet, fostering dialogue and collaboration. Attendees included heads of state, industry pioneers, influential policymakers, and thought leaders dedicated to creating impactful solutions.</p>
    <h2 data-typography="4xl">Leaders Unite for Change: Collaborative Efforts for a Sustainable Future</h2>
    <p data-typography="paragraph-regular">In a historic move, leaders pledged to collaborate on comprehensive initiatives that aim to foster sustainable growth, promote equitable resource distribution, and ensure long-term stability for communities worldwide.</p>
    <h3 data-typography="3xl">Key Discussions on Climate: Strategies and Solutions</h3>
    <p data-typography="paragraph-regular">Climate change dominated the summit's agenda, with a strong consensus on the urgent need for immediate action to significantly reduce greenhouse gas emissions, invest in renewable energy sources, and implement policies that support environmental sustainability.</p>
    <h4 data-typography="2xl">Innovations in Renewable Energy: Advancements and Applications</h4>
    <p data-typography="paragraph-regular">Breakthroughs in solar and wind technologies were showcased, highlighting the immense potential for cleaner, more efficient energy sources to effectively replace fossil fuels and drive the transition towards a more sustainable energy infrastructure.</p>
    <h5 data-typography="xl">Community Engagement: Grassroots Movements and Local Initiatives</h5>
    <p data-typography="paragraph-regular">Grassroots movements and community leaders emphasized the critical importance of local initiatives in driving global change, advocating for increased participation and empowering communities to take active roles in environmental conservation and sustainable development.</p>
    <h6 data-typography="lg">Future Plans: Roadmap for Sustainable Development</h6>
    <p data-typography="paragraph-regular">The summit concluded with a comprehensive roadmap outlining actionable steps for the coming decade, aimed at guiding nations and organizations towards sustainable development goals and measurable environmental improvements.</p>
    <p data-typography="paragraph-medium">Several working groups were established to diligently monitor progress and ensure accountability among participating nations, fostering a collaborative environment where commitments are tracked and objectives are consistently met.</p>
    <p data-typography="paragraph-semibold">The private sector committed significant investments towards ambitious sustainable infrastructure projects, aiming to support the development of eco-friendly facilities and technologies that align with the summit's environmental objectives.</p>
    <p data-typography="paragraph-bold">Comprehensive education and awareness campaigns will be launched to actively engage the public in environmental conservation efforts, promoting knowledge, and encouraging proactive participation in protecting our planet.</p>
    <p data-typography="paragraph-italic">"Our collective future depends on the actions we take today," stated the keynote speaker, emphasizing the urgent need for unified efforts to address environmental challenges and secure a sustainable legacy for future generations.</p>
    <blockquote data-typography="blockquote">"This is a pivotal moment for our planet," emphasized the UN Secretary-General, urging immediate and decisive action to combat climate change and preserve natural ecosystems for the well-being of all life forms.</blockquote>
    <p data-typography="paragraph-regular">Experts believe that these collaborative efforts could significantly mitigate the adverse effects of climate change, reducing environmental degradation and fostering resilience in ecosystems and communities worldwide.</p>
    <small data-typography="small-regular">Reported by Global News Network</small>
    <small data-typography="small-medium">In-depth Analysis by Industry Experts</small>
    <small data-typography="small-bold">Latest Breaking News Update</small>
    <code data-typography="code-regular">console.log('Sustainability is the future'); // Log the sustainability message</code>
    <p data-typography="paragraph-regular">For more information on the summit's outcomes and detailed reports, visit the official website to explore comprehensive insights and follow-up actions.</p>
    <a href="#" data-typography="link">Learn more about the summit and its key outcomes...</a>
    `;
}



// Function to adjust font size for Mobile
function adjustFontSize(fontSize) {
    const size = parseFloat(fontSize);
const mobileFontSize = Math.max(14, size * 0.875); // Reduce by 12.5%, minimum 14px
return `${mobileFontSize}px`;
}

function adjustLineHeight(fontSize, lineHeight) {
    const size = parseFloat(fontSize);
    const lh = parseFloat(lineHeight);
    return lh;
}

function populateAbbreviationFooter() {
    const footer = document.getElementById('abbreviationFooter');

// Abbreviation matches
    const abbreviationMatches = {
// T-shirt sizes and their HTML equivalents
        'H1' : '8xl',
        'H2' : '4xl',
        'H3' : '3xl',
        'H4' : '2xl',
        'H5' : 'xl',
        'H6' : 'lg',
        'p' : 'md',
        'small' : 'sm',
// Add other matches if needed
    };

// Create the content for the footer
    let footerContent = '<h4>Abbreviation Matches</h4><ul class="abbreviation-list">';

    for (const [abbr, match] of Object.entries(abbreviationMatches)) {
// Use the exact letter case as defined in code
        footerContent += `<li><strong>${abbr}</strong> = ${match}</li>`;
    }

    footerContent += '</ul>';

    footer.innerHTML = footerContent;
}

// Download JSON file
function downloadJson() {
    const jsonOutputElem = document.getElementById('jsonOutput');
    if (jsonOutputElem && jsonOutputElem.dataset.fullJson) {
        const fullJson = jsonOutputElem.dataset.fullJson;
        const blob = new Blob([fullJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tokens.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        alert('Please generate a palette first.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadPaletteLibraryFromStorage();
    populatePaletteSelector();
    document.getElementById('paletteSelector').value = 'Material Default';
// Render the initial rows only - preserves the original behavior of not
// auto-generating a palette until the user clicks Generate or presses Enter.
    initializeColorInputs(paletteLibrary['Material Default'].colors);
    populateFontSelectors();

    document.getElementById('generateButton').addEventListener('click', generatePalette);

// Palette library: switch, import, save, delete
    document.getElementById('paletteSelector').addEventListener('change', (e) => {
        loadPalette(e.target.value);
    });

    document.getElementById('addColorButton').addEventListener('click', addCustomColorRow);

    populateTweakcnSelector();
    document.getElementById('loadTweakcnButton').addEventListener('click', () => {
        const selector = document.getElementById('tweakcnPresetSelector');
        const preset = tweakcnPresets.find(p => p.name === selector.value);
        if (preset) importTweakcnPreset(preset);
    });

    document.getElementById('importDesignMdButton').addEventListener('click', () => {
        document.getElementById('importPanel').hidden = false;
    });

    document.getElementById('cancelImportButton').addEventListener('click', () => {
        document.getElementById('importPanel').hidden = true;
        document.getElementById('importError').textContent = '';
        document.getElementById('designMdTextarea').value = '';
        document.getElementById('designMdFileInput').value = '';
    });

    document.getElementById('designMdFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById('designMdTextarea').value = reader.result;
        };
        reader.readAsText(file);
    });

    document.getElementById('parseDesignMdButton').addEventListener('click', () => {
        const text = document.getElementById('designMdTextarea').value;
        const errorEl = document.getElementById('importError');
        errorEl.textContent = '';
        const file = document.getElementById('designMdFileInput').files[0];
        const fallbackName = file ? file.name.replace(/\.mdx?$/i, '') : null;

        try {
            importDesignMd(text, fallbackName);
            document.getElementById('importPanel').hidden = true;
            document.getElementById('designMdTextarea').value = '';
            document.getElementById('designMdFileInput').value = '';
        } catch (e) {
            errorEl.textContent = e.message;
        }
    });

    document.getElementById('savePaletteButton').addEventListener('click', () => {
        const name = prompt('Save the current colors as a palette named:');
        if (!name || !name.trim()) return;
        let finalName = name.trim();

        const existing = paletteLibrary[finalName];
        if (existing && existing.builtin) {
            alert('That name is reserved for the built-in default. Please choose another name.');
            return;
        }
        if (existing && !confirm(`"${finalName}" already exists. Overwrite it?`)) {
            finalName = ensureUniqueName(finalName);
        }

        paletteLibrary[finalName] = { colors: getCurrentColorsFromRows(), builtin: false };
        savePaletteLibrary();
        populatePaletteSelector();
        document.getElementById('paletteSelector').value = finalName;
    });

    document.getElementById('deletePaletteButton').addEventListener('click', () => {
        const selector = document.getElementById('paletteSelector');
        const name = selector.value;
        if (paletteLibrary[name] && paletteLibrary[name].builtin) {
            alert("The built-in default palette can't be deleted.");
            return;
        }
        if (!confirm(`Delete palette "${name}"?`)) return;

        delete paletteLibrary[name];
        savePaletteLibrary();
        populatePaletteSelector();
        loadPalette(document.getElementById('paletteSelector').value);
    });
    document.getElementById('downloadButton').addEventListener('click', () => {
        if (!paletteGenerated) {
            generatePalette();
        }
        downloadJson();
    });

// Trigger generatePalette when Enter key is pressed
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'BUTTON' || activeElement.tagName === 'SELECT') {
                activeElement.blur();
            }
            if (document.getElementById('colorTab').classList.contains('active')) {
                generatePalette();
            }
        }
    });

// Update typography in real-time
    const typographyInputs = document.querySelectorAll('.typography-settings input, .typography-settings select');
    typographyInputs.forEach(input => {
        input.addEventListener('change', updateTypography);
        input.addEventListener('input', updateTypography);
    });

// Add event listener for paragraph spacing input
    document.getElementById('paragraphSpacingInput').addEventListener('input', updateTypography);

// Update spacing scale in real-time
    document.getElementById('spacingBaseUnitInput').addEventListener('input', updateSpacingScale);
    document.getElementById('spacingBaseUnitInput').addEventListener('input', updateRadiusScale);

// Initialize the tabs
    openTab('colorTab');

// Randomly select fonts on page load
    randomizeFonts();

// Initial typography update
    updateTypography();

// Initial spacing scale render
    updateSpacingScale();
    updateRadiusScale();

// Populate the abbreviation footer
    populateAbbreviationFooter();


// Call this function after rendering the typography samples
    positionLegends();

// Also call it on window resize
    window.addEventListener('resize', positionLegends);

});
