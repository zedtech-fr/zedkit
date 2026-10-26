import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RegionSelect, stubSelectJsdom } from "./select-fixture.js";

beforeAll(() => {
  stubSelectJsdom();
});

describe("select", () => {
  it("opens, picks an option, and reports the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSelect onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await user.click(await screen.findByRole("option", { name: "Europe" }));

    expect(onChange).toHaveBeenCalledWith("eu");
    expect(screen.getByRole("combobox", { name: "Region" }).textContent).toContain("Europe");
  });

  it("stacks the open content on the overlay z-index token", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.className).toContain("z-overlay");
    expect(listbox.className).not.toContain("z-50");
  });

  it("styles the trigger from control tokens with no raw literals", () => {
    render(<RegionSelect />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    for (const token of ["h-control-height", "px-control-inline", "py-control-block-lg", "focus-ring-control"]) {
      expect(trigger.className).toContain(token);
    }
    expect(trigger.className).not.toMatch(/(^|\s)(h-9|px-3|py-2|focus:ring-1)(\s|$)/);
    expect(trigger.querySelector("svg")?.getAttribute("class")).toContain("size-icon-control");
  });

  it("shows a disabled message and reports nothing when there are no options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSelect regions={[]} onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const message = await screen.findByRole("option", { name: "No regions available" });
    expect(message.hasAttribute("data-disabled")).toBe(true);
    await user.click(message);
    expect(onChange).not.toHaveBeenCalled();
  });
});
