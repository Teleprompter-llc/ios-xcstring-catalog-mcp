export type XcstringsCommand = "init" | "add" | "remove" | "languages" | "strings";

export interface InitArgs {
  directoryPath: string;
}

export interface AddArgs {
  filePath: string;
  key: string;
  lang: string;
  value: string;
}

export interface RemoveArgs {
  filePath: string;
  key: string;
  lang?: string;
}

export interface StringsArgs {
  filePath: string;
  lang?: string;
  missingLanguages?: boolean;
}

export interface WorkerRequest {
  command: XcstringsCommand;
  args?: Record<string, unknown>;
}

export interface WorkerSuccess {
  type: "success";
  result: unknown;
}

export interface WorkerFailure {
  type: "error";
  error: {
    message: string;
    code?: number;
    stack?: string;
    details?: unknown;
  };
}

export type WorkerResponse = WorkerSuccess | WorkerFailure;

export interface ToolErrorPayload {
  tool: string;
  message: string;
  catalogPath?: string;
  details?: unknown;
}
