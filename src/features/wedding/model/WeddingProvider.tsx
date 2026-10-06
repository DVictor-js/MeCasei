import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { Wedding } from "@/shared/types/models";
import { getWedding } from "@/features/wedding/model/weddingService";
interface WeddingState {
  wedding: Wedding | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
const Context = createContext<WeddingState | null>(null);
export function WeddingProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => getWedding(db)
    .then((next) => { setWedding(next); setError(null); })
    .catch(() => setError("Não foi possível ler seu planejamento. Tente novamente."))
    .finally(() => setLoading(false)), [db]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <Context.Provider value={{ wedding, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useWedding() {
  const value = useContext(Context);
  if (!value) throw new Error("useWedding requires WeddingProvider");
  return value;
}
