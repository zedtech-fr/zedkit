import { AppShell, PageHeader, Text } from "@zedtech/zedkit-ui";

export function AppShellDemo() {
  return (
    <AppShell sidebar={<Text>Org nav</Text>} topbar={<Text>User menu</Text>}>
      <PageHeader title="Items" description="All items in this project." />
    </AppShell>
  );
}
