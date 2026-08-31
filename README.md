# Designer

Umbrella for the design-foundation tooling: generate design tokens, push them into Penpot, build components from them. Each tool lives in its own subdirectory; a skill system will eventually tie them together into one workflow.

## Tools

- **[`token-generator/`](token-generator/)** — browser tool that generates color/typography/spacing tokens and exports a Penpot-importable `tokens.json`. Formerly `design-foundation-generator`, imported here with full git history.
- **`penpot/`** — Penpot-side workflow: importing `tokens.json`, building components from tokens via MCP. Not yet populated.
