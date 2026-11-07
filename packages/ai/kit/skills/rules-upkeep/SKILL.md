---
name: rules-upkeep
description: "Keep AGENTS.md, skills and subagents in sync with decisions made in a session, and in valid format. Use at the end of a coding task when a decision, correction or convention came up, and whenever creating or editing agent instructions."
---

# Rules upkeep

The AI setup (`AGENTS.md`, `.agents/skills`, `.agents/agents`) is code: it drifts unless you maintain it. Future sessions only know what is written there.

## When to run

At the end of any coding task, and when one of these happened:

- A design choice was settled or clarified: where a boundary sits, which pattern wins, which exception is allowed.
- A review showed that the current rules **allow** a bad pattern.
- One reusable correction changed the work — the next similar change would repeat the miss if the config stays silent. Do not wait for a second occurrence.
- A new convention was adopted (naming, testing, wiring).
- A shortcut with a stated limit was left in code and will recur.

Skip a note, a question, or a nit the diff ignored. Skip a one-off bug of the feature.

## What to do

1. Locate the gap: which file says nothing, is out of date, or disagrees with the decision?
2. Make the **smallest additive edit** in the same turn, in the natural home. Do not ask first. Do not create a new file when an existing one fits.
3. Change every file the decision touches, and no more. Link to the canonical text instead of copying it. An agent file gets a pointer; the rule stays the source of truth.
4. Removing a rule needs the user's confirmation.
5. If you added a command, skill, or always-on rule, update the map (`.agents/README.md`, and `.cursor/README.md` when that file exists).
6. Finish with the **Rules** section below. Silence is not a valid outcome.

## Where things go

| Content                                           | Home                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| Non-negotiables for the whole repo, commands, map | root `AGENTS.md`, short (it is always loaded)        |
| Rules for one folder                              | `AGENTS.md` in that folder (read when working there) |
| A repeatable workflow with steps                  | a skill                                              |
| A persona with a narrow job and fresh context     | a subagent                                           |
| A short cross-cutting gate                        | always-on Cursor rule (`alwaysApply: true`)          |
| Area-specific procedure                           | globbed Cursor rule, never appended to an always-on  |

Do not write down what the code already shows (file lists, signatures). Write only what a reader cannot get from the code: the why, the limits, the traps.

## Formats that fail silently

| Artifact         | Required                                               | Otherwise                                                                                     |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Skill            | folder `<name>/SKILL.md`, `name` equals the folder     | a flat `.md` is never loaded                                                                  |
| Subagent         | file `<name>.md`, `description` on a single line       | a folded or block description can be shown as `>` and the agent cannot decide when to be used |
| Rule             | `description:` on a single line                        | flipping `alwaysApply` to false later would make it unreachable                               |
| Rule globs       | comma-separated string, each path prefixed `**/`       | a folder prefix does not match when the workspace is that folder; Cursor does not warn        |
| Rule attach      | `alwaysApply: true` only for short cross-cutting gates | every always-on rule is paid in every conversation                                            |
| Any file         | LF line endings                                        | a trailing `\r` breaks YAML values                                                            |
| Subagent `model` | omit it, or `inherit`                                  | an unknown model id can fall back silently; never name one here, see `.agents/tokenomics.md`  |

When files a globbed rule governs move, or a new file should attach, update `globs` in the same change. Rules that share one footprint move together.

Run `zedkit-ai validate` (package `@zedtech/zedkit-ai`, or the repo's equivalent) after editing. It checks these.

## Writing for agents

- Imperative, concrete, short. One rule per bullet. Examples beat adjectives.
- Put the trigger in the skill `description`: "Use when ...". That line decides whether it is ever loaded.
- Large reference material goes in a sibling file, linked from the skill, not in `SKILL.md`.
- Never put secrets, customer names or internal URLs in instructions.

## Mandatory output

Include this section in the final response of every coding task. Never omit it.

```markdown
## Rules

- **Gap:** none | <one-line description>
- **Target file:** N/A | path of the file just edited
- **Edit:** N/A | <one-line summary>
- **Applied:** yes | N/A
```

When **Gap: none**, still include the section. A one-line `Rules: none` is enough when nothing changed.
