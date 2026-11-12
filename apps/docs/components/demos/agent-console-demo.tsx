"use client";

import { useEffect, useRef, useState } from "react";
import {
  AgentConsole,
  cn,
  type AgentConsoleDecision,
  type AgentConsoleItem,
  type AgentConsoleRun,
} from "@zedtech/zedkit-ui";
import { usePreviewMobile } from "@/components/preview-viewport";

const STARTED_AT = Date.UTC(2026, 0, 15, 10, 0, 0);
const LAST_ACTIVITY_AT = STARTED_AT + 120_000;
const MOCK_TICK_CAP = 6;
const MOCK_TICK_MS = 1_200;
const MAIN_ID = "main";

const RUN: AgentConsoleRun = {
  pr: 12,
  sha: "abc1234",
  engineLabel: "kit-engine",
  durationMs: 377_000,
  reviewSize: "8 files",
  verdict: "approve",
  confidence: 9,
  postedReviewHref: "https://example.com/review/12",
};

const DECISION: AgentConsoleDecision = {
  verdict: "approve",
  confidence: 9,
  posted: true,
  postedReviewHref: "https://example.com/review/12",
  summary: "Ship the console as mapped props.",
  mustChange: [{ text: "Keep duration in milliseconds." }],
  notes: [{ text: "Tone down the export warning.", tag: "downgraded" }],
  dismissed: ["Old lint warning"],
  firstPass: {
    verdict: "request changes",
    confidence: 6,
    findings: [
      { id: "keep-1", text: "Name the empty pane.", disposition: "kept" },
      { id: "down-1", text: "Tone down the export warning.", disposition: "downgraded" },
      { id: "drop-1", text: "Drop the style nit.", disposition: "dismissed" },
    ],
  },
  secondPass: { model: "docs-reviewer", blocksMerge: false, summary: "No merge block." },
};

const ITEMS: AgentConsoleItem[] = [
  {
    id: MAIN_ID,
    name: "Coordinator",
    kind: "main",
    status: "done",
    model: "docs",
    durationMs: 120_000,
    toolCount: 2,
    startedAt: STARTED_AT,
    lastActivityAt: LAST_ACTIVITY_AT,
    tokensIn: 12,
    tokensOut: 4,
    running: false,
    entries: [
      { id: "tool-a", kind: "tool", name: "searchDocs", body: "query: console" },
      { id: "tool-b", kind: "tool", name: "readFile", body: "path: catalog.md" },
      { id: "think-1", kind: "reasoning", text: "Checking the export map." },
      { id: "msg-1", kind: "message", text: "The console mounts from mapped props." },
      { id: "msg-2", kind: "message", text: "Duration fields stay in milliseconds." },
      { id: "msg-3", kind: "message", text: "Confidence is already a score out of ten." },
      { id: "msg-4", kind: "message", text: "The host maps the run; this module does not fetch." },
      { id: "msg-5", kind: "message", text: "Selecting a row opens the item detail." },
      { id: "msg-6", kind: "message", text: "Jump to latest appears after you scroll the log." },
    ],
  },
  {
    id: "lens",
    name: "Docs agent",
    kind: "lens",
    status: "running",
    model: "docs",
    durationMs: 64_000,
    toolCount: 1,
    startedAt: STARTED_AT,
    lastActivityAt: LAST_ACTIVITY_AT,
    tokensIn: 6,
    tokensOut: 2,
    running: true,
    streamLabel: "Writing the note",
    entries: [
      { id: "lens-tool", kind: "tool", name: "readFile", body: "path: catalog.md" },
      { id: "lens-msg", kind: "message", text: "Reading the catalog." },
    ],
  },
  {
    id: "second",
    name: "Merge check",
    kind: "second_pass",
    status: "done",
    model: "docs-reviewer",
    durationMs: 48_000,
    toolCount: 0,
    startedAt: STARTED_AT,
    lastActivityAt: LAST_ACTIVITY_AT,
    tokensIn: 3,
    tokensOut: 1,
    running: false,
    entries: [{ id: "second-msg", kind: "message", text: "Second pass does not block merge." }],
  },
];

/**
 * Dense sidebar and decision-first on main because a hurried operator needs
 * the verdict before the transcript. Preview Mobile shows the labelled Agents
 * drawer because a phone has no aside. Capped mock transcript ticks because
 * the recipe must show live updates with no network.
 */
export function AgentConsoleDemo() {
  const mobile = usePreviewMobile();
  const selectedIdRef = useRef(MAIN_ID);
  const [items, setItems] = useState(ITEMS);

  useEffect(() => {
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      if (n > MOCK_TICK_CAP) {
        window.clearInterval(timer);
        return;
      }
      const targetId = selectedIdRef.current;
      setItems((current) =>
        current.map((item) =>
          item.id === targetId
            ? {
                ...item,
                lastActivityAt: LAST_ACTIVITY_AT + n * 5_000,
                entries: [
                  ...item.entries,
                  { id: `tick-${n}`, kind: "message" as const, text: `A later line landed (${n}).` },
                ],
              }
            : item,
        ),
      );
    }, MOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <AgentConsole
      className={cn(
        "max-h-log",
        mobile && "[&_[data-slot=app-shell-menu]]:flex [&_[data-slot=app-shell]>aside]:hidden",
      )}
      run={RUN}
      items={items}
      decision={DECISION}
      onSelectedIdChange={(id) => {
        selectedIdRef.current = id;
      }}
    />
  );
}
