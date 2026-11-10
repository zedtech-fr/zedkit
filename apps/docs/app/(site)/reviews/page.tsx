import { ReviewListFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/reviews", reviewsCopy.metadata.list);

export default async function ReviewsPage() {
  return <ReviewListFeature />;
}
