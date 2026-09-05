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
    SEMANTIC_COLOR_ROLES, DTCG_COLOR_ROLES, SEMANTIC_SCALE_KINDS, defaultSemanticTokens, semanticNames,
    isCssIdentifier, semanticNameError, addSemanticToken, normalizeSemanticTokens,
    resolveSemanticTarget, varCollision, semanticVarCollisionMessage, remapSemanticTokens, semanticVarLines,
    parseRef, refToVar, scaleRef, findScaleEntry, setCustomScaleFor, emptyCustomScale
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

// --- Non-color semantic scale tokens (card 9: "Semantic space tokens") -----
// Parameterised over every kind in SEMANTIC_SCALE_KINDS; space/radius/
// borderWidth/borderStyle are filled in (cards 9-11) - card 12 adds its own
// shadow case object without touching the loop below.
ok(JSON.stringify(g.SEMANTIC_SCALE_KINDS) === JSON.stringify(['space', 'radius', 'borderWidth', 'borderStyle', 'shadow']),
    'SEMANTIC_SCALE_KINDS lists the five non-color scale kinds, space first');

const SCALE_TOKEN_CASES = {
    space: {
        name: 'card-padding',
        stepName: '6',                       // Tailwind space.6 = 1.5rem = 24px
        atlassianStepName: 'space.300',       // the Atlassian entry at the same 24px
        stepCollisionName: '4',               // an existing Tailwind step, verbatim
        crossSourceCollisionName: '100',      // not a Tailwind step; matches Atlassian's "space.100" by var
        crossSourceCollisionStepName: 'space.100'
    },
    // card 10: "Semantic radius tokens". 'radius.100' isn't an Atlassian step
    // (theirs are xsmall/small/medium/large/xlarge/xxlarge/full) - the
    // cross-source collision case uses 'small', matching Atlassian's
    // "radius.small" by var, per the board's correction.
    radius: {
        name: 'control',
        stepName: 'md',                       // Tailwind radius.md = 0.375rem = 6px
        atlassianStepName: 'radius.medium',   // the Atlassian entry at the same 6px
        stepCollisionName: 'lg',              // an existing Tailwind step, verbatim
        crossSourceCollisionName: 'small',    // not a Tailwind step; matches Atlassian's "radius.small" by var
        crossSourceCollisionStepName: 'radius.small'
    },
    // card 11: "Semantic border tokens". Atlassian's borderWidth entries
    // bake their own group name into the step name itself (foundation.js's
    // pxEntry('border.width', 1) etc.) - prefixedVar's "id === prefix" rule
    // collapses that bare step to "--border-width-default", so a token
    // literally named "default" collides with it (the DoD's own example,
    // alongside "outline" for the border.width.outline step).
    borderWidth: {
        name: 'control',
        stepName: '1',                          // Tailwind border.width.1 = 1px
        atlassianStepName: 'border.width',      // the Atlassian entry at the same 1px (the bare, "default" step)
        stepCollisionName: '2',                 // an existing Tailwind step, verbatim
        crossSourceCollisionName: 'default',    // not a Tailwind step; matches Atlassian's bare "border.width" step by var
        crossSourceCollisionStepName: 'border.width'
    },
    // borderStyle: Tailwind and Atlassian ship the EXACT same four step names
    // (solid/dashed/dotted/none - foundation.js's two borderStyle arrays are
    // identical), so there is no Atlassian-ONLY step for a name to collide
    // with by var alone - any such name is already a same-source (Tailwind)
    // collision, caught by stepCollisionName above. crossSourceCollisionName
    // is intentionally omitted; the loop below skips that sub-check when it
    // is undefined.
    borderStyle: {
        name: 'divider',
        stepName: 'dashed',
        atlassianStepName: 'dashed',   // remapRef never touches borderStyle refs ("style keeps its value" - card 11's DoD), and both foundations define "dashed" anyway
        stepCollisionName: 'solid'     // an existing step name, verbatim (both foundations)
    }
    // shadow: { … }  (card 12)
};

