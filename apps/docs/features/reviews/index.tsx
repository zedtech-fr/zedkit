/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning a real review; maintainer reproducing a look via share link.
 * UI decisions:
 * - Final adjudicated decision first (verdict, confidence, short summary) — because: hurried reader needs the outcome before evidence.
 * - Must change only when remaining blockers exist; APPROVE has no such heading — because: an approval must not look like leftover work.
 * - First pass folded and labelled outdated, with kept / downgraded / dismissed on each finding — because: a superseded pass is history, not the decision.
 * - Notes, evidence, run history after that; lenses / second pass / transcripts on demand — because: the first screen is the decision, not the transcript.
 * - Shared main flow on PR and run pages — because: opening a run must not strand the same hurried reader.
 * - Appearance panel stays preview chrome inside ThemeScope — because: identities serve reading; site chrome must not jump.
 * - List at the section root with a useful empty state — because: the visitor always has a next click.
 * - Stacked rows, not a wide table — because: phone users at 320–390px compose by priority.
 * - Share link encodes appearance only — because: a visual issue must round-trip without token drafts.
 */

import { notFound } from "next/navigation";

import { createFixtureReviewPort } from "./adapters/fixture";
import { reviewsCopy } from "./i18n/reviews-copy";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView } from "./ui/review-pr-view";
import { ReviewRunView } from "./ui/review-run-view";

const port = createFixtureReviewPort();

function parsePrNumber(value: string): number | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

export async function ReviewListFeature() {
  const records = await port.list();
  return <ReviewListView records={records} copy={reviewsCopy} />;
}

export async function ReviewPrFeature({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const record = number === null ? null : await port.getByPr(number);
  if (record === null) notFound();
  return <ReviewPrView record={record} copy={reviewsCopy} />;
}

export async function ReviewRunFeature({ n, id }: { n: string; id: string }) {
  const number = parsePrNumber(n);
  const record = number === null ? null : await port.getByPr(number);
  const run = number === null ? null : await port.getRun(number, id);
  if (record === null || run === null) notFound();
  return <ReviewRunView record={record} run={run} copy={reviewsCopy} />;
}

export async function listReviewPrParams() {
  const records = await port.list();
  return records.map((record) => ({ n: String(record.number) }));
}

export async function listReviewRunParams() {
  const records = await port.list();
  return records.flatMap((record) =>
    record.runs.map((run) => ({ n: String(record.number), id: run.id })),
  );
}

export { reviewsCopy };
