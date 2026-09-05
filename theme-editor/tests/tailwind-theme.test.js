// node tests/tailwind-theme.test.js  (run from theme-editor/, or anywhere: paths are absolute)
//
// Loads the palette data, foundation.js, dtcg.js and tailwind.js as plain
// browser scripts in one vm context (same pattern as tests/dtcg.test.js),
// then checks buildTailwindCss(ctx): file shape (@custom-variant / :root /
// .dark / @theme inline), every DTCG_COLOR_ROLES role and palette var,
// every foundation scale step (built-in and custom), the v4 naming rules
// (dot -> underscore, group-prefix stripping, "--spacing: initial"), that
// every var() resolves to a declaration in the same file, and that no
// component-part var or @import ever appears.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'dtcg.js', 'tailwind.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});
const {
    paletteEntryByName, findScaleEntry, foundationOf, scaleEntries,
    emptyCustomScale, setCustomScaleFor, remEntry, shadowLayersToCss, twThemeVar, buildTailwindCss
} = context;

// dtcg.js's DTCG_COLOR_ROLES is a `const` - vm.runInContext never reflects a
// top-level const/let onto the context object (only function declarations
// do), so it isn't reachable as context.DTCG_COLOR_ROLES. Mirrored here the
// same way tests/dtcg.test.js mirrors it as its own local ROLES.
const DTCG_COLOR_ROLES = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    'shadow-color'
];
assert.strictEqual(DTCG_COLOR_ROLES.length, 33);

// --- fixtures: what scripts.js's exportCtx() would hand over -------------

const SPECIALS = { white: '#ffffff', black: '#000000', transparent: 'transparent' };
function link(source, name) {
    const entry = paletteEntryByName(source, name) || (SPECIALS[name] ? { hex: SPECIALS[name] } : null);
    assert(entry, `fixture palette name ${name} exists in ${source}`);
    return { source, name, hex: entry.hex };
}

function modeVars(source, linkMap, literals) {
    const vars = {};
    DTCG_COLOR_ROLES.forEach((role, i) => {
        vars[role] = (literals && literals[role]) || `#${(0x101010 + i * 0x0a0a0a).toString(16).padStart(6, '0')}`;
    });
    Object.keys(linkMap).forEach(role => { vars[role] = linkMap[role].hex; });
    vars['font-sans'] = 'Inter, sans-serif';
    vars['font-serif'] = 'ui-serif, serif';
    vars['font-mono'] = 'JetBrains Mono, monospace';
    return vars;
}

// A components map (like a real system would carry) - buildTailwindCss must
// never read it; used only to prove that below.
const FIXTURE_COMPONENTS = {
    'button.primary.bg.color': 'color.primary',
    'card.radius': 'radius.lg',
    'card.padding': 'space.6',
    'separator.width': 'border.width.1'
};

function tailwindCtx() {
    const source = 'tailwind';
    const light = {
        background: link(source, 'white'),
        primary: link(source, 'neutral-900'),
        border: link(source, 'neutral-200'),
        ring: link(source, 'blue-500'),
        'shadow-color': link(source, 'black'),
        accent: link(source, 'rose-500')             // outside families - must still be emitted
    };
    const dark = {
        primary: link(source, 'neutral-50'),
        border: link(source, 'neutral-800'),
        'shadow-color': link(source, 'black')
        // 'card' deliberately unlinked in both modes -> literal, no --palette- for it
    };
    const vars = { light: modeVars(source, light, { background: '#ffffff' }), dark: modeVars(source, dark, {}) };
    return { name: 'Test system', source, vars, links: { light, dark }, components: FIXTURE_COMPONENTS };
}

function atlassianCtx() {
    const source = 'atlassian';
    const light = { primary: link(source, 'Blue700'), border: link(source, 'Neutral300'), 'shadow-color': link(source, 'Neutral1200') };
    const dark = { primary: link(source, 'Blue400'), border: link(source, 'Neutral800'), 'shadow-color': link(source, 'Neutral1200') };
    const vars = { light: modeVars(source, light, {}), dark: modeVars(source, dark, {}) };
    return { name: 'ADS test', source, vars, links: { light, dark }, components: FIXTURE_COMPONENTS };
}

// --- block helpers -----------------------------------------------------

