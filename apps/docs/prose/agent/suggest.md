# Suggest which zedkit setup this repo needs

Agent-executable inspection. Follow these steps in the **current repo root**. Do not ask how to begin. This file: [https://zedkit.app/suggest.md](https://zedkit.app/suggest.md). Combined install recipe: [https://zedkit.app/map.md](https://zedkit.app/map.md).

## Goal

Inspect the host and recommend a setup-able package combo (AI, UI, Nest) with short reasons and skips. Print exactly one follow-up setup prompt. Then stop.

This run is **read-only**. Inspect and recommend. Leave the tree unchanged.

## Inspect

Read only. Record evidence (path + fact) for each probe:

1. **Manifests** — `package.json`, lockfile, `pnpm-workspace.yaml`.
2. **Frameworks** — React, Next.js, Vite, Nest (`@nestjs/core`, `NestFactory`).
3. **CSS** — Tailwind v4, existing `@zedtech/zedkit-ui` stylesheet import, `@source` lines.
4. **Existing zedkit pins** — `@zedtech/zedkit-ai`, `@zedtech/zedkit-ui`, `@zedtech/zedkit-nest` (version and whether they are wired).
5. **Agent setup** — `.agents/`, `AGENTS.md`, provider folders.
6. **Copy path** — `components.json`.
7. **UI usage** — existing Button / layout / `data-identity`.

Completion: a written inventory with file evidence. Empty fields are recorded as empty, not guessed.

## Empty repo

No `package.json`, or a manifest with no app framework and no zedkit pins:

- **Recommend AI** when the user uses a coding agent in this folder (or asked for agent setup).
- **Skip UI** until a React 19 + Tailwind v4 app exists, unless the user already said they are starting one.
- **Skip Nest** until a Nest app exists, unless the user already said they are starting one.

Print the matching follow-up prompt from the list below.

## Partial repo

Skip every setup-able package that is already pinned at the current published version **and** wired (AI: kit files present; UI: stylesheet import + `@source`; Nest: `createNestApp` imported).

- Already wired: say why, and for AI offer improve mode (`/setup-ai` improve) rather than a second fresh install.
- Missing or unwired: recommend that package.
- Wrong stack (UI without React+Tailwind, Nest without Nest): skip with the reason.

## Recommend

Name:

- Kits to install, each with one reason that cites Inspect evidence.
- Kits to skip, each with one reason.
- Exactly one follow-up prompt, copied verbatim from this list:

  - `Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md`
  - `Set up zedkit UI on this repo following https://zedkit.app/ui/setup.md`
  - `Set up zedkit Nest on this repo following https://zedkit.app/nest/setup.md`
  - `Set up zedkit AI and UI on this repo following https://zedkit.app/map.md`
  - `Set up zedkit AI and Nest on this repo following https://zedkit.app/map.md`
  - `Set up zedkit UI and Nest on this repo following https://zedkit.app/map.md`
  - `Set up zedkit AI, UI and Nest on this repo following https://zedkit.app/map.md`

Pick the single-package prompt when exactly one package remains. Pick the matching two- or three-package map prompt when two or more remain. Print `nothing to install` when every package is skipped.

Do not follow the setup file in this run.

## Stop

Print the recommendation and the one follow-up line. Then stop.
