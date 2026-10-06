import { ActivityIndicator } from "react-native";
import { Screen, AppText, Button } from "@/shared/components/ui";
import { colors } from "@/core/theme/theme";
export function StartupState({
  error,
  retry,
}: {
  error?: string | null;
  retry?: () => void;
}) {
  return (
    <Screen>
      {error ? (
        <>
          <AppText variant="heading">Vamos tentar novamente</AppText>
          <AppText>{error}</AppText>
          {retry && <Button title="Tentar novamente" onPress={retry} />}
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} />
          <AppText>Preparando seu espaço…</AppText>
        </>
      )}
    </Screen>
  );
}
