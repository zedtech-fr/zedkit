import type { PublicLiveRun } from "./review-port.ts";

export type LiveRunApiResult =
  | { kind: "ok"; version: string | null; live: PublicLiveRun }
  | { kind: "not-modified"; version: string | null }
  | { kind: "unauthorized" }
  | { kind: "not-found" }
  | { kind: "invalid"; error: Error }
  | { kind: "error"; error: Error; retryable: boolean }
  | { kind: "aborted" };

export type LiveRunSubscribe = (options: {
  runId: string;
  itemId?: string | null | undefined;
  intervalMs: number;
  base?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
  onResult: (result: LiveRunApiResult) => void;
}) => () => void;
