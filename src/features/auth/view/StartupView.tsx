import { Redirect } from "expo-router";
import { StartupState } from "@/shared/components/StartupState";
import { useStartupViewModel } from "@/features/auth/viewmodel/useStartupViewModel";
export default function StartupView() {
  const {loading,error,refresh,session,needsImport,configured} = useStartupViewModel();
  if (loading || error || session.mode === "loading")
    return <StartupState error={error} retry={() => void refresh()} />;
  if (session.mode === "guest") return <Redirect href="/auth" />;
  if (session.mode === "account" && configured) {
    if (needsImport === null) return <StartupState />;
    if (needsImport) return <Redirect href="/auth/import" />;
  }
  return <Redirect href={configured ? "/(tabs)" : "/onboarding"} />;
}
