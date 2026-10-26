import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "#index.js";

describe("Text label variant", () => {
  it("is an eyebrow: extra small, muted, capitals, never bigger than body text", () => {
    render(<Text variant="label">You want</Text>);
    const el = screen.getByText("You want");
    expect(el.className).toContain("text-xs");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("text-muted-foreground");
    expect(el.className).not.toMatch(/text-(sm|base|lg|xl)/);
  });
});
