import type { ToolErrorPayload } from "./types.js";

export class ToolExecutionError extends Error {
  tool: string;
  catalogPath?: string;
  details?: unknown;

  constructor(payload: ToolErrorPayload) {
    super(payload.message);
    this.name = "ToolExecutionError";
    this.tool = payload.tool;
    this.catalogPath = payload.catalogPath;
    this.details = payload.details;
  }

  toPayload(): ToolErrorPayload {
    return {
      tool: this.tool,
      message: this.message,
      catalogPath: this.catalogPath,
      details: this.details
    };
  }
}
