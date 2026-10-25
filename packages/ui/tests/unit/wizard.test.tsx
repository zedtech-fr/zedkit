import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OptionCards, WizardSteps } from "#index.js";

describe("WizardSteps", () => {
  it("marks the current step and checks off earlier ones", () => {
    render(<WizardSteps steps={["One", "Two", "Three"]} current={1} />);
    expect(screen.getByText("Two").closest("li")?.getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("One").closest("li")?.getAttribute("aria-current")).toBeNull();
    expect(screen.getByText("Three").closest("li")?.textContent).toContain("3");
  });
});

describe("OptionCards", () => {
  const options = [
    { id: "a", title: "Alpha", description: "First." },
    { id: "b", title: "Beta" },
  ];

  it("renders preselected cards as checked", () => {
    render(<OptionCards options={options} selected={["a"]} onChange={() => {}} />);
    expect((screen.getByRole("checkbox", { name: /Alpha/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: /Beta/ }) as HTMLInputElement).checked).toBe(false);
  });

  it("adds and removes ids when cards are clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<OptionCards options={options} selected={["a"]} onChange={onChange} />);
    await user.click(screen.getByText("Beta"));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    rerender(<OptionCards options={options} selected={["a", "b"]} onChange={onChange} />);
    await user.click(screen.getByText("Alpha"));
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });
});
