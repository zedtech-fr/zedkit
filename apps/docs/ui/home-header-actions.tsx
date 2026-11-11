"use client";

import { Button, cn } from "@zedtech/zedkit-ui";
import { DocsAppLink } from "@/ui/docs-app-link";
import { OffPathLink } from "@/ui/off-path-link";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";
import { SITE_GITHUB_URL } from "@/lib/site-links.mjs";

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
  return (
    <Button asChild data-site-action="" className={cn("min-h-overlay-touch-target", className)}>
      <DocsAppLink href="#get-started" onClick={onClick}>
        {siteChromeCopy.getStarted}
      </DocsAppLink>
    </Button>
  );
}
