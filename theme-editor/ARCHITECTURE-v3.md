# Theme Editor v3 — "touch and go" contract

Supersedes the *layout* parts of `ARCHITECTURE-v2.md`; the data model (refs,
state, component token ids, DTCG file) is unchanged and still documented there.
Decisions (Lh, 2026-09-03):

- The **left sidebar is the picker**. Select a part in the Elements gallery on
  the right, open a foundation tab on the left, see which entry that part uses
  (marked), click another entry to assign it and watch the change.
- Component parts link **straight to foundation values** when assigned this
  way (`palette.blue-600`, `space.4`). Seeds still start from the semantic
  roles, so a fresh system stays coherent.
- The **Summary tab** collects what the work uses (per kind, with counts and
  the parts using each value) and keeps the semantic-role list so values can
  be reconciled to roles later.
- The palette-subset chooser is **dropped**; every ramp of the source is shown.
- Foundation and Typography *preview pages* are gone; the preview is the
  Elements gallery only, grouped by category.
- The gallery shows **one instance per element** (first variant, default
  state) on a padded page. There is no selection strip: select in the gallery,
  assign in the panels.

## Layout

```
toolbar   [Design system: Tailwind ▾] [Start from: Default ▾]   undo redo · mode · Reset Import Save Export
          tabs: Summary | Colors | Space | Radius | Border | Shadow | Type
          panel for the active tab (rendered by panels.js into #panelBody)
preview   .gallery-nav  (All · Actions · Forms · Feedback · Surfaces · Navigation · Data)
          iframe: elements gallery only (one instance per element, in a .page)
```

Files: `panels.js` (new, sidebar panel builders), `panels.css` (new, `fp-*`
styles, linked after `styles.css`), `components.js` (adds categories),
`scripts.js` / `index.html` / `styles.css` (layout, wiring). `pages.js` and the
Foundation/Typography sections are no longer loaded (files stay for now).

## Selection and the active property

`state.selection = { element, variant, part, state }` (unchanged). Each tab
owns one prop *kind*:

| tab     | kind(s)                      |
|---------|------------------------------|
| Colors  | `color`                      |
| Space   | `space`                      |
| Radius  | `radius`                     |
| Border  | `borderWidth`, `borderStyle` |
| Shadow  | `shadow`                     |
| Type    | `type`                       |

`activeProps(selection, kind)` = the selected part's props whose kind matches.
When there is more than one (`padding{x,y}`), the panel shows prop chips and
`state.activeProp[kind]` holds the chosen prop key (default: first). The
**active token id** is `tokenId(element, variant, part, prop, state)`.

Clicking an entry (`[data-ref]`) in a panel while an active token exists calls
`setComponentToken(activeId, ref)` (undo, render). With no selection or no
matching prop, clicks do nothing.

## Marks (computed by scripts.js, passed to panels.js as `ctx.marks`)

`resolveToFoundation(ref, mode)` follows a ref to the foundation entry it lands
on: `color.<role>` → the role's palette link (`palette.<name>`) or `null` when
unlinked; `palette.*`, `space.*`, `radius.*`, `border.width.*`,
`border.style.*`, `shadow.*`, `type.*` → itself.

`ctx.marks[ref] = { count, ids, roles, used, active }`

- `count`: number of default-state component token ids that resolve to this
  entry (states not counted); `ids`: those ids.
- `roles`: semantic roles whose active-mode link is this palette entry
  (colors only).
- `used`: any token of the selected element (any part, any state) resolves here.
- `active`: the active token id resolves here.

Tooltip text (panels.js builds it into `data-tip`, one line per item):
`blue-600 · #155dfc`, then `roles: primary, ring`, then `used by: button.primary.bg, …`
(ids shortened, max ~6 then "+N").

## panels.js API (pure HTML builders, globals)

