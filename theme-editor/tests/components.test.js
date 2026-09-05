// node tests/components.test.js
// Loads the palette data, foundation.js and components.js into one vm
// context (they are plain browser globals) and checks the Elements layer's
// contract: spec shape, seeding, remapping, wiring CSS, gallery markup.
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
const g = vm.runInContext(`({ ELEMENTS, ELEMENT_CATEGORIES, categoryOf, parseRef, refToVar, findScaleEntry, paletteEntryByName,
    componentTokenIds, tokenIdParts, tokenId, propKind, seedComponentTokens, resolveComponentRef,
    componentVarLines, buildWiringCss, buildGalleryHtml, renderGalleryInstance, componentUsage, remapComponentTokens })`, ctx);

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

// A ref is acceptable for a kind when parseRef accepts it and its target
// exists in the given source.
function assertRefValid(ref, kind, source, where) {
    const parsed = g.parseRef(ref);
    ok(parsed, `${where}: "${ref}" is not a ref`);
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

// --- ELEMENTS shape --------------------------------------------------------
const EXPECTED_KEYS = ['button', 'input', 'select', 'textarea', 'checkbox', 'radio', 'switch', 'badge', 'card', 'alert',
    'tabs-list', 'tab', 'table', 'table-row', 'avatar', 'tooltip', 'popover', 'list-item', 'separator'];
ok(JSON.stringify(g.ELEMENTS.map(e => e.key)) === JSON.stringify(EXPECTED_KEYS), 'element keys/order');
g.ELEMENTS.forEach(el => {
    ok(el.states[0] === 'default', `${el.key}: first state is default`);
    el.parts.forEach(part => {
        ok(part.props.length >= 1, `${el.key}.${part.key} has props`);
        part.props.forEach(prop => ok(['color', 'space', 'radius', 'borderWidth', 'borderStyle', 'shadow', 'type'].includes(prop.kind), `${el.key}.${part.key}.${prop.key} kind ${prop.kind}`));
    });
});

// --- ids round-trip ----------------------------------------------------------
const ids = g.componentTokenIds();
ok(ids.length > 100, 'has ids');
ok(new Set(ids).size === ids.length, 'ids unique');
ids.forEach(id => {
    const p = g.tokenIdParts(id);
    ok(p && p.state === 'default', `${id} parses as default state`);
    ok(g.tokenId(p.element, p.variant, p.part, p.prop) === id, `${id} round-trips`);
    ok(g.propKind(p.element, p.part, p.prop), `${id} has a kind`);
});
ok(JSON.stringify(g.tokenIdParts('button.primary.bg.hover')) === JSON.stringify({ element: 'button', variant: 'primary', part: 'bg', prop: null, state: 'hover' }), "parts of " + g.tokenIdParts('button.primary.bg.hover').element);
ok(JSON.stringify(g.tokenIdParts('table.cell.padding-x')) === JSON.stringify({ element: 'table', variant: null, part: 'cell', prop: 'padding-x', state: 'default' }), "parts of " + g.tokenIdParts('table.cell.padding-x').element);
ok(g.tokenIdParts('button.primary.bg.color.hover') === null, 'single-prop id with a prop segment is invalid');
ok(g.tokenIdParts('button.primary.text.type').prop === 'type', 'prop parsed');
ok(g.tokenIdParts('separator.width').prop === null, 'single-prop part has no prop');
ok(g.tokenIdParts('nope.bg') === null, 'unknown element -> null');
ok(g.tokenIdParts('card.bg.hover') === null, 'unsupported state -> null');
ok(g.propKind('separator', 'width') === 'borderWidth', 'separator.width kind');
ok(g.propKind('switch', 'width') === 'space', 'switch.width kind');
ok(g.propKind('table', 'cell', 'padding-x') === 'space', 'table.cell.padding-x kind');

// --- Seeds: every default id, both sources, valid refs -------------------
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ids.forEach(id => {
        const p = g.tokenIdParts(id);
        const kind = g.propKind(p.element, p.part, p.prop);
        ok(seeds[id] !== undefined, `${source}: ${id} has no seed`);
        assertRefValid(seeds[id], kind, source, `${source} seed ${id}`);
    });
    Object.keys(seeds).forEach(id => {
        const p = g.tokenIdParts(id);
        ok(p, `${source}: seed id ${id} parses`);
        if (p.state !== 'default') assertRefValid(seeds[id], g.propKind(p.element, p.part, p.prop), source, `${source} state seed ${id}`);
    });
    // seeded state deltas from the contract
    ok(seeds['button.outline.bg.hover'] === 'color.accent', `${source}: outline hover -> accent`);
    ok(seeds['button.ghost.text.color.hover'] === 'color.accent-foreground', `${source}: ghost hover text`);
    ok(seeds['button.link.bg.hover'] === undefined, `${source}: link hover not seeded`);
    ok(seeds['input.border.color.focus'] === 'color.ring', `${source}: input focus ring`);
    ok(seeds['button.primary.bg.disabled'] === 'color.muted', `${source}: disabled muted`);
    ok(seeds['checkbox.checked.box'] === 'color.primary', `${source}: checked box`);
    ok(seeds['switch.on.thumb'] === 'color.background', `${source}: switch thumb`);
    ok(seeds['table-row.bg.hover'] === 'color.muted', `${source}: row hover`);
    ok(seeds['list-item.bg.active'] === 'color.accent', `${source}: list-item active`);
    ok(seeds['alert.destructive.title.color'] === 'color.destructive', `${source}: alert destructive title`);
});
// theme radius seeding
ok(g.seedComponentTokens('tailwind', { radiusRem: 0.5 })['button.primary.radius'] === 'radius.lg', 'radius 0.5rem -> lg');
ok(g.seedComponentTokens('tailwind', { radiusRem: 0 })['card.radius'] === 'radius.none', 'radius 0 -> none');
ok(g.seedComponentTokens('tailwind', {})['input.radius'] === 'radius.lg', 'radius fallback 0.5rem');
ok(g.seedComponentTokens('atlassian', { radiusRem: 0.5 })['popover.radius'] === 'radius.radius.large', 'atlassian radius 8px');
ok(g.seedComponentTokens('atlassian', {})['badge.default.radius'] === 'radius.radius.full', 'atlassian full radius remapped');
ok(g.seedComponentTokens('atlassian', {})['button.primary.padding.x'].startsWith('space.space.'), 'atlassian space remapped');

