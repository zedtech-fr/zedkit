import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { toast } from "sonner";
import { Button } from "#index.js";
import { ConfirmDialog } from "#index.js";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "#index.js";
import { SecretField } from "#index.js";
import { Toaster } from "#index.js";

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

  it("shows a toast through the themed viewport", async () => {
    render(<Toaster />);
    toast("Saved");
    expect(await screen.findByText("Saved")).not.toBeNull();
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
  });
});
