import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

function escapeHtmlAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function redirectHtml(target) {
  const href = escapeHtmlAttr(target);
  const js = jsonForScript(target);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${href}">
<link rel="canonical" href="${href}">
<title>Redirect</title>
<script>location.replace(${js})</script>
</head>
<body><p><a href="${href}">Continue</a></p></body>
</html>
`;
}

function assertSafeFrom(from) {
  if (typeof from !== "string" || !from.startsWith("/") || from.includes("\0") || from.includes("\\")) {
    throw new Error(`unsafe redirect path: ${from}`);
  }
  const parts = from.slice(1).split("/");
  if (parts.length === 0 || parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`unsafe redirect path: ${from}`);
  }
}

export function writeRedirectStub(outDir, from, to) {
  assertSafeFrom(from);
  const rel = `${from.slice(1)}.html`;
  const file = join(outDir, rel);
  const resolved = resolve(file);
  const root = resolve(outDir);
  const inside = resolved === root || relative(root, resolved).split(sep)[0] !== "..";
  if (!inside) {
    throw new Error(`redirect stub escapes outDir: ${from}`);
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, redirectHtml(to), "utf8");
}
