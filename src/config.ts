import path from "node:path";

export const BUILTIN_DEFAULT_CATALOG_PATH =
  "Teleprompter/Resources/teleprompter-ios-localization/Localizable.xcstrings";

const LOCALIZABLE_FILENAME = "Localizable.xcstrings";

export function resolveCatalogPath(catalogPath?: string): string {
  const preferred = catalogPath?.trim() || process.env.XCSTRINGS_DEFAULT_PATH?.trim() || BUILTIN_DEFAULT_CATALOG_PATH;
  return path.normalize(path.resolve(process.cwd(), preferred));
}

export function ensureLocalizableCatalogFilename(catalogPath: string): void {
  if (path.basename(catalogPath) !== LOCALIZABLE_FILENAME) {
    throw new Error(
      `Invalid catalog path: expected filename '${LOCALIZABLE_FILENAME}', got '${path.basename(catalogPath)}'.`
    );
  }
}

export function getCatalogDirectory(catalogPath: string): string {
  return path.dirname(catalogPath);
}
