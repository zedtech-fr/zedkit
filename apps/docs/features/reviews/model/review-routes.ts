import type { ReviewPort } from "../ports/review-port";

export async function listReviewPrParamsFrom(port: ReviewPort) {
  const records = await port.list();
  const seen = new Set<number>();
  const params: { n: string }[] = [];
  for (const record of records) {
    const pr = record.run.pr;
    if (typeof pr !== "number" || seen.has(pr)) continue;
    seen.add(pr);
    params.push({ n: String(pr) });
  }
  return params;
}

export async function listReviewRunParamsFrom(port: ReviewPort) {
  const records = await port.list();
  return records.flatMap((record) => {
    const pr = record.run.pr;
    if (typeof pr !== "number") return [];
    return [{ n: String(pr), id: record.run.run_id }];
  });
}

export async function listReviewSitemapPathsFrom(port: ReviewPort) {
  const records = await port.list();
  const paths = ["/reviews"];
  const prs = new Set<number>();
  for (const record of records) {
    const pr = record.run.pr;
    if (typeof pr !== "number") continue;
    if (!prs.has(pr)) {
      prs.add(pr);
      paths.push(`/reviews/pr/${pr}`);
    }
    paths.push(`/reviews/pr/${pr}/runs/${record.run.run_id}`);
  }
  return paths;
}
