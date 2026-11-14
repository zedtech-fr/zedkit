/** English copy for the custom identity bar. Keys only; no markup. */
export const customIdentityBarCopy = {
  badge: "Custom identity active",
  status: "This look is different from the site default.",
  reset: "Reset",
  presetActive: (label: string) => `${label} look active`,
} as const;

export type CustomIdentityBarCopy = typeof customIdentityBarCopy;
