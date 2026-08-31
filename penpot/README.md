# Penpot workflow

The Penpot-side half of the pipeline: importing `token-generator`'s `tokens.json` export and building components from it.

Proven manually via MCP (`execute_code`) in an earlier session — export → Penpot **Tokens → TOOLS → Import** → apply tokens to shapes/components — but nothing from that run was saved as a reusable script yet. Still to add:

- A `tokens.json` reference export from `token-generator/`.
- The component-build script (Buttons, Badges, Input, Card — all token-driven).
- A round-trip test checklist.
