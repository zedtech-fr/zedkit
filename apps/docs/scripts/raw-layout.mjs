import { basename } from "node:path";

/** Dock rewrite is PR 142; component-preview.tsx is the layout-HTML ticket. */
export function isRawLayoutAllowlisted(fileName) {
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
