import { writeTransaction } from "@/core/database/transaction";
import type { SQLiteDatabase } from "expo-sqlite";
import type { Wedding } from "@/shared/types/models";
import { required, money, count, isoDay } from "@/shared/models/validation";
import { generateInitialPlan } from "@/features/planning/model/planningService";
import { markDirty } from "@/core/sync/localMapping";
import { triggerSync } from "@/core/sync/trigger";
export type WeddingInput = Pick<
  Wedding,
  | "partner_one_name"
  | "partner_two_name"
  | "wedding_date"
  | "city"
  | "guest_target"
  | "budget_target_cents"
>;
export function getWedding(db: SQLiteDatabase) {
  return db.getFirstAsync<Wedding>(
    "SELECT * FROM weddings ORDER BY created_at,id LIMIT 1",
  );
}
export function isConfigured(wedding: Wedding | null): boolean {
  return Boolean(
    wedding?.onboarding_completed &&
      wedding.partner_one_name.trim() &&
      wedding.partner_two_name.trim() &&
      wedding.wedding_date &&
      wedding.city?.trim() &&
      wedding.guest_target !== null,
  );
}
const categories = [
  "Local",
  "Buffet",
  "Fotografia",
  "Decoração",
  "Trajes",
  "Música",
  "Cerimônia",
  "Outros",
];
async function ensureWedding(tx: SQLiteDatabase) {
  const existing = await getWedding(tx);
  if (existing) return existing.id;
  const now = new Date().toISOString();
  const id = "local-wedding";
  await tx.runAsync(
    "INSERT INTO weddings (id,partner_one_name,partner_two_name,created_at,updated_at) VALUES (?,?,?,?,?)",
    id,
    "",
    "",
    now,
    now,
  );
  return id;
}
export async function saveWeddingDraft(
  db: SQLiteDatabase,
  data: Partial<WeddingInput>,
) {
  await writeTransaction(db, async (tx) => {
    const id = await ensureWedding(tx);
    const existing = await getWedding(tx);
    if (!existing) throw new Error("Não foi possível abrir o planejamento.");
    const merged = { ...existing, ...data };
    await tx.runAsync(
      "UPDATE weddings SET partner_one_name=?,partner_two_name=?,wedding_date=?,city=?,guest_target=?,budget_target_cents=?,updated_at=? WHERE id=?",
      merged.partner_one_name.trim(),
      merged.partner_two_name.trim(),
      merged.wedding_date,
      merged.city,
      merged.guest_target,
      merged.budget_target_cents,
      new Date().toISOString(),
      id,
    );
    await markDirty(tx, "weddings", id, id);
  });
  void triggerSync(db, (await getWedding(db))?.id ?? "");
}
function validate(input: WeddingInput) {
  return {
    partner_one_name: required(input.partner_one_name, "Seu nome"),
    partner_two_name: required(input.partner_two_name, "Nome do seu par"),
    wedding_date: isoDay(required(input.wedding_date ?? "", "Data")),
    city: required(input.city ?? "", "Cidade"),
    guest_target: count(input.guest_target ?? NaN),
    budget_target_cents: money(input.budget_target_cents),
  };
}
export async function saveWedding(db: SQLiteDatabase, input: WeddingInput) {
  await saveWeddingDraft(db, validate(input));
}
export async function completeOnboarding(
  db: SQLiteDatabase,
  input: WeddingInput,
) {
  const value = validate(input);
  await writeTransaction(db, async (tx) => {
    const id = await ensureWedding(tx);
    const now = new Date().toISOString();
    await tx.runAsync(
      "UPDATE weddings SET partner_one_name=?,partner_two_name=?,wedding_date=?,city=?,guest_target=?,budget_target_cents=?,updated_at=? WHERE id=?",
      value.partner_one_name,
      value.partner_two_name,
      value.wedding_date,
      value.city,
      value.guest_target,
      value.budget_target_cents,
      now,
      id,
    );
    for (const [index, name] of categories.entries())
      await tx.runAsync(
        "INSERT OR IGNORE INTO budget_categories (id,wedding_id,name,planned_cents,created_at,updated_at) VALUES (?,?,?,0,?,?)",
        `${id}-category-${index}`,
        id,
        name,
        now,
        now,
      );
    await generateInitialPlan(tx, id, value.wedding_date);
    await tx.runAsync(
      "UPDATE weddings SET onboarding_completed=1 WHERE id=?",
      id,
    );
  });
}
