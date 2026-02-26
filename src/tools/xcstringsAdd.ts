import { z } from "zod";
import { ensureLocalizableCatalogFilename, resolveCatalogPath } from "../config.js";
import { runXcstringsCommand } from "../adapter/xcstringsRunner.js";

export const xcstringsAddInputSchema = z
  .object({
    key: z.string().min(1),
    lang: z.string().min(1),
    value: z.string().optional(),
    catalogPath: z.string().min(1).optional()
  })
  .strict();

export const xcstringsAddJsonSchema = {
  type: "object",
  properties: {
    key: {
      type: "string",
      description: "String key to insert or update"
    },
    lang: {
      type: "string",
      description: "Target language code"
    },
    value: {
      type: "string",
      description: "Localized value. Defaults to empty string"
    },
    catalogPath: {
      type: "string",
      description: "Path to Localizable.xcstrings"
    }
  },
  required: ["key", "lang"],
  additionalProperties: false
} as const;

export async function executeXcstringsAdd(
  args: unknown
): Promise<{ catalogPath: string; key: string; lang: string; value: string; updated: true }> {
  const parsed = xcstringsAddInputSchema.parse(args ?? {});
  const catalogPath = resolveCatalogPath(parsed.catalogPath);
  const value = parsed.value ?? "";

  ensureLocalizableCatalogFilename(catalogPath);

  await runXcstringsCommand(
    "xcstrings_add",
    {
      command: "add",
      args: {
        filePath: catalogPath,
        key: parsed.key,
        lang: parsed.lang,
        value
      }
    },
    catalogPath
  );

  return {
    catalogPath,
    key: parsed.key,
    lang: parsed.lang,
    value,
    updated: true
  };
}
