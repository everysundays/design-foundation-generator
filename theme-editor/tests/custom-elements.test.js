// node tests/custom-elements.test.js
// Loads the palette data, foundation.js, components.js and panels.js into
// one vm context (same bootstrap as components.test.js / panels.test.js) and
// checks the custom-element registry: name validation, spec construction
// from a stock base's parts, seeding/ids/CSS emission through the SAME
// allElements() sweep components.test.js exercises for stock elements only,
// the generic specimen renderer, and the read-only sidebar header.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
['tailwind-palette.js', 'atlassian-palette.js', 'foundation.js', 'components.js', 'panels.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
const g = vm.runInContext(`({ ELEMENTS, allElements, setCustomElements, customElementsSnapshot,
    validateCustomElementName, buildCustomElementSpec, customElementLiveOverrides, renderCustomInstance,
    buildCustomGalleryHtml, buildCustomElementHeaderHtml, buildGalleryHtml, componentTokenIds, tokenIdParts,
    tokenId, propKind, seedComponentTokens, resolveComponentRef, componentVarLines, buildWiringCss, parseRef,
    refToVar, findScaleEntry, paletteEntryByName, elementSpec, customElementMissingKinds, customPartIds,
    removeCustomPart, addCustomPart, CUSTOM_PART_FACTORY, variantNameError, addVariantToSpec,
    removeVariantFromSpec, copyVariantTokens, dropVariantTokens, renameCustomElement, deleteCustomElement })`, ctx);

const SOURCES = ['tailwind', 'atlassian'];
const SEMANTIC_ROLES = new Set([
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'accent', 'accent-foreground',
    'background', 'foreground', 'muted', 'muted-foreground', 'destructive', 'destructive-foreground',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'border', 'input', 'ring', 'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring'
]);
const TYPE_SETS = new Set(['display', 'heading', 'subheading', 'body', 'label', 'caption', 'code']);
const PALETTE_SPECIALS = new Set(['white', 'black', 'transparent']);

let checks = 0;
function ok(cond, msg) { checks++; assert.ok(cond, msg); }

function assertRefValid(ref, kind, source, where) {
    const parsed = g.parseRef(ref);
    ok(parsed, `${where}: "${ref}" is not a ref`);
    if (!parsed) return;
    if (kind === 'color') {
        ok(parsed.kind === 'color' || parsed.kind === 'palette', `${where}: "${ref}" is not a color ref`);
        if (parsed.kind === 'color') ok(SEMANTIC_ROLES.has(parsed.name), `${where}: unknown semantic role "${parsed.name}"`);
        else ok(PALETTE_SPECIALS.has(parsed.name) || g.paletteEntryByName(source, parsed.name), `${where}: unknown palette entry "${parsed.name}"`);
    } else if (kind === 'type') {
        ok(parsed.kind === 'type' && TYPE_SETS.has(parsed.name), `${where}: "${ref}" is not a type set`);
    } else {
        ok(parsed.kind === kind, `${where}: "${ref}" has kind ${parsed.kind}, expected ${kind}`);
        ok(g.findScaleEntry(source, kind, parsed.name), `${where}: "${ref}" has no ${kind} entry in ${source}`);
    }
    ok(g.refToVar(ref), `${where}: refToVar("${ref}") is null`);
}

const STOCK_KEYS = g.ELEMENTS.map(e => e.key);
const ALL_SIX = ['bg', 'border', 'text', 'icon', 'padding', 'shadow'];

// --- name validation ---------------------------------------------------------
ok(g.validateCustomElementName('button', STOCK_KEYS), 'refuses a stock key');
ok(g.validateCustomElementName('My Chip', []), 'refuses a non-identifier (space/case)');
ok(g.validateCustomElementName('1chip', []), 'refuses a non-identifier (leading digit)');
ok(g.validateCustomElementName('a.b', []), 'refuses a non-identifier (dot)');
['x-hover', 'x-focus', 'x-active', 'x-disabled'].forEach(n => ok(g.validateCustomElementName(n, []), `refuses state suffix "${n}"`));
ok(g.validateCustomElementName('sidebar', []), 'refuses the sidebar namespace');
ok(g.validateCustomElementName('space', []), 'refuses the space var-namespace prefix');
ok(g.validateCustomElementName('chart', []), 'refuses the chart var-namespace prefix');
ok(g.validateCustomElementName('primary', []), 'refuses a semantic role name');
ok(g.validateCustomElementName('', []), 'refuses an empty name');
ok(g.validateCustomElementName('  ', []), 'refuses a blank name');
ok(g.validateCustomElementName('chip', ['chip']), 'refuses an already-registered custom key');
ok(g.validateCustomElementName('Chip', []) === null, 'accepts "Chip" (case-folds to a valid identifier)');
ok(g.validateCustomElementName('chip-2', []) === null, 'accepts digits/hyphens after the first letter');

// --- buildCustomElementSpec: button base, every kind ticked ------------------
{
    const chip = g.buildCustomElementSpec({ key: 'chip', label: 'Chip', base: 'button', parts: ALL_SIX });
    ok(chip.key === 'chip' && chip.label === 'Chip' && chip.custom === true && chip.category === 'custom', 'chip flags');
    ok(chip.base === 'button', 'chip.base');
    ok(JSON.stringify(chip.variants) === JSON.stringify(['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link']), 'chip variants = button variants');
    ok(JSON.stringify(chip.states) === JSON.stringify(['default', 'hover', 'focus', 'active', 'disabled']), 'chip has all five states');
    const partKeys = chip.parts.map(p => p.key);
    ALL_SIX.forEach(k => ok(partKeys.includes(k), `chip keeps offered part ${k}`));
    ['radius', 'gap', 'ring'].forEach(k => ok(partKeys.includes(k), `chip keeps button's extra part ${k}`));
    ok(new Set(partKeys).size === partKeys.length, 'chip has no duplicate part keys');
}

// --- buildCustomElementSpec: variant-less base -> ['default'] ---------------
{
    const note = g.buildCustomElementSpec({ key: 'note', label: 'Note', base: 'card', parts: ALL_SIX });
    ok(JSON.stringify(note.variants) === JSON.stringify(['default']), "a variant-less base yields variants: ['default']");
    const partKeys = note.parts.map(p => p.key);
    ['title', 'description', 'body'].forEach(k => ok(partKeys.includes(k), `note keeps card's ${k}`));
    ok(partKeys.includes('gap'), "note keeps card's gap (not one of the six offered kinds)");
    ok(partKeys.filter(k => k === 'padding').length === 1, 'note has exactly one padding part (not card\'s single-prop one duplicated)');
    ok(note.seedSpec.base['padding.x'] === 'space.6' && note.seedSpec.base['padding.y'] === 'space.6', "note's padding.x/.y both seed from card's single padding slot");
}

// --- buildCustomElementSpec: a base lacking most of the six -> fixed defaults
{
    const tag = g.buildCustomElementSpec({ key: 'tag', label: 'Tag', base: 'separator', parts: ALL_SIX });
    const partKeys = tag.parts.map(p => p.key);
    ALL_SIX.forEach(k => ok(partKeys.includes(k), `tag has offered part ${k} even though separator lacks it`));
    ['line', 'width'].forEach(k => ok(partKeys.includes(k), `tag keeps separator's ${k}`));
    ok(tag.seedSpec.base.bg === 'color.background', 'tag.bg falls to the fixed default (separator has no bg)');
    ok(tag.seedSpec.base['border.color'] === 'color.border' && tag.seedSpec.base['border.width'] === 'border.width.1' && tag.seedSpec.base['border.style'] === 'border.style.solid', 'tag.border falls to the fixed default');
    ok(tag.seedSpec.base['text.color'] === 'color.foreground' && tag.seedSpec.base['text.type'] === 'type.body', 'tag.text falls to the fixed default');
    ok(tag.seedSpec.base.icon === 'color.foreground', 'tag.icon falls to the fixed default');
    ok(tag.seedSpec.base['padding.x'] === 'space.4' && tag.seedSpec.base['padding.y'] === 'space.2', 'tag.padding falls to the fixed default');
    ok(tag.seedSpec.base.shadow === 'shadow.xs', 'tag.shadow falls to the fixed default');
    ok(tag.seedSpec.base.line === 'color.border' && tag.seedSpec.base.width === 'border.width.1', "tag keeps separator's own seeds for its kept parts");
}

ok(g.buildCustomElementSpec({ key: 'x', label: 'X', base: 'not-a-real-element', parts: [] }) === null, 'unknown base -> null');

// --- register a full set of custom elements and sweep every iterator --------
const chip = g.buildCustomElementSpec({ key: 'chip', label: 'Chip', base: 'button', parts: ALL_SIX });
const note = g.buildCustomElementSpec({ key: 'note', label: 'Note', base: 'card', parts: ALL_SIX });
const tag = g.buildCustomElementSpec({ key: 'tag', label: 'Tag', base: 'separator', parts: ALL_SIX });
const check = g.buildCustomElementSpec({ key: 'check', label: 'Check', base: 'checkbox', parts: ALL_SIX });
g.setCustomElements([chip, note, tag, check]);

ok(JSON.stringify(g.ELEMENTS.map(e => e.key)) === JSON.stringify(STOCK_KEYS), 'stock EXPECTED_KEYS unchanged after registering customs');
ok(g.allElements().map(e => e.key).slice(-4).join(',') === 'chip,note,tag,check', 'allElements() appends the registry in order');

const allIds = g.componentTokenIds();
['chip', 'note', 'tag', 'check'].forEach(elKey => {
    const ids = allIds.filter(id => id.startsWith(`${elKey}.`));
    ok(ids.length > 0, `${elKey} contributes ids`);
    ids.forEach(id => {
        const p = g.tokenIdParts(id);
        ok(p && p.state === 'default', `${id} parses as default state`);
        ok(g.tokenId(p.element, p.variant, p.part, p.prop) === id, `${id} round-trips`);
        ok(g.propKind(p.element, p.part, p.prop) !== null, `${id} has a resolvable prop kind`);
    });
});
ok(new Set(allIds).size === allIds.length, 'every id (stock + custom) is unique');

// --- seeds valid on both foundations, every custom id ------------------------
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ['chip', 'note', 'tag', 'check'].forEach(elKey => {
        allIds.filter(id => id.startsWith(`${elKey}.`)).forEach(id => {
            const p = g.tokenIdParts(id);
            const kind = g.propKind(p.element, p.part, p.prop);
            ok(seeds[id] !== undefined, `${source}: ${id} has no seed`);
            assertRefValid(seeds[id], kind, source, `${source} seed ${id}`);
        });
    });
});

