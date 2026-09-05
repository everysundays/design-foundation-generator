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
    semanticTypeFallbackKey, resolveTypeSetForRef, resolveSemanticTypeSet, typeTokenNameError, semanticTypeAliasLines,
    isTokenRenamable, builtinTokenName, renameToken,
    parseRef, refToVar, scaleRef, findScaleEntry, setCustomScaleFor, emptyCustomScale, buildTokensJson, parseTokensJson
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
    // builtin: null (explicit, not merely absent) - card 14's rename needs
    // this to tell "a fresh user token that happens to be named like a
    // built-in role" apart from an actual built-in (see addSemanticToken's
    // own comment and normalizeSemanticTokens' backfill rule below).
    eq(next[next.length - 1], { kind: 'color', name: 'warning', builtin: null }, 'the appended entry has the given kind/name and an explicit builtin: null');
    ok(roles.length === 33, 'addSemanticToken does not mutate the list it was given');
    eq(next.slice(0, 33), roles, 'every original entry is preserved, in order, before the new one');
    eq(g.addSemanticToken(next, 'color', '  spacey  '), [...next, { kind: 'color', name: 'spacey', builtin: null }], 'the stored name is trimmed');
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

    // "primary" carries no `builtin` field here (a pre-card-14 shape) - see
    // the backfill test below for why the output still gets one.
    const mixed = [{ kind: 'color', name: 'primary' }, { bad: true }, { kind: 'color', name: 'Not-Valid' }, { kind: 'color', name: '' }, { kind: 'color', name: 'warning' }];
    eq(g.normalizeSemanticTokens(mixed), [{ kind: 'color', name: 'primary', builtin: 'primary' }, { kind: 'color', name: 'warning' }], 'invalid entries (bad shape, non-identifier name, blank name) are dropped, valid ones kept');

    // Trimmed on the way in, same as addSemanticToken.
    eq(g.normalizeSemanticTokens([{ kind: 'color', name: '  warning  ' }]), [{ kind: 'color', name: 'warning' }], 'a name is trimmed during normalization');

    // --- builtin backfill (card 14): every save from before this field
    // existed names a color entry after its built-in role verbatim (renaming
    // didn't exist yet), so a missing `builtin` is safely inferred from the
    // name; a name that isn't one of the 33 roles (a genuine user token)
    // gets no builtin at all, exactly as addSemanticToken produces today.
    eq(g.normalizeSemanticTokens([{ kind: 'color', name: 'primary' }]), [{ kind: 'color', name: 'primary', builtin: 'primary' }], 'a legacy color entry named after a built-in role is backfilled with that builtin');
    eq(g.normalizeSemanticTokens([{ kind: 'color', name: 'warning' }]), [{ kind: 'color', name: 'warning' }], 'a legacy color entry NOT named after a built-in role gets no builtin');
    // An explicit `builtin` (a string, or null) is always kept verbatim,
    // never overridden by the name-match heuristic - this is what lets a
    // name freed up by an earlier rename be reused by a genuinely new token
    // without being mistaken for the original built-in.
    eq(g.normalizeSemanticTokens([{ kind: 'color', name: 'primary', builtin: null }]), [{ kind: 'color', name: 'primary', builtin: null }], 'an explicit builtin: null is respected even when the name matches a built-in role');
    eq(g.normalizeSemanticTokens([{ kind: 'color', name: 'canvas', builtin: 'background' }]), [{ kind: 'color', name: 'canvas', builtin: 'background' }], 'an explicit builtin string survives normalize as-is, whatever the current name is');
}

