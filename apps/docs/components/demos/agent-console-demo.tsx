import { AgentConsole } from "@zedtech/zedkit-ui";

const STARTED_AT = Date.UTC(2026, 0, 15, 10, 0, 0);
const LAST_ACTIVITY_AT = STARTED_AT + 120_000;

/** Host-mapped run: sidebar of agents plus the selected transcript. */
export function AgentConsoleDemo() {
  return (
    <AgentConsole
      className="max-h-log"
      run={{
        pr: 12,
        sha: "abc1234",
        engineLabel: "kit-engine",
        durationMs: 377_000,
        reviewSize: "8 files",
        verdict: "approve",
        confidence: 9,
        postedReviewHref: "https://example.com/review/12",
      }}
      items={[
        {
          id: "main",
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
            { id: "msg-1", kind: "message", text: "The console mounts from mapped props." },
          ],
        },
      ]}
      decision={{
        verdict: "approve",
        confidence: 9,
        posted: true,
        postedReviewHref: "https://example.com/review/12",
        summary: "Ship the console as mapped props.",
        mustChange: [{ text: "Keep duration in milliseconds." }],
        notes: [],
        dismissed: [],
        firstPass: null,
        secondPass: null,
      }}
    />
  );
}
