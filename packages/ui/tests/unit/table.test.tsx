import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "#index.js";

describe("table primitives", () => {
  it("renders head and body cells", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(document.querySelector("[data-slot=table-body]")?.className ?? "").not.toContain("border-0");
    expect(document.querySelector("[data-slot=table-row]")?.className ?? "").not.toContain("hover:bg-muted/50");
    expect(document.querySelector("[data-slot=table-footer]")?.className ?? "").not.toContain("border-b-0");
    expect(screen.getByRole("columnheader", { name: "Name" })).not.toBeNull();
    expect(screen.getByRole("cell", { name: "Ada" })).not.toBeNull();
  });

  it("spaces head, cells, and caption from theme tokens", () => {
    const { container } = render(
      <Table>
        <TableCaption>Users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(container.querySelector("th")?.className).toContain("h-table-head-height");
    expect(container.querySelector("th")?.className).toContain("px-table-cell");
    expect(container.querySelector("th")?.className).not.toContain("px-2");
    expect(container.querySelector("td")?.className).toContain("p-table-cell");
    expect(container.querySelector("td")?.className).not.toContain("p-2");
    expect(container.querySelector("caption")?.className).toContain("mt-table-caption-gap");
    expect(container.innerHTML).toContain("translate-y-table-checkbox-nudge");
    expect(container.innerHTML).not.toContain("translate-y-[2px]");
  });

  it("exposes a focusable scroll region with an accessible name", () => {
    render(
      <Table scrollAriaLabel="Team roster">
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const region = screen.getByRole("region", { name: "Team roster" });
    expect(region.getAttribute("tabindex")).toBe("0");
  });
});
