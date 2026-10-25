import Link from "next/link";
import { Section, Stack, Text } from "@zedtech/zedkit-ui";
import {
  catalogMaturityReadmeUrl,
  compatibilityRows,
  maturityCounts,
  workspaceToolchain,
} from "@/content/maturity-compatibility";

function CountsTable() {
  const rows = Object.entries(maturityCounts).filter(([, n]) => n > 0);
  return (
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Catalog needs</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([status, count]) => (
          <tr key={status}>
            <td>{status}</td>
            <td>{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompatibilityTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Version</th>
          <th>Node</th>
          <th>Peer dependencies</th>
        </tr>
      </thead>
      <tbody>
        {compatibilityRows.map((row) => (
          <tr key={row.package}>
            <td>
              <code>{row.package}</code>
            </td>
            <td>{row.version}</td>
            <td>{row.node}</td>
            <td>{row.peers}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
      <Section>
        <Stack gap={3}>
          <h2 className="text-lg font-semibold">Current catalog counts</h2>
          <CountsTable />
        </Stack>
      </Section>
      <Section>
        <Stack gap={3}>
          <h2 className="text-lg font-semibold">Workspace toolchain</h2>
          <Text>
            Node {workspaceToolchain.node}, {workspaceToolchain.packageManager}. UI work expects
            React 19 and Tailwind CSS v4 (see{" "}
            <Link href="/docs/ui/theme-an-admin-app-dark-light-included">theme doc</Link>).
          </Text>
        </Stack>
      </Section>
      <Section>
        <Stack gap={3}>
          <h2 className="text-lg font-semibold">Package compatibility</h2>
          <Text variant="muted">Generated from each package <code>package.json</code> on every docs build.</Text>
          <CompatibilityTable />
        </Stack>
      </Section>
    </Stack>
  );
}
