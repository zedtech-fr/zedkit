---
"@zedtech/zedkit-ai": patch
"@zedtech/zedkit-ui": patch
"@zedtech/zedkit-i18n": patch
"@zedtech/zedkit-payload-seo": patch
---

Adoption fixes from the November product audit, revalidated against dev.

AI kit lifecycle: installs record a manifest (`.agents/.zedkit-manifest.json`) so reruns update untouched files instead of sidecarring them; upgrades recognise untouched older-version skills and assets via extended legacy hashes (fixes the 1.0.0 setup-ai `design-policy.md` broken-link class); provider layer collisions materialise as renamed `zk-*` copies instead of same-named links and `validate` flags same-name claims per layer; observed `AGENTS.md` commands use the repo's lockfile runner (npm/yarn/bun/pnpm); `validate --setup` reports a recorded tool limitation (`inherit-reason`) as partial instead of failing; README no longer claims `init --adopt` equals `setup` and lists the full setup preset delta.

UI install: `peerDependencies` are ranges (`react`/`react-dom` `^19.0.0`, `tailwindcss` `^4.0.0`, `payload` `^3.93.0` for payload-seo, `react` `^19.0.0` for i18n) so `npm install` no longer ERESOLVEs on current scaffolds; `DataTable` takes an explicit `scrollAriaLabel`. The Next src-dir smoke now asserts painted styles and runs pnpm, npm and plain-layout cells.
