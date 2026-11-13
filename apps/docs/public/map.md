# zedkit setup map

Agent-executable index. Follow these steps in the **current repo root**. Do not ask how to begin. This file: [https://zedkit.app/map.md](https://zedkit.app/map.md). Suggest (inspect only): [https://zedkit.app/suggest.md](https://zedkit.app/suggest.md).

## Goal

Install only the setup-able packages the user named, in a safe order, and emit one combined report. Unchosen names go to suggest, not to a silent install-all.

## Setup-able packages

| Package | Gives | Prerequisites | Skip when | Setup file | Mini prompt |
| --- | --- | --- | --- | --- | --- |
| UI | Tailwind-wired React components, Glass fonts, a styled Save button | React 19 + Tailwind v4 app | Not a React+Tailwind app; user did not ask for UI | https://zedkit.app/ui/setup.md | `Set up zedkit UI on this repo following https://zedkit.app/ui/setup.md` |
| Nest | `createNestApp` bootstrap with validation, logs, docs | Existing NestJS app | Not a Nest app (this file does not scaffold; point start-one requests at the human walkthrough) | https://zedkit.app/nest/setup.md | `Set up zedkit Nest on this repo following https://zedkit.app/nest/setup.md` |
| AI | Agent instructions, skills, `/zedkit-ai`, `validate` | A git repo; a coding agent | User did not ask for AI | https://zedkit.app/ai/setup.md | `Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md` |

Paste prompts:

- Suggest: `Suggest which zedkit setup this repo needs following https://zedkit.app/suggest.md`
- Combined (all three): `Set up zedkit AI, UI and Nest on this repo following https://zedkit.app/map.md`

## Detect requested packages

Parse the user message for AI, UI, and Nest.

- The combined mini prompt above means all three.
- A message that names a subset installs **only the requested** packages.
- A message that says only `following https://zedkit.app/map.md` with no package names: follow [https://zedkit.app/suggest.md](https://zedkit.app/suggest.md) and stop. Do not assume all three.

Completion: the requested set is written down (possibly empty → suggest).

## Order

When several are requested, run them **UI → Nest → AI**. UI and Nest first so `/zedkit-ai` can read the host they leave behind. Skip any package that was not requested.

Sequence each requested file in that order. Do not re-run that package's done-check as a process-wide gate yet.

## Preserve and idempotency

Each setup file's Preserve and Idempotent sections apply to that package. Combined setup does not add extra writes. Host conventions and user-owned files stay intact.

## One combined validation

After every requested setup file has finished:

1. Run each requested package's own **Done-check** from its setup.md.
2. If AI was requested, run `npx @zedtech/zedkit-ai@1.2.0 validate` once as the process-wide gate (the command in https://zedkit.app/ai/setup.md). UI-only and Nest-only runs skip that CLI.
3. Print **one combined** report: requested set, files written / skipped / preserved per package, each done-check result, and the AI validate stdout (`ok`) when AI was requested.

Do not emit a separate final report per package.
