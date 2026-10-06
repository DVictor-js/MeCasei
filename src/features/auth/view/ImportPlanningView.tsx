import { useImportViewModel } from "@/features/auth/viewmodel/useImportViewModel";
import { router } from "expo-router";
import { Screen, AppHeader, AppText, Button, ErrorMessage } from "@/shared/components/ui";

export default function ImportPlanning() {
  const {wedding,user,action,save,skip} = useImportViewModel();
  if (!wedding || !user) return null;
  return (
    <Screen>
      <AppHeader title="Seu planejamento" subtitle="ENCONTRAMOS SEUS DADOS" />
      <AppText variant="heading">Encontramos seu planejamento neste dispositivo.</AppText>
      <AppText muted>{wedding.partner_one_name} & {wedding.partner_two_name} · {wedding.city}</AppText>
      <AppText muted>Você escolhe quando salvar uma cópia na sua conta. Os dados deste aparelho continuam disponíveis mesmo se a conexão falhar.</AppText>
      <ErrorMessage message={action.error} />
      <Button title={action.busy ? "Salvando…" : "Salvar na minha conta"} disabled={action.busy} onPress={() => void save(() => router.replace("/"))} />
      <Button title="Continuar apenas neste dispositivo" secondary disabled={action.busy} onPress={() => void skip(() => router.replace("/"))} />
    </Screen>
  );
}
