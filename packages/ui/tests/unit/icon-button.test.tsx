import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IconButton } from "#index.js";

describe("IconButton", () => {
  it("sets aria-label and title from label", () => {
    render(<IconButton label="Search documentation">S</IconButton>);
    const btn = screen.getByRole("button", { name: "Search documentation" });
    expect(btn.getAttribute("title")).toBe("Search documentation");
  });

  it("label wins over aria-label and title passed in props", () => {
    render(
      <IconButton label="Correct name" aria-label="Wrong" title="Also wrong">
        ×
      </IconButton>,
    );
    const btn = screen.getByRole("button", { name: "Correct name" });
    expect(btn.getAttribute("aria-label")).toBe("Correct name");
    expect(btn.getAttribute("title")).toBe("Correct name");
  });
});
