import type { SQLiteDatabase } from "expo-sqlite";
import type { Guest, RSVPStatus, GuestEventInvitation } from "@/shared/types/models";
import { writeTransaction } from "@/core/database/transaction";
import { persist, requireRelated, newId } from "@/core/database/repository";
import { required, optional, count, oneOf } from "@/shared/models/validation";
export type GuestInput = Omit<
  Guest,
  "id" | "wedding_id" | "created_at" | "updated_at"
>;
export type InvitationInput = { event_id: string; rsvp_status: RSVPStatus };
export async function saveGroup(
  db: SQLiteDatabase,
  weddingId: string,
  name: string,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    const title = required(name, "Nome do grupo");
    const duplicate = await tx.getFirstAsync<{ id: string }>(
      "SELECT id FROM guest_groups WHERE wedding_id=? AND lower(name)=lower(?) AND id!=?",
      weddingId,
      title,
      id ?? "",
    );
    if (duplicate) throw new Error("Já existe um grupo com esse nome.");
    result = await persist(tx, "guest_groups", weddingId, { name: title }, id);
  });
  return result;
}
export async function saveGuest(
  db: SQLiteDatabase,
  weddingId: string,
  data: GuestInput,
  invitations: InvitationInput[],
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "guest_groups", weddingId, data.group_id);
    const email = optional(data.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Confira o e-mail.");
    result = await persist(
      tx,
      "guests",
      weddingId,
      {
        name: required(data.name, "Nome"),
        group_id: data.group_id,
        phone: optional(data.phone),
        email,
        rsvp_status: oneOf(data.rsvp_status, [
          "pending",
          "confirmed",
          "declined",
        ]),
        companion_count: count(data.companion_count),
        dietary_restrictions: optional(data.dietary_restrictions),
        table_name: optional(data.table_name),
        invitation_sent: data.invitation_sent ? 1 : 0,
      },
      id,
    );
    await tx.runAsync(
      "DELETE FROM guest_event_invitations WHERE guest_id=?",
      result,
    );
    const seen = new Set<string>();
    for (const invitation of invitations) {
      if (seen.has(invitation.event_id)) continue;
      seen.add(invitation.event_id);
      await requireRelated(
        tx,
        "wedding_events",
        weddingId,
        invitation.event_id,
      );
      await tx.runAsync(
        "INSERT INTO guest_event_invitations (id,guest_id,event_id,invited,rsvp_status) VALUES (?,?,?,1,?)",
        newId(),
        result,
        invitation.event_id,
        oneOf(invitation.rsvp_status, ["pending", "confirmed", "declined"]),
      );
    }
  });
  return result;
}
export async function guestInvitations(
  db: SQLiteDatabase,
  weddingId: string,
  id: string,
) {
  await requireRelated(db, "guests", weddingId, id);
  return db.getAllAsync<GuestEventInvitation>(
    "SELECT * FROM guest_event_invitations WHERE guest_id=? AND invited=1",
    id,
  );
}
export async function guestSummary(db: SQLiteDatabase, weddingId: string) {
  const row = await db.getFirstAsync<{
    records: number;
    people: number;
    confirmed: number;
    pending: number;
    declined: number;
    confirmed_people: number;
  }>(
    `SELECT COUNT(*) records,COALESCE(SUM(1+companion_count),0) people,COALESCE(SUM(rsvp_status='confirmed'),0) confirmed,COALESCE(SUM(rsvp_status='pending'),0) pending,COALESCE(SUM(rsvp_status='declined'),0) declined,COALESCE(SUM(CASE WHEN rsvp_status='confirmed' THEN 1+companion_count ELSE 0 END),0) confirmed_people FROM guests WHERE wedding_id=?`,
    weddingId,
  );
  if (!row) throw new Error("Não foi possível ler os convidados.");
  return row;
}
