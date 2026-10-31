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
import { ComponentExportsPanel } from "./component-exports-panel";
import { ComponentPreview } from "./component-preview";
import { ComponentWrapsLine } from "./component-wraps-line";
import { PropsTable } from "./props-table";
import { RegistryBrickInlineName } from "./registry-brick-name";

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
  importLine: string;
  wraps: string;
  registry: string;
  demo: string;
  propsFile: string | null;
  propsName: string | null;
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
  importLine,
  wraps,
  registry,
  demo,
  propsFile,
  propsName,
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
      <Section title="Install">
        <Stack gap={4}>
          <Tabs groupId="package-manager" persist items={["pnpm", "npm", "yarn", "registry"]}>
            <Tab value="pnpm">
              {await highlightedTs(`pnpm add ${packageName}`)}
            </Tab>
            <Tab value="npm">
              {await highlightedTs(`npm install ${packageName}`)}
            </Tab>
            <Tab value="yarn">
              {await highlightedTs(`yarn add ${packageName}`)}
            </Tab>
            <Tab value="registry">
              {await highlightedTs(shadcnAdd)}
            </Tab>
          </Tabs>
          <Text variant="muted">Package version: {version} (changesets).</Text>
        </Stack>
      </Section>

      <Section title="Import">
        {await highlightedTs(importSnippet(importLine))}
      </Section>

      {source ? (
        <Section
          title="Registry source"
          description="Copy into your app after npx shadcn add (imports are rewritten for consumers)."
        >
          <Stack gap={3}>
            <RegistryBrickInlineName name={registry} />
            {await highlightedTs(source, `${registry}.tsx`)}
          </Stack>
        </Section>
      ) : null}

      <Section title="Exports">
        <ComponentExportsPanel symbols={symbols} wraps={wraps} />
      </Section>

      <Section title="Preview">
        <ComponentPreview demo={demo} detail={importLine.replace(/`/g, "")} hasProps={hasProps} />
      </Section>

      <Section title="Examples">
        <Stack gap={6}>
          {await Promise.all(
            examples.map(async (ex) => {
              const previewDemo = examplePreviews[ex.title];
              return (
                <Stack key={ex.title} gap={3}>
                  {previewDemo ? (
                    <ComponentPreview demo={previewDemo} detail={`Live preview: ${ex.title}`} hasProps={false} />
                  ) : null}
                  {await highlightedTs(ex.code, ex.title)}
                </Stack>
              );
            }),
          )}
          <ComponentWrapsLine wraps={wraps} />
        </Stack>
      </Section>

      {hasProps ? (
        <Section title="Props">
          <Stack gap={3} id="props">
            <PropsTable file={propsFile!} name={propsName!} />
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

      <Section title="Troubleshooting">
        <Text>{troubleshooting}</Text>
      </Section>
    </Stack>
  );
}
