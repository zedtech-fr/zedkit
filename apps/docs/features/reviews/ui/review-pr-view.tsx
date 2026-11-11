"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  PageHeader,
  StatusLabel,
  UpdatedAgo,
} from "@zedtech/zedkit-ui";

import type { ReviewRecord } from "../ports/review-port";
import type { ReviewsCopy } from "../i18n/reviews-copy";
import { latestReviewRun } from "../model/selection";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { STATUS_TONE } from "./review-badges";
import { ReviewConsole } from "./review-console";

export function ReviewPrView({ record, copy }: { record: ReviewRecord; copy: ReviewsCopy }) {
  const run = latestReviewRun(record.runs);
  return (
    <ReviewAppearanceFrame copy={copy}>
      {(panel) => (
        <>
          <PageHeader
            title={`#${record.number} ${record.title}`}
            back={
              <Button asChild variant="link" size="sm">
                <Link href="/reviews">{copy.pr.back}</Link>
              </Button>
            }
          />
          {run ? (
            <ReviewConsole
              record={record}
              run={run}
              copy={copy}
              panel={panel}
              decisionMeta={
                <>
                  <StatusLabel tone={STATUS_TONE[record.status]}>{copy.status[record.status]}</StatusLabel>
                  <Badge variant="outline">{copy.prState[record.prState]}</Badge>
                  <Badge variant="meta" title={record.headSha}>
                    {record.headSha.slice(0, 7)}
                  </Badge>
                  <UpdatedAgo date={new Date(record.lastRunAt)} />
                </>
              }
            />
          ) : null}
        </>
      )}
    </ReviewAppearanceFrame>
  );
}
