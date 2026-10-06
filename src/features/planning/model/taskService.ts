import type { SQLiteDatabase } from "expo-sqlite";
import type { Task, TaskSubtask } from "@/shared/types/models";
import { writeTransaction } from "@/core/database/transaction";
import { persist, requireRelated, newId } from "@/core/database/repository";
import { required, optional, isoDay, oneOf } from "@/shared/models/validation";
import { markDirty } from "@/core/sync/localMapping";
import { triggerSync } from "@/core/sync/trigger";
export type TaskInput = Pick<
  Task,
  "title" | "description" | "category" | "due_date" | "priority" | "responsible"
>;
export async function saveTask(
  db: SQLiteDatabase,
  weddingId: string,
  data: TaskInput,
  id?: string,
) {
  let result = "";
  await writeTransaction(db, async (tx) => {
    result = await persist(
      tx,
      "tasks",
      weddingId,
      {
        title: required(data.title, "Título"),
        description: optional(data.description),
        category: required(data.category, "Categoria"),
        due_date: data.due_date ? isoDay(data.due_date) : null,
        priority: oneOf(data.priority, ["low", "medium", "high"]),
        responsible: oneOf(data.responsible, ["self", "partner", "both"]),
      },
      id,
    );
  });
  return result;
}
export async function setTaskCompleted(
  db: SQLiteDatabase,
  weddingId: string,
  id: string,
  completed: boolean,
) {
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "tasks", weddingId, id);
    const now = new Date().toISOString();
    await tx.runAsync(
      "UPDATE tasks SET status=?,completed_at=?,updated_at=? WHERE id=? AND wedding_id=?",
      completed ? "completed" : "pending",
      completed ? now : null,
      now,
      id,
      weddingId,
    );
    await markDirty(tx, "tasks", id, weddingId);
  });
  void triggerSync(db, weddingId);
}
export async function listSubtasks(
  db: SQLiteDatabase,
  weddingId: string,
  taskId: string,
) {
  await requireRelated(db, "tasks", weddingId, taskId);
  return db.getAllAsync<TaskSubtask>(
    "SELECT * FROM task_subtasks WHERE task_id=? ORDER BY sort_order,created_at",
    taskId,
  );
}
export async function addSubtask(
  db: SQLiteDatabase,
  weddingId: string,
  taskId: string,
  title: string,
) {
  const id = newId();
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "tasks", weddingId, taskId);
    await tx.runAsync(
      "INSERT INTO task_subtasks (id,task_id,title,sort_order,created_at) VALUES (?,?,?,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM task_subtasks WHERE task_id=?),?)",
      id,
      taskId,
      required(title, "Subtarefa"),
      taskId,
      new Date().toISOString(),
    );
    await markDirty(tx, "task_subtasks", id, weddingId);
  });
  void triggerSync(db, weddingId);
  return id;
}
export async function changeSubtask(
  db: SQLiteDatabase,
  weddingId: string,
  taskId: string,
  id: string,
  action: "complete" | "reopen" | "delete",
) {
  await writeTransaction(db, async (tx) => {
    await requireRelated(tx, "tasks", weddingId, taskId);
    if (action === "delete")
      {
        await markDirty(tx, "task_subtasks", id, weddingId, true);
        await tx.runAsync(
          "DELETE FROM task_subtasks WHERE id=? AND task_id=?",
          id,
          taskId,
        );
      }
    else
      {
        await tx.runAsync(
          "UPDATE task_subtasks SET completed=? WHERE id=? AND task_id=?",
          action === "complete" ? 1 : 0,
          id,
          taskId,
        );
        await markDirty(tx, "task_subtasks", id, weddingId);
      }
  });
  void triggerSync(db, weddingId);
}
