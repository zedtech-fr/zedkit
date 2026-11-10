import { AppShell, PageHeader, Stack, Text } from "@zedtech/zedkit-ui";
import { appShellMobileDrawerCopy } from "@/components/demos/i18n/app-shell-mobile-drawer-copy";

const NAV = appShellMobileDrawerCopy.nav;

export function AppShellMobileDrawerDemo() {
  return (
    <AppShell
      className="h-frame pane-shrink overflow-hidden rounded-lg border"
      sidebar={
        <Stack gap="tight" className="surface-pad-compact">
          <Text data-nav-label="" className="px-control-tight font-semibold">{appShellMobileDrawerCopy.brand}</Text>
          <nav aria-label={appShellMobileDrawerCopy.navAriaLabel}>
            <Stack gap="tight">
              {NAV.map((item, index) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  aria-current={index === 0 ? "page" : undefined}
                  className="rounded-md px-select-item-inline py-select-item-block text-dense hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium"
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
