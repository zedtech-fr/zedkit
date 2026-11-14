import { issuesIndexRobots, ReviewListFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export async function generateMetadata() {
  return docsPageMetadata("/issues", reviewsCopy.metadata.list, await issuesIndexRobots());
}

export default async function IssuesPage() {
  return <ReviewListFeature />;
}
