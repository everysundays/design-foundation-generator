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
    validateCustomElementName, buildCustomElementSpec, renderCustomInstance, buildCustomGalleryHtml,
    buildCustomElementHeaderHtml, buildGalleryHtml, componentTokenIds, tokenIdParts, tokenId, propKind,
    seedComponentTokens, resolveComponentRef, componentVarLines, buildWiringCss, parseRef, refToVar,
    findScaleEntry, paletteEntryByName, elementSpec })`, ctx);

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

// --- buildCustomElementHeaderHtml: read-only, name/base/parts, custom-only --
{
    const html = g.buildCustomElementHeaderHtml({ selection: { element: 'chip', variant: 'primary', part: 'bg', state: 'default' } });
    ok(html.includes('Chip'), 'header names the element');
    ok(html.includes('Button'), 'header names the base');
    ok(html.includes('Background'), 'header lists a part label');
    ok(!/<button|<input|<select|data-ref=|data-variant=|data-state=/.test(html), 'header is read-only - no controls, no assignable refs, no strip picks');
    ok(g.buildCustomElementHeaderHtml({ selection: { element: 'button', variant: 'primary', part: 'bg', state: 'default' } }) === '', 'a stock selection prints nothing');
    ok(g.buildCustomElementHeaderHtml({ selection: null }) === '', 'no selection prints nothing');
    ok(g.buildCustomElementHeaderHtml(undefined) === '', 'no ctx prints nothing');
}

console.log(`custom-elements.test.js: ${checks} checks passed`);

// tests/components.test.js must still pass, completely unchanged by this
// diff (a fresh process, so CUSTOM_ELEMENTS here never leaks into it).
execFileSync(process.execPath, [path.join(root, 'tests', 'components.test.js')], { stdio: 'inherit' });
