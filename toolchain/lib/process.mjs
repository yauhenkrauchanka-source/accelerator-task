import { spawn } from "node:child_process";

export function platformExecutable(name, platform = process.platform) {
  if (platform === "win32" && !/\.(?:cmd|exe|bat)$/i.test(name)) return `${name}.cmd`;
  return name;
}

export function defaultProcessRunner(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const isWindowsBatch = process.platform === "win32" && /\.(?:cmd|bat)$/i.test(command);
    const executable = isWindowsBatch ? process.env.ComSpec || "cmd.exe" : command;
    const processArgs = isWindowsBatch ? ["/d", "/s", "/c", command, ...args] : args;
    const child = spawn(executable, processArgs, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio: options.stdio ?? "pipe",
      windowsHide: true,
    });
    const stdout = [];
    const stderr = [];
    if (child.stdout) child.stdout.on("data", (chunk) => stdout.push(chunk));
    if (child.stderr) child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      resolve({
        code: code ?? 1,
        signal,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

export async function runProcess(command, args = [], options = {}) {
  const runner = options.runner ?? defaultProcessRunner;
  return runner(command, [...args], {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: options.stdio ?? "pipe",
  });
}

export function formatProcessFailure(command, args, result) {
  const details = (result.stderr || result.stdout || "no process output").trim();
  return `${command} ${args.join(" ")} exited with ${result.code}${details ? `: ${details}` : ""}`;
}
