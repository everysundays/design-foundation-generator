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
    cloneCustomScale, scaleEntries, refToVar, remEntry, pxEntry, findScaleEntry, nearestScaleEntry,
    scaleEntryForRem, pairedLeadingRem, parseRef, cssIdent })`, ctx);

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

console.log(`foundation.test.js: ${checks} checks passed`);
