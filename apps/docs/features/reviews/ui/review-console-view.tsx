"use client";

/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone reading a recorded run; maintainer reproducing a look via share link.
 * UI decisions:
 * - Full-viewport kit AgentConsole — because: hurried visitor reads the same shell as the hosted live view without another origin.
 * - Finding, code, and transcript slots are hairline, unsheened, unshadowed page-fill surfaces — because: a hurried visitor on a phone reads the verdict on a foundations card, not a frosted Glass slab.
 * - Appearance strip above the console, not in the decision card — because: maintainer paints identity without mixing controls into the verdict.
 * - Back links in that chrome — because: dropping the marketing header must not strand the visitor.
 */

import Link from "next/link";
import {
  AgentConsole,
  Button,
  Stack,
  type AgentConsoleDecision,
  type AgentConsoleItem,
  type AgentConsoleRun,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { issuePath } from "../model/review-routes";
import { ReviewConsoleAppearanceFrame } from "./review-console-appearance";
import "./review-console-surfaces.css";

export function ReviewConsoleView({
  issueNumber,
  run,
  items,
  decision,
  copy,
}: {
  issueNumber: number;
  run: AgentConsoleRun;
  items: readonly AgentConsoleItem[];
  decision: AgentConsoleDecision | null;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewConsoleAppearanceFrame>
      {(panel) => (
        <>
          <Stack gap="sm" className="shrink-0 surface-pad-sm">
            <Stack direction="horizontal" gap="sm" className="flex-wrap">
              <Button asChild variant="link" size="sm" className="min-h-target">
                <Link href={issuePath(issueNumber)}>{copy.run.backToIssue}</Link>
              </Button>
              <Button asChild variant="link" size="sm" className="min-h-target">
                <Link href="/issues">{copy.run.backToList}</Link>
              </Button>
            </Stack>
            {panel}
          </Stack>
          <AgentConsole className="h-full flex-1 overflow-hidden" run={run} items={items} decision={decision} />
        </>
      )}
    </ReviewConsoleAppearanceFrame>
  );
}
