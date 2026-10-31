import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";

import { useValidatedForm } from "#use-validated-form.js";

describe("useValidatedForm types", () => {
  it("types handleSubmit values from schema output", () => {
    const schema = z.object({ age: z.string().transform(Number) });
    const form = useValidatedForm(schema);
    form.handleSubmit((values) => {
      expectTypeOf(values.age).toEqualTypeOf<number>();
      const asNumber: number = values.age;
      void asNumber;
    });
  });

  it("types defaultValues from schema input", () => {
    const schema = z.object({
      count: z.string().default("1").transform((value) => Number(value)),
    });
    useValidatedForm(schema, { defaultValues: { count: "2" } });
    // @ts-expect-error -- defaultValues follow z.input, not transformed output
    useValidatedForm(schema, { defaultValues: { count: 2 } });
  });

  it("rejects a manual generic that disagrees with the schema", () => {
    const schema = z.object({ age: z.string().transform(Number) });
    // @ts-expect-error -- callers must not pin field types that skip transforms
    useValidatedForm<{ age: string }>(schema);
  });
});
