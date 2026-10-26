import { render, screen } from "@testing-library/react";
import { IconButton } from "#index.js";

describe("IconButton", () => {
  it("sets aria-label and title from label", () => {
    render(<IconButton label="Search documentation">S</IconButton>);
    const btn = screen.getByRole("button", { name: "Search documentation" });
    expect(btn.getAttribute("title")).toBe("Search documentation");
  });
});
