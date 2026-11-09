import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { executeManagedCapability } from "./capability.mjs";

const GLOBAL_BOOL_FLAGS = new Set([
  "--json",
  "--headed",
  "--webgpu",
  "--debug",
  "--ignore-https-errors",
  "--allow-file-access",
  "--hide-scrollbars",
  "--auto-connect",
  "--annotate",
  "--content-boundaries",
  "--confirm-interactive",
  "--no-auto-dialog",
  "-v",
  "--verbose",
  "-q",
  "--quiet",
  "--offline",
  "--quick",
  "--fix",
]);

const GLOBAL_FLAGS_WITH_VALUE = new Set([
  "--session",
  "--restore-save",
  "--restore-check-url",
  "--restore-check-text",
  "--restore-check-fn",
  "--namespace",
  "--headers",
  "--executable-path",
  "--cdp",
  "--extension",
  "--init-script",
  "--enable",
  "--profile",
  "--state",
  "--proxy",
  "--proxy-bypass",
  "--args",
  "--user-agent",
  "-p",
  "--provider",
  "--device",
  "--session-name",
  "--color-scheme",
  "--download-path",
  "--max-output",
  "--allowed-domains",
  "--action-policy",
  "--confirm-actions",
  "--config",
  "--engine",
  "--screenshot-dir",
  "--screenshot-quality",
  "--screenshot-format",
  "--idle-timeout",
  "--model",
]);

function flagValue(args, name) {
  let value;
  for (let index = 0; index < args.length - 1; index += 1) {
    if (args[index] === name) value = args[index + 1];
  }
  return value;
}

export function cleanBrowserArgs(args) {
  const clean = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--restore=")) continue;
    if (GLOBAL_FLAGS_WITH_VALUE.has(arg)) {
      index += 1;
      continue;
    }
    if (arg === "--restore") {
      const next = args[index + 1];
      if (next && !next.startsWith("-") && !["fill", "keydown", "keyup"].includes(next)) index += 1;
      continue;
    }
    if (GLOBAL_BOOL_FLAGS.has(arg)) {
      if (["true", "false"].includes(args[index + 1])) index += 1;
      continue;
    }
    clean.push(arg);
  }
  return clean;
}

export function resolveBrowserSession(args, targetRoot, env = process.env) {
  const explicit = flagValue(args, "--session");
  if (explicit) return explicit;
  if (env.AGENT_BROWSER_SESSION) return env.AGENT_BROWSER_SESSION;
  const source =
    env.FRONTEND_ACCELERATOR_SESSION || env.CLAUDE_SESSION_ID || env.CODEX_THREAD_ID || targetRoot;
  return `frontend-accelerator-${Buffer.from(source).toString("base64url").slice(0, 24)}`;
}

function sanitizeSessionComponent(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/[-_]{2,}/g, (match) => match[0])
    .replace(/^[-_]+|[-_]+$/g, "");
}

function browserSocketDirectory(options) {
  const { args, env, homeDirectory, temporaryDirectory } = options;
  let base;
  if (env.AGENT_BROWSER_SOCKET_DIR) base = env.AGENT_BROWSER_SOCKET_DIR;
  else if (env.XDG_RUNTIME_DIR) base = path.join(env.XDG_RUNTIME_DIR, "agent-browser");
  else if (homeDirectory) base = path.join(homeDirectory, ".agent-browser");
  else base = path.join(temporaryDirectory, "agent-browser");

  const namespace = sanitizeSessionComponent(flagValue(args, "--namespace") || env.AGENT_BROWSER_NAMESPACE || "");
  return namespace ? path.join(base, "namespaces", namespace, "run") : base;
}

