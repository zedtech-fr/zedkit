import { ReviewMissingFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata(
  "/issues",
  reviewsCopy.metadata.unlinkedMissing,
  {
    index: false,
  },
);

export default async function IssuesSegmentNotFound() {
  return (
    <ReviewMissingFeature
      title={reviewsCopy.metadata.unlinkedMissing.title}
      body={reviewsCopy.unlinked.missing}
      backLabel={reviewsCopy.unlinked.back}
    />
  );
}
