import type { Confirmer } from "../../../domain/ports/confirmer.js";

/**
 * Fallback confirmer for clients without elicitation support: the operation is
 * approved only when the caller explicitly passed `confirm: true`.
 */
export class ParamConfirmer implements Confirmer {
  constructor(private readonly provided: boolean) {}

  confirm(): Promise<boolean> {
    return Promise.resolve(this.provided);
  }
}
