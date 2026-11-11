import { readFileSync } from "node:fs";

import { tryCatch } from "@zedtech/zedkit-core";

import { parsePublicReviewSnapshot } from "../model/parse-snapshot.ts";
import { toPublicReviews } from "../model/public-review.ts";
import { listReviewSitemapPathsFrom } from "../model/review-routes.ts";
import type { PublicLiveRun, ReviewPort } from "../ports/review-port";
import defaultSnapshot from "./public-reviews.json" with { type: "json" };

function copyRecord(record: PublicLiveRun): PublicLiveRun {
  return structuredClone(record);
}

function recordsFromUnknown(value: unknown): PublicLiveRun[] {
  const parsed = parsePublicReviewSnapshot(value);
  if (!parsed.ok) {
    throw new Error(`public review snapshot: ${parsed.error.message}`, { cause: parsed.error });
  }
  return toPublicReviews(parsed.value);
}

function loadPublicReviews(snapshotPath: string): PublicLiveRun[] {
  const text = tryCatch(() => readFileSync(snapshotPath, "utf8"));
  if (!text.ok) {
    throw new Error("public review snapshot: cannot read file", { cause: text.error });
  }
  const json = tryCatch(() => JSON.parse(text.value) as unknown);
  if (!json.ok) {
    throw new Error("public review snapshot: invalid JSON", { cause: json.error });
  }
  return recordsFromUnknown(json.value);
}

function latestForPr(records: readonly PublicLiveRun[], n: number): PublicLiveRun | undefined {
  let latest: PublicLiveRun | undefined;
  for (const record of records) {
    if (record.run.pr !== n) continue;
    if (latest === undefined || record.run.created_at > latest.run.created_at) latest = record;
  }
  return latest;
}

export function createSnapshotReviewPort(snapshotPath?: string): ReviewPort {
  // shortcut: Next 16 turbopack fileURLToPath rejects URL objects; keep the
  // JSON import until that bundler accepts a string path from import.meta.url.
  const records =
    snapshotPath === undefined ? recordsFromUnknown(defaultSnapshot) : loadPublicReviews(snapshotPath);
  return {
    list() {
      return Promise.resolve(records.map(copyRecord));
    },
    getByPr(n: number) {
      const record = Number.isInteger(n) ? latestForPr(records, n) : undefined;
      return Promise.resolve(record === undefined ? null : copyRecord(record));
    },
    getRun(n: number, id: string) {
      const record = Number.isInteger(n)
        ? records.find((item) => item.run.pr === n && item.run.run_id === id)
        : undefined;
      return Promise.resolve(record === undefined ? null : copyRecord(record));
    },
  };
}

export function listReviewSitemapPaths(snapshotPath?: string): Promise<string[]> {
  return listReviewSitemapPathsFrom(createSnapshotReviewPort(snapshotPath));
}
