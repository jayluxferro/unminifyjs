#!/usr/bin/env node

/**
 * unminify-mcp — MCP server for unminifying JS, CSS, and HTML.
 *
 * Supports three transports:
 *   stdio  (default) — standard input/output for subprocess integration
 *   http   — Streamable HTTP (current MCP HTTP transport, RFC-compliant)
 *   sse    — Server-Sent Events (legacy MCP transport, deprecated but supported)
 *
 * Usage:
 *   unminify-mcp                          # stdio (default)
 *   unminify-mcp --transport http --port 3000
 *   unminify-mcp --transport sse --port 3000
 */

import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";

// ── CLI argument parsing ──────────────────────────────────────────────

type Transport = "stdio" | "sse" | "http";

function parseArgs(): { transport: Transport; port: number } {
  const args = process.argv.slice(2);
  let transport: Transport = "stdio";
  let port = 3000;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--transport":
      case "-t":
        transport = args[++i] as Transport;
        break;
      case "--port":
      case "-p":
        port = parseInt(args[++i], 10);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return { transport, port };
}

function printHelp(): void {
  console.log(`unminify-mcp — MCP server for unminifying JS, CSS, HTML

Usage:
  unminify-mcp [options]

Options:
  -t, --transport <type>   Transport: stdio (default), http, or sse
  -p, --port <port>        Port for HTTP/SSE transports (default: 3000)
  -h, --help               Show this help

Examples:
  unminify-mcp                                  # stdio (default)
  unminify-mcp --transport http --port 3000     # Streamable HTTP on port 3000
  unminify-mcp --transport sse --port 8080      # SSE on port 8080
`);
}

// ── Transport runners ─────────────────────────────────────────────────

/** stdio transport — standard in/out for subprocess integration. */
async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("unminify-mcp running on stdio");
}

/**
 * Streamable HTTP transport (current MCP HTTP spec).
 *
 * One server + one transport handle all requests. The underlying
 * WebStandardStreamableHTTPServerTransport manages sessions per request.
 *
 * Endpoints:
 *   POST   /mcp  — JSON-RPC messages
 *   GET    /mcp  — SSE stream for server-initiated notifications
 *   DELETE /mcp  — session termination
 */
async function runHttp(port: number): Promise<void> {
  const app = createMcpExpressApp();

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
  });

  await server.connect(transport);

  app.post("/mcp", (req: Request, res: Response) =>
    transport.handleRequest(req, res, req.body)
  );
  app.get("/mcp", (req: Request, res: Response) =>
    transport.handleRequest(req, res)
  );
  app.delete("/mcp", (req: Request, res: Response) =>
    transport.handleRequest(req, res)
  );

  app.listen(port, () => {
    console.error(`unminify-mcp (Streamable HTTP) → http://localhost:${port}/mcp`);
  });
}

/**
 * SSE transport (legacy MCP transport, deprecated).
 *
 * Each client SSE connection gets its own McpServer + SSEServerTransport.
 * Active sessions are tracked in a Map keyed by session ID.
 *
 * Endpoints:
 *   GET  /sse                      — establish SSE event stream
 *   POST /messages?sessionId=...   — client → server JSON-RPC messages
 */
async function runSse(port: number): Promise<void> {
  const app = createMcpExpressApp();

  // Track active SSE sessions. The SSEServerTransport writes its sessionId
  // into the endpoint URL returned to the client, so we key by that.
  const sessions = new Map<
    string,
    { server: ReturnType<typeof createServer>; transport: SSEServerTransport }
  >();

  app.get("/sse", async (req: Request, res: Response) => {
    const server = createServer();
    const transport = new SSEServerTransport("/messages", res);

    // connect() calls transport.start() which:
    //   1. Writes 200 + SSE headers on `res`
    //   2. Emits `event: endpoint\ndata: /messages?sessionId=<id>\n\n`
    await server.connect(transport);

    sessions.set(transport.sessionId, { server, transport });

    res.on("close", () => {
      sessions.delete(transport.sessionId);
    });
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId =
      typeof req.query.sessionId === "string" ? req.query.sessionId : "";

    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId query parameter" });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Pass express-parsed body so handlePostMessage skips raw body re-parse
    await session.transport.handlePostMessage(req, res, req.body);
  });

  app.listen(port, () => {
    console.error(`unminify-mcp (SSE) → http://localhost:${port}/sse`);
  });
}

// ── Entry point ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { transport, port } = parseArgs();

  switch (transport) {
    case "stdio":
      await runStdio();
      break;
    case "http":
      await runHttp(port);
      break;
    case "sse":
      await runSse(port);
      break;
    default:
      console.error(`Unknown transport: ${transport}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
