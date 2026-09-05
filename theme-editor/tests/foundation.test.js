// node tests/foundation.test.js
// Loads the palette data, foundation.js and components.js into one vm
// context (they are plain browser globals) and checks the Foundation scales
// layer's contract: built-in scale data per source, user-added custom-scale
// entries (steps beyond a source's fixed scale), deleted (removed) scale
// steps, and the ref <-> CSS custom-property mapping.
//
// components.js is loaded alongside foundation.js because deleting a step
// must refuse when a component-part token resolves to it - see
// scaleEntryUsers/isScaleEntryInUse, below.
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
    cloneCustomScale, scaleEntries, refToVar, remEntry, pxEntry, findScaleEntry, nearestScaleEntry,
    scaleEntryForRem, pairedLeadingRem, parseRef, cssIdent, removedScaleFor, setRemovedScaleFor,
    emptyRemovedScale, cloneRemovedScale, baseScaleEntry, removeScaleEntry, remapRef,
    scaleEntryUsers, isScaleEntryInUse, componentTokenIds, seedComponentTokens,
    nearestRemainingScaleEntry, rewriteComponentRefs, retargetRemovedRefs, resetSeedCache,
    resolveComponentRef, scaleRef })`, ctx);

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

// --- Type size / Type leading: merge sorted by rem ------------------------
// "Add a step to the Foundation Type size and Type leading scales": unlike
// every other scale, a custom typeSize/typeLeading entry is inserted at its
// sorted position (a slider walks the scale low-to-high), not appended after
// the built-ins.
{
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());

    // 1.6rem sits between 2xl (1.5rem) and 3xl (1.875rem) - decorated with a
    // leading the way addCustomScaleEntry would (see the pairedLeadingRem
    // group below for the derivation itself).
    g.customScaleFor('tailwind').typeSize.push({ ...g.remEntry('2.5xl', 1.6), leading: 2 });
    let sizes = g.scaleEntries('tailwind', 'typeSize');
    ok(sizes.length === g.FOUNDATION.tailwind.typeSize.length + 1, 'one Type size step added');
    let i2xl = sizes.findIndex(e => e.name === '2xl');
    let i25 = sizes.findIndex(e => e.name === '2.5xl');
    let i3xl = sizes.findIndex(e => e.name === '3xl');
    ok(i2xl >= 0 && i25 === i2xl + 1 && i3xl === i25 + 1, "'2.5xl' (1.6rem) sorts in between 2xl and 3xl, not after 7xl");

    // '6.5' (1.625rem) lands between the built-in leadings named '6' (1.5rem)
    // and '7' (1.75rem) - an in-between case, not indistinguishable from
    // appending.
    g.customScaleFor('tailwind').typeLeading.push(g.remEntry('6.5', 1.625));
    let leadings = g.scaleEntries('tailwind', 'typeLeading');
    let i6 = leadings.findIndex(e => e.name === '6');
    let i65 = leadings.findIndex(e => e.name === '6.5');
    let i7 = leadings.findIndex(e => e.name === '7');
    ok(i6 >= 0 && i65 === i6 + 1 && i7 === i65 + 1, "'6.5' (1.625rem) sorts in between 6 and 7");

    // '21' (5.25rem) is past every built-in leading (last is '20', 5rem), so
    // it sorts last - readout 84px.
    g.customScaleFor('tailwind').typeLeading.push(g.remEntry('21', 5.25));
    leadings = g.scaleEntries('tailwind', 'typeLeading');
    const last = leadings[leadings.length - 1];
    ok(last.name === '21' && last.px === 84, "'21' (5.25rem, 84px) sorts last, after 20");

    // Same collision rule as every other kind (cssIdent-compare against every
    // entry of the source) - just scoped to the Type size scale, not shared
    // with Type leading's namespace.
    ok(sizes.some(e => g.cssIdent(e.name) === g.cssIdent('base')), "'base' collides with a built-in Type size entry");
    ok(!leadings.some(e => g.cssIdent(e.name) === g.cssIdent('base')), "'base' is not a Type leading name, so it would not collide there");

    // Atlassian: a custom decorated the same way merges sorted on its own
    // scale too (per-source isolation, like every other kind).
    g.customScaleFor('atlassian').typeSize.push({ ...g.pxEntry('font.size.250', 18), leading: 1.25 });
    const atlSizes = g.scaleEntries('atlassian', 'typeSize');
    const i200 = atlSizes.findIndex(e => e.name === 'font.size.200'); // 16px
    const i250 = atlSizes.findIndex(e => e.name === 'font.size.250'); // 18px
    const i300 = atlSizes.findIndex(e => e.name === 'font.size.300'); // 20px
    ok(i200 >= 0 && i250 === i200 + 1 && i300 === i250 + 1, "Atlassian 'font.size.250' (18px) sorts between font.size.200 and font.size.300");
    ok(g.scaleEntries('tailwind', 'typeSize').length === sizes.length, 'the Atlassian addition left the Tailwind Type size scale untouched');

    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    g.setCustomScaleFor('atlassian', g.emptyCustomScale());
}

// --- Every other scale kind keeps listing customs after the built-ins -----
// Regression guard: SORTED_KINDS must cover Type size/Type leading only.
// Space/Radius/Border width/Shadow (and, trivially, Border style, which
// takes the identical code path) keep the old append-only behaviour even
// though scaleEntries now sorts two of the seven kinds.
{
    ['space', 'radius', 'borderWidth', 'shadow'].forEach(kind => {
        g.setCustomScaleFor('tailwind', g.emptyCustomScale());
        const baseline = g.scaleEntries('tailwind', kind);
        // A step smaller than every built-in of this kind - if scaleEntries
        // sorted it in, it would land first, not last.
        const tiny = kind === 'shadow'
            ? { name: 'tiny', layers: [[0, 0, 0, 0, 0.01]], value: 'none', px: null }
            : g.remEntry('tiny', 0.01);
        g.customScaleFor('tailwind')[kind].push(tiny);
        const entries = g.scaleEntries('tailwind', kind);
        ok(entries.length === baseline.length + 1, `${kind}: one step added`);
        ok(entries[entries.length - 1].name === 'tiny', `${kind}: a smaller custom still lists last, never sorted in`);
    });
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
}

// --- pairedLeadingRem -------------------------------------------------------
// The leading (rem) a Type size entry pairs with: its own `.leading` when
// set (snapped onto a real Type leading step), else the nearest OTHER size
// step's leading - and it never throws, even for a bare entry that was never
// pushed into the scale at all (an off-scale/blank leading must never reach
// the UI).
{
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());

    // A blank leading box: derive it from the nearest existing size. 1.6rem
    // is nearest to 2xl (1.5rem), whose own leading is 2rem (32px).
    const bare = g.remEntry('2.5xl', 1.6); // no .leading - as if the box was left blank
    ok(g.pairedLeadingRem('tailwind', bare) === 2, "blank leading for 2.5xl (1.6rem) derives 2xl's own leading, 2rem");

    // An explicit, on-scale leading (2.25rem = Type leading step '9') is kept
    // as-is.
    ok(g.pairedLeadingRem('tailwind', { ...bare, leading: 2.25 }) === 2.25, 'an on-scale leading is returned unchanged');

    // An off-scale leading (2.1rem is not a Type leading step) snaps to the
    // nearest real one - never itself, never blank, never NaN.
    const snapped = g.pairedLeadingRem('tailwind', { ...bare, leading: 2.1 });
    ok(snapped !== 2.1, 'an off-scale leading never passes through unchanged');
    ok(g.scaleEntries('tailwind', 'typeLeading').some(e => e.rem === snapped), 'it snaps onto a real Type leading step instead');

    // Every built-in size's pairedLeadingRem matches the leading it shipped
    // with (round-trips through the snap with no drift, since a built-in's
    // own leading is always already a real step).
    g.FOUNDATION.tailwind.typeSize.forEach(entry => {
        ok(g.pairedLeadingRem('tailwind', entry) === entry.leading, `${entry.name}: pairedLeadingRem matches its own leading`);
    });

    // Never throws, even for an entry far outside the scale on a source with
    // no customs at all.
    ok(Number.isFinite(g.pairedLeadingRem('atlassian', g.remEntry('huge', 999))), 'pairedLeadingRem never throws, even far off the scale');

    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
}

// --- emptyCustomScale / cloneCustomScale carry typeSize + typeLeading -----
// A system saved before this card shipped has no typeSize/typeLeading keys
// at all; cloning it must default them to [] rather than dropping them (or
// the rest of the saved customScale) - see foundation.js's cloneCustomScale.
{
    const empty = g.emptyCustomScale();
    ok(Array.isArray(empty.typeSize) && empty.typeSize.length === 0, 'emptyCustomScale().typeSize is []');
    ok(Array.isArray(empty.typeLeading) && empty.typeLeading.length === 0, 'emptyCustomScale().typeLeading is []');

    const legacyShape = { space: [g.remEntry('x', 1)] }; // pre-card-2 saved system: no type keys
    const cloned = g.cloneCustomScale(legacyShape);
    ok(Array.isArray(cloned.typeSize) && cloned.typeSize.length === 0, 'cloneCustomScale defaults a missing typeSize to []');
    ok(Array.isArray(cloned.typeLeading) && cloned.typeLeading.length === 0, 'cloneCustomScale defaults a missing typeLeading to []');
    ok(cloned.space.length === 1, 'cloneCustomScale still carries the kinds the legacy shape did have');
}

// --- ref <-> CSS mapping for the two new kinds -----------------------------
{
    ok(g.refToVar('font.size.2.5xl') === '--font-size-2-5xl', "refToVar('font.size.2.5xl') === '--font-size-2-5xl'");
    ok(g.refToVar('font.lineHeight.21') === '--font-leading-21', "refToVar('font.lineHeight.21') === '--font-leading-21'");
    ok(JSON.stringify(g.parseRef('font.size.2.5xl')) === JSON.stringify({ kind: 'typeSize', name: '2.5xl' }), 'parseRef round-trips a Type size ref');
    ok(JSON.stringify(g.parseRef('font.lineHeight.21')) === JSON.stringify({ kind: 'typeLeading', name: '21' }), 'parseRef round-trips a Type leading ref');
    // Atlassian names already carry the group's own prefix ("font.size.700");
    // prefixedVar strips it exactly like it does for space/radius, so a
    // custom keeps the same spelling as the built-ins around it.
    ok(g.refToVar('font.size.font.size.700') === '--font-size-700', "an Atlassian-style custom 'font.size.700' -> --font-size-700 (group prefix stripped)");

    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    g.customScaleFor('tailwind').typeSize.push({ ...g.remEntry('2.5xl', 1.6), leading: 2 });
    const found = g.scaleEntryForRem('tailwind', 'typeSize', 1.6);
    ok(found && found.name === '2.5xl', "scaleEntryForRem('tailwind', 'typeSize', 1.6).name === '2.5xl'");
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
}

// --- Deleting a built-in step -----------------------------------------------
// "Delete a step from a Foundation scale": an unused built-in name is hidden
// from scaleEntries per source/kind, without ever touching FOUNDATION itself.
{
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());

    const before = g.scaleEntries('tailwind', 'space');
    ok(before.some(e => e.name === '14'), "space '14' starts present");

    ok(g.removeScaleEntry('tailwind', 'space', '14') === true, 'removeScaleEntry reports a change');
    const after = g.scaleEntries('tailwind', 'space');
    ok(after.length === before.length - 1, 'one step removed');
    ok(!after.some(e => e.name === '14'), "scaleEntries omits the removed name '14'");
    ok(g.findScaleEntry('tailwind', 'space', '14') === null, 'findScaleEntry no longer finds it');
    ok(!!g.baseScaleEntry('tailwind', 'space', '14'), 'baseScaleEntry (unfiltered) still finds it');
    ok(g.FOUNDATION.tailwind.space.some(e => e.name === '14'), 'FOUNDATION.tailwind.space itself is untouched - only the live view is filtered');

    // A removal on Tailwind does not touch Atlassian, or another kind of
    // Tailwind's own scale.
    ok(g.scaleEntries('atlassian', 'space').length === g.FOUNDATION.atlassian.space.length, 'atlassian space untouched by a tailwind removal');
    ok(g.scaleEntries('tailwind', 'radius').length === g.FOUNDATION.tailwind.radius.length, 'tailwind radius untouched by a tailwind SPACE removal');

    // Removing the same name again is a no-op (not double-recorded); removing
    // a name that was never a real step at all is also a no-op.
    ok(g.removeScaleEntry('tailwind', 'space', '14') === false, 'removing an already-removed name reports no change');
    ok(g.removedScaleFor('tailwind').space.filter(n => n === '14').length === 1, 'the removed list holds the name once, not duplicated');
    ok(g.removeScaleEntry('tailwind', 'space', 'not-a-real-step') === false, 'removing a made-up name is a no-op');

    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    ok(g.scaleEntries('tailwind', 'space').length === before.length, 'reset back to every built-in step present');
}

// --- Deleting a custom step --------------------------------------------------
// A user-added entry is spliced out of customScale entirely - never recorded
// in removedScale, which only ever names a BASE built-in step.
{
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.customScaleFor('tailwind').radius.push(g.remEntry('xxl-custom', 3));
    ok(g.scaleEntries('tailwind', 'radius').some(e => e.name === 'xxl-custom'), 'the custom step is listed');

    ok(g.removeScaleEntry('tailwind', 'radius', 'xxl-custom') === true, 'removing a custom step reports a change');
    ok(!g.scaleEntries('tailwind', 'radius').some(e => e.name === 'xxl-custom'), 'the custom step is gone');
    ok(g.customScaleFor('tailwind').radius.length === 0, 'spliced out of the custom slot');
    ok(g.removedScaleFor('tailwind').radius.length === 0, "removedScale never records a custom-only name (it isn't a base step)");
}

// --- A deleted built-in name can be re-added as a custom step ---------------
// "the list then shows the custom value": scaleEntries filters the removed
// base name out entirely, so the merged list ends up with exactly one entry
// under that name - the custom one. (The custom value is deliberately
// DIFFERENT from the built-in's own - Tailwind's built-in space.4 is already
// 1rem, so re-adding "4" = 1rem would prove nothing about which value is
// showing; 1.5rem makes the swap unmistakable.)
{
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());

    g.removeScaleEntry('tailwind', 'space', '4');
    ok(!g.scaleEntries('tailwind', 'space').some(e => e.name === '4'), "'4' is gone after removal");

    g.customScaleFor('tailwind').space.push(g.remEntry('4', 1.5));
    const entries = g.scaleEntries('tailwind', 'space');
    const fours = entries.filter(e => e.name === '4');
    ok(fours.length === 1, "scaleEntries lists exactly one '4' once the built-in is removed and a custom '4' is added");
    ok(fours[0].value === '1.5rem' && fours[0].rem === 1.5, "the one '4' carries the CUSTOM value (1.5rem), not the built-in's (1rem)");

    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
}

// --- scaleEntryUsers / isScaleEntryInUse ------------------------------------
// "Deleting a step in use ... is refused with a message listing the parts
// that use it": must catch a step reached only through a SEEDED default
// (nothing explicit in `components` at all) and an EXPLICIT state-override
// entry - the exact gap the DoD's "count badge > 0" wording would otherwise
// miss, since the badge (scripts.js computeMarks) only ever walks
// default-state ids - and correctly report nothing for a step no seed or
// override ever touches.
{
    // Tailwind's real SEED_SPEC seeds every button variant's padding.x onto
    // space.4 (components.js SEED_SPEC.button.base['padding.x']) - a
    // completely empty `components` object still finds it, because
    // resolveComponentRef falls through to the seed.
    const seedUsers = g.scaleEntryUsers({}, 'tailwind', 'space', '4');
    ok(seedUsers.includes('button.primary.padding.x'), 'a seeded default (no explicit override at all) counts as in use');
    ok(g.isScaleEntryInUse({}, 'tailwind', 'space', '4') === true, 'isScaleEntryInUse mirrors scaleEntryUsers as a boolean');

    // An EXPLICIT non-default-state override - what the badge alone misses.
    const withStateOverride = { 'button.primary.padding.x.hover': 'space.6' };
    const stateUsers = g.scaleEntryUsers(withStateOverride, 'tailwind', 'space', '6');
    ok(stateUsers.includes('button.primary.padding.x.hover'), 'an explicit non-default-state override counts as in use too');

    // A step no seed or override ever touches: nothing.
    ok(g.scaleEntryUsers({}, 'tailwind', 'space', '14').length === 0, "an unreferenced step ('14') has no users");
    ok(g.isScaleEntryInUse({}, 'tailwind', 'space', '14') === false, 'isScaleEntryInUse false for an unused step');

    // `source` is explicit, never a global default - the same NAME means
    // nothing on a source where it isn't even a real step.
    ok(g.scaleEntryUsers({}, 'atlassian', 'space', '4').length === 0, "tailwind's users of space '4' say nothing about atlassian, which has no step named '4' at all");
}

// --- nearestScaleEntry / remapRef never land on a removed step -------------
{
    g.setCustomScaleFor('tailwind', g.emptyCustomScale());
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.setRemovedScaleFor('atlassian', g.emptyRemovedScale());

    // nearestScaleEntry: '4' (1rem) is nearest to 0.95rem before it is
    // removed; once removed the search must skip it and land on a step that
    // is actually still present.
    let nearest = g.nearestScaleEntry('tailwind', 'space', 0.95);
    ok(nearest.name === '4', "'4' (1rem) is nearest to 0.95rem before it is removed");
    g.removeScaleEntry('tailwind', 'space', '4');
    nearest = g.nearestScaleEntry('tailwind', 'space', 0.95);
    ok(nearest.name !== '4', 'nearestScaleEntry never returns a removed step');
    ok(g.scaleEntries('tailwind', 'space').some(e => e.name === nearest.name), 'it lands on a step that is actually still present');

    // remapRef, length-based kinds: the FROM-side step was deleted (a
    // dangling seed - SEED_SPEC hard-codes "space.4") but must still remap by
    // its original value via baseScaleEntry, not pass the ref through
    // unchanged.
    const mapped = g.remapRef('space.4', 'tailwind', 'atlassian');
    ok(mapped !== 'space.4', "remapRef doesn't just return the from-side ref unchanged once it's been deleted");
    ok(mapped === 'space.space.200', "space.4 (1rem/16px) still maps to Atlassian's space.200 (16px) by value, even though tailwind's own space.4 was just deleted");

    // remapRef, TO-side: once the mapped-to step is ALSO removed (on the
    // target source), the result must skip it too.
    g.removeScaleEntry('atlassian', 'space', 'space.200');
    const remapped2 = g.remapRef('space.4', 'tailwind', 'atlassian');
    ok(remapped2 !== 'space.space.200', 'remapRef never lands the TO-side on a removed step either');
    ok(g.scaleEntries('atlassian', 'space').some(e => remapped2 === `space.${e.name}`), 'it lands on a still-present Atlassian step instead');

    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.setRemovedScaleFor('atlassian', g.emptyRemovedScale());
}

// --- remapRef, shadow: from-side index fallback when the step is deleted ---
// Shadow has no rem to snap to (it maps by index position) - SEED_SPEC also
// hard-codes a raw shadow ref ("shadow.xs"), so it needs the same from-side
// fallback as the length-based kinds above, just computed differently.
{
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.setRemovedScaleFor('atlassian', g.emptyRemovedScale());

    const before = g.remapRef('shadow.xs', 'tailwind', 'atlassian');
    ok(g.scaleEntries('atlassian', 'shadow').some(e => `shadow.${e.name}` === before), 'shadow.xs maps to a real Atlassian shadow step before any removal');

    g.removeScaleEntry('tailwind', 'shadow', 'xs');
    const after = g.remapRef('shadow.xs', 'tailwind', 'atlassian');
    ok(after !== 'shadow.xs', 'remapRef does not return the ref unchanged once the from-side shadow step is deleted');
    ok(g.scaleEntries('atlassian', 'shadow').some(e => `shadow.${e.name}` === after), 'it still lands on a real Atlassian shadow step');
    ok(after === before, 'the deleted from-side step maps to the SAME target as before deletion (position-based, unaffected by the deletion itself)');

    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
}

// --- emptyRemovedScale / cloneRemovedScale ----------------------------------
// A system saved before this card shipped (or a tokens.json import, which
// never carries deletions - see scripts.js applyTokensImport) has no
// removedScale at all; cloning it must default every kind to [] (every
// built-in step present), never drop the kinds a partial shape DID have.
{
    const empty = g.emptyRemovedScale();
    ['space', 'radius', 'borderWidth', 'borderStyle', 'shadow', 'typeSize', 'typeLeading'].forEach(kind => {
        ok(Array.isArray(empty[kind]) && empty[kind].length === 0, `emptyRemovedScale().${kind} is []`);
    });

    const clonedFromUndefined = g.cloneRemovedScale(undefined);
    ok(Array.isArray(clonedFromUndefined.space) && clonedFromUndefined.space.length === 0, 'cloneRemovedScale(undefined) defaults every kind to []');

    const legacyShape = { space: ['14'] }; // a partial/pre-card-3 shape
    const cloned = g.cloneRemovedScale(legacyShape);
    ok(JSON.stringify(cloned.space) === JSON.stringify(['14']), 'cloneRemovedScale keeps the kinds a partial shape did have');
    ok(Array.isArray(cloned.radius) && cloned.radius.length === 0, 'cloneRemovedScale defaults a missing kind to []');

    cloned.space.push('should-not-appear-in-source');
    ok(legacyShape.space.length === 1, 'cloneRemovedScale copies arrays by value, not by reference');
}

// --- removedScaleFor / setRemovedScaleFor: isolation + the undo/save shape -
{
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.setRemovedScaleFor('atlassian', g.emptyRemovedScale());

    g.removedScaleFor('tailwind').space.push('9');
    ok(g.removedScaleFor('atlassian').space.length === 0, 'removedScaleFor is isolated per source (mirrors customScaleFor)');

    const slot = g.removedScaleFor('tailwind');
    const roundTripped = JSON.parse(JSON.stringify(slot));
    ok(JSON.stringify(roundTripped) === JSON.stringify(slot), 'removedScale round-trips through JSON (the undo/save shape)');

    // setRemovedScaleFor points at a NEW object rather than mutating in place
    // (mirrors setCustomScaleFor) - a reference held before the call (e.g. a
    // just-taken undo snapshot) never sees a later push.
    const held = g.removedScaleFor('tailwind');
    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.removedScaleFor('tailwind').space.push('should-not-reach-held');
    ok(held.space.includes('9') && !held.space.includes('should-not-reach-held'), 'setRemovedScaleFor repoints rather than mutating a held reference');

    g.setRemovedScaleFor('tailwind', g.emptyRemovedScale());
    g.setRemovedScaleFor('atlassian', g.emptyRemovedScale());
}

// --- Deleting a step that IS in use ("Delete a Foundation step that is in
// use") ------------------------------------------------------------------
// A step no longer refuses outright (that was "Delete a step from a
// Foundation scale") - it retargets every component-part token onto the
// nearest remaining step first. Two building blocks: nearestRemainingScaleEntry
// (foundation.js, below) picks the target; retargetRemovedRefs/
// rewriteComponentRefs (components.js) do the moving.
function resetFoundationTestState() {
    ['tailwind', 'atlassian'].forEach(s => {
        g.setCustomScaleFor(s, g.emptyCustomScale());
        g.setRemovedScaleFor(s, g.emptyRemovedScale());
    });
    g.resetSeedCache();
}

// --- nearestRemainingScaleEntry ---------------------------------------------
{
    resetFoundationTestState();

    // Length (rem) steps: nearest by |rem diff|, ties -> first in list order
    // (nearestScaleEntry's own rule) - the DoD's own worked examples.
    ok(g.nearestRemainingScaleEntry('tailwind', 'space', '4').name === '3.5',
        "tailwind space '4' (1rem) -> '3.5' (0.875rem, dist 0.125) over '5' (1.25rem, dist 0.25) - the DoD's own example");
    ok(g.nearestRemainingScaleEntry('tailwind', 'radius', 'lg').name === 'md',
        "tailwind radius 'lg' (0.5rem) -> 'md' (0.375rem, dist 0.125) over 'xl' (0.75rem, dist 0.25), even though Default's own --radius is 0.625rem");
    ok(g.nearestRemainingScaleEntry('atlassian', 'space', 'space.200').name === 'space.150',
        'atlassian space.200 (16px) ties space.150 and space.250 (both 4px away) - the EARLIER entry (space.150) wins');
    ok(g.nearestRemainingScaleEntry('atlassian', 'radius', 'radius.large').name === 'radius.medium',
        'atlassian radius.large (8px) -> radius.medium (6px, dist 2px) over radius.xlarge (12px, dist 4px)');

    // Non-length kinds: shadow by index position, borderStyle by name.
    ok(g.nearestRemainingScaleEntry('tailwind', 'shadow', 'xs').name === '2xs',
        "shadow has no length to snap to - 'xs' (index 2 of none/2xs/xs/sm/…) -> the PREVIOUS index, '2xs'");
    ok(g.nearestRemainingScaleEntry('tailwind', 'borderStyle', 'solid').name === 'dashed',
        "borderStyle has no meaningful order - deleting 'solid' ITSELF lands on the first REMAINING entry, 'dashed'");

    // A rem-null step (radius "full"): the LARGEST remaining rem entry, not a
    // nearest-by-distance pick (there's no distance to measure from).
    ok(g.nearestRemainingScaleEntry('tailwind', 'radius', 'full').name === '4xl',
        "radius 'full' (rem null) -> the largest remaining rem entry, '4xl' (2rem)");

    // No candidates at all: refuse (null) rather than delete into an empty
    // scale. borderStyle only has 4 built-in steps and no custom slot yet.
    g.removeScaleEntry('tailwind', 'borderStyle', 'dashed');
    g.removeScaleEntry('tailwind', 'borderStyle', 'dotted');
    g.removeScaleEntry('tailwind', 'borderStyle', 'none');
    ok(g.scaleEntries('tailwind', 'borderStyle').length === 1, "borderStyle now has exactly one entry left ('solid')");
    ok(g.nearestRemainingScaleEntry('tailwind', 'borderStyle', 'solid') === null,
        'deleting the LAST entry of a scale has nowhere to move to - null, not a made-up target');

    // Idempotent / call-order independent: the SAME answer whether `name` is
    // still present in the scale or has already been marked removed - the
    // in-use delete flow computes this BEFORE removeScaleEntry runs, but a
    // node test (or a retry) must get the identical answer calling it after.
    resetFoundationTestState();
    const beforeRemoval = g.nearestRemainingScaleEntry('tailwind', 'space', '4');
    g.removeScaleEntry('tailwind', 'space', '4');
    const afterRemoval = g.nearestRemainingScaleEntry('tailwind', 'space', '4');
    ok(beforeRemoval.name === afterRemoval.name, 'nearestRemainingScaleEntry gives the SAME answer before and after the step is actually removed');

    // And it never lands ON a step that's already gone: with '3.5' removed,
    // deleting '4' must skip it (tie between '3' and '5' - earlier, '3', wins).
    resetFoundationTestState();
    g.removeScaleEntry('tailwind', 'space', '3.5');
    const skipsRemoved = g.nearestRemainingScaleEntry('tailwind', 'space', '4');
    ok(skipsRemoved.name === '3', "with '3.5' already removed, deleting '4' lands on '3' (a tie with '5' - earlier wins), never on the already-removed '3.5'");

    resetFoundationTestState();
}

// --- retargetRemovedRefs / rewriteComponentRefs -----------------------------
// "shows how many tokens land there and, on confirm, moves them to the
// nearest remaining step": every id that resolved to the deleted step -
// SEEDED default and EXPLICIT state override alike, the exact gap the count
// badge (default-state ids only) would miss - resolves somewhere else
// afterward. The DoD's own contract, checked generically for both sources:
// no resolveComponentRef result over componentTokenIds() names the removed
// step.
{
    resetFoundationTestState();

    // Tailwind space.4, from a completely EMPTY components map (every id
    // resolves purely through seeding) - the DoD's own worked example.
    const out = g.retargetRemovedRefs({}, 'tailwind', 'space', '4');
    g.componentTokenIds().forEach(id => {
        ok(g.resolveComponentRef(id, out, 'tailwind') !== 'space.4', `${id} no longer resolves to the removed space.4 (tailwind)`);
    });
    const movedTo35 = Object.keys(out).filter(id => out[id] === 'space.3.5');
    ok(movedTo35.length === 14, `exactly the 14 former users of space.4 are now explicit on space.3.5 (got ${movedTo35.length})`);
    ok(Object.keys(out).length === 14, 'no OTHER key was added - retargetRemovedRefs only ever writes ids that actually resolved to the removed ref');

    // Tailwind radius.lg, from an already fully-SEEDED map - the DoD's
    // "button, input and card radius" example; 16 ids share radius.lg on
    // Default (all 6 button variants, input, select, textarea, card, both
    // alert variants, tabs-list, both tab states, popover).
    const seeds = g.seedComponentTokens('tailwind', { radiusRem: 0.625 });
    const out2 = g.retargetRemovedRefs(seeds, 'tailwind', 'radius', 'lg');
    g.componentTokenIds().forEach(id => {
        ok(g.resolveComponentRef(id, out2, 'tailwind') !== 'radius.lg', `${id} no longer resolves to the removed radius.lg (tailwind)`);
    });
    const wasLg = Object.keys(seeds).filter(id => seeds[id] === 'radius.lg');
    ok(wasLg.length === 16, `sanity: 16 seeded ids named radius.lg before the retarget (got ${wasLg.length})`);
    ok(wasLg.every(id => out2[id] === 'radius.md'), 'every one of those 16 now names radius.md, the nearest remaining radius step');
    ok(Object.keys(seeds).every(id => seeds[id] === 'radius.lg' || out2[id] === seeds[id]), 'every id that was NOT on radius.lg is left completely untouched');
    ok(Object.keys(out2).length === Object.keys(seeds).length, 'no key was added or removed - only rewritten');

    // Atlassian - "for both sources": space.200 and radius.large, same shape.
    resetFoundationTestState();
    const outA = g.retargetRemovedRefs({}, 'atlassian', 'space', 'space.200');
    g.componentTokenIds().forEach(id => {
        ok(g.resolveComponentRef(id, outA, 'atlassian') !== 'space.space.200', `${id} no longer resolves to the removed space.200 (atlassian)`);
    });
    ok(Object.keys(outA).filter(id => outA[id] === 'space.space.150').length === 14, 'atlassian: the 14 former users of space.200 are now on space.150 (a tie with space.250 - earlier wins)');
    ok(Object.keys(outA).length === 14, 'atlassian: no other key was added either');

    const seedsA = g.seedComponentTokens('atlassian', { radiusRem: 0.625 });
    const outA2 = g.retargetRemovedRefs(seedsA, 'atlassian', 'radius', 'radius.large');
    g.componentTokenIds().forEach(id => {
        ok(g.resolveComponentRef(id, outA2, 'atlassian') !== 'radius.radius.large', `${id} no longer resolves to the removed radius.large (atlassian)`);
    });
    const wasLarge = Object.keys(seedsA).filter(id => seedsA[id] === 'radius.radius.large');
    ok(wasLarge.length === 16 && wasLarge.every(id => outA2[id] === 'radius.radius.medium'), 'atlassian: all 16 former radius.large users now name radius.medium');
    ok(Object.keys(outA2).length === Object.keys(seedsA).length, 'atlassian: no key added or removed either');

    // An EXPLICIT non-default-state override (a seeded hover/focus/disabled
    // delta, or any future per-state assignment) moves too.
    resetFoundationTestState();
    const withOverride = { 'button.primary.padding.x.hover': 'space.6' };
    const outOverride = g.retargetRemovedRefs(withOverride, 'tailwind', 'space', '6');
    ok(outOverride['button.primary.padding.x.hover'] !== 'space.6', 'an explicit state-override entry is retargeted too, not just default-state ids');
    ok(outOverride['button.primary.padding.x.hover'] === g.scaleRef('space', g.nearestRemainingScaleEntry('tailwind', 'space', '6').name),
        'and lands on exactly the nearest remaining step, same as a default-state id would');

    // An unrelated explicit ref (a different kind entirely, e.g. a semantic
    // color role) is never touched by a scale retarget.
    const withColor = { 'button.primary.bg': 'color.primary' };
    const outColor = g.retargetRemovedRefs(withColor, 'tailwind', 'space', '4');
    ok(outColor['button.primary.bg'] === 'color.primary', 'an unrelated explicit ref (a color role) is untouched by a SPACE retarget');

    // Nowhere left to move to: retargetRemovedRefs refuses (returns
    // `components` UNCHANGED) rather than moving tokens onto a made-up
    // target - mirrors nearestRemainingScaleEntry returning null.
    resetFoundationTestState();
    g.removeScaleEntry('tailwind', 'borderStyle', 'dashed');
    g.removeScaleEntry('tailwind', 'borderStyle', 'dotted');
    g.removeScaleEntry('tailwind', 'borderStyle', 'none');
    const soleStyle = { x: 'border.style.solid' };
    const outNoTarget = g.retargetRemovedRefs(soleStyle, 'tailwind', 'borderStyle', 'solid');
    ok(JSON.stringify(outNoTarget) === JSON.stringify(soleStyle), "retargetRemovedRefs returns `components` UNCHANGED when deleting the scale's last entry would leave nothing to move to");

    resetFoundationTestState();
}

// --- rewriteComponentRefs on its own (the rename later cards reuse) --------
// "Rename a semantic token"/"Delete a semantic token" reuse this same
// rewrite for an arbitrary ref pair, not just a foundation scale step -
// checked directly here so its contract doesn't drift once those cards land.
{
    resetFoundationTestState();
    const seeds = g.seedComponentTokens('tailwind', { radiusRem: 0.5 });
    ok(seeds['button.primary.bg'] === 'color.primary', 'sanity: the seed for button.primary.bg is color.primary');
    const rewritten = g.rewriteComponentRefs(seeds, 'tailwind', 'color.primary', 'color.brand');
    ok(rewritten['button.primary.bg'] === 'color.brand', 'rewriteComponentRefs works for an arbitrary ref pair, not just a scale step');
    ok(Object.keys(rewritten).filter(id => rewritten[id] === 'color.primary').length === 0, 'no id still names the FROM ref anywhere in the result');
    ok(Object.keys(rewritten).length === Object.keys(seeds).length, 'no key added or removed, only rewritten');
    resetFoundationTestState();
}

// --- resetSeedCache ----------------------------------------------------------
// components.js's seedsFor caches its result per source|radiusRem and is
// never invalidated by removeScaleEntry itself - without a reset, a FUTURE
// resolveComponentRef call for an id with NO explicit entry at all (a
// tokens.json import carrying no components section, or a saved system with
// none) would resurrect the very step that was just deleted.
{
    resetFoundationTestState();

    ok(g.resolveComponentRef('button.primary.radius', {}, 'tailwind') === 'radius.lg',
        'sanity: before any deletion, an id with no explicit entry seeds to radius.lg (the fallback theme radius, 0.5rem)');
    g.removeScaleEntry('tailwind', 'radius', 'lg');
    ok(g.resolveComponentRef('button.primary.radius', {}, 'tailwind') === 'radius.lg',
        'demonstrates the bug resetSeedCache fixes: WITHOUT a reset, the stale seed cache still hands back the just-removed radius.lg');
    g.resetSeedCache();
    const reseeded = g.resolveComponentRef('button.primary.radius', {}, 'tailwind');
    ok(reseeded !== 'radius.lg', 'resetSeedCache forces a fresh seed - an id with no explicit entry no longer resurrects the removed step');
    ok(reseeded === 'radius.md', 'the fresh seed lands on the same nearest-remaining step a retarget would (radius.md)');

    resetFoundationTestState();
}

console.log(`foundation.test.js: ${checks} checks passed`);
