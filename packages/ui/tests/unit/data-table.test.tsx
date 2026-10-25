import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DataTable, createDataTableColumns } from "#index.js";

type Person = { name: string; age: number };

const helper = createDataTableColumns<Person>();
const columns = [helper.accessor("name", { header: "Name" }), helper.accessor("age", { header: "Age" })];
const data: Person[] = [
  { name: "Bob", age: 30 },
  { name: "Ada", age: 36 },
];

function bodyRowTexts(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent ?? "");
}

describe("DataTable", () => {
  it("renders one row per item", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("sorts ascending then descending when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(bodyRowTexts()).toEqual(["Ada36", "Bob30"]);
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("shows the empty message when there is no data", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here." />);
    expect(screen.getByText("Nothing here.").textContent).toBe("Nothing here.");
  });

  it("shows loading placeholders while loading", () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    expect(screen.getByLabelText("Loading").tagName).toBe("TABLE");
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);
    expect(screen.queryByText("Ada")).toBeNull();
  });

  it("shows the error message when one is set", () => {
    render(<DataTable columns={columns} data={data} error="Could not load rows." />);
    expect(screen.getByRole("alert").textContent).toBe("Could not load rows.");
  });

  it("filters rows by the filter input", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);
    await user.type(screen.getByLabelText("Filter…"), "Ada");
    expect(bodyRowTexts()).toEqual(["Ada36"]);
    await user.clear(screen.getByLabelText("Filter…"));
    expect(bodyRowTexts()).toEqual(["Bob30", "Ada36"]);
  });

  it("paginates with Previous/Next and shows the page count", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} pageSize={1} />);
    expect(bodyRowTexts()).toEqual(["Bob30"]);
    expect(screen.getByText("Page 1 of 2").textContent).toBe("Page 1 of 2");
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(bodyRowTexts()).toEqual(["Ada36"]);
    expect(screen.getByText("Page 2 of 2").textContent).toBe("Page 2 of 2");
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(bodyRowTexts()).toEqual(["Bob30"]);
  });
});
