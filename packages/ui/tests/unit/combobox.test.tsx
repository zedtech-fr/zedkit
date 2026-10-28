import { useState, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Combobox, MultiSelect, zedkitUiMessagesEn, ZedkitUiProvider, type ComboboxOption } from "#index.js";

const OPTIONS: ComboboxOption[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie" },
];

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
  beforeAll(() => {
    Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
  });

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
});
