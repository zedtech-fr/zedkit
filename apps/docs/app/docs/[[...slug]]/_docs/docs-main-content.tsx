"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { PageTransition } from "@zedtech/zedkit-ui";
import { Container } from "fumadocs-ui/layouts/docs/page/slots/container";

/**
 * Skip-link / hash target for docs pages. Occupies fumadocs' `main` grid
 * area so TOC and header stay siblings of the article; wrapping DocsLayout
 * `{children}` would steal those areas.
 */
export function DocsMainContent({ children, ...props }: ComponentProps<typeof Container>) {
  const pathname = usePathname();
  return (
    <div id="main-content" tabIndex={-1} className="content-shrink [grid-area:main]">
      <Container {...props}>
        <PageTransition routeKey={pathname} preset="settle">
          {children}
        </PageTransition>
      </Container>
    </div>
  );
}
