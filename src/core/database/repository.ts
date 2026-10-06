import type { SQLiteDatabase, SQLiteBindValue } from "expo-sqlite";
import type {
  Task,
  Guest,
  GuestGroup,
  BudgetCategory,
  Vendor,
  Payment,
  Appointment,
  WeddingEvent,
} from "@/shared/types/models";
import { writeTransaction } from "@/core/database/transaction";
import { markDirty } from "@/core/sync/localMapping";
import { triggerSync } from "@/core/sync/trigger";
export interface Entities {
  tasks: Task;
  guests: Guest;
  guest_groups: GuestGroup;
  budget_categories: BudgetCategory;
  vendors: Vendor;
  payments: Payment;
  appointments: Appointment;
  wedding_events: WeddingEvent;
}
export type Table = keyof Entities;
const tables: readonly Table[] = [
  "tasks",
  "guests",
  "guest_groups",
  "budget_categories",
  "vendors",
  "payments",
  "appointments",
  "wedding_events",
];
function safe(table: Table) {
  if (!tables.includes(table)) throw new Error("Coleção inválida.");
  return table;
}
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
export function listRecords<K extends Table>(
  db: SQLiteDatabase,
  table: K,
  weddingId: string,
): Promise<Entities[K][]> {
  return db.getAllAsync<Entities[K]>(
    `SELECT * FROM ${safe(table)} WHERE wedding_id = ? ORDER BY created_at, id`,
    weddingId,
  );
}
export function getRecord<K extends Table>(
  db: SQLiteDatabase,
  table: K,
  weddingId: string,
  id: string,
): Promise<Entities[K] | null> {
  return db.getFirstAsync<Entities[K]>(
    `SELECT * FROM ${safe(table)} WHERE wedding_id = ? AND id = ?`,
    weddingId,
    id,
  );
}
export async function requireRelated(
  db: SQLiteDatabase,
  table: Table,
  weddingId: string,
  id?: string | null,
) {
  if (id && !(await getRecord(db, table, weddingId, id)))
    throw new Error("O item relacionado não está mais disponível.");
}
/** Internal write primitive. Field names come only from domain services, never form input. */
export async function persist(
  db: SQLiteDatabase,
  table: Table,
  weddingId: string,
  values: Record<string, SQLiteBindValue>,
  id?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const keys = Object.keys(values);
  const args = Object.values(values);
  if (id) {
    await requireRelated(db, table, weddingId, id);
    if (table !== "guest_groups") {
      keys.push("updated_at");
      args.push(now);
    }
    await db.runAsync(
      `UPDATE ${safe(table)} SET ${keys.map((key) => `${key} = ?`).join(",")} WHERE id = ? AND wedding_id = ?`,
      ...args,
      id,
      weddingId,
    );
    await markDirty(db, table, id, weddingId);
    return id;
  }
  const recordId = newId();
  const columns = ["id", "wedding_id", ...keys, "created_at"];
  const parameters: SQLiteBindValue[] = [recordId, weddingId, ...args, now];
  if (table !== "guest_groups") {
    columns.push("updated_at");
    parameters.push(now);
  }
  await db.runAsync(
    `INSERT INTO ${safe(table)} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
    ...parameters,
  );
  await markDirty(db, table, recordId, weddingId);
  return recordId;
}
export async function deleteRecord(
  db: SQLiteDatabase,
  table: Table,
  weddingId: string,
  id: string,
) {
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, table, weddingId, id);
    await markDirty(tx, table, id, weddingId, true);
    await tx.runAsync(
      `DELETE FROM ${safe(table)} WHERE wedding_id = ? AND id = ?`,
      weddingId,
      id,
    );
  });
  void triggerSync(db, weddingId);
}
