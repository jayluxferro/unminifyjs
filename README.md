# unminify-mcp

MCP (Model Context Protocol) server to unminify / beautify JS, CSS, and HTML code. Wraps [js-beautify](https://github.com/beautifier/js-beautify) behind a single `unminify` tool with auto-detection of code type.

## Installation

```bash
npm install
npm run build
```

## Usage

### stdio transport (default)

Run as a subprocess — typical for MCP client configs (Claude Desktop, VS Code, etc.):

```bash
unminify-mcp
# or
node dist/index.js
```

Configure in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "unminify": {
      "command": "node",
      "args": ["/path/to/unminify-mcp/dist/index.js"]
    }
  }
}
```

### Streamable HTTP transport

```bash
unminify-mcp --transport http --port 3000
```

Endpoint: `POST http://localhost:3000/mcp`

### SSE transport (legacy)

```bash
unminify-mcp --transport sse --port 3000
```

Endpoints:
- `GET  http://localhost:3000/sse` — SSE event stream
- `POST http://localhost:3000/messages?sessionId=...` — client messages

## MCP Tool

### `unminify`

Unminify / beautify minified JS, CSS, or HTML code.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `code` | string | yes | — | The minified source code to beautify |
| `type` | enum | no | `"auto"` | Code type: `"auto"`, `"js"`, `"css"`, or `"html"` |

Returns the beautified code as text content with `detectedType` in the metadata.

## Development

```bash
npm run dev          # Run with tsx (stdio transport)
npm run build        # Compile TypeScript → dist/
```

## Acknowledgements

- [js-beautify](https://github.com/beautifier/js-beautify) — the underlying beautification engine
- Original [unminify2.com](https://www.unminify2.com) browser tool
