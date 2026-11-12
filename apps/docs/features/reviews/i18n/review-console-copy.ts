/** Labels for the dense look strip on the recorded-run console only. */
export const consoleAppearanceCopy = {
  legend: "Console look",
  hint: "This changes this recorded-run console, not the site.",
  identity: "Identity",
  mode: "Dark mode",
  density: "Density",
  densityDefault: "Default",
  densityCompact: "Compact",
  reset: "Reset",
  advanced: "Token editor",
} as const;

export type ConsoleAppearanceCopy = typeof consoleAppearanceCopy;
