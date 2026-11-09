#!/usr/bin/env node

import process from "node:process";
import { executeManagedCapability } from "../lib/capability.mjs";
import { findGitRoot } from "../lib/repository.mjs";

async function main() {
  const targetRoot = await findGitRoot(process.cwd());
  const result = await executeManagedCapability({
    targetRoot,
    name: "docs",
    args: process.argv.slice(2),
    stdio: "inherit",
  });
  if (result.signal) process.kill(process.pid, result.signal);
  else process.exitCode = result.code;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
