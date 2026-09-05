// components.js - the "Elements" layer of Theme Editor: component-part
// tokens with states, seeding, wiring CSS, gallery. Plain browser globals, loaded
// after foundation.js; uses parseRef / refToVar / scaleEntries /
// findScaleEntry / nearestScaleEntry / remapRef / scaleRef from there.
//
// Token id:  <element>[.<variant>].<part>[.<prop>][.<state>]
//   - variant omitted when the element has no variants
//   - prop omitted when the part has a single property
//   - state omitted for "default"
// Public CSS var:  "--" + id with "." -> "-"     --button-primary-bg-hover
//   A `type` prop expands to five vars, suffixed AFTER the full id (state
//   included):  --input-text-type-family … --input-text-type-hover-family
//
// PRIVATE VAR NAMING (the only thing preview/components.css reads):
//   single-prop part          --_<part>            bg{color}      -> --_bg
//                                                   radius         -> --_radius
//                                                   separator.width-> --_width
//   multi-prop part           --_<part>-<prop>     text{color,…}  -> --_text-color
//                                                   padding{x,y}   -> --_padding-x, --_padding-y
//                                                   header{color,text,type} -> --_header-color, --_header-text
//                                                   cell{…,padding-x} -> --_cell-padding-x
//   `type` prop (any part)    --_<part>-family | -weight | -size | -leading | -tracking
//                                                   text{color,type} -> --_text-family …
//                                                   cell{color,type} -> --_cell-family …
// The wiring sheet (buildWiringCss) assigns every private from the public
// var on `[data-element][data-variant]`, per state, so components.css never
// needs to know which element or state it is painting.
//
// Seeds are shadcn/ui defaults expressed as refs into the semantic layer
// (color.*) and the Tailwind foundation scales; scale refs are remapped with
// remapRef('tailwind', source) for any other source. `@radius` is a
// placeholder for the theme radius (ctx.radiusRem -> nearestScaleEntry).

const COMPONENT_STATES = ['default', 'hover', 'focus', 'active', 'disabled'];
const COMPONENT_STATE_LABELS = { default: 'Default', hover: 'Hover', focus: 'Focus', active: 'Active', disabled: 'Disabled' };
const TYPE_PROP_FIELDS = ['family', 'weight', 'size', 'leading', 'tracking'];
const THEME_RADIUS_SEED = '@radius';
const THEME_RADIUS_FALLBACK_REM = 0.5;

// State selectors of the wiring sheet (contract, verbatim).
const COMPONENT_STATE_SELECTORS = {
    hover: ':is(:hover:not([data-state]), [data-state="hover"])',
    focus: ':is(:focus-visible:not([data-state]), :focus-within:not([data-state]), [data-state="focus"])',
    active: ':is(:active:not([data-state]), [data-state="active"], [aria-selected="true"], [aria-pressed="true"])',
    disabled: ':is(:disabled, [data-state="disabled"], [aria-disabled="true"])'
};

// --- ELEMENTS spec -----------------------------------------------------------

function _part(key, label, props) {
    return { key, label, props: props.map(([k, kind]) => ({ key: k, kind })) };
}
const _bg = () => _part('bg', 'Background', [['color', 'color']]);
const _text = () => _part('text', 'Text', [['color', 'color'], ['type', 'type']]);
const _icon = () => _part('icon', 'Icon', [['color', 'color']]);
const _border = () => _part('border', 'Border', [['color', 'color'], ['width', 'borderWidth'], ['style', 'borderStyle']]);
const _radius = () => _part('radius', 'Radius', [['radius', 'radius']]);
const _paddingXY = () => _part('padding', 'Padding', [['x', 'space'], ['y', 'space']]);
const _padding = () => _part('padding', 'Padding', [['padding', 'space']]);
const _gap = () => _part('gap', 'Gap', [['gap', 'space']]);
const _shadow = () => _part('shadow', 'Shadow', [['shadow', 'shadow']]);
const _ring = () => _part('ring', 'Focus ring', [['color', 'color'], ['width', 'borderWidth']]);
const _colorPart = (key, label) => _part(key, label, [['color', 'color']]);
const _textPart = (key, label) => _part(key, label, [['color', 'color'], ['type', 'type']]);
const _spacePart = (key, label) => _part(key, label, [[key, 'space']]);

const FORM_STATES = ['default', 'hover', 'focus', 'disabled'];

// Gallery categories: the order
// of the Elements page and of the parent's .gallery-nav. An element missing
// from every list lands in the trailing "Other" category.
const ELEMENT_CATEGORIES = [
    { key: 'actions',    label: 'Actions',    elements: ['button'] },
    { key: 'forms',      label: 'Forms',      elements: ['input', 'select', 'textarea', 'checkbox', 'radio', 'switch'] },
    { key: 'feedback',   label: 'Feedback',   elements: ['alert', 'badge', 'tooltip'] },
    { key: 'surfaces',   label: 'Surfaces',   elements: ['card', 'popover', 'separator'] },
    { key: 'navigation', label: 'Navigation', elements: ['tabs-list', 'tab', 'list-item'] },
    { key: 'data',       label: 'Data',       elements: ['table', 'table-row', 'avatar'] }
];
const OTHER_CATEGORY = { key: 'other', label: 'Other', elements: [] };

// Category key of an element (the first ELEMENT_CATEGORIES entry listing it,
// else 'other'). Every ELEMENTS entry carries the same value as `category`.
function categoryOf(elementKey) {
    const cat = ELEMENT_CATEGORIES.find(c => c.elements.includes(elementKey));
    return cat ? cat.key : OTHER_CATEGORY.key;
}

function _el(key, label, variants, states, parts) {
    return { key, label, category: categoryOf(key), variants, states, parts };
}

const ELEMENTS = [
    _el('button', 'Button', ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link'], COMPONENT_STATES,
        [_bg(), _text(), _icon(), _border(), _radius(), _paddingXY(), _gap(), _shadow(), _ring()]),
    _el('input', 'Input', null, FORM_STATES,
        [_bg(), _text(), _colorPart('placeholder', 'Placeholder'), _border(), _radius(), _paddingXY(), _shadow(), _ring()]),
    _el('select', 'Select', null, FORM_STATES,
        [_bg(), _text(), _colorPart('placeholder', 'Placeholder'), _icon(), _border(), _radius(), _paddingXY(), _shadow(), _ring()]),
    _el('textarea', 'Textarea', null, FORM_STATES,
        [_bg(), _text(), _colorPart('placeholder', 'Placeholder'), _border(), _radius(), _paddingXY(), _shadow(), _ring()]),
    _el('checkbox', 'Checkbox', ['unchecked', 'checked'], FORM_STATES,
        [_colorPart('box', 'Box'), _border(), _colorPart('mark', 'Check mark'), _radius(), _spacePart('size', 'Size'), _ring(), _textPart('label', 'Label'), _gap()]),
    _el('radio', 'Radio', ['unchecked', 'checked'], FORM_STATES,
        [_colorPart('box', 'Box'), _border(), _colorPart('mark', 'Dot'), _radius(), _spacePart('size', 'Size'), _ring(), _textPart('label', 'Label'), _gap()]),
    _el('switch', 'Switch', ['off', 'on'], FORM_STATES,
        [_colorPart('track', 'Track'), _colorPart('thumb', 'Thumb'), _radius(), _spacePart('width', 'Width'), _spacePart('height', 'Height'), _ring(), _textPart('label', 'Label'), _gap()]),
    _el('badge', 'Badge', ['default', 'secondary', 'destructive', 'outline'], ['default'],
        [_bg(), _text(), _border(), _radius(), _paddingXY()]),
    _el('card', 'Card', null, ['default'],
        [_bg(), _border(), _radius(), _padding(), _gap(), _shadow(), _textPart('title', 'Title'), _textPart('description', 'Description'), _textPart('body', 'Body')]),
    _el('alert', 'Alert', ['default', 'destructive'], ['default'],
        [_bg(), _border(), _radius(), _padding(), _gap(), _icon(), _textPart('title', 'Title'), _textPart('description', 'Description')]),
    _el('tabs-list', 'Tabs list', null, ['default'],
        [_bg(), _radius(), _padding(), _gap()]),
    _el('tab', 'Tab', ['inactive', 'active'], FORM_STATES,
        [_bg(), _text(), _radius(), _paddingXY(), _shadow(), _ring()]),
    _el('table', 'Table', null, ['default'],
        [_part('header', 'Header', [['color', 'color'], ['text', 'color'], ['type', 'type']]),
         _part('cell', 'Cell', [['color', 'color'], ['type', 'type'], ['padding-x', 'space'], ['padding-y', 'space']]),
         _border()]),
    _el('table-row', 'Table row', null, ['default', 'hover', 'active'],
        [_bg()]),
    _el('avatar', 'Avatar', null, ['default'],
        [_bg(), _text(), _radius(), _spacePart('size', 'Size'), _border()]),
    _el('tooltip', 'Tooltip', null, ['default'],
        [_bg(), _text(), _radius(), _paddingXY(), _shadow()]),
    _el('popover', 'Popover', null, ['default'],
        [_bg(), _text(), _border(), _radius(), _padding(), _gap(), _shadow()]),
    _el('list-item', 'List item', null, ['default', 'hover', 'active', 'disabled'],
        [_bg(), _text(), _textPart('meta', 'Meta'), _icon(), _paddingXY(), _gap(), _radius()]),
    _el('separator', 'Separator', null, ['default'],
        [_colorPart('line', 'Line'), _part('width', 'Width', [['width', 'borderWidth']])])
];

