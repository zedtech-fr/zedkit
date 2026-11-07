# `.cursor/` layer

Thin Cursor attachment of the shared source. Do not copy rules here.

- Law: root `AGENTS.md` and nested `AGENTS.md`. Map: `.agents/README.md`.
- Skills, agents, commands: links into `.agents/` (or generated agent files from `zedkit-ai sync`).
- `.cursor/rules/*.mdc` either always-on-and-short, or globbed with a `**/`-prefixed comma-separated `globs:` string, and a pointer at the nested `AGENTS.md`. One law, one owner.
- Encode a session learning with `/improve-config` (skill `rules-upkeep`).
