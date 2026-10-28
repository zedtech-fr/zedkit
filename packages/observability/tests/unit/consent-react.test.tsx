import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMemoryConsentStore } from "#consent/index.js";
import { ConsentGate, ConsentProvider } from "#consent-react.js";

describe("ConsentGate", () => {
  it("renders children only when the category is granted", () => {
    const store = createMemoryConsentStore();
    render(
      <ConsentProvider store={store}>
        <ConsentGate category="analytics" fallback={<span>blocked</span>}>
          <span>allowed</span>
        </ConsentGate>
      </ConsentProvider>,
    );
    expect(screen.getByText("blocked")).toBeTruthy();
    act(() => store.write({ analytics: true, marketing: false }));
    expect(screen.getByText("allowed")).toBeTruthy();
  });
});
