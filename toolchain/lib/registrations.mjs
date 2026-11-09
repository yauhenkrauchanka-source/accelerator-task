import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonicalJson } from "./manifest.mjs";

const EVENTS = ["SessionStart", "PreToolUse", "PostToolUse", "Stop"];
const LEGACY_CODEX_REGISTRATION_ID = "frontend-accelerator.changed-file-lint-gate.v1";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function containsRegistrationId(value, registrationId) {
  return JSON.stringify(value).includes(registrationId);
}

function equalSemantic(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function legacyCodexWindowsCommand(event, registrationId) {
  return `powershell.exe -NoProfile -Command "$r=(git rev-parse --show-toplevel).Trim(); & node (Join-Path $r 'toolchain/hooks/runtime-hook.mjs') codex ${event} --registration ${registrationId}"`;
}

function isLegacyCodexWindowsLauncher(group, desired, registration, event) {
  if (
    registration.runtime !== "codex" ||
    registration.registrationId !== LEGACY_CODEX_REGISTRATION_ID
  ) {
    return false;
  }

  const legacy = structuredClone(desired);
  const handlers = legacy.hooks;
  if (!Array.isArray(handlers) || handlers.length !== 1 || !isRecord(handlers[0])) return false;
  handlers[0].commandWindows = legacyCodexWindowsCommand(event, registration.registrationId);
  return equalSemantic(group, legacy);
}

export function validateRegistration(value, file = "registration") {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error(`${file}: unsupported registration schema`);
  }
  if (!new Set(["claude", "codex"]).has(value.runtime)) {
    throw new Error(`${file}: unsupported runtime`);
  }
  const expectedTarget = value.runtime === "claude" ? ".claude/settings.json" : ".codex/hooks.json";
  if (value.target !== expectedTarget) throw new Error(`${file}: unexpected target ${value.target}`);
  if (typeof value.registrationId !== "string" || !value.registrationId) {
    throw new Error(`${file}: missing registrationId`);
  }
  if (!isRecord(value.hooks)) throw new Error(`${file}: hooks must be an object`);
  for (const event of EVENTS) {
    if (!Array.isArray(value.hooks[event]) || value.hooks[event].length !== 1) {
      throw new Error(`${file}: ${event} must contain exactly one matcher group`);
    }
    if (!containsRegistrationId(value.hooks[event][0], value.registrationId)) {
      throw new Error(`${file}: ${event} does not carry the registration identifier`);
    }
  }
  return value;
}

export async function loadRegistration(sourceRoot, runtime) {
  const file = path.join(sourceRoot, "toolchain", "registrations", `${runtime}-hooks.json`);
  let value;
  try {
    value = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`Invalid hook registration: ${file}`, { cause: error });
  }
  return validateRegistration(value, file);
}

export function registrationDigest(registration) {
  return createHash("sha256").update(canonicalJson(registration.hooks)).digest("hex");
}

export function mergeRegistrationDocument(current, registration) {
  if (!isRecord(current)) throw new Error("hook configuration must be a JSON object");
  if (current.hooks !== undefined && !isRecord(current.hooks)) {
    throw new Error("hook configuration .hooks must be an object");
  }
  const next = structuredClone(current);
  next.hooks ??= {};
  let changed = false;
  const addedEvents = [];
  const updatedEvents = [];

  for (const event of EVENTS) {
    const existing = next.hooks[event] ?? [];
    if (!Array.isArray(existing)) throw new Error(`hook configuration .hooks.${event} must be an array`);
    const owned = existing.filter((group) => containsRegistrationId(group, registration.registrationId));
    const desired = registration.hooks[event][0];
    if (owned.length > 1) throw new Error(`${event}: duplicate accelerator registrations`);
    if (owned.length === 1 && !equalSemantic(owned[0], desired)) {
      if (!isLegacyCodexWindowsLauncher(owned[0], desired, registration, event)) {
        throw new Error(`${event}: accelerator registration has conflicting semantics`);
      }
      existing[existing.indexOf(owned[0])] = structuredClone(desired);
      changed = true;
      updatedEvents.push(event);
    }
    if (owned.length === 0) {
      existing.push(structuredClone(desired));
      changed = true;
      addedEvents.push(event);
    }
    next.hooks[event] = existing;
  }

  return { changed, document: next, semanticDiff: { addedEvents, updatedEvents } };
}

export async function inspectRegistrationFile(targetRoot, registration) {
  const target = path.join(targetRoot, ...registration.target.split("/"));
  let raw;
  try {
    raw = await readFile(target, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      const merged = mergeRegistrationDocument({}, registration);
      return { ...merged, operation: "create", target, targetRelative: registration.target };
    }
    throw error;
  }
  let current;
  try {
    current = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${registration.target}: invalid JSON`, { cause: error });
  }
  const merged = mergeRegistrationDocument(current, registration);
  return {
    ...merged,
    operation: merged.changed ? "merge" : "unchanged",
    target,
    targetRelative: registration.target,
  };
}

export function serializeRegistrationDocument(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}