// --- resolveComponentRef: chip's hover equals button's SEEDED hover ref -----
ok(g.resolveComponentRef('chip.primary.bg.hover', {}) === g.resolveComponentRef('button.primary.bg.hover', {}), "chip's seeded hover ref equals button's");
ok(g.resolveComponentRef('chip.outline.bg.hover', {}) === 'color.accent', "chip's outline hover carries button's seeded delta (accent)");
ok(g.resolveComponentRef('chip.primary.bg', {}) === 'color.primary', "chip's primary bg matches button's primary bg");
ok(g.resolveComponentRef('note.default.bg', {}) === 'color.card', "note's bg matches card's bg");
ok(g.resolveComponentRef('note.default.bg.hover', {}) === 'color.card', 'a state card never seeded still resolves (falls back to the default)');
ok(g.resolveComponentRef('garbage.id', {}) === null, 'unknown id -> null');

// --- customElementLiveOverrides: the base's LIVE edits, not just its seed ---
// buildCustomElementSpec/seedSpec covers the deterministic half of "starts
// from the base's values" (tested above against an empty override map);
// this is the other half - an explicit edit already made to the base is
// copied onto the new element's matching id at creation.
{
    const buttonSpec = g.elementSpec('button');
    const cardSpec = g.elementSpec('card');
    // no live edits on the base at all -> nothing to copy
    ok(Object.keys(g.customElementLiveOverrides({}, buttonSpec, chip)).length === 0, 'no base overrides -> empty result');
    ok(Object.keys(g.customElementLiveOverrides(null, buttonSpec, chip)).length === 0, 'null components -> empty result (never throws)');

    // a default-state override on the variant the chip shares with the base
    const liveButton = { 'button.primary.bg': 'palette.rose-600', 'button.secondary.bg': 'palette.rose-600' };
    const chipFromLiveButton = g.customElementLiveOverrides(liveButton, buttonSpec, chip);
    ok(chipFromLiveButton['chip.primary.bg'] === 'palette.rose-600', "button's live primary.bg override carries onto chip.primary.bg");
    ok(chipFromLiveButton['chip.secondary.bg'] === 'palette.rose-600', "button's live secondary.bg override carries onto chip.secondary.bg");
    ok(Object.keys(chipFromLiveButton).length === 2, 'only the overridden ids are copied - nothing else invented');

    // a state-specific override maps to that same state, not to default
    const hoverOnly = { 'button.primary.bg.hover': 'palette.amber-500' };
    const chipFromHover = g.customElementLiveOverrides(hoverOnly, buttonSpec, chip);
    ok(chipFromHover['chip.primary.bg.hover'] === 'palette.amber-500', "a hover-only base override maps to chip's hover id");
    ok(chipFromHover['chip.primary.bg'] === undefined, 'a hover-only override never leaks onto the default id');

    // a kept extra part (button's radius, not one of the six offered kinds) -
    // still carries the variant segment, same as any other button id
    const radiusEdit = { 'button.primary.radius': 'radius.full' };
    ok(g.customElementLiveOverrides(radiusEdit, buttonSpec, chip)['chip.primary.radius'] === 'radius.full', "a kept part's live edit (radius) carries over too");

    // variant-less base (card): its single edit carries onto the chip's
    // synthetic "default" variant id, and a kept text part (title) works too
    const liveCard = { 'card.bg': 'palette.slate-900', 'card.title.color': 'palette.slate-50' };
    const noteFromLiveCard = g.customElementLiveOverrides(liveCard, cardSpec, note);
    ok(noteFromLiveCard['note.default.bg'] === 'palette.slate-900', "a variant-less base's live bg override carries onto note.default.bg");
    ok(noteFromLiveCard['note.default.title.color'] === 'palette.slate-50', "a variant-less base's kept-part live override (title.color) carries over");

    // single-prop base padding (card.padding) fans out to BOTH of the
    // custom shape's offered padding.x/padding.y - the same merge
    // buildCustomElementSpec's own seed half already does.
    const paddingEdit = { 'card.padding': 'space.10' };
    const noteFromPadding = g.customElementLiveOverrides(paddingEdit, cardSpec, note);
    ok(noteFromPadding['note.default.padding.x'] === 'space.10' && noteFromPadding['note.default.padding.y'] === 'space.10', "card's single-prop padding override fans out to note's padding.x AND padding.y");

    // a `components` map crowded with every OTHER element's own overrides
    // never leaks onto the new one - only ids actually computed from the
    // real base's own matching slots are ever looked up.
    const crowded = { 'button.primary.bg': 'palette.rose-600', 'input.text.color': 'palette.blue-500', 'card.bg': 'palette.green-500', 'separator.line': 'palette.pink-500' };
    const chipFromCrowded = g.customElementLiveOverrides(crowded, buttonSpec, chip);
    ok(Object.keys(chipFromCrowded).length === 1 && chipFromCrowded['chip.primary.bg'] === 'palette.rose-600', "only the base's own overrides are copied - other elements sharing the same map never leak onto the new one");
}

