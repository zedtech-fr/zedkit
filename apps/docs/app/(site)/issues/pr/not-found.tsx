import { reviewsCopy } from "@/features/reviews/i18n/reviews-copy";
import { ReviewNotFoundView } from "@/features/reviews/ui/review-not-found-view";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata("/issues", reviewsCopy.metadata.unlinkedMissing, {
  index: false,
});

export default function UnlinkedPrNotFound() {
  return (
    <ReviewNotFoundView
      title={reviewsCopy.metadata.unlinkedMissing.title}
      body={reviewsCopy.unlinked.missing}
      backLabel={reviewsCopy.unlinked.back}
    />
  );
}
