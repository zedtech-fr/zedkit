import {
  issuesIndexRobots,
  listUnlinkedRunParams,
  parsePrNumber,
  ReviewUnlinkedRunFeature,
  reviewsCopy,
} from "@/features/reviews";
import { createSiteReviewPort } from "@/features/reviews/adapters/live";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listUnlinkedRunParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string; id: string }> }) {
  const { n, id } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/issues", reviewsCopy.metadata.runMissing, { index: false });
  }
  const port = createSiteReviewPort();
  const pullRequest = await port.getUnlinkedPullRequest(number);
  const run = await port.getUnlinkedRun(number, id);
  if (pullRequest === null || run === null) {
    return docsPageMetadata(
      `/issues/pr/${number}/runs/${id}`,
      reviewsCopy.metadata.runMissing,
      { index: false },
    );
  }
  return docsPageMetadata(
    `/issues/pr/${number}/runs/${id}`,
    {
      title: `${reviewsCopy.metadata.run.title} ${id}`,
      description: reviewsCopy.metadata.run.description,
    },
    await issuesIndexRobots(),
  );
}

export default async function UnlinkedRunPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  return <ReviewUnlinkedRunFeature n={n} id={id} />;
}
