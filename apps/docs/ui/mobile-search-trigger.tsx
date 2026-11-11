"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { IconButton } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";

const iconButtonClassName =
  "inline-flex min-h-overlay-touch-target min-w-overlay-touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-ring-control";

/** Opens the shared docs search dialog from the phone header (no floating control). */
export function MobileSearchTrigger({ className }: { className?: string }) {
  const { setOpenSearch } = useSearchContext();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = () => {
      triggerRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("zedkit:search-closed", onOpen);
    return () => window.removeEventListener("zedkit:search-closed", onOpen);
  }, []);

  return (
    <IconButton
      ref={triggerRef}
      label={siteChromeCopy.search.triggerAriaLabel}
      variant="ghost"
      size="icon"
      data-mobile-search=""
      className={className ?? iconButtonClassName}
      onClick={() => setOpenSearch(true)}
    >
      <Search aria-hidden="true" className="size-icon" />
    </IconButton>
  );
}
