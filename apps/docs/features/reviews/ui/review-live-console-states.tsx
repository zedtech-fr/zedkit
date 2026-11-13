"use client";

import Link from "next/link";
import {
  Button,
  DetailPanelSkeleton,
  ErrorState,
  Heading,
  Skeleton,
  Stack,
} from "@zedtech/zedkit-ui";

import { liveConsoleCopy } from "../i18n/review-live-console-copy";
import { reviewsCopy } from "../i18n/reviews-copy";
import { ReviewConsoleAppearanceFrame } from "./review-console-appearance";

export function ConsoleNotice({
  title,
  description,
  retry,
}: {
  title: string;
  description: string;
  retry?: (() => void) | undefined;
}) {
  return (
    <ReviewConsoleAppearanceFrame>
      {(panel) => (
        <Stack gap="md" className="surface-pad-md">
          <Heading level={1} typeRole="title">
            {reviewsCopy.run.title}
          </Heading>
          {panel}
          <ErrorState
            title={title}
            description={description}
            actions={
              <>
                {retry ? (
                  <Button type="button" variant="outline" onClick={retry}>
                    {liveConsoleCopy.retry}
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/issues">{reviewsCopy.run.backToList}</Link>
                </Button>
              </>
            }
          />
        </Stack>
      )}
    </ReviewConsoleAppearanceFrame>
  );
}

export function ConsoleLoading() {
  return (
    <ReviewConsoleAppearanceFrame>
      {(panel) => (
        <Stack gap="md" className="surface-pad-md" role="status" aria-label={liveConsoleCopy.loading}>
          <Heading level={1} typeRole="title">
            {reviewsCopy.run.title}
          </Heading>
          {panel}
          <Skeleton className="h-skeleton-line w-skeleton-bar" />
          <DetailPanelSkeleton label={liveConsoleCopy.loading} rows={4} />
        </Stack>
      )}
    </ReviewConsoleAppearanceFrame>
  );
}
