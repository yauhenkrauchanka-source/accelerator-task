import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const TOP_LEVEL_KEYS = new Set(["schemaVersion", "toolchainVersion", "node", "capabilities"]);
const CAPABILITY_KEYS = new Set(["required", "package", "version", "integrity", "binary", "setup"]);
const INTEGRITY_PATTERN = /^sha512-[A-Za-z0-9+/]+={0,2}$/;
const PACKAGE_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const BINARY_PATTERN = /^[A-Za-z0-9._-]+$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertKnownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}: unknown field ${key}`);
  }
}

function assertNoDuplicateJsonFields(raw) {
  let index = 0;

  function skipWhitespace() {
    while (/\s/.test(raw[index] ?? "")) index += 1;
  }

  function parseString() {
    const start = index;
    index += 1;
    while (index < raw.length) {
      if (raw[index] === "\\") {
        index += 2;
        continue;
      }
      if (raw[index] === '"') {
        index += 1;
        return JSON.parse(raw.slice(start, index));
      }
      index += 1;
    }
  }

  function parseValue(pathParts) {
    skipWhitespace();
    if (raw[index] === "{") {
      parseObject(pathParts);
      return;
    }
    if (raw[index] === "[") {
      index += 1;
      skipWhitespace();
      if (raw[index] === "]") {
        index += 1;
        return;
      }
      while (index < raw.length) {
        parseValue(pathParts);
        skipWhitespace();
        if (raw[index] === "]") {
          index += 1;
          return;
        }
        index += 1;
      }
      return;
    }
    if (raw[index] === '"') {
      parseString();
      return;
    }
    while (index < raw.length && !/[\s,\]}]/.test(raw[index])) index += 1;
  }

  function parseObject(pathParts) {
    index += 1;
    const fields = new Set();
    skipWhitespace();
    if (raw[index] === "}") {
      index += 1;
      return;
    }
    while (index < raw.length) {
      skipWhitespace();
      const field = parseString();
      const qualified = [...pathParts, field].join(".");
      if (fields.has(field)) throw new Error(`Duplicate Runtime Toolchain Manifest field: ${qualified}`);
      fields.add(field);
      skipWhitespace();
      index += 1;
      parseValue([...pathParts, field]);
      skipWhitespace();
      if (raw[index] === "}") {
        index += 1;
        return;
      }
      index += 1;
    }
  }

  parseValue([]);
}

function validateCapability(name, value) {
  if (!isRecord(value)) throw new Error(`capabilities.${name}: expected an object`);
  assertKnownKeys(value, CAPABILITY_KEYS, `capabilities.${name}`);
  if (typeof value.required !== "boolean") {
    throw new Error(`capabilities.${name}.required: expected a boolean`);
  }
  if (typeof value.package !== "string" || !PACKAGE_PATTERN.test(value.package)) {
    throw new Error(`capabilities.${name}.package: expected an npm package name`);
  }
  if (typeof value.version !== "string" || !VERSION_PATTERN.test(value.version)) {
    throw new Error(`capabilities.${name}.version: expected an exact semantic version`);
  }
  const encodedIntegrity =
    typeof value.integrity === "string" && INTEGRITY_PATTERN.test(value.integrity)
      ? value.integrity.slice("sha512-".length)
      : "";
  const integrityBytes = Buffer.from(encodedIntegrity, "base64");
  if (
    !encodedIntegrity ||
    integrityBytes.length !== 64 ||
    integrityBytes.toString("base64") !== encodedIntegrity
  ) {
    throw new Error(`capabilities.${name}.integrity: expected a sha512 integrity value`);
  }
  if (typeof value.binary !== "string" || !BINARY_PATTERN.test(value.binary)) {
    throw new Error(`capabilities.${name}.binary: expected a bare executable name`);
  }
  if (value.setup !== undefined) {
    if (!Array.isArray(value.setup) || value.setup.some((item) => typeof item !== "string" || !item)) {
      throw new Error(`capabilities.${name}.setup: expected non-empty string arguments`);
    }
  }
  return {
    required: value.required,
    package: value.package,
    version: value.version,
    integrity: value.integrity,
    binary: value.binary,
    ...(value.setup === undefined ? {} : { setup: [...value.setup] }),
  };
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function manifestHash(manifest) {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}

export function validateManifest(value) {
  if (!isRecord(value)) throw new Error("Runtime Toolchain Manifest must be a JSON object");
  assertKnownKeys(value, TOP_LEVEL_KEYS, "manifest");
  if (value.schemaVersion !== 1) throw new Error(`Unsupported manifest schema: ${value.schemaVersion}`);
  if (value.toolchainVersion !== 1) {
    throw new Error(`Unsupported toolchain version: ${value.toolchainVersion}`);
  }
  if (value.node !== ">=24") throw new Error(`Unsupported accelerator Node.js range: ${value.node}`);
  if (!isRecord(value.capabilities)) throw new Error("manifest.capabilities: expected an object");

  const names = Object.keys(value.capabilities);
  if (!names.includes("browser")) throw new Error("manifest.capabilities.browser is required");
  if (!names.includes("docs")) throw new Error("manifest.capabilities.docs is required");
  for (const name of names) {
    if (!new Set(["browser", "docs"]).has(name)) {
      throw new Error(`Unsupported Runtime Toolchain capability: ${name}`);
    }
  }

  const capabilities = Object.fromEntries(
    names.sort().map((name) => [name, validateCapability(name, value.capabilities[name])]),
  );
  if (!capabilities.browser.required || capabilities.browser.package !== "agent-browser") {
    throw new Error("The required browser capability must use agent-browser");
  }
  if (capabilities.docs.required || capabilities.docs.package !== "ctx7") {
    throw new Error("The docs capability must be recommended and use ctx7");
  }

  return {
    schemaVersion: 1,
    toolchainVersion: 1,
    node: ">=24",
    capabilities,
  };
}

export async function loadManifest(targetRoot, options = {}) {
  const read = options.readFile ?? readFile;
  const manifestPath = path.join(path.resolve(targetRoot), "toolchain", "manifest.json");
  let raw;
  try {
    raw = await read(manifestPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Runtime Toolchain Manifest not found: ${manifestPath}`, { cause: error });
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid Runtime Toolchain Manifest JSON: ${manifestPath}`, { cause: error });
  }
  assertNoDuplicateJsonFields(raw);
  const manifest = validateManifest(parsed);
  return { hash: manifestHash(manifest), manifest, path: manifestPath };
}

export function isSupportedNodeVersion(version = process.versions.node) {
  const major = Number.parseInt(String(version).split(".", 1)[0], 10);
  return Number.isInteger(major) && major >= 24;
}

export function assertSupportedNodeVersion(version = process.versions.node) {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(`Frontend Accelerator requires Node.js 24 or newer; current version is ${version}`);
  }
}
