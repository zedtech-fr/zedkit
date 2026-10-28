/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ZedkitUiProvider, zedkitUiMessagesEn } from "@zedtech/zedkit-ui";

import { ZedkitDevtools } from "../src/react.js";

afterEach(() => {
  cleanup();
});

describe("ZedkitDevtools", () => {
  it("renders the trigger when forced on", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesEn}>
        <ZedkitDevtools force buildInfo={[{ label: "Env", value: "test" }]} />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("button", { name: "Dev" })).toBeTruthy();
  });

  it("hides when enabled is false", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesEn}>
        <ZedkitDevtools enabled={false} buildInfo={[{ label: "Env", value: "test" }]} />
      </ZedkitUiProvider>,
    );
    expect(screen.queryByRole("button", { name: "Dev" })).toBeNull();
  });
});
