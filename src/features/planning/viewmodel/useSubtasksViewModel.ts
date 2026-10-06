import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import type { TaskSubtask } from "@/shared/types/models";
import { addSubtask, listSubtasks, changeSubtask } from "@/features/planning/model/taskService";
import { useAction } from "@/shared/viewmodel/useAction";
export function useSubtasksViewModel(weddingId: string, taskId: string) {
  const db=useSQLiteContext();
  const [items, setItems] = useState<TaskSubtask[]>([]);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const action = useAction();
  const reload = useCallback(async () => {
    try {
      setItems(await listSubtasks(db, weddingId, taskId));
      setLoadError(null);
    } catch {
      setLoadError("Não foi possível ler as subtarefas.");
    }
  }, [db, weddingId, taskId]);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  async function toggle(item: TaskSubtask) {
    await action.run(async () => { await changeSubtask(db,weddingId,taskId,item.id,item.completed ? "reopen" : "complete"); await reload(); }, "Subtarefa atualizada.");
  }
  async function remove(item: TaskSubtask) {
    await action.run(async () => { await changeSubtask(db,weddingId,taskId,item.id,"delete"); await reload(); }, "Subtarefa excluída.");
  }
  async function add() {
    await action.run(async () => { await addSubtask(db,weddingId,taskId,title); setTitle(""); await reload(); }, "Subtarefa adicionada.");
  }
  return {items,title,setTitle,loadError,action,reload,toggle,remove,add,completed:items.filter(s=>s.completed).length};
}
