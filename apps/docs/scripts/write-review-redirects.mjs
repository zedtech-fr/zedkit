import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createSnapshotReviewPort } from "../features/reviews/adapters/snapshot.ts";
import { listReviewRedirectsFrom } from "../features/reviews/model/review-routes.ts";
import { writeRedirectStub } from "./write-redirect-html.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, "..", "out");

export async function writeReviewRedirectStubs(outDir = outRoot, port = createSnapshotReviewPort()) {
  const redirects = await listReviewRedirectsFrom(port);
  for (const { from, to } of redirects) {
    writeRedirectStub(outDir, from, to);
  }
  return redirects;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await writeReviewRedirectStubs();
}
