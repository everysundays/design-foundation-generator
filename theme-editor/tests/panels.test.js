// node tests/panels.test.js
// Loads the palette data, foundation.js, components.js and panels.js into
// one vm context (they are plain browser globals) and checks the sidebar
// panel builders' contract: refs, marks and the Colors-tab semantic row
// (ctx.semantic - see scripts.js panelCtx/computeMarks, card 7).
//
// Union loader: card 17 (cluster C, selection strip) shares this file and
// needs elementSpec/COMPONENT_STATE_LABELS from components.js; this card's
// own builder only needs foundation.js. Whichever of 7/17 lands first
// creates the file with this five-file loader; the other appends.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'components.js', 'panels.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
// Script-scoped `const`s/`function`s are not properties of the context; lift
// what the test needs out of the shared global lexical scope.
const g = vm.runInContext('({ buildColorsPanelHtml, panelTip })', ctx);

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

// The <button ...>...</button> markup for one data-ref, found by scanning
// outward from the attribute (robust to tip text of any length), or null.
function swatchHtmlFor(html, ref) {
    const marker = `data-ref="${ref}"`;
    const at = html.indexOf(marker);
    if (at === -1) return null;
    const start = html.lastIndexOf('<button', at);
    const end = html.indexOf('</button>', at) + '</button>'.length;
    return html.slice(start, end);
}

// Mirrors scripts.js ALL_COLOR_GROUPS order (COLOR_GROUPS then
// ELEMENT_GROUPS) - LINKABLE_COLOR_KEYS is 33 entries, shadow-color
// included, NOT 34 (verified against scripts.js; see critic-notes).
const ROLE_ORDER = [
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'accent', 'accent-foreground',
    'background', 'foreground', 'muted', 'muted-foreground', 'destructive', 'destructive-foreground',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
    'card', 'card-foreground', 'popover', 'popover-foreground', 'border', 'input', 'ring',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring', 'shadow-color'
];
ok(ROLE_ORDER.length === 33, 'role order is 33 entries (32 shadcn roles + shadow-color), not 34');

function semanticFixture() {
    return ROLE_ORDER.map(role => ({ role, ref: `color.${role}`, hex: '#123456', tip: `color.${role} → neutral (#123456)` }));
}

function baseCtx(overrides) {
    return Object.assign({ source: 'tailwind', marks: {}, semantic: semanticFixture() }, overrides || {});
}

// --- semantic row: one data-ref per ctx.semantic entry, in order -----------
{
    const html = g.buildColorsPanelHtml(baseCtx());
    const refs = [...html.matchAll(/data-ref="(color\.[a-z0-9-]+)"/g)].map(m => m[1]);
    ok(refs.length === ROLE_ORDER.length, `exactly one color.* swatch per ctx.semantic entry (got ${refs.length})`);
    ok(JSON.stringify(refs) === JSON.stringify(ROLE_ORDER.map(r => `color.${r}`)), 'semantic swatches render in ctx.semantic order');
    ROLE_ORDER.forEach(role => ok(swatchHtmlFor(html, `color.${role}`), `swatch for color.${role} exists`));
}

// --- marks: count/active/used land on the exact ref (not the resolved step)
{
    const mark = { count: 3, ids: ['button.primary.bg', 'card.bg', 'badge.default.bg'], roles: [], used: true, active: true };
    const html = g.buildColorsPanelHtml(baseCtx({ marks: { 'color.primary': mark } }));
    const btn = swatchHtmlFor(html, 'color.primary');
    ok(btn.includes('data-count="3"'), 'color.primary badge = mark.count (3), not roles');
    ok(btn.includes('data-active'), 'color.primary carries the active ring');
    ok(btn.includes('data-used'), 'color.primary carries the used dot');
    ok(btn.includes('used by: button.primary.bg, card.bg, badge.default.bg'), 'tooltip lists the ids using it');
    const tip = btn.match(/data-tip="([^"]*)"/);
    ok(tip && tip[1].startsWith('color.primary'), 'tip starts with the describeRef chain (ctx.semantic entry\'s tip)');
    // an entry with no mark at all renders unmarked, not throwing
    const plain = swatchHtmlFor(html, 'color.secondary');
    ok(plain.includes('data-count="0"') && !plain.includes('data-active') && !plain.includes('data-used'), 'unmarked role has no ring/dot and a zero badge');
}

// --- palette badge: linked roles + direct palette.* assignments, summed ----
{
    const mark = { count: 1, ids: ['badge.outline.border-color'], roles: ['destructive', 'ring'], used: false, active: false };
    const html = g.buildColorsPanelHtml(baseCtx({ marks: { 'palette.blue-600': mark } }));
    const btn = swatchHtmlFor(html, 'palette.blue-600');
    ok(btn, 'palette swatches still emit data-ref="palette.<name>"');
    ok(btn.includes('data-count="3"'), 'palette badge = direct count (1) + linked roles (2)');
    ok(btn.includes('roles: destructive, ring'), 'palette tooltip keeps its "roles: …" line');
}

// --- layout: semantic row precedes the palette ramps -----------------------
{
    const html = g.buildColorsPanelHtml(baseCtx());
    const semanticIdx = html.indexOf('fp-ramp-semantic');
    const specialsIdx = html.indexOf('fp-ramp-specials');
    ok(semanticIdx !== -1 && specialsIdx !== -1 && semanticIdx < specialsIdx, 'semantic row precedes the special/palette ramps');
}

// --- empty/missing ctx.semantic: no semantic row, no throw ------------------
{
    const html1 = g.buildColorsPanelHtml(baseCtx({ semantic: [] }));
    ok(!html1.includes('fp-ramp-semantic'), 'empty ctx.semantic renders no semantic row');
    const noSemantic = baseCtx();
    delete noSemantic.semantic;
    const html2 = g.buildColorsPanelHtml(noSemantic);
    ok(!html2.includes('fp-ramp-semantic'), 'missing ctx.semantic renders no semantic row');
}

// --- panelTip: a prebuilt describeRef chain as `name`, '' as `value` -------
{
    const mark = { count: 0, ids: [], roles: [], used: false, active: false };
    ok(g.panelTip('color.primary → neutral-900 (#171717)', '', mark) === 'color.primary → neutral-900 (#171717)', 'panelTip(name, "", mark) emits name alone as the first line');
}

console.log(`panels.test.js: ${checks} checks passed`);
