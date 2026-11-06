import { readFileSync } from "node:fs";
import { join } from "node:path";

/** UI brick names declared in the root registry.json (single source for docs copy). */
export function loadRegistryBrickNames(root) {
  const path = join(root, "registry.json");
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const names = (raw.items ?? [])
    .map((item) => item?.name)
    .filter((name) => typeof name === "string" && name.length > 0);
  if (names.length === 0) {
    throw new Error("registry.json: expected at least one item with a name.");
  }
  return names;
}
