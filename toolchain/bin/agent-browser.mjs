#!/usr/bin/env node

import process from "node:process";
import { executeBrowserAdapter } from "../lib/browser-adapter.mjs";
import { findGitRoot } from "../lib/repository.mjs";

async function main() {
  const targetRoot = await findGitRoot(process.cwd());
  const result = await executeBrowserAdapter({
    targetRoot,
    args: process.argv.slice(2),
  });
  if (result.signal) process.kill(process.pid, result.signal);
  else process.exitCode = result.code;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
