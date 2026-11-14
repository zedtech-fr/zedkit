import { tryCatch, tryCatchAsync } from "@zedtech/zedkit-core";
import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AgentConsole,
  ZedkitUiProvider,
  zedkitUiMessagesEn,
  zedkitUiMessagesFr,
  type AgentConsoleDecision,
  type AgentConsoleItem,
  type AgentConsoleProps,
  type AgentConsoleRun,
} from "#index.js";
import {
  compactTokenCount,
  formatStarted,
  groupLabel,
  statusLabel,
  statusTone,
  verdictLabel,
} from "#layout/agent-console-model.js";

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
      "mystery",
    ]);
    expect(within(asideOf(container)).getByRole("button", { name: "Mystery agent" })).not.toBeNull();
  });

  it("folds gates into Review lenses and subagents into Helpers", () => {
    const { container } = renderConsole({
      items: [
        item({ id: "gate-1", name: "Merge gate", kind: "gate" }),
        item({ id: "sub-1", name: "Sidekick", kind: "subagent" }),
      ],
      decision: null,
    });
    expect(groupLabels(container)).toEqual(["Review lenses", "Helpers"]);
    expect(within(asideOf(container)).getByRole("button", { name: "Merge gate" })).not.toBeNull();
    expect(within(asideOf(container)).getByRole("button", { name: "Sidekick" })).not.toBeNull();
  });

  it("shows name, status, model, duration, and tool count on each row", () => {
    const { container } = renderConsole();
    const row = within(asideOf(container)).getByRole("button", { name: "Coordinator" });
    const scoped = within(row);
    expect(scoped.getByText("Coordinator")).not.toBeNull();
    expect(scoped.getByText("Done")).not.toBeNull();
    expect(scoped.getByText("docs")).not.toBeNull();
    expect(scoped.getByText("6m 17s")).not.toBeNull();
    expect(scoped.getByText("4 tools")).not.toBeNull();
    expect(within(asideOf(container)).getByRole("button", { name: "Merge gate" }).textContent).toContain(
      "1 tool",
    );
    expect(row.getAttribute("aria-current")).toBe("true");
  });

  it("shows the live activity instead of the status on a running row", () => {
    const { container } = renderConsole();
    const row = within(asideOf(container)).getByRole("button", { name: "Docs agent" });
    expect(within(row).getByText("Writing the note")).not.toBeNull();
    expect(within(row).queryByText("Running")).toBeNull();
    expect(row.getAttribute("aria-current")).toBeNull();
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
    expect(screen.getAllByText("docs-reviewer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Does not block merge").length).toBeGreaterThan(0);
    expect(screen.getByText("Kept")).not.toBeNull();
    expect(screen.getAllByText("Downgraded").length).toBeGreaterThan(0);
    expect(screen.getByText("Dismissed (1)")).not.toBeNull();
    expect(screen.getByText("Dismissed (1)").classList.contains("min-h-target")).toBe(true);
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

  it("shows a live pulse in the run header while the run is live", () => {
    const live = renderConsole({ run: { ...RUN, running: true } });
    const run = live.container.querySelector("[data-slot='agent-console-run']");
    if (!(run instanceof HTMLElement)) throw new Error("missing run");
    expect(run.querySelector("[data-slot='live-pulse']")).not.toBeNull();
    live.unmount();
    const done = renderConsole({ run: { ...RUN, running: false } });
    const doneRun = done.container.querySelector("[data-slot='agent-console-run']");
    if (!(doneRun instanceof HTMLElement)) throw new Error("missing run");
    expect(doneRun.querySelector("[data-slot='live-pulse']")).toBeNull();
  });

  it("reads the decision flow from first pass to posted", () => {
    const { container } = renderConsole();
    const card = container.querySelector("[data-slot='agent-console-decision']");
    if (!(card instanceof HTMLElement)) throw new Error("missing decision card");
    const scoped = within(card);
    expect(scoped.getByText("First pass")).not.toBeNull();
    expect(scoped.getAllByText("REQUEST CHANGES").length).toBeGreaterThan(0);
    expect(scoped.getAllByText("6/10").length).toBeGreaterThan(0);
    expect(scoped.getAllByText(/Second pass/).length).toBeGreaterThan(0);
    expect(scoped.getAllByText("docs-reviewer").length).toBeGreaterThan(0);
    expect(scoped.getAllByText("Does not block merge").length).toBeGreaterThan(0);
    expect(scoped.getAllByText("Posted").length).toBeGreaterThan(0);
    expect(scoped.getAllByText("APPROVE").length).toBeGreaterThan(0);
  });

  it("omits flow segments the decision does not have", () => {
    const { container } = renderConsole({
      decision: { ...DECISION, firstPass: null, secondPass: null },
    });
    const card = container.querySelector("[data-slot='agent-console-decision']");
    if (!(card instanceof HTMLElement)) throw new Error("missing decision card");
    const scoped = within(card);
    expect(scoped.queryByText("First pass")).toBeNull();
    expect(scoped.queryByText(/Second pass/)).toBeNull();
    expect(scoped.getAllByText("Posted").length).toBeGreaterThan(0);
    expect(scoped.getAllByText("APPROVE").length).toBeGreaterThan(0);
  });

  it("names the empty must-change state instead of hiding the section", () => {
    renderConsole({ decision: { ...DECISION, mustChange: [] } });
    expect(screen.getByText("Nothing to change before merge")).not.toBeNull();
  });

  it("folds dismissed findings behind a count", () => {
    renderConsole();
    const summary = screen.getByText("Dismissed (1)");
    const details = summary.closest("details");
    expect(details).toBeInstanceOf(HTMLDetailsElement);
    expect((details as HTMLDetailsElement).open).toBe(false);
    expect(screen.getByText("Old lint warning")).not.toBeNull();
  });

  it("leads the selected item with kind, status, engine, and name", () => {
    const { container } = renderConsole({ headingLevel: 1 });
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    const scoped = within(main);
    expect(scoped.getByText("Main flow")).not.toBeNull();
    expect(scoped.getByText("Done")).not.toBeNull();
    expect(scoped.getByText("docs")).not.toBeNull();
    const name = scoped.getByRole("heading", { name: "Coordinator" });
    expect(name.tagName).toBe("H1");
  });

  it("keeps the item name at h2 unless a standalone page asks for h1", () => {
    const { container } = renderConsole();
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    expect(within(main).getByRole("heading", { name: "Coordinator" }).tagName).toBe("H2");
  });

  it("prefers the engine label over the model in the item header", () => {
    const { container } = renderConsole({
      items: [item({ id: "main-1", name: "Coordinator", kind: "main", engineLabel: "kit · docs-9" })],
      decision: null,
    });
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    expect(within(main).getByText("kit · docs-9")).not.toBeNull();
  });

  it("renders the header above the decision card", () => {
    const { container } = renderConsole({ headingLevel: 1 });
    const name = screen.getByRole("heading", { name: "Coordinator" });
    const decision = screen.getByText("Final decision");
    expect(name.compareDocumentPosition(decision) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(container.querySelector("[data-slot='agent-console-decision']")).not.toBeNull();
  });

  it("labels the transcript and names an empty one", async () => {
    const user = userEvent.setup();
    const { container } = renderConsole();
    expect(screen.getByRole("heading", { name: "Transcript" })).not.toBeNull();
    await user.click(within(asideOf(container)).getByRole("button", { name: "Merge gate" }));
    expect(screen.getByText("No transcript")).not.toBeNull();
    expect(screen.getByText("This step left no readable transcript.")).not.toBeNull();
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    expect(within(main).getByText("Review lenses")).not.toBeNull();
    expect(within(main).queryByText("gate")).toBeNull();
  });

  it("compacts large token counts and hides a zero row", () => {
    const { container, rerender } = renderConsole({
      items: [
        item({
          id: "main-1",
          name: "Coordinator",
          kind: "main",
          tokensIn: 868_000,
          tokensOut: 20_200,
        }),
      ],
      decision: null,
    });
    expect(screen.getByText("868k in / 20.2k out")).not.toBeNull();
    rerender(
      <AgentConsole
        run={RUN}
        items={[item({ id: "main-1", name: "Coordinator", kind: "main", tokensIn: 0, tokensOut: 0 })]}
        decision={null}
      />,
    );
    expect(container.querySelector("[data-slot='detail-panel']")?.textContent).not.toContain("Tokens");
    rerender(
      <AgentConsole
        run={RUN}
        items={[
          item({
            id: "main-1",
            name: "Coordinator",
            kind: "main",
            tokensIn: Number.NaN,
            tokensOut: 20,
          }),
        ]}
        decision={null}
      />,
    );
    expect(container.querySelector("[data-slot='detail-panel']")?.textContent).not.toContain("Tokens");
  });

  it("boxes the stat grid in a card", () => {
    const { container } = renderConsole();
    const panel = container.querySelector("[data-slot='detail-panel']");
    if (!(panel instanceof HTMLElement)) throw new Error("missing detail panel");
    expect(panel.closest("[data-slot='card']")).not.toBeNull();
    expect(panel.classList.contains("grid-pair")).toBe(true);
  });

  it("shows stats and a tool burst on the selected item", () => {
    const { container } = renderConsole();
    expect(screen.getByText("Started (UTC)")).not.toBeNull();
    expect(screen.getByText("Jan 15, 2026, 10:00 AM")).not.toBeNull();
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
    const { container } = renderConsole({ defaultSelectedId: "lens-1" });
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

  it("leaves a settled run at the top without a jump control", async () => {
    const { container } = renderConsole();
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    mockMainScroller(main);
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });
    expect(main.scrollTop).toBe(0);
    main.scrollTop = 100;
    act(() => {
      main.dispatchEvent(new Event("scroll"));
    });
    expect(main.scrollTop).toBe(100);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });

  it("resets a settled item to the top after leaving a running scroller", async () => {
    const user = userEvent.setup();
    const { container } = renderConsole({ defaultSelectedId: "lens-1" });
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    const metrics = mockMainScroller(main);
    metrics.scrollTop = 100;
    await user.click(within(asideOf(container)).getByRole("button", { name: "Coordinator" }));
    expect(metrics.scrollTop).toBe(0);
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
    expect(within(run).getByText("REQUEST CHANGES").className).not.toContain("badge-soft-success");
  });

  it("uses a danger status dot for a failed item", () => {
    const { container } = renderConsole({
      items: [item({ id: "main-1", name: "Coordinator", kind: "main", status: "failed" })],
    });
    expect(asideOf(container).innerHTML).toContain("bg-destructive");
  });

  it("hides an empty status badge and a whitespace verdict", () => {
    const { container } = renderConsole({
      run: { ...RUN, verdict: "   " },
      items: [item({ id: "main-1", name: "Coordinator", kind: "main", status: "  " })],
      decision: { ...DECISION, verdict: "\t" },
    });
    const main = container.querySelector("[data-slot='app-shell'] main");
    if (!(main instanceof HTMLElement)) throw new Error("missing main");
    expect(within(main).queryByText("Done")).toBeNull();
    expect(asideOf(container).querySelectorAll("[data-slot='badge']").length).toBeGreaterThan(0);
    expect(within(asideOf(container)).queryByText("APPROVE")).toBeNull();
    const card = container.querySelector("[data-slot='agent-console-decision']");
    if (!(card instanceof HTMLElement)) throw new Error("missing decision card");
    expect(within(card).queryByText("APPROVE")).toBeNull();
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
    expect(screen.getByText("1 outil")).not.toBeNull();
  });
});

describe("formatStarted", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an em dash when the start instant is missing", () => {
    expect(formatStarted(null, "en")).toBe("–");
  });

  it("prints the UTC medium/short stamp with ordinary spaces", () => {
    expect(formatStarted(STARTED_AT, "en")).toBe("Jan 15, 2026, 10:00 AM");
  });

  it("asks Intl for UTC so a Paris browser matches the UTC server", () => {
    const spy = vi.spyOn(Intl, "DateTimeFormat");
    formatStarted(STARTED_AT, "en");
    expect(spy).toHaveBeenCalledWith(
      "en",
      expect.objectContaining({
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }),
    );
  });

  it("asks Intl for UTC under the French locale", () => {
    const spy = vi.spyOn(Intl, "DateTimeFormat");
    const stamp = formatStarted(STARTED_AT, "fr");
    expect(spy).toHaveBeenCalledWith("fr", expect.objectContaining({ timeZone: "UTC" }));
    expect(stamp).toMatch(/15/);
    expect(stamp).toMatch(/2026/);
    expect(stamp).toMatch(/10:00/);
    expect(stamp).not.toMatch(/[\u00A0\u202F]/);
  });

  it("replaces formatter NBSP so Chromium hydrate matches Node", () => {
    class FakeDateTimeFormat {
      format() {
        return "Jan 15, 2026,\u00A010:00\u202FAM";
      }
    }
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      FakeDateTimeFormat as unknown as typeof Intl.DateTimeFormat,
    );
    expect(formatStarted(STARTED_AT, "en")).toBe("Jan 15, 2026, 10:00 AM");
  });
});

