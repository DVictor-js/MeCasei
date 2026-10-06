import { apiRequest } from "@/core/api/apiClient";
import type { Wedding } from "@/shared/types/models";

export interface RemoteWedding extends Omit<Wedding, "id" | "onboarding_completed" | "planning_generated"> {
  id: string;
  onboarding_completed: boolean;
}

export const weddingApi = {
  list: () => apiRequest<RemoteWedding[]>("/weddings"),
  get: (id: string) => apiRequest<RemoteWedding>(`/weddings/${id}`),
  update: (id: string, data: object) => apiRequest<RemoteWedding>(`/weddings/${id}`, "PATCH", data),
};
