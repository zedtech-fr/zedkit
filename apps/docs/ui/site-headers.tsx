"use client";

import { Header } from "fumadocs-ui/layouts/home/slots/header";
import {
  featuredPackageChangelogUrl,
  featuredPackageReleasesUrl,
  featuredPackageVersion,
} from "@/content/gallery";
import { MobileHeader } from "@/ui/mobile-header";

/** Marketing header slot: phone header below md, stock desktop header from md up. */
export function MarketingSiteHeader() {
  return (
    <>
      <MobileHeader
        mode="home"
        version={featuredPackageVersion}
        releasesHref={featuredPackageReleasesUrl}
        changelogHref={featuredPackageChangelogUrl}
      />
      <Header className="max-md:hidden" />
    </>
  );
}

/** Docs layout phone header (desktop docs chrome has no top bar). */
export function DocsSiteHeader() {
  return (
    <MobileHeader
      mode="docs"
      version={featuredPackageVersion}
      releasesHref={featuredPackageReleasesUrl}
      changelogHref={featuredPackageChangelogUrl}
      className="sticky top-(--fd-docs-row-1) flex h-phone-bar items-center justify-between gap-stack-sm border-b px-control-tight backdrop-blur-sm [grid-area:header] md:hidden"
    />
  );
}
