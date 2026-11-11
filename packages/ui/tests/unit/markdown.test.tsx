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
    const fence = container.querySelector("pre > code");
    expect(fence?.textContent).toContain('const fence = "ok";');
    expect(container.querySelector("script")).toBeNull();
  });

  it("paints https links with info colour and rel defaults", () => {
    render(<Markdown>{"[docs](https://example.com)"}</Markdown>);
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
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

  it("does not keep a javascript: href", () => {
    const { container } = render(<Markdown>{"[x](javascript:alert(1))"}</Markdown>);
    for (const anchor of container.querySelectorAll("a")) {
      expect(anchor.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    }
  });

  it("does not keep a data: href", () => {
    const { container } = render(
      <Markdown>{"[x](data:text/html,<script>alert(1)</script>)"}</Markdown>,
    );
    for (const anchor of container.querySelectorAll("a")) {
      expect(anchor.getAttribute("href") ?? "").not.toMatch(/^data:/i);
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
