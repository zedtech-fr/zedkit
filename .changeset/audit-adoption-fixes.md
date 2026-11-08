---
"@zedtech/zedkit-ai": patch
"@zedtech/zedkit-ui": patch
"@zedtech/zedkit-i18n": patch
"@zedtech/zedkit-payload-seo": patch
---

Adoption fixes from the November product audit, revalidated against dev.

AI kit lifecycle: installs record a manifest (`.agents/.zedkit-manifest.json`) so reruns update untouched files instead of sidecarring them; upgrades recognise untouched older-version skills and assets via extended legacy hashes, including the rendered 1.0.0 install tree vendored as a test fixture (fixes the 1.0.0 setup-ai `design-policy.md` broken-link class); provider layer collisions materialise as renamed `zk-*` copies instead of same-named links and `validate` flags same-name claims per layer; an existing `zk-*` sidecar is only replaced when it is still a kit copy (current, recorded or legacy bytes), a project skill the kit does not ship never gains a sidecar, and no replacement ever deletes the kit's own sources through a symlinked layer; observed `AGENTS.md` commands use the repo's lockfile runner (npm/yarn/bun/pnpm); `validate --setup` reports a recorded tool limitation (`inherit-reason`) as a partial setup (failing state, never `ok`); README no longer claims `init --adopt` equals `setup` and lists the full setup preset delta.

UI install: `peerDependencies` declare tested floors (`react`/`react-dom` `^19.0.0`, `tailwindcss` `^4.0.0`, `payload` `^3.93.0` for payload-seo, `react` `^19.0.0` for i18n) so `npm install` no longer ERESOLVEs on current scaffolds, with the smoke cells as the compatibility proof; `DataTable` takes an explicit `scrollAriaLabel`. The Next src-dir smoke now asserts painted styles and runs pnpm, npm and plain-layout cells, builds the UI closure before packing (clean checkouts ship no `dist/`), installs Chromium on the Ubuntu path, and leaves snippets that already name both `@source` depths untouched.
