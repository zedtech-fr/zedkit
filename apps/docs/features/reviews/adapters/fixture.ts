import { parsePublicReviewSnapshot } from "../model/parse-snapshot.ts";
import { createPortFromIndex } from "../model/port-from-index.ts";
import { toPublicIndex } from "../model/public-review.ts";
import type { ReviewPort } from "../ports/review-port";

const FIXTURE_INDEX = {
  version: 1 as const,
  kind: "fixture",
  issues: [
    {
      number: 108,
      title: "Add a public issues section",
      state: "closed" as const,
      pullRequests: [133],
      lastRunAt: "2026-11-10T18:40:00.000Z",
      entries: [
        {
          id: "108-plan",
          runId: "run-108-impl",
          type: "plan" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T16:00:00.000Z",
          durationMs: 420000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: "https://example.test/live/run-108-impl",
        },
        {
          id: "108-implement",
          runId: "run-108-impl",
          type: "implement" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T16:10:00.000Z",
          durationMs: 2400000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: "https://example.test/live/run-108-impl",
        },
        {
          id: "108-review",
          runId: "run-108-review",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T17:20:00.000Z",
          durationMs: 900000,
          models: ["cursor-grok-4.6-high"],
          verdict: "approve" as const,
          liveUrl: "https://example.test/live/run-108-review",
        },
        {
          id: "108-improve",
          runId: "run-108-improve",
          type: "improve" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T18:40:00.000Z",
          durationMs: 780000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: "https://example.test/live/run-108-improve",
        },
      ],
    },
    {
      number: 93,
      title: "Failed implement with no opened pull request",
      state: "open" as const,
      pullRequests: [],
      lastRunAt: "2026-11-08T09:15:00.000Z",
      entries: [
        {
          id: "93-implement",
          runId: "run-93-impl",
          type: "implement" as const,
          status: "failed" as const,
          startedAt: "2026-11-08T09:15:00.000Z",
          durationMs: 300000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: null,
        },
      ],
    },
    {
      number: 110,
      title: "Running implement still in progress",
      state: "open" as const,
      pullRequests: [],
      lastRunAt: "2026-11-11T08:00:00.000Z",
      entries: [
        {
          id: "110-implement",
          runId: "run-110-impl",
          type: "implement" as const,
          status: "running" as const,
          startedAt: "2026-11-11T08:00:00.000Z",
          durationMs: null,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: "https://example.test/live/run-110-impl",
        },
      ],
    },
    {
      number: 99,
      title: "Private fixture that must never appear",
      state: "open" as const,
      pullRequests: [],
      lastRunAt: "2026-11-01T00:00:00.000Z",
      visibility: "private",
      entries: [
        {
          id: "99-review",
          runId: "run-99",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-01T00:00:00.000Z",
          durationMs: 1000,
          models: ["secret-model"],
          verdict: "comment" as const,
          liveUrl: "https://example.test/live/run-99",
        },
      ],
    },
  ],
  pullRequests: [
    {
      number: 133,
      issueNumber: 108,
      runIds: ["run-108-impl", "run-108-review", "run-108-improve"],
    },
    {
      number: 54,
      issueNumber: null,
      runIds: ["run-54-review"],
      entries: [
        {
          id: "54-review",
          runId: "run-54-review",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-07T14:00:00.000Z",
          durationMs: 480000,
          models: ["cursor-grok-4.6-high"],
          verdict: "comment" as const,
          liveUrl: "https://example.test/live/run-54-review",
        },
      ],
    },
    {
      number: 50,
      issueNumber: null,
      runIds: ["run-50"],
      visibility: "private",
      entries: [
        {
          id: "50-review",
          runId: "run-50",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-01T00:00:00.000Z",
          durationMs: 1000,
          models: [],
          verdict: "comment" as const,
          liveUrl: null,
        },
      ],
    },
  ],
};

export function createFixtureReviewPort(seed: unknown = FIXTURE_INDEX): ReviewPort {
  const parsed = parsePublicReviewSnapshot(seed);
  if (!parsed.ok) {
    throw new Error(`fixture issue index: ${parsed.error.message}`, { cause: parsed.error });
  }
  return createPortFromIndex(toPublicIndex(parsed.value));
}
