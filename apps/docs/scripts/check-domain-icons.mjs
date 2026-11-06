// Ensures every home entry-point title has a lucide mapping (Refs #428).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mappingKey } from "./check-agent-icons.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

export function checkDomainIcons({ titles, source, lucide }) {
  const errors = [];
  for (const title of titles) {
    if (!mappingKey(source, title)) errors.push(`domain-icons: missing mapping for home card "${title}"`);
  }
  const mapped = [...source.matchAll(/^\s{2}"([^"]+)":\s/gm)].map((m) => m[1]);
  for (const title of mapped) {
    if (!titles.includes(title)) errors.push(`domain-icons: extra mapping "${title}" not in home-entry-points.json`);
  }

  const importBlock = source.match(/import\s+(?!type)\{([^}]+)\}\s*from\s*"lucide-react"/);
  if (!importBlock) {
    errors.push("domain-icons: missing lucide-react import block");
    return errors;
  }
  const lucideNames = importBlock[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const exportName of lucideNames) {
    if (!lucide[exportName]) errors.push(`domain-icons: lucide-react has no export "${exportName}"`);
  }
  const objectBody = source.match(/export const DOMAIN_ICONS[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
  const usedIcons = new Set([...objectBody.matchAll(/:\s*([A-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]));
  for (const iconName of usedIcons) {
    if (!lucideNames.includes(iconName)) {
      errors.push(`domain-icons: mapping uses ${iconName} but it is not imported from lucide-react`);
    }
  }
  return errors;
}

function main() {
  const require = createRequire(join(APP, "package.json"));
  const lucide = require("lucide-react");
  const cards = JSON.parse(readFileSync(join(APP, "home-entry-points.json"), "utf8"));
  const source = readFileSync(join(APP, "lib", "domain-icons.ts"), "utf8");
  const errors = checkDomainIcons({ titles: cards.map((row) => row.title), source, lucide });
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`domain-icons: ok (${cards.length} home cards)`);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) main();
