import { readFileSync } from "node:fs";

import { tryCatch } from "@zedtech/zedkit-core";

import { isLiveSnapshot, parsePublicReviewSnapshot } from "../model/parse-snapshot.ts";
import { createComposedReviewPort } from "../model/port-from-index.ts";
import { liveRunsToIndex, toPublicIndex, toPublicReviews } from "../model/public-review.ts";
import { listIssueSitemapPathsFrom, listReviewSitemapPathsFrom } from "../model/review-routes.ts";
import type { PublicIssueIndex, PublicLiveRun, ReviewPort } from "../ports/review-port";
import defaultSnapshot from "./public-reviews.json" with { type: "json" };

function partsFromUnknown(value: unknown): { index: PublicIssueIndex; lives: PublicLiveRun[] } {
  const parsed = parsePublicReviewSnapshot(value);
  if (!parsed.ok) {
    throw new Error(`public review snapshot: ${parsed.error.message}`, { cause: parsed.error });
  }
  if (isLiveSnapshot(parsed.value)) {
    const lives = toPublicReviews(parsed.value);
    return { lives, index: liveRunsToIndex(lives) };
  }
  return { index: toPublicIndex(parsed.value), lives: [] };
}

function loadPublicParts(snapshotPath: string): { index: PublicIssueIndex; lives: PublicLiveRun[] } {
  const text = tryCatch(() => readFileSync(snapshotPath, "utf8"));
  if (!text.ok) {
    throw new Error("public review snapshot: cannot read file", { cause: text.error });
  }
  const json = tryCatch(() => JSON.parse(text.value) as unknown);
  if (!json.ok) {
    throw new Error("public review snapshot: invalid JSON", { cause: json.error });
  }
  return partsFromUnknown(json.value);
}

export function createSnapshotReviewPort(snapshotPath?: string): ReviewPort {
  // shortcut: Next 16 turbopack fileURLToPath rejects URL objects; keep the
  // JSON import until that bundler accepts a string path from import.meta.url.
  // Out-of-repo exporter overwrites this JSON before a staging docs build.
  const parts =
    snapshotPath === undefined ? partsFromUnknown(defaultSnapshot) : loadPublicParts(snapshotPath);
  return createComposedReviewPort(parts.index, parts.lives);
}

export function listIssueSitemapPaths(snapshotPath?: string): Promise<string[]> {
  return listIssueSitemapPathsFrom(createSnapshotReviewPort(snapshotPath));
}

export function listReviewSitemapPaths(snapshotPath?: string): Promise<string[]> {
  return listReviewSitemapPathsFrom(createSnapshotReviewPort(snapshotPath));
}
