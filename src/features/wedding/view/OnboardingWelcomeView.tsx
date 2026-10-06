import { router } from "expo-router";
import { Screen, AppText, Button, EmptyState } from "@/shared/components/ui";
import { APP_NAME, APP_TAGLINE } from "@/core/theme/brand";
export default function Welcome() {
  return (
    <Screen>
      <AppText variant="heading">{APP_NAME}</AppText>
      <EmptyState
        icon="heart-outline"
        title="O sim é só o começo."
        description={APP_TAGLINE}
      />
      <AppText variant="display">Um dia de vocês. Um plano a dois.</AppText>
      <AppText muted>
        Menos coisas soltas na cabeça. Mais espaço para viver cada escolha
        juntos.
      </AppText>
      <Button
        title="Vamos começar"
        onPress={() => router.push("/onboarding/casal")}
      />
      <AppText variant="caption" muted>
        Sem contas. Seu planejamento começa neste dispositivo.
      </AppText>
    </Screen>
  );
}
