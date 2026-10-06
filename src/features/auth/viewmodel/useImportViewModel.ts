import { useSQLiteContext } from "expo-sqlite";
import { useWedding } from "@/features/wedding/model/WeddingProvider";
import { useSession } from "@/core/session/SessionProvider";
import { useAction } from "@/shared/viewmodel/useAction";
import { importLocalWedding } from "@/core/sync/importLocal";
export function useImportViewModel() {
  const db=useSQLiteContext();
  const {wedding}=useWedding();
  const session=useSession();
  const action=useAction();
  async function save(onSuccess: () => void) {
    if(!session.user) return;
    await action.run(async () => { await importLocalWedding(db,session.user!.id); onSuccess(); }, "Planejamento salvo na sua conta.");
  }
  async function skip(onSuccess: () => void) {
    await action.run(async () => { await session.skipImport(); onSuccess(); });
  }
  return {wedding,user:session.user,action,save,skip};
}
