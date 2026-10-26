import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DataTable, DataTablePagination, DataTableToolbar, createDataTableColumns } from "#index.js";

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

  it("uses token-driven cell padding with no value arbitraries", () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    const head = container.querySelector("th");
    expect(head?.className).toContain("px-table-cell");
    expect(head?.className).toContain("h-table-head-height");
    const cell = container.querySelector("td");
    expect(cell?.className).toContain("p-table-cell");
    for (const el of [head, cell]) {
      expect(el?.className).not.toMatch(/\[[-\d#]/);
    }
  });

  it("styles chrome (filter, sort, loading, pagination) from design tokens", () => {
    const { container } = render(<DataTable columns={columns} data={data} pageSize={1} />);
    const root = container.firstElementChild;
    expect(root?.classList.contains("space-y-data-table-stack")).toBe(true);
    expect(root?.className).not.toMatch(/(^|\s)space-y-4(\s|$)/);
    const filter = container.querySelector("input");
    expect(filter?.classList.contains("max-w-data-table-filter-width")).toBe(true);
    expect(filter?.className).not.toMatch(/(^|\s)max-w-sm(\s|$)/);
    const sortButton = screen.getByRole("button", { name: /Name/ });
    expect(sortButton.classList.contains("gap-data-table-sort-gap")).toBe(true);
    expect(sortButton.className).not.toMatch(/(^|\s)gap-1(\s|$)/);
    expect(sortButton.querySelector("svg")?.classList.contains("size-icon-sm")).toBe(true);
    const pager = screen.getByText(/Page 1 of/).parentElement;
    expect(pager?.classList.contains("gap-data-table-pagination-gap")).toBe(true);
    expect(pager?.className).not.toMatch(/(^|\s)gap-2(\s|$)/);
  });

  it("styles loading skeletons from design tokens", () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    const skeleton = container.querySelector(".motion-safe\\:animate-pulse");
    expect(skeleton?.classList.contains("h-data-table-skeleton-height")).toBe(true);
    expect(skeleton?.className).not.toMatch(/(^|\s)h-4(\s|$)/);
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
    expect(screen.queryByText(/Page \d+ of/)).toBeNull();
  });

  it("hides pagination when every row fits on one page", () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.queryByText(/Page \d+ of/)).toBeNull();
  });

  it("shows loading placeholders while loading", () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    expect(screen.getByLabelText("Loading").tagName).toBe("TABLE");
    expect(container.querySelectorAll(".motion-safe\\:animate-pulse")).toHaveLength(6);
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

describe("DataTablePagination", () => {
  it("composes standalone paging with explicit state", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <DataTablePagination
        page={2}
        pageCount={4}
        canPrevious
        canNext={false}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );
    expect(screen.getByText("Page 2 of 4")).not.toBeNull();
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });
});

describe("DataTableToolbar", () => {
  it("composes a standalone labelled filter input with token width", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataTableToolbar value="" onChange={onChange} placeholder="Filter…" />);
    const input = screen.getByLabelText("Filter…");
    expect(input.tagName).toBe("INPUT");
    expect(input.classList.contains("max-w-data-table-filter-width")).toBe(true);
    await user.type(input, "A");
    expect(onChange).toHaveBeenCalledWith("A");
  });
});
