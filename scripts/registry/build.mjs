#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rewriteUiImports } from "./rewrite-ui-imports.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const uiSrc = join(root, "packages/ui/src");
const generatedDir = join(root, "registry/generated/ui");
const outDir = join(root, "apps/docs/public/r");

/** UI bricks published in the first registry slice (#187). */
const REGISTRY_UI_FILES = ["badge.tsx", "drawer.tsx", "confirm-dialog.tsx", "status-dot.tsx", "checkmark.tsx", "updated-ago.tsx", "status-label.tsx", "progress-bar.tsx", "alert.tsx", "sonner.tsx", "detail-panel.tsx", "typography.tsx", "card.tsx", "skeleton.tsx", "app-shell.tsx", "wizard-steps.tsx", "separator.tsx"];

function stageTransformedSources() {
  rmSync(generatedDir, { recursive: true, force: true });
  mkdirSync(generatedDir, { recursive: true });
  for (const file of REGISTRY_UI_FILES) {
    const raw = readFileSync(join(uiSrc, file), "utf8");
    writeFileSync(join(generatedDir, file), rewriteUiImports(raw), "utf8");
  }
}

function runShadcnBuild() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "-o", outDir], {
    cwd: root,
    stdio: "inherit",
  });
}

stageTransformedSources();
runShadcnBuild();
