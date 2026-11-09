import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { lstat, mkdir, readFile, readlink, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  canonicalPath,
  hashIdentifier,
  isPathInside,
  resolveActivationProofPath,
  resolveSessionStatePath,
} from "./cache.mjs";

const execFile = promisify(execFileCallback);

async function readJsonOr(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return structuredClone(fallback);
    throw error;
  }
}

async function writeJsonAtomic(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  try {
    await rename(temporary, file);
  } catch (error) {
    if (error.code !== "EEXIST" && error.code !== "EPERM") throw error;
    await rm(file, { force: true });
    await rename(temporary, file);
  }
}

export async function writeSessionState(file, state) {
  await writeJsonAtomic(file, state);
}

function normalizeRelativePath(repositoryRoot, value, excludedRoots = []) {
  if (typeof value !== "string" || !value) return undefined;
  const absolute = path.resolve(repositoryRoot, value);
  const relative = path.relative(repositoryRoot, absolute);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return undefined;
  }
  const normalized = relative.split(path.sep).join("/");
  if (normalized === ".git" || normalized.startsWith(".git/")) return undefined;
  if (excludedRoots.some((root) => isPathInside(root, absolute))) return undefined;
  return normalized;
}

async function fingerprint(repositoryRoot, relativePath) {
  const absolute = path.join(repositoryRoot, ...relativePath.split("/"));
  try {
    const stats = await lstat(absolute);
    if (!stats.isFile() && !stats.isSymbolicLink()) return "unsupported";
    const content = stats.isSymbolicLink() ? Buffer.from(await readlink(absolute), "utf8") : await readFile(absolute);
    return `sha256:${createHash("sha256").update(content).digest("hex")}`;
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

function parsePorcelainZ(stdout) {
  const fields = stdout.split("\0");
  const paths = [];
  for (let index = 0; index < fields.length; index += 1) {
    const entry = fields[index];
    if (!entry || entry.length < 4) continue;
    const status = entry.slice(0, 2);
    paths.push(entry.slice(3));
    if (/[RC]/.test(status) && fields[index + 1]) paths.push(fields[(index += 1)]);
  }
  return paths;
}

export async function collectWorkingTreeFingerprints(repositoryRoot, options = {}) {
  const execute = options.execFile ?? execFile;
  const result = await execute(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=all"],
    { cwd: repositoryRoot, encoding: "utf8", windowsHide: true },
  );
  const uniquePaths = new Set(
    parsePorcelainZ(String(result.stdout))
      .map((item) => normalizeRelativePath(repositoryRoot, item, options.excludedRoots))
      .filter(Boolean),
  );
  const entries = await Promise.all(
    [...uniquePaths].sort().map(async (relativePath) => [relativePath, await fingerprint(repositoryRoot, relativePath)]),
  );
  return Object.fromEntries(entries);
}

async function collectCandidateFingerprints(repositoryRoot, candidates) {
  const entries = await Promise.all(
    candidates.map(async (relativePath) => [relativePath, await fingerprint(repositoryRoot, relativePath)]),
  );
  return Object.fromEntries(entries);
}

function explicitToolCandidates(context) {
  const values = [];
  let provided = false;
  const toolInput = context.toolInput ?? {};
  for (const key of ["file_path", "path", "files", "paths"]) {
    if (!Object.hasOwn(toolInput, key)) continue;
    provided = true;
    const value = toolInput[key];
    if (Array.isArray(value)) values.push(...value);
    else values.push(value);
  }
  const excludedRoots = [context.cachePaths.cacheRoot];
  return {
    provided,
    paths: [...new Set(values.map((value) => normalizeRelativePath(context.repositoryRoot, value, excludedRoots)).filter(Boolean))].sort(),
  };
}

function defaultState(context) {
  return {
    schemaVersion: 2,
    manifestHash: context.manifestHash,
    runtime: context.runtime,
    sessionId: context.sessionId,
    repositoryHash: hashIdentifier(context.repositoryRoot),
    pending: {},
    baseline: {},
    changed: {},
  };
}

export async function readSessionState(context) {
  const repositoryRoot = await canonicalPath(context.repositoryRoot);
  const canonicalContext = { ...context, repositoryRoot };
  const file = resolveSessionStatePath(
    context.cachePaths,
    repositoryRoot,
    context.runtime,
    context.sessionId,
  );
  const state = await readJsonOr(file, defaultState(canonicalContext));
  if (
    state.schemaVersion !== 2 ||
    state.manifestHash !== context.manifestHash ||
    state.runtime !== context.runtime ||
    state.sessionId !== context.sessionId ||
    state.repositoryHash !== hashIdentifier(repositoryRoot)
  ) {
    return { file, state: defaultState(canonicalContext) };
  }
  return { file, state };
}

export async function recordPreToolState(context, options = {}) {
  const { file, state } = await readSessionState(context);
  const explicit = explicitToolCandidates(context);
  state.pending[context.toolUseId] = {
    mode: explicit.provided ? "explicit" : "working-tree",
    candidates: explicit.paths,
    fingerprints: explicit.provided
      ? await collectCandidateFingerprints(context.repositoryRoot, explicit.paths)
      : await collectWorkingTreeFingerprints(context.repositoryRoot, {
          ...options,
          excludedRoots: [context.cachePaths.cacheRoot],
        }),
  };
  await writeJsonAtomic(file, state);
  return { status: "pass", message: "Pre-change state recorded." };
}

export async function recordPostToolState(context, options = {}) {
  const { file, state } = await readSessionState(context);
  const pending = state.pending[context.toolUseId];
  if (!pending) {
    state.attributionDegraded = true;
    await writeJsonAtomic(file, state);
    return {
      status: "degraded",
      message: "Frontend Accelerator guardrail DEGRADED: no matching PreToolUse state was found.",
    };
  }
  const before = pending.fingerprints;
  const after =
    pending.mode === "explicit"
      ? await collectCandidateFingerprints(context.repositoryRoot, pending.candidates)
      : await collectWorkingTreeFingerprints(context.repositoryRoot, {
          ...options,
          excludedRoots: [context.cachePaths.cacheRoot],
        });
  for (const relativePath of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const beforeValue = before[relativePath] ?? "clean";
    const afterValue = after[relativePath] ?? "clean";
    if (beforeValue === afterValue) continue;
    state.baseline[relativePath] ??= beforeValue;
    if (state.baseline[relativePath] === afterValue) {
      delete state.changed[relativePath];
      delete state.baseline[relativePath];
    } else {
      state.changed[relativePath] = afterValue;
    }
  }
  delete state.pending[context.toolUseId];
  await writeJsonAtomic(file, state);
  return { status: "pass", message: "Changed files recorded." };
}

export async function writeActivationProof(context) {
  const repositoryRoot = await canonicalPath(context.repositoryRoot);
  const file = resolveActivationProofPath(context.cachePaths, repositoryRoot, context.runtime);
  const proof = {
    schemaVersion: 2,
    manifestHash: context.manifestHash,
    registrationId: context.registrationId,
    registrationDigest: context.registrationDigest,
    runtime: context.runtime,
    repositoryHash: hashIdentifier(repositoryRoot),
    activatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(file, proof);
  return { file, proof };
}
