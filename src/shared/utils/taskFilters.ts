import type { Task } from "@/shared/types/models";
import { daysUntil } from "@/shared/utils/dates";
export function filterTasks(tasks: Task[], filter: string, now = new Date()) {
  return tasks
    .filter((task) => {
      if (filter === "all") return true;
      if (filter === "done") return task.status === "completed";
      if (task.status === "completed") return false;
      const days = task.due_date ? daysUntil(task.due_date, now) : Infinity;
      return filter === "now"
        ? days <= 7 || task.priority === "high"
        : days > 7;
    })
    .sort(
      (a, b) =>
        Number(a.status === "completed") - Number(b.status === "completed") ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        a.title.localeCompare(b.title),
    );
}
