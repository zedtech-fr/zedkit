/**
 * Rewrites kit UI relative imports for a shadcn consumer app (`@/lib/utils`,
 * `@/components/ui/*`). Only used when generating registry payloads; library
 * sources stay unchanged.
 */
export function rewriteUiImports(source) {
  return source.replace(/from\s+["']\.\/([^"']+)\.js["']/g, (_, mod) => {
    if (mod === "utils") {
      return 'from "@/lib/utils"';
    }
    return `from "@/components/ui/${mod}"`;
  });
}
