// Original work by the same author.
import { err, ok, tryCatch, type Result } from "@zedkit/core";
import { parse } from "yaml";

export type Frontmatter = {
  /** Parsed YAML mapping. */
  data: Record<string, unknown>;
  /** Frontmatter source text, without the `---` fences. */
  raw: string;
};

// Optional BOM, opening fence, body (may be empty), closing fence.
const FENCE = /^\uFEFF?---[ \t]*\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/;

export function parseFrontmatter(text: string): Result<Frontmatter> {
  const match = FENCE.exec(text.replace(/\r\n/g, "\n"));
  if (!match) {
    return err(new Error("missing frontmatter (file must start with a --- block)"));
  }
  const raw = match[1] ?? "";
  const parsed = tryCatch(() => parse(raw) as unknown);
  if (!parsed.ok) {
    return err(new Error(`invalid YAML frontmatter: ${parsed.error.message}`));
  }
  const value = parsed.value ?? {};
  if (typeof value !== "object" || Array.isArray(value)) {
    return err(new Error("frontmatter must be a YAML mapping"));
  }
  return ok({ data: value as Record<string, unknown>, raw });
}
