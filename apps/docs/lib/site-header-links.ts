import { createElement } from "react";
import type { LinkItemType } from "fumadocs-ui/layouts/shared";
import { IdentitySwitcher } from "@zedtech/zedkit-ui";

/** Global marketing/docs header links (GitHub comes from `githubUrl` on the layout). */
export function siteHeaderLinks(changelogHref: string): LinkItemType[] {
  return [
    { text: "Documentation", url: "/docs", active: "nested-url" },
    {
      type: "menu",
      text: "Guides",
      items: [
        { text: "Getting started", url: "/docs/getting-started", active: "url" },
        { text: "Tutorials & catalog", url: "/docs", active: "url" },
      ],
    },
    { text: "Changelog", url: changelogHref, external: true },
    { type: "custom", secondary: true, children: createElement("li", { className: "list-none" }, createElement(IdentitySwitcher)) },
  ];
}
