import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import {
  EmptyState,
  ErrorState,
  Spinner,
  ZedkitUiProvider,
  zedkitUiMessagesFr,
} from "#index.js";

const axePage = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

describe("EmptyState", () => {
  it("shows description and actions", () => {
    render(
      <EmptyState
        title="No invoices"
        description="Create an invoice to send to a client."
        actions={<button type="button">New invoice</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "No invoices" })).toBeTruthy();
    expect(screen.getByText("Create an invoice to send to a client.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New invoice" })).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <EmptyState description="No invoices yet." />,
    );
    expect((await axe(container, axePage)).violations).toEqual([]);
  });
});

describe("ErrorState", () => {
  it("announces what broke and the next step", () => {
    render(
      <ErrorState
        title="Could not load invoices"
        description="Check your connection and try again."
        actions={<button type="button">Try again</button>}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Could not load invoices");
    expect(alert.textContent).toContain("Check your connection and try again.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ErrorState description="The list could not be loaded." />,
    );
    expect((await axe(container, axePage)).violations).toEqual([]);
  });
});

describe("Spinner", () => {
  it("names the wait from kit messages", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeTruthy();
  });

  it("lets a label prop win and reads French from the provider", () => {
    render(<Spinner label="Saving invoices" />);
    expect(screen.getByRole("status", { name: "Saving invoices" })).toBeTruthy();
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <Spinner />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("status", { name: "Chargement" })).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Spinner />);
    expect((await axe(container, axePage)).violations).toEqual([]);
  });
});