describe("groupLabel", () => {
  const copy = zedkitUiMessagesEn.agentConsole;

  it("aliases gate and subagent kinds to their bucket labels", () => {
    expect(groupLabel("gate", copy)).toBe("Review lenses");
    expect(groupLabel("subagent", copy)).toBe("Helpers");
    expect(groupLabel("lens", copy)).toBe("Review lenses");
    expect(groupLabel("helper", copy)).toBe("Helpers");
  });

  it("keeps unknown kinds as the raw label", () => {
    expect(groupLabel("mystery", copy)).toBe("mystery");
  });
});

describe("statusLabel", () => {
  it("capitalizes a lowercase live status", () => {
    expect(statusLabel("done")).toBe("Done");
    expect(statusLabel("running")).toBe("Running");
  });

  it("leaves empty and already-capitalized statuses alone", () => {
    expect(statusLabel("")).toBe("");
    expect(statusLabel("   ")).toBe("");
    expect(statusLabel("Done")).toBe("Done");
    expect(statusLabel("INTERRUPTED")).toBe("INTERRUPTED");
  });
});

describe("verdictLabel", () => {
  it("uppercases verdicts and splits snake case", () => {
    expect(verdictLabel("approve")).toBe("APPROVE");
    expect(verdictLabel("request_changes")).toBe("REQUEST CHANGES");
    expect(verdictLabel("request changes")).toBe("REQUEST CHANGES");
  });

  it("keeps a missing verdict missing", () => {
    expect(verdictLabel(null)).toBeNull();
    expect(verdictLabel("")).toBeNull();
    expect(verdictLabel("  ")).toBeNull();
  });
});