// --- Seeds (shadcn/ui defaults, Tailwind refs) -------------------------------
//
// Per element: `base` applies to every variant, `variants` overrides per
// variant, `states` keys are "<variant|*>.<state>". Keys are "<part>" or
// "<part>.<prop>" exactly as in the token id.

const DISABLED_BOX = { bg: 'color.muted', 'text.color': 'color.muted-foreground', icon: 'color.muted-foreground', 'border.color': 'color.muted', placeholder: 'color.muted-foreground' };
const DISABLED_CHECK = { box: 'color.muted', 'border.color': 'color.muted', mark: 'color.muted-foreground', 'label.color': 'color.muted-foreground' };
const ACCENT_HOVER = { bg: 'color.accent', 'text.color': 'color.accent-foreground', icon: 'color.accent-foreground' };

const SEED_SPEC = {
    button: {
        base: {
            'text.type': 'type.label', 'border.width': 'border.width.0', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, 'padding.x': 'space.4', 'padding.y': 'space.2', gap: 'space.2',
            shadow: 'shadow.xs', 'ring.color': 'color.ring', 'ring.width': 'border.width.2'
        },
        variants: {
            primary: { bg: 'color.primary', 'text.color': 'color.primary-foreground', icon: 'color.primary-foreground', 'border.color': 'color.primary' },
            secondary: { bg: 'color.secondary', 'text.color': 'color.secondary-foreground', icon: 'color.secondary-foreground', 'border.color': 'color.secondary' },
            destructive: { bg: 'color.destructive', 'text.color': 'color.destructive-foreground', icon: 'color.destructive-foreground', 'border.color': 'color.destructive' },
            outline: { bg: 'color.background', 'text.color': 'color.foreground', icon: 'color.foreground', 'border.color': 'color.input', 'border.width': 'border.width.1' },
            ghost: { bg: 'palette.transparent', 'text.color': 'color.foreground', icon: 'color.foreground', 'border.color': 'palette.transparent', shadow: 'shadow.none' },
            link: { bg: 'palette.transparent', 'text.color': 'color.primary', icon: 'color.primary', 'border.color': 'palette.transparent', shadow: 'shadow.none' }
        },
        states: {
            '*.focus': { 'border.color': 'color.ring' },
            '*.disabled': { bg: 'color.muted', 'text.color': 'color.muted-foreground', icon: 'color.muted-foreground', 'border.color': 'color.muted' },
            'outline.hover': ACCENT_HOVER,
            'ghost.hover': ACCENT_HOVER
        }
    },
    input: {
        base: {
            bg: 'color.background', 'text.color': 'color.foreground', 'text.type': 'type.body', placeholder: 'color.muted-foreground',
            'border.color': 'color.input', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, 'padding.x': 'space.3', 'padding.y': 'space.2', shadow: 'shadow.xs',
            'ring.color': 'color.ring', 'ring.width': 'border.width.2'
        },
        states: {
            '*.focus': { 'border.color': 'color.ring' },
            '*.disabled': { bg: 'color.muted', 'text.color': 'color.muted-foreground', 'border.color': 'color.muted', placeholder: 'color.muted-foreground' }
        }
    },
    select: {
        base: {
            bg: 'color.background', 'text.color': 'color.foreground', 'text.type': 'type.body', placeholder: 'color.muted-foreground', icon: 'color.muted-foreground',
            'border.color': 'color.input', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, 'padding.x': 'space.3', 'padding.y': 'space.2', shadow: 'shadow.xs',
            'ring.color': 'color.ring', 'ring.width': 'border.width.2'
        },
        states: {
            '*.focus': { 'border.color': 'color.ring' },
            '*.disabled': DISABLED_BOX
        }
    },
    textarea: {
        base: {
            bg: 'color.background', 'text.color': 'color.foreground', 'text.type': 'type.body', placeholder: 'color.muted-foreground',
            'border.color': 'color.input', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, 'padding.x': 'space.3', 'padding.y': 'space.2', shadow: 'shadow.xs',
            'ring.color': 'color.ring', 'ring.width': 'border.width.2'
        },
        states: {
            '*.focus': { 'border.color': 'color.ring' },
            '*.disabled': { bg: 'color.muted', 'text.color': 'color.muted-foreground', 'border.color': 'color.muted', placeholder: 'color.muted-foreground' }
        }
    },
    checkbox: {
        base: {
            'border.width': 'border.width.1', 'border.style': 'border.style.solid', mark: 'color.primary-foreground',
            radius: 'radius.sm', size: 'space.4', 'ring.color': 'color.ring', 'ring.width': 'border.width.2',
            'label.color': 'color.foreground', 'label.type': 'type.label', gap: 'space.2'
        },
        variants: {
            unchecked: { box: 'color.background', 'border.color': 'color.input' },
            checked: { box: 'color.primary', 'border.color': 'color.primary' }
        },
        states: { '*.focus': { 'border.color': 'color.ring' }, '*.disabled': DISABLED_CHECK }
    },
    radio: {
        base: {
            'border.width': 'border.width.1', 'border.style': 'border.style.solid', mark: 'color.primary-foreground',
            radius: 'radius.full', size: 'space.4', 'ring.color': 'color.ring', 'ring.width': 'border.width.2',
            'label.color': 'color.foreground', 'label.type': 'type.label', gap: 'space.2'
        },
        variants: {
            unchecked: { box: 'color.background', 'border.color': 'color.input' },
            checked: { box: 'color.primary', 'border.color': 'color.primary' }
        },
        states: { '*.focus': { 'border.color': 'color.ring' }, '*.disabled': DISABLED_CHECK }
    },
    switch: {
        base: {
            thumb: 'color.background', radius: 'radius.full', width: 'space.9', height: 'space.5',
            'ring.color': 'color.ring', 'ring.width': 'border.width.2',
            'label.color': 'color.foreground', 'label.type': 'type.label', gap: 'space.2'
        },
        variants: {
            off: { track: 'color.input' },
            on: { track: 'color.primary' }
        },
        states: {
            '*.focus': { 'ring.color': 'color.ring' },
            '*.disabled': { track: 'color.muted', 'label.color': 'color.muted-foreground' }
        }
    },
    badge: {
        base: {
            'text.type': 'type.caption', 'border.color': 'palette.transparent', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: 'radius.full', 'padding.x': 'space.2.5', 'padding.y': 'space.0.5'
        },
        variants: {
            default: { bg: 'color.primary', 'text.color': 'color.primary-foreground' },
            secondary: { bg: 'color.secondary', 'text.color': 'color.secondary-foreground' },
            destructive: { bg: 'color.destructive', 'text.color': 'color.destructive-foreground' },
            outline: { bg: 'palette.transparent', 'text.color': 'color.foreground', 'border.color': 'color.border' }
        }
    },
    card: {
        base: {
            bg: 'color.card', 'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, padding: 'space.6', gap: 'space.4', shadow: 'shadow.sm',
            'title.color': 'color.card-foreground', 'title.type': 'type.subheading',
            'description.color': 'color.muted-foreground', 'description.type': 'type.caption',
            'body.color': 'color.card-foreground', 'body.type': 'type.body'
        }
    },
    alert: {
        base: {
            bg: 'color.card', 'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, padding: 'space.4', gap: 'space.3', icon: 'color.foreground',
            'title.color': 'color.foreground', 'title.type': 'type.label',
            'description.color': 'color.muted-foreground', 'description.type': 'type.caption'
        },
        variants: {
            default: {},
            destructive: { 'border.color': 'color.destructive', icon: 'color.destructive', 'title.color': 'color.destructive' }
        }
    },
    'tabs-list': {
        base: { bg: 'color.muted', radius: THEME_RADIUS_SEED, padding: 'space.1', gap: 'space.1' }
    },
    tab: {
        base: {
            'text.type': 'type.label', radius: THEME_RADIUS_SEED, 'padding.x': 'space.3', 'padding.y': 'space.1',
            'ring.color': 'color.ring', 'ring.width': 'border.width.2'
        },
        variants: {
            inactive: { bg: 'palette.transparent', 'text.color': 'color.muted-foreground', shadow: 'shadow.none' },
            active: { bg: 'color.background', 'text.color': 'color.foreground', shadow: 'shadow.xs' }
        },
        states: {
            '*.focus': { 'ring.color': 'color.ring' },
            '*.disabled': { bg: 'color.muted', 'text.color': 'color.muted-foreground' }
        }
    },
    table: {
        base: {
            'header.color': 'color.muted', 'header.text': 'color.muted-foreground', 'header.type': 'type.label',
            'cell.color': 'color.foreground', 'cell.type': 'type.body', 'cell.padding-x': 'space.3', 'cell.padding-y': 'space.2',
            'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid'
        }
    },
    'table-row': {
        base: { bg: 'palette.transparent' },
        states: { '*.hover': { bg: 'color.muted' }, '*.active': { bg: 'color.accent' } }
    },
    avatar: {
        base: {
            bg: 'color.muted', 'text.color': 'color.muted-foreground', 'text.type': 'type.label', radius: 'radius.full', size: 'space.10',
            'border.color': 'color.border', 'border.width': 'border.width.0', 'border.style': 'border.style.solid'
        }
    },
    tooltip: {
        base: {
            bg: 'color.primary', 'text.color': 'color.primary-foreground', 'text.type': 'type.caption', radius: 'radius.md',
            'padding.x': 'space.3', 'padding.y': 'space.1.5', shadow: 'shadow.xs'
        }
    },
    popover: {
        base: {
            bg: 'color.popover', 'text.color': 'color.popover-foreground', 'text.type': 'type.body',
            'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, padding: 'space.4', gap: 'space.2', shadow: 'shadow.md'
        }
    },
    'list-item': {
        base: {
            bg: 'palette.transparent', 'text.color': 'color.foreground', 'text.type': 'type.body',
            'meta.color': 'color.muted-foreground', 'meta.type': 'type.caption', icon: 'color.muted-foreground',
            'padding.x': 'space.2', 'padding.y': 'space.1.5', gap: 'space.2', radius: 'radius.sm'
        },
        states: {
            '*.hover': ACCENT_HOVER,
            '*.active': ACCENT_HOVER,
            '*.disabled': { bg: 'color.muted', 'text.color': 'color.muted-foreground', icon: 'color.muted-foreground' }
        }
    },
    separator: {
        base: { line: 'color.border', width: 'border.width.1' }
    }
};

