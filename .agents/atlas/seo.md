# JSON-LD React script tag

Full Entry paths, traps, and Touches for the index rows that point here. The index in `.agents/atlas.md` stays a pointer; fix facts here and keep that row in sync.

## Where

| Topic | Entry | Why it lives there / trap | Touches | Checked |
| --- | --- | --- | --- | --- |
| JSON-LD React script tag | `packages/seo/src/react.tsx#JsonLd` | Main SEO entry has no React; import from `@zedtech/zedkit-seo/react`. Do not put `JsonLd` on `src/index.ts` (Node robots/sitemap consumers would load React). `data` is `object` (`JsonLdProps`) so callers pass builder output or a plain blob (FAQPage is load-bearing). After `JSON.stringify`, replace `<` with `\u003c` (Next.js JSON-LD) so a CMS `</script>` cannot break out. Automatic JSX runtime leaves `react`/`@types/react` unused for knip — keep `import type { JSX } from "react"` and return `JSX.Element` (`ReactElement` defaults props to unknown and breaks function-call tests; brand's `ReactElement` is fine because logo tests do not read `.props`). Gate `./react` via `scripts/check-api-report.sh` (`zedkit-seo-react.api.md` from `dist/react.d.ts`). | `@zedtech/zedkit-seo`; docs pages import the kit tag | 2026-11-13 |
