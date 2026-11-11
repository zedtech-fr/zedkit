import { listReviewPrParams, parsePrNumber, ReviewPrFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewPrParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/reviews", reviewsCopy.metadata.missing, { index: false });
  }
  return docsPageMetadata(`/reviews/pr/${number}`, {
    title: `${reviewsCopy.metadata.pr.title} #${number}`,
    description: reviewsCopy.metadata.pr.description,
  });
}

export default async function ReviewPrPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <ReviewPrFeature n={n} />;
}
