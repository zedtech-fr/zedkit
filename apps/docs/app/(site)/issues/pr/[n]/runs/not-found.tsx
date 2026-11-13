import { ReviewMissingFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata(
  "/issues",
  reviewsCopy.metadata.runMissing,
  {
    index: false,
  },
);

export default async function IssuesSegmentNotFound() {
  return (
    <ReviewMissingFeature
      title={reviewsCopy.metadata.runMissing.title}
      body={reviewsCopy.run.missing}
      backLabel={reviewsCopy.run.backToList}
    />
  );
}
