/** @typedef {{ name: string, registryDependencies?: string[], cssVars?: unknown, css?: unknown }} RegistryItem */
/** @typedef {{ items?: RegistryItem[] }} RegistryCatalog */

export const KIT_REGISTRY_REPO = "zedtech-fr/zedkit";

/** Bare names that intentionally resolve to the upstream shadcn registry. */
export const SHADCN_SHARED_REGISTRY_DEPS = new Set(["utils"]);

export function kitRegistryDep(brickName) {
  return `@zedkit/${brickName}`;
}

function resolveKitSibling(dep) {
  if (dep.startsWith(`${KIT_REGISTRY_REPO}/`)) {
    return dep.slice(KIT_REGISTRY_REPO.length + 1);
  }
  if (dep.startsWith("@zedkit/")) {
    return dep.slice("@zedkit/".length);
  }
  return null;
}

/**
 * @param {RegistryCatalog} registry
 * @param {readonly string[]} brickNames bricks that must copy as one family
 * @returns {string[]}
 */
export function checkCopySourceFamily(registry, brickNames) {
  const published = new Set((registry.items ?? []).map((item) => item.name));
  const family = new Set(brickNames);
  const errors = [];

  for (const name of brickNames) {
    const item = registry.items?.find((entry) => entry.name === name);
    if (!item) {
      errors.push(`copy-source: missing registry item "${name}"`);
      continue;
    }

    for (const dep of item.registryDependencies ?? []) {
      if (SHADCN_SHARED_REGISTRY_DEPS.has(dep)) continue;

      const sibling = resolveKitSibling(dep);
      if (sibling !== null) {
        if (!published.has(sibling)) {
          errors.push(`${name}: kit dependency ${dep} is not a published brick`);
        } else if (family.has(name) && !family.has(sibling)) {
          errors.push(`${name}: kit dependency ${dep} must reference a brick in the same copy family`);
        }
        continue;
      }

      if (published.has(dep)) {
        errors.push(`${name}: use ${kitRegistryDep(dep)} instead of bare "${dep}"`);
        continue;
      }

      errors.push(`${name}: registryDependency "${dep}" must be utils or @zedkit/<brick>`);
    }
  }

  return errors;
}

/**
 * @param {RegistryCatalog} registry
 * @param {Record<string, { cssVars?: unknown, css?: unknown }>} expectedByBrick
 * @param {readonly string[]} brickNames
 * @returns {string[]}
 */
export function checkCopySourceFamilyTheme(registry, expectedByBrick, brickNames) {
  const errors = [];
  for (const name of brickNames) {
    const item = registry.items?.find((entry) => entry.name === name);
    const expected = expectedByBrick[name];
    if (!item || !expected) continue;
    if (expected.cssVars && !item.cssVars) {
      errors.push(`${name}: missing cssVars required for copy-only theme`);
    }
    if (expected.css && !item.css) {
      errors.push(`${name}: missing css required for copy-only theme`);
    }
  }
  return errors;
}
