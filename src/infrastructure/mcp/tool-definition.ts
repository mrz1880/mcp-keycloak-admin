import type { z } from "zod";

import type { ToolLevel } from "../../domain/policy/tool-level.js";

export interface ToolTextResult {
  readonly content: { type: "text"; text: string }[];
  readonly isError?: boolean;
}

export interface ToolAnnotations {
  readonly readOnlyHint?: boolean;
  readonly destructiveHint?: boolean;
  readonly idempotentHint?: boolean;
}

export interface ToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly level: ToolLevel;
  readonly inputSchema: Record<string, z.ZodType>;
  readonly annotations: ToolAnnotations;
  handler(args: Record<string, unknown>): Promise<ToolTextResult>;
}

export function textResult(text: string): ToolTextResult {
  return { content: [{ type: "text", text }] };
}
