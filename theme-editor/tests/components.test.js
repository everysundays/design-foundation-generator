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
    'tabs-list', 'tab', 'table', 'table-row', 'avatar', 'tooltip', 'popover', 'list-item', 'separator', 'dialog', 'dropdown-menu', 'combobox', 'toast', 'progress', 'skeleton', 'breadcrumb', 'pagination', 'pagination-item'];
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
    ok(seeds['toast.destructive.border.color'] === 'color.destructive', `${source}: toast destructive border`);
    ok(seeds['toast.destructive.icon'] === 'color.destructive', `${source}: toast destructive icon`);
    ok(seeds['toast.destructive.title.color'] === 'color.destructive', `${source}: toast destructive title`);
    ok(seeds['breadcrumb.link.color.hover'] === 'color.foreground', `${source}: breadcrumb link hover`);
    ok(seeds['pagination-item.inactive.bg.hover'] === 'color.accent', `${source}: pagination-item inactive hover bg`);
    ok(seeds['pagination-item.inactive.ring.color.focus'] === 'color.ring', `${source}: pagination-item inactive focus ring`);
    ok(seeds['pagination-item.inactive.bg.disabled'] === 'color.muted', `${source}: pagination-item inactive disabled bg`);
});
// theme radius seeding
ok(g.seedComponentTokens('tailwind', { radiusRem: 0.5 })['button.primary.radius'] === 'radius.lg', 'radius 0.5rem -> lg');
ok(g.seedComponentTokens('tailwind', { radiusRem: 0 })['card.radius'] === 'radius.none', 'radius 0 -> none');
ok(g.seedComponentTokens('tailwind', {})['input.radius'] === 'radius.lg', 'radius fallback 0.5rem');
ok(g.seedComponentTokens('atlassian', { radiusRem: 0.5 })['popover.radius'] === 'radius.radius.large', 'atlassian radius 8px');
ok(g.seedComponentTokens('atlassian', {})['badge.default.radius'] === 'radius.radius.full', 'atlassian full radius remapped');
ok(g.seedComponentTokens('atlassian', {})['button.primary.padding.x'].startsWith('space.space.'), 'atlassian space remapped');

// --- Dialog spot checks ---------------------------------------------------
ok(g.propKind('dialog', 'overlay') === 'color', 'dialog.overlay kind');
ok(g.propKind('dialog', 'close') === 'color', 'dialog.close kind');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['dialog.overlay'] === 'palette.black', `${source}: dialog overlay seed`);
    ok(seeds['dialog.bg'] === 'color.background', `${source}: dialog bg seed`);
    ok(seeds['dialog.close'] === 'color.muted-foreground', `${source}: dialog close seed`);
    assertRefValid(seeds['dialog.shadow'], 'shadow', source, `${source} dialog shadow seed`);
});
ok(g.seedComponentTokens('tailwind', {})['dialog.shadow'] === 'shadow.lg', 'tailwind dialog shadow');
ok(g.seedComponentTokens('atlassian', {})['dialog.shadow'] === 'shadow.elevation.shadow.overflow', 'atlassian dialog shadow remap');

// --- Dropdown menu spot checks ---------------------------------------------
ok(g.propKind('dropdown-menu', 'text', 'color') === 'color', 'dropdown-menu text color kind');
ok(g.propKind('dropdown-menu', 'text', 'type') === 'type', 'dropdown-menu text type kind');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['dropdown-menu.bg'] === 'color.popover', `${source}: dropdown-menu bg seed`);
    ok(seeds['dropdown-menu.text.color'] === 'color.popover-foreground', `${source}: dropdown-menu text color seed`);
    ok(seeds['dropdown-menu.text.type'] === 'type.label', `${source}: dropdown-menu text type seed`);
    assertRefValid(seeds['dropdown-menu.padding'], 'space', source, `${source} dropdown-menu padding seed`);
    assertRefValid(seeds['dropdown-menu.gap'], 'space', source, `${source} dropdown-menu gap seed`);
    assertRefValid(seeds['dropdown-menu.shadow'], 'shadow', source, `${source} dropdown-menu shadow seed`);
});

