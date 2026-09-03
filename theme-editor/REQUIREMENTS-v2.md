# Theme Editor v2 — Design System Creator

Requirement for the next session. Decisions were made on 2026-09-03 (section 8); the rest is the agreed shape.

## 1. Purpose

Turn `theme-editor/` from a "shadcn theme tweaker" into a **design-system creator**: a WYSIWYG tool where every visible property of every element is bound to a value that exists inside the design system, and nothing else. The output is the design system itself (tokens + CSS), not a theme for someone else's components.

Guarantee to enforce: *no element in the preview carries a raw value. Every color, size, width, radius, shadow, and type style resolves through a token chain that ends in a foundation scale.*

## 2. Token model (three layers)

```
foundation  →  semantic  →  component part
palette.teal.600   →   color.primary   →   button.primary.bg
space.4 (16px)     →   —               →   card.padding
border.width.1     →   —               →   card.border.width
type.set.body      →   —               →   card.body.text
```

- **Foundation scales** (the "values available in the system"): color ramps, spacing, radius, border width, border style, shadow, type sizes/leadings, type sets. Sourced from the active system (Tailwind / Atlassian).
- **System palette (subset)**: a design system declares *its own* palette — a chosen subset of the source ramps (e.g. one neutral ramp + two hue ramps, or pasted custom ramps). Every color picker in the tool offers only this subset. Semantic tokens must link into the subset; a link outside it is reported as unlinked.
- **Semantic tokens**: the existing 33 color roles (primary, card, border, …) each linked to exactly one palette entry, light + dark. Already built.
- **Component-part tokens**: new. One token per (element, part, property), e.g. `card.border.color`, `card.border.width`, `card.border.style`, `button.primary.radius`. Each part token references a semantic token or a foundation token — never a literal. Defaults are seeded from the semantic layer so a fresh system already looks coherent.

Export = the whole chain, so a downstream consumer (Penpot via `penpot/`, or a codebase) can read either the resolved value or the reference.

## 3. Pages (3, replacing the 9 preview tabs)

### 3.1 Foundation
- **Color**: the system palette (the declared subset) as swatch rows, with a "choose ramps" control to add or remove ramps from the source system. Each swatch shows which semantic tokens reference it (badges), so an unused ramp or an over-used step is visible. Semantic list beside it: role → palette token → resolved hex, light and dark side by side.
- **Spacing**: the scale as labelled bars (name · rem · px), with the base unit stated ("1 = 4px"). Marks which steps are in use by component tokens.
- **Radius, border width, border style, shadow**: same treatment, one row per scale, live sample per step.
- Everything here is read-mostly: the scale is defined by the system source, and this page is the reference card. The only edit is palette subset selection.

### 3.2 Typography
- The allowed size ramp and leading ramp of the active system, rendered as specimen rows (token name · px · sample line).
- The type sets (Display … Code) with their circle badges, each showing family chain (set → family token → face), weight, size token, leading token, tracking.
- A sample article with gutter badges (already built) so a set can be judged in context.
- Editing: per set, the controls that exist today. Sizes and leadings can only take ramp values.

### 3.3 Elements
- A gallery of the system's **base elements only**, each rendered in all variants and states: button (primary/secondary/destructive/outline/ghost/link × default/hover/focus/active/disabled), input, select, textarea, checkbox, radio, switch, badge, card, alert, tabs, table, avatar, tooltip, popover, list item, separator.
- No project-specific pieces here. The Timebank template built on 2026-09-03 (`templates/timebank.js`) is out of scope for v2 and is parked, not deleted; a project layer on top of the base system is a later step.
- This is the WYSIWYG surface: clicking a part opens the Inspector (section 4).

## 4. Click-to-edit inspector

