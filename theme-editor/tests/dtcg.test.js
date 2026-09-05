// node tests/dtcg.test.js  (run from theme-editor/, or anywhere: paths are absolute)
//
// Loads the palette data, foundation.js and dtcg.js as plain browser
// scripts in one vm context, then checks buildTokensJson / parseTokensJson:
// file shape, every {reference} resolves inside the file, and a full
// stringify -> parse -> parseTokensJson -> buildTokensJson round-trip is
// deep-equal to the first export.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'dtcg.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});
// Module outputs are normalised through JSON: that is what a real file goes
// through anyway, and it strips the vm realm's prototypes so
// assert.deepStrictEqual compares structure, not Object identity.
const norm = o => JSON.parse(JSON.stringify(o));
const buildTokensJson = ctx => norm(context.buildTokensJson(ctx));
const parseTokensJson = obj => norm(context.parseTokensJson(obj));
const { paletteEntryByName } = context;

// --- fixture: what scripts.js would hand over ---------------------------

const TYPE_SETS = [
    { key: 'display',    family: 'sans', weight: '700', size: 2.25,  leading: 2.5,  tracking: '-0.025em' },
    { key: 'heading',    family: 'sans', weight: '600', size: 1.5,   leading: 2,    tracking: '-0.015em' },
    { key: 'subheading', family: 'sans', weight: '500', size: 1.125, leading: 1.75, tracking: '0em' },
    { key: 'body',       family: 'sans', weight: '400', size: 1,     leading: 1.5,  tracking: '0em' },
    { key: 'label',      family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' },
    { key: 'caption',    family: 'sans', weight: '400', size: 0.75,  leading: 1,    tracking: '0em' },
    { key: 'code',       family: 'mono', weight: '400', size: 0.875, leading: 1.25, tracking: '0em' }
];

const ROLES = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    'shadow-color'
];
assert.strictEqual(ROLES.length, 33);

const SPECIALS = { white: '#ffffff', black: '#000000', transparent: 'transparent' };
function link(source, name) {
    const entry = paletteEntryByName(source, name) || (SPECIALS[name] ? { hex: SPECIALS[name] } : null);
    assert(entry, `fixture palette name ${name} exists in ${source}`);
    return { source, name, hex: entry.hex };
}

function modeVars(source, linkMap, literals) {
    const vars = {};
    ROLES.forEach((role, i) => { vars[role] = literals[role] || `#${(0x101010 + i * 0x0a0a0a).toString(16).padStart(6, '0')}`; });
    Object.keys(linkMap).forEach(role => { vars[role] = linkMap[role].hex; });
    vars['font-sans'] = 'Inter, sans-serif';
    vars['font-serif'] = 'ui-serif, serif';
    vars['font-mono'] = 'JetBrains Mono, monospace';
    vars['tracking-normal'] = '0em';
    TYPE_SETS.forEach(set => {
        vars[`type-${set.key}-family`] = `var(--font-${set.family})`;
        vars[`type-${set.key}-weight`] = set.weight;
        vars[`type-${set.key}-size`] = `${set.size}rem`;
        vars[`type-${set.key}-leading`] = `${set.leading}rem`;
        vars[`type-${set.key}-tracking`] = set.tracking;
    });
    return vars;
}

