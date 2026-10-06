import { apiRequest } from "@/core/api/apiClient";

export interface RemoteBudget {
  budget_target_cents: number;
  distributed_cents: number;
  undistributed_cents: number;
  contracted_cents: number;
  paid_cents: number;
  pending_installments_cents: number;
  remaining_contracted_cents: number;
}

export const financeApi = {
  budget: (weddingId: string) => apiRequest<RemoteBudget>(`/weddings/${weddingId}/budget`),
  vendors: (weddingId: string) => apiRequest<unknown[]>(`/weddings/${weddingId}/vendors`),
  payments: (weddingId: string) => apiRequest<unknown[]>(`/weddings/${weddingId}/payments`),
};
