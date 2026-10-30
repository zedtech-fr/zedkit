"use client";

import { Header } from "fumadocs-ui/layouts/home/slots/header";
import { SITE_CHANGELOG_URL } from "@/lib/site-links.mjs";
import { MobileHeader } from "@/ui/mobile-header";

const homeLinks = [
  { text: "Documentation", href: "/docs" },
  { text: "Catalog", href: "/catalog" },
  { text: "Getting started", href: "/docs/getting-started" },
  { text: "UI changelog", href: SITE_CHANGELOG_URL, external: true },
];

/** Marketing header: phone header below md, the stock desktop header from md up. */
export function SiteHeader() {
  return (
    <>
      <MobileHeader mode="home" links={homeLinks} />
      <Header className="max-md:hidden" />
    </>
  );
}

/** Docs header slot: phone header only (the docs desktop layout has no top bar). */
export function DocsHeader() {
  return (
    <MobileHeader
      mode="docs"
      links={[]}
      className="sticky top-(--fd-docs-row-1) z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b bg-background/80 px-2 backdrop-blur-sm [grid-area:header] md:hidden"
    />
  );
}
