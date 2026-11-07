"use client";

import type { MouseEvent } from "react";
import { BrandLogo, Stack, Text } from "@zedtech/zedkit-ui";
import { brandLogoCopy } from "@/components/demos/i18n/brand-logo-copy";

/** Harbor Studio's own mark: a sail over a wave. Replace the shapes and the viewBox with yours. */
function HarborMark({ className, title = "", footer = false }: { className?: string; title?: string; footer?: boolean }) {
  return (
    <BrandLogo title={title} viewBox="0 0 32 24" className={className} {...(footer ? { "data-footer-mark": "" } : {})}>
      <path d="M16 1 25 15H7Z" />
      <path d="M0 19c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3v5H0Z" />
    </BrandLogo>
  );
}

const stay = (event: MouseEvent) => event.preventDefault();

export function BrandLogoHeaderDemo() {
  return (
    <a href="/" onClick={stay} className="flex content-shrink items-center gap-stack-sm text-foreground">
      <HarborMark className="h-logo text-primary" />
      <Text as="span" className="truncate font-semibold">
        {brandLogoCopy.brandName}
      </Text>
    </a>
  );
}

export function BrandLogoDemo() {
  return (
    <Stack gap={4} className="content-shrink">
      <Stack className="content-shrink rounded-lg border border-border bg-background">
        <header className="flex content-shrink items-center justify-between gap-stack-md border-b border-border surface-pad-inline surface-pad-block">
          {/* Logo + visible name in one link to the home page: the name labels the link, so the mark is decorative. */}
          <a href="/" onClick={stay} className="flex content-shrink items-center gap-stack-sm text-foreground">
            <HarborMark className="h-logo text-primary" />
            <Text as="span" className="truncate font-semibold">
              {brandLogoCopy.brandName}
            </Text>
          </a>
          <nav aria-label={brandLogoCopy.navAriaLabel} className="flex shrink-0 gap-stack-md text-dense text-muted-foreground">
            <a href="/work" onClick={stay}>
              {brandLogoCopy.work}
            </a>
            <a href="/about" onClick={stay}>
              {brandLogoCopy.about}
            </a>
          </nav>
        </header>
        <Stack gap={2} className="surface-pad-md">
          <Text variant="muted" className="text-caption">
            {brandLogoCopy.sizesHint}
          </Text>
          <Stack direction="horizontal" gap={4} className="flex-wrap items-end">
            <HarborMark className="h-brand text-foreground" title={brandLogoCopy.logoTitle} />
            <HarborMark className="h-logo-row text-primary" title={brandLogoCopy.logoTitle} />
            <HarborMark className="h-logo-lg text-muted-foreground" title={brandLogoCopy.logoTitle} />
            <HarborMark className="h-logo-display text-foreground" title={brandLogoCopy.logoTitle} />
          </Stack>
        </Stack>
        <footer className="flex items-center gap-stack-sm border-t border-border surface-pad-inline surface-pad-block text-muted-foreground">
          <HarborMark footer />
          <Text variant="muted" className="text-caption">
            {brandLogoCopy.copyright}
          </Text>
        </footer>
      </Stack>
      <Stack
        role="img"
        aria-label={brandLogoCopy.sharePreviewAriaLabel}
        className="aspect-[1200/630] w-full items-center justify-center gap-stack-md rounded-lg bg-primary text-primary-foreground"
      >
        <HarborMark className="h-share" />
        <Text as="span" className="text-xl font-semibold" aria-hidden="true">
          {brandLogoCopy.brandName}
        </Text>
        <Text as="span" className="text-dense opacity-80" aria-hidden="true">
          {brandLogoCopy.tagline}
        </Text>
      </Stack>
    </Stack>
  );
}