// --- componentVarLines: no null/undefined across every part kind on both sources
SOURCES.forEach(source => {
    const css = g.componentVarLines({}, source);
    ['chip', 'note', 'tag', 'check'].forEach(elKey => {
        const lines = css.split('\n').filter(l => l.includes(`--${elKey}-`));
        ok(lines.length > 0, `${source}: ${elKey} contributes var lines`);
        lines.forEach(line => {
            ok(!/undefined|null/.test(line), `${source}: no null/undefined - "${line}"`);
            ok(/^  --[a-z0-9-]+: var\(--[a-z0-9-]+\);$/.test(line), `${source}: well-formed line "${line}"`);
        });
    });
});

// --- buildWiringCss covers every custom element, default + a state block ---
{
    const wiring = g.buildWiringCss();
    ['chip', 'note', 'tag', 'check'].forEach(elKey => ok(wiring.includes(`[data-element="${elKey}"]`), `wiring mentions ${elKey}`));
    ok(wiring.includes('[data-element="chip"][data-variant="primary"] {\n  --_bg: var(--chip-primary-bg);'), 'chip primary default block');
    ok(wiring.includes('[data-element="chip"][data-variant="primary"]:is(:hover:not([data-state]), [data-state="hover"]) {'), 'chip primary hover block');
    ok(/\[data-element="note"\]\[data-variant="default"\]:is\(:hover/.test(wiring), 'note gets a hover state block even though card itself has only ["default"]');
}

// --- components.css still reads only privates the wiring defines -----------
{
    const wiring = g.buildWiringCss();
    const css = fs.readFileSync(path.join(root, 'preview', 'components.css'), 'utf8');
    const defined = new Set(wiring.match(/--_[a-z0-9-]+(?=:)/g));
    const cssState = new Set(['--_ring-on', '--_mark-on', '--_thumb-shift']);
    const used = new Set(css.match(/--_[a-z0-9-]+/g));
    used.forEach(v => ok(defined.has(v) || cssState.has(v), `components.css (with customs registered) reads undefined private ${v}`));
}

// --- generic markup: every enabled part renders with data-part -------------
// bg/border/padding/shadow paint the shared ROOT (one data-part value - "bg"
// when ticked, per the DoD's "root box painted by bg/border/padding/shadow"),
// exactly like a stock element's root (button's is always data-part="bg" too
// - see components.test.js's disabled-button assertion). icon/text and every
// KEPT-EXTRA part each get their OWN clickable data-part child.
['chip', 'note', 'tag', 'check'].forEach(elKey => {
    const spec = g.elementSpec(elKey);
    const variant = spec.variants[0];
    const html = g.renderCustomInstance(spec, variant, 'default');
    ok(html.includes(`data-element="${elKey}"`), `${elKey} instance carries data-element`);
    ok(html.includes(`data-variant="${variant}"`), `${elKey} instance carries data-variant`);
    const rootPart = spec.parts.some(p => p.key === 'bg') ? 'bg' : spec.parts[0].key;
    ok(html.includes(`data-part="${rootPart}"`), `${elKey} root carries data-part="${rootPart}"`);
    ['icon', 'text'].forEach(k => {
        if (spec.parts.some(p => p.key === k)) ok(html.includes(`data-part="${k}"`), `${elKey} renders a data-part="${k}" child`);
    });
    spec.parts.filter(p => !ALL_SIX.includes(p.key)).forEach(part =>
        ok(html.includes(`data-part="${part.key}"`), `${elKey} renders data-part="${part.key}" for its kept extra part`));
    ok(!/#[0-9a-f]{3,8}\b/i.test(html), `${elKey} instance has no literal hex colours`);
    ok(!/style="[^"]*\b\d+(\.\d+)?(rem|px)\b/.test(html), `${elKey} instance has no literal rem/px in an inline style`);
});
// icon/text children are conditional on those kinds being ticked
{
    const untickedIcon = g.buildCustomElementSpec({ key: 'plain', label: 'Plain', base: 'button', parts: ['bg', 'border', 'padding', 'shadow'] });
    const html = g.renderCustomInstance(untickedIcon, untickedIcon.variants[0], 'default');
    ok(!html.includes('data-part="icon"'), 'icon child absent when icon is unticked');
    ok(!html.includes('data-part="text"'), 'text child absent when text is unticked');
}

// --- buildCustomGalleryHtml: the control + one stage per custom element ----
{
    const html = g.buildCustomGalleryHtml();
    ok(html.startsWith('<section class="gallery-category" id="cat-custom"'), 'custom section id/class');
    ok(html.includes('data-action="new-custom-element"'), 'the New custom element control is present');
    ['chip', 'note', 'tag', 'check'].forEach(elKey => {
        ok(html.includes(`id="gallery-${elKey}"`), `${elKey} has a gallery section`);
        ok(html.includes(`data-gallery-element="${elKey}"`), `${elKey} stage is findable by syncGalleryStages`);
    });
}
ok(g.buildCustomGalleryHtml().includes('New custom element'), 'the control names itself');
{
    // empty registry: the section holds only the control
    g.setCustomElements([]);
    const empty = g.buildCustomGalleryHtml();
    ok(empty.includes('data-action="new-custom-element"'), 'empty custom section still has the control');
    ok(!/gallery-section/.test(empty), 'empty custom section has no specimen sections');
    g.setCustomElements([chip, note, tag, check]); // restore for the assertions below
}

// --- custom elements never join the stock ("All") gallery order ------------
{
    const html = g.buildGalleryHtml();
    ['chip', 'note', 'tag', 'check'].forEach(elKey => {
        ok(!html.includes(`data-element="${elKey}"`), `${elKey} is absent from the stock gallery`);
        ok(!html.includes(`id="gallery-${elKey}"`), `${elKey} has no stock gallery section`);
    });
    ok(!html.includes('id="cat-custom"'), 'the stock gallery never renders a #cat-custom section itself');
}

// --- setCustomElements([]) removes every custom id --------------------------
{
    g.setCustomElements([]);
    const ids = g.componentTokenIds();
    ok(!ids.some(id => /^(chip|note|tag|check)\./.test(id)), 'clearing the registry removes every custom id');
    ok(JSON.stringify(g.ELEMENTS.map(e => e.key)) === JSON.stringify(STOCK_KEYS), 'ELEMENTS itself is still untouched');
    g.setCustomElements([chip, note, tag, check]); // restore
}

// --- customElementsSnapshot(): JSON-safe, not a live reference --------------
{
    const snap = g.customElementsSnapshot();
    ok(Array.isArray(snap) && snap.length === 4, 'snapshot has one entry per registered element');
    ok(JSON.stringify(snap.find(s => s.key === 'chip')) === JSON.stringify(chip), 'a snapshot entry deep-equals the registered spec');
    snap[0].label = 'MUTATED';
    ok(g.elementSpec('chip').label !== 'MUTATED' || snap[0].key !== 'chip', 'mutating the snapshot never touches the live registry');
}

// --- customElementMissingKinds / customPartIds ------------------------------
{
    ok(g.customElementMissingKinds(g.elementSpec('chip')).length === 0, 'chip (all six + kept extras) has no missing kind');
    const partial = g.buildCustomElementSpec({ key: 'partialtest', label: 'PartialTest', base: 'button', parts: ['bg', 'text', 'border'] });
    ok(JSON.stringify(g.customElementMissingKinds(partial).slice().sort()) === JSON.stringify(['icon', 'padding', 'shadow']), 'missing kinds are exactly the six minus the ones already present');

    const chipIconIds = new Set(g.customPartIds(g.elementSpec('chip'), 'icon'));
    ok([...chipIconIds].every(id => /^chip\.[^.]+\.icon(\.|$)/.test(id)), 'customPartIds(chip, icon) only names chip icon ids');
    ok(chipIconIds.size === 6 * 5, 'customPartIds(chip, icon) covers every variant (6) x state (5)');
    ok(g.customPartIds(g.elementSpec('chip'), 'not-a-part').length === 0, 'customPartIds for an absent part key is empty');
}

// --- removeCustomPart: exact id removal, pure, refusals ---------------------
{
    const chipSpec = g.elementSpec('chip');
    const compsBefore = g.seedComponentTokens('tailwind', { radiusRem: 0.5 });
    const removed = g.removeCustomPart(chipSpec, compsBefore, 'icon');
    ok(!removed.error, 'removeCustomPart(icon) succeeds while five other parts remain');
    ok(!removed.spec.parts.some(p => p.key === 'icon'), "icon is gone from the returned spec's part list");
    ok(chipSpec.parts.some(p => p.key === 'icon'), 'the ORIGINAL spec object is left untouched (pure)');
    ok(compsBefore['chip.primary.icon'] !== undefined, 'sanity: compsBefore actually had icon ids to drop');

    // customPartIds() names every POSSIBLE (variant x state) id (30 here);
    // compsBefore (a fresh seed map) is sparse - a hover/focus/active id only
    // has an EXPLICIT entry where button's own SEED_SPEC carries a state
    // delta for that slot (14 of the 30 for icon). The invariant is "removing
    // a part deletes EXACTLY that part's ids and nothing else", checked both
    // ways: every key actually dropped belongs to the removed part, AND none
    // of that part's ids (present or not) survive in the result.
    const expectedDropped = new Set(g.customPartIds(chipSpec, 'icon'));
    const actuallyDropped = Object.keys(compsBefore).filter(id => !Object.prototype.hasOwnProperty.call(removed.components, id));
    ok(actuallyDropped.length > 0, 'sanity: at least the seeded default-state icon ids were actually dropped');
    ok(actuallyDropped.every(id => expectedDropped.has(id)), 'every dropped key belongs to the removed part (icon) - nothing else was touched');
    ok(![...expectedDropped].some(id => Object.prototype.hasOwnProperty.call(removed.components, id)), 'no icon id survives in the returned components map');
    Object.keys(removed.components).forEach(id => ok(removed.components[id] === compsBefore[id], `${id}: every kept id's value is untouched by the removal`));

    // Sweep the other iterators with the edited spec actually registered.
    g.setCustomElements([removed.spec, note, tag, check]);
    ok(!g.componentTokenIds().some(id => /^chip\.[^.]+\.icon(\.|$)/.test(id)), 'componentTokenIds() lists no chip.*.icon id once icon is removed');
    const wiringAfterRemove = g.buildWiringCss();
    ok(!wiringAfterRemove.includes('--_icon: var(--chip-'), 'the wiring sheet assigns no --_icon private for chip any more');
    ['tailwind', 'atlassian'].forEach(source => {
        const css = g.componentVarLines(removed.components, source);
        ok(!/undefined|null/.test(css), `${source}: componentVarLines has no null/undefined after removing icon`);
    });
    g.setCustomElements([chip, note, tag, check]); // restore the shared registry

    // Refusals: the last remaining part, and an absent key.
    const single = {
        key: 'onepart', label: 'OnePart', category: 'custom', custom: true, base: 'separator',
        variants: ['default'], states: ['default', 'hover', 'focus', 'active', 'disabled'],
        parts: [g.elementSpec('separator').parts[0]], seedSpec: { base: {}, variants: {}, states: {} }
    };
    const lastPartRefusal = g.removeCustomPart(single, {}, single.parts[0].key);
    ok(!!lastPartRefusal.error, 'removing the last remaining part is refused');
    ok(lastPartRefusal.spec === undefined && lastPartRefusal.components === undefined, 'a refusal carries no spec/components');
    const absentKeyRefusal = g.removeCustomPart(chipSpec, {}, 'not-a-real-part');
    ok(!!absentKeyRefusal.error, 'removing an absent part key is refused');
}

// --- addCustomPart: seeded from the base (or the per-part default), pure,
// refusals; writes EXPLICIT ids (dtcg.js's export walks `components`, not
// the spec, so an id only reachable through resolveComponentRef's seed
// fallback would never reach tokens.json) ----------------------------------
{
    const chipNoShadow = g.buildCustomElementSpec({ key: 'chiptest', label: 'ChipTest', base: 'button', parts: ALL_SIX.filter(k => k !== 'shadow') });
    ok(!chipNoShadow.parts.some(p => p.key === 'shadow'), 'sanity: chiptest has no shadow part yet');
    const ctx = { radiusRem: 0.5 };
    const added = g.addCustomPart(chipNoShadow, {}, 'shadow', 'tailwind', ctx);
    ok(!added.error, 'addCustomPart(shadow) succeeds for a missing kind');
    ok(added.spec.parts[added.spec.parts.length - 1].key === 'shadow', 'the new part lands LAST in spec.parts');
    ok(!chipNoShadow.parts.some(p => p.key === 'shadow'), 'the ORIGINAL spec object is left untouched (pure)');

    // Register BEFORE resolving: a state id with no explicit entry and no
    // seeded delta falls back through tokenIdParts (resolveComponentRef) to
    // its own default id, which needs the registry - exactly what the real
    // app's applyCustomElementsChange() guarantees before any repaint reads
    // resolveComponentRef (see the "persistence round trip" group below for
    // the same registration-order hazard spelled out in full).
    g.setCustomElements([added.spec]);
    chipNoShadow.variants.forEach(variant => {
        chipNoShadow.states.forEach(state => {
            const id = g.tokenId(added.spec, variant, 'shadow', 'shadow', state);
            const got = g.resolveComponentRef(id, added.components, 'tailwind');
            const want = g.resolveComponentRef(g.tokenId('button', variant, 'shadow', 'shadow', state), {}, 'tailwind');
            ok(got !== null && got === want, `${id}: seeded shadow (${got}) equals button's own seeded shadow (${want})`);
            assertRefValid(got, 'shadow', 'tailwind', id);
        });
    });
    ok(g.componentTokenIds().includes('chiptest.primary.shadow'), 'componentTokenIds() includes the newly added default-state id');
    const wiringAfterAdd = g.buildWiringCss();
    ok(wiringAfterAdd.includes('--_shadow: var(--chiptest-primary-shadow);'), 'wiring assigns the new shadow private for chiptest');
    g.setCustomElements([chip, note, tag, check]); // restore

    // A base lacking the kind entirely (separator has no shadow) falls to
    // CUSTOM_PART_DEFAULTS, remapped like any other seed on a non-Tailwind source.
    const tagNoShadow = g.buildCustomElementSpec({ key: 'tagtest', label: 'TagTest', base: 'separator', parts: ALL_SIX.filter(k => k !== 'shadow') });
    const addedTag = g.addCustomPart(tagNoShadow, {}, 'shadow', 'tailwind', ctx);
    ok(g.resolveComponentRef(g.tokenId(addedTag.spec, 'default', 'shadow', 'shadow', 'default'), addedTag.components, 'tailwind') === 'shadow.xs',
        "a base lacking the part falls to CUSTOM_PART_DEFAULTS.shadow ('shadow.xs')");
    const addedTagAtlassian = g.addCustomPart(tagNoShadow, {}, 'shadow', 'atlassian', ctx);
    const atlassianShadow = g.resolveComponentRef(g.tokenId(addedTagAtlassian.spec, 'default', 'shadow', 'shadow', 'default'), addedTagAtlassian.components, 'atlassian');
    assertRefValid(atlassianShadow, 'shadow', 'atlassian', 'tagtest.default.shadow (atlassian)');

    // Refusals: an already-present kind, and an unknown kind - pure (inputs untouched).
    const chipSpecForAdd = g.elementSpec('chip');
    const partsBefore = chipSpecForAdd.parts.length;
    const alreadyPresent = g.addCustomPart(chipSpecForAdd, {}, 'shadow', 'tailwind', ctx);
    ok(!!alreadyPresent.error, 'adding a kind already on the spec is refused');
    const unknownKind = g.addCustomPart(chipSpecForAdd, {}, 'not-a-kind', 'tailwind', ctx);
    ok(!!unknownKind.error, 'adding a kind outside the six is refused');
    ok(chipSpecForAdd.parts.length === partsBefore, 'a refused add leaves the spec untouched (pure)');
}

// --- buildCustomElementHeaderHtml: name/base read-only, a remove control per
// part, an add row for exactly the missing kinds, custom-only -------------
{
    const full = g.elementSpec('chip'); // registered: all six + kept radius/gap/ring
    const html = g.buildCustomElementHeaderHtml({ selection: { element: full, variant: 'primary', part: 'bg', state: 'default' } });
    ok(html.includes('Chip'), 'header names the element');
    ok(html.includes('Button'), 'header names the base');
    full.parts.forEach(part => {
        ok(html.includes(`data-part-remove="${part.key}"`), `remove control for ${part.key}`);
        ok(html.includes(part.label), `header lists the ${part.key} label ("${part.label}")`);
    });
    ok(!/data-part-add=/.test(html), 'no add control offered when all six kinds are already present');
    ok(!/data-ref=|data-variant=|data-state=/.test(html), 'no assignable refs, no strip picks');

    const partial = g.buildCustomElementSpec({ key: 'partialtest2', label: 'PartialTest2', base: 'button', parts: ['bg', 'text', 'border'] });
    const partialHtml = g.buildCustomElementHeaderHtml({ selection: { element: partial, variant: partial.variants[0], part: 'bg', state: 'default' } });
    ['bg', 'border', 'text', 'radius', 'gap', 'ring'].forEach(k => ok(partialHtml.includes(`data-part-remove="${k}"`), `remove control for kept/offered part ${k}`));
    ['icon', 'padding', 'shadow'].forEach(k => ok(partialHtml.includes(`data-part-add="${k}"`), `add control offers missing kind ${k}`));
    ['bg', 'border', 'text'].forEach(k => ok(!partialHtml.includes(`data-part-add="${k}"`), `add control never offers already-present kind ${k}`));

    ok(g.buildCustomElementHeaderHtml({ selection: { element: 'button', variant: 'primary', part: 'bg', state: 'default' } }) === '', 'a stock selection prints nothing');
    ok(g.buildCustomElementHeaderHtml({ selection: null }) === '', 'no selection prints nothing');
    ok(g.buildCustomElementHeaderHtml(undefined) === '', 'no ctx prints nothing');
}

// --- persistence round trip (card 19): spec list + components -> snapshot -
// stringify/parse (the exact hop buildSystemSnapshot()/localStorage/
// systems/<name>.json all go through) -> load -> same allElements()/
// componentTokenIds(), and every custom id still resolves (never var(null)).
// Regression this guards against: seedsFor()'s _seedCache is keyed by
// source+radius only, so a seed map computed BEFORE a custom element is
// registered (e.g. at page start, or from whatever system was live a moment
// before a new one loads) must never survive past the setCustomElements()
// call that follows it - loadTheme()/applyLoaded() always register a
// system's OWN custom elements before its components map is used for
// anything, and setCustomElements() itself busts the cache.
{
    // Poison the cache the way a page start (or a load with NO custom
    // elements) would: read a stock id with the registry EMPTY, so
    // _seedCache["tailwind|..."] gets computed and stored with no
    // "chip."/"note." keys in it at all.
    g.setCustomElements([]);
    const buttonHover = g.resolveComponentRef('button.primary.bg.hover', {});
    ok(buttonHover, 'sanity: button has a seeded hover to compare against');

    // Register two elements from different bases (the DoD's own example) -
    // exactly what loadTheme() does before touching state.components.
    g.setCustomElements([chip, note]);
    ok(g.resolveComponentRef('chip.primary.bg.hover', {}) === buttonHover, "chip's hover resolves correctly right after registering (the pre-registration cache never survives the register call)");

    const rtComponents = { ...g.seedComponentTokens('tailwind', { radiusRem: 0.5 }), 'chip.primary.bg': 'palette.amber-500' };
    const before = {
        keys: g.allElements().map(e => e.key),
        ids: g.componentTokenIds(),
        chipHover: g.resolveComponentRef('chip.primary.bg.hover', rtComponents),
        noteBg: g.resolveComponentRef('note.default.bg', rtComponents)
    };
    ok(before.keys.slice(-2).join(',') === 'chip,note', 'registry order is creation order (chip before note)');

    // The exact hop a save/reload puts this through.
    const saved = JSON.parse(JSON.stringify({ customElements: g.customElementsSnapshot(), components: rtComponents }));

    // "Loading another design system replaces the list" - go through an
    // empty registry in between, so nothing survives by coincidence.
    g.setCustomElements([]);
    ok(g.allElements().length === g.ELEMENTS.length, 'loading a different system with no customs empties the registry');
    ok(g.componentTokenIds().every(id => !id.startsWith('chip.') && !id.startsWith('note.')), 'no chip./note. ids remain while the registry is empty');

    // "Load" the saved system.
    g.setCustomElements(saved.customElements);

    assert.deepStrictEqual(g.allElements().map(e => e.key), before.keys, 'allElements() after the round trip matches before it, same order');
    assert.deepStrictEqual(g.componentTokenIds(), before.ids, 'componentTokenIds() after the round trip matches before it');
    ok(g.resolveComponentRef('chip.primary.bg.hover', saved.components) === before.chipHover, "chip's hover resolves to the same value after the round trip");
    ok(g.resolveComponentRef('note.default.bg', saved.components) === before.noteBg, "note's bg resolves to the same value after the round trip, independent of chip's override");
    ok(saved.components['chip.primary.bg'] === 'palette.amber-500', "chip's explicit override survives the JSON hop untouched");

    ['tailwind', 'atlassian'].forEach(source => {
        const css = g.componentVarLines(saved.components, source);
        ok(!/var\(null\)|var\(undefined\)/.test(css), `${source}: no var(null)/var(undefined) anywhere after the round trip`);
    });

    // Compat: a system with no customElements field (an old browser save)
    // must load as ELEMENTS only - "missing => []", never "keep current".
    g.setCustomElements(undefined);
    ok(JSON.stringify(g.allElements().map(e => e.key)) === JSON.stringify(STOCK_KEYS), 'a system with no customElements field loads as ELEMENTS only');

    g.setCustomElements([chip, note, tag, check]); // restore the file's shared registry
}

// --- variantNameError: refusals + acceptance (card [21]) --------------------
// Reuses card 18's identifier rule but never case-folds - a variant IS the
// token-id segment (no separate key/label pair like an element has), so
// "Warning" must be refused, not silently lowered to "warning".
{
    const chipSpec = g.elementSpec('chip');
    ['warning-hover', 'primary', 'Warning', 'hover', ''].forEach(n =>
        ok(!!g.variantNameError(chipSpec, n), `variantNameError refuses "${n}"`));
    ok(g.variantNameError(chipSpec, 'warning') === null, 'variantNameError accepts "warning"');
    ['focus', 'active', 'disabled', 'x-focus', 'x-active', 'x-disabled'].forEach(n =>
        ok(!!g.variantNameError(chipSpec, n), `variantNameError refuses state-shaped name "${n}"`));
    ok(!!g.variantNameError(chipSpec, '  '), 'variantNameError refuses a blank name');
    ok(!!g.variantNameError(chipSpec, 'My Warning'), 'variantNameError refuses a non-identifier (space/case)');
    ok(!!g.variantNameError(chipSpec, '1warning'), 'variantNameError refuses a non-identifier (leading digit)');
    ok(!!g.variantNameError(chipSpec, 'secondary'), 'variantNameError refuses an already-present variant');
}

// --- addVariantToSpec: 7 variants, new last, pure, ids parse against the
// updated registry, every pre-existing id is unchanged, wiring covers it ---
{
    const chipSpec = g.elementSpec('chip');
    const seeded = g.seedComponentTokens('tailwind', { radiusRem: 0.5 });
    const before = g.componentTokenIds();

    const added = g.addVariantToSpec(chipSpec, seeded, 'warning', 'primary', 'tailwind');
    ok(!added.error, 'addVariantToSpec("warning") succeeds');
    ok(added.spec.variants.length === 7, 'chip now has 7 variants');
    ok(added.spec.variants[6] === 'warning', 'the new variant lands last');
    ok(chipSpec.variants.length === 6 && !chipSpec.variants.includes('warning'), 'the ORIGINAL spec object is left untouched (pure)');

    g.setCustomElements([added.spec, note, tag, check]);
    const parsed = g.tokenIdParts('chip.warning.bg.hover');
    ok(parsed && parsed.element === 'chip' && parsed.variant === 'warning' && parsed.part === 'bg' && parsed.state === 'hover',
        'chip.warning.bg.hover parses against the updated registry');
    const after = g.componentTokenIds();
    before.forEach(id => ok(after.includes(id), `pre-existing id ${id} still valid after the add`));
    before.filter(id => id.startsWith('chip.')).forEach(id =>
        ok(g.resolveComponentRef(id, added.components, 'tailwind') === g.resolveComponentRef(id, seeded, 'tailwind'), `${id}: unchanged by the add`));
    ok(after.includes('chip.warning.bg'), 'chip.warning.bg exists after the add');

    const wiring = g.buildWiringCss();
    ok(wiring.includes('[data-element="chip"][data-variant="warning"] {'), 'wiring has a default-state block for the new variant');
    ok(/\[data-element="chip"\]\[data-variant="warning"\]:is\(:hover/.test(wiring), 'wiring has a hover-state block for the new variant');
    g.setCustomElements([chip, note, tag, check]); // restore
}

// --- copyVariantTokens: every new id resolves validly on both foundations,
// no null/undefined in the emitted CSS, and the leaf SET it writes (which
// ids get an EXPLICIT entry) exactly matches the variant copied from - so
// component.chip.warning ends up with the same default/hover/focus/active/
// disabled shape as component.chip.primary (which equals button.primary's:
// defaults for every part x prop, plus only border.color-focus and
// bg/text.color/icon/border.color-disabled, since button's SEED_SPEC has no
// hover/active delta for its primary variant) -----------------------------
SOURCES.forEach(source => {
    const chipSpec = g.elementSpec('chip');
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.5 });
    const copied = g.addVariantToSpec(chipSpec, seeds, 'warning', 'primary', source);
    ok(!copied.error, `${source}: addVariantToSpec succeeds`);
    chipSpec.parts.forEach(part => part.props.forEach(prop => {
        const id = g.tokenId(chipSpec, 'warning', part.key, prop.key);
        assertRefValid(copied.components[id], g.propKind(chipSpec.key, part.key, prop.key), source, id);
    }));

    // componentVarLines()/buildWiringCss() iterate the REGISTERED spec's own
    // variants (allElements()), not whatever spec object is handed to them -
    // register the copy (7 variants) so the new one is actually swept.
    g.setCustomElements([copied.spec, note, tag, check]);
    const css = g.componentVarLines(copied.components, source);
    ok(!/null|undefined/.test(css), `${source}: componentVarLines has no null/undefined after copying the new variant`);

    const warningLeaves = Object.keys(copied.components).filter(id => id.startsWith('chip.warning.')).map(id => id.slice('chip.warning.'.length)).sort();
    const primaryLeaves = Object.keys(seeds).filter(id => id.startsWith('chip.primary.')).map(id => id.slice('chip.primary.'.length)).sort();
    ok(warningLeaves.length > 0 && JSON.stringify(warningLeaves) === JSON.stringify(primaryLeaves),
        `${source}: chip.warning.* leaf set equals the chip.primary.* leaf set it was copied from`);

    if (source === 'tailwind') {
        ok(css.includes('  --chip-warning-bg: var(--primary);'), 'componentVarLines emits --chip-warning-bg: var(--primary)');
        ok(css.includes('  --chip-warning-border-color-focus: var(--ring);'), 'componentVarLines emits the copied focus delta (border.color-focus)');
    }
    g.setCustomElements([chip, note, tag, check]); // restore
});

