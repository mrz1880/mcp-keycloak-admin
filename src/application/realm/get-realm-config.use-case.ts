import type { RealmInfo } from "../../domain/ports/realm-info.js";

export class GetRealmConfigUseCase {
  constructor(private readonly realm: RealmInfo) {}

  execute(): Promise<Record<string, unknown>> {
    return this.realm.getRealmConfig();
  }
}
