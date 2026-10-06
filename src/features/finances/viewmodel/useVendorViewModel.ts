import type { PlanningSnapshot } from "@/features/home/model/planningSnapshot";
import type { Vendor } from "@/shared/types/models";
export function useVendorViewModel(data: PlanningSnapshot, vendor: Vendor) {
  const payments = data.payments.filter((p) => p.vendor_id === vendor.id);
  const paid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_cents, 0);
  const pending = payments
    .filter((p) => p.status === "pending")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const balance = vendor.total_cost_cents - paid;
  const next = data.appointments
    .filter(
      (a) =>
        a.vendor_id === vendor.id &&
        a.appointment_date >= new Date().toISOString(),
    )
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];
  return { payments, paid, pending, balance, next };
}
