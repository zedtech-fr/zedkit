import { readFileSync } from "node:fs";

import { tryCatch } from "@zedtech/zedkit-core";

import { parsePublicReviewSnapshot } from "../model/parse-snapshot.ts";
import { toPublicReviews } from "../model/public-review.ts";
import { listReviewSitemapPathsFrom } from "../model/review-routes.ts";
import type { ReviewPort, ReviewRecord, ReviewRun } from "../ports/review-port";
import defaultSnapshot from "./public-reviews.json" with { type: "json" };

function copyRecord(record: ReviewRecord): ReviewRecord {
  return structuredClone(record);
}

function recordsFromUnknown(value: unknown): ReviewRecord[] {
  const parsed = parsePublicReviewSnapshot(value);
  if (!parsed.ok) {
    throw new Error(`public review snapshot: ${parsed.error.message}`, { cause: parsed.error });
  }
  return toPublicReviews(parsed.value);
}

function loadPublicReviews(snapshotPath: string): ReviewRecord[] {
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
      const record = Number.isInteger(n) ? records.find((item) => item.number === n) : undefined;
      return Promise.resolve(record === undefined ? null : copyRecord(record));
    },
    getRun(n: number, id: string) {
      const record = Number.isInteger(n) ? records.find((item) => item.number === n) : undefined;
      const run = record?.runs.find((item) => item.id === id);
      return Promise.resolve(run === undefined ? null : (structuredClone(run) as ReviewRun));
    },
  };
}

export function listReviewSitemapPaths(snapshotPath?: string): Promise<string[]> {
  return listReviewSitemapPathsFrom(createSnapshotReviewPort(snapshotPath));
}
