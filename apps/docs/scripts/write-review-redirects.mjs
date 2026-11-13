import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createSiteReviewPort } from "../features/reviews/adapters/live.ts";
import {
  listIssueRunRedirectsFrom,
  listReviewRedirectsFrom,
} from "../features/reviews/model/review-routes.ts";
import { writeRedirectStub } from "./write-redirect-html.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, "..", "out");

export async function writeReviewRedirectStubs(outDir = outRoot, port = createSiteReviewPort()) {
  const redirects = [
    ...(await listReviewRedirectsFrom(port)),
    ...(await listIssueRunRedirectsFrom(port)),
  ];
  for (const { from, to } of redirects) {
    writeRedirectStub(outDir, from, to);
  }
  return redirects;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await writeReviewRedirectStubs();
}
