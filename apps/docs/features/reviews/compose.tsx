"use client";

import { subscribeLiveRun } from "./adapters/live-run-api";
import type { PublicLiveRun } from "./ports/review-port";
import {
  ReviewLiveConsole as ReviewLiveConsoleView,
  ReviewLiveConsoleFromSearch as ReviewLiveConsoleFromSearchView,
} from "./ui/review-live-console";

export function ReviewLiveConsole({
  runId,
  itemId,
  issueNumber,
  unlinkedPr,
  initial,
  runsBase,
}: {
  runId: string;
  itemId?: string | null | undefined;
  issueNumber?: number | null | undefined;
  unlinkedPr?: number | null | undefined;
  initial?: PublicLiveRun | null | undefined;
  runsBase?: string | undefined;
}) {
  return (
    <ReviewLiveConsoleView
      runId={runId}
      itemId={itemId}
      issueNumber={issueNumber}
      unlinkedPr={unlinkedPr}
      initial={initial}
      {...(runsBase === undefined ? {} : { runsBase })}
      subscribe={subscribeLiveRun}
    />
  );
}

export function ReviewLiveConsoleFromSearch({ runsBase }: { runsBase?: string | undefined }) {
  return (
    <ReviewLiveConsoleFromSearchView
      {...(runsBase === undefined ? {} : { runsBase })}
      subscribe={subscribeLiveRun}
    />
  );
}