function tailwindCtx() {
    const source = 'tailwind';
    const light = {
        background: link(source, 'white'),            // special, outside any family
        primary: link(source, 'neutral-900'),
        'primary-foreground': link(source, 'neutral-50'),
        border: link(source, 'neutral-200'),
        ring: link(source, 'blue-500'),
        'shadow-color': link(source, 'black'),
        accent: link(source, 'rose-500'),             // outside the subset -> must still be emitted in palette
        card: { source: 'atlassian', name: 'Neutral0', hex: '#FFFFFF' } // foreign link -> literal
    };
    const dark = {
        primary: link(source, 'neutral-50'),
        'primary-foreground': link(source, 'neutral-900'),
        border: link(source, 'neutral-800'),
        ring: link(source, 'blue-400'),
        'shadow-color': link(source, 'black')
    };
    const literals = { background: '#ffffff', card: '#FFFFFF', 'shadow-color': '#000000' };
    const vars = { light: modeVars(source, light, literals), dark: modeVars(source, dark, { 'shadow-color': '#000000' }) };
    // one off-scale type size (1.3rem) to exercise the px-literal path
    vars.light['type-subheading-size'] = '1.3rem';
    vars.dark['type-subheading-size'] = '1.3rem';
    return {
        name: 'Test system',
        source,
        families: ['neutral', 'blue'],
        vars,
        links: { light, dark },
        components: {
            'button.primary.bg.color': 'color.primary',
            'button.primary.text.color': 'color.primary-foreground',
            'button.primary.text.type': 'type.label',
            'button.primary.bg.color.hover': 'palette.neutral-800',
            'button.primary.radius': 'radius.md',
            'button.primary.padding.x': 'space.4',
            'button.primary.gap': 'space.2',
            'button.ghost.bg.color': 'palette.transparent',
            'input.border.color': 'color.input',
            'input.border.color.focus': 'color.ring',
            'input.border.width': 'border.width.1',
            'input.border.style': 'border.style.solid',
            'input.border.color.disabled': 'color.muted',
            'card.radius': 'radius.lg',
            'card.shadow': 'shadow.sm',
            'card.padding': 'space.6',
            'card.title.type': 'type.subheading',
            'separator.width': 'border.width.1',
            'separator.line.color': 'color.border',
            'not.a.ref': '#ff0000'       // literal: must be dropped, never exported
        },
        typeSets: TYPE_SETS
    };
}

function atlassianCtx() {
    const source = 'atlassian';
    const light = { primary: link(source, 'Blue700'), border: link(source, 'Neutral300'), 'shadow-color': link(source, 'Neutral1200') };
    const dark = { primary: link(source, 'Blue400'), border: link(source, 'Neutral800'), 'shadow-color': link(source, 'Neutral1200') };
    const vars = { light: modeVars(source, light, {}), dark: modeVars(source, dark, {}) };
    // Atlassian scales are px; put body on font.size.200 (16px) / lineHeight.300 (24px)
    ['light', 'dark'].forEach(m => { vars[m]['type-body-size'] = '1rem'; vars[m]['type-body-leading'] = '1.5rem'; });
    return {
        name: 'ADS test', source, families: ['Neutral', 'Blue'], vars, links: { light, dark },
        components: {
            'button.primary.bg.color': 'color.primary',
            'button.primary.bg.color.hover': 'palette.Blue800',
            'card.padding': 'space.space.300',
            'card.radius': 'radius.radius.large',
            'input.border.width': 'border.width.border.width',
            'card.shadow': 'shadow.elevation.shadow.raised',
            'card.body.type': 'type.body'
        },
        typeSets: TYPE_SETS
    };
}

// --- helpers ---------------------------------------------------------------

function isToken(node) {
    return !!node && typeof node === 'object' && !Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, '$value');
}

// Every token in every set as { set, path, token }, path = "group.sub.name"
// (flat dotted keys join the same way Tokens Studio flattens them). A path
// can exist in several sets (light/dark both hold color.primary), so this
// is a list, not a map.
function collectTokens(file) {
    const out = [];
    const walk = (node, prefix, set) => {
        Object.keys(node).forEach(key => {
            if (key.startsWith('$')) return;
            const child = node[key];
            const p = prefix ? `${prefix}.${key}` : key;
            if (isToken(child)) out.push({ set, path: p, token: child });
            else if (child && typeof child === 'object' && !Array.isArray(child)) walk(child, p, set);
        });
    };
    Object.keys(file).filter(k => !k.startsWith('$')).forEach(set => walk(file[set], '', set));
    return out;
}

// A token object must never carry child tokens (Tokens Studio can't read a
// node that is both a token and a group). Checked structurally, per key,
// because flat dotted keys ("0.5" next to "0") are legal and not nesting.
function assertNoTokenIsAGroup(file) {
    const walk = (node, where) => {
        Object.keys(node).forEach(key => {
            if (key.startsWith('$')) return;
            const child = node[key];
            if (!child || typeof child !== 'object' || Array.isArray(child)) return;
            const p = `${where}.${key}`;
            if (isToken(child)) {
                const extra = Object.keys(child).filter(k => !k.startsWith('$'));
                assert.deepStrictEqual(extra, [], `token ${p} also carries child keys ${extra.join(', ')}`);
            } else walk(child, p);
        });
    };
    Object.keys(file).filter(k => !k.startsWith('$')).forEach(set => walk(file[set], set));
}