Object.entries(SCALE_TOKEN_CASES).forEach(([kind, c]) => {
    const stepRef = g.scaleRef(kind, c.stepName);
    const tokenRef = g.scaleRef(kind, c.name);
    const token = { kind, name: c.name, ref: stepRef };

    // --- resolution: a token's own ref vs the step it targets --------------
    ok(g.resolveSemanticTarget([token], tokenRef) === stepRef, `${kind}: resolveSemanticTarget(token ref) -> its target`);
    ok(g.resolveSemanticTarget([token], stepRef) === null, `${kind}: resolveSemanticTarget(a literal step ref) -> null (token before step, but a step ref is not a token)`);
    ok(g.resolveSemanticTarget([token], g.scaleRef(kind, 'no-such-token')) === null, `${kind}: resolveSemanticTarget(unknown name) -> null`);
    ok(g.resolveSemanticTarget([{ kind: 'color', name: c.name }], `color.${c.name}`) === null, `${kind}: resolveSemanticTarget never matches a color entry`);

    // --- refToVar: the token's var is stable and differs from its target's -
    ok(typeof g.refToVar(tokenRef) === 'string' && g.refToVar(tokenRef), `${kind}: refToVar(token ref) is a non-empty string`);
    ok(g.refToVar(tokenRef) !== g.refToVar(stepRef), `${kind}: token var differs from its target step's var`);
    ok(g.refToVar(tokenRef) === g.refToVar(g.scaleRef(kind, c.name)), `${kind}: refToVar(token ref) is stable across calls`);

    // --- varCollision: every FOUNDATION source's steps + every token --------
    {
        const stepHit = g.varCollision(kind, c.stepCollisionName, []);
        ok(stepHit && stepHit.what === 'step' && stepHit.source === 'tailwind' && stepHit.name === c.stepCollisionName,
            `${kind}: varCollision refuses a name equal to an existing Tailwind step ("${c.stepCollisionName}")`);

        // Omitted for a kind whose foundations ship identical step names
        // (borderStyle - card 11) - there is no Atlassian-ONLY var to
        // collide with, so this sub-check has nothing to assert.
        if (c.crossSourceCollisionName !== undefined) {
            const crossHit = g.varCollision(kind, c.crossSourceCollisionName, []);
            ok(crossHit && crossHit.what === 'step' && crossHit.source === 'atlassian' && crossHit.name === c.crossSourceCollisionStepName,
                `${kind}: varCollision refuses a name equal to an Atlassian-only step ("${c.crossSourceCollisionName}" -> "${c.crossSourceCollisionStepName}"), checked regardless of which source is active`);
        }

        const tokenHit = g.varCollision(kind, c.name, [token]);
        ok(tokenHit && tokenHit.what === 'token' && tokenHit.name === c.name, `${kind}: varCollision refuses a name equal to an existing token`);
        ok(g.varCollision(kind, c.name, [token], 0) === null, `${kind}: excludeIndex skips the token being checked against itself`);

        ok(g.varCollision(kind, 'totally-unused-name-xyz', [token]) === null, `${kind}: varCollision is null for a genuinely free name`);

        ok(typeof g.semanticVarCollisionMessage(c.name, tokenHit) === 'string' && g.semanticVarCollisionMessage(c.name, tokenHit).includes(c.name),
            `${kind}: semanticVarCollisionMessage(token collision) names the token`);
        ok(typeof g.semanticVarCollisionMessage(c.stepCollisionName, stepHit) === 'string' && g.semanticVarCollisionMessage(c.stepCollisionName, stepHit).includes(c.stepCollisionName),
            `${kind}: semanticVarCollisionMessage(step collision) names the candidate`);
        ok(g.semanticVarCollisionMessage(c.name, null) === null, 'semanticVarCollisionMessage(name, null) -> null');

        // Adding a foundation step named like a token (or a custom step
        // that happens to collide) is refused the same way - a custom entry
        // pushed onto Tailwind's scale is caught exactly like a built-in one.
        g.setCustomScaleFor('tailwind', g.emptyCustomScale());
        const custom = g.emptyCustomScale();
        custom[kind].push({ name: 'custom-step-xyz', value: '1rem', rem: 1, px: 16 });
        g.setCustomScaleFor('tailwind', custom);
        const customHit = g.varCollision(kind, 'custom-step-xyz', []);
        ok(customHit && customHit.what === 'step' && customHit.source === 'tailwind' && customHit.name === 'custom-step-xyz',
            `${kind}: varCollision also catches a just-added custom step`);
        g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    }

    // --- addSemanticToken / normalizeSemanticTokens (non-color shape) ------
    {
        eq(g.addSemanticToken([], kind, c.name, stepRef), [token], `${kind}: addSemanticToken appends {kind, name, ref}`);
        eq(g.addSemanticToken([], 'color', 'warning'), [{ kind: 'color', name: 'warning' }], 'addSemanticToken(color) still carries no ref field');

        eq(g.normalizeSemanticTokens([token]), [token], `${kind}: a valid non-color token survives normalize as-is`);
        eq(g.normalizeSemanticTokens([{ kind, name: c.name }]), g.defaultSemanticTokens(), `${kind}: a non-color entry with no ref is dropped (falls back to the defaults when nothing else survives)`);
        eq(g.normalizeSemanticTokens([{ kind, name: c.name, ref: 'not a ref!!' }]), g.defaultSemanticTokens(), `${kind}: a non-color entry with an unparseable ref is dropped`);
        const withBoth = [{ kind: 'color', name: 'primary' }, token];
        eq(g.normalizeSemanticTokens(withBoth), withBoth, `${kind}: a color token and a non-color token coexist through normalize`);
    }

    // --- remapSemanticTokens: a Foundation switch keeps the name, moves ref
    {
        const toAtlassian = g.remapSemanticTokens([token], 'tailwind', 'atlassian');
        const expectedAtlassianRef = g.scaleRef(kind, c.atlassianStepName);
        eq(toAtlassian, [{ kind, name: c.name, ref: expectedAtlassianRef }], `${kind}: remapSemanticTokens tailwind -> atlassian re-targets the nearest step, keeps the name`);
        const backToTailwind = g.remapSemanticTokens(toAtlassian, 'atlassian', 'tailwind');
        eq(backToTailwind, [token], `${kind}: remapSemanticTokens atlassian -> tailwind returns to the original target`);
        const withColor = [{ kind: 'color', name: 'primary' }];
        eq(g.remapSemanticTokens(withColor, 'tailwind', 'atlassian'), withColor, `${kind}: remapSemanticTokens leaves color tokens untouched`);
    }

    // --- semanticVarLines: the design-system CSS's own definition ----------
    {
        ok(g.semanticVarLines([], kind) === '', `${kind}: semanticVarLines([]) is ''`);
        ok(g.semanticVarLines([{ kind: 'color', name: 'x' }], kind) === '', `${kind}: semanticVarLines ignores a different kind`);
        const expectedLine = `  ${g.refToVar(tokenRef)}: var(${g.refToVar(stepRef)});`;
        ok(g.semanticVarLines([token], kind) === expectedLine, `${kind}: semanticVarLines emits "${expectedLine}"`);
    }
});

console.log(`semantic.test.js: ${checks} checks passed`);
