import path from "node:path";
import {
  BUILTIN_DEFAULT_CATALOG_PATH,
  ensureLocalizableCatalogFilename,
  resolveCatalogPath
} from "../../src/config.js";

describe("config", () => {
  const originalEnv = process.env.XCSTRINGS_DEFAULT_PATH;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.XCSTRINGS_DEFAULT_PATH;
    } else {
      process.env.XCSTRINGS_DEFAULT_PATH = originalEnv;
    }
  });

  test("resolveCatalogPath uses explicit input first", () => {
    process.env.XCSTRINGS_DEFAULT_PATH = "env/Localizable.xcstrings";

    const resolved = resolveCatalogPath("custom/Localizable.xcstrings");

    expect(resolved).toBe(path.resolve(process.cwd(), "custom/Localizable.xcstrings"));
  });

  test("resolveCatalogPath uses env when input is missing", () => {
    process.env.XCSTRINGS_DEFAULT_PATH = "env/Localizable.xcstrings";

    const resolved = resolveCatalogPath();

    expect(resolved).toBe(path.resolve(process.cwd(), "env/Localizable.xcstrings"));
  });

  test("resolveCatalogPath uses built-in fallback", () => {
    delete process.env.XCSTRINGS_DEFAULT_PATH;

    const resolved = resolveCatalogPath();

    expect(resolved).toBe(path.resolve(process.cwd(), BUILTIN_DEFAULT_CATALOG_PATH));
  });

  test("ensureLocalizableCatalogFilename rejects non-localizable file names", () => {
    expect(() => ensureLocalizableCatalogFilename("/tmp/OtherCatalog.xcstrings")).toThrow(
      "Invalid catalog path"
    );
  });
});
