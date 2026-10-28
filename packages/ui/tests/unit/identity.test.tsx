import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { IDENTITY_BOOTSTRAP_SOURCE } from "#identity-bootstrap.js";
import {
  IDENTITY_STORAGE_KEY,
  IdentityPicker,
  IdentityScript,
  IdentitySwitcher,
  applyIdentity,
  identities,
  type IdentityOption,
} from "#index.js";

/** Consumer-defined identities, passed instead of the built-in list. */
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
  const script = container.querySelector('script[data-slot="identity-script"]') as HTMLScriptElement;
  const code = script.innerHTML;
  Object.defineProperty(document, "currentScript", { value: script, configurable: true });
  new Function(code)();
  unmount();
}

describe("IdentityScript", () => {
  it("is not a client module, so a server layout can render it without hydrating", () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../src/identity-script.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/^["']use client["']/m);
  });

  it("keeps a fixed bootstrap body and passes props only through data attributes", () => {
    const { container, unmount } = render(
      <IdentityScript ids={['a","b']} storageKey={'key"with'} defaultIdentity="calm" />,
    );
    const script = container.querySelector('script[data-slot="identity-script"]') as HTMLScriptElement;
    expect(script.innerHTML).toBe(IDENTITY_BOOTSTRAP_SOURCE);
    expect(script.getAttribute("data-ids")).toBe(JSON.stringify(['a","b']));
    expect(script.getAttribute("data-storage-key")).toBe('key"with');
    expect(script.getAttribute("data-default")).toBe("calm");
    unmount();
  });

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

  it("ships the six built-in identities, each with a label, a description and fonts", () => {
    expect(identities.map((item) => item.id)).toEqual(["mist", "press", "tide", "volt", "maison", "glass"]);
    for (const item of identities) {
      expect(item.label).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.fonts?.length).toBeGreaterThan(0);
    }
  });

  it("applies a stored built-in id by default and ignores anything else", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "press");
    runScript(<IdentityScript />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("press");
    document.documentElement.removeAttribute("data-identity");
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
    const { container } = render(<IdentitySwitcher identities={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("offers the built-in identities by default", () => {
    render(<IdentitySwitcher />);
    const options = [...(screen.getByLabelText("Identity") as HTMLSelectElement).options].map((option) => option.value);
    expect(options).toEqual(identities.map((item) => item.id));
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
    const { container } = render(<IdentityPicker identities={[]} />);
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
