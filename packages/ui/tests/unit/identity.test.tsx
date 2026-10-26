import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { IDENTITY_STORAGE_KEY, IdentityScript, IdentitySwitcher, Reveal, Stagger } from "#index.js";

afterEach(() => {
  document.documentElement.removeAttribute("data-identity");
  localStorage.clear();
});

describe("IdentitySwitcher", () => {
  it("has an accessible name and no axe violations", async () => {
    const { container } = render(<IdentitySwitcher />);
    expect(screen.getByLabelText("Identity")).toBeTruthy();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("sets data-identity on the root and persists the choice", async () => {
    const user = userEvent.setup();
    render(<IdentitySwitcher />);
    await user.selectOptions(screen.getByLabelText("Identity"), "retro-square");
    expect(document.documentElement.getAttribute("data-identity")).toBe("retro-square");
    expect(localStorage.getItem(IDENTITY_STORAGE_KEY)).toBe("retro-square");
  });
});

describe("IdentityScript", () => {
  it("renders an inline script restricted to the allowed ids", () => {
    const { container } = render(<IdentityScript ids={["soft", "calm"]} />);
    const code = container.querySelector("script")?.innerHTML ?? "";
    expect(code).toContain('["soft","calm"]');
    expect(code).toContain("data-identity");
  });
});

describe("Reveal and Stagger", () => {
  it("render their children visibly without a pending state before mount effects run", () => {
    render(
      <Reveal>
        <p>Body</p>
      </Reveal>,
    );
    render(
      <Stagger>
        <p>Item</p>
      </Stagger>,
    );
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByText("Item")).toBeTruthy();
  });
});
