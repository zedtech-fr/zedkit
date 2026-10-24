#!/usr/bin/env node
// Original work by the same author.
import { main } from "./cli.js";

process.exitCode = main(process.argv.slice(2), {
  out: (line) => console.log(line),
  err: (line) => console.error(line),
});
