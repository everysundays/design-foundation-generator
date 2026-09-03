# Theme Editor v2 — implementation contract

Companion to `REQUIREMENTS-v2.md`. This file is the shared contract between the
modules; every module is written against it, so change it here first.

## Files and load order (`index.html`)

```
tweakcn-themes-full.js   import source for starting palettes only
tailwind-palette.js      TAILWIND_PALETTE_* (unchanged)
atlassian-palette.js     ATLASSIAN_PALETTE_* (unchanged)
foundation.js            FOUNDATION scales + ref helpers        (done)
components.js            ELEMENTS spec, seeding, wiring CSS, gallery HTML
pages.js                 Foundation + Typography page HTML builders
dtcg.js                  tokens.json export / import
scripts.js               editor: state, undo, sidebar, inspector, preview doc, save/load
preview/reset.css        iframe: Josh Comeau reset            (@layer reset)
preview/components.css   iframe: element CSS, token vars only (@layer components)
preview/pages.css        iframe: chrome for the 3 pages       (@layer pages)
preview/frame.js         iframe: hover outline, click-to-select, postMessage
templates/               parked v1 templates, not loaded
```

Plain `<script>` globals, no modules (matches v1). Served at
`http://localhost:4520/theme-editor/`.

## Refs

A ref is a dotted string naming exactly one entry of one layer:

| ref                     | layer      | CSS var (refToVar)          |
|-------------------------|------------|-----------------------------|
| `palette.neutral-200`   | foundation | `--palette-neutral-200`     |
| `palette.white` / `palette.black` / `palette.transparent` | foundation specials | `--palette-white` … |
| `color.primary`         | semantic   | `--primary`                 |
| `space.4`               | foundation | `--space-4`                 |
| `radius.lg`             | foundation | `--radius-lg`               |
| `border.width.1`        | foundation | `--border-width-1`          |
| `border.style.solid`    | foundation | `--border-style-solid`      |
| `shadow.sm`             | foundation | `--shadow-sm`               |
| `font.size.base`        | foundation | `--font-size-base`          |
| `font.lineHeight.6`     | foundation | `--font-leading-6`          |
| `font.family.sans`      | semantic   | `--font-sans`               |
| `type.body`             | semantic   | `--type-body-*` (5 vars)    |

Names are the source's own token names (`space.100`, `radius.large`,
`Neutral200` for Atlassian). `cssIdent(name)` lowercases and replaces runs of
non-alphanumerics with `-`. `parseRef`, `refToVar`, `scaleEntries(source,
kind)`, `findScaleEntry`, `nearestScaleEntry`, `remapRef(ref, from, to)`,
`paletteEntryByName`, `paletteFamilyEntries` live in `foundation.js`.

Scale kinds: `space`, `radius`, `borderWidth`, `borderStyle`, `shadow`,
`typeSize`, `typeLeading`. Entry shape `{ name, value, rem, px }` (`px`/`rem`
null for non-lengths; shadow entries also carry `layers`).

## State (globals in scripts.js)

```js
activePaletteSource            // 'tailwind' | 'atlassian'
state = {
  themeName, mode,             // mode: 'light' | 'dark'
  vars: { light: {}, dark: {} },       // semantic layer, CSS key -> CSS value:
                                       //   33 color roles (v1 COLOR_GROUPS + ELEMENT_GROUPS), 'shadow-color',
                                       //   'font-sans' | 'font-serif' | 'font-mono', 'tracking-normal',
                                       //   'type-<set>-family|weight|size|leading|tracking' (7 sets, TYPE_SETS)
  loadedVars,
  palette: { families: [] },   // the system palette subset: family names of activePaletteSource
  components: {},              // component-part tokens: id -> ref (explicit entries only)
  activePage: 'elements',      // 'foundation' | 'typography' | 'elements'
  selection: null              // { element, variant, part, state } | null
}
tokenLinks = { light: { key: { source, name, hex } }, dark: {} }   // semantic color -> palette link
```

