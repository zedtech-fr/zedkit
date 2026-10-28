import { registryBrickNames } from "../content/registry-site";
import { registryJsonSmokePathsFromNames } from "../scripts/registry-smoke-urls.mjs";

/** Static export paths exercised after docs build (one JSON per registry.json item). */
export function registryJsonSmokePaths(): string[] {
  return registryJsonSmokePathsFromNames(registryBrickNames);
}
