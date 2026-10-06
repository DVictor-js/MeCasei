import type { SQLiteDatabase } from "expo-sqlite";
import type { Table, Entities } from "@/core/database/repository";
import type { FormValues } from "@/shared/models/entityDefinitions";
import { formDefaults } from "@/shared/models/entityDefinitions";
import type {
  Priority,
  Responsible,
  RSVPStatus,
  VendorStatus,
} from "@/shared/types/models";
import { saveTask } from "@/features/planning/model/taskService";
import { saveGuest, saveGroup, type InvitationInput } from "@/features/guests/model/guestService";
import { saveEvent, saveAppointment } from "@/features/organization/model/organizationService";
import { saveVendor, savePayment, saveBudgetCategory } from "@/features/finances/model/financeService";
import { inputToCents, centsToBRL } from "@/shared/utils/money";
import {
  dateInput,
  timeInput,
  parseDateInput,
  parseDateTime,
} from "@/shared/utils/dates";
export function valuesFromRecord(
  kind: Table,
  record: Entities[Table],
): FormValues {
  const value = formDefaults(kind);
  for (const [key, item] of Object.entries(record))
    value[key] =
      item === null
        ? ""
        : key.endsWith("_cents") && typeof item === "number"
          ? centsToBRL(item)
          : String(item);
  for (const key of ["due_date", "event_date", "appointment_date"])
    if (value[key]) {
      if (key !== "due_date") value.time = timeInput(value[key]);
      value[key] = dateInput(value[key]);
    }
  return value;
}
function amount(value: string) {
  const cents = inputToCents(value);
  if (cents === null)
    throw new Error("Informe um valor válido, como 2.500,00.");
  return cents;
}
function date(value: string) {
  const iso = parseDateInput(value);
  if (!iso) throw new Error("Confira a data: DD/MM/AAAA.");
  return iso;
}
function datetime(value: string, time: string) {
  const iso = parseDateTime(value, time);
  if (!iso) throw new Error("Confira a data e o horário (DD/MM/AAAA e HH:MM).");
  return iso;
}
export async function saveEditor(
  db: SQLiteDatabase,
  kind: Table,
  weddingId: string,
  f: FormValues,
  id?: string,
  invitations: InvitationInput[] = [],
): Promise<string> {
  const v = (key: string) => f[key] ?? "";
  const link = (key: string) => v(key) || null;
  switch (kind) {
    case "tasks":
      return saveTask(
        db,
        weddingId,
        {
          title: v("title"),
          description: v("description"),
          category: v("category"),
          due_date: v("due_date") ? date(v("due_date")) : null,
          priority: v("priority") as Priority,
          responsible: v("responsible") as Responsible,
        },
        id,
      );
    case "guests":
      if (!/^\d+$/.test(v("companion_count")))
        throw new Error("Acompanhantes deve ser um número inteiro.");
      return saveGuest(
        db,
        weddingId,
        {
          name: v("name"),
          group_id: link("group_id"),
          phone: v("phone"),
          email: v("email"),
          rsvp_status: v("rsvp_status") as RSVPStatus,
          companion_count: Number(v("companion_count")),
          dietary_restrictions: v("dietary_restrictions"),
          table_name: v("table_name"),
          invitation_sent: v("invitation_sent") === "1" ? 1 : 0,
        },
        invitations,
        id,
      );
    case "guest_groups":
      return saveGroup(db, weddingId, v("name"), id);
    case "wedding_events":
      return saveEvent(
        db,
        weddingId,
        {
          title: v("title"),
          event_date: datetime(v("event_date"), v("time")),
          location: v("location"),
          description: v("description"),
        },
        id,
      );
    case "appointments":
      return saveAppointment(
        db,
        weddingId,
        {
          title: v("title"),
          appointment_date: datetime(v("appointment_date"), v("time")),
          location: v("location"),
          description: v("description"),
          vendor_id: link("vendor_id"),
          task_id: link("task_id"),
        },
        id,
      );
    case "vendors":
      return saveVendor(
        db,
        weddingId,
        {
          name: v("name"),
          budget_category_id: link("budget_category_id"),
          category: v("category"),
          contact: v("contact"),
          total_cost_cents: amount(v("total_cost_cents")),
          status: v("status") as VendorStatus,
          notes: v("notes"),
        },
        id,
      );
    case "payments":
      return savePayment(
        db,
        weddingId,
        {
          title: v("title"),
          amount_cents: amount(v("amount_cents")),
          due_date: date(v("due_date")),
          vendor_id: link("vendor_id"),
          budget_category_id: link("budget_category_id"),
        },
        id,
      );
    case "budget_categories":
      return saveBudgetCategory(
        db,
        weddingId,
        v("name"),
        amount(v("planned_cents")),
        id,
      );
  }
}
