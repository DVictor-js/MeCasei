import { useAuthViewModel } from "@/features/auth/viewmodel/useAuthViewModel";
import { router } from "expo-router";
import { Screen, AppHeader, AppText, Button, SectionHeader } from "@/shared/components/ui";
import { APP_NAME, APP_TAGLINE } from "@/core/theme/brand";

export default function AuthWelcome() {
  const {action,submit} = useAuthViewModel("local");
  return (
    <Screen>
      <AppHeader title={APP_NAME} subtitle="UM PLANO A DOIS" />
      <AppText variant="display">Um dia de vocês.{"\n"}Um plano a dois.</AppText>
      <AppText muted>{APP_TAGLINE}</AppText>
      <SectionHeader title="Seu planejamento, no seu ritmo" />
      <AppText muted>Entre para salvar uma cópia na sua conta ou siga usando este dispositivo.</AppText>
      <Button title="Entrar" onPress={() => router.push("/auth/login")} />
      <Button title="Criar conta" secondary onPress={() => router.push("/auth/register")} />
      <Button
        title={action.busy ? "Abrindo…" : "Continuar neste dispositivo"}
        secondary
        disabled={action.busy}
        onPress={() => void submit(() => router.replace("/"))}
      />
    </Screen>
  );
}