function refsIn(value, out) {
    if (typeof value === 'string') {
        const m = value.match(/^\{([^{}]+)\}$/);
        if (m) out.push(m[1]);
    } else if (Array.isArray(value)) value.forEach(v => refsIn(v, out));
    else if (value && typeof value === 'object') Object.values(value).forEach(v => refsIn(v, out));
    return out;
}

function assertAllRefsResolve(file, label) {
    const tokens = collectTokens(file);
    const names = new Set(tokens.map(t => t.path));
    let count = 0;
    tokens.forEach(({ set, path, token }) => {
        refsIn(token.$value, []).forEach(ref => {
            count++;
            assert(names.has(ref), `${label}: ${set}.${path} references {${ref}} which does not exist in the file`);
        });
    });
    return count;
}

function roundTrip(file, typeSets) {
    const reparsed = JSON.parse(JSON.stringify(file));
    const parsed = parseTokensJson(reparsed);
    assert.deepStrictEqual(parsed.warnings, [], 'round-trip parse produced warnings');
    return { parsed, rebuilt: buildTokensJson({ ...parsed, typeSets }) };
}

// --- tests -----------------------------------------------------------------

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`ok   ${name}`); }
    catch (err) { console.log(`FAIL ${name}\n     ${err.message}`); process.exitCode = 1; }
}

const ctx = tailwindCtx();
const file = buildTokensJson(ctx);

test('file has the four sets, $metadata and $themes', () => {
    assert.deepStrictEqual(Object.keys(file), ['global', 'light', 'dark', 'component', '$metadata', '$themes']);
    assert.deepStrictEqual(file.$metadata, { tokenSetOrder: ['global', 'light', 'dark', 'component'] });
    assert.strictEqual(file.$themes.length, 2);
    assert.deepStrictEqual(file.$themes[0], { id: 'light', name: 'Light', group: 'mode', selectedTokenSets: { global: 'source', light: 'enabled', component: 'enabled' } });
    assert.deepStrictEqual(file.$themes[1], { id: 'dark', name: 'Dark', group: 'mode', selectedTokenSets: { global: 'source', dark: 'enabled', component: 'enabled' } });
    // Individual fields, not a whole-object deep-equal: later keys (semantic,
    // groups, customElements, typeSets, …) are additive and only appear when
    // ctx actually carries them (see the "buildTokensJson takes
    // ctx.semanticTokens" group below) - a deep-equal here would break the
    // moment any of those cards' ctx fixture grows past this one.
    const ext = file.global.$extensions['theme-editor'];
    assert.strictEqual(ext.version, 2);
    assert.strictEqual(ext.name, 'Test system');
    assert.strictEqual(ext.source, 'tailwind');
    assert.deepStrictEqual(ext.families, ['neutral', 'blue']);
    assert.strictEqual(ext.semantic, undefined, 'no semantic key when ctx carries no semanticTokens');
});

test('global palette = subset families + specials + out-of-subset link targets', () => {
    const p = file.global.palette;
    assert.strictEqual(Object.keys(p).length, 11 * 2 + 3 + 1);       // neutral + blue + white/black/transparent + rose-500
    assert.deepStrictEqual(p['neutral-200'], { $type: 'color', $value: '#e5e5e5' });
    assert.deepStrictEqual(p.transparent, { $type: 'color', $value: 'transparent' });
    assert.deepStrictEqual(p['rose-500'], { $type: 'color', $value: '#ff2056' });
    assert.strictEqual(p.Neutral0, undefined, 'foreign-source link must not leak into the palette');
});

test('global scales are px with the right $type', () => {
    const g = file.global;
    assert.deepStrictEqual(g.space['4'], { $type: 'spacing', $value: '16px' });
    assert.deepStrictEqual(g.space['0.5'], { $type: 'spacing', $value: '2px' });
    assert.deepStrictEqual(g.radius.lg, { $type: 'borderRadius', $value: '8px' });
    assert.deepStrictEqual(g.radius.full, { $type: 'borderRadius', $value: '9999px' });
    assert.deepStrictEqual(g.border.width['1'], { $type: 'strokeWidth', $value: '1px' });
    assert.deepStrictEqual(g.border.style.dashed, { $type: 'strokeStyle', $value: 'dashed' });
    assert.deepStrictEqual(g.font.size.base, { $type: 'fontSizes', $value: '16px' });
    assert.deepStrictEqual(g.font.lineHeight['6'], { $type: 'lineHeights', $value: '24px' });
    assert.deepStrictEqual(g.shadow.none, { $type: 'boxShadow', $value: [] });
    assert.deepStrictEqual(g.shadow.sm, {
        $type: 'boxShadow',
        $description: 'alpha 0.1, 0.1',
        $value: [
            { x: '0px', y: '1px', blur: '3px', spread: '0px', color: '{color.shadow-color}', type: 'dropShadow' },
            { x: '0px', y: '1px', blur: '2px', spread: '-1px', color: '{color.shadow-color}', type: 'dropShadow' }
        ]
    });
});