// --- resolveComponentRef -------------------------------------------------
ok(g.resolveComponentRef('button.primary.bg', {}) === 'color.primary', 'seed fallback');
ok(g.resolveComponentRef('button.primary.bg.hover', {}) === 'color.primary', 'state inherits default seed');
ok(g.resolveComponentRef('button.primary.bg.hover', { 'button.primary.bg': 'color.accent' }) === 'color.accent', 'state inherits explicit default');
ok(g.resolveComponentRef('button.primary.bg.hover', { 'button.primary.bg.hover': 'color.secondary' }) === 'color.secondary', 'explicit state wins');
ok(g.resolveComponentRef('button.outline.bg.hover', { 'button.outline.bg': 'color.card' }) === 'color.accent', 'seeded state delta survives a default edit');
ok(g.resolveComponentRef('garbage.id', {}) === null, 'unknown id -> null, not undefined');
ok(g.resolveComponentRef('card.radius', {}, 'atlassian') === 'radius.radius.large', 'explicit source');

// --- componentVarLines ---------------------------------------------------
SOURCES.forEach(source => {
    const css = g.componentVarLines({}, source);
    ok(!/undefined|null/.test(css), `${source}: var lines contain no undefined/null`);
    ok(css.includes('  --button-primary-bg: var(--primary);'), `${source}: primary bg line`);
    ok(css.includes('  --button-primary-bg-hover: var(--primary);'), `${source}: hover inherits`);
    ok(css.includes('  --button-outline-bg-hover: var(--accent);'), `${source}: outline hover`);
    ok(css.includes('  --input-text-type-family: var(--type-body-family);'), `${source}: type expands`);
    ok(css.includes('  --input-text-type-hover-tracking: var(--type-body-tracking);'), `${source}: type state suffix`);
    ok(css.includes('  --button-ghost-bg: var(--palette-transparent);'), `${source}: transparent`);
    // every line references a var that refToVar could produce for a valid ref
    css.split('\n').forEach(line => ok(/^  --[a-z0-9-]+: var\(--[a-z0-9-]+\);$/.test(line), `${source}: well-formed line "${line}"`));
});
ok(g.componentVarLines({}, 'atlassian').includes('  --button-primary-padding-x: var(--space-'), 'atlassian space var');
ok(!g.componentVarLines({}, 'atlassian').includes('--space-space-'), 'atlassian group stripped by refToVar');
// an explicit component entry pointed at a semantic role (color.<role>, not
// the palette step it links to) still emits var(--<role>) - see card 7.
SOURCES.forEach(source => {
    ok(g.componentVarLines({ 'card.bg': 'color.primary' }, source).includes('  --card-bg: var(--primary);'), `${source}: explicit color.* ref emits var(--role)`);
});
// A component entry pointed at a semantic (non-color) SCALE token (e.g.
// space.card-padding, card 9) needs no special-casing here: refToVar just
// derives the var name syntactically, so it emits var(--space-card-padding)
// exactly like any other ref - cssVarBlockFor/semantic.js semanticVarLines
// is the one place that has to actually DEFINE that var (against whichever
// step the token currently targets).
SOURCES.forEach(source => {
    ok(g.componentVarLines({ 'card.padding': 'space.card-padding' }, source).includes('  --card-padding: var(--space-card-padding);'), `${source}: explicit space.<token> ref emits var(--space-<token>)`);
});
// remapComponentTokens leaves a component pointed AT a token untouched
// across a Foundation switch - 'card-padding' never matches a real step
// name of either source, so remapRef returns it unchanged; only the
// token's OWN target (semantic.js remapSemanticTokens, card 9) moves.
ok(g.remapComponentTokens({ 'card.padding': 'space.card-padding' }, 'tailwind', 'atlassian')['card.padding'] === 'space.card-padding',
    'remapComponentTokens leaves a token ref untouched (tailwind -> atlassian)');
{
    // one line per element x variant x part x prop x state (type = 5)
    let expected = 0;
    g.ELEMENTS.forEach(el => (el.variants || [null]).forEach(() => el.states.forEach(() => el.parts.forEach(p => p.props.forEach(pr => { expected += pr.kind === 'type' ? 5 : 1; })))));
    ok(g.componentVarLines({}, 'tailwind').split('\n').length === expected, `line count ${expected}`);
}

