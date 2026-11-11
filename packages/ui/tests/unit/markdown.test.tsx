import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Markdown } from "#index.js";

afterEach(() => {
  cleanup();
});

function compactHref(href: string): string {
  return href.replace(/\s+/g, "").replace(/&#0*58;|&colon;/gi, ":");
}

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
    const inline = container.querySelector("p code");
    expect(inline?.textContent).toBe("token");
    expect(inline?.className).toContain("px-code-inline");
    expect(inline?.className).not.toContain("px-badge-inline");
    const fence = container.querySelector("pre > code");
    expect(fence?.textContent).toContain('const fence = "ok";');
    expect(fence?.className).not.toContain("px-code-inline");
    expect(fence?.className).not.toContain("px-badge-inline");
    expect(fence?.className).not.toContain("bg-muted");
    expect(fence?.className).not.toContain("rounded-md");
    expect(container.querySelector("pre")?.className).toContain("whitespace-pre-wrap");
    expect(container.querySelector("pre")?.className).toContain("wrap-anywhere");
    expect(container.querySelector("pre")?.className).not.toContain("overflow-x-auto");
  });

  it("wraps a long unbroken fence token", () => {
    const token = "a".repeat(200);
    const { container } = render(<Markdown>{`\`\`\`\n${token}\n\`\`\``}</Markdown>);
    const pre = container.querySelector("pre");
    expect(pre?.textContent).toContain(token);
    expect(pre?.className).toContain("wrap-anywhere");
    expect(pre?.className).toContain("whitespace-pre-wrap");
  });

  it("paints https links with info colour and rel defaults", () => {
    render(<Markdown>{"[docs](https://example.com)"}</Markdown>);
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.className).toContain("text-info");
    expect(link.className).toContain("link-offset");
    expect(link.className).toContain("focus-ring");
    expect(link.className).not.toContain("text-primary");
  });

  it("does not render raw HTML", () => {
    const { container } = render(<Markdown>{"<script>alert(1)</script>"}</Markdown>);
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toMatch(/<script/i);
  });

  it("does not emit an onerror attribute from a raw img", () => {
    const { container } = render(<Markdown>{"<img src=x onerror=alert(1)>"}</Markdown>);
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it.each([
    ["javascript:", "[x](javascript:alert(1))", /javascript:/i],
    ["data:", "[x](data:text/html,<script>alert(1)</script>)", /data:/i],
    ["padded mixed-case javascript:", "[x](< JaVaScRiPt:alert(1)>)", /javascript:/i],
    ["padded mixed-case data:", "[x](< DaTa:text/html,<script>alert(1)</script>)", /data:/i],
    ["tab-in-scheme javascript:", "[x](<java\tscript:alert(1)>)", /javascript:/i],
    ["vbscript:", "[x](vbscript:msgbox(1))", /vbscript:/i],
    ["entity-encoded javascript:", "[x](javascript&#58;alert(1))", /javascript:/i],
  ])("does not keep a %s href", (_label, source, banned) => {
    const { container } = render(<Markdown>{source}</Markdown>);
    expect(container.querySelector("[data-slot=markdown]")).toBeTruthy();
    expect(container.textContent).toContain("x");
    const anchors = [...container.querySelectorAll("a")];
    expect(anchors.some((anchor) => banned.test(compactHref(anchor.getAttribute("href") ?? "")))).toBe(false);
    expect(compactHref(container.innerHTML)).not.toMatch(banned);
  });

  it("keeps an https markdown image src", () => {
    const { container } = render(<Markdown>{"![diagram](https://example.com/a.png)"}</Markdown>);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/a.png");
    expect(img?.getAttribute("alt")).toBe("diagram");
    expect(img?.className).toContain("max-w-full");
    expect(img?.className).toContain("h-auto");
  });

  it("keeps an http markdown image src", () => {
    const { container } = render(<Markdown>{"![diagram](http://example.com/a.png)"}</Markdown>);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("http://example.com/a.png");
  });

  it("does not keep a data: markdown image src", () => {
    const { container } = render(
      <Markdown>{"![x](data:image/gif;base64,R0lGODlhAQABAAAAACw=)"}</Markdown>,
    );
    expect(container.querySelector("[data-slot=markdown]")).toBeTruthy();
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      expect(compactHref(img.getAttribute("src") ?? "")).not.toMatch(/^data:/i);
    }
  });

  it("does not keep a javascript: markdown image src", () => {
    const { container } = render(<Markdown>{"![x](javascript:alert(1))"}</Markdown>);
    expect(container.querySelector("img")?.getAttribute("src") ?? null).toBeNull();
  });

  it("renders an empty wrapper with data-slot and merged className", () => {
    const { container } = render(<Markdown className="font-mono">{""}</Markdown>);
    const host = container.querySelector("[data-slot=markdown]");
    expect(host?.getAttribute("data-slot")).toBe("markdown");
    expect(host?.className).toContain("font-mono");
    expect(host?.className).toContain("content-shrink");
  });
});
