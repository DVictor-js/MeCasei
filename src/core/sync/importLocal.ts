import type { SQLiteDatabase } from "expo-sqlite";
import type { Wedding } from "@/shared/types/models";
import { getSetting, setSetting } from "@/core/database/settings";
import { apiRequest } from "@/core/api/apiClient";
import type { ImportResult } from "@/core/api/types";
import { getWedding } from "@/features/wedding/model/weddingService";
import { newId } from "@/core/database/repository";
import { saveImportMapping } from "@/core/sync/localMapping";

type LocalRecord = { id: string; [key: string]: unknown };
type ImportItem = { local_id: string; data: LocalRecord };

const directTables = [
  "budget_categories",
  "guest_groups",
  "wedding_events",
  "vendors",
  "tasks",
  "guests",
  "payments",
  "appointments",
] as const;

function items(rows: LocalRecord[]): ImportItem[] {
  return rows.map((row) => ({
    local_id: row.id,
    data:
      typeof row.paid_date === "string"
        ? { ...row, paid_date: row.paid_date.slice(0, 10) }
        : row,
  }));
}

export async function buildLocalImport(db: SQLiteDatabase, wedding: Wedding) {
  const result: Record<string, ImportItem[] | ImportItem | string> = {
    wedding: { local_id: wedding.id, data: wedding as unknown as LocalRecord },
  };
  let importId = await getSetting(db, "client_import_id");
  if (!importId) {
    importId = `device-${newId()}-${wedding.id}`;
    await setSetting(db, "client_import_id", importId);
  }
  result.client_import_id = importId;
  for (const table of directTables) {
    result[table] = items(
      await db.getAllAsync<LocalRecord>(
        `SELECT * FROM ${table} WHERE wedding_id=? ORDER BY created_at,id`,
        wedding.id,
      ),
    );
  }
  result.task_subtasks = items(
    await db.getAllAsync<LocalRecord>(
      "SELECT s.* FROM task_subtasks s JOIN tasks t ON t.id=s.task_id WHERE t.wedding_id=? ORDER BY s.created_at,s.id",
      wedding.id,
    ),
  );
  result.guest_event_invitations = items(
    await db.getAllAsync<LocalRecord>(
      "SELECT i.* FROM guest_event_invitations i JOIN guests g ON g.id=i.guest_id WHERE g.wedding_id=? ORDER BY i.id",
      wedding.id,
    ),
  );
  return result;
}

export async function importLocalWedding(db: SQLiteDatabase, accountId: string): Promise<ImportResult> {
  const wedding = await getWedding(db);
  if (!wedding) throw new Error("Nenhum planejamento local foi encontrado.");
  const bundle = await buildLocalImport(db, wedding);
  const result = await apiRequest<ImportResult>("/imports", "POST", bundle);
  await saveImportMapping(db, accountId, result);
  return result;
}
