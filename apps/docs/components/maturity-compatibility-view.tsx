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
  {
    status: "stable",
    limit:
      "No badge = stable: semver-protected. Tested through the public API, accessible for UI, documented, API frozen under semver.",
    showBadge: false,
  },
  {
    status: "beta",
    limit:
      "Beta: tested, documented, accessible; the API may still change in a minor, with a migration note; not covered by the semver guarantee.",
    showBadge: true,
  },
  {
    status: "alpha",
    limit:
      "Alpha: works, but the API can change in any release; not covered by the semver guarantee.",
    showBadge: true,
  },
  { status: "planned", limit: "Documented, not built yet. No code and no tests.", showBadge: true },
  {
    status: "deprecated",
    limit: "Do not start a new use. The entry names its replacement and will be removed later.",
    showBadge: true,
  },
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
              {row.showBadge ? (
                <Badge variant={maturityBadgeVariant(row.status)} className="w-fit">
                  {row.status}
                </Badge>
              ) : (
                <Text className="font-medium">No badge</Text>
              )}
              <Text>{row.limit}</Text>
            </Stack>
          ))}
          <Text variant="muted">
            Packages at 1.0.0 carry stable catalog entries under real semver. Alpha and beta entries
            in the same package are excluded from that guarantee — check each need&apos;s badge (or
            lack of one) before you ship.
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
