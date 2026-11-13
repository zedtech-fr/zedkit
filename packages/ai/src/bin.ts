#!/usr/bin/env node
// Original work by the same author.
import { main, type Sinks } from "./cli.js";
import { gateMain } from "./gate.js";

const sinks: Sinks = {
  out: (line: string) => console.log(line),
  err: (line: string) => console.error(line),
};
const [command, ...rest] = process.argv.slice(2);

// `gate` and `visual-verify` launch child processes / a browser, so they are async.
if (command === "gate") process.exitCode = await gateMain(rest, sinks);
else if (command === "visual-verify") {
  const mod = (await import(
    new URL("../scripts/visual-verify.mjs", import.meta.url).href
  )) as {
    visualVerifyMain: (args: string[], next: Sinks) => Promise<number>;
  };
  process.exitCode = await mod.visualVerifyMain(rest, sinks);
} else process.exitCode = main(process.argv.slice(2), sinks);
