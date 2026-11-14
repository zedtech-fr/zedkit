import Link from "next/link";
import { Button, ErrorState, PageHeader } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { ReviewAppearanceFrame } from "./appearance-panel";

/** Build-time load failure: the HTML is static, so a reload cannot fetch fresh data. */
export function ReviewLoadErrorView({
  copy,
  title,
  description,
  recoveryHref = "/issues",
  recoveryLabel = copy.issue.back,
}: {
  copy: ReviewsCopy;
  title: string;
  description: string;
  recoveryHref?: string;
  recoveryLabel?: string;
}) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader title={title} description={description} />
      <ErrorState
        title={copy.loadError.title}
        description={copy.loadError.description}
        actions={
          <Button asChild variant="outline">
            {recoveryHref === "/issues" ? (
              <Link href="/issues">{recoveryLabel}</Link>
            ) : (
              <Link href={recoveryHref}>{recoveryLabel}</Link>
            )}
          </Button>
        }
      />
    </ReviewAppearanceFrame>
  );
}
