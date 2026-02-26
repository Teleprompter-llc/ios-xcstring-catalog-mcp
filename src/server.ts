#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { ZodError } from "zod";
import { ToolExecutionError } from "./errors.js";
import { getToolByName, registeredTools } from "./tools/index.js";

const server = new Server(
  {
    name: "xcstrings-mcp-server",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: registeredTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = getToolByName(request.params.name);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }

  try {
    const result = await tool.execute(request.params.arguments ?? {});

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                tool: tool.name,
                message: "Invalid arguments.",
                details: error.issues
              },
              null,
              2
            )
          }
        ]
      };
    }

    if (error instanceof ToolExecutionError) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(error.toPayload(), null, 2)
          }
        ]
      };
    }

    const unknownError = error as Error;

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              tool: tool.name,
              message: unknownError.message,
              details: { stack: unknownError.stack }
            },
            null,
            2
          )
        }
      ]
    };
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(`Server failed to start: ${(error as Error).message}`);
  process.exit(1);
});
