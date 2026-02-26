import { z } from "zod";
import { runXcstringsCommand } from "../adapter/xcstringsRunner.js";

export const xcstringsLanguagesInputSchema = z.object({}).strict();

export const xcstringsLanguagesJsonSchema = {
  type: "object",
  properties: {},
  additionalProperties: false
} as const;

export async function executeXcstringsLanguages(args: unknown): Promise<{ languages: string[] }> {
  xcstringsLanguagesInputSchema.parse(args ?? {});

  const result = await runXcstringsCommand("xcstrings_languages", {
    command: "languages"
  });

  if (!Array.isArray(result) || !result.every((item) => typeof item === "string")) {
    throw new Error("xcstrings_languages returned an unexpected payload.");
  }

  return {
    languages: result
  };
}
