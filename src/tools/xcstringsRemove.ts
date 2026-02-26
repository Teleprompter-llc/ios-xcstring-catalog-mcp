import { z } from "zod";
import { ensureLocalizableCatalogFilename, resolveCatalogPath } from "../config.js";
import { runXcstringsCommand } from "../adapter/xcstringsRunner.js";

export const xcstringsRemoveInputSchema = z
  .object({
    key: z.string().min(1),
    lang: z.string().min(1).optional(),
    catalogPath: z.string().min(1).optional()
  })
  .strict();

export const xcstringsRemoveJsonSchema = {
  type: "object",
  properties: {
    key: {
      type: "string",
      description: "String key to remove"
    },
    lang: {
      type: "string",
      description: "Optional language code. If omitted, the full key is removed"
    },
    catalogPath: {
      type: "string",
      description: "Path to Localizable.xcstrings"
    }
  },
  required: ["key"],
  additionalProperties: false
} as const;

export async function executeXcstringsRemove(
  args: unknown
): Promise<{ catalogPath: string; key: string; lang?: string; updated: true }> {
  const parsed = xcstringsRemoveInputSchema.parse(args ?? {});
  const catalogPath = resolveCatalogPath(parsed.catalogPath);

  ensureLocalizableCatalogFilename(catalogPath);

  await runXcstringsCommand(
    "xcstrings_remove",
    {
      command: "remove",
      args: {
        filePath: catalogPath,
        key: parsed.key,
        lang: parsed.lang
      }
    },
    catalogPath
  );

  return {
    catalogPath,
    key: parsed.key,
    lang: parsed.lang,
    updated: true
  };
}
