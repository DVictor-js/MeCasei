import type { Table, Entities } from "@/core/database/repository";
import { formatDateTime, dueLabel } from "@/shared/utils/dates";
import { centsToBRL } from "@/shared/utils/money";
import { optionLabel, vendorStatuses } from "@/core/theme/options";
export function titleOf(record: Entities[Table]) {
  return "name" in record ? record.name : record.title;
}
export function detailOf(record: Entities[Table]) {
  if ("appointment_date" in record)
    return `${formatDateTime(record.appointment_date)}${record.location ? " · " + record.location : ""}`;
  if ("event_date" in record)
    return `${formatDateTime(record.event_date)}${record.location ? " · " + record.location : ""}`;
  if ("amount_cents" in record)
    return `${centsToBRL(record.amount_cents)} · ${record.status === "paid" ? "Pago" : dueLabel(record.due_date)}`;
  if ("total_cost_cents" in record)
    return `${optionLabel(vendorStatuses, record.status)} · ${centsToBRL(record.total_cost_cents)}`;
  return undefined;
}
export function sortDate(record: Entities[Table]) {
  return "appointment_date" in record
    ? record.appointment_date
    : "event_date" in record
      ? record.event_date
      : "due_date" in record
        ? (record.due_date ?? "9999")
        : titleOf(record);
}
