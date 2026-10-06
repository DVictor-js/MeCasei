import { FeedbackProvider } from "@/shared/viewmodel/useAction";
import { Suspense } from "react";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DATABASE_NAME } from "@/core/theme/brand";
import { colors } from "@/core/theme/theme";
import { migrate } from "@/core/database/migrate";
import { WeddingProvider } from "@/features/wedding/model/WeddingProvider";
import { SessionProvider } from "@/core/session/SessionProvider";
import { StartupState } from "@/shared/components/StartupState";
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <StartupState
        error="Não foi possível abrir o aplicativo. Seus dados locais foram preservados."
        retry={() => void retry()}
      />
    </SafeAreaProvider>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Suspense fallback={<StartupState />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          onInit={migrate}
          useSuspense
        >
          <FeedbackProvider>
            <WeddingProvider>
              <SessionProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: "slide_from_right",
                  }}
                />
              </SessionProvider>
            </WeddingProvider>
          </FeedbackProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