v1's `radius-*`, `spacing-*`, `shadow-opacity/blur/spread/offset-*` vars are
gone. Shadow steps are foundation shapes; only `shadow-color` remains (a
palette-linked semantic color).

Undo snapshots carry `{ vars, tokenLinks, components, palette }`.

## Component-part tokens (`components.js`)

Token id: `<element>[.<variant>].<part>[.<prop>][.<state>]`

- `variant` omitted when the element has no variants.
- `prop` omitted when the part has a single property (`card.radius`,
  `card.shadow`, `button.primary.gap`).
- `state` omitted for `default`. Explicit state entries only exist when a
  designer edits that state; otherwise a state resolves to the default-state
  value (inheritance).

Examples: `button.primary.bg.color`, `button.primary.bg.color.hover`,
`card.border.width`, `input.text.type`, `checkbox.checked.box.color`.

CSS var: `--` + id with `.` → `-`: `--button-primary-bg-color-hover`. A `type`
prop expands to five vars: `--input-text-type-family|weight|size|leading|tracking`
each `var(--type-<set>-…)`.

Prop kinds and allowed refs:

| kind         | refs                                   |
|--------------|----------------------------------------|
| `color`      | `color.<role>` or `palette.<name>`     |
| `space`      | `space.<name>`                         |
| `radius`     | `radius.<name>`                        |
| `borderWidth`| `border.width.<name>`                  |
| `borderStyle`| `border.style.<name>`                  |
| `shadow`     | `shadow.<name>`                        |
| `type`       | `type.<set>` (display…code)            |

States: `default`, `hover`, `focus`, `active`, `disabled` — each element
declares which apply.

### Elements (key · variants · states · parts)

Private var read by `components.css` is `--_<part>-<prop>`, or `--_<part>` for
single-prop parts. Seeds reference the semantic layer (shadcn defaults); scale
seeds are written as Tailwind refs and passed through `remapRef` for Atlassian.

```
button      primary|secondary|destructive|outline|ghost|link · all 5 states
            bg{color} text{color,type} icon{color} border{color,width,style} radius padding{x,y} gap shadow ring{color,width}
input       – · default|hover|focus|disabled
            bg{color} text{color,type} placeholder{color} border{color,width,style} radius padding{x,y} shadow ring{color,width}
select      same as input + icon{color}
textarea    same as input
checkbox    unchecked|checked · default|hover|focus|disabled
            box{color} border{color,width,style} mark{color} radius size ring{color,width} label{color,type} gap
radio       same as checkbox (radius seeded full)
switch      off|on · default|hover|focus|disabled
            track{color} thumb{color} radius width height ring{color,width} label{color,type} gap
badge       default|secondary|destructive|outline · default
            bg{color} text{color,type} border{color,width,style} radius padding{x,y}
card        – · default
            bg{color} border{color,width,style} radius padding gap shadow title{color,type} description{color,type} body{color,type}
alert       default|destructive · default
            bg{color} border{color,width,style} radius padding gap icon{color} title{color,type} description{color,type}
tabs-list   – · default
            bg{color} radius padding gap
tab         inactive|active · default|hover|focus|disabled
            bg{color} text{color,type} radius padding{x,y} shadow ring{color,width}
table       – · default
            header{color(bg),text(color),type} cell{color,type,padding-x,padding-y} border{color,width,style}
table-row   – · default|hover|active
            bg{color}
avatar      – · default
            bg{color} text{color,type} radius size border{color,width,style}
tooltip     – · default
            bg{color} text{color,type} radius padding{x,y} shadow
popover     – · default
            bg{color} text{color,type} border{color,width,style} radius padding gap shadow
list-item   – · default|hover|active|disabled
            bg{color} text{color,type} meta{color,type} icon{color} padding{x,y} gap radius
separator   – · default
            line{color} width{borderWidth}
```

