// Type sets - the list itself. Each set is a role (Display, Body, Caption…)
// backed by five CSS vars (--type-<key>-family/-weight/-size/-leading/
// -tracking, see typeVarKey). This file only owns the LIST and the pure
// helpers around adding to it; scripts.js owns the dynamic state.typeSets
// store, the controls that edit one set's vars, and the CSS/export plumbing.
//
// Plain global, DOM/localStorage-free on purpose - loaded after components.js
// (TYPE_PROP_FIELDS lives there) and before panels.js/scripts.js, so
// tests/typesets.test.js can vm-load just the palettes + foundation.js +
// components.js + this file (index.html load order).

// Today's seven built-in sets, verbatim (scripts.js's old TYPE_SETS const).
// Family references the theme's family token (var(--font-sans)) so the
// chain set -> family token -> face stays visible; abbr/color are editor
// chrome for the badge shown in the sidebar and the preview gutter.
const DEFAULT_TYPE_SETS = [
    { key: 'display',    label: 'Display',    abbr: 'D',  color: '#7c3aed', family: 'sans', weight: '700', size: 2.25,  leading: 2.5,  tracking: '-0.025em' },
    { key: 'heading',    label: 'Heading',    abbr: 'H',  color: '#2563eb', family: 'sans', weight: '600', size: 1.5,   leading: 2,    tracking: '-0.015em' },
    { key: 'subheading', label: 'Subheading', abbr: 'SH', color: '#0891b2', family: 'sans', weight: '500', size: 1.125, leading: 1.75, tracking: '0em' },
    { key: 'body',       label: 'Body',       abbr: 'B',  color: '#16a34a', family: 'sans', weight: '400', size: 1,     leading: 1.5,  tracking: '0em' },
    { key: 'label',      label: 'Label',      abbr: 'L',  color: '#d97706', family: 'sans', weight: '500', size: 0.875, leading: 1.25, tracking: '0em' },
    { key: 'caption',    label: 'Caption',    abbr: 'C',  color: '#db2777', family: 'sans', weight: '400', size: 0.75,  leading: 1,    tracking: '0em' },
    { key: 'code',       label: 'Code',       abbr: 'M',  color: '#475569', family: 'mono', weight: '400', size: 0.875, leading: 1.25, tracking: '0em' }
];

// The 7 defaults' own colours (so a freshly-loaded system's next add still
// picks a colour none of them use), plus 8 more distinct hues. Never runs
// out: nextTypeBadgeColor falls back to the least-used one.
const TYPE_BADGE_COLORS = [
    '#7c3aed', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#db2777', '#475569',
    '#dc2626', '#ea580c', '#65a30d', '#0d9488', '#4f46e5', '#c026d3', '#78716c', '#0284c7'
];

function typeVarKey(setKey, prop) {
    return `type-${setKey}-${prop}`;
}

// Strict key rule: lowercase letters only (a-z), nothing else - no digits,
// hyphens, spaces or uppercase - so a set's ref (type.<key>) and CSS vars
// (--type-<key>-*) are always plain identifiers. Called with the candidate
// key AS GIVEN (the UI lowercases the trimmed name before calling; a direct
// caller that skips that step gets rejected here instead of silently
// colliding). `takenNames` is every existing type-set key plus (once
// semantic type tokens exist) every semantic type-token name - see
// scripts.js typeRefNames().
function typeSetKeyError(key, takenNames) {
    if (!key) return 'Enter a name.';
    if (!/^[a-z]+$/.test(key)) return 'Use lowercase letters only (a-z) - no spaces, digits or hyphens.';
    if ((takenNames || []).includes(key)) return `"${key}" is already a type set.`;
    return null;
}

// First unused initial-letters abbreviation: "O", then "OV", then "OVE"...
// up to the whole uppercased name - never blocks the add (the last rung,
// the full name, only collides in a pathological case, and even then this
// still returns something rather than throwing).
function typeSetAbbr(label, takenAbbrs) {
    const upper = String(label || '').toUpperCase().replace(/[^A-Z]/g, '') || 'X';
    const taken = new Set(takenAbbrs || []);
    for (let n = 1; n <= upper.length; n++) {
        const candidate = upper.slice(0, n);
        if (!taken.has(candidate)) return candidate;
    }
    return upper;
}

// First badge colour no current set uses; once every colour is taken, the
// least-used one (ties keep the earliest in TYPE_BADGE_COLORS) - an add
// never fails for lack of a fresh colour.
function nextTypeBadgeColor(sets) {
    const counts = new Map(TYPE_BADGE_COLORS.map(c => [c, 0]));
    (sets || []).forEach(s => counts.set(s.color, (counts.get(s.color) || 0) + 1));
    let best = TYPE_BADGE_COLORS[0];
    let bestCount = Infinity;
    TYPE_BADGE_COLORS.forEach(c => {
        const n = counts.get(c) || 0;
        if (n < bestCount) { bestCount = n; best = c; }
    });
    return best;
}

// Builds the new set object (key/label/abbr/color + family/weight/size/
// leading/tracking copied from `bodySet`) or throws an Error whose message
// is the inline refusal text. `takenNames` defaults to `sets`' own keys when
// omitted (a direct caller not yet tracking semantic type tokens); scripts.js
// addTypeSet passes typeRefNames() explicitly. Only the descriptor fields are
// set here - copying the ACTUAL --type-body-* var values (both modes) onto
// the new keys is scripts.js addTypeSet's job, since that needs state.vars.
function newTypeSet(sets, rawName, bodySet, takenNames) {
    const name = String(rawName || '').trim();
    const key = name.toLowerCase();
    const err = typeSetKeyError(key, takenNames || sets.map(s => s.key));
    if (err) throw new Error(err);
    const body = bodySet || sets.find(s => s.key === 'body') || sets[sets.length - 1];
    return {
        key,
        label: name,
        abbr: typeSetAbbr(name, sets.map(s => s.abbr)),
        color: nextTypeBadgeColor(sets),
        family: body.family,
        weight: body.weight,
        size: body.size,
        leading: body.leading,
        tracking: body.tracking
    };
}

// A saved system's type-set list, defaulted/repaired: missing, empty or
// malformed -> a fresh clone of the 7 defaults; a valid list (every entry at
// least has a string `key`) is cloned through as-is, extra user sets and all.
function normalizeTypeSets(list) {
    if (!Array.isArray(list) || !list.length || !list.every(s => s && typeof s.key === 'string' && s.key)) {
        return DEFAULT_TYPE_SETS.map(s => ({ ...s }));
    }
    return list.map(s => ({ ...s }));
}
