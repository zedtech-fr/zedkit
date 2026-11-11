import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DOCS_OMITTED_REDIRECTS } from "./docs-omitted-needs.mjs";
import { writeRedirectStub } from "./write-redirect-html.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, "..", "out");

export function writeDocsOmittedRedirectStubs(outDir = outRoot) {
  for (const [pathname, target] of Object.entries(DOCS_OMITTED_REDIRECTS)) {
    writeRedirectStub(outDir, pathname, target);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeDocsOmittedRedirectStubs();
}
