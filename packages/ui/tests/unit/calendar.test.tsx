import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import {
  Calendar,
  DatePicker,
  DateRangePicker,
  Field,
  FieldLabel,
  ZedkitUiProvider,
  zedkitUiMessagesFr,
} from "#index.js";

import { stubSelectJsdom } from "./select-fixture.js";

beforeAll(() => {
  stubSelectJsdom();
});

const OCT = new Date(2026, 9, 1);
const MID = new Date(2026, 9, 15);
const AXE = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

async function expectNoViolations(element: HTMLElement) {
  const results = await axe(element, AXE);
  expect(results.violations).toEqual([]);
}

describe("calendar", () => {
  it("selects a day on the grid", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Calendar mode="single" defaultMonth={OCT} today={MID} onSelect={onSelect} />);
    expect(screen.getByRole("grid")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /October 15/ }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("skips disabled days", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Calendar mode="single" defaultMonth={OCT} today={MID} disabled={MID} onSelect={onSelect} />,
    );
    await user.click(screen.getByRole("button", { name: /October 15/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("uses French nav labels from the provider", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <Calendar defaultMonth={OCT} today={MID} />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("button", { name: "Précédent" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Suivant" })).not.toBeNull();
  });

  it("opens a date picker, picks a day, and closes", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Field>
        <FieldLabel htmlFor="due">Due date</FieldLabel>
        <DatePicker id="due" defaultMonth={OCT} today={MID} onValueChange={onValueChange} />
      </Field>,
    );
    const trigger = screen.getByRole("button", { name: "Due date" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Pick a date" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /October 15/ }));
    expect(onValueChange).toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Pick a date" })).toBeNull();
    expect(trigger.textContent).toMatch(/October 15/);
  });

  it("opens and closes a date picker from the keyboard", async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultMonth={OCT} today={MID} />);
    const trigger = screen.getByRole("button", { name: "Pick a date" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Pick a date" })).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Pick a date" })).toBeNull();
  });

  it("picks a start and end day", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DateRangePicker defaultMonth={OCT} today={MID} onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Pick a date range" }));
    await user.click(screen.getByRole("button", { name: /October 10/ }));
    await user.click(screen.getByRole("button", { name: /October 20/ }));
    expect(onValueChange).toHaveBeenCalled();
    const last = onValueChange.mock.calls.at(-1)?.[0] as { from?: Date; to?: Date };
    expect(last.from?.getDate()).toBe(10);
    expect(last.to?.getDate()).toBe(20);
    expect(screen.queryByRole("dialog", { name: "Pick a date range" })).toBeNull();
  });

  it("has no axe violations on the grid and an open picker", async () => {
    const { container, unmount } = render(<Calendar defaultMonth={OCT} today={MID} />);
    await expectNoViolations(container);
    unmount();
    render(<DatePicker defaultMonth={OCT} today={MID} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Pick a date" }));
    await expectNoViolations(document.body);
  });
});
