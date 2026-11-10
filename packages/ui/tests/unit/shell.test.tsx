import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AppShell, PageHeader } from "#index.js";
import { stubDrawerJsdom } from "./drawer-fixture.js";

describe("AppShell", () => {
  afterEach(() => {
    stubDrawerJsdom();
  });

  it("renders sidebar, topbar, and main slots", () => {
    render(
      <AppShell sidebar={<nav>Nav</nav>} topbar={<div>Top</div>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByText("Nav").textContent).toBe("Nav");
    expect(screen.getByText("Top").textContent).toBe("Top");
    expect(document.querySelector("header")?.className).toContain("bar-scrim");
    expect(document.querySelector("header")?.className).not.toContain("bg-background/95");
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

  it("sizes sidebar and main padding from theme tokens", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(container.querySelector("aside")?.className).toContain("w-app-shell-sidebar");
    expect(container.querySelector("aside")?.className).toContain("flex-col");
    expect(container.querySelector("aside")?.className).toContain("muted-wash");
    expect(container.querySelector("aside")?.className).not.toContain("bg-muted/40");
    expect(container.querySelector("main")?.className).toContain("p-app-shell-padding");
    expect(container.querySelector("main")?.className).toContain("md:p-app-shell-padding-md");
    expect(container.querySelector("main")?.className).toContain("overflow-y-auto");
    expect(container.querySelector("main")?.className).toContain("focus-ring");
    expect(container.querySelector("main")?.getAttribute("tabindex")).toBe("0");
    expect(container.querySelector("aside")?.getAttribute("tabindex")).toBeNull();
    expect(container.querySelector("[data-slot='app-shell-menu']")).not.toBeNull();
  });

  it("hides the sidebar below md with a single display rule, so no base rule can win on desktop", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    const classes = container.querySelector("aside")?.className.split(" ") ?? [];
    expect(classes).toContain("max-md:hidden");
    expect(classes).not.toContain("hidden");
    expect(classes).not.toContain("md:block");
  });

  it("opens the sidebar in a left drawer from the menu on a narrow viewport", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const dialog = screen.getByRole("dialog", { name: "Main navigation" });
    expect(dialog.textContent).toContain("Nav");
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("left");
    expect(dialog.querySelector("[data-slot='drawer-body']")).not.toBeNull();
    expect(within(dialog).getByRole("button", { name: "Close" })).not.toBeNull();
  });

  it("closes the drawer when a sidebar link is activated", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(
      <AppShell sidebar={<nav><a href="#runs">Runs</a></nav>}>
        <p>Content</p>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const dialog = screen.getByRole("dialog", { name: "Main navigation" });
    await user.click(within(dialog).getByRole("link", { name: "Runs" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("omits the drawer trigger when sidebarTrigger is null", () => {
    render(
      <AppShell sidebar={<nav>Nav</nav>} sidebarTrigger={null}>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[data-slot='app-shell-menu']")).toBeNull();
  });

  it("uses a custom sidebarTrigger in place of the default menu button", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(
      <AppShell sidebar={<nav>Nav</nav>} sidebarTrigger={<button type="button">Runs</button>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Runs" }));
    expect(screen.getByRole("dialog", { name: "Main navigation" }).textContent).toContain("Nav");
  });

  it("makes sidebar and main independent scrollports when fixedHeight is set", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>} fixedHeight>
        <p>Content</p>
      </AppShell>,
    );
    const root = container.querySelector("[data-slot='app-shell']");
    expect(root?.className).toContain("h-svh");
    expect(root?.className).toContain("overflow-hidden");
    expect(container.querySelector("aside")?.className).toContain("pane-shrink");
    expect(container.querySelector("aside")?.className).toContain("overflow-y-auto");
    expect(container.querySelector("aside")?.className).toContain("focus-ring");
    expect(container.querySelector("aside")?.getAttribute("tabindex")).toBe("0");
    expect(container.querySelector("main")?.className).toContain("pane-shrink");
    expect(container.querySelector("main")?.className).toContain("overflow-y-auto");
  });

  it("attaches mainRef to the scrolling main", () => {
    const mainRef = { current: null as HTMLElement | null };
    render(
      <AppShell sidebar={<nav>Nav</nav>} mainRef={mainRef}>
        <p>Content</p>
      </AppShell>,
    );
    expect(mainRef.current?.tagName).toBe("MAIN");
  });
});

describe("PageHeader", () => {
  it("renders title, description, and actions", () => {
    render(<PageHeader title="Items" description="All items." actions={<button type="button">New</button>} />);
    expect(screen.getByRole("heading", { name: "Items" }).textContent).toBe("Items");
    expect(screen.getByText("All items.").textContent).toBe("All items.");
    expect(screen.getByRole("button", { name: "New" }).textContent).toBe("New");
  });

  it("uses the token-driven title spacing with no arbitrary values", () => {
    const { container } = render(<PageHeader title="Items" description="All items." />);
    expect(container.firstElementChild?.className).toContain("gap-page-header-title-gap");
    expect(container.firstElementChild?.className).not.toContain("[");
  });

  it("spaces chrome from page-header tokens", () => {
    const { container } = render(
      <PageHeader title="Items" description="All items." actions={<button type="button">New</button>} />,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("mb-page-header-offset");
    expect(root?.className).toContain("gap-page-header-title-gap");
    expect(root?.className).not.toMatch(/(^|\s)mb-6(\s|$)/);
    const titleRow = screen.getByRole("heading", { name: "Items" }).parentElement;
    expect(titleRow?.className).toContain("gap-page-header-gap");
    const actions = screen.getByRole("button", { name: "New" }).parentElement;
    expect(actions?.className).toContain("gap-page-header-actions-gap");
    expect(actions?.className).not.toContain("gap-2");
  });
});