// --- Combobox spot checks ---------------------------------------------------
ok(g.propKind('combobox', 'placeholder') === 'color', 'combobox.placeholder kind');
ok(g.propKind('combobox', 'text', 'color') === 'color', 'combobox text color kind');
ok(g.propKind('combobox', 'text', 'type') === 'type', 'combobox text type kind');
{
    const combo = g.ELEMENTS.find(el => el.key === 'combobox');
    const select = g.ELEMENTS.find(el => el.key === 'select');
    ok(JSON.stringify(combo.parts.map(p => p.key)) === JSON.stringify(select.parts.map(p => p.key)), 'combobox has the same parts as select, in order');
    ok(JSON.stringify(combo.states) === JSON.stringify(select.states), 'combobox has the same states as select');
}
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['combobox.border.color.focus'] === 'color.ring', `${source}: combobox focus ring`);
    ok(seeds['combobox.bg.disabled'] === 'color.muted', `${source}: combobox disabled bg`);
    ok(seeds['combobox.placeholder.disabled'] === 'color.muted-foreground', `${source}: combobox disabled placeholder`);
    ok(seeds['combobox.bg'] === 'color.background', `${source}: combobox bg seed`);
    ok(seeds['combobox.placeholder'] === 'color.muted-foreground', `${source}: combobox placeholder seed`);
});

// --- Toast spot checks -------------------------------------------------------
ok(g.propKind('toast', 'close') === 'color', 'toast.close kind');
ok(g.propKind('toast', 'title', 'type') === 'type', 'toast title type kind');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['toast.default.bg'] === 'color.popover', `${source}: toast default bg seed`);
    ok(seeds['toast.default.border.color'] === 'color.border', `${source}: toast default border`);
    ok(seeds['toast.default.close'] === 'color.muted-foreground', `${source}: toast default close`);
    ok(seeds['toast.destructive.close'] === 'color.destructive', `${source}: toast destructive close`);
    assertRefValid(seeds['toast.default.shadow'], 'shadow', source, `${source} toast shadow seed`);
});
ok(g.componentVarLines({}, 'tailwind').includes('  --toast-destructive-border-color: var(--destructive);'), 'toast destructive border line');
ok(g.componentVarLines({}, 'tailwind').includes('  --toast-default-title-type-family: var(--type-label-family);'), 'toast title type expands');

// --- Progress spot checks -----------------------------------------------
ok(g.propKind('progress', 'track') === 'color', 'progress.track kind');
ok(g.propKind('progress', 'indicator') === 'color', 'progress.indicator kind');
ok(g.propKind('progress', 'radius') === 'radius', 'progress.radius kind');
ok(g.propKind('progress', 'height') === 'space', 'progress.height kind');
ok(g.ELEMENTS.find(el => el.key === 'progress').variants === null, 'progress has no variants');
ok(JSON.stringify(g.ELEMENTS.find(el => el.key === 'progress').states) === JSON.stringify(['default']), 'progress has only the default state');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['progress.track'] === 'color.secondary', `${source}: progress track seed`);
    ok(seeds['progress.indicator'] === 'color.primary', `${source}: progress indicator seed`);
    ok(seeds['progress.radius'] === (source === 'atlassian' ? 'radius.radius.full' : 'radius.full'), `${source}: progress radius seed`);
    ok(seeds['progress.height'] === (source === 'atlassian' ? 'space.space.100' : 'space.2'), `${source}: progress height seed`);
});
ok(g.componentVarLines({}, 'tailwind').includes('  --progress-track: var(--secondary);'), 'progress track line');
ok(g.componentVarLines({}, 'tailwind').includes('  --progress-indicator: var(--primary);'), 'progress indicator line');
ok(g.componentVarLines({}, 'tailwind').includes('  --progress-radius: var(--radius-full);'), 'progress radius line');
ok(g.componentVarLines({}, 'tailwind').includes('  --progress-height: var(--space-2);'), 'progress height line');

// --- Skeleton spot checks -----------------------------------------------
ok(g.propKind('skeleton', 'bg') === 'color', 'skeleton.bg kind');
ok(g.propKind('skeleton', 'radius') === 'radius', 'skeleton.radius kind');
ok(g.ELEMENTS.find(el => el.key === 'skeleton').variants === null, 'skeleton has no variants');
ok(JSON.stringify(g.ELEMENTS.find(el => el.key === 'skeleton').states) === JSON.stringify(['default']), 'skeleton has only the default state');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['skeleton.bg'] === 'color.muted', `${source}: skeleton bg seed`);
    ok(seeds['skeleton.radius'] === (source === 'atlassian' ? 'radius.radius.medium' : 'radius.md'), `${source}: skeleton radius seed`);
});
ok(g.componentVarLines({}, 'tailwind').includes('  --skeleton-bg: var(--muted);'), 'skeleton bg line');
ok(g.componentVarLines({}, 'tailwind').includes('  --skeleton-radius: var(--radius-md);'), 'skeleton radius line');

