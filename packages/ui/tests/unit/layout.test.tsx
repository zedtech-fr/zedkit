import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Button, Section, Stack } from "#index.js";

describe("layout", () => {
  it("stacks children vertically or horizontally with gaps", () => {
    const { container } = render(
      <>
        <Stack data-testid="v">
          <span>a</span>
        </Stack>
        <Stack data-testid="h" direction="horizontal" gap={2}>
          <span>a</span>
        </Stack>
      </>,
    );
    const vertical = container.querySelector('[data-testid="v"]');
    expect(vertical?.className).toContain("flex-col");
    expect(vertical?.className).toContain("gap-4");
    const horizontal = container.querySelector('[data-testid="h"]');
    expect(horizontal?.className).toContain("flex-row");
    expect(horizontal?.className).toContain("gap-2");
  });

  it("renders a titled section with description, actions, and content", () => {
    render(
      <Section title="Team" description="Who can access." actions={<Button size="sm">Invite</Button>}>
        <Badge>Ada</Badge>
      </Section>,
    );
    expect(screen.getByRole("heading", { name: "Team", level: 2 })).not.toBeNull();
    expect(screen.getByText("Who can access.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Invite" })).not.toBeNull();
    expect(screen.getByText("Ada")).not.toBeNull();
  });

  it("keeps the whole stack gap scale on default spacing with no arbitrary values", () => {
    const { container } = render(
      <>
        {([1, 2, 3, 4, 6, 8] as const).map((gap) => (
          <Stack key={gap} data-testid={`gap-${gap}`} gap={gap}>
            <span>a</span>
          </Stack>
        ))}
        <Section data-testid="section" title="Team">
          <span>a</span>
        </Section>
      </>,
    );
    for (const gap of [1, 2, 3, 4, 6, 8]) {
      const className = container.querySelector(`[data-testid="gap-${gap}"]`)?.className ?? "";
      expect(className).toContain(`gap-${gap}`);
      expect(className).not.toContain("[");
    }
    expect(container.querySelector('[data-testid="section"]')?.className).toContain("space-y-4");
  });

  it("renders a bare section without a header", () => {
    const { container } = render(
      <Section>
        <span>Just content.</span>
      </Section>,
    );
    expect(container.querySelector("section")?.textContent).toContain("Just content.");
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
