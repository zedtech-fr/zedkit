import Link from "next/link";
import {
  Badge,
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
  compatibilityRows,
  maturityCounts,
  workspaceToolchain,
} from "@/content/maturity-compatibility";
import { maturityBadgeVariant } from "@/lib/maturity-status";

// Visitor wording for the same limits as docs/catalog/README.md#maturity.
const MATURITY_LIMITS = [
  { status: "planned", limit: "Documented, not built yet. No code and no tests." },
  { status: "alpha", limit: "Built, but the API may still change. Tests, docs, or review can still be missing." },
  {
    status: "beta",
    limit: "Tested through the public interface, documented with an example, and reviewed. UI entries also have accessibility checks and a gallery preview. Ready for a first try. Not proven in a real app yet.",
  },
  { status: "stable", limit: "Used by at least two real apps. Breaking changes follow semver. Documented." },
  { status: "deprecated", limit: "Do not start a new use. The entry names its replacement and will be removed later." },
] as const;

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
      <Section title="What a badge means">
        <Stack gap={4}>
          {MATURITY_LIMITS.map((row) => (
            <Stack key={row.status} gap={2}>
              <Badge variant={maturityBadgeVariant(row.status)} className="w-fit">
                {row.status}
              </Badge>
              <Text>{row.limit}</Text>
            </Stack>
          ))}
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
