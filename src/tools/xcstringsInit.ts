import { z } from "zod";
import { getCatalogDirectory, ensureLocalizableCatalogFilename, resolveCatalogPath } from "../config.js";
import { runXcstringsCommand } from "../adapter/xcstringsRunner.js";

export const xcstringsInitInputSchema = z
  .object({
    catalogPath: z.string().min(1).optional()
  })
  .strict();

export const xcstringsInitJsonSchema = {
  type: "object",
  properties: {
    catalogPath: {
      type: "string",
      description: "Path to Localizable.xcstrings"
    }
  },
  additionalProperties: false
} as const;

export async function executeXcstringsInit(args: unknown): Promise<{ catalogPath: string; created: true }> {
  const parsed = xcstringsInitInputSchema.parse(args ?? {});
  const catalogPath = resolveCatalogPath(parsed.catalogPath);

  ensureLocalizableCatalogFilename(catalogPath);

  await runXcstringsCommand(
    "xcstrings_init",
    {
      command: "init",
      args: {
        directoryPath: getCatalogDirectory(catalogPath)
      }
    },
    catalogPath
  );

  return {
    catalogPath,
    created: true
  };
}
