// node tests/panels.test.js
// Loads the palette data, foundation.js, components.js and panels.js into
// one vm context (plain browser globals) and checks buildSelectionStripHtml -
// the variant/state picker renderPanel prepends to every tab's own HTML.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'components.js', 'panels.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
// Script-scoped `const`s are not properties of the context; lift what the
// test needs out of the shared global lexical scope.
const g = vm.runInContext('({ ELEMENTS, elementSpec, buildSelectionStripHtml })', ctx);

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

function allIds(html, attr) {
    return [...html.matchAll(new RegExp(`data-${attr}="([^"]*)"`, 'g'))].map(m => m[1]);
}
function pressedIds(html, attr) {
    return [...html.matchAll(new RegExp(`data-${attr}="([^"]*)" aria-pressed="true"`, 'g'))].map(m => m[1]);
}
function pressedCount(html) {
    return (html.match(/aria-pressed="true"/g) || []).length;
}

// --- button, outline + hover: one row of 6 variant picks, one row of 5 state picks ---
{
    const html = g.buildSelectionStripHtml({ selection: { element: 'button', variant: 'outline', part: 'bg', state: 'hover' } });
    ok(allIds(html, 'variant').length === 6, `button: 6 variant picks (got ${allIds(html, 'variant').length})`);
    ok(allIds(html, 'state').length === 5, `button: 5 state picks (got ${allIds(html, 'state').length})`);
    ok(JSON.stringify(allIds(html, 'variant')) === JSON.stringify(['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link']), 'button: variant picks in spec order');
    ok(JSON.stringify(allIds(html, 'state')) === JSON.stringify(['default', 'hover', 'focus', 'active', 'disabled']), 'button: state picks in spec order');
    ok(pressedCount(html) === 2, `button: one pressed pick per row (got ${pressedCount(html)})`);
    ok(JSON.stringify(pressedIds(html, 'variant')) === JSON.stringify(['outline']), 'button: outline pressed');
    ok(JSON.stringify(pressedIds(html, 'state')) === JSON.stringify(['hover']), 'button: hover pressed');
}

// --- card: no variant row, a single default state pick, pressed ---
{
    const html = g.buildSelectionStripHtml({ selection: { element: 'card', variant: null, part: 'bg', state: 'default' } });
    ok(!html.includes('data-variant='), 'card: no variant picks');
    ok(JSON.stringify(allIds(html, 'state')) === JSON.stringify(['default']), 'card: a single default state pick');
    ok(pressedCount(html) === 1, `card: exactly one pressed pick (got ${pressedCount(html)})`);
    ok(JSON.stringify(pressedIds(html, 'state')) === JSON.stringify(['default']), 'card: default pressed');
}

// --- every element, first variant / default state: full row + exactly-pressed counts ---
g.ELEMENTS.forEach(el => {
    const selection = { element: el.key, variant: el.variants ? el.variants[0] : null, part: el.parts[0].key, state: 'default' };
    const html = g.buildSelectionStripHtml({ selection });
    const expectedPicks = (el.variants ? el.variants.length : 0) + el.states.length;
    const gotPicks = allIds(html, 'variant').length + allIds(html, 'state').length;
    ok(gotPicks === expectedPicks, `${el.key}: ${expectedPicks} picks (got ${gotPicks})`);
    const expectedPressed = el.variants ? 2 : 1;
    ok(pressedCount(html) === expectedPressed, `${el.key}: ${expectedPressed} pressed picks (got ${pressedCount(html)})`);
});

// --- no selection / no element / unknown element -> prints nothing ---
ok(g.buildSelectionStripHtml({ selection: null }) === '', 'null selection prints nothing');
ok(g.buildSelectionStripHtml(undefined) === '', 'undefined ctx prints nothing');
ok(g.buildSelectionStripHtml({ selection: { element: 'not-a-real-element', variant: null, part: 'x', state: 'default' } }) === '', 'unknown element prints nothing');

// --- bare: no headings, no section chrome ---
{
    const html = g.buildSelectionStripHtml({ selection: { element: 'button', variant: 'primary', part: 'bg', state: 'default' } });
    ok(!html.includes('fp-panel-head'), 'strip has no fp-panel-head');
    ok(!html.includes('fp-section-title'), 'strip has no fp-section-title');
    ok(!/<h[1-6]/.test(html), 'strip has no heading tags');
}

// --- an invalid state falls back to default, mirroring selectElement ---
{
    const html = g.buildSelectionStripHtml({ selection: { element: 'button', variant: 'primary', part: 'bg', state: 'not-a-state' } });
    ok(JSON.stringify(pressedIds(html, 'state')) === JSON.stringify(['default']), 'invalid state falls back to default pressed');
}

console.log(`panels.test.js: ${checks} checks passed`);
