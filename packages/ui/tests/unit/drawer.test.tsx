import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { assertNoValueArbitraries } from "./no-arbitraries.js";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "#index.js";

beforeAll(() => {
  stubDrawerJsdom();
});
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
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
    expect(overlay?.className).toContain("backdrop-blur-sm");
    await user.click(overlay as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders on the right with the direction attribute", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("right");
    expect(dialog.className).toContain("pin-right");
  });

  it("renders a full-height side panel narrower than the screen when mobile is side", async () => {
    const user = userEvent.setup();
    render(
      <Drawer mobile="side" direction="right">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog", { name: "Delivery details" });
    expect(panel.className).toContain("w-drawer-side-mobile-width");
    expect(panel.className).toContain("pin-y");
  });

  it("maps right drawers to bottom on narrow viewports when mobile is sheet", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("bottom");
    expect(dialog.className).toContain("pin-bottom");
    stubDrawerJsdom();
  });

  it("gives bare content side gutters and a safe-area bottom inset, and tags the kit slots", async () => {
    const user = userEvent.setup();
    render(
      <Drawer direction="bottom">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>Body</DrawerBody>
          <DrawerFooter>Footer</DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    // Bare children (anything but the kit slots, the handle, and buttons) pick up the shared gutters.
    expect(dialog.className).toContain("px-drawer-chrome-padding");
    expect(dialog.className).toContain("pb-drawer-footer-safe");
    // The slots carry their own spacing, so they are excluded from that net.
    for (const slot of ["drawer-handle", "drawer-header", "drawer-body", "drawer-footer"]) {
      expect(dialog.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("styles the close button from the overlay touch target token", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerCloseButton data-testid="close" />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByTestId("close").className).toContain("size-overlay-touch-target");
  });

  it("keeps the side panel on a narrow viewport when mobile is side", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(
      <Drawer mobile="side" direction="left">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("left");
    expect(dialog.className).toContain("w-drawer-side-mobile-width");
    stubDrawerJsdom();
  });

  it("respects the safe-area insets on every edge it touches", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="top" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog", { name: "Delivery details" }).className).toContain("pt-drawer-safe-top");
  });

  it("hides the handle on side drawers and moves it to the far edge of a top drawer", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHandle data-testid="handle" />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const handle = screen.getByTestId("handle");
    expect(handle.className).toContain("in-data-[vaul-drawer-direction=left]:hidden");
    expect(handle.className).toContain("in-data-[vaul-drawer-direction=right]:hidden");
    expect(handle.className).toContain("in-data-[vaul-drawer-direction=top]:order-last");
  });

  it("scrolls its body inside the drawer without chaining to the page", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
          <DrawerBody data-testid="body">content</DrawerBody>
        </DrawerContent>
      </Drawer>,
    );
    const body = screen.getByTestId("body");
    expect(body.className).toContain("overflow-y-auto");
    expect(body.className).toContain("overscroll-y-contain");
    expect(body.className).toContain("pane-shrink");
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("pins a top drawer to the top edge", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="top" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("top");
    expect(dialog.className).toContain("pin-top");
  });

  it("pins a left drawer to the left edge", async () => {
    const user = userEvent.setup();
    render(
      <Drawer mobile="side" direction="left">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("left");
    expect(dialog.className).toContain("pin-left");
  });

  it("defaults to the bottom when direction is omitted", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("bottom");
    expect(dialog.className).toContain("pin-bottom");
  });

  it("renders open when controlled open is true", () => {
    render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("ignores the trigger when controlled open is false", async () => {
    const user = userEvent.setup();
    render(
      <Drawer open={false} onOpenChange={() => {}}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders no overlay when modal is false", () => {
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerContent modal={false}>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    expect(document.querySelector("[data-vaul-overlay]")).toBeNull();
  });

  it("omits the vaul overlay when DrawerContent sets modal false on a modal root", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent modal={false}>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    expect(document.querySelector("[data-vaul-overlay]")).toBeNull();
  });

  it("forwards content ref callbacks on a modal vaul drawer", () => {
    const ref = vi.fn();
    render(
      <Drawer defaultOpen>
        <DrawerContent ref={ref}>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(ref).toHaveBeenCalled();
  });

  it("stays open on overlay click when not dismissible", async () => {
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
    const overlay = document.querySelector("[data-vaul-overlay]");
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("exposes an unnamed dialog when the title is omitted", async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerDescription>Untitled panel.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(screen.queryByRole("dialog", { name: "Delivery details" })).toBeNull();
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

  it("stacks and sizes content from theme tokens", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="bottom" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const sheet = screen.getByRole("dialog", { name: "Delivery details" });
    expect(sheet.className).toContain("z-drawer");
    expect(sheet.className).not.toContain("z-overlay");
    expect(sheet.className).toContain("max-h-drawer-sheet-max-height");
    expect(sheet.className).not.toContain("96dvh");
    expect(document.querySelector("[data-vaul-overlay]")?.className).toContain("z-overlay");
  });

  it("sizes side drawers from the side-width token", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog", { name: "Delivery details" });
    expect(panel.className).toContain("sm:max-w-drawer-side");
    expect(panel.className).not.toContain("sm:max-w-md");
  });

  it("accepts lg side width for wide assistant panels", async () => {
    const user = userEvent.setup();
    render(
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent size="lg">
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog", { name: "Delivery details" });
    expect(panel.className).toContain("sm:max-w-drawer-side-lg");
    expect(panel.className).toContain("shadow-overlay");
  });

  it("styles handle, header, and footer from theme tokens", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHandle data-testid="handle" />
          <DrawerHeader data-testid="header">
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter data-testid="footer">actions</DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    const handle = screen.getByTestId("handle");
    expect(handle.className).toContain("mt-drawer-handle-top");
    expect(handle.className).toContain("h-drawer-handle-height");
    expect(handle.className).toContain("w-drawer-handle-width");
    expect(handle.className).not.toMatch(/(^|\s)(h-1\.5|w-12)(\s|$)/);
    const header = screen.getByTestId("header");
    expect(header.className).toContain("gap-drawer-header-gap");
    expect(header.className).toContain("p-drawer-chrome-padding");
    const footer = screen.getByTestId("footer");
    expect(footer.className).toContain("gap-drawer-footer-gap");
    expect(footer.className).not.toContain("gap-2");
    expect(footer.className).toContain("px-drawer-chrome-padding");
    expect(footer.className).toContain("pb-drawer-footer-safe");
  });

  it("carries no value arbitraries on content, overlay, or chrome", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="bottom" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    const classes = [
      dialog.className,
      document.querySelector("[data-vaul-overlay]")?.className ?? "",
    ];
    for (const className of classes) {
      assertNoValueArbitraries(className);
    }
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

  it("moves focus inside on open so the trap engages", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <OpenDrawer />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("traps Tab inside a modal drawer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerTitle>Delivery details</DrawerTitle>
            <button type="button">first</button>
            <button type="button">second</button>
          </DrawerContent>
        </Drawer>
        <button type="button">after</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("returns focus to the trigger after Escape", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Delivery details" }).contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("focuses the panel itself on open, never a field", async () => {
    const user = userEvent.setup();
    render(
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
          <input aria-label="Name" defaultValue="Ada" />
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(document.activeElement).toBe(dialog);
    const field = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(field.selectionStart).toBe(field.selectionEnd);
  });

  it("initialFocus moves to the field with the caret at the end", async () => {
    const user = userEvent.setup();
    render(
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent initialFocus="#drawer-name">
          <DrawerTitle>Delivery details</DrawerTitle>
          <input id="drawer-name" aria-label="Name" defaultValue="Ada" />
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    screen.getByRole("dialog", { name: "Delivery details" });
    const field = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(3);
    expect(field.selectionEnd).toBe(3);
  });

  it("does not mount-autofocus when modal is false", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">outside</button>
        <Drawer modal={false}>
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent modal={false}>
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("allows Tab to reach outside when modal is false", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Drawer modal={false}>
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent modal={false}>
            <DrawerTitle>Delivery details</DrawerTitle>
            <button type="button">inside</button>
          </DrawerContent>
        </Drawer>
        <button type="button">after</button>
      </>,
    );
    const after = screen.getByRole("button", { name: "after" });
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.tab();
    expect(document.activeElement).toBe(after);
    expect(screen.getByRole("dialog", { name: "Delivery details" }).contains(document.activeElement)).toBe(
      false,
    );
  });

  it("does not aria-hide page content when modal is false", () => {
    render(
      <>
        <main data-testid="page-main">Page</main>
        <Drawer defaultOpen modal={false}>
          <DrawerContent modal={false}>
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </>,
    );
    expect(screen.getByTestId("page-main").getAttribute("aria-hidden")).toBeNull();
  });

  it("closes on Escape when modal is false and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Drawer modal={false}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent modal={false}>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("opens from a plain non-modal trigger in controlled mode", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer open={false} onOpenChange={onOpenChange} modal={false}>
        <DrawerTrigger>Open inline</DrawerTrigger>
        <DrawerContent modal={false}>
          <DrawerTitle>Inline panel</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open inline" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("wires non-modal description, handle, and close chrome", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen modal={false} direction="right">
        <DrawerContent modal={false}>
          <DrawerHandle />
          <DrawerTitle>Inline panel</DrawerTitle>
          <DrawerDescription>Context for the panel.</DrawerDescription>
          <DrawerCloseButton />
        </DrawerContent>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Inline panel" });
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.querySelector("[data-slot='drawer-handle']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not open a non-modal drawer when the trigger click is defaultPrevented", async () => {
    const user = userEvent.setup();
    render(
      <Drawer modal={false}>
        <DrawerTrigger asChild>
          <Button
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            Blocked open
          </Button>
        </DrawerTrigger>
        <DrawerContent modal={false}>
          <DrawerTitle>Inline panel</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Blocked open" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("forwards ref callbacks on non-modal trigger and content", () => {
    const triggerRef = vi.fn();
    const contentRef = vi.fn();
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerTrigger ref={triggerRef}>Open inline</DrawerTrigger>
        <DrawerContent ref={contentRef} modal={false}>
          <DrawerTitle>Inline panel</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(triggerRef).toHaveBeenCalled();
    expect(contentRef).toHaveBeenCalled();
  });

  it("forwards object refs on non-modal trigger and content", () => {
    const triggerRef = { current: null as HTMLButtonElement | null };
    const contentRef = { current: null as HTMLDivElement | null };
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerTrigger ref={triggerRef}>Open inline</DrawerTrigger>
        <DrawerContent ref={contentRef} modal={false}>
          <DrawerTitle>Inline panel</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(triggerRef.current).not.toBeNull();
    expect(contentRef.current).not.toBeNull();
  });

  it("closes from an asChild non-modal close control", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerContent modal={false}>
          <DrawerTitle>Inline panel</DrawerTitle>
          <DrawerClose asChild>
            <Button>Dismiss</Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not close a non-modal drawer when the asChild close click is defaultPrevented", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerContent modal={false}>
          <DrawerTitle>Inline panel</DrawerTitle>
          <DrawerClose asChild>
            <Button
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              Dismiss
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("dialog", { name: "Inline panel" })).not.toBeNull();
  });

  describe("non-modal swipe-to-dismiss", () => {
    const PANEL_HEIGHT = 400;
    const DISMISS_DRAG = 120;

    function stubPanelRect(el: HTMLElement, height = PANEL_HEIGHT) {
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 320,
        width: 320,
        bottom: height,
        height,
        toJSON: () => ({}),
      });
    }

    function swipe(target: Element, fromY: number, toY: number, pointerType = "") {
      fireEvent.pointerDown(target, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        pointerType,
        clientX: 80,
        clientY: fromY,
      });
      fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, pointerType, clientX: 80, clientY: toY });
      fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, pointerType, clientX: 80, clientY: toY });
    }

    afterEach(() => {
      vi.restoreAllMocks();
      stubDrawerJsdom();
      document.documentElement.removeAttribute("data-motion");
    });

    function renderSheet(props?: {
      direction?: "top" | "right" | "bottom" | "left";
      dismissible?: boolean;
      scrolled?: boolean;
      withField?: boolean;
      withLink?: boolean;
      withOption?: boolean;
      dataSlot?: string;
      onPointerDown?: (event: { preventDefault(): void }) => void;
    }) {
      render(
        <Drawer defaultOpen modal={false} direction={props?.direction ?? "bottom"} dismissible={props?.dismissible ?? true}>
          <DrawerContent
            modal={false}
            onPointerDown={props?.onPointerDown}
            {...(props?.dataSlot ? { "data-slot": props.dataSlot } : {})}
          >
            <DrawerHandle data-testid="handle" />
            <DrawerTitle>Delivery details</DrawerTitle>
            <DrawerBody data-testid="body">
              {props?.withField ? <input aria-label="Name" defaultValue="Ada" /> : null}
              {props?.withLink ? <a href="#details">Editor</a> : null}
              {props?.withOption ? (
                <div role="option" aria-selected="false">
                  Choice
                </div>
              ) : null}
              {props?.withField || props?.withLink || props?.withOption ? null : <p>Body copy</p>}
            </DrawerBody>
          </DrawerContent>
        </Drawer>,
      );
      const dialog = screen.getByRole("dialog", { name: "Delivery details" });
      stubPanelRect(dialog);
      const body = screen.getByTestId("body");
      if (props?.scrolled) {
        Object.defineProperty(body, "scrollTop", { configurable: true, get: () => 80 });
        expect(body.scrollTop).toBe(80);
      }
      return { dialog, body, handle: screen.getByTestId("handle") };
    }

    function renderBottomSheet(props?: { dismissible?: boolean; scrolled?: boolean; withField?: boolean }) {
      return renderSheet(props);
    }

    it("gives the non-modal handle a 24px hit area around the 6px bar", () => {
      const { handle } = renderBottomSheet();
      expect(handle.className).toContain("hit-target");
      expect(handle.className).toContain("h-drawer-handle-height");
    });

    it("closes when the handle is dragged down", () => {
      const { handle } = renderBottomSheet();
      swipe(handle, 10, 10 + DISMISS_DRAG);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes when the handle is dragged down on a customized data-slot panel", () => {
      const { handle, dialog } = renderSheet({ dataSlot: "identity-dock-panel" });
      expect(dialog.getAttribute("data-slot")).toBe("identity-dock-panel");
      swipe(handle, 10, 10 + DISMISS_DRAG);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes when a touch pointer drags the handle on a customized data-slot panel", () => {
      const { handle, dialog } = renderSheet({ dataSlot: "identity-dock-panel" });
      expect(dialog.getAttribute("data-slot")).toBe("identity-dock-panel");
      swipe(handle, 10, 10 + DISMISS_DRAG, "touch");
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("stays open when the handle is tapped without a drag", () => {
      const { handle } = renderBottomSheet();
      swipe(handle, 12, 12);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("stays open when the handle drag is under 8px", () => {
      const { handle } = renderBottomSheet();
      swipe(handle, 12, 19);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("stays open when the handle is dragged away from the edge", () => {
      const { handle } = renderBottomSheet();
      swipe(handle, 40, 10);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("closes when the body is dragged down at rest", () => {
      const { body } = renderBottomSheet();
      swipe(body, 40, 40 + DISMISS_DRAG);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("stays open when a touch pointer drags the body", () => {
      const { body } = renderBottomSheet();
      swipe(body, 40, 40 + DISMISS_DRAG, "touch");
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("closes when a touch pointer drags the handle", () => {
      const { handle } = renderBottomSheet();
      swipe(handle, 10, 10 + DISMISS_DRAG, "touch");
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("stays open when the body is dragged while scrolled", () => {
      const { body } = renderBottomSheet({ scrolled: true });
      swipe(body, 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("does not dismiss from a form control", () => {
      renderBottomSheet({ withField: true });
      swipe(screen.getByRole("textbox", { name: "Name" }), 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("does not dismiss from a link", () => {
      renderSheet({ withLink: true });
      swipe(screen.getByRole("link", { name: "Editor" }), 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("does not dismiss from a portaled option", () => {
      renderSheet({ withOption: true });
      swipe(screen.getByRole("option", { name: "Choice" }), 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("does not capture the pointer on body press before the drag slop", () => {
      const { body } = renderBottomSheet();
      const capture = vi.mocked(Element.prototype.setPointerCapture);
      capture.mockClear();
      fireEvent.pointerDown(body, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: 80,
        clientY: 40,
      });
      expect(capture).not.toHaveBeenCalled();
      fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 48 });
      expect(capture).toHaveBeenCalled();
      fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 48 });
    });

    it("closes when a top sheet handle is dragged up", () => {
      const { handle } = renderSheet({ direction: "top" });
      swipe(handle, 200, 200 - DISMISS_DRAG);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes when a top sheet body is dragged up at rest", () => {
      const { body } = renderSheet({ direction: "top" });
      swipe(body, 200, 200 - DISMISS_DRAG);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("stays open when the body drag is under the 20% threshold", () => {
      const { body } = renderBottomSheet();
      swipe(body, 40, 40 + 40);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("stays open when a body drag is selecting text", () => {
      const { body } = renderBottomSheet();
      const selection = {
        isCollapsed: false,
        toString: () => "Body copy",
      };
      vi.spyOn(document, "getSelection").mockReturnValue(selection as unknown as Selection);
      swipe(body, 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("stays open when the consumer prevents the body pointerdown", () => {
      const { body } = renderSheet({
        onPointerDown: (event) => {
          event.preventDefault();
        },
      });
      swipe(body, 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("clears the drag and stays open on pointercancel", () => {
      const { handle, dialog } = renderBottomSheet();
      fireEvent.pointerDown(handle, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: 80,
        clientY: 10,
      });
      fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      fireEvent.pointerCancel(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      expect(dialog.style.transform).toBe("");
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("does not swipe-dismiss a left drawer", () => {
      const { handle } = renderSheet({ direction: "left" });
      swipe(handle, 10, 10 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("does not swipe-dismiss a right drawer", () => {
      const { handle } = renderSheet({ direction: "right" });
      swipe(handle, 10, 10 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("stays open on handle drag when not dismissible", () => {
      const { handle } = renderBottomSheet({ dismissible: false });
      swipe(handle, 10, 10 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("stays open on body drag when not dismissible", () => {
      const { body } = renderBottomSheet({ dismissible: false });
      swipe(body, 40, 40 + DISMISS_DRAG);
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("ignores a non-primary pointer on the handle", () => {
      const { handle } = renderBottomSheet();
      fireEvent.pointerDown(handle, {
        pointerId: 1,
        isPrimary: false,
        button: 0,
        clientX: 80,
        clientY: 10,
      });
      fireEvent.pointerMove(window, { pointerId: 1, isPrimary: false, clientX: 80, clientY: 10 + DISMISS_DRAG });
      fireEvent.pointerUp(window, { pointerId: 1, isPrimary: false, clientX: 80, clientY: 10 + DISMISS_DRAG });
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    });

    it("ignores a mismatched pointerId on move and up", () => {
      const { handle } = renderBottomSheet();
      fireEvent.pointerDown(handle, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: 80,
        clientY: 10,
      });
      fireEvent.pointerMove(window, { pointerId: 2, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      fireEvent.pointerUp(window, { pointerId: 2, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
      fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 });
    });

    it("restores a consumer inline transform after a cancelled drag", () => {
      const { handle, dialog } = renderBottomSheet();
      dialog.style.transform = "scale(1)";
      fireEvent.pointerDown(handle, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: 80,
        clientY: 10,
      });
      fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      fireEvent.pointerCancel(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      expect(dialog.style.transform).toBe("scale(1)");
    });

    it("keeps dismissing when setPointerCapture throws", () => {
      Element.prototype.setPointerCapture = () => {
        throw new Error("InvalidPointerId");
      };
      const { handle } = renderBottomSheet();
      swipe(handle, 10, 10 + DISMISS_DRAG);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes from the handle under reduced motion without sliding the panel", () => {
      document.documentElement.setAttribute("data-motion", "reduce");
      const { handle, dialog } = renderBottomSheet();
      fireEvent.pointerDown(handle, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: 80,
        clientY: 10,
      });
      fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      expect(dialog.style.transform).toBe("");
      fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 10 + DISMISS_DRAG });
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("still has no overlay when modal is false", () => {
      const { dialog } = renderBottomSheet();
      expect(document.querySelector("[data-vaul-overlay]")).toBeNull();
      expect(dialog.className).toContain("focus-ring");
    });
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

  it("has no axe violations when a non-modal drawer with tabs is open", async () => {
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerContent modal={false}>
          <DrawerTitle>Delivery details</DrawerTitle>
          <Tabs defaultValue="simple">
            <TabsList aria-label="Modes">
              <TabsTrigger value="simple">Classic</TabsTrigger>
              <TabsTrigger value="expert">Expert</TabsTrigger>
            </TabsList>
            <TabsContent value="simple">Classic fields</TabsContent>
            <TabsContent value="expert">Expert fields</TabsContent>
          </Tabs>
        </DrawerContent>
      </Drawer>,
    );
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

  it("returns focus to the trigger after a handle swipe-dismiss when focus was in the panel", async () => {
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent modal={false}>
          <DrawerHandle data-testid="handle" />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    dialog.focus();
    fireEvent.pointerDown(screen.getByTestId("handle"), {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 80,
      clientY: 10,
    });
    fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 130 });
    fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 130 });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open drawer" }));
  });

  it("does not move focus to the trigger when swipe-dismiss happens while focus is on the page", async () => {
    render(
      <>
        <button type="button">Outside</button>
        <Drawer defaultOpen modal={false}>
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent modal={false}>
            <DrawerHandle data-testid="handle" />
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </>,
    );
    screen.getByRole("button", { name: "Outside" }).focus();
    fireEvent.pointerDown(screen.getByTestId("handle"), {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 80,
      clientY: 10,
    });
    fireEvent.pointerMove(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 130 });
    fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, clientX: 80, clientY: 130 });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Outside" }));
  });
});
