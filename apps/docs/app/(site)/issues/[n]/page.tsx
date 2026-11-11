import { listIssueParams, parsePrNumber, ReviewIssueFeature, reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listIssueParams;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const number = parsePrNumber(n);
  if (number === null) {
    return docsPageMetadata("/issues", reviewsCopy.metadata.missing, { index: false });
  }
  return docsPageMetadata(`/issues/${number}`, {
    title: `${reviewsCopy.metadata.issue.title} #${number}`,
    description: reviewsCopy.metadata.issue.description,
  });
}

export default async function IssuePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <ReviewIssueFeature n={n} />;
}
