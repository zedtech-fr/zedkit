import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "#index.js";
import { Alert, AlertDescription, AlertTitle } from "#index.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardSkeleton, CardTitle } from "#index.js";
import { cn } from "#index.js";
import { Input } from "#index.js";
import { Label } from "#index.js";
import { Separator } from "#index.js";
import { Skeleton } from "#index.js";
import { Heading, Text } from "#index.js";
import { Textarea } from "#index.js";

describe("primitives", () => {
  it("puts input ref on the native element", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} aria-label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.getAttribute("data-slot")).toBe("input");
  });

  it("spaces the input with the field role", () => {
    render(<Input aria-label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("data-slot")).toBe("input");
    expect(input.className).toContain("px-field-pad");
    expect(input.className).not.toContain("px-3");
    expect(input.className).toContain("py-control-block");
    expect(input.className).toContain("h-control-height");
    expect(input.className).toContain("text-control");
    expect(input.className).not.toContain("file:border-0");
    expect(input.className).toContain("rounded-md");
  });

  it("renders a badge with its text", () => {
    render(<Badge variant="outline">live</Badge>);
    const badge = screen.getByText("live");
    expect(badge.tagName).toBe("DIV");
    expect(badge.getAttribute("data-slot")).toBe("badge");
    expect(badge.className).toContain("px-badge-inline");
    expect(badge.className).toContain("rounded-md");
    expect(badge.className).toContain("border");
  });

  it("merges badge styles onto asChild link", () => {
    render(
      <Badge asChild variant="secondary">
        <a href="/docs">docs</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.className).toContain("bg-secondary");
    expect(link.getAttribute("href")).toBe("/docs");
  });

  it("keeps the seven existing variant paints", () => {
    expect(badgeVariants({ variant: "default" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors border-transparent bg-primary px-badge-inline py-badge-block font-semibold text-primary-foreground shadow hover:badge-primary-hover",
    );
    expect(badgeVariants({ variant: "secondary" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors border-transparent bg-secondary px-badge-inline py-badge-block font-semibold text-secondary-foreground hover:badge-secondary-hover",
    );
    expect(badgeVariants({ variant: "destructive" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors border-transparent bg-destructive px-badge-inline py-badge-block font-semibold text-destructive-foreground shadow hover:badge-destructive-hover",
    );
    expect(badgeVariants({ variant: "success" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors border-transparent bg-success px-badge-inline py-badge-block font-semibold text-success-foreground shadow hover:badge-success-hover",
    );
    expect(badgeVariants({ variant: "warning" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors border-transparent bg-warning px-badge-inline py-badge-block font-semibold text-warning-foreground shadow hover:badge-warning-hover",
    );
    expect(badgeVariants({ variant: "outline" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors px-badge-inline py-badge-block font-semibold text-foreground",
    );
    expect(badgeVariants({ variant: "meta" })).toBe(
      "inline-flex items-center rounded-md border text-caption focus-ring transition-colors rounded-sm border-transparent bg-transparent px-meta flush-block font-mono font-normal text-muted-foreground tabular-nums shadow-none hover:text-foreground",
    );
  });

  it.each([
    ["soft-success", "badge-soft-success", "text-success"],
    ["soft-warning", "badge-soft-warning", "text-warning"],
    ["soft-danger", "badge-soft-destructive", "text-destructive"],
    ["soft-info", "badge-soft-info", "text-info"],
    ["soft-neutral", "muted-wash", "text-muted-foreground"],
  ] as const)("%s paints a tinted wash with readable ink", (variant, fill, ink) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    const badge = screen.getByText(variant);
    expect(badge.tagName).toBe("DIV");
    expect(badge.getAttribute("data-slot")).toBe("badge");
    expect(badge.className).toContain(fill);
    expect(badge.className).toContain(ink);
    expect(badge.className).toContain("border-transparent");
    expect(badge.className).toContain("px-badge-inline");
    expect(badge.className).toContain("focus-ring");
    expect(badge.className.split(/\s+/)).not.toContain("shadow");
    expect(badge.className).not.toMatch(/bg-[a-z-]+\/\d+/);
    expect(badge.className.split(/\s+/)).not.toContain("text-warning-foreground");
  });

  it("merges soft-info onto asChild link", () => {
    render(
      <Badge asChild variant="soft-info">
        <a href="/status">notice</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "notice" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("badge-soft-info");
    expect(link.className).toContain("text-info");
    expect(link.className).toContain("focus-ring");
    expect(link.getAttribute("href")).toBe("/status");
  });

  it("links a label to its input", () => {
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Ada" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("placeholder", "Ada");
  });

  it("dims the label with the kit disabled convention", () => {
    render(
      <>
        <Input id="name" placeholder="Ada" disabled className="peer" />
        <Label htmlFor="name">Name</Label>
      </>,
    );
    const label = screen.getByText("Name");
    expect(label.tagName).toBe("LABEL");
    expect(label.getAttribute("data-slot")).toBe("label");
    expect(label.className).toContain("text-dense");
    expect(label.className).toContain("peer-disabled:cursor-not-allowed");
    expect(label.className).toContain("peer-disabled:fade-disabled");
    expect(label.className).not.toContain("opacity-50");
    expect(cn("disabled:fade-disabled", "disabled:opacity-100")).toBe("disabled:opacity-100");
    expect(cn("disclosure-icon", "opacity-100")).toBe("opacity-100");
    expect(cn("sort-mark", "opacity-100")).toBe("opacity-100");
    expect(cn("status-ping", "opacity-100")).toBe("opacity-100");
    expect(cn("option-picked", "opacity-100")).toBe("opacity-100");
  });

  it("renders horizontal and vertical separators", () => {
    const { container } = render(
      <>
        <Separator />
        <Separator orientation="vertical" />
      </>,
    );
    const separators = container.querySelectorAll('[data-orientation]');
    expect(separators).toHaveLength(2);
    expect(separators[0]?.className).toContain("border-t");
    expect(separators[1]?.className).toContain("border-l");
    expect(separators[0]?.className).not.toContain("h-separator-thickness");
    expect(separators[1]?.className).not.toContain("w-separator-thickness");
  });

  it("keeps a separator decorative unless named", () => {
    render(
      <>
        <Separator />
        <Separator decorative={false} aria-label="Section break" />
      </>,
    );
    const [decorative, named] = document.querySelectorAll('[data-slot=separator]');
    expect(decorative?.getAttribute("role")).toBe("none");
    expect(named?.getAttribute("role")).toBe("separator");
    expect(named?.getAttribute("aria-label")).toBe("Section break");
  });

  it("renders a skeleton block that pulses only when motion is safe", () => {
    const { container } = render(<Skeleton className="h-skeleton-line w-skeleton-bar" data-testid="sk" />);
    const skeleton = container.querySelector('[data-testid="sk"]');
    expect(skeleton?.className).toContain("motion-safe:animate-pulse");
  });

  it("keeps skeleton styles token-driven with no arbitrary values", () => {
    const { container } = render(<Skeleton data-testid="sk-token" />);
    const skeleton = container.querySelector('[data-testid="sk-token"]');
    const className = skeleton?.className ?? "";
    expect(skeleton?.tagName).toBe("DIV");
    expect(skeleton?.getAttribute("data-slot")).toBe("skeleton");
    expect(skeleton?.getAttribute("role")).toBeNull();
    expect(className).toContain("rounded-md");
    expect(className).toContain("bg-muted");
    expect(className).not.toContain("[");
  });

  it("renders headings at the level tag with size classes", () => {
    render(
      <>
        <Heading level={1}>Title</Heading>
        <Heading level={3}>Section</Heading>
        <Heading level={2} as="div">
          Plain
        </Heading>
      </>,
    );
    expect(screen.getByRole("heading", { name: "Title", level: 1 }).className).toContain("text-zk-type-display");
    expect(screen.getByRole("heading", { name: "Section", level: 3 }).className).toContain("text-zk-type-band");
    expect(screen.getByText("Plain").tagName).toBe("DIV");
  });

  it("renders body and muted text", () => {
    render(
      <>
        <Text>Body copy.</Text>
        <Text variant="muted">Secondary copy.</Text>
      </>,
    );
    expect(screen.getByText("Secondary copy.").className).toContain("text-muted-foreground");
  });

  it("merges heading styles onto asChild link", () => {
    render(
      <Heading level={2} asChild>
        <a href="#section">Section</a>
      </Heading>,
    );
    const link = screen.getByRole("link", { name: "Section" });
    expect(link.className).toContain("text-zk-type-section");
    expect(link.className).toContain("scroll-m-heading-scroll");
    expect(link.getAttribute("href")).toBe("#section");
  });

  it("merges text styles onto asChild child", () => {
    render(
      <Text variant="muted" asChild>
        <span>Secondary copy.</span>
      </Text>,
    );
    const copy = screen.getByText("Secondary copy.");
    expect(copy.tagName).toBe("SPAN");
    expect(copy.className).toContain("text-muted-foreground");
  });

  it("renders default and destructive alerts", () => {
    render(
      <>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something worth knowing.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Failed</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      </>,
    );
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(alerts[0]?.getAttribute("data-slot")).toBe("alert");
    expect(alerts[0]?.className).toContain("rounded-lg");
    expect(alerts[1]?.className).toContain("text-destructive");
    expect(alerts[1]?.className).toContain("alert-destructive-fill");
    expect(alerts[1]?.className).toContain("alert-destructive-line");
    expect(alerts[1]?.className).not.toContain("bg-destructive/");
    expect(alerts[1]?.className).not.toContain("border-destructive/");
  });

  it("spaces the alert from the Tailwind scale", () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("py-alert-block");
    expect(alert.className).toContain("px-alert-inline");
    expect(alert.className).not.toContain("py-3");
  });

  it("merges alert styles onto an asChild section", () => {
    render(
      <Alert asChild>
        <section aria-label="Maintenance notice">
          <AlertTitle>Scheduled maintenance</AlertTitle>
        </section>
      </Alert>,
    );
    const section = screen.getByRole("alert", { name: "Maintenance notice" });
    expect(section.tagName).toBe("SECTION");
    expect(section.className).toContain("px-alert-inline");
  });

  it("renders a textarea with its placeholder", () => {
    render(<Textarea placeholder="A few words." aria-label="Bio" />);
    expect(screen.getByLabelText("Bio")).toHaveProperty("placeholder", "A few words.");
  });

  it("applies control spacing tokens on input and textarea", () => {
    render(
      <>
        <Input aria-label="Name" />
        <Textarea aria-label="Bio" />
      </>,
    );
    expect(screen.getByLabelText("Name").className).toContain("h-control-height");
    expect(screen.getByLabelText("Bio").className).toContain("min-h-textarea-min-height");
    expect(screen.getByLabelText("Bio").className).toContain("px-field-pad");
    expect(screen.getByLabelText("Bio").className).not.toContain("px-3");
    expect(screen.getByLabelText("Bio").className).toContain("py-control-block-lg");
  });

  it("sizes every text field from the input font-size token, never a fixed text-* size", () => {
    render(
      <>
        <Input aria-label="Name" />
        <Textarea aria-label="Bio" />
      </>,
    );
    for (const label of ["Name", "Bio"]) {
      const classes = screen.getByLabelText(label).className.split(/\s+/);
      expect(classes).toContain("text-control");
      expect(classes).not.toContain("text-sm");
      expect(classes).not.toContain("text-xs");
      expect(classes).not.toContain("md:text-sm");
    }
  });

  it("renders a card with header, content, and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
          <CardDescription>Connection details.</CardDescription>
        </CardHeader>
        <CardContent>Body text.</CardContent>
        <CardFooter>Footer text.</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Server")).not.toBeNull();
    expect(screen.getByText("Connection details.")).not.toBeNull();
    expect(screen.getByText("Body text.")).not.toBeNull();
    expect(screen.getByText("Footer text.")).not.toBeNull();
  });

  it("spaces card slots from the sizing recipe", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
        </CardHeader>
        <CardContent>Body text.</CardContent>
        <CardFooter>Footer text.</CardFooter>
      </Card>,
    );
    const title = screen.getByText("Server");
    const root = title.parentElement?.parentElement;
    expect(root?.getAttribute("data-slot")).toBe("card");
    expect(root?.className).toContain("rounded-(--zk-card-radius)");
    // Padding/gap come from the card recipe rules in styles.css
    // (computed values are proven in preview/cascade.spec.ts).
    expect(title.parentElement?.getAttribute("data-slot")).toBe("card-header");
    expect(screen.getByText("Body text.").getAttribute("data-slot")).toBe("card-content");
    expect(screen.getByText("Footer text.").getAttribute("data-slot")).toBe("card-footer");
    expect(root?.className).toContain("shadow-md");
    expect(root?.className).not.toMatch(/(^|\s)shadow(\s|$)/);
  });

  it("lets CardSkeleton use the same size recipe as Card", () => {
    const { container } = render(<CardSkeleton size="lg" label="Loading card" />);
    const el = container.querySelector('[data-slot="card-skeleton"]');
    expect(el?.getAttribute("data-size")).toBe("lg");
    expect(el?.className).toContain("rounded-(--zk-card-radius)");
    expect(el?.className).not.toContain("p-card-padding");
  });
});
