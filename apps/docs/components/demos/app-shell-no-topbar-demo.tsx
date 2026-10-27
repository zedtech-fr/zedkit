import { AppShell, PageHeader, Stack, Text } from "@zedtech/zedkit-ui";

const NAV = ["Projects", "Tasks", "Team", "Settings"];

export function AppShellNoTopbarDemo() {
  return (
    <AppShell
      className="h-72 min-h-0 overflow-hidden rounded-lg border"
      sidebar={
        <Stack gap={1} className="p-3">
          <Text className="px-2 pb-2 font-semibold">Harbor Studio</Text>
          <nav aria-label="Main">
            <Stack gap={1}>
              {NAV.map((item, index) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  aria-current={index === 0 ? "page" : undefined}
                  className="rounded-md px-2 py-1.5 text-sm hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-medium"
                >
                  {item}
                </a>
              ))}
            </Stack>
          </nav>
        </Stack>
      }
    >
      <PageHeader title="Projects" description="Four active projects, two due this week." />
    </AppShell>
  );
}
