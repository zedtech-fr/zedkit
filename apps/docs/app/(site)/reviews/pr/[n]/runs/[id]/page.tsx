import { listReviewRunParams, redirectReviewsPrRun } from "@/features/reviews";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewRunParams;

export default async function ReviewRunRedirectPage({
  params,
}: {
  params: Promise<{ n: string; id: string }>;
}) {
  const { n, id } = await params;
  await redirectReviewsPrRun({ n, id });
}
