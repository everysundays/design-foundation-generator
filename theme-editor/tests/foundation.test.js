// node tests/foundation.test.js
// Loads the palette data, foundation.js and components.js into one vm
// context (they are plain browser globals) and checks the Foundation scales
// layer's contract: built-in scale data per source, user-added custom-scale
// entries (steps beyond a source's fixed scale), and the ref <-> CSS
// custom-property mapping.
//
// components.js is included in the loader (unused by this file's own cases)
// so sibling test groups that need it can be appended here without adding a
// second vm bootstrap.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'components.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
// Script-scoped `const`s are not properties of the context; lift what the
// test needs out of the shared global lexical scope.
const g = vm.runInContext(`({ FOUNDATION, customScaleFor, setCustomScaleFor, emptyCustomScale,
    scaleEntries, refToVar, remEntry, findScaleEntry, parseRef, cssIdent })`, ctx);

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

// --- Radius custom-scale entries ------------------------------------------
// "Add a step to the Foundation Radius scale": a user-typed name/value is
// pushed into the active source's custom slot and appended after the
// source's built-in steps; other sources and other scale kinds are
// untouched.
{
    const source = 'tailwind';
    const baseline = g.FOUNDATION.tailwind.radius;
    ok(JSON.stringify(g.scaleEntries(source, 'radius')) === JSON.stringify(baseline), 'radius starts as just the built-ins');

    const entry = g.remEntry('2.5xl', 1.25);
    g.customScaleFor(source).radius.push(entry);

    const entries = g.scaleEntries(source, 'radius');
    ok(entries.length === baseline.length + 1, 'one step added beyond the built-ins');
    ok(JSON.stringify(entries.slice(0, baseline.length)) === JSON.stringify(baseline), 'built-ins are an unchanged prefix (appended after, never sorted/inserted)');
    const last = entries[entries.length - 1];
    ok(last.name === '2.5xl' && last.value === '1.25rem' && last.rem === 1.25 && last.px === 20, 'added step reads name "2.5xl", value "1.25rem", px 20');

    ok(g.findScaleEntry(source, 'radius', '2.5xl') === last, 'findScaleEntry finds the added step');

    ok(JSON.stringify(g.scaleEntries('atlassian', 'radius')) === JSON.stringify(g.FOUNDATION.atlassian.radius), 'atlassian radius untouched by a tailwind addition (per-source isolation)');

    ok(g.refToVar('radius.2.5xl') === '--radius-2-5xl', "refToVar('radius.2.5xl') === '--radius-2-5xl'");
    ok(JSON.stringify(g.parseRef('radius.2.5xl')) === JSON.stringify({ kind: 'radius', name: '2.5xl' }), 'parseRef round-trips the added ref');

    // Same collision rule addCustomScaleEntry uses: cssIdent-compare the typed
    // name against every existing entry (built-in or custom) of the source.
    ok(entries.some(e => g.cssIdent(e.name) === g.cssIdent('lg')), "'lg' collides with a built-in radius entry, same rule the app uses");
    ok(!entries.some(e => g.cssIdent(e.name) === g.cssIdent('not-a-step')), 'an unrelated name does not collide');

    g.setCustomScaleFor(source, g.emptyCustomScale());
    ok(g.scaleEntries(source, 'radius').length === baseline.length, 'reset back to just the built-ins');
}

console.log(`foundation.test.js: ${checks} checks passed`);
