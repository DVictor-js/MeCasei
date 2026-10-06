import { useState } from "react";
import { usePlanningData } from "@/shared/viewmodel/usePlanningData";
import { useAction } from "@/shared/viewmodel/useAction";
import { setTaskCompleted } from "@/features/planning/model/taskService";
import { filterTasks } from "@/shared/utils/taskFilters";
import type { Task } from "@/shared/types/models";
export function usePlanningViewModel() {
  const state = usePlanningData();
  const [filter, setFilter] = useState("now");
  const action = useAction();
  const data = state.data;
  const done = data?.tasks.filter(t => t.status === "completed").length ?? 0;
  async function toggleTask(task: Task) {
    if (!data) return;
    await action.run(async () => {
      await setTaskCompleted(state.db, data.wedding.id, task.id, task.status !== "completed");
      await state.reload();
    }, task.status === "completed" ? "Tarefa reaberta." : "Mais um passo concluído.");
  }
  return { ...state, loading: !data, error: state.error ?? action.error,
    busy: action.busy, filter, setFilter, done, tasks: data ? filterTasks(data.tasks, filter) : [],
    progress: data?.tasks.length ? done / data.tasks.length : 0, toggleTask };
}
