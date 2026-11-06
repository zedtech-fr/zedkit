/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { defineFlagRegistry } from "#registry.js";
import { writeFlagOverride } from "#overrides.js";
import { useFlag, ZedkitFlagsProvider } from "#react.js";

const registry = defineFlagRegistry({ demo: false });

function Probe() {
  const on = useFlag("demo", false);
  return <p>{on ? "on" : "off"}</p>;
}

function Toggle() {
  return (
    <button type="button" onClick={() => writeFlagOverride(localStorage, "demo", true)}>
      enable
    </button>
  );
}

describe("useFlag", () => {
  it("reflects registry defaults and local overrides", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(
      <ZedkitFlagsProvider registry={registry}>
        <Probe />
        <Toggle />
      </ZedkitFlagsProvider>,
    );
    expect(screen.getByText("off")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "enable" }));
    expect(screen.getByText("on")).toBeTruthy();
  });
});
