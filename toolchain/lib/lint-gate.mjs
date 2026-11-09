import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { platformExecutable, runProcess } from "./process.mjs";
import { readSessionState, writeSessionState } from "./session-state.mjs";

async function readPackageJson(directory) {
  try {
    return JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw new Error(`Invalid package.json: ${path.join(directory, "package.json")}`, { cause: error });
  }
}

async function nearestLintPackage(repositoryRoot, relativePath) {
  let current = path.dirname(path.join(repositoryRoot, ...relativePath.split("/")));
  while (current === repositoryRoot || current.startsWith(`${repositoryRoot}${path.sep}`)) {
    const packageJson = await readPackageJson(current);
    if (typeof packageJson?.scripts?.lint === "string") return { directory: current, packageJson };
    if (current === repositoryRoot) break;
    current = path.dirname(current);
  }
  return undefined;
}

async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function selectPackageManager(repositoryRoot, capability, platform) {
  const declared = capability.packageJson.packageManager?.split("@", 1)[0];
  if (new Set(["npm", "pnpm", "yarn", "bun"]).has(declared)) {
    return { command: platformExecutable(declared, platform), args: declared === "yarn" ? ["lint"] : ["run", "lint"] };
  }
  const candidates = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];
  let current = capability.directory;
  while (current === repositoryRoot || current.startsWith(`${repositoryRoot}${path.sep}`)) {
    for (const [lockfile, manager] of candidates) {
      if (await pathExists(path.join(current, lockfile))) {
        return {
          command: platformExecutable(manager, platform),
          args: manager === "yarn" ? ["lint"] : ["run", "lint"],
        };
      }
    }
    if (current === repositoryRoot) break;
    current = path.dirname(current);
  }
  return { command: platformExecutable("npm", platform), args: ["run", "lint"] };
}

export async function resolveLintCapability(repositoryRoot, changedPaths, options = {}) {
  const rootPackageJson = await readPackageJson(repositoryRoot);
  let capability;
  if (typeof rootPackageJson?.scripts?.lint === "string") {
    capability = { directory: repositoryRoot, packageJson: rootPackageJson };
  } else {
    const packages = (await Promise.all(changedPaths.map((file) => nearestLintPackage(repositoryRoot, file)))).filter(
      Boolean,
    );
    const roots = new Map(packages.map((item) => [item.directory, item]));
    if (roots.size === 0) return { status: "missing", reason: "no existing lint script owns the changed files" };
    if (roots.size > 1) return { status: "ambiguous", reason: "changed files belong to multiple lint package roots" };
    capability = [...roots.values()][0];
  }
  const manager = await selectPackageManager(repositoryRoot, capability, options.platform);
  return { status: "ready", ...capability, ...manager };
}

function lintRunKey(state, lint) {
  return createHash("sha256")
    .update(JSON.stringify({ changed: state.changed, command: lint.command, args: lint.args, cwd: lint.directory }))
    .digest("hex");
}

function conciseOutput(result) {
  const value = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if (value.length <= 2000) return value;
  return `${value.slice(0, 1000)}\n… output truncated …\n${value.slice(-1000)}`;
}

export async function runChangedFileLintGate(context, options = {}) {
  const writeState = options.writeState ?? writeSessionState;
  const session = await readSessionState(context);
  const state = session.state;
  const changedPaths = Object.keys(state.changed).sort();
  if (changedPaths.length === 0) {
    if (state.attributionDegraded) {
      return {
        status: "degraded",
        block: false,
        message: "Frontend Accelerator guardrail DEGRADED: file attribution was incomplete for this session.",
      };
    }
    return { status: "pass", block: false, message: "No current-session file changes require linting." };
  }
  const lint = await resolveLintCapability(context.repositoryRoot, changedPaths, options);
  if (lint.status !== "ready") {
    state.lastLint = { status: "degraded", reason: lint.reason, changedPaths };
    await writeState(session.file, state);
    return {
      status: "degraded",
      block: false,
      message: `Frontend Accelerator guardrail DEGRADED: ${lint.reason}.`,
    };
  }

  const runKey = lintRunKey(state, lint);
  if (state.lastLint?.runKey === runKey) {
    if (state.lastLint.status === "pass") {
      return { status: "pass", block: false, message: "Changed-file lint already passed." };
    }
    return {
      status: "fail",
      block: false,
      message: `Frontend Accelerator lint still FAILED (not rerun): ${state.lastLint.output}`,
    };
  }

  const result = await runProcess(lint.command, lint.args, {
    cwd: lint.directory,
    env: options.env,
    runner: options.runner,
  });
  if (result.code === 0) {
    state.lastLint = { status: "pass", runKey, changedPaths };
    await writeState(session.file, state);
    return { status: "pass", block: false, message: "Changed-file lint passed." };
  }
  const output = conciseOutput(result) || `${lint.command} exited with ${result.code}`;
  state.lastLint = { status: "fail", runKey, changedPaths, output };
  await writeState(session.file, state);
  return {
    status: "fail",
    block: !context.stopHookActive,
    message: `Frontend Accelerator lint FAILED: ${output}`,
  };
}
