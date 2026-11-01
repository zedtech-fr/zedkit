import type { TOCItemType } from "fumadocs-core/toc";

/** Section anchors rendered by `ComponentPage` (Fumadocs TOC only sees MDX headings). */
export const COMPONENT_PAGE_TOC: TOCItemType[] = [
  { title: "Preview", url: "#example", depth: 2 },
  { title: "Guidance", url: "#guidance", depth: 2 },
  { title: "Install or copy", url: "#install-or-copy", depth: 2 },
  { title: "Usage and states", url: "#usage-and-states", depth: 2 },
  { title: "Props", url: "#props", depth: 2 },
  { title: "Accessibility", url: "#accessibility", depth: 2 },
  { title: "Related", url: "#related", depth: 2 },
  { title: "Troubleshooting", url: "#troubleshooting", depth: 2 },
];

export function mergeComponentPageToc(mdxToc: TOCItemType[]): TOCItemType[] {
  const urls = new Set(COMPONENT_PAGE_TOC.map((item) => item.url));
  return [...COMPONENT_PAGE_TOC, ...mdxToc.filter((item) => !urls.has(item.url))];
}
