/** Lowercase, dashed, ASCII slug (accents stripped via NFKD). */
export function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Draft placeholder slugs (`""`, `untitled`, `untitled-N`, `draft-N`). */
export function isDraftSlug(slug: string | null | undefined): boolean {
  const value = (slug ?? "").trim().toLowerCase();
  if (value.length === 0) return true;
  if (value === "untitled") return true;
  return /^untitled-\d+$/.test(value) || /^draft-\d+$/.test(value);
}
