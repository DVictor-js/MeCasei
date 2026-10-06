import { router } from "expo-router";
import { APP_NAME } from "@/core/theme/brand";
import { Screen, AppHeader, EmptyState, Button } from "@/shared/components/ui";
export function FoundationScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Screen>
      <AppHeader title={title} subtitle={APP_NAME} />
      <EmptyState
        title="Um espaço para o próximo passo"
        description={description}
      />
      <Button
        secondary
        title="Voltar"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
    </Screen>
  );
}
