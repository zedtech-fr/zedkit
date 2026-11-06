/** Symbols listed after the em dash on a catalog Import line. */
export function symbolsFromImport(importLine: string): string[] {
  const tail = importLine.split("—").at(-1)?.trim() ?? "";
  return [...tail.matchAll(/`([^`]+)`/g)].map((m) => m[1]?.trim() ?? "").filter(Boolean);
}

export function roleForExportSymbol(name: string): string {
  if (name.endsWith("Props")) return "Props type";
  if (name.endsWith("Variants") || /^[a-z]/.test(name)) return "Variants helper";
  return "Component";
}
