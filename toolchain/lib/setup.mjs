import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  inspectInstalledCapability,
  resolvePackageEntrypoint,
} from "./capability.mjs";
import { isResolvedPathInside, resolveCachePaths, resolveCapabilityPaths } from "./cache.mjs";
import { assertSupportedNodeVersion, loadManifest } from "./manifest.mjs";
import { formatProcessFailure, platformExecutable, runProcess } from "./process.mjs";
import { assertGitRoot } from "./repository.mjs";

function assertInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  if (relative === "" || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`Refusing cache mutation outside the selected cache directory: ${candidate}`);
  }
}

async function readLockRecord(stagingRoot, capability) {
  const lock = JSON.parse(await readFile(path.join(stagingRoot, "package-lock.json"), "utf8"));
  return lock.packages?.[`node_modules/${capability.package}`];
}

function portableRelative(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function browserExecutableNames(platform) {
  if (platform === "win32") return new Set(["chrome.exe"]);
  if (platform === "darwin") return new Set(["Google Chrome for Testing"]);
  return new Set(["chrome"]);
}

async function findNamedFile(directory, names) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isFile() && names.has(entry.name)) return candidate;
    if (entry.isDirectory()) {
      const nested = await findNamedFile(candidate, names);
      if (nested) return nested;
    }
  }
  return undefined;
}

