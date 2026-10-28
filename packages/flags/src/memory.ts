export type FlagValue = boolean | string | number;

export function buildOpenFeatureFlagDefinitions(
  flags: Record<string, FlagValue>,
): Record<string, unknown> {
  const definitions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flags)) {
    if (typeof value === "boolean") {
      definitions[key] = {
        variants: { on: true, off: false },
        defaultVariant: value ? "on" : "off",
        disabled: false,
      };
    } else if (typeof value === "string") {
      definitions[key] = {
        variants: { value },
        defaultVariant: "value",
        disabled: false,
      };
    } else {
      definitions[key] = {
        variants: { value },
        defaultVariant: "value",
        disabled: false,
      };
    }
  }
  return definitions;
}
