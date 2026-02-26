import { fork } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ToolExecutionError } from "../errors.js";
import type { WorkerRequest, WorkerResponse } from "../types.js";

const EXECUTION_TIMEOUT_MS = 30_000;

interface WorkerEntry {
  scriptPath: string;
  execArgv?: string[];
}

function resolveWorkerEntry(): WorkerEntry {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const jsEntry = path.join(currentDir, "runCommandInWorker.js");

  if (fs.existsSync(jsEntry)) {
    return { scriptPath: jsEntry };
  }

  const tsEntry = path.join(currentDir, "runCommandInWorker.ts");
  if (fs.existsSync(tsEntry)) {
    return { scriptPath: tsEntry, execArgv: ["--import", "tsx"] };
  }

  throw new Error(`Unable to locate worker entrypoint. Checked: ${jsEntry}, ${tsEntry}`);
}

export async function runXcstringsCommand(
  toolName: string,
  request: WorkerRequest,
  catalogPath?: string
): Promise<unknown> {
  const workerEntry = resolveWorkerEntry();

  return new Promise<unknown>((resolve, reject) => {
    const child = fork(workerEntry.scriptPath, {
      execArgv: workerEntry.execArgv,
      stdio: ["ignore", "ignore", "ignore", "ipc"]
    });

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(
          new ToolExecutionError({
            tool: toolName,
            message: `Timed out while executing '${request.command}'.`,
            catalogPath
          })
        );
      }
    }, EXECUTION_TIMEOUT_MS);

    child.once("message", (message: WorkerResponse) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      child.kill();

      if (message.type === "success") {
        resolve(message.result);
        return;
      }

      reject(
        new ToolExecutionError({
          tool: toolName,
          message: message.error.message,
          catalogPath,
          details: message.error
        })
      );
    });

    child.once("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      reject(
        new ToolExecutionError({
          tool: toolName,
          message: error.message,
          catalogPath,
          details: { stack: error.stack }
        })
      );
    });

    child.once("exit", (code, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      reject(
        new ToolExecutionError({
          tool: toolName,
          message: `Worker exited before sending a response (code: ${code ?? "unknown"}, signal: ${signal ?? "none"}).`,
          catalogPath
        })
      );
    });

    child.send(request);
  });
}
