import type { SQLiteDatabase } from "expo-sqlite";
import { listRecords } from "@/core/database/repository";
import { getWedding } from "@/features/wedding/model/weddingService";
import { getFinancialSummary, financialBalances } from "@/features/finances/model/financeService";
import { guestSummary } from "@/features/guests/model/guestService";
import { daysUntil, localDay } from "@/shared/utils/dates";
export async function loadPlanning(db: SQLiteDatabase) {
  const wedding = await getWedding(db);
  if (!wedding) throw new Error("Configure seu casamento para começar.");
  const [
    tasks,
    guests,
    groups,
    categories,
    vendors,
    payments,
    appointments,
    events,
    finance,
    guestStats,
  ] = await Promise.all([
    listRecords(db, "tasks", wedding.id),
    listRecords(db, "guests", wedding.id),
    listRecords(db, "guest_groups", wedding.id),
    listRecords(db, "budget_categories", wedding.id),
    listRecords(db, "vendors", wedding.id),
    listRecords(db, "payments", wedding.id),
    listRecords(db, "appointments", wedding.id),
    listRecords(db, "wedding_events", wedding.id),
    getFinancialSummary(db, wedding.id),
    guestSummary(db, wedding.id),
  ]);
  return {
    wedding,
    tasks,
    guests,
    groups,
    categories,
    vendors,
    payments,
    appointments,
    events,
    finance,
    guestStats,
    balances: financialBalances(wedding.budget_target_cents, finance),
  };
}
export type PlanningSnapshot = Awaited<ReturnType<typeof loadPlanning>>;
export type PriorityItem = {
  id: string;
  title: string;
  detail: string;
  route: string;
  rank: number;
  date: string;
};
export function homePriorities(
  data: PlanningSnapshot,
  now = new Date(),
): PriorityItem[] {
  const items: PriorityItem[] = [];
  for (const task of data.tasks.filter((t) => t.status === "pending")) {
    const days = task.due_date ? daysUntil(task.due_date, now) : Infinity;
    const rank =
      days < 0 ? 0 : task.priority === "high" ? 1 : days <= 7 ? 2 : 99;
    if (rank < 99)
      items.push({
        id: task.id,
        title: task.title,
        detail:
          days < 0
            ? "Tarefa atrasada"
            : task.priority === "high"
              ? "Prioridade alta"
              : "Próximos passos",
        route: `/tasks/${task.id}`,
        rank,
        date: task.due_date ?? "9999",
      });
  }
  for (const payment of data.payments.filter(
    (p) => p.status === "pending" && daysUntil(p.due_date, now) <= 14,
  ))
    items.push({
      id: payment.id,
      title: payment.title,
      detail:
        payment.due_date < localDay(now)
          ? "Pagamento atrasado"
          : "Pagamento próximo",
      route: `/payments/${payment.id}`,
      rank: 3,
      date: payment.due_date,
    });
  for (const appointment of data.appointments.filter(
    (a) =>
      a.appointment_date >= now.toISOString() &&
      daysUntil(localDay(new Date(a.appointment_date)), now) <= 7,
  ))
    items.push({
      id: appointment.id,
      title: appointment.title,
      detail: "Compromisso próximo",
      route: `/appointments/${appointment.id}`,
      rank: 4,
      date: appointment.appointment_date,
    });
  return items
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.date.localeCompare(b.date) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3);
}
export function upcomingAppointments(data: PlanningSnapshot, now = new Date()) {
  return data.appointments
    .filter((a) => a.appointment_date >= now.toISOString())
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
}
export function pendingPayments(data: PlanningSnapshot) {
  return data.payments
    .filter((p) => p.status === "pending")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}
