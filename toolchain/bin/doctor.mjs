#!/usr/bin/env node

import process from "node:process";
import { doctorExitCode, formatDoctorReport, runDoctor } from "../lib/doctor.mjs";
import { findGitRoot } from "../lib/repository.mjs";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--json") || new Set(args).size !== args.length) {
    throw new Error("Usage: node toolchain/bin/doctor.mjs [--json]");
  }
  const targetRoot = await findGitRoot(process.cwd());
  const report = await runDoctor({ targetRoot });
  console.log(args.includes("--json") ? JSON.stringify(report, null, 2) : formatDoctorReport(report));
  process.exitCode = doctorExitCode(report);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
