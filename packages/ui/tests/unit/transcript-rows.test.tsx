import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  AssistantMessage,
  StatusLabel,
  ThinkingRow,
  ToolCallRow,
  TranscriptBurst,
  groupToolCallBursts,
} from "#index.js";

afterEach(cleanup);

describe("groupToolCallBursts", () => {
  it("returns an empty list for an empty input", () => {
    expect(groupToolCallBursts([])).toEqual([]);
  });

  it("keeps a single tool as an item, not a burst", () => {
    expect(groupToolCallBursts([{ kind: "tool", name: "listInvoices" }])).toEqual([
      { type: "item", item: { kind: "tool", name: "listInvoices" } },
    ]);
  });

  it("groups two consecutive tools into one burst", () => {
    const items = [
      { kind: "tool", name: "searchDocs" },
      { kind: "tool", name: "readFile" },
    ];
    expect(groupToolCallBursts(items)).toEqual([{ type: "burst", items }]);
  });

  it("does not merge tools split by thinking", () => {
    expect(
      groupToolCallBursts([
        { kind: "tool", name: "a" },
        { kind: "thinking" },
        { kind: "tool", name: "b" },
      ]),
    ).toEqual([
      { type: "item", item: { kind: "tool", name: "a" } },
      { type: "item", item: { kind: "thinking" } },
      { type: "item", item: { kind: "tool", name: "b" } },
    ]);
  });

  it("splits two bursts around a non-tool item", () => {
    const first = [
      { kind: "tool", name: "a" },
      { kind: "tool", name: "b" },
    ];
    const second = [
      { kind: "tool", name: "c" },
      { kind: "tool", name: "d" },
    ];
    expect(
      groupToolCallBursts([
        ...first,
        { kind: "assistant" },
        ...second,
      ]),
    ).toEqual([
      { type: "burst", items: first },
      { type: "item", item: { kind: "assistant" } },
      { type: "burst", items: second },
    ]);
  });

  it("leaves a list of non-tools as items", () => {
    expect(
      groupToolCallBursts([{ kind: "thinking" }, { kind: "assistant" }]),
    ).toEqual([
      { type: "item", item: { kind: "thinking" } },
      { type: "item", item: { kind: "assistant" } },
    ]);
  });

  it("treats kind Tool as a non-tool", () => {
    expect(groupToolCallBursts([{ kind: "Tool" }])).toEqual([
      { type: "item", item: { kind: "Tool" } },
    ]);
  });

  it("does not mutate the input array", () => {
    const items = [{ kind: "tool", name: "a" }, { kind: "thinking" }];
    const snapshot = items.map((item) => ({ ...item }));
    groupToolCallBursts(items);
    expect(items).toEqual(snapshot);
  });
});

