import { createFromSource } from "fumadocs-core/search/server";

import { source } from "#source";

// Statically cached: the search index is emitted once at build time,
// so this route doubles as a static JSON file under `output: "export"`.
export const dynamic = "force-static";
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
