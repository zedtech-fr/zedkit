# Catalog — @zedtech/zedkit-quality

- Keywords: eslint, eslint-config, tsconfig, typescript, strict, layers, architecture, a11y, tailwindcss, code-quality
- Audience: Teams keeping the same quality gates across repos.
- Purpose: Shared quality setup: UI lint preset, route/view/data layer boundaries, and one strict TypeScript base — consume, do not copy.


## Lint UI files for accessibility, Tailwind and tokens

- Import: `@zedtech/zedkit-quality/eslint` — `uiPreset`
- Wraps: `eslint-plugin-jsx-a11y`, `eslint-plugin-better-tailwindcss`
- Status: beta
- Short name: UiPreset
- Audience: Frontend teams linting tsx/jsx everywhere the same way.
- Purpose: Enforce a11y, Tailwind hygiene and tokens-only classes on every UI file.
- When to use: When UI rules must match across repos without copying a preset file.
- When not to use: When the repo has no Tailwind theme (the entryPoint has nothing to read).
- See also: `Enforce route, view and data layer boundaries`

```ts
import { uiPreset } from "@zedtech/zedkit-quality/eslint";

export default [...uiPreset({ entryPoint: "./app/globals.css" })];
```

## Enforce route, view and data layer boundaries

- Import: `@zedtech/zedkit-quality/eslint` — `defineLayers`
- Wraps: `eslint`
- Status: beta
- Short name: DefineLayers
- Audience: Frontend teams keeping routes thin, views presentational and data UI-free.
- Purpose: Ban cross-layer imports (route to kit, view to data client, data to UI) at lint time.
- When to use: When features map onto route/view/data folders and bypasses must fail the gate.
- When not to use: When the repo has no layered folders (nothing to map the globs onto).
- See also: `Lint UI files for accessibility, Tailwind and tokens`

```ts
import { defineLayers } from "@zedtech/zedkit-quality/eslint";

export default [
  ...defineLayers({
    kitPackage: "@acme/ui",
    viewDirs: ["app/**/ui/**"],
    dataDirs: ["lib/**"],
    actionPatterns: ["@/lib/*", "**/actions", "**/actions/**"],
  }),
];
```

## Share one strict TypeScript base

- Import: `@zedtech/zedkit-quality/tsconfig`
- Wraps: `(none)`
- Status: beta
- Short name: TsconfigBase
- Audience: TypeScript repos that want the same strictness without copying a file.
- Purpose: One strict base (`strict`, exact optionals, unchecked indexed access, unused checks) every tsconfig extends.
- When to use: When several tsconfigs must stay strict and identical.
- When not to use: When the repo needs looser settings (extend and override instead).
- See also: `Lint UI files for accessibility, Tailwind and tokens`

```ts
// tsconfig.json
{
  "extends": "@zedtech/zedkit-quality/tsconfig",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```
