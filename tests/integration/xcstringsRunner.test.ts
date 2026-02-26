import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { executeXcstringsStrings } from "../../src/tools/xcstringsStrings.js";
import { runXcstringsCommand } from "../../src/adapter/xcstringsRunner.js";

const hasXcstringsCli = await import("xcstrings-cli/package.json")
  .then(() => true)
  .catch(() => false);

const suite = hasXcstringsCli ? describe : describe.skip;

async function setupCatalog(): Promise<{ tmpDir: string; catalogPath: string }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "xcstrings-mcp-server-"));
  const catalogPath = path.join(tmpDir, "Localizable.xcstrings");

  await runXcstringsCommand(
    "test_init",
    {
      command: "init",
      args: {
        directoryPath: tmpDir
      }
    },
    catalogPath
  );

  return { tmpDir, catalogPath };
}

suite("xcstrings runner integration", () => {
  test("init creates Localizable.xcstrings", async () => {
    const { catalogPath } = await setupCatalog();
    const stat = await fs.stat(catalogPath);
    expect(stat.isFile()).toBe(true);
  });

  test("add inserts and updates values", async () => {
    const { catalogPath } = await setupCatalog();

    await runXcstringsCommand(
      "test_add",
      {
        command: "add",
        args: {
          filePath: catalogPath,
          key: "hello.key",
          lang: "en",
          value: "Hello"
        }
      },
      catalogPath
    );

    await runXcstringsCommand(
      "test_add",
      {
        command: "add",
        args: {
          filePath: catalogPath,
          key: "hello.key",
          lang: "en",
          value: "Hello Updated"
        }
      },
      catalogPath
    );

    const raw = await fs.readFile(catalogPath, "utf8");
    expect(raw).toContain("hello.key");
    expect(raw).toContain("Hello Updated");
  });

  test("remove can delete language-specific and whole-key entries", async () => {
    const { catalogPath } = await setupCatalog();

    await runXcstringsCommand(
      "test_add",
      {
        command: "add",
        args: {
          filePath: catalogPath,
          key: "removal.key",
          lang: "en",
          value: "Hello"
        }
      },
      catalogPath
    );

    await runXcstringsCommand(
      "test_add",
      {
        command: "add",
        args: {
          filePath: catalogPath,
          key: "removal.key",
          lang: "fr",
          value: "Bonjour"
        }
      },
      catalogPath
    );

    await runXcstringsCommand(
      "test_remove",
      {
        command: "remove",
        args: {
          filePath: catalogPath,
          key: "removal.key",
          lang: "en"
        }
      },
      catalogPath
    );

    let raw = await fs.readFile(catalogPath, "utf8");
    let parsed = JSON.parse(raw) as {
      strings: Record<
        string,
        {
          localizations?: Record<string, unknown>;
        }
      >;
    };

    expect(parsed.strings["removal.key"]?.localizations?.en).toBeUndefined();
    expect(parsed.strings["removal.key"]?.localizations?.fr).toBeDefined();

    await runXcstringsCommand(
      "test_remove",
      {
        command: "remove",
        args: {
          filePath: catalogPath,
          key: "removal.key"
        }
      },
      catalogPath
    );

    raw = await fs.readFile(catalogPath, "utf8");
    parsed = JSON.parse(raw) as {
      strings: Record<string, unknown>;
    };
    expect(parsed.strings["removal.key"]).toBeUndefined();
  });

  test("languages returns common locales", async () => {
    const result = await runXcstringsCommand("test_languages", {
      command: "languages"
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain("en");
    expect(result).toContain("ja");
  });

  test("strings returns entries and supports missingLanguages option", async () => {
    const { catalogPath } = await setupCatalog();

    await runXcstringsCommand(
      "test_add",
      {
        command: "add",
        args: {
          filePath: catalogPath,
          key: "strings.key",
          lang: "en",
          value: "Value"
        }
      },
      catalogPath
    );

    const allStrings = await runXcstringsCommand(
      "test_strings",
      {
        command: "strings",
        args: {
          filePath: catalogPath
        }
      },
      catalogPath
    );

    expect(Array.isArray(allStrings)).toBe(true);

    const missingLanguageView = await runXcstringsCommand(
      "test_strings",
      {
        command: "strings",
        args: {
          filePath: catalogPath,
          missingLanguages: true
        }
      },
      catalogPath
    );

    expect(Array.isArray(missingLanguageView)).toBe(true);
  });

  test("invalid path fails without crashing process", async () => {
    await expect(
      executeXcstringsStrings({
        catalogPath: "bad/NotLocalizable.xcstrings"
      })
    ).rejects.toThrow("Invalid catalog path");
  });
});
