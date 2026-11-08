/**
 * Rewrites kit UI relative imports for a shadcn consumer app (`@/lib/utils`,
 * `@/components/ui/*`). Only used when generating registry payloads; library
 * sources stay unchanged. Nested relatives map by basename. Pass `knownBasenames`
 * (import stems) so a missing sibling fails instead of inventing a path.
 */
const RELATIVE_FROM = /from\s+["'](?:\.\.?\/)+([^"']+)\.js["']/g;

export function rewriteUiImports(source, knownBasenames) {
  const mapped = source
    .replace(/from\s+["']@zedtech\/zedkit-i18n\/react["']/g, 'from "@/components/ui/create-messages-context"')
    .replace(/from\s+["']@zedtech\/zedkit-i18n["']/g, 'from "@/components/ui/format-message"');
  return mapped.replace(RELATIVE_FROM, (full, mod) => {
    const base = mod.split("/").at(-1);
    if (!base) {
      throw new Error(`registry import missing mapping: ${full}`);
    }
    if (knownBasenames && base !== "utils" && !knownBasenames.has(base)) {
      throw new Error(`registry import missing mapping: ${base}`);
    }
    if (base === "utils") {
      return 'from "@/lib/utils"';
    }
    return `from "@/components/ui/${base}"`;
  });
}
