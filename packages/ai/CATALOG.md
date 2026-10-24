# Catalog — @zedkit/ai

## Set up AI agent instructions, skills, subagents and commands in a repo

- Import: `@zedkit/ai` — `installKit`, `InstallOptions`, `Action`, `Provider`, `Target`
- Wraps: `(none)`
- Status: stable

```ts
import { installKit } from "@zedkit/ai";
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

- Import: `@zedkit/ai` — `validateKit`, `checkDrift`, `Issue`
- Wraps: `yaml`
- Status: stable

```ts
import { checkDrift, validateKit } from "@zedkit/ai";
const issues = [...validateKit(".agents"), ...checkDrift(".", ".agents")];
for (const issue of issues) console.error(`${issue.path}: ${issue.message}`);
```

CLI equivalent: `zedkit-ai validate` (accepts a project root too; reports drift)
