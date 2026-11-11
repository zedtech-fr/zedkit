"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  DetailPanel,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  EmptyState,
  Heading,
  Stack,
  StatusLabel,
  UpdatedAgo,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import {
  defaultReviewSelection,
  mergeReviewShareUrl,
  parseReviewSelection,
  reviewConsoleItems,
  selectionHash,
} from "../model/selection";
import type { ReviewConsoleItem, ReviewRecord, ReviewRun } from "../ports/review-port";
import { STATUS_TONE, VERDICT_BADGE } from "./review-badges";
import { ReviewMainFlow, type ReviewAgentsReveal } from "./review-main-flow";

function useLocationHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return [hash, setHash] as const;
}

function writeSelection(id: string, defaultId: string): string {
  const hash = selectionHash(id, defaultId);
  window.history.replaceState(
    null,
    "",
    mergeReviewShareUrl({
      pathname: window.location.pathname,
      search: window.location.search,
      hash,
    }),
  );
  return hash;
}

function ConsolePane({
  record,
  run,
  item,
  copy,
  panel,
  decisionMeta,
  agentsReveal,
}: {
  record: ReviewRecord;
  run: ReviewRun;
  item: ReviewConsoleItem;
  copy: ReviewsCopy;
  panel: ReactNode;
  decisionMeta?: ReactNode;
  agentsReveal: ReviewAgentsReveal;
}) {
  return (
    <div className="pane-shrink flex-1 p-app-shell-padding md:p-app-shell-padding-md">
      {item.kind === "flow" ? (
        <Stack gap="lg">
          <ReviewMainFlow
            record={record}
            run={run}
            copy={copy}
            panel={panel}
            decisionMeta={decisionMeta}
            agentsReveal={agentsReveal}
          />
        </Stack>
      ) : (
        <Stack gap="lg">
          <EmptyState description={copy.console.itemEmpty} />
          {panel}
        </Stack>
      )}
    </div>
  );
}

function ConsoleHeader({ record, run, copy }: { record: ReviewRecord; run: ReviewRun; copy: ReviewsCopy }) {
  return (
    <Stack gap="sm">
      <DetailPanel
        items={[
          { label: copy.console.pullRequest, value: `#${record.number}` },
          {
            label: copy.console.sha,
            value: (
              <Badge variant="meta" title={record.headSha}>
                {record.headSha.slice(0, 7)}
              </Badge>
            ),
          },
          {
            label: copy.console.status,
            value: <StatusLabel tone={STATUS_TONE[run.status]}>{copy.status[run.status]}</StatusLabel>,
          },
          {
            label: copy.console.verdict,
            value: <Badge variant={VERDICT_BADGE[record.verdict]}>{copy.verdict[record.verdict]}</Badge>,
          },
        ]}
      />
      <UpdatedAgo date={new Date(run.startedAt)} />
    </Stack>
  );
}

function ItemRow({
  item,
  selected,
  copy,
  onSelect,
}: {
  item: ReviewConsoleItem;
  selected: boolean;
  copy: ReviewsCopy;
  onSelect: (id: string) => void;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "ghost"}
      aria-current={selected ? "true" : undefined}
      className="min-h-target w-full justify-start gap-stack-sm"
      onClick={() => onSelect(item.id)}
    >
      {item.title}
      <StatusLabel tone={STATUS_TONE[item.status]}>{copy.status[item.status]}</StatusLabel>
    </Button>
  );
}

function RelatedRuns({ record, run, copy }: { record: ReviewRecord; run: ReviewRun; copy: ReviewsCopy }) {
  const related = record.runs.filter((item) => item.id !== run.id);
  if (related.length === 0) return null;
  return (
    <Stack gap="sm">
      <Heading level={2} typeRole="section">
        {copy.console.relatedRuns}
      </Heading>
      <ul className="flex flex-col gap-stack-sm">
        {related.map((item) => (
          <li key={item.id}>
            <Button asChild variant="link">
              <Link href={`/reviews/pr/${record.number}/runs/${item.id}`}>
                {copy.pr.openRun} {item.id}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

function ConsoleList({
  record,
  run,
  copy,
  items,
  selectedId,
  onSelect,
  className,
}: {
  record: ReviewRecord;
  run: ReviewRun;
  copy: ReviewsCopy;
  items: readonly ReviewConsoleItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <Stack gap="md" className={className}>
      <ConsoleHeader record={record} run={run} copy={copy} />
      <nav aria-label={copy.console.navLabel}>
        <Stack gap="tight">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} selected={item.id === selectedId} copy={copy} onSelect={onSelect} />
          ))}
        </Stack>
      </nav>
      <RelatedRuns record={record} run={run} copy={copy} />
    </Stack>
  );
}

type ReviewConsoleProps = {
  record: ReviewRecord;
  run: ReviewRun;
  copy: ReviewsCopy;
  panel: ReactNode;
  decisionMeta?: ReactNode;
  agentsReveal?: ReviewAgentsReveal;
};

export function ReviewConsole({
  record,
  run,
  copy,
  panel,
  decisionMeta,
  agentsReveal = "disclosure",
}: ReviewConsoleProps) {
  const items = reviewConsoleItems(run, copy.console.flow);
  const defaultId = defaultReviewSelection(items);
  const [hash, setHash] = useLocationHash();
  const [open, setOpen] = useState(false);
  const selectedId = parseReviewSelection(hash, items);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  function onSelect(id: string) {
    setHash(writeSelection(id, defaultId));
    setOpen(false);
  }

  const listProps = { record, run, copy, items, selectedId, onSelect };

  return (
    <Drawer direction="left" mobile="sheet" open={open} onOpenChange={setOpen}>
      <div className="flex w-full content-shrink">
        <aside className="flex w-app-shell-sidebar shrink-0 flex-col border-r muted-wash max-md:hidden">
          <ConsoleList {...listProps} className="surface-pad-compact" />
        </aside>
        <div className="flex pane-shrink content-shrink flex-1 flex-col">
          <DrawerTrigger asChild>
            <Button type="button" variant="outline" className="min-h-target md:hidden">
              {copy.console.openList}
            </Button>
          </DrawerTrigger>
          <ConsolePane
            record={record}
            run={run}
            item={selected}
            copy={copy}
            panel={panel}
            decisionMeta={decisionMeta}
            agentsReveal={agentsReveal}
          />
        </div>
      </div>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{copy.console.listTitle}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <ConsoleList {...listProps} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
