import type { SQLiteDatabase } from "expo-sqlite";
import { getSetting } from "@/core/database/settings";
import { writeTransaction } from "@/core/database/transaction";
import { apiRequest, ApiError } from "@/core/api/apiClient";
import { readSession } from "@/core/session/sessionStore";
import { getWedding } from "@/features/wedding/model/weddingService";
import { getMapping, getRemoteWeddingId, pendingCount, type SyncEntity } from "@/core/sync/localMapping";

type Row = { id: string; [key: string]: unknown };
const order = [
  "weddings", "budget_categories", "guest_groups", "wedding_events", "vendors",
  "tasks", "task_subtasks", "guests", "payments", "appointments",
] as const;
const paths: Record<string, string> = {
  budget_categories: "budget-categories",
  guest_groups: "guest-groups",
  wedding_events: "events",
  vendors: "vendors",
  tasks: "tasks",
  guests: "guests",
  payments: "payments",
  appointments: "appointments",
};
const fields: Record<string, readonly string[]> = {
  weddings: ["partner_one_name", "partner_two_name", "wedding_date", "city", "guest_target", "budget_target_cents", "onboarding_completed"],
  budget_categories: ["name", "planned_cents"],
  guest_groups: ["name"],
  wedding_events: ["title", "description", "event_date", "location"],
  vendors: ["budget_category_id", "name", "category", "contact", "total_cost_cents", "status", "notes"],
  tasks: ["title", "description", "category", "due_date", "status", "priority", "responsible", "related_vendor_id", "related_event_id", "completed_at"],
  task_subtasks: ["title", "completed", "sort_order"],
  guests: ["group_id", "name", "phone", "email", "rsvp_status", "companion_count", "dietary_restrictions", "table_name", "invitation_sent"],
  payments: ["vendor_id", "budget_category_id", "title", "amount_cents", "due_date", "paid_date", "status"],
  appointments: ["title", "description", "appointment_date", "location", "vendor_id", "task_id"],
};
const links: Record<string, string> = {
  budget_category_id: "budget_categories",
  group_id: "guest_groups",
  vendor_id: "vendors",
  related_vendor_id: "vendors",
  related_event_id: "wedding_events",
  task_id: "tasks",
};
const running = new WeakMap<SQLiteDatabase, Promise<SyncResult>>();

export interface SyncResult {
  synced: number;
  pending: number;
  error: string | null;
}

async function localRow(db: SQLiteDatabase, type: string, id: string): Promise<Row | null> {
  if (type === "task_subtasks")
    return db.getFirstAsync<Row>("SELECT * FROM task_subtasks WHERE id=?", id);
  if (type === "weddings")
    return db.getFirstAsync<Row>("SELECT * FROM weddings WHERE id=?", id);
  if (!fields[type] || type === "guest_event_invitations") return null;
  return db.getFirstAsync<Row>(`SELECT * FROM ${type} WHERE id=?`, id);
}

async function payload(db: SQLiteDatabase, accountId: string, type: string, row: Row): Promise<Record<string, unknown> | null> {
  const body: Record<string, unknown> = {};
  for (const field of fields[type]) {
    let value = row[field];
    if (value === undefined) continue;
    if (links[field] && value !== null) {
      const mapped = await getMapping(db, accountId, links[field], String(value));
      if (!mapped?.remote_id) return null;
      value = mapped.remote_id;
    }
    if (field === "paid_date" && typeof value === "string") value = value.slice(0, 10);
    if (field === "onboarding_completed" || field === "invitation_sent" || field === "completed")
      value = Boolean(value);
    body[field] = value;
  }
  return body;
}

async function setSynced(db: SQLiteDatabase, entity: SyncEntity, remoteId: string): Promise<void> {
  await writeTransaction(db, async (tx) => {
    await tx.runAsync(
      "UPDATE sync_entities SET remote_id=?,sync_status='synced',deleted=0,last_synced_at=? WHERE account_user_id=? AND entity_type=? AND local_id=?",
      remoteId, new Date().toISOString(), entity.account_user_id, entity.entity_type, entity.local_id,
    );
  });
}

async function removeMapping(db: SQLiteDatabase, entity: SyncEntity): Promise<void> {
  await writeTransaction(db, async (tx) => {
    await tx.runAsync("DELETE FROM sync_entities WHERE account_user_id=? AND entity_type=? AND local_id=?", entity.account_user_id, entity.entity_type, entity.local_id);
  });
}

