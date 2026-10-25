import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { Button } from "#index.js";

beforeAll(() => {
  stubDrawerJsdom();
});
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "#index.js";

function OpenDrawer(props: { direction?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Drawer {...(props.direction === undefined ? {} : { direction: props.direction })}>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerTitle>Delivery details</DrawerTitle>
        <DrawerDescription>Tracking and timeline.</DrawerDescription>
      </DrawerContent>
    </Drawer>
  );
}

describe("drawer", () => {
  it("opens and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when the overlay is clicked", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const overlay = document.querySelector("[data-vaul-overlay]");
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders on the right with the direction attribute", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("right");
    expect(dialog.className).toContain("right-0");
  });

  it("renders full-width on small screens when on the side", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog", { name: "Delivery details" }).className).toContain("w-full");
  });

  it("notifies open state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open on Escape when not dismissible", async () => {
    const user = userEvent.setup();
    render(
      <Drawer dismissible={false}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("renders open on mount with defaultOpen", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const results = await axe(document.body, {
      rules: {
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
        "document-title": { enabled: false },
        "html-has-lang": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
