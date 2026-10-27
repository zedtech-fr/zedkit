// Original work by the same author.
import { z } from "zod";

/**
 * Parse `process.env` (or a test fixture) with a zod shape and fail at boot
 * with one readable message. Complements Nest `validateEnv` for non-Nest services.
 */
export function loadEnv<S extends z.ZodRawShape>(
  shape: S,
  source: Record<string, string | undefined> = process.env,
): z.infer<z.ZodObject<S>> {
  const parsed = z.object(shape).safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}
