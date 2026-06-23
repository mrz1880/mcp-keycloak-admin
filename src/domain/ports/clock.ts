export interface Clock {
  /** Current time, epoch milliseconds. */
  now(): number;
}
