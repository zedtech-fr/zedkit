import { reviewsCopy } from "@/features/reviews/i18n/reviews-copy";
import { ReviewNotFoundView } from "@/features/reviews/ui/review-not-found-view";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata("/issues", reviewsCopy.metadata.runMissing, {
  index: false,
});

export default function UnlinkedRunNotFound() {
  return (
    <ReviewNotFoundView
      title={reviewsCopy.metadata.runMissing.title}
      body={reviewsCopy.run.missing}
      backLabel={reviewsCopy.run.backToList}
    />
  );
}
