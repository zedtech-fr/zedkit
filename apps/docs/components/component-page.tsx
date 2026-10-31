import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { highlight } from "fumadocs-core/highlight";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import {
  Section,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { docsSite } from "../lib/site";
import { symbolsFromImport } from "../lib/import-symbols";
import { DEFAULT_PROPS_PRIORITY } from "../lib/props-priority.mjs";
import { ComponentExportsPanel } from "./component-exports-panel";
import { ComponentPreview } from "./component-preview";
import { MaturityBadge } from "./maturity-badge";
import { PropsTable } from "./props-table";
import { RegistryBrickName } from "./registry-brick-name";

export interface CatalogExample {
  title: string;
  code: string;
}

export interface RelatedLink {
  title: string;
  href: string;
}

export interface ComponentPageProps {
  packageName: string;
  version: string;
  status: string;
  purpose: string;
  audience: string;
  whenToUse: string;
  whenNotToUse: string;
  importLine: string;
  wraps: string;
  registry: string;
  demo: string;
  propsFile: string | null;
  propsName: string | null;
  propsPriority?: string[];
  examples: CatalogExample[];
  /** Example title → demo registry key: a live preview rendered above that code block. */
  examplePreviews?: Record<string, string>;
  a11y: string;
  troubleshooting: string;
  related: RelatedLink[];
}

async function highlightedTs(code: string, title?: string) {
  const highlighted = await highlight(code, { lang: "tsx", components: { pre: Pre } });
  return (
    <CodeBlock title={title} allowCopy>
      {highlighted}
    </CodeBlock>
  );
}

function registrySourcePath(registry: string): string | null {
  const path = join(process.cwd(), "..", "..", "registry", "ui", `${registry}.tsx`);
  return existsSync(path) ? path : null;
}

function importSnippet(importLine: string): string {
  const symbols = symbolsFromImport(importLine);
  const pkg = importLine.match(/`([^`]+)`/)?.[1] ?? "@zedtech/zedkit-ui";
  return `import { ${symbols.join(", ")} } from "${pkg}";`;
}

export async function ComponentPage({
  packageName,
  version,
  status,
  purpose,
  audience,
  whenToUse,
  whenNotToUse,
  importLine,
  wraps,
  registry,
  demo,
  propsFile,
  propsName,
  propsPriority = DEFAULT_PROPS_PRIORITY,
  examples,
  examplePreviews = {},
  a11y,
  troubleshooting,
  related,
}: ComponentPageProps) {
  const site = docsSite.url.replace(/\/$/, "");
  const shadcnAdd = `npx shadcn@latest add ${site}/r/${registry}.json`;
  const sourcePath = registrySourcePath(registry);
  const source = sourcePath ? await readFile(sourcePath, "utf8") : null;
  const symbols = symbolsFromImport(importLine);
  const hasProps = Boolean(propsFile && propsName);

  return (
    <Stack gap={8}>
      <Stack gap={3}>
        <MaturityBadge status={status} />
        <Text variant="muted">{purpose}</Text>
      </Stack>

      <ComponentPreview demo={demo} hasProps={hasProps} />

      <Section title="Install or copy">
        <Stack gap={4}>
          <Tabs groupId="component-adoption" persist items={["npm package", "registry copy"]}>
            <Tab value="npm package">
              <Stack gap={4}>
                <Text variant="muted" className="text-sm">
                  Install the published package, then import from it. Styles come from the kit CSS you already
                  wired in your app.
                </Text>
                <Tabs groupId="package-manager" persist items={["pnpm", "npm", "yarn"]}>
                  <Tab value="pnpm">{await highlightedTs(`pnpm add ${packageName}`, "Install")}</Tab>
                  <Tab value="npm">{await highlightedTs(`npm install ${packageName}`, "Install")}</Tab>
                  <Tab value="yarn">{await highlightedTs(`yarn add ${packageName}`, "Install")}</Tab>
                </Tabs>
                {await highlightedTs(importSnippet(importLine), "Import")}
                <Text variant="muted" className="text-xs">
                  Package version: {version} (changesets).
                </Text>
              </Stack>
            </Tab>
            <Tab value="registry copy">
              <Stack gap={4}>
                <Text variant="muted" className="text-sm">
                  Copy the brick into your repo with the shadcn CLI. Imports are rewritten for your app; keep this
                  path separate from the npm package install above.
                </Text>
                {await highlightedTs(shadcnAdd, "shadcn add")}
                {source ? (
                  <Stack gap={3}>
                    <RegistryBrickName name={registry} />
                    {await highlightedTs(source, `${registry}.tsx`)}
                  </Stack>
                ) : null}
              </Stack>
            </Tab>
          </Tabs>
        </Stack>
      </Section>

      <Section title="Usage and states">
        <Stack gap={6}>
          <Stack gap={2} className="text-sm text-muted-foreground">
            <Text variant="muted">
              <strong className="font-medium text-foreground">Who:</strong> {audience}
            </Text>
            <Text variant="muted">
              <strong className="font-medium text-foreground">Use when:</strong> {whenToUse}
            </Text>
            <Text variant="muted">
              <strong className="font-medium text-foreground">Avoid when:</strong> {whenNotToUse}
            </Text>
          </Stack>
          {await Promise.all(
            examples.map(async (ex) => {
              const previewDemo = examplePreviews[ex.title];
              return (
                <Stack key={ex.title} gap={3}>
                  {previewDemo ? <ComponentPreview demo={previewDemo} hasProps={false} /> : null}
                  {await highlightedTs(ex.code, ex.title)}
                </Stack>
              );
            }),
          )}
          <ComponentExportsPanel symbols={symbols} wraps={wraps} />
        </Stack>
      </Section>

      {hasProps ? (
        <Section title="Props">
          <Stack gap={3} id="props">
            <PropsTable file={propsFile!} name={propsName!} priority={propsPriority} />
          </Stack>
        </Section>
      ) : null}

      <Section title="Accessibility">
        <Text>{a11y}</Text>
      </Section>

      {related.length > 0 ? (
        <Section title="Related">
          <Stack gap={2}>
            {related.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary underline-offset-4 hover:underline">
                {link.title}
              </Link>
            ))}
          </Stack>
        </Section>
      ) : null}

      {troubleshooting ? (
        <Section title="Troubleshooting">
          <Text>{troubleshooting}</Text>
        </Section>
      ) : null}
    </Stack>
  );
}
