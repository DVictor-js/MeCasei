import type { SQLiteDatabase } from "expo-sqlite";
import { addDays, daysUntil, localDay } from "@/shared/utils/dates";
const templates = [
  ["Definir orçamento inicial", "Financeiro", 0],
  ["Criar primeira lista de convidados", "Convidados", 0.05],
  ["Pesquisar espaço", "Local", 0.08],
  ["Pesquisar buffet", "Fornecedores", 0.14],
  ["Pesquisar fotografia e vídeo", "Fornecedores", 0.2],
  ["Definir estilo do casamento", "Festa", 0.25],
  ["Pesquisar decoração", "Festa", 0.32],
  ["Definir música", "Cerimônia", 0.4],
  ["Definir trajes", "Trajes", 0.48],
  ["Revisar documentação", "Documentação", 0.55],
  ["Confirmar fornecedores", "Fornecedores", 0.75],
  ["Revisar lista de convidados", "Convidados", 0.85],
] as const;
export function starterPlan(weddingDate: string, now = new Date()) {
  const today = localDay(now);
  const remaining = daysUntil(weddingDate, now);
  return templates.map(([title, category, fraction], index) => ({
    title,
    category,
    due_date:
      remaining < 0
        ? weddingDate
        : addDays(today, Math.floor(remaining * fraction)),
    priority: index < 3 ? ("high" as const) : ("medium" as const),
  }));
}
/** Called inside the onboarding transaction. The marker survives deletions of starter tasks. */
export async function generateInitialPlan(
  tx: SQLiteDatabase,
  weddingId: string,
  weddingDate: string,
  now = new Date(),
) {
  const row = await tx.getFirstAsync<{ planning_generated: number }>(
    "SELECT planning_generated FROM weddings WHERE id = ?",
    weddingId,
  );
  if (row?.planning_generated) return;
  const stamp = now.toISOString();
  for (const [index, task] of starterPlan(weddingDate, now).entries())
    await tx.runAsync(
      `INSERT OR IGNORE INTO tasks (id,wedding_id,title,category,due_date,priority,responsible,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'both','pending',?,?)`,
      `${weddingId}-starter-${index}`,
      weddingId,
      task.title,
      task.category,
      task.due_date,
      task.priority,
      stamp,
      stamp,
    );
  await tx.runAsync(
    "UPDATE weddings SET planning_generated = 1 WHERE id = ?",
    weddingId,
  );
}
