import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AgentConsole,
  ZedkitUiProvider,
  zedkitUiMessagesFr,
  type AgentConsoleDecision,
  type AgentConsoleItem,
  type AgentConsoleProps,
  type AgentConsoleRun,
} from "#index.js";

import { stubDrawerJsdom } from "./drawer-fixture.js";

const STARTED_AT = Date.UTC(2026, 0, 15, 10, 0, 0);
const LAST_ACTIVITY_AT = STARTED_AT + 120_000;

const RUN: AgentConsoleRun = {
  pr: 42,
  sha: "abcdef1234567890",
  engineLabel: "kit-engine",
  durationMs: 377_000,
  reviewSize: "8 files",
  verdict: "approve",
  confidence: 9,
  postedReviewHref: "https://example.com/review/42",
};

const DECISION: AgentConsoleDecision = {
  verdict: "approve",
  confidence: 9,
  posted: true,
  postedReviewHref: "https://example.com/review/42",
  summary: "Ship the console as mapped props.",
  mustChange: [{ text: "Keep duration in milliseconds." }],
  notes: [{ text: "Tone down the export warning.", tag: "downgraded" }],
  dismissed: ["Old lint warning"],
  firstPass: {
    verdict: "request changes",
    confidence: 6,
    findings: [
      { id: "keep-1", text: "Name the empty pane.", disposition: "kept" },
      { id: "down-1", text: "Tone down the export warning.", disposition: "downgraded" },
      { id: "drop-1", text: "Drop the style nit.", disposition: "dismissed" },
    ],
  },
  secondPass: {
    model: "docs-reviewer",
    blocksMerge: false,
    summary: "No merge block.",
  },
};

function item(partial: Partial<AgentConsoleItem> & Pick<AgentConsoleItem, "id" | "name" | "kind">): AgentConsoleItem {
  return {
    status: "done",
    model: "docs",
    durationMs: 120_000,
    toolCount: 2,
    startedAt: STARTED_AT,
    lastActivityAt: LAST_ACTIVITY_AT,
    tokensIn: 12,
    tokensOut: 4,
    running: false,
    entries: [],
    ...partial,
  };
}

const ITEMS: AgentConsoleItem[] = [
  item({
    id: "observer-1",
    name: "Watcher",
    kind: "observer",
    toolCount: 0,
  }),
  item({
    id: "gate-1",
    name: "Merge gate",
    kind: "gate",
    status: "passed",
    toolCount: 1,
  }),
  item({
    id: "mystery-1",
    name: "Mystery agent",
    kind: "mystery",
    model: "other",
  }),
  item({
    id: "lens-1",
    name: "Docs agent",
    kind: "lens",
    status: "running",
    running: true,
    streamLabel: "Writing the note",
    toolCount: 3,
    entries: [
      { id: "lens-msg", kind: "message", text: "Lens started the docs pass." },
    ],
  }),
  item({
    id: "second-1",
    name: "Merge check",
    kind: "second_pass",
    model: "docs-reviewer",
  }),
  item({
    id: "main-1",
    name: "Coordinator",
    kind: "main",
    durationMs: 377_000,
    toolCount: 4,
    entries: [
      { id: "tool-a", kind: "tool", name: "searchDocs", body: "query: console" },
      { id: "tool-b", kind: "tool", name: "readFile", body: "path: catalog.md" },
      { id: "think-1", kind: "reasoning", text: "Checking the export map." },
      { id: "msg-1", kind: "message", text: "The console can mount from mapped props." },
    ],
  }),
];

function renderConsole(props: Partial<AgentConsoleProps> = {}) {
  return render(<AgentConsole run={RUN} items={ITEMS} decision={DECISION} {...props} />);
}

function asideOf(container: HTMLElement): HTMLElement {
  const aside = container.querySelector("aside");
  if (!aside) throw new Error("missing AppShell aside");
  return aside;
}

