import { access, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { isResolvedPathInside, resolveCachePaths, resolveCapabilityPaths } from "./cache.mjs";
import { loadManifest } from "./manifest.mjs";
import { runProcess } from "./process.mjs";

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export function resolvePackageEntrypoint(paths, capability, packageJson) {
  const declared =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[capability.binary];
  if (typeof declared !== "string" || !declared) {
    throw new Error(`${capability.package}: package does not declare the ${capability.binary} binary`);
  }
  const packageRoot = path.dirname(paths.packageJson);
  const entrypoint = path.resolve(packageRoot, declared);
  const relative = path.relative(packageRoot, entrypoint);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${capability.package}: binary entrypoint escapes the installed package`);
  }
  return entrypoint;
}

function resolveReceiptPath(root, relativeValue, label) {
  if (typeof relativeValue !== "string" || !relativeValue) {
    throw new Error(`${label}: receipt path is missing`);
  }
  const resolved = path.resolve(root, ...relativeValue.split("/"));
  const relative = path.relative(root, resolved);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label}: receipt path escapes the capability directory`);
  }
  return resolved;
}

export async function inspectInstalledCapability(options) {
  const { cachePaths, capability, manifestHash } = options;
  const paths = resolveCapabilityPaths(cachePaths, capability, options);
  try {
    const [receipt, packageJson] = await Promise.all([readJson(paths.receipt), readJson(paths.packageJson)]);
    const entrypoint = resolvePackageEntrypoint(paths, capability, packageJson);
    const receiptEntrypoint = resolveReceiptPath(paths.root, receipt.binaryPath, capability.package);
    const expectedPlatform = options.platform ?? process.platform;
    const expectedArch = options.arch ?? process.arch;
    if (
      receipt.schemaVersion !== 1 ||
      receipt.manifestHash !== manifestHash ||
      receipt.capability !== capability.name ||
      receipt.package !== capability.package ||
      receipt.version !== capability.version ||
      receipt.integrity !== capability.integrity ||
      receipt.platform !== expectedPlatform ||
      receipt.arch !== expectedArch ||
      packageJson.name !== capability.package ||
      packageJson.version !== capability.version ||
      path.relative(entrypoint, receiptEntrypoint) !== ""
    ) {
      return { healthy: false, paths, reason: "receipt or installed package does not match the manifest" };
    }
    await access(entrypoint);
    let browserExecutable;
    if (capability.name === "browser") {
      browserExecutable = resolveReceiptPath(paths.root, receipt.browserExecutablePath, capability.package);
      const resolvedBrowserExecutable = await realpath(browserExecutable);
      if (!(await isResolvedPathInside(paths.browserArtifactsRoot, resolvedBrowserExecutable))) {
        return { healthy: false, paths, reason: "browser artifact escapes the managed capability cache" };
      }
      await access(resolvedBrowserExecutable);
      browserExecutable = resolvedBrowserExecutable;
    }
    return {
      healthy: true,
      packageJson,
      paths: { ...paths, entrypoint, ...(browserExecutable ? { browserExecutable } : {}) },
      receipt,
    };
  } catch (error) {
    return {
      healthy: false,
      paths,
      reason: error.code === "ENOENT" ? "capability is not installed" : error.message,
    };
  }
}

export function capabilityEnvironment(capability, paths, env = process.env) {
  if (capability.name !== "browser") return { ...env };
  return {
    ...env,
    AGENT_BROWSER_EXECUTABLE_PATH: paths.browserExecutable,
  };
}

export async function executeManagedCapability(options) {
  const targetRoot = path.resolve(options.targetRoot);
  const loaded = await loadManifest(targetRoot);
  const capability = {
    name: options.name,
    ...loaded.manifest.capabilities[options.name],
  };
  if (!capability.package) throw new Error(`Unknown Runtime Toolchain capability: ${options.name}`);
  const cachePaths = resolveCachePaths({
    manifestHash: loaded.hash,
    cacheRoot: options.cacheRoot,
    env: options.env,
    platform: options.platform,
    arch: options.arch,
    homedir: options.homedir,
  });
  const installed = await inspectInstalledCapability({
    cachePaths,
    capability,
    manifestHash: loaded.hash,
    platform: options.platform,
  });
  if (!installed.healthy) {
    throw new Error(
      `${capability.name} capability is not ready: ${installed.reason}. Run frontend-accelerator setup from the Git root.`,
    );
  }

  const env = capabilityEnvironment(capability, installed.paths, options.env);
  if (capability.name === "browser" && !options.args.includes("--session") && !env.AGENT_BROWSER_SESSION) {
    const sessionSource =
      env.FRONTEND_ACCELERATOR_SESSION || env.CLAUDE_SESSION_ID || env.CODEX_THREAD_ID || targetRoot;
    env.AGENT_BROWSER_SESSION = `frontend-accelerator-${Buffer.from(sessionSource)
      .toString("base64url")
      .slice(0, 24)}`;
  }
  const result = await runProcess(process.execPath, [installed.paths.entrypoint, ...options.args], {
    cwd: targetRoot,
    env,
    runner: options.runner,
    stdio: options.stdio ?? "inherit",
  });
  return result;
}
