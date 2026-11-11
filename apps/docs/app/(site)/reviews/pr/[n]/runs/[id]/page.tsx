import { listReviewRunParams, parsePrNumber, ReviewRunFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewRunParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string; id: string }> }) {
  const { n, id } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/reviews", reviewsCopy.metadata.missing, { index: false });
  }
  return docsPageMetadata(`/reviews/pr/${number}/runs/${id}`, {
    title: `${reviewsCopy.metadata.run.title} ${id}`,
    description: reviewsCopy.metadata.run.description,
  });
}

export default async function ReviewRunPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  return <ReviewRunFeature n={n} id={id} />;
}