Seeds follow shadcn/ui: primary button `color.primary` / `color.primary-foreground`,
outline `color.background` + `border color.input width 1`, ghost/link
`palette.transparent`, hover on outline/ghost → `color.accent` /
`color.accent-foreground`, disabled → `color.muted` / `color.muted-foreground`,
focus → `border.color = color.ring`, inputs `color.background` / `color.input`
border, card `color.card` / `color.border` / `radius` from the theme /
`space.6` padding / `shadow.sm`, badge `radius.full`, type: buttons/labels
`type.label`, inputs/body `type.body`, badges/descriptions `type.caption`,
card title `type.subheading`. The theme's `--radius` (rem) is passed in as
`ctx.radiusRem` to seed button/input/card radius via `nearestScaleEntry`.

### components.js API

```js
ELEMENTS                                  // [{ key, label, variants|null, states, parts:[{key,label,props:[{key,kind}]}] }]
seedComponentTokens(sourceKey, ctx)       // -> { id: ref } for every default-state token + seeded state overrides. ctx = { radiusRem }
componentTokenIds()                       // all default-state ids in spec order
tokenIdParts(id)                          // -> { element, variant, part, prop, state }
tokenId(element, variant, part, prop, state)
resolveComponentRef(id, components)       // explicit entry, else default-state entry, else seed; never undefined
componentVarLines(components, sourceKey)  // '  --button-primary-bg-color: var(--primary);\n…' for EVERY element/variant/part/prop/state (states resolved through inheritance); type props expanded to 5 lines
buildWiringCss()                          // static: @layer components { [data-element][data-variant] { --_bg-color: var(--button-primary-bg-color); … } } @layer states { …:is(:hover:not([data-state]), [data-state="hover"]) { … } … }
buildGalleryHtml()                        // the Elements page body: every element × variant × state, forced via data-state
componentUsage(components)                // -> { ref: [id, …] } for foundation "in use" badges
remapComponentTokens(components, from, to)
propKind(element, part, prop)             // -> kind
```

State selectors in the wiring sheet:

```
hover    :is(:hover:not([data-state]), [data-state="hover"])
focus    :is(:focus-visible:not([data-state]), :focus-within:not([data-state]), [data-state="focus"])
active   :is(:active:not([data-state]), [data-state="active"], [aria-selected="true"], [aria-pressed="true"])
disabled :is(:disabled, [data-state="disabled"], [aria-disabled="true"])
```

Default-state gallery cells carry `data-state="default"` so real hover never
repaints a forced cell.

### Gallery markup

Every instance root carries `data-element`, `data-variant` (if any),
`data-state`, and `data-part` for its main box (`bg`, `box`, `track`, `line`,
`list`…). Every clickable region inside carries `data-part`. Classes are
`ds-<element>` (`ds-button`, `ds-card`, `ds-card-title`, …); `components.css`
styles by class and by `[data-variant]`/state only through the private vars.
Gallery chrome (section headings, matrix grid, state labels) uses `gallery-*`
classes styled in `pages.css`.

## Preview document (built by scripts.js)

```html
<style>
@layer reset, tokens, base, components, states, pages;
@import url("preview/reset.css") layer(reset);
@import url("preview/components.css") layer(components);
@import url("preview/pages.css") layer(pages);
</style>
<link id="google-fonts" rel="stylesheet" href="…">
<style id="theme-vars">@layer tokens { :root { …all vars… } }</style>
<style id="wiring">…buildWiringCss()…</style>
<style id="type-meta">…</style>
<body data-route="elements">
  <section data-page="foundation">…buildFoundationPageHtml…</section>
  <section data-page="typography">…buildTypographyPageHtml…</section>
  <section data-page="elements">…buildGalleryHtml…</section>
  <script src="preview/frame.js"></script>
</body>
```

`pages.css` (@layer pages) hides `[data-page]` whose key ≠ `body[data-route]`,
and provides `body { background: var(--background); color: var(--foreground);
font-family: var(--font-sans) }` in `@layer base`.

