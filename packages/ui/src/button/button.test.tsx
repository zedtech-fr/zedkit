import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "#button/button.js";

describe("Button", () => {
  it("uses a quiet ghost hover (muted tint, not accent fill)", () => {
    render(<Button variant="ghost">Quiet</Button>);
    const button = screen.getByRole("button", { name: "Quiet" });
    expect(button.className).toContain("hover:ghost-hover");
    expect(button.className).toContain("aria-pressed:ghost-pressed");
    expect(button.className).not.toContain("hover:bg-accent");
    expect(button.className).not.toContain("bg-muted/");
    expect(button.className).not.toContain("bg-secondary/");
  });

  it("uses underline-only link styling without a hover fill", () => {
    render(
      <Button asChild variant="link" size="sm">
        <a href="/docs">Read docs</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Read docs" });
    expect(link.className).toContain("link-offset");
    expect(link.className).not.toContain("underline-offset-4");
    expect(link.className).toContain("hover:underline");
    expect(link.className).toContain("hover:bg-transparent");
    expect(link.className).not.toContain("hover:bg-accent");
    expect(link.className).toContain("min-h-target");
  });

  it("takes ref as a prop", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Save");
    expect(ref.current?.getAttribute("data-slot")).toBe("button");
  });

  it("spaces button content with role classes", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("gap-button-gap");
    expect(button.className).toContain("py-control-block-lg");
    expect(button.className).toContain("px-button-pad");
    expect(button.className).toContain("size-icon");
  });

  it("spaces the small button from the control scale", () => {
    render(<Button size="sm">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("px-button-inline-sm");
    expect(button.className).toContain("py-control-block");
  });

  it("spaces the large button with the button pad role", () => {
    render(<Button size="lg">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("px-button-pad-lg");
    expect(button.className).not.toContain("px-8");
  });

  it("merges button styles onto asChild link", () => {
    render(
      <Button asChild variant="outline">
        <a href="/save">Save</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Save" });
    expect(link.className).toContain("border-input");
    expect(link.getAttribute("href")).toBe("/save");
    expect(link.getAttribute("data-size")).toBe("default");
  });

  it("keeps sm ghost padding on asChild anchor roots", () => {
    render(
      <Button asChild variant="ghost" size="sm">
        <a href="/docs">More in the kit</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "More in the kit" });
    expect(link.className).toContain("px-button-inline-sm");
    expect(link.className).toContain("py-control-block");
    expect(link.getAttribute("data-variant")).toBe("ghost");
    expect(link.getAttribute("data-size")).toBe("sm");
  });
});
