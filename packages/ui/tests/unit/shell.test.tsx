import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell, PageHeader } from "#index.js";

describe("AppShell", () => {
  it("renders sidebar, topbar, and main slots", () => {
    render(
      <AppShell sidebar={<nav>Nav</nav>} topbar={<div>Top</div>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByText("Nav").textContent).toBe("Nav");
    expect(screen.getByText("Top").textContent).toBe("Top");
    expect(screen.getByText("Content").textContent).toBe("Content");
  });

  it("omits the header when no topbar is given", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(container.querySelector("header")).toBeNull();
  });
});

describe("PageHeader", () => {
  it("renders title, description, and actions", () => {
    render(<PageHeader title="Items" description="All items." actions={<button type="button">New</button>} />);
    expect(screen.getByRole("heading", { name: "Items" }).textContent).toBe("Items");
    expect(screen.getByText("All items.").textContent).toBe("All items.");
    expect(screen.getByRole("button", { name: "New" }).textContent).toBe("New");
  });
});