- **Selection**: every element in the gallery is marked `data-element="card"`; every editable region inside it is marked `data-part="border"` (or `bg`, `text`, `icon`, `padding`, `shadow`, `radius`). Hover outlines the part; click selects it and posts `{element, part}` from the preview iframe to the editor.
- **Inspector panel** (replaces or sits beside the sidebar tabs): shows the selected part's properties, each as a picker restricted to the design-system values:
  - color → the existing palette popover (semantic role or palette token)
  - border width → border-width scale (Tailwind 0/1/2/4/8px, Atlassian border.width.*)
  - border style → solid / dashed / dotted / none
  - radius → radius scale
  - padding / gap → spacing scale
  - shadow → shadow scale
  - text → type set
- **State switch** in the inspector (default / hover / focus / active / disabled) from v1. Each state is its own set of part tokens (e.g. `button.primary.bg.hover`), seeded from the default state so an untouched state inherits rather than diverges. The gallery renders every state statically (forced-state classes) so hover values can be inspected without hovering.
- Edits go through `setVar` so undo/redo, save, import/export keep working.
- Breadcrumb "Card › Border › Color → color.border → neutral-200 (#e5e5e5)" shows the full chain for the selected property.

## 5. Preview rendering

- Drop the Tailwind Play CDN and the generated `!important` override sheets (~370KB per document today). Elements are rendered by the editor's own component CSS, written against the token vars only, using cascade layers (`@layer tokens, base, components, states`) per Lh's CSS doctrine.
- One iframe document with all three pages as routes, so switching pages does not reload or recompile anything; token edits patch the `<style id="theme-vars">` block in place as today.
- The nine current preview templates (Overview, Cards, Timebank, Mail, Dashboard, Application, Marketing, Typography, Color Palette) and their Tailwind dependency are removed from the editor. The Typography and Color Palette ideas are absorbed into the Typography and Foundation pages. `tweakcn-themes-full.js` stays as an import source for starting palettes only.

## 6. Export / import / persistence

- **Export, in priority order**: (a) `tokens.json` in W3C DTCG format with references preserved (`{color.primary}` style), ready for `penpot/` import and consistent with `token-generator/`'s output — this is the primary deliverable and is built first; (b) `design-system.css` with the var block for `:root` and `.dark`, plus the component CSS; (c) the existing annotated CSS view for pasting.
- DTCG shape: `palette.*` (color), `color.*` (semantic, light/dark as Penpot sets or themes), `space.*`, `radius.*`, `border.width.*`, `shadow.*`, `font.*` / `type.*` (typography composite), `component.*` (part tokens as references). Verify against what `penpot/` actually imports before finalising group names.
- **Import**: DTCG `tokens.json` (round-trip), the current annotated CSS, and `DESIGN.md` front matter (as `token-generator/` already parses).
- **Save**: named design systems in localStorage as today; add "Download / Load file" so a system can live in a repo.

## 7. Non-goals for v2

- Editing the foundation scales themselves (adding a spacing step, custom hue ramps) beyond subsetting — later.
- Responsive breakpoints per token.
- Component code generation for a specific framework.

## 8. Decisions (made 2026-09-03)

- **A. Palette subset** — yes. A system declares its own palette subset; pickers offer only that.
- **B. Tailwind and the gallery templates** — drop. Preview renders from the editor's own token-driven CSS.
- **C. State variants** — in v1. Default, hover, focus, active, disabled from the start.
- **D. Element list** — base elements of the design system only. Timebank pieces are out of scope (parked).
- **E. Export priority** — DTCG `tokens.json` for the Penpot pipeline first.

## 9. Build order

1. Component-part token layer with states, seeded from semantic tokens (no UI yet; export shows it).
2. DTCG `tokens.json` export + import round-trip, checked against `penpot/`'s importer.
3. Own component CSS + single-document preview with the three routes; remove Tailwind and the old templates.
4. Foundation page (with palette subset selection) and Typography page (reuse of what exists).
5. Elements gallery with `data-element` / `data-part` markup and forced-state rendering.
6. Inspector: selection, hover outline, state switch, property pickers, breadcrumb.
7. File save/load, CSS export.
