# Set up zedkit UI in this repository

Agent-executable onboarding. Follow these steps in order in the **current repo root**. Do not ask how to begin. Canonical human walkthrough: [https://zedkit.app/docs/getting-started](https://zedkit.app/docs/getting-started). This file: [https://zedkit.app/ui/setup.md](https://zedkit.app/ui/setup.md).

## Goal

Install `@zedtech/zedkit-ui`, wire Tailwind v4 to the package stylesheet, load Glass fonts on Next.js, and reach a styled Save button when the host app entry may be touched.

This walkthrough targets `@zedtech/zedkit-ui` **2.0.1** (the current published version). Every command below pins it with `@2.0.1`; drop the suffix to float (not reproducible).

## Detect

Read the host before any write. Branch on evidence.

1. **Package manager** — `pnpm-lock.yaml` / `pnpm-workspace.yaml` vs `package-lock.json` vs `yarn.lock`.
2. **React + Tailwind** — `package.json` lists `react` 19.x and `tailwindcss` 4.x (or a Tailwind v4 PostCSS plugin). If either is missing: skip this setup, report why, stop. Do not add React or Tailwind.
3. **Framework** — Next.js App Router (`src/app/` or `app/` with `layout.tsx`) vs Vite (`vite.config.*` plus `src/index.css` or `src/App.tsx`) vs neither.
4. **Existing pin** — `package.json` already has `@zedtech/zedkit-ui` exactly at 2.0.1.
5. **Existing CSS** — host stylesheet already has `@import "@zedtech/zedkit-ui/styles.css"` and a matching `@source` line.
6. **Copy path** — `components.json` exists (shadcn). Use the registry/copy path only when that file exists or the user named copy. Do not run `shadcn init` unless they asked.
7. **Identity** — `<html>` already has `data-identity`. Keep that value.

Completion: a written branch (npm path / copy path / skip) with file evidence.

## Steps

Default is the npm path.

1. **Install the package** (skip only if `dependencies` already pins `@zedtech/zedkit-ui@2.0.1` — mere presence is not enough; a different installed version must be upgraded to the pinned one so install and import agree):

   ```sh
   pnpm add --save-exact @zedtech/zedkit-ui@2.0.1 @fontsource-variable/inter @fontsource-variable/space-grotesk
   ```

   When **`pnpm-workspace.yaml`** exists at the repo root, add `-w`. Use `yarn add --exact` when the repo has `yarn.lock`. Otherwise use `npm install --save-exact` when the repo has no pnpm lockfile.

   `--save-exact` / `--exact` matters: without it the manager records a caret range (`^2.0.1`) that floats on later installs. Only `@zedtech/zedkit-ui` is version-pinned; fontsource packages float at first install by design (then lock to whatever exact resolved).

2. **Wire CSS.** `@source` is relative to the CSS file. Append only the missing lines. Keep every line the host already has.

   **Vite `src/index.css` or Next.js `app/globals.css`** (`../node_modules/…`):

   ```css
   @import "tailwindcss";
   @import "@zedtech/zedkit-ui/styles.css";
   @source "../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
   @source not "../node_modules/@zedtech/zedkit-ui/src/**/*.test.*";
   ```

   **Next.js `src/app/globals.css`** (`../../node_modules/…`; the layout import loads that file):

   ```css
   @import "tailwindcss";
   @import "@zedtech/zedkit-ui/styles.css";
   @source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
   @source not "../../node_modules/@zedtech/zedkit-ui/src/**/*.test.*";
   ```

   Paste the block that matches this CSS file's depth. Do not paste both.

3. **Next.js fonts and layout** (Vite: skip this step). If `src/app/fonts.ts` (or `app/fonts.ts` when Detect found `app/`) is missing, add:

   ```ts
   import "@fontsource-variable/inter";
   import "@fontsource-variable/space-grotesk";
   ```

   If `src/app/layout.tsx` (or `app/layout.tsx`) exists, keep its contents. Ensure it imports `./globals.css` and `./fonts`. Add `data-identity="glass"` on `<html>` only when no `data-identity` is set.

   ```tsx
   import "./globals.css";
   import "./fonts";

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en" data-identity="glass">
         <body>{children}</body>
       </html>
     );
   }
   ```

   Completion: layout imports both files; identity attribute is present and unchanged if it was already set.

4. **First-result Save button** only when the host has an app entry this setup may touch (`src/App.tsx` or a page the user named) and that file has no button usage yet. If a Button (or any button component) already exists, skip. Otherwise add:

   ```tsx
   import { Button } from "@zedtech/zedkit-ui";

   export default function App() {
     return (
       <main className="px-page-gutter py-section-sm">
         <Button>Save</Button>
       </main>
     );
   }
   ```

   Registry/copy path (only when Detect chose it): follow [https://zedkit.app/docs/zedkit-and-shadcn](https://zedkit.app/docs/zedkit-and-shadcn). Do not run `shadcn init` on a host that did not ask.

Completion: each step's criterion above holds, or the step is skipped with a reason.

## Preserve

Host conventions win. Adopt or skip; never clobber.

- Existing CSS besides the missing kit lines above. `@import` the kit stylesheet; do not paste kit tokens into a host sheet that already has a look.
- Existing `data-identity` on `<html>`.
- Existing components under `src/components` (or the host equivalent) and existing Button / page files. Stay byte-identical unless step 4 is allowed to add a missing Save file.
- User-owned token files, Tailwind config, and class conventions.

Propose the edit, then apply. Skip when the host already has the line.

## Idempotent re-run

Skip when the exact pin `@zedtech/zedkit-ui@2.0.1` and the CSS wiring are already present. A second pass changes no user-owned bytes.

## Done-check

All of these hold:

1. `package.json` pins `@zedtech/zedkit-ui` exactly at 2.0.1.
2. The host stylesheet contains `@import "@zedtech/zedkit-ui/styles.css"` and an `@source` line that resolves to `@zedtech/zedkit-ui/src`.
3. If the host has a `typecheck` script, run it and record the exit code. There is no `zedkit-ui validate` command.

## Report

Print:

- Files written, skipped, preserved (path + reason).
- Done-check result (pin, CSS import, `@source`, typecheck exit if run).
- First-result: styled Save button present, skipped, or not applicable.
- Next prompt if another setup-able package is still requested (from [https://zedkit.app/map.md](https://zedkit.app/map.md)).
