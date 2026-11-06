/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { FLAG_OVERRIDE_STORAGE_KEY } from "@zedtech/zedkit-flags";
import { ZedkitUiProvider, zedkitUiMessagesEn } from "@zedtech/zedkit-ui";

import { devtoolsEnabled } from "../src/enabled.js";
import { FlagOverridesTab } from "../src/flag-overrides-tab.js";
import { ZedkitDevtools } from "../src/react.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.ResizeObserver ??= class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
});

function wrap(node: ReactNode) {
  return <ZedkitUiProvider messages={zedkitUiMessagesEn}>{node}</ZedkitUiProvider>;
}

describe("devtoolsEnabled", () => {
  it("follows nodeEnv and force", () => {
    expect(devtoolsEnabled({ nodeEnv: "production" })).toBe(false);
    expect(devtoolsEnabled({ nodeEnv: "development" })).toBe(true);
    expect(devtoolsEnabled({ nodeEnv: "production", force: true })).toBe(true);
    expect(devtoolsEnabled()).toBe(process.env.NODE_ENV !== "production");
  });
});

describe("ZedkitDevtools", () => {
  it("renders the trigger when forced on", () => {
    render(wrap(<ZedkitDevtools force buildInfo={[{ label: "Env", value: "test" }]} />));
    expect(screen.getByRole("button", { name: "Dev" })).toBeTruthy();
  });

  it("hides when enabled is false", () => {
    render(wrap(<ZedkitDevtools enabled={false} buildInfo={[{ label: "Env", value: "test" }]} />));
    expect(screen.queryByRole("button", { name: "Dev" })).toBeNull();
  });

  it("opens the drawer with look, flags, locale, info and query tabs", async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();
    render(
      wrap(
        <ZedkitDevtools
          force
          flagKeys={["beta"]}
          buildInfo={[{ label: "Env", value: "test" }]}
          localeOptions={[{ id: "en", label: "English" }]}
          activeLocale="en"
          onLocaleChange={onLocaleChange}
          querySlot={<p>Query slot</p>}
        />,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Dev" }));
    expect(screen.getByRole("dialog", { name: "Developer tools" })).toBeTruthy();
    expect(screen.getByText("Not shown when `devtoolsEnabled()` is false.")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Look" })).toBeTruthy();
    expect(screen.getByLabelText("Identity")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Flags" }));
    expect(screen.getByRole("switch", { name: "beta" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Locale" }));
    expect(screen.getByLabelText("Messages locale")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Info" }));
    expect(screen.getByText("Env")).toBeTruthy();
    expect(screen.getByText("test")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Query" }));
    expect(screen.getByText("Query slot")).toBeTruthy();
  });
});

describe("FlagOverridesTab", () => {
  it("tells the reader to pass flagKeys when the list is empty", () => {
    render(wrap(<FlagOverridesTab flagKeys={[]} />));
    expect(screen.getByText("Pass `flagKeys` to override flags in local storage.")).toBeTruthy();
  });

  it("writes a flag override through the switch", async () => {
    const user = userEvent.setup();
    render(wrap(<FlagOverridesTab flagKeys={["beta"]} />));
    const toggle = screen.getByRole("switch", { name: "beta" });
    expect(toggle.getAttribute("data-state")).toBe("unchecked");
    await user.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("checked");
    expect(localStorage.getItem(FLAG_OVERRIDE_STORAGE_KEY)).toContain("beta");
  });
});
