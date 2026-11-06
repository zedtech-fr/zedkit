const UNSAFE = /[\0\r\n]/;
const DOT_DOT = /\.\./;

/** Reject traversal and control characters; join with an optional prefix (no leading slash). */
export function sanitizeObjectKey(segment: string, keyPrefix?: string): string {
  const trimmed = segment.trim().replace(/^\/+/, "");
  if (trimmed === "" || UNSAFE.test(trimmed) || DOT_DOT.test(trimmed)) {
    throw new Error("Invalid object key segment");
  }
  const parts = trimmed.split("/").filter((part) => part !== "" && part !== ".");
  if (parts.some((part) => part === ".." || DOT_DOT.test(part))) {
    throw new Error("Invalid object key segment");
  }
  const key = parts.join("/");
  if (keyPrefix === undefined || keyPrefix === "") {
    return key;
  }
  const prefix = sanitizeObjectKey(keyPrefix);
  return `${prefix}/${key}`;
}

/** Keep a single filename safe for Content-Disposition (no path separators). */
export function sanitizeFilename(name: string): string {
  const base = name.trim().split(/[/\\]/).pop() ?? "";
  if (base === "" || UNSAFE.test(base) || DOT_DOT.test(base)) {
    throw new Error("Invalid filename");
  }
  return base;
}
