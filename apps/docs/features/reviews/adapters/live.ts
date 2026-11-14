import { tryCatch } from "@zedtech/zedkit-core";

import {
  fetchGithubCatalog,
  fetchGithubReviewFallbacks,
  type GithubFetchOptions,
} from "./github.ts";
import { fetchRunsIndex, runsApiBaseEnvName } from "./runs-api.ts";
import {
  mergePublicIndex,
  PUBLIC_INDEX_KIND,
  type RunsApiRun,
} from "../model/merge-public-index.ts";
import { createComposedReviewPort } from "../model/port-from-index.ts";
import { toPublicIndex } from "../model/public-review.ts";
import { listIssueSitemapPathsFrom, listReviewSitemapPathsFrom } from "../model/review-routes.ts";
import type { PublicIssueIndex, ReviewPort } from "../ports/review-port";

export type CreatePublicReviewPortOptions = Omit<GithubFetchOptions, "token"> & {
  githubToken?: string;
  runsBase?: string;
};

function githubOptions(options: CreatePublicReviewPortOptions): GithubFetchOptions {
  return {
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
    ...(options.retries === undefined ? {} : { retries: options.retries }),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    ...(options.githubToken === undefined ? {} : { token: options.githubToken }),
  };
}

const EMPTY_INDEX: PublicIssueIndex = {
  version: 1,
  kind: PUBLIC_INDEX_KIND,
  issues: [],
  pullRequests: [],
};

function failed(): { index: PublicIssueIndex; loadError: boolean } {
  return { index: EMPTY_INDEX, loadError: true };
}

function parseRunsBase(value: string | undefined): { kind: "unset" } | { kind: "invalid" } | { kind: "url"; value: string } {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") return { kind: "unset" };
  const parsed = tryCatch(() => new URL(trimmed));
  if (!parsed.ok) return { kind: "invalid" };
  if (parsed.value.protocol !== "https:" && parsed.value.protocol !== "http:") return { kind: "invalid" };
  return { kind: "url", value: trimmed.replace(/\/$/, "") };
}

function prsNeedingFallback(runs: readonly RunsApiRun[]): number[] {
  const needed = new Set<number>();
  for (const run of runs) {
    if (run.pr === null) continue;
    if (run.verdict === null || run.score === null) needed.add(run.pr);
  }
  return [...needed];
}

export function readGithubToken(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  const preferred = env.ZEDKIT_GITHUB_READ_TOKEN?.trim() ?? "";
  if (preferred !== "") return preferred;
  const fallback = env.GITHUB_TOKEN?.trim() ?? "";
  return fallback === "" ? undefined : fallback;
}

async function loadPublicIndex(
  options: CreatePublicReviewPortOptions,
): Promise<{ index: PublicIssueIndex; loadError: boolean }> {
  const githubOpts = githubOptions(options);
  const github = await fetchGithubCatalog(githubOpts);
  if (!github.ok) return failed();
  const runsBase = parseRunsBase(options.runsBase);
  if (runsBase.kind === "invalid") return failed();
  let runs: RunsApiRun[] = [];
  if (runsBase.kind === "url") {
    const fetched = await fetchRunsIndex({ ...githubOpts, runsBase: runsBase.value });
    if (!fetched.ok) return failed();
    runs = fetched.value;
  }
  const needReviews = prsNeedingFallback(runs);
  const fallbacks =
    needReviews.length === 0
      ? { ok: true as const, value: [] }
      : await fetchGithubReviewFallbacks(needReviews, githubOpts);
  if (!fallbacks.ok) return failed();
  const merged = mergePublicIndex({
    github: github.value,
    runs,
    fallbacks: fallbacks.value,
  });
  const gated = tryCatch(() => toPublicIndex(merged));
  if (!gated.ok) return failed();
  return { index: gated.value, loadError: false };
}

export function createPublicReviewPort(options: CreatePublicReviewPortOptions = {}): ReviewPort {
  let inner: Promise<ReviewPort> | undefined;
  const load = () => {
    inner ??= loadPublicIndex(options).then((loaded) =>
      createComposedReviewPort(loaded.index, [], { loadError: loaded.loadError }),
    );
    return inner;
  };
  return {
    async listIssues() {
      return (await load()).listIssues();
    },
    async listUnlinkedPullRequests() {
      return (await load()).listUnlinkedPullRequests();
    },
    async listPullRequests() {
      return (await load()).listPullRequests();
    },
    async getIssue(n) {
      return (await load()).getIssue(n);
    },
    async getUnlinkedPullRequest(n) {
      return (await load()).getUnlinkedPullRequest(n);
    },
    async getRun(n, id) {
      return (await load()).getRun(n, id);
    },
    async getUnlinkedRun(n, id) {
      return (await load()).getUnlinkedRun(n, id);
    },
    async resolvePr(n) {
      return (await load()).resolvePr(n);
    },
    async list() {
      return (await load()).list();
    },
    async getByPr(n) {
      return (await load()).getByPr(n);
    },
    async hasLoadError() {
      return (await load()).hasLoadError();
    },
  };
}

export function createSiteReviewPort(): ReviewPort {
  const githubToken = readGithubToken();
  const runsBase = process.env[runsApiBaseEnvName()];
  return createPublicReviewPort({
    ...(githubToken === undefined ? {} : { githubToken }),
    ...(runsBase === undefined ? {} : { runsBase }),
  });
}

export function listIssueSitemapPaths(): Promise<string[]> {
  return listIssueSitemapPathsFrom(createSiteReviewPort());
}

export function listReviewSitemapPaths(): Promise<string[]> {
  return listReviewSitemapPathsFrom(createSiteReviewPort());
}
