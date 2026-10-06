import { Screen, AppHeader, AppText } from "@/shared/components/ui";
import { APP_NAME, APP_VERSION, APP_TAGLINE } from "@/core/theme/brand";
export default function About() {
  return (
    <Screen>
      <AppHeader title={APP_NAME} subtitle="SOBRE" back />
      <AppText>{APP_TAGLINE}</AppText>
      <AppText muted>
        O planejamento é salvo neste dispositivo e permanece ao fechar e abrir o
        aplicativo. Desinstalar o aplicativo pode remover esses dados. Esta
        versão não sincroniza entre celulares.
      </AppText>
      <AppText variant="caption" muted>
        Versão {APP_VERSION}
      </AppText>
    </Screen>
  );
}
