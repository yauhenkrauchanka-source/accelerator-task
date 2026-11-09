import { execFile as execFileCallback } from "node:child_process";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

function comparablePath(value, platform = process.platform) {
  const resolved = path.resolve(value);
  return platform === "win32" ? resolved.toLowerCase() : resolved;
}

export async function findGitRoot(cwd, options = {}) {
  const execute = options.execFile ?? execFile;
  let result;
  try {
    result = await execute("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      windowsHide: true,
    });
  } catch (error) {
    throw new Error(`Target must be inside a Git repository: ${path.resolve(cwd)}`, { cause: error });
  }
  return realpath(String(result.stdout).trim());
}

export async function assertGitRoot(cwd, options = {}) {
  const [actual, reported] = await Promise.all([realpath(cwd), findGitRoot(cwd, options)]);
  const platform = options.platform ?? process.platform;
  if (comparablePath(actual, platform) !== comparablePath(reported, platform)) {
    throw new Error(`Run the command from the Git root itself. Current directory: ${path.resolve(cwd)}`);
  }
  return reported;
}
