// Ensures every agent in kit.json has a lucide mapping (Refs #428).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"));
const lucide = require("lucide-react");

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");
const kit = JSON.parse(readFileSync(join(ROOT, "packages", "ai", "kit", "kit.json"), "utf8"));
const source = readFileSync(join(APP, "lib", "agent-icons.ts"), "utf8");

function mappingKey(name) {
  return source.includes(`"${name}":`) || source.includes(`${name}:`);
}

const errors = [];
for (const name of kit.agents) {
  if (!mappingKey(name)) errors.push(`agent-icons: missing mapping for kit agent "${name}"`);
}
const mapped = [...source.matchAll(/^\s{2}(?:"([^"]+)"|([a-z-]+)):\s/gm)].map((m) => m[1] ?? m[2]);
for (const name of mapped) {
  if (!kit.agents.includes(name)) errors.push(`agent-icons: extra mapping "${name}" not in kit.json`);
}

const importBlock = source.match(/import\s+(?!type)\{([^}]+)\}\s*from\s*"lucide-react"/);
if (!importBlock) {
  errors.push("agent-icons: missing lucide-react import block");
} else {
  const lucideNames = importBlock[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const exportName of lucideNames) {
    if (!lucide[exportName]) errors.push(`agent-icons: lucide-react has no export "${exportName}"`);
  }
  const objectBody = source.match(/export const AGENT_ICONS[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
  const usedIcons = new Set([...objectBody.matchAll(/:\s*([A-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]));
  for (const iconName of usedIcons) {
    if (!lucideNames.includes(iconName)) {
      errors.push(`agent-icons: mapping uses ${iconName} but it is not imported from lucide-react`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`agent-icons: ok (${kit.agents.length} agents)`);
