// node tests/semantic.test.js
// Loads the palette data, foundation.js, dtcg.js and semantic.js into one vm
// context (they are plain browser globals) and checks semantic.js's
// contract: the default token list, add/validate/normalize.
//
// dtcg.js is loaded too (though semantic.js never calls into it) so this
// file can assert SEMANTIC_COLOR_ROLES and DTCG_COLOR_ROLES name the same 33
// roles as sets - the two lists are kept in different orders on purpose
// (Summary-tab UI order vs. tokens.json export order) so a set comparison,
// not a deep-equal, is the right guard against drift.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'dtcg.js', 'semantic.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
// Script-scoped `const`s/`function`s are not properties of the context; lift
// what the tests need out of the shared global lexical scope.
const g = vm.runInContext(`({
    SEMANTIC_COLOR_ROLES, DTCG_COLOR_ROLES, defaultSemanticTokens, semanticNames,
    isCssIdentifier, semanticNameError, addSemanticToken, normalizeSemanticTokens
})`, ctx);

// vm-context arrays/objects carry that realm's own Array/Object prototypes,
// which assert.deepStrictEqual treats as a mismatch even when the structure
// is identical (see tests/dtcg.test.js's identical `norm` helper) - round-
// tripping through JSON strips that and compares structure only.
const norm = o => JSON.parse(JSON.stringify(o));

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }
function eq(actual, expected, msg) { checks++; assert.deepStrictEqual(norm(actual), norm(expected), msg); }

// --- SEMANTIC_COLOR_ROLES / defaultSemanticTokens ---------------------------

ok(g.SEMANTIC_COLOR_ROLES.length === 33, `SEMANTIC_COLOR_ROLES has 33 entries (got ${g.SEMANTIC_COLOR_ROLES.length})`);
eq(new Set(g.SEMANTIC_COLOR_ROLES), new Set(g.DTCG_COLOR_ROLES), 'SEMANTIC_COLOR_ROLES and dtcg.js DTCG_COLOR_ROLES name the same 33 roles (as sets - order differs by design)');

{
    const defaults = g.defaultSemanticTokens();
    ok(defaults.length === 33, 'defaultSemanticTokens() returns 33 entries');
    ok(defaults.every(t => t.kind === 'color'), 'every default entry is kind "color"');
    eq(defaults.map(t => t.name), g.SEMANTIC_COLOR_ROLES, 'defaultSemanticTokens() names match SEMANTIC_COLOR_ROLES, in order');
    // Fresh array/objects each call - callers may safely mutate their copy.
    defaults.push({ kind: 'color', name: 'mutated' });
    ok(g.defaultSemanticTokens().length === 33, 'defaultSemanticTokens() returns a fresh array each call');
}

// --- semanticNames -----------------------------------------------------------

{
    const list = [{ kind: 'color', name: 'primary' }, { kind: 'space', name: 'card-padding' }, { kind: 'color', name: 'warning' }];
    eq(g.semanticNames(list, 'color'), ['primary', 'warning'], 'semanticNames filters by kind, in list order');
    eq(g.semanticNames(list, 'space'), ['card-padding'], 'semanticNames filters a different kind');
    eq(g.semanticNames(undefined, 'color'), [], 'semanticNames(undefined, …) is []');
    eq(g.semanticNames(null, 'color'), [], 'semanticNames(null, …) is []');
}

// --- isCssIdentifier / semanticNameError ------------------------------------

['warning', 'brand-2', 'a', 'x2', 'a-b-c'].forEach(name => {
    ok(g.isCssIdentifier(name), `"${name}" is a valid identifier`);
});
// The stricter rule from the board contract: lowercase only, must start with
// a letter - no leading digit, hyphen or underscore, no uppercase, no dots,
// no spaces (a looser rule would let a name like "-x" or "_x" through, which
// would fail this same check everywhere else the codebase assumes a plain
// lowercase-kebab identifier).
['', '1warning', 'warn ing', 'Warning', '_x', '-x', 'brand.500', 'a_b'].forEach(name => {
    ok(!g.isCssIdentifier(name), `"${name}" is not a valid identifier`);
});

