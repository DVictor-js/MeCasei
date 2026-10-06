import type { SQLiteDatabase } from "expo-sqlite";
import type { FinancialSummary, Vendor, Payment } from "@/shared/types/models";
import { writeTransaction } from "@/core/database/transaction";
import { persist, requireRelated } from "@/core/database/repository";
import { required, optional, money, isoDay, oneOf } from "@/shared/models/validation";
import { markDirty } from "@/core/sync/localMapping";
import { triggerSync } from "@/core/sync/trigger";
export async function getFinancialSummary(
  db: SQLiteDatabase,
  weddingId: string,
): Promise<FinancialSummary> {
  const row = await db.getFirstAsync<FinancialSummary>(
    `SELECT
 (SELECT COALESCE(SUM(planned_cents),0) FROM budget_categories WHERE wedding_id=$id) planned_cents,
 (SELECT COALESCE(SUM(total_cost_cents),0) FROM vendors WHERE wedding_id=$id AND status='contracted') contracted_cents,
 (SELECT COALESCE(SUM(amount_cents),0) FROM payments WHERE wedding_id=$id AND status='paid') paid_cents,
 (SELECT COALESCE(SUM(amount_cents),0) FROM payments WHERE wedding_id=$id AND status='pending') pending_cents`,
    { $id: weddingId },
  );
  if (!row) throw new Error("Não foi possível ler as finanças.");
  return row;
}
export function financialBalances(target: number, summary: FinancialSummary) {
  return {
    undistributed_cents: target - summary.planned_cents,
    balance_cents: summary.contracted_cents - summary.paid_cents,
    unscheduled_cents: Math.max(
      0,
      summary.contracted_cents - summary.paid_cents - summary.pending_cents,
    ),
  };
}
export async function saveBudgetCategory(
  db: SQLiteDatabase,
  weddingId: string,
  name: string,
  planned: number,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    const title = required(name, "Categoria");
    const duplicate = await tx.getFirstAsync<{ id: string }>(
      "SELECT id FROM budget_categories WHERE wedding_id=? AND lower(name)=lower(?) AND id!=?",
      weddingId,
      title,
      id ?? "",
    );
    if (duplicate) throw new Error("Já existe uma categoria com esse nome.");
    result = await persist(
      tx,
      "budget_categories",
      weddingId,
      { name: title, planned_cents: money(planned) },
      id,
    );
  });
  return result;
}
export type VendorInput = Pick<
  Vendor,
  | "budget_category_id"
  | "name"
  | "category"
  | "contact"
  | "total_cost_cents"
  | "status"
  | "notes"
>;
export async function saveVendor(
  db: SQLiteDatabase,
  weddingId: string,
  data: VendorInput,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    await requireRelated(
      tx,
      "budget_categories",
      weddingId,
      data.budget_category_id,
    );
    result = await persist(
      tx,
      "vendors",
      weddingId,
      {
        budget_category_id: data.budget_category_id,
        name: required(data.name, "Nome"),
        category: optional(data.category) ?? "Outros",
        contact: optional(data.contact),
        total_cost_cents: money(data.total_cost_cents),
        status: oneOf(data.status, [
          "researching",
          "negotiating",
          "contracted",
          "canceled",
        ]),
        notes: optional(data.notes),
      },
      id,
    );
  });
  return result;
}
export type PaymentInput = Pick<
  Payment,
  "title" | "amount_cents" | "due_date" | "vendor_id" | "budget_category_id"
>;
export async function savePayment(
  db: SQLiteDatabase,
  weddingId: string,
  data: PaymentInput,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "vendors", weddingId, data.vendor_id);
    await requireRelated(
      tx,
      "budget_categories",
      weddingId,
      data.budget_category_id,
    );
    result = await persist(
      tx,
      "payments",
      weddingId,
      {
        title: required(data.title, "Título"),
        amount_cents: money(data.amount_cents),
        due_date: isoDay(data.due_date),
        vendor_id: data.vendor_id,
        budget_category_id: data.budget_category_id,
      },
      id,
    );
  });
  return result;
}
export async function setPaymentPaid(
  db: SQLiteDatabase,
  weddingId: string,
  id: string,
  paid: boolean,
) {
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "payments", weddingId, id);
    const now = new Date().toISOString();
    await tx.runAsync(
      "UPDATE payments SET status=?,paid_date=?,updated_at=? WHERE id=? AND wedding_id=?",
      paid ? "paid" : "pending",
      paid ? now : null,
      now,
      id,
      weddingId,
    );
    await markDirty(tx, "payments", id, weddingId);
  });
  void triggerSync(db, weddingId);
}
