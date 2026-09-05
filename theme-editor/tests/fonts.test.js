// node tests/fonts.test.js
// Loads foundation.js and fonts.js into one vm context (plain browser
// globals) and checks the Google Fonts helpers: face resolution and the
// @import URL/line the export and the preview <link> both build from.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['foundation.js', 'fonts.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
const g = vm.runInContext('({ firstFamily, resolveTypeFace, googleFamilies, googleFontsHref, fontImportCss })', ctx);

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

// Mirrors scripts.js TYPE_SETS ([39] moves this to a dynamic store; this
// file loads fonts.js alone, so a local fixture stands in for it).
const TYPE_SETS = [
    { key: 'display',    family: 'sans', weight: '700', size: 2.25,  leading: 2.5,  tracking: '-0.025em' },
    { key: 'heading',    family: 'sans', weight: '600', size: 1.5,   leading: 2,    tracking: '-0.015em' },
    { key: 'subheading', family: 'sans', weight: '500', size: 1.125, leading: 1.75, tracking: '0em' },
    { key: 'body',       family: 'sans', weight: '400', size: 1,     leading: 1.5,  tracking: '0em' },
    { key: 'label',      family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' },
    { key: 'caption',    family: 'sans', weight: '400', size: 0.75,  leading: 1,    tracking: '0em' },
    { key: 'code',       family: 'mono', weight: '400', size: 0.875, leading: 1.25, tracking: '0em' }
];

function familyVars(overrides) {
    const vars = {};
    TYPE_SETS.forEach(set => { vars[`type-${set.key}-family`] = `var(--font-${set.family})`; });
    return { ...vars, ...overrides };
}

// --- firstFamily -----------------------------------------------------------
{
    ok(g.firstFamily("'Source Serif 4', serif") === 'Source Serif 4', 'strips a quoted first family');
    ok(g.firstFamily('Inter, sans-serif') === 'Inter', 'takes the first comma-separated family');
    ok(g.firstFamily(undefined) === '', 'undefined -> empty string');
}

// --- resolveTypeFace: everything is Inter via font-sans ---------------------
const varsInter = familyVars({
    'font-sans': 'Inter, sans-serif',
    'font-serif': 'ui-serif, serif',
    'font-mono': 'ui-monospace, monospace'
});
{
    ok(g.resolveTypeFace(varsInter, 'display') === 'Inter', 'display set follows font-sans to Inter');
    ok(g.resolveTypeFace(varsInter, 'code') === 'ui-monospace', 'code set follows font-mono to ui-monospace');
}

// --- system faces only: no catalogue face anywhere -> no @import -----------
const varsSystem = familyVars({
    'font-sans': 'system-ui',
    'font-serif': 'Georgia, serif',
    'font-mono': 'ui-monospace, monospace'
});
{
    ok(g.googleFontsHref(varsSystem, TYPE_SETS) === '', 'system-ui/Georgia/ui-monospace -> no href');
    ok(g.fontImportCss(varsSystem, TYPE_SETS) === '', 'system-ui/Georgia/ui-monospace -> no @import');
}

// --- fontImportCss shape for a system that does use a Google face ----------
{
    const css = g.fontImportCss(varsInter, TYPE_SETS);
    ok(css.startsWith('@import url("https://fonts.googleapis.com/css2?family=Inter'), `starts with the @import statement: ${css}`);
    ok(/;\n\n$/.test(css), `ends with ";" and a blank line: ${JSON.stringify(css)}`);
}

// --- distinct families, each listed once, alphabetical, no raw spaces ------
// font-sans (+ six sans-family sets) -> Inter; font-serif (no set points at
// it) -> Playfair Display; the code set is pinned straight to Fira Code
// instead of following font-mono - also covers "a pinned face resolves to
// itself" (no var(--font-*) indirection to follow).
const varsMany = familyVars({
    'font-sans': 'Inter, sans-serif',
    'font-serif': "'Playfair Display', serif",
    'font-mono': 'ui-monospace, monospace',
    'type-code-family': "'Fira Code', monospace"
});
{
    ok(g.resolveTypeFace(varsMany, 'code') === 'Fira Code', 'a pinned face resolves to itself');
    const href = g.googleFontsHref(varsMany, TYPE_SETS);
    ok(!href.includes(' '), `no raw space in the URL: ${href}`);
    ok(href.includes('display=swap'), 'href requests font-display: swap');
    const families = (href.match(/family=[^&]+/g) || []).map(p => p.replace('family=', '').split(':')[0]);
    assert.deepStrictEqual(families, ['Fira+Code', 'Inter', 'Playfair+Display'],
        `Inter listed once although font-sans and six sets all resolve to it: ${href}`);
}

// --- light+dark union: a face picked in the other mode still gets an @import
{
    const dark = familyVars({ 'font-sans': 'Roboto, sans-serif', 'font-serif': 'ui-serif, serif', 'font-mono': 'ui-monospace, monospace' });
    const href = g.googleFontsHref([varsInter, dark], TYPE_SETS);
    ok(href.includes('family=Inter'), `union includes the light-mode face: ${href}`);
    ok(href.includes('family=Roboto'), `union includes the dark-mode face: ${href}`);
}

console.log(`fonts.test.js: ${checks} checks passed`);
