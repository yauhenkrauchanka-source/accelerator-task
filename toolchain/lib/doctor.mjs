import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { capabilityEnvironment, inspectInstalledCapability } from "./capability.mjs";
import {
  hashIdentifier,
  isResolvedPathInside,
  resolveActivationProofPath,
  resolveCachePaths,
} from "./cache.mjs";
import { isSupportedNodeVersion, loadManifest } from "./manifest.mjs";
import { runProcess } from "./process.mjs";
import {
  inspectRegistrationFile,
  loadRegistration,
  registrationDigest,
} from "./registrations.mjs";
import { assertGitRoot } from "./repository.mjs";

const execFile = promisify(execFileCallback);

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function addCheck(checks, id, status, message, details = undefined) {
  checks.push({ id, status, message, ...(details === undefined ? {} : { details }) });
}

function overallStatus(checks) {
  if (checks.some((check) => check.status === "BLOCKED")) return "BLOCKED";
  if (checks.some((check) => check.status === "DEGRADED")) return "DEGRADED";
  return "READY";
}

async function inspectHooks(targetRoot, cachePaths, loaded, runtime) {
  const registration = await loadRegistration(targetRoot, runtime);
  let inspection;
  try {
    inspection = await inspectRegistrationFile(targetRoot, registration);
  } catch (error) {
    return { status: "CONFLICT", reason: error.message };
  }
  if (inspection.operation !== "unchanged") {
    return { status: "NOT_CONFIGURED", reason: `${registration.target} is missing the current registration` };
  }

  const proofPath = resolveActivationProofPath(cachePaths, targetRoot, runtime);
  let proof;
  try {
    proof = await readJson(proofPath);
  } catch (error) {
    if (error.code === "ENOENT") return { status: "PENDING_ACTIVATION", proofPath };
    return { status: "STALE", reason: error.message, proofPath };
  }
  if (
    proof.manifestHash !== loaded.hash ||
    proof.registrationId !== registration.registrationId ||
    proof.registrationDigest !== registrationDigest(registration) ||
    proof.runtime !== runtime ||
    proof.repositoryHash !== hashIdentifier(targetRoot)
  ) {
    return { status: "STALE", proofPath };
  }
  return { status: "ACTIVE", proofPath, activatedAt: proof.activatedAt };
}

