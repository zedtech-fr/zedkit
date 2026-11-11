import { ReviewListFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/issues", reviewsCopy.metadata.list);

export default async function IssuesPage() {
  return <ReviewListFeature />;
}
