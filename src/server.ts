import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { unminify } from "./unminify.js";

const SERVER_NAME = "unminify-mcp";
const SERVER_VERSION = "1.0.0";

/**
 * Create and configure the MCP server with the `unminify` tool.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.tool(
    "unminify",
    "Unminify / beautify minified JS, CSS, or HTML code. " +
      "Auto-detects the code type by default, or accepts an explicit type hint. " +
      "Uses js-beautify under the hood with 2-space indentation.",
    {
      code: z
        .string()
        .describe("The minified or compressed source code to beautify."),
      type: z
        .enum(["auto", "js", "css", "html"])
        .default("auto")
        .describe(
          "Code type hint. 'auto' runs regex-based detection. " +
            "Use 'js', 'css', or 'html' to skip detection and force a specific beautifier."
        ),
    },
    async ({ code, type }) => {
      const result = unminify(code, type);

      return {
        content: [
          {
            type: "text",
            text: result.unminified,
          },
        ],
        metadata: {
          detectedType: result.type,
        },
      };
    }
  );

  return server;
}
