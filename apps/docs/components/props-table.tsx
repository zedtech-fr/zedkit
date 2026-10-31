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
 * Kit props listed in `priority` appear first; native HTML attrs fold behind a disclosure.
 */
export function PropsTable({
  file,
  name,
  priority = DEFAULT_PROPS_PRIORITY,
}: {
  file: string;
  name: string;
  priority?: string[];
}) {
  const basePath = join(process.cwd(), "..", "..", "packages", "ui", "src");
  const keys = priority.map((key) => `"${key}"`).join(" | ");
  const primaryAlias = `${name}Primary`;
  const inheritedAlias = `${name}Inherited`;
  const primaryType = `export type ${primaryAlias} = Pick<${name}, ${keys}>;`;
  const inheritedType = `export type ${inheritedAlias} = Omit<${name}, ${keys}>;`;
  const host = file.replace(/\.tsx$/, "");
  const inheritedPanel =
    host === "button" ? (
      <InheritedPropsPanel referenceHref="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attributes">
        <AutoTypeTable
          generator={generator}
          path={file}
          name={inheritedAlias}
          type={inheritedType}
          options={{ basePath }}
        />
      </InheritedPropsPanel>
    ) : (
      <InheritedPropsPanel>
        <AutoTypeTable
          generator={generator}
          path={file}
          name={inheritedAlias}
          type={inheritedType}
          options={{ basePath }}
        />
      </InheritedPropsPanel>
    );

  return (
    <Stack gap={4}>
      <AutoTypeTable
        generator={generator}
        path={file}
        name={primaryAlias}
        type={primaryType}
        options={{ basePath }}
      />
      {inheritedPanel}
    </Stack>
  );
}