{
    const roles = g.defaultSemanticTokens();
    const withUser = g.addSemanticToken(roles, 'color', 'info');
    const prefixes = ['palette-', 'space-', 'radius-', 'border-width-', 'border-style-', 'shadow-', 'font-', 'type-', 'tracking-', 'button-'];

    ok(g.semanticNameError('', roles, prefixes) === 'Enter a name.', 'empty name refused');
    ok(typeof g.semanticNameError('1warning', roles, prefixes) === 'string', '"1warning" (leading digit) refused');
    ok(typeof g.semanticNameError('warn ing', roles, prefixes) === 'string', '"warn ing" (space) refused');
    ok(typeof g.semanticNameError('_x', roles, prefixes) === 'string', '"_x" refused (not a valid identifier under the board\'s stricter rule)');
    ok(typeof g.semanticNameError('-x', roles, prefixes) === 'string', '"-x" refused (not a valid identifier under the board\'s stricter rule)');
    ok(typeof g.semanticNameError('primary', roles, prefixes) === 'string', 'an existing built-in role name refused');
    ok(typeof g.semanticNameError('info', withUser, prefixes) === 'string', 'an existing user token name refused');
    ['space-4', 'font-sans', 'type-body-size', 'palette-red-500', 'tracking-normal', 'radius-lg', 'border-width-1', 'border-style-solid', 'shadow-sm'].forEach(name => {
        ok(typeof g.semanticNameError(name, roles, prefixes) === 'string', `reserved-prefix name "${name}" refused`);
    });
    ok(typeof g.semanticNameError('button-primary-bg', roles, prefixes) === 'string', 'an element-prefixed name refused when its prefix is in reservedPrefixes');
    // Without the element prefix supplied, the same name is a plain valid
    // identifier that doesn't collide with anything in `roles` - refusing it
    // is entirely reservedPrefixes' job, not semanticNameError's own rule.
    ok(g.semanticNameError('button-primary-bg', roles, []) === null, 'the same name is accepted when its prefix is not in reservedPrefixes');

    ok(g.semanticNameError('warning', roles, prefixes) === null, '"warning" accepted');
    ok(g.semanticNameError('brand-2', roles, prefixes) === null, '"brand-2" accepted');
    ok(g.semanticNameError('  warning  ', roles, prefixes) === null, 'surrounding whitespace is trimmed before validating');
}

// --- addSemanticToken --------------------------------------------------------

{
    const roles = g.defaultSemanticTokens();
    const next = g.addSemanticToken(roles, 'color', 'warning');
    ok(next.length === 34, 'addSemanticToken appends one entry');
    eq(next[next.length - 1], { kind: 'color', name: 'warning' }, 'the appended entry has the given kind/name');
    ok(roles.length === 33, 'addSemanticToken does not mutate the list it was given');
    eq(next.slice(0, 33), roles, 'every original entry is preserved, in order, before the new one');
    eq(g.addSemanticToken(next, 'color', '  spacey  '), [...next, { kind: 'color', name: 'spacey' }], 'the stored name is trimmed');
}

// --- normalizeSemanticTokens -------------------------------------------------

{
    const defaults = g.defaultSemanticTokens();
    eq(g.normalizeSemanticTokens(undefined), defaults, 'normalizeSemanticTokens(undefined) -> the 33 defaults');
    eq(g.normalizeSemanticTokens(null), defaults, 'normalizeSemanticTokens(null) -> the 33 defaults');
    eq(g.normalizeSemanticTokens({}), defaults, 'normalizeSemanticTokens({}) (not an array) -> the 33 defaults');
    eq(g.normalizeSemanticTokens('nope'), defaults, 'normalizeSemanticTokens(a string) -> the 33 defaults');
    eq(g.normalizeSemanticTokens([{ bad: true }]), defaults, 'normalizeSemanticTokens([{bad}]) (no valid entries survive) -> the 33 defaults');
    eq(g.normalizeSemanticTokens([]), defaults, 'normalizeSemanticTokens([]) -> the 33 defaults (an empty array reads the same as "no list")');

    const withExtra = [...defaults, { kind: 'color', name: 'warning' }];
    eq(g.normalizeSemanticTokens(withExtra), withExtra, 'a valid full list (defaults + one user token) is returned as-is');

    const withDupe = [...defaults, { kind: 'color', name: 'warning' }, { kind: 'color', name: 'warning' }];
    eq(g.normalizeSemanticTokens(withDupe), withExtra, 'a duplicate kind+name entry is deduped, keeping the first occurrence');

    const mixed = [{ kind: 'color', name: 'primary' }, { bad: true }, { kind: 'color', name: 'Not-Valid' }, { kind: 'color', name: '' }, { kind: 'color', name: 'warning' }];
    eq(g.normalizeSemanticTokens(mixed), [{ kind: 'color', name: 'primary' }, { kind: 'color', name: 'warning' }], 'invalid entries (bad shape, non-identifier name, blank name) are dropped, valid ones kept');

    // Trimmed on the way in, same as addSemanticToken.
    eq(g.normalizeSemanticTokens([{ kind: 'color', name: '  warning  ' }]), [{ kind: 'color', name: 'warning' }], 'a name is trimmed during normalization');
}

console.log(`semantic.test.js: ${checks} checks passed`);
