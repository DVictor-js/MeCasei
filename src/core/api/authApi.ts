import { apiRequest, fetchWithTimeout } from "@/core/api/apiClient";
import { clearSession, readSession, saveSession } from "@/core/session/sessionStore";
import { apiBaseUrl } from "@/core/api/config";
import type { TokenPair, UserProfile } from "@/core/api/types";

// Kept separate so credentials are sent only to this authenticated endpoint.
async function profileWithAccess(accessToken: string): Promise<UserProfile> {
  const response = await fetchWithTimeout(`${apiBaseUrl()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Não foi possível abrir a sessão.");
  return (await response.json()) as UserProfile;
}

export async function register(name: string, email: string, password: string) {
  const tokens = await apiRequest<TokenPair>("/auth/register", "POST", { name, email, password }, false);
  const user = await profileWithAccess(tokens.access_token);
  const session = { ...tokens, user };
  await saveSession(session);
  return session;
}

export async function login(email: string, password: string) {
  const tokens = await apiRequest<TokenPair>("/auth/login", "POST", { email, password }, false);
  const user = await profileWithAccess(tokens.access_token);
  const session = { ...tokens, user };
  await saveSession(session);
  return session;
}

export async function logout(): Promise<void> {
  if (await readSession()) {
    try {
      await apiRequest<void>("/auth/logout", "POST");
    } catch {
      // Local session is still cleared when offline.
    }
  }
  await clearSession();
}
