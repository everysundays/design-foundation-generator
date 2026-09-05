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
// semantic.js appended (card 13): buildTypePanelHtml/buildSummaryPanelHtml's
// type-token rows resolve through resolveSemanticTypeSet - loaded last, same
// relative order as index.html (components, panels, …, semantic).
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'components.js', 'panels.js', 'semantic.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
// Script-scoped `const`s/`function`s are not properties of the context; lift
// what the test needs out of the shared global lexical scope.
const g = vm.runInContext('({ buildColorsPanelHtml, panelTip, buildScalePanelHtml, buildSummaryPanelHtml, buildTypePanelHtml })', ctx);

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

// --- semantic scale tokens (card 9: buildScalePanelHtml token row) ---------
{
    const token = { kind: 'space', name: 'card-padding', ref: 'space.6' };
    const withToken = { source: 'tailwind', marks: {}, semanticTokens: [token] };
    const html = g.buildScalePanelHtml('space', withToken, { allowAdd: true });
    ok(html.includes('data-ref="space.card-padding"'), 'the token gets its own assignable data-ref');
    const tokenIdx = html.indexOf('data-ref="space.card-padding"');
    const firstStepIdx = html.indexOf('data-ref="space.0"');
    ok(firstStepIdx !== -1 && tokenIdx !== -1 && tokenIdx < firstStepIdx, 'the token row renders above the first foundation-step row');
    ok(html.includes('fp-entries-tokens'), 'token rows sit in their own wrapper');

    const noToken = { source: 'tailwind', marks: {}, semanticTokens: [] };
    const plainHtml = g.buildScalePanelHtml('space', noToken, { allowAdd: true });
    ok(!plainHtml.includes('fp-entries-tokens') && !plainHtml.includes('data-ref="space.card-padding"'), 'no token row when semanticTokens has none of this kind');

    // A token's own count badge is independent of the step it targets.
    const marks = { 'space.card-padding': { count: 2, ids: ['card.padding', 'button.gap'], roles: [], used: true, active: false } };
    const markedHtml = g.buildScalePanelHtml('space', { source: 'tailwind', marks, semanticTokens: [token] }, { allowAdd: true });
    const tokenBtn = markedHtml.slice(markedHtml.indexOf('data-ref="space.card-padding"') - 200, markedHtml.indexOf('data-ref="space.card-padding"') + 400);
    ok(tokenBtn.includes('data-count="2"'), 'the token row carries its own count badge, from marks[token ref]');
}

// --- semantic scale tokens (card 9: buildSummaryPanelHtml Space section) ---
{
    const html = g.buildSummaryPanelHtml({ source: 'tailwind', marks: {}, semanticTokens: [] });
    ok(html.includes('data-add-semantic-kind="space"'), 'the Space section\'s add-row is reachable even with zero tokens');
    ok(html.includes('data-add-semantic-confirm'), 'the add-row has a confirm control');

    const withToken = g.buildSummaryPanelHtml({ source: 'tailwind', marks: {}, semanticTokens: [{ kind: 'space', name: 'card-padding', ref: 'space.6' }] });
    ok(withToken.includes('data-semantic-target="space.card-padding"'), 'an existing token gets a step-picker keyed by its own ref');
}

// --- semantic type tokens (card 13: buildTypePanelHtml token row + buildSummaryPanelHtml Type section) ---
{
    const typeSets = [
        { key: 'display', label: 'Display', abbr: 'D', color: '#7c3aed', family: 'sans', weight: '700', size: 2.25, leading: 2.5, tracking: '-0.025em' },
        { key: 'body', label: 'Body', abbr: 'B', color: '#16a34a', family: 'sans', weight: '400', size: 1, leading: 1.5, tracking: '0em' },
        { key: 'label', label: 'Label', abbr: 'L', color: '#d97706', family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' }
    ];
    const token = { kind: 'type', name: 'nav', ref: 'type.label' };
    const baseTypeCtx = { source: 'tailwind', mode: 'light', vars: { light: {} }, marks: {}, typeSets, semanticTokens: [token], typeSetSummary: () => 'Sans→Inter · sm / 5 · 500' };

    const html = g.buildTypePanelHtml(baseTypeCtx);
    ok(html.includes('data-ref="type.nav"'), 'the token gets its own assignable data-ref on the Type tab');
    const tokenIdx = html.indexOf('data-ref="type.nav"');
    const displayIdx = html.indexOf('data-ref="type.display"');
    ok(tokenIdx !== -1 && displayIdx !== -1 && tokenIdx < displayIdx, 'the token row renders above the type set cards');
    ok(html.includes('fp-type-sets-tokens'), 'token rows sit in their own wrapper');

    const noToken = g.buildTypePanelHtml({ ...baseTypeCtx, semanticTokens: [] });
    ok(!noToken.includes('fp-type-sets-tokens') && !noToken.includes('data-ref="type.nav"'), 'no token row when semanticTokens has no type token');

    const summaryHtml = g.buildSummaryPanelHtml(baseTypeCtx);
    ok(summaryHtml.includes('data-add-semantic-kind="type"'), "the Type section's add-row is reachable even with zero tokens");
    ok(summaryHtml.includes('data-semantic-target="type.nav"'), 'an existing token gets a set-picker keyed by its own ref');
}

console.log(`panels.test.js: ${checks} checks passed`);
