export function apiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!value || !/^https?:\/\/[^\s/]+/.test(value)) {
    throw new Error("Configure EXPO_PUBLIC_API_URL no arquivo .env do aplicativo.");
  }
  return value;
}
