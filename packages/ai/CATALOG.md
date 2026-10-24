# Catalog — @zedkit/ai

## Set up AI agent instructions, skills and subagents in a repo

- Import: `@zedkit/ai` — `installKit`, `InstallOptions`, `Action`, `Target`
- Wraps: `(none)`
- Status: stable

```ts
import { installKit } from "@zedkit/ai";
const result = installKit({ dest: ".", preset: "core", targets: ["claude", "cursor"] });
if (!result.ok) throw result.error;
for (const action of result.value) console.log(action.kind, action.path);
```

CLI equivalent: `zedkit-ai init .`

Presets: `core` (most projects; includes the `review`/`plan`/`challenge`/
`implement` entry points), `full` (every skill).

## Check that skills and subagents are valid for every tool

- Import: `@zedkit/ai` — `validateKit`, `Issue`
- Wraps: `yaml`
- Status: stable

```ts
import { validateKit } from "@zedkit/ai";
const issues = validateKit(".agents"); // skills/<name>/SKILL.md, agents/<name>.md
for (const issue of issues) console.error(`${issue.path}: ${issue.message}`);
```

CLI equivalent: `zedkit-ai validate`
