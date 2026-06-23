import { ensureUuid } from "./guards.js";

export class ComponentId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ComponentId {
    return new ComponentId(ensureUuid(value, "ComponentId"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: ComponentId): boolean {
    return this.value === other.value;
  }
}
