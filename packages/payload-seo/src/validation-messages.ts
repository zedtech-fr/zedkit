/** Default max-length error copy by admin locale (extend via `SeoFieldsOptions.validationMessages`). */
export const SEO_VALIDATION_MESSAGES = {
  maxLength: {
    en: "Must be {max} characters or fewer (now {length}).",
    fr: "Maximum {max} caractères (actuellement {length}).",
  },
} as const;

export type SeoValidationMessages = {
  maxLength?: Record<string, string>;
};

export function formatMaxLengthMessage(
  template: string,
  max: number,
  length: number,
): string {
  return template.replace("{max}", String(max)).replace("{length}", String(length));
}

export function resolveLocale(req?: { locale?: unknown; fallbackLocale?: unknown }): string {
  const raw = req?.locale ?? req?.fallbackLocale;
  if (typeof raw === "string" && raw.length > 0 && raw !== "false" && raw !== "none") return raw;
  return "en";
}
