import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { highlight } from "fumadocs-core/highlight";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import {
  Heading,
  Section,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { registryBrickNames } from "../content/registry-site";
import { docsSite } from "../lib/site";
import { symbolsFromImport } from "../lib/import-symbols";
import { DEFAULT_PROPS_PRIORITY } from "../lib/props-priority.mjs";
import { ComponentPreview } from "./component-preview";
import { ComponentWrapsLine } from "./component-wraps-line";
import { MaturityBadge } from "./maturity-badge";
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
  const types = symbols.filter((name) => name.endsWith("Props"));
  const values = symbols.filter((name) => !name.endsWith("Props"));
  return [
    values.length > 0 ? `import { ${values.join(", ")} } from "${pkg}";` : "",
    types.length > 0 ? `import type { ${types.join(", ")} } from "${pkg}";` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function registryImportSnippet(importLine: string, registry: string): string {
  const name = symbolsFromImport(importLine).find((symbol) => !symbol.endsWith("Props") && !symbol.endsWith("Variants"));
  return `import { ${name ?? "Button"} } from "@/components/ui/${registry}";`;
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
  const hasProps = Boolean(propsFile && propsName);
  const copyable =
    registry.length > 0 && registryBrickNames.includes(registry) && sourcePath !== null;
  const npmInstall = (
    <Stack gap={4}>
      <Text variant="muted" className="text-sm">
        {copyable ? (
          <>
            Install the published package, then import from it. Wire the kit CSS first — see{" "}
            <Link href="/docs/getting-started#ui-button" className="text-primary underline-offset-4 hover:underline">
              getting started
            </Link>
            .
          </>
        ) : (
          "This component ships on npm only; there is no copy-source registry brick."
        )}
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
  );

  return (
    <Stack gap={8}>
      <Stack gap={3}>
        {status !== "stable" ? <MaturityBadge status={status} /> : null}
        <Text className="text-base text-muted-foreground sm:text-lg">{purpose}</Text>
      </Stack>

      <Stack id="example">
        <ComponentPreview demo={demo} hasProps={hasProps} a11yRoot />
      </Stack>

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

      <Section title="Install or copy" id="install-or-copy">
        <Stack gap={4}>
          {copyable ? (
            <Tabs groupId="component-adoption" persist items={["npm package", "registry copy"]}>
              <Tab value="npm package">{npmInstall}</Tab>
              <Tab value="registry copy">
                <Stack gap={4}>
                  <Text variant="muted" className="text-sm">
                    Copy the brick into your repo with the shadcn CLI. Imports are rewritten for your app; keep this
                    path separate from the npm package install above.
                  </Text>
                  {await highlightedTs(shadcnAdd, "shadcn add")}
                  {await highlightedTs(registryImportSnippet(importLine, registry), "Import")}
                  {source ? (
                    <Stack gap={3}>
                      <RegistryBrickInlineName name={registry} />
                      {await highlightedTs(source, `${registry}.tsx`)}
                    </Stack>
                  ) : null}
                </Stack>
              </Tab>
            </Tabs>
          ) : (
            npmInstall
          )}
        </Stack>
      </Section>

      <Section title="Usage and states" id="usage-and-states">
        <Stack gap={6}>
          {await Promise.all(
            examples.map(async (ex) => {
              const previewDemo = examplePreviews[ex.title];
              return (
                <Stack key={ex.title} gap={3}>
                  {previewDemo ? (
                    <>
                      <Heading level={3}>{ex.title}</Heading>
                      <ComponentPreview demo={previewDemo} hasProps={false} />
                    </>
                  ) : null}
                  {await highlightedTs(ex.code, ex.title)}
                </Stack>
              );
            }),
          )}
          <ComponentWrapsLine wraps={wraps} />
        </Stack>
      </Section>

      <Section title="Props" id="props">
        {hasProps ? (
          <Stack gap={3}>
            <PropsTable file={propsFile!} name={propsName!} priority={propsPriority} />
          </Stack>
        ) : (
          <Text variant="muted">No extra props documented.</Text>
        )}
      </Section>

      <Section title="Accessibility" id="accessibility">
        <Text>{a11y}</Text>
      </Section>

      <Section title="Related" id="related">
        {related.length > 0 ? (
          <Stack gap={2}>
            {related.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary underline-offset-4 hover:underline">
                {link.title}
              </Link>
            ))}
          </Stack>
        ) : (
          <Text variant="muted">No related pages.</Text>
        )}
      </Section>

      <Section title="Troubleshooting" id="troubleshooting">
        <Text>{troubleshooting || "None yet."}</Text>
      </Section>
    </Stack>
  );
}
