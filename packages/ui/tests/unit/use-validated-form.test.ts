import { describe, expect, it } from "vitest";
import { z } from "zod";

import { useValidatedForm } from "#use-validated-form.js";
import { renderHook, waitFor } from "@testing-library/react";

describe("useValidatedForm runtime", () => {
  it("parses transformed fields on submit", async () => {
    const schema = z.object({ age: z.string().transform(Number) });
    const { result } = renderHook(() => useValidatedForm(schema, { defaultValues: { age: "42" } }));
    let parsed: number | undefined;
    await waitFor(async () => {
      await result.current.handleSubmit((values) => {
        parsed = values.age;
      })();
    });
    expect(parsed).toBe(42);
  });
});
