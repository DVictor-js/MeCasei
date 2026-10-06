import { apiBaseUrl } from "@/core/api/config";
import { clearSession, readSession, saveSession } from "@/core/session/sessionStore";
import type { TokenPair } from "@/core/api/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let refreshing: Promise<string> | null = null;

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function refreshAccess(): Promise<string> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const session = await readSession();
    if (!session) throw new ApiError("Entre novamente na sua conta.", 401);
    const response = await fetchWithTimeout(`${apiBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!response.ok) {
      if (response.status === 401) await clearSession();
      throw new ApiError("Entre novamente na sua conta.", response.status);
    }
    const tokens = (await response.json()) as TokenPair;
    await saveSession({ ...session, ...tokens });
    return tokens.access_token;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  authenticated = true,
): Promise<T> {
  const url = `${apiBaseUrl()}/api/v1${path}`;
  const session = authenticated ? await readSession() : null;
  if (authenticated && !session)
    throw new ApiError("Entre para salvar dados na sua conta.", 401);
  const send = (token?: string) =>
    fetchWithTimeout(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  let response: Response;
  try {
    response = await send(session?.access_token);
    if (response.status === 401 && authenticated)
      response = await send(await refreshAccess());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Sem conexão com o servidor. Seus dados locais foram mantidos.", 0);
  }
  if (!response.ok) {
    let detail = "Não foi possível concluir a operação no servidor.";
    try {
      const payload = (await response.json()) as { detail?: string };
      if (typeof payload.detail === "string") detail = payload.detail;
    } catch {
      // Keep the generic message when the server has no JSON body.
    }
    throw new ApiError(detail, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
