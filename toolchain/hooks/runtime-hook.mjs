#!/usr/bin/env node

import process from "node:process";
import { resolveCachePaths } from "../lib/cache.mjs";
import { formatHookOutput, parseHookPayload } from "../lib/hook-protocol.mjs";
import { runChangedFileLintGate } from "../lib/lint-gate.mjs";
import { loadManifest } from "../lib/manifest.mjs";
import { loadRegistration, registrationDigest } from "../lib/registrations.mjs";
import { findGitRoot } from "../lib/repository.mjs";
import { recordPostToolState, recordPreToolState, writeActivationProof } from "../lib/session-state.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function parseArguments(args) {
  const [runtime, event, flag, registrationId, ...extra] = args;
  if (extra.length > 0 || flag !== "--registration" || !registrationId) {
    throw new Error("Usage: runtime-hook <claude|codex> <event> --registration <id>");
  }
  return { runtime, event, registrationId };
}

async function handleHook(arguments_) {
  const payload = parseHookPayload(await readStdin(), arguments_);
  const repositoryRoot = await findGitRoot(payload.cwd);
  const loaded = await loadManifest(repositoryRoot);
  const registration = await loadRegistration(repositoryRoot, arguments_.runtime);
  if (registration.registrationId !== arguments_.registrationId) {
    throw new Error("Hook registration identifier does not match the installed registration");
  }
  const cachePaths = resolveCachePaths({ manifestHash: loaded.hash });
  const context = {
    ...payload,
    cachePaths,
    manifestHash: loaded.hash,
    registrationDigest: registrationDigest(registration),
    repositoryRoot,
  };

  if (arguments_.event === "SessionStart") {
    await writeActivationProof(context);
    return { status: "pass", block: false, message: "Frontend Accelerator hooks activated." };
  }
  if (arguments_.event === "PreToolUse") return recordPreToolState(context);
  if (arguments_.event === "PostToolUse") return recordPostToolState(context);
  if (arguments_.event === "Stop") return runChangedFileLintGate(context);
  throw new Error(`Unsupported hook event: ${arguments_.event}`);
}

let arguments_;
try {
  arguments_ = parseArguments(process.argv.slice(2));
  const result = await handleHook(arguments_);
  const output = formatHookOutput(arguments_.event, result);
  if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
} catch (error) {
  if (arguments_?.event === "Stop") {
    process.stdout.write(
      `${JSON.stringify({
        decision: "block",
        reason: `Frontend Accelerator lint guardrail could not run: ${error.message}`,
      })}\n`,
    );
  } else {
    console.error(`Frontend Accelerator hook failed: ${error.message}`);
    process.exitCode = 1;
  }
}