// --- Breadcrumb spot checks -----------------------------------------------
ok(g.propKind('breadcrumb', 'separator') === 'color', 'breadcrumb.separator kind');
ok(g.propKind('breadcrumb', 'gap') === 'space', 'breadcrumb.gap kind');
ok(g.propKind('breadcrumb', 'link', 'color') === 'color', 'breadcrumb link color kind');
ok(g.propKind('breadcrumb', 'link', 'type') === 'type', 'breadcrumb link type kind');
ok(g.ELEMENTS.find(el => el.key === 'breadcrumb').variants === null, 'breadcrumb has no variants');
ok(JSON.stringify(g.ELEMENTS.find(el => el.key === 'breadcrumb').states) === JSON.stringify(['default', 'hover']), 'breadcrumb has default/hover states only');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['breadcrumb.link.color'] === 'color.muted-foreground', `${source}: breadcrumb link seed`);
    ok(seeds['breadcrumb.current.color'] === 'color.foreground', `${source}: breadcrumb current seed`);
    ok(seeds['breadcrumb.separator'] === 'color.muted-foreground', `${source}: breadcrumb separator seed`);
    ok(seeds['breadcrumb.current.color.hover'] === undefined, `${source}: breadcrumb current has no seeded hover delta`);
    assertRefValid(seeds['breadcrumb.gap'], 'space', source, `${source} breadcrumb gap seed`);
});
ok(g.resolveComponentRef('breadcrumb.current.color.hover', {}) === 'color.foreground', 'breadcrumb current hover inherits its default');
ok(g.resolveComponentRef('breadcrumb.separator.hover', {}) === 'color.muted-foreground', 'breadcrumb separator hover inherits its default');
ok(g.componentVarLines({}, 'tailwind').includes('  --breadcrumb-link-color: var(--muted-foreground);'), 'breadcrumb link color line');
ok(g.componentVarLines({}, 'tailwind').includes('  --breadcrumb-link-color-hover: var(--foreground);'), 'breadcrumb link hover line');
ok(g.componentVarLines({}, 'tailwind').includes('  --breadcrumb-current-type-family: var(--type-body-family);'), 'breadcrumb current type expands');
ok(JSON.stringify(g.tokenIdParts('breadcrumb.link.color.hover')) === JSON.stringify({ element: 'breadcrumb', variant: null, part: 'link', prop: 'color', state: 'hover' }), 'breadcrumb link hover id parses');
ok(g.tokenIdParts('breadcrumb.gap.focus') === null, 'breadcrumb has no focus state');