function extractBlock(css, opener) {
    const lines = css.split('\n');
    const starts = lines.map((l, i) => (l.trim() === opener ? i : -1)).filter(i => i !== -1);
    assert.strictEqual(starts.length, 1, `expected exactly one "${opener}" line, found ${starts.length}`);
    const start = starts[0];
    const end = lines.findIndex((l, i) => i > start && l.trim() === '}');
    assert(end !== -1, `no closing "}" for "${opener}"`);
    return lines.slice(start + 1, end);
}

function declaredNames(lines) {
    const names = new Set();
    lines.forEach(l => {
        const m = l.match(/^\s*--([a-z0-9_-]+):/);
        if (m) names.add(m[1]);
    });
    return names;
}

// --- tests ---------------------------------------------------------------

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`ok   ${name}`); }
    catch (err) { console.log(`FAIL ${name}\n     ${err.message}`); process.exitCode = 1; }
}

const twCtx = tailwindCtx();
const tw = buildTailwindCss(twCtx);

test('starts with the header comment then @custom-variant, in that order', () => {
    assert(tw.startsWith('/*'), 'file must start with the header comment');
    const headerEnd = tw.indexOf('*/');
    assert(headerEnd !== -1, 'header comment never closes');
    const afterHeader = tw.slice(headerEnd + 2).replace(/^\s*\n/, '');
    assert(afterHeader.startsWith('@custom-variant dark (&:is(.dark *));'), 'first non-comment line must be @custom-variant dark (&:is(.dark *));');
});

test('exactly one :root, one .dark, one @theme inline block; braces balance', () => {
    extractBlock(tw, ':root {');
    extractBlock(tw, '.dark {');
    extractBlock(tw, '@theme inline {');
    const opens = (tw.match(/\{/g) || []).length;
    const closes = (tw.match(/\}/g) || []).length;
    assert.strictEqual(opens, closes, `brace mismatch: ${opens} "{" vs ${closes} "}"`);
    assert.strictEqual(opens, 3, 'expected exactly 3 block openers');
});

test('every DTCG_COLOR_ROLES role is in :root, in .dark, and aliased in @theme inline', () => {
    const rootNames = declaredNames(extractBlock(tw, ':root {'));
    const darkNames = declaredNames(extractBlock(tw, '.dark {'));
    const themeLines = extractBlock(tw, '@theme inline {');
    DTCG_COLOR_ROLES.forEach(role => {
        assert(rootNames.has(role), `:root missing --${role}`);
        assert(darkNames.has(role), `.dark missing --${role}`);
        assert(themeLines.includes(`  --color-${role}: var(--${role});`), `@theme inline missing --color-${role}: var(--${role});`);
    });
});

