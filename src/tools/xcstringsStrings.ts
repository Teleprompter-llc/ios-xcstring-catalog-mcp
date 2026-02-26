import { z } from "zod";
import { ensureLocalizableCatalogFilename, resolveCatalogPath } from "../config.js";
import { runXcstringsCommand } from "../adapter/xcstringsRunner.js";

export const xcstringsStringsInputSchema = z
  .object({
    catalogPath: z.string().min(1).optional(),
    lang: z.string().min(1).optional(),
    missingLanguages: z.boolean().optional()
  })
  .strict();

export const xcstringsStringsJsonSchema = {
  type: "object",
  properties: {
    catalogPath: {
      type: "string",
      description: "Path to Localizable.xcstrings"
    },
    lang: {
      type: "string",
      description: "Optional language code filter"
    },
    missingLanguages: {
      type: "boolean",
      description: "Whether to output missing language coverage"
    }
  },
  additionalProperties: false
} as const;

export async function executeXcstringsStrings(
  args: unknown
): Promise<{ strings: unknown[] }> {
  const parsed = xcstringsStringsInputSchema.parse(args ?? {});
  const catalogPath = resolveCatalogPath(parsed.catalogPath);

  ensureLocalizableCatalogFilename(catalogPath);

  const strings = await runXcstringsCommand(
    "xcstrings_strings",
    {
      command: "strings",
      args: {
        filePath: catalogPath,
        lang: parsed.lang,
        missingLanguages: parsed.missingLanguages ?? false
      }
    },
    catalogPath
  );

  if (!Array.isArray(strings)) {
    throw new Error("xcstrings_strings returned an unexpected payload.");
  }

  return {
    strings
  };
}
