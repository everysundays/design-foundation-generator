# Designer

Umbrella for the design-foundation tooling: generate design tokens, push them into Penpot, build components from them. Each tool lives in its own subdirectory; a skill system will eventually tie them together into one workflow.

## Tools

- **[`token-generator/`](token-generator/)** — browser tool that generates color/typography/spacing tokens and exports a Penpot-importable `tokens.json`. Formerly `design-foundation-generator`, imported here with full git history.
- **[`theme-editor/`](theme-editor/)** — design-system creator (v2): foundation scales (Tailwind v4 / Atlassian) → semantic colors + type sets → component-part tokens with states, a click-to-edit Elements gallery rendered from the editor's own token-driven CSS, Foundation/Typography reference pages, and DTCG `tokens.json` export/import for the `penpot/` pipeline. Serve the repo root and open `/theme-editor/`; contract in `theme-editor/ARCHITECTURE-v2.md`, node tests in `theme-editor/tests/`. v1's Tailwind templates are parked in `theme-editor/templates/`.
- **[`penpot/`](penpot/)** — Penpot-side workflow: importing `tokens.json`, building components from tokens via MCP.
- **[`shadcn/`](shadcn/)** — vendored, offline study of shadcn's CLI/MCP interface and tweakcn's theme registry (42 color palettes), kept for reference. The theme registry is wired into `token-generator/`'s "Start from a preset" picker (as `token-generator/tweakcn-presets.js`); the rest is reference only.
