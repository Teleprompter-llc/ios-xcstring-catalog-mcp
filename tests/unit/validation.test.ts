import { xcstringsAddInputSchema } from "../../src/tools/xcstringsAdd.js";
import { xcstringsRemoveInputSchema } from "../../src/tools/xcstringsRemove.js";
import { xcstringsStringsInputSchema } from "../../src/tools/xcstringsStrings.js";

describe("tool validation schemas", () => {
  test("xcstrings_add requires key and lang", () => {
    expect(() => xcstringsAddInputSchema.parse({ lang: "en" })).toThrow();
    expect(() => xcstringsAddInputSchema.parse({ key: "title" })).toThrow();
  });

  test("xcstrings_remove requires key", () => {
    expect(() => xcstringsRemoveInputSchema.parse({})).toThrow();
  });

  test("xcstrings_strings rejects non-boolean missingLanguages", () => {
    expect(() =>
      xcstringsStringsInputSchema.parse({
        missingLanguages: "true"
      })
    ).toThrow();
  });
});
