import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loadEnv } from "#index.js";

describe("loadEnv", () => {
  it("parses a valid environment", () => {
    const env = loadEnv(
      { PORT: z.coerce.number(), NAME: z.string() },
      { PORT: "3000", NAME: "core" },
    );
    expect(env).toEqual({ PORT: 3000, NAME: "core" });
  });

  it("throws a readable error listing every issue", () => {
    expect(() => loadEnv({ PORT: z.coerce.number(), NAME: z.string() }, {})).toThrow(
      /Invalid environment:[\s\S]*NAME/,
    );
  });
});
