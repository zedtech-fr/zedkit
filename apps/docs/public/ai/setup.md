# Set up zedkit AI in this repository

Agent-executable onboarding. Follow these steps in order in the **current repo root**. Do not ask how to begin. Canonical human walkthrough: [https://zedkit.app/docs/ai/setup](https://zedkit.app/docs/ai/setup). This file: [https://zedkit.app/ai/setup.md](https://zedkit.app/ai/setup.md).

## Goal

Install `@zedtech/zedkit-ai`, wire your coding agent tool with adopt mode, run `/zedkit-ai` (or the `setup-ai` skill) to tailor `AGENTS.md` to this repo, then validate.

This walkthrough targets `@zedtech/zedkit-ai` **1.2.0** (the current published version). Every command below pins it with `@1.2.0`; drop the suffix to float (not reproducible).

## Steps

1. **Install the package** (skip only if `devDependencies` already pins `@zedtech/zedkit-ai@1.2.0` — mere presence is not enough; a different installed version must be upgraded to the pinned one so install and execution agree):

   ```sh
   pnpm add -D --save-exact @zedtech/zedkit-ai@1.2.0
   ```

   When **`pnpm-workspace.yaml`** exists at the repo root, use **`pnpm add -D -w --save-exact @zedtech/zedkit-ai@1.2.0`** instead (avoids `ERR_PNPM_ADDING_TO_ROOT`).

   Use `npm install -D --save-exact @zedtech/zedkit-ai@1.2.0` when the repo has no pnpm lockfile.

   `--save-exact` matters: without it the manager records a caret range (`^1.2.0`) that floats on later installs. The pin must be exact so install and execution agree.

2. **Install the kit with adopt** (keeps existing agent files on name collision — kit copies land beside yours as `*.kit.md` / `zk-<name>`; **`setup` uses the `setup` preset by default** — override with `--preset` when needed):

   ```sh
   npx @zedtech/zedkit-ai@1.2.0 setup --provider cursor
   ```

   **`--provider`** accepts `cursor`, `muse`, `claude`, `codex`, or comma-separated names (`cursor,muse`). Use `all` to wire every supported runtime. Match the tool the user asked for.

3. **Run setup-ai** (repo audit, discovery interview, plan, and tailored instructions):

   - **Cursor:** In Cursor, run **`/zedkit-ai set up this repo from what it contains`** (or ask the agent to run the `setup-ai` skill). Read the skill, then print its intro first — before any repo reads, inventory, or writes — and **continue in the same turn** straight into phase A without waiting for a reply. The only stop points are the phase B batched interview, plan approval before writes, and the final report.
   - **Muse:** Open Muse for this repo and paste a message that runs the `setup-ai` skill end to end (same phases as above). Muse does not scan `.agents/commands`; invoke the `zedkit-ai` skill by name.
   - **Claude Code / Codex / other agent:** Paste the same intent: run the `setup-ai` skill from the kit through verify, following its intro and phases (no skipping the batched interview).

   Follow the skill through **verify**: run the gate commands it lists, apply the approved plan, finish the report.

   Phase **B** starts by **reading the code**, not by asking: the agent runs `npx @zedtech/zedkit-ai@1.2.0 scan`, then spawns read-only subagents on the `check`/`standard` cell (1–5 small, 6–10 medium, 11–20 large) using that cell’s listed id that is not a fast id. They report the rules already in place with `file:line` evidence. It writes them to domain rules, nested `AGENTS.md` files and `.agents/tokenomics.md`, then runs `npx @zedtech/zedkit-ai@1.2.0 sync`, so later agent work in the repo keeps the same cheap-reads, strong-decides split.

   Then **answer or delegate the batched discovery interview** (at most 8 questions in one batch, only what the code could not answer); do not skip the interview or substitute guesses for owner answers.

4. **Validate**:

   ```sh
   npx @zedtech/zedkit-ai@1.2.0 validate
   ```

   **Statically valid when** exit code is `0` and stdout is exactly:

   ```text
   ok
   ```

   That proves the install is coherent on disk. It does not prove your provider lists the agents, honors `model:`, or discovers the skills — confirm those in your tool.

   Fix every reported path until validate is clean. If the repo uses Prettier, add the kit paths from the CLI **`prettier:`** hint to `.prettierignore` (or approve that row in the setup-ai plan) so `prettier --check .` stays green.

   For a deeper check, `npx @zedtech/zedkit-ai@1.2.0 validate --setup` also verifies the setup went deep: a reading log, domain rules, nested `AGENTS.md` and model routing.

## Rules

- Use **`setup`**, not bare `init`, when the repo may already have agent files — adopt keeps user content.
- Do not skip **`/zedkit-ai`** (or the `setup-ai` skill) — install alone is not a finished setup.
- During setup-ai, follow **evidence only** (`ground-truth`): commands and paths must be verified, not guessed.

## Workspace roots

If this folder holds **several git checkouts** (multi-repo workspace), run **`/zedkit-ai` in workspace mode** at the root (or the `setup-ai` skill); run a separate setup inside each app repo the inventory lists.