// --- Spec lookups ------------------------------------------------------------

function elementSpec(element) {
    return typeof element === 'string' ? allElements().find(e => e.key === element) || null : element;
}

function partSpec(element, part) {
    const el = elementSpec(element);
    return el ? el.parts.find(p => p.key === part) || null : null;
}

function propSpec(part, prop) {
    if (!part) return null;
    if (part.props.length === 1) return part.props[0];
    return part.props.find(p => p.key === prop) || null;
}

function propKind(element, part, prop) {
    const p = propSpec(partSpec(element, part), prop);
    return p ? p.kind : null;
}

function elementVariants(el) {
    return el.variants || [null];
}

// Private var name(s) a (part, prop) pair is read through. Returns
// [{ name, suffix }] - one entry, or five for a `type` prop (suffix is the
// "-family" etc. appended to the public var).
function privateVarNames(part, prop) {
    const base = part.props.length === 1 ? `--_${part.key}` : `--_${part.key}-${prop.key}`;
    if (prop.kind === 'type') return TYPE_PROP_FIELDS.map(f => ({ name: `--_${part.key}-${f}`, suffix: `-${f}` }));
    return [{ name: base, suffix: '' }];
}

// --- Token ids ---------------------------------------------------------------

function tokenId(element, variant, part, prop, state) {
    const el = elementSpec(element);
    const p = partSpec(el, part);
    const seg = [el ? el.key : element];
    if (el && el.variants && variant) seg.push(variant);
    seg.push(part);
    if (p && p.props.length > 1 && prop) seg.push(prop);
    if (state && state !== 'default') seg.push(state);
    return seg.join('.');
}

function tokenIdParts(id) {
    const seg = String(id).split('.');
    const el = elementSpec(seg[0]);
    if (!el) return null;
    let i = 1;
    let variant = null;
    if (el.variants) {
        variant = seg[i++];
        if (!el.variants.includes(variant)) return null;
    }
    const part = partSpec(el, seg[i++]);
    if (!part) return null;
    let prop = null;
    if (part.props.length > 1) {
        prop = seg[i++];
        if (!propSpec(part, prop)) return null;
    }
    const state = seg[i] || 'default';
    if (i < seg.length - 1) return null;
    if (!el.states.includes(state)) return null;
    return { element: el.key, variant, part: part.key, prop, state };
}

function idToVar(id) {
    return `--${id.replace(/\./g, '-')}`;
}

// Iterates every (element, variant, part, prop) of the spec in order -
// allElements(), so a registered custom element's ids/seeds/CSS are covered
// by every consumer below with no separate custom-only pass.
function forEachTokenSlot(fn) {
    allElements().forEach(el => {
        elementVariants(el).forEach(variant => {
            el.parts.forEach(part => {
                part.props.forEach(prop => fn(el, variant, part, prop));
            });
        });
    });
}

function componentTokenIds() {
    const ids = [];
    forEachTokenSlot((el, variant, part, prop) => ids.push(tokenId(el, variant, part.key, prop.key)));
    return ids;
}

// --- Seeding -----------------------------------------------------------------

function themeRadiusRef(sourceKey, ctx) {
    const rem = ctx && typeof ctx.radiusRem === 'number' && !isNaN(ctx.radiusRem) ? ctx.radiusRem : THEME_RADIUS_FALLBACK_REM;
    const entry = nearestScaleEntry(sourceKey, 'radius', rem) || nearestScaleEntry(sourceKey, 'radius', THEME_RADIUS_FALLBACK_REM);
    return entry ? scaleRef('radius', entry.name) : 'radius.md';
}

function seedRef(raw, sourceKey, ctx) {
    if (raw === THEME_RADIUS_SEED) return themeRadiusRef(sourceKey, ctx);
    return sourceKey === 'tailwind' ? raw : remapRef(raw, 'tailwind', sourceKey);
}

function seedComponentTokens(sourceKey, ctx) {
    const source = sourceKey || 'tailwind';
    const out = {};
    allElements().forEach(el => {
        // A custom element's own seed table (buildCustomElementSpec) - never
        // in SEED_SPEC, which stays the stock-only const.
        const spec = SEED_SPEC[el.key] || el.seedSpec || {};
        elementVariants(el).forEach(variant => {
            const defaults = Object.assign({}, spec.base || {}, (spec.variants && variant && spec.variants[variant]) || {});
            el.parts.forEach(part => {
                part.props.forEach(prop => {
                    const key = part.props.length === 1 ? part.key : `${part.key}.${prop.key}`;
                    if (defaults[key] === undefined) return;
                    out[tokenId(el, variant, part.key, prop.key)] = seedRef(defaults[key], source, ctx);
                });
            });
            el.states.forEach(state => {
                if (state === 'default' || !spec.states) return;
                const overrides = Object.assign({}, spec.states[`*.${state}`] || {}, (variant && spec.states[`${variant}.${state}`]) || {});
                Object.keys(overrides).forEach(key => {
                    const [partKey, propKey] = key.split('.');
                    const part = partSpec(el, partKey);
                    const prop = propSpec(part, propKey);
                    if (!prop) return;
                    out[tokenId(el, variant, part.key, prop.key, state)] = seedRef(overrides[key], source, ctx);
                });
            });
        });
    });
    return out;
}

// Lazily computed seeds for resolveComponentRef, keyed by source + theme
// radius. scripts.js may set `componentSeedCtx = { radiusRem }` to steer the
// radius seed; otherwise the fallback radius is used.
const _seedCache = {};
function seedsFor(sourceKey) {
    const ctx = typeof componentSeedCtx !== 'undefined' && componentSeedCtx ? componentSeedCtx : { radiusRem: THEME_RADIUS_FALLBACK_REM };
    const key = `${sourceKey}|${ctx.radiusRem}`;
    if (!_seedCache[key]) _seedCache[key] = seedComponentTokens(sourceKey, ctx);
    return _seedCache[key];
}

function activeSourceKey(sourceKey) {
    if (sourceKey) return sourceKey;
    return typeof activePaletteSource !== 'undefined' && activePaletteSource ? activePaletteSource : 'tailwind';
}

// Resolution order: explicit entry for the id -> seeded state override
// (shadcn's own hover/focus/disabled deltas survive a default-state edit) ->
// explicit default-state entry -> seeded default. Never undefined (null only
// for an id the spec doesn't know).
function resolveComponentRef(id, components, sourceKey) {
    const comps = components || {};
    if (comps[id] !== undefined && comps[id] !== null) return comps[id];
    const parts = tokenIdParts(id);
    if (!parts) return null;
    const seeds = seedsFor(activeSourceKey(sourceKey));
    if (parts.state !== 'default') {
        if (seeds[id] !== undefined) return seeds[id];
        const defaultId = tokenId(parts.element, parts.variant, parts.part, parts.prop);
        if (comps[defaultId] !== undefined && comps[defaultId] !== null) return comps[defaultId];
        return seeds[defaultId] !== undefined ? seeds[defaultId] : null;
    }
    return seeds[id] !== undefined ? seeds[id] : null;
}

// --- Emission ----------------------------------------------------------------

