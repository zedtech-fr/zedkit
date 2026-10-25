# Catalog — @zedtech/zedkit-ai

- Keywords: ai, agents, agents-md, skills, subagents, cursor, claude-code, codex, coding-assistant, setup, scaffolding, opencode
- Audience: Teams running coding agents (Cursor, Claude, Codex and more) who want one shared setup.
- Purpose: Install one agent-agnostic setup (AGENTS.md, skills, subagents, commands) with a single CLI, instead of maintaining per-tool config.
- Attribution: Original work by the same author.


## Set up AI agent instructions, skills, subagents and commands in a repo

- Import: `@zedtech/zedkit-ai` — `installKit`, `InstallOptions`, `Action`, `Provider`, `Target`
- Wraps: `(none)`
- Status: beta

```ts
import { installKit } from "@zedtech/zedkit-ai";
const result = installKit({ dest: ".", preset: "core", providers: ["claude", "cursor"] });
if (!result.ok) throw result.error;
for (const action of result.value) console.log(action.kind, action.path);
```

CLI equivalent: `zedkit-ai init .` (`--provider cursor,claude,codex,muse,all`; `--target` is an alias)

Presets: `core` (most projects; includes the `review`/`plan`/`challenge`/
`implement` entry points), `full` (every skill).

Providers: `cursor` (rules file, skills link, agents and commands as real-file
copies), `claude` (`CLAUDE.md` and folder links), `codex` and `muse` (no
layer: they read the shared source directly).

## Check that skills, subagents, commands and provider copies are valid

- Import: `@zedtech/zedkit-ai` — `validateKit`, `checkDrift`, `Issue`
- Wraps: `yaml`
- Status: beta

```ts
import { checkDrift, validateKit } from "@zedtech/zedkit-ai";
const issues = [...validateKit(".agents"), ...checkDrift(".", ".agents")];
for (const issue of issues) console.error(`${issue.path}: ${issue.message}`);
```

CLI equivalent: `zedkit-ai validate` (accepts a project root too; reports drift)
