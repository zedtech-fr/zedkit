"use client";

import type { MouseEvent } from "react";
import { BrandLogo, Stack, Text } from "@zedtech/zedkit-ui";

/** Harbor Studio's own mark: a sail over a wave. Replace the shapes and the viewBox with yours. */
function HarborMark({ className, title = "" }: { className?: string; title?: string }) {
  return (
    <BrandLogo title={title} viewBox="0 0 32 24" className={className}>
      <path d="M16 1 25 15H7Z" />
      <path d="M0 19c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3v5H0Z" />
    </BrandLogo>
  );
}

const stay = (event: MouseEvent) => event.preventDefault();

export function BrandLogoDemo() {
  return (
    <Stack gap={4} className="min-w-0">
      <Stack className="min-w-0 rounded-lg border border-border bg-background">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          {/* Logo + visible name in one link to the home page: the name labels the link, so the mark is decorative. */}
          <a href="/" onClick={stay} className="flex min-w-0 items-center gap-2 text-foreground">
            <HarborMark className="h-6 text-primary" />
            <Text as="span" className="truncate font-semibold">
              Harbor Studio
            </Text>
          </a>
          <nav aria-label="Site" className="flex shrink-0 gap-3 text-sm text-muted-foreground">
            <a href="/work" onClick={stay}>
              Work
            </a>
            <a href="/about" onClick={stay}>
              About
            </a>
          </nav>
        </header>
        <Stack gap={2} className="p-4">
          <Text variant="muted" className="text-xs">
            Same mark, four sizes and three text colours. It inherits the colour from the text around it.
          </Text>
          <Stack direction="horizontal" gap={4} className="flex-wrap items-end">
            <HarborMark className="h-5 text-foreground" title="Harbor Studio" />
            <HarborMark className="h-8 text-primary" title="Harbor Studio" />
            <HarborMark className="h-12 text-muted-foreground" title="Harbor Studio" />
            <HarborMark className="h-16 text-foreground" title="Harbor Studio" />
          </Stack>
        </Stack>
        <footer className="flex items-center gap-2 border-t border-border px-4 py-3 text-muted-foreground">
          <HarborMark className="h-4" />
          <Text variant="muted" className="text-xs">
            © 2026 Harbor Studio. All rights reserved.
          </Text>
        </footer>
      </Stack>
      <Stack
        role="img"
        aria-label="Share image preview: Harbor Studio, product design for small teams"
        className="aspect-[1200/630] w-full items-center justify-center gap-3 rounded-lg bg-primary text-primary-foreground"
      >
        <HarborMark className="h-1/4 min-h-10" />
        <Text as="span" className="text-xl font-semibold" aria-hidden="true">
          Harbor Studio
        </Text>
        <Text as="span" className="text-sm opacity-80" aria-hidden="true">
          Product design for small teams
        </Text>
      </Stack>
    </Stack>
  );
}
