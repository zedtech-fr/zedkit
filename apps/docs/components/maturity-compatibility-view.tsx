import Link from "next/link";
import {
  Section,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";
import {
  catalogMaturityReadmeUrl,
  compatibilityRows,
  maturityCounts,
  workspaceToolchain,
} from "@/content/maturity-compatibility";

function CountsTable() {
  const rows = Object.entries(maturityCounts).filter(([, n]) => n > 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Catalog needs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([status, count]) => (
          <TableRow key={status}>
            <TableCell>{status}</TableCell>
            <TableCell>{count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CompatibilityTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Package</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Node</TableHead>
          <TableHead>Peer dependencies</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {compatibilityRows.map((row) => (
          <TableRow key={row.package}>
            <TableCell className="font-mono text-xs">{row.package}</TableCell>
            <TableCell>{row.version}</TableCell>
            <TableCell>{row.node}</TableCell>
            <TableCell className="text-muted-foreground">{row.peers}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MaturityCompatibilityView() {
  return (
    <Stack gap={8}>
      <Section>
        <Stack gap={3}>
          <Text>
            Every catalog need carries a maturity badge. Criteria for{" "}
            <code>planned</code>, <code>alpha</code>, <code>beta</code>, <code>stable</code>, and{" "}
            <code>deprecated</code> are defined once in the{" "}
            <Link href={catalogMaturityReadmeUrl}>catalog README (Maturity)</Link> — read that
            section instead of a copy here.
          </Text>
          <Text variant="muted">
            Breaking changes ship through changesets and semver (0.x today). Check each package{" "}
            <code>CHANGELOG.md</code> before upgrading.
          </Text>
        </Stack>
      </Section>
      <Section title="Current catalog counts">
        <CountsTable />
      </Section>
      <Section title="Workspace toolchain">
        <Text>
          Node {workspaceToolchain.node}, {workspaceToolchain.packageManager}. UI work expects React
          19 and Tailwind CSS v4 (see{" "}
          <Link href="/docs/ui/theme-an-admin-app-dark-light-included">theme doc</Link>).
        </Text>
      </Section>
      <Section title="Package compatibility">
        <Stack gap={3}>
          <Text variant="muted">
            Generated from each package <code>package.json</code> on every docs build.
          </Text>
          <CompatibilityTable />
        </Stack>
      </Section>
    </Stack>
  );
}
