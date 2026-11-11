/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning a real review; maintainer reproducing a look via share link.
 * UI decisions:
 * - Final adjudicated decision first (verdict, confidence, short summary) — because: hurried reader needs the outcome before evidence.
 * - Must change only when remaining blockers exist; no blockers, no heading — because: leftover-work chrome must not appear when nothing remains to change.
 * - Reconciled findings after must-change, each with kept / downgraded / dismissed — because: the hurried reader must see what adjudication did, not only leftover blockers or an outdated first pass.
 * - First pass folded and labelled outdated, with kept / downgraded / dismissed on each finding — because: a superseded pass is history, not the decision.
 * - Notes, evidence, run history after that; lenses / second pass / transcripts on demand — because: the first screen is the decision, not the transcript.
 * - Agent-detail disclosure lists the current run’s agents (id, name, kind, status, model when present) — because: the disclosure is who ran; lenses stay on-demand in the console pane.
 * - Run page shows that list as a visible section — because: opening a run is to see that run’s agents without unfolding PR leftover chrome.
 * - Shared main flow on PR and run pages — because: opening a run must not strand the same hurried reader.
 * - Side panel plus selected pane on desktop — because: customer = hurried visitor scanning the run while reading one item.
 * - Main flow selected by default — because: first screen is the outcome, not an empty pane.
 * - Kit Drawer with a labelled 44px trigger below md — because: phone users must reach the list; the column must not stay hidden.
 * - Selection in the URL hash, Appearance in the query — because: a maintainer must copy a look and an item without breaking either share.
 * - Appearance panel after the main flow, still ThemeScope chrome — because: decision-to-blockers reading order comes first.
 * - Button rows, not a local nav primitive — because: generic console rows belong in the kit, not this feature.
 * - List at the section root with a useful empty state — because: the visitor always has a next click.
 * - Stacked rows, not a wide table — because: phone users at 320–390px compose by priority.
 * - Quiet Appearance panel inside ThemeScope — because: identities serve reading; site chrome must not jump.
 */

import { notFound } from "next/navigation";

import { createSnapshotReviewPort } from "./adapters/snapshot";
import { reviewsCopy } from "./i18n/reviews-copy";
import { parsePrNumber } from "./model/pr-number";
import {
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
} from "./model/review-routes";
import { toReviewRecord } from "./model/to-review-record";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView } from "./ui/review-pr-view";
import { ReviewRunView } from "./ui/review-run-view";

const port = createSnapshotReviewPort();

export async function ReviewListFeature() {
  const lives = await port.list();
  const records = lives.map((row) => toReviewRecord(row, lives));
  return <ReviewListView records={records} copy={reviewsCopy} />;
}

export async function ReviewPrFeature({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const live = number === null ? null : await port.getByPr(number);
  if (live === null) notFound();
  const lives = await port.list();
  return <ReviewPrView record={toReviewRecord(live, lives)} copy={reviewsCopy} />;
}

export async function ReviewRunFeature({ n, id }: { n: string; id: string }) {
  const number = parsePrNumber(n);
  const live = number === null ? null : await port.getRun(number, id);
  if (live === null) notFound();
  const lives = await port.list();
  const record = toReviewRecord(live, lives);
  const run = record.runs.find((item) => item.id === id);
  if (run === undefined) notFound();
  return <ReviewRunView record={record} run={run} copy={reviewsCopy} />;
}

export async function listReviewPrParams() {
  return listReviewPrParamsFrom(port);
}

export async function listReviewRunParams() {
  return listReviewRunParamsFrom(port);
}

export { parsePrNumber, reviewsCopy };
