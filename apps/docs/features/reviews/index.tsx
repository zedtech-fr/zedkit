/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning a real review; maintainer reproducing a look via share link.
 * UI decisions:
 * - Verdict first, then actions, then details — because: hurried reader needs the outcome before evidence.
 * - List at the section root with a useful empty state — because: the visitor always has a next click.
 * - Quiet Appearance panel inside ThemeScope — because: identities serve reading; site chrome must not jump.
 * - Stacked rows, not a wide table — because: phone users at 320–390px compose by priority.
 * - Share link encodes appearance only — because: a visual issue must round-trip without token drafts.
 */

import { notFound } from "next/navigation";

import { createSnapshotReviewPort } from "./adapters/snapshot";
import { reviewsCopy } from "./i18n/reviews-copy";
import {
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
} from "./model/review-routes";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView } from "./ui/review-pr-view";
import { ReviewRunView } from "./ui/review-run-view";

const port = createSnapshotReviewPort();

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
  return listReviewPrParamsFrom(port);
}

export async function listReviewRunParams() {
  return listReviewRunParamsFrom(port);
}

export { reviewsCopy };
