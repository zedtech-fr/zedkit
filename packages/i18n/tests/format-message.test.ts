import { describe, expect, it } from "vitest";

import { formatMessage } from "#format-message.js";

describe("formatMessage", () => {
  it("replaces named placeholders", () => {
    expect(formatMessage("Page {page} of {pageCount}", { page: 2, pageCount: 5 })).toBe("Page 2 of 5");
  });

  it("leaves unknown placeholders intact", () => {
    expect(formatMessage("Hi {name}", {})).toBe("Hi {name}");
  });
});
