import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { DetailPageSkeleton, DocsPageSkeleton, ListPageSkeleton } from "#index.js";

const axePage = {
  rules: {
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
  },
};

describe("route skeletons", () => {
  it("names the docs wait and uses title, line, and code-well tokens", () => {
    const { container } = render(<DocsPageSkeleton label="Loading guide" />);
    const zone = screen.getByRole("status", { name: "Loading guide" });
    expect(zone.getAttribute("data-slot")).toBe("docs-page-skeleton");
    expect(zone.querySelector(".h-skeleton-title")).not.toBeNull();
    expect(zone.querySelector(".h-skeleton-line")).not.toBeNull();
    expect(zone.querySelector(".rounded-lg.border.bg-card.p-card-padding")).not.toBeNull();
    expect(zone.querySelector(".w-skeleton-wide")).not.toBeNull();
    expect(zone.querySelector(".w-skeleton-body")).not.toBeNull();
    expect(zone.querySelector(".w-skeleton-half")).not.toBeNull();
    expect(container.innerHTML).not.toContain("gap-2");
    expect(container.innerHTML).not.toMatch(/(^|[\s"])p-4([\s"]|$)/);
  });

  it("defaults the docs zone label", () => {
    render(<DocsPageSkeleton />);
    expect(screen.getByRole("status", { name: "Loading content" })).not.toBeNull();
  });

  it("sizes the list skeleton to its cards", () => {
    const { container, rerender } = render(<ListPageSkeleton label="Loading catalog" cards={1} />);
    expect(container.querySelector("[data-slot='list-page-skeleton']")).not.toBeNull();
    expect(container.querySelectorAll("[data-slot='card-skeleton']").length).toBe(1);
    expect(container.querySelector("[data-slot='page-header-skeleton']")).not.toBeNull();
    expect(screen.getAllByRole("status", { name: "Loading catalog" })).toHaveLength(2);

    rerender(<ListPageSkeleton cards={0} />);
    expect(container.querySelectorAll("[data-slot='card-skeleton']").length).toBe(0);

    rerender(<ListPageSkeleton />);
    expect(container.querySelectorAll("[data-slot='card-skeleton']").length).toBe(3);
  });

  it("sizes the detail skeleton to its rows", () => {
    const { container, rerender } = render(<DetailPageSkeleton label="Loading item" rows={1} />);
    expect(container.querySelector("[data-slot='detail-page-skeleton']")).not.toBeNull();
    expect(screen.getAllByRole("status", { name: "Loading item" })).toHaveLength(2);
    expect(container.querySelector("[data-slot='detail-panel-skeleton']")?.childElementCount).toBe(1);

    rerender(<DetailPageSkeleton rows={0} />);
    expect(container.querySelector("[data-slot='detail-panel-skeleton']")?.childElementCount).toBe(0);

    rerender(<DetailPageSkeleton />);
    expect(container.querySelector("[data-slot='detail-panel-skeleton']")?.childElementCount).toBe(4);
  });

  it("has no axe violations on the composed zones", async () => {
    const { container } = render(
      <>
        <DocsPageSkeleton />
        <ListPageSkeleton cards={1} />
        <DetailPageSkeleton rows={2} />
      </>,
    );
    const results = await axe(container, axePage);
    expect(results.violations).toEqual([]);
  });
});
