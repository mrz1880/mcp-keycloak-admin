import { DestructiveOperation } from "../policy/destructive-operation.js";

export interface Confirmer {
  /** Returns true only if the user explicitly approved the operation. */
  confirm(operation: DestructiveOperation): Promise<boolean>;
}