// --- buildWiringCss --------------------------------------------------------
const wiring = g.buildWiringCss();
ok(wiring.startsWith('@layer components {'), 'components layer first');
ok(wiring.includes('@layer states {'), 'states layer');
ok(!wiring.includes('!important'), 'no !important');
g.ELEMENTS.forEach(el => ok(wiring.includes(`[data-element="${el.key}"]`), `wiring mentions ${el.key}`));
ok(wiring.includes('[data-element="button"][data-variant="primary"] {\n  --_bg: var(--button-primary-bg);'), 'primary default block');
ok(wiring.includes('[data-element="button"][data-variant="primary"]:is(:hover:not([data-state]), [data-state="hover"]) {\n  --_bg: var(--button-primary-bg-hover);'), 'primary hover block');
ok(wiring.includes('--_text-family: var(--button-primary-text-type-family);'), 'type private');
ok(wiring.includes('--_padding-x: var(--button-primary-padding-x);'), 'multi-prop private');
ok(wiring.includes('--_radius: var(--button-primary-radius);'), 'single-prop private');
ok(wiring.includes('--_header-text: var(--table-header-text);'), 'table header text private');
ok(wiring.includes('--_cell-padding-x: var(--table-cell-padding-x);'), 'table cell padding private');
ok(wiring.includes('--_width: var(--separator-width);'), 'separator width private');
ok(wiring.includes('[data-element="table-row"]:is(:active:not([data-state]), [data-state="active"], [aria-selected="true"], [aria-pressed="true"]) {'), 'active selector verbatim');
ok(wiring.includes('[data-element="input"]:is(:disabled, [data-state="disabled"], [aria-disabled="true"]) {'), 'disabled selector verbatim');
ok(!wiring.includes('[data-element="card"]:is('), 'card has no state rules');

