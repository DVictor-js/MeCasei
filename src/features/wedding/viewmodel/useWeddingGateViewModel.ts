import { useWedding } from "@/features/wedding/model/WeddingProvider";
import { isConfigured } from "@/features/wedding/model/weddingService";
import { useSession } from "@/core/session/SessionProvider";

export function useWeddingGateViewModel() {
  const state = useWedding();
  return { ...state, configured: isConfigured(state.wedding), session: useSession() };
}
