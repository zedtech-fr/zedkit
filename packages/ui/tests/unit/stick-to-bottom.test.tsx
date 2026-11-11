import { act, render, renderHook, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  JumpToLatest,
  ZedkitUiProvider,
  useStickToBottom,
  zedkitUiMessagesFr,
  type StickToBottomOptions,
} from "#index.js";

type Metrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

function setMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

async function flushFrame(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function flushGrowth(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
  await flushFrame();
}

function mockScroller(initial: Metrics = { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) {
  const metrics = { ...initial };
  const el = document.createElement("div");
  document.body.append(el);
  const scrollTo = vi.fn((arg?: ScrollToOptions | number) => {
    const top = typeof arg === "object" ? arg.top : undefined;
    if (typeof top === "number") metrics.scrollTop = top;
  });
  el.scrollTo = scrollTo as typeof el.scrollTo;
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => metrics.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => metrics.clientHeight });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => metrics.scrollTop,
    set: (value: number) => {
      metrics.scrollTop = value;
    },
  });
  return { el, metrics, scrollTo };
}

function mountHook(options?: StickToBottomOptions, metrics?: Metrics) {
  const scroller = mockScroller(metrics);
  const hook = renderHook(() => useStickToBottom({ current: scroller.el }, options));
  return { ...scroller, ...hook };
}

describe("useStickToBottom", () => {
  let originalResizeObserver: typeof window.ResizeObserver;
  let originalMutationObserver: typeof window.MutationObserver;

  beforeEach(() => {
    setMotion(false);
    document.documentElement.removeAttribute("data-motion");
    originalResizeObserver = window.ResizeObserver;
    originalMutationObserver = window.MutationObserver;
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    window.MutationObserver = originalMutationObserver;
    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-motion");
  });

  it("does not throw when the scroller ref is null", () => {
    expect(() => renderHook(() => useStickToBottom({ current: null }))).not.toThrow();
    const { result } = renderHook(() => useStickToBottom({ current: null }));
    expect(result.current.isStuck).toBe(true);
  });

  it("starts latched and pins overflowing content to the end on mount", () => {
    const { scrollTo, result } = mountHook();
    expect(result.current.isStuck).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, left: 0, behavior: "instant" });
  });

  it("unlatches on user scroll away from the bottom and ignores later growth", async () => {
    const { el, metrics, result, scrollTo } = mountHook();
    await flushFrame();
    scrollTo.mockClear();
    metrics.scrollTop = 100;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
    metrics.scrollHeight = 1200;
    el.append("more");
    await flushGrowth();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("relatches when the user scrolls back within the default offset", async () => {
    const { el, metrics, result } = mountHook();
    await flushFrame();
    metrics.scrollTop = 100;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
    metrics.scrollTop = 796;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(true);
  });

  it("pins to the new end when content grows while latched", async () => {
    const { el, metrics, scrollTo } = mountHook();
    await flushFrame();
    scrollTo.mockClear();
    metrics.scrollHeight = 1200;
    el.append("more");
    await flushGrowth();
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000, left: 0, behavior: "instant" });
  });

  it("jumpToLatest pins to the end and relatches", async () => {
    const { el, metrics, result, scrollTo } = mountHook();
    await flushFrame();
    metrics.scrollTop = 100;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
    scrollTo.mockClear();
    act(() => {
      result.current.jumpToLatest();
    });
    expect(result.current.isStuck).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, left: 0, behavior: "instant" });
  });

  it("does not unlatch from the scroll event caused by jumpToLatest", async () => {
    const { el, metrics, result } = mountHook();
    await flushFrame();
    metrics.scrollTop = 100;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      result.current.jumpToLatest();
      metrics.scrollTop = 0;
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(true);
    await flushFrame();
    metrics.scrollTop = 0;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
  });

  it("keeps the latch during a smooth pin until the scroller reaches the end", async () => {
    const { el, metrics, result, scrollTo } = mountHook({ behavior: "smooth" });
    act(() => {
      el.dispatchEvent(new Event("scrollend"));
    });
    await flushFrame();
    metrics.scrollTop = 100;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
    scrollTo.mockImplementation(() => {});
    act(() => {
      result.current.jumpToLatest();
    });
    expect(result.current.isStuck).toBe(true);
    await flushFrame();
    metrics.scrollTop = 400;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(true);
    metrics.scrollTop = 800;
    act(() => {
      el.dispatchEvent(new Event("scrollend"));
    });
    expect(result.current.isStuck).toBe(true);
    metrics.scrollTop = 100;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
  });

  it("treats a 4px shortfall as still latched at the default offset", async () => {
    const { el, metrics, result } = mountHook();
    await flushFrame();
    metrics.scrollTop = 796;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(true);
  });

  it("unlatches a 4px shortfall when offset is 0", async () => {
    const { el, metrics, result } = mountHook({ offset: 0 });
    await flushFrame();
    metrics.scrollTop = 796;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
  });

  it("treats a negative offset as 0", async () => {
    const { el, metrics, result } = mountHook({ offset: -4 });
    await flushFrame();
    metrics.scrollTop = 796;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(false);
  });

  it("treats a NaN offset as the default", async () => {
    const { el, metrics, result } = mountHook({ offset: Number.NaN });
    await flushFrame();
    metrics.scrollTop = 796;
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isStuck).toBe(true);
  });

  it.each([
    {
      name: "uses smooth scrolling when asked and motion is allowed",
      reduce: false,
      attr: false,
      options: { behavior: "smooth" as const },
      want: "smooth",
    },
    {
      name: "forces instant jumps when the OS asks to reduce motion",
      reduce: true,
      attr: false,
      options: { behavior: "smooth" as const },
      want: "instant",
    },
    {
      name: "forces instant jumps when html data-motion is reduce",
      reduce: false,
      attr: true,
      options: { behavior: "smooth" as const },
      want: "instant",
    },
    {
      name: "jumps instantly by default",
      reduce: false,
      attr: false,
      options: undefined,
      want: "instant",
    },
  ])("$name", ({ reduce, attr, options, want }) => {
    if (reduce) setMotion(true);
    if (attr) document.documentElement.setAttribute("data-motion", "reduce");
    const { scrollTo } = mountHook(options);
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, left: 0, behavior: want });
  });

  it("does not throw when ResizeObserver is missing", () => {
    // @ts-expect-error -- jsdom may still define it; the hook must tolerate absence.
    delete window.ResizeObserver;
    expect(() => mountHook()).not.toThrow();
  });

  it("does not throw when MutationObserver is missing", () => {
    // @ts-expect-error -- jsdom may still define it; the hook must tolerate absence.
    delete window.MutationObserver;
    expect(() => mountHook()).not.toThrow();
  });

  it("stops pinning after unmount", async () => {
    const { el, metrics, scrollTo, unmount } = mountHook();
    await flushFrame();
    scrollTo.mockClear();
    unmount();
    metrics.scrollHeight = 1200;
    el.append("more");
    await flushGrowth();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("follows the current scroller after a ref swap", async () => {
    const first = mockScroller();
    const second = mockScroller({ scrollTop: 0, scrollHeight: 500, clientHeight: 200 });
    const ref = { current: first.el };
    const hook = renderHook(() => useStickToBottom(ref));
    await flushFrame();
    ref.current = second.el;
    hook.rerender();
    await flushFrame();
    first.scrollTo.mockClear();
    second.scrollTo.mockClear();
    first.metrics.scrollHeight = 1500;
    first.el.append("more");
    await flushGrowth();
    expect(first.scrollTo).not.toHaveBeenCalled();
    second.metrics.scrollHeight = 800;
    second.el.append("more");
    await flushGrowth();
    expect(second.scrollTo).toHaveBeenCalledWith({ top: 600, left: 0, behavior: "instant" });
  });
});

