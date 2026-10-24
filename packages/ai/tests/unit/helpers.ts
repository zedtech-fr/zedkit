import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach } from "vitest";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "zedkit-ai-"));
  dirs.push(dir);
  return dir;
}

export function put(root: string, rel: string, content: string): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export const SKILL = (name: string): string =>
  `---\nname: ${name}\ndescription: "Does ${name}. Use when needed."\n---\n\n# ${name}\n`;

export const AGENT = (name: string, extra = ""): string =>
  `---\nname: ${name}\ndescription: "Agent ${name}. Use when needed."\n${extra}---\n\nBody.\n`;
