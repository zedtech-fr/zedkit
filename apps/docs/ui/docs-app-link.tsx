"use client";

import NextLink from "next/link";
import type { ComponentProps, FC } from "react";

type DocsAppLinkProps = ComponentProps<"a"> & { prefetch?: boolean };

/**
 * Fumadocs chrome uses this as its framework `Link`. Prefetch is off unless
 * the caller passes `prefetch` — static hosts serve HTML for `/?_rsc=` without
 * `.txt` and would poison the client RSC cache.
 */
export const DocsAppLink: FC<DocsAppLinkProps> = ({ prefetch, href, children, ...props }) => {
  const resolved = prefetch ?? false;
  if (href == null || href === "") {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <NextLink
      {...(props as Omit<ComponentProps<typeof NextLink>, "href">)}
      href={href}
      prefetch={resolved}
    >
      {children}
    </NextLink>
  );
};
