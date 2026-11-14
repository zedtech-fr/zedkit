import type { LiveRunApiResult } from "../ports/live-run-port.ts";
import type { PublicLiveRun } from "../ports/review-port.ts";
import { isLiveRunActive, toAgentConsole, type MappedAgentConsole } from "./to-agent-console.ts";

export { isLiveRunActive };

export const LIVE_RUN_POLL_MS = 2_000;
export const LIVE_RUN_HIDDEN_POLL_MS = 6_000;

export type LiveConsoleStatus =
  | { kind: "loading" }
  | { kind: "ready"; live: PublicLiveRun; mapped: MappedAgentConsole; fetchedAt: number }
  | { kind: "unauthorized" }
  | { kind: "not-found" }
  | { kind: "invalid" }
  | { kind: "error" };

export function liveRunPollIntervalMs(hidden: boolean): number {
  return hidden ? LIVE_RUN_HIDDEN_POLL_MS : LIVE_RUN_POLL_MS;
}

export function isUnchangedLiveRunResult(_previous: LiveRunApiResult, next: LiveRunApiResult): boolean {
  return next.kind === "not-modified";
}

export function readyFromLive(live: PublicLiveRun): Extract<LiveConsoleStatus, { kind: "ready" }> {
  return {
    kind: "ready",
    live,
    mapped: toAgentConsole(live),
    fetchedAt: live.run.server_now * 1000,
  };
}

export function applyLiveRunResult(
  result: LiveRunApiResult,
  previous: LiveConsoleStatus,
): LiveConsoleStatus {
  if (result.kind === "ok") return readyFromLive(result.live);
  if (result.kind === "not-modified") return previous;
  if (result.kind === "unauthorized") return { kind: "unauthorized" };
  if (result.kind === "not-found") return previous.kind === "ready" ? previous : { kind: "not-found" };
  if (result.kind === "invalid") return previous.kind === "ready" ? previous : { kind: "invalid" };
  if (result.kind === "error") return previous.kind === "ready" ? previous : { kind: "error" };
  return previous;
}
