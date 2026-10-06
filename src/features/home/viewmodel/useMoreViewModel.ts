import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useSession } from "@/core/session/SessionProvider";
import { useWedding } from "@/features/wedding/model/WeddingProvider";
import { useAction } from "@/shared/viewmodel/useAction";
import { pendingCount, getRemoteWeddingId } from "@/core/sync/localMapping";
import { syncPending } from "@/core/sync/syncCoordinator";
export function useMoreViewModel() {
  const db = useSQLiteContext();
  const session = useSession();
  const { wedding } = useWedding();
  const action = useAction();
  const [pending, setPending] = useState(0);
  const [linked, setLinked] = useState(false);
  const reload = useCallback(async () => {
    if (!session.user || !wedding) return;
    setPending(await pendingCount(db, session.user.id));
    setLinked(Boolean(await getRemoteWeddingId(db, session.user.id, wedding.id)));
  }, [db, session.user, wedding]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  async function sync() {
    await action.run(async () => {
      const result=await syncPending(db); await reload();
      if(result.error) throw new Error(result.error);
    }, "Sincronização verificada.");
  }
  async function logout(onSuccess: () => void) {
    await action.run(async () => { await session.logout(); onSuccess(); });
  }
  return {session,action,pending,linked,sync,logout};
}
