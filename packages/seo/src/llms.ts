/** Normalize CMS-stored llms.txt content (CRLF + surrounding blank lines). */
export function normalizeLlmsBody(body: string): string {
  return body.replace(/\r\n/g, "\n").trim();
}

export interface LlmsTextResponseOptions {
  /** Normalized body; empty answers 404 (nothing published yet). */
  body: string;
  /** Cache for served bodies. Defaults to one minute. */
  cacheControl?: string;
}

/** `text/plain` Response for an llms.txt route (200 with body, else 404). */
export function llmsTextResponse(options: LlmsTextResponseOptions): Response {
  const body = normalizeLlmsBody(options.body);
  if (body.length === 0) {
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return new Response(`${body}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": options.cacheControl ?? "public, max-age=60",
    },
  });
}

export interface LlmsFullSection {
  title: string;
  body: string;
}

/** Join titled sections into one llms-full document (skips empty bodies). */
export function buildLlmsFull(sections: LlmsFullSection[]): string {
  return sections
    .map((section) => ({ title: section.title.trim(), body: normalizeLlmsBody(section.body) }))
    .filter((section) => section.title.length > 0 && section.body.length > 0)
    .map((section) => `# ${section.title}\n\n${section.body}`)
    .join("\n\n");
}
