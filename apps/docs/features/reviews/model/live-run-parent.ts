import { tryCatch } from "@zedtech/zedkit-core";

import { issuePath, unlinkedPrPath } from "./review-routes.ts";

export type LiveRunParent =
  | { kind: "issue"; number: number }
  | { kind: "unlinked-pr"; number: number }
  | { kind: "list" };

export type LiveRunParentFields = {
  readonly issue?: number | null;
  readonly pr?: number | null;
  readonly kind?: string | null;
  readonly pr_url?: string | null;
  readonly opened_pr_url?: string | null;
};

export type LiveRunParentPath = {
  readonly issueNumber?: number | null | undefined;
  readonly unlinkedPr?: number | null | undefined;
};

function githubLikeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) return null;
  return value;
}

function githubPathNumber(
  href: string | null | undefined,
  resource: "issues" | "pull",
): number | null {
  if (typeof href !== "string") return null;
  const trimmed = href.trim();
  if (trimmed === "") return null;
  const parsed = tryCatch(() => new URL(trimmed));
  if (!parsed.ok) return null;
  const protocol = parsed.value.protocol;
  if (protocol !== "http:" && protocol !== "https:") return null;
  const parts = parsed.value.pathname.split("/").filter((part) => part !== "");
  if (parts.length !== 4 || parts[2] !== resource) return null;
  const raw = parts[3];
  if (raw === undefined || !/^[1-9]\d{0,15}$/.test(raw)) return null;
  return githubLikeNumber(Number(raw));
}

function isPullUrl(href: string | null | undefined): boolean {
  return githubPathNumber(href, "pull") !== null;
}

function isTicketKind(kind: string | null | undefined): boolean {
  return typeof kind === "string" && kind.trim().toLowerCase() === "ticket";
}

function payloadParent(run: LiveRunParentFields): LiveRunParent {
  const issue = githubLikeNumber(run.issue);
  if (issue !== null) return { kind: "issue", number: issue };

  const issueFromUrl = githubPathNumber(run.pr_url, "issues");
  if (issueFromUrl !== null) return { kind: "issue", number: issueFromUrl };

  const pr = githubLikeNumber(run.pr);
  if (isTicketKind(run.kind)) {
    if (isPullUrl(run.pr_url) || isPullUrl(run.opened_pr_url)) return { kind: "list" };
    if (pr !== null) return { kind: "issue", number: pr };
    return { kind: "list" };
  }

  if (pr !== null) return { kind: "unlinked-pr", number: pr };
  return { kind: "list" };
}

export function liveRunParent(
  run: LiveRunParentFields,
  path: LiveRunParentPath = {},
): LiveRunParent {
  const payload = payloadParent(run);
  if (payload.kind === "issue") return payload;
  const pathIssue = githubLikeNumber(path.issueNumber);
  if (pathIssue !== null) return { kind: "issue", number: pathIssue };
  if (payload.kind === "unlinked-pr") return payload;
  const pathUnlinked = githubLikeNumber(path.unlinkedPr);
  if (pathUnlinked !== null) return { kind: "unlinked-pr", number: pathUnlinked };
  return { kind: "list" };
}

export function liveRunParentHref(
  run: LiveRunParentFields,
  path: LiveRunParentPath = {},
): string {
  const parent = liveRunParent(run, path);
  if (parent.kind === "issue") return issuePath(parent.number);
  if (parent.kind === "unlinked-pr") return unlinkedPrPath(parent.number);
  return "/issues";
}
