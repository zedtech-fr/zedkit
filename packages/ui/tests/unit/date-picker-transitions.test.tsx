import type { ReactElement } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  DatePicker,
  DateRangePicker,
  zedkitUiMessagesEn,
  ZedkitUiProvider,
} from "#index.js";

function wrap(ui: ReactElement) {
  return <ZedkitUiProvider messages={zedkitUiMessagesEn}>{ui}</ZedkitUiProvider>;
}

function triggerText(slot: string): string {
  return document.querySelector(`[data-slot="${slot}"]`)?.textContent ?? "";
}

describe("DatePicker controlled clear and record updates", () => {
  it("shows the placeholder after the parent clears the value", async () => {
    function Example() {
      const [value, setValue] = useState<Date | undefined>();
      return (
        <>
          <DatePicker value={value} onValueChange={setValue} defaultMonth={new Date(2026, 9, 1)} />
          <button type="button" onClick={() => setValue(undefined)}>
            Clear externally
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    render(wrap(<Example />));
    await user.click(screen.getByRole("button", { name: "Pick a date" }));
    await user.click(screen.getByRole("button", { name: /October 15/ }));
    await user.click(screen.getByRole("button", { name: "Clear externally" }));
    expect(triggerText("date-picker")).toBe("Pick a date");
  });

  it("follows a new record when the parent value changes", async () => {
    const first = new Date(2026, 9, 10);
    const second = new Date(2026, 10, 3);
    function Example() {
      const [record, setRecord] = useState<"a" | "b">("a");
      const value = record === "a" ? first : second;
      return (
        <>
          <DatePicker value={value} defaultMonth={new Date(2026, 9, 1)} />
          <button type="button" onClick={() => setRecord("b")}>
            Load record B
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    render(wrap(<Example />));
    expect(triggerText("date-picker")).toContain("October 10");
    await user.click(screen.getByRole("button", { name: "Load record B" }));
    expect(triggerText("date-picker")).toContain("November 3");
  });
});

describe("DateRangePicker controlled clear and record updates", () => {
  it("shows the range placeholder after the parent clears the value", async () => {
    function Example() {
      const [value, setValue] = useState<DateRange | undefined>();
      return (
        <>
          <DateRangePicker value={value} onValueChange={setValue} defaultMonth={new Date(2026, 9, 1)} />
          <button type="button" onClick={() => setValue(undefined)}>
            Clear externally
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    render(wrap(<Example />));
    await user.click(screen.getByRole("button", { name: "Pick a date range" }));
    await user.click(screen.getByRole("button", { name: /October 10/ }));
    await user.click(screen.getByRole("button", { name: /October 20/ }));
    await user.click(screen.getByRole("button", { name: "Clear externally" }));
    expect(triggerText("date-range-picker")).toBe("Pick a date range");
  });
});
