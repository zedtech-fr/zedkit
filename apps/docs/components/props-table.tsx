import { join } from "node:path";
import { createGenerator, type DocEntry } from "fumadocs-typescript";
import { TypeTable, type TypeNode } from "fumadocs-ui/components/type-table";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { DEFAULT_PROPS_PRIORITY, partitionPropsEntries } from "../lib/props-priority.mjs";
import { inheritedPropsCopy } from "./i18n/inherited-props-copy";
import { InheritedPropsPanel } from "./inherited-props-panel";

const generator = createGenerator();

let nativeNames: Promise<ReadonlySet<string>> | undefined;

/** Attribute names any HTML or SVG element already accepts, read from the real React types. */
function nativePropNames(basePath: string): Promise<ReadonlySet<string>> {
  nativeNames ??= generator
    .generateDocumentation(
      {
        path: join(basePath, "native-props-probe.tsx"),
        content:
          'import type * as React from "react";\nexport interface NativeProbe extends React.AllHTMLAttributes<HTMLElement>, React.SVGAttributes<SVGElement> {}\n',
      },
      "NativeProbe",
    )
    .then((docs) => new Set(docs.flatMap((doc) => doc.entries.map((entry) => entry.name))));
  return nativeNames;
}

/** React-only bookkeeping props that are not part of any component's API. */
const REACT_RESERVED = new Set(["key", "ref"]);

const BUTTON_MDN = "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attributes";

/** Optional props already read as optional from the `?`, so `| null | undefined` is noise. */
function displayType(entry: DocEntry): string {
  return (entry.simplifiedType === "union" ? entry.type : entry.simplifiedType).replace(/ \| (?:null|undefined)/g, "");
}

function nodesFromEntries(entries: DocEntry[]): Record<string, TypeNode> {
  return Object.fromEntries(
    entries.map((entry) => [
      entry.name,
      {
        type: displayType(entry),
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
  rest,
}: {
  file: string;
  name: string;
  priority?: string[];
  rest?: { summary: string; href: string };
}) {
  const basePath = join(process.cwd(), "..", "..", "packages", "ui", "src");
  const host = file.replace(/\.tsx$/, "");
  const docs = await generator.generateTypeTable({ path: file, name }, { basePath });
  const native = await nativePropNames(basePath);

  return (
    <Stack gap={4}>
      {docs.map((item) => {
        const { primary, inherited } = partitionPropsEntries(
          item.entries.filter((entry) => !REACT_RESERVED.has(entry.name)),
          priority,
          native,
          Boolean(rest),
        );
        const inheritedEntries = inherited;
        return (
          <Stack key={item.id} gap={4}>
            {primary.length > 0 ? (
              <TypeTable id={`type-table-${item.id}`} type={nodesFromEntries(primary)} />
            ) : (
              <Text variant="muted">{inheritedPropsCopy.noKitProps}</Text>
            )}
            {inheritedEntries.length > 0 ? (
              <InheritedPropsPanel
                {...(rest
                  ? { referenceHref: rest.href, summary: rest.summary }
                  : host === "button"
                    ? { referenceHref: BUTTON_MDN }
                    : {})}
              >
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
