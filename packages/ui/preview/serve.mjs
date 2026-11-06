// Serves preview/dist over HTTP for visual review and the smoke run.
// Usage: `pnpm preview` (builds first) or `node ./preview/serve.mjs [port]`.
// Fails loudly when the gallery was not built yet.
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "dist");
const port = Number(process.argv[2] ?? 4123);

const TYPES = { ".html": "text/html; charset=utf-8" };

function page(name) {
  const file = join(outDir, name);
  if (!existsSync(file)) return null;
  return readFileSync(file);
}

const server = createServer((request, response) => {
  const name = request.url === "/dark" || request.url === "/dark.html" ? "dark.html" : "index.html";
  const body = page(name);
  if (!body) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("gallery not built: run `pnpm preview:build` first\n");
    return;
  }
  response.writeHead(200, { "content-type": TYPES[".html"] });
  response.end(body);
});

server.on("error", (error) => {
  console.error(`gallery: cannot serve on port ${port}: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`gallery: serving ${outDir} at http://127.0.0.1:${port}/ (+ /dark)`);
});
