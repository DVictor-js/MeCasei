import { router } from "expo-router";
import { useMoreViewModel } from "@/features/home/viewmodel/useMoreViewModel";
import {
  Screen,
  AppHeader,
  SectionHeader,
  ListRow,
  AppText,
  Button,
  ErrorMessage,
} from "@/shared/components/ui";
import { APP_NAME, APP_VERSION } from "@/core/theme/brand";
export default function More() {
  const { session, action, pending, linked, sync, logout } = useMoreViewModel();
  return (
    <Screen>
      <AppHeader title="Mais" subtitle="DO JEITO DE VOCÊS" />
      <SectionHeader title="Nosso casamento" />
      <ListRow
        title="Dados do casamento"
        icon="heart-outline"
        onPress={() => router.push("/wedding")}
      />
      <ListRow
        title="Eventos"
        icon="sparkles-outline"
        onPress={() => router.push("/events")}
      />
      <SectionHeader title="Organização" />
      <ListRow
        title="Compromissos"
        icon="calendar-outline"
        onPress={() => router.push("/appointments")}
      />
      <SectionHeader title="Sua conta" />
      {session.mode === "account" && session.user ? (
        <>
          <AppText>{session.user.name}</AppText>
          <AppText variant="bodySmall" muted>{session.user.email}</AppText>
          <AppText variant="bodySmall" muted>
            {linked ? (pending > 0 ? `${pending} alterações pendentes` : "Sincronizado") : "Planejamento apenas neste dispositivo"}
          </AppText>
          {!linked && <Button title="Salvar planejamento na conta" secondary onPress={() => router.push("/auth/import")} />}
          {linked && <Button title={action.busy ? "Sincronizando…" : "Sincronizar agora"} secondary disabled={action.busy} onPress={() => void sync()} />}
          <Button title="Sair da conta" secondary disabled={action.busy} onPress={() => void logout(() => router.replace("/auth"))} />
        </>
      ) : (
        <Button title="Entrar ou criar conta" secondary onPress={() => router.push("/auth")} />
      )}
      <ErrorMessage message={action.error} />
      <SectionHeader title={APP_NAME} />
      <ListRow
        title="Sobre"
        icon="information-circle-outline"
        onPress={() => router.push("/about")}
      />
      <AppText variant="caption" muted>
        Versão {APP_VERSION}
      </AppText>
    </Screen>
  );
}
