"use client";

import Link from "next/link";
import { Button, PageHeader } from "@zedtech/zedkit-ui";

import type { ReviewRecord } from "../ports/review-port";
import type { ReviewsCopy } from "../i18n/reviews-copy";
import { latestReviewRun } from "../model/selection";
import { ReviewAppearanceFrame } from "./appearance-panel";
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
          {panel}
          {run ? <ReviewConsole record={record} run={run} copy={copy} /> : null}
        </>
      )}
    </ReviewAppearanceFrame>
  );
}
