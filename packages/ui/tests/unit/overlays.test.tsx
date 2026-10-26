import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Button } from "#index.js";
import { ConfirmDialog } from "#index.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "#index.js";
import { SecretField } from "#index.js";
import { Toaster, toast } from "#index.js";

describe("overlays", () => {
  it("opens and closes a dialog", async () => {
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
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("animates dialog content in through the motion tokens", async () => {
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
    expect(dialog.getAttribute("data-state")).toBe("open");
    expect(dialog.className).toContain("zk-zoom-in");
    expect(dialog.className).toContain("var(--motion-base)");
  });

  it("centers dialog content with token-driven position and shadow", async () => {
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
    expect(dialog.className).toContain("dialog-center");
    expect(dialog.className).toContain("shadow-overlay");
    expect(dialog.className).not.toContain("top-[");
    expect(dialog.className).not.toContain("translate-");
  });

  it("spaces dialog slots from theme tokens", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("z-overlay");
    expect(dialog.className).toContain("gap-dialog-gap");
    expect(dialog.className).toContain("p-dialog-padding");
    expect(screen.getByText("Details").parentElement?.className).toContain("space-y-dialog-header-stack");
    expect(screen.getByRole("button", { name: "Save" }).parentElement?.className).toContain(
      "sm:space-x-dialog-footer-gap",
    );
    const close = screen.getByRole("button", { name: "Close" });
    expect(close.className).toContain("top-dialog-close-offset");
    expect(close.className).toContain("focus-ring");
    expect(close.className).toContain("opacity-50");
    expect(close.innerHTML).toContain("size-icon-control");
  });

  it("animates the dialog overlay through the motion tokens", async () => {
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
    const overlay = document.querySelector(".bg-overlay\\/80");
    expect(overlay?.getAttribute("data-state")).toBe("open");
    expect(overlay?.getAttribute("class")).toContain("zk-fade-in");
  });

  it("confirms destructive actions and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders any trigger element via the asChild slot", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<a href="/items">Delete item</a>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    );
    const trigger = screen.getByRole("link", { name: "Delete item" });
    expect(trigger.getAttribute("href")).toBe("/items");
    await user.click(trigger);
    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("shows a toast through the themed viewport", async () => {
    render(<Toaster />);
    toast("Saved");
    expect(await screen.findByText("Saved")).not.toBeNull();
  });

  it("maps toast theme to CSS-var tokens only", async () => {
    const { container } = render(<Toaster />);
    toast("Saved");
    await screen.findByText("Saved");
    for (const token of ["bg-background", "text-foreground", "border-border"]) {
      expect(container.innerHTML).toContain(token);
    }
    expect(container.innerHTML).not.toMatch(/bg-(red|blue|green|amber)-/);
  });

  describe("secret field", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("copies the value and shows feedback", async () => {
      const user = userEvent.setup();
      const writeText = vi.fn(async () => {});
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      render(<SecretField id="key" value="zbk_secret" />);
      await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
      expect(writeText).toHaveBeenCalledWith("zbk_secret");
    });

    it("does nothing without a clipboard API", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("navigator", {});
      render(<SecretField id="key" value="zbk_secret" />);
      await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
      expect(screen.getByRole("button", { name: "Copy to clipboard" })).not.toBeNull();
    });

    it("uses token-driven gap and icon size with no arbitrary values", () => {
      const { container } = render(<SecretField id="key" value="zbk_secret" />);
      const root = container.firstElementChild;
      expect(root?.className).toContain("gap-secret-field-gap");
      expect(root?.className).not.toContain("[");
      expect(container.querySelector("svg")?.className.baseVal ?? "").toContain("size-icon-control");
    });
  });
});
