import { ErrorState, PageHeader } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { ReviewAppearanceFrame } from "./appearance-panel";

/** Build-time load failure: the HTML is static, so a reload cannot fetch fresh data. */
export function ReviewLoadErrorView({ copy }: { copy: ReviewsCopy }) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader title={copy.list.title} description={copy.list.description} />
      <ErrorState
        title={copy.loadError.title}
        description={copy.loadError.description}
      />
    </ReviewAppearanceFrame>
  );
}
