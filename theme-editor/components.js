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
    { key: 'forms',      label: 'Forms',      elements: ['input', 'select', 'textarea', 'checkbox', 'radio', 'switch', 'combobox'] },
    { key: 'feedback',   label: 'Feedback',   elements: ['alert', 'badge', 'tooltip', 'toast', 'progress', 'skeleton'] },
    { key: 'surfaces',   label: 'Surfaces',   elements: ['card', 'popover', 'separator', 'dialog'] },
    { key: 'navigation', label: 'Navigation', elements: ['tabs-list', 'tab', 'list-item', 'dropdown-menu'] },
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
        [_colorPart('line', 'Line'), _part('width', 'Width', [['width', 'borderWidth']])]),
    _el('dialog', 'Dialog', null, ['default'],
        [_colorPart('overlay', 'Overlay'), _bg(), _border(), _radius(), _padding(), _gap(), _shadow(),
         _textPart('title', 'Title'), _textPart('description', 'Description'), _colorPart('close', 'Close icon')]),
    _el('dropdown-menu', 'Dropdown menu', null, ['default'],
        [_bg(), _text(), _border(), _radius(), _padding(), _gap(), _shadow()]),
    _el('combobox', 'Combobox', null, FORM_STATES,
        [_bg(), _text(), _colorPart('placeholder', 'Placeholder'), _icon(), _border(), _radius(), _paddingXY(), _shadow(), _ring()]),
    _el('toast', 'Toast', ['default', 'destructive'], ['default'],
        [_bg(), _border(), _radius(), _padding(), _gap(), _shadow(), _icon(), _textPart('title', 'Title'), _textPart('description', 'Description'), _colorPart('close', 'Close icon')]),
    _el('progress', 'Progress', null, ['default'],
        [_colorPart('track', 'Track'), _colorPart('indicator', 'Indicator'), _radius(), _spacePart('height', 'Height')]),
    _el('skeleton', 'Skeleton', null, ['default'],
        [_bg(), _radius()])
];

// --- Seeds (shadcn/ui defaults, Tailwind refs) -------------------------------
//
// Per element: `base` applies to every variant, `variants` overrides per
// variant, `states` keys are "<variant|*>.<state>". Keys are "<part>" or
// "<part>.<prop>" exactly as in the token id.

const DISABLED_BOX = { bg: 'color.muted', 'text.color': 'color.muted-foreground', icon: 'color.muted-foreground', 'border.color': 'color.muted', placeholder: 'color.muted-foreground' };
const DISABLED_CHECK = { box: 'color.muted', 'border.color': 'color.muted', mark: 'color.muted-foreground', 'label.color': 'color.muted-foreground' };
const ACCENT_HOVER = { bg: 'color.accent', 'text.color': 'color.accent-foreground', icon: 'color.accent-foreground' };

// Shared by every field-trigger element that opens a menu/list of options
// (Select, Combobox): identical base + focus/disabled deltas.
const FIELD_TRIGGER_SEED = {
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
};

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
    select: FIELD_TRIGGER_SEED,
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
    },
    dialog: {
        base: {
            overlay: 'palette.black', bg: 'color.background',
            'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, padding: 'space.6', gap: 'space.4', shadow: 'shadow.lg',
            'title.color': 'color.foreground', 'title.type': 'type.subheading',
            'description.color': 'color.muted-foreground', 'description.type': 'type.caption',
            close: 'color.muted-foreground'
        }
    },
    'dropdown-menu': {
        base: {
            bg: 'color.popover', 'text.color': 'color.popover-foreground', 'text.type': 'type.label',
            'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, padding: 'space.1', gap: 'space.1', shadow: 'shadow.md'
        }
    },
    combobox: FIELD_TRIGGER_SEED,
    toast: {
        base: {
            bg: 'color.popover', 'border.color': 'color.border', 'border.width': 'border.width.1', 'border.style': 'border.style.solid',
            radius: THEME_RADIUS_SEED, padding: 'space.4', gap: 'space.3', shadow: 'shadow.lg', icon: 'color.foreground',
            'title.color': 'color.popover-foreground', 'title.type': 'type.label',
            'description.color': 'color.muted-foreground', 'description.type': 'type.caption',
            close: 'color.muted-foreground'
        },
        variants: {
            default: {},
            destructive: { 'border.color': 'color.destructive', icon: 'color.destructive', 'title.color': 'color.destructive', close: 'color.destructive' }
        }
    },
    progress: {
        base: { track: 'color.secondary', indicator: 'color.primary', radius: 'radius.full', height: 'space.2' }
    },
    skeleton: {
        base: { bg: 'color.muted', radius: 'radius.md' }
    }
};

// --- Spec lookups ------------------------------------------------------------

