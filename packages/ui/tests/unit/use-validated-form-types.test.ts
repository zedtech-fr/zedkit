import { describe, expect, it } from "vitest";
import { z } from "zod";

import { useValidatedForm } from "#use-validated-form.js";

/** Exercised by `pnpm --filter @zedtech/zedkit-ui typecheck`, not at runtime. */
function typeContractChecks(): void {
  const transformSchema = z.object({ age: z.string().transform(Number) });
  const transformForm = useValidatedForm(transformSchema);
  transformForm.handleSubmit((values) => {
    const asNumber: number = values.age;
    void asNumber;
  });

  const defaultSchema = z.object({
    count: z.string().default("1").transform((value) => Number(value)),
  });
  useValidatedForm(defaultSchema, { defaultValues: { count: "2" } });
  // @ts-expect-error -- defaultValues follow z.input, not transformed output
  useValidatedForm(defaultSchema, { defaultValues: { count: 2 } });

  useValidatedForm(transformSchema, { defaultValues: { age: "12" } });
  // @ts-expect-error -- age is a string in form state before parse
  useValidatedForm(transformSchema, { defaultValues: { age: 12 } });
}

describe("useValidatedForm types", () => {
  it("is enforced by the package typecheck job", () => {
    expect(typeContractChecks.name).toBe("typeContractChecks");
  });
});
