import Link from "next/link";
import type { ComponentProps } from "react";
import { ExternalLink } from "lucide-react";
import { cn, Text } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

type OffPathLinkProps = Omit<ComponentProps<typeof Link>, "target" | "rel" | "prefetch">;

/** Link that leaves the adoption path: new tab, noopener, discreet new-tab mark. */
export function OffPathLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
  title,
  ...props
}: OffPathLinkProps) {
  const opens = siteChromeCopy.nav.opensInNewTab;
  const labelled = ariaLabel === undefined ? undefined : `${ariaLabel} (${opens})`;
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("hit-target inline-flex items-center gap-icon", className)}
      aria-label={labelled}
      title={title ?? labelled}
    >
      {children}
      {labelled === undefined ? (
        <>
          <ExternalLink aria-hidden="true" data-external-mark="" className="size-icon shrink-0" />
          <Text as="span" className="sr-only">
            {` (${opens})`}
          </Text>
        </>
      ) : null}
    </Link>
  );
}
