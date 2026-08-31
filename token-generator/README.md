# Design Foundation Generator

A browser tool for generating a design system's foundation tokens — color palettes (with Material Design 3 role mapping), a typography scale, and a spacing scale — and exporting them as a single JSON file ready to import into Penpot's Tokens panel.

## Usage

Open `index.html` directly, or serve the folder with any static server:

```
python3 -m http.server 8000
```

- **Color** — enter base colors (Primary, Secondary, Tertiary, Error, Neutral, Neutral Variant), click the sync icon to generate a full tonal scale and M3 color roles.
- **Typography** — pick display/header/base fonts, weights and line heights; the type scale and desktop/mobile preview update live.
- **Spacing** — set a base unit (default 4px); a 4-point-grid scale (`space-0`…`space-64`) previews live.
- Click the download icon to export `tokens.json`.

## Token format

The export wraps every token under a single `"Global"` set plus `$metadata.tokenSetOrder`, matching the file shape Penpot's **Tokens → TOOLS → Import** expects (verified against Penpot's own Tokens starter kit). Token names are slugified to letters/digits/dots/hyphens only, since Penpot rejects spaces in token names.

## License

MIT © Usable App Company Limited
