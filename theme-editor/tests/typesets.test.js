// node tests/typesets.test.js
// Loads the palette data, foundation.js, components.js and typesets.js into
// one vm context (plain browser globals, index.html load order) and checks
// the type-set LIST contract: the default list, the key/abbr/colour helpers
// "Add type set" leans on, and normalizeTypeSets' defaulting.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'components.js', 'typesets.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
// Script-scoped `const`s are not properties of the context; lift what the
// test needs out of the shared global lexical scope.
const g = vm.runInContext(`({ DEFAULT_TYPE_SETS, TYPE_BADGE_COLORS, typeVarKey, typeSetKeyError,
    typeSetAbbr, nextTypeBadgeColor, newTypeSet, normalizeTypeSets, refToVar,
    typeSetUsage, retargetTypeSet, canRemoveTypeSet, defaultTypeSetTarget, removeTypeSetFromSystem,
    componentTokenIds, resolveComponentRef, seedComponentTokens, tokenIdParts })`, ctx);
// Strips the vm realm's Object.prototype so assert.deepStrictEqual compares
// structure against an outer-realm fixture, not object identity (same
// pattern as tests/dtcg.test.js).
const norm = o => JSON.parse(JSON.stringify(o));

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

// --- DEFAULT_TYPE_SETS: today's 7 sets, verbatim -----------------------------
const EXPECTED_DEFAULTS = [
    { key: 'display',    label: 'Display',    abbr: 'D',  color: '#7c3aed', family: 'sans', weight: '700', size: 2.25,  leading: 2.5,  tracking: '-0.025em' },
    { key: 'heading',    label: 'Heading',    abbr: 'H',  color: '#2563eb', family: 'sans', weight: '600', size: 1.5,   leading: 2,    tracking: '-0.015em' },
    { key: 'subheading', label: 'Subheading', abbr: 'SH', color: '#0891b2', family: 'sans', weight: '500', size: 1.125, leading: 1.75, tracking: '0em' },
    { key: 'body',       label: 'Body',       abbr: 'B',  color: '#16a34a', family: 'sans', weight: '400', size: 1,     leading: 1.5,  tracking: '0em' },
    { key: 'label',      label: 'Label',      abbr: 'L',  color: '#d97706', family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' },
    { key: 'caption',    label: 'Caption',    abbr: 'C',  color: '#db2777', family: 'sans', weight: '400', size: 0.75,  leading: 1,    tracking: '0em' },
    { key: 'code',       label: 'Code',       abbr: 'M',  color: '#475569', family: 'mono', weight: '400', size: 0.875, leading: 1.25, tracking: '0em' }
];
{
    assert.deepStrictEqual(norm(g.DEFAULT_TYPE_SETS), EXPECTED_DEFAULTS, 'DEFAULT_TYPE_SETS matches today\'s 7 sets exactly');
    checks++;
    ok(g.normalizeTypeSets(undefined).every((s, i) => JSON.stringify(s) === JSON.stringify(EXPECTED_DEFAULTS[i])),
        'normalizeTypeSets(undefined) also equals the 7 defaults');
}

// --- typeSetKeyError: strict /^[a-z]+$/ + collision against takenNames ------
const DEFAULT_KEYS = EXPECTED_DEFAULTS.map(s => s.key);
{
    ok(g.typeSetKeyError('overline', DEFAULT_KEYS) === null, '"overline" is a valid, unused key');
    ok(typeof g.typeSetKeyError('body', DEFAULT_KEYS) === 'string', '"body" collides with an existing key');
    ok(typeof g.typeSetKeyError('Overline', DEFAULT_KEYS) === 'string', '"Overline" (uppercase) is rejected');
    ok(typeof g.typeSetKeyError('h1', DEFAULT_KEYS) === 'string', '"h1" (digit) is rejected');
    ok(typeof g.typeSetKeyError('sub-head', DEFAULT_KEYS) === 'string', '"sub-head" (hyphen) is rejected');
    ok(typeof g.typeSetKeyError('small caps', DEFAULT_KEYS) === 'string', '"small caps" (space, from a multi-word name) is rejected');
    ok(typeof g.typeSetKeyError('', DEFAULT_KEYS) === 'string', 'empty key is rejected');
    ok(typeof g.typeSetKeyError('nav', [...DEFAULT_KEYS, 'nav']) === 'string',
        'a name present in an extra takenNames list is rejected (stands in for a semantic type token)');
}

// --- typeSetAbbr: grows the prefix as earlier letters get taken -------------
{
    ok(g.typeSetAbbr('Overline', []) === 'O', 'first letter when nothing is taken');
    ok(g.typeSetAbbr('Overline', ['O']) === 'OV', '"O" taken -> two letters');
    ok(g.typeSetAbbr('Overline', ['O', 'OV']) === 'OVE', '"O" and "OV" taken -> three letters');
}

// --- nextTypeBadgeColor: first unused, then least-used ----------------------
{
    const firstPick = g.nextTypeBadgeColor(g.DEFAULT_TYPE_SETS);
    ok(!EXPECTED_DEFAULTS.some(s => s.color === firstPick), `first pick for the 7 defaults is a fresh colour: ${firstPick}`);
    ok(g.TYPE_BADGE_COLORS.includes(firstPick), 'the fresh colour still comes from TYPE_BADGE_COLORS');

    // Once every colour in the list has been used at least once, the helper
    // still returns a valid colour (the least-used - here, all tied at 1).
    const allUsed = g.TYPE_BADGE_COLORS.map((color, i) => ({ key: `s${i}`, color }));
    const whenExhausted = g.nextTypeBadgeColor(allUsed);
    ok(g.TYPE_BADGE_COLORS.includes(whenExhausted), `exhausted palette still returns one of TYPE_BADGE_COLORS: ${whenExhausted}`);
}

// --- newTypeSet: copies Body's descriptor fields, key rules enforced -------
{
    const overline = g.newTypeSet(g.DEFAULT_TYPE_SETS, 'Overline');
    const body = EXPECTED_DEFAULTS.find(s => s.key === 'body');
    ok(overline.key === 'overline', `key is the lowercased trimmed name: ${overline.key}`);
    ok(overline.label === 'Overline', `label keeps the name's own casing: ${overline.label}`);
    ['family', 'weight', 'size', 'leading', 'tracking'].forEach(prop => {
        ok(overline[prop] === body[prop], `newTypeSet copies Body's ${prop}: ${overline[prop]} === ${body[prop]}`);
    });
    ok(overline.abbr === 'O', `abbr is the first-letter default: ${overline.abbr}`);
    ok(!EXPECTED_DEFAULTS.some(s => s.color === overline.color), 'a fresh colour, not one of the 7 defaults\' own');

    let threw = false;
    try { g.newTypeSet(g.DEFAULT_TYPE_SETS, 'Body'); } catch (e) { threw = true; ok(typeof e.message === 'string' && e.message.length > 0, 'thrown error carries the refusal text'); }
    ok(threw, 'newTypeSet throws for a name whose key collides ("Body" -> "body")');

    // The takenNames param overrides the sets-only default (stands in for
    // scripts.js typeRefNames() including a semantic type-token name).
    let threwForTaken = false;
    try { g.newTypeSet(g.DEFAULT_TYPE_SETS, 'Nav', null, [...DEFAULT_KEYS, 'nav']); } catch (e) { threwForTaken = true; }
    ok(threwForTaken, 'newTypeSet honours an explicit takenNames list beyond the sets\' own keys');
}

// --- typeVarKey / refToVar: var naming --type-<key>-<prop> ------------------
{
    ['family', 'weight', 'size', 'leading', 'tracking'].forEach(prop => {
        ok(g.typeVarKey('overline', prop) === `type-overline-${prop}`, `typeVarKey('overline', '${prop}') is 'type-overline-${prop}'`);
    });
    ok(g.refToVar('type.overline') === '--type-overline', "refToVar('type.overline') === '--type-overline'");
}

// --- normalizeTypeSets: default on missing/empty, passthrough when valid ---
{
    ok(JSON.stringify(g.normalizeTypeSets(undefined)) === JSON.stringify(EXPECTED_DEFAULTS), 'normalizeTypeSets(undefined) -> the 7 defaults');
    ok(JSON.stringify(g.normalizeTypeSets([])) === JSON.stringify(EXPECTED_DEFAULTS), 'normalizeTypeSets([]) -> the 7 defaults');
    ok(JSON.stringify(g.normalizeTypeSets(null)) === JSON.stringify(EXPECTED_DEFAULTS), 'normalizeTypeSets(null) -> the 7 defaults');

    const eighth = { key: 'overline', label: 'Overline', abbr: 'O', color: '#000000', family: 'sans', weight: '400', size: 1, leading: 1.5, tracking: '0em' };
    const withExtra = [...EXPECTED_DEFAULTS, eighth];
    const normalized = norm(g.normalizeTypeSets(withExtra));
    assert.deepStrictEqual(normalized, withExtra, 'a valid 8-entry list is returned intact, extra set included');
    checks++;
}

// --- Removal (card [41]): typeSetUsage / retargetTypeSet / canRemoveTypeSet /
// removeTypeSetFromSystem, over componentTokenIds() with seeded refs
// included, for BOTH palette sources. -----------------------------------

// canRemoveTypeSet: last-set guard + unknown key (source-independent).
{
    ok(typeof g.canRemoveTypeSet([{ key: 'body' }], 'body') === 'string', 'canRemoveTypeSet refuses the last remaining set');
    ok(g.canRemoveTypeSet([{ key: 'body' }, { key: 'label' }], 'body') === null, 'canRemoveTypeSet allows removal when another set remains');
    ok(typeof g.canRemoveTypeSet([{ key: 'body' }, { key: 'label' }], 'nope') === 'string', 'canRemoveTypeSet refuses an unknown key');
}

// defaultTypeSetTarget: Body if it survives, else the first remaining set;
// never the set being removed (source-independent - it only reads the list).
{
    ok(g.defaultTypeSetTarget(EXPECTED_DEFAULTS, 'label') === 'body', "defaultTypeSetTarget prefers 'body' when it survives the removal");
    ok(g.defaultTypeSetTarget(EXPECTED_DEFAULTS, 'body') === 'display', 'defaultTypeSetTarget falls back to the first remaining set when body itself is removed');
}

// Every default set's ten vars (light+dark) - the shape
// scripts.js withTypographyFallback leaves behind - for removeTypeSetFromSystem's vars fixture.
function fixtureTypeVars(sets) {
    const one = {};
    sets.forEach(set => {
        one[g.typeVarKey(set.key, 'family')] = `var(--font-${set.family})`;
        one[g.typeVarKey(set.key, 'weight')] = set.weight;
        one[g.typeVarKey(set.key, 'size')] = `${set.size}rem`;
        one[g.typeVarKey(set.key, 'leading')] = `${set.leading}rem`;
        one[g.typeVarKey(set.key, 'tracking')] = set.tracking;
    });
    return { light: { ...one }, dark: { ...one } };
}

// A real hover-state id (button's Text part has both a color and a type
// prop, so its id carries a prop segment: element.variant.part.prop.state).
const HOVER_OVERRIDE_ID = 'button.primary.text.type.hover';
ok(g.tokenIdParts(HOVER_OVERRIDE_ID) && g.tokenIdParts(HOVER_OVERRIDE_ID).state === 'hover',
    `fixture id is a real hover-state id: ${JSON.stringify(g.tokenIdParts(HOVER_OVERRIDE_ID))}`);

['tailwind', 'atlassian'].forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.5 });

    // typeSetUsage: seeded refs, no explicit entries at all - matches
    // components.js componentUsage()'s own counts (Label backs 18 seeded
    // parts, Display backs none).
    const labelUsage = g.typeSetUsage({}, 'label', source);
    ok(labelUsage.length === 18, `${source}: typeSetUsage({}, 'label') finds all 18 seeded ids, got ${labelUsage.length}`);
    ok(labelUsage.every(id => g.resolveComponentRef(id, {}, source) === 'type.label'),
        `${source}: every id typeSetUsage returned actually resolves to type.label`);
    ok(g.typeSetUsage({}, 'display', source).length === 0, `${source}: typeSetUsage({}, 'display') is empty (nothing seeded there)`);

    // An explicit STATE-level override is counted too - componentTokenIds()
    // only enumerates default-state ids, so this needs its own pass.
    const withOverride = { [HOVER_OVERRIDE_ID]: 'type.display' };
    const displayUsage = g.typeSetUsage(withOverride, 'display', source);
    assert.deepStrictEqual(norm(displayUsage), [HOVER_OVERRIDE_ID], `${source}: typeSetUsage counts an explicit state-level override`);
    checks++;

    // retargetTypeSet: pure (never mutates its `components` argument), moves
    // every id typeSetUsage found onto an explicit type.body entry, and
    // leaves every other set's ids resolving exactly as before.
    const seedsJsonBefore = JSON.stringify(seeds);
    const retargeted = g.retargetTypeSet(seeds, 'label', 'body', source);
    ok(JSON.stringify(seeds) === seedsJsonBefore, `${source}: retargetTypeSet does not mutate its components argument`);
    // 7 ids already seeded to type.body, plus the 18 moved off type.label.
    const nowBody = g.componentTokenIds().filter(id => retargeted[id] === 'type.body');
    ok(nowBody.length === 25, `${source}: retargetTypeSet writes an explicit type.body for the 7 already-body + 18 moved ids, got ${nowBody.length}`);
    ok(g.componentTokenIds().every(id => g.resolveComponentRef(id, retargeted, source) !== 'type.label'),
        `${source}: after retargeting, no componentTokenIds() id resolves to type.label any more`);
    ['display', 'heading', 'subheading', 'caption', 'code'].forEach(key => {
        const before = g.componentTokenIds().filter(id => g.resolveComponentRef(id, seeds, source) === `type.${key}`);
        const after = g.componentTokenIds().filter(id => g.resolveComponentRef(id, retargeted, source) === `type.${key}`);
        assert.deepStrictEqual(after, before, `${source}: type.${key}'s ids are untouched by a label->body retarget`);
        checks++;
    });
    // An explicit state-level entry naming the removed set is rewritten too.
    const retargetedState = g.retargetTypeSet(withOverride, 'display', 'caption', source);
    ok(retargetedState[HOVER_OVERRIDE_ID] === 'type.caption', `${source}: an explicit state-level 'type.display' entry is rewritten on retarget`);

    // removeTypeSetFromSystem: filters the set out, deletes its vars from
    // BOTH modes, retargets components, and is pure (the fixture is untouched).
    const system = { typeSets: g.DEFAULT_TYPE_SETS.map(s => ({ ...s })), vars: fixtureTypeVars(g.DEFAULT_TYPE_SETS), components: seeds };
    const systemJsonBefore = JSON.stringify(system);
    const removed = g.removeTypeSetFromSystem(system, 'heading', 'body', source);
    ok(JSON.stringify(system) === systemJsonBefore, `${source}: removeTypeSetFromSystem does not mutate its system argument`);
    ok(removed.typeSets.length === 6 && !removed.typeSets.some(s => s.key === 'heading'), `${source}: heading is gone, 6 sets remain`);
    ['light', 'dark'].forEach(mode => {
        ok(!Object.keys(removed.vars[mode]).some(k => k.startsWith('type-heading-')), `${source}: no type-heading-* var survives in ${mode}`);
        ok(removed.vars[mode]['type-body-family'] === system.vars[mode]['type-body-family'], `${source}: an untouched set's vars (${mode}) are unchanged`);
    });
    ok(g.componentTokenIds().every(id => g.resolveComponentRef(id, removed.components, source) !== 'type.heading'),
        `${source}: after removal, no id resolves to the removed set any more`);

    // Removing 'body' itself: the caller's own default (defaultTypeSetTarget)
    // still lands on a real, different set.
    const bodyTarget = g.defaultTypeSetTarget(system.typeSets, 'body');
    const removedBody = g.removeTypeSetFromSystem(system, 'body', bodyTarget, source);
    ok(bodyTarget && bodyTarget !== 'body' && !removedBody.typeSets.some(s => s.key === 'body'),
        `${source}: removing body with its own default target (${bodyTarget}) works`);
});

console.log(`typesets.test.js: ${checks} checks passed`);
