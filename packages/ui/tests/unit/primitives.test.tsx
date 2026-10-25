import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "#index.js";
import { Button } from "#index.js";
import { Input } from "#index.js";
import { Label } from "#index.js";
import { Separator } from "#index.js";
import { Skeleton } from "#index.js";

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
});
