/**
 * Rewrites kit UI relative imports for a shadcn consumer app (`@/lib/utils`,
 * `@/components/ui/*`). Only used when generating registry payloads; library
 * sources stay unchanged.
 */
export function rewriteUiImports(source) {
  const mapped = source
    .replace(/from\s+["']@zedtech\/zedkit-i18n\/react["']/g, 'from "@/components/ui/create-messages-context"')
    .replace(/from\s+["']@zedtech\/zedkit-i18n["']/g, 'from "@/components/ui/format-message"');
  return mapped.replace(/from\s+["']\.\/([^"']+)\.js["']/g, (_, mod) => {
    if (mod === "utils") {
      return 'from "@/lib/utils"';
    }
    return `from "@/components/ui/${mod}"`;
  });
}
