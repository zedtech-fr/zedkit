import { join } from "node:path";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import { createGenerator } from "fumadocs-typescript";
import { Stack } from "@zedtech/zedkit-ui";
import { DEFAULT_PROPS_PRIORITY } from "../lib/props-priority.mjs";
import { InheritedPropsPanel } from "./inherited-props-panel";

const generator = createGenerator();

/**
 * Props table for one kit interface, resolved at build from the REAL
 * .tsx source with inherited props expanded (no hand parsing).
 * Kit props listed in `priority` are documented first in the page narrative;
 * native HTML attrs are summarized behind a disclosure (full Omit tables need
 * exported helper types — see props-priority.mjs).
 */
export function PropsTable({
  file,
  name,
  priority: _priority = DEFAULT_PROPS_PRIORITY,
}: {
  file: string;
  name: string;
  priority?: string[];
}) {
  const basePath = join(process.cwd(), "..", "..", "packages", "ui", "src");
  const host = file.replace(/\.tsx$/, "");
  const inheritedPanel =
    host === "button" ? (
      <InheritedPropsPanel referenceHref="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attributes" />
    ) : (
      <InheritedPropsPanel />
    );

  return (
    <Stack gap={4}>
      <AutoTypeTable
        generator={generator}
        path={file}
        name={name}
        options={{ basePath }}
      />
      {inheritedPanel}
    </Stack>
  );
}
