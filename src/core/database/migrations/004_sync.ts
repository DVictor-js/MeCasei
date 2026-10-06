export const syncSchema = `
CREATE TABLE sync_entities (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 account_user_id TEXT NOT NULL,
 entity_type TEXT NOT NULL,
 local_id TEXT NOT NULL,
 remote_id TEXT,
 sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK(sync_status IN ('local_only','synced','dirty','error')),
 deleted INTEGER NOT NULL DEFAULT 0 CHECK(deleted IN (0,1)),
 last_synced_at TEXT,
 UNIQUE(account_user_id,entity_type,local_id),
 UNIQUE(account_user_id,entity_type,remote_id)
);
CREATE INDEX idx_sync_entities_status ON sync_entities(account_user_id,sync_status,entity_type);
CREATE TABLE app_settings (
 key TEXT PRIMARY KEY NOT NULL,
 value TEXT NOT NULL
);
`;