async function syncGuestInvitations(db: SQLiteDatabase, accountId: string, guestLocalId: string, guestRemoteId: string) {
  const local = await db.getAllAsync<{ id: string; event_id: string; invited: number; rsvp_status: string }>(
    "SELECT id,event_id,invited,rsvp_status FROM guest_event_invitations WHERE guest_id=?", guestLocalId,
  );
  const remote = await apiRequest<{ id: string; event_id: string }[]>(`/guests/${guestRemoteId}/invitations`);
  const desired = new Set<string>();
  for (const item of local) {
    const event = await getMapping(db, accountId, "wedding_events", item.event_id);
    if (!event?.remote_id) continue;
    desired.add(event.remote_id);
    const saved = await apiRequest<{ id: string }>(`/guests/${guestRemoteId}/events/${event.remote_id}`, "PUT", {
      event_id: event.remote_id, invited: Boolean(item.invited), rsvp_status: item.rsvp_status,
    });
    await writeTransaction(db, async (tx) => {
      await tx.runAsync(
        `INSERT INTO sync_entities(account_user_id,entity_type,local_id,remote_id,sync_status,last_synced_at)
         VALUES (?,'guest_event_invitations',?,?,'synced',?)
         ON CONFLICT(account_user_id,entity_type,local_id)
         DO UPDATE SET remote_id=excluded.remote_id,sync_status='synced',last_synced_at=excluded.last_synced_at`,
        accountId, item.id, saved.id, new Date().toISOString(),
      );
    });
  }
  for (const item of remote) {
    if (!desired.has(item.event_id))
      await apiRequest<void>(`/guests/${guestRemoteId}/events/${item.event_id}`, "DELETE");
  }
}

async function syncOne(db: SQLiteDatabase, entity: SyncEntity, remoteWeddingId: string): Promise<boolean> {
  const type = entity.entity_type;
  const path = paths[type];
  if (entity.deleted) {
    if (entity.remote_id && path) await apiRequest<void>(`/${path}/${entity.remote_id}`, "DELETE");
    else if (entity.remote_id && type === "task_subtasks") await apiRequest<void>(`/subtasks/${entity.remote_id}`, "DELETE");
    await removeMapping(db, entity);
    return true;
  }
  const row = await localRow(db, type, entity.local_id);
  if (!row) return false;
  const body = await payload(db, entity.account_user_id, type, row);
  if (!body) return false;
  if (type === "weddings") {
    if (!entity.remote_id) return false;
    await apiRequest(`/weddings/${entity.remote_id}`, "PATCH", body);
    await setSynced(db, entity, entity.remote_id);
    return true;
  }
  if (type === "task_subtasks") {
    const parent = await getMapping(db, entity.account_user_id, "tasks", String(row.task_id));
    if (!parent?.remote_id) return false;
    const saved = entity.remote_id
      ? await apiRequest<{ id: string }>(`/subtasks/${entity.remote_id}`, "PATCH", body)
      : await apiRequest<{ id: string }>(`/tasks/${parent.remote_id}/subtasks`, "POST", body);
    await setSynced(db, entity, saved.id);
    return true;
  }
  if (!path) return false;
  const saved = entity.remote_id
    ? await apiRequest<{ id: string }>(`/${path}/${entity.remote_id}`, "PATCH", body)
    : await apiRequest<{ id: string }>(`/weddings/${remoteWeddingId}/${path}`, "POST", body);
  await setSynced(db, entity, saved.id);
  if (type === "guests") {
    try {
      await syncGuestInvitations(db, entity.account_user_id, entity.local_id, saved.id);
    } catch (cause) {
      await writeTransaction(db, async (tx) => {
        await tx.runAsync(
          "UPDATE sync_entities SET sync_status='dirty' WHERE account_user_id=? AND entity_type='guests' AND local_id=?",
          entity.account_user_id, entity.local_id,
        );
      });
      throw cause;
    }
  }
  return true;
}

async function run(db: SQLiteDatabase): Promise<SyncResult> {
  const accountId = await getSetting(db, "active_account_id");
  const session = await readSession();
  const wedding = await getWedding(db);
  if (!accountId || !session || session.user.id !== accountId || !wedding)
    return { synced: 0, pending: 0, error: null };
  const remoteWeddingId = await getRemoteWeddingId(db, accountId, wedding.id);
  if (!remoteWeddingId) return { synced: 0, pending: 0, error: null };
  const entities = await db.getAllAsync<SyncEntity>(
    "SELECT * FROM sync_entities WHERE account_user_id=? AND sync_status IN ('dirty','error')",
    accountId,
  );
  entities.sort((a, b) => order.indexOf(a.entity_type as typeof order[number]) - order.indexOf(b.entity_type as typeof order[number]));
  let synced = 0;
  let error: string | null = null;
  for (const entity of entities) {
    try {
      if (await syncOne(db, entity, remoteWeddingId)) synced++;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Sincronização pendente.";
      if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 401) {
        await writeTransaction(db, async (tx) => {
          await tx.runAsync("UPDATE sync_entities SET sync_status='error' WHERE account_user_id=? AND entity_type=? AND local_id=?", accountId, entity.entity_type, entity.local_id);
        });
      }
      if (!(cause instanceof ApiError) || cause.status === 0 || cause.status === 401) break;
    }
  }
  return { synced, pending: await pendingCount(db, accountId), error };
}

export function syncPending(db: SQLiteDatabase): Promise<SyncResult> {
  const existing = running.get(db);
  if (existing) return existing;
  const operation = run(db).finally(() => running.delete(db));
  running.set(db, operation);
  return operation;
}
