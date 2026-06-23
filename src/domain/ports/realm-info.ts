export interface RealmInfo {
  getRealmConfig(): Promise<Record<string, unknown>>;
  serverInfo(): Promise<Record<string, unknown>>;
}
