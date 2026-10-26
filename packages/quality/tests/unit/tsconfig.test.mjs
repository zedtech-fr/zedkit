import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

describe("tsconfig base", () => {
  it("enforces strictness on fixtures extending the shipped base", () => {
    const configPath = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/tsconfig/tsconfig.json");
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    expect(configFile.error).toBeUndefined();
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, dirname(configPath));
    expect(parsed.errors).toEqual([]);
    const program = ts.createProgram(parsed.fileNames, parsed.options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const forFile = (name) => diagnostics.filter((d) => d.file?.fileName.endsWith(name));
    expect(forFile("clean.ts")).toEqual([]);
    expect(forFile("strict.ts").length).toBeGreaterThan(0);
  });
});
