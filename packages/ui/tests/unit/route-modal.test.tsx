import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { RouteModal, closeRoute } from "#index.js";

beforeAll(() => {
  stubDrawerJsdom();
});

function pressEscape(): void {
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
}

function stubNavigationApi(entries: { id: string; sameDocument: boolean }[], currentId: string): void {
  vi.stubGlobal("navigation", {
    currentEntry: entries.find((entry) => entry.id === currentId) ?? null,
    entries: () => entries,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.documentElement.style.removeProperty("--motion-slow");
});

describe("closeRoute", () => {
  it("goes back when the previous entry is same-document", () => {
    stubNavigationApi(
      [
        { id: "list", sameDocument: true },
        { id: "detail", sameDocument: true },
      ],
      "detail",
    );
    const back = vi.fn();
    const replace = vi.fn();
    closeRoute({ back, replace, fallback: "/items" });
    expect(back).toHaveBeenCalledOnce();
    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces with the fallback when the previous entry is external", () => {
    stubNavigationApi(
      [
        { id: "google", sameDocument: false },
        { id: "detail", sameDocument: true },
      ],
      "detail",
    );
    const back = vi.fn();
    const replace = vi.fn();
    closeRoute({ back, replace, fallback: "/items" });
    expect(replace).toHaveBeenCalledWith("/items");
    expect(back).not.toHaveBeenCalled();
  });

  it("replaces with the fallback on a single-entry history", () => {
    stubNavigationApi([{ id: "detail", sameDocument: true }], "detail");
    const back = vi.fn();
    const replace = vi.fn();
    closeRoute({ back, replace, fallback: "/items" });
    expect(replace).toHaveBeenCalledWith("/items");
    expect(back).not.toHaveBeenCalled();
  });

  it("falls back to history length without the Navigation API", () => {
    const back = vi.fn();
    const replace = vi.fn();
    closeRoute({ back, replace, fallback: "/items" });
    // jsdom starts with a single history entry: no back target.
    expect(replace).toHaveBeenCalledWith("/items");
    expect(back).not.toHaveBeenCalled();
  });
});

describe("route modal", () => {
  it("renders an open right drawer with title and content", () => {
    render(
      <RouteModal title="Delivery" description="Tracking details." onClose={vi.fn()}>
        <p>shared detail view</p>
      </RouteModal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Delivery" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("right");
    expect(screen.getByText("shared detail view")).not.toBeNull();
    expect(screen.getByText("Tracking details.")).not.toBeNull();
    expect(dialog.querySelector("[data-slot=drawer-handle]")).not.toBeNull();
    expect(dialog.querySelector("[data-slot=drawer-body]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Close" }).className).toContain("size-overlay-touch-target");
  });

  it("renders a bottom sheet without width sizes when direction is bottom", () => {
    render(
      <RouteModal title="Filters" direction="bottom" size="sm" onClose={vi.fn()}>
        x
      </RouteModal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("bottom");
    expect(dialog.className).not.toContain("sm:max-w-sm");
  });

  it("plays the exit before calling onClose on Escape", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    pressEscape();
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("honors a themed motion token for the exit", () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-slow", "500ms");
    const onClose = vi.fn();
    render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    pressEscape();
    vi.advanceTimersByTime(250);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("plays the exit before calling onClose on overlay click", async () => {
    // Real timers: outside-dismiss needs the full pointer sequence that
    // only user-event reproduces faithfully (bare pointerDown never
    // reaches vaul's dismiss path in jsdom).
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    const overlay = document.querySelector("[data-vaul-overlay]");
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("plays the exit before calling onClose on the close button", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose once on repeated dismiss attempts", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    // Pre-resolve: the first dismiss starts the exit, which may
    // remove dismiss controls from the accessible tree.
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("never calls onClose after unmount", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const view = render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    pressEscape();
    view.unmount();
    vi.advanceTimersByTime(1000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("navigates immediately under reduced motion", () => {
    // Restored by the afterEach unstubAllGlobals.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <RouteModal title="Delivery" onClose={onClose}>
        x
      </RouteModal>,
    );
    pressEscape();
    expect(onClose).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders a centered dialog without a drawer in the dialog variant", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <RouteModal title="Delete item?" variant="dialog" onClose={onClose}>
        x
      </RouteModal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Delete item?" });
    expect(dialog).not.toBeNull();
    expect(dialog.className).toContain("max-h-dialog-max-height");
    expect(document.querySelector("[data-vaul-drawer]")).toBeNull();
    pressEscape();
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("applies drawer and dialog sizes", () => {
    const drawer = render(
      <RouteModal title="Delivery" size="lg" onClose={() => {}}>
        x
      </RouteModal>,
    );
    const drawerDialog = drawer.getByRole("dialog");
    expect(drawerDialog.className).toContain("sm:max-w-route-modal-drawer-lg!");
    expect(drawerDialog.className).not.toContain("max-w-lg!");
    drawer.unmount();
    const dialog = render(
      <RouteModal title="Delete item?" variant="dialog" size="sm" onClose={() => {}}>
        x
      </RouteModal>,
    );
    const dialogDialog = dialog.getByRole("dialog");
    expect(dialogDialog.className).toContain("max-w-route-modal-sm");
    expect(dialogDialog.className).not.toContain("max-w-route-modal-dialog-lg");
  });

  it("moves focus inside the drawer on open", () => {
    render(
      <>
        <button type="button">trigger</button>
        <RouteModal title="Delivery" onClose={vi.fn()}>
          <button type="button">inside</button>
        </RouteModal>
      </>,
    );
    // Without Vaul's autoFocus the trigger keeps focus and the
    // trap below never engages (keyboard users tab through the
    // background page).
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });

  it("traps Tab inside the drawer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <RouteModal title="Delivery" onClose={vi.fn()}>
          <button type="button">first</button>
          <button type="button">second</button>
        </RouteModal>
        <button type="button">after</button>
      </>,
    );
    const dialog = screen.getByRole("dialog");
    // 3 inside focusables (Close + first + second): 6 tabs lap
    // twice, so an untrapped Tab would visibly escape.
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  // The trigger element must survive the modal mount (same slot,
  // like the list page under an intercepted route): wrapping it in
  // a fragment only at rerender time would replace the node and
  // drop focus to body before the modal ever mounts.
  function Harness({ show, trigger = true }: { show: boolean; trigger?: boolean }) {
    return (
      <>
        {trigger ? <button type="button">trigger</button> : null}
        {show ? (
          <RouteModal title="Delivery" onClose={vi.fn()}>
            <button type="button">inside</button>
          </RouteModal>
        ) : null}
      </>
    );
  }

  it("returns focus to the trigger when the drawer closes and unmounts", () => {
    vi.useFakeTimers();
    const view = render(<Harness show={false} />);
    const trigger = screen.getByRole("button", { name: "trigger" });
    trigger.focus();
    view.rerender(<Harness show />);
    // Focus moved inside on open (Vaul autoFocus).
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    pressEscape();
    // The restore must NOT run yet: the trap is still mounted (in
    // browsers) and would steal it back — it runs at unmount, which
    // follows the navigation onClose triggers (see #586).
    // Rerendering without the modal mirrors that (the list page
    // persists).
    vi.advanceTimersByTime(250);
    expect(document.activeElement).not.toBe(trigger);
    view.rerender(<Harness show={false} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("still returns focus after re-renders (Vaul re-captures per render)", () => {
    vi.useFakeTimers();
    const view = render(<Harness show={false} />);
    const trigger = screen.getByRole("button", { name: "trigger" });
    trigger.focus();
    view.rerender(<Harness show />);
    // Vaul re-renders on drag state, snap points, resize: each one
    // re-runs the Radix capture from inside.
    view.rerender(<Harness show />);
    view.rerender(<Harness show />);
    pressEscape();
    vi.advanceTimersByTime(250);
    view.rerender(<Harness show={false} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("returns focus when unmounted without a close (browser back)", () => {
    const view = render(<Harness show={false} />);
    const trigger = screen.getByRole("button", { name: "trigger" });
    trigger.focus();
    view.rerender(<Harness show />);
    view.rerender(<Harness show={false} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("does not throw when the opener left the DOM before close", () => {
    vi.useFakeTimers();
    const view = render(<Harness show={false} />);
    screen.getByRole("button", { name: "trigger" }).focus();
    view.rerender(<Harness show />);
    // The list re-rendered under the modal: React removes the
    // opener node (out-of-band .remove() would corrupt the commit).
    view.rerender(<Harness show trigger={false} />);
    pressEscape();
    vi.advanceTimersByTime(250);
    expect(() => view.rerender(<Harness show={false} trigger={false} />)).not.toThrow();
  });

  // NOTE: return-focus for the DIALOG variant is not asserted here —
  // it relies on the Radix default restore, which jsdom does not
  // reproduce (verified against the untouched variant), while real
  // browsers restore per Radix. That leg stays covered by
  // browser-level consumer tests. The drawer leg above IS asserted:
  // the kit restores the opener synchronously in requestClose.

  it("has no axe violations when open", async () => {
    render(
      <RouteModal title="Delivery" description="Tracking details." onClose={vi.fn()}>
        <p>shared detail view</p>
      </RouteModal>,
    );
    const results = await axe(document.body, {
      rules: {
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
        "document-title": { enabled: false },
        "html-has-lang": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});

function InterceptedDetail({ back, replace }: { back: () => void; replace: (href: string) => void }) {
  return (
    <RouteModal title="Delivery" onClose={() => closeRoute({ back, replace, fallback: "/items" })}>
      <p>detail view shared with the full page</p>
    </RouteModal>
  );
}

describe("route modal recipe", () => {
  it("goes back to the list after the exit when history is in-app", () => {
    stubNavigationApi(
      [
        { id: "list", sameDocument: true },
        { id: "detail", sameDocument: true },
      ],
      "detail",
    );
    vi.useFakeTimers();
    const back = vi.fn();
    const replace = vi.fn();
    render(<InterceptedDetail back={back} replace={replace} />);
    pressEscape();
    expect(back).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(back).toHaveBeenCalledOnce();
    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces with the list when no in-app entry exists", () => {
    stubNavigationApi([{ id: "detail", sameDocument: true }], "detail");
    vi.useFakeTimers();
    const back = vi.fn();
    const replace = vi.fn();
    render(<InterceptedDetail back={back} replace={replace} />);
    pressEscape();
    vi.advanceTimersByTime(300);
    expect(replace).toHaveBeenCalledWith("/items");
    expect(back).not.toHaveBeenCalled();
  });
});