// `  --button-primary-bg: var(--primary);` for EVERY id x state (states
// resolved through inheritance); type props expand to five lines.
function componentVarLines(components, sourceKey) {
    const source = activeSourceKey(sourceKey);
    const lines = [];
    allElements().forEach(el => {
        elementVariants(el).forEach(variant => {
            el.states.forEach(state => {
                el.parts.forEach(part => {
                    part.props.forEach(prop => {
                        const id = tokenId(el, variant, part.key, prop.key, state);
                        const ref = resolveComponentRef(id, components, source);
                        const v = refToVar(ref);
                        const name = idToVar(id);
                        if (prop.kind === 'type') {
                            TYPE_PROP_FIELDS.forEach(f => lines.push(`  ${name}-${f}: var(${v}-${f});`));
                        } else {
                            lines.push(`  ${name}: var(${v});`);
                        }
                    });
                });
            });
        });
    });
    return lines.join('\n');
}

function elementSelector(el, variant) {
    return `[data-element="${el.key}"]` + (variant ? `[data-variant="${variant}"]` : '');
}

// Pure function of ELEMENTS: private <- public var per element/variant, per
// state, so components.css only ever reads --_*.
function buildWiringCss() {
    const componentRules = [];
    const stateRules = [];
    allElements().forEach(el => {
        elementVariants(el).forEach(variant => {
            const selector = elementSelector(el, variant);
            el.states.forEach(state => {
                const decls = [];
                el.parts.forEach(part => {
                    part.props.forEach(prop => {
                        const pub = idToVar(tokenId(el, variant, part.key, prop.key, state));
                        privateVarNames(part, prop).forEach(({ name, suffix }) => {
                            decls.push(`  ${name}: var(${pub}${suffix});`);
                        });
                    });
                });
                if (state === 'default') {
                    componentRules.push(`${selector} {\n${decls.join('\n')}\n}`);
                } else {
                    stateRules.push(`${selector}${COMPONENT_STATE_SELECTORS[state]} {\n${decls.join('\n')}\n}`);
                }
            });
        });
    });
    return `@layer components {\n${componentRules.join('\n')}\n}\n@layer states {\n${stateRules.join('\n')}\n}\n`;
}

// --- Usage / remap -----------------------------------------------------------

// { ref: [id, …] } over every default-state id (resolved) plus explicit
// state entries.
function componentUsage(components) {
    const comps = components || {};
    const usage = {};
    const add = (ref, id) => {
        if (!ref) return;
        (usage[ref] = usage[ref] || []).push(id);
    };
    componentTokenIds().forEach(id => add(resolveComponentRef(id, comps), id));
    Object.keys(comps).forEach(id => {
        const parts = tokenIdParts(id);
        if (parts && parts.state !== 'default') add(comps[id], id);
    });
    return usage;
}

function remapComponentTokens(components, from, to) {
    const out = {};
    Object.keys(components || {}).forEach(id => {
        out[id] = remapRef(components[id], from, to);
    });
    return out;
}

// --- Gallery -----------------------------------------------------------------

const _SVG_ATTRS = 'viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
const GALLERY_ICONS = {
    plus: '<path d="M8 3v10M3 8h10"/>',
    check: '<path d="M3 8.5l3 3 7-7"/>',
    chevron: '<path d="M4 6l4 4 4-4"/>',
    info: '<circle cx="8" cy="8" r="6.25"/><path d="M8 7v4M8 5v.5"/>',
    alert: '<path d="M8 2.5l6 11H2l6-11z"/><path d="M8 6.5v3M8 11.5v.5"/>',
    user: '<circle cx="8" cy="5.5" r="2.75"/><path d="M2.75 14a5.25 5.25 0 0 1 10.5 0"/>'
};

function galleryIcon(name, cls, part) {
    return `<svg class="${cls}" data-part="${part}" ${_SVG_ATTRS}>${GALLERY_ICONS[name]}</svg>`;
}

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// Attributes of an instance root.
function rootAttrs(element, variant, state, part, extra) {
    const attrs = [`class="ds-${element}${extra && extra.cls ? ' ' + extra.cls : ''}"`, `data-element="${element}"`];
    if (variant) attrs.push(`data-variant="${variant}"`);
    attrs.push(`data-state="${state}"`, `data-part="${part}"`);
    if (state === 'disabled') attrs.push('aria-disabled="true"');
    if (extra && extra.attrs) attrs.push(extra.attrs);
    return attrs.join(' ');
}

function renderButton(variant, state, label, extra) {
    return `<button type="button" ${rootAttrs('button', variant, state, 'bg', extra)}>` +
        galleryIcon('plus', 'ds-button-icon', 'icon') +
        `<span class="ds-button-text" data-part="text">${label || capitalize(variant)}</span></button>`;
}

function renderTab(variant, state, label) {
    return `<button type="button" role="tab" ${rootAttrs('tab', variant, state, 'bg')}>` +
        `<span class="ds-tab-text" data-part="text">${label}</span></button>`;
}

function renderTabsList(state, tabsHtml) {
    return `<div role="tablist" ${rootAttrs('tabs-list', null, state, 'bg')}>${tabsHtml}</div>`;
}

function renderTableRow(state, cells) {
    return `<tr ${rootAttrs('table-row', null, state, 'bg')}>` +
        cells.map(c => `<td class="ds-table-cell" data-element="table" data-part="cell">${c}</td>`).join('') +
        '</tr>';
}

function renderTable(state, rowsHtml, withHeader) {
    const head = withHeader
        ? '<thead><tr class="ds-table-header-row">' +
          ['Invoice', 'Status', 'Amount'].map(h => `<th class="ds-table-header" data-part="header">${h}</th>`).join('') +
          '</tr></thead>'
        : '';
    return `<table ${rootAttrs('table', null, state, 'cell')}>${head}<tbody>${rowsHtml}</tbody></table>`;
}

function renderAvatar(state, initials) {
    return `<span ${rootAttrs('avatar', null, state, 'bg')}><span class="ds-avatar-text" data-part="text">${initials}</span></span>`;
}

const GALLERY_RENDERERS = {
    button: (variant, state) => renderButton(variant, state),
    input: (variant, state) =>
        `<span ${rootAttrs('input', null, state, 'bg')}>` +
        `<input class="ds-input-field" data-part="text" type="text" value="Input text" placeholder="Placeholder" readonly tabindex="-1" aria-label="Input"></span>`,
    select: (variant, state) =>
        `<span role="combobox" aria-expanded="false" ${rootAttrs('select', null, state, 'bg')}>` +
        `<span class="ds-select-text" data-part="text">Option one</span>` +
        galleryIcon('chevron', 'ds-select-icon', 'icon') + '</span>',
    textarea: (variant, state) =>
        `<span ${rootAttrs('textarea', null, state, 'bg')}>` +
        `<textarea class="ds-textarea-field" data-part="text" rows="3" placeholder="Placeholder" readonly tabindex="-1" aria-label="Textarea">Textarea text that wraps onto a second line.</textarea></span>`,
    checkbox: (variant, state) =>
        `<label ${rootAttrs('checkbox', variant, state, 'box')}>` +
        `<span class="ds-checkbox-box" data-part="box" role="checkbox" aria-checked="${variant === 'checked'}">` +
        galleryIcon('check', 'ds-checkbox-mark', 'mark') + '</span>' +
        `<span class="ds-checkbox-label" data-part="label">${capitalize(variant)}</span></label>`,
    radio: (variant, state) =>
        `<label ${rootAttrs('radio', variant, state, 'box')}>` +
        `<span class="ds-radio-box" data-part="box" role="radio" aria-checked="${variant === 'checked'}">` +
        `<span class="ds-radio-mark" data-part="mark"></span></span>` +
        `<span class="ds-radio-label" data-part="label">${capitalize(variant)}</span></label>`,
    switch: (variant, state) =>
        `<label ${rootAttrs('switch', variant, state, 'track')}>` +
        `<span class="ds-switch-track" data-part="track" role="switch" aria-checked="${variant === 'on'}">` +
        `<span class="ds-switch-thumb" data-part="thumb"></span></span>` +
        `<span class="ds-switch-label" data-part="label">${capitalize(variant)}</span></label>`,
    badge: (variant, state) =>
        `<span ${rootAttrs('badge', variant, state, 'bg')}><span class="ds-badge-text" data-part="text">${capitalize(variant)}</span></span>`,
    card: (variant, state) =>
        `<div ${rootAttrs('card', null, state, 'bg')}>` +
        `<h3 class="ds-card-title" data-part="title">Card title</h3>` +
        `<p class="ds-card-description" data-part="description">A short description of what this card is about.</p>` +
        `<div class="ds-card-body" data-part="body">Body copy sits here. It inherits the card's body type set and colour, and wraps as needed.</div>` +
        renderButton('primary', 'default', 'Continue', { cls: 'ds-card-action' }) +
        '</div>',
    alert: (variant, state) =>
        `<div role="alert" ${rootAttrs('alert', variant, state, 'bg')}>` +
        galleryIcon(variant === 'destructive' ? 'alert' : 'info', 'ds-alert-icon', 'icon') +
        `<p class="ds-alert-title" data-part="title">${variant === 'destructive' ? 'Something went wrong' : 'Heads up!'}</p>` +
        `<p class="ds-alert-description" data-part="description">${variant === 'destructive' ? 'Your session has expired. Please sign in again.' : 'You can add components to your app using the CLI.'}</p>` +
        '</div>',
    'tabs-list': (variant, state) =>
        renderTabsList(state, renderTab('active', 'default', 'Account') + renderTab('inactive', 'default', 'Password') + renderTab('inactive', 'default', 'Team')),
    tab: (variant, state) =>
        renderTabsList('default', renderTab(variant, state, capitalize(variant))),
    table: (variant, state) =>
        renderTable(state,
            renderTableRow('default', ['INV001', 'Paid', '$250.00']) +
            renderTableRow('default', ['INV002', 'Pending', '$150.00']) +
            renderTableRow('default', ['INV003', 'Unpaid', '$350.00']),
            true),
    'table-row': (variant, state) =>
        renderTable('default', renderTableRow(state, ['INV001', 'Paid', '$250.00']), false),
    avatar: (variant, state) =>
        `<div class="gallery-group">${renderAvatar(state, 'AB')}${renderAvatar(state, 'CD')}${renderAvatar(state, 'EF')}</div>`,
    tooltip: (variant, state) =>
        `<span role="tooltip" ${rootAttrs('tooltip', null, state, 'bg')}><span class="ds-tooltip-text" data-part="text">Add to library</span></span>`,
    popover: (variant, state) =>
        `<div ${rootAttrs('popover', null, state, 'bg')}>` +
        `<p class="ds-popover-text" data-part="text"><strong>Dimensions</strong></p>` +
        `<p class="ds-popover-text" data-part="text">Set the dimensions for the layer.</p></div>`,
    'list-item': (variant, state) =>
        `<div role="menuitem" ${rootAttrs('list-item', null, state, 'bg')}>` +
        galleryIcon('user', 'ds-list-item-icon', 'icon') +
        `<span class="ds-list-item-text" data-part="text">Profile</span>` +
        `<span class="ds-list-item-meta" data-part="meta">⇧⌘P</span></div>`,
    separator: (variant, state) =>
        `<div class="gallery-group"><hr ${rootAttrs('separator', null, state, 'line')}></div>`
};

