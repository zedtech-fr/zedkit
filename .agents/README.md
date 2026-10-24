# AI setup (shared by all agents and IDEs)

Single source of truth: `.agents/skills/` (Muse, Codex and other agents read
it directly). `.claude/skills` and `.cursor/skills` are symlinks to it, and
`.cursor/rules/*.mdc` points at `AGENTS.md` (root rule) and the nested
per-package `AGENTS.md` files (per-folder globs).

Vendored skills (copied verbatim, update by re-copy; licences and credits in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)):

- ponytail (+ audit, debt, gain, help, review), MIT © Dietrich Gebert:
  https://github.com/DietrichGebert/ponytail
- Matt Pocock engineering skills (tdd, code-review, implement, to-spec,
  to-tickets, handoff, wayfinder, pr, … — 19 total, `ask-matt` excluded),
  MIT © Matt Pocock: https://github.com/mattpocock/skills

Plus our own first-party skill (no third-party notice needed):

- use-zedkit: search the catalog by need before writing any helper.

Default workflow: tdd for behaviour, code-review + ponytail-review before
every merge, handoff when stopping.
