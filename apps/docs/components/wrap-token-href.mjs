const UNSCOPED = new Set(["ulid", "clsx", "tailwindcss", "vaul", "sonner", "zod", "downshift"]);

/** A catalog wraps token is a package name, or a note such as `Button` or `icon`. */
export function wrapTokenHref(name) {
  if (name === "(none)" || name.includes(" ") || name.includes("<")) return null;
  const scoped = /^@[\w-]+\/[\w.-]+$/;
  const hyphenated = /^[\w.-]*-[\w.-]+$/;
  if (scoped.test(name) || hyphenated.test(name) || UNSCOPED.has(name)) {
    return `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
  }
  return null;
}
