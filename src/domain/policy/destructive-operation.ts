import { ensureNonBlank } from "../shared/guards.js";

/**
 * A destructive operation awaiting confirmation, carrying a concrete,
 * human-readable description of its impact.
 */
export class DestructiveOperation {
  private constructor(
    private readonly summary: string,
    private readonly impact: string,
  ) {}

  static of(summary: string, impact: string): DestructiveOperation {
    return new DestructiveOperation(
      ensureNonBlank(summary, "summary"),
      ensureNonBlank(impact, "impact"),
    );
  }

  describe(): string {
    return `${this.summary}\n\n${this.impact}`;
  }
}
