import { createElement } from "react";
import type { LinkItemType } from "fumadocs-ui/layouts/shared";
import { DocsIdentityPicker } from "@/components/docs-identity-chooser";

/** Global marketing/docs header links (GitHub comes from `githubUrl` on the layout). */
export function siteHeaderLinks(changelogHref: string): LinkItemType[] {
  return [
    { text: "Documentation", url: "/docs", active: "nested-url" },
    { text: "Catalog", url: "/catalog", active: "url" },
    {
      type: "menu",
      text: "Guides",
      items: [
        { text: "Getting started", url: "/docs/getting-started", active: "url" },
        { text: "Start without writing code", url: "/docs/start-without-writing-code", active: "url" },
        { text: "Build an admin dashboard", url: "/docs/build-an-admin-dashboard", active: "url" },
        { text: "Set up your coding agents", url: "/docs/set-up-your-coding-agents", active: "url" },
        { text: "Add SEO to a Next.js app", url: "/docs/add-seo-to-nextjs", active: "url" },
        { text: "zedkit and shadcn/ui", url: "/docs/zedkit-and-shadcn", active: "url" },
        { text: "Maturity and compatibility", url: "/docs/maturity-and-compatibility", active: "url" },
        { text: "Note list example", url: "/examples/note-list", active: "url" },
      ],
    },
    { text: "UI changelog", url: changelogHref, external: true },
    // Identity chooser (desktop header; the phone header gets its own).
    { type: "custom", secondary: true, children: createElement("li", { className: "list-none" }, createElement(DocsIdentityPicker)) },
  ];
}
