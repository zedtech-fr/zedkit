import { reviewsCopy } from "@/features/reviews/i18n/reviews-copy";
import { ReviewNotFoundView } from "@/features/reviews/ui/review-not-found-view";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata("/issues", reviewsCopy.metadata.reviewsMissing, {
  index: false,
});

export default function ReviewsNotFound() {
  return (
    <ReviewNotFoundView
      title={reviewsCopy.metadata.reviewsMissing.title}
      body={reviewsCopy.metadata.reviewsMissing.description}
      backLabel={reviewsCopy.issue.back}
    />
  );
}
