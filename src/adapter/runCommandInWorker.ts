import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import type { WorkerRequest, WorkerResponse } from "../types.js";

class ProcessExitInterceptError extends Error {
  code: number;

  constructor(code: number) {
    super(`process.exit(${code}) was called.`);
    this.name = "ProcessExitInterceptError";
    this.code = code;
  }
}

type CatalogStringUnit = {
  state: string;
  value: string;
};

type CatalogLocalization = {
  stringUnit: CatalogStringUnit;
};

type CatalogEntry = {
  comment?: string;
  extractionState?: string;
  localizations?: Record<string, CatalogLocalization>;
};

type Catalog = {
  sourceLanguage: string;
  strings: Record<string, CatalogEntry>;
  version: string;
};

const FALLBACK_LANGUAGES = [
  "ar",
  "da",
  "de",
  "el",
  "en",
  "es",
  "es-419",
  "fil-PH",
  "fr",
  "he",
  "hi",
  "hu-HU",
  "id",
  "it",
  "ja",
  "ko",
  "nb",
  "nl",
  "pl",
  "pt-BR",
  "pt-PT",
  "ro",
  "ru",
  "sv",
  "th",
  "tr",
  "uk-UA",
  "vi",
  "zh-Hans",
  "zh-Hant"
];

const execFile = promisify(execFileCallback);
const require = createRequire(import.meta.url);
const xcstringsCliPath = require.resolve("xcstrings-cli/dist/index.js");

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function interceptProcessExit(): () => void {
  const originalExit = process.exit;

  (process as NodeJS.Process & { exit: typeof process.exit }).exit = ((code?: number) => {
    throw new ProcessExitInterceptError(code ?? 0);
  }) as typeof process.exit;

  return () => {
    (process as NodeJS.Process & { exit: typeof process.exit }).exit = originalExit;
  };
}

function createEmptyCatalog(): Catalog {
  return {
    sourceLanguage: "en",
    strings: {},
    version: "1.0"
  };
}

async function readCatalog(filePath: string): Promise<Catalog> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<Catalog>;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid catalog JSON.");
  }

  return {
    sourceLanguage: typeof parsed.sourceLanguage === "string" ? parsed.sourceLanguage : "en",
    strings: parsed.strings && typeof parsed.strings === "object" ? parsed.strings : {},
    version: typeof parsed.version === "string" ? parsed.version : "1.0"
  };
}

async function writeCatalog(filePath: string, catalog: Catalog): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

async function ensureCatalog(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await writeCatalog(filePath, createEmptyCatalog());
  }
}

async function runCliCommand(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFile(process.execPath, [xcstringsCliPath, ...args], {
      env: process.env
    });

    return stripAnsi(`${stdout}${stderr}`);
  } catch (error) {
    const typed = error as Error & {
      stdout?: string;
      stderr?: string;
      code?: number;
    };

    const output = stripAnsi(`${typed.stdout ?? ""}${typed.stderr ?? ""}`).trim();
    const suffix = output ? ` ${output}` : "";
    throw new Error(`xcstrings-cli execution failed.${suffix}`.trim());
  }
}

function parseLanguages(raw: string): string[] {
  const normalized = raw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(token));

  return [...new Set(normalized)];
}

async function runInit(args: Record<string, unknown>): Promise<void> {
  if (typeof args.directoryPath !== "string") {
    throw new Error("'directoryPath' must be provided for init.");
  }

  const filePath = path.join(args.directoryPath, "Localizable.xcstrings");
  await ensureCatalog(filePath);
}

