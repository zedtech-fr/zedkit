import { err, ok, PermanentError, type Result } from "@zedtech/zedkit-core";
import { fetchJson, type FetchJsonOptions } from "@zedtech/zedkit-live";

import { GITHUB_REPO } from "../model/github-hrefs.ts";
import type {
  GithubCatalog,
  GithubIssue,
  GithubPullRequest,
  GithubReviewFallback,
} from "../model/merge-public-index.ts";
import type { ReviewVerdict } from "../ports/review-port";

export type GithubFetchOptions = {
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  retries?: number;
  timeoutMs?: number;
  token?: string;
};

export type {
  GithubCatalog,
  GithubIssue,
  GithubPullRequest,
  GithubReviewFallback,
} from "../model/merge-public-index.ts";

const PER_PAGE = 100;
const PAGE_CAP = 10;
const REVIEW_CAP = 40;
const CLOSING_REF = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
const CONFIDENCE = /\bConfidence:\s*(\d{1,2})\/10\b/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function githubRequest(options: GithubFetchOptions): FetchJsonOptions {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "zedkit-docs",
  };
  if (options.token !== undefined && options.token !== "") {
    headers.Authorization = `Bearer ${options.token}`;
  }
  return {
    headers,
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
    ...(options.retries === undefined ? {} : { retries: options.retries }),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
  };
}

function listUrl(resource: "issues" | "pulls", page: number): string {
  return `https://api.github.com/repos/${GITHUB_REPO}/${resource}?state=all&per_page=${PER_PAGE}&page=${page}`;
}

function reviewsUrl(prNumber: number): string {
  return `https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}/reviews`;
}

export function parseClosingIssueNumbers(body: string | null): number[] {
  if (body === null || body.trim() === "") return [];
  const found: number[] = [];
  const seen = new Set<number>();
  for (const match of body.matchAll(CLOSING_REF)) {
    const n = Number(match[1]);
    if (!Number.isSafeInteger(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    found.push(n);
  }
  return found;
}

function parseIssue(value: unknown): GithubIssue | null {
  if (!isRecord(value) || "pull_request" in value) return null;
  const { number, title, state } = value;
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number <= 0) return null;
  if (typeof title !== "string") return null;
  if (state !== "open" && state !== "closed") return null;
  return { number, title, state };
}

function parsePull(value: unknown): GithubPullRequest | null {
  if (!isRecord(value)) return null;
  const { number, body } = value;
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number <= 0) return null;
  if (body !== undefined && body !== null && typeof body !== "string") return null;
  return { number, closingIssueNumbers: parseClosingIssueNumbers(typeof body === "string" ? body : null) };
}

function mapReviewState(value: unknown): ReviewVerdict | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "APPROVED") return "approve";
  if (normalized === "CHANGES_REQUESTED") return "request-changes";
  if (normalized === "COMMENTED") return "comment";
  return null;
}

function parseConfidence(body: unknown): number | null {
  if (typeof body !== "string") return null;
  const match = CONFIDENCE.exec(body);
  if (match === null) return null;
  const n = Number(match[1]);
  if (!Number.isInteger(n) || n < 0 || n > 10) return null;
  return n;
}

export function parseGithubReviews(value: unknown): GithubReviewFallback | null {
  if (!Array.isArray(value)) return null;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    const row = value[i];
    if (!isRecord(row)) continue;
    const score = parseConfidence(row.body);
    if (score === null) continue;
    const verdict = mapReviewState(row.state);
    if (verdict === null) continue;
    return { prNumber: 0, verdict, score };
  }
  return { prNumber: 0, verdict: null, score: null };
}

async function fetchPages(
  resource: "issues" | "pulls",
  options: GithubFetchOptions,
): Promise<Result<unknown[], Error>> {
  const items: unknown[] = [];
  const request = githubRequest(options);
  for (let page = 1; page <= PAGE_CAP; page += 1) {
    const result = await fetchJson(listUrl(resource, page), request);
    if (!result.ok) return result;
    if (!Array.isArray(result.value)) {
      return err(new PermanentError("github: expected an array"));
    }
    items.push(...result.value);
    if (result.value.length < PER_PAGE) break;
  }
  return ok(items);
}

export async function fetchGithubCatalog(
  options: GithubFetchOptions = {},
): Promise<Result<GithubCatalog, Error>> {
  const issuesPage = await fetchPages("issues", options);
  if (!issuesPage.ok) return issuesPage;
  const pullsPage = await fetchPages("pulls", options);
  if (!pullsPage.ok) return pullsPage;
  return ok({
    issues: issuesPage.value.flatMap((row) => {
      const issue = parseIssue(row);
      return issue === null ? [] : [issue];
    }),
    pullRequests: pullsPage.value.flatMap((row) => {
      const pull = parsePull(row);
      return pull === null ? [] : [pull];
    }),
  });
}

export async function fetchGithubReviewFallbacks(
  prNumbers: readonly number[],
  options: GithubFetchOptions = {},
): Promise<Result<GithubReviewFallback[], Error>> {
  const request = githubRequest(options);
  const out: GithubReviewFallback[] = [];
  const capped = prNumbers.slice(0, REVIEW_CAP);
  for (const prNumber of capped) {
    const result = await fetchJson(reviewsUrl(prNumber), request);
    if (!result.ok) return result;
    const parsed = parseGithubReviews(result.value);
    if (parsed === null) return err(new PermanentError("github: expected a reviews array"));
    out.push({ ...parsed, prNumber });
  }
  return ok(out);
}
