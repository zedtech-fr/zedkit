import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SidebarNavGroup, SidebarNavItem } from "#index.js";

describe("SidebarNavItem", () => {
  it("renders the title on a 44px button with the item data-slot", () => {
    render(<SidebarNavItem>Nightly</SidebarNavItem>);
    const row = screen.getByRole("button", { name: "Nightly" });
    expect(row.tagName).toBe("BUTTON");
    expect(row.getAttribute("type")).toBe("button");
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

  it("renders a meta-only trail, a count-only trail, and a zero count", () => {
    const { rerender, container } = render(<SidebarNavItem meta="2m ago">Nightly</SidebarNavItem>);
    expect(container.querySelector('[data-slot="sidebar-nav-item-trail"]')?.textContent).toBe("2m ago");
    rerender(<SidebarNavItem count="3">Nightly</SidebarNavItem>);
    expect(container.querySelector('[data-slot="sidebar-nav-item-trail"]')?.textContent).toBe("3");
    rerender(<SidebarNavItem count={0}>Nightly</SidebarNavItem>);
    expect(container.querySelector('[data-slot="sidebar-nav-item-trail"]')?.textContent).toBe("0");
  });

  it("marks an active button with aria-current true and a non-color cue, without hover wash", () => {
    render(<SidebarNavItem active>Nightly</SidebarNavItem>);
    const row = screen.getByRole("button", { name: "Nightly" });
    expect(row.getAttribute("aria-current")).toBe("true");
    expect(row.getAttribute("data-active")).not.toBeNull();
    expect(row.className).toContain("font-medium");
    expect(row.className).not.toContain("hover:ghost-hover");
  });

  it("lets props override aria-current on an active row", () => {
    render(
      <SidebarNavItem active aria-current="page">
        Nightly
      </SidebarNavItem>,
    );
    expect(screen.getByRole("button", { name: "Nightly" }).getAttribute("aria-current")).toBe("page");
  });

  it("applies kit disabled treatment on the button and aria-disabled on asChild links", () => {
    const { rerender } = render(<SidebarNavItem disabled>Nightly</SidebarNavItem>);
    const row = screen.getByRole("button", { name: "Nightly" });
    expect(row).toHaveProperty("disabled", true);
    expect(row.className).toContain("disabled:fade-disabled");
    expect(row.className).toContain("fade-disabled");
    rerender(
      <SidebarNavItem asChild disabled>
        <a href="/runs/1">Nightly</a>
      </SidebarNavItem>,
    );
    const link = screen.getByRole("link", { name: "Nightly" });
    expect(link.getAttribute("disabled")).toBeNull();
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.className).toContain("fade-disabled");
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
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.className).toContain("min-h-target");
    expect(link.querySelector('[data-slot="sidebar-nav-item-status"]')?.textContent).toBe("ok");
    expect(link.querySelector('[data-slot="sidebar-nav-item-title"]')?.textContent).toBe("Nightly");
    expect(link.textContent).toContain("2m ago");
    expect(link.textContent).toContain("3");
  });

  it("falls back to a button when asChild is given a string, a Fragment, or several children", () => {
    const { rerender, container } = render(<SidebarNavItem asChild>Nightly</SidebarNavItem>);
    expect(screen.getByRole("button", { name: "Nightly" }).tagName).toBe("BUTTON");
    rerender(
      <SidebarNavItem asChild>
        <>
          <a href="/runs/1">Nightly</a>
        </>
      </SidebarNavItem>,
    );
    expect(container.querySelector('[data-slot="sidebar-nav-item"]')?.tagName).toBe("BUTTON");
    rerender(
      <SidebarNavItem asChild>
        <a href="/runs/1">Nightly</a>
        <a href="/runs/2">Staging</a>
      </SidebarNavItem>,
    );
    expect(container.querySelector('[data-slot="sidebar-nav-item"]')?.tagName).toBe("BUTTON");
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
    expect(trigger?.querySelector("span")?.className).toContain("truncate");
    expect(trigger?.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector('[data-slot="sidebar-nav-group-body"]')?.className).toContain(
      "pl-control-inline",
    );
  });

  it("renders an empty group still closed", () => {
    const { container } = render(<SidebarNavGroup label="Runs" />);
    expect(container.querySelector("details")?.open).toBe(false);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("honours the open prop", () => {
    const { container } = render(
      <SidebarNavGroup label="Runs" open>
        <SidebarNavItem>Nightly</SidebarNavItem>
      </SidebarNavGroup>,
    );
    expect(container.querySelector("details")?.open).toBe(true);
    expect(screen.getByRole("button", { name: "Nightly" })).not.toBeNull();
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

  it("nests a group inside a group", async () => {
    const user = userEvent.setup();
    render(
      <SidebarNavGroup label="Runs">
        <SidebarNavGroup label="Nightly">
          <SidebarNavItem>Build</SidebarNavItem>
        </SidebarNavGroup>
      </SidebarNavGroup>,
    );
    await user.click(screen.getByText("Runs"));
    expect(screen.getByText("Nightly")).not.toBeNull();
    await user.click(screen.getByText("Nightly"));
    expect(screen.getByRole("button", { name: "Build" })).not.toBeNull();
  });
});
