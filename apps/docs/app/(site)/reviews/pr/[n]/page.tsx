import {
  issuesIndexRobots,
  listReviewPrParams,
  parsePrNumber,
  redirectReviewsPr,
  reviewsCopy,
} from "@/features/reviews";
import { createSiteReviewPort } from "@/features/reviews/adapters/live";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewPrParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/reviews", reviewsCopy.metadata.reviewsMissing, { index: false });
  }
  const resolved = await createSiteReviewPort().resolvePr(number);
  if (resolved === null) {
    return docsPageMetadata(
      `/reviews/pr/${number}`,
      reviewsCopy.metadata.reviewsMissing,
      { index: false },
    );
  }
  return docsPageMetadata(
    `/reviews/pr/${number}`,
    {
      title: reviewsCopy.metadata.reviewsMissing.title,
      description: reviewsCopy.metadata.reviewsMissing.description,
    },
    await issuesIndexRobots(),
  );
}

export default async function ReviewPrRedirectPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  await redirectReviewsPr({ n });
}
