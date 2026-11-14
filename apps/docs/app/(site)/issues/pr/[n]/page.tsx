import {
  issuesIndexRobots,
  listUnlinkedPrParams,
  parsePrNumber,
  ReviewUnlinkedFeature,
  reviewsCopy,
} from "@/features/reviews";
import { createSiteReviewPort } from "@/features/reviews/adapters/live";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listUnlinkedPrParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/issues", reviewsCopy.metadata.unlinkedMissing, { index: false });
  }
  const pullRequest = await createSiteReviewPort().getUnlinkedPullRequest(number);
  if (pullRequest === null) {
    return docsPageMetadata(
      `/issues/pr/${number}`,
      reviewsCopy.metadata.unlinkedMissing,
      { index: false },
    );
  }
  return docsPageMetadata(
    `/issues/pr/${number}`,
    {
      title: `${reviewsCopy.metadata.unlinked.title} #${number}`,
      description: reviewsCopy.metadata.unlinked.description,
    },
    await issuesIndexRobots(),
  );
}

export default async function UnlinkedPrPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <ReviewUnlinkedFeature n={n} />;
}
