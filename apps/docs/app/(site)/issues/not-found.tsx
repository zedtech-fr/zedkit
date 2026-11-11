import { reviewsCopy } from "@/features/reviews/i18n/reviews-copy";
import { ReviewNotFoundView } from "@/features/reviews/ui/review-not-found-view";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata("/issues", reviewsCopy.metadata.missing, { index: false });

export default function IssuesNotFound() {
  return (
    <ReviewNotFoundView
      title={reviewsCopy.metadata.missing.title}
      body={reviewsCopy.issue.missing}
      backLabel={reviewsCopy.issue.back}
    />
  );
}
