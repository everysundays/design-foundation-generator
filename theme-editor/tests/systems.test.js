// node tests/systems.test.js  (run from theme-editor/, or anywhere: paths are absolute)
//
// Loads the palette data, foundation.js and systems.js as plain browser
// scripts in one vm context, then checks normalizeSystem: a full saved
// system round-trips losslessly and without mutation, and every field
// missing from an older/hand-edited save gets the documented default.
//
// tests/fixtures/feynman-v3.json is a frozen copy of a real browser-saved
// system (systems/Feynman.json at the time this test was written) - it is
// never compared against the live file, which changes on every Save to repo.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'systems.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});
const { normalizeSystem, foundationOf, emptyCustomScale, listSystems, parseRepoIndex } = context;

const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/feynman-v3.json'), 'utf8'));
// normalizeSystem runs inside the vm context, so object/array literals it
// builds belong to that realm - deepStrictEqual treats them as distinct from
// an outer plain-literal of the same shape ("same structure but not
// reference-equal"). clone() strips the realm via a JSON round-trip (as
// tests/dtcg.test.js's `norm` does); eq() applies it to both sides.
const clone = o => JSON.parse(JSON.stringify(o));
function eq(actual, expected, message) { assert.deepStrictEqual(clone(actual), clone(expected), message); }

// A copy of `fixture` with one path deleted, e.g. stripped(['customScale', 'space']).
function stripped(pathParts) {
    const c = clone(fixture);
    let obj = c;
    for (let i = 0; i < pathParts.length - 1; i++) obj = obj[pathParts[i]];
    delete obj[pathParts[pathParts.length - 1]];
    return c;
}

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`ok   ${name}`); }
    catch (err) { console.log(`FAIL ${name}\n     ${err.message}`); process.exitCode = 1; }
}

// --- full fixture: lossless, idempotent, never mutated ---------------------

test('full fixture round-trips losslessly and is not mutated', () => {
    const before = clone(fixture);
    const result = normalizeSystem(fixture);
    eq(fixture, before, 'normalizeSystem mutated its argument');
    eq(result, fixture, 'normalized result lost or added fields');

    assert.notStrictEqual(result, fixture);
    assert.notStrictEqual(result.vars, fixture.vars);
    assert.notStrictEqual(result.vars.light, fixture.vars.light);
    assert.notStrictEqual(result.tokenLinks, fixture.tokenLinks);
    assert.notStrictEqual(result.components, fixture.components);
    assert.notStrictEqual(result.customScale, fixture.customScale);
    assert.notStrictEqual(result.palette.families, fixture.palette.families);

    eq(Object.keys(result).sort(), ['components', 'customScale', 'palette', 'source', 'tokenLinks', 'vars']);
    assert.strictEqual(Object.keys(result.vars.light).length, 73);
    assert.strictEqual(Object.keys(result.tokenLinks.light).length, 33);
    assert.strictEqual(Object.keys(result.components).length, 431);
    assert.strictEqual(result.customScale.space.length, 1);
    assert.strictEqual(result.customScale.space[0].name, '18');
});

// --- source ------------------------------------------------------------

test('source defaults to tailwind when missing or unknown, kept when a real foundation', () => {
    assert.strictEqual(normalizeSystem(stripped(['source'])).source, 'tailwind');
    const nope = clone(fixture); nope.source = 'nope';
    assert.strictEqual(normalizeSystem(nope).source, 'tailwind');
    const atl = clone(fixture); atl.source = 'atlassian';
    assert.strictEqual(normalizeSystem(atl).source, 'atlassian');
});

// --- palette -------------------------------------------------------------

test('palette defaults to every family of the resolved source', () => {
    const allTailwindFamilies = [...foundationOf('tailwind').color.families()];
    assert.strictEqual(allTailwindFamilies.length, 26);

    eq(normalizeSystem(stripped(['palette'])).palette, { families: allTailwindFamilies });
    const emptyPalette = clone(fixture); emptyPalette.palette = {};
    eq(normalizeSystem(emptyPalette).palette, { families: allTailwindFamilies });

    const subset = clone(fixture); subset.palette = { families: ['red', 'blue'] };
    eq(normalizeSystem(subset).palette, { families: ['red', 'blue'] });

    // A default resolved under a defaulted (unknown) source, not the sample's own.
    const noSourceNoPalette = stripped(['palette']); delete noSourceNoPalette.source;
    eq(normalizeSystem(noSourceNoPalette).palette, { families: allTailwindFamilies });
});

// --- tokenLinks ------------------------------------------------------------

test('tokenLinks defaults each mode to {} independently', () => {
    eq(normalizeSystem(stripped(['tokenLinks'])).tokenLinks, { light: {}, dark: {} });

    const lightOnly = clone(fixture); delete lightOnly.tokenLinks.dark;
    const result = normalizeSystem(lightOnly);
    eq(result.tokenLinks.dark, {});
    assert.strictEqual(Object.keys(result.tokenLinks.light).length, 33);
});

// --- components --------------------------------------------------------

