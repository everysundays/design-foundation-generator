// node tests/fonts.test.js
// Loads foundation.js, fonts-catalogue.js and fonts.js into one vm context
// (plain browser globals) and checks the Google Fonts helpers: catalogue
// lookup/search, face resolution, and the @import URL/line the export and
// the preview <link> both build from (weights intersected with what each
// family actually ships).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['foundation.js', 'fonts-catalogue.js', 'fonts.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
const g = vm.runInContext('({ firstFamily, resolveTypeFace, googleFamilies, googleFontsHref, fontImportCss, catalogueEntry, searchCatalogue, familyCssValue })', ctx);

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

// --- catalogueEntry: category + weights straight from GOOGLE_FONTS_CATALOGUE
{
    const inter = g.catalogueEntry('Inter');
    ok(inter.category === 'sans-serif', `Inter's category is sans-serif: ${inter.category}`);
    ok(inter.weights.includes(100) && inter.weights.includes(900), `Inter's weights span 100-900: ${inter.weights}`);
    // JSON round-trip: the vm realm's Array isn't `instanceof` this realm's
    // Array, which deepStrictEqual treats as unequal even with identical
    // contents (same pattern as tests/dtcg.test.js / tests/typesets.test.js).
    assert.deepStrictEqual(JSON.parse(JSON.stringify(g.catalogueEntry('Space Grotesk').weights)), [300, 400, 500, 600, 700],
        'Space Grotesk ships exactly 300/400/500/600/700');
    ok(g.catalogueEntry('inter').category === 'sans-serif', 'catalogueEntry is case-insensitive');
    ok(g.catalogueEntry('system-ui') === null, 'system-ui is not a catalogue family');
    ok(g.catalogueEntry('My Face') === null, 'an unknown name is not a catalogue family');
}

// --- searchCatalogue: substring, prefix-first, capped, alphabetical --------
// JSON round-trip right away (see the weights comment above) so every array
// method used below runs on a plain host-realm array.
{
    const sp = JSON.parse(JSON.stringify(g.searchCatalogue('sp'))).map(r => r.family);
    assert.deepStrictEqual(sp.slice(0, 4), ['Space Grotesk', 'Space Mono', 'Special Elite', 'Special Gothic'],
        `"sp" narrows to Space Grotesk, Space Mono, Special Elite, Special Gothic ...: ${sp.slice(0, 4)}`);
    ok(sp.includes('Spline Sans'), '"sp" also matches Spline Sans further down the list');
    ok(!sp.includes('Inter'), '"sp" excludes Inter');
    const spUpper = JSON.parse(JSON.stringify(g.searchCatalogue('SP'))).map(r => r.family);
    assert.deepStrictEqual(spUpper.slice(0, 3), sp.slice(0, 3), 'search is case-insensitive');
    ok(g.searchCatalogue('nonexistentfamilyname').length === 0, 'no matches -> empty array, not every family');
    ok(g.searchCatalogue('', 10).length === 10, 'an empty query still returns up to the cap, for the picker\'s default view');
    ok(g.searchCatalogue('inter', 5).length <= 5, 'results are capped at `limit`');
}

// --- familyCssValue: quoted + the pool's generic for a catalogue pick, the
// raw text verbatim for anything the catalogue doesn't know -----------------
{
    ok(g.familyCssValue('Nunito', 'sans') === "'Nunito', sans-serif", `familyCssValue('Nunito', 'sans'): ${g.familyCssValue('Nunito', 'sans')}`);
    ok(g.familyCssValue('Fira Code', 'mono') === "'Fira Code', monospace", 'mono pool gets the monospace generic');
    ok(g.familyCssValue('My Face, serif', 'serif') === 'My Face, serif', 'a non-catalogue value is returned verbatim, not re-wrapped');
}

// --- Weight intersection: never a weight the family lacks, ascending,
// a font token nobody uses yet still gets its default weight ---------------
{
    // font-sans alone (no set follows it) still contributes its default 400.
    const soloSets = [{ key: 'solo', family: 'sans', weight: '400' }];
    const varsSpaceGrotesk = {
        'font-sans': 'Space Grotesk, sans-serif', 'font-serif': 'ui-serif, serif', 'font-mono': 'ui-monospace, monospace',
        'type-solo-family': 'var(--font-sans)', 'type-solo-weight': '800'
    };
    const soloHref = g.googleFontsHref(varsSpaceGrotesk, soloSets);
    ok(soloHref.includes('family=Space+Grotesk:wght@400'), `Space Grotesk requested at 400 (its own token default): ${soloHref}`);
    ok(!soloHref.includes('800'), `800 (unsupported - Space Grotesk tops out at 700) never appears in the URL: ${soloHref}`);

    // A second set at a weight the family DOES have is kept alongside it.
    const twoSets = [{ key: 'solo', family: 'sans', weight: '400' }, { key: 'other', family: 'sans', weight: '600' }];
    const varsTwo = { ...varsSpaceGrotesk, 'type-other-family': 'var(--font-sans)', 'type-other-weight': '600' };
    const twoHref = g.googleFontsHref(varsTwo, twoSets);
    ok(twoHref.includes('family=Space+Grotesk:wght@400;600'), `600 (a weight Space Grotesk has) is kept, ascending after 400: ${twoHref}`);

    // A face requested at weights the catalogue lists NONE of still loads -
    // bare `family=` with no :wght@ at all, rather than being dropped.
    const varsNoMatch = {
        'font-sans': 'Inter, sans-serif', 'font-serif': 'ui-serif, serif', 'font-mono': 'ui-monospace, monospace',
        'type-code-family': "'Space Mono', monospace", 'type-code-weight': '900'
    };
    const noMatchHref = g.googleFontsHref(varsNoMatch, [{ key: 'code', family: 'mono', weight: '400' }]);
    ok(/family=Space\+Mono(&|$)/.test(noMatchHref), `Space Mono (weights 400/700) requested at 900 falls back to a bare family, not dropped: ${noMatchHref}`);
    ok(!noMatchHref.includes('900'), `the unsupported weight 900 itself never appears in the URL: ${noMatchHref}`);
}

console.log(`fonts.test.js: ${checks} checks passed`);
