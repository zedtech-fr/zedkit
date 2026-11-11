import { listReviewPrParams, ReviewPrFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewPrParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return docsPageMetadata(`/reviews/pr/${n}`, {
    title: `${reviewsCopy.metadata.pr.title} #${n}`,
    description: reviewsCopy.metadata.pr.description,
  });
}

export default async function ReviewPrPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <ReviewPrFeature n={n} />;
}
