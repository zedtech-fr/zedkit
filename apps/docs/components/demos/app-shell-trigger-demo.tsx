"use client";

import { AppShell, Button, PageHeader, Stack, Text, cn } from "@zedtech/zedkit-ui";
import { appShellMobileDrawerCopy } from "@/components/demos/i18n/app-shell-mobile-drawer-copy";
import { usePreviewMobile } from "@/components/preview-viewport";

const NAV = appShellMobileDrawerCopy.nav;
const linkClassName =
  "inline-flex min-h-target items-center rounded-md px-select-item-inline py-select-item-block text-dense focus-ring-control hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium";

export function AppShellTriggerDemo() {
  const mobile = usePreviewMobile();
  return (
    <AppShell
      className={cn(
        "h-frame pane-shrink overflow-y-auto rounded-lg border bg-background",
        mobile && "[&_[data-slot=app-shell-menu]]:flex [&>aside]:hidden",
      )}
      sidebarTrigger={<Button variant="outline">{appShellMobileDrawerCopy.menuTrigger}</Button>}
      sidebar={
        <Stack gap="tight" className="surface-pad-compact">
          <Text data-nav-label="" className="px-control-tight font-semibold">{appShellMobileDrawerCopy.brand}</Text>
          <nav aria-label={appShellMobileDrawerCopy.navAriaLabel}>
            <Stack gap="tight">
              {NAV.map((item, index) => (
                <a
                  key={item}
                  href="#example"
                  aria-current={index === 0 ? "page" : undefined}
                  className={linkClassName}
                >
                  {item}
                </a>
              ))}
            </Stack>
          </nav>
        </Stack>
      }
    >
      <PageHeader titleAs="h2" title={appShellMobileDrawerCopy.pageTitle} description={appShellMobileDrawerCopy.pageDescription} />
    </AppShell>
  );
}
