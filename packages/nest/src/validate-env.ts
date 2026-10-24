// Original work by the same author.
import type { Type } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validateSync, type ValidationError } from "class-validator";

function flattenErrors(errors: ValidationError[], prefix = ""): string[] {
  return errors.flatMap((error) => {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    const reasons = Object.values(error.constraints ?? {}).join(", ");
    const self = reasons ? [`${path}: ${reasons}`] : [];
    // Unreachable via flat process env today (nested objects never arrive
    // from env files), but the walk keeps the message readable if a nested
    // schema ever validates nested input.
    const children =
      error.children?.length ? flattenErrors(error.children, path) : [];
    return [...self, ...children];
  });
}

/**
 * `ConfigModule` validate hook (documented Nest recipe): instantiate the
 * schema class so field defaults and `@Type()` coercions apply, then fail
 * fast with one readable error when a declared variable is invalid.
 * Undeclared variables pass through untouched, so unrelated env (PATH,
 * CI flags, other tools) never breaks boot. Returns the instance, so
 * `ConfigService` serves defaults and coerced numbers.
 */
export function validateEnv(
  schema: Type<object>,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const instance = plainToInstance(schema, config);
  const errors = validateSync(instance);
  if (errors.length > 0) {
    throw new Error(`Invalid environment: ${flattenErrors(errors).join("; ")}`);
  }
  return instance as unknown as Record<string, unknown>;
}
