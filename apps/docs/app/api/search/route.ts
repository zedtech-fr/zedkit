import { source } from "#source";
import { createFromSource } from "fumadocs-core/search/server";

// Statically cached: the search index is emitted once at build time,
// so this route doubles as a static JSON file under `output: "export"`.
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