function renderGalleryInstance(elementKey, variant, state) {
    const render = GALLERY_RENDERERS[elementKey];
    if (render) return render(variant, state);
    const spec = elementSpec(elementKey);
    return spec && spec.custom ? renderCustomInstance(spec, variant, state) : '';
}

// The Elements page body: one section per element holding ONE instance (the
// first variant, default state). The editor swaps the shown variant/state of
// the selected element's stage in place (scripts.js syncGalleryStages).
// Element sections sit in one unlabelled .gallery-category per
// ELEMENT_CATEGORIES entry (in that order, elements in ELEMENTS order), plus
// a trailing "Other" for strays - the wrapper only exists as a scroll target
// for the parent's category nav; nothing is printed for it.
function buildGalleryHtml() {
    // allElements(), like every other iterator above - but a custom
    // element's own category ('custom', see buildCustomElementSpec) never
    // matches one of these keys, so it silently sits out of every group here
    // and only ever renders via buildCustomGalleryHtml's own #cat-custom
    // section. Custom elements never join the stock "All" order.
    const groups = ELEMENT_CATEGORIES.concat(OTHER_CATEGORY)
        .map(cat => ({ cat, els: allElements().filter(el => el.category === cat.key) }))
        .filter(g => g.els.length);
    return groups.map(({ cat, els }) =>
        `<section class="gallery-category" id="cat-${cat.key}" data-gallery-category="${cat.key}">\n` +
        `<div class="gallery-elements">\n` + els.map(buildGallerySection).join('\n') + '\n</div>\n</section>'
    ).join('\n');
}

// One element section: a stage with the element's first variant in its
// default state - no heading, the specimen speaks for itself. The stage
// records what it shows so the editor can tell when a re-render is needed.
function buildGallerySection(el) {
    const variant = elementVariants(el)[0];
    return `<section class="gallery-section" id="gallery-${el.key}" data-gallery-element="${el.key}">\n` +
        `<div class="gallery-stage" data-gallery-element="${el.key}" data-variant="${variant || ''}" data-state="default">` +
        renderGalleryInstance(el.key, variant, 'default') +
        `</div>\n</section>`;
}

// --- Custom elements ---------------------------------------------------------
//
// A custom element is built from stock PARTS: the six generic kinds below
// (identical shape to the factories above, so their private var names -
// --_bg, --_border-color, --_text-family, … - are exactly what
// preview/components.css's shared .ds-custom rules already read, with no
// per-element CSS needed) plus every part the base carries OUTSIDE those six
// keys, kept verbatim (title, description, box, mark, header, cell, radius,
// gap, ring, size, …). Variants and the seed table are derived from the base
// once, at creation (buildCustomElementSpec); from then on the custom
// element's own tokens are entirely independent of the base's.
//
// Registry: CUSTOM_ELEMENTS (ordered) + allElements() = ELEMENTS.concat(it) -
// every iterator above reads allElements(), while ELEMENTS itself stays the
// untouched stock const (so components.test.js, which never registers a
// custom element, is byte-for-byte unaffected). setCustomElements() is the
// only way the array's CONTENTS change - it also busts _seedCache, since
// seedsFor()'s cache would otherwise keep answering with yesterday's
// registry. scripts.js keeps state.customElements (plain, JSON-safe specs -
// the undo/redo ground truth) and mirrors it in here via setCustomElements;
// applyCustomElementsChange() (scripts.js) is the one place that happens
// together with the matching preview/DOM patch.

const CUSTOM_ELEMENTS = [];

function allElements() {
    return ELEMENTS.concat(CUSTOM_ELEMENTS);
}

function setCustomElements(list) {
    CUSTOM_ELEMENTS.length = 0;
    (list || []).forEach(spec => CUSTOM_ELEMENTS.push(spec));
    Object.keys(_seedCache).forEach(key => delete _seedCache[key]);
}

// Deep-cloned, JSON-safe specs - for a caller (save/export) that must not
// hold a live reference into CUSTOM_ELEMENTS.
function customElementsSnapshot() {
    return CUSTOM_ELEMENTS.map(spec => JSON.parse(JSON.stringify(spec)));
}

// The six kinds offered when creating a custom element - literally the same
// factories the ELEMENTS spec above uses, so a ticked kind's private var
// names always match an existing components.css rule.
const CUSTOM_PART_KINDS = ['bg', 'border', 'text', 'icon', 'padding', 'shadow'];
const CUSTOM_PART_FACTORY = { bg: _bg, border: _border, text: _text, icon: _icon, padding: _paddingXY, shadow: _shadow };

// Fixed fallback seed (a Tailwind ref, remapped like every other seed) for a
// ticked kind the base has no matching part for at all.
const CUSTOM_PART_DEFAULTS = {
    bg: { bg: 'color.background' },
    border: { 'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid' },
    text: { 'text.color': 'color.foreground', 'text.type': 'type.body' },
    icon: { icon: 'color.foreground' },
    padding: { 'padding.x': 'space.4', 'padding.y': 'space.2' },
    shadow: { shadow: 'shadow.xs' }
};

// A custom element's key must never collide with a stock/custom key, a
// semantic role name, or a var-namespace prefix - scripts.js's applyCssImport
// skips any CSS line whose key starts with "<elementKey>-", so e.g. an
// element named "sidebar" or "space" would swallow --sidebar-foreground /
// --space-4 on the next CSS import. (Same 33 roles as dtcg.js's
// DTCG_COLOR_ROLES / scripts.js's LINKABLE_COLOR_KEYS - duplicated here
// because components.js loads before both.)
const RESERVED_ELEMENT_NAMESPACES = ['type', 'space', 'radius', 'border', 'shadow', 'palette', 'font', 'tracking', 'sidebar', 'chart'];
const RESERVED_SEMANTIC_ROLE_NAMES = [
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'accent', 'accent-foreground',
    'background', 'foreground', 'muted', 'muted-foreground', 'destructive', 'destructive-foreground',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'border', 'input', 'ring', 'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring', 'shadow-color'
];

// null on success, else an inline refusal message. `existingKeys` is every
// stock + already-registered custom key (allElements().map(e => e.key)).
function validateCustomElementName(name, existingKeys) {
    const trimmed = String(name === undefined || name === null ? '' : name).trim();
    if (!trimmed) return 'Enter a name.';
    const key = trimmed.toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(key)) {
        return `"${trimmed}" must start with a letter and use only lowercase letters, digits and hyphens.`;
    }
    const stateSuffix = ['hover', 'focus', 'active', 'disabled'].find(s => key.endsWith(`-${s}`));
    if (stateSuffix) return `"${trimmed}" can't end in "-${stateSuffix}" - that reads as a state.`;
    if ((existingKeys || []).includes(key) || RESERVED_ELEMENT_NAMESPACES.includes(key) || RESERVED_SEMANTIC_ROLE_NAMES.includes(key)) {
        return `"${trimmed}" is already taken.`;
    }
    return null;
}

