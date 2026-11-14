import { ReviewMissingFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata(
  "/issues",
  reviewsCopy.metadata.missing,
  { index: false },
);

export default async function IssuesSegmentNotFound() {
  return (
    <ReviewMissingFeature
      title={reviewsCopy.metadata.missing.title}
      body={reviewsCopy.issue.missing}
      backLabel={reviewsCopy.issue.back}
    />
  );
}
