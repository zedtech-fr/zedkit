import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Markdown } from "#index.js";

afterEach(() => {
  cleanup();
});

describe("Markdown", () => {
  it("renders CommonMark structure including a fenced code block", () => {
    const { container } = render(
      <Markdown>{`# Title

A paragraph.

- item

Inline \`token\`.

\`\`\`
const fence = "ok";
\`\`\`
`}</Markdown>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeTruthy();
    expect(screen.getByText("A paragraph.")).toBeTruthy();
    expect(screen.getByText("item").closest("li")).toBeTruthy();
    expect(container.querySelector("p code")?.textContent).toBe("token");
    expect(container.querySelector("p code")?.className).toContain("px-badge-inline");
    const fence = container.querySelector("pre > code");
    expect(fence?.textContent).toContain('const fence = "ok";');
    expect(container.querySelector("pre")?.className).toContain("whitespace-pre-wrap");
    expect(container.querySelector("pre")?.className).not.toContain("overflow-x-auto");
    expect(container.querySelector("script")).toBeNull();
  });

  it("paints https links with info colour and rel defaults", () => {
    render(<Markdown>{"[docs](https://example.com)"}</Markdown>);
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.className).toContain("text-info");
    expect(link.className).toContain("link-offset");
    expect(link.className).not.toContain("text-primary");
  });

  it("does not emit a script node from raw HTML", () => {
    const { container } = render(<Markdown>{"<script>alert(1)</script>"}</Markdown>);
    expect(container.querySelector("script")).toBeNull();
  });

  it("does not emit an onerror attribute from a raw img", () => {
    const { container } = render(<Markdown>{"<img src=x onerror=alert(1)>"}</Markdown>);
    expect(container.querySelector("[onerror]")).toBeNull();
  });

  it.each([
    ["javascript:", "[x](javascript:alert(1))", /^javascript:/i],
    ["data:", "[x](data:text/html,<script>alert(1)</script>)", /^data:/i],
    ["padded mixed-case javascript:", "[x](< JaVaScRiPt:alert(1)>)", /^javascript:/i],
    ["padded mixed-case data:", "[x](< DaTa:text/html,<script>alert(1)</script>)", /^data:/i],
  ])("does not keep a %s href", (_label, source, banned) => {
    const { container } = render(<Markdown>{source}</Markdown>);
    for (const anchor of container.querySelectorAll("a")) {
      expect(anchor.getAttribute("href") ?? "").not.toMatch(banned);
    }
  });

  it("keeps an https markdown image src", () => {
    const { container } = render(<Markdown>{"![diagram](https://example.com/a.png)"}</Markdown>);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://example.com/a.png");
    expect(img?.getAttribute("alt")).toBe("diagram");
  });

  it("does not keep a data: markdown image src", () => {
    const { container } = render(
      <Markdown>{"![x](data:image/gif;base64,R0lGODlhAQABAAAAACw=)"}</Markdown>,
    );
    for (const img of container.querySelectorAll("img")) {
      expect(img.getAttribute("src") ?? "").not.toMatch(/^data:/i);
    }
  });

  it("renders an empty wrapper with data-slot and merged className", () => {
    const { container } = render(<Markdown className="font-mono">{""}</Markdown>);
    const host = container.querySelector("[data-slot=markdown]");
    expect(host).toBeTruthy();
    expect(host?.tagName).toBe("DIV");
    expect(host?.className).toContain("font-mono");
  });
});
