import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { isConfigured } from "@/features/wedding/model/weddingService";
import { useWedding } from "@/features/wedding/model/WeddingProvider";
import { useSession } from "@/core/session/SessionProvider";
import { getSetting } from "@/core/database/settings";
import { getRemoteWeddingId } from "@/core/sync/localMapping";
export function useStartupViewModel() {
  const { wedding, loading, error, refresh } = useWedding();
  const session = useSession();
  const db = useSQLiteContext();
  const [needsImport, setNeedsImport] = useState<boolean | null>(null);
  useEffect(() => {
    if (session.mode !== "account" || !session.user || !wedding || !isConfigured(wedding)) return;
    let alive = true;
    void (async () => {
      const linked = await getRemoteWeddingId(db, session.user!.id, wedding.id);
      const skipped = await getSetting(db, `skip_import_${session.user!.id}`);
      if (alive) setNeedsImport(!linked && skipped !== "1");
    })();
    return () => { alive = false; };
  }, [db, wedding, session.mode, session.user]);
  return {wedding,loading,error,refresh,session,needsImport,configured:isConfigured(wedding)};
}