// --- components.css reads only privates the wiring defines ---------------
{
    const css = fs.readFileSync(path.join(root, 'preview', 'components.css'), 'utf8');
    const defined = new Set(wiring.match(/--_[a-z0-9-]+(?=:)/g));
    const cssState = new Set(['--_ring-on', '--_mark-on', '--_thumb-shift']); // CSS-internal state tokens
    const used = new Set(css.match(/--_[a-z0-9-]+/g));
    used.forEach(v => ok(defined.has(v) || cssState.has(v), `components.css reads undefined private ${v}`));
    ok(!css.includes('!important'), 'components.css has no !important');
    ok(!/@layer/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'components.css is not self-layered');
    ok(!/#[0-9a-f]{3,8}\b/i.test(css), 'components.css has no hex colours');
    ok(!/\b\d+(\.\d+)?(rem|px)\b/.test(css.replace(/outline-offset: 2px/g, '')), 'components.css has no literal lengths (except the ring offset)');
}

// --- buildGalleryHtml ------------------------------------------------------
const html = g.buildGalleryHtml();
g.ELEMENTS.forEach(el => {
    ok(html.includes(`id="gallery-${el.key}"`), `gallery section ${el.key}`);
    ok(html.includes(`data-element="${el.key}"`), `gallery instance ${el.key}`);
    ok(html.includes(`class="ds-${el.key}`), `gallery class ds-${el.key}`);
    // ONE instance per element: a stage showing the first variant, default state
    const stages = html.match(new RegExp(`<div class="gallery-stage" data-gallery-element="${el.key}" data-variant="([^"]*)" data-state="default">`, 'g')) || [];
    ok(stages.length === 1, `${el.key} has exactly one stage (${stages.length})`);
    const first = (el.variants || [null])[0];
    ok(html.includes(`data-variant="${first || ''}" data-state="default">`), `${el.key} stage shows first variant`);
    if (first) ok(html.includes(`data-element="${el.key}" data-variant="${first}"`), `gallery instance ${el.key}.${first}`);
    // the other variants are absent from THIS element's stage (a tabs-list specimen may host an active tab)
    const stageHtml = html.slice(html.indexOf(`id="gallery-${el.key}"`), html.indexOf('</section>', html.indexOf(`id="gallery-${el.key}"`)));
    (el.variants || []).slice(1).forEach(v => ok(!stageHtml.includes(`data-element="${el.key}" data-variant="${v}"`), `gallery does not render ${el.key}.${v}`));
});
ok(!html.includes('data-state="hover"') && !html.includes('data-state="disabled"'), 'gallery renders default state only');
ok(!html.includes('gallery-title') && !html.includes('gallery-category-title'), 'gallery prints no headings');

// --- gallery categories -----------------------------------------------------
{
    const catKeys = g.ELEMENT_CATEGORIES.map(c => c.key);
    ok(JSON.stringify(catKeys) === JSON.stringify(['actions', 'forms', 'feedback', 'surfaces', 'navigation', 'data']), 'category keys/order');
    ok(g.ELEMENT_CATEGORIES.every(c => c.label && Array.isArray(c.elements) && c.elements.length), 'categories have label + elements');
    const listed = g.ELEMENT_CATEGORIES.flatMap(c => c.elements);
    ok(new Set(listed).size === listed.length, 'no element listed in two categories');
    listed.forEach(k => ok(g.ELEMENTS.some(el => el.key === k), `category lists unknown element ${k}`));
    g.ELEMENT_CATEGORIES.forEach(c => {
        ok(html.includes(`<section class="gallery-category" id="cat-${c.key}"`), `category section cat-${c.key}`);
    });
    // category sections appear in ELEMENT_CATEGORIES order, then at most "Other"
    const order = [...html.matchAll(/id="cat-([a-z-]+)"/g)].map(m => m[1]);
    ok(JSON.stringify(order.filter(k => k !== 'other')) === JSON.stringify(catKeys), `category order ${order.join(',')}`);
    // every element key sits inside exactly one category section
    const sections = html.split(/(?=<section class="gallery-category")/).filter(x => x.startsWith('<section class="gallery-category"'));
    g.ELEMENTS.forEach(el => {
        const hosts = sections.filter(sec => sec.includes(`id="gallery-${el.key}"`));
        ok(hosts.length === 1, `${el.key} is inside exactly one category (${hosts.length})`);
        const catKey = g.categoryOf(el.key);
        ok(typeof catKey === 'string' && catKey, `categoryOf(${el.key}) returns a key`);
        ok(catKeys.includes(catKey) || catKey === 'other', `categoryOf(${el.key}) is a known key`);
        ok(el.category === catKey, `${el.key}.category matches categoryOf`);
        ok(hosts[0].includes(`id="cat-${catKey}"`), `${el.key} rendered under cat-${catKey}`);
    });
    ok(!html.includes('id="cat-other"'), 'every element is categorised (no Other group)');
    ok(g.categoryOf('nope') === 'other', 'unknown element -> other');
    ok(g.categoryOf('button') === 'actions' && g.categoryOf('avatar') === 'data', 'spot checks');
}
ok(html.includes('class="gallery-elements"'), 'element sections wrapped per category');
ok(!html.includes('gallery-matrix') && !html.includes('gallery-cell'), 'no variant x state matrix');
ok(g.renderGalleryInstance('button', 'primary', 'disabled').includes('data-state="disabled" data-part="bg" aria-disabled="true"'), 'disabled via aria, not the attribute');
ok(!/<button[^>]* disabled/.test(html), 'no native disabled attribute');
ok(/<input[^>]*readonly/.test(html) && /<textarea[^>]*readonly/.test(html), 'fields readonly');
ok(!html.includes('<img') && !html.includes('http'), 'no external assets');
ok((html.match(/data-part="mark"/g) || []).length === 2, 'checkbox/radio marks (one instance each)');
ok(html.includes('data-part="thumb"'), 'switch thumb part');
ok(html.includes('data-part="header"') && html.includes('data-part="cell"'), 'table parts');
ok(html.includes('data-part="meta"') && html.includes('data-part="line"'), 'list meta + separator line');
ok((html.match(/<svg /g) || []).length >= 5, 'inline svg icons');
ok(!/ src=/.test(html), 'no src attributes');

// --- componentUsage / remapComponentTokens -----------------------------------
{
    const usage = g.componentUsage({ 'button.primary.bg.hover': 'color.accent' });
    ok(usage['color.primary'].includes('button.primary.bg'), 'usage lists default ids');
    ok(usage['color.accent'].includes('button.primary.bg.hover'), 'usage lists explicit state entries');
    ok(!Object.values(usage).flat().includes('button.outline.bg.hover'), 'usage skips seeded (non-explicit) states');
    const remapped = g.remapComponentTokens({ 'card.padding': 'space.6', 'card.radius': 'radius.full', 'card.bg': 'color.card' }, 'tailwind', 'atlassian');
    ok(remapped['card.padding'] === 'space.space.300', 'space.6 (24px) -> space.300');
    ok(remapped['card.radius'] === 'radius.radius.full', 'full -> full');
    ok(remapped['card.bg'] === 'color.card', 'colors untouched');
}

// --- componentUsage({ seededStates: true }) (card 15: "Delete a semantic
// token" needs every id x state resolved, not only explicit entries, so a
// part that uses a role only by INHERITING a seed - or a seeded state
// override with no explicit assignment of its own - still counts as usage). --
{
    const seeded = g.componentUsage({}, { seededStates: true });
    ok(seeded['color.accent'].includes('button.outline.bg.hover'), 'seededStates: a seeded state override with no explicit entry counts as usage');
    ok(seeded['color.accent'].includes('button.ghost.bg.hover'), 'seededStates: every seeded state override is found, not just the first');
    ok(seeded['color.primary'].includes('button.primary.bg'), 'seededStates: a seeded DEFAULT assignment still counts too');
    // The default (no options) path is unchanged - it still skips a seeded
    // state override with no explicit entry (the very gap seededStates closes).
    const plain = g.componentUsage({});
    ok(!(plain['color.accent'] || []).includes('button.outline.bg.hover'), 'the default componentUsage(components) call is unchanged - still skips seeded states');
}

console.log(`components.test.js: ${checks} checks passed`);
