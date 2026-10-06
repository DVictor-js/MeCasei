import { apiRequest } from "@/core/api/apiClient";

export const taskApi = {
  list: (weddingId: string) => apiRequest<unknown[]>(`/weddings/${weddingId}/tasks`),
  create: (weddingId: string, data: object) => apiRequest<{ id: string }>(`/weddings/${weddingId}/tasks`, "POST", data),
  update: (id: string, data: object) => apiRequest<{ id: string }>(`/tasks/${id}`, "PATCH", data),
  remove: (id: string) => apiRequest<void>(`/tasks/${id}`, "DELETE"),
  createSubtask: (taskId: string, data: object) => apiRequest<{ id: string }>(`/tasks/${taskId}/subtasks`, "POST", data),
};
