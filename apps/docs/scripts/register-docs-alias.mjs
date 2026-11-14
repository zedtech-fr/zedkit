import { register } from "node:module";

const docsRootHref = new URL("../", import.meta.url).href;

/** `node --test` does not read tsconfig `@/` paths. Call before importing those modules. */
export function registerDocsAlias(parentURL) {
  register(
    `data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
      const rel = specifier.slice(2);
      const withExt = /\\.(?:ts|tsx|mjs|js)$/.test(rel) ? rel : rel + ".ts";
      return nextResolve(new URL(withExt, ${JSON.stringify(docsRootHref)}).href, context);
    }
  `)}`,
    parentURL,
  );
}