```js
buildColorsPanelHtml(ctx)                 // ramp rows; each swatch: <button class="fp-swatch" data-ref="palette.blue-600" data-tip="…" data-count="2" data-used data-active style="--swatch:#155dfc">
                                          // + specials row (white / black / transparent)
buildScalePanelHtml(kind, ctx)            // kind: 'space'|'radius'|'borderWidth'|'borderStyle'|'shadow'
                                          // rows: <button class="fp-entry" data-ref="space.4" data-tip data-count data-used data-active> sample · name · px · count badge
buildBorderPanelHtml(ctx)                 // = width section + style section (two scale panels)
buildTypePanelHtml(ctx)                   // set cards: <button class="fp-type-set" data-ref="type.body" …> badge · label · summary · specimen; then <div id="typeControlsMount"></div> where scripts.js mounts the existing family selects, tracking and set groups
buildSummaryPanelHtml(ctx)                // per kind: "In use" lists (entry, count, ids) built from ctx.marks where count>0; then <div id="semanticRolesMount"></div> where scripts.js renders the v2 color groups (createColorFieldRow) so roles can still be re-linked
buildPropChipsHtml(ctx, kind)             // chips for multi-prop parts: <button class="fp-chip" data-prop="x" aria-pressed>
ctx = { source, foundation, mode, vars, links, components, selection, activeProps: { [kind]: propKey },
        marks, typeSets, typeSetSummary, elementLabel(element, variant, part) }
```

Everything clickable carries `data-ref`; scripts.js delegates one click
handler on `#panelBody`. Tooltips: scripts.js shows `#swatchTooltip` on
`mouseenter` of `[data-tip]` (multi-line via `white-space: pre-line`).

## Gallery categories (components.js)

```js
ELEMENT_CATEGORIES = [
  { key: 'actions',    label: 'Actions',    elements: ['button'] },
  { key: 'forms',      label: 'Forms',      elements: ['input','select','textarea','checkbox','radio','switch'] },
  { key: 'feedback',   label: 'Feedback',   elements: ['alert','badge','tooltip'] },
  { key: 'surfaces',   label: 'Surfaces',   elements: ['card','popover','separator'] },
  { key: 'navigation', label: 'Navigation', elements: ['tabs-list','tab','list-item'] },
  { key: 'data',       label: 'Data',       elements: ['table','table-row','avatar'] }
]
```

`buildGalleryHtml()` wraps each category in
`<section class="gallery-category" id="cat-<key>"><div class="gallery-elements">…element sections…</div></section>`
- no heading is printed. The parent's `.gallery-nav` buttons scroll the
iframe to `#cat-<key>` ("All" → top).

Each element section is
`<section class="gallery-section" id="gallery-<key>"><div class="gallery-stage" data-gallery-element="<key>" data-variant="<first|''>" data-state="default">…one instance…</div></section>`.
`syncGalleryStages(doc)` (scripts.js, called from `applySelectionHighlight`)
re-renders a stage via `renderGalleryInstance` when the selected element's
variant/state differ from what the stage's `data-variant`/`data-state` say;
every other stage is kept at first variant + default. Clicking the instance
posts `ds:select` with that state, so the strip's state stays put.

## Preview document

As v2 minus the foundation/typography sections and `data-route`:

```html
<body>
  <section data-page="elements">…buildGalleryHtml()…</section>
  <script src="preview/frame.js"></script>
</body>
```

`pages.css` keeps the gallery chrome and selection/hover rules; its route
rules become inert. frame.js unchanged.

## No selection strip

There is no selection chrome in the sidebar. Selecting is done entirely in the
gallery (click a part; the outline shows what's selected) and assigning is
done entirely in the panels (click an entry). A click on an entry with no
selection, or no matching prop on the selected part, does nothing.

Because the gallery shows one instance per element (first variant, default
state), selection is always first variant + default state for now; variant
and state editing has no UI in v3 and stays available through the data model
(`state.selection.variant` / `.state`, `syncGalleryStages`).

## Unchanged

Undo/redo (snapshots include source), export/import, save/load, dark-mode
toggle, palette-source switch with remap, semantic snapping at load, the
DTCG file shape, tests in `tests/`.
