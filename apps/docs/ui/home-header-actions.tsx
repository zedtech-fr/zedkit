"use client";

import { usePathname } from "next/navigation";
import { Button, cn } from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/ui/docs-app-link";
import { OffPathLink } from "@/ui/off-path-link";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { SITE_GITHUB_URL } from "@/lib/site-links.mjs";
import { isHomePath } from "@/lib/site-nav-data";

export function HomeGitHubLink({ className }: { className?: string }) {
  return (
    <OffPathLink
      href={SITE_GITHUB_URL}
      className={cn(
        "min-h-overlay-touch-target min-w-overlay-touch-target text-zk-type-nav text-foreground focus-ring-control",
        className,
      )}
    >
      {siteChromeCopy.nav.github}
    </OffPathLink>
  );
}

export function HomeGetStartedAction({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const href = isHomePath(usePathname()) ? "#get-started" : "/#get-started";
  return (
    <Button asChild data-site-action="" className={cn("min-h-overlay-touch-target", className)}>
      <DocsAppLink href={href} onClick={onClick}>
        {siteChromeCopy.getStarted}
      </DocsAppLink>
    </Button>
  );
}
