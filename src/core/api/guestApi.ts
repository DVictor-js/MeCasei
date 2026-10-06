import { apiRequest } from "@/core/api/apiClient";

export const guestApi = {
  list: (weddingId: string) => apiRequest<unknown[]>(`/weddings/${weddingId}/guests`),
  create: (weddingId: string, data: object) => apiRequest<{ id: string }>(`/weddings/${weddingId}/guests`, "POST", data),
  update: (id: string, data: object) => apiRequest<{ id: string }>(`/guests/${id}`, "PATCH", data),
  remove: (id: string) => apiRequest<void>(`/guests/${id}`, "DELETE"),
};