// --- Pagination spot checks ------------------------------------------------
ok(g.propKind('pagination', 'gap') === 'space', 'pagination.gap kind');
ok(g.propKind('pagination-item', 'bg') === 'color', 'pagination-item.bg kind');
ok(g.propKind('pagination-item', 'text', 'color') === 'color', 'pagination-item text color kind');
ok(g.propKind('pagination-item', 'text', 'type') === 'type', 'pagination-item text type kind');
ok(g.propKind('pagination-item', 'border', 'width') === 'borderWidth', 'pagination-item border width kind');
ok(g.propKind('pagination-item', 'radius') === 'radius', 'pagination-item radius kind');
ok(g.propKind('pagination-item', 'size') === 'space', 'pagination-item size kind');
ok(g.propKind('pagination-item', 'ring', 'color') === 'color', 'pagination-item ring color kind');
ok(g.ELEMENTS.find(el => el.key === 'pagination').variants === null, 'pagination has no variants');
ok(JSON.stringify(g.ELEMENTS.find(el => el.key === 'pagination').states) === JSON.stringify(['default']), 'pagination has only the default state');
ok(JSON.stringify(g.ELEMENTS.find(el => el.key === 'pagination-item').variants) === JSON.stringify(['inactive', 'active']), 'pagination-item variants');
ok(JSON.stringify(g.ELEMENTS.find(el => el.key === 'pagination-item').states) === JSON.stringify(['default', 'hover', 'focus', 'disabled']), 'pagination-item states (no active - active is a variant here)');
SOURCES.forEach(source => {
    const seeds = g.seedComponentTokens(source, { radiusRem: 0.625 });
    ok(seeds['pagination-item.inactive.bg'] === 'palette.transparent', `${source}: pagination-item inactive bg seed`);
    ok(seeds['pagination-item.active.bg'] === 'color.background', `${source}: pagination-item active bg seed`);
    ok(seeds['pagination-item.active.border.color'] === 'color.input', `${source}: pagination-item active border seed`);
    ok(seeds['pagination-item.inactive.bg.hover'] === 'color.accent', `${source}: pagination-item inactive hover bg (repeat)`);
    ok(seeds['pagination-item.active.bg.hover'] === 'color.accent', `${source}: pagination-item active hover bg (hover applies to every variant)`);
    ok(seeds['pagination-item.inactive.text.color.disabled'] === 'color.muted-foreground', `${source}: pagination-item disabled text`);
    assertRefValid(seeds['pagination-item.inactive.size'], 'space', source, `${source} pagination-item size seed`);
    assertRefValid(seeds['pagination-item.inactive.radius'], 'radius', source, `${source} pagination-item radius seed`);
    assertRefValid(seeds['pagination.gap'], 'space', source, `${source} pagination gap seed`);
});
ok(g.componentVarLines({}, 'tailwind').includes('  --pagination-gap: var(--space-1);'), 'pagination gap line');
ok(g.componentVarLines({}, 'tailwind').includes('  --pagination-item-inactive-bg-hover: var(--accent);'), 'pagination-item inactive hover line');
ok(g.componentVarLines({}, 'tailwind').includes('  --pagination-item-inactive-ring-color-focus: var(--ring);'), 'pagination-item focus ring line');
ok(g.componentVarLines({}, 'tailwind').includes('  --pagination-item-inactive-bg-disabled: var(--muted);'), 'pagination-item disabled bg line');
ok(g.componentVarLines({}, 'tailwind').includes('  --pagination-item-inactive-text-type-family: var(--type-label-family);'), 'pagination-item text type expands');
ok(JSON.stringify(g.tokenIdParts('pagination-item.inactive.bg.hover')) === JSON.stringify({ element: 'pagination-item', variant: 'inactive', part: 'bg', prop: null, state: 'hover' }), 'pagination-item hover id parses');
ok(g.tokenIdParts('pagination-item.inactive.bg.active') === null, 'pagination-item has no active STATE (active is a variant)');
ok(g.tokenIdParts('pagination.gap.hover') === null, 'pagination host has no hover state');

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
ok(g.componentVarLines({}, 'tailwind').includes('  --dialog-title-type-family: var(--type-subheading-family);'), 'dialog title type expands');
ok(g.componentVarLines({}, 'tailwind').includes('  --dropdown-menu-text-type-family: var(--type-label-family);'), 'dropdown-menu text type expands');
ok(g.componentVarLines({}, 'tailwind').includes('  --dropdown-menu-bg: var(--popover);'), 'dropdown-menu bg line');
ok(g.componentVarLines({}, 'tailwind').includes('  --combobox-text-type-family: var(--type-body-family);'), 'combobox text type expands');
ok(g.componentVarLines({}, 'tailwind').includes('  --combobox-placeholder: var(--muted-foreground);'), 'combobox placeholder line');
ok(g.componentVarLines({}, 'tailwind').includes('  --combobox-border-color-focus: var(--ring);'), 'combobox seeded focus delta expands');
ok(g.componentVarLines({}, 'tailwind').includes('  --combobox-bg-disabled: var(--muted);'), 'combobox seeded disabled delta expands');
ok(g.componentVarLines({}, 'atlassian').includes('  --button-primary-padding-x: var(--space-'), 'atlassian space var');
ok(!g.componentVarLines({}, 'atlassian').includes('--space-space-'), 'atlassian group stripped by refToVar');
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
ok(wiring.includes('--_overlay: var(--dialog-overlay);'), 'dialog overlay private');
ok(wiring.includes('--_close: var(--dialog-close);'), 'dialog close private');
ok(!wiring.includes('[data-element="dialog"]:is('), 'dialog has no state rules');
ok(wiring.includes('[data-element="dropdown-menu"] {\n  --_bg: var(--dropdown-menu-bg);'), 'dropdown-menu default block');
ok(wiring.includes('--_text-family: var(--dropdown-menu-text-type-family);'), 'dropdown-menu text type private');
ok(!wiring.includes('[data-element="dropdown-menu"]:is('), 'dropdown-menu has no state rules');
ok(wiring.includes('[data-element="combobox"] {\n  --_bg: var(--combobox-bg);'), 'combobox default block');
ok(wiring.includes('[data-element="combobox"]:is(:hover:not([data-state]), [data-state="hover"]) {\n  --_bg: var(--combobox-bg-hover);'), 'combobox hover block');
ok(wiring.includes('[data-element="combobox"]:is(:disabled, [data-state="disabled"], [aria-disabled="true"]) {'), 'combobox disabled selector verbatim');
ok(wiring.includes('--_placeholder: var(--combobox-placeholder);'), 'combobox placeholder private');
ok(wiring.includes('--_ring-color: var(--combobox-ring-color);'), 'combobox ring private');
ok(wiring.includes('[data-element="toast"][data-variant="default"] {\n  --_bg: var(--toast-default-bg);'), 'toast default block');
ok(wiring.includes('[data-element="toast"][data-variant="destructive"] {\n  --_bg: var(--toast-destructive-bg);'), 'toast destructive block');
ok(wiring.includes('--_close: var(--toast-default-close);'), 'toast close private');
ok(!wiring.includes('[data-element="toast"][data-variant="default"]:is(') && !wiring.includes('[data-element="toast"][data-variant="destructive"]:is('), 'toast has no state rules');
ok(wiring.includes('[data-element="progress"] {\n  --_track: var(--progress-track);'), 'progress default block');
ok(wiring.includes('--_indicator: var(--progress-indicator);'), 'progress indicator private');
ok(wiring.includes('--_radius: var(--progress-radius);'), 'progress radius private');
ok(wiring.includes('--_height: var(--progress-height);'), 'progress height private');
ok(!wiring.includes('[data-element="progress"]:is('), 'progress has no state rules');
ok(wiring.includes('[data-element="skeleton"] {\n  --_bg: var(--skeleton-bg);'), 'skeleton default block');
ok(wiring.includes('--_radius: var(--skeleton-radius);'), 'skeleton radius private');
ok(!wiring.includes('[data-element="skeleton"]:is('), 'skeleton has no state rules');
ok(wiring.includes('[data-element="breadcrumb"] {\n  --_link-color: var(--breadcrumb-link-color);'), 'breadcrumb default block');
ok(wiring.includes('[data-element="breadcrumb"]:is(:hover:not([data-state]), [data-state="hover"]) {\n  --_link-color: var(--breadcrumb-link-color-hover);'), 'breadcrumb hover block');
ok(wiring.includes('--_separator: var(--breadcrumb-separator);'), 'breadcrumb separator private');
ok(wiring.includes('--_gap: var(--breadcrumb-gap);'), 'breadcrumb gap private');
ok(!wiring.includes('[data-element="breadcrumb"]:is(:focus'), 'breadcrumb has no focus/active/disabled state rules');
ok(wiring.includes('[data-element="pagination"] {\n  --_gap: var(--pagination-gap);'), 'pagination default block');
ok(!wiring.includes('[data-element="pagination"]:is('), 'pagination has no state rules');
ok(wiring.includes('[data-element="pagination-item"][data-variant="inactive"] {\n  --_bg: var(--pagination-item-inactive-bg);'), 'pagination-item inactive default block');
ok(wiring.includes('[data-element="pagination-item"][data-variant="active"] {\n  --_bg: var(--pagination-item-active-bg);'), 'pagination-item active default block');
ok(wiring.includes('[data-element="pagination-item"][data-variant="inactive"]:is(:hover:not([data-state]), [data-state="hover"]) {\n  --_bg: var(--pagination-item-inactive-bg-hover);'), 'pagination-item inactive hover block');
ok(wiring.includes('[data-element="pagination-item"][data-variant="inactive"]:is(:focus-visible:not([data-state]), :focus-within:not([data-state]), [data-state="focus"]) {\n  --_bg: var(--pagination-item-inactive-bg-focus);'), 'pagination-item inactive focus block');
ok(wiring.includes('--_ring-color: var(--pagination-item-inactive-ring-color-focus);'), 'pagination-item focus ring private');
ok(wiring.includes('[data-element="pagination-item"][data-variant="inactive"]:is(:disabled, [data-state="disabled"], [aria-disabled="true"]) {\n  --_bg: var(--pagination-item-inactive-bg-disabled);'), 'pagination-item inactive disabled block');
ok(!wiring.includes('[data-element="pagination-item"][data-variant="inactive"]:is(:active'), 'pagination-item has no active STATE rule (active is a variant)');
ok(wiring.includes('--_size: var(--pagination-item-inactive-size);'), 'pagination-item size private');
ok(wiring.includes('--_text-family: var(--pagination-item-inactive-text-type-family);'), 'pagination-item text type private');

