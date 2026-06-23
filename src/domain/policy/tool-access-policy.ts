import { ToolLevel } from "./tool-level.js";

/** Decides whether a tool may run given the read-only guardrail. */
export class ToolAccessPolicy {
  private constructor(private readonly readOnly: boolean) {}

  static of(readOnly: boolean): ToolAccessPolicy {
    return new ToolAccessPolicy(readOnly);
  }

  isBlocked(level: ToolLevel): boolean {
    return this.readOnly && level !== ToolLevel.Read;
  }
}
