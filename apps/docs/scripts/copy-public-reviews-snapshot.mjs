import { readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { tryCatch } from "@zedtech/zedkit-core";

import { isLiveSnapshot, parsePublicReviewSnapshot } from "../features/reviews/model/parse-snapshot.ts";
import { assertPubliclySafe, toPublicIndex, toPublicReviews } from "../features/reviews/model/public-review.ts";

function readSource(sourcePath) {
  const text = tryCatch(() => readFileSync(sourcePath, "utf8"));
  if (!text.ok) {
    throw new Error("public review snapshot: cannot read file", { cause: text.error });
  }
  const json = tryCatch(() => JSON.parse(text.value));
  if (!json.ok) {
    throw new Error("public review snapshot: invalid JSON", { cause: json.error });
  }
  return json.value;
}

function gatedPayload(value) {
  const parsed = parsePublicReviewSnapshot(value);
  if (!parsed.ok) {
    throw new Error(`public review snapshot: ${parsed.error.message}`, { cause: parsed.error });
  }
  if (isLiveSnapshot(parsed.value)) {
    const payload = {
      version: 1,
      kind: "public-live-runs",
      reviews: toPublicReviews(parsed.value),
    };
    assertPubliclySafe(payload);
    return payload;
  }
  return toPublicIndex(parsed.value);
}

function writeDest(destPath, payload) {
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  const tmpPath = `${destPath}.tmp`;
  const written = tryCatch(() => {
    writeFileSync(tmpPath, text);
    renameSync(tmpPath, destPath);
  });
  if (!written.ok) {
    throw new Error("public review snapshot: cannot write file", { cause: written.error });
  }
}

/** Parse and public-gate a snapshot, then write dest only when the gated payload is safe. */
export function copyPublicReviewsSnapshot(sourcePath, destPath) {
  const payload = gatedPayload(readSource(sourcePath));
  writeDest(destPath, payload);
}

const invokedPath = process.argv[1] ? tryCatch(() => realpathSync(resolve(process.argv[1]))) : { ok: false };
const selfPath = tryCatch(() => realpathSync(fileURLToPath(import.meta.url)));
const invoked = invokedPath.ok && selfPath.ok && invokedPath.value === selfPath.value;
if (invoked) {
  const sourcePath = process.argv[2];
  const destPath = process.argv[3];
  if (!sourcePath || !destPath) {
    console.error("usage: copy-public-reviews-snapshot.mjs <source> <dest>");
    process.exit(1);
  }
  const copied = tryCatch(() => copyPublicReviewsSnapshot(sourcePath, destPath));
  if (!copied.ok) {
    console.error(copied.error.message);
    process.exit(1);
  }
}
