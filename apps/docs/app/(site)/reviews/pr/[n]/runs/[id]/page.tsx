import {
  issuesIndexRobots,
  listReviewRunParams,
  parsePrNumber,
  redirectReviewsPrRun,
  reviewsCopy,
} from "@/features/reviews";
import { createSiteReviewPort } from "@/features/reviews/adapters/live";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewRunParams;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/reviews", reviewsCopy.metadata.reviewsMissing, { index: false });
  }
  const resolved = await createSiteReviewPort().resolvePr(number);
  if (resolved === null || !resolved.runIds.includes(id)) {
    return docsPageMetadata(
      `/reviews/pr/${number}/runs/${id}`,
      reviewsCopy.metadata.reviewsMissing,
      { index: false },
    );
  }
  return docsPageMetadata(`/reviews/pr/${number}/runs/${id}`, {
    title: reviewsCopy.metadata.reviewsMissing.title,
    description: reviewsCopy.metadata.reviewsMissing.description,
  }, await issuesIndexRobots());
}

export default async function ReviewRunRedirectPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  await redirectReviewsPrRun({ n, id });
}
