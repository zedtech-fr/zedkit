# Set up zedkit Nest in this repository

Agent-executable onboarding. Follow these steps in order in the **current repo root**. Do not ask how to begin. Canonical human walkthrough: [https://zedkit.app/docs/nest/start-a-safe-nestjs-api](https://zedkit.app/docs/nest/start-a-safe-nestjs-api). This file: [https://zedkit.app/nest/setup.md](https://zedkit.app/nest/setup.md).

## Goal

Install `@zedtech/zedkit-nest` with the peers a Nest app needs to boot, and wrap the existing bootstrap with `createNestApp` when the host still uses raw `NestFactory`.

This walkthrough targets `@zedtech/zedkit-nest` **1.1.2** (the current published version). Every command below pins it with `@1.1.2`; drop the suffix to float (not reproducible). This setup wires an existing Nest app. It does not scaffold a new one.

## Detect

Read the host before any write. Branch on evidence.

1. **Package manager** — `pnpm-lock.yaml` / `pnpm-workspace.yaml` vs `package-lock.json` vs `yarn.lock`.
2. **Nest** — `package.json` lists `@nestjs/core`, or `src/main.ts` (or the host boot file) calls `NestFactory`. If the host is not a Nest app: skip, report why, stop. If they asked to start one, point at the canonical human walkthrough (this setup does not scaffold a new app).
3. **Existing pin** — `package.json` already has `@zedtech/zedkit-nest` exactly at 1.1.2.
4. **Existing factory** — a boot file already imports `createNestApp` from `@zedtech/zedkit-nest`.
5. **Existing module and env** — `AppModule` (or the host root module) and any env schema class already in the tree.

Completion: a written branch (wire existing Nest / skip) with file evidence.

## Steps

1. **Install the package and peers** (skip only if `dependencies` already pins `@zedtech/zedkit-nest@1.1.2` and the peers below are present — mere presence of the zedkit package is not enough; a different installed version must be upgraded to the pinned one):

   ```sh
   pnpm add --save-exact @zedtech/zedkit-nest@1.1.2 @fastify/static @nestjs/common @nestjs/config \
     @nestjs/core @nestjs/platform-fastify @nestjs/swagger @nestjs/throttler \
     class-transformer class-validator fastify nestjs-pino pino pino-http \
     reflect-metadata
   ```

   When **`pnpm-workspace.yaml`** exists at the repo root, add `-w`. Use `yarn add --exact` when the repo has `yarn.lock`. Otherwise use `npm install --save-exact` when the repo has no pnpm lockfile.

   `--save-exact` / `--exact` matters: without it the manager records a caret range (`^1.1.2`) that floats on later installs. Only `@zedtech/zedkit-nest` is version-pinned. Peers float by design (the README list, no version suffix; required for Nest DI) and then lock to whatever exact resolved.

2. **Wrap the bootstrap** when the boot file still uses raw `NestFactory`. Skip if `createNestApp` is already imported.

   Keep the existing `AppModule` and env schema. Pass them through:

   ```ts
   import "reflect-metadata";
   import { createNestApp } from "@zedtech/zedkit-nest";

   const app = await createNestApp({
     module: AppModule,
     envSchema: AppEnv,
     docs: { title: "My API", version: "v1" },
   });
   await app.listen(existingPort);
   ```

   If the host has no env schema class, omit `envSchema` (it is optional). Do not invent a schema. Keep the existing listen port and module name (`existingPort` stands in for whatever the host already uses — do not switch it to 3000).

   Completion: the boot file imports `createNestApp`; `AppModule` is unchanged.

Completion: each step's criterion above holds, or the step is skipped with a reason.

## Preserve

Host conventions win. Adopt or skip; never clobber.

- Existing `AppModule` (or host root module).
- Existing env schema and `.env` files.
- Existing bootstrap besides the `NestFactory` → `createNestApp` wrap in step 2.
- Existing filters, pipes, and logger wiring the host already chose.

Propose the edit, then apply. Skip when the host already has the line.

## Idempotent re-run

Skip when the exact pin `@zedtech/zedkit-nest@1.1.2` is present and `createNestApp` is already imported in the boot file. A second pass changes no user-owned bytes.

## Done-check

All of these hold:

1. `package.json` pins `@zedtech/zedkit-nest` exactly at 1.1.2.
2. The boot file imports `createNestApp` from `@zedtech/zedkit-nest`.
3. If the host has a `typecheck` script, run it and record the exit code.

## Report

Print:

- Files written, skipped, preserved (path + reason).
- Done-check result (pin, `createNestApp` import, typecheck exit if run).
- Next prompt if another setup-able package is still requested (from [https://zedkit.app/map.md](https://zedkit.app/map.md)).
