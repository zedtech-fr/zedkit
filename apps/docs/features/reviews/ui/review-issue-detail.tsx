import { useId, type ReactNode } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  DetailPanel,
  EmptyState,
  Heading,
  Stack,
  Text,
  UpdatedAgo,
  formatDuration,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { githubIssueHref, githubPullHref, issueFullTitle } from "../model/github-hrefs";
import {
  entriesNewestFirst,
  headlineOutcome,
  latestEntry,
  latestFinishedEntry,
  summedDurationMs,
} from "../model/latest-status";
import type { IssueRecord, TimelineEntry, UnlinkedPullRequest } from "../ports/review-port";
import { OutcomeMark } from "./issue-status";
import { CompactLogLink, TimelineRow } from "./review-timeline-row";

export function DetailMeta({
  entries,
  links,
  copy,
}: {
  entries: readonly TimelineEntry[];
  links: readonly { kind: "issue" | "pr"; n: number }[];
  copy: ReviewsCopy;
}) {
  const durationMs = summedDurationMs(entries);
  const finished = latestFinishedEntry(entries);
  const started = latestEntry(entries);
  const items: { label: string; value: ReactNode }[] = [];
  if (durationMs !== null) {
    items.push({ label: copy.list.duration, value: formatDuration(durationMs) });
  }
  if (finished) {
    items.push({
      label: copy.list.finished,
      value: (
        <UpdatedAgo date={new Date(finished.endedAt ?? finished.startedAt)} className="whitespace-nowrap" />
      ),
    });
  } else if (started) {
    items.push({
      label: copy.list.started,
      value: <UpdatedAgo date={new Date(started.startedAt)} className="whitespace-nowrap" />,
    });
  }
  for (const link of links) {
    const label = link.kind === "issue" ? copy.list.githubIssue : copy.list.githubPull;
    const href = link.kind === "issue" ? githubIssueHref(link.n) : githubPullHref(link.n);
    items.push({
      label,
      value: (
        <CompactLogLink href={href} copy={copy}>
          {`${label} #${link.n}`}
        </CompactLogLink>
      ),
    });
  }
  return <DetailPanel variant="grid" items={items} />;
}

function StepsList({
  entries,
  empty,
  copy,
}: {
  entries: readonly TimelineEntry[];
  empty: string;
  copy: ReviewsCopy;
}) {
  const headingId = useId();
  return (
    <Stack gap="sm">
      <Heading level={3} typeRole="section" id={headingId}>
        {copy.issue.timeline}
      </Heading>
      {entries.length === 0 ? (
        <EmptyState description={empty} />
      ) : (
        <ul aria-labelledby={headingId} className="flex list-none flex-col gap-stack-sm">
          {entriesNewestFirst(entries).map((entry) => (
            <li key={entry.id}>
              <TimelineRow entry={entry} href={entry.liveUrl} copy={copy} />
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}

function DetailCard({
  headingId,
  title,
  marks,
  entries,
  links,
  empty,
  copy,
}: {
  headingId: string;
  title: string;
  marks: ReactNode;
  entries: readonly TimelineEntry[];
  links: readonly { kind: "issue" | "pr"; n: number }[];
  empty: string;
  copy: ReviewsCopy;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-stack-sm">
        <Heading level={2} typeRole="cardTitle" id={headingId}>
          {title}
        </Heading>
        {marks}
      </CardHeader>
      <CardContent>
        <Stack gap="md">
          <DetailMeta entries={entries} links={links} copy={copy} />
          <StepsList entries={entries} empty={empty} copy={copy} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function IssueDetail({
  issue,
  copy,
  headingId,
}: {
  issue: IssueRecord;
  copy: ReviewsCopy;
  headingId: string;
}) {
  const outcome = headlineOutcome(issue.entries);
  return (
    <DetailCard
      headingId={headingId}
      title={issueFullTitle(issue)}
      marks={
        <>
          <Badge variant="outline">{copy.state[issue.state]}</Badge>
          {outcome ? <OutcomeMark outcome={outcome} copy={copy} /> : null}
        </>
      }
      entries={issue.entries}
      links={[
        { kind: "issue", n: issue.number },
        ...issue.pullRequests.map((n) => ({ kind: "pr" as const, n })),
      ]}
      empty={copy.issue.timelineEmpty}
      copy={copy}
    />
  );
}

export function UnlinkedDetail({
  entry,
  copy,
  headingId,
}: {
  entry: UnlinkedPullRequest;
  copy: ReviewsCopy;
  headingId: string;
}) {
  const outcome = headlineOutcome(entry.entries);
  const last = latestEntry(entry.entries);
  return (
    <DetailCard
      headingId={headingId}
      title={`${copy.unlinked.title} #${entry.number}`}
      marks={
        <>
          {last ? (
            <Text variant="muted" typeRole="caption">
              {copy.type[last.type]}
            </Text>
          ) : null}
          {outcome ? <OutcomeMark outcome={outcome} copy={copy} /> : null}
        </>
      }
      entries={entry.entries}
      links={[{ kind: "pr", n: entry.number }]}
      empty={copy.unlinked.timelineEmpty}
      copy={copy}
    />
  );
}