describe("statusTone", () => {
  it("pulses while the item runs no matter the status text", () => {
    expect(statusTone("stuck", true)).toBe("active");
  });

  it("maps finished, failed, and interrupted statuses", () => {
    expect(statusTone("done", false)).toBe("success");
    expect(statusTone("Completed", false)).toBe("success");
    expect(statusTone("failed", false)).toBe("danger");
    expect(statusTone("error", false)).toBe("danger");
    expect(statusTone("aborted", false)).toBe("warning");
    expect(statusTone("INTERRUPTED", false)).toBe("warning");
  });

  it("stays idle on unknown statuses", () => {
    expect(statusTone("pending", false)).toBe("idle");
    expect(statusTone("", false)).toBe("idle");
  });
});

describe("compactTokenCount", () => {
  it("keeps small counts exact", () => {
    expect(compactTokenCount(0, "en")).toBe("0");
    expect(compactTokenCount(12, "en")).toBe("12");
    expect(compactTokenCount(999, "en")).toBe("999");
  });

  it("compacts thousands and millions like the live console", () => {
    expect(compactTokenCount(1000, "en")).toBe("1k");
    expect(compactTokenCount(20_200, "en")).toBe("20.2k");
    expect(compactTokenCount(868_000, "en")).toBe("868k");
    expect(compactTokenCount(999_999, "en")).toBe("1M");
    expect(compactTokenCount(1_000_000, "en")).toBe("1M");
    expect(compactTokenCount(20_200_000, "en")).toBe("20M");
  });

  it("clamps bad values to zero", () => {
    expect(compactTokenCount(Number.NaN, "en")).toBe("0");
    expect(compactTokenCount(Number.POSITIVE_INFINITY, "en")).toBe("0");
    expect(compactTokenCount(-5, "en")).toBe("0");
  });
});

