import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZedkitUiProvider, zedkitUiMessagesEn } from "@zedtech/zedkit-ui";
import { createMemoryConsentStore } from "#consent/index.js";
import {
  ConsentBanner,
  ConsentGate,
  ConsentProvider,
  useConsentGatedLoader,
  useConsentRecord,
} from "#consent-react.js";

afterEach(() => {
  cleanup();
});

const BANNER = {
  title: "Cookies",
  description: "Choose what we may record.",
  analyticsLabel: "Analytics",
  marketingLabel: "Marketing",
  acceptAllLabel: "Accept all",
  saveLabel: "Save",
};

function wrap(store: ReturnType<typeof createMemoryConsentStore>, node: ReactNode) {
  return (
    <ZedkitUiProvider messages={zedkitUiMessagesEn}>
      <ConsentProvider store={store}>{node}</ConsentProvider>
    </ZedkitUiProvider>
  );
}

describe("ConsentGate", () => {
  it("renders children only when the category is granted", () => {
    const store = createMemoryConsentStore();
    render(
      wrap(
        store,
        <ConsentGate category="analytics" fallback={<span>blocked</span>}>
          <span>allowed</span>
        </ConsentGate>,
      ),
    );
    expect(screen.getByText("blocked")).toBeTruthy();
    act(() => store.write({ analytics: true, marketing: false }));
    expect(screen.getByText("allowed")).toBeTruthy();
  });

  it("renders nothing when denied and no fallback is given", () => {
    const store = createMemoryConsentStore();
    render(
      wrap(
        store,
        <ConsentGate category="marketing">
          <span>ads</span>
        </ConsentGate>,
      ),
    );
    expect(screen.queryByText("ads")).toBeNull();
  });
});

describe("consent hooks", () => {
  it("throws when ConsentProvider is missing", () => {
    function Probe() {
      useConsentRecord();
      return null;
    }
    expect(() => render(<Probe />)).toThrow(/ConsentProvider is missing/);
  });

  it("runs a gated loader once consent is granted", () => {
    const store = createMemoryConsentStore();
    const load = vi.fn(() => () => undefined);
    function Probe() {
      useConsentGatedLoader("analytics", load);
      return <span>probe</span>;
    }
    render(wrap(store, <Probe />));
    expect(load).not.toHaveBeenCalled();
    act(() => store.write({ analytics: true, marketing: false }));
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("ConsentBanner", () => {
  it("stays open until the visitor saves, and ignore close while unset", () => {
    const store = createMemoryConsentStore();
    render(wrap(store, <ConsentBanner {...BANNER} />));
    expect(screen.getByRole("dialog", { name: "Cookies" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("dialog", { name: "Cookies" })).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Analytics"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(store.read()?.analytics).toBe(true);
    expect(store.read()?.marketing).toBe(false);
  });

  it("accepts every category at once", () => {
    const store = createMemoryConsentStore();
    render(wrap(store, <ConsentBanner {...BANNER} />));
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(store.read()).toEqual(expect.objectContaining({ analytics: true, marketing: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays hidden when consent is already stored", () => {
    const store = createMemoryConsentStore({ analytics: true, marketing: false, updatedAt: 1 });
    render(wrap(store, <ConsentBanner {...BANNER} />));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
