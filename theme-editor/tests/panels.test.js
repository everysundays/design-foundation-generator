// node tests/panels.test.js
// Loads the palette data, foundation.js, components.js and panels.js into
// one vm context (they are plain browser globals) and checks the sidebar
// panel builders' pure-HTML contract.
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
const g = vm.runInContext('({ panelTypeSetStyle, buildTypePanelHtml })', ctx);

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

// Mirrors scripts.js TYPE_SETS (card 39 moves this to a dynamic store; this
// file loads panels.js alone, so a local fixture stands in for it).
const TYPE_SETS_FIXTURE = [
    { key: 'display',    label: 'Display',    abbr: 'D',  color: '#7c3aed', family: 'sans', weight: '700', size: 2.25,  leading: 2.5,  tracking: '-0.025em' },
    { key: 'heading',    label: 'Heading',    abbr: 'H',  color: '#2563eb', family: 'sans', weight: '600', size: 1.5,   leading: 2,    tracking: '-0.015em' },
    { key: 'subheading', label: 'Subheading', abbr: 'SH', color: '#0891b2', family: 'sans', weight: '500', size: 1.125, leading: 1.75, tracking: '0em' },
    { key: 'body',       label: 'Body',       abbr: 'B',  color: '#16a34a', family: 'sans', weight: '400', size: 1,     leading: 1.5,  tracking: '0em' },
    { key: 'label',      label: 'Label',      abbr: 'L',  color: '#d97706', family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' },
    { key: 'caption',    label: 'Caption',    abbr: 'C',  color: '#db2777', family: 'sans', weight: '400', size: 0.75,  leading: 1,    tracking: '0em' },
    { key: 'code',       label: 'Code',       abbr: 'M',  color: '#475569', family: 'mono', weight: '400', size: 0.875, leading: 1.25, tracking: '0em' }
];
const DISPLAY_SET = TYPE_SETS_FIXTURE[0];

// --- panelTypeSetStyle: bare face gets the pool's generic appended ---------
{
    const style = g.panelTypeSetStyle({ 'font-sans': 'Poppins' }, DISPLAY_SET);
    ok(style === 'font-family: Poppins, sans-serif; font-weight: 700; font-size: 2.25rem; line-height: 2.5rem; letter-spacing: -0.025em;',
        `bare Google face gets a sans-serif fallback: ${style}`);
}
{
    const style = g.panelTypeSetStyle({ 'font-sans': 'system-ui' }, DISPLAY_SET);
    ok(style.startsWith('font-family: system-ui'), `system-ui stays system-ui: ${style}`);
}
{
    // Already-quoted-with-generic value (what the per-set family picker
    // writes) is passed through untouched - no double generic.
    const style = g.panelTypeSetStyle({ 'font-sans': "'Poppins', sans-serif" }, DISPLAY_SET);
    ok(style.startsWith("font-family: 'Poppins', sans-serif;"), `already-comma family untouched: ${style}`);
}
{
    // A mono set with no font-mono var resolves the generic fallback alone -
    // must not double up ("monospace, monospace").
    const style = g.panelTypeSetStyle({}, TYPE_SETS_FIXTURE[6]);
    ok(style.startsWith('font-family: monospace;'), `bare generic fallback is not doubled: ${style}`);
}

// --- buildTypePanelHtml: every set's specimen carries the resolved face ----
{
    const ctxArg = { mode: 'light', vars: { light: { 'font-sans': 'Poppins' } }, typeSets: TYPE_SETS_FIXTURE };
    const html = g.buildTypePanelHtml(ctxArg);
    const specimens = html.match(/<span class="fp-type-specimen"[^>]*>/g) || [];
    ok(specimens.length === 7, `one fp-type-specimen per set: got ${specimens.length}`);
    TYPE_SETS_FIXTURE.forEach((set, i) => {
        const expectFace = set.family === 'sans' ? 'Poppins' : 'monospace';
        ok(specimens[i].includes(`font-family: ${expectFace}`), `${set.key} specimen resolves ${set.family} family (${expectFace}): ${specimens[i]}`);
    });
}

// --- buildTypePanelHtml: remove control (card [41]) -------------------------
// A SIBLING of the assign button (never nested - a <button> inside a <button>
// is invalid HTML and would also assign on click), disabled only when a
// single set remains, plus the inline confirm row when pendingRemoveTypeSet
// names an in-use set.
{
    const ctxArg = { mode: 'light', vars: { light: {} }, typeSets: TYPE_SETS_FIXTURE };
    const html = g.buildTypePanelHtml(ctxArg);
    const removeButtons = html.match(/<button[^>]*data-remove-set="[a-z]+"[^>]*>/g) || [];
    ok(removeButtons.length === 7, `one remove control per set, none disabled with 7 sets: got ${removeButtons.length}`);
    ok(removeButtons.every(b => !b.includes('disabled')), 'no remove control is disabled while more than one set remains');
    // Each assign button is a sibling of, not a parent of, its remove button -
    // its own markup (up to its OWN closing tag) carries no data-remove-set.
    const assignButtons = html.match(/<button type="button" class="fp-type-set"[\s\S]*?<\/button>/g) || [];
    ok(assignButtons.length === 7, `found each set's own assign-button markup: got ${assignButtons.length}`);
    ok(assignButtons.every(b => !b.includes('data-remove-set')), 'the remove control never lands inside the fp-type-set button itself');
}
{
    // A single remaining set: its remove control is disabled, never absent.
    const ctxArg = { mode: 'light', vars: { light: {} }, typeSets: [TYPE_SETS_FIXTURE[3]] };
    const html = g.buildTypePanelHtml(ctxArg);
    ok(/data-remove-set="body"[^>]*disabled/.test(html), 'the last remaining set\'s remove control is disabled');
}
{
    // pendingRemoveTypeSet + typeSetUsageCounts (scripts.js panelCtx) render
    // the inline "N parts use X" confirm row for that one set only.
    const ctxArg = {
        mode: 'light', vars: { light: {} }, typeSets: TYPE_SETS_FIXTURE,
        pendingRemoveTypeSet: 'label', typeSetUsageCounts: { label: 18 }
    };
    const html = g.buildTypePanelHtml(ctxArg);
    ok(html.includes('18 parts use Label'), `confirm row states the count and label: ${/18[^<]*/.exec(html)}`);
    ok((html.match(/data-remove-key="label"/g) || []).length === 1, 'exactly one confirm row, keyed to the pending set');
    ok(/data-remove-key="label"[\s\S]*?<option value="body"/.test(html), 'the target select offers the other sets (Body)');
    ok(!/data-remove-key="label"[\s\S]*?<option value="label"/.test(html), 'the target select never offers the set being removed itself');
    ok(html.includes('data-remove-confirm'), 'confirm row has a Remove button');
    ok(html.includes('data-remove-cancel'), 'confirm row has a Cancel button');
}

// --- index.html: the Google Fonts <link> lives in <head>, inert by default -
{
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const head = html.match(/<head>[\s\S]*?<\/head>/)[0];
    // Being inside <head> (never inside #panelBody, which lives in <body> and
    // is rebuilt wholesale by renderPanel) is what keeps the link alive
    // across every re-render.
    ok(/<link id="google-fonts" rel="stylesheet">/.test(head), 'head carries an inert #google-fonts link');
    ok(!/<link id="google-fonts"[^>]*\shref=/.test(head), '#google-fonts link starts with no href');
}

console.log(`panels.test.js: ${checks} checks passed`);
