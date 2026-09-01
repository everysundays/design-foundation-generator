# Penpot workflow

The Penpot-side half of the pipeline: importing `token-generator`'s `tokens.json` export and building components from it.

- **[`tokens.example.json`](tokens.example.json)** — a real export from `token-generator/` with default values, for reference/diffing.
- **[`build-components.js`](build-components.js)** — paste into a Penpot MCP `execute_code` call to build Buttons, Badges, Input, and Card, styled entirely from the imported tokens. See its STATUS note before trusting it blind — it hasn't had its first consolidated run yet.
- **[`TESTING.md`](TESTING.md)** — the round-trip checklist: export → import → build → visually verify.