// --- components.css reads only privates the wiring defines ---------------
{
    const css = fs.readFileSync(path.join(root, 'preview', 'components.css'), 'utf8');
    const defined = new Set(wiring.match(/--_[a-z0-9-]+(?=:)/g));
    const cssState = new Set(['--_ring-on', '--_mark-on', '--_thumb-shift', '--_value']); // CSS-internal state tokens
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
    ok(g.categoryOf('dialog') === 'surfaces', 'dialog categorized as surfaces');
    ok(g.categoryOf('dropdown-menu') === 'navigation', 'dropdown-menu categorized as navigation');
    ok(g.categoryOf('combobox') === 'forms', 'combobox categorized as forms');
    ok(g.categoryOf('progress') === 'feedback', 'progress categorized as feedback');
    ok(g.categoryOf('skeleton') === 'feedback', 'skeleton categorized as feedback');
    ok(g.categoryOf('breadcrumb') === 'navigation', 'breadcrumb categorized as navigation');
    ok(g.categoryOf('pagination') === 'navigation' && g.categoryOf('pagination-item') === 'navigation', 'pagination categorized as navigation');
}
ok(html.indexOf('id="gallery-dialog"') > html.indexOf('id="gallery-separator"'), 'dialog appears after separator in the gallery');
ok(html.indexOf('id="gallery-dropdown-menu"') > html.indexOf('id="gallery-list-item"'), 'dropdown-menu appears after list-item in the gallery');
ok(html.indexOf('id="gallery-combobox"') > html.indexOf('id="gallery-switch"'), 'combobox appears after switch in the gallery');
ok(html.indexOf('id="gallery-toast"') > html.indexOf('id="gallery-tooltip"'), 'toast appears after tooltip in the gallery');
ok(html.indexOf('id="gallery-progress"') > html.indexOf('id="gallery-toast"'), 'progress appears after toast in the gallery');
ok(html.indexOf('id="gallery-skeleton"') > html.indexOf('id="gallery-progress"'), 'skeleton appears after progress in the gallery');
ok(html.indexOf('id="gallery-breadcrumb"') > html.indexOf('id="gallery-dropdown-menu"'), 'breadcrumb appears after dropdown-menu (end of the navigation group)');
ok(html.indexOf('id="gallery-pagination"') > html.indexOf('id="gallery-breadcrumb"'), 'pagination appears after breadcrumb in the gallery');
ok(html.indexOf('id="gallery-pagination-item"') > html.indexOf('id="gallery-pagination"'), 'pagination-item appears after pagination (end of the navigation group)');