test('linked roles resolve to var(--palette-x); every referenced palette var is declared; unlinked/foreign roles are literals', () => {
    const rootLines = extractBlock(tw, ':root {');
    assert(rootLines.includes('  --primary: var(--palette-neutral-900);'), 'linked primary must be var(--palette-neutral-900)');
    assert(rootLines.includes('  --accent: var(--palette-rose-500);'), 'out-of-subset link must still resolve to a var');
    const darkLines = extractBlock(tw, '.dark {');
    assert(darkLines.includes('  --primary: var(--palette-neutral-50);'), 'dark-mode link must resolve separately');
    // unlinked in both modes -> the literal fixture hex, never a var()
    const cardLine = rootLines.find(l => l.startsWith('  --card:'));
    assert(cardLine && !cardLine.includes('var('), `unlinked --card must be a literal, got: ${cardLine}`);

    const rootNames = declaredNames(rootLines);
    const referenced = new Set();
    tw.match(/var\(--([a-z0-9_-]+)/g).forEach(m => referenced.add(m.replace(/^var\(--/, '')));
    Array.from(referenced).filter(n => n.startsWith('palette-')).forEach(n => {
        assert(rootNames.has(n), `:root never declares --${n}, referenced by a var()`);
    });
});

test('every scaleEntries step (built-in and a custom addition) appears in @theme inline, with v4 naming', () => {
    setCustomScaleFor('tailwind', {
        ...emptyCustomScale(),
        space: [remEntry('18', 4.5)],
        radius: [remEntry('huge', 3)],
        shadow: [{ name: 'glow', layers: [[0, 0, 12, 0, 0.3]], value: shadowLayersToCss([[0, 0, 12, 0, 0.3]]), px: null }],
        typeSize: [remEntry('2.5xl', 1.6)],
        typeLeading: [remEntry('99', 5)]
    });
    const out = buildTailwindCss(tailwindCtx());
    const themeLines = extractBlock(out, '@theme inline {');
    scaleEntries('tailwind', 'space').forEach(e => assert(themeLines.includes(`  ${twThemeVar(`space.${e.name}`)}: ${e.value};`), `missing @theme line for space.${e.name}`));
    scaleEntries('tailwind', 'radius').forEach(e => assert(themeLines.includes(`  ${twThemeVar(`radius.${e.name}`)}: ${e.value};`), `missing @theme line for radius.${e.name}`));
    scaleEntries('tailwind', 'shadow').forEach(e => assert(themeLines.includes(`  ${twThemeVar(`shadow.${e.name}`)}: ${e.value};`), `missing @theme line for shadow.${e.name}`));
    scaleEntries('tailwind', 'typeSize').forEach(e => assert(themeLines.includes(`  ${twThemeVar(`font.size.${e.name}`)}: ${e.value};`), `missing @theme line for typeSize ${e.name}`));
    scaleEntries('tailwind', 'typeLeading').forEach(e => assert(themeLines.includes(`  ${twThemeVar(`font.lineHeight.${e.name}`)}: ${e.value};`), `missing @theme line for typeLeading ${e.name}`));
    // the added custom size has no built-in pairing, so no --line-height companion
    assert(!themeLines.some(l => l.includes('--text-2_5xl--line-height')), 'custom size must not fabricate a --line-height pairing');
    setCustomScaleFor('tailwind', emptyCustomScale());
});

test('Tailwind spelling: --spacing: initial first, fractional steps use "_", --text-<size>--line-height pairs', () => {
    const themeLines = extractBlock(tw, '@theme inline {');
    const spacingIdx = themeLines.findIndex(l => l.trim().startsWith('--spacing'));
    assert.strictEqual(themeLines[spacingIdx].trim(), '--spacing: initial;', '--spacing: initial; must be the first spacing line');
    assert(themeLines.includes(`  --spacing-0_5: ${findScaleEntry('tailwind', 'space', '0.5').value};`), 'Tailwind 0.5 must spell as --spacing-0_5 (not 0-5, not escaped)');
    assert(themeLines.includes(`  --spacing-1_5: ${findScaleEntry('tailwind', 'space', '1.5').value};`));
    assert(!themeLines.some(l => /--spacing-0-5\b/.test(l)), 'must never emit the dash spelling --spacing-0-5');
    const xl = findScaleEntry('tailwind', 'typeSize', 'xl');
    const xlIndex = foundationOf('tailwind').typeSize.findIndex(e => e.name === 'xl');
    const xlLeading = foundationOf('tailwind').typeSizeLeading[xlIndex];
    assert(themeLines.includes(`  --text-xl: ${xl.value};`));
    assert(themeLines.includes(`  --text-xl--line-height: ${xlLeading}rem;`));
});

test('Atlassian spelling: dotted names strip their group; every step present', () => {
    const actx = atlassianCtx();
    const out = buildTailwindCss(actx);
    const themeLines = extractBlock(out, '@theme inline {');
    assert(themeLines.includes(`  --spacing-100: ${findScaleEntry('atlassian', 'space', 'space.100').value};`));
    assert(themeLines.includes(`  --radius-large: ${findScaleEntry('atlassian', 'radius', 'radius.large').value};`));
    assert(themeLines.includes(`  --text-100: ${findScaleEntry('atlassian', 'typeSize', 'font.size.100').value};`));
    assert(themeLines.includes(`  --leading-300: ${findScaleEntry('atlassian', 'typeLeading', 'font.lineHeight.300').value};`));
    assert(themeLines.some(l => l.startsWith('  --shadow-raised:')), 'Atlassian elevation.shadow.raised must spell as --shadow-raised');
    assert(!themeLines.some(l => /--spacing-space-/.test(l) || /--radius-radius-/.test(l)), 'must never double the source group prefix');
    const rootLines = extractBlock(out, ':root {');
    assert(rootLines.includes(`  --border-width-default: ${findScaleEntry('atlassian', 'borderWidth', 'border.width').value};`), 'Atlassian bare "border.width" step must resolve to -default, like refToVar');
});

test('border width/style: plain :root vars, absent from @theme inline', () => {
    const rootLines = extractBlock(tw, ':root {');
    ['0', '1', '2', '4', '8'].forEach(n => assert(rootLines.some(l => l.startsWith(`  --border-width-${n}:`)), `:root missing --border-width-${n}`));
    ['solid', 'dashed', 'dotted', 'none'].forEach(n => assert(rootLines.some(l => l.startsWith(`  --border-style-${n}:`)), `:root missing --border-style-${n}`));
    const themeText = extractBlock(tw, '@theme inline {').join('\n');
    assert(!/--border-/.test(themeText), '@theme inline must never carry a --border- line');
});

test('fonts: literal stacks in @theme inline, never a var(); no --font-* in :root/.dark', () => {
    const themeLines = extractBlock(tw, '@theme inline {');
    assert(themeLines.includes('  --font-sans: Inter, sans-serif;'));
    assert(themeLines.includes('  --font-serif: ui-serif, serif;'));
    assert(themeLines.includes('  --font-mono: JetBrains Mono, monospace;'));
    assert(!extractBlock(tw, ':root {').some(l => /^\s*--font-(sans|serif|mono):/.test(l)), ':root must not carry --font-*');
    assert(!extractBlock(tw, '.dark {').some(l => /^\s*--font-(sans|serif|mono):/.test(l)), '.dark must not carry --font-*');
});

test('every var(--x) or var(--x, fallback) in the file has a matching --x: declaration', () => {
    [tw, buildTailwindCss(atlassianCtx())].forEach(css => {
        const declared = new Set();
        css.split('\n').forEach(l => { const m = l.match(/^\s*--([a-z0-9_-]+):/); if (m) declared.add(m[1]); });
        const used = css.match(/var\(--([a-z0-9_-]+)/g) || [];
        used.forEach(u => {
            const name = u.replace(/^var\(--/, '');
            assert(declared.has(name), `var(--${name}...) used with no --${name}: declaration in the file`);
        });
    });
});

test('no component-part vars and no @import (foundation/palette/semantic only)', () => {
    assert(!/@import/.test(tw), 'tailwind.css must never @import anything');
    // ctx.components is ignored entirely - none of its var spellings leak in.
    Object.keys(FIXTURE_COMPONENTS).forEach(id => {
        const asVar = `--${id.replace(/\./g, '-')}`;
        assert(!tw.includes(asVar), `component var ${asVar} must never appear in tailwind.css`);
    });
    assert(!/--_/.test(tw), 'no component "state" private var (--_...) may appear');
});

test('semantic space/radius/shadow tokens resolve to a literal length, never a var(); absent without ctx.semanticTokens', () => {
    const base = tailwindCtx();
    const spaceEntry = findScaleEntry('tailwind', 'space', '6');
    const radiusEntry = findScaleEntry('tailwind', 'radius', 'md');
    const shadowEntry = findScaleEntry('tailwind', 'shadow', 'sm');
    const withSemantic = buildTailwindCss({
        ...base,
        semanticTokens: [
            { kind: 'space', name: 'card-padding', ref: 'space.6' },
            { kind: 'radius', name: 'control', ref: 'radius.md' },
            { kind: 'shadow', name: 'raised', ref: 'shadow.sm' }
        ]
    });
    const themeLines = extractBlock(withSemantic, '@theme inline {');
    assert(themeLines.includes(`  --spacing-card-padding: ${spaceEntry.value}; /* space.6 */`));
    assert(themeLines.includes(`  --radius-control: ${radiusEntry.value}; /* radius.md */`));
    assert(themeLines.some(l => l.startsWith('  --shadow-raised: ') && l.endsWith('/* shadow.sm */') && l.includes(shadowEntry.value)));
    assert(!/--spacing-card-padding/.test(tw), 'without ctx.semanticTokens, no semantic token line appears (today\'s system has none)');
    assert(!/--radius-control/.test(tw));
});

test('twThemeVar: null for kinds with no v4 namespace, "_" spelling for fractional steps', () => {
    assert.strictEqual(twThemeVar('border.width.1'), null);
    assert.strictEqual(twThemeVar('type.body'), null);
    assert.strictEqual(twThemeVar('space.0.5'), '--spacing-0_5');
});

console.log(`\n${passed} test group(s) passed${process.exitCode ? ', with failures' : ''}`);
