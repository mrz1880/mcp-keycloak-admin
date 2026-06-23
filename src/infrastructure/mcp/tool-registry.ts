import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import type { ToolAccessPolicy } from "../../domain/policy/tool-access-policy.js";
import type { ToolDefinition } from "./tool-definition.js";

/** Drops tools blocked by the read-only guardrail. */
export function filterTools(
  definitions: ToolDefinition[],
  policy: ToolAccessPolicy,
): ToolDefinition[] {
  return definitions.filter(
    (definition) => !policy.isBlocked(definition.level),
  );
}

export function registerTools(
  server: McpServer,
  definitions: ToolDefinition[],
): void {
  for (const definition of definitions) {
    server.registerTool(
      definition.name,
      {
        title: definition.title,
        description: definition.description,
        inputSchema: definition.inputSchema,
        annotations: definition.annotations,
      },
      (args: Record<string, unknown>): Promise<CallToolResult> =>
        definition.handler(args).then((result) => ({ ...result })),
    );
  }
}