// The slot key ('bg' for a single-prop part, 'border.color' for a multi-prop
// one) exactly as SEED_SPEC / seedComponentTokens key their defaults.
function _customSlotKey(part, prop) {
    return part.props.length === 1 ? part.key : `${part.key}.${prop.key}`;
}

// Where a (part, prop) slot of the CUSTOM shape reads its base value from -
// the base's OWN slot key when it has a same-key part with that prop; a
// single-prop base "padding" (card, alert, tabs-list, popover) seeds BOTH of
// the custom's offered padding.x/padding.y from that one slot (the base's own
// single padding part is then never kept as a separate extra part, since
// 'padding' is one of the six offered keys either way); null when the base
// has nothing to inherit (the ticked kind then falls to CUSTOM_PART_DEFAULTS).
function _customBaseSlotKey(baseSpec, part, prop) {
    const baseSamePart = baseSpec.parts.find(p => p.key === part.key);
    if (baseSamePart && baseSamePart.props.some(p => p.key === prop.key)) return _customSlotKey(baseSamePart, prop);
    if (part.key === 'padding') {
        const basePadding = baseSpec.parts.find(p => p.key === 'padding');
        if (basePadding) return basePadding.key;
    }
    return null;
}

// Builds the seed table (SEED_SPEC[base]'s own shape: { base, variants,
// states }) a custom element's own seedComponentTokens pass reads - see
// seedComponentTokens's `SEED_SPEC[el.key] || el.seedSpec`. Copies the base's
// seed verbatim wherever a slot matches (so a later edit to the base's OWN
// SEED_SPEC entry is picked up automatically); a ticked kind absent from the
// base falls to CUSTOM_PART_DEFAULTS so every slot always resolves.
function _buildCustomSeedSpec(baseSpec, parts) {
    const baseSeed = SEED_SPEC[baseSpec.key] || {};
    const seedSpec = { base: {}, variants: {}, states: {} };
    parts.forEach(part => {
        part.props.forEach(prop => {
            const key = _customSlotKey(part, prop);
            const srcKey = _customBaseSlotKey(baseSpec, part, prop);
            let found = false;
            if (srcKey) {
                if (baseSeed.base && baseSeed.base[srcKey] !== undefined) {
                    seedSpec.base[key] = baseSeed.base[srcKey];
                    found = true;
                }
                Object.keys(baseSeed.variants || {}).forEach(v => {
                    if (baseSeed.variants[v][srcKey] === undefined) return;
                    seedSpec.variants[v] = seedSpec.variants[v] || {};
                    seedSpec.variants[v][key] = baseSeed.variants[v][srcKey];
                    found = true;
                });
                Object.keys(baseSeed.states || {}).forEach(stateKey => {
                    if (baseSeed.states[stateKey][srcKey] === undefined) return;
                    seedSpec.states[stateKey] = seedSpec.states[stateKey] || {};
                    seedSpec.states[stateKey][key] = baseSeed.states[stateKey][srcKey];
                });
            }
            if (!found) {
                const fallback = (CUSTOM_PART_DEFAULTS[part.key] || {})[key];
                if (fallback !== undefined) seedSpec.base[key] = fallback;
            }
        });
    });
    return seedSpec;
}

// `parts`: which of CUSTOM_PART_KINDS are ticked. Every other base part
// (title, description, box, mark, header, cell, radius, gap, ring, size, …)
// is kept as-is. Variants/states are always an explicit array (never null,
// even for a variant-less base) so tokenId always includes a variant segment
// - a card-based custom element's ids are chip.default.bg, never chip.bg -
// and always carries all five states regardless of what the base has.
// Returns null when `base` isn't a real (stock) element.
function buildCustomElementSpec({ key, label, base, parts }) {
    const baseSpec = elementSpec(base);
    if (!baseSpec) return null;
    const ticked = CUSTOM_PART_KINDS.filter(k => (parts || []).includes(k));
    const offeredParts = ticked.map(k => CUSTOM_PART_FACTORY[k]());
    const keptParts = baseSpec.parts.filter(p => !CUSTOM_PART_KINDS.includes(p.key));
    const allParts = offeredParts.concat(keptParts);
    const variants = baseSpec.variants ? [...baseSpec.variants] : ['default'];
    return {
        key, label, category: 'custom', custom: true, base: baseSpec.key,
        variants, states: [...COMPONENT_STATES],
        parts: allParts,
        seedSpec: _buildCustomSeedSpec(baseSpec, allParts)
    };
}

// The base's actual PART + PROP object a (part, prop) slot of the CUSTOM
// shape carries a live value from - same matching _customBaseSlotKey uses
// (the base's own same-key part/prop, or - for the offered padding.x/
// padding.y - the base's single-prop padding part), but returning the
// base's real part/prop objects (what tokenId needs) rather than a
// SEED_SPEC-style slot key. null when the base has nothing at that slot.
function _customBaseTokenSlot(baseSpec, part, prop) {
    const baseSamePart = baseSpec.parts.find(p => p.key === part.key);
    if (baseSamePart) {
        const baseProp = baseSamePart.props.find(p => p.key === prop.key);
        if (baseProp) return { part: baseSamePart, prop: baseProp };
    }
    if (part.key === 'padding') {
        const basePadding = baseSpec.parts.find(p => p.key === 'padding');
        if (basePadding && basePadding.props.length === 1) return { part: basePadding, prop: basePadding.props[0] };
    }
    return null;
}

// buildCustomElementSpec's own seedSpec (_buildCustomSeedSpec) only ever
// copies the base's DETERMINISTIC seed (SEED_SPEC[base] + the fixed
// per-part defaults) - reproducible under undo/redo/reseed, which is what
// tests/custom-elements.test.js's "equals the base's SEEDED hover ref"
// checks. That covers only half of "its part tokens start from the base's
// values": when the user already edited the base away from its seed (an
// explicit entry in `components`, the live override map), the new element
// should visually match the base as it stands right now too. This walks
// every (part, prop) slot of the new spec across every variant x state it
// carries, finds the base's matching slot (_customBaseTokenSlot - so a kept
// part or an offered kind both work), and copies any EXPLICIT base override
// found onto the new element's matching id. Returns a flat
// { [customId]: ref } object to merge into `components` - never mutates it.
function customElementLiveOverrides(components, baseSpec, spec) {
    const overrides = {};
    if (!components) return overrides;
    const baseVariants = baseSpec.variants && baseSpec.variants.length ? baseSpec.variants : [null];
    spec.parts.forEach(part => {
        part.props.forEach(prop => {
            const slot = _customBaseTokenSlot(baseSpec, part, prop);
            if (!slot) return;
            baseVariants.forEach((baseVariant, i) => {
                const specVariant = spec.variants[i];
                if (specVariant === undefined) return;
                spec.states.forEach(stateKey => {
                    const baseId = tokenId(baseSpec, baseVariant, slot.part.key, slot.prop.key, stateKey);
                    if (components[baseId] === undefined || components[baseId] === null) return;
                    overrides[tokenId(spec, specVariant, part.key, prop.key, stateKey)] = components[baseId];
                });
            });
        });
    });
    return overrides;
}

// --- Custom elements: generic specimen ---------------------------------------
//
// Root paints bg/border/padding/shadow (whichever are ticked) through the
// SAME shared private vars the six factories always use, via the .ds-custom
// rule in preview/components.css - no per-element CSS needed there. A kept
// extra part (radius, gap, ring, title, box, header, …) has no such fixed
// rule to lean on - its private var names carry ITS OWN key, and there is no
// telling ahead of time which keys a future stock element might contribute -
// so it paints itself through an inline style built from the very same
// privateVarNames() the wiring sheet used to define it: always a var()
// reference into that part's own private(s), never a literal color/length.

const CUSTOM_PART_PROP_CSS = { color: 'background', radius: 'border-radius', space: 'inline-size', borderWidth: 'border-width', borderStyle: 'border-style', shadow: 'box-shadow' };
const CUSTOM_TYPE_FIELD_CSS = { '-family': 'font-family', '-weight': 'font-weight', '-size': 'font-size', '-leading': 'line-height', '-tracking': 'letter-spacing' };

function _customPartHasType(part) {
    return part.props.some(p => p.kind === 'type');
}

// A kept part WITH a type prop reads as inline text (title/description/
// header/label/…): the type prop's five fields, plus any color-kind prop as
// the text's own color (last one wins if a part has two, e.g. table's
// header - matching its real header/foreground pairing).
function _customTextStyle(part) {
    const decls = [];
    part.props.forEach(prop => {
        if (prop.kind === 'type') {
            privateVarNames(part, prop).forEach(({ name, suffix }) => {
                const cssProp = CUSTOM_TYPE_FIELD_CSS[suffix];
                if (cssProp) decls.push(`${cssProp}: var(${name})`);
            });
        } else if (prop.kind === 'color') {
            decls.push(`color: var(${privateVarNames(part, prop)[0].name})`);
        }
    });
    return decls.join('; ');
}

