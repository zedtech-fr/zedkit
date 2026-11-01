import { join } from "node:path";
import { createGenerator, type DocEntry } from "fumadocs-typescript";
import { TypeTable, type TypeNode } from "fumadocs-ui/components/type-table";
import { Stack } from "@zedtech/zedkit-ui";
import { DEFAULT_PROPS_PRIORITY, partitionPropsEntries } from "../lib/props-priority.mjs";
import { InheritedPropsPanel } from "./inherited-props-panel";

const generator = createGenerator();

const BUTTON_MDN = "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attributes";

function nodesFromEntries(entries: DocEntry[]): Record<string, TypeNode> {
  return Object.fromEntries(
    entries.map((entry) => [
      entry.name,
      {
        type: entry.simplifiedType,
        typeDescription: entry.type,
        description: entry.description,
        required: entry.required,
        deprecated: entry.deprecated,
      } satisfies TypeNode,
    ]),
  );
}

/**
 * Props table for one kit interface, resolved at build from the REAL
 * .tsx source. Kit props listed in `priority` come first; native HTML
 * attrs fold behind a disclosure.
 */
export async function PropsTable({
  file,
  name,
  priority = DEFAULT_PROPS_PRIORITY,
}: {
  file: string;
  name: string;
  priority?: string[];
}) {
  const basePath = join(process.cwd(), "..", "..", "packages", "ui", "src");
  const host = file.replace(/\.tsx$/, "");
  const docs = await generator.generateTypeTable({ path: file, name }, { basePath });

  return (
    <Stack gap={4}>
      {docs.map((item) => {
        const { primary, inherited } = partitionPropsEntries(item.entries, priority);
        const fold = primary.length > 0;
        const kitEntries = fold ? primary : item.entries;
        const inheritedEntries = fold ? inherited : [];
        return (
          <Stack key={item.id} gap={4}>
            <TypeTable id={`type-table-${item.id}`} type={nodesFromEntries(kitEntries)} />
            {inheritedEntries.length > 0 ? (
              <InheritedPropsPanel {...(host === "button" ? { referenceHref: BUTTON_MDN } : {})}>
                <TypeTable
                  id={`type-table-${item.id}-inherited`}
                  type={nodesFromEntries(inheritedEntries)}
                />
              </InheritedPropsPanel>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}
