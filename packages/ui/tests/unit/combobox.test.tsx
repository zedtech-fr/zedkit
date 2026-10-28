import { useState, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Combobox, MultiSelect, zedkitUiMessagesEn, zedkitUiMessagesFr, ZedkitUiProvider, type ComboboxOption } from "#index.js";

const OPTIONS: ComboboxOption[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie" },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
});

function wrap(ui: ReactNode) {
  return <ZedkitUiProvider messages={zedkitUiMessagesEn}>{ui}</ZedkitUiProvider>;
}

function ComboboxHarness() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <Combobox options={OPTIONS} value={value} onValueChange={setValue} aria-label="Pick letter" />
      <span data-testid="picked">{value ?? "none"}</span>
    </>
  );
}

function MultiSelectHarness() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <>
      <MultiSelect options={OPTIONS} value={value} onValueChange={setValue} aria-label="Tags" />
      <span data-testid="picked">{value.join(",") || "none"}</span>
    </>
  );
}

async function expectNoViolations(element: HTMLElement): Promise<void> {
  const results = await axe(element);
  expect(results.violations).toEqual([]);
}

describe("Combobox", () => {
  it("filters options and selects with the keyboard", async () => {
    const user = userEvent.setup();
    render(wrap(<ComboboxHarness />));
    const input = screen.getByRole("combobox", { name: "Pick letter" });
    await user.click(input);
    await user.type(input, "br");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByTestId("picked").textContent).toBe("b");
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(wrap(<Combobox options={OPTIONS} aria-label="Pick letter" />));
    await user.click(screen.getByRole("combobox", { name: "Pick letter" }));
    await expectNoViolations(container);
  });
});

describe("MultiSelect", () => {
  it("adds a tag from the list", async () => {
    const user = userEvent.setup();
    render(wrap(<MultiSelectHarness />));
    const input = screen.getByRole("combobox", { name: "Tags" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByTestId("picked").textContent).toBe("a");
  });

  it("has no axe violations with one chip", async () => {
    const { container } = render(
      wrap(<MultiSelect options={OPTIONS} value={["a"]} onValueChange={() => {}} aria-label="Tags" />),
    );
    await expectNoViolations(container);
  });

  it("uses French kit messages for chip remove and selected row hint", async () => {
    const user = userEvent.setup();
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <MultiSelect options={OPTIONS} value={["a"]} onValueChange={() => {}} aria-label="Tags" />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("button", { name: "Retirer Alpha" })).toBeDefined();
    const input = screen.getByRole("combobox", { name: "Tags" });
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    const options = await screen.findAllByRole("option");
    const alpha = options.find((node) => node.textContent?.includes("Alpha"));
    expect(alpha?.textContent).toContain("sélectionné");
  });
});

describe("Combobox messages", () => {
  it("shows French loading chrome when loading", async () => {
    const user = userEvent.setup();
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <Combobox options={OPTIONS} loading aria-label="Lettres" />
      </ZedkitUiProvider>,
    );
    await user.click(screen.getByRole("combobox", { name: "Lettres" }));
    await user.keyboard("{ArrowDown}");
    const list = await screen.findByRole("listbox");
    expect(list.textContent).toMatch(/Chargement/);
  });
});