describe("ToolCallRow", () => {
  it("is a closed native details disclosure with a 44px summary", () => {
    const { container } = render(
      <ToolCallRow name="listInvoices">{"status: open"}</ToolCallRow>,
    );
    const row = container.querySelector("details");
    const trigger = container.querySelector("summary");
    expect(row?.tagName).toBe("DETAILS");
    expect(row?.getAttribute("data-slot")).toBe("tool-call-row");
    expect(row?.open).toBe(false);
    expect(trigger?.getAttribute("data-slot")).toBe("tool-call-row-trigger");
    expect(trigger?.className).toContain("min-h-target");
    expect(trigger?.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("honours the open prop", () => {
    const { container } = render(
      <ToolCallRow name="listInvoices" open>
        {"status: open"}
      </ToolCallRow>,
    );
    expect(container.querySelector("details")?.open).toBe(true);
    expect(screen.getByText("status: open")).not.toBeNull();
  });

  it("reveals the body when the summary is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToolCallRow name="listInvoices">{"status: open"}</ToolCallRow>,
    );
    const row = container.querySelector("details");
    expect(row?.open).toBe(false);
    await user.click(screen.getByText("listInvoices"));
    expect(row?.open).toBe(true);
    expect(screen.getByText("status: open")).not.toBeNull();
  });

  it("omits status and duration wrappers when those props are absent", () => {
    const { container } = render(<ToolCallRow name="listInvoices">body</ToolCallRow>);
    expect(container.querySelector('[data-slot="tool-call-row-status"]')).toBeNull();
    expect(container.querySelector('[data-slot="tool-call-row-duration"]')).toBeNull();
  });

  it("exposes status, duration, and the truncated name title", () => {
    const { container } = render(
      <ToolCallRow
        name="listInvoices"
        status={<StatusLabel tone="saved">Done</StatusLabel>}
        duration="1m 04s"
      >
        body
      </ToolCallRow>,
    );
    const statusHost = container.querySelector('[data-slot="tool-call-row-status"]');
    const durationHost = container.querySelector('[data-slot="tool-call-row-duration"]');
    expect(statusHost?.getAttribute("aria-hidden")).toBeNull();
    expect(durationHost?.getAttribute("aria-hidden")).toBeNull();
    expect(durationHost?.textContent).toBe("1m 04s");
    expect(screen.getByRole("status").textContent).toContain("Done");
    expect(container.querySelector("summary > span")?.getAttribute("title")).toBe("listInvoices");
  });

  it("renders a zero status and still names the summary from the tool name", () => {
    const { container } = render(
      <ToolCallRow name="listInvoices" status={0}>
        body
      </ToolCallRow>,
    );
    expect(container.querySelector('[data-slot="tool-call-row-status"]')?.textContent).toBe("0");
    expect(screen.getByText("listInvoices")).not.toBeNull();
  });

  it("renders a details row when the name is empty", () => {
    const { container } = render(<ToolCallRow name="">body</ToolCallRow>);
    expect(container.querySelector("details")?.tagName).toBe("DETAILS");
    expect(container.querySelector("details")?.open).toBe(false);
  });

  it("merges className onto the details host", () => {
    const { container } = render(
      <ToolCallRow name="listInvoices" className="font-mono">
        body
      </ToolCallRow>,
    );
    const row = container.querySelector('[data-slot="tool-call-row"]');
    expect(row?.className).toContain("font-mono");
    expect(row?.className).toContain("group");
  });
});

describe("ThinkingRow", () => {
  it("forwards text to StreamText and announces by default", () => {
    render(<ThinkingRow text="Checking open invoices." />);
    const node = screen.getByRole("status");
    expect(node.getAttribute("data-slot")).toBe("stream-text");
    expect(node.textContent).toBe("Checking open invoices.");
    expect(document.querySelector('[data-slot="thinking-row"]')).not.toBeNull();
  });

  it("skips its own live region when live is false", () => {
    render(<ThinkingRow text="Checking open invoices." live={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelector('[data-slot="stream-text"]')?.textContent).toBe(
      "Checking open invoices.",
    );
  });

  it("renders nothing when the draft is still empty", () => {
    const { container } = render(<ThinkingRow text="" />);
    expect(container.textContent).toBe("");
    expect(container.querySelector('[data-slot="thinking-row"]')).toBeNull();
  });
});

describe("AssistantMessage", () => {
  it("wraps sanitized Markdown and paints an info-coloured same-tab link", () => {
    const { container } = render(
      <AssistantMessage>{"[docs](https://example.com)"}</AssistantMessage>,
    );
    expect(container.querySelector('[data-slot="assistant-message"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="markdown"]')).not.toBeNull();
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.className).toContain("text-info");
  });

  it("drops a javascript: href from the source string", () => {
    const { container } = render(
      <AssistantMessage>{"[x](javascript:alert(1))"}</AssistantMessage>,
    );
    expect(container.querySelector("[data-slot=assistant-message]")).toBeTruthy();
    const anchors = [...container.querySelectorAll("a")];
    expect(anchors.some((anchor) => /javascript:/i.test(anchor.getAttribute("href") ?? ""))).toBe(
      false,
    );
  });
});

describe("TranscriptBurst", () => {
  it("hosts grouped rows without a border", () => {
    const { container } = render(
      <TranscriptBurst>
        <ToolCallRow name="searchDocs">query</ToolCallRow>
        <ToolCallRow name="readFile">path</ToolCallRow>
      </TranscriptBurst>,
    );
    const host = container.querySelector('[data-slot="transcript-burst"]');
    expect(host).not.toBeNull();
    expect(host?.getAttribute("role")).toBe("group");
    expect(host?.className).toContain("gap-stack-sm");
    expect(host?.className).not.toMatch(/\bborder\b/);
  });
});