test('font families and typography composites', () => {
    const g = file.global;
    assert.deepStrictEqual(g.font.family, {
        sans: { $type: 'fontFamilies', $value: 'Inter, sans-serif' },
        serif: { $type: 'fontFamilies', $value: 'ui-serif, serif' },
        mono: { $type: 'fontFamilies', $value: 'JetBrains Mono, monospace' }
    });
    assert.strictEqual(Object.keys(g.type).length, 7);
    assert.deepStrictEqual(g.type.body, { $type: 'typography', $value: {
        fontFamily: '{font.family.sans}', fontWeight: '400', fontSize: '{font.size.base}', lineHeight: '{font.lineHeight.6}', letterSpacing: '0em'
    } });
    assert.deepStrictEqual(g.type.code.$value.fontFamily, '{font.family.mono}');
    assert.deepStrictEqual(g.type.display.$value, {
        fontFamily: '{font.family.sans}', fontWeight: '700', fontSize: '{font.size.4xl}', lineHeight: '{font.lineHeight.10}', letterSpacing: '-0.025em'
    });
    assert.strictEqual(g.type.subheading.$value.fontSize, '20.8px', 'off-scale size becomes a px literal');
});

test('light/dark color sets: palette refs when linked, literals otherwise, all 33 roles', () => {
    const l = file.light.color;
    const d = file.dark.color;
    assert.strictEqual(Object.keys(l).length, 33);
    assert.strictEqual(Object.keys(d).length, 33);
    assert.deepStrictEqual(l.primary, { $type: 'color', $value: '{palette.neutral-900}' });
    assert.deepStrictEqual(l.background, { $type: 'color', $value: '{palette.white}' });
    assert.deepStrictEqual(l.accent, { $type: 'color', $value: '{palette.rose-500}' });
    assert.deepStrictEqual(l['shadow-color'], { $type: 'color', $value: '{palette.black}' });
    assert.deepStrictEqual(l.card, { $type: 'color', $value: '#FFFFFF' }, 'foreign-source link exports as literal');
    assert.deepStrictEqual(d.primary, { $type: 'color', $value: '{palette.neutral-50}' });
    assert.match(d['chart-1'].$value, /^#[0-9a-f]{6}$/);
    assert.strictEqual(file.light.color['font-sans'], undefined, 'non-color keys stay out of the color sets');
});

test('component set: nested by id, $type by ref kind, state folded into leaf', () => {
    const c = file.component.component;
    assert.deepStrictEqual(c.button.primary.bg, {
        color: { $type: 'color', $value: '{color.primary}' },
        'color-hover': { $type: 'color', $value: '{palette.neutral-800}' }
    });
    assert.deepStrictEqual(c.button.primary.text.type, { $type: 'typography', $value: '{type.label}' });
    assert.deepStrictEqual(c.button.primary.radius, { $type: 'borderRadius', $value: '{radius.md}' });
    assert.deepStrictEqual(c.button.primary.padding.x, { $type: 'spacing', $value: '{space.4}' });
    assert.deepStrictEqual(c.button.ghost.bg.color, { $type: 'color', $value: '{palette.transparent}' });
    assert.deepStrictEqual(c.input.border, {
        color: { $type: 'color', $value: '{color.input}' },
        'color-focus': { $type: 'color', $value: '{color.ring}' },
        width: { $type: 'strokeWidth', $value: '{border.width.1}' },
        style: { $type: 'strokeStyle', $value: '{border.style.solid}' },
        'color-disabled': { $type: 'color', $value: '{color.muted}' }
    });
    assert.deepStrictEqual(c.card.shadow, { $type: 'boxShadow', $value: '{shadow.sm}' });
    assert.deepStrictEqual(c.separator.width, { $type: 'strokeWidth', $value: '{border.width.1}' });
    assert.strictEqual(c.not, undefined, 'literal component value is dropped');
    assertNoTokenIsAGroup(file);
});

test('every {reference} in the file resolves to a token path in the file', () => {
    const n = assertAllRefsResolve(file, 'tailwind');
    assert(n > 60, `expected plenty of references, saw ${n}`);
});

test('round-trip: stringify -> parse -> parseTokensJson -> buildTokensJson is deep-equal', () => {
    const { parsed, rebuilt } = roundTrip(file, TYPE_SETS);
    assert.deepStrictEqual(rebuilt, file);
    assert.strictEqual(parsed.name, 'Test system');
    assert.strictEqual(parsed.source, 'tailwind');
    assert.deepStrictEqual(parsed.families, ['neutral', 'blue']);
    assert.deepStrictEqual(parsed.links.light.primary, { source: 'tailwind', name: 'neutral-900', hex: '#171717' });
    assert.deepStrictEqual(parsed.links.light.background, { source: 'tailwind', name: 'white', hex: '#ffffff' });
    assert.strictEqual(parsed.vars.light.primary, '#171717');
    assert.strictEqual(parsed.vars.light.card, '#FFFFFF');
    assert.strictEqual(parsed.links.light.card, undefined);
    assert.strictEqual(parsed.vars.light['type-body-size'], '1rem');
    assert.strictEqual(parsed.vars.dark['type-body-leading'], '1.5rem');
    assert.strictEqual(parsed.vars.light['type-subheading-size'], '1.3rem');
    assert.strictEqual(parsed.vars.light['type-code-family'], 'var(--font-mono)');
    assert.strictEqual(parsed.vars.light['font-mono'], 'JetBrains Mono, monospace');
    assert.strictEqual(parsed.components['button.primary.bg.color.hover'], 'palette.neutral-800');
    assert.strictEqual(parsed.components['input.border.color.focus'], 'color.ring');
    assert.strictEqual(parsed.components['card.radius'], 'radius.lg');
    assert.strictEqual(Object.keys(parsed.components).length, Object.keys(ctx.components).length - 1);
});

test('atlassian source: dotted names, px scales, round-trip', () => {
    const actx = atlassianCtx();
    const afile = buildTokensJson(actx);
    assert.deepStrictEqual(afile.global.space['space.300'], { $type: 'spacing', $value: '24px' });
    assert.deepStrictEqual(afile.global.border.width['border.width'], { $type: 'strokeWidth', $value: '1px' });
    assert.deepStrictEqual(afile.global.type.body.$value.fontSize, '{font.size.font.size.200}');
    assert.deepStrictEqual(afile.global.type.body.$value.lineHeight, '{font.lineHeight.font.lineHeight.300}');
    assert.deepStrictEqual(afile.component.component.card.padding, { $type: 'spacing', $value: '{space.space.300}' });
    assert.deepStrictEqual(afile.light.color.primary, { $type: 'color', $value: '{palette.Blue700}' });
    assertAllRefsResolve(afile, 'atlassian');
    const { parsed, rebuilt } = roundTrip(afile, TYPE_SETS);
    assert.deepStrictEqual(rebuilt, afile);
    assert.strictEqual(parsed.source, 'atlassian');
    assert.strictEqual(parsed.vars.light['type-body-size'], '1rem');
    assert.strictEqual(parsed.components['button.primary.bg.color.hover'], 'palette.Blue800');
});

test('source and families are inferred when $extensions is missing', () => {
    const stripped = JSON.parse(JSON.stringify(file));
    delete stripped.global.$extensions;
    const parsed = parseTokensJson(stripped);
    assert.strictEqual(parsed.source, 'tailwind');
    assert.deepStrictEqual(parsed.families, ['blue', 'rose', 'neutral']);   // source family order; rose came in via a link
    assert.strictEqual(parsed.name, 'Imported tokens');

    const afile = buildTokensJson(atlassianCtx());
    delete afile.global.$extensions;
    const aparsed = parseTokensJson(afile);
    assert.strictEqual(aparsed.source, 'atlassian');
    assert.deepStrictEqual(aparsed.families, ['Blue', 'Neutral']);
});

test('missing dark set copies light; renamed sets are found by content', () => {
    const f = JSON.parse(JSON.stringify(file));
    const renamed = { Global: f.global, Theme: f.light, Parts: f.component, $metadata: { tokenSetOrder: ['Global', 'Theme', 'Parts'] } };
    const parsed = parseTokensJson(renamed);
    assert.deepStrictEqual(parsed.vars.dark, parsed.vars.light);
    assert.deepStrictEqual(parsed.links.dark, parsed.links.light);
    assert.strictEqual(parsed.components['card.shadow'], 'shadow.sm');
    assert.strictEqual(parsed.vars.light.primary, '#171717');
});

test('non-token objects throw a readable Error', () => {
    assert.throws(() => parseTokensJson(null), /Not a tokens file/);
    assert.throws(() => parseTokensJson([]), /Not a tokens file/);
    assert.throws(() => parseTokensJson({}), /Not a tokens file/);
    assert.throws(() => parseTokensJson({ name: 'x', vars: { light: {} } }), /Not a tokens file/);
    assert.throws(() => parseTokensJson({ $metadata: { tokenSetOrder: [] } }), /Not a tokens file/);
});

test('semantic alias {color.x} inside a set and unknown palette names', () => {
    const f = JSON.parse(JSON.stringify(file));
    f.light.color.sidebar = { $type: 'color', $value: '{color.background}' };
    f.light.color.ring = { $type: 'color', $value: '{palette.nope-999}' };
    const parsed = parseTokensJson(f);
    assert.strictEqual(parsed.vars.light.sidebar, '#ffffff');
    assert.deepStrictEqual(parsed.links.light.sidebar, { source: 'tailwind', name: 'white', hex: '#ffffff' });
    assert.strictEqual(parsed.vars.light.ring, '{palette.nope-999}');
    assert.strictEqual(parsed.links.light.ring, undefined);
    assert.strictEqual(parsed.warnings.length, 1);
    assert.match(parsed.warnings[0], /nope-999/);
});

test('buildTokensJson derives type sets from vars when ctx.typeSets is absent', () => {
    const noSets = { ...ctx, typeSets: undefined };
    const f = buildTokensJson(noSets);
    assert.deepStrictEqual(Object.keys(f.global.type).sort(), TYPE_SETS.map(s => s.key).sort());
});

// --- ctx.semanticTokens (card 8: "Add a semantic color token") -------------

test('buildTokensJson takes ctx.semanticTokens: a user color token exports and round-trips', () => {
    const base = tailwindCtx();
    const warningLink = link('tailwind', 'amber-500');
    const semanticTokens = [...ROLES.map(name => ({ kind: 'color', name })), { kind: 'color', name: 'warning' }];
    const ctxWithToken = {
        ...base,
        vars: {
            light: { ...base.vars.light, warning: warningLink.hex },
            dark: { ...base.vars.dark, warning: warningLink.hex }
        },
        links: {
            light: { ...base.links.light, warning: warningLink },
            dark: { ...base.links.dark, warning: warningLink }
        },
        semanticTokens
    };
    const f = buildTokensJson(ctxWithToken);

    assert.strictEqual(Object.keys(f.light.color).length, 34, 'light color set gains the new role');
    assert.strictEqual(Object.keys(f.dark.color).length, 34, 'dark color set gains the new role');
    assert.deepStrictEqual(f.light.color.warning, { $type: 'color', $value: '{palette.amber-500}' });
    assert.deepStrictEqual(f.dark.color.warning, { $type: 'color', $value: '{palette.amber-500}' });
    assert.deepStrictEqual(f.global.palette['amber-500'], { $type: 'color', $value: warningLink.hex });
    assert.deepStrictEqual(f.global.$extensions['theme-editor'].semantic, { tokens: semanticTokens });
    const n = assertAllRefsResolve(f, 'tailwind + warning token');
    assert(n > 60, `expected plenty of references, saw ${n}`);

    const { parsed, rebuilt } = roundTrip(f, TYPE_SETS);
    assert.deepStrictEqual(rebuilt, f, 'round-trip with a user token is deep-equal');
    assert.deepStrictEqual(parsed.semanticTokens, semanticTokens, 'round-trip keeps the user token, in place, in parsed.semanticTokens');
});

test('buildTokensJson emits no semantic key when ctx.semanticTokens is exactly the 33 defaults, in order', () => {
    const withDefaults = { ...ctx, semanticTokens: ROLES.map(name => ({ kind: 'color', name })) };
    const f = buildTokensJson(withDefaults);
    assert.strictEqual(f.global.$extensions['theme-editor'].semantic, undefined);
    assert.deepStrictEqual(f, file, 'identical to an export with no ctx.semanticTokens at all');
});

test('buildTokensJson emits no semantic key for the 33 defaults in a DIFFERENT order (the live app\'s own list is not sorted like DTCG_COLOR_ROLES)', () => {
    // scripts.js/semantic.js's SEMANTIC_COLOR_ROLES groups the 33 roles for
    // the Summary tab (primary, primary-foreground, secondary, …) - a
    // completely different order from this file's own DTCG_COLOR_ROLES
    // (background, foreground, card, …). The "is this the default list"
    // check must compare as a SET, or every untouched real export would be
    // wrongly flagged "non-default" and carry a redundant extension key.
    const reordered = [...ROLES].reverse().map(name => ({ kind: 'color', name }));
    assert.notDeepStrictEqual(reordered.map(t => t.name), ROLES, 'fixture precondition: genuinely a different order');
    const f = buildTokensJson({ ...ctx, semanticTokens: reordered });
    assert.strictEqual(f.global.$extensions['theme-editor'].semantic, undefined);
});

test('parseTokensJson: an extension token with no color leaf in either mode is dropped, with one warning', () => {
    const f = JSON.parse(JSON.stringify(file));
    f.global.$extensions['theme-editor'].semantic = { tokens: [{ kind: 'color', name: 'primary' }, { kind: 'color', name: 'ghost' }] };
    const parsed = parseTokensJson(f);
    assert.deepStrictEqual(parsed.semanticTokens, [{ kind: 'color', name: 'primary' }], '"ghost" has no value in light or dark and is dropped; "primary" (which does) survives');
    assert.strictEqual(parsed.warnings.length, 1);
    assert.match(parsed.warnings[0], /ghost/);
});

test('parseTokensJson: no $extensions.semantic falls back to the 33 roles + any extra valid color leaf (union of light/dark)', () => {
    const f = JSON.parse(JSON.stringify(file));
    assert.strictEqual(f.global.$extensions['theme-editor'].semantic, undefined, 'fixture precondition: no semantic key');
    f.light.color.brandy = { $type: 'color', $value: '#a1b2c3' };
    f.light.color['brand.500'] = { $type: 'color', $value: '#d4d4d4' }; // nested Penpot-style group, not a plain identifier
    const parsed = parseTokensJson(f);
    const names = parsed.semanticTokens.map(t => t.name);
    assert.strictEqual(parsed.semanticTokens.length, 34, '33 built-ins + the one valid extra leaf');
    assert(parsed.semanticTokens.every(t => t.kind === 'color'));
    assert(names.includes('brandy'), 'a non-built-in but identifier-valid leaf is added to the list');
    assert(!names.includes('brand.500'), 'a non-identifier leaf (a nested/dotted group) is not added');
    assert.strictEqual(parsed.vars.light.brandy, '#a1b2c3');
    assert.strictEqual(parsed.vars.dark.brandy, undefined, 'a leaf present in light only stays out of dark - "union" only widens the token LIST, it does not invent a dark value');
    assert.strictEqual(parsed.warnings.length, 1, 'one warning, for the dropped non-identifier leaf');
    assert.match(parsed.warnings[0], /brand\.500/);
});

// --- Non-color semantic tokens (card 9: "Semantic space tokens") -----------

test('buildTokensJson: a space token exports as a real alias under global.semantic, and a component ref to it translates to {semantic.<ref>}', () => {
    const base = tailwindCtx();
    const semanticTokens = [...ROLES.map(name => ({ kind: 'color', name })), { kind: 'space', name: 'card-padding', ref: 'space.6' }];
    const ctxWithToken = {
        ...base,
        components: { ...base.components, 'card.padding': 'space.card-padding' },
        semanticTokens
    };
    const f = buildTokensJson(ctxWithToken);

    assert.deepStrictEqual(f.global.semantic.space['card-padding'], { $type: 'spacing', $value: '{space.6}' });
    assert.deepStrictEqual(f.component.component.card.padding, { $type: 'spacing', $value: '{semantic.space.card-padding}' });
    assert.deepStrictEqual(f.global.$extensions['theme-editor'].semantic, { tokens: semanticTokens.map(({ kind, name }) => ({ kind, name })) });

    const n = assertAllRefsResolve(f, 'tailwind + space token');
    assert(n > 60, `expected plenty of references, saw ${n}`);

    const { parsed, rebuilt } = roundTrip(f, TYPE_SETS);
    assert.deepStrictEqual(rebuilt, f, 'round-trip with a space token is deep-equal');
    assert.deepStrictEqual(
        parsed.semanticTokens.find(t => t.kind === 'space'),
        { kind: 'space', name: 'card-padding', ref: 'space.6' },
        'round-trip keeps the token, with its resolved target ref restored from global.semantic'
    );
    // Explicit, not just "assertAllRefsResolve passed": a missed translation
    // would silently DROP this leaf (parseRef rejects "semantic.…") rather
    // than fail the resolve check, since the leaf would simply not exist.
    assert.strictEqual(parsed.components['card.padding'], 'space.card-padding', 'the component leaf survives the {semantic….} round-trip, not dropped');
});

test('buildTokensJson: the semantic extension key is written for a non-color token alone, even with the color roles exactly the 33 defaults', () => {
    const semanticTokens = [...ROLES.map(name => ({ kind: 'color', name })), { kind: 'space', name: 'card-padding', ref: 'space.6' }];
    const f = buildTokensJson({ ...ctx, semanticTokens });
    assert.notStrictEqual(f.global.$extensions['theme-editor'].semantic, undefined, 'a non-color token alone still triggers the extension key');
    assert.deepStrictEqual(f.global.$extensions['theme-editor'].semantic, { tokens: semanticTokens.map(({ kind, name }) => ({ kind, name })) });
});

test('buildTokensJson: no global.semantic key at all when there is no non-color token (an unmodified export stays byte-identical to before this card)', () => {
    assert.strictEqual(file.global.semantic, undefined);
    assert.strictEqual(buildTokensJson(atlassianCtx()).global.semantic, undefined);
});

test('atlassian source: a space token\'s own component ref is source-independent - only global.semantic\'s target changes', () => {
    const abase = atlassianCtx();
    // Realistic shape: state.semanticTokens always carries the (33+) color
    // roles alongside any non-color addition - never a non-color token alone.
    const spaceToken = { kind: 'space', name: 'card-padding', ref: 'space.space.300' };
    const semanticTokens = [...ROLES.map(name => ({ kind: 'color', name })), spaceToken];
    const actxWithToken = {
        ...abase,
        components: { ...abase.components, 'card.padding': 'space.card-padding' },
        semanticTokens
    };
    const af = buildTokensJson(actxWithToken);
    assert.deepStrictEqual(af.global.semantic.space['card-padding'], { $type: 'spacing', $value: '{space.space.300}' });
    assert.deepStrictEqual(af.component.component.card.padding, { $type: 'spacing', $value: '{semantic.space.card-padding}' });
    assertAllRefsResolve(af, 'atlassian + space token');

    const { parsed, rebuilt } = roundTrip(af, TYPE_SETS);
    assert.deepStrictEqual(rebuilt, af, 'round-trip with a space token (atlassian) is deep-equal');
    assert.deepStrictEqual(parsed.semanticTokens.find(t => t.kind === 'space'), spaceToken);
    assert.strictEqual(parsed.components['card.padding'], 'space.card-padding');
});

test('parseTokensJson: a non-color extension entry with no value under global.semantic is dropped, with one warning', () => {
    const base = tailwindCtx();
    const semanticTokens = [...ROLES.map(name => ({ kind: 'color', name })), { kind: 'space', name: 'card-padding', ref: 'space.6' }];
    const f = JSON.parse(JSON.stringify(buildTokensJson({ ...base, semanticTokens })));
    delete f.global.semantic;   // the alias token is gone, but the extension still lists it
    const parsed = parseTokensJson(f);
    assert(!parsed.semanticTokens.some(t => t.kind === 'space'), 'the space token is dropped when it has no value under global.semantic');
    assert.strictEqual(parsed.warnings.length, 1);
    assert.match(parsed.warnings[0], /card-padding/);
});

console.log(`\n${passed} test group(s) passed${process.exitCode ? ', with failures' : ''}`);
