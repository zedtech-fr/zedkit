import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { SidebarNavGroup, SidebarNavItem } from "#index.js";

const COMPONENT_AXE_OPTIONS = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

async function expectNoViolations(element: HTMLElement): Promise<void> {
  const results = await axe(element, COMPONENT_AXE_OPTIONS);
  expect(results.violations).toEqual([]);
}

describe("SidebarNavItem", () => {
  it("renders the title on a 44px target with the item data-slot", () => {
    render(<SidebarNavItem>Nightly</SidebarNavItem>);
    const row = screen.getByRole("button", { name: "Nightly" });
    expect(row.getAttribute("data-slot")).toBe("sidebar-nav-item");
    expect(row.className).toContain("min-h-target");
  });

  it("omits status, meta, and count wrappers when those props are absent", () => {
    const { container } = render(<SidebarNavItem>Nightly</SidebarNavItem>);
    expect(container.querySelector('[data-slot="sidebar-nav-item-status"]')).toBeNull();
    expect(container.querySelector('[data-slot="sidebar-nav-item-trail"]')).toBeNull();
  });

  it("shows status, title, meta, and count in that order and names the row from the title", () => {
    render(
      <SidebarNavItem status={<span>ok</span>} meta="2m ago" count="3">
        Nightly
      </SidebarNavItem>,
    );
    const row = screen.getByRole("button", { name: "Nightly" });
    const text = row.textContent ?? "";
    expect(text.indexOf("ok")).toBeGreaterThan(-1);
    expect(text.indexOf("ok")).toBeLessThan(text.indexOf("Nightly"));
    expect(text.indexOf("Nightly")).toBeLessThan(text.indexOf("2m ago"));
    expect(text.indexOf("2m ago")).toBeLessThan(text.indexOf("3"));
  });

  it("marks an active row with aria-current page and data-active", () => {
    render(<SidebarNavItem active>Nightly</SidebarNavItem>);
    const row = screen.getByRole("button", { name: "Nightly" });
    expect(row.getAttribute("aria-current")).toBe("page");
    expect(row.getAttribute("data-active")).not.toBeNull();
  });

  it("lets props override aria-current on an active row", () => {
    render(
      <SidebarNavItem active aria-current="true">
        Nightly
      </SidebarNavItem>,
    );
    expect(screen.getByRole("button", { name: "Nightly" }).getAttribute("aria-current")).toBe("true");
  });

  it("defaults to a button with type button", () => {
    render(<SidebarNavItem>Nightly</SidebarNavItem>);
    const row = screen.getByRole("button", { name: "Nightly" });
    expect(row.tagName).toBe("BUTTON");
    expect(row.getAttribute("type")).toBe("button");
  });

  it("merges asChild onto a link and injects slots inside the anchor", () => {
    render(
      <SidebarNavItem asChild active status={<span>ok</span>} meta="2m ago" count="3">
        <a href="/runs/1">Nightly</a>
      </SidebarNavItem>,
    );
    const link = screen.getByRole("link", { name: "Nightly" });
    expect(link.getAttribute("href")).toBe("/runs/1");
    expect(link.getAttribute("data-slot")).toBe("sidebar-nav-item");
    expect(link.className).toContain("min-h-target");
    expect(link.querySelector('[data-slot="sidebar-nav-item-status"]')?.textContent).toBe("ok");
    expect(link.querySelector('[data-slot="sidebar-nav-item-title"]')?.textContent).toBe("Nightly");
    expect(link.textContent).toContain("2m ago");
    expect(link.textContent).toContain("3");
  });

  it("falls back to a button when asChild is given a string child", () => {
    render(<SidebarNavItem asChild>Nightly</SidebarNavItem>);
    expect(screen.getByRole("button", { name: "Nightly" }).tagName).toBe("BUTTON");
  });
});

describe("SidebarNavGroup", () => {
  it("is a closed native details disclosure with a 44px summary", () => {
    const { container } = render(
      <SidebarNavGroup label="Runs">
        <SidebarNavItem>Nightly</SidebarNavItem>
        <SidebarNavItem>Staging</SidebarNavItem>
      </SidebarNavGroup>,
    );
    const group = container.querySelector("details");
    const trigger = container.querySelector("summary");
    expect(group?.tagName).toBe("DETAILS");
    expect(group?.getAttribute("data-slot")).toBe("sidebar-nav-group");
    expect(group?.open).toBe(false);
    expect(trigger?.getAttribute("data-slot")).toBe("sidebar-nav-group-trigger");
    expect(trigger?.className).toContain("min-h-target");
    expect(trigger?.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("reveals item titles when the summary is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SidebarNavGroup label="Runs">
        <SidebarNavItem>Nightly</SidebarNavItem>
        <SidebarNavItem>Staging</SidebarNavItem>
      </SidebarNavGroup>,
    );
    const group = container.querySelector("details");
    expect(group?.open).toBe(false);
    await user.click(screen.getByText("Runs"));
    expect(group?.open).toBe(true);
    expect(screen.getByRole("button", { name: "Nightly" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Staging" })).not.toBeNull();
  });

  it("lets a keyboard user focus the summary so native Enter and Space can toggle", () => {
    const { container } = render(
      <SidebarNavGroup label="Runs">
        <SidebarNavItem>Nightly</SidebarNavItem>
      </SidebarNavGroup>,
    );
    const trigger = container.querySelector("summary") as HTMLElement;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("sidebar-nav axe", () => {
  it("has no violations for an item, an active item, and a group of two", async () => {
    const { container } = render(
      <>
        <SidebarNavItem>Nightly</SidebarNavItem>
        <SidebarNavItem active>Staging</SidebarNavItem>
        <SidebarNavGroup label="Runs">
          <SidebarNavItem>Nightly</SidebarNavItem>
          <SidebarNavItem>Staging</SidebarNavItem>
        </SidebarNavGroup>
      </>,
    );
    await expectNoViolations(container);
  });
});
