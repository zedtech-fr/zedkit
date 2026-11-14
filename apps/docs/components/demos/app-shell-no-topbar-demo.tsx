import { AppShell, PageHeader, Stack, Text } from "@zedtech/zedkit-ui";
import { appShellNoTopbarCopy } from "@/components/demos/i18n/app-shell-no-topbar-copy";

const NAV = appShellNoTopbarCopy.nav;
const linkClassName =
  "inline-flex min-h-target items-center rounded-md px-select-item-inline py-select-item-block text-dense focus-ring-control hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium";

export function AppShellNoTopbarDemo() {
  return (
    <AppShell
      className="h-frame pane-shrink overflow-y-auto rounded-lg border bg-background"
      sidebar={
        <Stack gap="tight" className="surface-pad-compact">
          <Text data-nav-label="" className="px-control-tight font-semibold">{appShellNoTopbarCopy.brand}</Text>
          <nav aria-label={appShellNoTopbarCopy.navAriaLabel}>
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
      <PageHeader titleAs="h2" title={appShellNoTopbarCopy.pageTitle} description={appShellNoTopbarCopy.pageDescription} />
    </AppShell>
  );
}
