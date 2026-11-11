import {
  listUnlinkedRunParams,
  parsePrNumber,
  ReviewUnlinkedRunFeature,
  reviewsCopy,
} from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listUnlinkedRunParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string; id: string }> }) {
  const { n, id } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/issues", reviewsCopy.metadata.missing, { index: false });
  }
  return docsPageMetadata(`/issues/pr/${number}/runs/${id}`, {
    title: `${reviewsCopy.metadata.run.title} ${id}`,
    description: reviewsCopy.metadata.run.description,
  });
}

export default async function UnlinkedRunPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  return <ReviewUnlinkedRunFeature n={n} id={id} />;
}
