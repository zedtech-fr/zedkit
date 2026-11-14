import { ReviewMissingFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata(
  "/issues",
  reviewsCopy.metadata.reviewsMissing,
  {
    index: false,
  },
);

export default async function IssuesSegmentNotFound() {
  return (
    <ReviewMissingFeature
      title={reviewsCopy.metadata.reviewsMissing.title}
      body={reviewsCopy.metadata.reviewsMissing.description}
      backLabel={reviewsCopy.issue.back}
    />
  );
}