`theme-vars` block content, in order: palette vars for the subset families (+
specials), every scale entry of the active source (`--space-4: 1rem`,
`--radius-lg`, `--border-width-1`, `--border-style-solid: solid`,
`--shadow-sm: …`, `--font-size-base`, `--font-leading-6`), semantic colors
(`--primary: var(--palette-neutral-900)` when linked into the subset, else the
hex), `--shadow-color`, font families, tracking, type-set vars
(`--type-body-size: var(--font-size-base)` when on-scale, else the rem), then
`componentVarLines()`. Edits patch this one block in place; the Foundation
and Typography sections are re-rendered (innerHTML) on each render, the
Elements section only on structural change.

## Frame protocol (`preview/frame.js` → parent, via postMessage)

```js
{ type: 'ds:ready' }
{ type: 'ds:select', element, variant, part, state }   // click on [data-part]
{ type: 'ds:action', action, ...dataset }              // click on [data-action] (pages): 'toggle-ramp' {family}, 'edit-semantic' {key}
```

Parent → iframe is direct DOM: `doc.body.dataset.route = page`; selection
highlight via `data-selected` on the clicked part; `data-inspect-state` on
body marks the state the inspector is editing.

Hover outline: frame.js sets `data-hover` on `closest('[data-part]')` under the
pointer; `pages.css` draws the outline for `[data-hover]` / `[data-selected]`.

## pages.js API

```js
buildFoundationPageHtml(ctx)
buildTypographyPageHtml(ctx)
ctx = {
  source, foundation,            // FOUNDATION[source]
  families, allFamilies,         // subset + every family of the source
  vars: { light, dark }, links: { light, dark }, mode,
  semanticGroups,                // ALL_COLOR_GROUPS: [{ key, label, fields: [[cssKey, label]] }]
  components, usage,             // state.components, componentUsage()
  typeSets, typeSetSummary       // TYPE_SETS, (vars, set) => 'Sans→Inter · 2xl / 8 · 600'
}
```

Interactive bits emit `data-action="toggle-ramp" data-family="…"` and
`data-action="edit-semantic" data-key="…"`. Typography sample article uses
`.type-set[data-set=…]` + gutter badges as v1 did (`--type-<set>-abbr|badge|meta`
from `type-meta`).

## dtcg.js API

```js
buildTokensJson(ctx)   // ctx = { name, source, families, vars, links, components, typeSets }
parseTokensJson(obj)   // -> { name, source, families, vars: {light, dark}, links: {light, dark}, components }; throws Error with a readable message
```

File shape (Tokens Studio / Penpot importer dialect, matching `penpot/tokens.example.json`):

```
global      palette.<name> (color), space.<name> (spacing, px), radius.<name> (borderRadius, px),
            border.width.<name> (strokeWidth, px), border.style.<name> (strokeStyle),
            shadow.<name> (boxShadow: [{x,y,blur,spread,color:"{color.shadow-color}",type:"dropShadow"}]),
            font.family.sans|serif|mono (fontFamilies), font.size.<name> (fontSizes, px),
            font.lineHeight.<name> (lineHeights, px), type.<set> (typography composite with
            {font.family.*}, {font.size.*}, {font.lineHeight.*} refs, fontWeight, letterSpacing)
            $extensions["theme-editor"] = { version: 2, name, source, families }
light       color.<role> → "{palette.<name>}" or literal hex when unlinked; includes shadow-color
dark        same
component   component.<element>[.<variant>].<part>[.<prop>][.<state>] → "{color.primary}" etc.
            $type by kind: color→color, space→spacing, radius→borderRadius, borderWidth→strokeWidth,
            borderStyle→strokeStyle, shadow→boxShadow, type→typography (value "{type.body}")
$metadata   { tokenSetOrder: ['global','light','dark','component'] }
$themes     [{ id:'light', name:'Light', group:'mode', selectedTokenSets:{ global:'source', light:'enabled', component:'enabled' } }, { id:'dark', … }]
```

Values are exported in px (Penpot), rem in the editor (16px/rem).
