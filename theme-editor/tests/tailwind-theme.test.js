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

test('every declaration line in :root/.dark/@theme inline parses as "--name: value;" (optional --line-height suffix / trailing comment)', () => {
    const DECL = /^  --[a-z][a-z0-9_-]*(--line-height)?: [^;]+;( \/\*.*\*\/)?$/;
    [tw, buildTailwindCss(atlassianCtx())].forEach(css => {
        [':root {', '.dark {', '@theme inline {'].forEach(opener => {
            extractBlock(css, opener).forEach(line => assert(DECL.test(line), `malformed declaration line: ${JSON.stringify(line)}`));
        });
    });
});

test('twThemeVar: null for kinds with no v4 namespace, "_" spelling for fractional steps', () => {
    assert.strictEqual(twThemeVar('border.width.1'), null);
    assert.strictEqual(twThemeVar('type.body'), null);
    assert.strictEqual(twThemeVar('space.0.5'), '--spacing-0_5');
});

// --- card 46: verified against a real `npx @tailwindcss/cli@4.3.3` build ---
//
// Recipe (re-run after any tailwind.js change): a scratch dir outside the
// repo holding tailwind.css (this system's Export > tailwind.css tab,
// copied verbatim - here, Feynman: Tailwind foundation, custom Space step
// "18" = 4.5rem), input.css:
//   @import "tailwindcss" source(none);
//   @import "./tailwind.css";
//   @source "./index.html";
// (`source(none)` turns OFF Tailwind's automatic whole-directory content
// scan, so only the explicit @source line is scanned - without it, rerunning
// the build in the SAME dir once out.css/check.js already exist there feeds
// their own text back in as "content" and silently adds incidental
// class-shaped utilities, e.g. a bare `.block`/`.p-0` picked up from the
// literal words inside Preflight's reset CSS and check.js. Confirmed fixed:
// rebuilding the recorded dir three times in place with source(none) yields
// byte-identical out.css every time, 13/13 check.js assertions still pass.)
// and an index.html with a real button/card built from the utilities that
// name Feynman's component-token refs (bg-primary text-primary-foreground
// px-4 py-2 rounded-lg shadow-xs font-sans text-sm leading-5 font-medium for
// the button; border border-border bg-card p-6 gap-4 shadow-sm rounded-lg
// plus text-lg/leading-7, text-xs/leading-4, text-base/leading-6 for the
// card's title/description/body) and probes for p-4, p-0.5, p-18, p-13
// (must be absent), rounded-lg, shadow-md, font-sans, text-xl, leading-6,
// dark:bg-secondary. Build: `npx @tailwindcss/cli@4.3.3 -i input.css -o
// out.css` (tailwindcss@4.3.3 installed alongside it - the CLI needs
// "tailwindcss" resolvable via node_modules, @tailwindcss/cli alone is not
// enough). Full input.css/index.html/tailwind.css and the getComputedStyle
// diff are on the card.
//
// Outcome: no wrong values - every discriminating utility (bg-primary,
// font-sans, p-18, p-0.5, the absence of p-13, the .dark block, shadow-md)
// built with Feynman's exact exported values, and getComputedStyle on the
// scratch button/card matched the theme-editor preview's own gallery
// button/card exactly (background-color, color, padding, gap, border-width/
// style/color, border-radius, font-family/size/line-height/weight) in both
// light and dark mode. One naming fact confirmed empirically rather than
// merely asserted by our own code: Tailwind 4.3.3's real key resolver does
// accept the "_" spelling (--spacing-0_5) for p-0.5 - the fractional-step
// probe below is that pin. One presentation nuance, not an exporter defect:
// Tailwind's compiled `.shadow-md`/`.shadow-sm`/`.shadow-xs` utilities wrap
// our literal box-shadow value behind `var(--tw-shadow-color, <ours>)` and
// prepend four fixed, fully-transparent zero-offset placeholder layers (for
// its ring/inset-shadow stacking system) - box-shadow computed-style
// equality holds once those inert layers are stripped; nothing to change in
// tailwind.js.
test('card 46 regression pins: DoD-named utilities leading-6 and text-xl--line-height, fractional p-0.5 key, and a custom step spelled without a dot', () => {
    const themeLines = extractBlock(tw, '@theme inline {');
    assert(themeLines.includes('  --leading-6: 1.5rem;'), 'leading-6 (DoD line 1) must be pinned verbatim');
    assert(themeLines.includes('  --text-xl--line-height: 1.75rem;'), 'text-xl (DoD line 1) leading pairing must be pinned verbatim');
    assert.strictEqual(twThemeVar('space.0.5'), '--spacing-0_5', 'DoD line 2: the real Tailwind 4.3.3 CLI resolves p-0.5 through exactly this "_" spelling, confirmed by the scratch build');

    setCustomScaleFor('tailwind', { ...emptyCustomScale(), space: [remEntry('18', 4.5)] });
    const withCustom = buildTailwindCss(tailwindCtx());
    const customLines = extractBlock(withCustom, '@theme inline {');
    assert(customLines.includes('  --spacing-18: 4.5rem;'), 'a custom step named without a dot (Feynman\'s real "18") must key as --spacing-18, not --spacing-18-0 or similar');
    setCustomScaleFor('tailwind', emptyCustomScale());
});

console.log(`\n${passed} test group(s) passed${process.exitCode ? ', with failures' : ''}`);