describe("JumpToLatest", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("renders nothing while latched", () => {
    render(<JumpToLatest stuck onClick={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a named outline button with the jump-to-latest slot when unlatched", () => {
    render(<JumpToLatest stuck={false} onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Jump to latest" });
    expect(button.getAttribute("data-slot")).toBe("jump-to-latest");
    expect(button.getAttribute("type")).toBe("button");
  });

  it("keeps type and data-slot when callers pass overrides", () => {
    render(
      <JumpToLatest
        stuck={false}
        onClick={() => {}}
        data-slot="other"
        {...({ type: "submit" } as object)}
      />,
    );
    const button = screen.getByRole("button", { name: "Jump to latest" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("data-slot")).toBe("jump-to-latest");
  });

  it("falls back to kit chrome when label is empty or whitespace", () => {
    const { rerender } = render(<JumpToLatest stuck={false} label="" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Jump to latest" })).not.toBeNull();
    rerender(<JumpToLatest stuck={false} label="   " onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Jump to latest" })).not.toBeNull();
  });

  it("lets label win over the French bundle", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <JumpToLatest stuck={false} label="Skip to end" onClick={() => {}} />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("button", { name: "Skip to end" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Aller au plus récent" })).toBeNull();
  });

  it("uses the French chrome string when label is omitted", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <JumpToLatest stuck={false} onClick={() => {}} />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("button", { name: "Aller au plus récent" })).not.toBeNull();
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<JumpToLatest stuck={false} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Jump to latest" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("moves focus to the scroller when JumpToLatest is activated", async () => {
    const user = userEvent.setup();
    const scroller = mockScroller();
    scroller.el.tabIndex = 0;
    function Harness() {
      const { isStuck, jumpToLatest } = useStickToBottom({ current: scroller.el });
      return <JumpToLatest stuck={isStuck} onClick={jumpToLatest} />;
    }
    render(<Harness />);
    await flushFrame();
    scroller.metrics.scrollTop = 100;
    act(() => {
      scroller.el.dispatchEvent(new Event("scroll"));
    });
    await user.click(screen.getByRole("button", { name: "Jump to latest" }));
    expect(document.activeElement).toBe(scroller.el);
  });
});