// A kept part with no type prop reads as a small swatch box: every prop
// paints the box property its KIND maps to (CUSTOM_PART_PROP_CSS); a
// borderWidth prop also gets a fixed (non-token) solid/currentColor pairing
// so the width is actually visible.
function _customBoxStyle(part) {
    const decls = ['display: inline-block', 'inline-size: 1.5em', 'block-size: 1.5em', 'vertical-align: middle'];
    part.props.forEach(prop => {
        const cssProp = CUSTOM_PART_PROP_CSS[prop.kind];
        if (!cssProp) return;
        decls.push(`${cssProp}: var(${privateVarNames(part, prop)[0].name})`);
        if (prop.kind === 'borderWidth') decls.push('border-style: solid', 'border-color: currentColor');
    });
    return decls.join('; ');
}

function _customPartChildHtml(part) {
    if (_customPartHasType(part)) return `<span data-part="${part.key}" style="${_customTextStyle(part)}">${part.label}</span>`;
    return `<span data-part="${part.key}" style="${_customBoxStyle(part)}"></span>`;
}

function renderCustomInstance(spec, variant, state) {
    const has = (k) => spec.parts.some(p => p.key === k);
    const rootPart = has('bg') ? 'bg' : spec.parts[0].key;
    let inner = '';
    if (has('icon')) inner += galleryIcon('plus', 'ds-custom-icon', 'icon');
    if (has('text')) inner += `<span class="ds-custom-text" data-part="text">${spec.label}</span>`;
    spec.parts.filter(p => !CUSTOM_PART_KINDS.includes(p.key)).forEach(part => { inner += _customPartChildHtml(part); });
    return `<span ${rootAttrs(spec.key, variant, state, rootPart, { cls: 'ds-custom' })}>${inner}</span>`;
}

// The Custom section: the "New custom element" control (a plain ds:action
// trigger - preview/frame.js posts it to the parent, which owns the actual
// creation form) plus one stage per registered custom element. Mirrors
// buildGalleryHtml/buildGallerySection's shape (a #cat-custom category with
// one #gallery-<key> section each) so scrollGalleryTo/syncGalleryStages work
// on it with no changes.
function buildCustomGalleryHtml() {
    const specimens = CUSTOM_ELEMENTS.map(spec => {
        const variant = elementVariants(spec)[0];
        return `<section class="gallery-section" id="gallery-${spec.key}" data-gallery-element="${spec.key}">\n` +
            `<div class="gallery-stage" data-gallery-element="${spec.key}" data-variant="${variant || ''}" data-state="default">` +
            renderCustomInstance(spec, variant, 'default') +
            `</div>\n</section>`;
    }).join('\n');
    return `<section class="gallery-category" id="cat-custom" data-gallery-category="custom">\n` +
        `<div class="gallery-elements">\n` +
        `<button type="button" class="gallery-new-custom" data-action="new-custom-element">New custom element</button>\n` +
        specimens + '\n</div>\n</section>';
}

// --- Custom elements: add/remove parts ---------------------------------------
//
// The only way an already-registered custom element's PART LIST changes after
// creation (rename/delete of the element itself is a later card's). Both are
// pure - spec/components in, { spec, components } | { error } out; nothing
// here touches CUSTOM_ELEMENTS or reads global editor state. scripts.js's one
// entry point (onPanelClick's [data-part-remove]/[data-part-add] branches)
// pushes one undo step, swaps the returned spec into state.customElements and
// the returned map into state.components, then applyCustomElementsChange() +
// renderAll() so the wiring sheet, #theme-vars and the Custom section all
// reflect the new shape together - the same two calls createCustomElement()
// already ends with.

// The six offered kinds NOT already on `spec` - what the sidebar header's add
// control offers (panels.js buildCustomElementHeaderHtml). A kept extra part
// (radius, gap, ring, title, …) never appears here - it isn't one of the six
// and, once removed, has no way back in (per the board's own resolution: kept
// parts are removable but the add control only ever offers the six kinds).
function customElementMissingKinds(spec) {
    return CUSTOM_PART_KINDS.filter(k => !spec.parts.some(p => p.key === k));
}

// Every token id ONE part of `spec` contributes, across every variant x prop
// x state the spec currently carries - exactly the set removeCustomPart
// deletes from `components`. [] for a part the spec doesn't have.
function customPartIds(spec, partKey) {
    const part = spec.parts.find(p => p.key === partKey);
    if (!part) return [];
    const ids = [];
    elementVariants(spec).forEach(variant => {
        part.props.forEach(prop => {
            spec.states.forEach(state => ids.push(tokenId(spec, variant, part.key, prop.key, state)));
        });
    });
    return ids;
}

// Drops every seedSpec entry keyed to `partKey` (a bare key for a single-prop
// part, "partKey.<prop>" for a multi-prop one) from one seedSpec section
// (base, or one variant/state's own object) - used by both add and remove so
// a stale default never lingers for a later re-add of an unrelated kind that
// happens to share a slot-key prefix.
function _dropSeedSlot(section, partKey) {
    const out = {};
    Object.keys(section || {}).forEach(key => {
        if (key !== partKey && !key.startsWith(`${partKey}.`)) out[key] = section[key];
    });
    return out;
}

// null | { error } | { spec, components }. Refuses an absent part key and the
// element's last remaining part ("an element needs at least one part").
function removeCustomPart(spec, components, partKey) {
    const part = spec.parts.find(p => p.key === partKey);
    if (!part) return { error: `"${partKey}" is not a part of ${spec.label}.` };
    if (spec.parts.length <= 1) return { error: 'An element needs at least one part.' };
    const dropIds = new Set(customPartIds(spec, partKey));
    const nextComponents = {};
    Object.keys(components || {}).forEach(id => { if (!dropIds.has(id)) nextComponents[id] = components[id]; });
    const seed = spec.seedSpec || { base: {}, variants: {}, states: {} };
    const nextSeed = { base: _dropSeedSlot(seed.base, partKey), variants: {}, states: {} };
    Object.keys(seed.variants || {}).forEach(v => { nextSeed.variants[v] = _dropSeedSlot(seed.variants[v], partKey); });
    Object.keys(seed.states || {}).forEach(s => { nextSeed.states[s] = _dropSeedSlot(seed.states[s], partKey); });
    return {
        spec: { ...spec, parts: spec.parts.filter(p => p.key !== partKey), seedSpec: nextSeed },
        components: nextComponents
    };
}

// Seeds ONE new part's ids exactly the way seedComponentTokens seeds a whole
// element (base defaults + per-variant override + per-state deltas), but
// scoped to this one part and built from a throwaway seedSpec FRAGMENT
// (_buildCustomSeedSpec run over just [part]) rather than the registry, so it
// works whether or not `spec` is registered yet. Returns the fragment too, so
// the caller can fold it into the spec's own seedSpec for next time.
function _seedAddedPart(baseSpec, spec, part, sourceKey, ctx) {
    const fragment = _buildCustomSeedSpec(baseSpec, [part]);
    const source = sourceKey || 'tailwind';
    const ids = {};
    elementVariants(spec).forEach(variant => {
        const defaults = Object.assign({}, fragment.base || {}, (fragment.variants && variant && fragment.variants[variant]) || {});
        part.props.forEach(prop => {
            const key = _customSlotKey(part, prop);
            if (defaults[key] === undefined) return;
            ids[tokenId(spec, variant, part.key, prop.key)] = seedRef(defaults[key], source, ctx);
        });
        spec.states.forEach(state => {
            if (state === 'default' || !fragment.states) return;
            const overrides = Object.assign({}, fragment.states[`*.${state}`] || {}, (variant && fragment.states[`${variant}.${state}`]) || {});
            part.props.forEach(prop => {
                const key = _customSlotKey(part, prop);
                if (overrides[key] === undefined) return;
                ids[tokenId(spec, variant, part.key, prop.key, state)] = seedRef(overrides[key], source, ctx);
            });
        });
    });
    return { ids, fragment };
}

// null | { error } | { spec, components }. Refuses a kind outside the six and
// one already on the spec (the header's own add control only ever offers a
// missing kind, but this stays defensive too - see validateCustomElementName
// for the same "belt and suspenders" style). The new part always lands LAST
// in spec.parts. Writes EXPLICIT default-state ids (and seeded state deltas)
// into the returned `components`, never only a seedSpec update a caller must
// remember to reseed from - the export (dtcg.js) walks `components` itself,
// not the spec, so an id reachable only through resolveComponentRef's seed
// fallback would never appear there.
function addCustomPart(spec, components, kind, sourceKey, ctx) {
    if (!CUSTOM_PART_KINDS.includes(kind)) return { error: `"${kind}" is not a part kind.` };
    if (spec.parts.some(p => p.key === kind)) return { error: `${spec.label} already has a ${CUSTOM_PART_FACTORY[kind]().label} part.` };
    const baseSpec = elementSpec(spec.base) || spec;
    const part = CUSTOM_PART_FACTORY[kind]();
    const nextSpec = { ...spec, parts: [...spec.parts, part] };
    const { ids, fragment } = _seedAddedPart(baseSpec, nextSpec, part, sourceKey, ctx);
    const seed = spec.seedSpec || { base: {}, variants: {}, states: {} };
    const nextSeed = { base: { ...seed.base, ...fragment.base }, variants: { ...seed.variants }, states: { ...seed.states } };
    Object.keys(fragment.variants || {}).forEach(v => { nextSeed.variants[v] = { ...nextSeed.variants[v], ...fragment.variants[v] }; });
    Object.keys(fragment.states || {}).forEach(s => { nextSeed.states[s] = { ...nextSeed.states[s], ...fragment.states[s] }; });
    nextSpec.seedSpec = nextSeed;
    return { spec: nextSpec, components: { ...components, ...ids } };
}