async function listBrowserVersionNames(browserInstallRoot) {
  try {
    return new Set(
      (await readdir(browserInstallRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("chrome-"))
        .map((entry) => entry.name),
    );
  } catch (error) {
    if (error.code === "ENOENT") return new Set();
    throw error;
  }
}

async function findInstalledBrowser(browserInstallRoot, platform) {
  const versionNames = [...(await listBrowserVersionNames(browserInstallRoot))].sort().reverse();
  for (const versionName of versionNames) {
    const versionDirectory = path.join(browserInstallRoot, versionName);
    const executable = await findNamedFile(versionDirectory, browserExecutableNames(platform));
    if (executable && (await lstat(executable)).isFile()) return { executable, versionDirectory, versionName };
  }
  throw new Error(`agent-browser install did not produce a Chrome artifact under ${browserInstallRoot}`);
}

async function promoteCapability(staging, destination, cacheRoot) {
  assertInside(cacheRoot, staging);
  assertInside(cacheRoot, destination);
  const backup = `${destination}.previous-${randomUUID()}`;
  let hadPrevious = false;
  try {
    await rename(destination, backup);
    hadPrevious = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await rename(staging, destination);
  } catch (error) {
    if (hadPrevious) {
      try {
        await rename(backup, destination);
      } catch (rollbackError) {
        error.rollbackError = rollbackError;
      }
    }
    throw error;
  }
  if (hadPrevious) {
    try {
      await rm(backup, { force: true, recursive: true });
    } catch {
      // The promoted capability is valid; an orphaned reconstructible backup is
      // safer than attempting to roll back a successful atomic replacement.
    }
  }
}

async function provisionCapability(options) {
  const { cachePaths, capability, loaded, runner, targetRoot } = options;
  await mkdir(cachePaths.stagingRoot, { recursive: true });
  const staging = await mkdtemp(path.join(cachePaths.stagingRoot, `${capability.name}-`));
  const finalPaths = resolveCapabilityPaths(cachePaths, capability, options);
  let externalArtifactToRemove;
  try {
    await writeFile(
      path.join(staging, "package.json"),
      `${JSON.stringify({ private: true, dependencies: { [capability.package]: capability.version } }, null, 2)}\n`,
      "utf8",
    );
    const npm = platformExecutable("npm", options.platform);
    const installArgs = ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--save-exact"];
    const installResult = await runProcess(npm, installArgs, {
      cwd: staging,
      env: options.env,
      runner,
    });
    if (installResult.code !== 0) throw new Error(formatProcessFailure(npm, installArgs, installResult));

    const lockRecord = await readLockRecord(staging, capability);
    if (!lockRecord || lockRecord.version !== capability.version) {
      throw new Error(`${capability.package}: package-lock did not resolve ${capability.version}`);
    }
    if (lockRecord.integrity !== capability.integrity) {
      throw new Error(`${capability.package}: integrity does not match the Runtime Toolchain Manifest`);
    }

    const platform = options.platform ?? process.platform;
    const stagingPaths = {
      ...resolveCapabilityPaths(
        { ...cachePaths, capabilitiesRoot: path.dirname(staging) },
        { ...capability, name: path.basename(staging) },
        options,
      ),
      root: staging,
      packageJson: path.join(staging, "node_modules", capability.package, "package.json"),
      executable: path.join(
        staging,
        "node_modules",
        ".bin",
        platform === "win32" ? `${capability.binary}.cmd` : capability.binary,
      ),
      receipt: path.join(staging, "accelerator-receipt.json"),
      browserArtifactsRoot: path.join(staging, "browser-artifacts"),
    };
    const installedPackage = JSON.parse(await readFile(stagingPaths.packageJson, "utf8"));
    const entrypoint = resolvePackageEntrypoint(stagingPaths, capability, installedPackage);
    let browserExecutable;
    if (capability.setup) {
      const browserInstallRoot =
        options.browserInstallRoot ?? path.join(options.homedir ?? os.homedir(), ".agent-browser", "browsers");
      const versionsBefore = await listBrowserVersionNames(browserInstallRoot);
      const setupResult = await runProcess(process.execPath, [entrypoint, ...capability.setup], {
        cwd: targetRoot,
        env: options.env,
        runner,
      });
      if (setupResult.code !== 0) {
        throw new Error(formatProcessFailure(capability.binary, capability.setup, setupResult));
      }
      const installedBrowser = await findInstalledBrowser(browserInstallRoot, platform);
      const artifactDestination = path.join(stagingPaths.browserArtifactsRoot, installedBrowser.versionName);
      await mkdir(stagingPaths.browserArtifactsRoot, { recursive: true });
      await cp(installedBrowser.versionDirectory, artifactDestination, { recursive: true });
      browserExecutable = path.join(
        artifactDestination,
        path.relative(installedBrowser.versionDirectory, installedBrowser.executable),
      );
      if (!versionsBefore.has(installedBrowser.versionName)) {
        externalArtifactToRemove = installedBrowser.versionDirectory;
      }
    }

    const receipt = {
      schemaVersion: 1,
      manifestHash: loaded.hash,
      capability: capability.name,
      package: capability.package,
      version: capability.version,
      integrity: capability.integrity,
      binaryPath: portableRelative(staging, entrypoint),
      ...(browserExecutable
        ? { browserExecutablePath: portableRelative(staging, browserExecutable) }
        : {}),
      platform: options.platform ?? process.platform,
      arch: options.arch ?? process.arch,
      completedAt: new Date().toISOString(),
    };
    await writeFile(stagingPaths.receipt, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    await promoteCapability(staging, finalPaths.root, cachePaths.cacheRoot);
    if (externalArtifactToRemove) {
      try {
        await rm(externalArtifactToRemove, { force: true, recursive: true });
      } catch {
        // The managed copy is complete. Leave the reconstructible upstream
        // download in place when cleanup is denied or interrupted.
      }
    }
    return { capability: capability.name, status: "installed", paths: finalPaths };
  } catch (error) {
    await rm(staging, { force: true, recursive: true });
    throw error;
  }
}

export async function buildSetupPlan(options) {
  const targetRoot = await assertGitRoot(options.targetRoot);
  assertSupportedNodeVersion(options.nodeVersion);
  const loaded = await loadManifest(targetRoot);
  const cachePaths = resolveCachePaths({
    manifestHash: loaded.hash,
    cacheRoot: options.cacheRoot,
    env: options.env,
    platform: options.platform,
    arch: options.arch,
    homedir: options.homedir,
  });
  if (await isResolvedPathInside(targetRoot, cachePaths.cacheRoot)) {
    throw new Error(`Runtime Toolchain Cache must be outside the target repository: ${cachePaths.cacheRoot}`);
  }
  const capabilities = [];
  for (const [name, definition] of Object.entries(loaded.manifest.capabilities)) {
    const capability = { name, ...definition };
    const installed = await inspectInstalledCapability({
      cachePaths,
      capability,
      manifestHash: loaded.hash,
      platform: options.platform,
    });
    capabilities.push({
      ...capability,
      action: installed.healthy ? "reuse" : "install",
      reason: installed.healthy ? undefined : installed.reason,
      destination: installed.paths.root,
    });
  }
  return { cachePaths, capabilities, loaded, targetRoot };
}

export async function setupToolchain(options) {
  const plan = await buildSetupPlan(options);
  if (!(await options.confirm(plan))) return { ...plan, outcomes: [], status: "declined" };

  const outcomes = [];
  for (const item of plan.capabilities) {
    if (item.action === "reuse") {
      outcomes.push({ capability: item.name, status: "reused" });
      continue;
    }
    try {
      outcomes.push(
        await provisionCapability({
          ...options,
          cachePaths: plan.cachePaths,
          capability: item,
          loaded: plan.loaded,
          targetRoot: plan.targetRoot,
        }),
      );
    } catch (error) {
      outcomes.push({ capability: item.name, status: "failed", error: error.message });
      if (item.required) return { ...plan, outcomes, status: "blocked" };
    }
  }
  const degraded = outcomes.some((outcome) => outcome.status === "failed");
  return { ...plan, outcomes, status: degraded ? "degraded" : "ready" };
}