// --- Dialog gallery markup --------------------------------------------------
{
    const dialogHtml = g.renderGalleryInstance('dialog', null, 'default');
    ok(dialogHtml.startsWith('<div class="ds-dialog" data-element="dialog" data-state="default" data-part="overlay">'), 'dialog root carries data-part="overlay"');
    ok(dialogHtml.includes('data-part="bg"'), 'dialog panel part');
    ok(dialogHtml.includes('data-part="close"'), 'dialog close part');
    ok(dialogHtml.includes('data-part="title"'), 'dialog title part');
    ok(dialogHtml.includes('data-part="description"'), 'dialog description part');
    ok((dialogHtml.match(/data-element="button"/g) || []).length === 2, 'dialog nests exactly two buttons');
    ok(dialogHtml.includes('data-variant="outline"'), 'dialog cancel is outline');
    ok(dialogHtml.includes('data-variant="primary"'), 'dialog continue is primary');
    ok(!dialogHtml.includes('<dialog'), 'no native <dialog> element');
}

// --- Dropdown menu gallery markup -------------------------------------------
{
    const menuHtml = g.renderGalleryInstance('dropdown-menu', null, 'default');
    ok(menuHtml.startsWith('<div role="menu" class="ds-dropdown-menu" data-element="dropdown-menu" data-state="default" data-part="bg">'), 'dropdown-menu root carries data-part="bg" and role="menu"');
    ok(menuHtml.includes('data-part="text"'), 'dropdown-menu has a paintable/clickable text part');
    ok(!/<h[1-6][ >]/.test(menuHtml), 'dropdown-menu label is not a heading element');
    ok((menuHtml.match(/data-element="list-item"/g) || []).length === 3, 'dropdown-menu nests exactly three list items');
    ok((menuHtml.match(/data-state="default"/g) || []).length === 4, 'dropdown-menu + all three items are in their default state');
    ok(!menuHtml.includes('data-state="hover"') && !menuHtml.includes('data-state="active"') && !menuHtml.includes('data-state="disabled"'), 'nested list items carry no non-default state');
    ok(!menuHtml.includes('gallery-stage'), 'dropdown-menu instance carries no nested stage markup');
    ok(!menuHtml.includes('id="gallery-list-item"'), 'nested list items are not full gallery sections');
}

