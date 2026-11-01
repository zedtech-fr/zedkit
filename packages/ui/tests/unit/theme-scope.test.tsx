import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, ThemeScope } from "#index.js";

describe("ThemeScope", () => {
  it("exposes a host with identity and mode on the same node", () => {
    const { container } = render(
      <ThemeScope identity="press" className="rounded-xl">
        Preview
      </ThemeScope>,
    );
    const scope = container.querySelector("[data-slot='theme-scope']");
    scope?.classList.add("dark");
    expect(scope?.getAttribute("data-identity-scope")).toBe("");
    expect(scope?.getAttribute("data-identity")).toBe("press");
    expect(scope?.classList.contains("dark")).toBe(true);
    expect(scope?.className).toContain("font-sans");
    expect(scope?.className).toContain("rounded-xl");
  });

  it("leaves root overlays on document.body when no scope is provided", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.closest("[data-slot='theme-scope']")).toBeNull();
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("mounts a dialog inside the nearest scope", async () => {
    const user = userEvent.setup();
    render(
      <ThemeScope identity="maison">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Details</DialogTitle>
          </DialogContent>
        </Dialog>
      </ThemeScope>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    const scope = dialog.closest("[data-slot='theme-scope']");
    expect(scope?.getAttribute("data-identity")).toBe("maison");
  });
});
