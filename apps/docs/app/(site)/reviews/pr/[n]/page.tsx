import { listReviewPrParams, redirectReviewsPr } from "@/features/reviews";

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = listReviewPrParams;

export default async function ReviewPrRedirectPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  await redirectReviewsPr({ n });
}
