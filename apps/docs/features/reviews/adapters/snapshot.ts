import { readFileSync } from "node:fs";

import { tryCatch } from "@zedtech/zedkit-core";

import { parsePublicReviewSnapshot } from "../model/parse-snapshot.ts";
import { createPortFromIndex } from "../model/port-from-index.ts";
import { toPublicIndex } from "../model/public-review.ts";
import { listIssueSitemapPathsFrom } from "../model/review-routes.ts";
import type { PublicIssueIndex, ReviewPort } from "../ports/review-port";
import defaultSnapshot from "./public-reviews.json" with { type: "json" };

function indexFromUnknown(value: unknown): PublicIssueIndex {
  const parsed = parsePublicReviewSnapshot(value);
  if (!parsed.ok) {
    throw new Error(`public issue index: ${parsed.error.message}`, { cause: parsed.error });
  }
  return toPublicIndex(parsed.value);
}

function loadPublicIndex(snapshotPath: string): PublicIssueIndex {
  const text = tryCatch(() => readFileSync(snapshotPath, "utf8"));
  if (!text.ok) {
    throw new Error("public issue index: cannot read file", { cause: text.error });
  }
  const json = tryCatch(() => JSON.parse(text.value) as unknown);
  if (!json.ok) {
    throw new Error("public issue index: invalid JSON", { cause: json.error });
  }
  return indexFromUnknown(json.value);
}

export function createSnapshotReviewPort(snapshotPath?: string): ReviewPort {
  // shortcut: Next 16 turbopack fileURLToPath rejects URL objects; keep the
  // JSON import until that bundler accepts a string path from import.meta.url.
  // Out-of-repo exporter overwrites this JSON before a staging docs build.
  const index =
    snapshotPath === undefined ? indexFromUnknown(defaultSnapshot) : loadPublicIndex(snapshotPath);
  return createPortFromIndex(index);
}

export function listIssueSitemapPaths(snapshotPath?: string): Promise<string[]> {
  return listIssueSitemapPathsFrom(createSnapshotReviewPort(snapshotPath));
}
