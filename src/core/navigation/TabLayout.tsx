import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useWindowDimensions } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/core/theme/theme";
import { useWeddingGateViewModel } from "@/features/wedding/viewmodel/useWeddingGateViewModel";
import { StartupState } from "@/shared/components/StartupState";
const tabs = [
  { name: "index", title: "Início", icon: "sunny-outline" },
  { name: "planejar", title: "Planejar", icon: "checkbox-outline" },
  { name: "convidados", title: "Convidados", icon: "people-outline" },
  { name: "financas", title: "Finanças", icon: "wallet-outline" },
  { name: "mais", title: "Mais", icon: "ellipsis-horizontal" },
] as const;
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const labelSize = width < 360 ? 10 : 11;
  const { configured, loading, error, refresh, session } = useWeddingGateViewModel();
  if (loading || error || session.mode === "loading")
    return <StartupState error={error} retry={() => void refresh()} />;
  if (session.mode === "guest") return <Redirect href="/auth" />;
  if (!configured) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          elevation: 0,
          height: 62 + insets.bottom + Math.max(0, (fontScale - 1) * 26),
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelPosition: "below-icon",
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: ({ color }) => (
              <Text
                style={{
                  color,
                  fontSize: labelSize,
                  textAlign: "center",
                  alignSelf: "stretch",
                  marginHorizontal: 0,
                }}
              >
                {tab.title}
              </Text>
            ),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
