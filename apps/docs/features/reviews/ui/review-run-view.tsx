"use client";

import Link from "next/link";
import {
  Button,
  PageHeader,
  Stack,
  StatusLabel,
  UpdatedAgo,
  type StatusLabelTone,
} from "@zedtech/zedkit-ui";

import type { ReviewRecord, ReviewRun } from "../ports/review-port";
import type { ReviewsCopy } from "../i18n/reviews-copy";
import { ReviewAppearanceFrame } from "./appearance-panel";

const STATUS_TONE: Record<ReviewRun["status"], StatusLabelTone> = {
  running: "loading",
  done: "saved",
  error: "error",
};

export function ReviewRunView({
  record,
  run,
  copy,
}: {
  record: ReviewRecord;
  run: ReviewRun;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewAppearanceFrame copy={copy}>
      {(panel) => (
        <>
          <PageHeader
            title={`${copy.run.title} ${run.id}`}
            description={`#${record.number} ${record.title}`}
            back={
              <Stack direction="horizontal" gap="sm" className="flex-wrap">
                <Button asChild variant="link" size="sm">
                  <Link href={`/reviews/pr/${record.number}`}>{copy.run.backToPr}</Link>
                </Button>
                <Button asChild variant="link" size="sm">
                  <Link href="/reviews">{copy.run.backToList}</Link>
                </Button>
              </Stack>
            }
          />
          <StatusLabel tone={STATUS_TONE[run.status]}>{copy.status[run.status]}</StatusLabel>
          <UpdatedAgo date={new Date(run.startedAt)} />
          {panel}
        </>
      )}
    </ReviewAppearanceFrame>
  );
}
