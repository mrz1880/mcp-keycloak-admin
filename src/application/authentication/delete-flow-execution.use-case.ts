import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";

export interface DeleteFlowExecutionResult {
  readonly deleted: boolean;
  readonly reason?: string;
}

export class DeleteFlowExecutionUseCase {
  constructor(
    private readonly authentication: AuthenticationRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(executionId: string): Promise<DeleteFlowExecutionResult> {
    const operation = DestructiveOperation.of(
      `Delete authentication execution ${executionId}`,
      "Removing a step from an authentication flow can break login for every " +
        "client using that flow. This is irreversible without recreating the step.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { deleted: false, reason: "Operation not confirmed" };
    }
    await this.authentication.deleteExecution(executionId);
    return { deleted: true };
  }
}
