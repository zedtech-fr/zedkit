import Link from "next/link";
import { Button, ErrorState, PageHeader } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { ReviewAppearanceFrame } from "./appearance-panel";

/** Build-time load failure: the HTML is static, so a reload cannot fetch fresh data. */
export function ReviewLoadErrorView({
  copy,
  title,
  description,
}: {
  copy: ReviewsCopy;
  title: string;
  description: string;
}) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader title={title} description={description} />
      <ErrorState
        title={copy.loadError.title}
        description={copy.loadError.description}
        actions={
          <Button asChild variant="outline">
            <Link href="/issues">{copy.issue.back}</Link>
          </Button>
        }
      />
    </ReviewAppearanceFrame>
  );
}
