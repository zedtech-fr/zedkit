import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "#index.js";
import { Alert, AlertDescription, AlertTitle } from "#index.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#index.js";
import { Button } from "#index.js";
import { Input } from "#index.js";
import { Label } from "#index.js";
import { Separator } from "#index.js";
import { Skeleton } from "#index.js";
import { Heading, Text } from "#index.js";
import { Textarea } from "#index.js";

describe("primitives", () => {
  it("renders a button with its variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-destructive");
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
  });

  it("renders a badge with its text", () => {
    render(<Badge variant="outline">live</Badge>);
    expect(screen.getByText("live").className).toContain("border");
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

  it("links a label to its input", () => {
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Ada" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("placeholder", "Ada");
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
    expect(separators[0]?.className).toContain("h-separator-thickness");
    expect(separators[1]?.className).toContain("w-separator-thickness");
  });

  it("renders a skeleton block that pulses only when motion is safe", () => {
    const { container } = render(<Skeleton className="h-4 w-24" data-testid="sk" />);
    const skeleton = container.querySelector('[data-testid="sk"]');
    expect(skeleton?.className).toContain("motion-safe:animate-pulse");
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
    expect(screen.getByRole("heading", { name: "Title", level: 1 }).className).toContain("text-4xl");
    expect(screen.getByRole("heading", { name: "Section", level: 3 }).className).toContain("text-2xl");
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
    expect(alerts[1]?.className).toContain("text-destructive");
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

  it("spaces card slots from theme tokens", () => {
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
    expect(title.parentElement?.className).toContain("p-card-padding");
    expect(title.parentElement?.className).toContain("space-y-card-stack");
    expect(screen.getByText("Body text.").className).toContain("p-card-padding");
    expect(screen.getByText("Footer text.").className).toContain("p-card-padding");
  });
});