function readJsonLine(socket, command, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Timed out waiting for the browser daemon")), timeoutMs);

    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.end();
      if (error) reject(error);
      else resolve(value);
    }

    socket.setEncoding("utf8");
    socket.once("connect", () => socket.write(`${JSON.stringify(command)}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      try {
        finish(undefined, JSON.parse(buffer.slice(0, newline)));
      } catch (error) {
        finish(error);
      }
    });
    socket.once("error", (error) => finish(error));
    socket.once("close", () => finish(new Error("Browser daemon closed before replying")));
  });
}

export async function sendBrowserDaemonCommand(options) {
  const {
    args,
    command,
    env = process.env,
    homeDirectory = os.homedir(),
    platform = process.platform,
    session,
    temporaryDirectory = os.tmpdir(),
    timeoutMs = 30_000,
  } = options;
  const directory = browserSocketDirectory({ args, env, homeDirectory, temporaryDirectory });
  let socket;
  if (platform === "win32") {
    const port = Number(await readFile(path.join(directory, `${session}.port`), "utf8"));
    if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
      throw new Error(`Invalid browser daemon port for session ${session}`);
    }
    socket = net.createConnection({ host: "127.0.0.1", port });
  } else {
    socket = net.createConnection({ path: path.join(directory, `${session}.sock`) });
  }
  return readJsonLine(socket, command, timeoutMs);
}

export function temporalFillScript(selector, value) {
  return `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    const Input = element.ownerDocument.defaultView.HTMLInputElement;
    if (!(element instanceof Input) || !["date", "time", "datetime-local"].includes(element.type)) return false;
    const setter = Object.getOwnPropertyDescriptor(Input.prototype, "value")?.set;
    if (!setter) return false;
    element.focus();
    setter.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    return true;
  })()`;
}

export function keyboardDaemonCommand(eventCommand, key) {
  const lower = key.toLowerCase();
  const normalized =
    lower === "enter" || lower === "return"
      ? { key: "Enter", code: "Enter", text: "\r" }
      : lower === "space" || key === " "
        ? { key: " ", code: "Space", text: " " }
        : undefined;
  if (!normalized || !["keydown", "keyup"].includes(eventCommand)) return undefined;
  return {
    id: randomUUID(),
    action: "input_keyboard",
    type: eventCommand === "keydown" ? "keyDown" : "keyUp",
    key: normalized.key,
    code: normalized.code,
    ...(eventCommand === "keydown" ? { text: normalized.text } : {}),
  };
}

function syntheticResult(response, data) {
  return {
    success: true,
    data: {
      ...data,
      ...(response.data?.lifecycle ? { lifecycle: response.data.lifecycle } : {}),
    },
    error: null,
  };
}

function emitSuccess(args, response, data, stdout) {
  const output = args.includes("--json") ? JSON.stringify(syntheticResult(response, data)) : "✓ Done";
  stdout.write(`${output}\n`);
  return { code: 0, signal: null, stdout: `${output}\n`, stderr: "" };
}

function emitFailure(args, response, stdout, stderr) {
  if (args.includes("--json")) {
    const output = `${JSON.stringify(response)}\n`;
    stdout.write(output);
    return { code: 1, signal: null, stdout: output, stderr: "" };
  }
  const message = typeof response.error === "string" ? response.error : JSON.stringify(response.error);
  const output = `✗ ${message}\n`;
  stderr.write(output);
  return { code: 1, signal: null, stdout: "", stderr: output };
}

export async function executeBrowserAdapter(options) {
  const {
    args,
    env = process.env,
    execute = executeManagedCapability,
    sendDaemon = sendBrowserDaemonCommand,
    stderr = process.stderr,
    stdout = process.stdout,
    targetRoot,
  } = options;
  const [command, ...commandArgs] = cleanBrowserArgs(args);
  const session = resolveBrowserSession(args, targetRoot, env);

  if (command === "fill" && commandArgs.length >= 2 && !commandArgs[0].startsWith("@")) {
    const selector = commandArgs[0];
    const value = commandArgs.slice(1).join(" ");
    try {
      const response = await sendDaemon({
        args,
        env,
        session,
        command: {
          id: randomUUID(),
          action: "evaluate",
          script: temporalFillScript(selector, value),
        },
      });
      if (response.success && response.data?.result === true) {
        return emitSuccess(args, response, { filled: selector }, stdout);
      }
    } catch {
      // The normal managed command supplies canonical startup and selector errors.
    }
  }

  const keyboardCommand =
    commandArgs.length === 1 ? keyboardDaemonCommand(command, commandArgs[0]) : undefined;
  if (keyboardCommand) {
    try {
      const response = await sendDaemon({ args, env, session, command: keyboardCommand });
      if (response.success) {
        return emitSuccess(args, response, { [command]: commandArgs[0] }, stdout);
      }
      return emitFailure(args, response, stdout, stderr);
    } catch {
      // Fall through so the managed CLI reports a missing or unavailable session.
    }
  }

  return execute({ targetRoot, name: "browser", args, stdio: "inherit" });
}