async function runAdd(args: Record<string, unknown>): Promise<void> {
  const filePath = args.filePath;
  const key = args.key;
  const lang = args.lang;
  const value = args.value;

  if (
    typeof filePath !== "string" ||
    typeof key !== "string" ||
    typeof lang !== "string" ||
    typeof value !== "string"
  ) {
    throw new Error("'filePath', 'key', 'lang', and 'value' must be provided for add.");
  }

  await ensureCatalog(filePath);

  try {
    await runCliCommand([
      "add",
      "--path",
      filePath,
      "--key",
      key,
      "--strings",
      JSON.stringify({ [lang]: value })
    ]);
  } catch {
    const catalog = await readCatalog(filePath);
    const existing = catalog.strings[key] ?? { extractionState: "manual", localizations: {} };

    const localizations = existing.localizations ?? {};
    localizations[lang] = {
      stringUnit: {
        state: "translated",
        value
      }
    };

    catalog.strings[key] = {
      ...existing,
      extractionState: existing.extractionState ?? "manual",
      localizations
    };

    await writeCatalog(filePath, catalog);
  }
}

async function runRemove(args: Record<string, unknown>): Promise<void> {
  const filePath = args.filePath;
  const key = args.key;
  const lang = args.lang;

  if (typeof filePath !== "string" || typeof key !== "string") {
    throw new Error("'filePath' and 'key' must be provided for remove.");
  }

  await ensureCatalog(filePath);

  if (typeof lang === "string") {
    const catalog = await readCatalog(filePath);
    const entry = catalog.strings[key];

    if (!entry) {
      return;
    }

    if (entry.localizations) {
      delete entry.localizations[lang];

      if (Object.keys(entry.localizations).length === 0) {
        delete catalog.strings[key];
      } else {
        catalog.strings[key] = entry;
      }
    }

    await writeCatalog(filePath, catalog);
    return;
  }

  try {
    await runCliCommand(["remove", "--path", filePath, "--key", key]);
  } catch {
    const catalog = await readCatalog(filePath);
    delete catalog.strings[key];
    await writeCatalog(filePath, catalog);
  }
}

async function runLanguages(): Promise<string[]> {
  try {
    const output = await runCliCommand(["languages"]);
    const parsed = parseLanguages(output);

    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    return FALLBACK_LANGUAGES;
  }

  return FALLBACK_LANGUAGES;
}

async function runStrings(args: Record<string, unknown>): Promise<unknown[]> {
  const filePath = args.filePath;
  const lang = args.lang;
  const missingLanguages = args.missingLanguages === true;

  if (typeof filePath !== "string") {
    throw new Error("'filePath' must be provided for strings.");
  }

  await ensureCatalog(filePath);
  const catalog = await readCatalog(filePath);

  if (missingLanguages) {
    const supportedLanguages = await runLanguages();

    return Object.entries(catalog.strings).map(([key, entry]) => {
      const localizedKeys = Object.keys(entry.localizations ?? {});
      const missing = supportedLanguages.filter((code) => !localizedKeys.includes(code));

      return {
        key,
        missingLanguages: missing
      };
    });
  }

  return Object.entries(catalog.strings).map(([key, entry]) => {
    const localizations = entry.localizations ?? {};

    if (typeof lang === "string") {
      return {
        key,
        localizations: localizations[lang] ? { [lang]: localizations[lang] } : {}
      };
    }

    return {
      key,
      localizations
    };
  });
}

async function executeRequest(request: WorkerRequest): Promise<unknown> {
  const args = request.args ?? {};

  if (request.command === "init") {
    await runInit(args);
    return {};
  }

  if (request.command === "add") {
    await runAdd(args);
    return {};
  }

  if (request.command === "remove") {
    await runRemove(args);
    return {};
  }

  if (request.command === "languages") {
    return await runLanguages();
  }

  return await runStrings(args);
}

function respond(message: WorkerResponse): void {
  if (!process.send) {
    return;
  }

  process.send(message);
}

process.on("message", async (incoming) => {
  const request = incoming as WorkerRequest;
  const restoreExit = interceptProcessExit();

  try {
    const result = await executeRequest(request);
    respond({ type: "success", result });
  } catch (error) {
    if (error instanceof ProcessExitInterceptError && error.code === 0) {
      respond({ type: "success", result: {} });
    } else {
      const typed = error as Error & { code?: number; details?: unknown };
      respond({
        type: "error",
        error: {
          message: typed.message,
          code: typed.code,
          stack: typed.stack,
          details: typed.details
        }
      });
    }
  } finally {
    restoreExit();
  }
});
