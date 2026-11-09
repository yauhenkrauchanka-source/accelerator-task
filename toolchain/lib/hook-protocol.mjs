function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseHookPayload(raw, options) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch (error) {
    throw new Error("Hook input must be one JSON object", { cause: error });
  }
  if (!isRecord(input)) throw new Error("Hook input must be a JSON object");
  if (!new Set(["claude", "codex"]).has(options.runtime)) {
    throw new Error(`Unsupported hook runtime: ${options.runtime}`);
  }
  if (input.hook_event_name !== options.event) {
    throw new Error(`Hook event mismatch: expected ${options.event}, received ${input.hook_event_name}`);
  }
  if (typeof input.session_id !== "string" || !input.session_id) {
    throw new Error("Hook input is missing session_id");
  }
  if (typeof input.cwd !== "string" || !input.cwd) throw new Error("Hook input is missing cwd");
  return {
    runtime: options.runtime,
    event: options.event,
    registrationId: options.registrationId,
    sessionId: input.session_id,
    cwd: input.cwd,
    turnId: typeof input.turn_id === "string" ? input.turn_id : undefined,
    toolUseId:
      typeof input.tool_use_id === "string"
        ? input.tool_use_id
        : `${input.turn_id ?? input.prompt_id ?? input.session_id}:${options.event}`,
    toolName: typeof input.tool_name === "string" ? input.tool_name : undefined,
    toolInput: isRecord(input.tool_input) ? input.tool_input : {},
    stopHookActive: input.stop_hook_active === true,
  };
}

export function formatHookOutput(event, result) {
  if (result.status === "fail" && result.block) {
    return { decision: "block", reason: result.message };
  }
  if (result.status === "degraded" || result.status === "fail") {
    return { systemMessage: result.message };
  }
  if (event === "Stop") return {};
  return null;
}
