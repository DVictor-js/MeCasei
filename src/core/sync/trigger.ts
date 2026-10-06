import type { SQLiteDatabase } from "expo-sqlite";
import { getSetting } from "@/core/database/settings";
import { getRemoteWeddingId } from "@/core/sync/localMapping";

/** Dispatch after the local transaction commits. Network failures leave the local change queued. */
export async function triggerSync(db: SQLiteDatabase, weddingId: string): Promise<void> {
  const accountId = await getSetting(db, "active_account_id");
  if (!accountId || !(await getRemoteWeddingId(db, accountId, weddingId))) return;
  try {
    const { syncPending } = await import("@/core/sync/syncCoordinator");
    await syncPending(db);
  } catch {
    // The local transaction already succeeded; the queue remains available for retry.
  }
}
