import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createMessagesContext } from "#create-messages-context.js";

const defaults = { greet: "Hello" };
const { MessagesProvider, useMessages } = createMessagesContext(defaults);

function Reader() {
  return <span>{useMessages().greet}</span>;
}

describe("createMessagesContext", () => {
  it("reads the default catalog outside a provider", () => {
    render(<Reader />);
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("reads the catalog passed to the provider", () => {
    render(
      <MessagesProvider messages={{ greet: "Bonjour" }}>
        <Reader />
      </MessagesProvider>,
    );
    expect(screen.getByText("Bonjour")).toBeTruthy();
  });
});
