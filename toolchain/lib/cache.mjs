import { createHash } from "node:crypto";
import { realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function hashIdentifier(value) {
  return createHash("sha256").update(path.resolve(value)).digest("hex");
}

export function isPathInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function canonicalPath(value) {
  let current = path.resolve(value);
  const missingSegments = [];
  while (true) {
    try {
      const resolved = await realpath(current);
      return path.join(resolved, ...missingSegments.reverse());
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      missingSegments.push(path.basename(current));
      current = parent;
    }
  }
}

export async function isResolvedPathInside(parent, candidate) {
  const [resolvedParent, resolvedCandidate] = await Promise.all([
    canonicalPath(parent),
    canonicalPath(candidate),
  ]);
  return isPathInside(resolvedParent, resolvedCandidate);
}

export function resolveCacheRoot(options = {}) {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const homeDirectory = options.homedir ?? os.homedir();
  if (env.FRONTEND_ACCELERATOR_CACHE_DIR) {
    return path.resolve(env.FRONTEND_ACCELERATOR_CACHE_DIR);
  }
  if (platform === "win32") {
    const localAppData = env.LOCALAPPDATA || path.join(homeDirectory, "AppData", "Local");
    return path.join(localAppData, "frontend-accelerator");
  }
  if (platform === "darwin") {
    return path.join(homeDirectory, "Library", "Caches", "frontend-accelerator");
  }
  return path.join(env.XDG_CACHE_HOME || path.join(homeDirectory, ".cache"), "frontend-accelerator");
}

export function resolveCachePaths(options) {
  const cacheRoot = options.cacheRoot ?? resolveCacheRoot(options);
  const platform = options.platform ?? process.platform;
  const arch = options.arch ?? process.arch;
  const entryRoot = path.join(cacheRoot, "v1", options.manifestHash, `${platform}-${arch}`);
  return {
    cacheRoot,
    entryRoot,
    capabilitiesRoot: path.join(entryRoot, "capabilities"),
    stagingRoot: path.join(entryRoot, ".staging"),
    activationRoot: path.join(cacheRoot, "activation"),
    sessionRoot: path.join(cacheRoot, "sessions", options.manifestHash),
  };
}

export function resolveCapabilityPaths(cachePaths, capability, options = {}) {
  const platform = options.platform ?? process.platform;
  const root = path.join(cachePaths.capabilitiesRoot, capability.name);
  const executableName = platform === "win32" ? `${capability.binary}.cmd` : capability.binary;
  return {
    root,
    packageJson: path.join(root, "node_modules", capability.package, "package.json"),
    executable: path.join(root, "node_modules", ".bin", executableName),
    receipt: path.join(root, "accelerator-receipt.json"),
    browserArtifactsRoot: path.join(root, "browser-artifacts"),
  };
}

export function resolveActivationProofPath(cachePaths, repositoryRoot, runtime) {
  return path.join(cachePaths.activationRoot, hashIdentifier(repositoryRoot), `${runtime}.json`);
}

export function resolveSessionStatePath(cachePaths, repositoryRoot, runtime, sessionId) {
  const repositoryHash = hashIdentifier(repositoryRoot);
  const sessionHash = createHash("sha256").update(String(sessionId)).digest("hex");
  return path.join(cachePaths.sessionRoot, repositoryHash, runtime, `${sessionHash}.json`);
}
