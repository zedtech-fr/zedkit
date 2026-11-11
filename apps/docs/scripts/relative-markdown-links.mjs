import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const RELATIVE_MD_LINK = /\[[^\]]*\]\(((\.\.?\/)[^)\s#]+)(?:#[^)]*)?\)/g;

export function relativeMarkdownLinkErrors(filePath, text) {
  const errors = [];
  for (const match of text.matchAll(RELATIVE_MD_LINK)) {
    const href = match[1];
    const target = resolve(dirname(filePath), href);
    if (!existsSync(target)) {
      errors.push(`${filePath}: relative link ${href} does not exist`);
    }
  }
  return errors;
}
