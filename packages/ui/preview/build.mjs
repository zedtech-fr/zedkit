// Builds the static gallery: compiles the theme CSS with PostCSS and
// renders preview/gallery.tsx to preview/dist/{index,dark}.html.
// Run from packages/ui: `pnpm preview:build` (builds the package first,
// the gallery imports from dist). No bundler: the gallery is transpiled
// with the installed TypeScript compiler API.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(here, "dist");

function page({ title, body, css, dark }) {
  return `<!doctype html>
<html lang="en"${dark ? ' class="dark"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${css}</style>
</head>
<body>${body}</body>
</html>
`;
}

const cssInput = readFileSync(join(root, "src", "styles.css"), "utf8");
const css = (
  await postcss([tailwindcss()]).process(cssInput, { from: join(root, "src", "styles.css") })
).css;

const gallerySource = readFileSync(join(here, "gallery.tsx"), "utf8");
const galleryCompiled = transpileModule(gallerySource, {
  compilerOptions: {
    jsx: JsxEmit.ReactJSX,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ES2022,
  },
}).outputText.replaceAll(
  // The gallery typechecks against src via #index.js; at runtime node
  // cannot load .tsx, so render the built package instead (preview:build
  // runs the package build first). Path is relative to the tmp file below.
  '"#index.js"',
  '"../dist/index.js"',
);
const tmpFile = join(here, "dist-gallery.tmp.mjs");
writeFileSync(tmpFile, galleryCompiled);
const { Gallery } = await import(pathToFileURL(tmpFile).href);
rmSync(tmpFile);

mkdirSync(outDir, { recursive: true });
const body = renderToStaticMarkup(createElement(Gallery));
writeFileSync(join(outDir, "index.html"), page({ title: "UI gallery", body, css, dark: false }));
writeFileSync(join(outDir, "dark.html"), page({ title: "UI gallery (dark)", body, css, dark: true }));
console.log(`gallery: wrote ${outDir}/index.html + dark.html`);
