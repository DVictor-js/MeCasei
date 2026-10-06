import { Platform } from "react-native";
import type { UserProfile } from "@/core/api/types";

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

const KEY = "mecasei_session_v1";
let memory: StoredSession | null = null;

export async function readSession(): Promise<StoredSession | null> {
  if (memory) return memory;
  if (Platform.OS === "web") return null;
  const SecureStore = await import("expo-secure-store");
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.access_token || !parsed.refresh_token || !parsed.user?.id)
      return null;
    memory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(value: StoredSession): Promise<void> {
  if (Platform.OS !== "web") {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(KEY, JSON.stringify(value));
  }
  memory = value;
}

export async function clearSession(): Promise<void> {
  if (Platform.OS !== "web") {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(KEY);
  }
  memory = null;
}
