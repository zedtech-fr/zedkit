import type { ReviewPort } from "../ports/review-port";

export async function listReviewPrParamsFrom(port: ReviewPort) {
  const records = await port.list();
  return records.map((record) => ({ n: String(record.number) }));
}

export async function listReviewRunParamsFrom(port: ReviewPort) {
  const records = await port.list();
  return records.flatMap((record) =>
    record.runs.map((run) => ({ n: String(record.number), id: run.id })),
  );
}

export async function listReviewSitemapPathsFrom(port: ReviewPort) {
  const records = await port.list();
  const paths = ["/reviews"];
  for (const record of records) {
    paths.push(`/reviews/pr/${record.number}`);
    for (const run of record.runs) {
      paths.push(`/reviews/pr/${record.number}/runs/${run.id}`);
    }
  }
  return paths;
}