async function inspectLintCapability(targetRoot, options = {}) {
  const execute = options.execFile ?? execFile;
  const result = await execute("git", ["ls-files", "-co", "--exclude-standard"], {
    cwd: targetRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  const packageFiles = String(result.stdout)
    .split(/\r?\n/)
    .filter((file) => file === "package.json" || file.endsWith("/package.json"));
  const lintRoots = [];
  for (const relativePath of packageFiles) {
    try {
      const packageJson = await readJson(path.join(targetRoot, ...relativePath.split("/")));
      if (typeof packageJson.scripts?.lint === "string") lintRoots.push(path.dirname(relativePath) || ".");
    } catch (error) {
      return { status: "invalid", reason: `Invalid ${relativePath}: ${error.message}` };
    }
  }
  if (lintRoots.length === 0) return { status: "missing", reason: "no existing lint script was found" };
  if (lintRoots.includes(".")) return { status: "ready", roots: ["."] };
  if (lintRoots.length === 1) return { status: "ready", roots: lintRoots };
  return { status: "ambiguous", roots: lintRoots, reason: "multiple application lint scripts require session context" };
}

export async function runDoctor(options) {
  const checks = [];
  let targetRoot;
  try {
    targetRoot = await assertGitRoot(options.targetRoot);
    addCheck(checks, "git-root", "PASS", `Git root: ${targetRoot}`);
  } catch (error) {
    addCheck(checks, "git-root", "BLOCKED", error.message);
    return { status: "BLOCKED", checks };
  }

  const nodeVersion = options.nodeVersion ?? process.versions.node;
  addCheck(
    checks,
    "node",
    isSupportedNodeVersion(nodeVersion) ? "PASS" : "BLOCKED",
    isSupportedNodeVersion(nodeVersion)
      ? `Node.js ${nodeVersion} satisfies the accelerator requirement.`
      : `Node.js ${nodeVersion} is unsupported; install Node.js 24 or newer for the accelerator.`,
  );

  let loaded;
  try {
    loaded = await loadManifest(targetRoot);
    addCheck(checks, "manifest", "PASS", `Runtime Toolchain Manifest ${loaded.hash.slice(0, 12)} is valid.`);
  } catch (error) {
    addCheck(checks, "manifest", "BLOCKED", error.message);
    return { status: "BLOCKED", checks, targetRoot };
  }
  const cachePaths = resolveCachePaths({
    manifestHash: loaded.hash,
    cacheRoot: options.cacheRoot,
    env: options.env,
    platform: options.platform,
    arch: options.arch,
    homedir: options.homedir,
  });
  if (await isResolvedPathInside(targetRoot, cachePaths.cacheRoot)) {
    addCheck(
      checks,
      "cache-root",
      "BLOCKED",
      `Runtime Toolchain Cache must be outside the target repository: ${cachePaths.cacheRoot}`,
    );
    return { status: "BLOCKED", checks, targetRoot, cacheRoot: cachePaths.cacheRoot, manifestHash: loaded.hash };
  }

  for (const [name, definition] of Object.entries(loaded.manifest.capabilities)) {
    const capability = { name, ...definition };
    const installed = await inspectInstalledCapability({
      cachePaths,
      capability,
      manifestHash: loaded.hash,
      platform: options.platform,
    });
    if (!installed.healthy) {
      addCheck(
        checks,
        `capability:${name}`,
        capability.required ? "BLOCKED" : "DEGRADED",
        `${name} capability: ${installed.reason}`,
      );
      continue;
    }
    const probe = await runProcess(process.execPath, [installed.paths.entrypoint, "--version"], {
      cwd: targetRoot,
      env: capabilityEnvironment(capability, installed.paths, options.env),
      runner: options.runner,
    });
    addCheck(
      checks,
      `capability:${name}`,
      probe.code === 0 ? "PASS" : capability.required ? "BLOCKED" : "DEGRADED",
      probe.code === 0
        ? `${name} capability ${capability.package}@${capability.version} is ready.`
        : `${name} executable version probe failed with exit code ${probe.code}.`,
    );
  }

  for (const runtime of ["claude", "codex"]) {
    let hook;
    try {
      hook = await inspectHooks(targetRoot, cachePaths, loaded, runtime);
    } catch (error) {
      hook = { status: "CONFLICT", reason: error.message };
    }
    const status = hook.status === "ACTIVE" ? "PASS" : hook.status === "CONFLICT" || hook.status === "NOT_CONFIGURED" ? "BLOCKED" : "DEGRADED";
    addCheck(
      checks,
      `hooks:${runtime}`,
      status,
      `${runtime} hooks: ${hook.status}${hook.reason ? ` — ${hook.reason}` : ""}`,
      hook,
    );
  }

  const lint = await inspectLintCapability(targetRoot, options);
  addCheck(
    checks,
    "lint",
    lint.status === "ready" ? "PASS" : "DEGRADED",
    lint.status === "ready"
      ? `Existing lint capability found at ${lint.roots.join(", ")}.`
      : `Changed-File Lint Gate is degraded: ${lint.reason}.`,
    lint,
  );

  return { status: overallStatus(checks), checks, targetRoot, cacheRoot: cachePaths.cacheRoot, manifestHash: loaded.hash };
}

export function formatDoctorReport(report) {
  const lines = [`Frontend Accelerator Doctor: ${report.status}`];
  for (const check of report.checks) lines.push(`[${check.status}] ${check.message}`);
  if (report.cacheRoot) lines.push(`Cache: ${report.cacheRoot}`);
  return lines.join("\n");
}

export function doctorExitCode(report) {
  return report.status === "BLOCKED" ? 1 : 0;
}
