import type { ReviewPrState, ReviewRecord, ReviewVerdict } from "../ports/review-port";

export type ReviewListQuery = {
  prState?: ReviewPrState;
  verdict?: ReviewVerdict;
  search?: string;
};

export function filterReviewList(
  records: readonly ReviewRecord[],
  query: ReviewListQuery,
): ReviewRecord[] {
  const needle = query.search?.trim().toLowerCase() ?? "";
  return records.filter((record) => {
    if (query.prState !== undefined && record.prState !== query.prState) return false;
    if (query.verdict !== undefined && record.verdict !== query.verdict) return false;
    if (needle.length === 0) return true;
    return (
      record.title.toLowerCase().includes(needle) ||
      String(record.number).includes(needle) ||
      record.headSha.toLowerCase().includes(needle)
    );
  });
}