// --- Combobox gallery markup -------------------------------------------------
{
    const comboHtml = g.renderGalleryInstance('combobox', null, 'default');
    ok(comboHtml.startsWith('<div class="gallery-stack">'), 'combobox instance wrapped in a gallery-stack');
    ok((comboHtml.match(/data-element="combobox"/g) || []).length === 1, 'exactly one combobox trigger');
    ok(comboHtml.includes('role="combobox"') && comboHtml.includes('aria-expanded="true"'), 'combobox trigger role + expanded state (menu is open)');
    ok(comboHtml.includes('data-part="bg"'), 'combobox trigger root carries data-part="bg"');
    ok(comboHtml.includes('data-part="placeholder"'), 'combobox placeholder part is paintable/clickable');
    ok(comboHtml.includes('data-part="icon"'), 'combobox icon part is paintable/clickable');
    ok(comboHtml.includes('data-element="dropdown-menu"'), 'combobox nests the dropdown menu');
    ok((comboHtml.match(/data-element="list-item"/g) || []).length === 3, 'the nested dropdown menu keeps its three list items');
    // trigger and menu are rendered as siblings (trigger's own markup closes - icon svg then the trigger span - before the menu opens), never nested
    ok(comboHtml.indexOf('</svg></span>') > -1 && comboHtml.indexOf('</svg></span>') < comboHtml.indexOf('<div role="menu"'), 'trigger closes before the dropdown menu opens (siblings, not nested)');
    ok(!comboHtml.includes('gallery-stage'), 'combobox instance carries no nested stage markup');
    ok(!comboHtml.includes('id="gallery-dropdown-menu"') && !comboHtml.includes('id="gallery-list-item"'), 'nested instances are not full gallery sections');
}
// --- Toast gallery markup ----------------------------------------------------
{
    const toastHtml = g.renderGalleryInstance('toast', 'destructive', 'default');
    ok(toastHtml.includes('data-variant="destructive"'), 'toast destructive variant marks the root');
    ok(toastHtml.includes('data-part="bg"'), 'toast root carries data-part="bg"');
    ok(toastHtml.includes('data-part="icon"'), 'toast icon part');
    ok(toastHtml.includes('data-part="title"'), 'toast title part');
    ok(toastHtml.includes('data-part="description"'), 'toast description part');
    ok(toastHtml.includes('data-part="close"'), 'toast close part');
    ok(!/<h[1-6][ >]/.test(toastHtml), 'toast copy is not a heading element');
}
// --- Progress gallery markup -------------------------------------------------
{
    const progressHtml = g.renderGalleryInstance('progress', null, 'default');
    ok(progressHtml.startsWith('<div class="gallery-stack">'), 'progress instances wrapped in a gallery-stack');
    ok((progressHtml.match(/role="progressbar"/g) || []).length === 3, 'three progressbar roots');
    ok((progressHtml.match(/data-element="progress"/g) || []).length === 3, 'three progress instances');
    ok((progressHtml.match(/data-part="track"/g) || []).length === 3, 'three track parts (the roots)');
    ok((progressHtml.match(/data-part="indicator"/g) || []).length === 3, 'three indicator parts');
    ok(!progressHtml.includes('data-variant='), 'progress carries no data-variant (no variants)');
    ok(progressHtml.includes('--_value: 25%') && progressHtml.includes('--_value: 50%') && progressHtml.includes('--_value: 75%'), 'fills at 25/50/75%');
    ok(progressHtml.includes('aria-valuenow="25"') && progressHtml.includes('aria-valuenow="50"') && progressHtml.includes('aria-valuenow="75"'), 'aria-valuenow matches each fill');
    ok(!progressHtml.includes('gallery-stage'), 'progress instance carries no nested stage markup');
    ok(!/<h[1-6][ >]/.test(progressHtml), 'progress has no heading copy');
}
// --- Skeleton gallery markup -------------------------------------------------
{
    const skeletonHtml = g.renderGalleryInstance('skeleton', null, 'default');
    ok(skeletonHtml.startsWith('<div class="ds-skeleton" data-element="skeleton" data-state="default" data-part="bg">'), 'skeleton root carries data-part="bg"');
    ok((skeletonHtml.match(/data-part="bg"/g) || []).length === 4, 'skeleton root + three blocks all carry data-part="bg"');
    ok(skeletonHtml.includes('class="ds-skeleton-block ds-skeleton-avatar"'), 'skeleton avatar block');
    ok(skeletonHtml.includes('class="ds-skeleton-block ds-skeleton-line"'), 'skeleton full-width line block');
    ok(skeletonHtml.includes('class="ds-skeleton-block ds-skeleton-line ds-skeleton-line-short"'), 'skeleton short line block');
    ok(!skeletonHtml.includes('data-variant='), 'skeleton carries no data-variant (no variants)');
    ok(!skeletonHtml.includes('gallery-stage'), 'skeleton instance carries no nested stage markup');
    ok(!/<h[1-6][ >]/.test(skeletonHtml), 'skeleton has no heading copy');
}
// --- Breadcrumb gallery markup ------------------------------------------------
{
    const crumbHtml = g.renderGalleryInstance('breadcrumb', null, 'default');
    ok(crumbHtml.startsWith('<nav aria-label="Breadcrumb" class="ds-breadcrumb" data-element="breadcrumb" data-state="default" data-part="gap">'), 'breadcrumb root carries data-part="gap" and role via <nav>');
    ok((crumbHtml.match(/data-part="link"/g) || []).length === 2, 'two link parts');
    ok((crumbHtml.match(/data-part="separator"/g) || []).length === 2, 'two separator parts');
    ok((crumbHtml.match(/data-part="current"/g) || []).length === 1, 'one current part');
    ok(crumbHtml.includes('aria-current="page"'), 'current crumb carries aria-current');
    ok(!crumbHtml.includes('data-variant='), 'breadcrumb carries no data-variant (no variants)');
    ok(!crumbHtml.includes('data-state="hover"'), 'gallery specimen is not shown in the hover state');
    ok(!crumbHtml.includes('gallery-stage'), 'breadcrumb instance carries no nested stage markup');
    ok(!/<h[1-6][ >]/.test(crumbHtml), 'breadcrumb has no heading copy');
    ok(!crumbHtml.includes('<img') && !crumbHtml.includes('http') && !/ src=/.test(crumbHtml), 'breadcrumb has no external assets');
}
// --- Pagination gallery markup ------------------------------------------------
{
    const pagerHtml = g.renderGalleryInstance('pagination', null, 'default');
    ok(pagerHtml.startsWith('<nav aria-label="Pagination" class="ds-pagination" data-element="pagination" data-state="default" data-part="gap">'), 'pagination root carries data-part="gap"');
    ok((pagerHtml.match(/data-element="pagination-item"/g) || []).length === 7, 'seven pagination-item instances (‹ 1 2 3 … 10 ›)');
    ok((pagerHtml.match(/data-variant="active"/g) || []).length === 1, 'exactly one active item (page 2)');
    ok((pagerHtml.match(/data-variant="inactive"/g) || []).length === 6, 'six inactive items');
    ok((pagerHtml.match(/data-state="default"/g) || []).length === 8, 'host + all seven items are in their default state');
    ok(!pagerHtml.includes('data-state="hover"') && !pagerHtml.includes('data-state="disabled"'), 'gallery specimen is not shown in hover/disabled');
    ['‹', '1', '2', '3', '…', '10', '›'].forEach(g2 => ok(pagerHtml.includes(`data-part="text">${g2}<`), `renders the "${g2}" item`));
    ok(!pagerHtml.includes('gallery-stage'), 'pagination instance carries no nested stage markup');
    ok(!/<h[1-6][ >]/.test(pagerHtml), 'pagination has no heading copy');
    ok(!pagerHtml.includes('<img') && !pagerHtml.includes('http') && !/ src=/.test(pagerHtml), 'pagination has no external assets');
}
{
    const itemHtml = g.renderGalleryInstance('pagination-item', 'inactive', 'default');
    ok((itemHtml.match(/data-element="pagination-item"/g) || []).length === 1, 'pagination-item stage shows exactly one item');
    ok(itemHtml.includes('data-variant="inactive"'), 'pagination-item stage shows the inactive variant alone');
    ok(!itemHtml.includes('data-variant="active"'), 'pagination-item stage carries no active instance');
    ok(itemHtml.includes('data-part="text"'), 'pagination-item text part is paintable/clickable');
    ok(!itemHtml.includes('gallery-stage'), 'pagination-item instance carries no nested stage markup');
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

console.log(`components.test.js: ${checks} checks passed`);
