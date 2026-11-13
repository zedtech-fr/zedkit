import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createStoredChoice } from "#index.js";

const VALUES = ["npm", "pnpm", "yarn"] as const;

function Probe({
  useChoice,
}: {
  useChoice: () => readonly [(typeof VALUES)[number], (value: (typeof VALUES)[number]) => void];
}) {
  const [value] = useChoice();
  return <span data-testid="choice">{value}</span>;
}

describe("createStoredChoice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders the default on the server even when storage already holds another allowed value", async () => {
    localStorage.setItem("pm-ssr", "pnpm");
    const choice = createStoredChoice("pm-ssr", VALUES);
    function ServerProbe() {
      const [value] = choice.useChoice();
      return <span>{value}</span>;
    }
    const { renderToStaticMarkup } = await import("react-dom/server");
    expect(renderToStaticMarkup(<ServerProbe />)).toContain("npm");
  });

  it("reads an allowed stored value after the client subscribes", () => {
    localStorage.setItem("pm-client", "pnpm");
    const choice = createStoredChoice("pm-client", VALUES);
    render(<Probe useChoice={choice.useChoice} />);
    expect(screen.getByTestId("choice").textContent).toBe("pnpm");
  });

  it("falls back to the default when storage holds an unknown string", () => {
    localStorage.setItem("pm-unknown", "bun");
    const choice = createStoredChoice("pm-unknown", VALUES);
    render(<Probe useChoice={choice.useChoice} />);
    expect(screen.getByTestId("choice").textContent).toBe("npm");
  });

  it("writes storage and updates every subscriber of that factory", () => {
    const choice = createStoredChoice("pm-set", VALUES);
    function Dual() {
      const [a, set] = choice.useChoice();
      const [b] = choice.useChoice();
      return (
        <>
          <span data-testid="a">{a}</span>
          <span data-testid="b">{b}</span>
          <button type="button" onClick={() => set("yarn")}>
            pick
          </button>
        </>
      );
    }
    render(<Dual />);
    act(() => {
      screen.getByRole("button", { name: "pick" }).click();
    });
    expect(localStorage.getItem("pm-set")).toBe("yarn");
    expect(screen.getByTestId("a").textContent).toBe("yarn");
    expect(screen.getByTestId("b").textContent).toBe("yarn");
  });

  it("keeps the session choice when getItem and setItem throw", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const choice = createStoredChoice("pm-blocked", VALUES);
    function Blocked() {
      const [value, set] = choice.useChoice();
      return (
        <>
          <span data-testid="choice">{value}</span>
          <button type="button" onClick={() => set("pnpm")}>
            pick
          </button>
        </>
      );
    }
    render(<Blocked />);
    expect(screen.getByTestId("choice").textContent).toBe("npm");
    act(() => {
      screen.getByRole("button", { name: "pick" }).click();
    });
    expect(screen.getByTestId("choice").textContent).toBe("pnpm");
  });

  it("rereads on a storage event for this key and on a clear, and ignores another key", () => {
    localStorage.setItem("pm-event", "npm");
    const choice = createStoredChoice("pm-event", VALUES);
    render(<Probe useChoice={choice.useChoice} />);
    expect(screen.getByTestId("choice").textContent).toBe("npm");

    localStorage.setItem("pm-event", "pnpm");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other-key", newValue: "yarn" }));
    });
    expect(screen.getByTestId("choice").textContent).toBe("npm");

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "pm-event", newValue: "pnpm" }));
    });
    expect(screen.getByTestId("choice").textContent).toBe("pnpm");

    localStorage.removeItem("pm-event");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(screen.getByTestId("choice").textContent).toBe("npm");
  });

  it("accepts only list members in isValue", () => {
    const choice = createStoredChoice("pm-guard", VALUES);
    expect(choice.isValue("npm")).toBe(true);
    expect(choice.isValue("pnpm")).toBe(true);
    expect(choice.isValue("bun")).toBe(false);
    expect(choice.isValue("")).toBe(false);
  });
});
