import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";

export function ReviewSampleNotice({ copy }: { copy: ReviewsCopy }) {
  return (
    <Alert asChild>
      <section aria-labelledby="review-sample-notice-title">
        <AlertTitle id="review-sample-notice-title">{copy.sampleNotice.title}</AlertTitle>
        <AlertDescription>{copy.sampleNotice.description}</AlertDescription>
      </section>
    </Alert>
  );
}