test('components defaults to {} (seeding is the caller\'s job, not normalizeSystem\'s)', () => {
    eq(normalizeSystem(stripped(['components'])).components, {});
    const wrongType = clone(fixture); wrongType.components = null;
    eq(normalizeSystem(wrongType).components, {});
});

// --- customScale -------------------------------------------------------

test('customScale defaults to emptyCustomScale(), per-kind', () => {
    eq(normalizeSystem(stripped(['customScale'])).customScale, emptyCustomScale());

    const noSpace = stripped(['customScale', 'space']);
    const result = normalizeSystem(noSpace);
    eq(result.customScale.space, []);
    ['radius', 'borderWidth', 'borderStyle', 'shadow'].forEach(kind => {
        assert.ok(Array.isArray(result.customScale[kind]), `customScale.${kind} should stay an array`);
    });

    const extraKind = clone(fixture); extraKind.customScale.bogus = ['nope'];
    eq(Object.keys(normalizeSystem(extraKind).customScale).sort(), ['borderStyle', 'borderWidth', 'radius', 'shadow', 'space']);
});

// --- vars / whole-entry validity -----------------------------------------

test('an entry without vars normalizes to null and is dropped', () => {
    assert.strictEqual(normalizeSystem(stripped(['vars'])), null);
    assert.strictEqual(normalizeSystem({ source: 'tailwind' }), null); // the DoD's "NoVars" localStorage entry
    const nullVars = clone(fixture); nullVars.vars = null;
    assert.strictEqual(normalizeSystem(nullVars), null);
    const stringVars = clone(fixture); stringVars.vars = 'x';
    assert.strictEqual(normalizeSystem(stringVars), null);
});

test('non-object or empty top-level entries normalize to null', () => {
    [null, undefined, 42, 'str', [], true].forEach(bad => {
        assert.strictEqual(normalizeSystem(bad), null, `normalizeSystem(${JSON.stringify(bad)}) should be null`);
    });
});

test('vars with only one mode defaults the other to {} (the DoD\'s "Bare" localStorage entry)', () => {
    const bare = { vars: { light: { primary: '#1d4ed8' } } };
    const result = normalizeSystem(bare);
    eq(result.vars.light, { primary: '#1d4ed8' });
    eq(result.vars.dark, {});
    assert.strictEqual(result.source, 'tailwind');
    eq(result.tokenLinks, { light: {}, dark: {} });
    eq(result.components, {});
    eq(result.customScale, emptyCustomScale());
    assert.strictEqual(result.palette.families.length, 26);
});

// --- listSystems -----------------------------------------------------------
// The Design system picker's row list: repo > browser > preset, same-name
// entries collapsed to whichever group wins. Vars aren't part of the
// contract here (that needs flattenVars, a scripts.js concern) - just
// name/group/deletable, in display order.

test('listSystems orders repo > browser > preset and collapses same-name entries', () => {
    const repo = { Feynman: { vars: { light: {}, dark: {} } } };
    const browser = {
        systems: { Feynman: { vars: { light: {}, dark: {} } }, Mine: { vars: { light: {}, dark: {} } } },
        legacy: { Old: { light: {}, dark: {} } }
    };
    const presets = [{ title: 'Default' }, { title: 'Mine' }];

    const rows = listSystems(repo, browser, presets);
    eq(rows.map(r => r.name), ['Feynman', 'Mine', 'Old', 'Default']);
    eq(rows.map(r => r.group), ['repo', 'browser', 'browser', 'preset']);
    eq(rows.map(r => r.deletable), [false, true, true, false]);
});

test('an empty repo reproduces the pre-repo ordering: browser (systems then legacy), then preset', () => {
    const browser = { systems: { Mine: { vars: {} } }, legacy: { Old: { light: {}, dark: {} } } };
    const presets = [{ title: 'Default' }];
    const rows = listSystems({}, browser, presets);
    eq(rows.map(r => r.name), ['Mine', 'Old', 'Default']);
    eq(rows.map(r => r.group), ['browser', 'browser', 'preset']);
});

test('a preset is named by `name` when it has no `title`, and nameless entries are skipped', () => {
    const rows = listSystems({}, { systems: {}, legacy: {} }, [{ name: 'legacy-name' }, {}, { title: 'Default' }]);
    eq(rows.map(r => r.name), ['legacy-name', 'Default']);
});

test('listSystems tolerates missing repo/browser/presets instead of throwing', () => {
    eq(listSystems(undefined, undefined, undefined), []);
    eq(listSystems(null, { systems: null, legacy: null }, null), []);
});

// --- parseRepoIndex ----------------------------------------------------

test('parseRepoIndex accepts an array of non-empty names (including empty), rejects everything else', () => {
    eq(parseRepoIndex(['Feynman', 'Other']), ['Feynman', 'Other']);
    eq(parseRepoIndex([]), []);
    [null, undefined, 'Feynman', { Feynman: true }, 42, [1, 2], ['Feynman', ''], ['Feynman', null]].forEach(bad => {
        assert.strictEqual(parseRepoIndex(bad), null, `parseRepoIndex(${JSON.stringify(bad)}) should be null`);
    });
});

console.log(`\n${passed} test group(s) passed${process.exitCode ? ', with failures' : ''}`);
