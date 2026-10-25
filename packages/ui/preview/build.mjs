// Builds the static gallery: compiles the theme CSS with PostCSS and
// renders preview/gallery.tsx to preview/dist/{index,dark}.html.
// Run from packages/ui: `pnpm preview:build` (builds the package first,
// the gallery imports from dist). No bundler: the gallery is transpiled
// with the installed TypeScript compiler API, then rendered with
// react-dom/client inside jsdom (same environment as the unit tests)
// so effect-gated output like Radix portals is included.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
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

// jsdom globals BEFORE importing the gallery: Radix snapshots
// `document` at module load (layout-effect shim), so it must exist.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  // A real origin (not opaque) so storage getters do not throw.
  url: "http://localhost/",
  pretendToBeVisual: true,
});
// Node ships its own Event classes; jsdom's document only accepts
// jsdom's, so those overwrite even when already present.
const DOM_EVENTS = [
  "Event",
  "CustomEvent",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "PointerEvent",
  "TouchEvent",
  "UIEvent",
  "InputEvent",
  "WheelEvent",
  "DragEvent",
  "SubmitEvent",
];
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (!(key in globalThis) || DOM_EVENTS.includes(key)) {
    globalThis[key] = dom.window[key];
  }
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { Gallery } = await import(pathToFileURL(tmpFile).href);
rmSync(tmpFile);

mkdirSync(outDir, { recursive: true });
const { createRoot } = await import("react-dom/client");
const reactRoot = createRoot(dom.window.document.body);
await act(async () => {
  reactRoot.render(createElement(Gallery));
});
const body = dom.window.document.body.innerHTML;
await act(async () => {
  reactRoot.unmount();
});
writeFileSync(join(outDir, "index.html"), page({ title: "UI gallery", body, css, dark: false }));
writeFileSync(join(outDir, "dark.html"), page({ title: "UI gallery (dark)", body, css, dark: true }));
console.log(`gallery: wrote ${outDir}/index.html + dark.html`);
