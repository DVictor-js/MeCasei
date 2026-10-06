import type { PlanningSnapshot } from "@/features/home/model/planningSnapshot";
import type { Table, Entities } from "@/core/database/repository";
export function recordsFor(
  data: PlanningSnapshot,
  kind: Table,
): Entities[Table][] {
  switch (kind) {
    case "tasks":
      return data.tasks;
    case "guests":
      return data.guests;
    case "guest_groups":
      return data.groups;
    case "budget_categories":
      return data.categories;
    case "vendors":
      return data.vendors;
    case "payments":
      return data.payments;
    case "appointments":
      return data.appointments;
    case "wedding_events":
      return data.events;
  }
}