// --- Non-color semantic scale tokens (card 9: "Semantic space tokens") -----
// Parameterised over every kind in SEMANTIC_SCALE_KINDS; card 12 (shadow)
// fills in the last of the five (space/radius/borderWidth/borderStyle/
// shadow, cards 9-12) and adds one optional case field, `backStepName` -
// shadow remaps by INDEX POSITION (foundation.js remapRef), not nearest-rem
// (shadow steps carry no rem), so quantizing Tailwind's 8 steps down to
// Atlassian's 4 and back is lossy and lands on a different step than it
// started; every other kind's round trip is exact and omits the field
// (falling back to `stepName`, i.e. unchanged from before this card).
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
    },
    // card 12: "Semantic shadow tokens". The DoD's own two named var-collision
    // examples - refToVar('shadow.<name>') equalling the var of the Tailwind
    // "md" step or the Atlassian "elevation.shadow.raised" step - are used
    // verbatim as stepCollisionName/crossSourceCollisionName below; the first
    // of those ("raised") is also the DoD's example name for the token
    // ITSELF, which is self-contradictory (a token literally named "raised"
    // would be refused by this exact check, since it is checked against every
    // FOUNDATION source, not just the active one) - the board's correction
    // (critic-notes.md, cluster B) is "floating" for the actual add-token
    // example, kept here as `name`. remapRef maps shadow by INDEX POSITION
    // (Tailwind ships 8 steps, Atlassian 4): "md" (index 4 of 8) rounds to
    // Atlassian's index 2 ("elevation.shadow.overflow"), and mapping THAT
    // back rounds to Tailwind's index 5 ("lg"), not back to "md" - the round
    // trip is genuinely lossy, unlike every other kind above.
    shadow: {
        name: 'floating',
        stepName: 'md',
        atlassianStepName: 'elevation.shadow.overflow',
        backStepName: 'lg',
        stepCollisionName: 'md',                // the DoD's own first example: an existing Tailwind step, verbatim
        crossSourceCollisionName: 'raised',     // the DoD's own second example; not a Tailwind step, matches Atlassian's "elevation.shadow.raised" by var
        crossSourceCollisionStepName: 'elevation.shadow.raised'
    }
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
        eq(g.addSemanticToken([], 'color', 'warning'), [{ kind: 'color', name: 'warning', builtin: null }], 'addSemanticToken(color) still carries no ref field (builtin: null instead)');

        eq(g.normalizeSemanticTokens([token]), [token], `${kind}: a valid non-color token survives normalize as-is`);
        eq(g.normalizeSemanticTokens([{ kind, name: c.name }]), g.defaultSemanticTokens(), `${kind}: a non-color entry with no ref is dropped (falls back to the defaults when nothing else survives)`);
        eq(g.normalizeSemanticTokens([{ kind, name: c.name, ref: 'not a ref!!' }]), g.defaultSemanticTokens(), `${kind}: a non-color entry with an unparseable ref is dropped`);
        // "primary" carries no `builtin` here - normalize backfills it (see
        // the dedicated backfill cases above), which is why the expectation
        // isn't `withBoth` itself.
        const withBoth = [{ kind: 'color', name: 'primary' }, token];
        eq(g.normalizeSemanticTokens(withBoth), [{ kind: 'color', name: 'primary', builtin: 'primary' }, token], `${kind}: a color token and a non-color token coexist through normalize`);
    }

    // --- remapSemanticTokens: a Foundation switch keeps the name, moves ref
    {
        const toAtlassian = g.remapSemanticTokens([token], 'tailwind', 'atlassian');
        const expectedAtlassianRef = g.scaleRef(kind, c.atlassianStepName);
        eq(toAtlassian, [{ kind, name: c.name, ref: expectedAtlassianRef }], `${kind}: remapSemanticTokens tailwind -> atlassian re-targets the nearest step, keeps the name`);
        const backToTailwind = g.remapSemanticTokens(toAtlassian, 'atlassian', 'tailwind');
        // `backStepName` (shadow, card 12 only): an index-position remap over
        // unequal-length scales is lossy, so going there and back can land on
        // a different step than the original (see the case comment above);
        // every other kind's round trip is exact and omits the field, so this
        // falls back to `stepName` and the assertion is unchanged from before.
        const expectedBackRef = g.scaleRef(kind, c.backStepName || c.stepName);
        eq(backToTailwind, [{ kind, name: c.name, ref: expectedBackRef }], `${kind}: remapSemanticTokens atlassian -> tailwind returns to the expected target`);
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

// --- Type: a token targets a type SET, not a scale entry (card 13) --------
// TYPE_SETS itself lives in scripts.js (not loaded here) - a small fixture
// mirroring its real shape (only key/label are read by anything below).
{
    const typeSets = [
        { key: 'display', label: 'Display' },
        { key: 'body', label: 'Body' },
        { key: 'label', label: 'Label' },
        { key: 'caption', label: 'Caption' }
    ];
    const token = { kind: 'type', name: 'nav', ref: 'type.label' };

    // --- resolution: a token's own ref vs the set it targets ----------------
    ok(g.resolveSemanticTarget([token], 'type.nav') === 'type.label', 'resolveSemanticTarget(token ref) -> its target');
    ok(g.resolveSemanticTarget([token], 'type.label') === null, 'resolveSemanticTarget(a literal set ref) -> null (token before step, but a set ref is not a token)');
    ok(g.resolveSemanticTarget([token], 'type.no-such-token') === null, 'resolveSemanticTarget(unknown name) -> null');

    ok(g.refToVar('type.nav') === '--type-nav', 'refToVar(token ref) uses the same --type-<name> shape as a set');
    ok(g.refToVar('type.nav') !== g.refToVar('type.label'), "token var differs from its target set's var");
    ok(g.scaleRef('type', 'nav') === 'type.nav', "scaleRef('type', name) builds the same ref shape as every other kind (KIND_PREFIX.type)");

    // --- semanticTypeFallbackKey / resolveTypeSetForRef ---------------------
    ok(g.semanticTypeFallbackKey(typeSets) === 'body', 'semanticTypeFallbackKey is "body" when Body exists');
    const noBody = typeSets.filter(s => s.key !== 'body');
    ok(g.semanticTypeFallbackKey(noBody) === 'display', 'semanticTypeFallbackKey falls back to the first set when Body is missing');
    ok(g.semanticTypeFallbackKey([]) === null, 'semanticTypeFallbackKey([]) -> null');

    eq(g.resolveTypeSetForRef('type.label', typeSets), { key: 'label', label: 'Label' }, 'resolveTypeSetForRef finds the named set');
    eq(g.resolveTypeSetForRef('type.does-not-exist', typeSets), { key: 'body', label: 'Body' }, 'resolveTypeSetForRef falls back to Body when the named set is gone');
    ok(g.resolveTypeSetForRef('type.label', []) === null, 'resolveTypeSetForRef(ref, []) -> null (nothing to fall back to)');

    // --- resolveSemanticTypeSet: token-before-step, fallback-aware ---------
    eq(g.resolveSemanticTypeSet([token], 'type.nav', typeSets), { key: 'label', label: 'Label' }, 'resolveSemanticTypeSet(token ref) -> the set it targets');
    const dangling = { kind: 'type', name: 'nav', ref: 'type.does-not-exist' };
    eq(g.resolveSemanticTypeSet([dangling], 'type.nav', typeSets), { key: 'body', label: 'Body' }, "resolveSemanticTypeSet falls back to Body when the token's own target set is gone - never null/undefined");
    ok(g.resolveSemanticTypeSet([token], 'type.label', typeSets) === null, 'resolveSemanticTypeSet(a literal set ref, not a token) -> null - caller keeps its own direct lookup');

    // --- typeTokenNameError: the usual rules + a type-set-key collision -----
    ok(g.typeTokenNameError('nav-link', [token], typeSets) === null, '"nav-link" accepted');
    ok(typeof g.typeTokenNameError('', [token], typeSets) === 'string', 'empty name refused');
    ok(typeof g.typeTokenNameError('1bad', [token], typeSets) === 'string', 'an invalid identifier refused');
    ok(typeof g.typeTokenNameError('nav', [token], typeSets) === 'string', 'an existing token name refused');
    ['label', 'Label', 'body', 'display', 'caption'].forEach(name => {
        ok(typeof g.typeTokenNameError(name, [token], typeSets) === 'string', `a type-set key ("${name}") is refused, built-in or any case`);
    });

    // --- semanticTypeAliasLines: the five --type-<token>-<field> lines -----
    ok(g.semanticTypeAliasLines([], typeSets) === '', "semanticTypeAliasLines([]) is ''");
    ok(g.semanticTypeAliasLines([{ kind: 'color', name: 'x' }], typeSets) === '', 'semanticTypeAliasLines ignores a different kind');
    const lines = g.semanticTypeAliasLines([token], typeSets).split('\n');
    ok(lines.length === 5, 'semanticTypeAliasLines emits exactly 5 lines');
    ['family', 'weight', 'size', 'leading', 'tracking'].forEach((field, i) => {
        ok(lines[i] === `  --type-nav-${field}: var(--type-label-${field});`, `line ${i} aliases ${field} to the target set ("${lines[i]}")`);
    });
    // A token whose set no longer exists still emits 5 well-formed lines,
    // aliased to the fallback (Body) - never a dangling var(--type-…) with
    // no definition anywhere.
    const danglingLines = g.semanticTypeAliasLines([dangling], typeSets).split('\n');
    ok(danglingLines.length === 5 && danglingLines.every(l => l.includes('var(--type-body-')),
        'a token whose set is missing aliases to the fallback (Body), never an undefined var');

    // --- remapSemanticTokens: a Foundation switch never touches a type ref -
    // (TYPE_SETS is foundation-independent; foundation.js remapRef already
    // returns kind "type" refs unchanged - this confirms it holds for a
    // token's own ref field too, going through remapSemanticTokens.)
    eq(g.remapSemanticTokens([token], 'tailwind', 'atlassian'), [token], "remapSemanticTokens leaves a type token's ref unchanged tailwind -> atlassian");
    eq(g.remapSemanticTokens([token], 'atlassian', 'tailwind'), [token], "remapSemanticTokens leaves a type token's ref unchanged atlassian -> tailwind");

    // --- normalizeSemanticTokens: the type kind survives like any other ----
    eq(g.normalizeSemanticTokens([token]), [token], 'a valid type token survives normalize as-is');
    eq(g.normalizeSemanticTokens([{ kind: 'type', name: 'nav' }]), g.defaultSemanticTokens(), 'a type entry with no ref is dropped (falls back to the defaults)');
    eq(g.normalizeSemanticTokens([{ kind: 'type', name: 'nav', ref: 'not a ref!!' }]), g.defaultSemanticTokens(), 'a type entry with an unparseable ref is dropped');
}

// --- Rename a semantic token (card 14) --------------------------------------

// --- isTokenRenamable / builtinTokenName ------------------------------------
{
    ok(g.isTokenRenamable({ kind: 'color', name: 'accent' }) === true, 'isTokenRenamable allows an ordinary built-in color role');
    ok(g.isTokenRenamable({ kind: 'color', name: 'shadow-color' }) === false, 'isTokenRenamable refuses shadow-color');
    ok(g.isTokenRenamable({ kind: 'space', name: 'shadow-color' }) === true, 'isTokenRenamable only special-cases the color kind - a coincidentally-named non-color token is unaffected');

    const defaults = g.defaultSemanticTokens();
    ok(g.builtinTokenName(defaults, 'background') === 'background', 'builtinTokenName: unrenamed - the role name itself');
    const renamedBg = defaults.map(t => (t.builtin === 'background' ? { ...t, name: 'canvas' } : t));
    ok(g.builtinTokenName(renamedBg, 'background') === 'canvas', 'builtinTokenName: finds whichever token now carries builtin === the role, wherever a rename moved it');
    ok(g.builtinTokenName([], 'background') === 'background', 'builtinTokenName falls back to the role name itself when nothing claims it (never dangles)');
}

// --- renameToken: pure, rewrites the token list + vars/tokenLinks (color) +
// every matching component ref, in one step, leaving nothing behind. The
// fixture also carries an INJECTED space token (never added through
// addSemanticScaleToken) to prove the same path renames a token of any kind.
{
    const spaceToken = { kind: 'space', name: 'card-padding', ref: 'space.6' };
    const baseTokens = [...g.defaultSemanticTokens(), spaceToken];
    const system = {
        semanticTokens: baseTokens,
        vars: {
            light: { accent: '#f5f5f5', 'accent-foreground': '#171717', primary: '#111111' },
            dark: { accent: '#262626', 'accent-foreground': '#fafafa', primary: '#eeeeee' }
        },
        tokenLinks: {
            light: {
                accent: { source: 'tailwind', name: 'neutral-100', hex: '#f5f5f5' },
                'accent-foreground': { source: 'tailwind', name: 'neutral-900', hex: '#171717' }
            },
            dark: {
                accent: { source: 'tailwind', name: 'neutral-800', hex: '#262626' },
                'accent-foreground': { source: 'tailwind', name: 'neutral-50', hex: '#fafafa' }
            }
        },
        // A mix of a seeded state override (the button outline/ghost hover
        // background - see components.js ACCENT_HOVER), a ref to a sibling
        // role that must NOT move, a ref to the injected space token, and a
        // literal foundation-step ref that must never move either.
        components: {
            'button.outline.bg.hover': 'color.accent',
            'button.ghost.bg.hover': 'color.accent',
            'badge.default.text.color': 'color.accent-foreground',
            'card.padding': 'space.card-padding',
            'card.gap': 'space.4'
        }
    };

    const renamed = g.renameToken(system, 'color', 'accent', 'highlight');
    ok(renamed.semanticTokens.some(t => t.kind === 'color' && t.name === 'highlight' && t.builtin === 'accent'),
        'the "accent" entry is renamed to "highlight", keeping its builtin identity');
    ok(!renamed.semanticTokens.some(t => t.kind === 'color' && t.name === 'accent'), 'no entry is still named "accent"');
    ok(renamed.semanticTokens.some(t => t.kind === 'color' && t.name === 'accent-foreground'),
        '"accent-foreground" is untouched - exact-match rename, never a prefix rewrite');

    eq(renamed.vars.light, { highlight: '#f5f5f5', 'accent-foreground': '#171717', primary: '#111111' },
        'light vars: the value at "accent" moves to "highlight"; other keys untouched');
    eq(renamed.vars.dark, { highlight: '#262626', 'accent-foreground': '#fafafa', primary: '#eeeeee' },
        'dark vars move too, in the SAME call - one step covers both modes');
    eq(renamed.tokenLinks.light.highlight, { source: 'tailwind', name: 'neutral-100', hex: '#f5f5f5' }, 'the light tokenLinks entry moves with the name');
    ok(!('accent' in renamed.tokenLinks.light), 'no leftover "accent" tokenLinks entry (light) - leaves nothing behind');
    eq(renamed.tokenLinks.dark.highlight, { source: 'tailwind', name: 'neutral-800', hex: '#262626' }, 'the dark tokenLinks entry moves too');
    ok(!('accent' in renamed.tokenLinks.dark), 'no leftover "accent" tokenLinks entry (dark)');

    eq(renamed.components['button.outline.bg.hover'], 'color.highlight', 'a seeded state override (button outline.hover bg) pointing at color.accent now points at color.highlight');
    eq(renamed.components['button.ghost.bg.hover'], 'color.highlight', 'every component ref naming the old role moves, not just the first');
    eq(renamed.components['badge.default.text.color'], 'color.accent-foreground', 'a ref to "accent-foreground" is untouched - exact match, not a prefix');
    eq(renamed.components['card.padding'], 'space.card-padding', 'a ref naming an unrelated (space-kind) token is untouched by a color rename');
    eq(renamed.components['card.gap'], 'space.4', 'a literal foundation-step ref is untouched');

    // Pure: the original system is never mutated.
    ok(system.semanticTokens.some(t => t.kind === 'color' && t.name === 'accent'), 'the original system.semanticTokens is untouched');
    ok(system.vars.light.accent === '#f5f5f5', 'the original system.vars is untouched');
    ok(system.tokenLinks.light.accent.name === 'neutral-100', 'the original system.tokenLinks is untouched');
    ok(system.components['button.outline.bg.hover'] === 'color.accent', 'the original system.components is untouched');

    // --- the same path renames a token of ANY kind (the injected space token) -
    const renamedSpace = g.renameToken(system, 'space', 'card-padding', 'gutter');
    ok(renamedSpace.semanticTokens.some(t => t.kind === 'space' && t.name === 'gutter' && t.ref === 'space.6'),
        'a non-color token renames the same way, keeping its ref');
    ok(!renamedSpace.semanticTokens.some(t => t.kind === 'space' && t.name === 'card-padding'), 'no entry is still named "card-padding"');
    eq(renamedSpace.components['card.padding'], 'space.gutter', 'a component pointing at the renamed space token follows it to the new name');
    eq(renamedSpace.components['card.gap'], 'space.4', 'an unrelated literal step ref is untouched');
    eq(renamedSpace.components['button.outline.bg.hover'], 'color.accent', 'a color ref is untouched by a space-kind rename');
    eq(renamedSpace.vars, system.vars, 'a non-color rename never touches vars');
    eq(renamedSpace.tokenLinks, system.tokenLinks, 'a non-color rename never touches tokenLinks');

    // --- no-ops: always safe to call, never partially applies --------------
    const sameName = g.renameToken(system, 'color', 'accent', 'accent');
    eq(sameName.components, system.components, 'renaming to the identical name is a no-op');
    eq(sameName.vars, system.vars, 'a same-name no-op touches nothing');

    const missing = g.renameToken(system, 'color', 'no-such-token', 'whatever');
    eq(missing.semanticTokens, system.semanticTokens, 'renaming a name that is not in the list is a no-op (list unchanged)');
    eq(missing.components, system.components, 'a not-found rename leaves components unchanged');

    const shadowAttempt = g.renameToken(system, 'color', 'shadow-color', 'shadow-tint');
    ok(shadowAttempt.semanticTokens.some(t => t.kind === 'color' && t.name === 'shadow-color'),
        'renameToken itself also refuses shadow-color (defense in depth - the UI never offers the control at all)');

    // --- export keys follow the rename (dtcg.js buildTokensJson, loaded in
    // this same vm context) -------------------------------------------------
    const exported = g.buildTokensJson({
        name: 'Rename check', source: 'tailwind', families: [],
        vars: renamed.vars, links: renamed.tokenLinks, components: renamed.components,
        semanticTokens: renamed.semanticTokens
    });
    ok(exported.light.color.highlight !== undefined, 'tokens.json: light.color.highlight exists after the rename');
    ok(exported.dark.color.highlight !== undefined, 'tokens.json: dark.color.highlight exists after the rename');
    ok(exported.light.color.accent === undefined, 'tokens.json: no light.color.accent left behind');
    ok(exported.dark.color.accent === undefined, 'tokens.json: no dark.color.accent left behind');
    ok(exported.light.color['accent-foreground'] !== undefined, 'tokens.json: accent-foreground is untouched');
    ok(exported.component.component.button.outline['bg-hover'].$value === '{color.highlight}',
        'tokens.json: the seeded button.outline.bg.hover component token exports through the new name');

    // --- the builtin identity itself round-trips through tokens.json, so a
    // re-imported "highlight" is still recognised as "whichever token plays
    // the background/foreground/ring/muted-foreground role" (the preview-
    // chrome indirection - see scripts.js builtinTokenName/cssVarBlockFor) -
    // not just its color VALUE.
    const parsedBack = g.parseTokensJson(exported);
    const parsedHighlight = parsedBack.semanticTokens.find(t => t.kind === 'color' && t.name === 'highlight');
    ok(parsedHighlight && parsedHighlight.builtin === 'accent', 'parseTokensJson reads the builtin identity back from the extension, not just the bare name');
    const normalizedBack = g.normalizeSemanticTokens(parsedBack.semanticTokens);
    ok(g.builtinTokenName(normalizedBack, 'accent') === 'highlight', 'end to end: after a tokens.json round trip, builtinTokenName still resolves "accent" to "highlight"');
}

console.log(`semantic.test.js: ${checks} checks passed`);
