/** Pure helper: shared by docs lib (Playwright) and node tests (test:registry). */
export function registryJsonSmokePathsFromNames(names) {
  return names.map((name) => `/r/${name}.json`);
}
