"use client";

/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone reading a recorded run; maintainer reproducing a look via share link.
 * UI decisions:
 * - Full-viewport kit AgentConsole — because: hurried visitor reads the same shell as the hosted live view without another origin.
 * - One compact run-title h1 above the console — because: the house bar requires a single visible heading, and the kit decision card is an h2.
 * - Finding, code, and transcript slots are hairline, unsheened, unshadowed page-fill surfaces — because: a hurried visitor on a phone reads the verdict on a foundations card, not a frosted Glass slab.
 * - No look-control strip on this page — because: watching a run is not customizing the site; ThemeScope still pins from a share URL and otherwise inherits `html` identity and `.dark`.
 * - Back links in the run chrome — because: dropping the marketing header must not strand the visitor.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AgentConsole,
  Button,
  Heading,
  Stack,
  type AgentConsoleDecision,
  type AgentConsoleItem,
  type AgentConsoleRun,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { issuePath, unlinkedPrPath } from "../model/review-routes";
import { ReviewConsoleAppearanceFrame } from "./review-console-appearance";
import "./review-console-surfaces.css";

function ReviewConsoleChrome({
  issueNumber,
  unlinkedPr,
  runId,
  status,
  copy,
}: {
  issueNumber?: number | null | undefined;
  unlinkedPr?: number | null | undefined;
  runId: string;
  status?: ReactNode | undefined;
  copy: ReviewsCopy;
}) {
  return (
    <Stack gap="sm" className="shrink-0 surface-pad-sm">
      <Heading level={1} typeRole="title">
        {copy.run.title}
      </Heading>
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        {issueNumber != null ? (
          <Button asChild variant="link" size="sm" className="min-h-target">
            <Link href={issuePath(issueNumber)}>{copy.run.backToIssue}</Link>
          </Button>
        ) : null}
        {issueNumber == null && unlinkedPr != null ? (
          <Button asChild variant="link" size="sm" className="min-h-target">
            <Link href={unlinkedPrPath(unlinkedPr)}>{copy.run.backToUnlinked}</Link>
          </Button>
        ) : null}
        <Button asChild variant="link" size="sm" className="min-h-target">
          <Link href="/issues">{copy.run.backToList}</Link>
        </Button>
      </Stack>
      <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
        <Heading level={1} typeRole="small">
          {copy.run.title} {runId}
        </Heading>
        {status}
      </Stack>
    </Stack>
  );
}

export function ReviewConsoleView({
  issueNumber,
  unlinkedPr,
  runId,
  run,
  items,
  decision,
  selectedId,
  onSelectedIdChange,
  status,
  copy,
}: {
  issueNumber?: number | null | undefined;
  unlinkedPr?: number | null | undefined;
  runId: string;
  run: AgentConsoleRun;
  items: readonly AgentConsoleItem[];
  decision: AgentConsoleDecision | null;
  selectedId?: string | undefined;
  onSelectedIdChange?: ((id: string) => void) | undefined;
  status?: ReactNode | undefined;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewConsoleAppearanceFrame>
      <ReviewConsoleChrome
        issueNumber={issueNumber}
        unlinkedPr={unlinkedPr}
        runId={runId}
        status={status}
        copy={copy}
      />
      <AgentConsole
        className="h-full pane-shrink content-shrink flex-1 overflow-hidden [&_[data-slot=app-shell-menu]_button]:min-h-floor"
        run={run}
        items={items}
        decision={decision}
        {...(selectedId === undefined ? {} : { selectedId })}
        {...(onSelectedIdChange === undefined ? {} : { onSelectedIdChange })}
      />
    </ReviewConsoleAppearanceFrame>
  );
}