function hydrationMessages(logs: unknown[][]): string[] {
  return logs
    .map((args) => args.map(String).join(" "))
    .filter((msg) => /hydrat|did not match|#418|#423|#425/i.test(msg));
}

describe("AgentConsole hydration", () => {
  it("hydrates the fixture Started stamp without a markup mismatch", async () => {
    stubDrawerJsdom();
    const tree = <AgentConsole run={RUN} items={ITEMS} decision={DECISION} />;
    const windowDesc = Object.getOwnPropertyDescriptor(globalThis, "window");
    const origError = console.error;
    const ssr = tryCatch(() => {
      Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
      return renderToString(tree);
    });
    if (windowDesc) Object.defineProperty(globalThis, "window", windowDesc);
    if (!ssr.ok) throw ssr.error;

    const container = document.createElement("div");
    container.innerHTML = ssr.value;
    document.body.appendChild(container);

    const recoverable: unknown[] = [];
    const logs: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      logs.push(args);
      origError.apply(console, args);
    };

    let root: ReturnType<typeof hydrateRoot> | undefined;
    const hydrated = tryCatchAsync(async () => {
      await act(async () => {
        root = hydrateRoot(container, tree, {
          onRecoverableError: (error) => recoverable.push(error),
        });
      });
    });
    const done = await hydrated;
    console.error = origError;
    const text = container.textContent ?? "";
    root?.unmount();
    container.remove();
    if (!done.ok) throw done.error;

    expect(ssr.value).toContain("Jan 15, 2026, 10:00 AM");
    expect(text).toContain("Jan 15, 2026, 10:00 AM");
    expect(hydrationMessages(logs)).toEqual([]);
    expect(recoverable).toEqual([]);
  });
});
