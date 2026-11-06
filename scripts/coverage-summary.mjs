#!/usr/bin/env node
// Turn vitest/istanbul coverage-summary.json into a job-summary table
// grouped by packages/<name>. Totals come from the summary `total` entry.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const METRICS = ["lines", "statements", "functions", "branches"];

function metric(entry, key) {
  const raw = entry?.[key];
  return {
    total: Number(raw?.total) || 0,
    covered: Number(raw?.covered) || 0,
  };
}

function add(into, from) {
  into.total += from.total;
  into.covered += from.covered;
}

function emptyRow() {
  return Object.fromEntries(METRICS.map((key) => [key, { total: 0, covered: 0 }]));
}

function pct({ covered, total }) {
  if (total === 0) return 100;
  const value = Math.round((10000 * covered) / total) / 100;
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function formatRow(name, row) {
  const cells = METRICS.map((key) => String(pct(row[key])));
  return `| ${name} | ${cells.join(" | ")} |`;
}

function packageFromPath(filePath) {
  const normalized = String(filePath).replaceAll("\\", "/");
  const match = normalized.match(/(?:^|\/)packages\/([^/]+)\//);
  return match?.[1] ?? null;
}

export function formatCoverageSummary(summary) {
  if (summary === null || typeof summary !== "object" || Array.isArray(summary)) {
    throw new TypeError("coverage summary must be an object");
  }

  const total = emptyRow();
  for (const key of METRICS) add(total[key], metric(summary.total, key));

  const packages = new Map();
  for (const [filePath, entry] of Object.entries(summary)) {
    if (filePath === "total") continue;
    const name = packageFromPath(filePath);
    if (!name) continue;
    const row = packages.get(name) ?? emptyRow();
    for (const key of METRICS) add(row[key], metric(entry, key));
    packages.set(name, row);
  }

  const totalLines = METRICS.map((key) => {
    const m = total[key];
    return `| ${key} | ${pct(m)} | ${m.covered}/${m.total} |`;
  });

  const packageNames = [...packages.keys()].sort();
  const packageLines = [
    "| package | lines % | statements % | functions % | branches % |",
    "|---|---|---|---|---|",
    ...packageNames.map((name) => formatRow(name, packages.get(name))),
    formatRow("**total**", total),
  ];

  return [
    "## Coverage",
    "",
    "| metric | % | covered/total |",
    "|---|---|---|",
    ...totalLines,
    "",
    "## Coverage by package",
    "",
    ...packageLines,
    "",
  ].join("\n");
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(invoked).href) {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write("usage: coverage-summary.mjs <coverage-summary.json>\n");
    process.exit(1);
  }
  const summary = JSON.parse(readFileSync(path, "utf8"));
  process.stdout.write(formatCoverageSummary(summary));
}
