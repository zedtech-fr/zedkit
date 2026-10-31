import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { highlight } from "fumadocs-core/highlight";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { PreviewViewport } from "./preview-viewport";
import { demoRegistry, type DemoEntry } from "./demos/registry";

interface ComponentPreviewProps {
  /** Registry key, e.g. `ButtonDemo`. */
  demo: string;
  /** Whether the page renders a Props section to link to. */
  hasProps: boolean;
  /** Scope a11y gates to this preview (hero on component pages). */
  a11yRoot?: boolean;
}

/**
 * Deep frame around one live demo: Preview/Code tabs with a scoped
 * light/dark/mobile viewport, and Shiki-highlighted source (read from
 * the demo file at build — always current) with copy + filename title.
 * Consumed by generated MDX via registry key only.
 */
export async function ComponentPreview({ demo, hasProps, a11yRoot }: ComponentPreviewProps) {
  const entry = (demoRegistry as Record<string, DemoEntry | undefined>)[demo];
  if (!entry) return <Text>Unknown demo “{demo}”.</Text>;
  const code = await readFile(join(process.cwd(), "components", "demos", entry.file), "utf8");
  const highlighted = await highlight(code, { lang: "tsx", components: { pre: Pre } });
  const { Demo } = entry;
  return (
    <Stack gap={3}>
      <Tabs items={["Preview", "Code"]} className={entry.pinned ? "overflow-clip" : undefined}>
        <Tab value="Preview">
          <PreviewViewport center={entry.center ?? false} a11yRoot={a11yRoot}>
            <Demo />
          </PreviewViewport>
        </Tab>
        <Tab value="Code">
          <CodeBlock title={entry.file} allowCopy>
            {highlighted}
          </CodeBlock>
        </Tab>
      </Tabs>
      {hasProps ? (
        <Link href="#props" className="w-fit text-sm text-primary underline-offset-4 hover:underline">
          View props table
        </Link>
      ) : null}
    </Stack>
  );
}
