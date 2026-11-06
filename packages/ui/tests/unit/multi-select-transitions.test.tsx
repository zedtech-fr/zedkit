import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MultiSelect, zedkitUiMessagesEn, ZedkitUiProvider, type ComboboxOption } from "#index.js";

const OPTIONS: ComboboxOption[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

function wrap(ui: ReactElement) {
  return <ZedkitUiProvider messages={zedkitUiMessagesEn}>{ui}</ZedkitUiProvider>;
}

describe("MultiSelect disabled and remove notifications", () => {
  it("does not notify when disabled and the chip remove control is clicked", async () => {
    const changed = vi.fn();
    const user = userEvent.setup();
    render(
      wrap(
        <MultiSelect disabled options={OPTIONS} value={["a"]} onValueChange={changed} aria-label="Tags" />,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Remove Alpha" }));
    expect(changed).not.toHaveBeenCalled();
  });

  it("notifies exactly once when removing a chip with the mouse", async () => {
    const changed = vi.fn();
    const user = userEvent.setup();
    render(wrap(<MultiSelect options={OPTIONS} value={["a", "b"]} onValueChange={changed} aria-label="Tags" />));
    await user.click(screen.getByRole("button", { name: "Remove Alpha" }));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith(["b"]);
  });

  it("notifies exactly once when removing a chip with Backspace", async () => {
    const changed = vi.fn();
    const user = userEvent.setup();
    render(wrap(<MultiSelect options={OPTIONS} value={["a"]} onValueChange={changed} aria-label="Tags" />));
    await user.click(screen.getByText("Alpha"));
    await user.keyboard("{Backspace}");
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith([]);
  });
});
