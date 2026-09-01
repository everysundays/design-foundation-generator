# Design Foundation Generator

A browser tool for generating a design system's foundation tokens — color palettes (with Material Design 3 role mapping), a typography scale, and a spacing scale — and exporting them as a single JSON file ready to import into Penpot's Tokens panel.

## Usage

Open `index.html` directly, or serve the folder with any static server:

```
python3 -m http.server 8000
```

- **Color** — enter base colors (Primary, Secondary, Tertiary, Error, Neutral, Neutral Variant), click the sync icon to generate a full tonal scale and M3 color roles.
  - **Design System selector** — switch between saved color sets ("Material Default" plus anything you've imported or saved). Selecting one loads its colors and regenerates immediately.
  - **Import DESIGN.md** — paste the contents of a [DESIGN.md](https://github.com/google-labs-code/design.md) file (or choose a `.md` file). DESIGN.md is a brand-neutral format — it doesn't imply Material Design or any other specific style, it just standardizes *how* a design system's tokens are written down. Recognized color roles (`primary`/`secondary`/`tertiary`/`error`/`neutral`/`neutral-variant`) map onto the M3 seeds this generator is built around; any other named colors (e.g. `accent`) are added as extra, freely-editable rows with their own tonal scale. `on-*` keys are skipped, since the M3 role system derives foreground colors itself. Any canonical role the file doesn't define keeps whatever that row is currently set to (not reset to Material Default), so importing never discards hand-tuning you haven't touched. The file's `typography`, `rounded`, `spacing`, and `components` tokens are also captured (see the Preview tab below) — only its prose sections (Overview, Layout, Elevation & Depth, Shapes, Do's and Don'ts) are ignored, since this tool is tokens-only.
  - **Start from a preset** — seed the 6 M3 rows from one of 42 vendored [tweakcn](https://tweakcn.com) themes (`Primary`/`Secondary`/`Tertiary`/`Error` ← its `primary`/`secondary`/`accent`/`destructive`, `Neutral`/`Neutral Variant` ← its `foreground`/`muted-foreground`). Vendored locally as `tweakcn-presets.js` — see `../shadcn/README.md` for why this isn't a live connection. A starting point only: tune any row afterward like any other palette.
  - **+ Add color** — add a freeform extra color row by hand, without importing a file.
  - **Save As…** — save your current tuned colors back into the library under a name, for reuse across projects. Custom palettes persist in the browser's local storage.
- **Preview** — a reflection of the active design system's own values, separate from the M3 generator machinery above:
  - **Typography** — every `typography:` entry from the imported DESIGN.md, rendered with its own literal `fontFamily`/`fontSize`/`fontWeight`/`lineHeight`/`letterSpacing` (not pushed through the generator's Display/Header/Base ratio scale). Falls back to a few samples from the generator's own type scale if none were imported.
  - **Components** — if the DESIGN.md has a `components:` block, each entry (e.g. `button-primary`) is rendered as a box resolved from its own token references (`{colors.primary}`, `{rounded.sm}`, etc.), following one file's own token tree — not the generator's M3 roles. A broken reference is outlined in red with the specific error in its tooltip, and listed in the warnings panel above. If there's no `components:` block, a standard Button / Badge / Input / Card layout is shown instead, built from whatever `rounded`/`spacing`/`typography` values are available, falling back per-value to the generator's own M3 roles / radius / spacing / type scale.
  - **Warnings** — every fallback (missing typography, missing components, etc.) and every broken token reference is listed here, rather than silently applied or dropped.
- **Typography** — pick display/header/base fonts, weights and line heights; the type scale and desktop/mobile preview update live.
- **Spacing** — set a base unit (default 4px); a 4-point-grid scale (`space-0`…`space-64`) previews live.
- Click the download icon to export `tokens.json`.

## Token format

The export wraps every token under a single `"Global"` set plus `$metadata.tokenSetOrder`, matching the file shape Penpot's **Tokens → TOOLS → Import** expects (verified against Penpot's own Tokens starter kit). Token names are slugified to letters/digits/dots/hyphens only, since Penpot rejects spaces in token names.

## License

MIT © Usable App Company Limited
