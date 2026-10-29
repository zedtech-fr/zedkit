import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { IdentityEditor } from "#preview/identity-editor.js";
import { identityPresets } from "#identity-tokens.js";

afterEach(() => {
  document.head.replaceChildren();
});

function fieldValue(label: string): string {
  return (screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement).value;
}

describe("IdentityEditor", () => {
  it("applies a preset to the live CSS sheet", async () => {
    const user = userEvent.setup();
    render(<IdentityEditor />);
    await user.selectOptions(screen.getByLabelText("Preset"), "press");
    expect(document.querySelector('style[data-slot="identity-token-sheet"]')?.textContent).toContain(
      "--radius: 0px",
    );
    expect(fieldValue("Radius")).toBe("0px");
  });

  it("undoes a preset change", async () => {
    const user = userEvent.setup();
    render(<IdentityEditor />);
    await user.selectOptions(screen.getByLabelText("Preset"), "press");
    expect(fieldValue("Radius")).toBe("0px");
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(fieldValue("Radius")).toBe(identityPresets.mist.radius);
  });

  it("fills CSS and JSON export from the current tokens", () => {
    render(<IdentityEditor />);
    expect(fieldValue("CSS")).toContain("--spacing: 0.25rem");
    expect(JSON.parse(fieldValue("JSON"))).toMatchObject({ spacing: identityPresets.mist.spacing });
  });

  it("suggests a validated set from the prefilled prompt", async () => {
    const user = userEvent.setup();
    render(<IdentityEditor />);
    await user.click(screen.getByRole("button", { name: "Suggest" }));
    const json = JSON.parse(fieldValue("JSON")) as { radius: string };
    expect(json.radius).toEqual(expect.any(String));
    expect(document.querySelector('style[data-slot="identity-token-sheet"]')?.textContent).toContain("--radius:");
  });
});
