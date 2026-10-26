import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import {
  IDENTITY_STORAGE_KEY,
  IdentityPicker,
  IdentityScript,
  IdentitySwitcher,
  applyIdentity,
  identities,
  type IdentityOption,
} from "#index.js";

/** Consumer-defined identities: the kit ships none yet. */
const looks: readonly IdentityOption[] = [
  { id: "calm", label: "Calm", description: "Soft and quiet." },
  { id: "bold", label: "Bold", description: "Loud and square." },
];

beforeAll(() => {
  stubDrawerJsdom();
});

afterEach(() => {
  document.documentElement.removeAttribute("data-identity");
  localStorage.clear();
});

function runScript(element: ReactElement) {
  const { container, unmount } = render(element);
  const code = container.querySelector("script")?.innerHTML ?? "";
  unmount();
  new Function(code)();
}

describe("IdentityScript", () => {
  it("leaves the stock look when nothing is stored and there is no default", () => {
    runScript(<IdentityScript ids={["calm", "bold"]} />);
    expect(document.documentElement.hasAttribute("data-identity")).toBe(false);
  });

  it("applies a stored id that is allowed", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "bold");
    runScript(<IdentityScript ids={["calm", "bold"]} />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
  });

  it("ignores an unknown stored id and falls back to the default", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "nope");
    runScript(<IdentityScript ids={["calm", "bold"]} defaultIdentity="calm" />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("calm");
  });

  it("allows no id by default while the kit ships no identity", () => {
    expect(identities).toEqual([]);
    localStorage.setItem(IDENTITY_STORAGE_KEY, "bold");
    runScript(<IdentityScript />);
    expect(document.documentElement.hasAttribute("data-identity")).toBe(false);
  });

  it("honours a custom storage key", () => {
    localStorage.setItem("my-look", "calm");
    runScript(<IdentityScript ids={["calm"]} storageKey="my-look" />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("calm");
  });
});

describe("IdentitySwitcher", () => {
  it("renders nothing without identities", () => {
    const { container } = render(<IdentitySwitcher />);
    expect(container.innerHTML).toBe("");
  });

  it("has an accessible name and no axe violations", async () => {
    const { container } = render(<IdentitySwitcher identities={looks} />);
    expect(screen.getByLabelText("Identity")).toBeTruthy();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("sets data-identity on the root, persists the choice and reports it", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<IdentitySwitcher identities={looks} onIdentityChange={(id) => seen.push(id)} />);
    await user.selectOptions(screen.getByLabelText("Identity"), "bold");
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
    expect(localStorage.getItem(IDENTITY_STORAGE_KEY)).toBe("bold");
    expect(seen).toEqual(["bold"]);
  });

  it("follows a change made elsewhere on the page", async () => {
    render(<IdentitySwitcher identities={looks} />);
    act(() => applyIdentity("bold"));
    expect(await screen.findByDisplayValue("Bold")).toBeTruthy();
  });
});

describe("IdentityPicker", () => {
  it("renders nothing without identities", () => {
    const { container } = render(<IdentityPicker />);
    expect(container.innerHTML).toBe("");
  });

  it("names the current identity and applies a choice from the sheet", async () => {
    const user = userEvent.setup();
    render(<IdentityPicker identities={looks} />);
    await user.click(screen.getByRole("button", { name: "Identity: Calm" }));
    const bold = await screen.findByRole("radio", { name: /Bold/ });
    expect(screen.getByRole("radio", { name: /Calm/ }).getAttribute("aria-checked")).toBe("true");
    await user.click(bold);
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
    expect(localStorage.getItem(IDENTITY_STORAGE_KEY)).toBe("bold");
    expect(bold.getAttribute("aria-checked")).toBe("true");
  });
});