// --- independence: editing one variant's token never touches another's ----
{
    const chipSpec = g.elementSpec('chip');
    const seeded = g.seedComponentTokens('tailwind', { radiusRem: 0.5 });
    const withWarning = g.addVariantToSpec(chipSpec, seeded, 'warning', 'primary', 'tailwind').components;
    const primaryBgBefore = withWarning['chip.primary.bg'];
    const edited = { ...withWarning, 'chip.warning.bg': 'palette.amber-500' };
    ok(edited['chip.primary.bg'] === primaryBgBefore, "editing chip.warning.bg leaves chip.primary.bg untouched (assigning parts on it doesn't change other variants)");
}

// --- dropVariantTokens: exact removal, pure; removeVariantFromSpec: same
// drop plus the spec edit, refusals for an absent name and the last one ----
{
    const chipSpec = g.elementSpec('chip');
    const seeded = g.seedComponentTokens('tailwind', { radiusRem: 0.5 });
    const withWarning = g.addVariantToSpec(chipSpec, seeded, 'warning', 'primary', 'tailwind');

    const dropped = g.dropVariantTokens(withWarning.components, 'chip', 'warning');
    const droppedKeys = Object.keys(withWarning.components).filter(id => !Object.prototype.hasOwnProperty.call(dropped, id));
    ok(droppedKeys.length > 0, 'sanity: dropVariantTokens actually removed something');
    ok(droppedKeys.every(id => { const seg = id.split('.'); return seg[0] === 'chip' && seg[1] === 'warning'; }), 'every dropped key belongs to chip.warning - nothing else touched');
    ok(!Object.keys(dropped).some(id => { const seg = id.split('.'); return seg[0] === 'chip' && seg[1] === 'warning'; }), 'no chip.warning id survives in the result');
    Object.keys(dropped).forEach(id => ok(dropped[id] === withWarning.components[id], `${id}: every kept id's value is untouched by the removal`));

    const removed = g.removeVariantFromSpec(withWarning.spec, withWarning.components, 'warning');
    ok(!removed.error, 'removeVariantFromSpec("warning") succeeds while 6 others remain');
    ok(removed.spec.variants.length === 6 && !removed.spec.variants.includes('warning'), 'warning is gone from the returned spec');
    ok(withWarning.spec.variants.includes('warning'), 'the ORIGINAL spec object is left untouched (pure)');
    ok(JSON.stringify(Object.keys(removed.components).sort()) === JSON.stringify(Object.keys(dropped).sort()), 'removeVariantFromSpec drops exactly what dropVariantTokens drops');

    const absent = g.removeVariantFromSpec(chipSpec, seeded, 'not-a-variant');
    ok(!!absent.error, 'removing an absent variant name is refused');
    const single = {
        key: 'onevariant', label: 'OneVariant', category: 'custom', custom: true, base: 'separator',
        variants: ['default'], states: ['default', 'hover', 'focus', 'active', 'disabled'],
        parts: [g.elementSpec('separator').parts[0]], seedSpec: { base: {}, variants: {}, states: {} }
    };
    const lastVariantRefusal = g.removeVariantFromSpec(single, {}, 'default');
    ok(!!lastVariantRefusal.error, 'removing the last remaining variant is refused');
    ok(lastVariantRefusal.spec === undefined && lastVariantRefusal.components === undefined, 'a refusal carries no spec/components');
}

