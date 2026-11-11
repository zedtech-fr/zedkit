import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createSnapshotReviewPort } from "../features/reviews/adapters/snapshot.ts";
import { listReviewRedirectsFrom } from "../features/reviews/model/review-routes.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, "..", "out");

function redirectHtml(target) {
  const safe = target.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${safe}">
<link rel="canonical" href="${safe}">
<title>Redirect</title>
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body><p><a href="${safe}">Continue</a></p></body>
</html>
`;
}

export async function writeReviewRedirectStubs(outDir = outRoot, port = createSnapshotReviewPort()) {
  const redirects = await listReviewRedirectsFrom(port);
  for (const { from, to } of redirects) {
    const rel = `${from.replace(/^\//, "")}.html`;
    const file = join(outDir, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, redirectHtml(to), "utf8");
  }
  return redirects;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await writeReviewRedirectStubs();
}