function elementSpec(element) {
    return typeof element === 'string' ? ELEMENTS.find(e => e.key === element) || null : element;
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

// Iterates every (element, variant, part, prop) of the spec in order.
function forEachTokenSlot(fn) {
    ELEMENTS.forEach(el => {
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
    ELEMENTS.forEach(el => {
        const spec = SEED_SPEC[el.key] || {};
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
    ELEMENTS.forEach(el => {
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
    ELEMENTS.forEach(el => {
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
    user: '<circle cx="8" cy="5.5" r="2.75"/><path d="M2.75 14a5.25 5.25 0 0 1 10.5 0"/>',
    x: '<path d="M4 4l8 8M12 4l-8 8"/>',
    chevrons: '<path d="M4 6l4-3 4 3M4 10l4 3 4-3"/>'
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

function renderListItem(state, icon, label, meta) {
    return `<div role="menuitem" ${rootAttrs('list-item', null, state, 'bg')}>` +
        galleryIcon(icon, 'ds-list-item-icon', 'icon') +
        `<span class="ds-list-item-text" data-part="text">${label}</span>` +
        `<span class="ds-list-item-meta" data-part="meta">${meta}</span></div>`;
}

function renderDropdownMenu(state, itemsHtml) {
    return `<div role="menu" ${rootAttrs('dropdown-menu', null, state, 'bg')}>` +
        `<div class="ds-dropdown-menu-text" data-part="text">My Account</div>` +
        itemsHtml +
        '</div>';
}

// The root IS the track (its own background/radius/height paint the
// unfilled bar); the indicator is a child whose fill amount is a
// CSS-internal state token (--_value), not a design token - it varies per
// instance/at runtime, never per variant or theme.
function renderProgress(state, value) {
    return `<div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" ${rootAttrs('progress', null, state, 'track', { attrs: `style="--_value: ${value}%"` })}>` +
        `<span class="ds-progress-indicator" data-part="indicator"></span></div>`;
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
    'list-item': (variant, state) => renderListItem(state, 'user', 'Profile', '⇧⌘P'),
    separator: (variant, state) =>
        `<div class="gallery-group"><hr ${rootAttrs('separator', null, state, 'line')}></div>`,
    dialog: (variant, state) =>
        `<div ${rootAttrs('dialog', null, state, 'overlay')}>` +
        `<div class="ds-dialog-panel" role="dialog" aria-modal="true" data-part="bg">` +
        galleryIcon('x', 'ds-dialog-close', 'close') +
        `<h3 class="ds-dialog-title" data-part="title">Delete project?</h3>` +
        `<p class="ds-dialog-description" data-part="description">This action cannot be undone. This will permanently delete the project and remove your data from our servers.</p>` +
        `<div class="ds-dialog-actions">${renderButton('outline', 'default', 'Cancel')}${renderButton('primary', 'default', 'Continue')}</div>` +
        '</div></div>',
    'dropdown-menu': (variant, state) =>
        renderDropdownMenu(state,
            renderListItem('default', 'user', 'Profile', '⇧⌘P') +
            renderListItem('default', 'plus', 'Billing', '⌘B') +
            renderListItem('default', 'check', 'Settings', '⌘S')),
    combobox: (variant, state) =>
        `<div class="gallery-stack">` +
        `<span role="combobox" aria-expanded="true" ${rootAttrs('combobox', null, state, 'bg')}>` +
        `<span class="ds-combobox-placeholder" data-part="placeholder">Select framework…</span>` +
        galleryIcon('chevrons', 'ds-combobox-icon', 'icon') +
        '</span>' +
        renderGalleryInstance('dropdown-menu', null, 'default') +
        '</div>',
    toast: (variant, state) =>
        `<div role="status" ${rootAttrs('toast', variant, state, 'bg')}>` +
        galleryIcon(variant === 'destructive' ? 'alert' : 'check', 'ds-toast-icon', 'icon') +
        `<p class="ds-toast-title" data-part="title">${variant === 'destructive' ? 'Something went wrong' : 'Saved'}</p>` +
        `<p class="ds-toast-description" data-part="description">${variant === 'destructive' ? 'There was a problem with your request.' : 'Your changes have been saved.'}</p>` +
        galleryIcon('x', 'ds-toast-close', 'close') +
        '</div>',
    progress: (variant, state) =>
        `<div class="gallery-stack">` + [25, 50, 75].map(v => renderProgress(state, v)).join('') + '</div>',
    // Single root (the "bg" part) holding three blocks that all paint from
    // the same --_bg/--_radius privates: a structurally-round (hardcoded 50%,
    // not the radius token) avatar-sized block, and two lines whose corners
    // DO follow --_radius. Every block carries its own data-part="bg" so
    // hover/click outlines the block under the pointer, not the whole group.
    skeleton: (variant, state) =>
        `<div ${rootAttrs('skeleton', null, state, 'bg')}>` +
        `<span class="ds-skeleton-block ds-skeleton-avatar" data-part="bg"></span>` +
        `<span class="ds-skeleton-block ds-skeleton-line" data-part="bg"></span>` +
        `<span class="ds-skeleton-block ds-skeleton-line ds-skeleton-line-short" data-part="bg"></span></div>`
};

function renderGalleryInstance(elementKey, variant, state) {
    const render = GALLERY_RENDERERS[elementKey];
    return render ? render(variant, state) : '';
}

// The Elements page body: one section per element holding ONE instance (the
// first variant, default state). The editor swaps the shown variant/state of
// the selected element's stage in place (scripts.js syncGalleryStages).
// Element sections sit in one unlabelled .gallery-category per
// ELEMENT_CATEGORIES entry (in that order, elements in ELEMENTS order), plus
// a trailing "Other" for strays - the wrapper only exists as a scroll target
// for the parent's category nav; nothing is printed for it.
function buildGalleryHtml() {
    const groups = ELEMENT_CATEGORIES.concat(OTHER_CATEGORY)
        .map(cat => ({ cat, els: ELEMENTS.filter(el => el.category === cat.key) }))
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
