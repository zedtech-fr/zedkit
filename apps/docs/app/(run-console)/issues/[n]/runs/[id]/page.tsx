import {
  listIssueRunParams,
  parsePrNumber,
  ReviewIssueRunFeature,
  reviewsCopy,
} from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listIssueRunParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string; id: string }> }) {
  const { n, id } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/issues", reviewsCopy.metadata.runMissing, { index: false });
  }
  return docsPageMetadata(`/issues/${number}/runs/${id}`, {
    title: `${reviewsCopy.metadata.run.title} ${id}`,
    description: reviewsCopy.metadata.run.description,
  });
}

export default async function IssueRunPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  return <ReviewIssueRunFeature n={n} id={id} />;
}
