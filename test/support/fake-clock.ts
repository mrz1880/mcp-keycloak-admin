import type { Clock } from "../../src/domain/ports/clock.js";

export class FakeClock implements Clock {
  private current: number;

  constructor(start = 0) {
    this.current = start;
  }

  now(): number {
    return this.current;
  }

  advanceBy(ms: number): void {
    this.current += ms;
  }
}
