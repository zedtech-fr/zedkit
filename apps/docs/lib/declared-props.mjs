import { createGenerator } from "fumadocs-typescript";

/** One generator (one TypeScript program) per tsconfig; the default is the one in the working directory. */
const generators = new Map();
function generatorFor(tsconfigPath) {
  if (!generators.has(tsconfigPath)) generators.set(tsconfigPath, createGenerator(tsconfigPath ? { tsconfigPath } : undefined));
  return generators.get(tsconfigPath);
}

const OUTSIDE_THE_KIT = /[\\/](?:node_modules|typescript[\\/]lib)[\\/]/;

/**
 * Who owns a property, from the files that declare it: the kit when any
 * declaration is in the workspace, inherited when every one sits in a
 * dependency's types (React's element attributes, Radix props, the TS lib).
 *
 * @param {readonly string[]} declarationFiles
 * @returns {"kit" | "inherited"}
 */
export function declarationOrigin(declarationFiles) {
  return declarationFiles.some((file) => !OUTSIDE_THE_KIT.test(file)) ? "kit" : "inherited";
}

/**
 * Reads one props type from the real kit source. Each entry carries its
 * `origin`, resolved from the property's own declarations.
 *
 * @typedef {import("fumadocs-typescript").DocEntry & { origin: "kit" | "inherited" }} DeclaredEntry
 * @typedef {Omit<import("fumadocs-typescript").GeneratedDoc, "entries"> & { entries: DeclaredEntry[] }} DeclaredDoc
 * @param {{ file: string, name: string, basePath: string, tsconfigPath?: string }} target
 * @returns {Promise<DeclaredDoc[]>}
 */
export async function readDeclaredProps({ file, name, basePath, tsconfigPath }) {
  return generatorFor(tsconfigPath).generateTypeTable(
    { path: file, name },
    {
      basePath,
      transform(entry, _type, property) {
        entry.origin = declarationOrigin((property.declarations ?? []).map((declaration) => declaration.path));
      },
    },
  );
}
