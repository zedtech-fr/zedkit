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
});
