import type { Clock } from "../../domain/ports/clock.js";

export const systemClock: Clock = {
  now: () => Date.now(),
};
