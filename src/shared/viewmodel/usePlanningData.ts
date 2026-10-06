import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  loadPlanning,
  type PlanningSnapshot,
} from "@/features/home/model/planningSnapshot";
export function usePlanningData() {
  const db = useSQLiteContext();
  const [data, setData] = useState<PlanningSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(false);
  const reload = useCallback(async () => {
    try {
      const next = await loadPlanning(db);
      if (alive.current) {
        setData(next);
        setError(null);
      }
    } catch {
      if (alive.current)
        setError("Não foi possível carregar. Tente novamente.");
    }
  }, [db]);
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      void reload();
      const timer = setInterval(() => void reload(), 60000);
      return () => {
        alive.current = false;
        clearInterval(timer);
      };
    }, [reload]),
  );
  return { data, error, reload, refresh: reload, loading: !data, db };
}
