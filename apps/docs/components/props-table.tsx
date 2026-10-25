import { join } from "node:path";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import { createGenerator } from "fumadocs-typescript";

const generator = createGenerator();

/**
 * Props table for one kit interface, resolved at build from the REAL
 * .tsx source with inherited props expanded (no hand parsing).
 * basePath assumes this monorepo layout: the ui sources sit two
 * levels above the docs app.
 */
export function PropsTable({ file, name }: { file: string; name: string }) {
  return (
    <AutoTypeTable
      generator={generator}
      path={file}
      name={name}
      options={{ basePath: join(process.cwd(), "..", "..", "packages", "ui", "src") }}
    />
  );
}
