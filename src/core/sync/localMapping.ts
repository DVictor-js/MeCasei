import type { SQLiteDatabase } from "expo-sqlite";
import { getSetting } from "@/core/database/settings";
import { writeTransaction } from "@/core/database/transaction";
import type { ImportResult } from "@/core/api/types";

export type SyncStatus = "local_only" | "synced" | "dirty" | "error";
export interface SyncEntity {
  account_user_id: string;
  entity_type: string;
  local_id: string;
  remote_id: string | null;
  sync_status: SyncStatus;
  deleted: 0 | 1;
  last_synced_at: string | null;
}

export async function getMapping(
  db: SQLiteDatabase,
  accountId: string,
  type: string,
  localId: string,
): Promise<SyncEntity | null> {
  return db.getFirstAsync<SyncEntity>(
    "SELECT * FROM sync_entities WHERE account_user_id=? AND entity_type=? AND local_id=?",
    accountId,
    type,
    localId,
  );
}

export async function getRemoteWeddingId(db: SQLiteDatabase, accountId: string, weddingId: string) {
  return (await getMapping(db, accountId, "weddings", weddingId))?.remote_id ?? null;
}

export async function markDirty(
  tx: SQLiteDatabase,
  type: string,
  localId: string,
  weddingId: string,
  deleted = false,
): Promise<void> {
  const accountId = await getSetting(tx, "active_account_id");
  if (!accountId || !(await getRemoteWeddingId(tx, accountId, weddingId))) return;
  const existing = await getMapping(tx, accountId, type, localId);
  if (deleted && !existing?.remote_id) {
    await tx.runAsync(
      "DELETE FROM sync_entities WHERE account_user_id=? AND entity_type=? AND local_id=?",
      accountId,
      type,
      localId,
    );
    return;
  }
  await tx.runAsync(
    `INSERT INTO sync_entities(account_user_id,entity_type,local_id,remote_id,sync_status,deleted)
     VALUES (?,?,?,?, 'dirty',?)
     ON CONFLICT(account_user_id,entity_type,local_id)
     DO UPDATE SET sync_status='dirty',deleted=excluded.deleted`,
    accountId,
    type,
    localId,
    existing?.remote_id ?? null,
    deleted ? 1 : 0,
  );
}

export async function saveImportMapping(
  db: SQLiteDatabase,
  accountId: string,
  result: ImportResult,
): Promise<void> {
  const now = new Date().toISOString();
  await writeTransaction(db, async (tx) => {
    for (const [type, pairs] of Object.entries(result.mapping)) {
      for (const [localId, remoteId] of Object.entries(pairs)) {
        await tx.runAsync(
          `INSERT INTO sync_entities(account_user_id,entity_type,local_id,remote_id,sync_status,deleted,last_synced_at)
           VALUES (?,?,?,?,'synced',0,?)
           ON CONFLICT(account_user_id,entity_type,local_id)
           DO UPDATE SET remote_id=excluded.remote_id,sync_status='synced',deleted=0,last_synced_at=excluded.last_synced_at`,
          accountId,
          type,
          localId,
          remoteId,
          now,
        );
      }
    }
  });
}

export async function pendingCount(db: SQLiteDatabase, accountId: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) count FROM sync_entities WHERE account_user_id=? AND sync_status IN ('dirty','error')",
    accountId,
  );
  return row?.count ?? 0;
}
