import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { PreviewViewport } from "./preview-viewport";
import { demoRegistry, type DemoEntry } from "./demos/registry";

interface ComponentPreviewProps {
  /** Registry key, e.g. `ButtonDemo`. */
  demo: string;
  /** One-line import reference shown above the source. */
  detail: string;
  /** Whether the page renders a Props section to link to. */
  hasProps: boolean;
}

/**
 * Deep frame around one live demo: scoped light/dark preview, displayed
 * source (read from the demo file at build — always current), and a link
 * to the props table. Consumed by generated MDX via registry key only.
 */
export async function ComponentPreview({ demo, detail, hasProps }: ComponentPreviewProps) {
  const entry = (demoRegistry as Record<string, DemoEntry | undefined>)[demo];
  if (!entry) return <Text>Unknown demo “{demo}”.</Text>;
  const code = await readFile(join(process.cwd(), "components", "demos", entry.file), "utf8");
  const { Demo } = entry;
  return (
    <Stack gap={4}>
      <PreviewViewport>
        <Demo />
      </PreviewViewport>
      <Stack gap={2}>
        <Text variant="muted">{detail}</Text>
        <Text variant="muted">{entry.file}</Text>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
          <code>{code}</code>
        </pre>
        {hasProps ? (
          <Link href="#props">
            <Button variant="outline" size="sm">
              Props
            </Button>
          </Link>
        ) : null}
      </Stack>
    </Stack>
  );
}
