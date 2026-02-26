import { executeXcstringsAdd, xcstringsAddJsonSchema } from "./xcstringsAdd.js";
import { executeXcstringsInit, xcstringsInitJsonSchema } from "./xcstringsInit.js";
import { executeXcstringsLanguages, xcstringsLanguagesJsonSchema } from "./xcstringsLanguages.js";
import { executeXcstringsRemove, xcstringsRemoveJsonSchema } from "./xcstringsRemove.js";
import { executeXcstringsStrings, xcstringsStringsJsonSchema } from "./xcstringsStrings.js";

export interface RegisteredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: unknown) => Promise<unknown>;
}

export const registeredTools: RegisteredTool[] = [
  {
    name: "xcstrings_init",
    description: "Initialize a Localizable.xcstrings catalog in the target directory.",
    inputSchema: xcstringsInitJsonSchema,
    execute: executeXcstringsInit
  },
  {
    name: "xcstrings_add",
    description: "Add or update a translation key/value in the catalog.",
    inputSchema: xcstringsAddJsonSchema,
    execute: executeXcstringsAdd
  },
  {
    name: "xcstrings_remove",
    description: "Remove a translation key or a language-specific entry from the catalog.",
    inputSchema: xcstringsRemoveJsonSchema,
    execute: executeXcstringsRemove
  },
  {
    name: "xcstrings_languages",
    description: "List available language codes supported by xcstrings-cli.",
    inputSchema: xcstringsLanguagesJsonSchema,
    execute: executeXcstringsLanguages
  },
  {
    name: "xcstrings_strings",
    description: "List strings from the catalog, optionally filtered by language or missing language coverage.",
    inputSchema: xcstringsStringsJsonSchema,
    execute: executeXcstringsStrings
  }
];

const toolMap = new Map(registeredTools.map((tool) => [tool.name, tool]));

export function getToolByName(name: string): RegisteredTool | undefined {
  return toolMap.get(name);
}
