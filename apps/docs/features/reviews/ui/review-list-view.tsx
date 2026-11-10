"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldLabel,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  StatusLabel,
  Text,
  UpdatedAgo,
  type BadgeProps,
  type StatusLabelTone,
} from "@zedtech/zedkit-ui";

import { filterReviewList, type ReviewListQuery } from "../model/list-filter";
import type { ReviewPrState, ReviewRecord, ReviewVerdict } from "../ports/review-port";
import type { ReviewsCopy } from "../i18n/reviews-copy";
import { ReviewAppearanceFrame } from "./appearance-panel";

const VERDICT_BADGE: Record<ReviewVerdict, BadgeProps["variant"]> = {
  approve: "success",
  "request-changes": "warning",
  comment: "secondary",
  error: "destructive",
};

const STATUS_TONE: Record<ReviewRecord["status"], StatusLabelTone> = {
  running: "loading",
  done: "saved",
  error: "error",
};

type FilterState = {
  prState: "all" | ReviewPrState;
  verdict: "all" | ReviewVerdict;
  search: string;
};

function toQuery(filters: FilterState): ReviewListQuery {
  return {
    ...(filters.prState === "all" ? {} : { prState: filters.prState }),
    ...(filters.verdict === "all" ? {} : { verdict: filters.verdict }),
    search: filters.search,
  };
}

function ReviewRow({ record, copy }: { record: ReviewRecord; copy: ReviewsCopy }) {
  const run = record.runs[0];
  return (
    <Stack gap="sm" className="border-b border-border py-section-sm">
      <Button asChild variant="link" className="w-fit">
        <Link href={`/reviews/pr/${record.number}`} aria-label={`${copy.list.openPr} #${record.number}`}>
          #{record.number} {record.title}
        </Link>
      </Button>
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Badge variant={VERDICT_BADGE[record.verdict]}>{copy.verdict[record.verdict]}</Badge>
        <Text variant="muted" typeRole="caption">
          {copy.pr.confidence} {record.confidence}
        </Text>
        <StatusLabel tone={STATUS_TONE[record.status]}>{copy.status[record.status]}</StatusLabel>
        <Badge variant="outline">{copy.prState[record.prState]}</Badge>
      </Stack>
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Badge variant="meta" title={record.headSha}>
          {record.headSha.slice(0, 7)}
        </Badge>
        <UpdatedAgo date={new Date(record.lastRunAt)} />
        {run ? (
          <Button asChild variant="link" size="sm">
            <Link href={`/reviews/pr/${record.number}/runs/${run.id}`}>{copy.list.runHistory}</Link>
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

function SearchField({
  copy,
  filters,
  onFilters,
}: {
  copy: ReviewsCopy;
  filters: FilterState;
  onFilters: (next: FilterState) => void;
}) {
  const searchId = useId();
  return (
    <Field className="w-full flex-1 sm:w-look">
      <FieldLabel htmlFor={searchId}>{copy.list.search}</FieldLabel>
      <Input
        id={searchId}
        type="search"
        value={filters.search}
        onChange={(event) => onFilters({ ...filters, search: event.target.value })}
        placeholder={copy.list.search}
      />
    </Field>
  );
}

function ReviewFilters({
  copy,
  filters,
  onFilters,
}: {
  copy: ReviewsCopy;
  filters: FilterState;
  onFilters: (next: FilterState) => void;
}) {
  const stateId = useId();
  const verdictId = useId();
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-end">
      <Field className="w-full sm:w-look">
        <FieldLabel htmlFor={stateId}>{copy.list.state}</FieldLabel>
        <Select
          value={filters.prState}
          onValueChange={(prState) => onFilters({ ...filters, prState: prState as FilterState["prState"] })}
        >
          <SelectTrigger id={stateId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.list.stateAll}</SelectItem>
            <SelectItem value="open">{copy.list.stateOpen}</SelectItem>
            <SelectItem value="merged">{copy.list.stateMerged}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field className="w-full sm:w-look">
        <FieldLabel htmlFor={verdictId}>{copy.list.verdict}</FieldLabel>
        <Select
          value={filters.verdict}
          onValueChange={(verdict) => onFilters({ ...filters, verdict: verdict as FilterState["verdict"] })}
        >
          <SelectTrigger id={verdictId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.list.verdictAll}</SelectItem>
            <SelectItem value="approve">{copy.verdict.approve}</SelectItem>
            <SelectItem value="request-changes">{copy.verdict["request-changes"]}</SelectItem>
            <SelectItem value="comment">{copy.verdict.comment}</SelectItem>
            <SelectItem value="error">{copy.verdict.error}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <SearchField copy={copy} filters={filters} onFilters={onFilters} />
    </Stack>
  );
}

function ReviewResults({ records, visible, copy }: { records: readonly ReviewRecord[]; visible: ReviewRecord[]; copy: ReviewsCopy }) {
  if (records.length === 0) return <EmptyState description={copy.list.empty} />;
  if (visible.length === 0) return <EmptyState description={copy.list.noneMatch} />;
  return (
    <ul>
      {visible.map((record) => (
        <li key={record.number}>
          <ReviewRow record={record} copy={copy} />
        </li>
      ))}
    </ul>
  );
}

export function ReviewListView({
  records,
  copy,
}: {
  records: readonly ReviewRecord[];
  copy: ReviewsCopy;
}) {
  const [filters, setFilters] = useState<FilterState>({ prState: "all", verdict: "all", search: "" });
  const visible = filterReviewList(records, toQuery(filters));
  return (
    <ReviewAppearanceFrame copy={copy}>
      {(panel) => (
        <>
          <PageHeader title={copy.list.title} description={copy.list.description} />
          {panel}
          <ReviewFilters copy={copy} filters={filters} onFilters={setFilters} />
          <ReviewResults records={records} visible={visible} copy={copy} />
        </>
      )}
    </ReviewAppearanceFrame>
  );
}
