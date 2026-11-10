import { listReviewRunParams, ReviewRunFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const generateStaticParams = listReviewRunParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string; id: string }> }) {
  const { n, id } = await params;
  return docsPageMetadata(`/reviews/pr/${n}/runs/${id}`, {
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
