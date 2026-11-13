"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  EmptyState,
  Heading,
  PageHeader,
  SidebarNavGroup,
  SidebarNavItem,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { issueFullTitle } from "../model/github-hrefs";
import { resolveIssueOpenId, shouldScrollSelectedIssue } from "../model/issue-open-target";
import { headlineOutcome, latestEntry } from "../model/latest-status";
import { uniqueRunIds } from "../model/review-routes";
import type { IssueRecord, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { OutcomeStatus, outcomeLabel } from "./issue-status";
import { IssueDetail, UnlinkedDetail } from "./review-issue-detail";
import "./review-list.css";

function runCountLabel(count: number, copy: ReviewsCopy): string {
  return `${count} ${count === 1 ? copy.list.run : copy.list.runs}`;
}

type IssueItem = { kind: "issue"; id: string; issue: IssueRecord };
type UnlinkedItem = { kind: "pr"; id: string; pull: UnlinkedPullRequest };
type ListItem = IssueItem | UnlinkedItem;

function listItems(
  issues: readonly IssueRecord[],
  unlinked: readonly UnlinkedPullRequest[],
): ListItem[] {
  return [
    ...issues.map((issue) => ({ kind: "issue" as const, id: `issue-${issue.number}`, issue })),
    ...unlinked.map((pull) => ({ kind: "pr" as const, id: `pr-${pull.number}`, pull })),
  ];
}

function IssueListRow({
  issue, active, copy, withIds,
}: {
  issue: IssueRecord; active: boolean; copy: ReviewsCopy; withIds: boolean;
}) {
  const outcome = headlineOutcome(issue.entries);
  const label = outcomeLabel(outcome, copy) ?? copy.state[issue.state];
  return (
    <SidebarNavItem asChild active={active} status={<OutcomeStatus outcome={outcome} />} count={label}>
      <a
        href={`#issue-${issue.number}`}
        {...(withIds ? { id: `issue-${issue.number}` } : {})}
        data-issues-row=""
        aria-label={`${issueFullTitle(issue)}, ${label}`}
      >
        {issueFullTitle(issue)}
      </a>
    </SidebarNavItem>
  );
}

function UnlinkedListRow({
  entry, active, copy, withIds,
}: {
  entry: UnlinkedPullRequest; active: boolean; copy: ReviewsCopy; withIds: boolean;
}) {
  const outcome = headlineOutcome(entry.entries);
  const last = latestEntry(entry.entries);
  const runCount = uniqueRunIds(entry.entries.map((item) => item.runId)).length;
  const label = outcomeLabel(outcome, copy);
  const typeLabel = last ? copy.type[last.type] : undefined;
  const runsLabel = runCountLabel(runCount, copy);
  const meta = typeLabel === undefined ? runsLabel : `${typeLabel} · ${runsLabel}`;
  const name = [`#${entry.number}`, meta, label].filter(Boolean).join(", ");
  return (
    <SidebarNavItem
      asChild
      active={active}
      status={<OutcomeStatus outcome={outcome} />}
      meta={meta}
      {...(label === null ? {} : { count: label })}
    >
      <a
        href={`#pr-${entry.number}`}
        {...(withIds ? { id: `pr-${entry.number}` } : {})}
        data-issues-row=""
        aria-label={name}
      >
        #{entry.number}
      </a>
    </SidebarNavItem>
  );
}

function IssueListNav({
  issues, unlinked, selected, copy, withIds,
}: {
  issues: readonly IssueRecord[];
  unlinked: readonly UnlinkedPullRequest[];
  selected: ListItem | null;
  copy: ReviewsCopy;
  withIds: boolean;
}) {
  return (
    <Stack gap="sm" className="surface-pad-md">
      {issues.length === 0 ? null : (
        <ul className="flex list-none flex-col gap-stack-tight">
          {issues.map((issue) => (
            <li key={issue.number}>
              <IssueListRow
                issue={issue}
                active={selected?.kind === "issue" && selected.issue.number === issue.number}
                copy={copy}
                withIds={withIds}
              />
            </li>
          ))}
        </ul>
      )}
      {unlinked.length > 0 ? (
        <SidebarNavGroup label={copy.list.unlinkedTitle} open>
          <Text variant="muted">{copy.list.unlinkedDescription}</Text>
          <ul className="flex list-none flex-col gap-stack-tight">
            {unlinked.map((entry) => (
              <li key={entry.number}>
                <UnlinkedListRow
                  entry={entry}
                  active={selected?.kind === "pr" && selected.pull.number === entry.number}
                  copy={copy}
                  withIds={withIds}
                />
              </li>
            ))}
          </ul>
        </SidebarNavGroup>
      ) : null}
    </Stack>
  );
}

function useSelectedIssueId(ids: readonly string[]) {
  const [selectedId, setSelectedId] = useState(() => resolveIssueOpenId(ids, "", ""));
  useEffect(() => {
    const apply = () => {
      const next = resolveIssueOpenId(ids, window.location.search, window.location.hash);
      setSelectedId(next);
      const desktop = window.matchMedia("(min-width: 48rem)").matches;
      if (next !== null && shouldScrollSelectedIssue(window.location.hash, desktop)) {
        document.getElementById(next)?.scrollIntoView({ block: "nearest" });
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [ids]);
  return selectedId;
}

function IssuesPane({
  sidebar, drawerSidebar, detail, copy,
}: {
  sidebar: ReactNode; drawerSidebar: ReactNode; detail: ReactNode; copy: ReviewsCopy;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      data-issues-workspace=""
      className="flex pane-shrink flex-1 flex-col md:flex-row md:overflow-hidden"
    >
      <aside
        data-issues-aside=""
        tabIndex={0} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex -- overflow scrollports are focusable per #396.
        aria-label={copy.list.title}
        className="flex w-full shrink-0 flex-col muted-wash max-md:hidden md:pane-shrink md:w-app-shell-sidebar md:overflow-y-auto md:border-r md:focus-ring"
      >
        {sidebar}
      </aside>
      <Drawer direction="left" mobile="side" open={open} onOpenChange={setOpen}>
        <Stack gap="tight" className="pane-shrink content-shrink flex-1">
          <Stack direction="horizontal" data-issues-menu="" className="p-app-shell-padding md:hidden">
            <DrawerTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="min-h-target">
                {copy.list.openList}
              </Button>
            </DrawerTrigger>
          </Stack>
          {detail}
        </Stack>
        <DrawerContent>
          <DrawerHeader className="flex-row items-center justify-end">
            <DrawerTitle className="sr-only">{copy.list.openList}</DrawerTitle>
            <DrawerCloseButton />
          </DrawerHeader>
          <DrawerBody
            tabIndex={0} // scrollable-region-focusable (#396); kit DrawerBody is not a DOM node for jsx-a11y.
            className="focus-ring"
            onClick={(event) => {
              if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
            }}
          >
            {drawerSidebar}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function detailLiveName(selected: ListItem | null, copy: ReviewsCopy): string {
  if (selected?.kind === "issue") return issueFullTitle(selected.issue);
  if (selected?.kind === "pr") return `${copy.unlinked.title} #${selected.pull.number}`;
  return copy.list.missing;
}

function IssuesWorkspace({
  issues, unlinked, selected, copy,
}: {
  issues: readonly IssueRecord[];
  unlinked: readonly UnlinkedPullRequest[];
  selected: ListItem | null;
  copy: ReviewsCopy;
}) {
  const detailHeadingId = useId();
  const list = (withIds: boolean) => (
    <IssueListNav issues={issues} unlinked={unlinked} selected={selected} copy={copy} withIds={withIds} />
  );
  return (
    <IssuesPane
      copy={copy}
      sidebar={list(true)}
      drawerSidebar={list(false)}
      detail={
        <article
          data-issues-detail=""
          tabIndex={0} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex -- overflow scrollports are focusable per #396.
          className="content-shrink p-app-shell-padding focus-ring md:pane-shrink md:flex-1 md:overflow-y-auto md:p-app-shell-padding-md"
          aria-labelledby={detailHeadingId}
        >
          <Text as="p" className="sr-only" aria-live="polite">
            {detailLiveName(selected, copy)}
          </Text>
          {selected?.kind === "issue" ? (
            <IssueDetail issue={selected.issue} copy={copy} headingId={detailHeadingId} />
          ) : selected?.kind === "pr" ? (
            <UnlinkedDetail entry={selected.pull} copy={copy} headingId={detailHeadingId} />
          ) : (
            <Card>
              <CardHeader>
                <Heading level={2} typeRole="cardTitle" id={detailHeadingId}>{copy.list.missing}</Heading>
              </CardHeader>
              <CardContent>
                <EmptyState description={copy.list.missingNext} />
              </CardContent>
            </Card>
          )}
        </article>
      }
    />
  );
}

export function ReviewListView({
  issues, unlinked, copy,
}: {
  issues: readonly IssueRecord[];
  unlinked: readonly UnlinkedPullRequest[];
  copy: ReviewsCopy;
}) {
  const items = useMemo(() => listItems(issues, unlinked), [issues, unlinked]);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const selectedId = useSelectedIssueId(ids);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const empty = issues.length === 0 && unlinked.length === 0;
  return (
    <ReviewAppearanceFrame layout={empty ? "page" : "workspace"}>
      <PageHeader title={copy.list.title} description={copy.list.description} />
      {empty ? (
        <EmptyState description={copy.list.empty} />
      ) : (
        <IssuesWorkspace issues={issues} unlinked={unlinked} selected={selected} copy={copy} />
      )}
    </ReviewAppearanceFrame>
  );
}
