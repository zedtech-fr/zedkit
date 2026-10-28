import { registryBrickNames } from "@/content/registry-site";

/** Static export paths exercised after docs build (one JSON per registry.json item). */
export function registryJsonSmokePaths(): string[] {
  return registryBrickNames.map((name) => `/r/${name}.json`);
}
