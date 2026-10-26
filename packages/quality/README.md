# @zedtech/zedkit-quality

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-quality.svg)](https://www.npmjs.com/package/@zedtech/zedkit-quality)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

Shared quality setup: UI lint preset, route/view/data layer boundaries,
and one strict TypeScript base. Consume it from any repo — do not copy
it. Original work by the same author.

## Install

```sh
pnpm add -D @zedtech/zedkit-quality
```

Peer dependencies (`eslint`, `eslint-plugin-jsx-a11y`,
`eslint-plugin-better-tailwindcss`) install alongside it.

## Usage

```js
// eslint.config.mjs
import { defineLayers, uiPreset } from "@zedtech/zedkit-quality";

export default [
  ...uiPreset({ entryPoint: "./app/globals.css" }),
  ...defineLayers({
    kitPackage: "@acme/ui",
    viewDirs: ["app/**/ui/**"],
    dataDirs: ["lib/**"],
    actionPatterns: ["@/lib/*", "**/actions", "**/actions/**"],
  }),
];
```

```jsonc
// tsconfig.json
{
  "extends": "@zedtech/zedkit-quality/tsconfig",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

## When to use

Reach for this package when several repos must enforce the same gates:
UI lint rules, layer boundaries, one strict `tsconfig` base. One import
per need, versioned updates everywhere. For AI agent setup (skills,
subagents, commands) see `@zedtech/zedkit-ai` instead.

## API

- `uiPreset({ entryPoint })` — flat-config blocks for `.tsx`/`.jsx`:
  jsx-a11y recommended, Tailwind hygiene, tokens-only classes, no `style`
  attributes, no raw `try`/`catch`. `entryPoint` (your Tailwind CSS
  entry) is required: it is the one thing that varies per repo.
- `defineLayers({ kitPackage, viewDirs, dataDirs, actionPatterns })` —
  `no-restricted-imports` blocks for routes -> views -> data: the UI kit
  is only imported from views, views never import data clients or
  actions, data files import no UI.
- `@zedtech/zedkit-quality/tsconfig` — the strict base (`strict`,
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noUnusedLocals`, and more). Extend it, do not copy it.

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

Install it: these configs must stay identical across repos, and a copy
drifts silently. Versioned updates propagate through normal bump PRs.

## Verify

```sh
pnpm --filter @zedtech/zedkit-quality typecheck && pnpm --filter @zedtech/zedkit-quality lint && pnpm --filter @zedtech/zedkit-quality build && pnpm --filter @zedtech/zedkit-quality test
```
