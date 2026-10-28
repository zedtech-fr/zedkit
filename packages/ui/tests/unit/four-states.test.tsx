import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { FourStateEmpty, FourStateError, FourStateLoading, FourStateSuccess } from "./four-states.fixture.js";

const axePage = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

describe("four-state fixtures", () => {
  it("loading names the wait with Spinner", () => {
    render(<FourStateLoading />);
    expect(screen.getByRole("status", { name: "Loading invoices" })).toBeTruthy();
    expect(screen.getByText("Loading invoices")).toBeTruthy();
  });

  it("empty uses EmptyState with a next step", () => {
    render(<FourStateEmpty />);
    expect(screen.getByRole("heading", { name: "No invoices" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New invoice" })).toBeTruthy();
  });

  it("error uses ErrorState with retry", () => {
    render(<FourStateError />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Could not load invoices");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("success shows the filled list", () => {
    render(<FourStateSuccess />);
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("has no axe violations in each state", async () => {
    for (const node of [
      <FourStateLoading key="loading" />,
      <FourStateEmpty key="empty" />,
      <FourStateError key="error" />,
      <FourStateSuccess key="success" />,
    ]) {
      const { container, unmount } = render(node);
      expect((await axe(container, axePage)).violations).toEqual([]);
      unmount();
    }
  });
});
