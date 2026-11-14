import { basename } from "node:path";

/** Dock rewrite is PR 142; component-preview.tsx is the layout-HTML ticket.
 * Chrome already used layout `<div>` under `ui/`; this lot is a path move. */
export function isRawLayoutAllowlisted(fileName) {
  if (fileName.startsWith("components/site-chrome/")) return true;
  const name = basename(fileName);
  return name === "component-preview.tsx" || /^identity-dock-.*\.tsx$/.test(name);
}

export function rawLayoutErrors(rel, source) {
  const errors = [];
  for (const match of source.matchAll(/<(div|span)[\s>/]/g)) {
    errors.push(`${rel}: raw <${match[1]}> is banned; use kit Stack/Text/Section/Heading.`);
  }
  return errors;
}

export function checkRawLayoutFile(rel, source) {
  if (isRawLayoutAllowlisted(rel)) return [];
  return rawLayoutErrors(rel, source);
}
