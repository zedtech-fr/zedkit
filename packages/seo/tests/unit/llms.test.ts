import { describe, expect, it } from "vitest";

import { buildLlmsFull, llmsTextResponse, normalizeLlmsBody } from "#index.js";

describe("normalizeLlmsBody", () => {
  it("normalizes CRLF and trims blank edges", () => {
    expect(normalizeLlmsBody("\r\n# Title\r\n\r\nBody\r\n\r\n")).toBe("# Title\n\nBody");
  });
});

describe("llmsTextResponse", () => {
  it("serves the body as text/plain with cache", async () => {
    const response = llmsTextResponse({ body: "# Title\n\nBody\n" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(await response.text()).toBe("# Title\n\nBody\n");
  });

  it("answers 404 without store when empty", async () => {
    const response = llmsTextResponse({ body: "  \n " });
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("Not Found");
  });
});

describe("buildLlmsFull", () => {
  it("joins titled sections and skips empties", () => {
    expect(
      buildLlmsFull([
        { title: "Guide", body: "Read this." },
        { title: "Empty", body: "  " },
        { title: "", body: "No title." },
      ]),
    ).toBe("# Guide\n\nRead this.");
  });
});