// --- a variant-less base (note, from card): variants stay ['default']
// (regression, card [18]); adding a second variant keeps note.default.* ids
// exactly as they were, and a custom element always has at least one variant
// (adding never changes the shape of existing token ids) -------------------
{
    const noteSpec = g.elementSpec('note');
    ok(JSON.stringify(noteSpec.variants) === JSON.stringify(['default']), "note's variants are exactly ['default']");
    const seeded = g.seedComponentTokens('tailwind', { radiusRem: 0.5 });
    const beforeNoteIds = {};
    Object.keys(seeded).filter(id => id.startsWith('note.')).forEach(id => { beforeNoteIds[id] = seeded[id]; });

    ok(g.variantNameError(noteSpec, 'info') === null, 'variantNameError accepts "info" for note');
    const added = g.addVariantToSpec(noteSpec, seeded, 'info', 'default', 'tailwind');
    ok(!added.error, 'addVariantToSpec("info") succeeds on a variant-less base');
    ok(JSON.stringify(added.spec.variants) === JSON.stringify(['default', 'info']), 'note now has variants [default, info]');
    Object.keys(beforeNoteIds).forEach(id => ok(added.components[id] === beforeNoteIds[id], `${id}: note.default.* id unchanged by adding info`));
    noteSpec.parts.forEach(part => part.props.forEach(prop => {
        const id = g.tokenId(noteSpec, 'info', part.key, prop.key);
        ok(added.components[id] !== undefined && added.components[id] !== null, `${id}: note.info.* id resolves non-null`);
    }));
}

