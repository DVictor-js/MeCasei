import type { SQLiteDatabase } from "expo-sqlite";

const pending = new WeakMap<SQLiteDatabase, Promise<void>>();

/**
 * Serialize service writes on the provider connection, where foreign_keys is ON.
 * Expo's exclusive helper opens another connection with separate PRAGMA state.
 * All future writes must use this helper; do not nest these transactions.
 */
export async function writeTransaction(
  db: SQLiteDatabase,
  work: (tx: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  const previous = pending.get(db) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => db.withTransactionAsync(() => work(db)));
  pending.set(db, next);
  try {
    await next;
  } finally {
    if (pending.get(db) === next) pending.delete(db);
  }
}
