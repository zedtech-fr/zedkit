import { redirectReviewsIndex } from "@/features/reviews";

export const dynamic = "force-static";

export default async function ReviewsPage() {
  await redirectReviewsIndex();
}
