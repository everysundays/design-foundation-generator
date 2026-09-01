# Round-trip test

Proves the full pipeline: `token-generator` → `tokens.json` → Penpot import → components built purely from tokens. Re-run this after any change to `token-generator/` that touches the export shape, or to `build-components.js`.

## 1. Export tokens

1. Open `token-generator/index.html` (or serve it: `python3 -m http.server`).
2. Click the sync icon to generate a palette, then the download icon.
3. Confirms: `tokens.json` downloads with no console errors.

## 2. Import into Penpot

1. In a Penpot file, open **Tokens → TOOLS → Import** and select the exported `tokens.json`.
2. Confirms: import completes with zero errors, and the token counts roughly match what `token-generator` generated (color / dimension / font-family / font-size / font-weight / spacing / typography / radius).
3. Activate the `Global` set if it isn't already.

## 3. Build components

1. Connect the file via the Penpot MCP plugin.
2. Run `build-components.js` (this folder) through `execute_code`, as-is.
3. Confirms: no thrown errors; a `Design Foundation Components` board appears containing Buttons, Badges, Input, and Card, all with resolved token values (colors, radii, spacing, type) — nothing left at Penpot's default gray/black.

## 4. Visual check

1. `export_shape` the root board (or the shapes you touched) and eyeball it: colors match the palette, radii look right (sharp buttons, pill badges), text uses the intended type scale.

## Known-good baseline

Last proven end-to-end (manually, one `execute_code` call per component) on 2026-08-31: 165 color, 27 dimension, 3 font-family, 27 font-size, 3 font-weight, 17 spacing, 27 typography tokens imported with zero errors; Buttons/Badges/Input/Card all built and verified by render. `radius` tokens and the consolidated `build-components.js` script are new since then and still need a first real run — see the STATUS note at the top of `build-components.js`.
