# xcstrings-mcp-server

MCP stdio server for manipulating Xcode string catalogs through `xcstrings-cli`.

## Features

- `xcstrings_init`
- `xcstrings_add`
- `xcstrings_remove`
- `xcstrings_languages`
- `xcstrings_strings`

## Requirements

- Node.js 20+

## Install

```bash
npm install @teleprompter/xcstrings-mcp-server
```

## Default catalog resolution

`catalogPath` resolution order:
1. Tool input `catalogPath`
2. `XCSTRINGS_DEFAULT_PATH` env var
3. `Teleprompter/Resources/teleprompter-ios-localization/Localizable.xcstrings`

## MCP client config (example)

```json
{
  "mcpServers": {
    "xcstrings": {
      "command": "npx",
      "args": ["-y", "@teleprompter/xcstrings-mcp-server"],
      "env": {
        "XCSTRINGS_DEFAULT_PATH": "/absolute/path/to/Localizable.xcstrings"
      }
    }
  }
}
```

## Tool reference

### `xcstrings_init`
Input:
```json
{
  "catalogPath": "optional/path/to/Localizable.xcstrings"
}
```
Output:
```json
{
  "catalogPath": "/abs/path/Localizable.xcstrings",
  "created": true
}
```

### `xcstrings_add`
Input:
```json
{
  "key": "home.title",
  "lang": "en",
  "value": "Home",
  "catalogPath": "optional/path/to/Localizable.xcstrings"
}
```
Output:
```json
{
  "catalogPath": "/abs/path/Localizable.xcstrings",
  "key": "home.title",
  "lang": "en",
  "value": "Home",
  "updated": true
}
```

### `xcstrings_remove`
Input:
```json
{
  "key": "home.title",
  "lang": "en",
  "catalogPath": "optional/path/to/Localizable.xcstrings"
}
```
Output:
```json
{
  "catalogPath": "/abs/path/Localizable.xcstrings",
  "key": "home.title",
  "lang": "en",
  "updated": true
}
```

### `xcstrings_languages`
Input:
```json
{}
```
Output:
```json
{
  "languages": ["en", "ja", "fr"]
}
```

### `xcstrings_strings`
Input:
```json
{
  "catalogPath": "optional/path/to/Localizable.xcstrings",
  "lang": "optional language code",
  "missingLanguages": false
}
```
Output:
```json
{
  "strings": [
    {
      "key": "home.title",
      "localizations": {}
    }
  ]
}
```

## Development

```bash
npm install
npm run test
npm run build
```

## Publishing

- Package is published from Git tags matching `v*` via GitHub Actions.
- Workflow uses `NODE_AUTH_TOKEN` and supports npm provenance.