// --- renameCustomElement: validation reuse (self-key excluded from the
// collision set), exact id rewrite across every variant x part x prop x
// state, every other id (stock and other customs) byte-for-byte untouched
// (card [22]) -----------------------------------------------------------------
{
    const specs = [chip, note, tag, check];
    const comps = { ...g.seedComponentTokens('tailwind', { radiusRem: 0.5 }), 'chip.primary.bg.hover': 'palette.amber-500' };

    // Validation reuse: same refusals createCustomElement's own name rules
    // enforce, PLUS the rename-only exclusion of the element's own key.
    ok(!!g.renameCustomElement(specs, comps, 'chip', 'button').error, 'renaming to a stock key is refused');
    ok(!!g.renameCustomElement(specs, comps, 'chip', 'note').error, 'renaming to another custom key is refused');
    ok(!!g.renameCustomElement(specs, comps, 'chip', 'Chip Hover').error, 'renaming to a non-identifier (space) is refused');
    ok(!!g.renameCustomElement(specs, comps, 'chip', 'chip-hover').error, 'renaming to a -hover-suffixed name is refused');
    ok(!!g.renameCustomElement(specs, comps, 'chip', '').error, 'renaming to a blank name is refused');
    ok(!!g.renameCustomElement(specs, comps, 'chip', '   ').error, 'renaming to a whitespace-only name is refused');
    ok(!!g.renameCustomElement(specs, comps, 'chip', 'space').error, 'renaming to a reserved var-namespace prefix is refused');
    ok(!!g.renameCustomElement(specs, comps, 'not-a-key', 'whatever').error, 'renaming an unregistered key is refused');
    const sameKey = g.renameCustomElement(specs, comps, 'chip', 'Chip');
    ok(!sameKey.error && sameKey.key === 'chip', 'renaming "chip" to "Chip" (same derived key) is NOT refused as a self-collision');
    ok(sameKey.specs.find(s => s.key === 'chip').label === 'Chip', 'a same-key rename still applies the (possibly re-cased) label');
    ok(JSON.stringify(Object.keys(sameKey.components).sort()) === JSON.stringify(Object.keys(comps).sort()), 'a same-key rename touches no id (prefix is unchanged)');

    // Full rewrite, registered and unregistered forms.
    const renamed = g.renameCustomElement(specs, comps, 'chip', 'Tag2');
    ok(!renamed.error, 'renameCustomElement("chip" -> "Tag2") succeeds');
    ok(renamed.key === 'tag2', 'derived key is the lowercased trimmed name, same rule createCustomElement uses');
    const renamedSpec = renamed.specs.find(s => s.key === 'tag2');
    ok(renamedSpec && renamedSpec.label === 'Tag2', 'the renamed spec carries the new key and label');
    ok(!renamed.specs.some(s => s.key === 'chip'), 'no spec answers to the old key any more');
    ok(renamed.specs.length === specs.length, 'renaming changes no other spec - same count');
    ['note', 'tag', 'check'].forEach(k => ok(renamed.specs.find(s => s.key === k) === specs.find(s => s.key === k), `${k}'s spec is the SAME object after renaming chip (untouched)`));
    ok(JSON.stringify(specs.map(s => s.key)) === JSON.stringify(['chip', 'note', 'tag', 'check']), 'the ORIGINAL specs array is left untouched (pure)');
    ok(specs.find(s => s.key === 'chip') === chip, 'the ORIGINAL chip spec object is left untouched (pure)');

    const chipIds = Object.keys(comps).filter(id => id.startsWith('chip.'));
    ok(chipIds.length > 0, 'sanity: chip actually has ids to rewrite');
    const distinctParts = new Set(chipIds.map(id => id.split('.')[2]));
    const distinctStates = new Set(chipIds.map(id => g.tokenIdParts(id).state));
    ok(distinctParts.size > 1, 'sanity: chip\'s seeded ids span more than one part');
    ok(distinctStates.size > 1, 'sanity: chip\'s seeded ids span more than one state (default + at least one delta)');
    chipIds.forEach(id => {
        const newId = `tag2${id.slice('chip'.length)}`;
        ok(renamed.components[newId] === comps[id], `${id} -> ${newId}: value carried over unchanged`);
    });
    ok(!Object.keys(renamed.components).some(id => id.startsWith('chip.')), 'no chip.* id survives the rename');
    ok(Object.keys(renamed.components).length === Object.keys(comps).length, 'rename changes no id COUNT - a pure rewrite, never a drop or an add');
    ok(renamed.components['button.primary.bg'] === comps['button.primary.bg'], 'a stock id (button.primary.bg) is untouched by the rename');
    Object.keys(comps).forEach(id => {
        if (id.startsWith('chip.')) return;
        ok(renamed.components[id] === comps[id], `${id}: every non-chip id (stock and other customs) is untouched by the rename`);
    });
    ok(comps['chip.primary.bg.hover'] === 'palette.amber-500', 'sanity: the original components map is untouched (pure)');

    // Exhaustive one-to-one correspondence via componentTokenIds() (every
    // variant x part x prop of the CURRENT spec, default state) - the DoD's
    // own "for every variant/part/state", checked structurally rather than
    // against whichever ids the sparse seed fixture happens to carry.
    const chipDefaultIds = g.componentTokenIds().filter(id => id.startsWith('chip.'));
    g.setCustomElements(renamed.specs);
    const tag2DefaultIds = g.componentTokenIds().filter(id => id.startsWith('tag2.'));
    ok(tag2DefaultIds.length === chipDefaultIds.length && tag2DefaultIds.length > 0, 'the renamed element contributes exactly as many default-state ids as chip did');
    tag2DefaultIds.forEach(id => ok(chipDefaultIds.includes(`chip${id.slice('tag2'.length)}`), `${id} corresponds 1:1 to a chip default id`));
    ok(!g.componentTokenIds().some(id => id.startsWith('chip.')), 'componentTokenIds() lists no chip.* id once the rename is registered');

    const wiringAfterRename = g.buildWiringCss();
    ok(wiringAfterRename.includes('[data-element="tag2"]'), 'wiring sheet uses the new selector');
    ok(!wiringAfterRename.includes('[data-element="chip"]'), 'wiring sheet no longer mentions the old selector');
    SOURCES.forEach(source => {
        const css = g.componentVarLines(renamed.components, source);
        ok(css.includes('--tag2-') && !css.includes('--chip-'), `${source}: componentVarLines emits --tag2-* and no --chip-*`);
        ok(!/null|undefined/.test(css), `${source}: componentVarLines has no null/undefined after the rename`);
    });
    g.setCustomElements([chip, note, tag, check]); // restore the shared registry
}