function groupLabels(container: HTMLElement): string[] {
  return [...asideOf(container).querySelectorAll("[data-slot='sidebar-nav-group-trigger']")].map(
    (node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "",
  );
}

function mockMainScroller(main: HTMLElement) {
  const metrics = { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 };
  const scrollTo = vi.fn((arg?: ScrollToOptions | number) => {
    const top = typeof arg === "object" ? arg.top : undefined;
    if (typeof top === "number") metrics.scrollTop = top;
  });
  main.scrollTo = scrollTo as typeof main.scrollTo;
  Object.defineProperty(main, "scrollHeight", { configurable: true, get: () => metrics.scrollHeight });
  Object.defineProperty(main, "clientHeight", { configurable: true, get: () => metrics.clientHeight });
  Object.defineProperty(main, "scrollTop", {
    configurable: true,
    get: () => metrics.scrollTop,
    set: (value: number) => {
      metrics.scrollTop = value;
    },
  });
  return metrics;
}

describe("AgentConsole", () => {
  const originalScrollTo = Element.prototype.scrollTo;

  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    Element.prototype.scrollTo = originalScrollTo;
    stubDrawerJsdom();
  });

  it("groups rows in ticket order and keeps unknown kinds", () => {
    const { container } = renderConsole();
    expect(groupLabels(container)).toEqual([
      "Main flow",
      "Review lenses",
      "Second pass",
      "Observers",
      "Gates",
      "mystery",
    ]);
    expect(within(asideOf(container)).getByRole("button", { name: "Mystery agent" })).not.toBeNull();
  });

  it("shows the workflow group only when that kind is present", () => {
    const { container } = renderConsole({
      items: [item({ id: "wf-1", name: "Release", kind: "workflow" })],
      decision: null,
    });
    expect(groupLabels(container)).toEqual(["Workflows"]);
    expect(groupLabels(container)).not.toContain("Main flow");
    expect(within(asideOf(container)).getByRole("button", { name: "Release" })).not.toBeNull();
  });

  it("does not show an empty pane when items exist and defaults to main", () => {
    const { container } = renderConsole();
    expect(container.querySelector("[data-slot='empty-state']")).toBeNull();
    expect(screen.getByText("Final decision")).not.toBeNull();
    expect(screen.getByText("The console can mount from mapped props.")).not.toBeNull();
  });

  it("opens a lens item instead of the decision card", async () => {
    const user = userEvent.setup();
    const { container } = renderConsole();
    await user.click(within(asideOf(container)).getByRole("button", { name: "Docs agent" }));
    expect(screen.queryByText("Final decision")).toBeNull();
    expect(screen.getByText("Lens started the docs pass.")).not.toBeNull();
    expect(screen.queryByText("The console can mount from mapped props.")).toBeNull();
  });

  it("shows EmptyState when there are no items", () => {
    const { container } = renderConsole({ items: [], decision: null });
    expect(container.querySelector("[data-slot='empty-state']")).not.toBeNull();
    expect(screen.getByText("No agents")).not.toBeNull();
    expect(screen.queryByText("Final decision")).toBeNull();
  });

  it("leads the main flow with a folded first-pass", () => {
    const { container } = renderConsole();
    expect(screen.getByText("Final decision")).not.toBeNull();
    expect(screen.getAllByText("9/10").length).toBeGreaterThan(0);
    expect(screen.queryByText("90")).toBeNull();
    expect(screen.getByText("Ship the console as mapped props.")).not.toBeNull();
    expect(screen.getByText("Keep duration in milliseconds.")).not.toBeNull();
    expect(screen.getAllByText("Tone down the export warning.").length).toBeGreaterThan(0);
    expect(screen.getByText("Old lint warning")).not.toBeNull();
    expect(screen.getByText("docs-reviewer")).not.toBeNull();
    expect(screen.getByText("Does not block merge")).not.toBeNull();
    expect(screen.getByText("Kept")).not.toBeNull();
    expect(screen.getAllByText("Downgraded").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dismissed").length).toBeGreaterThan(0);
    const firstPass = screen.getByText(/Superseded/).closest("details");
    expect(firstPass).toBeInstanceOf(HTMLDetailsElement);
    expect((firstPass as HTMLDetailsElement).open).toBe(false);
    const card = container.querySelector("[data-slot='agent-console-decision']");
    if (!(card instanceof HTMLElement)) throw new Error("missing decision card");
    expect(within(card).getByRole("link", { name: "Posted review" }).getAttribute("href")).toBe(
      "https://example.com/review/42",
    );
    const run = container.querySelector("[data-slot='agent-console-run']");
    if (!(run instanceof HTMLElement)) throw new Error("missing run");
    expect(within(run).getByRole("link", { name: "Posted review" }).getAttribute("href")).toBe(
      "https://example.com/review/42",
    );
  });

  it("shows stats and a tool burst on the selected item", () => {
    const { container } = renderConsole();
    expect(screen.getByText("Started")).not.toBeNull();
    expect(screen.getAllByText("6m 17s").length).toBeGreaterThan(0);
    expect(screen.getByText("Tool calls")).not.toBeNull();
    expect(screen.getByText("12 in / 4 out")).not.toBeNull();
    expect(screen.getByText("Last activity")).not.toBeNull();
    expect(container.querySelector("[data-slot='transcript-burst']")).not.toBeNull();
    expect(screen.getByText("searchDocs")).not.toBeNull();
    expect(screen.getByText("Checking the export map.")).not.toBeNull();
  });

  it("shows a live pulse and stream label on a running item", async () => {
    const user = userEvent.setup();
    const { container } = renderConsole();
    await user.click(within(asideOf(container)).getByRole("button", { name: "Docs agent" }));
    expect(container.querySelector("[data-slot='live-pulse']")).not.toBeNull();
    expect(container.querySelector("[data-slot='stream-status']")?.textContent).toContain("Writing the note");
  });

  it("hides Jump to latest while latched and shows it after unlatch", async () => {
    const { container } = renderConsole();
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    mockMainScroller(main);
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
    main.scrollTop = 100;
    act(() => {
      main.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByRole("button", { name: "Jump to latest" })).not.toBeNull();
  });

  it("opens the same sidebar list from a labelled drawer trigger", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    renderConsole();
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Agents" }));
    const dialog = screen.getByRole("dialog", { name: "Main navigation" });
    expect(within(dialog).getByRole("button", { name: "Coordinator" })).not.toBeNull();
    expect(within(dialog).getByRole("button", { name: "Docs agent" })).not.toBeNull();
  });

  it("renders a newly passed transcript entry without a network", () => {
    const { rerender } = renderConsole();
    const extra: AgentConsoleItem[] = ITEMS.map((row) =>
      row.id === "main-1"
        ? {
            ...row,
            entries: [...row.entries, { id: "msg-2", kind: "message", text: "A later line landed." }],
          }
        : row,
    );
    rerender(<AgentConsole run={RUN} items={extra} decision={DECISION} />);
    expect(screen.getByText("A later line landed.")).not.toBeNull();
  });

  it("keeps a controlled selectedId and reports clicks", async () => {
    const user = userEvent.setup();
    const onSelectedIdChange = vi.fn();
    const { container, rerender } = renderConsole({
      selectedId: "lens-1",
      onSelectedIdChange,
    });
    expect(screen.getByText("Lens started the docs pass.")).not.toBeNull();
    expect(screen.queryByText("Final decision")).toBeNull();
    await user.click(within(asideOf(container)).getByRole("button", { name: "Coordinator" }));
    expect(onSelectedIdChange).toHaveBeenCalledWith("main-1");
    expect(screen.getByText("Lens started the docs pass.")).not.toBeNull();
    expect(screen.queryByText("Final decision")).toBeNull();
    rerender(
      <AgentConsole
        run={RUN}
        items={ITEMS}
        decision={DECISION}
        selectedId="main-1"
        onSelectedIdChange={onSelectedIdChange}
      />,
    );
    expect(screen.getByText("Final decision")).not.toBeNull();
  });

  it("falls back when defaultSelectedId is missing from items", () => {
    renderConsole({ defaultSelectedId: "ghost" });
    expect(screen.getByText("The console can mount from mapped props.")).not.toBeNull();
    expect(screen.getByText("Final decision")).not.toBeNull();
  });

  it("does not show a passed decision when no main item is selected", () => {
    renderConsole({
      items: [
        item({
          id: "lens-1",
          name: "Docs agent",
          kind: "lens",
          entries: [{ id: "lens-msg", kind: "message", text: "Lens started the docs pass." }],
        }),
      ],
    });
    expect(screen.queryByText("Final decision")).toBeNull();
    expect(screen.getByText("Lens started the docs pass.")).not.toBeNull();
  });

  it("does not keep a javascript: postedReviewHref", () => {
    const { container } = renderConsole({
      run: { ...RUN, postedReviewHref: "javascript:alert(1)" },
      decision: { ...DECISION, postedReviewHref: "javascript:alert(1)" },
    });
    const hrefs = [...container.querySelectorAll("a")].map((node) => node.getAttribute("href") ?? "");
    expect(hrefs.some((href) => /javascript:/i.test(href))).toBe(false);
    expect(screen.queryByRole("link", { name: "Posted review" })).toBeNull();
  });

  it("does not paint a blocking verdict as success", () => {
    const { container } = renderConsole({ run: { ...RUN, verdict: "request changes" } });
    const run = container.querySelector("[data-slot='agent-console-run']");
    if (!(run instanceof HTMLElement)) throw new Error("missing run");
    expect(within(run).getByText("request changes").className).not.toContain("badge-soft-success");
  });

  it("uses a danger status dot for a failed item", () => {
    const { container } = renderConsole({
      items: [item({ id: "main-1", name: "Coordinator", kind: "main", status: "failed" })],
    });
    expect(asideOf(container).innerHTML).toContain("bg-destructive");
  });

  it("uses French chrome and keeps fixture item names", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <AgentConsole run={RUN} items={ITEMS} decision={DECISION} />
      </ZedkitUiProvider>,
    );
    expect(screen.getAllByText("Flux principal").length).toBeGreaterThan(0);
    expect(screen.getByText("Décision finale")).not.toBeNull();
    expect(screen.getAllByText("Coordinator").length).toBeGreaterThan(0);
    expect(screen.queryByText("Final decision")).toBeNull();
  });
});
