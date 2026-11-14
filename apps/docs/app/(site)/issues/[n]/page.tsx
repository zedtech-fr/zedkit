import {
  issuesIndexRobots,
  listIssueParams,
  parsePrNumber,
  ReviewIssueFeature,
  reviewsCopy,
} from "@/features/reviews";
import { createSiteReviewPort } from "@/features/reviews/adapters/live";
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
  const issue = await createSiteReviewPort().getIssue(number);
  if (issue === null) {
    return docsPageMetadata(`/issues/${number}`, reviewsCopy.metadata.missing, { index: false });
  }
  return docsPageMetadata(
    `/issues/${number}`,
    {
      title: `${reviewsCopy.metadata.issue.title} #${number}`,
      description: reviewsCopy.metadata.issue.description,
    },
    await issuesIndexRobots(),
  );
}

export default async function IssuePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <ReviewIssueFeature n={n} />;
}