// --- Custom elements: add/remove variants ------------------------------------
//
// The only way an already-registered custom element's VARIANT LIST changes
// after creation (rename/delete of the element itself is a later card's).
// Both are pure - spec/components in, { spec, components } | { error } out,
// same contract as removeCustomPart/addCustomPart above - scripts.js's entry
// points push one undo step, swap the returned spec into state.customElements
// and the returned map into state.components, then applyCustomElementsChange()
// + renderAll() so the wiring sheet, #theme-vars and the Custom section all
// reflect the new shape together.

// null | error string. Reuses the identifier rule validateCustomElementName
// uses for element names, but never case-folds: a variant has no separate
// key/label pair the way an element does (it - lowercase, as typed - IS the
// token-id segment), so "Warning" is refused rather than silently becoming
// "warning" behind the user's back. Also refuses a bare state name or a
// -hover/-focus/-active/-disabled suffix (that reads as a state, not a
// variant) and a name already on the spec.
function variantNameError(spec, name) {
    const trimmed = String(name === undefined || name === null ? '' : name).trim();
    if (!trimmed) return 'Enter a name.';
    if (!/^[a-z][a-z0-9-]*$/.test(trimmed)) {
        return `"${trimmed}" must start with a letter and use only lowercase letters, digits and hyphens.`;
    }
    const stateSuffix = COMPONENT_STATES.slice(1).find(s => trimmed === s || trimmed.endsWith(`-${s}`));
    if (stateSuffix) return `"${trimmed}" reads as a state, not a variant.`;
    if (spec.variants.includes(trimmed)) return `"${trimmed}" is already a variant.`;
    return null;
}

// { [id]: ref } - `to`'s tokens copied from `from`'s CURRENT (resolved)
// values, so an id `from` has never been explicitly edited (still answering
// through the seed) still copies a real value, never null. Every part x prop
// gets an EXPLICIT default-state entry (`to` has no seedSpec/SEED_SPEC row of
// its own - leaving it to seed resolution would resolve to null, i.e.
// var(null) in the exported CSS); a non-default state gets one only when its
// resolved value actually differs from the copied default - reproducing
// `from`'s own leaf shape exactly (component.button.primary's own shape is
// the default leaves plus border.color-focus and bg/text.color/icon/border.
// color-disabled ONLY, since button's SEED_SPEC has no hover/active delta for
// its primary variant - copying that shape onto a new variant, rather than a
// fixed five-state set, is what makes it identical to the variant it came
// from).
function copyVariantTokens(components, spec, from, to, sourceKey) {
    const source = activeSourceKey(sourceKey);
    const out = { ...components };
    spec.parts.forEach(part => {
        part.props.forEach(prop => {
            const defaultValue = resolveComponentRef(tokenId(spec, from, part.key, prop.key), components, source);
            out[tokenId(spec, to, part.key, prop.key)] = defaultValue;
            spec.states.forEach(state => {
                if (state === 'default') return;
                const stateValue = resolveComponentRef(tokenId(spec, from, part.key, prop.key, state), components, source);
                if (stateValue !== defaultValue) out[tokenId(spec, to, part.key, prop.key, state)] = stateValue;
            });
        });
    });
    return out;
}

// Drops every id of `variant` (of the custom element `key`) from
// `components` - copyVariantTokens's exact inverse. A custom element's ids
// always carry an explicit variant segment (buildCustomElementSpec keeps
// `variants` an explicit array even for a variant-less base - ['default'],
// never omitted), so comparing the first two "."-segments is exact: never a
// startsWith/prefix match that could also catch an unrelated element whose
// key happens to start with this one.
function dropVariantTokens(components, key, variant) {
    const out = {};
    Object.keys(components || {}).forEach(id => {
        const seg = id.split('.');
        if (seg[0] === key && seg[1] === variant) return;
        out[id] = components[id];
    });
    return out;
}

// null | { error } | { spec, components }. `from` is the variant to copy -
// scripts.js passes the one currently shown on the stage. Refuses anything
// variantNameError flags; on success the new variant lands LAST in
// spec.variants (mirrors addCustomPart appending the new part last).
function addVariantToSpec(spec, components, name, from, sourceKey) {
    const err = variantNameError(spec, name);
    if (err) return { error: err };
    const trimmed = String(name).trim();
    return {
        spec: { ...spec, variants: [...spec.variants, trimmed] },
        components: copyVariantTokens(components, spec, from, trimmed, sourceKey)
    };
}

// null | { error } | { spec, components }. Refuses an absent variant name and
// the element's last remaining one ("An element needs at least one
// variant." - mirrors removeCustomPart's "needs at least one part" wording).
// Moving the stage off a removed variant onto the first remaining one is
// reconcileSelection's job (scripts.js), not this pure function's.
function removeVariantFromSpec(spec, components, variant) {
    if (!spec.variants.includes(variant)) return { error: `"${variant}" is not a variant of ${spec.label}.` };
    if (spec.variants.length <= 1) return { error: 'An element needs at least one variant.' };
    return {
        spec: { ...spec, variants: spec.variants.filter(v => v !== variant) },
        components: dropVariantTokens(components, spec.key, variant)
    };
}

// --- Custom elements: rename/delete -------------------------------------------
//
// The only way an already-registered custom element's KEY/LABEL or its very
// EXISTENCE changes (its part/variant lists are 20/21's) - same contract as
// every other custom-element mutator above: pure, in the current
// spec+components, out the next spec+components (or an error). Unlike the
// part/variant pairs, both take the FULL list (`specs` = state.customElements)
// rather than one spec - a rename/delete changes which key IDENTIFIES an
// entry (or removes the entry outright), so the list itself is what's
// edited, not just one member of it. scripts.js's entry points push one undo
// step, swap the result into state.customElements/state.components, then
// applyCustomElementsChange() + renderAll(), same as every add/remove pair.

// null | { error } | { specs, components, key }. `rawName` goes through the
// exact rule createCustomElement uses (validateCustomElementName), except
// the element's OWN current key is excluded from the collision set - so
// "Chip" -> "chip" (same key, only the label's case changes) or simply
// re-confirming the unchanged name is a label-only edit, never a
// self-collision refusal. A successful rename rewrites every id belonging to
// this element (`<oldKey>.<rest>` -> `<newKey>.<rest>`) in `components` -
// ids never carry a literal '.' inside a key segment (the validator
// enforces that), so id.startsWith(`${oldKey}.`) is exact and can never also
// catch an unrelated element whose key happens to start with oldKey.
function renameCustomElement(specs, components, oldKey, rawName) {
    const spec = (specs || []).find(s => s.key === oldKey);
    if (!spec) return { error: `"${oldKey}" is not a custom element.` };
    // Stock keys (ELEMENTS, a fixed const) + every OTHER registered custom
    // key - same union createCustomElement passes via allElements(), built
    // here from the caller's own `specs` (rather than reading the live
    // CUSTOM_ELEMENTS registry) so this stays a pure function of its inputs.
    const existingKeys = ELEMENTS.map(e => e.key).concat((specs || []).map(s => s.key).filter(k => k !== oldKey));
    const err = validateCustomElementName(rawName, existingKeys);
    if (err) return { error: err };
    const label = String(rawName).trim();
    const key = label.toLowerCase();
    const prefix = `${oldKey}.`;
    const nextComponents = {};
    Object.keys(components || {}).forEach(id => {
        nextComponents[id.startsWith(prefix) ? `${key}${id.slice(oldKey.length)}` : id] = components[id];
    });
    return {
        specs: specs.map(s => (s.key === oldKey ? { ...s, key, label } : s)),
        components: nextComponents,
        key
    };
}

// null | { specs, components }. Drops the spec and every id belonging to it -
// dropVariantTokens's own exact-prefix match, generalised from one variant to
// the whole element. An unknown key is a permissive no-op (equal-valued
// specs/components), mirroring removeCustomPart/removeVariantFromSpec's own
// defensive style, though scripts.js's entry point never calls this for a
// key that isn't the current selection.
function deleteCustomElement(specs, components, key) {
    const prefix = `${key}.`;
    const nextComponents = {};
    Object.keys(components || {}).forEach(id => { if (!id.startsWith(prefix)) nextComponents[id] = components[id]; });
    return {
        specs: (specs || []).filter(s => s.key !== key),
        components: nextComponents
    };
}