// --- deleteCustomElement: drops the spec and every one of its ids,
// componentTokenIds() reflects it once registered, every other id (stock and
// other customs) untouched, unknown key is a permissive no-op, deleting down
// to zero leaves the Custom section with only its own control (card [22]) ---
{
    const specs = [chip, note, tag, check];
    const comps = { ...g.seedComponentTokens('tailwind', { radiusRem: 0.5 }), 'chip.primary.bg': 'palette.rose-500' };
    const chipIds = Object.keys(comps).filter(id => id.startsWith('chip.'));
    ok(chipIds.length > 0, 'sanity: chip has ids to drop');

    const deleted = g.deleteCustomElement(specs, comps, 'chip');
    ok(!deleted.specs.some(s => s.key === 'chip'), 'chip is gone from the returned spec list');
    ok(deleted.specs.length === 3, 'the other three custom elements remain');
    ['note', 'tag', 'check'].forEach(k => ok(deleted.specs.find(s => s.key === k) === specs.find(s => s.key === k), `${k}'s spec is the SAME object after deleting chip (untouched)`));
    ok(specs.length === 4 && specs.some(s => s.key === 'chip'), 'the ORIGINAL specs array is left untouched (pure)');

    ok(!Object.keys(deleted.components).some(id => id.startsWith('chip.')), 'no chip.* id survives deleteCustomElement');
    ok(Object.keys(deleted.components).length === Object.keys(comps).length - chipIds.length, "exactly chip's own ids are dropped - nothing else");
    Object.keys(comps).forEach(id => {
        if (id.startsWith('chip.')) return;
        ok(deleted.components[id] === comps[id], `${id}: every non-chip id (stock and other customs) is untouched by the delete`);
    });
    ok(comps['chip.primary.bg'] === 'palette.rose-500', 'sanity: the original components map is untouched (pure)');

    // Register the deletion and sweep componentTokenIds() - the DoD's own
    // wording: "delete drops them from componentTokenIds()".
    g.setCustomElements(deleted.specs);
    ok(!g.componentTokenIds().some(id => id.startsWith('chip.')), 'componentTokenIds() lists no chip.* id once the deletion is registered');
    ok(g.componentTokenIds().some(id => id.startsWith('note.')), 'componentTokenIds() still lists the remaining custom elements');
    ok(!g.buildWiringCss().includes('[data-element="chip"]'), 'wiring sheet no longer mentions the deleted element');

    // Unknown key: a permissive no-op - scripts.js's own entry point never
    // calls this for a key that isn't the current selection, but the pure
    // function stays defensive regardless (mirrors removeCustomPart/
    // removeVariantFromSpec's own style for an absent name).
    const noop = g.deleteCustomElement(specs, comps, 'not-a-key');
    ok(JSON.stringify(noop.specs.map(s => s.key)) === JSON.stringify(specs.map(s => s.key)), 'deleting an unknown key drops nothing from the spec list');
    ok(JSON.stringify(Object.keys(noop.components).sort()) === JSON.stringify(Object.keys(comps).sort()), 'deleting an unknown key drops nothing from components');

    // Deleting every custom element in turn - "a system with no custom
    // elements left shows the Custom section with only the 'New custom
    // element' control".
    let downTo = specs;
    let downToComps = comps;
    ['chip', 'note', 'tag', 'check'].forEach(k => {
        const step = g.deleteCustomElement(downTo, downToComps, k);
        downTo = step.specs;
        downToComps = step.components;
    });
    ok(downTo.length === 0, 'deleting all four leaves an empty custom-element list');
    ok(Object.keys(downToComps).every(id => STOCK_KEYS.some(sk => id.startsWith(`${sk}.`))), 'no custom id of any kind survives once every custom element is deleted');
    g.setCustomElements(downTo);
    const emptyGallery = g.buildCustomGalleryHtml();
    ok(emptyGallery.includes('data-action="new-custom-element"'), 'a system with no custom elements left still shows the New custom element control');
    ok(!/gallery-section/.test(emptyGallery), 'a system with no custom elements left shows no specimen sections');
    g.setCustomElements([chip, note, tag, check]); // restore the shared registry
}

console.log(`custom-elements.test.js: ${checks} checks passed`);

// tests/components.test.js must still pass, completely unchanged by this
// diff (a fresh process, so CUSTOM_ELEMENTS here never leaks into it).
execFileSync(process.execPath, [path.join(root, 'tests', 'components.test.js')], { stdio: 'inherit' });
