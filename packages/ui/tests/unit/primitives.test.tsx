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

describe("primitives", () => {
  it("renders a button with its variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-destructive");
  });

  it("renders a badge with its text", () => {
    render(<Badge variant="outline">live</Badge>);
    expect(screen.getByText("live").className).toContain("border");
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
  });

  it("renders a pulsing skeleton block", () => {
    const { container } = render(<Skeleton className="h-4 w-24" data-testid="sk" />);
    const skeleton = container.querySelector('[data-testid="sk"]');
    expect(skeleton?.className).toContain("animate-pulse");
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
});
