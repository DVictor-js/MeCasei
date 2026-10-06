import type { SQLiteDatabase } from "expo-sqlite";
import type { Appointment, WeddingEvent } from "@/shared/types/models";
import { writeTransaction } from "@/core/database/transaction";
import { persist, requireRelated } from "@/core/database/repository";
import { required, optional, isoTime } from "@/shared/models/validation";
export type EventInput = Pick<
  WeddingEvent,
  "title" | "description" | "event_date" | "location"
>;
export type AppointmentInput = Pick<
  Appointment,
  | "title"
  | "description"
  | "appointment_date"
  | "location"
  | "vendor_id"
  | "task_id"
>;
export async function saveEvent(
  db: SQLiteDatabase,
  weddingId: string,
  data: EventInput,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    result = await persist(
      tx,
      "wedding_events",
      weddingId,
      {
        title: required(data.title, "Nome"),
        description: optional(data.description),
        event_date: isoTime(data.event_date),
        location: optional(data.location),
      },
      id,
    );
  });
  return result;
}
export async function saveAppointment(
  db: SQLiteDatabase,
  weddingId: string,
  data: AppointmentInput,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "vendors", weddingId, data.vendor_id);
    await requireRelated(tx, "tasks", weddingId, data.task_id);
    result = await persist(
      tx,
      "appointments",
      weddingId,
      {
        title: required(data.title, "Título"),
        description: optional(data.description),
        appointment_date: isoTime(data.appointment_date),
        location: optional(data.location),
        vendor_id: data.vendor_id,
        task_id: data.task_id,
      },
      id,
    );
  });
  return result;
}
